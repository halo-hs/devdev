import { bankCashStorageKey, type DocumentReviewState } from "./erpDocumentWorkflow"
import { decimalMagnitude, FINANCE_DECIMAL_SCALE } from "./financeDecimal"
import { normalizeDecimalInput } from "./money"

export type DocumentDealLink = { dealId: string; dealLabel: string }
export type DocumentConnection = DocumentReviewState & { link: DocumentDealLink | null }
type Candidate = { id: string; party: string; amount: string; currency: string }
export type CandidateEvidence = { reasons: string[]; ambiguous: boolean; recommended: boolean }
export type MatchFacts = { counterparty: string; amount: string; currency: string }
const reviewKey = (id: string) => `ecoya-prototype-document-review-v2:${id}`
let candidateIds = new Set<string>()

// Preview candidates use exact fixture values. Production reasons come from
// GET /trade/docs/:id/deal-candidates (match.field + matched_value), not a UI score.
export function documentCandidates<T extends Candidate>(deals: T[], facts: MatchFacts): (T & CandidateEvidence)[] {
  candidateIds = new Set(deals.map(deal => deal.id))
  const normalized = (value: string) => value.trim().toLowerCase()
  const amount = decimalMagnitude(normalizeDecimalInput(facts.amount), FINANCE_DECIMAL_SCALE)
  const rows = deals.map(deal => {
    const reasons: string[] = []
    if (facts.counterparty.trim() && normalized(facts.counterparty) === normalized(deal.party)) reasons.push(`거래처 일치 · ${deal.party}`)
    if (facts.currency.trim() && normalized(facts.currency) === normalized(deal.currency) && amount !== null && amount === decimalMagnitude(normalizeDecimalInput(deal.amount), FINANCE_DECIMAL_SCALE)) reasons.push(`금액·통화 일치 · ${deal.amount} ${deal.currency}`)
    return { ...deal, reasons, ambiguous: false, recommended: false }
  })
  const strongest = Math.max(0, ...rows.map(row => row.reasons.length))
  const strongestRows = rows.filter(row => strongest > 0 && row.reasons.length === strongest)
  return rows.map(row => ({ ...row,
    ambiguous: row.reasons.some(reason => rows.filter(other => other.reasons.includes(reason)).length > 1),
    recommended: strongestRows.length === 1 && strongestRows[0].id === row.id,
  })).sort((a, b) => b.reasons.length - a.reasons.length)
}

// Read failures are distinct from an unlinked document. Do not silently fall
// back to the legacy display cache after an accepted unlink/relink.
export function getDocumentConnection(id: string, legacy?: DocumentDealLink): DocumentConnection {
  const raw = localStorage.getItem(reviewKey(id))
  const current: DocumentReviewState = raw ? JSON.parse(raw) : { revision: 1, status: "review", fields: {} }
  if (!Number.isSafeInteger(current.revision) || current.revision < 1 || !current.fields || !["review", "committed"].includes(current.status)) throw new Error("문서 연결 정보를 확인할 수 없습니다.")
  const link = current.connectionKnown || current.dealId
    ? current.dealId ? { dealId: current.dealId, dealLabel: current.dealLabel ?? (legacy?.dealId === current.dealId ? legacy.dealLabel : current.dealId) } : null
    : legacy ?? null
  return { ...current, link }
}

export type ConnectionChangePreview = {
  previewId: string; documentId: string; revision: number
  from: DocumentDealLink; to: DocumentDealLink | null
  expiresAt: number; blockedReason: string | null
}
const previews = new Map<string, ConnectionChangePreview>()
function validateTarget(target: DocumentDealLink | null) {
  if (!target || candidateIds.has(target.dealId)) return
  const created = JSON.parse(localStorage.getItem("ecoya-prototype-created-deals") ?? "[]")
  if (!Array.isArray(created) || !created.some(deal => deal.id === target.dealId)) throw new Error("선택한 거래에 접근할 수 없습니다. 다른 후보를 선택해 주세요.")
}
function hasCashDependency(id: string) {
  const rows = JSON.parse(localStorage.getItem(bankCashStorageKey) ?? "[]")
  if (!Array.isArray(rows)) throw new Error("정산 연결을 확인하지 못했습니다. 다시 확인해 주세요.")
  return rows.some(row => row.sourceDocumentId === id)
}
export function previewConnectionChange(id: string, expectedRevision: number, from: DocumentDealLink, to: DocumentDealLink | null): ConnectionChangePreview {
  validateTarget(to)
  const current = getDocumentConnection(id, from)
  if (!current.link || current.link.dealId !== from.dealId || current.revision !== expectedRevision) throw new Error("연결 정보가 변경되었습니다. 현재 연결을 다시 확인해 주세요.")
  if (from.dealId === to?.dealId) throw new Error("현재 연결과 다른 거래를 선택해 주세요.")
  const preview: ConnectionChangePreview = {
    previewId: crypto.randomUUID(), documentId: id, revision: current.revision, from: current.link, to,
    expiresAt: Date.now() + 5 * 60_000,
    blockedReason: hasCashDependency(id) ? "이 문서로 기록된 정산 내역이 있습니다. 정산 내역을 확인한 뒤 연결을 변경해 주세요." : null,
  }
  previews.set(preview.previewId, preview)
  return preview
}

// Mirrors unlink-preview + DELETE and atomic POST assign-with-reason. A single
// local write updates link + revision + audit. Financial records are never moved
// by the browser. Real AR/AP impact and authorization require the server adapter.
export function changeDocumentConnection(previewId: string, reason: string, evidence: string[]): DocumentConnection {
  const preview = previews.get(previewId)
  if (!preview || preview.expiresAt <= Date.now()) throw new Error("변경 영향 확인이 만료되었습니다. 다시 확인해 주세요.")
  if (!reason.trim()) throw new Error("변경 사유를 입력해 주세요.")
  validateTarget(preview.to)
  const current = getDocumentConnection(preview.documentId, preview.from)
  if (current.revision !== preview.revision || current.link?.dealId !== preview.from.dealId) throw new Error("연결 정보가 변경되었습니다. 현재 연결과 변경 영향을 다시 확인해 주세요.")
  if (preview.blockedReason || hasCashDependency(preview.documentId)) throw new Error("정산 내역이 연결되어 있어 변경하지 못했습니다. 정산에서 먼저 확인해 주세요.")
  const { link, ...stored } = current
  void link // The persisted review omits the computed connection projection.
  const next: DocumentReviewState = {
    ...stored, connectionKnown: true, dealId: preview.to?.dealId, dealLabel: preview.to?.dealLabel,
    status: preview.to ? "committed" : "review", revision: current.revision + 1, idempotencyKey: undefined,
    connectionHistory: [...(current.connectionHistory ?? []), {
      action: preview.to ? "relinked" : "unlinked", fromDealId: preview.from.dealId,
      dealId: preview.to?.dealId, dealLabel: preview.to?.dealLabel,
      actorLabel: "나", occurredAt: new Date().toISOString(), reason: reason.trim(), evidence,
    }],
  }
  localStorage.setItem(reviewKey(preview.documentId), JSON.stringify(next))
  previews.delete(previewId)
  return { ...next, link: preview.to }
}

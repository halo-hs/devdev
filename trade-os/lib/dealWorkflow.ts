import { useMemo, useSyncExternalStore } from "react"
import { deals, type Deal } from "./prototypeDeals"

export type DealWorkKey = "documents" | "fulfillment" | "customs" | "finance"
export type DealWorkState = "planned" | "active" | "complete" | "skipped"
export const dealWorkKeys: DealWorkKey[] = [
  "documents",
  "fulfillment",
  "customs",
  "finance",
]
export const workLabels: Record<DealWorkKey, string> = {
  documents: "계약",
  fulfillment: "선적",
  customs: "통관",
  finance: "정산",
}
export const workIds: Record<DealWorkKey, string> = {
  documents: "deal-documents",
  fulfillment: "deal-fulfillment",
  customs: "deal-customs",
  finance: "deal-finance",
}

export const documentStageRules: Record<string, { work: DealWorkKey; label: string }> = {
  PO: { work: "documents", label: "발주서" },
  SC: { work: "documents", label: "판매계약서" },
  CI: { work: "documents", label: "상업송장" },
  PL: { work: "documents", label: "포장명세서" },
  BL: { work: "fulfillment", label: "선하증권" },
  CUSTOMS_ENTRY: { work: "customs", label: "수입신고필증" },
  CUSTOMS_EXPORT: { work: "customs", label: "수출신고필증" },
}

export const documentStageGuidance: Record<DealWorkKey, string> = {
  documents: "PO·SC·CI·PL 등 계약 문서",
  fulfillment: "B/L 확정 후 시작",
  customs: "수입·수출신고필증 확정 후 시작",
  finance: "정산·원장 정보",
}
export type DealWorkPlan = ReturnType<typeof getDealWorkPlan>

const customsPreferenceEvent = "ecoya:deal-customs-changed"

function subscribeCustoms(listener: () => void) {
  window.addEventListener("storage", listener)
  window.addEventListener(customsPreferenceEvent, listener)
  return () => {
    window.removeEventListener("storage", listener)
    window.removeEventListener(customsPreferenceEvent, listener)
  }
}

function customsKeyPrefix(workspaceId: string) {
  return `ecoya:customs-skipped:${encodeURIComponent(workspaceId)}:`
}

export function useSkippedCustoms(workspaceId: string) {
  const prefix = customsKeyPrefix(workspaceId)
  const snapshot = useSyncExternalStore(subscribeCustoms, () => {
    try {
      return JSON.stringify(Object.keys(localStorage).filter(key => key.startsWith(prefix)).sort())
    } catch {
      return "[]"
    }
  }, () => "[]")
  return useMemo(() => new Set<string>(
    (JSON.parse(snapshot) as string[]).map(key => key.slice(prefix.length))
  ), [snapshot, prefix])
}

export function setCustomsSkipped(workspaceId: string, dealId: string, skipped: boolean) {
  const key = customsKeyPrefix(workspaceId) + dealId
  if (skipped) localStorage.setItem(key, "1")
  else localStorage.removeItem(key)
  window.dispatchEvent(new Event(customsPreferenceEvent))
}

export function applyCustomsPreference(deal: Deal, skipped: boolean): Deal {
  if (!skipped) return deal
  const advance = (deal.nextWork ?? (deal.stage === "customs" ? "customs" : undefined)) === "customs"
  const customsDocument = ["IMPORT_DECLARATION", "EXPORT_DECLARATION", "CUSTOMS_ENTRY", "CUSTOMS_EXPORT"].includes(deal.nextDocument?.templateCode ?? "")
  return {
    ...deal,
    stage: deal.stage === "customs" ? "settlement" : deal.stage,
    nextWork: advance ? "finance" : deal.nextWork,
    nextAction: advance ? "정산 정보 확인" : deal.nextAction,
    nextDocument: customsDocument ? undefined : deal.nextDocument,
  }
}

// Both the body and progress rail consume this adapter. nextWork identifies the
// work behind the existing nextAction; it is independent of the Deal milestone.
export function getDealWorkPlan(
  dealId: string,
  started: DealWorkKey[] = [],
  preferred?: DealWorkKey,
  customsSkipped = false
) {
  const fixture = deals.find((item) => item.id === dealId)
  const deal = fixture && applyCustomsPreference(fixture, customsSkipped)
  const preferredWork = customsSkipped && preferred === "customs" ? "finance" : preferred
  const stageWork: DealWorkKey =
    deal?.stage === "shipment"
      ? "fulfillment"
      : deal?.stage === "customs"
        ? "customs"
        : deal?.stage === "settled" || deal?.stage === "settlement"
          ? "finance"
          : "documents"
  const stageIndex = dealWorkKeys.indexOf(stageWork)
  const allComplete = deal?.stage === "settled"
  const current = allComplete
    ? null
    : (preferredWork ?? deal?.nextWork ?? stageWork)
  const states = Object.fromEntries(
    dealWorkKeys.map((key, index) => [
      key,
      key === "customs" && customsSkipped ? "skipped" : allComplete
        ? "complete"
        : key === current
          ? "active"
          : index < stageIndex
            ? "complete"
            : key === stageWork || started.includes(key)
              ? "active"
              : "planned",
    ])
  ) as Record<DealWorkKey, DealWorkState>
  const rank = (key: DealWorkKey) =>
    key === current
      ? 0
      : states[key] === "active"
        ? 1
        : states[key] === "complete"
          ? 2
          : 3
  return {
    current,
    states,
    order: [...dealWorkKeys].sort((a, b) => rank(a) - rank(b)),
    nextAction:
      preferredWork && preferredWork !== deal?.nextWork
        ? `${workLabels[preferredWork]} 정보 직접 입력`
        : (deal?.nextAction ?? "거래 문서를 연결하고 내용을 확인하세요."),
  }
}

export function readStartedWork(dealId: string): DealWorkKey[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(`ecoya:deal-started-work:v1:${dealId}`) ?? "[]"
    )
    return Array.isArray(value)
      ? dealWorkKeys.filter((key) => value.includes(key))
      : []
  } catch {
    return []
  }
}

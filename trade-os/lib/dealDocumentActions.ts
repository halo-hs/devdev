import { deals } from "./prototypeDeals"

// Local preview adapter. These demo IDs are never sent to the real ERP API.
// Original: PATCH /trade/docs/:id/reclassify, PUT /trade/docs/:id/content,
// POST /trade/deals/:target/documents { document_id, reason }.
export type DealDocumentRecord = {
  id: string
  erpDocumentId: string
  originDealId: string
  originCode: string
  dealId: string | null
  code: string
  type: string
  file: string
  state: "ready" | "needs_review" | "needs_type" | "processing"
  revision: number
  fileDataUrl?: string
}
export const dealDocumentStorageKey = "ecoya-preview-deal-documents-v1"
type Store = { documents: Record<string, DealDocumentRecord>; history: Array<{ documentId: string; action: string; from: string | null; to: string | null; reason: string; at: string }> }
function readStore(strict = false): Store {
  try {
    const saved = localStorage.getItem(dealDocumentStorageKey)
    if (saved) return JSON.parse(saved) as Store
  } catch (error) {
    if (strict) throw error
    /* Keep the initial read-only preview usable when browser storage is blocked. */
  }
  return { documents: {}, history: [] }
}
function seedDocument(dealId: string, slot: typeof importantDealDocuments[number]): DealDocumentRecord {
  return {
    id: `demo-trade-doc:${dealId}:${slot.code}`,
    erpDocumentId: `demo-erp-doc:${dealId}:${slot.code}`,
    originDealId: dealId, originCode: slot.code, dealId,
    code: slot.code, type: slot.type, file: slot.file,
    state: slot.status === "검토" ? "needs_review" : "ready", revision: 1,
  }
}
export function listDealDocuments(dealId: string, strict = false): DealDocumentRecord[] {
  const overrides = readStore(strict).documents
  const seeds = [...importantDealDocuments, ...supplementaryDealDocuments]
    .filter(slot => slot.file && slot.source !== "발행")
    .map(slot => seedDocument(dealId, slot))
  return [...seeds.filter(record => !overrides[record.id]), ...Object.values(overrides)]
    .filter(record => record.dealId === dealId)
}
export function getDealDocument(id: string): DealDocumentRecord | null {
  const stored = readStore().documents[id]
  if (stored) return stored
  const [, dealId, code] = id.split(":")
  if (!id.startsWith("demo-trade-doc:") || !deals.some(deal => deal.id === dealId)) return null
  return listDealDocuments(dealId).find(record => record.originCode === code) ?? null
}
export function dealDocumentReviewUrl(record: DealDocumentRecord) {
  const query = new URLSearchParams({ from: "deal", dealId: record.dealId ?? "", tradeDocId: record.id })
  return `/erp/documents/upload/${encodeURIComponent(record.erpDocumentId)}/review?${query}`
}
export function dealDocumentFromReviewUrl(): DealDocumentRecord | null {
  const query = new URLSearchParams(window.location.search)
  if (query.get("from") !== "deal") return null
  const record = getDealDocument(query.get("tradeDocId") ?? "")
  let pathId: string
  try { pathId = decodeURIComponent(window.location.pathname.split("/")[4] ?? "") } catch { return null }
  return record && record.dealId === query.get("dealId") && record.erpDocumentId === pathId ? record : null
}
export function availableDocumentTypes() {
  // Preview catalog; the production adapter must return active server types.
  return [...importantDealDocuments, ...supplementaryDealDocuments].map(({ code, type }) => ({ code, label: type }))
}
export function availableMoveDeals(sourceId: string) {
  return deals.filter(deal => deal.id !== sourceId)
}
function currentDocument(record: DealDocumentRecord) {
  const current = getDealDocument(record.id)
  if (!current || current.dealId !== record.dealId) throw new Error("서류의 거래 연결이 변경되었습니다. 거래를 다시 열어 확인해 주세요.")
  if (current.revision !== record.revision) throw new Error("서류가 변경되었습니다. 최신 서류를 확인한 뒤 다시 시도해 주세요.")
  return current
}
function saveDocument(current: DealDocumentRecord, next: DealDocumentRecord, action: string, reason = "") {
  const store = readStore()
  store.documents[next.id] = next
  store.history.push({ documentId: next.id, action, from: current.dealId, to: next.dealId, reason, at: new Date().toISOString() })
  // One write preserves both Deal links and their audit record atomically in this demo.
  localStorage.setItem(dealDocumentStorageKey, JSON.stringify(store))
  return next
}
export function reclassifyDealDocument(record: DealDocumentRecord, code: string) {
  const current = currentDocument(record)
  const option = availableDocumentTypes().find(type => type.code === code)
  if (current.state !== "needs_type" || !option) throw new Error("유형 확인이 필요한 서류에서 허용된 유형을 선택해 주세요.")
  return saveDocument(current, { ...current, code, type: option.label, state: "needs_review", revision: current.revision + 1 }, "문서 유형 선택")
}
export async function replaceDealDocument(record: DealDocumentRecord, file: File) {
  const current = currentDocument(record)
  if (current.state === "processing") throw new Error("처리가 끝난 뒤 파일을 교체해 주세요.")
  if ((!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") || !file.size) throw new Error("내용이 있는 PDF 파일을 선택해 주세요.")
  const fileDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("파일을 읽지 못했습니다. 다시 선택해 주세요."))
    reader.readAsDataURL(new Blob([file], { type: "application/pdf" }))
  })
  currentDocument(record) // Recheck after asynchronous file reading.
  return saveDocument(current, { ...current, file: file.name, fileDataUrl, state: current.state === "needs_type" ? "needs_type" : "needs_review", revision: current.revision + 1 }, "파일 교체")
}
export type DocumentMovePreview = { documentId: string; revision: number; sourceId: string; targetId: string; sourceCount: number; targetCount: number }
export function previewDocumentMove(record: DealDocumentRecord, targetId: string): DocumentMovePreview {
  const current = currentDocument(record)
  if (current.state !== "ready" || !current.dealId) throw new Error("원문 검토를 완료한 뒤 이동해 주세요.")
  if (!availableMoveDeals(current.dealId).some(deal => deal.id === targetId)) throw new Error("이동할 수 있는 거래를 선택해 주세요.")
  return { documentId: current.id, revision: current.revision, sourceId: current.dealId, targetId, sourceCount: listDealDocuments(current.dealId).length, targetCount: listDealDocuments(targetId).length }
}
export function moveDealDocument(record: DealDocumentRecord, preview: DocumentMovePreview, reason: string) {
  const current = currentDocument(record)
  const latest = previewDocumentMove(current, preview.targetId)
  if (!reason.trim()) throw new Error("이동 사유를 입력해 주세요.")
  if (JSON.stringify(latest) !== JSON.stringify(preview)) throw new Error("거래 서류가 변경되었습니다. 이동 영향을 다시 확인해 주세요.")
  return saveDocument(current, { ...current, dealId: preview.targetId, revision: current.revision + 1 }, "다른 거래로 이동", reason.trim())
}
export function completeDealDocumentReview(record: DealDocumentRecord) {
  const current = currentDocument(record)
  if (current.state !== "needs_review") throw new Error("현재 서류 상태를 다시 확인해 주세요.")
  return saveDocument(current, { ...current, state: "ready", revision: current.revision + 1 }, "원문 검토 완료")
}

export const importantDealDocuments = [
  {
    code: "PO",
    type: "발주서",
    file: "PO-260704-18.pdf",
    status: "보유",
    source: "수신",
  },
  {
    code: "SC",
    type: "판매계약서",
    file: "SC-2026-0708.pdf",
    status: "발행",
    source: "발행",
  },
  {
    code: "CI",
    type: "상업송장",
    file: "Invoice_HB-2607-003.pdf",
    status: "보유",
    source: "수신",
  },
  {
    code: "PL",
    type: "포장명세서",
    file: "PackingList_0707.pdf",
    status: "보유",
    source: "수신",
  },
  { code: "BL", type: "선하증권", file: "", status: "미비", source: "-" },
]

export const supplementaryDealDocuments = [
  {
    code: "CO",
    type: "원산지증명서",
    file: "Certificate_Origin_0708.pdf",
    status: "보유",
    source: "수신",
  },
  {
    code: "IC",
    type: "보험증권",
    file: "Cargo_Insurance_0708.pdf",
    status: "보유",
    source: "수신",
  },
  {
    code: "QC",
    type: "검사성적서",
    file: "Inspection_Report_0706.pdf",
    status: "검토",
    source: "업로드",
  },
]

export const dealDocumentPreviews: Record<
  string,
  { title: string; fields: [string, string][] }
> = {
  PO: {
    title: "PURCHASE ORDER",
    fields: [
      ["Buyer", "ECOYA Demo Co."],
      ["Seller", "KATAMAN ASIA-PACIFIC PTE LTD"],
      ["Amount", "2,400,000 USD"],
      ["Incoterms", "CIF Incheon"],
    ],
  },
  SC: {
    title: "SALES CONTRACT",
    fields: [
      ["Contract No.", "SC-2026-0708"],
      ["Buyer", "ECOYA Demo Co."],
      ["Seller", "KATAMAN ASIA-PACIFIC PTE LTD"],
      ["Payment", "T/T 30 days"],
    ],
  },
  CI: {
    title: "COMMERCIAL INVOICE",
    fields: [
      ["Invoice No.", "INV-2026-0703"],
      ["Buyer", "HRM Corporation"],
      ["Amount", "2,566,000 USD"],
      ["Payment", "T/T 30 days"],
    ],
  },
  PL: {
    title: "PACKING LIST",
    fields: [
      ["Packing No.", "PL-2026-0707"],
      ["Quantity", "16 MT"],
      ["Packages", "20 bundles"],
      ["Gross Weight", "16,480 KG"],
    ],
  },
  CO: {
    title: "CERTIFICATE OF ORIGIN",
    fields: [
      ["Exporter", "KATAMAN ASIA-PACIFIC PTE LTD"],
      ["Country", "Singapore"],
      ["Goods", "Aluminium Scrap"],
      ["Reference", "CO-2026-0708"],
    ],
  },
  IC: {
    title: "CARGO INSURANCE",
    fields: [
      ["Insured", "ECOYA Demo Co."],
      ["Vessel", "HMM Green"],
      ["Coverage", "2,400,000 USD"],
      ["Policy", "IC-2026-0708"],
    ],
  },
  QC: {
    title: "INSPECTION REPORT",
    fields: [
      ["Inspector", "SGS Singapore"],
      ["Goods", "Aluminium Scrap"],
      ["Quantity", "16 MT"],
      ["Result", "Review required"],
    ],
  },
}

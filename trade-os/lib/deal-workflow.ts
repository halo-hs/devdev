import { deals } from "./prototype-deals"

export type DealWorkKey = "documents" | "fulfillment" | "customs" | "finance"
export type DealWorkState = "planned" | "active" | "complete"
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
export type DealWorkPlan = ReturnType<typeof getDealWorkPlan>

// Both the body and progress rail consume this adapter. nextWork identifies the
// work behind the existing nextAction; it is independent of the Deal milestone.
export function getDealWorkPlan(
  dealId: string,
  started: DealWorkKey[] = [],
  preferred?: DealWorkKey
) {
  const deal = deals.find((item) => item.id === dealId)
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
    : (preferred ?? deal?.nextWork ?? stageWork)
  const states = Object.fromEntries(
    dealWorkKeys.map((key, index) => [
      key,
      allComplete
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
      preferred && preferred !== deal?.nextWork
        ? `${workLabels[preferred]} 정보 직접 입력`
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

/** Preview persistence boundary. Production must supply server-verified projections/receipts. */
export type GuideItem = "C1" | "C2" | "T1" | "T2" | "T3" | "T4"
export type GuideRole = "owner" | "admin" | "member"
export type GuideState = {
  version: 1
  access?: "active" | "read-only" | "revoked"
  common: Partial<Record<"C1" | "C2", string>>
  trade: Partial<Record<"T1" | "T2" | "T3" | "T4", string>>
  anchor?: {
    documentId: string
    stage: "processing" | "ready" | "failed"
    dealId?: string
  }
}
export type GuideEvent =
  | { type: "upload-started"; documentId: string }
  | { type: "education"; item: "C1" | "C2"; receipt: string }
  | { type: "document-created"; documentId: string; receipt: string }
  | { type: "extraction"; documentId: string; stage: "ready" | "failed" }
  | { type: "reviewed"; documentId: string; receipt: string }
  | { type: "linked"; documentId: string; dealId: string; receipt: string }
  | {
      type: "answer-confirmed"
      dealId: string
      answerId: string
      sourceDealIds: string[]
      receipt: string
    }
export const freshGuide = (): GuideState => ({
  version: 1,
  common: {},
  trade: {},
})
export function applicableItems(role: GuideRole): GuideItem[] {
  return role === "member"
    ? ["T1", "T2", "T3", "T4"]
    : ["C1", "C2", "T1", "T2", "T3", "T4"]
}
export function isDone(state: GuideState, item: GuideItem) {
  return Boolean({ ...state.common, ...state.trade }[item])
}
export function applyGuideEvent(
  state: GuideState,
  event: GuideEvent
): GuideState {
  if (state.access && state.access !== "active") return state
  if ("receipt" in event && !event.receipt.trim()) return state
  if (event.type === "education")
    return {
      ...state,
      common: {
        ...state.common,
        [event.item]: state.common[event.item] || event.receipt,
      },
    }
  if (event.type === "upload-started")
    return state.anchor || !event.documentId
      ? state
      : {
          ...state,
          anchor: { documentId: event.documentId, stage: "processing" },
        }
  if (event.type === "document-created") {
    if (
      (state.anchor && state.anchor.documentId !== event.documentId) ||
      !event.documentId ||
      state.trade.T1
    )
      return state
    return {
      ...state,
      anchor: { documentId: event.documentId, stage: "processing" },
      trade: { ...state.trade, T1: event.receipt },
    }
  }
  if (!state.anchor) return state
  if (event.type === "answer-confirmed") {
    if (
      !state.trade.T3 ||
      !event.answerId ||
      event.dealId !== state.anchor.dealId ||
      !event.sourceDealIds.length ||
      event.sourceDealIds.some((id) => id !== event.dealId)
    )
      return state
    return {
      ...state,
      trade: { ...state.trade, T4: state.trade.T4 || event.receipt },
    }
  }
  if (event.documentId !== state.anchor.documentId) return state
  if (event.type === "extraction")
    return { ...state, anchor: { ...state.anchor, stage: event.stage } }
  if (!state.trade.T1) return state
  if (event.type === "reviewed" && state.anchor.stage === "ready")
    return {
      ...state,
      trade: { ...state.trade, T2: state.trade.T2 || event.receipt },
    }
  if (
    event.type === "linked" &&
    state.trade.T2 &&
    event.dealId &&
    (!state.anchor.dealId || state.anchor.dealId === event.dealId)
  )
    return {
      ...state,
      anchor: { ...state.anchor, dealId: event.dealId },
      trade: { ...state.trade, T3: state.trade.T3 || event.receipt },
    }
  return state
}
export function parseGuide(raw: string | null): GuideState {
  if (raw === null) return freshGuide()
  const value: unknown = JSON.parse(raw)
  if (!value || typeof value !== "object") throw Error("Invalid guide state")
  const state = value as GuideState
  if (
    state.version !== 1 ||
    !state.common ||
    !state.trade ||
    Object.values({ ...state.common, ...state.trade }).some(
      (v) => typeof v !== "string" || !v
    )
  )
    throw Error("Invalid guide state")
  if (
    state.access &&
    !["active", "read-only", "revoked"].includes(state.access)
  )
    throw Error("Invalid guide access")
  if (
    state.anchor &&
    (!state.anchor.documentId ||
      !["processing", "ready", "failed"].includes(state.anchor.stage))
  )
    throw Error("Invalid guide anchor")
  if (
    (state.trade.T1 && !state.anchor) ||
    (state.trade.T2 && !state.trade.T1) ||
    (state.trade.T3 && (!state.trade.T2 || !state.anchor?.dealId)) ||
    (state.trade.T4 && !state.trade.T3)
  )
    throw Error("Invalid guide lineage")
  return state
}

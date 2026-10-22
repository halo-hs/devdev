// Fields exposed by the original generatedDocuments API. Local edit counters
// and the current preview role are not saved revision/editor evidence.
export type GeneratedDocumentMetadata = {
  status?: "draft" | "confirmed" | "sent"
  revision?: number | null
  updated_at?: string | null
  updated_by_display_name?: string | null
  updated_by_account_id?: string | null
}

export function generatedDocumentStatusLabel(
  status: GeneratedDocumentMetadata["status"],
  confirmed: boolean,
) {
  if (status === "sent") return "발송됨"
  if (status === "confirmed" || confirmed) return "확정"
  return "작성 중"
}

export function generatedDocumentSaveDetails(metadata: GeneratedDocumentMetadata | null) {
  const revision = metadata?.revision
  return {
    version: typeof revision === "number" && Number.isInteger(revision) && revision > 0
      ? `문서 버전 v${revision}`
      : "버전 정보 없음",
    modifier: metadata?.updated_by_display_name?.trim()
      || metadata?.updated_by_account_id?.trim()
      || "수정자 정보 없음",
  }
}

export function formatDocumentSavedAt(value: string | null) {
  if (!value) return null
  // Existing prototype rows use display labels; API timestamps are ISO strings.
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(date)
}

export const generatedDocumentListStages = [
  { value: "draft", label: "작성 중", tone: "warning" },
  { value: "pending", label: "승인 대기", tone: "warning" },
  { value: "rejected", label: "반려", tone: "danger" },
  { value: "approved", label: "승인 완료", tone: "success" },
  { value: "confirmed", label: "확정", tone: "success" },
  { value: "sent", label: "발송됨", tone: "success" },
] as const

type DocumentListState = {
  status: "draft" | "confirmed" | "sent"
  approvalStatus: "none" | "pending" | "approved" | "rejected"
}

// A list label projects the current step; it never changes the stored states.
export function getGeneratedDocumentListStage({ status, approvalStatus }: DocumentListState) {
  const value = status === "draft" && approvalStatus !== "none"
    ? approvalStatus
    : status
  return generatedDocumentListStages.find((stage) => stage.value === value)!
}

// 목록 탭은 서버 업무 상태(draft/confirmed/sent) 기준 4개. 승인 대기·반려·승인 완료는
// 탭이 아니라 `작성 중` 탭 안의 상태 배지·보조 설명으로만 보인다.
export const generatedDocumentListTabs = [
  { value: "all", label: "전체" },
  { value: "draft", label: "작성 중" },
  { value: "confirmed", label: "확정" },
  { value: "sent", label: "발송됨" },
] as const

export function getGeneratedDocumentListTab(status: DocumentListState["status"]) {
  return status
}

// 수정 시각은 항상 연도를 포함한 `YYYY.MM.DD HH:mm`로 표시한다 (Trade OS 공통 계약).
export function formatDocumentUpdatedAt(date: Date = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}.${p(date.getMonth() + 1)}.${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`
}

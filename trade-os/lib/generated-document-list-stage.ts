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

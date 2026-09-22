export type NotificationCategory =
  "risk" | "approval" | "document" | "settlement"

export type NotificationDealTarget = {
  tab: "overview" | "documents" | "fulfillment" | "customs" | "finance"
  sectionId:
    | "deal-verification"
    | "deal-documents"
    | "deal-fulfillment"
    | "deal-customs"
    | "deal-finance"
}

export type NotificationItem = {
  id: number
  title: string
  description: string
  context: string
  occurredAt: string
  dateGroup: "오늘" | "어제" | "이번 주"
  dealId: string
  category: NotificationCategory
  unread: boolean
  actionLabel: string
  target: NotificationDealTarget
}

export const notifications: readonly NotificationItem[] = [
  {
    id: 1,
    title: "B/L 수량 불일치를 확인해주세요",
    description: "B/L 20 MT와 인보이스 18.5 MT가 일치하지 않습니다.",
    context: "7월 알루미늄 스크랩 수입",
    occurredAt: "8분 전",
    dateGroup: "오늘",
    dealId: "DL-260708-01",
    category: "risk",
    unread: true,
    actionLabel: "검증·건전성 보기",
    target: { tab: "overview", sectionId: "deal-verification" },
  },
  {
    id: 2,
    title: "판매계약서 승인 요청이 도착했습니다",
    description: "김민지 님이 최종본 확인과 승인을 요청했습니다.",
    context: "ACME 7월 해상운송 계약",
    occurredAt: "24분 전",
    dateGroup: "오늘",
    dealId: "DL-260707-04",
    category: "approval",
    unread: true,
    actionLabel: "승인 문서 열기",
    target: { tab: "documents", sectionId: "deal-documents" },
  },
  {
    id: 3,
    title: "수입신고필증 업로드가 필요합니다",
    description: "통관 완료 처리를 위해 수입신고필증을 추가해주세요.",
    context: "부산항 산업재 수입",
    occurredAt: "1시간 전",
    dateGroup: "오늘",
    dealId: "DL-260704-02",
    category: "document",
    unread: true,
    actionLabel: "필수 서류 열기",
    target: { tab: "documents", sectionId: "deal-documents" },
  },
  {
    id: 4,
    title: "내일 지급 예정인 정산이 있습니다",
    description: "지급 잔액 28,000.00 USD와 은행 수수료를 확인해주세요.",
    context: "일본 내륙운송 발주",
    occurredAt: "어제 오후 4:20",
    dateGroup: "어제",
    dealId: "DL-260625-07",
    category: "settlement",
    unread: false,
    actionLabel: "지급 금액 보기",
    target: { tab: "finance", sectionId: "deal-finance" },
  },
  {
    id: 5,
    title: "거래 문서 검토가 완료되었습니다",
    description: "필수 필드 19개가 확인되어 거래 연결을 진행할 수 있습니다.",
    context: "한빛 6월 정산 거래",
    occurredAt: "어제 오전 11:05",
    dateGroup: "어제",
    dealId: "DL-260701-09",
    category: "document",
    unread: false,
    actionLabel: "검토 문서 열기",
    target: { tab: "documents", sectionId: "deal-documents" },
  },
  {
    id: 6,
    title: "선적 지연 위험이 해소되었습니다",
    description: "포워더가 변경 ETA를 확정해 운영 감시 항목이 종료되었습니다.",
    context: "싱가포르 구리 스크랩 매입",
    occurredAt: "8월 22일",
    dateGroup: "이번 주",
    dealId: "DL-260629-03",
    category: "risk",
    unread: false,
    actionLabel: "선적 상태 보기",
    target: { tab: "fulfillment", sectionId: "deal-fulfillment" },
  },
] as const

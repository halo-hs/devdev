import { statusPreviewDeals } from "./deal-status-fixtures"
// Shared local fixtures used by the deal list and AI business queries.
export type DealStage = "contract" | "shipment" | "customs" | "settlement" | "settled"
export type DealRisk =
  "amount" | "schedule" | "payment" | "quantity" | "currency"
export type Deal = {
  id: string
  title: string
  counterparty: string
  primaryItem: string
  itemCount: number
  orderLifecycle?: "open" | "closed" | "cancelled"
  stage: DealStage
  assignee: string
  amount: string
  currency: string
  dday: string
  eta: string
  pending: number
  confirmed: number
  risks: DealRisk[]
  nextWork?: "documents" | "fulfillment" | "customs" | "finance"
  nextAction: string
  nextKind: "upload" | "create" | "confirm" | "deliver" | "reconcile"
  remaining?: string
  overdue?: boolean
  shared?: boolean
}

export const deals: Deal[] = [
  ...statusPreviewDeals,
  {
    id: "DL-260708-01",
    title: "7월 알루미늄 스크랩 수입",
    counterparty: "KATAMAN ASIA-PACIFIC PTE LTD",
    primaryItem: "알루미늄 스크랩",
    itemCount: 2,
    orderLifecycle: "open",
    stage: "shipment",
    assignee: "조민영",
    amount: "2,400,000",
    currency: "USD",
    dday: "D-3",
    eta: "2026.08.03",
    pending: 2,
    confirmed: 5,
    risks: ["quantity", "amount"],
    nextWork: "fulfillment" as const,
    nextAction: "B/L 중량을 포장명세와 대조",
    nextKind: "reconcile",
    remaining: "4 MT",
  },
  {
    id: "DL-260707-04",
    title: "ACME 7월 해상운송 계약",
    counterparty: "ACME GmbH",
    primaryItem: "해상운송 서비스",
    itemCount: 1,
    orderLifecycle: "open",
    stage: "contract",
    assignee: "나",
    amount: "380,000",
    currency: "USD",
    dday: "D-8",
    eta: "2026.08.11",
    pending: 1,
    confirmed: 3,
    risks: [],
    nextWork: "documents" as const,
    nextAction: "판매계약서 승인 요청",
    nextKind: "confirm",
  },
  {
    id: "DL-260704-02",
    title: "부산항 산업재 수입",
    counterparty: "Nordic Raw Materials AB",
    primaryItem: "산업용 원자재",
    itemCount: 2,
    orderLifecycle: "open",
    stage: "customs",
    assignee: "미배정",
    amount: "940,000",
    currency: "EUR",
    dday: "D-1",
    eta: "2026.07.18",
    pending: 3,
    confirmed: 7,
    risks: ["schedule"],
    nextWork: "customs" as const,
    nextAction: "수입신고필증 업로드",
    nextKind: "upload",
    shared: true,
  },
  {
    id: "DL-260701-09",
    title: "한빛 6월 정산 거래",
    counterparty: "Hanbit Trading Co.",
    primaryItem: "알루미늄 코일",
    itemCount: 3,
    orderLifecycle: "open",
    stage: "settled",
    assignee: "박서윤",
    amount: "126,800,000",
    currency: "KRW",
    dday: "완료",
    eta: "2026.07.02",
    pending: 0,
    confirmed: 9,
    risks: [],
    nextWork: "finance" as const,
    nextAction: "정산 완료",
    nextKind: "deliver",
  },
  {
    id: "DL-260629-03",
    title: "싱가포르 구리 스크랩 매입",
    counterparty: "Meridian Metals Pte Ltd",
    primaryItem: "구리 스크랩",
    itemCount: 2,
    orderLifecycle: "open",
    stage: "settlement",
    assignee: "김도현",
    amount: "1,180,000",
    currency: "USD",
    dday: "D+2",
    eta: "2026.07.09",
    pending: 1,
    confirmed: 6,
    risks: ["payment", "currency"],
    nextWork: "finance" as const,
    nextAction: "지연된 결제 일정 확인",
    nextKind: "reconcile",
    overdue: true,
    remaining: "8 MT",
  },
  {
    id: "DL-260625-07",
    title: "일본 내륙운송 발주",
    counterparty: "Sakura Logistics KK",
    primaryItem: "일본 내륙운송 서비스",
    itemCount: 1,
    orderLifecycle: "open",
    stage: "contract",
    assignee: "나",
    amount: "18,600,000",
    currency: "JPY",
    dday: "D-14",
    eta: "2026.08.20",
    pending: 0,
    confirmed: 2,
    risks: [],
    nextWork: "documents" as const,
    nextAction: "발주서 만들기",
    nextKind: "create",
  },
  ...[
    {
      id: "DL-260801-01",
      title: "Pacific 재생 플라스틱 수출",
      counterparty: "Pacific Recycling Pte Ltd",
      primaryItem: "재생 플라스틱",
      currency: "SGD",
      amount: "36,000",
      remaining: "10 MT",
    },
    {
      id: "DL-260802-02",
      title: "Baltic 철강재 수출",
      counterparty: "Baltic Steel GmbH",
      primaryItem: "철강재",
      currency: "EUR",
      amount: "48,000",
      remaining: "2 PCS",
    },
    {
      id: "DL-260803-03",
      title: "Delta 비철금속 수출",
      counterparty: "Delta Resources Ltd",
      primaryItem: "비철금속",
      currency: "USD",
      amount: "25,000",
      remaining: "0.5 MT",
    },
  ].map((item) => ({
    ...item,
    itemCount: 1,
    orderLifecycle: "open" as const,
    stage: "shipment" as const,
    assignee: "조민영",
    dday: "D-2",
    eta: "2026.08.12",
    pending: 1,
    confirmed: 3,
    risks: ["quantity" as const],
    nextWork: "fulfillment" as const,
    nextAction: "선적 서류와 수량 확인",
    nextKind: "reconcile" as const,
  })),
]

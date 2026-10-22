// Deterministic local demo data; no production records or verification results.
export type SampleTone = "green" | "amber" | "red" | "blue" | "neutral"
export type ShipmentReviewSample = {
  filename: string
  sourceEtd: string
  sourceEta: string
  reason: string
  code:
    | "invalid_dates"
    | "awaiting_projection"
    | "tracking_conflict"
    | "snap_conflict"
    | "source_inactive"
    | "current"
  invalidField?: "etd" | "eta"
}
export const shipmentReviewSamples: Record<string, ShipmentReviewSample> = {
  HMM014W2607: {
    filename: "BL_HMM014W2607.pdf",
    sourceEtd: "2026-07-20",
    sourceEta: "2026-08-32",
    reason: "원문 ETA 날짜 오류",
    code: "invalid_dates",
    invalidField: "eta",
  },
  COS26070134: {
    filename: "BL_COS26070134.pdf",
    sourceEtd: "2026-07-01",
    sourceEta: "2026-07-06",
    reason: "운영 정보 반영 완료",
    code: "current",
  },
  MAEU26070481: {
    filename: "BL_MAEU26070481.pdf",
    sourceEtd: "2026-07-04",
    sourceEta: "2026-07-18",
    reason: "확정 B/L 최초 반영 대기",
    code: "awaiting_projection",
  },
  MAEU26070496: {
    filename: "BL_MAEU26070496_R2.pdf",
    sourceEtd: "2026-07-04",
    sourceEta: "2026-07-21",
    reason: "정정 B/L의 변경 일정 반영 대기",
    code: "awaiting_projection",
  },
  CMDU26062541: {
    filename: "BL_CMDU26062541.pdf",
    sourceEtd: "2026-06-31",
    sourceEta: "2026-07-16",
    reason: "원문 ETD 날짜 오류",
    code: "invalid_dates",
    invalidField: "etd",
  },
  ONEY26062973: {
    filename: "BL_ONEY26062973_R2.pdf",
    sourceEtd: "2026-06-29",
    sourceEta: "2026-07-19",
    reason: "추적 중인 컨테이너 번호와 불일치",
    code: "tracking_conflict",
  },
  ONEY26062988: {
    filename: "BL_ONEY26062988.pdf",
    sourceEtd: "2026-06-29",
    sourceEta: "2026-07-19",
    reason: "SNAP 증거의 거래 연결과 불일치",
    code: "snap_conflict",
  },
  HLCU26071125: {
    filename: "BL_HLCU26071125.pdf",
    sourceEtd: "2026-07-11",
    sourceEta: "2026-07-28",
    reason: "원문 확정 취소 · 재확인 필요",
    code: "source_inactive",
  },
  HLCU26071139: {
    filename: "BL_HLCU26071139.pdf",
    sourceEtd: "2026-07-11",
    sourceEta: "2026-07-28",
    reason: "운영 날짜 확인 후 반영 완료",
    code: "current",
  },
  NYKS26071307: {
    filename: "BL_NYKS26071307.pdf",
    sourceEtd: "2026-07-13",
    sourceEta: "2026-07-17",
    reason: "이전 반영 실패 · 재반영 대기",
    code: "awaiting_projection",
  },
}

export const settlementSampleStates: Record<
  string,
  { label: string; detail: string; tone: SampleTone }
> = {
  "AR-260715-01": {
    label: "부분 대사",
    detail: "입금 40,000 USD 확인 · 잔여 청구 42,000 USD 검토",
    tone: "amber",
  },
  "AP-260716-01": {
    label: "검증 완료",
    detail: "청구서·지급 예정액 일치 · 지급 전",
    tone: "green",
  },
  "AP-260710-01": {
    label: "정산 완료",
    detail: "예정액·실제 지급·적용액 일치",
    tone: "green",
  },
  "AR-260628-02": {
    label: "정산 대상 아님",
    detail: "청구·입출금 없이 거래 취소",
    tone: "neutral",
  },
  "AR-260801-01": {
    label: "원천 미연결",
    detail: "수취 예정에 연결할 확정 CI 필요",
    tone: "amber",
  },
  "AP-260802-01": {
    label: "통화 불일치",
    detail: "JPY 청구에 USD 입금 기록 연결 · 통화 재검토",
    tone: "red",
  },
  "AR-260803-01": {
    label: "미배분 입금",
    detail: "입금 12,000 SGD의 청구별 배분 필요",
    tone: "blue",
  },
  "AP-260804-01": {
    label: "추가 비용 확인",
    detail: "운임 정산 완료 · 항만 수수료 미입력",
    tone: "amber",
  },
  "AR-260805-01": {
    label: "기한 경과",
    detail: "원천 검증 완료 · 지급기한 5일 경과",
    tone: "red",
  },
  "AR-260806-01": {
    label: "초과 입금",
    detail: "청구보다 500 USD 초과 · 환급 또는 차기 배분 검토",
    tone: "blue",
  },
}

export const additionalLedgerSamples = [
  {
    id: "AR-260801-01",
    party: "Meridian Metals Pte Ltd",
    type: "AR",
    amount: "54,000 USD",
    paid: "0 USD",
    balance: "54,000 USD",
    due: "08.01",
    status: "미정산",
    requiredObligations: 1,
    dealState: "진행",
    readOnly: false,
    deal: "DL-260629-03",
  },
  {
    id: "AP-260802-01",
    party: "Sakura Logistics KK",
    type: "AP",
    amount: "1,860,000 JPY",
    paid: "0 JPY",
    balance: "1,860,000 JPY",
    due: "08.02",
    status: "미정산",
    requiredObligations: 1,
    dealState: "진행",
    readOnly: false,
    deal: "DL-260625-07",
  },
  {
    id: "AR-260803-01",
    party: "Pacific Recycling Pte Ltd",
    type: "AR",
    amount: "36,000 SGD",
    paid: "0 SGD",
    balance: "36,000 SGD",
    due: "08.03",
    status: "미정산",
    requiredObligations: 1,
    dealState: "진행",
    readOnly: false,
    deal: "DL-260801-01",
  },
  {
    id: "AP-260804-01",
    party: "Hanbit Trading Co.",
    type: "AP",
    amount: "12,680,000 KRW",
    paid: "12,680,000 KRW",
    balance: "0 KRW",
    due: "08.04",
    status: "확인 필요",
    requiredObligations: 1,
    dealState: "진행",
    readOnly: false,
    deal: "DL-260701-09",
  },
  {
    id: "AR-260805-01",
    party: "Baltic Steel GmbH",
    type: "AR",
    amount: "48,000 EUR",
    paid: "18,000 EUR",
    balance: "30,000 EUR",
    due: "08.05",
    status: "미정산",
    requiredObligations: 1,
    dealState: "진행",
    readOnly: false,
    deal: "DL-260802-02",
  },
  {
    id: "AR-260806-01",
    party: "Delta Resources Ltd",
    type: "AR",
    amount: "25,000 USD",
    paid: "25,500 USD",
    balance: "0 USD",
    due: "08.06",
    status: "확인 필요",
    requiredObligations: 1,
    dealState: "진행",
    readOnly: false,
    deal: "DL-260803-03",
  },
]

export const monitoringSamples = [
  {
    id: "gap-1",
    category: "gap",
    dealId: "DL-260708-01",
    label: "7월 알루미늄 스크랩 수입",
    detail: "ONE26070819 · ETA 07.15 · B/L 누락",
    status: "도착 임박",
    tone: "amber",
  },
  {
    id: "gap-2",
    category: "gap",
    dealId: "DL-260701-04",
    label: "6월 재활용 원자재 수입",
    detail: "MSC26062077 · ETA 07.08 · B/L·증거 없음",
    status: "지연",
    tone: "red",
  },
  {
    id: "gap-3",
    category: "gap",
    dealId: "DL-260801-01",
    label: "Pacific 재생 플라스틱 수출",
    detail: "ETA 08.12 · 패킹리스트 미접수",
    status: "서류 요청",
    tone: "amber",
  },
  {
    id: "gap-4",
    category: "gap",
    dealId: "DL-260802-02",
    label: "Baltic 철강재 수출",
    detail: "ETA 08.11 · CI와 선적 연결 필요",
    status: "연결 필요",
    tone: "blue",
  },
  {
    id: "remaining-1",
    category: "remaining",
    dealId: "DL-260708-01",
    label: "KATAMAN ASIA-PACIFIC PTE LTD",
    detail: "계약 24 MT · 선적 20 MT · 잔량 4 MT",
    status: "부분 선적",
    tone: "blue",
  },
  {
    id: "remaining-2",
    category: "remaining",
    dealId: "DL-260629-03",
    label: "Meridian Metals Pte Ltd",
    detail: "계약 40 MT · 선적 32 MT · 잔량 8 MT",
    status: "추가 선적 대기",
    tone: "amber",
  },
  {
    id: "remaining-3",
    category: "remaining",
    dealId: "DL-260803-03",
    label: "Delta Resources Ltd",
    detail: "계약 100 MT · 선적 99.5 MT · 잔량 0.5 MT",
    status: "잔량 처리 검토",
    tone: "amber",
  },
  {
    id: "quantity-1",
    category: "quantity",
    dealId: "DL-260708-01",
    label: "KATAMAN ASIA-PACIFIC PTE LTD",
    detail: "B/L 20 MT · 포장명세 19.8 MT · 차이 0.2 MT",
    status: "중량 불일치",
    tone: "red",
  },
  {
    id: "quantity-2",
    category: "quantity",
    dealId: "DL-260802-02",
    label: "Baltic Steel GmbH",
    detail: "PO 100 PCS · CI 102 PCS · 차이 2 PCS",
    status: "청구 수량 초과",
    tone: "red",
  },
  {
    id: "quantity-3",
    category: "quantity",
    dealId: "DL-260801-01",
    label: "Pacific Recycling Pte Ltd",
    detail: "PO 50 MT · B/L 50,000 KG · 단위 환산 확인",
    status: "단위 확인",
    tone: "amber",
  },
] satisfies {
  id: string
  category: string
  dealId: string
  label: string
  detail: string
  status: string
  tone: SampleTone
}[]

export const claimSamples = [
  {
    id: "CI-260801-01",
    party: "ACME GmbH",
    owner: "조민영",
    currency: "USD",
    amount: 82000,
    direction: "수취",
    due: "08.15",
    schedule: "AR-260715-01",
    status: "일정 연결됨",
    tone: "green",
  },
  {
    id: "CI-260801-02",
    party: "KATAMAN ASIA-PACIFIC",
    owner: "김민지",
    currency: "USD",
    amount: 120000,
    direction: "지급",
    due: "08.16",
    schedule: "AP-260716-01",
    status: "일정 연결됨",
    tone: "green",
  },
  {
    id: "CI-260801-03",
    party: "Meridian Metals Pte Ltd",
    owner: "조민영",
    currency: "USD",
    amount: 54000,
    direction: "수취",
    due: "08.20",
    schedule: "—",
    status: "일정 검토 필요",
    tone: "amber",
  },
  {
    id: "CI-260801-04",
    party: "Delta Resources Ltd",
    owner: "김민지",
    currency: "USD",
    amount: 25000,
    direction: "수취",
    due: "미정",
    schedule: "—",
    status: "지급기한 미정",
    tone: "amber",
  },
  {
    id: "CI-260801-05",
    party: "HMM Green",
    owner: "조민영",
    currency: "USD",
    amount: 8200,
    direction: "지급",
    due: "08.10",
    schedule: "AP-260710-01",
    status: "정산 완료",
    tone: "green",
  },
  {
    id: "CI-260801-06",
    party: "Nordic Raw Materials AB",
    owner: "김민지",
    currency: "USD",
    amount: 18000,
    direction: "수취",
    due: "08.18",
    schedule: "보류",
    status: "비활성 거래",
    tone: "neutral",
  },
  {
    id: "CI-260801-07",
    party: "Ocean Freight Co.",
    owner: "조민영",
    currency: "USD",
    amount: null,
    direction: "지급",
    due: "08.22",
    schedule: "—",
    status: "원문 금액 검토",
    tone: "red",
  },
  {
    id: "CI-260801-08-R2",
    party: "Blue Harbor Trading",
    owner: "김민지",
    currency: "USD",
    amount: 42000,
    direction: "수취",
    due: "08.25",
    schedule: "AR-260825-01",
    status: "원문 개정 재검토",
    tone: "amber",
  },
  {
    id: "CI-260801-09",
    party: "Eastport Metals",
    owner: "조민영",
    currency: "USD",
    amount: 31000,
    direction: "미정",
    due: "08.28",
    schedule: "—",
    status: "거래 방향 미정",
    tone: "red",
  },
  {
    id: "원천 미연결",
    party: "Silverline Materials",
    owner: "김민지",
    currency: "USD",
    amount: null,
    direction: "수취",
    due: "08.30",
    schedule: "AR-260830-01",
    status: "원천 연결 없는 일정",
    tone: "red",
  },
] satisfies {
  id: string
  party: string
  owner: string
  currency: string
  amount: number | null
  direction: string
  due: string
  schedule: string
  status: string
  tone: SampleTone
}[]

const customerCases = [
  ["ACME GmbH", "조민영", 139420, 42000, 42000, 22400, 3, "연체"],
  ["KATAMAN ASIA-PACIFIC", "김민지", 240000, 60000, 0, 38400, 4, "정상"],
  [
    "Meridian Metals Pte Ltd",
    "조민영",
    118000,
    54000,
    12000,
    10620,
    2,
    "부분 입금",
  ],
  ["Delta Resources Ltd", "김민지", 25000, 0, 0, 4250, 1, "수금 완료"],
  ["Nordic Raw Materials AB", "조민영", 94000, 18000, 0, -4700, 2, "손실"],
  ["HMM Green", "김민지", 82000, 12000, 0, 1640, 3, "낮은 마진"],
  ["Ocean Freight Co.", "조민영", 64000, 24000, 0, null, 2, "원가 미입력"],
  ["Blue Harbor Trading", "김민지", 156000, 32000, 0, 34320, 4, "고마진"],
  ["Eastport Metals", "조민영", 0, 0, 0, null, 1, "신규 거래"],
  ["Silverline Materials", "김민지", 72000, 0, 0, 8640, 0, "거래 완료"],
] satisfies [
  string,
  string,
  number,
  number,
  number,
  number | null,
  number,
  string,
][]
export const salesCustomerSamples = customerCases
  .map(
    (
      [name, owner, revenue, receivable, overdue, gp, count, status],
      index
    ) => ({
      name,
      owner,
      currency: "USD",
      revenue,
      receivable,
      overdue,
      gp,
      status,
      nextPayment: receivable ? `08.${15 + index}` : "—",
      shipment: count ? index % 3 : 0,
      documents: index % 4,
      activity: `8월 ${10 - index}일`,
      deals: count,
    })
  )
  .concat([
    {
      name: "ACME",
      owner: "김민지",
      currency: "SGD",
      revenue: 46000,
      receivable: 16000,
      overdue: 0,
      gp: 6900,
      status: "정상",
      nextPayment: "08.20",
      shipment: 1,
      documents: 2,
      activity: "8월 8일",
      deals: 2,
    },
    {
      name: "Pacific Recycling Pte Ltd",
      owner: "조민영",
      currency: "SGD",
      revenue: 36000,
      receivable: 36000,
      overdue: 6000,
      gp: -1800,
      status: "손실",
      nextPayment: "08.15",
      shipment: 2,
      documents: 3,
      activity: "8월 9일",
      deals: 3,
    },
  ])

// Monthly GP records by currency and owner, with growth and loss examples.
export const salesMonthlySamples = Array.from({ length: 12 }, (_, index) => {
  const date = new Date(Date.UTC(2025, 8 + index, 1))
  const period = `${String(date.getUTCFullYear()).slice(-2)}.${String(date.getUTCMonth() + 1).padStart(2, "0")}`
  return ["USD", "SGD"].flatMap((currency) =>
    ["조민영", "김민지"].map((owner, ownerIndex) => ({
      period,
      currency,
      owner,
      gp:
        currency === "USD"
          ? [
              8200, 10500, -3400, 16800, 12200, 18100, 21600, -4200, 26700,
              30500, 28400, 34800,
            ][index] +
            ownerIndex * 2100
          : [
              1200, 1800, -500, 2100, 1600, 3200, 2800, -900, 3500, 4200, 3900,
              5100,
            ][index] +
            ownerIndex * 450,
    }))
  )
}).flat()

export const settlementLedgerRows = [
  {
    id: "AR-260715-01",
    party: "ACME GmbH",
    type: "AR",
    amount: "82,000 USD",
    paid: "40,000 USD",
    balance: "42,000 USD",
    due: "오늘",
    status: "미정산",
    requiredObligations: 1,
    dealState: "진행",
    readOnly: false,
    deal: "DL-260704-04",
  },
  {
    id: "AP-260716-01",
    party: "KATAMAN ASIA-PACIFIC",
    type: "AP",
    amount: "120,000 USD",
    paid: "0 USD",
    balance: "120,000 USD",
    due: "07.16",
    status: "미정산",
    requiredObligations: 1,
    dealState: "진행",
    readOnly: false,
    deal: "DL-260701-09",
  },
  {
    id: "AP-260710-01",
    party: "HMM Green",
    type: "AP",
    amount: "8,200 USD",
    paid: "8,200 USD",
    balance: "0 USD",
    due: "07.10",
    status: "정산 완료",
    requiredObligations: 1,
    dealState: "완료",
    readOnly: false,
    deal: "DL-260625-03",
  },
  {
    id: "AR-260628-02",
    party: "Nordic Raw Materials AB",
    type: "AR",
    amount: "0 USD",
    paid: "0 USD",
    balance: "0 USD",
    due: "-",
    status: "정산 대상 아님",
    requiredObligations: 0,
    dealState: "취소",
    readOnly: true,
    deal: "DL-260704-02",
  },
  ...additionalLedgerSamples,
]

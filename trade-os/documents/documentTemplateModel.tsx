import { decimalMagnitude, FINANCE_DECIMAL_SCALE } from "@trade-os/lib/financeDecimal"
import { normalizeDecimalInput, formatScaledDecimal } from "@trade-os/lib/money"
import { type DocumentApprover, type GeneratedDraft, type DocumentSourceDeal, type DocumentComparisonFacts, type DealDocumentContext, type DocumentDiscrepancyReview, type DocumentDiscrepancyFinding, type DocumentSaveState, type DocumentApprovalChoice, type DocumentElementStatus, type DocumentApprovalEvent, type ReviewChecklistRow } from "@/App"

export const dealDocumentContexts: Record<string, DealDocumentContext> = {
  "DL-260708-08": {
    id: "DL-260708-08",
    title: "ACME 7월 상업송장 거래",
    party: "ACME GmbH",
  },
  "DL-260708-01": {
    id: "DL-260708-01",
    title: "7월 알루미늄 스크랩 수입",
    party: "KATAMAN ASIA-PACIFIC PTE LTD",
  },
  "DL-260707-04": {
    id: "DL-260707-04",
    title: "ACME 7월 해상운송 계약",
    party: "ACME GmbH",
  },
  "DL-260704-02": {
    id: "DL-260704-02",
    title: "부산항 산업재 수입",
    party: "Nordic Raw Materials AB",
  },
  "DL-260701-09": {
    id: "DL-260701-09",
    title: "한빛 6월 정산 거래",
    party: "Hanbit Trading Co.",
  },
  "DL-260629-03": {
    id: "DL-260629-03",
    title: "싱가포르 구리 스크랩 매입",
    party: "Meridian Metals Pte Ltd",
  },
  "DL-260625-07": {
    id: "DL-260625-07",
    title: "일본 내륙운송 발주",
    party: "Sakura Logistics KK",
  },
}

function downloadSamplePdf(filename: string) {
  const url = URL.createObjectURL(createSamplePdf(filename))
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename.toLowerCase().endsWith(".pdf")
    ? filename
    : `${filename}.pdf`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function downloadRenderedDocumentPdf(
  filename: string,
  root?: HTMLElement | null
) {
  const paper =
    root?.querySelector<HTMLElement>("[data-document-paper]") ??
    document.querySelector<HTMLElement>("[data-document-paper]")
  if (!paper) {
    downloadSamplePdf(filename)
    return
  }

  const [{ toPng }, { jsPDF }] = await Promise.all([
    import("html-to-image"),
    import("jspdf"),
  ])
  const exportWidth = 720
  const exportHeight = 1000
  const exportPaper = paper.cloneNode(true) as HTMLElement
  Object.assign(exportPaper.style, {
    aspectRatio: "auto",
    boxSizing: "border-box",
    height: `${exportHeight}px`,
    left: "0",
    margin: "0",
    maxWidth: `${exportWidth}px`,
    position: "fixed",
    top: "0",
    transform: "none",
    width: `${exportWidth}px`,
    zIndex: "-1000",
  })
  document.body.appendChild(exportPaper)
  let imageUrl: string
  try {
    imageUrl = await toPng(exportPaper, {
      backgroundColor: "#ffffff",
      cacheBust: true,
      height: exportHeight,
      pixelRatio: 2,
      width: exportWidth,
    })
  } finally {
    exportPaper.remove()
  }
  const image = new Image()
  image.src = imageUrl
  await image.decode()
  const pdf = new jsPDF({
    compress: true,
    format: "a4",
    orientation: "portrait",
    unit: "mm",
  })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10
  const scale = Math.min(
    (pageWidth - margin * 2) / image.naturalWidth,
    (pageHeight - margin * 2) / image.naturalHeight
  )
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale
  pdf.addImage(
    imageUrl,
    "PNG",
    (pageWidth - width) / 2,
    (pageHeight - height) / 2,
    width,
    height,
    undefined,
    "FAST"
  )
  pdf.save(
    filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`
  )
}

export type Tone = "warning" | "blue" | "success" | "neutral" | "danger"

export type PrototypeSlot = {
  key: string
  label: string
  kind: PrototypeSlotKind
  required?: boolean
  section:
    | "seller"
    | "buyer"
    | "document"
    | "goods"
    | "terms"
    | "totals"
    | "bank"
    | "remarks"
    | "line"
}

export type PrototypeTemplateSchema = {
  slots: PrototypeSlot[]
  lineItems?: PrototypeSlot[]
}

export type DocumentLogo = {
  source: "organization" | "file"
  name: string
  dataUrl?: string
}

export type DocumentStyle = {
  archetype: "table" | "letter" | "spec" | "formal"
  fontStyle: "sans" | "serif"
  accent: string
  logo: DocumentLogo | null
}

const commonLineItemSlots: PrototypeSlot[] = [
  {
    key: "description",
    label: "품목명",
    kind: "text",
    required: true,
    section: "line",
  },
  { key: "hs_code", label: "HS Code", kind: "text", section: "line" },
  {
    key: "quantity",
    label: "수량",
    kind: "number",
    required: true,
    section: "line",
  },
  { key: "unit", label: "단위", kind: "text", section: "line" },
  {
    key: "unit_price",
    label: "단가",
    kind: "money",
    required: true,
    section: "line",
  },
]

export const templateSchemas: Record<string, PrototypeTemplateSchema> = {
  QT: {
    slots: [
      {
        key: "customer_name",
        label: "고객",
        kind: "text",
        required: true,
        section: "buyer",
      },
      {
        key: "quotation_date",
        label: "견적일",
        kind: "date",
        required: true,
        section: "document",
      },
      {
        key: "valid_until",
        label: "유효기간",
        kind: "date",
        required: true,
        section: "document",
      },
      { key: "incoterms", label: "인코텀즈", kind: "text", section: "terms" },
      { key: "delivery_terms", label: "납기", kind: "text", section: "terms" },
      {
        key: "currency",
        label: "통화",
        kind: "text",
        required: true,
        section: "totals",
      },
    ],
    lineItems: commonLineItemSlots,
  },
  PI: {
    slots: [
      {
        key: "seller_name",
        label: "판매자",
        kind: "text",
        required: true,
        section: "seller",
      },
      {
        key: "buyer_name",
        label: "구매자",
        kind: "text",
        required: true,
        section: "buyer",
      },
      {
        key: "doc_number",
        label: "견적송장번호",
        kind: "text",
        required: true,
        section: "document",
      },
      {
        key: "doc_date",
        label: "발행일",
        kind: "date",
        required: true,
        section: "document",
      },
      {
        key: "payment_terms",
        label: "결제조건",
        kind: "text",
        section: "terms",
      },
      {
        key: "currency",
        label: "통화",
        kind: "text",
        required: true,
        section: "totals",
      },
    ],
    lineItems: commonLineItemSlots,
  },
  SC: {
    slots: [
      {
        key: "seller_name",
        label: "매도인",
        kind: "text",
        required: true,
        section: "seller",
      },
      {
        key: "buyer_name",
        label: "매수인",
        kind: "text",
        required: true,
        section: "buyer",
      },
      {
        key: "contract_number",
        label: "계약번호",
        kind: "text",
        required: true,
        section: "document",
      },
      {
        key: "contract_date",
        label: "계약일",
        kind: "date",
        required: true,
        section: "document",
      },
      {
        key: "currency",
        label: "통화",
        kind: "text",
        required: true,
        section: "totals",
      },
      { key: "incoterms", label: "인코텀즈", kind: "text", section: "terms" },
      {
        key: "payment_terms",
        label: "지급조건",
        kind: "text",
        section: "terms",
      },
      {
        key: "latest_shipment_date",
        label: "선적기한",
        kind: "date",
        section: "terms",
      },
      { key: "bank_name", label: "은행", kind: "text", section: "bank" },
      { key: "bank_account", label: "계좌번호", kind: "text", section: "bank" },
    ],
    lineItems: commonLineItemSlots,
  },
  PO: {
    slots: [
      {
        key: "supplier_name",
        label: "공급사",
        kind: "text",
        required: true,
        section: "seller",
      },
      {
        key: "buyer_name",
        label: "발주처",
        kind: "text",
        required: true,
        section: "buyer",
      },
      {
        key: "po_number",
        label: "발주번호",
        kind: "text",
        required: true,
        section: "document",
      },
      {
        key: "order_date",
        label: "발주일",
        kind: "date",
        required: true,
        section: "document",
      },
      {
        key: "requested_delivery_date",
        label: "납기 요청일",
        kind: "date",
        section: "terms",
      },
      {
        key: "currency",
        label: "통화",
        kind: "text",
        required: true,
        section: "totals",
      },
    ],
    lineItems: commonLineItemSlots,
  },
  CI: {
    slots: [
      {
        key: "seller_name",
        label: "판매자",
        kind: "text",
        required: true,
        section: "seller",
      },
      {
        key: "buyer_name",
        label: "구매자",
        kind: "text",
        required: true,
        section: "buyer",
      },
      {
        key: "doc_number",
        label: "송장번호",
        kind: "text",
        required: true,
        section: "document",
      },
      {
        key: "doc_date",
        label: "송장일",
        kind: "date",
        required: true,
        section: "document",
      },
      { key: "freight", label: "운임", kind: "money", section: "totals" },
      { key: "insurance", label: "보험료", kind: "money", section: "totals" },
      { key: "vessel", label: "선박/항차", kind: "text", section: "terms" },
      { key: "eta", label: "ETA", kind: "date", section: "terms" },
      {
        key: "currency",
        label: "통화",
        kind: "text",
        required: true,
        section: "totals",
      },
    ],
    lineItems: commonLineItemSlots,
  },
  PL: {
    slots: [
      {
        key: "packing_number",
        label: "포장번호",
        kind: "text",
        required: true,
        section: "document",
      },
      {
        key: "packing_date",
        label: "포장일",
        kind: "date",
        section: "document",
      },
      {
        key: "container_no",
        label: "컨테이너",
        kind: "text",
        section: "goods",
      },
      { key: "seal_no", label: "씰 번호", kind: "text", section: "goods" },
      {
        key: "gross_weight",
        label: "총중량",
        kind: "text",
        section: "goods",
      },
      { key: "net_weight", label: "순중량", kind: "number", section: "goods" },
    ],
    lineItems: commonLineItemSlots,
  },
  SI: {
    slots: [
      {
        key: "shipper_name",
        label: "송하인",
        kind: "text",
        required: true,
        section: "seller",
      },
      {
        key: "consignee_name",
        label: "수하인",
        kind: "text",
        required: true,
        section: "buyer",
      },
      {
        key: "booking_no",
        label: "부킹번호",
        kind: "text",
        required: true,
        section: "document",
      },
      { key: "pol", label: "선적항", kind: "text", section: "terms" },
      { key: "pod", label: "도착항", kind: "text", section: "terms" },
      { key: "vessel", label: "선박/항차", kind: "text", section: "terms" },
      { key: "etd", label: "ETD", kind: "date", section: "terms" },
      { key: "eta", label: "ETA", kind: "date", section: "terms" },
    ],
  },
  BC: {
    slots: [
      {
        key: "beneficiary_name",
        label: "수익자",
        kind: "text",
        required: true,
        section: "seller",
      },
      {
        key: "applicant_name",
        label: "개설의뢰인",
        kind: "text",
        required: true,
        section: "buyer",
      },
      {
        key: "lc_number",
        label: "L/C 번호",
        kind: "text",
        section: "document",
      },
      { key: "issue_date", label: "발행일", kind: "date", section: "document" },
      {
        key: "certificate_text",
        label: "증명 문구",
        kind: "text",
        required: true,
        section: "remarks",
      },
    ],
  },
  DLV: {
    slots: [
      {
        key: "recipient_name",
        label: "납품처",
        kind: "text",
        required: true,
        section: "buyer",
      },
      {
        key: "delivery_date",
        label: "납품일",
        kind: "date",
        required: true,
        section: "document",
      },
      {
        key: "delivery_address",
        label: "배송지",
        kind: "text",
        section: "terms",
      },
      { key: "vehicle_no", label: "차량번호", kind: "text", section: "terms" },
    ],
    lineItems: commonLineItemSlots,
  },
  CO: {
    slots: [
      {
        key: "exporter_name",
        label: "수출자",
        kind: "text",
        required: true,
        section: "seller",
      },
      {
        key: "importer_name",
        label: "수입자",
        kind: "text",
        required: true,
        section: "buyer",
      },
      {
        key: "origin_country",
        label: "원산지",
        kind: "text",
        required: true,
        section: "goods",
      },
      { key: "transport", label: "운송수단", kind: "text", section: "terms" },
      {
        key: "declaration_date",
        label: "신고일",
        kind: "date",
        section: "document",
      },
    ],
    lineItems: commonLineItemSlots,
  },
  SOA: {
    slots: [
      {
        key: "counterparty_name",
        label: "거래처",
        kind: "text",
        required: true,
        section: "buyer",
      },
      {
        key: "period_start",
        label: "기간 시작",
        kind: "date",
        required: true,
        section: "document",
      },
      {
        key: "period_end",
        label: "기간 종료",
        kind: "date",
        required: true,
        section: "document",
      },
      {
        key: "total_billed",
        label: "청구 합계",
        kind: "money",
        section: "totals",
      },
      {
        key: "total_paid",
        label: "수금 합계",
        kind: "money",
        section: "totals",
      },
      {
        key: "balance",
        label: "잔액",
        kind: "money",
        required: true,
        section: "totals",
      },
    ],
  },
  DN: {
    slots: [
      {
        key: "counterparty_name",
        label: "거래처",
        kind: "text",
        required: true,
        section: "buyer",
      },
      {
        key: "debit_note_no",
        label: "차변표 번호",
        kind: "text",
        required: true,
        section: "document",
      },
      {
        key: "issue_date",
        label: "발행일",
        kind: "date",
        required: true,
        section: "document",
      },
      {
        key: "related_invoice_no",
        label: "관련 인보이스",
        kind: "text",
        section: "document",
      },
      {
        key: "amount",
        label: "조정 금액",
        kind: "money",
        required: true,
        section: "totals",
      },
      {
        key: "reason",
        label: "사유",
        kind: "text",
        required: true,
        section: "remarks",
      },
    ],
  },
  CN: {
    slots: [
      {
        key: "counterparty_name",
        label: "거래처",
        kind: "text",
        required: true,
        section: "buyer",
      },
      {
        key: "credit_note_no",
        label: "대변표 번호",
        kind: "text",
        required: true,
        section: "document",
      },
      {
        key: "issue_date",
        label: "발행일",
        kind: "date",
        required: true,
        section: "document",
      },
      {
        key: "related_invoice_no",
        label: "관련 인보이스",
        kind: "text",
        section: "document",
      },
      {
        key: "amount",
        label: "감액 금액",
        kind: "money",
        required: true,
        section: "totals",
      },
      {
        key: "reason",
        label: "사유",
        kind: "text",
        required: true,
        section: "remarks",
      },
    ],
  },
}

export const isNumericInputKind = (kind: PrototypeSlotKind) =>
  kind === "number" || kind === "money"

export const sampleValueForSlot = (slot: PrototypeSlot) => {
  if (sampleSlotValues[slot.key]) return sampleSlotValues[slot.key]
  if (slot.kind === "date") return "2026-07-08"
  if (slot.kind === "money") return "2,400,000"
  if (slot.kind === "number") return "20"
  return `${slot.label} 입력값`
}

export const templateMeta = (code: string) =>
  templates.find(([kind]) => kind === code) ?? templates[2]

export function createSamplePdf(filename: string) {
  const printableFilename = filename
    .replace(/[()\\]/g, "")
    .replace(/[^\x20-\x7e]/g, "_")
  const stream = [
    "BT",
    "/F1 20 Tf",
    "72 720 Td",
    "(ECOYA Trade OS Sample Document) Tj",
    "0 -32 Td",
    "/F1 12 Tf",
    "(Generated from the document processing prototype.) Tj",
    "0 -24 Td",
    `(File: ${printableFilename}) Tj`,
    "ET",
  ].join("\n")
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ]
  let pdf = "%PDF-1.4\n"
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return new Blob([pdf], { type: "application/pdf" })
}

export type PrototypeSlotKind = "text" | "number" | "money" | "date"

export const templates = [
  ["QT", "견적서", "고객, 견적일, 유효기간, 인코텀즈, 납기", "QT-STD-1"],
  ["PI", "견적송장", "판매자, 구매자, 품목, 금액, 결제조건", "PI-STD-1"],
  [
    "SC",
    "판매계약서",
    "판매자, 구매자, 계약번호, 선적기간, 결제조건",
    "SC-STD-1",
  ],
  ["PO", "발주서", "공급사, 발주처, 납기 요청일, 품목, 금액", "PO-STD-1"],
  ["CI", "상업송장", "송장번호, 품목, 운임, 보험료, 선박, ETA", "CI-STD-1"],
  [
    "PL",
    "포장명세서",
    "품명, 수량, 포장 수, 중량, 컨테이너, 씰 번호",
    "PL-STD-1",
  ],
  ["SI", "선적지시서", "송하인, 수하인, 부킹번호, 선적항, 도착항", "SI-STD-1"],
  ["BC", "수익자증명서", "수익자, 개설의뢰인, L/C 번호, 증명 문구", "BC-STD-1"],
  ["DLV", "납품서", "납품처, 납품일, 품목, 배송지, 차량번호", "DLV-STD-1"],
  [
    "CO",
    "원산지증명서",
    "수출자, 수입자, 원산지, 운송수단, 신고 문구",
    "CO-STD-1",
  ],
  [
    "SOA",
    "거래명세서",
    "거래처, 기간, 청구 합계, 수금 합계, 잔액",
    "SOA-STD-1",
  ],
  ["DN", "차변표", "관련 인보이스, 조정 금액, 통화, 사유", "DN-STD-1"],
  ["CN", "대변표", "관련 인보이스, 감액 금액, 통화, 사유", "CN-STD-1"],
] as const

export const sampleSlotValues: Record<string, string> = {
  seller_name: "ECOYA Demo Co.",
  buyer_name: "ACME GmbH",
  customer_name: "ACME GmbH",
  supplier_name: "Hanbit Trading",
  counterparty_name: "ACME GmbH",
  shipper_name: "ECOYA Demo Co.",
  consignee_name: "ACME GmbH",
  beneficiary_name: "ECOYA Demo Co.",
  applicant_name: "ACME GmbH",
  exporter_name: "ECOYA Demo Co.",
  importer_name: "ACME GmbH",
  recipient_name: "ACME GmbH",
  contract_number: "SC-2026-0708",
  doc_number: "CI-2026-0708",
  po_number: "PO-2026-0708",
  booking_no: "BKG-014W-2607",
  packing_number: "PL-2026-0708",
  lc_number: "LC-2026-0041",
  debit_note_no: "DN-2026-0012",
  credit_note_no: "CN-2026-0007",
  related_invoice_no: "CI-2026-0703",
  currency: "USD",
  incoterms: "CIF Hamburg",
  payment_terms: "T/T 30 days",
  bank_name: "ECOYA Demo Bank",
  bank_account: "123-456-789012",
  bank_swift: "ECOYKRSE",
  origin_country: "Australia",
  amount: "2400000",
  total_billed: "2400000",
  total_paid: "1800000",
  balance: "600000",
  freight: "24000",
  insurance: "8500",
  gross_weight: "20500",
  net_weight: "20000",
  eta: "2026-08-03",
  etd: "2026-07-20",
}

export const documentApproverOptions: readonly DocumentApprover[] = [
  { id: "park-seoyoon", name: "박서윤", role: "Owner" },
  { id: "kim-dohyun", name: "김도현", role: "Admin" },
  { id: "kim-minji", name: "김민지", role: "Admin" },
]

// The SSOT's public document type cards mark PO as purchase-only and the
// remaining 12 types as usable for both purchase and sales flows. Keep that
// direction metadata beside the source list so the tabs change the actual
// available templates and their count, rather than only changing a label.
export const templateDirections = {
  QT: ["purchase", "sales"],
  PI: ["purchase", "sales"],
  SC: ["purchase", "sales"],
  PO: ["purchase"],
  CI: ["purchase", "sales"],
  PL: ["purchase", "sales"],
  SI: ["purchase", "sales"],
  BC: ["purchase", "sales"],
  DLV: ["purchase", "sales"],
  CO: ["purchase", "sales"],
  SOA: ["purchase", "sales"],
  DN: ["purchase", "sales"],
  CN: ["purchase", "sales"],
} as const

export const generatedDrafts: GeneratedDraft[] = [
  {
    dealId: "DL-260707-04", title: "판매계약서 승인 요청", type: "계약서",
    number: "SC-2026-0918", party: "ACME GmbH", status: "작성 중", tone: "neutral",
    readiness: "승인자 검토 중", tab: "draft", creatorName: "조민영", creatorAccountId: "account-owner",
    updated: "오늘 10:00", memberCanAccessDeal: true, memberCanDeliver: true, pdfState: "draft",
    approvalRequirement: "required",
    approvalPreviewState: "requester-pending",
  },
  {
    dealId: "DL-260707-04", title: "상업송장 승인 완료", type: "인보이스",
    number: "CI-2026-0918", party: "ACME GmbH", status: "작성 중", tone: "neutral",
    readiness: "승인 완료 · 최종 검토", tab: "draft", creatorName: "조민영", creatorAccountId: "account-owner",
    updated: "오늘 10:00", memberCanAccessDeal: true, memberCanDeliver: true, pdfState: "reviewed",
    approvalRequirement: "required",
    approvalPreviewState: "requester-approved",
  },
  {
    dealId: "DL-260707-04", title: "발주서 결제조건 수정", type: "발주서",
    number: "PO-2026-0918", party: "ACME GmbH", status: "작성 중", tone: "neutral",
    readiness: "결제조건 보완 후 재요청", tab: "draft", creatorName: "조민영", creatorAccountId: "account-owner",
    updated: "오늘 10:00", memberCanAccessDeal: true, memberCanDeliver: true, pdfState: "draft",
    approvalRequirement: "required",
    approvalPreviewState: "requester-rejected",
  },
  {
    dealId: "",
    title: "표준 매매계약서 초안",
    type: "계약서",
    number: "SC-2026-0708",
    party: "거래 미연결",
    status: "작성 중",
    tone: "warning",
    readiness: "거래 연결 필요",
    tab: "draft",
    creatorName: "박서윤",
    creatorAccountId: "account-admin",
    updated: "오늘 09:42",
    memberCanAccessDeal: false,
    memberCanDeliver: false,
    pdfState: "none",
    approvalRequirement: "required",
  },
  {
    dealId: "DL-260708-08",
    title: "은행 제출용 상업송장 초안",
    type: "인보이스",
    number: "CI-2026-0708",
    party: "ACME GmbH",
    status: "작성 중",
    tone: "warning",
    readiness: "은행 거절 전 점검 통과",
    tab: "draft",
    creatorName: "김도현",
    creatorAccountId: "account-member",
    updated: "오늘 09:36",
    memberCanAccessDeal: true,
    memberCanDeliver: true,
    pdfState: "reviewed",
    approvalRequirement: "required",
  },
  {
    dealId: "DL-260708-01",
    title: "은행 제출용 상업송장 점검 필요",
    type: "인보이스",
    number: "CI-2026-0712",
    party: "KATAMAN ASIA-PACIFIC PTE LTD",
    status: "작성 중",
    tone: "danger",
    readiness: "거절 위험 1건 · 거래처명 불일치",
    tab: "draft",
    creatorName: "조민영",
    creatorAccountId: "account-owner",
    updated: "오늘 09:31",
    memberCanAccessDeal: true,
    memberCanDeliver: true,
    pdfState: "draft",
    approvalRequirement: "required",
  },
  {
    dealId: "DL-260708-01",
    title: "수출 인보이스",
    type: "인보이스",
    number: "CI-2026-0703",
    party: "ACME GmbH",
    status: "확정",
    tone: "success",
    readiness: "전달 준비",
    tab: "confirmed",
    creatorName: "조민영",
    creatorAccountId: "account-owner",
    updated: "오늘 09:24",
    memberCanAccessDeal: false,
    memberCanDeliver: false,
    pdfState: "final",
    approvalRequirement: "none",
  },
  {
    dealId: "DL-260625-07",
    title: "해상운송 견적서",
    type: "견적서",
    number: "QT-2026-0630",
    party: "부산항",
    status: "작성 중",
    tone: "neutral",
    readiness: "ETA 필요",
    tab: "progress",
    creatorName: "알 수 없음",
    creatorAccountId: null,
    updated: "어제 17:42",
    memberCanAccessDeal: false,
    memberCanDeliver: false,
    pdfState: "none",
    approvalRequirement: "required",
  },
  {
    dealId: "DL-260708-01",
    title: "상업송장 고객 전달",
    type: "인보이스",
    number: "CI-2026-0704",
    party: "ACME GmbH",
    status: "확정",
    tone: "success",
    readiness: "공유 링크 활성 · 미발송",
    tab: "sharing",
    creatorName: "박서윤",
    creatorAccountId: "account-admin",
    updated: "08.27 16:08",
    memberCanAccessDeal: true,
    memberCanDeliver: true,
    pdfState: "final",
    approvalRequirement: "none",
  },
  {
    dealId: "DL-260701-09",
    title: "월 정산 명세서",
    type: "정산서",
    number: "SOA-2026-0629",
    party: "한빛무역",
    status: "확정",
    tone: "success",
    readiness: "이메일 요청 기록 · 전달 미확인",
    tab: "sharing",
    creatorName: "김도현",
    creatorAccountId: "account-member",
    updated: "08.26 14:32",
    memberCanAccessDeal: true,
    memberCanDeliver: true,
    pdfState: "final",
    approvalRequirement: "none",
  },
]

export const documentSourceDeals: DocumentSourceDeal[] = [
  {
    ...dealDocumentContexts["DL-260708-08"],
    amount: "2,566,660",
    currency: "USD",
    item: "Aluminium Scrap · 20 MT",
    stage: "은행 제출 전",
    tone: "warning",
  },
  {
    ...dealDocumentContexts["DL-260708-01"],
    amount: "2,400,000",
    currency: "USD",
    item: "Aluminium Scrap · 20 MT",
    stage: "선적 중",
    tone: "blue",
  },
  {
    ...dealDocumentContexts["DL-260707-04"],
    amount: "380,000",
    currency: "USD",
    item: "Ocean Freight · 1 LOT",
    stage: "계약 검토",
    tone: "warning",
  },
  {
    ...dealDocumentContexts["DL-260704-02"],
    amount: "940,000",
    currency: "EUR",
    item: "Industrial Materials · 12 PKG",
    stage: "통관 중",
    tone: "blue",
  },
  {
    ...dealDocumentContexts["DL-260701-09"],
    amount: "620,000",
    currency: "USD",
    item: "정산 품목 · 4건",
    stage: "정산 대기",
    tone: "neutral",
  },
  {
    ...dealDocumentContexts["DL-260629-03"],
    amount: "510,000",
    currency: "USD",
    item: "Copper Scrap · 18 MT",
    stage: "계약 완료",
    tone: "success",
  },
  {
    ...dealDocumentContexts["DL-260625-07"],
    amount: "72,000",
    currency: "JPY",
    item: "Inland Freight · 1 LOT",
    stage: "발주 완료",
    tone: "success",
  },
]

export const getGeneratedDocumentsForDeal = (dealId: string) =>
  generatedDrafts.filter((draft) => draft.dealId === dealId)

export function quotationMoney(value: string | number) {
  const amount = decimalMagnitude(normalizeDecimalInput(String(value)), FINANCE_DECIMAL_SCALE)
  return amount === null ? "—" : formatScaledDecimal(amount, FINANCE_DECIMAL_SCALE, "en-US", 2)
}

export const normalizeComparisonText = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9가-힣]/g, "")

const documentReferenceCode = (name: string) => {
  const normalized = name.trim().toUpperCase()
  if (normalized.includes("계약서")) return "SC"
  if (normalized.includes("인보이스")) return "CI"
  if (normalized.includes("발주서")) return "PO"
  if (normalized.includes("견적송장")) return "PI"
  if (normalized.includes("포장명세서")) return "PL"
  if (normalized.includes("B/L")) return "BL"
  return normalized.match(/^([A-Z]+)[-_]/)?.[1] ?? ""
}

const pickReferenceDocument = (names: string[], priority: string[]) => {
  for (const code of priority) {
    const found = names.find((name) => documentReferenceCode(name) === code)
    if (found) return found
  }
  return names[0] ?? null
}

export function buildDocumentDiscrepancyReview({
  templateCode,
  comparisonFacts,
  relatedDeal,
  dealFacts,
  referenceDocuments,
}: {
  templateCode: string
  comparisonFacts: DocumentComparisonFacts | null
  relatedDeal: DealDocumentContext | null
  dealFacts: DocumentSourceDeal | null
  referenceDocuments: string[]
}): DocumentDiscrepancyReview {
  if (!comparisonFacts || !relatedDeal) {
    return {
      blocking: false,
      errorCount: 0,
      warningCount: 0,
      findings: [],
      referenceDocuments: [],
      basisReady: false,
      basisDocument: null,
      basisMessage:
        "거래를 연결하면 거래처·방향과 문서 간 일치 여부를 추가로 점검합니다.",
    }
  }

  const findings: DocumentDiscrepancyFinding[] = []
  const isInvoice = templateCode === "CI"
  const generalReference = pickReferenceDocument(
    referenceDocuments,
    templateCode === "SC"
      ? ["PO", "PI", "CI", "LC", "PL", "BL"]
      : ["CI", "PI", "SC", "PO", "LC", "PL", "BL"]
  )
  const invoiceBaseline = isInvoice
    ? pickReferenceDocument(
        referenceDocuments.filter((name) =>
          ["PI", "SC", "PO"].includes(documentReferenceCode(name))
        ),
        ["PI", "SC", "PO"]
      )
    : null
  const basisDocument = isInvoice ? invoiceBaseline : generalReference
  const basisReady = Boolean(basisDocument)
  const basisMessage = basisReady
    ? ""
    : isInvoice
      ? "PI, 계약서 또는 PO가 연결되면 CI의 금액·품목도 자동으로 대조합니다."
      : "같은 거래의 다른 문서가 연결되면 통화·수취인·계좌를 자동으로 대조합니다."
  const targetCounterparty = comparisonFacts.counterparty.trim()
  const dealCounterparty = relatedDeal.party.trim()
  if (targetCounterparty && dealCounterparty) {
    const matched =
      normalizeComparisonText(targetCounterparty) ===
      normalizeComparisonText(dealCounterparty)
    findings.push({
      key: "counterparty",
      label: "연결 거래처명",
      detail: matched
        ? `${targetCounterparty} · 거래 확정값과 일치`
        : `${targetCounterparty} ≠ ${dealCounterparty}`,
      source: generalReference ?? `거래 ${relatedDeal.id}`,
      currentValue: targetCounterparty,
      referenceValue: dealCounterparty,
      state: matched ? "pass" : "error",
    })
  }

  if (comparisonFacts.currency && dealFacts?.currency) {
    const matched =
      comparisonFacts.currency.toUpperCase() ===
      dealFacts.currency.toUpperCase()
    findings.push({
      key: "currency",
      label: "통화",
      detail: matched
        ? `${comparisonFacts.currency.toUpperCase()} · 기준 문서와 일치`
        : `${comparisonFacts.currency.toUpperCase()} ≠ ${dealFacts.currency.toUpperCase()}`,
      source: generalReference ?? "기준 문서 연결 필요",
      currentValue: comparisonFacts.currency.toUpperCase(),
      referenceValue: dealFacts.currency.toUpperCase(),
      state: generalReference ? (matched ? "pass" : "error") : "warning",
    })
  }

  const schema = templateSchemas[templateCode] ?? templateSchemas.SC
  const hasBankFields = schema.slots.some((slot) =>
    ["bank_name", "bank_account", "bank_swift"].includes(slot.key)
  )
  if (
    hasBankFields &&
    (comparisonFacts.bankName || comparisonFacts.bankAccount)
  ) {
    const bankMatched =
      comparisonFacts.bankName === sampleSlotValues.bank_name &&
      comparisonFacts.bankAccount === sampleSlotValues.bank_account
    findings.push({
      key: "recipient-account",
      label: "수취 은행·계좌",
      detail: generalReference
        ? bankMatched
          ? `${comparisonFacts.bankName} · 계좌 끝자리 ${comparisonFacts.bankAccount.slice(-4)} 일치`
          : "기준 문서의 수취 은행 또는 계좌와 다름"
        : "비교할 연결 문서의 은행 정보가 없습니다.",
      source: generalReference ?? "기준 문서 연결 필요",
      currentValue: [comparisonFacts.bankName, comparisonFacts.bankAccount]
        .filter(Boolean)
        .join(" · "),
      referenceValue: generalReference
        ? `${sampleSlotValues.bank_name} · ${sampleSlotValues.bank_account}`
        : "정보 없음",
      state: generalReference ? (bankMatched ? "pass" : "error") : "warning",
    })
  }

  if (isInvoice && comparisonFacts.totalAmount && dealFacts?.amount) {
    const dealAmount = normalizeDecimalInput(dealFacts.amount)
    const currentAmount = decimalMagnitude(comparisonFacts.totalAmount, FINANCE_DECIMAL_SCALE)
    const baselineAmount = decimalMagnitude(dealAmount, FINANCE_DECIMAL_SCALE)
    const matched = currentAmount !== null && baselineAmount !== null && currentAmount === baselineAmount
      && comparisonFacts.currency.toUpperCase() === dealFacts.currency.toUpperCase()
    findings.push({
      key: "amount",
      label: "송장 금액",
      detail: matched
        ? `${quotationMoney(comparisonFacts.totalAmount)} ${dealFacts.currency} · 기준 금액과 일치`
        : `${quotationMoney(comparisonFacts.totalAmount)} ${comparisonFacts.currency} ≠ ${quotationMoney(dealAmount)} ${dealFacts.currency}`,
      source: invoiceBaseline ?? "PI·계약서·PO 연결 필요",
      currentValue: `${quotationMoney(comparisonFacts.totalAmount)} ${comparisonFacts.currency}`,
      referenceValue: `${quotationMoney(dealAmount)} ${dealFacts.currency}`,
      state: invoiceBaseline ? (matched ? "pass" : "error") : "warning",
    })
  }

  if (isInvoice && comparisonFacts.itemNames.length > 0 && dealFacts?.item) {
    const baselineItem = dealFacts.item.split("·")[0]?.trim() ?? ""
    const matched = comparisonFacts.itemNames.some((item) => {
      const current = normalizeComparisonText(item)
      const baseline = normalizeComparisonText(baselineItem)
      return current.includes(baseline) || baseline.includes(current)
    })
    findings.push({
      key: "goods",
      label: "품목명",
      detail: matched
        ? `${comparisonFacts.itemNames[0]} · 기준 문서와 일치`
        : `${comparisonFacts.itemNames[0]} ≠ ${baselineItem}`,
      source: invoiceBaseline ?? "PI·계약서·PO 연결 필요",
      currentValue: comparisonFacts.itemNames[0],
      referenceValue: baselineItem || "정보 없음",
      state: invoiceBaseline ? (matched ? "pass" : "warning") : "warning",
    })
  }

  const errorCount = findings.filter(
    (finding) => finding.state === "error"
  ).length
  const warningCount = findings.filter(
    (finding) => finding.state === "warning"
  ).length
  return {
    blocking: errorCount > 0,
    errorCount,
    warningCount,
    findings,
    referenceDocuments,
    basisReady,
    basisDocument,
    basisMessage,
  }
}

export function buildDocumentReviewRows({
  missingRequiredCount,
  documentStyle,
  saveState,
  qualityAcknowledged,
  relatedDeal,
  dealConnectionRestricted = false,
  discrepancyReview,
  approvalChoice,
  approvalStatus,
  selectedApproverCount,
  lastRequestEvent,
  lastDecisionEvent,
  confirmationReady,
  documentConfirmed,
  templateCode,
  documentNumber = `${templateCode}-2026-0708`,
  activeLinkCount = 0,
  linkSlotOccupied = false,
  deliveryRecordCount = 0,
  interactive = true,
  approvalEnabled = false,
  deliveryAllowed = true,
}: {
  missingRequiredCount: number
  documentStyle: DocumentStyle
  saveState: DocumentSaveState
  qualityAcknowledged: boolean
  relatedDeal: DealDocumentContext | null
  dealConnectionRestricted?: boolean
  discrepancyReview: Pick<
    DocumentDiscrepancyReview,
    "blocking" | "errorCount"
  > &
    Partial<Pick<DocumentDiscrepancyReview, "basisReady" | "warningCount">>
  approvalChoice: DocumentApprovalChoice
  approvalStatus: DocumentElementStatus["approval"]
  selectedApproverCount: number
  lastRequestEvent?: DocumentApprovalEvent
  lastDecisionEvent?: DocumentApprovalEvent
  confirmationReady: boolean
  documentConfirmed: boolean
  templateCode: string
  documentNumber?: string
  activeLinkCount?: number
  linkSlotOccupied?: boolean
  deliveryRecordCount?: number
  interactive?: boolean
  approvalEnabled?: boolean
  deliveryAllowed?: boolean
}): ReviewChecklistRow[] {
  const saveComplete = saveState === "saved"
  const approvalRequested = approvalStatus === "requested"
  const approvalDone = approvalStatus === "approved"
  const approvalRejected = approvalStatus === "rejected"
  const bankReviewReady = discrepancyReview.basisReady ?? false
  const bankWarningCount = discrepancyReview.warningCount ?? 0
  const approvalSetupAvailable = qualityAcknowledged && Boolean(relatedDeal)
  const approvalRequestValue =
    !approvalSetupAvailable && approvalStatus === "idle"
      ? "PDF 검토·거래 연결 후 설정"
      : approvalChoice === "none"
        ? "승인 없음"
        : approvalRequested || approvalDone || approvalRejected
          ? `${selectedApproverCount}명 · ${lastRequestEvent?.occurredAt ?? "요청됨"}`
          : selectedApproverCount > 0
            ? `${selectedApproverCount}명 선택 · 요청 전`
            : "승인자 선택 필요"
  const approvalResultValue =
    approvalChoice === "none"
      ? "적용 안 함"
      : approvalDone && lastDecisionEvent
        ? `${lastDecisionEvent.actor} 승인 · ${lastDecisionEvent.occurredAt}`
        : approvalRejected && lastDecisionEvent
          ? `반려 · ${lastDecisionEvent.reason ?? "사유 확인 필요"}`
          : approvalRequested
            ? "승인자 응답 대기"
            : "요청 전"

  return [
    {
      label: "필수 항목",
      value:
        missingRequiredCount > 0
          ? `${missingRequiredCount}개 누락`
          : "누락 없음",
      state: missingRequiredCount === 0 ? "complete" : "blocked",
    },
    {
      label: "품목 합계",
      value: "계약금액과 대조됨",
      state: "complete",
    },
    {
      label: "문서 모양",
      value:
        documentStyle.logo?.source === "organization"
          ? "기업 기본 로고"
          : documentStyle.logo
            ? "새 로고 포함"
            : "로고 없음",
      state: "complete",
    },
    {
      label: "변경사항 저장",
      value:
        saveState === "saved"
          ? "저장 완료"
          : saveState === "saving"
            ? "저장 중"
            : "저장 필요",
      state: saveComplete
        ? "complete"
        : saveState === "saving"
          ? "pending"
          : "blocked",
    },
    {
      label: "문서 결과 검토",
      value: qualityAcknowledged ? "검토 완료" : "확인 필요",
      state: qualityAcknowledged ? "complete" : "blocked",
      action: interactive ? "review" : undefined,
    },
    {
      label: "거래 연결",
      value: dealConnectionRestricted
        ? "연결됨 · 상세 접근 제한"
        : relatedDeal
          ? `${relatedDeal.id} · ${relatedDeal.party}`
          : "연결 필요",
      state:
        relatedDeal || (dealConnectionRestricted && documentConfirmed)
          ? "complete"
          : "blocked",
      action:
        interactive && !relatedDeal && !dealConnectionRestricted
          ? "deal"
          : undefined,
    },
    ...(bankReviewReady
      ? [
          {
            label: "은행 거절 전 점검",
            value: discrepancyReview.blocking
              ? `불일치 ${discrepancyReview.errorCount}건`
              : discrepancyReview.errorCount > 0
                ? `불일치 ${discrepancyReview.errorCount}건 확인`
                : bankWarningCount > 0
                  ? `확인 권장 ${bankWarningCount}건`
                  : "통과",
            state: discrepancyReview.blocking
              ? ("blocked" as const)
              : bankWarningCount > 0
                ? ("pending" as const)
                : ("complete" as const),
            action:
              interactive &&
              (discrepancyReview.blocking || bankWarningCount > 0)
                ? ("bank" as const)
                : undefined,
          },
        ]
      : []),
    ...(approvalEnabled
      ? [
          {
            label: "승인 요청",
            value: approvalRequestValue,
            state:
              !approvalSetupAvailable && approvalStatus === "idle"
                ? ("blocked" as const)
                : approvalChoice === "none" ||
                    approvalRequested ||
                    approvalDone ||
                    approvalRejected
                  ? ("complete" as const)
                  : ("pending" as const),
            action:
              interactive && approvalStatus === "idle" && approvalSetupAvailable
                ? ("approval" as const)
                : undefined,
          },
          {
            label: "승인 결과",
            value: approvalResultValue,
            state:
              approvalChoice === "none" || approvalDone
                ? ("complete" as const)
                : approvalRejected
                  ? ("blocked" as const)
                  : ("pending" as const),
            action:
              interactive && approvalRejected
                ? ("rejection" as const)
                : undefined,
          },
        ]
      : []),
    {
      label: "문서 확정",
      value: documentConfirmed
        ? `${documentNumber}.pdf`
        : confirmationReady
          ? "상단에서 확정 가능"
          : approvalEnabled && approvalRejected
            ? "수정·재검토 후 재승인 필요"
            : approvalEnabled && approvalRequested
              ? "승인 완료 후 표시"
              : approvalEnabled &&
                  approvalChoice === "request" &&
                  approvalStatus === "idle"
                ? "승인 완료 후 표시"
                : dealConnectionRestricted
                  ? "Deal 접근 권한 필요"
                  : relatedDeal
                    ? "검토 완료 후 가능"
                    : "거래 연결 후 가능",
      state: documentConfirmed
        ? "complete"
        : confirmationReady
          ? "pending"
          : "blocked",
    },
    {
      label: "공유 링크 생성",
      value:
        activeLinkCount > 0
          ? `활성 링크 ${activeLinkCount}개`
          : linkSlotOccupied
            ? "기존 링크 철회 후 새 링크 가능"
          : documentConfirmed
              ? "링크 생성 가능"
              : "문서 확정 후 가능",
      state:
        activeLinkCount > 0
          ? "complete"
          : linkSlotOccupied
            ? "pending"
          : documentConfirmed && deliveryAllowed
            ? "pending"
            : "blocked",
    },
    {
      label: "전달·공유",
      value:
        deliveryRecordCount > 0
          ? `전달 요청 ${deliveryRecordCount}건`
          : activeLinkCount > 0
              ? "생성한 링크 전달 전"
              : "공유 링크 생성 후 가능",
      state:
        deliveryRecordCount > 0
          ? "pending"
          : activeLinkCount > 0
            ? "pending"
            : "blocked",
    },
  ]
}

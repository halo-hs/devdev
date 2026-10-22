import { type PrototypeSlotKind } from "@trade-os/documents/documentTemplateModel"
import { type UploadDocumentDealLinks, type UploadDocumentType, type RecentDocument, type ReviewField } from "@/App"

export function readUploadDocumentDealLinks(): UploadDocumentDealLinks {
  if (typeof window === "undefined") return {}
  try {
    const stored = window.localStorage.getItem(
      UPLOAD_DOCUMENT_DEAL_LINKS_STORAGE_KEY
    )
    return stored ? (JSON.parse(stored) as UploadDocumentDealLinks) : {}
  } catch {
    return {}
  }
}

export const inputTypeForKind = (kind: PrototypeSlotKind) =>
  kind === "date"
    ? "date"
    : kind === "number" || kind === "money"
      ? "number"
      : "text"

export const manualUploadDocumentTypeOptions: ReadonlyArray<{
  value: Exclude<UploadDocumentType, "UNK" | "OTHER">
  label: string
}> = [
  { value: "BL", label: "B/L · 선하증권" },
  { value: "PO", label: "PO · 발주서" },
  { value: "CI", label: "CI · 상업송장" },
  { value: "SC", label: "SC · 판매계약서" },
  { value: "PL", label: "PL · 포장명세서" },
  { value: "CUSTOMS_ENTRY", label: "수입신고필증" },
  { value: "PI", label: "PI · 견적송장" },
  { value: "C/O", label: "C/O · 원산지증명서" },
  { value: "AN", label: "AN · 도착통지" },
  { value: "BANK_STATEMENT", label: "은행거래내역서" },
  { value: "FREIGHT_INVOICE", label: "운임 인보이스" },
  { value: "CUSTOMS_DECLARATION", label: "관세신고서" },
  { value: "INSURANCE_CERTIFICATE", label: "보험증권" },
  { value: "QC", label: "검사성적서" },
]

export function isUploadDocumentTypeUnresolved(document: RecentDocument) {
  return (
    document.documentType === "UNK" ||
    (/^QT[-_]/i.test(document.name) && document.documentType === "CI")
  )
}

export function uploadDocumentTypeLabel(documentType: UploadDocumentType) {
  if (documentType === "UNK") return "미확인 문서"
  if (documentType === "OTHER") return "기타 문서"
  return (
    manualUploadDocumentTypeOptions.find(
      (option) => option.value === documentType
    )?.label ?? documentType
  )
}

export function resolvedReviewFields(document: Pick<RecentDocument, "documentType" | "reviewedFields">): ReviewField[] {
  return reviewFieldsForDocument(document.documentType).map((field) => {
    const reviewed = document.reviewedFields?.[field.key]
    if (!reviewed) return field
    const missing = field.required && !reviewed.value.trim()
    const userEdited = reviewed.userEdited ?? (reviewed.value !== field.value || reviewed.unit !== field.unit)
    return { ...field, ...reviewed, userEdited, confidence: userEdited ? "사용자 입력" : field.confidence, comment: userEdited ? "사용자가 직접 입력한 값입니다" : field.comment, tone: missing ? "danger" : "success", status: missing ? "누락" : "검토됨" }
  })
}

export function reviewFieldsForDocument(
  documentType: RecentDocument["documentType"]
): ReviewField[] {
  const extracted = (
    key: string,
    label: string,
    value: string,
    options: Partial<
      Pick<ReviewField, "kind" | "comment" | "unit" | "required">
    > = {}
  ): ReviewField => ({
    key,
    label,
    value,
    kind: options.kind ?? "text",
    status: "정상",
    source: "추출 필드",
    confidence: "신뢰도 높음",
    comment: options.comment ?? "원문에서 추출한 값입니다.",
    tone: "success",
    unit: options.unit,
    required: options.required ?? true,
  })
  const missing = (
    key: string,
    label: string,
    options: Partial<Pick<ReviewField, "kind" | "comment" | "unit">> = {}
  ): ReviewField => ({
    key,
    label,
    value: "",
    kind: options.kind ?? "text",
    status: "누락",
    source: "직접 입력",
    confidence: "미측정",
    comment: options.comment ?? `${label} 필수 Trigger 필드입니다.`,
    tone: "danger",
    unit: options.unit,
    required: true,
  })
  const warning = (
    key: string,
    label: string,
    value: string,
    options: Partial<
      Pick<ReviewField, "kind" | "comment" | "unit" | "required">
    > = {}
  ): ReviewField => ({
    key,
    label,
    value,
    kind: options.kind ?? "text",
    status: "확인 필요",
    source: "추출 필드",
    confidence: "신뢰도 중간",
    comment: options.comment ?? "원문과 한 번 더 대조해 주세요.",
    tone: "warning",
    unit: options.unit,
    required: options.required ?? true,
    warningOnly: true,
  })
  const parties: ReviewField[] = [
    extracted("buyer", "Buyer", "HRM Corporation", {
      comment: "거래처 학습 후보입니다.",
      required: documentType === "SC",
    }),
    extracted("seller", "Seller", "KATAMAN ASIA-PACIFIC PTE LTD", {
      comment: "거래처 학습 후보입니다.",
      required: documentType === "SC",
    }),
  ]
  if (documentType === "BL") {
    return [
      ...parties,
      extracted("bl_number", "B/L 번호", "HMM-014W-2607"),
      extracted("container_number", "컨테이너 번호", "HMMU-2607014"),
      extracted("etd", "ETD", "2026-07-27", { kind: "date" }),
      missing("eta", "ETA", { kind: "date" }),
      extracted("quantity", "수량", "20", { unit: "MT" }),
      extracted("vessel", "선박/항차", "HMM Green / 014W", {
        comment: "선적 일정과 일치합니다.",
        required: false,
      }),
      warning("port", "도착항", "Incheon, Korea", {
        comment: "항구 표준명 확인을 권장하지만 진행을 막지 않습니다.",
        required: false,
      }),
    ]
  }
  if (documentType === "PL") {
    return [
      ...parties,
      extracted("invoice_number", "Invoice No.", "INV-2026-0703"),
      extracted("quantity", "수량", "20", { unit: "MT" }),
      missing("gross_weight", "총중량", { kind: "number", unit: "KG" }),
      extracted("packing_number", "포장번호", "PL-2026-0707", {
        comment: "포장명세서 식별 정보입니다.",
        required: false,
      }),
    ]
  }
  if (documentType === "SC") {
    return [
      ...parties,
      extracted("sc_number", "SC No.", "SC-2026-0708"),
      extracted("item_name", "품목", "Aluminium Scrap"),
      extracted("quantity", "수량", "20", { unit: "MT" }),
      extracted("unit_price", "단가", "128,333", { unit: "USD/MT" }),
      extracted("contract_date", "계약일", "2026-07-07", {
        kind: "date",
        comment: "원문 날짜를 ISO 형식으로 변환했습니다.",
        required: false,
      }),
    ]
  }
  if (documentType === "PO") {
    return [
      ...parties,
      extracted("po_number", "PO No.", "PO-260704-18"),
      extracted("counterparty", "거래처", "ACME GmbH"),
      extracted("item_name", "품목", "Aluminium Scrap"),
      extracted("quantity", "수량", "20", { unit: "MT" }),
      missing("unit_price", "단가", { kind: "money", unit: "USD/MT" }),
      missing("etd", "Target ETD", { kind: "date" }),
    ]
  }
  if (documentType === "CI") {
    return [
      ...parties,
      extracted("invoice_number", "Invoice No.", "INV-2026-0703"),
      extracted("invoice_date", "송장일", "2026-04-24", { kind: "date" }),
      extracted("item_name", "품목", "Aluminium Scrap"),
      {
        key: "quantity",
        label: "수량",
        value: "1,250",
        kind: "text",
        status: "오류 · 단위 불일치",
        source: "추출 필드",
        confidence: "원문 불일치",
        comment: "발주서 단위 BOX와 일치하지 않습니다.",
        tone: "danger",
        unit: "PCS",
        required: true,
      },
      warning("unit_price", "단가", "12.80", {
        kind: "money",
        unit: "USD",
        comment: "원문 인식값 12.B0와 비교가 필요합니다.",
      }),
      extracted("total_amount", "합계 금액", "4,620,000", {
        kind: "money",
        unit: "USD",
      }),
      missing("payment_due_date", "결제 예정일", { kind: "date" }),
      extracted(
        "payment_terms",
        "Payment",
        "10% advance, balance against copies",
        { comment: "지급조건 표현을 원문에서 확인했습니다.", required: false }
      ),
    ]
  }
  if (documentType === "PI") {
    return [
      ...parties,
      extracted("invoice_number", "Invoice No.", "PI-2026-0708"),
      extracted("supplier", "공급자", "KATAMAN ASIA-PACIFIC PTE LTD"),
      extracted("total_amount", "합계 금액", "2,566,660", {
        kind: "money",
        unit: "USD",
      }),
    ]
  }
  if (documentType === "AN") {
    return [
      ...parties,
      extracted("bl_number", "B/L 번호", "HMM-014W-2607"),
      extracted("container_number", "컨테이너 번호", "HMMU-2607014"),
      missing("freight_charge_term", "운임 부담 조건"),
    ]
  }
  if (documentType === "C/O") {
    return [
      extracted("certificate_number", "증명서 번호", "CO-2026-0708"),
      extracted("country_of_origin", "원산지", "Australia"),
      missing("hs_code", "HS Code"),
    ]
  }
  if (documentType === "CUSTOMS_ENTRY") {
    return [
      extracted("customs_number", "신고번호", "IMP-2026-0708"),
      extracted("item_name", "품목", "Aluminium Scrap"),
      extracted("customs_duty", "관세액", "24,000", {
        kind: "money",
        unit: "USD",
      }),
      extracted("vat", "부가세", "2,400", {
        kind: "money",
        unit: "USD",
      }),
      missing("clearance_date", "통관일", { kind: "date" }),
    ]
  }
  if (
    documentType === "FREIGHT_INVOICE" ||
    documentType === "INSURANCE_CERTIFICATE" ||
    documentType === "CUSTOMS_DECLARATION"
  ) {
    return [
      ...parties,
      extracted("total_amount", "합계 금액", "72,000", {
        kind: "money",
        unit: "USD",
      }),
    ]
  }
  if (documentType === "BANK_STATEMENT") {
    return [
      warning("total_amount", "거래 금액", "380,000", {
        kind: "money",
        unit: "USD",
        required: false,
      }),
      warning("currency", "통화", "USD", { required: false }),
      warning("counterparty", "거래처", "ACME GmbH", { required: false }),
    ]
  }
  return [
    ...parties,
    missing("document_number", "문서번호", {
      comment: `${documentType} 문서의 식별 번호를 확인해 주세요.`,
    }),
    warning("document_date", "문서일", "2026-07-08", {
      kind: "date",
      comment: "선택한 문서 유형 기준으로 날짜를 다시 검토합니다.",
      required: false,
    }),
  ]
}

export const UPLOAD_DOCUMENT_DEAL_LINKS_STORAGE_KEY =
  "ecoya-prototype-upload-document-deal-links"

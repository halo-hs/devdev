export type DocumentFieldOrigin =
  "AI 추출" | "확정 문서" | "거래값" | "직접 입력" | "입력 대기"
export type DocumentFieldDetail = {
  key: string
  label: string
  value: string
  origin: DocumentFieldOrigin
  evidence: string
}

export type DocumentFieldSet = {
  total: number
  fields: DocumentFieldDetail[]
}

const extracted = (
  file: string,
  page: number,
  key: string,
  label: string,
  value: string
): DocumentFieldDetail => ({
  key,
  label,
  value,
  origin: "AI 추출",
  evidence: `${file} · ${page}p`,
})

export const initialDocumentFields: Record<string, DocumentFieldSet> = {
  PO: {
    total: 18,
    fields: [
      extracted("PO-260704-18.pdf", 1, "po_number", "발주번호", "PO-260704-18"),
      extracted("PO-260704-18.pdf", 1, "buyer", "구매자", "ECOYA Demo Co."),
      extracted(
        "PO-260704-18.pdf",
        1,
        "seller",
        "판매자",
        "KATAMAN ASIA-PACIFIC PTE LTD"
      ),
      extracted(
        "PO-260704-18.pdf",
        1,
        "goods",
        "품목",
        "Aluminium Scrap Tough Taboo"
      ),
      extracted("PO-260704-18.pdf", 1, "quantity", "수량", "20 MT"),
      extracted("PO-260704-18.pdf", 1, "unit_price", "단가", "120,000 USD/MT"),
      extracted("PO-260704-18.pdf", 1, "amount", "총액", "2,400,000 USD"),
      extracted("PO-260704-18.pdf", 2, "incoterms", "인코텀즈", "CIF Incheon"),
      extracted("PO-260704-18.pdf", 2, "etd", "요청 선적일", "2026-07-20"),
    ],
  },
  SC: {
    total: 24,
    fields: [
      extracted(
        "SC-2026-0708.pdf",
        1,
        "contract_number",
        "계약번호",
        "SC-2026-0708"
      ),
      extracted("SC-2026-0708.pdf", 1, "contract_date", "계약일", "2026-07-08"),
      extracted("SC-2026-0708.pdf", 1, "buyer", "매수인", "ACME GmbH"),
      extracted("SC-2026-0708.pdf", 1, "seller", "매도인", "ECOYA Demo Co."),
      extracted(
        "SC-2026-0708.pdf",
        1,
        "goods",
        "품목",
        "Aluminium Scrap Tough Taboo"
      ),
      extracted("SC-2026-0708.pdf", 1, "quantity", "수량", "20 MT"),
      extracted("SC-2026-0708.pdf", 1, "amount", "계약금액", "2,400,000 USD"),
      extracted(
        "SC-2026-0708.pdf",
        2,
        "incoterms",
        "인코텀즈",
        "CIF Incheon, Korea"
      ),
      extracted("SC-2026-0708.pdf", 2, "payment", "지급조건", "T/T 30 days"),
      extracted(
        "SC-2026-0708.pdf",
        2,
        "shipment_date",
        "선적기한",
        "2026-07-20"
      ),
    ],
  },
  CI: {
    total: 21,
    fields: [
      extracted(
        "Invoice_HB-2607-003.pdf",
        1,
        "invoice_number",
        "송장번호",
        "INV-2026-0703"
      ),
      extracted(
        "Invoice_HB-2607-003.pdf",
        1,
        "invoice_date",
        "송장일",
        "2026-07-07"
      ),
      extracted(
        "Invoice_HB-2607-003.pdf",
        1,
        "buyer",
        "구매자",
        "HRM Corporation"
      ),
      extracted(
        "Invoice_HB-2607-003.pdf",
        1,
        "seller",
        "판매자",
        "KATAMAN ASIA-PACIFIC PTE LTD"
      ),
      extracted(
        "Invoice_HB-2607-003.pdf",
        1,
        "goods",
        "품목",
        "Aluminium Scrap Tough Taboo"
      ),
      extracted("Invoice_HB-2607-003.pdf", 1, "quantity", "수량", "20 MT"),
      extracted(
        "Invoice_HB-2607-003.pdf",
        1,
        "amount",
        "송장금액",
        "2,566,000 USD"
      ),
      extracted(
        "Invoice_HB-2607-003.pdf",
        2,
        "payment",
        "지급조건",
        "T/T 30 days"
      ),
      extracted(
        "Invoice_HB-2607-003.pdf",
        2,
        "bank",
        "수취은행",
        "JPMorgan Chase Singapore"
      ),
    ],
  },
  PL: {
    total: 16,
    fields: [
      extracted(
        "PackingList_0707.pdf",
        1,
        "packing_number",
        "포장명세번호",
        "PL-2026-0707"
      ),
      extracted(
        "PackingList_0707.pdf",
        1,
        "goods",
        "품목",
        "Aluminium Scrap Tough Taboo"
      ),
      extracted("PackingList_0707.pdf", 1, "quantity", "문서 수량", "16 MT"),
      extracted("PackingList_0707.pdf", 1, "packages", "포장 수", "20 bundles"),
      extracted(
        "PackingList_0707.pdf",
        1,
        "gross_weight",
        "총중량",
        "16,480 KG"
      ),
      extracted("PackingList_0707.pdf", 1, "net_weight", "순중량", "16,000 KG"),
      extracted(
        "PackingList_0707.pdf",
        1,
        "container",
        "컨테이너",
        "1 x 40FT HC"
      ),
      extracted(
        "PackingList_0707.pdf",
        1,
        "marks",
        "화인",
        "KATAMAN / INCHEON"
      ),
    ],
  },
  BL: {
    total: 19,
    fields: [
      {
        key: "bl_number",
        label: "B/L 번호",
        value: "",
        origin: "입력 대기",
        evidence: "연결 문서 없음",
      },
      {
        key: "carrier",
        label: "선사",
        value: "",
        origin: "입력 대기",
        evidence: "연결 문서 없음",
      },
      {
        key: "shipper",
        label: "송하인",
        value: "KATAMAN ASIA-PACIFIC PTE LTD",
        origin: "거래값",
        evidence: "거래처 · 판매자",
      },
      {
        key: "consignee",
        label: "수하인",
        value: "HRM Corporation",
        origin: "확정 문서",
        evidence: "Invoice_HB-2607-003.pdf · 구매자",
      },
      {
        key: "vessel",
        label: "선박명",
        value: "",
        origin: "입력 대기",
        evidence: "연결 문서 없음",
      },
      {
        key: "voyage",
        label: "항차",
        value: "",
        origin: "입력 대기",
        evidence: "연결 문서 없음",
      },
      {
        key: "port_loading",
        label: "선적항",
        value: "Melbourne",
        origin: "거래값",
        evidence: "선적 014W-02",
      },
      {
        key: "port_discharge",
        label: "도착항",
        value: "Busan",
        origin: "거래값",
        evidence: "선적 014W-02",
      },
      {
        key: "quantity",
        label: "선적 수량",
        value: "",
        origin: "입력 대기",
        evidence: "PL 수량 16 MT와 대조 필요",
      },
      {
        key: "etd",
        label: "ETD",
        value: "2026-07-20",
        origin: "거래값",
        evidence: "연결 선적 일정",
      },
      {
        key: "eta",
        label: "ETA",
        value: "2026-08-03",
        origin: "거래값",
        evidence: "연결 선적 일정",
      },
    ],
  },
}

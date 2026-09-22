import { ApiError, apiRequest, DEFAULT_PLATFORM_API_BASE_URL } from "./client";
import { isUuidLike, normalizeUuidDocumentId } from "./erpExtraction";

export { classifyDealMatchFailure } from "./dealMatchFailure";
export type { DealMatchFailureKind } from "./dealMatchFailure";

export type DealStatus = "contract" | "shipment" | "customs" | "settled" | "archived" | "cancelled";

export type DealDirection = "buy" | "sell";

// #249 D-day 타입 — BE 가 '가장 임박한 1개' 날짜의 종류를 함께 내려준다(service deals.go:1509-1511).
// "payment"=결제 / "eta"=입항 예정 / "etd"=출항 예정. d_day(날짜) 없으면 omit → 라벨 미부착.
// FE 는 BE 미러일 뿐 종류를 재계산하지 않는다(goal E1, policies §4-1 모호 → BE earliest-date 책임).
type DdayType = "payment" | "eta" | "etd";

// --- createDeal (POST /trade/deals) ---
export type CreateDealBody = {
  title?: string | null;
  counterparty_name?: string | null;
};

export type DealCreatedResponse = {
  deal_id: string;
  org_id: string;
  status: DealStatus;
  // D3: 사람용 표시 ID DL-YYMMDD-NN(또는 파싱된 식별번호). 발급 전이면 null → UUID 폴백.
  display_id?: string | null;
  title?: string | null;
  counterparty_name?: string | null;
  creator_id?: string | null;
  created_at: string;
};

// --- deal-candidates / AUTO MATCH (GET /trade/docs/:id/deal-candidates) ---
export type DealCandidateMatch = {
  tier: number;
  field: string;
  matched_value: string;
};

export type DealCandidate = {
  deal_id: string;
  counterparty_name?: string | null;
  // D3: 사람용 표시 ID DL-YYMMDD-NN(또는 파싱된 식별번호). title 미발급 deal 은 null → UUID 폴백.
  display_id?: string | null;
  status: DealStatus;
  document_count: number;
  match: DealCandidateMatch;
  // Representative-PO snapshot for the AUTO MATCH row (deal-candidates D1).
  // Sourced LIVE from the deal's latest PO document, NOT a frozen
  // deals.etd_target snapshot (that column does not exist in the backend; the
  // spec's `deals.etd_target` reference is accepted as canonical imprecision per
  // the FE-first contract review). All four are null together when the deal has
  // no PO document → the AUTO MATCH table renders "—".
  po_number?: string | null;
  etd?: string | null; // ISO date "YYYY-MM-DD", or null when no PO document.
  // decimal serialized as string — never coerce to number (precision loss).
  amount_total?: string | null;
  currency?: string | null;
};

// Server-side OD-002 auto-link attestation (backend PR #1162, closing
// backend#1143 / frontend#635). Evaluated against every deal in the org/access
// scope — NOT just the ranked `candidates` above, which stays capped at 5 and
// is produced by a narrower, different tier1/2/3 rule (see
// confirmDealMatch.ts for why the two can diverge). trade.DealCandidatesResponse
// (backend handler/trade/deal_candidates.go): auto_link_eligible is a plain
// `bool` (no `omitempty`) — always present on the wire. The other three are
// `*string` with `omitempty`: auto_link_deal_id/auto_link_match_key accompany
// eligible=true; auto_link_reason accompanies eligible=false. auto_link_reason
// is an open string on the wire (no swagger enum) even though the backend
// only emits one of three values today — widened here so an unrecognized
// future value still type-checks instead of breaking the build.
//
// auto_link_eligible is typed optional here (unlike the wire promise) rather
// than required: apiRequest<T>() never runtime-validates a response against
// T, so a `required` TS field buys no actual safety against a real payload
// that omits it — only against hand-authored test literals, of which dozens
// already exist across this codebase predating this field and exercise
// unrelated behavior. The real fail-closed guarantee lives in
// confirmDealMatch.ts's readAutoLinkVerdict, which treats missing/undefined
// identically to a violated "required" — every caller must go through it
// rather than trust this field's presence directly.
export type AutoLinkIneligibleReason = "composite_incomplete" | "no_match" | "multiple_candidates";

export type DealCandidatesResponse = {
  candidates: DealCandidate[];
  auto_link_eligible?: boolean;
  auto_link_deal_id?: string | null;
  auto_link_match_key?: string | null;
  auto_link_reason?: AutoLinkIneligibleReason | (string & {}) | null;
};

// --- getDeal / DealAggregateResponse (GET /trade/deals/:deal_id) ---
export type DealDocumentSlot = {
  doc_code: string;
  label: string;
  present: boolean;
  state: "complete" | "partial" | "missing" | (string & {});
  // trade_documents.id - used by trade assign/candidate endpoints.
  doc_id?: string | null;
  // erp_documents.id - used by ERP extraction/confirm endpoints.
  erp_document_id?: string | null;
  // Loop B generated_documents.id when this slot is satisfied by an issued doc.
  generated_doc_id?: string | null;
  // "received" (Loop A inbox) | "issued" (Loop B confirm/send).
  source?: "received" | "issued" | (string & {});
  issued_at?: string | null;
  // backend `json:"summary,omitempty"` on a non-pointer string → field absent when empty.
  summary?: string;
};

export type DealNextAction = {
  code: string;
  label: string;
  severity: string;
};

export type GeneratedDocsSummary = {
  draft_count: number;
  confirmed_count: number;
  sent_count: number;
  latest_doc_number?: string | null;
};

export type NextDocumentGuidance = {
  code: string;
  doc_code?: string;
  label: string;
  kind: "upload" | "create" | "confirm" | "deliver" | "reconcile" | "link" | (string & {});
  loop?: "received" | "issued" | (string & {});
  severity: string;
};

export type DealMatchResponse = {
  data_as_of: string;
  deal_id: string;
  documents: DealDocumentSlot[];
  org_id: string;
  rows: MatchRow[];
};

function isDealMatchResponse(value: unknown, requestedDealId: string): value is DealMatchResponse {
  if (typeof value !== "object" || value === null) return false;

  const response = value as Record<string, unknown>;
  if (
    typeof response.data_as_of !== "string" ||
    typeof response.deal_id !== "string" ||
    response.deal_id !== requestedDealId ||
    typeof response.org_id !== "string" ||
    !Array.isArray(response.documents) ||
    !Array.isArray(response.rows)
  ) {
    return false;
  }

  for (const item of response.documents) {
    if (typeof item !== "object" || item === null) return false;
    const document = item as Record<string, unknown>;
    if (
      typeof document.doc_code !== "string" ||
      typeof document.label !== "string" ||
      typeof document.state !== "string" ||
      typeof document.present !== "boolean"
    ) {
      return false;
    }
    for (const key of ["doc_id", "erp_document_id", "generated_doc_id", "issued_at"] as const) {
      if (
        Object.prototype.hasOwnProperty.call(document, key) &&
        document[key] !== null &&
        typeof document[key] !== "string"
      ) {
        return false;
      }
    }
    for (const key of ["source", "summary"] as const) {
      if (Object.prototype.hasOwnProperty.call(document, key) && typeof document[key] !== "string") {
        return false;
      }
    }
  }

  for (const item of response.rows) {
    if (typeof item !== "object" || item === null) return false;
    const row = item as Record<string, unknown>;
    if (
      typeof row.field !== "string" ||
      typeof row.label !== "string" ||
      typeof row.status !== "string" ||
      !Array.isArray(row.cells) ||
      (Object.prototype.hasOwnProperty.call(row, "note") && typeof row.note !== "string")
    ) {
      return false;
    }
    for (const item of row.cells) {
      if (typeof item !== "object" || item === null) return false;
      const cell = item as Record<string, unknown>;
      if (
        typeof cell.doc_code !== "string" ||
        typeof cell.present !== "boolean" ||
        (Object.prototype.hasOwnProperty.call(cell, "value") && typeof cell.value !== "string")
      ) {
        return false;
      }
    }
  }

  return true;
}
type DealExtractionFieldGrade = "trigger" | "standard" | "optional";

export type DealExtractionFieldRow = {
  // BE confirmed_fields[].field_id — PATCH /trade/deals/:id/extraction-fields/:field_id 타겟.
  field_id: string;
  field_name: string;
  display_label: string;
  value: string | null;
  suggested_value: string | null;
  confidence: number | null;
  document_id: string | null;
  source_page: number | null;
  grade: DealExtractionFieldGrade;
  doc_type: string;
  target_table?: string | null;
  // 확정 후 인라인 수정 여부(§2.2.1 [수정됨] 배지 ↔ 출처칩 상호배타 트리거).
  modified_after_confirm?: boolean;
  // AI 최초 파싱 원본값(=BE suggested_value). [수정됨] tooltip "AI 원본: {value}".
  ai_original?: string | null;
};

// PATCH /trade/deals/:deal_id/extraction-fields/:field_id 응답(§2.2.1 단일 필드 즉시 저장).
type ConfirmedFieldAudit = {
  post_confirm_edited_at: string;
  post_confirm_edited_by: string;
  change_reason?: string | null;
};

export type ConfirmedExtractionFieldResponse = {
  field_id: string;
  value: string | null;
  modified_after_confirm: boolean;
  ai_original: string | null;
  document_revision: number;
  replayed: boolean;
  audit: ConfirmedFieldAudit;
};

export type ConfirmedFieldChangeReason =
  | "ai_extraction_error"
  | "source_document_error"
  | "updated_information"
  | "partner_renegotiation"
  | "other";

export type PatchConfirmedFieldBody = {
  expected_value: string | null;
  current_value: string | null;
  change_reason: ConfirmedFieldChangeReason;
};

export type DismissedRisk = {
  risk_type: string;
  reason_code: string;
  reason_note?: string | null;
  reference_document?: string | null;
  dismissed_at: string;
};

export type DealAggregateResponse = {
  deal_id: string;
  org_id: string;
  data_as_of: string;
  status: DealStatus;
  title?: string | null;
  title_user_modified: boolean;
  counterparty_name?: string | null;
  // D3: 사람용 표시 ID(DL-YYMMDD-NN 또는 파싱 식별번호). 미발급 시 null → UUID 폴백.
  display_id?: string | null;
  assignee_id?: string | null;
  assignee_name?: string | null;
  creator_id?: string | null;
  archived_at?: string | null;
  document_count?: number | null;
  pending_count?: number | null;
  item_name?: string | null;
  incoterms: string;
  currency: string;
  // decimal serialized as string — never coerce to number (precision loss).
  amount_total: string;
  // D5: 대표 PO 헤더(latest PO 문서 파생). PO 문서 없으면 둘 다 null. etd=ISO date YYYY-MM-DD.
  // R4 사전배정(from=deal) 카드 소비 예정 — 현재 렌더 없음(타입 계약만).
  po_number?: string | null;
  etd?: string | null;
  direction?: DealDirection | null;
  payment_method?: string | null;
  next_eta?: string | null;
  shipment_status?: string | null;
  shipment_count?: number;
  // BE PR#1073(#1066): 서버 계산 정산 분류 — payment-obligation classification,
  // deal status와 별개. 미지 값 방어를 위해 string 폴백 유지.
  settlement_status?: "pending_definition" | "not_applicable" | "in_progress" | "settled" | string;
  receivable?: string;
  payable?: string;
  revenue?: string;
  cost?: string;
  margin?: string;
  margin_pct?: string | null;
  pl_currency?: string;
  pl_currency_mixed?: boolean;
  required_docs?: { doc_code: string; label: string; present: boolean }[];
  required_docs_missing?: number;
  order_state?: "open" | "fulfilled" | "over_shipped" | string;
  order_contracted_qty?: string;
  order_shipped_qty?: string;
  order_remaining_qty?: string;
  order_lifecycle_status?: "open" | "closed" | "short_closed" | "cancelled" | string;
  order_closed_at?: string;
  order_close_reason?: string;
  opened_at: string;
  documents: DealDocumentSlot[];
  next_actions: DealNextAction[];
  next_document?: NextDocumentGuidance | null;
  // Optional by contract: omission means generated-document counts are unknown, not zero.
  generated_docs_summary?: GeneratedDocsSummary;
  risks: string[];
  d_day?: string | null;
  // #249: d_day 종류(payment/eta/etd). d_day omit 이면 함께 omit. 미지값은 라벨 미부착(델타-only).
  d_day_type?: DdayType | (string & {}) | null;
  dismissed_risks?: DismissedRisk[] | null;
  confirmed_fields?: DealExtractionFieldRow[] | null;
};

// --- listDeals (GET /trade/deals) ---
export type DealSummaryResponse = {
  deal_id: string;
  org_id: string;
  status: DealStatus;
  title?: string | null;
  counterparty_name?: string | null;
  assignee_id?: string | null;
  assignee_name?: string | null;
  archived_at?: string | null;
  // 아카이브 행 "삭제한 사람" 표시. BE handler/trade/deals.go:129/633 DTO + service:437/477
  // populateArchivedByNames 가 제공(#229 해소). 발급 전/탈퇴 멤버면 null → "—" 폴백.
  archived_by_name?: string | null;
  // decimal serialized as string — never coerce to number (precision loss).
  amount_total?: string | null;
  amount_source_document_id?: string;
  amount_source_status?: string;
  amount_source_doc_type?: string;
  currency?: string | null;
  item_name?: string | null;
  po_number?: string | null;
  display_id?: string | null;
  document_count?: number | null;
  pending_count?: number | null;
  data_as_of?: string;
  risks: string[];
  d_day?: string | null;
  // #249: d_day 종류(payment/eta/etd). d_day omit 이면 함께 omit. 미지값은 라벨 미부착(델타-only).
  d_day_type?: DdayType | (string & {}) | null;
  shared?: boolean;
  share_reason?: "member" | "deal" | string | null;
  confirmed_document_count?: number | null;
  pending_document_count?: number | null;
  next_eta?: string | null;
  overdue_ar?: boolean;
  order_state?: "open" | "fulfilled" | "over_shipped" | string;
  order_contracted_qty?: string | null;
  order_shipped_qty?: string | null;
  order_remaining_qty?: string | null;
  order_quantity_unit?: string;
  order_quantity_reason?: string;
  order_lifecycle_status?: "open" | "closed" | "short_closed" | "cancelled" | string;
  currency_mixed?: boolean;
  next_document?: NextDocumentGuidance | null;
};

type DealsListSummary = {
  total: number;
  by_status: Record<string, number>;
  at_risk: number;
  d_day_soon: number;
  pending?: number | null;
};

type DealsListMeta = {
  page: number;
  page_size: number;
  page_count: number;
  filtered_total: number;
  scope_total: number;
  summary: DealsListSummary;
  document_status_counts: Record<string, number>;
};

export type DealsListResponse = {
  items: DealSummaryResponse[];
  meta: DealsListMeta;
  page?: number;
  limit?: number;
  total?: number;
};

const DEALS_SORT_TOKENS = {
  amount: "-amount_total",
  amountLow: "amount_total",
  counterpartName: "counterpart_name",
  createdAt: "created_at",
  dday: "d_day",
  severity: "severity",
  updated: "-data_as_of",
} as const;

export type DealsSort = keyof typeof DEALS_SORT_TOKENS;
type DealsListSort = (typeof DEALS_SORT_TOKENS)[DealsSort] | "data_as_of" | "amount_total" | "-d_day" | "status" | "-status";

export function mapDealsSortToBackend(sort: DealsSort): (typeof DEALS_SORT_TOKENS)[DealsSort] {
  return DEALS_SORT_TOKENS[sort];
}

export type ListDealsParams = {
  scope?: "all";
  /** Bounded current-page lookup. Backend applies canonical role/share visibility first. */
  dealIds?: string[];
  status?: DealStatus;
  dateFrom?: string;
  dateTo?: string;
  assigneeId?: string;
  // #231 서버측 필터 (BE handler/trade/deals.go:346-374; swagger 미문서이나 코드가 정본).
  // counterparty/assignee 는 repeatable, BE 가 case-insensitive contains/센티넬로 처리.
  counterparty?: string[];
  assignee?: string[];
  pending?: boolean;
  includeArchived?: boolean;
  atRiskOnly?: boolean;
  dDaySoonOnly?: boolean;
  q?: string;
  sort?: DealsListSort;
  page?: number;
  pageSize?: number;
};

type ListDealsOptions = {
  signal?: AbortSignal;
};

// --- searchDeal (GET /trade/deals/:deal_id/search?q=keyword) ---
export type DealSearchResult = {
  document_id: string;
  doc_type: string;
  field_name: string;
  display_label: string;
  value: string;
  target_table: string;
};

export type DealSearchResponse = {
  items: DealSearchResult[];
};

type RawDealSearchResult = Omit<DealSearchResult, "display_label"> & {
  display_label?: string | null;
};

type RawDealSearchResponse = {
  items?: RawDealSearchResult[] | null;
};

// --- listDealRisks (GET /trade/deals/:deal_id/risks) ---
export type DealRiskConflictingField = {
  field: string;
  source: string;
  value: string;
};

export type RiskDetailItem = {
  type: string;
  label: string;
  detail?: string | null;
  severity?: string | null;
  status?: string | null;
  conflicting_fields?: DealRiskConflictingField[] | null;
  related_chip_ids?: string[] | null;
  dismiss_reason?: string | null;
  dismissed_at?: string | null;
  dismissed_by?: string | null;
};

export type ListDealRisksParams = {
  status?: "dismissed" | string;
};

// --- assignDocument (POST /trade/deals/:deal_id/documents) ---
export type AssignDocumentBody = {
  document_id: string;
  reason?: string;
};

type PatchDealTitleBody = {
  title: string;
};

type PatchDealDirectionBody = {
  direction: DealDirection;
};

export type PatchDealDirectionResponse = {
  deal_id: string;
  direction: DealDirection;
};

function apiPath(path: string): string {
  return typeof window !== "undefined" ? `/api/platform${path}` : `/api/v1${path}`;
}

function apiBaseUrl(): string | undefined {
  return typeof window !== "undefined" ? "" : DEFAULT_PLATFORM_API_BASE_URL;
}

export function buildDealsQuery(params: ListDealsParams = {}): string {
  const query = new URLSearchParams();

  if (params.scope) query.set("scope", params.scope);
  if (params.dealIds) {
    for (const value of params.dealIds) {
      const trimmed = value.trim();
      if (trimmed) query.append("dealId", trimmed);
    }
  }
  if (params.status) query.set("status", params.status);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);
  if (params.assigneeId) query.set("assigneeId", params.assigneeId);
  if (params.counterparty) {
    for (const value of params.counterparty) {
      const trimmed = value.trim();
      if (trimmed) query.append("counterparty", trimmed);
    }
  }
  if (params.assignee) {
    for (const value of params.assignee) {
      const trimmed = value.trim();
      if (trimmed) query.append("assignee", trimmed);
    }
  }
  if (typeof params.includeArchived === "boolean") query.set("includeArchived", String(params.includeArchived));
  if (params.atRiskOnly) query.set("atRiskOnly", "true");
  if (params.dDaySoonOnly) query.set("dDaySoonOnly", "true");
  // tri-state: FE 는 ON 일 때만 전송(미설정=전체). pending=false(반대 필터)는 보내지 않는다.
  if (params.pending) query.set("pending", "true");
  if (params.q?.trim()) query.set("q", params.q.trim());
  if (params.sort) query.set("sort", params.sort);
  if (typeof params.page === "number" && Number.isFinite(params.page) && params.page > 0) {
    query.set("page", String(Math.floor(params.page)));
  }
  if (typeof params.pageSize === "number" && Number.isFinite(params.pageSize) && params.pageSize > 0) {
    query.set("pageSize", String(Math.floor(params.pageSize)));
  }

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export function normalizeUuidDealId(dealId: string): string {
  const normalizedDealId = dealId.trim().toLowerCase();

  if (!isUuidLike(normalizedDealId)) {
    throw new ApiError({
      code: "TRADE_DEAL_INVALID_DEAL_ID",
      message: "deal_id must be a UUID",
      status: 400,
    });
  }

  return normalizedDealId;
}

export function normalizeUuidFieldId(fieldId: string): string {
  const normalizedFieldId = fieldId.trim().toLowerCase();

  if (!isUuidLike(normalizedFieldId)) {
    throw new ApiError({
      code: "TRADE_DEAL_INVALID_FIELD_ID",
      message: "field_id must be a UUID",
      status: 400,
    });
  }

  return normalizedFieldId;
}

export async function getDealNumberRecommendation(getIdToken: () => Promise<string>): Promise<{ title: string }> {
  return apiRequest<{ title: string }>(apiPath("/trade/deals/number-recommendation"), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: { cache: "no-store" },
  });
}

export async function createDeal(
  body: CreateDealBody,
  getIdToken: () => Promise<string>,
): Promise<DealCreatedResponse> {
  return apiRequest<DealCreatedResponse>(apiPath("/trade/deals"), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: {
      body: JSON.stringify(body),
      method: "POST",
    },
  });
}

export async function listDeals(
  getIdToken: () => Promise<string>,
  params?: ListDealsParams,
  options: ListDealsOptions = {},
): Promise<DealsListResponse> {
  const init = options.signal ? { signal: options.signal } : undefined;
  const response = await apiRequest<DealsListResponse>(apiPath(`/trade/deals${buildDealsQuery(params)}`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    ...(init ? { init } : {}),
  });

  // erp-v2-adapt: begin platform list rows expose total/pending counts under non-canon field names.
  return {
    ...response,
    items: response.items.map((item) => {
      const pendingDocumentCount = item.pending_document_count ?? item.pending_count;
      const confirmedDocumentCount = item.confirmed_document_count ?? (
        typeof item.document_count === "number" && typeof pendingDocumentCount === "number"
          ? Math.max(0, item.document_count - pendingDocumentCount)
          : undefined
      );

      return {
        ...item,
        confirmed_document_count: confirmedDocumentCount,
        pending_document_count: pendingDocumentCount,
      };
    }),
  };
  // erp-v2-adapt: end
}

// --- getDealsSummary (GET /trade/deals/summary) — admin KPI 집계 ---
// 주의: 이 응답은 거래 수/금액 집계(open/closed/total + value)이며, Deals 목록의
// SummaryBanner(대기/리스크/D-day 카운트)와는 다른 모양이다(백엔드 DTO 갭, #178 LIST-3).
// Home owner 변형의 "전체 거래" 지표에 total_deals 를 쓴다.
export type DealsSummaryResponse = {
  total_deals: number;
  open_deals: number;
  closed_deals: number;
  total_value_usd: number;
  total_value_krw: number;
  data_as_of: string;
};

export async function getDealsSummary(
  getIdToken: () => Promise<string>,
): Promise<DealsSummaryResponse> {
  return apiRequest<DealsSummaryResponse>(apiPath("/trade/deals/summary"), {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
}

export async function listDealCandidates(
  documentId: string,
  getIdToken: () => Promise<string>,
): Promise<DealCandidatesResponse> {
  const normalizedDocumentId = encodeURIComponent(normalizeUuidDocumentId(documentId));

  return apiRequest<DealCandidatesResponse>(apiPath(`/trade/docs/${normalizedDocumentId}/deal-candidates`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
}

export async function assignDocumentToDeal(
  dealId: string,
  documentId: string,
  getIdToken: () => Promise<string>,
  reason?: string,
): Promise<void> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));
  const trimmedReason = reason?.trim();
  const body: AssignDocumentBody = {
    document_id: normalizeUuidDocumentId(documentId),
    ...(trimmedReason ? { reason: trimmedReason } : {}),
  };

  return apiRequest<void>(apiPath(`/trade/deals/${normalizedDealId}/documents`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: {
      body: JSON.stringify(body),
      method: "POST",
    },
  });
}

// BE #1077: the typed financial rows an unlink will clear from the deal —
// PO/SC/invoice amounts keyed by (source, currency), plus a document
// revision token. `deal_amount_delta` is the signed change to the deal's
// total once the unlink lands (server-computed, never re-derived here).
export type DocumentUnlinkAmountImpact = {
  source: string;
  currency: string;
  amount: string;
  deal_amount_delta: string;
  row_count: number;
  revision: string;
};

export type DocumentUnlinkImpact = {
  document_revision: string;
  amounts: DocumentUnlinkAmountImpact[];
};

// Server-owned approval artifact (internal/service/trade/dealstatus
// DocumentUnlinkPreview). The client only ever sends preview_id back on the
// DELETE that executes the unlink — digest/impact are display data, never an
// execution input a caller can replay.
export type DocumentUnlinkPreview = {
  preview_id: string;
  deal_id: string;
  document_id: string;
  digest: string;
  issued_at: string;
  expires_at: string;
  impact: DocumentUnlinkImpact;
};

export async function createDocumentUnlinkPreview(
  dealId: string,
  documentId: string,
  getIdToken: () => Promise<string>,
): Promise<DocumentUnlinkPreview> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));
  const normalizedDocumentId = encodeURIComponent(normalizeUuidDocumentId(documentId));

  return apiRequest<DocumentUnlinkPreview>(
    apiPath(`/trade/deals/${normalizedDealId}/documents/${normalizedDocumentId}/unlink-preview`),
    {
      baseUrl: apiBaseUrl(),
      getIdToken,
      init: { method: "POST" },
    },
  );
}

// previewId is optional for compatibility with any other caller, but every
// site in this codebase should supply the preview_id from
// createDocumentUnlinkPreview — the backend revalidates it against a fresh
// digest before writing and 409s (LIFECYCLE_PREVIEW_STALE) if the impact
// moved since the preview was issued.
export async function unassignDocumentFromDeal(
  dealId: string,
  documentId: string,
  reason: string,
  getIdToken: () => Promise<string>,
  previewId?: string,
): Promise<void> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));
  const normalizedDocumentId = encodeURIComponent(normalizeUuidDocumentId(documentId));
  const body: { reason: string; preview_id?: string } = {
    reason,
    ...(previewId ? { preview_id: previewId } : {}),
  };

  return apiRequest<void>(apiPath(`/trade/deals/${normalizedDealId}/documents/${normalizedDocumentId}`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: {
      body: JSON.stringify(body),
      method: "DELETE",
    },
  });
}

// BE #1076: atomic undo of one specific unlink event. eventId is the
// document_events.id the FE already has on the corresponding
// document_unlinked DealHistoryItem (`item.id`) — a server-issued token
// identifying the exact unlink to reverse. The backend verifies that event is
// still the document's current link state before restoring it; a 409 means
// the document has moved on (relinked elsewhere, or already undone) and the
// caller must reload rather than retry blindly.
export async function undoUnassignDocument(
  dealId: string,
  documentId: string,
  eventId: string,
  getIdToken: () => Promise<string>,
  reason?: string,
): Promise<void> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));
  const normalizedDocumentId = encodeURIComponent(normalizeUuidDocumentId(documentId));
  const trimmedReason = reason?.trim();
  const body: { event_id: string; reason?: string } = {
    event_id: eventId,
    ...(trimmedReason ? { reason: trimmedReason } : {}),
  };

  return apiRequest<void>(apiPath(`/trade/deals/${normalizedDealId}/documents/${normalizedDocumentId}/undo-unlink`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: {
      body: JSON.stringify(body),
      method: "POST",
    },
  });
}

export async function getDeal(
  dealId: string,
  getIdToken: () => Promise<string>,
  options?: { includeDismissed?: boolean },
): Promise<DealAggregateResponse> {
  const normalizedDealId = normalizeUuidDealId(dealId);
  const encodedDealId = encodeURIComponent(normalizedDealId);
  const query = options?.includeDismissed ? "?include=dismissed" : "";

  return apiRequest<DealAggregateResponse>(apiPath(`/trade/deals/${encodedDealId}${query}`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
}

export async function getDealMatch(
  dealId: string,
  getIdToken: () => Promise<string>,
): Promise<DealMatchResponse> {
  const normalizedDealId = normalizeUuidDealId(dealId);

  const response = await apiRequest<unknown>(apiPath(`/trade/deals/${encodeURIComponent(normalizedDealId)}/match`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
  if (!isDealMatchResponse(response, normalizedDealId)) {
    throw new ApiError({
      code: "API_INVALID_RESPONSE",
      message: "Platform API returned an invalid deal match",
      status: 502,
    });
  }
  return response;
}

export async function searchDeal(
  dealId: string,
  keyword: string,
  getIdToken: () => Promise<string>,
): Promise<DealSearchResponse> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));
  const trimmedKeyword = keyword.trim();

  if (!trimmedKeyword) {
    throw new ApiError({
      code: "TRADE_DEAL_SEARCH_EMPTY_QUERY",
      message: "search keyword must not be blank",
      status: 400,
    });
  }

  const response = await apiRequest<RawDealSearchResponse>(
    apiPath(`/trade/deals/${normalizedDealId}/search?q=${encodeURIComponent(trimmedKeyword)}`),
    {
      baseUrl: apiBaseUrl(),
      getIdToken,
    },
  );
  return {
    items: (response.items ?? []).map((item) => ({
      ...item,
      display_label: item.display_label?.trim() || item.field_name,
    })),
  };
}

export async function listDealRisks(
  dealId: string,
  getIdToken: () => Promise<string>,
  params: ListDealRisksParams = {},
): Promise<RiskDetailItem[]> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));
  const query = new URLSearchParams();
  if (params.status?.trim()) query.set("status", params.status.trim());
  const queryString = query.toString();

  return apiRequest<RiskDetailItem[]>(
    apiPath(`/trade/deals/${normalizedDealId}/risks${queryString ? `?${queryString}` : ""}`),
    {
      baseUrl: apiBaseUrl(),
      getIdToken,
    },
  );
}

// --- createFlag (POST /erp/flags) — DD-1 ---
// Backend CreateFlagBody (origin/develop internal/handler/erp/flags.go):
//   { deal_id?: uuid, document_id?: uuid, note: string, category?: string }
// note is required; at least one of deal_id / document_id must be present.
export type CreateFlagBody = {
  deal_id?: string | null;
  document_id?: string | null;
  note: string;
  category?: string | null;
};

export type FlagResponse = {
  id: string;
  org_id: string;
  deal_id?: string | null;
  document_id?: string | null;
  reporter_user_id?: string | null;
  note: string;
  category?: string | null;
  owner_checked: boolean;
  checked_by?: string | null;
  checked_at?: string | null;
  created_at: string;
  updated_at: string;
};

// --- dismissDealRisk (POST /trade/deals/:deal_id/risks/:risk_type/dismiss) — DD-3 ---
// Backend DismissRiskRequest (origin/develop internal/handler/trade/dismiss.go):
//   { reason_code: string, reason_note?: string, reference_document?: string }
// reason_code ∈ prearranged | within_tolerance | internal_schedule | other.
// reason_note is required iff reason_code === "other" (else must be empty).
// reference_document is required upstream for price_variance and qty_mismatch.
// 409 RISK_NOT_ACTIVE when the risk is not currently firing.
export type DismissRiskReasonCode =
  | "prearranged"
  | "within_tolerance"
  | "internal_schedule"
  | "other";

export type DismissRiskBody = {
  reason_code: DismissRiskReasonCode;
  reason_note?: string;
  reference_document?: string;
};

export async function createFlag(
  body: CreateFlagBody,
  getIdToken: () => Promise<string>,
): Promise<FlagResponse> {
  return apiRequest<FlagResponse>(apiPath("/erp/flags"), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: {
      body: JSON.stringify(body),
      method: "POST",
    },
  });
}

export async function dismissDealRisk(
  dealId: string,
  riskType: string,
  body: DismissRiskBody,
  getIdToken: () => Promise<string>,
): Promise<void> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));
  const normalizedRiskType = encodeURIComponent(riskType.trim().toLowerCase());

  return apiRequest<void>(
    apiPath(`/trade/deals/${normalizedDealId}/risks/${normalizedRiskType}/dismiss`),
    {
      baseUrl: apiBaseUrl(),
      getIdToken,
      init: {
        body: JSON.stringify(body),
        method: "POST",
      },
    },
  );
}

export async function restoreDealRisk(
  dealId: string,
  riskType: string,
  getIdToken: () => Promise<string>,
): Promise<void> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));
  const normalizedRiskType = encodeURIComponent(riskType.trim().toLowerCase());

  try {
    await apiRequest<void>(
      apiPath(`/trade/deals/${normalizedDealId}/risks/${normalizedRiskType}/dismiss`),
      {
        baseUrl: apiBaseUrl(),
        getIdToken,
        init: { method: "DELETE" },
      },
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 409 && error.code === "DISMISSAL_NOT_ACTIVE") {
      return;
    }
    throw error;
  }
}

export async function patchDealAssignee(
  dealId: string,
  assigneeId: string | null,
  getIdToken: () => Promise<string>,
): Promise<void> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));

  return apiRequest<void>(apiPath(`/trade/deals/${normalizedDealId}/assignee`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: {
      body: JSON.stringify({ assignee_id: assigneeId }),
      method: "PATCH",
    },
  });
}

// §2.2.1 DetailPanel 확정필드 인라인 수정 — 단일 필드 즉시 저장(배치 없음).
// 409(ErrConfirmedFieldNotEditable/ErrConfirmedFieldConflict)는 호출부에서 graceful 처리.
export async function patchDealConfirmedField(
  dealId: string,
  fieldId: string,
  body: PatchConfirmedFieldBody,
  getIdToken: () => Promise<string>,
  idempotencyKey: string,
): Promise<ConfirmedExtractionFieldResponse> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));
  const normalizedFieldId = encodeURIComponent(normalizeUuidFieldId(fieldId));

  return apiRequest<ConfirmedExtractionFieldResponse>(
    apiPath(`/trade/deals/${normalizedDealId}/extraction-fields/${normalizedFieldId}`),
    {
      baseUrl: apiBaseUrl(),
      getIdToken,
      init: {
        body: JSON.stringify(body),
        headers: { "Idempotency-Key": idempotencyKey },
        method: "PATCH",
      },
    },
  );
}

export async function patchDealTitle(
  dealId: string,
  title: string,
  getIdToken: () => Promise<string>,
): Promise<void> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));
  const trimmedTitle = title.trim();

  if (!trimmedTitle) {
    throw new ApiError({
      code: "TRADE_DEAL_INVALID_TITLE",
      message: "title must not be blank",
      status: 400,
    });
  }

  const body: PatchDealTitleBody = { title: trimmedTitle };
  return apiRequest<void>(apiPath(`/trade/deals/${normalizedDealId}/title`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: {
      body: JSON.stringify(body),
      method: "PATCH",
    },
  });
}

export async function patchDealDirection(
  dealId: string,
  direction: DealDirection,
  getIdToken: () => Promise<string>,
): Promise<PatchDealDirectionResponse> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));
  const body: PatchDealDirectionBody = { direction };
  return apiRequest<PatchDealDirectionResponse>(apiPath(`/trade/deals/${normalizedDealId}/direction`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: { body: JSON.stringify(body), method: "PATCH" },
  });
}

// --- Deal lifecycle: archive / restore(unarchive) / cancel / reactivate ---
// FS-08 §7 two-step contract (BE #1056, closing BE#890,
// internal/service/trade/dealstatus/{lifecycle_preview,lifecycle_execution}.go):
// every transition requires a server-issued preview_id (from
// createDealLifecyclePreview), the caller's expected_state, an enumerated
// reason_code + 1-500 char reason_note, and an idempotency_key scoped to this
// deal+action so a retry replays the original receipt (`replayed: true`)
// instead of writing a second event. A bodyless call 400s
// (dealstatus.ErrLifecyclePreviewRequired) except for a permissive `restore`
// transition allowance (ECOYA_TRADE_LIFECYCLE_STRICT, ticketed for removal by
// BE#1058) — callers here always send the full contract and must not rely on
// that allowance.
//
// Note: an earlier revision of this module (#684/#697) had archiveDeal fetch
// its own preview internally and execute with only `preview_id`. That hid the
// preview from the caller (so the UI could never show the financial snapshot
// or let the user pick a reason before executing) and still 400'd anyway —
// the execute endpoints require expected_state/reason_code/reason_note/
// idempotency_key too, not just preview_id. createDealLifecyclePreview is now
// a separate, explicit call the UI makes first.
export type DealLifecycleAction = "archive" | "restore" | "cancel" | "reactivate";

export type LifecycleCutoffRevisionEntry = {
  writer: string;
  revision: string;
};

// Coverage verdict for the snapshot as a whole (FS-08 §4). `complete` is only
// claimed when every known cash writer was probed and the cash predicate
// resolved — `partial`/`unavailable` must never render as a settled figure.
export type LifecycleFinancialCoverage = "complete" | "partial" | "unavailable" | (string & {});
// `unknown` must never render as 0/"none" — it means the cash predicate could
// not be resolved, not that no cash was found.
export type LifecycleActualCashState = "none" | "recorded" | "unknown" | (string & {});
export type LifecycleWriteoffState = "none" | "recorded" | (string & {});

export type LifecycleFinancialSnapshot = {
  financial_coverage: LifecycleFinancialCoverage;
  actual_cash_state: LifecycleActualCashState;
  // A write-off changes the collection/payment target but is not evidence of
  // cash movement or a settlement payment. Optional only for historical
  // receipts created before Backend exposed this axis.
  writeoff_state?: LifecycleWriteoffState;
  // per_currency / actual_cash_evidence / cash_writer_coverage are opaque
  // json.RawMessage on the wire with no published shape — the Go doc comment
  // on per_currency explicitly says consumers must not assume it is final
  // (BE#1061 will add a 13-field wrapper); the other two carry no contract at
  // all. Do not parse their internals — render only the explicit states above.
  per_currency?: unknown;
  actual_cash_evidence?: unknown;
  cash_writer_coverage?: unknown;
};

export type LifecyclePreviewResponse = {
  preview_id: string;
  action: DealLifecycleAction;
  expires_at: string;
  cutoff_at: string;
  cutoff_revision: LifecycleCutoffRevisionEntry[];
  financial_snapshot: LifecycleFinancialSnapshot;
  // Reason codes accepted for `action`, decided server-side
  // (dealstatus.LifecycleReasonCodes) — the UI must not hardcode this list.
  reason_codes: string[];
};

export type LifecycleReceipt = {
  lifecycle_event_id: string;
  deal_id: string;
  action: DealLifecycleAction;
  lifecycle_sequence: number;
  cycle_no: number;
  previous_status: string;
  result_status: string;
  preview_id: string;
  preview_digest: string;
  cutoff_at: string;
  cutoff_revision: LifecycleCutoffRevisionEntry[];
  financial_snapshot: LifecycleFinancialSnapshot;
  actor_subject_id: string;
  actor_role: string;
  server_time: string;
  reason_code: string;
  reason_note: string;
  idempotency_request_hash: string;
  // Replayed marks a receipt returned from a prior event (same idempotency_key
  // + same payload) rather than one written by this call.
  replayed: boolean;
  // LegacyRequest marks a transition executed under the bodyless restore
  // allowance. Callers in this module never send a legacy request.
  legacy_request: boolean;
  // FS-08 §4: a reactivated deal that carries real cash or prior financial
  // events starts flagged for ledger review.
  settlement_review_required: boolean;
};

export type LifecycleTransitionBody = {
  preview_id: string;
  expected_state: string;
  reason_code: string;
  reason_note: string;
  idempotency_key: string;
};

export async function createDealLifecyclePreview(
  dealId: string,
  action: DealLifecycleAction,
  getIdToken: () => Promise<string>,
): Promise<LifecyclePreviewResponse> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));

  return apiRequest<LifecyclePreviewResponse>(apiPath(`/trade/deals/${normalizedDealId}/lifecycle-preview`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: {
      body: JSON.stringify({ action }),
      method: "POST",
    },
  });
}

// Each function below builds its own literal endpoint path rather than
// sharing one helper templated on the action name. scripts/verify-api-contract.mjs
// statically extracts apiPath(...) template-literal arguments and normalizes
// every `${...}` interpolation to `{}` — a shared `${endpoint}` variable
// collapses to a phantom two-parameter shape ("/trade/deals/{}/{}") that
// matches no real swagger path, even though every individual call is a real,
// correct, single-parameter path. Four near-identical bodies is the honest
// tradeoff against a DRY helper the verifier cannot see through.
function lifecycleTransitionInit(body: LifecycleTransitionBody) {
  return { body: JSON.stringify(body), method: "POST" } as const;
}

export async function archiveDeal(
  dealId: string,
  body: LifecycleTransitionBody,
  getIdToken: () => Promise<string>,
): Promise<LifecycleReceipt> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));
  return apiRequest<LifecycleReceipt>(apiPath(`/trade/deals/${normalizedDealId}/archive`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: lifecycleTransitionInit(body),
  });
}

// unarchiveDeal executes the FS-08 `restore` transition — the endpoint path is
// /unarchive but the lifecycle-preview `action` and reason_codes are "restore".
export async function unarchiveDeal(
  dealId: string,
  body: LifecycleTransitionBody,
  getIdToken: () => Promise<string>,
): Promise<LifecycleReceipt> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));
  return apiRequest<LifecycleReceipt>(apiPath(`/trade/deals/${normalizedDealId}/unarchive`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: lifecycleTransitionInit(body),
  });
}

export async function cancelDeal(
  dealId: string,
  body: LifecycleTransitionBody,
  getIdToken: () => Promise<string>,
): Promise<LifecycleReceipt> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));
  return apiRequest<LifecycleReceipt>(apiPath(`/trade/deals/${normalizedDealId}/cancel`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: lifecycleTransitionInit(body),
  });
}

export async function reactivateDeal(
  dealId: string,
  body: LifecycleTransitionBody,
  getIdToken: () => Promise<string>,
): Promise<LifecycleReceipt> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));
  return apiRequest<LifecycleReceipt>(apiPath(`/trade/deals/${normalizedDealId}/reactivate`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: lifecycleTransitionInit(body),
  });
}

export type MatchCell = {
  doc_code: string;
  value?: string;
  present: boolean;
};

export type MatchRow = {
  field: string;
  label: string;
  cells: MatchCell[];
  status: "matched" | "mismatch" | "missing" | "warning" | string;
  note?: string;
};

export type DealHealthComponent = {
  key: string;
  score: number;
  weight: number;
  state?: "assessed" | "partial" | "unknown" | string;
  reason: string;
};

export type DealHealthResponse = {
  deal_id: string;
  org_id: string;
  data_as_of?: string;
  score: number;
  score_available?: boolean;
  band: "good" | "watch" | "risk" | "critical" | string;
  assessment_state?: "complete" | "partial" | "insufficient" | string;
  coverage_percent?: number;
  unknown_components?: string[];
  components: DealHealthComponent[];
};

export async function getDealHealth(
  dealId: string,
  getIdToken: () => Promise<string>,
): Promise<DealHealthResponse> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));
  return apiRequest<DealHealthResponse>(apiPath(`/trade/deals/${normalizedDealId}/health`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
}

export type DealBriefResponse = {
  deal_id: string;
  org_id: string;
  data_as_of?: string;
  summary: string;
  source: string;
  generated_at: string;
  state?: {
    deal_lifecycle: string;
    order_lifecycle: string;
    fulfillment: string;
    settlement: string;
  };
  health?: {
    data_as_of?: string;
    score: number;
    score_available: boolean;
    band: string;
    assessment_state: string;
    coverage_percent: number;
    unknown_components: string[];
  };
  quantity?: {
    state: "assessed" | "partial" | string;
    fulfillment: string;
    contracted: string;
    shipped: string;
    remaining: string;
    unit: string;
  } | null;
  timeline?: {
    etd?: string;
    next_eta?: string;
    shipment_count: number;
  };
  money?: Array<{
    currency: string;
    invoice_sales: string;
    invoice_purchases: string;
    landed_cost: string;
    invoice_trade_result: string;
    estimated_deal_result: string;
    received_applied: string;
    paid_applied: string;
    current_receivable: string;
    current_payable: string;
    due_date?: string;
    latest_value_date?: string;
    data_quality: string;
    handoff_ready: boolean;
    handoff_blockers: string[];
    source_document_numbers?: string[];
  }>;
  evidence?: Array<{
    doc_code: string;
    state: string;
    trade_document_id?: string;
    erp_document_id?: string;
    generated_document_id?: string;
    source?: string;
    issued_at?: string;
  }>;
  next_actions?: DealNextAction[];
  unknowns?: string[];
};

export async function getDealBrief(
  dealId: string,
  getIdToken: () => Promise<string>,
): Promise<DealBriefResponse> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));
  return apiRequest<DealBriefResponse>(apiPath(`/trade/deals/${normalizedDealId}/summary`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
}

export type BankRef = { bank: string; account: string };
export type BankChangePrev = { bank: string; account: string; seen_on: string };

export type BankChangeResponse = {
  changed: boolean;
  counterparty: string;
  current?: BankRef | null;
  previous: BankChangePrev[];
  evidence_doc_ids: string[];
};

export async function getDealBankChange(
  dealId: string,
  getIdToken: () => Promise<string>,
): Promise<BankChangeResponse> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));
  return apiRequest<BankChangeResponse>(apiPath(`/trade/deals/${normalizedDealId}/bank-change`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
}

export type OrderLifecycleResponse = {
  deal_id: string;
  order_fulfillment_status: "open" | "closed" | "short_closed" | "cancelled" | string;
  order_closed_at?: string;
  order_close_reason?: string;
};

export type OrderEvent = {
  id: string;
  deal_id: string;
  event_type: "close" | "short_close" | "cancel" | "reopen" | "amend_price" | string;
  actor_id?: string;
  actor_role?: string;
  reason?: string;
  payload?: Record<string, unknown>;
  occurred_at: string;
};

export type OrderEventsResponse = { events: OrderEvent[] };

export type OrderActionName = "close" | "short-close" | "cancel" | "reopen" | "amend-price";

export async function orderAction(
  dealId: string,
  action: OrderActionName,
  body: Record<string, unknown>,
  getIdToken: () => Promise<string>,
): Promise<OrderLifecycleResponse> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));
  return apiRequest<OrderLifecycleResponse>(apiPath(`/trade/deals/${normalizedDealId}/order/${action}`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: { body: JSON.stringify(body), method: "POST" },
  });
}

export async function listOrderEvents(
  dealId: string,
  getIdToken: () => Promise<string>,
): Promise<OrderEventsResponse> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));
  return apiRequest<OrderEventsResponse>(apiPath(`/trade/deals/${normalizedDealId}/order/events`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
}

export type Party = { role: string; name: string; source: "manual" | "document" | string };
export type PartiesResponse = { parties: Party[] };

export async function listParties(
  dealId: string,
  getIdToken: () => Promise<string>,
): Promise<PartiesResponse> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));
  return apiRequest<PartiesResponse>(apiPath(`/trade/deals/${normalizedDealId}/parties`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
}

export async function upsertParty(
  dealId: string,
  role: string,
  name: string,
  getIdToken: () => Promise<string>,
): Promise<Party> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));
  return apiRequest<Party>(apiPath(`/trade/deals/${normalizedDealId}/parties/${encodeURIComponent(role)}`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: { body: JSON.stringify({ name }), method: "PUT" },
  });
}

export async function deleteParty(
  dealId: string,
  role: string,
  getIdToken: () => Promise<string>,
): Promise<void> {
  const normalizedDealId = encodeURIComponent(normalizeUuidDealId(dealId));
  return apiRequest<void>(apiPath(`/trade/deals/${normalizedDealId}/parties/${encodeURIComponent(role)}`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: { method: "DELETE" },
  });
}

export type DealCost = {
  id: string;
  deal_id: string;
  cost_type: string;
  amount: string;
  currency: string;
  cost_basis: string;
  source_document_id?: string;
  note?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};
export type DealCostGroup = {
  cost_type: string;
  currency: string;
  cost_basis: string;
  total: string;
  lines: number;
};
export type DealCostRollup = {
  groups: DealCostGroup[];
  currencies: string[];
  line_count: number;
};
export type DealCostsResponse = { costs: DealCost[]; rollup: DealCostRollup };
export type DealCostInput = {
  cost_type: string;
  amount: string;
  currency: string;
  cost_basis?: string;
  source_document_id?: string | null;
  note?: string | null;
};

export async function listDealCosts(
  dealId: string,
  getIdToken: () => Promise<string>,
): Promise<DealCostsResponse> {
  const id = encodeURIComponent(normalizeUuidDealId(dealId));
  return apiRequest<DealCostsResponse>(apiPath(`/trade/deals/${id}/costs`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
}

export async function createDealCost(
  dealId: string,
  input: DealCostInput,
  getIdToken: () => Promise<string>,
): Promise<DealCost> {
  const id = encodeURIComponent(normalizeUuidDealId(dealId));
  return apiRequest<DealCost>(apiPath(`/trade/deals/${id}/costs`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: { body: JSON.stringify(input), method: "POST" },
  });
}

export async function updateDealCost(
  dealId: string,
  costId: string,
  input: DealCostInput,
  getIdToken: () => Promise<string>,
): Promise<DealCost> {
  const id = encodeURIComponent(normalizeUuidDealId(dealId));
  return apiRequest<DealCost>(apiPath(`/trade/deals/${id}/costs/${encodeURIComponent(costId)}`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: { body: JSON.stringify(input), method: "PATCH" },
  });
}

export async function deleteDealCost(
  dealId: string,
  costId: string,
  getIdToken: () => Promise<string>,
): Promise<void> {
  const id = encodeURIComponent(normalizeUuidDealId(dealId));
  return apiRequest<void>(apiPath(`/trade/deals/${id}/costs/${encodeURIComponent(costId)}`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: { method: "DELETE" },
  });
}

export type DealsSummary = {
  total_deals: number;
  open_deals: number;
  closed_deals: number;
  total_value_usd: number;
  total_value_krw: number;
  data_as_of: string;
};

export type QuickInsight = {
  id: string;
  code?: string | null;
  type: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "critical" | string;
  generated_at: string;
};

export type QuickInsightsResponse = { insights: QuickInsight[] };

export type DealReviewSummary = {
  review_count: number;
  schedule_delay_count: number;
  qty_mismatch_count: number;
};

export async function getDealReviewSummary(getIdToken: () => Promise<string>): Promise<DealReviewSummary> {
  return apiRequest<DealReviewSummary>(apiPath("/trade/deal-review-summary"), { baseUrl: apiBaseUrl(), getIdToken });
}

export async function getQuickInsights(getIdToken: () => Promise<string>): Promise<QuickInsightsResponse> {
  return apiRequest<QuickInsightsResponse>(apiPath("/trade/insights/quick"), { baseUrl: apiBaseUrl(), getIdToken });
}

const inflightFinancialInsights =
  typeof window !== "undefined" ? new Map<string, Promise<QuickInsightsResponse>>() : null;
const FINANCIAL_INSIGHTS_TIMEOUT_MS = 15_000;

export async function getFinancialInsights(getIdToken: () => Promise<string>): Promise<QuickInsightsResponse> {
  const token = await getIdToken();
  const inflight = inflightFinancialInsights?.get(token);
  if (inflight) return inflight;

  const request = apiRequest<QuickInsightsResponse>(apiPath("/trade/insights/financial"), {
    baseUrl: apiBaseUrl(),
    getIdToken: () => Promise.resolve(token),
    timeoutMs: FINANCIAL_INSIGHTS_TIMEOUT_MS,
  }).finally(() => inflightFinancialInsights?.delete(token));
  inflightFinancialInsights?.set(token, request);
  return request;
}

export type OwnerBriefResponse = {
  org_id: string;
  summary: string;
  source: string;
  generated_at: string;
};

export async function getOwnerBrief(getIdToken: () => Promise<string>): Promise<OwnerBriefResponse> {
  return apiRequest<OwnerBriefResponse>(apiPath("/trade/insights/brief"), { baseUrl: apiBaseUrl(), getIdToken });
}

export type ImportDealRowError = { line: number; title: string; reason: string };
export type ImportDealsResult = {
  total: number;
  created: number;
  skipped: number;
  errors: ImportDealRowError[];
};

export async function importDeals(
  csv: string,
  getIdToken: () => Promise<string>,
): Promise<ImportDealsResult> {
  return apiRequest<ImportDealsResult>(apiPath("/trade/import/deals"), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: { body: JSON.stringify({ csv }), method: "POST" },
  });
}

import { ApiError, apiRequest, DEFAULT_PLATFORM_API_BASE_URL } from "./client";
import { withRetry } from "./retry";
import { financeDecimalMagnitude, isFinanceDecimal } from "../financeDecimal";

export { FINANCE_DECIMAL_SCALE, financeDecimalMagnitude } from "../financeDecimal";

// V2-3 정산(SAP-lite) client. NOT accounting software — data-for-handoff:
// AR/AP by currency, fund-calendar forecast, FX exposure, and a flat ledger for
// the accounting export. All aggregated over payment_schedules (no AI).

// One (currency × due-bucket × AR/AP) aggregate of the scheduled ledger.
export type SettlementCell = {
  currency: string;
  // overdue | d0_7 | d8_30 | d31_90 | later
  bucket: string;
  // receivable (AR) | payable (AP)
  type: "receivable" | "payable" | "direction_pending";
  total: string; // numeric as string (no float drift)
  count: number;
};

// Per-currency AR/AP + net (FX exposure).
export type CurrencyExposure = {
  currency: string;
  receivable: string;
  payable: string;
  net: string;
};

// AR/AP aging by days past due (current | d1_30 | d31_60 | d61_90 | d90_plus).
export type AgingCell = {
  type: "receivable" | "payable" | "direction_pending";
  currency: string;
  bucket: string;
  total: string;
  count: number;
};

export function countOverdueReceivables(aging: AgingCell[] | undefined | null): number {
  return (aging ?? [])
    .filter((cell) => cell.type === "receivable" && cell.bucket !== "current")
    .reduce((count, cell) => count + (cell.count ?? 0), 0);
}

// Per-counterparty AR/AP rollup with overdue receivable (collection list).
export type CounterpartyExposure = {
  counterparty_name?: string | null;
  currency: string;
  receivable: string;
  payable: string;
  overdue_receivable: string;
  // Resolved counterparty master id (#502), stable across a display-name
  // rename or merge — drill via getSettlementCounterpartyDeals's counterpartyId
  // param instead of the name string. Null/absent when the cached name
  // resolves to no master.
  counterparty_id?: string | null;
};

export type SettlementOverview = {
  data_as_of: string;
  // 이 as-of·버킷 경계를 판정한 조직 업무 타임존 (P1-A) — 클릭 시점의
  // "오늘"을 신선하게 계산할 때 사용 (자정 넘겨 열어둔 탭 백데이트 방지).
  timezone?: string;
  cells: SettlementCell[];
  by_currency: CurrencyExposure[];
  aging?: AgingCell[];
  by_counterparty?: CounterpartyExposure[];
};

export type LedgerSourceDocumentState =
  | "verified"
  | "none"
  | "ambiguous"
  | "legacy_unknown";

export type LedgerManualReference = {
  number?: string | null;
  actor_id?: string | null;
  timestamp?: string | null;
  evidence?: string | null;
};

export type LedgerEntry = {
  id: string;
  deal_id?: string | null;
  counterparty_name?: string | null;
  amount: string;
  // paid = running sum of recorded cash events; outstanding = amount - paid
  // floored at 0 (settlement_payments, BE Phase 1-B). String numerics.
  paid: string;
  outstanding: string;
  currency: string;
  due_date: string;
  type: "receivable" | "payable" | "direction_pending";
  status: string;
  // Nullable server projection of the one unresolved dispute on this schedule.
  // Resolved history remains available through the deal-scoped detail endpoint.
  open_dispute_id?: string | null;
  open_dispute_status?: string | null;
  open_disputed_amount?: string | null;
  // closure_type is set once the line is closed (settled / written_off /
  // adjusted, BE migration 0100). A closed line is locked — no new cash events.
  closure_type?: string | null;
  memo?: string | null;
  registration_no?: string | null;
  source_document_number?: string | null;
  source_document_state?: LedgerSourceDocumentState;
  manual_reference?: LedgerManualReference | null;
  // True when this row's Deal has been cancelled (#472, FS-08/OD-009). Only
  // ever present when the caller opted into include_cancelled=true — the
  // default ledger view excludes these rows entirely.
  deal_cancelled?: boolean;
};

// One recorded AR/AP cash event (settlement_payments).
export type SettlementPaymentEntry = {
  id: string;
  schedule_id: string;
  amount: string;
  fee_amount: string;
  currency: string;
  value_date: string;
  note?: string | null;
  source_document_id?: string | null;
  created_by?: string | null;
  created_at: string;
};

// A schedule's recorded events + derived settled state (GET .../payments).
export type ScheduleSettlement = {
  schedule_id: string;
  amount: string;
  paid: string;
  outstanding: string;
  fees: string;
  payments: SettlementPaymentEntry[];
};

export type SettlementOverpaymentKind = "overpay" | "advance";

export type SettlementOverpayment = {
  id: string;
  schedule_id: string;
  payment_id: string;
  amount: string;
  allocated_amount: string;
  refunded_total: string;
  remaining: string;
  currency: string;
  kind: SettlementOverpaymentKind;
  counterparty_name?: string | null;
  deal_id?: string | null;
};

export type SettlementOverpaymentListResponse = {
  overpayments: SettlementOverpayment[];
};

export type RecordSettlementOverpaymentBody = {
  amount: string;
  currency: string;
  kind: SettlementOverpaymentKind;
  payment_id: string;
  counterparty_name?: string | null;
  deal_id?: string | null;
};

export type SettlementOverpaymentBalanceResponse = SettlementOverpayment;

export type SettlementOverpaymentRefund = {
  id: string;
  overpayment_id: string;
  amount: string;
  currency: string;
  evidence: string;
  reason: string;
  document_no?: string | null;
};

export type SettlementOverpaymentRefundListResponse = {
  refunds: SettlementOverpaymentRefund[];
};

export type RecordSettlementOverpaymentRefundBody = {
  amount: string;
  currency: string;
  evidence: string;
  reason: string;
  document_no?: string | null;
};

export type SettlementOverpaymentRefundResponse = SettlementOverpaymentRefund;

export type SettlementAdjustmentKind = "credit" | "adjustment" | "refund" | "return";

export type SettlementAdjustment = {
  id: string;
  schedule_id: string;
  amount: string;
  currency: string;
  kind: SettlementAdjustmentKind;
  reason: string;
  evidence?: string | null;
  document_no?: string | null;
  deal_id?: string | null;
};

export type SettlementAdjustmentListResponse = {
  original_amount: string;
  current_target: string;
  adjustment_total: string;
  written_off_total?: string;
  adjustments: SettlementAdjustment[];
};

export type RecordSettlementAdjustmentBody = {
  amount: string;
  currency: string;
  kind: SettlementAdjustmentKind;
  reason: string;
  evidence?: string | null;
  deal_id?: string | null;
  document_no?: string | null;
};

export type SettlementAdjustmentResponse = SettlementAdjustment;
export type SettlementDisputeResolution = "resume" | "write_off" | "adjust";

export type SettlementDispute = {
  id: string;
  schedule_id: string;
  deal_id?: string | null;
  normal_amount: string;
  disputed_amount: string;
  original_amount: string;
  currency: string;
  reason: string;
  evidence?: string | null;
  opened_at?: string | null;
  opened_by?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  status: string;
  resolution?: SettlementDisputeResolution | null;
};

export type SettlementDisputeListResponse = {
  disputes: SettlementDispute[];
};

export type OpenSettlementDisputeBody = {
  normal_amount: string;
  disputed_amount: string;
  original_amount: string;
  currency: string;
  reason: string;
  deal_id?: string | null;
  evidence?: string | null;
};

export type ResolveSettlementDisputeBody = {
  resolution: SettlementDisputeResolution;
};

export type PaymentScheduleWriteoffDetail = {
  id: string;
  deal_id?: string | null;
  amount: string;
  currency: string;
  due_date: string;
  type: string;
  status: string;
  closed_at?: string | null;
  closure_type?: string | null;
  closure_reason?: string | null;
  closure_evidence_document_id?: string | null;
  closure_evidence_external?: string | null;
  writeoff_proposed_at?: string | null;
  writeoff_proposed_by?: string | null;
  writeoff_proposal_reason?: string | null;
  writeoff_proposal_document_id?: string | null;
  writeoff_proposal_evidence?: string | null;
};

export type PaymentScheduleClosureEvent = {
  id: string;
  event_type: string;
  closure_type?: string | null;
  reason?: string | null;
  note?: string | null;
  evidence_document_id?: string | null;
  external_evidence?: string | null;
  scheduled_amount: string;
  scheduled_currency: string;
  received_amount: string;
  written_off_amount?: string | null;
  actor?: string | null;
  occurred_at: string;
};

export type PaymentScheduleWriteoffProposalBody = {
  reason: string;
  document_id?: string | null;
  external_evidence?: string | null;
};

export type PaymentScheduleWriteoffCloseBody = {
  closure_type: "written_off";
  reason: string;
  evidence_document_id?: string | null;
  external_evidence?: string | null;
  note?: string | null;
};

/**
 * Generic schedule closure body for the non-write-off closure types. Write-off
 * closure remains on closeScheduleWriteoff so the immutable closure event and
 * evidence response are verified before the UI reports success.
 */
export type CloseScheduleBody = {
  closure_type: "settled" | "adjusted";
  note?: string | null;
};

export type RecordSettlementPaymentBody = {
  amount: string;
  fee?: string;
  value_date: string;
  note?: string | null;
  // Persisted provenance; the backend rejects duplicate use within the organization.
  source_document_id?: string | null;
  // Omission defaults to the schedule currency; an explicit mismatch returns 409.
  // An explicit empty string is rejected with 400 — callers must keep the
  // `bankCurrency || undefined` convention (only omission defaults).
  currency?: string;
};

export type RecordSettlementPaymentResponse = {
  payment: SettlementPaymentEntry;
  schedule_id: string;
  amount: string;
  paid: string;
  outstanding: string;
  fees: string;
  idempotency_replayed: boolean;
};
export type CreatePaymentScheduleBody = {
  amount: string;
  counterparty_name?: string;
  currency: string;
  due_date: string;
  memo?: string;
  type: "receivable" | "payable";
};

export type CreatePaymentScheduleResponse = {
  amount: string;
  counterparty_name?: string | null;
  currency: string;
  due_date: string;
  id: string;
  memo?: string | null;
  status: string;
  type: "receivable" | "payable";
};


export type LedgerPagination = {
  total: number;
  limit: number;
  offset: number;
};

export type LedgerResponse = {
  entries: LedgerEntry[];
  /** Present since the paged ledger rollout; absent on older BE. */
  pagination?: LedgerPagination;
};

export type SettlementDealItem = {
  schedule_id: string;
  deal_id: string | null;
  deal_title: string | null;
  type: "receivable" | "payable";
  amount: string;
  currency: string;
  due_date: string;
  overdue: boolean;
};

export type SettlementDealsResponse = {
  items: SettlementDealItem[];
  /** Server count for this counterparty/currency drill, not organisation history. */
  total_count?: number;
};

export type TradeFinanceFact = {
  deal_id?: string | null;
  currency: string;
  counterparty_name?: string | null;
  assignee_id?: string | null;
  assignee_name?: string | null;
  /** Confirmed sell-side Commercial Invoice total; not accounting revenue recognition. */
  revenue_amount: string;
  /** Confirmed buy-side Commercial Invoice total; not recognized COGS. */
  goods_cost_amount: string;
  landed_cost_amount: string;
  /** Sell-side CI total less buy-side CI total; an invoice-basis spread. */
  gross_profit_amount: string;
  gross_profit_pct?: string | null;
  /** Invoice spread less recorded additive deal costs; not statutory profit. */
  adjusted_gp_amount: string;
  adjusted_gp_pct?: string | null;
  receivable_amount: string;
  payable_amount: string;
  receivable_current_target_amount: string;
  payable_current_target_amount: string;
  receivable_applied_amount: string;
  payable_applied_amount: string;
  receivable_outstanding_amount: string;
  payable_outstanding_amount: string;
  /** @deprecated Compatibility sum; never use where cash direction matters. */
  paid_amount: string;
  /** @deprecated Compatibility sum; never use where AR/AP direction matters. */
  outstanding_amount: string;
  due_date?: string | null;
  latest_value_date?: string | null;
  data_quality: "confirmed" | "partial" | "needs_review" | string;
  handoff_ready: boolean;
  handoff_blockers: string[];
  source_document_numbers?: string[];
};

export type TradeFinanceFactsResponse = {
  facts: TradeFinanceFact[];
  /** False only when the client safety cap stopped an org-wide sweep early. */
  complete?: boolean;
};

export type DealEconomicsResponse = {
  deal_id: string;
  basis: "document" | string;
  currency_mixed: boolean;
  dominant_currency?: string;
  buckets: TradeFinanceFact[];
};

function apiPath(path: string): string {
  return typeof window !== "undefined" ? `/api/platform${path}` : `/api/v1${path}`;
}

function apiBaseUrl(): string | undefined {
  return typeof window !== "undefined" ? "" : DEFAULT_PLATFORM_API_BASE_URL;
}

export async function getSettlementOverview(
  getIdToken: () => Promise<string>,
): Promise<SettlementOverview> {
  return apiRequest<SettlementOverview>(apiPath("/trade/settlement/overview"), {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
}

export type SettlementCalendarCell = {
  bucket: string;
  type: "receivable" | "payable" | "direction_pending";
  currency: string;
  total: string;
  count: number;
};

export type SettlementCalendar = {
  data_as_of: string;
  cells: SettlementCalendarCell[];
};

export async function getSettlementCalendar(
  getIdToken: () => Promise<string>,
): Promise<SettlementCalendar> {
  return apiRequest<SettlementCalendar>(apiPath("/trade/settlement/calendar"), {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
}

// --- AR/AP cash-event subledger (record actual money in/out per schedule) ---

// Record a payment received/paid against a schedule (partial allowed; the
// schedule's outstanding is the running remainder). Bodyless-fee defaults to 0.
export async function recordSchedulePayment(
  scheduleId: string,
  body: RecordSettlementPaymentBody,
  idempotencyKey: string,
  getIdToken: () => Promise<string>,
): Promise<RecordSettlementPaymentResponse> {
  if (!SETTLEMENT_PAYMENT_IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
    throw new ApiError({
      code: "ERP_SETTLEMENT_VALIDATION",
      message: "Idempotency-Key must be a canonical lowercase UUIDv4",
      status: 400,
    });
  }
  return apiRequest<RecordSettlementPaymentResponse>(
    apiPath(`/erp/payment-schedules/${encodeURIComponent(scheduleId)}/payments`),
    {
      baseUrl: apiBaseUrl(),
      getIdToken,
      init: {
        body: JSON.stringify(body),
        headers: { "Idempotency-Key": idempotencyKey },
        method: "POST",
      },
    },
  );
}

const SETTLEMENT_PAYMENT_IDEMPOTENCY_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function createSettlementPaymentIdempotencyKey(): string {
  const key = globalThis.crypto?.randomUUID?.().toLowerCase();
  if (!key || !SETTLEMENT_PAYMENT_IDEMPOTENCY_KEY_PATTERN.test(key)) {
    throw new Error("Secure UUIDv4 generation is unavailable; payment was not submitted");
  }
  return key;
}
// Create a schedule explicitly when CI confirmation cannot derive one safely.
export async function createPaymentSchedule(
  body: CreatePaymentScheduleBody,
  getIdToken: () => Promise<string>,
): Promise<CreatePaymentScheduleResponse> {
  return apiRequest<CreatePaymentScheduleResponse>(apiPath("/erp/payment-schedules"), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: { body: JSON.stringify(body), method: "POST" },
  });
}

// List a schedule's recorded cash events + its derived settled state.
export async function listSchedulePayments(
  scheduleId: string,
  getIdToken: () => Promise<string>,
): Promise<ScheduleSettlement> {
  return apiRequest<ScheduleSettlement>(
    apiPath(`/erp/payment-schedules/${encodeURIComponent(scheduleId)}/payments`),
    { baseUrl: apiBaseUrl(), getIdToken },
  );
}

export async function listScheduleOverpayments(
  scheduleId: string,
  getIdToken: () => Promise<string>,
): Promise<SettlementOverpaymentListResponse> {
  return apiRequest<SettlementOverpaymentListResponse>(
    apiPath(`/trade/settlement/schedules/${encodeURIComponent(scheduleId)}/overpayments`),
    { baseUrl: apiBaseUrl(), getIdToken },
  );
}

// #686: an overpayment/advance is reusable against any other schedule for
// the SAME counterparty (BE :214/:215), so the Deal-detail counterparty
// standing summary needs a counterparty-wide balance rather than one scoped
// to a single schedule — BE exposes it at GET /trade/settlement/overpayments.
export async function listOverpaymentsByCounterparty(
  counterpartyName: string,
  getIdToken: () => Promise<string>,
): Promise<SettlementOverpaymentListResponse> {
  const qs = new URLSearchParams({ counterparty_name: counterpartyName });
  return apiRequest<SettlementOverpaymentListResponse>(
    apiPath(`/trade/settlement/overpayments?${qs.toString()}`),
    { baseUrl: apiBaseUrl(), getIdToken },
  );
}

export async function recordScheduleOverpayment(
  scheduleId: string,
  body: RecordSettlementOverpaymentBody,
  getIdToken: () => Promise<string>,
): Promise<SettlementOverpaymentBalanceResponse> {
  return apiRequest<SettlementOverpaymentBalanceResponse>(
    apiPath(`/trade/settlement/schedules/${encodeURIComponent(scheduleId)}/overpayments`),
    {
      baseUrl: apiBaseUrl(),
      getIdToken,
      init: { body: JSON.stringify(body), method: "POST" },
    },
  );
}

export async function listScheduleAdjustments(
  scheduleId: string,
  getIdToken: () => Promise<string>,
): Promise<SettlementAdjustmentListResponse> {
  return apiRequest<SettlementAdjustmentListResponse>(
    apiPath(`/trade/settlement/schedules/${encodeURIComponent(scheduleId)}/adjustments`),
    { baseUrl: apiBaseUrl(), getIdToken },
  );
}

export async function recordScheduleAdjustment(
  scheduleId: string,
  body: RecordSettlementAdjustmentBody,
  getIdToken: () => Promise<string>,
): Promise<SettlementAdjustmentResponse> {
  return apiRequest<SettlementAdjustmentResponse>(
    apiPath(`/trade/settlement/schedules/${encodeURIComponent(scheduleId)}/adjustments`),
    {
      baseUrl: apiBaseUrl(),
      getIdToken,
      init: { body: JSON.stringify(body), method: "POST" },
    },
  );
}

export async function listOverpaymentRefunds(
  overpaymentId: string,
  getIdToken: () => Promise<string>,
): Promise<SettlementOverpaymentRefundListResponse> {
  return apiRequest<SettlementOverpaymentRefundListResponse>(
    apiPath(`/trade/settlement/overpayments/${encodeURIComponent(overpaymentId)}/refunds`),
    { baseUrl: apiBaseUrl(), getIdToken },
  );
}

export async function recordOverpaymentRefund(
  overpaymentId: string,
  body: RecordSettlementOverpaymentRefundBody,
  getIdToken: () => Promise<string>,
): Promise<SettlementOverpaymentRefundResponse> {
  return apiRequest<SettlementOverpaymentRefundResponse>(
    apiPath(`/trade/settlement/overpayments/${encodeURIComponent(overpaymentId)}/refunds`),
    {
      baseUrl: apiBaseUrl(),
      getIdToken,
      init: { body: JSON.stringify(body), method: "POST" },
    },
  );
}

// Remove a mistaken cash event (scoped to its schedule).
export async function deleteSchedulePayment(
  scheduleId: string,
  paymentId: string,
  getIdToken: () => Promise<string>,
): Promise<void> {
  await apiRequest<unknown>(
    apiPath(`/erp/payment-schedules/${encodeURIComponent(scheduleId)}/payments/${encodeURIComponent(paymentId)}`),
    { baseUrl: apiBaseUrl(), getIdToken, init: { method: "DELETE" } },
  );
}

export async function getPaymentScheduleWriteoffDetail(
  scheduleId: string,
  getIdToken: () => Promise<string>,
): Promise<PaymentScheduleWriteoffDetail> {
  return apiRequest<PaymentScheduleWriteoffDetail>(
    apiPath(`/erp/payment-schedules/${encodeURIComponent(scheduleId)}`),
    { baseUrl: apiBaseUrl(), getIdToken },
  );
}

export async function listPaymentScheduleClosureEvents(
  scheduleId: string,
  getIdToken: () => Promise<string>,
): Promise<PaymentScheduleClosureEvent[]> {
  return apiRequest<PaymentScheduleClosureEvent[]>(
    apiPath(`/erp/payment-schedules/${encodeURIComponent(scheduleId)}/closure-events`),
    { baseUrl: apiBaseUrl(), getIdToken },
  );
}
type PaymentScheduleWriteoffProposalPage = {
  items: PaymentScheduleWriteoffDetail[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
};

const WRITE_OFF_PROPOSAL_PAGE_LIMIT = 200;

export async function listPaymentScheduleWriteoffProposals(
  getIdToken: () => Promise<string>,
): Promise<PaymentScheduleWriteoffDetail[]> {
  const proposals: PaymentScheduleWriteoffDetail[] = [];
  let offset = 0;

  while (true) {
    const query = new URLSearchParams({
      has_writeoff_proposal: "true",
      limit: String(WRITE_OFF_PROPOSAL_PAGE_LIMIT),
      offset: String(offset),
    });
    const page = await apiRequest<PaymentScheduleWriteoffProposalPage>(
      apiPath(`/erp/payment-schedules?${query.toString()}`),
      { baseUrl: apiBaseUrl(), getIdToken },
    );
    proposals.push(...page.items);

    if (
      page.items.length < WRITE_OFF_PROPOSAL_PAGE_LIMIT ||
      proposals.length >= page.pagination.total
    ) {
      return proposals;
    }
    offset += WRITE_OFF_PROPOSAL_PAGE_LIMIT;
  }
}

export async function proposeScheduleWriteoff(
  scheduleId: string,
  body: PaymentScheduleWriteoffProposalBody,
  getIdToken: () => Promise<string>,
): Promise<PaymentScheduleWriteoffDetail> {
  return apiRequest<PaymentScheduleWriteoffDetail>(
    apiPath(`/erp/payment-schedules/${encodeURIComponent(scheduleId)}/writeoff-proposal`),
    {
      baseUrl: apiBaseUrl(),
      getIdToken,
      init: { body: JSON.stringify(body), method: "POST" },
    },
  );
}

export async function withdrawScheduleWriteoff(
  scheduleId: string,
  getIdToken: () => Promise<string>,
): Promise<PaymentScheduleWriteoffDetail> {
  return apiRequest<PaymentScheduleWriteoffDetail>(
    apiPath(`/erp/payment-schedules/${encodeURIComponent(scheduleId)}/writeoff-proposal`),
    { baseUrl: apiBaseUrl(), getIdToken, init: { method: "DELETE" } },
  );
}

function hasValue(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasFinanceValue(value: string | null | undefined): value is string {
  return hasValue(value) && isFinanceDecimal(value);
}

function isVerifiedWriteoffClosureEvent(
  event: PaymentScheduleClosureEvent,
  schedule: PaymentScheduleWriteoffDetail,
  body: PaymentScheduleWriteoffCloseBody,
): boolean {
  const reason = body.reason.trim();
  const evidenceDocumentId = body.evidence_document_id?.trim();
  const externalEvidence = body.external_evidence?.trim();

  return (
    event.event_type === "closed" &&
    event.closure_type === "written_off" &&
    hasValue(reason) &&
    hasValue(event.reason) &&
    event.reason.trim() === reason &&
    event.occurred_at === schedule.closed_at &&
    (!evidenceDocumentId || event.evidence_document_id === evidenceDocumentId) &&
    (!externalEvidence || event.external_evidence === externalEvidence) &&
    hasFinanceValue(event.scheduled_amount) &&
    hasValue(event.scheduled_currency) &&
    event.scheduled_currency === schedule.currency &&
    financeDecimalMagnitude(event.scheduled_amount) === financeDecimalMagnitude(schedule.amount) &&
    hasFinanceValue(event.received_amount) &&
    hasFinanceValue(event.written_off_amount) &&
    hasValue(event.actor) &&
    hasValue(event.occurred_at)
  );
}

function assertVerifiedWriteoffClosure(
  schedule: PaymentScheduleWriteoffDetail,
  body: PaymentScheduleWriteoffCloseBody,
  events: PaymentScheduleClosureEvent[],
) {
  if (
    schedule.closure_type === "written_off" &&
    hasValue(schedule.closed_at) &&
    events.some((event) => isVerifiedWriteoffClosureEvent(event, schedule, body))
  ) {
    return;
  }

  throw new ApiError({
    status: 409,
    code: "ERP_PAYMENT_WRITEOFF_CLOSURE_UNVERIFIED",
    message: "Write-off close did not return a verifiable immutable closure history snapshot.",
  });
}

export async function closeScheduleWriteoff(
  scheduleId: string,
  body: PaymentScheduleWriteoffCloseBody,
  getIdToken: () => Promise<string>,
): Promise<PaymentScheduleWriteoffDetail> {
  const schedule = await apiRequest<PaymentScheduleWriteoffDetail>(
    apiPath(`/erp/payment-schedules/${encodeURIComponent(scheduleId)}/close`),
    {
      baseUrl: apiBaseUrl(),
      getIdToken,
      init: { body: JSON.stringify(body), method: "POST" },
    },
  );
  const events = await listPaymentScheduleClosureEvents(scheduleId, getIdToken);
  assertVerifiedWriteoffClosure(schedule, body, events);
  return schedule;
}

export async function closeSchedule(
  scheduleId: string,
  body: CloseScheduleBody,
  getIdToken: () => Promise<string>,
): Promise<PaymentScheduleWriteoffDetail> {
  return apiRequest<PaymentScheduleWriteoffDetail>(
    apiPath(`/erp/payment-schedules/${encodeURIComponent(scheduleId)}/close`),
    {
      baseUrl: apiBaseUrl(),
      getIdToken,
      init: { body: JSON.stringify(body), method: "POST" },
    },
  );
}

export async function reopenSchedule(
  scheduleId: string,
  getIdToken: () => Promise<string>,
): Promise<PaymentScheduleWriteoffDetail> {
  return apiRequest<PaymentScheduleWriteoffDetail>(
    apiPath(`/erp/payment-schedules/${encodeURIComponent(scheduleId)}/reopen`),
    { baseUrl: apiBaseUrl(), getIdToken, init: { method: "POST" } },
  );
}

export async function listDealSettlementDisputes(
  dealId: string,
  getIdToken: () => Promise<string>,
): Promise<SettlementDisputeListResponse> {
  return apiRequest<SettlementDisputeListResponse>(
    apiPath(`/trade/deals/${encodeURIComponent(dealId)}/settlement-disputes`),
    { baseUrl: apiBaseUrl(), getIdToken },
  );
}

export async function openSettlementDispute(
  scheduleId: string,
  body: OpenSettlementDisputeBody,
  getIdToken: () => Promise<string>,
): Promise<SettlementDispute> {
  return apiRequest<SettlementDispute>(
    apiPath(`/trade/settlement/schedules/${encodeURIComponent(scheduleId)}/disputes`),
    {
      baseUrl: apiBaseUrl(),
      getIdToken,
      init: { body: JSON.stringify(body), method: "POST" },
    },
  );
}

export async function resolveSettlementDispute(
  disputeId: string,
  body: ResolveSettlementDisputeBody,
  getIdToken: () => Promise<string>,
): Promise<void> {
  await apiRequest<unknown>(
    apiPath(`/trade/settlement/disputes/${encodeURIComponent(disputeId)}/resolve`),
    {
      baseUrl: apiBaseUrl(),
      getIdToken,
      init: { body: JSON.stringify(body), method: "POST" },
    },
  );
}

// Buyer/Supplier reliability scorecard (§7.11): per-counterparty payment-
// reliability score + grade derived from settled-payment history (avg days late
// + overdue ratio), worst-reliability first. Amounts numeric-as-string.
export type CounterpartyScorecard = {
  counterparty: string;
  /** Scorecard grain is (counterparty, currency); nominal currencies never mix. */
  currency: string;
  completed_count: number;
  avg_days_late: number | null;
  overdue_count: number;
  open_receivable: string;
  open_payable: string;
  transaction_volume: number;
  payment_reliability_score: number;
  grade: "A" | "B" | "C" | "D" | string;
  grade_basis: "graded" | "insufficient_history" | "no_history_overdue" | string;
};

export type CounterpartyScorecardsResponse = {
  scorecards: CounterpartyScorecard[];
};

export async function getCounterpartyScorecards(
  getIdToken: () => Promise<string>,
): Promise<CounterpartyScorecardsResponse> {
  return apiRequest<CounterpartyScorecardsResponse>(apiPath("/trade/counterparties/scorecards"), {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
}

export type SettlementLedgerQuery = {
  limit?: number;
  offset?: number;
  // 3-letter ISO-4217 code — restrict to one currency (#409 통화 선택).
  currency?: string;
  // One of SETTLEMENT_BUCKETS (overdue | d0_7 | d8_30 | d31_90 | later) — the
  // same fund-calendar bucket a calendar cell click narrows to (#409 일정
  // 구간 선택 → 원장 조건 변경).
  bucket?: SettlementBucket;
  // true = also list a cancelled Deal's residual schedule rows, tagged
  // deal_cancelled (#472 취소·종료 포함). Defaults to false server-side.
  includeCancelled?: boolean;
};

export async function getSettlementLedger(
  getIdToken: () => Promise<string>,
  type?: "receivable" | "payable" | "direction_pending",
  page?: SettlementLedgerQuery,
): Promise<LedgerResponse> {
  const qs = new URLSearchParams();
  if (type) qs.set("type", type);
  if (page?.limit !== undefined) qs.set("limit", String(page.limit));
  if (page?.offset !== undefined) qs.set("offset", String(page.offset));
  if (page?.currency) qs.set("currency", page.currency);
  if (page?.bucket) qs.set("bucket", page.bucket);
  if (page?.includeCancelled) qs.set("include_cancelled", "true");
  const query = qs.toString();
  return apiRequest<LedgerResponse>(apiPath(`/trade/settlement/ledger${query ? `?${query}` : ""}`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
}

// P0-C 되돌리기: 송금 완료 취소 — reverts a completed schedule to 'scheduled'
// (BE serialises the deal-settled decision; 409s surface as ApiError).
export async function uncompleteSchedule(
  getIdToken: () => Promise<string>,
  scheduleId: string,
): Promise<void> {
  await apiRequest<unknown>(
    apiPath(`/erp/payment-schedules/${encodeURIComponent(scheduleId)}/uncomplete`),
    {
      baseUrl: apiBaseUrl(),
      getIdToken,
      init: { method: "POST" },
    },
  );
}

// Download the FULL settlement ledger as the server-rendered accountant CSV
// (every row, finance-fact enrichment, formula-injection neutralised, UTF-8
// BOM for Korean Excel). The browser CSV assembly this replaces could only
// see the fetched page and silently dropped the rest of the book.
export async function downloadSettlementLedgerCsv(
  getIdToken: () => Promise<string>,
  options?: {
    type?: "receivable" | "payable";
    /** "kr-tax" renders the KOREA 세무사/더존 월간 명세서 layout (Korean
        headers). Presets are country-namespaced (future: jp-tax, br-nfe);
        the server keeps legacy "tax" as an alias for stale bundles. */
    preset?: "kr-tax";
    /** YYYY-MM window on due dates — the 월간 명세서 month. */
    month?: string;
    /** 3-letter ISO-4217 code — restrict the export to one currency, mirroring
        the screen's active currency filter (#409 내보내기가 현재 필터를 무시). */
    currency?: string;
    /** One of SETTLEMENT_BUCKETS — restrict to one fund-calendar bucket,
        mirroring the screen's active calendar-cell filter (#409). */
    bucket?: SettlementBucket;
    /** true = also export cancelled-Deal residual rows (#472), mirroring the
        screen's 취소·종료 포함 toggle. Defaults to false server-side. */
    includeCancelled?: boolean;
  },
): Promise<Blob> {
  const token = await getIdToken();
  const params = new URLSearchParams();
  if (options?.type) params.set("type", options.type);
  if (options?.preset) params.set("preset", options.preset);
  if (options?.month) params.set("month", options.month);
  if (options?.currency) params.set("currency", options.currency);
  if (options?.bucket) params.set("bucket", options.bucket);
  if (options?.includeCancelled) params.set("include_cancelled", "true");
  const query = params.size > 0 ? `?${params.toString()}` : "";
  const response = await fetch(`/__reference3030${apiPath(`/trade/settlement/ledger/export${query}`)}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`settlement CSV export failed: HTTP ${response.status}`);
  }
  return response.blob();
}

// Drill one settlement summary row into its unsettled schedules. A null/empty
// counterparty targets the "unlinked" bucket (schedules with no resolvable
// counterparty label) via unlinked=true — those rows have no label to match,
// and sending counterparty="" used to 400.
//
// counterpartyId, when present, is sent instead of the name (#502): it is
// the resolved counterparty master id the sibling counterpart list
// (getSettlementOverview's by_counterparty / the ERP counterpart list) emits
// alongside the same row's name, and it stays correct across a rename or
// merge that leaves the cached name string pointing at stale/ambiguous rows.
// Never paired with unlinked — a resolved id is by definition not the
// unlinked (no-master) bucket.
export async function getSettlementCounterpartyDeals(
  getIdToken: () => Promise<string>,
  counterparty: string | null,
  currency?: string,
  counterpartyId?: string | null,
): Promise<SettlementDealsResponse> {
  const qs = new URLSearchParams();
  if (currency) qs.set("currency", currency);
  if (counterpartyId) {
    qs.set("counterparty_id", counterpartyId);
  } else if (counterparty === null || counterparty === undefined) {
    qs.set("unlinked", "true");
  } else {
    // An empty-string label is broken data, not the unlinked bucket — pass it
    // through so the backend's 400 surfaces instead of drilling wrong rows.
    qs.set("counterparty", counterparty);
  }
  return apiRequest<SettlementDealsResponse>(apiPath(`/erp/settlement/deals?${qs.toString()}`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
}

export async function getTradeFinanceFacts(
  getIdToken: () => Promise<string>,
  params: { currency?: string; dealId?: string; limit?: number } = {},
): Promise<TradeFinanceFactsResponse> {
  const qs = new URLSearchParams();
  if (params.dealId) qs.set("deal_id", params.dealId);
  if (params.currency) qs.set("currency", params.currency);
  if (params.limit !== undefined) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return apiRequest<TradeFinanceFactsResponse>(apiPath(`/trade/finance-facts${query ? `?${query}` : ""}`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
}

// P1 스케일: the deals-list enrichment, settlement rollups, and home GP cards
// all read the server's default 200-fact window — deals past it silently lost
// their finance enrichment and rollups under-counted. getAllTradeFinanceFacts
// pages at the server max (500/page; facts are one row per (deal_id, currency)
// ordered deterministically, so offset paging is stable) until a short page.
export const FINANCE_FACTS_PAGE_LIMIT = 500;
// Runaway guard (10 pages = 5,000 fact rows); truncates with a console.warn.
const FINANCE_FACTS_MAX_PAGES = 10;

// In-flight dedupe: home and settlement surfaces can mount together and want
// the same sweep — concurrent same-key calls share one promise. Browser-only
// (SSR must not share state across users); entries clear when the sweep
// settles, so this coalesces concurrency without caching staleness.
const inflightFactSweeps =
  typeof window !== "undefined" ? new Map<string, Promise<TradeFinanceFactsResponse>>() : null;

export function getAllTradeFinanceFacts(
  getIdToken: () => Promise<string>,
  params: { currency?: string; dealId?: string } = {},
): Promise<TradeFinanceFactsResponse> {
  const sweepKey = `${params.dealId ?? ""}|${params.currency ?? ""}`;
  const inflight = inflightFactSweeps?.get(sweepKey);
  if (inflight) return inflight;

  const sweep = (async () => {
    try {
      const byKey = new Map<string, TradeFinanceFact>();
      for (let page = 0; page < FINANCE_FACTS_MAX_PAGES; page += 1) {
        const qs = new URLSearchParams({
          limit: String(FINANCE_FACTS_PAGE_LIMIT),
          offset: String(page * FINANCE_FACTS_PAGE_LIMIT),
        });
        if (params.currency) qs.set("currency", params.currency);
        // backend#641 added the deal-scoped path; a deal-scoped sweep uses it
        // so the server owns the deal filter, and the query-style deal_id
        // form is left to the unscoped sweep only (#473). `dealId` is matched
        // on presence, not truthiness: an explicit "" is a caller bug, and
        // silently widening it to the org-wide sweep would leak every deal's
        // finance facts to a caller that asked for one deal.
        const factsPath =
          params.dealId === undefined
            ? `/trade/finance-facts?${qs.toString()}`
            : `/trade/finance-facts/deal/${encodeURIComponent(params.dealId)}?${qs.toString()}`;
        // Per-page transient retry so a mid-sweep 429/5xx does not restart
        // the whole sweep against the per-IP rate-limit burst.
        const response = await withRetry(
          () =>
            apiRequest<TradeFinanceFactsResponse>(apiPath(factsPath), {
              baseUrl: apiBaseUrl(),
              getIdToken,
            }),
          { retries: 2, baseDelayMs: 500 },
        );
        // Null-safe; dedupe on the (deal_id, currency) fact grain in case a
        // row repeats across a moving page boundary.
        const facts = response?.facts ?? [];
        for (const fact of facts) byKey.set(`${fact.deal_id ?? ""}|${fact.currency}`, fact);
        if (facts.length < FINANCE_FACTS_PAGE_LIMIT) {
          return { facts: [...byKey.values()] };
        }
      }
      console.warn(
        `getAllTradeFinanceFacts: page cap reached (${FINANCE_FACTS_MAX_PAGES} pages × ${FINANCE_FACTS_PAGE_LIMIT}); fact snapshot is truncated`,
      );
      return { complete: false, facts: [...byKey.values()] };
    } finally {
      inflightFactSweeps?.delete(sweepKey);
    }
  })();

  inflightFactSweeps?.set(sweepKey, sweep);
  return sweep;
}

// erp-v2-adapt: begin - platform exposes deal-scoped finance facts but not canon's economics endpoint.

function financeFactActivity(fact: TradeFinanceFact): bigint {
  return [
    fact.revenue_amount,
    fact.goods_cost_amount,
    fact.landed_cost_amount,
    fact.receivable_amount,
    fact.payable_amount,
  ].reduce((sum, raw) => {
    const amount = financeDecimalMagnitude(raw);
    return sum + (amount < BigInt(0) ? -amount : amount);
  }, BigInt(0));
}

export async function getDealEconomics(
  dealId: string,
  getIdToken: () => Promise<string>,
): Promise<DealEconomicsResponse> {
  const response = await getAllTradeFinanceFacts(getIdToken, { dealId });
  const buckets = [...(response.facts ?? [])].sort((left, right) => {
    const leftActivity = financeFactActivity(left);
    const rightActivity = financeFactActivity(right);
    if (leftActivity !== rightActivity) return leftActivity > rightActivity ? -1 : 1;
    return left.currency.localeCompare(right.currency);
  });
  const activeBuckets = buckets.filter((bucket) => financeFactActivity(bucket) > BigInt(0));

  return {
    basis: "document",
    buckets,
    currency_mixed: activeBuckets.length > 1,
    deal_id: dealId,
    dominant_currency: activeBuckets[0]?.currency,
  };
}
// erp-v2-adapt: end

// Fund-calendar bucket order + labels are stable product vocabulary.
export const SETTLEMENT_BUCKETS = ["overdue", "d0_7", "d8_30", "d31_90", "later"] as const;
export type SettlementBucket = (typeof SETTLEMENT_BUCKETS)[number];

export const CASH_CALENDAR_BUCKETS = [
  "overdue",
  "this_week",
  "next_week",
  "this_month",
  "later",
] as const;
export type CashCalendarBucket = (typeof CASH_CALENDAR_BUCKETS)[number];

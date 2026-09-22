import { ApiError, apiRequest, platformApiBaseUrl, platformApiPath } from "./client";

const CANONICAL_UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export type ScheduleReconciliationState = {
  code: string;
  legacy_payment_amount: string;
  legacy_payment_count: number;
  pre_lineage_application_count: number;
  required: boolean;
};

export type ScheduleCashEventType = "application" | "replacement" | "reversal";

export type ScheduleCashEvent = {
  id: string;
  cash_receipt_id: string;
  root_application_id: string;
  amount: string;
  event_type: ScheduleCashEventType;
  revision: number;
  reason?: string | null;
  created_by?: string | null;
  created_at: string;
  current: boolean;
  cash_amount: string;
  cash_unapplied: string;
  cash_fee: string;
  currency: string;
  value_date: string;
  note?: string | null;
  source_document_id?: string | null;
};

export type ScheduleCashLedger = {
  schedule_id: string;
  amount: string;
  paid: string;
  outstanding: string;
  // Schedule-level over-application retained for the legacy-compatible money
  // projection. This is not the raw cash receipt's unapplied balance.
  surplus: string;
  writer_enabled: boolean;
  reconciliation_required: boolean;
  reconciliation: ScheduleReconciliationState;
  events: ScheduleCashEvent[];
  truncated: boolean;
};

export type RecordScheduleCashBody = {
  amount: string;
  application_amount: string;
  currency?: string;
  fee?: string;
  value_date: string;
  note?: string;
  source_document_id?: string;
};

export type CashReceiptResponse = {
  id: string;
  source_document_id?: string | null;
  counterparty_id?: string | null;
  direction?: "inbound" | "outbound" | null;
  currency: string;
  amount: string;
  fee_amount: string;
  value_date: string;
  note?: string | null;
  created_by?: string | null;
  created_at: string;
  idempotency_replayed: boolean;
};

export type PaymentApplicationResponse = {
  id: string;
  root_application_id?: string | null;
  cash_receipt_id: string;
  schedule_id: string;
  amount: string;
  event_type?: ScheduleCashEventType | null;
  revision?: number | null;
  supersedes_id?: string | null;
  reversal_of_id?: string | null;
  reason?: string | null;
  created_by?: string | null;
  created_at: string;
  idempotency_replayed: boolean;
};

export type RecordScheduleCashResponse = {
  cash_receipt: CashReceiptResponse;
  application: PaymentApplicationResponse;
  schedule_id: string;
  amount: string;
  paid: string;
  outstanding: string;
  surplus: string;
};

export type ReversePaymentApplicationBody = {
  expected_revision: number;
  reason: string;
};

export type ReplacePaymentApplicationBody = ReversePaymentApplicationBody & {
  replacement_amount: string;
};

function requireCanonicalMoneyCommandKey(idempotencyKey: string) {
  if (!CANONICAL_UUID_V4_PATTERN.test(idempotencyKey)) {
    throw new ApiError({
      code: "ERP_SETTLEMENT_VALIDATION",
      message: "Idempotency-Key must be a canonical lowercase UUIDv4",
      status: 400,
    });
  }
}

export function createMoneyCommandIdempotencyKey(): string {
  const key = globalThis.crypto?.randomUUID?.();
  if (!key || !CANONICAL_UUID_V4_PATTERN.test(key)) {
    throw new ApiError({
      code: "ERP_SETTLEMENT_VALIDATION",
      message: "A canonical money command key could not be created",
      status: 500,
    });
  }
  return key;
}

/**
 * RT-1225-01 follow-up N3: answers "can this browsing context mint a money
 * command key at all?" by running the real factory once and discarding the
 * result, so the answer can never drift from the factory's actual failure
 * condition (globalThis.crypto.randomUUID missing — a non-secure origin — or
 * producing a non-canonical value). The probe key is never stored or sent.
 * Screens use this to lock money UI before a user invests work in it; it does
 * not replace the fail-closed guards on the submit path.
 */
export function canMintMoneyCommandKey(): boolean {
  try {
    return Boolean(createMoneyCommandIdempotencyKey());
  } catch {
    return false;
  }
}

export async function getScheduleCashApplications(
  scheduleId: string,
  getIdToken: () => Promise<string>,
): Promise<ScheduleCashLedger> {
  return apiRequest<ScheduleCashLedger>(
    platformApiPath(
      `/erp/payment-schedules/${encodeURIComponent(scheduleId)}/cash-applications`,
    ),
    { baseUrl: platformApiBaseUrl(), getIdToken },
  );
}

export async function recordScheduleCashApplication(
  scheduleId: string,
  body: RecordScheduleCashBody,
  idempotencyKey: string,
  getIdToken: () => Promise<string>,
): Promise<RecordScheduleCashResponse> {
  requireCanonicalMoneyCommandKey(idempotencyKey);
  return apiRequest<RecordScheduleCashResponse>(
    platformApiPath(
      `/erp/payment-schedules/${encodeURIComponent(scheduleId)}/cash-applications`,
    ),
    {
      baseUrl: platformApiBaseUrl(),
      getIdToken,
      init: {
        body: JSON.stringify(body),
        headers: { "Idempotency-Key": idempotencyKey },
        method: "POST",
      },
    },
  );
}

async function mutatePaymentApplication(
  path: string,
  body: ReversePaymentApplicationBody | ReplacePaymentApplicationBody,
  idempotencyKey: string,
  getIdToken: () => Promise<string>,
): Promise<PaymentApplicationResponse> {
  requireCanonicalMoneyCommandKey(idempotencyKey);
  return apiRequest<PaymentApplicationResponse>(
    path,
    {
      baseUrl: platformApiBaseUrl(),
      getIdToken,
      init: {
        body: JSON.stringify(body),
        headers: { "Idempotency-Key": idempotencyKey },
        method: "POST",
      },
    },
  );
}

export function reversePaymentApplication(
  applicationId: string,
  body: ReversePaymentApplicationBody,
  idempotencyKey: string,
  getIdToken: () => Promise<string>,
) {
  return mutatePaymentApplication(
    platformApiPath(
      `/erp/payment-applications/${encodeURIComponent(applicationId)}/reversal`,
    ),
    body,
    idempotencyKey,
    getIdToken,
  );
}

export function replacePaymentApplication(
  applicationId: string,
  body: ReplacePaymentApplicationBody,
  idempotencyKey: string,
  getIdToken: () => Promise<string>,
) {
  return mutatePaymentApplication(
    platformApiPath(
      `/erp/payment-applications/${encodeURIComponent(applicationId)}/replacement`,
    ),
    body,
    idempotencyKey,
    getIdToken,
  );
}

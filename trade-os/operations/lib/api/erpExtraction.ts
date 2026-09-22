import { ApiError, apiRequest } from "./client";

export type ExtractionFieldRowStatus = "staged" | "edited" | "missing" | "confirmed" | string;

export type ExtractionField = {
  id: string;
  org_id?: string;
  document_id: string;
  target_table: string;
  field_name: string;
  field_kind?: string;
  value_type?: "text" | "number" | "price" | "date" | "enum" | string;
  enum_options?: string[];
  row_index: number;
  suggested_value?: string | null;
  current_value?: string | null;
  // BE FieldResponse.quantity_value / quantity_unit — server-authoritative split for quantity rows.
  quantity_value?: string | null;
  quantity_unit?: string | null;
  // D1: per-field AI 추출 신뢰도 0~1 (BE FieldResponse.confidence, omitempty). 미산출 시 부재 → 회색 dot.
  confidence?: number | null;
  // BE FieldResponse.source_page — 1-based PDF page when vision tier emits it.
  source_page?: number | null;
  row_status: ExtractionFieldRowStatus;
  confirmed: boolean;
  confirmed_at?: string | null;
  confirmed_by?: string | null;
  last_changed_by?: string | null;
  change_reason?: string | null;
  created_at: string;
  updated_at: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasOwn(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isOptionalNullableString(record: Record<string, unknown>, key: string): boolean {
  return !hasOwn(record, key) || isNullableString(record[key]);
}

function isOptionalString(record: Record<string, unknown>, key: string): boolean {
  return !hasOwn(record, key) || typeof record[key] === "string";
}

/**
 * Runtime boundary guard for the authoritative by-id FieldResponse.
 *
 * The generated client type is compile-time-only; a malformed 200 response
 * must not reach the Confirm reducer, where field names and values are used by
 * render/edit paths. The backend may omit a nil `current_value` under
 * `omitempty`; the normalizer restores that omission as an explicit null.
 */
export function isExtractionFieldResponse(value: unknown): value is ExtractionField {
  if (!isRecord(value)) return false;

  const requiredStrings = [
    "id",
    "document_id",
    "target_table",
    "field_name",
    "row_status",
    "created_at",
    "updated_at",
  ] as const;
  if (requiredStrings.some((key) => typeof value[key] !== "string")) return false;
  if (
    typeof value.row_index !== "number" ||
    !Number.isSafeInteger(value.row_index) ||
    value.row_index < 0 ||
    typeof value.confirmed !== "boolean"
  ) {
    return false;
  }
  if (hasOwn(value, "current_value") && !isNullableString(value.current_value)) return false;

  if (!isOptionalNullableString(value, "suggested_value")) return false;
  if (!isOptionalNullableString(value, "quantity_value")) return false;
  if (!isOptionalNullableString(value, "quantity_unit")) return false;
  if (!isOptionalNullableString(value, "confirmed_at")) return false;
  if (!isOptionalNullableString(value, "confirmed_by")) return false;
  if (!isOptionalNullableString(value, "last_changed_by")) return false;
  if (!isOptionalNullableString(value, "change_reason")) return false;
  if (!isOptionalString(value, "org_id")) return false;
  if (!isOptionalString(value, "field_kind")) return false;
  if (!isOptionalString(value, "value_type")) return false;

  if (hasOwn(value, "enum_options") && (!Array.isArray(value.enum_options) || !value.enum_options.every((item) => typeof item === "string"))) {
    return false;
  }
  if (hasOwn(value, "confidence") && value.confidence !== null && (typeof value.confidence !== "number" || !Number.isFinite(value.confidence))) {
    return false;
  }
  if (hasOwn(value, "source_page") && value.source_page !== null && (!Number.isInteger(value.source_page) || typeof value.source_page !== "number")) {
    return false;
  }

  return true;
}

export function normalizeExtractionFieldResponse(value: unknown): ExtractionField | null {
  if (!isExtractionFieldResponse(value)) return null;
  return { ...value, current_value: value.current_value ?? null };
}

export type ExtractionFieldListResponse = {
  // BE FieldListResponse.document — 부모 문서 메타. BE-1: filename(원본 업로드 파일명, omitempty=twin 없으면 부재).
  document?: {
    source_state?: string;
    readonly status?: string | null;
    // BE FieldListResponse.document.revision is the compare-and-set token
    // required by the Confirm commit endpoint. It stays optional at the
    // transport boundary so malformed/legacy responses can be rejected by the
    // Confirm preflight instead of being silently coerced to a fake revision.
    revision?: number;
    filename?: string | null;
    // FS-09 §2 원본·근거: AI 제공자·모델·버전. Null/absent means the
    // extraction run recorded no model provenance; the client must not invent it.
    extraction_provider?: string | null;
    extraction_model?: string | null;
    extraction_api_version?: string | null;
  };
  items: ExtractionField[];
};

function normalizeExtractionFieldListDocument(
  value: unknown,
): ExtractionFieldListResponse["document"] | null | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) return null;

  const document: {
    source_state?: string;
    status?: string | null;
    revision?: number;
    filename?: string | null;
    extraction_provider?: string | null;
    extraction_model?: string | null;
    extraction_api_version?: string | null;
  } = {};
  if (hasOwn(value, "source_state")) {
    if (typeof value.source_state !== "string") return null;
    document.source_state = value.source_state;
  }
  if (hasOwn(value, "status")) {
    if (!isNullableString(value.status)) return null;
    document.status = value.status;
  }
  if (hasOwn(value, "revision")) {
    if (typeof value.revision !== "number" || !Number.isInteger(value.revision)) return null;
    document.revision = value.revision;
  }
  for (const key of [
    "filename",
    "extraction_provider",
    "extraction_model",
    "extraction_api_version",
  ] as const) {
    if (hasOwn(value, key)) {
      if (!isNullableString(value[key])) return null;
      document[key] = value[key];
    }
  }

  return document;
}

export function normalizeExtractionFieldListResponse(value: unknown): ExtractionFieldListResponse | null {
  if (!isRecord(value) || !Array.isArray(value.items)) return null;

  const items: ExtractionField[] = [];
  for (const item of value.items) {
    const normalizedItem = normalizeExtractionFieldResponse(item);
    if (normalizedItem === null) return null;
    items.push(normalizedItem);
  }

  const document = normalizeExtractionFieldListDocument(value.document);
  if (document === null) return null;
  return document === undefined ? { items } : { document, items };
}

export type PatchExtractionFieldBody = {
  current_value: string | null;
  change_reason?: string | null;
};


export type UserExtractionFieldKind = "user_text" | "user_number" | "user_price" | "user_date" | "user_enum";

export type CreateUserExtractionFieldBody = {
  target_table: string;
  field_name: string;
  field_kind: UserExtractionFieldKind;
  enum_options?: string[];
};

/**
 * The backend's closed standard-repeat allow-list currently contains only
 * `container_number`. Keep the client type closed as well so aliases cannot
 * accidentally reach the mutation endpoint.
 */
export type StandardExtractionFieldName = "container_number";

export type CreateStandardExtractionRowBody = {
  target_table: string;
  field_name: StandardExtractionFieldName;
  row_index: number;
  current_value: string | null;
  expected_revision: number;
};

export type DeleteStandardExtractionRowResponse = {
  document_revision: number;
};

export type ConfirmExtractionDocumentTransitionResponse = {
  document_id: string;
  confirmed_count: number;
  document_status: string;
  follow_up_status?: "pending" | "running" | "completed" | "failed" | (string & {});
  payment_schedule?: {
    id: string;
    amount: string;
    currency: string;
    due_date: string;
    deal_id?: string | null;
  } | null;
  deal?: { id: string; display_id?: string | null } | null;
  replayed: boolean;
  trade_document_id: string;
  doc_type: string;
  deal_id?: string | null;
};

export type ConfirmExtractionDocumentTransitionOptions = {
  readonly archivePolicy?: "keep_original" | "data_only";
  readonly dealId: string;
  readonly docType?: string;
  readonly expectedRevision: number;
  readonly idempotencyKey: string;
  readonly tradeDocumentId: string;
  readonly triggerWarningsAcknowledged?: boolean;
};

type ConfirmExtractionDocumentTransitionBody = {
  archive_policy?: "keep_original" | "data_only";
  deal_id: string;
  doc_type?: string;
  expected_revision: number;
  idempotency_key: string;
  trade_document_id: string;
  trigger_warnings_acknowledged: boolean;
};

function normalizeConfirmTransitionResponse(
  value: unknown,
): ConfirmExtractionDocumentTransitionResponse | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.document_id !== "string" ||
    !isUuidLike(value.document_id) ||
    typeof value.trade_document_id !== "string" ||
    !isUuidLike(value.trade_document_id) ||
    typeof value.document_status !== "string" ||
    typeof value.doc_type !== "string" ||
    typeof value.confirmed_count !== "number" ||
    !Number.isSafeInteger(value.confirmed_count) ||
    value.confirmed_count < 0 ||
    typeof value.replayed !== "boolean"
  ) {
    return null;
  }
  if (
    hasOwn(value, "deal_id") &&
    value.deal_id !== null &&
    (typeof value.deal_id !== "string" || !isUuidLike(value.deal_id))
  ) {
    return null;
  }
  if (
    hasOwn(value, "follow_up_status") &&
    typeof value.follow_up_status !== "string"
  ) {
    return null;
  }
  if (hasOwn(value, "deal") && value.deal !== null) {
    if (!isRecord(value.deal) || typeof value.deal.id !== "string" || !isUuidLike(value.deal.id)) {
      return null;
    }
    if (
      hasOwn(value.deal, "display_id") &&
      value.deal.display_id !== null &&
      typeof value.deal.display_id !== "string"
    ) {
      return null;
    }
  }
  if (hasOwn(value, "payment_schedule") && value.payment_schedule !== null) {
    if (
      !isRecord(value.payment_schedule) ||
      typeof value.payment_schedule.id !== "string" ||
      typeof value.payment_schedule.amount !== "string" ||
      typeof value.payment_schedule.currency !== "string" ||
      typeof value.payment_schedule.due_date !== "string"
    ) {
      return null;
    }
    if (
      hasOwn(value.payment_schedule, "deal_id") &&
      value.payment_schedule.deal_id !== null &&
      (typeof value.payment_schedule.deal_id !== "string" ||
        !isUuidLike(value.payment_schedule.deal_id))
    ) {
      return null;
    }
  }

  return value as ConfirmExtractionDocumentTransitionResponse;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// erp-v2-adapt: begin
const EXTRACTION_FIELDS_FETCH_LIMIT = 500;
// erp-v2-adapt: end

// A null/undefined identifier is never UUID-like. Keep the predicate total so
// nullable upstream identifiers can never crash validation through `.trim()`.
export function isUuidLike(value: string | null | undefined): boolean {
  return typeof value === "string" && UUID_PATTERN.test(value.trim());
}

export function normalizeUuidDocumentId(documentId: string): string {
  const normalizedDocumentId = documentId.trim().toLowerCase();

  if (!isUuidLike(normalizedDocumentId)) {
    throw new ApiError({
      code: "ERP_HITL_INVALID_DOCUMENT_ID",
      message: "document_id must be a UUID",
      status: 400,
    });
  }

  return normalizedDocumentId;
}

export function assertUuidDocumentId(documentId: string): void {
  normalizeUuidDocumentId(documentId);
}

export function normalizeUuidFieldId(fieldId: string): string {
  const normalizedFieldId = fieldId.trim().toLowerCase();

  if (!isUuidLike(normalizedFieldId)) {
    throw new ApiError({
      code: "ERP_HITL_INVALID_FIELD_ID",
      message: "field_id must be a UUID",
      status: 400,
    });
  }

  return normalizedFieldId;
}

function apiPath(path: string): string {
  return typeof window !== "undefined" ? `/api/platform${path}` : `/api/v1${path}`;
}

function apiBaseUrl(): string | undefined {
  return typeof window !== "undefined" ? "" : undefined;
}

export async function listExtractionFieldsForDocument(
  documentId: string,
  getIdToken: () => Promise<string>,
): Promise<ExtractionFieldListResponse> {
  const normalizedDocumentId = normalizeUuidDocumentId(documentId);
  // erp-v2-adapt: begin
  const path =
    EXTRACTION_FIELDS_FETCH_LIMIT > 0
      ? apiPath(
          `/erp/extraction/documents/${encodeURIComponent(normalizedDocumentId)}/fields?limit=${EXTRACTION_FIELDS_FETCH_LIMIT}`,
        )
      : apiPath(`/erp/extraction/documents/${encodeURIComponent(normalizedDocumentId)}/fields`);
  // erp-v2-adapt: end
  const response = await apiRequest<unknown>(path, {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
  const normalizedResponse = normalizeExtractionFieldListResponse(response);
  if (normalizedResponse === null) {
    throw new ApiError({
      code: "API_INVALID_RESPONSE",
      message: "Platform API returned an invalid extraction field list",
      status: 502,
    });
  }

  if (normalizedResponse.items.length === EXTRACTION_FIELDS_FETCH_LIMIT) {
    console.warn(`ERP extraction fields reached the ${EXTRACTION_FIELDS_FETCH_LIMIT}-row fetch limit`, {
      documentId: normalizedDocumentId,
    });
  }

  return normalizedResponse;
}

export async function getExtractionField(
  fieldId: string,
  getIdToken: () => Promise<string>,
): Promise<ExtractionField> {
  const normalizedFieldId = encodeURIComponent(normalizeUuidFieldId(fieldId));

  const response = await apiRequest<unknown>(apiPath(`/erp/extraction/fields/${normalizedFieldId}`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: {
      method: "GET",
    },
  });
  const normalizedResponse = normalizeExtractionFieldResponse(response);
  if (normalizedResponse === null) {
    throw new ApiError({
      code: "API_INVALID_RESPONSE",
      message: "Platform API returned an invalid extraction field",
      status: 502,
    });
  }
  return normalizedResponse;
}

export async function patchExtractionField(
  fieldId: string,
  body: PatchExtractionFieldBody,
  getIdToken: () => Promise<string>,
): Promise<ExtractionField> {
  const normalizedFieldId = encodeURIComponent(normalizeUuidFieldId(fieldId));

  return apiRequest<ExtractionField>(apiPath(`/erp/extraction/fields/${normalizedFieldId}`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: {
      body: JSON.stringify(body),
      method: "PATCH",
    },
  });
}

export async function createUserExtractionField(
  documentId: string,
  body: CreateUserExtractionFieldBody,
  getIdToken: () => Promise<string>,
): Promise<ExtractionField> {
  const normalizedDocumentId = normalizeUuidDocumentId(documentId);

  return apiRequest<ExtractionField>(apiPath(`/erp/extraction/documents/${normalizedDocumentId}/user-fields`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: {
      body: JSON.stringify(body),
      method: "POST",
    },
  });
}

function assertPositiveRevision(expectedRevision: number): void {
  if (
    !Number.isSafeInteger(expectedRevision) ||
    expectedRevision < 1
  ) {
    throw new ApiError({
      code: "ERP_HITL_INVALID_EXPECTED_REVISION",
      message: "expected_revision must be a positive integer",
      status: 400,
    });
  }
}

function assertStandardRowBody(body: CreateStandardExtractionRowBody): void {
  if (body.field_name !== "container_number") {
    throw new ApiError({
      code: "ERP_HITL_INVALID_STANDARD_ROW",
      message: "field_name must be container_number",
      status: 400,
    });
  }
  if (!body.target_table.trim()) {
    throw new ApiError({
      code: "ERP_HITL_INVALID_STANDARD_ROW",
      message: "target_table must not be empty",
      status: 400,
    });
  }
  if (!Number.isSafeInteger(body.row_index) || body.row_index < 0) {
    throw new ApiError({
      code: "ERP_HITL_INVALID_STANDARD_ROW",
      message: "row_index must be a non-negative integer",
      status: 400,
    });
  }
  assertPositiveRevision(body.expected_revision);
}

function normalizeDeleteStandardExtractionRowResponse(
  value: unknown,
): DeleteStandardExtractionRowResponse | null {
  if (!isRecord(value)) return null;
  const documentRevision = value.document_revision;
  if (
    typeof documentRevision !== "number" ||
    !Number.isSafeInteger(documentRevision) ||
    documentRevision < 1
  ) {
    return null;
  }
  return { document_revision: documentRevision };
}

/** Add one backend-approved repeated standard extraction row. */
export async function createStandardExtractionRow(
  documentId: string,
  body: CreateStandardExtractionRowBody,
  getIdToken: () => Promise<string>,
): Promise<ExtractionField> {
  assertStandardRowBody(body);
  const normalizedDocumentId = encodeURIComponent(normalizeUuidDocumentId(documentId));
  const response = await apiRequest<unknown>(
    apiPath(`/erp/extraction/documents/${normalizedDocumentId}/rows`),
    {
      baseUrl: apiBaseUrl(),
      getIdToken,
      init: {
        body: JSON.stringify(body),
        method: "POST",
      },
    },
  );
  const normalizedResponse = normalizeExtractionFieldResponse(response);
  if (normalizedResponse === null) {
    throw new ApiError({
      code: "API_INVALID_RESPONSE",
      message: "Platform API returned an invalid standard extraction row",
      status: 502,
    });
  }
  return normalizedResponse;
}

/** Delete one backend-approved repeated standard extraction row. */
export async function deleteStandardExtractionRow(
  fieldId: string,
  expectedRevision: number,
  getIdToken: () => Promise<string>,
): Promise<DeleteStandardExtractionRowResponse> {
  assertPositiveRevision(expectedRevision);
  const normalizedFieldId = encodeURIComponent(normalizeUuidFieldId(fieldId));
  const response = await apiRequest<unknown>(
    apiPath(`/erp/extraction/rows/${normalizedFieldId}`),
    {
      baseUrl: apiBaseUrl(),
      getIdToken,
      init: {
        body: JSON.stringify({ expected_revision: expectedRevision }),
        method: "DELETE",
      },
    },
  );
  const normalizedResponse = normalizeDeleteStandardExtractionRowResponse(response);
  if (normalizedResponse === null) {
    throw new ApiError({
      code: "API_INVALID_RESPONSE",
      message: "Platform API returned an invalid standard row deletion response",
      status: 502,
    });
  }
  return normalizedResponse;
}

// W3-3 — 사용자정의 필드 삭제(정본 doc-field-schema §2.1 L410 "필드 항목 삭제 ✅").
// BE DELETE /erp/extraction/fields/:field_id → 204(빈 본문 → apiRequest null). 비-2xx 시 ApiError:
//   sys_* 필드면 400 · confirmed 면 409(의도적 deferral) · 없으면 404. FE 는 user_* non-confirmed
//   행에만 삭제를 노출해 400/409 를 사전 차단한다(ConfirmStepOneView 게이팅).
export async function deleteUserExtractionField(
  fieldId: string,
  getIdToken: () => Promise<string>,
): Promise<void> {
  const normalizedFieldId = encodeURIComponent(normalizeUuidFieldId(fieldId));

  return apiRequest<void>(apiPath(`/erp/extraction/fields/${normalizedFieldId}`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: {
      method: "DELETE",
    },
  });
}


export async function confirmExtractionDocumentTransition(
  documentId: string,
  getIdToken: () => Promise<string>,
  {
    archivePolicy,
    dealId,
    docType,
    expectedRevision,
    idempotencyKey,
    tradeDocumentId,
    triggerWarningsAcknowledged = false,
  }: ConfirmExtractionDocumentTransitionOptions,
): Promise<ConfirmExtractionDocumentTransitionResponse> {
  const normalizedDocumentId = normalizeUuidDocumentId(documentId);
  const encodedDocumentId = encodeURIComponent(normalizedDocumentId);
  const normalizedTradeDocumentId = tradeDocumentId.trim().toLowerCase();
  if (!isUuidLike(normalizedTradeDocumentId)) {
    throw new ApiError({
      code: "ERP_HITL_INVALID_TRADE_DOCUMENT_ID",
      message: "trade_document_id must be a UUID",
      status: 400,
    });
  }
  const normalizedDealId = dealId.trim().toLowerCase();
  if (!isUuidLike(normalizedDealId)) {
    throw new ApiError({
      code: "TRADE_DEAL_INVALID_DEAL_ID",
      message: "deal_id must be a UUID",
      status: 400,
    });
  }
  const normalizedIdempotencyKey = idempotencyKey.trim().toLowerCase();
  if (!isUuidLike(normalizedIdempotencyKey)) {
    throw new ApiError({
      code: "ERP_CONFIRM_INVALID_IDEMPOTENCY_KEY",
      message: "idempotency_key must be a UUID",
      status: 400,
    });
  }
  assertPositiveRevision(expectedRevision);

  const normalizedDocType = docType?.trim().toUpperCase();
  const body: ConfirmExtractionDocumentTransitionBody = {
    ...(archivePolicy ? { archive_policy: archivePolicy } : {}),
    deal_id: normalizedDealId,
    ...(normalizedDocType ? { doc_type: normalizedDocType } : {}),
    expected_revision: expectedRevision,
    idempotency_key: normalizedIdempotencyKey,
    trade_document_id: normalizedTradeDocumentId,
    trigger_warnings_acknowledged: triggerWarningsAcknowledged,
  };
  const response = await apiRequest<unknown>(
    apiPath(
      `/erp/extraction/documents/${encodedDocumentId}/confirm-transition`,
    ),
    {
      baseUrl: apiBaseUrl(),
      getIdToken,
      init: {
        body: JSON.stringify(body),
        method: "POST",
      },
    },
  );
  const normalizedResponse = normalizeConfirmTransitionResponse(response);
  const responseDealId = normalizedResponse?.deal_id?.trim().toLowerCase();
  const responseDealObjectId = normalizedResponse?.deal?.id?.trim().toLowerCase();
  if (
    normalizedResponse === null ||
    normalizedResponse.document_id.trim().toLowerCase() !== normalizedDocumentId ||
    normalizedResponse.trade_document_id.trim().toLowerCase() !== normalizedTradeDocumentId ||
    normalizedResponse.document_status.trim().toLowerCase() !== "committed" ||
    responseDealId !== normalizedDealId ||
    (responseDealObjectId !== undefined && responseDealObjectId !== normalizedDealId) ||
    (normalizedDocType !== undefined && normalizedResponse.doc_type.trim().toUpperCase() !== normalizedDocType)
  ) {
    throw new ApiError({
      code: "API_INVALID_RESPONSE",
      message: "Platform API returned an inconsistent Confirm transition response",
      status: 502,
    });
  }
  return normalizedResponse;
}

/**
 * Confirm-safe field history projection. The backend response contains
 * additional audit metadata, but Confirm only receives the values needed for
 * its read-only disclosure.
 */
export type FieldValueHistoryEntry = {
  field_id: string | null;
  previous_value: string | null;
  new_value: string | null;
  changed_at: string;
};

export type FieldHistoryResponse = {
  changes: FieldValueHistoryEntry[];
};

function normalizeFieldHistoryEntry(value: unknown): FieldValueHistoryEntry | null {
  if (!isRecord(value)) return null;
  if (!hasOwn(value, "field_id") || !isNullableString(value.field_id)) return null;
  if (!hasOwn(value, "changed_at") || typeof value.changed_at !== "string") return null;

  const previousValue = !hasOwn(value, "previous_value")
    ? null
    : isNullableString(value.previous_value)
      ? value.previous_value
      : null;
  const newValue = !hasOwn(value, "new_value")
    ? null
    : isNullableString(value.new_value)
      ? value.new_value
      : null;

  if (
    (hasOwn(value, "previous_value") && !isNullableString(value.previous_value)) ||
    (hasOwn(value, "new_value") && !isNullableString(value.new_value))
  ) {
    return null;
  }

  return {
    changed_at: value.changed_at,
    field_id: value.field_id,
    new_value: newValue,
    previous_value: previousValue,
  };
}

function normalizeFieldHistoryResponse(value: unknown): FieldHistoryResponse | null {
  if (!isRecord(value) || !hasOwn(value, "changes") || !Array.isArray(value.changes)) {
    return null;
  }

  const changes: FieldValueHistoryEntry[] = [];
  for (const entry of value.changes) {
    const normalizedEntry = normalizeFieldHistoryEntry(entry);
    if (normalizedEntry === null) return null;
    changes.push(normalizedEntry);
  }
  return { changes };
}

export async function listFieldHistoryForDocument(
  documentId: string,
  getIdToken: () => Promise<string>,
): Promise<FieldHistoryResponse> {
  const normalizedDocumentId = encodeURIComponent(normalizeUuidDocumentId(documentId));

  const response = await apiRequest<unknown>(
    apiPath(`/erp/extraction/documents/${normalizedDocumentId}/field-history`),
    {
      baseUrl: apiBaseUrl(),
      getIdToken,
    },
  );
  const normalizedResponse = normalizeFieldHistoryResponse(response);
  if (normalizedResponse === null) {
    throw new ApiError({
      code: "API_INVALID_RESPONSE",
      message: "Platform API returned an invalid field history response",
      status: 502,
    });
  }
  return normalizedResponse;
}

// Same-origin browser path to the original document bytes (PDF/image) backing
// the HITL Confirm preview. The Confirm screen is keyed by the erp_documents id
// — the same id used for /erp/extraction/documents/:id/fields and /commit — so
// the preview streams through the erp extraction content endpoint. Routing this
// through the trade docs content endpoint would 404: that :id is a
// trade_documents id (a different table/PK) than the erp document the Confirm
// screen holds.
export function extractionDocumentContentUrl(documentId: string): string {
  return `/api/platform/erp/extraction/documents/${encodeURIComponent(documentId)}/content`;
}

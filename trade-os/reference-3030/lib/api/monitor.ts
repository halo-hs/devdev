import { apiRequest, ApiError, DEFAULT_PLATFORM_API_BASE_URL } from "./client";

// erp-v2-adapt: begin - backend-contract shapes preserve platform helper exports while adding canon monitor snapshot reads.

// Monitor (Owner cockpit) read surface — mirrors ecoya-platform-backend
// internal/handler/erp monitor handlers (GET /api/v1/monitor/*). Every route
// is owner-gated (RequireOwner) and returns 403 for non-owner callers.
// Wire shapes verified against dev swagger (erp.*Response definitions).

// Every monitor endpoint carries its own `data_as_of` (required in swagger since
// backend#604): the UTC application-server time when that response's aggregation
// finished. It is computed-at metadata and is NOT atomic across the endpoints, so
// each response keeps its own value and the snapshot reduces them (see below).
export type MonitorDataAsOf = {
  data_as_of: string;
};

// --- GET /monitor/kpi (erp.KPIResponse) ---
export type MonitorKPI = MonitorDataAsOf & {
  today_processed: {
    count: number;
    delta_pct_vs_yesterday?: number | null;
  };
  completion_rate: {
    rate_pct: number;
    band: "green" | "yellow" | "red" | string;
    delta_pp_vs_last_week?: number | null;
    confirmed_this_week: number;
    uploaded_this_week: number;
  };
};

// --- GET /monitor/status (erp.StatusResponse) ---
export type MonitorStatusLevel = "red" | "yellow" | "green" | string;

export type MonitorStatusResponse = MonitorDataAsOf & {
  active_risk_count: number;
  level: MonitorStatusLevel;
  message: string;
  p0_count: number;
  unchecked_flag_count: number;
};

export type MonitorStatus = MonitorStatusResponse;

// --- GET /monitor/throughput?week=current|last (erp.ThroughputResponse) ---
export type MonitorThroughputWeek = "current" | "last";

export type MonitorAssigneeThroughput = {
  assignee_id: string;
  assignee_name: string;
  confirmed: number;
};

export type MonitorDailyThroughput = {
  confirmed: number;
  date: string;
  uploaded: number;
};

export type MonitorThroughputResponse = MonitorDataAsOf & {
  band: string;
  by_assignee: MonitorAssigneeThroughput[];
  confirmed: number;
  daily: MonitorDailyThroughput[];
  rate_pct: number;
  uploaded: number;
  week_end: string;
  week_start: string;
};

// --- GET /monitor/risks (erp.RisksResponse) ---
export type MonitorRiskDeal = {
  deal_id: string;
  // decimal/delta serialized as string — never coerce to number.
  delta: string;
  ref: string;
};

export type MonitorRiskGroup = {
  count: number;
  deals: MonitorRiskDeal[];
};

export type MonitorOverdueReceivable = {
  band: string;
  count: number;
  currency: string;
  // decimal serialized as string.
  total_amount: string;
  by_currency?: Array<{
    currency: string;
    count: number;
    total_amount: string;
  }>;
};

export type MonitorRisksResponse = MonitorDataAsOf & {
  overdue_receivable: MonitorOverdueReceivable;
  price_variance?: MonitorRiskGroup;
  qty_mismatch: MonitorRiskGroup;
  schedule_delay: MonitorRiskGroup;
};

export type MonitorRisks = MonitorRisksResponse;

// --- GET /monitor/blocked?priority=p0|p1 (erp.BlockedP0Response) ---
export type MonitorBlockedPriority = "p0" | "p1";

// P0 = doc-level (erp.BlockedP0ItemResponse). uploaded_by is *string,omitempty
// upstream (Go monitor.go) → optional/absent, so it must not be a required string.
export type MonitorBlockedItem = {
  age_hours: number;
  counterparty: string;
  doc_type: string;
  filename: string;
  id: string;
  status: string;
  uploaded_by?: string | null;
};

export type MonitorPaginationMeta = {
  limit: number;
  offset: number;
  total: number;
};

export type MonitorBlockedResponse = MonitorDataAsOf & {
  items: MonitorBlockedItem[];
  pagination: MonitorPaginationMeta;
};

export type MonitorBlockedP0 = MonitorBlockedResponse;

// P1 = DISTINCT deal-level shape (Go erp.BlockedP1Response, internal/handler/erp
// /monitor.go) that swagger does NOT document. The ?priority=p1 response is these
// deal-level fields, NOT the P0 doc-level shape — consuming it as P0 renders
// undefined (the data-integrity gap FE-1 fixes).
export type MonitorBlockedP1Item = {
  counterparty: string;
  d_day: number;
  deal_id: string;
  ref: string;
  target_etd: string;
};

export type MonitorBlockedP1Response = MonitorDataAsOf & {
  items: MonitorBlockedP1Item[];
  pagination: MonitorPaginationMeta;
};

export type MonitorBlockedP1 = MonitorBlockedP1Response;

// --- GET /monitor/pending-actions (erp.PendingActionsResponse) ---
export type MonitorPendingAction = {
  // decimal serialized as string.
  amount: string;
  // The deal owner. Present-and-null (never omitted) upstream so a client can
  // tell "nobody owns this" — FS-06 §2 미할당 — from "this build does not send
  // the field"; null therefore renders the unassigned state, not a blank.
  assignee_id: string | null;
  currency: string;
  d_day: number;
  deal_id: string;
  icon: string;
  label: string;
  ref: string;
  type: string;
};

export type MonitorPendingActionsResponse = MonitorDataAsOf & {
  items: MonitorPendingAction[];
};

export type MonitorPendingActions = MonitorPendingActionsResponse;

export type MonitorThroughput = MonitorThroughputResponse;

export type MonitorSnapshotArea = keyof Pick<
  MonitorSnapshot,
  "kpi" | "status" | "risks" | "pending" | "blockedP0" | "blockedP1" | "throughput"
>;

export type MonitorAreaMeta = {
  data_as_of: string;
  timezone: string;
  request_id: string;
  stale: boolean;
  // #711: true when data_as_of looked more than 5 minutes in the future
  // relative to the best "now" available (the server's own Date response
  // header when reachable, else the local clock). This used to reject the
  // area outright ("data_as_of is too far in the future"), which meant a
  // plain client/server clock skew rendered as a full backend outage on
  // every area at once. It no longer rejects anything -- the data is still
  // returned, this just lets a caller show a distinguishable caveat instead
  // of a generic error. Optional so existing fixtures/snapshots that predate
  // this field keep typechecking.
  clockSkew?: boolean;
};

export type MonitorAreaUpdate = {
  area: MonitorSnapshotArea;
  data?: unknown;
  meta?: MonitorAreaMeta;
  error?: string;
  forbidden?: boolean;
};

// The seven monitor reads are deliberately independent. A successful area is
// usable immediately while a failed area retains its last successful payload.
export type MonitorSnapshot = {
  kpi?: MonitorKPI;
  status?: MonitorStatus;
  risks?: MonitorRisks;
  pending?: MonitorPendingActions;
  blockedP0?: MonitorBlockedP0;
  blockedP1?: MonitorBlockedP1;
  throughput?: MonitorThroughput;
  partial_errors?: Partial<Record<MonitorSnapshotArea, string>>;
  area_meta?: Partial<Record<MonitorSnapshotArea, MonitorAreaMeta>>;
};

export const MONITOR_SNAPSHOT_AREAS: readonly MonitorSnapshotArea[] = [
  "kpi",
  "status",
  "risks",
  "pending",
  "blockedP0",
  "blockedP1",
  "throughput",
] as const;

// --- GET /erp/team/bottlenecks (erp.TeamBottlenecksResult) ---
export type TeamBottleneckItem = {
  delayed: number;
  in_progress: number;
  user_id: string;
  user_name: string;
};

export type TeamBottlenecksResponse = {
  items: TeamBottleneckItem[];
};

// --- GET /erp/team/reassign-queue (erp.ReassignQueueResult) ---
export type TeamReassignQueueItem = {
  assignee_user_id: string | null;
  deal_id: string;
  reason: string;
  title_or_ref: string;
};

export type TeamReassignQueueResponse = {
  items: TeamReassignQueueItem[];
};

// --- GET /erp/team/completion-rate (erp.TeamCompletionRateResult) ---
export type TeamCompletionRateResponse = {
  completion_rate: number;
  confirmed: number;
  total: number;
};

// --- GET /erp/home/today-completed (erp.TodayCompletedResult) ---
export type HomeTodayCompletedResponse = {
  count: number;
};

// --- GET /monitor/risk-severity (erp.RiskSeverityResult) ---
export type MonitorRiskSeverityResponse = {
  high: number;
  low: number;
  medium: number;
};

// --- GET /monitor/review-pending (erp.ReviewPendingResult) ---
export type MonitorReviewPendingResponse = {
  count: number;
};

// Browser calls the same-origin BFF proxy (/api/platform/*); server-side
// (RSC/route handlers) call the Platform backend (/api/v1/*) directly.
function monitorPath(path: string): string {
  return typeof window !== "undefined" ? `/api/platform${path}` : `/api/v1${path}`;
}

function monitorBaseUrl(): string {
  // 브라우저: same-origin BFF 프록시(""), 서버(SSR/RSC): 백엔드 절대 URL (deals.ts 패턴).
  return typeof window !== "undefined" ? "" : DEFAULT_PLATFORM_API_BASE_URL;
}

function withQuery(path: string, params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

// #711: lets getMonitorSnapshot peek at the raw Response (its Date header,
// specifically) without changing what every other caller of these
// individually-exported readers gets back. Optional and additive only.
export type MonitorReaderExtras = { onResponse?: (response: Response) => void };

export function getMonitorKPI(
  getIdToken: () => Promise<string>,
  extras?: MonitorReaderExtras,
): Promise<MonitorKPI> {
  return apiRequest<MonitorKPI>(monitorPath("/monitor/kpi"), {
    baseUrl: monitorBaseUrl(),
    getIdToken,
    onResponse: extras?.onResponse,
  });
}

export function getMonitorStatus(
  getIdToken: () => Promise<string>,
  extras?: MonitorReaderExtras,
): Promise<MonitorStatusResponse> {
  return apiRequest<MonitorStatusResponse>(monitorPath("/monitor/status"), {
    baseUrl: monitorBaseUrl(),
    getIdToken,
    onResponse: extras?.onResponse,
  });
}

export function getMonitorThroughput(
  getIdToken: () => Promise<string>,
  week?: MonitorThroughputWeek,
  extras?: MonitorReaderExtras,
): Promise<MonitorThroughputResponse> {
  return apiRequest<MonitorThroughputResponse>(withQuery(monitorPath("/monitor/throughput"), { week }), {
    baseUrl: monitorBaseUrl(),
    getIdToken,
    onResponse: extras?.onResponse,
  });
}

export function getMonitorRisks(
  getIdToken: () => Promise<string>,
  extras?: MonitorReaderExtras,
): Promise<MonitorRisksResponse> {
  return apiRequest<MonitorRisksResponse>(monitorPath("/monitor/risks"), {
    baseUrl: monitorBaseUrl(),
    getIdToken,
    onResponse: extras?.onResponse,
  });
}

// Overloaded so the P1 branch is typed as the deal-level shape: P0 → doc-level,
// P1 → deal-level (the endpoint returns different shapes keyed by ?priority).
export function getMonitorBlocked(
  priority: "p0",
  getIdToken: () => Promise<string>,
  extras?: MonitorReaderExtras,
): Promise<MonitorBlockedResponse>;
export function getMonitorBlocked(
  priority: "p1",
  getIdToken: () => Promise<string>,
  extras?: MonitorReaderExtras,
): Promise<MonitorBlockedP1Response>;
export function getMonitorBlocked(
  priority: MonitorBlockedPriority,
  getIdToken: () => Promise<string>,
  extras?: MonitorReaderExtras,
): Promise<MonitorBlockedResponse | MonitorBlockedP1Response> {
  return apiRequest<MonitorBlockedResponse | MonitorBlockedP1Response>(
    withQuery(monitorPath("/monitor/blocked"), { priority }),
    { baseUrl: monitorBaseUrl(), getIdToken, onResponse: extras?.onResponse },
  );
}

export function getMonitorBlockedP0(
  getIdToken: () => Promise<string>,
  limit = 20,
  offset = 0,
  extras?: MonitorReaderExtras,
): Promise<MonitorBlockedP0> {
  return apiRequest<MonitorBlockedP0>(
    withQuery(monitorPath("/monitor/blocked"), { priority: "p0", limit: String(limit), offset: String(offset) }),
    { baseUrl: monitorBaseUrl(), getIdToken, onResponse: extras?.onResponse },
  );
}

export function getMonitorBlockedP1(
  getIdToken: () => Promise<string>,
  extras?: MonitorReaderExtras,
): Promise<MonitorBlockedP1> {
  return getMonitorBlocked("p1", getIdToken, extras);
}

export function getMonitorPendingActions(
  getIdToken: () => Promise<string>,
  extras?: MonitorReaderExtras,
): Promise<MonitorPendingActionsResponse> {
  return apiRequest<MonitorPendingActionsResponse>(monitorPath("/monitor/pending-actions"), {
    baseUrl: monitorBaseUrl(),
    getIdToken,
    onResponse: extras?.onResponse,
  });
}

// SC-13 §구역·행동·호출: KPI·상태·처리량 구역은 "기간·수량 필터, 새로고침"을 제공한다.
// 기간은 처리량의 주(week) 창을, 수량은 목록 구역(blocked)의 페이지 크기를 정한다. KPI·상태·
// risks·pending 엔드포인트는 파라미터를 받지 않으므로 새로고침만 적용된다 — 화면이 필터를
// 지원하지 않는 구역에 없는 쿼리를 지어내지 않는다.
export type MonitorPeriod = MonitorThroughputWeek;

export const MONITOR_LIMIT_CHOICES = [10, 20, 50] as const;
export type MonitorLimit = (typeof MONITOR_LIMIT_CHOICES)[number];

export type MonitorSnapshotOptions = {
  period?: MonitorPeriod;
  limit?: MonitorLimit;
};

export const DEFAULT_MONITOR_SNAPSHOT_OPTIONS: Required<MonitorSnapshotOptions> = {
  period: "current",
  limit: 20,
};

// #711: returns (getIdToken, extras?) -- not just (getIdToken) -- so
// getMonitorSnapshot can pass an onResponse hook through to whichever
// reader an area resolves to, same as every other reader in this file.
function monitorReaderFor(
  area: MonitorSnapshotArea,
  options: Required<MonitorSnapshotOptions>,
): (getIdToken: () => Promise<string>, extras?: MonitorReaderExtras) => Promise<unknown> {
  switch (area) {
    case "kpi":
      return getMonitorKPI;
    case "status":
      return getMonitorStatus;
    case "risks":
      return getMonitorRisks;
    case "pending":
      return getMonitorPendingActions;
    case "blockedP0":
      return (getIdToken, extras) => getMonitorBlockedP0(getIdToken, options.limit, 0, extras);
    case "blockedP1":
      return getMonitorBlockedP1;
    case "throughput":
      return (getIdToken, extras) => getMonitorThroughput(getIdToken, options.period, extras);
  }
}

type MonitorAreaEnvelope = {
  data: unknown;
  data_as_of?: unknown;
  timezone?: unknown;
  request_id?: unknown;
};

function readMonitorAreaEnvelope(value: unknown): MonitorAreaEnvelope {
  if (value && typeof value === "object" && "data" in value) {
    const envelope = value as Record<string, unknown>;
    const data = envelope.data;
    if (data && typeof data === "object") {
      const payload = data as Record<string, unknown>;
      return {
        data,
        data_as_of: envelope.data_as_of ?? payload.data_as_of,
        timezone: envelope.timezone ?? payload.timezone,
        request_id: envelope.request_id ?? payload.request_id,
      };
    }
  }

  if (value && typeof value === "object") {
    const payload = value as Record<string, unknown>;
    return {
      data: value,
      data_as_of: payload.data_as_of,
      timezone: payload.timezone,
      request_id: payload.request_id,
    };
  }

  return { data: value };
}

function monitorErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Monitor area read failed";
}

function isIanaTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function parseUtcRfc3339(value: string): number | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?Z$/.exec(value);
  if (!match) return undefined;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth[month - 1] ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return undefined;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

// #711: a Date response header, when present, is the server's own clock --
// comparing data_as_of against it measures genuine payload staleness and is
// immune to client clock skew. parseHttpDateHeader() reads it; monitor.ts's
// callers fall back to the local clock when it is missing or unparseable
// (same behaviour as before this fix, just no longer the only source).
function parseHttpDateHeader(response: Response): number | undefined {
  const header = response.headers.get("date");
  if (!header) return undefined;
  const parsed = Date.parse(header);
  return Number.isFinite(parsed) ? parsed : undefined;
}

// #711: this used to reject the whole area ("data_as_of is too far in the
// future") whenever `Date.now()` -- the CLIENT's clock -- disagreed with the
// backend's data_as_of by more than 5 minutes. Those two clocks have no
// relationship: browser clocks drift, get set manually, or are stale after a
// VM resumes. A plain client clock skew made every monitor area report
// "unavailable" simultaneously, indistinguishable from a real backend
// outage (see #711 for the CI reproduction: vi.useFakeTimers() stepping the
// clock back 6 minutes between minting data_as_of and validating it
// reproduces the identical failure). Fixed by (a) preferring serverNowMs --
// the same response's own Date header -- over the client clock when
// available, and (b) never failing closed on this specific check: a skew is
// now a `clockSkew` flag on the returned meta, not a dropped area.
function validateMonitorAreaMeta(
  envelope: MonitorAreaEnvelope,
  serverNowMs?: number,
): { meta?: MonitorAreaMeta; error?: string } {
  if (typeof envelope.data_as_of !== "string" || envelope.data_as_of.trim() === "") {
    return { error: "Missing data_as_of" };
  }

  const dataAsOf = envelope.data_as_of.trim();
  const timestamp = parseUtcRfc3339(dataAsOf);
  if (timestamp === undefined) return { error: "Invalid data_as_of" };

  if (typeof envelope.timezone !== "string" || envelope.timezone.trim() === "") {
    return { error: "Missing timezone" };
  }
  const timezone = envelope.timezone.trim();
  if (!isIanaTimezone(timezone)) return { error: "Invalid timezone" };

  if (typeof envelope.request_id !== "string" || envelope.request_id.trim() === "") {
    return { error: "Missing request_id" };
  }
  const requestId = envelope.request_id.trim();

  const now = serverNowMs ?? Date.now();
  const ageMs = now - timestamp;

  return {
    meta: {
      data_as_of: dataAsOf,
      timezone,
      request_id: requestId,
      stale: ageMs > 15 * 60 * 1000,
      clockSkew: ageMs < -5 * 60 * 1000,
    },
  };
}

export async function getMonitorSnapshot(
  getIdToken: () => Promise<string>,
  requestedAreas: readonly MonitorSnapshotArea[] = MONITOR_SNAPSHOT_AREAS,
  onAreaSettled?: (update: MonitorAreaUpdate) => void,
  options: MonitorSnapshotOptions = {},
): Promise<MonitorSnapshot> {
  const resolvedOptions: Required<MonitorSnapshotOptions> = {
    ...DEFAULT_MONITOR_SNAPSHOT_OPTIONS,
    ...options,
  };
  const areas = [...new Set(requestedAreas)].filter((area): area is MonitorSnapshotArea =>
    MONITOR_SNAPSHOT_AREAS.includes(area),
  );
  const areaPromises = areas.map(async (area): Promise<MonitorAreaUpdate> => {
    try {
      let serverNowMs: number | undefined;
      const envelope = readMonitorAreaEnvelope(
        await monitorReaderFor(area, resolvedOptions)(getIdToken, {
          onResponse: (response) => {
            serverNowMs = parseHttpDateHeader(response);
          },
        }),
      );
      const validation = validateMonitorAreaMeta(envelope, serverNowMs);
      if (!validation.meta) {
        const update = { area, error: validation.error ?? "Invalid monitor area metadata" };
        onAreaSettled?.(update);
        return update;
      }
      const update = { area, data: envelope.data, meta: validation.meta };
      onAreaSettled?.(update);
      return update;
    } catch (error) {
      const update = {
        area,
        error: monitorErrorMessage(error),
        forbidden: error instanceof ApiError && error.status === 403,
      };
      onAreaSettled?.(update);
      return update;
    }
  });
  // Start every area read before awaiting results so one slow area cannot block
  // callbacks for faster areas. Each promise handles its own failure above.
  const settled: MonitorAreaUpdate[] = [];
  for (const areaPromise of areaPromises) settled.push(await areaPromise);
  const snapshot: MonitorSnapshot = {};
  const partialErrors: Partial<Record<MonitorSnapshotArea, string>> = {};
  const areaMeta: Partial<Record<MonitorSnapshotArea, MonitorAreaMeta>> = {};
  let successfulAreas = 0;
  let forbiddenCount = 0;

  settled.forEach((result) => {
    const area = result.area;
    if (result.error) {
      if (result.forbidden) forbiddenCount += 1;
      partialErrors[area] = result.error;
      return;
    }
    snapshot[area] = result.data as never;
    areaMeta[area] = result.meta!;
    successfulAreas += 1;
  });

  if (successfulAreas === 0 && areas.length > 0 && forbiddenCount === areas.length) {
    throw new ApiError({
      status: 403,
      code: "HTTP_403",
      message: "Owner permission is required.",
    });
  }
  if (Object.keys(partialErrors).length > 0) snapshot.partial_errors = partialErrors;
  if (Object.keys(areaMeta).length > 0) snapshot.area_meta = areaMeta;
  return snapshot;
}

export function getTeamBottlenecks(getIdToken: () => Promise<string>): Promise<TeamBottlenecksResponse> {
  return apiRequest<TeamBottlenecksResponse>(monitorPath("/erp/team/bottlenecks"), {
    baseUrl: monitorBaseUrl(),
    getIdToken,
  });
}

export function getTeamReassignQueue(getIdToken: () => Promise<string>): Promise<TeamReassignQueueResponse> {
  return apiRequest<TeamReassignQueueResponse>(monitorPath("/erp/team/reassign-queue"), {
    baseUrl: monitorBaseUrl(),
    getIdToken,
  });
}

export function getTeamCompletionRate(getIdToken: () => Promise<string>): Promise<TeamCompletionRateResponse> {
  return apiRequest<TeamCompletionRateResponse>(monitorPath("/erp/team/completion-rate"), {
    baseUrl: monitorBaseUrl(),
    getIdToken,
  });
}

export function getHomeTodayCompleted(getIdToken: () => Promise<string>): Promise<HomeTodayCompletedResponse> {
  return apiRequest<HomeTodayCompletedResponse>(monitorPath("/erp/home/today-completed"), {
    baseUrl: monitorBaseUrl(),
    getIdToken,
  });
}

export function getMonitorRiskSeverity(getIdToken: () => Promise<string>): Promise<MonitorRiskSeverityResponse> {
  return apiRequest<MonitorRiskSeverityResponse>(monitorPath("/monitor/risk-severity"), {
    baseUrl: monitorBaseUrl(),
    getIdToken,
  });
}

export function getMonitorReviewPending(getIdToken: () => Promise<string>): Promise<MonitorReviewPendingResponse> {
  return apiRequest<MonitorReviewPendingResponse>(monitorPath("/monitor/review-pending"), {
    baseUrl: monitorBaseUrl(),
    getIdToken,
  });
}

// erp-v2-adapt: end

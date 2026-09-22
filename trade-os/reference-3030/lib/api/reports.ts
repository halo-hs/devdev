import { apiRequest, platformApiBaseUrl, platformApiPath } from "./client";

// OS-B3 결산 리포트 client — B1 기간 집계(settlement-series / counterparty-top),
// B2 월마감 스냅샷(month-close*), B2b GP 집계(gp-series / counterparty-gp)를 읽는다.
// 전부 erp.insights.full 게이트(BE fail-closed) — BE #495 의 status/code 쌍은
// ApiError 로 보존되며 화면은 plan/subscription/billing/role 원인별로 안내한다.
// 금액은 전부 decimal 문자열, 비율은 "0.0000".."1.0000" 문자열(부동소수 드리프트 방지).

export type SeriesGranularity = "month" | "week";

export type FXConversionEvidence = {
  rate: string;
  currency_pair: string;
  basis: string;
  as_of: string;
};

export type FXConversion = {
  state: string;
  evidence: FXConversionEvidence | null;
};

export type SeriesCurrency = {
  currency: string;
  receivable_due: string;
  payable_due: string;
  received: string;
  paid_out: string;
  receivable_outstanding_end: string;
  payable_outstanding_end: string;
  overdue_receivable_end: string;
  overdue_rate_end: string;
  /** FS-17: distinguish a calculated zero ratio from a ratio that cannot be calculated. */
  overdue_rate_status?: string | null;
  overdue_rate_reason?: string | null;
  fx_conversion?: FXConversion | null;
};

export type SeriesPeriod = {
  period_start: string;
  period_end: string;
  by_currency: SeriesCurrency[];
};

export type SettlementSeriesResponse = {
  granularity: SeriesGranularity | string;
  from: string;
  to: string;
  timezone: string;
  /** OS-C1 사람 축 — 실효 담당자 스코프 에코(uuid). 없으면 org 전체. */
  assignee?: string | null;
  periods: SeriesPeriod[];
  /** FS-17 §3 기준시각 — 서버가 이 집계를 만든 시각(date-time). */
  data_as_of: string;
};

export type GPExcluded = {
  mixed_currency: number;
  incomplete: number;
  /** Additive since Backend #1707. Missing means exclusion evidence is incomplete. */
  direction_pending?: number;
  /**
   * 취소·보관된 Deal(OD-009). BE 는 이 분류를 모든 데이터 품질 제외보다 먼저
   * 적용하고 현재 계획 금액에 전혀 기여시키지 않는다(backend
   * `internal/repository/erp/reports_gp.go` 머리말, `classification =
   * 'commercially_inactive'`). `direction_pending` 과 같은 additive 계약이라
   * 키가 없으면 제외 근거가 불완전한 것으로 본다.
   */
  commercially_inactive?: number;
};

export type GPCurrency = {
  currency: string;
  revenue: string;
  gp: string;
  margin: string;
  deal_count?: number;
  zero_cost_deal_count?: number;
  fx_conversion?: FXConversion | null;
};

export type GPPeriodExcluded = {
  mixed_currency: number;
  incomplete: number;
  /** Additive since Backend #1707. Missing means exclusion evidence is incomplete. */
  direction_pending?: number;
  /** 취소·보관 Deal 제외(OD-009) — `GPExcluded.commercially_inactive` 와 같은 계약. */
  commercially_inactive?: number;
};

export type GPPeriod = {
  period_start: string;
  period_end: string;
  by_currency: GPCurrency[];
  excluded?: GPPeriodExcluded;
};

export type GPSeriesResponse = {
  from: string;
  to: string;
  timezone: string;
  /** OS-C1 사람 축 — 실효 담당자 스코프 에코(uuid). 없으면 org 전체. */
  assignee?: string | null;
  periods: GPPeriod[];
  excluded?: GPExcluded;
  /** FS-17 §3 기준시각 — 서버가 이 집계를 만든 시각(date-time). */
  data_as_of: string;
};

export type CounterpartyTopMetric = "receivable" | "overdue";

export type CounterpartyTopItem = {
  counterparty: string;
  currency: string;
  amount: string;
  deal_count: number;
  fx_conversion?: FXConversion | null;
};

export type CounterpartyTopResponse = {
  from: string;
  to: string;
  metric: CounterpartyTopMetric | string;
  items: CounterpartyTopItem[];
  /** OS-C1 사람 축 (BE#1183/BE PR #1185) — 실효 담당자 스코프 에코(uuid). 없으면 org 전체. */
  assignee?: string | null;
};

export type CounterpartyGPItem = {
  counterparty: string;
  currency: string;
  revenue: string;
  gp: string;
  margin: string;
  deal_count: number;
  fx_conversion?: FXConversion | null;
};

export type CounterpartyGPResponse = {
  from: string;
  to: string;
  items: CounterpartyGPItem[];
  excluded: GPExcluded;
  /** OS-C1 사람 축 (BE#1183/BE PR #1185) — 실효 담당자 스코프 에코(uuid). 없으면 org 전체. */
  assignee?: string | null;
};

// OS-C1 사람 축 — D10 거래처별 상태(콕핏 테이블). 행은 (거래처, 통화) 단위,
// 금액은 통화별 decimal 문자열(교차 통화 합산 금지). 비금액 신호(선적 임박·
// 서류 30일·마지막 활동·진행 딜)는 거래처 레벨이라 같은 거래처의 통화 행마다
// 반복된다 — 합산 시 거래처 기준 dedupe 필요(salesPerfData.activeDealsSummary).
export type CounterpartyStatusItem = {
  counterparty: string;
  currency: string;
  /** 거래액 — 창 안 만기 도래 수취 스케줄 총액(상태 무관 계획 물량). */
  total_due: string;
  /** 미수 잔액 — as_of 기준 열린 수취 잔액. */
  outstanding: string;
  /** 연체 — 미수 중 만기 경과분. */
  overdue: string;
  /** 다음 결제일 — 열린 미래 스케줄이 없으면 부재. */
  next_due_date?: string | null;
  next_due_amount: string;
  /** ETA(없으면 ETD) 14일 이내 선적 수. */
  upcoming_shipments: number;
  /** 최근 30일 생성 서류 수. */
  recent_docs: number;
  /** 서류·입출금·스케줄 생성 중 가장 최근 org 로컬 날짜 — 없으면 부재. */
  last_activity?: string | null;
  /** 파이프라인(계약/선적/통관) 진행 딜 수 — 거래처 레벨(통화 행마다 반복). */
  active_deals: number;
};

// 기본 정렬 = 주의 필요 순(연체 DESC → 다음 결제일 ASC → 거래액 DESC) — 서버
// 순서가 곧 표시 순서다(클라이언트 재정렬 금지).
export type CounterpartyStatusResponse = {
  from: string;
  to: string;
  /** 시점 컬럼(미수·연체·다음 결제)의 판정 기준 org 영업일. */
  as_of: string;
  timezone: string;
  /** 실효 담당자 스코프 에코(uuid) — 없으면 org 전체(member 는 항상 본인 고정). */
  assignee?: string | null;
  items: CounterpartyStatusItem[];
};

// OS-C1 사람 축 — D12 담당자별 GP. assignee_user_id null = 미배정 딜 버킷
// (버킷 포함이라 담당자 행 합 = org GP). 이름 해석은 FE(members 목록) 책임.
export type AssigneeGPItem = {
  assignee_user_id: string | null;
  currency: string;
  revenue: string;
  /** 손실이면 음수 — 음수 행도 유지된다. */
  gp: string;
  margin: string;
  deal_count: number;
};

export type AssigneeGPResponse = {
  from: string;
  to: string;
  /** 실효 담당자 스코프 에코(uuid) — 없으면 org 전체 그룹핑. */
  assignee?: string | null;
  items: AssigneeGPItem[];
  /** 제외 건수는 사람 스코프 기준 — 카피가 범위를 명시해야 한다. */
  excluded: GPExcluded;
};

/**
 * Frozen month-close FX evidence (BE#1138, snapshot version 5 — OD-010's
 * fifth evidence item, "적용자"/applied_by, plus applied_at). This is a
 * SEPARATE shape from the live `FXConversionEvidence` above by design: a
 * live settlement-series/gp-series/counterparty-top read resolves approved
 * evidence fresh on every call and never records an application receipt, so
 * it has no attributable actor (backend `internal/handler/erp/reports.go:
 * 151-166` explains why — do not add applied_by/applied_at to the shared
 * live `FXConversionEvidence` type above, it would be wrong for every
 * non-month-close call site). Only a frozen month-close attributes a
 * conversion to one closer and instant (backend
 * `internal/service/erp/month_close.go:150-179`, `monthCloseFXEvidence`).
 *
 * applied_by/applied_at are optional here, not required: snapshots frozen
 * before BE#1138 landed (versions 1-4) are immutable and returned
 * byte-for-byte verbatim forever — their evidence, when present, predates
 * these two fields and genuinely does not carry them. Render their absence
 * as "not recorded", never fabricate a value.
 */
export type MonthCloseFXEvidence = FXConversionEvidence & {
  applied_by?: string;
  applied_at?: string;
};

export type MonthCloseFXConversion = {
  state: string;
  evidence: MonthCloseFXEvidence | null;
};

// Frozen month-close row shapes mirror the live B1 wire shapes but swap in
// the frozen (applied_by-carrying) FX conversion type above.
export type MonthCloseSnapshotCurrency = Omit<SeriesCurrency, "fx_conversion"> & {
  fx_conversion?: MonthCloseFXConversion | null;
};

export type MonthCloseSnapshotTopItem = Omit<CounterpartyTopItem, "fx_conversion"> & {
  fx_conversion?: MonthCloseFXConversion | null;
};

/**
 * 마감 시점에 얼린 일정 하나의 대사 상태(FS-05-01 §6 "일정 자체 대사·부분 대손
 * 근거" — 원래 예정 금액·조정 누계·부분 대손 누계·현재 대상 금액·적용액·미결제).
 * BE `monthCloseSnapshotSchedule` 의 필드명을 그대로 미러한다.
 *
 * adjustment_net/written_off_total/current_target 은 **옵셔널**이다. 이 세
 * 필드는 V7 이 추가한 schedule-level target reconciliation 이고, V4 가 추가한
 * 것은 per-schedule outstanding/paid 뿐이다(BE
 * `internal/service/erp/month_close.go:118-127` — "V7 adds schedule-level
 * target reconciliation ... V4 added per-schedule outstanding/paid ... V1-V6
 * rows remain immutable and continue to be passed through verbatim"). 즉
 * V4~V6 마감의 `schedules.items[]` 에는 schedule_id/type/currency/due_date/
 * amount/paid/outstanding 만 있고 이 세 필드는 키 자체가 없다. 없는 값은 0 이
 * 아니라 "기록되지 않음"이므로 렌더는 `—` 로 말하고 0 을 지어내지 않는다 —
 * 0 은 "조정이 한 건도 없었다"는 다른 사실이다.
 */
export type MonthCloseSnapshotSchedule = {
  schedule_id: string;
  type: string;
  currency: string;
  due_date: string;
  /** 원래 예정 금액. */
  amount: string;
  /** 조정 누계(signed). V7+ 스냅샷에만 존재한다. */
  adjustment_net?: string;
  /** 부분 대손 누계. V7+ 스냅샷에만 존재한다. */
  written_off_total?: string;
  /** 현재 대상 금액 = max(amount + adjustment_net − written_off_total, 0). V7+ 스냅샷에만 존재한다. */
  current_target?: string;
  /** 일정에 적용된 금액(raw 입출금이 아님 — FS-05-01 §7 호환 필드 주의). */
  paid: string;
  outstanding: string;
};

/** BE `monthCloseSnapshotAdjustment` — settlement_adjustments 행의 동결 사본. */
export type MonthCloseSnapshotAdjustment = {
  id: string;
  schedule_id: string;
  kind: string;
  amount: string;
  currency: string;
  reason: string;
  evidence?: string | null;
  document_no?: string | null;
  created_by?: string | null;
  created_at: string;
};

/** BE `monthCloseSnapshotWriteoff` — 부분 대손 사건의 동결 사본(FS-05-01 §6). */
export type MonthCloseSnapshotWriteoff = {
  id: string;
  schedule_id: string;
  scheduled_amount: string;
  written_off_amount: string;
  currency: string;
  reason?: string | null;
  note?: string | null;
  evidence_document_id?: string | null;
  external_evidence?: string | null;
  settlement_dispute_id?: string | null;
  actor_user_id?: string | null;
  occurred_at: string;
};

// B2 월마감 스냅샷 — 필드명은 B1 와이어 계약을 그대로 미러(BE
// monthCloseSnapshotV7, backend `internal/service/erp/month_close.go`).
// 동결 아티팩트라 읽기 시 재계산 없음. 타입명은 유지하지만(호출부 다수) V1~V7
// 필드를 전부 옵셔널로 수용한다 — 오래된 스냅샷은 새 필드 없이 그대로 반환된다.
export type MonthCloseSnapshotV1 = {
  version: number;
  /**
   * BE#1160/#1165(snapshot version 6) — 마감 시점에 얼린 조직의 기능
   * 통화(FS-05-01 §6 4행 "기능 통화·환율 정책·환율 근거"). `params` 밖의
   * 최상위 필드다: backend가 의도적으로 그렇게 뒀다 — "생성 입력이 아니라
   * 동결된 재무 사실"이라서(`month_close.go`의 `monthCloseSnapshotParams`
   * 주석). 마감 트랜잭션 안에서 단 한 번 기록되고, 이후 org 프로필이
   * 바뀌어도 재조회 시 이 값 그대로다 — backend의 적대적 테스트가
   * 증명한다(`functional_currency='KRW'`로 마감 → org 행을 `'USD'`로
   * 변경 → 재조회해도 스냅샷은 여전히 `'KRW'`,
   * `month_close_integration_test.go:225-244`).
   *
   * 세 가지 상태를 구분해야 한다:
   * - `string`: 마감 당시 얼려진 기능 통화 코드.
   * - `null`: V6 이후 마감이지만 org 가 기능 통화를 설정하지 않았던
   *   경우(`org_profiles.functional_currency` 미설정) — BE 의 json 태그에
   *   `omitempty` 가 없어 이 경우도 키 자체는 실려 오고 값만 null이다.
   * - `undefined`(키 없음): BE#1160 이전(V1~V5)에 얼려진 스냅샷 — 이
   *   필드 자체가 아직 없던 시절이라 키가 없다.
   * 세 상태 전부 "기록되지 않음"으로 렌더링한다 — 라이브 org 프로필에서
   * 대신 읽거나 기본값을 지어내면 동결이 깨진다.
   */
  functional_currency?: string | null;
  params?: {
    granularity?: string;
    from?: string;
    to?: string;
    timezone?: string;
    counterparty_metric?: string;
    counterparty_limit?: number;
  };
  series?: {
    period_start?: string;
    period_end?: string;
    by_currency?: MonthCloseSnapshotCurrency[];
  };
  counterparty_top?: {
    from?: string;
    to?: string;
    metric?: string;
    items?: MonthCloseSnapshotTopItem[];
  };
  /**
   * BE#1107 이후(snapshot version 4+) 함께 얼린 일정 단위 대사. V1~V3 스냅샷은
   * 이 키 자체가 없으므로 "기록되지 않음"으로 다루고 라이브 조회로 대체하지
   * 않는다 — 동결 계약(byte-for-byte verbatim)이 깨진다.
   */
  schedules?: {
    /** series.period_end 와 같은 기준시각. */
    as_of?: string;
    items?: MonthCloseSnapshotSchedule[];
  };
  /** snapshot version 3+ — 마감월 일정에 붙은 실제 조정 사건. */
  adjustments?: {
    has_adjustments?: boolean;
    events?: MonthCloseSnapshotAdjustment[];
  };
  /** snapshot version 7+ — 불변 부분 대손 근거(FS-05-01 §6). */
  writeoffs?: {
    has_writeoffs?: boolean;
    events?: MonthCloseSnapshotWriteoff[];
  };
};

export type MonthClose = {
  id: string;
  period_start: string;
  period_end: string;
  timezone: string;
  closed_by: string;
  closed_at: string;
  note?: string | null;
  snapshot?: MonthCloseSnapshotV1 | null;
  // OD-011 재개방(BE #651): 재개방된 순간부터 재마감 전까지 true — 화면은 타임스탬프로
  // 상태를 추론하지 말고 이 플래그로 `재개방됨`을 표시한다.
  reopened?: boolean;
  reopened_at?: string | null;
  reopened_by?: string | null;
  reopen_reason?: string | null;
};

export type MonthCloseListResponse = {
  items: MonthClose[];
};

export type MonthCloseReopenRequest = {
  /** 필수 사유 — OD-011 이 재개방을 감사 대상 행위로 못 박는다(≤500자). */
  reason: string;
};

export type MonthCloseRequest = {
  /** 마감 대상 달, "YYYY-MM" — 완전히 지난 달만 허용(진행 중 달은 400). */
  period: string;
  /** 선택 메모 (≤500자). */
  note?: string;
};

type GetIdToken = () => Promise<string>;

export async function getSettlementSeries(
  params: { granularity: SeriesGranularity; from?: string; to?: string; assignee?: string },
  getIdToken: GetIdToken,
): Promise<SettlementSeriesResponse> {
  const qs = new URLSearchParams();
  qs.set("granularity", params.granularity);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.assignee) qs.set("assignee", params.assignee);
  return apiRequest<SettlementSeriesResponse>(
    platformApiPath(`/erp/reports/settlement-series?${qs.toString()}`),
    { baseUrl: platformApiBaseUrl(), getIdToken },
  );
}

export async function getGpSeries(
  params: { from?: string; to?: string; assignee?: string },
  getIdToken: GetIdToken,
): Promise<GPSeriesResponse> {
  const qs = new URLSearchParams();
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.assignee) qs.set("assignee", params.assignee);
  const query = qs.toString();
  return apiRequest<GPSeriesResponse>(
    platformApiPath(`/erp/reports/gp-series${query ? `?${query}` : ""}`),
    { baseUrl: platformApiBaseUrl(), getIdToken },
  );
}

export async function getCounterpartyTop(
  params: {
    metric: CounterpartyTopMetric;
    from?: string;
    to?: string;
    limit?: number;
    assignee?: string;
  },
  getIdToken: GetIdToken,
): Promise<CounterpartyTopResponse> {
  const qs = new URLSearchParams();
  qs.set("metric", params.metric);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.assignee) qs.set("assignee", params.assignee);
  return apiRequest<CounterpartyTopResponse>(
    platformApiPath(`/erp/reports/counterparty-top?${qs.toString()}`),
    { baseUrl: platformApiBaseUrl(), getIdToken },
  );
}

export async function getCounterpartyGp(
  params: { from?: string; to?: string; limit?: number; assignee?: string },
  getIdToken: GetIdToken,
): Promise<CounterpartyGPResponse> {
  const qs = new URLSearchParams();
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.assignee) qs.set("assignee", params.assignee);
  const query = qs.toString();
  return apiRequest<CounterpartyGPResponse>(
    platformApiPath(`/erp/reports/counterparty-gp${query ? `?${query}` : ""}`),
    { baseUrl: platformApiBaseUrl(), getIdToken },
  );
}

export async function getCounterpartyStatus(
  params: { from?: string; to?: string; assignee?: string; limit?: number; offset?: number },
  getIdToken: GetIdToken,
): Promise<CounterpartyStatusResponse> {
  const qs = new URLSearchParams();
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.assignee) qs.set("assignee", params.assignee);
  // limit 은 페이지네이션형 클램프(기본 50, 최대 200) — 초과분은 BE 가 상한으로.
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.offset != null) qs.set("offset", String(params.offset));
  const query = qs.toString();
  return apiRequest<CounterpartyStatusResponse>(
    platformApiPath(`/erp/reports/counterparty-status${query ? `?${query}` : ""}`),
    { baseUrl: platformApiBaseUrl(), getIdToken },
  );
}

export async function getGpByAssignee(
  params: { from?: string; to?: string; assignee?: string; limit?: number },
  getIdToken: GetIdToken,
): Promise<AssigneeGPResponse> {
  const qs = new URLSearchParams();
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.assignee) qs.set("assignee", params.assignee);
  // limit 은 통화별 Top-N 랭킹형(1-50, 기본 10) — 범위 밖은 400 거부.
  if (params.limit != null) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return apiRequest<AssigneeGPResponse>(
    platformApiPath(`/erp/reports/gp-by-assignee${query ? `?${query}` : ""}`),
    { baseUrl: platformApiBaseUrl(), getIdToken },
  );
}

export async function listMonthCloses(
  params: { from?: string; to?: string; limit?: number; offset?: number },
  getIdToken: GetIdToken,
): Promise<MonthCloseListResponse> {
  const qs = new URLSearchParams();
  // from/to 는 YYYY-MM 월 필터(월 내 임의 날짜도 그 달로 정규화됨).
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.offset != null) qs.set("offset", String(params.offset));
  const query = qs.toString();
  return apiRequest<MonthCloseListResponse>(
    platformApiPath(`/erp/reports/month-closes${query ? `?${query}` : ""}`),
    { baseUrl: platformApiBaseUrl(), getIdToken },
  );
}

export async function getMonthClose(id: string, getIdToken: GetIdToken): Promise<MonthClose> {
  return apiRequest<MonthClose>(
    platformApiPath(`/erp/reports/month-closes/${encodeURIComponent(id)}`),
    { baseUrl: platformApiBaseUrl(), getIdToken },
  );
}

// owner/admin 전용(403 ERP_REPORTS_ROLE_FORBIDDEN) · 진행 중 달 400 ·
// 중복 409 ERP_REPORTS_ALREADY_CLOSED — 에러 카피 매핑은 화면 책임.
export async function closeMonth(body: MonthCloseRequest, getIdToken: GetIdToken): Promise<MonthClose> {
  return apiRequest<MonthClose>(platformApiPath("/erp/reports/month-close"), {
    baseUrl: platformApiBaseUrl(),
    getIdToken,
    init: { body: JSON.stringify(body), method: "POST" },
  });
}

// owner/admin 전용(403 ERP_REPORTS_ROLE_FORBIDDEN) · 사유 누락 400 · 이미 재개방된 달은
// 409 ERP_REPORTS_ALREADY_CLOSED(첫 재개방의 사유·행위자를 덮어쓰지 않는다).
export async function reopenMonthClose(
  id: string,
  body: MonthCloseReopenRequest,
  getIdToken: GetIdToken,
): Promise<MonthClose> {
  return apiRequest<MonthClose>(
    platformApiPath(`/erp/reports/month-closes/${encodeURIComponent(id)}/reopen`),
    {
      baseUrl: platformApiBaseUrl(),
      getIdToken,
      init: { body: JSON.stringify(body), method: "POST" },
    },
  );
}

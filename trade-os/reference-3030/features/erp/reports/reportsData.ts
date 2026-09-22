// OS-B3 결산 리포트 — 순수 데이터 변형(뷰 매핑·KPI 델타·통화 유도·Top 조인).
// 화면 컴포넌트와 분리해 단위 테스트 가능하게 유지한다. 교차 통화 합산 금지
// 불변식: 모든 함수는 단일 통화 축 안에서만 계산한다.

import type {
  CounterpartyGPResponse,
  CounterpartyStatusResponse,
  CounterpartyTopResponse,
  FXConversionEvidence,
  GPExcluded,
  GPSeriesResponse,
  SeriesCurrency,
  SettlementSeriesResponse,
} from "@trade-os/reference-3030/lib/api/reports";
import {
  amountCell,
  approxDecimal,
  financeDecimalMagnitude,
  ratioPermyriad,
  roundedPercentage,
  type AmountCell,
} from "@trade-os/reference-3030/lib/financeDecimal";

export type ReportRangeMonths = 6 | 12 | 24;
const REPORT_RANGES: ReportRangeMonths[] = [6, 12, 24];

/**
 * 마감 제안 lookback = 마감 목록 fetch limit. BE 가 period_start DESC 로
 * 정렬하므로 "k개월 전 마감"은 최대 k번째 행 — limit ≥ lookback 이면
 * closedPeriods 가 lookback 창을 항상 완전히 덮는다(이미 마감된 달 재제안 방지).
 */
export const MONTH_CLOSE_LOOKBACK_MONTHS = 24;

/** 주 축은 BE 상한(104 ISO 주) 안쪽인 6/12개월만 — 24개월은 월 축 전용. */
export function rangesForGranularity(granularity: "month" | "week"): ReportRangeMonths[] {
  return granularity === "month" ? REPORT_RANGES : REPORT_RANGES.filter((m) => m <= 12);
}

/** Approximate conversion reserved for chart coordinates and presentation-only ratios. */
export const num = approxDecimal;

/** 조회 윈도우: (오늘 - N개월 + 1)의 1일 ~ 오늘. BE 가 실효 경계로 스냅해 에코한다. */
export function computeRange(todayISO: string, months: ReportRangeMonths): { from: string; to: string } {
  const [y, m] = todayISO.split("-").map(Number);
  const start = new Date(Date.UTC(y, (m ?? 1) - 1 - (months - 1), 1));
  const from = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}-01`;
  return { from, to: todayISO };
}

/**
 * 통화 탭 목록 유도 — 하드코딩 금지: settlement-series + gp-series 응답의
 * by_currency 합집합. 정렬은 수취 예정 총액 내림차순(주 통화 우선), 동률은 알파벳.
 */
export function deriveCurrencies(
  series: SettlementSeriesResponse | null,
  gp: GPSeriesResponse | null,
): string[] {
  const totals = new Map<string, bigint>();
  for (const period of series?.periods ?? []) {
    for (const row of period.by_currency ?? []) {
      totals.set(
        row.currency,
        (totals.get(row.currency) ?? BigInt(0)) + financeDecimalMagnitude(row.receivable_due),
      );
    }
  }
  for (const period of gp?.periods ?? []) {
    for (const row of period.by_currency ?? []) {
      if (!totals.has(row.currency)) totals.set(row.currency, BigInt(0));
    }
  }
  return [...totals.entries()]
    .sort((a, b) => {
      if (a[1] === b[1]) return a[0].localeCompare(b[0]);
      return a[1] > b[1] ? -1 : 1;
    })
    .map(([currency]) => currency);
}

export type SeriesPointView = {
  periodStart: string;
  periodEnd: string;
  fxConversionState: string | null;
  /** OD-010 다섯 항목 중 환율·통화쌍·근거·기준시각 — evidence 유무가 표시 여부를 결정한다(state 문자열이 아니라). */
  fxConversionEvidence: FXConversionEvidence | null;
  planned: AmountCell;
  /** FS-05-01 §4 기간 지급할 돈 예정액(`payable_due`) — `planned`(받을 돈)의 지급 측 대응값. */
  payableDue: AmountCell;
  received: AmountCell;
  /** AP 일정에 적용된 금액(`paid_out`) — `received`(AR 적용액)의 지급 측 대응값. */
  paidOut: AmountCell;
  receivableEnd: AmountCell;
  payableEnd: AmountCell;
  /** FS-05-01 §4 기말 연체 받을 돈(`overdue_receivable_end`) — `overduePermyriad`(연체율)의 분자 금액. */
  overdueReceivableEnd: AmountCell;
  /** Exact ten-thousandths of the BE 0..1 ratio. */
  overduePermyriad: bigint | null;
};

/**
 * Preserve the distinction between a calculated zero ratio and an unavailable
 * ratio. Older responses omitted the status, so a positive, valid denominator
 * remains the safe compatibility signal for those payloads.
 */
export function overdueRatePermyriad(
  row: Pick<SeriesCurrency, "receivable_outstanding_end" | "overdue_rate_end" | "overdue_rate_status">
    | null
    | undefined,
): bigint | null {
  if (!row) return null;
  const denominator = amountCell(row.receivable_outstanding_end);
  if (!denominator.valid || denominator.scaled <= BigInt(0)) return null;
  if (row.overdue_rate_status != null && row.overdue_rate_status !== "calculated") return null;
  const ratio = ratioPermyriad(row.overdue_rate_end);
  return ratio != null && ratio >= BigInt(0) && ratio <= BigInt(10000) ? ratio : null;
}

/** 선택 통화의 기간 시계열 — 해당 통화 행이 없는 기간은 0 으로 채워 축을 유지한다. */
export function seriesForCurrency(
  series: SettlementSeriesResponse | null,
  currency: string,
): SeriesPointView[] {
  return (series?.periods ?? []).map((period) => {
    const row = (period.by_currency ?? []).find((c) => c.currency === currency);
    return {
      fxConversionState: row?.fx_conversion?.state ?? null,
      fxConversionEvidence: row?.fx_conversion?.evidence ?? null,
      periodStart: period.period_start,
      periodEnd: period.period_end,
      planned: amountCell(row?.receivable_due ?? "0"),
      payableDue: amountCell(row?.payable_due ?? "0"),
      received: amountCell(row?.received ?? "0"),
      paidOut: amountCell(row?.paid_out ?? "0"),
      receivableEnd: amountCell(row?.receivable_outstanding_end ?? "0"),
      payableEnd: amountCell(row?.payable_outstanding_end ?? "0"),
      overdueReceivableEnd: amountCell(row?.overdue_receivable_end ?? "0"),
      overduePermyriad: overdueRatePermyriad(row),
    };
  });
}

export type GpPointView = {
  periodStart: string;
  periodEnd: string;
  gp: AmountCell;
  revenue: AmountCell;
  /** Exact ten-thousandths of the BE 0..1 ratio; null when the row is absent. */
  marginPermyriad: bigint | null;
  hasData: boolean;
  dealCount: number | null;
  /** 품질 메타데이터 — 서버가 값을 주지 않으면 null. 0(문제 없음)과 구별한다. */
  zeroCostDealCount: number | null;
  excludedMixed: number | null;
  excludedIncomplete: number | null;
  excludedDirectionPending: number | null;
  /** 취소·보관 Deal 제외(OD-009) — BE `excluded.commercially_inactive`. */
  excludedCommerciallyInactive: number | null;
  fxConversionState: string | null;
  fxConversionEvidence: FXConversionEvidence | null;
};

function exclusionCount(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

export function gpForCurrency(gp: GPSeriesResponse | null, currency: string): GpPointView[] {
  return (gp?.periods ?? []).map((period) => {
    const row = (period.by_currency ?? []).find((c) => c.currency === currency);
    return {
      fxConversionState: row?.fx_conversion?.state ?? null,
      fxConversionEvidence: row?.fx_conversion?.evidence ?? null,
      periodStart: period.period_start,
      periodEnd: period.period_end,
      gp: amountCell(row?.gp ?? "0"),
      revenue: amountCell(row?.revenue ?? "0"),
      marginPermyriad: row ? ratioPermyriad(row.margin) : null,
      hasData: Boolean(row),
      dealCount: row && typeof row.deal_count === "number" ? row.deal_count : null,
      zeroCostDealCount: row && typeof row.zero_cost_deal_count === "number" ? row.zero_cost_deal_count : null,
      excludedMixed: exclusionCount(period.excluded?.mixed_currency),
      excludedIncomplete: exclusionCount(period.excluded?.incomplete),
      excludedDirectionPending: exclusionCount(period.excluded?.direction_pending),
      excludedCommerciallyInactive: exclusionCount(period.excluded?.commercially_inactive),
    };
  });
}

export type KpiDeltas = {
  latest: SeriesPointView | null;
  previous: SeriesPointView | null;
  /** 수취 예정 전기 대비 % (전기 0 이면 null). */
  plannedDeltaPctTenths: bigint | null;
  /** FS-05-01 §4 지급 예정(`payable_due`) 전기 대비 % (전기 0 이면 null). */
  payableDueDeltaPctTenths: bigint | null;
  /** AR 적용액 / 수취 예정 % (예정 0 이면 null). */
  receivedRatioPctTenths: bigint | null;
  /** AP 적용액(`paid_out`) / 지급 예정액(`payable_due`) % (예정 0 이면 null). */
  paidOutRatioPctTenths: bigint | null;
  /** 기말 미수 전기 대비 % (전기 0 이면 null). */
  outstandingDeltaPctTenths: bigint | null;
  /** FS-05-01 §4 기말 연체 받을 돈(`overdue_receivable_end`) 전기 대비 % (전기 0 이면 null). */
  overdueReceivableDeltaPctTenths: bigint | null;
  /** Exact percentage-point delta in ten-thousandths of the source ratio. */
  overdueDeltaPermyriad: bigint | null;
};

/** KPI 델타 — 최신 기간 vs 직전 기간. 금액은 %, 비율은 %p 로 비교한다. */
export function computeKpis(points: SeriesPointView[]): KpiDeltas {
  const latest = points.length > 0 ? points[points.length - 1] : null;
  const previous = points.length > 1 ? points[points.length - 2] : null;
  const pctDelta = (cur: AmountCell, prev: AmountCell | undefined | null): bigint | null =>
    prev != null && cur.valid && prev.valid
      ? roundedPercentage(cur.scaled - prev.scaled, prev.scaled)
      : null;
  return {
    latest,
    previous,
    plannedDeltaPctTenths: latest ? pctDelta(latest.planned, previous?.planned) : null,
    payableDueDeltaPctTenths: latest ? pctDelta(latest.payableDue, previous?.payableDue) : null,
    receivedRatioPctTenths:
      latest && latest.received.valid && latest.planned.valid
        ? roundedPercentage(latest.received.scaled, latest.planned.scaled)
        : null,
    paidOutRatioPctTenths:
      latest && latest.paidOut.valid && latest.payableDue.valid
        ? roundedPercentage(latest.paidOut.scaled, latest.payableDue.scaled)
        : null,
    outstandingDeltaPctTenths: latest ? pctDelta(latest.receivableEnd, previous?.receivableEnd) : null,
    overdueReceivableDeltaPctTenths: latest
      ? pctDelta(latest.overdueReceivableEnd, previous?.overdueReceivableEnd)
      : null,
    overdueDeltaPermyriad:
      latest?.overduePermyriad != null && previous?.overduePermyriad != null
        ? latest.overduePermyriad - previous.overduePermyriad
        : null,
  };
}

export type GpKpi = {
  latest: GpPointView | null;
  previous: GpPointView | null;
  /** Latest server margin as an exact 0..1 ratio in ten-thousandths. */
  marginPermyriad: bigint | null;
  /** Exact percentage-point delta between server ratio values. */
  marginDeltaPermyriad: bigint | null;
};

export function computeGpKpi(points: GpPointView[]): GpKpi {
  const withData = points.filter((p) => p.hasData);
  const latest = withData.length > 0 ? withData[withData.length - 1] : null;
  const previous = withData.length > 1 ? withData[withData.length - 2] : null;
  const marginPermyriad = latest?.marginPermyriad ?? null;
  const marginDeltaPermyriad =
    latest?.marginPermyriad != null && previous?.marginPermyriad != null
      ? latest.marginPermyriad - previous.marginPermyriad
      : null;
  return { latest, previous, marginPermyriad, marginDeltaPermyriad };
}

export type GpKpiBasisCopy = {
  gpBasis: string;
  gpExcludedMixed: string;
  gpExcludedIncomplete: string;
  gpExcludedBoth: string;
  gpExcludedDirectionPending: string;
  gpExcludedCommerciallyInactive: string;
  gpZeroCost: string;
  /** 서버가 품질 메타데이터를 주지 않았을 때 — "제외 0건" 확언과 구별한다. */
  gpExcludedUnknown: string;
  gpZeroCostUnknown: string;
};

function fillTokens(template: string, tokens: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(tokens)) {
    out = out.replaceAll(`{${key}}`, value);
  }
  return out;
}

export type GpWindowExclusionCopy = {
  excludedMixed: string;
  excludedIncomplete: string;
  excludedBoth: string;
  excludedDirectionPending: string;
  excludedCommerciallyInactive: string;
  excludedUnknown: string;
};

export type GpWindowExclusion = {
  /** 화면에 붙일 문구. null = 붙일 것이 없음(제외 0건이거나 gp 응답 자체가 없음). */
  text: string | null;
  /** 서버가 제외 집계를 주지 않아 "0건"으로 단정할 수 없는 상태. */
  unknown: boolean;
  /** 혼합 통화 제외가 실제로 있는가 — 환산 관련 주석은 이때만 붙인다. */
  mixedPresent: boolean;
};

/**
 * 창(window) 단위 제외 집계 문구 — FS-05-01 §4.
 * 서버가 제외 건수를 주지 않으면 "제외 0건"으로 단정하지 않는다: 모름은 모름으로 표시한다.
 */
export function gpWindowExclusion(
  gp: { excluded?: GPExcluded } | null,
  copy: GpWindowExclusionCopy,
): GpWindowExclusion {
  if (!gp) return { text: null, unknown: false, mixedPresent: false };

  const mixed = exclusionCount(gp.excluded?.mixed_currency);
  const incomplete = exclusionCount(gp.excluded?.incomplete);
  const directionPending = exclusionCount(gp.excluded?.direction_pending);
  // OD-009 취소·보관 제외. `direction_pending` 과 같은 additive 계약이므로 같은
  // 자세로 다룬다 — 값이 없으면 제외 집계를 완전하다고 말하지 않는다.
  const commerciallyInactive = exclusionCount(gp.excluded?.commercially_inactive);
  if (mixed == null || incomplete == null || directionPending == null || commerciallyInactive == null) {
    return { text: copy.excludedUnknown, unknown: true, mixedPresent: false };
  }
  let text: string | null = null;
  if (mixed > 0 && incomplete > 0) {
    text = fillTokens(copy.excludedBoth, { mixed: String(mixed), incomplete: String(incomplete) });
  } else if (mixed > 0) {
    text = fillTokens(copy.excludedMixed, { count: String(mixed) });
  } else if (incomplete > 0) {
    text = fillTokens(copy.excludedIncomplete, { count: String(incomplete) });
  }
  if (directionPending > 0) {
    const pendingText = fillTokens(copy.excludedDirectionPending, { count: String(directionPending) });
    text = text ? `${text} · ${pendingText}` : pendingText;
  }
  if (commerciallyInactive > 0) {
    const inactiveText = fillTokens(copy.excludedCommerciallyInactive, {
      count: String(commerciallyInactive),
    });
    text = text ? `${text} · ${inactiveText}` : inactiveText;
  }
  return { text, unknown: false, mixedPresent: mixed > 0 };
}

export function gpKpiBasisText(latest: GpPointView | null, copy: GpKpiBasisCopy): string | null {
  if (!latest) return null;
  const parts: string[] = [];
  // deal_count 미반환은 모름 보존 — 분모를 지어내지 않는다(#436 기대표).
  if (latest.dealCount != null) {
    parts.push(fillTokens(copy.gpBasis, { count: String(latest.dealCount) }));
  }
  const { excludedMixed, excludedIncomplete, excludedDirectionPending, excludedCommerciallyInactive } =
    latest;
  if (
    excludedMixed == null ||
    excludedIncomplete == null ||
    excludedDirectionPending == null ||
    excludedCommerciallyInactive == null
  ) {
    parts.push(copy.gpExcludedUnknown);
  } else {
    if (excludedMixed > 0 && excludedIncomplete > 0) {
      parts.push(
        fillTokens(copy.gpExcludedBoth, {
          mixed: String(excludedMixed),
          incomplete: String(excludedIncomplete),
        }),
      );
    } else if (excludedMixed > 0) {
      parts.push(fillTokens(copy.gpExcludedMixed, { count: String(excludedMixed) }));
    } else if (excludedIncomplete > 0) {
      parts.push(fillTokens(copy.gpExcludedIncomplete, { count: String(excludedIncomplete) }));
    }
    if (excludedDirectionPending > 0) {
      parts.push(fillTokens(copy.gpExcludedDirectionPending, { count: String(excludedDirectionPending) }));
    }
    if (excludedCommerciallyInactive > 0) {
      parts.push(
        fillTokens(copy.gpExcludedCommerciallyInactive, {
          count: String(excludedCommerciallyInactive),
        }),
      );
    }
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function gpKpiCautionText(latest: GpPointView | null, copy: GpKpiBasisCopy): string | null {
  if (!latest) return null;
  if (latest.zeroCostDealCount == null) return copy.gpZeroCostUnknown;
  if (latest.zeroCostDealCount <= 0) return null;
  return fillTokens(copy.gpZeroCost, { count: String(latest.zeroCostDealCount) });
}

export type TopCounterpartyView = {
  counterparty: string;
  currency: string;
  amount: AmountCell;
  dealCount: number;
  /** metric=overdue 조인 — 상한 응답에 행이 없으면 알 수 없으므로 null. */
  overdue: AmountCell | null;
  /** counterparty-gp 조인 — GP 산정 불가 거래처는 null (시안: "GP 산정 불가"). */
  gp: AmountCell | null;
  /** Exact ten-thousandths of the BE 0..1 ratio. */
  marginPermyriad: bigint | null;
  fxConversionState: string | null;
  fxConversionEvidence: FXConversionEvidence | null;
  /** counterparty-status 의 현재 시점 근거 — 응답에 행이 없으면 null. */
  status: {
    outstanding: AmountCell;
    overdue: AmountCell;
    nextDueDate: string | null;
    nextDueAmount: AmountCell;
    upcomingShipments: number;
    recentDocs: number;
    lastActivity: string | null;
    activeDeals: number;
  } | null;
};

/**
 * 고객사 Top-N — counterparty-top(receivable) 을 축으로 overdue·GP·status 를
 * (counterparty, currency) 키로 조인. 선택 통화 행만 취해 절대 합산하지 않는다.
 */
export function joinTopCounterparties(
  top: CounterpartyTopResponse | null,
  overdueTop: CounterpartyTopResponse | null,
  counterpartyGp: CounterpartyGPResponse | null,
  counterpartyStatus: CounterpartyStatusResponse | null,
  currency: string,
  limit = 5,
): TopCounterpartyView[] {
  // erp-v2-adapt: begin text-safe U+0000 separator escape
  const key = (counterparty: string, ccy: string) => `${counterparty}\u0000${ccy}`;
  // erp-v2-adapt: end
  const overdueByKey = new Map<string, AmountCell>();
  for (const item of overdueTop?.items ?? []) {
    overdueByKey.set(key(item.counterparty, item.currency), amountCell(item.amount));
  }
  const gpByKey = new Map<
    string,
    {
      gp: AmountCell;
      marginPermyriad: bigint | null;
      fxConversionState: string | null;
      fxConversionEvidence: FXConversionEvidence | null;
    }
  >();
  for (const item of counterpartyGp?.items ?? []) {
    gpByKey.set(key(item.counterparty, item.currency), {
      gp: amountCell(item.gp),
      marginPermyriad: item.margin != null ? ratioPermyriad(item.margin) : null,
      fxConversionState: item.fx_conversion?.state ?? null,
      fxConversionEvidence: item.fx_conversion?.evidence ?? null,
    });
  }
  const statusByKey = new Map<string, NonNullable<TopCounterpartyView["status"]>>();
  for (const item of counterpartyStatus?.items ?? []) {
    statusByKey.set(key(item.counterparty, item.currency), {
      outstanding: amountCell(item.outstanding),
      overdue: amountCell(item.overdue),
      nextDueDate: item.next_due_date ?? null,
      nextDueAmount: amountCell(item.next_due_amount),
      upcomingShipments: item.upcoming_shipments,
      recentDocs: item.recent_docs,
      lastActivity: item.last_activity ?? null,
      activeDeals: item.active_deals,
    });
  }
  return (top?.items ?? [])
    .filter((item) => item.currency === currency)
    .slice(0, limit)
    .map((item) => {
      const k = key(item.counterparty, item.currency);
      const gpRow = gpByKey.get(k) ?? null;
      return {
        counterparty: item.counterparty,
        currency: item.currency,
        amount: amountCell(item.amount),
        dealCount: item.deal_count,
        overdue: overdueByKey.get(k) ?? null,
        gp: gpRow ? gpRow.gp : null,
        marginPermyriad: gpRow ? gpRow.marginPermyriad : null,
        fxConversionState:
          item.fx_conversion?.state === "환산 불가" || gpRow?.fxConversionState === "환산 불가"
            ? "환산 불가"
            : item.fx_conversion?.state ?? gpRow?.fxConversionState ?? null,
        // 두 소스 다 존재하면 receivable-top 쪽(item)을 우선한다 — 동일 (통화, 기간) 조회라 같은
        // 근거를 가리켜야 정상이고, item 쪽이 이 행의 1차 축(receivable amount)이다.
        fxConversionEvidence: item.fx_conversion?.evidence ?? gpRow?.fxConversionEvidence ?? null,
        status: statusByKey.get(k) ?? null,
      };
    });
}

/** "YYYY-MM-DD" → { y, m(1-12), d }. */
function partsOf(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { y: y ?? 1970, m: m ?? 1, d: d ?? 1 };
}

/** 오늘 기준 지난달 "YYYY-MM" — 가장 최근 마감 가능 달의 기본 제안. */
export function previousMonthPeriod(todayISO: string): string {
  const { y, m } = partsOf(todayISO);
  const date = new Date(Date.UTC(y, m - 2, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** 오늘이 속한(진행 중) 달 "YYYY-MM". */
export function currentMonthPeriod(todayISO: string): string {
  const { y, m } = partsOf(todayISO);
  return `${y}-${String(m).padStart(2, "0")}`;
}

/** 다음 달 1일 "YYYY-MM-DD" — 진행 중 달이 마감 가능해지는 날. */
export function firstOfNextMonthISO(todayISO: string): string {
  const { y, m } = partsOf(todayISO);
  const date = new Date(Date.UTC(y, m, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

/**
 * 마감 제안 달 — 지난달부터 최대 lookback 개월을 거슬러 "아직 안 닫힌 가장
 * 최근 달"을 찾는다(전부 닫혀 있으면 null → 버튼 숨김).
 */
export function nextClosablePeriod(
  todayISO: string,
  closedPeriods: Set<string>,
  lookbackMonths = MONTH_CLOSE_LOOKBACK_MONTHS,
): string | null {
  const { y, m } = partsOf(todayISO);
  for (let back = 1; back <= lookbackMonths; back += 1) {
    const date = new Date(Date.UTC(y, m - 1 - back, 1));
    const period = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    if (!closedPeriods.has(period)) return period;
  }
  return null;
}

/** "YYYY-MM-DD" period_start → "YYYY-MM" (월마감 리스트 키). */
export function monthPeriodOf(periodStartISO: string): string {
  return periodStartISO.slice(0, 7);
}

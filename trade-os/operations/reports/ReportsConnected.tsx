import { HostTable, HostTableHeader, HostTableBody, HostTableRow, HostTableHead, HostTableCell } from "@trade-os/operations/components/HostTable";
"use client";
import { BusinessListToolbar, BusinessFilterField, BusinessFilterSelect } from "@shared/components/business-filters";

import { Segmented } from "@trade-os/operations/components/SegmentedControl";
export { Segmented } from "@trade-os/operations/components/SegmentedControl";

import { useLocale } from "@trade-os/operations/compat/intl";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { InfoBox } from "@trade-os/operations/components/InfoBox";
import { SectionCard } from "@trade-os/operations/components/SectionCard";
import { AnalyticsSkeleton } from "@trade-os/operations/components/AnalyticsSkeleton";
import { SkeletonList } from "@trade-os/operations/components/Skeletons";
import { useToast } from "@trade-os/operations/components/toast/useToast";
import { Button } from "@trade-os/operations/components/ui/button";
import { Dialog } from "@trade-os/operations/components/ui/dialog";
import { Select } from "@trade-os/operations/components/ui/dropdown";
import { cx } from "@trade-os/operations/components/ui/utils";
// erp-v2-adapt: begin — QA-1352 defers the gate reason to BE #495 instead of the boolean projection.
import { usePlatformSession } from "@trade-os/operations/session/PlatformSessionContext";
import { InsightsGateNotice } from "@trade-os/operations/shared/InsightsGateNotice";
// erp-v2-adapt: end
// FE#760 — Top-N 원천 데이터 드릴다운. Reuses the existing (previously
// unproduced) `?drill=party&name=&currency=` contract SettlementConnected
// already parses/handles — see settlementCounterpartyDrillHref's doc comment.
import { settlementCounterpartyDrillHref } from "@trade-os/operations/settlement/settlementDecisionCardData";
import { ApiError } from "@trade-os/operations/lib/api/client";
// erp-v2-adapt: begin — QA-1352 consumes the unremapped BE #495 status/code pair.
import { classifyEntitlementGate, type EntitlementGateReason } from "@trade-os/operations/lib/api/entitlements";
// erp-v2-adapt: end
import {
  closeMonth,
  getCounterpartyGp,
  getCounterpartyStatus,
  getCounterpartyTop,
  getGpSeries,
  getMonthClose,
  getSettlementSeries,
  listMonthCloses,
  reopenMonthClose,
  type CounterpartyGPResponse,
  type CounterpartyStatusResponse,
  type CounterpartyTopResponse,
  type FXConversionEvidence,
  type GPSeriesResponse,
  type MonthClose,
  type MonthCloseFXEvidence,
  type MonthCloseSnapshotV1,
  type SettlementSeriesResponse,
} from "@trade-os/operations/lib/api/reports";
import { listMembers, memberLabel, type OrgMember } from "@trade-os/operations/lib/api/members";
import { isTransientError, withRetry } from "@trade-os/operations/lib/api/retry";
import { localeTag } from "@trade-os/operations/i18n/messages";
import {
  formatNumber,
  formatPermyriadPct,
  formatScaledDecimal,
  formatScaledMoney,
  formatScaledPct,
} from "@trade-os/operations/lib/money";
import { formatDateTime, localTodayISO, todayISOIn } from "@trade-os/operations/lib/orgDate";
import {
  FINANCE_DECIMAL_SCALE,
  amountCell,
  decimalMagnitude,
  financeDecimalMagnitude,
  type AmountCell,
} from "@trade-os/operations/lib/financeDecimal";

import { BalanceLineChart } from "./charts/BalanceLineChart";
import { GpBarChart } from "./charts/GpBarChart";
import { OverdueRateChart } from "./charts/OverdueRateChart";
import { PlanActualBarChart } from "./charts/PlanActualBarChart";
import {
  computeGpKpi,
  computeKpis,
  computeRange,
  currentMonthPeriod,
  deriveCurrencies,
  firstOfNextMonthISO,
  gpForCurrency,
  gpKpiBasisText,
  gpKpiCautionText,
  gpWindowExclusion,
  joinTopCounterparties,
  MONTH_CLOSE_LOOKBACK_MONTHS,
  monthPeriodOf,
  nextClosablePeriod,
  num,
  rangesForGranularity,
  overdueRatePermyriad,
  seriesForCurrency,
  type ReportRangeMonths,
} from "./reportsData";

import type { AppMessages } from "@trade-os/operations/i18n/messages";

export type ReportsCopy = AppMessages["erpReports"]["reports"];

type Granularity = "month" | "week";
type GetIdToken = Parameters<typeof getSettlementSeries>[1];

/**
 * FX rate evidence scale — matches `rate NUMERIC(24,12)`
 * (`migrations/0284_erp_fx_approved_receipts.up.sql:11` in the backend repo).
 * Money elsewhere on this screen uses `FINANCE_DECIMAL_SCALE` (10 fractional
 * digits); a rate needs its own scale so a receipt value round-trips exactly
 * instead of being silently rounded to a different number of digits.
 */
const FX_RATE_SCALE = BigInt("1000000000000");

/**
 * 마지막으로 성공한 값과 그 기준시각. SC-24 QA 기준의 "카드별 기준시각" 축이다.
 *
 * `serverStamped` 는 `loadedAt` 이 서버가 집계한 시각(FS-17 §3 기준시각)인지,
 * 클라이언트가 응답을 받은 시각인지를 구분한다. 정산·GP 집계는 `data_as_of` 를
 * 실어 오므로 서버 시각을 쓰고, 아직 그 필드가 없는 응답은 수신 시각으로 근사한다 —
 * 두 경우에 같은 문구를 쓰면 근사값을 서버 기준값이라고 말하게 된다.
 */
type CardSnapshot<T> = { data: T; loadedAt: number; serverStamped: boolean; requestKey?: string };

// 스냅샷은 상태에 통째로 담는다. 렌더에서 매번 새 객체로 조립하면 참조가 흔들려
// 아래 useMemo 들의 수동 메모이제이션이 React Compiler 판정을 통과하지 못한다.
type CardState<T> =
  | { status: "loading"; retained: CardSnapshot<T> | null }
  | { status: "error"; retained: CardSnapshot<T> | null }
  /**
   * SC-24 Badge Matrix 머리말: "Member 권한 범위를 상태 Badge로 위장하지 않고
   * 허용되지 않은 항목을 반환·표시하지 않는다." 403 과 비관리자 조회는 일시
   * 실패가 아니라 조회 범위 밖이므로 `error`(위험 톤 `조회 실패`)와 구분하고,
   * 직전 값도 남기지 않는다(상업 게이트와 같은 자세 — settlementState 참고).
   */
  | { status: "forbidden" }
  | { status: "ready"; snapshot: CardSnapshot<T> };

/**
 * 기준시각을 고정한다. 렌더 밖(응답 콜백)에서만 호출한다.
 *
 * 서버가 `data_as_of` 를 실어 주면 그것을 쓴다 — 수신 시각은 서버가 언제 집계했는지
 * 말해 주지 못해, 한 시간 전 집계본도 방금 값처럼 보이게 한다. 값이 없거나 파싱되지
 * 않으면 수신 시각으로 근사하되 그 사실을 `serverStamped` 로 남긴다.
 */
function snapshotOf<T>(data: T, serverAsOf?: string | null, requestKey?: string): CardSnapshot<T> {
  const parsed = serverAsOf ? Date.parse(serverAsOf) : Number.NaN;
  return Number.isFinite(parsed)
    ? { data, loadedAt: parsed, serverStamped: true, requestKey }
    : { data, loadedAt: Date.now(), serverStamped: false, requestKey };
}

function isOlderServerSnapshot<T>(
  next: CardSnapshot<T>,
  previous: CardSnapshot<T> | null,
): boolean {
  return Boolean(
    previous?.serverStamped &&
      next.serverStamped &&
      previous.requestKey &&
      next.requestKey &&
      previous.requestKey === next.requestKey &&
      next.loadedAt < previous.loadedAt,
  );
}

function readyCardState<T>(
  previous: CardState<T>,
  data: T,
  serverAsOf?: string | null,
  requestKey?: string,
): CardState<T> {
  const next = snapshotOf(data, serverAsOf, requestKey);
  const retained = retainedCard(previous);
  if (retained && isOlderServerSnapshot(next, retained)) return { status: "ready", snapshot: retained };
  return { status: "ready", snapshot: next };
}

/**
 * 다음 상태로 넘길 스냅샷. 재조회가 실패해도 직전 성공 값과 기준시각을 버리지 않아야
 * 실패 카드가 빈 오류 대신 "언제 기준 값인지"를 말할 수 있다(SC-24 "실패 카드별 오류").
 */
function retainedCard<T>(state: CardState<T>): CardSnapshot<T> | null {
  if (state.status === "ready") return state.snapshot;
  // 권한 상실은 일시 실패가 아니다 — 범위 밖 값을 화면에 남기지 않는다.
  if (state.status === "forbidden") return null;
  return state.retained;
}

/** SC-24 접근 계약: 거래처 카드의 403 은 데이터 품질 실패가 아니라 조회 범위 밖이다. */
function isForbiddenError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}

type CounterpartyCardData = {
  top: CounterpartyTopResponse;
  topOverdue: CounterpartyTopResponse;
  counterpartyGp: CounterpartyGPResponse;
  status: CounterpartyStatusResponse;
};

type SettlementSnapshot = CardSnapshot<SettlementSeriesResponse>;

type SettlementState =
  | { status: "loading"; retained: SettlementSnapshot | null }
  | { status: "error"; message: string | null; retained: SettlementSnapshot | null }
  // erp-v2-adapt: begin — QA-1352 preserves BE #495's commercial-gate reason.
  | { status: "gated"; reason: EntitlementGateReason }
  // erp-v2-adapt: end
  | { status: "ready"; snapshot: SettlementSnapshot };

function retainedSettlement(state: SettlementState): SettlementSnapshot | null {
  if (state.status === "ready") return state.snapshot;
  // 상업 게이트는 일시 실패가 아니라 권한 상실이므로 직전 값을 남기지 않는다.
  if (state.status === "gated") return null;
  return state.retained;
}

function readySettlementState(
  previous: SettlementState,
  data: SettlementSeriesResponse,
  requestKey: string,
): SettlementState {
  const next = snapshotOf(data, data.data_as_of, requestKey);
  const retained = retainedSettlement(previous);
  if (retained && isOlderServerSnapshot(next, retained)) return { status: "ready", snapshot: retained };
  return { status: "ready", snapshot: next };
}

function settlementRequestKey(
  granularity: Granularity,
  from: string,
  to: string,
  assignee: string | null,
): string {
  return `${granularity}\u0000${from}\u0000${to}\u0000${assignee ?? ""}`;
}

function gpRequestKey(from: string, to: string, assignee: string | null): string {
  return `${from}\u0000${to}\u0000${assignee ?? ""}`;
}

function replaceTokens(template: string, tokens: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(tokens)) {
    out = out.replaceAll(`{${key}}`, value);
  }
  return out;
}

function settlementFailureState(error: unknown, previous: SettlementState): SettlementState {
  // erp-v2-adapt: begin — QA-1352 classifies the unremapped BE #495 status/code pair.
  const gateReason = error instanceof ApiError ? classifyEntitlementGate(error) : null;
  if (gateReason) return { status: "gated", reason: gateReason };
  // erp-v2-adapt: end
  return {
    status: "error",
    message: error instanceof ApiError && error.message ? error.message : null,
    retained: retainedSettlement(previous),
  };
}

const TOP_FETCH_LIMIT = 50;
const TOP_DISPLAY_LIMIT = 5;
const STATUS_FETCH_LIMIT = 200;
// FE#760 — 담당자 필터 Select 의 "전체" 센티널(uuid 와 충돌하지 않는 값). 같은
// 관례를 쓰는 salesperf/SalesPerformanceConnected.tsx 와 동일 상수명.
const ASSIGNEE_ALL = "all";
// Stable empty fallback for the closes card. An inline `[]` is a fresh reference on every
// render, which re-invalidates the closedPeriods useMemo while that card is not ready.
const NO_CLOSES: MonthClose[] = [];

const OBSOLETE_REPORT_REQUEST = new Error("Report request generation is obsolete");

function withGenerationRetry<T>(
  isCurrent: () => boolean,
  operation: () => Promise<T>,
): Promise<T> {
  return withRetry(
    () => {
      if (!isCurrent()) throw OBSOLETE_REPORT_REQUEST;
      return operation();
    },
    {
      shouldRetry: (error) => isCurrent() && isTransientError(error),
    },
  );
}

async function getCounterpartyCardData(
  from: string,
  to: string,
  assignee: string | null,
  getIdToken: GetIdToken,
): Promise<CounterpartyCardData> {
  // FE#760 — backend#1183/BE PR #1185 wired assignee into counterparty-top/-gp
  // (COCKPIT semantics, same as settlement-series/gp-series). counterparty-status
  // (the row-level evidence panel on this same card) already accepted `assignee`
  // on both ends of the contract before this issue — only this call site was
  // unwired. Left unscoped, a scoped Top-N ranking would sit next to org-wide
  // per-row evidence: a half-scope card that quietly mixes populations.
  const [top, topOverdue, counterpartyGp, status] = await Promise.all([
    getCounterpartyTop(
      { metric: "receivable", from, to, limit: TOP_FETCH_LIMIT, ...(assignee ? { assignee } : {}) },
      getIdToken,
    ),
    getCounterpartyTop(
      { metric: "overdue", from, to, limit: TOP_FETCH_LIMIT, ...(assignee ? { assignee } : {}) },
      getIdToken,
    ),
    getCounterpartyGp(
      { from, to, limit: TOP_FETCH_LIMIT, ...(assignee ? { assignee } : {}) },
      getIdToken,
    ),
    getCounterpartyStatus(
      { from, to, limit: STATUS_FETCH_LIMIT, ...(assignee ? { assignee } : {}) },
      getIdToken,
    ),
  ]);
  return { top, topOverdue, counterpartyGp, status };
}

/** 조직 업무 TZ 기준 "오늘". 알 수 없거나 브라우저 ICU가 지원하지 않는 존은 신뢰하지 않는다. */
function trustedOrgTodayISO(timezone: string | undefined): string | null {
  if (!timezone) return null;
  try {
    return todayISOIn(timezone);
  } catch {
    return null;
  }
}

type ReportsHeaderRenderer = (controls: ReactNode, summary?: ReactNode) => ReactNode;

export function ReportsConnected({ copy, role, renderHeader }: { copy: ReportsCopy; role?: string; renderHeader?: ReportsHeaderRenderer }) {
  const { getIdToken, identity } = usePlatformSession();
  const sessionKey = `${identity.org_id}\u0000${identity.user_id}`;

  return (
    <ReportsConnectedSession
      key={sessionKey}
      copy={copy}
      getIdToken={getIdToken}
      role={role}
      renderHeader={renderHeader}
    />
  );
}

function ReportsConnectedSession({
  copy,
  getIdToken,
  role,
  renderHeader,
}: {
  copy: ReportsCopy;
  getIdToken: GetIdToken;
  role?: string;
  renderHeader?: ReportsHeaderRenderer;
}) {
  // erp-v2-adapt: begin — QA-1352 removes the lossy entitlement-projection read.
  // erp-v2-adapt: end
  const locale = useLocale();
  const tag = localeTag(locale);

  // erp-v2-adapt: begin — QA-1352 removes the projection-derived preflight gate.
  // erp-v2-adapt: end
  // FE#760 — member 는 BE 가 assignee 요청을 본인으로 강제(resolveAssigneeFilter,
  // 조용히 덮어쓴다 — 검증하지 않는다)하므로, FE 는 그 전제로 owner/admin 에게만
  // 담당자 필터를 노출한다. 다른 멤버를 고른 것처럼 보이지만 실제로는 본인 스코프만
  // 돌아오는 화면을 만들지 않기 위함(salesperf/SalesPerformanceConnected.tsx 와
  // 동일 자세).
  const isManager = role === "owner" || role === "admin";
  const [granularity, setGranularity] = useState<Granularity>("month");
  const [rangeMonths, setRangeMonths] = useState<ReportRangeMonths>(12);
  const [currencyChoice, setCurrencyChoice] = useState<string | null>(null);
  // FE#760 — null = ASSIGNEE_ALL(전체 담당자, org-wide) 의 내부 표현. "전체" 는
  // 빈 문자열이 아니라 명시 상태로 다룬다 — 빈 문자열을 그대로 보내면 BE
  // parseAssigneeParam 이 "assignee must be a user UUID" 400 으로 거절한다.
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [selectedTopKey, setSelectedTopKey] = useState<string | null>(null);
  // erp-v2-adapt: begin — QA-1352 waits for the backend gate reason before choosing a notice.
  const [settlementState, setSettlementState] = useState<SettlementState>({
    status: "loading",
    retained: null,
  });
  // erp-v2-adapt: end
  const [gpState, setGpState] = useState<CardState<GPSeriesResponse | null>>({
    status: "loading",
    retained: null,
  });
  const [topState, setTopState] = useState<CardState<CounterpartyCardData>>({
    status: "loading",
    retained: null,
  });
  const [closesState, setClosesState] = useState<CardState<MonthClose[]>>({
    status: "loading",
    retained: null,
  });
  const [reportsRefreshing, setReportsRefreshing] = useState(false);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const reportsRefreshInFlightRef = useRef(false);
  const reportsRefreshEventId = useRef(0);
  const settlementEventId = useRef(0);
  const gpEventId = useRef(0);
  const topEventId = useRef(0);
  const closesEventId = useRef(0);
  const membersEventId = useRef(0);
  const snapshotEventId = useRef(0);
  const sessionEventId = useRef(0);

  // ── 월마감 액션 상태 ──
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeNote, setCloseNote] = useState("");
  const [closeSubmitting, setCloseSubmitting] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const toast = useToast();

  // ── 월마감 재개방 상태 (OD-011 — 영향 안내 확인 + 사유 입력) ──
  const [reopenTarget, setReopenTarget] = useState<MonthClose | null>(null);
  const [reopenReason, setReopenReason] = useState("");
  const [reopenSubmitting, setReopenSubmitting] = useState(false);
  const [reopenError, setReopenError] = useState<string | null>(null);

  // ── 마감 스냅샷 뷰 상태 ──
  const [snapshotState, setSnapshotState] = useState<
    | { status: "closed" }
    | { status: "loading"; period: string }
    | { status: "error"; period: string }
    | { status: "ready"; period: string; close: MonthClose }
  >({ status: "closed" });

  const isMonth = granularity === "month";

  useEffect(
    () => () => {
      sessionEventId.current += 1;
      settlementEventId.current += 1;
      gpEventId.current += 1;
      topEventId.current += 1;
      closesEventId.current += 1;
      membersEventId.current += 1;
      snapshotEventId.current += 1;
      reportsRefreshEventId.current += 1;
      reportsRefreshInFlightRef.current = false;
    },
    [],
  );

  // 로딩 상태 전환은 이벤트 핸들러/초기값에서 하고, effect 는 소유 의존성의 fetch 만 발화한다
  // (react-hooks/set-state-in-effect — 동기 setState 금지).
  useEffect(() => {
    const eventId = settlementEventId.current + 1;
    settlementEventId.current = eventId;
    const sessionId = sessionEventId.current;
    const isCurrent = () =>
      sessionEventId.current === sessionId && settlementEventId.current === eventId;
    const { from, to } = computeRange(localTodayISO(), rangeMonths);
    const requestKey = settlementRequestKey(granularity, from, to, assigneeFilter);

    void withGenerationRetry(isCurrent, () =>
      getSettlementSeries(
        { granularity, from, to, ...(assigneeFilter ? { assignee: assigneeFilter } : {}) },
        getIdToken,
      ),
    )
      .then((nextSeries) => {
        if (!isCurrent()) return;
        setSettlementState((prev) => readySettlementState(prev, nextSeries, requestKey));
      })
      .catch((error) => {
        if (!isCurrent()) return;
        setSettlementState((prev) => settlementFailureState(error, prev));
      });

    return () => {
      settlementEventId.current += 1;
    };
  }, [assigneeFilter, getIdToken, granularity, rangeMonths]);

  useEffect(() => {
    const eventId = gpEventId.current + 1;
    gpEventId.current = eventId;
    if (!isMonth) {
      return () => {
        gpEventId.current += 1;
      };
    }
    const sessionId = sessionEventId.current;
    const isCurrent = () => sessionEventId.current === sessionId && gpEventId.current === eventId;

    const { from, to } = computeRange(localTodayISO(), rangeMonths);
    const requestKey = gpRequestKey(from, to, assigneeFilter);
    void withGenerationRetry(isCurrent, () =>
      getGpSeries({ from, to, ...(assigneeFilter ? { assignee: assigneeFilter } : {}) }, getIdToken),
    )
      .then((gp) => {
        if (!isCurrent()) return;
        setGpState((prev) => readyCardState(prev, gp, gp?.data_as_of, requestKey));
      })
      .catch(() => {
        if (!isCurrent()) return;
        setGpState((prev) => ({ status: "error", retained: retainedCard(prev) }));
      });

    return () => {
      gpEventId.current += 1;
    };
  }, [assigneeFilter, getIdToken, isMonth, rangeMonths]);

  useEffect(() => {
    const eventId = topEventId.current + 1;
    topEventId.current = eventId;
    const sessionId = sessionEventId.current;
    const isCurrent = () => sessionEventId.current === sessionId && topEventId.current === eventId;
    const { from, to } = computeRange(localTodayISO(), rangeMonths);

    // SC-24 §조건·카드·호출 "거래처 — Owner/Admin 전용": Member 에게는 거래처명·
    // 성과 행을 반환하지도 표시하지도 않는다. 요청을 보내 403 을 받아 실패 카드를
    // 그리는 대신 애초에 조회하지 않는다. 화면 상태는 렌더에서 `topForbidden` 으로
    // 파생한다 — 여기서 setState 하면 effect 가 연쇄 렌더를 만든다.
    if (!isManager) {
      return () => {
        topEventId.current += 1;
      };
    }

    void withGenerationRetry(isCurrent, () =>
      getCounterpartyCardData(from, to, assigneeFilter, getIdToken),
    )
      .then((top) => {
        if (!isCurrent()) return;
        setTopState({ status: "ready", snapshot: snapshotOf(top) });
      })
      .catch((error) => {
        if (!isCurrent()) return;
        if (isForbiddenError(error)) {
          setTopState({ status: "forbidden" });
          return;
        }
        setTopState((prev) => ({ status: "error", retained: retainedCard(prev) }));
      });

    return () => {
      topEventId.current += 1;
    };
  }, [assigneeFilter, getIdToken, isManager, rangeMonths]);

  useEffect(() => {
    const eventId = closesEventId.current + 1;
    closesEventId.current = eventId;
    const sessionId = sessionEventId.current;
    const isCurrent = () =>
      sessionEventId.current === sessionId && closesEventId.current === eventId;

    void withGenerationRetry(isCurrent, () =>
      listMonthCloses({ limit: MONTH_CLOSE_LOOKBACK_MONTHS }, getIdToken),
    )
      .then((closes) => {
        if (!isCurrent()) return;
        setClosesState({ status: "ready", snapshot: snapshotOf(closes.items ?? []) });
      })
      .catch(() => {
        if (!isCurrent()) return;
        setClosesState((prev) => ({ status: "error", retained: retainedCard(prev) }));
      });

    return () => {
      closesEventId.current += 1;
    };
  }, [getIdToken]);

  useEffect(() => {
    const eventId = membersEventId.current + 1;
    membersEventId.current = eventId;
    const sessionId = sessionEventId.current;
    const isCurrent = () =>
      sessionEventId.current === sessionId && membersEventId.current === eventId;

    // 마감자 이름 해석은 부가 정보 — 실패해도 화면을 막지 않는다(uuid 축약 폴백).
    void withGenerationRetry(isCurrent, () => listMembers(getIdToken))
      .then((nextMembers) => {
        if (!isCurrent()) return;
        setMembers(nextMembers);
      })
      .catch(() => {
        if (!isCurrent()) return;
        setMembers([]);
      });

    return () => {
      membersEventId.current += 1;
    };
  }, [getIdToken]);

  const fmtCompact = useCallback(
    (v: number) => formatNumber(v, tag, { notation: "compact", maximumFractionDigits: 1 }),
    [tag],
  );
  const fmtPct = useCallback(
    (v: number) => `${formatNumber(v, tag, { maximumFractionDigits: 1, minimumFractionDigits: 0 })}%`,
    [tag],
  );
  const fmtTenthsPct = useCallback(
    (tenths: bigint, signed = false) =>
      formatScaledPct(
        tenths,
        BigInt(10),
        tag,
        signed ? { signDisplay: "always" } : undefined,
      ),
    [tag],
  );
  const fmtRatioPct = useCallback(
    (permyriad: bigint | null) => (permyriad != null ? formatPermyriadPct(permyriad, tag) : "—"),
    [tag],
  );
  const fmtSignedPp = useCallback(
    (permyriad: bigint) => {
      const percentage = formatPermyriadPct(permyriad, tag, { signDisplay: "always" });
      return `${percentage.slice(0, -1)}%p`;
    },
    [tag],
  );
  const monthName = useCallback(
    (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(tag, { month: "short", timeZone: "UTC" }),
    [tag],
  );
  const monthDay = useCallback(
    (iso: string) =>
      new Date(`${iso}T00:00:00Z`).toLocaleDateString(tag, { month: "short", day: "numeric", timeZone: "UTC" }),
    [tag],
  );
  const yearMonth = useCallback(
    (iso: string) =>
      new Date(`${iso}T00:00:00Z`).toLocaleDateString(tag, { year: "numeric", month: "short", timeZone: "UTC" }),
    [tag],
  );
  /** KPI/델타용 짧은 기간 라벨 — 월: "6월", 주: "6월 22일 주". */
  const periodShortLabel = useCallback(
    (iso: string) =>
      isMonth ? monthName(iso) : replaceTokens(copy.weekPeriod, { date: monthDay(iso) }),
    [copy.weekPeriod, isMonth, monthDay, monthName],
  );
  /** 차트 x 축 라벨 — 월: "26.05", 주: "05.18" (시안 축 표기). */
  const axisLabel = useCallback(
    (iso: string) => (isMonth ? `${iso.slice(2, 4)}.${iso.slice(5, 7)}` : iso.slice(5, 10).replace("-", ".")),
    [isMonth],
  );
  /** 툴팁 타이틀 — 월: "2026년 6월", 주: "6월 22일 주". */
  const tooltipTitle = useCallback(
    (iso: string) =>
      isMonth ? yearMonth(iso) : replaceTokens(copy.weekPeriod, { date: monthDay(iso) }),
    [copy.weekPeriod, isMonth, monthDay, yearMonth],
  );
  // OD-010 다섯 항목 중 제공자/수동 입력 근거 — basis 는 BE 고정 enum("provider"|"manual").
  const fxBasisLabel = useCallback(
    (basis: string) => (basis === "provider" ? copy.charts.fxBasisProvider : copy.charts.fxBasisManual),
    [copy.charts.fxBasisManual, copy.charts.fxBasisProvider],
  );
  /**
   * 환산값 옆에 붙는 근거 한 줄 — 환율·기준/상대 통화·제공자 또는 수동 입력 근거·기준
   * 시각(OD-010 다섯 항목 중 넷). evidence 가 있을 때만 호출한다 — 없으면 지어내지 않는다.
   *
   * 환율은 `NUMERIC(24,12)` 영수증 값이다 — `Number()`를 거치면 float64 반올림으로
   * 저장된 값과 다른 숫자가 될 수 있다(예: 0.000740740741 → 0.000741, R1 리뷰 지적).
   * `decimalMagnitude`/`formatScaledDecimal`은 다른 금액 필드와 동일하게 BigInt로만
   * 계산해 영수증 값을 그대로 왕복시킨다. 파싱 실패 시에도 빈칸이 아니라 원본 문자열을
   * 그대로 보여준다 — 근거값을 숨기지 않는다.
   */
  const fxEvidenceLine = useCallback(
    (evidence: FXConversionEvidence) => {
      const rateMagnitude = decimalMagnitude(evidence.rate, FX_RATE_SCALE);
      const rateText =
        rateMagnitude != null
          ? formatScaledDecimal(rateMagnitude, FX_RATE_SCALE, tag)
          : evidence.rate;
      return replaceTokens(copy.charts.fxConversionEvidence, {
        pair: evidence.currency_pair,
        rate: rateText,
        basis: fxBasisLabel(evidence.basis),
        date: formatDateTime(evidence.as_of, tag),
      });
    },
    [copy.charts.fxConversionEvidence, fxBasisLabel, tag],
  );

  // ── ready(+실패 시 유지된 직전 값) 파생 데이터 ──
  // 조회 중에는 직전 값을 그리지 않는다 — 새 기간·단위의 응답을 기다리는 동안 옛 범위의
  // 값을 새 라벨 아래 두면 기준시각을 오해하게 만든다. 상태 자체는 스냅샷을 계속 들고 있어
  // 조회가 실패하면 그때 다시 드러난다. 헬퍼로 감싸지 않고 상태 프로퍼티를 직접 읽는 것은
  // React Compiler 가 아래 useMemo 들의 의존성 안정성을 추적할 수 있게 하기 위해서다.
  const settlementSnapshot =
    settlementState.status === "ready"
      ? settlementState.snapshot
      : settlementState.status === "error"
        ? settlementState.retained
        : null;
  const gpSnapshot =
    gpState.status === "ready"
      ? gpState.snapshot
      : gpState.status === "error"
        ? gpState.retained
        : null;
  // SC-24 §접근: Member 는 거래처 카드의 조회 범위 밖이다. 서버가 403 을 준
  // 경우(`forbidden`)와 역할상 애초에 조회하지 않는 경우를 한 상태로 본다.
  const topForbidden = !isManager || topState.status === "forbidden";
  const topSnapshot =
    topState.status === "ready"
      ? topState.snapshot
      : topState.status === "error"
        ? topState.retained
        : null;
  const closesSnapshot =
    closesState.status === "ready"
      ? closesState.snapshot
      : closesState.status === "error"
        ? closesState.retained
        : null;
  const settlementSeries = settlementSnapshot?.data ?? null;
  const gpData = gpSnapshot?.data ?? null;
  const topData = topSnapshot?.data ?? null;
  const closesData = closesSnapshot?.data ?? NO_CLOSES;
  const settlementCurrencies = useMemo(
    () => deriveCurrencies(settlementSeries, null),
    [settlementSeries],
  );
  const currencies = useMemo(
    () => deriveCurrencies(settlementSeries, gpData),
    [gpData, settlementSeries],
  );
  const currency =
    currencyChoice && currencies.includes(currencyChoice) ? currencyChoice : currencies[0] ?? null;
  const topCurrencies = useMemo(() => {
    const totals = new Map<string, bigint>();
    for (const item of topData?.top.items ?? []) {
      totals.set(
        item.currency,
        (totals.get(item.currency) ?? BigInt(0)) + financeDecimalMagnitude(item.amount),
      );
    }
    return Array.from(totals.entries())
      .sort((a, b) => {
        if (a[1] === b[1]) return a[0].localeCompare(b[0]);
        return a[1] > b[1] ? -1 : 1;
      })
      .map(([itemCurrency]) => itemCurrency);
  }, [topData]);
  const topCurrency =
    currencyChoice && topCurrencies.includes(currencyChoice)
      ? currencyChoice
      : currency && topCurrencies.includes(currency)
        ? currency
        : topCurrencies[0] ?? null;
  const fmtAmount = useCallback(
    (
      value: AmountCell | bigint | string | null | undefined,
      amountCurrency: string | null = currency,
    ) => {
      // 동결 스냅샷의 옛 버전 행은 새 필드를 키째로 담고 있지 않다(V4~V6 일정
      // 행에 adjustment_net/written_off_total/current_target 이 없다 — BE
      // `internal/service/erp/month_close.go:118-127`). undefined 를
      // formatScaledMoney 로 넘기면 BigInt 혼합 TypeError 로 마감 상세
      // 다이얼로그 전체가 죽는다. 없는 값은 0 이 아니라 "기록되지 않음"이므로
      // `—` 로 말한다.
      if (value == null) return "—";
      const cell =
        typeof value === "object"
          ? value
          : typeof value === "string"
            ? amountCell(value)
            : null;
      if (cell && !cell.valid) return "—";
      const scaled = (cell?.scaled ?? value) as bigint;
      const formatted = formatScaledMoney(
        scaled,
        FINANCE_DECIMAL_SCALE,
        amountCurrency,
        tag,
      );
      const prefix = amountCurrency ? `${amountCurrency} ` : "";
      return prefix && formatted.startsWith(prefix) ? formatted.slice(prefix.length) : formatted;
    },
    [currency, tag],
  );

  const points = useMemo(
    () => (settlementSeries && currency ? seriesForCurrency(settlementSeries, currency) : []),
    [currency, settlementSeries],
  );
  const gpPoints = useMemo(
    () => (currency && gpData ? gpForCurrency(gpData, currency) : []),
    [currency, gpData],
  );
  const kpis = useMemo(() => computeKpis(points), [points]);
  const gpKpi = useMemo(() => computeGpKpi(gpPoints), [gpPoints]);
  const topRows = useMemo(
    () =>
      topData && topCurrency
        ? joinTopCounterparties(
            topData.top,
            topData.topOverdue,
            topData.counterpartyGp,
            topData.status,
            topCurrency,
            TOP_DISPLAY_LIMIT,
          )
        : [],
    [topCurrency, topData],
  );
  const selectedTopRow =
    topRows.find((row) => `${row.counterparty}\u0000${row.currency}` === selectedTopKey) ?? null;

  // 조직 업무 TZ(응답 에코) 기준 "오늘" — 진행 중 달/마감 제안 판정 축.
  const orgToday = trustedOrgTodayISO(settlementSeries?.timezone);
  const closedPeriods = useMemo(
    () => new Set(closesData.map((close) => monthPeriodOf(close.period_start))),
    [closesData],
  );
  const closableProposal =
    orgToday && closesState.status === "ready" ? nextClosablePeriod(orgToday, closedPeriods) : null;
  const canCloseMonth = isManager;
  const inProgressPeriod = orgToday ? currentMonthPeriod(orgToday) : "—";
  const closableFromLabel = orgToday ? monthDay(firstOfNextMonthISO(orgToday)) : "—";

  // 액션 핸들러는 React Compiler 가 메모이즈 — 수동 useCallback 은 파생값
  // 의존성 때문에 보존 불가 판정을 받는다(react-hooks/preserve-manual-memoization).
  const announceToast = (message: string) => {
    toast.success(message);
  };

  const changeGranularity = (nextGranularity: Granularity) => {
    if (nextGranularity === granularity) return;

    const nextRange = rangesForGranularity(nextGranularity).includes(rangeMonths)
      ? rangeMonths
      : 12;

    reportsRefreshEventId.current += 1;
    reportsRefreshInFlightRef.current = false;
    setReportsRefreshing(false);
    settlementEventId.current += 1;
    gpEventId.current += 1;
    setSettlementState((prev) => ({ status: "loading", retained: retainedSettlement(prev) }));
    setGpState((prev) =>
      nextGranularity === "month"
        ? { status: "loading", retained: retainedCard(prev) }
        : { status: "ready", snapshot: snapshotOf(null) },
    );

    if (nextRange !== rangeMonths) {
      topEventId.current += 1;
      setTopState((prev) => ({ status: "loading", retained: retainedCard(prev) }));
      setSelectedTopKey(null);
      setRangeMonths(nextRange);
    }
    setGranularity(nextGranularity);
  };

  const changeRange = (nextRange: ReportRangeMonths) => {
    if (nextRange === rangeMonths) return;

    reportsRefreshEventId.current += 1;
    reportsRefreshInFlightRef.current = false;
    setReportsRefreshing(false);
    settlementEventId.current += 1;
    gpEventId.current += 1;
    topEventId.current += 1;
    setSettlementState((prev) => ({ status: "loading", retained: retainedSettlement(prev) }));
    setGpState((prev) =>
      isMonth
        ? { status: "loading", retained: retainedCard(prev) }
        : { status: "ready", snapshot: snapshotOf(null) },
    );
    setTopState((prev) => ({ status: "loading", retained: retainedCard(prev) }));
    setSelectedTopKey(null);
    setRangeMonths(nextRange);
  };

  // FE#760 — assignee 는 통화 선택과 달리 서버 쿼리 파라미터라 재조회가 필요하다
  // (통화는 이미 받아온 다중 통화 응답을 클라이언트에서 고르는 것뿐). granularity/
  // rangeMonths 변경과 같은 자세: 로딩 전환은 여기서 동기로, fetch 는 effect 의존성 변경에 맡긴다.
  // backend#1183/BE PR #1185 이후 counterparty-top/-gp 도 assignee 를 받으므로
  // (docs/backend-followups.md 기록 갱신), settlement/gp 와 동일하게 topEventId 를
  // 함께 끊고 Top-N 카드도 로딩으로 전환한다 — changeRange 와 같은 자세
  // (row 신원이 바뀌므로 selectedTopKey 도 함께 비운다).
  const changeAssignee = (nextValue: string) => {
    const nextAssignee = nextValue === ASSIGNEE_ALL ? null : nextValue;
    if (nextAssignee === assigneeFilter) return;

    reportsRefreshEventId.current += 1;
    reportsRefreshInFlightRef.current = false;
    setReportsRefreshing(false);
    settlementEventId.current += 1;
    gpEventId.current += 1;
    topEventId.current += 1;
    setSettlementState((prev) => ({ status: "loading", retained: retainedSettlement(prev) }));
    setGpState((prev) =>
      isMonth
        ? { status: "loading", retained: retainedCard(prev) }
        : { status: "ready", snapshot: snapshotOf(null) },
    );
    setTopState((prev) => ({ status: "loading", retained: retainedCard(prev) }));
    setSelectedTopKey(null);
    setAssigneeFilter(nextAssignee);
  };

  const retrySettlement = async (): Promise<void> => {
    const eventId = settlementEventId.current + 1;
    settlementEventId.current = eventId;
    const sessionId = sessionEventId.current;
    const isCurrent = () =>
      sessionEventId.current === sessionId && settlementEventId.current === eventId;
    const { from, to } = computeRange(localTodayISO(), rangeMonths);
    const requestKey = settlementRequestKey(granularity, from, to, assigneeFilter);
    setSettlementState((prev) => ({ status: "loading", retained: retainedSettlement(prev) }));
    await withGenerationRetry(isCurrent, () =>
      getSettlementSeries(
        { granularity, from, to, ...(assigneeFilter ? { assignee: assigneeFilter } : {}) },
        getIdToken,
      ),
    )
      .then((nextSeries) => {
        if (!isCurrent()) return;
        setSettlementState((prev) => readySettlementState(prev, nextSeries, requestKey));
      })
      .catch((error) => {
        if (!isCurrent()) return;
        setSettlementState((prev) => settlementFailureState(error, prev));
      });
  };

  const retryGp = async (): Promise<void> => {
    if (!isMonth) return;
    const eventId = gpEventId.current + 1;
    gpEventId.current = eventId;
    const sessionId = sessionEventId.current;
    const isCurrent = () => sessionEventId.current === sessionId && gpEventId.current === eventId;
    const { from, to } = computeRange(localTodayISO(), rangeMonths);
    const requestKey = gpRequestKey(from, to, assigneeFilter);
    setGpState((prev) => ({ status: "loading", retained: retainedCard(prev) }));
    await withGenerationRetry(isCurrent, () =>
      getGpSeries({ from, to, ...(assigneeFilter ? { assignee: assigneeFilter } : {}) }, getIdToken),
    )
      .then((gp) => {
        if (!isCurrent()) return;
        setGpState((prev) => readyCardState(prev, gp, gp?.data_as_of, requestKey));
      })
      .catch(() => {
        if (!isCurrent()) return;
        setGpState((prev) => ({ status: "error", retained: retainedCard(prev) }));
      });
  };

  const retryTop = async (): Promise<void> => {
    // 범위 밖 카드에는 재시도 자체가 없다(아래 렌더에서 실패 상태를 그리지 않는다).
    if (!isManager) return;
    const eventId = topEventId.current + 1;
    topEventId.current = eventId;
    const sessionId = sessionEventId.current;
    const isCurrent = () => sessionEventId.current === sessionId && topEventId.current === eventId;
    const { from, to } = computeRange(localTodayISO(), rangeMonths);
    setTopState((prev) => ({ status: "loading", retained: retainedCard(prev) }));
    setSelectedTopKey(null);
    await withGenerationRetry(isCurrent, () =>
      getCounterpartyCardData(from, to, assigneeFilter, getIdToken),
    )
      .then((top) => {
        if (!isCurrent()) return;
        setTopState({ status: "ready", snapshot: snapshotOf(top) });
      })
      .catch((error) => {
        if (!isCurrent()) return;
        if (isForbiddenError(error)) {
          setTopState({ status: "forbidden" });
          return;
        }
        setTopState((prev) => ({ status: "error", retained: retainedCard(prev) }));
      });
  };

  const retryCloses = async (): Promise<void> => {
    const eventId = closesEventId.current + 1;
    closesEventId.current = eventId;
    const sessionId = sessionEventId.current;
    const isCurrent = () =>
      sessionEventId.current === sessionId && closesEventId.current === eventId;
    setClosesState((prev) => ({ status: "loading", retained: retainedCard(prev) }));
    await withGenerationRetry(isCurrent, () =>
      listMonthCloses({ limit: MONTH_CLOSE_LOOKBACK_MONTHS }, getIdToken),
    )
      .then((closes) => {
        if (!isCurrent()) return;
        setClosesState({ status: "ready", snapshot: snapshotOf(closes.items ?? []) });
      })
      .catch(() => {
        if (!isCurrent()) return;
        setClosesState((prev) => ({ status: "error", retained: retainedCard(prev) }));
      });
  };

  const refreshReports = async () => {
    if (reportsRefreshInFlightRef.current) return;
    const refreshEventId = reportsRefreshEventId.current + 1;
    reportsRefreshEventId.current = refreshEventId;
    reportsRefreshInFlightRef.current = true;
    setReportsRefreshing(true);
    try {
      await Promise.all([retrySettlement(), retryGp(), retryTop(), retryCloses()]);
    } finally {
      if (reportsRefreshEventId.current === refreshEventId) {
        reportsRefreshInFlightRef.current = false;
        setReportsRefreshing(false);
      }
    }
  };

  const refreshCloses = async (sessionId: number) => {
    const eventId = closesEventId.current + 1;
    closesEventId.current = eventId;
    const closes = await listMonthCloses({ limit: MONTH_CLOSE_LOOKBACK_MONTHS }, getIdToken);
    if (sessionEventId.current !== sessionId || closesEventId.current !== eventId) return;
    setClosesState({ status: "ready", snapshot: snapshotOf(closes.items ?? []) });
  };

  const submitClose = async () => {
    if (!closableProposal || closeSubmitting) return;
    const sessionId = sessionEventId.current;
    setCloseSubmitting(true);
    setCloseError(null);
    try {
      await closeMonth(
        { period: closableProposal, ...(closeNote.trim() ? { note: closeNote.trim() } : {}) },
        getIdToken,
      );
      if (sessionEventId.current !== sessionId) return;
      setCloseDialogOpen(false);
      setCloseNote("");
      announceToast(replaceTokens(copy.closes.successToast, { period: closableProposal }));
      await refreshCloses(sessionId).catch(() => {});
    } catch (err) {
      if (sessionEventId.current !== sessionId) return;
      if (err instanceof ApiError) {
        if (err.status === 409 || err.code === "ERP_REPORTS_ALREADY_CLOSED") {
          setCloseError(replaceTokens(copy.closes.errorAlreadyClosed, { period: closableProposal }));
        } else if (err.status === 403) {
          setCloseError(copy.closes.errorRoleForbidden);
        } else if (err.status === 400) {
          setCloseError(copy.closes.errorMonthOpen);
        } else {
          setCloseError(copy.closes.errorGeneric);
        }
      } else {
        setCloseError(copy.closes.errorGeneric);
      }
    } finally {
      if (sessionEventId.current === sessionId) setCloseSubmitting(false);
    }
  };

  // FS-05 §4 「과거 월 수정이 필요한 경우 Owner/Admin이 영향 안내를 확인하고 사유를
  // 입력해 재개방한다. 재마감 전에는 `재개방됨`을 표시한다.」
  const submitReopen = async () => {
    const target = reopenTarget;
    const reason = reopenReason.trim();
    if (!target || reopenSubmitting) return;
    const period = monthPeriodOf(target.period_start);
    if (!reason) {
      setReopenError(copy.closes.errorReopenReasonRequired);
      return;
    }
    const sessionId = sessionEventId.current;
    setReopenSubmitting(true);
    setReopenError(null);
    try {
      await reopenMonthClose(target.id, { reason }, getIdToken);
      if (sessionEventId.current !== sessionId) return;
      setReopenTarget(null);
      setReopenReason("");
      announceToast(replaceTokens(copy.closes.reopenSuccessToast, { period }));
      await refreshCloses(sessionId).catch(() => {});
    } catch (err) {
      if (sessionEventId.current !== sessionId) return;
      if (err instanceof ApiError) {
        if (err.status === 403) {
          setReopenError(copy.closes.errorRoleForbidden);
        } else if (err.status === 409) {
          // BE 는 이미 재개방된 달을 409 로 거절한다 — 첫 재개방의 사유·행위자를 지키기 위해서다.
          setReopenError(replaceTokens(copy.closes.errorAlreadyReopened, { period }));
        } else if (err.status === 400) {
          setReopenError(copy.closes.errorReopenReasonRequired);
        } else {
          setReopenError(copy.closes.errorReopenGeneric);
        }
      } else {
        setReopenError(copy.closes.errorReopenGeneric);
      }
    } finally {
      if (sessionEventId.current === sessionId) setReopenSubmitting(false);
    }
  };

  const openSnapshot = (close: MonthClose) => {
    const period = monthPeriodOf(close.period_start);
    const sessionId = sessionEventId.current;
    const eventId = snapshotEventId.current + 1;
    snapshotEventId.current = eventId;
    setSnapshotState({ status: "loading", period });
    getMonthClose(close.id, getIdToken)
      .then((full) => {
        if (sessionEventId.current !== sessionId || snapshotEventId.current !== eventId) return;
        setSnapshotState((prev) =>
          prev.status === "loading" && prev.period === period
            ? { status: "ready", period, close: full }
            : prev,
        );
      })
      .catch(() => {
        if (sessionEventId.current !== sessionId || snapshotEventId.current !== eventId) return;
        setSnapshotState((prev) =>
          prev.status === "loading" && prev.period === period ? { status: "error", period } : prev,
        );
      });
  };

  const closeSnapshot = () => {
    snapshotEventId.current += 1;
    setSnapshotState({ status: "closed" });
  };

  // ── 상태 화면 ──
  // erp-v2-adapt: begin — QA-1352 keeps plan, subscription, billing, and role guidance distinct.
  if (settlementState.status === "gated") {
    return (
      <section
        data-component="ReportsConnected"
        data-reason={settlementState.reason}
        data-state="gated"
        role="alert"
      >
        {renderHeader?.(null)}
        <InsightsGateNotice copy={copy} reason={settlementState.reason} />
      </section>
    );
  }
  // erp-v2-adapt: end


  const currencyLabel = currency ?? "";
  const latest = kpis.latest;
  const latestLabel = latest ? periodShortLabel(latest.periodStart) : "";
  const prevLabel = kpis.previous ? periodShortLabel(kpis.previous.periodStart) : "";
  const gpLatestLabel = gpKpi.latest ? monthName(gpKpi.latest.periodStart) : "";
  const gpPrevLabel = gpKpi.previous ? monthName(gpKpi.previous.periodStart) : "";
  const showGp = isMonth;

  const gpExclusion = gpWindowExclusion(gpData, copy.charts.gp);
  // FS-05-01 §4 deal_count(포함 Deal 수) — 분모를 지어내지 않는다(#436 기대표, #759).
  const gpBasisText = gpKpiBasisText(gpKpi.latest, copy.kpi);
  const gpCautionText = gpKpiCautionText(gpKpi.latest, copy.kpi);

  const maxTopAmount = topRows.length > 0 ? Math.max(...topRows.map((r) => r.amount.approx)) : 0;
  const reportsLoading =
    settlementState.status === "loading" ||
    gpState.status === "loading" ||
    // 범위 밖 카드는 영원히 loading 으로 남으므로 전체 로딩 판정에서 제외한다.
    (!topForbidden && topState.status === "loading") ||
    closesState.status === "loading";
  const reportsRefreshDisabled = reportsRefreshing || reportsLoading;

  // FE#760 — FS-17 조회 조건의 네 번째 값(전체 담당자·특정 담당자). member 는
  // BE 가 요청을 조용히 본인으로 덮어쓰므로(위 isManager 주석) owner/admin 에게만
  // 노출한다 — 그 외 역할에는 이 목록 자체를 만들 필요가 없다.
  const assigneeOptions = isManager
    ? [
        { value: ASSIGNEE_ALL, label: copy.controls.assigneeAll },
        ...members
          .map((member) => ({ value: member.user_id, label: memberLabel(member) }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      ]
    : [];

  const settlementEmpty = settlementSnapshot != null && settlementCurrencies.length === 0;

  const summary = settlementState.status !== "loading" && !settlementEmpty && (settlementState.status !== "error" || settlementSnapshot != null) ? (
<div
            className={cx(
              "grid gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1",
              showGp && gpKpi.latest ? "grid-cols-7" : "grid-cols-6",
            )}
            data-ui="reports-kpis"
          >
            <KpiTile
              label={replaceTokens(copy.kpi.receivableDue, { period: latestLabel, currency: currencyLabel })}
              value={latest ? fmtAmount(latest.planned) : "—"}
              delta={
                kpis.plannedDeltaPctTenths != null
                  ? {
                      text: replaceTokens(copy.kpi.deltaVs, {
                        delta: fmtTenthsPct(kpis.plannedDeltaPctTenths, true),
                        period: prevLabel,
                      }),
                      tone:
                        kpis.plannedDeltaPctTenths > BigInt(0)
                          ? "up"
                          : kpis.plannedDeltaPctTenths < BigInt(0)
                            ? "bad"
                            : "flat",
                    }
                  : null
              }
            />
            {/* FS-05-01 §4 payable_due — receivableDue 의 지급 측 대응값(#759, 편향된 받을 돈 단일 시야 해소). */}
            <KpiTile
              label={replaceTokens(copy.kpi.payableDue, { period: latestLabel, currency: currencyLabel })}
              value={latest ? fmtAmount(latest.payableDue) : "—"}
              delta={
                kpis.payableDueDeltaPctTenths != null
                  ? {
                      text: replaceTokens(copy.kpi.deltaVs, {
                        delta: fmtTenthsPct(kpis.payableDueDeltaPctTenths, true),
                        period: prevLabel,
                      }),
                      // 지급 예정 증감은 사업 맥락에 따라 좋고 나쁨이 갈린다 — 색으로 단정하지 않는다.
                      tone: "flat",
                    }
                  : null
              }
            />
            <KpiTile
              label={replaceTokens(copy.kpi.received, { period: latestLabel, currency: currencyLabel })}
              value={latest ? fmtAmount(latest.received) : "—"}
              delta={
                kpis.receivedRatioPctTenths != null
                  ? {
                      text: replaceTokens(copy.kpi.receivedRatio, {
                        ratio: fmtTenthsPct(kpis.receivedRatioPctTenths),
                      }),
                      tone: "flat",
                    }
                  : null
              }
            />
            {/* FS-05-01 §4 paid_out — received 의 지급 측 대응값(#759). */}
            <KpiTile
              label={replaceTokens(copy.kpi.paidOut, { period: latestLabel, currency: currencyLabel })}
              value={latest ? fmtAmount(latest.paidOut) : "—"}
              delta={
                kpis.paidOutRatioPctTenths != null
                  ? {
                      text: replaceTokens(copy.kpi.paidOutRatio, {
                        ratio: fmtTenthsPct(kpis.paidOutRatioPctTenths),
                      }),
                      tone: "flat",
                    }
                  : null
              }
            />
            {showGp && gpKpi.latest ? (
              <KpiTile
                label={replaceTokens(copy.kpi.gp, { period: gpLatestLabel, currency: currencyLabel })}
                value={fmtAmount(gpKpi.latest.gp)}
                delta={
                  gpKpi.marginPermyriad != null
                    ? {
                        text:
                          gpKpi.marginDeltaPermyriad != null
                            ? replaceTokens(copy.kpi.gpDetail, {
                                margin: fmtRatioPct(gpKpi.marginPermyriad),
                                delta: fmtSignedPp(gpKpi.marginDeltaPermyriad),
                                period: gpPrevLabel,
                              })
                            : replaceTokens(copy.kpi.gpMarginOnly, {
                                margin: fmtRatioPct(gpKpi.marginPermyriad),
                              }),
                        tone:
                          gpKpi.marginDeltaPermyriad != null
                            ? gpKpi.marginDeltaPermyriad > BigInt(0)
                              ? "up"
                              : gpKpi.marginDeltaPermyriad < BigInt(0)
                                ? "bad"
                                : "flat"
                            : "flat",
                      }
                    : null
                }
                basis={gpBasisText}
                caution={gpCautionText}
              />
            ) : null}
            <KpiTile
              label={replaceTokens(copy.kpi.outstanding, { currency: currencyLabel })}
              value={latest ? fmtAmount(latest.receivableEnd) : "—"}
              delta={
                kpis.outstandingDeltaPctTenths != null
                  ? {
                      text: replaceTokens(copy.kpi.deltaVsEnd, {
                        delta: fmtTenthsPct(kpis.outstandingDeltaPctTenths, true),
                        period: prevLabel,
                      }),
                      // 미수 잔액 증가 = 리스크(레드), 감소 = 개선(그린).
                      tone:
                        kpis.outstandingDeltaPctTenths > BigInt(0)
                          ? "bad"
                          : kpis.outstandingDeltaPctTenths < BigInt(0)
                            ? "up"
                            : "flat",
                    }
                  : null
              }
            />
            <KpiTile
              label={copy.kpi.overdueRate}
              value={
                latest
                  ? latest.overduePermyriad == null
                    ? copy.ratioUnavailable
                    : fmtRatioPct(latest.overduePermyriad)
                  : "—"
              }
              delta={
                kpis.overdueDeltaPermyriad != null
                  ? {
                      text: replaceTokens(copy.kpi.deltaVsEnd, {
                        delta: fmtSignedPp(kpis.overdueDeltaPermyriad),
                        period: prevLabel,
                      }),
                      tone:
                        kpis.overdueDeltaPermyriad > BigInt(0)
                          ? "bad"
                          : kpis.overdueDeltaPermyriad < BigInt(0)
                            ? "up"
                            : "flat",
                    }
                  : null
              }
              // FS-05-01 §4 overdue_receivable_end — 연체율(overdue_rate_end)의 분자 금액(#759).
              basis={
                latest
                  ? replaceTokens(copy.kpi.overdueReceivableBasis, {
                      amount: fmtAmount(latest.overdueReceivableEnd),
                      currency: currencyLabel,
                    })
                  : null
              }
            />
          </div>
  ) : undefined;

  const controls = (
    <BusinessListToolbar
      data-ui="reports-controls"
      aria-label="결산 리포트 필터"
      actions={
        <>
          {settlementState.status !== "error" ? (
            <Button
              aria-label={copy.refresh}
              aria-busy={reportsRefreshDisabled}
              data-ui="reports-refresh"
              disabled={reportsRefreshDisabled}
              onClick={() => void refreshReports()}
              size="sm"
              type="button"
              variant="tertiary"
            >
              {reportsRefreshDisabled ? copy.loading : copy.refresh}
            </Button>
          ) : null}

          {canCloseMonth && closableProposal ? (
            <Button
              data-ui="reports-close-button"
              onClick={() => {
                setCloseError(null)
                setCloseDialogOpen(true)
              }}
              size="md"
              type="button"
              variant="primary"
            >
              {replaceTokens(copy.closes.closeButton, {
                period: closableProposal,
              })}
            </Button>
          ) : null}
        </>
      }
      result={
        <span
          className="text-label-12 text-text-disabled"
          data-ui="reports-close-note"
        >
          {replaceTokens(copy.closes.controlsNote, {
            period: inProgressPeriod,
            date: closableFromLabel,
          })}
        </span>
      }
    >
      <BusinessFilterField label={copy.controls.granularityAria}>
        <Segmented
          ariaLabel={copy.controls.granularityAria}
          options={[
            { id: "month", label: copy.controls.month },
            { id: "week", label: copy.controls.week },
          ]}
          value={granularity}
          onChange={(id) => changeGranularity(id as Granularity)}
        />
      </BusinessFilterField>
      <BusinessFilterField label={copy.controls.rangeAria}>
        <Segmented
          ariaLabel={copy.controls.rangeAria}
          options={rangesForGranularity(granularity).map((months) => ({
            id: String(months),
            label: replaceTokens(copy.controls.rangeMonths, {
              count: String(months),
            }),
          }))}
          value={String(rangeMonths)}
          onChange={(id) => changeRange(Number(id) as ReportRangeMonths)}
        />
      </BusinessFilterField>
      {currencies.length > 0 ? (
        <BusinessFilterSelect
          label={copy.controls.currencyAria}
          options={currencies.map((ccy) => ({ value: ccy, label: ccy }))}
          value={currency ?? ""}
          onValueChange={setCurrencyChoice}
        />
      ) : null}
      {isManager ? (
        <BusinessFilterField
          label={copy.controls.assigneeAria}
          data-ui="reports-assignee-filter"
        >
          <Select
            aria-label={copy.controls.assigneeAria}
            onValueChange={(value) => changeAssignee(value)}
            options={assigneeOptions}
            placeholder={copy.controls.assigneeAll}
            size="sm"
            value={assigneeFilter ?? ASSIGNEE_ALL}
          />
        </BusinessFilterField>
      ) : null}
    </BusinessListToolbar>
  )

  // 페이지 empty는 primary settlement-series만 판정한다. 보조 카드는 각자 상태를 렌더한다.

  /**
   * 실패 카드가 표시 중인 값이 언제 기준인지 알린다(SC-24 QA "카드별 기준시각").
   * 서버가 집계 시각을 실어 준 카드만 `기준` 이라고 말하고, 수신 시각으로 근사한
   * 카드는 `불러온` 이라고 말한다 — 근사값을 서버 기준값으로 포장하지 않는다.
   */
  const staleNotice = (snapshot: CardSnapshot<unknown>) =>
    replaceTokens(snapshot.serverStamped ? copy.staleNotice : copy.staleNoticeFetched, {
      time: formatDateTime(new Date(snapshot.loadedAt), tag),
    });

  return (
    <div
      className="flex flex-col gap-4"
      data-component="ReportsConnected"
      data-state={settlementState.status}
    >
      {renderHeader ? renderHeader(controls, summary) : controls}

      {settlementState.status === "error" && settlementSnapshot ? (
        <CardStaleNotice
          message={staleNotice(settlementSnapshot)}
          onRetry={retrySettlement}
          retryLabel={copy.retry}
        />
      ) : null}

      {settlementState.status === "loading" ? (
        <div className="grid gap-4" data-ui="reports-settlement-loading">
          <AnalyticsSkeleton kind="reports" label={copy.loading} metricsOnly />
        </div>
      ) : settlementState.status === "error" && settlementSnapshot == null ? (
        <section
          className="flex flex-col items-start gap-3"
          data-ui="reports-settlement-error"
          role="alert"
        >
          <InfoBox
            tone="risk"
            title={copy.errorTitle}
            description={settlementState.message ?? copy.loadFailed}
          />
          <Button
            onClick={retrySettlement}
            size="md"
            type="button"
            variant="tertiary"
          >
            {copy.retry}
          </Button>
        </section>
      ) : settlementEmpty ? (
        <InfoBox tone="neutral" title={copy.emptyTitle} description={copy.emptyBody} />
      ) : (
        <>
          {/* ── KPI 7타일 (주 단위에서는 GP 타일 숨김 — GP 는 월 축 전용) — 받을 돈/지급할 돈 양측 노출(#759) ── */}
          {!renderHeader && summary}
        </>
      )}

          {/* ── 본문 그리드: 좌 차트 컬럼 / 우 Top·월마감 ── */}
          <div className="grid items-start gap-4 grid-cols-[minmax(0,1.9fr)_minmax(0,1.1fr)] max-lg:grid-cols-1">
            <div className="grid min-w-0 gap-4">
              {/* 수취 계획 vs AR 적용액 */}
              {settlementSnapshot != null && !settlementEmpty ? (
                <ReportCard
                title={copy.charts.planVsActual.title}
                sub={replaceTokens(isMonth ? copy.charts.planVsActual.subMonth : copy.charts.planVsActual.subWeek, {
                  currency: currencyLabel,
                })}
              >
                <div className="mb-1 mt-2.5 flex gap-3.5 text-body-13 text-text-secondary">
                  <LegendKey swatchClass="bg-ecoya-blue-9" label={copy.charts.planVsActual.planned} />
                  <LegendKey swatchClass="bg-ecoya-accent" label={copy.charts.planVsActual.received} />
                </div>
                {points.some((point) => point.fxConversionState === "환산 불가") ? (
                  <p className="mt-2 text-body-13 font-medium text-status-danger" data-ui="reports-fx-unconvertible">
                    {replaceTokens(copy.charts.fxConversionState, { state: "환산 불가" })}
                  </p>
                ) : null}
                <PlanActualBarChart
                  ariaLabel={copy.charts.planVsActual.aria}
                  formatAxisValue={fmtCompact}
                  points={points.map((p) => ({
                    key: p.periodStart,
                    xLabel: axisLabel(p.periodStart),
                    planned: p.planned.approx,
                    received: p.received.approx,
                    tooltip: (
                      <>
                        <span className="font-bold">{tooltipTitle(p.periodStart)}</span>
                        <br />
                        {copy.charts.planVsActual.planned} {fmtAmount(p.planned)} {currencyLabel}
                        <br />
                        {copy.charts.planVsActual.received} {fmtAmount(p.received)} {currencyLabel}
                        {p.fxConversionState === "환산 불가" ? (
                          <>
                            <br />
                            {replaceTokens(copy.charts.fxConversionState, {
                              state: p.fxConversionState,
                            })}
                          </>
                        ) : p.fxConversionEvidence ? (
                          <>
                            <br />
                            {fxEvidenceLine(p.fxConversionEvidence)}
                          </>
                        ) : null}
                      </>
                    ),
                  }))}
                />
                </ReportCard>
              ) : null}

              {/* 월별 GP — 주 단위 선택 시 카드 자체를 숨김 (GP 는 월 축 전용) */}
              {showGp ? (
                <ReportCard
                  title={copy.charts.gp.title}
                  sub={
                    <>
                      {replaceTokens(copy.charts.gp.sub, { currency: currencyLabel })}
                      {gpExclusion.text ? (
                        <>
                          {" — "}
                          <span
                            className={gpExclusion.unknown ? "text-text-muted" : "text-status-danger"}
                            data-ui={
                              gpExclusion.unknown ? "reports-gp-excluded-unknown" : "reports-gp-excluded"
                            }
                          >
                            {gpExclusion.text}
                          </span>
                          {gpExclusion.unknown ? null : (
                            <>
                              {" "}
                              {copy.charts.gp.excludedWindowNote}
                              {gpExclusion.mixedPresent ? (
                                <>
                                  {" "}
                                  {copy.charts.gp.excludedSuffix}
                                </>
                              ) : null}
                            </>
                          )}
                        </>
                      ) : null}
                    </>
                  }
                >
                  {gpState.status === "error" && gpSnapshot ? (
                    <CardStaleNotice
                      message={staleNotice(gpSnapshot)}
                      onRetry={retryGp}
                      retryLabel={copy.retry}
                    />
                  ) : null}
                  {gpState.status === "loading" ? (
                    <SkeletonList label={copy.loading} rows={3} />
                  ) : gpState.status === "error" && gpSnapshot == null ? (
                    <CardLoadError
                      message={copy.cardLoadFailed}
                      onRetry={retryGp}
                      retryLabel={copy.retry}
                    />
                  ) : gpPoints.every((point) => !point.hasData) ? (
                    <p className="mt-3 text-body-13 text-text-muted" data-ui="reports-gp-empty">
                      {copy.charts.noData}
                    </p>
                  ) : (
                    <>
                    {gpPoints.some((point) => point.fxConversionState === "환산 불가") ? (
                    <p className="mt-2 text-body-13 font-medium text-status-danger" data-ui="reports-gp-fx-unconvertible">
                      {replaceTokens(copy.charts.fxConversionState, { state: "환산 불가" })}
                    </p>
                  ) : null}
                    <GpBarChart
                      ariaLabel={copy.charts.gp.aria}
                      formatAxisValue={(value: bigint) =>
                        formatScaledMoney(value, FINANCE_DECIMAL_SCALE, currency, tag)
                      }
                      formatBarLabel={(value: bigint) =>
                        formatScaledMoney(value, FINANCE_DECIMAL_SCALE, currency, tag)
                      }
                      points={gpPoints.map((p) => ({
                        key: p.periodStart,
                        xLabel: axisLabel(p.periodStart),
                        gp: p.gp.scaled,
                        hasData: p.hasData,
                        tooltip: p.hasData ? (
                          <>
                            <span className="font-bold">{tooltipTitle(p.periodStart)}</span>
                            <br />
                            {copy.charts.gp.gpLabel} {fmtAmount(p.gp)} {currencyLabel}
                            {p.marginPermyriad != null ? (
                              <>
                                <br />
                                {copy.charts.gp.marginLabel} {fmtRatioPct(p.marginPermyriad)}
                              </>
                            ) : null}
                            {p.fxConversionState === "환산 불가" ? (
                              <>
                                <br />
                                {replaceTokens(copy.charts.fxConversionState, {
                                  state: p.fxConversionState,
                                })}
                              </>
                            ) : p.fxConversionEvidence ? (
                              <>
                                <br />
                                {fxEvidenceLine(p.fxConversionEvidence)}
                              </>
                            ) : null}
                          </>
                        ) : (
                          <>
                            <span className="font-bold">{tooltipTitle(p.periodStart)}</span>
                            <br />
                            {copy.charts.noData}
                          </>
                        ),
                      }))}
                    />
                    </>
                  )}
                </ReportCard>
              ) : null}

              {settlementSnapshot != null && !settlementEmpty ? (
                <>
              {/* 기말 잔액 추세 */}
              <ReportCard
                title={copy.charts.balance.title}
                sub={replaceTokens(isMonth ? copy.charts.balance.subMonth : copy.charts.balance.subWeek, {
                  currency: currencyLabel,
                })}
              >
                <div className="mb-1 mt-2.5 flex gap-3.5 text-body-13 text-text-secondary">
                  <LegendKey lineClass="bg-ecoya-accent" label={copy.charts.balance.receivable} />
                  <LegendKey lineClass="bg-ecoya-system-orange-1" label={copy.charts.balance.payable} />
                </div>
                <BalanceLineChart
                  ariaLabel={copy.charts.balance.aria}
                  formatAxisValue={fmtCompact}
                  formatEndLabel={fmtCompact}
                  points={points.map((p) => ({
                    key: p.periodStart,
                    xLabel: axisLabel(p.periodStart),
                    receivable: p.receivableEnd.approx,
                    payable: p.payableEnd.approx,
                    tooltip: (
                      <>
                        <span className="font-bold">
                          {replaceTokens(copy.charts.periodEnd, { period: tooltipTitle(p.periodStart) })}
                        </span>
                        <br />
                        {copy.charts.balance.receivableShort} {fmtAmount(p.receivableEnd)} {currencyLabel}
                        <br />
                        {copy.charts.balance.payableShort} {fmtAmount(p.payableEnd)} {currencyLabel}
                        {p.fxConversionState === "환산 불가" ? (
                          <>
                            <br />
                            {replaceTokens(copy.charts.fxConversionState, {
                              state: p.fxConversionState,
                            })}
                          </>
                        ) : p.fxConversionEvidence ? (
                          <>
                            <br />
                            {fxEvidenceLine(p.fxConversionEvidence)}
                          </>
                        ) : null}
                      </>
                    ),
                  }))}
                />
              </ReportCard>

              {/* 연체율 */}
              <ReportCard title={copy.charts.overdue.title} sub={copy.charts.overdue.sub}>
                <OverdueRateChart
                  ariaLabel={copy.charts.overdue.aria}
                  formatAxisValue={(v) =>
                    // niceCeil 이 0.5·1.25 같은 분수 눈금을 만든다 — 정수 반올림 금지.
                    `${formatNumber(v, tag, { maximumFractionDigits: 2 })}%`
                  }
                  formatEndLabel={fmtPct}
                  emptyMessage={copy.ratioUnavailable}
                  points={points.flatMap((p) =>
                    p.overduePermyriad == null
                      ? []
                      : [{
                          key: p.periodStart,
                          xLabel: axisLabel(p.periodStart),
                          rate: Number(p.overduePermyriad) / 100,
                          tooltip: (
                            <>
                              <span className="font-bold">
                                {replaceTokens(copy.charts.periodEnd, { period: tooltipTitle(p.periodStart) })}
                              </span>
                              <br />
                              {copy.charts.overdue.rateLabel} {fmtRatioPct(p.overduePermyriad)}
                              <br />
                              {/* FS-05-01 §4 overdue_receivable_end — 연체율의 분자 금액을 시계열로도 노출(#759). */}
                              {copy.charts.overdue.amountLabel} {fmtAmount(p.overdueReceivableEnd)} {currencyLabel}
                            </>
                          ),
                        }],
                  )}
                />
                  </ReportCard>
                </>
              ) : null}
            </div>

            <div className="grid min-w-0 gap-4">
              {/* 고객사 Top 5 */}
              <ReportCard
                title={copy.topn.title}
                sub={replaceTokens(copy.topn.sub, {
                  months: String(rangeMonths),
                  currency: topCurrency ?? "",
                })}
              >
                {!topForbidden && topState.status === "error" && topSnapshot ? (
                  <CardStaleNotice
                    message={staleNotice(topSnapshot)}
                    onRetry={retryTop}
                    retryLabel={copy.retry}
                  />
                ) : null}
                {topForbidden ? (
                  // SC-24 §접근: Member 는 거래처명·마진·원천 행을 제외한 직재
                  // 집계만 본다. 실패가 아니라 범위 밖이므로 중립·설명형이다.
                  <InfoBox
                    data-ui="reports-topn-forbidden"
                    description={copy.topn.noPermissionBody}
                    title={copy.topn.noPermissionTitle}
                    tone="neutral"
                  />
                ) : topState.status === "loading" ? (
                  <SkeletonList label={copy.loading} rows={4} />
                ) : topState.status === "error" && topSnapshot == null ? (
                  <CardLoadError
                    message={copy.cardLoadFailed}
                    onRetry={retryTop}
                    retryLabel={copy.retry}
                  />
                ) : topRows.length === 0 ? (
                  // FE#760 — backend#1183/BE PR #1185: an assignee-scoped Top-N
                  // legitimately returns 200 with items:[] ("이 담당자에게 데이터
                  // 없음"), not an error. Say so plainly instead of reusing the
                  // org-wide empty copy, which would read as "no data anywhere".
                  <p className="mt-3 text-body-13 text-text-muted" data-ui="reports-topn-empty">
                    {assigneeFilter != null ? copy.topn.emptyAssignee : copy.topn.empty}
                  </p>
                ) : (
                  <div className="mt-3.5 grid gap-2" data-ui="reports-topn">
                    {topRows.map((row, index) => {
                      const rowKey = `${row.counterparty}\u0000${row.currency}`;
                      const selected = Boolean(row.status) && selectedTopRow === row;
                      const evidenceId = `reports-topn-evidence-${index}`;
                      const overdueDisplay =
                        row.overdue == null
                          ? copy.topn.statusUnavailable
                          : `${fmtAmount(row.overdue, row.currency)} ${row.currency}`;
                      const content = (
                        <span className="grid gap-1">
                          <span className="flex justify-between text-body-13">
                            <span className="font-medium text-ecoya-gray-3">{row.counterparty}</span>
                            <span className="text-text-secondary tabular-nums">
                              {fmtAmount(row.amount, row.currency)} {row.currency}
                            </span>
                          </span>
                          <span className="rounded-r bg-surface-muted">
                            <span
                              className="block h-3.5 rounded-r bg-ecoya-accent"
                              style={{ width: `${maxTopAmount > 0 ? (row.amount.approx / maxTopAmount) * 100 : 0}%` }}
                            />
                          </span>
                          <span className="flex flex-wrap gap-2.5 text-body-13">
                            <span className="text-text-secondary tabular-nums">
                              {row.gp == null
                                ? copy.topn.gpUnavailable
                                : replaceTokens(copy.topn.gpLine, {
                                    gp: `${fmtAmount(row.gp, row.currency)} ${row.currency}`,
                                    margin:
                                      row.marginPermyriad != null
                                        ? fmtRatioPct(row.marginPermyriad)
                                        : "—",
                                  })}
                            </span>
                            {row.overdue == null || row.overdue.scaled > BigInt(0) ? (
                              <span className="text-status-danger tabular-nums">
                                {replaceTokens(copy.topn.overdueAmount, {
                                  amount: overdueDisplay,
                                })}
                              </span>
                            ) : null}
                          </span>
                          {row.fxConversionState === "환산 불가" ? (
                            <span
                              className="text-status-danger"
                              data-ui="reports-topn-fx-unconvertible"
                            >
                              {replaceTokens(copy.charts.fxConversionState, {
                                state: row.fxConversionState,
                              })}
                            </span>
                          ) : row.fxConversionEvidence ? (
                            <span className="text-text-muted" data-ui="reports-topn-fx-evidence">
                              {fxEvidenceLine(row.fxConversionEvidence)}
                            </span>
                          ) : null}
                          <span
                            className="text-body-13 text-text-muted"
                            data-ui="reports-topn-status"
                          >
                            {row.status
                              ? replaceTokens(copy.topn.statusLine, {
                                  active: String(row.status.activeDeals),
                                  shipments: String(row.status.upcomingShipments),
                                  documents: String(row.status.recentDocs),
                                })
                              : copy.topn.statusUnavailable}
                          </span>
                          {row.status ? (
                            <span
                              className="mt-1 rounded-md border border-border-subtle bg-surface-card px-2 py-1.5 text-body-13 text-text-secondary"
                              data-ui="reports-topn-evidence"
                              id={evidenceId}
                              hidden={!selected}
                            >
                              {replaceTokens(copy.topn.statusEvidence, {
                                date: topData ? monthDay(topData.status.as_of) : "—",
                                outstanding: `${fmtAmount(row.status.outstanding, row.currency)} ${row.currency}`,
                                overdue: overdueDisplay,
                                nextDue: row.status.nextDueDate
                                  ? `${monthDay(row.status.nextDueDate)} · ${fmtAmount(
                                      row.status.nextDueAmount,
                                      row.currency,
                                    )} ${row.currency}`
                                  : "—",
                                lastActivity: row.status.lastActivity
                                  ? monthDay(row.status.lastActivity)
                                  : "—",
                              })}
                            </span>
                          ) : null}
                        </span>
                      );

                      // FE#760 원천 데이터 드릴다운 — 이 (거래처, 통화) 숫자를 만든
                      // 원장 행으로 이동한다. 기존 evidence 토글 Button 내부에 중첩하면
                      // <a> 가 <button> 안에 들어가는 무효 HTML 이 되므로, 항상 형제
                      // 엘리먼트로 둔다. row.status 유무와 무관하게 제공한다 — 상태
                      // 콕핏(counterparty-status)이 이 (거래처, 통화) 를 빠뜨렸다고
                      // 해서 그 거래처의 원장 행 자체가 없는 것은 아니다.
                      const drillLabel = replaceTokens(copy.topn.viewInSettlementAria, {
                        counterparty: row.counterparty,
                      });
                      const rowElement = row.status ? (
                        <Button
                          aria-controls={evidenceId}
                          aria-expanded={selected}
                          className={cx(
                            "flex h-auto w-full flex-col items-stretch justify-start overflow-visible whitespace-normal rounded-lg border px-2.5 py-2 text-left font-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ecoya-blue-3",
                            selected
                              ? "border-ecoya-accent bg-accent-soft"
                              : "border-transparent hover:bg-surface-muted",
                          )}
                          data-ui="reports-topn-row"
                          onClick={() => setSelectedTopKey(selected ? null : rowKey)}
                          variant="ghost"
                        >
                          {content}
                        </Button>
                      ) : (
                        <div
                          className="rounded-lg border border-transparent px-2.5 py-2 text-left"
                          data-ui="reports-topn-row"
                        >
                          {content}
                        </div>
                      );

                      return (
                        <div key={rowKey} className="grid gap-1" data-ui="reports-topn-row-group">
                          {rowElement}
                          {/* Plain <a>, not next/link's <Link> or a <Button>+router.push:
                              <Link> schedules internal timers this file's fake-timer
                              backoff assertions (vi.getTimerCount()) cannot tolerate, and
                              a same-role <Button> collides with the many existing
                              getByRole("button", { name: /ACME GmbH/ }) row queries above
                              (this label also names the counterparty, by design — see
                              drillLabel). A full navigation to a different top-level ERP
                              section is an acceptable, honest tradeoff here. */}
                          <a
                            aria-label={drillLabel}
                            className="justify-self-start px-2.5 text-label-12 font-medium text-ecoya-accent hover:underline"
                            data-ui="reports-topn-drill"
                            href={settlementCounterpartyDrillHref(row.counterparty, row.currency)}
                          >
                            {copy.topn.viewInSettlement}
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ReportCard>

              {/* 월마감 */}
              <ReportCard title={copy.closes.title} sub={copy.closes.sub}>
                {closesState.status === "error" && closesSnapshot ? (
                  <CardStaleNotice
                    message={staleNotice(closesSnapshot)}
                    onRetry={retryCloses}
                    retryLabel={copy.retry}
                  />
                ) : null}
                {closesState.status === "loading" ? (
                  <SkeletonList label={copy.loading} rows={4} />
                ) : closesState.status === "error" && closesSnapshot == null ? (
                  <CardLoadError
                    message={copy.cardLoadFailed}
                    onRetry={retryCloses}
                    retryLabel={copy.retry}
                  />
                ) : (
                  <div className="mt-3 grid gap-2" data-ui="reports-closes">
                    {/* 진행 중 달 (dashed) */}
                    <div className="flex items-center gap-2.5 rounded-[10px] border border-dashed border-border px-3 py-2.5 text-body-13 text-text-disabled">
                      <span className="min-w-[66px] font-semibold tabular-nums">{inProgressPeriod}</span>
                      <span className="text-label-12">
                        {replaceTokens(copy.closes.inProgress, { date: closableFromLabel })}
                      </span>
                    </div>
                    {closesData.length === 0 ? (
                      <p className="text-body-13 text-text-muted">{copy.closes.empty}</p>
                    ) : (
                      closesData.map((close) => (
                        <div
                          key={close.id}
                          className="flex items-center gap-1 rounded-[10px] border border-border-muted pr-2 hover:bg-surface-muted"
                          data-reopened={close.reopened ? "true" : "false"}
                          data-ui="reports-close-row"
                        >
                          <button
                            type="button"
                            onClick={() => openSnapshot(close)}
                            className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-left text-body-13"
                            data-ui="reports-close-snapshot"
                          >
                            <span className="min-w-[66px] font-bold tabular-nums text-text-primary">
                              {monthPeriodOf(close.period_start)}
                            </span>
                            <span className="min-w-0 text-label-12 text-text-disabled">
                              {replaceTokens(copy.closes.closedMeta, {
                                name: closerLabel(close.closed_by, members),
                                date: monthDay(close.closed_at.slice(0, 10)),
                              })}
                              {/* OD-011: 재개방 중인 달에만 붙는 줄이다. BE `reopened` 는
                                  재마감되면 false 로 돌아가므로(backend `MonthClose.Reopened`
                                  — "True until the month is closed again") 재마감 뒤에는 이
                                  줄이 사라진다. 되돌린 사람·시각·사유의 감사 이력 자체는
                                  서버에 남고, 화면은 그것을 재마감 뒤까지 끌고 오지 않는다. */}
                              {close.reopened ? (
                                <span className="block" data-ui="reports-close-reopened-meta">
                                  {replaceTokens(copy.closes.reopenedMeta, {
                                    name: closerLabel(close.reopened_by ?? "", members),
                                    date: monthDay((close.reopened_at ?? "").slice(0, 10)),
                                  })}
                                  {close.reopen_reason?.trim()
                                    ? ` · ${replaceTokens(copy.closes.reopenReasonMeta, {
                                        reason: close.reopen_reason.trim(),
                                      })}`
                                    : ""}
                                </span>
                              ) : null}
                            </span>
                            {/* 재개방된 달은 숫자가 다시 움직인다 — `동결됨`이라고 말하면 안 된다. */}
                            <span
                              className={cx(
                                "ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-body-13 font-bold",
                                close.reopened
                                  ? "bg-status-warning-bg text-status-warning"
                                  : "bg-ecoya-blue-9 text-ecoya-indigo",
                              )}
                            >
                              {close.reopened ? copy.closes.reopened : copy.closes.frozen}
                            </span>
                          </button>
                          {canCloseMonth && !close.reopened ? (
                            <Button
                              aria-label={replaceTokens(copy.closes.reopenDialogTitle, {
                                period: monthPeriodOf(close.period_start),
                              })}
                              data-ui="reports-reopen-button"
                              onClick={() => {
                                setReopenError(null);
                                setReopenReason("");
                                setReopenTarget(close);
                              }}
                              size="sm"
                              type="button"
                              variant="tertiary"
                            >
                              {copy.closes.reopenButton}
                            </Button>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </ReportCard>
            </div>
          </div>

      {/* ── 월마감 확인 다이얼로그 ── */}
      {closableProposal ? (
        <Dialog
          className="max-w-[calc(100vw-2rem)]"
          closeLabel={copy.closes.dialogCloseLabel}
          open={closeDialogOpen}
          onOpenChange={setCloseDialogOpen}
          title={replaceTokens(copy.closes.dialogTitle, { period: closableProposal })}
          okText={copy.closes.confirm}
          cancelText={copy.closes.cancel}
          onOk={() => void submitClose()}
          onCancel={() => setCloseDialogOpen(false)}
          width={440}
        >
          <div className="flex flex-col gap-3">
            <p className="text-body-14 text-ecoya-gray-3">
              {replaceTokens(copy.closes.dialogBody, { period: closableProposal })}
            </p>
            <label className="flex flex-col gap-1 text-label-12 text-text-secondary">
              {copy.closes.noteLabel}
              <textarea
                className="min-h-20 rounded-md border border-border p-2 text-body-13 text-text-primary"
                maxLength={500}
                onChange={(event) => setCloseNote(event.target.value)}
                placeholder={copy.closes.notePlaceholder}
                value={closeNote}
              />
            </label>
            {closeError ? (
              <p className="text-body-13 text-status-danger" role="alert" data-ui="reports-close-error">
                {closeError}
              </p>
            ) : null}
          </div>
        </Dialog>
      ) : null}

      {/* ── 월마감 재개방 다이얼로그 (OD-011 — 영향 안내 + 필수 사유) ── */}
      {reopenTarget ? (
        <Dialog
          className="max-w-[calc(100vw-2rem)]"
          closeLabel={copy.closes.dialogCloseLabel}
          open
          onOpenChange={(open) => {
            if (!open) setReopenTarget(null);
          }}
          title={replaceTokens(copy.closes.reopenDialogTitle, {
            period: monthPeriodOf(reopenTarget.period_start),
          })}
          okText={copy.closes.reopenConfirm}
          cancelText={copy.closes.cancel}
          onOk={() => void submitReopen()}
          onCancel={() => setReopenTarget(null)}
          width={440}
        >
          <div className="flex flex-col gap-3">
            <p className="text-body-14 text-text-secondary" data-ui="reports-reopen-impact">
              {replaceTokens(copy.closes.reopenImpact, {
                period: monthPeriodOf(reopenTarget.period_start),
              })}
            </p>
            <label className="flex flex-col gap-1 text-label-12 text-text-secondary">
              {copy.closes.reopenReasonLabel}
              <textarea
                className="min-h-20 rounded-md border border-border p-2 text-body-13 text-text-primary"
                maxLength={500}
                onChange={(event) => setReopenReason(event.target.value)}
                placeholder={copy.closes.reopenReasonPlaceholder}
                value={reopenReason}
              />
            </label>
            {reopenError ? (
              <p className="text-body-13 text-status-danger" role="alert" data-ui="reports-reopen-error">
                {reopenError}
              </p>
            ) : null}
          </div>
        </Dialog>
      ) : null}

      {/* ── 마감 스냅샷 뷰 (동결 숫자 그대로 렌더 — 라이브 재계산 없음) ── */}
      <Dialog
        cancelText={copy.closes.cancel}
        closeLabel={copy.closes.dialogCloseLabel}
        open={snapshotState.status !== "closed"}
        onOpenChange={(open) => {
          if (!open) closeSnapshot();
        }}
        title={
          snapshotState.status === "closed"
            ? ""
            : replaceTokens(copy.closes.snapshot.title, { period: snapshotState.period })
        }
        okText={copy.closes.snapshot.close}
        onOk={closeSnapshot}
        hideCancelButton
        width={560}
      >
        {snapshotState.status === "loading" ? (
          <p className="text-body-13 text-text-muted">{copy.closes.snapshot.loading}</p>
        ) : snapshotState.status === "error" ? (
          <p className="text-body-13 text-status-danger" role="alert">
            {copy.closes.snapshot.loadFailed}
          </p>
        ) : snapshotState.status === "ready" ? (
          <SnapshotView
            close={snapshotState.close}
            copy={copy}
            fmtAmount={fmtAmount}
            fmtRatioPct={fmtRatioPct}
            fxEvidenceLine={fxEvidenceLine}
            members={members}
            monthDay={monthDay}
          />
        ) : null}
      </Dialog>
    </div>
  );
}

/** closed_by uuid → 멤버 이름(디스플레이명 → 이메일 → uuid 축약 폴백). */
function closerLabel(userId: string, members: OrgMember[]): string {
  const member = members.find((m) => m.user_id === userId);
  return member?.display_name || member?.email || userId.slice(0, 8);
}

/**
 * OD-010 다섯 번째 항목 — 월마감에 함께 동결한 환율 근거에만 존재한다(BE#1138).
 * applied_by 가 없으면(BE#1138 이전에 얼려진 V1-V4 스냅샷) null 을 돌려주고
 * 호출부는 그 줄 자체를 생략한다 — 근거를 동결한 사람을 지어내지 않는다.
 */
function monthCloseAppliedByLine(
  evidence: MonthCloseFXEvidence,
  members: OrgMember[],
  copy: ReportsCopy,
): string | null {
  if (!evidence.applied_by) return null;
  return replaceTokens(copy.charts.fxAppliedBy, { name: closerLabel(evidence.applied_by, members) });
}

/**
 * FS-05-01 §6 4행("기능 통화·환율 정책·환율 근거") — 마감 시점에 얼린
 * 조직의 기능 통화(BE#1160/#1165, monthCloseSnapshotV6.functional_currency).
 * 스냅샷 최상위 필드만 읽는다 — params 에도, 라이브 org 프로필 어디에도
 * 없다. 재개방 후 org 프로필이 바뀌어도 이 값은 마감 당시 값 그대로다
 * (backend 적대적 테스트: month_close_integration_test.go:225-244,
 * "functional currency stays frozen after profile change"). **절대 라이브
 * org/회사 프로필에서 대신 읽지 말 것** — 그 순간 동결이 깨지고, 같은
 * 마감을 다시 열었을 때 이전과 다른 숫자가 보이는 FE#440 이 재발한다.
 *
 * V1-V5 스냅샷(BE#1160 이전에 얼려짐)은 이 키 자체가 없고(`undefined`),
 * V6 이후에도 org 가 기능 통화를 설정하지 않았던 마감은 값이 `null`이다
 * — 두 경우 모두 "기록되지 않음"으로 표시한다. 빈 문자열도 같은 취급.
 * `monthCloseAppliedByLine` 과 달리 이 줄 자체를 생략하지 않는다: 기능
 * 통화는 §6 의 필수 항목이라 "표시하지 않음"이 아니라 "기록되지 않음"을
 * 명시해야 한다(추측 대체값 금지, 크래시 금지).
 */
function monthCloseFunctionalCurrencyLine(
  snapshot: MonthCloseSnapshotV1 | null | undefined,
  copy: ReportsCopy,
): string {
  const value = snapshot?.functional_currency;
  if (!value) return copy.closes.snapshot.functionalCurrencyNotRecorded;
  return replaceTokens(copy.closes.snapshot.functionalCurrency, { currency: value });
}

// ── 소형 프레젠테이션 조각 (영업 성과 콕핏 OS-C2 가 재사용 — export) ──

export function KpiTile({
  label,
  value,
  delta,
  basis,
  caution,
}: {
  label: string;
  value: string;
  delta: { text: string; tone: "up" | "bad" | "flat" } | null;
  basis?: string | null;
  caution?: string | null;
}) {
  return (
    <div
      className="rounded-xl border border-border-muted bg-surface px-4 py-3.5 shadow-[0_1px_3px_rgba(5,45,97,0.06)]"
      data-ui="reports-kpi"
    >
      <div className="text-label-12 text-text-secondary">{label}</div>
      <div className="mt-0.5 text-header-22 font-bold tracking-[-0.01em] text-text-primary tabular-nums">{value}</div>
      {delta ? (
        <div
          className={cx(
            "mt-0.5 text-label-12 tabular-nums",
            delta.tone === "up" && "text-status-success",
            delta.tone === "bad" && "text-status-danger",
            delta.tone === "flat" && "text-text-secondary",
          )}
        >
          {delta.text}
        </div>
      ) : null}
      {basis ? (
        <div className="mt-0.5 text-label-12 tabular-nums text-text-muted" data-ui="reports-kpi-basis">
          {basis}
        </div>
      ) : null}
      {caution ? (
        <div className="mt-0.5 text-label-12 tabular-nums text-ecoya-system-orange-1" data-ui="reports-kpi-caution">
          {caution}
        </div>
      ) : null}
    </div>
  );
}

function CardLoadError({
  message,
  retryLabel,
  onRetry,
}: {
  message: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-2 py-2" data-ui="reports-card-error" role="alert">
      <p className="text-body-13 text-status-danger">{message}</p>
      <Button onClick={onRetry} size="md" type="button" variant="tertiary">
        {retryLabel}
      </Button>
    </div>
  );
}

/**
 * 재조회가 실패했지만 직전 값을 계속 보여주는 카드의 머리말. 값이 사라지는 대신
 * "언제 기준 값인지"와 재시도를 함께 제시한다(SC-24 "실패 카드별 오류").
 */
function CardStaleNotice({
  message,
  retryLabel,
  onRetry,
}: {
  message: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border-subtle bg-surface-muted px-3 py-2"
      data-ui="reports-card-stale"
      role="status"
    >
      <p className="text-body-13 text-text-secondary">{message}</p>
      <Button onClick={onRetry} size="md" type="button" variant="tertiary">
        {retryLabel}
      </Button>
    </div>
  );
}

export function ReportCard({ title, sub, children }: { title: string; sub: ReactNode; children: ReactNode }) {
  return (
    <SectionCard className="min-w-0" density="compact" description={sub} title={title}>
      {children}
    </SectionCard>
  );
}

function LegendKey({
  label,
  swatchClass,
  lineClass,
}: {
  label: string;
  swatchClass?: string;
  lineClass?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {swatchClass ? <span aria-hidden className={cx("h-2.5 w-2.5 rounded-[3px]", swatchClass)} /> : null}
      {lineClass ? <span aria-hidden className={cx("h-0.5 w-3.5 rounded-[1px]", lineClass)} /> : null}
      {label}
    </span>
  );
}

function SnapshotView({
  close,
  copy,
  fmtAmount,
  fmtRatioPct,
  fxEvidenceLine,
  members,
  monthDay,
}: {
  close: MonthClose;
  copy: ReportsCopy;
  fmtAmount: (v: AmountCell | bigint | string | null | undefined, currency?: string | null) => string;
  fmtRatioPct: (permyriad: bigint | null) => string;
  fxEvidenceLine: (evidence: FXConversionEvidence) => string;
  members: OrgMember[];
  monthDay: (iso: string) => string;
}) {
  const snapshot = close.snapshot ?? null;
  const rows = snapshot?.series?.by_currency ?? [];
  const topItems = snapshot?.counterparty_top?.items ?? [];
  const maxTop = topItems.length > 0 ? Math.max(...topItems.map((item) => num(item.amount))) : 0;

  // FS-05-01 §6 필수 항목: 기능 통화는 집계가 비어 있는 마감(QA-1374, 순수
  // 빈 마감)에서도 반드시 표시되어야 한다 — 두 조기 return 아래에서만 렌더하면
  // 그 케이스들에서 통째로 생략돼 monthCloseFunctionalCurrencyLine 의 doc
  // comment 가 약속한 "생략되지 않는다"가 깨진다. 헬퍼 호출과 마크업을 한
  // 번만 만들어 아래 세 분기가 전부 공유한다(중복 금지).
  const functionalCurrencyLine = (
    <p className="text-body-13 text-text-secondary" data-ui="reports-snapshot-functional-currency">
      {monthCloseFunctionalCurrencyLine(snapshot, copy)}
    </p>
  );

  // FS-05-01 §6 "일정 자체 대사·부분 대손 근거" — 원래 예정 금액·조정 누계·부분
  // 대손 누계·현재 대상 금액·적용액·미결제와 부분 대손 사건이 마감 시점값
  // (`monthCloseSnapshotV7`)에 함께 얼어붙는다. 동결본을 그대로 렌더하고 라이브
  // 재조회로 대체하지 않는다 — 그 순간 위 집계와 드릴다운이 어긋난다.
  // functionalCurrencyLine 과 같은 이유로 한 번만 만들어 세 분기가 공유한다.
  const reconciliation = (
    <SnapshotReconciliation
      copy={copy}
      fmtAmount={fmtAmount}
      monthDay={monthDay}
      snapshot={snapshot}
    />
  );

  // erp-v2-adapt: begin — QA-1374 preserves a close note when canonical snapshot aggregates are empty.
  if (rows.length === 0 && topItems.length === 0 && close.note) {
    return (
      <div className="flex flex-col gap-4" data-ui="reports-snapshot">
        <p className="text-body-13 text-text-secondary">
          <span className="font-semibold">{copy.closes.snapshot.note}</span> · {close.note}
        </p>
        {functionalCurrencyLine}
        <p className="text-body-13 text-text-muted">{copy.closes.snapshot.empty}</p>
        {reconciliation}
      </div>
    );
  }
  // erp-v2-adapt: end

  if (rows.length === 0 && topItems.length === 0) {
    return (
      <div className="flex flex-col gap-4" data-ui="reports-snapshot">
        {functionalCurrencyLine}
        <p className="text-body-13 text-text-muted">{copy.closes.snapshot.empty}</p>
        {reconciliation}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-ui="reports-snapshot">
      {close.note ? (
        <p className="text-body-13 text-text-secondary">
          <span className="font-semibold">{copy.closes.snapshot.note}</span> · {close.note}
        </p>
      ) : null}
      {functionalCurrencyLine}
      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <HostTable className="w-full border-collapse text-body-13 tabular-nums">
            <HostTableHeader>
              <HostTableRow className="border-b border-border-muted text-left text-label-12 text-text-muted">
                <HostTableHead className="py-1.5 pr-3 font-medium">{copy.closes.snapshot.currency}</HostTableHead>
                <HostTableHead className="py-1.5 pr-3 text-right font-medium">{copy.closes.snapshot.receivableDue}</HostTableHead>
                <HostTableHead className="py-1.5 pr-3 text-right font-medium">{copy.closes.snapshot.received}</HostTableHead>
                <HostTableHead className="py-1.5 pr-3 text-right font-medium">{copy.closes.snapshot.outstandingEnd}</HostTableHead>
                <HostTableHead className="py-1.5 pr-3 text-right font-medium">{copy.closes.snapshot.payableEnd}</HostTableHead>
                <HostTableHead className="py-1.5 text-right font-medium">{copy.closes.snapshot.overdueRate}</HostTableHead>
              </HostTableRow>
            </HostTableHeader>
            <HostTableBody>
              {rows.map((row) => {
                const overdueRate = overdueRatePermyriad(row);
                const appliedByLine = row.fx_conversion?.evidence
                  ? monthCloseAppliedByLine(row.fx_conversion.evidence, members, copy)
                  : null;
                return (
                  <HostTableRow key={row.currency} className="border-b border-border-muted last:border-b-0">
                    <HostTableCell className="py-1.5 pr-3 font-semibold text-text-primary">
                      {row.currency}
                      {row.fx_conversion?.state === "환산 불가" ? (
                        <span className="block text-label-12 font-medium text-status-danger">
                          {replaceTokens(copy.charts.fxConversionState, {
                            state: row.fx_conversion.state,
                          })}
                        </span>
                      ) : row.fx_conversion?.evidence ? (
                        <span className="block text-label-12 font-normal text-text-muted">
                          {fxEvidenceLine(row.fx_conversion.evidence)}
                          {appliedByLine ? (
                            <>
                              <br />
                              {appliedByLine}
                            </>
                          ) : null}
                        </span>
                      ) : null}
                    </HostTableCell>
                    <HostTableCell className="py-1.5 pr-3 text-right">
                      {fmtAmount(row.receivable_due, row.currency)}
                    </HostTableCell>
                    <HostTableCell className="py-1.5 pr-3 text-right">{fmtAmount(row.received, row.currency)}</HostTableCell>
                    <HostTableCell className="py-1.5 pr-3 text-right">
                      {fmtAmount(row.receivable_outstanding_end, row.currency)}
                    </HostTableCell>
                    <HostTableCell className="py-1.5 pr-3 text-right">
                      {fmtAmount(row.payable_outstanding_end, row.currency)}
                    </HostTableCell>
                    <HostTableCell className="py-1.5 text-right">
                      {overdueRate == null ? copy.ratioUnavailable : fmtRatioPct(overdueRate)}
                    </HostTableCell>
                  </HostTableRow>
                );
              })}
            </HostTableBody>
          </HostTable>
        </div>
      ) : null}
      {topItems.length > 0 ? (
        <div>
          <h3 className="m-0 text-body-14 font-semibold text-text-primary">{copy.closes.snapshot.topTitle}</h3>
          <div className="mt-2 grid gap-2">
            {topItems.map((item) => {
              const appliedByLine = item.fx_conversion?.evidence
                ? monthCloseAppliedByLine(item.fx_conversion.evidence, members, copy)
                : null;
              return (
                <div key={`${item.counterparty}-${item.currency}`} className="grid gap-1">
                  <div className="flex justify-between text-body-13">
                    <span className="font-medium text-ecoya-gray-3">{item.counterparty}</span>
                    <span className="text-text-secondary tabular-nums">
                      {fmtAmount(item.amount, item.currency)} {item.currency}
                    </span>
                  </div>
                  {item.fx_conversion?.state === "환산 불가" ? (
                    <span
                      className="text-label-12 font-medium text-status-danger"
                      data-ui="reports-snapshot-topn-fx-unconvertible"
                    >
                      {replaceTokens(copy.charts.fxConversionState, {
                        state: item.fx_conversion.state,
                      })}
                    </span>
                  ) : item.fx_conversion?.evidence ? (
                    <span
                      className="text-label-12 font-normal text-text-muted"
                      data-ui="reports-snapshot-topn-fx-evidence"
                    >
                      {fxEvidenceLine(item.fx_conversion.evidence)}
                      {appliedByLine ? (
                        <>
                          <br />
                          {appliedByLine}
                        </>
                      ) : null}
                    </span>
                  ) : null}
                  <div className="rounded-r bg-surface-muted">
                    <div
                      className="h-2.5 rounded-r bg-ecoya-accent"
                      style={{ width: `${maxTop > 0 ? (num(item.amount) / maxTop) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {reconciliation}
    </div>
  );
}

/**
 * FS-05-01 §6 마감 시점값의 일정 단위 대사와 조정·부분 대손 근거.
 *
 * 세 블록 모두 동결본에만 존재한다(BE `monthCloseSnapshotV7`의 `schedules`
 * /`adjustments`/`writeoffs`). V1-V3 스냅샷에는 `schedules` 키 자체가 없고,
 * V6 이전에는 `writeoffs` 가 없다 — 그 경우 "기록되지 않음"이라고 말하고 라이브
 * 조회로 채우지 않는다. 같은 이유로 V4~V6 의 일정 행에는 조정 누계·부분 대손
 * 누계·현재 대상 세 열이 키째로 없어 그 칸만 `—` 로 렌더한다(0 이 아니다). 동결 페이로드는 그대로 반환되는 계약이라, 없는 값을
 * 지금 다시 계산해 넣으면 같은 마감을 다시 열 때 숫자가 달라진다.
 */
function SnapshotReconciliation({
  copy,
  fmtAmount,
  monthDay,
  snapshot,
}: {
  copy: ReportsCopy;
  fmtAmount: (v: AmountCell | bigint | string | null | undefined, currency?: string | null) => string;
  monthDay: (iso: string) => string;
  snapshot: MonthCloseSnapshotV1 | null;
}) {
  const snapCopy = copy.closes.snapshot;
  const schedules = snapshot?.schedules;
  const scheduleItems = schedules?.items ?? [];
  const adjustments = snapshot?.adjustments?.events ?? [];
  const writeoffs = snapshot?.writeoffs?.events ?? [];
  const scheduleTypeLabel = (type: string): string =>
    type === "receivable"
      ? snapCopy.scheduleTypeReceivable
      : type === "payable"
        ? snapCopy.scheduleTypePayable
        : type;

  return (
    <div className="flex flex-col gap-4" data-ui="reports-snapshot-reconciliation">
      <div>
        <h3 className="m-0 text-body-14 font-semibold text-text-primary">{snapCopy.schedulesTitle}</h3>
        {schedules == null ? (
          <p className="mt-2 text-body-13 text-text-muted" data-ui="reports-snapshot-schedules-missing">
            {snapCopy.schedulesNotRecorded}
          </p>
        ) : (
          <>
            {schedules.as_of ? (
              <p className="mt-1 text-label-12 text-text-muted" data-ui="reports-snapshot-schedules-as-of">
                {replaceTokens(snapCopy.schedulesAsOf, { date: monthDay(schedules.as_of.slice(0, 10)) })}
              </p>
            ) : null}
            {scheduleItems.length === 0 ? (
              <p className="mt-2 text-body-13 text-text-muted">{snapCopy.empty}</p>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <HostTable className="w-full border-collapse text-body-13 tabular-nums" data-ui="reports-snapshot-schedules">
                  <HostTableHeader>
                    <HostTableRow className="border-b border-border-muted text-left text-label-12 text-text-muted">
                      <HostTableHead className="py-1.5 pr-3 font-medium">{snapCopy.scheduleType}</HostTableHead>
                      <HostTableHead className="py-1.5 pr-3 font-medium">{snapCopy.scheduleDue}</HostTableHead>
                      <HostTableHead className="py-1.5 pr-3 text-right font-medium">{snapCopy.scheduleAmount}</HostTableHead>
                      <HostTableHead className="py-1.5 pr-3 text-right font-medium">{snapCopy.scheduleAdjustment}</HostTableHead>
                      <HostTableHead className="py-1.5 pr-3 text-right font-medium">{snapCopy.scheduleWrittenOff}</HostTableHead>
                      <HostTableHead className="py-1.5 pr-3 text-right font-medium">{snapCopy.scheduleTarget}</HostTableHead>
                      <HostTableHead className="py-1.5 pr-3 text-right font-medium">{snapCopy.schedulePaid}</HostTableHead>
                      <HostTableHead className="py-1.5 text-right font-medium">{snapCopy.scheduleOutstanding}</HostTableHead>
                    </HostTableRow>
                  </HostTableHeader>
                  <HostTableBody>
                    {scheduleItems.map((item) => (
                      <HostTableRow
                        key={item.schedule_id}
                        className="border-b border-border-muted last:border-b-0"
                        data-ui="reports-snapshot-schedule-row"
                      >
                        <HostTableCell className="py-1.5 pr-3">{scheduleTypeLabel(item.type)}</HostTableCell>
                        <HostTableCell className="py-1.5 pr-3">{monthDay(item.due_date.slice(0, 10))}</HostTableCell>
                        <HostTableCell className="py-1.5 pr-3 text-right">{fmtAmount(item.amount, item.currency)}</HostTableCell>
                        <HostTableCell className="py-1.5 pr-3 text-right">{fmtAmount(item.adjustment_net, item.currency)}</HostTableCell>
                        <HostTableCell className="py-1.5 pr-3 text-right">{fmtAmount(item.written_off_total, item.currency)}</HostTableCell>
                        <HostTableCell className="py-1.5 pr-3 text-right">{fmtAmount(item.current_target, item.currency)}</HostTableCell>
                        <HostTableCell className="py-1.5 pr-3 text-right">{fmtAmount(item.paid, item.currency)}</HostTableCell>
                        <HostTableCell className="py-1.5 text-right">{fmtAmount(item.outstanding, item.currency)}</HostTableCell>
                      </HostTableRow>
                    ))}
                  </HostTableBody>
                </HostTable>
              </div>
            )}
          </>
        )}
      </div>

      <div>
        <h3 className="m-0 text-body-14 font-semibold text-text-primary">{snapCopy.adjustmentsTitle}</h3>
        {adjustments.length === 0 ? (
          <p className="mt-2 text-body-13 text-text-muted">{snapCopy.adjustmentsEmpty}</p>
        ) : (
          <ul className="mt-2 grid gap-1" data-ui="reports-snapshot-adjustments">
            {adjustments.map((event) => (
              <li key={event.id} className="text-body-13 text-text-secondary">
                {replaceTokens(snapCopy.adjustmentLine, {
                  date: monthDay(event.created_at.slice(0, 10)),
                  amount: fmtAmount(event.amount, event.currency),
                  currency: event.currency,
                  reason: event.reason?.trim() || snapCopy.reasonNotRecorded,
                })}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="m-0 text-body-14 font-semibold text-text-primary">{snapCopy.writeoffsTitle}</h3>
        {writeoffs.length === 0 ? (
          <p className="mt-2 text-body-13 text-text-muted">{snapCopy.writeoffsEmpty}</p>
        ) : (
          <ul className="mt-2 grid gap-1" data-ui="reports-snapshot-writeoffs">
            {writeoffs.map((event) => (
              <li key={event.id} className="text-body-13 text-text-secondary">
                {replaceTokens(snapCopy.writeoffLine, {
                  date: monthDay(event.occurred_at.slice(0, 10)),
                  amount: fmtAmount(event.written_off_amount, event.currency),
                  currency: event.currency,
                  scheduled: fmtAmount(event.scheduled_amount, event.currency),
                  reason: event.reason?.trim() || snapCopy.reasonNotRecorded,
                })}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

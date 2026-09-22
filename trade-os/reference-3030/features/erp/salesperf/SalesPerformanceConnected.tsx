import { HostTable, HostTableHeader, HostTableBody, HostTableRow, HostTableHead, HostTableCell } from "@trade-os/reference-3030/components/platform/HostTable";
"use client";
import { BusinessListToolbar, BusinessFilterField, BusinessFilterSelect } from "@shared/components/business-filters";

import { useLocale } from "@trade-os/reference-3030/compat/intl";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { InfoBox } from "@trade-os/reference-3030/components/platform/InfoBox";
import { AnalyticsSkeleton } from "@trade-os/reference-3030/components/platform/AnalyticsSkeleton";
import { Button } from "@trade-os/reference-3030/components/ui/button";
import { Select } from "@trade-os/reference-3030/components/ui/dropdown";
import { cx } from "@trade-os/reference-3030/components/ui/utils";
// erp-v2-adapt: begin — QA-1352 defers the gate reason to BE #495 instead of the boolean projection.
import { usePlatformSession } from "@trade-os/reference-3030/features/auth/PlatformSessionContext";
// erp-v2-adapt: end
import { GpBarChart } from "@trade-os/reference-3030/features/erp/reports/charts/GpBarChart";
import { KpiTile, ReportCard, Segmented } from "@trade-os/reference-3030/features/erp/reports/ReportsConnected";
import {
  computeGpKpi,
  gpForCurrency,
  gpKpiBasisText,
  gpKpiCautionText,
  gpWindowExclusion,
} from "@trade-os/reference-3030/features/erp/reports/reportsData";
// erp-v2-adapt: begin — QA-1352 shares the four-cause notice and entitlement classifier.
import { InsightsGateNotice } from "@trade-os/reference-3030/features/erp/shared/InsightsGateNotice";
// erp-v2-adapt: end
import { localeTag } from "@trade-os/reference-3030/i18n/messages";
import {
  formatNumber,
  formatPermyriadPct,
  formatScaledMoney,
  formatScaledPct,
} from "@trade-os/reference-3030/lib/money";
import { ApiError } from "@trade-os/reference-3030/lib/api/client";
// erp-v2-adapt: begin — QA-1352 consumes the unremapped BE #495 status/code pair.
import { classifyEntitlementGate, type EntitlementGateReason } from "@trade-os/reference-3030/lib/api/entitlements";
// erp-v2-adapt: end
import { listMembers, memberLabel, type OrgMember } from "@trade-os/reference-3030/lib/api/members";
import {
  getCounterpartyStatus,
  getGpByAssignee,
  getGpSeries,
  getSettlementSeries,
  type AssigneeGPResponse,
  type CounterpartyStatusResponse,
  type GPSeriesResponse,
  type SettlementSeriesResponse,
} from "@trade-os/reference-3030/lib/api/reports";
import { isTransientError, withRetry } from "@trade-os/reference-3030/lib/api/retry";
import {
  FINANCE_DECIMAL_SCALE,
  amountCell,
  type AmountCell,
} from "@trade-os/reference-3030/lib/financeDecimal";

import {
  activeDealsSummary,
  assigneeGpRows,
  assigneeLabel,
  deriveCockpitCurrencies,
  latestSeriesKpi,
  overdueFromStatus,
} from "./salesPerfData";

import type { AppMessages } from "@trade-os/reference-3030/i18n/messages";

type BaseSalesPerfCopy = AppMessages["erpSalesPerformance"]["cockpit"];

export type SalesPerfCopy = BaseSalesPerfCopy & {
  directoryErrorTitle?: string;
  directoryLoadFailed?: string;
  directoryRetry?: string;
  refreshErrorTitle?: string;
  kpi: BaseSalesPerfCopy["kpi"] & {
    activeDealsLimitedSub?: string;
    overdueAmountLimited?: string;
  };
  byAssignee: BaseSalesPerfCopy["byAssignee"] & {
    titleLimited?: string;
    scope?: string;
    limitReached?: string;
  };
};

type SalesPerformanceRangeMonths = 3 | 6 | 12;

const SALES_PERFORMANCE_RANGES: readonly SalesPerformanceRangeMonths[] = [3, 6, 12];

class ObsoleteSalesPerformanceLoad extends Error {}

function computeSalesPerformanceRange(
  asOf: string,
  months: SalesPerformanceRangeMonths,
): { from: string; to: string } {
  const [year, month] = asOf.split("-").map(Number);
  const start = new Date(Date.UTC(year, (month ?? 1) - 1 - (months - 1), 1));
  return {
    from: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}-01`,
    to: asOf,
  };
}

type ReadyData = {
  series: SettlementSeriesResponse;
  gp: GPSeriesResponse;
  status: CounterpartyStatusResponse;
  /** 담당자별 GP — 오너/관리자 org 전체 뷰에서만 fetch(그 외 null). */
  byAssignee: AssigneeGPResponse | null;
  rangeMonths: SalesPerformanceRangeMonths;
};

type RefreshError = {
  eventId: number;
  message: string;
};

type MemberDirectoryState =
  | { orgId: string; status: "loading" }
  | { orgId: string; status: "ready"; members: OrgMember[] }
  | { orgId: string; status: "error"; message: string };

type MemberDirectoryCacheEntry = {
  eventId: number;
  promise: Promise<OrgMember[]> | null;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  // erp-v2-adapt: begin — QA-1352 preserves BE #495's commercial-gate reason.
  | { status: "gated"; reason: EntitlementGateReason }
  // erp-v2-adapt: end
  | {
      status: "ready";
      data: ReadyData;
      refreshing: boolean;
      refreshError: RefreshError | null;
    };

function replaceTokens(template: string, tokens: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(tokens)) {
    out = out.replaceAll(`{${key}}`, value);
  }
  return out;
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRealISODate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  const roundTrip = [
    String(date.getUTCFullYear()).padStart(4, "0"),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
  return roundTrip === value;
}

function validateBootstrapDates(status: CounterpartyStatusResponse): {
  from: string;
  to: string;
  asOf: string;
} {
  const { from, to, as_of: asOf } = status;
  if (
    !isRealISODate(from) ||
    !isRealISODate(to) ||
    !isRealISODate(asOf) ||
    from > to ||
    to !== asOf
  ) {
    throw new Error("Invalid Counterparty Status bootstrap dates");
  }
  const expectedRange = computeSalesPerformanceRange(asOf, 12);
  if (from !== expectedRange.from) {
    throw new Error("Invalid Counterparty Status bootstrap range");
  }
  return { from, to, asOf };
}

/** 상태 테이블 fetch = BE 클램프 상한(200) — v1 은 페이지네이션 UI 없음. */
const STATUS_FETCH_LIMIT = 200;
/** 담당자별 GP = 통화별 Top-N 상한(50) — 경계 도달 시 누락 가능성을 고지한다. */
const BY_ASSIGNEE_LIMIT = 50;
/** 필터 Select 의 "전체" 센티널 — uuid 와 충돌하지 않는 값. */
const ASSIGNEE_ALL = "all";

/** Native table rows cannot establish containment; defer bounded block-wrapped tables instead. */
const STATUS_TABLE_CHUNK_SIZE = 25;
const STATUS_TABLE_ROW_ESTIMATED_BLOCK_SIZE_PX = 44;
const STATUS_CHUNK_DEFERRED_RENDER_STYLE = {
  contentVisibility: "auto",
  containIntrinsicInlineSize: "auto 1200px",
} satisfies CSSProperties;

type SalesPerformanceConnectedProps = {
  renderHeader?: (controls: ReactNode, summary?: ReactNode) => ReactNode;
  copy: SalesPerfCopy;
  role?: string;
};

export function SalesPerformanceConnected({
  copy,
  role,
  renderHeader,
}: SalesPerformanceConnectedProps) {
  // The duration is a harmless user preference; sensitive assignee, anchor,
  // directory, and report state live inside the keyed identity scope below.
  const [rangeMonths, setRangeMonths] =
    useState<SalesPerformanceRangeMonths>(12);
  const { identity } = usePlatformSession();
  const identityScopeKey = JSON.stringify([
    identity.org_id,
    identity.user_id,
    role ?? null,
  ]);
  const activeIdentityScopeRef = useRef(identityScopeKey);
  useLayoutEffect(() => {
    activeIdentityScopeRef.current = identityScopeKey;
    return () => {
      if (activeIdentityScopeRef.current === identityScopeKey) {
        activeIdentityScopeRef.current = "";
      }
    };
  }, [identityScopeKey]);

  // Identity and privilege transitions remount the entire request scope. This
  // synchronously drops identity-bound filters, the server-date anchor, and
  // ready data before the replacement scope can render or issue a request.
  return (
    <SalesPerformanceIdentityScope
      activeIdentityScopeRef={activeIdentityScopeRef}
      copy={copy}
      identityScopeKey={identityScopeKey}
      onRangeMonthsChange={setRangeMonths}
      key={identityScopeKey}
      orgId={identity.org_id}
      role={role}
      rangeMonths={rangeMonths}
      renderHeader={renderHeader}
      userId={identity.user_id}
    />
  );
}

function SalesPerformanceIdentityScope({
  renderHeader,
  activeIdentityScopeRef,
  copy,
  identityScopeKey,
  onRangeMonthsChange,
  orgId,
  rangeMonths,
  role,
  userId,
}: SalesPerformanceConnectedProps & {
  activeIdentityScopeRef: { current: string };
  identityScopeKey: string;
  onRangeMonthsChange: (months: SalesPerformanceRangeMonths) => void;
  orgId: string;
  rangeMonths: SalesPerformanceRangeMonths;
  userId: string;
}) {
  const { getIdToken } = usePlatformSession();
  // erp-v2-adapt: begin — QA-1352 removes the lossy entitlement-projection read.
  // erp-v2-adapt: end
  const locale = useLocale();
  const tag = localeTag(locale);

  // member 는 BE 가 본인으로 강제(서비스 레이어) — FE 는 그 전제로 오너/관리자에게만
  // 담당자 필터·담당자별 GP 섹션을 노출한다(D10: 전체 범위 + 담당자 필터).
  const isManager = role === "owner" || role === "admin";

  // erp-v2-adapt: begin — QA-1352 removes the projection-derived preflight gate.
  // erp-v2-adapt: end
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [currencyChoice, setCurrencyChoice] = useState<string | null>(null);
  // erp-v2-adapt: begin — QA-1352 waits for the backend gate reason before choosing a notice.
  const [state, setState] = useState<LoadState>({ status: "loading" });
  // erp-v2-adapt: end
  const [memberDirectoryState, setMemberDirectoryState] = useState<MemberDirectoryState>({
    orgId,
    status: "loading",
  });
  const fetchEventId = useRef(0);
  const memberDirectoryEventId = useRef(0);
  const mountDateAnchorRef = useRef<string | null>(null);
  const activeOrgIdRef = useRef(orgId);
  const managerAuthorityRef = useRef(isManager);
  const componentActiveRef = useRef(true);
  const membersByScopeRef = useRef(
    new Map<string, MemberDirectoryCacheEntry>(),
  );
  const assigneeControlRef = useRef<HTMLElement | null>(null);
  const refreshFocusTargetRef = useRef<HTMLElement | null>(null);
  const restoreRefreshFocusRef = useRef(false);
  const refreshErrorRef = useRef<HTMLDivElement | null>(null);
  const refreshRetryInFlightRef = useRef(false);
  const loadFailedRef = useRef(copy.loadFailed);
  const directoryLoadFailedRef = useRef(
    copy.directoryLoadFailed ?? copy.loadFailed,
  );
  useEffect(() => {
    loadFailedRef.current = copy.loadFailed;
    directoryLoadFailedRef.current =
      copy.directoryLoadFailed ?? copy.loadFailed;
  }, [copy.directoryLoadFailed, copy.loadFailed]);
  useEffect(() => {
    activeOrgIdRef.current = orgId;
    managerAuthorityRef.current = isManager;
  }, [isManager, orgId]);

  useEffect(() => {
    componentActiveRef.current = true;
    return () => {
      componentActiveRef.current = false;
      managerAuthorityRef.current = false;
      memberDirectoryEventId.current += 1;
      fetchEventId.current += 1;
    };
  }, []);

  const getManagerMembers = useCallback((eventId: number) => {
    const cached = membersByScopeRef.current.get(identityScopeKey);
    if (cached?.promise) {
      // React may restart the same manager effect without changing authority.
      // Adopt that single operation into the newest consumer generation.
      cached.eventId = eventId;
      return cached.promise;
    }

    const cacheEntry: MemberDirectoryCacheEntry = {
      eventId,
      promise: null,
    };
    membersByScopeRef.current.set(identityScopeKey, cacheEntry);

    const hasCurrentManagerAuthority = () =>
      componentActiveRef.current &&
      managerAuthorityRef.current &&
      cacheEntry.eventId === memberDirectoryEventId.current &&
      membersByScopeRef.current.get(identityScopeKey) === cacheEntry &&
      activeIdentityScopeRef.current === identityScopeKey &&
      activeOrgIdRef.current === orgId;

    const membersPromise = withRetry(
      async () => {
        if (!hasCurrentManagerAuthority()) {
          throw new ObsoleteSalesPerformanceLoad();
        }
        const loaded = await listMembers(getIdToken);
        if (!hasCurrentManagerAuthority()) {
          throw new ObsoleteSalesPerformanceLoad();
        }
        return loaded;
      },
      {
        shouldRetry: (error) =>
          hasCurrentManagerAuthority() && isTransientError(error),
      },
    ).catch((error) => {
      if (membersByScopeRef.current.get(identityScopeKey) === cacheEntry) {
        membersByScopeRef.current.delete(identityScopeKey);
      }
      throw error;
    });
    cacheEntry.promise = membersPromise;
    return membersPromise;
  }, [activeIdentityScopeRef, getIdToken, identityScopeKey, orgId]);

  const loadManagerDirectory = useCallback(() => {
    if (!isManager) return;

    const eventId = memberDirectoryEventId.current + 1;
    memberDirectoryEventId.current = eventId;
    void getManagerMembers(eventId)
      .then((members) => {
        if (
          memberDirectoryEventId.current !== eventId ||
          !componentActiveRef.current ||
          !managerAuthorityRef.current ||
          activeIdentityScopeRef.current !== identityScopeKey ||
          activeOrgIdRef.current !== orgId
        ) {
          return;
        }
        setMemberDirectoryState({ orgId, status: "ready", members });
      })
      .catch((error) => {
        if (
          memberDirectoryEventId.current !== eventId ||
          !componentActiveRef.current ||
          !managerAuthorityRef.current ||
          activeIdentityScopeRef.current !== identityScopeKey ||
          activeOrgIdRef.current !== orgId
        ) {
          return;
        }
        setMemberDirectoryState({
          orgId,
          status: "error",
          message:
            error instanceof ApiError && error.message
              ? error.message
              : directoryLoadFailedRef.current,
        });
      });
  }, [activeIdentityScopeRef, getManagerMembers, identityScopeKey, isManager, orgId]);

  useEffect(() => {
    if (!isManager) {
      memberDirectoryEventId.current += 1;
      return;
    }
    loadManagerDirectory();
    return () => {
      memberDirectoryEventId.current += 1;
    };
  }, [isManager, loadManagerDirectory]);

  // 로딩 상태 전환은 이벤트 핸들러/초기값에서 하고, effect 는 fetch 만 발화한다
  // (react-hooks/set-state-in-effect — B3 와 동일 자세).
  const load = useCallback(() => {
    // erp-v2-adapt: begin — QA-1352 removes the projection short circuit so the BE cause wins.
    // erp-v2-adapt: end
    const eventId = fetchEventId.current + 1;
    fetchEventId.current = eventId;

    function requestForEvent<T>(operation: () => Promise<T>): Promise<T> {
      return withRetry(
        async () => {
          if (
            fetchEventId.current !== eventId ||
            !componentActiveRef.current ||
            activeIdentityScopeRef.current !== identityScopeKey ||
            activeOrgIdRef.current !== orgId
          ) {
            throw new ObsoleteSalesPerformanceLoad();
          }
          const result = await operation();
          if (
            fetchEventId.current !== eventId ||
            !componentActiveRef.current ||
            activeIdentityScopeRef.current !== identityScopeKey ||
            activeOrgIdRef.current !== orgId
          ) {
            throw new ObsoleteSalesPerformanceLoad();
          }
          return result;
        },
        {
          shouldRetry: (error) =>
            fetchEventId.current === eventId &&
            componentActiveRef.current &&
            activeIdentityScopeRef.current === identityScopeKey &&
            activeOrgIdRef.current === orgId &&
            isTransientError(error),
        },
      );
    }

    void (async (): Promise<ReadyData> => {
      // member 콕핏: 시리즈 엔드포인트는 FILTER 의미론(assignee 없음 = 조직
      // 전체 — B3 결산 화면의 계약)이라, "내 숫자"가 되려면 본인 user_id 를
      // 명시적으로 보내야 한다(적대 리뷰: 조직 전체 수치가 '내 딜 기준'
      // 라벨을 달던 버그). BE 는 member 의 assignee 를 어차피 본인으로
      // 강제하므로(fail-closed) 이 값은 스코프 지정이지 권한 확대가 아니다.
      const assignee = isManager ? (assigneeFilter ?? undefined) : userId;

      // 담당자 이름 해석은 보고서 요청과 별도로 복구한다. member 뷰는 필터도
      // 랭킹도 없어 목록이 불필요하다(관리자 API 호출 회피).

      const scopedParams = assignee ? { assignee } : {};
      const anchor = mountDateAnchorRef.current;
      let bootstrapStatus: CounterpartyStatusResponse | null = null;
      let from: string;
      let to: string;

      if (anchor === null) {
        bootstrapStatus = await requestForEvent(() =>
          getCounterpartyStatus(
            { ...scopedParams, limit: STATUS_FETCH_LIMIT },
            getIdToken,
          ),
        );

        const bootstrapDates = validateBootstrapDates(bootstrapStatus);
        mountDateAnchorRef.current = bootstrapDates.asOf;
        if (rangeMonths === 12) {
          from = bootstrapDates.from;
          to = bootstrapDates.to;
        } else {
          ({ from, to } = computeSalesPerformanceRange(
            bootstrapDates.asOf,
            rangeMonths,
          ));
        }
      } else {
        ({ from, to } = computeSalesPerformanceRange(anchor, rangeMonths));
      }

      // Guard: no ranged report starts after this load has been superseded.
      if (fetchEventId.current !== eventId) {
        throw new ObsoleteSalesPerformanceLoad();
      }

      // 담당자별 GP 는 org 전체 뷰 전용 — member 뷰·단일 담당자 드릴다운에서는
      // fetch 자체를 생략한다(섹션 비노출).
      const byAssigneePromise =
        isManager && !assignee
          ? requestForEvent(() =>
              getGpByAssignee({ from, to, limit: BY_ASSIGNEE_LIMIT }, getIdToken),
            )
          : Promise.resolve(null);

      if (bootstrapStatus && rangeMonths === 12) {
        const [series, gp, byAssignee] = await Promise.all([
          requestForEvent(() =>
            getSettlementSeries(
              { granularity: "month", from, to, ...scopedParams },
              getIdToken,
            ),
          ),
          requestForEvent(() =>
            getGpSeries({ from, to, ...scopedParams }, getIdToken),
          ),
          byAssigneePromise,
        ]);
        return {
          series,
          gp,
          status: bootstrapStatus,
          byAssignee,
          rangeMonths,
        };
      }

      const [series, gp, status, byAssignee] = await Promise.all([
        requestForEvent(() =>
          getSettlementSeries(
            { granularity: "month", from, to, ...scopedParams },
            getIdToken,
          ),
        ),
        requestForEvent(() =>
          getGpSeries({ from, to, ...scopedParams }, getIdToken),
        ),
        requestForEvent(() =>
          getCounterpartyStatus(
            { from, to, ...scopedParams, limit: STATUS_FETCH_LIMIT },
            getIdToken,
          ),
        ),
        byAssigneePromise,
      ]);
      return { series, gp, status, byAssignee, rangeMonths };
    })()
      .then((result) => {
        if (
          fetchEventId.current !== eventId ||
          !componentActiveRef.current ||
          activeIdentityScopeRef.current !== identityScopeKey
        ) {
          return;
        }
        refreshRetryInFlightRef.current = false;
        const focusTarget = refreshFocusTargetRef.current;
        const shouldRestoreFocus = restoreRefreshFocusRef.current;
        setState({
          status: "ready",
          data: result,
          refreshing: false,
          refreshError: null,
        });
        refreshFocusTargetRef.current = null;
        restoreRefreshFocusRef.current = false;
        if (shouldRestoreFocus && focusTarget?.isConnected) {
          focusTarget.focus();
        }
      })
      .catch((err) => {
        if (
          fetchEventId.current !== eventId ||
          !componentActiveRef.current ||
          activeIdentityScopeRef.current !== identityScopeKey
        ) {
          return;
        }
        refreshRetryInFlightRef.current = false;
        // Stop sibling endpoint backoffs once the atomic batch can no longer commit.
        fetchEventId.current += 1;
        // erp-v2-adapt: begin — QA-1352 classifies the unremapped BE #495 status/code pair.
        const gateReason = err instanceof ApiError ? classifyEntitlementGate(err) : null;
        if (gateReason) {
          setState({ status: "gated", reason: gateReason });
          return;
        }
        // erp-v2-adapt: end
        const message =
          err instanceof ApiError && err.message
            ? err.message
            : loadFailedRef.current;
        if (refreshFocusTargetRef.current) {
          restoreRefreshFocusRef.current = true;
        }
        setState((current) =>
          current.status === "ready"
            ? {
                ...current,
                refreshing: false,
                refreshError: { eventId, message },
              }
            : { status: "error", message },
        );
      });
  // erp-v2-adapt: begin — QA-1352 removes the obsolete projection dependency with its short circuit.
  }, [activeIdentityScopeRef, assigneeFilter, getIdToken, identityScopeKey, isManager, orgId, rangeMonths, userId]);
  // erp-v2-adapt: end

  useEffect(() => {
    load();
    return () => {
      fetchEventId.current += 1;
    };
  }, [load]);

  const refreshErrorEventId =
    state.status === "ready" ? (state.refreshError?.eventId ?? null) : null;
  useEffect(() => {
    if (refreshErrorEventId === null) return;
    refreshErrorRef.current
      ?.querySelector<HTMLButtonElement>("[data-ui='salesperf-refresh-retry']")
      ?.focus();
  }, [refreshErrorEventId]);

  const changeRange = (next: string) => {
    const parsed = Number(next) as SalesPerformanceRangeMonths;
    if (!SALES_PERFORMANCE_RANGES.includes(parsed) || parsed === rangeMonths) return;
    const focusTarget = document.activeElement;
    refreshFocusTargetRef.current =
      focusTarget instanceof HTMLElement ? focusTarget : null;
    restoreRefreshFocusRef.current = false;
    onRangeMonthsChange(parsed);
    setState((current) =>
      current.status === "ready"
        ? { ...current, refreshing: true, refreshError: null }
        : { status: "loading" },
    );
  };

  const registerAssigneeControl = useCallback((node: HTMLElement | null) => {
    assigneeControlRef.current = node;
  }, []);

  const fmtCompact = useCallback(
    (v: number) => formatNumber(v, tag, { notation: "compact", maximumFractionDigits: 1 }),
    [tag],
  );
  const fmtTenthsPct = useCallback(
    (tenths: bigint) => formatScaledPct(tenths, BigInt(10), tag),
    [tag],
  );
  const fmtRatioPct = useCallback(
    (permyriad: bigint) => formatPermyriadPct(permyriad, tag),
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
  /** 차트 x 축 라벨 — "26.05" (B3 월 축 표기와 동일). */
  const axisLabel = useCallback((iso: string) => `${iso.slice(2, 4)}.${iso.slice(5, 7)}`, []);

  // ── ready 파생 데이터 ──
  const data = state.status === "ready" ? state.data : null;
  const statusItems = useMemo(() => data?.status.items ?? [], [data]);
  const statusItemChunks = useMemo(
    () =>
      Array.from(
        { length: Math.ceil(statusItems.length / STATUS_TABLE_CHUNK_SIZE) },
        (_, chunkIndex) => {
          const start = chunkIndex * STATUS_TABLE_CHUNK_SIZE;
          return statusItems.slice(start, start + STATUS_TABLE_CHUNK_SIZE);
        },
      ),
    [statusItems],
  );
  const currencies = useMemo(
    () => deriveCockpitCurrencies(data?.series ?? null, data?.gp ?? null, statusItems),
    [data, statusItems],
  );
  const currency =
    currencyChoice && currencies.includes(currencyChoice) ? currencyChoice : currencies[0] ?? null;
  const fmtAmount = useCallback(
    (value: AmountCell | bigint | string | null | undefined, amountCurrency: string | null = currency) => {
      if (value == null) return "—";
      let scaled: bigint;
      if (typeof value === "object") {
        if (!value.valid) return "—";
        scaled = value.scaled;
      } else if (typeof value === "string") {
        const cell = amountCell(value);
        if (!cell.valid) return "—";
        scaled = cell.scaled;
      } else {
        scaled = value;
      }
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

  const seriesKpi = useMemo(
    () => (data && currency ? latestSeriesKpi(data.series, currency) : null),
    [currency, data],
  );
  const gpPoints = useMemo(
    () => (data && currency ? gpForCurrency(data.gp, currency) : []),
    [currency, data],
  );
  const gpKpi = useMemo(() => computeGpKpi(gpPoints), [gpPoints]);
  const dealsSummary = useMemo(() => activeDealsSummary(statusItems), [statusItems]);
  // 연체 KPI 는 테이블과 같은 "오늘 기준"(status as-of) — overdueFromStatus 주석.
  const statusOverdue = useMemo(
    () => (currency ? overdueFromStatus(statusItems, currency) : BigInt(0)),
    [currency, statusItems],
  );
  const byAssigneeRows = useMemo(
    () => (data?.byAssignee && currency ? assigneeGpRows(data.byAssignee, currency) : []),
    [currency, data],
  );

  // ── 상태 화면 ──
  // erp-v2-adapt: begin — QA-1352 keeps plan, subscription, billing, and role guidance distinct.
  if (state.status === "gated") {
    return (
      <section data-component="SalesPerformanceConnected" data-reason={state.reason} data-state="gated" role="alert">
        {renderHeader?.(null)}
        <InsightsGateNotice copy={copy} reason={state.reason} />
      </section>
    );
  }
  // erp-v2-adapt: end

  if (state.status === "loading") {
    return (
      <section className="flex flex-col gap-4" data-component="SalesPerformanceConnected" data-state="loading">
        {renderHeader?.(null)}
        <AnalyticsSkeleton kind="sales-performance" label={copy.loading} />
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section
        className="flex flex-col items-start gap-3"
        data-component="SalesPerformanceConnected"
        data-state="error"
        role="alert"
      >
        {renderHeader?.(null)}
        <InfoBox tone="risk" title={copy.errorTitle} description={state.message} />
        <Button
          onClick={() => {
            setState({ status: "loading" });
            load();
          }}
          size="md"
          type="button"
          variant="tertiary"
        >
          {copy.retry}
        </Button>
      </section>
    );
  }

  const memberDirectory =
    memberDirectoryState.orgId === orgId
      ? memberDirectoryState
      : ({ orgId, status: "loading" } satisfies MemberDirectoryState);
  const members =
    memberDirectory.status === "ready" ? memberDirectory.members : [];
  const currencyLabel = currency ?? "";

  // 스코프 라벨은 BE 의 실효 에코(assignee)로 판정 — member 는 필터를 보내지
  // 않아도 본인 uuid 가 에코된다(본인 고정을 화면이 그대로 말해 준다).
  const effectiveAssignee = data?.status.assignee ?? null;
  const scopeText =
    effectiveAssignee == null
      ? copy.controls.scopeOrg
      : isManager
        ? replaceTokens(copy.controls.scopePerson, {
            name: assigneeLabel(effectiveAssignee, members, copy.byAssignee.unassigned),
          })
        : copy.controls.scopeSelf;

  const assigneeOptions = [
    { value: ASSIGNEE_ALL, label: copy.controls.assigneeAll },
    ...members
      .map((m) => ({ value: m.user_id, label: memberLabel(m) }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ];

  const gpExclusion = gpWindowExclusion(data?.gp ?? null, copy.gpTrend);

  const maxAbsGp = byAssigneeRows.length > 0
    ? Math.max(...byAssigneeRows.map((r) => Math.abs(r.gp.approx)))
    : 0;
  const kpiPeriodLabel = seriesKpi ? monthName(seriesKpi.periodStart) : "";
  const gpPeriodLabel = gpKpi.latest ? monthName(gpKpi.latest.periodStart) : "";
  const gpKpiBasis = gpKpiBasisText(gpKpi.latest, copy.kpi);
  const gpKpiCaution = gpKpiCautionText(gpKpi.latest, copy.kpi);
  const empty = currencies.length === 0 && statusItems.length === 0;
  const showByAssignee = data?.byAssignee != null;
  const statusLimitReached = statusItems.length >= STATUS_FETCH_LIMIT;
  const statusLimitText = replaceTokens(copy.table.truncated, {
    count: String(STATUS_FETCH_LIMIT),
  });
  const overdueAmount = statusOverdue != null ? fmtAmount(statusOverdue) : "—";
  const overdueLimitedText = copy.kpi.overdueAmountLimited
    ? replaceTokens(copy.kpi.overdueAmountLimited, {
        amount: overdueAmount,
        limit: String(STATUS_FETCH_LIMIT),
      })
    : statusOverdue != null
      ? `${replaceTokens(copy.kpi.overdueAmount, {
          amount: `≥ ${overdueAmount}`,
        })} · ${statusLimitText}`
      : replaceTokens(copy.kpi.overdueAmount, { amount: overdueAmount });
  const activeDealsLimitedSub = copy.kpi.activeDealsLimitedSub
    ? replaceTokens(copy.kpi.activeDealsLimitedSub, {
        counterparties: String(dealsSummary.counterparties),
        limit: String(STATUS_FETCH_LIMIT),
      })
    : `${replaceTokens(copy.kpi.activeDealsSub, {
        count: `≥ ${dealsSummary.counterparties}`,
      })} · ${statusLimitText}`;
  const byAssigneeTitle = copy.byAssignee.titleLimited
    ? replaceTokens(copy.byAssignee.titleLimited, {
        count: String(BY_ASSIGNEE_LIMIT),
      })
    : `${copy.byAssignee.title} · Top ${BY_ASSIGNEE_LIMIT}`;
  const byAssigneeRangeText = replaceTokens(copy.byAssignee.sub, {
    count: String(state.data.rangeMonths),
    currency: currencyLabel,
  }).split("—", 1)[0]!.trim();
  const byAssigneeSub = `${byAssigneeRangeText} — ${copy.byAssignee.scope ?? copy.byAssignee.title}`;
  const byAssigneeLimitReached = byAssigneeRows.length >= BY_ASSIGNEE_LIMIT;
  const byAssigneeLimitText = copy.byAssignee.limitReached
    ? replaceTokens(copy.byAssignee.limitReached, {
        count: String(BY_ASSIGNEE_LIMIT),
      })
    : `${byAssigneeTitle} · ≥ ${BY_ASSIGNEE_LIMIT}`;

  const retryManagerDirectory = () => {
    setMemberDirectoryState({ orgId, status: "loading" });
    loadManagerDirectory();
  };

  const summary = !empty ? (
<div
            className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1"
            data-ui="salesperf-kpis"
          >
            <KpiTile
              label={replaceTokens(copy.kpi.revenue, { period: kpiPeriodLabel, currency: currencyLabel })}
              value={seriesKpi ? fmtAmount(seriesKpi.planned) : "—"}
              delta={
                seriesKpi
                  ? {
                      text:
                        seriesKpi.receivedRatioPctTenths != null
                          ? replaceTokens(copy.kpi.revenueSub, {
                              received: fmtAmount(seriesKpi.received),
                              ratio: fmtTenthsPct(seriesKpi.receivedRatioPctTenths),
                            })
                          : replaceTokens(copy.kpi.revenueNoPlan, { received: fmtAmount(seriesKpi.received) }),
                      tone: "flat",
                    }
                  : null
              }
            />
            <KpiTile
              label={replaceTokens(copy.kpi.gp, { period: gpPeriodLabel, currency: currencyLabel })}
              value={gpKpi.latest ? fmtAmount(gpKpi.latest.gp) : "—"}
              basis={gpKpiBasis}
              caution={gpKpiCaution}
              delta={
                gpKpi.marginPermyriad != null
                  ? {
                      text: replaceTokens(copy.kpi.gpMargin, {
                        margin: fmtRatioPct(gpKpi.marginPermyriad),
                      }),
                      tone: "flat",
                    }
                  : null
              }
            />
            <KpiTile
              label={replaceTokens(copy.kpi.outstanding, { currency: currencyLabel })}
              value={seriesKpi ? fmtAmount(seriesKpi.outstandingEnd) : "—"}
              delta={
                seriesKpi
                  ? statusOverdue == null
                    ? {
                        text: replaceTokens(copy.kpi.overdueAmount, { amount: "—" }),
                        tone: "flat",
                      }
                    : statusLimitReached
                      ? {
                          text: overdueLimitedText,
                          tone: statusOverdue > BigInt(0) ? "bad" : "flat",
                        }
                      : statusOverdue > BigInt(0)
                        ? {
                            // 연체 존재 = 리스크(레드) — B3 미수/연체 톤 관례.
                            // 소스는 status(오늘 기준) — 시계열 진행 월은 월말 투영치.
                            text: replaceTokens(copy.kpi.overdueAmount, { amount: overdueAmount }),
                            tone: "bad",
                          }
                        : { text: copy.kpi.noOverdue, tone: "up" }
                  : null
              }
            />
            <KpiTile
              label={copy.kpi.activeDeals}
              value={statusLimitReached ? `≥ ${dealsSummary.deals}` : String(dealsSummary.deals)}
              delta={{
                text: statusLimitReached
                  ? activeDealsLimitedSub
                  : replaceTokens(copy.kpi.activeDealsSub, {
                      count: String(dealsSummary.counterparties),
                    }),
                tone: "flat",
              }}
            />
          </div>
  ) : undefined;

  const controls = (
    <BusinessListToolbar
      data-ui="salesperf-controls"
      aria-label="영업 성과 필터"
      result={
        <span
          className="text-label-12 text-text-disabled"
          data-ui="salesperf-scope"
        >
          {scopeText}
        </span>
      }
    >
      <BusinessFilterField label={copy.controls.rangeAria}>
        <Segmented
          ariaLabel={copy.controls.rangeAria}
          options={SALES_PERFORMANCE_RANGES.map((months) => ({
            id: String(months),
            label: replaceTokens(copy.controls.rangeMonths, {
              count: String(months),
            }),
          }))}
          value={String(rangeMonths)}
          onChange={changeRange}
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
          data-ui="salesperf-assignee-filter"
        >
          <Select
            aria-label={copy.controls.assigneeAria}
            options={assigneeOptions}
            placeholder={copy.controls.assigneeAll}
            registerControl={registerAssigneeControl}
            size="sm"
            value={assigneeFilter ?? ASSIGNEE_ALL}
            onValueChange={(value) => {
              const next = value === ASSIGNEE_ALL ? null : value
              // 동일 항목 재선택은 no-op — load 의존성이 안 바뀌어 refetch 가
              // 없으므로 loading 으로 두면 영구 로딩에 갇힌다(적대 리뷰).
              if (next === assigneeFilter) return
              refreshFocusTargetRef.current = assigneeControlRef.current
              restoreRefreshFocusRef.current = false
              setAssigneeFilter(next)
              setState((current) =>
                current.status === "ready"
                  ? { ...current, refreshing: true, refreshError: null }
                  : { status: "loading" }
              )
            }}
          />
        </BusinessFilterField>
      ) : null}
    </BusinessListToolbar>
  )

  return (
    <div
      aria-busy={state.refreshing}
      className="flex flex-col gap-4"
      data-component="SalesPerformanceConnected"
      data-refresh-error={state.refreshError ? "true" : undefined}
      data-state={state.refreshing ? "refreshing" : "ready"}
    >
      {renderHeader ? renderHeader(controls, summary) : controls}

      {isManager && memberDirectory.status === "error" ? (
        <div
          className="flex flex-col items-start gap-3"
          data-ui="salesperf-directory-error"
          role="alert"
        >
          <InfoBox
            tone="risk"
            title={copy.directoryErrorTitle ?? copy.errorTitle}
            description={memberDirectory.message}
          />
          <Button
            onClick={retryManagerDirectory}
            size="md"
            type="button"
            variant="tertiary"
          >
            {copy.directoryRetry ?? copy.retry}
          </Button>
        </div>
      ) : null}

      {state.refreshError ? (
        <div
          className="flex flex-col items-start gap-3"
          data-ui="salesperf-refresh-error"
          ref={refreshErrorRef}
          role="alert"
        >
          <InfoBox
            tone="risk"
            title={copy.refreshErrorTitle ?? copy.errorTitle}
            description={state.refreshError.message}
          />
          <Button
            disabled={state.refreshing}
            onClick={() => {
              if (state.refreshing || refreshRetryInFlightRef.current) return;
              refreshRetryInFlightRef.current = true;
              setState((current) =>
                current.status === "ready"
                  ? { ...current, refreshing: true }
                  : current,
              );
              load();
            }}
            data-ui="salesperf-refresh-retry"
            size="md"
            type="button"
            variant="tertiary"
          >
            {copy.retry}
          </Button>
        </div>
      ) : null}
      {empty ? (
        <InfoBox tone="neutral" title={copy.emptyTitle} description={copy.emptyBody} />
      ) : (
        <>
          {/* ── 상단 내 숫자 (D10: 월 매출·손익·미수·진행 딜) ── */}
          {!renderHeader && summary}

          {/* ── GP: 내 월별 추세 + (org 전체 뷰) 담당자별 랭킹 ── */}
          <div
            className={cx(
              "grid items-start gap-4 max-lg:grid-cols-1",
              showByAssignee ? "grid-cols-[minmax(0,1.9fr)_minmax(0,1.1fr)]" : "grid-cols-1",
            )}
          >
            <ReportCard
              title={copy.gpTrend.title}
              sub={
                <>
                  {replaceTokens(copy.gpTrend.sub, { currency: currencyLabel })}
                  {gpExclusion.text ? (
                    <>
                      {" — "}
                      <span
                        className={gpExclusion.unknown ? "text-text-muted" : "text-status-danger"}
                        data-ui={
                          gpExclusion.unknown ? "salesperf-gp-excluded-unknown" : "salesperf-gp-excluded"
                        }
                      >
                        {gpExclusion.text}
                      </span>{" "}
                      {gpExclusion.unknown ? null : (
                        <>
                          {copy.gpTrend.excludedWindowNote}
                          {gpExclusion.mixedPresent ? (
                            <>
                              {" "}
                              {copy.gpTrend.excludedSuffix}
                            </>
                          ) : null}
                        </>
                      )}
                    </>
                  ) : null}
                </>
              }
            >
              <GpBarChart
                ariaLabel={copy.gpTrend.aria}
                formatAxisValue={fmtCompact}
                formatBarLabel={fmtCompact}
                points={gpPoints.map((p) => ({
                  key: p.periodStart,
                  xLabel: axisLabel(p.periodStart),
                  gp: p.gp.approx,
                  hasData: p.hasData,
                  tooltip: p.hasData ? (
                    <>
                      <span className="font-bold">{yearMonth(p.periodStart)}</span>
                      <br />
                      {copy.gpTrend.gpLabel} {fmtAmount(p.gp)} {currencyLabel}
                      {p.marginPermyriad != null ? (
                        <>
                          <br />
                          {copy.gpTrend.marginLabel} {fmtRatioPct(p.marginPermyriad)}
                        </>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <span className="font-bold">{yearMonth(p.periodStart)}</span>
                      <br />
                      {copy.gpTrend.noData}
                    </>
                  ),
                }))}
              />
            </ReportCard>

            {showByAssignee ? (
              <ReportCard
                title={byAssigneeTitle}
                sub={byAssigneeSub}
              >
                {byAssigneeRows.length === 0 ? (
                  <p className="mt-3 text-body-13 text-text-muted">{copy.byAssignee.empty}</p>
                ) : (
                  <>
                    <div className="mt-3.5 grid gap-3" data-ui="salesperf-by-assignee">
                      {byAssigneeRows.map((row) => (
                        <div key={row.assigneeUserId ?? "unassigned"} className="grid gap-1">
                          <div className="flex justify-between text-body-13">
                            <span className="font-medium text-ecoya-gray-3">
                              {assigneeLabel(row.assigneeUserId, members, copy.byAssignee.unassigned)}
                            </span>
                            <span
                              className={cx(
                                "tabular-nums",
                                row.gp.scaled < BigInt(0) ? "text-status-danger" : "text-text-secondary",
                              )}
                            >
                              {fmtAmount(row.gp)} {currencyLabel}
                            </span>
                          </div>
                          <div className="rounded-r bg-surface-muted">
                            <div
                              className={cx(
                                "h-3.5 rounded-r",
                                row.gp.scaled < BigInt(0)
                                  ? "bg-ecoya-system-red-1"
                                  : "bg-ecoya-accent",
                              )}
                              style={{ width: `${maxAbsGp > 0 ? (Math.abs(row.gp.approx) / maxAbsGp) * 100 : 0}%` }}
                            />
                          </div>
                          <div className="text-body-13 text-text-secondary tabular-nums">
                            {replaceTokens(copy.byAssignee.metaLine, {
                              margin:
                                row.marginPermyriad != null
                                  ? fmtRatioPct(row.marginPermyriad)
                                  : "—",
                              count: String(row.dealCount),
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    {byAssigneeLimitReached ? (
                      <p
                        className="mt-3 text-label-12 text-ecoya-system-orange-1"
                        data-ui="salesperf-by-assignee-limit"
                      >
                        {byAssigneeLimitText}
                      </p>
                    ) : null}
                  </>
                )}
              </ReportCard>
            ) : null}
          </div>

          {/* ── 하단 거래처 상태 테이블 (D10) — 서버 순서 = 주의 필요 순, 재정렬 금지 ── */}
          <ReportCard
            title={copy.table.title}
            sub={
              <>
                {isManager ? copy.table.subOrg : copy.table.subSelf}
                {data ? <> · {replaceTokens(copy.table.asOf, { date: monthDay(data.status.as_of) })}</> : null}
                {/* BE 클램프 상한에 닿으면 절단 가능성 고지 — 숫자가 전체처럼 읽히지 않게. */}
                {statusLimitReached ? <> · {statusLimitText}</> : null}
              </>
            }
          >
            {statusItems.length === 0 ? (
              <p className="mt-3 text-body-13 text-text-muted">{copy.table.empty}</p>
            ) : (
              <div className="mt-3 overflow-x-auto" data-ui="salesperf-status-scroll">
                <div className="min-w-[1200px]" data-ui="salesperf-status-table">
                  {statusItemChunks.map((chunk, chunkIndex) => {
                    const chunkStart = chunkIndex * STATUS_TABLE_CHUNK_SIZE;
                    const chunkEnd = chunkStart + chunk.length;
                    const estimatedBlockSize =
                      chunk.length * STATUS_TABLE_ROW_ESTIMATED_BLOCK_SIZE_PX +
                      (chunkIndex === 0 ? STATUS_TABLE_ROW_ESTIMATED_BLOCK_SIZE_PX : 0);
                    return (
                      <div
                        key={chunkStart}
                        data-row-end={chunkEnd}
                        data-row-start={chunkStart + 1}
                        data-ui="salesperf-status-chunk"
                        style={{
                          ...STATUS_CHUNK_DEFERRED_RENDER_STYLE,
                          containIntrinsicBlockSize: `auto ${estimatedBlockSize}px`,
                        }}
                      >
                        <HostTable
                          aria-label={`${copy.table.title} ${chunkStart + 1}-${chunkEnd}`}
                          className="w-full table-fixed border-collapse text-body-13 tabular-nums"
                        >
                          <colgroup>
                            <col className="w-[24%]" />
                            <col className="w-[7%]" />
                            <col className="w-[9%]" />
                            <col className="w-[9%]" />
                            <col className="w-[9%]" />
                            <col className="w-[16%]" />
                            <col className="w-[7%]" />
                            <col className="w-[7%]" />
                            <col className="w-[7%]" />
                            <col className="w-[5%]" />
                          </colgroup>
                          <HostTableHeader className={chunkIndex === 0 ? undefined : "sr-only"}>
                            <HostTableRow className="border-b border-border-muted text-left text-label-12 text-text-muted">
                              <HostTableHead className="py-1.5 pr-3 font-medium">{copy.table.columns.counterparty}</HostTableHead>
                              <HostTableHead className="py-1.5 pr-3 font-medium">{copy.table.columns.currency}</HostTableHead>
                              <HostTableHead className="py-1.5 pr-3 text-right font-medium">{copy.table.columns.totalDue}</HostTableHead>
                              <HostTableHead className="py-1.5 pr-3 text-right font-medium">{copy.table.columns.outstanding}</HostTableHead>
                              <HostTableHead className="py-1.5 pr-3 text-right font-medium">{copy.table.columns.overdue}</HostTableHead>
                              <HostTableHead className="py-1.5 pr-3 font-medium">{copy.table.columns.nextDue}</HostTableHead>
                              <HostTableHead className="py-1.5 pr-3 text-right font-medium">{copy.table.columns.shipments}</HostTableHead>
                              <HostTableHead className="py-1.5 pr-3 text-right font-medium">{copy.table.columns.docs}</HostTableHead>
                              <HostTableHead className="py-1.5 pr-3 font-medium">{copy.table.columns.lastActivity}</HostTableHead>
                              <HostTableHead className="py-1.5 text-right font-medium">{copy.table.columns.activeDeals}</HostTableHead>
                            </HostTableRow>
                          </HostTableHeader>
                          <HostTableBody>
                            {chunk.map((item, chunkOffset) => {
                              const rowIndex = chunkStart + chunkOffset;
                              const overdue = amountCell(item.overdue);
                              return (
                                <HostTableRow
                                  key={`${item.counterparty}-${item.currency}`}
                                  className={
                                    rowIndex === statusItems.length - 1
                                      ? undefined
                                      : "border-b border-border-muted"
                                  }
                                  data-overdue={overdue.valid && overdue.scaled > BigInt(0) ? "true" : undefined}
                                >
                                  <HostTableCell className="break-words py-1.5 pr-3 font-medium text-text-primary">
                                    {item.counterparty}
                                  </HostTableCell>
                                  <HostTableCell className="py-1.5 pr-3 text-text-secondary">{item.currency}</HostTableCell>
                                  <HostTableCell className="py-1.5 pr-3 text-right">
                                    {fmtAmount(item.total_due, item.currency)}
                                  </HostTableCell>
                                  <HostTableCell className="py-1.5 pr-3 text-right">
                                    {fmtAmount(item.outstanding, item.currency)}
                                  </HostTableCell>
                                  <HostTableCell
                                    className={cx(
                                      "py-1.5 pr-3 text-right",
                                      overdue.valid && overdue.scaled > BigInt(0) && "font-semibold text-status-danger",
                                    )}
                                  >
                                    {fmtAmount(overdue, item.currency)}
                                  </HostTableCell>
                                  <HostTableCell className="py-1.5 pr-3 whitespace-nowrap">
                                    {item.next_due_date
                                      ? `${monthDay(item.next_due_date)} · ${fmtAmount(item.next_due_amount, item.currency)}`
                                      : copy.table.none}
                                  </HostTableCell>
                                  <HostTableCell className="py-1.5 pr-3 text-right">{item.upcoming_shipments}</HostTableCell>
                                  <HostTableCell className="py-1.5 pr-3 text-right">{item.recent_docs}</HostTableCell>
                                  <HostTableCell className="py-1.5 pr-3 whitespace-nowrap">
                                    {item.last_activity ? monthDay(item.last_activity) : copy.table.none}
                                  </HostTableCell>
                                  <HostTableCell className="py-1.5 text-right">{item.active_deals}</HostTableCell>
                                </HostTableRow>
                              );
                            })}
                          </HostTableBody>
                        </HostTable>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </ReportCard>
        </>
      )}
    </div>
  );
}

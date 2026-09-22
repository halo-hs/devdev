"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@trade-os/operations/components/ui/button";
import { InfoBox } from "@trade-os/operations/components/InfoBox";
import { AnalyticsSkeleton } from "@trade-os/operations/components/AnalyticsSkeleton";
import { useScreenToast } from "@trade-os/operations/components/toast/useToast";
import { MonitorBody, type MonitorBodyCopy } from "@trade-os/operations/components/screens/MonitorScreen";
import { MonitorDealsOpsPanels, type MonitorOpsCopy } from "@trade-os/operations/monitor/MonitorDealsOpsPanels";
import { usePlatformAuth } from "@trade-os/operations/session/PlatformSessionContext";
import { ApiError } from "@trade-os/operations/lib/api/client";
import { ackFlag, listFlags } from "@trade-os/operations/lib/api/flags";
import {
  DEFAULT_MONITOR_SNAPSHOT_OPTIONS,
  getMonitorSnapshot,
  type MonitorAreaUpdate,
  type MonitorLimit,
  type MonitorPeriod,
  type MonitorSnapshot,
  type MonitorSnapshotArea,
} from "@trade-os/operations/lib/api/monitor";
import { getSettlementOverview, type AgingCell } from "@trade-os/operations/lib/api/settlement";
import { withRetry } from "@trade-os/operations/lib/api/retry";
import { useLocaleTag } from "@trade-os/operations/i18n/useLocaleTag";

import { ExceptionCenter } from "./ExceptionCenter";
import {
  DEFAULT_MONITOR_LIVE_COPY,
  mapMonitorSnapshot,
  mapUncheckedFlags,
  type MonitorLiveCopy,
  type MonitorLiveView,
  type MonitorSettlementAgingSource,
} from "./mapMonitorLive";
import { isMonitorAreaTimestampEnabled } from "./monitorRollout";

type LoadState =
  | { status: "loading" }
  | { status: "forbidden" }
  | { status: "error"; message: string; previousLive?: MonitorLiveView }
  | {
      status: "ready";
      live: MonitorLiveView;
      partialErrors: string[];
      partialAreas: MonitorSnapshotArea[];
    };

type FlagRefreshError = {
  message: string;
  checked: boolean;
};

type SettlementAgingLoadState = "idle" | "pending" | "ready" | "error";

// Locale copy for the connected wrapper's own load states (forbidden / loading
// / error). Optional with English defaults so the showcase + tests stay
// correct; MonitorProtectedPage injects the org locale from erp-monitor.
export type MonitorStateCopy = {
  forbiddenTitle: string;
  forbiddenDescription: string;
  loading: string;
  errorTitle: string;
  loadFailed: string;
  ownerRequired: string;
  signedOut: string;
  errorScope: string;
  partialTitle?: string;
  partialDescription?: string;
};

type MonitorConnectedBodyCopy = Partial<MonitorBodyCopy> & {
  readonly flagRefreshFailed?: string;
};

const DEFAULT_MONITOR_SNAPSHOT_AREAS: readonly MonitorSnapshotArea[] = [
  "kpi",
  "status",
  "risks",
  "pending",
  "blockedP0",
  "blockedP1",
  "throughput",
];
const MONITOR_AREAS = DEFAULT_MONITOR_SNAPSHOT_AREAS;

const DEFAULT_STATE_COPY: MonitorStateCopy = {
  forbiddenTitle: "Monitoring is owner-only",
  forbiddenDescription:
    "Sign in with an Owner role to see team throughput, blocked documents, and risks. Run operational checks from the upload inbox.",
  loading: "Loading Monitor data…",
  errorTitle: "Failed to load Monitor",
  loadFailed: "Couldn't load Monitor data.",
  ownerRequired: "Owner permission is required.",
  signedOut: "Sign-in is required.",
  errorScope: "Affected scope: whole organization",
  partialTitle: "Some Monitor areas are unavailable",
  partialDescription: "Successful areas stay visible. Retry only the affected areas.",
};

export type MonitorAckCopy = {
  success: string;
  already: string;
  error: string;
};

// MonitorBody 하드코드 카피와 같은 영어 기본값 — MonitorProtectedPage 가
// erp-monitor `screen.areaLoadFailed` 로 로케일 문구를 주입한다.
const DEFAULT_AREA_LOAD_FAILED = "Load failed";

const DEFAULT_ACK_COPY: MonitorAckCopy = {
  success: "Flag marked as checked.",
  already: "This item was already checked. It was removed from the list.",
  error: "Could not mark the flag as checked. Please try again shortly.",
};

type MonitorConnectedProps = {
  canAccess: boolean;
  loadErrorLabel?: string;
  retryLabel?: string;
  opsCopy?: MonitorOpsCopy;
  // 정본 MonitorBody 하드코드 카피의 로케일 주입(MonitorShell 이 erp-monitor + erp-common 에서 조립).
  bodyCopy?: MonitorConnectedBodyCopy;
  // forbidden/loading/error 상태 카피 — MonitorShell 이 erp-monitor 에서 주입.
  stateCopy?: MonitorStateCopy;
  ackCopy?: MonitorAckCopy;
  // W8-V2a: 스냅샷 매퍼 카피(erp-monitor.monitor.live) — 미주입 시 영어 기본.
  liveCopy?: MonitorLiveCopy;
};

function errorMessage(err: unknown, copy: MonitorStateCopy): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return copy.ownerRequired;
    return err.message || copy.loadFailed;
  }
  if (err instanceof Error && err.message === "signed-out") {
    return copy.signedOut;
  }
  return copy.loadFailed;
}

type MonitorSnapshotWithLegacyMeta = MonitorSnapshot & { data_as_of?: string };

function mergeMonitorSnapshots(
  previous: MonitorSnapshot,
  incoming: MonitorSnapshot,
  replacedAreas: readonly MonitorSnapshotArea[] = MONITOR_AREAS,
): MonitorSnapshot {
  const merged: MonitorSnapshotWithLegacyMeta = {
    ...previous,
    partial_errors: { ...previous.partial_errors, ...incoming.partial_errors },
    area_meta: { ...previous.area_meta },
  };
  const staleAreas = new Set<MonitorSnapshotArea>();

  for (const area of MONITOR_AREAS) {
    const nextArea = incoming[area];
    if (nextArea === undefined) continue;
    const previousMeta = previous.area_meta?.[area];
    const nextMeta = incoming.area_meta?.[area];
    if (
      previousMeta &&
      nextMeta &&
      Number.isFinite(Date.parse(previousMeta.data_as_of)) &&
      Number.isFinite(Date.parse(nextMeta.data_as_of)) &&
      Date.parse(nextMeta.data_as_of) < Date.parse(previousMeta.data_as_of)
    ) {
      staleAreas.add(area);
      merged.partial_errors = {
        ...merged.partial_errors,
        [area]: "Older monitor response ignored",
      };
      continue;
    }
    merged[area] = nextArea as never;
    if (nextMeta) merged.area_meta = { ...merged.area_meta, [area]: nextMeta };
    if (merged.partial_errors?.[area] && !incoming.partial_errors?.[area]) {
      const { [area]: _ignored, ...remainingErrors } = merged.partial_errors;
      merged.partial_errors = remainingErrors;
    }
  }

  if (typeof (incoming as MonitorSnapshotWithLegacyMeta).data_as_of === "string") {
    merged.data_as_of = (incoming as MonitorSnapshotWithLegacyMeta).data_as_of;
  }
  if (!incoming.partial_errors) {
    for (const area of replacedAreas) {
      if (staleAreas.has(area)) continue;
      if (!merged.partial_errors?.[area]) continue;
      const { [area]: _ignored, ...remainingErrors } = merged.partial_errors;
      merged.partial_errors = remainingErrors;
    }
  }
  if (Object.keys(merged.partial_errors ?? {}).length === 0) delete merged.partial_errors;
  if (Object.keys(merged.area_meta ?? {}).length === 0) delete merged.area_meta;
  return merged;
}

function partialMonitorMessages(snapshot: MonitorSnapshot, staleLabel: string): string[] {
  const messages = Object.entries(snapshot.partial_errors ?? {}).map(([area, message]) => `${area}: ${message}`);
  for (const area of Object.keys(snapshot.area_meta ?? {})) {
    if (snapshot.partial_errors?.[area as MonitorSnapshotArea] !== undefined) {
      messages.push(`${area}: ${staleLabel}`);
    }
  }
  return messages;
}

function snapshotFromAreaUpdate(update: MonitorAreaUpdate): MonitorSnapshot {
  if (update.error) {
    return { partial_errors: { [update.area]: update.error } };
  }
  return {
    [update.area]: update.data,
    ...(update.meta ? { area_meta: { [update.area]: update.meta } } : {}),
  } as MonitorSnapshot;
}

export function MonitorConnected({
  canAccess,
  loadErrorLabel,
  retryLabel = "Retry",
  opsCopy,
  bodyCopy,
  stateCopy = DEFAULT_STATE_COPY,
  ackCopy = DEFAULT_ACK_COPY,
  liveCopy = DEFAULT_MONITOR_LIVE_COPY,
}: MonitorConnectedProps) {
  const { getIdToken } = usePlatformAuth();
  const moneyLocale = useLocaleTag();
  const toast = useScreenToast();
  const [state, setState] = useState<LoadState>(
    canAccess ? { status: "loading" } : { status: "forbidden" },
  );
  // FS-06 §2의 운영 감시 플래그는 확인 전 / 확인함 전환을 제공한다(#421).
  // 계약(`owner_checked`)이 양쪽을 지원하므로 화면이 전환 필터를 제공한다.
  const [flagChecked, setFlagChecked] = useState(false);
  const [flagRefreshError, setFlagRefreshError] = useState<FlagRefreshError | null>(null);
  const [flagsPending, setFlagsPending] = useState(false);
  // SC-13 §구역·행동·호출: KPI·상태·처리량의 "기간·수량 필터, 새로고침". 선택값은 요청
  // 파라미터이므로 ref 로도 들고 있어 loadMonitor 의 identity 가 필터 때문에 바뀌지 않게 한다
  // (바뀌면 mount effect 가 재실행되어 필터 조작마다 플래그까지 다시 부른다).
  const [period, setPeriod] = useState<MonitorPeriod>(DEFAULT_MONITOR_SNAPSHOT_OPTIONS.period);
  const [limit, setLimit] = useState<MonitorLimit>(DEFAULT_MONITOR_SNAPSHOT_OPTIONS.limit);
  const [monitorPending, setMonitorPending] = useState(false);
  const periodRef = useRef<MonitorPeriod>(DEFAULT_MONITOR_SNAPSHOT_OPTIONS.period);
  const limitRef = useRef<MonitorLimit>(DEFAULT_MONITOR_SNAPSHOT_OPTIONS.limit);
  const [ackingIds, setAckingIds] = useState<ReadonlySet<string>>(new Set());
  const ackingIdsRef = useRef(new Set<string>());
  const flagCheckedRef = useRef(false);
  const snapshotRef = useRef<MonitorSnapshot>({});
  const settlementAgingRef = useRef<AgingCell[] | null | undefined>(undefined);
  const settlementAgingStateRef = useRef<SettlementAgingLoadState>("idle");
  const settlementErrorRef = useRef<string | null>(null);
  const flagViewRef = useRef<Pick<MonitorLiveView, "flagItems" | "flagBadge">>({
    flagItems: [],
    flagBadge: "—",
  });
  const readySnapshotRef = useRef<MonitorSnapshot>({});
  const readyLiveRef = useRef<MonitorLiveView | null>(null);
  const monitorFetchId = useRef(0);
  const flagsFetchId = useRef(0);

  const setFlagCheckedSelection = useCallback((checked: boolean) => {
    flagCheckedRef.current = checked;
    setFlagChecked(checked);
  }, []);

  const loadMonitor = useCallback(
    (
      checked = flagCheckedRef.current,
      restoreChecked?: boolean,
      requestedAreas: readonly MonitorSnapshotArea[] = MONITOR_AREAS,
      includeFlags = true,
    ) => {
      if (!canAccess) {
        monitorFetchId.current += 1;
        flagsFetchId.current += 1;
        setFlagsPending(false);
        setMonitorPending(false);
        readySnapshotRef.current = {};
        readyLiveRef.current = null;
        snapshotRef.current = {};
        settlementAgingRef.current = undefined;
        settlementAgingStateRef.current = "idle";
        settlementErrorRef.current = null;
        setFlagRefreshError(null);
        setState({ status: "forbidden" });
        return;
      }

      const monitorAreas = [...new Set(requestedAreas)].filter((area): area is MonitorSnapshotArea =>
        MONITOR_AREAS.includes(area),
      );
      const previousReadyLive = readyLiveRef.current;
      const monitorEventId = monitorAreas.length > 0 ? monitorFetchId.current + 1 : monitorFetchId.current;
      if (monitorAreas.length > 0) monitorFetchId.current = monitorEventId;
      const flagsEventId = includeFlags ? flagsFetchId.current + 1 : flagsFetchId.current;
      if (includeFlags) flagsFetchId.current = flagsEventId;
      const shouldLoadSettlementAging = monitorAreas.includes("risks");
      if (shouldLoadSettlementAging) {
        settlementAgingStateRef.current = "pending";
        settlementErrorRef.current = null;
      }
      if (includeFlags) {
        setFlagsPending(true);
        setFlagRefreshError(null);
      }
      if (monitorAreas.length > 0) setMonitorPending(true);
      setState((previous) => (previous.status === "ready" ? previous : { status: "loading" }));

      let streamedArea = false;
      let monitorRequestSettled = monitorAreas.length === 0;
      let terminalMonitorState = false;
      const setWholeMonitorError = (message = stateCopy.loadFailed) => {
        terminalMonitorState = true;
        setState({ status: "error", message, previousLive: previousReadyLive ?? undefined });
      };
      const publishSnapshot = (fromStream = false) => {
        if (terminalMonitorState) return false;
        const hasArea = MONITOR_AREAS.some((area) => snapshotRef.current[area] !== undefined);
        const allRequestedSettled = monitorAreas.every(
          (area) => snapshotRef.current[area] !== undefined || snapshotRef.current.partial_errors?.[area] !== undefined,
        );
        const allRequestedFailed = monitorAreas.length > 0 && monitorAreas.every(
          (area) => snapshotRef.current.partial_errors?.[area] !== undefined,
        );
        const settlementPending =
          snapshotRef.current.risks !== undefined && settlementAgingStateRef.current === "pending";
        if (!hasArea && !monitorRequestSettled) return false;
        if (!hasArea && (allRequestedFailed || (fromStream && !allRequestedSettled))) return false;
        if (settlementPending) return false;
        const settlement: MonitorSettlementAgingSource | undefined = snapshotRef.current.risks
          ? { aging: settlementAgingRef.current }
          : undefined;
        const live = mapMonitorSnapshot(snapshotRef.current, moneyLocale, liveCopy, settlement);
        const nextLive = { ...live, ...flagViewRef.current };
        const partialErrors = partialMonitorMessages(snapshotRef.current, liveCopy.stale ?? "stale");
        if (settlementErrorRef.current) partialErrors.push(`risks: ${settlementErrorRef.current}`);
        const partialAreas = MONITOR_AREAS.filter(
          (area) => snapshotRef.current.partial_errors?.[area] !== undefined,
        );
        if (settlementErrorRef.current && !partialAreas.includes("risks")) partialAreas.push("risks");
        readySnapshotRef.current = snapshotRef.current;
        readyLiveRef.current = nextLive;
        setState({ status: "ready", live: nextLive, partialErrors, partialAreas });
        return true;
      };

      if (shouldLoadSettlementAging) {
        withRetry(() => getSettlementOverview(getIdToken))
          .then((overview) => {
            if (monitorFetchId.current !== monitorEventId || terminalMonitorState) return;
            settlementAgingRef.current = overview.aging;
            settlementAgingStateRef.current = "ready";
            settlementErrorRef.current = null;
            if (!publishSnapshot(false) && monitorRequestSettled && !readyLiveRef.current) {
              setWholeMonitorError();
            }
          })
          .catch(() => {
            if (monitorFetchId.current !== monitorEventId || terminalMonitorState) return;
            settlementAgingRef.current = null;
            settlementAgingStateRef.current = "error";
            settlementErrorRef.current = liveCopy.unavailable ?? stateCopy.loadFailed;
            if (!publishSnapshot(false) && monitorRequestSettled && !readyLiveRef.current) {
              setWholeMonitorError();
            }
          });
      }

      if (monitorAreas.length > 0) {
        const onAreaSettled = (update: MonitorAreaUpdate) => {
          if (monitorFetchId.current !== monitorEventId) return;
          streamedArea = true;
          snapshotRef.current = mergeMonitorSnapshots(snapshotRef.current, snapshotFromAreaUpdate(update), [update.area]);
          publishSnapshot(true);
        };

        withRetry(() =>
          getMonitorSnapshot(getIdToken, monitorAreas, onAreaSettled, {
            period: periodRef.current,
            limit: limitRef.current,
          }),
        )
          .then((snapshot) => {
            if (monitorFetchId.current !== monitorEventId) return;
            monitorRequestSettled = true;
            setMonitorPending(false);
            if (!streamedArea) {
              snapshotRef.current = mergeMonitorSnapshots(snapshotRef.current, snapshot, monitorAreas);
            }
            if (
              !publishSnapshot(streamedArea) &&
              !readyLiveRef.current &&
              settlementAgingStateRef.current !== "pending"
            ) {
              setWholeMonitorError();
            }
          })
          .catch((err) => {
            if (monitorFetchId.current !== monitorEventId) return;
            monitorRequestSettled = true;
            setMonitorPending(false);
            if (err instanceof ApiError && err.status === 403) {
              terminalMonitorState = true;
              readySnapshotRef.current = {};
              readyLiveRef.current = null;
              snapshotRef.current = {};
              settlementAgingStateRef.current = "idle";
              settlementErrorRef.current = null;
              setState({ status: "forbidden" });
              return;
            }
            if (readyLiveRef.current || !streamedArea) {
              setWholeMonitorError(errorMessage(err, stateCopy));
            }
          });
      }

      if (includeFlags) {
        withRetry(() => listFlags({ owner_checked: checked, limit: 20 }, getIdToken))
          .then((flags) => {
            if (flagsFetchId.current !== flagsEventId) return;
            flagViewRef.current = mapUncheckedFlags(flags.items, liveCopy);
            if (readyLiveRef.current) {
              readyLiveRef.current = { ...readyLiveRef.current, ...flagViewRef.current };
            }
            setFlagsPending(false);
            setState((previous) => {
              if (previous.status !== "ready") return previous;
              const live = { ...previous.live, ...flagViewRef.current };
              return { ...previous, live };
            });
          })
          .catch((err) => {
            if (flagsFetchId.current !== flagsEventId) return;
            if (restoreChecked !== undefined) setFlagCheckedSelection(restoreChecked);
            setFlagsPending(false);
            setFlagRefreshError({
              checked,
              message: bodyCopy?.flagRefreshFailed ?? errorMessage(err, stateCopy),
            });
          });
      }
    },
    [
      bodyCopy?.flagRefreshFailed,
      canAccess,
      getIdToken,
      liveCopy,
      moneyLocale,
      setFlagCheckedSelection,
      stateCopy,
    ],
  );

  useEffect(() => {
    loadMonitor();
    return () => {
      monitorFetchId.current += 1;
      flagsFetchId.current += 1;
    };
  }, [loadMonitor]);

  // rollback(FS-06 §4)은 timestamp UI 와 새 요청만 끈다. 이 주기 타이머는 기준시각을 다시
  // 계산해 `오래됨` 을 갱신하려고 도는 것이므로 rollback 상태에선 걸지 않는다. 이미 받아둔
  // 마지막 성공 snapshot(readySnapshotRef/readyLiveRef)은 그대로 두어 read-only 로 남는다.
  const areaTimestampEnabled = isMonitorAreaTimestampEnabled();

  useEffect(() => {
    if (state.status !== "ready" || !areaTimestampEnabled) return;
    const interval = window.setInterval(() => {
      setState((previous) => {
        if (previous.status !== "ready") return previous;
        const live = mapMonitorSnapshot(snapshotRef.current, moneyLocale, liveCopy, {
          aging: settlementAgingRef.current,
        });
        const nextLive = { ...live, ...flagViewRef.current };
        const partialErrors = partialMonitorMessages(snapshotRef.current, liveCopy.stale ?? "stale");
        if (settlementErrorRef.current) partialErrors.push(`risks: ${settlementErrorRef.current}`);
        const partialAreas = MONITOR_AREAS.filter(
          (area) => snapshotRef.current.partial_errors?.[area] !== undefined,
        );
        if (settlementErrorRef.current && !partialAreas.includes("risks")) partialAreas.push("risks");
        return { ...previous, live: nextLive, partialErrors, partialAreas };
      });
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [areaTimestampEnabled, liveCopy, moneyLocale, state.status]);

  const hasErrorPreviousLive = state.status === "error" && Boolean(state.previousLive);

  useEffect(() => {
    if (!hasErrorPreviousLive || !areaTimestampEnabled) return;
    if (Object.keys(readySnapshotRef.current).length === 0) return;
    const refreshLastKnownFreshness = () => {
      const live = mapMonitorSnapshot(readySnapshotRef.current, moneyLocale, liveCopy, {
        aging: settlementAgingRef.current,
      });
      const nextLive = { ...live, ...flagViewRef.current };
      setState((previous) =>
        previous.status === "error" && previous.previousLive
          ? { ...previous, previousLive: nextLive }
          : previous,
      );
    };
    const interval = window.setInterval(refreshLastKnownFreshness, 60_000);
    return () => window.clearInterval(interval);
  }, [areaTimestampEnabled, hasErrorPreviousLive, liveCopy, moneyLocale]);

  const handleAckFlag = useCallback(
    async (flagId: string) => {
      if (flagsPending) return;
      if (state.status !== "ready") return;
      if (ackingIdsRef.current.has(flagId)) return;
      ackingIdsRef.current.add(flagId);
      setAckingIds(new Set(ackingIdsRef.current));
      let removeFromFeed = true;
      try {
        await ackFlag(flagId, getIdToken);
        toast.success(ackCopy.success);
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          toast.info(ackCopy.already);
        } else {
          removeFromFeed = false;
          toast.error(ackCopy.error);
        }
      } finally {
        ackingIdsRef.current.delete(flagId);
        setAckingIds(new Set(ackingIdsRef.current));
      }
      if (!removeFromFeed) return;
      const flagItems = flagViewRef.current.flagItems.filter((item) => item.id !== flagId);
      const remaining = flagItems.length;
      flagViewRef.current = {
        flagItems,
        flagBadge: remaining === 0 ? "—" : liveCopy.countBadge.replaceAll("{count}", String(remaining)),
      };
      if (readyLiveRef.current) {
        readyLiveRef.current = { ...readyLiveRef.current, ...flagViewRef.current };
      }
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return { ...prev, live: { ...prev.live, ...flagViewRef.current } };
      });
    },
    [ackCopy, flagsPending, getIdToken, liveCopy, state.status, toast],
  );

  const handleFlagCheckedChange = useCallback((checked: boolean) => {
    if (flagsPending || checked === flagCheckedRef.current) return;
    const previous = flagCheckedRef.current;
    setFlagCheckedSelection(checked);
    loadMonitor(checked, previous, [], true);
  }, [flagsPending, loadMonitor, setFlagCheckedSelection]);

  const retryFlagRefresh = useCallback(() => {
    if (!flagRefreshError || flagsPending) return;
    const previous = flagCheckedRef.current;
    setFlagCheckedSelection(flagRefreshError.checked);
    loadMonitor(flagRefreshError.checked, previous, [], true);
  }, [flagRefreshError, flagsPending, loadMonitor, setFlagCheckedSelection]);

  const retryPartialMonitor = useCallback(() => {
    if (flagsPending) return;
    const areas = state.status === "ready" ? state.partialAreas : [];
    if (areas.length > 0) loadMonitor(flagCheckedRef.current, undefined, areas, false);
  }, [flagsPending, loadMonitor, state]);

  // SC-13: 필터를 바꾸면 그 필터가 실제로 태우는 구역을 다시 부른다. 플래그 피드는 이 필터의
  // 대상이 아니므로 includeFlags=false 로 두어 확인 여부 선택을 건드리지 않는다.
  const handlePeriodChange = useCallback(
    (next: MonitorPeriod) => {
      if (monitorPending || next === periodRef.current) return;
      periodRef.current = next;
      setPeriod(next);
      loadMonitor(flagCheckedRef.current, undefined, MONITOR_AREAS, false);
    },
    [loadMonitor, monitorPending],
  );

  const handleLimitChange = useCallback(
    (next: MonitorLimit) => {
      if (monitorPending || next === limitRef.current) return;
      limitRef.current = next;
      setLimit(next);
      loadMonitor(flagCheckedRef.current, undefined, MONITOR_AREAS, false);
    },
    [loadMonitor, monitorPending],
  );

  const handleRefresh = useCallback(() => {
    if (monitorPending) return;
    loadMonitor(flagCheckedRef.current, undefined, MONITOR_AREAS, false);
  }, [loadMonitor, monitorPending]);

  const bodyActions = useMemo(
    () => ({
      period,
      onPeriodChange: handlePeriodChange,
      limit,
      onLimitChange: handleLimitChange,
      onRefresh: handleRefresh,
      refreshBusy: monitorPending,
    }),
    [handleLimitChange, handlePeriodChange, handleRefresh, limit, monitorPending, period],
  );

  if (state.status === "forbidden") {
    return (
      <InfoBox tone="neutral" title={stateCopy.forbiddenTitle} description={stateCopy.forbiddenDescription} />
    );
  }

  if (state.status === "loading") {
    return (
      <section className="h-full overflow-y-auto px-7 py-6" data-component="MonitorConnected" data-state="loading">
        <AnalyticsSkeleton kind="monitor" label={stateCopy.loading} header />
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section
        className="flex flex-col gap-3"
        data-component="MonitorConnected"
        data-state="error"
      >
        <div className="flex flex-col gap-3" data-state="error" data-ui="monitor-refresh-error" role="alert">
          <InfoBox tone="risk" title={stateCopy.errorTitle} description={state.message || loadErrorLabel || stateCopy.loadFailed} />
          <p className="text-sm text-secondary" data-ui="monitor-error-scope">
            {stateCopy.errorScope}
          </p>
          <Button onClick={() => loadMonitor()} size="md" type="button" variant="tertiary">
            {retryLabel}
          </Button>
        </div>
        {state.previousLive ? (
          <div data-ui="monitor-last-known-data">
            <MonitorBody copy={bodyCopy} live={state.previousLive} readOnly />
          </div>
        ) : null}
      </section>
    );
  }

  const baseLive =
    ackingIds.size === 0 && !flagsPending
      ? state.live
      : {
          ...state.live,
          flagItems: state.live.flagItems.map((item) =>
            ackingIds.has(item.id) || flagsPending
              ? { ...item, actionDisabled: true }
              : item,
          ),
        };
  // SC-13 Badge Matrix "모니터 영역 · `조회 실패`(위험)": 실패한 영역은 그 카드에서
  // 스스로 말해야 한다. 상단 부분 오류 안내만으로는, 마지막 정상값이 없는 영역의
  // 0·"—" 배지가 "조회했더니 없음"으로 읽힌다.
  const areaFailedLabel = bodyCopy?.areaLoadFailed ?? DEFAULT_AREA_LOAD_FAILED;
  const live =
    state.partialAreas.length === 0
      ? baseLive
      : {
          ...baseLive,
          areaFailures: Object.fromEntries(
            state.partialAreas.map((area) => [area, areaFailedLabel]),
          ) as Partial<Record<MonitorSnapshotArea, string>>,
        };
  const partialRetryAreas = state.partialAreas;

  return (
    // erp-v2-adapt: begin — persistent-shell scroll ownership
    // raw mode: 셸 <main>(overflow-hidden)이 본문을 잘라내므로 여기서 스크롤을 소유한다.
    <div className="h-full overflow-y-auto" data-component="MonitorConnected" data-state="ready">
      {/* erp-v2-adapt: end */}
      {state.partialErrors.length > 0 ? (
        <div className="flex flex-col items-start gap-3" data-ui="monitor-partial-error" role="alert">
          <InfoBox
            tone="caution"
            title={stateCopy.partialTitle ?? "Some Monitor areas are unavailable"}
            description={stateCopy.partialDescription ?? "Successful areas stay visible. Retry only the affected areas."}
          />
          <ul className="list-disc pl-5 text-sm text-secondary" data-ui="monitor-partial-error-list">
            {state.partialErrors.map((message) => <li key={message}>{message}</li>)}
          </ul>
          {partialRetryAreas.length > 0 ? (
            <Button disabled={flagsPending} onClick={retryPartialMonitor} size="md" type="button" variant="tertiary">
              {retryLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
      {flagRefreshError ? (
        <div className="flex flex-col items-start gap-3" data-ui="monitor-flag-filter-error" role="alert">
          <InfoBox
            tone="risk"
            title={bodyCopy?.flagTitle ?? stateCopy.errorTitle}
            description={flagRefreshError.message}
          />
          <Button disabled={flagsPending} onClick={retryFlagRefresh} size="md" type="button" variant="tertiary">
            {retryLabel}
          </Button>
        </div>
      ) : null}
      <MonitorBody
        overview={opsCopy ? <MonitorDealsOpsPanels copy={opsCopy} /> : undefined}
        actions={bodyActions}
        live={live}
        onAckFlag={handleAckFlag}
        copy={bodyCopy}
        flagBusy={flagsPending}
        flagChecked={flagChecked}
        onFlagCheckedChange={handleFlagCheckedChange}
      />
      {/* §7.8 Exception Center: every active risk across deals in one triage
          list. Self-contained (self-fetches /trade/exceptions). */}
      <ExceptionCenter />
    </div>
  );
}

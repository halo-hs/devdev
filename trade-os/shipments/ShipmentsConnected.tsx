"use client";
import { BusinessListToolbar, BusinessFilterSearch } from "@/components/platform/SearchFilterBar";

import { RefreshCw, Pencil } from "lucide-react";
import { ShipmentConfirmationDialog } from "./ShipmentConfirmationDialog";
import { ShipmentConfirmationRecord } from "./ShipmentConfirmationRecord";
import { carrierTrackingAction } from "./carrierSites";
import Link from "@trade-os/lib/AppLink";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";

import { Button as HostButton } from "@/components/ui/Button";
import { HostTable, HostTableHeader, HostTableBody, HostTableRow, HostTableHead, HostTableCell } from "@trade-os/components/HostTable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { SkeletonTable } from "@trade-os/components/Skeletons";
import { StatusBadge, type StatusTone } from "@trade-os/components/StatusBadge";
import { Button } from "@/components/ui/Button";
import { usePlatformSession } from "@trade-os/lib/session/PlatformSessionContext";
import { ApiError } from "@trade-os/lib/api/client";
import {
  confirmShipment,
  effectiveShipmentEta,
  effectiveShipmentEtd,
  listAllShipments,
  listShipments,
  refreshShipmentTracking,
  type Shipment,
  type ShipmentStatus,
  type ShipmentSyncStatus,
} from "@trade-os/lib/api/shipments";
import { listSnapContainers, type SnapContainerEvidence } from "@trade-os/lib/api/snapEvidence";
import { useLocaleTag } from "@trade-os/lib/i18n/useLocaleTag";
import { formatDate, formatDateTime } from "@trade-os/lib/orgDate";
import { canOperationalWrite } from "@trade-os/lib/productEntitlements";

import { listAllDeals } from "@trade-os/lib/api/listAllDeals";
import { subscribeShipmentUpdates } from "@trade-os/lib/shipmentUpdates";
import type { AppMessages } from "@trade-os/lib/i18n/messages";

type ShipmentsCopy = AppMessages["erpShipments"]["shipments"];

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; shipments: Shipment[]; syncStatus: ShipmentSyncStatus };

type RefreshState =
  | { status: "idle" }
  | { status: "pending"; shipmentId: string }
  | { status: "error"; shipmentId: string; message: string }
  | { status: "notice"; message: string };

type FilterKind = "all" | "in_transit" | "arriving" | "delayed" | "arrived";
const FILTER_KINDS: FilterKind[] = ["all", "in_transit", "arriving", "delayed", "arrived"];

const STATUS_TONE: Record<ShipmentStatus, StatusTone> = {
  booked: "neutral",
  loaded: "info",
  departed: "info",
  arrived: "success",
  delivered: "success",
  unknown: "neutral",
};

function daysBetween(from: Date, to: Date): number {
  // Copies — setHours mutates, and `from` (today) is shared across rows.
  const ms = new Date(to).setHours(0, 0, 0, 0) - new Date(from).setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

// Korean D-day convention: n days REMAINING = D-n, n days PAST = D+n, due
// today = D-DAY. (daysBetween(today, eta) is positive for a future eta.)
function ddayLabel(days: number): string {
  if (days > 0) return `D-${days}`;
  if (days < 0) return `D+${-days}`;
  return "D-DAY";
}

// SNAP evidence rows keep container numbers ISO-6346-normalized (uppercase,
// no separators); shipment rows come from B/L extraction and may not be.
// Normalize the same way so the lookup joins.
function normalizeContainerNo(value: string | null | undefined): string | null {
  if (!value) return null;
  const norm = value.toUpperCase().replace(/[\s-]/g, "");
  return norm || null;
}

type EvidenceSummary = { mediaCount: number; allocationLabel: string | null };

// Per-container rollup across evidence rows (a container can appear in
// several loading jobs); photo counts add up, any active allocation wins.
function summarizeEvidence(rows: SnapContainerEvidence[]): Map<string, EvidenceSummary> {
  const map = new Map<string, EvidenceSummary>();
  for (const row of rows) {
    const key = normalizeContainerNo(row.container_no);
    if (!key) continue;
    const entry = map.get(key) ?? { mediaCount: 0, allocationLabel: null };
    entry.mediaCount += row.media_count;
    if (row.allocation_label) entry.allocationLabel = row.allocation_label;
    map.set(key, entry);
  }
  return map;
}

export type ShipmentSummary = { state: string; eta: string; count: number; snap: string };
export function ShipmentsConnected({ copy, renderHeader, dealId, onSummaryChange }: { copy: ShipmentsCopy; renderHeader?: (controls: ReactNode) => ReactNode; dealId?: string; onSummaryChange?: (summary: ShipmentSummary) => void }) {
  const { entitlements, getIdToken } = usePlatformSession();
  const dateTag = useLocaleTag();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [refreshState, setRefreshState] = useState<RefreshState>({ status: "idle" });
  const editTrigger = useRef<HTMLButtonElement | null>(null);
  const [editing, setEditing] = useState<Shipment | null>(null);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<FilterKind>("all");
  const tabsId = useId();
  // SNAP bridge is an OPTIONAL module: evidence is fetched separately and
  // silent-fails to an empty map, so this core screen renders identically
  // for orgs without SNAP (or if the bridge API is down).
  const [evidence, setEvidence] = useState<Map<string, EvidenceSummary>>(new Map());
  const fetchEventId = useRef(0);
  const refreshEventId = useRef(0);
  const refreshInFlight = useRef(false);

  const resolvedDealId = useRef<string | null>(null);
  const canRefresh = canOperationalWrite(entitlements);
  const refreshUnavailableMessage = copy.refreshTrackingUnavailable;

  const loadShipments = useCallback(() => {
    const eventId = fetchEventId.current + 1;
    fetchEventId.current = eventId;
    setState({ status: "loading" });

    const read = async () => {
      if (!dealId) return listAllShipments(getIdToken);
      let id = dealId;
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        const deals = await listAllDeals(getIdToken);
        const matches = deals.items.filter(deal => deal.display_id === dealId);
        if (matches.length > 1) throw new Error("거래 번호가 중복되어 선적을 연결할 수 없습니다.");
        if (!matches.length) { resolvedDealId.current = null; return { shipments: [], sync_status: "ok" as const }; }
        id = matches[0].deal_id;
      }
      resolvedDealId.current = id;
      const result = await listShipments(getIdToken, undefined, id);
      return { ...result, shipments: result.shipments.filter(ship => ship.deal_id === id) };
    };
    read()
      .then((res) => {
        if (fetchEventId.current !== eventId) return;
        setState({ status: "ready", shipments: res.shipments, syncStatus: res.sync_status ?? "ok" });
      })
      .catch(() => {
        if (fetchEventId.current !== eventId) return;
        setState({ status: "error" });
      });
  }, [getIdToken, dealId]);

  useEffect(() => {
    loadShipments();
    return () => {
      fetchEventId.current += 1;
      refreshEventId.current += 1;
      refreshInFlight.current = false;
    };
  }, [loadShipments]);

  useEffect(() => {
    const reload = () => { if (!refreshInFlight.current) loadShipments(); };
    const unsubscribe = subscribeShipmentUpdates(change => {
      if (!dealId || !change.dealId || change.dealId === resolvedDealId.current) reload();
    });
    window.addEventListener("focus", reload);
    return () => { unsubscribe(); window.removeEventListener("focus", reload); };
  }, [dealId, loadShipments]);

  useEffect(() => {
    if (!onSummaryChange || state.status !== "ready") return;
    const active = state.shipments.filter(ship => ship.status !== "arrived" && ship.status !== "delivered");
    const eta = active.map(effectiveShipmentEta).filter((date): date is string => Boolean(date)).sort()[0] ?? "";
    onSummaryChange({ state: !state.shipments.length ? "선적 없음" : !active.length ? "도착 완료" : "선적 진행 중", eta, count: state.shipments.length, snap: "" });
  }, [state, onSummaryChange]);

  useEffect(() => {
    let cancelled = false;
    listSnapContainers(getIdToken)
      .then((res) => {
        if (cancelled) return;
        setEvidence(summarizeEvidence(res.containers ?? []));
      })
      .catch(() => {
        // Optional module: silently fall back to no badges — this fetch
        // must never surface an error state on the core shipments screen.
        if (!cancelled) setEvidence(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, [getIdToken]);

  // D2: monitoring is per PO/Sales Contract (deal), not per B/L — one deal can
  // carry many B/Ls (split shipment). Group the (filtered) shipments by deal so
  // the operator watches a deal and sees all its shipments under it.
  const groups = useMemo(() => {
    if (state.status !== "ready") return [] as Array<{ key: string; label: string; rows: Shipment[] }>;
    const needle = q.trim().toLowerCase();
    // Status / arrival filter — "what should I act on?": in-transit, arriving
    // within a week, overdue (ETA passed, not yet arrived), or done.
    const matchesKind = (s: Shipment): boolean => {
      if (kind === "all") return true;
      const settled = s.status === "arrived" || s.status === "delivered";
      if (kind === "in_transit") return s.status === "loaded" || s.status === "departed";
      if (kind === "arrived") return settled;
      const eta = effectiveShipmentEta(s);
      const dday = eta ? daysBetween(new Date(), new Date(eta)) : null;
      if (kind === "arriving") return dday !== null && dday >= 0 && dday <= 7 && !settled;
      if (kind === "delayed") return dday !== null && dday < 0 && !settled;
      return true;
    };
    const matchesNeedle = (s: Shipment): boolean =>
      !needle ||
      [
        s.bl_number,
        s.container_number,
        s.pol,
        s.pod,
        s.vessel,
        s.deal_counterparty,
        s.deal_title,
        s.deal_sc_number,
        s.deal_po_number,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    const rows = state.shipments.filter((s) => matchesKind(s) && matchesNeedle(s));

    const map = new Map<string, { key: string; label: string; rows: Shipment[] }>();
    for (const s of rows) {
      const key = s.deal_id ?? "__none__";
      // Show the deal's contract number (SC#/PO#) so B/Ls read "per contract".
      const contract = s.deal_sc_number || s.deal_po_number;
      const base = s.deal_title || s.deal_counterparty || (s.deal_id ? s.deal_id.slice(0, 8) : copy.unassigned);
      const label = contract ? `${base} · ${contract}` : base;
      const g = map.get(key) ?? { key, label, rows: [] };
      g.rows.push(s);
      map.set(key, g);
    }
    // Deals with an earlier earliest-ETA float to the top; unassigned last.
    return [...map.values()].sort((a, b) => {
      if (a.key === "__none__") return 1;
      if (b.key === "__none__") return -1;
      const aEta = a.rows
        .flatMap((row) => {
          const eta = effectiveShipmentEta(row);
          return eta ? [eta] : [];
        })
        .sort()[0] ?? "";
      const bEta = b.rows
        .flatMap((row) => {
          const eta = effectiveShipmentEta(row);
          return eta ? [eta] : [];
        })
        .sort()[0] ?? "";
      if (!aEta) return 1;
      if (!bEta) return -1;
      return aEta.localeCompare(bEta);
    });
  }, [copy.unassigned, q, kind, state]);

  const refreshTracking = useCallback(
    async (shipmentId: string) => {
      if (!canRefresh || refreshInFlight.current) return;

      const eventId = refreshEventId.current + 1;
      refreshEventId.current = eventId;
      refreshInFlight.current = true;
      setRefreshState({ status: "pending", shipmentId });

      try {
        const { shipment } = await refreshShipmentTracking(getIdToken, shipmentId);
        if (refreshEventId.current !== eventId) return;
        setState((current) => {
          if (current.status !== "ready") return current;
          return {
            status: "ready",
            syncStatus: current.syncStatus,
            shipments: current.shipments.map((row) =>
              row.id === shipmentId ? { ...row, ...shipment, snap_evidence_count: shipment.snap_evidence_count ?? row.snap_evidence_count } : row,
            ),
          };
        });
        setRefreshState({ status: "idle" });
      } catch (error) {
        if (refreshEventId.current !== eventId) return;

        if (
          error instanceof ApiError &&
          error.status === 404 &&
          error.code === "TRADE_SHIPMENT_NOT_FOUND"
        ) {
          setState((current) => {
            if (current.status !== "ready") return current;
            return {
              status: "ready",
              syncStatus: current.syncStatus,
              shipments: current.shipments.filter((row) => row.id !== shipmentId),
            };
          });
          setRefreshState({ status: "notice", message: copy.refreshTrackingMissing });
          return;
        }

        let message = copy.refreshTrackingError;
        if (error instanceof ApiError && error.status === 403) {
          message = copy.refreshTrackingForbidden;
        } else if (error instanceof ApiError && error.status === 402) {
          message = copy.refreshTrackingUnavailable;
        }
        setRefreshState({ status: "error", shipmentId, message });
      } finally {
        if (refreshEventId.current === eventId) refreshInFlight.current = false;
      }
    }, [canRefresh, copy, getIdToken],
  );

  if (state.status === "loading") {
    return (
      <>
      {renderHeader?.(null)}
      <section data-component="ShipmentsConnected" data-state="loading">
        <SkeletonTable label={copy.loading} rows={8} />
      </section>
      </>
    );
  }
  if (state.status === "error") {
    return (
      <>
      {renderHeader?.(null)}
      <section
        className="flex flex-col gap-3 rounded-lg border border-[var(--color-gray-10)] bg-[var(--color-gray-12)] px-4 py-6"
        data-component="ShipmentsConnected"
        data-state="error"
        role="alert"
      >
        <p className="text-[length:var(--text-body-9)] leading-[var(--leading-body-9)] text-[var(--color-red-1)]">{copy.loadError}</p>
        <Button variant="outline" onClick={loadShipments} type="button">
          {copy.retry}
        </Button>
      </section>
      </>
    );
  }

  const controls = (
    <BusinessListToolbar
      data-ui="shipments-controls"
      aria-label="선적 검색 필터"
      search={
        <BusinessFilterSearch
          label={copy.searchPlaceholder}
          clearLabel={copy.searchClear}
          value={q}
          onValueChange={setQ}
        />
      }
      actions={
        // Design preview: shown to everyone for now; production limits it to SNAP subscribers.
        <Button variant="secondary" asChild className="ml-auto rounded-full">
          <Link href="/erp/snap-evidence" data-ui="shipments-evidence-link">
            {copy.evidenceLink}
          </Link>
        </Button>
      }
    />
  )

  const listControls = (
    <BusinessListToolbar
      data-ui="shipments-list-controls"
      aria-label="선적 상태 필터"
    >
      <Tabs
        className="reference-shipment-tabs"
        value={kind}
        onValueChange={(value) => {
          if (FILTER_KINDS.includes(value as typeof kind))
            setKind(value as typeof kind)
        }}
      >
        <TabsList aria-label={copy.filters.label}>
          {FILTER_KINDS.map((filterKind) => (
            <TabsTrigger
              key={filterKind}
              id={`${tabsId}-${filterKind}`}
              aria-controls={`${tabsId}-panel`}
              value={filterKind}
            >
              {copy.filters[filterKind]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <span className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-5)]">
        {`거래 ${groups.length}건 · 선적 ${groups.reduce((sum, group) => sum + group.rows.length, 0)}건`}
      </span>
    </BusinessListToolbar>
  )

  const today = new Date();

  return (
    <div className="flex flex-col gap-4" data-component="ShipmentsConnected" data-state="ready">
      {dealId ? <h3 className="text-[length:var(--text-body-6)] leading-[var(--leading-body-6)] font-bold">선적 정보</h3> : renderHeader ? renderHeader(controls) : controls}
      {/* The list page wraps the tabs and every deal group in one card. */}
      <div className={dealId ? "contents" : "reference-shipment-list-card"}>
      {!dealId && listControls}
      <div
        id={`${tabsId}-panel`}
        role={dealId ? "region" : "tabpanel"}
        aria-label={dealId ? "거래 선적 정보" : undefined}
        aria-labelledby={dealId ? undefined : `${tabsId}-${kind}`}
        tabIndex={0}
        className="reference-shipment-results"
      >
      {!canRefresh ? (
        <p className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-4)]">{refreshUnavailableMessage}</p>
      ) : null}
      {refreshState.status === "notice" ? (
        <p className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-4)]" role="status">
          {refreshState.message}
        </p>
      ) : null}
      {/* BE#1212: sync_status "stale" means the server just tried to refresh
          the B/L cache and failed. With rows present the rows are real (just
          possibly outdated) — show them with a banner, not an error state. */}
      {state.syncStatus === "stale" && state.shipments.length > 0 ? (
        <div
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--color-yellow-5)] bg-[var(--color-yellow-6)] px-4 py-3"
          data-ui="shipments-stale-banner"
          role="status"
        >
          <p className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-yellow-1)]">{copy.staleBanner}</p>
          <Button variant="outline" size="xs" onClick={loadShipments} type="button">
            {copy.retry}
          </Button>
        </div>
      ) : null}
      {groups.length === 0 ? (
        // erp-v2-adapt: begin — distinguish filtered-empty results from an empty shipment book.
        state.shipments.length > 0 ? (
          <section data-state="empty">
            <p className="text-[length:var(--text-body-9)] leading-[var(--leading-body-9)] text-[var(--color-gray-4)]">{copy.emptyFiltered}</p>
          </section>
        ) : state.syncStatus === "stale" ? (
          // A stale + empty page 0 means the refresh failed before we could
          // learn whether the book is really empty — do not assert "no
          // shipments" (that claims a fact BE#1212 could not confirm).
          <section
            className="flex flex-col gap-3 rounded-lg border border-[var(--color-gray-10)] bg-[var(--color-gray-12)] px-4 py-6"
            data-component="ShipmentsConnected"
            data-state="stale-empty"
            role="alert"
          >
            <p className="text-[length:var(--text-body-9)] leading-[var(--leading-body-9)] text-[var(--color-red-1)]">{copy.staleEmpty}</p>
            <Button variant="outline" onClick={loadShipments} type="button">
              {copy.retry}
            </Button>
          </section>
        ) : (
        // erp-v2-adapt: end
        <p className="text-[length:var(--text-body-9)] leading-[var(--leading-body-9)] text-[var(--color-gray-4)]">{copy.empty}</p>
        // erp-v2-adapt: begin — close the filtered-empty conditional removed by the parity oracle.
        )
        // erp-v2-adapt: end
      ) : (
        groups.map((group) => (
          <section key={group.key} className="reference-shipment-group" data-deal-id={group.key}>
            <div className="reference-shipment-group-heading">
              <div className="min-w-0">
                <h2 className="text-[length:var(--text-body-6)] leading-[var(--leading-body-6)] font-bold text-[var(--color-gray-2)]">{group.label}</h2>
                <p className="mt-1 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-5)]">
                  {[group.rows[0].deal_counterparty, copy.shipmentCount.replace("{count}", String(group.rows.length))].filter(Boolean).join(" · ")}
                </p>
              </div>
              {!dealId && group.key !== "__none__" ? (
                <HostButton variant="outline" size="sm" asChild>
                  <Link href={`/erp/deals/${encodeURIComponent(group.key)}`} data-ui="shipments-deal-link">{copy.dealLink}</Link>
                </HostButton>
              ) : null}
            </div>
            <HostTable className="reference-shipment-table" aria-label={`${group.label} 선적 정보`}>
              <colgroup><col style={{ width: "19%" }} /><col style={{ width: "21%" }} /><col style={{ width: "24%" }} /><col style={{ width: "12%" }} /><col style={{ width: "9%" }} /><col style={{ width: "15%" }} /></colgroup>
              <HostTableHeader><HostTableRow>
                <HostTableHead>B/L · 컨테이너</HostTableHead>
                <HostTableHead>항로 · 선박</HostTableHead>
                <HostTableHead>ETD / ETA</HostTableHead>
                <HostTableHead>서류·근거</HostTableHead>
                <HostTableHead>{copy.cols.status}</HostTableHead>
                <HostTableHead>작업</HostTableHead>
              </HostTableRow></HostTableHeader>
              <HostTableBody>
              {group.rows.map((ship) => {
                const effectiveEta = effectiveShipmentEta(ship);
                const effectiveEtd = effectiveShipmentEtd(ship);
                const settled = ship.status === "arrived" || ship.status === "delivered";
                const dday = effectiveEta && !settled ? daysBetween(today, new Date(effectiveEta)) : null;
                const delayed = dday !== null && dday < 0;
                const arriving = dday !== null && dday >= 0 && dday <= 7;
                const containerKey = normalizeContainerNo(ship.container_number);
                const shipEvidence = containerKey ? evidence.get(containerKey) : undefined;
                const refreshing = refreshState.status === "pending" && refreshState.shipmentId === ship.id;
                const refreshError = refreshState.status === "error" && refreshState.shipmentId === ship.id ? refreshState.message : null;
                const fetchedAt = ship.provider_fetched_at || ship.last_carrier_sync_at;
                const trackingAction = carrierTrackingAction(ship.carrier);
                return (
                  <HostTableRow key={ship.id} data-shipment-id={ship.id} aria-busy={refreshing} data-refresh-state={refreshError ? "error" : refreshing ? "pending" : "ready"}>
                    <HostTableCell>
                      {ship.bl_number ? <div className="font-medium" data-ui="shipment-bl-number">{ship.bl_number}</div> : null}
                      {ship.container_number ? <div className={ship.bl_number ? "mt-1 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-5)]" : "font-medium"} data-ui="shipment-container-number">{ship.container_number}</div> : null}
                      {!ship.bl_number && !ship.container_number ? <span data-ui="shipment-identifier-fallback">{copy.rowFallback}</span> : null}
                    </HostTableCell>
                    <HostTableCell>
                      <div>{ship.pol || "—"} → {ship.pod || "—"}</div>
                      <div className="mt-1 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-5)]">{[ship.carrier, ship.vessel].filter(Boolean).join(" · ") || "—"}</div>
                    </HostTableCell>
                    <HostTableCell>
                      <div className="tabular-nums">{effectiveEtd ? formatDate(effectiveEtd, dateTag) : "—"} / {effectiveEta ? formatDate(effectiveEta, dateTag) : "—"}</div>
                      <div className="mt-1 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-5)]">{ship.confirmed_eta || ship.confirmed_etd ? "확정 일정 기준" : copy.source[ship.source]}{dday !== null ? ` · ${ddayLabel(dday)}` : ""}</div>
                      {ship.confirmed_eta || ship.provider_eta || ship.confirmed_etd || ship.provider_etd || ship.confirmed_status_at || ship.confirmed_status_by ? (
                        <details className="reference-shipment-date-details text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-5)]" data-ui="shipment-eta-basis">
                          <summary>일정 근거</summary>
                          {ship.confirmed_etd ? <p>확정 ETD {formatDate(ship.confirmed_etd, dateTag)}</p> : null}
                          {ship.confirmed_eta ? <p>확정 ETA {formatDate(ship.confirmed_eta, dateTag)}</p> : null}
                          {ship.provider_etd ? <p>선사 ETD {formatDate(ship.provider_etd, dateTag)}</p> : null}
                          {ship.provider_eta ? <p>선사 ETA {formatDate(ship.provider_eta, dateTag)}</p> : null}
                          <ShipmentConfirmationRecord shipment={ship} />
                          {ship.confirmed_at ? <p>{copy.source.manualAt.replace("{at}", formatDateTime(ship.confirmed_at, dateTag))}</p> : null}
                          {ship.confirmed_by ? <p>{copy.source.manualBy.replace("{by}", ship.confirmed_by)}</p> : null}
                        </details>
                      ) : null}
                    </HostTableCell>
                    <HostTableCell>
                      <div className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-5)]">{ship.bl_number ? "B/L 번호 등록" : "B/L 번호 없음"}</div>
                      {shipEvidence ? <HostButton variant="outline" size="sm" asChild className="mt-1">
                        <Link href="/erp/snap-evidence" title={shipEvidence.allocationLabel ? copy.evidenceAllocatedTo.replace("{label}", shipEvidence.allocationLabel) : undefined}>
                          SNAP {ship.snap_evidence_count === undefined ? "" : `${ship.snap_evidence_count}건 · `}{shipEvidence.mediaCount}장
                        </Link>
                      </HostButton> : <div className="mt-1 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-5)]">증거 미확인</div>}
                    </HostTableCell>
                    <HostTableCell>
                      <StatusBadge meaning="state" tone={delayed ? "danger" : arriving ? "warning" : STATUS_TONE[ship.status]}>
                        {delayed ? copy.filters.delayed : arriving ? copy.filters.arriving : copy.status[ship.status] ?? ship.status}
                      </StatusBadge>
                      {delayed || arriving ? <div className="mt-1 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-5)]">{copy.status[ship.status] ?? ship.status}</div> : null}
                    </HostTableCell>
                    <HostTableCell>
                      {/* The tracking action (갱신 or 선사 사이트) takes one fixed-width
                          slot so 수정 lines up in every row. */}
                      <div className="grid grid-cols-[112px_auto] items-center justify-start gap-2">
                        {trackingAction.kind === "refresh" && canRefresh ? (
                          <HostButton className="w-full" title="추적 정보 갱신" aria-label={refreshing ? copy.refreshingTracking : copy.refreshTracking} disabled={refreshState.status === "pending"} onClick={() => void refreshTracking(ship.id)} size="sm" type="button" variant="outline">
                            <RefreshCw aria-hidden="true" className={refreshing ? "size-4 animate-spin" : "size-4"} />{refreshing ? "갱신 중" : "갱신"}
                          </HostButton>
                        ) : null}
                        {trackingAction.kind === "site" ? (
                          <HostButton className="w-full" variant="outline" size="sm" asChild><a href={trackingAction.href} target="_blank" rel="noopener noreferrer">선사 사이트 ↗</a></HostButton>
                        ) : null}
                        {trackingAction.kind !== "site" && !(trackingAction.kind === "refresh" && canRefresh) ? <span aria-hidden="true" /> : null}
                        {canRefresh ? (
                          <HostButton title="일정 및 운송 상태 수정" aria-label="일정 및 운송 상태 수정" disabled={refreshState.status === "pending"} onClick={event => { editTrigger.current = event.currentTarget; setEditing(ship); }} size="sm" type="button" variant="outline"><Pencil aria-hidden="true" className="size-4" />수정</HostButton>
                        ) : null}
                      </div>
                      {ship.tracking_health === "stale" || ship.tracking_health === "fetch_failed" ? (
                        <p className={`mt-1 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] ${ship.tracking_health === "stale" ? "text-[var(--color-yellow-1)]" : "text-[var(--color-red-1)]"}`}>{ship.tracking_health === "stale" ? "조회 정보 오래됨" : "선사 조회 실패"}</p>
                      ) : null}
                      {fetchedAt ? <p className="mt-1 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-5)]">{copy.source.carrierAt.replace("{at}", formatDateTime(fetchedAt, dateTag))}</p> : null}
                      {!fetchedAt && (ship.tracking_health === "stale" || ship.tracking_health === "fetch_failed") ? <p className="mt-1 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-5)]">마지막 조회 기록 없음</p> : null}
                      {refreshError ? <p className="mt-1 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-red-1)]" role="alert">{refreshError}</p> : null}
                    </HostTableCell>
                  </HostTableRow>
                );
              })}
              </HostTableBody>
            </HostTable>
          </section>
        ))
      )}
      </div>
      </div>
      {editing ? <ShipmentConfirmationDialog shipment={editing} canWrite={canRefresh} copy={copy} returnFocus={() => editTrigger.current?.focus()} onReload={async () => { const result = await listAllShipments(getIdToken); const latest = result.shipments.find(row => row.id === editing.id); if (!latest) throw new Error("선적을 찾을 수 없습니다."); return latest; }} onClose={() => setEditing(null)} onSave={async (body) => {
        if (!canRefresh) throw new Error("수정 권한이 없습니다.");
        const { shipment } = await confirmShipment(getIdToken, editing.id, body);
        setState(current => current.status === "ready" ? { ...current, shipments: current.shipments.map(row => row.id === shipment.id ? { ...row, ...shipment, snap_evidence_count: shipment.snap_evidence_count ?? row.snap_evidence_count } : row) } : current);
      }} /> : null}
    </div>
  );
}

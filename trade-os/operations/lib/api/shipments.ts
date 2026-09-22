import { publishShipmentUpdate } from "../shipmentUpdates";
import { apiRequest, DEFAULT_PLATFORM_API_BASE_URL } from "./client";
import { withRetry } from "./retry";

// M4/R-18 shipment tracking client. ECOYA does not track carriers itself — it
// reads a cache filled from B/L documents (and, when the ecoya-tracking-poc
// seam is wired, refreshed at most once a day). The operator searches ETA/ETD/
// container anytime with no live external call.

export type ShipmentStatus =
  | "booked"
  | "loaded"
  | "departed"
  | "arrived"
  | "delivered"
  | "unknown";

export type Shipment = {
  id: string;
  deal_id?: string | null;
  bl_number?: string | null;
  container_number?: string | null;
  carrier?: string | null;
  vessel?: string | null;
  pol?: string | null;
  pod?: string | null;
  etd?: string | null;
  eta?: string | null;
  // Backend #629 preserves the latest provider reading separately from the
  // human-confirmed operational date. `eta`/`etd` remain the backend's
  // effective display values; these fields let consumers explain their basis.
  provider_eta?: string | null;
  provider_etd?: string | null;
  provider_fetched_at?: string | null;
  confirmed_eta?: string | null;
  confirmed_etd?: string | null;
  confirmed_by?: string | null;
  confirmed_at?: string | null;
  status: ShipmentStatus;
  tracking_provider?: string | null;
  last_carrier_sync_at?: string | null;
  source: "document" | "manual" | "carrier";
  // Deal context (D2): real-world monitoring is per PO/Sales Contract — one
  // deal can carry many B/Ls. The FE groups shipments under their deal.
  deal_counterparty?: string | null;
  deal_title?: string | null;
  // The deal's contract number (1 deal = 1 contract per BM): SC# for a sell deal,
  // PO# for a buy deal. Surfaced so the board shows + filters B/Ls per contract.
  deal_sc_number?: string | null;
  deal_po_number?: string | null;
};

type ShipmentEtaFields = Pick<Shipment, "eta" | "provider_eta" | "confirmed_eta">;
type ShipmentEtdFields = Pick<Shipment, "etd" | "provider_etd" | "confirmed_etd">;

// During rollout, older rows may omit the effective legacy field. Prefer the
// confirmed operational value, then retain the backend effective value, and
// finally fall back to the provider reading so the row remains visible.
export function effectiveShipmentEta(fields: ShipmentEtaFields): string | null {
  return fields.confirmed_eta ?? fields.eta ?? fields.provider_eta ?? null;
}

export function effectiveShipmentEtd(fields: ShipmentEtdFields): string | null {
  return fields.confirmed_etd ?? fields.etd ?? fields.provider_etd ?? null;
}

// BE#1212 (additive): "stale" means this page's first-page request attempted
// a B/L cache refresh and the refresh failed — the list may be out of date
// or, if the cache was cold, empty. Per the backend contract offset > 0 never
// attempts a refresh and always reports "ok", so only page 0 carries signal.
export type ShipmentSyncStatus = "ok" | "stale";

export type ShipmentsResponse = {
  shipments: Shipment[];
  // Optional so any caller/mocked payload that predates BE#1212 still
  // compiles; treat a missing value as "ok" (today's behavior).
  sync_status?: ShipmentSyncStatus;
};

// Deal detail renders the operations summary and shipment timeline together.
// Coalesce their concurrent same-query reads per token getter in the browser,
// while clearing the entry as soon as the request settles so this is not a
// stale-data cache or a cross-session promise share.
const inflightShipmentReads =
  typeof window !== "undefined"
    ? new WeakMap<() => Promise<string>, Map<string, Promise<ShipmentsResponse>>>()
    : null;

function apiPath(path: string): string {
  return typeof window !== "undefined" ? `/api/platform${path}` : `/api/v1${path}`;
}

function apiBaseUrl(): string | undefined {
  return typeof window !== "undefined" ? "" : DEFAULT_PLATFORM_API_BASE_URL;
}

/**
 * Single first page of /trade/shipments (server default 200 rows). Prefer
 * listAllShipments for whole-book surfaces — this window silently hides
 * every shipment past the first page. With `dealId` set the read is scoped
 * to one deal (a deal holds a handful of B/Ls, so one page is the whole
 * answer) — the right call for the deal-detail timeline.
 */
export async function listShipments(
  getIdToken: () => Promise<string>,
  q?: string,
  dealId?: string,
): Promise<ShipmentsResponse> {
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (dealId) qs.set("deal_id", dealId);
  const query = qs.toString();
  const key = query;
  const reads = inflightShipmentReads?.get(getIdToken);
  const inflight = reads?.get(key);
  if (inflight) return inflight;

  const request = apiRequest<ShipmentsResponse>(apiPath(`/trade/shipments${query ? `?${query}` : ""}`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
  if (!inflightShipmentReads) return request;
  const scopedReads = reads ?? new Map<string, Promise<ShipmentsResponse>>();
  if (!reads) inflightShipmentReads.set(getIdToken, scopedReads);
  scopedReads.set(key, request);
  return request.finally(() => {
    if (scopedReads.get(key) === request) scopedReads.delete(key);
  });
}

// P1 스케일: the shipments board, deal-detail panel, and home rollups all read
// the server's fixed 200-row window — older shipments silently vanished from
// every surface. listAllShipments pages at the server max (500/page, ordered
// eta ASC NULLS LAST, updated_at DESC, id ASC — deterministic under paging)
// until a short page. Books at or under one page still pay exactly one request.
export const SHIPMENTS_PAGE_LIMIT = 500;
// Runaway guard (10 pages = 5,000 shipments); hitting it truncates with a
// console.warn instead of looping forever.
const SHIPMENTS_MAX_PAGES = 10;

// In-flight dedupe: the home dashboard mounts several rollups (KPI strip,
// today body, owner cards, weekly schedule) that each want the same sweep —
// concurrent same-q calls share one promise instead of racing N parallel
// multi-page sweeps against the per-IP rate limit. Browser-only so SSR
// requests never share state across users; entries clear when the sweep
// settles, so this coalesces concurrency without caching staleness.
const inflightShipmentSweeps =
  typeof window !== "undefined" ? new Map<string, Promise<ShipmentsResponse>>() : null;

export function listAllShipments(
  getIdToken: () => Promise<string>,
  q?: string,
): Promise<ShipmentsResponse> {
  const sweepKey = q ?? "";
  const inflight = inflightShipmentSweeps?.get(sweepKey);
  if (inflight) return inflight;

  const sweep = (async () => {
    try {
      const byId = new Map<string, Shipment>();
      // Only page 0 attempts a cache refresh (offset > 0 always reports
      // "ok" per the backend contract), so the sweep's sync_status is
      // page 0's alone — later pages cannot upgrade or downgrade it.
      let syncStatus: ShipmentSyncStatus = "ok";
      for (let page = 0; page < SHIPMENTS_MAX_PAGES; page += 1) {
        const qs = new URLSearchParams({
          limit: String(SHIPMENTS_PAGE_LIMIT),
          offset: String(page * SHIPMENTS_PAGE_LIMIT),
        });
        if (q) qs.set("q", q);
        // Per-page transient retry (429/5xx/network) so a mid-sweep failure
        // does not force the caller's outer withRetry to restart from page 1
        // and re-drain the per-IP rate-limit burst with already-fetched pages.
        const response = await withRetry(
          () =>
            apiRequest<ShipmentsResponse>(apiPath(`/trade/shipments?${qs.toString()}`), {
              baseUrl: apiBaseUrl(),
              getIdToken,
            }),
          { retries: 2, baseDelayMs: 500 },
        );
        if (page === 0) syncStatus = response?.sync_status ?? "ok";
        // Null-safe: a malformed upstream body must not abort the sweep.
        // Dedupe by id: offset paging over a live book can repeat a row when
        // inserts land between pages.
        const shipments = response?.shipments ?? [];
        for (const shipment of shipments) byId.set(shipment.id, shipment);
        if (shipments.length < SHIPMENTS_PAGE_LIMIT) {
          return { shipments: [...byId.values()], sync_status: syncStatus };
        }
      }
      console.warn(
        `listAllShipments: page cap reached (${SHIPMENTS_MAX_PAGES} pages × ${SHIPMENTS_PAGE_LIMIT}); shipment snapshot is truncated`,
      );
      return { shipments: [...byId.values()], sync_status: syncStatus };
    } finally {
      inflightShipmentSweeps?.delete(sweepKey);
    }
  })();

  inflightShipmentSweeps?.set(sweepKey, sweep);
  return sweep;
}

// refreshShipmentTracking triggers a live carrier lookup (DCSA seam) for one
// shipment and returns the updated row. When the seam is unwired or the carrier
// has no new data, manual ETA/ETD are preserved server-side — the call still
// succeeds and returns the (unchanged) row.
export async function refreshShipmentTracking(
  getIdToken: () => Promise<string>,
  shipmentId: string,
): Promise<{ shipment: Shipment }> {
  const result = await apiRequest<{ shipment: Shipment }>(
    apiPath(`/trade/shipments/${encodeURIComponent(shipmentId)}/refresh-tracking`),
    { baseUrl: apiBaseUrl(), getIdToken, init: { method: "POST" } },
  );
  publishShipmentUpdate({ shipmentId: result.shipment.id, dealId: result.shipment.deal_id });
  return result;
}

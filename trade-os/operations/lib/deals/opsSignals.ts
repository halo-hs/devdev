import type { DealSummaryResponse } from "@trade-os/operations/lib/api/deals";

const SHIPMENT_DOC_CODES = new Set(["BL", "PL", "CI", "SI"]);
const TERMINAL_LIFECYCLES = new Set(["closed", "short_closed", "cancelled"]);

/** Earliest not-yet-arrived shipment ETA within horizon (default D+7). */
export function isEtaSoon(nextEta?: string | null, horizonDays = 7): boolean {
  if (!nextEta) return false;
  const eta = new Date(`${nextEta}T00:00:00`);
  if (Number.isNaN(eta.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deltaDays = Math.round((eta.getTime() - today.getTime()) / 86_400_000);
  return deltaDays <= horizonDays;
}

export function hasOpenOrder(deal: DealSummaryResponse): boolean {
  const lifecycle = deal.order_lifecycle_status;
  if (lifecycle && TERMINAL_LIFECYCLES.has(lifecycle)) return false;
  // Commercial closure and quantity fulfilment are independent axes. A fully
  // shipped order is still open until a user explicitly closes it.
  if (lifecycle === "open") return true;
  // Compatibility for older summaries that did not expose lifecycle yet.
  return deal.order_state === "open";
}

/** Open order with partial shipment — contracted qty still outstanding. */
export function hasOpenRemaining(deal: DealSummaryResponse): boolean {
  if (!hasOpenOrder(deal) || deal.order_quantity_reason) return false;
  const positive = (raw?: string | null) => typeof raw === "string"
    && /^\+?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw) && /[1-9]/.test(raw);
  return positive(deal.order_shipped_qty) && positive(deal.order_remaining_qty);
}

function isShipmentDocCode(docCode: string): boolean {
  return SHIPMENT_DOC_CODES.has(docCode.toUpperCase());
}

/**
 * Rule-based ops alert: ETA is soon but expected shipment docs (B/L etc.) are still missing.
 * Uses backend next_document guidance when present; falls back to deal stage.
 */
export function hasDocGapBeforeEta(deal: DealSummaryResponse): boolean {
  if (!isEtaSoon(deal.next_eta)) return false;

  const nd = deal.next_document;
  if (nd) {
    const docCode = (nd.doc_code ?? "").toUpperCase();
    const code = (nd.code ?? "").toLowerCase();
    if (nd.kind === "upload" && isShipmentDocCode(docCode)) return true;
    if (nd.kind === "link" || code === "link_shipment") return true;
    if (code.startsWith("upload_") && (code.includes("bl") || isShipmentDocCode(docCode))) return true;
    if (nd.label && /B\/L|BL|선하|패킹|보세/i.test(nd.label)) return true;
  }

  if (!nd && (deal.status === "shipment" || deal.status === "customs")) return true;

  return false;
}

const QTY_MISMATCH_RISKS = new Set(["qty_mismatch", "ci_qty_mismatch"]);

export function hasQtyMismatchRisk(deal: DealSummaryResponse): boolean {
  return (deal.risks ?? []).some((risk) => QTY_MISMATCH_RISKS.has(risk));
}

import { HostTable, HostTableHeader, HostTableBody, HostTableRow, HostTableHead, HostTableCell } from "@trade-os/operations/components/HostTable";
"use client";
import { BusinessListToolbar, BusinessFilterField } from "@shared/components/business-filters";

import Link from "@trade-os/operations/compat/link";
import { useMessages } from "@trade-os/operations/compat/intl";
import { useSearchParams } from "@trade-os/operations/compat/navigation";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, Fragment, type CSSProperties, type ReactNode } from "react";

import { InfoBox } from "@trade-os/operations/components/InfoBox";
import { FilterChipGroup } from "@trade-os/operations/components/FilterChipGroup";
import { LoadableSection, type LoadableSectionCopy } from "@trade-os/operations/components/LoadableSection";
import { OperationalTableFrame } from "@trade-os/operations/components/OperationalTableFrame";
import { SectionPanel } from "@trade-os/operations/components/SectionPanel";
import { SkeletonCards, SkeletonTable } from "@trade-os/operations/components/Skeletons";
import { StatusBadge, type StatusTone } from "@trade-os/operations/components/StatusBadge";
import { useScreenToast } from "@trade-os/operations/components/toast/useToast";
import { Button } from "@trade-os/operations/components/ui/button";
import { Dialog, DialogFooterContainer } from "@trade-os/operations/components/ui/dialog";
import { Select } from "@trade-os/operations/components/ui/dropdown";
import { TextArea } from "@trade-os/operations/components/ui/input";
import { TextLink } from "@trade-os/operations/components/ui/text-link";
import { useEntitlements, useIdentity, usePlatformAuth } from "@trade-os/operations/session/PlatformSessionContext";
import {
  CASH_CALENDAR_BUCKETS,
  FINANCE_DECIMAL_SCALE,
  financeDecimalMagnitude,
  closeSchedule,
  createPaymentSchedule,
  closeScheduleWriteoff,
  downloadSettlementLedgerCsv,
  getPaymentScheduleWriteoffDetail,
  listDealSettlementDisputes,
  getSettlementCalendar,
  getSettlementCounterpartyDeals,
  getSettlementLedger,
  listPaymentScheduleClosureEvents,
  listPaymentScheduleWriteoffProposals,
  uncompleteSchedule,
  getSettlementOverview,
  getAllTradeFinanceFacts,
  openSettlementDispute,
  proposeScheduleWriteoff,
  resolveSettlementDispute,
  reopenSchedule,
  SETTLEMENT_BUCKETS,
  withdrawScheduleWriteoff,
  type LedgerEntry,
  type LedgerPagination,
  type LedgerSourceDocumentState,
  type SettlementCalendar,
  type SettlementDealItem,
  type SettlementOverview,
  type SettlementDispute,
  type SettlementDisputeResolution,
  type PaymentScheduleClosureEvent,
  type PaymentScheduleWriteoffDetail,
  type SettlementBucket,
  type SettlementLedgerQuery,
  type TradeFinanceFact,
  type TradeFinanceFactsResponse,
} from "@trade-os/operations/lib/api/settlement";
import {
  getScheduleCashApplications,
  type RecordScheduleCashResponse,
  type ScheduleCashLedger,
} from "@trade-os/operations/lib/api/scheduleCash";
import { isFinanceDecimal } from "@trade-os/operations/lib/financeDecimal";
import { formatScaledMoney, normalizeDecimalInput } from "@trade-os/operations/lib/money";
import { formatDate, formatDateTime, localTodayISO, todayISOIn } from "@trade-os/operations/lib/orgDate";
import { withRetry } from "@trade-os/operations/lib/api/retry";
import { ApiError } from "@trade-os/operations/lib/api/client";
import { isUuidLike } from "@trade-os/operations/lib/api/erpExtraction";
import type { Loadable } from "@trade-os/operations/lib/loadable";
import {
  canFinalizeMoney,
  canRecordMoney,
  isCapabilityDeniedError,
} from "@trade-os/operations/lib/productEntitlements";
import { CounterpartyScorecardPanel } from "@trade-os/operations/settlement/CounterpartyScorecardPanel";
import { SettlementDecisionCards } from "@trade-os/operations/settlement/SettlementDecisionCards";
import { SettlementDunningPanel } from "@trade-os/operations/settlement/SettlementDunningPanel";
import { SettlementExceptionPanel } from "@trade-os/operations/settlement/SettlementExceptionPanel";
import { CanonicalScheduleCashPanel } from "@trade-os/operations/settlement/CanonicalScheduleCashPanel";
import { recordCashErrorMessage } from "@trade-os/operations/settlement/settlementRecordErrors";
import { marginPercent } from "@trade-os/operations/settlement/settlementMath";
import {
  counterpartyRowKey,
  parseSettlementDrillSearchParams,
  scrollToSettlementSection,
  settlementSectionId,
} from "@trade-os/operations/settlement/settlementDrill";

import type { SettlementDrillTarget } from "@trade-os/operations/settlement/settlementDecisionCardData";
import { findTopOverdueCounterparty } from "@trade-os/operations/settlement/settlementDecisionCardData";
import { useLocaleTag } from "@trade-os/operations/i18n/useLocaleTag";

import type { AppMessages } from "@trade-os/operations/i18n/messages";

type SettlementCopy = AppMessages["erpSettlement"]["settlement"];
type EntitlementCopy = AppMessages["common"]["entitlement"]["missingCapability"];
type WriteoffCopy = SettlementCopy["ledger"]["writeoff"];
type DisputeCopy = SettlementCopy["ledger"]["dispute"];
type CommonLoadableCopy = AppMessages["common"]["loadable"];

const CLOSE_TYPES = ["settled", "adjusted"] as const;
type CloseType = (typeof CLOSE_TYPES)[number];
const isCloseType = (value: string): value is CloseType =>
  CLOSE_TYPES.some((type) => type === value);

type CloseDraftState = {
  closureType: CloseType;
  note: string;
  error: string | null;
};

const EMPTY_CLOSE_DRAFT: CloseDraftState = {
  closureType: "settled",
  note: "",
  error: null,
};

function renderReopenSemanticMarkup(body: string): ReactNode {
  const nodes: ReactNode[] = [];
  const markerPattern = /<nowrap>(.*?)<\/nowrap>/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = markerPattern.exec(body))) {
    if (match.index > cursor) {
      nodes.push(body.slice(cursor, match.index));
    }
    nodes.push(
      <span className="whitespace-nowrap" key={`reopen-nowrap-${match.index}`}>
        {match[1]}
      </span>,
    );
    cursor = match.index + match[0].length;
  }

  if (nodes.length === 0) return body;
  if (cursor < body.length) nodes.push(body.slice(cursor));
  return <>{nodes}</>;
}

type ProjectedSettlementDispute = {
  id: string;
  schedule_id: string;
  deal_id?: string | null;
  disputed_amount?: string | null;
  currency: string;
  status: string;
  resolution?: null;
  projectionOnly: true;
};

type LedgerDispute = SettlementDispute | ProjectedSettlementDispute;

type DisputePanelState = {
  amount: string;
  busy: boolean;
  entryId: string | null;
  error: string | null;
  evidence: string;
  invalidField: DisputeField | null;
  normalAmount: string;
  reason: string;
};

type DisputeField = "normalAmount" | "amount" | "reason";

type DisputePanelAction =
  | { type: "open"; entryId: string; normalAmount: string }
  | { type: "close" }
  | { type: "busy"; busy: boolean }
  | { type: "error"; error: string | null; invalidField?: DisputeField | null }
  | { type: "field"; field: "amount" | "evidence" | "normalAmount" | "reason"; value: string };

const INITIAL_DISPUTE_PANEL_STATE: DisputePanelState = {
  amount: "",
  busy: false,
  entryId: null,
  error: null,
  evidence: "",
  invalidField: null,
  normalAmount: "",
  reason: "",
};

function disputePanelReducer(
  state: DisputePanelState,
  action: DisputePanelAction,
): DisputePanelState {
  switch (action.type) {
    case "open":
      return {
        ...INITIAL_DISPUTE_PANEL_STATE,
        entryId: action.entryId,
        normalAmount: action.normalAmount,
      };
    case "close":
      return { ...state, entryId: null, error: null, invalidField: null };
    case "busy":
      return { ...state, busy: action.busy };
    case "error":
      return {
        ...state,
        error: action.error,
        ...(action.invalidField === undefined ? {} : { invalidField: action.invalidField }),
      };
    case "field":
      return { ...state, [action.field]: action.value };
  }
}

// AR/AP aging buckets in display order (mirrors the backend agingCase).
const AGING_BUCKETS = ["current", "d1_30", "d31_60", "d61_90", "d90_plus"] as const;
const FINANCE_ZERO = BigInt(0);
const SETTLEMENT_LEDGER_PAGE_SIZE = 500;

// A third, always-fully-loaded tab surfaces direction_pending rows (SSOT
// 05-01-settlement-data-dictionary.md §7: displayed in the ledger, excluded
// from the receivable/payable aggregates — the aggregates live in
// SettlementOverview and already exclude this type; this tab only fixes the
// ledger table's own reachability).
const SETTLEMENT_LEDGER_TABS = ["receivable", "payable", "direction_pending"] as const;
type SettlementLedgerTab = (typeof SETTLEMENT_LEDGER_TABS)[number];

type SettlementLedgerResponse = Awaited<ReturnType<typeof getSettlementLedger>>;

async function loadAllReceivableLedgerEntries(
  getIdToken: () => Promise<string>,
  firstPage?: Promise<SettlementLedgerResponse>,
): Promise<LedgerEntry[]> {
  const entries: LedgerEntry[] = [];
  let offset = 0;
  let page = await (firstPage ??
    getSettlementLedger(getIdToken, "receivable", {
      limit: SETTLEMENT_LEDGER_PAGE_SIZE,
      offset,
    }));

  while (true) {
    entries.push(...page.entries);
    const pagination = page.pagination;
    const pageLimit = pagination?.limit || SETTLEMENT_LEDGER_PAGE_SIZE;
    if (
      !pagination ||
      page.entries.length === 0 ||
      page.entries.length < pageLimit ||
      entries.length >= pagination.total
    ) {
      return entries;
    }

    offset = pagination.offset + pageLimit;
    page = await getSettlementLedger(getIdToken, "receivable", {
      limit: pageLimit,
      offset,
    });
  }
}

// The ledger endpoint only WHERE-filters on the server for "receivable" and
// "payable" (settlement_owner.go ledgerQuery) — any other type value,
// including "direction_pending", is treated as no filter and returns every
// row. Rather than mock a server contract that doesn't exist yet, the
// direction-pending tab sweeps the unfiltered ledger to completion (mirroring
// loadAllReceivableLedgerEntries above) and keeps only the matching rows, so
// its count always describes exactly what gets rendered — no partial page,
// no silent drop past the first fetch.
async function loadAllDirectionPendingLedgerEntries(
  getIdToken: () => Promise<string>,
  filters?: Pick<SettlementLedgerQuery, "currency" | "bucket" | "includeCancelled">,
): Promise<LedgerEntry[]> {
  const entries: LedgerEntry[] = [];
  let offset = 0;
  let consumed = 0;

  while (true) {
    const page = await getSettlementLedger(getIdToken, undefined, {
      ...filters,
      limit: SETTLEMENT_LEDGER_PAGE_SIZE,
      offset,
    });
    entries.push(...page.entries.filter((entry) => entry.type === "direction_pending"));
    consumed += page.entries.length;
    const pagination = page.pagination;
    const pageLimit = pagination?.limit || SETTLEMENT_LEDGER_PAGE_SIZE;
    if (
      !pagination ||
      page.entries.length === 0 ||
      page.entries.length < pageLimit ||
      consumed >= pagination.total
    ) {
      return entries;
    }

    offset = pagination.offset + pageLimit;
  }
}

function sectionLoadableCopy(
  copy: CommonLoadableCopy,
  section: string,
  empty = copy.empty,
): LoadableSectionCopy {
  return {
    loading: copy.loading,
    empty,
    restricted: copy.restricted,
    error: `${section}: ${copy.error}`,
    retry: copy.retry,
    correlationId: copy.correlationId,
  };
}

function sourceDocumentStateLabel(
  state: LedgerSourceDocumentState | undefined,
  copy: SettlementCopy,
): string {
  switch (state) {
    case "verified":
      return copy.ledger.sourceDocumentStates.verified;
    case "ambiguous":
      return copy.ledger.sourceDocumentStates.ambiguous;
    case "legacy_unknown":
      return copy.ledger.sourceDocumentStates.legacyUnknown;
    case "none":
    case undefined:
      return copy.ledger.sourceDocumentStates.none;
  }
}
// SC-21 Badge Matrix line 27: `없음`/`모호` carry 주의, `Legacy` carries 중립.
// Colour alone must not distinguish them (badge-matrix.md 적용 원칙), so the
// label stays and only the tone differs.
function sourceDocumentStateTone(
  state: LedgerEntry["source_document_state"],
): StatusTone {
  switch (state) {
    case "ambiguous":
    case "none":
    case undefined:
      return "warning";
    case "legacy_unknown":
    case "verified":
      return "neutral";
  }
}
// SC-21 Badge Matrix line 24: `받을 돈` 성공 / `지급할 돈` 주의. `방향 미정` is not
// in the matrix and stays 중립.
function ledgerTypeTone(type: LedgerEntry["type"] | null | undefined): StatusTone {
  switch (type) {
    case "receivable":
      return "success";
    case "payable":
      return "warning";
    default:
      return "neutral";
  }
}
// SC-21 Badge Matrix line 25: `연체` shows when the due date has passed and
// outstanding remains. The server owns the overdue decision (payment_schedules
// status is 'overdue' in the org business timezone); a closed line is excluded.
function isLedgerEntryOverdue(entry: LedgerEntry): boolean {
  if (entry.closure_type) return false;
  if (entry.status !== "overdue") return false;
  return financeDecimalMagnitude(entry.outstanding) > FINANCE_ZERO;
}
function ledgerTypeLabel(
  type: LedgerEntry["type"] | null | undefined,
  copy: SettlementCopy,
): string {
  switch (type) {
    case "receivable":
      return copy.ledger.tabs.receivable;
    case "payable":
      return copy.ledger.tabs.payable;
    case "direction_pending":
      return copy.ledger.tabs.direction_pending;
    case null:
    case undefined:
      return copy.ledger.types.unknown;
  }
}

type WriteoffDialogData = {
  events: PaymentScheduleClosureEvent[];
  settlement: ScheduleCashLedger;
  schedule: PaymentScheduleWriteoffDetail;
};

type WriteoffDialogState = Loadable<WriteoffDialogData>;

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ready";
      cashCalendar: Loadable<SettlementCalendar>;
      financeFacts: Loadable<TradeFinanceFactsResponse>;
      overview: SettlementOverview;
      ledger: LedgerEntry[];
      // Which tab's request produced the currently-held ledger/ledgerTotal —
      // compared against the live `tab` state so a tab switch renders a
      // loading placeholder instead of the previous tab's stale, mislabeled
      // rows while the new tab's fetch is still in flight.
      ledgerTab: SettlementLedgerTab;
      receivableLedger: Loadable<LedgerEntry[]>;
      ledgerTotal: number;
      ledgerPagination?: LedgerPagination;
      writeoffProposals: Loadable<PaymentScheduleWriteoffDetail[]>;
      // Bumped on every completed fetch, success or not. A dependency a
      // consumer can use to detect "a reload just landed" without assuming
      // the API returns a new array/object reference each time (it may
      // legitimately resolve to the same one, e.g. an unchanged response).
      version: number;
      refreshing: boolean;
      refreshError: boolean;
    };

function capabilityDeniedMessage(
  error: unknown,
  capability: "erp.money.record" | "erp.money",
  copy: EntitlementCopy,
): string | null {
  if (!isCapabilityDeniedError(error)) return null;
  return capability === "erp.money.record" ? copy.moneyRecord : copy.moneyFinalize;
}

function settlementDisputeResolveErrorMessage(
  error: unknown,
  resolution: SettlementDisputeResolution,
  copy: DisputeCopy,
  entitlementCopy: EntitlementCopy,
): string {
  if (
    resolution === "write_off" &&
    error instanceof ApiError &&
    error.code === "AUTH_REAUTHENTICATION_REQUIRED"
  ) {
    return copy.errors.reauthenticationRequired;
  }
  return (
    capabilityDeniedMessage(
      error,
      resolution === "write_off" ? "erp.money" : "erp.money.record",
      entitlementCopy,
    ) ?? copy.errors.generic
  );
}

function writeoffErrorMessage(error: unknown, copy: WriteoffCopy): string {
  if (!(error instanceof ApiError)) return copy.errors.generic;
  switch (error.code) {
    case "ERP_PAYMENT_VALIDATION":
      return copy.errors.validation;
    case "ERP_PAYMENT_FORBIDDEN":
    case "ENTITLEMENT_ROLE_FORBIDDEN":
      return copy.errors.forbidden;
    case "ERP_PAYMENT_WRITEOFF_ALREADY_PROPOSED":
      return copy.errors.alreadyProposed;
    case "ERP_PAYMENT_ALREADY_CLOSED":
    case "ERP_PAYMENT_NOT_CLOSED":
    case "ERP_PAYMENT_NOT_FOUND":
    case "ERP_PAYMENT_NO_WRITEOFF_PROPOSAL":
      return copy.errors.stale;
    default:
      return copy.errors.generic;
  }
}

function writeoffEventLabel(eventType: string, copy: WriteoffCopy): string {
  switch (eventType) {
    case "proposed":
      return copy.eventTypes.proposed;
    case "proposal_withdrawn":
      return copy.eventTypes.proposal_withdrawn;
    case "proposal_rejected":
      return copy.eventTypes.proposal_rejected;
    case "closed":
      return copy.eventTypes.closed;
    case "reopened":
      return copy.eventTypes.reopened;
    default:
      return eventType.replace(/_/g, " ");
  }
}

function disputeResolutionLabel(
  resolution: SettlementDisputeResolution | null | undefined,
  copy: DisputeCopy,
): string {
  switch (resolution) {
    case "resume":
      return copy.resolutions.resume;
    case "write_off":
      return copy.resolutions.writeOff;
    case "adjust":
      return copy.resolutions.adjust;
    case null:
    case undefined:
      return copy.statusOpen;
  }
}

function isOpenSettlementDispute(
  dispute: Pick<SettlementDispute, "status" | "resolution">,
): boolean {
  const status = dispute.status.toLowerCase();
  return !dispute.resolution && status !== "resolved" && status !== "closed";
}

function hasProjectedOpenSettlementDispute(entry: LedgerEntry): boolean {
  return entry.open_dispute_status?.toLowerCase() === "open";
}

// SSOT 05-settlement.md:179/:185/:189/:191 name these values as max-4dp or
// "통화별 정확한 소수", so they are formatted from the exact scale-10 integer
// rather than a minor-unit-rounded double.
// bigint subtraction cannot feed Array.sort, which requires a number.
function compareFinance(a: bigint, b: bigint): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function fmtExact(value: bigint | string, currency?: string, locale?: string): string {
  const scaled = typeof value === "bigint" ? value : financeDecimalMagnitude(value);
  return formatScaledMoney(scaled, FINANCE_DECIMAL_SCALE, currency, locale);
}

function exactMoneyCacheKey(
  value: bigint | string,
  currency?: string,
): string {
  const typedValue = typeof value === "bigint" ? `b:${value}` : `s:${value}`;
  return `${currency ?? ""}\u0000${typedValue}`;
}

// Non-color cue for profit/loss and net-cash figures — the red/green classes
// alone aren't distinguishable for ~8% of men (deuteranopia/protanopia), so
// pair them with a directional glyph a colorblind user can scan for.

function financeSignGlyph(value: bigint): string {
  if (value < FINANCE_ZERO) return "▼ ";
  if (value > FINANCE_ZERO) return "▲ ";
  return "";
}

type ProfitabilityRollupRow = {
  key: string;
  label: string;
  currency: string;
  dealCount: number;
  revenue: bigint;
  adjustedGp: bigint;
  receivableOutstanding: bigint;
  payableOutstanding: bigint;
  readyCount: number;
  blockedCount: number;
  incompleteInvoiceBasisCount: number;
};

function hasIncompleteInvoiceBasis(fact: TradeFinanceFact): boolean {
  return fact.handoff_blockers.some((blocker) => blocker === "missing_invoice_basis" || blocker === "invalid_invoice_basis");
}

type ProfitabilityRollupDecision = {
  label: string;
  body: string;
  tone: "danger" | "neutral" | "success" | "warning";
};


function coveragePercent(row: Pick<ProfitabilityRollupRow, "blockedCount" | "readyCount">): number {
  const total = row.readyCount + row.blockedCount;
  return total > 0 ? (row.readyCount / total) * 100 : 0;
}

function coverageLabel(row: ProfitabilityRollupRow, copy: SettlementCopy["financeRollup"]): string {
  const pct = coveragePercent(row);
  if (pct === 100) return copy.coverageReady;
  if (pct === 0) return copy.coverageBlocked;
  return copy.coveragePartial.replace("{pct}", pct.toFixed(0));
}

function profitabilityRollupDecision(
  row: ProfitabilityRollupRow,
  copy: SettlementCopy["financeRollup"],
): ProfitabilityRollupDecision {
  if (row.incompleteInvoiceBasisCount > 0) {
    return { body: copy.missingInvoiceBasisBody, label: copy.decisionBlocked, tone: "warning" };
  }
  const margin = marginPercent(row);
  if (margin === null) {
    return { body: copy.decisionIncompleteBody, label: copy.decisionIncomplete, tone: "neutral" };
  }
  if (row.adjustedGp < 0 || margin < 0) {
    return { body: copy.decisionLossBody, label: copy.decisionLoss, tone: "danger" };
  }
  if (row.blockedCount > 0) {
    return {
      body: copy.decisionBlockedBody.replace("{count}", String(row.blockedCount)),
      label: copy.decisionBlocked,
      tone: "warning",
    };
  }
  if (margin < 10) {
    return { body: copy.decisionThinBody, label: copy.decisionThin, tone: "warning" };
  }
  return { body: copy.decisionReadyBody, label: copy.decisionReady, tone: "success" };
}

function profitabilityDecisionStyle(tone: ProfitabilityRollupDecision["tone"]): CSSProperties {
  switch (tone) {
    case "danger":
      return { backgroundColor: "var(--ecoya-system-red-1)", color: "var(--ecoya-system-red-5)" };
    case "warning":
      return { backgroundColor: "var(--ecoya-status-warning-bg)", color: "var(--ecoya-status-warning)" };
    case "success":
      return { backgroundColor: "var(--ecoya-system-green-1)", color: "var(--ecoya-system-green-6)" };
    default:
      return { backgroundColor: "var(--ecoya-surface-muted)", color: "var(--ecoya-text-muted)" };
  }
}

function buildProfitabilityRollups(
  facts: TradeFinanceFact[],
  dimension: "counterparty" | "assignee",
  unknown: string,
): ProfitabilityRollupRow[] {
  const groups = new Map<
    string,
    Omit<ProfitabilityRollupRow, "dealCount"> & { dealIds: Set<string> }
  >();
  for (const fact of facts) {
    const label =
      dimension === "counterparty"
        ? fact.counterparty_name?.trim() || unknown
        : fact.assignee_name?.trim() || unknown;
    const currency = fact.currency.toUpperCase();
    const key = `${dimension}:${label}:${currency}`;
    const row =
      groups.get(key) ??
      {
        adjustedGp: FINANCE_ZERO,
        blockedCount: 0,
        incompleteInvoiceBasisCount: 0,
        currency,
        dealIds: new Set<string>(),
        key,
        label,
        receivableOutstanding: FINANCE_ZERO,
        payableOutstanding: FINANCE_ZERO,
        readyCount: 0,
        revenue: FINANCE_ZERO,
      };
    if (fact.deal_id) row.dealIds.add(fact.deal_id);
    row.revenue += financeDecimalMagnitude(fact.revenue_amount ?? "0");
    row.adjustedGp += financeDecimalMagnitude(fact.adjusted_gp_amount ?? "0");
    row.receivableOutstanding += financeDecimalMagnitude(fact.receivable_outstanding_amount);
    row.payableOutstanding += financeDecimalMagnitude(fact.payable_outstanding_amount);
    if (hasIncompleteInvoiceBasis(fact)) row.incompleteInvoiceBasisCount += 1;
    if (fact.handoff_ready && !hasIncompleteInvoiceBasis(fact)) row.readyCount += 1;
    else row.blockedCount += 1;
    groups.set(key, row);
  }

  return [...groups.values()]
    .map(({ dealIds, ...row }) => ({ ...row, dealCount: dealIds.size || row.readyCount + row.blockedCount }))
    .sort((a, b) => {
      if (a.currency !== b.currency) return a.currency.localeCompare(b.currency);
      return compareFinance(b.adjustedGp, a.adjustedGp);
    });
}

function pickTopAdjustedGp(rows: ProfitabilityRollupRow[]): ProfitabilityRollupRow | null {
  return rows.filter((row) => row.incompleteInvoiceBasisCount === 0)
    .sort((a, b) => compareFinance(b.adjustedGp, a.adjustedGp))[0] ?? null;
}

function pickProfitabilityRisk(rows: ProfitabilityRollupRow[]): ProfitabilityRollupRow | null {
  return [...rows].sort((a, b) => {
    const aNegative = a.adjustedGp < FINANCE_ZERO ? 1 : 0;
    const bNegative = b.adjustedGp < FINANCE_ZERO ? 1 : 0;
    if (aNegative !== bNegative) return bNegative - aNegative;
    if (a.blockedCount !== b.blockedCount) return b.blockedCount - a.blockedCount;
    const aMargin = marginPercent(a);
    const bMargin = marginPercent(b);
    if (aMargin === null) return bMargin === null ? 0 : -1;
    if (bMargin === null) return 1;
    return aMargin - bMargin;
  })[0] ?? null;
}

function formatMarginPercent(
  row: ProfitabilityRollupRow,
  copy: SettlementCopy["financeRollup"],
): string {
  if (row.incompleteInvoiceBasisCount > 0) return copy.marginNotCalculable;
  const margin = marginPercent(row);
  return margin === null ? copy.marginNotCalculable : `${margin.toFixed(2)}%`;
}

function ProfitabilitySummaryCard({
  caption,
  copy,
  row,
}: {
  caption: string;
  copy: SettlementCopy["financeRollup"];
  row: ProfitabilityRollupRow | null;
}) {
  const moneyLocale = useLocaleTag();
  if (!row) {
    return (
      <div className="rounded-lg border border-border-muted bg-surface-card p-4">
        <div className="text-label-12 font-semibold uppercase text-text-disabled">{caption}</div>
        <div className="mt-2 text-body-14 text-text-muted">{copy.noEligibleInvoiceBasis}</div>
      </div>
    );
  }
  const coverage = coveragePercent(row);
  const decision = profitabilityRollupDecision(row, copy);
  return (
    <div className="rounded-lg border border-border-muted bg-surface-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="text-label-12 font-semibold uppercase text-text-disabled">{caption}</div>
        <StatusBadge
          className="px-2 text-label-12"
          meaning="state"
          style={profitabilityDecisionStyle(decision.tone)}
          tone={decision.tone}
        >
          {decision.label}
        </StatusBadge>
      </div>
      <div className="mt-2 truncate text-body-15 font-semibold text-text-primary" title={row.label}>
        {row.label}
      </div>
      <div
        className={`mt-1 text-body-20 font-semibold ${
          row.incompleteInvoiceBasisCount > 0 ? "text-text-muted" : row.adjustedGp < FINANCE_ZERO ? "text-status-danger" : "text-status-success"
        }`}
      >
        {row.incompleteInvoiceBasisCount > 0 ? copy.missingInvoiceBasis : <>
          <span aria-hidden="true">{financeSignGlyph(row.adjustedGp)}</span>
          {fmtExact(row.adjustedGp, row.currency, moneyLocale)}
        </>}
      </div>
      <div className="mt-1 text-label-12 text-text-muted">
        {formatMarginPercent(row, copy)} - {copy.blockedFacts.replace("{count}", String(row.blockedCount))}
      </div>
      <p className="mt-2 text-label-12 leading-relaxed text-text-muted">{decision.body}</p>
      <div className="mt-2">
        <div className="flex items-center justify-between gap-2 text-label-12">
          <span className="text-text-muted">{copy.coverage}</span>
          <span className={coverage === 100 ? "text-status-success" : "text-status-warning"}>
            {coverageLabel(row, copy)}
          </span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-muted">
          <div
            className={coverage === 100 ? "h-full bg-status-success-bg" : "h-full bg-status-warning-bg"}
            style={{ width: `${coverage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ProfitabilityRollupTable({
  copy,
  nameLabel,
  rows,
}: {
  copy: SettlementCopy["financeRollup"];
  nameLabel: string;
  rows: ProfitabilityRollupRow[];
}) {
  const moneyLocale = useLocaleTag();
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-border-muted bg-surface-card px-4 py-3 text-body-13 text-text-muted">
        {copy.empty}
      </p>
    );
  }
  return (
    <OperationalTableFrame
      className="rounded-lg border border-border-muted bg-surface-card"
      keyboardScrollable
      label={nameLabel}
    >
      <HostTable className="w-full border-collapse text-body-13 tabular-nums">
        <HostTableHeader>
          <HostTableRow className="whitespace-nowrap border-b border-border-muted bg-surface text-text-secondary">
            <HostTableHead scope="col" className="px-3 py-2 text-left font-medium">{nameLabel}</HostTableHead>
            <HostTableHead scope="col" className="px-3 py-2 text-right font-medium">{copy.deals}</HostTableHead>
            <HostTableHead scope="col" className="px-3 py-2 text-right font-medium">{copy.revenue}</HostTableHead>
            <HostTableHead scope="col" className="px-3 py-2 text-right font-medium">{copy.adjustedGp}</HostTableHead>
            <HostTableHead scope="col" className="px-3 py-2 text-right font-medium">{copy.margin}</HostTableHead>
            <HostTableHead scope="col" className="px-3 py-2 text-left font-medium">{copy.decision}</HostTableHead>
            <HostTableHead scope="col" className="px-3 py-2 text-right font-medium">{copy.outstanding}</HostTableHead>
            <HostTableHead scope="col" className="px-3 py-2 text-right font-medium">{copy.readiness}</HostTableHead>
          </HostTableRow>
        </HostTableHeader>
        <HostTableBody>
          {rows.slice(0, 8).map((row) => {
            const coverage = coveragePercent(row);
            const decision = profitabilityRollupDecision(row, copy);
            return (
              <HostTableRow className="border-b border-border-subtle last:border-0" key={row.key}>
                <HostTableCell className="px-3 py-2 text-text-primary">{row.label}</HostTableCell>
                <HostTableCell className="whitespace-nowrap px-3 py-2 text-right text-text-primary">{row.dealCount}</HostTableCell>
                <HostTableCell className="whitespace-nowrap px-3 py-2 text-right text-text-primary">{row.incompleteInvoiceBasisCount > 0 ? copy.missingInvoiceBasis : fmtExact(row.revenue, row.currency, moneyLocale)}</HostTableCell>
                <HostTableCell
                  className={`whitespace-nowrap px-3 py-2 text-right font-medium ${
                    row.incompleteInvoiceBasisCount > 0 ? "text-text-muted" : row.adjustedGp < FINANCE_ZERO ? "text-status-danger" : "text-status-success"
                  }`}
                >
                  {row.incompleteInvoiceBasisCount > 0 ? copy.missingInvoiceBasis : <>
                    <span aria-hidden="true">{financeSignGlyph(row.adjustedGp)}</span>
                    {fmtExact(row.adjustedGp, row.currency, moneyLocale)}
                  </>}
                </HostTableCell>
                <HostTableCell className="whitespace-nowrap px-3 py-2 text-right text-text-primary">{formatMarginPercent(row, copy)}</HostTableCell>
                <HostTableCell className="px-3 py-2">
                  <StatusBadge
                    className="px-2 text-label-12"
                    meaning="state"
                    style={profitabilityDecisionStyle(decision.tone)}
                    tone={decision.tone}
                  >
                    {decision.label}
                  </StatusBadge>
                </HostTableCell>
                <HostTableCell className="whitespace-nowrap px-3 py-2 text-right text-text-primary">
                  <span className="block">{copy.receivable}: {fmtExact(row.receivableOutstanding, row.currency, moneyLocale)}</span>
                  <span className="block text-text-muted">{copy.payable}: {fmtExact(row.payableOutstanding, row.currency, moneyLocale)}</span>
                </HostTableCell>
                <HostTableCell className="px-3 py-2 text-right text-text-primary">
                  <div className="flex flex-col items-end gap-1">
                    <span className="whitespace-nowrap">{row.readyCount}/{row.readyCount + row.blockedCount}</span>
                    <span className={`whitespace-nowrap ${coverage === 100 ? "text-label-12 text-status-success" : "text-label-12 text-status-warning"}`}>
                      {coverageLabel(row, copy)}
                    </span>
                  </div>
                </HostTableCell>
              </HostTableRow>
            );
          })}
        </HostTableBody>
      </HostTable>
    </OperationalTableFrame>
  );
}

function TradeProfitabilityRollupPanel({
  copy,
  facts,
  unknown,
}: {
  copy: SettlementCopy["financeRollup"];
  facts: TradeFinanceFact[];
  unknown: string;
}) {
  const counterpartyRows = useMemo(() => buildProfitabilityRollups(facts, "counterparty", unknown), [facts, unknown]);
  const assigneeRows = useMemo(() => buildProfitabilityRollups(facts, "assignee", unknown), [facts, unknown]);
  const topCounterparty = useMemo(() => pickTopAdjustedGp(counterpartyRows), [counterpartyRows]);
  const topAssignee = useMemo(() => pickTopAdjustedGp(assigneeRows), [assigneeRows]);
  const riskCounterparty = useMemo(() => pickProfitabilityRisk(counterpartyRows), [counterpartyRows]);

  return (
    <SectionPanel
      id="settlement-profitability"
      data-component="TradeProfitabilityRollupPanel"
      title={copy.title}
      description={copy.subtitle}
    >
      {facts.length === 0 ? (
        <p className="text-body-13 text-text-muted">{copy.empty}</p>
      ) : (
        <>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <ProfitabilitySummaryCard caption={copy.topCounterparty} copy={copy} row={topCounterparty} />
            <ProfitabilitySummaryCard caption={copy.topAssignee} copy={copy} row={topAssignee} />
            <ProfitabilitySummaryCard caption={copy.needsDecision} copy={copy} row={riskCounterparty} />
          </div>
          <div className="grid min-w-0 gap-4 xl:grid-cols-2">
            <div className="min-w-0">
              <h4 className="mb-2 text-body-13 font-semibold text-ecoya-gray-3">{copy.counterpartyTitle}</h4>
              <ProfitabilityRollupTable copy={copy} nameLabel={copy.counterparty} rows={counterpartyRows} />
            </div>
            <div className="min-w-0">
              <h4 className="mb-2 text-body-13 font-semibold text-ecoya-gray-3">{copy.assigneeTitle}</h4>
              <ProfitabilityRollupTable copy={copy} nameLabel={copy.assignee} rows={assigneeRows} />
            </div>
          </div>
        </>
      )}
    </SectionPanel>
  );
}

function TradeFinanceFactPanel({
  copy,
  facts,
}: {
  copy: SettlementCopy["financeFacts"];
  facts: TradeFinanceFact[];
}) {
  const moneyLocale = useLocaleTag();
  const [statusFilter, setStatusFilter] = useState<"all" | "attention" | "ready">("all");
  const [pageIndex, setPageIndex] = useState(0);
  const sortedFacts = useMemo(
    () =>
      facts
        .map((fact) => ({
          fact,
          outstanding:
            financeDecimalMagnitude(fact.receivable_outstanding_amount)
            + financeDecimalMagnitude(fact.payable_outstanding_amount),
        }))
        .sort((a, b) => {
          if (a.fact.handoff_ready !== b.fact.handoff_ready) {
            return a.fact.handoff_ready ? 1 : -1;
          }
          return compareFinance(b.outstanding, a.outstanding);
        })
        .map(({ fact }) => fact),
    [facts],
  );
  const filteredFacts = useMemo(
    () =>
      sortedFacts.filter((fact) => {
        const ready = fact.handoff_ready && !hasIncompleteInvoiceBasis(fact);
        if (statusFilter === "ready") return ready;
        if (statusFilter === "attention") return !ready;
        return true;
      }),
    [sortedFacts, statusFilter],
  );
  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(filteredFacts.length / pageSize));
  const currentPageIndex = Math.min(pageIndex, pageCount - 1);
  const rows = filteredFacts.slice(
    currentPageIndex * pageSize,
    (currentPageIndex + 1) * pageSize,
  );
  const visibleFrom = filteredFacts.length === 0 ? 0 : currentPageIndex * pageSize + 1;
  const visibleTo = Math.min((currentPageIndex + 1) * pageSize, filteredFacts.length);
  const showingLabel = copy.showing
    .replace("{from}", String(visibleFrom))
    .replace("{to}", String(visibleTo))
    .replace("{total}", String(filteredFacts.length));

  return (
    <SectionPanel
      data-component="TradeFinanceFactPanel"
      title={copy.title}
      description={copy.subtitle}
      action={<span className="text-label-12 text-text-secondary">{facts.length}</span>}
    >
      {facts.length === 0 ? (
        <p className="text-body-13 text-text-muted">{copy.empty}</p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <Select
              aria-label={copy.filterLabel}
              className="w-full sm:w-52"
              onValueChange={(value) => {
                setStatusFilter(value as "all" | "attention" | "ready");
                setPageIndex(0);
              }}
              options={[
                { label: copy.filterAll, value: "all" },
                { label: copy.filterAttention, value: "attention" },
                { label: copy.filterReady, value: "ready" },
              ]}
              size="sm"
              value={statusFilter}
            />
            <span aria-live="polite" className="text-label-12 text-text-muted">
              {showingLabel}
            </span>
          </div>
          {rows.length === 0 ? (
            <p className="text-body-13 text-text-muted">{copy.filteredEmpty}</p>
          ) : (
          <OperationalTableFrame keyboardScrollable label={copy.title}>
          <HostTable className="w-full border-collapse text-body-13 tabular-nums">
            <HostTableHeader>
              <HostTableRow className="border-b border-border-muted bg-surface text-text-secondary">
                <HostTableHead scope="col" className="px-3 py-2 text-left font-medium">{copy.deal}</HostTableHead>
                <HostTableHead scope="col" className="px-3 py-2 text-left font-medium">{copy.counterparty}</HostTableHead>
                <HostTableHead scope="col" className="px-3 py-2 text-left font-medium">{copy.assignee}</HostTableHead>
                <HostTableHead scope="col" className="px-3 py-2 text-right font-medium">{copy.revenue}</HostTableHead>
                <HostTableHead scope="col" className="px-3 py-2 text-right font-medium">{copy.goodsCost}</HostTableHead>
                <HostTableHead scope="col" className="px-3 py-2 text-right font-medium">{copy.landedCost}</HostTableHead>
                <HostTableHead scope="col" className="px-3 py-2 text-right font-medium">{copy.adjustedGp}</HostTableHead>
                <HostTableHead scope="col" className="px-3 py-2 text-right font-medium">{copy.outstanding}</HostTableHead>
                <HostTableHead scope="col" className="px-3 py-2 text-left font-medium">{copy.quality}</HostTableHead>
                <HostTableHead scope="col" className="px-3 py-2 text-left font-medium">{copy.source}</HostTableHead>
              </HostTableRow>
            </HostTableHeader>
            <HostTableBody>
              {rows.map((fact, index) => {
                const adjusted = financeDecimalMagnitude(fact.adjusted_gp_amount ?? "0");
                const missingInvoiceBasis = hasIncompleteInvoiceBasis(fact);
                const missingPaymentSchedule = fact.handoff_blockers.includes("missing_payment_schedule");
                const ready = fact.handoff_ready && !missingInvoiceBasis;
                return (
                  <HostTableRow
                    className="border-b border-border-subtle last:border-0"
                    data-ui="trade-finance-fact-row"
                    key={`${fact.deal_id ?? "none"}-${fact.currency}-${index}`}
                  >
                    <HostTableCell className="px-3 py-2">
                      {fact.deal_id ? (
                        <Link href={`/erp/deals/${fact.deal_id}`} className="text-ecoya-accent hover:underline">
                          {fact.deal_id.slice(0, 8)}
                        </Link>
                      ) : (
                        <span className="text-text-muted">{copy.unknown}</span>
                      )}
                    </HostTableCell>
                    <HostTableCell className="px-3 py-2 text-text-primary">{fact.counterparty_name || copy.unknown}</HostTableCell>
                    <HostTableCell className="px-3 py-2 text-text-primary">{fact.assignee_name || copy.unknown}</HostTableCell>
                    <HostTableCell className="px-3 py-2 text-right text-text-primary">
                      {missingInvoiceBasis ? copy.missingInvoiceBasis : fmtExact(fact.revenue_amount, fact.currency, moneyLocale)}
                    </HostTableCell>
                    <HostTableCell className="px-3 py-2 text-right text-text-primary">
                      {missingInvoiceBasis ? copy.missingInvoiceBasis : fmtExact(fact.goods_cost_amount, fact.currency, moneyLocale)}
                    </HostTableCell>
                    <HostTableCell className="px-3 py-2 text-right text-text-primary">
                      {fmtExact(fact.landed_cost_amount, fact.currency, moneyLocale)}
                    </HostTableCell>
                    <HostTableCell
                      className={`px-3 py-2 text-right font-medium ${
                        missingInvoiceBasis ? "text-text-muted" : adjusted < FINANCE_ZERO ? "text-status-danger" : "text-status-success"
                      }`}
                    >
                      {missingInvoiceBasis ? copy.missingInvoiceBasis : <>
                        <span aria-hidden="true">{financeSignGlyph(adjusted)}</span>
                        {fmtExact(fact.adjusted_gp_amount ?? "0", fact.currency, moneyLocale)}
                      </>}
                      {!missingInvoiceBasis && fact.adjusted_gp_pct ? (
                        <span className="ml-1 text-text-muted">({fact.adjusted_gp_pct}%)</span>
                      ) : null}
                    </HostTableCell>
                    <HostTableCell className="whitespace-nowrap px-3 py-2 text-right text-text-primary">
                      <span className="block">{copy.receivableOutstanding}: {fmtExact(fact.receivable_outstanding_amount, fact.currency, moneyLocale)}</span>
                      <span className="block text-text-muted">{copy.payableOutstanding}: {fmtExact(fact.payable_outstanding_amount, fact.currency, moneyLocale)}</span>
                    </HostTableCell>
                    <HostTableCell className="px-3 py-2">
                      <StatusBadge
                        className="px-2 text-label-12 font-normal"
                        meaning="state"
                        style={profitabilityDecisionStyle(ready ? "success" : "warning")}
                        tone={ready ? "success" : "warning"}
                      >
                        {ready ? copy.ready : copy.blocked}
                      </StatusBadge>
                      {missingInvoiceBasis ? <p className="mt-1 min-w-48 text-label-12 text-text-muted">{fact.handoff_blockers.includes("invalid_invoice_basis") ? copy.invalidInvoiceBasisBody : copy.missingInvoiceBasisBody}</p>
                        : missingPaymentSchedule ? <p className="mt-1 min-w-48 text-label-12 text-text-muted">{copy.missingPaymentScheduleBody}</p>
                          : <span className="ml-2 text-text-muted">{fact.data_quality}</span>}
                    </HostTableCell>
                    <HostTableCell className="max-w-56 px-3 py-2 text-text-muted">
                      {(fact.source_document_numbers ?? []).length > 0 ? (
                        <span className="flex flex-wrap gap-x-2 gap-y-0.5">
                          {(fact.source_document_numbers ?? []).map((docNumber) => (
                            <Link
                              key={docNumber}
                              className="whitespace-nowrap text-ecoya-accent hover:underline"
                              data-ui="finance-fact-source-link"
                              href={`/erp/documents?q=${encodeURIComponent(docNumber)}${
                                fact.deal_id ? `&deal_id=${encodeURIComponent(fact.deal_id)}` : ""
                              }`}
                            >
                              {docNumber}
                            </Link>
                          ))}
                        </span>
                      ) : (
                        "-"
                      )}
                    </HostTableCell>
                  </HostTableRow>
                );
              })}
            </HostTableBody>
          </HostTable>
          </OperationalTableFrame>
          )}
          {pageCount > 1 ? (
            <nav
              aria-label={copy.paginationLabel}
              className="mt-4 flex items-center justify-center gap-3"
              data-ui="trade-finance-fact-pagination"
            >
              <Button
                disabled={currentPageIndex === 0}
                onClick={() => setPageIndex(Math.max(0, currentPageIndex - 1))}
                size="sm"
                type="button"
                variant="tertiary"
              >
                {copy.previousPage}
              </Button>
              <span className="text-label-12 text-text-muted">
                {copy.pageOf
                  .replace("{page}", String(currentPageIndex + 1))
                  .replace("{total}", String(pageCount))}
              </span>
              <Button
                disabled={currentPageIndex >= pageCount - 1}
                onClick={() => setPageIndex(Math.min(pageCount - 1, currentPageIndex + 1))}
                size="sm"
                type="button"
                variant="tertiary"
              >
                {copy.nextPage}
              </Button>
            </nav>
          ) : null}
        </>
      )}
    </SectionPanel>
  );
}

// FE#760 후속(PR #782 리뷰): renders the counterparty a drill target points
// at when it is absent from overview.by_counterparty (see the
// drillOnlyCounterparty comment in SettlementView for why this happens).
// Always rendered expanded — there is no summary-only collapsed state for a
// row that was never part of the summary to begin with; collapsing it calls
// onCollapse and the row disappears, exactly like collapsing a listed row
// leaves no trace once its deals detail closes.
function DrillOnlyCounterpartyRow({
  copy,
  dealsState,
  loadableCopy,
  onCollapse,
  onRetry,
  renderDealsList,
  target,
}: {
  copy: SettlementCopy;
  dealsState: Loadable<SettlementDealItem[]>;
  loadableCopy: CommonLoadableCopy;
  onCollapse: () => void;
  onRetry: () => void;
  renderDealsList: (deals: SettlementDealItem[]) => ReactNode;
  target: { name: string | null | undefined; currency: string; counterpartyId?: string | null };
}) {
  const loadingDeals = !dealsState || dealsState.status === "loading";
  return (
    <Fragment>
      <HostTableRow
        className="cursor-pointer border-b border-border-subtle bg-surface-muted hover:bg-surface last:border-0"
        data-outside-summary="true"
        data-ui="settlement-counterparty-row"
        data-expanded="true"
        onClick={onCollapse}
      >
        <HostTableCell className="px-3 py-2 text-text-primary">
          <TextLink
            className="mr-2"
            aria-expanded={true}
            aria-label={copy.counterparty.collapse}
            onClick={(e) => {
              e.stopPropagation();
              onCollapse();
            }}
            size="inherit"
          >
            ▼
          </TextLink>
          {target.name || copy.counterparty.unassigned}
          {target.name ? (
            <Link
              href={`/erp/counterparties/${encodeURIComponent(target.counterpartyId || target.name)}`}
              className="ml-2 text-label-12 text-ecoya-accent hover:underline"
              data-ui="settlement-open-customer360"
              onClick={(event) => event.stopPropagation()}
            >
              {copy.counterparty.open360}
            </Link>
          ) : null}
        </HostTableCell>
        <HostTableCell className="px-3 py-2 text-ecoya-gray-3">{target.currency}</HostTableCell>
        {/* No receivable/payable/overdue numbers: by definition this
            counterparty is not in the by_counterparty aggregate this render,
            so those figures are not known — showing "—" or 0 here would
            fabricate a number, not report one. */}
        <HostTableCell className="px-3 py-2 text-right italic text-text-muted" colSpan={3}>
          {copy.counterparty.outsideSummaryNote}
        </HostTableCell>
      </HostTableRow>
      <HostTableRow
        aria-label={loadableCopy.sections.settlementCounterpartyDeals}
        className="border-b border-border-subtle bg-surface"
      >
        <HostTableCell colSpan={5} className="px-6 py-3">
          {loadingDeals ? (
            <p className="text-body-13 text-text-muted">{copy.counterparty.loadingDeals}</p>
          ) : (
            <LoadableSection
              copy={sectionLoadableCopy(
                loadableCopy,
                loadableCopy.sections.settlementCounterpartyDeals,
                copy.counterparty.settledEmpty,
              )}
              onRetry={onRetry}
              state={dealsState}
            >
              {(deals) =>
                deals.length > 0 ? (
                  renderDealsList(deals)
                ) : (
                  // The non-negotiable this row exists for: a drill target
                  // must never silently render nothing. The drill endpoint
                  // is deliberately scoped to pending/overdue schedules
                  // (swagger: "intentionally unwindowed so its schedules
                  // reconcile with the overview's GROUP BY row") — a
                  // successful fetch that returns zero rows here means the
                  // counterparty's receivables/payables really have been
                  // settled, not that the screen failed to find them.
                  <InfoBox title={copy.counterparty.settledEmpty} tone="positive" />
                )
              }
            </LoadableSection>
          )}
        </HostTableCell>
      </HostTableRow>
    </Fragment>
  );
}

type SettlementHeaderRenderer = (controls: ReactNode, summary?: ReactNode) => ReactNode;

export function SettlementConnected({ copy, renderHeader }: { copy: SettlementCopy; renderHeader?: SettlementHeaderRenderer }) {
  const { getIdToken } = usePlatformAuth();
  const identity = useIdentity();
  const entitlements = useEntitlements();
  const entitlementCopy = (useMessages() as AppMessages).common.entitlement.missingCapability;
  const canRecord = canRecordMoney(entitlements);
  const canFinalize =
    (identity.role === "owner" || identity.role === "admin") &&
    canFinalizeMoney(entitlements);
  const searchParams = useSearchParams();
  const initialDrill = useMemo(() => parseSettlementDrillSearchParams(searchParams), [searchParams]);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [tab, setTab] = useState<SettlementLedgerTab>("receivable");
  const [ledgerOffset, setLedgerOffset] = useState(0);
  // #409 (통화/구간 선택): currency is an independent header selector; bucket
  // is only ever set together with its cell's tab/currency by
  // selectLedgerCell (일정 구간 선택 → 원장 조건 변경) and cleared by
  // clearLedgerCellFilter. #472 (취소·종료 포함): includeCancelled is a single
  // screen-wide toggle applied to whichever tab is active.
  const [ledgerCurrency, setLedgerCurrency] = useState<string | undefined>(undefined);
  const [ledgerBucket, setLedgerBucket] = useState<SettlementBucket | undefined>(undefined);
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const selectLedgerTab = useCallback((nextTab: SettlementLedgerTab) => {
    setTab(nextTab);
    setLedgerOffset(0);
  }, []);
  const changeLedgerPage = useCallback((nextOffset: number) => {
    setLedgerOffset(nextOffset);
  }, []);
  const selectLedgerCurrency = useCallback((currency: string | undefined) => {
    setLedgerCurrency(currency);
    setLedgerOffset(0);
  }, []);
  const selectLedgerCell = useCallback(
    (nextTab: SettlementLedgerTab, bucket: SettlementBucket, currency: string) => {
      setTab(nextTab);
      setLedgerBucket(bucket);
      setLedgerCurrency(currency);
      setLedgerOffset(0);
    },
    [],
  );
  const clearLedgerCellFilter = useCallback(() => {
    setLedgerBucket(undefined);
    setLedgerCurrency(undefined);
    setLedgerOffset(0);
  }, []);
  const toggleIncludeCancelled = useCallback((value: boolean) => {
    setIncludeCancelled(value);
    setLedgerOffset(0);
  }, []);
  const toast = useScreenToast();
  const announceRecordStatus = useCallback((message: string, tone: "green" | "red" = "green") => {
    if (tone === "red") {
      toast.error(message);
    } else {
      toast.success(message);
    }
  }, [toast]);
  const fetchEventId = useRef(0);
  const calendarRetryEventId = useRef(0);
  const financeFactsRetryEventId = useRef(0);

  const beginSettlementRequest = useCallback(() => {
    const eventId = fetchEventId.current + 1;
    fetchEventId.current = eventId;
    return eventId;
  }, []);

  const fetchSettlement = useCallback((eventId: number) => {
    const calendarEventId = calendarRetryEventId.current + 1;
    calendarRetryEventId.current = calendarEventId;
    const financeFactsEventId = financeFactsRetryEventId.current + 1;
    financeFactsRetryEventId.current = financeFactsEventId;
    // Built with conditional spreads (not plain field assignment) so an
    // inactive filter is OMITTED, not sent as an explicit false/undefined —
    // this keeps the request shape identical to pre-#409 behavior when no
    // filter is in use (existing call-shape assertions, and the network
    // request itself, stay unchanged).
    const ledgerFilters: Pick<SettlementLedgerQuery, "currency" | "bucket" | "includeCancelled"> = {
      ...(ledgerCurrency ? { currency: ledgerCurrency } : {}),
      ...(ledgerBucket ? { bucket: ledgerBucket } : {}),
      ...(includeCancelled ? { includeCancelled: true as const } : {}),
    };
    // The dunning sweep (loadDunning below) is a DIFFERENT surface — the
    // full, always-unfiltered receivable book for collections follow-up —
    // and must never inherit the screen's currency/bucket filter. Reusing
    // this tab's first page as the dunning sweep's own first page is only
    // safe when no filter is active (both requests are then identical); a
    // filtered fetch must not leak into the dunning list, so the reuse is
    // skipped and the dunning sweep fetches its own clean first page.
    const noLedgerFilterActive = !ledgerCurrency && !ledgerBucket && !includeCancelled;
    const firstReceivablePage =
      tab === "receivable" && ledgerOffset === 0 && noLedgerFilterActive
        ? getSettlementLedger(getIdToken, "receivable", {
            limit: SETTLEMENT_LEDGER_PAGE_SIZE,
            offset: ledgerOffset,
          })
        : undefined;
    let primaryLedgerAttempt = 0;
    const loadPrimaryLedger = (): Promise<SettlementLedgerResponse> => {
      // direction_pending has no working server-side type filter (see the
      // loadAllDirectionPendingLedgerEntries comment) — this tab is always
      // loaded in full rather than paged, so its own count/pagination never
      // lie about what's rendered. currency/bucket/includeCancelled DO apply
      // server-side per page (only the type=direction_pending filter itself
      // is unsupported), narrowing the sweep the same way the paged tabs are.
      if (tab === "direction_pending") {
        return loadAllDirectionPendingLedgerEntries(getIdToken, ledgerFilters).then(
          (entries): SettlementLedgerResponse => ({ entries }),
        );
      }
      if (firstReceivablePage && primaryLedgerAttempt === 0) {
        primaryLedgerAttempt += 1;
        return firstReceivablePage;
      }
      return getSettlementLedger(getIdToken, tab, {
        limit: SETTLEMENT_LEDGER_PAGE_SIZE,
        offset: ledgerOffset,
        ...ledgerFilters,
      });
    };
    const loadDunning = () =>
      loadAllReceivableLedgerEntries(getIdToken, firstReceivablePage)
        .then((data): Loadable<LedgerEntry[]> => ({ status: "ready", data }))
        .catch((): Loadable<LedgerEntry[]> => ({ status: "error", retryable: true }));
    const dunningPromise = loadDunning();

    // 실패한 엔드포인트만 재시도한다(FE#1040 클래스) — 묶음 재시도는 자체
    // catch로 Loadable에 접힌 호출들까지 재발화한다. ledger·calendar·writeoff는
    // 각자 오류를 접으므로 재시도 대상은 reject 가능한 두 호출뿐이다.
    Promise.all([
        withRetry(() => getSettlementOverview(getIdToken)),
        // The server owns the ordered page and type filter. The CSV export
        // remains the full ledger; the table only renders this page.
        loadPrimaryLedger(),
        withRetry(() => getAllTradeFinanceFacts(getIdToken))
          .then((data): Loadable<TradeFinanceFactsResponse> => ({ status: "ready", data }))
          .catch((): Loadable<TradeFinanceFactsResponse> => ({ status: "error", retryable: true })),
        getSettlementCalendar(getIdToken)
          .then((data): Loadable<SettlementCalendar> => ({ status: "ready", data }))
          .catch((): Loadable<SettlementCalendar> => ({ status: "error", retryable: true })),
        listPaymentScheduleWriteoffProposals(getIdToken)
          .then((data): Loadable<PaymentScheduleWriteoffDetail[]> => ({ status: "ready", data }))
          .catch((): Loadable<PaymentScheduleWriteoffDetail[]> => ({ status: "error", retryable: true })),
      ])
      .then(([overview, ledger, financeFacts, cashCalendar, writeoffProposals]) => {
        if (fetchEventId.current !== eventId) return;
        setState((prev) => ({
          status: "ready",
          cashCalendar:
            calendarRetryEventId.current === calendarEventId || prev.status !== "ready"
              ? cashCalendar
              : prev.cashCalendar,
          financeFacts:
            financeFactsRetryEventId.current === financeFactsEventId || prev.status !== "ready"
              ? financeFacts
              : prev.financeFacts,
          overview,
          ledger: ledger.entries,
          ledgerTab: tab,
          receivableLedger: { status: "loading" },
          ledgerTotal: ledger.pagination?.total ?? ledger.entries.length,
          ...(ledger.pagination ? { ledgerPagination: ledger.pagination } : {}),
          writeoffProposals,
          version: eventId,
          refreshing: false,
          refreshError: false,
        }));
        void dunningPromise.then((receivableLedger) => {
          if (fetchEventId.current !== eventId) return;
          setState((prev) =>
            prev.status === "ready" ? { ...prev, receivableLedger } : prev,
          );
        });
      })
      .catch(() => {
        if (fetchEventId.current !== eventId) return;
        setState((prev) =>
          prev.status === "ready"
            ? { ...prev, refreshing: false, refreshError: true, version: eventId }
            : { status: "error" },
        );
      });
  }, [getIdToken, ledgerOffset, tab, ledgerCurrency, ledgerBucket, includeCancelled]);

  // A reload triggered by a record/delete mutation (via onReload below) keeps
  // SettlementView mounted with its last-known-good data instead of dropping
  // to the full-page loading state — that used to unmount the whole subtree
  // (see the comments on recTriggerRef/expandedKey/dealsByKey below), wiping
  // any in-progress record-payment form or expanded counterparty row on every
  // successful save. Only the true first load has no prior data to keep.
  const loadSettlement = useCallback(() => {
    const eventId = beginSettlementRequest();
    setState((prev) => (prev.status === "ready" ? { ...prev, refreshing: true, refreshError: false } : { status: "loading" }));
    fetchSettlement(eventId);
  }, [beginSettlementRequest, fetchSettlement]);

  const retryCashCalendar = useCallback(() => {
    const eventId = fetchEventId.current;
    const retryEventId = calendarRetryEventId.current + 1;
    calendarRetryEventId.current = retryEventId;
    setState((prev) =>
      prev.status === "ready"
        ? { ...prev, cashCalendar: { status: "loading" } }
        : prev,
      );
    getSettlementCalendar(getIdToken)
      .then((data) => {
        if (
          fetchEventId.current !== eventId ||
          calendarRetryEventId.current !== retryEventId
        ) return;
        setState((prev) =>
          prev.status === "ready"
            ? { ...prev, cashCalendar: { status: "ready", data } }
            : prev,
        );
      })
      .catch(() => {
        if (
          fetchEventId.current !== eventId ||
          calendarRetryEventId.current !== retryEventId
        ) return;
        setState((prev) =>
          prev.status === "ready"
            ? { ...prev, cashCalendar: { status: "error", retryable: true } }
            : prev,
        );
      });
  }, [getIdToken]);

  const retryFinanceFacts = useCallback(() => {
    const eventId = fetchEventId.current;
    const retryEventId = financeFactsRetryEventId.current + 1;
    financeFactsRetryEventId.current = retryEventId;
    setState((prev) =>
      prev.status === "ready"
        ? { ...prev, financeFacts: { status: "loading" } }
        : prev,
    );
    withRetry(() => getAllTradeFinanceFacts(getIdToken))
      .then((data) => {
        if (
          fetchEventId.current !== eventId ||
          financeFactsRetryEventId.current !== retryEventId
        ) return;
        setState((prev) =>
          prev.status === "ready"
            ? { ...prev, financeFacts: { status: "ready", data } }
            : prev,
        );
      })
      .catch(() => {
        if (
          fetchEventId.current !== eventId ||
          financeFactsRetryEventId.current !== retryEventId
        ) return;
        setState((prev) =>
          prev.status === "ready"
            ? { ...prev, financeFacts: { status: "error", retryable: true } }
            : prev,
        );
      });
  }, [getIdToken]);

  const retryReceivableLedger = useCallback(() => {
    const eventId = fetchEventId.current;
    setState((prev) =>
      prev.status === "ready"
        ? { ...prev, receivableLedger: { status: "loading" } }
        : prev,
    );
    loadAllReceivableLedgerEntries(getIdToken)
      .then((data) => {
        if (fetchEventId.current !== eventId) return;
        setState((prev) =>
          prev.status === "ready"
            ? { ...prev, receivableLedger: { status: "ready", data } }
            : prev,
        );
      })
      .catch(() => {
        if (fetchEventId.current !== eventId) return;
        setState((prev) =>
          prev.status === "ready"
            ? { ...prev, receivableLedger: { status: "error", retryable: true } }
            : prev,
        );
      });
  }, [getIdToken]);

  // Runs on mount and on every tab/page change (fetchSettlement's identity
  // changes with them). Routing through loadSettlement — not a bare
  // fetchSettlement call — means a tab switch enters `refreshing` the same
  // way a manual reload does, instead of silently leaving the previous
  // tab's rows in "ready" state while a new tab's fetch is in flight.
  useEffect(() => {
    loadSettlement();
    return () => {
      fetchEventId.current += 1;
    };
  }, [loadSettlement]);

  let content: ReactNode;
  if (state.status === "loading") {
    content = (
      <section className="flex flex-col gap-4" data-component="SettlementConnected" data-state="loading">
        <SkeletonCards cards={3} label={copy.loading} />
        <SkeletonTable rows={8} />
      </section>
    );
  } else if (state.status === "error") {
    content = (
      <section
        className="flex flex-col gap-3 rounded-lg border border-border-muted bg-surface-card px-4 py-6"
        data-component="SettlementConnected"
        data-state="error"
        role="alert"
      >
        <p className="text-body-14 text-status-danger">{copy.loadError}</p>
        <Button onClick={loadSettlement} size="md" type="button" variant="tertiary">
          {copy.retry}
        </Button>
      </section>
    );
  } else {
    const {
      cashCalendar,
      financeFacts: financeFactsLoad,
      overview,
      ledger,
      ledgerTab,
      receivableLedger,
      ledgerTotal,
      ledgerPagination,
      writeoffProposals,
      version,
      refreshing,
      refreshError,
    } = state;
    const financeFacts = financeFactsLoad.status === "ready" ? financeFactsLoad.data.facts : [];
    const financeFactsComplete =
      financeFactsLoad.status === "ready" && financeFactsLoad.data.complete !== false;
    content = (
      <div data-component="SettlementConnected" data-state={refreshing ? "refreshing" : "ready"}>
        {refreshError && (
          <InfoBox
            action={
              <Button onClick={loadSettlement} size="sm" type="button" variant="tertiary">
                {copy.retry}
              </Button>
            }
            className="mb-4"
            title={copy.loadError}
            tone="risk"
          />
        )}
        <SettlementView
          renderHeader={renderHeader}
          canFinalize={canFinalize}
          canRecord={canRecord}
          copy={copy}
          entitlementCopy={entitlementCopy}
          currentOrgId={identity.org_id}
          currentUserId={identity.user_id}
          initialDrill={initialDrill}
          financeFacts={financeFacts}
          financeFactsComplete={financeFactsComplete}
          financeFactsLoading={financeFactsLoad.status === "loading"}
          financeFactsUnavailable={financeFactsLoad.status === "error"}
          overview={overview}
          cashCalendar={cashCalendar}
          ledger={ledger}
          ledgerTab={ledgerTab}
          receivableLedger={receivableLedger}
          ledgerTotal={ledgerTotal}
          ledgerPagination={ledgerPagination}
          writeoffProposals={writeoffProposals}
          reloadVersion={version}
          tab={tab}
          setTab={selectLedgerTab}
          onLedgerPageChange={changeLedgerPage}
          ledgerCurrency={ledgerCurrency}
          ledgerBucket={ledgerBucket}
          includeCancelled={includeCancelled}
          onLedgerCurrencyChange={selectLedgerCurrency}
          onSelectLedgerCell={selectLedgerCell}
          onClearLedgerCellFilter={clearLedgerCellFilter}
          onIncludeCancelledChange={toggleIncludeCancelled}
          getIdToken={getIdToken}
          onReload={loadSettlement}
          onRetryCalendar={retryCashCalendar}
          onRetryFinanceFacts={retryFinanceFacts}
          onRetryReceivableLedger={retryReceivableLedger}
          onRecordStatus={announceRecordStatus}
        />
      </div>
    );
  }

  return state.status === "ready" ? content : <>{renderHeader?.(null)}{content}</>;
}

function SettlementView({
  renderHeader,
  canFinalize,
  canRecord,
  copy,
  entitlementCopy,
  currentOrgId,
  currentUserId,
  initialDrill,
  financeFacts,
  financeFactsComplete,
  financeFactsLoading,
  financeFactsUnavailable,
  overview,
  cashCalendar,
  ledger,
  ledgerTab,
  receivableLedger,
  ledgerTotal,
  ledgerPagination,
  writeoffProposals,
  reloadVersion,
  tab,
  setTab,
  onLedgerPageChange,
  ledgerCurrency,
  ledgerBucket,
  includeCancelled,
  onLedgerCurrencyChange,
  onSelectLedgerCell,
  onClearLedgerCellFilter,
  onIncludeCancelledChange,
  getIdToken,
  onReload,
  onRetryCalendar,
  onRetryFinanceFacts,
  onRetryReceivableLedger,
  onRecordStatus,
}: {
  renderHeader?: SettlementHeaderRenderer;
  canFinalize: boolean;
  canRecord: boolean;
  copy: SettlementCopy;
  entitlementCopy: EntitlementCopy;
  currentOrgId: string;
  currentUserId: string;
  initialDrill: SettlementDrillTarget | null;
  financeFacts: TradeFinanceFact[];
  financeFactsComplete: boolean;
  financeFactsLoading: boolean;
  financeFactsUnavailable: boolean;
  overview: SettlementOverview;
  cashCalendar: Loadable<SettlementCalendar>;
  ledger: LedgerEntry[];
  ledgerTab: SettlementLedgerTab;
  receivableLedger: Loadable<LedgerEntry[]>;
  ledgerTotal: number;
  ledgerPagination?: LedgerPagination;
  writeoffProposals: Loadable<PaymentScheduleWriteoffDetail[]>;
  reloadVersion: number;
  tab: SettlementLedgerTab;
  setTab: (t: SettlementLedgerTab) => void;
  onLedgerPageChange: (offset: number) => void;
  ledgerCurrency: string | undefined;
  ledgerBucket: SettlementBucket | undefined;
  includeCancelled: boolean;
  onLedgerCurrencyChange: (currency: string | undefined) => void;
  onSelectLedgerCell: (tab: SettlementLedgerTab, bucket: SettlementBucket, currency: string) => void;
  onClearLedgerCellFilter: () => void;
  onIncludeCancelledChange: (value: boolean) => void;
  getIdToken: () => Promise<string>;
  onReload: () => void;
  onRetryCalendar: () => void;
  onRetryFinanceFacts: () => void;
  onRetryReceivableLedger: () => void;
  onRecordStatus: (message: string, tone?: "green" | "red") => void;
}) {
  const moneyLocale = useLocaleTag();
  const loadableCopy = (useMessages() as AppMessages).common.loadable;
  const profitabilityDecision = useMemo(() => {
    if (!financeFactsComplete) return null;
    const rows = buildProfitabilityRollups(financeFacts, "counterparty", copy.financeFacts.unknown);
    const risk = pickProfitabilityRisk(rows);
    if (!risk || risk.incompleteInvoiceBasisCount > 0) return null;
    return {
      amount: risk.adjustedGp,
      currency: risk.currency,
      tone: profitabilityRollupDecision(risk, copy.financeRollup).tone,
    };
  }, [copy.financeFacts.unknown, copy.financeRollup, financeFacts, financeFactsComplete]);
  const asOf = useMemo(
    () => (overview.data_as_of ? formatDate(overview.data_as_of, moneyLocale) : ""),
    [moneyLocale, overview.data_as_of],
  );
  // erp-v2-adapt: begin — QA-1371 keeps canonical localized display copy out of machine date fields.
  const asOfISO = useMemo(() => {
    const value = overview.data_as_of;
    if (!value) return "";
    const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(value));
    return match ? match[1] : "";
  }, [overview.data_as_of]);
  // erp-v2-adapt: end

  // Pivot cells → per-currency bucket×type matrix for the fund calendar.
  type BucketCell = { total: bigint; count: number };
  const byCurrencyBuckets = useMemo(() => {
    const map = new Map<string, Record<string, { receivable: BucketCell; payable: BucketCell }>>();
    const emptyCell: BucketCell = { total: FINANCE_ZERO, count: 0 };
    for (const c of overview.cells) {
      if (c.type !== "receivable" && c.type !== "payable") continue;
      const cur = map.get(c.currency) ?? {};
      const b = cur[c.bucket] ?? { receivable: emptyCell, payable: emptyCell };
      b[c.type] = { total: financeDecimalMagnitude(c.total), count: c.count };
      cur[c.bucket] = b;
      map.set(c.currency, cur);
    }
    return map;
  }, [overview.cells]);

  const byCurrencyCashCalendar = useMemo(() => {
    const map = new Map<string, Record<string, { receivable: BucketCell; payable: BucketCell }>>();
    const emptyCell: BucketCell = { total: FINANCE_ZERO, count: 0 };
    if (cashCalendar.status !== "ready") return map;
    for (const cell of cashCalendar.data.cells ?? []) {
      if (cell.type !== "receivable" && cell.type !== "payable") continue;
      const currencyBuckets = map.get(cell.currency) ?? {};
      const bucket = currencyBuckets[cell.bucket] ?? {
        payable: emptyCell,
        receivable: emptyCell,
      };
      bucket[cell.type] = {
        count: cell.count,
        total: financeDecimalMagnitude(cell.total),
      };
      currencyBuckets[cell.bucket] = bucket;
      map.set(cell.currency, currencyBuckets);
    }
    return map;
  }, [cashCalendar]);

  const pendingCashCalendarCount = useMemo(
    () =>
      (cashCalendar.status === "ready" ? cashCalendar.data.cells : []).reduce(
        (count, cell) => count + (cell.type === "direction_pending" ? (cell.count ?? 0) : 0),
        0,
      ),
    [cashCalendar],
  );

  // Pivot aging → per-currency { type → { bucket → total } } for the AR/AP aging report.
  const agingByCurrency = useMemo(() => {
    const map = new Map<string, { receivable: Record<string, bigint>; payable: Record<string, bigint> }>();
    for (const a of overview.aging ?? []) {
      if (a.type !== "receivable" && a.type !== "payable") continue;
      const cur = map.get(a.currency) ?? { receivable: {}, payable: {} };
      cur[a.type][a.bucket] = financeDecimalMagnitude(a.total);
      map.set(a.currency, cur);
    }
    return map;
  }, [overview.aging]);

  const exactMoneyCache = useMemo(() => {
    const cache = new Map<string, string>();
    const add = (value: bigint | string, currency?: string) => {
      const key = exactMoneyCacheKey(value, currency);
      if (!cache.has(key)) {
        cache.set(key, fmtExact(value, currency, moneyLocale));
      }
    };

    for (const [currency, buckets] of byCurrencyBuckets) {
      for (const bucket of Object.values(buckets)) {
        add(bucket.receivable.total, currency);
        add(bucket.payable.total, currency);
      }
    }
    for (const [currency, buckets] of byCurrencyCashCalendar) {
      for (const bucket of Object.values(buckets)) {
        add(bucket.receivable.total, currency);
        add(bucket.payable.total, currency);
      }
    }
    for (const rows of agingByCurrency.values()) {
      for (const total of Object.values(rows.receivable)) add(total);
      for (const total of Object.values(rows.payable)) add(total);
    }
    for (const row of overview.by_currency ?? []) {
      add(row.net);
      add(row.payable);
      add(row.receivable);
    }
    for (const row of overview.by_counterparty ?? []) {
      add(row.overdue_receivable);
      add(row.payable);
      add(row.receivable);
    }
    for (const entry of ledger) {
      add(entry.amount, entry.currency);
      add(entry.paid, entry.currency);
      add(entry.outstanding, entry.currency);
    }

    return cache;
  }, [
    agingByCurrency,
    byCurrencyBuckets,
    byCurrencyCashCalendar,
    ledger,
    moneyLocale,
    overview.by_counterparty,
    overview.by_currency,
  ]);
  const exactMoney = useCallback(
    (value: bigint | string, currency?: string) =>
      exactMoneyCache.get(exactMoneyCacheKey(value, currency)) ??
      fmtExact(value, currency, moneyLocale),
    [exactMoneyCache, moneyLocale],
  );

  // M6 통화 혼재: a counterparty carrying AR/AP across >1 currency holds FX
  // exposure that no single per-currency row reveals — flag the names that appear
  // in 2+ distinct currencies so the collection list shows "통화 혼재" inline.
  const mixedCurrencyParties = useMemo(() => {
    const byName = new Map<string, Set<string>>();
    for (const c of overview.by_counterparty ?? []) {
      const name = c.counterparty_name ?? "";
      const set = byName.get(name) ?? new Set<string>();
      set.add(c.currency);
      byName.set(name, set);
    }
    const mixed = new Set<string>();
    for (const [name, currencies] of byName) {
      if (currencies.size > 1) mixed.add(name);
    }
    return mixed;
  }, [overview.by_counterparty]);

  // The expanded row owns one canonical cash/application panel. The cash fact
  // and its applied amount are distinct, and corrections append lineage rather
  // than deleting a historical record.
  const [recordFor, setRecordFor] = useState<string | null>(null);
  const [recDate, setRecDate] = useState("");
  const [recBusy, setRecBusy] = useState(false);
  const [manualScheduleOpen, setManualScheduleOpen] = useState(false);
  const [manualScheduleAmount, setManualScheduleAmount] = useState("");
  const [manualScheduleCounterparty, setManualScheduleCounterparty] = useState("");
  const [manualScheduleCurrency, setManualScheduleCurrency] = useState("");
  const [manualScheduleDueDate, setManualScheduleDueDate] = useState("");
  const [manualScheduleType, setManualScheduleType] = useState<"receivable" | "payable">("payable");
  const [manualScheduleBusy, setManualScheduleBusy] = useState(false);
  const [manualScheduleError, setManualScheduleError] = useState<string | null>(null);
  const recBusyRef = useRef(false);
  const [exceptionBusy, setExceptionBusy] = useState(false);
  const exceptionBusyRef = useRef(false);
  const setExceptionMutationBusy = useCallback((busy: boolean) => {
    exceptionBusyRef.current = busy;
    setExceptionBusy(busy);
  }, []);
  const [exceptionFor, setExceptionFor] = useState<string | null>(null);
  const exceptionTriggerRef = useRef<{
    scheduleId: string;
    button: HTMLButtonElement;
  } | null>(null);
  // The button that opened the form, so closing it (Cancel, or a successful
  // save) can return focus to it. onReload() no longer unmounts this view —
  // it keeps rendering with the last-known-good data while refetching — so
  // the trigger button survives a save just as it does a cancel, UNLESS the
  // payment being saved fully settles the row: the button is then replaced
  // by a locked, non-focusable status cell. lockedActionRefs holds a
  // programmatic-focus fallback for that cell per row, and pendingFocusRef
  // defers the actual focus decision to the effect below, once the reload
  // this save triggered has actually landed and we can tell which case we're in.
  const recTriggerRef = useRef<HTMLButtonElement | null>(null);
  const lockedActionRefs = useRef<Record<string, HTMLElement | null>>({});
  const pendingFocusRef = useRef<{ scheduleId: string; button: HTMLButtonElement } | null>(null);
  const [lifecycleBusy, setLifecycleBusy] = useState<string | null>(null);
  const lifecycleReloadRef = useRef<{ version: number } | null>(null);

  const openRecord = (e: LedgerEntry, trigger: HTMLButtonElement) => {
    if (exceptionBusyRef.current || recBusyRef.current) return;
    setExceptionFor(null);
    exceptionTriggerRef.current = null;
    recTriggerRef.current = trigger;
    setRecordFor(e.id);
    // Prefill with the ORG's business date computed FRESH at click time in
    // the org timezone the server judged the book in (P1-A single axis) — a
    // tab left open across the org's midnight must not backdate the value
    // date to the load-time as-of. Fallbacks: load-time as-of, then the
    // browser-local date.
    let orgToday = "";
    if (overview.timezone) {
      try {
        orgToday = todayISOIn(overview.timezone);
      } catch {
        // Server-validated zone should never fail here; fall through.
      }
    }
    // erp-v2-adapt: begin — QA-1371 requires an ISO value for the native date input fallback.
    setRecDate(orgToday || asOfISO || localTodayISO());
    // erp-v2-adapt: end
  };

  const cancelRecord = () => {
    if (recBusyRef.current) return;
    setRecordFor(null);
    recTriggerRef.current?.focus();
  };
  const openManualSchedule = () => {
    setManualScheduleAmount("");
    setManualScheduleCounterparty("");
    setManualScheduleCurrency(ledgerCurrency ?? "");
    setManualScheduleDueDate(asOfISO || localTodayISO());
    setManualScheduleType("payable");
    setManualScheduleError(null);
    setManualScheduleOpen(true);
  };

  const saveManualSchedule = async () => {
    const amount = manualScheduleAmount.trim();
    const currency = manualScheduleCurrency.trim().toUpperCase();
    const dueDate = manualScheduleDueDate.trim();
    if (
      !isFinanceDecimal(amount) ||
      financeDecimalMagnitude(amount) <= FINANCE_ZERO ||
      !/^[A-Z]{3}$/.test(currency) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
      (manualScheduleType === "receivable" && !manualScheduleCounterparty.trim())
    ) {
      setManualScheduleError(copy.ledger.recordInvalid);
      return;
    }

    setManualScheduleBusy(true);
    setManualScheduleError(null);
    try {
      await createPaymentSchedule(
        {
          amount,
          ...(manualScheduleCounterparty.trim()
            ? { counterparty_name: manualScheduleCounterparty.trim() }
            : {}),
          currency,
          due_date: dueDate,
          type: manualScheduleType,
        },
        getIdToken,
      );
      setManualScheduleOpen(false);
      onRecordStatus(copy.ledger.recordSaved);
      onReload();
    } catch {
      setManualScheduleError(copy.ledger.recordError);
    } finally {
      setManualScheduleBusy(false);
    }
  };

  const invalidateRecordForm = (scheduleId: string) => {
    if (recordFor !== scheduleId) return;
    setRecordFor(null);
  };

  const openExceptions = (scheduleId: string, trigger: HTMLButtonElement) => {
    if (recBusyRef.current || exceptionBusyRef.current) return;
    setRecordFor(null);
    setExceptionFor(scheduleId);
    exceptionTriggerRef.current = { scheduleId, button: trigger };
  };

  const closeExceptions = () => {
    if (recBusyRef.current || exceptionBusyRef.current) return;
    setExceptionFor(null);
    const trigger = exceptionTriggerRef.current;
    if (trigger?.scheduleId === exceptionFor) trigger.button.focus();
    exceptionTriggerRef.current = null;
  };

  // Runs once the reload a successful save triggered has actually landed.
  // reloadVersion (not ledger itself) is the dependency because the API may
  // legitimately resolve to the same array/object reference across calls —
  // relying on ledger's identity to detect "a fetch just completed" would
  // silently never fire in that case. If the row is still open for
  // recording, the trigger button is untouched by the reload and still
  // takes focus fine; if the payment fully settled it, focus the row's
  // locked-status cell instead of letting the browser drop focus to <body>.
  useEffect(() => {
    const pending = pendingFocusRef.current;
    if (!pending) return;
    // Lifecycle actions stay disabled until the refresh has landed. Defer
    // focus until that guard clears so the browser does not drop it to body.
    if (lifecycleBusy !== null) return;
    pendingFocusRef.current = null;
    if (pending.button.isConnected) {
      pending.button.focus();
    } else {
      lockedActionRefs.current[pending.scheduleId]?.focus();
    }
  }, [lifecycleBusy, reloadVersion]);

  // `ledger` is already scoped server-side (or, for direction_pending, fully
  // swept client-side) to exactly the active fetch's type — it needs no
  // client-side re-filtering. What it CAN be is stale: while a tab switch's
  // fetch is in flight, `ledger`/`ledgerTotal` still hold the PREVIOUS tab's
  // rows (kept on screen as last-known-good, same as any other refresh) —
  // ledgerTab !== tab is exactly that window, and the render below shows a
  // loading placeholder instead of those mislabeled rows.
  const ledgerReady = ledgerTab === tab;
  const [disputesByDeal, setDisputesByDeal] = useState<
    Record<string, Loadable<SettlementDispute[]>>
  >({});
  const [disputePanel, dispatchDisputePanel] = useReducer(
    disputePanelReducer,
    INITIAL_DISPUTE_PANEL_STATE,
  );
  const disputeFor = disputePanel.entryId;
  const disputeNormalAmount = disputePanel.normalAmount;
  const disputeAmount = disputePanel.amount;
  const disputeReason = disputePanel.reason;
  const disputeEvidence = disputePanel.evidence;
  const disputeBusy = disputePanel.busy;
  const disputeError = disputePanel.error;
  const disputeInvalidField = disputePanel.invalidField;
  const disputeRequestIdsRef = useRef<Record<string, number>>({});
  const disputeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const disputeFieldRefs = useRef<Record<DisputeField, HTMLInputElement | null>>({
    amount: null,
    normalAmount: null,
    reason: null,
  });

  const loadDealDisputes = useCallback(
    async (dealId: string, force = false) => {
      if (!force && disputesByDeal[dealId]?.status === "ready") return;
      const requestId = (disputeRequestIdsRef.current[dealId] ?? 0) + 1;
      disputeRequestIdsRef.current[dealId] = requestId;
      setDisputesByDeal((prev) => ({ ...prev, [dealId]: { status: "loading" } }));
      try {
        const response = await listDealSettlementDisputes(dealId, getIdToken);
        if (disputeRequestIdsRef.current[dealId] !== requestId) return;
        setDisputesByDeal((prev) => ({
          ...prev,
          [dealId]: { status: "ready", data: response.disputes ?? [] },
        }));
      } catch {
        if (disputeRequestIdsRef.current[dealId] !== requestId) return;
        setDisputesByDeal((prev) => ({
          ...prev,
          [dealId]: { status: "error", retryable: true },
        }));
      }
    },
    [disputesByDeal, getIdToken],
  );

  const disputesForEntry = useCallback(
    (entry: LedgerEntry): SettlementDispute[] => {
      if (!entry.deal_id) return [];
      const state = disputesByDeal[entry.deal_id];
      return state?.status === "ready"
        ? state.data.filter((dispute) => dispute.schedule_id === entry.id)
        : [];
    },
    [disputesByDeal],
  );

  const openDisputePanel = (entry: LedgerEntry, trigger: HTMLButtonElement) => {
    disputeTriggerRef.current = trigger;
    dispatchDisputePanel({ type: "open", entryId: entry.id, normalAmount: entry.outstanding });
    if (entry.deal_id) void loadDealDisputes(entry.deal_id, true);
  };

  const cancelDisputePanel = () => {
    dispatchDisputePanel({ type: "close" });
  };

  useEffect(() => {
    if (disputeFor !== null) {
      disputeFieldRefs.current.normalAmount?.focus();
      return;
    }
    const trigger = disputeTriggerRef.current;
    disputeTriggerRef.current = null;
    if (trigger?.isConnected) trigger.focus();
  }, [disputeFor]);

  const markDisputeInvalid = (error: string, field: DisputeField) => {
    dispatchDisputePanel({ type: "error", error, invalidField: field });
    disputeFieldRefs.current[field]?.focus();
  };

  const submitDispute = async (entry: LedgerEntry) => {
    if (!canRecord || disputeBusy) return;
    const normalAmount = normalizeDecimalInput(disputeNormalAmount);
    const disputedAmount = normalizeDecimalInput(disputeAmount);
    const reason = disputeReason.trim();
    const evidence = disputeEvidence.trim();
    if (!normalAmount || !disputedAmount || !reason) {
      markDisputeInvalid(
        copy.ledger.dispute.errors.required,
        !normalAmount ? "normalAmount" : !disputedAmount ? "amount" : "reason",
      );
      return;
    }
    const normalMagnitude = financeDecimalMagnitude(normalAmount);
    const disputeMagnitude = financeDecimalMagnitude(disputedAmount);
    if (
      normalMagnitude < FINANCE_ZERO ||
      disputeMagnitude <= FINANCE_ZERO ||
      normalMagnitude + disputeMagnitude !== financeDecimalMagnitude(entry.amount)
    ) {
      markDisputeInvalid(copy.ledger.dispute.errors.partition, "amount");
      return;
    }
    dispatchDisputePanel({ type: "busy", busy: true });
    dispatchDisputePanel({ type: "error", error: null, invalidField: null });
    try {
      await openSettlementDispute(
        entry.id,
        {
          currency: entry.currency,
          ...(entry.deal_id ? { deal_id: entry.deal_id } : {}),
          disputed_amount: disputedAmount,
          normal_amount: normalAmount,
          original_amount: entry.amount,
          reason,
          ...(evidence ? { evidence } : {}),
        },
        getIdToken,
      );
      onRecordStatus(copy.ledger.dispute.success.opened);
      if (entry.deal_id) await loadDealDisputes(entry.deal_id, true);
      dispatchDisputePanel({ type: "close" });
      onReload();
      refreshExpandedCounterpartyDeals();
    } catch (error) {
      dispatchDisputePanel({
        type: "error",
        error:
          capabilityDeniedMessage(error, "erp.money.record", entitlementCopy) ??
          copy.ledger.dispute.errors.generic,
      });
    } finally {
      dispatchDisputePanel({ type: "busy", busy: false });
    }
  };

  const resolveDispute = async (
    entry: LedgerEntry,
    dispute: Pick<SettlementDispute, "id">,
    resolution: SettlementDisputeResolution,
  ) => {
    if (disputeBusy) return;
    if (resolution === "write_off" ? !canFinalize : !canRecord) return;
    dispatchDisputePanel({ type: "busy", busy: true });
    dispatchDisputePanel({ type: "error", error: null, invalidField: null });
    try {
      await resolveSettlementDispute(dispute.id, { resolution }, getIdToken);
      onRecordStatus(copy.ledger.dispute.success.resolved);
      if (entry.deal_id) await loadDealDisputes(entry.deal_id, true);
      onReload();
      refreshExpandedCounterpartyDeals();
    } catch (error) {
      dispatchDisputePanel({
        type: "error",
        error: settlementDisputeResolveErrorMessage(
          error,
          resolution,
          copy.ledger.dispute,
          entitlementCopy,
        ),
      });
    } finally {
      dispatchDisputePanel({ type: "busy", busy: false });
    }
  };

  const ledgerPageSize = ledgerPagination && ledgerPagination.limit > 0
    ? ledgerPagination.limit
    : SETTLEMENT_LEDGER_PAGE_SIZE;
  const ledgerPageCount = ledgerPagination
    ? Math.max(1, Math.ceil(ledgerTotal / ledgerPageSize))
    : 1;
  const ledgerCurrentPage = ledgerPagination
    ? Math.min(
        ledgerPageCount,
        Math.floor(Math.max(0, ledgerPagination.offset) / ledgerPageSize) + 1,
      )
    : 1;

  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  // The raw name/currency behind expandedKey, so a reload can force-refresh
  // that specific counterparty's deals (see refreshExpandedCounterpartyDeals)
  // without having to parse them back out of the composite key.
  const [expandedCounterparty, setExpandedCounterparty] = useState<{
    name: string | null | undefined;
    currency: string;
    // #502: the resolved counterparty master id, when known — preferred over
    // the name string for the actual drill request.
    counterpartyId?: string | null;
  } | null>(null);
  const [dealsByKey, setDealsByKey] = useState<
    Record<string, Loadable<SettlementDealItem[]>>
  >({});

  const loadCounterpartyDeals = useCallback(
    async (
      name: string | null | undefined,
      currency: string,
      counterpartyId?: string | null,
      force = false,
    ) => {
      const key = counterpartyRowKey(name, currency);
      if (dealsByKey[key] && !force) return;
      setDealsByKey((prev) => ({ ...prev, [key]: { status: "loading" } }));
      try {
        const resp = await getSettlementCounterpartyDeals(getIdToken, name ?? null, currency, counterpartyId);
        setDealsByKey((prev) => ({ ...prev, [key]: { status: "ready", data: resp.items } }));
      } catch {
        setDealsByKey((prev) => ({ ...prev, [key]: { status: "error", retryable: true } }));
      }
    },
    [dealsByKey, getIdToken],
  );

  const expandCounterparty = useCallback(
    async (name: string | null | undefined, currency: string, counterpartyId?: string | null) => {
      const key = counterpartyRowKey(name, currency);
      setExpandedKey(key);
      setExpandedCounterparty({ name, currency, counterpartyId });
      await loadCounterpartyDeals(name, currency, counterpartyId);
    },
    [loadCounterpartyDeals, setExpandedCounterparty, setExpandedKey],
  );

  // A record/delete-payment reload no longer resets expandedKey/dealsByKey
  // (SettlementView stays mounted), which is the point — but it also means
  // the currently expanded counterparty's cached deals are never invalidated
  // on their own, so a payment recorded against one of those deals wouldn't
  // update its outstanding/overdue display until the row was collapsed and
  // reopened. Force a refetch of just that counterparty after every reload.
  const refreshExpandedCounterpartyDeals = useCallback(() => {
    if (!expandedCounterparty) return;
    void loadCounterpartyDeals(
      expandedCounterparty.name,
      expandedCounterparty.currency,
      expandedCounterparty.counterpartyId,
      true,
    );
  }, [expandedCounterparty, loadCounterpartyDeals]);

  const writeoffProposalById = useMemo(() => {
    const rows =
      writeoffProposals.status === "ready" ? writeoffProposals.data : [];
    return new Map(rows.map((row) => [row.id, row]));
  }, [writeoffProposals]);
  const writeoffRequestId = useRef(0);
  const [writeoffTarget, setWriteoffTarget] = useState<{
    entry: LedgerEntry;
    trigger: HTMLButtonElement;
  } | null>(null);
  const [writeoffDialogState, setWriteoffDialogState] =
    useState<WriteoffDialogState>({ status: "loading" });
  const [writeoffReason, setWriteoffReason] = useState("");
  const [writeoffDocumentId, setWriteoffDocumentId] = useState("");
  const [writeoffExternalEvidence, setWriteoffExternalEvidence] = useState("");
  const [writeoffBusy, setWriteoffBusy] = useState(false);
  const [writeoffError, setWriteoffError] = useState<string | null>(null);
  const [closeTarget, setCloseTarget] = useState<{
    entry: LedgerEntry;
    trigger: HTMLButtonElement;
  } | null>(null);
  const [reopenTarget, setReopenTarget] = useState<{
    entry: LedgerEntry;
    trigger: HTMLButtonElement;
  } | null>(null);
  const [closeDraft, setCloseDraft] = useState<CloseDraftState>(EMPTY_CLOSE_DRAFT);
  const [reopenError, setReopenError] = useState<string | null>(null);

  const loadWriteoffDetails = useCallback(
    async (scheduleId: string, preserveError = false) => {
      const requestId = writeoffRequestId.current + 1;
      writeoffRequestId.current = requestId;
      setWriteoffDialogState({ status: "loading" });
      if (!preserveError) setWriteoffError(null);
      try {
        const [schedule, events, settlement] = await Promise.all([
          getPaymentScheduleWriteoffDetail(scheduleId, getIdToken),
          listPaymentScheduleClosureEvents(scheduleId, getIdToken),
          getScheduleCashApplications(scheduleId, getIdToken),
        ]);
        if (writeoffRequestId.current !== requestId) return;
        setWriteoffDialogState({
          status: "ready",
          data: { events, schedule, settlement },
        });
        setWriteoffReason(
          schedule.writeoff_proposal_reason ?? schedule.closure_reason ?? "",
        );
        setWriteoffDocumentId(
          schedule.writeoff_proposal_document_id ??
            schedule.closure_evidence_document_id ??
            "",
        );
        setWriteoffExternalEvidence(
          schedule.writeoff_proposal_evidence ??
            schedule.closure_evidence_external ??
            "",
        );
      } catch {
        if (writeoffRequestId.current !== requestId) return;
        setWriteoffDialogState({ status: "error", retryable: true });
      }
    },
    [
      getIdToken,
      setWriteoffDocumentId,
      setWriteoffExternalEvidence,
      setWriteoffReason,
    ],
  );

  const openWriteoff = (entry: LedgerEntry, trigger: HTMLButtonElement) => {
    if (recBusyRef.current || exceptionBusyRef.current) return;
    setWriteoffTarget({ entry, trigger });
    setWriteoffReason("");
    setWriteoffDocumentId("");
    setWriteoffExternalEvidence("");
    setWriteoffBusy(false);
    setWriteoffError(null);
    void loadWriteoffDetails(entry.id);
  };

  const closeWriteoffDialog = () => {
    if (writeoffBusy) return;
    writeoffRequestId.current += 1;
    const trigger = writeoffTarget?.trigger;
    setWriteoffTarget(null);
    setWriteoffError(null);
    queueMicrotask(() => {
      if (trigger?.isConnected) trigger.focus();
    });
  };

  const validatedWriteoffEvidence = (): {
    documentId?: string;
    externalEvidence?: string;
    reason: string;
  } | null => {
    const reason = writeoffReason.trim();
    const documentId = writeoffDocumentId.trim();
    const externalEvidence = writeoffExternalEvidence.trim();
    if (!reason) {
      setWriteoffError(copy.ledger.writeoff.errors.reasonRequired);
      return null;
    }
    if (documentId && !isUuidLike(documentId)) {
      setWriteoffError(copy.ledger.writeoff.errors.documentInvalid);
      return null;
    }
    if (!documentId && !externalEvidence) {
      setWriteoffError(copy.ledger.writeoff.errors.evidenceRequired);
      return null;
    }
    return {
      reason,
      ...(documentId ? { documentId } : {}),
      ...(externalEvidence ? { externalEvidence } : {}),
    };
  };

  const finishWriteoffMutation = (
    target: NonNullable<typeof writeoffTarget>,
    message: string,
  ) => {
    pendingFocusRef.current = {
      scheduleId: target.entry.id,
      button: target.trigger,
    };
    writeoffRequestId.current += 1;
    setWriteoffBusy(false);
    setWriteoffTarget(null);
    onRecordStatus(message);
    onReload();
    refreshExpandedCounterpartyDeals();
  };

  const runWriteoffMutation = async (
    capability: "erp.money.record" | "erp.money",
    action: (scheduleId: string) => Promise<unknown>,
    successMessage: string,
  ) => {
    const target = writeoffTarget;
    if (!target || writeoffBusy) return;
    setWriteoffBusy(true);
    setWriteoffError(null);
    try {
      await action(target.entry.id);
      finishWriteoffMutation(target, successMessage);
    } catch (error) {
      setWriteoffBusy(false);
      setWriteoffError(
        capabilityDeniedMessage(error, capability, entitlementCopy) ??
          writeoffErrorMessage(error, copy.ledger.writeoff),
      );
      if (error instanceof ApiError && error.status === 409) {
        onReload();
        void loadWriteoffDetails(target.entry.id, true);
      }
    }
  };

  const submitWriteoffProposal = async () => {
    if (!canRecord || canFinalize) return;
    const evidence = validatedWriteoffEvidence();
    if (!evidence) return;
    await runWriteoffMutation(
      "erp.money.record",
      (scheduleId) =>
        proposeScheduleWriteoff(
          scheduleId,
          {
            reason: evidence.reason,
            ...(evidence.documentId
              ? { document_id: evidence.documentId }
              : {}),
            ...(evidence.externalEvidence
              ? { external_evidence: evidence.externalEvidence }
              : {}),
          },
          getIdToken,
        ),
      copy.ledger.writeoff.success.proposed,
    );
  };

  const finalizeWriteoff = async () => {
    if (!canFinalize) return;
    const evidence = validatedWriteoffEvidence();
    if (!evidence) return;
    await runWriteoffMutation(
      "erp.money",
      (scheduleId) =>
        closeScheduleWriteoff(
          scheduleId,
          {
            closure_type: "written_off",
            reason: evidence.reason,
            ...(evidence.documentId
              ? { evidence_document_id: evidence.documentId }
              : {}),
            ...(evidence.externalEvidence
              ? { external_evidence: evidence.externalEvidence }
              : {}),
          },
          getIdToken,
        ),
      copy.ledger.writeoff.success.finalized,
    );
  };

  const withdrawWriteoff = async () => {
    if (!canWithdrawWriteoff) return;
    await runWriteoffMutation(
      "erp.money.record",
      (scheduleId) => withdrawScheduleWriteoff(scheduleId, getIdToken),
      copy.ledger.writeoff.success.withdrawn,
    );
  };

  const rejectWriteoff = async () => {
    if (!canRejectWriteoff) return;
    await runWriteoffMutation(
      "erp.money",
      (scheduleId) => withdrawScheduleWriteoff(scheduleId, getIdToken),
      copy.ledger.writeoff.success.rejected,
    );
  };

  const reopenWriteoff = async () => {
    if (!canFinalize) return;
    await runWriteoffMutation(
      "erp.money",
      (scheduleId) => reopenSchedule(scheduleId, getIdToken),
      copy.ledger.writeoff.success.reopened,
    );
  };

  const openCloseDialog = (entry: LedgerEntry, trigger: HTMLButtonElement) => {
    if (!canFinalize || writeoffBusy || lifecycleBusy !== null) return;
    setCloseTarget({ entry, trigger });
    setCloseDraft(EMPTY_CLOSE_DRAFT);
  };

  const openReopenDialog = (entry: LedgerEntry, trigger: HTMLButtonElement) => {
    if (!canFinalize || writeoffBusy || lifecycleBusy !== null) return;
    setReopenTarget({ entry, trigger });
    setReopenError(null);
  };

  const finishLifecycleMutation = (
    target: { entry: LedgerEntry; trigger: HTMLButtonElement },
    message: string,
  ) => {
    invalidateRecordForm(target.entry.id);
    lifecycleReloadRef.current = { version: reloadVersion };
    pendingFocusRef.current = { scheduleId: target.entry.id, button: target.trigger };
    onRecordStatus(message);
    onReload();
    refreshExpandedCounterpartyDeals();
  };

  const confirmCloseSchedule = async () => {
    const target = closeTarget;
    if (!target || !canFinalize || recBusyRef.current || writeoffBusy || lifecycleBusy !== null) return;
    const note = closeDraft.note.trim();
    setLifecycleBusy(target.entry.id);
    setCloseDraft((previous) => ({ ...previous, error: null }));
    try {
      await closeSchedule(
        target.entry.id,
        {
          closure_type: closeDraft.closureType,
          ...(note ? { note } : {}),
        },
        getIdToken,
      );
      setCloseTarget(null);
      setCloseDraft(EMPTY_CLOSE_DRAFT);
      finishLifecycleMutation(target, copy.ledger.closed);
    } catch (error) {
      setLifecycleBusy(null);
      setCloseDraft((previous) => ({
        ...previous,
        error:
          capabilityDeniedMessage(error, "erp.money", entitlementCopy) ??
          copy.ledger.closeError,
      }));
      if (error instanceof ApiError && error.status === 409) onReload();
    }
  };

  const confirmReopenSchedule = async () => {
    const target = reopenTarget;
    if (!target || !canFinalize || recBusyRef.current || writeoffBusy || lifecycleBusy !== null) return;
    setLifecycleBusy(target.entry.id);
    setReopenError(null);
    try {
      await reopenSchedule(target.entry.id, getIdToken);
      setReopenTarget(null);
      setReopenError(null);
      finishLifecycleMutation(target, copy.ledger.reopened);
    } catch (error) {
      setLifecycleBusy(null);
      setReopenError(
        capabilityDeniedMessage(error, "erp.money", entitlementCopy) ??
          copy.ledger.reopenError,
      );
      if (error instanceof ApiError && error.status === 409) onReload();
    }
  };

  const reopenBody = reopenTarget
    ? (() => {
        const counterparty = reopenTarget.entry.counterparty_name ?? "—";
        const amount = exactMoney(reopenTarget.entry.amount, reopenTarget.entry.currency);
        return renderReopenSemanticMarkup(
          copy.ledger.reopenConfirmBody
            .replace("{counterparty}", counterparty)
            .replace("{amount}", amount),
        );
      })()
    : null;

  useEffect(() => {
    const pending = lifecycleReloadRef.current;
    if (!pending || reloadVersion <= pending.version) return;
    lifecycleReloadRef.current = null;
    setLifecycleBusy(null);
  }, [reloadVersion]);

  const handleDrill = useCallback(async (target: SettlementDrillTarget) => {
    if (target.section === "ledger") {
      setTab(target.tab);
      scrollToSettlementSection(settlementSectionId(target));
      return;
    }
    if (target.section === "forecast") {
      scrollToSettlementSection(settlementSectionId(target));
      return;
    }
    if (target.section === "profitability") {
      scrollToSettlementSection(settlementSectionId(target));
      return;
    }
    if (target.section === "overdue") {
      const top = findTopOverdueCounterparty(overview, target.currency);
      if (top) {
        await expandCounterparty(top.counterpartyName, top.currency, top.counterpartyId);
      }
      scrollToSettlementSection(settlementSectionId(target));
      return;
    }
    await expandCounterparty(target.counterpartyName, target.currency);
    scrollToSettlementSection(settlementSectionId(target));
  }, [expandCounterparty, overview, setTab]);

  const appliedInitialDrillRef = useRef(false);
  useEffect(() => {
    if (!initialDrill || appliedInitialDrillRef.current) return;
    appliedInitialDrillRef.current = true;
    void handleDrill(initialDrill);
  }, [handleDrill, initialDrill]);

  const counterpartyKey = counterpartyRowKey;

  const toggleCounterparty = async (
    name: string | null | undefined,
    currency: string,
    counterpartyId?: string | null,
  ) => {
    const key = counterpartyKey(name, currency);
    if (expandedKey === key) {
      setExpandedKey(null);
      setExpandedCounterparty(null);
      return;
    }
    await expandCounterparty(name, currency, counterpartyId);
  };

  // FE#760 후속(PR #782 리뷰): a drill target (Reports Top-N, or any future
  // producer of ?drill=party) is not guaranteed to appear in
  // overview.by_counterparty. Two confirmed, distinct reasons:
  //  1. Reports' counterparty-top?metric=receivable sums EVERY receivable
  //     schedule in the window with no status filter (reports.go
  //     CounterpartyTopReceivable), while by_counterparty and the drill
  //     endpoint both scope to status IN ('pending','overdue')
  //     (settlement_owner.go GetOverview / settlement.go
  //     ListSchedulesForCounterparty) — a since-collected counterparty is
  //     ranked Top-N but has zero rows left in either.
  //  2. by_counterparty additionally excludes archived/cancelled-Deal
  //     schedules (settlementArchivedExclusion/settlementCancelledExclusion)
  //     that the drill endpoint does NOT exclude — so a counterparty can be
  //     absent from the overview while the drill still returns real rows.
  // Before this fix, expandCounterparty still fetched and cached the deals
  // (dealsByKey), but the table body only ever mapped over
  // overview.by_counterparty, so a counterparty absent from that list had no
  // <HostTableRow> to render into — the fetch succeeded and the result was simply
  // never shown. drillOnlyCounterparty gives that fetch a place to land: a
  // synthetic row is rendered from the drill state itself (name/currency +
  // dealsByKey), independent of by_counterparty membership.
  const drillOnlyCounterparty = useMemo(() => {
    if (!expandedCounterparty) return null;
    const key = counterpartyKey(expandedCounterparty.name, expandedCounterparty.currency);
    const listedInOverview = (overview.by_counterparty ?? []).some(
      (c) => counterpartyKey(c.counterparty_name, c.currency) === key,
    );
    return listedInOverview ? null : expandedCounterparty;
  }, [counterpartyKey, expandedCounterparty, overview.by_counterparty]);

  // Shared deal-list renderer for both the regular (by_counterparty-listed)
  // rows and the drillOnlyCounterparty row below — kept identical so a
  // reconciling schedule looks the same regardless of which row it renders
  // under.
  const renderCounterpartyDealsList = (deals: SettlementDealItem[]) => (
    <ul className="flex flex-col gap-2 text-body-13">
      {deals.map((d) => (
        <li key={d.schedule_id} className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className={d.overdue ? "font-medium text-status-danger" : "text-text-primary"}>
            {exactMoney(d.amount, d.currency)} · {formatDate(d.due_date, moneyLocale)}
          </span>
          {d.overdue ? (
            <StatusBadge data-testid="settlement-drill-overdue" tone="danger">
              {copy.ledger.overdueBadge}
            </StatusBadge>
          ) : null}
          <span className="text-text-muted">
            {d.type === "receivable" ? copy.kpi.receivable : copy.kpi.payable}
          </span>
          {d.deal_id ? (
            <Link
              href={`/erp/deals/${d.deal_id}`}
              className="text-ecoya-accent hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {d.deal_title || copy.counterparty.dealLink}
            </Link>
          ) : (
            <span className="text-text-muted">—</span>
          )}
        </li>
      ))}
    </ul>
  );

  // Server-side export: the browser used to assemble the CSV from its fetched
  // page, silently dropping every row past the page for larger books. The BE
  // renders the FULL ledger (finance-fact enrichment, formula-injection
  // neutralised, UTF-8 BOM) and this handler just saves the blob.
  const [exporting, setExporting] = useState(false);
  // P0-C 되돌리기: 송금 완료 취소 — busy flag holds the row id being reverted.
  // On SUCCESS the flag stays set until the reload lands (reloadVersion
  // effect below): releasing it earlier re-enables the button on a row that
  // still renders 'completed', and a second click 409s and shows a failure
  // toast for a revert that succeeded.
  const [uncompleting, setUncompleting] = useState<string | null>(null);
  const [uncompleteTarget, setUncompleteTarget] = useState<{
    entry: LedgerEntry;
    trigger: HTMLButtonElement;
  } | null>(null);
  const onUncomplete = async (scheduleId: string, trigger: HTMLButtonElement) => {
    if (!canFinalize || uncompleting) return;
    setUncompleting(scheduleId);
    try {
      await uncompleteSchedule(getIdToken, scheduleId);
      // The clicked button unmounts when the reload flips the row back to
      // scheduled — register the same focus fallback the record-save flow
      // uses so keyboard focus lands on the row's new action, not <body>.
      pendingFocusRef.current = { scheduleId, button: trigger };
      onRecordStatus(copy.ledger.uncompleted);
      onReload();
    } catch (error) {
      setUncompleting(null);
      // The 409 usually means the row changed under us (concurrent revert /
      // close) — reload so the screen reflects reality instead of retrying
      // against a stale row; announce assertively, never in success green.
      onRecordStatus(
        capabilityDeniedMessage(error, "erp.money", entitlementCopy) ??
          copy.ledger.uncompleteError,
        "red",
      );
      onReload();
    }
  };

  const confirmUncomplete = async () => {
    const target = uncompleteTarget;
    if (!target || uncompleting) return;
    await onUncomplete(target.entry.id, target.trigger);
    setUncompleteTarget(null);
  };

  // A landed reload replaces the row with its post-revert state — only now is
  // it safe to re-enable 완료 취소 (see onUncomplete).
  useEffect(() => {
    setUncompleting(null);
  }, [reloadVersion]);
  const saveBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  // #409 (내보내기가 현재 필터를 무시): both exports below carry the screen's
  // active tab/currency/bucket/취소·종료 포함 state through to the server —
  // the export must show exactly what the screen is currently showing, not a
  // silently-wider (or narrower) book. direction_pending has no server-side
  // type filter (see loadAllDirectionPendingLedgerEntries), so it is omitted
  // here the same way the paged ledger fetch omits it.
  const exportLedgerFilters = {
    ...(tab === "direction_pending" ? {} : { type: tab }),
    ...(ledgerCurrency ? { currency: ledgerCurrency } : {}),
    ...(ledgerBucket ? { bucket: ledgerBucket } : {}),
    ...(includeCancelled ? { includeCancelled: true as const } : {}),
  };
  const onExportCsv = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const blob = await downloadSettlementLedgerCsv(getIdToken, exportLedgerFilters);
      // erp-v2-adapt: begin — QA-1371 preserves the canonical ISO full-ledger filename contract.
      saveBlob(blob, `ecoya-settlement-${asOfISO || "export"}.csv`);
      // erp-v2-adapt: end
    } catch {
      onRecordStatus(copy.export.failed);
    } finally {
      setExporting(false);
    }
  };
  // R-6.1 세무사 handoff: the KOREA tax preset (kr-tax) exports one calendar
  // month — default to the org business month (asOf, org timezone).
  const [taxMonth, setTaxMonth] = useState("");
  // erp-v2-adapt: begin — QA-1371 derives the native month and API value from ISO, not display copy.
  const effectiveTaxMonth = taxMonth || asOfISO.slice(0, 7);
  // erp-v2-adapt: end
  const onExportTaxCsv = async () => {
    if (exporting || !effectiveTaxMonth) return;
    setExporting(true);
    try {
      const blob = await downloadSettlementLedgerCsv(getIdToken, {
        ...exportLedgerFilters,
        preset: "kr-tax",
        month: effectiveTaxMonth,
      });
      saveBlob(blob, `ecoya-monthly-statement-${effectiveTaxMonth}.csv`);
    } catch {
      onRecordStatus(copy.export.failed);
    } finally {
      setExporting(false);
    }
  };
  const writeoffSchedule =
    writeoffDialogState.status === "ready"
      ? writeoffDialogState.data.schedule
      : null;
  const writeoffSettlement =
    writeoffDialogState.status === "ready"
      ? writeoffDialogState.data.settlement
      : null;
  const writeoffEvents =
    writeoffDialogState.status === "ready"
      ? writeoffDialogState.data.events
      : [];
  const writeoffIsClosed = Boolean(writeoffSchedule?.closure_type);
  const writeoffHasProposal = Boolean(
    writeoffSchedule?.writeoff_proposed_at,
  );
  const writeoffHasPositiveOutstanding =
    writeoffSettlement !== null &&
    financeDecimalMagnitude(writeoffSettlement.outstanding) > FINANCE_ZERO;
  const writeoffCanMutateOpen =
    writeoffSchedule?.type === "receivable" &&
    writeoffSchedule.status !== "completed" &&
    !writeoffIsClosed &&
    !writeoffSettlement?.reconciliation_required &&
    writeoffHasPositiveOutstanding;
  const canProposeWriteoff =
    canRecord &&
    !canFinalize &&
    writeoffCanMutateOpen &&
    Boolean(writeoffSchedule?.deal_id) &&
    !writeoffHasProposal;
  const canWithdrawWriteoff =
    canRecord &&
    writeoffHasProposal &&
    !writeoffIsClosed &&
    writeoffSchedule?.writeoff_proposed_by === currentUserId;
  const canFinalizeWriteoff =
    canFinalize && writeoffCanMutateOpen;
  const canRejectWriteoff =
    canFinalize &&
    writeoffHasProposal &&
    !writeoffIsClosed &&
    writeoffSchedule?.writeoff_proposed_by !== currentUserId;
  const canReopenWriteoff = canFinalize && writeoffIsClosed;

  // #409 (통화/구간 선택): the currencies the header's selector can narrow to
  // — every currency the overview actually carries exposure in, so the
  // dropdown never offers a currency the org has no schedules in.
  const availableLedgerCurrencies = useMemo(
    () => [...new Set((overview.by_currency ?? []).map((row) => row.currency))].sort((a, b) => a.localeCompare(b)),
    [overview.by_currency],
  );
  const ledgerCellFilterActive = Boolean(ledgerBucket);
  const [refreshingManually, setRefreshingManually] = useState(false);
  const onManualRefresh = useCallback(() => {
    setRefreshingManually(true);
    onReload();
  }, [onReload]);
  // reloadVersion changes once the refresh triggered above actually lands
  // (mirrors the uncompleting-flag reset pattern elsewhere in this file) —
  // clearing the busy flag on the button click itself would re-enable it
  // before the new data has actually arrived.
  useEffect(() => {
    setRefreshingManually(false);
  }, [reloadVersion]);

  const controls = (
    <BusinessListToolbar
      data-ui="settlement-controls"
      aria-label="정산 필터"
      actions={
        <>
          <Button
            data-ui="settlement-refresh"
            disabled={refreshingManually}
            intent="brand"
            onClick={onManualRefresh}
            size="md"
            type="button"
            variant="tertiary"
          >
            {copy.controls.refresh}
          </Button>
          <BusinessFilterField label={copy.export.monthLabel}>
            <input
              type="month"
              aria-label={copy.export.monthLabel}
              className="text-body-13 text-text-primary h-9 rounded-md border border-border px-2"
              value={effectiveTaxMonth}
              onChange={(ev) => setTaxMonth(ev.target.value)}
            />
          </BusinessFilterField>
          <Button
            size="md"
            intent="brand"
            variant="secondary"
            type="button"
            onClick={onExportTaxCsv}
            disabled={exporting || !effectiveTaxMonth}
          >
            {copy.export.taxCsv}
          </Button>
          <Button
            size="md"
            intent="brand"
            variant="secondary"
            type="button"
            onClick={onExportCsv}
            disabled={exporting}
          >
            {copy.export.csv}
          </Button>
        </>
      }
      result={
        <p
          className="text-body-13 text-text-muted"
          data-ui="settlement-balance-as-of"
        >
          {copy.asOf.replace("{date}", asOf)}
        </p>
      }
    >
      <BusinessFilterField label={copy.controls.currencyLabel}>
        <Select
          aria-label={copy.controls.currencyLabel}
          className="min-w-24"
          data-ui="settlement-currency-filter"
          onValueChange={(value) => onLedgerCurrencyChange(value || undefined)}
          options={[
            { label: copy.controls.currencyAll, value: "" },
            ...availableLedgerCurrencies.map((currency) => ({
              label: currency,
              value: currency,
            })),
          ]}
          value={ledgerCurrency ?? ""}
        />
      </BusinessFilterField>
      <label className="text-label-12 text-text-secondary flex items-center gap-1.5">
        <input
          checked={includeCancelled}
          className="size-4"
          data-ui="settlement-include-cancelled"
          onChange={(ev) => onIncludeCancelledChange(ev.target.checked)}
          type="checkbox"
        />
        {copy.controls.includeCancelled}
      </label>
    </BusinessListToolbar>
  )
  const summary = (
      <SettlementDecisionCards
        copy={copy.decisions}
        overview={overview}
        onDrill={handleDrill}
        profitability={profitabilityDecision}
      />
  );

  return (
    <div className="flex flex-col gap-6">
      {renderHeader ? renderHeader(controls, summary) : <>{controls}{summary}</>}

      <SettlementDunningPanel
        asOf={overview.data_as_of}
        copy={copy.dunning}
        entries={receivableLedger.status === "ready" ? receivableLedger.data : null}
        formatMoney={exactMoney}
        locale={moneyLocale}
        onRetry={onRetryReceivableLedger}
        status={
          receivableLedger.status === "error"
            ? "error"
            : receivableLedger.status === "loading"
              ? "loading"
              : "ready"
        }
      />


      {/* Fund calendar — each amount is one authoritative server bucket total
          from overview.cells. No client-side net7/net30 recomputation. */}
      <SectionPanel id="settlement-forecast" title={copy.calendar.title}>
        {byCurrencyBuckets.size === 0 ? (
          <p className="text-body-13 text-text-muted">{copy.calendar.empty}</p>
        ) : (
        <div className="flex flex-col gap-4">
          {[...byCurrencyBuckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([currency, buckets]) => (
            <OperationalTableFrame
              className="rounded-lg border border-border-muted bg-surface-card"
              key={currency}
              label={`${copy.calendar.title} · ${currency}`}
            >
              <HostTable className="reference-settlement-bucket-table text-body-13 tabular-nums" data-bucket-table="forecast">
                  <colgroup>
                    <col className="reference-settlement-bucket-label" />
                    <col span={SETTLEMENT_BUCKETS.length} />
                  </colgroup>
                <HostTableHeader>
                  <HostTableRow className="border-b border-border-muted bg-surface text-text-secondary">
                    <HostTableHead scope="col" className="px-3 py-2 text-left font-medium">{currency}</HostTableHead>
                    {SETTLEMENT_BUCKETS.map((b) => (
                      <HostTableHead scope="col" key={b} className="px-3 py-2 text-right font-medium">
                        {copy.calendar.buckets[b]}
                      </HostTableHead>
                    ))}
                  </HostTableRow>
                </HostTableHeader>
                <HostTableBody>
                  {(["receivable", "payable"] as const).map((t) => (
                    <HostTableRow key={t} className="border-b border-border-subtle last:border-0">
                      <HostTableHead scope="row" className="px-3 py-2 text-left font-normal text-text-muted">{copy.ledger.tabs[t]}</HostTableHead>
                      {SETTLEMENT_BUCKETS.map((b) => {
                        const cell = buckets[b]?.[t];
                        const overdue = b === "overdue" && (cell?.total ?? FINANCE_ZERO) > FINANCE_ZERO;
                        const clickable = Boolean(cell && cell.count > 0);
                        return (
                          <HostTableCell
                            key={b}
                            className={`px-3 py-2 text-right ${overdue ? "font-medium text-status-danger" : "text-ecoya-gray-3"}`}
                          >
                            {clickable ? (
                              // #409 (일정 구간 선택 → 원장 조건 변경): a populated
                              // cell drills the ledger below to exactly the
                              // schedules it summarizes — same tab, currency,
                              // and bucket, server-filtered.
                              <TextLink
                                data-ui="settlement-calendar-cell"
                                onClick={() => {
                                  onSelectLedgerCell(t, b, currency);
                                  scrollToSettlementSection("settlement-ledger");
                                }}
                                size="inherit"
                                tone="inherit"
                                underline="always"
                                aria-label={copy.calendar.cellAriaLabel
                                  .replace("{currency}", currency)
                                  .replace("{bucket}", copy.calendar.buckets[b])
                                  .replace("{type}", copy.ledger.tabs[t])}
                              >
                                {`${exactMoney(cell!.total, currency)} (${cell!.count})`}
                              </TextLink>
                            ) : (
                              "—"
                            )}
                          </HostTableCell>
                        );
                      })}
                    </HostTableRow>
                  ))}
                </HostTableBody>
              </HostTable>
            </OperationalTableFrame>
          ))}
        </div>
        )}
      </SectionPanel>

      <SectionPanel id="settlement-cash-calendar" title={copy.cashCalendar.title}>
        <LoadableSection
          copy={sectionLoadableCopy(
            loadableCopy,
            loadableCopy.sections.settlementCalendar,
            copy.cashCalendar.empty,
          )}
          onRetry={onRetryCalendar}
          state={cashCalendar}
        >
          {() => (
            <>
              {byCurrencyCashCalendar.size === 0 ? (
                <p className="text-body-13 text-text-muted">{copy.cashCalendar.empty}</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {[...byCurrencyCashCalendar.entries()]
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([currency, buckets]) => (
                      <OperationalTableFrame
                        className="rounded-lg border border-border-muted bg-surface-card"
                        key={currency}
                        label={`${copy.cashCalendar.title} · ${currency}`}
                      >
                        <HostTable className="reference-settlement-bucket-table text-body-13 tabular-nums" data-bucket-table="cash">
                  <colgroup>
                    <col className="reference-settlement-bucket-label" />
                    <col span={CASH_CALENDAR_BUCKETS.length} />
                  </colgroup>
                          <HostTableHeader>
                            <HostTableRow className="border-b border-border-muted bg-surface text-text-secondary">
                              <HostTableHead scope="col" className="px-3 py-2 text-left font-medium">{currency}</HostTableHead>
                              {CASH_CALENDAR_BUCKETS.map((bucket) => (
                                <HostTableHead scope="col" key={bucket} className="px-3 py-2 text-right font-medium">
                                  {copy.cashCalendar.buckets[bucket]}
                                </HostTableHead>
                              ))}
                            </HostTableRow>
                          </HostTableHeader>
                          <HostTableBody>
                            {(["receivable", "payable"] as const).map((type) => (
                              <HostTableRow key={type} className="border-b border-border-subtle last:border-0">
                                <HostTableHead scope="row" className="px-3 py-2 text-left font-normal text-text-muted">
                                  {copy.ledger.tabs[type]}
                                </HostTableHead>
                                {CASH_CALENDAR_BUCKETS.map((bucket) => {
                                  const cell = buckets[bucket]?.[type];
                                  const overdue = bucket === "overdue" && (cell?.total ?? FINANCE_ZERO) > FINANCE_ZERO;
                                  return (
                                    <HostTableCell
                                      key={bucket}
                                      className={`px-3 py-2 text-right ${overdue ? "font-medium text-status-danger" : "text-ecoya-gray-3"}`}
                                    >
                                      {cell && cell.count > 0
                                        ? `${exactMoney(cell.total, currency)} (${cell.count})`
                                        : "—"}
                                    </HostTableCell>
                                  );
                                })}
                              </HostTableRow>
                            ))}
                          </HostTableBody>
                        </HostTable>
                      </OperationalTableFrame>
                    ))}
                </div>
              )}
              {pendingCashCalendarCount > 0 ? (
                <p className="mt-3 text-label-12 text-text-muted" data-ui="settlement-cash-calendar-pending-note">
                  {copy.cashCalendar.pendingNote.replace("{count}", String(pendingCashCalendarCount))}
                </p>
              ) : null}
            </>
          )}
        </LoadableSection>
      </SectionPanel>

      {/* FX exposure — per-currency AR/AP/net */}
      <SectionPanel title={copy.fx.title}>
        {overview.by_currency.length === 0 ? (
          <p className="text-body-13 text-text-muted">{copy.fx.empty}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {overview.by_currency.map((c) => {
              const net = financeDecimalMagnitude(c.net);
              return (
                <div key={c.currency} className="rounded-lg border border-border-muted bg-surface-card p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-body-15 font-semibold text-text-primary">{c.currency}</span>
                    <span
                      className={`text-body-13 font-medium ${net >= FINANCE_ZERO ? "text-status-success" : "text-status-danger"}`}
                    >
                      {copy.fx.net} <span aria-hidden="true">{financeSignGlyph(net)}</span>{exactMoney(c.net)}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-body-13">
                    <div>
                      <div className="text-text-muted">{copy.kpi.receivable}</div>
                      <div className="font-medium text-text-primary">{exactMoney(c.receivable)}</div>
                    </div>
                    <div>
                      <div className="text-text-muted">{copy.kpi.payable}</div>
                      <div className="font-medium text-text-primary">{exactMoney(c.payable)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionPanel>

      {/* AR/AP aging — per-currency, days past due */}
      {agingByCurrency.size > 0 ? (
        <SectionPanel title={copy.aging.title}>
          <div className="flex flex-col gap-4">
            {[...agingByCurrency.entries()].map(([currency, byType]) => (
              <OperationalTableFrame
                className="rounded-lg border border-border-muted bg-surface-card"
                key={currency}
                label={`${copy.aging.title} · ${currency}`}
              >
                <HostTable className="reference-settlement-bucket-table text-body-13 tabular-nums" data-bucket-table="aging">
                  <colgroup>
                    <col className="reference-settlement-bucket-label" />
                    <col span={AGING_BUCKETS.length} />
                  </colgroup>
                  <HostTableHeader>
                    <HostTableRow className="border-b border-border-muted bg-surface text-text-secondary">
                      <HostTableHead scope="col" className="px-3 py-2 text-left font-medium">{currency}</HostTableHead>
                      {AGING_BUCKETS.map((b) => (
                        <HostTableHead scope="col"
                          key={b}
                          className={`px-3 py-2 text-right font-medium ${b === "d90_plus" ? "text-status-danger" : ""}`}
                        >
                          {(copy.aging as Record<string, string>)[b]}
                        </HostTableHead>
                      ))}
                    </HostTableRow>
                  </HostTableHeader>
                  <HostTableBody>
                    {(["receivable", "payable"] as const).map((t) => (
                      <HostTableRow key={t} className="border-b border-border-subtle last:border-0">
                        <HostTableHead scope="row" className="px-3 py-2 text-left font-normal text-ecoya-gray-3">
                          {t === "receivable" ? copy.kpi.receivable : copy.kpi.payable}
                        </HostTableHead>
                        {AGING_BUCKETS.map((b) => {
                          const v = byType[t][b] ?? FINANCE_ZERO;
                          const overdue = b !== "current" && v > FINANCE_ZERO;
                          return (
                            <HostTableCell
                              key={b}
                              className={`px-3 py-2 text-right ${overdue ? "text-status-danger" : "text-text-primary"}`}
                            >
                              {v !== FINANCE_ZERO ? exactMoney(v) : "—"}
                            </HostTableCell>
                          );
                        })}
                      </HostTableRow>
                    ))}
                  </HostTableBody>
                </HostTable>
              </OperationalTableFrame>
            ))}
          </div>
        </SectionPanel>
      ) : null}

      <CounterpartyScorecardPanel copy={copy.scorecard} formatMoney={exactMoney} getIdToken={getIdToken} />

      {/* Counterparty AR/AP — who owes us, who is late (collection list).
          FE#760 후속: the panel must still render when a drill target
          (drillOnlyCounterparty) is outside by_counterparty even if the
          overview list itself is empty — otherwise the whole section
          disappears under the drilled-to row's feet. */}
      {(overview.by_counterparty?.length ?? 0) > 0 || drillOnlyCounterparty ? (
        <SectionPanel id="settlement-counterparty" title={copy.counterparty.title}>
          <OperationalTableFrame keyboardScrollable label={copy.counterparty.title}>
            <HostTable className="w-full min-w-[52rem] border-collapse text-body-13 whitespace-nowrap tabular-nums">
              <HostTableHeader>
                <HostTableRow className="border-b border-border-muted bg-surface text-text-secondary">
                  <HostTableHead scope="col" className="px-3 py-2 text-left font-medium">{copy.counterparty.name}</HostTableHead>
                  <HostTableHead scope="col" className="px-3 py-2 text-left font-medium">{copy.fx.currency}</HostTableHead>
                  <HostTableHead scope="col" className="px-3 py-2 text-right font-medium">{copy.kpi.receivable}</HostTableHead>
                  <HostTableHead scope="col" className="px-3 py-2 text-right font-medium">{copy.kpi.payable}</HostTableHead>
                  <HostTableHead scope="col" className="px-3 py-2 text-right font-medium text-status-danger">{copy.counterparty.overdue}</HostTableHead>
                </HostTableRow>
              </HostTableHeader>
              <HostTableBody>
                {(overview.by_counterparty ?? []).map((c) => {
                  const overdue = financeDecimalMagnitude(c.overdue_receivable);
                  const key = counterpartyKey(c.counterparty_name, c.currency);
                  const expanded = expandedKey === key;
                  const dealsState = dealsByKey[key];
                  const loadingDeals = !dealsState || dealsState.status === "loading";
                  return (
                    <Fragment key={key}>
                      <HostTableRow
                        className="cursor-pointer border-b border-border-subtle hover:bg-surface last:border-0"
                        data-ui="settlement-counterparty-row"
                        data-expanded={expanded ? "true" : "false"}
                        onClick={() => void toggleCounterparty(c.counterparty_name, c.currency, c.counterparty_id)}
                      >
                        <HostTableCell className="px-3 py-2 text-text-primary">
                          <TextLink className="mr-2" aria-expanded={expanded}
                            aria-label={expanded ? copy.counterparty.collapse : copy.counterparty.expand}
                            onClick={(e) => {
                              e.stopPropagation();
                              void toggleCounterparty(c.counterparty_name, c.currency, c.counterparty_id);
                            }} size="inherit">
                            {expanded ? "▼" : "▶"}
                          </TextLink>
                          {c.counterparty_name || copy.counterparty.unassigned}
                          {c.counterparty_name ? (
                            <Link
                              href={`/erp/counterparties/${encodeURIComponent(c.counterparty_id || c.counterparty_name)}`}
                              className="ml-2 text-label-12 text-ecoya-accent hover:underline"
                              data-ui="settlement-open-customer360"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {copy.counterparty.open360}
                            </Link>
                          ) : null}
                          {mixedCurrencyParties.has(c.counterparty_name ?? "") ? (
                            <span className="ml-2 inline-flex items-center rounded-full bg-status-warning-bg px-2 py-0.5 text-button-11 font-medium text-ecoya-system-yellow-2">
                              {copy.counterparty.currencyMixed}
                            </span>
                          ) : null}
                        </HostTableCell>
                        <HostTableCell className="px-3 py-2 text-ecoya-gray-3">{c.currency}</HostTableCell>
                        <HostTableCell className="px-3 py-2 text-right text-text-primary">{exactMoney(c.receivable)}</HostTableCell>
                        <HostTableCell className="px-3 py-2 text-right text-text-primary">{exactMoney(c.payable)}</HostTableCell>
                        <HostTableCell className={`px-3 py-2 text-right ${overdue > FINANCE_ZERO ? "font-medium text-status-danger" : "text-text-muted"}`}>
                          {overdue > FINANCE_ZERO ? exactMoney(c.overdue_receivable) : "—"}
                        </HostTableCell>
                      </HostTableRow>
                      {expanded ? (
                        <HostTableRow
                          aria-label={loadableCopy.sections.settlementCounterpartyDeals}
                          className="border-b border-border-subtle bg-surface"
                        >
                          <HostTableCell colSpan={5} className="px-6 py-3">
                            {loadingDeals ? (
                              <p className="text-body-13 text-text-muted">{copy.counterparty.loadingDeals}</p>
                            ) : (
                              <LoadableSection
                                copy={sectionLoadableCopy(
                                  loadableCopy,
                                  loadableCopy.sections.settlementCounterpartyDeals,
                                  copy.counterparty.noDeals,
                                )}
                                onRetry={() =>
                                  void loadCounterpartyDeals(
                                    c.counterparty_name,
                                    c.currency,
                                    c.counterparty_id,
                                    true,
                                  )
                                }
                                state={dealsState}
                              >
                                {(deals) =>
                                  deals.length > 0 ? (
                                    renderCounterpartyDealsList(deals)
                                  ) : (
                                    <p className="text-body-13 text-text-muted">
                                      {copy.counterparty.noDeals}
                                    </p>
                                  )
                                }
                              </LoadableSection>
                            )}
                          </HostTableCell>
                        </HostTableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
                {drillOnlyCounterparty ? (
                  <DrillOnlyCounterpartyRow
                    copy={copy}
                    dealsState={dealsByKey[counterpartyKey(drillOnlyCounterparty.name, drillOnlyCounterparty.currency)]}
                    loadableCopy={loadableCopy}
                    onCollapse={() =>
                      void toggleCounterparty(
                        drillOnlyCounterparty.name,
                        drillOnlyCounterparty.currency,
                        drillOnlyCounterparty.counterpartyId,
                      )
                    }
                    onRetry={() =>
                      void loadCounterpartyDeals(
                        drillOnlyCounterparty.name,
                        drillOnlyCounterparty.currency,
                        drillOnlyCounterparty.counterpartyId,
                        true,
                      )
                    }
                    renderDealsList={renderCounterpartyDealsList}
                    target={drillOnlyCounterparty}
                  />
                ) : null}
              </HostTableBody>
            </HostTable>
          </OperationalTableFrame>
        </SectionPanel>
      ) : null}

      {/* AR/AP ledger with tabs */}
      <SectionPanel
        id="settlement-ledger"
        title={copy.ledger.title}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              aria-label={copy.ledger.title}
              data-ui="settlement-manual-schedule"
              disabled={!canRecord}
              intent="brand"
              onClick={openManualSchedule}
              size="sm"
              type="button"
            >
              {copy.ledger.formSave}
            </Button>
            <FilterChipGroup
              aria-label={copy.ledger.tabsAria}
              className="rounded-lg border border-border-muted p-1"
              items={SETTLEMENT_LEDGER_TABS.map((ledgerTab) => ({
                id: ledgerTab,
                label: copy.ledger.tabs[ledgerTab],
                tone: "gray",
              }))}
              onChange={(id) => {
                if (!SETTLEMENT_LEDGER_TABS.includes(id as SettlementLedgerTab)) return;
                setTab(id as SettlementLedgerTab);
              }}
              selectedId={tab}
            />
          </div>
        }
      >
        {ledgerCellFilterActive ? (
          <p
            className="mb-3 flex flex-wrap items-center gap-2 text-label-12 text-text-secondary"
            data-ui="settlement-ledger-cell-filter"
          >
            <span>
              {copy.controls.cellFilterActive
                .replace("{currency}", ledgerCurrency ?? "")
                .replace("{bucket}", copy.calendar.buckets[ledgerBucket ?? "overdue"])}
            </span>
            <TextLink onClick={onClearLedgerCellFilter} size="inherit">
              {copy.controls.clearCellFilter}
            </TextLink>
          </p>
        ) : null}
        {writeoffProposals.status === "error" ? (
          <InfoBox
            action={
              <Button onClick={onReload} size="sm" type="button" variant="tertiary">
                {copy.ledger.writeoff.retry}
              </Button>
            }
            className="mb-3"
            title={copy.ledger.writeoff.loadError}
            tone="risk"
          />
        ) : null}
        {!ledgerReady ? (
          <SkeletonTable rows={8} />
        ) : ledger.length === 0 ? (
          <p className="text-body-13 text-text-muted">{copy.ledger.empty}</p>
        ) : (
          <OperationalTableFrame
            data-ui="settlement-ledger-scroll"
            keyboardScrollable
            label={copy.ledger.title}
          >
            <HostTable className="w-full min-w-[72rem] border-collapse text-body-13 tabular-nums">
              <HostTableHeader>
                <HostTableRow className="border-b border-border-muted bg-surface text-text-secondary">
                  <HostTableHead scope="col" className="px-3 py-2 text-left font-medium">{copy.ledger.counterparty}</HostTableHead>
                  <HostTableHead scope="col" className="px-3 py-2 text-left font-medium">{copy.ledger.type}</HostTableHead>
                  <HostTableHead scope="col" className="px-3 py-2 text-right font-medium">{copy.ledger.amount}</HostTableHead>
                  <HostTableHead scope="col" className="px-3 py-2 text-right font-medium">{copy.ledger.paid}</HostTableHead>
                  <HostTableHead scope="col" className="px-3 py-2 text-right font-medium">{copy.ledger.outstanding}</HostTableHead>
                  <HostTableHead scope="col" className="px-3 py-2 text-left font-medium">{copy.ledger.due}</HostTableHead>
                  <HostTableHead scope="col" className="px-3 py-2 text-left font-medium">{copy.ledger.sourceDocument}</HostTableHead>
                  <HostTableHead scope="col" className="px-3 py-2 text-left font-medium">{copy.ledger.deal}</HostTableHead>
                  <HostTableHead scope="col" className="px-3 py-2 text-left font-medium">{copy.ledger.status}</HostTableHead>
                  <HostTableHead scope="col" className="px-3 py-2 text-left font-medium">{copy.ledger.dispute.title}</HostTableHead>
                  <HostTableHead scope="col" className="px-3 py-2 text-right font-medium">{copy.ledger.action}</HostTableHead>
                </HostTableRow>
              </HostTableHeader>
              <HostTableBody>
                {ledger.map((e) => {
                  const disputeState = e.deal_id ? disputesByDeal[e.deal_id] : undefined;
                  const entryDisputes = disputesForEntry(e);
                  const openDisputes = entryDisputes.filter(isOpenSettlementDispute);
                  const projectedOpenDispute = hasProjectedOpenSettlementDispute(e);
                  const projectedDispute: ProjectedSettlementDispute | null =
                    projectedOpenDispute && e.open_dispute_id
                      ? {
                          id: e.open_dispute_id,
                          schedule_id: e.id,
                          deal_id: e.deal_id,
                          disputed_amount: e.open_disputed_amount,
                          currency: e.currency,
                          status: e.open_dispute_status ?? "open",
                          resolution: null,
                          projectionOnly: true,
                        }
                      : null;
                  const disputesForDisplay: LedgerDispute[] =
                    projectedDispute && !openDisputes.length
                      ? [...entryDisputes, projectedDispute]
                      : entryDisputes;
                  const hasOpenDispute = openDisputes.length > 0 || projectedOpenDispute;
                  const historyLoadError = disputeState?.status === "error";
                  const openDisputeCount = Math.max(openDisputes.length, projectedOpenDispute ? 1 : 0);
                  return (
                  <Fragment key={e.id}>
                    <HostTableRow
                      className="border-b border-border-subtle last:border-0"
                      data-ui="settlement-ledger-row"
                      data-ledger-type={e.type}
                      data-ledger-cancelled={e.deal_cancelled ? "true" : "false"}
                    >
                      <HostTableCell className="px-3 py-2 text-text-primary">
                        {e.counterparty_name ?? "—"}
                        {e.deal_cancelled ? (
                          <span
                            className="ml-2 inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-button-11 font-medium text-text-muted"
                            data-ui="settlement-cancelled-badge"
                            title={copy.ledger.cancelledReadOnly}
                          >
                            {copy.ledger.cancelledBadge}
                          </span>
                        ) : null}
                      </HostTableCell>
                      <HostTableCell className="px-3 py-2">
                        <StatusBadge data-testid="settlement-ledger-direction" tone={ledgerTypeTone(e.type)}>
                          {ledgerTypeLabel(e.type, copy)}
                        </StatusBadge>
                      </HostTableCell>
                      <HostTableCell className="px-3 py-2 text-right text-text-primary">{exactMoney(e.amount, e.currency)}</HostTableCell>
                      <HostTableCell className="px-3 py-2 text-right text-text-muted">{exactMoney(e.paid, e.currency)}</HostTableCell>
                      <HostTableCell className="px-3 py-2 text-right font-medium text-text-primary">{exactMoney(e.outstanding, e.currency)}</HostTableCell>
                      <HostTableCell className="px-3 py-2 text-ecoya-gray-3">{formatDate(e.due_date, moneyLocale)}</HostTableCell>
                      <HostTableCell className="px-3 py-2">
                        {e.source_document_number ? (
                          <Link
                            href={`/erp/documents?q=${encodeURIComponent(e.source_document_number)}${
                              e.deal_id ? `&deal_id=${encodeURIComponent(e.deal_id)}` : ""
                            }`}
                            className="text-ecoya-accent hover:underline"
                          >
                            {e.source_document_number}
                          </Link>
                        ) : e.manual_reference?.number ? (
                          <span className="text-text-muted">
                            {copy.ledger.manualReference}: {e.manual_reference.number}
                          </span>
                        ) : (
                          <StatusBadge
                            data-testid="settlement-ledger-source-document-state"
                            tone={sourceDocumentStateTone(e.source_document_state)}
                          >
                            {sourceDocumentStateLabel(e.source_document_state, copy)}
                          </StatusBadge>
                        )}
                      </HostTableCell>
                      <HostTableCell className="px-3 py-2">
                        {e.deal_id ? (
                          <Link href={`/erp/deals/${e.deal_id}`} className="text-ecoya-accent hover:underline">
                            {copy.counterparty.dealLink}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </HostTableCell>
                      <HostTableCell className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-1">
                          {e.closure_type ? (
                            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-label-12 text-text-disabled">
                              {copy.ledger.statusClosed} · {e.closure_type.replace(/_/g, " ")}
                            </span>
                          ) : (
                            <span
                              className={`rounded-full px-2 py-0.5 text-label-12 ${
                                e.status === "completed"
                                  ? "bg-ecoya-system-green-1 text-ecoya-system-green-6"
                                  : "bg-surface-muted text-text-disabled"
                              }`}
                            >
                              {e.status === "completed"
                                ? copy.ledger.statusCompleted
                                : copy.ledger.statusScheduled}
                            </span>
                          )}
                          {isLedgerEntryOverdue(e) ? (
                            <StatusBadge data-testid="settlement-ledger-overdue" tone="danger">
                              {copy.ledger.overdueBadge}
                            </StatusBadge>
                          ) : null}
                          {!e.closure_type && writeoffProposalById.has(e.id) ? (
                            <span className="rounded-full bg-status-warning-bg px-2 py-0.5 text-label-12 text-ecoya-system-yellow-2">
                              {copy.ledger.writeoff.pendingTitle}
                            </span>
                          ) : null}
                        </div>
                      </HostTableCell>
                      <HostTableCell className="px-3 py-2">
                        {e.deal_id || projectedOpenDispute || entryDisputes.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1">
                            {disputeState?.status === "error" && !projectedOpenDispute ? (
                              <span className="rounded-full bg-status-danger-bg px-2 py-0.5 text-label-12 text-status-danger">
                                {copy.ledger.dispute.errors.generic}
                              </span>
                            ) : openDisputeCount > 0 ? (
                              <span className="rounded-full bg-status-danger-bg px-2 py-0.5 text-label-12 text-status-danger">
                                {copy.ledger.dispute.openBadge.replace("{count}", String(openDisputeCount))}
                              </span>
                            ) : entryDisputes.length > 0 ? (
                              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-label-12 text-text-disabled">
                                {copy.ledger.dispute.historyBadge}
                              </span>
                            ) : (
                              <span className="text-text-muted">—</span>
                            )}
                            {projectedOpenDispute && e.open_disputed_amount ? (
                              <span className="text-label-12 text-text-secondary">
                                {copy.ledger.dispute.disputedAmount}: {exactMoney(e.open_disputed_amount, e.currency)}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </HostTableCell>
                      <HostTableCell className="px-3 py-2 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
                          <TextLink
                            aria-controls={`settlement-exceptions-panel-${e.id}`}
                            aria-expanded={exceptionFor === e.id}
                            className="whitespace-nowrap"
                            data-ui="settlement-exceptions-action"
                            disabled={recBusy || exceptionBusy}
                            onClick={(event) =>
                              exceptionFor === e.id
                                ? closeExceptions()
                                : openExceptions(e.id, event.currentTarget)
                            }
                            size="inherit"
                            tone="inherit"
                          >
                            {copy.exceptions.title}
                          </TextLink>
                          {e.closure_type ? (
                            e.closure_type === "written_off" && e.type === "receivable" ? (
                              <TextLink
                                className="whitespace-nowrap font-medium"
                                data-ui="settlement-locked-action"
                                disabled={writeoffBusy || lifecycleBusy !== null || recBusy || exceptionBusy}
                                onClick={(event) =>
                                  openWriteoff(e, event.currentTarget)
                                }
                                ref={(element) => {
                                  lockedActionRefs.current[e.id] = element;
                                }}
                                tone="accent"
                              >
                                {copy.ledger.writeoff.reviewAction}
                              </TextLink>
                            ) : canFinalize ? (
                              <TextLink
                                aria-label={`${copy.ledger.reopen} — ${e.counterparty_name ?? "—"}`}
                                className="whitespace-nowrap font-medium"
                                data-ui="settlement-reopen-action"
                                disabled={writeoffBusy || lifecycleBusy !== null}
                                onClick={(event) =>
                                  openReopenDialog(e, event.currentTarget)
                                }
                                ref={(element) => {
                                  lockedActionRefs.current[e.id] = element;
                                }}
                                tone="accent"
                              >
                                {copy.ledger.reopen}
                              </TextLink>
                            ) : (
                              <span
                                className="text-text-muted"
                                data-ui="settlement-locked-action"
                                ref={(element) => {
                                  lockedActionRefs.current[e.id] = element;
                                }}
                                tabIndex={-1}
                              >
                                —
                              </span>
                            )
                          ) : (
                            <>
                              {e.status === "completed" && canFinalize ? (
                                <TextLink
                                  className="whitespace-nowrap font-medium text-text-muted hover:text-ecoya-system-red-2"
                                  data-ui="settlement-uncomplete-action"
                                  disabled={uncompleting !== null || lifecycleBusy !== null || recBusy || exceptionBusy}
                                  onClick={(event) =>
                                    setUncompleteTarget({
                                      entry: e,
                                      trigger: event.currentTarget,
                                    })
                                  }
                                  ref={(element) => {
                                    lockedActionRefs.current[e.id] = element;
                                  }}
                                  tone="inherit"
                                >
                                  {copy.ledger.uncomplete}
                                </TextLink>
                              ) : null}
                              {e.status !== "completed" && canRecord && !e.deal_cancelled ? (
                                <TextLink
                                  className="whitespace-nowrap font-medium"
                                  disabled={recBusy || writeoffBusy || lifecycleBusy !== null || exceptionBusy}
                                  onClick={(event) =>
                                    openRecord(e, event.currentTarget)
                                  }
                                  ref={(element) => {
                                    lockedActionRefs.current[e.id] = element;
                                  }}
                                  tone="accent"
                                >
                                  {e.type === "receivable"
                                    ? copy.ledger.recordReceipt
                                    : copy.ledger.recordPayment}
                                </TextLink>
                              ) : null}
                              {e.status !== "completed" && canFinalize ? (
                                <TextLink
                                  aria-label={`${copy.ledger.close} — ${e.counterparty_name ?? "—"}`}
                                  className="whitespace-nowrap font-medium text-text-muted hover:text-ecoya-system-red-2"
                                  data-ui="settlement-close-action"
                                  disabled={recBusy || writeoffBusy || lifecycleBusy !== null}
                                  onClick={(event) =>
                                    openCloseDialog(e, event.currentTarget)
                                  }
                                  ref={(element) => {
                                    lockedActionRefs.current[e.id] = element;
                                  }}
                                  tone="inherit"
                                >
                                  {copy.ledger.close}
                                </TextLink>
                              ) : null}
                              {e.type === "receivable" ? (
                                <TextLink
                                  className="whitespace-nowrap font-medium"
                                  data-ui="settlement-writeoff-action"
                                  disabled={writeoffBusy || lifecycleBusy !== null || recBusy || exceptionBusy}
                                  onClick={(event) =>
                                    openWriteoff(e, event.currentTarget)
                                  }
                                  ref={
                                    (e.status === "completed" && !canFinalize) ||
                                    (e.status !== "completed" && !canRecord)
                                      ? (element) => {
                                          lockedActionRefs.current[e.id] =
                                            element;
                                        }
                                      : undefined
                                  }
                                  tone="accent"
                                >
                                  {e.status === "completed" ||
                                  writeoffProposalById.has(e.id)
                                    ? copy.ledger.writeoff.reviewAction
                                    : canFinalize
                                      ? copy.ledger.writeoff.action
                                      : canRecord && e.deal_id
                                        ? copy.ledger.writeoff.proposalAction
                                        : copy.ledger.writeoff.reviewAction}
                                </TextLink>
                              ) : null}
                              {e.type !== "receivable" &&
                              ((e.status === "completed" && !canFinalize) ||
                                (e.status !== "completed" && !canRecord && !canFinalize)) ? (
                                <span
                                  className="text-text-muted"
                                  data-ui="settlement-capability-locked-action"
                                  ref={(element) => {
                                    lockedActionRefs.current[e.id] = element;
                                  }}
                                  tabIndex={-1}
                                >
                                  —
                                </span>
                              ) : null}
                              {e.status !== "completed" && !e.closure_type ? (
                                <TextLink
                                  aria-controls={`settlement-dispute-panel-${e.id}`}
                                  aria-expanded={disputeFor === e.id}
                                  className="whitespace-nowrap font-medium"
                                  data-ui="settlement-dispute-action"
                                  onClick={(event) => openDisputePanel(e, event.currentTarget)}
                                  tone="accent"
                                >
                                  {copy.ledger.dispute.action}
                                </TextLink>
                              ) : null}
                            </>
                          )}
                        </div>
                      </HostTableCell>
                    </HostTableRow>
                    {disputeFor === e.id ? (
                      <HostTableRow
                        className="border-b border-border-subtle bg-surface"
                        data-ui="settlement-dispute-panel"
                      >
                        <HostTableCell colSpan={11} className="px-3 py-3 whitespace-normal">
                          <div
                            id={`settlement-dispute-panel-${e.id}`}
                            aria-label={copy.ledger.dispute.historyTitle}
                            className="sticky left-0 w-[min(48rem,calc(100vw-6rem))] max-w-full md:w-[min(48rem,calc(100vw-22rem))]"
                            role="region"
                            tabIndex={-1}
                          >
                            <div className="mb-3 rounded-md border border-border-muted bg-surface-card p-3">
                              <h4 className="text-label-12 font-semibold text-text-primary">
                                {copy.ledger.dispute.historyTitle}
                              </h4>
                              {historyLoadError ? (
                                <div className="mt-2 flex flex-wrap items-center gap-2" role="alert">
                                  <span className="text-label-12 text-status-danger">
                                    {copy.ledger.dispute.errors.historyLoadFailed}
                                  </span>
                                  {e.deal_id ? (
                                    <Button
                                      onClick={() => {
                                        if (e.deal_id) void loadDealDisputes(e.deal_id, true);
                                      }}
                                      size="sm"
                                      type="button"
                                      variant="tertiary"
                                    >
                                      {copy.retry}
                                    </Button>
                                  ) : null}
                                </div>
                              ) : null}
                              {disputesForDisplay.length === 0 && !historyLoadError ? (
                                <p className="mt-1 text-label-12 text-text-muted">
                                  {copy.ledger.dispute.historyEmpty}
                                </p>
                              ) : disputesForDisplay.length > 0 ? (
                                <ul className="mt-2 space-y-2">
                                  {disputesForDisplay.map((dispute) => {
                                    const projectionOnly = "projectionOnly" in dispute;
                                    const historyDispute = projectionOnly ? null : dispute;
                                    const hasWriteOffEvidence =
                                      !projectionOnly && Boolean(dispute.evidence?.trim());
                                    const openedAudit = [
                                      historyDispute?.opened_by,
                                      historyDispute?.opened_at
                                        ? formatDate(historyDispute.opened_at, moneyLocale)
                                        : null,
                                    ].filter(Boolean).join(" · ");
                                    const resolvedAudit = [
                                      historyDispute?.resolved_by,
                                      historyDispute?.resolved_at
                                        ? formatDate(historyDispute.resolved_at, moneyLocale)
                                        : null,
                                    ].filter(Boolean).join(" · ");
                                    return (
                                    <li
                                      key={dispute.id}
                                      className="rounded-md border border-border-subtle bg-surface px-3 py-2 text-label-12"
                                    >
                                      <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                          <p className="font-medium text-text-primary">
                                            {projectionOnly
                                              ? `${copy.ledger.dispute.disputedAmount}: ${
                                                  dispute.disputed_amount
                                                    ? exactMoney(dispute.disputed_amount, dispute.currency)
                                                    : "—"
                                                }`
                                              : copy.ledger.dispute.amounts
                                                  .replace("{normal}", exactMoney(dispute.normal_amount, dispute.currency))
                                                  .replace("{disputed}", exactMoney(dispute.disputed_amount, dispute.currency))
                                                  .replace("{original}", exactMoney(dispute.original_amount, dispute.currency))}
                                          </p>
                                          {!projectionOnly ? (
                                            <p className="mt-1 text-text-muted">{dispute.reason}</p>
                                          ) : null}
                                          {!projectionOnly && dispute.evidence ? (
                                            <p className="mt-1 text-text-muted">
                                              {copy.ledger.dispute.evidenceLabel}: {dispute.evidence}
                                            </p>
                                          ) : null}
                                          {openedAudit ? (
                                            <p className="mt-1 text-text-muted">
                                              {copy.ledger.dispute.openedAudit.replace("{value}", openedAudit)}
                                            </p>
                                          ) : null}
                                          {resolvedAudit ? (
                                            <p className="mt-1 text-text-muted">
                                              {copy.ledger.dispute.resolvedAudit.replace("{value}", resolvedAudit)}
                                            </p>
                                          ) : null}
                                        </div>
                                        <span
                                          className={`rounded-full px-2 py-0.5 ${
                                            isOpenSettlementDispute(dispute)
                                              ? "bg-status-warning-bg text-status-warning"
                                              : "bg-surface-muted text-text-secondary"
                                          }`}
                                        >
                                          {disputeResolutionLabel(dispute.resolution, copy.ledger.dispute)}
                                        </span>
                                      </div>
                                      {isOpenSettlementDispute(dispute) ? (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          <Button
                                            disabled={disputeBusy || !canRecord}
                                            onClick={() => void resolveDispute(e, dispute, "resume")}
                                            size="sm"
                                            type="button"
                                            variant="tertiary"
                                          >
                                            {copy.ledger.dispute.resolveResume}
                                          </Button>
                                          <Button
                                            disabled={disputeBusy || !canFinalize || !hasWriteOffEvidence}
                                            onClick={() => void resolveDispute(e, dispute, "write_off")}
                                            size="sm"
                                            type="button"
                                            variant="tertiary"
                                          >
                                            {copy.ledger.dispute.resolveWriteOff}
                                          </Button>
                                          <Button
                                            disabled={disputeBusy || !canRecord}
                                            onClick={() => void resolveDispute(e, dispute, "adjust")}
                                            size="sm"
                                            type="button"
                                            variant="tertiary"
                                          >
                                            {copy.ledger.dispute.resolveAdjust}
                                          </Button>
                                        </div>
                                      ) : null}
                                      {isOpenSettlementDispute(dispute) && !hasWriteOffEvidence ? (
                                        <p className="mt-2 text-label-12 text-text-muted">
                                          {copy.ledger.dispute.errors.writeOffEvidenceRequired}
                                        </p>
                                      ) : null}
                                    </li>
                                    );
                                  })}
                                </ul>
                              ) : null}
                            </div>
                            {!hasOpenDispute ? <div className="flex flex-wrap items-end gap-3">
                              <label className="flex flex-col gap-0.5 text-label-12 text-text-secondary">
                                {copy.ledger.dispute.normalAmount}
                                <input
                                  aria-describedby={disputeInvalidField === "normalAmount" ? "settlement-dispute-error" : undefined}
                                  aria-invalid={disputeInvalidField === "normalAmount"}
                                  aria-required="true"
                                  required
                                  type="text"
                                  inputMode="decimal"
                                  value={disputeNormalAmount}
                                  ref={(element) => {
                                    disputeFieldRefs.current.normalAmount = element;
                                  }}
                                  onChange={(ev) =>
                                    dispatchDisputePanel({
                                      type: "field",
                                      field: "normalAmount",
                                      value: ev.target.value,
                                    })
                                  }
                                  className="h-9 w-32 rounded-md border border-border bg-surface-card px-2 text-body-13 text-text-primary"
                                />
                              </label>
                              <label className="flex flex-col gap-0.5 text-label-12 text-text-secondary">
                                {copy.ledger.dispute.disputedAmount}
                                <input
                                  aria-describedby={disputeInvalidField === "amount" ? "settlement-dispute-error" : undefined}
                                  aria-invalid={disputeInvalidField === "amount"}
                                  aria-required="true"
                                  required
                                  type="text"
                                  inputMode="decimal"
                                  value={disputeAmount}
                                  ref={(element) => {
                                    disputeFieldRefs.current.amount = element;
                                  }}
                                  onChange={(ev) =>
                                    dispatchDisputePanel({
                                      type: "field",
                                      field: "amount",
                                      value: ev.target.value,
                                    })
                                  }
                                  className="h-9 w-32 rounded-md border border-border bg-surface-card px-2 text-body-13 text-text-primary"
                                />
                              </label>
                              <label className="flex min-w-60 flex-1 flex-col gap-0.5 text-label-12 text-text-secondary">
                                {copy.ledger.dispute.reason}
                                <input
                                  aria-describedby={disputeInvalidField === "reason" ? "settlement-dispute-error" : undefined}
                                  aria-invalid={disputeInvalidField === "reason"}
                                  aria-required="true"
                                  required
                                  type="text"
                                  value={disputeReason}
                                  ref={(element) => {
                                    disputeFieldRefs.current.reason = element;
                                  }}
                                  onChange={(ev) =>
                                    dispatchDisputePanel({
                                      type: "field",
                                      field: "reason",
                                      value: ev.target.value,
                                    })
                                  }
                                  className="h-9 rounded-md border border-border bg-surface-card px-2 text-body-13 text-text-primary"
                                />
                              </label>
                              <label className="flex min-w-60 flex-1 flex-col gap-0.5 text-label-12 text-text-secondary">
                                {copy.ledger.dispute.evidenceLabel}
                                <input
                                  type="text"
                                  value={disputeEvidence}
                                  onChange={(ev) =>
                                    dispatchDisputePanel({
                                      type: "field",
                                      field: "evidence",
                                      value: ev.target.value,
                                    })
                                  }
                                  className="h-9 rounded-md border border-border bg-surface-card px-2 text-body-13 text-text-primary"
                                />
                              </label>
                              <Button
                                disabled={disputeBusy || !canRecord}
                                onClick={() => void submitDispute(e)}
                                size="sm"
                                intent="brand"
                                type="button"
                                variant="secondary"
                              >
                                {copy.ledger.dispute.open}
                              </Button>
                              <TextLink onClick={cancelDisputePanel} disabled={disputeBusy}>
                                {copy.ledger.formCancel}
                              </TextLink>
                            </div> : null}
                            {hasOpenDispute ? (
                              <div className="flex justify-end">
                                <TextLink onClick={cancelDisputePanel} disabled={disputeBusy}>
                                  {copy.ledger.formCancel}
                                </TextLink>
                              </div>
                            ) : null}
                            {disputeError ? (
                              <p
                                className="mt-1 break-keep text-label-12 text-status-danger"
                                id="settlement-dispute-error"
                                role="alert"
                              >
                                {disputeError}
                              </p>
                            ) : null}
                          </div>
                        </HostTableCell>
                      </HostTableRow>
                    ) : null}
                    {recordFor === e.id ? (
                      <HostTableRow
                        aria-label={loadableCopy.sections.settlementPaymentHistory}
                        className="border-b border-border-subtle bg-surface"
                        data-ui="settlement-record-form"
                      >
                        <HostTableCell colSpan={11} className="px-3 py-2 whitespace-normal">
                          <div className="sticky left-0 w-[min(44rem,calc(100vw-6rem))] max-w-full md:w-[min(44rem,calc(100vw-22rem))]">
                            <CanonicalScheduleCashPanel
                              key={`${currentOrgId}:${currentUserId}:${e.id}`}
                              canFinalize={
                                canFinalize &&
                                !e.closure_type &&
                                !e.deal_cancelled &&
                                e.status !== "completed"
                              }
                              canRecord={
                                canRecord &&
                                !e.closure_type &&
                                !e.deal_cancelled &&
                                e.status !== "completed"
                              }
                              copy={copy.ledger.canonicalCash}
                              currency={e.currency ?? ""}
                              disabled={lifecycleBusy !== null}
                              formatMoney={exactMoney}
                              formatValueDate={(value) => formatDate(value, moneyLocale)}
                              getIdToken={getIdToken}
                              initialDate={recDate}
                              mapCommandError={(error, capability) => {
                                const denied = capabilityDeniedMessage(
                                  error,
                                  capability,
                                  entitlementCopy,
                                );
                                if (denied) return denied;
                                if (
                                  error instanceof ApiError &&
                                  [
                                    "ERP_SETTLEMENT_CURRENCY_MISMATCH",
                                    "ERP_SETTLEMENT_SCHEDULE_CLOSED",
                                    "ERP_SETTLEMENT_DUPLICATE_SOURCE_DOCUMENT",
                                    "ERP_SETTLEMENT_VALIDATION",
                                    "ERP_SETTLEMENT_SCHEDULE_NOT_FOUND",
                                  ].includes(error.code)
                                ) {
                                  return recordCashErrorMessage(
                                    error,
                                    copy.ledger.recordErrors,
                                    copy.ledger.recordError,
                                  );
                                }
                                return null;
                              }}
                              onBusyChange={(busy) => {
                                recBusyRef.current = busy;
                                setRecBusy(busy);
                              }}
                              onChanged={(message) => {
                                onRecordStatus(message);
                                onReload();
                                refreshExpandedCounterpartyDeals();
                              }}
                              onClose={cancelRecord}
                              onRecorded={(result: RecordScheduleCashResponse) => {
                                setRecordFor(null);
                                // {amount} is what was applied to THIS schedule
                                // (application.amount, in the row currency), not
                                // the raw cash received: with fees or a split
                                // receipt the two differ and pairing the receipt
                                // with the schedule outstanding does not add up.
                                const statusMessage =
                                  financeDecimalMagnitude(result.outstanding) > FINANCE_ZERO
                                    ? copy.ledger.recordSavedDetail
                                        .replace(
                                          "{amount}",
                                          exactMoney(result.application.amount, e.currency),
                                        )
                                        .replace(
                                          "{outstanding}",
                                          exactMoney(result.outstanding, e.currency),
                                        )
                                    : copy.ledger.recordSavedSettled.replace(
                                        "{amount}",
                                        exactMoney(result.application.amount, e.currency),
                                      );
                                onRecordStatus(statusMessage);
                                if (recTriggerRef.current) {
                                  pendingFocusRef.current = {
                                    scheduleId: e.id,
                                    button: recTriggerRef.current,
                                  };
                                }
                                onReload();
                                refreshExpandedCounterpartyDeals();
                              }}
                              outstanding={e.outstanding}
                              scheduleId={e.id}
                            />
                          </div>
                        </HostTableCell>
                      </HostTableRow>
                    ) : null}
                    {exceptionFor === e.id ? (
                      <HostTableRow
                        aria-label={copy.exceptions.title}
                        className="border-b border-border-subtle bg-surface"
                        data-ui="settlement-exceptions-panel"
                        id={`settlement-exceptions-panel-${e.id}`}
                      >
                        <HostTableCell colSpan={11} className="px-3 py-2 whitespace-normal">
                          <SettlementExceptionPanel
                            allowLegacyOverpaymentRecord={false}
                            canRecord={canRecord && !e.closure_type}
                            copy={copy.exceptions}
                            entry={e}
                            formatMoney={exactMoney}
                            getIdToken={getIdToken}
                            onBusyChange={setExceptionMutationBusy}
                            onClose={closeExceptions}
                            onSaved={onReload}
                          />
                        </HostTableCell>
                      </HostTableRow>
                    ) : null}
                  </Fragment>
                );
                })}
              </HostTableBody>
            </HostTable>
          </OperationalTableFrame>
        )}
        {ledgerReady && ledgerPagination && ledgerPageCount > 1 ? (
          <nav
            aria-label={copy.ledger.paginationLabel}
            className="mt-4 flex items-center justify-center gap-3"
            data-ui="settlement-ledger-pagination"
          >
            <Button
              disabled={ledgerCurrentPage <= 1}
              onClick={() => onLedgerPageChange((ledgerCurrentPage - 2) * ledgerPageSize)}
              size="sm"
              type="button"
              variant="tertiary"
            >
              {copy.ledger.previousPage}
            </Button>
            <span aria-live="polite" className="text-label-12 text-text-muted">
              {copy.ledger.pageOf
                .replace("{page}", String(ledgerCurrentPage))
                .replace("{total}", String(ledgerPageCount))}
            </span>
            <Button
              disabled={ledgerCurrentPage >= ledgerPageCount}
              onClick={() => onLedgerPageChange(ledgerCurrentPage * ledgerPageSize)}
              size="sm"
              type="button"
              variant="tertiary"
            >
              {copy.ledger.nextPage}
            </Button>
          </nav>
        ) : null}
      </SectionPanel>

      {/* Accounting-handoff prep (invoice-basis estimated deal result) comes after AR/AP timing —
          collecting/paying cash is the daily-operations task this page leads
          with; result-evidence readiness is a secondary, less time-sensitive concern. */}
      {financeFactsUnavailable ? (
        <InfoBox
          action={
            <Button onClick={onRetryFinanceFacts} size="sm" type="button" variant="tertiary">
              {copy.retry}
            </Button>
          }
          className="mb-4"
          title={copy.financeFacts.loadError}
          tone="risk"
        />
      ) : financeFactsLoading ? (
        <InfoBox className="mb-4" title={copy.loading} tone="neutral" />
      ) : !financeFactsComplete ? (
        <InfoBox className="mb-4" title={copy.financeFacts.incompleteSnapshot} tone="neutral" />
      ) : null}
      {!financeFactsUnavailable && !financeFactsLoading ? (
        <>
          <TradeFinanceFactPanel copy={copy.financeFacts} facts={financeFacts} />

          <TradeProfitabilityRollupPanel
            copy={copy.financeRollup}
            facts={financeFactsComplete ? financeFacts : []}
            unknown={copy.financeFacts.unknown}
          />
        </>
      ) : null}

      <Dialog
        cancelText={copy.ledger.formCancel}
        closeLabel={copy.ledger.dialogCloseLabel}
        okText={copy.ledger.formSave}
        footer={
          <DialogFooterContainer>
            <Button
              disabled={manualScheduleBusy}
              onClick={() => setManualScheduleOpen(false)}
              size="lg"
              type="button"
              variant="tertiary"
            >
              {copy.ledger.formCancel}
            </Button>
            <Button
              disabled={manualScheduleBusy}
              intent="brand"
              loading={manualScheduleBusy}
              onClick={() => void saveManualSchedule()}
              size="lg"
              type="button"
            >
              {copy.ledger.formSave}
            </Button>
          </DialogFooterContainer>
        }
        onOpenChange={(open) => {
          if (!open && !manualScheduleBusy) setManualScheduleOpen(false);
        }}
        open={manualScheduleOpen}
        title={copy.ledger.title}
        width={480}
      >
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-label-12 text-text-secondary">
            {copy.ledger.counterparty}
            <input
              aria-label={copy.ledger.counterparty}
              className="h-9 rounded-md border border-border px-2 text-body-13 text-text-primary"
              disabled={manualScheduleBusy}
              onChange={(event) => setManualScheduleCounterparty(event.target.value)}
              value={manualScheduleCounterparty}
            />
          </label>
          <label className="flex flex-col gap-1 text-label-12 text-text-secondary">
            {copy.ledger.amount}
            <input
              aria-label={copy.ledger.amount}
              className="h-9 rounded-md border border-border px-2 text-body-13 text-text-primary"
              disabled={manualScheduleBusy}
              inputMode="decimal"
              onChange={(event) => setManualScheduleAmount(event.target.value)}
              value={manualScheduleAmount}
            />
          </label>
          <label className="flex flex-col gap-1 text-label-12 text-text-secondary">
            {copy.controls.currencyLabel}
            <input
              aria-label={copy.controls.currencyLabel}
              className="h-9 rounded-md border border-border px-2 text-body-13 text-text-primary"
              disabled={manualScheduleBusy}
              maxLength={3}
              onChange={(event) => setManualScheduleCurrency(event.target.value)}
              value={manualScheduleCurrency}
            />
          </label>
          <label className="flex flex-col gap-1 text-label-12 text-text-secondary">
            {copy.ledger.due}
            <input
              aria-label={copy.ledger.due}
              className="h-9 rounded-md border border-border px-2 text-body-13 text-text-primary"
              disabled={manualScheduleBusy}
              onChange={(event) => setManualScheduleDueDate(event.target.value)}
              type="date"
              value={manualScheduleDueDate}
            />
          </label>
          <div className="flex flex-col gap-1 text-label-12 text-text-secondary">
            <span>{copy.ledger.type}</span>
            <Select
              aria-label={copy.ledger.type}
              className="w-full"
              disabled={manualScheduleBusy}
              onValueChange={(value) => {
                if (value === "receivable" || value === "payable") setManualScheduleType(value);
              }}
              options={[
                { label: copy.ledger.tabs.receivable, value: "receivable" },
                { label: copy.ledger.tabs.payable, value: "payable" },
              ]}
              value={manualScheduleType}
            />
          </div>
          {manualScheduleError ? (
            <p className="m-0 text-body-13 text-status-danger" role="alert">
              {manualScheduleError}
            </p>
          ) : null}
        </div>
      </Dialog>
      <Dialog
        cancelText={copy.ledger.writeoff.cancel}
        closeLabel={copy.ledger.dialogCloseLabel}
        okText={copy.ledger.writeoff.finalize}
        footer={
          <DialogFooterContainer>
            <Button
              disabled={writeoffBusy}
              onClick={closeWriteoffDialog}
              size="lg"
              type="button"
              variant="tertiary"
            >
              {copy.ledger.writeoff.cancel}
            </Button>
            {canWithdrawWriteoff ? (
              <Button
                disabled={writeoffBusy}
                onClick={() => void withdrawWriteoff()}
                size="lg"
                type="button"
                variant="secondary"
              >
                {copy.ledger.writeoff.withdraw}
              </Button>
            ) : null}
            {canRejectWriteoff ? (
              <Button
                disabled={writeoffBusy}
                intent="danger"
                onClick={() => void rejectWriteoff()}
                size="lg"
                type="button"
              >
                {copy.ledger.writeoff.reject}
              </Button>
            ) : null}
            {canProposeWriteoff ? (
              <Button
                disabled={writeoffBusy}
                onClick={() => void submitWriteoffProposal()}
                size="lg"
                type="button"
              >
                {copy.ledger.writeoff.propose}
              </Button>
            ) : null}
            {canFinalizeWriteoff ? (
              <Button
                disabled={writeoffBusy}
                intent="danger"
                onClick={() => void finalizeWriteoff()}
                size="lg"
                type="button"
              >
                {copy.ledger.writeoff.finalize}
              </Button>
            ) : null}
            {canReopenWriteoff ? (
              <Button
                disabled={writeoffBusy}
                onClick={() => void reopenWriteoff()}
                size="lg"
                type="button"
              >
                {copy.ledger.writeoff.reopen}
              </Button>
            ) : null}
          </DialogFooterContainer>
        }
        onOpenChange={(open) => {
          if (!open) closeWriteoffDialog();
        }}
        open={writeoffTarget !== null}
        title={copy.ledger.writeoff.title.replace(
          "{counterparty}",
          writeoffTarget?.entry.counterparty_name ?? "—",
        )}
        width={640}
      >
        {writeoffTarget ? (
          <div className="flex flex-col gap-4">
            <p className="m-0 text-body-14 text-text-primary">
              {copy.ledger.writeoff.summary
                .replace(
                  "{scheduled}",
                  exactMoney(
                    writeoffSettlement?.amount ??
                      writeoffTarget.entry.amount,
                    writeoffSchedule?.currency ??
                      writeoffTarget.entry.currency,
                  ),
                )
                .replace(
                  "{received}",
                  exactMoney(
                    writeoffSettlement?.paid ??
                      writeoffTarget.entry.paid,
                    writeoffSchedule?.currency ??
                      writeoffTarget.entry.currency,
                  ),
                )
                .replace(
                  "{outstanding}",
                  exactMoney(
                    writeoffSettlement?.outstanding ??
                      writeoffTarget.entry.outstanding,
                    writeoffSchedule?.currency ??
                      writeoffTarget.entry.currency,
                  ),
                )}
            </p>
            {writeoffDialogState.status === "loading" ? (
              <p
                aria-live="polite"
                className="m-0 text-body-14 text-text-muted"
                role="status"
              >
                {copy.ledger.writeoff.loading}
              </p>
            ) : writeoffDialogState.status === "error" ? (
              <InfoBox
                action={
                  <Button
                    onClick={() =>
                      void loadWriteoffDetails(writeoffTarget.entry.id)
                    }
                    size="sm"
                    type="button"
                    variant="tertiary"
                  >
                    {copy.ledger.writeoff.retry}
                  </Button>
                }
                title={copy.ledger.writeoff.loadError}
                tone="risk"
              />
            ) : (
              <>
                {writeoffHasProposal ? (
                  <section className="rounded-lg border border-status-warning bg-status-warning-bg p-3">
                    <h3 className="m-0 text-body-14 font-semibold text-text-primary">
                      {copy.ledger.writeoff.pendingTitle}
                    </h3>
                    {writeoffSchedule?.writeoff_proposal_reason ? (
                      <p className="mt-2 mb-0 whitespace-pre-wrap text-body-13 text-text-primary">
                        {writeoffSchedule.writeoff_proposal_reason}
                      </p>
                    ) : null}
                    {writeoffSchedule?.writeoff_proposal_document_id ? (
                      <p className="mt-1 mb-0 break-all text-label-12 text-text-muted">
                        {copy.ledger.writeoff.documentIdLabel}:{" "}
                        {writeoffSchedule.writeoff_proposal_document_id}
                      </p>
                    ) : null}
                    {writeoffSchedule?.writeoff_proposal_evidence ? (
                      <p className="mt-1 mb-0 whitespace-pre-wrap text-label-12 text-text-muted">
                        {copy.ledger.writeoff.externalEvidenceLabel}:{" "}
                        {writeoffSchedule.writeoff_proposal_evidence}
                      </p>
                    ) : null}
                  </section>
                ) : null}
                {canProposeWriteoff || canFinalizeWriteoff ? (
                  <section className="grid gap-3">
                    <label className="grid gap-1 text-label-12 text-text-secondary">
                      {copy.ledger.writeoff.reasonLabel}
                      <textarea
                        aria-invalid={Boolean(writeoffError)}
                        className="min-h-24 rounded-md border border-border bg-surface-card px-3 py-2 text-body-14 text-text-primary"
                        onChange={(event) => setWriteoffReason(event.target.value)}
                        placeholder={copy.ledger.writeoff.reasonPlaceholder}
                        required
                        value={writeoffReason}
                      />
                    </label>
                    <label className="grid gap-1 text-label-12 text-text-secondary">
                      {copy.ledger.writeoff.documentIdLabel}
                      <input
                        aria-describedby="writeoff-evidence-hint"
                        aria-invalid={Boolean(writeoffError)}
                        className="h-10 rounded-md border border-border bg-surface-card px-3 text-body-14 text-text-primary"
                        onChange={(event) =>
                          setWriteoffDocumentId(event.target.value)
                        }
                        placeholder={
                          copy.ledger.writeoff.documentIdPlaceholder
                        }
                        type="text"
                        value={writeoffDocumentId}
                      />
                    </label>
                    <label className="grid gap-1 text-label-12 text-text-secondary">
                      {copy.ledger.writeoff.externalEvidenceLabel}
                      <textarea
                        aria-describedby="writeoff-evidence-hint"
                        aria-invalid={Boolean(writeoffError)}
                        className="min-h-20 rounded-md border border-border bg-surface-card px-3 py-2 text-body-14 text-text-primary"
                        onChange={(event) =>
                          setWriteoffExternalEvidence(event.target.value)
                        }
                        placeholder={
                          copy.ledger.writeoff.externalEvidencePlaceholder
                        }
                        value={writeoffExternalEvidence}
                      />
                    </label>
                    <p
                      className="m-0 text-label-12 text-text-muted"
                      id="writeoff-evidence-hint"
                    >
                      {copy.ledger.writeoff.evidenceHint}
                    </p>
                  </section>
                ) : null}
                <section aria-labelledby="writeoff-history-title">
                  <h3
                    className="m-0 text-body-14 font-semibold text-text-primary"
                    id="writeoff-history-title"
                  >
                    {copy.ledger.writeoff.historyTitle}
                  </h3>
                  {writeoffEvents.length === 0 ? (
                    <p className="mt-2 mb-0 text-body-13 text-text-muted">
                      {copy.ledger.writeoff.historyEmpty}
                    </p>
                  ) : (
                    <ol
                      className="mt-2 flex max-h-64 flex-col gap-2 overflow-y-auto"
                      data-ui="settlement-writeoff-history"
                    >
                      {writeoffEvents.map((event) => (
                        <li
                          className="rounded-md border border-border-muted p-3"
                          key={event.id}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <strong className="text-body-13 text-text-primary">
                              {writeoffEventLabel(
                                event.event_type,
                                copy.ledger.writeoff,
                              )}
                            </strong>
                            <time
                              className="text-label-12 text-text-muted"
                              dateTime={event.occurred_at}
                            >
                              {copy.ledger.writeoff.historyActor
                                .replace(
                                  "{actor}",
                                  event.actor ??
                                    copy.ledger.writeoff.unknownActor,
                                )
                                .replace(
                                  "{time}",
                                  formatDateTime(
                                    event.occurred_at,
                                    moneyLocale,
                                  ),
                                )}
                            </time>
                          </div>
                          <p className="mt-1 mb-0 text-label-12 text-text-muted">
                            {copy.ledger.writeoff.historyAmounts
                              .replace(
                                "{scheduled}",
                                exactMoney(
                                  event.scheduled_amount,
                                  event.scheduled_currency,
                                ),
                              )
                              .replace(
                                "{received}",
                                exactMoney(
                                  event.received_amount,
                                  event.scheduled_currency,
                                ),
                              )
                              .replace(
                                "{writtenOff}",
                                event.written_off_amount
                                  ? exactMoney(
                                      event.written_off_amount,
                                      event.scheduled_currency,
                                    )
                                  : "—",
                              )}
                          </p>
                          {event.reason ? (
                            <p className="mt-1 mb-0 whitespace-pre-wrap text-body-13 text-text-primary">
                              {event.reason}
                            </p>
                          ) : null}
                          {event.evidence_document_id ? (
                            <p className="mt-1 mb-0 break-all text-label-12 text-text-muted">
                              {copy.ledger.writeoff.documentIdLabel}:{" "}
                              {event.evidence_document_id}
                            </p>
                          ) : null}
                          {event.external_evidence ? (
                            <p className="mt-1 mb-0 whitespace-pre-wrap text-label-12 text-text-muted">
                              {copy.ledger.writeoff.externalEvidenceLabel}:{" "}
                              {event.external_evidence}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </>
            )}
            {writeoffError ? (
              <p
                className="m-0 text-body-13 text-status-danger"
                role="alert"
              >
                {writeoffError}
              </p>
            ) : null}
          </div>
        ) : null}
      </Dialog>

      <Dialog
        cancelText={copy.ledger.closeCancel}
        className="max-w-[calc(100vw-2rem)]"
        closeLabel={copy.ledger.dialogCloseLabel}
        okText={copy.ledger.closeConfirm}
        footer={
          <DialogFooterContainer>
            <Button
              disabled={lifecycleBusy !== null}
              onClick={() => setCloseTarget(null)}
              size="lg"
              type="button"
              variant="tertiary"
            >
              {copy.ledger.closeCancel}
            </Button>
            <Button
              disabled={lifecycleBusy !== null}
              intent="danger"
              onClick={() => void confirmCloseSchedule()}
              size="lg"
              type="button"
            >
              {copy.ledger.closeConfirm}
            </Button>
          </DialogFooterContainer>
        }
        onOpenChange={(open) => {
          if (!open && lifecycleBusy === null) {
            setCloseTarget(null);
            setCloseDraft(EMPTY_CLOSE_DRAFT);
          }
        }}
        open={closeTarget !== null}
        title={copy.ledger.closeConfirmTitle}
        width={480}
      >
        {closeTarget ? (
          <div className="flex flex-col gap-3">
            <p className="m-0 break-keep [overflow-wrap:anywhere] text-body-14 font-regular text-text-primary">
              {copy.ledger.closeConfirmBody
                .replace("{counterparty}", closeTarget.entry.counterparty_name ?? "—")
                .replace("{amount}", exactMoney(closeTarget.entry.amount, closeTarget.entry.currency))}
            </p>
            <div className="flex flex-col gap-1 text-label-12 text-text-secondary">
              <span>{copy.ledger.closeType}</span>
              <Select
                aria-label={copy.ledger.closeType}
                className="w-full"
                disabled={lifecycleBusy !== null}
                onValueChange={(value) => {
                  if (!isCloseType(value)) return;
                  setCloseDraft((previous) => ({
                    ...previous,
                    closureType: value,
                  }));
                }}
                options={CLOSE_TYPES.map((type) => ({
                  label: copy.ledger.closeTypes[type],
                  value: type,
                }))}
                value={closeDraft.closureType}
              />
            </div>
            <label className="flex flex-col gap-1 text-label-12 text-text-secondary">
              {copy.ledger.closeNote}
              <TextArea
                aria-label={copy.ledger.closeNote}
                className="w-full"
                disabled={lifecycleBusy !== null}
                fullWidth
                onChange={(event) =>
                  setCloseDraft((previous) => ({
                    ...previous,
                    note: event.target.value,
                  }))
                }
                value={closeDraft.note}
              />
            </label>
            {closeDraft.error ? (
              <p className="m-0 text-body-13 text-status-danger" role="alert">
                {closeDraft.error}
              </p>
            ) : null}
          </div>
        ) : null}
      </Dialog>

      <Dialog
        cancelText={copy.ledger.reopenCancel}
        className="max-w-[calc(100vw-2rem)]"
        closeLabel={copy.ledger.dialogCloseLabel}
        okText={copy.ledger.reopenConfirm}
        footer={
          <DialogFooterContainer>
            <Button
              disabled={lifecycleBusy !== null}
              onClick={() => setReopenTarget(null)}
              size="lg"
              type="button"
              variant="tertiary"
            >
              {copy.ledger.reopenCancel}
            </Button>
            <Button
              disabled={lifecycleBusy !== null}
              onClick={() => void confirmReopenSchedule()}
              size="lg"
              type="button"
            >
              {copy.ledger.reopenConfirm}
            </Button>
          </DialogFooterContainer>
        }
        onOpenChange={(open) => {
          if (!open && lifecycleBusy === null) {
            setReopenTarget(null);
            setReopenError(null);
          }
        }}
        open={reopenTarget !== null}
        title={copy.ledger.reopenConfirmTitle}
        width={400}
      >
        {reopenTarget ? (
          <div className="flex flex-col gap-3">
            <p className="m-0 break-keep [overflow-wrap:anywhere] text-body-14 font-regular text-text-primary">
              {reopenBody}
            </p>
            {reopenError ? (
              <p className="m-0 text-body-13 text-status-danger" role="alert">
                {reopenError}
              </p>
            ) : null}
          </div>
        ) : null}
      </Dialog>

      <Dialog
        cancelText={copy.ledger.uncompleteCancel}
        closeLabel={copy.ledger.dialogCloseLabel}
        okText={copy.ledger.uncompleteConfirm}
        footer={
          <DialogFooterContainer>
            <Button
              disabled={uncompleting !== null}
              onClick={() => setUncompleteTarget(null)}
              size="lg"
              type="button"
              variant="tertiary"
            >
              {copy.ledger.uncompleteCancel}
            </Button>
            <Button
              disabled={uncompleting !== null}
              intent="danger"
              onClick={() => void confirmUncomplete()}
              size="lg"
              type="button"
            >
              {copy.ledger.uncompleteConfirm}
            </Button>
          </DialogFooterContainer>
        }
        onOpenChange={(open) => {
          if (!open) setUncompleteTarget(null);
        }}
        open={uncompleteTarget !== null}
        title={copy.ledger.uncompleteConfirmTitle}
        width={400}
      >
        {uncompleteTarget ? (
          <p className="m-0 text-body-14 font-regular text-text-primary">
            {copy.ledger.uncompleteConfirmBody
              .replace("{counterparty}", uncompleteTarget.entry.counterparty_name ?? "—")
              .replace("{amount}", exactMoney(uncompleteTarget.entry.amount, uncompleteTarget.entry.currency))}
          </p>
        ) : null}
      </Dialog>
    </div>
  );
}

import {
  FINANCE_DECIMAL_SCALE,
  financeDecimalMagnitude,
  type SettlementOverview,
} from "@trade-os/operations/lib/api/settlement";
import { formatScaledMoney } from "@trade-os/operations/lib/money";

import type { MetricTone } from "@trade-os/operations/components/MetricCard";

export type SettlementDecisionCardsCopy = {
  title: string;
  subtitle: string;
  empty: string;
  cta: string;
  overdueAr: { title: string; body: string };
  receivable: { title: string; body: string };
  pay7: { title: string; body: string };
  net: { title: string; body: string };
  profitability: { title: string; body: string };
};

export type SettlementDrillTarget =
  | { section: "counterparty"; counterpartyName: string; currency: string }
  | { section: "ledger"; tab: "receivable" | "payable" }
  | { section: "forecast" }
  | { section: "profitability" }
  | { section: "overdue"; currency?: string };

export const SETTLEMENT_DRILL_OVERDUE_HREF = "/erp/settlement?drill=overdue";
export const SETTLEMENT_DRILL_PAYABLE_HREF = "/erp/settlement?drill=payable";
export const SETTLEMENT_DRILL_RECEIVABLE_HREF = "/erp/settlement?drill=receivable";
export const SETTLEMENT_DRILL_FORECAST_HREF = "/erp/settlement?drill=forecast";
export const SETTLEMENT_DRILL_PROFITABILITY_HREF = "/erp/settlement?drill=profitability";

/**
 * Dynamic counterpart of the static HREFs above — lands on the ledger rows
 * behind one (counterparty, currency) number (FE#760 원천 데이터 드릴다운).
 * Reuses the existing `?drill=party&name=&currency=` contract that
 * `parseSettlementDrillSearchParams` already parses and `SettlementConnected`
 * already handles (`expandCounterparty`) — this was previously wired from
 * nowhere; Reports' Top-N counterparty rows are the first producer.
 */
export function settlementCounterpartyDrillHref(counterpartyName: string, currency: string): string {
  const params = new URLSearchParams({ drill: "party", name: counterpartyName, currency });
  return `/erp/settlement?${params.toString()}`;
}

export type SettlementDecisionCard = {
  id: string;
  title: string;
  body: string;
  value: string;
  tone: MetricTone;
  href: string;
  drill: SettlementDrillTarget;
};

export type SettlementProfitabilityDecision = {
  amount: bigint;
  currency: string;
  tone: MetricTone;
};

const ZERO = BigInt(0);

function fmtAmt(value: bigint, currency: string, locale?: string): string {
  return formatScaledMoney(value, FINANCE_DECIMAL_SCALE, currency, locale);
}

/**
 * Pick one server currency row for a card without combining currencies. The
 * overview has no converted organization-wide amount, so the card must never
 * add or otherwise derive a cross-currency total locally.
 */
function pickFirstCurrencyAmount<T extends { currency: string }>(
  rows: ReadonlyArray<T>,
  getAmount: (row: T) => string,
  include: (row: T) => boolean = () => true,
  positiveOnly = false,
): { amount: bigint; currency: string } {
  for (const row of rows) {
    if (!include(row)) continue;
    const amount = financeDecimalMagnitude(getAmount(row));
    if (positiveOnly ? amount <= ZERO : amount === ZERO) continue;
    return { amount, currency: row.currency };
  }
  return { amount: ZERO, currency: rows[0]?.currency ?? "USD" };
}


export function findTopOverdueCounterparty(
  overview: SettlementOverview,
  currency?: string,
): { counterpartyName: string; currency: string; counterpartyId: string | null } | null {
  const topParty = (overview.by_counterparty ?? []).find(
    (party) =>
      (!currency || party.currency === currency) &&
      financeDecimalMagnitude(party.overdue_receivable) > ZERO,
  );
  if (!topParty) return null;
  return {
    counterpartyName: topParty.counterparty_name?.trim() ?? "",
    currency: topParty.currency,
    // #502: the resolved counterparty master id, when this row has one —
    // lets the overdue-decision-card drill use the stable id too, not just
    // the name string.
    counterpartyId: topParty.counterparty_id ?? null,
  };
}

/** Owner decision cards — five SSOT kinds backed by authoritative server data. */
export function buildSettlementDecisionCards(
  overview: SettlementOverview,
  copy: SettlementDecisionCardsCopy,
  locale?: string,
  profitability?: SettlementProfitabilityDecision | null,
): SettlementDecisionCard[] {
  const cards: SettlementDecisionCard[] = [];
  const overdueLeader = pickFirstCurrencyAmount(
    overview.cells,
    (cell) => cell.total,
    (cell) => cell.bucket === "overdue" && cell.type === "receivable",
    true,
  );
  if (overdueLeader.amount > ZERO) {
    cards.push({
      id: "overdue-ar",
      title: copy.overdueAr.title,
      body: copy.overdueAr.body,
      value: fmtAmt(overdueLeader.amount, overdueLeader.currency, locale),
      tone: "danger",
      href: SETTLEMENT_DRILL_OVERDUE_HREF,
      drill: { section: "overdue", currency: overdueLeader.currency },
    });
  }

  const receivable = pickFirstCurrencyAmount(
    overview.by_currency,
    (row) => row.receivable,
    undefined,
    true,
  );
  if (receivable.amount > ZERO) {
    cards.push({
      id: "receivable",
      title: copy.receivable.title,
      body: copy.receivable.body,
      value: fmtAmt(receivable.amount, receivable.currency, locale),
      tone: "info",
      href: SETTLEMENT_DRILL_RECEIVABLE_HREF,
      drill: { section: "ledger", tab: "receivable" },
    });
  }


  const payable7 = pickFirstCurrencyAmount(
    overview.cells,
    (cell) => cell.total,
    (cell) => cell.bucket === "d0_7" && cell.type === "payable",
    true,
  );
  if (payable7.amount > ZERO) {
    cards.push({
      id: "payable-7",
      title: copy.pay7.title,
      body: copy.pay7.body,
      value: fmtAmt(payable7.amount, payable7.currency, locale),
      tone: "warning",
      href: SETTLEMENT_DRILL_PAYABLE_HREF,
      drill: { section: "ledger", tab: "payable" },
    });
  }

  const net = pickFirstCurrencyAmount(
    overview.by_currency,
    (row) => row.net,
  );
  if (net.amount !== ZERO) {
    cards.push({
      id: "net",
      title: copy.net.title,
      body: copy.net.body,
      value: fmtAmt(net.amount, net.currency, locale),
      tone: net.amount < ZERO ? "warning" : "success",
      href: SETTLEMENT_DRILL_FORECAST_HREF,
      drill: { section: "forecast" },
    });
  }

  if (profitability) {
    cards.push({
      id: "profitability",
      title: copy.profitability.title,
      body: copy.profitability.body,
      value: fmtAmt(profitability.amount, profitability.currency, locale),
      tone: profitability.tone,
      href: SETTLEMENT_DRILL_PROFITABILITY_HREF,
      drill: { section: "profitability" },
    });
  }

  return cards;
}

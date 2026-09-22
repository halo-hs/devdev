// Contract: develop-local@7bc36be0; backend@8f5cfcfd.
import { decimalMagnitude, FINANCE_DECIMAL_SCALE } from "./financeDecimal"
import { formatScaledMoney } from "./money"

export type TradeFinanceFact = {
  deal_id?: string | null
  currency: string
  counterparty_name?: string | null
  assignee_id?: string | null
  assignee_name?: string | null
  /** Confirmed sell-side Commercial Invoice total; not accounting revenue recognition. */
  revenue_amount: string
  /** Confirmed buy-side Commercial Invoice total; not recognized COGS. */
  goods_cost_amount: string
  landed_cost_amount: string
  /** Sell-side CI total less buy-side CI total; an invoice-basis spread. */
  gross_profit_amount: string
  gross_profit_pct?: string | null
  /** Invoice spread less recorded additive deal costs; not statutory profit. */
  adjusted_gp_amount: string
  adjusted_gp_pct?: string | null
  receivable_amount: string
  payable_amount: string
  receivable_current_target_amount: string
  payable_current_target_amount: string
  receivable_applied_amount: string
  payable_applied_amount: string
  receivable_outstanding_amount: string
  payable_outstanding_amount: string
  /** @deprecated Compatibility sum; never use where cash direction matters. */
  paid_amount: string
  /** @deprecated Compatibility sum; never use where AR/AP direction matters. */
  outstanding_amount: string
  due_date?: string | null
  latest_value_date?: string | null
  data_quality: "confirmed" | "partial" | "needs_review" | string
  handoff_ready: boolean
  handoff_blockers: string[]
  source_document_numbers?: string[]
}

export function exactFinanceMoney(
  value: string | null | undefined,
  currency: string
) {
  if (!/^[A-Z]{3}$/.test(currency)) return "—"
  const amount = decimalMagnitude(value, FINANCE_DECIMAL_SCALE)
  return amount === null
    ? "—"
    : formatScaledMoney(amount, FINANCE_DECIMAL_SCALE, currency, "en-US")
}

export function presentFinanceFact(
  fact: Partial<TradeFinanceFact> & Pick<TradeFinanceFact, "currency">
) {
  const blockers = new Set(fact.handoff_blockers ?? [])
  const invoiceUnavailable =
    blockers.has("missing_invoice_basis") ||
    blockers.has("invalid_invoice_basis")
  const costUnavailable =
    invoiceUnavailable || blockers.has("missing_cost_basis")
  const moneyUnavailable =
    blockers.has("missing_money") || blockers.has("missing_payment_schedule")
  const display = (value: string | null | undefined, unavailable = false) =>
    unavailable ? "—" : exactFinanceMoney(value, fact.currency)
  return {
    invoiceSales: display(fact.revenue_amount, invoiceUnavailable),
    invoicePurchases: display(fact.goods_cost_amount, costUnavailable),
    tradeResult: display(fact.gross_profit_amount, costUnavailable),
    adjustedResult: display(fact.adjusted_gp_amount, costUnavailable),
    costs: display(fact.landed_cost_amount),
    receivable: display(fact.receivable_outstanding_amount, moneyUnavailable),
    payable: display(fact.payable_outstanding_amount, moneyUnavailable),
    received: display(fact.receivable_applied_amount, moneyUnavailable),
    paid: display(fact.payable_applied_amount, moneyUnavailable),
  }
}

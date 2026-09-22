import { statusPreviewFinance } from "./deal-status-fixtures"
import {
  bankScheduleFixtures,
  currentBankSchedules,
  readBankCashRecords,
} from "./erp-document-workflow"
import {
  decimalMagnitude,
  roundedPercentage,
  FINANCE_DECIMAL_SCALE as SCALE,
} from "./financeDecimal"
import { formatScaledDecimal } from "./money"
import type { TradeFinanceFact } from "./erp-finance"

export type DealCost = {
  id: string
  type: string
  amount: string
  currency: string
  basis: "additive" | "already_in_price"
  note: string
  source: string
}
export type FinanceFact = Partial<TradeFinanceFact> &
  Pick<TradeFinanceFact, "currency">
export const costCurrencies = ["USD", "KRW", "EUR", "JPY", "CNY"] as const
export const costTypes = [
  "운임",
  "관세",
  "보험",
  "은행수수료",
  "내륙운송",
  "하역",
  "검사",
  "체선료",
  "기타",
]
export const costStorageKey = (dealId: string) =>
  `ecoya-deal-costs-v1:${dealId}`
export const costChangeEvent = "ecoya-deal-costs-changed"

// Shared explicit demo invoice facts. Missing facts stay unknown.
export function baseFinanceFacts(dealId: string): FinanceFact[] {
  if (statusPreviewFinance[dealId]) return statusPreviewFinance[dealId].map((fact) => ({ ...fact }))
  return dealId === "DL-260708-01"
    ? [
        {
          currency: "USD",
          revenue_amount: "2566000",
          goods_cost_amount: "2400000",
          gross_profit_amount: "166000",
          handoff_blockers: ["missing_payment_schedule"],
        },
        {
          currency: "EUR",
          goods_cost_amount: "18000",
          handoff_blockers: ["missing_payment_schedule"],
        },
      ]
    : []
}
export function initialDealCosts(dealId: string): DealCost[] {
  return dealId === "DL-260708-01"
    ? [
        {
          id: "freight-1",
          type: "운임",
          amount: "48000",
          currency: "USD",
          basis: "additive",
          note: "해상 운임",
          source: "CI-2607-003",
        },
        {
          id: "insurance-1",
          type: "보험",
          amount: "6200",
          currency: "USD",
          basis: "already_in_price",
          note: "110% 부보",
          source: "수동 입력",
        },
      ]
    : []
}
export function isValidCostAmount(amount: string) {
  return /^\d{1,16}(?:\.\d{1,2})?$/.test(amount.trim())
}
export function validDealCost(cost: DealCost) {
  return (
    Boolean(cost.id) &&
    costTypes.includes(cost.type) &&
    isValidCostAmount(cost.amount) &&
    (costCurrencies as readonly string[]).includes(cost.currency) &&
    ["additive", "already_in_price"].includes(cost.basis) &&
    typeof cost.note === "string" &&
    cost.note.length <= 2000 &&
    typeof cost.source === "string"
  )
}
export function readDealCosts(dealId: string): DealCost[] {
  try {
    const raw = localStorage.getItem(costStorageKey(dealId))
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw)
      if (
        Array.isArray(parsed) &&
        parsed.every((item) => item && validDealCost(item))
      )
        return parsed
    }
  } catch {
    /* Invalid old preview data falls back to the demo seed. */
  }
  return initialDealCosts(dealId)
}
export function writeDealCosts(dealId: string, costs: DealCost[]) {
  if (!costs.every(validDealCost))
    throw new Error("원가의 금액·통화·메모를 확인해주세요.")
  localStorage.setItem(costStorageKey(dealId), JSON.stringify(costs))
  window.dispatchEvent(new CustomEvent(costChangeEvent, { detail: dealId }))
}
export function calculateDealFinance(
  dealId: string,
  costs: DealCost[]
): FinanceFact[] {
  const facts = baseFinanceFacts(dealId)
  const schedules = currentBankSchedules().filter(
    (schedule) => schedule.dealId === dealId
  )
  const cash = readBankCashRecords()
  const currencies = [
    ...new Set([
      ...facts.map((f) => f.currency),
      ...costs.map((c) => c.currency),
      ...schedules.map((schedule) => schedule.currency),
    ]),
  ]
  return currencies.map((currency) => {
    const fact = facts.find((f) => f.currency === currency) ?? { currency }
    const additive = costs
      .filter((c) => c.currency === currency && c.basis === "additive")
      .reduce(
        (sum, c) => sum + (decimalMagnitude(c.amount, SCALE) ?? BigInt(0)),
        BigInt(0)
      )
    const sales = decimalMagnitude(fact.revenue_amount, SCALE)
    const purchases = decimalMagnitude(fact.goods_cost_amount, SCALE)
    const spread =
      sales !== null && purchases !== null ? sales - purchases : null
    // Ungrouped decimal strings remain exact when passed through the contract.
    const raw = (value: bigint) =>
      formatScaledDecimal(value, SCALE).replaceAll(",", "")
    const position: Partial<FinanceFact> = {}
    for (const direction of ["receivable", "payable"] as const) {
      const matching = schedules.filter(
        (schedule) =>
          schedule.currency === currency && schedule.direction === direction
      )
      if (!matching.length) continue
      const applied = cash
        .filter(
          (record) =>
            record.currency === currency &&
            matching.some((schedule) => schedule.id === record.scheduleId)
        )
        .reduce(
          (sum, record) =>
            sum + (decimalMagnitude(record.amount, SCALE) ?? BigInt(0)),
          BigInt(0)
        )
      const target = matching.reduce(
        (sum, schedule) =>
          sum +
          (decimalMagnitude(
            bankScheduleFixtures.find((item) => item.id === schedule.id)
              ?.outstanding,
            SCALE
          ) ?? BigInt(0)),
        BigInt(0)
      )
      position[`${direction}_applied_amount`] = raw(applied)
      position[`${direction}_outstanding_amount`] = raw(target - applied)
      position[`${direction}_current_target_amount`] = raw(target)
    }
    return {
      ...fact,
      ...position,
      handoff_blockers: Object.keys(position).length
        ? fact.handoff_blockers?.filter(
            (blocker) => blocker !== "missing_payment_schedule"
          )
        : fact.handoff_blockers,
      landed_cost_amount: raw(additive),
      gross_profit_amount: spread === null ? undefined : raw(spread),
      adjusted_gp_amount: spread === null ? undefined : raw(spread - additive),
      adjusted_gp_pct:
        spread === null || sales === null || sales <= BigInt(0)
          ? null
          : formatScaledDecimal(
              roundedPercentage(spread - additive, sales)!,
              BigInt(10)
            ),
    }
  })
}
export function referenceAmount(dealId: string) {
  // Provenance exists in the detail's document fixtures only for this deal.
  return dealId === "DL-260708-01"
    ? {
        amount: "2400000",
        currency: "USD",
        document: "PO-260704-18.pdf",
        type: "PO",
        state: "확정",
      }
    : null
}
export function csvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return `"${safe.replaceAll('"', '""')}"`
}

export function orderProgress(dealId: string) {
  return dealId === "DL-260708-01"
    ? {
        contracted: "20",
        shipped: "16",
        remaining: "4",
        unit: "MT",
        state: "이행 중",
      }
    : null
}

export type FinanceFilters = {
  currency: string
  result: string
  balance: string
}
export const defaultFinanceFilters: FinanceFilters = {
  currency: "all",
  result: "all",
  balance: "all",
}
export function filteredFinanceFacts(
  dealId: string,
  fallbackCurrency: string,
  filters: FinanceFilters
): FinanceFact[] {
  const facts = calculateDealFinance(dealId, readDealCosts(dealId))
  return (facts.length ? facts : [{ currency: fallbackCurrency }]).filter(
    (fact) => {
      if (filters.currency !== "all" && filters.currency !== fact.currency)
        return false
      const result = decimalMagnitude(fact.adjusted_gp_amount, SCALE)
      if (
        filters.result === "positive" &&
        (result === null || result <= BigInt(0))
      )
        return false
      if (
        filters.result === "negative" &&
        (result === null || result >= BigInt(0))
      )
        return false
      if (filters.result === "unknown" && result !== null) return false
      const ar = decimalMagnitude(fact.receivable_outstanding_amount, SCALE)
      const ap = decimalMagnitude(fact.payable_outstanding_amount, SCALE)
      if (filters.balance === "receivable" && (ar === null || ar <= BigInt(0)))
        return false
      if (filters.balance === "payable" && (ap === null || ap <= BigInt(0)))
        return false
      if (filters.balance === "clear" && (ar !== BigInt(0) || ap !== BigInt(0)))
        return false
      if (filters.balance === "unknown" && ar !== null && ap !== null)
        return false
      return true
    }
  )
}

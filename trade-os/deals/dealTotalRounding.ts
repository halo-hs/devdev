import { useMemo, useSyncExternalStore } from "react"
import { deals } from "@trade-os/lib/prototypeDeals"
import { prototypeBackend } from "@trade-os/lib/prototypeBackend"
import {
  currencyFractionDigits,
  normalizeDecimalInput,
} from "@trade-os/lib/money"

export const totalRoundingLabels = {
  round: "반올림",
  truncate: "절사",
} as const

export type TotalRounding = keyof typeof totalRoundingLabels

// Each amount keeps its own 반올림/절사 choice: "total" is the deal total,
// "item:<id>" a line item's 금액, "ci:<documentId>" a CI's 금액.
const roundingKey = (dealId: string, scope: string) =>
  scope === "total"
    ? `ecoya:deal-total-rounding:${dealId}`
    : `ecoya:deal-total-rounding:${dealId}:${scope}`

let roundingVersion = 0
const roundingListeners = new Set<() => void>()
const subscribeRounding = (listener: () => void) => {
  roundingListeners.add(listener)
  return () => {
    roundingListeners.delete(listener)
  }
}

/** Reads each amount's rounding choice; re-renders the caller when any choice changes. */
export function useAmountRoundings(dealId: string) {
  const version = useSyncExternalStore(subscribeRounding, () => roundingVersion)
  return useMemo(() => ({
    version,
    read: (scope: string) => readAmountRounding(dealId, scope),
    write: (scope: string, mode: TotalRounding) => writeAmountRounding(dealId, scope, mode),
  }), [dealId, version])
}

export function readAmountRounding(dealId: string, scope: string): TotalRounding {
  try {
    const value = localStorage.getItem(roundingKey(dealId, scope))
    if (value === "truncate" || value === "round") return value
  } catch {
    /* Use the default rounding mode when storage is unavailable. */
  }
  return "round"
}

export function writeAmountRounding(dealId: string, scope: string, mode: TotalRounding) {
  const key = roundingKey(dealId, scope)
  if (mode === "round") localStorage.removeItem(key)
  else localStorage.setItem(key, mode)
  roundingVersion += 1
  roundingListeners.forEach((listener) => listener())
}

export const readTotalRounding = (dealId: string) => readAmountRounding(dealId, "total")
export const writeTotalRounding = (dealId: string, mode: TotalRounding) => writeAmountRounding(dealId, "total", mode)

/** Exact decimal product of two plain numbers ("12", "128,333.333"); "" when either is not a number. */
export function multiplyDecimal(a: string, b: string): string {
  const parse = (raw: string) => /^(-?)(\d*)(?:\.(\d*))?$/.exec(raw.replaceAll(",", "").trim())
  const left = parse(a)
  const right = parse(b)
  if (!left || !right || !(left[2] || left[3]) || !(right[2] || right[3])) return ""
  const digits = (left[3] ?? "").length + (right[3] ?? "").length
  const value = BigInt((left[2] || "0") + (left[3] ?? "")) * BigInt((right[2] || "0") + (right[3] ?? ""))
  const negative = (left[1] === "-") !== (right[1] === "-") && value !== 0n
  const text = value.toString().padStart(digits + 1, "0")
  const whole = text.slice(0, text.length - digits)
  const fraction = digits ? text.slice(-digits).replace(/0+$/, "") : ""
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`
}

export function roundedDealTotal(
  raw: string,
  currency: string,
  mode: TotalRounding
): string {
  if (!currency.trim()) return raw
  const normalized = normalizeDecimalInput(raw)
  const parts = /^(-?)(\d+)(?:\.(\d+))?$/.exec(normalized)
  if (!parts) return raw
  const [, sign, whole, fraction = ""] = parts
  const digits = currencyFractionDigits(currency.trim().toUpperCase())
  const scale = 10n ** BigInt(digits)
  let minor =
    BigInt(whole) * scale +
    BigInt(fraction.slice(0, digits).padEnd(digits, "0") || "0")
  if (mode === "round" && Number(fraction[digits]) >= 5) minor += 1n
  const integer = (minor / scale).toLocaleString("en-US")
  const decimal = digits
    ? "." + (minor % scale).toString().padStart(digits, "0")
    : ""
  return (minor === 0n ? "" : sign) + integer + decimal
}

export function readSettlementBasis(dealId: string | null) {
  if (!dealId) return null
  const deal =
    prototypeBackend.deals.getCreated(dealId) ??
    deals.find((row) => row.id === dealId)
  if (!deal || (deal.direction !== "sales" && deal.direction !== "purchase"))
    return null
  const saved = (field: string) =>
    prototypeBackend.deals.getSavedField(dealId, "field:" + field)
  const currency = (saved("currency") ?? deal.currency).trim().toUpperCase()
  const mode = readTotalRounding(dealId)
  return {
    dealId,
    currency,
    mode,
    type:
      deal.direction === "sales"
        ? ("receivable" as const)
        : ("payable" as const),
    counterparty:
      saved(deal.direction === "sales" ? "buyer" : "seller") ??
      deal.counterparty,
    amount: roundedDealTotal(
      saved("amount_total") ?? deal.amount,
      currency,
      mode
    ),
  }
}

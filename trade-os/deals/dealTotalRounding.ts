import { deals } from "@trade-os/lib/prototypeDeals"
import { prototypeBackend } from "@trade-os/lib/prototypeBackend"
import {
  currencyFractionDigits,
  normalizeDecimalInput,
} from "@trade-os/lib/money"

export const totalRoundingLabels = {
  truncate: "절사",
  round: "반올림",
} as const

export type TotalRounding = keyof typeof totalRoundingLabels

export function readTotalRounding(dealId: string): TotalRounding {
  try {
    const value = localStorage.getItem(`ecoya:deal-total-rounding:${dealId}`)
    if (value === "truncate" || value === "round") return value
  } catch {
    /* Use the default truncation mode when storage is unavailable. */
  }
  return "truncate"
}

export function writeTotalRounding(dealId: string, mode: TotalRounding) {
  const key = `ecoya:deal-total-rounding:${dealId}`
  if (mode === "truncate") localStorage.removeItem(key)
  else localStorage.setItem(key, mode)
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

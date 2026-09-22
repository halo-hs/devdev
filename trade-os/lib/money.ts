/**
 * Normalize a human-typed amount to a canonical dot-decimal string, resolving
 * the thousands/decimal separator by structure — the mirror of the backend's
 * docgen.NormalizeDecimalInput (P1-E, global-rollout-readiness §2-5); the two
 * MUST stay rule-identical or FE previews disagree with server totals:
 *
 *   both . and , present  → the LAST separator is the decimal point
 *                           ("1.234,56" → "1234.56" · "1,234.56" → "1234.56")
 *   one separator repeated → thousands grouping ("1,234,567" → "1234567")
 *   single comma           → grouping ONLY with exactly 3 trailing digits
 *                           ("1,234" → "1234" — en/ko habit; BRL/MXN are 2dp
 *                           so a 3-decimal comma amount cannot be told apart
 *                           without a locale). Any other length is a decimal:
 *                           1–2 digits ("1,5" → "1.5") and 4+ ("1,2345" →
 *                           "1.2345" — valid grouping comes in threes, and
 *                           the server accepts 4dp fees, so grouping-stripping
 *                           would silently 10000x the amount)
 *   single dot             → decimal, always; multiple dots → grouping
 */
export function normalizeDecimalInput(raw: string): string {
  const s = raw.trim()
  if (s === "") return ""
  const lastComma = s.lastIndexOf(",")
  const lastDot = s.lastIndexOf(".")
  if (lastComma >= 0 && lastDot >= 0) {
    if (lastDot > lastComma) return s.replaceAll(",", "")
    return s.replaceAll(".", "").replace(",", ".")
  }
  if (lastComma >= 0) {
    if (s.indexOf(",") !== lastComma) return s.replaceAll(",", "")
    const frac = s.length - lastComma - 1
    if (frac === 3 || frac === 0) return s.replaceAll(",", "")
    return s.replace(",", ".")
  }
  if (lastDot >= 0 && s.indexOf(".") !== lastDot) return s.replaceAll(".", "")
  return s
}

function toFiniteNumber(
  value: string | number | null | undefined
): number | null {
  // erp-v2-adapt: begin — this repo preserves display affordance in formatMoney.
  if (value === null || value === undefined) return null
  if (typeof value === "string" && value.trim() === "") return null
  // erp-v2-adapt: end

  if (typeof value === "number") return Number.isFinite(value) ? value : null
  const n = Number(normalizeDecimalInput(value))
  return Number.isFinite(n) ? n : null
}

// Decimal-place convention per currency (0 for KRW/JPY/HUF, 3 for BHD/KWD, 2
// for most others) is CLDR data, not just ISO 4217's textbook minor-unit
// table. Intl carries this table — look it up there instead of hand-
// maintaining a full currency list. Falls back to 2 (the common case) for an
// unrecognized/malformed currency code rather than throwing.
//
// One caveat makes a tiny override table necessary: CLDR carries TWO digit
// counts per currency (standard vs cash), and which one Intl reports has
// shifted across ICU versions — HUF is standard-2/cash-0, so one Node
// renders "HUF 1,234" and another "HUF 1,234.00" from identical code. For
// the currencies whose circulating reality diverges from the standard axis
// (no fractional unit in use), pin the cash convention explicitly so display
// is deterministic across browsers/Node ICU builds.
const cashConventionDigits: Record<string, number> = { HUF: 0, ISK: 0, TWD: 2 }

export function currencyFractionDigits(currency: string): number {
  const pinned = cashConventionDigits[currency]
  if (pinned !== undefined) {
    return pinned
  }
  try {
    return (
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }).resolvedOptions().maximumFractionDigits ?? 2
    )
  } catch {
    return 2
  }
}

/**
 * Format a money amount for display, e.g. "USD 1,234.50" or "KRW 1,234,567".
 * Decimal places follow the currency's real-world display convention (0 for
 * KRW/JPY/HUF, 3 for BHD/KWD, 2 for most others) instead of always forcing 2.
 */
export function formatMoney(
  value: string | number | null | undefined,
  currency?: string | null,
  locale = "en-US"
): string {
  const amount = toFiniteNumber(value)
  // erp-v2-adapt: begin — erp-v2 returns 0; local consumers rely on dash for absent/invalid values.
  if (amount === null) {
    return "—"
  }
  // erp-v2-adapt: end
  const digits = currency ? currencyFractionDigits(currency.toUpperCase()) : 2
  let formatted: string
  try {
    formatted = amount.toLocaleString(locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  } catch {
    formatted = amount.toLocaleString("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  }
  return currency ? `${currency} ${formatted}` : formatted
}

/**
 * Format a provider-supplied minor-unit integer amount string — e.g. Paddle
 * transaction `grand_total` (`internal/snap/billing/paddle_invoices.go:42-44`
 * on the backend: "Paddle returns minor units as strings") — into a
 * currency-correct decimal display string. "2499" is $24.99 for a 2-decimal
 * currency (USD/EUR), ₩2,499 for a 0-decimal currency (KRW/JPY), and 2.499
 * for a 3-decimal currency (BHD/KWD): the minor-unit scale is resolved
 * per-currency via currencyFractionDigits (CLDR), never assumed to be 2 — a bare
 * `/100` divide is wrong for any non-2-decimal currency. The conversion
 * never round-trips through a float; formatScaledMoney does exact bigint
 * arithmetic.
 *
 * Returns "—" for a missing/malformed amount (anything that is not a plain
 * optionally-signed integer — in particular an already-decimal string like
 * "24.99" is rejected rather than silently reinterpreted).
 */
export function formatMinorUnitAmount(
  amount: string | null | undefined,
  currency?: string | null,
  locale = "en-US"
): string {
  if (amount == null) return "—"
  const trimmed = amount.trim()
  if (!/^-?\d+$/.test(trimmed)) return "—"
  const digits = currencyFractionDigits((currency ?? "").toUpperCase())
  const scale = BigInt(10) ** BigInt(digits)
  return formatScaledMoney(BigInt(trimmed), scale, currency, locale)
}

type ScaledMoneyLocaleParts = {
  decimal: string
  wholeFormatter: Intl.NumberFormat
}

const scaledMoneyLocalePartsCache = new Map<string, ScaledMoneyLocaleParts>()

function scaledMoneyLocaleParts(tag: string): ScaledMoneyLocaleParts {
  const cached = scaledMoneyLocalePartsCache.get(tag)
  if (cached) return cached

  const wholeFormatter = Intl.NumberFormat(tag, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })
  const decimal =
    Intl.NumberFormat(tag, { minimumFractionDigits: 1 })
      .formatToParts(1.1)
      .find((part) => part.type === "decimal")?.value ?? "."
  const parts = { decimal, wholeFormatter }
  scaledMoneyLocalePartsCache.set(tag, parts)
  return parts
}

/**
 * Format an integer carrying a power-of-ten decimal scale without converting the
 * amount to a JavaScript Number. This is reserved for exact-decimal contracts;
 * ordinary money continues to use the currency-minor-unit formatMoney path.
 */
export function formatScaledMoney(
  value: bigint,
  scale: bigint,
  currency?: string | null,
  locale = "en-US",
  maximumFractionDigits = 4
): string {
  const scaleText = scale.toString()
  if (!/^10*$/.test(scaleText)) return "—"

  const scaleDigits = scaleText.length - 1
  const requestedDigits = Number.isInteger(maximumFractionDigits)
    ? maximumFractionDigits
    : 4
  const digits = Math.max(0, Math.min(requestedDigits, scaleDigits))
  const displayScale = BigInt(`1${"0".repeat(digits)}`)
  const divisor = scale / displayScale
  const negative = value < BigInt(0)
  const absolute = negative ? -value : value
  const rounded = (absolute + divisor / BigInt(2)) / divisor
  const whole = rounded / displayScale
  const minimumDigits = Math.min(
    digits,
    currency ? currencyFractionDigits(currency.toUpperCase()) : 2
  )
  let fraction =
    digits > 0 ? (rounded % displayScale).toString().padStart(digits, "0") : ""
  while (fraction.length > minimumDigits && fraction.endsWith("0")) {
    fraction = fraction.slice(0, -1)
  }

  let parts: ScaledMoneyLocaleParts
  try {
    parts = scaledMoneyLocaleParts(locale)
  } catch {
    parts = scaledMoneyLocaleParts("en-US")
  }
  const wholeText = parts.wholeFormatter.format(whole)

  const sign = negative && rounded !== BigInt(0) ? "-" : ""
  const formatted = fraction
    ? `${sign}${wholeText}${parts.decimal}${fraction}`
    : `${sign}${wholeText}`
  return currency ? `${currency} ${formatted}` : formatted
}

/**
 * Same exact-decimal technique as `formatScaledMoney` — no JS Number
 * round-trip — but without its currency-driven minimum-fraction-digit floor
 * (money always shows >=2 decimals; a bare decimal like an FX rate should
 * trim to its own natural precision instead, so an integer-valued rate
 * doesn't display as if it were a currency amount). Defaults
 * `maximumFractionDigits` to the scale's own digit count, i.e. no truncation
 * unless the caller asks for less — a receipt value should round-trip
 * exactly by default.
 */
export function formatScaledDecimal(
  value: bigint,
  scale: bigint,
  locale = "en-US",
  maximumFractionDigits?: number
): string {
  const scaleText = scale.toString()
  if (!/^10*$/.test(scaleText)) return "—"

  const scaleDigits = scaleText.length - 1
  const requestedDigits =
    maximumFractionDigits != null && Number.isInteger(maximumFractionDigits)
      ? maximumFractionDigits
      : scaleDigits
  const digits = Math.max(0, Math.min(requestedDigits, scaleDigits))
  const displayScale = BigInt(`1${"0".repeat(digits)}`)
  const divisor = scale / displayScale
  const negative = value < BigInt(0)
  const absolute = negative ? -value : value
  const rounded = (absolute + divisor / BigInt(2)) / divisor
  const whole = rounded / displayScale
  let fraction =
    digits > 0 ? (rounded % displayScale).toString().padStart(digits, "0") : ""
  while (fraction.endsWith("0")) {
    fraction = fraction.slice(0, -1)
  }

  let parts: ScaledMoneyLocaleParts
  try {
    parts = scaledMoneyLocaleParts(locale)
  } catch {
    parts = scaledMoneyLocaleParts("en-US")
  }
  const wholeText = parts.wholeFormatter.format(whole)

  const sign = negative && rounded !== BigInt(0) ? "-" : ""
  return fraction
    ? `${sign}${wholeText}${parts.decimal}${fraction}`
    : `${sign}${wholeText}`
}

export function formatNumber(
  value: number,
  locale: string = "en-US",
  options?: Intl.NumberFormatOptions
): string {
  if (!Number.isFinite(value)) return "0"
  try {
    return value.toLocaleString(locale, options)
  } catch {
    return value.toLocaleString("en-US", options)
  }
}

export function formatScaledPct(
  value: bigint,
  scale: bigint,
  locale = "en-US",
  options?: Pick<Intl.NumberFormatOptions, "signDisplay">
): string {
  let parts: ScaledMoneyLocaleParts
  try {
    parts = scaledMoneyLocaleParts(locale)
  } catch {
    parts = scaledMoneyLocaleParts("en-US")
  }

  const maximumFractionDigits = Math.max(0, scale.toString().length - 1)
  let formatted = formatScaledMoney(
    value,
    scale,
    null,
    locale,
    maximumFractionDigits
  )
  const decimalIndex = formatted.lastIndexOf(parts.decimal)
  if (decimalIndex >= 0) {
    while (formatted.endsWith("0")) formatted = formatted.slice(0, -1)
    if (formatted.endsWith(parts.decimal))
      formatted = formatted.slice(0, -parts.decimal.length)
  }

  if (options?.signDisplay === "never" && formatted.startsWith("-")) {
    formatted = formatted.slice(1)
  } else if (
    (options?.signDisplay === "always" && value >= BigInt(0)) ||
    (options?.signDisplay === "exceptZero" && value > BigInt(0))
  ) {
    formatted = `+${formatted}`
  }

  return `${formatted}%`
}

export function formatPermyriadPct(
  permyriad: bigint,
  locale = "en-US",
  options?: Pick<Intl.NumberFormatOptions, "signDisplay">
): string {
  return formatScaledPct(permyriad, BigInt(100), locale, options)
}

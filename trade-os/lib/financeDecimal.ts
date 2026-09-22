const FINANCE_DECIMAL_PATTERN = /^-?[0-9]{1,24}(?:\.[0-9]{1,10})?$/

export const FINANCE_DECIMAL_SCALE = BigInt("10000000000")
const RATIO_PERMYRIAD_DIVISOR = BigInt("1000000")

export type AmountCell = {
  raw: string
  valid: boolean
  scaled: bigint
  approx: number
}

export function isFinanceDecimal(raw: string | null | undefined): boolean {
  return typeof raw === "string" && FINANCE_DECIMAL_PATTERN.test(raw)
}

export function financeDecimalMagnitude(
  raw: string | null | undefined
): bigint {
  const value = String(raw ?? "0")
  if (!FINANCE_DECIMAL_PATTERN.test(value)) return BigInt(0)
  const negative = value.startsWith("-")
  const unsigned = negative ? value.slice(1) : value
  const [whole, fraction = ""] = unsigned.split(".")
  const scaled =
    BigInt(whole) * FINANCE_DECIMAL_SCALE + BigInt(fraction.padEnd(10, "0"))
  return negative ? -scaled : scaled
}

/**
 * Parse a decimal string into a scale-fixed integer without a JS Number
 * round-trip, for exact-decimal contracts whose precision doesn't match
 * `FINANCE_DECIMAL_SCALE` (money is stored/scaled to 10 fractional digits;
 * e.g. an FX rate receipt is `NUMERIC(24,12)` — 12). `scale` must be a power
 * of ten (`10^n`); returns `null` for anything that doesn't parse or an
 * invalid scale, rather than silently truncating.
 */
export function decimalMagnitude(
  raw: string | null | undefined,
  scale: bigint
): bigint | null {
  const scaleText = scale.toString()
  if (!/^10*$/.test(scaleText)) return null
  const scaleDigits = scaleText.length - 1
  const pattern = new RegExp(`^-?[0-9]{1,24}(?:\\.[0-9]{1,${scaleDigits}})?$`)
  const value = String(raw ?? "")
  if (!pattern.test(value)) return null
  const negative = value.startsWith("-")
  const unsigned = negative ? value.slice(1) : value
  const [whole, fraction = ""] = unsigned.split(".")
  const magnitude =
    BigInt(whole) * scale + BigInt(fraction.padEnd(scaleDigits, "0") || "0")
  return negative ? -magnitude : magnitude
}

export function approxDecimal(raw: string | number | null | undefined): number {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0
  const parsed = Number(raw ?? "0")
  return Number.isFinite(parsed) ? parsed : 0
}

export function amountCell(
  raw: string | number | null | undefined
): AmountCell {
  const value =
    typeof raw === "number" && Number.isFinite(raw)
      ? String(raw)
      : String(raw ?? "")
  const valid = isFinanceDecimal(value)
  return {
    raw: value,
    valid,
    scaled: valid ? financeDecimalMagnitude(value) : BigInt(0),
    approx: valid ? approxDecimal(value) : 0,
  }
}

/** Convert a server 0..1 ratio to an exact integer in ten-thousandths. */
export function ratioPermyriad(raw: string | null | undefined): bigint | null {
  if (!isFinanceDecimal(raw)) return null
  const scaled = financeDecimalMagnitude(raw)
  const negative = scaled < BigInt(0)
  const absolute = negative ? -scaled : scaled
  const rounded =
    (absolute + RATIO_PERMYRIAD_DIVISOR / BigInt(2)) / RATIO_PERMYRIAD_DIVISOR
  return negative ? -rounded : rounded
}

export function roundedPercentage(
  numerator: bigint,
  denominator: bigint,
  decimalPlaces = 1
): bigint | null {
  if (
    denominator <= BigInt(0) ||
    !Number.isInteger(decimalPlaces) ||
    decimalPlaces < 0 ||
    decimalPlaces > 6
  ) {
    return null
  }
  const decimalScale = BigInt(10) ** BigInt(decimalPlaces)
  const negative = numerator < BigInt(0)
  const absoluteNumerator = negative ? -numerator : numerator
  const scaledNumerator = absoluteNumerator * BigInt(100) * decimalScale
  const quotient = scaledNumerator / denominator
  const remainder = scaledNumerator % denominator
  const rounded =
    remainder * BigInt(2) >= denominator ? quotient + BigInt(1) : quotient
  return negative ? -rounded : rounded
}

import { normalizeDecimalInput } from "./money"

type Rational = { numerator: bigint; denominator: bigint }

function decimalRational(value: unknown): Rational {
  const normalized = normalizeDecimalInput(String(value ?? ""))
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    return { numerator: BigInt(0), denominator: BigInt(1) }
  }
  const negative = normalized.startsWith("-")
  const unsigned = negative ? normalized.slice(1) : normalized
  const [whole, fraction = ""] = unsigned.split(".")
  const denominator = BigInt(10) ** BigInt(fraction.length)
  const numerator =
    BigInt(`${whole}${fraction}` || "0") * (negative ? BigInt(-1) : BigInt(1))
  return { numerator, denominator }
}

function add(left: Rational, right: Rational): Rational {
  return {
    numerator:
      left.numerator * right.denominator + right.numerator * left.denominator,
    denominator: left.denominator * right.denominator,
  }
}

function multiply(left: Rational, right: Rational): Rational {
  return {
    numerator: left.numerator * right.numerator,
    denominator: left.denominator * right.denominator,
  }
}

function negate(value: Rational): Rational {
  return { numerator: -value.numerator, denominator: value.denominator }
}

function roundMoney(value: Rational): string {
  const scaled = value.numerator * BigInt(100)
  const negative = scaled < BigInt(0)
  const absolute = negative ? -scaled : scaled
  let cents = absolute / value.denominator
  const remainder = absolute % value.denominator
  if (remainder * BigInt(2) >= value.denominator) cents += BigInt(1)
  const digits = cents.toString().padStart(3, "0")
  const sign = negative && cents !== BigInt(0) ? "-" : ""
  return `${sign}${digits.slice(0, -2)}.${digits.slice(-2)}`
}

export function exactLineItemAmount(
  quantity: unknown,
  unitPrice: unknown
): string {
  return roundMoney(
    multiply(decimalRational(quantity), decimalRational(unitPrice))
  )
}

export function exactDocumentMoneyTotals(
  rows: Record<string, unknown>[],
  charges: {
    freightCharge?: unknown
    insuranceCharge?: unknown
    discount?: unknown
  }
): { subtotal: string; grandTotal: string } {
  const subtotal = rows.reduce<Rational>(
    (sum, row) =>
      add(
        sum,
        decimalRational(exactLineItemAmount(row.quantity, row.unit_price))
      ),
    { numerator: BigInt(0), denominator: BigInt(1) }
  )
  const grandTotal = add(
    add(
      add(subtotal, decimalRational(charges.freightCharge)),
      decimalRational(charges.insuranceCharge)
    ),
    negate(decimalRational(charges.discount))
  )
  return { subtotal: roundMoney(subtotal), grandTotal: roundMoney(grandTotal) }
}

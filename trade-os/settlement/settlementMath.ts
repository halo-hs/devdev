const ZERO = BigInt(0);

// SSOT 05-settlement.md:192 rounds 조정 매출총이익률 to two decimals. Keep
// both operands exact through signed half-away-from-zero rounding to basis
// points; bigint division alone truncates 2/3 to 66.66 instead of 66.67.
export function marginPercent(row: {
  adjustedGp: bigint;
  revenue: bigint;
}): number | null {
  if (row.revenue <= ZERO) return null;
  const negative = row.adjustedGp < ZERO;
  const absoluteNumerator =
    (negative ? -row.adjustedGp : row.adjustedGp) * BigInt(10000);
  const quotient = absoluteNumerator / row.revenue;
  const remainder = absoluteNumerator % row.revenue;
  const rounded = remainder * BigInt(2) >= row.revenue
    ? quotient + BigInt(1)
    : quotient;
  return Number(negative ? -rounded : rounded) / 100;
}

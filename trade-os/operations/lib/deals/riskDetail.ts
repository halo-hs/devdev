import { decimalMagnitude, FINANCE_DECIMAL_SCALE } from "@trade-os/operations/lib/financeDecimal";
import { formatScaledDecimal } from "@trade-os/operations/lib/money";

// FE #1937 item 5 — temporary until BE #2269 (structured detail fields). The risk feed's `detail` is a
// server-built English free sentence (BE risk_detail.go:202-214, deals.go scheduleDelayDelta /
// qtyMismatchDelta). Only the numeric-difference shapes are shown, as i18n text:
//   "+3d" / "-2d"  → days ("3일 지연" / "2일 빠름"; ICU plural in en "1 day late" / "2 days late")
//   "+0d" / "-0d"  → hidden: a zero-day difference says nothing the conflicting dates do not
//                    (BE floors the hours, so "+0d" is "late by under a day"; "0일 지연" would mislead)
//   "+10" / "-2.5" → a signed number in the page format ("+10"), under the existing 차이 label
// Every other shape ("due 2026-09-20", "PO 12.5 vs CI 13") is hidden: the conflicting fields above
// already show the same values.
// FE #1970: moved here from the deal detail (dealDetailFormat.ts) so the home 경영 브리프 and the monitor
// 예외 센터 use the same rule on the same feed value. Each screen passes its own messages.
const RISK_DETAIL_NUMERIC = /^[+-]?\d+(\.\d+)?d?$/;

export type RiskDetailText = { kind: "days" | "delta"; text: string };
// Formats detail.view.risk.detailDaysLate/detailDaysEarly (ICU messages with a `days` plural argument).
export type RiskDetailDaysFormatter = (key: "detailDaysEarly" | "detailDaysLate", days: number) => string;

export function riskDetailText(
  detail: string | null | undefined,
  formatDays: RiskDetailDaysFormatter,
  locale: string,
): RiskDetailText | null {
  const text = detail?.trim();
  if (!text || !RISK_DETAIL_NUMERIC.test(text)) return null;
  const negative = text.startsWith("-");
  const unsigned = text.replace(/^[+-]/, "");
  if (unsigned.endsWith("d")) {
    const days = Number(unsigned.slice(0, -1));
    if (!Number.isFinite(days) || days === 0) return null;
    return { kind: "days", text: formatDays(negative ? "detailDaysEarly" : "detailDaysLate", days) };
  }
  const magnitude = decimalMagnitude(unsigned, FINANCE_DECIMAL_SCALE);
  if (magnitude === null) return null;
  const formatted = formatScaledDecimal(magnitude, FINANCE_DECIMAL_SCALE, locale);
  const isZero = magnitude === BigInt(0);
  return { kind: "delta", text: isZero ? formatted : `${negative ? "-" : "+"}${formatted}` };
}

export type RiskDetailLineOptions = {
  formatDays: RiskDetailDaysFormatter;
  locale: string;
  /** The deal detail's 차이 label (detail.view.risk.difference), in front of a signed number. */
  differenceLabel: string;
};

/**
 * FE #1970: the one line a summary screen shows for a risk `detail` — the days sentence ("3일 지연"), or
 * the 차이 label with the signed number ("차이 +10"), the same text the deal detail's risk card shows.
 * Every hidden shape (non-numeric, zero days, empty) is null: the screen then shows no detail at all.
 */
export function riskDetailLine(
  detail: string | null | undefined,
  { formatDays, locale, differenceLabel }: RiskDetailLineOptions,
): string | null {
  const text = riskDetailText(detail, formatDays, locale);
  if (!text) return null;
  return text.kind === "delta" ? `${differenceLabel} ${text.text}` : text.text;
}

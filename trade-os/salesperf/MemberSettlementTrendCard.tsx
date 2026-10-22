"use client";

import { PlanActualBarChart } from "@trade-os/reports/charts/PlanActualBarChart";
import { ReportCard } from "@trade-os/reports/ReportsConnected";
import type { AmountCell } from "@trade-os/lib/financeDecimal";
import type { SeriesPointView } from "@trade-os/reports/reportsData";

import type { SalesPerfCopy } from "./SalesPerformanceConnected";

function replaceTokens(template: string, tokens: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(tokens)) out = out.replaceAll(`{${key}}`, value);
  return out;
}

export function MemberSettlementTrendCard({
  copy,
  currencyLabel,
  points,
  fmtAmount,
  fmtCompact,
  axisLabel,
  yearMonth,
}: {
  copy: SalesPerfCopy;
  currencyLabel: string;
  points: SeriesPointView[];
  fmtAmount: (value: AmountCell, currency?: string | null) => string;
  fmtCompact: (value: number) => string;
  axisLabel: (value: string) => string;
  yearMonth: (value: string) => string;
}) {
  const trendCopy = copy.memberTrend;
  return (
    <div data-ui="salesperf-member-trend">
      <ReportCard
        title={trendCopy.title}
        sub={replaceTokens(trendCopy.sub, { currency: currencyLabel })}
      >
        <div className="mb-3 flex flex-wrap gap-4 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-4)]" aria-label={trendCopy.title}>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-2.5 rounded-[3px] bg-[var(--color-primary-4)]" />
            {trendCopy.planned}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-2.5 w-2.5 rounded-[3px] bg-[var(--color-primary-8)]" />
            {trendCopy.received}
          </span>
        </div>
        <PlanActualBarChart
          ariaLabel={trendCopy.aria}
          formatAxisValue={fmtCompact}
          points={points.map((point) => ({
            key: point.periodStart,
            xLabel: axisLabel(point.periodStart),
            planned: point.planned.approx,
            received: point.received.approx,
            tooltip: (
              <div className="grid gap-1 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)]">
                <strong>{yearMonth(point.periodStart)}</strong>
                <span>{trendCopy.planned} {fmtAmount(point.planned)} {currencyLabel}</span>
                <span>{trendCopy.received} {fmtAmount(point.received)} {currencyLabel}</span>
              </div>
            ),
          }))}
        />
      </ReportCard>
    </div>
  );
}

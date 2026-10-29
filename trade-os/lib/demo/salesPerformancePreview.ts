import type { AssigneeGPResponse, GPSeriesResponse, SettlementSeriesResponse } from "../api/reports";

// Synthetic chart data for the sales-performance demo only. Month-based values
// remain identical when switching between 3/6/12-month windows.
const currencies = ["USD", "EUR", "KRW"];
const waves = [0.82, 0.96, 0.91, 1.12, 1.04, 1.18, 1.09, 1.25, 1.14, 1.32, 1.21, 1.4];
function monthlyValues(start: string, currency: string) {
  const month = Number(start.slice(5, 7)) - 1;
  const base = currency === "KRW" ? 420_000_000 : currency === "EUR" ? 360_000 : 480_000;
  const revenue = Math.round(base * waves[month]);
  // Each trailing 3/6/12-month demo window includes profit, loss and break-even.
  const margin = [1450, -520, 0, 1860, -740, 0, -600, 0, 1530, 2230, -410, 0][month];
  return { revenue, gp: Math.round(revenue * margin / 10000), margin, deals: 7 + month % 6 };
}
const money = (value: number) => value.toFixed(4);

export function salesPerformancePreview(key: string, body: unknown): unknown {
  const result = structuredClone(body);
  if (key === "gp") {
    const gp = result as GPSeriesResponse;
    gp.periods = gp.periods.map(period => ({
      ...period,
      by_currency: currencies.map(currency => {
        const values = monthlyValues(period.period_start, currency);
        return { currency, revenue: money(values.revenue), gp: money(values.gp), margin: money(values.margin / 10000), deal_count: values.deals, zero_cost_deal_count: 0 };
      }),
    }));
  } else if (key === "series") {
    const series = result as SettlementSeriesResponse;
    series.periods = series.periods.map(period => ({
      ...period,
      by_currency: currencies.map(currency => {
        const values = monthlyValues(period.period_start, currency);
        return {
          currency, receivable_due: money(values.revenue), received: money(Math.round(values.revenue * 0.78)),
          payable_due: money(values.revenue - values.gp), paid_out: money(Math.round((values.revenue - values.gp) * 0.86)),
          receivable_outstanding_end: money(Math.round(values.revenue * 0.22)), payable_outstanding_end: money(Math.round((values.revenue - values.gp) * 0.14)),
          overdue_receivable_end: money(Math.round(values.revenue * 0.08)), overdue_rate_end: "0.3636", overdue_rate_status: "available" as const,
        };
      }),
    }));
  }
  return result;
}

export function salesPerformanceRanking(gp: GPSeriesResponse, original: unknown): AssigneeGPResponse {
  const result = structuredClone(original) as AssigneeGPResponse;
  result.items = currencies.flatMap(currency => {
    const rows = gp.periods.flatMap(p => p.by_currency.filter(row => row.currency === currency));
    const revenue = rows.reduce((sum, row) => sum + Number(row.revenue), 0);
    const grossProfit = rows.reduce((sum, row) => sum + Number(row.gp), 0);
    const deals = rows.reduce((sum, row) => sum + (row.deal_count ?? 0), 0);
    return [0.7, 0.3].map((share, index) => {
      const shareRevenue = Math.round(revenue * share), shareGp = Math.round(grossProfit * share);
      return { assignee_user_id: index === 0 ? "940ff121-2c36-58fa-9c13-05870353ce22" : null, currency,
        revenue: money(shareRevenue), gp: money(shareGp), margin: money(shareGp / shareRevenue), deal_count: index === 0 ? Math.round(deals * share) : deals - Math.round(deals * 0.7) };
    });
  });
  return result;
}

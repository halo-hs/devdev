import type { TooltipState } from "./useChartTooltip"

export function ChartTooltip({ tooltip, width }: { tooltip: TooltipState; width: number }) {
  if (!tooltip) return null;
  const flip = tooltip.x > width * 0.62;
  return (
    <div
      aria-hidden
      data-ui="report-chart-tooltip"
      className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg bg-[var(--color-gray-2)] px-2.5 py-1.5 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] leading-normal text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] tabular-nums"
      style={{
        left: flip ? undefined : Math.max(0, tooltip.x + 14),
        right: flip ? Math.max(0, width - tooltip.x + 14) : undefined,
        top: tooltip.y + 14,
      }}
    >
      {tooltip.content}
    </div>
  );
}

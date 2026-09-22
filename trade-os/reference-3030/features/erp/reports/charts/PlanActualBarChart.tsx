"use client";

import type { ReactNode } from "react";

import { ChartTooltip, useChartTooltip } from "./ChartTooltip";
import { innerSize, XLabels, YGrid } from "./chartFrame";
import { barPathTop, CHART_COLORS, CHART_PAD, makeTicks, niceCeil } from "./chartGeometry";
import { useMeasuredWidth } from "./useMeasuredWidth";

export type PlanActualPoint = {
  key: string;
  xLabel: string;
  planned: number;
  received: number;
  tooltip: ReactNode;
};

/**
 * 수취 계획 vs AR 적용액 — 그룹 막대(계획 = 연한 블루 스텝, 적용 = 솔리드 블루),
 * 4px 라운드 탑 + 쌍 사이 2px 갭 (시안 renderA 이식).
 */
export function PlanActualBarChart({
  points,
  height = 240,
  ariaLabel,
  formatAxisValue,
}: {
  points: PlanActualPoint[];
  height?: number;
  ariaLabel: string;
  formatAxisValue: (v: number) => string;
}) {
  const { ref, width } = useMeasuredWidth<HTMLDivElement>();
  const { tooltip, show, hide } = useChartTooltip();

  const { iw, ih } = innerSize(width, height);
  const n = points.length;
  const maxV = niceCeil(Math.max(0, ...points.map((p) => Math.max(p.planned, p.received))));
  const ticks = makeTicks(maxV, 4);
  const slot = n > 0 ? iw / n : iw;
  const bw = Math.max(2, Math.min(11, (slot - 10) / 2));

  return (
    <div ref={ref} className="relative" data-chart-wrap data-component="PlanActualBarChart">
      <svg width="100%" height={height} role="img" aria-label={ariaLabel}>
        <YGrid ticks={ticks} maxV={maxV} width={width} height={height} format={formatAxisValue} />
        {points.map((p, i) => {
          const x0 = CHART_PAD.l + i * slot + slot / 2;
          const bars: Array<[number, string, number]> = [
            [p.planned, CHART_COLORS.planned, -bw - 1],
            [p.received, CHART_COLORS.blue, 1],
          ];
          return (
            <g key={p.key}>
              {bars.map(([value, color, dx], b) => {
                const h = maxV > 0 ? (Math.max(0, value) / maxV) * ih : 0;
                const y = CHART_PAD.t + ih - h;
                return <path key={b} d={barPathTop(x0 + dx, y, bw, h, 4)} fill={color} />;
              })}
              <rect
                x={CHART_PAD.l + i * slot}
                y={CHART_PAD.t}
                width={slot}
                height={ih}
                fill="transparent"
                onMouseMove={(event) => show(event, p.tooltip)}
                onMouseLeave={hide}
              />
            </g>
          );
        })}
        <XLabels labels={points.map((p) => p.xLabel)} width={width} height={height} mode="band" />
      </svg>
      <ChartTooltip tooltip={tooltip} width={width} />
    </div>
  );
}

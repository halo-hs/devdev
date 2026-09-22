"use client";

import { useState, type ReactNode } from "react";

import { ChartTooltip, useChartTooltip } from "./ChartTooltip";
import { innerSize, XLabels, YGrid } from "./chartFrame";
import { CHART_COLORS, CHART_PAD, linePath, makeTicks, niceCeil } from "./chartGeometry";
import { useMeasuredWidth } from "./useMeasuredWidth";

export type BalancePoint = {
  key: string;
  xLabel: string;
  receivable: number;
  payable: number;
  tooltip: ReactNode;
};

/**
 * 기말 잔액 추세 — 미수(블루)·미지급(오렌지) 2px 라인, 끝점 서페이스 링 마커
 * + 끝값 라벨, 호버 크로스헤어 (시안 renderB 이식).
 */
export function BalanceLineChart({
  points,
  height = 220,
  ariaLabel,
  formatAxisValue,
  formatEndLabel,
}: {
  points: BalancePoint[];
  height?: number;
  ariaLabel: string;
  formatAxisValue: (v: number) => string;
  formatEndLabel: (v: number) => string;
}) {
  const { ref, width } = useMeasuredWidth<HTMLDivElement>();
  const { tooltip, show, hide } = useChartTooltip();
  const [crossIndex, setCrossIndex] = useState<number | null>(null);

  const { iw, ih } = innerSize(width, height);
  const n = points.length;
  const maxV = niceCeil(
    Math.max(0, ...points.map((p) => Math.max(p.receivable, p.payable))),
  );
  const ticks = makeTicks(maxV, 4);
  const step = n > 1 ? iw / (n - 1) : 0;
  const xAt = (i: number) => (n > 1 ? CHART_PAD.l + i * step : CHART_PAD.l + iw / 2);
  const yAt = (v: number) => CHART_PAD.t + ih - (maxV > 0 ? (v / maxV) * ih : 0);

  const series: Array<{ id: string; values: number[]; color: string }> = [
    { id: "receivable", values: points.map((p) => p.receivable), color: CHART_COLORS.blue },
    { id: "payable", values: points.map((p) => p.payable), color: CHART_COLORS.orange },
  ];

  const handleMove = (event: React.MouseEvent<SVGRectElement>) => {
    if (n === 0) return;
    const svg = event.currentTarget.ownerSVGElement;
    const rect = svg?.getBoundingClientRect();
    const localX = rect ? event.clientX - rect.left - CHART_PAD.l : 0;
    const i = Math.max(0, Math.min(n - 1, step > 0 ? Math.round(localX / step) : 0));
    setCrossIndex(i);
    show(event, points[i].tooltip);
  };

  return (
    <div ref={ref} className="relative" data-chart-wrap data-component="BalanceLineChart">
      <svg width="100%" height={height} role="img" aria-label={ariaLabel}>
        <YGrid ticks={ticks} maxV={maxV} width={width} height={height} format={formatAxisValue} />
        {crossIndex != null && n > 0 ? (
          <line
            x1={xAt(crossIndex)}
            x2={xAt(crossIndex)}
            y1={CHART_PAD.t}
            y2={CHART_PAD.t + ih}
            stroke={CHART_COLORS.gridStrong}
            strokeWidth={1}
          />
        ) : null}
        {series.map((s) => {
          if (n === 0) return null;
          const pts = s.values.map((v, i) => [xAt(i), yAt(v)] as const);
          const last = pts[pts.length - 1];
          return (
            <g key={s.id} data-series={s.id}>
              <path
                d={linePath(pts)}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <circle cx={last[0]} cy={last[1]} r={6} fill={CHART_COLORS.surface} />
              <circle cx={last[0]} cy={last[1]} r={4} fill={s.color} />
              <text
                x={last[0] - 4}
                y={Math.max(CHART_PAD.t, last[1] - 9)}
                textAnchor="end"
                fontSize="var(--text-body-10)"
                fontWeight={600}
                fill={CHART_COLORS.labelText}
              >
                {formatEndLabel(s.values[n - 1])}
              </text>
            </g>
          );
        })}
        <rect
          x={CHART_PAD.l}
          y={CHART_PAD.t}
          width={iw}
          height={ih}
          fill="transparent"
          onMouseMove={handleMove}
          onMouseLeave={() => {
            setCrossIndex(null);
            hide();
          }}
        />
        <XLabels labels={points.map((p) => p.xLabel)} width={width} height={height} mode="point" />
      </svg>
      <ChartTooltip tooltip={tooltip} width={width} />
    </div>
  );
}

"use client";

import type { ReactNode } from "react";

import { ChartTooltip, useChartTooltip } from "./ChartTooltip";
import { innerSize, XLabels, YGrid } from "./chartFrame";
import { CHART_COLORS, CHART_PAD, linePath, makeTicks, niceCeil } from "./chartGeometry";
import { useMeasuredWidth } from "./useMeasuredWidth";

export type RatePoint = {
  key: string;
  xLabel: string;
  /** 퍼센트 스케일(18.2 = 18.2%). */
  rate: number;
  tooltip: ReactNode;
};

/**
 * 연체율 — 단일 리스크 레드 라인 + 10% 워시, 끝점 마커·라벨, 범례 없음
 * (타이틀이 정체성 전달 — 시안 renderC 이식).
 */
export function OverdueRateChart({
  points,
  height = 140,
  ariaLabel,
  formatAxisValue,
  formatEndLabel,
  emptyMessage,
}: {
  points: RatePoint[];
  height?: number;
  ariaLabel: string;
  formatAxisValue: (v: number) => string;
  formatEndLabel: (v: number) => string;
  emptyMessage?: ReactNode;
}) {
  const { ref, width } = useMeasuredWidth<HTMLDivElement>();
  const { tooltip, show, hide } = useChartTooltip();

  const { iw, ih } = innerSize(width, height);
  const n = points.length;
  const maxV = niceCeil(Math.max(0, ...points.map((p) => p.rate)));
  const ticks = makeTicks(maxV, 2);
  const step = n > 1 ? iw / (n - 1) : 0;
  const xAt = (i: number) => (n > 1 ? CHART_PAD.l + i * step : CHART_PAD.l + iw / 2);
  const yAt = (v: number) => CHART_PAD.t + ih - (maxV > 0 ? (v / maxV) * ih : 0);

  const pts = points.map((p, i) => [xAt(i), yAt(p.rate)] as const);
  const line = linePath(pts);
  const area =
    n > 0
      ? `${line} L${pts[n - 1][0]} ${CHART_PAD.t + ih} L${pts[0][0]} ${CHART_PAD.t + ih} Z`
      : "";
  const last = n > 0 ? pts[n - 1] : null;

  const handleMove = (event: React.MouseEvent<SVGRectElement>) => {
    if (n === 0) return;
    const svg = event.currentTarget.ownerSVGElement;
    const rect = svg?.getBoundingClientRect();
    const localX = rect ? event.clientX - rect.left - CHART_PAD.l : 0;
    const i = Math.max(0, Math.min(n - 1, step > 0 ? Math.round(localX / step) : 0));
    show(event, points[i].tooltip);
  };

  return (
    <div ref={ref} className="relative" data-chart-wrap data-component="OverdueRateChart">
      <svg width="100%" height={height} role="img" aria-label={ariaLabel}>
        <YGrid ticks={ticks} maxV={maxV} width={width} height={height} format={formatAxisValue} />
        {n > 0 ? (
          <>
            <path d={area} fill={CHART_COLORS.red} opacity={0.1} />
            <path
              d={line}
              fill="none"
              stroke={CHART_COLORS.red}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {last ? (
              <>
                <circle cx={last[0]} cy={last[1]} r={6} fill={CHART_COLORS.surface} />
                <circle cx={last[0]} cy={last[1]} r={4} fill={CHART_COLORS.red} />
                <text
                  x={last[0] - 4}
                  y={Math.max(CHART_PAD.t, last[1] - 9)}
                  textAnchor="end"
                  fontSize="var(--text-body-10)"
                  fontWeight={600}
                  fill={CHART_COLORS.labelText}
                >
                  {formatEndLabel(points[n - 1].rate)}
                </text>
              </>
            ) : null}
          </>
        ) : null}
        <rect
          x={CHART_PAD.l}
          y={CHART_PAD.t}
          width={iw}
          height={ih}
          fill="transparent"
          onMouseMove={handleMove}
          onMouseLeave={hide}
        />
        <XLabels labels={points.map((p) => p.xLabel)} width={width} height={height} mode="point" />
      </svg>
      {n === 0 && emptyMessage ? (
        <p className="m-0 text-body-13 text-text-muted" role="status" data-chart-empty>
          {emptyMessage}
        </p>
      ) : null}
      <ChartTooltip tooltip={tooltip} width={width} />
    </div>
  );
}

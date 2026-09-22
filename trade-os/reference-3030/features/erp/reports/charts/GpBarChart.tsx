"use client";

import type { ReactNode } from "react";

import { ChartTooltip, useChartTooltip } from "./ChartTooltip";
import { innerSize, XLabels } from "./chartFrame";
import {
  barPathBottom,
  barPathTop,
  CHART_COLORS,
  CHART_PAD,
} from "./chartGeometry";
import { useMeasuredWidth } from "./useMeasuredWidth";

export type GpPoint = {
  key: string;
  xLabel: string;
  /** Reports pass scaled bigint; legacy consumers may retain their number chart values. */
  gp: bigint | number;
  tooltip: ReactNode;
  hasData?: boolean;
};

/**
 * 월별 GP — 단일 시리즈 막대, 0 기준선(강조 그리드), 음수 달은 레드 하향 막대
 * + 값 라벨, 마지막 막대 값 라벨 (시안 renderGP 이식).
 */
const LEGACY_NUMBER_SCALE = BigInt(1_000_000);

function chartRatio(numerator: bigint, denominator: bigint): number {
  if (denominator <= BigInt(0)) return 0;
  const precision = BigInt(1_000_000);
  return Number((numerator * precision) / denominator) / Number(precision);
}

function chartValue(value: bigint | number): bigint {
  return typeof value === "bigint" ? value : BigInt(Math.round(value * Number(LEGACY_NUMBER_SCALE)));
}

/** SVG geometry needs finite coordinates, but never receives a money amount as a Number. */
function GpGrid({
  ticks,
  maxV,
  minV,
  width,
  height,
  format,
}: {
  ticks: bigint[];
  maxV: bigint;
  minV: bigint;
  width: number;
  height: number;
  format: (v: bigint) => string;
}) {
  const { ih } = innerSize(width, height);
  const span = maxV - minV || BigInt(1);
  return (
    <>
      {ticks.map((tick) => {
        const y = CHART_PAD.t + ih - chartRatio(tick - minV, span) * ih;
        return (
          <g key={tick.toString()}>
            <line
              x1={CHART_PAD.l}
              x2={width - CHART_PAD.r}
              y1={y}
              y2={y}
              stroke={tick === BigInt(0) ? CHART_COLORS.gridStrong : CHART_COLORS.grid}
              strokeWidth={1}
            />
            <text
              x={CHART_PAD.l - 6}
              y={y + 4}
              textAnchor="end"
              fontSize="var(--text-body-10)"
              fill={CHART_COLORS.axisText}
            >
              {format(tick)}
            </text>
          </g>
        );
      })}
    </>
  );
}

/**
 * 월별 GP — 금액은 scaled bigint로 보존하고, SVG 좌표 비율에만 bounded Number를 쓴다.
 * 음수 달은 레드 하향 막대 + 값 라벨, 마지막 막대 값 라벨 (시안 renderGP 이식).
 */
export function GpBarChart({
  points,
  height = 200,
  ariaLabel,
  formatAxisValue,
  formatBarLabel,
}: {
  points: GpPoint[];
  height?: number;
  ariaLabel: string;
  formatAxisValue: ((v: bigint) => string) | ((v: number) => string);
  formatBarLabel: ((v: bigint) => string) | ((v: number) => string);
}) {
  const { ref, width } = useMeasuredWidth<HTMLDivElement>();
  const { tooltip, show, hide } = useChartTooltip();

  const { iw, ih } = innerSize(width, height);
  const n = points.length;
  const exact = points.every((point) => typeof point.gp === "bigint");
  const values = points.map((point) => chartValue(point.gp));
  const maxV = values.reduce((max, value) => (value > max ? value : max), BigInt(0));
  const minV = values.reduce((min, value) => (value < min ? value : min), BigInt(0));
  const span = maxV - minV || BigInt(1);
  const ticks =
    minV < BigInt(0)
      ? [maxV, maxV / BigInt(2), BigInt(0), minV / BigInt(2), minV]
      : [maxV, maxV / BigInt(2), BigInt(0)];
  const displayValue = (value: bigint): bigint | number =>
    exact ? value : Number(value) / Number(LEGACY_NUMBER_SCALE);
  const format = formatAxisValue as (value: bigint | number) => string;
  const formatBar = formatBarLabel as (value: bigint | number) => string;

  const slot = n > 0 ? iw / n : iw;
  const bw = Math.max(2, Math.min(16, slot - 10));
  const y0 = CHART_PAD.t + ih - chartRatio(-minV, span) * ih;

  return (
    <div ref={ref} className="relative" data-chart-wrap data-component="GpBarChart">
      <svg width="100%" height={height} role="img" aria-label={ariaLabel}>
        <GpGrid
          ticks={ticks}
          maxV={maxV}
          minV={minV}
          width={width}
          height={height}
          format={(value) => format(displayValue(value))}
        />
        {points.map((p, i) => {
          const value = chartValue(p.gp);
          const negative = value < BigInt(0);
          const empty = p.hasData === false;
          const absolute = negative ? -value : value;
          const h = chartRatio(absolute, span) * ih;
          const y = negative ? y0 : y0 - h;
          const x = CHART_PAD.l + i * slot + (slot - bw) / 2;
          const isLast = i === n - 1;
          if (empty) {
            return (
              <g key={p.key} data-gp-bar="empty">
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
          }
          return (
            <g key={p.key} data-gp-bar={negative ? "negative" : "positive"}>
              <path
                d={negative ? barPathBottom(x, y, bw, h, 4) : barPathTop(x, y, bw, h, 4)}
                fill={negative ? CHART_COLORS.red : CHART_COLORS.blue}
              />
              {negative ? (
                <text
                  x={x + bw / 2}
                  y={y + h + 12}
                  textAnchor="middle"
                  fontSize="var(--text-body-10)"
                  fontWeight={600}
                  fill={CHART_COLORS.labelText}
                >
                  {formatBar(displayValue(value))}
                </text>
              ) : null}
              {isLast && !negative ? (
                <text
                  x={x + bw / 2}
                  y={Math.max(CHART_PAD.t, y - 6)}
                  textAnchor="middle"
                  fontSize="var(--text-body-10)"
                  fontWeight={600}
                  fill={CHART_COLORS.labelText}
                >
                  {formatBar(displayValue(value))}
                </text>
              ) : null}
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

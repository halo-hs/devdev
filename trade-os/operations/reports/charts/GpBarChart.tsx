"use client";

import type { ReactNode } from "react";

import { ChartTooltip, useChartTooltip } from "./ChartTooltip";
import { innerSize, XLabels, type ChartPad } from "./chartFrame";
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

/**
 * Round a positive scaled amount up to 1·2·2.5·5·10 × 10^n, the same steps as
 * `niceCeil` for the other report charts, without turning money into a Number.
 */
function niceCeilBig(value: bigint): bigint {
  if (value <= BigInt(0)) return BigInt(0);
  const base = BigInt(10) ** BigInt(value.toString().length - 1);
  const steps: Array<[bigint, bigint]> = [
    [BigInt(1), BigInt(1)],
    [BigInt(2), BigInt(1)],
    [BigInt(5), BigInt(2)],
    [BigInt(5), BigInt(1)],
  ];
  for (const [num, den] of steps) {
    const candidate = (base * num) / den;
    if (candidate >= value) return candidate;
  }
  return base * BigInt(10);
}

/** SVG geometry needs finite coordinates, but never receives a money amount as a Number. */
function GpGrid({
  ticks,
  maxV,
  minV,
  width,
  height,
  format,
  pad,
}: {
  ticks: bigint[];
  maxV: bigint;
  minV: bigint;
  width: number;
  height: number;
  format: (v: bigint) => string;
  pad: ChartPad;
}) {
  const { ih } = innerSize(width, height, pad);
  const span = maxV - minV || BigInt(1);
  // All-zero months: keep the same four-step grid as the other report charts,
  // with only the 0 line labelled.
  if (maxV === minV) {
    return (
      <>
        {[4, 3, 2, 1, 0].map((step) => {
          const y = pad.t + ih - (step / 4) * ih;
          return (
            <g key={step}>
              <line x1={pad.l} x2={width - pad.r} y1={y} y2={y} stroke={CHART_COLORS.grid} strokeWidth={1} />
              {step === 0 ? (
                <text x={pad.l - 6} y={y + 4} textAnchor="end" fontSize="12" fill={CHART_COLORS.axisText}>
                  {format(BigInt(0))}
                </text>
              ) : null}
            </g>
          );
        })}
      </>
    );
  }
  return (
    <>
      {ticks
        .filter((tick, index, all) => index === 0 || tick !== all[index - 1])
        .map((tick) => {
          const y = pad.t + ih - chartRatio(tick - minV, span) * ih;
          return (
            <g key={tick.toString()}>
              <line
                x1={pad.l}
                x2={width - pad.r}
                y1={y}
                y2={y}
                stroke={tick === BigInt(0) ? CHART_COLORS.gridStrong : CHART_COLORS.grid}
                strokeWidth={1}
              />
              <text
                x={pad.l - 6}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
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

  const n = points.length;
  const exact = points.every((point) => typeof point.gp === "bigint");
  const values = points.map((point) => chartValue(point.gp));
  const rawMax = values.reduce((max, value) => (value > max ? value : max), BigInt(0));
  const rawMin = values.reduce((min, value) => (value < min ? value : min), BigInt(0));
  // Same scale as the other report charts: nice upper bound, four steps above 0,
  // and the same step size repeated below 0 for negative months.
  const maxV = niceCeilBig(rawMax);
  const step = maxV > BigInt(0) ? maxV / BigInt(4) : niceCeilBig(-rawMin) / BigInt(4);
  const below = rawMin < BigInt(0) && step > BigInt(0) ? (-rawMin + step - BigInt(1)) / step : BigInt(0);
  const minV = -below * step;
  const span = maxV - minV || BigInt(1);
  const ticks: bigint[] = [];
  if (step > BigInt(0)) {
    for (let tick = maxV; tick >= minV; tick -= step) ticks.push(tick);
  }
  const displayValue = (value: bigint): bigint | number =>
    exact ? value : Number(value) / Number(LEGACY_NUMBER_SCALE);
  const format = formatAxisValue as (value: bigint | number) => string;
  const formatBar = formatBarLabel as (value: bigint | number) => string;

  // Axis and bar labels are full money strings ("USD 1,234.00"), so the side
  // padding grows with the longest label (≈7px per glyph) instead of clipping it.
  const axisLabels = (ticks.length ? ticks : [BigInt(0)]).map((tick) => format(displayValue(tick)));
  const lastValue = n > 0 ? chartValue(points[n - 1].gp) : BigInt(0);
  const lastLabel = n > 0 && points[n - 1].hasData !== false ? formatBar(displayValue(lastValue)) : "";
  const pad: ChartPad = {
    ...CHART_PAD,
    l: Math.max(CHART_PAD.l, Math.max(...axisLabels.map((label) => label.length)) * 7 + 10),
    r: Math.max(CHART_PAD.r, Math.ceil(lastLabel.length * 3.8) - 4),
  };
  const { iw, ih } = innerSize(width, height, pad);
  const slot = n > 0 ? iw / n : iw;
  const bw = Math.max(2, Math.min(16, slot - 10));
  const y0 = pad.t + ih - chartRatio(-minV, span) * ih;

  return (
    // Narrow cards keep a fixed 520px plot and scroll sideways.
    <div className="overflow-x-auto">
    <div ref={ref} className="relative min-w-[520px]" data-chart-wrap data-component="GpBarChart">
      <svg width="100%" height={height} role="img" aria-label={ariaLabel}>
        <GpGrid
          ticks={ticks}
          maxV={maxV}
          minV={minV}
          width={width}
          height={height}
          format={(value) => format(displayValue(value))}
          pad={pad}
        />
        {points.map((p, i) => {
          const value = chartValue(p.gp);
          const negative = value < BigInt(0);
          const empty = p.hasData === false;
          const absolute = negative ? -value : value;
          const h = chartRatio(absolute, span) * ih;
          const y = negative ? y0 : y0 - h;
          const x = pad.l + i * slot + (slot - bw) / 2;
          const isLast = i === n - 1;
          if (empty) {
            return (
              <g key={p.key} data-gp-bar="empty">
                <rect
                  x={pad.l + i * slot}
                  y={pad.t}
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
                fill={negative ? CHART_COLORS.gpNegative : CHART_COLORS.gpPositive}
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
                  y={Math.max(pad.t, y - 6)}
                  textAnchor="middle"
                  fontSize="var(--text-body-10)"
                  fontWeight={600}
                  fill={CHART_COLORS.labelText}
                >
                  {formatBar(displayValue(value))}
                </text>
              ) : null}
              <rect
                x={pad.l + i * slot}
                y={pad.t}
                width={slot}
                height={ih}
                fill="transparent"
                onMouseMove={(event) => show(event, p.tooltip)}
                onMouseLeave={hide}
              />
            </g>
          );
        })}
        <XLabels labels={points.map((p) => p.xLabel)} width={width} height={height} mode="band" pad={pad} />
      </svg>
      <ChartTooltip tooltip={tooltip} width={width} />
    </div>
    </div>
  );
}

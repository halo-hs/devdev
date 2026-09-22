// 공용 SVG 프레임 조각 — 헤어라인 그리드 + y 눈금 라벨 + x 축 라벨 (시안 frame/xLabels 이식).
import { CHART_COLORS, CHART_PAD, xLabelEvery } from "./chartGeometry";

export function innerSize(width: number, height: number) {
  return {
    iw: Math.max(0, width - CHART_PAD.l - CHART_PAD.r),
    ih: Math.max(0, height - CHART_PAD.t - CHART_PAD.b),
  };
}

export function YGrid({
  ticks,
  maxV,
  minV = 0,
  width,
  height,
  format,
  strongZero = false,
}: {
  ticks: number[];
  maxV: number;
  minV?: number;
  width: number;
  height: number;
  format: (v: number) => string;
  strongZero?: boolean;
}) {
  const { ih } = innerSize(width, height);
  const span = maxV - minV || 1;
  return (
    <>
      {ticks.map((tv) => {
        const y = CHART_PAD.t + ih - ((tv - minV) / span) * ih;
        return (
          <g key={tv}>
            <line
              x1={CHART_PAD.l}
              x2={width - CHART_PAD.r}
              y1={y}
              y2={y}
              stroke={strongZero && tv === 0 ? CHART_COLORS.gridStrong : CHART_COLORS.grid}
              strokeWidth={1}
            />
            <text
              x={CHART_PAD.l - 6}
              y={y + 4}
              textAnchor="end"
              fontSize="var(--text-body-10)"
              fill={CHART_COLORS.axisText}
            >
              {format(tv)}
            </text>
          </g>
        );
      })}
    </>
  );
}

export function XLabels({
  labels,
  width,
  height,
  mode,
}: {
  labels: string[];
  width: number;
  height: number;
  /** band = 막대(슬롯 중앙), point = 라인(양끝 정렬). */
  mode: "band" | "point";
}) {
  const { iw } = innerSize(width, height);
  const n = labels.length;
  if (n === 0) return null;
  const every = xLabelEvery(n);
  const step = n > 1 ? iw / (n - 1) : 0;
  return (
    <>
      {labels.map((label, i) => {
        if (i % every) return null;
        const x =
          mode === "band"
            ? CHART_PAD.l + (i + 0.5) * (iw / n)
            : n > 1
              ? CHART_PAD.l + i * step
              : CHART_PAD.l + iw / 2;
        return (
          <text
            key={`${i}-${label}`}
            x={x}
            y={height - 8}
            textAnchor="middle"
            fontSize="var(--text-body-10)"
            fill={CHART_COLORS.axisText}
          >
            {label}
          </text>
        );
      })}
    </>
  );
}

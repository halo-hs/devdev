// OS-B3 자체 SVG 차트 킷의 순수 기하 헬퍼 — 외부 차트 라이브러리 금지(번들 0KB).
// 시안(b3-report-mockup)의 렌더러 상수를 그대로 이식: 42/14/12/24 패딩,
// 4px 라운드 탑 바, 2px 라인, 헤어라인 그리드.

export const CHART_PAD = { l: 42, r: 14, t: 12, b: 24 } as const;

/** 위 모서리만 둥근 막대 path (시안 barPath — 양수 막대). */
export function barPathTop(x: number, y: number, w: number, h: number, r: number): string {
  if (h <= 0) return "";
  // r > h 또는 2r > w 면 path 가 역주행(self-intersect)하므로 양축으로 클램프.
  r = Math.min(r, w / 2, h);
  return (
    `M${x} ${y + h} V${y + r} Q${x} ${y} ${x + r} ${y}` +
    ` H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h} Z`
  );
}

/** 아래 모서리만 둥근 막대 path (음수 GP — 0 기준선 아래로 내려가는 막대). */
export function barPathBottom(x: number, y: number, w: number, h: number, r: number): string {
  if (h <= 0) return "";
  // r > h 또는 2r > w 면 path 가 역주행(self-intersect)하므로 양축으로 클램프.
  r = Math.min(r, w / 2, h);
  return (
    `M${x} ${y} H${x + w} V${y + h - r}` +
    ` Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} Z`
  );
}

/** 꺾은선 path ("M x y L x y …"). */
export function linePath(points: Array<readonly [number, number]>): string {
  return points.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
}

/** 1/2/2.5/5 × 10^k 로 올림한 "보기 좋은" 축 최댓값 (0 이하 데이터는 1). */
export function niceCeil(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  const frac = value / base;
  let nice: number;
  if (frac <= 1) nice = 1;
  else if (frac <= 2) nice = 2;
  else if (frac <= 2.5) nice = 2.5;
  else if (frac <= 5) nice = 5;
  else nice = 10;
  return nice * base;
}

/** 0..max 를 count 등분한 눈금 값(0 포함, max 포함). */
export function makeTicks(max: number, count: number): number[] {
  const n = Math.max(1, count);
  const ticks: number[] = [];
  for (let i = 0; i <= n; i += 1) ticks.push((max / n) * i);
  return ticks;
}

/** x 라벨 간격 — 최대 6~7개 라벨이 되도록 스텝을 고른다(시안: 12개월→2). */
export function xLabelEvery(pointCount: number): number {
  if (pointCount <= 7) return 1;
  return Math.ceil(pointCount / 6);
}

// 디자인 토큰 직결 색 상수(라이트 고정, D12) — globals.css 의 ecoya 토큰만 사용.
export const CHART_COLORS = {
  /** AR 적용액·미수·GP 양수 = 블루 (시안 --blue #166dd7). */
  blue: "var(--ecoya-blue-4)",
  /** 수취 예정(계획) = 동일 블루의 연한 스텝 (시안 --blue-soft #dceefa). */
  planned: "var(--ecoya-blue-9)",
  /** 미지급 = 오렌지 (시안 --orange #e8590c, CVD 분리 검증). */
  orange: "var(--ecoya-system-orange-1)",
  /** 연체율·음수 GP = 리스크 레드 (시안 --red #bf4040). */
  red: "var(--ecoya-system-red-1)",
  grid: "var(--ecoya-gray-10)",
  gridStrong: "var(--ecoya-gray-9)",
  axisText: "var(--ecoya-gray-6)",
  labelText: "var(--ecoya-gray-3)",
  surface: "var(--ecoya-gray-12)",
} as const;

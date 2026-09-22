"use client";

import { useCallback, useState, type ReactNode } from "react";

// 시안의 다크 툴팁(.tt) 이식 — 차트 래퍼(relative) 안에서 커서를 따라다니는
// pointer-events 없는 오버레이. 오른쪽 끝에서는 좌측으로 뒤집어 잘림을 막는다.
export type TooltipState = {
  x: number;
  y: number;
  content: ReactNode;
} | null;

/** 차트별 호버 툴팁 상태 + 래퍼 좌표계 마우스 핸들러 헬퍼. */
export function useChartTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const show = useCallback((event: React.MouseEvent, content: ReactNode) => {
    const host = event.currentTarget.closest("[data-chart-wrap]");
    const rect = host?.getBoundingClientRect();
    setTooltip({
      x: rect ? event.clientX - rect.left : 0,
      y: rect ? event.clientY - rect.top : 0,
      content,
    });
  }, []);

  const hide = useCallback(() => setTooltip(null), []);

  return { tooltip, show, hide };
}

export function ChartTooltip({ tooltip, width }: { tooltip: TooltipState; width: number }) {
  if (!tooltip) return null;
  const flip = tooltip.x > width * 0.62;
  return (
    <div
      aria-hidden
      data-ui="report-chart-tooltip"
      className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg bg-ecoya-gray-2 px-2.5 py-1.5 text-body-13 leading-normal text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)] tabular-nums"
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

import { useCallback, useState, type ReactNode } from "react"

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

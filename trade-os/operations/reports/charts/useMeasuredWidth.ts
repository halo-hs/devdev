"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 컨테이너 실측 폭 — SVG 차트의 반응형 축. ResizeObserver 가 있으면 구독하고
 * (jsdom 등) 없으면 mount 시 1회 측정만 한다. 측정 전/0폭에서는 fallback 을
 * 유지해 SSR·테스트 렌더가 항상 유한한 좌표를 갖게 한다.
 */
export function useMeasuredWidth<T extends HTMLElement>(fallback = 640) {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setWidth(w);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

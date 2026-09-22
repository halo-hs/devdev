"use client";

import type { HTMLAttributes } from "react";

import { cx } from "./utils";

export type LoadingDotsProps = Omit<HTMLAttributes<HTMLSpanElement>, "color"> & {
  /** Container 한 변 길이(px). dotSize=round(size*0.25), gap=round(size*0.17). 기본 24 */
  size?: number;
};

// product-ui-contract LoadingDots 계약: inline/subtle 대기 인디케이터.
// 정본 atom/LoadingDots 스펙 — size 24 기본, dot 3개 원형, 색은 blue-4 기본이되
// currentColor를 상속해 className(text-*)으로 오버라이드 가능.
// 애니메이션: 1s ease-in-out infinite, delay 0/0.16s/0.32s, opacity 0.3↔1 사이클.
// (정본 코드는 transform scale 0.8↔1도 동반하나 상위 계약은 opacity cycle만 명시 →
//  opacity 우선. 출처 충돌로 scale 변형 보류 — .omc/plans/s5-analysis.json)
// keyframe(ecoya-loading-dots)은 globals.css 전역 정의를 사용하고 dot별 delay만
// inline 처리 — 컴포넌트 스코프 <style> 주입은 span 내 metadata content(HTML5
// 비표준) + 다중 인스턴스 중복이라 전역으로 이관함 (PR#40 리뷰).
const DOT_DELAYS = ["0s", "0.16s", "0.32s"] as const;

export function LoadingDots({
  className,
  size = 24,
  style,
  ...props
}: LoadingDotsProps) {
  const dotSize = Math.round(size * 0.25);
  const gap = Math.round(size * 0.17);

  return (
    // 장식 인디케이터 — aria-hidden으로 AT 비노출(로딩 안내는 소비처 텍스트 책임).
    // role="status"는 aria-hidden과 모순(dead 속성)이라 부여하지 않는다.
    <span
      aria-hidden="true"
      className={cx(
        "inline-flex shrink-0 items-center justify-center text-ecoya-blue-4",
        className,
      )}
      data-ui="loading-dots"
      style={{ width: size, height: size, gap, ...style }}
      {...props}
    >
      {DOT_DELAYS.map((delay) => (
        <span
          className="inline-block rounded-full bg-current"
          data-ui="loading-dots-dot"
          key={delay}
          style={{
            width: dotSize,
            height: dotSize,
            animation: "ecoya-loading-dots 1s ease-in-out infinite",
            animationDelay: delay,
          }}
        />
      ))}
    </span>
  );
}

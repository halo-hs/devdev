import type { HTMLAttributes } from "react";

import { cx } from "./utils";

type SkeletonVariant = "block" | "circle" | "line";

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  variant?: SkeletonVariant;
};

// product-ui-contract Skeleton 계약: animate-pulse opacity 펄스만(shimmer 금지),
// placeholder fill = gray10(#EEEFF1). 전역 --muted(=gray11)에 의존하지 않고
// gray10 토큰을 직접 사용한다. radius: line/block = 8, circle = 999.
// width/height는 className으로 위임한다.
// 컨테이너 규칙(card/table skeleton wrapper)은 소비처에서 조립한다(문서화만).
const variantClasses: Record<SkeletonVariant, string> = {
  block: "rounded-[8px]",
  circle: "rounded-full",
  line: "h-[14px] rounded-[8px]",
};

export function Skeleton({
  className,
  variant = "line",
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "animate-pulse bg-ecoya-gray-10",
        variantClasses[variant],
        className,
      )}
      data-slot="skeleton"
      data-ui="skeleton"
      {...props}
    />
  );
}

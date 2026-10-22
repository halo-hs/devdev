"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cx } from "./utils";

export type DisclosureHeaderProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-expanded"
> & {
  children: ReactNode;
  open: boolean;
  /** 펼칠 내용이 없어 토글이 의미 없는 행. aria-expanded를 생략한다. */
  inert?: boolean;
};

/**
 * 접었다 펴는 영역의 헤더 버튼.
 *
 * `aria-expanded`를 prop에서 직접 계산해 붙이므로 호출부가 빠뜨릴 수 없다.
 * 이관 대상 6개 사이트는 전부 focus 링이 없어 키보드로 어느 헤더에 있는지
 * 알 수 없었다.
 *
 * 레이아웃(정렬/여백/구분선)은 사이트마다 다르므로 className으로 받는다.
 * 부품이 강제하는 것은 시맨틱(aria-expanded, type)과 focus 가시성뿐이다.
 */
export const DisclosureHeader = forwardRef<HTMLButtonElement, DisclosureHeaderProps>(
  function DisclosureHeader({ children, className, inert = false, open, type = "button", ...rest }, ref) {
    return (
      <button
        aria-expanded={inert ? undefined : open}
        className={cx(
          "text-left",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-accent",
          className,
        )}
        ref={ref}
        type={type}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

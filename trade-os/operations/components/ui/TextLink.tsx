"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cx } from "./utils";

export type TextLinkTone =
  | "muted"
  | "accent"
  | "primary"
  | "secondary"
  | "danger"
  | "inherit";
export type TextLinkSize = "sm" | "md" | "inherit";
export type TextLinkUnderline = "hover" | "always" | "none";

export type TextLinkProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: TextLinkTone;
  size?: TextLinkSize;
  underline?: TextLinkUnderline;
};

const toneClass: Record<TextLinkTone, string> = {
  muted: "text-text-muted hover:text-text-primary",
  accent: "text-ecoya-accent hover:text-ecoya-blue-5",
  primary: "text-text-primary hover:text-ecoya-accent",
  secondary: "text-text-secondary hover:text-text-primary",
  danger: "text-ecoya-system-red-2 hover:text-ecoya-system-red-1",
  // 표준 5색에 없는 기존 색(status-info, ecoya-indigo 등)을 쓰는 사이트용.
  // 색을 부품이 정하지 않고 className으로 원본을 그대로 넘긴다.
  inherit: "",
};

const sizeClass: Record<TextLinkSize, string> = {
  sm: "text-label-12",
  md: "text-body-14",
  // 원본이 text-body-13/text-sm 등 비표준 크기일 때 className으로 넘긴다.
  inherit: "",
};

const underlineClass: Record<TextLinkUnderline, string> = {
  hover: "hover:underline",
  always: "underline",
  // 원본에 밑줄이 없던 사이트(아이콘형 ×, 굵은 강조 링크 등). 밑줄을 새로
  // 붙이면 외형이 바뀌므로 명시적으로 없음을 고른다.
  none: "",
};

/**
 * 본문 흐름 안의 인라인 동작(수정/삭제/다시 시도/자세히)을 위한 텍스트 버튼.
 *
 * raw `<button>` + `hover:underline` 조합을 대체한다. 대체 이전 49개 사이트는
 * focus 링이 하나도 없어 키보드 사용자가 초점 위치를 알 수 없었다(0/49).
 * 여기서 focus-visible 링을 한곳에 고정한다.
 *
 * 시각 대체가 아니라 접근성 보강이 목적이므로 기존 사이트의 외형을 보존한다.
 * 임의로 통일하지 않는다 — 색이 의미를 나르고(muted=보조, danger=파괴적),
 * 밑줄 표시 시점도 사이트마다 다르다(hover 30 / 상시 17). 이관 시 원래 값을
 * 그대로 옮길 것. 통일은 별도 디자인 결정이다.
 */
export const TextLink = forwardRef<HTMLButtonElement, TextLinkProps>(
  function TextLink(
    {
      children,
      className,
      size = "sm",
      tone = "muted",
      type = "button",
      underline = "hover",
      ...rest
    },
    ref,
  ) {
    return (
      <button
        className={cx(
          "rounded-[2px] underline-offset-2",
          "transition-colors disabled:opacity-50 disabled:hover:no-underline",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-accent",
          toneClass[tone],
          underlineClass[underline],
          sizeClass[size],
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

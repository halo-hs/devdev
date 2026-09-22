"use client";

import {
  forwardRef,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent,
} from "react";

import { cx } from "./utils";

type SwitchSize = "sm" | "md";

type SwitchProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "type"> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /**
   * @deprecated Use `checked` for controlled state or `defaultChecked` for
   * uncontrolled initial state. This alias is kept for Figma QA compatibility.
   */
  on?: boolean;
  size?: SwitchSize;
  /** Shows a loading spinner (MoonLoader equivalent) in place of the knob. */
  loading?: boolean;
  visualState?: "default" | "disabled";
};

let didWarnOnAlias = false;

function warnOnAlias() {
  if (import.meta.env.MODE === "production" || didWarnOnAlias) return;
  didWarnOnAlias = true;
  console.warn("Switch `on` is deprecated. Use `checked` or `defaultChecked` instead.");
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch({
  checked,
  className,
  defaultChecked = true,
  disabled,
  loading = false,
  on,
  onCheckedChange,
  onClick,
  size = "sm",
  visualState = "default",
  ...props
}, ref) {
  if (typeof on === "boolean") {
    warnOnAlias();
  }

  const isControlled = typeof checked === "boolean";
  const isAliasControlled = !isControlled && typeof on === "boolean";
  const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked);
  const isChecked = isControlled
    ? checked
    : isAliasControlled
      ? on
      : uncontrolledChecked;
  const isDisabled = disabled || visualState === "disabled";
  const isMedium = size === "md";

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.defaultPrevented || isDisabled) return;

    const nextChecked = !isChecked;
    if (!isControlled && !isAliasControlled) {
      setUncontrolledChecked(nextChecked);
    }
    onCheckedChange?.(nextChecked);
  }

  return (
    <button
      aria-checked={isChecked}
      className={cx(
        "relative inline-flex shrink-0 items-center rounded-xl",
        "transition-colors duration-200",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-blue-4",
        isMedium ? "h-[22px] w-11" : "h-4 w-7",
        isDisabled
          ? isChecked
            ? "bg-[var(--ecoya-gray-8)]"
            : "bg-[var(--ecoya-gray-7)]"
          : isChecked
            ? "bg-[var(--ecoya-system-blue-2)]"
            : "bg-[var(--ecoya-gray-7)]",
        className,
      )}
      data-ui="switch"
      disabled={isDisabled}
      onClick={handleClick}
      ref={ref}
      role="switch"
      type="button"
      {...props}
    >
      {loading ? (
        // 스피너도 knob와 동일한 absolute+translate 배치 — 트랙 높이를 꽉 채우는 크기라
        // 패딩 0 기준: off=0, on=트랙폭-스피너폭 (sm 28-16=12, md 44-22=22)
        <span
          aria-hidden="true"
          className={cx(
            "absolute block animate-spin rounded-full border-2 border-transparent border-t-ecoya-blue-4 transition-transform duration-200",
            isMedium
              ? cx("size-[22px]", isChecked ? "translate-x-[22px]" : "translate-x-0")
              : cx("size-4", isChecked ? "translate-x-[12px]" : "translate-x-0"),
          )}
        />
      ) : (
        <span
          // 정본 SwitchKnob 동일 모델: absolute + top 미명시 + translateX만 —
          // 수직 센터는 flex 컨테이너(items-center)의 absolute static position 표준 동작에 의존
          className={cx(
            "absolute block rounded-full transition-[transform,background-color] duration-200",
            isMedium
              ? cx("size-[18px]", isChecked ? "translate-x-[24px]" : "translate-x-[2px]")
              : cx("size-3", isChecked ? "translate-x-[14px]" : "translate-x-[2px]"),
            isDisabled
              ? isChecked
                ? "bg-[var(--ecoya-gray-9)]"
                : "bg-[var(--ecoya-gray-8)]"
              : "bg-[var(--ecoya-gray-12)]",
          )}
        />
      )}
    </button>
  );
});

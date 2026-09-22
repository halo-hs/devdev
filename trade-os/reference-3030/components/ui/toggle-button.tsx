"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

import { Icon } from "./icon";
import { cx } from "./utils";

export type ToggleButtonSize = "S" | "L" | "compact";
export type ToggleButtonVariant = "stroke-v1" | "stroke-v2" | "fill" | "solid";

export type ToggleButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  selected?: boolean;
  showLockIcon?: boolean;
  size?: ToggleButtonSize;
  variant?: ToggleButtonVariant;
};

function toggleButtonSizeClass(size: ToggleButtonSize) {
  if (size === "L") return "h-10 w-[93px] text-body-16 leading-6";
  if (size === "compact") return "h-6 w-[71px] text-body-13 leading-[16.06px]";
  return "h-9 w-[71px] text-body-14 leading-[20.44px]";
}

function toggleButtonRadiusClass(size: ToggleButtonSize, variant: ToggleButtonVariant) {
  // 정본 fill case는 size 무관 8px 하드코딩(ToggleButton.tsx L173/L180) —
  // 삼항식의 size-우선 해석은 fill엔 적용되지 않음 (Lap2 S1 검증으로 확정)
  if (size === "L" || variant === "fill") return "rounded-[8px]";
  if (size === "compact") return "rounded-[6px]";
  return "rounded-none";
}

function toggleButtonTone(variant: ToggleButtonVariant, selected: boolean, disabled: boolean) {
  if (variant === "stroke-v1") {
    return selected
      ? {
          className: "border border-ecoya-blue-4 bg-ecoya-gray-12 font-medium",
          color: "var(--ecoya-blue-4)",
        }
      : {
          className: "border border-ecoya-gray-9 bg-ecoya-gray-11 font-regular",
          color: "var(--ecoya-gray-7)",
        };
  }

  if (variant === "stroke-v2") {
    if (disabled) {
      return {
        className: "border border-ecoya-gray-8 bg-ecoya-gray-11 font-regular",
        color: "var(--ecoya-gray-7)",
      };
    }
    return selected
      ? {
          className: "border border-ecoya-blue-4 bg-ecoya-gray-12 font-medium",
          color: "var(--ecoya-blue-4)",
        }
      : {
          className: "border border-ecoya-gray-8 bg-ecoya-gray-12 font-regular",
          color: "var(--ecoya-gray-5)",
        };
  }

  if (variant === "fill") {
    return selected
      ? {
          className: "border border-transparent bg-ecoya-gray-12 font-medium",
          color: "var(--ecoya-indigo)",
        }
      : {
          className: "border border-transparent bg-transparent font-regular",
          color: "var(--ecoya-gray-7)",
        };
  }

  return selected
    ? {
        className: "border border-transparent bg-ecoya-indigo font-medium",
        color: "var(--ecoya-gray-12)",
      }
    : {
        className: "border border-transparent bg-transparent font-regular",
        color: "var(--ecoya-gray-7)",
      };
}

export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(
  function ToggleButton({
    children,
    className,
    disabled = false,
    selected = false,
    showLockIcon = false,
    size = "S",
    variant = "stroke-v1",
    ...props
  }, ref) {
    const tone = toggleButtonTone(variant, selected, disabled);

    return (
      <button
        aria-pressed={selected}
        className={cx(
          "inline-flex shrink-0 cursor-pointer items-center justify-center gap-0.5 p-0 transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-blue-4 disabled:cursor-not-allowed",
          toggleButtonSizeClass(size),
          toggleButtonRadiusClass(size, variant),
          tone.className,
          className,
        )}
        data-ui="toggle-button"
        disabled={disabled}
        ref={ref}
        style={{ color: tone.color, ...props.style }}
        type="button"
        {...props}
      >
        {showLockIcon && size === "compact" && !selected ? (
          <Icon className="size-[14px]" name="icon-lock" />
        ) : null}
        {children}
      </button>
    );
  },
);

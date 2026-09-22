"use client";

import { forwardRef, type HTMLAttributes } from "react";

import { Icon } from "./icon";
import { cx } from "./utils";

export type QuantityStepperProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange"
> & {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  /** Accessible label for the decrement (−) button. Defaults to 'Decrease quantity'. */
  decrementLabel?: string;
  /** Accessible label for the stepper group element. Defaults to 'Adjust quantity'. */
  groupLabel?: string;
  /** Accessible label for the increment (+) button. Defaults to 'Increase quantity'. */
  incrementLabel?: string;
};

const STEP_BUTTON_BASE =
  "flex size-8 shrink-0 items-center justify-center border border-[var(--button-outline-border)] bg-[var(--button-outline-background)] p-0 shadow-[0px_1px_2px_0px_rgba(5,29,57,0.1)] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-blue-4)]";

export const QuantityStepper = forwardRef<HTMLDivElement, QuantityStepperProps>(
  function QuantityStepper(
    {
      className,
      decrementLabel = "Decrease quantity",
      disabled = false,
      groupLabel = "Adjust quantity",
      incrementLabel = "Increase quantity",
      max,
      min,
      onChange,
      step = 1,
      value,
      ...props
    },
    ref,
  ) {
    const isMin = disabled || (typeof min === "number" && value <= min);
    const isMax = disabled || (typeof max === "number" && value >= max);

    // step>1일 때 경계 초과 방지 — controlled API(min/max 수령) 계약상 클램핑은 컴포넌트 책임
    function handleDecrement() {
      if (isMin) return;
      const nextValue = value - step;
      onChange?.(typeof min === "number" ? Math.max(min, nextValue) : nextValue);
    }

    function handleIncrement() {
      if (isMax) return;
      const nextValue = value + step;
      onChange?.(typeof max === "number" ? Math.min(max, nextValue) : nextValue);
    }

    return (
      <div
        aria-label={groupLabel}
        className={cx("inline-flex h-8 w-[120px] shrink-0 items-center", className)}
        data-ui="quantity-stepper"
        ref={ref}
        role="group"
        {...props}
        data-ds="2"
      >
        <button
          aria-label={decrementLabel}
          className={cx(
            STEP_BUTTON_BASE,
            "rounded-l-[var(--r-md)] text-[var(--color-gray-1)]",
            (isMin || isMax) && "border-[var(--control-selected-border)] bg-[var(--control-selected-soft-background)]",
            disabled && "border-[var(--control-disabled-border)] bg-[var(--control-disabled-background)]",
            isMin ? "cursor-not-allowed" : "cursor-pointer",
          )}
          disabled={isMin}
          onClick={handleDecrement}
          type="button"
        >
          <Icon name="icon-minus" size={20} />
        </button>
        <span
          aria-live="polite"
          className={cx(
            "flex h-8 w-14 min-w-14 items-center justify-center border-y border-r border-[var(--control-border)] bg-[var(--surface-muted-background)] py-px pr-[11px] pl-2.5 text-[length:var(--text-body-9)] leading-[var(--leading-body-9)] font-medium whitespace-nowrap",
            disabled ? "text-[var(--control-disabled-foreground)]" : "text-[var(--surface-foreground)]",
          )}
          data-ui="quantity-stepper-count"
        >
          {value}
        </span>
        <button
          aria-label={incrementLabel}
          className={cx(
            STEP_BUTTON_BASE,
            "rounded-r-[var(--r-md)] border-l-0",
            isMax ? "cursor-not-allowed text-[var(--color-gray-2)]" : "cursor-pointer text-[var(--color-gray-1)]",
          )}
          disabled={isMax}
          onClick={handleIncrement}
          type="button"
        >
          <Icon name="icon-plus" size={20} />
        </button>
      </div>
    );
  },
);

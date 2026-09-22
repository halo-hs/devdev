"use client";

import {
  forwardRef,
  useCallback,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { useInputCheckedState, visualCheckedValue } from "./control-state";
import { cx } from "./utils";

type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  description?: ReactNode;
  label?: ReactNode;
  visualChecked?: boolean;
  visualState?: "default" | "disabled";
};

export type RadioOptionValue = string | number;

export type RadioOption = {
  description?: ReactNode;
  disabled?: boolean;
  label: ReactNode;
  value: RadioOptionValue;
};

export type RadioGroupProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  defaultValue?: RadioOptionValue;
  direction?: "horizontal" | "vertical";
  disabled?: boolean;
  gap?: number;
  name: string;
  onChange?: (value: RadioOptionValue) => void;
  options: Array<RadioOption>;
  value?: RadioOptionValue;
};

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio({
  checked,
  className,
  defaultChecked,
  description,
  disabled,
  label,
  onChange,
  visualChecked,
  visualState = "default",
  ...props
}, ref) {
  const isDisabled = disabled || visualState === "disabled";
  const {
    handleChange,
    inputChecked,
    inputDefaultChecked,
    resolvedChecked,
  } = useInputCheckedState({
    checked,
    defaultChecked,
    onChange,
  });
  const isChecked = visualCheckedValue({
    checked,
    fallback: resolvedChecked,
    visualChecked,
  });

  return (
    <label
      className={cx("inline-flex gap-2", description ? "items-start" : "items-center", className)}
      data-ui="radio"
    >
      <input
        checked={inputChecked}
        className="peer sr-only"
        defaultChecked={inputDefaultChecked}
        disabled={isDisabled}
        onChange={handleChange}
        ref={ref}
        type="radio"
        {...props}
      />
      <span
        aria-hidden="true"
        className="relative flex size-6 shrink-0 items-center justify-center rounded-full p-0.5 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ecoya-blue-4"
      >
        <span
          className={cx(
            "flex size-5 items-center justify-center rounded-full border-[1.5px] bg-surface",
            isChecked ? "border-control-selected" : "border-control-track-inactive",
            isDisabled &&
              (isChecked
                ? "border-control-track-inactive"
                : "border-control-track-disabled bg-surface"),
          )}
        >
          {isChecked ? (
            <span
              className={cx(
                "size-3 rounded-full",
                isDisabled ? "bg-control-track-inactive" : "bg-control-selected",
              )}
            />
          ) : null}
        </span>
      </span>
      {label ? (
        <span className="flex min-w-0 flex-col gap-0.5">
          <span
            className={cx(
              "text-body-16 font-regular leading-6",
              isDisabled
                ? "text-[color:var(--ecoya-text-placeholder)]"
                : "text-[color:var(--ecoya-text-primary)]",
            )}
          >
            {label}
          </span>
          {description ? (
            <span className="text-body-13 font-regular leading-5 text-text-muted">
              {description}
            </span>
          ) : null}
        </span>
      ) : null}
    </label>
  );
});

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  function RadioGroup({
    className,
    defaultValue,
    direction = "horizontal",
    disabled = false,
    gap = 16,
    name,
    onChange,
    options,
    style,
    value,
    ...props
  }, ref) {
    const [internalValue, setInternalValue] = useState<RadioOptionValue | undefined>(defaultValue);
    const selectedValue = value ?? internalValue;

    const handleChange = useCallback((optionValue: RadioOptionValue) => {
      if (disabled) return;
      if (value === undefined) {
        setInternalValue(optionValue);
      }
      onChange?.(optionValue);
    }, [disabled, onChange, value]);

    return (
      <div
        className={cx("flex", direction === "vertical" ? "flex-col" : "flex-row", className)}
        data-ui="radio-group"
        ref={ref}
        style={{ gap, ...style } as CSSProperties}
        {...props}
      >
        {options.map((option) => (
          <Radio
            checked={selectedValue === option.value}
            description={option.description}
            disabled={disabled || option.disabled}
            key={String(option.value)}
            label={option.label}
            name={name}
            onChange={() => handleChange(option.value)}
            value={option.value}
          />
        ))}
      </div>
    );
  },
);

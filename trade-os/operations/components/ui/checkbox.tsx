"use client";

import {
  forwardRef,
  useCallback,
  useState,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { useInputCheckedState, visualCheckedValue } from "./control-state";
import { Icon } from "./icon";
import { FieldMessage } from "./input";
import { cx } from "./utils";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> & {
  error?: boolean;
  helperText?: ReactNode;
  label?: ReactNode;
  labelMeta?: ReactNode;
  termsLink?: ReactNode;
  visualChecked?: boolean;
  visualState?: "default" | "disabled";
};

export type CheckboxOptionValue = string | number;

export type CheckboxOption = {
  disabled?: boolean;
  label: ReactNode;
  value: CheckboxOptionValue;
};

export type CheckboxGroupProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange"
> & {
  defaultValue?: CheckboxOptionValue[];
  direction?: "horizontal" | "vertical";
  disabled?: boolean;
  gap?: number;
  onChange?: (values: CheckboxOptionValue[]) => void;
  options: CheckboxOption[];
  value?: CheckboxOptionValue[];
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({
  checked,
  className,
  defaultChecked,
  disabled,
  error = false,
  helperText,
  label,
  labelMeta,
  onChange,
  termsLink,
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
    <label className={cx("inline-flex items-start gap-2", className)} data-ui="checkbox">
      <input
        checked={inputChecked}
        className="peer sr-only"
        defaultChecked={inputDefaultChecked}
        disabled={isDisabled}
        onChange={handleChange}
        ref={ref}
        type="checkbox"
        {...props}
      />
      <span
        aria-hidden="true"
        className={cx(
          "flex size-6 shrink-0 items-center justify-center",
          "peer-focus-visible:outline-2 peer-focus-visible:outline-ecoya-blue-4 peer-focus-visible:outline-offset-2 peer-focus-visible:rounded-[4px]",
          isChecked && !isDisabled ? "text-control-selected" : "text-text-subtle",
          isDisabled && (isChecked ? "text-text-placeholder" : "text-text-subtle"),
          error && !isChecked && "text-control-error",
        )}
      >
        <Icon
          className="size-6"
          name={
            isChecked && isDisabled
              ? "icon-checkbox-check-disabled"
              : isChecked
                ? "icon-checkbox-check-fill"
                : isDisabled
                  ? "icon-checkbox-disabled"
                  : "icon-checkbox"
          }
        />
      </span>
      {label ? (
        <span className={cx("flex min-w-0 flex-1 flex-col", error ? "gap-1" : "gap-0")}>
          <span className="flex min-h-6 min-w-0 items-center gap-2">
            <span
              className={cx(
                "flex min-w-0 items-center gap-0.5 text-body-16 font-regular",
                isDisabled
                  ? "text-text-placeholder"
                  : "text-text-primary",
              )}
            >
              <span>{label}</span>
              {labelMeta ? <span className="text-body-14">{labelMeta}</span> : null}
            </span>
            {termsLink ? (
              <span className="ml-auto text-body-16 font-regular text-ecoya-gray-5 underline hover:text-ecoya-gray-4">
                {termsLink}
              </span>
            ) : null}
          </span>
          {error && helperText ? (
            <FieldMessage className="pl-0" variant="error">
              {helperText}
            </FieldMessage>
          ) : null}
        </span>
      ) : null}
    </label>
  );
});

export const CheckboxGroup = forwardRef<HTMLDivElement, CheckboxGroupProps>(
  function CheckboxGroup({
    className,
    defaultValue = [],
    direction = "horizontal",
    disabled = false,
    gap = 16,
    onChange,
    options,
    style,
    value,
    ...props
  }, ref) {
    const [internalValues, setInternalValues] = useState<CheckboxOptionValue[]>(defaultValue);
    const selectedValues = value ?? internalValues;

    const handleChange = useCallback((optionValue: CheckboxOptionValue, optionDisabled: boolean) => {
      if (disabled || optionDisabled) return;

      const nextValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((selectedValue) => selectedValue !== optionValue)
        : [...selectedValues, optionValue];

      if (value === undefined) {
        setInternalValues(nextValues);
      }
      onChange?.(nextValues);
    }, [disabled, onChange, selectedValues, value]);

    return (
      <div
        className={cx(
          "flex",
          direction === "vertical" ? "flex-col" : "flex-row",
          className,
        )}
        data-ui="checkbox-group"
        ref={ref}
        role="group"
        style={{ ...style, gap }}
        {...props}
      >
        {options.map((option) => {
          const optionDisabled = Boolean(disabled || option.disabled);
          const isChecked = selectedValues.includes(option.value);

          return (
            <Checkbox
              checked={isChecked}
              disabled={optionDisabled}
              key={String(option.value)}
              label={option.label}
              onChange={() => handleChange(option.value, optionDisabled)}
            />
          );
        })}
      </div>
    );
  },
);

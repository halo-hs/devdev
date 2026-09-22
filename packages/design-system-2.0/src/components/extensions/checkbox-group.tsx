"use client"

import * as React from "react"

import { Checkbox } from "@ecoya/design-system/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@ecoya/design-system/ui/field"
import { cn } from "@ecoya/design-system/lib/utils"

type CheckboxGroupValue = string | number

type CheckboxGroupOption = {
  value: CheckboxGroupValue
  label: React.ReactNode
  description?: React.ReactNode
  disabled?: boolean
}

type CheckboxOption = CheckboxGroupOption

type CheckboxGroupProps = Omit<
  React.ComponentPropsWithoutRef<typeof FieldSet>,
  "defaultValue" | "onChange"
> & {
  options: readonly CheckboxGroupOption[]
  value?: readonly CheckboxGroupValue[]
  defaultValue?: readonly CheckboxGroupValue[]
  onValueChange?: (value: CheckboxGroupValue[]) => void
  /** @deprecated Use onValueChange. */
  onChange?: (value: CheckboxGroupValue[]) => void
  legend?: React.ReactNode
  description?: React.ReactNode
  error?: React.ReactNode
  invalid?: boolean
  orientation?: "horizontal" | "vertical"
  /** @deprecated Use orientation. */
  direction?: "horizontal" | "vertical"
  gap?: number
}

function includesValue(
  values: readonly CheckboxGroupValue[],
  candidate: CheckboxGroupValue
) {
  return values.some((value) => Object.is(value, candidate))
}

const CheckboxGroup = React.forwardRef<HTMLFieldSetElement, CheckboxGroupProps>(
  function CheckboxGroup(
    {
      options,
      value,
      defaultValue = [],
      onValueChange,
      onChange,
      legend,
      description,
      error,
      invalid = false,
      name,
      orientation: orientationProp,
      direction,
      gap,
      disabled = false,
      className,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) {
    const [uncontrolledValue, setUncontrolledValue] = React.useState<
      CheckboxGroupValue[]
    >(() => [...defaultValue])
    const fieldSetRef = React.useRef<HTMLFieldSetElement>(null)
    const generatedId = React.useId()
    const descriptionId = description ? `${generatedId}-description` : undefined
    const errorId = error ? `${generatedId}-error` : undefined
    const describedBy = [ariaDescribedBy, descriptionId, errorId]
      .filter(Boolean)
      .join(" ")
    const selectedValue = value ?? uncontrolledValue
    const orientation = orientationProp ?? direction ?? "horizontal"
    const isInvalid = invalid || Boolean(error)

    React.useEffect(() => {
      if (value !== undefined) return

      const form = fieldSetRef.current?.form
      if (!form) return

      const handleReset = () => setUncontrolledValue([...defaultValue])
      form.addEventListener("reset", handleReset)
      return () => form.removeEventListener("reset", handleReset)
    }, [defaultValue, value])

    const commitValue = React.useCallback(
      (nextValue: CheckboxGroupValue[]) => {
        if (value === undefined) {
          setUncontrolledValue(nextValue)
        }
        onValueChange?.(nextValue)
        if (onChange && onChange !== onValueChange) {
          onChange(nextValue)
        }
      },
      [onChange, onValueChange, value]
    )

    const toggleValue = React.useCallback(
      (optionValue: CheckboxGroupValue, checked: boolean) => {
        const nextValue = checked
          ? includesValue(selectedValue, optionValue)
            ? [...selectedValue]
            : [...selectedValue, optionValue]
          : selectedValue.filter(
              (selected) => !Object.is(selected, optionValue)
            )

        commitValue(nextValue)
      },
      [commitValue, selectedValue]
    )

    return (
      <FieldSet
        ref={(node) => {
          fieldSetRef.current = node
          if (typeof ref === "function") ref(node)
          else if (ref) ref.current = node
        }}
        name={name}
        disabled={disabled}
        data-disabled={disabled || undefined}
        data-invalid={isInvalid || undefined}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy || undefined}
        className={cn(className)}
        {...props}
      >
        {legend && <FieldLegend variant="label">{legend}</FieldLegend>}
        {description && (
          <FieldDescription id={descriptionId}>{description}</FieldDescription>
        )}
        <FieldGroup
          data-slot="checkbox-group"
          className={cn(orientation === "horizontal" && "flex-row flex-wrap")}
          style={gap === undefined ? undefined : { gap }}
        >
          {options.map((option, index) => {
            const checked = includesValue(selectedValue, option.value)
            const optionDisabled = disabled || Boolean(option.disabled)
            const optionId = `${generatedId}-${index}`

            return (
              <Field
                key={`${typeof option.value}:${String(option.value)}:${index}`}
                orientation="horizontal"
                data-disabled={optionDisabled || undefined}
                data-invalid={isInvalid || undefined}
                className={cn(
                  orientation === "horizontal" && "w-auto flex-none"
                )}
              >
                <Checkbox
                  id={optionId}
                  name={name}
                  value={String(option.value)}
                  checked={checked}
                  disabled={optionDisabled}
                  aria-invalid={isInvalid || undefined}
                  onCheckedChange={(nextChecked) => {
                    if (nextChecked !== "indeterminate") {
                      toggleValue(option.value, nextChecked)
                    }
                  }}
                />
                <FieldContent>
                  <FieldLabel htmlFor={optionId}>{option.label}</FieldLabel>
                  {option.description && (
                    <FieldDescription>{option.description}</FieldDescription>
                  )}
                </FieldContent>
              </Field>
            )
          })}
        </FieldGroup>
        {error && <FieldError id={errorId}>{error}</FieldError>}
      </FieldSet>
    )
  }
)

export { CheckboxGroup }
export type {
  CheckboxGroupOption,
  CheckboxGroupProps,
  CheckboxGroupValue,
  CheckboxOption,
}
export default CheckboxGroup

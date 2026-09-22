"use client"

import * as React from "react"
import { XIcon } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@ecoya/design-system/ui/input-group"

type NativeInputValue = React.ComponentPropsWithoutRef<"input">["value"]

export interface ClearableInputProps extends Omit<
  React.ComponentPropsWithoutRef<typeof InputGroupInput>,
  "prefix"
> {
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  clearLabel?: string
  containerClassName?: string
  onClear?: () => void
  onValueChange?: (value: string) => void
}

function assignRef<T>(ref: React.ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") {
    ref(value)
    return
  }

  if (ref) {
    ref.current = value
  }
}

function setNativeInputValue(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set

  valueSetter?.call(input, value)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

const ClearableInput = React.forwardRef<HTMLInputElement, ClearableInputProps>(
  function ClearableInput(
    {
      value,
      defaultValue,
      onChange,
      onValueChange,
      onClear,
      prefix,
      suffix,
      clearLabel = "입력 지우기",
      containerClassName,
      className,
      disabled,
      readOnly,
      id,
      ...props
    },
    forwardedRef
  ) {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const generatedId = React.useId().replaceAll(":", "")
    const controlId = id ?? `clearable-input-${generatedId}`
    const isControlled = value !== undefined
    const [uncontrolledValue, setUncontrolledValue] =
      React.useState<NativeInputValue>(defaultValue ?? "")
    const currentValue = isControlled ? value : uncontrolledValue
    const hasValue = String(currentValue ?? "").length > 0

    React.useEffect(() => {
      if (isControlled) return

      const form = inputRef.current?.form
      if (!form) return

      const handleReset = () => setUncontrolledValue(defaultValue ?? "")
      form.addEventListener("reset", handleReset)
      return () => form.removeEventListener("reset", handleReset)
    }, [defaultValue, isControlled])

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setUncontrolledValue(event.currentTarget.value)
      }
      onChange?.(event)
      onValueChange?.(event.currentTarget.value)
    }

    const handleClear = () => {
      if (disabled || readOnly) return

      const input = inputRef.current
      if (!input) return

      setNativeInputValue(input, "")
      onClear?.()
      input.focus({ preventScroll: true })
    }

    return (
      <InputGroup
        data-slot="clearable-input"
        data-disabled={disabled || undefined}
        data-readonly={readOnly || undefined}
        className={containerClassName}
      >
        {prefix != null ? (
          <InputGroupAddon align="inline-start">
            <InputGroupText>{prefix}</InputGroupText>
          </InputGroupAddon>
        ) : null}
        <InputGroupInput
          {...props}
          ref={(node) => {
            inputRef.current = node
            assignRef(forwardedRef, node)
          }}
          id={controlId}
          value={currentValue}
          disabled={disabled}
          readOnly={readOnly}
          className={className}
          onChange={handleChange}
        />
        {suffix != null || hasValue ? (
          <InputGroupAddon align="inline-end">
            {suffix != null ? <InputGroupText>{suffix}</InputGroupText> : null}
            {hasValue ? (
              <InputGroupButton
                size="icon-xs"
                disabled={disabled || readOnly}
                aria-label={clearLabel}
                aria-controls={controlId}
                onClick={handleClear}
              >
                <XIcon aria-hidden="true" />
              </InputGroupButton>
            ) : null}
          </InputGroupAddon>
        ) : null}
      </InputGroup>
    )
  }
)

export { ClearableInput }

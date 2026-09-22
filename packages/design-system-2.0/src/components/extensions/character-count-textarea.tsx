"use client"

import * as React from "react"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@ecoya/design-system/ui/field"
import { Textarea } from "@ecoya/design-system/ui/textarea"

export interface CharacterCountTextareaProps extends Omit<
  React.ComponentPropsWithoutRef<typeof Textarea>,
  "defaultValue" | "value"
> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  label?: React.ReactNode
  description?: React.ReactNode
  error?: React.ReactNode
  showCount?: boolean
  /** Defaults to 300 for parity with ECOYA's standard text field. */
  formatCharacterCount?: (count: number, maxLength?: number) => string
  fieldClassName?: string
}

function defaultFormatCharacterCount(count: number, maxLength?: number) {
  return maxLength === undefined ? `${count}자` : `${count}/${maxLength}자`
}

function mergeIds(...values: Array<string | undefined>) {
  const ids = values.flatMap(
    (value) => value?.split(/\s+/).filter(Boolean) ?? []
  )
  return [...new Set(ids)].join(" ") || undefined
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

function isAriaInvalid(
  value: React.ComponentPropsWithoutRef<"textarea">["aria-invalid"]
) {
  return (
    value === true ||
    value === "true" ||
    value === "grammar" ||
    value === "spelling"
  )
}

const CharacterCountTextarea = React.forwardRef<
  HTMLTextAreaElement,
  CharacterCountTextareaProps
>(function CharacterCountTextarea(
  {
    value,
    defaultValue = "",
    onChange,
    onValueChange,
    label,
    description,
    error,
    showCount = true,
    formatCharacterCount = defaultFormatCharacterCount,
    fieldClassName,
    disabled,
    id,
    maxLength = 300,
    "aria-describedby": ariaDescribedBy,
    "aria-errormessage": ariaErrorMessage,
    "aria-invalid": ariaInvalid,
    ...props
  },
  forwardedRef
) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const generatedId = React.useId().replaceAll(":", "")
  const controlId = id ?? `character-count-textarea-${generatedId}`
  const descriptionId = `${controlId}-description`
  const countId = `${controlId}-count`
  const errorId = `${controlId}-error`
  const isControlled = value !== undefined
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const currentValue = isControlled ? value : uncontrolledValue
  const hasDescription = description != null
  const hasError = error != null
  const invalid = hasError || isAriaInvalid(ariaInvalid)
  const describedBy = mergeIds(
    ariaDescribedBy,
    hasDescription ? descriptionId : undefined,
    showCount ? countId : undefined,
    hasError ? errorId : undefined
  )

  React.useEffect(() => {
    if (isControlled) return

    const form = textareaRef.current?.form
    if (!form) return

    const handleReset = () => setUncontrolledValue(defaultValue)
    form.addEventListener("reset", handleReset)
    return () => form.removeEventListener("reset", handleReset)
  }, [defaultValue, isControlled])

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isControlled) {
      setUncontrolledValue(event.currentTarget.value)
    }
    onChange?.(event)
    onValueChange?.(event.currentTarget.value)
  }

  return (
    <Field
      data-slot="character-count-textarea"
      data-disabled={disabled || undefined}
      data-invalid={invalid || undefined}
      className={fieldClassName}
    >
      {label != null ? (
        <FieldLabel htmlFor={controlId}>{label}</FieldLabel>
      ) : null}
      <Textarea
        {...props}
        ref={(node) => {
          textareaRef.current = node
          assignRef(forwardedRef, node)
        }}
        id={controlId}
        value={currentValue}
        disabled={disabled}
        maxLength={maxLength}
        aria-describedby={describedBy}
        aria-errormessage={hasError ? errorId : ariaErrorMessage}
        aria-invalid={hasError ? true : ariaInvalid}
        onChange={handleChange}
      />
      {hasDescription ? (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      ) : null}
      {showCount ? (
        <FieldDescription id={countId} className="self-end tabular-nums">
          {formatCharacterCount(currentValue.length, maxLength)}
        </FieldDescription>
      ) : null}
      {hasError ? <FieldError id={errorId}>{error}</FieldError> : null}
    </Field>
  )
})

export { CharacterCountTextarea }

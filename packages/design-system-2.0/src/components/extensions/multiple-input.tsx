"use client"

import * as React from "react"
import { XIcon } from "lucide-react"

import { Badge } from "@ecoya/design-system/ui/badge"
import { Field, FieldError } from "@ecoya/design-system/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@ecoya/design-system/ui/input-group"

export type MultipleInputDuplicatePolicy = "allow" | "ignore" | "reject"

export type MultipleInputValidationResult = boolean | string | null | undefined

export type MultipleInputRejectReason = "duplicate" | "invalid"

export interface MultipleInputRejection {
  value: string
  reason: MultipleInputRejectReason
  message: string
}

export interface MultipleInputProps extends Omit<
  React.ComponentProps<typeof InputGroupInput>,
  "children" | "className" | "defaultValue" | "onClick" | "value"
> {
  value?: readonly string[]
  defaultValue?: readonly string[]
  onValueChange?: (value: string[]) => void
  inputValue?: string
  defaultInputValue?: string
  onInputValueChange?: (value: string) => void
  validate?: (
    value: string,
    currentValues: readonly string[]
  ) => MultipleInputValidationResult
  duplicatePolicy?: MultipleInputDuplicatePolicy
  commitOnBlur?: boolean
  onValueRejected?: (rejection: MultipleInputRejection) => void
  getDuplicateMessage?: (value: string) => string
  invalidMessage?: string
  getRemoveLabel?: (value: string, index: number) => string
  valuesLabel?: string
  onClick?: React.MouseEventHandler<HTMLDivElement>
  className?: string
  inputClassName?: string
}

const defaultDuplicateMessage = (value: string) =>
  `이미 추가된 값입니다: ${value}`

const defaultRemoveLabel = (value: string) => `${value} 삭제`

const EMPTY_VALUES: readonly string[] = []

function MultipleInput({
  value,
  defaultValue = EMPTY_VALUES,
  onValueChange,
  inputValue,
  defaultInputValue = "",
  onInputValueChange,
  validate,
  duplicatePolicy = "ignore",
  commitOnBlur = true,
  onValueRejected,
  getDuplicateMessage = defaultDuplicateMessage,
  invalidMessage = "유효하지 않은 값입니다.",
  getRemoveLabel = defaultRemoveLabel,
  valuesLabel = "입력된 값",
  className,
  inputClassName,
  disabled,
  readOnly,
  required,
  name,
  onChange,
  onBlur,
  onClick,
  onKeyDown,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...inputProps
}: MultipleInputProps) {
  const inputGroupRef = React.useRef<HTMLDivElement>(null)
  const [uncontrolledValues, setUncontrolledValues] = React.useState<string[]>(
    () => [...defaultValue]
  )
  const [uncontrolledInputValue, setUncontrolledInputValue] =
    React.useState(defaultInputValue)
  const [validationError, setValidationError] = React.useState<string | null>(
    null
  )
  const generatedId = React.useId()
  const errorId = `${generatedId}-error`

  const currentValues = value === undefined ? uncontrolledValues : value
  const currentInputValue =
    inputValue === undefined ? uncontrolledInputValue : inputValue
  const isExternallyInvalid =
    ariaInvalid === true ||
    ariaInvalid === "true" ||
    ariaInvalid === "grammar" ||
    ariaInvalid === "spelling"
  const isInvalid = isExternallyInvalid || Boolean(validationError)
  const describedBy = [ariaDescribedBy, validationError ? errorId : undefined]
    .filter(Boolean)
    .join(" ")

  React.useEffect(() => {
    const form = inputGroupRef.current?.closest("form")
    if (!form) return

    const handleReset = () => {
      if (value === undefined) setUncontrolledValues([...defaultValue])
      if (inputValue === undefined) {
        setUncontrolledInputValue(defaultInputValue)
      }
      setValidationError(null)
    }

    form.addEventListener("reset", handleReset)
    return () => form.removeEventListener("reset", handleReset)
  }, [defaultInputValue, defaultValue, inputValue, value])

  const updateValues = (nextValues: string[]) => {
    if (value === undefined) {
      setUncontrolledValues(nextValues)
    }
    onValueChange?.(nextValues)
  }

  const updateInputValue = (nextValue: string) => {
    if (inputValue === undefined) {
      setUncontrolledInputValue(nextValue)
    }
    onInputValueChange?.(nextValue)
  }

  const rejectValue = (
    rejectedValue: string,
    reason: MultipleInputRejectReason,
    message: string
  ) => {
    onValueRejected?.({ value: rejectedValue, reason, message })
  }

  const commitInput = (rawValue: string) => {
    if (disabled || readOnly) {
      return false
    }

    const candidates = rawValue
      .split(",")
      .map((candidate) => candidate.trim())
      .filter(Boolean)

    if (candidates.length === 0) {
      return false
    }

    const nextValues = [...currentValues]
    const rejectedValues: string[] = []
    let firstError: string | null = null
    let didChange = false

    for (const candidate of candidates) {
      const isDuplicate = nextValues.includes(candidate)

      if (isDuplicate && duplicatePolicy !== "allow") {
        if (duplicatePolicy === "reject") {
          const message = getDuplicateMessage(candidate)
          firstError ??= message
          rejectedValues.push(candidate)
          rejectValue(candidate, "duplicate", message)
        }
        continue
      }

      const validationResult = validate?.(candidate, nextValues)
      const candidateError =
        validationResult === false
          ? invalidMessage
          : typeof validationResult === "string" && validationResult.length > 0
            ? validationResult
            : null

      if (candidateError) {
        firstError ??= candidateError
        rejectedValues.push(candidate)
        rejectValue(candidate, "invalid", candidateError)
        continue
      }

      nextValues.push(candidate)
      didChange = true
    }

    if (didChange) {
      updateValues(nextValues)
    }

    updateInputValue(rejectedValues.join(", "))
    setValidationError(firstError)

    return true
  }

  const removeValue = (index: number) => {
    if (disabled || readOnly) {
      return
    }

    updateValues(currentValues.filter((_, valueIndex) => valueIndex !== index))
    setValidationError(null)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event)
    updateInputValue(event.currentTarget.value)
    setValidationError(null)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event)

    if (event.defaultPrevented || event.nativeEvent.isComposing) {
      return
    }

    if (event.key === ",") {
      event.preventDefault()
      commitInput(currentInputValue)
      return
    }

    if (event.key === "Enter" && currentInputValue.trim()) {
      event.preventDefault()
      commitInput(currentInputValue)
      return
    }

    if (
      event.key === "Backspace" &&
      currentInputValue.length === 0 &&
      currentValues.length > 0 &&
      !disabled &&
      !readOnly
    ) {
      event.preventDefault()
      removeValue(currentValues.length - 1)
    }
  }

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(event)
    if (!event.defaultPrevented && commitOnBlur) {
      commitInput(currentInputValue)
    }
  }

  return (
    <Field data-disabled={disabled || undefined} data-invalid={isInvalid}>
      <InputGroup ref={inputGroupRef} className={className} onClick={onClick}>
        {name
          ? currentValues.map((item, index) => (
              <input
                key={`${name}-${item}-${index}`}
                type="hidden"
                name={name}
                value={item}
                disabled={disabled}
              />
            ))
          : null}
        {currentValues.length > 0 ? (
          <InputGroupAddon
            align="block-start"
            role="list"
            aria-label={valuesLabel}
            className="flex-wrap gap-1"
          >
            {currentValues.map((item, index) => (
              <Badge
                key={`${item}-${index}`}
                variant="secondary"
                role="listitem"
                className="h-[var(--control-size-xs)] max-w-full gap-0.5 py-0 pr-0.5 pl-2"
              >
                <span className="truncate">{item}</span>
                <InputGroupButton
                  size="icon-xs"
                  aria-label={getRemoveLabel(item, index)}
                  disabled={disabled || readOnly}
                  onClick={() => {
                    inputGroupRef.current
                      ?.querySelector<HTMLInputElement>(
                        '[data-slot="input-group-control"]'
                      )
                      ?.focus()
                    removeValue(index)
                  }}
                >
                  <XIcon aria-hidden="true" />
                </InputGroupButton>
              </Badge>
            ))}
          </InputGroupAddon>
        ) : null}
        <InputGroupInput
          {...inputProps}
          value={currentInputValue}
          name={undefined}
          disabled={disabled}
          readOnly={readOnly}
          required={required && currentValues.length === 0}
          aria-describedby={describedBy || undefined}
          aria-invalid={validationError ? true : ariaInvalid}
          className={inputClassName}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      </InputGroup>
      {validationError ? (
        <FieldError id={errorId}>{validationError}</FieldError>
      ) : null}
    </Field>
  )
}

export { MultipleInput }

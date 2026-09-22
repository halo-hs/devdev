"use client"

import * as React from "react"
import { MinusIcon, PlusIcon } from "lucide-react"

import { ButtonGroup, ButtonGroupText } from "@ecoya/design-system/ui/button-group"
import { Button } from "@ecoya/design-system/ui/button"

type QuantityStepperContainerProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "defaultValue" | "onChange"
>

export interface QuantityStepperProps extends QuantityStepperContainerProps {
  value?: number
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  onValueChange?: (value: number) => void
  /** Legacy callback invoked after a successful decrement. */
  onDecrement?: () => void
  /** Legacy callback invoked after a successful increment. */
  onIncrement?: () => void
  /** Legacy override for an externally determined lower boundary. */
  isMin?: boolean
  /** Legacy override for an externally determined upper boundary. */
  isMax?: boolean
  decrementLabel?: string
  incrementLabel?: string
  valueLabel?: string
  formatValue?: (value: number) => React.ReactNode
  name?: string
}

function normalizeFinite(value: number | undefined, fallback: number) {
  return Number.isFinite(value) ? (value as number) : fallback
}

function decimalPlaces(value: number) {
  const [, fraction = ""] = String(value).split(".")
  return fraction.length
}

function roundForStep(value: number, step: number) {
  const precision = Math.min(10, decimalPlaces(step))
  return Number(value.toFixed(precision))
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}

function QuantityStepper({
  value,
  defaultValue = 0,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  disabled = false,
  onValueChange,
  onDecrement,
  onIncrement,
  isMin = false,
  isMax = false,
  decrementLabel = "수량 줄이기",
  incrementLabel = "수량 늘리기",
  valueLabel = "수량",
  formatValue = String,
  name,
  className,
  ...props
}: QuantityStepperProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const minimum = normalizeFinite(min, 0)
  const maximum = normalizeFinite(max, Number.POSITIVE_INFINITY)
  const normalizedStep = Math.abs(normalizeFinite(step, 1)) || 1
  const boundsAreValid = minimum <= maximum
  const initialValue = boundsAreValid
    ? clamp(normalizeFinite(defaultValue, minimum), minimum, maximum)
    : normalizeFinite(defaultValue, 0)
  const [uncontrolledValue, setUncontrolledValue] = React.useState(initialValue)
  const isControlled = value !== undefined
  const requestedValue = normalizeFinite(
    isControlled ? value : uncontrolledValue,
    initialValue
  )
  const currentValue = boundsAreValid
    ? clamp(requestedValue, minimum, maximum)
    : requestedValue
  const generatedId = React.useId().replaceAll(":", "")
  const valueId = `quantity-stepper-${generatedId}-value`
  const decrementDisabled =
    disabled || !boundsAreValid || isMin || currentValue <= minimum
  const incrementDisabled =
    disabled || !boundsAreValid || isMax || currentValue >= maximum

  React.useEffect(() => {
    if (isControlled) return
    const form = containerRef.current?.closest("form")
    if (!form) return

    const handleReset = () => setUncontrolledValue(initialValue)
    form.addEventListener("reset", handleReset)
    return () => form.removeEventListener("reset", handleReset)
  }, [initialValue, isControlled])

  const commitValue = (
    direction: "decrement" | "increment",
    nextValue: number
  ) => {
    if (disabled || !boundsAreValid || Object.is(nextValue, currentValue))
      return

    if (!isControlled) setUncontrolledValue(nextValue)
    onValueChange?.(nextValue)
    if (direction === "decrement") onDecrement?.()
    else onIncrement?.()
  }

  const decrement = () => {
    if (decrementDisabled) return
    const nextValue = clamp(
      roundForStep(currentValue - normalizedStep, normalizedStep),
      minimum,
      maximum
    )
    commitValue("decrement", nextValue)
  }

  const increment = () => {
    if (incrementDisabled) return
    const nextValue = clamp(
      roundForStep(currentValue + normalizedStep, normalizedStep),
      minimum,
      maximum
    )
    commitValue("increment", nextValue)
  }

  return (
    <ButtonGroup
      {...props}
      ref={containerRef}
      aria-label={props["aria-label"] ?? valueLabel}
      data-slot="quantity-stepper"
      data-disabled={disabled || undefined}
      data-invalid={!boundsAreValid || undefined}
      className={className}
    >
      {name && (
        <input
          type="hidden"
          name={name}
          value={currentValue}
          disabled={disabled}
        />
      )}
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={decrementDisabled}
        aria-label={decrementLabel}
        aria-controls={valueId}
        onClick={decrement}
      >
        <MinusIcon aria-hidden="true" />
      </Button>
      <ButtonGroupText asChild className="min-w-14 justify-center tabular-nums">
        <output
          id={valueId}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-label={`${valueLabel}: ${currentValue}`}
        >
          {formatValue(currentValue)}
        </output>
      </ButtonGroupText>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={incrementDisabled}
        aria-label={incrementLabel}
        aria-controls={valueId}
        onClick={increment}
      >
        <PlusIcon aria-hidden="true" />
      </Button>
    </ButtonGroup>
  )
}

export { QuantityStepper }
export default QuantityStepper

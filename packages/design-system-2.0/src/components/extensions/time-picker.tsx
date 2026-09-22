"use client"

import * as React from "react"
import { format as formatDate } from "date-fns"
import { Clock3Icon, RotateCcwIcon, XIcon } from "lucide-react"

import { TimePickerDraftSyncContext } from "@ecoya/design-system/extensions/time-picker-sync-context"
import { Button } from "@ecoya/design-system/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@ecoya/design-system/ui/field"
import { Input } from "@ecoya/design-system/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@ecoya/design-system/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@ecoya/design-system/ui/toggle-group"
import { cn } from "@ecoya/design-system/lib/utils"

type TimePeriod = "AM" | "PM"

type TimePickerContainerProps = Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onBlur" | "onChange"
>

export interface TimePickerProps extends TimePickerContainerProps {
  value?: Date | null
  defaultValue?: Date | null
  onChange?: (value: Date | null, formattedValue: string | null) => void
  onBlur?: () => void
  placeholder?: string
  format?: string
  disabled?: boolean
  allowClear?: boolean
  use12Hours?: boolean
  hourStep?: number
  minuteStep?: number
  min?: Date
  max?: Date
  minTime?: Date
  maxTime?: Date
  minHour?: number
  maxHour?: number
  /** Date whose local-time rules apply when no value has been selected yet. */
  referenceDate?: Date
  showNow?: boolean
  ariaLabel?: string
  hourLabel?: string
  minuteLabel?: string
  periodLabel?: string
  invalidMessage?: React.ReactNode
  name?: string
  form?: string
  required?: boolean
}

type TimeDraft = {
  hour: string
  minute: string
  period: TimePeriod
}

function isUsableDate(value: Date | null | undefined): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime())
}

function cloneDate(value: Date): Date {
  return new Date(value.getTime())
}

function clampInteger(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(Math.trunc(value), minimum), maximum)
}

function normalizeStep(value: number | undefined, maximum: number): number {
  if (!Number.isFinite(value) || !value || value < 1) return 1
  return clampInteger(value, 1, maximum)
}

function toMillisecondOfDay(value: Date): number {
  return (
    ((value.getHours() * 60 + value.getMinutes()) * 60 + value.getSeconds()) *
      1000 +
    value.getMilliseconds()
  )
}

function isWithinTimeBounds(
  minuteOfDay: number,
  minimumTimeOfDay?: number,
  maximumTimeOfDay?: number
): boolean {
  const candidate = minuteOfDay * 60 * 1000

  if (minimumTimeOfDay === undefined && maximumTimeOfDay === undefined) {
    return true
  }
  if (minimumTimeOfDay === undefined) {
    return candidate <= (maximumTimeOfDay as number)
  }
  if (maximumTimeOfDay === undefined) return candidate >= minimumTimeOfDay

  if (minimumTimeOfDay <= maximumTimeOfDay) {
    return candidate >= minimumTimeOfDay && candidate <= maximumTimeOfDay
  }

  // A minimum later than the maximum represents an overnight window.
  return candidate >= minimumTimeOfDay || candidate <= maximumTimeOfDay
}

function setLocalTime(value: Date, minuteOfDay: number): Date | null {
  if (
    !Number.isInteger(minuteOfDay) ||
    minuteOfDay < 0 ||
    minuteOfDay >= 1440
  ) {
    return null
  }

  const nextValue = cloneDate(value)
  const year = value.getFullYear()
  const month = value.getMonth()
  const day = value.getDate()
  const hour = Math.floor(minuteOfDay / 60)
  const minute = minuteOfDay % 60

  nextValue.setHours(hour, minute, 0, 0)

  // Local times skipped by a daylight-saving transition are normalized by
  // Date. Reject that normalization instead of returning a different time.
  if (
    nextValue.getFullYear() !== year ||
    nextValue.getMonth() !== month ||
    nextValue.getDate() !== day ||
    nextValue.getHours() !== hour ||
    nextValue.getMinutes() !== minute
  ) {
    return null
  }

  return nextValue
}

function toDisplayHour(hour: number, use12Hours: boolean): number {
  if (!use12Hours) return hour
  return hour % 12 || 12
}

function toActualHour(
  displayHour: number,
  period: TimePeriod,
  use12Hours: boolean
): number {
  if (!use12Hours) return displayHour
  const normalizedHour = displayHour % 12
  return period === "PM" ? normalizedHour + 12 : normalizedHour
}

function isHourOnStep(
  actualHour: number,
  use12Hours: boolean,
  hourStep: number
): boolean {
  if (!use12Hours) return actualHour % hourStep === 0
  return (toDisplayHour(actualHour, true) - 1) % hourStep === 0
}

function buildAllowedMinutes({
  use12Hours,
  hourStep,
  minuteStep,
  minHour,
  maxHour,
  minimumTimeOfDay,
  maximumTimeOfDay,
  minimumTimestamp,
  maximumTimestamp,
  referenceDate,
}: {
  use12Hours: boolean
  hourStep: number
  minuteStep: number
  minHour: number
  maxHour: number
  minimumTimeOfDay?: number
  maximumTimeOfDay?: number
  minimumTimestamp?: number
  maximumTimestamp?: number
  referenceDate: Date
}): number[] {
  const values: number[] = []

  for (let hour = minHour; hour <= maxHour; hour += 1) {
    if (!isHourOnStep(hour, use12Hours, hourStep)) continue

    for (let minute = 0; minute < 60; minute += minuteStep) {
      const minuteOfDay = hour * 60 + minute
      if (
        !isWithinTimeBounds(minuteOfDay, minimumTimeOfDay, maximumTimeOfDay)
      ) {
        continue
      }

      const candidate = setLocalTime(referenceDate, minuteOfDay)
      if (!candidate) continue
      const candidateTimestamp = candidate.getTime()
      if (
        minimumTimestamp !== undefined &&
        candidateTimestamp < minimumTimestamp
      )
        continue
      if (
        maximumTimestamp !== undefined &&
        candidateTimestamp > maximumTimestamp
      )
        continue

      values.push(minuteOfDay)
    }
  }

  return values
}

function closestAllowedMinute(
  target: number,
  allowedMinutes: readonly number[]
): number | null {
  if (allowedMinutes.length === 0) return null

  return allowedMinutes.reduce((closest, candidate) =>
    Math.abs(candidate - target) < Math.abs(closest - target)
      ? candidate
      : closest
  )
}

function normalizeFormatPattern(pattern: string): string {
  return pattern
    .replaceAll("YYYY", "yyyy")
    .replaceAll("YY", "yy")
    .replaceAll("DD", "dd")
    .replaceAll("A", "a")
}

function formatTime(value: Date, pattern: string): string {
  try {
    return formatDate(value, normalizeFormatPattern(pattern))
  } catch {
    return formatDate(value, "HH:mm")
  }
}

function draftFromMinute(minuteOfDay: number, use12Hours: boolean): TimeDraft {
  const hour = Math.floor(minuteOfDay / 60)
  const minute = minuteOfDay % 60

  return {
    hour: String(toDisplayHour(hour, use12Hours)).padStart(2, "0"),
    minute: String(minute).padStart(2, "0"),
    period: hour >= 12 ? "PM" : "AM",
  }
}

const pickerTriggerClassName =
  "h-[var(--control-size-md)]! rounded-[var(--r-md)]! border-[var(--control-border)]! bg-[var(--control-background)]! px-4! py-2! text-[length:var(--text-body-7)] leading-[var(--leading-body-7)] font-normal! text-[var(--control-foreground)]! shadow-[var(--shadow-input)]! hover:border-[var(--control-border-hover)]! hover:bg-[var(--control-background-hover)]! hover:text-[var(--control-foreground)]! hover:shadow-[var(--shadow-input-hover)]! active:border-[var(--control-border-active)]! active:bg-[var(--control-background-active)]! active:shadow-[var(--shadow-input-active)]! active:focus-visible:shadow-[var(--shadow-input-focused)]! focus-visible:border-[var(--control-focus-border)]! focus-visible:shadow-[var(--shadow-input-focused)]! focus-visible:ring-0! aria-expanded:border-[var(--control-focus-border)]! aria-expanded:bg-[var(--control-background-open)]! aria-expanded:shadow-[var(--shadow-input-open)]! aria-expanded:focus-visible:shadow-[var(--shadow-input-focused)]! aria-invalid:border-[var(--control-invalid-border)]! aria-invalid:shadow-[var(--shadow-input)]! aria-invalid:focus-visible:shadow-[var(--shadow-input-invalid-focused)]! aria-invalid:active:border-[var(--control-invalid-border)]! aria-invalid:active:shadow-[var(--shadow-input-invalid-active)]! aria-invalid:active:focus-visible:shadow-[var(--shadow-input-invalid-focused)]! aria-invalid:aria-expanded:border-[var(--control-invalid-border)]! aria-invalid:aria-expanded:shadow-[var(--shadow-input-invalid-open)]! aria-invalid:aria-expanded:focus-visible:shadow-[var(--shadow-input-invalid-focused)]! disabled:border-[var(--control-disabled-border)]! disabled:bg-[var(--control-disabled-background)]! disabled:text-[var(--control-disabled-foreground)]! disabled:shadow-[var(--shadow-input)]! data-[empty=true]:text-[var(--control-placeholder)]!"

function minuteFromDraft(
  draft: TimeDraft,
  use12Hours: boolean,
  allowedMinutes: readonly number[]
): number | null {
  if (draft.hour.trim() === "" || draft.minute.trim() === "") return null

  const hour = Number(draft.hour)
  const minute = Number(draft.minute)
  const minimumHour = use12Hours ? 1 : 0
  const maximumHour = use12Hours ? 12 : 23

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < minimumHour ||
    hour > maximumHour ||
    minute < 0 ||
    minute > 59
  ) {
    return null
  }

  const actualHour = toActualHour(hour, draft.period, use12Hours)
  const minuteOfDay = actualHour * 60 + minute
  return allowedMinutes.includes(minuteOfDay) ? minuteOfDay : null
}

const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(
  function TimePicker(
    {
      value,
      defaultValue = null,
      onChange,
      onBlur,
      placeholder,
      format,
      disabled = false,
      allowClear = true,
      use12Hours = false,
      hourStep: requestedHourStep = 1,
      minuteStep: requestedMinuteStep = 1,
      min,
      max,
      minTime,
      maxTime,
      minHour: requestedMinHour = 0,
      maxHour: requestedMaxHour = 23,
      referenceDate: requestedReferenceDate,
      showNow = true,
      ariaLabel = "Choose time",
      hourLabel = "Hour",
      minuteLabel = "Minute",
      periodLabel = "Period",
      invalidMessage = "Choose a time within the allowed range and step.",
      name,
      form: formId,
      required = false,
      className,
      id,
      style,
      "aria-invalid": ariaInvalid,
      onFocusCapture: onFocusCaptureProp,
      onBlurCapture: onBlurCaptureProp,
      ...containerProps
    },
    ref
  ) {
    const [internalValue, setInternalValue] = React.useState<Date | null>(() =>
      isUsableDate(defaultValue) ? cloneDate(defaultValue) : null
    )
    const [open, setOpen] = React.useState(false)
    const [draft, setDraft] = React.useState<TimeDraft>({
      hour: "00",
      minute: "00",
      period: "AM",
    })
    const [draftSyncRevision, setDraftSyncRevision] = React.useState(0)
    const inheritedDraftSyncRevision = React.useContext(
      TimePickerDraftSyncContext
    )
    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const formControlRef = React.useRef<HTMLInputElement | null>(null)
    const triggerRef = React.useRef<HTMLButtonElement | null>(null)
    const blurTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
      null
    )
    const hasFocusWithinRef = React.useRef(false)

    const generatedId = React.useId()
    const fieldId = id ?? `time-picker-${generatedId.replaceAll(":", "")}`
    const errorId = `${fieldId}-error`
    const isControlled = value !== undefined
    const selectedValue = isUsableDate(isControlled ? value : internalValue)
      ? cloneDate(isControlled ? (value as Date) : (internalValue as Date))
      : null
    const hourStep = normalizeStep(requestedHourStep, 12)
    const minuteStep = normalizeStep(requestedMinuteStep, 60)
    const minHour = clampInteger(requestedMinHour, 0, 23)
    const maxHour = clampInteger(requestedMaxHour, 0, 23)
    // `minTime`/`maxTime` are recurring clock-time constraints and may cross
    // midnight. `min`/`max` are exact timestamps on the reference date.
    const minimumTimeOfDay = isUsableDate(minTime)
      ? toMillisecondOfDay(minTime)
      : undefined
    const maximumTimeOfDay = isUsableDate(maxTime)
      ? toMillisecondOfDay(maxTime)
      : undefined
    const minimumTimestamp = isUsableDate(min) ? min.getTime() : undefined
    const maximumTimestamp = isUsableDate(max) ? max.getTime() : undefined
    const boundsAreValid = minHour <= maxHour
    const selectedTimestamp = selectedValue?.getTime()
    const requestedReferenceTimestamp = isUsableDate(requestedReferenceDate)
      ? requestedReferenceDate.getTime()
      : undefined
    const referenceDate = React.useMemo(
      () =>
        new Date(
          selectedTimestamp ?? requestedReferenceTimestamp ?? Date.now()
        ),
      [requestedReferenceTimestamp, selectedTimestamp]
    )
    const draftTargetMinute = selectedValue
      ? selectedValue.getHours() * 60 + selectedValue.getMinutes()
      : referenceDate.getHours() * 60 + referenceDate.getMinutes()
    const allowedMinutes = React.useMemo(
      () =>
        boundsAreValid
          ? buildAllowedMinutes({
              use12Hours,
              hourStep,
              minuteStep,
              minHour,
              maxHour,
              minimumTimeOfDay,
              maximumTimeOfDay,
              minimumTimestamp,
              maximumTimestamp,
              referenceDate,
            })
          : [],
      [
        boundsAreValid,
        hourStep,
        maxHour,
        maximumTimeOfDay,
        maximumTimestamp,
        minHour,
        minimumTimeOfDay,
        minimumTimestamp,
        minuteStep,
        referenceDate,
        use12Hours,
      ]
    )
    const candidateMinute = minuteFromDraft(draft, use12Hours, allowedMinutes)
    const draftIsInvalid = candidateMinute === null
    const displayFormat = format ?? (use12Hours ? "hh:mm a" : "HH:mm")
    const displayValue = selectedValue
      ? formatTime(selectedValue, displayFormat)
      : null
    const serializedValue = selectedValue
      ? formatTime(selectedValue, "HH:mm")
      : ""

    React.useEffect(() => {
      const form = formControlRef.current?.form
      if (!form) return

      const handleReset = () => {
        if (!isControlled) {
          setInternalValue(
            isUsableDate(defaultValue) ? cloneDate(defaultValue) : null
          )
        }
        setDraftSyncRevision((revision) => revision + 1)
      }
      form.addEventListener("reset", handleReset)
      return () => form.removeEventListener("reset", handleReset)
    }, [defaultValue, formId, isControlled])

    const commitValue = React.useCallback(
      (nextValue: Date | null) => {
        const normalizedValue = isUsableDate(nextValue)
          ? cloneDate(nextValue)
          : null

        if (!isControlled) {
          setInternalValue(normalizedValue ? cloneDate(normalizedValue) : null)
        }
        onChange?.(
          normalizedValue ? cloneDate(normalizedValue) : null,
          normalizedValue ? formatTime(normalizedValue, displayFormat) : null
        )
      },
      [displayFormat, isControlled, onChange]
    )

    const resetDraft = React.useCallback(() => {
      const nextMinute = closestAllowedMinute(draftTargetMinute, allowedMinutes)
      setDraft(draftFromMinute(nextMinute ?? 0, use12Hours))
    }, [allowedMinutes, draftTargetMinute, use12Hours])

    const handleOpenChange = (nextOpen: boolean) => {
      if (disabled && nextOpen) return
      if (nextOpen) resetDraft()
      setOpen(nextOpen)
    }

    React.useEffect(() => {
      if (!open) return
      resetDraft()
    }, [draftSyncRevision, inheritedDraftSyncRevision, open, resetDraft])

    const closePicker = () => {
      setOpen(false)
    }

    const handleConfirm = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (candidateMinute === null) return

      const nextValue = setLocalTime(
        selectedValue ?? referenceDate,
        candidateMinute
      )
      if (!nextValue) return
      commitValue(nextValue)
      closePicker()
    }

    const handleNow = () => {
      const now = new Date()
      const nextMinute = closestAllowedMinute(
        now.getHours() * 60 + now.getMinutes(),
        allowedMinutes
      )
      if (nextMinute === null) return

      const nextValue = setLocalTime(selectedValue ?? referenceDate, nextMinute)
      if (!nextValue) return
      commitValue(nextValue)
      closePicker()
    }

    const handleClear = () => {
      commitValue(null)
      closePicker()
    }

    const clearBlurTimer = React.useCallback(() => {
      if (blurTimerRef.current !== null) {
        clearTimeout(blurTimerRef.current)
        blurTimerRef.current = null
      }
    }, [])

    React.useEffect(() => clearBlurTimer, [clearBlurTimer])

    const isWithinPicker = React.useCallback(
      (node: Element | null) => {
        if (!node) return false
        return Boolean(
          containerRef.current?.contains(node) ||
          document.getElementById(`${fieldId}-content`)?.contains(node)
        )
      },
      [fieldId]
    )

    const handleFocusCapture = (event: React.FocusEvent<HTMLDivElement>) => {
      onFocusCaptureProp?.(event)
      clearBlurTimer()
      hasFocusWithinRef.current = true
    }

    const handleBlurCapture = (event: React.FocusEvent<HTMLDivElement>) => {
      onBlurCaptureProp?.(event)
      clearBlurTimer()
      blurTimerRef.current = setTimeout(() => {
        blurTimerRef.current = null
        if (isWithinPicker(document.activeElement)) return
        if (hasFocusWithinRef.current) {
          hasFocusWithinRef.current = false
          onBlur?.()
        }
      }, 0)
    }

    return (
      <div
        ref={(node) => {
          containerRef.current = node
          if (typeof ref === "function") ref(node)
          else if (ref) ref.current = node
        }}
        id={id}
        data-slot="time-picker"
        data-disabled={disabled || undefined}
        data-invalid={ariaInvalid || undefined}
        className={cn("inline-flex", className)}
        style={style}
        onFocusCapture={handleFocusCapture}
        onBlurCapture={handleBlurCapture}
        {...containerProps}
      >
        <input
          ref={formControlRef}
          data-slot="time-picker-form-control"
          id={`${fieldId}-form-control`}
          type="time"
          name={name}
          form={formId}
          value={serializedValue}
          required={required}
          disabled={disabled}
          tabIndex={-1}
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid}
          aria-hidden="true"
          className="sr-only"
          onChange={() => {}}
          onFocus={() => triggerRef.current?.focus()}
        />
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              ref={triggerRef}
              id={`${fieldId}-trigger`}
              type="button"
              variant="outline"
              size="lg"
              disabled={disabled}
              aria-label={
                displayValue ? `${ariaLabel}: ${displayValue}` : ariaLabel
              }
              aria-invalid={ariaInvalid}
              data-empty={!displayValue}
              className={cn("min-w-32 justify-start", pickerTriggerClassName)}
            >
              <Clock3Icon data-icon="inline-start" />
              <span className="truncate">
                {displayValue ??
                  placeholder ??
                  (use12Hours ? "hh:mm AM" : "HH:mm")}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            id={`${fieldId}-content`}
            align="start"
            className="w-auto"
          >
            <form className="flex flex-col gap-3" onSubmit={handleConfirm}>
              <FieldGroup className="flex-row gap-2">
                <Field data-invalid={draftIsInvalid || undefined}>
                  <FieldLabel htmlFor={`${fieldId}-hour`}>
                    {hourLabel}
                  </FieldLabel>
                  <Input
                    id={`${fieldId}-hour`}
                    type="number"
                    inputMode="numeric"
                    min={use12Hours ? 1 : 0}
                    max={use12Hours ? 12 : 23}
                    step={hourStep}
                    value={draft.hour}
                    aria-invalid={draftIsInvalid}
                    aria-describedby={draftIsInvalid ? errorId : undefined}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        hour: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field data-invalid={draftIsInvalid || undefined}>
                  <FieldLabel htmlFor={`${fieldId}-minute`}>
                    {minuteLabel}
                  </FieldLabel>
                  <Input
                    id={`${fieldId}-minute`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={59}
                    step={minuteStep}
                    value={draft.minute}
                    aria-invalid={draftIsInvalid}
                    aria-describedby={draftIsInvalid ? errorId : undefined}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        minute: event.target.value,
                      }))
                    }
                  />
                </Field>
                {use12Hours && (
                  <Field>
                    <FieldLabel id={`${fieldId}-period-label`}>
                      {periodLabel}
                    </FieldLabel>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      spacing={0}
                      value={draft.period}
                      aria-labelledby={`${fieldId}-period-label`}
                      onValueChange={(nextPeriod) => {
                        if (nextPeriod === "AM" || nextPeriod === "PM") {
                          setDraft((current) => ({
                            ...current,
                            period: nextPeriod,
                          }))
                        }
                      }}
                    >
                      <ToggleGroupItem value="AM">AM</ToggleGroupItem>
                      <ToggleGroupItem value="PM">PM</ToggleGroupItem>
                    </ToggleGroup>
                  </Field>
                )}
              </FieldGroup>

              {draftIsInvalid && (
                <Field data-invalid>
                  <FieldError id={errorId}>{invalidMessage}</FieldError>
                </Field>
              )}

              <div className="flex flex-wrap justify-end gap-2">
                {allowClear && selectedValue && (
                  <Button type="button" variant="ghost" onClick={handleClear}>
                    <XIcon data-icon="inline-start" />
                    Clear
                  </Button>
                )}
                {showNow && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={allowedMinutes.length === 0}
                    onClick={handleNow}
                  >
                    <RotateCcwIcon data-icon="inline-start" />
                    Now
                  </Button>
                )}
                <Button type="submit" disabled={draftIsInvalid}>
                  Apply
                </Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>
      </div>
    )
  }
)

TimePicker.displayName = "TimePicker"

export { TimePicker }

"use client"

import * as React from "react"
import { endOfDay, format as formatDate, startOfDay } from "date-fns"
import { CalendarIcon, XIcon } from "lucide-react"

import { TimePicker } from "@ecoya/design-system/extensions/time-picker"
import { TimePickerDraftSyncContext } from "@ecoya/design-system/extensions/time-picker-sync-context"
import { Button } from "@ecoya/design-system/ui/button"
import { Calendar } from "@ecoya/design-system/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@ecoya/design-system/ui/popover"
import { cn } from "@ecoya/design-system/lib/utils"

type DateTimePickerContainerProps = Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onBlur" | "onChange"
>

export interface DateTimePickerProps extends DateTimePickerContainerProps {
  value?: Date | null
  defaultValue?: Date | null
  onChange?: (value: Date | null, formattedValue: string | null) => void
  onBlur?: () => void
  datePlaceholder?: string
  timePlaceholder?: string
  dateFormat?: string
  timeFormat?: string
  disabled?: boolean
  allowClear?: boolean
  minDate?: Date
  maxDate?: Date
  min?: Date
  max?: Date
  use12Hours?: boolean
  hourStep?: number
  minuteStep?: number
  minHour?: number
  maxHour?: number
  showNow?: boolean
  dateAriaLabel?: string
  timeAriaLabel?: string
  name?: string
  form?: string
  required?: boolean
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

function normalizeStep(value: number, maximum: number): number {
  if (!Number.isFinite(value) || value < 1) return 1
  return clampInteger(value, 1, maximum)
}

function isHourOnStep(
  hour: number,
  use12Hours: boolean,
  hourStep: number
): boolean {
  if (!use12Hours) return hour % hourStep === 0
  const displayHour = hour % 12 || 12
  return (displayHour - 1) % hourStep === 0
}

function setLocalMinute(value: Date, minuteOfDay: number): Date | null {
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

function closestValidDateTime({
  date,
  targetMinute,
  minimum,
  maximum,
  use12Hours,
  hourStep,
  minuteStep,
  minHour,
  maxHour,
}: {
  date: Date
  targetMinute: number
  minimum?: Date
  maximum?: Date
  use12Hours: boolean
  hourStep: number
  minuteStep: number
  minHour: number
  maxHour: number
}): Date | null {
  let closest: Date | null = null
  let closestDistance = Number.POSITIVE_INFINITY

  for (let hour = minHour; hour <= maxHour; hour += 1) {
    if (!isHourOnStep(hour, use12Hours, hourStep)) continue

    for (let minute = 0; minute < 60; minute += minuteStep) {
      const minuteOfDay = hour * 60 + minute
      const candidate = setLocalMinute(date, minuteOfDay)
      if (!candidate) continue
      if (minimum && candidate.getTime() < minimum.getTime()) continue
      if (maximum && candidate.getTime() > maximum.getTime()) continue

      const distance = Math.abs(minuteOfDay - targetMinute)
      if (distance < closestDistance) {
        closest = candidate
        closestDistance = distance
      }
    }
  }

  return closest
}

function normalizeFormatPattern(pattern: string): string {
  return pattern
    .replaceAll("YYYY", "yyyy")
    .replaceAll("YY", "yy")
    .replaceAll("DD", "dd")
    .replaceAll("A", "a")
}

function formatDateTime(value: Date, datePattern: string, timePattern: string) {
  try {
    return `${formatDate(
      value,
      normalizeFormatPattern(datePattern)
    )} ${formatDate(value, normalizeFormatPattern(timePattern))}`
  } catch {
    return formatDate(value, "yyyy-MM-dd HH:mm")
  }
}

function clampDateTime(
  value: Date,
  minimum?: Date,
  maximum?: Date
): Date | null {
  if (minimum && maximum && minimum.getTime() > maximum.getTime()) return null
  if (minimum && value.getTime() < minimum.getTime()) return cloneDate(minimum)
  if (maximum && value.getTime() > maximum.getTime()) return cloneDate(maximum)
  return cloneDate(value)
}

const pickerTriggerClassName =
  "h-[var(--control-size-md)]! rounded-[var(--r-md)]! border-[var(--control-border)]! bg-[var(--control-background)]! px-4! py-2! text-[length:var(--text-body-7)] leading-[var(--leading-body-7)] font-normal! text-[var(--control-foreground)]! shadow-[var(--shadow-input)]! hover:border-[var(--control-border-hover)]! hover:bg-[var(--control-background-hover)]! hover:text-[var(--control-foreground)]! hover:shadow-[var(--shadow-input-hover)]! active:border-[var(--control-border-active)]! active:bg-[var(--control-background-active)]! active:shadow-[var(--shadow-input-active)]! active:focus-visible:shadow-[var(--shadow-input-focused)]! focus-visible:border-[var(--control-focus-border)]! focus-visible:shadow-[var(--shadow-input-focused)]! focus-visible:ring-0! aria-expanded:border-[var(--control-focus-border)]! aria-expanded:bg-[var(--control-background-open)]! aria-expanded:shadow-[var(--shadow-input-open)]! aria-expanded:focus-visible:shadow-[var(--shadow-input-focused)]! aria-invalid:border-[var(--control-invalid-border)]! aria-invalid:shadow-[var(--shadow-input)]! aria-invalid:focus-visible:shadow-[var(--shadow-input-invalid-focused)]! aria-invalid:active:border-[var(--control-invalid-border)]! aria-invalid:active:shadow-[var(--shadow-input-invalid-active)]! aria-invalid:active:focus-visible:shadow-[var(--shadow-input-invalid-focused)]! aria-invalid:aria-expanded:border-[var(--control-invalid-border)]! aria-invalid:aria-expanded:shadow-[var(--shadow-input-invalid-open)]! aria-invalid:aria-expanded:focus-visible:shadow-[var(--shadow-input-invalid-focused)]! disabled:border-[var(--control-disabled-border)]! disabled:bg-[var(--control-disabled-background)]! disabled:text-[var(--control-disabled-foreground)]! disabled:shadow-[var(--shadow-input)]! data-[empty=true]:text-[var(--control-placeholder)]!"

const DateTimePicker = React.forwardRef<HTMLDivElement, DateTimePickerProps>(
  function DateTimePicker(
    {
      value,
      defaultValue = null,
      onChange,
      onBlur,
      datePlaceholder = "Choose date",
      timePlaceholder,
      dateFormat = "yyyy-MM-dd",
      timeFormat,
      disabled = false,
      allowClear = true,
      minDate,
      maxDate,
      min,
      max,
      use12Hours = false,
      hourStep = 1,
      minuteStep = 1,
      minHour = 0,
      maxHour = 23,
      showNow = true,
      dateAriaLabel = "Choose date",
      timeAriaLabel = "Choose time",
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
    const [timeDraftSyncRevision, setTimeDraftSyncRevision] = React.useState(0)
    const [dateOpen, setDateOpen] = React.useState(false)
    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const formControlRef = React.useRef<HTMLInputElement | null>(null)
    const dateTriggerRef = React.useRef<HTMLButtonElement | null>(null)
    const blurTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
      null
    )
    const hasFocusWithinRef = React.useRef(false)
    const generatedId = React.useId()
    const fieldId = id ?? `date-time-picker-${generatedId.replaceAll(":", "")}`
    const isControlled = value !== undefined
    const selectedValue = isUsableDate(isControlled ? value : internalValue)
      ? cloneDate(isControlled ? (value as Date) : (internalValue as Date))
      : null
    const minimum = isUsableDate(min)
      ? min
      : isUsableDate(minDate)
        ? startOfDay(minDate)
        : undefined
    const maximum = isUsableDate(max)
      ? max
      : isUsableDate(maxDate)
        ? endOfDay(maxDate)
        : undefined
    const normalizedHourStep = normalizeStep(hourStep, 12)
    const normalizedMinuteStep = normalizeStep(minuteStep, 60)
    const normalizedMinHour = clampInteger(minHour, 0, 23)
    const normalizedMaxHour = clampInteger(maxHour, 0, 23)
    const boundsAreValid =
      normalizedMinHour <= normalizedMaxHour &&
      (!minimum || !maximum || minimum.getTime() <= maximum.getTime())
    const effectiveTimeFormat = timeFormat ?? (use12Hours ? "hh:mm a" : "HH:mm")
    const activeDate =
      selectedValue ?? clampDateTime(new Date(), minimum, maximum) ?? new Date()
    const serializedValue = selectedValue
      ? formatDate(selectedValue, "yyyy-MM-dd'T'HH:mm")
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
        setTimeDraftSyncRevision((revision) => revision + 1)
      }
      form.addEventListener("reset", handleReset)
      return () => form.removeEventListener("reset", handleReset)
    }, [defaultValue, formId, isControlled])

    const commitValue = React.useCallback(
      (candidate: Date | null) => {
        const nextValue = candidate
          ? clampDateTime(candidate, minimum, maximum)
          : null
        if (candidate && !nextValue) return

        if (!isControlled) {
          setInternalValue(nextValue ? cloneDate(nextValue) : null)
        }
        onChange?.(
          nextValue ? cloneDate(nextValue) : null,
          nextValue
            ? formatDateTime(nextValue, dateFormat, effectiveTimeFormat)
            : null
        )
      },
      [
        dateFormat,
        effectiveTimeFormat,
        isControlled,
        maximum,
        minimum,
        onChange,
      ]
    )

    const handleDateOpenChange = (nextOpen: boolean) => {
      if ((disabled || !boundsAreValid) && nextOpen) return
      setDateOpen(nextOpen)
    }

    const closeDatePicker = () => {
      setDateOpen(false)
    }

    const handleDateSelect = (nextDate: Date | undefined) => {
      if (!nextDate) return

      const targetMinute = selectedValue
        ? selectedValue.getHours() * 60 + selectedValue.getMinutes()
        : 0
      const nextValue = closestValidDateTime({
        date: nextDate,
        targetMinute,
        minimum,
        maximum,
        use12Hours,
        hourStep: normalizedHourStep,
        minuteStep: normalizedMinuteStep,
        minHour: normalizedMinHour,
        maxHour: normalizedMaxHour,
      })
      if (!nextValue) return
      commitValue(nextValue)
      closeDatePicker()
    }

    const handleTimeChange = (nextTime: Date | null) => {
      if (!nextTime) return

      const nextValue = setLocalMinute(
        selectedValue ?? activeDate,
        nextTime.getHours() * 60 + nextTime.getMinutes()
      )
      if (!nextValue) return
      commitValue(nextValue)
    }

    const isDateDisabled = (date: Date) => {
      if (!boundsAreValid) return true
      const day = startOfDay(date).getTime()
      if (minimum && day < startOfDay(minimum).getTime()) return true
      if (maximum && day > startOfDay(maximum).getTime()) return true
      const targetMinute = selectedValue
        ? selectedValue.getHours() * 60 + selectedValue.getMinutes()
        : 0
      return !closestValidDateTime({
        date,
        targetMinute,
        minimum,
        maximum,
        use12Hours,
        hourStep: normalizedHourStep,
        minuteStep: normalizedMinuteStep,
        minHour: normalizedMinHour,
        maxHour: normalizedMaxHour,
      })
    }

    const clearBlurTimer = React.useCallback(() => {
      if (blurTimerRef.current !== null) {
        clearTimeout(blurTimerRef.current)
        blurTimerRef.current = null
      }
    }, [])

    React.useEffect(() => clearBlurTimer, [clearBlurTimer])

    const isWithinComposite = React.useCallback(
      (node: Element | null) => {
        if (!node) return false
        return Boolean(
          containerRef.current?.contains(node) ||
          document.getElementById(`${fieldId}-date-content`)?.contains(node) ||
          document.getElementById(`${fieldId}-time-content`)?.contains(node)
        )
      },
      [fieldId]
    )

    const handleCompositeFocusCapture = (
      event: React.FocusEvent<HTMLDivElement>
    ) => {
      onFocusCaptureProp?.(event)
      clearBlurTimer()
      hasFocusWithinRef.current = true
    }

    const handleCompositeBlurCapture = (
      event: React.FocusEvent<HTMLDivElement>
    ) => {
      onBlurCaptureProp?.(event)
      clearBlurTimer()
      blurTimerRef.current = setTimeout(() => {
        blurTimerRef.current = null
        if (isWithinComposite(document.activeElement)) return
        if (hasFocusWithinRef.current) {
          hasFocusWithinRef.current = false
          onBlur?.()
        }
      }, 0)
    }

    const dateDisplay = selectedValue
      ? (() => {
          try {
            return formatDate(selectedValue, normalizeFormatPattern(dateFormat))
          } catch {
            return formatDate(selectedValue, "yyyy-MM-dd")
          }
        })()
      : null

    return (
      <div
        ref={(node) => {
          containerRef.current = node
          if (typeof ref === "function") ref(node)
          else if (ref) ref.current = node
        }}
        id={id}
        role="group"
        data-slot="date-time-picker"
        data-disabled={disabled || undefined}
        data-invalid={ariaInvalid || undefined}
        className={cn("inline-flex flex-wrap items-center gap-2", className)}
        style={style}
        onFocusCapture={handleCompositeFocusCapture}
        onBlurCapture={handleCompositeBlurCapture}
        {...containerProps}
      >
        <input
          ref={formControlRef}
          data-slot="date-time-picker-form-control"
          id={`${fieldId}-form-control`}
          type="datetime-local"
          name={name}
          form={formId}
          value={serializedValue}
          required={required}
          disabled={disabled}
          tabIndex={-1}
          aria-label={`${dateAriaLabel} and ${timeAriaLabel}`}
          aria-invalid={ariaInvalid}
          aria-hidden="true"
          className="sr-only"
          onChange={() => {}}
          onFocus={() => dateTriggerRef.current?.focus()}
        />
        <Popover open={dateOpen} onOpenChange={handleDateOpenChange}>
          <PopoverTrigger asChild>
            <Button
              ref={dateTriggerRef}
              id={`${fieldId}-date`}
              type="button"
              variant="outline"
              size="lg"
              disabled={disabled || !boundsAreValid}
              aria-label={
                dateDisplay ? `${dateAriaLabel}: ${dateDisplay}` : dateAriaLabel
              }
              aria-invalid={ariaInvalid}
              data-empty={!dateDisplay}
              className={cn("min-w-36 justify-start", pickerTriggerClassName)}
            >
              <CalendarIcon data-icon="inline-start" />
              <span className="truncate">{dateDisplay ?? datePlaceholder}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            id={`${fieldId}-date-content`}
            align="start"
            className="w-auto p-0"
          >
            <Calendar
              mode="single"
              selected={selectedValue ?? undefined}
              defaultMonth={activeDate}
              disabled={isDateDisabled}
              onSelect={handleDateSelect}
            />
          </PopoverContent>
        </Popover>

        <TimePickerDraftSyncContext.Provider value={timeDraftSyncRevision}>
          <TimePicker
            id={`${fieldId}-time`}
            value={selectedValue}
            onChange={handleTimeChange}
            placeholder={timePlaceholder}
            format={effectiveTimeFormat}
            disabled={disabled || !boundsAreValid}
            allowClear={false}
            use12Hours={use12Hours}
            hourStep={normalizedHourStep}
            minuteStep={normalizedMinuteStep}
            minHour={normalizedMinHour}
            maxHour={normalizedMaxHour}
            referenceDate={activeDate}
            min={minimum}
            max={maximum}
            showNow={showNow}
            ariaLabel={timeAriaLabel}
            aria-invalid={ariaInvalid}
          />
        </TimePickerDraftSyncContext.Provider>

        {allowClear && selectedValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            aria-label="Clear date and time"
            onClick={() => commitValue(null)}
          >
            <XIcon />
          </Button>
        )}
      </div>
    )
  }
)

DateTimePicker.displayName = "DateTimePicker"

export { DateTimePicker }

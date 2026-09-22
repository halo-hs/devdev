"use client"

import * as React from "react"
import {
  endOfMonth,
  format as formatDate,
  startOfDay,
  startOfMonth,
} from "date-fns"
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InfoIcon,
  RotateCcwIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@ecoya/design-system/ui/button"
import { Calendar } from "@ecoya/design-system/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@ecoya/design-system/ui/popover"
import { cn } from "@ecoya/design-system/lib/utils"

export type DatePickerMode = "date" | "month"

type DatePickerContainerProps = Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onBlur" | "onChange"
>

export interface DatePickerProps extends DatePickerContainerProps {
  value?: Date | null
  defaultValue?: Date | null
  onChange?: (value: Date | null, formattedValue: string | null) => void
  onBlur?: () => void
  placeholder?: string
  format?: string
  disabled?: boolean
  allowClear?: boolean
  min?: Date
  max?: Date
  minDate?: Date
  maxDate?: Date
  showToday?: boolean
  /** Guidance displayed beneath the calendar. It replaces the Today shortcut. */
  guide?: React.ReactNode
  mode?: DatePickerMode
  /** @deprecated Use mode. */
  pickerMode?: DatePickerMode
  ariaLabel?: string
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

function normalizeFormatPattern(pattern: string): string {
  return pattern
    .replaceAll("YYYY", "yyyy")
    .replaceAll("YY", "yy")
    .replaceAll("DD", "dd")
}

function formatPickerValue(value: Date, pattern: string): string {
  try {
    return formatDate(value, normalizeFormatPattern(pattern))
  } catch {
    return formatDate(value, "yyyy-MM-dd")
  }
}

function isSameMonth(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  )
}

const pickerTriggerClassName =
  "h-[var(--control-size-md)]! rounded-[var(--r-md)]! border-[var(--control-border)]! bg-[var(--control-background)]! px-4! py-2! text-[length:var(--text-body-7)] leading-[var(--leading-body-7)] font-normal! text-[var(--control-foreground)]! shadow-[var(--shadow-input)]! hover:border-[var(--control-border-hover)]! hover:bg-[var(--control-background-hover)]! hover:text-[var(--control-foreground)]! hover:shadow-[var(--shadow-input-hover)]! active:border-[var(--control-border-active)]! active:bg-[var(--control-background-active)]! active:shadow-[var(--shadow-input-active)]! active:focus-visible:shadow-[var(--shadow-input-focused)]! focus-visible:border-[var(--control-focus-border)]! focus-visible:shadow-[var(--shadow-input-focused)]! focus-visible:ring-0! aria-expanded:border-[var(--control-focus-border)]! aria-expanded:bg-[var(--control-background-open)]! aria-expanded:shadow-[var(--shadow-input-open)]! aria-expanded:focus-visible:shadow-[var(--shadow-input-focused)]! aria-invalid:border-[var(--control-invalid-border)]! aria-invalid:shadow-[var(--shadow-input)]! aria-invalid:focus-visible:shadow-[var(--shadow-input-invalid-focused)]! aria-invalid:active:border-[var(--control-invalid-border)]! aria-invalid:active:shadow-[var(--shadow-input-invalid-active)]! aria-invalid:active:focus-visible:shadow-[var(--shadow-input-invalid-focused)]! aria-invalid:aria-expanded:border-[var(--control-invalid-border)]! aria-invalid:aria-expanded:shadow-[var(--shadow-input-invalid-open)]! aria-invalid:aria-expanded:focus-visible:shadow-[var(--shadow-input-invalid-focused)]! disabled:border-[var(--control-disabled-border)]! disabled:bg-[var(--control-disabled-background)]! disabled:text-[var(--control-disabled-foreground)]! disabled:shadow-[var(--shadow-input)]! data-[empty=true]:text-[var(--control-placeholder)]!"

const calendarNavButtonClassName =
  "size-[var(--calendar-nav-size)]! rounded-[var(--r-sm)]! bg-transparent! p-0! text-[var(--calendar-foreground)]! shadow-none! hover:bg-[var(--calendar-day-background-hover)]! hover:text-[var(--calendar-foreground)]! active:bg-[var(--calendar-day-background-active)]! disabled:bg-transparent! disabled:text-[var(--calendar-day-disabled-foreground)]! disabled:shadow-none!"

const calendarMonthButtonClassName =
  "h-[var(--calendar-month-option-height)]! w-full rounded-[var(--r-xs)]! border-0! bg-transparent! px-2! text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] font-medium! text-[var(--calendar-day-foreground)]! shadow-none! hover:bg-[var(--calendar-day-background-hover)]! hover:text-[var(--calendar-day-foreground)]! active:bg-[var(--calendar-day-background-active)]! disabled:bg-transparent! disabled:text-[var(--calendar-day-disabled-foreground)]! disabled:shadow-none! data-[current=true]:text-[var(--calendar-today-foreground)]! aria-pressed:bg-[var(--calendar-day-selected-background)]! aria-pressed:text-[var(--calendar-day-selected-foreground)]! aria-pressed:hover:bg-[var(--calendar-day-selected-background)]! aria-pressed:active:bg-[var(--calendar-day-selected-background)]!"

const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  function DatePicker(
    {
      value,
      defaultValue = null,
      onChange,
      onBlur,
      placeholder,
      format,
      disabled = false,
      allowClear = true,
      min,
      max,
      minDate,
      maxDate,
      showToday = true,
      guide,
      mode: modeProp,
      pickerMode: pickerModeProp,
      ariaLabel = "Choose date",
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
    const pickerMode = modeProp ?? pickerModeProp ?? "date"
    const [internalValue, setInternalValue] = React.useState<Date | null>(() =>
      isUsableDate(defaultValue) ? cloneDate(defaultValue) : null
    )
    const [open, setOpen] = React.useState(false)
    const [visibleYear, setVisibleYear] = React.useState(() =>
      (isUsableDate(value)
        ? value
        : isUsableDate(defaultValue)
          ? defaultValue
          : new Date()
      ).getFullYear()
    )
    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const formControlRef = React.useRef<HTMLInputElement | null>(null)
    const triggerRef = React.useRef<HTMLButtonElement | null>(null)
    const blurTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
      null
    )
    const hasFocusWithinRef = React.useRef(false)
    const generatedId = React.useId()
    const fieldId = id ?? `date-picker-${generatedId.replaceAll(":", "")}`
    const isControlled = value !== undefined
    const selectedValue = isUsableDate(isControlled ? value : internalValue)
      ? cloneDate(isControlled ? (value as Date) : (internalValue as Date))
      : null
    const minimum = isUsableDate(min)
      ? startOfDay(min)
      : isUsableDate(minDate)
        ? startOfDay(minDate)
        : undefined
    const maximum = isUsableDate(max)
      ? startOfDay(max)
      : isUsableDate(maxDate)
        ? startOfDay(maxDate)
        : undefined
    const boundsAreValid =
      !minimum || !maximum || minimum.getTime() <= maximum.getTime()
    const displayFormat =
      format ?? (pickerMode === "month" ? "yyyy-MM" : "yyyy-MM-dd")
    const displayValue = selectedValue
      ? formatPickerValue(selectedValue, displayFormat)
      : null
    const serializedValue = selectedValue
      ? formatPickerValue(
          selectedValue,
          pickerMode === "month" ? "yyyy-MM" : "yyyy-MM-dd"
        )
      : ""

    React.useEffect(() => {
      if (isControlled) return
      const form = formControlRef.current?.form
      if (!form) return

      const handleReset = () =>
        setInternalValue(
          isUsableDate(defaultValue) ? cloneDate(defaultValue) : null
        )
      form.addEventListener("reset", handleReset)
      return () => form.removeEventListener("reset", handleReset)
    }, [defaultValue, formId, isControlled])

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

    const markFocusWithin = React.useCallback(() => {
      clearBlurTimer()
      hasFocusWithinRef.current = true
    }, [clearBlurTimer])

    const schedulePickerBlur = React.useCallback(() => {
      clearBlurTimer()
      blurTimerRef.current = setTimeout(() => {
        blurTimerRef.current = null
        if (isWithinPicker(document.activeElement)) return
        if (hasFocusWithinRef.current) {
          hasFocusWithinRef.current = false
          onBlur?.()
        }
      }, 0)
    }, [clearBlurTimer, isWithinPicker, onBlur])

    const handleFocusCapture = (event: React.FocusEvent<HTMLDivElement>) => {
      onFocusCaptureProp?.(event)
      markFocusWithin()
    }

    const handleBlurCapture = (event: React.FocusEvent<HTMLDivElement>) => {
      onBlurCaptureProp?.(event)
      schedulePickerBlur()
    }

    const isDateDisabled = React.useCallback(
      (date: Date) => {
        if (!boundsAreValid) return true
        const day = startOfDay(date).getTime()
        if (minimum && day < minimum.getTime()) return true
        if (maximum && day > maximum.getTime()) return true
        return false
      },
      [boundsAreValid, maximum, minimum]
    )

    const isMonthDisabled = React.useCallback(
      (date: Date) => {
        if (!boundsAreValid) return true
        if (minimum && endOfMonth(date).getTime() < minimum.getTime())
          return true
        if (maximum && startOfMonth(date).getTime() > maximum.getTime()) {
          return true
        }
        return false
      },
      [boundsAreValid, maximum, minimum]
    )

    const commitValue = React.useCallback(
      (candidate: Date | null) => {
        const nextValue = candidate
          ? pickerMode === "month"
            ? startOfMonth(candidate)
            : startOfDay(candidate)
          : null

        if (
          nextValue &&
          (pickerMode === "month"
            ? isMonthDisabled(nextValue)
            : isDateDisabled(nextValue))
        ) {
          return
        }

        if (!isControlled) {
          setInternalValue(nextValue ? cloneDate(nextValue) : null)
        }
        onChange?.(
          nextValue ? cloneDate(nextValue) : null,
          nextValue ? formatPickerValue(nextValue, displayFormat) : null
        )
      },
      [
        displayFormat,
        isControlled,
        isDateDisabled,
        isMonthDisabled,
        onChange,
        pickerMode,
      ]
    )

    const handleOpenChange = (nextOpen: boolean) => {
      if ((disabled || !boundsAreValid) && nextOpen) return
      if (nextOpen) {
        setVisibleYear((selectedValue ?? new Date()).getFullYear())
      }
      setOpen(nextOpen)
    }

    const closePicker = () => {
      setOpen(false)
    }

    const handleSelect = (nextDate: Date | undefined) => {
      if (!nextDate) return
      commitValue(nextDate)
      closePicker()
    }

    const handleToday = () => {
      const today = new Date()
      if (
        pickerMode === "month" ? isMonthDisabled(today) : isDateDisabled(today)
      ) {
        return
      }
      commitValue(today)
      closePicker()
    }

    const monthOptions = React.useMemo(
      () =>
        Array.from({ length: 12 }, (_, month) => {
          const date = new Date(visibleYear, month, 1)
          return {
            date,
            label: formatDate(date, "MMM"),
          }
        }),
      [visibleYear]
    )
    const previousYearDisabled = monthOptions.every(({ date }) =>
      isMonthDisabled(new Date(date.getFullYear() - 1, date.getMonth(), 1))
    )
    const nextYearDisabled = monthOptions.every(({ date }) =>
      isMonthDisabled(new Date(date.getFullYear() + 1, date.getMonth(), 1))
    )
    const today = new Date()
    const todayDisabled =
      pickerMode === "month" ? isMonthDisabled(today) : isDateDisabled(today)

    return (
      <div
        ref={(node) => {
          containerRef.current = node
          if (typeof ref === "function") ref(node)
          else if (ref) ref.current = node
        }}
        id={id}
        data-slot="date-picker"
        data-disabled={disabled || undefined}
        data-invalid={ariaInvalid || undefined}
        className={cn("inline-flex items-center gap-2", className)}
        style={style}
        onFocusCapture={handleFocusCapture}
        onBlurCapture={handleBlurCapture}
        {...containerProps}
      >
        <input
          ref={formControlRef}
          data-slot="date-picker-form-control"
          id={`${fieldId}-form-control`}
          type={pickerMode === "month" ? "month" : "date"}
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
              disabled={disabled || !boundsAreValid}
              aria-label={
                displayValue ? `${ariaLabel}: ${displayValue}` : ariaLabel
              }
              aria-invalid={ariaInvalid}
              data-empty={!displayValue}
              className={cn("min-w-36 justify-start", pickerTriggerClassName)}
            >
              <CalendarIcon data-icon="inline-start" />
              <span className="truncate">
                {displayValue ??
                  placeholder ??
                  (pickerMode === "month" ? "YYYY-MM" : "YYYY-MM-DD")}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            id={`${fieldId}-content`}
            align="start"
            className="w-auto p-0"
            onFocusCapture={markFocusWithin}
            onBlurCapture={schedulePickerBlur}
          >
            {pickerMode === "date" ? (
              <Calendar
                mode="single"
                selected={selectedValue ?? undefined}
                defaultMonth={selectedValue ?? undefined}
                disabled={isDateDisabled}
                onSelect={handleSelect}
              />
            ) : (
              <div className="flex w-72 max-w-full flex-col gap-2 bg-[var(--calendar-background)] p-2">
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={previousYearDisabled}
                    aria-label="Previous year"
                    className={calendarNavButtonClassName}
                    onClick={() => setVisibleYear((year) => year - 1)}
                  >
                    <ChevronLeftIcon />
                  </Button>
                  <span
                    aria-live="polite"
                    className="text-[length:var(--text-header-7)] leading-[var(--leading-header-7)] font-bold text-[var(--calendar-heading-foreground)]"
                  >
                    {visibleYear}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={nextYearDisabled}
                    aria-label="Next year"
                    className={calendarNavButtonClassName}
                    onClick={() => setVisibleYear((year) => year + 1)}
                  >
                    <ChevronRightIcon />
                  </Button>
                </div>
                <div
                  role="group"
                  aria-label={`Months in ${visibleYear}`}
                  className="grid grid-cols-3 gap-1"
                >
                  {monthOptions.map(({ date, label }) => {
                    const selected = Boolean(
                      selectedValue && isSameMonth(selectedValue, date)
                    )
                    const current = isSameMonth(today, date)
                    return (
                      <Button
                        key={date.getMonth()}
                        type="button"
                        variant="ghost"
                        size="lg"
                        disabled={isMonthDisabled(date)}
                        aria-pressed={selected}
                        aria-label={`${label} ${visibleYear}`}
                        data-current={current && !selected}
                        className={calendarMonthButtonClassName}
                        onClick={() => handleSelect(date)}
                      >
                        {label}
                      </Button>
                    )
                  })}
                </div>
              </div>
            )}
            {guide && (
              <div
                role="note"
                className="flex max-w-(--radix-popover-content-available-width) items-start gap-2 border-t border-[var(--surface-border)] px-3 py-2 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] font-medium text-[var(--calendar-weekday-foreground)]"
              >
                <InfoIcon
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                <span>{guide}</span>
              </div>
            )}
            {showToday && !guide && (
              <div className="border-t border-[var(--surface-border)]">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  disabled={todayDisabled}
                  className="h-[var(--control-size-md)]! w-full rounded-none! border-0! bg-transparent! text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] font-medium! text-[var(--calendar-day-foreground)]! shadow-none! hover:bg-[var(--calendar-day-background-hover)]! hover:text-[var(--calendar-day-foreground)]! active:bg-[var(--calendar-day-background-active)]! disabled:bg-transparent! disabled:text-[var(--calendar-day-disabled-foreground)]! disabled:shadow-none!"
                  onClick={handleToday}
                >
                  <RotateCcwIcon data-icon="inline-start" />
                  Today
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {allowClear && selectedValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            aria-label="Clear date"
            onClick={() => commitValue(null)}
          >
            <XIcon />
          </Button>
        )}
      </div>
    )
  }
)

DatePicker.displayName = "DatePicker"

export { DatePicker }

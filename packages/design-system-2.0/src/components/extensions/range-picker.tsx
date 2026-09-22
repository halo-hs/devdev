"use client"

import * as React from "react"
import { addMonths, format as formatDate, startOfDay } from "date-fns"
import { CalendarIcon, XIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Button } from "@ecoya/design-system/ui/button"
import { Calendar } from "@ecoya/design-system/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@ecoya/design-system/ui/popover"
import { cn } from "@ecoya/design-system/lib/utils"

export type RangePickerValue = [Date | null, Date | null] | null

export interface RangePickerPreset {
  key?: React.Key
  label: React.ReactNode
  value: [Date, Date] | (() => [Date, Date])
}

type RangePickerContainerProps = Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onBlur" | "onChange"
>

export interface RangePickerProps extends RangePickerContainerProps {
  value?: RangePickerValue
  defaultValue?: RangePickerValue
  onChange?: (
    value: [Date | null, Date | null],
    formattedValue: [string, string]
  ) => void
  onBlur?: () => void
  placeholder?: [string, string]
  format?: string
  disabled?: boolean
  allowClear?: boolean
  minDate?: Date
  maxDate?: Date
  numberOfMonths?: number
  closeOnSelect?: boolean
  showPresets?: boolean
  presets?: readonly RangePickerPreset[]
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

function normalizeRange(
  value: RangePickerValue | undefined
): [Date | null, Date | null] {
  if (!value) return [null, null]
  const from = isUsableDate(value[0]) ? cloneDate(value[0]) : null
  const to = isUsableDate(value[1]) ? cloneDate(value[1]) : null

  // A range cannot have an end without a start. Canonicalize that input as a
  // start-only range so controlled and uncontrolled rendering agree.
  if (!from && to) return [to, null]
  if (from && to && from.getTime() > to.getTime()) return [to, from]
  return [from, to]
}

const defaultPresets: readonly RangePickerPreset[] = [
  { key: "today", label: "Today", value: getTodayDateRange },
  { key: "one-month", label: "1 month", value: get1MonthDateRange },
  { key: "three-months", label: "3 months", value: get3MonthDateRange },
]

function normalizeFormatPattern(pattern: string): string {
  return pattern
    .replaceAll("YYYY", "yyyy")
    .replaceAll("YY", "yy")
    .replaceAll("DD", "dd")
}

function formatRangeDate(value: Date, pattern: string): string {
  try {
    return formatDate(value, normalizeFormatPattern(pattern))
  } catch {
    return formatDate(value, "yyyy-MM-dd")
  }
}

function toDateRange(value: [Date | null, Date | null]): DateRange | undefined {
  const [from, to] = value
  if (!from && !to) return undefined
  return { from: from ?? undefined, to: to ?? undefined }
}

const pickerTriggerClassName =
  "h-[var(--control-size-md)]! rounded-[var(--r-md)]! border-[var(--control-border)]! bg-[var(--control-background)]! px-4! py-2! text-[length:var(--text-body-7)] leading-[var(--leading-body-7)] font-normal! text-[var(--control-foreground)]! shadow-[var(--shadow-input)]! hover:border-[var(--control-border-hover)]! hover:bg-[var(--control-background-hover)]! hover:text-[var(--control-foreground)]! hover:shadow-[var(--shadow-input-hover)]! active:border-[var(--control-border-active)]! active:bg-[var(--control-background-active)]! active:shadow-[var(--shadow-input-active)]! active:focus-visible:shadow-[var(--shadow-input-focused)]! focus-visible:border-[var(--control-focus-border)]! focus-visible:shadow-[var(--shadow-input-focused)]! focus-visible:ring-0! aria-expanded:border-[var(--control-focus-border)]! aria-expanded:bg-[var(--control-background-open)]! aria-expanded:shadow-[var(--shadow-input-open)]! aria-expanded:focus-visible:shadow-[var(--shadow-input-focused)]! aria-invalid:border-[var(--control-invalid-border)]! aria-invalid:shadow-[var(--shadow-input)]! aria-invalid:focus-visible:shadow-[var(--shadow-input-invalid-focused)]! aria-invalid:active:border-[var(--control-invalid-border)]! aria-invalid:active:shadow-[var(--shadow-input-invalid-active)]! aria-invalid:active:focus-visible:shadow-[var(--shadow-input-invalid-focused)]! aria-invalid:aria-expanded:border-[var(--control-invalid-border)]! aria-invalid:aria-expanded:shadow-[var(--shadow-input-invalid-open)]! aria-invalid:aria-expanded:focus-visible:shadow-[var(--shadow-input-invalid-focused)]! disabled:border-[var(--control-disabled-border)]! disabled:bg-[var(--control-disabled-background)]! disabled:text-[var(--control-disabled-foreground)]! disabled:shadow-[var(--shadow-input)]! data-[empty=true]:text-[var(--control-placeholder)]!"

const presetButtonClassName =
  "h-[var(--control-size-md)]! rounded-[var(--r-md)]! border-0! bg-[var(--surface-background)]! px-4! text-[length:var(--text-body-8)] leading-[var(--leading-body-8)] font-medium! text-[var(--menu-item-foreground)]! shadow-none! hover:bg-[var(--menu-item-background-hover)]! hover:text-[var(--menu-item-foreground)]! active:bg-[var(--menu-item-background-active)]! disabled:bg-[var(--surface-background)]! disabled:text-[var(--menu-item-disabled-foreground)]! disabled:shadow-none!"

const RangePicker = React.forwardRef<HTMLDivElement, RangePickerProps>(
  function RangePicker(
    {
      value,
      defaultValue = null,
      onChange,
      onBlur,
      placeholder = ["Start date", "End date"],
      format = "yyyy-MM-dd",
      disabled = false,
      allowClear = true,
      minDate,
      maxDate,
      numberOfMonths = 2,
      closeOnSelect = true,
      showPresets = true,
      presets,
      ariaLabel = "Choose date range",
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
    const [internalValue, setInternalValue] = React.useState<
      [Date | null, Date | null]
    >(() => normalizeRange(defaultValue))
    const [open, setOpen] = React.useState(false)
    const [draft, setDraft] = React.useState<DateRange | undefined>(() =>
      toDateRange(normalizeRange(defaultValue))
    )
    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const startFormControlRef = React.useRef<HTMLInputElement | null>(null)
    const triggerRef = React.useRef<HTMLButtonElement | null>(null)
    const blurTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
      null
    )
    const hasFocusWithinRef = React.useRef(false)
    const generatedId = React.useId()
    const fieldId = id ?? `range-picker-${generatedId.replaceAll(":", "")}`
    const isControlled = value !== undefined
    const selectedValue = normalizeRange(isControlled ? value : internalValue)
    const [startDate, endDate] = selectedValue
    const activePresets = presets ?? defaultPresets
    const boundsAreValid =
      !isUsableDate(minDate) ||
      !isUsableDate(maxDate) ||
      startOfDay(minDate).getTime() <= startOfDay(maxDate).getTime()
    const serializedStart = startDate
      ? formatRangeDate(startDate, "yyyy-MM-dd")
      : ""
    const serializedEnd = endDate ? formatRangeDate(endDate, "yyyy-MM-dd") : ""

    React.useEffect(() => {
      if (isControlled) return
      const form = startFormControlRef.current?.form
      if (!form) return

      const handleReset = () => {
        const nextValue = normalizeRange(defaultValue)
        setInternalValue(nextValue)
        setDraft(toDateRange(nextValue))
      }
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

    const commitValue = React.useCallback(
      (nextValue: [Date | null, Date | null]) => {
        const normalizedValue = normalizeRange(nextValue)
        if (!isControlled) {
          setInternalValue(normalizeRange(normalizedValue))
        }
        onChange?.(normalizeRange(normalizedValue), [
          normalizedValue[0] ? formatRangeDate(normalizedValue[0], format) : "",
          normalizedValue[1] ? formatRangeDate(normalizedValue[1], format) : "",
        ])
      },
      [format, isControlled, onChange]
    )

    const handleOpenChange = (nextOpen: boolean) => {
      if ((disabled || !boundsAreValid) && nextOpen) return
      if (nextOpen) setDraft(toDateRange(selectedValue))
      setOpen(nextOpen)
    }

    const closePicker = () => {
      setOpen(false)
    }

    const handleSelect = (nextRange: DateRange | undefined) => {
      setDraft(nextRange)

      if (!nextRange?.from) {
        commitValue([null, null])
        return
      }

      if (nextRange.to) {
        commitValue([nextRange.from, nextRange.to])
        if (closeOnSelect) closePicker()
      }
    }

    const handleClear = () => {
      setDraft(undefined)
      commitValue([null, null])
      closePicker()
    }

    const resolvePreset = (
      preset: RangePickerPreset
    ): [Date | null, Date | null] =>
      normalizeRange(
        typeof preset.value === "function" ? preset.value() : preset.value
      )

    const isDateDisabled = (date: Date) => {
      if (!boundsAreValid) return true
      const day = startOfDay(date).getTime()
      if (isUsableDate(minDate) && day < startOfDay(minDate).getTime()) {
        return true
      }
      if (isUsableDate(maxDate) && day > startOfDay(maxDate).getTime()) {
        return true
      }
      return false
    }

    const isPresetDisabled = (preset: RangePickerPreset) => {
      const [from, to] = resolvePreset(preset)
      return !from || !to || isDateDisabled(from) || isDateDisabled(to)
    }

    const handlePresetSelect = (preset: RangePickerPreset) => {
      const [from, to] = resolvePreset(preset)
      if (!from || !to || isDateDisabled(from) || isDateDisabled(to)) return

      setDraft({ from, to })
      commitValue([from, to])
      if (closeOnSelect) closePicker()
    }

    const displayValue = startDate
      ? `${formatRangeDate(startDate, format)} – ${
          endDate ? formatRangeDate(endDate, format) : placeholder[1]
        }`
      : null

    return (
      <div
        ref={(node) => {
          containerRef.current = node
          if (typeof ref === "function") ref(node)
          else if (ref) ref.current = node
        }}
        id={id}
        data-slot="range-picker"
        data-disabled={disabled || undefined}
        data-invalid={ariaInvalid || undefined}
        className={cn("inline-flex", className)}
        style={style}
        onFocusCapture={handleFocusCapture}
        onBlurCapture={handleBlurCapture}
        {...containerProps}
      >
        <input
          ref={startFormControlRef}
          data-slot="range-picker-start-form-control"
          id={`${fieldId}-start-form-control`}
          type="date"
          name={name}
          form={formId}
          value={serializedStart}
          required={required}
          disabled={disabled}
          tabIndex={-1}
          aria-label={`${ariaLabel}: start`}
          aria-invalid={ariaInvalid}
          aria-hidden="true"
          className="sr-only"
          onChange={() => {}}
          onFocus={() => triggerRef.current?.focus()}
        />
        <input
          data-slot="range-picker-end-form-control"
          id={`${fieldId}-end-form-control`}
          type="date"
          name={name}
          form={formId}
          value={serializedEnd}
          required={required}
          disabled={disabled}
          tabIndex={-1}
          aria-label={`${ariaLabel}: end`}
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
              className={cn("min-w-64 justify-start", pickerTriggerClassName)}
            >
              <CalendarIcon data-icon="inline-start" />
              <span className="truncate">
                {displayValue ?? `${placeholder[0]} – ${placeholder[1]}`}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            id={`${fieldId}-content`}
            align="start"
            className="w-auto overflow-hidden p-0"
            onFocusCapture={markFocusWithin}
            onBlurCapture={schedulePickerBlur}
          >
            <div
              data-slot="range-picker-scroll-area"
              className="min-h-0 max-w-full overflow-x-auto overflow-y-auto overscroll-contain"
            >
              <Calendar
                mode="range"
                selected={draft}
                defaultMonth={draft?.from ?? startDate ?? undefined}
                numberOfMonths={
                  Number.isFinite(numberOfMonths)
                    ? Math.max(1, Math.trunc(numberOfMonths))
                    : 1
                }
                disabled={isDateDisabled}
                excludeDisabled
                onSelect={handleSelect}
              />
              {showPresets && activePresets.length > 0 && (
                <div
                  role="group"
                  aria-label="Date range presets"
                  className="flex flex-wrap gap-1.5 border-t border-[var(--surface-border)] px-2 py-2"
                >
                  {activePresets.map((preset, index) => (
                    <Button
                      key={preset.key ?? index}
                      type="button"
                      variant="ghost"
                      size="lg"
                      disabled={isPresetDisabled(preset)}
                      className={presetButtonClassName}
                      onClick={() => handlePresetSelect(preset)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
            {allowClear && (draft?.from || startDate) && (
              <div
                data-slot="range-picker-actions"
                className="flex shrink-0 justify-end border-t border-[var(--surface-border)] bg-[var(--surface-background)] p-2"
              >
                <Button type="button" variant="ghost" onClick={handleClear}>
                  <XIcon data-icon="inline-start" />
                  Clear
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    )
  }
)

RangePicker.displayName = "RangePicker"

export function getTodayDateRange(): [Date, Date] {
  const today = startOfDay(new Date())
  return [cloneDate(today), cloneDate(today)]
}

export function get1MonthDateRange(): [Date, Date] {
  const start = startOfDay(new Date())
  return [cloneDate(start), startOfDay(addMonths(start, 1))]
}

export function get3MonthDateRange(): [Date, Date] {
  const start = startOfDay(new Date())
  return [cloneDate(start), startOfDay(addMonths(start, 3))]
}

export { RangePicker }

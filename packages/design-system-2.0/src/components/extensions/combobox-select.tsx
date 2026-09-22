"use client"

import * as React from "react"

import { MultipleSelect } from "@ecoya/design-system/extensions/multiple-select"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@ecoya/design-system/ui/combobox"
import { cn } from "@ecoya/design-system/lib/utils"

type ComboboxSelectValue = string | number

type ComboboxSelectOption = {
  value: ComboboxSelectValue
  label: string
  disabled?: boolean
  keywords?: readonly string[]
}

type ComboboxSelectProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "defaultValue" | "onChange"
> & {
  options?: readonly ComboboxSelectOption[]
  value?: ComboboxSelectValue | null
  defaultValue?: ComboboxSelectValue | null
  onValueChange?: (
    value: ComboboxSelectValue | null,
    option: ComboboxSelectOption | null
  ) => void
  onChange?: (
    value: ComboboxSelectValue | null,
    option: ComboboxSelectOption | null
  ) => void
  onBlur?: () => void
  placeholder?: string
  emptyText?: React.ReactNode
  /** Action or explanatory content pinned above the option list. */
  dropdownHeader?: React.ReactNode
  disabled?: boolean
  disableValues?: readonly ComboboxSelectValue[]
  clearable?: boolean
  /** @deprecated Use clearable. */
  allowClear?: boolean
  invalid?: boolean
  /** @deprecated Use invalid. */
  hasError?: boolean
  name?: string
  required?: boolean
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** @deprecated Use onOpenChange. */
  onDropdownVisibleChange?: (open: boolean) => void
  filterOption?: (input: string, option: ComboboxSelectOption) => boolean
  autoHighlight?: boolean
  inputId?: string
  inputAriaLabel?: string
  inputAriaLabelledBy?: string
  inputAriaDescribedBy?: string
}

function isSameValue(first: ComboboxSelectValue, second: ComboboxSelectValue) {
  return Object.is(first, second)
}

function assignRef<T>(ref: React.ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") ref(value)
  else if (ref) ref.current = value
}

function findOption(
  options: readonly ComboboxSelectOption[],
  value: ComboboxSelectValue | null | undefined
) {
  if (value === null || value === undefined) return null
  return options.find((option) => isSameValue(option.value, value)) ?? null
}

/** Searchable single-select. */
const ComboboxSelect = React.forwardRef<HTMLDivElement, ComboboxSelectProps>(
  function ComboboxSelect(
    {
      options = [],
      value,
      defaultValue = null,
      onValueChange,
      onChange,
      onBlur,
      placeholder = "Select",
      emptyText = "No options found.",
      dropdownHeader,
      disabled = false,
      disableValues = [],
      clearable = false,
      allowClear,
      invalid = false,
      hasError = false,
      name,
      required,
      open,
      defaultOpen,
      onOpenChange,
      onDropdownVisibleChange,
      filterOption,
      autoHighlight = true,
      inputId,
      inputAriaLabel,
      inputAriaLabelledBy,
      inputAriaDescribedBy,
      className,
      id,
      onFocusCapture: onFocusCaptureProp,
      onBlurCapture: onBlurCaptureProp,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref
  ) {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const blurTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
      null
    )
    const hasFocusWithinRef = React.useRef(false)
    const generatedId = React.useId().replaceAll(":", "")
    const fieldId = inputId ?? id ?? `combobox-select-${generatedId}`
    const normalizedOptions = React.useMemo(
      () =>
        options.map((option) => ({
          ...option,
          disabled:
            option.disabled ||
            disableValues.some((disabledValue) =>
              isSameValue(disabledValue, option.value)
            ),
        })),
      [disableValues, options]
    )
    const [uncontrolledValue, setUncontrolledValue] =
      React.useState<ComboboxSelectValue | null>(defaultValue)
    const selectedValue = value === undefined ? uncontrolledValue : value
    const selectedOption = React.useMemo(() => {
      const option = findOption(normalizedOptions, selectedValue)
      if (option || selectedValue === null) return option
      return {
        value: selectedValue,
        label: String(selectedValue),
      } satisfies ComboboxSelectOption
    }, [normalizedOptions, selectedValue])
    const showClear = allowClear ?? clearable
    const isInvalid = invalid || hasError

    React.useEffect(() => {
      if (value !== undefined) return
      const form = containerRef.current?.closest("form")
      if (!form) return

      const handleReset = () => setUncontrolledValue(defaultValue)
      form.addEventListener("reset", handleReset)
      return () => form.removeEventListener("reset", handleReset)
    }, [defaultValue, value])

    const clearBlurTimer = React.useCallback(() => {
      if (blurTimerRef.current !== null) {
        clearTimeout(blurTimerRef.current)
        blurTimerRef.current = null
      }
    }, [])

    React.useEffect(() => clearBlurTimer, [clearBlurTimer])

    const isWithinCompound = React.useCallback(
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

    const scheduleCompoundBlur = React.useCallback(() => {
      clearBlurTimer()
      blurTimerRef.current = setTimeout(() => {
        blurTimerRef.current = null
        if (isWithinCompound(document.activeElement)) return
        if (hasFocusWithinRef.current) {
          hasFocusWithinRef.current = false
          onBlur?.()
        }
      }, 0)
    }, [clearBlurTimer, isWithinCompound, onBlur])

    const handleFocusCapture = (event: React.FocusEvent<HTMLDivElement>) => {
      onFocusCaptureProp?.(event)
      markFocusWithin()
    }

    const handleBlurCapture = (event: React.FocusEvent<HTMLDivElement>) => {
      onBlurCaptureProp?.(event)
      scheduleCompoundBlur()
    }

    const commitValue = React.useCallback(
      (nextOption: ComboboxSelectOption | null) => {
        const nextValue = nextOption?.value ?? null
        if (value === undefined) setUncontrolledValue(nextValue)
        onValueChange?.(nextValue, nextOption)
        if (onChange !== onValueChange) onChange?.(nextValue, nextOption)
      },
      [onChange, onValueChange, value]
    )

    const handleOpenChange = React.useCallback(
      (nextOpen: boolean) => {
        onOpenChange?.(nextOpen)
        if (onDropdownVisibleChange !== onOpenChange) {
          onDropdownVisibleChange?.(nextOpen)
        }
      },
      [onDropdownVisibleChange, onOpenChange]
    )

    const filter = React.useCallback(
      (option: ComboboxSelectOption, query: string) => {
        if (filterOption) return filterOption(query, option)
        const normalizedQuery = query.trim().toLocaleLowerCase()
        if (!normalizedQuery) return true
        return [option.label, String(option.value), ...(option.keywords ?? [])]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalizedQuery)
      },
      [filterOption]
    )

    return (
      <div
        ref={(node) => {
          containerRef.current = node
          assignRef(ref, node)
        }}
        id={id}
        data-slot="combobox-select"
        data-disabled={disabled || undefined}
        data-invalid={isInvalid || undefined}
        className={cn("w-full", className)}
        onFocusCapture={handleFocusCapture}
        onBlurCapture={handleBlurCapture}
        {...props}
      >
        <Combobox
          items={normalizedOptions}
          value={selectedOption}
          onValueChange={commitValue}
          itemToStringLabel={(option) => option.label}
          itemToStringValue={(option) => String(option.value)}
          isItemEqualToValue={(option, selected) =>
            isSameValue(option.value, selected.value)
          }
          filter={filter}
          disabled={disabled}
          name={name}
          required={required}
          open={open}
          defaultOpen={defaultOpen}
          onOpenChange={handleOpenChange}
          autoHighlight={autoHighlight}
        >
          <ComboboxInput
            id={inputId}
            className="w-full"
            placeholder={placeholder}
            disabled={disabled}
            showClear={showClear}
            aria-invalid={isInvalid || undefined}
            aria-label={inputAriaLabel ?? ariaLabel}
            aria-labelledby={inputAriaLabelledBy ?? ariaLabelledBy}
            aria-describedby={inputAriaDescribedBy ?? ariaDescribedBy}
          />
          <ComboboxContent
            id={`${fieldId}-content`}
            onFocusCapture={markFocusWithin}
            onBlurCapture={scheduleCompoundBlur}
          >
            {dropdownHeader && (
              <div
                data-slot="combobox-select-header"
                className="border-b border-[var(--surface-border)] p-1"
              >
                {dropdownHeader}
              </div>
            )}
            <ComboboxEmpty>{emptyText}</ComboboxEmpty>
            <ComboboxList>
              {(option: ComboboxSelectOption) => (
                <ComboboxItem
                  key={`${typeof option.value}:${String(option.value)}`}
                  value={option}
                  disabled={option.disabled}
                >
                  {option.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    )
  }
)

type ComboBoxSelectProps = Omit<
  React.ComponentPropsWithoutRef<typeof MultipleSelect>,
  | "defaultValue"
  | "filterOption"
  | "onChange"
  | "onValueChange"
  | "options"
  | "value"
> & {
  options?: readonly {
    value: string
    label: string
    disabled?: boolean
    keywords?: readonly string[]
  }[]
  value?: readonly string[]
  defaultValue?: readonly string[]
  onValueChange?: (values: string[]) => void
  onChange?: (values: string[]) => void
  searchInputPlaceholder?: string
  filterOption?: (
    input: string,
    option: { value: string; label: string }
  ) => boolean
  allValue?: string
  enforceSelection?: boolean
}

/**
 * Compact-filter compatibility composition. It preserves the former
 * multi-selection and `all` sentinel rules; use ComboboxSelect for a single
 * searchable value and MultipleSelect when visible chips are preferred.
 */
const ComboBoxSelect = React.forwardRef<HTMLDivElement, ComboBoxSelectProps>(
  function ComboBoxSelect(
    {
      options = [],
      value,
      defaultValue,
      onValueChange,
      onChange,
      searchInputPlaceholder,
      filterOption,
      allValue = "all",
      enforceSelection = true,
      ...props
    },
    ref
  ) {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const normalizeSelection = React.useCallback(
      (requestedValues: readonly string[] | undefined) => {
        const uniqueValues = [...new Set(requestedValues ?? [])]
        const hasAllOption = options.some((option) => option.value === allValue)

        return enforceSelection && hasAllOption && uniqueValues.length === 0
          ? [allValue]
          : uniqueValues
      },
      [allValue, enforceSelection, options]
    )
    const [uncontrolledValue, setUncontrolledValue] = React.useState<string[]>(
      () => normalizeSelection(defaultValue)
    )
    const selectedValues =
      value === undefined ? uncontrolledValue : normalizeSelection(value)

    React.useEffect(() => {
      if (value !== undefined) return
      const form = containerRef.current?.closest("form")
      if (!form) return

      const handleReset = () =>
        setUncontrolledValue(normalizeSelection(defaultValue))
      form.addEventListener("reset", handleReset)
      return () => form.removeEventListener("reset", handleReset)
    }, [defaultValue, normalizeSelection, value])

    const commitValue = React.useCallback(
      (requestedValues: string[]) => {
        const hadAll = selectedValues.includes(allValue)
        const hasAll = requestedValues.includes(allValue)
        let nextValues: string[]

        if (hasAll && !hadAll) {
          nextValues = [allValue]
        } else if (hadAll && hasAll && requestedValues.length > 1) {
          nextValues = requestedValues.filter((item) => item !== allValue)
        } else if (enforceSelection && requestedValues.length === 0) {
          nextValues = normalizeSelection(requestedValues)
        } else {
          nextValues = [...new Set(requestedValues)]
        }

        if (value === undefined) setUncontrolledValue(nextValues)
        onValueChange?.(nextValues)
        if (onChange !== onValueChange) onChange?.(nextValues)
      },
      [
        allValue,
        enforceSelection,
        onChange,
        onValueChange,
        normalizeSelection,
        selectedValues,
        value,
      ]
    )

    return (
      <MultipleSelect
        ref={(node) => {
          containerRef.current = node
          assignRef(ref, node)
        }}
        options={options}
        value={selectedValues}
        onValueChange={commitValue}
        searchPlaceholder={searchInputPlaceholder}
        filterOption={(input, option) => {
          if (input && option.value === allValue) return false
          if (filterOption) return filterOption(input, option)
          const query = input.trim().toLocaleLowerCase()
          if (!query) return true
          return `${option.label} ${option.value}`
            .toLocaleLowerCase()
            .includes(query)
        }}
        {...props}
      />
    )
  }
)

export { ComboBoxSelect, ComboboxSelect }
export type {
  ComboBoxSelectProps,
  ComboboxSelectOption,
  ComboboxSelectProps,
  ComboboxSelectValue,
}
export default ComboBoxSelect

"use client"

import * as React from "react"
import { XIcon } from "lucide-react"

import { Button } from "@ecoya/design-system/ui/button"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@ecoya/design-system/ui/combobox"
import { cn } from "@ecoya/design-system/lib/utils"

type MultipleSelectValue = string

type MultipleSelectOption = {
  value: MultipleSelectValue
  label: string
  disabled?: boolean
  keywords?: readonly string[]
}

type MultipleSelectProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "defaultValue" | "onChange"
> & {
  options?: readonly MultipleSelectOption[]
  value?: readonly MultipleSelectValue[]
  defaultValue?: readonly MultipleSelectValue[]
  onValueChange?: (
    value: MultipleSelectValue[],
    options: MultipleSelectOption[]
  ) => void
  /** @deprecated Use onValueChange. */
  onChange?: (value: MultipleSelectValue[]) => void
  onRemoveItem?: (value: MultipleSelectValue) => void
  onBlur?: () => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: React.ReactNode
  disabled?: boolean
  disableValues?: readonly MultipleSelectValue[]
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
  filterOption?: (input: string, option: MultipleSelectOption) => boolean
  inputId?: string
  inputAriaLabel?: string
  inputAriaLabelledBy?: string
  inputAriaDescribedBy?: string
}

function isSameValue(first: MultipleSelectValue, second: MultipleSelectValue) {
  return Object.is(first, second)
}

function includesValue(
  values: readonly MultipleSelectValue[],
  candidate: MultipleSelectValue
) {
  return values.some((value) => isSameValue(value, candidate))
}

function uniqueValues(values: readonly MultipleSelectValue[]) {
  return values.filter(
    (value, index) =>
      values.findIndex((candidate) => isSameValue(candidate, value)) === index
  )
}

function assignRef<T>(ref: React.ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") ref(value)
  else if (ref) ref.current = value
}

function hasSameOrder(
  first: readonly MultipleSelectValue[],
  second: readonly MultipleSelectValue[]
) {
  return (
    first.length === second.length &&
    first.every((item, index) => isSameValue(item, second[index]))
  )
}

const MultipleSelect = React.forwardRef<HTMLDivElement, MultipleSelectProps>(
  function MultipleSelect(
    {
      options = [],
      value,
      defaultValue = [],
      onValueChange,
      onChange,
      onRemoveItem,
      onBlur,
      placeholder = "Select",
      searchPlaceholder = "Search...",
      emptyText = "No options found.",
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
      inputId,
      inputAriaLabel,
      inputAriaLabelledBy,
      inputAriaDescribedBy,
      className,
      id,
      onFocusCapture: onFocusCaptureProp,
      onBlurCapture: onBlurCaptureProp,
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
    const fieldId = inputId ?? id ?? `multiple-select-${generatedId}`
    const anchor = useComboboxAnchor()
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
    const [uncontrolledValue, setUncontrolledValue] = React.useState<
      MultipleSelectValue[]
    >(() => uniqueValues(defaultValue))
    const selectedValue = React.useMemo(
      () => uniqueValues(value ?? uncontrolledValue),
      [uncontrolledValue, value]
    )
    const selectedOptions = React.useMemo(
      () =>
        selectedValue.map(
          (selected) =>
            normalizedOptions.find((option) =>
              isSameValue(option.value, selected)
            ) ?? {
              value: selected,
              label: String(selected),
              disabled: disableValues.some((disabledValue) =>
                isSameValue(disabledValue, selected)
              ),
            }
        ),
      [disableValues, normalizedOptions, selectedValue]
    )
    const showClear = allowClear ?? clearable
    const isInvalid = invalid || hasError

    React.useEffect(() => {
      if (value !== undefined) return
      const form = containerRef.current?.closest("form")
      if (!form) return

      const handleReset = () => setUncontrolledValue(uniqueValues(defaultValue))
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
      (nextOptions: MultipleSelectOption[]) => {
        const lockedOptions = selectedOptions.filter(
          (option) => option.disabled
        )
        const normalizedNextOptions = nextOptions.filter(
          (option, index, all) =>
            all.findIndex((candidate) =>
              isSameValue(candidate.value, option.value)
            ) === index
        )

        for (const locked of lockedOptions) {
          if (
            normalizedNextOptions.some((option) =>
              isSameValue(option.value, locked.value)
            )
          ) {
            continue
          }

          const lockedOriginalIndex = selectedValue.findIndex((item) =>
            isSameValue(item, locked.value)
          )
          const insertionIndex = normalizedNextOptions.findIndex((option) => {
            const originalIndex = selectedValue.findIndex((item) =>
              isSameValue(item, option.value)
            )
            return originalIndex >= 0 && originalIndex > lockedOriginalIndex
          })
          normalizedNextOptions.splice(
            insertionIndex < 0 ? normalizedNextOptions.length : insertionIndex,
            0,
            locked
          )
        }
        const nextValue = uniqueValues(
          normalizedNextOptions.map((option) => option.value)
        )
        if (hasSameOrder(nextValue, selectedValue)) return
        const removedValues = selectedValue.filter(
          (selected) => !includesValue(nextValue, selected)
        )

        if (value === undefined) {
          setUncontrolledValue(nextValue)
        }
        onValueChange?.(nextValue, normalizedNextOptions)
        onChange?.(nextValue)
        removedValues.forEach((removedValue) => onRemoveItem?.(removedValue))
      },
      [
        onChange,
        onRemoveItem,
        onValueChange,
        selectedOptions,
        selectedValue,
        value,
      ]
    )

    const clearSelection = React.useCallback(() => {
      const retainedOptions = selectedOptions.filter(
        (option) => option.disabled
      )
      commitValue(retainedOptions)
    }, [commitValue, selectedOptions])

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
      (option: MultipleSelectOption, query: string) => {
        if (filterOption) {
          return filterOption(query, option)
        }
        const normalizedQuery = query.trim().toLocaleLowerCase()
        if (!normalizedQuery) {
          return true
        }
        return [option.label, String(option.value), ...(option.keywords ?? [])]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalizedQuery)
      },
      [filterOption]
    )

    const hasRemovableValue = selectedOptions.some((option) => !option.disabled)

    return (
      <div
        ref={(node) => {
          containerRef.current = node
          assignRef(ref, node)
        }}
        id={id}
        data-slot="multiple-select"
        data-disabled={disabled || undefined}
        data-invalid={isInvalid || undefined}
        className={cn("w-full", className)}
        onFocusCapture={handleFocusCapture}
        onBlurCapture={handleBlurCapture}
        {...props}
      >
        <Combobox
          items={normalizedOptions}
          multiple
          value={selectedOptions}
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
        >
          <div className="flex items-start gap-2">
            <ComboboxChips
              ref={anchor}
              className="flex-1"
              aria-invalid={isInvalid || undefined}
            >
              <ComboboxValue>
                {(currentOptions: MultipleSelectOption[]) =>
                  currentOptions.map((option) => (
                    <ComboboxChip
                      key={`${typeof option.value}:${String(option.value)}`}
                      showRemove={!disabled && !option.disabled}
                      removeLabel={`${option.label} 제거`}
                      data-disabled={option.disabled || undefined}
                      aria-disabled={option.disabled || undefined}
                    >
                      {option.label}
                    </ComboboxChip>
                  ))
                }
              </ComboboxValue>
              <ComboboxChipsInput
                id={inputId}
                disabled={disabled}
                aria-invalid={isInvalid || undefined}
                aria-label={inputAriaLabel}
                aria-labelledby={inputAriaLabelledBy}
                aria-describedby={inputAriaDescribedBy}
                placeholder={
                  selectedOptions.length === 0 ? placeholder : searchPlaceholder
                }
              />
            </ComboboxChips>
            {showClear && hasRemovableValue && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled}
                aria-label="Clear selection"
                onClick={clearSelection}
              >
                <XIcon data-icon="inline-start" />
              </Button>
            )}
          </div>
          <ComboboxContent
            id={`${fieldId}-content`}
            anchor={anchor}
            onFocusCapture={markFocusWithin}
            onBlurCapture={scheduleCompoundBlur}
          >
            <ComboboxEmpty>{emptyText}</ComboboxEmpty>
            <ComboboxList>
              {(option: MultipleSelectOption) => (
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

export { MultipleSelect }
export type { MultipleSelectOption, MultipleSelectProps, MultipleSelectValue }
export default MultipleSelect

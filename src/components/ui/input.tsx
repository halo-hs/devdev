import * as React from "react"
import { flushSync } from "react-dom"

import { ACTIVE_CURRENCIES, currencyDigits, validNumericPaste } from "@/lib/currencyInput"

import { cn } from "@/lib/utils"

function Input({ className, type, numericFormat, maxIntegerDigits, maxFractionDigits, currency = "USD", ...props }: React.ComponentProps<"input"> & { numericFormat?: "amount" | "decimal" | "integer"; maxIntegerDigits?: number; maxFractionDigits?: number; currency?: string }) {
  const [focused, setFocused] = React.useState(false)
  const [localValue, setLocalValue] = React.useState(String(props.defaultValue ?? ""))
  const mode = numericFormat
  const raw = String(props.value ?? localValue).replaceAll(",", "")
  const digits = maxFractionDigits ?? (mode === "amount" ? currencyDigits(currency) : undefined) ?? 2
  const unsupportedCurrency = mode === "amount" && !(ACTIVE_CURRENCIES as readonly string[]).includes(currency.toUpperCase())
  const invalidPrecision = unsupportedCurrency || (mode === "amount" && (raw.split(".")[1]?.length ?? 0) > digits)
  const errorId = React.useId()
  const precisionMessage = unsupportedCurrency ? "지원하는 통화를 선택해 주세요." : `${currency}: ${digits === 0 ? "정수로" : `소수 ${digits}자리까지`} 입력해 주세요.`
  const format = (value: string, editing: boolean) => {
    if (mode !== "amount" || !value || !/^\d*(?:\.\d*)?$/.test(value)) return value
    let whole = value.split(".")[0]
    let fraction: string | undefined = value.split(".")[1]
    if (!editing && (fraction?.length ?? 0) <= digits) {
      whole = whole || "0"
      fraction = digits ? (fraction ?? "").padEnd(maxFractionDigits === undefined ? digits : Math.min(2, digits), "0") : undefined
    }
    return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (fraction === undefined ? "" : `.${fraction}`)
  }
  const numericProps: React.ComponentProps<"input"> = mode ? {
    value: format(focused ? localValue : raw, focused),
    defaultValue: undefined,
    inputMode: mode === "integer" ? "numeric" : "decimal",
    onFocus: (event) => {
      const displayValue = event.currentTarget.value.replaceAll(",", "")
      // Finish focus formatting before the browser applies the next edit/paste.
      flushSync(() => { setLocalValue(displayValue); setFocused(true) })
      props.onFocus?.(event)
    },
    onBlur: (event) => { setFocused(false); props.onBlur?.(event) },
    "aria-invalid": invalidPrecision || props["aria-invalid"],
    "aria-describedby": [props["aria-describedby"], invalidPrecision ? errorId : ""].filter(Boolean).join(" ") || undefined,
    onKeyDown: (event) => {
      if (event.key === ",") event.preventDefault()
      props.onKeyDown?.(event)
    },
    onPaste: (event) => {
      const pasted = event.clipboardData.getData("text").trim()
      if (!validNumericPaste(pasted)) event.preventDefault()
      else props.onPaste?.(event)
    },
    onChange: (event) => {
      const control = event.currentTarget
      const entered = control.value
      const native = event.nativeEvent as InputEvent
      if (native.inputType === "insertText" && native.data?.includes(",")) { control.value = format(raw, true); return }
      const next = entered.replaceAll(",", "")
      const pattern = mode === "integer" ? /^\d*$/ : /^\d*(?:\.\d*)?$/
      if (!pattern.test(next) || ((mode === "amount" || maxFractionDigits !== undefined) && (next.split(".")[1]?.length ?? 0) > digits && (next.split(".")[1]?.length ?? 0) >= (raw.split(".")[1]?.length ?? 0)) || (maxIntegerDigits !== undefined && next.split(".")[0].length > maxIntegerDigits)) { control.value = format(raw, true); return }
      const caret = entered.slice(0, control.selectionStart ?? entered.length).replaceAll(",", "").length
      setLocalValue(next)
      // Capture the canonical value for callbacks that read it inside a state updater.
      const target = new Proxy(control, {
        get: (element, key) => key === "value" ? next : Reflect.get(element, key, element),
      })
      props.onChange?.({ ...event, target, currentTarget: target })
      requestAnimationFrame(() => {
        if (document.activeElement !== control) return
        let position = 0, remaining = caret
        while (position < control.value.length && remaining > 0) {
          if (control.value[position] !== ",") remaining--
          position++
        }
        control.setSelectionRange(position, position)
      })
    },
  } : {}
  return (
    <>
    <input
      type={mode ? "text" : type}
      data-slot="input"
      className={cn(
        "h-[var(--control-size-md)] w-full min-w-0 rounded-[var(--r-md)] border border-[var(--control-border)] bg-[var(--control-background)] px-4 py-2 text-[length:var(--text-body-9)] leading-[var(--leading-body-9)] font-normal text-[var(--control-foreground)] shadow-[var(--shadow-input)] transition-[border-color,box-shadow,background-color,color] outline-none file:inline-flex file:h-[var(--control-size-xs)] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--control-foreground)] placeholder:text-[var(--control-placeholder)] hover:border-[var(--control-border-hover)] hover:bg-[var(--control-background-hover)] hover:shadow-[var(--shadow-input-hover)] focus-visible:border-transparent focus-visible:shadow-[var(--shadow-input-focused)] focus-visible:ring-0 active:border-[var(--control-border-active)] active:bg-[var(--control-background-active)] active:shadow-[var(--shadow-input-active)] active:focus-visible:border-transparent active:focus-visible:shadow-[var(--shadow-input-focused)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-[var(--control-disabled-border)] disabled:bg-[var(--control-disabled-background)] disabled:text-[var(--control-disabled-foreground)] disabled:opacity-100 aria-invalid:border-[var(--control-invalid-border)] aria-invalid:shadow-[var(--shadow-input)] aria-invalid:ring-0 aria-invalid:focus-visible:border-transparent aria-invalid:focus-visible:shadow-[var(--shadow-input-invalid-focused)] aria-invalid:active:border-[var(--control-invalid-border)] aria-invalid:active:shadow-[var(--shadow-input-invalid-active)] aria-invalid:active:focus-visible:border-transparent aria-invalid:active:focus-visible:shadow-[var(--shadow-input-invalid-focused)]",
        "text-[length:var(--text-body-6)] leading-[var(--leading-body-6)] disabled:placeholder:text-[var(--control-disabled-foreground)]",
        className
      )}
      {...props}
      {...numericProps}
    />
    {invalidPrecision && <span id={errorId} role="alert" className="text-xs text-destructive">{precisionMessage}</span>}
    </>
  )
}

export { Input }

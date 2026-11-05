import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, numericFormat, maxIntegerDigits, ...props }: React.ComponentProps<"input"> & { numericFormat?: "amount" | "decimal" | "integer"; maxIntegerDigits?: number }) {
  const [focused, setFocused] = React.useState(false)
  const [localValue, setLocalValue] = React.useState(String(props.defaultValue ?? ""))
  const mode = numericFormat
  const raw = String(props.value ?? localValue).replaceAll(",", "")
  const format = (value: string, editing: boolean) => {
    if (mode !== "amount" || !value || !/^\d*(?:\.\d*)?$/.test(value)) return value
    let [whole, fraction] = value.split(".")
    if (!editing) {
      const cents = BigInt(whole || "0") * 100n + BigInt((fraction ?? "").padEnd(2, "0").slice(0, 2)) + ((fraction?.[2] ?? "0") >= "5" ? 1n : 0n)
      whole = String(cents / 100n)
      fraction = String(cents % 100n).padStart(2, "0")
    }
    return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (fraction === undefined ? "" : `.${fraction}`)
  }
  const numericProps: React.ComponentProps<"input"> = mode ? {
    value: format(focused ? localValue : raw, focused),
    defaultValue: undefined,
    inputMode: mode === "integer" ? "numeric" : "decimal",
    onFocus: (event) => {
      setLocalValue(event.currentTarget.value.replaceAll(",", ""))
      setFocused(true)
      props.onFocus?.(event)
    },
    onBlur: (event) => { setFocused(false); props.onBlur?.(event) },
    onPaste: (event) => {
      const pasted = event.clipboardData.getData("text").trim()
      if (pasted.includes(",") && !/^\d{1,3}(?:,\d{3})+(?:\.\d*)?$/.test(pasted)) event.preventDefault()
      else props.onPaste?.(event)
    },
    onChange: (event) => {
      const control = event.currentTarget
      const entered = control.value
      const next = entered.replaceAll(",", "")
      const pattern = mode === "integer" ? /^\d*$/ : mode === "amount" ? /^\d*(?:\.\d{0,2})?$/ : /^\d*(?:\.\d*)?$/
      if (!pattern.test(next) || (maxIntegerDigits !== undefined && next.split(".")[0].length > maxIntegerDigits)) { control.value = format(raw, true); return }
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
  )
}

export { Input }

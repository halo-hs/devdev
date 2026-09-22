import * as React from "react"

import { cn } from "@ecoya/design-system/lib/utils"
import { ChevronDownIcon } from "lucide-react"

type NativeSelectProps = Omit<React.ComponentProps<"select">, "size"> & {
  size?: "sm" | "default"
}

function NativeSelect({
  className,
  size = "default",
  ...props
}: NativeSelectProps) {
  return (
    <div
      className={cn("group/native-select relative w-fit", className)}
      data-slot="native-select-wrapper"
      data-size={size}
    >
      <select
        data-slot="native-select"
        data-size={size}
        className="h-[var(--control-size-md)] w-full min-w-0 appearance-none rounded-[var(--r-md)] border border-[var(--control-border)] bg-[var(--control-background)] py-2 pr-9 pl-4 text-[length:var(--text-body-9)] leading-[var(--leading-body-9)] font-normal text-[var(--control-foreground)] shadow-[var(--shadow-input)] transition-[border-color,box-shadow,background-color,color] outline-none select-none selection:bg-primary selection:text-primary-foreground hover:border-[var(--control-border-hover)] hover:bg-[var(--control-background-hover)] hover:shadow-[var(--shadow-input-hover)] focus-visible:border-transparent focus-visible:shadow-[var(--shadow-input-focused)] focus-visible:ring-0 active:border-[var(--control-border-active)] active:bg-[var(--control-background-active)] active:shadow-[var(--shadow-input-active)] active:focus-visible:border-transparent active:focus-visible:shadow-[var(--shadow-input-focused)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-[var(--control-disabled-border)] disabled:bg-[var(--control-disabled-background)] disabled:text-[var(--control-disabled-foreground)] disabled:opacity-100 aria-invalid:border-[var(--control-invalid-border)] aria-invalid:shadow-[var(--shadow-input)] aria-invalid:ring-0 aria-invalid:focus-visible:border-transparent aria-invalid:focus-visible:shadow-[var(--shadow-input-invalid-focused)] aria-invalid:active:border-[var(--control-invalid-border)] aria-invalid:active:shadow-[var(--shadow-input-invalid-active)] aria-invalid:active:focus-visible:border-transparent aria-invalid:active:focus-visible:shadow-[var(--shadow-input-invalid-focused)] data-[size=sm]:h-[var(--control-size-sm)] data-[size=sm]:rounded-[var(--r-sm)] data-[size=sm]:py-1"
        {...props}
      />
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-[var(--control-placeholder)] select-none group-has-[select:disabled]:text-[var(--control-disabled-foreground)]"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  )
}

function NativeSelectOption({
  className,
  ...props
}: React.ComponentProps<"option">) {
  return (
    <option
      data-slot="native-select-option"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

function NativeSelectOptGroup({
  className,
  ...props
}: React.ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn("bg-[Canvas] text-[CanvasText]", className)}
      {...props}
    />
  )
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption }

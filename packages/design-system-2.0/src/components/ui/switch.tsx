"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@ecoya/design-system/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-transparent focus-visible:[box-shadow:var(--shadow-keyboard-focus)] active:border-[var(--control-border-active)] active:focus-visible:border-transparent active:focus-visible:[box-shadow:var(--shadow-keyboard-focus)] aria-invalid:border-[var(--control-invalid-border)] aria-invalid:focus-visible:border-transparent aria-invalid:focus-visible:[box-shadow:var(--shadow-keyboard-focus-invalid)] aria-invalid:active:focus-visible:border-transparent aria-invalid:active:focus-visible:[box-shadow:var(--shadow-keyboard-focus-invalid)] data-[size=default]:h-[22px] data-[size=default]:w-[44px] data-[size=sm]:h-4 data-[size=sm]:w-7 data-checked:bg-[var(--control-selected-background)] data-unchecked:bg-[var(--switch-track-unchecked)] data-disabled:cursor-not-allowed data-disabled:opacity-100 data-disabled:data-checked:bg-[var(--switch-track-disabled-checked)] data-disabled:data-unchecked:bg-[var(--switch-track-disabled-unchecked)]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full bg-[var(--control-background)] ring-0 transition-transform group-data-[size=default]/switch:size-[18px] group-data-[size=sm]/switch:size-3 group-data-disabled/switch:bg-[var(--switch-thumb-disabled)] group-data-[size=default]/switch:data-checked:translate-x-[22px] group-data-[size=sm]/switch:data-checked:translate-x-3 group-data-[size=default]/switch:data-unchecked:translate-x-0.5 group-data-[size=sm]/switch:data-unchecked:translate-x-0.5"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }

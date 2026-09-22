"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import CheckIcon from "@ecoya/design-system/assets/icons/icon-checkmark.svg"
import { cn } from "@ecoya/design-system/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-[var(--control-size-xs)] shrink-0 items-center justify-center rounded-[var(--r-xs)] border border-[var(--selection-control-border)] bg-[var(--control-background)] text-[var(--control-selected-foreground)] transition-[border-color,box-shadow,background-color,color] outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-transparent focus-visible:[box-shadow:var(--shadow-keyboard-focus)] disabled:cursor-not-allowed disabled:border-[var(--control-disabled-border)] disabled:bg-[var(--control-disabled-background)] disabled:text-[var(--control-disabled-foreground)] disabled:opacity-100 aria-invalid:border-[var(--control-invalid-border)] aria-invalid:focus-visible:border-transparent aria-invalid:focus-visible:[box-shadow:var(--shadow-keyboard-focus-invalid)] data-checked:border-[var(--control-selected-background)] data-checked:bg-[var(--control-selected-background)] data-checked:text-[var(--control-selected-foreground)] disabled:data-checked:border-[var(--control-disabled-border)] disabled:data-checked:bg-[var(--control-disabled-background)] disabled:data-checked:text-[var(--control-disabled-foreground)]",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-4"
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }

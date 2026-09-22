"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

import { cn } from "@ecoya/design-system/lib/utils"

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid w-full gap-2", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "group/radio-group-item peer relative flex aspect-square size-5 shrink-0 rounded-full border border-[var(--selection-control-border)] bg-[var(--control-background)] transition-[border-color,box-shadow,background-color] outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-transparent focus-visible:[box-shadow:var(--shadow-keyboard-focus)] disabled:cursor-not-allowed disabled:border-[var(--control-disabled-border)] disabled:bg-[var(--control-disabled-background)] disabled:opacity-100 aria-invalid:border-[var(--control-invalid-border)] aria-invalid:focus-visible:border-transparent aria-invalid:focus-visible:[box-shadow:var(--shadow-keyboard-focus-invalid)] data-checked:border-[var(--control-selected-background)] data-checked:bg-[var(--control-selected-background)] data-checked:text-[var(--control-selected-foreground)] disabled:data-checked:border-[var(--control-disabled-border)] disabled:data-checked:bg-[var(--control-disabled-background)] disabled:data-checked:text-[var(--control-disabled-foreground)]",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-5 items-center justify-center"
      >
        <span className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--control-selected-foreground)]" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }

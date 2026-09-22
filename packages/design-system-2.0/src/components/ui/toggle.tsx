"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Toggle as TogglePrimitive } from "radix-ui"

import { cn } from "@ecoya/design-system/lib/utils"

const toggleVariants = cva(
  "group/toggle inline-flex items-center justify-center gap-1 rounded-[var(--r-md)] whitespace-nowrap text-[var(--toggle-foreground)] transition-all outline-none hover:bg-[var(--toggle-background-hover)] hover:text-[var(--toggle-foreground-hover)] focus-visible:[box-shadow:var(--shadow-keyboard-focus)] active:bg-[var(--toggle-background-active)] disabled:pointer-events-none disabled:text-[var(--toggle-disabled-foreground)] disabled:opacity-100 aria-invalid:border-[var(--control-invalid-border)] aria-invalid:focus-visible:[box-shadow:var(--shadow-keyboard-focus-invalid)] aria-pressed:bg-[var(--toggle-background-selected)] aria-pressed:text-[var(--toggle-foreground-selected)] aria-pressed:active:bg-[var(--toggle-background-selected)] data-[state=on]:bg-[var(--toggle-background-selected)] data-[state=on]:text-[var(--toggle-foreground-selected)] data-[state=on]:active:bg-[var(--toggle-background-selected)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-[var(--control-border)] bg-[var(--control-background)] hover:bg-[var(--toggle-background-hover)]",
      },
      size: {
        default:
          "typo-btn3m h-[var(--control-size-md)] min-w-[var(--control-size-md)] px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        sm: "typo-btn3m h-[var(--control-size-sm)] min-w-[var(--control-size-sm)] rounded-[var(--r-sm)] px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "typo-btn2m h-[var(--control-size-md)] min-w-[var(--control-size-md)] px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }

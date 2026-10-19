import type { ComponentProps } from "react"
import { PopoverContent as DSPopoverContent, PopoverTitle as DSPopoverTitle, PopoverDescription as DSPopoverDescription } from "@ecoya/design-system/ui/popover"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/popover"

function PopoverContent({ className, ...props }: ComponentProps<typeof DSPopoverContent>) {
  return <DSPopoverContent {...props} className={cn("gap-0.5 ring-[var(--component-subtle-outline)] text-[length:var(--text-body-md)] leading-[var(--leading-body-md)] font-normal", className)} />
}

function PopoverTitle({ className, ...props }: ComponentProps<typeof DSPopoverTitle>) {
  return <DSPopoverTitle {...props} className={cn("text-[length:var(--text-body-md)] leading-[var(--leading-body-md)] font-normal text-[var(--component-title)]", className)} />
}

function PopoverDescription({ className, ...props }: ComponentProps<typeof DSPopoverDescription>) {
  return <DSPopoverDescription {...props} className={cn("text-[length:var(--text-body-md)] leading-[var(--leading-body-md)] font-normal", className)} />
}

export { PopoverContent, PopoverTitle, PopoverDescription }

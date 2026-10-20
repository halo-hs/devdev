import type { ComponentProps } from "react"
import { PopoverContent as DSPopoverContent, PopoverTitle as DSPopoverTitle, PopoverDescription as DSPopoverDescription } from "@ecoya/design-system/ui/popover"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/popover"

function PopoverContent({ className, sideOffset = 8, ...props }: ComponentProps<typeof DSPopoverContent>) {
  return <DSPopoverContent {...props} sideOffset={sideOffset} className={cn("gap-0.5 ring-[var(--color-gray-10)] text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal", className)} />
}

function PopoverTitle({ className, ...props }: ComponentProps<typeof DSPopoverTitle>) {
  return <DSPopoverTitle {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal text-[var(--surface-foreground)]", className)} />
}

function PopoverDescription({ className, ...props }: ComponentProps<typeof DSPopoverDescription>) {
  return <DSPopoverDescription {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal", className)} />
}

export { PopoverContent, PopoverTitle, PopoverDescription }

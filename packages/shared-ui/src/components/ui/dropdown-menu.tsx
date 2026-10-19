import type { ComponentProps } from "react"
import { DropdownMenuItem as DSDropdownMenuItem, DropdownMenuCheckboxItem as DSDropdownMenuCheckboxItem, DropdownMenuRadioItem as DSDropdownMenuRadioItem, DropdownMenuSubTrigger as DSDropdownMenuSubTrigger } from "@ecoya/design-system/ui/dropdown-menu"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/dropdown-menu"

function DropdownMenuItem({ className, ...props }: ComponentProps<typeof DSDropdownMenuItem>) {
  return <DSDropdownMenuItem {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal", className)} />
}

function DropdownMenuCheckboxItem({ className, ...props }: ComponentProps<typeof DSDropdownMenuCheckboxItem>) {
  return <DSDropdownMenuCheckboxItem {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal", className)} />
}

function DropdownMenuRadioItem({ className, ...props }: ComponentProps<typeof DSDropdownMenuRadioItem>) {
  return <DSDropdownMenuRadioItem {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal", className)} />
}

function DropdownMenuSubTrigger({ className, ...props }: ComponentProps<typeof DSDropdownMenuSubTrigger>) {
  return <DSDropdownMenuSubTrigger {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal", className)} />
}

export { DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuSubTrigger }

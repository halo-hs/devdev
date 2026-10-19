import type { ComponentProps } from "react"
import { SelectTrigger as DSSelectTrigger, SelectItem as DSSelectItem } from "@ecoya/design-system/ui/select"
import { cn } from "@shared/lib/utils"

export { Select, SelectGroup, SelectValue, SelectContent, SelectLabel, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton } from "@ecoya/design-system/ui/select"

function SelectTrigger({ className, ...props }: ComponentProps<typeof DSSelectTrigger>) {
  return <DSSelectTrigger {...props} className={cn("text-[length:var(--text-body-6)] leading-[var(--leading-body-6)] data-[size=sm]:text-[length:var(--text-body-8)] data-[size=sm]:leading-[var(--text-base--line-height)]", className)} />
}

function SelectItem({ className, ...props }: ComponentProps<typeof DSSelectItem>) {
  return <DSSelectItem {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)]", className)} />
}

export { SelectTrigger, SelectItem }

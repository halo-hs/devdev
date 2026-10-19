import type { ComponentProps } from "react"
import { SelectTrigger as DSSelectTrigger, SelectItem as DSSelectItem } from "@ecoya/design-system/ui/select"
import { cn } from "@shared/lib/utils"

export { Select, SelectGroup, SelectValue, SelectContent, SelectLabel, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton } from "@ecoya/design-system/ui/select"

function SelectTrigger({ className, ...props }: ComponentProps<typeof DSSelectTrigger>) {
  return <DSSelectTrigger {...props} className={cn("text-[length:var(--text-body-lg)] leading-[var(--leading-body-lg)] data-[size=sm]:text-[length:var(--text-body-md)] data-[size=sm]:leading-[var(--leading-body-md)]", className)} />
}

function SelectItem({ className, ...props }: ComponentProps<typeof DSSelectItem>) {
  return <DSSelectItem {...props} className={cn("text-[length:var(--text-body-md)] leading-[var(--leading-body-md)]", className)} />
}

export { SelectTrigger, SelectItem }

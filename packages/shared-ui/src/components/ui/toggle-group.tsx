import type { ComponentProps } from "react"
import { ToggleGroupItem as DSToggleGroupItem } from "@ecoya/design-system/ui/toggle-group"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/toggle-group"

function ToggleGroupItem({ className, ...props }: ComponentProps<typeof DSToggleGroupItem>) {
  return <DSToggleGroupItem {...props} className={cn("data-[size=default]:h-9 data-[size=default]:min-w-9 [--leading-button-3:var(--leading-body-md)] [--font-weight-medium:400]", className)} />
}

export { ToggleGroupItem }

import type { ComponentProps } from "react"
import { Checkbox as DSCheckbox } from "@ecoya/design-system/ui/checkbox"
import { cn } from "@shared/lib/utils"

// Figma Checkbox fills the checked box with Indigo 1 (--primary).
function Checkbox({ className, ...props }: ComponentProps<typeof DSCheckbox>) {
  return <DSCheckbox {...props} className={cn("[--control-selected-background:var(--primary)]", className)} />
}

export { Checkbox }

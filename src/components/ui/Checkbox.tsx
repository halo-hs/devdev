import type { ComponentProps } from "react"
import { Checkbox as DSCheckbox } from "@/components/ds2/ui/Checkbox"
import { cn } from "@/lib/utils"

// Figma Checkbox fills the checked box with Indigo 1 (--primary).
function Checkbox({ className, ...props }: ComponentProps<typeof DSCheckbox>) {
  return <DSCheckbox {...props} className={cn("[--control-selected-background:var(--primary)]", className)} />
}

export { Checkbox }

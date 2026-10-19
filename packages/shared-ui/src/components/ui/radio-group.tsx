import type { ComponentProps } from "react"
import { RadioGroup as DSRadioGroup } from "@ecoya/design-system/ui/radio-group"
import { cn } from "@shared/lib/utils"
export { RadioGroupItem } from "@ecoya/design-system/ui/radio-group"
function RadioGroup({ className, ...props }: ComponentProps<typeof DSRadioGroup>) {
  return <DSRadioGroup {...props} className={cn("gap-3", className)} />
}
export { RadioGroup }

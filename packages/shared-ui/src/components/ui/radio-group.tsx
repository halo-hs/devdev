import type { ComponentProps } from "react"
import { RadioGroup as DSRadioGroup, RadioGroupItem as DSRadioGroupItem } from "@ecoya/design-system/ui/radio-group"
import { cn } from "@shared/lib/utils"
function RadioGroup({ className, ...props }: ComponentProps<typeof DSRadioGroup>) {
  return <DSRadioGroup {...props} className={cn("gap-3", className)} />
}
// Figma Radio: checked keeps the white fill with a 1.5px Indigo 1 ring and a 12px Indigo 1 dot.
function RadioGroupItem({ className, ...props }: ComponentProps<typeof DSRadioGroupItem>) {
  return <DSRadioGroupItem {...props} className={cn("[--control-selected-background:var(--primary)] [--control-selected-foreground:var(--primary)] data-checked:border-[1.5px] data-checked:bg-[var(--control-background)] [&_[data-slot=radio-group-indicator]>span]:size-3", className)} />
}
export { RadioGroup, RadioGroupItem }

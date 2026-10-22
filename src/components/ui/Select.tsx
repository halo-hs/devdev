import type { ComponentProps } from "react"
import { SelectTrigger as DSSelectTrigger, SelectItem as DSSelectItem, SelectContent as DSSelectContent } from "@/components/ds2/ui/Select"
import { cn } from "@/lib/utils"

export { Select, SelectGroup, SelectValue, SelectLabel, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton } from "@/components/ds2/ui/Select"

// Figma Select: 16px inset on both sides, Gray 1 chevron.
function SelectTrigger({ className, ...props }: ComponentProps<typeof DSSelectTrigger>) {
  return <DSSelectTrigger {...props} className={cn("pr-4 text-[length:var(--text-body-6)] leading-[var(--leading-body-6)] data-[size=sm]:text-[length:var(--text-body-8)] data-[size=sm]:leading-[var(--text-base--line-height)] [&>svg]:text-[var(--color-gray-2)]", className)} />
}

// Figma list: Gray 9 outline, 4px inset.
function SelectContent({ className, ...props }: ComponentProps<typeof DSSelectContent>) {
  return <DSSelectContent {...props} className={cn("p-1 ring-[var(--color-gray-10)]", className)} />
}

// Figma item: selected rows show Blue 10 / Blue 4 without a check slot.
function SelectItem({ className, ...props }: ComponentProps<typeof DSSelectItem>) {
  return <DSSelectItem {...props} className={cn("pr-4 text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] data-[state=checked]:text-[var(--accent-foreground)] [&>span.absolute]:hidden", className)} />
}

export { SelectTrigger, SelectContent, SelectItem }

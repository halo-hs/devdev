import type { ComponentProps } from "react"
import { DropdownMenuContent as DSDropdownMenuContent, DropdownMenuItem as DSDropdownMenuItem, DropdownMenuCheckboxItem as DSDropdownMenuCheckboxItem, DropdownMenuRadioItem as DSDropdownMenuRadioItem, DropdownMenuSubTrigger as DSDropdownMenuSubTrigger, DropdownMenuLabel as DSDropdownMenuLabel, DropdownMenuSeparator as DSDropdownMenuSeparator } from "@/components/ds2/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Figma DropdownMenuItem (3576:15904): Blue 10 hover with Blue 4 text; checked rows Blue 9 (3576:15953).
const itemHover = "hover:bg-[var(--color-primary-10)] hover:text-[var(--color-primary-4)] focus:bg-[var(--color-primary-10)] focus:text-[var(--color-primary-4)]"
const itemChecked = "data-[state=checked]:bg-[var(--color-primary-9)] data-[state=checked]:hover:bg-[var(--color-primary-9)] data-[state=checked]:focus:bg-[var(--color-primary-9)] data-[state=checked]:active:bg-[var(--color-primary-9)] data-[state=checked]:text-[var(--color-primary-4)] data-[state=checked]:data-disabled:bg-[var(--color-gray-9)] data-[state=checked]:data-disabled:text-[var(--color-gray-5)] [&_[data-slot$=item-indicator]]:right-4 [&_[data-slot$=item-indicator]]:text-[var(--color-primary-4)]"

export * from "@/components/ds2/ui/dropdown-menu"

// Figma DropdownMenuContent (3490:24687): 8px padding, Gray 9 ring, section shadow, 6px offset.
function DropdownMenuContent({ className, sideOffset = 6, ...props }: ComponentProps<typeof DSDropdownMenuContent>) {
  return <DSDropdownMenuContent sideOffset={sideOffset} {...props} className={cn("p-2 shadow-[var(--shadow-section)] ring-[var(--color-gray-10)]", className)} />
}

function DropdownMenuItem({ className, ...props }: ComponentProps<typeof DSDropdownMenuItem>) {
  return <DSDropdownMenuItem {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal", itemHover, className)} />
}

function DropdownMenuCheckboxItem({ className, ...props }: ComponentProps<typeof DSDropdownMenuCheckboxItem>) {
  return <DSDropdownMenuCheckboxItem {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal", itemHover, itemChecked, className)} />
}

function DropdownMenuRadioItem({ className, ...props }: ComponentProps<typeof DSDropdownMenuRadioItem>) {
  return <DSDropdownMenuRadioItem {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal", itemHover, itemChecked, className)} />
}

function DropdownMenuSubTrigger({ className, ...props }: ComponentProps<typeof DSDropdownMenuSubTrigger>) {
  return <DSDropdownMenuSubTrigger {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal", itemHover, className)} />
}

// Figma label: SemiBold 12 Gray 1, 6px vertical padding; divider Gray 8 with 6px space.
function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof DSDropdownMenuLabel>) {
  return <DSDropdownMenuLabel {...props} className={cn("py-1.5 text-[12px] leading-normal font-semibold text-[var(--color-gray-2)]", className)} />
}

function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof DSDropdownMenuSeparator>) {
  return <DSDropdownMenuSeparator {...props} className={cn("mx-0 my-1.5 bg-[var(--color-gray-9)]", className)} />
}

export { DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuSubTrigger, DropdownMenuLabel, DropdownMenuSeparator }

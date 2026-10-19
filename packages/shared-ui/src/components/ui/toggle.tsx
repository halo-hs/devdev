import type { ComponentProps } from "react"
import { Toggle as DSToggle, toggleVariants as dsToggleVariants } from "@ecoya/design-system/ui/toggle"
import { cn } from "@shared/lib/utils"

const sizes = {
  default: "h-9 min-w-9 [--leading-button-3:var(--text-base--line-height)] font-normal [--font-weight-medium:400]",
  sm: "[--leading-button-3:var(--text-base--line-height)] font-normal [--font-weight-medium:400]",
  lg: "font-normal [--font-weight-medium:400]",
} as const
function toggleVariants(options: Parameters<typeof dsToggleVariants>[0] = {}) {
  const { className, class: classValue, ...variants } = options
  return cn(dsToggleVariants(variants), sizes[variants.size ?? "default"], classValue, className)
}
function Toggle({ className, size = "default", ...props }: ComponentProps<typeof DSToggle>) {
  return <DSToggle {...props} size={size} className={cn(sizes[size ?? "default"], className)} />
}
export { Toggle, toggleVariants }

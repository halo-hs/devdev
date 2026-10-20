import type { ComponentProps } from "react"
import { TooltipContent as DSTooltipContent } from "@ecoya/design-system/ui/tooltip"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/tooltip"

// Figma Tooltip (158:442): 11/16 caption.
function TooltipContent({ className, ...props }: ComponentProps<typeof DSTooltipContent>) {
  return <DSTooltipContent {...props} className={cn("text-[length:var(--text-body-11)] leading-[var(--leading-body-11)]", className)} />
}

export { TooltipContent }

import type { ComponentProps } from "react"

import { cn } from "@shared/lib/utils"

/**
 * Figma Navigation Topbar (3893:6425 / 742:11599).
 *
 * The shell owns the positioning and product-specific controls; this
 * component keeps the shared 64px surface contract in one place so screens
 * can compose the same bar without duplicating its dimensions.
 */
function Topbar({ className, ...props }: ComponentProps<"header">) {
  return (
    <header
      data-slot="topbar"
      className={cn(
        "h-[var(--ui-shell-header-height)] w-full shrink-0 bg-[var(--surface-background)]",
        className,
      )}
      {...props}
    />
  )
}

export { Topbar }

import type { ComponentProps } from "react"
import { HoverCardContent as DSHoverCardContent } from "@ecoya/design-system/ui/hover-card"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/hover-card"

function HoverCardContent({ className, ...props }: ComponentProps<typeof DSHoverCardContent>) {
  return <DSHoverCardContent {...props} className={cn("w-[300px] ring-0 text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal", className)} />
}

export { HoverCardContent }

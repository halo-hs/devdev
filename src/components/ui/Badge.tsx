import type { ComponentProps } from "react"
import { Badge as DSBadge, badgeVariants as dsBadgeVariants } from "@/components/ds2/ui/Badge"
import { cn } from "@/lib/utils"

function badgeVariants(options: Parameters<typeof dsBadgeVariants>[0] = {}) {
  const { className, class: classValue, ...variants } = options
  return cn(dsBadgeVariants(variants), "font-normal", classValue, className)
}
export { badgeVariants }
export type { BadgePalette, BadgeProps, BadgeSize, BadgeTone, BadgeVariant, LegacyBadgeType } from "@/components/ds2/ui/Badge"

function Badge({ className, ...props }: ComponentProps<typeof DSBadge>) {
  return <DSBadge {...props} className={cn("font-normal", className)} />
}

export { Badge }

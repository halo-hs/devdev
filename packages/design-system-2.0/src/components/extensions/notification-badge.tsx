import * as React from "react"

import { Badge } from "@ecoya/design-system/ui/badge"
import { cn } from "@ecoya/design-system/lib/utils"

export type NotificationBadgeVariant = "count" | "dot"

export interface NotificationBadgeProps extends Omit<
  React.ComponentProps<typeof Badge>,
  "asChild" | "children" | "variant"
> {
  variant?: NotificationBadgeVariant
  count?: number
  max?: number
  label?: string
}

function NotificationBadge({
  variant = "dot",
  count = 0,
  max = 99,
  label,
  className,
  role = "status",
  "aria-label": ariaLabel,
  "aria-live": ariaLive = "polite",
  "aria-atomic": ariaAtomic = true,
  ...props
}: NotificationBadgeProps) {
  const normalizedCount = Number.isFinite(count)
    ? Math.max(0, Math.trunc(count))
    : 0
  const normalizedMax = Number.isFinite(max) ? Math.max(1, Math.trunc(max)) : 99
  const displayCount =
    normalizedCount > normalizedMax
      ? `${normalizedMax}+`
      : String(normalizedCount)
  const accessibleLabel =
    ariaLabel ??
    label ??
    (variant === "dot"
      ? "새 알림"
      : `새 알림 ${normalizedCount.toLocaleString("ko-KR")}개`)

  return (
    <Badge
      {...props}
      variant="destructive"
      role={role}
      aria-label={accessibleLabel}
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
      data-notification-variant={variant}
      className={cn(
        variant === "dot"
          ? "size-2.5 min-w-0 rounded-[var(--r-pill)] border-0 bg-destructive p-0 text-destructive-foreground"
          : "min-w-5 rounded-[var(--r-pill)] px-1.5 tabular-nums",
        className
      )}
    >
      {variant === "count" ? displayCount : null}
    </Badge>
  )
}

export { NotificationBadge }

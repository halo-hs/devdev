import type { ReactNode } from "react"

import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"

type StatusTone = "neutral" | "blue" | "success" | "warning" | "danger"

// Figma Badge (891:1212) status colors: Gray 9/Gray 3, Blue 10/Blue 4,
// Green 6/Green 1, Orange 6/Orange 1, Red 6/Red 2 (fill), and the same text
// color as a 1px border for the outline form.
const fill: Record<StatusTone, string> = {
  neutral: "bg-[var(--color-gray-10)] text-[var(--color-gray-4)]",
  blue: "bg-[var(--color-primary-10)] text-[var(--color-primary-4)]",
  success: "bg-[var(--color-green-6)] text-[var(--color-green-1)]",
  warning: "bg-[var(--color-orange-6)] text-[var(--color-orange-1)]",
  danger: "bg-[var(--color-red-8)] text-[var(--color-red-2)]",
}

const outline: Record<StatusTone, string> = {
  neutral: "border-[var(--color-gray-6)] text-[var(--color-gray-4)]",
  blue: "border-[var(--color-primary-4)] text-[var(--color-primary-4)]",
  success: "border-[var(--color-green-1)] text-[var(--color-green-1)]",
  warning: "border-[var(--color-orange-1)] text-[var(--color-orange-1)]",
  danger: "border-[var(--color-red-2)] text-[var(--color-red-2)]",
}

function StatusBadge({
  children,
  tone = "neutral",
  variant = "fill",
  className,
}: {
  children: ReactNode
  tone?: StatusTone
  variant?: "fill" | "outline"
  className?: string
}) {
  return (
    <Badge
      variant="secondary"
      data-slot="status-badge"
      className={cn(
        "h-5 rounded-[var(--r-pill)] px-2 text-[11px] leading-4 font-medium",
        variant === "outline"
          ? cn("border bg-transparent", outline[tone])
          : cn("border-0", fill[tone]),
        className
      )}
    >
      {children}
    </Badge>
  )
}

export { StatusBadge }
export type { StatusTone }

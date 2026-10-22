import type { CSSProperties, HTMLAttributes, ReactNode } from "react"

import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"

type StatusTone =
  | "neutral"
  | "blue"
  | "info"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "request"
  | "scheduled"
  | "inProgress"
  | "fieldDone"
  | "done"
  | "cancelled"

// Figma Badge (891:1212) status colors: Gray 9/Gray 3, Blue 10/Blue 4,
// Green 6/Green 1, Orange 6/Orange 1, Red 6/Red 2, plus the Trade OS
// workflow tones (request, scheduled, field done, done, cancelled).
const tones: Record<StatusTone, { fg: string; bg: string }> = {
  neutral: { fg: "var(--color-gray-4)", bg: "var(--color-gray-10)" },
  blue: { fg: "var(--color-primary-4)", bg: "var(--color-primary-10)" },
  info: { fg: "var(--color-primary-4)", bg: "var(--color-primary-10)" },
  brand: { fg: "var(--color-primary-4)", bg: "var(--color-blue-6)" },
  success: { fg: "var(--color-green-1)", bg: "var(--color-green-6)" },
  warning: { fg: "var(--color-orange-1)", bg: "var(--color-orange-6)" },
  danger: { fg: "var(--color-red-2)", bg: "var(--color-red-8)" },
  request: { fg: "var(--color-grape-2)", bg: "var(--color-grape-6)" },
  scheduled: { fg: "var(--color-pink-2)", bg: "var(--color-pink-6)" },
  inProgress: { fg: "var(--color-green-1)", bg: "var(--color-green-6)" },
  fieldDone: { fg: "var(--color-orange-2)", bg: "var(--color-orange-6)" },
  done: { fg: "var(--color-gray-4)", bg: "var(--color-gray-10)" },
  cancelled: { fg: "var(--color-gray-7)", bg: "var(--color-gray-10)" },
}

// xs is the list badge (20px, 11/16); sm and md are the larger badges the
// operations screens use for row states and headings.
const sizes = {
  xs: "h-5 px-2 text-[11px] leading-4",
  sm: "h-auto px-2.5 py-0.5 text-[12px] leading-[16px]",
  md: "h-auto px-[14px] py-1 text-[length:var(--text-body-7)] leading-[var(--leading-body-8)]",
} as const

type StatusBadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, "color"> & {
  children?: ReactNode
  tone?: StatusTone
  variant?: "fill" | "outline"
  size?: keyof typeof sizes
  /** Risk badges default to the square shape. */
  meaning?: "classification" | "risk" | "state"
  shape?: "pill" | "square"
}

function StatusBadge({
  children,
  tone = "neutral",
  variant = "fill",
  size = "xs",
  meaning,
  shape,
  className,
  style,
  ...props
}: StatusBadgeProps) {
  const color = tones[tone]
  const resolvedShape = shape ?? (meaning === "risk" ? "square" : "pill")
  const toneStyle: CSSProperties =
    variant === "outline"
      ? { borderColor: tone === "neutral" ? "var(--color-gray-6)" : color.fg, color: color.fg }
      : { backgroundColor: color.bg, color: color.fg }
  return (
    <Badge
      {...props}
      variant="secondary"
      data-slot="status-badge"
      data-tone={tone}
      data-meaning={meaning}
      data-shape={resolvedShape}
      className={cn(
        "shrink-0 whitespace-nowrap",
        sizes[size],
        resolvedShape === "square" ? "rounded font-bold" : "rounded-[var(--r-pill)] font-medium",
        variant === "outline" ? "border bg-transparent" : "border-0",
        className
      )}
      style={{ ...toneStyle, ...style }}
    >
      {children}
    </Badge>
  )
}

type DdayTone = "overdue" | "today" | "urgent" | "soon" | "normal"

const ddayTones: Record<DdayTone, StatusTone> = {
  overdue: "danger",
  today: "danger",
  urgent: "danger",
  soon: "warning",
  normal: "neutral",
}

function DdayBadge({ ddayTone = "normal", ...props }: Omit<StatusBadgeProps, "meaning" | "tone"> & { ddayTone?: DdayTone }) {
  return <StatusBadge {...props} meaning="risk" tone={ddayTones[ddayTone]} />
}

export { DdayBadge, StatusBadge }
export type { DdayTone, StatusBadgeProps, StatusTone }

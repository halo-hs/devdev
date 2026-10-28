import type { ComponentProps, ReactNode } from "react"

import { Card } from "@/components/ui/Card"
import { Separator } from "@/components/ui/Separator"
import { cn } from "@/lib/utils"

type KpiCardTone = "positive" | "negative" | "neutral"

const toneClasses: Record<KpiCardTone, string> = {
  negative: "text-[var(--color-red-2)]",
  positive: "text-[var(--color-primary-4)]",
  neutral: "text-[var(--color-gray-5)]",
}

type KpiCardProps = Omit<ComponentProps<typeof Card>, "children"> & {
  label: ReactNode
  value: ReactNode
  delta?: { text: ReactNode; tone: KpiCardTone } | null
  valueClassName?: string
  children?: ReactNode
}

// Figma KPI card (결산리포트 v6 · 5974:36276): Card without header, 14/20 label,
// Gray 9 separator, 26/36 value and 12/16 detail lines.
function KpiCard({ label, value, delta, valueClassName, className, children, ...props }: KpiCardProps) {
  return (
    <Card
      {...props}
      data-slot="kpi-card"
      className={cn("min-h-[148px] gap-2.5 px-[18px] py-5 ring-[var(--color-gray-10)]", className)}
    >
      <div className="text-[length:var(--text-body-9)] leading-5 font-semibold text-[var(--color-gray-2)]">{label}</div>
      <Separator />
      <div className={cn("text-[26px] leading-9 font-bold tabular-nums text-[var(--color-gray-2)]", valueClassName)}>{value}</div>
      {delta ? (
        <div className={cn("text-[12px] leading-4 tabular-nums", toneClasses[delta.tone])}>{delta.text}</div>
      ) : null}
      {children ? <div className="grid gap-0.5 text-[12px] leading-4 tabular-nums text-[var(--color-gray-5)]">{children}</div> : null}
    </Card>
  )
}

export { KpiCard }
export type { KpiCardTone }

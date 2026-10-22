import type { ReactNode } from "react"

import { Badge } from "@/components/ui/Badge"
import { MoneyValue } from "@/components/platform/Money"
import { cn } from "@/lib/utils"

export type SummaryMetricTone =
  | "neutral"
  | "blue"
  | "green"
  | "success"
  | "amber"
  | "warning"
  | "red"
  | "danger"

type SummaryMetricDecoration =
  | "blocked"
  | "deadline"
  | "document"
  | "inbound"
  | "neutral"
  | "outbound"
  | "progress"
  | "shipping"
  | "usage"
  | "warning"

export type SummaryMetricItem = {
  label: string
  value: ReactNode
  note?: ReactNode
  detail?: ReactNode
  tone?: SummaryMetricTone
  decoration?: SummaryMetricDecoration
  detailClassName?: string
}

type SummaryMetricStripProps = {
  items: readonly SummaryMetricItem[]
  className?: string
  itemClassName?: string
}

const noteToneClasses: Record<SummaryMetricTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  blue: "bg-primary/10 text-primary",
  green: "bg-emerald-50 text-emerald-700",
  success: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  warning: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  danger: "bg-red-50 text-red-700",
}

function resolveDecoration(label: string): SummaryMetricDecoration {
  if (/Blocked|차단|연체/.test(label)) return "blocked"
  if (/리스크|Risk|위험|초과/.test(label)) return "warning"
  if (/B\/L|문서|서류|누락/.test(label)) return "document"
  if (/운송|선적/.test(label)) return "shipping"
  if (/받을|수취|실수금|입금/.test(label)) return "inbound"
  if (/보낼|지급/.test(label)) return "outbound"
  if (/대기|D-|예정|만기|도착|Pending|소진|ETA/.test(label)) {
    return "deadline"
  }
  if (/토큰|사용|한도/.test(label)) return "usage"
  if (/순포지션|순유입|처리량|Throughput|거래액|GP|성과|남은|진행/.test(label)) {
    return "progress"
  }
  return "neutral"
}

function MetricValue({ value }: { value: ReactNode }) {
  if (typeof value !== "string") return value

  const match = value.match(/^([+-]?[\d,]+(?:\.\d+)?)\s+(USD|KRW|EUR)$/)
  return match ? <MoneyValue value={match[1]} currency={match[2]} /> : value
}

export function SummaryMetricStrip({
  items,
  className,
  itemClassName,
}: SummaryMetricStripProps) {
  return (
    <div
      className={cn(
        "ui-summary-strip ui-summary-hero grid sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {items.map((item) => {
        const tone = item.tone ?? "neutral"

        return (
          <div
            key={item.label}
            data-tone={tone}
            data-decoration={item.decoration ?? resolveDecoration(item.label)}
            className={cn("min-w-0 px-4 py-4", itemClassName)}
          >
            {/* Figma KPI (결산리포트 v6): label 14/20 SemiBold, value 26/36 Bold, detail 12/16. */}
            <div className="text-[length:var(--text-body-9)] leading-5 font-semibold text-[var(--color-gray-2)]">{item.label}</div>
            <div className="mt-1 flex items-end justify-between gap-2">
              <strong className="text-[26px] leading-9 font-bold tabular-nums">
                <MetricValue value={item.value} />
              </strong>
              {item.note ? (
                <Badge
                  className={cn(
                    "h-5 rounded-full border-0 px-2 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] font-normal",
                    noteToneClasses[tone]
                  )}
                >
                  {item.note}
                </Badge>
              ) : null}
            </div>
            {item.detail ? (
              <div
                className={cn(
                  "mt-1 text-[12px] leading-4 text-muted-foreground",
                  item.detailClassName
                )}
              >
                {item.detail}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

import type { ComponentProps, ReactNode } from "react"

import { cn } from "@shared/lib/utils"

type PeriodCloseRowProps = Omit<ComponentProps<"span">, "children"> & {
  period: ReactNode
  status?: ReactNode
  detail?: ReactNode
}

// Figma 월마감 row (결산리포트 v6 · 5789:54773): period 13/18 SemiBold over a status
// Badge, then 11/16 history. Spans keep it valid inside a snapshot button; the list
// adds the Gray 9 dividers and the trailing 32px action.
function PeriodCloseRow({ period, status, detail, className, ...props }: PeriodCloseRowProps) {
  return (
    <span {...props} data-slot="period-close-row" className={cn("flex min-w-0 items-center gap-3.5", className)}>
      <span className="grid w-[65px] shrink-0 justify-items-start gap-2">
        <span className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] font-semibold tabular-nums text-[var(--color-gray-2)]">
          {period}
        </span>
        {status}
      </span>
      <span className="min-w-0 flex-1 text-[length:var(--text-body-11)] leading-[var(--leading-body-11)] text-[var(--color-gray-5)]">
        {detail}
      </span>
    </span>
  )
}

export { PeriodCloseRow }

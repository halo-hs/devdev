import type { ComponentProps, ReactNode } from "react"

import { Progress } from "@shared/components/ui/progress"
import { cn } from "@shared/lib/utils"

type RankingRowProps = Omit<ComponentProps<"span">, "children"> & {
  name: ReactNode
  amount: ReactNode
  unit?: ReactNode
  /** Share of the largest row, 0–100. */
  ratio: number
  children?: ReactNode
}

// Figma 고객사 Top 5 row (결산리포트 v6 · 5968:209254): 13/18 name, 14/20 amount
// with an 11px unit, 4px Progress bar, then 12/16 and 11/16 detail lines.
// Spans keep the row valid inside a toggle button.
function RankingRow({ name, amount, unit, ratio, className, children, ...props }: RankingRowProps) {
  return (
    <span {...props} data-slot="ranking-row" className={cn("grid gap-2 py-4", className)}>
      <span className="flex min-w-0 items-baseline justify-between gap-2.5">
        <span className="min-w-0 truncate text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] font-semibold text-[var(--color-gray-2)]">
          {name}
        </span>
        <span className="flex shrink-0 items-baseline gap-1 tabular-nums">
          <span className="text-[length:var(--text-body-9)] leading-5 font-bold text-[var(--color-gray-2)]">{amount}</span>
          {unit ? <span className="text-[length:var(--text-body-11)] leading-[var(--leading-body-11)] text-[var(--color-gray-5)]">{unit}</span> : null}
        </span>
      </span>
      <Progress value={Math.max(0, Math.min(100, ratio))} aria-hidden="true" />
      {children ? <span className="grid justify-items-start gap-1.5 text-[12px] leading-4 text-[var(--color-gray-5)]">{children}</span> : null}
    </span>
  )
}

export { RankingRow }

import type { ComponentProps } from "react"
import { ChartLegendContent as DSChartLegendContent, ChartTooltipContent as DSChartTooltipContent } from "@ecoya/design-system/ui/chart"
import { cn } from "@shared/lib/utils"
export * from "@ecoya/design-system/ui/chart"
// Figma ChartLegendContent (5729:113593): top-right, 14px apart, 10px square swatches.
function ChartLegendContent({ className, ...props }: ComponentProps<typeof DSChartLegendContent>) {
  return <DSChartLegendContent {...props} className={cn("justify-end gap-3.5 text-[12px] leading-[14px] font-normal text-[var(--color-gray-2)] [&>div>div]:size-2.5 [&>div>div]:rounded-[2px]", className)} />
}
// Figma ChartTooltipContent (5729:113608): dark 11/16 box without border, shadow or indicator.
function ChartTooltipContent({ className, labelClassName, hideIndicator = true, ...props }: ComponentProps<typeof DSChartTooltipContent>) {
  return <DSChartTooltipContent {...props} hideIndicator={hideIndicator} className={cn("min-w-0 gap-0 rounded-[var(--r-sm)] border-0 bg-[var(--color-gray-2)] px-3 py-1.5 text-[length:var(--text-body-11)] leading-[var(--leading-body-11)] text-[var(--color-gray-12)] shadow-none [&_span]:text-[var(--color-gray-12)] [&_.font-mono]:font-sans [&_.font-mono]:font-normal", className)} labelClassName={cn("font-semibold", labelClassName)} />
}
export { ChartLegendContent, ChartTooltipContent }

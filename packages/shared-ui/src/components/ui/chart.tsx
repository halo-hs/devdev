import type { ComponentProps } from "react"
import { ChartLegendContent as DSChartLegendContent, ChartTooltipContent as DSChartTooltipContent } from "@ecoya/design-system/ui/chart"
import { cn } from "@shared/lib/utils"
export * from "@ecoya/design-system/ui/chart"
function ChartLegendContent({ className, ...props }: ComponentProps<typeof DSChartLegendContent>) {
  return <DSChartLegendContent {...props} className={cn("text-[12px] leading-[14px] font-normal", className)} />
}
function ChartTooltipContent({ labelClassName, ...props }: ComponentProps<typeof DSChartTooltipContent>) {
  return <DSChartTooltipContent {...props} labelClassName={cn("font-semibold", labelClassName)} />
}
export { ChartLegendContent, ChartTooltipContent }

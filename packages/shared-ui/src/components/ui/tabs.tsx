import type { ComponentProps } from "react"
import { Tabs as DSTabs, TabsList as DSTabsList, TabsTrigger as DSTabsTrigger, TabsContent as DSTabsContent, tabsListVariants as dsTabsListVariants } from "@ecoya/design-system/ui/tabs"
import { cn } from "@shared/lib/utils"

const listSizes = "p-1 gap-1 rounded-[var(--r-pill)] shadow-[var(--shadow-section)] group-data-horizontal/tabs:h-11 data-[variant=line]:p-0 data-[variant=line]:shadow-none group-data-horizontal/tabs:data-[variant=line]:h-7"

function tabsListVariants(options: Parameters<typeof dsTabsListVariants>[0] = {}) {
  const { className, class: classValue, ...variants } = options
  return cn(dsTabsListVariants(variants), listSizes, classValue, className)
}
function Tabs({ className, ...props }: ComponentProps<typeof DSTabs>) {
  return <DSTabs {...props} className={cn("gap-4", className)} />
}
// Figma SegmentTabs (5762:31226): gray track for switching one table's view.
// The pill list stays reserved for hero banner filters.
const segmentList = "gap-0.5 rounded-[8px] bg-[#f1f2f5] p-[3px] shadow-none group-data-horizontal/tabs:h-8"
const segmentTrigger = "group-data-[variant=segment]/tabs-list:h-[26px] group-data-[variant=segment]/tabs-list:flex-none group-data-[variant=segment]/tabs-list:rounded-[6px] group-data-[variant=segment]/tabs-list:px-3 group-data-[variant=segment]/tabs-list:py-0 group-data-[variant=segment]/tabs-list:text-[13px] group-data-[variant=segment]/tabs-list:leading-[1.5] group-data-[variant=segment]/tabs-list:font-medium group-data-[variant=segment]/tabs-list:text-[var(--muted-foreground)] group-data-[variant=segment]/tabs-list:hover:bg-[#e8eaee] group-data-[variant=segment]/tabs-list:disabled:text-[#b2b4bc] group-data-[variant=segment]/tabs-list:data-active:bg-[var(--card)] group-data-[variant=segment]/tabs-list:data-active:font-semibold group-data-[variant=segment]/tabs-list:data-active:text-[var(--foreground)] group-data-[variant=segment]/tabs-list:data-active:shadow-[0_1px_1.5px_rgb(0_0_0/8%)]"

type TabsListProps = Omit<ComponentProps<typeof DSTabsList>, "variant"> & {
  variant?: ComponentProps<typeof DSTabsList>["variant"] | "segment"
}

function TabsList({ className, variant, ...props }: TabsListProps) {
  if (variant === "segment") {
    return <DSTabsList {...props} data-variant="segment" className={cn(listSizes, segmentList, className)} />
  }
  return <DSTabsList {...props} variant={variant} className={cn(listSizes, className)} />
}
function TabsTrigger({ className, ...props }: ComponentProps<typeof DSTabsTrigger>) {
  return <DSTabsTrigger {...props} className={cn("h-9 gap-2 rounded-[var(--r-pill)] border-0 px-4 py-2 text-[14px] leading-5 group-data-[variant=default]/tabs-list:data-active:shadow-[0_2px_4px_rgb(0_0_0/5%)] group-data-[variant=line]/tabs-list:h-7 group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:px-3 group-data-[variant=line]/tabs-list:py-0 group-data-[variant=line]/tabs-list:after:bottom-0", segmentTrigger, className)} />
}
function TabsContent({ className, ...props }: ComponentProps<typeof DSTabsContent>) {
  return <DSTabsContent {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)]", className)} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }

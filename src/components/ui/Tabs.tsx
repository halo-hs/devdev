import type { ComponentProps } from "react"
import { Tabs as DSTabs, TabsList as DSTabsList, TabsTrigger as DSTabsTrigger, TabsContent as DSTabsContent, tabsListVariants as dsTabsListVariants } from "@/components/ds2/ui/Tabs"
import { cn } from "@/lib/utils"

// Figma Tabs (6847:41341): gray pill track, no elevation. size sm 32 · default 40 · lg 44
// (TabsTrigger 24 · 32 · 36 inside a 4px inset).
const listSizes = "p-1 gap-1 rounded-[var(--r-pill)] shadow-none group-data-horizontal/tabs:h-10 group-data-horizontal/tabs:data-[size=sm]:h-8 group-data-horizontal/tabs:data-[size=lg]:h-11 data-[variant=line]:p-0 group-data-horizontal/tabs:data-[variant=line]:h-7"

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
  size?: "sm" | "default" | "lg"
}

function TabsList({ className, variant, size = "default", ...props }: TabsListProps) {
  if (variant === "segment") {
    return <DSTabsList {...props} data-variant="segment" className={cn(listSizes, segmentList, className)} />
  }
  return <DSTabsList {...props} data-size={size} variant={variant} className={cn(listSizes, className)} />
}
// Figma TabsTrigger (6847:41208): sm 13/18 · 12px sides, default and lg 14/20 · 16px sides.
const triggerSizes = "h-8 gap-2 px-4 py-0 text-[14px] leading-5 group-data-[size=sm]/tabs-list:h-6 group-data-[size=sm]/tabs-list:gap-1.5 group-data-[size=sm]/tabs-list:px-3 group-data-[size=sm]/tabs-list:text-[13px] group-data-[size=sm]/tabs-list:leading-[18px] group-data-[size=lg]/tabs-list:h-9"

function TabsTrigger({ className, ...props }: ComponentProps<typeof DSTabsTrigger>) {
  return <DSTabsTrigger {...props} className={cn(triggerSizes, "group/tabs-trigger rounded-[var(--r-pill)] border-0 font-semibold group-data-[variant=default]/tabs-list:data-active:shadow-[0_2px_2px_rgb(0_0_0/5%)] group-data-[variant=line]/tabs-list:h-7 group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:px-3 group-data-[variant=line]/tabs-list:py-0 group-data-[variant=line]/tabs-list:after:bottom-0", segmentTrigger, className)} />
}
// Count pill inside a TabsTrigger: Gray 8 / Gray 4 at rest, Blue 4 / white when its tab is selected.
function TabsCount({ className, ...props }: ComponentProps<"span">) {
  return <span {...props} data-slot="tabs-count" className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-[var(--r-pill)] bg-[var(--color-gray-8)] px-1 text-[12px] leading-4 font-normal text-[var(--color-gray-4)] tabular-nums group-data-active/tabs-trigger:bg-[var(--color-primary-4)] group-data-active/tabs-trigger:text-white", className)} />
}
function TabsContent({ className, ...props }: ComponentProps<typeof DSTabsContent>) {
  return <DSTabsContent {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)]", className)} />
}

export { Tabs, TabsList, TabsTrigger, TabsCount, TabsContent, tabsListVariants }

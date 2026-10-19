import type { ComponentProps } from "react"
import { Tabs as DSTabs, TabsList as DSTabsList, TabsTrigger as DSTabsTrigger, TabsContent as DSTabsContent, tabsListVariants as dsTabsListVariants } from "@ecoya/design-system/ui/tabs"
import { cn } from "@shared/lib/utils"

const listSizes = "p-1 gap-1 rounded-[var(--r-pill)] shadow-[var(--tabs-list-shadow)] group-data-horizontal/tabs:h-11 data-[variant=line]:p-0 data-[variant=line]:shadow-none group-data-horizontal/tabs:data-[variant=line]:h-7"

function tabsListVariants(options: Parameters<typeof dsTabsListVariants>[0] = {}) {
  const { className, class: classValue, ...variants } = options
  return cn(dsTabsListVariants(variants), listSizes, classValue, className)
}
function Tabs({ className, ...props }: ComponentProps<typeof DSTabs>) {
  return <DSTabs {...props} className={cn("gap-4", className)} />
}
function TabsList({ className, ...props }: ComponentProps<typeof DSTabsList>) {
  return <DSTabsList {...props} className={cn(listSizes, className)} />
}
function TabsTrigger({ className, ...props }: ComponentProps<typeof DSTabsTrigger>) {
  return <DSTabsTrigger {...props} className={cn("h-9 gap-2 rounded-[var(--r-pill)] border-0 px-4 py-2 text-[14px] leading-5 group-data-[variant=default]/tabs-list:data-active:shadow-[var(--tabs-selected-shadow)] group-data-[variant=line]/tabs-list:h-7 group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:px-3 group-data-[variant=line]/tabs-list:py-0 group-data-[variant=line]/tabs-list:after:bottom-0", className)} />
}
function TabsContent({ className, ...props }: ComponentProps<typeof DSTabsContent>) {
  return <DSTabsContent {...props} className={cn("text-[length:var(--text-body-md)] leading-[var(--leading-body-md)]", className)} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }

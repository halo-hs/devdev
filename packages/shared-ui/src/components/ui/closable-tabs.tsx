import type { ComponentProps } from "react"

import {
  ClosableTabs as DSClosableTabs,
  ClosableTabsContent as DSClosableTabsContent,
  ClosableTabsList as DSClosableTabsList,
  ClosableTabsTrigger as DSClosableTabsTrigger,
} from "@ecoya/design-system/extensions/closable-tabs"
import { cn } from "@shared/lib/utils"

// Keep the extension on the same shadcn/Figma pill geometry as Tabs.
function ClosableTabs({ className, ...props }: ComponentProps<typeof DSClosableTabs>) {
  return <DSClosableTabs {...props} className={cn("gap-4", className)} />
}

function ClosableTabsList({ className, ...props }: ComponentProps<typeof DSClosableTabsList>) {
  return <DSClosableTabsList {...props} className={cn("gap-1 rounded-[var(--r-pill)] p-1 shadow-[var(--shadow-section)]", className)} />
}

function ClosableTabsContent({ className, ...props }: ComponentProps<typeof DSClosableTabsContent>) {
  return <DSClosableTabsContent {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)]", className)} />
}

function ClosableTabsTrigger({ className, ...props }: ComponentProps<typeof DSClosableTabsTrigger>) {
  return <DSClosableTabsTrigger {...props} className={cn("h-9 gap-2 rounded-[var(--r-pill)] border-0 px-4 py-2 text-[14px] leading-5", className)} />
}

export { ClosableTabs, ClosableTabsList, ClosableTabsContent, ClosableTabsTrigger }

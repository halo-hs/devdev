import type { ComponentProps } from "react"

import { TabsList, TabsTrigger } from "@shared/components/ui/tabs"

/** The compact gray track used when switching a table or card view. */
function SegmentTabs({ className, ...props }: ComponentProps<typeof TabsList>) {
  return <TabsList {...props} variant="segment" className={className} />
}

/** One item inside a SegmentTabs track. */
function SegmentTab({ className, ...props }: ComponentProps<typeof TabsTrigger>) {
  return <TabsTrigger {...props} className={className} />
}

export { SegmentTabs, SegmentTab }

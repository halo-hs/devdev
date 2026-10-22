import type { ComponentProps } from "react"
import { Skeleton as DSSkeleton } from "@/components/ds2/ui/skeleton"
import { cn } from "@/lib/utils"

export * from "@/components/ds2/ui/skeleton"

// Figma Skeleton (4099:9747): text lines use a 4px radius; blocks pass their own radius.
function Skeleton({ className, ...props }: ComponentProps<typeof DSSkeleton>) {
  return <DSSkeleton {...props} className={cn("rounded-[4px]", className)} />
}

export { Skeleton }

import type { ComponentProps } from "react"
import { Separator as DSSeparator } from "@/components/ds2/ui/separator"
import { cn } from "@/lib/utils"

export * from "@/components/ds2/ui/separator"

// Figma Separator (151:313): Gray 9 line.
function Separator({ className, ...props }: ComponentProps<typeof DSSeparator>) {
  return <DSSeparator {...props} className={cn("bg-[var(--color-gray-10)]", className)} />
}

export { Separator }

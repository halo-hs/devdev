import type { ComponentProps } from "react"
import { Separator as DSSeparator } from "@ecoya/design-system/ui/separator"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/separator"

// Figma Separator (151:313): Gray 9 line.
function Separator({ className, ...props }: ComponentProps<typeof DSSeparator>) {
  return <DSSeparator {...props} className={cn("bg-[var(--color-gray-10)]", className)} />
}

export { Separator }

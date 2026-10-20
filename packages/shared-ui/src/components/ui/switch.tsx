import type { ComponentProps } from "react"
import { Switch as DSSwitch } from "@ecoya/design-system/ui/switch"
import { cn } from "@shared/lib/utils"

// Figma Switch uses an Indigo 1 (--primary) track when on.
function Switch({ className, ...props }: ComponentProps<typeof DSSwitch>) {
  return <DSSwitch {...props} className={cn("[--control-selected-background:var(--primary)]", className)} />
}

export { Switch }

import type { ComponentProps } from "react"
import { Label as DSLabel } from "@ecoya/design-system/ui/label"
import { cn } from "@shared/lib/utils"


function Label({ className, ...props }: ComponentProps<typeof DSLabel>) {
  return <DSLabel {...props} className={cn("gap-1.5 font-normal text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)]", className)} />
}

export { Label }

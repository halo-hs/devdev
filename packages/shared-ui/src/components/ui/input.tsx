import type { ComponentProps } from "react"
import { Input as DSInput } from "@ecoya/design-system/ui/input"
import { cn } from "@shared/lib/utils"


function Input({ className, ...props }: ComponentProps<typeof DSInput>) {
  return <DSInput {...props} className={cn("text-[length:var(--text-body-lg)] leading-[var(--leading-body-lg)]", className)} />
}

export { Input }

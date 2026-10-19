import type { ComponentProps } from "react"
import { Textarea as DSTextarea } from "@ecoya/design-system/ui/textarea"
import { cn } from "@shared/lib/utils"


function Textarea({ className, ...props }: ComponentProps<typeof DSTextarea>) {
  return <DSTextarea {...props} className={cn("min-h-[88px] text-[length:var(--text-body-6)] leading-[var(--leading-body-6)]", className)} />
}

export { Textarea }

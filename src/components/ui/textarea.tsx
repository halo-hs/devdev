import type { ComponentProps } from "react"
import { Textarea as DSTextarea } from "@/components/ds2/ui/textarea"
import { cn } from "@/lib/utils"


function Textarea({ className, ...props }: ComponentProps<typeof DSTextarea>) {
  return <DSTextarea {...props} className={cn("min-h-[88px] text-[length:var(--text-body-6)] leading-[var(--leading-body-6)] disabled:placeholder:text-[var(--control-disabled-foreground)]", className)} />
}

export { Textarea }

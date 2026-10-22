import type { ComponentProps } from "react"
import { Input as DSInput } from "@/components/ds2/ui/input"
import { cn } from "@/lib/utils"

// Figma Input readonly: Gray 9 fill with a Gray 8 border; disabled placeholder is Gray 5.
function Input({ className, ...props }: ComponentProps<typeof DSInput>) {
  return <DSInput {...props} className={cn("text-[length:var(--text-body-6)] leading-[var(--leading-body-6)] disabled:placeholder:text-[var(--control-disabled-foreground)]", className)} />
}

export { Input }

import type { ComponentProps } from "react"
import { InputGroupInput as DSInputGroupInput, InputGroupTextarea as DSInputGroupTextarea } from "@ecoya/design-system/ui/input-group"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/input-group"

function InputGroupInput({ className, ...props }: ComponentProps<typeof DSInputGroupInput>) {
  return <DSInputGroupInput {...props} className={cn("text-[length:var(--text-body-lg)] leading-[var(--leading-body-lg)] font-normal", className)} />
}

function InputGroupTextarea({ className, ...props }: ComponentProps<typeof DSInputGroupTextarea>) {
  return <DSInputGroupTextarea {...props} className={cn("text-[length:var(--text-body-lg)] leading-[var(--leading-body-lg)] font-normal", className)} />
}

export { InputGroupInput, InputGroupTextarea }

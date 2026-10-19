import type { ComponentProps } from "react"
import { CommandInput as DSCommandInput, CommandItem as DSCommandItem } from "@ecoya/design-system/ui/command"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/command"

function CommandInput({ className, ...props }: ComponentProps<typeof DSCommandInput>) {
  return <DSCommandInput {...props} className={cn("text-[length:var(--text-body-6)] leading-[var(--leading-body-6)] font-normal", className)} />
}

function CommandItem({ className, ...props }: ComponentProps<typeof DSCommandItem>) {
  return <DSCommandItem {...props} className={cn("text-[length:var(--text-body-6)] leading-[var(--leading-body-6)] font-normal [--text-body-9:var(--text-body-6)] [--leading-body-9:var(--leading-body-6)]", className)} />
}

export { CommandInput, CommandItem }

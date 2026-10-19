import type { ComponentProps } from "react"
import { CommandInput as DSCommandInput, CommandItem as DSCommandItem } from "@ecoya/design-system/ui/command"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/command"

function CommandInput({ className, ...props }: ComponentProps<typeof DSCommandInput>) {
  return <DSCommandInput {...props} className={cn("text-[length:var(--text-body-lg)] leading-[var(--leading-body-lg)] font-normal", className)} />
}

function CommandItem({ className, ...props }: ComponentProps<typeof DSCommandItem>) {
  return <DSCommandItem {...props} className={cn("text-[length:var(--text-body-lg)] leading-[var(--leading-body-lg)] font-normal [--text-body-9:var(--text-body-lg)] [--leading-body-9:var(--leading-body-lg)]", className)} />
}

export { CommandInput, CommandItem }

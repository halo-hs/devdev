import type { ComponentProps } from "react"
import { CommandInput as DSCommandInput, CommandItem as DSCommandItem } from "@/components/ds2/ui/Command"
import { cn } from "@/lib/utils"

export * from "@/components/ds2/ui/Command"

function CommandInput({ className, ...props }: ComponentProps<typeof DSCommandInput>) {
  return <DSCommandInput {...props} className={cn("text-[length:var(--text-body-6)] leading-[var(--leading-body-6)] font-normal", className)} />
}

function CommandItem({ className, ...props }: ComponentProps<typeof DSCommandItem>) {
  return <DSCommandItem {...props} className={cn("text-[length:var(--text-body-6)] leading-[var(--leading-body-6)] font-normal [--text-body-9:var(--text-body-6)] [--leading-body-9:var(--leading-body-6)]", className)} />
}

export { CommandInput, CommandItem }

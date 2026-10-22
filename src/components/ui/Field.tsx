import type { ComponentProps } from "react"
import { FieldLabel as DSFieldLabel, FieldTitle as DSFieldTitle, FieldDescription as DSFieldDescription } from "@/components/ds2/ui/Field"
import { cn } from "@/lib/utils"

export * from "@/components/ds2/ui/Field"

function FieldLabel({ className, ...props }: ComponentProps<typeof DSFieldLabel>) {
  return <DSFieldLabel {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal gap-1.5", className)} />
}

function FieldTitle({ className, ...props }: ComponentProps<typeof DSFieldTitle>) {
  return <DSFieldTitle {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal", className)} />
}

function FieldDescription({ className, ...props }: ComponentProps<typeof DSFieldDescription>) {
  return <DSFieldDescription {...props} className={cn("text-[length:var(--text-body-10)] leading-[var(--leading-body-10)]", className)} />
}

export { FieldLabel, FieldTitle, FieldDescription }

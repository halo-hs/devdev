import type { ComponentProps } from "react"
import { FieldLabel as DSFieldLabel, FieldTitle as DSFieldTitle, FieldDescription as DSFieldDescription } from "@ecoya/design-system/ui/field"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/field"

function FieldLabel({ className, ...props }: ComponentProps<typeof DSFieldLabel>) {
  return <DSFieldLabel {...props} className={cn("text-[length:var(--text-body-md)] leading-[var(--leading-body-md)] font-normal gap-1.5", className)} />
}

function FieldTitle({ className, ...props }: ComponentProps<typeof DSFieldTitle>) {
  return <DSFieldTitle {...props} className={cn("text-[length:var(--text-body-md)] leading-[var(--leading-body-md)] font-normal", className)} />
}

function FieldDescription({ className, ...props }: ComponentProps<typeof DSFieldDescription>) {
  return <DSFieldDescription {...props} className={cn("text-[length:var(--text-body-sm)] leading-[var(--leading-body-sm)]", className)} />
}

export { FieldLabel, FieldTitle, FieldDescription }

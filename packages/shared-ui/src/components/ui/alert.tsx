import type { ComponentProps } from "react"
import { Alert as DSAlert, AlertTitle as DSAlertTitle, AlertDescription as DSAlertDescription, alertVariants as dsAlertVariants } from "@ecoya/design-system/ui/alert"
import { cn } from "@shared/lib/utils"

export { AlertAction } from "@ecoya/design-system/ui/alert"
export type { AlertProps } from "@ecoya/design-system/ui/alert"


const surfaceVariants = {
  default: "border-[var(--component-outline)] text-[var(--component-title)] *:data-[slot=alert-description]:text-[var(--component-title)]",
  neutral: "border-[var(--alert-neutral-border)] text-[var(--alert-neutral-foreground)] *:data-[slot=alert-title]:text-[var(--alert-neutral-foreground)] *:data-[slot=alert-description]:text-[var(--alert-neutral-foreground)]",
  gray: "border-[var(--alert-neutral-border)] text-[var(--alert-neutral-foreground)] *:data-[slot=alert-title]:text-[var(--alert-neutral-foreground)] *:data-[slot=alert-description]:text-[var(--alert-neutral-foreground)]",
  caution: "bg-[var(--alert-caution-background)] border-[var(--alert-caution-border)] text-[var(--alert-caution-foreground)] *:data-[slot=alert-description]:text-[var(--alert-caution-foreground)]",
  positive: "", blue: "", riskHigh: "", destructive: "",
} as const

function alertVariants(options: Parameters<typeof dsAlertVariants>[0] = {}) {
  const { className, class: classValue, ...variants } = options
  return cn(dsAlertVariants(variants), surfaceVariants[variants.variant ?? "default"], classValue, className)
}

function Alert({ className, variant = "default", ...props }: ComponentProps<typeof DSAlert>) {
  return <DSAlert {...props} variant={variant} className={cn("px-4 py-3 text-[length:var(--text-body-md)] leading-[var(--leading-body-md)] *:[svg:not([class*='size-'])]:size-5", surfaceVariants[variant ?? "default"], className)} />
}

function AlertTitle({ className, ...props }: ComponentProps<typeof DSAlertTitle>) {
  return <DSAlertTitle {...props} className={cn("text-[length:var(--text-body-md)] leading-[var(--leading-body-md)] font-normal", className)} />
}

function AlertDescription({ className, ...props }: ComponentProps<typeof DSAlertDescription>) {
  return <DSAlertDescription {...props} className={cn("text-[length:var(--text-body-md)] leading-[var(--leading-body-md)]", className)} />
}

export { Alert, AlertTitle, AlertDescription, alertVariants }

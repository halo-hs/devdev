import type { ComponentProps } from "react"
import { Alert as DSAlert, AlertTitle as DSAlertTitle, AlertDescription as DSAlertDescription, alertVariants as dsAlertVariants } from "@/components/ds2/ui/alert"
import { cn } from "@/lib/utils"

export { AlertAction } from "@/components/ds2/ui/alert"
export type { AlertProps } from "@/components/ds2/ui/alert"


const surfaceVariants = {
  default: "border-[var(--color-gray-9)] text-[var(--surface-foreground)] *:data-[slot=alert-description]:text-[var(--surface-foreground)]",
  neutral: "border-[var(--color-gray-9)] text-[var(--surface-foreground)] *:data-[slot=alert-title]:text-[var(--surface-foreground)] *:data-[slot=alert-description]:text-[var(--surface-foreground)]",
  gray: "border-[var(--color-gray-9)] text-[var(--surface-foreground)] *:data-[slot=alert-title]:text-[var(--surface-foreground)] *:data-[slot=alert-description]:text-[var(--surface-foreground)]",
  caution: "bg-[var(--color-orange-6)] border-[var(--color-orange-4)] text-[var(--color-orange-1)] *:data-[slot=alert-description]:text-[var(--color-orange-1)]",
  positive: "", blue: "", riskHigh: "", destructive: "",
} as const

function alertVariants(options: Parameters<typeof dsAlertVariants>[0] = {}) {
  const { className, class: classValue, ...variants } = options
  return cn(dsAlertVariants(variants), surfaceVariants[variants.variant ?? "default"], classValue, className)
}

function Alert({ className, variant = "default", ...props }: ComponentProps<typeof DSAlert>) {
  return <DSAlert {...props} variant={variant} className={cn("px-4 py-3 text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] *:[svg:not([class*='size-'])]:size-5", surfaceVariants[variant ?? "default"], className)} />
}

function AlertTitle({ className, ...props }: ComponentProps<typeof DSAlertTitle>) {
  return <DSAlertTitle {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal", className)} />
}

function AlertDescription({ className, ...props }: ComponentProps<typeof DSAlertDescription>) {
  return <DSAlertDescription {...props} className={cn("text-[length:var(--text-body-10)] leading-[var(--leading-body-10)]", className)} />
}

export { Alert, AlertTitle, AlertDescription, alertVariants }

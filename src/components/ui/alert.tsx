import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const baseAlertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-[var(--r-md)] border px-2.5 py-2 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-[var(--surface-border)] bg-[var(--surface-background)] bg-card text-[var(--surface-foreground)]",
        destructive:
          "border-[var(--color-red-6)] bg-[var(--color-red-8)] text-[var(--color-red-2)] text-destructive *:data-[slot=alert-description]:text-[var(--color-red-2)] *:[svg]:text-current",
        positive:
          "border-[var(--color-primary-9)] bg-[var(--color-primary-10)] px-4 py-3 text-[var(--color-primary-4)] *:data-[slot=alert-description]:text-[var(--color-primary-4)]",
        neutral:
          "border-[var(--color-gray-9)] bg-[var(--color-gray-11)] px-4 py-3 text-[var(--color-primary-4)] *:data-[slot=alert-description]:text-[var(--color-indigo)] *:data-[slot=alert-title]:text-[var(--color-indigo)]",
        caution:
          "border-[var(--color-yellow-5)] bg-[var(--color-yellow-6)] px-4 py-3 text-[var(--color-yellow-1)] *:data-[slot=alert-description]:text-[var(--color-yellow-1)]",
        riskHigh:
          "border-[var(--color-red-6)] bg-[var(--color-red-8)] px-4 py-3 text-[var(--color-red-2)] *:data-[slot=alert-description]:text-[var(--color-red-2)]",
        blue: "border-[var(--color-primary-9)] bg-[var(--color-primary-10)] px-4 py-3 text-[var(--color-primary-4)] *:data-[slot=alert-description]:text-[var(--color-primary-4)]",
        gray: "border-[var(--color-gray-9)] bg-[var(--color-gray-11)] px-4 py-3 text-[var(--color-primary-4)] *:data-[slot=alert-description]:text-[var(--color-indigo)] *:data-[slot=alert-title]:text-[var(--color-indigo)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type AlertProps = React.ComponentProps<"div"> &
  VariantProps<typeof baseAlertVariants>

function Alert({ className, variant = "default", ...props }: AlertProps) {
  const resolvedVariant = variant ?? "default"

  return (
    <div
      data-slot="alert"
      data-variant={resolvedVariant}
      role="alert"
      className={cn(
        baseAlertVariants({ variant: resolvedVariant }),
        "px-4 py-3 text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] *:[svg:not([class*='size-'])]:size-5",
        surfaceVariants[variant ?? "default"],
        className
      )}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-[var(--surface-foreground)] [&_a]:active:text-[var(--button-link-foreground-active)]",
        "text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm text-balance text-[var(--surface-muted-foreground)] md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-[var(--surface-foreground)] [&_a]:active:text-[var(--button-link-foreground-active)] [&_p:not(:last-child)]:mb-4",
        "text-[length:var(--text-body-10)] leading-[var(--leading-body-10)]",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-2 right-2", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction, alertVariants }
export type { AlertProps }

const surfaceVariants = {
  default:
    "border-[var(--color-gray-9)] text-[var(--surface-foreground)] *:data-[slot=alert-description]:text-[var(--surface-foreground)]",
  neutral:
    "border-[var(--color-gray-9)] text-[var(--surface-foreground)] *:data-[slot=alert-title]:text-[var(--surface-foreground)] *:data-[slot=alert-description]:text-[var(--surface-foreground)]",
  gray: "border-[var(--color-gray-9)] text-[var(--surface-foreground)] *:data-[slot=alert-title]:text-[var(--surface-foreground)] *:data-[slot=alert-description]:text-[var(--surface-foreground)]",
  caution:
    "bg-[var(--color-orange-6)] border-[var(--color-orange-4)] text-[var(--color-orange-1)] *:data-[slot=alert-description]:text-[var(--color-orange-1)]",
  positive: "",
  blue: "",
  riskHigh: "",
  destructive: "",
} as const

function alertVariants(options: Parameters<typeof baseAlertVariants>[0] = {}) {
  const { className, class: classValue, ...variants } = options
  return cn(
    baseAlertVariants(variants),
    surfaceVariants[variants.variant ?? "default"],
    classValue,
    className
  )
}

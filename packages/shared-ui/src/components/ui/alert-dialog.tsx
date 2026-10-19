import type { ComponentProps } from "react"
import { AlertDialogContent as DSAlertDialogContent, AlertDialogTitle as DSAlertDialogTitle, AlertDialogDescription as DSAlertDialogDescription, AlertDialogAction as DSAlertDialogAction, AlertDialogCancel as DSAlertDialogCancel } from "@ecoya/design-system/ui/alert-dialog"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/alert-dialog"

function AlertDialogContent({ className, ...props }: ComponentProps<typeof DSAlertDialogContent>) {
  return <DSAlertDialogContent {...props} className={cn("px-6 py-5", className)} />
}

function AlertDialogTitle({ className, ...props }: ComponentProps<typeof DSAlertDialogTitle>) {
  return <DSAlertDialogTitle {...props} className={cn("text-[length:var(--text-heading-xs)] leading-[var(--leading-heading-xs)] font-bold", className)} />
}

function AlertDialogDescription({ className, ...props }: ComponentProps<typeof DSAlertDialogDescription>) {
  return <DSAlertDialogDescription {...props} className={cn("text-[length:var(--text-body-md)] leading-[var(--leading-body-md)] font-normal", className)} />
}

function AlertDialogAction({ className, ...props }: ComponentProps<typeof DSAlertDialogAction>) {
  return <DSAlertDialogAction {...props} className={cn("font-normal text-[length:var(--text-body-sm)] leading-[var(--leading-body-sm)]", className)} />
}

function AlertDialogCancel({ className, ...props }: ComponentProps<typeof DSAlertDialogCancel>) {
  return <DSAlertDialogCancel {...props} className={cn("font-normal text-[length:var(--text-body-sm)] leading-[var(--leading-body-sm)]", className)} />
}

export { AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel }

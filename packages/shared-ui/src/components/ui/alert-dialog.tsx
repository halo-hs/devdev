import type { ComponentProps } from "react"
import { AlertDialogContent as DSAlertDialogContent, AlertDialogTitle as DSAlertDialogTitle, AlertDialogDescription as DSAlertDialogDescription, AlertDialogAction as DSAlertDialogAction, AlertDialogCancel as DSAlertDialogCancel, AlertDialogFooter as DSAlertDialogFooter } from "@ecoya/design-system/ui/alert-dialog"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/alert-dialog"

function AlertDialogContent({ className, ...props }: ComponentProps<typeof DSAlertDialogContent>) {
  return <DSAlertDialogContent {...props} className={cn("px-6 py-5 ring-0 border-[var(--color-gray-9)]", className)} />
}

function AlertDialogTitle({ className, ...props }: ComponentProps<typeof DSAlertDialogTitle>) {
  return <DSAlertDialogTitle {...props} className={cn("text-[length:var(--text-compat-body-5-5)] leading-[var(--leading-header-5)] font-bold", className)} />
}

function AlertDialogDescription({ className, ...props }: ComponentProps<typeof DSAlertDialogDescription>) {
  return <DSAlertDialogDescription {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal text-[var(--color-gray-4)]", className)} />
}

// Figma AlertDialog (158:136): footer buttons keep their label width.
function AlertDialogFooter({ className, ...props }: ComponentProps<typeof DSAlertDialogFooter>) {
  return <DSAlertDialogFooter {...props} className={cn("[&>*]:flex-none", className)} />
}

function AlertDialogAction({ className, ...props }: ComponentProps<typeof DSAlertDialogAction>) {
  return <DSAlertDialogAction {...props} className={cn("font-normal text-[length:var(--text-body-10)] leading-[var(--leading-body-10)]", className)} />
}

function AlertDialogCancel({ className, ...props }: ComponentProps<typeof DSAlertDialogCancel>) {
  return <DSAlertDialogCancel {...props} className={cn("font-normal text-[length:var(--text-body-10)] leading-[var(--leading-body-10)]", className)} />
}

export { AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel }

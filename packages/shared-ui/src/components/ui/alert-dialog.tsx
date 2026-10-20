import type { ComponentProps } from "react"
import { AlertDialogContent as DSAlertDialogContent, AlertDialogTitle as DSAlertDialogTitle, AlertDialogDescription as DSAlertDialogDescription, AlertDialogAction as DSAlertDialogAction, AlertDialogCancel as DSAlertDialogCancel, AlertDialogFooter as DSAlertDialogFooter } from "@ecoya/design-system/ui/alert-dialog"
import CloseIcon from "@ecoya/design-system/assets/icons/icon-close.svg"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/alert-dialog"

// Figma AlertDialog (158:136) shows a ghost-neutral close X at top 20 / right 16 by default.
// It renders before children so Radix keeps the footer Cancel as the initial focus.
function AlertDialogContent({ className, children, showCloseButton = true, ...props }: ComponentProps<typeof DSAlertDialogContent> & { showCloseButton?: boolean }) {
  return (
    <DSAlertDialogContent {...props} className={cn("px-6 py-5 ring-0 border-[var(--color-gray-9)]", showCloseButton && "[&_[data-slot=alert-dialog-header]]:pr-12", className)}>
      {showCloseButton ? (
        <DSAlertDialogCancel
          variant="ghost"
          size="icon-sm"
          aria-label="닫기"
          className="absolute top-5 right-4 text-[var(--color-gray-4)] hover:bg-[color-mix(in_srgb,var(--color-gray-2)_6%,transparent)] hover:text-[var(--color-gray-2)] active:bg-[color-mix(in_srgb,var(--color-gray-2)_10%,transparent)] [&_svg]:size-[18px]"
        >
          <CloseIcon />
        </DSAlertDialogCancel>
      ) : null}
      {children}
    </DSAlertDialogContent>
  )
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

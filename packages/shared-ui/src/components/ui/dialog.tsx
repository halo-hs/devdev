import type { ComponentProps } from "react"
import { DialogContent as DSDialogContent, DialogTitle as DSDialogTitle, DialogDescription as DSDialogDescription, DialogHeader as DSDialogHeader, DialogFooter as DSDialogFooter } from "@ecoya/design-system/ui/dialog"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/dialog"

function DialogContent({ className, ...props }: ComponentProps<typeof DSDialogContent>) {
  return <DSDialogContent {...props} className={cn("px-6 pt-5 pb-4 ring-0 border-[var(--component-outline)] [&>[data-slot=dialog-close]]:top-5 [&>[data-slot=dialog-close]]:right-4 [&>[data-slot=dialog-close]_svg]:size-[18px] text-[length:var(--text-body-md)] leading-[var(--leading-body-md)] font-normal", className)} />
}

function DialogTitle({ className, ...props }: ComponentProps<typeof DSDialogTitle>) {
  return <DSDialogTitle {...props} className={cn("text-[length:var(--text-heading-xs)] leading-[var(--leading-heading-xs)] font-bold text-[var(--component-title)] [--text-header-7:var(--text-heading-xs)] [--leading-header-7:var(--leading-heading-xs)]", className)} />
}

function DialogDescription({ className, ...props }: ComponentProps<typeof DSDialogDescription>) {
  return <DSDialogDescription {...props} className={cn("text-[length:var(--text-body-md)] leading-[var(--leading-body-md)] font-normal text-[var(--component-description)]", className)} />
}

function DialogHeader({ className, ...props }: ComponentProps<typeof DSDialogHeader>) {
  return <DSDialogHeader {...props} className={cn("gap-1 pr-10", className)} />
}
function DialogFooter({ className, ...props }: ComponentProps<typeof DSDialogFooter>) {
  return <DSDialogFooter {...props} className={cn("-mx-6 py-4 border-[var(--component-outline)]", className)} />
}
export { DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter }

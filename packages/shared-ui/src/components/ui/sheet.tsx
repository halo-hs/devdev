import type { ComponentProps } from "react"
import { SheetTitle as DSSheetTitle, SheetDescription as DSSheetDescription, SheetHeader as DSSheetHeader, SheetContent as DSSheetContent } from "@ecoya/design-system/ui/sheet"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/sheet"

function SheetTitle({ className, ...props }: ComponentProps<typeof DSSheetTitle>) {
  return <DSSheetTitle {...props} className={cn("text-[length:var(--text-heading-xs)] leading-[var(--leading-heading-xs)] font-bold text-[var(--component-title)]", className)} />
}

function SheetDescription({ className, ...props }: ComponentProps<typeof DSSheetDescription>) {
  return <DSSheetDescription {...props} className={cn("text-[length:var(--text-body-md)] leading-[var(--leading-body-md)] font-normal text-[var(--component-description)]", className)} />
}

function SheetHeader({ className, ...props }: ComponentProps<typeof DSSheetHeader>) {
  return <DSSheetHeader {...props} className={cn("gap-1 pt-5 pr-16 pb-4 pl-6", className)} />
}

function SheetContent({ className, ...props }: ComponentProps<typeof DSSheetContent>) {
  return <DSSheetContent {...props} className={cn("data-[side=bottom]:border-[var(--component-outline)] data-[side=left]:border-[var(--component-outline)] data-[side=right]:border-[var(--component-outline)] data-[side=top]:border-[var(--component-outline)]", className)} />
}
export { SheetTitle, SheetDescription, SheetHeader, SheetContent }

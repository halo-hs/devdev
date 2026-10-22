import type { ComponentProps } from "react"
import { SheetTitle as DSSheetTitle, SheetDescription as DSSheetDescription, SheetHeader as DSSheetHeader, SheetContent as DSSheetContent } from "@/components/ds2/ui/Sheet"
import { cn } from "@/lib/utils"

export * from "@/components/ds2/ui/Sheet"

function SheetTitle({ className, ...props }: ComponentProps<typeof DSSheetTitle>) {
  return <DSSheetTitle {...props} className={cn("text-[length:var(--text-compat-body-5-5)] leading-[var(--leading-header-5)] font-bold text-[var(--surface-foreground)]", className)} />
}

function SheetDescription({ className, ...props }: ComponentProps<typeof DSSheetDescription>) {
  return <DSSheetDescription {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal text-[var(--color-gray-4)]", className)} />
}

function SheetHeader({ className, ...props }: ComponentProps<typeof DSSheetHeader>) {
  return <DSSheetHeader {...props} className={cn("gap-1 pt-5 pr-16 pb-4 pl-6", className)} />
}

function SheetContent({ className, ...props }: ComponentProps<typeof DSSheetContent>) {
  return <DSSheetContent {...props} className={cn("data-[side=bottom]:border-[var(--color-gray-9)] data-[side=left]:border-[var(--color-gray-9)] data-[side=right]:border-[var(--color-gray-9)] data-[side=top]:border-[var(--color-gray-9)] [&>[data-slot=sheet-close]]:top-5 [&>[data-slot=sheet-close]]:right-4 [&>[data-slot=sheet-close]_svg]:size-[18px]", className)} />
}
export { SheetTitle, SheetDescription, SheetHeader, SheetContent }

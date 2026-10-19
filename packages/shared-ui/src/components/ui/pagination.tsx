import type { ComponentProps } from "react"
import { PaginationLink as DSPaginationLink, PaginationPrevious as DSPaginationPrevious, PaginationNext as DSPaginationNext } from "@ecoya/design-system/ui/pagination"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/pagination"

function PaginationLink({ className, ...props }: ComponentProps<typeof DSPaginationLink>) {
  return <DSPaginationLink {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal", className)} />
}

function PaginationPrevious({ className, ...props }: ComponentProps<typeof DSPaginationPrevious>) {
  return <DSPaginationPrevious {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal", className)} />
}

function PaginationNext({ className, ...props }: ComponentProps<typeof DSPaginationNext>) {
  return <DSPaginationNext {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal", className)} />
}

export { PaginationLink, PaginationPrevious, PaginationNext }

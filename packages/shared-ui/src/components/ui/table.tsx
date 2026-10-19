import type { ComponentProps } from "react"
import { cn } from "@shared/lib/utils"

export { Table, TableHeader, TableBody, TableFooter, TableRow, TableCaption } from "@ecoya/design-system/ui/table"

// These are table primitives only. Business-specific row/cell content stays
// in its product UI; a cell may grow beyond the 57px text-cell baseline.
function TableHead({ className, ...props }: ComponentProps<"th">) {
  return <th data-slot="table-head" {...props} className={cn(
    "h-10 border-b border-[var(--table-border)] bg-[var(--table-header-background)] px-3 py-0 text-left align-middle whitespace-nowrap text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal text-[var(--table-header-foreground)]",
    className,
  )} />
}

function TableCell({ className, ...props }: ComponentProps<"td">) {
  return <td data-slot="table-cell" {...props} className={cn(
    "h-[57px] border-b border-[var(--table-border)] px-3 py-0 text-left align-middle whitespace-nowrap text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal text-[var(--table-cell-foreground)]",
    className,
  )} />
}

export { TableHead, TableCell }

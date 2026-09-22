import type { ComponentProps } from "react"
import { cn } from "@shared/lib/utils"
import { Table, TableHead, TableCell } from "@shared/components/ui/table"
export { TableHeader as HostTableHeader, TableBody as HostTableBody, TableRow as HostTableRow, TableFooter as HostTableFooter, TableCaption as HostTableCaption } from "@shared/components/ui/table"

// Preserve columns, query state and semantic status colors while using the
// same table anatomy and density as the host transaction/document lists.
export function HostTable({ className, ...props }: ComponentProps<typeof Table>) {
  return <Table {...props} className={cn(className, "border-separate border-spacing-0 text-sm")} />
}
export function HostTableHead({ className, ...props }: ComponentProps<typeof TableHead>) {
  return <TableHead {...props} className={cn(className, "px-3 py-3")} />
}
export function HostTableCell({ className, ...props }: ComponentProps<typeof TableCell>) {
  return <TableCell {...props} className={cn(className, "px-3 py-3")} />
}

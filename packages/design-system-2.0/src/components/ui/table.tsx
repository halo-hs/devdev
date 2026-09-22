import * as React from "react"

import { cn } from "@ecoya/design-system/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto rounded-[var(--r-md)]"
    >
      <table
        data-slot="table"
        className={cn(
          "w-full min-w-full caption-bottom border-separate border-spacing-0 text-sm",
          className
        )}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "bg-[var(--table-header-background)] [&_tr]:border-b [&_tr]:border-[var(--table-border)] [&_tr]:bg-[var(--table-header-background)]",
        className
      )}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t border-[var(--table-border)] bg-[var(--table-header-background)] font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "transition-colors hover:[&>td]:bg-[var(--table-row-background-hover)] has-aria-expanded:[&>td]:bg-[var(--table-row-background-selected)]! data-[clickable=true]:active:[&>td]:bg-[var(--table-row-background-active)] data-[state=selected]:[&>td]:bg-[var(--table-row-background-selected)]!",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "typo-b9m border-r border-[var(--table-border)] px-3 py-3 text-center! align-middle whitespace-nowrap text-[var(--table-header-foreground)] first:text-left! last:border-r-0 [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "typo-b9r border-b border-[var(--table-border)] px-3 py-3 text-center! align-middle whitespace-nowrap text-[var(--table-cell-foreground)] first:text-left! [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn(
        "mt-4 text-sm text-[var(--table-caption-foreground)]",
        className
      )}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}

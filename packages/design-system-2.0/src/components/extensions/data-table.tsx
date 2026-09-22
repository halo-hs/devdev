"use client"

import * as React from "react"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"

import { Button } from "@ecoya/design-system/ui/button"
import { Empty, EmptyHeader, EmptyTitle } from "@ecoya/design-system/ui/empty"
import { Spinner } from "@ecoya/design-system/ui/spinner"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ecoya/design-system/ui/table"
import { cn } from "@ecoya/design-system/lib/utils"

export type DataTableSortDirection = "asc" | "desc"

export interface DataTableSortState {
  columnId: string
  direction: DataTableSortDirection
}

export type DataTableRowTone = "danger" | "default" | "success" | "warning"

export type DataTableAccessor<T extends object> =
  keyof T | string | ((record: T, index: number) => unknown)

export interface DataTableColumn<T extends object> {
  /** Stable identifier. Required for function accessors when sort state is persisted. */
  id?: string
  header: React.ReactNode
  accessor: DataTableAccessor<T>
  /** The index is the record's stable position in the source `data` array. */
  render?: (value: unknown, record: T, index: number) => React.ReactNode
  sortable?: boolean
  sortLabel?: string
  align?: "center" | "left" | "right"
  width?: number | string
}

export interface DataTableProps<T extends object> {
  columns: readonly DataTableColumn<T>[]
  data: readonly T[]
  rowKey?: keyof T | string | ((record: T, index: number) => React.Key)
  sortState?: DataTableSortState | null
  defaultSortState?: DataTableSortState | null
  onSortChange?: (sortState: DataTableSortState | null) => void
  loading?: boolean
  loadingLabel?: string
  emptyText?: React.ReactNode
  caption?: React.ReactNode
  onRowClick?: (record: T, index: number) => void
  getRowClassName?: (record: T, index: number) => string | undefined
  getRowTone?: (record: T, index: number) => DataTableRowTone
  getRowLabel?: (record: T, index: number) => string
  className?: string
  tableClassName?: string
  "aria-label"?: string
}

type IndexedRecord<T> = {
  originalIndex: number
  record: T
}

const valueCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
})

const rowToneClassNames: Record<DataTableRowTone, string | undefined> = {
  default: undefined,
  danger:
    "[&>td]:bg-[var(--data-table-row-danger-background)] hover:[&>td]:bg-[var(--data-table-row-danger-background-hover)]! data-[clickable=true]:active:[&>td]:bg-[var(--data-table-row-danger-background-active)]!",
  warning:
    "[&>td]:bg-[var(--data-table-row-warning-background)] hover:[&>td]:bg-[var(--data-table-row-warning-background-hover)]! data-[clickable=true]:active:[&>td]:bg-[var(--data-table-row-warning-background-active)]!",
  success:
    "[&>td]:bg-[var(--data-table-row-success-background)] hover:[&>td]:bg-[var(--data-table-row-success-background-hover)]! data-[clickable=true]:active:[&>td]:bg-[var(--data-table-row-success-background-active)]!",
}

function getValueAtPath(record: object, path: string): unknown {
  return path.split(".").reduce<unknown>((value, segment) => {
    if (value === null || typeof value !== "object") return undefined
    return (value as Record<string, unknown>)[segment]
  }, record)
}

function getAccessorValue<T extends object>(
  record: T,
  index: number,
  accessor: DataTableAccessor<T>
) {
  if (typeof accessor === "function") return accessor(record, index)
  return getValueAtPath(record, String(accessor))
}

function getColumnId<T extends object>(
  column: DataTableColumn<T>,
  index: number
) {
  if (column.id) return column.id
  if (typeof column.accessor !== "function") return String(column.accessor)
  return `column-${index}`
}

function compareValues(left: unknown, right: unknown) {
  if (Object.is(left, right)) return 0
  if (left === null || left === undefined) return 1
  if (right === null || right === undefined) return -1

  if (left instanceof Date && right instanceof Date) {
    return left.getTime() - right.getTime()
  }

  if (typeof left === "number" && typeof right === "number") {
    return left - right
  }

  if (typeof left === "boolean" && typeof right === "boolean") {
    return Number(left) - Number(right)
  }

  return valueCollator.compare(String(left), String(right))
}

function renderDefaultValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) return null
  if (React.isValidElement(value)) return value
  if (typeof value === "string" || typeof value === "number") return value
  if (typeof value === "boolean") return String(value)
  return String(value)
}

function getAlignmentClassName(align: DataTableColumn<object>["align"]) {
  if (align === "center") return "text-center"
  if (align === "right") return "text-right"
  return "text-left"
}

function getHeaderButtonClassName(columnIndex: number) {
  const colorClassName =
    "text-[var(--table-header-foreground)] hover:text-[var(--table-header-foreground)] active:text-[var(--table-header-foreground)]"

  return cn(
    "w-full",
    columnIndex === 0 ? "justify-start" : "justify-center",
    colorClassName
  )
}

function getColumnWidthStyle(width: number | string | undefined) {
  if (width === undefined) return undefined
  return { minWidth: width, width }
}

function isInteractiveTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "a,button,input,select,textarea,[role='button'],[role='link']"
      )
    )
  )
}

function DataTable<T extends object>({
  columns,
  data,
  rowKey = "id",
  sortState,
  defaultSortState = null,
  onSortChange,
  loading = false,
  loadingLabel = "Loading rows",
  emptyText = "No data",
  caption,
  onRowClick,
  getRowClassName,
  getRowTone,
  getRowLabel,
  className,
  tableClassName,
  "aria-label": ariaLabel,
}: DataTableProps<T>) {
  const [uncontrolledSortState, setUncontrolledSortState] =
    React.useState<DataTableSortState | null>(defaultSortState)
  const currentSortState =
    sortState === undefined ? uncontrolledSortState : sortState

  const indexedData = React.useMemo<IndexedRecord<T>[]>(
    () => data.map((record, originalIndex) => ({ record, originalIndex })),
    [data]
  )

  const displayedData = React.useMemo(() => {
    if (!currentSortState) return indexedData

    const columnIndex = columns.findIndex(
      (column, index) =>
        column.sortable &&
        getColumnId(column, index) === currentSortState.columnId
    )

    if (columnIndex < 0) return indexedData

    const column = columns[columnIndex]
    const direction = currentSortState.direction === "asc" ? 1 : -1

    return [...indexedData].sort((left, right) => {
      const comparison = compareValues(
        getAccessorValue(left.record, left.originalIndex, column.accessor),
        getAccessorValue(right.record, right.originalIndex, column.accessor)
      )
      return comparison === 0
        ? left.originalIndex - right.originalIndex
        : comparison * direction
    })
  }, [columns, currentSortState, indexedData])

  const requestSort = (columnId: string) => {
    let nextSortState: DataTableSortState | null

    if (currentSortState?.columnId !== columnId) {
      nextSortState = { columnId, direction: "asc" }
    } else if (currentSortState.direction === "asc") {
      nextSortState = { columnId, direction: "desc" }
    } else {
      nextSortState = null
    }

    if (sortState === undefined) setUncontrolledSortState(nextSortState)
    onSortChange?.(nextSortState)
  }

  const resolveRowKey = (record: T, index: number): React.Key => {
    if (typeof rowKey === "function") return rowKey(record, index)
    const resolvedKey = getValueAtPath(record, String(rowKey))
    return resolvedKey === null || resolvedKey === undefined
      ? index
      : String(resolvedKey)
  }

  return (
    <div data-slot="data-table" className={cn("w-full", className)}>
      <Table
        className={tableClassName}
        aria-label={ariaLabel}
        aria-busy={loading}
      >
        {caption ? <TableCaption>{caption}</TableCaption> : null}
        <TableHeader>
          <TableRow>
            {columns.map((column, columnIndex) => {
              const columnId = getColumnId(column, columnIndex)
              const isActive = currentSortState?.columnId === columnId
              const ariaSort = column.sortable
                ? isActive
                  ? currentSortState.direction === "asc"
                    ? "ascending"
                    : "descending"
                  : "none"
                : undefined
              const SortIcon = !isActive
                ? ArrowUpDownIcon
                : currentSortState.direction === "asc"
                  ? ArrowUpIcon
                  : ArrowDownIcon

              return (
                <TableHead
                  key={columnId}
                  aria-sort={ariaSort}
                  className={getAlignmentClassName(column.align)}
                  style={getColumnWidthStyle(column.width)}
                >
                  {column.sortable ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={getHeaderButtonClassName(columnIndex)}
                      aria-label={column.sortLabel}
                      onClick={() => requestSort(columnId)}
                    >
                      {column.header}
                      <SortIcon aria-hidden data-icon="inline-end" />
                    </Button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={Math.max(columns.length, 1)}>
                <div className="flex min-h-40 items-center justify-center gap-2">
                  <Spinner aria-label={loadingLabel} />
                  <span className="text-sm text-muted-foreground">
                    {loadingLabel}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ) : displayedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={Math.max(columns.length, 1)}>
                <Empty className="min-h-40">
                  <EmptyHeader>
                    <EmptyTitle>{emptyText}</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          ) : (
            displayedData.map(({ record, originalIndex }) => {
              const tone = getRowTone?.(record, originalIndex) ?? "default"
              const clickable = Boolean(onRowClick)
              const activateRow = () => onRowClick?.(record, originalIndex)
              const rowLabel =
                getRowLabel?.(record, originalIndex) ??
                `Open row ${originalIndex + 1}`

              return (
                <TableRow
                  key={resolveRowKey(record, originalIndex)}
                  data-tone={tone}
                  data-clickable={clickable || undefined}
                  aria-label={getRowLabel?.(record, originalIndex)}
                  className={cn(
                    rowToneClassNames[tone],
                    clickable &&
                      "cursor-pointer focus-visible:[box-shadow:var(--shadow-keyboard-focus)] focus-visible:outline-none",
                    getRowClassName?.(record, originalIndex)
                  )}
                  onClick={(event) => {
                    if (!clickable || isInteractiveTarget(event.target)) return
                    activateRow()
                  }}
                >
                  {columns.map((column, columnIndex) => {
                    const columnId = getColumnId(column, columnIndex)
                    const value = getAccessorValue(
                      record,
                      originalIndex,
                      column.accessor
                    )

                    return (
                      <TableCell
                        key={columnId}
                        className={getAlignmentClassName(column.align)}
                        style={getColumnWidthStyle(column.width)}
                      >
                        {clickable && columnIndex === 0 && (
                          <button
                            type="button"
                            className="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:rounded-[var(--r-sm)] focus:bg-background focus:px-2 focus:py-1 focus:[box-shadow:var(--shadow-keyboard-focus)]"
                            onClick={(event) => {
                              event.stopPropagation()
                              activateRow()
                            }}
                          >
                            {rowLabel}
                          </button>
                        )}
                        {column.render
                          ? column.render(value, record, originalIndex)
                          : renderDefaultValue(value)}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export { DataTable }
export default DataTable

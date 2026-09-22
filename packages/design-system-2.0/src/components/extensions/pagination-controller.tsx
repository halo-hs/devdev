"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@ecoya/design-system/ui/button"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@ecoya/design-system/ui/pagination"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ecoya/design-system/ui/select"
import { cn } from "@ecoya/design-system/lib/utils"

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

type PaginationWindowItem = number | "end-ellipsis" | "start-ellipsis"

export interface PaginationControllerProps extends Omit<
  React.ComponentProps<"div">,
  "onChange"
> {
  /** Current page, using one-based indexing. */
  page: number
  /** Current number of records per page. */
  pageSize: number
  /** Total number of records across every page. */
  total: number
  pageSizeOptions?: readonly number[]
  showPageSizeSelect?: boolean
  showTotal?: boolean
  siblingCount?: number
  disabled?: boolean
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  /** Compatibility callback for consumers that update both values together. */
  onChange?: (page: number, pageSize: number) => void
  rightAccessory?: React.ReactNode
  totalLabel?: (total: number) => React.ReactNode
  pageSizeLabel?: string
  pageSizeOptionLabel?: (pageSize: number) => string
  previousLabel?: string
  nextLabel?: string
  getPageLabel?: (page: number) => string
}

function integerAtLeast(value: number, minimum: number) {
  if (!Number.isFinite(value)) return minimum
  return Math.max(minimum, Math.trunc(value))
}

function range(start: number, end: number) {
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) =>
    Math.trunc(start + index)
  )
}

function getPageWindow(
  page: number,
  totalPages: number,
  siblingCount: number
): PaginationWindowItem[] {
  const visibleWithoutEllipsis = siblingCount * 2 + 5

  if (totalPages <= visibleWithoutEllipsis) {
    return range(1, totalPages)
  }

  const leftSibling = Math.max(page - siblingCount, 1)
  const rightSibling = Math.min(page + siblingCount, totalPages)
  const hasLeftEllipsis = leftSibling > 2
  const hasRightEllipsis = rightSibling < totalPages - 1

  if (!hasLeftEllipsis && hasRightEllipsis) {
    const leftWindowEnd = 3 + siblingCount * 2
    return [...range(1, leftWindowEnd), "end-ellipsis", totalPages]
  }

  if (hasLeftEllipsis && !hasRightEllipsis) {
    const rightWindowStart = totalPages - (2 + siblingCount * 2)
    return [1, "start-ellipsis", ...range(rightWindowStart, totalPages)]
  }

  return [
    1,
    "start-ellipsis",
    ...range(leftSibling, rightSibling),
    "end-ellipsis",
    totalPages,
  ]
}

function PaginationController({
  page,
  pageSize,
  total,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  showPageSizeSelect = true,
  showTotal = true,
  siblingCount = 1,
  disabled = false,
  onPageChange,
  onPageSizeChange,
  onChange,
  rightAccessory,
  totalLabel = (recordCount) => `Total ${recordCount}`,
  pageSizeLabel = "Rows per page",
  pageSizeOptionLabel = (option) => `${option} per page`,
  previousLabel = "Previous page",
  nextLabel = "Next page",
  getPageLabel = (pageNumber) => `Page ${pageNumber}`,
  className,
  "aria-label": ariaLabel = "Pagination",
  ...props
}: PaginationControllerProps) {
  const normalizedTotal = Math.max(0, Number.isFinite(total) ? total : 0)
  const normalizedPageSize = integerAtLeast(pageSize, 1)
  const totalPages = Math.max(
    1,
    Math.ceil(normalizedTotal / normalizedPageSize)
  )
  const currentPage = Math.min(integerAtLeast(page, 1), totalPages)
  const normalizedSiblingCount = Math.min(integerAtLeast(siblingCount, 0), 5)
  const pageWindow = getPageWindow(
    currentPage,
    totalPages,
    normalizedSiblingCount
  )
  const normalizedPageSizeOptions = React.useMemo(
    () =>
      Array.from(
        new Set(
          [...pageSizeOptions, normalizedPageSize]
            .filter((option) => Number.isFinite(option) && option > 0)
            .map((option) => Math.trunc(option))
        )
      ),
    [normalizedPageSize, pageSizeOptions]
  )

  const requestPage = (nextPage: number) => {
    if (
      disabled ||
      nextPage === currentPage ||
      nextPage < 1 ||
      nextPage > totalPages
    ) {
      return
    }

    onPageChange?.(nextPage)
    onChange?.(nextPage, normalizedPageSize)
  }

  const requestPageSize = (nextValue: string) => {
    const nextPageSize = Number(nextValue)

    if (
      disabled ||
      !Number.isInteger(nextPageSize) ||
      nextPageSize <= 0 ||
      nextPageSize === normalizedPageSize
    ) {
      return
    }

    onPageSizeChange?.(nextPageSize)
  }

  return (
    <div
      data-slot="pagination-controller"
      className={cn(
        "flex w-full flex-wrap items-center justify-between gap-3",
        className
      )}
      {...props}
    >
      {showTotal ? (
        <span
          data-slot="pagination-total"
          className="typo-b9r text-[var(--table-caption-foreground)]"
        >
          {totalLabel(normalizedTotal)}
        </span>
      ) : (
        <span aria-hidden />
      )}

      <Pagination aria-label={ariaLabel} className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={previousLabel}
              disabled={disabled || currentPage <= 1}
              onClick={() => requestPage(currentPage - 1)}
            >
              <ChevronLeftIcon aria-hidden data-icon="inline-start" />
            </Button>
          </PaginationItem>

          {pageWindow.map((item) =>
            typeof item === "number" ? (
              <PaginationItem key={item}>
                <Button
                  type="button"
                  variant={item === currentPage ? "outline" : "ghost"}
                  size="icon-sm"
                  aria-current={item === currentPage ? "page" : undefined}
                  aria-label={getPageLabel(item)}
                  disabled={disabled}
                  onClick={() => requestPage(item)}
                >
                  {item}
                </Button>
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationEllipsis />
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={nextLabel}
              disabled={disabled || currentPage >= totalPages}
              onClick={() => requestPage(currentPage + 1)}
            >
              <ChevronRightIcon aria-hidden data-icon="inline-end" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <div className="flex items-center gap-2">
        {showPageSizeSelect ? (
          <div className="flex items-center gap-2">
            <span
              data-slot="pagination-page-size-label"
              className="typo-b9r text-[var(--table-caption-foreground)]"
            >
              {pageSizeLabel}
            </span>
            <Select
              value={String(normalizedPageSize)}
              disabled={disabled}
              onValueChange={requestPageSize}
            >
              <SelectTrigger size="sm" aria-label={pageSizeLabel}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectGroup>
                  {normalizedPageSizeOptions.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {pageSizeOptionLabel(option)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        ) : null}
        {rightAccessory}
      </div>
    </div>
  )
}

export { PaginationController }
export default PaginationController

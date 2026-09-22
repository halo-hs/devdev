import {
  PaginationController,
  type PaginationControllerProps,
} from "@ecoya/design-system/extensions/pagination-controller"

import { cn } from "@shared/lib/utils"

export type TablePaginationProps = PaginationControllerProps

function TablePagination({
  className,
  pageSizeOptions = [10, 20, 50],
  totalLabel = (total) => `전체 ${total}건`,
  pageSizeLabel = "페이지당",
  pageSizeOptionLabel = (pageSize) => `${pageSize}개`,
  previousLabel = "이전 페이지",
  nextLabel = "다음 페이지",
  getPageLabel = (page) => `${page}페이지`,
  "aria-label": ariaLabel = "테이블 페이지 이동",
  ...props
}: TablePaginationProps) {
  return (
    <PaginationController
      className={cn(
        "border-t border-[var(--table-border)] bg-[var(--surface-background)] px-4 py-3 text-[var(--table-caption-foreground)]",
        className
      )}
      pageSizeOptions={pageSizeOptions}
      totalLabel={totalLabel}
      pageSizeLabel={pageSizeLabel}
      pageSizeOptionLabel={pageSizeOptionLabel}
      previousLabel={previousLabel}
      nextLabel={nextLabel}
      getPageLabel={getPageLabel}
      aria-label={ariaLabel}
      {...props}
    />
  )
}

export { TablePagination }

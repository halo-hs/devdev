import { useEffect, useRef, useState } from "react"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Files,
  LoaderCircle,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
} from "lucide-react"

import { Button } from "@shared/components/ui/button"
import {
  ButtonGroup,
  ButtonGroupText,
} from "@ecoya/design-system/ui/button-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@shared/components/ui/popover"

export function PdfViewerToolbar({
  zoom,
  onZoomChange,
  isFullscreen,
  onToggleFullscreen,
  isDownloading = false,
  onDownload,
  labeledDownload = false,
  downloadLabel = "PDF 다운로드",
}: {
  zoom: number
  onZoomChange: (zoom: number) => void
  isFullscreen: boolean
  onToggleFullscreen: () => void
  isDownloading?: boolean
  onDownload?: () => void | Promise<void>
  labeledDownload?: boolean
  downloadLabel?: string
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <ButtonGroup>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="축소"
          disabled={zoom <= 70}
          onClick={() => onZoomChange(Math.max(70, zoom - 10))}
        >
          <Minus />
        </Button>
        <ButtonGroupText className="min-w-14 justify-center text-xs text-[var(--surface-muted-foreground)] tabular-nums">
          {zoom}%
        </ButtonGroupText>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="확대"
          disabled={zoom >= 150}
          onClick={() => onZoomChange(Math.min(150, zoom + 10))}
        >
          <Plus />
        </Button>
      </ButtonGroup>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label={isFullscreen ? "전체 화면 닫기" : "전체 화면"}
        title={isFullscreen ? "전체 화면 닫기" : "전체 화면"}
        onClick={onToggleFullscreen}
      >
        {isFullscreen ? <Minimize2 /> : <Maximize2 />}
      </Button>
      {onDownload ? (
        <Button
          variant="outline"
          size={labeledDownload ? "sm" : "icon-sm"}
          aria-label={downloadLabel}
          title={downloadLabel}
          disabled={isDownloading}
          onClick={onDownload}
        >
          {isDownloading ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Download
              data-icon={labeledDownload ? "inline-start" : undefined}
            />
          )}
          {labeledDownload ? downloadLabel : null}
        </Button>
      ) : null}
    </div>
  )
}

export function PdfFloatingControls({
  page,
  pageCount,
  zoom,
  onPageChange,
  onZoomChange,
  isFullscreen,
  onToggleFullscreen,
  isDownloading,
  onDownload,
  variant = "full",
}: {
  page: number
  pageCount: number
  zoom: number
  onPageChange: (page: number) => void
  onZoomChange: (zoom: number) => void
  isFullscreen: boolean
  onToggleFullscreen: () => void
  isDownloading: boolean
  onDownload?: () => void | Promise<void>
  variant?: "full" | "pager"
}) {
  const [pagePickerOpen, setPagePickerOpen] = useState(false)
  const activePageRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!pagePickerOpen) return
    activePageRef.current?.scrollIntoView({
      block: "nearest",
      inline: "center",
    })
  }, [page, pagePickerOpen])

  return (
    <div className="absolute bottom-4 left-1/2 z-[var(--z-pagination-dropdown)] -translate-x-1/2">
      <ButtonGroup className="shadow-[var(--shadow-filter)]">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="이전 페이지"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft data-icon="inline-start" />
        </Button>
        <Popover open={pagePickerOpen} onOpenChange={setPagePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="min-w-28 justify-center text-xs tabular-nums"
              aria-label={`페이지 목록 열기, 현재 ${page} / ${pageCount} 페이지`}
            >
              <Files data-icon="inline-start" />
              {page} / {pageCount} 페이지
              <ChevronUp data-icon="inline-end" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="center"
            sideOffset={8}
            className="w-[min(42rem,calc(100vw-2rem))] gap-0 overflow-hidden p-0"
          >
            <div className="flex items-center justify-between border-b border-[var(--surface-border)] px-3 py-2.5">
              <span>
                <span className="block text-xs font-semibold">페이지 선택</span>
                <span className="mt-0.5 block text-[10px] text-[var(--surface-muted-foreground)]">
                  가로로 스크롤해 페이지를 선택하세요.
                </span>
              </span>
              <span className="text-[11px] text-[var(--surface-muted-foreground)]">
                전체 {pageCount}장
              </span>
            </div>
            <div className="field-scrollbar flex snap-x gap-2 overflow-x-auto p-2 pb-3">
              {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <Button
                    key={pageNumber}
                    ref={pageNumber === page ? activePageRef : undefined}
                    variant={pageNumber === page ? "secondary" : "ghost"}
                    className="h-auto w-20 shrink-0 snap-start flex-col gap-1.5 px-2 py-2"
                    aria-current={pageNumber === page ? "page" : undefined}
                    aria-label={`${pageNumber}페이지로 이동`}
                    onClick={() => {
                      onPageChange(pageNumber)
                      setPagePickerOpen(false)
                    }}
                  >
                    <span className="relative flex aspect-[3/4] w-12 items-center justify-center rounded-[var(--r-sm)] border border-[var(--surface-border)] bg-[var(--surface-background)] text-[10px] text-[var(--surface-muted-foreground)]">
                      {pageNumber}
                      {pageNumber === page ? (
                        <Check className="absolute -top-1 -right-1 size-3.5 rounded-[var(--r-pill)] bg-[var(--control-selected-background)] p-0.5 text-[var(--control-selected-foreground)]" />
                      ) : null}
                    </span>
                    <span className="text-[11px]">{pageNumber}페이지</span>
                  </Button>
                )
              )}
            </div>
          </PopoverContent>
        </Popover>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="다음 페이지"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight data-icon="inline-start" />
        </Button>
        {variant === "full" ? (
          <>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="축소"
              disabled={zoom <= 70}
              onClick={() => onZoomChange(Math.max(70, zoom - 10))}
            >
              <Minus data-icon="inline-start" />
            </Button>
            <ButtonGroupText className="min-w-12 justify-center text-xs text-[var(--surface-muted-foreground)]">
              {zoom}%
            </ButtonGroupText>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="확대"
              disabled={zoom >= 150}
              onClick={() => onZoomChange(Math.min(150, zoom + 10))}
            >
              <Plus data-icon="inline-start" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={isFullscreen ? "전체 화면 닫기" : "전체 화면"}
              title={isFullscreen ? "전체 화면 닫기" : "전체 화면"}
              onClick={onToggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 data-icon="inline-start" />
              ) : (
                <Maximize2 data-icon="inline-start" />
              )}
            </Button>
            {onDownload ? (
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="다운로드"
                disabled={isDownloading}
                onClick={onDownload}
              >
                {isDownloading ? (
                  <LoaderCircle
                    className="animate-spin"
                    data-icon="inline-start"
                  />
                ) : (
                  <Download data-icon="inline-start" />
                )}
              </Button>
            ) : null}
          </>
        ) : null}
      </ButtonGroup>
    </div>
  )
}

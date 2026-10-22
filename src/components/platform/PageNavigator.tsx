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

import { Button } from "@/components/ui/Button"
import {
  ButtonGroup,
  ButtonGroupText,
} from "@/components/ui/ButtonGroup"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover"
import { Separator } from "@/components/ui/Separator"
import { cn } from "@/lib/utils"

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
        // 문서 올리기 V2 (6233:82241): the labeled download is a 40px outline
        // button with text only; the icon-only form stays 32px.
        <Button
          variant="outline"
          size={labeledDownload ? "lg" : "icon-sm"}
          aria-label={downloadLabel}
          title={downloadLabel}
          disabled={isDownloading}
          onClick={onDownload}
        >
          {isDownloading ? (
            <LoaderCircle
              className="animate-spin"
              data-icon={labeledDownload ? "inline-start" : undefined}
            />
          ) : labeledDownload ? null : (
            <Download />
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
      {/* Figma DocumentViewer/Footer (2343:20892): white pill, ghost 32px
          buttons split by Gray 8 separators. */}
      <div className="flex h-[46px] items-center gap-1 rounded-[var(--r-pill)] border border-[var(--color-gray-8)] bg-[var(--color-gray-12)] px-[7px] shadow-[0_6px_10px_rgb(16_24_40/0.1)] [--button-ghost-foreground:var(--color-gray-2)]">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="이전 페이지"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-[18px]" />
        </Button>
        <Separator orientation="vertical" className="h-5! self-center! bg-[var(--color-gray-8)]" />
        <Popover open={pagePickerOpen} onOpenChange={setPagePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="h-[34px] gap-2 rounded-[var(--r-pill)] px-3 text-[13px] leading-[18px] font-normal text-[var(--color-gray-1)] tabular-nums"
              aria-label={`페이지 목록 열기, 현재 ${page} / ${pageCount} 페이지`}
            >
              <Files className="size-[18px]" />
              {page} / {pageCount} 페이지
              <ChevronUp className={cn("size-4 transition-transform", !pagePickerOpen && "rotate-180")} />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="center"
            sideOffset={8}
            className="w-[min(420px,calc(100vw-2rem))] gap-0 overflow-hidden rounded-[var(--r-lg)] p-0"
          >
            <div className="flex items-start justify-between border-b border-[var(--color-gray-9)] px-5 pt-5 pb-3.5 text-[13px] leading-[18px]">
              <span className="grid gap-1">
                <span className="text-[var(--color-gray-1)]">페이지 선택</span>
                <span className="text-[var(--color-gray-4)]">
                  가로로 스크롤해 페이지를 선택하세요.
                </span>
              </span>
              <span className="text-[var(--color-gray-5)]">
                전체 {pageCount}장
              </span>
            </div>
            <div className="field-scrollbar flex snap-x gap-3 overflow-x-auto px-5 py-2.5">
              {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <Button
                    key={pageNumber}
                    ref={pageNumber === page ? activePageRef : undefined}
                    variant="ghost"
                    className={cn(
                      "h-auto shrink-0 snap-start flex-col gap-2 rounded-[10px] border border-transparent p-[9px]",
                      pageNumber === page &&
                        "border-[var(--color-primary-8)] bg-[var(--color-primary-10)] hover:bg-[var(--color-primary-10)]"
                    )}
                    aria-current={pageNumber === page ? "page" : undefined}
                    aria-label={`${pageNumber}페이지로 이동`}
                    onClick={() => {
                      onPageChange(pageNumber)
                      setPagePickerOpen(false)
                    }}
                  >
                    <span
                      className={cn(
                        "relative flex h-[106px] w-20 items-center justify-center rounded-[6px] border border-[var(--color-gray-8)] bg-[var(--color-gray-12)] text-[15px] leading-[22px] text-[var(--color-gray-5)]",
                        pageNumber === page &&
                          "border-[var(--color-primary-4)] text-[var(--color-primary-4)]"
                      )}
                    >
                      {pageNumber}
                      {pageNumber === page ? (
                        <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-[var(--color-primary-4)] text-white">
                          <Check className="size-2.5" />
                        </span>
                      ) : null}
                    </span>
                    <span className="text-[13px] leading-[18px] font-normal text-[var(--color-gray-1)]">{pageNumber}페이지</span>
                  </Button>
                )
              )}
            </div>
          </PopoverContent>
        </Popover>
        <Separator orientation="vertical" className="h-5! self-center! bg-[var(--color-gray-8)]" />
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="다음 페이지"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-[18px]" />
        </Button>
        {variant === "full" ? (
          <>
            <Separator orientation="vertical" className="h-5! self-center! bg-[var(--color-gray-8)]" />
            <Button
              variant="ghost"
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
              variant="ghost"
              size="icon-sm"
              aria-label="확대"
              disabled={zoom >= 150}
              onClick={() => onZoomChange(Math.min(150, zoom + 10))}
            >
              <Plus data-icon="inline-start" />
            </Button>
            <Button
              variant="ghost"
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
                variant="ghost"
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
      </div>
    </div>
  )
}

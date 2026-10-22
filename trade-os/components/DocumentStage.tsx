import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { type ReactNode, useRef, useState, useEffect } from "react"
import { FileText, Check } from "lucide-react"
import { PdfViewerToolbar, PdfFloatingControls } from "@/components/ds2/molecule/PageNavigator"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { PannablePdfViewport } from "@/components/ds2/molecule/DocumentViewerStage"
import { type PrototypeSlot, sampleValueForSlot, isNumericInputKind, type DocumentStyle, type DocumentLogo, templateMeta, templateSchemas, type Tone, downloadRenderedDocumentPdf } from "@trade-os/documents/documentTemplateModel"

const displayValueForSlot = (slot: PrototypeSlot) => {
  const value = sampleValueForSlot(slot)
  return isNumericInputKind(slot.kind) && Number.isFinite(Number(value))
    ? Number(value).toLocaleString("ko-KR")
    : value
}

function DocumentPaper({
  result = false,
  templateCode = "SC",
  accent = "#166dd7",
  fontStyle = "sans",
  archetype = "table",
  logo,
  className,
}: {
  result?: boolean
  templateCode?: string
  accent?: string
  fontStyle?: "sans" | "serif"
  archetype?: DocumentStyle["archetype"]
  logo?: DocumentLogo | null
  className?: string
}) {
  const [, templateTitle] = templateMeta(templateCode)
  const templateSlots =
    templateSchemas[templateCode]?.slots ?? templateSchemas.SC.slots
  const previewSlots = templateSlots.slice(0, 4)
  return (
    <div
      data-document-paper
      data-archetype={archetype}
      className={cn(
        "relative mx-auto aspect-[0.72] w-[min(94%,520px)] max-w-[520px] rounded-[3px] border bg-white px-6 py-8 shadow-[0_20px_54px_rgb(31_41_55/0.10)] xl:px-10 xl:py-9",
        fontStyle === "serif" && "font-serif",
        className
      )}
    >
      <div className={cn("flex items-start justify-between gap-8", archetype === "formal" && "border-2 p-4", archetype === "letter" && "border-b pb-4")}>
        <div>
          <div
            className="text-[11px] font-semibold tracking-[0.14em] uppercase"
            style={{ color: accent }}
          >
            {result ? `${templateCode} Generated Draft` : "Invoice"}
          </div>
          <div className="mt-2 text-[28px] font-semibold tracking-normal">
            {result ? templateTitle : "INVOICE"}
          </div>
        </div>
        <div className="flex min-h-10 flex-col items-end justify-start text-right text-[11px] leading-5 text-muted-foreground">
          {logo?.source === "file" && logo.dataUrl ? (
            <img
              src={logo.dataUrl}
              alt={logo.name}
              className="mb-1 h-7 max-w-28 object-contain"
            />
          ) : logo?.source === "organization" ? (
            <div
              className="mb-1 text-sm font-bold tracking-normal"
              style={{ color: accent }}
            >
              ECOYA
            </div>
          ) : (
            <span>ECOYA Demo Co.</span>
          )}
          <span>2026.07.07</span>
        </div>
      </div>

      <Separator className="my-7" />

      <div className={cn("grid gap-x-4 text-xs xl:gap-x-8", archetype === "letter" || archetype === "formal" ? "grid-cols-1 gap-y-2" : "grid-cols-2 gap-y-5", archetype === "spec" && "gap-y-1 border-y py-2")}>
        {result ? (
          previewSlots.map((slot, index) => (
            <PaperField
              key={slot.key}
              label={archetype === "letter" || archetype === "formal" ? `${index + 1}. ${slot.label}` : slot.label}
              value={displayValueForSlot(slot)}
            />
          ))
        ) : (
          <>
            <PaperField label="거래처명" value="한빛무역" />
            <PaperField label="서류번호" value="INV-2026-0703" tone="warning" />
            <PaperField label="합계금액" value="4,620,000 KRW" tone="danger" />
            <PaperField label="결제조건" value="T/T 30 days" />
          </>
        )}
      </div>

      {!result || templateSchemas[templateCode]?.lineItems ? (
        <div className="mt-9 overflow-hidden rounded-md border">
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="grid grid-cols-[1fr_0.48fr_0.58fr_0.7fr] border-b last:border-b-0"
            >
              {["품목", "수량", "단가", "금액"].map((cell, index) => (
                <div
                  key={`${row}-${cell}`}
                  className={cn(
                    "h-9 border-r px-2 py-2 text-[10px] last:border-r-0 xl:px-3 xl:text-[11px]",
                    row === 0
                      ? "bg-muted/65 font-medium text-muted-foreground"
                      : "text-foreground",
                    row > 0 && index > 0 && "text-right"
                  )}
                >
                  {row === 0
                    ? cell
                    : index === 0
                      ? `Item ${row}`
                      : index === 3
                        ? "1,540,000"
                        : index === 1
                          ? "12"
                          : "128,333"}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-9 rounded-md border p-4 text-xs leading-6 text-muted-foreground">
          {templateSlots.slice(4, 8).map((slot) => (
            <div
              key={slot.key}
              className="flex justify-between gap-4 border-b py-2 last:border-b-0"
            >
              <span>{slot.label}</span>
              <span className="font-medium text-foreground">
                {displayValueForSlot(slot)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-9 space-y-3">
        <div className="h-2 w-11/12 rounded-full bg-muted" />
        <div className="h-2 w-9/12 rounded-full bg-muted" />
        <div className="h-2 w-10/12 rounded-full bg-muted" />
      </div>
    </div>
  )
}

function PaperField({
  label,
  value,
  tone = "neutral",
}: {
  label: string
  value: string
  tone?: Tone
}) {
  return (
    <div
      className={cn(
        "rounded-md px-2 py-1.5",
        tone === "warning" && "bg-warning/8 ring-1 ring-warning/35",
        tone === "danger" && "bg-destructive/7 ring-1 ring-destructive/35"
      )}
    >
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  )
}

export function DocumentStage({
  result = false,
  fitPage = false,
  templateCode = "SC",
  downloadName,
  accent,
  fontStyle,
  archetype,
  logo,
  reviewMode = false,
  canDownload = true,
  controlsPlacement,
  toolbarEyebrow,
  toolbarTitle,
  toolbarMeta,
  reviewGate,
  showAiDetection,
  pageCountOverride,
  requestedPage,
  previewContent,
  paperClassName,
}: {
  result?: boolean
  fitPage?: boolean
  templateCode?: string
  downloadName?: string
  accent?: string
  fontStyle?: "sans" | "serif"
  archetype?: DocumentStyle["archetype"]
  logo?: DocumentLogo | null
  reviewMode?: boolean
  canDownload?: boolean
  controlsPlacement?: "top" | "bottom"
  toolbarEyebrow?: string
  toolbarTitle?: string
  toolbarMeta?: ReactNode
  reviewGate?: {
    completed: boolean
    disabled?: boolean
    downloading?: boolean
    showCompleteAction?: boolean
    onComplete: () => void
    onDownload?: () => void | Promise<void>
    completeLabel?: string
    downloadLabel?: string
  }
  showAiDetection?: boolean
  pageCountOverride?: number
  requestedPage?: { page: number }
  previewContent?: ReactNode | ((page: number, pageCount: number) => ReactNode)
  paperClassName?: string
}) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [zoom, setZoom] = useState(100)
  const [page, setPage] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const pageCount = pageCountOverride ?? (reviewMode || result ? 2 : 1)
  useEffect(() => {
    if (requestedPage) setPage(Math.min(pageCount, Math.max(1, requestedPage.page)))
  }, [requestedPage, pageCount])
  const aiDetectionVisible = showAiDetection ?? !result
  const controlsAtTop = controlsPlacement
    ? controlsPlacement === "top"
    : reviewMode
  useEffect(() => {
    if (!isFullscreen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFullscreen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isFullscreen])
  const handleDownload = async () => {
    if (pdfGenerating) return
    setPdfGenerating(true)
    try {
      await downloadRenderedDocumentPdf(
        downloadName ?? `${templateCode}-2026-0708.pdf`,
        stageRef.current
      )
    } finally {
      setPdfGenerating(false)
    }
  }
  const reviewedDownload = reviewGate?.onDownload ?? handleDownload
  const toolbarDownload = reviewGate
    ? reviewGate.completed
      ? reviewedDownload
      : undefined
    : canDownload
      ? handleDownload
      : undefined
  return (
    <div
      ref={stageRef}
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden bg-white",
        isFullscreen && "fixed inset-0 z-[120] h-screen w-screen"
      )}
    >
      {controlsAtTop ? (
        <div className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b bg-white px-4 py-2 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0">
              {toolbarEyebrow ? (
                <span className="block text-[11px] text-muted-foreground">
                  {toolbarEyebrow}
                </span>
              ) : null}
              <span className="block truncate text-xs font-semibold">
                {toolbarTitle ??
                  downloadName ??
                  `${templateCode}-2026-0708.pdf`}
              </span>
            </span>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-4">
            {toolbarMeta}
            <PdfViewerToolbar
              zoom={zoom}
              onZoomChange={setZoom}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen((current) => !current)}
              isDownloading={reviewGate?.downloading ?? pdfGenerating}
              onDownload={toolbarDownload}
              labeledDownload={Boolean(reviewGate)}
              downloadLabel={reviewGate?.downloadLabel}
            />
            {reviewGate?.showCompleteAction && !reviewGate.completed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="inline-flex"
                    tabIndex={0}
                    aria-label="검토 완료 후 초안 PDF를 다운로드할 수 있습니다."
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={reviewGate.disabled}
                      onClick={reviewGate.onComplete}
                    >
                      <Check data-icon="inline-start" />
                      {reviewGate.completeLabel ?? "검토 완료"}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="end"
                  className="max-w-72 text-xs leading-5"
                >
                  검토를 완료하면 이 버튼이 초안 PDF 다운로드로 전환됩니다.
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        </div>
      ) : null}
      <PannablePdfViewport
        zoom={zoom}
        className={cn(
          "flex min-h-0 flex-1 justify-center overflow-auto bg-white px-3 pb-20 xl:px-8",
          fitPage ? "items-center pt-6" : "items-start pt-8"
        )}
      >
        <div
          className="w-full transition-transform duration-150"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
          }}
        >
          {typeof previewContent === "function"
            ? previewContent(page, pageCount)
            : (previewContent ?? (
                <DocumentPaper
                  result={result}
                  templateCode={templateCode}
                  accent={accent}
                  fontStyle={fontStyle}
                  archetype={archetype}
                  logo={logo}
                  className={paperClassName}
                />
              ))}
        </div>
      </PannablePdfViewport>
      {aiDetectionVisible ? (
        <div className="pointer-events-none absolute top-18 right-7 hidden w-44 rounded-md border bg-background/95 p-3 shadow-sm xl:block">
          <div className="text-[11px] font-semibold text-primary">AI 검출</div>
          <div className="mt-2 text-xs leading-5 text-muted-foreground">
            금액 합계가 거래 데이터와 다릅니다. 우측 패널에서 확인하세요.
          </div>
        </div>
      ) : null}
      <PdfFloatingControls
        page={page}
        pageCount={pageCount}
        zoom={zoom}
        onPageChange={setPage}
        onZoomChange={setZoom}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen((current) => !current)}
        isDownloading={reviewGate?.downloading ?? pdfGenerating}
        variant={controlsAtTop ? "pager" : "full"}
        onDownload={toolbarDownload}
      />
    </div>
  )
}

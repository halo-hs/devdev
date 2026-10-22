import { type BankCashInput, type ReviewedField } from "@trade-os/lib/erpDocumentWorkflow"
import { type DocumentConnection } from "@trade-os/lib/documentDealConnection"
import { useIsMobile } from "@shared/hooks/useIsMobile"
import { useState, useRef, useEffect } from "react"
import { cn } from "@shared/lib/utils"
import { Button } from "@shared/components/ui/button"
import { Alert, AlertTitle, AlertDescription, AlertAction } from "@shared/components/ui/alert"
import { OcrFieldReviewList, UploadFieldHistory } from "@trade-os/confirm/ConfirmStepOneView"
import { AlertTriangle, ChevronLeft, LoaderCircle } from "lucide-react"
import { DocumentStage } from "@trade-os/components/DocumentStage"
import { dealDocumentPreviews } from "@trade-os/lib/dealDocumentActions"
import { DealConfirmPanel } from "@trade-os/confirm/ConfirmStepTwoView"
import { ResizablePanelGroup, ResizablePanel } from "@shared/components/ui/resizable"
import { PdfPanelResizeHandle } from "@shared/components/PdfPanelResizeHandle"
import { ToneBadge } from "@trade-os/components/ToneBadge"
import { Field, FieldLabel } from "@shared/components/ui/field"
import { Combobox, ComboboxInput, ComboboxContent, ComboboxEmpty, ComboboxList, ComboboxItem } from "@shared/components/ui/combobox"
import { type Tone } from "@trade-os/documents/documentTemplateModel"
import { ItemGroup, Item, ItemContent, ItemDescription, ItemTitle } from "@shared/components/ui/item"
import { Skeleton } from "@shared/components/ui/skeleton"
import { type RecentDocument, type UploadDetailStep, type UploadDocumentType } from "@/App"
import { isUploadDocumentTypeUnresolved, uploadDocumentTypeLabel, manualUploadDocumentTypeOptions } from "@trade-os/inbox/uploadDocumentModel"

// Kept as a fallback for older prototype routes while the card workspace ships.
export function DocumentReviewWorkspace({
  document,
  originDealId,
  step,
  onAutoSave,
  dealBlocked,
  pdfReviewCompleted,
  linkedDealLabel,
  linkingDocument,
  tradeSeatAssigned,
  downloadingDraft,
  dealActionTarget,
  onLinkDeal,
  onConnectionChanged,
  onDownloadDraft,
  onPdfReviewComplete,
  onReviewedFieldChange,
  onDocumentTypeChange,
  mobilePane,
  onMobilePaneChange,
}: {
  document: RecentDocument
  originDealId?: string | null
  step: UploadDetailStep
  onAutoSave: (phase?: "pending" | "commit") => void
  dealBlocked?: boolean
  pdfReviewCompleted: boolean
  linkedDealLabel: string | null
  linkingDocument: boolean
  tradeSeatAssigned: boolean
  downloadingDraft: boolean
  dealActionTarget: HTMLElement | null
  onLinkDeal: (dealId: string, dealLabel: string, bankCash?: Omit<BankCashInput, "sourceDocumentId" | "idempotencyKey">, evidence?: string[]) => Promise<boolean>
  onConnectionChanged: (connection: DocumentConnection) => void
  onDownloadDraft: () => void | Promise<void>
  onPdfReviewComplete: () => void
  onReviewedFieldChange: (key: string, patch: Partial<ReviewedField>) => void
  onDocumentTypeChange: (documentType: UploadDocumentType) => void
  mobilePane: "fields" | "preview"
  onMobilePaneChange: (pane: "fields" | "preview") => void
}) {
  const typeUnresolved = isUploadDocumentTypeUnresolved(document)
  const isCompact = useIsMobile()
  const [requestedPage, setRequestedPage] = useState<{ page: number }>()
  const previewRef = useRef<HTMLElement>(null)
  useEffect(() => setRequestedPage(undefined), [document.name, document.documentType])

  const fieldsPanel = (
    <section
      aria-label="항목 점검"
      className={cn(
        "h-full min-h-0 flex-col bg-[var(--surface-background)] lg:flex",
        mobilePane === "fields" ? "flex" : "hidden"
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-4 bg-[var(--surface-background)] px-5 pt-5 pb-1">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold">항목 검토</h2>
          <p className="mt-1 truncate text-[11px] text-[var(--surface-muted-foreground)]">
            AI가 문서에서 읽은 항목 값을 확인하세요.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 lg:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMobilePaneChange("preview")}
          >
            PDF 보기
          </Button>
        </div>
      </div>

      <div className="field-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="p-4 sm:p-5">
          {document.documentType === "BANK_STATEMENT" ? (
            <Alert variant="blue" className="mb-4">
              <AlertTitle className="text-xs">
                은행거래내역서 — 거래 연결 + 일정 매칭
              </AlertTitle>
              <AlertDescription className="text-[11px] leading-5">
                거래 연결 단계에서 같은 통화의 미결제 일정을 선택하면 검토 완료
                후 정산 현금을 기록합니다. 자동 환전은 하지 않으며, 맞는 일정이
                없으면 서류만 연결하고 현금은 정산에서 기록합니다.
              </AlertDescription>
            </Alert>
          ) : null}

          {typeUnresolved ? (
            <DocumentTypeResolution onChange={onDocumentTypeChange} />
          ) : document.stage === "excluded" ? (
            <NonTradeDocumentNotice documentType={document.documentType} />
          ) : document.stage === "failed" ||
            document.stage === "duplicate" ||
            document.stage === "ocr" ||
            document.stage === "queued" ? (
            <DocumentProcessingNotice document={document} />
          ) : (
            <div className="space-y-4">
              <OcrFieldReviewList
                key={`${document.name}:${document.documentType}`}
                mode={step === "deal" ? "deal" : "compare"}
                documentType={document.documentType}
                onAutoSave={onAutoSave}
                reviewedFields={document.reviewedFields}
                onReviewedFieldChange={onReviewedFieldChange}
              />
              <UploadFieldHistory />
            </div>
          )}

          {dealBlocked && !typeUnresolved ? (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="size-3.5" />
              <AlertDescription className="text-xs">
                필수값·금액·날짜를 확인하고 저장을 완료해 주세요. ETA는 ETD보다 빠를 수 없습니다.
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      </div>
    </section>
  )

  const pdfPreviewPanel = (
    <section
      aria-label="PDF 원문"
      ref={previewRef}
      tabIndex={-1}
      className={cn(
        "relative h-full min-h-0 flex-col overflow-hidden lg:flex",
        mobilePane === "preview" ? "flex" : "hidden"
      )}
    >
      <Button
        variant="outline"
        size="sm"
        className="absolute top-2 left-2 z-20 lg:hidden"
        onClick={() => onMobilePaneChange("fields")}
      >
        <ChevronLeft data-icon="inline-start" />
        {step === "deal" ? "거래 연결" : "필드 검토"}
      </Button>
      {document.fileDataUrl ? <iframe title={`${document.name} 원본 PDF`} src={requestedPage ? `${document.fileDataUrl}#page=${requestedPage.page}` : document.fileDataUrl} className="min-h-[480px] w-full flex-1 border-0" /> : <DocumentStage
        downloadName={document.name}
        requestedPage={requestedPage}
        pageCountOverride={document.pages}
        previewContent={document.dealDocumentId ? <div className="p-6 text-sm">
          <h2 className="mb-4 text-xl font-semibold">{dealDocumentPreviews[document.documentType]?.title ?? uploadDocumentTypeLabel(document.documentType)}</h2>
          <p className="mb-6 break-all text-muted-foreground">{document.name}</p>
          {(dealDocumentPreviews[document.documentType]?.fields ?? []).map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-b py-3"><span>{label}</span><span>{value}</span></div>)}
        </div> : undefined}
        showAiDetection={document.dealDocumentId ? false : step === "compare" && !pdfReviewCompleted}
        reviewMode
        paperClassName="w-full max-w-none"
        canDownload={false}
        reviewGate={{
          completed: pdfReviewCompleted,
          disabled: Boolean(dealBlocked),
          downloading: downloadingDraft,
          onComplete: onPdfReviewComplete,
          onDownload: onDownloadDraft,
        }}
      />}
    </section>
  )

  const dealPanel = (
    <section
      className={cn(
        "h-full min-h-0 flex-col overflow-hidden lg:flex",
        mobilePane === "fields" ? "flex" : "hidden"
      )}
    >
      <DealConfirmPanel
        key={document.name}
        document={document}
        originDealId={originDealId}
        linkedDealLabel={linkedDealLabel}
        linking={linkingDocument}
        tradeSeatAssigned={tradeSeatAssigned}
        linkBlocked={Boolean(dealBlocked)}
        actionPortalTarget={dealActionTarget}
        onShowPdf={isCompact ? () => onMobilePaneChange("preview") : undefined}
        onLinkDeal={onLinkDeal}
        onConnectionChanged={onConnectionChanged}
      />
    </section>
  )

  const workspace = isCompact ? (
    <div className="grid min-h-0 flex-1 grid-cols-1">
      {step === "deal" ? dealPanel : fieldsPanel}
      {pdfPreviewPanel}
    </div>
  ) : step === "deal" ? (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-full min-h-0 flex-1 overflow-hidden"
    >
      <ResizablePanel defaultSize="50%" minSize="32%" maxSize="68%">
        {pdfPreviewPanel}
      </ResizablePanel>
      <PdfPanelResizeHandle label="PDF 원문과 거래 연결 패널 너비 조절" />
      <ResizablePanel defaultSize="50%" minSize="32%" maxSize="68%">
        {dealPanel}
      </ResizablePanel>
    </ResizablePanelGroup>
  ) : (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-full min-h-0 flex-1 overflow-hidden"
    >
      <ResizablePanel defaultSize="50%" minSize="32%" maxSize="68%">
        {fieldsPanel}
      </ResizablePanel>
      <PdfPanelResizeHandle label="추출 필드와 PDF 원문 너비 조절" />
      <ResizablePanel defaultSize="50%" minSize="32%" maxSize="68%">
        {pdfPreviewPanel}
      </ResizablePanel>
    </ResizablePanelGroup>
  )

  return workspace
}

function DocumentTypeResolution({
  onChange,
}: {
  onChange: (documentType: UploadDocumentType) => void
}) {
  return (
    <Alert className="mt-4 px-4 py-3" variant="default">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--color-orange-2)]" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold">문서 유형을 확인해 주세요</div>
          <ToneBadge tone="warning">AI 분류 미확정</ToneBadge>
        </div>
        <p className="mt-1 text-xs leading-5 text-[var(--surface-muted-foreground)]">
          AI가 문서 유형을 확정하지 못했습니다. 유형을 선택하면 해당 문서
          기준으로 검토 필드가 다시 구성됩니다.
        </p>
        <Field className="mt-3 gap-1.5">
          <FieldLabel className="text-xs">문서 유형</FieldLabel>
          <Combobox
            items={manualUploadDocumentTypeOptions.map(
              (option) => option.value
            )}
            onValueChange={(value) =>
              value && onChange(value as UploadDocumentType)
            }
          >
            <ComboboxInput
              className="w-full border-[var(--color-orange-2)]"
              placeholder="문서 유형 검색 또는 선택"
            />
            <ComboboxContent>
              <ComboboxEmpty>일치하는 문서 유형이 없습니다.</ComboboxEmpty>
              <ComboboxList>
                {manualUploadDocumentTypeOptions.map((option) => (
                  <ComboboxItem key={option.value} value={option.value}>
                    {option.label}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </Field>
        <p className="mt-2 text-xs text-[var(--color-orange-1)]">
          유형을 선택해야 필드 검토와 거래 연결을 진행할 수 있습니다.
        </p>
      </div>
    </Alert>
  )
}

function NonTradeDocumentNotice({
  documentType,
}: {
  documentType: UploadDocumentType
}) {
  return (
    <Alert variant="default" className="p-5">
      <AlertTriangle className="text-[var(--color-orange-2)]" />
      <AlertTitle>
        거래 문서로 인식되지 않았습니다 (유형: {documentType}).
      </AlertTitle>
      <AlertDescription className="leading-6">
        거래에 들어가지 않아도 되는 문서일 수 있습니다. 거래에 연결하기 전에 한
        번 더 확인해 주세요.
      </AlertDescription>
    </Alert>
  )
}

function DocumentProcessingNotice({ document }: { document: RecentDocument }) {
  const content =
    document.stage === "failed"
      ? {
          title: "문서를 처리하지 못했어요",
          body: "원본 파일은 목록에 유지됩니다. 상단의 다시 추출로 재시도할 수 있습니다.",
          badge: "재시도 가능",
          tone: "danger" as Tone,
        }
      : document.stage === "duplicate"
        ? {
            title: "이미 등록된 문서입니다",
            body: "동일 파일과 별개로 인보이스 번호 중복 위험도 확인했습니다. 기존 문서와 연결 거래를 먼저 확인하세요.",
            badge: "중복 차단",
            tone: "warning" as Tone,
          }
        : document.stage === "ocr"
          ? {
              title: "AI가 문서를 읽고 있습니다",
              body: "다른 문서는 계속 검토할 수 있습니다. 처리가 끝나면 최근 파일의 상태가 자동으로 바뀝니다.",
              badge: "처리 중",
              tone: "blue" as Tone,
            }
          : {
              title: "AI가 문서를 읽을 준비 중입니다",
              body: "앞선 파일의 업로드가 끝나면 자동으로 분석을 시작합니다.",
              badge: "분석 중",
              tone: "neutral" as Tone,
            }

  return (
    <Alert
      className="p-5"
      variant={
        document.stage === "failed"
          ? "riskHigh"
          : document.stage === "ocr"
            ? "blue"
            : document.stage === "queued"
              ? "gray"
              : "default"
      }
    >
      {document.stage === "ocr" ? (
        <LoaderCircle className="animate-spin" data-icon="inline-start" />
      ) : (
        <AlertTriangle data-icon="inline-start" />
      )}
      <AlertTitle>{content.title}</AlertTitle>
      <AlertDescription className="leading-6">{content.body}</AlertDescription>
      <AlertAction>
        <ToneBadge tone={content.tone}>{content.badge}</ToneBadge>
      </AlertAction>
      {document.stage === "duplicate" ? (
        <ItemGroup className="col-span-full mt-3 gap-2">
          <Item variant="outline" size="xs">
            <ItemContent className="flex-row items-center gap-2">
              <ItemDescription className="text-xs">기존 파일</ItemDescription>
              <ItemTitle className="text-xs">인보이스_2607_003.pdf</ItemTitle>
            </ItemContent>
          </Item>
          <Item variant="outline" size="xs">
            <ItemContent className="flex-row items-center gap-2">
              <ItemDescription className="text-xs">연결 거래</ItemDescription>
              <ItemTitle className="text-xs">
                한빛무역 · INV-2026-0703
              </ItemTitle>
            </ItemContent>
          </Item>
          <Alert variant="default">
            <AlertTriangle className="text-[var(--color-orange-2)]" />
            <AlertDescription className="text-xs">
              동일 인보이스 번호가 2건 감지되어 이중 지급 검토가 필요합니다.
            </AlertDescription>
          </Alert>
        </ItemGroup>
      ) : document.stage === "ocr" ? (
        <div
          className="col-span-full mt-3 space-y-2"
          aria-label="AI 추출 결과 준비 중"
        >
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-4/5" />
          <Skeleton className="h-8 w-2/3" />
        </div>
      ) : null}
    </Alert>
  )
}

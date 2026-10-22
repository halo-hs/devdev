import { useState, useRef, type DragEvent as ReactDragEvent, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Mail, Check, Copy, X, ChevronDown, AlertTriangle, FileText, ChevronUp, Plus, Upload, LoaderCircle, MoreHorizontal, Trash2, Info, RefreshCw, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { ToneBadge } from "@trade-os/components/ToneBadge"
import { AppSelect } from "@trade-os/components/AppSelect"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/Table"
import { Checkbox } from "@/components/ui/Checkbox"
import { createPortal } from "react-dom"
import { Alert, AlertTitle, AlertDescription, AlertAction } from "@/components/ui/Alert"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/DropdownMenu"
import { LabeledProgress } from "@/components/ds2/extensions/LabeledProgress"
import { BusinessListToolbar, BusinessFilterField } from "@/components/platform/SearchFilterBar"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/AlertDialog"
import { useTradeSeatAssigned } from "@share/settings/useSettingsDemo"
import { useStartGuide } from "@trade-os/onboarding/StartGuideProvider"
import { type DealDocumentRecord, dealDocumentFromReviewUrl } from "@trade-os/lib/dealDocumentActions"
import { readDocumentReview, type ReviewedField, type BankCashInput } from "@trade-os/lib/erpDocumentWorkflow"
import { decimalMagnitude, FINANCE_DECIMAL_SCALE } from "@trade-os/lib/financeDecimal"
import { normalizeDecimalInput } from "@trade-os/lib/money"
import { focusDocumentRequirement } from "@trade-os/lib/documentRequirementNavigation"
import { type DocumentBlockingIssue, DocumentBlockingAlerts } from "@trade-os/components/DocumentBlockingAlerts"
import { prototypeBackend } from "@trade-os/lib/prototypeBackend"
import { toast } from "sonner"
import { appLocation } from "@/app/appLocation"
import { type DocumentConnection } from "@trade-os/lib/documentDealConnection"
import { downloadRenderedDocumentPdf } from "@trade-os/documents/documentTemplateModel"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog"
import { AutoSaveStatus } from "@/components/platform/AutoSaveStatus"
import { PdfPanelWorkspaceCard } from "@/components/platform/PdfPanelResizeHandle"
import { DocumentReviewWorkspace } from "@trade-os/confirm/ConfirmFlowConnected"
import { TablePagination } from "@/components/ui/TablePagination"
import { type FileDropZoneRef, FileDropZone } from "@/components/ds2/extensions/FileDropZone"
import { BusinessPageHero } from "@/components/platform/HeroBanner"
import { type RecentDocument, type UploadDocumentType, type UploadDetailStep, type UploadDocumentDealLinks, type UploadDocumentDealLink, type DocumentStageKey } from "@/App"
import { uploadDocumentTypeLabel, manualUploadDocumentTypeOptions, reviewFieldsForDocument, resolvedReviewFields, isUploadDocumentTypeUnresolved } from "@trade-os/inbox/uploadDocumentModel"

const UPLOAD_QUEUE_STORAGE_KEY = "ecoya-prototype-upload-queue-v2"

const UPLOAD_STATUS_SEEDS_KEY = "ecoya-upload-status-seeds-20260918"

function readUploadQueue(): RecentDocument[] {
  try {
    const saved = JSON.parse(localStorage.getItem(UPLOAD_QUEUE_STORAGE_KEY) ?? "null")
    if (Array.isArray(saved) && saved.every((item) => item && typeof item.name === "string" && typeof item.documentType === "string" && typeof item.stage === "string")) {
      const documents: RecentDocument[] = saved.map((document: RecentDocument) => document.contentHash && ["queued", "ocr"].includes(document.stage)
        ? { ...document, stage: "failed", status: "처리 중단 · 다시 추출", tone: "danger" } : document)
      if (!localStorage.getItem(UPLOAD_STATUS_SEEDS_KEY)) {
        for (const seed of recentDocuments.filter((document) => document.name.endsWith("_0918.pdf"))) {
          if (!documents.some((document) => document.name === seed.name)) documents.push(seed)
        }
      }
      return documents
    }
  } catch { /* Use the preview fixtures before the first upload. */ }
  return recentDocuments
}

type UploadProgressState = {
  completed: number
  total: number
}

type DuplicateUploadNotice = {
  fileName: string
  dealLabel?: string
  kind?: "filename" | "content"
}

const TRADE_DOCUMENT_MAX_UPLOAD_FILES = 5

const TRADE_DOCUMENT_MAX_UPLOAD_MB = 50

const TRADE_DOCUMENT_MAX_UPLOAD_BYTES =
  TRADE_DOCUMENT_MAX_UPLOAD_MB * 1024 * 1024

const recentDocuments: RecentDocument[] = [
  {
    name: "은행거래내역서_2026-08-27.pdf",
    uploadedAt: "2026.08.27 15:06",
    pages: 3,
    status: "거래 연결 필요",
    tone: "warning",
    stage: "field",
    documentType: "BANK_STATEMENT",
    pdfReviewCompleted: true,
  },
  {
    name: "인보이스_2607_003.pdf",
    // Explicit source locations for this two-page preview fixture only.
    sourcePages: { buyer: 1, seller: 1, invoice_number: 1, invoice_date: 1, item_name: 1, quantity: 1 },
    uploadedAt: "2026.08.27 14:32",
    pages: 2,
    status: "검토 대기",
    tone: "warning",
    stage: "field",
    documentType: "CI",
  },
  {
    name: "B/L_2607_014.pdf",
    uploadedAt: "2026.08.27 14:24",
    pages: 1,
    status: "분석 중...",
    tone: "blue",
    stage: "ocr",
    documentType: "BL",
  },
  {
    name: "계약서_안심찬.pdf",
    uploadedAt: "2026.08.27 13:58",
    pages: 8,
    dealLabel: "안심찬상사 · SC-2026-0812",
    status: "거래 연결 완료",
    tone: "success",
    stage: "confirmed",
    documentType: "SC",
    pdfReviewCompleted: true,
  },
  {
    name: "포장명세서_0707.pdf",
    uploadedAt: "2026.08.27 13:41",
    pages: 1,
    status: "분석 대기",
    tone: "neutral",
    stage: "queued",
    documentType: "PL",
  },
  {
    name: "ArrivalNotice_014W.pdf",
    uploadedAt: "2026.08.27 12:40",
    pages: 1,
    status: "처리 실패",
    tone: "danger",
    stage: "failed",
    documentType: "AN",
  },
  {
    name: "인보이스_중복확인_0918.pdf", uploadedAt: "2026.09.18 09:15", pages: 2,
    dealLabel: "한빛무역 · INV-2026-0703", status: "중복 확인 필요", tone: "warning", stage: "duplicate", documentType: "CI",
  },
  {
    name: "회사소개서_처리제외_0918.pdf", uploadedAt: "2026.09.18 09:10", pages: 4,
    status: "처리 제외", tone: "neutral", stage: "excluded", documentType: "OTHER",
  },
  {
    name: "스캔문서_유형확인_0918.pdf", uploadedAt: "2026.09.18 09:05", pages: 1,
    status: "유형 확인 필요", tone: "warning", stage: "field", documentType: "UNK",
  },
]

function inferUploadDocumentType(fileName: string): UploadDocumentType {
  const normalized = fileName.toLowerCase().replace(/[\s_-]+/g, " ")
  if (/bill of lading|(^|\s)b\/?l(\s|\.)/.test(normalized)) return "BL"
  if (/packing|(^|\s)pl(\s|\.)/.test(normalized)) return "PL"
  if (/purchase order|(^|\s)po(\s|\.)/.test(normalized)) return "PO"
  if (/invoice|commercial invoice|(^|\s)ci(\s|\.)/.test(normalized)) return "CI"
  if (/contract|sales contract|(^|\s)sc(\s|\.)/.test(normalized)) return "SC"
  if (/arrival notice|(^|\s)an(\s|\.)/.test(normalized)) return "AN"
  if (/bank statement|거래내역|입출금/.test(normalized)) return "BANK_STATEMENT"
  return "UNK"
}

const forwardedEmails = [
  {
    id: "mail-1",
    from: "minji@hanbit-trade.com",
    subject: "FW: July export docs",
    received: "방금 전",
    documents: [
      {
        id: "mail-1-doc-1",
        file: "Invoice_HB-2607-003.pdf",
        meta: "2p · 인보이스",
      },
      {
        id: "mail-1-doc-2",
        file: "PackingList_0707.pdf",
        meta: "1p · 포장명세서",
      },
      {
        id: "mail-1-doc-3",
        file: "Certificate_origin.pdf",
        meta: "1p · 원산지증명",
      },
    ],
  },
  {
    id: "mail-2",
    from: "ops@acme-gmbh.de",
    subject: "Shipping documents attached",
    received: "12분 전",
    documents: [
      {
        id: "mail-2-doc-1",
        file: "BILL_OF_LADING_014W.pdf",
        meta: "3p · 선하증권",
      },
      {
        id: "mail-2-doc-2",
        file: "Insurance_Cover_2607.pdf",
        meta: "1p · 보험증권",
      },
    ],
  },
  {
    id: "mail-3",
    from: "logistics@hanbit-trade.com",
    subject: "Fwd: B/L copy",
    received: "31분 전",
    documents: [
      {
        id: "mail-3-doc-1",
        file: "ArrivalNotice_014W.pdf",
        meta: "1p · 도착통지",
      },
    ],
  },
  {
    id: "mail-4",
    from: "minji@hanbit-trade.com",
    subject: "FW: revised contract package",
    received: "1시간 전",
    documents: [
      {
        id: "mail-4-doc-1",
        file: "SalesContract_Revised.pdf",
        meta: "6p · 매매계약서",
      },
      {
        id: "mail-4-doc-2",
        file: "BankDetails_Hanbit.pdf",
        meta: "1p · 은행정보",
      },
    ],
  },
  {
    id: "mail-5",
    from: "ops@acme-gmbh.de",
    subject: "Signed PO and delivery schedule",
    received: "어제",
    documents: [
      { id: "mail-5-doc-1", file: "PO_ACME_202607.pdf", meta: "2p · 발주서" },
      {
        id: "mail-5-doc-2",
        file: "DeliverySchedule.xlsx",
        meta: "1p · 납품일정",
      },
    ],
  },
] as const satisfies ReadonlyArray<{
  id: string
  from: string
  subject: string
  received: string
  documents: readonly {
    id: string
    file: string
    meta: string
  }[]
}>

const forwardedDocumentCount = forwardedEmails.reduce(
  (sum, mail) => sum + mail.documents.length,
  0
)

function EmailForwardInPanel({
  compact = false,
  onImportFiles,
}: {
  compact?: boolean
  onImportFiles?: (files: File[]) => void
}) {
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(
    () =>
      new Set(
        forwardedEmails[0]?.documents.slice(0, 2).map((doc) => doc.id) ?? []
      )
  )
  const [senderFilter, setSenderFilter] = useState("minji@hanbit-trade.com")
  const [dateFilter, setDateFilter] = useState("today")
  const [visibleCount, setVisibleCount] = useState(3)
  const [copiedPanelEmail, setCopiedPanelEmail] = useState(false)
  const senders = Array.from(new Set(forwardedEmails.map((mail) => mail.from)))
  const filteredEmails = forwardedEmails.filter((mail) => {
    const senderMatches = senderFilter === "all" || mail.from === senderFilter
    const dateMatches =
      dateFilter === "all" ||
      dateFilter === "week" ||
      (dateFilter === "yesterday"
        ? mail.received === "어제"
        : mail.received !== "어제")
    return senderMatches && dateMatches
  })
  const orderedEmails = filteredEmails
  const visibleEmails = orderedEmails.slice(0, visibleCount)
  const visibleDocIds = visibleEmails.flatMap((mail) =>
    mail.documents.map((doc) => doc.id)
  )
  const allVisibleSelected =
    visibleDocIds.length > 0 &&
    visibleDocIds.every((id) => selectedDocs.has(id))
  const someVisibleSelected = visibleDocIds.some((id) => selectedDocs.has(id))
  const toggleDoc = (id: string) => {
    setSelectedDocs((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleVisibleDocs = () => {
    setSelectedDocs((current) => {
      const next = new Set(current)
      if (allVisibleSelected) {
        visibleDocIds.forEach((id) => next.delete(id))
      } else {
        visibleDocIds.forEach((id) => next.add(id))
      }
      return next
    })
  }
  const copyPanelEmail = async () => {
    try {
      await navigator.clipboard.writeText("docs+hanbit@ecoya.app")
      setCopiedPanelEmail(true)
      window.setTimeout(() => setCopiedPanelEmail(false), 1200)
    } catch {
      /* clipboard permission may be blocked */
    }
  }

  return (
    <section
      className={cn(
        "rounded-lg border bg-background text-left",
        compact ? "mt-4 p-3" : "p-5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Mail data-icon="inline-start" /> 메일 첨부 수신
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs leading-5 text-muted-foreground">
            <span>docs+hanbit@ecoya.app</span>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-6"
              onClick={copyPanelEmail}
              aria-label="수신 메일주소 복사"
            >
              {copiedPanelEmail ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </Button>
          </div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">
            조직 전용 주소로 메일을 보내면 제목과 첨부파일만 저장됩니다.
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <ToneBadge tone="neutral">메일 {forwardedEmails.length}건</ToneBadge>
          <ToneBadge tone="blue">문서 {forwardedDocumentCount}개</ToneBadge>
        </div>
      </div>

      {compact ? (
        <div className="mt-3 max-h-56 divide-y overflow-y-auto border-y">
          {visibleEmails.slice(0, 2).map((mail) => (
            <div key={mail.id} className="px-1 py-2">
              <div className="grid grid-cols-[minmax(0,.8fr)_auto] gap-2">
                <div className="truncate text-[11px] text-muted-foreground">
                  {mail.received} · {mail.from}
                </div>
                <ToneBadge tone="neutral">{mail.documents.length}개</ToneBadge>
              </div>
              <div className="mt-1 truncate text-xs font-medium">
                {mail.documents.map((doc) => doc.file).join(", ")}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-2 rounded-[var(--r-lg)] bg-[var(--surface-background)] px-3 py-3 shadow-[var(--shadow-section)] ring-1 ring-[var(--surface-border)]">
            <label className="grid gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                수신일자
              </span>
              <AppSelect
                value={dateFilter}
                onValueChange={(value) => {
                  setDateFilter(value)
                  setVisibleCount(3)
                }}
                options={[
                  ["today", "오늘"],
                  ["yesterday", "어제"],
                  ["week", "최근 7일"],
                  ["all", "전체 기간"],
                ]}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                발신자 멤버
              </span>
              <AppSelect
                value={senderFilter}
                onValueChange={(value) => {
                  setSenderFilter(value)
                  setVisibleCount(3)
                }}
                options={[...senders, ["all", "전체 발신자"]]}
              />
            </label>
          </div>
          <div className="flex items-center justify-between px-1 py-3">
            <div className="text-xs text-muted-foreground">
              선택한 문서 {selectedDocs.size}개를 파일 목록에 추가합니다.
            </div>
            <Button
              size="sm"
              disabled={selectedDocs.size === 0}
              onClick={() => {
                const files = forwardedEmails
                  .reduce<Array<{ id: string; file: string; meta: string }>>(
                    (documents, mail) => [...documents, ...mail.documents],
                    []
                  )
                  .filter((document) => selectedDocs.has(document.id))
                  .map(
                    (document) =>
                      new File(["ECOYA mail attachment"], document.file, {
                        type: "application/pdf",
                      })
                  )
                onImportFiles?.(files)
              }}
            >
              선택 문서 가져오기
            </Button>
          </div>
          <Table className="min-w-[520px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[36%] text-left">수신</TableHead>
                <TableHead className="text-left">
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={
                        allVisibleSelected
                          ? true
                          : someVisibleSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={toggleVisibleDocs}
                      aria-label="표시된 문서 전체 선택"
                    />
                    <span>문서</span>
                  </label>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleEmails.map((mail) => (
                <TableRow key={mail.id}>
                  <TableCell className="h-auto min-w-0 py-3 text-left text-xs whitespace-normal text-muted-foreground">
                    <div className="truncate">{mail.received}</div>
                    <div className="mt-1 truncate">{mail.from}</div>
                    <div className="mt-1 truncate text-foreground">
                      {mail.subject}
                    </div>
                  </TableCell>
                  <TableCell className="h-auto min-w-0 p-0 text-left whitespace-normal">
                    <div className="min-w-0 divide-y divide-[var(--table-border)]">
                      {mail.documents.map((doc) => {
                        const checked = selectedDocs.has(doc.id)
                        return (
                          <label
                            key={doc.id}
                            className={cn(
                              "flex cursor-pointer items-center gap-3 px-2 py-2.5 transition",
                              checked
                                ? "bg-[var(--table-row-background-selected)]"
                                : "hover:bg-[var(--table-row-background-hover)]"
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleDoc(doc.id)}
                              aria-label={`${doc.file} 선택`}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">
                                {doc.file}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                {doc.meta}
                              </span>
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-3 border-t border-[var(--table-border)]">
            {visibleEmails.length < orderedEmails.length ? (
              <div className="px-3 py-3 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVisibleCount((count) => count + 3)}
                >
                  더 보기
                </Button>
              </div>
            ) : orderedEmails.length > 0 ? (
              <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                모든 수신 메일을 불러왔습니다.
              </div>
            ) : (
              <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                선택한 발신자의 수신 메일이 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function EmailForwardQueue({
  onClose,
  onImportFiles,
}: {
  onClose: () => void
  onImportFiles: (files: File[]) => void
}) {
  // Portaled to body so the panel stacks above the shell header instead of
  // inside the page's stacking context.
  return createPortal(
    <div className="fixed inset-y-0 right-0 z-50 w-[min(560px,calc(100vw-24px))] border-l bg-background shadow-2xl">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex h-14 shrink-0 items-center justify-between border-b px-5">
          <div>
            <div className="text-sm font-semibold">수신 메일에서 첨부 선택</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              메일 1개에 포함된 여러 문서를 선택할 수 있습니다.
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <EmailForwardInPanel
            onImportFiles={(files) => {
              onImportFiles(files)
              onClose()
            }}
          />
        </div>
      </div>
    </div>,
    document.body
  )
}

function AiDocumentProcessingNotice() {
  return (
    // 문서 올리기 V2 note-group: Gray 5 13px note + Blue 4 11px "자세히" button.
    <details className="group text-[13px] text-[var(--color-gray-6)]">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-end gap-x-1 gap-y-1 rounded-sm py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <span>AI 추출값은 원본과 확인한 뒤 확정하세요.</span>
        <span className="inline-flex h-6 items-center gap-1 rounded-[var(--r-sm)] pr-1.5 pl-2 text-[11px] leading-4 text-[var(--color-primary-4)] hover:bg-[var(--color-primary-10)]">
          자세히 <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <p className="mt-1 text-xs leading-5 text-[var(--color-gray-4)]">
        ECOYA는 PDF에서 필드를 읽고 추출하는 데 AI를 사용합니다. 추출값은
        부정확하거나 불완전할 수 있습니다. 확인한 값만 공식 기록이 됩니다.
        법률·세무·관세·재무 자문이 아닙니다.
      </p>
    </details>
  )
}

function DuplicateUploadAlert({
  notice,
  onDismiss,
}: {
  notice: DuplicateUploadNotice
  onDismiss: () => void
}) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="size-4" />
      <AlertTitle className="text-xs">
        {notice.kind === "content" ? "동일한 내용의 문서가 있습니다." : "이미 같은 이름의 문서가 있습니다."}
      </AlertTitle>
      <AlertDescription className="text-[11px] leading-5">
        <span className="font-semibold">{notice.fileName}</span>
        {notice.dealLabel
          ? ` 파일은 ${notice.dealLabel} 거래에 이미 포함되어 있습니다.`
          : " 파일은 이미 업로드되어 있습니다."}
        {notice.kind === "content" ? " 이름을 바꿔도 같은 파일은 다시 올릴 수 없습니다." : " 다른 내용의 파일이라면 이름을 변경해 주세요."}
      </AlertDescription>
      <AlertAction>
        <Button variant="ghost" size="xs" onClick={onDismiss}>
          확인
        </Button>
      </AlertAction>
    </Alert>
  )
}

// Kept as a fallback for older prototype routes while the horizontal tray ships.
type DocumentTrayFilter = "all" | "processing" | "review" | "failed" | "confirmed"

type DocumentQueueSort = "recent" | "oldest"

function matchesDocumentQueueStatus(
  document: RecentDocument,
  filter: DocumentTrayFilter
) {
  if (filter === "all") return true
  if (filter === "confirmed") return document.stage === "confirmed"
  if (filter === "processing") return ["ocr", "queued"].includes(document.stage)
  if (filter === "review")
    return ["field", "duplicate"].includes(document.stage)
  return ["failed", "excluded"].includes(document.stage)
}

function uploadDocumentTypeCode(documentType: UploadDocumentType) {
  const compactCodes: Partial<Record<UploadDocumentType, string>> = {
    UNK: "?",
    OTHER: "기타",
    CUSTOMS_ENTRY: "CE",
    BANK_STATEMENT: "BS",
    FREIGHT_INVOICE: "FI",
    CUSTOMS_DECLARATION: "CD",
    INSURANCE_CERTIFICATE: "INS",
  }
  return compactCodes[documentType] ?? documentType
}

function UploadDocumentTypeMark({
  documentType,
  className,
}: {
  documentType: UploadDocumentType
  className?: string
}) {
  const unresolved = documentType === "UNK"
  return (
    <span
      className={cn(
        // 문서 올리기 V2: small outlined chip — Document icon + type code.
        "inline-flex h-5 shrink-0 flex-row items-center justify-center gap-0.5 rounded-[4px] border border-[var(--color-gray-7)] bg-[var(--color-gray-12)] px-1 text-[var(--color-gray-2)]",
        unresolved && "border-dashed text-[var(--color-gray-5)]",
        className
      )}
      title={uploadDocumentTypeLabel(documentType)}
      aria-label={`문서 유형 ${uploadDocumentTypeLabel(documentType)}`}
    >
      <FileText className="size-3" aria-hidden="true" />
      <span className="text-[10px] leading-none font-semibold">
        {uploadDocumentTypeCode(documentType)}
      </span>
    </span>
  )
}

function HorizontalDocumentTray({
  documents,
  selectedIndex,
  currentDocument,
  onSelect,
  onDelete,
  onFilesSelected,
  uploadProgress,
  uploadNotice,
  duplicateUploadNotice,
  onDismissDuplicateUpload,
  onCancelUpload,
  expanded,
  onExpandedChange,
}: {
  documents: RecentDocument[]
  selectedIndex: number
  currentDocument?: RecentDocument
  onSelect: (index: number) => void
  onDelete: (index: number) => void
  onFilesSelected: (files: File[]) => void
  uploadProgress: UploadProgressState | null
  uploadNotice: string
  duplicateUploadNotice: DuplicateUploadNotice | null
  onDismissDuplicateUpload: () => void
  onCancelUpload: () => void
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const folderInputRef = useRef<HTMLInputElement | null>(null)
  const queueDragDepthRef = useRef(0)
  const [mailOpen, setMailOpen] = useState(false)
  const [queueDragActive, setQueueDragActive] = useState(false)
  const [filter, setFilter] = useState<DocumentTrayFilter>("all")
  const [typeFilter, setTypeFilter] = useState<UploadDocumentType | "all">(
    "all"
  )
  const [sort, setSort] = useState<DocumentQueueSort>("recent")
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [cancelUploadOpen, setCancelUploadOpen] = useState(false)
  const selectedDocument = currentDocument ?? documents[selectedIndex] ?? documents[0]
  const processingCount = documents.filter((document) =>
    ["ocr", "queued"].includes(document.stage)
  ).length
  const reviewCount = documents.filter((document) =>
    ["field", "duplicate"].includes(document.stage)
  ).length
  const failedCount = documents.filter((document) =>
    ["failed", "excluded"].includes(document.stage)
  ).length
  const availableDocumentTypes = Array.from(
    new Set(documents.map((document) => document.documentType))
  )
  const filteredDocuments = documents
    .map((document, index) => ({ document, index }))
    .filter(
      ({ document }) =>
        matchesDocumentQueueStatus(document, filter) &&
        (typeFilter === "all" || document.documentType === typeFilter)
    )
    .sort(({ document: left }, { document: right }) =>
      sort === "recent"
        ? right.uploadedAt.localeCompare(left.uploadedAt)
        : left.uploadedAt.localeCompare(right.uploadedAt)
    )

  const handleExpandedChange = (nextExpanded: boolean) => {
    onExpandedChange(nextExpanded)
  }

  const acceptFiles = (files: File[]) => {
    if (files.length === 0 || uploadProgress) return
    handleExpandedChange(true)
    onFilesSelected(files)
  }
  const handleQueueDragEnter = (event: ReactDragEvent<HTMLDivElement>) => {
    if (
      documents.length === 0 ||
      uploadProgress ||
      !event.dataTransfer.types.includes("Files")
    )
      return
    event.preventDefault()
    queueDragDepthRef.current += 1
    setQueueDragActive(true)
  }
  const handleQueueDragOver = (event: ReactDragEvent<HTMLDivElement>) => {
    if (
      documents.length === 0 ||
      uploadProgress ||
      !event.dataTransfer.types.includes("Files")
    )
      return
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }
  const handleQueueDragLeave = (event: ReactDragEvent<HTMLDivElement>) => {
    if (documents.length === 0) return
    event.preventDefault()
    queueDragDepthRef.current = Math.max(queueDragDepthRef.current - 1, 0)
    if (queueDragDepthRef.current === 0) setQueueDragActive(false)
  }
  const handleQueueDrop = (event: ReactDragEvent<HTMLDivElement>) => {
    if (documents.length === 0 || uploadProgress) return
    event.preventDefault()
    queueDragDepthRef.current = 0
    setQueueDragActive(false)
    acceptFiles(Array.from(event.dataTransfer.files))
  }

  return (
    <Card
      onDragEnter={handleQueueDragEnter}
      onDragOver={handleQueueDragOver}
      onDragLeave={handleQueueDragLeave}
      onDrop={handleQueueDrop}
      className={cn(
        "shrink-0 transition-[box-shadow,background-color]",
        !expanded && "border-0 shadow-[0_6px_18px_rgb(16_24_40/5%)]",
        queueDragActive &&
          "bg-[var(--control-selected-soft-background)] ring-2 ring-[var(--control-selected-border)]"
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label="검토·배정 대기 문서 목록"
        aria-expanded={expanded}
        className="flex min-h-14 cursor-pointer flex-wrap items-center gap-2 p-2 xl:flex-nowrap xl:gap-3.5 xl:py-3 xl:pr-3.5 xl:pl-3 outline-none hover:bg-muted/20 focus-visible:[box-shadow:var(--shadow-keyboard-focus)]"
        onClick={() => handleExpandedChange(!expanded)}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            handleExpandedChange(!expanded)
          }
        }}
      >
        <div
          className={cn(
            "order-0 flex h-11 min-w-0 flex-1 items-center gap-1.5 py-2 pr-2 pl-1 text-[length:var(--text-body-8)] xl:flex-none",
            expanded ? "text-[var(--color-primary-4)]" : "text-[var(--color-gray-2)]"
          )}
        >
          <span className="font-semibold">검토·배정 대기 문서</span>
          <span className="inline-flex items-center justify-center rounded-[10px] bg-[var(--color-gray-11)] px-[7px] py-px text-[12px] font-semibold text-[var(--color-gray-4)]">
            {documents.length}
          </span>
          {expanded ? (
            <ChevronUp className="ml-auto size-4 xl:ml-0" />
          ) : (
            <ChevronDown className="ml-auto size-4 xl:ml-0" />
          )}
        </div>
        <span aria-hidden="true" className="hidden h-[26px] w-px shrink-0 bg-[var(--color-gray-10)] xl:block" />

        {selectedDocument ? (
          <div className="order-2 flex min-w-0 w-full items-center gap-2 px-3 pb-2 xl:order-none xl:w-auto xl:flex-1 xl:rounded-[var(--r-md)] xl:bg-[var(--color-gray-11)] xl:py-2">
            {/* Figma AccordionHeader/CurrentDoc (6294:32320): file name over type · position. */}
            <div className="min-w-0 flex-1">
              <div
                className="truncate text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] font-medium text-[var(--color-gray-2)]"
                title={selectedDocument.name}
              >
                {selectedDocument.name}
              </div>
              <div className="truncate text-[11px] leading-4 text-[var(--color-gray-5)]">
                {uploadDocumentTypeLabel(selectedDocument.documentType)}
                {selectedIndex >= 0 ? ` · ${selectedIndex + 1} / ${documents.length}` : " · 연결 완료"}
              </div>
            </div>
            <ToneBadge tone={selectedDocument.tone}>
              {selectedDocument.status}
            </ToneBadge>
          </div>
        ) : null}

        <span aria-hidden="true" className="hidden h-[26px] w-px shrink-0 bg-[var(--color-gray-10)] xl:block" />
        <div className="ml-auto hidden h-11 shrink-0 items-center gap-2 whitespace-nowrap pr-2 text-[11px] font-medium xl:flex">
          <span className="rounded-[10px] bg-[var(--color-system-orange6)] px-2 py-0.5 text-[var(--color-orange-2)]">
            확인 대기 {reviewCount}
          </span>
          <span className="rounded-[10px] bg-[var(--color-system-blue6)] px-2 py-0.5 text-[var(--color-primary-4)]">
            AI 분석 중 {processingCount}
          </span>
          <span className="rounded-[10px] bg-[var(--color-red-8)] px-2 py-0.5 text-[var(--color-red-2)]">
            재업로드 필요 {failedCount}
          </span>
        </div>

        <div
          className="flex shrink-0 items-center gap-2"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                aria-label="파일 추가 메뉴"
              >
                <Plus data-icon="inline-start" />
                파일 추가
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem
                onSelect={() => {
                  handleExpandedChange(true)
                  setMailOpen(true)
                }}
              >
                <Mail /> 이메일에서 찾기
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  folderInputRef.current?.click()
                }}
              >
                <FileText /> 폴더 선택
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  fileInputRef.current?.click()
                }}
              >
                <Upload /> 파일 선택
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        hidden
        onChange={(event) => {
          if (!uploadProgress && event.target.files) {
            acceptFiles(Array.from(event.target.files))
          }
          event.target.value = ""
        }}
      />
      <input
        ref={(node) => {
          folderInputRef.current = node
          node?.setAttribute("webkitdirectory", "")
          node?.setAttribute("directory", "")
        }}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        hidden
        onChange={(event) => {
          if (!uploadProgress && event.target.files) {
            acceptFiles(Array.from(event.target.files))
          }
          event.target.value = ""
        }}
      />

      {expanded ? (
        <CardContent className="border-t border-[var(--surface-border)] bg-[var(--surface-background)] p-2.5">
          {duplicateUploadNotice ? (
            <div className="mb-2 grid gap-2">
              <DuplicateUploadAlert
                notice={duplicateUploadNotice}
                onDismiss={onDismissDuplicateUpload}
              />
            </div>
          ) : null}
          {documents.length === 0 && !uploadProgress ? (
            <div className="rounded-[var(--r-md)] border border-dashed border-[var(--surface-border)] px-4 py-5 text-center text-xs text-[var(--surface-muted-foreground)]">
              파일 추가 버튼에서 문서를 추가해 주세요.
            </div>
          ) : uploadProgress ? (
            <div className="flex min-h-11 items-center gap-3 rounded-[var(--r-md)] border border-[var(--surface-border)] bg-[var(--surface-background)] px-3 py-2 text-xs">
              <LoaderCircle className="size-4 animate-spin text-primary" />
              <span className="font-medium">파일 업로드 중</span>
              <LabeledProgress
                width={112}
                showPercentage={false}
                aria-label="파일 업로드 진행률"
                value={(uploadProgress.completed / uploadProgress.total) * 100}
              />
              <span className="text-muted-foreground tabular-nums">
                {uploadProgress.completed}/{uploadProgress.total}
              </span>
              <Button
                variant="ghost"
                size="xs"
                className="ml-auto"
                onClick={() => setCancelUploadOpen(true)}
              >
                취소
              </Button>
            </div>
          ) : null}
          {mailOpen ? (
            <EmailForwardQueue
              onClose={() => setMailOpen(false)}
              onImportFiles={acceptFiles}
            />
          ) : null}

          {uploadNotice ? (
            <Alert className="mt-2" variant="default">
              <AlertDescription className="text-xs">
                {uploadNotice}
              </AlertDescription>
            </Alert>
          ) : null}

          {documents.length > 0 ? (
            <>
              <div
                className={cn(
                  "flex flex-wrap items-center gap-2 px-1",
                  (uploadProgress || mailOpen || uploadNotice) &&
                    "mt-4 border-t border-[var(--surface-border)] pt-3"
                )}
              >
                <BusinessListToolbar aria-label="대기 문서 필터">
                  <BusinessFilterField label="상태">
                    <Select
                      value={filter}
                      onValueChange={(value) =>
                        setFilter(value as DocumentTrayFilter)
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        className="w-32"
                        aria-label="상태 필터"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="processing">처리 중</SelectItem>
                        <SelectItem value="review">확인 필요</SelectItem>
                        <SelectItem value="failed">처리 실패</SelectItem>
                      </SelectContent>
                    </Select>
                  </BusinessFilterField>
                  <BusinessFilterField label="문서 유형">
                    <Select
                      value={typeFilter}
                      onValueChange={(value) =>
                        setTypeFilter(value as UploadDocumentType | "all")
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        className="w-40"
                        aria-label="문서 유형 필터"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectItem value="all">전체</SelectItem>
                        {availableDocumentTypes.map((documentType) => (
                          <SelectItem key={documentType} value={documentType}>
                            {uploadDocumentTypeLabel(documentType)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </BusinessFilterField>
                  <BusinessFilterField label="정렬">
                    <Select
                      value={sort}
                      onValueChange={(value) =>
                        setSort(value as DocumentQueueSort)
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        className="w-40"
                        aria-label="정렬"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectItem value="recent">최근 업로드 순</SelectItem>
                        <SelectItem value="oldest">오래된 업로드 순</SelectItem>
                      </SelectContent>
                    </Select>
                  </BusinessFilterField>
                </BusinessListToolbar>
              </div>

              <div className="field-scrollbar mt-2 max-h-[min(62svh,34rem)] overflow-auto rounded-[var(--r-md)] ring-1 ring-[var(--table-border)]">
                <Table className="min-w-[780px]">
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="w-11" />
                      <TableHead className="min-w-[180px] text-left!">
                        문서 유형
                      </TableHead>
                      <TableHead className="min-w-[220px] text-left!">
                        파일
                      </TableHead>
                      <TableHead className="min-w-[140px] text-left!">
                        등록일자
                      </TableHead>
                      <TableHead className="w-[120px] text-left!">
                        상태
                      </TableHead>
                      <TableHead className="w-[72px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map(({ document, index }) => (
                      <TableRow
                        key={`${document.name}-${index}`}
                        data-clickable="true"
                        data-state={
                          selectedIndex === index ? "selected" : undefined
                        }
                        tabIndex={0}
                        className="cursor-pointer outline-none focus-visible:[box-shadow:var(--shadow-keyboard-focus)]"
                        onClick={() => {
                          onSelect(index)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            onSelect(index)
                          }
                        }}
                      >
                        <TableCell className="py-2 text-[var(--surface-muted-foreground)] tabular-nums">
                          {String(index + 1).padStart(2, "0")}
                        </TableCell>
                        <TableCell className="py-2 text-left!">
                          <span className="flex min-w-0 items-center gap-2">
                            <UploadDocumentTypeMark
                              documentType={document.documentType}
                            />
                            <span className="flex min-w-0 items-center gap-1.5 truncate">
                              {uploadDocumentTypeLabel(document.documentType)}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="truncate py-2 text-left!">
                          {document.name}
                        </TableCell>
                        <TableCell className="max-w-[240px] truncate py-2 text-left! text-[var(--surface-muted-foreground)]">
                          {document.uploadedAt}
                        </TableCell>
                        <TableCell className="py-2 text-left!">
                          <ToneBadge tone={document.tone}>
                            {document.status}
                          </ToneBadge>
                        </TableCell>
                        <TableCell className="relative py-2 text-right!">
                          <span className="flex items-center justify-end gap-1">
                            {selectedIndex === index ? (
                              <Check className="size-4 text-[var(--color-primary-4)]" />
                            ) : null}
                            {/* Portal menu so the scrolling table never clips it. */}
                            <DropdownMenu
                              open={openMenu === document.name}
                              onOpenChange={(open) =>
                                setOpenMenu(open ? document.name : null)
                              }
                            >
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className="[--button-ghost-foreground:var(--color-gray-4)]"
                                  aria-label={`${document.name} 메뉴`}
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <MoreHorizontal />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="min-w-24"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <DropdownMenuItem
                                  variant="destructive"
                                  onSelect={() => setDeleteTarget(index)}
                                >
                                  <Trash2 /> 삭제
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredDocuments.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-8 text-center! text-xs text-[var(--surface-muted-foreground)]"
                        >
                          조건에 맞는 파일이 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
              <div className="px-1 pt-2 text-xs text-[var(--table-caption-foreground)]">
                전체 {filteredDocuments.length}건
              </div>
            </>
          ) : null}
        </CardContent>
      ) : null}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>문서를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제하면 큐에서 제거되며, 복구할 수 없습니다. 필요하면 다시
              업로드해 주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTarget !== null) onDelete(deleteTarget)
                setDeleteTarget(null)
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={cancelUploadOpen} onOpenChange={setCancelUploadOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>업로드를 중단할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              완료된 {uploadProgress?.completed ?? 0}개 파일은 큐에 남습니다.
              나머지
              {` ${Math.max(
                (uploadProgress?.total ?? 0) - (uploadProgress?.completed ?? 0),
                0
              )}개는 취소됩니다.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>계속 업로드</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setCancelUploadOpen(false)
                onCancelUpload()
              }}
            >
              중단
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

export function InboxScreen({
  role,
  onOpenDeal,
  originDealId,
  initialDocumentName,
  initialStep,
  onDocumentOpen,
  linkedDealsByDocument,
  onDocumentDealLinked,
}: {
  role: "owner" | "admin" | "member"
  onOpenDeal: (dealId: string, focus?: "finance") => void
  originDealId?: string | null
  initialDocumentName?: string
  initialStep?: UploadDetailStep
  onDocumentOpen?: (
    documentName: string | null,
    step?: UploadDetailStep
  ) => void
  linkedDealsByDocument: UploadDocumentDealLinks
  onDocumentDealLinked: (
    documentName: string,
    link: UploadDocumentDealLink | null
  ) => void
}) {
  const tradeSeatAssigned = useTradeSeatAssigned(role)
  const guide = useStartGuide()
  const [pendingCostDealId, setPendingCostDealId] = useState<string | null>(null)
  const [dealReviewDocument] = useState<DealDocumentRecord | null>(() => dealDocumentFromReviewUrl())
  const dealReviewRequested = new URLSearchParams(window.location.search).get("from") === "deal"
  const reviewMatches = (document: RecentDocument) => dealReviewDocument
    ? document.dealDocumentId === dealReviewDocument.id
    : document.name === initialDocumentName
  const reviewCode = dealReviewDocument?.code === "CO" ? "C/O" : dealReviewDocument?.code === "IC" ? "INSURANCE_CERTIFICATE" : dealReviewDocument?.code
  const reviewEntry: RecentDocument | null = dealReviewDocument ? {
    name: dealReviewDocument.file, uploadedAt: "거래 서류", dealDocumentId: dealReviewDocument.id,
    documentType: (manualUploadDocumentTypeOptions.some(option => option.value === reviewCode) ? reviewCode : "UNK") as UploadDocumentType,
    fileDataUrl: dealReviewDocument.fileDataUrl,
    status: "검토 대기", tone: "warning", stage: "field", pdfReviewCompleted: false,
    reviewedFields: readDocumentReview(`${dealReviewDocument.id}:${dealReviewDocument.revision}`).fields,
  } : null
  const queue = readUploadQueue().filter(document => !dealReviewDocument || document.dealDocumentId !== dealReviewDocument.id)
  const initialUploadDocuments: RecentDocument[] = (reviewEntry ? [reviewEntry, ...queue] : queue).map(
    (document) => {
      if (reviewEntry && document.dealDocumentId === reviewEntry.dealDocumentId) return document
      const review = readDocumentReview(document.name)
      document = { ...document, reviewedFields: review.fields }
      const link = review.connectionKnown || review.dealId
        ? review.dealId ? { dealId: review.dealId, dealLabel: review.dealLabel ?? review.dealId } : null
        : linkedDealsByDocument[document.name]
      if (review.connectionKnown && !link) document = { ...document, dealLabel: undefined, stage: "field", status: "거래 연결 필요", tone: "warning" }
      const opensConnectedStep =
        initialStep === "deal" && document.name === initialDocumentName
      return link
        ? {
            ...document,
            dealLabel: link.dealLabel,
            pdfReviewCompleted: true,
            stage: "confirmed",
            status: "거래 연결 완료",
            tone: "success",
          }
        : opensConnectedStep
          ? {
              ...document,
              pdfReviewCompleted: true,
              status: "거래 연결 필요",
              tone: "warning",
            }
          : document
    }
  )
  const initialDocumentIndex = initialDocumentName
    ? initialUploadDocuments.findIndex(
        reviewMatches
      )
    : -1
  const initialSelectedDocument =
    initialUploadDocuments[initialDocumentIndex] ?? initialUploadDocuments[0]
  const [hasFile, setHasFile] = useState(initialDocumentIndex >= 0)
  const [step, setStep] = useState<UploadDetailStep>(
    () =>
      initialStep ??
      (initialSelectedDocument?.pdfReviewCompleted ? "deal" : "compare")
  )
  const [selectedIndex, setSelectedIndex] = useState(
    initialDocumentIndex >= 0 ? initialDocumentIndex : 0
  )
  const [uploadDocuments, setUploadDocuments] = useState<RecentDocument[]>(
    () => initialUploadDocuments
  )
  useEffect(() => {
    try { localStorage.setItem(UPLOAD_QUEUE_STORAGE_KEY, JSON.stringify(uploadDocuments.filter(document => !document.dealDocumentId))); localStorage.setItem(UPLOAD_STATUS_SEEDS_KEY, "applied") } catch { /* Current session remains usable. */ }
  }, [uploadDocuments])
  const [autoSaving, setAutoSaving] = useState(false)
  const [autoSavePending, setAutoSavePending] = useState(false)
  const [autoSaveError, setAutoSaveError] = useState(false)
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState(() => new Date())
  const [linkingDocument, setLinkingDocument] = useState(false)
  const [downloadingDraft, setDownloadingDraft] = useState(false)

  const [uploadProgress, setUploadProgress] =
    useState<UploadProgressState | null>(null)
  const [uploadNotice, setUploadNotice] = useState("")
  const [duplicateUploadNotice, setDuplicateUploadNotice] =
    useState<DuplicateUploadNotice | null>(null)
  const [fileTrayOpen, setFileTrayOpen] = useState(false)
  const [dealActionTarget, setDealActionTarget] =
    useState<HTMLSpanElement | null>(null)
  const [mobilePane, setMobilePane] = useState<"fields" | "preview">("fields")
  const autoSaveVersionRef = useRef(0)
  const autoSavePendingRef = useRef(false)
  const uploadTimerRef = useRef<number | null>(null)
  const uploadPreparingRef = useRef(false)
  const activeUploadDocumentNamesRef = useRef<string[]>([])
  const activeUploadCompletedRef = useRef(0)
  const uploadOriginRef = useRef({
    hasFile: false,
    selectedDocumentName: null as string | null,
  })
  // Route changes inside the upload workspace must keep its queue and timers.
  const previousUploadRoute = useRef({ initialDocumentName, initialStep })
  useEffect(() => {
    const previous = previousUploadRoute.current
    if (
      previous.initialDocumentName === initialDocumentName &&
      previous.initialStep === initialStep
    ) return
    previousUploadRoute.current = { initialDocumentName, initialStep }
    const index = uploadDocuments.findIndex(
      (document) => document.name === initialDocumentName
    )
    setHasFile(index >= 0)
    if (index < 0) return
    // A new URL resets the active document while preserving the mounted upload queue.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(index)
    autoSaveVersionRef.current += 1
    autoSavePendingRef.current = false
    setAutoSaving(false)
    setAutoSavePending(false)
    setAutoSaveError(false)
    setStep(initialStep ?? "compare")
    setMobilePane("fields")
  }, [initialDocumentName, initialStep, uploadDocuments])
  useEffect(() => {
    const anchor = guide?.state?.anchor
    if (!anchor || anchor.stage !== "processing") return
    const pending = uploadDocuments.find(document => document.name === anchor.documentId)
    if (!pending || !["queued", "ocr"].includes(pending.stage)) return
    const timer = window.setTimeout(() => {
      const failed = /encrypted|password|fail/i.test(pending.name)
      setUploadDocuments(current => current.map(document => document.name === pending.name ? { ...document, stage: failed ? "failed" : "field", status: failed ? "처리 실패" : "검토 대기", tone: failed ? "danger" : "warning" } : document))
      if (!failed) guide?.record({ type: "document-created", documentId: pending.name, receipt: crypto.randomUUID() })
      guide?.record({ type: "extraction", documentId: pending.name, stage: failed ? "failed" : "ready" })
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [guide, uploadDocuments])
  const selectedDocument = uploadDocuments[selectedIndex] ?? uploadDocuments[0] ?? recentDocuments[0]
  const selectedDocumentRef = useRef(selectedDocument)
  useEffect(() => { selectedDocumentRef.current = selectedDocument }, [selectedDocument])
  const handleReviewedFieldChange = (key: string, patch: Partial<ReviewedField>) => {
    const document = selectedDocumentRef.current
    const original = reviewFieldsForDocument(document.documentType).find((field) => field.key === key)
    const current = document.reviewedFields?.[key] ?? { value: original?.value ?? "", unit: original?.unit }
    const next = { ...document, pdfReviewCompleted: false, reviewedFields: { ...document.reviewedFields, [key]: { ...current, ...patch, userEdited: true } } }
    selectedDocumentRef.current = next
    setUploadDocuments((documents) => documents.map((item) => item.name === document.name ? next : item))
  }
  const currentReviewFields = resolvedReviewFields(selectedDocument)
  const uploadFieldErrors = currentReviewFields.flatMap((field) => {
    const missing = field.required && !field.value.trim()
    const invalid = field.value.trim()
      && (field.kind === "money" || field.kind === "number" || ["quantity", "unit_price", "total_amount", "gross_weight", "net_weight"].includes(field.key))
      && (decimalMagnitude(normalizeDecimalInput(field.value), FINANCE_DECIMAL_SCALE) ?? BigInt(-1)) < BigInt(0)
    return missing || invalid || field.tone === "danger" ? [{ key: field.key, label: `${field.label} · ${missing ? "필수값 누락" : invalid ? "0 이상의 숫자를 입력하세요" : field.status}` }] : []
  })
  const etd = currentReviewFields.find((field) => field.key === "etd")?.value
  const eta = currentReviewFields.find((field) => field.key === "eta")?.value
  const pendingUploadDocuments = uploadDocuments
    .map((document, index) => ({ document, index }))
    .filter(({ document }) => document.stage !== "confirmed")
  const pendingSelectedIndex = pendingUploadDocuments.findIndex(({ index }) => index === selectedIndex)
  const isTypeUnresolved = isUploadDocumentTypeUnresolved(selectedDocument)
  const pdfReviewCompleted =
    selectedDocument.pdfReviewCompleted === true ||
    selectedDocument.stage === "confirmed"
  const linkedDealLabel = selectedDocument.dealLabel ?? null
  const isDealBlocked = isTypeUnresolved || uploadFieldErrors.length > 0
    || Boolean(etd && eta && eta < etd) || autoSaving || autoSavePending || autoSaveError
    || !["field", "confirmed"].includes(selectedDocument.stage)

  const openUploadRequirement = (key?: string) => {
    setStep("compare")
    onDocumentOpen?.(selectedDocument.name, "compare")
    setMobilePane("fields")
    focusDocumentRequirement(key ? `[data-upload-field="${key}"]` : '[aria-label="항목 점검"]')
  }
  const uploadErrors: DocumentBlockingIssue[] = [
    ...uploadFieldErrors.map((field) => ({ ...field, onSelect: () => openUploadRequirement(field.key) })),
    ...(etd && eta && eta < etd ? [{ key: "dates", label: "ETA · ETD보다 빠를 수 없습니다", onSelect: () => openUploadRequirement("eta") }] : []),
    ...(autoSaveError ? [{ key: "save", label: "변경사항 저장 실패 · 다시 저장", onSelect: () => { void handleAutoSave("retry") } }] : []),
    ...(selectedDocument.stage === "failed" ? [{ key: "extract", label: "문서 추출 실패", onSelect: () => openUploadRequirement() }] : []),
  ]
  const uploadChecks: DocumentBlockingIssue[] = isTypeUnresolved
    ? [{ key: "type", label: "문서 유형 선택", onSelect: () => openUploadRequirement() }]
    : selectedDocument.stage === "duplicate"
      ? [{ key: "duplicate", label: "중복 문서 확인", onSelect: () => openUploadRequirement() }]
      : []

  const handlePdfReviewComplete = () => {
    if (isDealBlocked) return
    if (dealReviewDocument && selectedDocument.dealDocumentId === dealReviewDocument.id) {
      try {
        prototypeBackend.dealDocuments.completeReview(dealReviewDocument)
        toast.success("원문 검토를 완료했습니다.")
        onOpenDeal(dealReviewDocument.dealId!)
      } catch (error) { toast.error(error instanceof Error ? error.message : "검토 상태를 저장하지 못했습니다.") }
      return
    }
    guide?.record({ type: "reviewed", documentId: selectedDocument.name, receipt: crypto.randomUUID() })
    setUploadDocuments((current) =>
      current.map((document, index) =>
        index === selectedIndex
          ? {
              ...document,
              pdfReviewCompleted: true,
              status: document.dealLabel ? "거래 연결 완료" : "거래 연결 필요",
              tone: document.dealLabel ? "success" : "warning",
            }
          : document
      )
    )
    setStep("deal")
    onDocumentOpen?.(selectedDocument.name, "deal")
    setMobilePane("fields")
    toast.success("연결할 거래를 선택해 주세요.")
  }
  const handleDealLink = async (dealId: string, dealLabel: string, bankCash?: Omit<BankCashInput, "sourceDocumentId" | "idempotencyKey">, evidence?: string[]) => {
    if (!tradeSeatAssigned || linkingDocument || isDealBlocked) return false
    const documentName = selectedDocument.name
    setLinkingDocument(true)
    try {
      const result = await prototypeBackend.tradeDocuments.confirmTransition({
        id: documentName, dealId, dealLabel, evidence, documentType: selectedDocument.documentType,
        expectedRevision: readDocumentReview(documentName).revision,
        idempotencyKey: crypto.randomUUID(),
      })
      if (!result.ok) { toast.error(result.error); return false }
      onDocumentDealLinked(documentName, { dealId, dealLabel })
      guide?.record({ type: "linked", documentId: documentName, dealId, receipt: crypto.randomUUID() })
      setUploadDocuments((current) => current.map((document) => document.name === documentName
        ? { ...document, dealLabel, stage: "confirmed", status: "거래 연결 완료", tone: "success" }
        : document))
      if (bankCash) {
        const payment = await prototypeBackend.tradeDocuments.recordBankCash({ ...bankCash,
          sourceDocumentId: documentName, idempotencyKey: crypto.randomUUID() })
        if (!payment.ok) {
          toast.error(`문서는 확정되었습니다. 현금 기록 실패: ${payment.error} 정산에서 이어서 처리해 주세요.`, { duration: 10000 })
        } else {
          toast.success("문서 확정과 현금 기록을 완료했습니다.")
        }
      } else {
        const isBankStatement = selectedDocument.documentType === "BANK_STATEMENT"
        toast.success(isBankStatement
          ? "서류만 연결했습니다. 현금은 정산에서 기록해 주세요." : "거래 연결을 완료했습니다.",
          isBankStatement ? undefined : { action: { label: "되돌리기", onClick: () => appLocation.assign(`/erp/documents/upload/${encodeURIComponent(documentName)}/connect?undo=1`) } })
      }
      if (["FREIGHT_INVOICE", "CUSTOMS_DECLARATION", "CUSTOMS_ENTRY"].includes(selectedDocument.documentType)) {
        setPendingCostDealId(dealId)
      } else {
        onOpenDeal(dealId)
      }
      return true
    } finally {
      setLinkingDocument(false)
    }
  }
  const handleConnectionChanged = (connection: DocumentConnection) => {
    onDocumentDealLinked(selectedDocument.name, connection.link)
    setUploadDocuments(current => current.map(document => document.name === selectedDocument.name
      ? { ...document, dealLabel: connection.link?.dealLabel, stage: connection.link ? "confirmed" : "field", status: connection.link ? "거래 연결 완료" : "거래 연결 필요", tone: connection.link ? "success" : "warning", pdfReviewCompleted: true }
      : document))
  }
  const handleDraftDownload = async () => {
    if (!pdfReviewCompleted || downloadingDraft) return
    setDownloadingDraft(true)
    try {
      await downloadRenderedDocumentPdf(selectedDocument.name)
    } finally {
      setDownloadingDraft(false)
    }
  }
  const openUploadDocument = (index: number) => {
    autoSaveVersionRef.current += 1
    autoSavePendingRef.current = false
    setAutoSaving(false)
    setAutoSavePending(false)
    setAutoSaveError(false)
    const document = uploadDocuments[index]
    const resumeDealStep =
      document?.pdfReviewCompleted === true && document.stage !== "confirmed"
    const nextStep = resumeDealStep ? "deal" : "compare"
    setSelectedIndex(index)
    setStep(nextStep)
    setMobilePane("fields")
    onDocumentOpen?.(document?.name ?? null, nextStep)
  }
  const handleAutoSave = async (
    phase: "pending" | "commit" | "retry" = "commit"
  ) => {
    if (phase === "pending") {
      autoSaveVersionRef.current += 1
      autoSavePendingRef.current = true
      setAutoSaveError(false)
      setAutoSavePending(true)
      return
    }
    if (phase === "commit" && !autoSavePendingRef.current) return
    autoSavePendingRef.current = false
    const version = ++autoSaveVersionRef.current
    setAutoSavePending(false)
    setAutoSaveError(false)
    setAutoSaving(true)
    const savingDocument = selectedDocumentRef.current
    const [result] = await Promise.all([
      prototypeBackend.tradeDocuments.saveFields({
        id: dealReviewDocument && savingDocument.dealDocumentId === dealReviewDocument.id
          ? `${dealReviewDocument.id}:${dealReviewDocument.revision}` : savingDocument.name,
        fields: Object.fromEntries(resolvedReviewFields(savingDocument).map((field) => [field.key, { value: field.value, unit: field.unit, userEdited: field.userEdited ?? false }])) ,
      }),
      new Promise<void>((resolve) => window.setTimeout(resolve, 800)),
    ])
    if (version !== autoSaveVersionRef.current || savingDocument.name !== selectedDocumentRef.current.name) return
    if (!result.ok) {
      setAutoSaving(false)
      setAutoSaveError(true)
      toast.error(result.error)
      return
    }
    setAutoSaving(false)
    setLastAutoSavedAt(new Date())
  }
  const cancelUpload = () => {
    if (uploadTimerRef.current) window.clearInterval(uploadTimerRef.current)
    uploadTimerRef.current = null
    const completedCount = activeUploadCompletedRef.current
    const canceledNames = new Set(
      activeUploadDocumentNamesRef.current.slice(completedCount)
    )
    const uploadOrigin = uploadOriginRef.current
    setUploadDocuments((current) => {
      const remainingDocuments = current.filter(
        (document) => !canceledNames.has(document.name)
      )
      const previousSelectionIndex = remainingDocuments.findIndex(
        (document) => document.name === uploadOrigin.selectedDocumentName
      )
      setSelectedIndex(
        completedCount > 0
          ? 0
          : previousSelectionIndex >= 0
            ? previousSelectionIndex
            : 0
      )
      return remainingDocuments
    })
    setHasFile(completedCount > 0 ? true : uploadOrigin.hasFile)
    setUploadProgress(null)
    activeUploadDocumentNamesRef.current = []
    activeUploadCompletedRef.current = 0
    setUploadNotice(
      completedCount > 0
        ? `${completedCount}개 파일만 추가하고 나머지 업로드를 취소했습니다.`
        : "파일 업로드를 취소했습니다."
    )
    toast.info("파일 업로드를 취소했습니다.")
  }
  const handleFilesSelected = async (files: File[]) => {
    setUploadNotice("")
    if (files.length === 0) return
    if (uploadTimerRef.current || uploadPreparingRef.current) {
      setUploadNotice("진행 중인 업로드가 끝난 뒤 파일을 추가해 주세요.")
      return
    }
    if (files.length > TRADE_DOCUMENT_MAX_UPLOAD_FILES) {
      setUploadNotice(
        `한 번에 최대 ${TRADE_DOCUMENT_MAX_UPLOAD_FILES}개까지 업로드할 수 있습니다.`
      )
      return
    }

    const oversized = files.filter(
      (file) => file.size > TRADE_DOCUMENT_MAX_UPLOAD_BYTES
    )
    const unsupported = files.filter(
      (file) => !file.name.toLowerCase().endsWith(".pdf")
    )
    const existingNames = new Set(
      uploadDocuments.map((document) => document.name.toLowerCase())
    )
    const duplicates = files.filter((file) =>
      existingNames.has(file.name.toLowerCase())
    )
    const firstDuplicate = duplicates[0]
    if (firstDuplicate) {
      setFileTrayOpen(true)
      const existingDocument = uploadDocuments.find(
        (document) =>
          document.name.toLowerCase() === firstDuplicate.name.toLowerCase()
      )
      setDuplicateUploadNotice({
        fileName: existingDocument?.name ?? firstDuplicate.name,
        dealLabel: existingDocument?.dealLabel,
      })
    } else {
      setDuplicateUploadNotice(null)
    }
    const batchNames = new Set(existingNames)
    const contentHashes = new Map(uploadDocuments.filter((document) => document.contentHash).map((document) => [document.contentHash, document]))
    const hashesByName = new Map<string, string>()
    const validFiles: File[] = []
    uploadPreparingRef.current = true
    try {
      for (const file of files) {
        const name = file.name.toLowerCase()
        if (file.size === 0 || file.size > TRADE_DOCUMENT_MAX_UPLOAD_BYTES || !name.endsWith(".pdf") || batchNames.has(name)) continue
        const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer())
        const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
        const duplicate = contentHashes.get(hash)
        if (duplicate || Array.from(hashesByName.values()).includes(hash)) {
          setFileTrayOpen(true)
          setDuplicateUploadNotice({ fileName: duplicate?.name ?? validFiles.find((item) => hashesByName.get(item.name) === hash)?.name ?? file.name, dealLabel: duplicate?.dealLabel, kind: "content" })
          continue
        }
        batchNames.add(name)
        hashesByName.set(file.name, hash)
        validFiles.push(file)
      }
    } catch {
      setUploadNotice("파일을 읽지 못했습니다. 파일을 다시 선택해 주세요.")
      return
    } finally {
      uploadPreparingRef.current = false
    }
    const excludedCount = files.length - validFiles.length

    if (validFiles.length === 0) {
      const reasons = [
        unsupported.length > 0 ? `PDF 아님 ${unsupported.length}개` : "",
        oversized.length > 0
          ? `${TRADE_DOCUMENT_MAX_UPLOAD_MB}MB 초과 ${oversized.length}개`
          : "",
        duplicates.length > 0 ? `기존 문서 ${duplicates.length}개` : "",
      ].filter(Boolean)
      if (duplicates.length !== files.length) {
        setUploadNotice(
          `추가할 수 있는 파일이 없습니다. ${reasons.join(" · ")}`
        )
      }
      return
    }

    const pendingDocuments: RecentDocument[] = validFiles.map((file) => ({
      name: file.name,
      uploadedAt: new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
        .format(new Date())
        .replace(/\. /g, ".")
        .replace(/\.$/, ""),
      status: "분석 중...",
      tone: "neutral",
      stage: "queued",
      documentType: inferUploadDocumentType(file.name),
      contentHash: hashesByName.get(file.name),
      retryCount: 0,
    }))
    uploadOriginRef.current = {
      hasFile,
      selectedDocumentName: selectedDocument?.name ?? null,
    }
    activeUploadDocumentNamesRef.current = pendingDocuments.map(
      (document) => document.name
    )
    activeUploadCompletedRef.current = 0
    guide?.record({ type: "upload-started", documentId: pendingDocuments[0].name })
    setUploadDocuments((current) => [...pendingDocuments, ...current])
    setHasFile(true)
    setSelectedIndex(0)
    onDocumentOpen?.(pendingDocuments[0]?.name ?? null, "compare")
    setStep("compare")
    setUploadProgress({ completed: 0, total: validFiles.length })
    if (excludedCount > 0) {
      setUploadNotice(
        `유효한 ${validFiles.length}개만 업로드합니다. 제외: 형식 ${unsupported.length}개 · 용량 ${oversized.length}개 · 중복 ${duplicates.length}개`
      )
    }

    let completed = 0
    let failedCount = 0
    if (uploadTimerRef.current) window.clearInterval(uploadTimerRef.current)
    uploadTimerRef.current = window.setInterval(() => {
      const currentFile = validFiles[completed]
      if (!currentFile) return
      const failed = /encrypted|password|fail/i.test(currentFile.name)
      if (!failed) guide?.record({ type: "document-created", documentId: currentFile.name, receipt: crypto.randomUUID() })
      guide?.record({ type: "extraction", documentId: currentFile.name, stage: failed ? "failed" : "ready" })
      if (failed) failedCount += 1
      setUploadDocuments((current) =>
        current.map((document) =>
          document.name === currentFile.name
            ? {
                ...document,
                status: failed
                  ? "처리 실패"
                  : document.documentType === "UNK"
                    ? "유형 확인 필요"
                    : "검토 대기",
                tone: failed ? "danger" : "warning",
                stage: failed ? "failed" : "field",
              }
            : document
        )
      )
      completed += 1
      activeUploadCompletedRef.current = completed
      setUploadProgress({ completed, total: validFiles.length })
      if (completed >= validFiles.length) {
        if (uploadTimerRef.current) window.clearInterval(uploadTimerRef.current)
        uploadTimerRef.current = null
        const completedNames = activeUploadDocumentNamesRef.current
        window.setTimeout(() => {
          if (activeUploadDocumentNamesRef.current !== completedNames) return
          setUploadProgress(null)
          activeUploadDocumentNamesRef.current = []
          activeUploadCompletedRef.current = 0
        }, 450)
        setUploadNotice(
          failedCount > 0
            ? `${failedCount}개 파일을 처리하지 못했습니다. 목록에서 다시 추출할 수 있습니다.`
            : excludedCount > 0
              ? `${validFiles.length}개를 추가하고 ${excludedCount}개를 제외했습니다.`
              : `${validFiles.length}개 파일을 추가했습니다.`
        )
        if (failedCount === 0) {
          toast.success(`${validFiles.length}개 파일을 추가했습니다.`)
        }
      }
    }, 650)
  }
  const retryDocument = async (index: number) => {
    const document = uploadDocuments[index]
    if (!document || document.stage !== "failed" || (document.retryCount ?? 0) >= 3) return
    const name = document.name
    setUploadDocuments((current) => current.map((item) => item.name === name
      ? { ...item, retryCount: (item.retryCount ?? 0) + 1, stage: "ocr", status: "분석 중...", tone: "blue" } : item))
    const result = await prototypeBackend.tradeDocuments.retry({ id: name })
    const failed = !result.ok || /encrypted|password|fail/i.test(name)
    setUploadDocuments((current) => current.map((item) => item.name === name
      ? { ...item, stage: failed ? "failed" : "field", status: failed ? "처리 실패 · 파일 확인 필요" : "검토 대기", tone: failed ? "danger" : "warning" } : item))
    if (!failed) guide?.record({ type: "document-created", documentId: name, receipt: crypto.randomUUID() })
    guide?.record({ type: "extraction", documentId: name, stage: failed ? "failed" : "ready" })
    if (failed) toast.error("재추출하지 못했습니다. 잠금 해제 또는 원본 파일 확인 후 다시 올려 주세요.")
  }
  useEffect(
    () => () => {
      if (uploadTimerRef.current) window.clearInterval(uploadTimerRef.current)
    },
    []
  )
  useEffect(() => {
    if (!uploadNotice) return
    const noticeTimer = window.setTimeout(() => setUploadNotice(""), 4000)
    return () => window.clearTimeout(noticeTimer)
  }, [uploadNotice])
  const handleDeleteDocument = (index: number) => {
    const deletedName = uploadDocuments[index]?.name
    const nextDocuments = uploadDocuments.filter(
      (_, currentIndex) => currentIndex !== index
    )
    if (hasFile && index === selectedIndex) {
      onDocumentOpen?.(
        nextDocuments[Math.min(selectedIndex, nextDocuments.length - 1)]
          ?.name ?? null,
        "compare"
      )
    }
    setUploadDocuments((current) => {
      const next = current.filter((_, currentIndex) => currentIndex !== index)
      if (next.length === 0) {
        setHasFile(false)
        setSelectedIndex(0)
        return next
      }
      setSelectedIndex((currentIndex) => {
        if (index < currentIndex) return currentIndex - 1
        if (index === currentIndex)
          return Math.min(currentIndex, next.length - 1)
        return currentIndex
      })
      return next
    })
    if (deletedName) toast.success(`${deletedName} 파일을 삭제했습니다.`)
  }
  const handleDocumentTypeChange = (documentType: UploadDocumentType) => {
    setUploadDocuments((current) =>
      current.map((document, index) =>
        index === selectedIndex
          ? {
              ...document,
              documentType,
              reviewedFields: {},
              sourcePages: undefined,
              stage: "field",
              status: "검토 대기",
              tone: "warning",
              pdfReviewCompleted: false,
            }
          : document
      )
    )
  }

  if (dealReviewRequested && !dealReviewDocument) return (
    <div className="p-6" role="alert"><h1 className="text-lg font-semibold">검토할 거래 서류를 찾을 수 없습니다.</h1><p className="mt-2 text-sm text-muted-foreground">서류의 거래 연결과 접근 권한을 확인한 뒤 다시 열어 주세요.</p><Button className="mt-4" variant="outline" onClick={() => onDocumentOpen?.(null)}>문서 목록으로</Button></div>
  )
  if (!hasFile) {
    return (
      <div className="h-full min-h-0 bg-transparent">
        {guide?.state && !guide.state.anchor && (!guide.state.access || guide.state.access === "active") && <div className="px-4 pt-5 sm:px-5 sm:pt-6"><Alert variant="gray" className="flex flex-wrap items-center gap-3"><Info className="size-4 shrink-0" /><AlertDescription className="flex-1">준비된 문서가 없다면 예시 발주서로 시작할 수 있습니다.</AlertDescription><Button variant="outline" size="sm" onClick={async () => {
          const { jsPDF } = await import("jspdf")
          const pdf = new jsPDF()
          pdf.text(["PURCHASE ORDER", "PO-2026-001", "Buyer: Hanbit Trading", "Aluminium scrap / 20 MT / USD 1,850 per MT", "Total: USD 37,000", "Delivery: 2026-11-01"], 20, 25)
          await handleFilesSelected([new File([pdf.output("blob")], "PO_시작가이드_예시.pdf", { type: "application/pdf" })])
        }}>예시 PDF 사용</Button></Alert></div>}
        <BeforeUploadState
          documents={uploadDocuments.map((document, index) => ({ document, index }))}
          onOpenDocument={(index) => {
            openUploadDocument(index)
            setHasFile(true)
          }}
          onDeleteDocument={handleDeleteDocument}
          onFilesSelected={handleFilesSelected}
          uploadNotice={uploadNotice}
          duplicateUploadNotice={duplicateUploadNotice}
          onDismissDuplicateUpload={() => setDuplicateUploadNotice(null)}
        />
      </div>
    )
  }

  return (
    <div data-guide-target={step === "deal" ? "connect" : undefined} tabIndex={-1} className="flex h-[calc(100svh-var(--header-height))] min-h-0 flex-col overflow-hidden bg-transparent">
      <Dialog open={Boolean(pendingCostDealId)} onOpenChange={open => { if (!open && pendingCostDealId) { onOpenDeal(pendingCostDealId); setPendingCostDealId(null) } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>비용 등록</DialogTitle><DialogDescription>운임·통관 서류를 연결했습니다. 이 거래의 비용을 등록하시겠습니까?</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { if (pendingCostDealId) onOpenDeal(pendingCostDealId); setPendingCostDealId(null) }}>나중에</Button>
            <Button onClick={() => { if (pendingCostDealId) onOpenDeal(pendingCostDealId, "finance"); setPendingCostDealId(null) }}>비용 등록하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 문서 올리기 V2 항목 검토 (6233:81734): the step header is a HeroBanner card;
          primary actions turn white on the blue fill. */}
      <div className="mx-3 mt-1.5 flex min-h-[72px] shrink-0 flex-wrap items-center justify-end gap-2 rounded-[22px] bg-[linear-gradient(120deg,#1d4ed8_0%,#2563eb_52%,#3b82f6_100%)] px-5 py-3 text-white sm:mx-4 sm:px-[30px] [&_[data-slot=button][data-variant=default]]:bg-white [&_[data-slot=button][data-variant=default]]:text-[var(--primary)] [&_[data-slot=popover-trigger][data-variant=outline]]:bg-[var(--color-red-8)]">
        <div className="mr-auto min-w-0">
          <h1 className="text-xl font-bold">문서 올리기</h1>
          {(dealReviewDocument?.dealId || originDealId) && <a href={`/erp/deals/${dealReviewDocument?.dealId ?? originDealId}`} className="text-xs text-white/85 underline">{dealReviewDocument?.dealId ?? originDealId} 거래로 돌아가기</a>}
        </div>
        <DocumentBlockingAlerts errors={uploadErrors} checks={uploadChecks} />
        <AutoSaveStatus
          className="hidden text-white/90 lg:flex"
          state={
            autoSaveError
              ? "error"
              : autoSaving
                ? "saving"
                : autoSavePending
                  ? "pending"
                  : "saved"
          }
          savedAt={lastAutoSavedAt}
        />
        {autoSaveError ? (
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => void handleAutoSave("retry")}
          >
            다시 저장
          </Button>
        ) : null}
        {selectedDocument.stage === "failed" ? (
          <Button
            size="sm"
            variant="outline"
            disabled={(selectedDocument.retryCount ?? 0) >= 3}
            onClick={() => void retryDocument(selectedIndex)}
          >
            <RefreshCw data-icon="inline-start" /> {(selectedDocument.retryCount ?? 0) >= 3 ? "재추출 한도 도달" : "다시 추출"}
          </Button>
        ) : selectedDocument.stage === "ocr" ||
          selectedDocument.stage === "queued" ? (
          <Button size="sm" disabled>
            <LoaderCircle className="animate-spin" data-icon="inline-start" />
            처리 중
          </Button>
        ) : selectedDocument.stage === "excluded" ? (
          <Button size="sm" variant="outline" disabled>
            처리 제외
          </Button>
        ) : selectedDocument.stage === "duplicate" ? (
          <Button size="sm" variant="outline" disabled>
            중복 확인 필요
          </Button>
        ) : step === "compare" ? (
          <Button
            data-guide-target="review"
            size="sm"
            disabled={isDealBlocked}
            title={
              isDealBlocked
                ? isTypeUnresolved
                  ? "문서 유형을 먼저 선택해야 합니다."
                  : uploadFieldErrors[0]?.label ?? "문서 처리와 변경사항 저장을 완료해 주세요."
                : undefined
            }
            onClick={() => {
              handlePdfReviewComplete()
            }}
          >
            {dealReviewDocument && selectedDocument.dealDocumentId === dealReviewDocument.id ? "검토 완료 · 거래로 돌아가기" : "거래 연결"}
            <ChevronRight data-icon="inline-end" />
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setStep("compare")
                onDocumentOpen?.(selectedDocument.name, "compare")
                setMobilePane("fields")
              }}
            >
              <ChevronLeft data-icon="inline-start" /> 항목 검토
            </Button>
            <span ref={setDealActionTarget} className="contents" />
          </>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 sm:p-4">
        <HorizontalDocumentTray
          documents={pendingUploadDocuments.map(({ document }) => document)}
          selectedIndex={pendingSelectedIndex}
          currentDocument={selectedDocument}
          onSelect={(index) => {
            const sourceIndex = pendingUploadDocuments[index]?.index
            if (sourceIndex === undefined) return
            openUploadDocument(sourceIndex)
            setFileTrayOpen(false)
          }}
          onDelete={(index) => {
            const sourceIndex = pendingUploadDocuments[index]?.index
            if (sourceIndex === undefined) return
            handleDeleteDocument(sourceIndex)
          }}
          onFilesSelected={handleFilesSelected}
          uploadProgress={uploadProgress}
          uploadNotice={uploadNotice}
          duplicateUploadNotice={duplicateUploadNotice}
          onDismissDuplicateUpload={() => setDuplicateUploadNotice(null)}
          onCancelUpload={cancelUpload}
          expanded={fileTrayOpen}
          onExpandedChange={setFileTrayOpen}
        />

        <PdfPanelWorkspaceCard>
          <DocumentReviewWorkspace
            document={selectedDocument}
            originDealId={originDealId}
            step={step}
            onAutoSave={handleAutoSave}
            dealBlocked={isDealBlocked}
            pdfReviewCompleted={pdfReviewCompleted}
            linkedDealLabel={linkedDealLabel}
            linkingDocument={linkingDocument}
            tradeSeatAssigned={tradeSeatAssigned}
            downloadingDraft={downloadingDraft}
            dealActionTarget={dealActionTarget}
            onLinkDeal={handleDealLink}
            onConnectionChanged={handleConnectionChanged}
            onDownloadDraft={handleDraftDownload}
            onPdfReviewComplete={handlePdfReviewComplete}
            onReviewedFieldChange={handleReviewedFieldChange}
            onDocumentTypeChange={handleDocumentTypeChange}
            mobilePane={mobilePane}
            onMobilePaneChange={setMobilePane}
          />
        </PdfPanelWorkspaceCard>
      </div>
    </div>
  )
}

function PendingUploadDocumentsTable({
  documents,
  onOpenDocument,
  onDeleteDocument,
}: {
  documents: ReadonlyArray<{ document: RecentDocument; index: number }>
  onOpenDocument: (index: number) => void
  onDeleteDocument: (index: number) => void
}) {
  const [statusFilter, setStatusFilter] = useState<DocumentTrayFilter>("all")
  const [typeFilter, setTypeFilter] = useState<UploadDocumentType | "all">(
    "all"
  )
  const [sort, setSort] = useState<DocumentQueueSort>("recent")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [deleteTarget, setDeleteTarget] = useState<{
    index: number
    name: string
  } | null>(null)
  const availableDocumentTypes = Array.from(
    new Set(documents.map(({ document }) => document.documentType))
  )
  const filteredDocuments = documents
    .filter(
      ({ document }) =>
        matchesDocumentQueueStatus(document, statusFilter) &&
        (typeFilter === "all" || document.documentType === typeFilter)
    )
    .toSorted(({ document: left }, { document: right }) =>
      sort === "recent"
        ? right.uploadedAt.localeCompare(left.uploadedAt)
        : left.uploadedAt.localeCompare(right.uploadedAt)
    )
  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleDocuments = filteredDocuments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  const actionLabel = (stage: DocumentStageKey) => {
    if (stage === "failed") return "오류 확인"
    if (stage === "excluded") return "사유 확인"
    if (stage === "ocr" || stage === "queued") return "처리 보기"
    return "확인하기"
  }

  if (documents.length === 0) return null

  return (
    <section aria-labelledby="pending-upload-title">
      <Card size="sm">
        <CardHeader>
          <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="lg:shrink-0">
              <div className="flex items-center gap-2">
                <h2
                  id="pending-upload-title"
                  className="text-[18px] leading-[26px] font-bold"
                >
                  업로드 문서
                </h2>
              </div>
              <p className="mt-1 text-sm text-[var(--color-gray-5)]">
                업로드한 문서의 처리 상태를 확인하세요.
              </p>
            </div>
            <BusinessListToolbar
              aria-label="업로드 문서 필터"
              className="min-w-0 lg:flex-1 lg:[&_.business-filter-row]:justify-end"
            >
              <BusinessFilterField label="상태">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as DocumentTrayFilter)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-36" aria-label="상태 필터">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="processing">처리 중</SelectItem>
                    <SelectItem value="review">확인 필요</SelectItem>
                    <SelectItem value="failed">실패·제외</SelectItem>
                    <SelectItem value="confirmed">거래 연결 완료</SelectItem>
                  </SelectContent>
                </Select>
              </BusinessFilterField>
              <BusinessFilterField label="문서 유형">
                <Select
                  value={typeFilter}
                  onValueChange={(value) => {
                    setTypeFilter(value as UploadDocumentType | "all")
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-44" aria-label="문서 유형 필터">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="all">전체</SelectItem>
                    {availableDocumentTypes.map((documentType) => (
                      <SelectItem key={documentType} value={documentType}>
                        {uploadDocumentTypeLabel(documentType)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </BusinessFilterField>
              <BusinessFilterField label="정렬">
                <Select
                  value={sort}
                  onValueChange={(value) => {
                    setSort(value as DocumentQueueSort)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-44" aria-label="정렬">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="recent">최근 업로드 순</SelectItem>
                    <SelectItem value="oldest">오래된 업로드 순</SelectItem>
                  </SelectContent>
                </Select>
              </BusinessFilterField>
            </BusinessListToolbar>
          </div>
        </CardHeader>

        <CardContent data-layout="flush-table" className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[760px] table-fixed [&_td]:text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[28%] text-left!">
                    문서 유형
                  </TableHead>
                  <TableHead className="w-[26%] text-left!">파일</TableHead>
                  <TableHead className="w-[22%] text-left!">등록일자</TableHead>
                  <TableHead className="w-[14%] text-left!">상태</TableHead>
                  <TableHead className="w-[10%] text-right!">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleDocuments.map(({ document, index }) => (
                  <TableRow
                    key={`${document.name}-${index}`}
                    data-clickable="true"
                    tabIndex={0}
                    className="group cursor-pointer outline-none focus-visible:[box-shadow:var(--shadow-keyboard-focus)]"
                    onClick={() => onOpenDocument(index)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        onOpenDocument(index)
                      }
                    }}
                  >
                    <TableCell className="h-auto py-3 text-left! whitespace-normal">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <UploadDocumentTypeMark
                          documentType={document.documentType}
                        />
                        <span className="flex min-w-0 items-center gap-1.5 truncate">
                          {uploadDocumentTypeLabel(document.documentType)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="truncate text-left!">
                      {document.name}
                    </TableCell>
                    <TableCell className="truncate text-left! text-[var(--surface-muted-foreground)]">
                      {document.uploadedAt}
                    </TableCell>
                    <TableCell className="text-left!">
                      <ToneBadge tone={document.tone}>
                        {document.status}
                      </ToneBadge>
                    </TableCell>
                    <TableCell className="text-right!">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation()
                            onOpenDocument(index)
                          }}
                        >
                          {actionLabel(document.stage)}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              className="[--button-ghost-foreground:var(--color-gray-4)]"
                              aria-label={`${document.name} 메뉴`}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() =>
                                setDeleteTarget({
                                  index,
                                  name: document.name,
                                })
                              }
                            >
                              <Trash2 />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center! text-xs text-[var(--surface-muted-foreground)]"
                    >
                      검색 조건에 맞는 문서가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            page={currentPage}
            pageSize={pageSize}
            total={filteredDocuments.length}
            pageSizeOptions={[10, 20, 50]}
            aria-label="검토·배정 대기 문서 페이지 이동"
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize)
              setPage(1)
            }}
          />
        </CardContent>
      </Card>
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>문서를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name} 파일과 추출 결과가 대기 목록에서 삭제됩니다.
              삭제한 문서는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTarget) onDeleteDocument(deleteTarget.index)
                setDeleteTarget(null)
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

function BeforeUploadState({
  documents,
  onOpenDocument,
  onDeleteDocument,
  onFilesSelected,
  uploadNotice,
  duplicateUploadNotice,
  onDismissDuplicateUpload,
}: {
  documents: ReadonlyArray<{ document: RecentDocument; index: number }>
  onOpenDocument: (index: number) => void
  onDeleteDocument: (index: number) => void
  onFilesSelected: (files: File[]) => void
  uploadNotice: string
  duplicateUploadNotice: DuplicateUploadNotice | null
  onDismissDuplicateUpload: () => void
}) {
  const fileDropZoneRef = useRef<FileDropZoneRef | null>(null)
  const folderInputRef = useRef<HTMLInputElement | null>(null)
  const [mailOpen, setMailOpen] = useState(false)

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-transparent">
      <div className="w-full px-4 py-5 sm:px-5 sm:py-6">
        {/* 문서 올리기 V2 (6325:101775): left-aligned hero with the upload card
            overlapping its lower edge; the step list sits in the card's top row. */}
        <BusinessPageHero
          eyebrow="AI 파일 올리기"
          title="문서 올리기"
          description="PDF를 올려 내용을 검토한 뒤, 거래를 선택하고 반영할 내용을 확인하세요."
          summary={
        <div className="mx-auto w-full max-w-5xl">
          <Card className="w-full bg-[var(--color-gray-12)]! shadow-[var(--shadow-modal)]" size="sm">
            <CardContent className="p-4 sm:p-5">
              <div className="mb-3 grid gap-2">
                <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
                  <ol
                    aria-label="문서 처리 순서"
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 py-1 text-sm text-[var(--color-gray-6)]"
                  >
                    {["파일 올리기", "추출값 검토", "거래 연결·확정"].map(
                      (title, index) => (
                        <li key={title} className="flex items-center gap-2">
                          {index > 0 && (
                            <ChevronRight
                              className="mr-1 size-4 text-[var(--color-gray-4)]"
                              aria-hidden="true"
                            />
                          )}
                          <span
                            className={cn(
                              "flex size-[22px] shrink-0 items-center justify-center rounded-full text-xs font-bold",
                              index === 0
                                ? "bg-[var(--color-primary-4)] text-white"
                                : "bg-[var(--color-gray-10)] text-[var(--color-gray-6)]"
                            )}
                          >
                            {index + 1}
                          </span>
                          <span
                            className={cn(
                              index === 0 &&
                                "font-semibold text-[var(--color-gray-2)]"
                            )}
                          >
                            {title}
                          </span>
                        </li>
                      )
                    )}
                  </ol>
                  <div className="min-w-60 flex-1">
                    <AiDocumentProcessingNotice />
                  </div>
                </div>
                {duplicateUploadNotice ? (
                  <DuplicateUploadAlert
                    notice={duplicateUploadNotice}
                    onDismiss={onDismissDuplicateUpload}
                  />
                ) : null}
              </div>
              <FileDropZone
                ref={fileDropZoneRef}
                accept="application/pdf,.pdf"
                multiple
                aria-label="PDF 파일 선택 또는 끌어놓기"
                label="파일을 끌어다 놓으세요"
                instructions={`PDF 최대 ${TRADE_DOCUMENT_MAX_UPLOAD_FILES}개, 파일당 ${TRADE_DOCUMENT_MAX_UPLOAD_MB}MB`}
                clickToSelect
                onFiles={onFilesSelected}
                // 문서 올리기 V2 (6273:100113): Blue 10 drop area, stacked and centered.
                className="min-h-[112px] flex-col gap-2 border-[var(--color-primary-6)] bg-[var(--color-primary-10)] px-4 text-center text-[var(--color-primary-4)]"
              >
                <Upload className="size-5" />
                <span>
                  <span className="block text-[15px] leading-[22px]">
                    파일을 끌어다 놓으세요
                  </span>
                  <span className="mt-1 block text-[13px] leading-[18px]">
                    PDF 최대 {TRADE_DOCUMENT_MAX_UPLOAD_FILES}개, 파일당
                    {` ${TRADE_DOCUMENT_MAX_UPLOAD_MB}MB`}
                  </span>
                </span>
              </FileDropZone>
              {mailOpen ? (
                <EmailForwardQueue
                  onClose={() => setMailOpen(false)}
                  onImportFiles={onFilesSelected}
                />
              ) : null}
              <input
                ref={(node) => {
                  folderInputRef.current = node
                  node?.setAttribute("webkitdirectory", "")
                  node?.setAttribute("directory", "")
                }}
                type="file"
                accept="application/pdf,.pdf"
                multiple
                hidden
                onChange={(event) => {
                  if (event.target.files) {
                    onFilesSelected(Array.from(event.target.files))
                  }
                  event.target.value = ""
                }}
              />
              {uploadNotice ? (
                <Alert className="mt-3" variant="default">
                  <AlertDescription className="text-xs">
                    {uploadNotice}
                  </AlertDescription>
                </Alert>
              ) : null}
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMailOpen(true)}
                >
                  <Mail data-icon="inline-start" /> 이메일에서 찾기
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => folderInputRef.current?.click()}
                >
                  <FileText data-icon="inline-start" /> 폴더 선택
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileDropZoneRef.current?.open()}
                >
                  <Upload data-icon="inline-start" /> 파일 선택
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
          }
        />
      </div>
      <div className="w-full px-4 pb-10 sm:px-5">
        <div>
          <PendingUploadDocumentsTable
            documents={documents}
            onOpenDocument={onOpenDocument}
            onDeleteDocument={onDeleteDocument}
          />
        </div>
      </div>
    </div>
  )
}

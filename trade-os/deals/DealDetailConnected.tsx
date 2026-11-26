import { Checkbox } from "@/components/ui/checkbox"
import { packingItemIssue, type PackingItem } from "@trade-os/lib/packingItems"
import { dealShipmentDocuments } from "./firstShipmentDocuments"
import { multiplyDecimal, readTotalRounding, roundedDealTotal, totalRoundingLabels, useAmountRoundings, writeTotalRounding, type TotalRounding } from "./dealTotalRounding"
import { LinkedDeals } from "./LinkedDeals"
import type { UploadOriginDeal } from "@trade-os/lib/uploadOriginDeal"
import { initialDocumentFields } from "@trade-os/lib/dealDocumentFields"
import { DealDocumentComparisonDialog } from "@trade-os/components/DealDocumentComparisonDialog"
import { formatDate, formatDateTime } from "@trade-os/lib/orgDate"
import { useLocaleTag } from "@trade-os/lib/i18n/useLocaleTag"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { DealRefreshContext, useDealRefresh, useDealRefreshController } from "@trade-os/deals/useDealRefresh"
import { PostWriteRefreshNotice } from "@trade-os/components/PostWriteRefreshNotice"
import { dealDocumentPreviews, importantDealDocuments as documents, supplementaryDealDocuments as supplementaryDocuments, listDealDocuments, type DealDocumentRecord } from "@trade-os/lib/dealDocumentActions"
import { DealDocumentActions } from "@trade-os/deals/DealDocumentActions"
import { InfoBox } from "@trade-os/components/InfoBox"
import { OperationsScreen } from "@trade-os/OperationsScreens"
import { splitShipmentReviewFixture } from "@trade-os/lib/demo/splitShipmentReviewFixture"
import { ConfirmDeleteButton, type CommercialInvoiceCard, type SplitShipmentView } from "@trade-os/shipments/ShipmentsConnected"
import { addDealManualInvoice, addDealManualPackingList, removeDealDocument, removeDealManualInvoice, removeDealManualPackingList, saveDealManualPackingList, setPackingInvoice, linkDealInvoiceToShipment, linkDealPackingListToShipment, unlinkDealDocumentFromShipment, resolveDealShipmentLink, resolveDealShipmentLinks, blNumbersMismatch, readDealInvoiceRelations, saveDealInvoiceField, type DealInvoiceRelationState } from "@trade-os/lib/dealDocumentRelations"
import { HostTable, HostTableBody, HostTableCell, HostTableHead, HostTableHeader, HostTableRow } from "@trade-os/components/HostTable"
import type { Shipment } from "@trade-os/lib/api/shipments"
import { FormField, FormFieldHeader, FormFieldMessage, SimpleFormField } from "@/components/platform/FormItem"
import {
  documentStageGuidance,
  documentStageRules,
  applyCustomsPreference,
  setCustomsSkipped,
  useSkippedCustoms,
  getDealWorkPlan,
  readStartedWork,
  workIds,
  workLabels,
  type DealWorkKey,
  type DealWorkPlan,
} from "@trade-os/lib/dealWorkflow"
import { isFinanceDecimal } from "@trade-os/lib/financeDecimal"
import { normalizeSaleAmount, orderProgress, readDealSales, saleChangeEvent, writeDealSales, type DealSale } from "@trade-os/lib/dealFinanceWorkspace"
import { exactFinanceMoney } from "@trade-os/lib/erpFinance"
import { deals as dealFixtures } from "@trade-os/lib/prototypeDeals"
import { DealFinanceWorkspace } from "@trade-os/deals/DealFinanceWorkspace"
import {
  Fragment,
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { createPortal, flushSync } from "react-dom"
import { toast } from "sonner"
import {
  AlertTriangle,
  Archive,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ChevronLeft,
  CircleAlert,
  FilePlus2,
  FileSearch,
  FileText,
  GripVertical,
  Link2,
  Unlink,
  LoaderCircle,
  MoreHorizontal,
  MoreVertical,
  NotebookPen,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserRound,
  UsersRound,
  X,
} from "lucide-react"

import {
  PdfFloatingControls,
  PdfViewerToolbar,
} from "@/components/platform/PageNavigator"
import {
  PdfPanelWorkspaceCard,
  ResponsivePdfPanelSplit,
} from "@/components/platform/PdfPanelResizeHandle"
import { PannablePdfViewport } from "@/components/platform/DocumentViewerStage"
import { AutoSaveStatus } from "@/components/platform/AutoSaveStatus"
import {
  DocumentTemplateOptions,
  type DocumentTemplateOption,
} from "@trade-os/components/DocumentTemplateOptions"
import { NavigationIcon } from "@/components/platform/NavigationIcon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useIsCompactWorkspace } from "@/hooks/useIsMobile"
import { StatusBadge } from "@/components/platform/StatusBadge"
import { DocumentTypeBadge } from "@trade-os/components/DocumentTypeBadge"
import { DatePicker } from "@/components/ui/DatePicker"
import { prototypeBackend, type MutationResult } from "@trade-os/lib/prototypeBackend"
import {
  DealHandoffProvider,
  DealContractTool,
  DealPartyTool,
} from "@trade-os/deals/DealHandoffTools"
import type { NotificationDealTarget } from "@share/notifications/data"

type Role = "owner" | "admin" | "member"
type Tab =
  | "overview"
  | "verification"
  | "documents"
  | "fulfillment"
  | "customs"
  | "finance"
  | "people"
  | "records"
const dealSections: {
  value: Tab
  id: string
  label: string
  description: string
}[] = [
  {
    value: "overview",
    id: "deal-overview",
    label: "전체",
    description: "거래 현황과 다음에 확인할 업무",
  },
  {
    value: "verification",
    id: "deal-verification",
    label: "리스크·불일치",
    description: "문서 간 차이와 확인이 필요한 근거",
  },
  {
    value: "documents",
    id: "deal-documents",
    label: "상세",
    description: "거래 필드와 원문을 함께 대조합니다",
  },
  {
    value: "fulfillment",
    id: "deal-fulfillment",
    label: "선적",
    description: "계약 이행과 분할 선적 진행",
  },
  {
    value: "customs",
    id: "deal-customs",
    label: "통관",
    description: "통관 문서와 신고 정보 확인",
  },
  {
    value: "finance",
    id: "deal-finance",
    label: "정산",
    description: "통화별 손익, 원가와 청구 일정",
  },
  {
    value: "people",
    id: "deal-people",
    label: "관계자",
    description: "거래 당사자와 연결된 연락처",
  },
  {
    value: "records",
    id: "deal-records-main",
    label: "메모·이력",
    description: "공유 메모와 거래의 변경 기록",
  },
]
const dealStage = (dealId: string) =>
  dealFixtures.find((deal) => deal.id === dealId)?.stage ?? "contract"
const stageEntryTab = (stage: ReturnType<typeof dealStage>): Tab => {
  return stage === "settled" || stage === "settlement"
    ? "finance"
    : stage === "shipment" || stage === "customs"
      ? "fulfillment"
      : "overview"
}

type DealDirection = "sales" | "purchase" | "direction_pending"
type DealProfile = {
  title: string
  counterparty: string
  direction: DealDirection
  amount: string
  currency: string
}
export type GeneratedDealDocumentSummary = {
  number: string
  title: string
  type: string
  state: "draft" | "confirmed" | "link-created" | "shared"
}
type AuditItem = {
  id: number
  action: string
  detail: string
  actor: string
  time: string
}
// Deal-wide auto-save status, raised from the contract editor to the sticky
// deal header because every field and item on the page saves the same way.
type DealSaveStatus = { state: "saved" | "pending" | "saving" | "error"; savedAt: Date; showRetry: boolean }
type DealNoteItem = {
  id: number
  body: string
  actor: string
  time: string
}
type DialogKind = "issue" | "archive" | null
type OrderState = "open" | "closed" | "short_closed" | "cancelled"
type OrderAction =
  "close" | "short_close" | "cancel" | "reopen" | null

const canMutate = (role: Role) => role === "owner" || role === "admin"
const dealProfiles: Record<string, DealProfile> = {
  "DL-260708-01": {
    title: "7월 알루미늄 스크랩 수입",
    counterparty: "KATAMAN ASIA-PACIFIC PTE LTD",
    direction: "purchase",
    amount: "2,400,000",
    currency: "USD",
  },
  "DL-260707-04": {
    title: "ACME 7월 해상운송 계약",
    counterparty: "ACME GmbH",
    direction: "sales",
    amount: "380,000",
    currency: "USD",
  },
  "DL-260704-02": {
    title: "부산항 산업재 수입",
    counterparty: "Nordic Raw Materials AB",
    direction: "purchase",
    amount: "940,000",
    currency: "EUR",
  },
  "DL-260701-09": {
    title: "한빛 6월 정산 거래",
    counterparty: "Hanbit Trading Co.",
    direction: "sales",
    amount: "126,800,000",
    currency: "KRW",
  },
  "DL-260629-03": {
    title: "싱가포르 구리 스크랩 매입",
    counterparty: "Meridian Metals Pte Ltd",
    direction: "purchase",
    amount: "1,180,000",
    currency: "USD",
  },
  "DL-260625-07": {
    title: "일본 내륙운송 발주",
    counterparty: "Sakura Logistics KK",
    direction: "purchase",
    amount: "18,600,000",
    currency: "JPY",
  },
}
const directionLabels: Record<DealDirection, string> = {
  sales: "매출",
  purchase: "매입",
  direction_pending: "방향 미정",
}
const wait = (ms = 550) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms))

async function requireMutation(
  mutation: Promise<MutationResult>,
  successMessage: string
) {
  const result = await mutation
  if (!result.ok) throw new Error(result.error)
  toast.success(successMessage)
  return result
}

const detectDealDocumentCode = (fileName: string) => {
  const normalized = fileName.toLowerCase()
  const matchers: Array<[string, RegExp]> = [
    ["CUSTOMS_ENTRY", /(^|[\s_.-])(customs.entry|import.declaration|import.customs)([\s_.-]|$)/],
    ["CUSTOMS_EXPORT", /(^|[\s_.-])(customs.export|export.declaration|export.customs)([\s_.-]|$)/],
    ["BL", /(^|[\s_.-])(b\/l|bl|bill.of.lading)([\s_.-]|$)/],
    ["CI", /(^|[\s_.-])(ci|invoice|commercial.invoice)([\s_.-]|$)/],
    ["PL", /(^|[\s_.-])(pl|packing.list|packinglist)([\s_.-]|$)/],
    ["PO", /(^|[\s_.-])(po|purchase.order)([\s_.-]|$)/],
    ["SC", /(^|[\s_.-])(sc|sales.contract|contract)([\s_.-]|$)/],
    ["CO", /(^|[\s_.-])(co|certificate.of.origin)([\s_.-]|$)/],
    ["IC", /(^|[\s_.-])(ic|insurance)([\s_.-]|$)/],
    ["QC", /(^|[\s_.-])(qc|inspection)([\s_.-]|$)/],
  ]
  return matchers.find(([, pattern]) => pattern.test(normalized))?.[0] ?? null
}

type DocumentSlot = (typeof documents)[number] & { documentId?: string; erpDocumentId?: string; documentState?: DealDocumentRecord["state"]; revision?: number; fileDataUrl?: string; commercialInvoiceId?: string }
const documentKey = (document: DocumentSlot) => document.documentId ?? document.code
const documentSlot = (record: DealDocumentRecord): DocumentSlot => ({
  code: record.code, type: record.type, file: record.file, source: "업로드",
  status: record.state === "needs_type" ? "유형 확인 필요" : record.state === "needs_review" ? "검토" : record.state === "processing" ? "분석 중" : "보유",
  documentId: record.id, erpDocumentId: record.erpDocumentId, documentState: record.state,
  revision: record.revision, fileDataUrl: record.fileDataUrl,
})

const dealDeliveryAttachmentOptions = [
  ...documents,
  ...supplementaryDocuments,
].filter((document) => document.file.toLowerCase().endsWith(".pdf"))

function DealDocumentShelf({
  documents,
  uploadedDocuments,
  createdDocuments,
  selected,
  onSelect,
  onAddDocument,
}: {
  documents: DocumentSlot[]
  uploadedDocuments: DocumentSlot[]
  createdDocuments: DocumentSlot[]
  selected: DocumentSlot
  onSelect: (document: DocumentSlot) => void
  onAddDocument: () => void
}) {
  const reviewCount = documents.filter(
    (document) => document.status === "검토" || document.status === "유형 확인 필요"
  ).length
  const renderGroup = (title: string, helper: string, items: DocumentSlot[]) => (
    <section className="mt-3 first:mt-0">
      <div className="flex items-center gap-2 px-2 text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground">{title} {items.length}</span>
        <span>{helper}</span>
      </div>
      <div className="mt-1 divide-y divide-[var(--surface-border)]">
        {items.map((document) => {
          const isSelected = documentKey(selected) === documentKey(document)
          const needsReview = document.status === "검토" || document.status === "유형 확인 필요"
          return (
            <button
              key={documentKey(document)}
              type="button"
              className={cn(
                "flex min-h-9 w-full min-w-0 items-center gap-2 rounded-[var(--r-sm)] px-2 text-left transition-colors hover:bg-[var(--surface-muted-background)]",
                isSelected && "bg-[var(--control-selected-soft-background)]"
              )}
              aria-pressed={isSelected}
              onClick={() => onSelect(document)}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-[var(--r-xs)] bg-primary/10 text-[10px] font-semibold text-primary">
                {document.code}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs">{document.file}</span>
              {needsReview ? <span className="shrink-0 rounded-full bg-[var(--color-orange-6)] px-2 py-0.5 text-[10px] text-[var(--color-orange-1)]">확인 전</span> : null}
            </button>
          )
        })}
      </div>
    </section>
  )

  const viewer = (
    <PopoverContent align="start" side="bottom" sideOffset={8} className="w-[min(480px,calc(100vw-2rem))] gap-0 p-2">
      <div className="flex items-center justify-between gap-3 border-b px-2 py-2">
        <span className="text-sm font-semibold">이 거래의 서류 {documents.length}건 · 확인 전 {reviewCount}</span>
        <Button type="button" variant="outline" size="sm" onClick={onAddDocument}>
          <FilePlus2 data-icon="inline-start" />서류 추가
        </Button>
      </div>
      {renderGroup("올린 서류", "문서 올리기에서 업로드", uploadedDocuments)}
      {renderGroup("만든 서류", "문서 만들기에서 생성", createdDocuments)}
    </PopoverContent>
  )
  return viewer
}

type DealFieldMatch = "일치" | "확인 필요" | "누락" | "단일 출처"
type DealFieldGroup = "거래 기본" | "상업 조건" | "선적 정보" | "결제 정보"

const fieldGroups: DealFieldGroup[] = [
  "거래 기본",
  "상업 조건",
  "선적 정보",
  "결제 정보",
]
const fieldGroupIds: Record<DealFieldGroup, string> = {
  "거래 기본": "deal-fields-basic",
  "상업 조건": "deal-fields-terms",
  "선적 정보": "deal-fields-shipping",
  "결제 정보": "deal-fields-payment",
}
function readEarlyFieldGroups(dealId: string): DealFieldGroup[] {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(`ecoya:deal-early-fields:v1:${dealId}`) ?? "[]"
    )
    return Array.isArray(saved)
      ? fieldGroups.filter((group) => saved.includes(group))
      : []
  } catch {
    return []
  }
}
function DealProgressNavigation({
  metrics,
  plan,
  dealId,
  earlyGroups,
  shipment,
  role,
  onRestoreCustoms,
  onOpenGroup,
  onNavigate,
}: {
  metrics: ReactNode
  plan: DealWorkPlan
  dealId: string
  earlyGroups: DealFieldGroup[]
  shipment: DealShipmentSummary | null
  role: Role
  onRestoreCustoms: () => void
  onOpenGroup: (group: DealFieldGroup) => void
  onNavigate: (tab: Tab) => void
}) {
  const stages: {
    value: ReturnType<typeof dealStage>
    label: string
    tab: Tab
    groups: DealFieldGroup[]
  }[] = [
    {
      value: "contract",
      label: "계약",
      tab: "documents",
      groups: ["거래 기본", "상업 조건"],
    },
    {
      value: "shipment",
      label: "선적",
      tab: "fulfillment",
      groups: ["선적 정보"],
    },
    { value: "customs", label: "통관", tab: "customs", groups: [] },
    { value: "settled", label: "정산", tab: "finance", groups: ["결제 정보"] },
  ]
  const current = Math.max(
    0,
    stages.findIndex((item) => item.value === (dealStage(dealId) === "settlement" ? "settled" : dealStage(dealId)))
  )
  return (
    <div className="p-5">
      <section aria-label="거래 진행 상태">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold">정보·업무 진행</h3>
          <Badge variant="secondary" className="text-xs">
            {plan.current
              ? `${workLabels[plan.current]} 확인 필요`
              : "전체 완료"}
          </Badge>
        </div>
        <nav aria-label="거래 정보 바로가기" className="mt-4">
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline" size="sm"><a
              href="#deal-overview"
              onClick={(event) => {
                event.preventDefault()
                onNavigate("overview")
              }}

            >
              <FileSearch data-icon="inline-start" />거래 요약
            </a></Button>
            <Button asChild variant="outline" size="sm"><a
              href="#deal-documents"
              onClick={(event) => {
                event.preventDefault()
                onNavigate("documents")
              }}

            >
              <Search data-icon="inline-start" />거래 상세
            </a></Button>
          </div>
          {metrics}
          <ol className="mt-4 flex flex-col gap-2">
            {stages.map((stage, index) => {
              const key = stage.tab as DealWorkKey
              const complete = plan.states[key] === "complete"
              const active = plan.current === key
              const started = plan.states[key] === "active"
              return (
                <li
                  key={stage.value}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "relative rounded-md px-2 py-0.5 before:pointer-events-none before:absolute before:left-5 before:top-7 before:-bottom-3 before:border-l before:border-[var(--color-primary-4)] before:content-[''] last:before:hidden",
                    active && "bg-muted/40"
                  )}
                >
                  <a
                    href={`#${workIds[key]}`}
                    aria-label={`${stage.label} 구간으로 이동`}
                    onClick={(event) => {
                      event.preventDefault()
                      onNavigate(stage.tab)
                    }}
                    className="group flex min-h-7 w-full items-center gap-2 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full text-xs",
                        active
                          ? "bg-[var(--color-primary-4)] text-white"
                          : complete
                            ? "bg-[var(--color-primary-4)] text-white"
                            : "border text-muted-foreground"
                      )}
                    >
                      {complete ? <Check className="size-3.5" /> : index + 1}
                    </span>
                    <span
                      className={cn(
                        "flex-1 text-[15px] font-normal leading-[22px] group-hover:text-primary",
                        active && "text-primary"
                      )}
                    >
                      {stage.label}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 text-[11px] leading-4",
                        complete ? "bg-[var(--color-green-6)] text-[var(--color-green-1)]" : active ? "bg-primary/10 text-primary" : "text-muted-foreground"
                      )}
                    >
                      {plan.states[key] === "skipped" ? "해당 없음" : complete
                        ? "완료"
                        : active
                          ? "현재 할 일"
                          : started
                            ? "진행 중"
                            : "예정"}
                    </span>
                  </a>
                  <div className="ml-3 pl-4">
                    {stage.value === "shipment" && (
                      <p className="py-1 text-[13px] leading-[18px] text-muted-foreground">
                        {index <= current
                          ? (shipment?.state ??
                            (complete ? "선적 완료" : "선적 진행"))
                          : "선적 예정"}
                      </p>
                    )}
                    {key === "customs" && plan.states.customs === "skipped" && canMutate(role) && (
                      <Button variant="link" size="sm" className="px-0" onClick={onRestoreCustoms}>
                        통관 다시 사용
                      </Button>
                    )}
                    {stage.value === "customs" && plan.states[key] !== "skipped" && !complete && (
                      <p className="py-1 text-[13px] leading-[18px] text-muted-foreground">
                        {active ? "통관 업무 확인" : "B/L 연결 후 진행"}
                      </p>
                    )}
                    {stage.groups.map((group) => {
                      const due =
                        plan.states[
                          group === "결제 정보"
                            ? "finance"
                            : group === "선적 정보"
                              ? "fulfillment"
                              : "documents"
                        ] !== "planned"
                      const early = earlyGroups.includes(group)
                      return (
                        <div
                          key={group}
                          className={
                            stage.groups.length > 1
                              ? "inline-block w-1/2 align-top"
                              : undefined
                          }
                        >
                          {due || early ? (
                            <a
                              href={`#${fieldGroupIds[group]}`}
                              aria-label={`${group} 항목으로 이동`}
                              onClick={(event) => {
                                event.preventDefault()
                                onOpenGroup(group)
                              }}
                              className="flex min-h-8 items-center gap-1.5 rounded px-1 text-[13px] text-muted-foreground hover:bg-primary/5"
                            >
                              {group}
                            </a>
                          ) : canMutate(role) ? (
                            <Button
                              variant="ghost"
                              size="xs"
                              className="h-auto min-h-8 w-full justify-between gap-2 px-1 text-xs"
                              aria-label={`${group} 직접 입력`}
                              onClick={() => onOpenGroup(group)}
                            >
                              <span className="text-foreground">{group}</span>
                              <span className="flex items-center gap-1">
                                <Plus aria-hidden className="size-3" />
                                직접 입력
                              </span>
                            </Button>
                          ) : (
                            <p className="py-2 text-xs text-muted-foreground">
                              {group} · 단계 도래 전
                            </p>
                          )}
                          {early && !due && (
                            <p className="pb-1 text-xs text-muted-foreground">
                              단계 도래 전 · 직접 입력 열림
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </li>
              )
            })}
          </ol>
        </nav>
      </section>
    </div>
  )
}
type DealFieldDetail = {
  key: string
  label: string
  value: string
  group: DealFieldGroup
  match: DealFieldMatch
  evidence: string[]
  inputType?: "text" | "date"
}

type DealLineItem = {
  id: number
  goods: string
  hsCode: string
  quantity: string
  quantityUnit: string
  unitPrice: string
  currency: string
  packageCount: string
  packageUnit: string
  grossWeight: string
  netWeight: string
  weightUnit: string
  match: DealFieldMatch
  evidence: string[]
}

type DealFieldCandidate = {
  source: string
  document: string
  value: string
}

const dealFieldCandidates: Record<string, DealFieldCandidate[]> = {
  amount_total: [
    { source: "PO", document: "PO-260704-18.pdf", value: "2,400,000" },
    { source: "SC", document: "SC-2026-0708.pdf", value: "2,400,000" },
    { source: "CI", document: "Invoice_HB-2607-003.pdf", value: "2,566,000" },
  ]
}

const lineItemQuantityCandidates: Record<number, DealFieldCandidate[]> = {
  2: [
    { source: "PO", document: "PO-260704-18.pdf", value: "8" },
    { source: "SC", document: "SC-2026-0708.pdf", value: "8" },
    { source: "CI", document: "Invoice_HB-2607-003.pdf", value: "8" },
    { source: "PL", document: "PackingList_0707.pdf", value: "4" },
  ],
}

const initialDealFields: DealFieldDetail[] = [
  {
    key: "deal_id",
    label: "거래번호",
    value: "DL-260701-09",
    group: "거래 기본",
    match: "일치",
    evidence: ["거래 생성값"],
  },
  {
    key: "direction",
    label: "거래 방향",
    value: "수입",
    group: "거래 기본",
    match: "일치",
    evidence: ["거래 설정"],
  },
  {
    key: "buyer",
    label: "구매자",
    value: "ECOYA Demo Co.",
    group: "거래 기본",
    match: "일치",
    evidence: ["PO-260704-18.pdf", "SC-2026-0708.pdf"],
  },
  {
    key: "seller",
    label: "판매자",
    value: "KATAMAN ASIA-PACIFIC PTE LTD",
    group: "거래 기본",
    match: "일치",
    evidence: [
      "PO-260704-18.pdf",
      "SC-2026-0708.pdf",
      "Invoice_HB-2607-003.pdf",
    ],
  },
  {
    key: "contract_number",
    label: "계약번호",
    value: "SC-2026-0708",
    group: "거래 기본",
    match: "단일 출처",
    evidence: ["SC-2026-0708.pdf"],
  },
  {
    key: "contract_date",
    label: "계약일",
    value: "2026-07-08",
    group: "거래 기본",
    match: "단일 출처",
    evidence: ["SC-2026-0708.pdf"],
    inputType: "date",
  },
  {
    key: "currency",
    label: "통화",
    value: "USD",
    group: "상업 조건",
    match: "일치",
    evidence: [
      "PO-260704-18.pdf",
      "SC-2026-0708.pdf",
      "Invoice_HB-2607-003.pdf",
    ],
  },
  {
    key: "amount_total",
    label: "거래금액",
    value: "2,566,000",
    group: "상업 조건",
    match: "확인 필요",
    evidence: ["PO 2,400,000", "SC 2,400,000", "CI 2,566,000"],
  },
  {
    key: "incoterms",
    label: "인코텀즈",
    value: "CIF Incheon",
    group: "상업 조건",
    match: "일치",
    evidence: [
      "PO-260704-18.pdf",
      "SC-2026-0708.pdf",
      "Invoice_HB-2607-003.pdf",
    ],
  },
  {
    key: "payment_terms",
    label: "지급조건",
    value: "T/T 30 days",
    group: "상업 조건",
    match: "일치",
    evidence: ["SC-2026-0708.pdf", "Invoice_HB-2607-003.pdf"],
  },
  {
    key: "required_date",
    label: "납기 요청일",
    value: "2026-07-20",
    group: "상업 조건",
    match: "단일 출처",
    evidence: ["PO-260704-18.pdf"],
    inputType: "date",
  },
  {
    key: "port_loading",
    label: "선적항",
    value: "Melbourne",
    group: "선적 정보",
    match: "단일 출처",
    evidence: ["선적 014W-02"],
  },
  {
    key: "port_discharge",
    label: "도착항",
    value: "Busan",
    group: "선적 정보",
    match: "단일 출처",
    evidence: ["선적 014W-02"],
  },
  {
    key: "vessel",
    label: "선박명",
    value: "HMM Green",
    group: "선적 정보",
    match: "단일 출처",
    evidence: ["선적 014W-02"],
  },
  {
    key: "voyage",
    label: "항차",
    value: "014W",
    group: "선적 정보",
    match: "단일 출처",
    evidence: ["선적 014W-02"],
  },
  {
    key: "container",
    label: "컨테이너",
    value: "1 x 40FT HC",
    group: "선적 정보",
    match: "단일 출처",
    evidence: ["PackingList_0707.pdf"],
  },
  {
    key: "bl_number",
    label: "B/L 번호",
    value: "",
    group: "선적 정보",
    match: "누락",
    evidence: ["B/L 문서 미연결"],
  },
  {
    key: "etd",
    label: "ETD",
    value: "2026-07-20",
    group: "선적 정보",
    match: "일치",
    evidence: ["PO-260704-18.pdf", "선적 014W-02"],
    inputType: "date",
  },
  {
    key: "eta",
    label: "ETA",
    value: "2026-08-03",
    group: "선적 정보",
    match: "단일 출처",
    evidence: ["선적 014W-02"],
    inputType: "date",
  },
  {
    key: "bank_name",
    label: "수취은행",
    value: "JPMorgan Chase Singapore",
    group: "결제 정보",
    match: "단일 출처",
    evidence: ["Invoice_HB-2607-003.pdf"],
  },
  {
    key: "bank_account",
    label: "계좌번호",
    value: "8830043968",
    group: "결제 정보",
    match: "단일 출처",
    evidence: ["Invoice_HB-2607-003.pdf"],
  },
  {
    key: "bank_swift",
    label: "SWIFT",
    value: "CHASSGSG",
    group: "결제 정보",
    match: "단일 출처",
    evidence: ["Invoice_HB-2607-003.pdf"],
  },
  {
    key: "payment_due",
    label: "결제 예정일",
    value: "2026-08-06",
    group: "결제 정보",
    match: "단일 출처",
    evidence: ["지급조건 자동 계산"],
    inputType: "date",
  },
]

const initialDealLineItems: DealLineItem[] = [
  {
    id: 1,
    goods: "Aluminium Scrap Tough Taboo",
    hsCode: "7602.00",
    quantity: "12",
    quantityUnit: "MT",
    unitPrice: "128333",
    currency: "USD",
    packageCount: "12",
    packageUnit: "bundles",
    grossWeight: "12360",
    netWeight: "12000",
    weightUnit: "KG",
    match: "일치",
    evidence: ["PO", "SC", "CI", "PL"],
  },
  {
    id: 2,
    goods: "Aluminium Scrap Taint Tabor",
    hsCode: "7602.00",
    quantity: "8",
    quantityUnit: "MT",
    unitPrice: "128333",
    currency: "USD",
    packageCount: "8",
    packageUnit: "bundles",
    grossWeight: "4120",
    netWeight: "4000",
    weightUnit: "KG",
    match: "확인 필요",
    evidence: ["PO 8 MT", "SC 8 MT", "CI 8 MT", "PL 4 MT"],
  },
]


function SectionHeading({
  title,
  description,
  action,
}: {
  title: ReactNode
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h3 className="text-[length:var(--text-header-7)] leading-[var(--leading-header-7)] font-bold">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

function DetailCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <Card
      className={cn(
        "gap-0 bg-[var(--surface-background)] py-0 shadow-[var(--shadow-section)]",
        className
      )}
    >
      <div className="p-4 sm:p-5">{children}</div>
    </Card>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <SimpleFormField label={label}>{children}</SimpleFormField>
}

function SimpleSelect({
  value,
  onValueChange,
  options,
  disabled,
  className,
  icon,
  ariaLabel,
  label,
  size,
}: {
  value: string
  onValueChange: (value: string) => void
  options: Array<string | [string, string]>
  disabled?: boolean
  className?: string
  icon?: ReactNode
  ariaLabel?: string
  label?: string
  size?: "sm" | "default"
}) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => onValueChange(nextValue ?? value)}
      disabled={disabled}
    >
      <SelectTrigger
        size={size}
        className={cn("h-9 w-full", className)}
        aria-label={ariaLabel}
      >
        {icon}
        {label && <span className="text-muted-foreground">{label}</span>}
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="z-[var(--z-popup)]">
        {options.map((option) => {
          const [optionValue, optionLabel] = Array.isArray(option)
            ? option
            : [option, option]
          return (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

function ActionDialog({
  title,
  description,
  confirmLabel,
  destructive = false,
  canConfirm = true,
  onClose,
  onConfirm,
  children,
}: {
  title: string
  description?: string
  confirmLabel: string
  destructive?: boolean
  canConfirm?: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  children?: ReactNode
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose()
    }
    window.addEventListener("keydown", close)
    return () => window.removeEventListener("keydown", close)
  }, [busy, onClose])
  const submit = async () => {
    if (busy || !canConfirm) return
    setBusy(true)
    setError("")
    try {
      await onConfirm()
    } catch {
      setError("처리하지 못했습니다. 잠시 후 다시 시도해주세요.")
      setBusy(false)
    }
  }
  return createPortal(
    <div
      className="fixed inset-0 z-[var(--z-dialog)] grid place-items-center bg-foreground/25 p-5"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-lg border bg-background p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={busy}
            aria-label="닫기"
          >
            <X />
          </Button>
        </div>
        {children ? (
          <div className="mt-5 flex flex-col gap-4">{children}</div>
        ) : null}
        {error ? (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            취소
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={!canConfirm || busy}
            onClick={submit}
          >
            {busy ? (
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
            ) : null}
            {busy ? "처리 중" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function DealShareDialog({
  members,
  candidates,
  selected,
  busyMember,
  canWrite,
  onSelectedChange,
  onAdd,
  onRemove,
  onClose,
}: {
  members: string[]
  candidates: string[]
  selected: string
  busyMember: string | null
  canWrite: boolean
  onSelectedChange: (member: string) => void
  onAdd: () => void | Promise<void>
  onRemove: (member: string) => void | Promise<void>
  onClose: () => void
}) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busyMember) onClose()
    }
    window.addEventListener("keydown", close)
    return () => window.removeEventListener("keydown", close)
  }, [busyMember, onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[var(--z-dialog)] grid place-items-center bg-foreground/25 p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deal-share-title"
    >
      <div className="w-full max-w-md rounded-lg border bg-background p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="deal-share-title" className="text-lg font-semibold">
              공유 대상
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              이 거래를 함께 확인하고 처리할 내부 직원을 관리합니다.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={Boolean(busyMember)}
            aria-label="닫기"
          >
            <X />
          </Button>
        </div>
        <div className="mt-5 divide-y divide-[var(--surface-border)] border-y border-[var(--surface-border)]">
          {members.map((member) => (
            <div
              key={member}
              className="flex min-h-12 items-center justify-between gap-3 py-2"
            >
              <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                <UserRound className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{member}</span>
              </span>
              {canWrite ? (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={Boolean(busyMember)}
                  onClick={() => void onRemove(member)}
                >
                  {busyMember === member ? (
                    <LoaderCircle
                      className="animate-spin"
                      data-icon="inline-start"
                    />
                  ) : null}
                  해제
                </Button>
              ) : null}
            </div>
          ))}
        </div>
        {canWrite ? (
          <div className="mt-4 flex gap-2">
            <SimpleSelect
              className="min-w-0 flex-1"
              value={selected}
              disabled={Boolean(busyMember) || candidates.length === 0}
              onValueChange={onSelectedChange}
              options={[["", "직원 선택"], ...candidates]}
            />
            <Button
              disabled={!selected || Boolean(busyMember)}
              onClick={() => void onAdd()}
            >
              {busyMember === "add" ? (
                <LoaderCircle
                  className="animate-spin"
                  data-icon="inline-start"
                />
              ) : (
                <UserPlus data-icon="inline-start" />
              )}
              추가
            </Button>
          </div>
        ) : null}
        <div className="mt-6 flex justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={Boolean(busyMember)}
          >
            닫기
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function PanelFailure({
  title,
  onRetry,
}: {
  title: string
  onRetry: () => void
}) {
  const [busy, setBusy] = useState(false)
  return (
    <div className="grid min-h-96 place-items-center">
      <div className="max-w-md rounded-lg border border-warning/35 bg-warning/5 p-5 text-center">
        <CircleAlert className="mx-auto size-7 text-warning-foreground" />
        <strong className="mt-3 block">{title}을 불러오지 못했습니다</strong>
        <p className="mt-1 text-sm text-muted-foreground">
          다른 패널의 데이터는 유지됩니다. 이 패널만 다시 불러오세요.
        </p>
        <Button
          className="mt-4"
          variant="outline"
          disabled={busy}
          onClick={() => {
            setBusy(true)
            window.setTimeout(() => {
              setBusy(false)
              onRetry()
            }, 650)
          }}
        >
          <RefreshCw
            data-icon="inline-start"
            className={cn(busy && "animate-spin")}
          />
          다시 시도
        </Button>
      </div>
    </div>
  )
}

function DealDisclosureButton({ expanded, onClick, label, collapsedLabel = "보기", controls }: {
  expanded: boolean
  onClick: () => void
  label: string
  collapsedLabel?: string
  controls?: string
}) {
  return <Button type="button" variant="ghost-neutral" size="sm" className="shrink-0 gap-1" aria-label={`${label} ${expanded ? "접기" : "펼치기"}`} aria-expanded={expanded} aria-controls={controls} onClick={onClick}>
    {expanded ? "접기" : collapsedLabel}
    <ChevronDown data-icon="inline-end" className={cn("size-4 transition-transform", expanded && "rotate-180")} />
  </Button>
}

type DealMissingField = {
  key: string
  label: string
  group: DealFieldGroup | "품목"
  issue: "누락" | "불일치"
}

const needsReview = (match: DealFieldMatch) =>
  match === "누락" || match === "확인 필요"

function requiredDealReviews(
  fields: DealFieldDetail[],
  groups: DealFieldGroup[],
  items: DealLineItem[],
  direction: DealProfile["direction"]
): DealMissingField[] {
  return [
    ...fields
      .filter(
        (field) =>
          groups.includes(field.group) &&
          (direction === "direction_pending" || field.key !== (direction === "sales" ? "seller" : "buyer")) &&
          needsReview(field.match)
      )
      .map((field) => ({
        key: field.key,
        label:
          field.key === "amount_total"
            ? direction === "direction_pending" ? "거래 금액" : `${directionLabels[direction]} 금액`
            : field.label,
        group: field.group,
        issue: field.match === "누락" ? ("누락" as const) : ("불일치" as const),
      })),
    ...items.flatMap((item, index) =>
      needsReview(item.match)
        ? [
            {
              key: `item-${item.id}-quantity`,
              label: `품목 ${index + 1} · 수량`,
              group: "품목" as const,
              issue:
                item.match === "누락" ? ("누락" as const) : ("불일치" as const),
            },
          ]
        : []
    ),
  ]
}

function DealMissingInformation({
  fields,
  onOpenField,
}: {
  fields: DealMissingField[]
  onOpenField: (key: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  if (!fields.length) return null
  return (
    <section
      aria-label="상세 항목 검토"
      data-deal-missing-information
    >
      <InfoBox
        tone="risk"
        title={`검토 필요 ${fields.length}건 · 누락·불일치`}
        description={
          <span className="mt-0.5 flex flex-wrap gap-x-2">
            {fields.map((field) => (
              <button
                key={field.key}
                type="button"
                onClick={() => onOpenField(field.key)}
                className="text-left text-destructive underline decoration-destructive/30 underline-offset-2 hover:text-destructive"
              >
                {field.label}
              </button>
            ))}
            <span>항목을 확인해 주세요.</span>
          </span>
        }
        action={
        <DealDisclosureButton expanded={expanded} onClick={() => setExpanded((value) => !value)} label="검토 항목" collapsedLabel="항목 보기" controls="deal-missing-fields" />
        }
      />
      <ul
        id="deal-missing-fields"
        hidden={!expanded}
        aria-label="검토 항목 목록"
        className="max-h-[min(12rem,20svh)] divide-y divide-destructive/15 overflow-y-auto border-t border-destructive/15"
      >
        {fields.map((field) => (
          <li key={field.key}>
            <button
              type="button"
              onClick={() => onOpenField(field.key)}
              className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-destructive/5 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-2 font-medium text-destructive">
                  {field.label}<StatusBadge size="xs" tone="danger">{field.issue}</StatusBadge>
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {field.group}
                </span>
              </span>
              <span className="shrink-0 text-xs text-primary">확인하기</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

type DealReviewNotice = {
  id: "account_change" | "amount_quantity" | "missing_bl"
  title: string
  description: string
  dismissible?: boolean
}
function dealReviewNotices(riskDismissed: boolean): DealReviewNotice[] {
  return [
    {
      id: "account_change" as const,
      title: "수취 계좌 변경 확인",
      description:
        "확정 문서 DBS Bank · SC-2026-0708 → 현재 송장 JPMorgan Chase · INV-2026-0703",
    },
    ...(!riskDismissed
      ? [
          {
            id: "amount_quantity" as const,
            title: "금액·수량 불일치",
            description:
              "CI 금액은 계약보다 166,000 USD 높고, PL 수량은 계약보다 4 MT 적습니다.",
            dismissible: true,
          },
        ]
      : []),
    {
      id: "missing_bl" as const,
      title: "B/L 중량 대조 필요",
      description:
        "선하증권을 연결한 뒤 PL 16 MT와 계약 20 MT의 차이를 확인하세요.",
    },
  ]
}

function DealAiQuestion({ onAskAi }: { onAskAi: () => void }) {
  return (
    <Button size="sm" className="shrink-0" onClick={onAskAi}>
      AI에게 질문하기
    </Button>
  )
}

function DealAssistBar({
  notices,
  missingFields,
  onOpenMissingField,
  onOpenVerification,
}: {
  notices: DealReviewNotice[]
  missingFields: DealMissingField[]
  onOpenMissingField: (key: string) => void
  onOpenVerification: (id: DealReviewNotice["id"]) => void
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="space-y-3">
      <DealMissingInformation
        fields={missingFields}
        onOpenField={onOpenMissingField}
      />
      {notices.length > 0 && (
        <section
          data-deal-review-summary
          aria-label="확인 알림"
        >
          <InfoBox
            tone="caution"
            title={`확인 필요 ${notices.length}건`}
            description={
              <button
                type="button"
                className="mt-0.5 block text-left text-muted-foreground underline decoration-warning/40 underline-offset-2 hover:text-warning-foreground"
                onClick={() => onOpenVerification(notices[0].id)}
              >
                {notices[0].title}
              </button>
            }
            action={
            <DealDisclosureButton expanded={expanded} onClick={() => setExpanded((value) => !value)} label="확인 항목" collapsedLabel="항목 보기" controls="deal-confirmation-list" />
            }
          />
          <ul
            id="deal-confirmation-list"
            hidden={!expanded}
            aria-label="확인 알림 목록"
            className="max-h-[min(12rem,20svh)] divide-y divide-warning/15 overflow-y-auto border-t border-warning/15"
          >
            {notices.map((notice) => (
              <li key={notice.id}>
                <button
                  type="button"
                  onClick={() => onOpenVerification(notice.id)}
                  className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-warning/5"
                >
                  <span>{notice.title}</span>
                  <span className="shrink-0 text-xs text-primary">
                    검토하기 ↗
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function DealCompactAlerts({
  missingFields,
  notices,
  onOpenMissingField,
  onOpenVerification,
}: {
  missingFields: DealMissingField[]
  notices: DealReviewNotice[]
  onOpenMissingField: (key: string) => void
  onOpenVerification: (id: DealReviewNotice["id"]) => void
}) {
  const [open, setOpen] = useState<string | null>(null)
  const groups = [
    {
      key: "missing",
      label: "검토 필요",
      short: "검토",
      // Solid tints stay legible on the blue sticky hero.
      tone: "border-destructive/25 bg-[var(--color-red-8)] text-destructive",
      items: missingFields.map((field) => ({
        id: field.key,
        title: field.label,
        select: () => onOpenMissingField(field.key),
      })),
    },
    {
      key: "confirmation",
      label: "확인 필요",
      short: "확인",
      tone: "border-warning/30 bg-[var(--color-orange-6)] text-warning-foreground",
      items: notices.map((notice) => ({
        id: notice.id,
        title: notice.title,
        select: () => onOpenVerification(notice.id),
      })),
    },
  ]
  return (
    <div aria-label="고정 알림 건수" className="flex items-center gap-2">
      {groups
        .filter((group) => group.items.length)
        .map((group) => (
          <Popover
            key={group.key}
            open={open === group.key}
            onOpenChange={(value) => setOpen(value ? group.key : null)}
          >
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={group.tone} aria-label={`${group.label} ${group.items.length}건`}>
                <span className="hidden @min-[1100px]/dealhead:inline">{group.label} {group.items.length}건</span>
                <span className="@min-[1100px]/dealhead:hidden">{group.short} {group.items.length}</span>
                <ChevronDown className="size-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="z-[var(--z-popup)] w-80 max-w-[calc(100vw-32px)] p-0"
              onCloseAutoFocus={(event) => event.preventDefault()}
            >
              <p className="border-b px-3 py-2 text-sm font-semibold">
                {group.label} {group.items.length}건
              </p>
              <ul className="max-h-[min(16rem,40svh)] divide-y overflow-auto">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        setOpen(null)
                        item.select()
                      }}
                    >
                      {item.title}
                      <ArrowUpRight className="size-4 shrink-0 text-primary" />
                    </button>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        ))}
    </div>
  )
}

type DealDocumentSummary = {
  connected: number
  total: number
  documents: DocumentSlot[]
}

function DealKeyMetrics({
  profile,
  dealId,
  shipment,
  documentSummary,
}: {
  profile: Pick<DealProfile, "amount" | "currency">
  dealId: string
  shipment: DealShipmentSummary | null
  documentSummary: DealDocumentSummary
}) {
  const progress = orderProgress(dealId)
  const metrics = [
    {
      label: "거래 금액",
      value: `${profile.amount || "—"} ${profile.currency}`,
    },
    {
      label: "중요 서류",
      value: `${documentSummary.connected} / ${documentSummary.total}건`,
    },
    {
      label: "선적 수량",
      value: progress
        ? `${progress.shipped} / ${progress.contracted} ${progress.unit}`
        : "—",
    },
    { label: "가장 빠른 ETA", value: shipment?.eta ?? "—" },
  ]
  return (
    <section aria-label="거래 요약 지표" className="border-b py-4">
      <dl className="grid grid-cols-2 gap-x-3 gap-y-3">
        {metrics.map(({ label, value }) => (
          <div key={label} className="min-w-0">
            <dt className="text-[11px] text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 text-base leading-6 font-bold break-words tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

type DealShipmentSummary = {
  state: string
  eta: string
  count: number
  snap: string
}

// Prototype customs declarations (Figma 7872:185027). The real rows come from
// confirmed declaration data; originals are not kept after confirmation.
const customsDeclarations = (direction: DealProfile["direction"], dealId: string): Array<{ title: string; number: string; date: string; duty: string; vat: string; confirmed: boolean; fileName: string }> => {
  // Demo data only for deals that already moved on to 정산 (customs done):
  // their declarations are confirmed. Earlier deals keep customs empty/planned.
  if (!["settlement", "settled"].includes(dealStage(dealId))) return []
  const title = direction === "sales" ? "수출신고필증" : "수입신고필증"
  return [
    // Duties and VAT on a Korean declaration are in KRW (#1221 pattern).
    { title: `${title} A`, number: "12345-26-0000101", date: "2026.10.28", duty: "KRW 1,840,000", vat: "KRW 184,000", confirmed: true, fileName: `${title}_12345-26-0000101.pdf` },
    { title: `${title} B`, number: "12345-26-0000102", date: "2026.10.29", duty: "KRW 872,000", vat: "KRW 87,200", confirmed: true, fileName: `${title}_12345-26-0000102.pdf` },
  ]
}

// Registered sale in the CI sales row: amount only when the row is narrow,
// customer · amount · date once it has room (container width ≥ 560px).
function SaleSummary({ sale }: { sale: DealSale }) {
  return (
    <>
      {sale.customer ? <span className="hidden @min-[560px]/sale:inline">{sale.customer} · </span> : null}
      <span>{exactFinanceMoney(sale.amount, sale.currency)}</span>
      {sale.date ? <span className="hidden @min-[560px]/sale:inline"> · {sale.date}</span> : null}
    </>
  )
}

// Anchor of a registered sale's row in 정산 › 판매 내역.
const dealSaleAnchorId = (invoiceId: string) => `deal-sale-${invoiceId}`

// Anchor of a B/L's row in the deal shipment table; CI linked-document links
// and the packing list card jump there.
const dealBillAnchorId = (billId: string) => `deal-bill-${billId}`

// A page chip asks the document viewer to show a given page. The viewer may
// mount after the request (it opens with the document), so keep it pending.
// The viewer re-mounts per selected document, so the request names its file
// and only the viewer showing that file takes it.
let pendingDocumentPage: { file: string; page: number } | null = null
const requestDocumentPage = (file: string, page: number) => {
  pendingDocumentPage = { file, page }
  window.dispatchEvent(new CustomEvent("ecoya:deal-document-page", { detail: pendingDocumentPage }))
}

// Small p.N next to a field read from a multi-page document (CI, contract,
// B/L): opens the document beside the deal at that page. Same look as the CI.
function DocumentPageMarker({ label, page, fileName, code }: { label: string; page: number; fileName: string; code: string }) {
  return (
    <button
      type="button"
      className="text-[11px] leading-4 text-[var(--color-gray-6)] underline-offset-2 hover:text-[var(--color-primary-4)] hover:underline"
      aria-label={`${label} 근거 ${page}페이지 보기`}
      onClick={() => {
        requestDocumentPage(fileName, page)
        window.dispatchEvent(new CustomEvent("ecoya:open-deal-document", { detail: { code, fileName } }))
      }}
    >
      p.{page}
    </button>
  )
}

// Prototype: the deal's basis contract (multi-page) and the page each contract
// field is read from. A field read from several documents shows this contract's
// page only; shipping fields read from the B/L have no contract page.
const dealContractSource = {
  code: "SC",
  fileName: "SC-2026-0708.pdf",
  pageCount: 3,
  fieldPages: {
    buyer: 1, seller: 1, contract_number: 1, contract_date: 1,
    currency: 2, amount_total: 2, incoterms: 2, payment_terms: 2,
    required_date: 3, latest_shipment_date: 3, port_loading: 3, port_discharge: 3,
    bank_name: 3, bank_account: 3, bank_swift: 3,
  } as Partial<Record<string, number>>,
}

// Describes the control the user clicked to open 「문서와 보기」 (by aria-label or
// the nearest id) so it can be found again after the page re-mounts into the
// split and the left pane can be scrolled to keep it at the same height.
type ScrollAnchor = { selector: string; index: number; top: number }
const describeScrollAnchor = (target: Element | null): ScrollAnchor | null => {
  const root = target?.closest("[data-deal-page-content]") ?? document
  for (let element = target; element && element !== document.body; element = element.parentElement) {
    const label = element.getAttribute("aria-label")
    const selector = label ? `[aria-label=${JSON.stringify(label)}]` : element.id ? `[id=${JSON.stringify(element.id)}]` : null
    if (!selector) continue
    const index = Array.from(root.querySelectorAll(selector)).indexOf(element)
    if (index >= 0) return { selector, index, top: element.getBoundingClientRect().top }
  }
  return null
}

// Opening 「문서와 보기」 re-mounts the deal content inside the side-by-side
// split, which would reset row state. Remember opened rows per deal.
const openedInvoiceRows = new Map<string, Set<string>>()
const openedItemRows = new Map<string, Set<number>>()



const billContainers = (bill: SplitShipmentView["billsOfLading"][number]) => {
  if (bill.containers?.length) return bill.containers
  if (!bill.fields.containerNumber) return []
  return [{
    number: bill.fields.containerNumber,
    sealNumber: bill.fields.sealNumber,
    packageCount: bill.fields.packageCount,
    packageUnit: bill.fields.packageType,
    grossWeight: bill.fields.grossWeight,
    volume: bill.fields.volume,
  }]
}

const dealPackingListAnchorId = (documentId: string) => `deal-pl-${documentId}`
const dealContainerAnchorId = (containerNumber: string) => `deal-container-${containerNumber}`
const dealInvoiceAnchorId = (invoiceId: string) => `deal-invoice-${invoiceId}`
// After 「추가」: bring the new (opened) row into view and focus its first input.
const revealAddedRow = (rowId: string) => {
  let tries = 0
  const reveal = () => {
    const row = document.getElementById(rowId)
    if (!row) { if (tries++ < 20) requestAnimationFrame(reveal); return }
    row.scrollIntoView({ block: "start", behavior: "smooth" })
    const input = row.nextElementSibling?.querySelector<HTMLInputElement>("input:not([disabled])")
    input?.focus({ preventScroll: true })
  }
  requestAnimationFrame(reveal)
}
// Jumping to a shipment, CI or packing list row opens it, scrolls it under
// the sticky header and moves keyboard focus to its open/close toggle.
const focusRow = (anchor: string) => requestAnimationFrame(() => requestAnimationFrame(() => {
  const row = document.getElementById(anchor)
  if (!row) return
  row.scrollIntoView({ block: "start", behavior: "smooth" })
  row.querySelector<HTMLElement>("[aria-expanded]")?.focus({ preventScroll: true })
}))
const openShipmentRowByAnchor = (anchor: string) => { window.dispatchEvent(new CustomEvent("ecoya:open-shipment-row", { detail: anchor })); focusRow(anchor) }
const openInvoiceRow = (invoiceId: string) => { window.dispatchEvent(new CustomEvent("ecoya:open-invoice-row", { detail: invoiceId })); focusRow(dealInvoiceAnchorId(invoiceId)) }
const openPackingListRow = (documentId: string) => { window.dispatchEvent(new CustomEvent("ecoya:open-packing-list", { detail: documentId })); focusRow(dealPackingListAnchorId(documentId)) }
const openBillDocument = (bill: { fileName: string }) => window.dispatchEvent(new CustomEvent("ecoya:open-deal-document", { detail: { code: "BL", fileName: bill.fileName } }))

function followBillLink(event: React.MouseEvent<HTMLAnchorElement>, anchor: string, bill?: { fileName: string }) {
  if (bill?.fileName && !document.getElementById(anchor)) {
    event.preventDefault()
    openBillDocument(bill)
  } else {
    openShipmentRowByAnchor(anchor)
  }
}

// 서류·근거 cell of a deal shipment row: the CIs linked to this B/L.
type BillCard = SplitShipmentView["billsOfLading"][number]
// Re-reads document relations whenever any card on the deal page links documents.
function useDealRelations(dealId: string) {
  const [relations, setRelations] = useState(() => readDealInvoiceRelations(dealId))
  useEffect(() => {
    const reread = (event: Event) => { if ((event as CustomEvent<string>).detail === dealId) setRelations(readDealInvoiceRelations(dealId)) }
    window.addEventListener("ecoya:deal-relations-changed", reread)
    return () => window.removeEventListener("ecoya:deal-relations-changed", reread)
  }, [dealId])
  return relations
}
// A shipment row links documents by its B/L document, or by the shipment
// itself when no B/L document matches it yet.
const shipmentLinkKey = (shipment: { id: string }, bill?: BillCard) => bill?.documentId ?? `shipment:${shipment.id}`
function billOptionLabel(bill: BillCard, bills: BillCard[]) {
  if (!bill.blNumber) return bill.fileName || "B/L 번호 미확인"
  const repeated = bills.some(other => other.documentId !== bill.documentId && other.blNumber === bill.blNumber)
  return repeated ? `${bill.blNumber} · ${bill.fileName}` : bill.blNumber
}
const dealShipmentAnchorId = (shipmentId: string) => `deal-shipment-${shipmentId}`
type PackingListEntry = { bill?: BillCard; document: Pick<NonNullable<BillCard["connectedDocuments"]>[number], "documentId" | "number" | "fileName" | "referenceBlNumber" | "containers" | "items" | "grossWeight" | "quantity" | "unitPrice" | "amount">; containers: PackingContainer[]; manual?: boolean }
function dealPackingLists(view: SplitShipmentView, relations: DealInvoiceRelationState): PackingListEntry[] {
  const lists = new Map<string, PackingListEntry>()
  const add = (document: PackingListEntry["document"], bill?: BillCard, manual = false) => {
    if (lists.has(document.documentId) || relations.removedDocuments.includes(document.documentId)) return
    const draft = relations.manualPackingLists[document.documentId]
    lists.set(document.documentId, {
      bill, manual, document: { ...document, number: draft?.number ?? document.number, items: draft?.items ?? document.items },
      containers: draft?.containers ?? document.containers ?? (bill ? billContainers(bill) : []),
    })
  }
  for (const bill of view.billsOfLading) for (const document of bill.connectedDocuments ?? []) if (document.code === "PL") add(document, bill)
  for (const document of view.unlinkedPackingLists ?? []) add(document)
  for (const [id, list] of Object.entries(relations.manualPackingLists)) add({ documentId: id, number: list.number, fileName: "" }, undefined, true)
  return [...lists.values()]
}
function dealDocumentLinks(view: SplitShipmentView, relations: DealInvoiceRelationState) {
  // CIs and packing lists entered by hand count as documents of the deal too.
  const manualInvoices = relations.manualInvoices.map((id) => {
    const fields = relations.invoiceFields[id] ?? {}
    const amount = (fields["통화·금액"] ?? "").match(/^([A-Z]{3})?\s*([\d,.]+)?/)
    const card: CommercialInvoiceCard = { documentId: id, fileName: "", uploadedAt: "", invoiceNumber: fields["송장번호"] || "송장번호 미입력", invoiceDate: fields["송장일자"] || null, currency: amount?.[1] ?? null, totalAmount: amount?.[2] ? Number(amount[2].replaceAll(",", "")) : null, quantity: fields["수량"] || null }
    return card
  })
  // A CI may arrive on several B/Ls (split shipment); all of them are its links.
  const invoiceOwners = new Map<string, string[]>()
  for (const entry of view.billsOfLading) for (const invoice of entry.connectedCommercialInvoices) invoiceOwners.set(invoice.documentId, [...(invoiceOwners.get(invoice.documentId) ?? []), entry.documentId])
  const ownedInvoices = view.billsOfLading.flatMap((entry) => entry.connectedCommercialInvoices)
  const allInvoices = [...new Map([...ownedInvoices, ...view.unlinkedDocuments, ...manualInvoices].map((invoice) => [invoice.documentId, invoice])).values()].filter((invoice) => !relations.removedDocuments.includes(invoice.documentId))
  const directBills = (id: string) => resolveDealShipmentLinks(relations.invoiceToBills, id, view.firstPackingInvoices ? [] : invoiceOwners.get(id))
  const explicitPackingBills = new Set(Object.values(relations.packingToShipments).flat())
  const packing = dealPackingLists(view, relations).map(list => {
    const { document, containers } = list
    const originalBill = list.bill?.documentId
    const automaticBill = originalBill && !explicitPackingBills.has(originalBill) ? originalBill : undefined
    const shipmentKey = resolveDealShipmentLink(relations.packingToShipments, document.documentId, automaticBill)
    // Retain pairs from older saved deals where the two documents shared a manually linked shipment.
    const legacyOwner = shipmentKey ? allInvoices.find(invoice => directBills(invoice.documentId).includes(shipmentKey)) : undefined
    const firstInvoice = view.firstPackingInvoices?.[document.documentId]
    const owner = resolveDealShipmentLink(relations.packingToInvoices, document.documentId, legacyOwner?.documentId || firstInvoice)
    return { ...list, shipmentKey, invoiceId: allInvoices.some(ci => ci.documentId === owner) ? owner : undefined,
      containerCount: containers.length, grossWeight: packingGrossWeight(containers, document.grossWeight) }
  })
  const invoices = allInvoices.map(invoice => {
    const direct = directBills(invoice.documentId)
    const indirect = packing.filter(pl => pl.invoiceId === invoice.documentId && pl.shipmentKey).map(pl => pl.shipmentKey!)
    const links = [...new Set([...direct, ...indirect])]
    const draft = relations.invoiceFields[invoice.documentId] ?? {}
    return {
      ...invoice,
      quantity: draft["수량"] ?? invoice.quantity,
      unitPrice: draft["단가"] ?? invoice.unitPrice,
      amount: draft["통화·금액"] ?? (invoice.totalAmount != null ? [invoice.currency, invoice.totalAmount].filter(value => value != null).join(" ") : ""),
      invoiceNumber: draft["송장번호"] ?? invoice.invoiceNumber,
      direct, links,
      linkedNumbers: links.map(key => view.billsOfLading.find(bill => bill.documentId === key)?.blNumber ?? relations.shipmentLabels[key]),
    }
  })
  return { invoices, packing }
}

type DealDocumentLinks = ReturnType<typeof dealDocumentLinks>
function documentsForShipment(graph: DealDocumentLinks, key: string) {
  return { invoices: graph.invoices.filter(ci => ci.links.includes(key)), packingLists: graph.packing.filter(pl => pl.shipmentKey === key) }
}

// 연결 column of a deal shipment row: the CIs linked to this shipment.
function ShipmentDocumentLinks({ invoices }: { invoices: DealDocumentLinks["invoices"] }) {
  return (
    <div className="truncate">
      <span className="text-[var(--color-gray-5)]">CI </span>
      {invoices.length ? invoices.map((invoice, index) => (
        <Fragment key={invoice.documentId}>
          {index ? ", " : null}
          <a href={`#${dealInvoiceAnchorId(invoice.documentId)}`} className="text-[var(--color-primary-4)] hover:underline" onClick={() => openInvoiceRow(invoice.documentId)}>{invoice.invoiceNumber || invoice.fileName}</a>
        </Fragment>
      )) : <span className="text-muted-foreground">B/L 대기</span>}
    </div>
  )
}

// Shared selector for linking CI, PL, and B/L documents from either side of
// the relationship. Existing document summaries stay domain-specific.
function BlReferenceNotice({ reference, linked }: { reference?: string | null; linked?: string | null }) {
  if (!blNumbersMismatch(reference, linked)) return null
  return <div role="status" className="flex basis-full flex-wrap items-center gap-2 text-xs">
    <StatusBadge size="sm" tone="danger">B/L 번호 불일치</StatusBadge>
    <span className="break-all text-muted-foreground">문서 B/L: {reference} · 연결 B/L: {linked}</span>
  </div>
}

// 반올림/절사 choice of one amount; every amount (총금액, 품목 금액, CI 금액) has its own.
function AmountRoundingSelect({ value, onValueChange, disabled, label }: { value: TotalRounding; onValueChange: (mode: TotalRounding) => void; disabled?: boolean; label: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost-neutral" size="xs" disabled={disabled} aria-label={`${label}, 현재 ${totalRoundingLabels[value]}`}>
          {totalRoundingLabels[value]}
          <ChevronDown data-icon="inline-end" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" aria-label={label} className="w-max min-w-40 whitespace-nowrap">
        <DropdownMenuRadioGroup value={value} onValueChange={(mode) => {
          if (mode === "round" || mode === "truncate") onValueChange(mode)
        }}>
          <DropdownMenuRadioItem value="round">{totalRoundingLabels.round}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="truncate">{totalRoundingLabels.truncate} (버림)</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// "USD 1539999.965" shown with its amount's rounding; the stored text stays as entered.
const roundedAmountText = (text: string, mode: TotalRounding) => {
  const match = text.trim().match(/^([A-Z]{3})\s+(.+)$/)
  return match ? `${match[1]} ${roundedDealTotal(match[2], match[1], mode)}` : text
}

function LinkedDocumentMeasures({ grossWeight, quantity, amount }: {
  grossWeight?: string | null
  quantity?: string | null
  amount?: string | null
}) {
  return <>
    {grossWeight ? <strong className="tabular-nums">총중량 {grossWeight}</strong>
      : quantity ? <span className="tabular-nums">{/\b(MT|KG|LB|TON)$/i.test(quantity.trim()) ? "중량" : "수량"} {quantity}</span>
      : <span className="text-muted-foreground">중량 미확인</span>}
    {amount && <span className="tabular-nums">금액 {amount}</span>}
  </>
}

type LinkableDocument = "CI" | "PL" | "BL"
type CandidateSummary = { id: string; label: string; grossWeight: string | null | undefined }
type PackingChoice = CandidateSummary & { connect: () => void }
type DocumentCandidate = CandidateSummary & {
  code: LinkableDocument; reference?: string | null; linkedBl?: string | null
} & ({ connect: () => void; choices?: undefined } | { choices: PackingChoice[]; connect?: undefined })

function billGrossWeight(bill: BillCard) {
  return bill.fields.grossWeight?.trim() || sumMeasure((bill.containers ?? []).map(container => container.grossWeight))
}

function CandidateLabel({ candidate }: { candidate: CandidateSummary }) {
  return <>
    <span className="min-w-0 flex-1 break-all">{candidate.label}</span>
    <span className="ml-auto whitespace-nowrap text-[13px] text-muted-foreground tabular-nums">총중량 {candidate.grossWeight?.trim() || "미확인"}</span>
  </>
}

function DealLinkedDocuments({ dealId, code, id, name, view, graph, relations, canWrite }: {
  dealId: string; code: LinkableDocument; id: string; name: string; view: SplitShipmentView
  graph: DealDocumentLinks; relations: DealInvoiceRelationState; canWrite: boolean
}) {
  const [adding, setAdding] = useState(false)
  const [choosingBill, setChoosingBill] = useState<string | null>(null)
  const rounding = useAmountRoundings(dealId)
  const close = () => { setAdding(false); setChoosingBill(null) }
  const invoice = code === "CI" ? graph.invoices.find(ci => ci.documentId === id) : undefined
  const packing = code === "PL" ? graph.packing.find(pl => pl.document.documentId === id) : undefined
  const linkedPacking = graph.packing.filter(pl => code === "CI" ? pl.invoiceId === id : code === "BL" && pl.shipmentKey === id)
  const linkedInvoices = graph.invoices.filter(ci => code === "PL" ? ci.documentId === packing?.invoiceId : code === "BL" && ci.links.includes(id))
  const billIds = invoice?.links ?? (packing?.shipmentKey ? [packing.shipmentKey] : [])
  const candidates: DocumentCandidate[] = []
  if (code === "CI" || (code === "BL" && !linkedPacking.length)) {
    for (const pl of graph.packing) {
      if (code === "CI" && (pl.invoiceId || (pl.shipmentKey && graph.invoices.some(ci => ci.documentId !== id && ci.links.includes(pl.shipmentKey!))))) continue
      if (code === "BL" && (pl.shipmentKey || (pl.invoiceId && linkedInvoices.some(ci => ci.documentId !== pl.invoiceId)))) continue
      const plId = pl.document.documentId
      candidates.push({ code: "PL", id: plId, grossWeight: pl.grossWeight, label: pl.document.number || pl.document.fileName || "포장번호 미입력",
        reference: code === "BL" ? pl.document.referenceBlNumber : undefined, linkedBl: code === "BL" ? name : undefined,
        connect: () => code === "CI" ? setPackingInvoice(dealId, plId, id) : linkDealPackingListToShipment(dealId, plId, id, name) })
    }
  }
  if (packing) {
    if (!packing.invoiceId) {
      for (const ci of graph.invoices) {
        if (packing.shipmentKey && graph.invoices.some(other => other.documentId !== ci.documentId && other.links.includes(packing.shipmentKey!))) continue
        candidates.push({ code: "CI", id: ci.documentId, grossWeight: ci.grossWeight, label: ci.invoiceNumber || ci.fileName || "송장번호 미입력",
          connect: () => setPackingInvoice(dealId, id, ci.documentId) })
      }
    }
    if (!packing.shipmentKey) {
      for (const bill of view.billsOfLading) {
        if (graph.packing.some(pl => pl.shipmentKey === bill.documentId)) continue
        if (packing.invoiceId && graph.invoices.some(ci => ci.documentId !== packing.invoiceId && ci.links.includes(bill.documentId))) continue
        candidates.push({ code: "BL", id: bill.documentId, label: billOptionLabel(bill, view.billsOfLading), grossWeight: billGrossWeight(bill),
          reference: packing.document.referenceBlNumber, linkedBl: bill.blNumber,
          connect: () => linkDealPackingListToShipment(dealId, id, bill.documentId, bill.blNumber ?? undefined) })
      }
    }
  }
  if (invoice) {
    const pending = linkedPacking.filter(pl => !pl.shipmentKey)
    for (const bill of view.billsOfLading) {
      const key = bill.documentId
      if (graph.invoices.some(ci => ci.links.includes(key))) continue
      const owner = graph.packing.find(pl => pl.shipmentKey === key)
      const option = { code: "BL" as const, id: key, label: billOptionLabel(bill, view.billsOfLading), grossWeight: billGrossWeight(bill),
        reference: invoice.referenceBlNumber, linkedBl: bill.blNumber }
      if (owner) {
        candidates.push({ ...option, connect: () => setPackingInvoice(dealId, owner.document.documentId, id) })
      } else if (pending.length) {
        const choices = pending.map(({ document, grossWeight }) => ({
          id: document.documentId, grossWeight, label: document.number || document.fileName || "포장번호 미입력",
          connect: () => linkDealPackingListToShipment(dealId, document.documentId, key, bill.blNumber ?? undefined),
        }))
        candidates.push(choices.length === 1 ? { ...option, connect: choices[0].connect } : { ...option, choices })
      } else {
        candidates.push({ ...option, connect: () => linkDealInvoiceToShipment(dealId, id, key, bill.blNumber ?? undefined, invoice.direct) })
      }
    }
  }
  const selectedBill = candidates.find(option => option.code === "BL" && option.id === choosingBill && option.choices)
  const unlink = (label: string, action: () => void) => canWrite && (
    <Button type="button" size="sm" variant="ghost-neutral" className="ml-auto" aria-label={`${label} 연결 해제`} onClick={action}>연결 해제</Button>
  )
  const rowClass = "flex flex-wrap items-center gap-x-2 gap-y-1 py-2 text-sm"
  const linkClass = "font-semibold text-[var(--color-primary-4)] hover:underline"
  const count = linkedPacking.length + linkedInvoices.length + billIds.length
  return (
    <section aria-label={`${name} 연결 문서`} className="rounded-xl border border-[var(--color-gray-9)] bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">연결 문서</h3>
        {canWrite && <DropdownMenu open={adding} onOpenChange={open => open ? setAdding(true) : close()}>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="sm" variant="outline" className="ml-auto"><Plus data-icon="inline-start" />연결추가</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" aria-label="연결 후보" className="w-96 max-w-[calc(100vw-2rem)]">
            {selectedBill?.choices ? <>
              <DropdownMenuLabel>{selectedBill.label}에 연결할 포장분</DropdownMenuLabel>
              {selectedBill.choices.map(pl => <DropdownMenuItem key={pl.id} textValue={pl.label} onSelect={pl.connect}><CandidateLabel candidate={pl} /></DropdownMenuItem>)}
            </> : (["CI", "PL", "BL"] as const).map(type => {
              const group = candidates.filter(option => option.code === type)
              return group.length > 0 && <DropdownMenuGroup key={type}>
                <DropdownMenuLabel>{type === "CI" ? "상업송장" : type === "PL" ? "포장명세서" : "선하증권"}</DropdownMenuLabel>
                {group.map(option => <DropdownMenuItem key={option.id} textValue={option.label} onSelect={event => {
                  if (option.choices) { event.preventDefault(); setChoosingBill(option.id) }
                  else option.connect()
                }}>
                  <CandidateLabel candidate={option} />
                  {blNumbersMismatch(option.reference, option.linkedBl) && <StatusBadge size="sm" tone="danger">번호 불일치</StatusBadge>}
                </DropdownMenuItem>)}
              </DropdownMenuGroup>
            })}
            {!candidates.length && <DropdownMenuItem disabled>연결할 수 있는 문서가 없습니다.</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>}

      </div>
      {count > 0 && <ul className="mt-2 divide-y">
        {linkedInvoices.map(ci => {
          const label = ci.invoiceNumber || ci.fileName || "송장번호 미입력"
          const via = linkedPacking.find(pl => pl.invoiceId === ci.documentId)
          return <li key={`ci:${ci.documentId}`} className={rowClass}>
            <DocumentTypeBadge code="CI" /><a className={linkClass} href={`#${dealInvoiceAnchorId(ci.documentId)}`} onClick={() => openInvoiceRow(ci.documentId)}>{label}</a>
            <LinkedDocumentMeasures grossWeight={ci.grossWeight || undefined} quantity={ci.quantity} amount={roundedAmountText(ci.amount, rounding.read(`ci:${ci.documentId}`))} />
            {code === "PL" ? unlink(label, () => setPackingInvoice(dealId, id, null)) : via
              ? <span className="text-xs text-muted-foreground">PL로 연결</span>
              : unlink(label, () => unlinkDealDocumentFromShipment(dealId, { code: "CI", documentId: ci.documentId, shipmentKey: id, directKeys: ci.direct }))}
            {code === "BL" && !ci.linkedNumbers.some(number => number && !blNumbersMismatch(ci.referenceBlNumber, number)) && <BlReferenceNotice reference={ci.referenceBlNumber} linked={name} />}
          </li>
        })}
        {linkedPacking.map(pl => {
          const doc = pl.document
          const label = doc.number || doc.fileName || "포장번호 미입력"
          return <li key={`pl:${doc.documentId}`} className={rowClass}>
            <DocumentTypeBadge code="PL" /><a className={linkClass} href={`#${dealPackingListAnchorId(doc.documentId)}`} onClick={() => openPackingListRow(doc.documentId)}>{label}</a>
            <LinkedDocumentMeasures grossWeight={pl.grossWeight ?? null} quantity={doc.quantity} />
            {code === "CI" && !pl.shipmentKey && <span className="text-xs text-muted-foreground">B/L 대기</span>}
            {unlink(label, () => code === "CI" ? setPackingInvoice(dealId, doc.documentId, null) : unlinkDealDocumentFromShipment(dealId, { code: "PL", documentId: doc.documentId, invoiceId: pl.invoiceId }))}
            {code === "BL" && <BlReferenceNotice reference={doc.referenceBlNumber} linked={name} />}
          </li>
        })}
        {billIds.map(key => {
          const bill = view.billsOfLading.find(entry => entry.documentId === key)
          const label = bill?.blNumber || relations.shipmentLabels[key] || "B/L 번호 미확인"
          const anchor = bill ? dealBillAnchorId(key) : dealShipmentAnchorId(key.replace(/^shipment:/, ""))
          const via = linkedPacking.find(pl => pl.shipmentKey === key)
          const linkedList = via ?? packing
          const containerCount = bill?.fields.containerCount ?? (bill?.containers?.length || linkedList?.containerCount || (bill?.fields.containerNumber ? 1 : undefined))
          return <li key={`bl:${key}`} className={rowClass}>
            <DocumentTypeBadge code="BL" /><a className={linkClass} href={`#${anchor}`} onClick={event => followBillLink(event, anchor, bill)}>{label}</a>
            {bill && <LinkedDocumentMeasures grossWeight={billGrossWeight(bill)} quantity={bill.fields.quantity} />}
            <StatusBadge size="sm" tone="neutral">{containerCount == null ? "컨테이너 대수 미확인" : `컨테이너 ${containerCount}대`}</StatusBadge>
            {via && <span className="text-xs text-muted-foreground">{via.document.number || via.document.fileName || "포장명세서"}로 연결</span>}
            {unlink(label, () => unlinkDealDocumentFromShipment(dealId, invoice
              ? { code: "CI", documentId: id, shipmentKey: key, directKeys: invoice.direct,
                  viaPackingIds: linkedPacking.filter(pl => pl.shipmentKey === key).map(pl => pl.document.documentId) }
              : { code: "PL", documentId: id, invoiceId: packing?.invoiceId }))}
            {!invoice?.linkedNumbers.some(number => number && !blNumbersMismatch(invoice.referenceBlNumber, number)) && <BlReferenceNotice reference={invoice?.referenceBlNumber ?? packing?.document.referenceBlNumber} linked={label} />}
          </li>
        })}
      </ul>}
      {!count && !adding && <p className="mt-2 text-sm text-muted-foreground">연결된 문서가 없습니다.</p>}

    </section>
  )
}

// Container numbers of a deal shipment row, taken from its packing list (the
// packing basis). Each links to that container's row in the packing list card.
function ShipmentContainerLinks({ containers, packingListId }: { containers: Array<{ number: string }>; packingListId?: string }) {
  const shown = containers.slice(0, 2)
  if (!shown.length) return null
  return (
    <>
      {shown.map((container, index) => (
        <a key={`${container.number}-${index}`} href={`#${packingListId ? dealPackingListAnchorId(packingListId) : dealContainerAnchorId(container.number)}`} className="mt-0.5 block w-fit text-[15px] leading-[22px] text-[var(--color-primary-4)] hover:underline" data-ui="shipment-container-number" onClick={(event) => { event.stopPropagation(); if (packingListId) openPackingListRow(packingListId) }}>{container.number || "번호 미입력"}</a>
      ))}
      {containers.length > shown.length ? <span className="mt-0.5 block text-[15px] leading-[22px] text-[var(--color-gray-5)]">외 {containers.length - shown.length}대</span> : null}
    </>
  )
}

// Packing lists of this deal as their own card, in the shipment table's style.
// One row per packing list document: its B/L, container and seal numbers
// (paired line by line, two at most then "외 N대") and document totals.
// Per-container packages and weights differ, so they show — and are edited —
// when the row is opened (autosave).
const openedPackingLists = new Map<string, Set<string>>()
type PackingContainer = ReturnType<typeof billContainers>[number]
const PACKING_ROW_CONTAINERS = 2
// Sums container measures such as "8,240 KG" + "8,240 KG" → "16,480 KG".
// Returns null when a value is missing or the units differ.
const sumMeasure = (values: Array<string | null | undefined>) => {
  if (!values.length) return null
  let total = 0
  let unit: string | null = null
  for (const value of values) {
    const match = value?.trim().match(/^([\d,]+(?:\.\d+)?)\s*(.*)$/)
    if (!match) return null
    const nextUnit = match[2].trim()
    if (unit !== null && unit !== nextUnit) return null
    unit = nextUnit
    total += Number(match[1].replaceAll(",", ""))
  }
  const decimals = Math.max(0, ...values.map((value) => value?.match(/\.(\d+)/)?.[1].length ?? 0))
  return `${total.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${unit ? ` ${unit}` : ""}`
}
function packingGrossWeight(containers: PackingContainer[], documentWeight?: string) {
  return sumMeasure(containers.map(container => container.grossWeight)) ?? (documentWeight || null)
}

function PackingListCard({ dealId, view, canWrite, onUpload, contractItems }: {
  contractItems: DealLineItem[]
  dealId: string
  view: SplitShipmentView
  canWrite: boolean
  onUpload?: () => void
}) {
  const relations = useDealRelations(dealId)
  // The first packing list row starts open.
  const [openLists, setOpenLists] = useState<Set<string>>(() => openedPackingLists.get(dealId) ?? new Set(view.billsOfLading.flatMap((bill) => (bill.connectedDocuments ?? []).filter((document) => document.code === "PL").map((document) => document.documentId)).slice(0, 1)))
  useEffect(() => { openedPackingLists.set(dealId, openLists) }, [dealId, openLists])
  const toggleList = (id: string) => setOpenLists((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next })
  // A container link elsewhere (shipment table) opens its packing list.
  useEffect(() => {
    const open = (event: Event) => {
      const id = (event as CustomEvent<string>).detail
      setOpenLists((current) => current.has(id) ? current : new Set([...current, id]))
    }
    window.addEventListener("ecoya:open-packing-list", open)
    return () => window.removeEventListener("ecoya:open-packing-list", open)
  }, [])
  const openPackingList = (fileName: string) => {
    window.dispatchEvent(new CustomEvent("ecoya:open-deal-document", { detail: { code: "PL", fileName } }))
  }
  const graph = dealDocumentLinks(view, relations)
  const lists = graph.packing
  // PL edits belong to the PL, so comparing them must not overwrite the B/L reference.
  const setContainers = (list: PackingListEntry, containers: PackingContainer[]) => {
    saveDealManualPackingList(dealId, list.document.documentId, { number: list.document.number ?? "", containers })
  }
  // The same single B/L is shown in the list summary and the opened detail.
  const linkedShipmentOf = (list: DealDocumentLinks["packing"][number]) => {
    const key = list.shipmentKey
    if (!key) return null
    const bill = view.billsOfLading.find((entry) => entry.documentId === key)
    return bill ? { bill, key, label: bill.blNumber || "B/L 번호 미확인", anchor: dealBillAnchorId(bill.documentId) } : { key, label: relations.shipmentLabels[key] || "B/L 번호 미확인", anchor: dealShipmentAnchorId(key.replace(/^shipment:/, "")) }
  }
  const containerCount = lists.reduce((total, list) => total + list.containers.length, 0)
  const cell = "align-top"
  const numeric = "text-right whitespace-nowrap tabular-nums"
  const unitSelect = (value: string, options: string[], label: string, onChange: (next: string) => void) => (
    <Select value={value} disabled={!canWrite} onValueChange={(next) => onChange(next ?? "")}>
      <SelectTrigger size="sm" aria-label={label} className="w-full gap-1 px-3 py-0 data-[size=sm]:h-10 data-[size=sm]:text-[length:var(--text-body-6)] data-[size=sm]:leading-[var(--leading-body-6)]"><SelectValue /></SelectTrigger>
      <SelectContent className="z-[var(--z-popup)]">{[...new Set([value, ...options])].filter(Boolean).map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
    </Select>
  )
  const textInput = (update: (index: number, patch: Partial<PackingContainer>) => void, index: number, container: PackingContainer, key: "number" | "sealNumber" | "packageCount", label: string, align?: string) => (
    <Input aria-label={`컨테이너 ${index + 1} ${label}`} disabled={!canWrite} className={cn("h-10 px-3 py-0 tabular-nums", align)} value={container[key] ?? ""} onChange={(event) => update(index, { [key]: event.target.value })} />
  )
  // "8,240 KG" → number input and a unit select in their own columns (like
  // the item card's 총중량 · 중량 단위), saved back as one value.
  const measureFields = (update: (index: number, patch: Partial<PackingContainer>) => void, index: number, container: PackingContainer, key: "grossWeight" | "volume", label: string, unitLabel: string, units: string[]) => {
    const match = (container[key] ?? "").trim().match(/^(.*?)\s*([A-Za-z]+)?$/)
    const amount = match?.[1] ?? ""
    const unit = match?.[2] ?? units[0]
    return (
      <>
        <div><FormFieldHeader className="mb-2.5" label={label} /><Input aria-label={`컨테이너 ${index + 1} ${label}`} disabled={!canWrite} className="h-10 px-3 py-0 text-right tabular-nums" value={amount} onChange={(event) => update(index, { [key]: `${event.target.value} ${unit}`.trim() })} /></div>
        <div><FormFieldHeader className="mb-2.5" label={unitLabel} />{unitSelect(unit, units, `컨테이너 ${index + 1} ${unitLabel}`, (next) => update(index, { [key]: `${amount} ${next}`.trim() }))}</div>
      </>
    )
  }
  const stacked = (values: string[], more: number) => (
    <>
      {values.map((value, index) => <div key={index} className={index ? "mt-0.5" : undefined}>{value}</div>)}
      {more > 0 ? <div className="mt-0.5 text-[var(--color-gray-5)]">외 {more}대</div> : null}
    </>
  )
  return (
    <div className="ops-screen">
    <section aria-label="포장명세서" className="ops-shipment-group">
      <div className="ops-shipment-group-heading">
        <div className="min-w-0">
          <h2 className="text-[18px] leading-[26px] font-bold text-[var(--color-gray-2)]">포장명세서</h2>
          <p className="mt-1 text-[15px] leading-[22px] text-[var(--color-gray-5)]">{lists.length ? `포장명세서 ${lists.length}건 · 컨테이너 ${containerCount}대` : "연결된 포장명세서 없음"}</p>
        </div>
        <div className="flex items-center gap-2">
          {canWrite ? (
            <Button variant="outline" size="sm" onClick={() => { const { id } = addDealManualPackingList(dealId); setOpenLists(new Set([id])); revealAddedRow(dealPackingListAnchorId(id)) }}>
              <Plus data-icon="inline-start" />
              포장명세서 추가
            </Button>
          ) : null}
          {onUpload ? (
            <Button variant="outline" size="sm" onClick={onUpload}>
              <Plus data-icon="inline-start" />
              문서 올리기
            </Button>
          ) : null}
        </div>
      </div>
        <HostTable className="ops-shipment-table" data-deal-table="packing" aria-label="포장명세서">
          <colgroup><col style={{ width: "15%" }} /><col style={{ width: "14%" }} /><col style={{ width: "14%" }} /><col style={{ width: "13%" }} /><col style={{ width: "12%" }} /><col style={{ width: "13%" }} /><col style={{ width: "11%" }} /><col style={{ width: "5%" }} /></colgroup>
          <HostTableHeader><HostTableRow>
            {["포장명세서", "연결 B/L", "컨테이너", "씰 번호", "포장 수", "총중량", "용적", ""].map((label, index) => (
              <HostTableHead key={label || index} className={cn(["포장 수", "총중량", "용적"].includes(label) && "text-right")}>
                {label || <span className="sr-only">원문</span>}
              </HostTableHead>
            ))}
          </HostTableRow></HostTableHeader>
          <HostTableBody>
            {lists.length === 0 ? (
              <HostTableRow className="hover:bg-transparent">
                <HostTableCell colSpan={8} className="px-3 py-6 text-center text-[13px] leading-[18px] text-[var(--color-gray-5)] whitespace-normal">
                  아직 연결된 포장명세서가 없습니다. 포장명세서를 올리면 컨테이너별 포장 정보가 여기에 표시됩니다.
                </HostTableCell>
              </HostTableRow>
            ) : null}
            {lists.map((list) => {
              const { document, containers } = list
              const name = document.number || document.fileName || "포장명세서 번호 미입력"
              const update = (index: number, patch: Partial<PackingContainer>) => setContainers(list, containers.map((container, containerIndex) => containerIndex === index ? { ...container, ...patch } : container))
              const linkedShipment = linkedShipmentOf(list)
              const items = document.items?.length ? document.items : [{ name: "", hsCode: "" }]
              const ciReferences = graph.invoices.filter(ci => ci.documentId === list.invoiceId).map(invoice => ({
                name: relations.invoiceFields[invoice.documentId]?.["품목"] ?? invoice.item ?? "", hsCode: invoice.hsCode ?? "", source: invoice.invoiceNumber || "CI",
              }))
              const references = [...contractItems.map(item => ({ name: item.goods, hsCode: item.hsCode, source: "계약" })), ...ciReferences]
              const issues = items.map(item => packingItemIssue(item, references))
              const saveItems = (next: PackingItem[]) => saveDealManualPackingList(dealId, document.documentId, { number: document.number ?? "", containers, items: next })
              const open = openLists.has(document.documentId)
              const shown = containers.slice(0, PACKING_ROW_CONTAINERS)
              const more = containers.length - shown.length
              return (
                <Fragment key={document.documentId}>
                  <HostTableRow id={dealPackingListAnchorId(document.documentId)} className="cursor-pointer scroll-mt-[calc(var(--deal-header-height,128px)+16px)] has-aria-expanded:[&>td]:bg-transparent!" onClick={() => toggleList(document.documentId)}>
                    <HostTableCell className={cell}>
                      <button type="button" className="flex items-center gap-1.5 text-left" aria-expanded={open} aria-label={`${name} 컨테이너별 포장 ${open ? "접기" : "열기"}`} onClick={(event) => { event.stopPropagation(); toggleList(document.documentId) }}>
                        <ChevronDown aria-hidden="true" className={cn("size-4 shrink-0 transition-transform", !open && "-rotate-90")} />
                        {name}
                      </button>
                      {issues.some(Boolean) && <StatusBadge size="sm" tone="danger">{issues.some(issue => issue.startsWith("HS 코드 불일치")) ? "HS 코드 불일치" : "품목 검토 필요"}</StatusBadge>}
                    </HostTableCell>
                    <HostTableCell className={cell} onClick={(event) => event.stopPropagation()}>
                      {linkedShipment ? (
                        <a href={`#${linkedShipment.anchor}`} className="whitespace-nowrap text-[var(--color-primary-4)] hover:underline" onClick={event => followBillLink(event, linkedShipment.anchor, linkedShipment.bill)}>{linkedShipment.label}</a>
                      ) : <span className="text-muted-foreground">B/L 대기</span>}
                    </HostTableCell>
                    <HostTableCell className={cn(cell, "whitespace-nowrap tabular-nums")}>
                      {containers.length ? stacked(shown.map((container) => container.number), more) : <span className="text-[var(--color-gray-5)]">미확인</span>}
                    </HostTableCell>
                    <HostTableCell className={cn(cell, "whitespace-nowrap tabular-nums")}>
                      {containers.length ? stacked(shown.map((container) => container.sealNumber || "미확인"), 0) : "—"}
                    </HostTableCell>
                    <HostTableCell className={cn(cell, numeric)}>{sumMeasure(containers.map((container) => container.packageCount ? `${container.packageCount} ${container.packageUnit ?? ""}` : null)) ?? "—"}</HostTableCell>
                    <HostTableCell className={cn(cell, numeric)}>{packingGrossWeight(containers, document.grossWeight) ?? "—"}</HostTableCell>
                    <HostTableCell className={cn(cell, numeric)}>{sumMeasure(containers.map((container) => container.volume)) ?? "—"}</HostTableCell>
                    <HostTableCell className={cn(cell, "text-center")} onClick={(event) => event.stopPropagation()}>
                      {document.fileName ? (
                        <Button type="button" size="icon-sm" variant="ghost-neutral" aria-label={`${name} 문서와 보기`} title={`${name} 문서와 보기`} onClick={() => openPackingList(document.fileName)}>
                          <FileSearch aria-hidden="true" className="size-4" />
                        </Button>
                      ) : null}
                    </HostTableCell>
                  </HostTableRow>
                  {open ? (
                    <HostTableRow className="hover:[&>td]:bg-transparent has-aria-expanded:[&>td]:bg-transparent!">
                      <HostTableCell colSpan={8} className="!p-0">
                        <div className="sticky left-0 w-[100cqw] p-3">
                          {/* Just one block per container, stacked, so its fields stay together when they wrap. */}
                          <div className="flex flex-col gap-3 whitespace-normal">
                              {/* No packing list title: deleting the last container removes the packing list row. */}
                              {list.manual ? (
                                <div className="w-full sm:w-[240px]"><FormFieldHeader className="mb-2.5" label="포장명세서 번호" /><Input aria-label="포장명세서 번호" disabled={!canWrite} className="h-10 px-3 py-0" value={relations.manualPackingLists[document.documentId]?.number ?? ""} onChange={(event) => saveDealManualPackingList(dealId, document.documentId, { number: event.target.value, containers })} /></div>
                              ) : null}
                              <section className="space-y-2" aria-label={name + " 포장 품목"}>
                                <div className="flex items-center justify-between">
                                  <h3 className="text-sm font-semibold">포장 품목</h3>
                                  {canWrite && <Button variant="outline" size="sm" onClick={() => saveItems([...items, { name: "", hsCode: "" }])}><Plus data-icon="inline-start" />품목 추가</Button>}
                                </div>
                                {items.map((item, index) => (
                                  <div key={index} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2">
                                    <label className="min-w-0 space-y-1 text-sm">품목명<Input aria-label={`품목 ${index + 1} 품목명`} disabled={!canWrite} value={item.name} onChange={event => saveItems(items.map((row, i) => i === index ? { ...row, name: event.target.value } : row))} /></label>
                                    <label className="min-w-0 space-y-1 text-sm">HS 코드<Input aria-label={`품목 ${index + 1} HS 코드`} disabled={!canWrite} value={item.hsCode} aria-invalid={Boolean(issues[index] && item.name.trim())} onChange={event => saveItems(items.map((row, i) => i === index ? { ...row, hsCode: event.target.value } : row))} /></label>
                                    {canWrite && items.length > 1 && <Button variant="ghost" size="icon-sm" aria-label={`품목 ${index + 1} 삭제`} onClick={() => saveItems(items.filter((_, i) => i !== index))}><Trash2 /></Button>}
                                    {issues[index] && <p className="col-span-full text-[13px] text-destructive">{issues[index]}</p>}
                                  </div>
                                ))}
                              </section>
                              {containers.map((container, index) => (
                                // Same layout as the item card: title, row 1 (identity · packages), separator, row 2 (weight · volume with unit selects).
                                <div key={index} id={dealContainerAnchorId(container.number)} className="@container/pl flex scroll-mt-[calc(var(--deal-header-height,128px)+16px)] flex-col gap-3.5 rounded-xl border border-[var(--color-gray-9)] bg-card p-4">
                                  <div className="flex items-center gap-2">
                                    <h5 className="min-w-0 flex-1 text-base leading-6 font-bold">컨테이너 {index + 1}</h5>
                                    {canWrite ? <ConfirmDeleteButton label={`컨테이너 ${index + 1}`} description={containers.length > 1 ? `${container.number || "번호 미입력"} 컨테이너의 입력 정보를 지웁니다.` : list.manual ? "마지막 컨테이너라 포장명세서 행도 함께 지웁니다." : `마지막 컨테이너라 ${name}이(가) 이 거래에서 빠집니다. 원본 문서는 문서함에 남습니다.`} onConfirm={() => {
                                      if (containers.length > 1) setContainers(list, containers.filter((_, containerIndex) => containerIndex !== index))
                                      else if (list.manual) removeDealManualPackingList(dealId, document.documentId)
                                      else removeDealDocument(dealId, document.documentId)
                                    }} /> : null}
                                  </div>
                                  <div className="grid grid-cols-2 items-start gap-3 @min-[760px]/pl:grid-cols-[minmax(0,1fr)_140px_minmax(0,1fr)_240px] [&>div]:min-w-0">
                                    <div className="col-span-2 @min-[760px]/pl:col-span-1"><FormFieldHeader className="mb-2.5" label="컨테이너 번호" />{textInput(update, index, container, "number", "컨테이너 번호")}</div>
                                    <div><FormFieldHeader className="mb-2.5" label="규격" />{unitSelect(container.containerType ?? "", ["20GP", "40GP", "40HC", "45HC", "20RF", "40RF", "20OT", "40OT"], `컨테이너 ${index + 1} 규격`, (next) => update(index, { containerType: next }))}</div>
                                    <div className="col-span-2 @min-[760px]/pl:col-span-1"><FormFieldHeader className="mb-2.5" label="씰 번호" />{textInput(update, index, container, "sealNumber", "씰 번호")}</div>
                                    <div className="col-span-2 @min-[760px]/pl:col-span-1"><FormFieldHeader className="mb-2.5" label="포장 수 / 단위" /><div className="flex gap-2"><div className="min-w-0 flex-1">{textInput(update, index, container, "packageCount", "포장 수", "text-right")}</div><div className="w-32 shrink-0">{unitSelect(container.packageUnit ?? "bundles", ["bundles", "cartons", "pallets"], `컨테이너 ${index + 1} 포장 단위`, (unit) => update(index, { packageUnit: unit }))}</div></div></div>
                                  </div>
                                  <div className="h-px bg-[var(--color-gray-10)]" role="separator" />
                                  <div className="grid grid-cols-2 items-start gap-3 @min-[760px]/pl:grid-cols-[minmax(0,1fr)_140px_minmax(0,1fr)_140px] [&>div]:min-w-0">
                                    {measureFields(update, index, container, "grossWeight", "총중량", "중량 단위", ["KG", "MT", "LB"])}
                                    {measureFields(update, index, container, "volume", "용적", "용적 단위", ["CBM", "CFT"])}
                                  </div>
                                </div>
                              ))}
                              {canWrite ? (
                                <Button type="button" size="sm" variant="outline" className="self-start" onClick={() => {
                                  const source = containers[0]
                                  setContainers(list, [...containers, {
                                    number: "",
                                    sealNumber: "",
                                    containerType: source?.containerType ?? "",
                                    packageCount: source?.packageCount ?? "",
                                    packageUnit: source?.packageUnit ?? "bundles",
                                    grossWeight: source?.grossWeight ?? "",
                                    volume: source?.volume ?? "",
                                  }])
                                }}>
                                  <Plus data-icon="inline-start" />
                                  컨테이너 추가
                                </Button>
                              ) : null}
                              <DealLinkedDocuments code="PL" id={document.documentId} name={name} dealId={dealId} view={view} graph={graph} relations={relations} canWrite={canWrite} />
                          </div>
                        </div>
                      </HostTableCell>
                    </HostTableRow>
                  ) : null}
                </Fragment>
              )
            })}
          </HostTableBody>
        </HostTable>
    </section>
    </div>
  )
}

function CommercialInvoiceTransactionCard({
  dealId,
  financeStarted,
  view,
  canWrite = true,
}: {
  dealId: string
  view: SplitShipmentView
  financeStarted: boolean
  canWrite?: boolean
}) {
  const [expanded, setExpanded] = useState<Set<string>>(
    // Table rows start folded; only CIs still waiting for a B/L open so the
    // link action is visible without an extra click. Packing lists are the
    // content of an opened B/L row, so they start open inside it.
    () => openedInvoiceRows.get(dealId) ?? new Set([
      // The first CI row starts open.
      ...[view.billsOfLading.flatMap((bill) => bill.connectedCommercialInvoices)[0]?.documentId ?? view.unlinkedDocuments[0]?.documentId].filter((id): id is string => Boolean(id)),
      ...view.unlinkedDocuments.map((invoice) => invoice.documentId),
      ...view.billsOfLading.flatMap((bill) => (bill.connectedDocuments ?? []).filter((document) => document.code === "PL").map((document) => `PL:${document.documentId}`)),
    ])
  )
  useEffect(() => { openedInvoiceRows.set(dealId, expanded) }, [dealId, expanded])
  const [relationState, setRelationState] = useState(() => readDealInvoiceRelations(dealId))
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>(() => relationState.invoiceFields)
  const [saleInvoiceId, setSaleInvoiceId] = useState<string | null>(null)
  const [saleDraft, setSaleDraft] = useState({ amount: "", currency: "KRW", customer: "", date: new Date().toISOString().slice(0, 10), evidence: "" })
  const [registeredSales, setRegisteredSales] = useState<Record<string, DealSale>>(() =>
    Object.fromEntries(readDealSales(dealId).map((sale) => [sale.invoiceId, sale]))
  )
  useEffect(() => {
    const next = readDealInvoiceRelations(dealId)
    setRelationState(next)
    setDrafts(next.invoiceFields)
  }, [dealId])
  useEffect(() => {
    const handleSalesChange = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== dealId) return
      setRegisteredSales(Object.fromEntries(readDealSales(dealId).map((sale) => [sale.invoiceId, sale])))
    }
    window.addEventListener(saleChangeEvent, handleSalesChange)
    return () => window.removeEventListener(saleChangeEvent, handleSalesChange)
  }, [dealId])
  const graph = useMemo(() => dealDocumentLinks(view, relationState), [view, relationState])
  const records = graph.invoices.map(invoice => ({ invoice, billOfLadingIds: invoice.links }))
  const toggle = (id: string) => setExpanded((current) => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
  useEffect(() => {
    const reread = (event: Event) => { if ((event as CustomEvent<string>).detail === dealId) setRelationState(readDealInvoiceRelations(dealId)) }
    window.addEventListener("ecoya:deal-relations-changed", reread)
    return () => window.removeEventListener("ecoya:deal-relations-changed", reread)
  }, [dealId])
  useEffect(() => {
    const open = (event: Event) => {
      const invoiceId = (event as CustomEvent<string>).detail
      setExpanded((current) => current.has(invoiceId) ? current : new Set([...current, invoiceId]))
    }
    window.addEventListener("ecoya:open-invoice-row", open)
    return () => window.removeEventListener("ecoya:open-invoice-row", open)
  }, [])
  const updateDraft = (invoiceId: string, field: string, value: string) => {
    setDrafts((current) => ({ ...current, [invoiceId]: { ...current[invoiceId], [field]: value } }))
    setRelationState(saveDealInvoiceField(dealId, invoiceId, field, value))
  }
  const billById = new Map(view.billsOfLading.map((bill) => [bill.documentId, bill]))
  const rounding = useAmountRoundings(dealId)
  // The 판매 내역 table exists only once 정산 has started (정산 중 · 정산 완료).
  return (
    <Card className="gap-0 px-5 py-4" aria-label="CI 결제정보">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">CI 결제정보</h2>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge tone="info">{records.length}건</StatusBadge>
          {canWrite ? (
            <Button size="sm" variant="outline" onClick={() => {
              const { state, id } = addDealManualInvoice(dealId)
              setRelationState(state)
              setExpanded(new Set([id]))
              revealAddedRow(dealInvoiceAnchorId(id))
            }}>
              <Plus data-icon="inline-start" />
              CI 추가
            </Button>
          ) : null}
        </div>
      </div>
      {(
        <div className="ops-screen mt-4" role="region" aria-label="CI 목록">
          <HostTable className="ops-shipment-table text-left" data-deal-table="invoices" aria-label="CI 결제정보">
            <colgroup><col style={{ width: "16%" }} /><col style={{ width: "18%" }} /><col style={{ width: "10%" }} /><col style={{ width: "11%" }} /><col style={{ width: "11%" }} /><col style={{ width: "14%" }} /><col style={{ width: "15%" }} /><col style={{ width: "5%" }} /></colgroup>
            <HostTableHeader>
              <HostTableRow>
                {["송장번호", "품목", "수량", "단가", "포장", "통화·금액", "연결 선적", ""].map((label, index) => <HostTableHead key={label || index} className="text-left">{label}</HostTableHead>)}
              </HostTableRow>
            </HostTableHeader>
            <HostTableBody>
              {records.map(({ invoice, billOfLadingIds }) => {
                const isOpen = expanded.has(invoice.documentId)
                // An opened CI shows its inputs directly, like the item table.
                const isEditing = canWrite && isOpen
                const draft = drafts[invoice.documentId] ?? {}
                const value = (field: string, fallback: string) => draft[field] ?? fallback
                const linkedBills = billOfLadingIds.map((id) => billById.get(id)).filter(Boolean)
                // Shipments without a B/L document, linked by hand from the shipment row.
                const linkedShipments = billOfLadingIds.filter((id) => id.startsWith("shipment:")).map((id) => ({ id: id.slice("shipment:".length), label: relationState.shipmentLabels[id] || "B/L 번호 미확인" }))
                const linkedCount = linkedBills.length + linkedShipments.length
                const saleAvailable = true
                const packageText = invoice.packageCount && invoice.packageUnit ? `${invoice.packageCount} ${invoice.packageUnit}` : invoice.packageCount ?? invoice.packageUnit ?? ""
                const amountText = invoice.currency && invoice.totalAmount != null ? `${invoice.currency} ${invoice.totalAmount.toLocaleString()}` : invoice.currency ?? ""
                return (
                  <Fragment key={invoice.documentId}>
                    <HostTableRow id={dealInvoiceAnchorId(invoice.documentId)} className="cursor-pointer scroll-mt-[calc(var(--deal-header-height,128px)+16px)] has-aria-expanded:[&>td]:bg-transparent!" onClick={() => toggle(invoice.documentId)}>
                      <HostTableCell className="px-3 py-3 align-top">
                        <button type="button" className="flex items-center gap-2 text-left" aria-expanded={isOpen} aria-label={`${invoice.invoiceNumber || invoice.fileName} ${isOpen ? "접기" : "펼치기"}`} onClick={(event) => { event.stopPropagation(); toggle(invoice.documentId) }}>
                          <ChevronDown className={cn("size-4 shrink-0 transition-transform", !isOpen && "-rotate-90")} aria-hidden="true" />
                          <span className="min-w-0">
                            <strong className="block whitespace-nowrap text-sm">{value("송장번호", invoice.invoiceNumber ?? "") || invoice.fileName || "송장번호 미입력"}</strong>
                            <span className="block text-[11px] text-muted-foreground">
                              {value("송장일자", invoice.invoiceDate ?? "") || "송장일자 미확인"}
                              {/* Registration status only (no amount, no badge); keeps the row at two lines. */}
                              {registeredSales[invoice.documentId] ? <span className="text-[var(--color-green-1)]"> · 판매 등록</span> : null}
                            </span>
                          </span>
                        </button>
                      </HostTableCell>
                      <HostTableCell className="max-w-[200px] px-3 py-3 align-top"><span className="block truncate" title={value("품목", invoice.item ?? "")}>{value("품목", invoice.item ?? "") || "—"}</span></HostTableCell>
                      <HostTableCell className="whitespace-nowrap px-3 py-3 align-top tabular-nums">{value("수량", invoice.quantity ?? "") || "—"}</HostTableCell>
                      <HostTableCell className="whitespace-nowrap px-3 py-3 align-top tabular-nums">{value("단가", invoice.unitPrice ?? "") || "—"}</HostTableCell>
                      <HostTableCell className="whitespace-nowrap px-3 py-3 align-top">{value("포장 수 / 단위", packageText) || "—"}</HostTableCell>
                      <HostTableCell className="whitespace-nowrap px-3 py-3 align-top text-right tabular-nums">
                        {roundedAmountText(value("통화·금액", amountText), rounding.read(`ci:${invoice.documentId}`)) || "—"}
                      </HostTableCell>
                      <HostTableCell className="px-3 py-3 align-top">
                        {linkedCount ? <>
                          {linkedBills.map((bill) => bill ? (
                            <a key={bill.documentId} href={`#${dealBillAnchorId(bill.documentId)}`} className="block whitespace-nowrap text-[13px] leading-[18px] text-[var(--color-primary-4)] hover:underline" onClick={(event) => { event.stopPropagation(); followBillLink(event, dealBillAnchorId(bill.documentId), bill) }}>{bill.blNumber || "B/L 번호 미확인"}</a>
                          ) : null)}
                          {linkedShipments.map((shipment) => (
                            <a key={shipment.id} href={`#${dealShipmentAnchorId(shipment.id)}`} className="block whitespace-nowrap text-[13px] leading-[18px] text-[var(--color-primary-4)] hover:underline" onClick={(event) => { event.stopPropagation(); openShipmentRowByAnchor(dealShipmentAnchorId(shipment.id)) }}>{shipment.label}</a>
                          ))}
                        </> : <StatusBadge size="sm" tone="neutral">B/L 대기</StatusBadge>}
                      </HostTableCell>
                      <HostTableCell className="w-12 cursor-default px-2 py-2 text-center align-top" onClick={(event) => event.stopPropagation()}>
                        {invoice.onOpen ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button type="button" size="icon-sm" variant="ghost-neutral" aria-label={`${invoice.invoiceNumber || invoice.fileName} 문서와 보기`} onClick={invoice.onOpen}><FileSearch aria-hidden="true" className="size-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent>문서와 보기</TooltipContent>
                          </Tooltip>
                        ) : null}
                      </HostTableCell>
                    </HostTableRow>
                    {isOpen ? (
                      <HostTableRow className="hover:[&>td]:bg-transparent has-aria-expanded:[&>td]:bg-transparent!">
                        <HostTableCell colSpan={8} className="!p-0 whitespace-normal">
                {/* Three groups: invoice fields, linked documents, one-line sales row. */}
                <div className="sticky left-0 flex w-[100cqw] flex-col gap-3 p-3">
                <div className="@container/ci flex flex-col gap-3.5 rounded-xl border border-[var(--color-gray-9)] bg-card p-4">
                  {/* Same layout as the item card: title row, row 1 (identity), separator, row 2 (quantities with unit selects). */}
                  <div className="flex items-center gap-2">
                    <h5 className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 text-base leading-6 font-bold">송장 정보<span className="min-w-0 truncate text-xs font-normal text-[var(--color-gray-5)]">{invoice.fileName ? `${invoice.fileName} · ${invoice.uploadedAt}` : "직접 입력 · 문서 없음"}</span></h5>
                    {/* Only delete in the title row, like the item card; 원문 보기 stays on the table row. */}
                    {canWrite ? <ConfirmDeleteButton label="CI" description={invoice.fileName ? `${invoice.invoiceNumber || invoice.fileName}을(를) 이 거래에서 뺍니다. 원본 문서는 문서함에 남습니다.` : "직접 추가한 CI와 입력한 정보, 연결을 지웁니다."} onConfirm={() => { setRelationState(invoice.fileName ? removeDealDocument(dealId, invoice.documentId) : removeDealManualInvoice(dealId, invoice.documentId)); setExpanded((current) => { const next = new Set(current); next.delete(invoice.documentId); return next }) }} /> : null}
                  </div>
                  {(() => {
                    const name = invoice.invoiceNumber ?? invoice.fileName
                    const pageChip = (label: string) => (invoice.pageCount ?? 1) > 1 ? <button type="button" className="text-[11px] leading-4 text-[var(--color-gray-6)] underline-offset-2 hover:text-[var(--color-primary-4)] hover:underline" aria-label={`${label} 근거 ${invoice.fieldPages?.[label] ?? 1}페이지 보기`} onClick={() => { requestDocumentPage(invoice.fileName, invoice.fieldPages?.[label] ?? 1); invoice.onOpen?.() }}>p.{invoice.fieldPages?.[label] ?? 1}</button> : undefined
                    const header = (label: string, shown = label, extra?: React.ReactNode) => <FormFieldHeader className="mb-2.5" label={shown} badge={pageChip(label)} sourceAction={extra} />
                    const readOnly = (text: string) => <div className="flex min-h-10 items-center rounded-md bg-muted/30 px-3 text-sm font-medium">{text || "—"}</div>
                    // Stored as one text per field ("2 MT", "USD 256,600"); edited as number + unit.
                    const tail = (text: string) => { const match = text.trim().match(/^(.*?)\s*([A-Za-z]+)?$/); return { amount: match?.[1] ?? "", unit: match?.[2] ?? "" } }
                    const quantity = tail(value("수량", invoice.quantity ?? ""))
                    const quantityUnit = quantity.unit || "MT"
                    const price = value("단가", invoice.unitPrice ?? "").replace(/\s*[A-Za-z]+\/[A-Za-z]+$/, "")
                    const amountText = value("통화·금액", invoice.currency && invoice.totalAmount != null ? `${invoice.currency} ${invoice.totalAmount.toLocaleString()}` : invoice.currency ?? "")
                    const currencyMatch = amountText.trim().match(/^([A-Z]{3})?\s*(.*)$/)
                    const currency = currencyMatch?.[1] || invoice.currency || "USD"
                    const amount = currencyMatch?.[2] ?? ""
                    const packages = tail(value("포장 수 / 단위", invoice.packageCount && invoice.packageUnit ? `${invoice.packageCount} ${invoice.packageUnit}` : invoice.packageCount ?? invoice.packageUnit ?? ""))
                    const packageUnit = packages.unit || "bundles"
                    const set = (label: string, next: string) => updateDraft(invoice.documentId, label, next)
                    const textInput = (label: string, current: string, onChange: (next: string) => void, numeric = false) => isEditing
                      ? <Input aria-label={`${name} ${label}`} value={current} onChange={(event) => onChange(event.target.value)} className={cn("h-10 px-3 py-0", numeric && "text-right tabular-nums")} inputMode={numeric ? "decimal" : "text"} />
                      : readOnly(current)
                    const unitSelect = (label: string, current: string, options: string[], onChange: (next: string) => void) => isEditing ? (
                      <Select value={current} onValueChange={(next) => onChange(next ?? "")}>
                        <SelectTrigger size="sm" aria-label={`${name} ${label}`} className="w-full gap-1 px-3 py-0 data-[size=sm]:h-10 data-[size=sm]:text-[length:var(--text-body-6)] data-[size=sm]:leading-[var(--leading-body-6)]"><SelectValue /></SelectTrigger>
                        <SelectContent className="z-[var(--z-popup)]">{[...new Set([current, ...options])].filter(Boolean).map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : readOnly(current)
                    return (
                      <>
                        <div className="grid grid-cols-1 items-start gap-3 @min-[480px]/ci:grid-cols-2 @min-[760px]/ci:grid-cols-[200px_200px_minmax(0,1fr)] [&>div]:min-w-0">
                          <div>{header("송장번호")}{textInput("송장번호", value("송장번호", invoice.invoiceNumber ?? ""), (next) => set("송장번호", next))}</div>
                          <div>{header("송장일자")}{isEditing ? <DatePicker ariaLabel={`${name} 송장일자`} value={value("송장일자", invoice.invoiceDate ?? "").replaceAll(".", "-")} onValueChange={(next) => set("송장일자", next.replaceAll("-", "."))} className="w-full" /> : readOnly(value("송장일자", invoice.invoiceDate ?? ""))}</div>
                          <div className="col-span-1 @min-[480px]/ci:col-span-2 @min-[760px]/ci:col-span-1">{header("품목")}{textInput("품목", value("품목", invoice.item ?? ""), (next) => set("품목", next))}</div>
                        </div>
                        <div className="h-px bg-[var(--color-gray-10)]" role="separator" />
                        <div className="grid grid-cols-2 items-start gap-3 @min-[760px]/ci:grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)_minmax(0,1fr)] [&>div]:min-w-0">
                          <div className="col-span-2 @min-[480px]/ci:col-span-1 @min-[760px]/ci:col-span-1">{header("수량", "수량 / 단위")}<div className="flex gap-2"><div className="min-w-0 flex-1">{textInput("수량", quantity.amount, (next) => set("수량", `${next} ${quantityUnit}`.trim()), true)}</div><div className="w-28 shrink-0">{unitSelect("수량 단위", quantityUnit, ["MT", "KG", "EA"], (next) => set("수량", `${quantity.amount} ${next}`.trim()))}</div></div></div>
                          <div>{header("단가", `단가 · ${currency}/${quantityUnit}`)}{textInput("단가", price, (next) => set("단가", `${next} ${currency}/${quantityUnit}`.trim()), true)}</div>
                          <div className="col-span-2 @min-[480px]/ci:col-span-1 @min-[760px]/ci:col-span-1">{header("포장 수 / 단위")}<div className="flex gap-2"><div className="min-w-0 flex-1">{textInput("포장 수", packages.amount, (next) => set("포장 수 / 단위", `${next} ${packageUnit}`.trim()), true)}</div><div className="w-32 shrink-0">{unitSelect("포장 단위", packageUnit, ["bundles", "cartons", "pallets"], (next) => set("포장 수 / 단위", `${packages.amount} ${next}`.trim()))}</div></div></div>
                          <div className="col-span-2 @min-[480px]/ci:col-span-1 @min-[760px]/ci:col-span-1">{header("통화·금액", "통화 · 금액", <AmountRoundingSelect label={`${name} 금액 처리 방식`} value={rounding.read(`ci:${invoice.documentId}`)} disabled={!canWrite} onValueChange={(mode) => rounding.write(`ci:${invoice.documentId}`, mode)} />)}<div className="flex gap-2"><div className="w-24 shrink-0">{unitSelect("통화", currency, ["USD", "KRW", "EUR", "JPY", "CNY"], (next) => set("통화·금액", `${next} ${amount}`.trim()))}</div><div className="min-w-0 flex-1">{textInput("금액", isEditing ? amount : roundedDealTotal(amount, currency, rounding.read(`ci:${invoice.documentId}`)), (next) => set("통화·금액", `${currency} ${next}`.trim()), true)}</div></div></div>
                        </div>
                      </>
                    )
                  })()}
                </div>
                  <DealLinkedDocuments code="CI" id={invoice.documentId} name={invoice.invoiceNumber || invoice.fileName || "상업송장"} dealId={dealId} view={view} graph={graph} relations={relationState} canWrite={canWrite} />
                    <div className="@container/sale flex items-center justify-between gap-3 rounded-xl border border-[var(--color-gray-9)] bg-card px-4 py-2.5">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                        <h3 className="text-sm font-semibold">판매 정보</h3>
                        {registeredSales[invoice.documentId] && !financeStarted ? (
                          // 정산 not started yet: its 판매 내역 table is not shown, so plain text.
                          <span className="min-w-0 truncate text-sm text-[var(--color-gray-4)]">
                            <SaleSummary sale={registeredSales[invoice.documentId]} />
                          </span>
                        ) : registeredSales[invoice.documentId] ? (
                          // Registered sale: a link to its row in 정산 › 판매 내역.
                          <a
                            href={`#${dealSaleAnchorId(invoice.documentId)}`}
                            className="min-w-0 truncate text-sm text-[var(--color-primary-4)] hover:underline"
                            onClick={(event) => {
                              event.preventDefault()
                              window.dispatchEvent(new CustomEvent("ecoya:open-deal-sale", { detail: invoice.documentId }))
                            }}
                          >
                            <SaleSummary sale={registeredSales[invoice.documentId]} />
                          </a>
                        ) : null}
                      </div>
                      <Button type="button" size="xs" variant="outline" disabled={!saleAvailable} onClick={() => { setSaleInvoiceId(invoice.documentId); setSaleDraft(registeredSales[invoice.documentId] ?? { amount: "", currency: "KRW", customer: "", date: new Date().toISOString().slice(0, 10), evidence: invoice.invoiceNumber ?? invoice.fileName }) }}><Plus data-icon="inline-start" />{registeredSales[invoice.documentId] ? "판매 정보 수정" : "판매 등록"}</Button>
                        <AlertDialog open={saleInvoiceId === invoice.documentId} onOpenChange={(open) => { if (!open) setSaleInvoiceId(null) }}>
                          <AlertDialogContent className="w-[min(720px,calc(100vw-32px))] !max-w-[min(720px,calc(100vw-32px))]">
                            <AlertDialogHeader><AlertDialogTitle>판매 등록</AlertDialogTitle><AlertDialogDescription>{invoice.invoiceNumber ?? invoice.fileName}의 판매 정보를 입력합니다.</AlertDialogDescription></AlertDialogHeader>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <label className="grid gap-1.5 text-sm"><span>판매 금액</span><div className="flex gap-2"><Input inputMode="decimal" numericFormat="amount" value={saleDraft.amount} onChange={(event) => setSaleDraft({ ...saleDraft, amount: event.target.value })} /><Select value={saleDraft.currency} onValueChange={(value) => setSaleDraft({ ...saleDraft, currency: value ?? "KRW" })}><SelectTrigger className="w-24"><SelectValue /></SelectTrigger><SelectContent className="z-[calc(var(--z-alert-dialog)+1)]">{["KRW", "USD", "EUR", "JPY", "CNY"].map((currency) => <SelectItem key={currency} value={currency}>{currency}</SelectItem>)}</SelectContent></Select></div></label>
                              <label className="grid gap-1.5 text-sm"><span>판매일</span><DatePicker ariaLabel={`${invoice.invoiceNumber ?? invoice.fileName} 판매일`} value={saleDraft.date} onValueChange={(date) => setSaleDraft({ ...saleDraft, date })} className="w-full" /></label>
                              <label className="grid gap-1.5 text-sm"><span>판매처</span><Input placeholder="판매처 입력" value={saleDraft.customer} onChange={(event) => setSaleDraft({ ...saleDraft, customer: event.target.value })} /></label>
                              <div className="grid gap-1.5 text-sm"><span>판매 근거</span><p className="rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{saleDraft.evidence}</p></div>
                            </div>
                            <AlertDialogFooter><AlertDialogCancel>취소</AlertDialogCancel><AlertDialogAction disabled={!isFinanceDecimal(normalizeSaleAmount(saleDraft.amount)) || !saleDraft.customer.trim()} onClick={() => {
                              const existing = registeredSales[invoice.documentId]
                              const nextSale: DealSale = {
                                id: existing?.id ?? crypto.randomUUID(),
                                invoiceId: invoice.documentId,
                                invoiceNumber: invoice.invoiceNumber ?? invoice.fileName,
                                amount: normalizeSaleAmount(saleDraft.amount),
                                currency: saleDraft.currency,
                                date: saleDraft.date,
                                customer: saleDraft.customer.trim(),
                                evidence: invoice.invoiceNumber ?? invoice.fileName,
                              }
                              const nextSales = [...readDealSales(dealId).filter((sale) => sale.invoiceId !== invoice.documentId), nextSale]
                              writeDealSales(dealId, nextSales)
                              setSaleInvoiceId(null)
                            }}>저장</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
                        </HostTableCell>
                      </HostTableRow>
                    ) : null}
                  </Fragment>
                )
              })}
            </HostTableBody>
          </HostTable>
        </div>
      )}
    </Card>
  )
}

const workPreviewFields: Record<DealWorkKey, string[]> = {
  documents: ["품목·수량·단가", "거래처·계약번호", "인코텀즈·지급조건"],
  fulfillment: ["계약·선적·잔여 수량", "B/L·선박·항구", "출항일·도착 예정일"],
  customs: ["수출입 신고서", "신고번호·신고일", "통관 진행 상태"],
  finance: ["송장·통화·지급조건", "받을 돈·줄 돈·적용액", "부대비용·거래손익"],
}
function DealWorkBlock({
  work,
  plan,
  customsControl,
  previewOpen,
  onPreview,
  onStart,
  onOpenDocument,
  canWrite,
  children,
}: {
  work: DealWorkKey
  customsControl: ReactNode
  plan: DealWorkPlan
  previewOpen: boolean
  onPreview: (key: DealWorkKey) => void
  onStart: (key: DealWorkKey) => void
  onOpenDocument?: (key: DealWorkKey) => void
  canWrite: boolean
  children: ReactNode
}) {
  const state = plan.states[work]
  const customsSetting = work === "customs" ? customsControl : null
  const canCompareDocument = work !== "finance" && work !== "customs" && Boolean(onOpenDocument)
  const showPlannedDocumentAction = state === "planned" && canCompareDocument
  if (state !== "planned")
    return (
      <div
        data-work-section={work}
        id={state === "skipped" ? workIds[work] : undefined}
        data-work-state={state}
        className="min-w-0 space-y-3"
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-3">
          <span
            className={cn(
              "text-sm font-semibold tabular-nums",
              plan.current === work ? "text-primary" : "text-muted-foreground"
            )}
          >
            {
              {
                documents: "01",
                fulfillment: "02",
                customs: "03",
                finance: "04",
              }[work]
            }
          </span>
          <h2 className="text-lg font-semibold">{workLabels[work]}</h2>
          <StatusBadge tone={state === "skipped" ? "neutral" : state === "complete" ? "success" : "blue"}>
            {state === "skipped" ? "해당 없음" : state === "complete"
              ? "완료"
              : plan.current === work
                ? "현재 할 일"
                : "진행 중"}
          </StatusBadge>
          {/* Title → label → description; the current stage describes its next action. */}
          <p className="min-w-0 truncate pl-1 text-xs font-normal text-muted-foreground">
            {state !== "skipped" && (plan.current === work ? plan.nextAction : documentStageGuidance[work])}
          </p>
          {customsSetting}
        </div>
        {state !== "skipped" && children}
      </div>
    )
  return (
    <section
      id={workIds[work]}
      data-work-section={work}
      data-work-state="planned"
      tabIndex={-1}
      className="min-w-0 scroll-mt-[calc(var(--deal-header-height,128px)+16px)] outline-none"
    >
      <div className="flex flex-wrap items-center gap-3 pt-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-sm font-semibold tabular-nums text-muted-foreground">{{ documents: "01", fulfillment: "02", customs: "03", finance: "04" }[work]}</span>
          <h2 className="text-lg font-semibold">{workLabels[work]}</h2>
          <StatusBadge>예정</StatusBadge>
          <p className="min-w-0 truncate text-xs text-muted-foreground">
            {documentStageGuidance[work]}
          </p>
        </div>
        {customsSetting}
        {showPlannedDocumentAction ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onOpenDocument?.(work)}
          >
            <FileSearch data-icon="inline-start" />
            문서와 보기
          </Button>
        ) : null}
        <DealDisclosureButton expanded={previewOpen} onClick={() => onPreview(work)} label={workLabels[work]} collapsedLabel="미리 보기" controls={`planned-${work}`} />
        {canWrite && (
          <Button size="sm" variant="outline" onClick={() => onStart(work)}>
            직접 입력
          </Button>
        )}
      </div>
      {previewOpen && (
        <Card id={`planned-${work}`} className="mt-3 gap-0 bg-card p-5 shadow-[var(--shadow-section)]">
          <p className="text-xs text-muted-foreground">
            업무가 시작되면 아래 정보를 확인하고 입력합니다.
          </p>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            {workPreviewFields[work].map((label) => (
              <li
                key={label}
                className="border-l-2 border-primary/15 px-3 py-2"
              >
                {label}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  )
}

function DealDocumentPanels({
  plan,
  customsControl,
  aiQuestion,
  linkedDeals,
  workspaces,
  previewWork,
  onPreviewWork,
  onStartWork,
  onOpenDocument,
  canWrite,
  profile,
  commercialInvoiceContent,
  documentStrip,
  primary,
  preview,
  documentOpen,
  documentPanelTarget,
  onDocumentOpenChange,
  failedPanel,
  onRetry,
}: {
  customsControl: ReactNode
  plan: DealWorkPlan
  aiQuestion: ReactNode
  linkedDeals: ReactNode
  workspaces: Partial<Record<DealWorkKey, ReactNode>>
  previewWork: DealWorkKey[]
  onPreviewWork: (key: DealWorkKey) => void
  onStartWork: (key: DealWorkKey) => void
  onOpenDocument?: (key: DealWorkKey) => void
  canWrite: boolean
  profile: DealProfile
  commercialInvoiceContent: ReactNode
  documentStrip: ReactNode
  primary: ReactNode
  preview: ReactNode
  documentOpen: boolean
  documentPanelTarget: HTMLElement | null
  onDocumentOpenChange: (open: boolean) => void
  failedPanel: Tab | null
  onRetry: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!documentOpen || !documentPanelTarget) return
    if (documentPanelTarget.closest('[role="dialog"]')) {
      closeRef.current?.focus({ preventScroll: true })
      return
    }
    const returnFocus = editButtonRef.current
    return () => {
      returnFocus?.focus({ preventScroll: true })
    }
  }, [documentOpen, documentPanelTarget])
  const editButtonRef = useRef<HTMLButtonElement>(null)
  return (
    <div className="space-y-5">
      <section
        id="deal-overview"
        tabIndex={-1}
        aria-label="거래 전체 정보"
        data-common-deal-information
        className="scroll-mt-[calc(var(--deal-header-height,128px)+16px)] space-y-4 outline-none"
      >
        {/* Same no-header Card surface as 거래 경제: white, radius 12, section shadow. */}
        <Card className="gap-0 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">거래 요약 브리프</h2>
            {aiQuestion}
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {profile.counterparty} · {profile.title}.{" "}
            {plan.current
              ? `다음 작업: ${plan.nextAction}`
              : "거래 업무가 완료되었습니다."}
          </p>
          <div className="mt-4 border-t pt-3" aria-label="거래 서류 요약">
            <p className="text-xs font-semibold text-foreground">거래 서류</p>
            {documentStrip}
          </div>
          {linkedDeals}
        </Card>
      </section>
      {plan.order.map((work) => (
        <DealWorkBlock
          customsControl={customsControl}
          key={work}
          work={work}
          plan={plan}
          previewOpen={previewWork.includes(work)}
          onPreview={onPreviewWork}
          onStart={onStartWork}
          onOpenDocument={onOpenDocument}
          canWrite={canWrite}
        >
          {work === "documents" ? (
            <>
              <section
                id="deal-documents"
                aria-label="거래 상세 정보"
                tabIndex={-1}
                // Title, document tabs and the detail editor share one card; the
                // editor drops its own card chrome so cards are not nested.
                className="min-w-0 scroll-mt-[calc(var(--deal-header-height,128px)+16px)] rounded-[var(--r-lg)] bg-[var(--color-gray-12)] px-5 pt-5 pb-1 shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)] outline-none"
              >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">거래 상세 정보</h2>
                <Button
                  ref={editButtonRef}
                  variant="outline"
                  size="sm"
                  aria-haspopup="dialog"
                  onClick={() => onDocumentOpenChange(true)}
                >
                  <FileSearch data-icon="inline-start" />
                  문서와 보기
                </Button>
              </div>
              {failedPanel === "documents" ? (
                <PanelFailure title="상세" onRetry={onRetry} />
              ) : (
                <div>
                  <PdfPanelWorkspaceCard className="-mx-5 rounded-none bg-transparent shadow-none ring-0">{primary}</PdfPanelWorkspaceCard>
                </div>
              )}
              </section>
              {commercialInvoiceContent}
            </>
          ) : failedPanel === work ? (
            <PanelFailure title={workLabels[work]} onRetry={onRetry} />
          ) : (
            <>
              {workspaces[work]}
            </>
          )}
        </DealWorkBlock>
      ))}
      {documentOpen && documentPanelTarget &&
        createPortal(
          <section
            role="region"
            aria-label="문서 보기"
            aria-describedby="deal-comparison-description"
            data-deal-comparison
            className="flex h-full min-w-0 flex-col overflow-hidden bg-background animate-in slide-in-from-right duration-200"
            onKeyDown={(event) => {
              if (
                event.key === "Escape" &&
                !event.defaultPrevented &&
                !document.querySelector(
                  '[data-slot="select-content"], [data-slot="popover-content"]'
                )
              ) {
                event.preventDefault()
                onDocumentOpenChange(false)
              }
            }}
          >
            <div className="flex min-h-[72px] shrink-0 items-center justify-between gap-4 border-b px-4 sm:px-6">
              <div className="space-y-1">
                <h2 className="text-base font-semibold">
                  문서 보기
                </h2>
                <p
                  id="deal-comparison-description"
                  className="text-xs text-muted-foreground"
                >
                  원문을 확인하며 거래 정보를 수정합니다.
                </p>
              </div>
              <Button
                ref={closeRef}
                variant="outline"
                size="sm"
                onClick={() => onDocumentOpenChange(false)}
              >
                <X data-icon="inline-start" />
                문서 보기 닫기
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div id="deal-document-preview" className="min-h-full p-4 sm:p-5">
                {preview}
              </div>
            </div>
          </section>,
          documentPanelTarget
        )}
    </div>
  )
}

function DealMemoComposer({ onCreateNote }: { onCreateNote: (body: string) => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const clearAndClose = () => {
    setOpen(false)
    setBody("")
    setError("")
  }
  return (
    <Popover open={open} onOpenChange={(next) => { if (!saving) setOpen(next) }}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="icon-sm" aria-label="메모 추가">
              <NotebookPen className="size-[18px]" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>메모 추가</TooltipContent>
      </Tooltip>
      <PopoverContent side="bottom" align="end" sideOffset={8}
        className="w-[min(360px,calc(100vw-2rem))] p-4">
        <form aria-label="메모 추가" className="space-y-3" onSubmit={async (event) => {
          event.preventDefault()
          if (saving || !body.trim()) return
          setSaving(true)
          setError("")
          try {
            await onCreateNote(body.trim())
            clearAndClose()
          } catch {
            setError("메모를 추가하지 못했습니다. 다시 시도해 주세요.")
          } finally {
            setSaving(false)
          }
        }}>
          <h3 className="text-sm font-semibold">메모 추가</h3>
          <Textarea autoFocus aria-label="메모 내용" value={body} disabled={saving}
            onChange={(event) => setBody(event.target.value)}
            placeholder="고객 요청, 합의 사항, 특이사항" />
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={clearAndClose}>취소</Button>
            <Button type="submit" size="sm" disabled={saving || !body.trim()}>{saving ? "저장 중…" : "저장"}</Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}

function DealRecordSections({
  audit,
  notes,
  onUpdateNote,
  onDeleteNote,
}: {
  audit: AuditItem[]
  notes: DealNoteItem[]
  onUpdateNote: (noteId: number, body: string) => Promise<void>
  onDeleteNote: (noteId: number) => Promise<void>
}) {
  const dateTag = useLocaleTag()
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editingNoteBody, setEditingNoteBody] = useState("")
  const [deletingNote, setDeletingNote] = useState<DealNoteItem | null>(null)
  const [activityHistoryOpen, setActivityHistoryOpen] = useState(false)
  const [activityShowAll, setActivityShowAll] = useState(false)
  // 「전체 이력」 in 주문 이행 opens this card and scrolls to it.
  useEffect(() => {
    const open = () => {
      setActivityHistoryOpen(true)
      requestAnimationFrame(() => {
        const card = document.getElementById("deal-activity-card")
        card?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" })
        card?.focus({ preventScroll: true })
      })
    }
    window.addEventListener("ecoya:open-activity-history", open)
    return () => window.removeEventListener("ecoya:open-activity-history", open)
  }, [])
  // Newest first, like the Figma activity timeline.
  const sortedAudit = [...audit].sort((a, b) => b.time.localeCompare(a.time))
  const visibleAudit = activityShowAll ? sortedAudit : sortedAudit.slice(0, 6)

  return (
    <>
      <section className="rounded-[var(--r-lg)] bg-[var(--color-gray-12)] shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)] p-5" aria-label="노트">
        <div className="flex items-center justify-between gap-3">
          {/* Figma 7872:185137 노트 card header. */}
          <div>
            <h3 className="text-[18px] leading-[26px] font-bold">노트</h3>
            <p className="mt-1 text-[15px] leading-[22px] text-[var(--color-gray-5)]">
              업무자 간 공유 메모 · 거래 참여자 모두에게 보입니다
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {notes.map((item) => (
            <div key={item.id} className="rounded-xl bg-[var(--color-gray-11)] px-4 py-2.5">
              {editingNoteId === item.id ? (
                <div className="flex flex-col gap-2">
                  <Textarea
                    autoFocus
                    value={editingNoteBody}
                    onChange={(event) => setEditingNoteBody(event.target.value)}
                    aria-label="노트 수정"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingNoteId(null)}
                    >
                      취소
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!editingNoteBody.trim()}
                      onClick={async () => {
                        await onUpdateNote(item.id, editingNoteBody.trim())
                        setEditingNoteId(null)
                      }}
                    >
                      저장
                    </Button>
                  </div>
                </div>
              ) : (
                                <div className="flex items-center gap-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-pre-wrap text-[15px] leading-[22px]">
                      {item.body}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-[18px] text-[var(--color-gray-5)]">
                      {item.actor} · {item.time.length === 10 ? formatDate(item.time, dateTag) : formatDateTime(item.time, dateTag)}
                    </p>
                  </div>
                    <span className="flex shrink-0 items-center">
                      <Button
                        type="button"
                        variant="ghost-neutral"
                        size="icon-sm"
                        className="[&_svg]:size-[18px]"
                        aria-label="노트 수정"
                        onClick={() => {
                          setEditingNoteId(item.id)
                          setEditingNoteBody(item.body)
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost-neutral"
                        size="icon-sm"
                        className="[&_svg]:size-[18px]"
                        aria-label="노트 삭제"
                        onClick={() => setDeletingNote(item)}
                      >
                        <Trash2 />
                      </Button>
                    </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      {/* Figma 7872:185189 (closed) / 7872:188432 (open): separate card, TimelineItem rows. */}
      <section id="deal-activity-card" tabIndex={-1} className="scroll-mt-[calc(var(--deal-header-height,128px)+16px)] rounded-[var(--r-lg)] bg-[var(--color-gray-12)] p-5 shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)] outline-none" aria-label="활동 이력">
        <div className="flex items-start gap-6">
          <div className="min-w-0 flex-1">
            <h3 className="text-[18px] leading-[26px] font-bold">활동 이력</h3>
            <p className="mt-1 text-[15px] leading-[22px] text-[var(--color-gray-5)]">거래에서 수정된 모든 내역</p>
          </div>
          <Button
            type="button"
            variant="ghost-neutral"
            size="icon-sm"
            className="[&_svg]:size-[18px]"
            aria-label={`활동 이력 ${activityHistoryOpen ? "접기" : "펼치기"}`}
            aria-expanded={activityHistoryOpen}
            aria-controls="deal-activity-history"
            onClick={() => setActivityHistoryOpen((open) => !open)}
          >
            <ChevronDown className={cn("transition-transform", activityHistoryOpen && "rotate-180")} />
          </Button>
        </div>
        {activityHistoryOpen ? (
          <div id="deal-activity-history" className="mt-4">
            {audit.length ? (
              <ol>
                {visibleAudit.map((item, index) => {
                  const system = item.actor === "시스템"
                  return (
                    <li key={item.id} className="flex items-start gap-3">
                      <div aria-hidden="true" className="flex w-3 shrink-0 flex-col items-center gap-1 self-stretch pt-1.5">
                        <span className={cn("size-2.5 rounded-full", system ? "bg-[var(--color-gray-5)]" : "bg-[var(--color-primary-4)]")} />
                        {index < visibleAudit.length - 1 ? <span className="w-0.5 flex-1 bg-[var(--color-gray-10)]" /> : null}
                      </div>
                      <div className="min-w-0 flex-1 pb-3.5">
                        <p className="text-[15px] leading-[22px]">{item.action}</p>
                        <p className="mt-0.5 text-[13px] leading-[18px] text-[var(--color-gray-5)]">{[item.detail, item.actor].filter(Boolean).join(" · ")}</p>
                      </div>
                      <span className="shrink-0 text-[13px] leading-[18px] text-[var(--color-gray-5)] tabular-nums">{formatDateTime(item.time, dateTag)}</span>
                    </li>
                  )
                })}
              </ol>
            ) : <p className="text-[13px] leading-[18px] text-[var(--color-gray-5)]">아직 기록된 변경이 없습니다.</p>}
            {audit.length > 6 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3 h-8 gap-1 px-0 text-[13px] leading-[18px] font-normal text-[var(--color-primary-4)] hover:bg-transparent hover:text-[var(--color-primary-4)] hover:underline"
                aria-expanded={activityShowAll}
                onClick={() => setActivityShowAll((all) => !all)}
              >
                {activityShowAll ? "최근 이력만 보기" : `이전 이력 ${audit.length - 6}건 더 보기`}
                <ChevronDown data-icon="inline-end" className={cn("size-4 transition-transform", activityShowAll && "rotate-180")} />
              </Button>
            ) : null}
          </div>
        ) : null}
      </section>
      {deletingNote ? (
        <ActionDialog
          title="노트 삭제"
          description="이 노트를 거래의 공유 메모에서 삭제합니다."
          confirmLabel="삭제"
          destructive
          onClose={() => setDeletingNote(null)}
          onConfirm={async () => {
            await onDeleteNote(deletingNote.id)
            setDeletingNote(null)
          }}
        />
      ) : null}
    </>
  )
}

function DealPdf({
  slot,
  fieldSummary,
  previewFields,
  actions,
  canUnlink,
  onUnlink,
}: {
  slot: DocumentSlot
  fieldSummary: string
  previewFields?: [string, string][]
  actions?: ReactNode
  canUnlink: boolean
  onUnlink: () => void
}) {
  const file = slot.file
  const preview = dealDocumentPreviews[slot.code] ?? dealDocumentPreviews.PO
  const fields = previewFields ?? preview.fields
  const [page, setPage] = useState(() => {
    if (pendingDocumentPage?.file !== file) return 1
    const requested = pendingDocumentPage.page
    pendingDocumentPage = null
    return requested
  })
  useEffect(() => {
    const show = (event: Event) => {
      const request = (event as CustomEvent<{ file: string; page: number }>).detail
      if (request.file !== file) return
      setPage(request.page)
      pendingDocumentPage = null
    }
    window.addEventListener("ecoya:deal-document-page", show)
    return () => window.removeEventListener("ecoya:deal-document-page", show)
  }, [file])
  const [zoom, setZoom] = useState(100)
  const [fullscreen, setFullscreen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false)
    }
    window.addEventListener("keydown", close)
    return () => window.removeEventListener("keydown", close)
  }, [])
  const download = async () => {
    setDownloading(true)
    await wait(350)
    const a = document.createElement("a")
    a.href = slot.fileDataUrl ?? URL.createObjectURL(
      new Blob([`ECOYA sample document: ${file}`], { type: "application/pdf" })
    )
    a.download = file
    a.click()
    URL.revokeObjectURL(a.href)
    setDownloading(false)
  }
  const viewer = (
    <div
      className={cn(
        "relative mt-2 flex min-h-[480px] flex-col overflow-hidden bg-background",
        fullscreen && "fixed inset-0 z-[70] mt-0 h-screen min-h-0 bg-background"
      )}
      role={fullscreen ? "dialog" : undefined}
      aria-modal={fullscreen ? "true" : undefined}
      aria-label={fullscreen ? `${slot.type} 전체 화면 미리보기` : undefined}
    >
      <div className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--surface-border)] bg-background px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-[var(--r-xs)] border border-[var(--surface-border)] text-[9px] font-semibold text-[var(--color-red-2)]">
            PDF
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-semibold">{file}</span>
            <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
              {slot.code} · {slot.type} · {fieldSummary}
            </span>
          </span>
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <StatusBadge
            tone={
              slot.status === "검토"
                ? "blue"
                : slot.status === "발행" || slot.status === "분석 중"
                  ? "blue"
                  : "success"
            }
          >
            {slot.status === "검토" ? "확인 전" : slot.status}
          </StatusBadge>
          {canUnlink ? (
            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon-sm" className="shrink-0" aria-label="거래 연결 해제" onClick={onUnlink}><Unlink /></Button></TooltipTrigger><TooltipContent>거래 연결 해제</TooltipContent></Tooltip>
          ) : null}
          {actions}
          <PdfViewerToolbar
            zoom={zoom}
            onZoomChange={setZoom}
            isFullscreen={fullscreen}
            onToggleFullscreen={() => setFullscreen((value) => !value)}
            isDownloading={downloading}
            onDownload={download}
          />
        </div>
      </div>
      {slot.fileDataUrl ? (
        <iframe title={`${file} 원본 PDF`} src={slot.fileDataUrl} className="min-h-[600px] w-full flex-1 border-0" />
      ) : <PannablePdfViewport zoom={zoom} className="min-h-0 flex-1 px-4 pb-20">
        <div
          className="mx-auto mt-4 aspect-[.72] max-h-[760px] w-[min(90%,560px)] origin-top border bg-background p-8 shadow-sm"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
          }}
        >
          <span className="text-xs font-semibold tracking-widest text-primary">
            TRADE DOCUMENT
          </span>
          <h4 className="mt-4 text-2xl font-semibold">{preview.title}</h4>
          <p className="mt-2 text-xs text-muted-foreground">
            {file} · page {page}
          </p>
          <Separator className="my-8" />
          {fields.map(([label, value]) => (
            <div
              key={label}
              className="grid grid-cols-[120px_1fr] border-b py-3 text-sm"
            >
              <span className="text-muted-foreground">{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </PannablePdfViewport>}
      <PdfFloatingControls
        page={page}
        pageCount={2}
        zoom={zoom}
        onPageChange={setPage}
        onZoomChange={setZoom}
        isFullscreen={fullscreen}
        onToggleFullscreen={() => setFullscreen((value) => !value)}
        isDownloading={downloading}
        onDownload={download}
        variant="pager"
      />
    </div>
  )
  return fullscreen ? createPortal(viewer, document.body) : viewer
}

function DealReviewBadge({ match }: { match: DealFieldMatch }) {
  if (!needsReview(match)) return null
  return <StatusBadge size="xs" tone="danger">{match === "누락" ? "누락" : "불일치"}</StatusBadge>
}

const normalizeCandidateValue = (value: string) =>
  value.replaceAll(",", "").replaceAll(" ", "").toLowerCase()

function CandidateValuePicker({
  label,
  value,
  candidates,
  onSelect,
  trigger = "button",
}: {
  label: string
  value: string
  candidates: DealFieldCandidate[]
  onSelect: (value: string) => void
  /** "chevron" = arrow inside the input (Figma item quantity, 7872:184843). */
  trigger?: "button" | "chevron"
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger === "chevron" ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`${label} 문서별 값 선택`}
            className="size-7 text-[var(--color-gray-4)] hover:text-foreground"
          >
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 border-destructive/35 px-2 text-[11px] text-destructive hover:bg-destructive/5 hover:text-destructive"
          >
            문서별 값 {candidates.length}개
            <ChevronDown className="size-3" />
          </Button>
        )}
      </PopoverTrigger>
      {/* Figma 7992:200097: one radio row per document; rows whose value
          differs from the current value are marked 「다른 값」. */}
      <PopoverContent align="start" className="z-[var(--z-popup)] w-80 max-w-[calc(100vw-2rem)] gap-0 rounded-xl p-2.5">
        <p className="text-[14px] leading-5 font-semibold text-foreground">{label} 기준값 선택</p>
        <p className="text-[15px] leading-[22px] text-[var(--color-gray-5)]">
          연결 문서에서 읽은 값 중 거래에 사용할 값 하나를 고릅니다.
        </p>
        <div role="radiogroup" aria-label={`${label} 기준값`} className="flex max-h-72 flex-col gap-0.5 overflow-y-auto pt-2">
          {candidates.map((candidate, index) => {
            const matches = normalizeCandidateValue(candidate.value) === normalizeCandidateValue(value)
            // Several documents can share the current value; mark the first one.
            const selected = matches && candidates.findIndex((entry) => normalizeCandidateValue(entry.value) === normalizeCandidateValue(value)) === index
            return (
              <button
                key={`${candidate.source}-${candidate.document}-${candidate.value}`}
                type="button"
                role="radio"
                aria-checked={selected}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left outline-none hover:bg-[var(--color-gray-11)] focus-visible:[box-shadow:var(--shadow-keyboard-focus)]",
                  selected && "bg-[var(--color-primary-10)] hover:bg-[var(--color-primary-10)]"
                )}
                onClick={() => {
                  onSelect(candidate.value)
                  setOpen(false)
                }}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border bg-background",
                    selected ? "border-[var(--color-primary-1)]" : "border-[var(--color-gray-7)]"
                  )}
                >
                  {selected ? <span className="size-2.5 rounded-full bg-[var(--color-primary-1)]" /> : null}
                </span>
                <StatusBadge tone="neutral" className="h-4 px-2.5 font-normal">{candidate.source}</StatusBadge>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-[14px] leading-5 font-semibold", !matches && "text-destructive")}>
                    {candidate.value}
                  </span>
                  <span className="block truncate text-[13px] leading-[18px] text-[var(--color-gray-5)]">
                    {candidate.document}
                  </span>
                </span>
                {!matches ? <span className="shrink-0 text-[13px] leading-[18px] text-destructive">다른 값</span> : null}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Preserve decimal strings (including a trailing dot) while adding display separators.
function groupItemDecimal(value: string, fixedCents = false) {
  let [whole, fraction] = value.replaceAll(",", "").split(".")
  if (fixedCents && value && /^\d*(?:\.\d*)?$/.test(value.replaceAll(",", ""))) {
    const cents = BigInt(whole || "0") * 100n + BigInt((fraction ?? "").padEnd(2, "0").slice(0, 2)) + ((fraction?.[2] ?? "0") >= "5" ? 1n : 0n)
    whole = String(cents / 100n)
    fraction = String(cents % 100n).padStart(2, "0")
  }
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
    (fraction === undefined ? "" : `.${fraction}`)
}

function PaymentHistory({ paymentHistory }: { paymentHistory: AuditItem[] }) {
  const dateTag = useLocaleTag()
  const [expanded, setExpanded] = useState(true)
  return (
    <section className="mt-5 border-t pt-4" aria-label="지급 정보 변경이력">
      <div className="flex items-center justify-between gap-3">
        <FormFieldHeader label="지급 정보 변경이력" />
        <Button variant="ghost-neutral" size="sm" aria-expanded={expanded} aria-controls="deal-payment-history" onClick={() => setExpanded(open => !open)}>
          {expanded ? "접기" : "전체 보기"}<ChevronDown data-icon="inline-end" className={cn(expanded && "rotate-180")} />
        </Button>
      </div>
      <div id="deal-payment-history" hidden={!expanded} className="mt-3">
        {paymentHistory.length ? <ol>
          {paymentHistory.map((item, index) => (
            <li key={item.id} className="flex items-start gap-3">
              <div aria-hidden="true" className="flex w-3 shrink-0 flex-col items-center self-stretch gap-1 pt-1.5">
                <span className="size-2.5 rounded-full bg-primary" />
                {index < paymentHistory.length - 1 && <span className="w-0.5 flex-1 bg-border" />}
              </div>
              <div className="min-w-0 flex-1 break-words pb-3.5">
                <p className="text-[13px] leading-[18px]">{item.action}</p>
                <p className="mt-0.5 text-[13px] leading-[18px]">{item.detail}</p>
                <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{formatDateTime(item.time, dateTag)} · {item.actor}</p>
              </div>
            </li>
          ))}
        </ol> : <p className="py-3 text-sm text-muted-foreground">변경 이력이 없습니다.</p>}
      </div>
    </section>
  )
}

function DealFieldsPanel({
  profile,
  fields,
  visibleGroups,
  items,
  role,
  onFieldChange,
  onFieldCommit,
  onItemChange,
  onItemCommit,
  onAddItem,
  onRemoveItem,
  paymentHistory,
  rowStateKey,
  totalRounding,
  displayTotal,
  onTotalRoundingChange,
}: {
  profile: DealProfile
  /** Deal id used to remember opened item rows across re-mounts. */
  rowStateKey?: string
  totalRounding: TotalRounding
  displayTotal: string
  onTotalRoundingChange: (mode: TotalRounding) => void
  fields: DealFieldDetail[]
  visibleGroups: DealFieldGroup[]
  items: DealLineItem[]
  role: Role
  onFieldChange: (key: string, value: string) => void
  onFieldCommit: (key: string, value: string, label: string) => void
  onItemChange: (id: number, key: keyof DealLineItem, value: string) => void
  onItemCommit: (
    id: number,
    key: keyof DealLineItem,
    value: string,
    label: string
  ) => void
  onAddItem: () => void
  onRemoveItem: (id: number) => void
  paymentHistory: AuditItem[]
}) {
  const [query, setQuery] = useState("")
  const [editingPrice, setEditingPrice] = useState<number | null>(null)
  const editable = canMutate(role)
  const [editingTotal, setEditingTotal] = useState(false)
  const focusTotal = (input: HTMLInputElement) => {
    flushSync(() => setEditingTotal(true))
    input.select()
  }
  const roundingSelector = <AmountRoundingSelect label="총금액 처리 방식" value={totalRounding} disabled={!editable} onValueChange={onTotalRoundingChange} />
  // An opened item row shows its inputs directly (edits autosave per field).
  // Mismatched items start open so the value can be fixed right away.
  const [expandedItems, setExpandedItems] = useState<Set<number>>(
    () => (rowStateKey ? openedItemRows.get(rowStateKey) : undefined) ?? new Set([...(items[0] ? [items[0].id] : []), ...items.filter((item) => item.match === "확인 필요").map((item) => item.id)])
  )
  useEffect(() => { if (rowStateKey) openedItemRows.set(rowStateKey, expandedItems) }, [rowStateKey, expandedItems])
  const toggleItemExpanded = (id: number) => setExpandedItems((current) => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
  const knownItemIds = useRef(new Set(items.map((item) => item.id)))
  useEffect(() => {
    const added = items.filter((item) => !knownItemIds.current.has(item.id)).map((item) => item.id)
    knownItemIds.current = new Set(items.map((item) => item.id))
    if (added.length) setExpandedItems((current) => new Set([...current, ...added]))
  }, [items])
  const sections: (DealFieldGroup | "품목")[] = [
    "품목",
    "거래 기본",
    "상업 조건",
    "선적 정보",
    "결제 정보",
  ]
  const normalizedQuery = query.trim().toLowerCase()
  const fieldLabelOverrides: Partial<Record<string, string>> =
    profile.direction === "direction_pending"
      ? {}
      : profile.direction === "sales"
      ? {
          buyer: "고객사",
          contract_number: "판매계약 번호",
          amount_total: "매출 금액",
          payment_terms: "수금 조건",
          required_date: "납품 예정일",
          bank_name: "입금 은행",
          bank_account: "입금 계좌",
          payment_due: "수금 예정일",
        }
      : {
          seller: "공급사",
          contract_number: "발주·매입계약 번호",
          amount_total: "매입 금액",
          payment_terms: "지급 조건",
          required_date: "입고 요청일",
          bank_name: "지급 은행",
          bank_account: "지급 계좌",
          payment_due: "지급 예정일",
        }
  const hiddenPartyKey = profile.direction === "direction_pending" ? null : profile.direction === "sales" ? "seller" : "buyer"
  const directionalFields = fields
    .filter(
      (field) =>
        field.key !== hiddenPartyKey && visibleGroups.includes(field.group)
    )
    .map((field) => ({
      ...field,
      label: fieldLabelOverrides[field.key] ?? field.label,
      value:
        field.key === "direction"
          ? directionLabels[profile.direction]
          : field.value,
    }))
  const filteredFields = directionalFields.filter((field) =>
    `${field.label} ${field.key} ${field.value} ${field.evidence.join(" ")}`
      .toLowerCase()
      .includes(normalizedQuery)
  )
  const filteredItems = items.filter((item) =>
    `${item.goods} ${item.hsCode} ${item.evidence.join(" ")}`
      .toLowerCase()
      .includes(normalizedQuery)
  )
  const reviewCount = requiredDealReviews(
    fields,
    visibleGroups,
    items,
    profile.direction
  ).length

  // 수량 × 단가 computed exactly, then shown with this item's own 반올림/절사.
  const rounding = useAmountRoundings(rowStateKey ?? "")
  const itemAmount = (item: DealLineItem) => {
    const amount = multiplyDecimal(item.quantity, item.unitPrice)
    if (!amount) return "0"
    return item.currency.trim() ? roundedDealTotal(amount, item.currency, rounding.read(`item:${item.id}`)) : Number(amount).toLocaleString("en-US")
  }

  // One item opens for editing at a time under its own table row; the
  // existing 2-column input layout is kept inside that panel.
  const renderItemEditor = (item: DealLineItem) => {
    const number =
      items.findIndex((entry) => entry.id === item.id) + 1
    const input = (
      key:
        | "goods"
        | "hsCode"
        | "quantity"
        | "unitPrice"
        | "packageCount"
        | "grossWeight"
        | "netWeight",
      label: string
    ) => (
      <Input
        aria-label={`품목 ${number} ${label}`}
        id={
          key === "quantity"
            ? `deal-field-item-${item.id}-quantity`
            : `deal-item-${item.id}-${key}`
        }
        style={{
          scrollMarginTop:
            "calc(var(--deal-header-height,128px) + 16px)",
        }}
        className={cn(
          "h-10 px-3 py-0",
          !["goods", "hsCode"].includes(key) &&
            "text-right tabular-nums",
          // Figma: red border only; the value keeps the normal text colour.
          key === "quantity" &&
            needsReview(item.match) &&
            "border-destructive"
        )}
        value={key === "unitPrice" ? groupItemDecimal(item[key], editingPrice !== item.id) : item[key]}
        onFocus={() => { if (key === "unitPrice") setEditingPrice(item.id) }}
        inputMode={
          ["goods", "hsCode"].includes(key)
            ? "text"
            : key === "packageCount"
              ? "numeric"
              : "decimal"
        }
        disabled={!editable}
        aria-describedby={key === "quantity" && item.match === "확인 필요" ? `deal-item-${item.id}-quantity-message` : undefined}
        aria-invalid={
          key === "quantity" && item.match === "확인 필요"
        }
        onChange={(event) => {
          const control = event.currentTarget
          const entered = control.value
          const numeric = !["goods", "hsCode"].includes(key)
          const value = numeric ? entered.replaceAll(",", "") : entered
          const pattern = key === "packageCount" ? /^\d*$/
            : key === "unitPrice" ? /^\d*(?:\.\d{0,2})?$/
            : /^\d*(?:\.\d*)?$/
          if (numeric && !pattern.test(value)) return
          const caret = control.selectionStart ?? entered.length
          const beforeCaret = entered.slice(0, caret).replaceAll(",", "").length
          onItemChange(item.id, key, value)
          if (key === "unitPrice") requestAnimationFrame(() => {
            if (document.activeElement !== control) return
            let remaining = beforeCaret
            let position = 0
            while (position < control.value.length && remaining > 0) {
              if (control.value[position] !== ",") remaining--
              position++
            }
            control.setSelectionRange(position, position)
          })
        }}
        onBlur={() => {
          if (key === "unitPrice") setEditingPrice(null)
          let value = item[key]
          if (key === "unitPrice" && item.currency === "USD" && value && value !== ".") {
            const [whole, fraction = ""] = value.replaceAll(",", "").split(".")
            value = `${whole || "0"}.${fraction.padEnd(2, "0")}`
          } else if (!["goods", "hsCode"].includes(key)) {
            value = value === "." ? "" : value.replace(/\.$/, "")
          }
          if (value !== item[key]) onItemChange(item.id, key, value)
          onItemCommit(item.id, key, value, `품목 ${number} · ${label}`)
        }}
      />
    )
    const unit = (
      key: "quantityUnit" | "packageUnit" | "weightUnit",
      label: string,
      options: string[]
    ) => (
      <Select
        value={item[key]}
        disabled={!editable}
        onValueChange={(value) => {
          const next = value ?? ""
          onItemChange(item.id, key, next)
          onItemCommit(
            item.id,
            key,
            next,
            `품목 ${number} · ${label}`
          )
        }}
      >
        <SelectTrigger
          size="sm"
          className="w-full gap-1 px-3 py-0 data-[size=sm]:h-10 data-[size=sm]:text-[length:var(--text-body-6)] data-[size=sm]:leading-[var(--leading-body-6)]"
          aria-label={`품목 ${number} ${label}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="z-[var(--z-popup)]">
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
    const mismatch = item.match === "확인 필요"
    const candidates = lineItemQuantityCandidates[item.id] ?? []
    const canPick = editable && mismatch && new Set(candidates.map((candidate) => normalizeCandidateValue(candidate.value))).size > 1
    const amountLabel = profile.direction === "direction_pending" ? "거래 금액" : `${directionLabels[profile.direction]} 금액`
    // Figma 7872:184900 item card: title + delete, row 1 (name · quantity ·
    // price · amount), separator, row 2 (HS · package · weights · unit).
    return (
      <div className="@container/items flex flex-col gap-3.5 rounded-xl border border-[var(--color-gray-9)] bg-card p-4">
        <div className="flex items-center gap-2">
          <h5 className="min-w-0 flex-1 text-base leading-6 font-bold">품목 {number}</h5>
          {editable && items.length > 1 ? (
            <Button size="icon-sm" variant="ghost-neutral" aria-label={`품목 ${number} 삭제`} onClick={() => onRemoveItem(item.id)}>
              <Trash2 />
            </Button>
          ) : null}
        </div>
        <div className="grid grid-cols-2 items-start gap-3 @min-[760px]/items:grid-cols-[minmax(0,1fr)_280px_150px_150px] [&>div]:min-w-0">
          <div className="col-span-2 @min-[760px]/items:col-span-1">
            <FormFieldHeader className="mb-2.5" label={`품목 ${number} · 품목명`} htmlFor={`deal-item-${item.id}-goods`} />
            {input("goods", "품목명")}
          </div>
          <div className="col-span-2 @min-[760px]/items:col-span-1">
            <FormFieldHeader
              id={`deal-field-label-item-${item.id}-quantity`}
              data-quantity-heading
              className="mb-2.5 scroll-mt-[calc(var(--deal-header-height,128px)+16px)]"
              label="수량 / 단위"
              htmlFor={`deal-field-item-${item.id}-quantity`}
              invalid={needsReview(item.match)}
              badge={needsReview(item.match) ? <DealReviewBadge match={item.match} /> : undefined}
            />
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1 [&_input]:pr-10">
                {input("quantity", "수량")}
                {canPick ? (
                  <span className="absolute top-1/2 right-1.5 -translate-y-1/2">
                    <CandidateValuePicker
                      trigger="chevron"
                      label={`품목 ${number} 수량`}
                      value={item.quantity}
                      candidates={candidates}
                      onSelect={(value) => {
                        onItemChange(item.id, "quantity", value)
                        onItemCommit(item.id, "quantity", value, `품목 ${number} · 수량`)
                      }}
                    />
                  </span>
                ) : null}
              </div>
              <div className="w-32 shrink-0">{unit("quantityUnit", "수량 단위", ["MT", "KG", "EA"])}</div>
            </div>
            {mismatch && candidates.length ? (
              <FormFieldMessage id={`deal-item-${item.id}-quantity-message`} tone="danger" className="mt-2 items-start [&>svg]:mt-px">
                문서마다 값이 달라 선택이 필요합니다 · {candidates.map((candidate) => `${candidate.source} ${candidate.value}`).join(" · ")} {item.quantityUnit}
              </FormFieldMessage>
            ) : null}
          </div>
          <div>
            <FormFieldHeader data-item-unit-price-heading className="mb-2.5 scroll-mt-[calc(var(--deal-header-height,128px)+16px)]" label={`단가 · ${item.currency}/${item.quantityUnit}`} htmlFor={`deal-item-${item.id}-unitPrice`} />
            {input("unitPrice", "단가")}
          </div>
          <div>
            <FormFieldHeader className="mb-2.5" label={amountLabel} htmlFor={`deal-item-${item.id}-amount`} sourceAction={<AmountRoundingSelect label={`품목 ${number} 금액 처리 방식`} value={rounding.read(`item:${item.id}`)} disabled={!editable} onValueChange={(mode) => rounding.write(`item:${item.id}`, mode)} />} />
            <Input
              id={`deal-item-${item.id}-amount`}
              aria-label={`품목 ${number} 금액`}
              className="h-10 border-[var(--color-gray-9)] bg-[var(--color-gray-10)] px-3 py-0 tabular-nums shadow-none"
              value={`${itemAmount(item)} ${item.currency}`}
              readOnly
            />
          </div>
        </div>
        <div className="h-px bg-[var(--color-gray-10)]" role="separator" />
        <div className="grid grid-cols-2 items-start gap-3 @min-[760px]/items:grid-cols-[150px_280px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] [&>div]:min-w-0">
          <div>
            <FormFieldHeader className="mb-2" label="HS Code" htmlFor={`deal-item-${item.id}-hsCode`} />
            {input("hsCode", "HS Code")}
          </div>
          <div className="col-span-2 @min-[760px]/items:col-span-1">
            <FormFieldHeader className="mb-2" label="포장 수 / 단위" htmlFor={`deal-item-${item.id}-packageCount`} />
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">{input("packageCount", "포장 수")}</div>
              <div className="w-32 shrink-0">{unit("packageUnit", "포장 단위", ["bundles", "cartons", "pallets"])}</div>
            </div>
          </div>
          <div>
            <FormFieldHeader className="mb-2" label="총중량" htmlFor={`deal-item-${item.id}-grossWeight`} />
            {input("grossWeight", "총중량")}
          </div>
          <div>
            <FormFieldHeader className="mb-2" label="순중량" htmlFor={`deal-item-${item.id}-netWeight`} />
            {input("netWeight", "순중량")}
          </div>
          <div>
            <FormFieldHeader className="mb-2" label="중량 단위" />
            {unit("weightUnit", "중량 단위", ["KG", "MT", "LB"])}
          </div>
        </div>
      </div>
    )
  }

  const quantityConflicts = (item: DealLineItem) =>
    item.match === "확인 필요"
      ? (lineItemQuantityCandidates[item.id] ?? []).filter((candidate) => normalizeCandidateValue(candidate.value) !== normalizeCandidateValue(item.quantity))
      : []
  const itemHeading = profile.direction === "direction_pending" ? "거래 품목" : `${directionLabels[profile.direction]} 품목`
  const viewItemTable =
    !normalizedQuery || filteredItems.length ? (
      <section key="items" data-deal-items className="border-b pt-2 pb-5">
        <div className="flex items-center justify-between gap-3">
          <h4 className="flex items-center gap-2 text-base font-semibold">
            {itemHeading}
            <span className="text-xs font-normal text-muted-foreground">{filteredItems.length}건</span>
          </h4>
          {editable ? (
            <Button size="sm" variant="outline" onClick={onAddItem}>
              <Plus data-icon="inline-start" />
              품목 추가
            </Button>
          ) : null}
        </div>
        <div className="ops-screen mt-3" role="region" aria-label="거래 품목 목록">
          <HostTable className="ops-shipment-table text-left" data-deal-table="items" aria-label={itemHeading}>
            <colgroup><col style={{ width: "24%" }} /><col style={{ width: "15%" }} /><col style={{ width: "12%" }} /><col style={{ width: "14%" }} /><col style={{ width: "12%" }} /><col style={{ width: "11.5%" }} /><col style={{ width: "11.5%" }} /></colgroup>
            <HostTableHeader>
              <HostTableRow>
                {["품목", "수량 / 단위", "단가", "금액", "포장", "총중량", "순중량"].map((label) => <HostTableHead key={label} className={cn(["단가", "금액", "총중량", "순중량"].includes(label) ? "text-right" : "text-left")}>{label}</HostTableHead>)}
              </HostTableRow>
            </HostTableHeader>
            <HostTableBody>
              {filteredItems.map((item) => {
                const number = items.findIndex((entry) => entry.id === item.id) + 1
                const mismatch = item.match === "확인 필요"
                const conflicts = quantityConflicts(item)
                const isOpen = expandedItems.has(item.id)
                const isEditing = editable && isOpen
                return (
                  <Fragment key={item.id}>
                    <HostTableRow className="cursor-pointer has-aria-expanded:[&>td]:bg-transparent!" onClick={() => toggleItemExpanded(item.id)}>
                      <HostTableCell className="max-w-[260px] px-3 py-3 align-top">
                        <button type="button" className="flex min-w-0 items-start gap-2 text-left" aria-expanded={isOpen} aria-label={`품목 ${number} ${isOpen ? "접기" : "펼치기"}`} onClick={(event) => { event.stopPropagation(); toggleItemExpanded(item.id) }}>
                          <ChevronDown className={cn("mt-0.5 size-4 shrink-0 transition-transform", !isOpen && "-rotate-90")} aria-hidden="true" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium" title={item.goods}>{item.goods || "—"}</span>
                            <span className="mt-1 block text-[11px] text-muted-foreground">품목 {number} · HS {item.hsCode || "—"}</span>
                          </span>
                        </button>
                      </HostTableCell>
                      <HostTableCell className="whitespace-nowrap px-3 py-3 align-top tabular-nums">
                        <span className={cn("inline-flex items-center gap-1.5", needsReview(item.match) && "font-semibold text-destructive")}>
                          {item.quantity || "—"} {item.quantityUnit || ""}
                          <DealReviewBadge match={item.match} />
                        </span>
                        {conflicts.length ? (
                          <span className="mt-1 block text-[11px] leading-4 text-destructive" title={item.evidence.join(" · ")}>
                            {conflicts.map((candidate) => `${candidate.source} ${candidate.value} ${item.quantityUnit}`).join(" · ")}
                          </span>
                        ) : null}
                      </HostTableCell>
                      <HostTableCell className="whitespace-nowrap px-3 py-3 text-right align-top tabular-nums">{groupItemDecimal(item.unitPrice)} {item.currency}</HostTableCell>
                      <HostTableCell className="whitespace-nowrap px-3 py-3 text-right align-top tabular-nums">{itemAmount(item)} {item.currency}</HostTableCell>
                      <HostTableCell className="whitespace-nowrap px-3 py-3 align-top">{item.packageCount || "—"} {item.packageUnit || ""}</HostTableCell>
                      <HostTableCell className="whitespace-nowrap px-3 py-3 text-right align-top tabular-nums">{item.grossWeight || "—"} {item.weightUnit || ""}</HostTableCell>
                      <HostTableCell className="whitespace-nowrap px-3 py-3 text-right align-top tabular-nums">{item.netWeight || "—"} {item.weightUnit || ""}</HostTableCell>
                    </HostTableRow>
                    {isOpen ? (
                      <HostTableRow className="hover:[&>td]:bg-transparent has-aria-expanded:[&>td]:bg-transparent!">
                        <HostTableCell colSpan={7} className="!p-0 whitespace-normal">
                          {/* Pinned to the visible width so the editor never scrolls with the wide table. */}
                          <div className="sticky left-0 w-[100cqw] p-3">
                          {isEditing ? renderItemEditor(item) : (
                            <div className="rounded-xl border border-[var(--color-gray-9)] bg-card p-4">
                              <dl className="grid gap-3 sm:grid-cols-2">
                                {[
                                  ["품목명", item.goods],
                                  ["HS Code", item.hsCode],
                                  ["수량 / 단위", item.quantity ? `${item.quantity} ${item.quantityUnit}` : ""],
                                  [`단가 · ${item.currency}/${item.quantityUnit}`, groupItemDecimal(item.unitPrice)],
                                  [profile.direction === "direction_pending" ? "거래 금액" : `${directionLabels[profile.direction]} 금액`, `${itemAmount(item)} ${item.currency}`],
                                  ["포장 수 / 단위", item.packageCount ? `${item.packageCount} ${item.packageUnit}` : ""],
                                  ["총중량", item.grossWeight ? `${item.grossWeight} ${item.weightUnit}` : ""],
                                  ["순중량", item.netWeight ? `${item.netWeight} ${item.weightUnit}` : ""],
                                ].map(([label, value]) => (
                                  <div key={label}>
                                    <dt className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", label === "수량 / 단위" && needsReview(item.match) && "text-destructive")}>{label}{label === "수량 / 단위" && <DealReviewBadge match={item.match} />}</dt>
                                    <dd className={cn("mt-1 min-h-10 rounded-md bg-muted/30 px-3 py-2 text-sm font-medium", label === "수량 / 단위" && needsReview(item.match) && "text-destructive")}>{value || "—"}</dd>
                                  </div>
                                ))}
                              </dl>
                              {mismatch && lineItemQuantityCandidates[item.id]?.length ? (
                                <div className="mt-4 border-t pt-4">
                                  <h5 className="text-sm font-semibold">문서별 수량</h5>
                                  <ul className="mt-2 flex flex-wrap gap-2">
                                    {lineItemQuantityCandidates[item.id].map((candidate) => {
                                      const differs = normalizeCandidateValue(candidate.value) !== normalizeCandidateValue(item.quantity)
                                      return (
                                        <li key={`${candidate.source}-${candidate.document}`} className={cn("rounded-md border px-3 py-1.5 text-xs", differs ? "border-destructive/40 bg-destructive/5 text-destructive" : "bg-background")} title={candidate.document}>
                                          <span className="font-semibold">{candidate.source}</span> {candidate.value} {item.quantityUnit}
                                        </li>
                                      )
                                    })}
                                  </ul>
                                </div>
                              ) : null}
                            </div>
                          )}
                          </div>
                        </HostTableCell>
                      </HostTableRow>
                    ) : null}
                  </Fragment>
                )
              })}
            </HostTableBody>
          </HostTable>
        </div>
      </section>
    ) : null

  const renderGroup = (group: DealFieldGroup) => {
    const groupFields = filteredFields.filter((field) => field.group === group)
    if (!groupFields.length) return null
    return (
      <section
        key={group}
        id={fieldGroupIds[group]}
        tabIndex={-1}
        className="scroll-mt-[calc(var(--deal-header-height,128px)+16px)] py-5 outline-none"
      >
        <div className="flex items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 text-base font-semibold">
          {group === "결제 정보"
            ? profile.direction === "sales"
              ? "수금 정보"
              : profile.direction === "purchase" ? "지급 정보" : "결제 정보"
            : group}
        </h4>
        </div>
        <div className="mt-3 grid min-w-0 gap-x-4 gap-y-2 @min-[640px]/fields:grid-cols-2">
          {groupFields.map((field) => (
            <FormField
              key={field.key}
              className="py-1 @min-[640px]/fields:row-span-3 @min-[640px]/fields:grid @min-[640px]/fields:grid-rows-subgrid"
              label={field.label}
              htmlFor={`deal-field-${field.key}`}
              id={`deal-field-label-${field.key}`}
              style={{ scrollMarginTop: "calc(var(--deal-header-height,128px) + 16px)" }}
              invalid={needsReview(field.match)}
              sourceAction={field.key === "amount_total" ? roundingSelector : undefined}
              badge={needsReview(field.match) || dealContractSource.fieldPages[field.key] ? <>
                {dealContractSource.fieldPages[field.key] && <DocumentPageMarker label={field.label} page={dealContractSource.fieldPages[field.key]!} fileName={dealContractSource.fileName} code={dealContractSource.code} />}
                <DealReviewBadge match={field.match} />
              </> : undefined}
              message={needsReview(field.match) ? field.evidence.join(" · ") || undefined : undefined}
              messageId={`deal-field-${field.key}-message`}
              tone={field.match === "누락" || field.match === "확인 필요" ? "danger" : "neutral"}
              candidates={editable &&

                field.match === "확인 필요" &&
                new Set(
                  (dealFieldCandidates[field.key] ?? []).map((candidate) =>
                    normalizeCandidateValue(candidate.value)
                  )
                ).size > 1 ? (
                  <CandidateValuePicker
                    label={field.label}
                    value={field.value}
                    candidates={dealFieldCandidates[field.key]}
                    onSelect={(value) => {
                      onFieldChange(field.key, value)
                      onFieldCommit(field.key, value, field.label)
                    }}
                  />
                ) : undefined}
            >
              {field.inputType === "date" ? (
                <DatePicker
                  className="w-full"
                  id={`deal-field-${field.key}`}
                  ariaLabel={field.label}
                  value={field.value}
                  disabled={!editable}
                  invalid={field.match === "누락" || field.match === "확인 필요"}
                  onValueChange={(value) => {
                    onFieldChange(field.key, value)
                    onFieldCommit(field.key, value, field.label)
                  }}
                />
              ) : (
              <Input
                className={cn(
                  "h-10",
                  field.match === "확인 필요" &&
                    "border-destructive/55 text-destructive focus-visible:ring-destructive/25"
                )}
                aria-describedby={needsReview(field.match) && field.evidence.length ? `deal-field-${field.key}-message` : undefined}
                id={`deal-field-${field.key}`}
                style={{
                  scrollMarginTop:
                    "calc(var(--deal-header-height,128px) + 16px)",
                }}
                type={field.inputType ?? "text"}
                value={field.key === "amount_total" && !editingTotal ? displayTotal : field.value}
                disabled={!editable || field.key === "direction"}
                placeholder={`${field.label} 입력`}
                aria-invalid={
                  field.match === "누락" || field.match === "확인 필요"
                }
                onChange={(event) =>
                  onFieldChange(field.key, event.target.value)
                }
                onFocus={event => { if (field.key === "amount_total") focusTotal(event.currentTarget) }}
                onBlur={() => {
                  if (field.key === "amount_total") setEditingTotal(false)
                  onFieldCommit(field.key, field.value, field.label)
                }}
              />
              )}
            </FormField>
          ))}
        </div>
        {group === "결제 정보" && <PaymentHistory paymentHistory={paymentHistory} />}
      </section>
    )
  }
  return (
    <div className="@container/fields mt-4 min-w-0">
      <div className="flex items-center justify-between gap-3 border-b pb-3">
        <span className="text-xs text-muted-foreground">
          필드·품목 {directionalFields.length + items.length}개
        </span>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <StatusBadge tone={reviewCount ? "warning" : "success"}>
            {reviewCount ? `${reviewCount}개 확인` : "대조 완료"}
          </StatusBadge>
        </div>
      </div>
      <div className="sticky top-0 z-10 -mx-1 bg-background px-1 py-3">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="거래 필드 또는 품목 검색"
          />
        </div>
      </div>
      <div className="min-w-0 overflow-x-hidden pr-2 pb-8">
        {sections.map((section) =>
          // Only the item list folds into a table (rows open their own
          // editor); the other contract groups keep their 2-column inputs.
          section === "품목"
            ? viewItemTable
            : renderGroup(section)
        )}
        {!filteredFields.length && !filteredItems.length ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            일치하는 거래 항목이 없습니다.
          </p>
        ) : null}
      </div>
    </div>
  )
}

function DealVerificationPanels({
  dealId,
  role,
  addAudit,
  riskDismissed,
  onRiskDismiss,
  onOpenDocuments,
}: {
  dealId: string
  role: Role
  addAudit: (action: string, detail: string) => void
  riskDismissed: boolean
  onRiskDismiss: () => void
  onOpenDocuments: () => void
}) {
  const refresh = useDealRefresh()
  const [riskOpen, setRiskOpen] = useState(false)
  const [riskSaving, setRiskSaving] = useState(false)
  const [reason, setReason] = useState("within_tolerance")
  const [note, setNote] = useState("")
  const verificationIssues = dealReviewNotices(riskDismissed)
  const dismissRisk = async () => {
    if (!canMutate(role) || riskSaving || (reason === "other" && !note.trim())) return
    setRiskSaving(true)
    const receipt = refresh.beginWrite()
    let accepted = false
    try {
      const result = await prototypeBackend.deals.dismissRisk({
          dealId,
          riskKey: "amount_quantity_mismatch",
          reason,
          note: note.trim() || undefined,
        })
      accepted = result.ok
      if (!refresh.isCurrent(receipt)) return
      if (!result.ok) throw new Error(result.error)
      toast.success("리스크를 허용 처리했습니다.")
      onRiskDismiss()
      addAudit("리스크 허용", reason === "other" ? note.trim() : reason)
      setRiskOpen(false)
    } catch (error) {
      if (refresh.isCurrent(receipt)) toast.error(error instanceof Error ? error.message : "리스크를 처리하지 못했습니다.")
    } finally {
      refresh.finishWrite(receipt, accepted)
      if (refresh.isCurrent(receipt)) setRiskSaving(false)
    }
  }
  return (
    <DetailCard>
      <PostWriteRefreshNotice failure={refresh.failure} busy={refresh.busy} onRetry={() => void refresh.refresh()} />
      <section>
        <SectionHeading
          title="확인할 항목"
          action={
            verificationIssues.length ? (
              <StatusBadge tone="warning">
                확인 {verificationIssues.length}건
              </StatusBadge>
            ) : null
          }
        />
        <div className="mt-4 grid gap-5">
          {verificationIssues.length ? (
            <div>
              <div
                className="mt-3 divide-y divide-warning/15 rounded-[var(--r-md)] border border-warning/25 bg-warning/5"
                role="status"
              >
                {verificationIssues.map((issue) => (
                  <div
                    key={issue.id}
                    id={`deal-review-${issue.id}`}
                    tabIndex={-1}
                    className="px-3 py-3 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                  >
                    <div className="flex flex-wrap items-start gap-3">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-foreground" />
                      <div className="min-w-0 flex-1">
                        <strong className="block text-sm text-warning-foreground">
                          {issue.title}
                        </strong>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {issue.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                        onClick={onOpenDocuments}
                      >
                        문서에서 확인
                        <ArrowUpRight data-icon="inline-end" />
                      </Button>
                      {issue.dismissible && canMutate(role) ? (
                        <Popover
                          open={riskOpen}
                          onOpenChange={(open) => {
                            if (!riskSaving) setRiskOpen(open)
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              className="shrink-0"
                              size="sm"
                              variant="outline"
                            >
                              <ShieldCheck data-icon="inline-start" />
                              허용
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="end"
                            className="z-[var(--z-popup)] w-80 gap-0 p-4"
                          >
                            <strong className="text-sm">리스크 허용</strong>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              선택한 사유와 담당자가 감사 이력에 기록됩니다.
                            </p>
                            <div className="mt-4 grid gap-3">
                              <Field label="허용 사유">
                                <SimpleSelect
                                  value={reason}
                                  disabled={riskSaving}
                                  onValueChange={setReason}
                                  options={[
                                    ["prearranged", "거래처와 사전 합의"],
                                    ["within_tolerance", "허용 오차 범위"],
                                    ["internal_schedule", "내부 일정 조정"],
                                    ["other", "기타"],
                                  ]}
                                />
                              </Field>
                              {reason === "other" ? (
                                <Field label="상세 사유">
                                  <Input
                                    value={note}
                                    disabled={riskSaving}
                                    onChange={(event) =>
                                      setNote(event.target.value)
                                    }
                                    placeholder="허용 사유 입력"
                                  />
                                </Field>
                              ) : null}
                              <Button
                                className="justify-self-end"
                                size="sm"
                                disabled={
                                  riskSaving ||
                                  (reason === "other" && !note.trim())
                                }
                                onClick={() => void dismissRisk()}
                              >
                                {riskSaving ? (
                                  <LoaderCircle
                                    className="animate-spin"
                                    data-icon="inline-start"
                                  />
                                ) : null}
                                {riskSaving ? "처리 중" : "허용 처리"}
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </DetailCard>
  )
}

function DealHealthReference({
  documentSummary,
  customsSkipped,
}: {
  customsSkipped: boolean
  documentSummary: DealDocumentSummary
}) {
  const [expanded, setExpanded] = useState(false)
  const health = [
    [
      "서류 완성도",
      86,
      `중요 서류 ${documentSummary.connected}/${documentSummary.total}건`,
    ],
    ["교차 대조", 58, "금액·수량 불일치"],
    ["결제", 70, "계좌 변경 확인 필요"],
    ["선적", 74, "잔량 4 MT"],
    ["마진", 68, "원가 2건 추정값"],
    ...(customsSkipped ? [] : [["규정", 82, "통관 서류 준비 중"]] as const),
  ] as const
  return (
    <section aria-label="거래 건강도와 서류 대조" className="p-5">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-base font-bold leading-6">거래 건강도</h4>
        <strong className="text-lg font-bold leading-[26px] text-[var(--color-orange-1)]">72</strong>
      </div>
      <div aria-hidden="true" className="relative mt-3.5 h-4 text-[11px] leading-4 text-muted-foreground">
        <span className="absolute left-0">0</span>
        <span className="absolute left-[60%] -translate-x-1/2">60</span>
        <span className="absolute left-[80%] -translate-x-1/2">80</span>
        <span className="absolute right-0">100</span>
      </div>
      <div className="mt-3.5 flex flex-col gap-3.5">
        {health.map(([label, score, detail]) => (
          <div key={label} className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 text-[13px] font-semibold leading-[18px]">
              <span>{label}</span>
              <strong className={cn("font-semibold tabular-nums", score < 60 ? "text-destructive" : score < 80 ? "text-[var(--color-orange-1)]" : "text-[var(--color-green-1)]")}>{score}</strong>
            </div>
            <div role="meter" aria-label={label} aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} className="relative h-2">
              <div aria-hidden="true" className="grid h-full grid-cols-[3fr_1fr_1fr] gap-0.5">
                <span className="rounded-full bg-[var(--color-red-8)]" />
                <span className="rounded-full bg-[var(--color-orange-6)]" />
                <span className="rounded-full bg-[var(--color-green-6)]" />
              </div>
              <span aria-hidden="true" className={cn("absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white", score < 60 ? "bg-destructive" : score < 80 ? "bg-[var(--color-orange-1)]" : "bg-[var(--color-green-1)]")} style={{ left: `${score}%` }} />
            </div>
            <p className="text-[11px] leading-4 text-muted-foreground">{detail}</p>
          </div>
        ))}
      </div>
      <Separator className="my-4" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-[13px] font-semibold leading-[18px]">서류 대조 (5-Way Match)</h4>
          <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">서류 {documentSummary.connected}/{documentSummary.total}건 연결</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setExpanded(true)}>전체 대조 보기</Button>
      </div>
      <DealDocumentComparisonDialog open={expanded} onOpenChange={setExpanded} documents={documentSummary.documents} />
    </section>
  )
}

function GeneratedDealDocumentsList({
  documents: generatedDocuments,
  selectedDocumentNumber,
  onSelect,
}: {
  documents: readonly GeneratedDealDocumentSummary[]
  selectedDocumentNumber: string | null
  onSelect: (documentNumber: string) => void
}) {
  if (generatedDocuments.length === 0) return null

  const stateMeta: Record<
    GeneratedDealDocumentSummary["state"],
    { label: string; tone: "neutral" | "blue" | "success" }
  > = {
    draft: { label: "작성 중", tone: "neutral" },
    confirmed: { label: "확정", tone: "blue" },
    "link-created": { label: "링크 생성", tone: "blue" },
    shared: { label: "공유 완료", tone: "success" },
  }

  return (
    <div className="mt-1 divide-y divide-[var(--surface-border)]">
      {generatedDocuments.map((document) => {
        const meta = stateMeta[document.state]
        const deliverable = document.state !== "draft"
        return (
          <button
            key={document.number}
            type="button"
            disabled={!deliverable}
            aria-pressed={selectedDocumentNumber === document.number}
            className={cn(
              "flex min-h-12 w-full min-w-0 items-center gap-2.5 px-2 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-65",
              deliverable && "hover:bg-[var(--surface-muted-background)]",
              selectedDocumentNumber === document.number &&
                "bg-[var(--control-selected-soft-background)]"
            )}
            onClick={() => onSelect(document.number)}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--r-sm)] border border-[var(--surface-border)] text-[9px] font-bold text-primary">
              {document.number.split("-")[0]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold">
                {document.title}
              </span>
              <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                {document.number}.pdf · {document.type}
              </span>
            </span>
            <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
            {deliverable ? (
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border border-[var(--control-border)]",
                  selectedDocumentNumber === document.number &&
                    "border-primary bg-primary text-primary-foreground"
                )}
                aria-hidden="true"
              >
                {selectedDocumentNumber === document.number ? (
                  <Check className="size-3" />
                ) : null}
              </span>
            ) : (
              <span className="w-14 text-right text-[10px] text-muted-foreground">
                확정 후 가능
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function DocumentsTab({
  plan,
  customsControl,
  aiQuestion,
  linkedDeals,
  workspaces,
  previewWork,
  onPreviewWork,
  onStartWork,
  onOpenDocument,
  dealId,
  profile,
  role,
  addAudit,
  onUpload,
  visibleGroups,
  onMissingFieldsChange,
  onSaveStatusChange,
  saveRetryRef,
  onMainInformationChange,
  onContractItemsChange,
  onDocumentSummaryChange,
  commercialInvoiceView,
  documentOpen,
  documentPanelTarget,
  onDocumentOpenChange,
  documentRequest,
  failedPanel,
  onRetry,
}: {
  customsControl: ReactNode
  plan: DealWorkPlan
  aiQuestion: ReactNode
  linkedDeals: ReactNode
  workspaces: Partial<Record<DealWorkKey, ReactNode>>
  previewWork: DealWorkKey[]
  onPreviewWork: (key: DealWorkKey) => void
  onStartWork: (key: DealWorkKey) => void
  onOpenDocument?: (key: DealWorkKey) => void
  dealId: string
  profile: DealProfile
  role: Role
  addAudit: (action: string, detail: string) => void
  onUpload: () => void
  visibleGroups: DealFieldGroup[]
  onMissingFieldsChange: (fields: DealMissingField[]) => void
  onSaveStatusChange?: (status: DealSaveStatus) => void
  saveRetryRef?: { current: () => void }
  onContractItemsChange: (items: DealLineItem[]) => void
  onMainInformationChange: (
    info: Pick<DealProfile, "counterparty" | "amount" | "currency">
  ) => void
  onDocumentSummaryChange: (summary: DealDocumentSummary) => void
  commercialInvoiceView: SplitShipmentView
  documentOpen: boolean
  documentPanelTarget: HTMLElement | null
  onDocumentOpenChange: (open: boolean) => void
  documentRequest?: {
    code: string
    fileName?: string
    invoiceId?: string
  } | null
  failedPanel: Tab | null
  onRetry: () => void
}) {
  const refresh = useDealRefresh()
  const [documentRecords, setDocumentRecords] = useState(() => listDealDocuments(dealId))
  const [movedDocument, setMovedDocument] = useState<DealDocumentRecord | null>(null)
  const primaryDocumentCode = profile.direction === "sales" ? "SC" : profile.direction === "purchase" ? "PO" : null
  const orderedImportantDocuments = useMemo(
    () =>
      [...documents].sort((left, right) => {
        if (left.code === primaryDocumentCode) return -1
        if (right.code === primaryDocumentCode) return 1
        return 0
      }),
    [primaryDocumentCode]
  )
  const [selected, setSelected] = useState<DocumentSlot>(() => {
    const uploaded = documentRecords.find(record => record.originCode === primaryDocumentCode && record.originDealId === dealId)
    const base = documents.find(document => document.code === primaryDocumentCode) ?? documents[0]
    return uploaded ? documentSlot(uploaded) : base.source === "발행" ? base : { ...base, file: "", status: "미비" }
  })
  const [dealFields, setDealFields] = useState(() =>
    initialDealFields.map((field) => ({
      ...field,
      value:
        field.key === "direction"
          ? directionLabels[profile.direction]
          : (field.key === "seller" && profile.direction === "purchase") ||
        (field.key === "buyer" && profile.direction === "sales")
          ? profile.counterparty
          : field.key === "amount_total"
            ? prototypeBackend.deals.getSavedField(dealId, "field:amount_total") ?? profile.amount
            : field.key === "currency"
              ? prototypeBackend.deals.getSavedField(dealId, "field:currency") ?? profile.currency
              : field.value,
    }))
  )
  const profileKey = `${profile.direction}:${profile.counterparty}`
  const [previousProfile, setPreviousProfile] = useState(profileKey)
  if (previousProfile !== profileKey) {
    setPreviousProfile(profileKey)
    setDealFields(current => current.map(field => {
      if (field.key === "direction") return { ...field, value: directionLabels[profile.direction] }
      const partyKey = profile.direction === "sales" ? "buyer" : profile.direction === "purchase" ? "seller" : null
      return field.key === partyKey && !field.evidence.includes("조민영 · 직접 입력")
        ? { ...field, value: profile.counterparty }
        : field
    }))
  }
  const [totalRounding, setTotalRounding] = useState(() => readTotalRounding(dealId))
  const currency = dealFields.find(field => field.key === "currency")?.value ?? profile.currency
  const rawTotal = dealFields.find(field => field.key === "amount_total")?.value ?? profile.amount
  const displayTotal = roundedDealTotal(rawTotal, currency, totalRounding)
  const changeTotalRounding = (mode: TotalRounding) => {
    if (!canMutate(role) || mode === totalRounding) return
    try {
      writeTotalRounding(dealId, mode)
    } catch {
      toast.error("총금액 처리 방식을 저장하지 못했습니다.")
      return
    }
    setTotalRounding(mode)
    addAudit("총금액 처리 방식 변경", `${totalRoundingLabels[totalRounding]} → ${totalRoundingLabels[mode]}`)
  }
  const mainInformation = useMemo(
    () => ({
      counterparty:
        profile.direction === "direction_pending" ? profile.counterparty : dealFields.find(
          (field) =>
            field.key === (profile.direction === "sales" ? "buyer" : "seller")
        )?.value ?? profile.counterparty,
      amount: displayTotal,
      currency,
    }),
    [
      dealFields,
      profile.direction,
      profile.counterparty,
      displayTotal,
      currency,
    ]
  )
  useEffect(() => {
    onMainInformationChange(mainInformation)
  }, [mainInformation, onMainInformationChange])
  const [lineItems, setLineItems] = useState(initialDealLineItems)
  useEffect(() => onContractItemsChange(lineItems), [lineItems, onContractItemsChange])
  useEffect(() => {
    onMissingFieldsChange(
      requiredDealReviews(
        dealFields,
        visibleGroups,
        lineItems,
        profile.direction
      )
    )
  }, [
    dealFields,
    visibleGroups,
    lineItems,
    profile.direction,
    onMissingFieldsChange,
  ])

  const [saveState, setSaveState] = useState<
    "saved" | "pending" | "saving" | "error"
  >("saved")
  const [lastSavedAt, setLastSavedAt] = useState(() => new Date())
  const currentEditorName =
    role === "owner" ? "조민영" : role === "admin" ? "박서윤" : "김도현"
  const pendingEditsRef = useRef(
    new Map<
      string,
      {
        target: string
        value: string
        baseVersion: number
      }
    >()
  )
  const editSessionsRef = useRef(
    new Map<string, { label: string; before: string }>()
  )
  const fieldVersionsRef = useRef(new Map<string, number>())
  const saveInFlightRef = useRef<Promise<boolean> | null>(null)
  const [fieldConflict, setFieldConflict] = useState<{
    target: string
    label: string
    mine: string
    current: string
    currentVersion: number
    updatedBy: string
  } | null>(null)
  const [unlinked, setUnlinked] = useState<string[]>([])
  const [linkedDocuments, setLinkedDocuments] = useState<
    Record<string, string>
  >({})
  const directFileInputRef = useRef<HTMLInputElement | null>(null)
  const directFileCodeRef = useRef<string | null>(null)
  const [documentsExpanded, setDocumentsExpanded] = useState(false)
  const [selectedCommercialInvoiceId, setSelectedCommercialInvoiceId] = useState<string | null>(null)
  useEffect(() => {
    const handleCiOpen = (event: Event) => {
      const detail = (event as CustomEvent<string | { fileName: string; invoiceId?: string }>).detail
      const fileName = typeof detail === "string" ? detail : detail?.fileName
      if (!fileName) return
      const ci = documents.find(document => document.code === "CI")
      if (!ci) return
      setSelected({
        ...ci,
        file: fileName,
        status: "검토",
        source: "업로드",
        commercialInvoiceId: typeof detail === "string" ? undefined : detail.invoiceId,
      })
      setSelectedCommercialInvoiceId(typeof detail === "string" ? null : detail.invoiceId ?? null)
      setDocumentsExpanded(false)
    }
    window.addEventListener("ecoya:open-ci-document", handleCiOpen)
    return () => window.removeEventListener("ecoya:open-ci-document", handleCiOpen)
  }, [])
  useEffect(() => {
    const handleShipmentOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ fileName?: string }>).detail
      const bl = documents.find(document => document.code === "BL")
      if (!bl) return
      setSelected({
        ...bl,
        file: detail?.fileName ?? bl.file,
        status: detail?.fileName ? "검토" : bl.status,
        source: detail?.fileName ? "업로드" : bl.source,
      })
      setSelectedCommercialInvoiceId(null)
      setDocumentsExpanded(false)
    }
    window.addEventListener("ecoya:open-shipment-document", handleShipmentOpen)
    return () => window.removeEventListener("ecoya:open-shipment-document", handleShipmentOpen)
  }, [])
  useEffect(() => {
    if (!documentRequest?.code) return
    const baseDocument = [...documents, ...supplementaryDocuments].find(
      (document) => document.code === documentRequest.code
    )
    if (!baseDocument) return
    const file = documentRequest.fileName ?? baseDocument.file
    const frame = window.requestAnimationFrame(() => {
      setSelected({
        ...baseDocument,
        file,
        status: file && documentRequest.code === "BL" ? "검토" : baseDocument.status,
        source: file && documentRequest.fileName ? "업로드" : baseDocument.source,
        commercialInvoiceId: documentRequest.invoiceId,
      })
      setSelectedCommercialInvoiceId(
        documentRequest.code === "CI" ? documentRequest.invoiceId ?? null : null
      )
      setDocumentsExpanded(false)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [documentRequest])
  const [missingDocumentPrompt, setMissingDocumentPrompt] =
    useState<DocumentSlot | null>(null)
  const [confirmUnlink, setConfirmUnlink] = useState(false)
  const visibleImportantDocuments = useMemo<DocumentSlot[]>(
    () =>
      orderedImportantDocuments.map((item) => {
        const linkedFile = linkedDocuments[item.code]
        if (linkedFile) {
          return {
            ...item,
            file: linkedFile,
            status: "분석 중",
            source: "업로드",
          }
        }
        if (unlinked.includes(item.code)) return { ...item, file: "", status: "미비", source: "-" }
        if (item.source === "발행") return item
        const record = documentRecords.find(record => record.originDealId === dealId && record.originCode === item.code)
        return record ? documentSlot(record) : { ...item, file: "", status: "미비", source: "-" }
      }),
    [orderedImportantDocuments, linkedDocuments, unlinked, documentRecords, dealId]
  )
  const visibleSupplementaryDocuments = documentRecords
    .filter(record => (record.originDealId !== dealId || !documents.some(slot => slot.code === record.originCode)) && !unlinked.includes(record.id))
    .map(documentSlot)
  const commercialInvoices = useMemo(
    () => [
      ...commercialInvoiceView.billsOfLading.flatMap((bill) => bill.connectedCommercialInvoices),
      ...commercialInvoiceView.unlinkedDocuments,
    ].filter((invoice, index, all) => all.findIndex((candidate) => candidate.documentId === invoice.documentId) === index),
    [commercialInvoiceView]
  )
  const selectedCommercialInvoice = selected.code === "CI"
    ? commercialInvoices.find((invoice) =>
        invoice.documentId === selectedCommercialInvoiceId ||
        (!selectedCommercialInvoiceId && invoice.fileName === selected.file)
      )
    : undefined
  const selectDocument = (document: DocumentSlot) => {
    setSelected(document)
    setSelectedCommercialInvoiceId(
      document.code === "CI"
        ? commercialInvoices.find((invoice) => invoice.fileName === document.file)?.documentId ?? null
        : null
    )
  }
  const connectedImportantCount = visibleImportantDocuments.filter(
    (item) => item.file
  ).length
  const importantDocumentCount = visibleImportantDocuments.length
  useEffect(() => {
    onDocumentSummaryChange({
      connected: connectedImportantCount,
      total: importantDocumentCount,
      documents: visibleImportantDocuments,
    })
  }, [
    connectedImportantCount,
    importantDocumentCount,
    visibleImportantDocuments,
    onDocumentSummaryChange,
  ])
  const totalDocumentCount =
    connectedImportantCount + visibleSupplementaryDocuments.length
  const availableDocuments = useMemo(
    () => [...visibleImportantDocuments, ...visibleSupplementaryDocuments].filter((document) => document.file),
    [visibleImportantDocuments, visibleSupplementaryDocuments]
  )
  const createdDocuments = useMemo(
    () => availableDocuments.filter((document) => document.source === "발행" || (profile.direction === "purchase" && document.code === "PO")),
    [availableDocuments, profile.direction]
  )
  const uploadedDocuments = useMemo(
    () => availableDocuments.filter((document) => !createdDocuments.includes(document)),
    [availableDocuments, createdDocuments]
  )
  const selectableDocuments = [
    ...visibleImportantDocuments.filter((item) => item.file),
    ...visibleSupplementaryDocuments,
  ]
  const selectedRecord = documentRecords.find(record => record.id === selected.documentId)
  const handleDocumentChanged = (record: DealDocumentRecord, action: string) => {
    setDocumentRecords(current => [...current.filter(item => item.id !== record.id), ...(record.dealId === dealId ? [record] : [])])
    window.dispatchEvent(new CustomEvent("ecoya:deal-documents-changed", { detail: dealId }))
    addAudit(action, `${record.file}${record.dealId !== dealId ? ` → ${record.dealId}` : ""}`)
    if (record.dealId === dealId) setSelected(current => current.documentId === record.id ? documentSlot(record) : current)
    else {
      setMovedDocument(record)
      setSelected(current => current.documentId === record.id
        ? selectableDocuments.find(item => item.documentId !== record.id) ?? { ...current, file: "", status: "미비" }
        : current)
    }
  }
  const selectedFieldSet = initialDocumentFields[selected.code]
  const readTargetValue = (target: string) => {
    const [kind, first, second] = target.split(":")
    if (kind === "field") {
      return dealFields.find((field) => field.key === first)?.value ?? ""
    }
    const item = lineItems.find((candidate) => candidate.id === Number(first))
    return item ? String(item[second as keyof DealLineItem] ?? "") : ""
  }
  const applyTargetValue = (target: string, value: string) => {
    const [kind, first, second] = target.split(":")
    if (kind === "field") {
      setDealFields((current) =>
        current.map((field) =>
          field.key === first ? { ...field, value } : field
        )
      )
      return
    }
    setLineItems((current) =>
      current.map((item) =>
        item.id === Number(first) ? { ...item, [second]: value } : item
      )
    )
  }
  const applyRefreshedDocuments = useEffectEvent((data: NonNullable<typeof refresh.data>) => {
    setDocumentRecords(data.documents)
    window.dispatchEvent(new CustomEvent("ecoya:deal-documents-changed", { detail: dealId }))
    setSelected(current => {
      if (unlinked.includes(current.code) || (current.documentId && unlinked.includes(current.documentId)) || linkedDocuments[current.code]) return current
      const record = data.documents.find(item => item.id === current.documentId)
      return record ? documentSlot(record) : current
    })
    for (const field of data.deal.fields) {
      if (!field.target.startsWith("field:") && !/^item:\d+:[A-Za-z]+$/.test(field.target)) continue
      if (pendingEditsRef.current.has(field.target) || editSessionsRef.current.has(field.target)) continue
      if (field.version < (fieldVersionsRef.current.get(field.target) ?? 0)) continue
      fieldVersionsRef.current.set(field.target, field.version)
      applyTargetValue(field.target, field.value)
    }
  })
  useEffect(() => {
    // A new read is the event; pending edits and current links are read at delivery time.
    // Reconcile the accepted external snapshot with editable local fields exactly once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (refresh.data) applyRefreshedDocuments(refresh.data)
  }, [refresh.data])
  // Prototype examples for the settlement-in-progress deal; latest values match its payment fields.
  const [paymentHistory, setPaymentHistory] = useState<AuditItem[]>(() => dealId === "DL-260629-03" ? [
    { id: 3, action: "지급 계좌 수정", detail: "이전 값 8830043970 → 변경 값 8830043968", actor: "조민영", time: "2026-10-30T14:20:00+09:00" },
    { id: 2, action: "SWIFT 수정", detail: "이전 값 DBSSSGSG → 변경 값 CHASSGSG", actor: "박서윤", time: "2026-10-29T10:30:00+09:00" },
    { id: 1, action: "지급 은행 수정", detail: "이전 값 DBS Bank Singapore → 변경 값 JPMorgan Chase Singapore", actor: "박서윤", time: "2026-10-29T10:30:00+09:00" },
  ] : [])
  const recordCommittedEdit = (target: string, finalValue: string) => {
    const session = editSessionsRef.current.get(target)
    if (!session || session.before === finalValue) {
      editSessionsRef.current.delete(target)
      return
    }
    if (["field:bank_name", "field:bank_account", "field:bank_swift", "field:payment_due"].includes(target)) {
      setPaymentHistory(current => [{
        id: Date.now(), action: `${session.label} 수정`,
        detail: `이전 값 ${session.before || "—"} → 변경 값 ${finalValue || "—"}`,
        actor: currentEditorName, time: new Date().toISOString(),
      }, ...current])
    }
    addAudit(
      `${session.label} 수정`,
      `이전 값 ${session.before || "—"} → 변경 값 ${finalValue || "—"}`
    )
    editSessionsRef.current.delete(target)
  }
  const flushPendingEdits = async (targets?: string[]): Promise<boolean> => {
    if (!canMutate(role)) return false
    if (saveInFlightRef.current) {
      const previousSaved = await saveInFlightRef.current
      if (!previousSaved) return false
      return flushPendingEdits(targets)
    }
    const targetSet = targets ? new Set(targets) : null
    const edits = [...pendingEditsRef.current.values()].filter(
      (edit) => !targetSet || targetSet.has(edit.target)
    )
    if (!edits.length) return true

    setSaveState("saving")
    const receipt = refresh.beginWrite()
    let accepted = false
    const request = (async () => {
      try {
        const [results] = await Promise.all([
          Promise.all(
            edits.map(async (edit) => ({
              edit,
              result: await prototypeBackend.deals.updateField({
                dealId,
                target: edit.target,
                value: edit.value,
                baseVersion: edit.baseVersion,
                actor: currentEditorName,
              }).catch(() => null),
            }))
          ),
          new Promise<void>((resolve) => window.setTimeout(resolve, 800)),
        ])

        accepted = results.some(({ result }) => result?.ok)
        if (!refresh.isCurrent(receipt)) return false
        let failed = false
        for (const { edit, result } of results) {
          if (!result) { failed = true; continue }
          if (!result.ok) {
            failed = true
            const session = editSessionsRef.current.get(edit.target)
            setFieldConflict({
              target: edit.target,
              label: session?.label ?? "거래 필드",
              mine: edit.value,
              current: result.currentValue,
              currentVersion: result.currentVersion,
              updatedBy: result.updatedBy,
            })
            continue
          }
          fieldVersionsRef.current.set(edit.target, result.version)
          const pending = pendingEditsRef.current.get(edit.target)
          if (pending?.value === edit.value) {
            pendingEditsRef.current.delete(edit.target)
          } else if (pending) {
            pendingEditsRef.current.set(edit.target, {
              ...pending,
              baseVersion: result.version,
            })
          }
        }

        if (failed) {
          setSaveState("error")
          return false
        }
        setLastSavedAt(new Date())
        setSaveState(pendingEditsRef.current.size ? "pending" : "saved")
        return true
      } catch {
        if (refresh.isCurrent(receipt)) setSaveState("error")
        return false
      } finally {
        refresh.finishWrite(receipt, accepted)
      }
    })()
    saveInFlightRef.current = request
    const saved = await request
    if (saveInFlightRef.current === request) saveInFlightRef.current = null
    return saved
  }
  const queueEdit = (
    target: string,
    label: string,
    before: string,
    value: string
  ) => {
    if (!editSessionsRef.current.has(target)) {
      editSessionsRef.current.set(target, { label, before })
    }
    const baseVersion =
      fieldVersionsRef.current.get(target) ??
      prototypeBackend.deals.getFieldVersion(dealId, target)
    pendingEditsRef.current.set(target, { target, value, baseVersion })
    setFieldConflict(null)
    setSaveState("pending")
  }
  const commitEdit = async (
    target: string,
    label: string,
    finalValue: string
  ) => {
    const session = editSessionsRef.current.get(target)
    if (session && session.label !== label) {
      editSessionsRef.current.set(target, { ...session, label })
    }
    const saved = await flushPendingEdits([target])
    if (saved) recordCommittedEdit(target, finalValue)
  }
  useEffect(() => {
    onSaveStatusChange?.({ state: saveState, savedAt: lastSavedAt, showRetry: saveState === "error" && !fieldConflict })
  }, [saveState, lastSavedAt, fieldConflict, onSaveStatusChange])
  const retryPendingEdits = async () => {
    const saved = await flushPendingEdits()
    if (!saved) return
    for (const target of [...editSessionsRef.current.keys()]) {
      recordCommittedEdit(target, readTargetValue(target))
    }
  }
  useEffect(() => {
    if (saveRetryRef) saveRetryRef.current = () => void retryPendingEdits()
  })
  const useConflictValue = () => {
    if (!fieldConflict) return
    applyTargetValue(fieldConflict.target, fieldConflict.current)
    fieldVersionsRef.current.set(
      fieldConflict.target,
      fieldConflict.currentVersion
    )
    pendingEditsRef.current.delete(fieldConflict.target)
    editSessionsRef.current.delete(fieldConflict.target)
    setFieldConflict(null)
    setSaveState(pendingEditsRef.current.size ? "pending" : "saved")
  }
  const keepMyConflictValue = async () => {
    if (!fieldConflict) return
    pendingEditsRef.current.set(fieldConflict.target, {
      target: fieldConflict.target,
      value: fieldConflict.mine,
      baseVersion: fieldConflict.currentVersion,
    })
    setFieldConflict(null)
    const saved = await flushPendingEdits([fieldConflict.target])
    if (saved) recordCommittedEdit(fieldConflict.target, fieldConflict.mine)
  }
  const openDirectFilePicker = (code?: string) => {
    directFileCodeRef.current = code ?? null
    directFileInputRef.current?.click()
  }
  const requestDocumentUpload = (document: DocumentSlot) => {
    if (document.code === "BL") {
      setMissingDocumentPrompt(document)
      return
    }
    openDirectFilePicker(document.code)
  }
  const addDirectFile = async (file: File, requestedCode?: string | null) => {
    const detectedCode = detectDealDocumentCode(file.name)
    const fallbackCode =
      visibleImportantDocuments.find((document) => !document.file)?.code ??
      selected.code
    const code = requestedCode ?? detectedCode ?? fallbackCode
    if (!canMutate(role)) return
    const receipt = refresh.beginWrite()
    let accepted = false
    try {
      const result = await prototypeBackend.deals.createDocument({
          dealId,
          documentCode: code,
          method: "file",
          fileName: file.name,
        })
      accepted = result.ok
      if (!refresh.isCurrent(receipt)) return
      if (!result.ok) throw new Error(result.error)
      toast.success("문서를 거래에 추가했습니다.")
      const baseDocument = [...documents, ...supplementaryDocuments].find(
        (document) => document.code === code
      )
      if (!baseDocument) return

      setUnlinked((items) => items.filter((itemCode) => itemCode !== code))
      setLinkedDocuments((items) => ({ ...items, [code]: file.name }))
      setSelected({
        ...baseDocument,
        file: file.name,
        status: "분석 중",
        source: "업로드",
      })
      addAudit("문서 추가", `${code} · ${file.name}`)
      // A B/L starts shipment work; CI alone does not decide between contract
      // review and payment work. That decision remains with nextWork.
      if (code === "BL" && plan.states.fulfillment === "planned")
        onStartWork("fulfillment")
    } catch (error) {
      if (refresh.isCurrent(receipt)) toast.error(error instanceof Error ? error.message : "문서를 추가하지 못했습니다.")
    } finally { refresh.finishWrite(receipt, accepted) }
  }

  return (
    <div className="min-w-0">
      <DealDocumentPanels
        customsControl={customsControl}
        linkedDeals={linkedDeals}
        aiQuestion={aiQuestion}
        plan={plan}
        workspaces={workspaces}
        previewWork={previewWork}
        onPreviewWork={onPreviewWork}
        onStartWork={onStartWork}
        onOpenDocument={onOpenDocument}
        canWrite={canMutate(role)}
        profile={profile}
        commercialInvoiceContent={<CommercialInvoiceTransactionCard financeStarted={plan.states.finance !== "planned"} dealId={dealId} view={commercialInvoiceView} canWrite={canMutate(role)} />}
        documentStrip={
          <div
            aria-label="거래 상세 서류 목록"
            className="mt-2 flex flex-wrap items-center gap-1"
          >
            {visibleImportantDocuments.map((document) => (
              <button
                key={documentKey(document)}
                type="button"
                aria-label={`${document.type} ${document.file ? "보유" : "미비"}`}
                aria-pressed={documentKey(selected) === documentKey(document)}
                className={cn(
                  "flex min-h-8 items-center gap-1.5 rounded-md px-2 text-xs",
                  documentKey(selected) === documentKey(document)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
                onClick={() => {
                  selectDocument(document)
                  setDocumentsExpanded(false)
                  onDocumentOpenChange(true)
                }}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    document.file ? document.status === "검토" || document.status === "유형 확인 필요" ? "border border-success bg-transparent" : "bg-success" : "bg-warning"
                  )}
                />
                {document.type}
                <span className="sr-only">
                  {document.file ? "보유" : "미비"}
                </span>
              </button>
            ))}
            <button
              type="button"
              className="flex min-h-8 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted"
              onClick={() => {
                setDocumentsExpanded(true)
                onDocumentOpenChange(true)
              }}
            >
              <span className="size-1.5 rounded-full bg-muted-foreground/60" />
              기타 서류 {visibleSupplementaryDocuments.length}건
            </button>
          </div>
        }
        documentOpen={documentOpen}
        documentPanelTarget={documentPanelTarget}
        onDocumentOpenChange={onDocumentOpenChange}
        failedPanel={failedPanel}
        onRetry={onRetry}
        primary={
          <section
            className={cn(
              "field-scrollbar min-w-0 px-4 py-4 xl:px-5 xl:pb-8",
              documentOpen && "xl:h-full xl:overflow-y-auto"
            )}
          >
            {documentOpen && <div className={refresh.failure ? "mb-4" : ""}>
              <PostWriteRefreshNotice failure={refresh.failure} busy={refresh.busy} onRetry={() => void refresh.refresh()} />
            </div>}
            <SectionHeading
              title={profile.direction === "direction_pending" ? "거래 상세" : `${directionLabels[profile.direction]} 거래 상세`}
              action={
                canMutate(role) ? (onSaveStatusChange ? null : (
                  <div className="flex items-center gap-2">
                    <AutoSaveStatus state={saveState} savedAt={lastSavedAt} />
                    {saveState === "error" && !fieldConflict ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => void retryPendingEdits()}
                      >
                        다시 저장
                      </Button>
                    ) : null}
                  </div>
                )) : (
                  <span className="text-xs text-muted-foreground">
                    보기 전용
                  </span>
                )
              }
            />
            {fieldConflict ? (
              <div
                className="mt-3 rounded-[var(--r-md)] border border-warning/35 bg-warning/5 p-3"
                role="alert"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <strong className="text-xs">
                      {fieldConflict.label}에 다른 변경이 있습니다.
                    </strong>
                    <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                      {fieldConflict.updatedBy}의 값 “
                      {fieldConflict.current || "비어 있음"}”과 내 값 “
                      {fieldConflict.mine || "비어 있음"}” 중 적용할 값을
                      선택하세요.
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={useConflictValue}
                    >
                      최신 값 사용
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      onClick={() => void keepMyConflictValue()}
                    >
                      내 값으로 변경
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
            <DealFieldsPanel
              rowStateKey={dealId}
              totalRounding={totalRounding}
              displayTotal={displayTotal}
              onTotalRoundingChange={changeTotalRounding}
              paymentHistory={paymentHistory}
              profile={profile}
              fields={dealFields}
              visibleGroups={visibleGroups}
              items={lineItems}
              role={role}
              onFieldChange={(fieldKey, value) => {
                const currentField = dealFields.find(
                  (field) => field.key === fieldKey
                )
                queueEdit(
                  `field:${fieldKey}`,
                  currentField?.label ?? fieldKey,
                  currentField?.value ?? "",
                  value
                )
                setDealFields((current) =>
                  current.map((field) =>
                    field.key === fieldKey
                      ? {
                          ...field,
                          value,
                          match: value ? "단일 출처" : "누락",
                          evidence: ["조민영 · 직접 입력"],
                        }
                      : field
                  )
                )
              }}
              onFieldCommit={(fieldKey, value, label) =>
                void commitEdit(`field:${fieldKey}`, label, value)
              }
              onItemChange={(id, key, value) => {
                const currentItem = lineItems.find((item) => item.id === id)
                queueEdit(
                  `item:${id}:${String(key)}`,
                  `품목 ${id} · ${String(key)}`,
                  String(currentItem?.[key] ?? ""),
                  value
                )
                setLineItems((current) =>
                  current.map((item) =>
                    item.id === id
                      ? {
                          ...item,
                          [key]: value,
                          match:
                            key === "quantity"
                              ? value.trim()
                                ? "단일 출처"
                                : "누락"
                              : item.match,
                          evidence: ["조민영 · 직접 입력"],
                        }
                      : item
                  )
                )
              }}
              onItemCommit={(id, key, value, label) =>
                void commitEdit(`item:${id}:${String(key)}`, label, value)
              }
              onAddItem={() => {
                const nextId =
                  Math.max(...lineItems.map((item) => item.id), 0) + 1
                const target = `item:${nextId}:created`
                queueEdit(target, `품목 ${nextId} 추가`, "—", "추가")
                setLineItems((current) => [
                  ...current,
                  {
                    id: nextId,
                    goods: "",
                    hsCode: "",
                    quantity: "",
                    quantityUnit: "MT",
                    unitPrice: "",
                    currency: "USD",
                    packageCount: "",
                    packageUnit: "bundles",
                    grossWeight: "",
                    netWeight: "",
                    weightUnit: "KG",
                    match: "누락",
                    evidence: ["직접 입력 대기"],
                  },
                ])
                void commitEdit(target, `품목 ${nextId} 추가`, "추가")
              }}
              onRemoveItem={(id) => {
                const target = `item:${id}:deleted`
                queueEdit(target, `품목 ${id} 삭제`, "보유", "삭제")
                setLineItems((current) =>
                  current.filter((item) => item.id !== id)
                )
                void commitEdit(target, `품목 ${id} 삭제`, "삭제")
              }}
            />
          </section>
        }
        preview={
          <aside className="field-scrollbar min-w-0 border-t px-4 py-4 xl:h-full xl:overflow-y-auto xl:border-t-0 xl:px-5 xl:pb-8">
            <div className="border-b border-[var(--surface-border)] pb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">거래 서류</h3>
                <Popover open={documentsExpanded} onOpenChange={setDocumentsExpanded}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5">
                      <FileText data-icon="inline-start" />서류함 {totalDocumentCount}
                    </Button>
                  </PopoverTrigger>
                  <DealDocumentShelf
                    documents={availableDocuments}
                    uploadedDocuments={uploadedDocuments}
                    createdDocuments={createdDocuments}
                    selected={selected}
                    onSelect={(document) => {
                      selectDocument(document)
                      setDocumentsExpanded(false)
                    }}
                    onAddDocument={() => openDirectFilePicker()}
                  />
                </Popover>
                <div
                  className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto"
                  aria-label="중요 서류 요약"
                >
                  {visibleImportantDocuments.map((document) => {
                    const isMissing = !document.file
                    const isSelected = documentKey(selected) === documentKey(document)
                    return (
                      <button
                        key={documentKey(document)}
                        type="button"
                        className={cn(
                          "flex h-7 shrink-0 items-center gap-1 rounded-[var(--r-sm)] px-2 text-[10px] font-medium whitespace-nowrap transition-colors focus-visible:[box-shadow:var(--shadow-keyboard-focus)] focus-visible:outline-none",
                          isSelected
                            ? "bg-[var(--control-selected-soft-background)] text-primary"
                            : "text-muted-foreground hover:bg-[var(--surface-muted-background)] hover:text-foreground"
                        )}
                        onClick={() => {
                          setDocumentsExpanded(false)
                          if (isMissing) {
                            requestDocumentUpload(document)
                          } else {
                            selectDocument(document)
                          }
                        }}
                        aria-label={`${document.type} ${isMissing ? "미비" : "보유"}`}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            isMissing ? "bg-warning" : document.status === "검토" || document.status === "유형 확인 필요" ? "border border-success bg-transparent" : "bg-success"
                          )}
                        />
                        <span>{document.type}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <input
              ref={directFileInputRef}
              type="file"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) {
                  void addDirectFile(file, directFileCodeRef.current)
                }
                directFileCodeRef.current = null
                event.target.value = ""
              }}
            />
            {movedDocument && <p role="status" className="my-2 rounded-md bg-muted px-3 py-2 text-xs">
              {movedDocument.file} 서류를 이동했습니다. <a href={`/erp/deals/${movedDocument.dealId}`} className="font-medium text-primary underline">이동한 거래 보기</a>
            </p>}
            <div className="mt-2">
              {!selected.file ? (
                <div className="flex min-w-0 items-center gap-2 border-y border-[var(--surface-border)] px-1 py-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-[var(--r-xs)] border border-[var(--surface-border)] text-[9px] font-semibold text-[var(--color-red-2)]">
                    PDF
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">
                      {selected.type} 미연결
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                      {selected.code} · {selected.type} · 파일 추가 필요
                    </span>
                  </span>
                  <StatusBadge
                    tone={
                      selected.status === "미비"
                        ? "warning"
                        : selected.status === "원본 미첨부"
                          ? "warning"
                          : selected.status === "발행"
                            ? "blue"
                            : selected.status === "분석 중"
                              ? "blue"
                              : selected.status === "검토"
                                ? "blue"
                                : "success"
                    }
                  >
                    {selected.status === "검토" ? "확인 전" : selected.status}
                  </StatusBadge>
                  {selected.file && canMutate(role) ? (
                    <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon-sm" className="shrink-0" aria-label="거래 연결 해제" onClick={() => setConfirmUnlink(true)}><Unlink /></Button></TooltipTrigger><TooltipContent>거래 연결 해제</TooltipContent></Tooltip>
                  ) : null}
                </div>
              ) : null}
              {selected.file ? (
                <>
                  <DealPdf
                    key={`${selected.code}-${selectedCommercialInvoice?.documentId ?? selected.file}`}
                    slot={selected}
                    previewFields={selectedCommercialInvoice ? [
                      ["Invoice No.", selectedCommercialInvoice.invoiceNumber ?? "—"],
                      ["Invoice Date", selectedCommercialInvoice.invoiceDate ?? "—"],
                      ["Item", selectedCommercialInvoice.item ?? "—"],
                      ["Quantity", selectedCommercialInvoice.quantity ?? "—"],
                      ["Unit Price", selectedCommercialInvoice.unitPrice ?? "—"],
                      ["Packages", selectedCommercialInvoice.packageCount && selectedCommercialInvoice.packageUnit ? `${selectedCommercialInvoice.packageCount} ${selectedCommercialInvoice.packageUnit}` : selectedCommercialInvoice.packageCount ?? selectedCommercialInvoice.packageUnit ?? "—"],
                      [
                        "Amount",
                        selectedCommercialInvoice.currency && selectedCommercialInvoice.totalAmount != null
                          ? `${selectedCommercialInvoice.totalAmount.toLocaleString()} ${selectedCommercialInvoice.currency}`
                          : "—",
                      ],
                      ["Payment", "T/T 30 days"],
                    ] : undefined}
                    fieldSummary={
                      selectedFieldSet
                        ? `${selectedFieldSet.fields.length}/${selectedFieldSet.total} 필드`
                        : "필드 분석 중"
                    }
                    actions={selectedRecord && <DealDocumentActions
                      key={selectedRecord.id}
                      document={selectedRecord}
                      canWrite={canMutate(role)}
                      onChanged={handleDocumentChanged}
                    />}
                    canUnlink={canMutate(role)}
                    onUnlink={() => setConfirmUnlink(true)}
                  />
                </>
              ) : (
                <div className="mt-4 flex min-h-[360px] items-center justify-center rounded-md border border-dashed bg-sidebar/40 px-6 text-center">
                  <div>
                    <FilePlus2 className="mx-auto size-6 text-muted-foreground" />
                    <p className="mt-3 text-sm font-medium">
                      {selected.type} 문서가 연결되지 않았습니다
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      파일을 올린 뒤 이 거래에 연결할 수 있습니다.
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => requestDocumentUpload(selected)}
                    >
                      <FilePlus2 data-icon="inline-start" />이 거래에 서류 추가
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        }
      />
      <AlertDialog
        open={Boolean(missingDocumentPrompt)}
        onOpenChange={(open) => {
          if (!open) setMissingDocumentPrompt(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>선하증권 파일을 추가할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              문서 올리기에서 내용을 검토한 뒤 현재 거래에 연결할 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setMissingDocumentPrompt(null)
                onUpload()
              }}
            >
              문서 올리기로 이동
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {confirmUnlink ? (
        <ActionDialog
          title="문서 연결 해제"
          description="문서는 삭제되지 않고 파일 올리기의 최근 파일로 돌아갑니다. 거래 상태, 대조 결과와 정산 금액은 다시 계산됩니다."
          confirmLabel="연결 해제"
          destructive
          onClose={() => setConfirmUnlink(false)}
          onConfirm={async () => {
            if (!canMutate(role)) return
            const receipt = refresh.beginWrite()
            let accepted = false
            try {
              const result = await prototypeBackend.deals.unlinkDocument({
                  dealId,
                  documentId: selected.file || selected.code,
                })
              accepted = result.ok
              if (!refresh.isCurrent(receipt)) return
              if (!result.ok) throw new Error(result.error)
              toast.success("문서 연결을 해제했습니다.")
              setUnlinked((items) => [...items, selected.code, documentKey(selected)])
              addAudit("문서 연결 해제", selected.file)
              setConfirmUnlink(false)
              const next = selectableDocuments.find(
                (item) => documentKey(item) !== documentKey(selected)
              )
              setSelected(current => documentKey(current) === documentKey(selected)
                ? next ?? { ...current, file: "", status: "미비", documentId: undefined }
                : current)
            } finally { refresh.finishWrite(receipt, accepted) }
          }}
        />
      ) : null}
    </div>
  )
}

function FulfillmentTab({
  dealId,
  role,
  addAudit,
  onSummaryChange,
  onEditUnitPrice,
  shipmentContent,
}: {
  dealId: string
  role: Role
  addAudit: (action: string, detail: string) => void
  onSummaryChange: (summary: DealShipmentSummary) => void
  onEditUnitPrice: () => void
  shipmentContent?: ReactNode
}) {
  const refresh = useDealRefresh()
  const dateTag = useLocaleTag()
  const [lifecycle, setLifecycle] = useState<OrderState>(() => dealFixtures.find((deal) => deal.id === dealId)?.orderLifecycle ?? "open")
  const [action, setAction] = useState<OrderAction>(null)
  const [reason, setReason] = useState("")
  const [orderEvents, setOrderEvents] = useState<AuditItem[]>([
    {
      id: 1,
      action: "가격 수정",
      detail: "USD 120,000/MT",
      actor: "조민영",
      time: "2026-07-09T14:20:00+09:00",
    },
  ])
  const [refreshing, setRefreshing] = useState(false)
  const [snapOpen, setSnapOpen] = useState(false)
  const [snapCandidate, setSnapCandidate] = useState("MSCU-014W-2201")
  const [snapLinked, setSnapLinked] = useState("")
  const timelineStart = Date.UTC(2026, 6, 20)
  const timelineDays = 90
  const dayMs = 24 * 60 * 60 * 1000
  const formatTimelineDate = (offset: number) => {
    const date = new Date(timelineStart + offset * dayMs)
    return `${String(date.getUTCMonth() + 1).padStart(2, "0")}.${String(
      date.getUTCDate()
    ).padStart(2, "0")}`
  }
  const [shipmentRanges, setShipmentRanges] = useState([
    {
      id: "014W-01",
      carrier: "HMM Green",
      route: "Busan → Incheon",
      startDay: 0,
      duration: 14,
      status: "운송 중",
      tone: "blue" as const,
    },
    {
      id: "014W-02",
      carrier: "ONE Harmony",
      route: "Melbourne → Busan",
      startDay: 7,
      duration: 15,
      status: "예약",
      tone: "neutral" as const,
    },
    {
      id: "014W-03",
      carrier: "Maersk Lima",
      route: "Hamburg → Busan",
      startDay: 2,
      duration: 87,
      status: "운송 중",
      tone: "blue" as const,
    },
  ])
  useEffect(() => {
    if (shipmentContent || !orderProgress(dealId)) return
    const labels: Record<OrderState, string> = {
      open: "추가 선적 대기",
      closed: "완료 마감",
      short_closed: "미달 마감",
      cancelled: "취소됨",
    }
    const earliest = Math.min(
      ...shipmentRanges.map((item) => item.startDay + item.duration)
    )
    const eta = new Date(Date.UTC(2026, 6, 20) + earliest * 86400000)
      .toISOString()
      .slice(0, 10)
    onSummaryChange({
      state: labels[lifecycle],
      eta,
      count: shipmentRanges.length,
      snap: snapLinked,
    })
  }, [dealId, lifecycle, shipmentRanges, snapLinked, onSummaryChange, shipmentContent])
  const [shipmentDrag, setShipmentDrag] = useState<{
    id: string
    startX: number
    initialStartDay: number
  } | null>(null)
  const moveShipment = (id: string, nextStartDay: number) => {
    setShipmentRanges((items) =>
      items.map((shipment) =>
        shipment.id === id
          ? {
              ...shipment,
              startDay: Math.max(
                0,
                Math.min(timelineDays - shipment.duration, nextStartDay)
              ),
            }
          : shipment
      )
    )
  }
  const terminal = lifecycle !== "open"
  const labels: Record<OrderState, string> = {
    open: "추가 선적 대기",
    closed: "완료 마감",
    short_closed: "미달 마감",
    cancelled: "취소됨",
  }
  const finish = async () => {
    if (!action || !canMutate(role)) return
    const receipt = refresh.beginWrite()
    let accepted = false
    try {
      const result = await prototypeBackend.deals.orderAction({
          dealId,
          action,
          reason: reason.trim() || undefined,
        })
      accepted = result.ok
      if (!refresh.isCurrent(receipt)) return
      if (!result.ok) throw new Error(result.error)
      toast.success("주문 상태를 변경했습니다.")
      if (action === "close") setLifecycle("closed")
      if (action === "short_close") setLifecycle("short_closed")
      if (action === "cancel") setLifecycle("cancelled")
      if (action === "reopen") setLifecycle("open")
      addAudit("주문 상태 변경", `${action} ${reason}`.trim())
      const actionLabels: Record<Exclude<OrderAction, null>, string> = {
        close: "완료 마감",
        short_close: "미달 마감",
        cancel: "주문 취소",
        reopen: "주문 재오픈",
      }
      setOrderEvents((items) => [
        {
          id: Date.now(),
          action: actionLabels[action],
          detail: reason.trim(),
          actor: "조민영",
          time: new Date().toISOString(),
        },
        ...items,
      ])
      setAction(null)
      setReason("")
    } finally { refresh.finishWrite(receipt, accepted) }
  }
  return (
    <>
      <div className="flex flex-col gap-4">
        <DetailCard className="bg-card">
          <div className="flex flex-col gap-6">
            <section>
              <SectionHeading
                title={<span className="flex flex-wrap items-center gap-2 text-lg">주문 이행{lifecycle === "open" ? <Badge palette="powder" tone="fill" className="font-normal">{labels[lifecycle]}</Badge> : <StatusBadge tone={lifecycle === "closed" || lifecycle === "short_closed" ? "success" : "neutral"}>{labels[lifecycle]}</StatusBadge>}</span>}
                description="계약 20 MT 중 16 MT 선적"
                action={
                  <div className="flex flex-wrap items-center gap-2">
                    <DealContractTool />
                    {canMutate(role) ? <>
                      {terminal ? <Button size="sm" variant="outline" onClick={() => setAction("reopen")}><RotateCcw data-icon="inline-start" />재오픈</Button> : <>
                        <Button size="sm" variant="outline" onClick={() => setAction("close")}>완료 마감</Button>
                        <Button size="sm" variant="outline" onClick={() => setAction("short_close")}>미달 마감</Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button size="icon-sm" variant="outline" aria-label="주문 이행 더보기"><MoreVertical /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onEditUnitPrice}>단가 수정</DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => setAction("cancel")}>취소</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>}
                    </> : null}
                  </div>
                }
              />
              <div className="mt-4">
                <Progress value={80} className="h-2" aria-label="주문 이행률" />
                <div className="mt-2 flex justify-between text-[11px] leading-4 text-muted-foreground">
                  <span>누적 16 MT · 80%</span>
                  <span>{terminal ? "마감 상태 · 잔량 경고 제외" : "잔여 4 MT"}</span>
                </div>
                {!canMutate(role) && <p className="mt-2 text-xs text-muted-foreground">Owner 또는 관리자만 주문 상태를 변경할 수 있습니다.</p>}
              </div>
            </section>
            <section className="border-t pt-4">
              <SectionHeading title="주문 이력" action={
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-10 shrink-0 gap-1 px-0 text-[15px] leading-[22px] font-normal text-[var(--color-primary-4)] hover:bg-transparent hover:text-[var(--color-primary-4)] hover:underline"
                  onClick={() => window.dispatchEvent(new CustomEvent("ecoya:open-activity-history"))}
                >
                  전체 이력<ChevronRight data-icon="inline-end" className="size-5" />
                </Button>
              } />
              {/* Figma TimelineItem (7934:199865): title + detail · actor, time on the right. */}
              <ol id="deal-order-history" className="mt-2">
                {orderEvents.map((event, index, visible) => (
                  <li key={event.id} className="flex items-start gap-3">
                    <div aria-hidden="true" className="flex w-3 shrink-0 flex-col items-center self-stretch gap-1 pt-1.5">
                      <span className="size-2.5 rounded-full bg-[var(--color-primary-4)]" />
                      {(index < visible.length - 1 || !terminal) && <span className="w-0.5 flex-1 bg-[var(--color-gray-10)]" />}
                    </div>
                    <div className="min-w-0 flex-1 pb-3.5">
                      <p className="text-[15px] leading-[22px]">{event.action}</p>
                      <p className="mt-0.5 text-[13px] leading-[18px] text-muted-foreground">{event.detail} · {event.actor}</p>
                    </div>
                    <span className="shrink-0 text-[13px] leading-[18px] text-muted-foreground tabular-nums">{formatDateTime(event.time, dateTag)}</span>
                  </li>
                ))}
                {!terminal && <li className="flex items-start gap-3">
                  <div aria-hidden="true" className="flex w-3 shrink-0 justify-center pt-1.5"><span className="size-2.5 rounded-full border-2 border-[var(--color-primary-4)] bg-card" /></div>
                  <div className="min-w-0 flex-1 pb-3.5"><p className="text-[15px] leading-[22px]">다음 · 추가 선적 대기</p><p className="mt-0.5 text-[13px] leading-[18px] text-muted-foreground">잔여 4 MT — 추가 선적하거나 완료 · 미달 마감으로 닫기</p></div>
                  <span className="shrink-0 text-[13px] leading-[18px] text-muted-foreground">—</span>
                </li>}
              </ol>
            </section>
          </div>
        </DetailCard>
        {shipmentContent ?? <DetailCard>
          <section>
            <SectionHeading
              title="선적 진행 (분할선적)"
              description="각 B/L은 독립 일정으로 시작일과 종료일이 서로 다릅니다."
              action={
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone="neutral">90일 범위</StatusBadge>
                  {canMutate(role) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSnapOpen(true)}
                    >
                      <Link2 data-icon="inline-start" />
                      SNAP 연결
                    </Button>
                  ) : null}
                  <Button
                    size="icon-sm"
                    variant="outline"
                    aria-label={refreshing ? "갱신 중" : "새로고침"}
                    title={refreshing ? "갱신 중" : "새로고침"}
                    disabled={refreshing}
                    onClick={async () => {
                      setRefreshing(true)
                      try {
                        await requireMutation(
                          prototypeBackend.shipments.refreshTracking({
                            id: dealId,
                          }),
                          "추적 정보를 갱신했습니다."
                        )
                        addAudit("선적 추적 갱신", dealId)
                      } finally {
                        setRefreshing(false)
                      }
                    }}
                  >
                    <RefreshCw
                      aria-hidden="true"
                      className={cn(refreshing && "animate-spin")}
                    />
                  </Button>
                </div>
              }
            />
            {snapLinked ? (
              <p className="mt-3 rounded-md border bg-success/5 px-3 py-2 text-sm text-success">
                SNAP 컨테이너 {snapLinked} 연결됨
              </p>
            ) : null}
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <GripVertical className="size-3.5" />
              {canMutate(role)
                ? "막대를 좌우로 드래그하거나 방향키로 일정을 이동할 수 있습니다."
                : "각 막대는 개별 선적의 ETD–ETA 범위입니다."}
            </p>
            <div className="mt-4 overflow-x-auto rounded-[var(--r-md)] border border-[var(--surface-border)] bg-[var(--surface-background)]">
              <div className="min-w-[1360px]">
                <div className="grid grid-cols-[220px_minmax(960px,1fr)_88px] items-end gap-4 border-b border-[var(--surface-border)] bg-[var(--surface-muted-background)] px-4 py-3">
                  <span className="text-xs font-medium text-white/75">
                    선적 / 구간
                  </span>
                  <div className="grid grid-cols-7 text-center text-[11px] text-muted-foreground">
                    {[0, 15, 30, 45, 60, 75, 90].map((day) => (
                      <span key={day}>{formatTimelineDate(day)}</span>
                    ))}
                  </div>
                  <span className="text-center text-xs font-medium text-muted-foreground">
                    상태
                  </span>
                </div>
                {shipmentRanges.map((shipment) => (
                  <div
                    key={shipment.id}
                    className="grid grid-cols-[220px_minmax(960px,1fr)_88px] items-center gap-4 border-t border-[var(--surface-border)] px-4 py-3 first:border-t-0"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm">B/L {shipment.id}</strong>
                        <span className="truncate text-xs text-muted-foreground">
                          {shipment.carrier}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {shipment.route}
                      </p>
                    </div>
                    <div
                      data-shipment-track
                      className="relative h-12 overflow-hidden rounded-[var(--r-md)] bg-[var(--surface-muted-background)]"
                    >
                      <div className="absolute inset-0 grid grid-cols-7">
                        {Array.from({ length: 7 }).map((_, index) => (
                          <span
                            key={index}
                            className="border-l border-[var(--surface-border)] first:border-l-0"
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        aria-label={`B/L ${shipment.id} 일정 ${formatTimelineDate(shipment.startDay)}부터 ${formatTimelineDate(shipment.startDay + shipment.duration)}까지`}
                        aria-disabled={!canMutate(role)}
                        tabIndex={canMutate(role) ? 0 : -1}
                        title={
                          canMutate(role)
                            ? "좌우로 드래그하거나 방향키로 이동"
                            : "선적 일정"
                        }
                        className={cn(
                          "absolute top-1/2 flex h-[var(--control-size-sm)] -translate-y-1/2 touch-none items-center justify-between gap-1 overflow-hidden rounded-[var(--r-md)] border border-[var(--color-primary-7)] bg-[var(--color-primary-10)] text-xs font-medium text-[var(--color-primary-1)] shadow-sm select-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:outline-none",
                          canMutate(role)
                            ? "cursor-grab active:cursor-grabbing"
                            : "cursor-default"
                        )}
                        style={{
                          left: `${(shipment.startDay / timelineDays) * 100}%`,
                          width: `${(shipment.duration / timelineDays) * 100}%`,
                        }}
                        onPointerDown={(event) => {
                          if (!canMutate(role) || event.button !== 0) return
                          event.currentTarget.setPointerCapture(event.pointerId)
                          setShipmentDrag({
                            id: shipment.id,
                            startX: event.clientX,
                            initialStartDay: shipment.startDay,
                          })
                        }}
                        onPointerMove={(event) => {
                          if (shipmentDrag?.id !== shipment.id) return
                          const track = event.currentTarget.closest(
                            "[data-shipment-track]"
                          )
                          if (!(track instanceof HTMLElement)) return
                          const deltaDays = Math.round(
                            ((event.clientX - shipmentDrag.startX) /
                              track.getBoundingClientRect().width) *
                              timelineDays
                          )
                          moveShipment(
                            shipment.id,
                            shipmentDrag.initialStartDay + deltaDays
                          )
                        }}
                        onPointerUp={(event) => {
                          if (shipmentDrag?.id !== shipment.id) return
                          event.currentTarget.releasePointerCapture(
                            event.pointerId
                          )
                          setShipmentDrag(null)
                          addAudit(
                            "선적 일정 이동",
                            `B/L ${shipment.id} · ${formatTimelineDate(shipment.startDay)}–${formatTimelineDate(shipment.startDay + shipment.duration)}`
                          )
                        }}
                        onKeyDown={(event) => {
                          if (!canMutate(role)) return
                          if (
                            event.key !== "ArrowLeft" &&
                            event.key !== "ArrowRight"
                          ) {
                            return
                          }
                          event.preventDefault()
                          moveShipment(
                            shipment.id,
                            shipment.startDay +
                              (event.key === "ArrowLeft" ? -1 : 1)
                          )
                        }}
                      >
                        <GripVertical className="size-3.5 shrink-0 opacity-60" />
                        <span className="min-w-0 truncate px-1 tabular-nums">
                          {formatTimelineDate(shipment.startDay)} →{" "}
                          {formatTimelineDate(
                            shipment.startDay + shipment.duration
                          )}
                        </span>
                        <GripVertical className="size-3.5 shrink-0 opacity-60" />
                      </button>
                    </div>
                    <div className="text-center">
                      <StatusBadge tone={shipment.tone}>
                        {shipment.status}
                      </StatusBadge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              90일을 초과하는 일정은 다음 구간으로 이어집니다. 마지막 갱신
              2026.07.13 09:30 · 2건 자동 추적, 1건 수동 입력
            </p>
          </section>
        </DetailCard>}
      </div>
      {action ? (
        <ActionDialog
          title={
            action === "close"
              ? "주문 완료 마감"
              : action === "short_close"
                ? "주문 미달 마감"
                : action === "cancel"
                  ? "주문 취소"
                  : "주문 재오픈"
          }
          description="변경 내용은 즉시 주문 상태와 감사 이력에 반영됩니다."
          confirmLabel={action === "reopen" ? "재오픈" : "변경 적용"}
          destructive={action === "cancel"}
          canConfirm={
            action === "close" || action === "reopen" || Boolean(reason.trim())
          }
          onClose={() => setAction(null)}
          onConfirm={finish}
        >
          {action === "short_close" || action === "cancel" ? (
            <Field label="사유">
              <Textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="미달 마감 또는 취소 사유를 입력하세요"
              />
            </Field>
          ) : (
            <p className="text-sm text-muted-foreground">
              이 작업을 계속하시겠습니까?
            </p>
          )}
        </ActionDialog>
      ) : null}
      {snapOpen ? (
        <ActionDialog
          title="SNAP 선적 연결"
          description="컨테이너 또는 B/L 후보를 선택하면 운송 상태가 이 거래에 연결됩니다."
          confirmLabel="연결"
          onClose={() => setSnapOpen(false)}
          onConfirm={async () => {
            await requireMutation(
              prototypeBackend.shipments.allocateSnap({
                dealId,
                candidateId: snapCandidate,
              }),
              "SNAP 증강을 연결했습니다."
            )
            setSnapLinked(snapCandidate)
            addAudit("SNAP 연결", snapCandidate)
            setSnapOpen(false)
          }}
        >
          <Field label="연결 후보">
            <SimpleSelect
              value={snapCandidate}
              onValueChange={setSnapCandidate}
              options={["MSCU-014W-2201", "OOLU-014W-9981", "B/L 014W-02"]}
            />
          </Field>
        </ActionDialog>
      ) : null}
    </>
  )
}

type Party = {
  id: number
  role: string
  name: string
  source: "문서" | "직접 입력"
}
type Contact = { id: number; role: string; name: string; company: string }
function PeopleTab({
  dealId,
  role,
  addAudit,
}: {
  dealId: string
  role: Role
  addAudit: (action: string, detail: string) => void
}) {
  const [parties, setParties] = useState<Party[]>(
    [
      ["매도자", "KATAMAN ASIA-PACIFIC PTE LTD", "문서"],
      ["매수자", "ECOYA Demo Co.", "문서"],
      ["공급사", "KATAMAN Australia", "직접 입력"],
      ["송하인", "KATAMAN Australia", "문서"],
      ["수하인", "ECOYA Demo Co.", "문서"],
      ["통지처", "ECOYA Import Desk", "직접 입력"],
      ["포워더", "HMM Logistics", "직접 입력"],
      ["통관사", "Busan Customs Partner", "직접 입력"],
      ["은행", "JPMorgan Chase Singapore", "문서"],
    ].map((item, index) => ({
      id: index + 1,
      role: item[0],
      name: item[1],
      source: item[2] as Party["source"],
    }))
  )
  const [partyEdit, setPartyEdit] = useState<Party | "new" | null>(null)
  const [partyForm, setPartyForm] = useState({ role: "매도자", name: "" })
  const [partySaving, setPartySaving] = useState(false)
  const [partyDelete, setPartyDelete] = useState<Party | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([
    { id: 1, role: "관리자", name: "조민영", company: "ECOYA" },
    { id: 2, role: "업체 담당자", name: "Sarah Lim", company: "KATAMAN" },
  ])
  const [contactOpen, setContactOpen] = useState(false)
  const [contactRemove, setContactRemove] = useState<Contact | null>(null)
  const [contactForm, setContactForm] = useState({
    role: "업체 담당자",
    existing: "",
    newName: "",
  })
  const saveParty = async () => {
    if (!partyForm.name.trim() || partySaving) return
    setPartySaving(true)
    try {
      if (partyEdit === "new") {
        await requireMutation(
          prototypeBackend.deals.createParty({
            dealId,
            role: partyForm.role,
            name: partyForm.name.trim(),
            source: "직접 입력",
          }),
          "당사자를 추가했습니다."
        )
        setParties((items) => [
          ...items,
          {
            id: Date.now(),
            ...partyForm,
            name: partyForm.name.trim(),
            source: "직접 입력",
          },
        ])
        addAudit("당사자 추가", `${partyForm.role} · ${partyForm.name}`)
      } else if (partyEdit) {
        await requireMutation(
          prototypeBackend.deals.updateParty({
            dealId,
            partyId: String(partyEdit.id),
            role: partyForm.role,
            name: partyForm.name.trim(),
            source: "직접 입력",
          }),
          "당사자를 수정했습니다."
        )
        setParties((items) =>
          items.map((item) =>
            item.id === partyEdit.id
              ? { ...item, ...partyForm, source: "직접 입력" }
              : item
          )
        )
        addAudit("당사자 수정", `${partyForm.role} · ${partyForm.name}`)
      }
      setPartyEdit(null)
    } finally {
      setPartySaving(false)
    }
  }
  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="py-2">
          <div className="flex flex-col gap-7">
            <section>
              <SectionHeading
                title="당사자 (역할별)"
                action={
                  canMutate(role) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setPartyEdit("new")
                        setPartyForm({ role: "매도자", name: "" })
                      }}
                    >
                      <Plus data-icon="inline-start" />
                      당사자 추가
                    </Button>
                  ) : null
                }
              />
              <div className="mt-3 grid gap-x-6 xl:grid-cols-2">
                {parties.map((party) => {
                  const isEditing =
                    typeof partyEdit === "object" && partyEdit?.id === party.id
                  return (
                    <div
                      key={party.id}
                      className={cn(
                        "min-w-0 border-b border-[var(--surface-border)] py-3",
                        isEditing && "rounded-md border bg-muted/45 p-3"
                      )}
                    >
                      {isEditing ? (
                        <div className="grid gap-2 sm:grid-cols-[100px_minmax(0,1fr)]">
                          <SimpleSelect
                            value={partyForm.role}
                            onValueChange={(nextRole) =>
                              setPartyForm({ ...partyForm, role: nextRole })
                            }
                            options={[
                              "매도자",
                              "매수자",
                              "공급사",
                              "송하인",
                              "수하인",
                              "통지처",
                              "포워더",
                              "통관사",
                              "은행",
                            ]}
                          />
                          <Input
                            autoFocus
                            value={partyForm.name}
                            onChange={(event) =>
                              setPartyForm({
                                ...partyForm,
                                name: event.target.value,
                              })
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Escape") setPartyEdit(null)
                              if (event.key === "Enter") void saveParty()
                            }}
                            aria-label={`${party.role} 이름`}
                          />
                          <span className="flex items-center justify-end gap-1 sm:col-span-2">
                            <Button
                              size="sm"
                              disabled={!partyForm.name.trim() || partySaving}
                              onClick={() => void saveParty()}
                            >
                              {partySaving ? (
                                <LoaderCircle className="animate-spin" />
                              ) : (
                                <Check />
                              )}
                              저장
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={partySaving}
                              onClick={() => setPartyEdit(null)}
                              aria-label="당사자 편집 취소"
                            >
                              <X />
                            </Button>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2 text-xs">
                              <span className="font-medium">{party.role}</span>
                              <span className="text-muted-foreground">
                                {party.source}
                              </span>
                            </div>
                            <strong className="block text-sm font-medium break-words">
                              {party.name}
                            </strong>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <DealPartyTool party={party} />
                            {canMutate(role) ? (
                              <span className="flex text-muted-foreground">
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => {
                                    setPartyEdit(party)
                                    setPartyForm({
                                      role: party.role,
                                      name: party.name,
                                    })
                                  }}
                                  aria-label="당사자 편집"
                                >
                                  <Pencil />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => setPartyDelete(party)}
                                  aria-label="당사자 삭제"
                                >
                                  <Trash2 />
                                </Button>
                              </span>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
            <Separator />
            <section>
              <SectionHeading
                title="영업 담당자"
                description="기존 연락처를 검색하거나 새 연락처를 만들어 연결합니다."
                action={
                  canMutate(role) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-10 shrink-0 gap-1 px-0 text-[15px] leading-[22px] font-normal text-[var(--color-primary-4)] hover:bg-transparent hover:text-[var(--color-primary-4)] hover:underline"
                      onClick={() => setContactOpen(true)}
                    >
                      연락처 연결<ChevronRight data-icon="inline-end" className="size-5" />
                    </Button>
                  ) : null
                }
              />
              {/* Figma 7872:185114 Item: name / role · company in a bordered row. */}
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex min-w-0 items-center gap-2.5 rounded-xl border border-[var(--color-gray-10)] bg-card px-4 py-2.5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] leading-[22px]">
                        {contact.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] leading-[18px] text-[var(--color-gray-5)]">
                        {[contact.role, contact.company].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    {canMutate(role) ? (
                      <Button
                        variant="ghost-neutral"
                        size="sm"
                        className="shrink-0"
                        onClick={() => setContactRemove(contact)}
                      >
                        연결 해제
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
      {partyEdit === "new" ? (
        <ActionDialog
          title={partyEdit === "new" ? "당사자 추가" : "당사자 수정"}
          description="직접 수정한 값은 문서에서 읽은 값과 구분해 기록됩니다."
          confirmLabel="저장"
          canConfirm={Boolean(partyForm.name.trim())}
          onClose={() => setPartyEdit(null)}
          onConfirm={saveParty}
        >
          <Field label="역할">
            <SimpleSelect
              value={partyForm.role}
              onValueChange={(nextRole) =>
                setPartyForm({ ...partyForm, role: nextRole })
              }
              options={[
                "매도자",
                "매수자",
                "공급사",
                "송하인",
                "수하인",
                "통지처",
                "포워더",
                "통관사",
                "은행",
              ]}
            />
          </Field>
          <Field label="이름">
            <Input
              value={partyForm.name}
              onChange={(event) =>
                setPartyForm({ ...partyForm, name: event.target.value })
              }
            />
          </Field>
        </ActionDialog>
      ) : null}
      {partyDelete ? (
        <ActionDialog
          title="당사자 삭제"
          description={`${partyDelete.role} · ${partyDelete.name} 연결을 삭제합니다.`}
          confirmLabel="삭제"
          destructive
          onClose={() => setPartyDelete(null)}
          onConfirm={async () => {
            await requireMutation(
              prototypeBackend.deals.deleteParty({
                id: String(partyDelete.id),
              }),
              "당사자를 삭제했습니다."
            )
            setParties((items) =>
              items.filter((item) => item.id !== partyDelete.id)
            )
            addAudit("당사자 삭제", `${partyDelete.role} · ${partyDelete.name}`)
            setPartyDelete(null)
          }}
        />
      ) : null}
      {contactOpen ? (
        <ActionDialog
          title="연락처 연결"
          description="기존 연락처를 선택하거나 이름을 입력해 새 연락처를 만듭니다."
          confirmLabel="연결"
          canConfirm={Boolean(
            contactForm.existing || contactForm.newName.trim()
          )}
          onClose={() => setContactOpen(false)}
          onConfirm={async () => {
            const name = contactForm.existing || contactForm.newName.trim()
            const company =
              contactForm.role === "업체 담당자" ? "KATAMAN" : "ECOYA"
            await requireMutation(
              prototypeBackend.deals.createContact({
                dealId,
                role: contactForm.role,
                name,
                company,
              }),
              "연락처를 연결했습니다."
            )
            setContacts((items) => [
              ...items,
              {
                id: Date.now(),
                role: contactForm.role,
                name,
                company,
              },
            ])
            addAudit("연락처 연결", `${contactForm.role} · ${name}`)
            setContactOpen(false)
            setContactForm({ role: "업체 담당자", existing: "", newName: "" })
          }}
        >
          <Field label="역할">
            <SimpleSelect
              value={contactForm.role}
              onValueChange={(nextRole) =>
                setContactForm({ ...contactForm, role: nextRole })
              }
              options={["계약 성사자", "관리자", "업체 담당자", "기타"]}
            />
          </Field>
          <Field label="기존 연락처">
            <SimpleSelect
              value={contactForm.existing}
              onValueChange={(existing) =>
                setContactForm({ ...contactForm, existing, newName: "" })
              }
              options={[
                ["", "검색 결과 선택"],
                "Daniel Kim",
                "Emma Lee",
                "Joon Park",
              ]}
            />
          </Field>
          <div className="text-center text-xs text-muted-foreground">또는</div>
          <Field label="새 연락처 이름">
            <Input
              value={contactForm.newName}
              onChange={(event) =>
                setContactForm({
                  ...contactForm,
                  newName: event.target.value,
                  existing: "",
                })
              }
              placeholder="이름 입력 후 새로 만들기"
            />
          </Field>
        </ActionDialog>
      ) : null}
      {contactRemove ? (
        <ActionDialog
          title="연락처 연결 해제"
          description={`${contactRemove.role} · ${contactRemove.name} 연락처를 이 거래에서 해제합니다. 연락처 원본은 삭제되지 않습니다.`}
          confirmLabel="연결 해제"
          destructive
          onClose={() => setContactRemove(null)}
          onConfirm={async () => {
            await requireMutation(
              prototypeBackend.deals.deleteContact({
                id: String(contactRemove.id),
              }),
              "연락처 연결을 해제했습니다."
            )
            setContacts((items) =>
              items.filter((item) => item.id !== contactRemove.id)
            )
            addAudit(
              "연락처 연결 해제",
              `${contactRemove.role} · ${contactRemove.name}`
            )
            setContactRemove(null)
          }}
        />
      ) : null}
    </>
  )
}

export function DealDetailScreen({
  dealId,
  workspaceId,
  onOpenDeal,
  role,
  focusTarget,
  onBack,
  onAskAi,
  generatedDocuments,
  documentTemplates,
  onCreateDocument,
  onUpload,
  uploadOriginRef,
  onDeliver,
  onReviewDocument,
  onOpenSettlement,
  workspaceActionsTarget,
}: {
  dealId: string
  workspaceId: string
  onOpenDeal: (id: string) => void
  /** Organization role of the signed-in (demo) account. */
  role: Role
  focusTarget?: NotificationDealTarget | null
  onBack: () => void
  onAskAi: () => void
  generatedDocuments: readonly GeneratedDealDocumentSummary[]
  documentTemplates: readonly DocumentTemplateOption[]
  onCreateDocument: (templateCode: string) => void
  onUpload: () => void
  uploadOriginRef?: { current: UploadOriginDeal | null }
  onDeliver: (documentNumber: string, attachmentNames: string[]) => void
  onReviewDocument: (documentNumber: string) => void
  onOpenSettlement: () => void
  workspaceActionsTarget?: HTMLElement | null
}) {
  const createdProfile = prototypeBackend.deals.getCreated(dealId)
  const customsSkipped = useSkippedCustoms(workspaceId).has(dealId)
  const sourceDeal = dealFixtures.find((deal) => deal.id === dealId)
  const fixture = sourceDeal && applyCustomsPreference(sourceDeal, customsSkipped)
  const exists = Boolean(dealProfiles[dealId] || createdProfile || fixture)
  const [createdDirection, setCreatedDirection] = useState<DealDirection | null>(createdProfile?.direction ?? null)
  const [savingDirection, setSavingDirection] = useState(false)
  const profile = dealProfiles[dealId]
    ?? (createdProfile ? { ...createdProfile, direction: createdDirection ?? createdProfile.direction } : null)
    ?? (fixture ? { ...fixture, direction: fixture.direction ?? "direction_pending" as const } : dealProfiles["DL-260708-01"])
  const isCompactWorkspace = useIsCompactWorkspace()
  const settled = fixture?.stage === "settled"
  const nextDocument = !settled && fixture?.orderLifecycle !== "closed" && fixture?.orderLifecycle !== "cancelled" ? fixture?.nextDocument : undefined
  const nextDraft = generatedDocuments.find((document) => document.number.startsWith(`${nextDocument?.templateCode}-`) && document.state === "draft")
  const nextDeliverable = generatedDocuments.find((document) => document.number.startsWith(`${nextDocument?.templateCode}-`) && document.state !== "draft")
  const [contractItems, setContractItems] = useState(initialDealLineItems)
  const [mainInformation, setMainInformation] =
    useState<Pick<DealProfile, "counterparty" | "amount" | "currency">>(profile)
  const [documentSummary, setDocumentSummary] = useState<DealDocumentSummary>({
    connected: documents.filter((document) => document.file).length,
    total: documents.length,
    documents,
  })
  const [shipmentSummary, setShipmentSummary] =
    useState<DealShipmentSummary | null>(null)
  const [activeSection, setActiveSection] = useState<Tab>(
    focusTarget?.tab ?? stageEntryTab(fixture?.stage ?? "contract")
  )
  const [documentOpen, setDocumentOpen] = useState(false)
  const [documentRequest, setDocumentRequest] = useState<{
    code: string
    fileName?: string
    invoiceId?: string
  } | null>(null)
  const [documentPanelTarget, setDocumentPanelTarget] = useState<HTMLElement | null>(null)
  const documentTriggerRef = useRef<HTMLElement | null>(null)
  const splitDocumentOpen = documentOpen && !isCompactWorkspace
  const comparisonGridRef = useRef<HTMLDivElement>(null)
  const comparisonViewportRef = useRef<HTMLElement | null>(null)
  const comparisonRestoreScrollTopRef = useRef<number | null>(null)
  const comparisonScrollTopRef = useRef<number | null>(null)
  const comparisonLeftScrollTopRef = useRef<number | null>(null)
  const comparisonAnchorRef = useRef<ScrollAnchor | null>(null)
  const lastPointerTargetRef = useRef<Element | null>(null)
  useEffect(() => {
    const remember = (event: PointerEvent) => { lastPointerTargetRef.current = event.target instanceof Element ? event.target : null }
    document.addEventListener("pointerdown", remember, true)
    return () => document.removeEventListener("pointerdown", remember, true)
  }, [])
  const [comparisonHeight, setComparisonHeight] = useState<number | null>(null)
  useEffect(() => {
    if (!documentOpen) return
    const grid = comparisonGridRef.current
    if (!grid) return
    const viewport = grid.closest<HTMLElement>("[data-deal-scroll-viewport]")
    const updateHeight = () => {
      if (isCompactWorkspace) {
        setComparisonHeight(null)
        return
      }
      // The comparison surface is a viewport-level workspace. Deriving its
      // height from the grid's current document position makes it collapse
      // when the user opens it from a scrolled section (the grid can be
      // partially or completely outside the viewport at that moment).
      const availableHeight = viewport?.clientHeight ?? window.innerHeight
      setComparisonHeight(Math.max(620, Math.round(availableHeight - 16)))
    }
    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(viewport ?? grid)
    window.addEventListener("resize", updateHeight)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", updateHeight)
    }
  }, [documentOpen, isCompactWorkspace])
  useLayoutEffect(() => {
    if (!splitDocumentOpen || comparisonHeight == null) return
    const grid = comparisonGridRef.current
    const pageContent = grid?.querySelector<HTMLElement>("[data-deal-page-content]")
    const viewport = grid?.closest<HTMLElement>("[data-deal-scroll-viewport]")
    if (!grid || !pageContent || !viewport) return
    const savedScrollTop = comparisonScrollTopRef.current
    const anchor = comparisonAnchorRef.current
    comparisonAnchorRef.current = null
    // Put the clicked control back at the height it had before the split;
    // repeat once content that loads late (e.g. shipments) has settled.
    const alignToAnchor = () => {
      if (!anchor) return
      const element = pageContent.querySelectorAll(anchor.selector)[anchor.index]
      if (element) pageContent.scrollTop += element.getBoundingClientRect().top - anchor.top
    }
    const timers: number[] = []
    const frame = window.requestAnimationFrame(() => {
      if (savedScrollTop != null) viewport.scrollTop = savedScrollTop
      pageContent.scrollTop = comparisonLeftScrollTopRef.current ?? 0
      comparisonScrollTopRef.current = null
      comparisonLeftScrollTopRef.current = null
      alignToAnchor()
      timers.push(window.setTimeout(alignToAnchor, 350), window.setTimeout(alignToAnchor, 900))
    })
    return () => {
      window.cancelAnimationFrame(frame)
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [comparisonHeight, splitDocumentOpen])
  const openDocumentPanel = useCallback(() => {
    if (documentOpen) return
    documentTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (!isCompactWorkspace) {
      const viewport = document.querySelector<HTMLElement>("[data-deal-scroll-viewport]")
      const grid = comparisonGridRef.current
      comparisonViewportRef.current = viewport
      comparisonRestoreScrollTopRef.current = viewport?.scrollTop ?? null
      const viewportRect = viewport?.getBoundingClientRect()
      const gridRect = grid?.getBoundingClientRect()
      // Keep the outer deal viewport where the user opened the comparison, but
      // at least far enough down that the review/confirm notice boxes above the
      // grid scroll away (the header then shows its compact alert buttons) and
      // the split starts right below the deal header.
      const header = document.querySelector<HTMLElement>("[data-deal-sticky-header]")
      const headerBottom = header?.getBoundingClientRect().bottom ?? viewportRect?.top ?? 0
      const gridBelowHeader = viewport && gridRect ? viewport.scrollTop + gridRect.top - headerBottom - 8 : null
      comparisonScrollTopRef.current = viewport
        ? Math.max(viewport.scrollTop, gridBelowHeader ?? 0)
        : null
      comparisonLeftScrollTopRef.current = viewportRect && gridRect
        ? Math.max(0, viewportRect.top - gridRect.top)
        : null
      comparisonAnchorRef.current = describeScrollAnchor(lastPointerTargetRef.current)
      if (viewport) viewport.style.overflowAnchor = "none"
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    }
    setDocumentOpen(true)
  }, [documentOpen, isCompactWorkspace])
  const closeDocumentPanel = useCallback(() => {
    const viewport = comparisonViewportRef.current
    const restoreScrollTop = comparisonRestoreScrollTopRef.current
    if (viewport) viewport.style.overflowAnchor = ""
    comparisonViewportRef.current = null
    comparisonRestoreScrollTopRef.current = null
    setDocumentOpen(false)
    if (viewport && restoreScrollTop != null) {
      window.requestAnimationFrame(() => {
        viewport.scrollTop = restoreScrollTop
      })
    }
  }, [])
  const handleDocumentOpenChange = useCallback((open: boolean) => {
    if (open) openDocumentPanel()
    else closeDocumentPanel()
  }, [closeDocumentPanel, openDocumentPanel])
  useEffect(() => {
    const handleDealDocumentRequest = (event: Event) => {
      const detail = (event as CustomEvent<{
        code?: string
        fileName?: string
        invoiceId?: string
      }>).detail
      if (detail?.code) {
        setDocumentRequest({
          code: detail.code,
          fileName: detail.fileName,
          invoiceId: detail.invoiceId,
        })
      }
      openDocumentPanel()
    }
    window.addEventListener("ecoya:open-deal-document", handleDealDocumentRequest)
    return () => window.removeEventListener("ecoya:open-deal-document", handleDealDocumentRequest)
  }, [openDocumentPanel])
  const [connectedShipmentDrafts] = useState<Record<string, Partial<Shipment>>>({})
  const [dealDocumentVersion, setDealDocumentVersion] = useState(0)
  useEffect(() => {
    const refreshDocuments = (event: Event) => {
      if ((event as CustomEvent<string>).detail === dealId) setDealDocumentVersion((version) => version + 1)
    }
    window.addEventListener("ecoya:deal-documents-changed", refreshDocuments)
    return () => window.removeEventListener("ecoya:deal-documents-changed", refreshDocuments)
  }, [dealId])
  const splitShipmentView = useMemo(
    () => {
      const openInvoice = (fileName: string, invoiceId: string) => {
        window.dispatchEvent(new CustomEvent("ecoya:open-deal-document", { detail: { code: "CI", fileName, invoiceId } }))
      }
      const created = Boolean(prototypeBackend.deals.getCreated(dealId))
      const fixture = dealShipmentDocuments(dealId,
        created ? { billsOfLading: [], unlinkedDocuments: [] } : splitShipmentReviewFixture(dealId, openInvoice),
        created ? [] : listDealDocuments(dealId), openInvoice)
      return {
        ...fixture,
        billsOfLading: fixture.billsOfLading.map((bill) => {
          const draft = connectedShipmentDrafts[bill.documentId]
          if (!draft) return bill
          return {
            ...bill,
            blNumber: draft?.bl_number ?? bill.blNumber,
            fields: {
              ...bill.fields,
              portOfLoading: draft?.pol ?? bill.fields.portOfLoading,
              portOfDischarge: draft?.pod ?? bill.fields.portOfDischarge,
              carrier: draft?.carrier ?? bill.fields.carrier,
              vessel: draft?.vessel ?? bill.fields.vessel,
              containerNumber: draft?.container_number ?? bill.fields.containerNumber,
              shippedOnBoardDate: draft?.confirmed_etd ?? bill.fields.shippedOnBoardDate,
            },
          }
        }),
      }
    },
    [connectedShipmentDrafts, dealDocumentVersion, dealId]
  )
  // A shipment row and a B/L document are the same lot when their B/L numbers
  // match; unmatched rows show no linked documents.
  const dealRelations = useDealRelations(dealId)
  const documentLinks = useMemo(() => dealDocumentLinks(splitShipmentView, dealRelations), [splitShipmentView, dealRelations])
  const billForShipment = (shipment: { id: string; bl_number?: string | null }) => {
    const bills = splitShipmentView.billsOfLading
    return bills.find(bill => bill.documentId === shipment.id)
      ?? bills.find(bill => !bill.documentId.startsWith("upload:") && bill.blNumber && bill.blNumber === shipment.bl_number)
  }
  const openDealDocument = (work: DealWorkKey) => {
    if (work === "finance") return
    const code = work === "fulfillment"
      ? "BL"
      : work === "customs"
        ? "CUSTOMS_ENTRY"
        : work === "documents"
          ? profile.direction === "sales" ? "SC" : "PO"
          : Object.entries(documentStageRules).find(([, rule]) => rule.work === work)?.[0] ?? "PO"
    const detail = code === "BL"
      ? { code, fileName: splitShipmentView.billsOfLading[0]?.fileName }
      : { code }
    window.dispatchEvent(
      new CustomEvent("ecoya:open-deal-document", { detail })
    )
  }
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const stickyHeaderRef = useRef<HTMLDivElement>(null)
  const fieldNavigationRef = useRef<{ label: HTMLElement; input?: HTMLInputElement | null } | null>(null)
  const informationRailRef = useRef<HTMLElement>(null)
  const alertsRef = useRef<HTMLElement>(null)
  const compactAlertsRef = useRef<HTMLDivElement>(null)
  const [compactAlerts, setCompactAlerts] = useState(false)
  useEffect(() => {
    const viewport = scrollViewportRef.current
    const header = stickyHeaderRef.current
    const alerts = alertsRef.current
    if (!viewport || !header || !alerts) return
    const update = () =>
      setCompactAlerts(
        alerts.getBoundingClientRect().bottom <=
          header.getBoundingClientRect().bottom
      )
    viewport.addEventListener("scroll", update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(alerts)
    observer.observe(header)
    update()
    return () => {
      viewport.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [dealId])

  useEffect(() => {
    const viewport = scrollViewportRef.current
    const header = stickyHeaderRef.current
    if (!viewport || !header) return
    const measure = () => {
      const totalHeight = header.offsetHeight
      viewport.style.setProperty("--deal-header-height", `${totalHeight}px`)
      const pending = fieldNavigationRef.current
      if (pending?.label.isConnected && document.activeElement === pending.input) {
        const offset = pending.label.getBoundingClientRect().top - header.getBoundingClientRect().bottom - 16
        if (offset < 0) viewport.scrollBy({ top: offset, behavior: "instant" })
      }
      viewport.style.setProperty(
        "--deal-rail-sticky-top",
        `${Math.min(totalHeight + 16, viewport.clientHeight - (informationRailRef.current?.offsetHeight ?? 0) - 16)}px`
      )
    }
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(header)
    if (informationRailRef.current) observer.observe(informationRailRef.current)
    if (compactAlertsRef.current) observer.observe(compactAlertsRef.current)
    measure()
    return () => observer.disconnect()
  }, [dealId, compactAlerts])
  const [earlyGroups, setEarlyGroups] = useState<DealFieldGroup[]>(() =>
    readEarlyFieldGroups(dealId)
  )
  const [startedWork, setStartedWork] = useState<DealWorkKey[]>(() =>
    readStartedWork(dealId)
  )
  const [previewWork, setPreviewWork] = useState<DealWorkKey[]>([])
  const [preferredWork, setPreferredWork] = useState<DealWorkKey | undefined>(
    () => (focusTarget?.tab === "finance" ? "finance" : undefined)
  )
  const hasShipmentDocument = splitShipmentView.billsOfLading.some(bill => bill.documentId.startsWith("upload:")) || splitShipmentView.unlinkedPackingLists?.some(doc => doc.documentId.startsWith("upload:"))
  const plan = useMemo(
    () =>
      getDealWorkPlan(
        dealId,
        [
          ...startedWork,
          ...(hasShipmentDocument || earlyGroups.includes("선적 정보")
            ? ["fulfillment" as const]
            : []),
          ...(earlyGroups.includes("결제 정보") ? ["finance" as const] : []),
        ],
        preferredWork,
        customsSkipped
      ),
    [dealId, startedWork, earlyGroups, preferredWork, hasShipmentDocument, customsSkipped]
  )
  const previewSection = (key: DealWorkKey) =>
    setPreviewWork((current) =>
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    )
  const startWork = (key: DealWorkKey) => {
    if (!canMutate(role)) return
    const next = [...new Set([...startedWork, key])]
    setStartedWork(next)
    setPreferredWork(key)
    try {
      localStorage.setItem(
        `ecoya:deal-started-work:v1:${dealId}`,
        JSON.stringify(next)
      )
    } catch {
      /* Session state still works. */
    }
    requestAnimationFrame(() =>
      document
        .getElementById(workIds[key])
        ?.scrollIntoView({ behavior: "smooth", block: "start" })
    )
  }
  const visibleGroups = useMemo(
    () =>
      fieldGroups.filter((group) =>
        group === "선적 정보"
          ? plan.states.fulfillment !== "planned"
          : group === "결제 정보"
            ? plan.states.finance !== "planned"
            : true
      ),
    [plan]
  )
  const [missingFields, setMissingFields] = useState<DealMissingField[]>([])
  const [saveStatus, setSaveStatus] = useState<DealSaveStatus | null>(null)
  const saveRetryRef = useRef<() => void>(() => {})
  const openFieldGroup = (group: DealFieldGroup) => {
    closeDocumentPanel()
    if (!visibleGroups.includes(group) && canMutate(role)) {
      startWork(group === "결제 정보" ? "finance" : "fulfillment")
      const next = [...earlyGroups, group]
      setEarlyGroups(next)
      try {
        localStorage.setItem(
          `ecoya:deal-early-fields:v1:${dealId}`,
          JSON.stringify(next)
        )
      } catch {
        /* Still works without storage. */
      }
    }
    requestAnimationFrame(() => {
      const target = document.getElementById(fieldGroupIds[group])
      target?.scrollIntoView({ behavior: "smooth", block: "start" })
      target?.focus({ preventScroll: true })
    })
  }

  const [, setFocusSectionId] = useState<
    NotificationDealTarget["sectionId"] | null
  >(focusTarget?.sectionId ?? null)
  const [currentDealId, setCurrentDealId] = useState(() =>
    prototypeBackend.deals.getDisplayId(dealId)
  )
  const initialDealTitle = prototypeBackend.deals.getTitle(
    dealId,
    profile.title
  )
  const [dealTitle, setDealTitle] = useState(initialDealTitle)
  useLayoutEffect(() => {
    if (!uploadOriginRef || !exists) return
    uploadOriginRef.current = {
      id: dealId, displayId: currentDealId, title: dealTitle, party: mainInformation.counterparty,
      amount: mainInformation.amount, currency: mainInformation.currency,
    }
    return () => { uploadOriginRef.current = null }
  }, [uploadOriginRef, exists, dealId, currentDealId, dealTitle, mainInformation])
  const [dealTitleDraft, setDealTitleDraft] = useState(initialDealTitle)
  const [dealIdDraft, setDealIdDraft] = useState(currentDealId)
  const [editingDealId, setEditingDealId] = useState(false)
  const [savingDealId, setSavingDealId] = useState(false)
  const [assignee, setAssignee] = useState("조민영")
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [generatedDocumentsOpen, setGeneratedDocumentsOpen] = useState(false)
  const [documentTemplatePickerOpen, setDocumentTemplatePickerOpen] =
    useState(false)
  const [documentTemplateQuery, setDocumentTemplateQuery] = useState("")
  const [deliveryDocumentNumber, setDeliveryDocumentNumber] = useState<
    string | null
  >(null)
  const [deliveryAttachmentNames, setDeliveryAttachmentNames] = useState<
    Set<string>
  >(() => new Set())
  const [sharedMembers, setSharedMembers] = useState(["박서윤", "김도현"])
  const [shareCandidate, setShareCandidate] = useState("")
  const [shareBusyMember, setShareBusyMember] = useState<string | null>(null)
  const [dialog, setDialog] = useState<DialogKind>(null)
  const [issueType, setIssueType] = useState("payment_risk")
  const [issueNote, setIssueNote] = useState("")
  const [archived, setArchived] = useState(false)
  const [failedPanel, setFailedPanel] = useState<Tab | null>(null)
  const refresh = useDealRefreshController(dealId, role)
  const refreshing = refresh.busy
  const [savingAssignee, setSavingAssignee] = useState(false)
  const [notes, setNotes] = useState<DealNoteItem[]>([
    {
      id: 1,
      body: "7월 15일까지 B/L 원본 요청",
      actor: "조민영",
      time: "2026-07-13",
    },
    {
      id: 2,
      body: "잔금 지급 전 계좌 변경 여부 재확인",
      actor: "조민영",
      time: "2026-07-13",
    },
  ])
  const [riskDismissed, setRiskDismissed] = useState(false)
  const [previousDealRead, setPreviousDealRead] = useState(refresh.data)
  if (refresh.data && refresh.data !== previousDealRead) {
    setPreviousDealRead(refresh.data)
    const data = refresh.data.deal
    setCurrentDealId(data.displayId)
    if (data.title !== undefined) setDealTitle(data.title)
    if (data.assigneeId !== undefined) setAssignee(data.assigneeId ?? "미배정")
    setRiskDismissed(data.riskDismissed)
  }
  const [verificationOpen, setVerificationOpen] = useState(false)
  const [reviewFocusId, setReviewFocusId] =
    useState<DealReviewNotice["id"]>("account_change")
  const [audit, setAudit] = useState<AuditItem[]>([
    {
      id: 1,
      action: "거래 생성",
      detail: "SC-2026-0708 Confirm에서 자동 생성",
      actor: "시스템",
      time: "2026-07-08T09:12:00+09:00",
    },
    {
      id: 2,
      action: "담당자 지정",
      detail: "조민영",
      actor: "박서윤",
      time: "2026-07-08T09:20:00+09:00",
    },
  ])
  const openMissingField = (key: string) => {
    closeDocumentPanel()
    requestAnimationFrame(() => {
      const field = document.getElementById(`deal-field-${key}`)
      const label = document.getElementById(`deal-field-label-${key}`)
      const target = label ?? field
      field?.focus({ preventScroll: true })
      target?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      })
    })
  }
  const openItemUnitPrice = () => {
    closeDocumentPanel()
    requestAnimationFrame(() => {
      const label = scrollViewportRef.current?.querySelector<HTMLElement>(
        "[data-deal-page-content] [data-item-unit-price-heading]"
      )
      const input = label?.parentElement?.querySelector<HTMLInputElement>("input")
      const target = label ?? scrollViewportRef.current?.querySelector<HTMLElement>("[data-deal-items]")
      if (!target) return
      const viewport = scrollViewportRef.current
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      // The sticky header grows when compact alerts appear; its ResizeObserver
      // keeps this focused label below the final header boundary.
      fieldNavigationRef.current = { label: target, input }
      viewport?.style.setProperty("--deal-header-height", `${stickyHeaderRef.current?.offsetHeight ?? 128}px`)
      input?.focus({ preventScroll: true })
      target.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" })
    })
  }
  const openReviewNotice = (id: DealReviewNotice["id"]) => {
    setReviewFocusId(id)
    setVerificationOpen(true)
  }
  useEffect(() => {
    const openSale = (event: Event) => {
      const anchorId = dealSaleAnchorId((event as CustomEvent<string>).detail)
      setActiveSection("finance")
      setPreviewWork((current) => current.includes("finance") ? current : [...current, "finance"])
      let attempts = 30
      const scrollWhenReady = () => {
        const target = document.getElementById(anchorId) ?? (attempts <= 0 ? document.getElementById("deal-finance") : null)
        if (target) {
          target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" })
          window.history.replaceState(null, "", `#${anchorId}`)
        } else {
          attempts -= 1
          requestAnimationFrame(scrollWhenReady)
        }
      }
      requestAnimationFrame(scrollWhenReady)
    }
    window.addEventListener("ecoya:open-deal-sale", openSale)
    return () => window.removeEventListener("ecoya:open-deal-sale", openSale)
  }, [])
  const navigateSection = (value: Tab) => {
    closeDocumentPanel()
    if (value === "verification") {
      setVerificationOpen(true)
      return
    }
    setActiveSection(value)
    if (value === "fulfillment" || value === "finance" || value === "customs") {
      setPreviewWork((current) =>
        current.includes(value) ? current : [...current, value]
      )
    }
    requestAnimationFrame(() => {
      const section = dealSections.find((item) => item.value === value)
      const target = section && document.getElementById(section.id)
      if (target instanceof HTMLDetailsElement) target.open = true
      target?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      })
      target?.focus({ preventScroll: true })
    })
  }
  useEffect(() => {
    if (!focusTarget) return

    const stateTimer = window.setTimeout(() => {
      setActiveSection(focusTarget.tab)
      if (focusTarget.tab === "documents") openDocumentPanel()
      if (focusTarget.sectionId === "deal-verification")
        setVerificationOpen(true)
      setFocusSectionId(focusTarget.sectionId)
    }, 0)
    const scrollTimer = window.setTimeout(() => {
      const target = document.getElementById(focusTarget.sectionId)
      target?.scrollIntoView({ behavior: "smooth", block: "start" })
      target?.focus({ preventScroll: true })
    }, 120)
    const clearTimer = window.setTimeout(() => setFocusSectionId(null), 2400)
    return () => {
      window.clearTimeout(stateTimer)
      window.clearTimeout(scrollTimer)
      window.clearTimeout(clearTimer)
    }
  }, [dealId, focusTarget, openDocumentPanel])
  const addAudit = (action: string, detail: string) =>
    setAudit((items) => [
      {
        id: Date.now(),
        action,
        detail,
        actor:
          role === "member" ? "김도현" : role === "admin" ? "박서윤" : "조민영",
        time: new Date().toISOString(),
      },
      ...items,
    ])
  const shareCandidates = ["이민지", "최유진", "오세훈"].filter(
    (name) => !sharedMembers.includes(name)
  )
  const addDealShare = async () => {
    if (!shareCandidate || shareBusyMember) return
    setShareBusyMember("add")
    try {
      await requireMutation(
        prototypeBackend.deals.createShare({
          dealId: currentDealId,
          memberId: shareCandidate,
        }),
        "거래를 공유했습니다."
      )
      setSharedMembers((members) => [...members, shareCandidate])
      addAudit("거래 공유", shareCandidate)
      setShareCandidate("")
    } finally {
      setShareBusyMember(null)
    }
  }
  const removeDealShare = async (member: string) => {
    if (shareBusyMember) return
    setShareBusyMember(member)
    try {
      await requireMutation(
        prototypeBackend.deals.deleteShare({ id: member }),
        "거래 공유를 해제했습니다."
      )
      setSharedMembers((members) =>
        members.filter((candidate) => candidate !== member)
      )
      addAudit("거래 공유 해제", member)
    } finally {
      setShareBusyMember(null)
    }
  }
  const createSharedNote = async (body: string) => {
    const nextBody = body.trim()
    if (!nextBody) return
    await requireMutation(
      prototypeBackend.deals.createNote({
        dealId: currentDealId,
        body: nextBody,
      }),
      "메모를 추가했습니다."
    )
    setNotes((items) => [
      ...items,
      {
        id: Date.now(),
        body: nextBody,
        actor: "조민영",
        time: new Date().toISOString(),
      },
    ])
    addAudit("메모 추가", nextBody)
  }
  const updateSharedNote = async (noteId: number, body: string) => {
    const nextBody = body.trim()
    if (!nextBody) return
    await requireMutation(
      prototypeBackend.deals.updateNote({
        dealId: currentDealId,
        noteId: String(noteId),
        body: nextBody,
      }),
      "노트를 수정했습니다."
    )
    setNotes((items) =>
      items.map((item) =>
        item.id === noteId ? { ...item, body: nextBody } : item
      )
    )
    addAudit("노트 수정", nextBody)
  }
  const deleteSharedNote = async (noteId: number) => {
    const target = notes.find((item) => item.id === noteId)
    await requireMutation(
      prototypeBackend.deals.deleteNote({ id: String(noteId) }),
      "노트를 삭제했습니다."
    )
    setNotes((items) => items.filter((item) => item.id !== noteId))
    addAudit("노트 삭제", target?.body ?? String(noteId))
  }
  const dealIdCandidate = dealIdDraft.trim()
  const dealIdIsValid = /^[A-Za-z0-9][A-Za-z0-9._/-]{2,39}$/.test(
    dealIdCandidate
  )
  const dealTitleCandidate = dealTitleDraft.trim()
  const dealTitleIsValid =
    dealTitleCandidate.length >= 1 && dealTitleCandidate.length <= 80
  const saveDealId = async () => {
    const dealIdChanged = dealIdCandidate !== currentDealId
    const dealTitleChanged = dealTitleCandidate !== dealTitle
    if (
      !canMutate(role) ||
      !dealIdIsValid ||
      !dealTitleIsValid ||
      (!dealIdChanged && !dealTitleChanged) ||
      savingDealId
    ) {
      return
    }

    const previousDealId = currentDealId
    const previousDealTitle = dealTitle
    setSavingDealId(true)
    const receipt = refresh.beginWrite()
    let accepted = false
    try {
      const result = await prototypeBackend.deals.updateIdentity({
          dealId,
          nextDealId: dealIdCandidate,
          title: dealTitleCandidate,
        })
      accepted = result.ok
      if (!refresh.isCurrent(receipt)) return
      if (!result.ok) throw new Error(result.error)
      toast.success("거래 기본정보를 저장했습니다.")
      setCurrentDealId(dealIdCandidate)
      setDealTitle(dealTitleCandidate)
      setEditingDealId(false)
      addAudit(
        "거래 기본정보 변경",
        [
          dealIdChanged
            ? `거래번호 ${previousDealId} → ${dealIdCandidate}`
            : null,
          dealTitleChanged
            ? `구분명 ${previousDealTitle} → ${dealTitleCandidate}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")
      )
    } catch (error) {
      if (refresh.isCurrent(receipt)) toast.error(error instanceof Error ? error.message : "거래 기본정보를 저장하지 못했습니다.")
    } finally {
      refresh.finishWrite(receipt, accepted)
      if (refresh.isCurrent(receipt)) setSavingDealId(false)
    }
  }
  if (refresh.failure === 403) return <div className="grid h-full place-items-center bg-background">
    <div className="text-center"><h1 className="text-xl font-semibold">이 거래에 접근할 수 없습니다</h1>
      <p className="mt-2 text-sm text-muted-foreground">접근 권한을 확인해 주세요.</p>
      <Button className="mt-4" onClick={onBack}>목록으로</Button>
    </div>
  </div>
  if (!exists || refresh.failure === 404)
    return (
      <div className="grid h-full place-items-center bg-background">
        <div className="text-center">
          <FileSearch className="mx-auto size-8 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold">
            거래를 찾을 수 없습니다
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            삭제되었거나 다른 조직의 거래일 수 있습니다.
          </p>
          <Button className="mt-4" onClick={onBack}>
            목록으로
          </Button>
        </div>
      </div>
    )
  if (archived)
    return (
      <div className="grid h-full place-items-center bg-background">
        <div className="text-center">
          <Check className="mx-auto size-8 text-success" />
          <h1 className="mt-4 text-xl font-semibold">거래가 보관되었습니다</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            연결된 문서와 거래 이력은 유지됩니다.
          </p>
          <Button className="mt-4" onClick={onBack}>
            거래 목록으로
          </Button>
        </div>
      </div>
    )
  function changeCustomsSetting(skipped: boolean) {
    if (!canMutate(role) || skipped === customsSkipped) return
    try {
      setCustomsSkipped(workspaceId, dealId, skipped)
    } catch {
      toast.error("통관 설정을 저장하지 못했습니다.")
      return
    }
    addAudit("통관 설정 변경", skipped ? "통관 없음" : "통관 진행")
    if (!skipped) navigateSection("customs")
    else if (plan.current === "customs") navigateSection("finance")
  }

  const dealPageContent = (
  <div
    data-deal-page-content
    className={cn(
      "min-w-0 space-y-6",
      documentOpen && "xl:h-full xl:overflow-y-auto xl:p-5"
    )}
  >
    <DocumentsTab
      customsControl={canMutate(role) ? (
        <label className="ml-auto inline-flex min-h-8 shrink-0 cursor-pointer items-center gap-2 text-sm">
          <Checkbox checked={customsSkipped} onCheckedChange={value => changeCustomsSetting(value === true)} />
          통관 없음
        </label>
      ) : null}
      linkedDeals={<LinkedDeals dealId={dealId} direction={profile.direction} workspaceId={workspaceId} canWrite={canMutate(role)} onOpenDeal={onOpenDeal} />}
      aiQuestion={<DealAiQuestion onAskAi={onAskAi} />}
      key={dealId}
      plan={plan}
      previewWork={previewWork}
      onPreviewWork={previewSection}
      onStartWork={startWork}
      onOpenDocument={openDealDocument}
      commercialInvoiceView={splitShipmentView}
      workspaces={{
        fulfillment: (
          <section
            id="deal-fulfillment"
            tabIndex={-1}
            className="min-w-0 scroll-mt-[calc(var(--deal-header-height,128px)+16px)] outline-none"
          >
            <FulfillmentTab
              shipmentContent={<><OperationsScreen screen="deal-shipments" dealId={dealId} onShipmentSummary={setShipmentSummary} onOpenDocument={() => openDealDocument("fulfillment")} shipmentRowAnchorId={(shipment) => {
                const bill = billForShipment(shipment)
                return bill ? dealBillAnchorId(bill.documentId) : dealShipmentAnchorId(shipment.id)
              }} renderShipmentContainers={(shipment) => {
                const bill = billForShipment(shipment)
                const lists = documentsForShipment(documentLinks, shipmentLinkKey(shipment, bill)).packingLists
                  .map(({ document, containers }) => ({ id: document.documentId, containers }))
                  .filter((list) => list.containers.length)
                if (!lists.length && bill && billContainers(bill).length) return <ShipmentContainerLinks containers={billContainers(bill)} />
                return lists.length ? <>{lists.map((list) => <ShipmentContainerLinks key={list.id} containers={list.containers} packingListId={list.id} />)}</> : undefined
              }} renderShipmentDocuments={(shipment) => {
                const bill = billForShipment(shipment)
                return <ShipmentDocumentLinks invoices={documentsForShipment(documentLinks, shipmentLinkKey(shipment, bill)).invoices} />
              }} renderShipmentFieldPage={(shipment, field) => {
                // B/L fields show the page they were read from when the B/L has several pages.
                const bill = billForShipment(shipment)
                const page = bill && (bill.pageCount ?? 1) > 1 ? bill.fieldPages?.[field] : undefined
                return bill && page ? <DocumentPageMarker label={field} page={page} fileName={bill.fileName} code="BL" /> : undefined
              }} renderShipmentLinkedDocuments={(shipment) => {
                const bill = billForShipment(shipment)
                const key = shipmentLinkKey(shipment, bill)
                return <DealLinkedDocuments code="BL" id={key} name={shipment.bl_number || bill?.blNumber || "선적"} dealId={dealId} view={splitShipmentView} graph={documentLinks} relations={dealRelations} canWrite={canMutate(role)} />
              }} renderShipmentDocumentAction={(shipment) => {
                const bill = billForShipment(shipment)
                return bill ? <Button type="button" size="icon-sm" variant="ghost-neutral" aria-label={`${bill.blNumber || "B/L"} 문서와 보기`} title={`${bill.blNumber || "B/L"} 문서와 보기`} onClick={() => openBillDocument(bill)}><FileSearch aria-hidden="true" className="size-4" /></Button> : null
              }} /><PackingListCard contractItems={contractItems} dealId={dealId} view={splitShipmentView} canWrite={canMutate(role)} onUpload={canMutate(role) ? onUpload : undefined} /></>}
              onSummaryChange={setShipmentSummary}
              onEditUnitPrice={openItemUnitPrice}
              dealId={dealId}
              role={role}
              addAudit={addAudit}
            />
          </section>
        ),
        customs: (
          <section
            id="deal-customs"
            tabIndex={-1}
            className="scroll-mt-[calc(var(--deal-header-height,128px)+16px)] rounded-[var(--r-lg)] bg-[var(--color-gray-12)] shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)] p-5 outline-none"
          >
            {/* Figma 7872:185027 「통관 문서」: declaration rows with confirmed data only. */}
            <div className="flex items-center gap-1">
              <h2 className="min-w-0 flex-1 text-[18px] leading-[26px] font-bold">통관 문서</h2>
              {canMutate(role) && (
                <Button variant="outline" size="sm" onClick={onUpload}>
                  <Plus data-icon="inline-start" />
                  문서 올리기
                </Button>
              )}
            </div>
            <div className="ops-screen mt-4" role="region" aria-label="통관 문서 목록">
              <HostTable className="ops-shipment-table text-left" data-deal-table="customs" aria-label="통관 문서">
                <colgroup><col style={{ width: "28.5%" }} /><col style={{ width: "13.7%" }} /><col style={{ width: "15.9%" }} /><col style={{ width: "15.9%" }} /><col style={{ width: "10.1%" }} /><col style={{ width: "15.9%" }} /></colgroup>
                <HostTableHeader>
                  <HostTableRow className="hover:bg-transparent">
                    {["문서 / 신고번호", "통관일", "관세", "부가세", "상태", "작업"].map((label) => (
                      <HostTableHead key={label} className={cn((label === "상태" || label === "작업") && "text-center")}>{label}</HostTableHead>
                    ))}
                  </HostTableRow>
                </HostTableHeader>
                <HostTableBody>
                  {customsDeclarations(profile.direction, dealId).length === 0 ? (
                    <HostTableRow className="hover:bg-transparent">
                      <HostTableCell colSpan={6} className="px-3 py-6 text-center text-[13px] leading-[18px] text-[var(--color-gray-5)] whitespace-normal">
                        아직 확정된 통관 문서가 없습니다. {profile.direction === "sales" ? "수출신고필증" : "수입신고필증"}을 올리면 여기에 표시됩니다.
                      </HostTableCell>
                    </HostTableRow>
                  ) : null}
                  {customsDeclarations(profile.direction, dealId).map((row) => (
                    <HostTableRow key={row.number}>
                      <HostTableCell className="px-3 py-1.5">
                        <div className={cn("truncate", !row.confirmed && "text-destructive")}>{row.title}</div>
                        <div className="mt-0.5 truncate text-[var(--color-gray-5)] tabular-nums">{row.number}</div>
                      </HostTableCell>
                      <HostTableCell className="px-3 tabular-nums">{row.date}</HostTableCell>
                      <HostTableCell className="px-3 tabular-nums">{row.duty}</HostTableCell>
                      <HostTableCell className="px-3 tabular-nums">{row.vat}</HostTableCell>
                      <HostTableCell className="px-3 text-center">
                        <StatusBadge tone={row.confirmed ? "success" : "danger"} className="h-4 px-2.5 font-normal">{row.confirmed ? "확정" : "검토 필요"}</StatusBadge>
                      </HostTableCell>
                      <HostTableCell className="px-3 text-center">
                        {row.confirmed ? (
                          <Button variant="outline" size="sm" aria-label={`${row.title} 데이터 보기`} onClick={() => window.dispatchEvent(new CustomEvent("ecoya:open-deal-document", { detail: { code: "CUSTOMS_ENTRY", fileName: row.fileName } }))}>데이터 보기</Button>
                        ) : (
                          <Button variant="outline" size="sm" className="min-w-20 pr-2.5 pl-3" onClick={() => openDealDocument("customs")}>
                            문서 검토<ExternalLink data-icon="inline-end" className="size-4" />
                          </Button>
                        )}
                      </HostTableCell>
                    </HostTableRow>
                  ))}
                </HostTableBody>
              </HostTable>
            </div>
            <p className="mt-4 text-[13px] leading-[18px] text-[var(--color-gray-5)]">
              {profile.direction === "sales" ? "수출신고필증" : "수입신고필증"}은 확정 후 원본을 보관하지 않습니다. 확정 데이터만 표시합니다.
            </p>
          </section>
        ),
        finance: (
          <section
            id="deal-finance"
            tabIndex={-1}
            className="min-w-0 scroll-mt-[calc(var(--deal-header-height,128px)+16px)] outline-none"
          >
            <DetailCard>
              <DealFinanceWorkspace
                key={dealId}
                dealId={dealId}
                invoiceIds={documentLinks.invoices.map(invoice => invoice.documentId)}
                settlementAmount={mainInformation.amount}
                settlementCurrency={mainInformation.currency}
                onOpenSettlement={onOpenSettlement}
                canWrite={canMutate(role)}
                addAudit={addAudit}
              />
            </DetailCard>
          </section>
        ),
      }}
      dealId={dealId}
      profile={profile}
      role={role}
      addAudit={addAudit}
      onUpload={onUpload}
      visibleGroups={visibleGroups}
      onMissingFieldsChange={setMissingFields}
      onSaveStatusChange={setSaveStatus}
      saveRetryRef={saveRetryRef}
      onContractItemsChange={setContractItems}
      onMainInformationChange={setMainInformation}
      onDocumentSummaryChange={setDocumentSummary}
      documentOpen={documentOpen}
      documentPanelTarget={documentPanelTarget}
      onDocumentOpenChange={handleDocumentOpenChange}
                  documentRequest={documentRequest}
      failedPanel={failedPanel}
      onRetry={() => setFailedPanel(null)}
    />
    <section
      id="deal-people"
      aria-label="관계자"
      tabIndex={-1}
      className="scroll-mt-[calc(var(--deal-header-height,128px)+16px)] outline-none"
    >
      <h2 className="mb-3 text-base font-semibold">관계자</h2>
      <DetailCard>
        <PeopleTab
          dealId={currentDealId}
          role={role}
          addAudit={addAudit}
        />
      </DetailCard>
    </section>
    <section
      aria-label="거래 메모·활동 이력"
      id="deal-records-main"
      tabIndex={-1}
      className="flex scroll-mt-[calc(var(--deal-header-height,128px)+16px)] flex-col gap-4 outline-none"
    >
      <DealRecordSections
        key={dealId}
        audit={audit}
        notes={notes}
        onUpdateNote={updateSharedNote}
        onDeleteNote={deleteSharedNote}
      />
    </section>
  </div>
  )
  const informationRail = (
    <aside
      aria-label="거래 현황"
      data-deal-information-aside
      ref={informationRailRef}
      // Below xl the page is one column: the rail moves above the content
      // (order-first) and, from md, lays its three blocks side by side so it
      // stays short instead of pushing the content far down.
      className="order-first min-w-0 self-start rounded-[var(--r-lg)] bg-[var(--color-gray-12)] shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)] xl:order-none xl:h-fit xl:sticky xl:top-[var(--deal-rail-sticky-top,144px)] [&_a]:underline-offset-4 [&_a:hover]:underline"
    >
    <div className="divide-y divide-[var(--surface-border)] md:max-xl:grid md:max-xl:grid-cols-3 md:max-xl:divide-x md:max-xl:divide-y-0">
      <section
        aria-label="주요 거래 정보"
        className="flex flex-col gap-4 p-5"
      >
        <div className="flex min-w-0 flex-col items-start gap-1.5">
          <a
            href={`/erp/counterparties/${encodeURIComponent(mainInformation.counterparty)}`}
            className="min-w-0 text-base font-bold leading-6 break-words hover:underline"
          >
            {mainInformation.counterparty}
          </a>
          <StatusBadge
            tone={profile.direction === "sales" ? "success" : profile.direction === "purchase" ? "blue" : "neutral"}
            variant="outline"
            className="shrink-0"
          >
            {directionLabels[profile.direction]}
          </StatusBadge>
        </div>
        {nextDocument ? (
          <div data-next-document className="rounded-lg bg-muted/40 px-3.5 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 text-xs font-semibold text-primary break-keep">다음 서류: {nextDocument.label}</span>
            {canMutate(role) && (
              <Button size="xs" variant="link" className="h-auto shrink-0 gap-1 py-0 text-xs" onClick={() => {
                if (nextDocument.kind === "upload") onUpload()
                else if (nextDocument.kind === "create") onCreateDocument(nextDocument.templateCode)
                else if (nextDocument.kind === "confirm" && nextDraft) onReviewDocument(nextDraft.number)
                else if (nextDocument.kind === "deliver" && nextDeliverable) onDeliver(nextDeliverable.number, [])
                else navigateSection(nextDocument.kind === "reconcile" ? "verification" : "documents")
              }}>진행하기<ArrowUpRight data-icon="inline-end" /></Button>
            )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{{ upload: "PDF를 업로드하고 검토한 뒤 이 거래에 연결하세요.", create: "양식을 선택해 거래에 필요한 문서를 만드세요.", confirm: "문서 내용과 승인 상태를 검토한 뒤 확정하세요.", deliver: "확정한 문서를 고객에게 전달하세요.", reconcile: "포장명세서와 선하증권의 중량을 확인하세요." }[nextDocument.kind]}</p>
          </div>
        ) : (
          <div className="rounded-lg bg-muted/40 px-3.5 py-3">
            <span className="text-xs text-muted-foreground">
              다음 할 일
            </span>
            {plan.current ? (
              <a
                href={`#${workIds[plan.current]}`}
                aria-label="현재 업무로 이동"
                className="mt-1 flex w-full items-center justify-between gap-2 text-left text-xs font-medium text-primary"
                onClick={(event) => {
                  event.preventDefault()
                  navigateSection(plan.current!)
                }}
              >
                {plan.nextAction}
              </a>
            ) : (
              <p className="mt-1 text-xs">{plan.nextAction}</p>
            )}
          </div>
        )}
      </section>
      <DealProgressNavigation
        metrics={
          <DealKeyMetrics
            profile={mainInformation}
            dealId={dealId}
            shipment={shipmentSummary}
            documentSummary={documentSummary}
          />
        }
        plan={plan}
        dealId={dealId}
        earlyGroups={earlyGroups}
        shipment={shipmentSummary}
        role={role}
        onOpenGroup={openFieldGroup}
        onNavigate={navigateSection}
        onRestoreCustoms={() => changeCustomsSetting(false)}
      />
      <DealHealthReference documentSummary={documentSummary} customsSkipped={customsSkipped} />
    </div>
    </aside>
  )
  return (
    <div
      ref={scrollViewportRef}
      data-deal-scroll-viewport
      className="field-scrollbar relative h-full [scrollbar-gutter:stable] overflow-y-auto bg-transparent"
    >
      <DealHandoffProvider
        key={dealId}
        dealId={dealId}
        role={role}
        direction={profile.direction}
        counterparty={profile.counterparty}
        documents={documents}
        items={initialDealLineItems}
        addAudit={addAudit}
        onOpenSettlement={onOpenSettlement}
      >
        <DealRefreshContext.Provider value={refresh}>
        <div className="min-w-0">
          <div
            ref={stickyHeaderRef}
            data-deal-sticky-header
            // Figma 문서 올리기 V2 (6233:81736) layout, white: the title row is a
            // card (same radius as the body cards) inset 20px, with the alert card below it.
            // @container/dealhead: actions shorten with the header's own width
            // (also when 「문서와 보기」 narrows the page) so it stays one row.
            className="@container/dealhead sticky top-0 z-30 mx-4 mt-1.5 rounded-[var(--r-lg)] bg-[var(--color-gray-12)] shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)] sm:mx-5"
          >
            <div className="flex min-h-14 flex-wrap items-center gap-2 px-3 py-2 sm:px-4 xl:px-6 @min-[640px]/dealhead:flex-nowrap">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="거래 목록으로 돌아가기"
                onClick={onBack}
              >
                <ChevronLeft />
              </Button>
              <form
                className="mr-auto min-w-0 @min-[640px]/dealhead:flex-1"
                onSubmit={(event) => {
                  event.preventDefault()
                  void saveDealId()
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {editingDealId ? (
                    <div className="flex min-w-0 items-center gap-1">
                      <Input
                        autoFocus
                        className="h-8 w-44 text-sm font-semibold"
                        value={dealIdDraft}
                        disabled={savingDealId || !canMutate(role)}
                        aria-label="거래번호"
                        aria-invalid={Boolean(dealIdDraft) && !dealIdIsValid}
                        onChange={(event) => setDealIdDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Escape") {
                            setDealIdDraft(currentDealId)
                            setDealTitleDraft(dealTitle)
                            setEditingDealId(false)
                          }
                        }}
                      />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon-sm"
                        className="size-7"
                        disabled={
                          !dealIdIsValid ||
                          !dealTitleIsValid ||
                          (dealIdCandidate === currentDealId &&
                            dealTitleCandidate === dealTitle) ||
                          savingDealId
                        }
                        aria-label="거래번호 저장"
                      >
                        {savingDealId ? (
                          <LoaderCircle className="animate-spin" />
                        ) : (
                          <Check />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="size-7"
                        disabled={savingDealId}
                        aria-label="거래번호 수정 취소"
                        onClick={() => {
                          setDealIdDraft(currentDealId)
                          setDealTitleDraft(dealTitle)
                          setEditingDealId(false)
                        }}
                      >
                        <X />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex min-w-0 items-center gap-1">
                      <h1 className="truncate text-sm font-semibold">
                        {currentDealId}
                      </h1>
                      {canMutate(role) ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="size-5 shrink-0"
                          aria-label="거래번호 수정"
                          onClick={() => {
                            setDealIdDraft(currentDealId)
                            setDealTitleDraft(dealTitle)
                            setEditingDealId(true)
                          }}
                        >
                          <Pencil className="size-3" />
                        </Button>
                      ) : null}
                    </div>
                  )}
                  <StatusBadge
                    tone={profile.direction === "sales" ? "success" : profile.direction === "purchase" ? "blue" : "neutral"}
                    variant="outline"
                  >
                    {directionLabels[profile.direction]}
                  </StatusBadge>
                  <StatusBadge tone="blue">
                    {{ contract: "계약", shipment: "선적", customs: "통관", settlement: "정산 중", settled: "정산 완료" }[fixture?.stage ?? "contract"]}
                  </StatusBadge>
                  {fixture && fixture.orderLifecycle !== "open" && <StatusBadge tone={fixture.orderLifecycle === "closed" ? "success" : "neutral"}>
                    {fixture.orderLifecycle === "closed" ? "종결" : fixture.orderLifecycle === "cancelled" ? "취소" : "주문 미확인"}
                  </StatusBadge>}
                  {createdProfile && profile.direction === "direction_pending" && canMutate(role) ? (
                    <Select disabled={savingDirection} onValueChange={value => {
                      if (value !== "sales" && value !== "purchase") return
                      setSavingDirection(true)
                      void prototypeBackend.deals.setCreatedDirection(dealId, value).then(result => {
                        if (result.ok) {
                          setCreatedDirection(value)
                          toast.success("거래 방향을 저장했습니다.")
                        } else toast.error(result.error)
                      }).finally(() => setSavingDirection(false))
                    }}>
                      <SelectTrigger className="h-7 w-auto min-w-28 text-xs" aria-label="거래 방향 정하기"><SelectValue placeholder="방향 정하기" /></SelectTrigger>
                      <SelectContent><SelectItem value="sales">매출</SelectItem><SelectItem value="purchase">매입</SelectItem></SelectContent>
                    </Select>
                  ) : null}
                </div>
                <div className="mt-0.5 flex min-w-0 items-center gap-2">
                  {editingDealId ? (
                    <Input
                      className="h-7 w-[min(320px,46vw)] text-xs"
                      value={dealTitleDraft}
                      disabled={savingDealId || !canMutate(role)}
                      maxLength={80}
                      aria-label="거래 구분명"
                      aria-invalid={
                        Boolean(dealTitleDraft) && !dealTitleIsValid
                      }
                      placeholder="구분용 한글 제목"
                      onChange={(event) =>
                        setDealTitleDraft(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          setDealIdDraft(currentDealId)
                          setDealTitleDraft(dealTitle)
                          setEditingDealId(false)
                        }
                      }}
                    />
                  ) : (
                    <span className="truncate text-[11px] text-[var(--surface-muted-foreground)]">
                      {dealTitle} · {profile.counterparty}
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto shrink-0 gap-1 p-0 text-[11px] text-[var(--surface-muted-foreground)] shadow-none"
                    disabled={refreshing}
                    aria-label="거래 다시 불러오기"
                    onClick={() => void refresh.refresh()}
                  >
                    <RefreshCw
                      className={cn("size-3", refreshing && "animate-spin")}
                    />
                    {refreshing ? "갱신 중" : "09:30 기준"}
                  </Button>
                </div>
              </form>
              {saveStatus && canMutate(role) ? (
                <span className="mr-1 flex shrink-0 items-center gap-1.5" title={saveStatus.state === "saved" ? "모든 변경은 자동 저장됩니다" : undefined}>
                  <AutoSaveStatus state={saveStatus.state} savedAt={saveStatus.savedAt} className="px-0 text-[13px] leading-[18px] @max-[899px]/dealhead:text-[0px]" />
                  {saveStatus.showRetry ? (
                    <Button type="button" variant="outline" size="xs" onClick={() => saveRetryRef.current()}>
                      다시 저장
                    </Button>
                  ) : null}
                </span>
              ) : null}
              {compactAlerts && (
                <div
                  ref={compactAlertsRef}
                  data-deal-compact-alerts
                  className="shrink-0"
                >
                  <DealCompactAlerts
                    missingFields={missingFields}
                    notices={dealReviewNotices(riskDismissed)}
                    onOpenMissingField={openMissingField}
                    onOpenVerification={openReviewNotice}
                  />
                </div>
              )}

              <DealMemoComposer onCreateNote={createSharedNote} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canMutate(role)}
                onClick={onUpload}
                aria-label="문서 올리기"
                title="문서 올리기"
              >
                <NavigationIcon name="upload" className="!size-[18px]" /><span className="hidden @min-[1100px]/dealhead:inline">문서 올리기</span>
              </Button>
              <Popover
                open={documentTemplatePickerOpen}
                onOpenChange={(open) => {
                  setDocumentTemplatePickerOpen(open)
                  if (!open) setDocumentTemplateQuery("")
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    title={`${currentDealId} 거래 정보로 문서 만들기`}
                    aria-label="문서 만들기"
                  >
                    <NavigationIcon name="document" className="!size-[18px]" /><span className="hidden @min-[1100px]/dealhead:inline">문서 만들기</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-[min(420px,calc(100vw-2rem))] gap-0 p-0"
                >
                  <div className="border-b p-3">
                    <div className="text-xs font-semibold">문서 유형</div>
                    <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                      이 거래 정보로 만들 문서 유형을 선택하세요.
                    </p>
                    <div className="mt-3">
                      <DocumentTemplateOptions
                        templates={documentTemplates}
                        query={documentTemplateQuery}
                        onQueryChange={setDocumentTemplateQuery}
                        onSelect={(templateCode) => {
                          setDocumentTemplatePickerOpen(false)
                          setDocumentTemplateQuery("")
                          onCreateDocument(templateCode)
                        }}
                        autoFocus
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Popover
                open={generatedDocumentsOpen}
                onOpenChange={(open) => {
                  setGeneratedDocumentsOpen(open)
                  if (
                    open &&
                    !generatedDocuments.some(
                      (document) =>
                        document.number === deliveryDocumentNumber &&
                        document.state !== "draft"
                    )
                  ) {
                    setDeliveryDocumentNumber(
                      generatedDocuments.find(
                        (document) => document.state !== "draft"
                      )?.number ?? null
                    )
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    disabled={generatedDocuments.length === 0}
                    title={
                      generatedDocuments.length === 0
                        ? "이 거래에서 만든 문서가 없습니다"
                        : "이 거래에서 만든 문서 보기"
                    }
                  >
                    <span><span className="hidden @min-[900px]/dealhead:inline">문서 </span>고객 전달</span>
                    <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-current/10 px-1 text-[11px] tabular-nums">
                      {generatedDocuments.length}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[440px] p-0">
                  <div className="border-b border-[var(--surface-border)] px-4 py-3">
                    <div className="text-sm font-semibold">문서 고객 전달</div>
                    <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                      확정된 생성 문서 1개를 본문으로 선택하고, 수신·업로드된
                      서류는 동봉 문서로 함께 보낼 수 있습니다.
                    </p>
                  </div>
                  <div className="field-scrollbar max-h-[min(62vh,560px)] overflow-y-auto px-2 py-2">
                    <div className="flex items-center justify-between px-2 py-1">
                      <span className="text-[11px] font-semibold">
                        본문 문서
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        1개 선택
                      </span>
                    </div>
                    <GeneratedDealDocumentsList
                      documents={generatedDocuments}
                      selectedDocumentNumber={deliveryDocumentNumber}
                      onSelect={setDeliveryDocumentNumber}
                    />
                    <div className="mt-2 border-t border-[var(--surface-border)] pt-2">
                      <div className="flex items-center justify-between px-2 py-1.5">
                        <span className="text-[11px] font-semibold">
                          동봉 문서
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {deliveryAttachmentNames.size}개 선택 · 최대{" "}
                          {dealDeliveryAttachmentOptions.length}개
                        </span>
                      </div>
                      <div className="grid gap-1">
                        {dealDeliveryAttachmentOptions.map((document) => {
                          const selected = deliveryAttachmentNames.has(
                            document.file
                          )
                          return (
                            <button
                              key={document.file}
                              type="button"
                              aria-pressed={selected}
                              className={cn(
                                "flex min-h-11 w-full items-center gap-2 rounded-[var(--r-sm)] px-2 text-left transition-colors hover:bg-[var(--surface-muted-background)]",
                                selected &&
                                  "bg-[var(--control-selected-soft-background)]"
                              )}
                              onClick={() =>
                                setDeliveryAttachmentNames((current) => {
                                  const next = new Set(current)
                                  if (next.has(document.file)) {
                                    next.delete(document.file)
                                  } else {
                                    next.add(document.file)
                                  }
                                  return next
                                })
                              }
                            >
                              <span
                                className={cn(
                                  "flex size-5 shrink-0 items-center justify-center rounded-[var(--r-xs)] border border-[var(--control-border)] bg-background",
                                  selected &&
                                    "border-primary bg-primary text-primary-foreground"
                                )}
                                aria-hidden="true"
                              >
                                {selected ? <Check className="size-3" /> : null}
                              </span>
                              <span className="flex size-7 shrink-0 items-center justify-center rounded-[var(--r-xs)] border border-[var(--surface-border)] text-[9px] font-semibold text-primary">
                                {document.code}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-medium">
                                  {document.file}
                                </span>
                                <span className="mt-0.5 block text-[10px] text-muted-foreground">
                                  {document.type} · {document.source}
                                </span>
                              </span>
                              <StatusBadge tone="neutral">
                                {document.status}
                              </StatusBadge>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-[var(--surface-border)] px-4 py-3">
                    <span className="text-[11px] text-muted-foreground">
                      생성 문서 {deliveryDocumentNumber ? 1 : 0}개 · 동봉 문서{" "}
                      {deliveryAttachmentNames.size}개
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!deliveryDocumentNumber}
                      onClick={() => {
                        if (!deliveryDocumentNumber) return
                        setGeneratedDocumentsOpen(false)
                        onDeliver(
                          deliveryDocumentNumber,
                          Array.from(deliveryAttachmentNames)
                        )
                      }}
                    >
                      전달 준비
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon-sm" aria-label="더보기">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuItem onClick={() => setDialog("issue")}>
                    <AlertTriangle />
                    이슈 플래그 등록
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setFailedPanel(activeSection)
                    }}
                  >
                    <CircleAlert />
                    현재 패널 오류 상태 보기
                  </DropdownMenuItem>
                  {role === "owner" ? (
                    <DropdownMenuItem
                      disabled={settled}
                      onClick={() => setDialog("archive")}
                    >
                      <Archive />
                      {settled ? "정산 완료 거래 보관 불가" : "보관"}
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <section
            ref={alertsRef}
            aria-label="거래 중요 알림"
            data-deal-summary
            className="mx-4 mt-4 rounded-[var(--r-lg)] bg-[var(--color-gray-12)] px-4 py-3 shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)] empty:hidden sm:mx-5 sm:px-5"
          >
            <DealAssistBar
              notices={dealReviewNotices(riskDismissed)}
              missingFields={missingFields}
              onOpenMissingField={openMissingField}
              onOpenVerification={openReviewNotice}
            />
          </section>
          <div className="w-full px-4 py-4 sm:px-5">
            {!documentOpen && <div className={refresh.failure ? "mb-4" : ""}>
              <PostWriteRefreshNotice failure={refresh.failure} busy={refresh.busy} onRetry={() => void refresh.refresh()} />
            </div>}
            <div
              ref={comparisonGridRef}
              style={splitDocumentOpen && comparisonHeight ? {
                height: comparisonHeight,
                position: "sticky",
                top: "var(--deal-header-height, 0px)",
                zIndex: 20,
              } : undefined}
              className={cn(
                "min-h-0",
                splitDocumentOpen &&
                  "overflow-hidden rounded-[var(--r-lg)] bg-[var(--surface-background)] shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)]"
              )}
            >
              {splitDocumentOpen ? (
                <ResponsivePdfPanelSplit
                  label="거래 정보와 문서 원문 너비 조절"
                  className="h-full"
                  desktopHeight="100%"
                  primary={dealPageContent}
                  preview={
                    <aside
                      ref={setDocumentPanelTarget}
                      aria-label="원문 문서 패널"
                      className="min-w-0 min-h-[620px] overflow-hidden bg-[var(--surface-background)] xl:h-full"
                    />
                  }
                />
              ) : (
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_320px]">
                  {dealPageContent}
                  {informationRail}
                </div>
              )}
            </div>
          </div>
        </div>
        {isCompactWorkspace && (
          <Sheet open={documentOpen} onOpenChange={handleDocumentOpenChange}>
            <SheetContent
              side="right"
              showCloseButton={false}
              className="min-h-0 overflow-hidden data-[side=right]:w-full data-[side=right]:sm:max-w-2xl"
              aria-describedby="deal-comparison-description"
              onCloseAutoFocus={(event) => {
                event.preventDefault()
                documentTriggerRef.current?.focus({ preventScroll: true })
              }}
            >
              <SheetTitle className="sr-only">문서 보기</SheetTitle>
              <div ref={setDocumentPanelTarget} className="min-h-0 min-w-0 flex-1" />
            </SheetContent>
          </Sheet>
        )}
        <Sheet open={verificationOpen} onOpenChange={setVerificationOpen}>
          <SheetContent
            onOpenAutoFocus={(event) => {
              const target = document.getElementById(
                `deal-review-${reviewFocusId}`
              )
              if (target) {
                event.preventDefault()
                target.focus()
              }
            }}
            side="right"
            className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
          >
            <SheetHeader>
              <SheetTitle>검토 알림</SheetTitle>
              <SheetDescription>
                확인이 필요한 항목의 근거를 비교하고 처리합니다.
              </SheetDescription>
            </SheetHeader>
            <div id="deal-verification" className="px-4 pb-6">
              <DealVerificationPanels
                riskDismissed={riskDismissed}
                onRiskDismiss={() => setRiskDismissed(true)}
                dealId={dealId}
                role={role}
                addAudit={addAudit}
                onOpenDocuments={() => {
                  setVerificationOpen(false)
                  openDocumentPanel()
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
        </DealRefreshContext.Provider>
      </DealHandoffProvider>
      {workspaceActionsTarget
        ? createPortal(
            <>
              <SimpleSelect
                size="sm"
                className="h-8 w-auto min-w-24"
                value={assignee}
                disabled={!canMutate(role) || savingAssignee}
                ariaLabel="거래 담당자"
                label="담당자"
                onValueChange={async (next) => {
                  if (!canMutate(role) || savingAssignee) return
                  const receipt = refresh.beginWrite()
                  let accepted = false
                  setSavingAssignee(true)
                  try {
                    const result = await prototypeBackend.deals.setAssignee({
                      dealId,
                      assigneeId: next === "미배정" ? null : next,
                    })
                    accepted = result.ok
                    if (!refresh.isCurrent(receipt)) return
                    if (!result.ok) throw new Error(result.error)
                    setAssignee(next)
                    addAudit("담당자 변경", next)
                    toast.success("담당자를 저장했습니다.")
                  } catch (error) {
                    if (refresh.isCurrent(receipt)) toast.error(error instanceof Error ? error.message : "담당자를 저장하지 못했습니다.")
                  } finally {
                    refresh.finishWrite(receipt, accepted)
                    if (refresh.isCurrent(receipt)) setSavingAssignee(false)
                  }
                }}
                options={["조민영", "박서윤", "김도현", "미배정"]}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShareDialogOpen(true)}
                aria-label={`공유 대상 ${sharedMembers.length}명`}
              >
                <UsersRound data-icon="inline-start" />
                공유 {sharedMembers.length}
              </Button>
            </>,
            workspaceActionsTarget
          )
        : null}
      {shareDialogOpen ? (
        <DealShareDialog
          members={sharedMembers}
          candidates={shareCandidates}
          selected={shareCandidate}
          busyMember={shareBusyMember}
          canWrite={canMutate(role)}
          onSelectedChange={setShareCandidate}
          onAdd={addDealShare}
          onRemove={removeDealShare}
          onClose={() => {
            setShareDialogOpen(false)
            setShareCandidate("")
          }}
        />
      ) : null}
      {dialog === "issue" ? (
        <ActionDialog
          title="이슈 플래그 등록"
          description="사장님과 Owner에게 보고됩니다. 거래 진행은 중단되지 않습니다."
          confirmLabel="이슈 등록"
          canConfirm={Boolean(issueNote.trim())}
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            if (!canMutate(role)) return
            const receipt = refresh.beginWrite()
            let accepted = false
            try {
              const result = await prototypeBackend.deals.createFlag({
                  dealId,
                  type: issueType,
                  note: issueNote.trim(),
                })
              accepted = result.ok
              if (!refresh.isCurrent(receipt)) return
              if (!result.ok) throw new Error(result.error)
              toast.success("이슈를 등록했습니다.")
              addAudit("이슈 플래그", `${issueType} · ${issueNote.trim()}`)
              setDialog(null)
              setIssueNote("")
            } finally { refresh.finishWrite(receipt, accepted) }
          }}
        >
          <Field label="이슈 유형">
            <SimpleSelect
              value={issueType}
              onValueChange={setIssueType}
              options={[
                ["payment_risk", "결제 위험"],
                ["shipment_risk", "선적 위험"],
                ["margin_risk", "마진 위험"],
                ["document_error", "문서 오류"],
                ["other", "기타"],
              ]}
            />
          </Field>
          <Field label="상세 내용">
            <Textarea
              value={issueNote}
              onChange={(event) => setIssueNote(event.target.value)}
              placeholder="확인이 필요한 사실과 요청을 입력하세요"
            />
          </Field>
        </ActionDialog>
      ) : null}
      {dialog === "archive" ? (
        <ActionDialog
          title="이 거래를 보관할까요?"
          description="진행 중인 목록에서 제외됩니다. 연결된 문서와 거래 이력은 유지되며, Owner가 보관된 거래 목록에서 복구할 수 있습니다."
          confirmLabel="보관"
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await requireMutation(
              prototypeBackend.deals.archive(currentDealId),
              "거래를 보관했습니다."
            )
            setArchived(true)
            setDialog(null)
          }}
        />
      ) : null}
    </div>
  )
}

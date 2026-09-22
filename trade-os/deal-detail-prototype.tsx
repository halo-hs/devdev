import { ReferenceOperations } from "@trade-os/operations/index"
import { FormField, FormFieldHeader, FormFieldMessage, SimpleFormField } from "@shared/components/form-field"
import {
  getDealWorkPlan,
  readStartedWork,
  workIds,
  workLabels,
  type DealWorkKey,
  type DealWorkPlan,
} from "@trade-os/lib/deal-workflow"
import { orderProgress } from "@trade-os/lib/deal-finance-workspace"
import { deals as dealFixtures } from "@trade-os/lib/prototype-deals"
import { DealFinanceWorkspace } from "@trade-os/deal-finance-workspace"
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { toast } from "sonner"
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  CircleAlert,
  FilePlus2,
  FileSearch,
  GripVertical,
  Link2,
  LoaderCircle,
  MoreVertical,
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
} from "@shared/components/pdf-floating-controls"
import {
  PdfPanelWorkspaceCard,
  ResponsivePdfPanelSplit,
} from "@shared/components/pdf-panel-resize-handle"
import { PannablePdfViewport } from "@shared/components/pannable-pdf-viewport"
import { AutoSaveStatus } from "@shared/components/auto-save-status"
import {
  DocumentTemplateOptions,
  type DocumentTemplateOption,
} from "@trade-os/components/document-template-options"
import { Badge } from "@shared/components/ui/badge"
import { Button } from "@shared/components/ui/button"
import { Card } from "@shared/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu"
import { Input } from "@shared/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@shared/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select"
import { Separator } from "@shared/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@shared/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@shared/components/ui/sheet"
import { Textarea } from "@shared/components/ui/textarea"
import { cn } from "@shared/lib/utils"
import { prototypeBackend, type MutationResult } from "@trade-os/lib/prototype-backend"
import {
  DealHandoffProvider,
  DealContractTool,
  DealPartyTool,
} from "@trade-os/deal-handoff-tools"
import type { NotificationDealTarget } from "@trade-os/lib/notifications"

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
const stageEntryTab = (dealId: string): Tab => {
  const stage = dealStage(dealId)
  return stage === "settled" || stage === "settlement"
    ? "finance"
    : stage === "shipment" || stage === "customs"
      ? "fulfillment"
      : "overview"
}

type DealDirection = "sales" | "purchase"
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
type DealNoteItem = {
  id: number
  body: string
  actor: string
  time: string
}
type DialogKind = "issue" | "delete" | null
type OrderState = "open" | "closed" | "short_closed" | "cancelled"
type OrderAction =
  "close" | "short_close" | "cancel" | "reopen" | null

const roleLabels: Record<Role, string> = {
  owner: "Owner 화면",
  admin: "관리자 화면",
  member: "멤버 화면",
}
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

const documents = [
  {
    code: "PO",
    type: "발주서",
    file: "PO-260704-18.pdf",
    status: "보유",
    source: "수신",
  },
  {
    code: "SC",
    type: "판매계약서",
    file: "SC-2026-0708.pdf",
    status: "발행",
    source: "발행",
  },
  {
    code: "CI",
    type: "상업송장",
    file: "Invoice_HB-2607-003.pdf",
    status: "보유",
    source: "수신",
  },
  {
    code: "PL",
    type: "포장명세서",
    file: "PackingList_0707.pdf",
    status: "보유",
    source: "수신",
  },
  { code: "BL", type: "선하증권", file: "", status: "미비", source: "-" },
]

const supplementaryDocuments = [
  {
    code: "CO",
    type: "원산지증명서",
    file: "Certificate_Origin_0708.pdf",
    status: "보유",
    source: "수신",
  },
  {
    code: "IC",
    type: "보험증권",
    file: "Cargo_Insurance_0708.pdf",
    status: "보유",
    source: "수신",
  },
  {
    code: "QC",
    type: "검사성적서",
    file: "Inspection_Report_0706.pdf",
    status: "검토",
    source: "업로드",
  },
]

const detectDealDocumentCode = (fileName: string) => {
  const normalized = fileName.toLowerCase()
  const matchers: Array<[string, RegExp]> = [
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

type DocumentSlot = (typeof documents)[number]

const dealDeliveryAttachmentOptions = [
  ...documents,
  ...supplementaryDocuments,
].filter((document) => document.file.toLowerCase().endsWith(".pdf"))

function ImportantDealDocumentsPanel({
  importantDocuments,
  selected,
  onSelect,
  onUpload,
}: {
  importantDocuments: DocumentSlot[]
  selected: DocumentSlot
  onSelect: (document: DocumentSlot) => void
  onUpload: (document: DocumentSlot) => void
}) {
  return (
    <section
      aria-label="중요 서류"
      className="mt-2 rounded-[var(--r-md)] border border-[var(--surface-border)] bg-background p-2"
    >
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
        {importantDocuments.map((document) => {
          const isMissing = !document.file
          const isManual = document.status === "원본 미첨부"
          const isNew = document.code === "PO"
          const isSelected = selected.code === document.code

          return (
            <button
              key={document.code}
              type="button"
              className={cn(
                "flex h-10 min-w-0 items-center gap-2 rounded-[var(--r-sm)] border px-2.5 text-left transition-colors focus-visible:[box-shadow:var(--shadow-keyboard-focus)] focus-visible:outline-none",
                isMissing
                  ? "border-dashed border-warning/55 hover:border-warning"
                  : isSelected
                    ? "border-[var(--control-selected-border)] bg-[var(--control-selected-soft-background)]"
                    : "border-[var(--surface-border)] hover:border-[var(--control-hover-border)]"
              )}
              onClick={() =>
                isMissing ? onUpload(document) : onSelect(document)
              }
              aria-label={
                isMissing
                  ? `${document.type} ${isManual ? "원본 파일 추가" : "파일 추가"}`
                  : `${document.type} 원본 보기`
              }
            >
              <span
                className={cn(
                  "shrink-0 text-[10px] font-semibold",
                  isMissing
                    ? "text-warning"
                    : isSelected || isNew
                      ? "text-primary"
                      : "text-muted-foreground"
                )}
              >
                {document.code}
              </span>
              <span className="min-w-0 flex-1 truncate text-[11px] font-semibold">
                {document.type}
              </span>
              {isMissing ? (
                <span className="shrink-0 text-[10px] font-semibold text-warning">
                  {isManual ? "원본 없음" : "미비"}
                </span>
              ) : isNew ? (
                <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-primary">
                  <span className="size-1.5 rounded-full bg-primary" /> 신규
                </span>
              ) : (
                <Check className="size-3.5 shrink-0 text-success" />
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

type DocumentFieldOrigin =
  "AI 추출" | "확정 문서" | "거래값" | "직접 입력" | "입력 대기"
type DocumentFieldDetail = {
  key: string
  label: string
  value: string
  origin: DocumentFieldOrigin
  evidence: string
}

type DocumentFieldSet = {
  total: number
  fields: DocumentFieldDetail[]
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
  onOpenGroup,
  onNavigate,
}: {
  metrics: ReactNode
  plan: DealWorkPlan
  dealId: string
  earlyGroups: DealFieldGroup[]
  shipment: DealShipmentSummary | null
  role: Role
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
    <div className="px-4 py-3">
      <section aria-label="거래 진행 상태">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">정보·업무 진행</h3>
          <Badge variant="secondary" className="text-xs">
            {plan.current
              ? `${workLabels[plan.current]} 확인 필요`
              : "전체 완료"}
          </Badge>
        </div>
        <nav aria-label="거래 정보 바로가기" className="mt-2">
          <div className="grid grid-cols-2 gap-1 border-b pb-2">
            <a
              href="#deal-overview"
              onClick={(event) => {
                event.preventDefault()
                onNavigate("overview")
              }}
              className="flex min-h-8 items-center justify-center gap-1 rounded text-xs font-medium text-primary hover:bg-primary/5"
            >
              거래 요약
            </a>
            <a
              href="#deal-documents"
              onClick={(event) => {
                event.preventDefault()
                onNavigate("documents")
              }}
              className="flex min-h-8 items-center justify-center gap-1 rounded text-xs font-medium text-primary hover:bg-primary/5"
            >
              거래 상세
            </a>
          </div>
          {metrics}
          <ol className="mt-2 space-y-1">
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
                    "rounded-md px-2 py-0.5",
                    active && "bg-primary/[0.06] ring-1 ring-primary/15"
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
                          ? "bg-primary text-primary-foreground"
                          : complete
                            ? "bg-primary/10 text-primary"
                            : "border text-muted-foreground"
                      )}
                    >
                      {complete ? <Check className="size-3.5" /> : index + 1}
                    </span>
                    <span
                      className={cn(
                        "flex-1 text-sm font-semibold group-hover:text-primary",
                        active && "text-primary"
                      )}
                    >
                      {stage.label}
                    </span>
                    <span
                      className={cn(
                        "text-xs",
                        active ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {complete
                        ? "완료"
                        : active
                          ? "현재 할 일"
                          : started
                            ? "진행 중"
                            : "예정"}
                    </span>
                  </a>
                  <div className="ml-3 border-l pl-4">
                    {stage.value === "shipment" && (
                      <p className="py-1 text-xs text-muted-foreground">
                        {index <= current
                          ? (shipment?.state ??
                            (complete ? "선적 완료" : "선적 진행"))
                          : "선적 예정"}
                      </p>
                    )}
                    {stage.value === "customs" && !complete && (
                      <p className="py-1 text-xs text-muted-foreground">
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
                              className="flex min-h-8 items-center gap-1.5 rounded px-1 text-xs text-primary hover:bg-primary/5"
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
  ],
}

const lineItemQuantityCandidates: Record<number, DealFieldCandidate[]> = {
  2: [
    { source: "PO", document: "PO-260704-18.pdf", value: "8" },
    { source: "SC", document: "SC-2026-0708.pdf", value: "8" },
    { source: "CI", document: "Invoice_HB-2607-003.pdf", value: "8" },
    { source: "PL", document: "PackingList_0707.pdf", value: "4" },
  ],
}

const extracted = (
  file: string,
  page: number,
  key: string,
  label: string,
  value: string
): DocumentFieldDetail => ({
  key,
  label,
  value,
  origin: "AI 추출",
  evidence: `${file} · ${page}p`,
})

const initialDocumentFields: Record<string, DocumentFieldSet> = {
  PO: {
    total: 18,
    fields: [
      extracted("PO-260704-18.pdf", 1, "po_number", "발주번호", "PO-260704-18"),
      extracted("PO-260704-18.pdf", 1, "buyer", "구매자", "ECOYA Demo Co."),
      extracted(
        "PO-260704-18.pdf",
        1,
        "seller",
        "판매자",
        "KATAMAN ASIA-PACIFIC PTE LTD"
      ),
      extracted(
        "PO-260704-18.pdf",
        1,
        "goods",
        "품목",
        "Aluminium Scrap Tough Taboo"
      ),
      extracted("PO-260704-18.pdf", 1, "quantity", "수량", "20 MT"),
      extracted("PO-260704-18.pdf", 1, "unit_price", "단가", "120,000 USD/MT"),
      extracted("PO-260704-18.pdf", 1, "amount", "총액", "2,400,000 USD"),
      extracted("PO-260704-18.pdf", 2, "incoterms", "인코텀즈", "CIF Incheon"),
      extracted("PO-260704-18.pdf", 2, "etd", "요청 선적일", "2026-07-20"),
    ],
  },
  SC: {
    total: 24,
    fields: [
      extracted(
        "SC-2026-0708.pdf",
        1,
        "contract_number",
        "계약번호",
        "SC-2026-0708"
      ),
      extracted("SC-2026-0708.pdf", 1, "contract_date", "계약일", "2026-07-08"),
      extracted("SC-2026-0708.pdf", 1, "buyer", "매수인", "ACME GmbH"),
      extracted("SC-2026-0708.pdf", 1, "seller", "매도인", "ECOYA Demo Co."),
      extracted(
        "SC-2026-0708.pdf",
        1,
        "goods",
        "품목",
        "Aluminium Scrap Tough Taboo"
      ),
      extracted("SC-2026-0708.pdf", 1, "quantity", "수량", "20 MT"),
      extracted("SC-2026-0708.pdf", 1, "amount", "계약금액", "2,400,000 USD"),
      extracted(
        "SC-2026-0708.pdf",
        2,
        "incoterms",
        "인코텀즈",
        "CIF Incheon, Korea"
      ),
      extracted("SC-2026-0708.pdf", 2, "payment", "지급조건", "T/T 30 days"),
      extracted(
        "SC-2026-0708.pdf",
        2,
        "shipment_date",
        "선적기한",
        "2026-07-20"
      ),
    ],
  },
  CI: {
    total: 21,
    fields: [
      extracted(
        "Invoice_HB-2607-003.pdf",
        1,
        "invoice_number",
        "송장번호",
        "INV-2026-0703"
      ),
      extracted(
        "Invoice_HB-2607-003.pdf",
        1,
        "invoice_date",
        "송장일",
        "2026-07-07"
      ),
      extracted(
        "Invoice_HB-2607-003.pdf",
        1,
        "buyer",
        "구매자",
        "HRM Corporation"
      ),
      extracted(
        "Invoice_HB-2607-003.pdf",
        1,
        "seller",
        "판매자",
        "KATAMAN ASIA-PACIFIC PTE LTD"
      ),
      extracted(
        "Invoice_HB-2607-003.pdf",
        1,
        "goods",
        "품목",
        "Aluminium Scrap Tough Taboo"
      ),
      extracted("Invoice_HB-2607-003.pdf", 1, "quantity", "수량", "20 MT"),
      extracted(
        "Invoice_HB-2607-003.pdf",
        1,
        "amount",
        "송장금액",
        "2,566,000 USD"
      ),
      extracted(
        "Invoice_HB-2607-003.pdf",
        2,
        "payment",
        "지급조건",
        "T/T 30 days"
      ),
      extracted(
        "Invoice_HB-2607-003.pdf",
        2,
        "bank",
        "수취은행",
        "JPMorgan Chase Singapore"
      ),
    ],
  },
  PL: {
    total: 16,
    fields: [
      extracted(
        "PackingList_0707.pdf",
        1,
        "packing_number",
        "포장명세번호",
        "PL-2026-0707"
      ),
      extracted(
        "PackingList_0707.pdf",
        1,
        "goods",
        "품목",
        "Aluminium Scrap Tough Taboo"
      ),
      extracted("PackingList_0707.pdf", 1, "quantity", "문서 수량", "16 MT"),
      extracted("PackingList_0707.pdf", 1, "packages", "포장 수", "20 bundles"),
      extracted(
        "PackingList_0707.pdf",
        1,
        "gross_weight",
        "총중량",
        "16,480 KG"
      ),
      extracted("PackingList_0707.pdf", 1, "net_weight", "순중량", "16,000 KG"),
      extracted(
        "PackingList_0707.pdf",
        1,
        "container",
        "컨테이너",
        "1 x 40FT HC"
      ),
      extracted(
        "PackingList_0707.pdf",
        1,
        "marks",
        "화인",
        "KATAMAN / INCHEON"
      ),
    ],
  },
  BL: {
    total: 19,
    fields: [
      {
        key: "bl_number",
        label: "B/L 번호",
        value: "",
        origin: "입력 대기",
        evidence: "연결 문서 없음",
      },
      {
        key: "carrier",
        label: "선사",
        value: "",
        origin: "입력 대기",
        evidence: "연결 문서 없음",
      },
      {
        key: "shipper",
        label: "송하인",
        value: "KATAMAN ASIA-PACIFIC PTE LTD",
        origin: "거래값",
        evidence: "거래처 · 판매자",
      },
      {
        key: "consignee",
        label: "수하인",
        value: "HRM Corporation",
        origin: "확정 문서",
        evidence: "Invoice_HB-2607-003.pdf · 구매자",
      },
      {
        key: "vessel",
        label: "선박명",
        value: "",
        origin: "입력 대기",
        evidence: "연결 문서 없음",
      },
      {
        key: "voyage",
        label: "항차",
        value: "",
        origin: "입력 대기",
        evidence: "연결 문서 없음",
      },
      {
        key: "port_loading",
        label: "선적항",
        value: "Melbourne",
        origin: "거래값",
        evidence: "선적 014W-02",
      },
      {
        key: "port_discharge",
        label: "도착항",
        value: "Busan",
        origin: "거래값",
        evidence: "선적 014W-02",
      },
      {
        key: "quantity",
        label: "선적 수량",
        value: "",
        origin: "입력 대기",
        evidence: "PL 수량 16 MT와 대조 필요",
      },
      {
        key: "etd",
        label: "ETD",
        value: "2026-07-20",
        origin: "거래값",
        evidence: "연결 선적 일정",
      },
      {
        key: "eta",
        label: "ETA",
        value: "2026-08-03",
        origin: "거래값",
        evidence: "연결 선적 일정",
      },
    ],
  },
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

function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode
  tone?: "neutral" | "blue" | "success" | "warning" | "danger"
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "h-5 rounded-full border-0 px-2 text-[11px] font-medium",
        tone === "neutral" && "bg-muted text-muted-foreground",
        tone === "blue" && "bg-primary/10 text-primary",
        tone === "success" && "bg-success/10 text-success",
        tone === "warning" && "bg-warning/10 text-warning-foreground",
        tone === "danger" && "bg-destructive/10 text-destructive"
      )}
    >
      {children}
    </Badge>
  )
}

function SectionHeading({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
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
}: {
  value: string
  onValueChange: (value: string) => void
  options: Array<string | [string, string]>
  disabled?: boolean
  className?: string
  icon?: ReactNode
  ariaLabel?: string
}) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => onValueChange(nextValue ?? value)}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn("h-9 w-full", className)}
        aria-label={ariaLabel}
      >
        {icon}
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

function AuditTrail({ items }: { items: AuditItem[] }) {
  return (
    <div className="mt-3 border-l-2 pl-4">
      {items.slice(0, 6).map((item) => (
        <div key={item.id} className="pb-4 last:pb-0">
          <strong className="text-sm">{item.action}</strong>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
          <small className="mt-1 block text-[11px] text-muted-foreground">
            {item.actor} · {item.time}
          </small>
        </div>
      ))}
    </div>
  )
}

type DealMissingField = {
  key: string
  label: string
  group: DealFieldGroup | "품목"
  issue: "누락" | "불일치"
}

function requiredDealReviews(
  fields: DealFieldDetail[],
  groups: DealFieldGroup[],
  items: DealLineItem[],
  direction: DealProfile["direction"]
): DealMissingField[] {
  const needsReview = (match: DealFieldMatch) =>
    match === "누락" || match === "확인 필요"
  return [
    ...fields
      .filter(
        (field) =>
          groups.includes(field.group) &&
          field.key !== (direction === "sales" ? "seller" : "buyer") &&
          needsReview(field.match)
      )
      .map((field) => ({
        key: field.key,
        label:
          field.key === "amount_total"
            ? `${directionLabels[direction]} 금액`
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
      className="rounded-md border border-destructive/30 bg-destructive/5"
      data-deal-missing-information
    >
      <div className="flex min-h-14 items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <AlertTriangle
          aria-hidden
          className="size-4 shrink-0 text-destructive"
        />
        <div role="alert" className="min-w-0 flex-1 text-xs sm:text-sm">
          <strong className="text-destructive">
            검토 필요 {fields.length}건 · 누락·불일치
          </strong>
          <div className="mt-0.5 flex flex-wrap gap-x-2 text-muted-foreground">
            {fields.map((field) => (
              <button
                key={field.key}
                type="button"
                onClick={() => onOpenField(field.key)}
                className="text-left underline decoration-destructive/30 underline-offset-2 hover:text-destructive"
              >
                {field.label}
              </button>
            ))}
            <span>항목을 확인해 주세요.</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          aria-label={expanded ? "검토 항목 접기" : "검토 항목 펼치기"}
          aria-expanded={expanded}
          aria-controls="deal-missing-fields"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "접기" : "항목 보기"}
          <ChevronDown className={cn("size-4", expanded && "rotate-180")} />
        </Button>
      </div>
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
                <span className="font-medium">
                  {field.label} {field.issue}
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
          className="rounded-md border border-warning/30 bg-warning/5"
        >
          <div className="flex min-h-14 items-center gap-2 px-3 sm:gap-3 sm:px-4">
            <CircleAlert className="size-4 shrink-0 text-warning-foreground" />
            <div className="min-w-0 flex-1 text-xs sm:text-sm">
              <strong className="text-warning-foreground">
                확인 필요 {notices.length}건
              </strong>
              <button
                type="button"
                className="mt-0.5 block text-left text-muted-foreground underline decoration-warning/40 underline-offset-2 hover:text-warning-foreground"
                onClick={() => onOpenVerification(notices[0].id)}
              >
                {notices[0].title}
              </button>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0"
              aria-label={expanded ? "확인 항목 접기" : "확인 항목 펼치기"}
              aria-expanded={expanded}
              aria-controls="deal-confirmation-list"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "접기" : "항목 보기"}
              <ChevronDown className={cn("size-4", expanded && "rotate-180")} />
            </Button>
          </div>
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
      tone: "border-destructive/25 bg-destructive/5 text-destructive",
      items: missingFields.map((field) => ({
        id: field.key,
        title: field.label,
        select: () => onOpenMissingField(field.key),
      })),
    },
    {
      key: "confirmation",
      label: "확인 필요",
      tone: "border-warning/30 bg-warning/10 text-warning-foreground",
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
              <Button variant="outline" size="sm" className={group.tone}>
                {group.label} {group.items.length}건
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
    <section aria-label="거래 요약 지표" className="border-b py-3">
      <dl className="grid grid-cols-2 gap-x-3 gap-y-3">
        {metrics.map(({ label, value }) => (
          <div key={label} className="min-w-0">
            <dt className="text-[11px] text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-sm leading-5 font-semibold break-words tabular-nums">
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
const workPreviewFields: Record<DealWorkKey, string[]> = {
  documents: ["품목·수량·단가", "거래처·계약번호", "인코텀즈·지급조건"],
  fulfillment: ["계약·선적·잔여 수량", "B/L·선박·항구", "출항일·도착 예정일"],
  customs: ["수출입 신고서", "신고번호·신고일", "통관 진행 상태"],
  finance: ["송장·통화·지급조건", "받을 돈·줄 돈·적용액", "부대비용·거래손익"],
}
function DealWorkBlock({
  work,
  plan,
  previewOpen,
  onPreview,
  onStart,
  canWrite,
  children,
}: {
  work: DealWorkKey
  plan: DealWorkPlan
  previewOpen: boolean
  onPreview: (key: DealWorkKey) => void
  onStart: (key: DealWorkKey) => void
  canWrite: boolean
  children: ReactNode
}) {
  const state = plan.states[work]
  if (state !== "planned")
    return (
      <div
        data-work-section={work}
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
          <StatusBadge tone={state === "complete" ? "success" : "blue"}>
            {state === "complete"
              ? "완료"
              : plan.current === work
                ? "현재 할 일"
                : "진행 중"}
          </StatusBadge>
          {plan.current === work && (
            <p className="w-full text-xs font-normal text-muted-foreground">
              {plan.nextAction}
            </p>
          )}
        </div>
        {children}
      </div>
    )
  return (
    <section
      id={workIds[work]}
      data-work-section={work}
      data-work-state="planned"
      tabIndex={-1}
      className="scroll-mt-[calc(var(--deal-header-height,128px)+16px)] rounded-lg border bg-muted/20 p-4 outline-none"
    >
      <div className="flex items-center justify-between gap-3">
        <button
          className="flex min-h-9 flex-1 items-center gap-2 text-left text-sm font-semibold"
          aria-expanded={previewOpen}
          aria-controls={`planned-${work}`}
          onClick={() => onPreview(work)}
        >
          <ChevronDown
            className={cn(
              "size-4 transition-transform",
              previewOpen && "rotate-180"
            )}
          />
          {workLabels[work]}
          <StatusBadge>예정</StatusBadge>
          <span className="ml-auto text-xs font-normal text-primary">
            {previewOpen ? "접기" : "미리 보기"}
          </span>
        </button>
        {canWrite && (
          <Button size="sm" variant="outline" onClick={() => onStart(work)}>
            직접 입력
          </Button>
        )}
      </div>
      {previewOpen && (
        <div id={`planned-${work}`} className="mt-3 border-t pt-3">
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
        </div>
      )}
    </section>
  )
}

function DealDocumentPanels({
  plan,
  aiQuestion,
  workspaces,
  previewWork,
  onPreviewWork,
  onStartWork,
  canWrite,
  profile,
  documentStrip,
  primary,
  preview,
  documentOpen,
  onDocumentOpenChange,
  failedPanel,
  onRetry,
}: {
  plan: DealWorkPlan
  aiQuestion: ReactNode
  workspaces: Partial<Record<DealWorkKey, ReactNode>>
  previewWork: DealWorkKey[]
  onPreviewWork: (key: DealWorkKey) => void
  onStartWork: (key: DealWorkKey) => void
  canWrite: boolean
  profile: DealProfile
  documentStrip: ReactNode
  primary: ReactNode
  preview: ReactNode
  documentOpen: boolean
  onDocumentOpenChange: (open: boolean) => void
  failedPanel: Tab | null
  onRetry: () => void
}) {
  const workspaceRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [workspaceBounds, setWorkspaceBounds] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  })
  useEffect(() => {
    if (!documentOpen) return
    const main = workspaceRef.current?.closest<HTMLElement>(
      "[data-deal-scroll-viewport]"
    )
    const header = document.querySelector("[data-deal-sticky-header]")
    if (!main) return
    const measure = () => {
      const rect = main.getBoundingClientRect()
      const top = Math.max(
        rect.top,
        header?.getBoundingClientRect().bottom ?? rect.top
      )
      setWorkspaceBounds({
        left: rect.left,
        top,
        width: rect.width,
        height: Math.max(0, Math.min(window.innerHeight, rect.bottom) - top),
      })
    }
    const previousOverflow = main.style.overflowY
    main.style.overflowY = "hidden"
    measure()
    const returnFocus = editButtonRef.current
    const observer = new ResizeObserver(measure)
    observer.observe(main)
    if (header) observer.observe(header)
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", measure, true)
    closeRef.current?.focus({ preventScroll: true })
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", measure, true)
      main.style.overflowY = previousOverflow
      returnFocus?.focus({ preventScroll: true })
    }
  }, [documentOpen])
  const inlineRef = useRef<HTMLDivElement>(null)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const [inlineHeight, setInlineHeight] = useState(0)
  useEffect(() => {
    if (documentOpen || !inlineRef.current) return
    const observer = new ResizeObserver(([entry]) =>
      setInlineHeight(entry.contentRect.height)
    )
    observer.observe(inlineRef.current)
    return () => observer.disconnect()
  }, [documentOpen])
  return (
    <div ref={workspaceRef} className="space-y-5">
      <section
        id="deal-overview"
        tabIndex={-1}
        aria-label="거래 전체 정보"
        data-common-deal-information
        className="scroll-mt-[calc(var(--deal-header-height,128px)+16px)] space-y-4 outline-none"
      >
        <div className="rounded-lg border border-[var(--surface-border)] px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">AI 거래 요약</h2>
            {aiQuestion}
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {profile.counterparty} · {profile.title}.{" "}
            {plan.current
              ? `다음 작업: ${plan.nextAction}`
              : "거래 업무가 완료되었습니다."}
          </p>
        </div>
      </section>
      {plan.order.map((work) => (
        <DealWorkBlock
          key={work}
          work={work}
          plan={plan}
          previewOpen={previewWork.includes(work)}
          onPreview={onPreviewWork}
          onStart={onStartWork}
          canWrite={canWrite}
        >
          {work === "documents" ? (
            <section
              id="deal-documents"
              inert={documentOpen}
              aria-hidden={documentOpen || undefined}
              aria-label="거래 상세 정보"
              tabIndex={-1}
              className="min-w-0 scroll-mt-[calc(var(--deal-header-height,128px)+16px)] outline-none"
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
                  문서와 같이 보며 수정
                </Button>
              </div>
              {documentStrip}
              {failedPanel === "documents" ? (
                <PanelFailure title="상세" onRetry={onRetry} />
              ) : (
                <div
                  ref={inlineRef}
                  style={documentOpen ? { height: inlineHeight } : undefined}
                >
                  {!documentOpen && (
                    <PdfPanelWorkspaceCard>{primary}</PdfPanelWorkspaceCard>
                  )}
                </div>
              )}
            </section>
          ) : failedPanel === work ? (
            <PanelFailure title={workLabels[work]} onRetry={onRetry} />
          ) : (
            workspaces[work]
          )}
        </DealWorkBlock>
      ))}
      {documentOpen &&
        createPortal(
          <section
            role="dialog"
            aria-label="거래 상세 · 문서 대조"
            aria-describedby="deal-comparison-description"
            data-deal-comparison
            style={workspaceBounds}
            className="fixed z-40 flex min-w-0 flex-col overflow-hidden bg-background"
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
                  거래 상세 · 문서 대조
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
                거래로 돌아가기
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto xl:overflow-hidden">
              <ResponsivePdfPanelSplit
                label="거래 상세와 원본 문서 너비 조절"
                desktopHeight="100%"
                primary={primary}
                preview={
                  <div id="deal-document-preview" className="h-full min-h-0">
                    {preview}
                  </div>
                }
              />
            </div>
          </section>,
          document.body
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
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus data-icon="inline-start" />메모 추가
        </Button>
      </PopoverTrigger>
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
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editingNoteBody, setEditingNoteBody] = useState("")
  const [deletingNote, setDeletingNote] = useState<DealNoteItem | null>(null)
  const [activityHistoryOpen, setActivityHistoryOpen] = useState(false)

  return (
    <section>
      <div className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">메모</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              업무자 간 공유 메모
            </p>
          </div>
          <span className="text-xs text-muted-foreground">{notes.length}개</span>
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {notes.map((item) => (
            <div key={item.id} className="border-l-2 pl-3 text-sm">
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
                <>
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 flex-1 whitespace-pre-wrap">
                      {item.body}
                    </p>
                    <span className="flex shrink-0 items-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
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
                        variant="ghost"
                        size="icon-sm"
                        aria-label="노트 삭제"
                        onClick={() => setDeletingNote(item)}
                      >
                        <Trash2 />
                      </Button>
                    </span>
                  </div>
                  <small className="mt-1 block text-muted-foreground">
                    {item.actor} · {item.time}
                  </small>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-[var(--surface-border)] py-3">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-4 rounded-[var(--r-sm)] px-1 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          aria-expanded={activityHistoryOpen}
          onClick={() => setActivityHistoryOpen((open) => !open)}
        >
          <span>
            <strong className="block text-sm font-semibold">활동 이력</strong>
            <small className="mt-0.5 block text-xs font-normal text-muted-foreground">
              거래에서 수정된 모든 내역
            </small>
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            {activityHistoryOpen ? "접기" : "보기"}
            {activityHistoryOpen ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </span>
        </button>
        {activityHistoryOpen ? <AuditTrail items={audit} /> : null}
      </div>
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
    </section>
  )
}

const dealDocumentPreviews: Record<
  string,
  { title: string; fields: [string, string][] }
> = {
  PO: {
    title: "PURCHASE ORDER",
    fields: [
      ["Buyer", "ECOYA Demo Co."],
      ["Seller", "KATAMAN ASIA-PACIFIC PTE LTD"],
      ["Amount", "2,400,000 USD"],
      ["Incoterms", "CIF Incheon"],
    ],
  },
  SC: {
    title: "SALES CONTRACT",
    fields: [
      ["Contract No.", "SC-2026-0708"],
      ["Buyer", "ECOYA Demo Co."],
      ["Seller", "KATAMAN ASIA-PACIFIC PTE LTD"],
      ["Payment", "T/T 30 days"],
    ],
  },
  CI: {
    title: "COMMERCIAL INVOICE",
    fields: [
      ["Invoice No.", "INV-2026-0703"],
      ["Buyer", "HRM Corporation"],
      ["Amount", "2,566,000 USD"],
      ["Payment", "T/T 30 days"],
    ],
  },
  PL: {
    title: "PACKING LIST",
    fields: [
      ["Packing No.", "PL-2026-0707"],
      ["Quantity", "16 MT"],
      ["Packages", "20 bundles"],
      ["Gross Weight", "16,480 KG"],
    ],
  },
  CO: {
    title: "CERTIFICATE OF ORIGIN",
    fields: [
      ["Exporter", "KATAMAN ASIA-PACIFIC PTE LTD"],
      ["Country", "Singapore"],
      ["Goods", "Aluminium Scrap"],
      ["Reference", "CO-2026-0708"],
    ],
  },
  IC: {
    title: "CARGO INSURANCE",
    fields: [
      ["Insured", "ECOYA Demo Co."],
      ["Vessel", "HMM Green"],
      ["Coverage", "2,400,000 USD"],
      ["Policy", "IC-2026-0708"],
    ],
  },
  QC: {
    title: "INSPECTION REPORT",
    fields: [
      ["Inspector", "SGS Singapore"],
      ["Goods", "Aluminium Scrap"],
      ["Quantity", "16 MT"],
      ["Result", "Review required"],
    ],
  },
}

function DealPdf({
  slot,
  fieldSummary,
  canUnlink,
  onUnlink,
}: {
  slot: DocumentSlot
  fieldSummary: string
  canUnlink: boolean
  onUnlink: () => void
}) {
  const file = slot.file
  const preview = dealDocumentPreviews[slot.code] ?? dealDocumentPreviews.PO
  const [page, setPage] = useState(1)
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
    a.href = URL.createObjectURL(
      new Blob([`ECOYA sample document: ${file}`], { type: "application/pdf" })
    )
    a.download = file
    a.click()
    URL.revokeObjectURL(a.href)
    setDownloading(false)
  }
  return (
    <div
      className={cn(
        "relative mt-2 flex min-h-[480px] flex-col overflow-hidden bg-background",
        fullscreen && "fixed inset-0 z-[70] mt-0 h-screen min-h-0 bg-background"
      )}
      role={fullscreen ? "dialog" : undefined}
      aria-modal={fullscreen ? "true" : undefined}
      aria-label={fullscreen ? `${slot.type} 전체 화면 미리보기` : undefined}
    >
      <div className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-[var(--surface-border)] bg-background px-3 py-2">
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
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <StatusBadge
            tone={
              slot.status === "검토"
                ? "warning"
                : slot.status === "발행" || slot.status === "분석 중"
                  ? "blue"
                  : "success"
            }
          >
            {slot.status}
          </StatusBadge>
          {canUnlink ? (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={onUnlink}
            >
              <Link2 data-icon="inline-start" />
              거래 연결 해제
            </Button>
          ) : null}
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
      <PannablePdfViewport zoom={zoom} className="min-h-0 flex-1 px-4 pb-20">
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
          {preview.fields.map(([label, value]) => (
            <div
              key={label}
              className="grid grid-cols-[120px_1fr] border-b py-3 text-sm"
            >
              <span className="text-muted-foreground">{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </PannablePdfViewport>
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
}

function matchTone(match: DealFieldMatch) {
  if (match === "일치") return "success" as const
  if (match === "확인 필요") return "warning" as const
  if (match === "누락") return "danger" as const
  return "neutral" as const
}

const normalizeCandidateValue = (value: string) =>
  value.replaceAll(",", "").replaceAll(" ", "").toLowerCase()

function CandidateValuePicker({
  label,
  value,
  candidates,
  onSelect,
}: {
  label: string
  value: string
  candidates: DealFieldCandidate[]
  onSelect: (value: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 border-destructive/35 px-2 text-[11px] text-destructive hover:bg-destructive/5 hover:text-destructive"
        >
          문서별 값 {candidates.length}개
          <ChevronDown className="size-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[var(--z-popup)] w-80 max-w-[calc(100vw-2rem)] gap-0 p-1">
        <div className="border-b px-2.5 py-2">
          <strong className="text-xs">{label} 기준값 선택</strong>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            연결 문서에서 읽은 값 중 거래에 사용할 값을 고릅니다.
          </p>
        </div>
        <div className="max-h-64 overflow-y-auto py-1">
          {candidates.map((candidate) => {
            const selected =
              normalizeCandidateValue(candidate.value) ===
              normalizeCandidateValue(value)
            const differs = !selected
            return (
              <Button
                key={`${candidate.source}-${candidate.document}-${candidate.value}`}
                type="button"
                variant="ghost"
                className="grid h-auto w-full grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-2 rounded-sm px-2.5 py-2 text-left font-normal"
                onClick={() => {
                  onSelect(candidate.value)
                  setOpen(false)
                }}
              >
                <Badge
                  variant="secondary"
                  className="justify-center px-1 text-[10px]"
                >
                  {candidate.source}
                </Badge>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block text-xs font-medium",
                      differs && "text-destructive"
                    )}
                  >
                    {candidate.value}
                  </span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {candidate.document}
                  </span>
                </span>
                {selected ? (
                  <Check className="size-3.5 text-primary" />
                ) : (
                  <span className="text-[10px] text-destructive">다른 값</span>
                )}
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
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
}: {
  profile: DealProfile
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
}) {
  const [query, setQuery] = useState("")
  const editable = canMutate(role)
  const sections: (DealFieldGroup | "품목")[] = [
    "품목",
    "거래 기본",
    "상업 조건",
    "선적 정보",
    "결제 정보",
  ]
  const normalizedQuery = query.trim().toLowerCase()
  const fieldLabelOverrides: Partial<Record<string, string>> =
    profile.direction === "sales"
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
  const hiddenPartyKey = profile.direction === "sales" ? "seller" : "buyer"
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

  const itemAmount = (item: DealLineItem) => {
    const amount =
      Number(item.quantity.replaceAll(",", "")) *
      Number(item.unitPrice.replaceAll(",", ""))
    return Number.isFinite(amount) ? amount.toLocaleString("en-US") : "0"
  }

  const itemTable =
    !normalizedQuery || filteredItems.length ? (
      <section key="items" data-deal-items className="border-b pt-2 pb-5">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-base font-semibold">
            {directionLabels[profile.direction]} 품목
          </h4>
          {editable ? (
            <Button size="sm" variant="outline" onClick={onAddItem}>
              <Plus data-icon="inline-start" />
              품목 추가
            </Button>
          ) : null}
        </div>
        <div
          className="@container/items mt-3 max-w-full"
          role="region"
          aria-label="거래 품목 목록"
        >
          <table
            className="block w-full text-left text-xs"
            aria-label={`${directionLabels[profile.direction]} 품목`}
          >
              {filteredItems.map((item) => {
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
                      "h-10 px-2 py-0 text-xs",
                      !["goods", "hsCode"].includes(key) &&
                        "text-right tabular-nums",
                      key === "quantity" &&
                        item.match === "확인 필요" &&
                        "border-destructive/55 text-destructive"
                    )}
                    value={item[key]}
                    inputMode={
                      ["goods", "hsCode"].includes(key)
                        ? "text"
                        : key === "packageCount"
                          ? "numeric"
                          : "decimal"
                    }
                    disabled={!editable}
                    aria-invalid={
                      key === "quantity" && item.match === "확인 필요"
                    }
                    onChange={(event) =>
                      onItemChange(item.id, key, event.target.value)
                    }
                    onBlur={() =>
                      onItemCommit(
                        item.id,
                        key,
                        item[key],
                        `품목 ${number} · ${label}`
                      )
                    }
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
                      className="w-full gap-1 px-2 py-0 text-xs data-[size=sm]:h-10"
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
                return (
                  <tbody key={item.id} className="mb-3 block rounded-xl border bg-card p-3 last:mb-0 @min-[480px]/items:p-4">
                    <tr className="relative grid grid-cols-2 gap-x-3 gap-y-4 @min-[480px]/items:grid-cols-3 @min-[760px]/items:grid-cols-[minmax(0,2fr)_minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1.15fr)_32px] [&>td]:min-w-0">
                      <td className="col-span-2 pr-9 @min-[480px]/items:col-span-3 @min-[760px]/items:col-span-1 @min-[760px]/items:pr-0">
                        <FormFieldHeader className="mb-2" label={`품목 ${number} · 품목명`} htmlFor={`deal-item-${item.id}-goods`} badge={<StatusBadge tone={matchTone(item.match)}>{item.match === "확인 필요" ? "불일치" : item.match}</StatusBadge>} />
                        {input("goods", "품목명")}
                        <FormFieldMessage className="mt-2">{item.evidence.join(" · ")}</FormFieldMessage>
                      </td>
                      <td>
                        <div id={`deal-field-label-item-${item.id}-quantity`} className="scroll-mt-[calc(var(--deal-header-height,128px)+16px)]" data-quantity-heading>
                          <FormFieldHeader className="mb-2" label="수량 / 단위" htmlFor={`deal-field-item-${item.id}-quantity`}
                            badge={item.match === "확인 필요" ? <StatusBadge tone="warning">불일치</StatusBadge> : undefined}
                            candidates={editable &&
                          item.match === "확인 필요" &&
                          new Set(
                            (lineItemQuantityCandidates[item.id] ?? []).map(
                              (candidate) =>
                                normalizeCandidateValue(candidate.value)
                            )
                          ).size > 1 ? (
                            <div className="shrink-0">
                              <CandidateValuePicker
                                label={`품목 ${number} 수량`}
                                value={item.quantity}
                                candidates={lineItemQuantityCandidates[item.id]}
                                onSelect={(value) => {
                                  onItemChange(item.id, "quantity", value)
                                  onItemCommit(
                                    item.id,
                                    "quantity",
                                    value,
                                    `품목 ${number} · 수량`
                                  )
                                }}
                              />
                            </div>
                          ) : undefined}
                          />
                          <div className="grid grid-cols-[minmax(0,1fr)_56px] gap-1">
                            {input("quantity", "수량")}
                            {unit("quantityUnit", "수량 단위", ["MT", "KG", "EA"])}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div data-item-unit-price-heading className="scroll-mt-[calc(var(--deal-header-height,128px)+16px)]">
                          <FormFieldHeader className="mb-2" label={`단가 · ${item.currency}/${item.quantityUnit}`} htmlFor={`deal-item-${item.id}-unitPrice`} />
                        </div>
                        {input("unitPrice", "단가")}
                      </td>
                      <td>
                        <FormFieldHeader className="mb-2" label={`${directionLabels[profile.direction]} 금액`} />
                        <output aria-label={`품목 ${number} 금액`} className="flex min-h-8 items-center justify-end text-right font-semibold break-words tabular-nums">
                          {itemAmount(item)} {item.currency}
                        </output>
                      </td>
                      <td className="absolute top-0 right-0 text-right @min-[760px]/items:static @min-[760px]/items:pt-9">
                        {editable && items.length > 1 && (
                          <Button size="icon-sm" variant="ghost" aria-label={`품목 ${number} 삭제`} onClick={() => onRemoveItem(item.id)}>
                            <Trash2 />
                          </Button>
                        )}
                      </td>
                    </tr>
                    <tr className="mt-4 block border-t border-dashed pt-3">
                      <td colSpan={5} className="block">
                        <div className="grid grid-cols-2 gap-3 @min-[480px]/items:grid-cols-3 @min-[760px]/items:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,.65fr)] [&>div]:min-w-0">
                          <div className="order-1 @min-[480px]/items:order-none">
                            <FormFieldHeader className="mb-2" label="HS Code" htmlFor={`deal-item-${item.id}-hsCode`} />
                            {input("hsCode", "HS Code")}
                          </div>
                          <div className="order-3 col-span-2 @min-[480px]/items:order-none @min-[760px]/items:col-span-1">
                            <FormFieldHeader className="mb-2" label="포장 수 / 단위" htmlFor={`deal-item-${item.id}-packageCount`} />
                            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-1">
                              {input("packageCount", "포장 수")}
                              {unit("packageUnit", "포장 단위", [
                                "bundles",
                                "cartons",
                                "pallets",
                              ])}
                            </div>
                          </div>
                          <div className="order-4 @min-[480px]/items:order-none">
                            <FormFieldHeader className="mb-2" label="총중량" htmlFor={`deal-item-${item.id}-grossWeight`} />
                            {input("grossWeight", "총중량")}
                          </div>
                          <div className="order-5 @min-[480px]/items:order-none">
                            <FormFieldHeader className="mb-2" label="순중량" htmlFor={`deal-item-${item.id}-netWeight`} />
                            {input("netWeight", "순중량")}
                          </div>
                          <div className="order-2 @min-[480px]/items:order-none">
                            <FormFieldHeader className="mb-2" label="중량 단위" />
                            {unit("weightUnit", "중량 단위", [
                              "KG",
                              "MT",
                              "LB",
                            ])}
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                )
              })}
          </table>
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
        <h4 className="flex items-center gap-2 text-base font-semibold">
          {group === "결제 정보"
            ? profile.direction === "sales"
              ? "수금 정보"
              : "지급 정보"
            : group}
        </h4>
        <div className="mt-3 grid min-w-0 gap-4 @min-[640px]/fields:grid-cols-2">
          {groupFields.map((field) => (
            <FormField
              key={field.key}
              className="py-1"
              label={field.label}
              htmlFor={`deal-field-${field.key}`}
              id={`deal-field-label-${field.key}`}
              style={{ scrollMarginTop: "calc(var(--deal-header-height,128px) + 16px)" }}
              badge={<StatusBadge tone={matchTone(field.match)}>{field.match === "확인 필요" ? "불일치" : field.match}</StatusBadge>}
              message={field.evidence.join(" · ") || undefined}
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
              <Input
                className={cn(
                  "h-10",
                  field.match === "확인 필요" &&
                    "border-destructive/55 text-destructive focus-visible:ring-destructive/25"
                )}
                aria-describedby={field.evidence.length ? `deal-field-${field.key}-message` : undefined}
                id={`deal-field-${field.key}`}
                style={{
                  scrollMarginTop:
                    "calc(var(--deal-header-height,128px) + 16px)",
                }}
                type={field.inputType ?? "text"}
                value={field.value}
                disabled={!editable}
                placeholder={`${field.label} 입력`}
                aria-invalid={
                  field.match === "누락" || field.match === "확인 필요"
                }
                onChange={(event) =>
                  onFieldChange(field.key, event.target.value)
                }
                onBlur={() =>
                  onFieldCommit(field.key, field.value, field.label)
                }
              />
            </FormField>
          ))}
        </div>
      </section>
    )
  }
  return (
    <div className="@container/fields mt-4 min-w-0">
      <div className="flex items-center justify-between gap-3 border-b pb-3">
        <span className="text-xs text-muted-foreground">
          필드·품목 {directionalFields.length + items.length}개
        </span>
        <div className="flex items-center gap-2">
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
          section === "품목" ? itemTable : renderGroup(section)
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
  const [riskOpen, setRiskOpen] = useState(false)
  const [riskSaving, setRiskSaving] = useState(false)
  const [reason, setReason] = useState("within_tolerance")
  const [note, setNote] = useState("")
  const verificationIssues = dealReviewNotices(riskDismissed)
  const dismissRisk = async () => {
    if (riskSaving || (reason === "other" && !note.trim())) return
    setRiskSaving(true)
    try {
      await requireMutation(
        prototypeBackend.deals.dismissRisk({
          dealId,
          riskKey: "amount_quantity_mismatch",
          reason,
          note: note.trim() || undefined,
        }),
        "리스크를 허용 처리했습니다."
      )
      onRiskDismiss()
      addAudit("리스크 허용", reason === "other" ? note.trim() : reason)
      setRiskOpen(false)
    } finally {
      setRiskSaving(false)
    }
  }
  return (
    <DetailCard>
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
}: {
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
    ["규정", 82, "통관 서류 준비 중"],
  ] as const
  const rows = [
    ["거래처", "seller"],
    ["금액", "amount"],
    ["수량", "quantity"],
    ["총중량", "gross_weight"],
    ["인코텀즈", "incoterms"],
    ["지급조건", "payment"],
  ].map(([label, key]) => {
    const cells = documentSummary.documents.map((document) => {
      const field =
        document.file && document.status !== "분석 중"
          ? initialDocumentFields[document.code]?.fields.find(
              (field) => field.key === key && field.origin === "AI 추출"
            )
          : undefined
      return {
        document,
        value: field?.value ?? "",
        evidence: field?.evidence ?? "",
      }
    })
    const values = cells
      .filter((cell) => cell.value)
      .map((cell) => normalizeCandidateValue(cell.value))
    const comparable = values.length > 1
    const consistent = new Set(values).size === 1
    return {
      label,
      cells: cells.map((cell) => ({
        ...cell,
        status: !cell.document.file
          ? "문서 누락"
          : !cell.value || !comparable
            ? "대조 불가"
            : consistent
              ? "일치"
              : "불일치",
      })),
    }
  })
  const symbol = (status: string) =>
    status === "일치"
      ? "✓"
      : status === "불일치"
        ? "!"
        : status === "문서 누락"
          ? "×"
          : "—"
  const color = (status: string) =>
    status === "일치"
      ? "text-success"
      : status === "불일치"
        ? "text-warning-foreground"
        : status === "문서 누락"
          ? "text-destructive"
          : "text-muted-foreground"
  return (
    <section aria-label="거래 건강도와 서류 대조" className="px-4 py-4">
      <div className="flex items-end justify-between gap-3">
        <h4 className="text-sm font-semibold">거래 건강도</h4>
        <strong className="text-2xl font-semibold text-warning-foreground">
          72
        </strong>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
        {health.map(([label, score, detail]) => (
          <div key={label} className="min-w-0">
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="font-medium">{label}</span>
              <strong className="font-medium tabular-nums">{score}</strong>
            </div>
            <div
              role="meter"
              aria-label={label}
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-1.5 overflow-hidden rounded-full bg-muted"
            >
              <div
                className={cn(
                  "h-full",
                  score < 60
                    ? "bg-destructive"
                    : score < 75
                      ? "bg-warning"
                      : "bg-success"
                )}
                style={{ width: `${score}%` }}
              />
            </div>
            <p className="mt-1 text-xs leading-4 text-muted-foreground">
              {detail}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <div>
          <h4 className="text-xs font-semibold">서류 대조 · 5-Way</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            서류 {documentSummary.connected}/{documentSummary.total}건 연결
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setExpanded(true)}>
          전체 대조 보기
        </Button>
      </div>
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-h-[85dvh] overflow-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>서류 대조 · 5-Way</DialogTitle>
            <DialogDescription>
              연결 문서에서 추출한 값을 비교합니다. 근거가 없는 항목은 일치로
              판단하지 않습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead>
                <tr className="border-b">
                  <th className="p-2">항목</th>
                  {documentSummary.documents.map((document) => (
                    <th key={document.code} className="p-2">
                      {document.type}
                      <span className="block font-normal text-muted-foreground">
                        {document.code}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-b">
                    <th className="p-2 font-medium">{row.label}</th>
                    {row.cells.map((cell) => (
                      <td key={cell.document.code} className="p-2 align-top">
                        <span className={color(cell.status)}>
                          {symbol(cell.status)} {cell.status}
                        </span>
                        <span className="mt-1 block">{cell.value || "—"}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function DealDocumentBundleRail({
  availableDocuments,
  selected,
  expanded,
  onSelect,
}: {
  availableDocuments: DocumentSlot[]
  selected: DocumentSlot
  expanded: boolean
  onSelect: (document: DocumentSlot) => void
}) {
  const [filter, setFilter] = useState<"all" | "connected" | "missing">("all")
  const connectedCount = availableDocuments.filter(
    (document) => document.file
  ).length
  const missingCount = availableDocuments.length - connectedCount
  const filteredDocuments = availableDocuments.filter((document) => {
    if (filter === "connected" && !document.file) return false
    if (filter === "missing" && document.file) return false
    return true
  })

  if (!expanded) return null

  return (
    <div className="mt-2 overflow-hidden rounded-[var(--r-md)] border border-[var(--surface-border)]">
      <div className="bg-[var(--surface-muted-background)] p-2.5">
        <div className="flex items-center justify-end gap-1 px-1">
          {[
            ["all", `전체 ${availableDocuments.length}`],
            ["connected", `연결 ${connectedCount}`],
            ["missing", `미연결 ${missingCount}`],
          ].map(([value, label]) => (
            <Button
              key={value}
              variant={filter === value ? "secondary" : "ghost"}
              size="xs"
              onClick={() =>
                setFilter(value as "all" | "connected" | "missing")
              }
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="field-scrollbar mt-2 max-h-64 overflow-y-auto rounded-[var(--r-md)] ring-1 ring-[var(--table-border)]">
          <div className="sticky top-0 z-10 grid grid-cols-[38px_minmax(0,1fr)_90px] gap-2 border-b border-[var(--table-border)] bg-[var(--table-header-background)] px-2.5 py-2 text-[10px] font-medium text-muted-foreground">
            <span>종류</span>
            <span>파일</span>
            <span className="text-right">상태</span>
          </div>
          {filteredDocuments.length ? (
            filteredDocuments.map((document) => {
              const isSelected = selected.code === document.code
              return (
                <Button
                  key={document.code}
                  variant="ghost"
                  className={cn(
                    "grid h-auto w-full grid-cols-[38px_minmax(0,1fr)_90px] items-center gap-2 rounded-none border-b border-[var(--table-border)] px-2.5 py-2 text-left font-normal text-foreground last:border-b-0 hover:text-foreground",
                    isSelected && "bg-accent"
                  )}
                  onClick={() => {
                    onSelect(document)
                  }}
                >
                  <Badge
                    variant="secondary"
                    className="justify-center px-1 text-[10px]"
                  >
                    {document.code}
                  </Badge>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium">
                      {document.file || `${document.type} 미연결`}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-muted-foreground">
                      {document.type}
                    </span>
                  </span>
                  <span className="flex items-center justify-end gap-1.5">
                    <StatusBadge
                      tone={
                        document.status === "미비"
                          ? "warning"
                          : document.status === "발행"
                            ? "blue"
                            : document.status === "검토"
                              ? "warning"
                              : "success"
                      }
                    >
                      {document.status}
                    </StatusBadge>
                    {isSelected ? (
                      <Check className="size-3.5 shrink-0 text-primary" />
                    ) : null}
                  </span>
                </Button>
              )
            })
          ) : (
            <p className="px-3 py-8 text-center text-xs text-muted-foreground">
              해당 상태의 기타 서류가 없습니다.
            </p>
          )}
        </div>
      </div>
    </div>
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
  aiQuestion,
  workspaces,
  previewWork,
  onPreviewWork,
  onStartWork,
  dealId,
  profile,
  role,
  addAudit,
  onUpload,
  visibleGroups,
  onMissingFieldsChange,
  onMainInformationChange,
  onDocumentSummaryChange,
  documentOpen,
  onDocumentOpenChange,
  failedPanel,
  onRetry,
}: {
  plan: DealWorkPlan
  aiQuestion: ReactNode
  workspaces: Partial<Record<DealWorkKey, ReactNode>>
  previewWork: DealWorkKey[]
  onPreviewWork: (key: DealWorkKey) => void
  onStartWork: (key: DealWorkKey) => void
  dealId: string
  profile: DealProfile
  role: Role
  addAudit: (action: string, detail: string) => void
  onUpload: () => void
  visibleGroups: DealFieldGroup[]
  onMissingFieldsChange: (fields: DealMissingField[]) => void
  onMainInformationChange: (
    info: Pick<DealProfile, "counterparty" | "amount" | "currency">
  ) => void
  onDocumentSummaryChange: (summary: DealDocumentSummary) => void
  documentOpen: boolean
  onDocumentOpenChange: (open: boolean) => void
  failedPanel: Tab | null
  onRetry: () => void
}) {
  const primaryDocumentCode = profile.direction === "sales" ? "SC" : "PO"
  const orderedImportantDocuments = useMemo(
    () =>
      [...documents].sort((left, right) => {
        if (left.code === primaryDocumentCode) return -1
        if (right.code === primaryDocumentCode) return 1
        return 0
      }),
    [primaryDocumentCode]
  )
  const [selected, setSelected] = useState(
    documents.find((document) => document.code === primaryDocumentCode) ??
      documents[0]
  )
  const [dealFields, setDealFields] = useState(() =>
    initialDealFields.map((field) => ({
      ...field,
      value:
        (field.key === "seller" && profile.direction === "purchase") ||
        (field.key === "buyer" && profile.direction === "sales")
          ? profile.counterparty
          : field.key === "amount_total"
            ? profile.amount
            : field.key === "currency"
              ? profile.currency
              : field.value,
    }))
  )
  const mainInformation = useMemo(
    () => ({
      counterparty:
        dealFields.find(
          (field) =>
            field.key === (profile.direction === "sales" ? "buyer" : "seller")
        )?.value ?? profile.counterparty,
      amount:
        dealFields.find((field) => field.key === "amount_total")?.value ??
        profile.amount,
      currency:
        dealFields.find((field) => field.key === "currency")?.value ??
        profile.currency,
    }),
    [
      dealFields,
      profile.direction,
      profile.counterparty,
      profile.amount,
      profile.currency,
    ]
  )
  useEffect(() => {
    onMainInformationChange(mainInformation)
  }, [mainInformation, onMainInformationChange])
  const [lineItems, setLineItems] = useState(initialDealLineItems)
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
  const [supplementaryDocumentsExpanded, setSupplementaryDocumentsExpanded] =
    useState(false)
  const [missingDocumentPrompt, setMissingDocumentPrompt] =
    useState<DocumentSlot | null>(null)
  const [confirmUnlink, setConfirmUnlink] = useState(false)
  const visibleImportantDocuments = useMemo(
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
        return unlinked.includes(item.code)
          ? { ...item, file: "", status: "미비", source: "-" }
          : item
      }),
    [orderedImportantDocuments, linkedDocuments, unlinked]
  )
  const visibleSupplementaryDocuments = supplementaryDocuments.filter(
    (item) => !unlinked.includes(item.code)
  )
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
  const selectableDocuments = [
    ...visibleImportantDocuments.filter((item) => item.file),
    ...visibleSupplementaryDocuments,
  ]
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
  const recordCommittedEdit = (target: string, finalValue: string) => {
    const session = editSessionsRef.current.get(target)
    if (!session || session.before === finalValue) {
      editSessionsRef.current.delete(target)
      return
    }
    addAudit(
      `${session.label} 수정`,
      `이전 값 ${session.before || "—"} → 변경 값 ${finalValue || "—"}`
    )
    editSessionsRef.current.delete(target)
  }
  const flushPendingEdits = async (targets?: string[]): Promise<boolean> => {
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
              }),
            }))
          ),
          new Promise<void>((resolve) => window.setTimeout(resolve, 800)),
        ])

        let failed = false
        for (const { edit, result } of results) {
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
        setSaveState("error")
        return false
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
  const retryPendingEdits = async () => {
    const saved = await flushPendingEdits()
    if (!saved) return
    for (const target of [...editSessionsRef.current.keys()]) {
      recordCommittedEdit(target, readTargetValue(target))
    }
  }
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
    await requireMutation(
      prototypeBackend.deals.createDocument({
        dealId,
        documentCode: code,
        method: "file",
        fileName: file.name,
      }),
      "문서를 거래에 추가했습니다."
    )
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
  }
  return (
    <div className="min-w-0">
      <DealDocumentPanels
        aiQuestion={aiQuestion}
        plan={plan}
        workspaces={workspaces}
        previewWork={previewWork}
        onPreviewWork={onPreviewWork}
        onStartWork={onStartWork}
        canWrite={canMutate(role)}
        profile={profile}
        documentStrip={
          <div
            aria-label="거래 상세 서류 목록"
            className="mb-4 flex flex-wrap items-center gap-1 border-b pb-3"
          >
            {visibleImportantDocuments.map((document) => (
              <button
                key={document.code}
                type="button"
                aria-label={`${document.type} ${document.file ? "보유" : "미비"}`}
                aria-pressed={selected.code === document.code}
                className={cn(
                  "flex min-h-8 items-center gap-1.5 rounded-md px-2 text-xs",
                  selected.code === document.code
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
                onClick={() => {
                  setSelected(document)
                  setDocumentsExpanded(false)
                  setSupplementaryDocumentsExpanded(false)
                  onDocumentOpenChange(true)
                }}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    document.file ? "bg-success" : "bg-warning"
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
                setDocumentsExpanded(false)
                setSupplementaryDocumentsExpanded(true)
                onDocumentOpenChange(true)
              }}
            >
              <span className="size-1.5 rounded-full bg-muted-foreground/60" />
              기타 서류 {visibleSupplementaryDocuments.length}건
            </button>
          </div>
        }
        documentOpen={documentOpen}
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
            <SectionHeading
              title={`${directionLabels[profile.direction]} 거래 상세`}
              action={
                canMutate(role) ? (
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
                ) : (
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
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="flex shrink-0 items-center gap-1.5 rounded-[var(--r-sm)] px-1 py-1 text-left focus-visible:[box-shadow:var(--shadow-keyboard-focus)] focus-visible:outline-none"
                  aria-expanded={documentsExpanded}
                  onClick={() => {
                    setDocumentsExpanded((value) => !value)
                    setSupplementaryDocumentsExpanded(false)
                  }}
                >
                  <h3 className="text-base font-semibold">거래 서류</h3>
                  <StatusBadge tone="neutral">
                    전체 {totalDocumentCount}건
                  </StatusBadge>
                  {documentsExpanded ? (
                    <ChevronUp className="size-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  )}
                </button>
                <div
                  className="flex w-full min-w-0 items-center gap-1 overflow-x-auto"
                  aria-label="중요 서류 요약"
                >
                  {visibleImportantDocuments.map((document) => {
                    const isMissing = !document.file
                    const isSelected = selected.code === document.code
                    return (
                      <button
                        key={document.code}
                        type="button"
                        className={cn(
                          "flex h-7 shrink-0 items-center gap-1 rounded-[var(--r-sm)] px-2 text-[10px] font-medium whitespace-nowrap transition-colors focus-visible:[box-shadow:var(--shadow-keyboard-focus)] focus-visible:outline-none",
                          isSelected
                            ? "bg-[var(--control-selected-soft-background)] text-primary"
                            : "text-muted-foreground hover:bg-[var(--surface-muted-background)] hover:text-foreground"
                        )}
                        onClick={() => {
                          setDocumentsExpanded(false)
                          setSupplementaryDocumentsExpanded(false)
                          if (isMissing) {
                            requestDocumentUpload(document)
                          } else {
                            setSelected(document)
                          }
                        }}
                        aria-label={`${document.type} ${isMissing ? "미비" : "보유"}`}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            isMissing ? "bg-warning" : "bg-success"
                          )}
                        />
                        <span>{document.type}</span>
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    className={cn(
                      "flex h-7 shrink-0 items-center gap-1 rounded-[var(--r-sm)] px-2 text-[10px] font-medium transition-colors focus-visible:[box-shadow:var(--shadow-keyboard-focus)] focus-visible:outline-none",
                      documentsExpanded || supplementaryDocumentsExpanded
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    aria-pressed={
                      documentsExpanded || supplementaryDocumentsExpanded
                    }
                    onClick={() => {
                      setDocumentsExpanded(false)
                      setSupplementaryDocumentsExpanded((value) =>
                        documentsExpanded ? true : !value
                      )
                    }}
                  >
                    <span className="size-1.5 rounded-full bg-muted-foreground/60" />
                    기타 서류 {visibleSupplementaryDocuments.length}건
                  </button>
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
            {documentsExpanded || supplementaryDocumentsExpanded ? (
              <div className="pb-2">
                {documentsExpanded ? (
                  <>
                    <div className="mt-3 flex items-center justify-between px-1">
                      <h4 className="text-xs font-semibold">중요 서류</h4>
                      <span className="text-[10px] text-muted-foreground">
                        거래 진행에 필요한 기준 서류
                      </span>
                    </div>
                    <ImportantDealDocumentsPanel
                      importantDocuments={visibleImportantDocuments}
                      selected={selected}
                      onSelect={(document) => {
                        setSelected(document)
                        setDocumentsExpanded(false)
                        setSupplementaryDocumentsExpanded(false)
                      }}
                      onUpload={requestDocumentUpload}
                    />
                  </>
                ) : null}
                <div className="mt-3 flex items-center justify-between px-1">
                  <h4 className="text-xs font-semibold">기타 서류</h4>
                  <span className="text-[10px] text-muted-foreground">
                    {visibleSupplementaryDocuments.length}건
                  </span>
                </div>
                <DealDocumentBundleRail
                  availableDocuments={visibleSupplementaryDocuments}
                  selected={selected}
                  expanded
                  onSelect={(document) => {
                    setSelected(document)
                    setDocumentsExpanded(false)
                    setSupplementaryDocumentsExpanded(false)
                  }}
                />
              </div>
            ) : null}
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
                                ? "warning"
                                : "success"
                    }
                  >
                    {selected.status}
                  </StatusBadge>
                  {selected.file && canMutate(role) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => setConfirmUnlink(true)}
                    >
                      <Link2 data-icon="inline-start" />
                      거래 연결 해제
                    </Button>
                  ) : null}
                </div>
              ) : null}
              {selected.file ? (
                <DealPdf
                  key={selected.code}
                  slot={selected}
                  fieldSummary={
                    selectedFieldSet
                      ? `${selectedFieldSet.fields.length}/${selectedFieldSet.total} 필드`
                      : "필드 분석 중"
                  }
                  canUnlink={canMutate(role)}
                  onUnlink={() => setConfirmUnlink(true)}
                />
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
            await requireMutation(
              prototypeBackend.deals.unlinkDocument({
                dealId,
                documentId: selected.file || selected.code,
              }),
              "문서 연결을 해제했습니다."
            )
            setUnlinked((items) => [...items, selected.code])
            addAudit("문서 연결 해제", selected.file)
            setConfirmUnlink(false)
            const next = selectableDocuments.find(
              (item) => item.code !== selected.code
            )
            if (next) setSelected(next)
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
  const [lifecycle, setLifecycle] = useState<OrderState>(() => dealFixtures.find((deal) => deal.id === dealId)?.orderLifecycle ?? "open")
  const [action, setAction] = useState<OrderAction>(null)
  const [reason, setReason] = useState("")
  const [orderHistoryOpen, setOrderHistoryOpen] = useState(false)
  const [orderEvents, setOrderEvents] = useState<AuditItem[]>([
    {
      id: 1,
      action: "가격 수정",
      detail: "USD 120,000/MT",
      actor: "조민영",
      time: "07.09 14:20",
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
      status: "출항",
      tone: "blue" as const,
    },
    {
      id: "014W-02",
      carrier: "ONE Harmony",
      route: "Melbourne → Busan",
      startDay: 7,
      duration: 15,
      status: "부킹",
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
    if (!action) return
    await requireMutation(
      prototypeBackend.deals.orderAction({
        dealId,
        action,
        reason: reason.trim() || undefined,
      }),
      "주문 상태를 변경했습니다."
    )
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
        time: "방금",
      },
      ...items,
    ])
    setAction(null)
    setReason("")
  }
  return (
    <>
      <div className="flex flex-col gap-4">
        <DetailCard>
          <div className="flex flex-col gap-7">
            <section>
              <SectionHeading
                title="주문 이행"
                description="계약 20MT · 누적 선적 16MT"
                action={
                  <div className="flex flex-wrap items-center gap-2">
                    <DealContractTool />
                    <StatusBadge tone={terminal ? "success" : "warning"}>
                      {labels[lifecycle]}
                    </StatusBadge>
                  </div>
                }
              />
              <div className="mt-5 grid items-center gap-5 md:grid-cols-[1fr_auto]">
                <div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[80%] bg-primary" />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>누적 16 MT</span>
                    <span>
                      {terminal ? "마감 상태 · 잔량 경고 제외" : "잔여 4 MT"}
                    </span>
                  </div>
                </div>
                {canMutate(role) ? (
                  <div className="flex flex-wrap gap-2">
                    {terminal ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAction("reopen")}
                      >
                        <RotateCcw data-icon="inline-start" />
                        재오픈
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAction("close")}
                        >
                          완료 마감
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAction("short_close")}
                        >
                          미달 마감
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={onEditUnitPrice}
                        >
                          단가 수정
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setAction("cancel")}
                        >
                          취소
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Owner 또는 관리자만 주문 상태를 변경할 수 있습니다.
                  </span>
                )}
              </div>
            </section>
            {orderEvents.length ? (
              <>
                <Separator />
                <section>
                  <SectionHeading
                    title="주문 이력"
                    action={
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-expanded={orderHistoryOpen}
                        onClick={() => setOrderHistoryOpen((open) => !open)}
                      >
                        {orderHistoryOpen ? "접기" : "보기"}
                        {orderHistoryOpen ? (
                          <ChevronUp data-icon="inline-end" />
                        ) : (
                          <ChevronDown data-icon="inline-end" />
                        )}
                      </Button>
                    }
                  />
                  {orderHistoryOpen ? <AuditTrail items={orderEvents} /> : null}
                </section>
              </>
            ) : null}
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
                    size="sm"
                    variant="outline"
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
                      data-icon="inline-start"
                      className={cn(refreshing && "animate-spin")}
                    />
                    {refreshing ? "갱신 중" : "새로고침"}
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
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                          <div className="min-w-0 flex-1 basis-40">
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
                                  size="icon-sm"
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
                                  size="icon-sm"
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
                title="연락처"
                description="기존 연락처를 검색하거나 새 연락처를 만들어 연결합니다."
                action={
                  canMutate(role) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setContactOpen(true)}
                    >
                      <UserPlus data-icon="inline-start" />
                      연락처 연결
                    </Button>
                  ) : null
                }
              />
              <div className="mt-3 grid gap-x-6 sm:grid-cols-2">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex min-w-0 items-center justify-between gap-3 border-b border-[var(--surface-border)] py-3"
                  >
                    <span className="min-w-0">
                      <StatusBadge tone="blue">{contact.role}</StatusBadge>
                      <strong className="mt-2 block truncate text-sm">
                        {contact.name}
                      </strong>
                      <small className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {contact.company}
                      </small>
                    </span>
                    {canMutate(role) ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
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
  focusTarget,
  onBack,
  onAskAi,
  generatedDocuments,
  documentTemplates,
  onCreateDocument,
  onUpload,
  onDeliver,
  onOpenSettlement,
  workspaceActionsTarget,
}: {
  dealId: string
  focusTarget?: NotificationDealTarget | null
  onBack: () => void
  onAskAi: () => void
  generatedDocuments: readonly GeneratedDealDocumentSummary[]
  documentTemplates: readonly DocumentTemplateOption[]
  onCreateDocument: (templateCode: string) => void
  onUpload: () => void
  onDeliver: (documentNumber: string, attachmentNames: string[]) => void
  onOpenSettlement: () => void
  workspaceActionsTarget?: HTMLElement | null
}) {
  const createdProfile = prototypeBackend.deals.getCreated(dealId)
  const fixture = dealFixtures.find((deal) => deal.id === dealId)
  const exists = Boolean(dealProfiles[dealId] || createdProfile || fixture)
  const profile =
    dealProfiles[dealId] ?? createdProfile ?? (fixture ? { ...fixture, direction: "purchase" as const } : dealProfiles["DL-260708-01"])
  const settled = fixture?.stage === "settled"
  const [mainInformation, setMainInformation] =
    useState<Pick<DealProfile, "counterparty" | "amount" | "currency">>(profile)
  const [documentSummary, setDocumentSummary] = useState<DealDocumentSummary>({
    connected: documents.filter((document) => document.file).length,
    total: documents.length,
    documents,
  })
  const [shipmentSummary, setShipmentSummary] =
    useState<DealShipmentSummary | null>(null)
  const [role, setRole] = useState<Role>("owner")
  const [activeSection, setActiveSection] = useState<Tab>(
    focusTarget?.tab ?? stageEntryTab(dealId)
  )
  const [documentOpen, setDocumentOpen] = useState(false)
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
  const plan = useMemo(
    () =>
      getDealWorkPlan(
        dealId,
        [
          ...startedWork,
          ...(earlyGroups.includes("선적 정보")
            ? ["fulfillment" as const]
            : []),
          ...(earlyGroups.includes("결제 정보") ? ["finance" as const] : []),
        ],
        preferredWork
      ),
    [dealId, startedWork, earlyGroups, preferredWork]
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
  const openFieldGroup = (group: DealFieldGroup) => {
    setDocumentOpen(false)
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
  const [deleted, setDeleted] = useState(false)
  const [failedPanel, setFailedPanel] = useState<Tab | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [notes, setNotes] = useState<DealNoteItem[]>([
    {
      id: 1,
      body: "7월 15일까지 B/L 원본 요청",
      actor: "조민영",
      time: "2026.07.13",
    },
    {
      id: 2,
      body: "잔금 지급 전 계좌 변경 여부 재확인",
      actor: "조민영",
      time: "2026.07.13",
    },
  ])
  const [riskDismissed, setRiskDismissed] = useState(false)
  const [verificationOpen, setVerificationOpen] = useState(false)
  const [reviewFocusId, setReviewFocusId] =
    useState<DealReviewNotice["id"]>("account_change")
  const [audit, setAudit] = useState<AuditItem[]>([
    {
      id: 1,
      action: "거래 생성",
      detail: "SC-2026-0708 Confirm에서 자동 생성",
      actor: "시스템",
      time: "07.08 09:12",
    },
    {
      id: 2,
      action: "담당자 지정",
      detail: "조민영",
      actor: "박서윤",
      time: "07.08 09:20",
    },
  ])
  const openMissingField = (key: string) => {
    setDocumentOpen(false)
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
    setDocumentOpen(false)
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
  const navigateSection = (value: Tab) => {
    setDocumentOpen(false)
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
      if (focusTarget.tab === "documents") setDocumentOpen(true)
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
  }, [dealId, focusTarget])
  const addAudit = (action: string, detail: string) =>
    setAudit((items) => [
      {
        id: Date.now(),
        action,
        detail,
        actor:
          role === "member" ? "김도현" : role === "admin" ? "박서윤" : "조민영",
        time: "방금 전",
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
        time: "방금",
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
  const showFeedback = (message: string) => {
    toast.info(message)
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
    try {
      await requireMutation(
        prototypeBackend.deals.updateIdentity({
          dealId,
          nextDealId: dealIdCandidate,
          title: dealTitleCandidate,
        }),
        "거래 기본정보를 저장했습니다."
      )
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
    } finally {
      setSavingDealId(false)
    }
  }
  if (!exists)
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
  if (deleted)
    return (
      <div className="grid h-full place-items-center bg-background">
        <div className="text-center">
          <Check className="mx-auto size-8 text-success" />
          <h1 className="mt-4 text-xl font-semibold">거래가 삭제되었습니다</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            연결 문서는 삭제되지 않고 미배정 문서로 돌아갔습니다.
          </p>
          <Button className="mt-4" onClick={onBack}>
            거래 목록으로
          </Button>
        </div>
      </div>
    )
  return (
    <div
      ref={scrollViewportRef}
      data-deal-scroll-viewport
      className="field-scrollbar h-full [scrollbar-gutter:stable] overflow-y-auto bg-background"
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
        <div className="min-w-0">
          <div
            ref={stickyHeaderRef}
            data-deal-sticky-header
            className="sticky top-0 z-30 bg-[var(--surface-background)] shadow-[0_1px_0_var(--surface-border)]"
          >
            <div className="flex min-h-14 flex-wrap items-center gap-2 px-3 py-2 sm:px-4 xl:px-6">
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
                className="mr-auto min-w-0"
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
                  <StatusBadge tone="blue">
                    {{ contract: "계약", shipment: "선적", customs: "통관", settlement: "정산 중", settled: "정산 완료" }[fixture?.stage ?? "contract"]}
                  </StatusBadge>
                  {fixture && fixture.orderLifecycle !== "open" && <StatusBadge tone={fixture.orderLifecycle === "closed" ? "success" : "neutral"}>
                    {fixture.orderLifecycle === "closed" ? "종결" : fixture.orderLifecycle === "cancelled" ? "취소" : "주문 미확인"}
                  </StatusBadge>}
                  <StatusBadge
                    tone={profile.direction === "sales" ? "success" : "blue"}
                  >
                    {directionLabels[profile.direction]}
                  </StatusBadge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto rounded-full p-0"
                    onClick={() => navigateSection("verification")}
                    aria-label="리스크 개요 보기"
                  >
                    <StatusBadge tone="danger">리스크 2</StatusBadge>
                  </Button>
                </div>
                <div className="mt-0.5 flex min-w-0 items-center gap-2">
                  {editingDealId ? (
                    <Input
                      className="h-7 w-[min(320px,46vw)] text-xs"
                      value={dealTitleDraft}
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
                    onClick={() => {
                      setRefreshing(true)
                      window.setTimeout(() => setRefreshing(false), 700)
                    }}
                  >
                    <RefreshCw
                      className={cn("size-3", refreshing && "animate-spin")}
                    />
                    {refreshing ? "갱신 중" : "09:30 기준"}
                  </Button>
                </div>
              </form>
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
              >
                <FilePlus2 data-icon="inline-start" />이 거래로 문서 올리기
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
                  >
                    <FilePlus2 data-icon="inline-start" />이 거래로 문서 만들기
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
                    문서 고객 전달
                    <span className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-white/15 px-1.5 text-[11px] text-white">
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
                    <MoreVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="flex items-center justify-between gap-3">
                    <span>화면 권한 미리보기</span>
                    <span className="font-normal text-muted-foreground">
                      {roleLabels[role]}
                    </span>
                  </DropdownMenuLabel>
                  {(Object.entries(roleLabels) as Array<[Role, string]>).map(
                    ([value, label]) => (
                      <DropdownMenuItem
                        key={value}
                        onClick={() => setRole(value)}
                      >
                        <span className="flex size-4 items-center justify-center">
                          {role === value ? (
                            <Check className="size-3.5" />
                          ) : null}
                        </span>
                        {label}
                      </DropdownMenuItem>
                    )
                  )}
                  <DropdownMenuSeparator />
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
                      variant="destructive"
                      disabled={settled}
                      onClick={() => setDialog("delete")}
                    >
                      <Trash2 />
                      {settled ? "정산 완료 거래 삭제 불가" : "거래 삭제"}
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
            className="bg-background px-4 py-3 sm:px-6 xl:px-8"
          >
            <DealAssistBar
              notices={dealReviewNotices(riskDismissed)}
              missingFields={missingFields}
              onOpenMissingField={openMissingField}
              onOpenVerification={openReviewNotice}
            />
          </section>
          <div className="w-full px-4 py-4 sm:px-6 xl:px-8">
            <div
              inert={documentOpen}
              aria-hidden={documentOpen || undefined}
              className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_320px]"
            >
              <div data-deal-page-content className="min-w-0 space-y-6">
                <DocumentsTab
                  aiQuestion={<DealAiQuestion onAskAi={onAskAi} />}
                  key={dealId}
                  plan={plan}
                  previewWork={previewWork}
                  onPreviewWork={previewSection}
                  onStartWork={startWork}
                  workspaces={{
                    fulfillment: (
                      <section
                        id="deal-fulfillment"
                        tabIndex={-1}
                        className="min-w-0 scroll-mt-[calc(var(--deal-header-height,128px)+16px)] outline-none"
                      >
                        <FulfillmentTab
                          shipmentContent={<ReferenceOperations screen="deal-shipments" dealId={dealId} onShipmentSummary={setShipmentSummary} />}
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
                        className="scroll-mt-[calc(var(--deal-header-height,128px)+16px)] rounded-lg border p-5 outline-none"
                      >
                        <h2 className="text-base font-semibold">
                          통관 문서 확인
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                          수출입 신고서를 거래에 연결하고 문서의
                          신고번호·신고일·품목 정보를 확인합니다.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setDocumentOpen(true)}
                          >
                            거래 서류 확인
                          </Button>
                          {canMutate(role) && (
                            <Button onClick={onUpload}>
                              이 거래로 통관 서류 올리기
                            </Button>
                          )}
                        </div>
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
                  onMainInformationChange={setMainInformation}
                  onDocumentSummaryChange={setDocumentSummary}
                  documentOpen={documentOpen}
                  onDocumentOpenChange={setDocumentOpen}
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
                  className="scroll-mt-[calc(var(--deal-header-height,128px)+16px)] rounded-lg border bg-background p-4"
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
              <aside
                aria-label="거래 현황"
                data-deal-information-aside
                ref={informationRailRef}
                className="min-w-0 rounded-xl border border-[var(--surface-border)] bg-background shadow-sm xl:sticky xl:top-[var(--deal-rail-sticky-top,144px)] [&_a]:underline-offset-4 [&_a:hover]:underline"
              >
                <div className="divide-y divide-[var(--surface-border)]">
                  <section
                    aria-label="주요 거래 정보"
                    className="space-y-2 px-4 py-3"
                  >
                    <p className="text-sm font-medium break-words">{mainInformation.counterparty}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusBadge tone="blue">
                        {directionLabels[profile.direction]}
                      </StatusBadge>
                    </div>
                    <div className="rounded-md bg-primary/5 p-2">
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
                  />
                  <DealHealthReference documentSummary={documentSummary} />
                </div>
              </aside>
            </div>
          </div>
        </div>
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
                dealId={currentDealId}
                role={role}
                addAudit={addAudit}
                onOpenDocuments={() => {
                  setVerificationOpen(false)
                  setDocumentOpen(true)
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
      </DealHandoffProvider>
      {workspaceActionsTarget
        ? createPortal(
            <>
              <SimpleSelect
                className="h-8 w-auto min-w-28"
                value={assignee}
                disabled={!canMutate(role)}
                ariaLabel="거래 담당자"
                onValueChange={async (next) => {
                  showFeedback("담당자 저장 중…")
                  try {
                    await requireMutation(
                      prototypeBackend.deals.setAssignee({
                        dealId: currentDealId,
                        assigneeId: next === "미배정" ? null : next,
                      }),
                      "담당자를 저장했습니다."
                    )
                    setAssignee(next)
                    addAudit("담당자 변경", next)
                  } finally {
                    showFeedback("")
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
            await requireMutation(
              prototypeBackend.deals.createFlag({
                dealId: currentDealId,
                type: issueType,
                note: issueNote.trim(),
              }),
              "이슈를 등록했습니다."
            )
            addAudit("이슈 플래그", `${issueType} · ${issueNote.trim()}`)
            setDialog(null)
            setIssueNote("")
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
      {dialog === "delete" ? (
        <ActionDialog
          title="거래 삭제"
          description="연결 문서는 삭제되지 않고 미배정 문서로 돌아갑니다. 거래의 대조·정산·공유 정보는 더 이상 표시되지 않습니다."
          confirmLabel="거래 삭제"
          destructive
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await requireMutation(
              prototypeBackend.deals.archive(currentDealId),
              "거래를 삭제했습니다."
            )
            setDeleted(true)
            setDialog(null)
          }}
        />
      ) : null}
    </div>
  )
}

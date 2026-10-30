import { BusinessFilterBar, BusinessListToolbar, BusinessFilterSearch, BusinessFilterSelect } from "@/components/platform/SearchFilterBar"
import { ViewSeatAction } from "@trade-os/components/ViewSeatGate"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/Empty"
import {
  getDealWorkPlan,
  workLabels,
  type DealWorkKey,
} from "@trade-os/lib/dealWorkflow"
import { DealsFinanceTable } from "@trade-os/deals/DealsFinanceTable"
import {
  filteredFinanceFacts,
  defaultFinanceFilters,
  csvCell,
  orderProgress,
  referenceAmount,
} from "@trade-os/lib/dealFinanceWorkspace"
import { exactFinanceMoney, presentFinanceFact } from "@trade-os/lib/erpFinance"
import { decimalMagnitude, FINANCE_DECIMAL_SCALE } from "@trade-os/lib/financeDecimal"
import { useMemo, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import {
  Archive,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  FileText,
  GitBranch,
  Info,
  Download,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Ship,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from "lucide-react"

import { TablePagination } from "@/components/ui/TablePagination"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog"
import { Button } from "@/components/ui/Button"
import { HeroBanner, heroOutlineButtonClass } from "@/components/platform/HeroBanner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"
import { Input } from "@/components/ui/Input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover"
import { Card, CardContent } from "@/components/ui/Card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs"
import { cn } from "@/lib/utils"
import { StatusBadge } from "@/components/platform/StatusBadge"
import { DatePicker } from "@/components/ui/DatePicker"
import { prototypeBackend } from "@trade-os/lib/prototypeBackend"

import {
  dealCreatedAt,
  deals,
  type Deal,
  type DealStage,
  type DealRisk,
} from "@trade-os/lib/prototypeDeals"

type DealsRole = "owner" | "admin" | "member"

function dDayBasisLabel(basis: Deal["dDayBasis"]) {
  switch (basis) {
    case "payment": return "결제"
    case "eta": return "ETA"
    case "etd": return "ETD"
    default: return ""
  }
}

const stageLabels: Record<DealStage, string> = {
  contract: "계약",
  shipment: "선적",
  customs: "통관",
  settlement: "정산 중",
  settled: "정산 완료",
}

function dealStateDetails(deal: Deal): string[] {
  const order = orderProgress(deal.id)
  switch (deal.stage) {
    case "contract":
      return [
        `문서 확인 ${deal.confirmed}건 · 대기 ${deal.pending}건`,
        referenceAmount(deal.id)?.document ?? "계약 금액 출처 확인 필요",
      ]
    case "shipment":
      return [
        order
          ? `선적 ${order.shipped}/${order.contracted} ${order.unit}`
          : deal.remaining
            ? `선적 잔량 ${deal.remaining}`
            : "선적 수량 확인 필요",
        `ETA ${deal.eta}`,
      ]
    case "customs":
      return [
        deal.nextAction,
        `문서 확인 ${deal.confirmed}건 · 대기 ${deal.pending}건`,
      ]
    case "settlement":
    case "settled":
      return [
        deal.nextAction,
        `문서 확인 ${deal.confirmed}건 · 대기 ${deal.pending}건`,
      ]
  }
}

const riskLabels: Record<DealRisk, string> = {
  amount: "금액 불일치",
  schedule: "일정 지연",
  payment: "결제 지연",
  quantity: "수량 불일치",
  currency: "통화 혼재",
}

function dealItemSummary(deal: Deal) {
  if (deal.itemCount <= 0) return "품목 미등록"
  if (deal.itemCount === 1) return deal.primaryItem
  return `${deal.primaryItem} 외 ${deal.itemCount - 1}건`
}


function SelectControl({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<[string, string]>
}) {
  return (
    <BusinessFilterSelect label={label} value={value} onValueChange={onChange}
      options={options.map(([value, label]) => ({ value, label }))} />
  )
}

function DealCreateDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (title: string, counterparty: string) => void
}) {
  const [title, setTitle] = useState("")
  const [counterparty, setCounterparty] = useState("")
  return createPortal(
    <div
      className="fixed inset-0 z-[var(--z-dialog)] grid place-items-center bg-foreground/20 p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deal-create-title"
    >
      <div className="w-full max-w-md rounded-lg border bg-background p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="deal-create-title" className="text-lg font-semibold">
              거래 만들기
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              문서 연결 전 거래를 먼저 만들 수 있습니다.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="닫기"
            className="text-[var(--color-gray-4)] hover:bg-[color-mix(in_srgb,var(--color-gray-2)_6%,transparent)] hover:text-[var(--color-gray-2)] active:bg-[color-mix(in_srgb,var(--color-gray-2)_10%,transparent)]"
          >
            <X />
          </Button>
        </div>
        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            거래명
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="예: 8월 알루미늄 스크랩 수입"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            거래처
            <Input
              value={counterparty}
              onChange={(event) => setCounterparty(event.target.value)}
              placeholder="거래처명"
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            disabled={!title.trim()}
            onClick={() =>
              onCreate(title.trim(), counterparty.trim() || "거래처 미지정")
            }
          >
            거래 만들기
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function ddayOrder(value: string) {
  const match = /^D([+-])(\d+)$/.exec(value)
  if (value === "D-day" || value === "D-DAY") return 0
  return match
    ? Number(match[2]) * (match[1] === "+" ? -1 : 1)
    : Number.POSITIVE_INFINITY
}

// Figma D-day badge: overdue red, three days or fewer orange, done green.
function ddayTone(value: string) {
  if (value === "완료") return "success" as const
  const match = /^D([+-])(\d+)$/.exec(value)
  if (!match) return "neutral" as const
  if (match[1] === "+") return "danger" as const
  return Number(match[2]) <= 3 ? ("warning" as const) : ("neutral" as const)
}

function isDueSoon(deal: Deal) {
  if (deal.stage !== "shipment") return false
  const eta = new Date(`${deal.eta.replaceAll(".", "-")}T00:00:00`)
  if (Number.isNaN(eta.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((eta.getTime() - today.getTime()) / 86_400_000)
  return days >= 0 && days <= 7
}

type FilterOptions = Array<[string, string]>

const lifecycleOptions: FilterOptions = [
  ["all", "전체"],
  ["open", "열림"],
  ["closed", "종결"],
  ["cancelled", "취소"],
  ["unknown", "미확인"],
]
const stageOptions: FilterOptions = [
  ["active", "전체"],
  ["contract", "계약"],
  ["shipment", "선적"],
  ["customs", "통관"],
  ["settlement", "정산 중"],
  ["settled", "정산 완료"],
]
const assigneeOptions: FilterOptions = [
  ["all", "전체"],
  ["mine", "내 거래"],
  ["unassigned", "미배정"],
]
const financeCurrencyOptions: FilterOptions = [
  ["all", "전체"],
  ...["USD", "EUR", "KRW", "JPY", "CNY", "SGD"].map(
    (currency) => [currency, currency] as [string, string]
  ),
]
const financeResultOptions: FilterOptions = [
  ["all", "전체"],
  ["positive", "흑자"],
  ["negative", "적자"],
  ["unknown", "근거 확인 필요"],
]
const financeBalanceOptions: FilterOptions = [
  ["all", "전체"],
  ["receivable", "받을 돈 있음"],
  ["payable", "줄 돈 있음"],
  ["clear", "잔액 없음"],
  ["unknown", "잔액 확인 필요"],
]
const sortOptions: FilterOptions = [
  ["dday", "D-day 임박순"],
  ["updated", "최근 변경순"],
  ["created", "생성일 최신순"],
  ["risk", "리스크 높은순"],
  ["amount", "통화별 금액 높은순"],
]

// KPI cards (도착 임박 · 연체) and the 운영 리스크 strip narrow the list; the
// active one is shown as a removable filter chip.
type KpiFilter =
  | "all"
  | "pending"
  | "eta"
  | "overdue"
  | "risk"
  | "remaining"
  | "doc_gap"
  | "quantity"

const kpiFilterLabels: Record<Exclude<KpiFilter, "all">, string> = {
  pending: "처리 대기",
  eta: "도착 임박",
  overdue: "연체",
  risk: "리스크",
  remaining: "미선적 잔량",
  doc_gap: "서류 갭",
  quantity: "수량 불일치",
}

const riskStripFilters = ["risk", "remaining", "doc_gap", "quantity"] as const

// Figma 6928:141474 leading icons: Error Circle, Ship, Document, Arrow Sync.
const riskStripIcons: Record<(typeof riskStripFilters)[number], LucideIcon> = {
  risk: CircleAlert,
  remaining: Ship,
  doc_gap: FileText,
  quantity: RefreshCw,
}

const kpiFilterMatchers: Record<
  Exclude<KpiFilter, "all">,
  (deal: Deal) => boolean
> = {
  pending: (deal) => deal.pending > 0,
  eta: isDueSoon,
  overdue: (deal) => Boolean(deal.overdueAr),
  risk: (deal) => deal.risks.length > 0,
  remaining: (deal) => Boolean(deal.remaining),
  doc_gap: (deal) => deal.pending > 0,
  quantity: (deal) => deal.risks.includes("quantity"),
}

// Ghost button for a metric count: bold number, Gray 1; Blue 4 on a Blue 10
// fill while its filter is applied.
function MetricCountButton({
  active,
  label,
  className,
  onClick,
  children,
}: {
  active: boolean
  label: string
  className?: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      aria-pressed={active}
      aria-label={label}
      className={cn(
        "-mx-2 h-auto px-2 py-0 font-bold tabular-nums text-[var(--color-gray-1)] hover:bg-[color-mix(in_srgb,var(--color-gray-1)_6%,transparent)] hover:text-[var(--color-gray-1)]",
        active &&
          "bg-[var(--color-primary-10)] text-[var(--color-primary-4)] hover:bg-[var(--color-primary-10)] hover:text-[var(--color-primary-4)]",
        className
      )}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

function optionLabel(options: FilterOptions, value: string) {
  return options.find(([key]) => key === value)?.[1] ?? value
}

export function DealsScreen({
  onOpenDeal,
  onOpenContacts,
  role = "owner",
}: {
  onOpenDeal: (dealId: string, tab?: DealWorkKey) => void
  onOpenContacts?: () => void
  role?: DealsRole
}) {
  const [view, setView] = useState("operations")
  const [financeFilters, setFinanceFilters] = useState(defaultFinanceFilters)
  const [query, setQuery] = useState("")
  const [counterparty, setCounterparty] = useState(() => new URLSearchParams(window.location.search).get("counterparty") || "all")
  const [assigneeName, setAssigneeName] = useState(() => new URLSearchParams(window.location.search).get("assignee")?.trim() ?? "")
  const [dateStart, setDateStart] = useState("")
  const [dateEnd, setDateEnd] = useState("")
  const [lifecycle, setLifecycle] = useState(() => new URLSearchParams(window.location.search).get("lifecycle") === "all" ? "all" : "open")
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false)
  const [stage, setStage] = useState("active")
  const [assignee, setAssignee] = useState("all")
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>("all")
  const [sort, setSort] = useState("dday")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showCreate, setShowCreate] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [archivedDeals, setArchivedDeals] = useState<Deal[]>(() => [
    {
      ...deals[1],
      id: "DL-260512-02",
      title: "취소된 테스트 거래",
      counterparty: "ACME GmbH",
      assignee: "나",
    },
  ])
  const [archiveTarget, setArchiveTarget] = useState<Deal | null>(null)
  const [archivePending, setArchivePending] = useState(false)
  const [archiveError, setArchiveError] = useState("")
  const [restorePendingId, setRestorePendingId] = useState<string | null>(null)
  const [restoreError, setRestoreError] = useState("")
  const [createdDeals, setCreatedDeals] = useState<Deal[]>([])
  const allDeals = useMemo(
    () =>
      [...createdDeals, ...deals].filter(
        (deal) =>
          !archivedDeals.some((archivedDeal) => archivedDeal.id === deal.id)
      ),
    [archivedDeals, createdDeals]
  )

  // KPI counts use this set so they stay stable while a KPI filter is applied.
  const baseDeals = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    const rows = allDeals.filter((deal) => {
      if (
        view === "finance" &&
        !filteredFinanceFacts(deal.id, deal.currency, financeFilters).length
      )
        return false
      if (
        lifecycle !== "all" &&
        (deal.orderLifecycle ?? "unknown") !== lifecycle
      )
        return false
      if (counterparty !== "all" && deal.counterparty !== counterparty)
        return false
      if (assigneeName && deal.assignee !== assigneeName) return false
      const date = deal.eta.replaceAll(".", "-")
      if (dateStart && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < dateStart))
        return false
      if (dateEnd && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > dateEnd))
        return false
      if (stage !== "active" && deal.stage !== stage) return false
      if (assignee === "mine" && deal.assignee !== "나") return false
      if (assignee === "unassigned" && deal.assignee !== "미배정") return false
      if (
        keyword &&
        ![
          prototypeBackend.deals.getDisplayId(deal.id),
          prototypeBackend.deals.getTitle(deal.id, deal.title),
          deal.counterparty,
          deal.assignee,
          deal.primaryItem,
        ].some((value) => value.toLowerCase().includes(keyword))
      )
        return false
      return true
    })
    return rows.sort((a, b) => {
      if (sort === "risk") return b.risks.length - a.risks.length
      if (sort === "amount") {
        const currencyOrder = a.currency.localeCompare(b.currency)
        if (currencyOrder) return currencyOrder
        const left = decimalMagnitude(
          referenceAmount(a.id)?.amount,
          FINANCE_DECIMAL_SCALE
        )
        const right = decimalMagnitude(
          referenceAmount(b.id)?.amount,
          FINANCE_DECIMAL_SCALE
        )
        if (left === null) return right === null ? 0 : 1
        if (right === null) return -1
        return left === right ? 0 : left > right ? -1 : 1
      }
      if (sort === "updated")
        return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")
      if (sort === "created")
        return dealCreatedAt(b).localeCompare(dealCreatedAt(a))
      return ddayOrder(a.dday) - ddayOrder(b.dday)
    })
  }, [
    allDeals,
    assignee,
    assigneeName,
    query,
    sort,
    stage,
    view,
    financeFilters,
    lifecycle,
    counterparty,
    dateStart,
    dateEnd,
  ])
  const filtered = useMemo(
    () =>
      kpiFilter === "all"
        ? baseDeals
        : baseDeals.filter(kpiFilterMatchers[kpiFilter]),
    [baseDeals, kpiFilter]
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleDeals = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, filtered, pageSize]
  )

  const activeFilters = [
    assigneeName && {
      key: "assigneeName",
      label: `담당자: ${assigneeName}`,
      clear: () => setAssigneeName(""),
    },
    lifecycle !== "all" && {
      key: "lifecycle",
      label: `주문 결정: ${optionLabel(lifecycleOptions, lifecycle)}`,
      clear: () => setLifecycle("all"),
    },
    stage !== "active" && {
      key: "stage",
      label: `단계: ${optionLabel(stageOptions, stage)}`,
      clear: () => setStage("active"),
    },
    assignee !== "all" && {
      key: "assignee",
      label: `담당자: ${optionLabel(assigneeOptions, assignee)}`,
      clear: () => setAssignee("all"),
    },
    kpiFilter !== "all" && {
      key: "kpi",
      label: kpiFilterLabels[kpiFilter],
      clear: () => setKpiFilter("all"),
    },
    counterparty !== "all" && {
      key: "counterparty",
      label: `거래처: ${counterparty}`,
      clear: () => setCounterparty("all"),
    },
    (dateStart || dateEnd) && {
      key: "date",
      label: `ETA ${dateStart || "처음"} ~ ${dateEnd || "끝"}`,
      clear: () => {
        setDateStart("")
        setDateEnd("")
      },
    },
    ...(view === "finance"
      ? [
          financeFilters.currency !== "all" && {
            key: "finance-currency",
            label: `금융 통화: ${financeFilters.currency}`,
            clear: () =>
              setFinanceFilters((current) => ({ ...current, currency: "all" })),
          },
          financeFilters.result !== "all" && {
            key: "finance-result",
            label: `손익 상태: ${optionLabel(financeResultOptions, financeFilters.result)}`,
            clear: () =>
              setFinanceFilters((current) => ({ ...current, result: "all" })),
          },
          financeFilters.balance !== "all" && {
            key: "finance-balance",
            label: `정산 잔액: ${optionLabel(financeBalanceOptions, financeFilters.balance)}`,
            clear: () =>
              setFinanceFilters((current) => ({ ...current, balance: "all" })),
          },
        ]
      : []),
  ].filter(
    (filter): filter is { key: string; label: string; clear: () => void } =>
      Boolean(filter)
  )

  const exportCsv = () => {
    const rows =
      view === "finance"
        ? [
            [
              "거래번호",
              "거래처",
              "통화",
              "확정 매출송장",
              "확정 매입송장",
              "송장 차익",
              "가산 원가",
              "비용 반영 예상손익",
              "받을 돈",
              "줄 돈",
              "받은 돈",
              "지급한 돈",
            ],
            ...filtered.flatMap((deal) => {
              const facts = filteredFinanceFacts(
                deal.id,
                deal.currency,
                financeFilters
              )
              return facts.map((fact) => {
                const p = presentFinanceFact(fact)
                return [
                  prototypeBackend.deals.getDisplayId(deal.id),
                  deal.counterparty,
                  fact.currency,
                  p.invoiceSales,
                  p.invoicePurchases,
                  p.tradeResult,
                  p.costs,
                  p.adjustedResult,
                  p.receivable,
                  p.payable,
                  p.received,
                  p.paid,
                ]
              })
            }),
          ]
        : [
            [
              "거래번호",
              "설명",
              "거래처",
              "단계",
              "담당자",
              "참고 금액",
              "통화",
              "금액 출처",
              "미선적 잔량",
              "D-day",
              "D-day 기준",
              "ETA",
            ],
            ...filtered.map((deal) => {
              const ref = referenceAmount(deal.id)
              return [
                prototypeBackend.deals.getDisplayId(deal.id),
                prototypeBackend.deals.getTitle(deal.id, deal.title),
                deal.counterparty,
                stageLabels[deal.stage],
                deal.assignee,
                ref?.amount ?? "",
                ref?.currency ?? deal.currency,
                ref?.document ?? "",
                deal.remaining ?? "",
                deal.dday,
                dDayBasisLabel(deal.dDayBasis),
                deal.eta.replaceAll(".", "-"),
              ]
            }),
          ]
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n")
    const url = URL.createObjectURL(
      new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" })
    )
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `ecoya-deals-${view}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div data-deal-list className="field-scrollbar h-full overflow-y-auto bg-transparent">
      <div className="flex w-full flex-col gap-5 p-4 sm:p-6">
        <HeroBanner
          title="거래"
          description="확인된 문서를 거래 단위로 모아 다음 작업과 위험을 관리합니다."
          className="[&_header]:flex-wrap"
          actions={
            <>
              <ViewSeatAction>
                <Button
                  variant="outline"
                  className={heroOutlineButtonClass}
                  onClick={exportCsv}
                >
                  <Download data-icon="inline-start" />
                  엑셀 다운로드
                </Button>
              </ViewSeatAction>
              <ViewSeatAction>
                <Button onClick={() => setShowCreate(true)}>
                  <Plus data-icon="inline-start" />
                  거래 만들기
                </Button>
              </ViewSeatAction>
            </>
          }
          controls={
            <BusinessListToolbar
              aria-label="거래 검색 필터"
              search={
                <div className="flex w-full flex-wrap items-center gap-2 sm:flex-nowrap">
                  <BusinessFilterSearch
                    label="거래명, 번호, 거래처, 품목 검색"
                    value={query}
                    onValueChange={(value) => {
                      setQuery(value)
                      setPage(1)
                    }}
                  />
                  {/* Figma 6928:141431: white 40px button, 6px gap, count in a
                      dark circle, chevron up while the filters are open. */}
                  <button
                    type="button"
                    className="flex h-10 shrink-0 items-center gap-1.5 rounded-[10px] bg-white pr-4 pl-3.5 text-[15px] leading-[22px] text-[var(--color-gray-1)] shadow-[0_1px_2px_rgba(5,29,57,0.1)] outline-none hover:bg-[var(--color-gray-11)] focus-visible:ring-2 focus-visible:ring-white"
                    aria-expanded={advancedFiltersOpen}
                    aria-controls="deal-advanced-filters"
                    onClick={() => setAdvancedFiltersOpen((value) => !value)}
                  >
                    <SlidersHorizontal className="size-[18px]" />
                    상세 필터
                    {activeFilters.length > 0 && (
                      <span className="grid size-[18px] place-items-center rounded-full bg-[var(--color-primary-1)] text-[11px] leading-4 font-semibold text-white tabular-nums">
                        {activeFilters.length}
                      </span>
                    )}
                    <ChevronDown
                      className={cn(
                        "size-[18px] transition-transform",
                        advancedFiltersOpen && "rotate-180"
                      )}
                    />
                  </button>
                </div>
              }
            >
              {advancedFiltersOpen ? (
                <div className="flex w-full max-w-full min-w-0 flex-col gap-3">
                  {advancedFiltersOpen && (
                    <div
                      id="deal-advanced-filters"
                      className="flex w-full min-w-0 flex-col gap-3"
                    >
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                        <SelectControl
                          label="주문 결정"
                          value={lifecycle}
                          onChange={(value) => {
                            setLifecycle(value)
                            setPage(1)
                          }}
                          options={lifecycleOptions}
                        />
                        <SelectControl
                          label="단계"
                          value={stage}
                          onChange={(value) => {
                            setStage(value)
                            setPage(1)
                          }}
                          options={stageOptions}
                        />
                        <SelectControl
                          label="담당자"
                          value={assignee}
                          onChange={(value) => {
                            setAssignee(value)
                            setPage(1)
                          }}
                          options={assigneeOptions}
                        />
                        <SelectControl
                          label="거래처"
                          value={counterparty}
                          onChange={(value) => {
                            setCounterparty(value)
                            setPage(1)
                          }}
                          options={[
                            ["all", "전체"],
                            ...[
                              ...new Set(
                                allDeals.map((deal) => deal.counterparty)
                              ),
                            ]
                              .sort()
                              .map((name) => [name, name] as [string, string]),
                          ]}
                        />
                        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                          <span className="flex items-center gap-0.5 text-[13px] font-semibold text-white">
                            ETA 기간
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label="ETA 기간 안내"
                                  className="size-6 text-white/70 hover:bg-white/10 hover:text-white"
                                >
                                  <Info className="size-3.5" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                align="start"
                                className="max-w-[calc(100vw-32px)] text-xs leading-5"
                              >
                                등록된 ETA가 이 기간 안에 있는 거래만
                                보여줍니다. ETA가 없는 거래는 제외됩니다.
                              </PopoverContent>
                            </Popover>
                          </span>
                          <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:flex sm:w-auto">
                            <DatePicker
                              ariaLabel="ETA 기간 시작일"
                              className="sm:w-40"
                              value={dateStart}
                              max={dateEnd || undefined}
                              onValueChange={(value) => {
                                setDateStart(value)
                                setPage(1)
                              }}
                            />
                            <span className="text-white/70">~</span>
                            <DatePicker
                              ariaLabel="ETA 기간 종료일"
                              className="sm:w-40"
                              value={dateEnd}
                              min={dateStart || undefined}
                              onValueChange={(value) => {
                                setDateEnd(value)
                                setPage(1)
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      {view === "finance" && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-white/15 pt-3">
                          <SelectControl
                            label="금융 통화"
                            value={financeFilters.currency}
                            onChange={(currency) => {
                              setFinanceFilters((current) => ({
                                ...current,
                                currency,
                              }))
                              setPage(1)
                            }}
                            options={financeCurrencyOptions}
                          />
                          <SelectControl
                            label="손익 상태"
                            value={financeFilters.result}
                            onChange={(result) => {
                              setFinanceFilters((current) => ({
                                ...current,
                                result,
                              }))
                              setPage(1)
                            }}
                            options={financeResultOptions}
                          />
                          <SelectControl
                            label="정산 잔액"
                            value={financeFilters.balance}
                            onChange={(balance) => {
                              setFinanceFilters((current) => ({
                                ...current,
                                balance,
                              }))
                              setPage(1)
                            }}
                            options={financeBalanceOptions}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </BusinessListToolbar>
          }
        />
        {/* Figma 6928:141427: applied filters, KPI cards and the risk buttons
            sit under the hero (12px apart), not on it. */}
        {(activeFilters.length > 0 || query) && (
          <div
            aria-label="적용된 필터"
            className="-mt-2 flex flex-wrap items-center gap-1.5"
          >
            {activeFilters.map((filter) => (
              <span
                key={filter.key}
                className="flex h-8 items-center gap-0.5 rounded-full bg-[var(--color-gray-8)] pr-2 pl-3 text-[13px] leading-[22px] text-[var(--color-gray-1)]"
              >
                {filter.label}
                <button
                  type="button"
                  className="grid size-6 place-items-center rounded-[var(--r-sm)] text-[var(--color-gray-3)] outline-none hover:bg-[color-mix(in_srgb,var(--color-gray-1)_6%,transparent)] focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`${filter.label} 필터 해제`}
                  onClick={() => {
                    filter.clear()
                    setPage(1)
                  }}
                >
                  <X className="size-4" />
                </button>
              </span>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="px-3 text-[13px] leading-[18px] text-[var(--color-primary-4)] hover:text-[var(--color-primary-4)]"
              onClick={() => {
                setQuery("")
                setLifecycle("all")
                setCounterparty("all")
                setDateStart("")
                setDateEnd("")
                setStage("active")
                setAssignee("all")
                setAssigneeName("")
                setKpiFilter("all")
                setFinanceFilters(defaultFinanceFilters)
                setPage(1)
              }}
            >
              전체 해제
            </Button>
          </div>
        )}
        {/* Metrics are plain cards; only the count is a ghost button that
            narrows the list below (press again to clear). */}
        <section aria-label="주요 거래 지표" className="-mt-2 flex flex-col gap-3 pt-1">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {([
              {
                label: "오픈 오더",
                count: baseDeals.filter((deal) => deal.orderLifecycle === "open").length,
                detail: "주문 결정이 열려 있는 거래",
                active: lifecycle === "open",
                toggle: () => setLifecycle(lifecycle === "open" ? "all" : "open"),
              },
              {
                label: "처리 대기",
                count: baseDeals.reduce((sum, deal) => sum + deal.pending, 0),
                detail: "확인이 필요한 문서",
                active: kpiFilter === "pending",
                toggle: () => setKpiFilter(kpiFilter === "pending" ? "all" : "pending"),
              },
              {
                label: "도착 임박",
                count: baseDeals.filter(isDueSoon).length,
                detail: "7일 안에 도착 예정",
                active: kpiFilter === "eta",
                toggle: () => setKpiFilter(kpiFilter === "eta" ? "all" : "eta"),
              },
              {
                label: "연체",
                count: baseDeals.filter((deal) => deal.overdueAr).length,
                detail: "받을 돈이 늦어진 거래",
                active: kpiFilter === "overdue",
                toggle: () => setKpiFilter(kpiFilter === "overdue" ? "all" : "overdue"),
              },
            ]).map((metric) => (
              <Card
                key={metric.label}
                className="min-w-0 items-start gap-1.5 px-5 py-[18px]"
              >
                <span className="text-sm leading-5 font-semibold text-[var(--color-gray-1)]">
                  {metric.label}
                </span>
                <MetricCountButton
                  active={metric.active}
                  label={`${metric.label} ${metric.count}건으로 목록 거르기`}
                  className="text-[22px] leading-[30px]"
                  onClick={() => {
                    metric.toggle()
                    setPage(1)
                  }}
                >
                  {metric.count}건
                </MetricCountButton>
                <span className="text-[13px] leading-[18px] text-[var(--color-gray-4)]">
                  {metric.detail}
                </span>
              </Card>
            ))}
          </div>
          <div
            aria-label="운영 리스크"
            className="grid grid-cols-2 gap-3 lg:grid-cols-4"
          >
            {riskStripFilters.map((key) => {
              const active = kpiFilter === key
              const Icon = riskStripIcons[key]
              const count = baseDeals.filter(kpiFilterMatchers[key]).length
              return (
                <Card
                  key={key}
                  className="h-12 min-w-[100px] flex-row items-center gap-2 px-4 py-0"
                >
                  <Icon className="size-5 shrink-0 text-[var(--color-gray-4)]" strokeWidth={1.5} />
                  <span className="truncate text-[13px] text-[var(--color-gray-4)]">
                    {kpiFilterLabels[key]}
                  </span>
                  <MetricCountButton
                    active={active}
                    label={`${kpiFilterLabels[key]} ${count}건으로 목록 거르기`}
                    className="ml-1 text-base leading-[22px]"
                    onClick={() => {
                      setKpiFilter(active ? "all" : key)
                      setPage(1)
                    }}
                  >
                    {count}건
                  </MetricCountButton>
                </Card>
              )
            })}
          </div>
        </section>
        {/* Same list card as 문서 올리기: toolbar, 16px-inset table and pagination. */}
        <Card size="sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
          <Tabs
            value={view}
            onValueChange={(value) => {
              setView(value)
              setPage(1)
            }}
            aria-label="거래 보기 방식"
          >
            <TabsList>
              <TabsTrigger value="operations">운영</TabsTrigger>
              <TabsTrigger value="finance">금융</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="min-w-0 flex-1 text-xs text-muted-foreground">
            {view === "finance"
              ? "송장·입출금은 누적 흐름, 받을 돈·줄 돈은 현재 잔액입니다. 통화별로 표시합니다."
              : "금액은 출처 문서 기준입니다. 근거가 없는 값은 —로 표시합니다."}
          </p>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <BusinessFilterBar style={{ width: "auto" }}>
              <SelectControl
                label="정렬"
                value={sort}
                onChange={(value) => {
                  setSort(value)
                  setPage(1)
                }}
                options={sortOptions}
              />
            </BusinessFilterBar>
            {/* SSOT SC-14 / #443 P3: only moves to 연락처·파이프라인 (/erp/sales);
                the deals list has no stage board. */}
            <Button variant="outline" onClick={onOpenContacts}>
              <GitBranch />
              연락처·파이프라인
            </Button>
          </div>
        </div>
        <CardContent
          data-layout="flush-table"
          className="space-y-3 p-0"
        >
        <section className="[container-type:inline-size]">
          {view === "finance" ? (
            <DealsFinanceTable
              hasRecords={allDeals.length > 0}
              filters={financeFilters}
              deals={visibleDeals}
              onOpenDeal={(id) => onOpenDeal(id, "finance")}
            />
          ) : (
            <Table
              aria-label="거래 업무표"
              className="min-w-[1320px] table-fixed"
            >
              <TableHeader>
                <TableRow>
                  {/* Figma 6928:141491 column widths on the 1320 frame. */}
                  <TableHead className="w-[250px] pl-5">
                    거래번호 / 거래처
                  </TableHead>
                  <TableHead className="w-[170px]">품목 / 주문 이행</TableHead>
                  <TableHead className="w-[150px] text-right!">참고 금액</TableHead>
                  <TableHead className="w-[180px] text-right!">현재 금융</TableHead>
                  <TableHead className="w-[140px] text-center!">D-day / ETA</TableHead>
                  <TableHead className="w-[90px] text-center!">담당자</TableHead>
                  <TableHead className="w-[292px]">
                    진행 상태 / 상세 정보
                  </TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">거래 메뉴</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleDeals.length ? (
                  visibleDeals.map((deal) => {
                    const displayDealId = prototypeBackend.deals.getDisplayId(
                      deal.id
                    )
                    const displayDealTitle = prototypeBackend.deals.getTitle(
                      deal.id,
                      deal.title
                    )
                    const canArchiveDeal =
                      role === "owner" ||
                      role === "admin" ||
                      deal.assignee === "나" ||
                      Boolean(deal.shared)

                    return (
                      <TableRow
                        key={deal.id}
                        data-clickable="true"
                        tabIndex={0}
                        className="cursor-pointer focus-visible:relative focus-visible:z-10 focus-visible:[box-shadow:var(--shadow-keyboard-focus)] focus-visible:outline-none"
                        onClick={() => onOpenDeal(deal.id)}
                        onKeyDown={(event) => {
                          if (
                            event.target === event.currentTarget &&
                            (event.key === "Enter" || event.key === " ")
                          ) {
                            event.preventDefault()
                            onOpenDeal(deal.id)
                          }
                        }}
                      >
                        {/* Figma 6928:141500 row: cells 16px from the top,
                            14/20 id, 13/18 title, 11/16 captions. */}
                        <TableCell className="py-4 pl-5 align-top whitespace-normal">
                          <button
                            className="block w-full text-left"
                            onClick={(event) => {
                              event.stopPropagation()
                              onOpenDeal(deal.id)
                            }}
                          >
                            <span className="flex items-center gap-2">
                              <strong className="text-sm leading-5 font-bold text-[var(--color-gray-1)]">
                                {displayDealId}
                              </strong>
                              {deal.shared && (
                                <StatusBadge tone="blue">공유</StatusBadge>
                              )}
                            </span>
                            <span className="mt-0.5 block text-[13px] leading-[18px] text-[var(--color-gray-1)]">
                              {displayDealTitle}
                            </span>
                          </button>
                          <span className="mt-0.5 block text-[11px] leading-4 text-[var(--color-gray-4)]">
                            {deal.counterparty}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 align-top whitespace-normal">
                          {(() => {
                            const order = orderProgress(deal.id)
                            return order ? (
                              <>
                                <span className="block text-[15px] leading-[22px] text-[var(--color-gray-1)]">
                                  계약 {order.contracted} {order.unit} · 선적{" "}
                                  {order.shipped} {order.unit}
                                </span>
                                <span className="mt-0.5 block text-[11px] leading-4 text-[var(--color-gray-4)]">
                                  {dealItemSummary(deal)}
                                </span>
                                <span className="mt-0.5 block text-[11px] leading-4 text-[var(--color-orange-1)]">
                                  잔량 {order.remaining} {order.unit} ·{" "}
                                  {order.state}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="block text-[15px] leading-[22px] text-[var(--color-gray-1)]">
                                  {deal.remaining
                                    ? `잔량 ${deal.remaining}`
                                    : "수량 근거 확인 필요"}
                                </span>
                                <span className="mt-0.5 block text-[11px] leading-4 text-[var(--color-gray-4)]">
                                  {dealItemSummary(deal)}
                                </span>
                              </>
                            )
                          })()}
                        </TableCell>
                        <TableCell className="py-4 text-right! align-top whitespace-normal tabular-nums">
                          {(() => {
                            const ref = referenceAmount(deal.id)
                            return ref ? (
                              <>
                                <span className="block text-xs leading-4 text-[var(--color-gray-1)]">
                                  {exactFinanceMoney(ref.amount, ref.currency)}
                                </span>
                                <span className="mt-0.5 block text-[11px] leading-4 break-all text-[var(--color-gray-4)]">
                                  {ref.document} · {ref.state}
                                </span>
                              </>
                            ) : (
                              <span className="text-[11px] leading-4 text-[var(--color-gray-4)]">
                                — · 출처 확인 필요
                              </span>
                            )
                          })()}
                        </TableCell>
                        <TableCell className="py-4 align-top whitespace-normal tabular-nums">
                          <div className="flex flex-col items-end gap-0.5">
                            {filteredFinanceFacts(
                              deal.id,
                              deal.currency,
                              defaultFinanceFilters
                            ).map((fact) => {
                              const finance = presentFinanceFact(fact)
                              return (
                                <div key={fact.currency} className="contents">
                                  {[
                                    ["받을 돈", finance.receivable],
                                    ["줄 돈", finance.payable],
                                  ].map(([label, amount]) => (
                                    <span
                                      key={label}
                                      className="flex w-full items-baseline justify-between gap-2 text-[11px] leading-4"
                                    >
                                      <span className="text-[var(--color-gray-4)]">{label}</span>
                                      <span className="text-[var(--color-gray-1)]">
                                        {amount === "—" ? `${fact.currency} —` : amount}
                                      </span>
                                    </span>
                                  ))}
                                  {finance.adjustedResult === "—" && (
                                    <span className="text-[11px] leading-4 text-[var(--color-orange-1)]">
                                      손익 근거 확인 필요
                                    </span>
                                  )}
                                </div>
                              )
                            })}
                            <button
                              className="h-6 rounded-[var(--r-sm)] px-2 text-[11px] leading-4 text-[var(--color-primary-4)] hover:bg-[color-mix(in_srgb,var(--color-gray-1)_6%,transparent)]"
                              onClick={(event) => {
                                event.stopPropagation()
                                onOpenDeal(deal.id, "finance")
                              }}
                            >
                              금융 상세 열기
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 align-top tabular-nums">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="flex items-center gap-1.5">
                              <StatusBadge tone={ddayTone(deal.dday)}>
                                {deal.dday}
                              </StatusBadge>
                              {dDayBasisLabel(deal.dDayBasis) ? (
                                <span className="text-[11px] leading-4 text-[var(--color-gray-4)]">
                                  {dDayBasisLabel(deal.dDayBasis)}
                                </span>
                              ) : null}
                            </span>
                            <span className="text-[15px] leading-[22px] text-[var(--color-gray-3)]">
                              ETA {deal.eta.replaceAll(".", "-")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell
                          className={cn(
                            "py-4 text-center align-top text-[13px] leading-[18px] text-[var(--color-gray-1)]",
                            deal.assignee === "미배정" &&
                              "text-[var(--color-orange-1)]"
                          )}
                        >
                          {deal.assignee}
                        </TableCell>
                        <TableCell className="py-4 align-top whitespace-normal">
                          <div
                            aria-label={`${displayDealId} 상태별 상세`}
                            className="flex flex-col items-start gap-1"
                          >
                            <span className="flex items-center gap-1">
                              <StatusBadge
                                tone={
                                  deal.stage === "settled" ? "success" : "neutral"
                                }
                              >
                                {stageLabels[deal.stage]}
                                {deal.stage === "settled" ||
                                deal.stage === "settlement"
                                  ? ""
                                  : " 진행"}
                              </StatusBadge>
                              <StatusBadge variant="outline">
                                {deal.direction === "sales" ? "매출" : deal.direction === "purchase" ? "매입" : "방향 확인 필요"}
                              </StatusBadge>
                            </span>
                            {Boolean(deal.requiredDocsMissing) && (
                              <span className="text-[11px] leading-4 text-[var(--color-orange-1)]">
                                · 서류 미비 {deal.requiredDocsMissing}건
                              </span>
                            )}
                            {dealStateDetails(deal).map((detail) => (
                              <span
                                key={detail}
                                className="text-[11px] leading-4 text-[var(--color-gray-4)]"
                              >
                                · {detail}
                              </span>
                            ))}
                            {deal.risks.length > 0 && (
                              <span className="rounded-full bg-[var(--color-orange-6)] px-2.5 py-0.5 text-[13px] leading-[18px] text-[var(--color-orange-1)]">
                                리스크 {deal.risks.length}건 · {deal.risks
                                  .map((risk) => riskLabels[risk])
                                  .join(" · ")}
                              </span>
                            )}
                            <button
                              className="h-6 rounded-[var(--r-sm)] px-2 text-left text-[11px] leading-4 text-[var(--color-primary-4)] hover:bg-[color-mix(in_srgb,var(--color-gray-1)_6%,transparent)]"
                              onClick={(event) => {
                                event.stopPropagation()
                                onOpenDeal(
                                  deal.id,
                                  getDealWorkPlan(deal.id).current ?? "finance"
                                )
                              }}
                            >
                              {getDealWorkPlan(deal.id).current
                                ? `${workLabels[getDealWorkPlan(deal.id).current!]} 확인 · ${deal.nextAction}`
                                : "정산 상세 보기"}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 align-top">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="mx-auto text-muted-foreground"
                                aria-label={`${displayDealId} 거래 메뉴`}
                                onClick={(event) => event.stopPropagation()}
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <DropdownMenuItem
                                onSelect={() => onOpenDeal(deal.id)}
                              >
                                상세 보기
                              </DropdownMenuItem>
                              {canArchiveDeal ? (
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setArchiveError("")
                                    setArchiveTarget(deal)
                                  }}
                                >
                                  <Archive className="size-4" />
                                  보관
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0 whitespace-normal">
                      <Empty className="sticky left-0 min-h-40 w-[100cqw] max-w-full items-start text-left">
                        <EmptyHeader className="items-start">
                          <EmptyTitle>
                            {allDeals.length
                              ? "조건에 맞는 거래가 없습니다."
                              : "등록된 거래가 없습니다."}
                          </EmptyTitle>
                          <EmptyDescription>
                            {allDeals.length
                              ? "검색어 또는 필터를 변경해 주세요."
                              : "거래를 등록하면 진행 상태와 상세 정보를 확인할 수 있습니다."}
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </section>

        <p className="text-xs text-muted-foreground">
          조건에 맞는 전체 거래 기준입니다. 통화·단위가 다른 값은 합산하지
          않습니다.
        </p>
        <TablePagination
          page={currentPage}
          pageSize={pageSize}
          total={filtered.length}
          aria-label="거래 목록 페이지 이동"
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize)
            setPage(1)
          }}
        />
        </CardContent>
        </Card>

        {role === "owner" ? (
          <section className="border-t border-[var(--color-gray-9)]">
            {/* Figma 6928:141842: blue link, count, Owner badge, chevron at the end. */}
            <button
              type="button"
              aria-expanded={archiveOpen}
              className="flex w-full items-center gap-3 px-1 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setArchiveOpen((value) => !value)}
            >
              <span className="flex h-8 items-center gap-1 text-[13px] leading-[18px] text-[var(--color-primary-4)]">
                <Archive className="size-4" />
                보관된 거래 보기
              </span>
              <span className="text-[13px] leading-[18px] text-[var(--color-gray-1)] tabular-nums">
                {archivedDeals.length}
              </span>
              <span className="flex h-4 items-center rounded-full bg-[var(--color-gray-9)] px-2.5 text-[11px] leading-4 text-[var(--color-gray-3)]">
                Owner
              </span>
              <span className="ml-auto grid size-8 place-items-center text-[var(--color-gray-2)]">
                <ChevronRight
                  className={cn("size-[18px] transition", archiveOpen && "rotate-90")}
                />
              </span>
            </button>
            {archiveOpen ? (
              <div className="mt-2 divide-y border-y bg-muted/35 px-4">
                {archivedDeals.length ? (
                  archivedDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="flex items-center justify-between gap-4 py-4"
                    >
                      <div className="min-w-0">
                        <strong className="block truncate text-sm">
                          {prototypeBackend.deals.getDisplayId(deal.id)} ·{" "}
                          {prototypeBackend.deals.getTitle(deal.id, deal.title)}
                        </strong>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {deal.counterparty} · 보관된 거래 · 이력 보존
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={restorePendingId !== null}
                        onClick={async () => {
                          setRestorePendingId(deal.id)
                          setRestoreError("")
                          try {
                            const result = await prototypeBackend.deals.restore(
                              deal.id
                            )
                            if (!result.ok) throw new Error(result.error)
                            setArchivedDeals((items) =>
                              items.filter((item) => item.id !== deal.id)
                            )
                            if (
                              !deals.some((item) => item.id === deal.id) &&
                              !createdDeals.some((item) => item.id === deal.id)
                            ) {
                              setCreatedDeals((items) => [deal, ...items])
                            }
                          } catch {
                            setRestoreError(
                              "복원하지 못했습니다. 잠시 후 다시 시도해주세요."
                            )
                          } finally {
                            setRestorePendingId(null)
                          }
                        }}
                      >
                        {restorePendingId === deal.id ? (
                          <Loader2
                            className="animate-spin"
                            data-icon="inline-start"
                          />
                        ) : (
                          <RefreshCw data-icon="inline-start" />
                        )}
                        {restorePendingId === deal.id ? "복원 중" : "복원"}
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-sm text-muted-foreground">
                    보관된 거래가 없습니다.
                  </p>
                )}
                {restoreError ? (
                  <p className="py-3 text-xs text-destructive">
                    {restoreError}
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
      {showCreate ? (
        <DealCreateDialog
          onClose={() => setShowCreate(false)}
          onCreate={(title, counterparty) => {
            setCreatedDeals([
              {
                ...deals[1],
                id: `DL-260711-${String(createdDeals.length + 1).padStart(2, "0")}`,
                title,
                counterparty,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                primaryItem: "품목 미등록",
                orderLifecycle: "open",
                itemCount: 0,
                assignee: "나",
                confirmed: 0,
                pending: 0,
                risks: [],
                nextAction: "계약 문서 연결",
                nextKind: "upload",
              },
              ...createdDeals,
            ])
            setShowCreate(false)
          }}
        />
      ) : null}
      <AlertDialog
        open={archiveTarget !== null}
        onOpenChange={(open) => {
          if (!open && !archivePending) {
            setArchiveTarget(null)
            setArchiveError("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 거래를 보관할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              진행 중인 목록과 집계에서 제외됩니다. 연결된 문서와 거래 이력은
              유지되며, Owner가 보관된 거래 목록에서 복구할 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {archiveTarget ? (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <div className="font-medium">
                {prototypeBackend.deals.getDisplayId(archiveTarget.id)} ·{" "}
                {prototypeBackend.deals.getTitle(
                  archiveTarget.id,
                  archiveTarget.title
                )}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {archiveTarget.counterparty} · {dealItemSummary(archiveTarget)}
              </div>
            </div>
          ) : null}
          {archiveError ? (
            <p className="text-sm text-destructive">{archiveError}</p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archivePending}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={archivePending}
              onClick={(event) => {
                event.preventDefault()
                if (!archiveTarget) return
                setArchivePending(true)
                setArchiveError("")
                void prototypeBackend.deals
                  .archive(archiveTarget.id)
                  .then((result) => {
                    if (!result.ok) throw new Error(result.error)
                    setArchivedDeals((items) => [archiveTarget, ...items])
                    setArchiveTarget(null)
                  })
                  .catch(() => {
                    setArchiveError(
                      "거래를 보관하지 못했습니다. 현재 상태를 유지한 채 다시 시도해주세요."
                    )
                  })
                  .finally(() => setArchivePending(false))
              }}
            >
              {archivePending ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : null}
              {archivePending ? "보관 처리 중" : "보관"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export {
  DealDetailScreen,
  type GeneratedDealDocumentSummary,
} from "./DealDetailConnected"

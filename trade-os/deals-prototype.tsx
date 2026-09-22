import { BusinessListToolbar, BusinessFilterSearch, BusinessFilterSelect } from "@shared/components/business-filters"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@ecoya/design-system/ui/empty"
import {
  getDealWorkPlan,
  workLabels,
  type DealWorkKey,
} from "@trade-os/lib/deal-workflow"
import { DealsFinanceTable } from "@trade-os/deals-finance-table"
import {
  filteredFinanceFacts,
  defaultFinanceFilters,
  csvCell,
  orderProgress,
  referenceAmount,
} from "@trade-os/lib/deal-finance-workspace"
import { exactFinanceMoney, presentFinanceFact } from "@trade-os/lib/erp-finance"
import { decimalMagnitude, FINANCE_DECIMAL_SCALE } from "@trade-os/lib/financeDecimal"
import { Badge } from "@shared/components/ui/badge"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  GitBranch,
  List,
  CircleAlert,
  Download,
  FilePlus2,
  FileSearch,
  Link2,
  Loader2,
  MessageSquareText,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react"

import { TablePagination } from "@shared/components/ui/table-pagination"

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
import { Button } from "@shared/components/ui/button"
import { BusinessPageHero } from "@shared/components/business-page-hero"
import { SummaryMetricStrip } from "@shared/components/summary-metric-strip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu"
import { Input } from "@shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select"
import { Separator } from "@shared/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs"
import { Textarea } from "@shared/components/ui/textarea"
import {
  PdfFloatingControls,
  PdfViewerToolbar,
} from "@shared/components/pdf-floating-controls"
import { PannablePdfViewport } from "@shared/components/pannable-pdf-viewport"
import { cn } from "@shared/lib/utils"
import { prototypeBackend } from "@trade-os/lib/prototype-backend"

import {
  deals,
  type Deal,
  type DealStage,
  type DealRisk,
} from "@trade-os/lib/prototype-deals"

type DealsRole = "owner" | "admin" | "member"

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

function isDueSoon(deal: Deal) {
  const days = ddayOrder(deal.dday)
  return days >= 0 && days <= 3
}

export function DealsScreen({
  onOpenDeal,
  role = "owner",
}: {
  onOpenDeal: (dealId: string, tab?: DealWorkKey) => void
  role?: DealsRole
}) {
  const [view, setView] = useState("operations")
  const [financeFilters, setFinanceFilters] = useState(defaultFinanceFilters)
  const [query, setQuery] = useState("")
  const [counterparty, setCounterparty] = useState("all")
  const [etaStart, setEtaStart] = useState("")
  const [etaEnd, setEtaEnd] = useState("")
  const [pending, setPending] = useState("all")
  const [lifecycle, setLifecycle] = useState("open")
  const [pipeline, setPipeline] = useState(false)
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false)
  const [stage, setStage] = useState("active")
  const [assignee, setAssignee] = useState("all")
  const [risk, setRisk] = useState("all")
  const [ops, setOps] = useState("all")
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

  const filtered = useMemo(() => {
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
      const eta = deal.eta.replaceAll(".", "-")
      if (etaStart && (!/^\d{4}-\d{2}-\d{2}$/.test(eta) || eta < etaStart))
        return false
      if (etaEnd && (!/^\d{4}-\d{2}-\d{2}$/.test(eta) || eta > etaEnd))
        return false
      if (pending === "yes" && deal.pending === 0) return false
      if (pending === "no" && deal.pending !== 0) return false
      if (stage !== "active" && deal.stage !== stage) return false
      if (assignee === "mine" && deal.assignee !== "나") return false
      if (assignee === "unassigned" && deal.assignee !== "미배정") return false
      if (risk === "active" && deal.risks.length === 0) return false
      if (ops === "overdue" && !deal.overdue) return false
      if (ops === "remaining" && !deal.remaining) return false
      if (ops === "doc_gap" && deal.pending === 0) return false
      if (ops === "eta" && !isDueSoon(deal)) return false
      if (ops === "quantity" && !deal.risks.includes("quantity")) return false
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
      if (sort === "counterparty")
        return a.counterparty.localeCompare(b.counterparty, "ko")
      if (sort === "eta") return a.eta.localeCompare(b.eta)
      return ddayOrder(a.dday) - ddayOrder(b.dday)
    })
  }, [
    allDeals,
    assignee,
    ops,
    query,
    risk,
    sort,
    stage,
    view,
    financeFilters,
    lifecycle,
    counterparty,
    etaStart,
    etaEnd,
    pending,
  ])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleDeals = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, filtered, pageSize]
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
              "기준 금액",
              "통화",
              "금액 출처",
              "미선적 잔량",
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
    <div className="field-scrollbar h-full overflow-y-auto bg-background">
      <div className="flex w-full flex-col gap-5 p-4 sm:p-6">
        <BusinessPageHero
          title="거래"
          description="확인된 문서를 거래 단위로 모아 다음 작업과 위험을 관리합니다."
          className="[&_header]:flex-wrap"
          actions={
            <>
              <Button variant="outline" onClick={exportCsv}>
                <Download data-icon="inline-start" />
                엑셀 다운로드
              </Button>
              <Button onClick={() => setShowCreate(true)}>
                <Plus data-icon="inline-start" />
                거래 만들기
              </Button>
            </>
          }
          controls={
            <BusinessListToolbar
              aria-label="거래 검색 필터"
              search={
                <BusinessFilterSearch
                  label="거래명, 번호, 거래처, 품목 검색"
                  value={query}
                  onValueChange={(value) => {
                    setQuery(value)
                    setPage(1)
                  }}
                />
              }
              actions={
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  aria-expanded={advancedFiltersOpen}
                  aria-controls="deal-advanced-filters"
                  onClick={() => setAdvancedFiltersOpen((value) => !value)}
                >
                  <SlidersHorizontal />
                  상세 필터
                  {(counterparty !== "all" || etaStart || etaEnd) && (
                    <span className="size-1.5 rounded-full bg-white" />
                  )}
                </Button>
              }
              result={`${filtered.length}건 표시 중`}
            >
              <SelectControl
                label="주문 결정"
                value={lifecycle}
                onChange={(value) => {
                  setLifecycle(value)
                  setPage(1)
                }}
                options={[
                  ["all", "전체"],
                  ["open", "열림"],
                  ["closed", "종결"],
                  ["cancelled", "취소"],
                  ["unknown", "미확인"],
                ]}
              />
              <SelectControl
                label="미확인"
                value={pending}
                onChange={(value) => {
                  setPending(value)
                  setPage(1)
                }}
                options={[
                  ["all", "전체"],
                  ["yes", "있음"],
                  ["no", "없음"],
                ]}
              />
              <SelectControl
                label="단계"
                value={stage}
                onChange={(value) => {
                  setStage(value)
                  setPage(1)
                }}
                options={[
                  ["active", "전체"],
                  ["contract", "계약"],
                  ["shipment", "선적"],
                  ["customs", "통관"],
                  ["settlement", "정산 중"],
                  ["settled", "정산 완료"],
                ]}
              />
              <SelectControl
                label="담당자"
                value={assignee}
                onChange={(value) => {
                  setAssignee(value)
                  setPage(1)
                }}
                options={[
                  ["all", "전체"],
                  ["mine", "내 거래"],
                  ["unassigned", "미배정"],
                ]}
              />
              <SelectControl
                label="리스크"
                value={risk}
                onChange={(value) => {
                  setRisk(value)
                  setPage(1)
                }}
                options={[
                  ["all", "전체"],
                  ["active", "있음"],
                ]}
              />
              <SelectControl
                label="운영"
                value={ops}
                onChange={(value) => {
                  setOps(value)
                  setPage(1)
                }}
                options={[
                  ["all", "전체"],
                  ["overdue", "연체"],
                  ["remaining", "미선적 잔량"],
                  ["doc_gap", "서류 갭"],
                  ["eta", "도착 임박"],
                  ["quantity", "수량 불일치"],
                ]}
              />
              {view === "finance" && (
                <>
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
                    options={[
                      ["all", "전체"],
                      ...["USD", "EUR", "KRW", "JPY", "CNY", "SGD"].map(
                        (currency) => [currency, currency] as [string, string]
                      ),
                    ]}
                  />
                  <SelectControl
                    label="손익 상태"
                    value={financeFilters.result}
                    onChange={(result) => {
                      setFinanceFilters((current) => ({ ...current, result }))
                      setPage(1)
                    }}
                    options={[
                      ["all", "전체"],
                      ["positive", "흑자"],
                      ["negative", "적자"],
                      ["unknown", "근거 확인 필요"],
                    ]}
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
                    options={[
                      ["all", "전체"],
                      ["receivable", "받을 돈 있음"],
                      ["payable", "줄 돈 있음"],
                      ["clear", "잔액 없음"],
                      ["unknown", "잔액 확인 필요"],
                    ]}
                  />
                </>
              )}
              <SelectControl
                label="정렬"
                value={sort}
                onChange={(value) => {
                  setSort(value)
                  setPage(1)
                }}
                options={[
                  ["dday", "D-day 임박순"],
                  ["risk", "리스크 높은순"],
                  ["amount", "통화별 금액 높은순"],
                  ["counterparty", "거래처명"],
                  ["eta", "ETA 임박순"],
                ]}
              />
              {lifecycle !== "all" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-white/25 bg-white/15 text-white"
                  onClick={() => {
                    setLifecycle("all")
                    setPage(1)
                  }}
                >
                  주문 결정:{" "}
                  {
                    {
                      open: "열림",
                      closed: "종결",
                      cancelled: "취소",
                      unknown: "미확인",
                    }[lifecycle]
                  }
                  <X className="size-3" />
                </Button>
              )}
              {(query ||
                lifecycle !== "all" ||
                counterparty !== "all" ||
                etaStart ||
                etaEnd ||
                pending !== "all" ||
                stage !== "active" ||
                assignee !== "all" ||
                risk !== "all" ||
                ops !== "all" ||
                (view === "finance" &&
                  Object.values(financeFilters).some(
                    (value) => value !== "all"
                  ))) && (
                <Button
                  variant="ghost"
                  className="text-white/80 hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    setQuery("")
                    setLifecycle("all")
                    setCounterparty("all")
                    setEtaStart("")
                    setEtaEnd("")
                    setPending("all")
                    setStage("active")
                    setAssignee("all")
                    setRisk("all")
                    setOps("all")
                    setFinanceFilters(defaultFinanceFilters)
                    setPage(1)
                  }}
                >
                  전체 해제
                </Button>
              )}
              {advancedFiltersOpen && (
                <div
                  id="deal-advanced-filters"
                  className="w-full space-y-2 border-t border-white/20 pt-3"
                >
                  {" "}
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="grid gap-1.5 text-xs text-white/70">
                      거래처
                      <select
                        aria-label="거래처"
                        className="h-9 w-full max-w-64 rounded-md border bg-background px-3 text-sm text-foreground"
                        value={counterparty}
                        onChange={(event) => {
                          setCounterparty(event.target.value)
                          setPage(1)
                        }}
                      >
                        <option value="all">전체</option>
                        {[...new Set(allDeals.map((deal) => deal.counterparty))]
                          .sort()
                          .map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className="grid gap-1.5 text-xs text-white/70">
                      기록된 ETA 시작
                      <Input
                        type="date"
                        aria-label="기록된 ETA 시작"
                        className="w-40"
                        value={etaStart}
                        max={etaEnd || undefined}
                        onChange={(event) => {
                          setEtaStart(event.target.value)
                          setPage(1)
                        }}
                      />
                    </label>
                    <label className="grid gap-1.5 text-xs text-white/70">
                      기록된 ETA 종료
                      <Input
                        type="date"
                        aria-label="기록된 ETA 종료"
                        className="w-40"
                        value={etaEnd}
                        min={etaStart || undefined}
                        onChange={(event) => {
                          setEtaEnd(event.target.value)
                          setPage(1)
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-white/70">
                    등록된 ETA 기준 조회입니다. 현재 잔액·현금 발생 기간을
                    의미하지 않습니다.
                  </p>
                </div>
              )}
            </BusinessListToolbar>
          }
          summary={
            <section aria-label="주요 거래 지표">
              <SummaryMetricStrip
                className="grid-cols-2"
                items={[
                  {
                    label: "오픈 오더",
                    value: (
                      <button
                        aria-label={`오픈 오더 ${filtered.filter((deal) => deal.orderLifecycle === "open").length}건 보기`}
                        onClick={() => {
                          setLifecycle("open")
                          setPage(1)
                        }}
                      >
                        {
                          filtered.filter(
                            (deal) => deal.orderLifecycle === "open"
                          ).length
                        }
                        건
                      </button>
                    ),
                    tone: "blue",
                    detail: "주문 결정이 열려 있는 거래",
                  },
                  {
                    label: "처리 대기",
                    value: (
                      <button
                        aria-label="처리 대기 문서 보기"
                        onClick={() => {
                          setPending("yes")
                          setPage(1)
                        }}
                      >
                        {filtered.reduce((sum, deal) => sum + deal.pending, 0)}
                        건
                      </button>
                    ),
                    tone: "warning",
                    detail: "확인이 필요한 문서",
                  },
                  {
                    label: "도착 임박",
                    value: (
                      <button
                        aria-label="도착 임박 거래 보기"
                        onClick={() => {
                          setOps("eta")
                          setPage(1)
                        }}
                      >
                        {filtered.filter(isDueSoon).length}건
                      </button>
                    ),
                    tone: "warning",
                    detail: "D-3 이내 도착 예정",
                  },
                  {
                    label: "연체",
                    value: (
                      <button
                        aria-label="연체 거래 보기"
                        onClick={() => {
                          setOps("overdue")
                          setPage(1)
                        }}
                      >
                        {filtered.filter((deal) => deal.overdue).length}건
                      </button>
                    ),
                    tone: "danger",
                    detail: "기한이 지난 거래",
                  },
                ]}
              />
            </section>
          }
        />
        <div
          aria-label="운영 거래 지표"
          className="flex flex-wrap items-center gap-2"
        >
          {[
            {
              label: "리스크",
              count: filtered.filter((deal) => deal.risks.length).length,
              active: risk === "active",
              select: () => setRisk(risk === "active" ? "all" : "active"),
            },
            {
              label: "미선적 잔량",
              count: filtered.filter((deal) => deal.remaining).length,
              active: ops === "remaining",
              select: () => setOps(ops === "remaining" ? "all" : "remaining"),
            },
            {
              label: "서류 갭",
              count: filtered.filter((deal) => deal.pending > 0).length,
              active: ops === "doc_gap",
              select: () => setOps(ops === "doc_gap" ? "all" : "doc_gap"),
            },
            {
              label: "수량 불일치",
              count: filtered.filter((deal) => deal.risks.includes("quantity"))
                .length,
              active: ops === "quantity",
              select: () => setOps(ops === "quantity" ? "all" : "quantity"),
            },
          ].map((item) => (
            <Button
              key={item.label}
              variant={item.active ? "secondary" : "outline"}
              size="sm"
              className={cn(
                "rounded-full",
                item.active && "border-primary/20 bg-primary/10 text-primary"
              )}
              aria-pressed={item.active}
              onClick={() => {
                item.select()
                setPage(1)
              }}
            >
              {item.label}
              <span className="tabular-nums">{item.count}</span>
            </Button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">
            현재 목록 기준
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            value={view}
            onValueChange={(value) => {
              setView(value)
              setPipeline(false)
              setPage(1)
            }}
            aria-label="거래 보기 방식"
          >
            <TabsList>
              <TabsTrigger value="operations">운영</TabsTrigger>
              <TabsTrigger value="finance">금융</TabsTrigger>
            </TabsList>
          </Tabs>
          <span className="ml-auto text-xs text-muted-foreground">
            {currentPage} / {totalPages} 페이지
          </span>
          <Button
            variant="outline"
            size="sm"
            aria-pressed={pipeline}
            onClick={() => {
              setPipeline((value) => !value)
              setView("operations")
            }}
          >
            {pipeline ? <List /> : <GitBranch />}
            {pipeline ? "업무표로 보기" : "영업 파이프라인"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {view === "finance"
            ? "송장·입출금은 누적 흐름, 받을 돈·줄 돈은 현재 잔액입니다. 통화별로 표시합니다."
            : "금액은 출처 문서 기준입니다. 근거가 없는 값은 —로 표시합니다."}
        </p>
        <section>
          {view === "finance" ? (
            <DealsFinanceTable
              hasRecords={allDeals.length > 0}
              filters={financeFilters}
              deals={visibleDeals}
              onOpenDeal={(id) => onOpenDeal(id, "finance")}
            />
          ) : pipeline ? (
            <div
              aria-label="영업 파이프라인"
              className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
            >
              {(Object.entries(stageLabels) as [DealStage, string][]).map(
                ([stageKey, label]) => {
                  const rows = filtered.filter(
                    (deal) => deal.stage === stageKey
                  )
                  return (
                    <section
                      key={stageKey}
                      className="rounded-lg border bg-muted/25 p-3"
                    >
                      <h3 className="mb-3 flex justify-between text-sm font-semibold">
                        {label}
                        <span className="text-muted-foreground">
                          {rows.length}건
                        </span>
                      </h3>
                      <div className="space-y-2">
                        {rows.map((deal) => (
                          <button
                            key={deal.id}
                            className="block w-full rounded-md border bg-background p-3 text-left hover:border-primary/50"
                            onClick={() => onOpenDeal(deal.id)}
                          >
                            <strong className="block text-sm">
                              {deal.counterparty}
                            </strong>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {prototypeBackend.deals.getTitle(
                                deal.id,
                                deal.title
                              )}
                            </span>
                            <span className="mt-2 block space-y-1 text-xs text-muted-foreground">
                              {dealStateDetails(deal).map((detail) => (
                                <span key={detail} className="block">
                                  {detail}
                                </span>
                              ))}
                            </span>
                            <span className="mt-3 block text-xs text-primary">
                              {deal.nextAction}
                            </span>
                          </button>
                        ))}
                        {!rows.length && (
                          <p className="py-6 text-center text-xs text-muted-foreground">
                            해당 단계의 거래가 없습니다.
                          </p>
                        )}
                      </div>
                    </section>
                  )
                }
              )}
            </div>
          ) : (
            <Table
              aria-label="거래 업무표"
              className="min-w-[1320px] table-fixed"
            >
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[21%]">
                    거래번호 / 설명 · 거래처
                  </TableHead>
                  <TableHead className="w-[13%]">품목 / 주문 이행</TableHead>
                  <TableHead className="w-[13%]">기준 금액 / 출처</TableHead>
                  <TableHead className="w-[17%]">현재 금융</TableHead>
                  <TableHead className="w-[10%]">D-day / ETA</TableHead>
                  <TableHead className="w-[6%]">담당자</TableHead>
                  <TableHead className="w-[18%]">
                    진행 상태 / 상세 정보
                  </TableHead>
                  <TableHead className="w-10">
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
                        <TableCell className="py-4 whitespace-normal">
                          <button
                            className="block w-full text-left"
                            onClick={(event) => {
                              event.stopPropagation()
                              onOpenDeal(deal.id)
                            }}
                          >
                            <span className="flex items-center gap-2">
                              <strong className="text-base font-semibold tracking-[-0.01em]">
                                {displayDealId}
                              </strong>
                              {deal.shared && (
                                <StatusBadge tone="blue">공유</StatusBadge>
                              )}
                            </span>
                            <span className="mt-1 block text-sm">
                              {displayDealTitle}
                            </span>
                          </button>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {deal.counterparty}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-normal">
                          <span className="text-xs font-medium">
                            {dealItemSummary(deal)}
                          </span>
                          {(() => {
                            const order = orderProgress(deal.id)
                            return order ? (
                              <>
                                <span className="mt-1 block text-xs">
                                  계약 {order.contracted} {order.unit} · 선적{" "}
                                  {order.shipped} {order.unit}
                                </span>
                                <span className="mt-1 block text-xs text-warning-foreground">
                                  잔량 {order.remaining} {order.unit} ·{" "}
                                  {order.state}
                                </span>
                              </>
                            ) : (
                              <small className="mt-1 block text-muted-foreground">
                                {deal.remaining
                                  ? `잔량 ${deal.remaining}`
                                  : "수량 근거 확인 필요"}
                              </small>
                            )
                          })()}
                        </TableCell>
                        <TableCell className="text-right! whitespace-normal tabular-nums">
                          {(() => {
                            const ref = referenceAmount(deal.id)
                            return ref ? (
                              <>
                                <strong className="text-xs">
                                  {exactFinanceMoney(ref.amount, ref.currency)}
                                </strong>
                                <small className="mt-1 block break-all text-muted-foreground">
                                  {ref.document} · {ref.state}
                                </small>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                — · 출처 확인 필요
                              </span>
                            )
                          })()}
                        </TableCell>
                        <TableCell className="text-right! whitespace-normal tabular-nums">
                          {filteredFinanceFacts(
                            deal.id,
                            deal.currency,
                            defaultFinanceFilters
                          ).map((fact) => {
                            const finance = presentFinanceFact(fact)
                            return (
                              <div
                                key={fact.currency}
                                className="mb-1 text-xs leading-relaxed"
                              >
                                <span className="block">
                                  받을 돈{" "}
                                  {finance.receivable === "—"
                                    ? `${fact.currency} —`
                                    : finance.receivable}
                                </span>
                                <span className="block">
                                  줄 돈{" "}
                                  {finance.payable === "—"
                                    ? `${fact.currency} —`
                                    : finance.payable}
                                </span>
                                {finance.adjustedResult === "—" && (
                                  <span className="block text-warning-foreground">
                                    손익 근거 확인 필요
                                  </span>
                                )}
                              </div>
                            )
                          })}
                          <button
                            className="text-xs text-primary hover:underline"
                            onClick={(event) => {
                              event.stopPropagation()
                              onOpenDeal(deal.id, "finance")
                            }}
                          >
                            금융 상세 열기
                          </button>
                        </TableCell>
                        <TableCell className="tabular-nums">
                          <strong
                            className={cn(
                              "font-medium",
                              deal.dday.includes("+") && "text-destructive"
                            )}
                          >
                            {deal.dday}
                          </strong>
                          <small className="mt-1 block text-muted-foreground">
                            ETA {deal.eta.replaceAll(".", "-")}
                          </small>
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-xs",
                            deal.assignee === "미배정" &&
                              "text-warning-foreground"
                          )}
                        >
                          {deal.assignee}
                        </TableCell>
                        <TableCell className="whitespace-normal">
                          <div aria-label={`${displayDealId} 상태별 상세`}>
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
                            <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                              {dealStateDetails(deal).map((detail) => (
                                <p key={detail}>{detail}</p>
                              ))}
                            </div>
                            <button
                              className="mt-2 text-left text-xs font-medium text-primary hover:underline"
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
                            {deal.risks.length > 0 && (
                              <small className="mt-1 block text-warning-foreground">
                                {deal.risks
                                  .map((risk) => riskLabels[risk])
                                  .join(" · ")}
                              </small>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="mx-auto text-muted-foreground"
                                aria-label={`${displayDealId} 거래 메뉴`}
                                onClick={(event) => event.stopPropagation()}
                              >
                                <MoreVertical className="size-4" />
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
                                  className="text-destructive focus:text-destructive"
                                  onSelect={() => {
                                    setArchiveError("")
                                    setArchiveTarget(deal)
                                  }}
                                >
                                  <Trash2 className="size-4" />
                                  삭제
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
                      <Empty className="min-h-40">
                        <EmptyHeader>
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
        {!pipeline && (
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
        )}

        {role === "owner" ? (
          <section className="border-t pt-4">
            <Button
              variant="ghost"
              className="h-auto w-full justify-between rounded-none px-0 py-2"
              onClick={() => setArchiveOpen((value) => !value)}
            >
              <span className="flex items-center gap-2">
                <Archive className="size-4" />
                삭제된 거래 보기
                <StatusBadge>{archivedDeals.length}</StatusBadge>
                <StatusBadge>Owner</StatusBadge>
              </span>
              <ChevronRight
                className={cn("size-4 transition", archiveOpen && "rotate-90")}
              />
            </Button>
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
                          {deal.counterparty} · 삭제된 거래 · 이력 보존
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
                    삭제된 거래가 없습니다.
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
            <AlertDialogTitle>거래를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              현재 거래 목록과 집계에서 제외됩니다. 연결 문서와 처리 이력은
              삭제하지 않으며, Owner가 삭제된 거래 목록에서 복구할 수 있습니다.
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
              variant="destructive"
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
                      "거래를 삭제하지 못했습니다. 현재 상태를 유지한 채 다시 시도해주세요."
                    )
                  })
                  .finally(() => setArchivePending(false))
              }}
            >
              {archivePending ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : null}
              {archivePending ? "삭제 처리 중" : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

const dealDocuments = [
  {
    code: "PO",
    label: "발주서",
    status: "보유",
    source: "수신",
    file: "PO-260704-18.pdf",
  },
  {
    code: "SC",
    label: "판매계약서",
    status: "발행",
    source: "발행",
    file: "SC-2026-0708.pdf",
  },
  {
    code: "CI",
    label: "상업송장",
    status: "보유",
    source: "수신",
    file: "Invoice_HB-2607-003.pdf",
  },
  {
    code: "PL",
    label: "포장명세서",
    status: "보유",
    source: "수신",
    file: "PackingList_0707.pdf",
  },
  { code: "BL", label: "선하증권", status: "미비", source: "-", file: "" },
]

function downloadDealDocument(filename: string) {
  const safeName = filename.replace(/[()\\]/g, "").replace(/[^\x20-\x7e]/g, "_")
  const stream = [
    "BT",
    "/F1 20 Tf",
    "72 720 Td",
    "(ECOYA Trade OS Trade Document) Tj",
    "0 -34 Td",
    "/F1 12 Tf",
    `(File: ${safeName}) Tj`,
    "0 -24 Td",
    "(Downloaded from Deal Detail.) Tj",
    "ET",
  ].join("\n")
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ]
  let pdf = "%PDF-1.4\n"
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }))
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function DealPdfViewer({
  document,
}: {
  document: (typeof dealDocuments)[number]
}) {
  const [page, setPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const pageCount = document.code === "PO" ? 2 : 1

  useEffect(() => {
    if (!isFullscreen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFullscreen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isFullscreen])

  const download = () => {
    if (isDownloading) return
    setIsDownloading(true)
    window.setTimeout(() => {
      downloadDealDocument(document.file)
      setIsDownloading(false)
    }, 350)
  }

  return (
    <div
      className={cn(
        "relative mt-4 flex h-[510px] min-h-0 flex-col overflow-hidden border bg-background",
        isFullscreen &&
          "fixed inset-0 z-[120] m-0 h-screen w-screen border-0 bg-background"
      )}
      role={isFullscreen ? "dialog" : undefined}
      aria-modal={isFullscreen ? "true" : undefined}
      aria-label={
        isFullscreen ? `${document.label} 전체 화면 미리보기` : undefined
      }
    >
      <div className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b bg-background px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <FileSearch className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0">
            <span className="block text-[11px] text-muted-foreground">
              {document.label}
            </span>
            <strong className="block truncate text-xs">{document.file}</strong>
          </span>
        </div>
        <PdfViewerToolbar
          zoom={zoom}
          onZoomChange={setZoom}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen((value) => !value)}
          isDownloading={isDownloading}
          onDownload={download}
        />
      </div>
      <PannablePdfViewport
        zoom={zoom}
        className={cn(
          "field-scrollbar flex min-h-0 flex-1 justify-center px-4 pt-5 pb-20"
        )}
      >
        <div
          className={cn(
            "h-fit w-[310px] shrink-0 border bg-white p-7 text-[#242424] shadow-sm transition-transform",
            isFullscreen && "min-h-[1018px] w-[720px] p-14"
          )}
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
          }}
          data-deal-document-paper
        >
          <div className="flex items-start justify-between border-b pb-5">
            <div>
              <span className="text-[10px] font-semibold tracking-[0.18em] text-primary">
                ECOYA DEMO CO.
              </span>
              <h4
                className={cn(
                  "mt-2 font-semibold",
                  isFullscreen ? "text-3xl" : "text-xl"
                )}
              >
                {document.code === "PO" ? "PURCHASE ORDER" : document.label}
              </h4>
            </div>
            <div className="text-right text-[10px] leading-5 text-[#666]">
              <strong className="block text-[#242424]">
                {document.code}-260704-18
              </strong>
              2026.07.04
            </div>
          </div>
          {page === 1 ? (
            <>
              <div className="mt-6 grid grid-cols-2 gap-5 text-[10px]">
                <div>
                  <span className="text-[#777]">SUPPLIER</span>
                  <strong className="mt-1 block text-xs">
                    KATAMAN ASIA-PACIFIC
                  </strong>
                  <p className="mt-1 leading-4 text-[#666]">
                    160 Robinson Road
                    <br />
                    Singapore 068914
                  </p>
                </div>
                <div>
                  <span className="text-[#777]">SHIP TO</span>
                  <strong className="mt-1 block text-xs">ECOYA Demo Co.</strong>
                  <p className="mt-1 leading-4 text-[#666]">
                    Incheon, Korea
                    <br />
                    CIF Incheon
                  </p>
                </div>
              </div>
              <div className="mt-6 overflow-hidden rounded-sm border text-[9px]">
                <div className="grid grid-cols-[1fr_42px_70px_74px] bg-[#f5f5f3] px-2 py-2 font-semibold">
                  <span>DESCRIPTION</span>
                  <span>QTY</span>
                  <span>UNIT PRICE</span>
                  <span>AMOUNT</span>
                </div>
                {[
                  "Aluminium Scrap Tough Taboo",
                  "Ocean freight",
                  "Insurance",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="grid grid-cols-[1fr_42px_70px_74px] border-t px-2 py-3"
                  >
                    <span>{item}</span>
                    <span>{index ? "1" : "20 MT"}</span>
                    <span>
                      {index === 0
                        ? "120,000"
                        : index === 1
                          ? "48,000"
                          : "6,200"}
                    </span>
                    <span>
                      {index === 0
                        ? "2,400,000"
                        : index === 1
                          ? "48,000"
                          : "6,200"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 ml-auto w-44 text-[10px]">
                <div className="flex justify-between border-b py-2">
                  <span>SUBTOTAL</span>
                  <strong>2,454,200 USD</strong>
                </div>
                <div className="flex justify-between py-2 text-xs">
                  <span>TOTAL</span>
                  <strong>2,454,200 USD</strong>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-7 text-[10px] leading-5">
              <h5 className="text-sm font-semibold">TERMS & CONDITIONS</h5>
              <div className="mt-4 flex flex-col gap-4 text-[#555]">
                <p>
                  <strong className="text-[#242424]">Payment</strong>
                  <br />
                  10% advance before shipment, balance by wire transfer against
                  copies of documents.
                </p>
                <p>
                  <strong className="text-[#242424]">Shipment</strong>
                  <br />
                  Latest shipment date 23/08/2026. Partial shipment is allowed.
                </p>
                <p>
                  <strong className="text-[#242424]">Documents required</strong>
                  <br />
                  Commercial Invoice, Packing List, Weight Certificate, Bill of
                  Lading, Insurance Certificate.
                </p>
              </div>
              <div className="mt-16 grid grid-cols-2 gap-12">
                <div className="border-t pt-2">Authorized signature</div>
                <div className="border-t pt-2">Supplier confirmation</div>
              </div>
            </div>
          )}
        </div>
      </PannablePdfViewport>
      <PdfFloatingControls
        page={page}
        pageCount={pageCount}
        zoom={zoom}
        onPageChange={setPage}
        onZoomChange={setZoom}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen((value) => !value)}
        isDownloading={isDownloading}
        onDownload={download}
        variant="pager"
      />
    </div>
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

function MetricRow({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t py-3 first:border-t-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">
        {value}
        {detail ? (
          <small className="mt-1 block font-normal text-muted-foreground">
            {detail}
          </small>
        ) : null}
      </span>
    </div>
  )
}

function OverviewTab({
  deal,
  onOpenTab,
}: {
  deal: Deal
  onOpenTab: (tab: string) => void
}) {
  const [riskDismissed, setRiskDismissed] = useState(false)
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="flex flex-col gap-6">
        <section className="border-b pb-5">
          <SectionHeading
            title="운영 현황"
            description="받은 서류부터 정산까지 현재 진행과 다음 작업입니다."
          />
          <div className="mt-4 grid gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["받은 서류", "5 / 6건", "PL·CI 확인"],
              ["발행 서류", "확정 1건", "SC-2026-0708"],
              ["선박 · 도착", "출항", `ETA ${deal.eta.slice(5)}`],
              ["통관", deal.stage === "customs" ? "서류 접수" : "시작 전", ""],
              [
                "정산",
                deal.overdue ? "연체" : "예정",
                `${deal.currency} ${deal.amount}`,
              ],
            ].map(([label, value, detail]) => (
              <div key={label} className="bg-background p-3">
                <span className="text-xs text-muted-foreground">{label}</span>
                <strong className="mt-2 block text-sm">{value}</strong>
                <small className="mt-1 block text-xs text-muted-foreground">
                  {detail}
                </small>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b pb-5">
          <SectionHeading
            title="필요 서류 체크"
            description="수신 문서와 발행 문서를 함께 반영합니다."
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenTab("documents")}
              >
                서류에서 보기
                <ArrowUpRight data-icon="inline-end" />
              </Button>
            }
          />
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {dealDocuments.map((document) => (
              <div
                key={document.code}
                className="flex items-center justify-between rounded-md border px-3 py-2.5"
              >
                <span>
                  <strong className="text-sm">
                    {document.code} · {document.label}
                  </strong>
                  <small className="mt-0.5 block text-xs text-muted-foreground">
                    {document.source}
                  </small>
                </span>
                <StatusBadge
                  tone={
                    document.status === "미비"
                      ? "warning"
                      : document.status === "발행"
                        ? "blue"
                        : "success"
                  }
                >
                  {document.status}
                </StatusBadge>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading
            title="딜 요약 브리프"
            description="확인된 문서와 거래 상태를 바탕으로 자동 정리했습니다."
          />
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            KATAMAN과의 CIF 인천 조건 수입 거래입니다. 계약 수량 20MT 중 16MT가
            선적되었고, 현재 CI와 계약 금액 차이 및 잔량 4MT 확인이 필요합니다.
            ETA는 8월 3일이며 결제 전 B/L 중량 대조가 우선입니다.
          </p>
        </section>
      </div>

      <div className="flex flex-col gap-6 border-l pl-6">
        <section>
          <SectionHeading title="상업조건" />
          <div className="mt-3">
            <MetricRow
              label="거래 금액"
              value={`${deal.amount} ${deal.currency}`}
            />
            <MetricRow label="인코텀즈" value="CIF Incheon" />
            <MetricRow
              label="결제"
              value="T/T 10% advance"
              detail="잔금: 선적서류 사본 수령 후"
            />
            <MetricRow label="데이터 기준" value="2026.07.11 09:30" />
          </div>
        </section>
        <section className="border-t pt-5">
          <SectionHeading
            title="리스크"
            action={
              <StatusBadge tone={riskDismissed ? "neutral" : "danger"}>
                {riskDismissed ? "허용 처리" : `${deal.risks.length}건`}
              </StatusBadge>
            }
          />
          {!riskDismissed ? (
            <div className="mt-3 rounded-md border border-destructive/25 bg-destructive/5 p-3">
              <strong className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="size-4" />
                금액·수량 불일치
              </strong>
              <p className="mt-1.5 text-sm text-muted-foreground">
                CI 금액과 계약 합계가 다르고, 선적 누적 수량이 계약보다 4MT
                적습니다.
              </p>
              <Button
                className="mt-3"
                size="sm"
                variant="outline"
                onClick={() => setRiskDismissed(true)}
              >
                <ShieldCheck data-icon="inline-start" />
                사유와 함께 허용
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              허용 오차 범위 내로 처리되었습니다. 기록은 감사 이력에 남습니다.
            </p>
          )}
        </section>
        <section className="border-t pt-5">
          <SectionHeading title="딜 건강도" />
          <div className="mt-4 flex items-center gap-4">
            <strong className="text-3xl font-semibold text-warning-foreground">
              72
            </strong>
            <div className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[72%] bg-warning" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                서류 86 · 대조 58 · 결제 70 · 선적 74 · 마진 68
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function DocumentsTab({ onUpload }: { onUpload: () => void }) {
  const [selected, setSelected] = useState(dealDocuments[0])
  const [query, setQuery] = useState("")
  const [unlinked, setUnlinked] = useState<string[]>([])
  const visibleDocuments = dealDocuments.filter(
    (document) => !unlinked.includes(document.code)
  )
  const comparisonRows = [
    ["수량", "20 MT", "20 MT", "20 MT", "16 MT", "불일치"],
    ["금액", "2,400,000.00", "2,400,000.00", "2,566,000.00", "-", "불일치"],
    ["통화", "USD", "USD", "USD", "-", "일치"],
    ["인코텀즈", "CIF", "CIF", "CIF", "-", "일치"],
  ]

  return (
    <div className="grid min-h-[560px] gap-0 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="pr-6">
        <SectionHeading
          title="서류·검증"
          description="연결 문서, 필요 서류와 교차 대조 결과를 확인합니다."
          action={
            <Button variant="outline" onClick={onUpload}>
              <FilePlus2 data-icon="inline-start" />
              서류 추가
            </Button>
          }
        />
        <div className="relative mt-4">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="이 거래의 Confirm 문서에서 검색"
          />
        </div>
        <div className="mt-4">
          <Table className="min-w-[620px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[72px] text-left">종류</TableHead>
                <TableHead className="text-left">문서</TableHead>
                <TableHead className="w-[92px]">상태</TableHead>
                <TableHead className="w-[92px] text-left">출처</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleDocuments.map((document) => (
                <TableRow
                  key={document.code}
                  data-clickable="true"
                  data-state={
                    selected.code === document.code ? "selected" : undefined
                  }
                  tabIndex={0}
                  className="cursor-pointer focus-visible:relative focus-visible:z-10 focus-visible:[box-shadow:var(--shadow-keyboard-focus)] focus-visible:outline-none"
                  onClick={() => setSelected(document)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      setSelected(document)
                    }
                  }}
                >
                  <TableCell className="text-left font-semibold">
                    {document.code}
                  </TableCell>
                  <TableCell className="text-left whitespace-normal">
                    <span className="block font-medium">
                      {document.file || document.label}
                    </span>
                    <small className="text-xs text-muted-foreground">
                      {document.label}
                    </small>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      tone={document.status === "미비" ? "warning" : "success"}
                    >
                      {document.status}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="text-left text-xs text-muted-foreground">
                    {document.source}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-6">
          <SectionHeading
            title="서류 대조 (5-Way Match)"
            description="PO·계약·송장·포장명세·B/L의 동일 항목을 비교합니다."
          />
          <div className="mt-3">
            <Table className="min-w-[680px] table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px] text-left">항목</TableHead>
                  <TableHead>PO</TableHead>
                  <TableHead>SC</TableHead>
                  <TableHead>CI</TableHead>
                  <TableHead>PL/B/L</TableHead>
                  <TableHead className="w-[90px]">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonRows.map((row) => (
                  <TableRow key={row[0]}>
                    {row.slice(0, 5).map((cell, index) => (
                      <TableCell
                        key={`${row[0]}-${index}`}
                        className={
                          index === 0
                            ? "text-left font-medium"
                            : "text-muted-foreground"
                        }
                      >
                        {cell}
                      </TableCell>
                    ))}
                    <TableCell>
                      <StatusBadge
                        tone={row[5] === "일치" ? "success" : "danger"}
                      >
                        {row[5]}
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
      <aside className="border-l pl-6">
        <SectionHeading
          title="문서 상세"
          description={selected.file || "연결된 파일 없음"}
        />
        {selected.file ? (
          <>
            <DealPdfViewer key={selected.code} document={selected} />
            <Button
              variant="outline"
              className="mt-3 w-full"
              onClick={() => setUnlinked((items) => [...items, selected.code])}
            >
              <Link2 data-icon="inline-start" />
              거래에서 연결 해제
            </Button>
          </>
        ) : (
          <div className="mt-4 grid min-h-64 place-items-center border border-dashed text-center">
            <div>
              <CircleAlert className="mx-auto size-7 text-warning-foreground" />
              <strong className="mt-3 block text-sm">
                아직 문서가 없습니다
              </strong>
              <Button className="mt-3" onClick={onUpload}>
                파일 올리기
              </Button>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

function FulfillmentTab() {
  const [lifecycle, setLifecycle] = useState("open")
  const [refreshing, setRefreshing] = useState(false)
  const refresh = () => {
    if (refreshing) return
    setRefreshing(true)
    window.setTimeout(() => setRefreshing(false), 900)
  }
  const shipmentRows = [
    ["014W-01", "HMM Green", "Busan → Incheon", "07.20", "08.03", "출항"],
    ["014W-02", "ONE Harmony", "Melbourne → Busan", "07.27", "08.11", "부킹"],
  ]

  return (
    <div className="flex flex-col gap-7">
      <section>
        <SectionHeading
          title="주문 이행"
          description="계약 20MT · 누적 선적 16MT"
          action={
            <StatusBadge tone={lifecycle === "open" ? "warning" : "success"}>
              {lifecycle === "open" ? "추가 선적 대기" : "마감됨"}
            </StatusBadge>
          }
        />
        <div className="mt-5 grid items-center gap-5 md:grid-cols-[1fr_auto]">
          <div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[80%] bg-primary" />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>누적 16 MT</span>
              <span>잔여 4 MT</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLifecycle("closed")}
            >
              완료 마감
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLifecycle("short_closed")}
            >
              미달 마감
            </Button>
            <Button size="sm" variant="outline">
              단가 수정
            </Button>
            <Button size="sm" variant="outline">
              취소
            </Button>
          </div>
        </div>
      </section>
      <Separator />
      <section>
        <SectionHeading
          title="선적 진행 (분할선적)"
          description="이 계약의 B/L 2건"
          action={
            <Button
              size="sm"
              variant="outline"
              disabled={refreshing}
              onClick={refresh}
            >
              <RefreshCw
                data-icon="inline-start"
                className={cn(refreshing && "animate-spin")}
              />
              {refreshing ? "갱신 중" : "새로고침"}
            </Button>
          }
        />
        <div className="mt-4">
          <Table className="min-w-[820px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px] text-left">B/L</TableHead>
                <TableHead className="w-[140px] text-left">선사</TableHead>
                <TableHead className="text-left">구간</TableHead>
                <TableHead className="w-[110px]">ETD</TableHead>
                <TableHead className="w-[110px]">ETA</TableHead>
                <TableHead className="w-[110px]">상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipmentRows.map((row) => (
                <TableRow key={row[0]}>
                  {row.slice(0, 5).map((cell, index) => (
                    <TableCell
                      key={`${row[0]}-${index}`}
                      className={
                        index < 2
                          ? "text-left font-medium"
                          : index === 2
                            ? "text-left text-muted-foreground"
                            : "text-muted-foreground"
                      }
                    >
                      {cell}
                    </TableCell>
                  ))}
                  <TableCell>
                    <StatusBadge tone={row[5] === "출항" ? "blue" : "neutral"}>
                      {row[5]}
                    </StatusBadge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          마지막 갱신 2026.07.11 09:30 · 1건 자동 추적, 1건 수동 입력
        </p>
      </section>
      <Separator />
      <section>
        <SectionHeading title="주문 이력" />
        <div className="mt-3 flex flex-col gap-3 border-l-2 pl-4 text-sm">
          <div>
            <strong>가격 수정</strong>
            <span className="ml-2 text-muted-foreground">
              USD 120,000/MT · 07.09 조민영
            </span>
          </div>
          <div>
            <strong>선적 1건 연결</strong>
            <span className="ml-2 text-muted-foreground">
              B/L 014W-01 · 07.08 시스템
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

function FinanceTab({ deal }: { deal: Deal }) {
  const [costs, setCosts] = useState([
    { type: "운임", amount: "48,000", currency: "USD", source: "CI-2607-003" },
    { type: "보험", amount: "6,200", currency: "USD", source: "수동 입력" },
  ])
  return (
    <div className="grid gap-7 xl:grid-cols-[1fr_0.85fr]">
      <div className="flex flex-col gap-7">
        <section>
          <SectionHeading
            title="거래 경제"
            description="확정·발송 송장과 additive 비용 기준입니다."
            action={<StatusBadge tone="warning">GP 검토 필요</StatusBadge>}
          />
          <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border md:grid-cols-3">
            <div className="bg-background p-4">
              <span className="text-xs text-muted-foreground">매출</span>
              <strong className="mt-2 block">2,566,000 USD</strong>
            </div>
            <div className="bg-background p-4">
              <span className="text-xs text-muted-foreground">매입</span>
              <strong className="mt-2 block">2,400,000 USD</strong>
            </div>
            <div className="bg-background p-4">
              <span className="text-xs text-muted-foreground">Landed cost</span>
              <strong className="mt-2 block">54,200 USD</strong>
            </div>
            <div className="bg-background p-4">
              <span className="text-xs text-muted-foreground">GP</span>
              <strong className="mt-2 block">166,000 USD</strong>
            </div>
            <div className="bg-background p-4">
              <span className="text-xs text-muted-foreground">조정 GP</span>
              <strong className="mt-2 block text-warning">111,800 USD</strong>
            </div>
            <div className="bg-background p-4">
              <span className="text-xs text-muted-foreground">마진율</span>
              <strong className="mt-2 block">4.4%</strong>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            마진이 검토 기준보다 낮습니다. 운임·관세와 결제 조건을 확인하세요.
          </p>
        </section>
        <Separator />
        <section>
          <SectionHeading
            title="거래처 신용 현황"
            description={`${deal.counterparty}의 전체 거래 기준`}
          />
          <div className="mt-3">
            <MetricRow label="받을 돈" value="182,000 USD" />
            <MetricRow label="줄 돈" value="0 USD" />
            <MetricRow label="연체" value="24,000 USD" detail="12일 경과" />
          </div>
        </section>
      </div>
      <aside className="border-l pl-6">
        <SectionHeading
          title="원가 입력"
          description="운임·관세·보험 등 착륙원가를 관리합니다."
          action={
            <Button
              size="sm"
              onClick={() =>
                setCosts((items) => [
                  ...items,
                  {
                    type: "관세",
                    amount: "12,000",
                    currency: deal.currency,
                    source: "수동 입력",
                  },
                ])
              }
            >
              <Plus data-icon="inline-start" />
              추가
            </Button>
          }
        />
        <div className="mt-4 border-y">
          {costs.map((cost, index) => (
            <div
              key={`${cost.type}-${index}`}
              className="flex items-center justify-between gap-3 border-t py-3 first:border-t-0"
            >
              <span>
                <strong className="text-sm">{cost.type}</strong>
                <small className="mt-1 block text-xs text-muted-foreground">
                  {cost.source}
                </small>
              </span>
              <span className="text-right">
                <strong className="text-sm">
                  {cost.amount} {cost.currency}
                </strong>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setCosts((items) =>
                      items.filter((_, itemIndex) => itemIndex !== index)
                    )
                  }
                  aria-label="원가 삭제"
                >
                  <Trash2 />
                </Button>
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">원가 합계</span>
          <strong>66,200 USD</strong>
        </div>
      </aside>
    </div>
  )
}

function PeopleTab() {
  const [notes, setNotes] = useState([
    "7월 15일까지 B/L 원본 요청",
    "잔금 지급 전 계좌 변경 여부 재확인",
  ])
  const [note, setNote] = useState("")
  const [shared, setShared] = useState(["박서윤", "김도현"])
  const parties = [
    ["매도자", "KATAMAN ASIA-PACIFIC PTE LTD"],
    ["매수자", "ECOYA Demo Co."],
    ["송하인", "KATAMAN Australia"],
    ["수하인", "ECOYA Demo Co."],
    ["포워더", "HMM Logistics"],
    ["은행", "JPMorgan Chase Singapore"],
  ]
  return (
    <div className="grid gap-7 xl:grid-cols-2">
      <div className="flex flex-col gap-7">
        <section>
          <SectionHeading title="당사자 (역할별)" />
          <div className="mt-3 border-y">
            {parties.map(([role, name]) => (
              <div
                key={role}
                className="grid grid-cols-[110px_1fr_auto] items-center gap-3 border-t py-3 first:border-t-0"
              >
                <span className="text-sm text-muted-foreground">{role}</span>
                <strong className="text-sm">{name}</strong>
                <Button variant="ghost" size="sm">
                  편집
                </Button>
              </div>
            ))}
          </div>
        </section>
        <Separator />
        <section>
          <SectionHeading
            title="영업 담당자"
            action={
              <Button size="sm" variant="outline">
                <Plus data-icon="inline-start" />
                연결
              </Button>
            }
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge tone="blue">조민영 · 관리자</StatusBadge>
            <StatusBadge>Sarah Lim · 업체 담당자</StatusBadge>
          </div>
        </section>
      </div>
      <div className="flex flex-col gap-7 border-l pl-6">
        <section>
          <SectionHeading
            title="공유 대상"
            description="이 거래를 함께 볼 수 있는 조직 멤버입니다."
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {shared.map((member) => (
              <Button
                key={member}
                variant="secondary"
                size="sm"
                className="rounded-full"
                onClick={() =>
                  setShared((items) => items.filter((item) => item !== member))
                }
              >
                {member}
                <X data-icon="inline-end" className="size-3" />
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setShared((items) =>
                  items.includes("이민지") ? items : [...items, "이민지"]
                )
              }
            >
              <UsersRound data-icon="inline-start" />
              멤버 공유
            </Button>
          </div>
        </section>
        <Separator />
        <section>
          <SectionHeading title="노트" />
          <div className="mt-3 flex flex-col gap-3">
            {notes.map((item, index) => (
              <div key={`${item}-${index}`} className="border-l-2 pl-3 text-sm">
                <p>{item}</p>
                <small className="mt-1 block text-muted-foreground">
                  조민영 · 2026.07.11
                </small>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="고객 요청, 합의 사항, 특이사항"
            />
            <Button
              className="self-end"
              disabled={!note.trim()}
              onClick={() => {
                setNotes((items) => [...items, note.trim()])
                setNote("")
              }}
            >
              <MessageSquareText data-icon="inline-start" />
              노트 추가
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

export function LegacyDealDetailScreen({
  dealId,
  onBack,
  onCreateDocument,
  onUpload,
  onDeliver,
}: {
  dealId: string
  onBack: () => void
  onCreateDocument: () => void
  onUpload: () => void
  onDeliver: () => void
}) {
  const deal = deals.find((item) => item.id === dealId) ?? deals[0]
  const [tab, setTab] = useState("overview")
  const [assignee, setAssignee] = useState(deal.assignee)
  const [issueFlagged, setIssueFlagged] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const refresh = () => {
    setRefreshing(true)
    window.setTimeout(() => setRefreshing(false), 800)
  }

  return (
    <div className="field-scrollbar h-full overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-[1540px] px-6 py-5">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft data-icon="inline-start" />
          목록으로
        </Button>
        <section className="mt-3 flex flex-wrap items-start justify-between gap-5 border-b pb-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {deal.id}
              </span>
              <StatusBadge tone="blue">{stageLabels[deal.stage]}</StatusBadge>
              {deal.risks.length ? (
                <StatusBadge tone="danger">
                  리스크 {deal.risks.length}
                </StatusBadge>
              ) : (
                <StatusBadge tone="success">리스크 없음</StatusBadge>
              )}
            </div>
            <h1 className="mt-2 truncate text-2xl font-semibold">
              {deal.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {deal.counterparty}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={assignee}
              onValueChange={(value) => setAssignee(value ?? assignee)}
            >
              <SelectTrigger className="h-9">
                <UserRound className="size-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {["조민영", "박서윤", "김도현", "미배정"].map((member) => (
                  <SelectItem key={member} value={member}>
                    {member}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={onCreateDocument}>
              <FilePlus2 data-icon="inline-start" />
              문서 만들기
            </Button>
            <Button onClick={onDeliver}>
              <Send data-icon="inline-start" />
              고객에게 전달
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="더보기">
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setIssueFlagged(true)}>
                  <AlertTriangle />
                  {issueFlagged ? "이슈 접수됨" : "이슈 플래그"}
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive">
                  <Trash2 />
                  거래 삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-4 border-b bg-warning/5 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <CircleAlert className="size-5 shrink-0 text-warning-foreground" />
            <div>
              <strong className="text-sm">다음 작업 · {deal.nextAction}</strong>
              <p className="mt-0.5 text-xs text-muted-foreground">
                거래 위험과 D-day를 기준으로 계산된 권장 작업입니다.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              deal.nextKind === "upload"
                ? onUpload()
                : deal.nextKind === "create"
                  ? onCreateDocument()
                  : setTab(
                      deal.nextKind === "reconcile" ? "documents" : "overview"
                    )
            }
          >
            진행하기
            <ArrowUpRight data-icon="inline-end" />
          </Button>
        </section>

        <SummaryMetricStrip
          items={[
            {
              label: "가장 빠른 ETA",
              value: deal.eta.slice(5).replace("-", "."),
            },
            { label: "받을 돈", value: "166,000.00 USD" },
            { label: "줄 돈", value: "54,200.00 USD" },
            { label: "선적", value: "2건" },
          ]}
        />

        <Tabs value={tab} onValueChange={setTab} className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList className="h-10">
              <TabsTrigger value="overview">개요</TabsTrigger>
              <TabsTrigger value="documents">서류·검증</TabsTrigger>
              <TabsTrigger value="fulfillment">이행·선적</TabsTrigger>
              <TabsTrigger value="finance">재무·수익성</TabsTrigger>
              <TabsTrigger value="people">관계자</TabsTrigger>
            </TabsList>
            <Button
              variant="ghost"
              size="sm"
              disabled={refreshing}
              onClick={refresh}
            >
              <RefreshCw
                data-icon="inline-start"
                className={cn(refreshing && "animate-spin")}
              />
              {refreshing ? "갱신 중" : "09:30 기준"}
            </Button>
          </div>
          <TabsContent value="overview" className="py-6">
            <OverviewTab deal={deal} onOpenTab={setTab} />
          </TabsContent>
          <TabsContent value="documents" className="py-6">
            <DocumentsTab onUpload={onUpload} />
          </TabsContent>
          <TabsContent value="fulfillment" className="py-6">
            <FulfillmentTab />
          </TabsContent>
          <TabsContent value="finance" className="py-6">
            <FinanceTab deal={deal} />
          </TabsContent>
          <TabsContent value="people" className="py-6">
            <PeopleTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export {
  DealDetailScreen,
  type GeneratedDealDocumentSummary,
} from "./deal-detail-prototype"

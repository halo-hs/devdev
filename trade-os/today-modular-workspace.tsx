import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"
import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  FileCheck2,
  FileText,
  GripVertical,
  LayoutDashboard,
  MoreVertical,
  X,
  RefreshCw,
  Ship,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@shared/components/ui/badge"
import { Button } from "@shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@shared/components/ui/resizable"
import type { ErpMenuTarget } from "@trade-os/erp-menu-prototypes"
import { useIsCompactWorkspace } from "@shared/hooks/use-mobile"
import { cn } from "@shared/lib/utils"

type Navigate = (screen: ErpMenuTarget) => void
type ModuleId =
  "tasks" | "documents" | "settlement" | "schedule" | "shipments" | "summary"
type ModuleSize = { columns: number; rows: number }
type ModulePlacement = ModuleSize & {
  id: ModuleId
  column: number
  row: number
}
type DropEdge = "top" | "right" | "bottom" | "left"
type DropTarget = { id: ModuleId; edge: DropEdge | null }
type LayoutMode = "auto" | "split"
type ModuleContentState = "default" | "empty"
type SplitLayout = Record<string, number>
type SplitLayoutKey = "root" | "left" | "leftBottom" | "middle"

type ModuleDefinition = {
  id: ModuleId
  title: string
  count: string
  icon: LucideIcon
}

const moduleDefinitions: ModuleDefinition[] = [
  { id: "tasks", title: "작업함", count: "4건", icon: FileCheck2 },
  { id: "documents", title: "진행 현황·받을 돈", count: "", icon: FileText },
  {
    id: "settlement",
    title: "오늘 확인이 필요합니다",
    count: "2건",
    icon: CircleDollarSign,
  },
  { id: "schedule", title: "일정", count: "3건", icon: CalendarDays },
  { id: "shipments", title: "선적 일정", count: "3건", icon: Ship },
  { id: "summary", title: "업무 요약", count: "", icon: LayoutDashboard },
]

const defaultModules: ModuleId[] = [
  "tasks",
  "documents",
  "settlement",
  "schedule",
  "shipments",
  "summary",
]

const defaultModuleSizes: Record<ModuleId, ModuleSize> = {
  tasks: { columns: 3, rows: 6 },
  documents: { columns: 3, rows: 6 },
  settlement: { columns: 2, rows: 4 },
  schedule: { columns: 2, rows: 4 },
  shipments: { columns: 2, rows: 4 },
  summary: { columns: 6, rows: 3 },
}

const moduleSizeLimits: Record<ModuleId, { min: ModuleSize; max: ModuleSize }> =
  {
    tasks: { min: { columns: 2, rows: 3 }, max: { columns: 6, rows: 9 } },
    documents: { min: { columns: 2, rows: 3 }, max: { columns: 6, rows: 9 } },
    settlement: { min: { columns: 2, rows: 3 }, max: { columns: 6, rows: 9 } },
    schedule: { min: { columns: 2, rows: 3 }, max: { columns: 6, rows: 9 } },
    shipments: { min: { columns: 2, rows: 3 }, max: { columns: 6, rows: 9 } },
    summary: { min: { columns: 2, rows: 3 }, max: { columns: 6, rows: 9 } },
  }

const taskRows = [
  {
    title: "인보이스 단가 확인",
    meta: "ACME GmbH · 거래 연결 차단",
    time: "지금",
    tone: "red",
    action: "확인",
    target: "inbox" as ErpMenuTarget,
  },
  {
    title: "B/L 수량 대조",
    meta: "HMM Green · 4 MT 불일치",
    time: "11:30",
    tone: "amber",
    action: "대조",
    target: "inbox" as ErpMenuTarget,
  },
  {
    title: "받을 돈 기록",
    meta: "ACME GmbH · 42,000.00 USD",
    time: "오늘",
    tone: "blue",
    action: "기록",
    target: "settlement" as ErpMenuTarget,
  },
  {
    title: "도착 선적 확인",
    meta: "HMM Green · ETA D-2",
    time: "오늘",
    tone: "blue",
    action: "보기",
    target: "shipments" as ErpMenuTarget,
  },
]

const progressRows = [
  ["검토 대기", "3", "inbox"],
  ["승인 대기", "1", "create"],
  ["연결 대기", "2", "inbox"],
  ["AR/AP 만기", "2", "settlement"],
] as const
const decisionRows = [
  ["인보이스 승인", "ACME GmbH · 고객 전달 전 확인", "create"],
  ["추정 거래손실 검토", "손실 1건 · 보완 2건", "settlement"],
] as const

const settlementRows = [
  {
    label: "받을 돈",
    party: "ACME GmbH",
    amount: "42,000.00 USD",
    date: "오늘 만기",
    tone: "green",
  },
  {
    label: "줄 돈",
    party: "Sakura Logistics",
    amount: "28,000.00 USD",
    date: "07.16 예정",
    tone: "amber",
  },
]

const scheduleRows = [
  ["오늘", "수금", "ACME GmbH", "42,000.00 USD", "settlement"],
  ["07.16", "지급", "Sakura Logistics", "28,000.00 USD", "settlement"],
  ["07.18", "선적", "BUSAN / HMM Green", "ETA 08.03", "shipments"],
] as const

const shipmentRows = [
  ["HMM Green", "BUSAN", "출발 07.18 · 도착 08.03", "B/L 확인 필요"],
  ["ONE Harmony", "INCHEON", "출발 07.20 · 도착 08.05", "운송 중"],
  ["Ever Ace", "BUSAN", "출발 07.22 · 도착 08.07", "보험 서류 확인"],
] as const

const summaryMetrics = [
  ["진행 거래", "12", "deals"],
  ["송장 기준 추정 거래손익", "-12,000 USD", "settlement"],
  ["거래손익 검토", "3", "settlement"],
  ["AR/AP 만기", "2", "settlement"],
  ["서류 갭", "1", "deals"],
  ["선적 리스크", "2", "shipments"],
] as const

const MODULE_ORDER_KEY = "ecoya.today.modules.v2"
const HIDDEN_MODULES_KEY = "ecoya.today.hidden-modules.v1"
const MANUAL_HEIGHTS_KEY = "ecoya.today.manual-heights.v1"
const MODULE_SIZE_KEY = "ecoya.today.module-sizes.v2"
const LAYOUT_MODE_KEY = "ecoya.today.layout-mode.v1"
const SPLIT_LAYOUT_KEY = "ecoya.today.split-layout.v1"
const GRID_COLUMNS = 6
const GRID_GAP = 8
const GRID_ROW_HEIGHT = 64
const GRID_ROW_UNIT = GRID_ROW_HEIGHT + GRID_GAP
const EMPTY_MODULE_ROWS = 2

function readSavedModules(): ModuleId[] {
  if (typeof window === "undefined") return defaultModules
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(MODULE_ORDER_KEY) ?? ""
    )
    if (!Array.isArray(saved)) return defaultModules
    const valid = saved.filter((value): value is ModuleId =>
      moduleDefinitions.some((module) => module.id === value)
    )
    const unique = Array.from(new Set(valid))
    const missing = defaultModules.filter((id) => !unique.includes(id))
    return unique.length ? [...unique, ...missing] : defaultModules
  } catch {
    return defaultModules
  }
}

function readSavedModuleIds(key: string): ModuleId[] {
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]")
    return Array.isArray(saved)
      ? [
          ...new Set(
            saved.filter((id): id is ModuleId =>
              moduleDefinitions.some((module) => module.id === id)
            )
          ),
        ]
      : []
  } catch {
    return []
  }
}

function readSavedSplitLayouts(): Partial<Record<SplitLayoutKey, SplitLayout>> {
  if (typeof window === "undefined") return {}
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(SPLIT_LAYOUT_KEY) ?? ""
    )
    if (!saved || typeof saved !== "object") return {}
    return saved as Partial<Record<SplitLayoutKey, SplitLayout>>
  } catch {
    return {}
  }
}

function readSavedModuleSizes(): Record<ModuleId, ModuleSize> {
  if (typeof window === "undefined") return defaultModuleSizes
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(MODULE_SIZE_KEY) ?? ""
    ) as Partial<Record<ModuleId, ModuleSize>>

    return Object.fromEntries(
      defaultModules.map((id) => {
        const size = saved?.[id]
        return [
          id,
          {
            columns: Math.min(
              moduleSizeLimits[id].max.columns,
              Math.max(
                moduleSizeLimits[id].min.columns,
                Number(size?.columns) || defaultModuleSizes[id].columns
              )
            ),
            rows: Math.min(
              moduleSizeLimits[id].max.rows,
              Math.max(
                moduleSizeLimits[id].min.rows,
                Number(size?.rows) || defaultModuleSizes[id].rows
              )
            ),
          },
        ]
      })
    ) as Record<ModuleId, ModuleSize>
  } catch {
    return defaultModuleSizes
  }
}

function packModulesInOrder(
  modules: ModuleDefinition[],
  sizes: Record<ModuleId, ModuleSize>
): ModulePlacement[] {
  const occupied: boolean[][] = []

  const canPlace = (
    column: number,
    row: number,
    columns: number,
    rows: number
  ) => {
    if (column + columns > GRID_COLUMNS) return false
    for (let rowIndex = row; rowIndex < row + rows; rowIndex += 1) {
      for (
        let columnIndex = column;
        columnIndex < column + columns;
        columnIndex += 1
      ) {
        if (occupied[rowIndex]?.[columnIndex]) return false
      }
    }
    return true
  }

  const occupy = (placement: ModulePlacement) => {
    for (
      let rowIndex = placement.row;
      rowIndex < placement.row + placement.rows;
      rowIndex += 1
    ) {
      occupied[rowIndex] ??= Array(GRID_COLUMNS).fill(false)
      for (
        let columnIndex = placement.column;
        columnIndex < placement.column + placement.columns;
        columnIndex += 1
      ) {
        occupied[rowIndex][columnIndex] = true
      }
    }
  }

  return modules.map((module) => {
    const size = sizes[module.id] ?? defaultModuleSizes[module.id]
    const columns = Math.min(GRID_COLUMNS, Math.max(2, size.columns))
    const rows = Math.min(9, Math.max(EMPTY_MODULE_ROWS, size.rows))

    for (let row = 0; ; row += 1) {
      for (let column = 0; column <= GRID_COLUMNS - columns; column += 1) {
        if (!canPlace(column, row, columns, rows)) continue
        const placement = { id: module.id, column, row, columns, rows }
        occupy(placement)
        return placement
      }
    }
  })
}

type PackingScore = readonly [
  totalRows: number,
  orderDisplacement: number,
  weightedTop: number,
]

function getPackingScore(
  placements: ModulePlacement[],
  preferredOrder: ModuleId[]
): PackingScore {
  const preferredIndexes = new Map(
    preferredOrder.map((id, index) => [id, index])
  )
  const visualOrder = [...placements].sort(
    (left, right) => left.row - right.row || left.column - right.column
  )

  return [
    placements.reduce(
      (maximum, placement) => Math.max(maximum, placement.row + placement.rows),
      0
    ),
    visualOrder.reduce(
      (total, placement, index) =>
        total + Math.abs(index - (preferredIndexes.get(placement.id) ?? index)),
      0
    ),
    placements.reduce(
      (total, placement) => total + placement.row * placement.columns,
      0
    ),
  ]
}

function isBetterPacking(candidate: PackingScore, current: PackingScore) {
  return candidate.some(
    (value, index) =>
      value < current[index] &&
      candidate
        .slice(0, index)
        .every((item, itemIndex) => item === current[itemIndex])
  )
}

function packModules(
  modules: ModuleDefinition[],
  sizes: Record<ModuleId, ModuleSize>
): ModulePlacement[] {
  const preferredOrder = modules.map((module) => module.id)
  let packingOrder = [...modules]
  let placements = packModulesInOrder(packingOrder, sizes)
  let score = getPackingScore(placements, preferredOrder)

  // The saved order remains the user's drag order. For placement only, pull a
  // later card forward when it can fill an earlier hole and make the board
  // shorter (or move occupied area upward at the same height).
  for (let pass = 0; pass < modules.length; pass += 1) {
    let bestOrder = packingOrder
    let bestPlacements = placements
    let bestScore = score

    for (
      let sourceIndex = 1;
      sourceIndex < packingOrder.length;
      sourceIndex += 1
    ) {
      for (let targetIndex = 0; targetIndex < sourceIndex; targetIndex += 1) {
        const candidateOrder = [...packingOrder]
        const [candidateModule] = candidateOrder.splice(sourceIndex, 1)
        candidateOrder.splice(targetIndex, 0, candidateModule)
        const candidatePlacements = packModulesInOrder(candidateOrder, sizes)
        const candidateScore = getPackingScore(
          candidatePlacements,
          preferredOrder
        )

        if (!isBetterPacking(candidateScore, bestScore)) continue
        bestOrder = candidateOrder
        bestPlacements = candidatePlacements
        bestScore = candidateScore
      }
    }

    if (bestOrder === packingOrder) break
    packingOrder = bestOrder
    placements = bestPlacements
    score = bestScore
  }

  const placementById = new Map(
    placements.map((placement) => [placement.id, placement])
  )
  return preferredOrder.flatMap((id) => {
    const placement = placementById.get(id)
    return placement ? [placement] : []
  })
}

function TinyStatus({
  children,
  tone = "blue",
}: {
  children: ReactNode
  tone?: string
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "h-5 shrink-0 border-0 px-2 text-[10px] font-medium",
        tone === "red" && "bg-red-50 text-red-600",
        tone === "amber" && "bg-amber-50 text-amber-700",
        tone === "green" && "bg-emerald-50 text-emerald-700",
        tone === "blue" && "bg-blue-50 text-blue-700"
      )}
    >
      {children}
    </Badge>
  )
}

function getVisibleItemCount({
  total,
  rows,
  itemHeight,
  reservedHeight = 0,
}: {
  total: number
  rows: number
  itemHeight: number
  reservedHeight?: number
}) {
  const bodyHeight = rows * GRID_ROW_UNIT - GRID_GAP - 44
  const availableHeight = Math.max(0, bodyHeight - reservedHeight)
  const withoutMoreRow = Math.floor(availableHeight / itemHeight)

  if (withoutMoreRow >= total) return total

  return Math.max(0, Math.floor((availableHeight - 30) / itemHeight))
}

function MoreItemsRow({
  count,
  onClick,
}: {
  count: number
  onClick: () => void
}) {
  if (count <= 0) return null

  return (
    <button
      type="button"
      className="flex h-[30px] w-full items-center justify-center gap-1 border-t border-[var(--surface-border)] px-3 text-[11px] font-medium text-primary hover:bg-muted/40 focus-visible:bg-muted focus-visible:outline-none"
      onClick={onClick}
    >
      {count}건 더 보기 <ArrowRight className="size-3" />
    </button>
  )
}

function ModuleBody({
  id,
  role,
  size,
  compact = false,
  contentState = "default",
  onNavigate,
}: {
  id: ModuleId
  role: "owner" | "member"
  size: ModuleSize
  compact?: boolean
  contentState?: ModuleContentState
  onNavigate: Navigate
}) {
  if (contentState === "empty") {
    const emptyMessage: Record<ModuleId, string> = {
      tasks: "오늘 처리할 업무가 없습니다.",
      documents: "아직 진행 중인 업무가 없습니다.",
      settlement:
        role === "owner"
          ? "지금 결정할 예외가 없습니다."
          : "예정된 정산이 없습니다.",
      schedule: "등록된 일정이 없습니다.",
      shipments: "예정된 선적이 없습니다.",
      summary: "집계할 업무가 없습니다.",
    }

    const actions: Record<ModuleId, { label: string; target: ErpMenuTarget }> =
      {
        tasks: { label: "업무 문서 확인", target: "inbox" },
        documents: { label: "파일 올리기", target: "inbox" },
        settlement: { label: "정산 관리 열기", target: "settlement" },
        schedule: { label: "거래 일정 확인", target: "deals" },
        shipments: { label: "선적 관리 열기", target: "shipments" },
        summary: { label: "거래 관리 열기", target: "deals" },
      }
    return (
      <div className="flex min-h-28 flex-col items-center justify-center gap-2 px-4 py-4 text-center text-xs text-muted-foreground">
        <p>{emptyMessage[id]}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onNavigate(actions[id].target)}
        >
          {actions[id].label} <ArrowRight className="size-3" />
        </Button>
      </div>
    )
  }

  if (id === "tasks") {
    const visibleCount = compact
      ? taskRows.length
      : getVisibleItemCount({
          total: taskRows.length,
          rows: size.rows,
          itemHeight: 80,
        })
    const hiddenCount = taskRows.length - visibleCount

    return (
      <div>
        <div className="divide-y divide-[var(--surface-border)]">
          {taskRows.slice(0, visibleCount).map((item) => (
            <div key={item.title} className="px-4 py-2.5">
              <div className="flex items-start gap-2.5">
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    item.tone === "red" && "bg-red-500",
                    item.tone === "amber" && "bg-amber-400",
                    item.tone === "blue" && "bg-blue-500"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {item.time}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {item.meta}
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-1 h-auto px-0 text-xs"
                    onClick={() => onNavigate(item.target)}
                  >
                    {item.action} <ArrowRight />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <MoreItemsRow count={hiddenCount} onClick={() => onNavigate("home")} />
      </div>
    )
  }

  if (id === "documents") {
    return (
      <dl className="grid grid-cols-2 gap-5 p-4">
        {progressRows.map(([label, value, target]) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd>
              <button
                type="button"
                className="mt-1 rounded text-2xl font-semibold hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
                aria-label={`${label} 보기`}
                onClick={() => onNavigate(target)}
              >
                {value}
              </button>
            </dd>
          </div>
        ))}
      </dl>
    )
  }

  if (id === "settlement" && role === "owner") {
    const visibleCount = compact
      ? decisionRows.length
      : getVisibleItemCount({
          total: decisionRows.length,
          rows: size.rows,
          itemHeight: 100,
        })
    return (
      <div>
        <div className="divide-y">
          {decisionRows
            .slice(0, visibleCount)
            .map(([title, detail, target]) => (
              <div key={title} className="px-4 py-3">
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1 h-auto p-0 text-xs"
                  onClick={() => onNavigate(target)}
                >
                  처리
                  <ArrowRight />
                </Button>
              </div>
            ))}
        </div>
        <MoreItemsRow
          count={decisionRows.length - visibleCount}
          onClick={() => onNavigate("settlement")}
        />
      </div>
    )
  }

  if (id === "settlement") {
    const compactHeight = !compact && size.rows <= 3
    const visibleCount = compact
      ? settlementRows.length
      : compactHeight
        ? 0
        : getVisibleItemCount({
            total: settlementRows.length,
            rows: size.rows,
            itemHeight: 58,
            reservedHeight: 76,
          })
    const hiddenCount = settlementRows.length - visibleCount

    return (
      <div className={cn(compactHeight ? "p-3" : "p-4")}>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-emerald-50 px-3 py-2.5">
            <p className="text-[11px] text-emerald-700">7일 내 받을 돈</p>
            <strong className="mt-0.5 block text-sm text-emerald-900 tabular-nums">
              54,200 USD
            </strong>
          </div>
          <div className="rounded-lg bg-amber-50 px-3 py-2.5">
            <p className="text-[11px] text-amber-700">7일 내 줄 돈</p>
            <strong className="mt-0.5 block text-sm text-amber-900 tabular-nums">
              28,000 USD
            </strong>
          </div>
        </div>
        <div className="mt-2 divide-y divide-[var(--surface-border)]">
          {settlementRows.slice(0, visibleCount).map((item) => (
            <button
              key={item.party}
              type="button"
              className="flex h-[58px] w-full items-center gap-3 text-left hover:text-primary focus-visible:outline-none"
              onClick={() => onNavigate("settlement")}
            >
              <TinyStatus tone={item.tone}>{item.label}</TinyStatus>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {item.party}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {item.date}
                </span>
              </span>
              <span className="shrink-0 text-xs font-medium tabular-nums">
                {item.amount}
              </span>
            </button>
          ))}
        </div>
        <MoreItemsRow
          count={hiddenCount}
          onClick={() => onNavigate("settlement")}
        />
      </div>
    )
  }

  if (id === "schedule") {
    const visibleCount = compact
      ? scheduleRows.length
      : getVisibleItemCount({
          total: scheduleRows.length,
          rows: size.rows,
          itemHeight: 64,
        })
    const hiddenCount = scheduleRows.length - visibleCount

    return (
      <div>
        <div className="divide-y divide-[var(--surface-border)]">
          {scheduleRows
            .slice(0, visibleCount)
            .map(([date, type, title, meta, target]) => (
              <button
                key={`${date}-${title}`}
                type="button"
                className={cn(
                  "grid h-16 w-full gap-2 px-4 text-left hover:bg-muted/40 focus-visible:bg-muted focus-visible:outline-none",
                  size.columns >= 3
                    ? "grid-cols-[46px_46px_minmax(0,1fr)]"
                    : "grid-cols-[42px_minmax(0,1fr)]"
                )}
                onClick={() => onNavigate(target)}
              >
                <span className="text-[11px] text-muted-foreground">
                  {date}
                </span>
                {size.columns >= 3 ? (
                  <TinyStatus
                    tone={
                      type === "수금"
                        ? "green"
                        : type === "지급"
                          ? "amber"
                          : "blue"
                    }
                  >
                    {type}
                  </TinyStatus>
                ) : null}
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                    {size.columns < 3 ? <TinyStatus>{type}</TinyStatus> : null}
                    <span className="truncate">{title}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                    {meta}
                  </span>
                </span>
              </button>
            ))}
        </div>
        <MoreItemsRow count={hiddenCount} onClick={() => onNavigate("home")} />
      </div>
    )
  }

  if (id === "shipments") {
    const visibleCount = compact
      ? shipmentRows.length
      : getVisibleItemCount({
          total: shipmentRows.length,
          rows: size.rows,
          itemHeight: 64,
        })
    const hiddenCount = shipmentRows.length - visibleCount

    return (
      <div>
        <div className="divide-y divide-[var(--surface-border)]">
          {shipmentRows
            .slice(0, visibleCount)
            .map(([carrier, port, eta, status]) => (
              <button
                key={carrier}
                type="button"
                className="flex h-16 w-full items-center gap-3 px-4 text-left hover:bg-muted/40 focus-visible:bg-muted focus-visible:outline-none"
                onClick={() => onNavigate("shipments")}
              >
                <Ship className="size-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {carrier}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {port} · {eta}
                  </span>
                </span>
                {size.columns >= 3 ? (
                  <TinyStatus tone={status === "운송 중" ? "blue" : "amber"}>
                    {status}
                  </TinyStatus>
                ) : (
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {status}
                  </span>
                )}
              </button>
            ))}
        </div>
        <MoreItemsRow
          count={hiddenCount}
          onClick={() => onNavigate("shipments")}
        />
      </div>
    )
  }

  const summaryRows =
    role === "owner"
      ? summaryMetrics
      : summaryMetrics.filter(
          ([label]) =>
            label !== "송장 기준 추정 거래손익" && label !== "거래손익 검토"
        )
  const summaryColumns = compact
    ? 2
    : size.columns >= 5
      ? 3
      : size.columns >= 3
        ? 2
        : 1
  const summaryRowHeight = 64
  const visibleCount = compact
    ? summaryRows.length
    : Math.min(
        summaryRows.length,
        getVisibleItemCount({
          total: Math.ceil(summaryRows.length / summaryColumns),
          rows: size.rows,
          itemHeight: summaryRowHeight,
        }) * summaryColumns
      )
  const hiddenCount = summaryRows.length - visibleCount

  return (
    <div>
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${summaryColumns}, minmax(0, 1fr))`,
        }}
      >
        {summaryRows
          .slice(0, visibleCount)
          .map(([label, value, target], index) => (
            <button
              key={label}
              type="button"
              className={cn(
                "h-16 min-w-0 border-r border-b border-[var(--surface-border)] px-4 text-left hover:bg-muted/40 focus-visible:bg-muted focus-visible:outline-none",
                (index + 1) % summaryColumns === 0 && "border-r-0"
              )}
              onClick={() => onNavigate(target)}
            >
              <span className="block text-[11px] text-muted-foreground">
                {label}
              </span>
              <strong
                className={cn(
                  "mt-1 block truncate text-base font-semibold tabular-nums",
                  value.startsWith("-") && "text-red-600"
                )}
              >
                {value}
              </strong>
            </button>
          ))}
      </div>
      <MoreItemsRow count={hiddenCount} onClick={() => onNavigate("deals")} />
    </div>
  )
}

function TodayModule({
  module,
  role,
  compact = false,
  contentState = "default",
  isDragging = false,
  isDropTarget = false,
  onNavigate,
  onClose,
  fitToContent = false,
  onContentHeight,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  module: ModuleDefinition
  role: "owner" | "member"
  compact?: boolean
  contentState?: ModuleContentState
  isDragging?: boolean
  isDropTarget?: boolean
  onNavigate: Navigate
  onClose: () => void
  fitToContent?: boolean
  onContentHeight: (id: ModuleId, height: number) => void
  onDragStart: (event: DragEvent<HTMLElement>) => void
  onDragEnd: () => void
  onDragOver: (event: DragEvent<HTMLElement>) => void
  onDragLeave: (event: DragEvent<HTMLElement>) => void
  onDrop: (event: DragEvent<HTMLElement>) => void
}) {
  const Icon = module.icon
  const moduleRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [measuredSize, setMeasuredSize] = useState<ModuleSize>(
    defaultModuleSizes[module.id]
  )

  useEffect(() => {
    const element = moduleRef.current
    if (!element || compact || typeof ResizeObserver === "undefined") return

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const { width, height } = entry.contentRect
      const nextSize = {
        columns: width >= 920 ? 6 : width >= 620 ? 4 : width >= 390 ? 3 : 2,
        rows: Math.max(2, Math.round((height + GRID_GAP) / GRID_ROW_UNIT)),
      }
      setMeasuredSize((current) =>
        current.columns === nextSize.columns && current.rows === nextSize.rows
          ? current
          : nextSize
      )
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [compact])

  useEffect(() => {
    const content = contentRef.current
    if (!content || !fitToContent || contentState === "empty") return
    const measure = () => onContentHeight(module.id, content.scrollHeight + 46)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(content)
    return () => observer.disconnect()
  }, [fitToContent, contentState, module.id, onContentHeight])

  const size = compact ? defaultModuleSizes[module.id] : measuredSize

  return (
    <section
      ref={moduleRef}
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-[var(--r-lg)] border border-[var(--surface-border)] bg-[var(--surface-background)] shadow-[var(--shadow-section)] transition-[border-color,background-color,box-shadow,opacity,transform] duration-150 motion-reduce:transition-none",
        isDragging &&
          "scale-[0.995] border-dashed border-primary/45 bg-[var(--control-selected-soft-background)] opacity-45 shadow-none",
        isDropTarget &&
          "border-[var(--control-selected-border)] bg-[var(--control-selected-soft-background)] shadow-[var(--shadow-input-focused)]"
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <header
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className="flex h-11 shrink-0 cursor-grab items-center gap-2 border-b border-[var(--surface-border)] px-3 select-none active:cursor-grabbing"
      >
        <span
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          aria-label={`${module.title} 모듈 이동`}
          title="끌어서 위치 변경"
        >
          <GripVertical className="size-4" />
        </span>
        <Icon className="size-4 shrink-0 text-primary" />
        <h2 className="min-w-0 truncate text-sm font-semibold">
          {module.title}
        </h2>
        <span className="shrink-0 text-[11px] whitespace-nowrap text-muted-foreground">
          {contentState === "empty" ? "0건" : module.count}
        </span>
        {module.id !== "settlement" && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="pointer-events-none ml-auto shrink-0 opacity-0 transition-opacity group-focus-within/module:pointer-events-auto group-focus-within/module:opacity-100 group-hover/module:pointer-events-auto group-hover/module:opacity-100 motion-reduce:transition-none [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100"
            aria-label={`${module.title} 모듈 닫기`}
            title="모듈 닫기"
            draggable={false}
            onPointerDown={(event) => event.stopPropagation()}
            onDragStart={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}
            onClick={onClose}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        )}
      </header>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div ref={contentRef} data-module-content>
          <ModuleBody
            id={module.id}
            role={role}
            size={fitToContent ? { ...size, rows: 9 } : size}
            compact={compact}
            contentState={contentState}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </section>
  )
}

function TodaySplitHandle({ label }: { label: string }) {
  return (
    <ResizableHandle
      aria-label={label}
      className="z-20 shrink-0 bg-transparent after:bg-[var(--surface-border)] hover:bg-primary/5 aria-[orientation=horizontal]:h-2 aria-[orientation=horizontal]:after:h-px aria-[orientation=vertical]:w-2 aria-[orientation=vertical]:after:w-px data-[resize-handle-state=drag]:bg-primary/10"
    />
  )
}

export function TodayModularWorkspace({
  onNavigate,
  role = "owner",
}: {
  onNavigate: Navigate
  initialContentState?: ModuleContentState
  role?: "owner" | "member"
}) {
  const definitions = useMemo(
    () =>
      moduleDefinitions.map((module) =>
        module.id === "settlement" && role === "member"
          ? { ...module, title: "정산·현금" }
          : module
      ),
    [role]
  )
  const isCompact = useIsCompactWorkspace()
  const [modules, setModules] = useState<ModuleId[]>(readSavedModules)
  const [hiddenModules, setHiddenModules] = useState<ModuleId[]>(() =>
    readSavedModuleIds(HIDDEN_MODULES_KEY).filter((id) => id !== "settlement")
  )
  const [manualHeights, setManualHeights] = useState(() =>
    readSavedModuleIds(MANUAL_HEIGHTS_KEY)
  )
  const [layoutMode] = useState<LayoutMode>("split")
  const [contentState, setContentState] =
    useState<ModuleContentState>("default")
  const [moduleSizes, setModuleSizes] = useState(readSavedModuleSizes)
  const [splitLayouts, setSplitLayouts] = useState(readSavedSplitLayouts)
  const [draggedModule, setDraggedModule] = useState<ModuleId | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)
  const [layoutResetKey, setLayoutResetKey] = useState(0)
  const autoGridRef = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<HTMLElement>(null)
  const workspaceHeaderRef = useRef<HTMLElement>(null)
  const [splitHeight, setSplitHeight] = useState<number | null>(null)
  useEffect(() => {
    const viewport = workspaceRef.current?.closest<HTMLElement>(
      "[data-home-scroll-viewport]"
    )
    const header = workspaceHeaderRef.current
    if (!viewport || !header || isCompact) return
    // The board fills the scroll viewport once its header reaches the sticky top.
    // Introductory content above the board does not reduce its usable height.
    const update = () =>
      setSplitHeight(
        Math.max(0, viewport.clientHeight - header.offsetHeight - 8 - 16)
      )
    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    observer.observe(header)
    window.addEventListener("resize", update)
    update()
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", update)
    }
  }, [isCompact])

  const activeModules = useMemo(
    () =>
      modules
        .filter((id) => !hiddenModules.includes(id))
        .map((id) => definitions.find((module) => module.id === id))
        .filter((module): module is ModuleDefinition => Boolean(module)),
    [modules, hiddenModules, definitions]
  )
  const autoPlacements = useMemo(
    () => packModules(activeModules, moduleSizes),
    [moduleSizes, activeModules]
  )

  useEffect(() => {
    window.localStorage.setItem(MODULE_ORDER_KEY, JSON.stringify(modules))
  }, [modules])

  useEffect(() => {
    window.localStorage.setItem(LAYOUT_MODE_KEY, layoutMode)
  }, [layoutMode])

  useEffect(() => {
    window.localStorage.setItem(MODULE_SIZE_KEY, JSON.stringify(moduleSizes))
  }, [moduleSizes])

  useEffect(() => {
    window.localStorage.setItem(SPLIT_LAYOUT_KEY, JSON.stringify(splitLayouts))
  }, [splitLayouts])

  useEffect(() => {
    window.localStorage.setItem(
      HIDDEN_MODULES_KEY,
      JSON.stringify(hiddenModules)
    )
  }, [hiddenModules])

  useEffect(() => {
    window.localStorage.setItem(
      MANUAL_HEIGHTS_KEY,
      JSON.stringify(manualHeights)
    )
  }, [manualHeights])

  const fitModuleHeight = useCallback((id: ModuleId, height: number) => {
    const rows = Math.min(
      9,
      Math.max(3, Math.ceil((height + GRID_GAP) / GRID_ROW_UNIT))
    )
    setModuleSizes((current) =>
      current[id].rows === rows
        ? current
        : { ...current, [id]: { ...current[id], rows } }
    )
  }, [])

  const closeModule = (id: ModuleId) => {
    if (id === "settlement") return
    setHiddenModules((current) =>
      current.includes(id) ? current : [...current, id]
    )
    setDraggedModule(null)
    setDropTarget(null)
  }

  const addModule = (id: ModuleId) => {
    setHiddenModules((current) => current.filter((item) => item !== id))
  }

  const swapModules = (source: ModuleId, target: ModuleId) => {
    if (source === target) return
    setModules((current) => {
      const sourceIndex = current.indexOf(source)
      const targetIndex = current.indexOf(target)
      if (sourceIndex < 0 || targetIndex < 0) return current
      const next = [...current]
      ;[next[sourceIndex], next[targetIndex]] = [
        next[targetIndex],
        next[sourceIndex],
      ]
      return next
    })
  }

  const startAutoResize = (
    event: ReactPointerEvent<HTMLButtonElement>,
    id: ModuleId,
    axis: "horizontal" | "vertical" | "both",
    fromLeft = false
  ) => {
    event.preventDefault()
    event.stopPropagation()

    const grid = autoGridRef.current
    if (!grid) return

    if (axis !== "horizontal")
      setManualHeights((current) =>
        current.includes(id) ? current : [...current, id]
      )

    const startX = event.clientX
    const startY = event.clientY
    const startSize = moduleSizes[id]
    const columnWidth =
      (grid.getBoundingClientRect().width - GRID_GAP * (GRID_COLUMNS - 1)) /
      GRID_COLUMNS

    const handleMove = (moveEvent: PointerEvent) => {
      const columnDelta = Math.round(
        ((moveEvent.clientX - startX) * (fromLeft ? -1 : 1)) /
          (columnWidth + GRID_GAP)
      )
      const rowDelta = Math.round((moveEvent.clientY - startY) / GRID_ROW_UNIT)

      setModuleSizes((current) => ({
        ...current,
        [id]: {
          columns:
            axis === "vertical"
              ? current[id].columns
              : Math.min(
                  moduleSizeLimits[id].max.columns,
                  Math.max(
                    moduleSizeLimits[id].min.columns,
                    startSize.columns + columnDelta
                  )
                ),
          rows:
            axis === "horizontal"
              ? current[id].rows
              : Math.min(
                  moduleSizeLimits[id].max.rows,
                  Math.max(
                    moduleSizeLimits[id].min.rows,
                    startSize.rows + rowDelta
                  )
                ),
        },
      }))
    }

    const handleEnd = () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleEnd)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    document.body.style.cursor =
      axis === "horizontal"
        ? "ew-resize"
        : axis === "vertical"
          ? "ns-resize"
          : "nwse-resize"
    document.body.style.userSelect = "none"
    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", handleEnd, { once: true })
  }

  const renderModule = (
    module: ModuleDefinition,
    compact = false,
    placement?: ModulePlacement
  ) => {
    return (
      <div
        key={`${module.id}-${layoutResetKey}`}
        data-module-id={module.id}
        data-size-min={`${moduleSizeLimits[module.id].min.columns}x${moduleSizeLimits[module.id].min.rows}`}
        data-size-max={`${moduleSizeLimits[module.id].max.columns}x${moduleSizeLimits[module.id].max.rows}`}
        data-dragging={draggedModule === module.id ? "true" : undefined}
        data-drop-target={
          dropTarget?.id === module.id && draggedModule !== module.id
            ? (dropTarget.edge ?? "swap")
            : undefined
        }
        style={
          placement
            ? {
                gridColumn: `${placement.column + 1} / span ${placement.columns}`,
                gridRow: `${placement.row + 1} / span ${placement.rows}`,
              }
            : undefined
        }
        className={cn(
          "group/module relative h-full min-h-0 min-w-0",
          draggedModule === module.id &&
            "rounded-[var(--r-lg)] ring-2 ring-primary/25 ring-offset-2 ring-offset-[var(--surface-muted-background)]",
          dropTarget?.id === module.id &&
            draggedModule !== module.id &&
            "rounded-[var(--r-lg)] ring-2 ring-primary/25 ring-offset-2 ring-offset-[var(--surface-muted-background)]"
        )}
      >
        <TodayModule
          module={module}
          role={role}
          compact={compact}
          contentState={contentState}
          isDragging={draggedModule === module.id}
          isDropTarget={
            dropTarget?.id === module.id && draggedModule !== module.id
          }
          onNavigate={onNavigate}
          onClose={() => closeModule(module.id)}
          fitToContent={
            layoutMode === "auto" &&
            !compact &&
            !manualHeights.includes(module.id)
          }
          onContentHeight={fitModuleHeight}
          onDragStart={(event) => {
            setDraggedModule(module.id)
            setDropTarget(null)
            event.dataTransfer.effectAllowed = "move"
            event.dataTransfer.setData("text/plain", module.id)
          }}
          onDragEnd={() => {
            setDraggedModule(null)
            setDropTarget(null)
          }}
          onDragOver={(event) => {
            event.preventDefault()
            event.dataTransfer.dropEffect = "move"
            if (!draggedModule || draggedModule === module.id) return
            const edge = null
            setDropTarget((current) =>
              current?.id === module.id && current.edge === edge
                ? current
                : { id: module.id, edge }
            )
          }}
          onDragLeave={(event) => {
            const nextTarget = event.relatedTarget
            if (
              nextTarget instanceof Node &&
              event.currentTarget.contains(nextTarget)
            ) {
              return
            }
            setDropTarget((current) =>
              current?.id === module.id ? null : current
            )
          }}
          onDrop={(event) => {
            event.preventDefault()
            const source =
              (event.dataTransfer.getData("text/plain") as ModuleId) ||
              draggedModule
            if (source) {
              swapModules(source, module.id)
            }
            setDraggedModule(null)
            setDropTarget(null)
          }}
        />
        {dropTarget?.id === module.id && draggedModule !== module.id ? (
          <div
            className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center rounded-[var(--r-lg)] border-2 border-dashed border-primary bg-primary/5"
            data-swap-preview
          >
            <span className="rounded-md bg-background px-3 py-2 text-sm font-medium text-primary shadow-sm">
              놓으면 두 모듈의 위치가 바뀝니다
            </span>
          </div>
        ) : null}
        {placement &&
        dropTarget?.id === module.id &&
        draggedModule !== module.id &&
        dropTarget.edge ? (
          <span
            aria-hidden="true"
            data-drop-indicator={dropTarget.edge}
            className={cn(
              "pointer-events-none absolute z-40 rounded-full bg-primary shadow-[0_0_0_2px_var(--surface-background)]",
              dropTarget.edge === "top" &&
                "top-0 right-2 left-2 h-0.5 -translate-y-1/2",
              dropTarget.edge === "bottom" &&
                "right-2 bottom-0 left-2 h-0.5 translate-y-1/2",
              dropTarget.edge === "left" &&
                "top-2 bottom-2 left-0 w-0.5 -translate-x-1/2",
              dropTarget.edge === "right" &&
                "top-2 right-0 bottom-2 w-0.5 translate-x-1/2"
            )}
          />
        ) : null}
        {placement ? (
          <>
            <button
              type="button"
              aria-label={`${module.title} 왼쪽 테두리 너비 조절`}
              className="absolute top-12 bottom-2 left-0 z-20 w-2 -translate-x-1/2 cursor-ew-resize bg-transparent focus-visible:outline focus-visible:outline-primary"
              onPointerDown={(event) =>
                startAutoResize(event, module.id, "horizontal", true)
              }
            />
            <button
              type="button"
              aria-label={`${module.title} 왼쪽 대각선 크기 조절`}
              className="absolute -bottom-1 -left-1 z-30 size-2 cursor-nesw-resize bg-transparent focus-visible:outline focus-visible:outline-primary"
              onPointerDown={(event) =>
                startAutoResize(event, module.id, "both", true)
              }
            />
            <button
              type="button"
              aria-label={`${module.title} 너비 조절`}
              className="absolute top-12 right-0 bottom-7 z-20 w-2 translate-x-1/2 cursor-ew-resize opacity-0 transition-opacity group-hover/module:opacity-100 focus-visible:opacity-100"
              onPointerDown={(event) =>
                startAutoResize(event, module.id, "horizontal")
              }
            />
            {contentState !== "empty" ? (
              <>
                <button
                  type="button"
                  aria-label={`${module.title} 높이 조절`}
                  className="absolute right-7 bottom-0 left-3 z-20 h-2 translate-y-1/2 cursor-ns-resize opacity-0 transition-opacity group-hover/module:opacity-100 focus-visible:opacity-100"
                  onPointerDown={(event) =>
                    startAutoResize(event, module.id, "vertical")
                  }
                />
                <button
                  type="button"
                  aria-label={`${module.title} 크기 조절`}
                  className="absolute -right-1 -bottom-1 z-30 size-2 cursor-nwse-resize bg-transparent focus-visible:outline focus-visible:outline-primary"
                  onPointerDown={(event) =>
                    startAutoResize(event, module.id, "both")
                  }
                ></button>
              </>
            ) : null}
          </>
        ) : null}
      </div>
    )
  }

  const moduleAt = (index: number) => {
    const id = modules[index]
    const module = definitions.find((item) => item.id === id)
    return module && !hiddenModules.includes(id) ? renderModule(module) : null
  }

  // Prune closed leaves before laying out panels. A sole child fills its
  // parent; saved weights of hidden siblings remain available when restored.
  const splitGroup = (
    key: SplitLayoutKey,
    orientation: "horizontal" | "vertical",
    panels: { id: string; weight: number; content: ReactNode }[]
  ): ReactNode => {
    const visible = panels.filter((panel) => panel.content != null)
    if (!visible.length) return null
    if (visible.length === 1) return visible[0].content
    const weights = Object.fromEntries(
      panels.map((panel) => [
        panel.id,
        (splitLayouts[key]?.[panel.id] ?? 0) > 0
          ? splitLayouts[key]![panel.id]
          : panel.weight,
      ])
    )
    const total = visible.reduce((sum, panel) => sum + weights[panel.id], 0)
    const layout = Object.fromEntries(
      visible.map((panel) => [panel.id, (weights[panel.id] / total) * 100])
    )
    return (
      <ResizablePanelGroup
        key={`${key}-${layoutResetKey}-${visible.map((panel) => panel.id).join("-")}`}
        id={`today-workspace-${key}`}
        orientation={orientation}
        defaultLayout={layout}
        onLayoutChanged={(next, meta) => {
          if (!meta.isUserInteraction) return
          const updated = { ...weights }
          for (const panel of visible)
            updated[panel.id] = (next[panel.id] / 100) * total
          setSplitLayouts((current) => ({ ...current, [key]: updated }))
        }}
      >
        {visible.map((panel, index) => (
          <Fragment key={panel.id}>
            {index > 0 && (
              <TodaySplitHandle
                label={
                  orientation === "horizontal"
                    ? "모듈 너비 조절"
                    : "모듈 높이 조절"
                }
              />
            )}
            <ResizablePanel
              id={panel.id}
              minSize="19%"
              defaultSize={`${layout[panel.id]}%`}
            >
              {panel.content}
            </ResizablePanel>
          </Fragment>
        ))}
      </ResizablePanelGroup>
    )
  }

  const splitContent = splitGroup("root", "horizontal", [
    {
      id: "today-left-stack",
      weight: 48,
      content: splitGroup("left", "vertical", [
        { id: "today-left-top", weight: 50, content: moduleAt(0) },
        {
          id: "today-left-bottom",
          weight: 50,
          content: splitGroup("leftBottom", "horizontal", [
            { id: "today-left-bottom-first", weight: 50, content: moduleAt(1) },
            {
              id: "today-left-bottom-second",
              weight: 50,
              content: moduleAt(2),
            },
          ]),
        },
      ]),
    },
    {
      id: "today-middle-stack",
      weight: 27,
      content: splitGroup("middle", "vertical", [
        { id: "today-middle-top", weight: 50, content: moduleAt(3) },
        { id: "today-middle-bottom", weight: 50, content: moduleAt(4) },
      ]),
    },
    { id: "today-right-full", weight: 25, content: moduleAt(5) },
  ])

  return (
    <section
      aria-labelledby="today-workspace-title"
      ref={workspaceRef}
      className={cn(
        "min-w-0",
        !isCompact && layoutMode === "split" && "flex flex-col"
      )}
    >
      <header
        ref={workspaceHeaderRef}
        className="sticky top-0 z-20 mb-2 flex min-h-12 shrink-0 flex-wrap items-center gap-2 rounded-[var(--r-lg)] border border-[var(--surface-border)] bg-[var(--surface-background)] px-3 py-2 shadow-[var(--shadow-section)]"
      >
        <div className="flex min-w-0 items-center gap-2">
          <LayoutDashboard className="size-4 shrink-0 text-primary" />
          <h1
            id="today-workspace-title"
            className="truncate text-sm font-semibold"
          >
            오늘 업무판
          </h1>
          <Badge variant="secondary" className="font-normal">
            {activeModules.length}개 모듈
          </Badge>
          <Badge
            variant="outline"
            className="hidden font-normal sm:inline-flex"
          >
            {layoutMode === "split" ? "분할 조절형" : "자동 재배치형"}
          </Badge>
          <span className="hidden text-[11px] text-muted-foreground lg:inline">
            {layoutMode === "split"
              ? "헤더를 끌어 위치 교환 · 구분선을 끌어 함께 크기 조절"
              : "헤더를 끌어 위치 교환 · 카드 가장자리를 끌어 개별 크기 조절"}
          </span>
        </div>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="모듈 편집"
              >
                <MoreVertical /> 모듈 편집
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>표시할 모듈</DropdownMenuLabel>
              {definitions.map((module) => (
                <DropdownMenuCheckboxItem
                  key={module.id}
                  checked={!hiddenModules.includes(module.id)}
                  disabled={module.id === "settlement"}
                  onCheckedChange={(checked) =>
                    checked ? addModule(module.id) : closeModule(module.id)
                  }
                >
                  {module.title}
                  {module.id === "settlement" ? " · 필수" : ""}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  setModules(defaultModules)
                  setHiddenModules([])
                  setManualHeights([])
                  setModuleSizes(defaultModuleSizes)
                  setSplitLayouts({})
                  setContentState("default")
                  setLayoutResetKey((current) => current + 1)
                }}
              >
                <RefreshCw /> 초기화
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {isCompact ? (
        <div className="grid gap-2">
          {activeModules.map((module) => renderModule(module, true))}
        </div>
      ) : layoutMode === "auto" ? (
        <div
          ref={autoGridRef}
          data-module-grid
          data-layout-mode="auto"
          className="grid w-full [grid-auto-rows:64px] grid-cols-6 gap-2"
        >
          {autoPlacements.map((placement) => {
            const module = activeModules.find(
              (item) => item.id === placement.id
            )
            return module ? renderModule(module, false, placement) : null
          })}
        </div>
      ) : (
        <div
          data-module-grid
          data-layout-mode="split"
          className="w-full shrink-0"
          style={{
            height: splitHeight ?? "calc(100svh - var(--header-height) - 72px)",
          }}
        >
          {splitContent}
        </div>
      )}
    </section>
  )
}

import { useMemo, useState, type CSSProperties, type DragEvent } from "react"
import {
  ArrowRight,
  ArrowUpCircle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  GripVertical,
  LayoutGrid,
  Link2,
  MoreHorizontal,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Ship,
  SquareCheck,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@shared/components/ui/badge"
import { Button } from "@shared/components/ui/button"
import { Card } from "@shared/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@shared/components/ui/empty"
import { cn } from "@shared/lib/utils"
import type { ErpMenuTarget } from "@trade-os/ErpScreens"

export type HomeRole = "owner" | "admin" | "member"
export type HomeBoardState = "default" | "empty" | "error"

type Navigate = (screen: ErpMenuTarget) => void
type ModuleId =
  | "tasks"
  | "today"
  | "progress"
  | "summary"
  | "overdue"
  | "benchmark"
  | "brief"
  | "insight"
  | "monitoring"
  | "schedule"
  | "documents"
  | "shipments"

type ModuleSpec = { id: ModuleId; columns: 4 | 8; rows: 2 | 3 | 5 | 6 }

/* Figma 홈 시안 · 권한별 (4407:18532). The board is an 8-column grid
   (151px columns, 172px rows, 16px gaps); listing modules in this order
   reproduces each role's layout with plain grid auto-placement. */
function boardModules(role: HomeRole, marketAccess: boolean, insightAccess: boolean): ModuleSpec[] {
  if (role === "member") {
    return [
      { id: "tasks", columns: 4, rows: 6 },
      { id: "progress", columns: 4, rows: 2 },
      { id: "summary", columns: 4, rows: 2 },
      ...(marketAccess ? [{ id: "benchmark", columns: 4, rows: 2 } as ModuleSpec] : []),
      { id: "documents", columns: 8, rows: 2 },
      { id: "shipments", columns: 8, rows: 2 },
    ]
  }
  const fullAccess = marketAccess && insightAccess
  return [
    { id: "tasks", columns: 4, rows: 5 },
    { id: "today", columns: 4, rows: 2 },
    { id: "summary", columns: 4, rows: 3 },
    { id: "overdue", columns: 4, rows: fullAccess ? 3 : 2 },
    ...(marketAccess ? [{ id: "benchmark", columns: 4, rows: 3 } as ModuleSpec] : []),
    { id: "progress", columns: fullAccess ? 8 : 4, rows: 2 },
    ...(insightAccess
      ? [
          { id: "brief", columns: 4, rows: 2 } as ModuleSpec,
          { id: "insight", columns: 4, rows: 2 } as ModuleSpec,
        ]
      : []),
    ...(role === "owner"
      ? [
          { id: "monitoring", columns: 4, rows: 2 } as ModuleSpec,
          { id: "schedule", columns: 4, rows: 2 } as ModuleSpec,
        ]
      : []),
    { id: "documents", columns: 8, rows: 2 },
    { id: "shipments", columns: 8, rows: 2 },
  ]
}

const moduleTitles: Record<ModuleId, string> = {
  tasks: "작업함",
  today: "오늘 확인이 필요합니다",
  progress: "진행 건수",
  summary: "업무 요약",
  overdue: "연체 받을 돈",
  benchmark: "관련 벤치마크",
  brief: "경영 브리프",
  insight: "재무 인사이트",
  monitoring: "운영 감시",
  schedule: "이번 주 일정",
  documents: "검토·배정 대기 문서",
  shipments: "들어오는 선적",
}

const moduleTargets: Record<ModuleId, ErpMenuTarget> = {
  tasks: "inbox",
  today: "inbox",
  progress: "inbox",
  summary: "deals",
  overdue: "settlement",
  benchmark: "ask",
  brief: "reports",
  insight: "reports",
  monitoring: "monitoring",
  schedule: "settlement",
  documents: "inbox",
  shipments: "shipments",
}

const taskRows: Array<[string, string, string, ErpMenuTarget]> = [
  ["인보이스 단가 확인", "ACME GmbH · 거래 연결이 막혀 있어요", "확인", "inbox"],
  ["CI 승인 요청", "한국무역 · CI-2026-0142", "승인", "inbox"],
  ["B/L 수량 대조", "HMM Green · 4 MT 불일치", "문서 보기", "inbox"],
  ["발주서 발송", "Sakura Logistics · 서명 완료", "발송", "create"],
  ["받을 돈 기록", "ACME GmbH · 42,000.00 USD 입금 확인", "정산 보기", "settlement"],
  ["도착 선적 확인", "HMM Green · ETA D-2", "선적 보기", "shipments"],
  ["서류 누락", "벡터트레이딩 · B/L 미첨부", "거래 보기", "deals"],
  ["PL 수량 확인", "ACME GmbH · 인보이스와 2건 차이", "문서 보기", "inbox"],
  ["선적 지연", "ONE Harmony · ETA 3일 늦어짐", "선적 보기", "shipments"],
  ["미수금 확인", "Andes Mineral · 만기 D+34", "정산 보기", "settlement"],
  ["원산지증명 발송", "Sakura Logistics · 요청 1건", "발송", "create"],
  ["거래 정보 보완", "Nordic Raw · 인도 조건 누락", "거래 보기", "deals"],
  ["인보이스 필드 확인", "HMM Green · 필수 필드 2개", "확인", "inbox"],
  ["선적 서류 확인", "Ever Ace · 컨테이너 번호 확인", "선적 보기", "shipments"],
  ["견적서 발송", "한국무역 · 회신 기한 오늘", "발송", "create"],
]

const todayRows: Array<[string, string]> = [
  ["승인 대기 · CI-2026-0142, 한국무역", "필수 필드 2개를 확인해 주세요"],
  ["마진 위험 · 벡터트레이딩", "비용 반영 후 예상 마진이 감소했습니다"],
  ["인계 보완 · ACME GmbH", "회계 인계 전 확인할 항목이 2개 있습니다"],
  ["필드 확인 · INV-2026-0155, 한빛무역", "금액 필드 1개를 확인해 주세요"],
]

const progressTiles: Array<[LucideIcon, string, string]> = [
  [Search, "3건", "검토 대기"],
  [CheckCircle2, "1건", "승인 대기"],
  [Link2, "2건", "거래 연결 대기"],
]

const monitoringTiles: Array<[LucideIcon, string, string]> = [
  [SquareCheck, "6건", "오늘 처리"],
  [ArrowUpCircle, "75%", "완료율"],
  [TriangleAlert, "2건", "미확인 이슈"],
]

const summaryTiles: Array<[LucideIcon, string, string]> = [
  [Clock3, "2건", "AR/AP 만기"],
  [FileText, "1건", "서류 갭"],
  [Ship, "2건", "선적 리스크"],
]

type AmountRow = { label: string; currency: string; amount: string; count: string; countTone?: "danger"; action: string }

const memberSummaryRows: AmountRow[] = [
  { label: "거래 금액", currency: "USD", amount: "$845,000", count: "8건", action: "상세 보기" },
  { label: "거래 금액", currency: "EUR", amount: "€120,500", count: "4건", action: "상세 보기" },
]

const managerSummaryRows: AmountRow[] = [
  ...memberSummaryRows,
  { label: "조정 거래손익", currency: "USD", amount: "-$12,000", count: "손실 2건", countTone: "danger", action: "상세 보기" },
  { label: "거래손익 검토", currency: "USD", amount: "$4,800", count: "3건", action: "검토하기" },
]

const overdueRows: AmountRow[] = [
  { label: "안데스미네랄", currency: "USD", amount: "$5,850", count: "D+34", countTone: "danger", action: "상세 보기" },
  { label: "Sakura Logistics", currency: "USD", amount: "$13,500", count: "D+31", countTone: "danger", action: "상세 보기" },
  { label: "Nordic Raw", currency: "EUR", amount: "€2,820", count: "D+12", countTone: "danger", action: "상세 보기" },
  { label: "한빛무역", currency: "JPY", amount: "¥237,000", count: "D+5", countTone: "danger", action: "상세 보기" },
]

const overdueTiles: Array<[string, string]> = [
  ["$19,350", "USD · 2건"],
  ["€2,820", "EUR · 1건"],
  ["¥237,000", "JPY · 1건"],
]

const benchmarkRows: Array<[string, string, string, string]> = [
  ["USD/KRW", "1,382.50 KRW", "▲ +0.4%", "2026-09-29"],
  ["EUR/KRW", "1,498.20 KRW", "▼ -0.8%", "2026-09-29"],
  ["JPY/KRW (100엔)", "921.40 KRW", "- 0.0%", "2026-09-29"],
  ["LME 알루미늄", "2,410 USD/t", "▲ +2.0%", "2026-09-26"],
  ["SCFI 운임지수", "1,862.3 pt", "—", "2026-09-26"],
]

const scheduleRows: Array<[string, string, string, string, string]> = [
  ["09.30", "받을 돈", "bg-[#e1faf5] text-[#147363]", "Sakura Logistics", "28,000 USD"],
  ["10.01", "줄 돈", "bg-[#fff2db] text-[#e69100]", "HMM Green", "12,400 USD"],
  ["10.02", "선적", "bg-[#dbf1fa] text-[#136686]", "ACME GmbH", "ETA 10.02"],
]

const documentRows: Array<[string, string, string, string, string, string, string]> = [
  ["CI", "상업송장", "인보이스_2607_003.pdf", "2026.08.27 14:32", "검토 대기", "항목 2개 확인 필요", "확인하기"],
  ["?", "유형 확인 필요", "스캔문서_유형확인_0918.pdf", "2026.09.18 09:05", "유형 확인 필요", "문서 유형을 선택해 주세요", "유형 확인"],
  ["BS", "은행거래내역서", "은행거래내역서_2026-08-27.pdf", "2026.08.27 15:06", "거래 연결 필요", "연결할 거래를 골라 주세요", "거래 연결"],
]

const shipmentDays = ["07.01", "07.02", "07.03", "07.04", "07.05", "07.06", "07.07"]
const shipmentRows = [
  { name: "Ever Ace · ACME GmbH", route: "ETD 07.01 → ETA 07.07", label: "해상 운송", start: 0, tone: "transit" as const },
  { name: "ONE Harmony · Sakura Logistics", route: "ETD 07.02 → ETA 07.07", label: "출항 준비", start: 1, tone: "preparing" as const },
]

const emptyCopy: Record<ModuleId, { icon: LucideIcon; text: string }> = {
  tasks: { icon: FileText, text: "지금 처리할 업무가 없습니다." },
  today: { icon: FileText, text: "오늘 결정할 업무가 없습니다." },
  progress: { icon: FileText, text: "진행 중인 검토 · 승인 · 거래 연결이 없습니다." },
  summary: { icon: FileText, text: "진행 중인 거래가 없습니다." },
  overdue: { icon: Search, text: "연체된 받을 돈이 없습니다." },
  benchmark: { icon: Search, text: "등록된 벤치마크 지표가 없습니다." },
  brief: { icon: FileText, text: "오늘 요약할 경고가 없습니다." },
  insight: { icon: FileText, text: "표시할 재무 변화가 없습니다." },
  monitoring: { icon: FileText, text: "오늘 처리할 예외가 없습니다." },
  schedule: { icon: FileText, text: "7일 내 예정된 일정이 없습니다." },
  documents: { icon: FileText, text: "검토 또는 배정을 기다리는 문서가 없습니다." },
  shipments: { icon: Ship, text: "연결된 선적 일정이 없습니다" },
}

function describe(id: ModuleId, role: HomeRole, state: HomeBoardState) {
  const taskCount = role === "member" ? 15 : 12
  switch (id) {
    case "tasks":
      return state === "default" ? `지금 처리할 업무 ${taskCount}건 · 우선순위순` : "지금 처리할 업무 · 우선순위순"
    case "today":
      return state === "default" ? "확인이 필요한 4건" : state === "empty" ? "확인이 필요한 0건" : "확인이 필요한 항목"
    case "progress":
      return "검토 · 승인 · 거래 연결 진행 중인 건수"
    case "summary":
      return "진행 중 거래 기준 · 거래 금액은 통화별"
    case "overdue":
      return state === "default" ? "30일 초과 2건 포함" : state === "empty" ? "30일 초과 0건 포함" : "30일 초과 포함"
    case "benchmark":
      return "시장·환율 지표 · 이전 관측값 대비"
    case "brief":
      return "오늘의 핵심 경고"
    case "insight":
      return "현금 흐름·마진 주요 변화"
    case "monitoring":
      return "오늘 처리율과 미확인 예외"
    case "schedule":
      return "7일 내 결제·수금·선적 일정"
    case "documents":
      return "업로드 후 14일 동안 검토·배정되지 않은 문서는 자동으로 삭제됩니다."
    case "shipments":
      return "거래별 선적과 구간 진행을 날짜축에서 확인합니다."
  }
}

/* ── Composite pieces (Figma components that shadcn does not ship) ── */

function StatTile({ icon: Icon, value, label, orientation }: { icon: LucideIcon; value: string; label: string; orientation: "vertical" | "horizontal" }) {
  const vertical = orientation === "vertical"
  return (
    <div
      data-slot="stat-tile"
      className={cn(
        "flex min-w-0 flex-1 rounded-[18px] border border-[#eef3ff] bg-[var(--color-gray-12)] shadow-[0_8px_24px_rgb(31_94_235/6%)]",
        vertical ? "flex-col gap-3.5 p-5" : "items-center gap-3 px-4 py-2.5",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5",
          vertical ? "bg-[#dbecfc] text-[var(--color-primary-4)]" : "bg-[var(--color-gray-11)] text-[var(--color-gray-5)]",
        )}
      >
        <Icon aria-hidden />
      </span>
      <span className={cn("grid min-w-0", vertical ? "gap-1" : "gap-0.5")}>
        <span className={cn("font-bold text-[var(--color-gray-2)] tabular-nums", vertical ? "text-[22px] leading-[30px]" : "text-[16px] leading-6")}>{value}</span>
        <span className="truncate text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-4)]">{label}</span>
      </span>
    </div>
  )
}

function ActionRow({ title, meta, action, onAction }: { title: string; meta: string; action: string; onAction: () => void }) {
  return (
    <div data-slot="task-row" className="flex min-h-[57px] items-center gap-3 border-b border-[var(--color-gray-10)] pl-5">
      <div className="grid min-w-0 flex-1 gap-0.5">
        <span className="truncate text-[length:var(--text-body-8)] leading-[22px] text-[var(--color-gray-2)]">{title}</span>
        <span className="truncate text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-5)]">{meta}</span>
      </div>
      <Button size="sm" className="min-w-20 pr-2.5 pl-3" onClick={onAction}>
        {action}
        <ChevronRight data-icon="inline-end" />
      </Button>
    </div>
  )
}

function AmountRows({ rows, onAction }: { rows: AmountRow[]; onAction: () => void }) {
  return (
    <div className="min-w-0">
      {rows.map((row) => (
        <div key={`${row.label}-${row.currency}-${row.amount}`} className="flex min-h-[57px] items-center border-b border-[var(--color-gray-10)] text-[length:var(--text-body-8)] leading-[22px] text-[var(--color-gray-2)]">
          <span className="min-w-0 flex-1 truncate px-5">{row.label}</span>
          <span className="flex flex-1 justify-center">
            <Badge className="h-6 w-[65px] justify-center bg-[var(--color-gray-10)] text-[17px] leading-6 text-[var(--color-gray-4)]">{row.currency}</Badge>
          </span>
          <span className="flex-1 truncate px-5 text-right tabular-nums">{row.amount}</span>
          <span className={cn("w-[70px] shrink-0 text-center", row.countTone === "danger" && "text-[var(--color-red-2)]")}>{row.count}</span>
          <span className="flex flex-1 justify-center">
            <Button variant="link" className="h-auto text-[17px] leading-6" onClick={onAction}>
              {row.action}
              <ArrowRight data-icon="inline-end" className="size-3.5" />
            </Button>
          </span>
        </div>
      ))}
    </div>
  )
}

const headCell = "h-10 bg-[var(--color-gray-11)] px-3 text-left text-[length:var(--text-body-8)] leading-[22px] font-normal text-[var(--color-gray-4)] first:pl-5"
const bodyCell = "h-[57px] border-b border-[var(--color-gray-10)] px-3 text-[length:var(--text-body-8)] leading-[22px] text-[var(--color-gray-2)] first:pl-5"

function ModuleState({ id, state, onRetry, onUpload }: { id: ModuleId; state: "empty" | "error"; onRetry: () => void; onUpload: () => void }) {
  const copy = emptyCopy[id]
  const Icon = state === "error" ? TriangleAlert : copy.icon
  return (
    <Empty className="h-full justify-center gap-4 p-4">
      <EmptyHeader className="gap-2">
        <EmptyMedia>
          <Icon aria-hidden />
        </EmptyMedia>
        <EmptyTitle className="text-[16px] leading-6 font-bold">{state === "error" ? "정보를 불러오지 못했습니다" : copy.text}</EmptyTitle>
        {state === "error" ? <EmptyDescription>잠시 후 다시 시도해 주세요.</EmptyDescription> : null}
      </EmptyHeader>
      {state === "error" ? (
        <EmptyContent>
          <Button variant="outline" size="lg" className="min-w-[100px] pr-4 pl-3.5" onClick={onRetry}>
            <RefreshCw data-icon="inline-start" />
            다시 시도
          </Button>
        </EmptyContent>
      ) : id === "documents" ? (
        <EmptyContent>
          <Button variant="outline" size="lg" className="min-w-[100px] pr-4 pl-3.5" onClick={onUpload}>
            <Plus data-icon="inline-start" />
            문서 올리기
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  )
}

function ModuleBody({ id, role, onNavigate }: { id: ModuleId; role: HomeRole; onNavigate: Navigate }) {
  const manager = role !== "member"
  switch (id) {
    case "tasks":
      return (
        <div className="grid content-start gap-2.5">
          {taskRows.slice(0, manager ? 12 : 15).map(([title, meta, action, target]) => (
            <ActionRow key={title} title={title} meta={meta} action={action} onAction={() => onNavigate(target)} />
          ))}
        </div>
      )
    case "today":
      return (
        <div>
          {todayRows.map(([title, meta]) => (
            <ActionRow key={title} title={title} meta={meta} action="처리하기" onAction={() => onNavigate("inbox")} />
          ))}
        </div>
      )
    case "progress":
    case "monitoring":
      return (
        <div className="flex h-full items-center">
          <div className="flex w-full gap-3 p-1">
            {(id === "progress" ? progressTiles : monitoringTiles).map(([icon, value, label]) => (
              <StatTile key={label} icon={icon} value={value} label={label} orientation="vertical" />
            ))}
          </div>
        </div>
      )
    case "summary":
      return (
        <div className="grid content-start gap-2">
          <div className="flex gap-3 p-1">
            {summaryTiles.map(([icon, value, label]) => (
              <StatTile key={label} icon={icon} value={value} label={label} orientation="horizontal" />
            ))}
          </div>
          <AmountRows rows={manager ? managerSummaryRows : memberSummaryRows} onAction={() => onNavigate("deals")} />
        </div>
      )
    case "overdue":
      return (
        <div className="grid content-start gap-2">
          <div className="flex gap-3 p-1">
            {overdueTiles.map(([value, label]) => (
              <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-[10px] border border-[#eef3ff] px-4 py-3">
                <span className="text-[length:var(--text-compat-body-5-5)] leading-[26px] font-bold tabular-nums text-[var(--color-gray-2)]">{value}</span>
                <span className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-4)]">{label}</span>
              </div>
            ))}
          </div>
          <AmountRows rows={overdueRows} onAction={() => onNavigate("settlement")} />
        </div>
      )
    case "benchmark":
      return (
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr>
              {["지표명", "현재 값", "변동률", "관측일"].map((label, index) => (
                <th key={label} className={cn(headCell, index > 0 && "text-center")}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {benchmarkRows.map(([name, value, change, date]) => (
              <tr key={name}>
                <td className={cn(bodyCell, "truncate")}>{name}</td>
                <td className={cn(bodyCell, "text-center tabular-nums")}>{value}</td>
                <td className={cn(bodyCell, "text-center text-[17px] leading-6 text-[var(--color-red-2)]")}>{change}</td>
                <td className={cn(bodyCell, "text-center text-[var(--color-gray-5)]")}>{date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    case "brief":
      return (
        <p className="border-b border-[#e6eaef] px-3 py-2 text-[length:var(--text-body-8)] leading-[22px] text-[var(--color-gray-2)]">
          미회수 연체와 조정 GP 손실이 가장 중요한 재무 경고입니다. 7일 내 순현금 유입은 안정적이며, 선적 2건은 B/L 확인이 필요합니다.
        </p>
      )
    case "insight":
      return (
        <div>
          {[
            ["현금 흐름", "7일 내 54,200.00 USD 순유입이 예상됩니다."],
            ["마진", "ACME GmbH 거래의 조정 GP가 손실 구간입니다."],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-2.5 border-b border-[var(--color-gray-10)] px-3 py-2 text-[length:var(--text-body-8)] leading-[22px]">
              <span className="w-[89px] shrink-0 text-[var(--color-gray-2)]">{label}</span>
              <span className="min-w-0 text-[var(--color-gray-5)]">{value}</span>
            </div>
          ))}
        </div>
      )
    case "schedule":
      return (
        <div>
          {scheduleRows.map(([date, kind, tone, party, value]) => (
            <div key={date} className="flex min-h-[57px] items-center border-b border-[var(--color-gray-10)] text-[length:var(--text-body-8)] leading-[22px]">
              <span className="w-[155px] shrink-0 px-5 text-[var(--color-gray-2)]">{date}</span>
              <span className="flex w-[58px] shrink-0 justify-center">
                <span className={cn("rounded-full px-2.5 text-[11px] leading-4", tone)}>{kind}</span>
              </span>
              <span className="min-w-0 flex-1 truncate text-center text-[var(--color-gray-2)]">{party}</span>
              <span className="w-[114px] shrink-0 text-center text-[var(--color-gray-4)]">{value}</span>
            </div>
          ))}
        </div>
      )
    case "documents":
      return (
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[14%]" />
            <col />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr>
              {["문서 유형", "파일", "등록일시", "상태", "작업"].map((label, index) => (
                <th key={label} className={cn(headCell, index > 0 && "text-center")}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {documentRows.map(([code, kind, file, date, status, hint, action]) => (
              <tr key={file}>
                <td className={bodyCell}>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-[4px] border border-[var(--color-gray-4)] px-[7px] text-[length:var(--text-body-10)] leading-[var(--leading-body-10)]">
                      <FileText aria-hidden className="size-3.5" />
                      {code}
                    </span>
                    <span className="truncate">{kind}</span>
                  </span>
                </td>
                <td className={cn(bodyCell, "truncate text-center text-[var(--color-gray-4)]")} title={file}>{file}</td>
                <td className={cn(bodyCell, "text-center text-[var(--color-gray-5)] tabular-nums")}>{date}</td>
                <td className={cn(bodyCell, "py-2 text-center")}>
                  <span className="grid justify-items-center gap-1.5">
                    <Badge palette="orange" tone="fill">{status}</Badge>
                    <span className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-5)]">{hint}</span>
                  </span>
                </td>
                <td className={cn(bodyCell, "text-center")}>
                  <span className="inline-flex items-center gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => onNavigate("inbox")}>{action}</Button>
                    <Button variant="ghost" size="icon-sm" aria-label={`${kind} 더보기`} className="text-[var(--color-gray-4)]">
                      <MoreHorizontal />
                    </Button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    case "shipments":
      return (
        <div className="min-w-0 text-[length:var(--text-body-8)] leading-[22px] text-[var(--color-gray-2)]">
          <div className="flex h-10 items-center bg-[var(--color-gray-11)] pl-5">도착 예정 {shipmentRows.length}건</div>
          <div className="flex h-10 items-center">
            <span className="w-[340px] shrink-0 px-5">선적 / 구간</span>
            <span className="grid min-w-0 flex-1 grid-cols-7 text-center">
              {shipmentDays.map((day) => <span key={day} className="px-1">{day}</span>)}
            </span>
          </div>
          {shipmentRows.map((row) => (
            <div key={row.name} className="flex h-[60px] items-center border-b border-[var(--color-gray-10)]">
              <span className="flex w-20 shrink-0 justify-center">
                <span className="inline-flex h-6 items-center rounded-full bg-[#ebfaef] px-2.5 text-[17px] leading-6 whitespace-nowrap text-[#0a9a32]">정상</span>
              </span>
              <span className="grid w-[260px] shrink-0 gap-0.5 px-5">
                <span className="truncate">{row.name}</span>
                <span className="truncate text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-4)]">{row.route}</span>
              </span>
              <span className="grid min-w-0 flex-1 grid-cols-7 py-2.5">
                {shipmentDays.map((day, index) => {
                  const active = index >= row.start
                  const first = index === row.start
                  const last = index === shipmentDays.length - 1
                  return (
                    <span
                      key={day}
                      className={cn(
                        "flex h-10 min-w-0 items-center justify-center",
                        active && (row.tone === "transit" ? "bg-[var(--color-primary-10)] text-[var(--color-primary-4)]" : "bg-[var(--color-gray-10)] text-[var(--color-gray-4)]"),
                        first && "ml-1 rounded-l-xl",
                        last && active && "mr-1 rounded-r-xl",
                      )}
                    >
                      {first ? <span className="truncate px-2.5">{row.label}</span> : null}
                    </span>
                  )
                })}
              </span>
            </div>
          ))}
        </div>
      )
  }
}

const wideModules = new Set<ModuleId>(["summary", "overdue", "benchmark", "schedule", "documents", "shipments"])

function ModuleCard({
  spec,
  role,
  state,
  onNavigate,
  onRetry,
  onDragStart,
  onDrop,
}: {
  spec: ModuleSpec
  role: HomeRole
  state: HomeBoardState
  onNavigate: Navigate
  onRetry: () => void
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void
  onDrop: (event: DragEvent<HTMLElement>) => void
}) {
  const { id } = spec
  const showViewAll = !(id === "documents" && state === "empty")
  const titleBadge =
    id === "documents" && state !== "error" ? (
      <Badge className="bg-[#dbf1fa] text-[#136686]">{state === "empty" ? "0건" : "14건"}</Badge>
    ) : id === "brief" ? (
      <span className="inline-flex items-center gap-0.5 pr-2.5 pl-2 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[#400adc]">AI 요약</span>
    ) : id === "insight" ? (
      <Badge palette="grayComplete" tone="fill">자동 요약</Badge>
    ) : null
  return (
    <Card
      data-home-module={id}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      style={{ "--home-module-columns": spec.columns, "--home-module-rows": spec.rows } as CSSProperties}
      className="col-span-full flex min-h-[360px] min-w-0 flex-col gap-4 overflow-hidden bg-[var(--color-gray-12)] p-5 shadow-[var(--shadow-modal)] ring-0 xl:col-[span_var(--home-module-columns)] xl:row-[span_var(--home-module-rows)] xl:min-h-0"
    >
      <div className="flex min-h-[52px] items-start gap-1">
        <button
          type="button"
          draggable
          onDragStart={onDragStart}
          aria-label={`${moduleTitles[id]} 모듈 이동`}
          title="끌어서 위치 변경"
          className="flex h-[26px] w-8 shrink-0 cursor-grab items-center justify-center rounded-lg text-[var(--color-indigo)] hover:bg-[var(--color-gray-11)] active:cursor-grabbing [&_svg]:size-[18px]"
        >
          <GripVertical aria-hidden />
        </button>
        <div className="grid min-w-0 flex-1 gap-1">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-[length:var(--text-compat-body-5-5)] leading-[26px] font-bold text-[var(--color-gray-2)]">{moduleTitles[id]}</h2>
            {titleBadge}
          </div>
          <p className="truncate text-[length:var(--text-body-8)] leading-[22px] text-[var(--color-gray-5)]">{describe(id, role, state)}</p>
        </div>
        {showViewAll ? (
          <Button variant="link" size="sm" className="mt-5 h-8 shrink-0 self-end text-[length:var(--text-body-10)]" onClick={() => onNavigate(moduleTargets[id])}>
            전체보기
            <ChevronRight data-icon="inline-end" />
          </Button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {state === "default" ? (
          // Below xl every module is full width (tablets were too narrow for the
          // two-column board); table-like modules still scroll sideways on phones.
          <div className={cn(wideModules.has(id) && "min-w-[600px] xl:min-w-0")}>
            <ModuleBody id={id} role={role} onNavigate={onNavigate} />
          </div>
        ) : (
          <ModuleState id={id} state={state} onRetry={onRetry} onUpload={() => onNavigate("inbox")} />
        )}
      </div>
    </Card>
  )
}

export function RoleHomeBoard({
  role,
  state,
  marketAccess = true,
  insightAccess = true,
  onNavigate,
  onRetry,
}: {
  role: HomeRole
  state: HomeBoardState
  marketAccess?: boolean
  insightAccess?: boolean
  onNavigate: Navigate
  onRetry: () => void
}) {
  const specs = useMemo(() => boardModules(role, marketAccess, insightAccess), [role, marketAccess, insightAccess])
  const [order, setOrder] = useState<ModuleId[] | null>(null)
  const [hidden, setHidden] = useState<ModuleId[]>([])
  const [dragged, setDragged] = useState<ModuleId | null>(null)
  const ordered = useMemo(() => {
    const ids = order?.filter((id) => specs.some((spec) => spec.id === id)) ?? specs.map((spec) => spec.id)
    return ids.map((id) => specs.find((spec) => spec.id === id)!).filter(Boolean)
  }, [order, specs])
  const visible = ordered.filter((spec) => !hidden.includes(spec.id))

  const moveBefore = (target: ModuleId) => {
    if (!dragged || dragged === target) return
    const ids = ordered.map((spec) => spec.id).filter((id) => id !== dragged)
    ids.splice(ids.indexOf(target), 0, dragged)
    setOrder(ids)
    setDragged(null)
  }

  return (
    <section aria-labelledby="home-board-title" className="grid gap-[15px]">
      <header className="flex min-h-14 items-center gap-[11px] rounded-[var(--r-lg)] bg-[var(--color-gray-12)] py-2 pr-5 pl-5 shadow-[var(--shadow-modal)]">
        <LayoutGrid aria-hidden className="size-[18px] shrink-0 text-[var(--color-gray-2)]" />
        <h2 id="home-board-title" className="text-[length:var(--text-compat-body-5-5)] leading-[26px] font-bold text-[var(--color-gray-2)]">업무판</h2>
        <span className="text-[length:var(--text-body-6)] leading-[var(--leading-body-6)] text-[var(--color-gray-5)]">
          모듈 {visible.length}/{ordered.length}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="lg" className="ml-auto min-w-[100px] gap-1.5 border-[var(--color-gray-10)] px-4 [&_svg]:size-5">
              <MoreVertical />
              모듈 편집
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>표시할 모듈</DropdownMenuLabel>
            {ordered.map((spec) => (
              <DropdownMenuCheckboxItem
                key={spec.id}
                checked={!hidden.includes(spec.id)}
                onCheckedChange={(checked) =>
                  setHidden((current) => (checked ? current.filter((id) => id !== spec.id) : [...current, spec.id]))
                }
              >
                {moduleTitles[spec.id]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-8 xl:auto-rows-[172px]">
        {visible.map((spec) => (
          <ModuleCard
            key={spec.id}
            spec={spec}
            role={role}
            state={state}
            onNavigate={onNavigate}
            onRetry={onRetry}
            onDragStart={() => setDragged(spec.id)}
            onDrop={() => moveBefore(spec.id)}
          />
        ))}
      </div>
    </section>
  )
}


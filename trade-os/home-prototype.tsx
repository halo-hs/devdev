import { Badge } from "@shared/components/ui/badge"
import { useState, type ReactNode } from "react"
import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileCheck2,
  FileUp,
  Send,
  Ship,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"

import { BusinessPageHero } from "@shared/components/business-page-hero"
import { Button } from "@shared/components/ui/button"
import { Card } from "@shared/components/ui/card"
import { Input } from "@shared/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"
import type { ErpMenuTarget } from "@trade-os/erp-menu-prototypes"
import { PlatformHomeOverview } from "@trade-os/platform-home-overview"
import { cn } from "@shared/lib/utils"

type Navigate = (
  screen: ErpMenuTarget,
  options?: { question?: string; submit?: boolean }
) => void

export type HomePreviewState = "default" | "empty" | "first-use" | "error"

type Tone = "neutral" | "blue" | "green" | "amber" | "red"

const toneClasses: Record<Tone, string> = {
  neutral:
    "bg-[var(--surface-muted-background)] text-[var(--surface-muted-foreground)]",
  blue: "bg-[var(--color-system-blue6)] text-[var(--color-system-blue1)]",
  green: "bg-[var(--color-system-green6)] text-[var(--color-system-green1)]",
  amber: "bg-[var(--color-system-yellow6)] text-[var(--color-system-yellow1)]",
  red: "bg-[var(--color-system-red8)] text-[var(--color-system-red1)]",
}

function Status({
  children,
  tone = "neutral",
}: {
  children: ReactNode
  tone?: Tone
}) {
  return (
    <Badge
      variant="secondary"
      className={cn("border-0 font-medium", toneClasses[tone])}
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
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold text-[var(--surface-foreground)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-xs text-[var(--surface-muted-foreground)]">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

const shortcutActions = [
  ["운영 감시", ShieldAlert, "monitoring"],
  ["결산 리포트", ClipboardList, "reports"],
  ["영업 성과", TrendingUp, "sales"],
  ["거래 보기", Building2, "deals"],
  ["AI에게 묻기", Bot, "ask"],
] as const

const memberShortcutActions = [
  ["파일 올리기", FileUp, "inbox"],
  ["문서 만들기", Sparkles, "create"],
  ["AI에게 묻기", Bot, "ask"],
  ["내 거래", Building2, "deals"],
  ["선적 보기", Ship, "shipments"],
] as const

type HomeShortcut = readonly [string, LucideIcon, ErpMenuTarget]

function HomeStartSection({
  ariaLabel,
  className,
  examples,
  onNavigate,
  placeholder,
  shortcuts,
}: {
  ariaLabel: string
  className?: string
  examples: readonly string[]
  onNavigate: Navigate
  placeholder: string
  shortcuts: readonly HomeShortcut[]
}) {
  const [question, setQuestion] = useState("")

  const submitQuestion = () => {
    const value = question.trim()
    if (!value) return
    onNavigate("ask", { question: value, submit: true })
  }

  return (
    <section
      aria-label={ariaLabel}
      className={cn("min-w-0 xl:col-start-1 xl:row-start-1", className)}
    >
      <BusinessPageHero
        variant="ai"
        compact
        eyebrow="ECOYA 업무 도우미"
        title="무엇이든 물어보세요"
        description="거래·정산·선적 데이터를 기준으로 확인할 업무와 근거를 찾습니다."
        controls={
          <div className="max-w-3xl">
            <div className="flex min-w-0 gap-2">
              <Input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitQuestion()
                }}
                placeholder={placeholder}
                aria-label="AI에게 질문"
                className="bg-[var(--surface-background)] text-[var(--surface-foreground)]"
              />
              <Button
                className="shrink-0 bg-[var(--color-indigo)] hover:bg-[var(--color-primary-1)]"
                disabled={!question.trim()}
                onClick={submitQuestion}
              >
                <Send /> 질문
              </Button>
            </div>

            <div className="mt-3 flex min-w-0 items-center gap-1.5 overflow-hidden text-[10px] text-white/75">
              <span className="shrink-0 font-medium text-white">예시</span>
              {examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  className="inline-flex h-6 min-w-0 items-center truncate rounded-full border border-white/20 bg-white/10 px-2 text-left leading-none text-white hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                  title={example}
                  onClick={() => setQuestion(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        }
        summary={
          <nav
            aria-label="업무 바로가기"
            className="flex min-w-0 gap-1 overflow-x-auto rounded-[var(--r-md)] border border-[var(--surface-border)] bg-[var(--surface-background)] p-1.5 shadow-[var(--shadow-section)]"
          >
            {shortcuts.map(([label, Icon, target]) => (
              <Button
                key={label}
                variant="ghost"
                size="sm"
                className="h-9 min-w-28 flex-1 justify-center gap-1.5 px-3 text-xs hover:bg-[var(--color-primary-10)]"
                onClick={() => onNavigate(target)}
              >
                <Icon className="size-4 text-[var(--color-primary-1)]" />
                <span className="max-w-full truncate">{label}</span>
              </Button>
            ))}
          </nav>
        }
      />
    </section>
  )
}

const memberMetricGroups = [
  {
    title: "오늘 내 업무",
    icon: CheckCircle2,
    value: "6건",
    detail: "완료 2건 · 남은 업무 4건",
    tone: "blue" as Tone,
  },
  {
    title: "마감 임박",
    icon: Clock3,
    value: "2건",
    detail: "가장 빠른 마감 11:30",
    tone: "amber" as Tone,
  },
  {
    title: "검토 요청",
    icon: FileCheck2,
    value: "1건",
    detail: "Owner 확인 대기",
    tone: "green" as Tone,
  },
] as const

const memberWorkGroups = [
  {
    label: "지금 처리",
    tone: "red" as Tone,
    items: [
      {
        title: "인보이스 단가 1건 확인",
        description: "ACME GmbH · 거래 연결이 차단되어 있습니다.",
        due: "지금",
        cta: "필드 확인",
        target: "inbox" as ErpMenuTarget,
      },
      {
        title: "B/L 증명과 포장명세 대조",
        description: "HMM Green · 수량 4MT가 일치하지 않습니다.",
        due: "11:30",
        cta: "서류 검증",
        target: "inbox" as ErpMenuTarget,
      },
    ],
  },
  {
    label: "오늘 안에",
    tone: "blue" as Tone,
    items: [
      {
        title: "ACME GmbH 받은 돈 기록",
        description: "오늘 만기 AR 42,000.00 USD입니다.",
        due: "오늘",
        cta: "입금 기록",
        target: "settlement" as ErpMenuTarget,
      },
      {
        title: "부산항 도착 선적 확인",
        description: "HMM Green · ETA가 2일 앞으로 당겨졌습니다.",
        due: "D-2",
        cta: "선적 보기",
        target: "shipments" as ErpMenuTarget,
      },
    ],
  },
] as const

const memberDeals = [
  ["ACME GmbH", "서류 확인", "3/5 완료", "deals"],
  ["Sakura Logistics", "입금 대기", "2/4 완료", "settlement"],
  ["BUSAN / HMM Green", "운송 중", "ETA 08.03", "shipments"],
] as const

const memberRequests = [
  {
    title: "Owner 검토 반려",
    description: "상업송장 수량을 다시 확인해주세요.",
    due: "지금",
    cta: "수정",
    target: "inbox" as ErpMenuTarget,
  },
  {
    title: "거래처 답변 필요",
    description: "ACME 결제일 변경 요청이 도착했습니다.",
    due: "오늘",
    cta: "답변",
    target: "deals" as ErpMenuTarget,
  },
  {
    title: "선적 서류 요청",
    description: "포워더가 보험 증권을 요청했습니다.",
    due: "D-1",
    cta: "제출",
    target: "shipments" as ErpMenuTarget,
  },
] as const

const memberWaitingResponses = [
  {
    title: "ACME 결제일 확정",
    description: "거래처 회신 대기",
    requestedAt: "2시간 전 요청",
  },
  {
    title: "HMM Green ETA 갱신",
    description: "포워더 회신 대기",
    requestedAt: "어제 요청",
  },
] as const

const metricGroups = [
  {
    title: "거래 현황",
    icon: Building2,
    items: [
      ["진행 거래", "12", "조직 전체"],
      ["거래액", "2,400,000.00 USD", ""],
    ],
  },
  {
    title: "손익·리스크",
    icon: TrendingUp,
    items: [
      ["조정 GP", "-12,000.00 USD", "검토 필요"],
      ["GP 리스크", "1건", "손실"],
    ],
  },
  {
    title: "마감·문서",
    icon: FileCheck2,
    items: [
      ["AR/AP 만기", "2건", "7일 이내"],
      ["서류 갭", "1건", "B/L 누락"],
      ["선적 리스크", "2건", "ETA 임박"],
    ],
  },
] as const

const schedules = [
  ["오늘", "수금", "ACME GmbH", "42,000.00 USD"],
  ["07.16", "지급", "Sakura Logistics", "28,000.00 USD"],
  ["07.18", "선적", "BUSAN / HMM Green", "ETA 08.03"],
] as const

const financeInsights = [
  ["현금 흐름", "7일 내 54,200.00 USD 순유입이 예상됩니다."],
  ["마진", "ACME GmbH 거래의 조정 GP가 손실 구간입니다."],
  ["환율 노출", "CNY 결제 1건이 금주 환율 변동에 노출되어 있습니다."],
] as const

const fxRates = [
  ["FX/USD/BRL", "5.1155 BRL"],
  ["FX/USD/CNY", "6.7776 CNY"],
  ["FX/USD/EUR", "0.8754 EUR"],
  ["FX/USD/GBP", "0.7469 GBP"],
] as const

const benchmarkRows = [
  ["fx usd brl", "5.1155 BRL", "2% ▲", "2026.07.13 09:00", "BRL"],
  ["fx usd cny", "6.7776 CNY", "2% ▲", "2026.07.13 09:00", "CNY"],
  ["fx usd eur", "0.8754 EUR", "3% ▼", "2026.07.13 09:00", "EUR"],
  ["fx usd gbp", "0.7469 GBP", "1% ▲", "2026.07.13 09:00", "GBP"],
] as const

type SegmentTone = "done" | "active" | "waiting" | "risk"

const segmentClasses: Record<SegmentTone, string> = {
  done: "border-[var(--color-system-green4)] bg-[var(--color-system-green6)] text-[var(--color-system-green1)]",
  active:
    "border-[var(--color-primary-7)] bg-[var(--color-primary-10)] text-[var(--color-primary-1)]",
  waiting:
    "border-dashed border-[var(--color-gray-8)] bg-[var(--color-gray-11)] text-[var(--color-gray-4)]",
  risk: "border-[var(--color-system-yellow3)] bg-[var(--color-system-yellow6)] text-[var(--color-system-yellow1)]",
}

const shipmentDates = [
  "07.29",
  "07.31",
  "08.02",
  "08.04",
  "08.06",
  "08.08",
  "08.10",
]

const shipmentLanes: Array<{
  id: string
  carrier: string
  meta: string
  status: string
  statusTone: Tone
  etaPosition: number
  segments: Array<{
    label: string
    left: number
    width: number
    tone: SegmentTone
  }>
}> = [
  {
    id: "SHP-240803",
    carrier: "HMM Green",
    meta: "BUSAN · ETA 08.03",
    status: "B/L 확인 필요",
    statusTone: "amber",
    etaPosition: 55,
    segments: [
      { label: "출항 준비", left: 3, width: 18, tone: "done" },
      { label: "해상 운송", left: 22, width: 27, tone: "active" },
      { label: "도착 처리", left: 50, width: 8, tone: "risk" },
    ],
  },
  {
    id: "SHP-240805",
    carrier: "ONE Harmony",
    meta: "INCHEON · ETA 08.05",
    status: "정상",
    statusTone: "green",
    etaPosition: 70,
    segments: [
      { label: "출항 준비", left: 8, width: 15, tone: "done" },
      { label: "대기", left: 24, width: 10, tone: "waiting" },
      { label: "해상 운송", left: 35, width: 39, tone: "active" },
    ],
  },
  {
    id: "SHP-240807",
    carrier: "Ever Ace",
    meta: "BUSAN · ETA 08.07",
    status: "보험 서류 확인",
    statusTone: "amber",
    etaPosition: 88,
    segments: [
      { label: "출항 준비", left: 15, width: 17, tone: "done" },
      { label: "해상 운송", left: 33, width: 35, tone: "active" },
      { label: "환적 대기", left: 69, width: 12, tone: "waiting" },
      { label: "도착 처리", left: 82, width: 9, tone: "risk" },
    ],
  },
]

const immediateActions = [
  {
    title: "연체 42,000.00 USD 위험 확인",
    description: "담당자의 회수 계획과 고객 응답을 확인해야 합니다.",
    due: "지금",
    target: "settlement" as const,
    cta: "위험 보기",
  },
  {
    title: "운영 예외 2건 담당자 확인",
    description: "기한 전 조치 담당자가 지정되지 않았습니다.",
    due: "오늘",
    target: "monitoring" as const,
    cta: "예외 보기",
  },
]

const decisionActions = [
  {
    title: "ACME GmbH",
    description: "조정 GP -12,000.00 USD",
    target: "settlement" as const,
    cta: "GP 검토",
  },
  {
    title: "서류 확인 대기",
    description: "AI 확인 문서 1건",
    target: "deals" as const,
    cta: "거래 보기",
  },
  {
    title: "필수 서류 갭",
    description: "B/L 누락 1건",
    target: "deals" as const,
    cta: "거래 보기",
  },
]

const cashRiskActions = [
  {
    title: "ACME GmbH",
    description: "42,000.00 USD",
    status: "받을 돈",
    tone: "green" as const,
  },
  {
    title: "Sakura Logistics",
    description: "28,000.00 USD",
    status: "줄 돈",
    tone: "amber" as const,
  },
]

function ShipmentSwimlane({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <section className="px-4 py-5 sm:px-5">
      <SectionHeading
        title="들어오는 선적"
        description="거래별 선적과 구간 진행을 날짜축에서 확인합니다."
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("shipments")}
          >
            전체 선적 <ArrowRight />
          </Button>
        }
      />

      <div className="overflow-x-auto pb-1">
        <div className="min-w-[780px]">
          <button
            type="button"
            className="mb-3 flex w-full items-center justify-between rounded-lg bg-[var(--surface-muted-background)] px-3 py-2 text-left transition-colors hover:bg-[var(--color-primary-10)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:outline-none"
            onClick={() => onNavigate("deal")}
          >
            <span className="flex items-center gap-2">
              <Building2 className="size-4 text-[var(--color-primary-4)]" />
              <strong className="text-sm">ACME GmbH</strong>
              <span className="text-xs text-[var(--surface-muted-foreground)]">
                거래 선적 3건
              </span>
            </span>
            <Status tone="amber">위험 2건</Status>
          </button>

          <div className="grid grid-cols-[180px_minmax(0,1fr)] items-end gap-3 px-2 pb-2">
            <span className="text-xs font-medium text-[var(--surface-muted-foreground)]">
              선적 / 구간
            </span>
            <div className="grid grid-cols-7 text-center text-[11px] text-[var(--surface-muted-foreground)]">
              {shipmentDates.map((date) => (
                <span key={date}>{date}</span>
              ))}
            </div>
          </div>

          <div className="divide-y divide-[var(--surface-border)] border-y border-[var(--surface-border)]">
            {shipmentLanes.map((shipment) => (
              <div
                key={shipment.id}
                className="grid grid-cols-[180px_minmax(0,1fr)] items-center gap-3 px-2 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Ship className="size-4 shrink-0 text-[var(--color-primary-4)]" />
                    <span className="truncate text-sm font-medium">
                      {shipment.carrier}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[11px] text-[var(--surface-muted-foreground)]">
                      {shipment.meta}
                    </span>
                    <Status tone={shipment.statusTone}>
                      {shipment.status}
                    </Status>
                  </div>
                </div>

                <div className="relative h-10 overflow-hidden rounded-lg bg-[var(--surface-muted-background)]">
                  <div className="absolute inset-0 grid grid-cols-7">
                    {shipmentDates.map((date, index) => (
                      <span
                        key={date}
                        className={cn(
                          index > 0 && "border-l border-[var(--surface-border)]"
                        )}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-y-0 left-[36%] z-10 w-px bg-[var(--color-system-blue2)]/45">
                    <span className="absolute -top-4 -translate-x-1/2 text-[10px] font-medium text-[var(--color-system-blue1)]">
                      오늘
                    </span>
                  </div>
                  {shipment.segments.map((segment) => (
                    <button
                      key={`${shipment.id}-${segment.label}`}
                      type="button"
                      aria-label={`${shipment.carrier} ${segment.label} 구간 보기`}
                      className={cn(
                        "absolute top-1/2 z-20 h-7 -translate-y-1/2 truncate rounded-md border px-2 text-[11px] font-medium shadow-sm transition-[filter] hover:brightness-95 focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:outline-none",
                        segmentClasses[segment.tone]
                      )}
                      style={{
                        left: `${segment.left}%`,
                        width: `${segment.width}%`,
                      }}
                      onClick={() => onNavigate("shipments")}
                    >
                      {segment.label}
                    </button>
                  ))}
                  <span
                    aria-hidden="true"
                    className="absolute top-1/2 z-30 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-[var(--color-primary-1)] bg-[var(--color-primary-4)]"
                    style={{ left: `${shipment.etaPosition}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-[var(--surface-muted-foreground)]">
            <span className="flex items-center gap-1.5">
              <i className="size-2 rounded-sm bg-[var(--color-system-green3)]" />
              완료
            </span>
            <span className="flex items-center gap-1.5">
              <i className="size-2 rounded-sm bg-[var(--color-primary-6)]" />
              진행
            </span>
            <span className="flex items-center gap-1.5">
              <i className="size-2 rounded-sm bg-[var(--color-system-yellow3)]" />
              확인 필요
            </span>
            <span>◆ ETA</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function ActionPanel({
  onNavigate,
  className,
}: {
  onNavigate: Navigate
  className?: string
}) {
  return (
    <Card
      className={cn(
        "h-fit gap-0 overflow-hidden border-[var(--surface-border)] bg-[var(--surface-background)] py-0 shadow-[var(--shadow-section)]",
        className
      )}
    >
      <aside aria-label="액션 필요" className="min-w-0">
        <header className="flex items-center justify-between border-b border-[var(--surface-border)] px-4 py-4 sm:px-5">
          <div>
            <p className="text-xs font-medium text-[var(--color-primary-4)]">
              ACTION
            </p>
            <h2 className="mt-1 text-base font-semibold">액션 필요</h2>
          </div>
          <Status tone="blue">7건</Status>
        </header>

        <section className="px-4 py-4 sm:px-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">즉시 할 일</h3>
            <Status tone="red">2건</Status>
          </div>
          <div className="divide-y divide-[var(--surface-border)]">
            {immediateActions.map((item) => (
              <div key={item.title} className="py-3 first:pt-1">
                <div className="flex items-start gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-[var(--color-system-red1)]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-system-red1)]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--surface-muted-foreground)]">
                      {item.description}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-xs text-[var(--surface-muted-foreground)]">
                        {item.due}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigate(item.target)}
                      >
                        {item.cta}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-[var(--surface-border)] px-4 py-4 sm:px-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">결정 필요</h3>
            <Status tone="amber">3건</Status>
          </div>
          <div className="divide-y divide-[var(--surface-border)]">
            {decisionActions.map((item) => (
              <div
                key={item.title}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p
                    className={cn(
                      "mt-1 truncate text-xs text-[var(--surface-muted-foreground)]",
                      item.description.includes("-12,000") &&
                        "text-[var(--color-system-red1)]"
                    )}
                  >
                    {item.description}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate(item.target)}
                >
                  {item.cta}
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-[var(--surface-border)] px-4 py-4 sm:px-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">현금 위험</h3>
            <Status tone="amber">2건</Status>
          </div>
          <p className="mb-2 text-xs text-[var(--surface-muted-foreground)]">
            처리 예정 외 위험과 노출을 확인합니다.
          </p>
          <div className="divide-y divide-[var(--surface-border)]">
            {cashRiskActions.map((item) => (
              <div
                key={item.title}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1 py-3"
              >
                <Status tone={item.tone}>{item.status}</Status>
                <span className="truncate text-sm font-medium">
                  {item.title}
                </span>
                <span />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium tabular-nums">
                    {item.description}
                  </span>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto px-0"
                    onClick={() => onNavigate("settlement")}
                  >
                    위험 보기
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </Card>
  )
}

function FxPanel() {
  return (
    <Card className="h-fit gap-0 overflow-hidden border-[var(--surface-border)] bg-[var(--surface-background)] py-0 shadow-[var(--shadow-section)]">
      <aside aria-label="오늘 환율" className="min-w-0">
        <header className="border-b border-[var(--surface-border)] px-4 py-4 sm:px-5">
          <h2 className="text-base font-semibold">환율 (오늘)</h2>
          <p className="mt-1 text-xs text-[var(--surface-muted-foreground)]">
            거래 통화별 최신 관측값
          </p>
        </header>
        <div className="divide-y divide-[var(--surface-border)] px-4 sm:px-5">
          {fxRates.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 py-3"
            >
              <span className="text-xs text-[var(--surface-muted-foreground)]">
                {label}
              </span>
              <strong className="shrink-0 text-sm font-semibold tabular-nums">
                {value}
              </strong>
            </div>
          ))}
        </div>
      </aside>
    </Card>
  )
}

function MemberActionPanel({
  onNavigate,
  className,
}: {
  onNavigate: Navigate
  className?: string
}) {
  return (
    <Card
      className={cn(
        "h-fit gap-0 overflow-hidden border-[var(--surface-border)] bg-[var(--surface-background)] py-0 shadow-[var(--shadow-section)]",
        className
      )}
    >
      <aside aria-label="내 액션">
        <header className="flex items-center justify-between border-b border-[var(--surface-border)] px-4 py-4 sm:px-5">
          <div>
            <p className="text-xs font-medium text-[var(--color-primary-4)]">
              MY ACTION
            </p>
            <h2 className="mt-1 text-base font-semibold">내 액션</h2>
          </div>
          <Status tone="blue">5건</Status>
        </header>

        <section className="px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">내가 처리할 요청</h3>
            <Status tone="red">3건</Status>
          </div>
          <p className="mt-1 text-xs text-[var(--surface-muted-foreground)]">
            내 수정·답변·제출이 있어야 다음 단계로 넘어갑니다.
          </p>
          <div className="divide-y divide-[var(--surface-border)]">
            {memberRequests.map((item) => (
              <div key={item.title} className="py-3">
                <div className="flex items-start gap-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-[var(--color-system-red1)]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--surface-muted-foreground)]">
                      {item.description}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-xs text-[var(--surface-muted-foreground)]">
                        {item.due}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigate(item.target)}
                      >
                        {item.cta}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-[var(--surface-border)] px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">상대 응답 대기</h3>
            <Status tone="amber">2건</Status>
          </div>
          <p className="mt-1 text-xs text-[var(--surface-muted-foreground)]">
            나는 요청을 마쳤고 거래처·포워더의 응답을 기다립니다.
          </p>
          <div className="mt-3 space-y-3">
            {memberWaitingResponses.map((item) => (
              <div
                key={item.title}
                className="rounded-lg bg-[var(--surface-muted-background)] px-3 py-3"
              >
                <p className="text-sm font-medium">{item.title}</p>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-[var(--surface-muted-foreground)]">
                  <span>{item.description}</span>
                  <span className="shrink-0">{item.requestedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </Card>
  )
}

// 기존 역할별 홈은 모듈형 홈 검토 기간 동안 비교용으로 보존합니다.
export function LegacyMemberHomePrototype({
  onNavigate,
}: {
  onNavigate: Navigate
}) {
  return (
    <div
      data-slot="business-page"
      className="h-full overflow-y-auto bg-background"
    >
      <div className="w-full p-4 sm:p-5 xl:p-6">
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <main className="contents">
            <HomeStartSection
              ariaLabel="오늘 업무 시작"
              className="xl:col-span-2"
              examples={[
                "오늘 먼저 처리할 업무는?",
                "내 담당 거래 진행 상황은?",
                "확인할 서류가 있어?",
              ]}
              onNavigate={onNavigate}
              placeholder="예: 오늘 먼저 처리할 업무는?"
              shortcuts={memberShortcutActions}
            />

            <MemberActionPanel
              onNavigate={onNavigate}
              className="min-w-0 xl:col-start-2 xl:row-start-2"
            />

            <div className="@container min-w-0 xl:col-start-1 xl:row-start-2">
              <section className="grid gap-3 @min-[600px]:grid-cols-3">
                {memberMetricGroups.map(
                  ({ title, icon: Icon, value, detail, tone }) => (
                    <Card
                      key={title}
                      className="min-w-0 gap-0 border-[var(--surface-border)] bg-[var(--surface-background)] py-0 shadow-[var(--shadow-section)]"
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <Icon className="size-4 shrink-0 text-[var(--color-primary-4)]" />
                            <h2 className="truncate text-sm font-semibold">
                              {title}
                            </h2>
                          </div>
                          <Status tone={tone}>{value}</Status>
                        </div>
                        <p className="mt-4 text-xs text-[var(--surface-muted-foreground)]">
                          {detail}
                        </p>
                      </div>
                    </Card>
                  )
                )}
              </section>

              <section className="mt-4 overflow-hidden rounded-[var(--r-lg)] border border-[var(--surface-border)] bg-[var(--surface-background)] shadow-[var(--shadow-section)]">
                <div className="border-b border-[var(--surface-border)] px-4 py-4 sm:px-5">
                  <SectionHeading
                    title="내 작업함"
                    description="오늘 배정된 업무를 마감 순서대로 보여줍니다."
                    action={<Status tone="blue">남은 업무 4건</Status>}
                  />
                </div>
                {memberWorkGroups.map((group) => (
                  <div key={group.label}>
                    <div className="flex items-center justify-between bg-[var(--surface-muted-background)] px-4 py-2 sm:px-5">
                      <span className="text-xs font-medium">{group.label}</span>
                      <Status tone={group.tone}>{group.items.length}건</Status>
                    </div>
                    <div className="divide-y divide-[var(--surface-border)]">
                      {group.items.map((item) => (
                        <div
                          key={item.title}
                          className="grid items-center gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_64px_auto] sm:px-5"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="mt-1 truncate text-xs text-[var(--surface-muted-foreground)]">
                              {item.description}
                            </p>
                          </div>
                          <span className="text-xs text-[var(--surface-muted-foreground)] sm:text-right">
                            {item.due}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onNavigate(item.target)}
                          >
                            {item.cta}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </section>

              <div className="mt-4 overflow-hidden rounded-[var(--r-lg)] border border-[var(--surface-border)] bg-[var(--surface-background)] shadow-[var(--shadow-section)]">
                <section className="grid lg:grid-cols-[1fr_1.15fr] lg:divide-x lg:divide-[var(--surface-border)]">
                  <div className="p-4 sm:p-5">
                    <SectionHeading
                      title="내 담당 거래"
                      description="현재 내가 이어서 처리할 거래"
                    />
                    <div className="divide-y divide-[var(--surface-border)]">
                      {memberDeals.map(([title, status, progress, target]) => (
                        <button
                          key={title}
                          type="button"
                          className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 text-left hover:text-[var(--color-primary-1)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:outline-none"
                          onClick={() => onNavigate(target)}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {title}
                            </p>
                            <p className="mt-1 text-xs text-[var(--surface-muted-foreground)]">
                              {status}
                            </p>
                          </div>
                          <span className="text-xs text-[var(--surface-muted-foreground)] tabular-nums">
                            {progress}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-[var(--surface-border)] p-4 sm:p-5 lg:border-t-0">
                    <SectionHeading
                      title="이번 주 일정"
                      description="내 담당 결제·수금·선적 일정"
                    />
                    <div className="divide-y divide-[var(--surface-border)]">
                      {schedules.map(([date, type, title, meta]) => (
                        <button
                          key={`${date}-${title}`}
                          type="button"
                          className="grid w-full grid-cols-[54px_48px_minmax(0,1fr)_auto] items-center gap-2 px-2 py-2.5 text-left hover:bg-[var(--color-primary-10)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:outline-none focus-visible:ring-inset"
                          onClick={() =>
                            onNavigate(
                              type === "선적" ? "shipments" : "settlement"
                            )
                          }
                        >
                          <span className="text-xs text-[var(--surface-muted-foreground)]">
                            {date}
                          </span>
                          <Status
                            tone={
                              type === "수금"
                                ? "green"
                                : type === "지급"
                                  ? "amber"
                                  : "blue"
                            }
                          >
                            {type}
                          </Status>
                          <span className="truncate text-sm font-medium">
                            {title}
                          </span>
                          <span className="text-xs text-[var(--surface-muted-foreground)] tabular-nums">
                            {meta}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <ShipmentSwimlane onNavigate={onNavigate} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function EmptyHomePrototype({
  onNavigate,
  state,
}: {
  onNavigate: Navigate
  state: Exclude<HomePreviewState, "default">
}) {
  const isError = state === "error"
  const isFirstUse = state === "first-use"

  const metrics = [
    ["진행 거래", isError ? "—" : "0건"],
    ["거래 금액", "—"],
    ["중요 서류", isError ? "—" : "0건"],
    ["선적", isError ? "—" : "0건"],
    ["받을 돈", isError ? "—" : "0건"],
    ["확인 필요", isError ? "—" : "0건"],
  ] as const

  const activityRows = [
    ["검토 대기", isError ? "—" : "0건"],
    ["승인 대기", isError ? "—" : "0건"],
    ["거래 연결 필요", isError ? "—" : "0건"],
  ] as const

  return (
    <div
      data-slot="business-page"
      className="h-full overflow-y-auto bg-[var(--surface-muted-background)]"
    >
      <div className="w-full p-4 sm:p-5 xl:p-6">
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.72fr)]">
          <HomeStartSection
            ariaLabel="홈 업무 시작"
            className="xl:col-span-2"
            examples={[
              "오늘 먼저 처리할 업무는?",
              "입금 예정인 거래는?",
              "확인할 서류가 있어?",
            ]}
            onNavigate={onNavigate}
            placeholder="예: 오늘 먼저 처리할 업무는?"
            shortcuts={memberShortcutActions}
          />

          <Card className="min-w-0 gap-0 overflow-hidden border-[var(--surface-border)] bg-[var(--surface-background)] py-0 shadow-[var(--shadow-section)]">
            <section aria-labelledby="empty-home-action-title">
              <header className="flex min-h-16 items-center justify-between gap-4 border-b border-[var(--surface-border)] px-4 py-3 sm:px-5">
                <div className="min-w-0">
                  <h2
                    id="empty-home-action-title"
                    className="text-base font-semibold"
                  >
                    오늘 확인이 필요합니다
                  </h2>
                  <p className="mt-1 text-xs text-[var(--surface-muted-foreground)]">
                    처리 순서가 필요한 업무를 보여줍니다.
                  </p>
                </div>
                <Status tone={isError ? "red" : "neutral"}>
                  {isError ? "확인 실패" : "0건"}
                </Status>
              </header>

              <div className="flex min-h-52 flex-col items-center justify-center px-5 py-8 text-center">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full",
                    isError
                      ? "bg-[var(--color-system-red8)] text-[var(--color-system-red1)]"
                      : "bg-[var(--color-system-green6)] text-[var(--color-system-green1)]"
                  )}
                >
                  {isError ? (
                    <ShieldAlert className="size-5" />
                  ) : (
                    <CheckCircle2 className="size-5" />
                  )}
                </span>
                <h3 className="mt-3 text-sm font-semibold">
                  {isError
                    ? "업무 목록을 불러오지 못했습니다"
                    : isFirstUse
                      ? "아직 등록된 문서가 없습니다"
                      : "오늘 확인할 업무가 없습니다"}
                </h3>
                <p className="mt-1.5 max-w-md text-xs leading-5 text-[var(--surface-muted-foreground)]">
                  {isError
                    ? "연결 상태를 확인한 뒤 다시 불러와 주세요. 기존 업무는 변경되지 않습니다."
                    : isFirstUse
                      ? "첫 문서를 올리면 검토와 거래 연결이 필요한 업무가 이 목록에 표시됩니다."
                      : "새 업무가 생기면 처리 순서에 맞춰 이 목록에 표시됩니다."}
                </p>
                {isError ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => window.location.reload()}
                  >
                    다시 불러오기
                  </Button>
                ) : isFirstUse ? (
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Button size="sm" onClick={() => onNavigate("inbox")}>
                      <FileUp /> 문서 올리기
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate("create")}
                    >
                      <Sparkles /> 문서 만들기
                    </Button>
                  </div>
                ) : null}
              </div>
            </section>
          </Card>

          <Card className="min-w-0 gap-0 overflow-hidden border-[var(--surface-border)] bg-[var(--surface-background)] py-0 shadow-[var(--shadow-section)]">
            <aside aria-labelledby="empty-home-status-title">
              <header className="border-b border-[var(--surface-border)] px-4 py-3 sm:px-5">
                <h2
                  id="empty-home-status-title"
                  className="text-base font-semibold"
                >
                  진행 현황
                </h2>
                <p className="mt-1 text-xs text-[var(--surface-muted-foreground)]">
                  문서와 거래의 현재 상태
                </p>
              </header>

              <div className="divide-y divide-[var(--surface-border)] px-4 sm:px-5">
                {activityRows.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <span className="text-xs text-[var(--surface-muted-foreground)]">
                      {label}
                    </span>
                    <strong className="text-sm font-semibold tabular-nums">
                      {value}
                    </strong>
                  </div>
                ))}
              </div>

              <section className="border-t border-[var(--surface-border)] px-4 py-4 sm:px-5">
                <p className="text-xs text-[var(--surface-muted-foreground)]">
                  이번 주 받을 돈
                </p>
                <strong className="mt-1 block text-xl font-semibold tabular-nums">
                  —
                </strong>
                <p className="mt-2 text-xs text-[var(--surface-muted-foreground)]">
                  확인할 정산 일정이 없습니다.
                </p>
              </section>
            </aside>
          </Card>

          <Card className="min-w-0 gap-0 overflow-hidden border-[var(--surface-border)] bg-[var(--surface-background)] py-0 shadow-[var(--shadow-section)] xl:col-span-2">
            <section
              aria-label="업무 요약"
              className="grid grid-cols-2 divide-x divide-y divide-[var(--surface-border)] sm:grid-cols-3 xl:grid-cols-6 xl:divide-y-0"
            >
              {metrics.map(([label, value]) => (
                <div key={label} className="min-w-0 px-4 py-4 sm:px-5">
                  <p className="text-xs text-[var(--surface-muted-foreground)]">
                    {label}
                  </p>
                  <strong className="mt-2 block truncate text-lg font-semibold tabular-nums">
                    {value}
                  </strong>
                </div>
              ))}
            </section>
          </Card>

          <Card className="min-w-0 gap-0 overflow-hidden border-[var(--surface-border)] bg-[var(--surface-background)] py-0 shadow-[var(--shadow-section)] xl:col-span-2">
            <section aria-labelledby="empty-home-shipment-title">
              <header className="flex min-h-16 items-center justify-between gap-4 border-b border-[var(--surface-border)] px-4 py-3 sm:px-5">
                <div>
                  <h2
                    id="empty-home-shipment-title"
                    className="text-base font-semibold"
                  >
                    선적 일정
                  </h2>
                  <p className="mt-1 text-xs text-[var(--surface-muted-foreground)]">
                    거래별 선적과 도착 일정을 보여줍니다.
                  </p>
                </div>
                <Status tone="neutral">{isError ? "—" : "0건"}</Status>
              </header>

              <div className="grid min-h-28 place-items-center px-5 py-6 text-center">
                <div>
                  <Ship className="mx-auto size-5 text-[var(--surface-muted-foreground)]" />
                  <p className="mt-2 text-sm font-medium">
                    {isError
                      ? "선적 일정을 불러오지 못했습니다"
                      : "예정된 선적 일정이 없습니다"}
                  </p>
                </div>
              </div>
            </section>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function LegacyOwnerHomePrototype({
  onNavigate,
}: {
  onNavigate: Navigate
}) {
  return (
    <div
      data-slot="business-page"
      className="h-full overflow-y-auto bg-background"
    >
      <div className="w-full p-4 sm:p-5 xl:p-6">
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <main className="contents">
            <HomeStartSection
              ariaLabel="홈 업무 시작"
              examples={[
                "이번 달 ACME 매출은?",
                "확정 안 된 인보이스 몇 건?",
                "미수금 거래처는?",
              ]}
              onNavigate={onNavigate}
              placeholder="예: 이번 달 ACME 매출은?"
              shortcuts={shortcutActions}
              className="xl:col-span-2 xl:row-start-1"
            />

            <div className="flex min-w-0 flex-col gap-4 xl:col-start-2 xl:row-start-2">
              <ActionPanel onNavigate={onNavigate} />
              <FxPanel />
            </div>

            <div className="@container min-w-0 xl:col-start-1 xl:row-start-2">
              <section className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--surface-border)] bg-[var(--surface-background)] shadow-[var(--shadow-section)]">
                <div className="grid divide-y divide-[var(--surface-border)] @min-[780px]:grid-cols-3 @min-[780px]:divide-x @min-[780px]:divide-y-0">
                  {metricGroups.map(({ title, icon: Icon, items }) => (
                    <section key={title} className="min-w-0 p-4 sm:p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <Icon className="size-4 text-[var(--color-primary-4)]" />
                        <h2 className="text-sm font-semibold">{title}</h2>
                      </div>
                      <div
                        className={cn(
                          "grid gap-3",
                          items.length === 3 ? "grid-cols-3" : "grid-cols-2"
                        )}
                      >
                        {items.map(([label, value, note]) => (
                          <div key={label} className="min-w-0">
                            <p className="text-xs text-[var(--surface-muted-foreground)]">
                              {label}
                            </p>
                            <strong
                              className={cn(
                                "mt-1 block truncate text-base font-semibold tabular-nums",
                                value.length > 13 && "text-sm tracking-tight",
                                value.startsWith("-") &&
                                  "text-[var(--color-system-red1)]"
                              )}
                              title={value}
                            >
                              {value}
                            </strong>
                            {note ? (
                              <p
                                className={cn(
                                  "mt-1 text-[11px] text-[var(--surface-muted-foreground)]",
                                  (note === "검토 필요" || note === "손실") &&
                                    "text-[var(--color-system-red1)]"
                                )}
                              >
                                {note}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </section>

              <div className="mt-4 overflow-hidden rounded-[var(--r-lg)] border border-[var(--surface-border)] bg-[var(--surface-background)]">
                <section className="grid lg:grid-cols-[0.9fr_1.4fr] lg:divide-x lg:divide-[var(--surface-border)]">
                  <div className="p-4 sm:p-5">
                    <SectionHeading
                      title="운영 감시"
                      description="오늘 처리율과 미확인 예외"
                      action={<Status tone="amber">확인 필요</Status>}
                    />
                    <div className="grid grid-cols-3 divide-x divide-[var(--surface-border)] rounded-lg bg-[var(--surface-muted-background)] py-3 text-center">
                      {[
                        ["오늘 처리", "6건"],
                        ["완료율", "75%"],
                        ["미확인 이슈", "2건"],
                      ].map(([label, value]) => (
                        <div key={label} className="px-2">
                          <p className="text-[11px] text-[var(--surface-muted-foreground)]">
                            {label}
                          </p>
                          <strong className="mt-1 block text-lg tabular-nums">
                            {value}
                          </strong>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2 h-auto px-0"
                      onClick={() => onNavigate("monitoring")}
                    >
                      운영 상태 보기 <ArrowRight />
                    </Button>
                  </div>

                  <div className="border-t border-[var(--surface-border)] p-4 sm:p-5 lg:border-t-0">
                    <SectionHeading
                      title="이번 주 일정"
                      description="7일 내 결제·수금·선적 일정"
                    />
                    <div className="divide-y divide-[var(--surface-border)]">
                      {schedules.map(([date, type, title, meta]) => (
                        <button
                          key={`${date}-${title}`}
                          type="button"
                          className="grid w-full grid-cols-[54px_48px_minmax(0,1fr)_auto] items-center gap-2 px-2 py-2.5 text-left transition-colors hover:bg-[var(--color-primary-10)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:outline-none focus-visible:ring-inset"
                          onClick={() =>
                            onNavigate(
                              type === "선적" ? "shipments" : "settlement"
                            )
                          }
                        >
                          <span className="text-xs text-[var(--surface-muted-foreground)]">
                            {date}
                          </span>
                          <Status
                            tone={
                              type === "수금"
                                ? "green"
                                : type === "지급"
                                  ? "amber"
                                  : "blue"
                            }
                          >
                            {type}
                          </Status>
                          <span className="truncate text-sm font-medium">
                            {title}
                          </span>
                          <span className="text-xs text-[var(--surface-muted-foreground)] tabular-nums">
                            {meta}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <ShipmentSwimlane onNavigate={onNavigate} />
              </div>

              <Card className="mt-4 gap-0 overflow-hidden border-[var(--surface-border)] bg-[var(--surface-background)] py-0 shadow-[var(--shadow-section)]">
                <div className="grid lg:grid-cols-[0.8fr_1.4fr] lg:divide-x lg:divide-[var(--surface-border)]">
                  <section className="p-4 sm:p-5">
                    <SectionHeading
                      title="경영 브리프"
                      action={<Status tone="green">자동 요약</Status>}
                    />
                    <p className="text-sm leading-6">
                      미회수 연체와 조정 GP 손실이 가장 중요한 재무 경고입니다.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--surface-muted-foreground)]">
                      7일 내 순현금 유입은 안정적이며, 선적 2건은 B/L 확인이
                      필요합니다.
                    </p>
                  </section>

                  <section className="border-t border-[var(--surface-border)] p-4 sm:p-5 lg:border-t-0">
                    <SectionHeading title="재무 인사이트" />
                    <div className="divide-y divide-[var(--surface-border)]">
                      {financeInsights.map(([label, value]) => (
                        <div
                          key={label}
                          className="grid gap-2 py-2.5 sm:grid-cols-[90px_minmax(0,1fr)]"
                        >
                          <strong className="text-sm">{label}</strong>
                          <span className="text-sm text-[var(--surface-muted-foreground)]">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <section className="border-t border-[var(--surface-border)] px-4 py-5 sm:px-5">
                  <SectionHeading
                    title="관련 벤치마크"
                    description="시장·환율 참조 지표의 최신 관측"
                  />
                  <div className="overflow-x-auto">
                    <Table className="min-w-[660px]">
                      <TableHeader>
                        <TableRow className="bg-[var(--surface-muted-background)] hover:bg-[var(--surface-muted-background)]">
                          <TableHead className="text-left">지표</TableHead>
                          <TableHead className="w-[150px] text-right">
                            값
                          </TableHead>
                          <TableHead className="w-[90px] text-right">
                            전일대비
                          </TableHead>
                          <TableHead className="w-[180px] text-left">
                            관측일
                          </TableHead>
                          <TableHead className="w-[70px] text-left">
                            단위
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {benchmarkRows.map(
                          ([series, value, delta, observedAt, unit]) => (
                            <TableRow key={series}>
                              <TableCell className="text-left">
                                {series}
                              </TableCell>
                              <TableCell className="text-right font-medium tabular-nums">
                                {value}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "text-right tabular-nums",
                                  delta.includes("▼")
                                    ? "text-[var(--color-system-red1)]"
                                    : "text-[var(--color-primary-4)]"
                                )}
                              >
                                {delta}
                              </TableCell>
                              <TableCell className="text-left text-[var(--surface-muted-foreground)]">
                                {observedAt}
                              </TableCell>
                              <TableCell className="text-left text-[var(--surface-muted-foreground)]">
                                {unit}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </section>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export function HomePrototype({
  onNavigate,
  role = "owner",
  previewState = "default",
}: {
  onNavigate: Navigate
  role?: "owner" | "member"
  previewState?: HomePreviewState
}) {
  if (previewState === "empty") {
    return <PlatformHomeOverview onNavigate={onNavigate} role={role} empty />
  }

  if (previewState !== "default") {
    return <EmptyHomePrototype onNavigate={onNavigate} state={previewState} />
  }

  return <PlatformHomeOverview onNavigate={onNavigate} role={role} />
}

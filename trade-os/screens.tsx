import { Tabs, TabsList, TabsTrigger, TabsContent } from "@shared/components/ui/tabs"
import { counterpartyPreview, counterpartyPreviewAccess, type CounterpartyAccess } from "@trade-os/counterparty-workspace"
import { listDealDocuments } from "@trade-os/lib/deal-document-actions"
import { orderProgress } from "@trade-os/lib/deal-finance-workspace"
import { SnapEvidenceWorkspace } from "./components/snap-evidence-workspace"
import {
  shipmentReviewSamples,
} from "@trade-os/lib/erp-menu-samples"
import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  ArrowRight,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  Database,
  ExternalLink,
  SquarePen,
  Bookmark,
  FileText,
  Loader2,
  Paperclip,
  PanelRight,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Ship,
  ShieldAlert,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Upload,
  WalletCards,
  X,
} from "lucide-react"

import { Badge } from "@shared/components/ui/badge"
import { SummaryMetricStrip } from "@shared/components/summary-metric-strip"
import { BusinessPageHero } from "@shared/components/business-page-hero"
import { Button } from "@shared/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/components/ui/card"
import { Input } from "@shared/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@shared/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"
import { Textarea } from "@shared/components/ui/textarea"
import { cn } from "@shared/lib/utils"
import {
  SettingsHubV2,
  type ProductEntitlement,
  type SettingsRole,
} from "@share/settings/page"
import type { WorkspaceKey } from "@shared/lib/workspaces"
import { toast } from "sonner"
import { AiBusinessTools } from "@trade-os/ask/business-tools"
import { aiHandoffCopy } from "@trade-os/lib/ai-handoff-copy"

export type ErpMenuTarget =
  | "onboarding"
  | "home"
  | "inbox"
  | "create"
  | "ask"
  | "deals"
  | "deal"
  | "shipments"
  | "settlement"
  | "monitoring"
  | "reports"
  | "sales"
  | "contacts"
  | "notifications"
  | "settings"
  | "counterparty"
  | "snap"
  | "billing"
  | "tokens"

type Navigate = (
  screen: ErpMenuTarget,
  options?: {
    question?: string
    submit?: boolean
    dealId?: string
    documentName?: string
  }
) => void
type Tone = "neutral" | "blue" | "green" | "amber" | "red"

const toneClasses: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  blue: "bg-primary/10 text-primary",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
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

function Page({
  title,
  description,
  eyebrow,
  action,
  centerHeader = false,
  spaciousHeader = false,
  aiEntryHeader = false,
  analyticsLayout = false,
  heroControls,
  heroSummary,
  children,
}: {
  title: ReactNode
  description: string
  eyebrow?: string
  action?: ReactNode
  centerHeader?: boolean
  spaciousHeader?: boolean
  aiEntryHeader?: boolean
  analyticsLayout?: boolean
  heroControls?: ReactNode
  heroSummary?: ReactNode
  children: ReactNode
}) {
  return (
    <div
      data-slot="business-page"
      data-analytics-layout={analyticsLayout || undefined}
      className="h-full overflow-y-auto bg-transparent"
    >
      <div className="w-full px-5 py-5 sm:px-6 sm:py-6 xl:px-8">
        <BusinessPageHero
          className="[&_header]:flex-wrap"
          variant={aiEntryHeader ? "ai" : "default"}
          title={title}
          description={description}
          eyebrow={
            eyebrow ? (
              <span className="inline-flex items-center gap-1.5">
                {eyebrow}
              </span>
            ) : undefined
          }
          actions={action}
          controls={analyticsLayout ? undefined : heroControls}
          summary={heroSummary}
          align={centerHeader ? "center" : "start"}
          titleClassName={cn(
            aiEntryHeader && "mt-3 text-[26px] leading-tight sm:text-[34px]"
          )}
          descriptionClassName={cn(aiEntryHeader && "mt-6")}
        />
        {analyticsLayout && heroControls ? (
          <div data-slot="business-page-filters" className="mt-6">
            {heroControls}
          </div>
        ) : null}
        <div
          data-slot="business-page-body"
          className={cn(
            heroSummary
              ? "mt-6"
              : aiEntryHeader
                ? "mt-7"
                : spaciousHeader
                  ? "mt-10 sm:mt-12"
                  : "mt-6"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function SectionHeader({
  title,
  description,
  trailing,
}: {
  title: string
  description?: string
  trailing?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description ? (
          <p className="mt-2 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {trailing}
    </div>
  )
}

function ContentPanel({
  children,
  className,
  id,
}: {
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <Card
      id={id}
      className={cn(
        "!block !gap-0 overflow-hidden !py-0 shadow-none",
        className
      )}
    >
      <div data-slot="content-panel-content" className="p-4 sm:p-5">
        {children}
      </div>
    </Card>
  )
}

function PanelTable({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div data-slot="panel-table" className={cn("-mx-4 sm:-mx-5", className)}>
      {children}
    </div>
  )
}

export { OnboardingPrototype } from "@trade-os/onboarding/page"

const workItems = [
  {
    group: "지금 처리",
    title: "인보이스 단가 1건 확인",
    reason: "거래 연결이 차단되어 있습니다.",
    due: "지금",
    target: "inbox" as const,
    cta: "필드 확인",
    roles: ["Member", "Admin"],
  },
  {
    group: "지금 처리",
    title: "B/L 증명과 포장명세 대조",
    reason: "수량 4MT가 일치하지 않습니다.",
    due: "11:30",
    target: "deal" as const,
    cta: "서류 검증",
    roles: ["Member", "Admin"],
  },
  {
    group: "오늘 안에",
    title: "ACME GmbH 받을 돈 기록",
    reason: "오늘 만기인 AR 42,000.00 USD입니다.",
    due: "오늘",
    target: "settlement" as const,
    cta: "입금 기록",
    roles: ["Member", "Admin"],
  },
  {
    group: "오늘 안에",
    title: "부산항 도착 선적 확인",
    reason: "ETA가 2일 남았고 B/L이 누락되었습니다.",
    due: "D-2",
    target: "shipments" as const,
    cta: "선적 보기",
    roles: ["Member", "Admin"],
  },
  {
    group: "지금 처리",
    title: "연체 42,000.00 USD 위험 확인",
    reason: "담당자의 회수 계획과 고객 응답을 확인해야 합니다.",
    due: "지금",
    target: "settlement" as const,
    cta: "위험 보기",
    roles: ["Admin", "Owner"],
  },
  {
    group: "확인 필요",
    title: "운영 예외 2건 담당자 확인",
    reason: "기한 전 조치 담당자가 지정되지 않았습니다.",
    due: "오늘",
    target: "monitoring" as const,
    cta: "예외 보기",
    roles: ["Admin", "Owner"],
  },
]

export function HomePrototype({ onNavigate }: { onNavigate: Navigate }) {
  const [role, setRole] = useState("Member")
  const [question, setQuestion] = useState("")
  const visible = workItems.filter((item) => item.roles.includes(role))
  const grouped = ["지금 처리", "오늘 안에", "확인 필요"]
    .map((group) => ({
      group,
      items: visible.filter((item) => item.group === group),
    }))
    .filter((section) => section.items.length > 0)
  const dashboardMetrics = [
    {
      label: "진행 거래",
      value: role === "Owner" ? "12" : "3",
      note: role === "Owner" ? "조직 전체" : "내 담당",
    },
    {
      label: "거래액",
      value: role === "Owner" ? "2,400,000.00 USD" : "720,000.00 USD",
      note: "USD",
    },
    {
      label: role === "Member" ? "오늘 처리" : "조정 GP",
      value: role === "Member" ? `${visible.length}건` : "-12,000.00 USD",
      note: role === "Member" ? "내 실행 업무" : "검토 필요",
    },
    {
      label: role === "Member" ? "기한 임박" : "GP 리스크",
      value: role === "Member" ? "2건" : "1건",
      note: role === "Member" ? "7일 이내" : "손실",
    },
    { label: "AR/AP 만기", value: "2건", note: "7일 이내" },
    { label: "서류 갭", value: "1건", note: "B/L 누락" },
    { label: "선적 리스크", value: "2건", note: "ETA 임박" },
  ]
  const entryActions =
    role === "Owner"
      ? [
          [
            "운영 감시",
            "예외와 조치 진행 상태 확인",
            ShieldAlert,
            "monitoring",
          ],
          ["결산 리포트", "월 마감과 공식 수치 확인", ClipboardList, "reports"],
          ["영업 성과", "거래처와 담당자 성과 확인", TrendingUp, "sales"],
          ["거래 보기", "위험 거래와 근거 문서 확인", Building2, "deals"],
          ["AI에게 묻기", "조직 데이터를 자연어로 조회", Bot, "ask"],
        ]
      : [
          ["파일 올리기", "PDF를 올려 거래 필드 추출", Upload, "inbox"],
          ["문서 만들기", "거래 데이터로 업무 문서 작성", Sparkles, "create"],
          ["AI에게 묻기", "거래와 정산 데이터를 질문", Bot, "ask"],
          ["거래 보기", "진행 중 거래와 상태 확인", Building2, "deals"],
          ["정산", "받을 돈과 줄 돈 처리", WalletCards, "settlement"],
        ]
  const financeInsights =
    role === "Owner"
      ? [
          ["현금 흐름", "7일 내 54,200.00 USD 순유입이 예상됩니다."],
          ["마진", "ACME GmbH 거래의 조정 GP가 손실 구간입니다."],
          ["환율 노출", "CNY 결제 1건이 금주 환율 변동에 노출되어 있습니다."],
        ]
      : [
          ["오늘 받을 돈", "ACME GmbH 42,000.00 USD가 오늘 만기입니다."],
          ["이번 주 줄 돈", "Sakura Logistics 28,000.00 USD가 D-2입니다."],
          ["담당 거래", "다중 통화 합산 없이 통화별로 표시합니다."],
        ]
  const fxRates = [
    ["FX/USD/BRL", "5.1155 BRL"],
    ["FX/USD/CNY", "6.7776 CNY"],
    ["FX/USD/EUR", "0.8754 EUR"],
    ["FX/USD/GBP", "0.7469 GBP"],
  ]
  const benchmarkRows = [
    ["fx usd brl", "5.1155 BRL", "2026.07.13 09:00", "BRL"],
    ["fx usd cny", "6.7776 CNY", "2026.07.13 09:00", "CNY"],
    ["fx usd eur", "0.8754 EUR", "2026.07.13 09:00", "EUR"],
    ["fx usd gbp", "0.7469 GBP", "2026.07.13 09:00", "GBP"],
    ["fx usd jpy", "162.14 JPY", "2026.07.13 09:00", "JPY"],
    ["fx usd krw", "1,494.09 KRW", "2026.07.13 09:00", "KRW"],
  ]
  const schedules = [
    ["오늘", "수금", "ACME GmbH", "42,000.00 USD"],
    ["07.16", "지급", "Sakura Logistics", "28,000.00 USD"],
    ["07.18", "선적", "BUSAN / HMM Green", "ETA 08.03"],
  ]
  return (
    <Page
      title="오늘 할 일"
      description="서류는 AI가 읽고 만들고, 당신은 확인과 의사결정에 집중합니다."
      action={
        <Select
          value={role}
          onValueChange={(value) => setRole(value ?? "Member")}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Member">Member</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="Owner">Owner</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      <div className="flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle>무엇이든 물어보세요</CardTitle>
            <CardDescription>
              사내 거래 데이터와 시장 지표를 자연어로 조회합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
              <Textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                className="min-h-28 resize-none sm:flex-1"
                placeholder="예: 이번 달 ACME 매출은?"
              />
              <Button
                className="sm:min-w-28"
                disabled={!question.trim()}
                onClick={() => onNavigate("ask", { question, submit: true })}
              >
                <Send /> 질문
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                "이번 달 ACME 매출은?",
                "확정 안 된 인보이스 몇 건?",
                "미수금 거래처는?",
              ].map((example) => (
                <Button
                  key={example}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuestion(example)}
                >
                  {example}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <ContentPanel>
          <SectionHeader
            title="업무 시작"
            description="업무를 실행할 화면으로 이동합니다."
          />
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {entryActions.map(([label, , Icon, target]) => (
              <Button
                key={label as string}
                variant="outline"
                className="h-11 justify-start gap-2 px-3 text-left"
                onClick={() => onNavigate(target as ErpMenuTarget)}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{label as string}</span>
              </Button>
            ))}
          </div>
        </ContentPanel>

        <ContentPanel>
          <SectionHeader
            title="작업함"
            description={`${role} 권한으로 실행 가능한 업무 ${visible.length}건`}
          />
          <div className="space-y-4">
            {grouped.map((section) => (
              <section key={section.group}>
                <PanelTable>
                  <Table className="table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left">
                          {section.group} {section.items.length}건
                        </TableHead>
                        <TableHead className="w-[100px] text-left">
                          기한
                        </TableHead>
                        <TableHead className="w-[120px]">작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {section.items.map((item) => (
                        <TableRow key={item.title}>
                          <TableCell className="h-auto py-3 text-left whitespace-normal">
                            <div className="font-medium">{item.title}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {item.reason}
                            </div>
                          </TableCell>
                          <TableCell className="text-left text-muted-foreground">
                            {item.due}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => onNavigate(item.target)}
                            >
                              {item.cta}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </PanelTable>
              </section>
            ))}
          </div>
        </ContentPanel>

        <section className="ui-summary-strip grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {dashboardMetrics.map((item) => (
            <div key={item.label} className="min-w-0 px-4 py-4">
              <div className="text-xs text-muted-foreground">{item.label}</div>
              <strong className="mt-1 block text-lg font-semibold">
                {item.value}
              </strong>
              <div className="mt-1 text-xs text-muted-foreground">
                {item.note}
              </div>
            </div>
          ))}
        </section>

        {role !== "Member" ? (
          <section className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>경영 브리프</CardTitle>
                <CardDescription>
                  거래·정산·선적 데이터를 기준으로 자동 요약합니다.
                </CardDescription>
                <CardAction>
                  <Status tone="blue">자동 요약</Status>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm">
                  미회수 연체와 조정 GP 손실이 가장 중요한 재무 경고입니다.
                </p>
                <p className="text-sm text-muted-foreground">
                  반면 7일 내 순현금 유입은 안정적이며, 선적 2건은 B/L 확인이
                  필요합니다.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>재무 인사이트</CardTitle>
                <CardDescription>
                  조직 데이터에서 계산된 변화입니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {financeInsights.map(([label, value], index) => (
                  <div
                    key={label}
                    className={cn(
                      "grid gap-2 py-1 sm:grid-cols-[110px_minmax(0,1fr)]",
                      index > 0 && "border-t pt-3"
                    )}
                  >
                    <strong className="text-sm">{label}</strong>
                    <span className="text-sm text-muted-foreground">
                      {value}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        ) : null}

        {role !== "Member" ? (
          <section>
            <SectionHeader
              title="운영 감시"
              description="오늘 처리율과 아직 확인하지 않은 예외를 함께 봅니다."
              trailing={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate("monitoring")}
                >
                  운영 상세 <ArrowRight />
                </Button>
              }
            />
            <Card className="gap-0 py-0">
              <div className="grid gap-4 px-4 py-4 sm:grid-cols-3">
                <div>
                  <div className="text-xs text-muted-foreground">오늘 처리</div>
                  <strong className="mt-1 block text-2xl">6건</strong>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">완료율</div>
                  <strong className="mt-1 block text-2xl">75%</strong>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    미확인 이슈
                  </div>
                  <strong className="mt-1 block text-2xl">2건</strong>
                </div>
              </div>
            </Card>
            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <span>운영 상태는 정상이며, 담당자 미지정 2건이 남았습니다.</span>
              <Status tone="amber">확인 필요</Status>
            </div>
          </section>
        ) : null}

        <ContentPanel>
          <SectionHeader
            title="환율 (오늘)"
            description="거래 통화별 최신 관측값"
          />
          <div className="ui-summary-strip grid sm:grid-cols-2 lg:grid-cols-4">
            {fxRates.map(([label, value]) => (
              <div key={label} className="px-4 py-4">
                <div className="text-xs text-muted-foreground">{label}</div>
                <strong className="mt-1 block text-xl">{value}</strong>
              </div>
            ))}
          </div>
        </ContentPanel>

        {role !== "Member" ? (
          <ContentPanel>
            <SectionHeader
              title="관련 벤치마크"
              description="시장·환율 참조 지표의 최신 관측"
            />
            <PanelTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>지표</TableHead>
                    <TableHead className="text-right">값</TableHead>
                    <TableHead>관측일</TableHead>
                    <TableHead>단위</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {benchmarkRows.map(([series, value, observedAt, unit]) => (
                    <TableRow key={series}>
                      <TableCell>{series}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {value}
                      </TableCell>
                      <TableCell>{observedAt}</TableCell>
                      <TableCell>{unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </PanelTable>
          </ContentPanel>
        ) : null}

        <section className="grid gap-8 xl:grid-cols-2">
          <ContentPanel>
            <SectionHeader
              title="이번 주 일정"
              description="7일 내 결제·수금·선적 일정"
            />
            <div className="divide-y">
              {schedules.map(([date, type, title, meta]) => (
                <Button
                  variant="ghost"
                  key={`${date}-${title}`}
                  type="button"
                  className="grid h-auto w-full items-center justify-start gap-3 rounded-none px-3 py-3 text-left font-normal hover:bg-sidebar-accent/80 sm:grid-cols-[70px_70px_minmax(0,1fr)_120px]"
                  onClick={() =>
                    onNavigate(type === "선적" ? "shipments" : "settlement")
                  }
                >
                  <span className="text-xs text-muted-foreground">{date}</span>
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
                  <span className="text-sm font-medium">{title}</span>
                  <span className="text-sm text-muted-foreground">{meta}</span>
                </Button>
              ))}
            </div>
          </ContentPanel>
          <ContentPanel>
            <SectionHeader
              title={role === "Owner" ? "현금 위험" : "받을 돈 · 줄 돈"}
              description={
                role === "Owner"
                  ? "처리 버튼 없이 위험과 노출만 확인합니다."
                  : "담당 거래의 실제 금액과 만기입니다."
              }
            />
            <div className="divide-y">
              {[
                ["받을 돈", "ACME GmbH", "42,000.00 USD", "오늘"],
                ["줄 돈", "Sakura Logistics", "28,000.00 USD", "D-2"],
              ].map(([type, party, amount, due]) => (
                <div
                  key={type}
                  className="grid items-center gap-3 px-3 py-3 sm:grid-cols-[90px_minmax(0,1fr)_120px_80px]"
                >
                  <Status tone={type === "받을 돈" ? "green" : "amber"}>
                    {type}
                  </Status>
                  <span className="text-sm font-medium">{party}</span>
                  <span className="text-sm font-semibold">{amount}</span>
                  {role === "Owner" ? (
                    <Button
                      variant="link"
                      className="px-0"
                      onClick={() => onNavigate("settlement")}
                    >
                      위험 보기
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">{due}</span>
                  )}
                </div>
              ))}
            </div>
          </ContentPanel>
        </section>

        <ContentPanel>
          <SectionHeader
            title="들어오는 선적"
            description="7일 내 도착 예정 선적"
            trailing={
              <Button variant="ghost" onClick={() => onNavigate("shipments")}>
                배송 추적 <ArrowRight />
              </Button>
            }
          />
          <div className="divide-y">
            {[
              ["HMM Green", "BUSAN", "ETA 08.03", "B/L 확인 필요"],
              ["ONE Harmony", "INCHEON", "ETA 08.05", "정상"],
              ["Ever Ace", "BUSAN", "ETA 08.07", "보험 서류 확인"],
            ].map(([carrier, port, eta, status]) => (
              <div
                key={carrier}
                className="grid items-center gap-3 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_120px_120px_auto]"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Ship className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm font-medium">
                    {carrier}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">{port}</span>
                <span className="text-sm font-medium">{eta}</span>
                <Status tone={status === "정상" ? "green" : "amber"}>
                  {status}
                </Status>
              </div>
            ))}
          </div>
        </ContentPanel>

        {role !== "Member" ? (
          <ContentPanel>
            <SectionHeader
              title="결정 필요"
              description="확인 후 담당자에게 지시하거나 승인할 항목"
              trailing={<Status tone="amber">3건</Status>}
            />
            <div className="divide-y">
              {[
                [
                  "GP 검토",
                  "ACME GmbH",
                  "조정 GP -12,000.00 USD",
                  "settlement",
                ],
                ["거래 보기", "서류 확인 대기", "AI 확인 문서 1건", "deals"],
                ["거래 보기", "필수 서류 갭", "B/L 누락 1건", "deals"],
              ].map(([action, title, description, target]) => (
                <div
                  key={title}
                  className="grid items-center gap-3 px-3 py-3 transition-colors hover:bg-sidebar-accent/80 sm:grid-cols-[minmax(0,1fr)_minmax(160px,.7fr)_auto]"
                >
                  <span className="text-sm font-medium">{title}</span>
                  <span className="text-sm text-muted-foreground">
                    {description}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate(target as ErpMenuTarget)}
                  >
                    {action} <ArrowRight />
                  </Button>
                </div>
              ))}
            </div>
          </ContentPanel>
        ) : null}
      </div>
    </Page>
  )
}

// Conversation layout reference: Open WebUI v0.6.5 (BSD-3-Clause).
// See THIRD_PARTY_NOTICES.md for the pinned source and license notice.
type AskTurnState = "ready" | "not-found" | "empty" | "loading" | "waiting"

type AskFile = {
  id: string
  name: string
  type: string
  reference: string
  updatedAt: string
}

type AskTurn = {
  id: string
  question: string
  state: AskTurnState
  attachments?: AskFile[]
}

const askFiles: AskFile[] = [
  {
    id: "invoice-hb-2607-003",
    name: "Invoice_HB-2607-003.pdf",
    type: "상업송장",
    reference: "DL-260708-01 · ACME GmbH",
    updatedAt: "오늘 09:18",
  },
  {
    id: "sc-2026-0708",
    name: "SC-2026-0708.pdf",
    type: "판매계약서",
    reference: "DL-260708-08 · ACME GmbH",
    updatedAt: "오늘 08:42",
  },
  {
    id: "packing-list-0707",
    name: "PackingList_0707.pdf",
    type: "포장명세서",
    reference: "DL-260708-01 · KATAMAN",
    updatedAt: "어제 16:04",
  },
  {
    id: "bl-2607-014",
    name: "B_L_2607_014.pdf",
    type: "선하증권",
    reference: "DL-260704-02 · Nordic Raw Materials AB",
    updatedAt: "08.27 14:24",
  },
  {
    id: "po-260704-18",
    name: "PO-260704-18.pdf",
    type: "발주서",
    reference: "DL-260704-02 · Hanbit Trading Co.",
    updatedAt: "08.27 13:41",
  },
]

export function AskPrototype({
  onNavigate,
  role = "owner",
  initialQuestion = "",
  submitOnOpen = false,
}: {
  onNavigate: Navigate
  role?: "owner" | "admin" | "member"
  initialQuestion?: string
  submitOnOpen?: boolean
}) {
  const [question, setQuestion] = useState(initialQuestion)
  const [turns, setTurns] = useState<AskTurn[]>(() =>
    submitOnOpen && initialQuestion.trim()
      ? [
          {
            id: "initial",
            question: initialQuestion.trim(),
            state: "ready",
          },
        ]
      : []
  )
  const [activeConversation, setActiveConversation] = useState<string | null>(
    submitOnOpen && Boolean(initialQuestion.trim()) ? "current" : null
  )
  const [historyOpen, setHistoryOpen] = useState(true)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false)
  const [historyQuery, setHistoryQuery] = useState("")
  const [fileFinderOpen, setFileFinderOpen] = useState(false)
  const [fileQuery, setFileQuery] = useState("")
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([])
  const [attachedFiles, setAttachedFiles] = useState<AskFile[]>([])
  const [feedbackByTurn, setFeedbackByTurn] = useState<
    Record<string, "up" | "down" | undefined>
  >({})
  const threadEndRef = useRef<HTMLDivElement | null>(null)

  type AskSource = {
    title: string
    meta: string
    label: string
    target: ErpMenuTarget
  }

  type AskResponse = {
    title: string
    body: string
    sources: AskSource[]
  }

  const getResponse = (value: string): AskResponse => {
    if (
      /도착|출항|본문|문구|서류 필요|남은 업무|저장한|등록 거래|문서에서/.test(
        value
      )
    ) {
      return {
        title: "조회 조건과 문서 근거를 함께 확인할 수 있습니다.",
        body: "상세 조회에서 거래처별 등록 거래, ETD·ETA 기준 선적, 문서 정보·보관된 본문, 현재 남은 업무를 선택하세요. 기간과 문구를 지정해 조회하고 그 시점의 답변을 저장할 수 있습니다.",
        sources: [
          {
            title: aiHandoffCopy.workspace.tools,
            meta: "조건별 업무 조회 · 문서 검색 · 저장 답변",
            label: "업무",
            target: "ask",
          },
        ],
      }
    }
    if (/받을 돈|지급할 돈|줄 돈|잔액|입출금|정산/.test(value)) {
      return {
        title: "현재 받을 돈과 지급할 돈은 정산 근거를 확인해야 합니다.",
        body: "예정액, 실제 입출금, 지급 적용과 미배분 현금을 구분합니다. 현재 로컬 예시의 원천 검증은 연결되지 않아 공식 잔액은 보류합니다.",
        sources: [
          {
            title: "현재 잔액과 검증 상태",
            meta: "통화별 예정액 · 기존 지급 기록 · 검증 상태",
            label: "정산",
            target: "settlement",
          },
        ],
      }
    }
    if (value.includes("B/L") || value.includes("누락")) {
      return {
        title: "B/L이 누락된 거래는 2건입니다.",
        body: "7월 알루미늄 스크랩 수입은 선적이 진행 중이지만 B/L이 아직 연결되지 않았습니다. 부산항 산업재 수입도 필수 서류 5종 중 B/L이 미비한 상태입니다.",
        sources: [
          {
            title: "7월 알루미늄 스크랩 수입",
            meta: "DL-260708-01 · 선적 중 · B/L 미비",
            label: "거래",
            target: "deal",
          },
          {
            title: "부산항 산업재 수입",
            meta: "DL-260704-02 · 통관 중 · 중요 서류 4/5",
            label: "거래",
            target: "deals",
          },
          {
            title: "검토·배정 대기 문서",
            meta: "B/L 분석 중 1건",
            label: "문서",
            target: "inbox",
          },
        ],
      }
    }

    if (value.includes("GP") || value.includes("마진")) {
      return {
        title: "GP가 가장 크게 낮아진 거래처는 ACME GmbH입니다.",
        body: "최근 30일 기준 GP가 4.8%p 하락했습니다. 운임 상승과 계약 단가 변경이 함께 반영된 거래 2건이 주요 원인입니다.",
        sources: [
          {
            title: "ACME GmbH",
            meta: "최근 30일 GP 11.2% → 6.4%",
            label: "성과",
            target: "sales",
          },
          {
            title: "ACME 7월 해상운송 계약",
            meta: "DL-260707-04 · 운임 상승",
            label: "거래",
            target: "deal",
          },
          {
            title: "영업 성과",
            meta: "거래처별 GP 분석",
            label: "리포트",
            target: "sales",
          },
        ],
      }
    }

    if (value.includes("승인")) {
      return {
        title: "오늘 확인할 승인 요청은 2건입니다.",
        body: "판매계약서 1건과 상업송장 1건이 승인 대기 중입니다. 판매계약서는 은행 거절 전 점검을 통과했고, 상업송장은 거래 연결 확인이 필요합니다.",
        sources: [
          {
            title: "판매계약서 · SC-2026-0708.pdf",
            meta: "박서윤 요청 · 은행 점검 통과",
            label: "승인",
            target: "create",
          },
          {
            title: "상업송장 · CI-2026-0703.pdf",
            meta: "김도현 요청 · 거래 연결 확인",
            label: "승인",
            target: "create",
          },
          {
            title: "오늘 할 일",
            meta: "승인 대기 업무 모아보기",
            label: "업무",
            target: "home",
          },
        ],
      }
    }

    return {
      title: "질문에 맞는 업무와 조회 조건을 선택해 주세요.",
      body: "현재 로컬 예시에서는 조건별 조회로 거래·선적·문서 기록을 확인할 수 있습니다. 질문만으로 확인되지 않은 금액이나 업무 상태를 확정하지 않습니다.",
      sources: [
        {
          title: aiHandoffCopy.workspace.tools,
          meta: "거래처·기간·문구로 조회",
          label: "업무",
          target: "ask",
        },
      ],
    }
  }

  const submit = () => {
    const nextQuestion = question.trim()
    if (!nextQuestion) return
    setTurns((current) => [
      ...current,
      {
        id: `turn-${Date.now()}`,
        question: nextQuestion,
        state: "ready",
        attachments: attachedFiles,
      },
    ])
    setQuestion("")
    setAttachedFiles([])
    setActiveConversation("current")
    window.requestAnimationFrame(() =>
      threadEndRef.current?.scrollIntoView({ block: "end" })
    )
  }

  const quickQuestions = [
    "이번 주 받을 돈",
    "B/L이 누락된 거래",
    "GP가 낮아진 거래처",
    "오늘 승인할 문서",
  ]

  const conversations = [
    {
      id: "receivables",
      title: "이번 주 받을 돈",
      meta: "정산 3건과 거래 근거",
      question: "이번 주 받을 돈이 가장 큰 거래처는?",
      group: "오늘",
      state: "ready" as AskTurnState,
    },
    {
      id: "missing-bl",
      title: "B/L이 누락된 거래",
      meta: "필수 서류 미비 거래",
      question: "B/L이 누락된 거래를 알려줘",
      group: "오늘",
      state: "ready" as AskTurnState,
    },
    {
      id: "gp-change",
      title: "GP가 낮아진 거래처",
      meta: "최근 30일 영업 성과",
      question: "GP가 가장 많이 낮아진 거래처는?",
      group: "어제",
      state: "ready" as AskTurnState,
    },
    {
      id: "approval",
      title: "오늘 승인할 문서",
      meta: "승인 대기 문서 2건",
      question: "오늘 승인할 문서를 보여줘",
      group: "어제",
      state: "ready" as AskTurnState,
    },
    {
      id: "not-found",
      title: "거래 검색 결과 없음",
      meta: "일치하는 거래를 찾지 못함",
      question: "DL-999999-99 거래를 찾아줘",
      group: "상태 예시",
      state: "not-found" as AskTurnState,
    },
    {
      id: "empty-evidence",
      title: "참조 자료 없음",
      meta: "연결된 문서·거래 없음",
      question: "신규 거래의 정산 근거를 확인해줘",
      group: "상태 예시",
      state: "empty" as AskTurnState,
    },
    {
      id: "loading",
      title: "AI 분석 중",
      meta: "업무 데이터를 조회하는 중",
      question: "이번 달 거래 위험을 분석해줘",
      group: "상태 예시",
      state: "loading" as AskTurnState,
    },
    {
      id: "waiting",
      title: "최신 데이터 대기",
      meta: "문서 분석 완료를 기다리는 중",
      question: "방금 올린 B/L까지 반영해서 알려줘",
      group: "상태 예시",
      state: "waiting" as AskTurnState,
    },
  ]

  const filteredConversations = conversations.filter((conversation) =>
    `${conversation.title} ${conversation.meta}`
      .toLowerCase()
      .includes(historyQuery.trim().toLowerCase())
  )

  const filteredFiles = askFiles.filter((file) =>
    `${file.name} ${file.type} ${file.reference}`
      .toLowerCase()
      .includes(fileQuery.trim().toLowerCase())
  )

  const openFileFinder = () => {
    setFileQuery("")
    setSelectedFileIds([])
    setFileFinderOpen(true)
  }

  const toggleFile = (fileId: string) => {
    setSelectedFileIds((current) =>
      current.includes(fileId)
        ? current.filter((id) => id !== fileId)
        : [...current, fileId]
    )
  }

  const attachSelectedFiles = () => {
    const nextFiles = askFiles.filter((file) =>
      selectedFileIds.includes(file.id)
    )
    setAttachedFiles((current) => [
      ...current,
      ...nextFiles.filter(
        (file) => !current.some((attached) => attached.id === file.id)
      ),
    ])
    setFileFinderOpen(false)
    setSelectedFileIds([])
  }

  const startNewChat = () => {
    setToolsOpen(false)
    setQuestion("")
    setAttachedFiles([])
    setTurns([])
    setActiveConversation(null)
    setMobileHistoryOpen(false)
  }

  const openConversation = (conversation: (typeof conversations)[number]) => {
    setToolsOpen(false)
    setQuestion("")
    setAttachedFiles([])
    setTurns([
      {
        id: conversation.id,
        question: conversation.question,
        state: conversation.state,
      },
    ])
    setActiveConversation(conversation.id)
    setMobileHistoryOpen(false)
    window.requestAnimationFrame(() =>
      threadEndRef.current?.scrollIntoView({ block: "end" })
    )
  }

  const copyResponse = async (turn: AskTurn) => {
    const response = getResponse(turn.question)
    try {
      await navigator.clipboard.writeText(
        `${response.title}\n\n${response.body}`
      )
      toast.success("답변을 복사했습니다.")
    } catch {
      toast.error("답변을 복사하지 못했습니다.")
    }
  }

  const regenerateResponse = (turnId: string) => {
    setTurns((current) =>
      current.map((turn) =>
        turn.id === turnId ? { ...turn, state: "loading" } : turn
      )
    )
    window.setTimeout(() => {
      setTurns((current) =>
        current.map((turn) =>
          turn.id === turnId ? { ...turn, state: "ready" } : turn
        )
      )
      toast.success("답변을 다시 확인했습니다.")
    }, 650)
  }

  const updateFeedback = (turnId: string, feedback: "up" | "down") => {
    setFeedbackByTurn((current) => ({
      ...current,
      [turnId]: current[turnId] === feedback ? undefined : feedback,
    }))
    toast.success("의견을 반영했습니다.")
  }

  // Figma 7차 (5729:60849): the question box is 760px wide, centered.
  const renderComposer = () => (
    <div
      className="mx-auto w-full max-w-[760px] rounded-[18px] border border-[var(--color-gray-6)] bg-[var(--color-gray-12)] px-4 pt-3 pb-2.5 shadow-[0_2px_4px_rgb(0_0_0/0.05)] transition-shadow focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-ring/30"
    >
      {attachedFiles.length ? (
        // Figma 7차 (5729:61024): attached files as a list above a divider.
        <div className="mb-2 max-h-[120px] overflow-y-auto border-b border-[var(--color-gray-10)] pb-2">
          {attachedFiles.map((file) => (
            <span
              key={file.id}
              className="flex h-10 items-center gap-1.5 rounded-[var(--r-xs)] pr-2 pl-2.5 text-[15px] leading-[22px] text-[var(--color-gray-1)] hover:bg-[var(--color-gray-11)]"
            >
              <FileText className="size-4 shrink-0 text-[var(--color-gray-4)]" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <button
                type="button"
                className="flex size-6 shrink-0 items-center justify-center rounded-[var(--r-sm)] text-[var(--color-gray-4)] outline-none hover:bg-[var(--color-gray-10)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/30"
                aria-label={`${file.name} 첨부 해제`}
                onClick={() =>
                  setAttachedFiles((current) =>
                    current.filter((attached) => attached.id !== file.id)
                  )
                }
              >
                <X className="size-4" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <Textarea
        rows={4}
        aria-label="AI 질문"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault()
            submit()
          }
        }}
        className={cn(
          "max-h-48 min-h-24 w-full resize-none border-0! bg-transparent! px-2.5 pt-1 pb-2 text-[length:var(--text-body-md,15px)] leading-[22px] shadow-none! focus-visible:ring-0",
          attachedFiles.length && "min-h-20"
        )}
        placeholder={
          attachedFiles.length
            ? "첨부한 문서에 대해 질문하세요"
            : "거래, 문서, 정산에 대해 질문하세요"
        }
      />
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon-lg"
          className="-ml-2 text-[var(--color-gray-4)]"
          aria-label="파일 찾기"
          title="파일 찾기"
          onClick={openFileFinder}
        >
          <Paperclip />
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            ⌘ + Enter
          </span>
          <Button
            size="lg"
            className="h-11 min-w-[118px] rounded-[var(--r-lg)] bg-[var(--primary)] pr-5 pl-[18px] text-[17px] shadow-[0_1px_2px_rgb(5_29_57/0.1)]"
            disabled={!question.trim()}
            onClick={submit}
          >
            <Send data-icon="inline-start" /> 질문하기
          </Button>
        </div>
      </div>
    </div>
  )

  const renderAssistantTurn = (turn: AskTurn) => {
    const response = getResponse(turn.question)

    return (
      <article className="mt-8 flex gap-3 sm:gap-4">
        <img
          src="/images/ai/ai-ecoya.svg"
          alt=""
          width={24}
          height={24}
          className="size-6 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-semibold text-[var(--color-gray-1)]">ECOYA 업무 AI</span>
            <Badge variant="secondary" className="font-normal">
              오전 9:30 기준
            </Badge>
          </div>

          {turn.state === "loading" ? (
            <div className="mt-4" role="status" aria-live="polite">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Loader2 className="size-4 animate-spin text-primary" />
                업무 데이터를 확인하고 있습니다
              </div>
              <div className="mt-4 space-y-2" aria-hidden="true">
                <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-20 w-full animate-pulse rounded-[var(--r-lg)] bg-muted/70" />
              </div>
            </div>
          ) : turn.state === "waiting" ? (
            <div className="mt-4 rounded-[var(--r-lg)] border border-[var(--surface-border)] p-4">
              <div className="flex items-start gap-3">
                <RefreshCw className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold">
                    최신 데이터 반영을 기다리고 있습니다
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    방금 올린 문서의 분석이 끝나면 이 대화에서 이어서 확인할 수
                    있습니다.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setTurns((current) =>
                      current.map((item) =>
                        item.id === turn.id ? { ...item, state: "ready" } : item
                      )
                    )
                  }
                >
                  다시 확인
                </Button>
              </div>
            </div>
          ) : turn.state === "not-found" ? (
            <div className="mt-4">
              <h2 className="text-base leading-7 font-semibold">
                일치하는 업무를 찾지 못했습니다.
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                거래번호나 거래처명을 다시 확인해 주세요. 검색 범위를 전체 업무
                데이터로 바꾸어 다시 질문할 수도 있습니다.
              </p>
            </div>
          ) : turn.state === "empty" ? (
            <div className="mt-4">
              <h2 className="text-base leading-7 font-semibold">
                답변에 참조할 업무 데이터가 없습니다.
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                이 거래에 문서나 정산 정보가 연결되면 근거와 함께 답변할 수
                있습니다.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => onNavigate("inbox")}
              >
                문서 올리기
              </Button>
            </div>
          ) : (
            <>
              <h2 className="mt-3.5 text-[17px] leading-[26px] font-semibold text-[var(--color-gray-1)]">
                {response.title}
              </h2>
              <p className="mt-3.5 text-[15px] leading-6 text-[var(--color-gray-3)]">
                {response.body}
              </p>

              <section className="mt-6" aria-label="답변 근거">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <FileText className="size-3.5 text-primary" />
                    확인한 근거
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {response.sources.length}개
                  </span>
                </div>
                <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--color-gray-10)]">
                  {response.sources.map((source, index) => (
                    <button
                      key={source.title}
                      type="button"
                      onClick={() =>
                        source.target === "ask"
                          ? setToolsOpen(true)
                          : onNavigate(source.target)
                      }
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:bg-muted",
                        index > 0 && "border-t border-[var(--surface-border)]"
                      )}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-[var(--color-gray-11)] text-[var(--color-gray-4)]">
                        {source.label === "문서" ? (
                          <FileText className="size-4" />
                        ) : source.label === "정산" ||
                          source.label === "성과" ? (
                          <Database className="size-4" />
                        ) : (
                          <Building2 className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {source.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {source.meta}
                        </span>
                      </span>
                      <Badge variant="secondary" className="font-normal">
                        {source.label}
                      </Badge>
                      <ExternalLink className="size-[18px] shrink-0 text-[var(--color-primary-4)]" />
                    </button>
                  ))}
                </div>
              </section>

              <div className="mt-4 flex items-center gap-1 text-muted-foreground">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="답변 복사"
                  title="답변 복사"
                  onClick={() => void copyResponse(turn)}
                >
                  <Copy />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="답변 다시 생성"
                  title="답변 다시 생성"
                  onClick={() => regenerateResponse(turn.id)}
                >
                  <RotateCcw />
                </Button>
                <Button
                  variant={
                    feedbackByTurn[turn.id] === "up" ? "secondary" : "ghost"
                  }
                  size="icon-sm"
                  aria-label="도움이 됨"
                  title="도움이 됨"
                  aria-pressed={feedbackByTurn[turn.id] === "up"}
                  onClick={() => updateFeedback(turn.id, "up")}
                >
                  <ThumbsUp />
                </Button>
                <Button
                  variant={
                    feedbackByTurn[turn.id] === "down" ? "secondary" : "ghost"
                  }
                  size="icon-sm"
                  aria-label="도움이 되지 않음"
                  title="도움이 되지 않음"
                  aria-pressed={feedbackByTurn[turn.id] === "down"}
                  onClick={() => updateFeedback(turn.id, "down")}
                >
                  <ThumbsDown />
                </Button>
              </div>
            </>
          )}
        </div>
      </article>
    )
  }

  return (
    <div
      data-slot="ai-chat-workspace"
      className="flex h-full min-h-0 overflow-hidden bg-transparent p-4 sm:p-5"
    >
      {/* Figma 7차 (5729:61219): chat and conversation list share one card,
          split by a single line. */}
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-[var(--r-lg)] bg-[var(--color-gray-12)] shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)]">
      <Dialog open={fileFinderOpen} onOpenChange={setFileFinderOpen}>
        <DialogContent className="grid-cols-[minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-[640px]">
          <DialogHeader className="px-6 pt-6 pb-0 text-left">
            <DialogTitle>파일 찾기</DialogTitle>
            <DialogDescription>
              대화에서 확인할 기존 업무 문서를 선택하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pt-4 pb-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={fileQuery}
                onChange={(event) => setFileQuery(event.target.value)}
                className="h-10 pl-10"
                placeholder="파일명, 문서 유형, 거래번호 검색"
                aria-label="업무 파일 검색"
              />
            </div>

            <div className="mt-3">
              <div className="flex h-8 items-center justify-between px-1 text-[13px] text-muted-foreground">
                <span>최근 문서</span>
                <span>{filteredFiles.length}건</span>
              </div>
              <div className="max-h-80 space-y-1 overflow-y-auto">
                {filteredFiles.map((file) => {
                  const selected = selectedFileIds.includes(file.id)
                  const alreadyAttached = attachedFiles.some(
                    (attached) => attached.id === file.id
                  )

                  return (
                    <button
                      key={file.id}
                      type="button"
                      aria-pressed={selected || alreadyAttached}
                      disabled={alreadyAttached}
                      onClick={() => toggleFile(file.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-[var(--r-md)] px-3 py-2.5 text-left outline-none hover:bg-[var(--color-gray-11)] focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-default disabled:opacity-60",
                        (selected || alreadyAttached) && "bg-[var(--color-primary-10)] hover:bg-[var(--color-primary-10)]"
                      )}
                    >
                      {/* Visual checkbox only: the row button carries aria-pressed. */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-[4px] border border-[var(--color-gray-7)] bg-[var(--color-gray-12)] text-white",
                          selected && "border-[var(--primary)] bg-[var(--primary)]",
                          alreadyAttached && "border-[var(--color-gray-8)] bg-[var(--color-gray-10)]"
                        )}
                      >
                        {selected ? <Check className="size-3.5" /> : null}
                      </span>
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-[var(--color-gray-11)] text-[var(--color-gray-3)]">
                        <FileText className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] leading-[22px]">
                          {file.name}
                        </span>
                        <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">
                          {file.type} · {file.reference}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {alreadyAttached ? "첨부됨" : file.updatedAt}
                      </span>
                    </button>
                  )
                })}
                {!filteredFiles.length ? (
                  <div className="px-4 py-12 text-center">
                    <Search className="mx-auto size-7 text-[var(--color-gray-2)]" />
                    <p className="mt-3 text-sm font-medium">
                      찾는 파일이 없습니다.
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      파일명이나 거래번호를 다시 확인하세요.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 border-t border-[var(--color-gray-10)] px-6 py-4">
            <Button variant="outline" onClick={() => setFileFinderOpen(false)}>
              취소
            </Button>
            <Button
              disabled={!selectedFileIds.length}
              onClick={attachSelectedFiles}
            >
              {selectedFileIds.length
                ? `${selectedFileIds.length}개 첨부`
                : "파일 첨부"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={mobileHistoryOpen} onOpenChange={setMobileHistoryOpen}>
        <SheetContent
          id="ai-conversation-list-mobile"
          side="right"
          showCloseButton={false}
          overlayClassName="top-14"
          className="top-14! bottom-0! h-auto! w-[300px] gap-0 p-0 lg:hidden"
        >
          <div className="sr-only">
            <SheetTitle>대화 목록</SheetTitle>
            <SheetDescription>
              이전 업무 질문을 검색하고 다시 엽니다.
            </SheetDescription>
          </div>
          <div className="flex h-14 items-center gap-2 border-b border-[var(--surface-border)] px-3">
            <Button
              variant="outline"
              className="flex-1 justify-start bg-background"
              onClick={startNewChat}
            >
              <Plus /> 새 대화
            </Button>
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="대화 목록 닫기"
              >
                <X />
              </Button>
            </SheetClose>
          </div>
          <div className="space-y-2 p-3">
            <Button
              variant={toolsOpen ? "secondary" : "outline"}
              className="w-full justify-start"
              aria-pressed={toolsOpen}
              onClick={() => {
                setToolsOpen(true)
                setMobileHistoryOpen(false)
              }}
            >
              <Bookmark /> 저장한 답변과 상세 조회
            </Button>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={historyQuery}
                onChange={(event) => setHistoryQuery(event.target.value)}
                className="h-9 bg-[var(--control-background)] pl-9 text-sm"
                placeholder="대화 검색"
                aria-label="대화 검색"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
            {["오늘", "어제", "상태 예시"].map((group) => {
              const grouped = filteredConversations.filter(
                (conversation) => conversation.group === group
              )
              if (!grouped.length) return null
              return (
                <div key={group} className="mb-5">
                  <div className="px-2 pb-3 text-[12px] font-semibold text-[var(--color-gray-4)]">
                    {group}
                  </div>
                  <div className="space-y-0.5">
                    {grouped.map((conversation) => (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => openConversation(conversation)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-[8px] border border-transparent p-2.5 text-left transition-colors outline-none hover:bg-[var(--color-primary-10)] focus-visible:ring-2 focus-visible:ring-primary/30",
                          activeConversation === conversation.id &&
                          "border-[var(--color-primary-4)] bg-[var(--color-primary-10)]"
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] leading-5 font-semibold text-[var(--color-gray-2)]">
                            {conversation.title}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] leading-4 text-[var(--color-gray-4)]">
                            {conversation.meta}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-start gap-1 px-5 pt-5 pb-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid min-w-0 gap-1">
              <span className="block truncate text-[18px] leading-[26px] font-bold text-[var(--color-gray-1)]">ECOYA 업무 AI</span>
              <span className="block truncate text-[15px] leading-[22px] text-[var(--color-gray-5)]">
                거래·문서·정산 근거로 답변
              </span>
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="outline" size="lg" onClick={startNewChat}>
              <SquarePen data-icon="inline-start" /> 새 대화
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              aria-controls="ai-conversation-list-mobile"
              aria-expanded={mobileHistoryOpen}
              aria-label="대화 목록 열기"
              title="대화 목록 열기"
              onClick={() => setMobileHistoryOpen(true)}
            >
              <PanelRight />
            </Button>
            {!historyOpen ? (
              <Button
                variant="ghost"
                size="icon-sm"
                className="hidden lg:inline-flex"
                aria-controls="ai-conversation-list"
                aria-expanded={historyOpen}
                aria-label="대화 목록 열기"
                title="대화 목록 열기"
                onClick={() => setHistoryOpen(true)}
              >
                <PanelRight />
              </Button>
            ) : null}
          </div>
        </header>

        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto",
            !toolsOpen && "hidden"
          )}
        >
          <AiBusinessTools
            shipments={shipments}
            files={askFiles}
            onNavigate={onNavigate}
          />
        </div>
        <div className={cn("min-h-0 flex-1", toolsOpen && "hidden")}>
          {turns.length === 0 ? (
            <div className="flex h-full w-full flex-col justify-center overflow-y-auto px-5 py-12">
              <img
                src="/images/ai/ai-ecoya-logo.svg"
                alt=""
                width={96}
                height={96}
                className="mx-auto mb-8 size-24 shrink-0"
              />
              <h1 className="text-center text-[22px] leading-[30px] font-bold text-[var(--color-gray-1)]">
                {aiHandoffCopy.workspace.question}
              </h1>
              <p className="mx-auto mt-2 max-w-xl text-center text-[15px] leading-[22px] text-[var(--color-gray-4)]">
                {aiHandoffCopy.workspace.guide}
              </p>
              <div className="mt-8 w-full">
                {renderComposer()}
                {role === "member" ? (
                  <div className="mx-auto mt-5 flex max-w-2xl flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
                    <p>거래 화면에서 그 거래에 대해 물을 수 있습니다.</p>
                    <Button variant="outline" size="sm" onClick={() => onNavigate("deals")}>거래 목록 보기</Button>
                  </div>
                ) : (
                  <div className="mx-auto mt-5 grid max-w-2xl gap-1 sm:grid-cols-2">
                    {quickQuestions.map((item) => (
                      <Button
                        key={item}
                        variant="ghost"
                        className="h-auto justify-start gap-3 px-3 py-2.5 text-left text-sm font-normal text-muted-foreground hover:text-foreground"
                        onClick={() => setQuestion(item)}
                      >
                        <Sparkles className="size-3.5 text-primary" />
                        {item}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="w-full px-5 py-8 sm:py-10">
                  {turns.map((turn, index) => (
                    <section
                      key={turn.id}
                      className={cn(
                        index > 0 &&
                          "mt-10 border-t border-[var(--surface-border)] pt-10"
                      )}
                      aria-label={`대화 ${index + 1}`}
                    >
                      <div className="flex justify-end">
                        <div className="flex max-w-[82%] flex-col items-end gap-2">
                          {turn.attachments?.length ? (
                            <div className="flex flex-wrap justify-end gap-2">
                              {turn.attachments.map((file) => (
                                <span
                                  key={file.id}
                                  className="inline-flex max-w-64 items-center gap-2 rounded-[var(--r-md)] border border-[var(--surface-border)] bg-background px-3 py-2 text-xs shadow-xs"
                                >
                                  <FileText className="size-3.5 shrink-0 text-primary" />
                                  <span className="truncate">{file.name}</span>
                                </span>
                              ))}
                            </div>
                          ) : null}
                          <div className="rounded-2xl bg-[var(--color-primary-10)] px-3.5 py-2 text-[15px] leading-[22px] text-[var(--primary)]">
                            {turn.question}
                          </div>
                        </div>
                      </div>
                      {renderAssistantTurn(turn)}
                    </section>
                  ))}
                  <div ref={threadEndRef} />
                </div>
              </div>
              <div className="shrink-0 bg-[var(--color-gray-12)] px-5 pt-2 pb-5">
                {renderComposer()}
              </div>
            </div>
          )}
        </div>
      </section>

      <aside
        className={cn(
          "hidden min-h-0 w-72 shrink-0 flex-col gap-4 overflow-hidden border-l border-[var(--color-gray-10)] p-5 lg:flex xl:w-80",
          !historyOpen && "lg:hidden"
        )}
        id="ai-conversation-list"
        aria-label="대화 목록"
      >
        <div className="flex shrink-0 items-start justify-between gap-1">
          <span className="text-[18px] leading-[26px] font-bold text-[var(--color-gray-1)]">대화 목록</span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="대화 목록 닫기"
            title="대화 목록 닫기"
            onClick={() => setHistoryOpen(false)}
          >
            <X />
          </Button>
        </div>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={startNewChat}
          >
            <Plus /> 새 대화
          </Button>
          {/* Saved answers live with the conversations instead of a tab above the chat. */}
          <Button
            variant={toolsOpen ? "secondary" : "outline"}
            className="w-full justify-start"
            aria-pressed={toolsOpen}
            onClick={() => setToolsOpen(true)}
          >
            <Bookmark /> 저장한 답변과 상세 조회
          </Button>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={historyQuery}
              onChange={(event) => setHistoryQuery(event.target.value)}
              className="h-10 pl-9 shadow-[0_2px_4px_rgb(0_0_0/0.05)]"
              placeholder="대화 검색"
              aria-label="대화 검색"
            />
          </div>
        </div>
        <div className="-mr-3 min-h-0 flex-1 overflow-y-auto pr-3">
          {["오늘", "어제", "상태 예시"].map((group) => {
            const grouped = filteredConversations.filter(
              (conversation) => conversation.group === group
            )
            if (!grouped.length) return null
            return (
              <div key={group} className="mb-5">
                <div className="px-2 pb-3 text-[12px] font-semibold text-[var(--color-gray-4)]">
                  {group}
                </div>
                <div className="space-y-0.5">
                  {grouped.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => openConversation(conversation)}
                      className={cn(
                        "group flex w-full items-center gap-2.5 rounded-[8px] border border-transparent p-2.5 text-left transition-colors outline-none hover:bg-[var(--color-primary-10)] focus-visible:ring-2 focus-visible:ring-primary/30",
                        activeConversation === conversation.id &&
                          "border-[var(--color-primary-4)] bg-[var(--color-primary-10)]"
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] leading-5 font-semibold text-[var(--color-gray-2)]">
                          {conversation.title}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] leading-4 text-[var(--color-gray-4)]">
                          {conversation.meta}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          {!filteredConversations.length ? (
            <div className="px-3 py-8 text-center text-xs text-muted-foreground">
              찾는 대화가 없습니다.
            </div>
          ) : null}
        </div>
      </aside>
      </div>
    </div>
  )
}

const shipments = [
  {
    deal: "DL-260708-01",
    dealName: "7월 알루미늄 스크랩 수입",
    bl: "HMM014W2607",
    container: "HMMU 7820194",
    route: "Busan → Hamburg",
    vessel: "HMM Green",
    etd: "07.20",
    eta: "08.03",
    status: "운송 중",
    tone: "blue" as Tone,
    evidence: 8,
    evidenceCount: 3,
    documents: "B/L 확인",
  },
  {
    deal: "DL-260708-01",
    dealName: "7월 알루미늄 스크랩 수입",
    bl: "ONE26070819",
    container: "ONEU 1083275",
    route: "Shanghai → Incheon",
    vessel: "ONE Harmony",
    etd: "07.10",
    eta: "07.15",
    status: "도착 임박",
    tone: "amber" as Tone,
    evidence: 3,
    evidenceCount: 2,
    documents: "B/L 누락",
  },
  {
    deal: "DL-260701-04",
    dealName: "6월 재활용 원자재 수입",
    bl: "MSC26062077",
    container: "MSCU 8425510",
    route: "Singapore → Busan",
    vessel: "MSC Clara",
    etd: "06.28",
    eta: "07.08",
    status: "지연",
    tone: "red" as Tone,
    evidence: 0,
    evidenceCount: 0,
    documents: "증거 없음",
  },
  {
    deal: "DL-260701-04",
    dealName: "6월 재활용 원자재 수입",
    bl: "COS26070134",
    container: "COSU 2214870",
    route: "Qingdao → Incheon",
    vessel: "COSCO Star",
    etd: "07.01",
    eta: "07.06",
    status: "도착",
    tone: "green" as Tone,
    evidence: 5,
    evidenceCount: 2,
    documents: "서류 완료",
  },
  {
    deal: "DL-260704-04",
    dealName: "ACME 7월 해상운송 계약",
    bl: "MAEU26070481",
    container: "MSKU 3916208",
    route: "Hamburg → Busan",
    vessel: "Maersk Horsburgh",
    etd: "07.04",
    eta: "07.18",
    status: "운송 중",
    tone: "blue" as Tone,
    evidence: 6,
    evidenceCount: 2,
    documents: "B/L 확인",
  },
  {
    deal: "DL-260704-04",
    dealName: "ACME 7월 해상운송 계약",
    bl: "MAEU26070496",
    container: "MRKU 4528103",
    route: "Hamburg → Busan",
    vessel: "Maersk Horsburgh",
    etd: "07.04",
    eta: "07.18",
    status: "운송 중",
    tone: "blue" as Tone,
    evidence: 4,
    evidenceCount: 2,
    documents: "서류 완료",
  },
  {
    deal: "DL-260625-03",
    dealName: "Nordic 원자재 부산항 수입",
    bl: "CMDU26062541",
    container: "CMAU 1182046",
    route: "Gothenburg → Busan",
    vessel: "CMA CGM Louvre",
    etd: "06.25",
    eta: "07.16",
    status: "도착 임박",
    tone: "amber" as Tone,
    evidence: 2,
    evidenceCount: 1,
    documents: "B/L 확인",
  },
  {
    deal: "DL-260625-03",
    dealName: "Nordic 원자재 부산항 수입",
    bl: "CMDU26062558",
    container: "CMAU 4418792",
    route: "Gothenburg → Busan",
    vessel: "CMA CGM Louvre",
    etd: "06.25",
    eta: "07.16",
    status: "운송 중",
    tone: "blue" as Tone,
    evidence: 0,
    evidenceCount: 0,
    documents: "B/L 누락",
  },
  {
    deal: "DL-260629-03",
    dealName: "싱가포르 구리 스크랩 매입",
    bl: "ONEY26062973",
    container: "ONEU 7491025",
    route: "Singapore → Incheon",
    vessel: "ONE Innovation",
    etd: "06.29",
    eta: "07.19",
    status: "운송 중",
    tone: "blue" as Tone,
    evidence: 7,
    evidenceCount: 3,
    documents: "서류 완료",
  },
  {
    deal: "DL-260629-03",
    dealName: "싱가포르 구리 스크랩 매입",
    bl: "ONEY26062988",
    container: "ONEU 6243891",
    route: "Singapore → Incheon",
    vessel: "ONE Innovation",
    etd: "06.29",
    eta: "07.19",
    status: "운송 중",
    tone: "blue" as Tone,
    evidence: 5,
    evidenceCount: 2,
    documents: "B/L 확인",
  },
  {
    deal: "DL-260711-02",
    dealName: "HMM Green 재생 알루미늄 수입",
    bl: "HLCU26071125",
    container: "HLXU 8012459",
    route: "Rotterdam → Incheon",
    vessel: "HMM Rotterdam",
    etd: "07.11",
    eta: "07.28",
    status: "운송 중",
    tone: "blue" as Tone,
    evidence: 4,
    evidenceCount: 2,
    documents: "B/L 확인",
  },
  {
    deal: "DL-260711-02",
    dealName: "HMM Green 재생 알루미늄 수입",
    bl: "HLCU26071139",
    container: "HLXU 4931807",
    route: "Rotterdam → Incheon",
    vessel: "HMM Rotterdam",
    etd: "07.11",
    eta: "07.28",
    status: "운송 중",
    tone: "blue" as Tone,
    evidence: 3,
    evidenceCount: 2,
    documents: "서류 완료",
  },
  {
    deal: "DL-260713-07",
    dealName: "일본 내륙운송 발주",
    bl: "NYKS26071307",
    container: "NYKU 7712034",
    route: "Yokohama → Busan",
    vessel: "NYK Vega",
    etd: "07.13",
    eta: "07.17",
    status: "도착 임박",
    tone: "amber" as Tone,
    evidence: 1,
    evidenceCount: 1,
    documents: "B/L 확인",
  },
  {
    deal: "DL-260630-06",
    dealName: "태국 압축 스크랩 수입",
    bl: "EGLV26063061",
    container: "EGHU 6021498",
    route: "Laem Chabang → Busan",
    vessel: "Ever Balance",
    etd: "06.30",
    eta: "07.14",
    status: "도착",
    tone: "green" as Tone,
    evidence: 6,
    evidenceCount: 3,
    documents: "서류 완료",
  },
].map((row) => ({ ...row, reviewDocument: shipmentReviewSamples[row.bl] }))

export function SettingsPrototype({
  onNavigate,
  onLogout,
  workspaceId,
  onWorkspaceChange,
  availableProducts,
  role,
}: {
  onNavigate: Navigate
  onLogout: () => void
  workspaceId: WorkspaceKey
  onWorkspaceChange: (workspaceId: WorkspaceKey) => void
  availableProducts?: readonly ProductEntitlement[]
  role?: SettingsRole
}) {
  return (
    <SettingsHubV2
      onNavigate={onNavigate}
      onLogout={onLogout}
      workspaceId={workspaceId}
      onWorkspaceChange={onWorkspaceChange}
      availableProducts={availableProducts}
      role={role}
    />
  )
}

export function CounterpartyPrototype({ onNavigate, counterpartyId = "acme", role, access }: {
  onNavigate: Navigate; counterpartyId?: string; role?: string; access?: CounterpartyAccess
}) {
  const { userId, canReadOrganizationSettlement } = access ?? counterpartyPreviewAccess(role)
  const [model, setModel] = useState<Awaited<ReturnType<typeof counterpartyPreview.read>>>(null)
  const [loadState, setLoadState] = useState("loading")
  const requestKey = `${counterpartyId}:${userId}:${canReadOrganizationSettlement}`
  const [loadedFor, setLoadedFor] = useState("")
  const [attempt, setAttempt] = useState(0)
  const [page, setPage] = useState(1)
  const [currency, setCurrency] = useState("all")
  useEffect(() => {
    let active = true
    setLoadState("loading"); setPage(1); setCurrency("all")
    counterpartyPreview.read(counterpartyId, { userId, canReadOrganizationSettlement }).then(value => {
      if (active) { setModel(value); setLoadedFor(requestKey); setLoadState("ready") }
    }).catch(() => { if (active) { setLoadedFor(requestKey); setLoadState("error") } })
    return () => { active = false }
  }, [counterpartyId, attempt, userId, canReadOrganizationSettlement, requestKey])
  const stages = { contract: "계약", shipment: "선적", customs: "통관", settlement: "정산 중", settled: "정산 완료" }
  const recentDocuments = model?.deals.flatMap(deal => listDealDocuments(deal.id).map(doc => ({ ...doc, linkedDealId: deal.id }))).slice(0, 5) ?? []
  return <Page
    title={<span className="flex flex-wrap items-center gap-2">{model?.name ?? "거래처 360"}{model?.role.split("·").map(label => <Badge key={label} variant="outline" className="border-white/40 text-white text-xs">{label}</Badge>)}</span>}
    description="거래처별 거래, AR/AP, 결제 신뢰와 최근 서류를 확인합니다."
    action={<><Button variant="outline" onClick={() => onNavigate("settlement")}>정산으로 돌아가기</Button><Button disabled={!model} onClick={() => document.getElementById("counterparty-deals")?.scrollIntoView({ behavior: "smooth" })}>관련 거래 보기</Button></>}
  >
    {loadState === "loading" || loadedFor !== requestKey ? <p role="status">거래처 정보를 불러오는 중입니다.</p> : loadState === "error" ? <div role="alert"><p>거래처 정보를 불러오지 못했습니다.</p><Button variant="outline" onClick={() => setAttempt(value => value + 1)}>다시 시도</Button></div> : !model ? <p>거래처를 찾을 수 없습니다.</p> : <>
      {model.mergedFrom && <p role="status" className="mb-4 text-sm text-muted-foreground">‘{model.mergedFrom}’은 ‘{model.name}’으로 합쳐졌습니다.</p>}
      <SummaryMetricStrip items={([['receivable', '받을 돈'], ['payable', '지급할 돈'], ['overdue', '연체'], ['trust', '결제 신뢰']] as const).map(([key, label]) => ({
        label, tone: key === "overdue" ? "red" : key === "trust" ? "amber" : "neutral",
        detail: key === "trust" ? "회사 전체 기준" : model.financeScope === "assigned" ? "담당·공동 작업 기준" : "회사 전체 기준",
        value: <span className="block space-y-1" role="region" aria-label={label}>{(key === "trust" ? model.trustCurrencies : model.currencies).map(row => <span className="block" key={row.currency}>{row[key]} <span className="text-xs font-normal text-muted-foreground">{row.currency}</span></span>)}{key !== "trust" && model.currencies.length === 0 ? <span className="text-sm font-normal text-muted-foreground">해당 거래 없음</span> : null}</span>,
      }))} />
      {model.financeScope === "assigned" && <p className="mt-3 text-xs text-muted-foreground">회사 전체 금액·일정 조회는 조직 소유자에게 권한을 요청하세요.</p>}
      <Tabs defaultValue="ops" key={counterpartyId} className="mt-8">
        <TabsList aria-label="거래처 보기"><TabsTrigger value="ops">운영</TabsTrigger><TabsTrigger value="analytics">분석</TabsTrigger></TabsList>
        <TabsContent value="analytics" className="mt-8"><ContentPanel><SectionHeader title="분석 준비 중" /><p className="text-sm text-muted-foreground">거래처 분석은 준비 중입니다.</p></ContentPanel></TabsContent>
        <TabsContent value="ops" className="mt-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <ContentPanel id="counterparty-deals" className="self-start">
              <SectionHeader title="관련 거래" trailing={model.partial ? <Status tone="amber">부분 결과</Status> : undefined} />
              {model.partial && <p className="mb-3 text-xs text-muted-foreground">일부 상세를 불러오지 못했습니다. 아래 목록이 전체 결과는 아닙니다.</p>}
              <div className="divide-y">{model.deals.slice((page - 1) * 5, page * 5).map(deal => {
                const quantity = orderProgress(deal.id)
                return <Button variant="ghost" key={deal.id} onClick={() => onNavigate("deal", { dealId: deal.id })} className="h-auto w-full justify-between rounded-none py-4 text-left font-normal">
                  <span className="min-w-0"><span className="block whitespace-normal text-sm font-medium">{deal.title}</span><span className="text-xs text-muted-foreground">{deal.id}</span><span className="block whitespace-normal text-xs text-muted-foreground">{quantity ? `선적 ${quantity.shipped}/${quantity.contracted} ${quantity.unit} · ` : ""}ETA {deal.eta}</span></span>
                  <Status tone={deal.stage === "settled" ? "green" : "blue"}>{stages[deal.stage]}</Status>
                </Button>
              })}</div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground"><span>총 {model.deals.length}건{model.partial ? " · 조회된 범위" : ""}</span>{model.deals.length > 5 && <div className="flex items-center gap-2"><Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(value => value - 1)}>이전</Button><span>{page} / {Math.max(1, Math.ceil(model.deals.length / 5))}</span><Button variant="ghost" size="sm" disabled={page * 5 >= model.deals.length} onClick={() => setPage(value => value + 1)}>다음</Button></div>}</div>
            </ContentPanel>
            <ContentPanel><SectionHeader title="최근 서류" /><div className="divide-y text-sm">{recentDocuments.map(doc => <Button variant="ghost" key={doc.id} className="h-auto w-full justify-start rounded-none py-4 text-left font-normal" onClick={() => onNavigate("deal", { dealId: doc.linkedDealId })}><span className="min-w-0"><span className="block whitespace-normal">{doc.type} · {doc.file}</span><span className="text-xs text-muted-foreground">{doc.linkedDealId}</span></span></Button>)}</div></ContentPanel>
          </div>
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <ContentPanel><section aria-label="미결제 일정"><SectionHeader title="미결제 일정" trailing={<label className="flex items-center gap-2 text-xs">통화<Select value={currency} onValueChange={setCurrency}><SelectTrigger size="sm" className="w-auto" aria-label="통화"><SelectValue /></SelectTrigger><SelectContent align="end"><SelectItem value="all">전체 통화</SelectItem>{model.currencies.map(row => <SelectItem key={row.currency} value={row.currency}>{row.currency}</SelectItem>)}</SelectContent></Select></label>} />
            <p className="mb-3 text-xs text-muted-foreground">{model.financeScope === "assigned" ? "담당·공동 작업 기준" : "회사 전체 기준"}</p><Table><TableHeader><TableRow><TableHead>거래번호</TableHead><TableHead>구분</TableHead><TableHead>예정일</TableHead><TableHead>미결제 금액</TableHead><TableHead>상태</TableHead></TableRow></TableHeader><TableBody>{model.schedules.filter(row => currency === "all" || row.currency === currency).map(row => <TableRow key={row.id}><TableCell><button className="text-primary" onClick={() => onNavigate("deal", { dealId: row.dealId })}>{row.dealId}</button></TableCell><TableCell>{row.direction}</TableCell><TableCell>{row.due}</TableCell><TableCell>{row.amount} {row.currency}</TableCell><TableCell>{row.overdue ? "연체" : "예정"}</TableCell></TableRow>)}{!model.schedules.some(row => currency === "all" || row.currency === currency) && <TableRow><TableCell colSpan={5}>조회된 미결제 일정이 없습니다.</TableCell></TableRow>}</TableBody></Table>
            </section></ContentPanel>
            <ContentPanel><SectionHeader title="필요 서류" /><div className="divide-y text-sm">{model.deals.filter(deal => deal.nextDocument?.kind === "upload").map(deal => <Button variant="ghost" key={deal.id} className="h-auto w-full justify-start rounded-none py-4 text-left font-normal" onClick={() => onNavigate("deal", { dealId: deal.id })}><span>{deal.nextDocument?.label}<span className="block text-xs text-muted-foreground">{deal.id}</span></span></Button>)}{!model.deals.some(deal => deal.nextDocument?.kind === "upload") && <p className="text-sm text-muted-foreground">조회된 필요 서류가 없습니다.</p>}</div></ContentPanel>
          </div>
        </TabsContent>
      </Tabs>
    </>}
  </Page>
}

export function SnapEvidencePrototype({
  onNavigate,
}: {
  onNavigate: Navigate
}) {
  return (
    <Page
      title="SNAP 증거함"
      description="컨테이너 현장 증거와 배정 대상을 독립적으로 확인합니다."
      action={
        <Button variant="outline" onClick={() => onNavigate("shipments")}>
          선적으로 돌아가기
        </Button>
      }
    >
      <SnapEvidenceWorkspace onDeal={dealId => onNavigate("deal", { dealId })} />
    </Page>
  )
}

export function BillingPrototype({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <Page
      title="결제·구독"
      description="현재 구독과 기능 entitlement를 확인합니다."
      action={
        <Button variant="outline" onClick={() => onNavigate("settings")}>
          설정으로 돌아가기
        </Button>
      }
    >
      <ContentPanel className="max-w-4xl">
        <div className="flex items-start justify-between">
          <div>
            <Status tone="blue">Pro</Status>
            <h2 className="mt-3 text-xl font-semibold">ECOYA Trade OS Pro</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              결산 리포트, 영업 성과, 고급 AI 기능을 사용 중입니다.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold">₩129,000</div>
            <div className="text-xs text-muted-foreground">월 / 조직</div>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {["결산 리포트", "영업 성과", "고급 토큰 한도"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 text-emerald-600" />
              {item}
            </div>
          ))}
        </div>
        <Button className="mt-6">구독 관리</Button>
      </ContentPanel>
    </Page>
  )
}

export function TokenUsagePrototype({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <Page
      title="토큰 사용량"
      description="제품별 AI 호출과 월 한도를 확인합니다."
      action={
        <Button variant="outline" onClick={() => onNavigate("settings")}>
          설정으로 돌아가기
        </Button>
      }
    >
      <SummaryMetricStrip
        items={[
          { label: "이번 달 사용", value: "684K" },
          { label: "월 한도", value: "1.2M" },
          { label: "남은 토큰", value: "516K", note: "43%", tone: "green" },
          { label: "예상 소진", value: "07.29", note: "정상", tone: "green" },
        ]}
      />
      <div className="mt-8 max-w-4xl">
        <SectionHeader title="제품별 사용량" />
        <div className="space-y-5 py-5">
          {[
            ["문서 OCR", 72, "492K"],
            ["AI 문서 만들기", 18, "124K"],
            ["AI에게 묻기", 9, "61K"],
            ["거래 검증", 3, "7K"],
          ].map(([label, width, value]) => (
            <div key={label as string}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{label as string}</span>
                <strong>{value as string}</strong>
              </div>
              <div className="h-2 bg-muted">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Page>
  )
}

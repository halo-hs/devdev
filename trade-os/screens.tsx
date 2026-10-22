import { Tabs, TabsList, TabsTrigger, TabsContent } from "@shared/components/ui/tabs"
import { counterpartyPreview, counterpartyPreviewAccess, type CounterpartyAccess } from "@trade-os/counterparties/Counterparty360View"
import { listDealDocuments } from "@trade-os/lib/deal-document-actions"
import { orderProgress } from "@trade-os/lib/deal-finance-workspace"
import { SnapEvidenceWorkspace } from "./snapevidence/SnapEvidencePanel"
import { useEffect, useState, type ReactNode } from "react"
import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  ClipboardList,
  Send,
  Ship,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Upload,
  WalletCards,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select"
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
} from "@share/settings/SettingsRoutePage"
import type { WorkspaceKey } from "@shared/lib/workspaces"

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

export type Navigate = (
  screen: ErpMenuTarget,
  options?: {
    question?: string
    submit?: boolean
    dealId?: string
    documentName?: string
  }
) => void
export type Tone = "neutral" | "blue" | "green" | "amber" | "red"

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

export { OnboardingPrototype } from "@trade-os/onboarding/OnboardingProtectedPage"

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

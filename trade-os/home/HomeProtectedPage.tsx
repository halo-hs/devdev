import { appLocation } from "@/app/appLocation"
import { Badge } from "@/components/ui/Badge"
import { useState, type ReactNode } from "react"
import {
  Bot,
  Building2,
  CheckCircle2,
  FileUp,
  Send,
  Ship,
  ShieldAlert,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

import { BusinessPageHero } from "@/components/platform/HeroBanner"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import type { ErpMenuTarget } from "@trade-os/ErpScreens"
import { PlatformHomeOverview } from "@share/home/PlatformHomeOverview"
import { cn } from "@/lib/utils"

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

// 기존 역할별 홈은 모듈형 홈 검토 기간 동안 비교용으로 보존합니다.
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
                    onClick={() => appLocation.reload()}
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

export function HomePrototype({
  onNavigate,
  role = "owner",
  previewState = "default",
  marketAccess = true,
  insightAccess = true,
}: {
  onNavigate: Navigate
  role?: "owner" | "admin" | "member"
  previewState?: HomePreviewState
  marketAccess?: boolean
  insightAccess?: boolean
}) {
  if (previewState === "first-use") {
    return <EmptyHomePrototype onNavigate={onNavigate} state={previewState} />
  }

  // Figma 홈 시안 · 권한별: owner(대표) / admin(관리자) / member(실무자) boards with
  // 데이터 있음 · 데이터 없음 · 조회 실패 states and market/insight entitlements.
  return (
    <PlatformHomeOverview
      onNavigate={onNavigate}
      role={role}
      state={previewState === "empty" || previewState === "error" ? previewState : "default"}
      marketAccess={marketAccess}
      insightAccess={insightAccess}
    />
  )
}

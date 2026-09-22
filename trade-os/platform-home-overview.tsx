import { useRef, useState } from "react"
import {
  FilePlus2,
  FileUp,
  MessageSquare,
  FolderOpen,
  Ship,
  Send,
} from "lucide-react"
import { Button } from "@shared/components/ui/button"
import type { ErpMenuTarget } from "@trade-os/erp-menu-prototypes"
import { TodayModularWorkspace } from "@trade-os/today-modular-workspace"

type Navigate = (
  screen: ErpMenuTarget,
  options?: { question?: string; submit?: boolean }
) => void
const actions = [
  ["서류 올리기", "PDF를 던지면 AI가 읽어 거래로 만듭니다", FileUp, "inbox"],
  ["문서 만들기", "한 줄이면 전문 송장·계약서를 작성", FilePlus2, "create"],
  ["AI에게 묻기", "거래·정산·시장을 자연어로 질문", MessageSquare, "ask"],
  ["거래 보기", "진행 중인 수출입 거래와 상태", FolderOpen, "deals"],
  ["선적 보기", "선적·도착 일정을 확인하세요", Ship, "shipments"],
] as const
/** UI adaptation of develop-local TodayDualBody / AskPanel / QuickActions.
 * Uses this repository's sample data and navigation; no cross-app API session.
 */
export function PlatformHomeOverview({
  onNavigate,
  role,
  empty = false,
}: {
  onNavigate: Navigate
  role: "owner" | "member"
  empty?: boolean
}) {
  const [query, setQuery] = useState("")
  const input = useRef<HTMLTextAreaElement>(null)
  const submit = () => {
    if (query.trim())
      onNavigate("ask", { question: query.trim(), submit: true })
  }
  return (
    <div
      data-slot="business-page"
      data-home-reference="develop-local"
      data-home-scroll-viewport
      className="h-[calc(100svh-var(--header-height))] min-h-0 overflow-y-auto bg-muted/30"
    >
      <div className="flex min-h-full min-w-0 flex-col gap-3 px-4 pt-4 pb-4 sm:px-6">
        <section
          aria-labelledby="home-question-title"
          className="rounded-[var(--ui-radius-panel)] [background-image:var(--ui-ai-hero-background)] px-4 py-4 text-white shadow-[var(--ui-shadow-panel)] sm:px-5"
        >
          <h2 id="home-question-title" className="text-base font-semibold">
            무엇이든 물어보세요
          </h2>
          <form
            className="mt-3 space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            <textarea
              ref={input}
              rows={3}
              aria-label="AI에게 질문"
              placeholder="예: 이번 주 받을 돈이 가장 큰 거래처는?"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  (event.ctrlKey || event.metaKey) &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault()
                  submit()
                }
              }}
              className="block min-h-24 w-full min-w-0 resize-y rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 flex-wrap gap-2">
                {[
                  "이번 주 받을 돈",
                  "오늘 승인할 문서",
                  "B/L이 누락된 거래",
                ].map((example) => (
                  <Button
                    key={example}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-auto rounded-full border-white/30 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20 hover:text-white"
                    onClick={() => {
                      setQuery(example)
                      input.current?.focus()
                    }}
                  >
                    {example}
                  </Button>
                ))}
              </div>
              <Button
                type="submit"
                className="ml-auto h-9 min-w-28 border border-white/30 bg-white text-primary hover:bg-white/90"
                disabled={!query.trim()}
              >
                <Send className="size-4" />
                질문하기
              </Button>
            </div>
          </form>
        </section>
        <nav
          aria-label="업무 바로가기"
          className="flex items-center gap-3 overflow-x-auto py-1"
        >
          <h2 className="shrink-0 text-xs font-medium text-muted-foreground">
            무엇을 할까요?
          </h2>
          {actions.map(([title, description, Icon, target]) => (
            <Button
              key={title}
              variant="ghost"
              size="sm"
              className="shrink-0 font-normal"
              title={description}
              onClick={() => onNavigate(target)}
            >
              <Icon className="size-4" />
              {title}
            </Button>
          ))}
        </nav>
        <TodayModularWorkspace
          onNavigate={onNavigate}
          role={role}
          initialContentState={empty ? "empty" : "default"}
        />
      </div>
    </div>
  )
}

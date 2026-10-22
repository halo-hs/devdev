import { useStartGuide } from "@trade-os/onboarding/StartGuideProvider"
import { useRef, useState } from "react"
import { FileUp, Send } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import type { ErpMenuTarget } from "@trade-os/ErpScreens"
import { RoleHomeBoard, type HomeBoardState, type HomeRole } from "@share/home/RoleHomeBoard"

type Navigate = (
  screen: ErpMenuTarget,
  options?: { question?: string; submit?: boolean }
) => void
/** UI adaptation of develop-local TodayDualBody / AskPanel / QuickActions.
 * Uses this repository's sample data and navigation; no cross-app API session.
 */
export function PlatformHomeOverview({
  onNavigate,
  role,
  state = "default",
  marketAccess = true,
  insightAccess = true,
}: {
  onNavigate: Navigate
  role: HomeRole
  state?: HomeBoardState
  marketAccess?: boolean
  insightAccess?: boolean
}) {
  const guide = useStartGuide()
  const guideAnchor = guide?.state?.trade.T3 && !guide.state.trade.T4 && (!guide.state.access || guide.state.access === "active") ? guide.state.anchor : undefined
  const [guideAnswer, setGuideAnswer] = useState<{ id: string; dealId: string; documentId: string; question: string } | null>(null)
  const [query, setQuery] = useState("")
  const input = useRef<HTMLInputElement>(null)
  const submit = () => {
    if (query.trim() && guideAnchor?.dealId) {
      setGuideAnswer({ id: crypto.randomUUID(), dealId: guideAnchor.dealId, documentId: guideAnchor.documentId, question: query.trim() })
      return
    }
    if (query.trim())
      onNavigate("ask", { question: query.trim(), submit: true })
  }
  const hasQuery = Boolean(query.trim())
  return (
    <div
      data-slot="business-page"
      data-home-reference="develop-local"
      data-home-scroll-viewport
      className="h-[calc(100svh-var(--header-height))] min-h-0 overflow-y-auto"
    >
      {/* Figma 홈 시안 · 권한별 (4407:18532): photo banner with a floating question
          card, then the role board. Content is inset 20px with 40px at the bottom. */}
      <div className="flex min-h-full min-w-0 flex-col gap-5 px-4 pb-10 sm:px-5">
        <section aria-labelledby="home-question-title" className="relative">
          <div className="relative h-[200px] overflow-hidden rounded-[22px] shadow-[var(--shadow-modal)] sm:h-[280px]">
            <img src="/images/home-hero-ship-2800.jpg" alt="" decoding="async" className="absolute inset-0 size-full object-cover object-[center_42%]" />
          </div>
          <div className="relative mx-3 -mt-24 flex flex-col gap-1.5 rounded-[22px] border border-[var(--color-gray-9)] bg-[var(--color-gray-12)] px-5 py-5 shadow-[0_4px_12px_rgb(0_0_0/10%)] sm:mx-[60px] sm:-mt-[117px] sm:px-[30px]">
            {state === "empty" ? (
              <>
                <h2 id="home-question-title" className="text-[length:var(--text-compat-body-5-5)] leading-[26px] font-bold text-[var(--color-gray-2)]">
                  첫 거래를 만들어 보세요
                </h2>
                <p className="text-[length:var(--text-body-6)] leading-[var(--leading-body-6)] text-[var(--color-gray-5)]">
                  PDF 문서를 올리면 AI가 내용을 정리하고 거래로 연결할 수 있어요. 최근 발주서 한 건으로 시작해 보세요.
                </p>
                <div className="mt-3.5 flex flex-wrap justify-end gap-3">
                  <Button className="h-11 min-w-[118px] rounded-xl px-3 text-[17px] leading-6 [&_svg]:size-5" onClick={() => onNavigate("inbox")}>
                    <FileUp data-icon="inline-start" />
                    문서 올리기
                  </Button>
                  <Button variant="outline" className="h-11 rounded-xl px-3 text-[17px] leading-6" onClick={() => onNavigate("onboarding")}>
                    시작 가이드 보기
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="pt-0.5">
                  <h2 id="home-question-title" className="text-[length:var(--text-compat-body-5-5)] leading-[26px] font-bold text-[var(--color-gray-2)]">
                    무엇이든 물어보세요
                  </h2>
                  <p className="text-[length:var(--text-body-6)] leading-[var(--leading-body-6)] text-[var(--color-gray-5)]">
                    사내 거래 데이터와 시장 자료를 자연어로 조회합니다.
                  </p>
                </div>
                {guideAnchor?.dealId && <p className="text-sm">질문할 거래: {guideAnchor.dealId} · {guideAnchor.documentId}</p>}
                <form
                  className="grid gap-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    submit()
                  }}
                >
                  <Input
                    ref={input}
                    aria-label="AI에게 질문"
                    data-guide-target="question"
                    placeholder="값을 입력하세요"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="h-12 border-[var(--color-gray-10)]"
                  />
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                      {["이번 주 받을 돈", "오늘 승인할 문서", "B/L이 누락된 거래", "GP가 낮아진 거래처"].map((example) => (
                        <Button
                          key={example}
                          type="button"
                          variant="outline"
                          size="sm"
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
                      variant={hasQuery ? "default" : "outline"}
                      className="ml-auto h-11 min-w-[118px] rounded-xl pr-5 pl-[18px] text-[17px] leading-6 disabled:border-[var(--color-gray-9)] disabled:bg-[var(--color-gray-11)] disabled:text-[var(--color-gray-6)] [&_svg]:size-5"
                      disabled={!hasQuery}
                    >
                      <Send data-icon="inline-start" />
                      질문하기
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </section>
        {guideAnswer && guideAnswer.dealId === guide?.state?.anchor?.dealId && (!guide.state.access || guide.state.access === "active") && (
          <section aria-label="거래 질문 답변" className="rounded-xl border bg-card p-5">
            <p className="text-xs text-muted-foreground">예시 답변 · {guideAnswer.dealId}</p>
            <h2 className="mt-2 font-semibold">{guideAnswer.question}</h2>
            <p className="mt-3 text-sm leading-6">이 거래에는 검토를 마친 문서 {guideAnswer.documentId}가 연결되어 있습니다. 거래를 확정하기 전에 확인한 문서의 품목·수량·단가와 납기를 기준으로 후속 업무를 진행할 수 있습니다.</p>
            <a className="mt-3 block text-sm text-primary underline" href={`/erp/documents/upload/${encodeURIComponent(guideAnswer.documentId)}/review`}>근거 문서: {guideAnswer.documentId}</a>
            {guide?.state?.trade.T4 ? <p role="status" className="mt-4 text-sm font-medium">답변 근거를 확인했습니다.</p> : <Button className="mt-4" onClick={() => guide?.record({ type: "answer-confirmed", dealId: guideAnswer.dealId, answerId: guideAnswer.id, sourceDealIds: [guideAnswer.dealId], receipt: crypto.randomUUID() })}>답변과 근거 확인 완료</Button>}
          </section>
        )}
        <RoleHomeBoard
          role={role}
          state={state}
          marketAccess={marketAccess}
          insightAccess={insightAccess}
          onNavigate={onNavigate}
          onRetry={() => window.location.reload()}
        />
      </div>
    </div>
  )
}

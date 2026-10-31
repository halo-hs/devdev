import { HeroBanner } from "@/components/platform/HeroBanner"
import { useEffect } from "react"
import { useStartGuide } from "./startGuideContext"
import { isDone, type GuideItem } from "./state"
import {
  Check,
  ChevronRight,
  FileCheck2,
  FileUp,
  Info,
  Link2,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ErpMenuTarget } from "@trade-os/ErpScreens"

const steps = [
  {
    id: "T1",
    title: "첫 PDF 문서 올리기",
    description: "최근 발주서 문서를 올려 첫 거래를 준비하세요.",
    icon: FileUp,
  },
  {
    id: "T2",
    title: "AI 결과 확인·확정하기",
    description: "원문과 AI 추출 결과를 비교하고 필요한 값을 수정하세요.",
    icon: FileCheck2,
  },
  {
    id: "T3",
    title: "거래 만들기·연결하기",
    description: "확인한 문서를 기존 거래에 연결하거나 새 거래로 만드세요.",
    icon: Link2,
  },
  {
    id: "T4",
    title: "거래 데이터에 AI로 질문하기",
    description: "연결한 거래를 바탕으로 질문하고 답변의 근거를 확인하세요.",
    icon: MessageSquare,
  },
] as const

/** SC-08 / FS-13: fresh-start view. Visits and CTA clicks never mark steps complete.
 * Verified document/deal progress must come from the product projection, not local examples.
 */
export function OnboardingPrototype({
  onNavigate,
  role = "owner",
}: {
  onNavigate: (screen: ErpMenuTarget) => void
  role?: "owner" | "admin" | "member"
}) {
  const guide = useStartGuide()
  useEffect(() => {
    if (guide?.complete) onNavigate("home")
  }, [guide?.complete, onNavigate])
  const showOrganization = role !== "member"
  const total = showOrganization ? 6 : 4
  if (guide?.complete) return null
  if (!guide?.state)
    return (
      <div className="p-8" role="status">
        <h1 className="text-xl font-semibold">처음 시작하기</h1>
        <p className="my-4">
          {guide?.error
            ? "진행 정보를 불러오지 못했습니다. 다른 업무는 계속 이용할 수 있습니다."
            : "진행 정보를 불러오는 중입니다."}
        </p>
        {guide?.error && <Button onClick={guide.reload}>다시 시도</Button>}
        <Button
          className="ml-2"
          variant="outline"
          onClick={() => onNavigate("home")}
        >
          오늘 할 일로 이동
        </Button>
      </div>
    )
  const state = guide.state
  const locked = Boolean(state.access && state.access !== "active")
  const labels: Record<string, string> = {
    T1: state.anchor
      ? state.anchor.stage === "failed"
        ? "다시 시도하기"
        : "처리 상태 보기"
      : "내 PDF 선택",
    T2:
      state.anchor?.stage === "ready"
        ? "AI 결과 확인하기"
        : state.anchor?.stage === "failed"
          ? "다시 시도하기"
          : "처리 상태 보기",
    T3: "거래 연결 계속하기",
    T4: "AI에게 질문하기",
  }
  const enabled = (id: GuideItem) =>
    id === "T1" ||
    (id === "T2" && Boolean(state.anchor)) ||
    (id === "T3" && Boolean(state.trade.T2)) ||
    (id === "T4" && Boolean(state.trade.T3))
  const next = steps.find((step) => !isDone(state, step.id))?.id
  // Figma 처음시작하기 4차 (6578:223261): hero + overlapping guide card,
  // four step cards in one row, then the first-PDF tips panel.
  return (
    <div
      data-slot="onboarding-page"
      className="min-h-full bg-transparent px-5 pt-1.5 pb-10"
    >
      <div className="space-y-[30px]">
        <HeroBanner
          eyebrow="Trade OS 시작 가이드"
          title="처음 시작하기"
          description="Trade OS의 첫 거래를 만들어 보세요. 다른 업무를 먼저 시작하고 언제든 돌아와도 괜찮습니다."
          actions={
            <Button
              variant="ghost"
              size="lg"
              className="h-11 rounded-[var(--r-lg)] border border-[var(--color-gray-9)] bg-white pr-[18px] pl-5 text-[17px] leading-6 text-[var(--color-gray-2)] shadow-[0_1px_2px_rgba(5,29,57,0.1)] hover:bg-[var(--color-gray-11)] hover:text-[var(--color-gray-2)]"
              onClick={() => onNavigate("home")}
            >
              오늘 할 일로 이동 <ChevronRight />
            </Button>
          }
          summary={
            <section
              aria-label="나의 시작 가이드"
              className="rounded-[22px] border border-[var(--color-gray-9)] bg-white px-5 py-5 shadow-[0_2px_4px_rgba(0,0,0,0.08)] sm:mx-4 sm:px-[30px]"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-base leading-6 font-bold text-[var(--color-gray-2)]">
                    나의 시작 가이드
                  </h2>
                  <span
                    className="text-[13px] leading-[18px] font-semibold text-[var(--color-gray-2)]"
                    aria-label={`진행 ${guide.count}/${total}`}
                  >
                    전체 {guide.count}/{total}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label="시작 가이드 진행률"
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={guide.count}
                  className="h-1 overflow-hidden rounded-full bg-[var(--color-gray-10)]"
                >
                  <div
                    className="h-full rounded-full bg-[var(--color-primary-4)]"
                    style={{ width: `${(guide.count / total) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] leading-4 text-[var(--color-gray-5)]">
                  실제 작업이 완료되면 진행에 반영됩니다.
                </p>
              </div>
              {showOrganization && (
                <div className="mt-2.5 border-t border-[var(--color-gray-10)] pt-2.5">
                  <h2 className="text-base leading-6 font-bold text-[var(--color-gray-2)]">
                    조직 안내
                  </h2>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    {[
                      {
                        id: "C1" as const,
                        title: "조직 정보 확인하기",
                        description: "문서에 사용되는 조직 정보를 확인하세요.",
                        media: "/images/onboarding/circle-company.svg",
                      },
                      {
                        id: "C2" as const,
                        title: "팀원 초대 방법 확인하기",
                        description:
                          "함께 일할 팀원을 초대하는 방법을 알아보세요.",
                        media: "/images/onboarding/circle-member.svg",
                      },
                    ].map(({ id, title, description, media }) => (
                      <div
                        key={id}
                        className="flex items-center gap-3.5 rounded-[var(--r-lg)] border border-[var(--color-gray-10)] bg-white px-4 py-3.5"
                      >
                        <span className="relative size-10 shrink-0">
                          <img
                            src={media}
                            alt=""
                            className={
                              id === "C1"
                                ? "absolute inset-[5.36%] size-[89.28%]"
                                : "size-10"
                            }
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[15px] leading-[22px] font-normal text-[var(--color-gray-2)]">
                            {title}
                          </h3>
                          <p className="mt-0.5 text-[13px] leading-[18px] text-[var(--color-gray-5)]">
                            {description}
                          </p>
                        </div>
                        {isDone(state, id) ? (
                          <span className="inline-flex h-4 items-center rounded-full bg-[var(--color-gray-10)] px-2.5 text-[11px] leading-4 text-[var(--color-gray-4)]">
                            완료
                          </span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[var(--color-primary-4)] text-[var(--color-primary-4)] hover:text-[var(--color-primary-3)]"
                            disabled={locked}
                            onClick={() => guide.start(id)}
                          >
                            확인하기<span className="sr-only">: {title}</span>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          }
        />
        {locked && (
          <p role="status" className="rounded-lg border p-4 text-sm">
            권한 필요 · 현재는 읽기 전용입니다. 기존 진행은 보존되며 제품 접근이
            복구되면 이어갈 수 있습니다.
          </p>
        )}
        <section aria-labelledby="product-guide-title">
          <h2
            id="product-guide-title"
            className="mb-3 text-base leading-6 font-bold text-[var(--color-gray-2)]"
          >
            제품 시작
          </h2>
          <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => {
              const done = isDone(state, step.id)
              const current = step.id === next
              return (
                <li
                  key={step.id}
                  aria-current={current ? "step" : undefined}
                  className={cn(
                    "flex min-h-40 flex-col gap-2.5 rounded-[var(--r-lg)] border p-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
                    current
                      ? "border-[var(--color-primary-4)] bg-[var(--color-primary-10)]"
                      : "border-[var(--color-gray-10)] bg-white",
                    done && "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "grid size-[22px] shrink-0 place-items-center rounded-full text-[13px] leading-[18px] font-semibold",
                        done || current
                          ? "bg-[var(--color-primary-4)] text-white"
                          : "bg-[var(--color-gray-10)] text-[var(--color-gray-6)]"
                      )}
                    >
                      {done ? <Check className="size-3.5" strokeWidth={3} aria-label="완료" /> : index + 1}
                    </span>
                    <h3
                      className={cn(
                        current
                          ? "text-[14px] leading-5 font-semibold text-[var(--color-gray-2)]"
                          : "text-[13px] leading-[18px] font-normal",
                        done && "text-[var(--color-gray-4)]",
                        !done && !current && "text-[var(--color-gray-6)]"
                      )}
                    >
                      {step.title}
                    </h3>
                  </div>
                  <p className="pl-[30px] text-[13px] leading-[18px] text-[var(--color-gray-5)]">
                    {step.description}
                  </p>
                  {!done &&
                    (enabled(step.id) ? (
                      <div className="pl-[30px]">
                        <Button
                          size="sm"
                          disabled={locked}
                          onClick={() => guide.start(step.id)}
                        >
                          {labels[step.id]}
                          <ChevronRight data-icon="inline-end" />
                        </Button>
                      </div>
                    ) : (
                      <p className="mt-auto pl-[30px] text-[11px] leading-4 text-[var(--color-gray-5)]">
                        이전 항목을 완료하면 같은 문서·거래에서 이어갈 수
                        있어요.
                      </p>
                    ))}
                </li>
              )
            })}
          </ol>
        </section>
        <aside
          aria-labelledby="first-pdf-title"
          className="rounded-[var(--r-lg)] border border-[var(--color-gray-10)] bg-[var(--color-gray-11)] px-5 py-7 shadow-[0_2px_8px_rgba(0,0,0,0.08)] sm:px-8"
        >
          <h2
            id="first-pdf-title"
            className="text-lg leading-[26px] font-bold text-[var(--color-gray-2)]"
          >
            최근 발주서 1건으로 시작하세요
          </h2>
          <p className="text-[13px] leading-[18px] text-[var(--color-gray-5)]">
            PO 번호·거래처·품목·수량·단가·납기가 보이는 PDF면 가장 빠르게 첫
            거래를 만들 수 있어요.
          </p>
          <ul className="mt-2.5 space-y-2 text-[13px] leading-[18px] text-[var(--color-gray-5)]">
            <li>발주서가 없다면 매매계약서(SC)나 상업송장(CI)도 괜찮아요.</li>
            <li>한 파일에는 한 업무 문서만 넣고, 암호 없는 PDF를 권장합니다.</li>
            <li>업로드 가능한 파일 크기는 문서 업로드 화면에서 확인하세요.</li>
          </ul>
          <p className="mt-4 flex max-w-[557px] items-start gap-2 rounded-[var(--r-md)] border border-[var(--color-gray-9)] bg-white px-4 py-3 text-[13px] leading-[18px] text-[var(--color-gray-2)]">
            <Info className="mt-px size-5 shrink-0 text-[var(--color-gray-4)]" aria-hidden="true" />
            AI 결과를 직접 확인한 뒤 거래를 확정합니다. 업로드만으로 거래가
            확정되지는 않아요.
          </p>
        </aside>
      </div>
    </div>
  )
}

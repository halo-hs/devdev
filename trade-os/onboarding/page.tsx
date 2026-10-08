import { useEffect } from "react"
import { useStartGuide } from "./runtime"
import { isDone, type GuideItem } from "./state"
import {
  ArrowRight,
  Building2,
  FileCheck2,
  FileUp,
  Link2,
  MessageSquare,
  Users,
} from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { Badge } from "@shared/components/ui/badge"
import type { ErpMenuTarget } from "@trade-os/screens"

const steps = [
  {
    id: "T1",
    title: "첫 PDF 문서 올리기",
    description: "최근 발주서 한 건을 올려 첫 거래를 준비하세요.",
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
  return (
    <div
      data-slot="onboarding-page"
      className="min-h-full bg-background px-5 py-6 sm:px-8 sm:py-8"
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
          <div>
            <p className="text-sm font-medium text-primary">
              Trade OS 시작 가이드
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              처음 시작하기
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Trade OS의 첫 거래를 만들어 보세요. 다른 업무를 먼저 시작하고
              언제든 돌아와도 괜찮습니다.
            </p>
          </div>
          <Button variant="outline" onClick={() => onNavigate("home")}>
            오늘 할 일로 이동 <ArrowRight />
          </Button>
        </header>
        {locked && (
          <p role="status" className="rounded-lg border p-4 text-sm">
            권한 필요 · 현재는 읽기 전용입니다. 기존 진행은 보존되며 제품 접근이
            복구되면 이어갈 수 있습니다.
          </p>
        )}
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-8">
            <section aria-label="시작 가이드 진행" className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-semibold">나의 시작 가이드</h2>
                <span
                  className="text-sm font-medium"
                  aria-label={`진행 ${guide.count}/${total}`}
                >
                  진행 <span className="text-primary">{guide.count}</span>/
                  {total}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="시작 가이드 진행률"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={guide.count}
                className="h-1.5 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full bg-primary"
                  style={{ width: `${(guide.count / total) * 100}%` }}
                />
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                실제 작업이 완료되면 진행에 반영됩니다.
              </p>
            </section>
            {showOrganization && (
              <section aria-labelledby="organization-guide-title">
                <h2
                  id="organization-guide-title"
                  className="mb-3 text-sm font-semibold"
                >
                  조직 안내
                </h2>
                <div className="divide-y rounded-xl border bg-card">
                  {[
                    {
                      id: "C1" as const,
                      title: "조직 정보 확인하기",
                      description: "문서에 사용되는 조직 정보를 확인하세요.",
                      icon: Building2,
                    },
                    {
                      id: "C2" as const,
                      title: "팀원 초대 방법 확인하기",
                      description:
                        "함께 일할 팀원을 초대하는 방법을 알아보세요.",
                      icon: Users,
                    },
                  ].map(({ id, title, description, icon: Icon }) => (
                    <div
                      key={title}
                      className="flex flex-wrap items-center gap-4 p-5"
                    >
                      <Icon
                        className="size-5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <div className="min-w-40 flex-1">
                        <h3 className="text-sm font-medium">{title}</h3>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                          {description}
                        </p>
                      </div>
                      {isDone(state, id) ? (
                        <Badge variant="secondary">완료</Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={locked}
                          onClick={() => guide.start(id)}
                        >
                          확인하기<span className="sr-only">: {title}</span>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
            <section aria-labelledby="product-guide-title">
              <h2
                id="product-guide-title"
                className="mb-3 text-sm font-semibold"
              >
                제품 시작
              </h2>
              <ol className="divide-y overflow-hidden rounded-xl border bg-card">
                {steps.map((step, index) => (
                  <li
                    key={step.id}
                    className={
                      step.id === next ? "bg-primary/[0.035]" : undefined
                    }
                  >
                    <div className="flex items-start gap-4 p-5">
                      <span
                        className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${step.id === next ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm leading-7 font-semibold">
                            {step.title}
                          </h3>
                          {isDone(state, step.id) ? (
                            <Badge variant="secondary">완료</Badge>
                          ) : (
                            step.id === next && (
                              <Badge variant="secondary">
                                {state.anchor?.stage === "processing" &&
                                step.id === "T2"
                                  ? "진행 중"
                                  : "다음"}
                              </Badge>
                            )
                          )}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {step.description}
                        </p>
                        {!isDone(state, step.id) &&
                          (enabled(step.id) ? (
                            <Button
                              className="mt-4"
                              disabled={locked}
                              onClick={() => guide.start(step.id)}
                            >
                              {labels[step.id]}
                              <ArrowRight />
                            </Button>
                          ) : (
                            <p className="mt-2 text-xs leading-5 text-muted-foreground">
                              이전 항목을 완료하면 같은 문서·거래에서 이어갈 수
                              있어요.
                            </p>
                          ))}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
          <aside
            aria-labelledby="first-pdf-title"
            className="rounded-xl border bg-muted/25 p-6 lg:sticky lg:top-6"
          >
            <FileUp className="mb-4 size-6 text-primary" aria-hidden="true" />
            <h2
              id="first-pdf-title"
              className="text-lg leading-7 font-semibold"
            >
              최근 발주서 1건으로
              <br />
              시작하세요
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              PO 번호·거래처·품목·수량·단가·납기가 보이는 PDF면 가장 빠르게 첫
              거래를 만들 수 있어요.
            </p>
            <div className="my-5 border-t" />
            <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
              <li>발주서가 없다면 매매계약서(SC)나 상업송장(CI)도 괜찮아요.</li>
              <li>
                한 파일에는 한 업무 문서만 넣고, 암호 없는 PDF를 권장합니다.
              </li>
              <li>
                업로드 가능한 파일 크기는 문서 업로드 화면에서 확인하세요.
              </li>
            </ul>
            <p className="mt-5 rounded-lg bg-background p-3 text-xs leading-5 text-muted-foreground">
              AI 결과를 직접 확인한 뒤 거래를 확정합니다. 업로드만으로 거래가
              확정되지는 않아요.
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}

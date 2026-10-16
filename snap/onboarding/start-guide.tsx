import { useCallback, useEffect, useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { Badge } from "@shared/components/ui/badge"
import { useStartGuide } from "@trade-os/onboarding/runtime"
import type { SnapRole } from "@snap/lib/snap-routes"

type Item = "S1" | "S2" | "S3" | "S4"
type Projection = {
  access: "active" | "read-only" | "revoked"
  completed: Partial<Record<Item, string>>
  taskId?: string
}
// The preview consumes recorded completion receipts. Visiting a route or clicking
// a CTA never writes a completion. Live projection/receipt integration is separate.
export function useSnapStartGuide(scope: string) {
  const key = `ecoya.preview.snap-start-guide.v1:${scope}`
  const [result, setResult] = useState<{
    key: string
    state: Projection | null
    error: boolean
  }>({ key, state: null, error: false })
  const reload = useCallback(() => {
    try {
      const raw = localStorage.getItem(key)
      const state = raw
        ? (JSON.parse(raw) as Projection)
        : ({ access: "active", completed: {} } as Projection)
      if (
        !state.completed ||
        !["active", "read-only", "revoked"].includes(state.access)
      )
        throw new Error("Invalid guide projection")
      setResult({ key, state, error: false })
    } catch {
      setResult({ key, state: null, error: true })
    }
  }, [key])
  useEffect(() => {
    reload()
    window.addEventListener("storage", reload)
    return () => window.removeEventListener("storage", reload)
  }, [reload])
  return {
    state: result.key === key ? result.state : null,
    error: result.key === key && result.error,
    reload,
  }
}
const steps: {
  id: Item
  title: string
  description: string
  action: string
}[] = [
  {
    id: "S1",
    title: "첫 업무 만들기",
    description: "업무 설명과 범위를 입력하고 확정합니다.",
    action: "업무 만들기",
  },
  {
    id: "S2",
    title: "작업자 연결하기",
    description: "같은 업무에 작업자를 배정하거나 작업 링크를 만듭니다.",
    action: "작업자 연결",
  },
  {
    id: "S3",
    title: "첫 결과 검토하기",
    description: "제출된 결과를 확인하고 승인·반려·재촬영을 요청합니다.",
    action: "결과 검토",
  },
  {
    id: "S4",
    title: "첫 리포트 발행하기",
    description:
      "승인된 결과로 리포트를 발행합니다. 고객 전달은 이후에 진행합니다.",
    action: "리포트 발행",
  },
]
export function SnapStartGuidePage({
  scope,
  role,
}: {
  scope: string
  role: SnapRole | null
}) {
  const guide = useSnapStartGuide(scope)
  const common = useStartGuide()
  const privileged = role === "owner" || role === "manager"
  const completedCommon = privileged
    ? [common?.state?.common.C1, common?.state?.common.C2].filter(Boolean)
        .length
    : 0
  const count =
    steps.filter(step => guide.state?.completed[step.id]).length +
    completedCommon
  const total = privileged ? 6 : 4
  const readOnly = guide.state?.access !== "active"
  const loadError = guide.error || Boolean(privileged && common?.error)
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-8">
      <header>
        <h1 className="text-2xl font-semibold">처음 시작하기</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          실제 업무 화면에서 한 단계씩 진행합니다. 언제든 다른 메뉴로 이동할 수
          있습니다.
        </p>
      </header>
      {loadError ? (
        <div role="alert" className="space-y-3 rounded-md border p-4">
          <p className="text-sm">
            시작 가이드의 진행 상태를 불러오지 못했습니다.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              guide.reload()
              common?.reload()
            }}
          >
            다시 시도
          </Button>
        </div>
      ) : !guide.state || (privileged && !common?.state) ? (
        <p role="status" className="text-sm text-muted-foreground">
          진행 상태를 불러오는 중입니다.
        </p>
      ) : (
        <>
          <p className="text-sm font-medium">
            진행 {count}/{total}
          </p>
          {readOnly && (
            <div
              role="status"
              className="rounded-md border bg-muted/50 p-4 text-sm leading-6 break-keep"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">SNAP이 읽기 전용 상태입니다.</p>
                  <p className="text-muted-foreground">
                    입력한 데이터와 진행 상태는 보존됩니다. 이용 권한이 복구되면
                    이어서 진행할 수 있습니다.
                  </p>
                </div>
                {role === "owner" && (
                  <Button size="sm" asChild>
                    <a href="/erp/settings?section=products">구독하기</a>
                  </Button>
                )}
              </div>
              {role !== "owner" && (
                <p className="mt-2 text-muted-foreground">
                  구독은 조직 소유자가 시작할 수 있습니다.
                </p>
              )}
            </div>
          )}
          {privileged && (
            <section aria-label="조직 안내">
              <h2 className="mb-3 text-base font-semibold">조직 안내</h2>
              <div className="divide-y border-y">
                {(
                  [
                    ["C1", "조직 정보 확인하기"],
                    ["C2", "팀원 초대 방법 확인하기"],
                  ] as const
                ).map(([id, title]) => (
                  <div
                    key={id}
                    className="flex items-center justify-between gap-3 py-4"
                  >
                    <span className="text-sm">{title}</span>
                    {common?.state?.common[id] ? (
                      <Badge variant="secondary">
                        <Check className="size-3" />
                        완료
                      </Badge>
                    ) : readOnly ? (
                      <Badge variant="secondary">읽기 전용</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => common?.start(id)}
                      >
                        확인하기
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          <section aria-label="제품 시작">
            <h2 className="mb-3 text-base font-semibold">제품 시작</h2>
            <ol className="divide-y border-y">
              {steps.map((step, index) => {
                const complete = Boolean(guide.state?.completed[step.id])
                const previousDone =
                  index === 0 ||
                  Boolean(guide.state?.completed[steps[index - 1].id])
                const canStart =
                  !readOnly &&
                  previousDone &&
                  (step.id === "S1" || Boolean(guide.state?.taskId))
                const href =
                  step.id === "S1"
                    ? "/tasks/new"
                    : `/tasks/${encodeURIComponent(guide.state?.taskId ?? "")}${step.id === "S4" ? "/report" : ""}`
                return (
                  <li
                    key={step.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-5"
                  >
                    <div className="min-w-0 flex-1 basis-56">
                      <h3 className="text-sm font-medium">{step.title}</h3>
                      <p className="mt-1 text-xs leading-5 break-keep text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                    {complete ? (
                      <Badge variant="secondary">
                        <Check className="size-3" />
                        완료
                      </Badge>
                    ) : readOnly ? (
                      <Badge variant="secondary">읽기 전용</Badge>
                    ) : canStart ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={href}>{step.action}</a>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        title="앞 단계의 업무를 완료한 뒤 진행할 수 있습니다."
                      >
                        {step.action}
                      </Button>
                    )}
                  </li>
                )
              })}
            </ol>
          </section>
        </>
      )}
    </div>
  )
}

import { ArrowRight, Building2, FileCheck2, FileUp, Link2, MessageSquare, Users } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { Badge } from "@shared/components/ui/badge"
import type { ErpMenuTarget } from "@trade-os/screens"

const steps = [
  { id: "T1", title: "첫 PDF 문서 올리기", description: "최근 발주서 한 건을 올려 첫 거래를 준비하세요.", icon: FileUp },
  { id: "T2", title: "AI 결과 확인·확정하기", description: "원문과 AI 추출 결과를 비교하고 필요한 값을 수정하세요.", icon: FileCheck2 },
  { id: "T3", title: "거래 만들기·연결하기", description: "확인한 문서를 기존 거래에 연결하거나 새 거래로 만드세요.", icon: Link2 },
  { id: "T4", title: "거래 데이터에 AI로 질문하기", description: "연결한 거래를 바탕으로 질문하고 답변의 근거를 확인하세요.", icon: MessageSquare },
] as const

/** SC-08 / FS-13: fresh-start view. Visits and CTA clicks never mark steps complete.
 * Verified document/deal progress must come from the product projection, not local examples.
 */
export function OnboardingPrototype({ onNavigate, role = "owner" }: {
  onNavigate: (screen: ErpMenuTarget) => void
  role?: "owner" | "admin" | "member"
}) {
  const showOrganization = role !== "member"
  const total = showOrganization ? 6 : 4
  return (
    <div data-slot="onboarding-page" className="min-h-full bg-background px-5 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
          <div>
            <p className="text-sm font-medium text-primary">Trade OS 시작 가이드</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">처음 시작하기</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Trade OS의 첫 거래를 만들어 보세요. 다른 업무를 먼저 시작하고 언제든 돌아와도 괜찮습니다.</p>
          </div>
          <Button variant="outline" onClick={() => onNavigate("home")}>오늘 할 일로 이동 <ArrowRight /></Button>
        </header>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-8">
            <section aria-label="시작 가이드 진행" className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-semibold">나의 시작 가이드</h2>
                <span className="text-sm font-medium" aria-label={`진행 0/${total}`}>진행 <span className="text-primary">0</span>/{total}</span>
              </div>
              <div role="progressbar" aria-label="시작 가이드 진행률" aria-valuemin={0} aria-valuemax={total} aria-valuenow={0} className="h-1.5 rounded-full bg-muted" />
              <p className="text-xs leading-5 text-muted-foreground">실제 작업이 완료되면 진행에 반영됩니다.</p>
            </section>
            {showOrganization && (
              <section aria-labelledby="organization-guide-title">
                <h2 id="organization-guide-title" className="mb-3 text-sm font-semibold">조직 안내</h2>
                <div className="divide-y rounded-xl border bg-card">
                  {[
                    { title: "조직 정보 확인하기", description: "문서에 사용되는 조직 정보를 확인하세요.", icon: Building2 },
                    { title: "팀원 초대 방법 확인하기", description: "함께 일할 팀원을 초대하는 방법을 알아보세요.", icon: Users },
                  ].map(({ title, description, icon: Icon }) => (
                    <div key={title} className="flex flex-wrap items-center gap-4 p-5">
                      <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <div className="min-w-40 flex-1"><h3 className="text-sm font-medium">{title}</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p></div>
                      <Button variant="outline" size="sm" onClick={() => window.location.assign("/erp/settings?section=organization")}>확인하기<span className="sr-only">: {title}</span></Button>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <section aria-labelledby="product-guide-title">
              <h2 id="product-guide-title" className="mb-3 text-sm font-semibold">제품 시작</h2>
              <ol className="divide-y overflow-hidden rounded-xl border bg-card">
                {steps.map((step, index) => (
                  <li key={step.id} className={index === 0 ? "bg-primary/[0.035]" : undefined}>
                    <div className="flex items-start gap-4 p-5">
                      <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${index === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold leading-7">{step.title}</h3>{index === 0 && <Badge variant="secondary">다음</Badge>}</div>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.description}</p>
                        {index === 0 ? <Button className="mt-4" onClick={() => onNavigate("inbox")}><FileUp />내 PDF 선택<ArrowRight /></Button> : <p className="mt-2 text-xs leading-5 text-muted-foreground">{index === 1 ? "PDF 분석 결과가 준비되면 이어갈 수 있어요." : index === 2 ? "같은 문서의 AI 결과를 확인한 뒤 진행해요." : "문서가 연결된 거래로 질문을 시작해요."}</p>}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
          <aside aria-labelledby="first-pdf-title" className="rounded-xl border bg-muted/25 p-6 lg:sticky lg:top-6">
            <FileUp className="mb-4 size-6 text-primary" aria-hidden="true" />
            <h2 id="first-pdf-title" className="text-lg font-semibold leading-7">최근 발주서 1건으로<br />시작하세요</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">PO 번호·거래처·품목·수량·단가·납기가 보이는 PDF면 가장 빠르게 첫 거래를 만들 수 있어요.</p>
            <div className="my-5 border-t" />
            <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
              <li>발주서가 없다면 매매계약서(SC)나 상업송장(CI)도 괜찮아요.</li>
              <li>한 파일에는 한 업무 문서만 넣고, 암호 없는 PDF를 권장합니다.</li>
              <li>업로드 가능한 파일 크기는 문서 업로드 화면에서 확인하세요.</li>
            </ul>
            <p className="mt-5 rounded-lg bg-background p-3 text-xs leading-5 text-muted-foreground">AI 결과를 직접 확인한 뒤 거래를 확정합니다. 업로드만으로 거래가 확정되지는 않아요.</p>
          </aside>
        </div>
      </div>
    </div>
  )
}

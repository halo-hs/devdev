import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { type CommonScreenKey, InlineFeedback, type CommonPrototypeScreenProps } from "@auth/AuthSurface"

type LegalKind = "terms" | "privacy"

function CommonLegalPrototype({
  kind,
  onNavigate,
}: {
  kind: LegalKind
  onNavigate?: (route: CommonScreenKey) => void
}) {
  const isTerms = kind === "terms"
  const sections = isTerms
    ? [
        [
          "서비스 이용",
          "ECOYA 제품의 계정, 조직, 문서 및 업무 기능 이용에 관한 기준입니다.",
        ],
        [
          "조직과 권한",
          "조직 관리자는 제품별 역할과 접근 권한을 관리하며 공통 계정과 제품 역할은 별도로 적용됩니다.",
        ],
        [
          "서비스 변경",
          "중요 변경은 사전 고지하고 적용 시점과 이전 버전 이용 가능 기간을 명시합니다.",
        ],
      ]
    : [
        [
          "처리하는 정보",
          "계정, 조직, 제품 사용 및 고객이 업로드한 업무 데이터의 처리 기준을 설명합니다.",
        ],
        [
          "보존과 삭제",
          "제품별 보존 정책과 법적 보존은 승인된 정책에 따르며 미확인 기간을 화면에서 추정하지 않습니다.",
        ],
        [
          "문의와 권리",
          "개인정보 내보내기·삭제 요청은 별도 운영 절차에서 본인과 권한을 확인한 뒤 처리합니다.",
        ],
      ]

  return (
    <main className="flex-1 bg-background">
      <article className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <Button
          className="mb-6"
          variant="outline"
          size="sm"
          onClick={() => onNavigate?.("signup")}
        >
          <ArrowLeft /> 가입으로 돌아가기
        </Button>
        <div className="flex flex-col gap-3 border-b pb-6">
          <Badge className="w-fit" variant="outline">
            공개 법률 문서
          </Badge>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            {isTerms ? "이용약관" : "개인정보 처리방침"}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            이 화면은 문서 열람만 제공하며, 열람 자체는 동의로 기록되지
            않습니다.
          </p>
        </div>
        <div className="grid gap-6 py-6 sm:grid-cols-[minmax(0,1fr)_220px]">
          <div className="flex min-w-0 flex-col gap-7">
            <InlineFeedback
              feedback={{
                tone: "warning",
                title: "법무 승인본 주입 대기",
                description:
                  "실제 문안·문서 ID·버전·시행일·digest는 법무 artifact registry에서 주입되며 현재 값은 추정하지 않습니다.",
              }}
            />
            {sections.map(([title, body], index) => (
              <section key={title} className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold">
                  {index + 1}. {title}
                </h2>
                <p className="text-sm leading-7 text-muted-foreground">
                  {body}
                </p>
              </section>
            ))}
          </div>
          <aside className="h-fit rounded-md border p-4 text-xs">
            <h2 className="font-semibold">문서 정보</h2>
            <dl className="mt-3 flex flex-col gap-3 text-muted-foreground">
              <div>
                <dt>적용 제품</dt>
                <dd className="mt-0.5 text-foreground">ECOYA Platform</dd>
              </div>
              <div>
                <dt>문서 ID · 버전</dt>
                <dd className="mt-0.5 text-foreground">— (미확인)</dd>
              </div>
              <div>
                <dt>언어 · 시행일</dt>
                <dd className="mt-0.5 text-foreground">한국어 · —</dd>
              </div>
              <div>
                <dt>Content digest</dt>
                <dd className="mt-0.5 break-all text-foreground">— (미확인)</dd>
              </div>
            </dl>
          </aside>
        </div>
      </article>
    </main>
  )
}

export function CommonTermsPrototype({
  onNavigate,
}: CommonPrototypeScreenProps) {
  return <CommonLegalPrototype kind="terms" onNavigate={onNavigate} />
}

export function CommonPrivacyPrototype({
  onNavigate,
}: CommonPrototypeScreenProps) {
  return <CommonLegalPrototype kind="privacy" onNavigate={onNavigate} />
}

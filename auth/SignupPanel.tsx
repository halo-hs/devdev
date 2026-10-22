import { useState } from "react"
import { authFieldError } from "@auth/lib/authValidation"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@shared/components/ui/select"
import { Button } from "@shared/components/ui/button"
import { RefreshCw, Mail, CheckCircle2, ArrowRight } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { AuthInputField } from "@auth/AuthInputField"
import googleIcon from "@ecoya/design-system/assets/icons/icon-google.svg"
import { type CommonPrototypeScreenProps, type Feedback, AuthSurface, InlineFeedback } from "@auth/AuthSurface"
import { showPreviewControls } from "@auth/authNavigation"

type SignupStep = "identity" | "verification" | "organization" | "complete"

export function CommonSignupPrototype({
  onNavigate,
  onProductLanding,
}: CommonPrototypeScreenProps) {
  const [step, setStep] = useState<SignupStep>("identity")
  const [company, setCompany] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [notice, setNotice] = useState("")
  const [providerError, setProviderError] = useState(false)
  const [failure, setFailure] = useState("")
  const failures: Record<string, Feedback> = {
    "account-error": {
      tone: "error",
      title: "계정을 만들지 못했습니다",
      description:
        "입력 내용을 확인하고 다시 시도해 주세요. 기존 계정이 있다면 로그인해 주세요.",
    },
    "network-error": {
      tone: "error",
      title: "가입 처리 결과를 확인하지 못했습니다",
      description:
        "네트워크 연결을 확인한 뒤 다시 시도해 주세요. 입력한 정보는 유지됩니다.",
    },
    "legal-error": {
      tone: "error",
      title: "약관을 불러오지 못했습니다",
      description:
        "약관을 확인할 수 없어 가입을 진행하지 않았습니다. 잠시 후 다시 시도해 주세요.",
    },
    "partial-failure": {
      tone: "error",
      title: "조직 준비가 완료되지 않았습니다",
      description:
        "계정을 다시 만들 필요가 없습니다. 조직 설정을 이어서 진행해 주세요.",
    },
  }
  const errors = {
    email: authFieldError(email, "이메일", { email: true }),
    password: authFieldError(password, "비밀번호", { minLength: 8 }),
    confirm: authFieldError(confirm, "비밀번호 확인", { match: password }),
  }
  const companyError = authFieldError(company, "조직명")
  const titles = {
    identity: "ECOYA 계정 만들기",
    verification: "이메일 인증이 필요합니다",
    organization: "조직 만들기",
    complete: "시작할 준비가 됐습니다",
  }
  const descriptions = {
    identity: "계정을 만든 뒤 우리 팀의 조직을 설정합니다.",
    verification: "이메일의 인증 링크를 확인한 뒤 계속해 주세요.",
    organization: "우리 팀이 함께 사용할 조직 이름을 입력하세요.",
    complete: "조직에서 문서를 올리고 업무를 시작하세요.",
  }
  const changeStep = (next: SignupStep) => {
    setSubmitted(false)
    setNotice("")
    setProviderError(false)
    setFailure("")
    setStep(next)
  }
  return (
    <AuthSurface
      variant="signup"
      title={titles[step]}
      description={descriptions[step]}
    >
      <div className="flex flex-1 flex-col gap-6">
        {showPreviewControls() && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer">가입 결과 미리보기</summary>
            <Select
              value={failure || step}
              onValueChange={(value) => {
                if (!value) return
                if (failures[value]) setFailure(value)
                else changeStep(value as SignupStep)
              }}
            >
              <SelectTrigger aria-label="가입 결과 미리보기" className="mt-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="identity">정보 입력</SelectItem>
                <SelectItem value="account-error">계정 생성 오류</SelectItem>
                <SelectItem value="network-error">가입 연결 오류</SelectItem>
                <SelectItem value="legal-error">약관 조회 오류</SelectItem>
                <SelectItem value="partial-failure">
                  계정 생성 후 조직 준비 실패
                </SelectItem>
              </SelectContent>
            </Select>
          </details>
        )}
        {failure ? (
          <div className="flex flex-col gap-4">
            <InlineFeedback feedback={failures[failure]} />
            <Button
              variant="outline"
              onClick={() =>
                changeStep(
                  failure === "partial-failure" ? "organization" : "identity"
                )
              }
            >
              <RefreshCw />
              {failure === "partial-failure"
                ? "조직 설정 다시 시도"
                : "가입 화면으로 돌아가기"}
            </Button>
            <Button variant="link" onClick={() => onNavigate?.("login")}>
              로그인
            </Button>
          </div>
        ) : (
          <>
            <ol
              aria-label="회원가입 단계"
              className="flex min-h-8 w-full flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm"
            >
              {["계정 만들기", "조직 설정"].map((label, index) => (
                <li
                  key={label}
                  aria-current={
                    (step === "identity" || step === "verification" ? 0 : 1) ===
                    index
                      ? "step"
                      : undefined
                  }
                  className={cn(
                    "flex items-center gap-2 text-muted-foreground",
                    (step === "identity" || step === "verification" ? 0 : 1) ===
                      index && "font-semibold text-primary"
                  )}
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs">
                    {index + 1}
                  </span>
                  {label}
                </li>
              ))}
            </ol>
            {step === "identity" && (
              <>
                <form
                  noValidate
                  className="flex min-h-[350px] flex-col gap-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    setSubmitted(true)
                    const invalid = Object.entries(errors).find(
                      ([, error]) => error
                    )
                    if (invalid) {
                      event.currentTarget
                        .querySelector<HTMLInputElement>(
                          `[name="${invalid[0]}"]`
                        )
                        ?.focus()
                      return
                    }
                    setPassword("")
                    setConfirm("")
                    changeStep("verification")
                  }}
                >
                  <AuthInputField
                    name="email"
                    label="이메일"
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={setEmail}
                    error={errors.email}
                    submitted={submitted}
                  />
                  <AuthInputField
                    name="password"
                    label="비밀번호"
                    password
                    autoComplete="new-password"
                    hint="8자 이상 입력해 주세요."
                    value={password}
                    onChange={setPassword}
                    error={errors.password}
                    submitted={submitted}
                  />
                  <AuthInputField
                    name="confirm"
                    label="비밀번호 확인"
                    password
                    autoComplete="new-password"
                    value={confirm}
                    onChange={setConfirm}
                    error={errors.confirm}
                    submitted={submitted}
                  />
                  <Button type="submit" className="mt-auto h-10 w-full">
                    계정 만들기
                  </Button>
                </form>
                <div className="flex flex-col gap-4">
                  <div
                    role="separator"
                    className="flex items-center gap-3 text-xs text-muted-foreground"
                  >
                    <span className="h-px flex-1 bg-border" />
                    또는
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full"
                    onClick={() => setProviderError(true)}
                  >
                    <SocialGoogleIcon /> Google로 계속
                  </Button>
                  {providerError && (
                    <InlineFeedback
                      feedback={{
                        tone: "error",
                        title: "Google에 연결하지 못했습니다",
                        description:
                          "잠시 후 다시 시도하거나 이메일로 가입해 주세요.",
                      }}
                    />
                  )}
                  <p className="text-center text-sm leading-6 text-muted-foreground">
                    계정 만들기 또는 Google로 계속하면{" "}
                    <a
                      href="/legal/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      이용약관
                    </a>
                    에 동의하고{" "}
                    <a
                      href="/legal/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      개인정보처리방침
                    </a>
                    을 확인한 것으로 봅니다.
                  </p>
                </div>
                <p className="text-center text-[13px] text-muted-foreground">
                  이미 계정이 있으신가요?{" "}
                  <Button
                    className="h-auto p-0"
                    variant="link"
                    onClick={() => onNavigate?.("login")}
                  >
                    로그인
                  </Button>
                </p>
              </>
            )}
            {step === "verification" && (
              <div className="flex min-h-[350px] flex-col gap-4">
                <div className="rounded-lg border bg-muted/40 p-4">
                  <Mail className="mb-3 size-6 text-primary" />
                  <p className="font-medium break-all">{email}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    인증이 완료되면 조직 설정을 이어갈 수 있습니다.
                  </p>
                </div>
                {notice && (
                  <p role="status" className="text-sm text-muted-foreground">
                    {notice}
                  </p>
                )}
                <div className="mt-auto flex flex-col gap-3 pt-6">
                  <Button
                    variant="outline"
                    className="h-10 w-full"
                    onClick={() =>
                      setNotice(
                        "메일함과 스팸함을 확인해 주세요. 인증 메일이 없으면 잠시 후 다시 시도해 주세요."
                      )
                    }
                  >
                    인증 이메일 다시 보내기
                  </Button>
                  <Button
                    className="h-10 w-full"
                    onClick={() => changeStep("organization")}
                  >
                    인증을 완료했습니다
                  </Button>
                </div>
              </div>
            )}
            {step === "verification" && (
              <Button
                variant="link"
                className="h-auto self-center p-0"
                onClick={() => changeStep("identity")}
              >
                다른 이메일로 가입
              </Button>
            )}
            {step === "organization" && (
              <form
                noValidate
                className="flex min-h-[350px] flex-col gap-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  setSubmitted(true)
                  if (companyError) {
                    event.currentTarget
                      .querySelector<HTMLInputElement>('[name="company"]')
                      ?.focus()
                    return
                  }
                  changeStep("complete")
                }}
              >
                <div className="rounded-lg border bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">현재 계정</p>
                  <p className="mt-1 text-sm font-medium break-all">{email}</p>
                  <Button
                    type="button"
                    variant="link"
                    className="mt-2 h-auto p-0"
                    onClick={() => {
                      setEmail("")
                      changeStep("identity")
                    }}
                  >
                    다른 계정 사용
                  </Button>
                </div>
                <AuthInputField
                  name="company"
                  label="조직명"
                  autoComplete="organization"
                  placeholder="예: ECOYA 무역"
                  value={company}
                  onChange={setCompany}
                  error={companyError}
                  submitted={submitted}
                />
                <Button type="submit" className="mt-auto h-10 w-full">
                  조직 만들기
                </Button>
              </form>
            )}
            {step === "complete" && (
              <div className="flex min-h-[350px] flex-col gap-4">
                <div
                  role="status"
                  className="rounded-lg border bg-muted/40 p-5"
                >
                  <CheckCircle2 className="mb-3 size-7 text-primary" />
                  <p className="font-semibold break-words">{company}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    계정과 조직 준비가 완료됐습니다.
                  </p>
                </div>
                <Button
                  className="mt-auto h-10 w-full"
                  onClick={() => onProductLanding?.("erp")}
                >
                  업무 시작하기 <ArrowRight />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </AuthSurface>
  )
}

function SocialGoogleIcon() {
  const Icon = googleIcon
  return <Icon aria-hidden="true" className="size-4" />
}

import { useState, type FormEvent } from "react"
import {
  authActionButtonClass,
  authFieldError,
  authSocialButtonClass,
} from "@auth/lib/authValidation"
import { Button } from "@/components/ui/Button"
import {
  Loader2,
  Building2,
  MapPin,
  AlertCircle,
  RefreshCw,
  UserRound,
} from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/Card"
import { AuthInputField } from "@auth/AuthInputField"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover"
import googleIcon from "@/components/ds2/assets/icons/icon-google.svg"
import appleIcon from "@/components/ds2/assets/icons/icon-apple.svg"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/Select"
import {
  type CommonPreviewPlan,
  type CommonPreviewRole,
  type CommonPrototypeScreenProps,
  type CommonAuthState,
  type Feedback,
  AuthDivider,
  AuthSurface,
  InlineFeedback,
} from "@auth/AuthSurface"
import { showPreviewControls } from "@auth/authNavigation"

// Prototype-only logins for checking each organization role and each login
// failure. Never production credentials; the picker that fills them is a
// temporary review aid, not part of the designed login screen.
const DEMO_PASSWORD = "ecoya"
type DemoAccount = { email: string; role: CommonPreviewRole; plan: CommonPreviewPlan; seat?: "view"; label: string }
const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: "ecoya@ecoya.kr", role: "owner", plan: "paid", label: "Owner" },
  { email: "admin@ecoya.kr", role: "admin", plan: "paid", label: "Admin" },
  { email: "member@ecoya.kr", role: "member", plan: "paid", label: "Member · 사용 권한" },
  { email: "view@ecoya.kr", role: "member", plan: "paid", seat: "view", label: "Member · View 권한만" },
]
const DEMO_PLAN_ACCOUNTS: DemoAccount[] = [
  { email: "paid@ecoya.kr", role: "owner", plan: "paid", label: "유료 구독 중" },
  { email: "trial@ecoya.kr", role: "owner", plan: "trial", label: "무료 체험 중" },
  { email: "expired@ecoya.kr", role: "owner", plan: "expired", label: "무료 체험 종료" },
]
const DEMO_ERROR_ACCOUNTS: Array<{ email: string; password?: string; state: CommonAuthState; label: string }> = [
  { email: "ecoya@ecoya.kr", password: "wrong-password", state: "rejected", label: "비밀번호 오류" },
  { email: "noorg@ecoya.kr", state: "no-organization", label: "조직 없음" },
  { email: "pending@ecoya.kr", state: "pending-approval", label: "조직 승인 대기" },
  { email: "locked@ecoya.kr", state: "rate-limited", label: "로그인 시도 제한" },
  { email: "offline@ecoya.kr", state: "network-error", label: "네트워크 오류" },
  { email: "error@ecoya.kr", state: "page-error", label: "계정·조직 조회 오류" },
]

export function CommonLoginPrototype({
  onNavigate,
  onProductLanding,
  initialProduct,
  loginNotice,
}: CommonPrototypeScreenProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [state, setState] = useState<CommonAuthState>("idle")
  const [signedInAccount, setSignedInAccount] = useState<DemoAccount>(DEMO_ACCOUNTS[0])
  const [demoOpen, setDemoOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const fieldErrors = {
    email: authFieldError(email, "이메일", { email: true }),
    password: authFieldError(password, "비밀번호"),
  }

  const stateFeedback: Partial<Record<CommonAuthState, Feedback>> = {
    "network-error": {
      tone: "error",
      title: "연결하지 못했습니다",
      description:
        "네트워크 연결을 확인한 뒤 다시 로그인해 주세요. 입력한 이메일은 유지됩니다.",
    },
    "page-error": {
      tone: "error",
      title: "계정과 조직 정보를 불러오지 못했습니다",
      description:
        "일시적인 오류입니다. 조직이 없는 상태가 아니므로 새로 가입하지 마세요. 잠시 후 다시 확인해 주세요.",
    },
    "rate-limited": {
      tone: "warning",
      title: "로그인 시도가 너무 많습니다",
      description:
        "잠시 후 다시 시도해 주세요. 비밀번호가 기억나지 않으면 비밀번호 찾기를 이용하세요.",
    },
    rejected: {
      tone: "error",
      title: "로그인 정보를 확인해주세요",
      description:
        "이메일 또는 비밀번호가 올바르지 않습니다. 비밀번호를 다시 입력하거나 비밀번호 찾기를 이용해주세요.",
    },
    "provider-error": {
      tone: "error",
      title: "인증 공급자에 연결하지 못했습니다",
      description: "잠시 후 다시 시도하거나 이메일 로그인을 사용해주세요.",
    },
    "no-organization": {
      tone: "warning",
      title: "연결된 조직이 없습니다",
      description: "조직 초대를 확인하거나 새 조직 생성을 요청해주세요.",
    },
    "pending-approval": {
      tone: "info",
      title: "조직 승인을 기다리고 있습니다",
      description: "계정 인증은 완료됐지만 제품 업무 화면은 승인 후 열립니다.",
    },
    "session-expired": {
      tone: "warning",
      title: "세션이 만료되었습니다",
      description: "보안을 위해 다시 로그인해주세요.",
    },
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (state === "submitting") return
    setSubmitted(true)
    const firstError = Object.entries(fieldErrors).find(([, error]) => error)
    if (firstError) {
      ;(event.currentTarget as HTMLFormElement)
        .querySelector<HTMLInputElement>(`[name="${firstError[0]}"]`)
        ?.focus()
      return
    }
    setSubmitted(false)
    const signInEmail = email.trim().toLowerCase()
    const demoError =
      password === DEMO_PASSWORD
        ? DEMO_ERROR_ACCOUNTS.find((account) => !account.password && account.email === signInEmail)
        : undefined
    if (demoError) {
      setPassword("")
      setState(demoError.state)
      return
    }
    const account =
      password === DEMO_PASSWORD
        ? [...DEMO_ACCOUNTS, ...DEMO_PLAN_ACCOUNTS].find((item) => item.email === signInEmail)
        : undefined
    if (!account) {
      setState("rejected")
      return
    }

    // Account, organization and product access are one server-owned landing
    // decision. Keep the form out of the way while that decision completes so
    // the user cannot submit the credentials again.
    setState("submitting")
    window.setTimeout(() => {
      if (initialProduct && onProductLanding) {
        onProductLanding(initialProduct, account.role, { plan: account.plan, seat: account.seat })
        return
      }
      setPassword("")
      setSignedInAccount(account)
      setState("authenticated")
    }, 350)
  }

  return (
    <AuthSurface
      variant="login"
      title={
        state === "authenticated" ? "사용할 제품을 선택해 주세요" : "로그인"
      }
      titleAside={
        state === "authenticated" ? undefined : (
      <Popover open={demoOpen} onOpenChange={setDemoOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1 rounded-full border-dashed px-2.5 text-xs"
          >
            <UserRound /> 임시 데모 계정
          </Button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="end" className="w-80 gap-3 p-3">
          <div className="rounded-md border border-dashed border-[var(--surface-border)] bg-[var(--surface-muted-background)] px-3 py-2 text-xs leading-5 text-muted-foreground">
            <strong className="font-semibold text-foreground">확인용 임시 팝업</strong>
            <br />
            프로토타입 확인을 위해서만 있는 창이며 실제 로그인 화면 디자인에는 포함되지 않습니다. 계정을 고르면 아이디·비밀번호가 채워지고, 로그인을 누르면 해당 역할·구독 상태 또는 오류로 이어집니다. 화면 권한은 이 계정으로만 바꿀 수 있습니다.
          </div>
          {[
            {
              title: "역할별 로그인",
              items: DEMO_ACCOUNTS.map((account) => ({
                key: account.email,
                label: account.label,
                email: account.email,
                password: DEMO_PASSWORD,
              })),
            },
            {
              title: "구독 상태 (Owner)",
              items: DEMO_PLAN_ACCOUNTS.map((account) => ({
                key: account.email,
                label: account.label,
                email: account.email,
                password: DEMO_PASSWORD,
              })),
            },
            {
              title: "오류 확인",
              items: DEMO_ERROR_ACCOUNTS.map((account) => ({
                key: account.state,
                label: account.label,
                email: account.email,
                password: account.password ?? DEMO_PASSWORD,
              })),
            },
          ].map((group) => (
            <div key={group.title}>
              <div className="px-1 pb-1 text-[11px] font-semibold text-muted-foreground">{group.title}</div>
              {group.items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-[var(--surface-muted-background)]"
                  onClick={() => {
                    setEmail(item.email)
                    setPassword(item.password)
                    setSubmitted(false)
                    setState("idle")
                    setDemoOpen(false)
                  }}
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="truncate text-xs text-muted-foreground">{item.email}</span>
                </button>
              ))}
            </div>
          ))}
        </PopoverContent>
      </Popover>
        )
      }
      footer={
        state === "idle" ||
        state === "rejected" ||
        state === "provider-error" ||
        state === "network-error" ||
        state === "page-error" ||
        state === "rate-limited" ||
        state === "no-organization" ||
        state === "pending-approval" ||
        state === "session-expired" ? (
          <p className="flex items-center justify-center gap-2 text-[15px] leading-[22px] text-[var(--color-gray-5)]">
            계정이 없나요?
            <Button
              className="h-10 p-0 text-[15px] leading-[22px]"
              variant="link"
              onClick={() => onNavigate?.("signup")}
            >
              회원가입
            </Button>
          </p>
        ) : undefined
      }
    >
      {state === "submitting" ? (
        <div
          className="flex flex-col items-center gap-3 py-8 text-center"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-7 animate-spin text-primary" aria-hidden />
          <p className="font-semibold">로그인 처리 중</p>
          <p className="text-sm text-muted-foreground">잠시만 기다려 주세요.</p>
        </div>
      ) : state === "authenticated" ? (
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            계정에 연결된 제품에서 계속할 곳을 선택하세요.
          </p>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Trade OS</CardTitle>
              <CardDescription>거래와 문서 업무를 관리합니다.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                className="w-full"
                type="button"
                onClick={() => onProductLanding?.("erp", signedInAccount.role, { plan: signedInAccount.plan, seat: signedInAccount.seat })}
              >
                <Building2 /> Trade OS 열기
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">SNAP</CardTitle>
              <CardDescription>문서와 현장 업무를 관리합니다.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                className="w-full"
                type="button"
                variant="outline"
                onClick={() => onProductLanding?.("snap", signedInAccount.role, { plan: signedInAccount.plan, seat: signedInAccount.seat })}
              >
                <MapPin /> SNAP 열기
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <form noValidate className="flex flex-col gap-8" onSubmit={submit}>
          <div className="flex flex-col gap-[18px]">
            {loginNotice && (
              <div
                role="status"
                className="flex items-start gap-2.5 rounded-lg border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-6 text-foreground"
              >
                <AlertCircle
                  className="mt-0.5 size-5 shrink-0 text-primary"
                  aria-hidden
                />
                <p>{loginNotice}</p>
              </div>
            )}
            {stateFeedback[state] ? (
              <InlineFeedback feedback={stateFeedback[state]!} />
            ) : null}
            {state === "page-error" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setState("idle")}
              >
                <RefreshCw /> 로그인 화면으로 돌아가기
              </Button>
            )}
            <AuthInputField
              name="email"
              label="이메일"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={setEmail}
              error={fieldErrors.email}
              submitted={submitted}
            />
            <div className="flex flex-col gap-2">
              <AuthInputField
                name="password"
                label="비밀번호"
                password
                autoComplete="current-password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={setPassword}
                error={fieldErrors.password}
                submitted={submitted}
              />
              <div className="flex justify-end">
                <Button
                  className="h-6 p-0 text-[11px] leading-4"
                  type="button"
                  variant="link"
                  onClick={() => onNavigate?.("password-recovery")}
                >
                  비밀번호 찾기
                </Button>
              </div>
            </div>
            <Button type="submit" className={authActionButtonClass}>
              로그인
            </Button>
          </div>
          <AuthDivider />
          <div className="grid gap-2.5">
            {[
              { name: "Google", icon: googleIcon },
              { name: "Apple", icon: appleIcon },
            ].map((provider) => (
              <Button
                key={provider.name}
                type="button"
                variant="outline"
                className={authSocialButtonClass}
                onClick={() => {
                  setPassword("")
                  setState("provider-error")
                }}
              >
                <provider.icon aria-hidden="true" />
                {provider.name}로 계속하기
              </Button>
            ))}
            {showPreviewControls() && (
              <Select
                value={state}
                onValueChange={(value) =>
                  value && (setPassword(""), setState(value as CommonAuthState))
                }
              >
                <SelectTrigger aria-label="로그인 데모 상태">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="idle">기본 상태</SelectItem>
                    <SelectItem value="rejected">인증 실패</SelectItem>
                    <SelectItem value="provider-error">
                      소셜 로그인 오류
                    </SelectItem>
                    <SelectItem value="network-error">네트워크 오류</SelectItem>
                    <SelectItem value="page-error">
                      계정·조직 조회 오류
                    </SelectItem>
                    <SelectItem value="rate-limited">
                      로그인 시도 제한
                    </SelectItem>
                    <SelectItem value="no-organization">조직 없음</SelectItem>
                    <SelectItem value="pending-approval">승인 대기</SelectItem>
                    <SelectItem value="session-expired">세션 만료</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>
        </form>
      )}
    </AuthSurface>
  )
}

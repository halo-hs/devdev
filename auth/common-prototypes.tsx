import { useMemo, useState, type FormEvent, type ReactNode } from "react"
import googleIcon from "@ecoya/design-system/assets/icons/icon-google.svg"
import appleIcon from "@ecoya/design-system/assets/icons/icon-apple.svg"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  CreditCard,
  Eye,
  EyeOff,
  FileLock2,
  KeyRound,
  Languages,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  PackageCheck,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  UserCheck,
  UserPlus,
  UserRoundCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@shared/components/ui/badge"
import { Button } from "@shared/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@shared/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog"
import { Input } from "@shared/components/ui/input"
import { Progress } from "@shared/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs"
import { AuthInputField } from "@auth/components/auth-input-field"
import {
  authFieldError,
  authGridColumns,
  type AuthLayoutVariant,
} from "@auth/lib/auth-validation"
import { cn } from "@shared/lib/utils"
import {
  AccountGuide,
  CommonPublicFooter,
} from "@auth/components/common-public-layout"

// State inspection is opt-in locally and never exposed by a production build.
function showPreviewControls() {
  return (
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get("preview") === "1"
  )
}

export type CommonScreenKey =
  | "login"
  | "signup"
  | "free-trial"
  | "password-recovery"
  | "terms"
  | "privacy"
  | "settings"
  | "organizations"
  | "members"

/** @deprecated Use CommonScreenKey for integration routing. */
export type CommonPrototypeRoute = CommonScreenKey

export type CommonAuthState =
  | "idle"
  | "submitting"
  | "authenticated"
  | "rejected"
  | "no-organization"
  | "pending-approval"
  | "provider-error"
  | "session-expired"
  | "network-error"
  | "page-error"
  | "rate-limited"

export type CommonInviteState =
  | "invited"
  | "accepted"
  | "pending_approval"
  | "active"
  | "revoked"
  | "expired"
  | "rejected"

export type CommonProduct = "erp" | "snap"

export interface CommonProductEntitlement {
  product: CommonProduct
  enabled: boolean
  status: "active" | "trial" | "past_due" | "not_purchased"
  role?: string
}

export interface CommonOrganization {
  id: string
  name: string
  membership: "active" | "pending" | "inactive"
  entitlements: CommonProductEntitlement[]
  isCurrent?: boolean
}

export interface CommonPrototypeScreenProps {
  onNavigate?: (route: CommonScreenKey) => void
  onProductLanding?: (product: CommonProduct) => void
  initialProduct?: CommonProduct
  loginNotice?: string
}

type Feedback = {
  tone: "success" | "warning" | "error" | "info"
  title: string
  description: string
}

const toneClasses: Record<Feedback["tone"], string> = {
  success: "border-border bg-muted/60",
  warning: "border-border bg-muted/60",
  error: "border-destructive/30 bg-destructive/5",
  info: "border-border bg-muted/60",
}

const feedbackIcons: Record<Feedback["tone"], typeof CheckCircle2> = {
  success: CheckCircle2,
  warning: AlertCircle,
  error: AlertCircle,
  info: CircleHelp,
}

const defaultOrganizations: CommonOrganization[] = [
  {
    id: "org-hanbit",
    name: "한빛무역",
    membership: "active",
    isCurrent: true,
    entitlements: [
      { product: "erp", enabled: true, status: "active", role: "owner" },
      { product: "snap", enabled: true, status: "trial", role: "manager" },
    ],
  },
  {
    id: "org-ecoya-lab",
    name: "ECOYA Pilot Lab",
    membership: "active",
    entitlements: [
      { product: "erp", enabled: true, status: "trial", role: "operator" },
      { product: "snap", enabled: false, status: "not_purchased" },
    ],
  },
  {
    id: "org-busan",
    name: "부산 현장 운영팀",
    membership: "pending",
    entitlements: [
      { product: "erp", enabled: false, status: "not_purchased" },
      { product: "snap", enabled: true, status: "active", role: "worker" },
    ],
  },
]

type SettingsItem = {
  id: string
  label: string
  icon: LucideIcon
  product: CommonProduct | null
}

type SettingsGroup = {
  label: string
  items: SettingsItem[]
}

const settingsGroups: SettingsGroup[] = [
  {
    label: "설정 시작",
    items: [
      { id: "general", label: "일반", icon: UserRoundCog, product: null },
    ],
  },
  {
    label: "조직",
    items: [
      {
        id: "organization",
        label: "조직 관리",
        icon: Building2,
        product: null,
      },
      { id: "data", label: "데이터 관리", icon: FileLock2, product: "snap" },
    ],
  },
  {
    label: "알림",
    items: [
      { id: "erp-alerts", label: "ERP 알림", icon: Mail, product: "erp" },
    ],
  },
  {
    label: "ERP",
    items: [
      {
        id: "inbound",
        label: "이메일로 문서 받기",
        icon: Mail,
        product: "erp",
      },
      {
        id: "counterparty-import",
        label: "거래처 일괄 등록",
        icon: Users,
        product: "erp",
      },
      {
        id: "deal-import",
        label: "거래 일괄 등록",
        icon: PackageCheck,
        product: "erp",
      },
      {
        id: "aliases",
        label: "거래처 별칭 학습",
        icon: Sparkles,
        product: "erp",
      },
    ],
  },
  {
    label: "SNAP",
    items: [
      { id: "branding", label: "브랜딩", icon: Sparkles, product: "snap" },
      { id: "localization", label: "지역화", icon: Languages, product: "snap" },
      { id: "field-ops", label: "현장 운영", icon: MapPin, product: "snap" },
    ],
  },
  {
    label: "사용량 및 청구",
    items: [
      {
        id: "erp-usage",
        label: "ERP AI 사용량",
        icon: Sparkles,
        product: "erp",
      },
      {
        id: "erp-billing",
        label: "ERP 결제·구독",
        icon: CreditCard,
        product: "erp",
      },
      {
        id: "snap-billing",
        label: "SNAP 크레딧·결제",
        icon: CreditCard,
        product: "snap",
      },
    ],
  },
]

function CommonBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-9 items-center justify-center rounded-md border bg-background">
        <Sparkles aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <div className="font-semibold">ECOYA</div>
        {!compact ? (
          <div className="text-xs text-muted-foreground">ECOYA Platform</div>
        ) : null}
      </div>
    </div>
  )
}

function AuthSurface({
  variant,
  title,
  description,
  children,
  footer,
}: {
  variant: AuthLayoutVariant
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <main
      data-auth-layout={variant}
      className={cn(
        "auth-surface grid w-full flex-1 grid-cols-1",
        authGridColumns[variant]
      )}
    >
      <AccountGuide variant={variant} />
      <div className="order-1 flex min-w-0 flex-col bg-background lg:order-none">
        <section
          aria-label={title}
          className={cn(
            "flex min-w-0 flex-1 items-center justify-center px-5 py-10 sm:px-10 lg:px-16 lg:py-16",
            variant !== "recovery" &&
              "items-start py-8 sm:py-[60px] lg:py-[60px]"
          )}
        >
          <div
            className={cn(
              "w-full max-w-md",
              variant !== "recovery" && "max-w-[520px]",
              variant === "signup" && "flex min-h-[720px] flex-col"
            )}
          >
            <h1
              className={cn(
                "text-2xl font-semibold tracking-tight sm:text-3xl",
                variant !== "recovery" &&
                  "text-center text-[26px] leading-[39px] font-bold sm:text-[26px]"
              )}
            >
              {title}
            </h1>
            {description && (
              <p
                className={cn(
                  "mt-3 text-base leading-7 text-muted-foreground",
                  variant === "signup" &&
                    "mt-2 min-h-6 text-center text-sm leading-6",
                  variant === "login" &&
                    "mt-8 text-center text-[17px] leading-6"
                )}
              >
                {description}
              </p>
            )}
            <div
              className={cn(
                "mt-8",
                variant === "signup" && "mt-8 flex flex-1 flex-col",
                variant === "login" && "mt-10"
              )}
            >
              {children}
            </div>
            {footer ? (
              <div
                className={cn(
                  "mt-7 flex flex-col gap-3 border-t pt-6",
                  variant === "login" && "mt-12 border-0 pt-0"
                )}
              >
                {footer}
              </div>
            ) : null}
          </div>
        </section>
        <CommonPublicFooter compact />
      </div>
    </main>
  )
}

function FormField({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {error ? (
        <span className="text-xs text-destructive">{error}</span>
      ) : hint ? (
        <span className="text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  )
}

function InlineFeedback({ feedback }: { feedback: Feedback }) {
  const Icon = feedbackIcons[feedback.tone]
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border p-3",
        toneClasses[feedback.tone]
      )}
      role={feedback.tone === "error" ? "alert" : "status"}
    >
      <Icon className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-base font-semibold">{feedback.title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {feedback.description}
        </p>
      </div>
    </div>
  )
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete = "current-password",
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoComplete?: "current-password" | "new-password"
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input
        className="pr-10"
        type={visible ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
      />
      <Button
        className="absolute top-0 right-0"
        type="button"
        variant="ghost"
        size="icon"
        aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff /> : <Eye />}
      </Button>
    </div>
  )
}

export function CommonLoginPrototype({
  onNavigate,
  onProductLanding,
  initialProduct,
  loginNotice,
}: CommonPrototypeScreenProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [state, setState] = useState<CommonAuthState>("idle")
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
    authenticated: {
      tone: "success",
      title: "조직과 제품 권한을 확인했습니다",
      description: "한빛무역에서 사용할 제품을 선택해주세요.",
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
    const valid =
      email.trim().toLowerCase() === "ecoya@ecoya.kr" && password === "ecoya"
    setPassword("")
    setState(valid ? "authenticated" : "rejected")
  }

  return (
    <AuthSurface
      variant="login"
      title="로그인"
      footer={
        <>
          <p className="text-center text-sm text-muted-foreground">
            계정이 없나요?{" "}
            <Button
              className="h-auto p-0"
              variant="link"
              onClick={() => onNavigate?.("signup")}
            >
              회원가입
            </Button>
          </p>
        </>
      }
    >
      <form noValidate className="flex flex-col gap-4" onSubmit={submit}>
        {loginNotice && state !== "authenticated" && (
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
        {showPreviewControls() && (
          <p className="text-xs text-muted-foreground">
            데모 계정: ecoya@ecoya.kr / ecoya
          </p>
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
          value={email}
          onChange={setEmail}
          error={fieldErrors.email}
          submitted={submitted}
        />
        <AuthInputField
          name="password"
          label="비밀번호"
          password
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
          submitted={submitted}
        />
        <div className="flex justify-end">
          <Button
            className="h-auto p-0"
            type="button"
            variant="link"
            onClick={() => onNavigate?.("password-recovery")}
          >
            비밀번호 찾기
          </Button>
        </div>
        {state === "authenticated" ? (
          <div
            className={
              initialProduct ? "grid gap-2" : "grid gap-2 sm:grid-cols-2"
            }
          >
            {initialProduct !== "snap" && (
              <Button type="button" onClick={() => onProductLanding?.("erp")}>
                <Building2 /> ERP 열기
              </Button>
            )}
            {initialProduct !== "erp" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onProductLanding?.("snap")}
              >
                <MapPin /> SNAP 열기
              </Button>
            )}
          </div>
        ) : (
          <Button type="submit" disabled={state === "submitting"}>
            {state === "submitting" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <ArrowRight />
            )}
            {state === "submitting" ? "조직 확인 중" : "로그인"}
          </Button>
        )}
        <div className="my-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" aria-hidden="true" />
          또는
          <span className="h-px flex-1 bg-border" aria-hidden="true" />
        </div>
        <div className="grid gap-2">
          {[
            { name: "Google", icon: googleIcon },
            { name: "Apple", icon: appleIcon },
          ].map((provider) => (
            <Button
              key={provider.name}
              type="button"
              variant="outline"
              className="h-10 w-full"
              onClick={() => {
                setPassword("")
                setState("provider-error")
              }}
            >
              <provider.icon aria-hidden="true" className="size-4" />
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
                  <SelectItem value="rate-limited">로그인 시도 제한</SelectItem>
                  <SelectItem value="no-organization">조직 없음</SelectItem>
                  <SelectItem value="pending-approval">승인 대기</SelectItem>
                  <SelectItem value="session-expired">세션 만료</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </div>
      </form>
    </AuthSurface>
  )
}

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

type RecoveryStep = "request" | "sent" | "reset" | "expired" | "complete"

export function CommonPasswordRecoveryPrototype({
  onNavigate,
  initialProduct = "erp",
}: CommonPrototypeScreenProps) {
  const minimumLength = initialProduct === "erp" ? 6 : 8
  const [step, setStep] = useState<RecoveryStep>("request")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")

  return (
    <AuthSurface
      variant="recovery"
      title="비밀번호 복구"
      description="이메일로 받은 링크를 열어 새 비밀번호를 설정하세요. 링크는 30분 동안 한 번 사용할 수 있습니다."
      footer={
        <Button variant="link" onClick={() => onNavigate?.("login")}>
          <ArrowLeft /> 로그인으로 돌아가기
        </Button>
      }
    >
      {step === "request" ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            setStep("sent")
          }}
        >
          <FormField label="이메일">
            <Input
              type="email"
              value={email}
              placeholder="name@company.com"
              onChange={(event) => setEmail(event.target.value)}
            />
          </FormField>
          <Button type="submit" disabled={!email}>
            <Mail /> 복구 링크 보내기
          </Button>
        </form>
      ) : null}
      {step === "sent" ? (
        <div className="flex flex-col gap-4">
          <InlineFeedback
            feedback={{
              tone: "success",
              title: "이메일을 확인해주세요",
              description:
                "등록된 계정이 있다면 입력하신 이메일로 복구 링크를 보냈습니다. 받은편지함과 스팸함을 확인해주세요.",
            }}
          />
          <div className="flex items-center gap-3 rounded-md border p-3 text-sm">
            <Clock3 />
            <span>링크는 30분 동안 한 번 사용할 수 있습니다.</span>
          </div>
          {showPreviewControls() && (
            <Button onClick={() => setStep("reset")}>
              복구 링크 데모 열기 <ArrowRight />
            </Button>
          )}
          <Button variant="outline" onClick={() => setStep("request")}>
            <RefreshCw /> 다른 이메일로 재발급
          </Button>
        </div>
      ) : null}
      {step === "reset" ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (password === confirm && password.length >= minimumLength)
              setStep("complete")
          }}
        >
          <FormField
            label="새 비밀번호"
            hint={`${minimumLength}자 이상 입력해주세요`}
          >
            <PasswordInput
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
            />
          </FormField>
          <FormField
            label="새 비밀번호 확인"
            error={
              confirm && password !== confirm
                ? "비밀번호가 일치하지 않습니다."
                : undefined
            }
          >
            <PasswordInput
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
            />
          </FormField>
          <Button
            type="submit"
            disabled={password.length < minimumLength || password !== confirm}
          >
            <KeyRound /> 비밀번호 변경
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep("expired")}
          >
            만료 링크 상태 보기
          </Button>
        </form>
      ) : null}
      {step === "expired" ? (
        <div className="flex flex-col gap-4">
          <InlineFeedback
            feedback={{
              tone: "error",
              title: "복구 링크가 만료됐습니다",
              description:
                "이미 사용했거나 새 링크 발급으로 폐기된 링크입니다.",
            }}
          />
          <Button onClick={() => setStep("request")}>
            <RefreshCw /> 새 링크 요청
          </Button>
        </div>
      ) : null}
      {step === "complete" ? (
        <div className="flex flex-col gap-4">
          <InlineFeedback
            feedback={{
              tone: "success",
              title: "비밀번호를 변경했습니다",
              description:
                "보안을 위해 기존 로그인 세션을 모두 종료했습니다. 새 비밀번호로 다시 로그인해주세요.",
            }}
          />
          <Button onClick={() => onNavigate?.("login")}>
            <LogOut /> 로그인 화면으로 이동
          </Button>
        </div>
      ) : null}
    </AuthSurface>
  )
}

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

function SettingsDetail({ active }: { active: string }) {
  const details: Record<
    string,
    { title: string; description: string; body: ReactNode }
  > = {
    general: {
      title: "일반",
      description:
        "공통 계정 수준의 기본 정보를 확인합니다. 제품별 업무 시간대와 언어는 각 제품 설정에서 관리합니다.",
      body: (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="이름">
            <Input defaultValue="조민영" />
          </FormField>
          <FormField label="로그인 이메일">
            <Input defaultValue="minji@hanbit-trade.com" disabled />
          </FormField>
          <FormField label="계정 언어">
            <Select defaultValue="ko">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ko">한국어</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="보안">
            <Button variant="outline">
              <KeyRound /> 비밀번호 변경
            </Button>
          </FormField>
        </div>
      ),
    },
    organization: {
      title: "조직 관리",
      description:
        "현재 조직과 구매 제품을 확인하고 멤버·초대 화면으로 이동합니다.",
      body: (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-4">
            <div>
              <p className="font-medium">한빛무역</p>
              <p className="mt-1 text-sm text-muted-foreground">
                ERP · SNAP 사용 중
              </p>
            </div>
            <Button variant="outline">
              <Users /> 멤버 관리
            </Button>
          </div>
        </div>
      ),
    },
    data: {
      title: "데이터 관리",
      description:
        "SNAP의 데이터 거주 지역, 저장량, 보존·파기와 조직 내보내기를 관리합니다.",
      body: (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="데이터 거주 지역">
            <Select defaultValue="kr">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="kr">대한민국</SelectItem>
                  <SelectItem value="sg">싱가포르</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="저장 사용량">
            <div className="rounded-md border p-3">
              <div className="flex justify-between text-sm">
                <span>12.4 GB</span>
                <span>50 GB</span>
              </div>
              <Progress className="mt-2" value={25} />
            </div>
          </FormField>
        </div>
      ),
    },
  }
  const detail = details[active] ?? {
    title:
      settingsGroups
        .flatMap((group) => group.items)
        .find((item) => item.id === active)?.label ?? "설정",
    description: "해당 제품이 소유한 설정 화면으로 연결됩니다.",
    body: (
      <InlineFeedback
        feedback={{
          tone: "info",
          title: "제품 설정",
          description:
            "필드, 저장 방식, 역할과 오류 처리는 ERP 또는 SNAP 제품 계약을 사용합니다.",
        }}
      />
    ),
  }
  return (
    <section className="min-w-0">
      <div className="pb-5">
        <h2 className="text-xl font-semibold">{detail.title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
          {detail.description}
        </p>
      </div>
      <div className="py-6">{detail.body}</div>
      <div className="flex justify-end border-t pt-5">
        <Button>
          <Check /> 변경사항 저장
        </Button>
      </div>
    </section>
  )
}

export function CommonSettingsHubPrototype({
  onNavigate,
}: CommonPrototypeScreenProps) {
  const [active, setActive] = useState("general")
  const [erpEnabled, setErpEnabled] = useState(true)
  const [snapEnabled, setSnapEnabled] = useState(true)
  const [query, setQuery] = useState("")

  const visibleGroups = settingsGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          (!item.product ||
            (item.product === "erp" && erpEnabled) ||
            (item.product === "snap" && snapEnabled)) &&
          item.label.toLowerCase().includes(query.toLowerCase())
      ),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <main className="min-h-svh bg-background">
      <header className="border-b px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <CommonBrand compact />
          <div className="flex gap-2">
            <Badge variant="outline">한빛무역</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate?.("organizations")}
            >
              <Building2 /> 조직 전환
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid min-h-[calc(100svh-65px)] max-w-7xl md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-b bg-muted/30 p-4 md:border-r md:border-b-0">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">설정</h1>
            <Button size="icon" variant="ghost" aria-label="설정 닫기">
              <X />
            </Button>
          </div>
          <div className="relative mt-4">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              className="pl-9"
              value={query}
              placeholder="설정 검색"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="mt-4 flex flex-col gap-5">
            {visibleGroups.map((group) => (
              <div key={group.label}>
                <div className="mb-1 px-2 text-xs font-medium text-muted-foreground">
                  {group.label}
                </div>
                <nav className="flex flex-col gap-0.5" aria-label={group.label}>
                  {group.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <Button
                        key={item.id}
                        className="justify-start"
                        variant={active === item.id ? "secondary" : "ghost"}
                        onClick={() => setActive(item.id)}
                      >
                        <Icon />
                        {item.label}
                      </Button>
                    )
                  })}
                </nav>
              </div>
            ))}
          </div>
        </aside>
        <div className="min-w-0 px-4 py-6 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  구매 제품 메뉴 미리보기
                </p>
                <p className="font-medium">
                  Entitlement에 따라 설정 메뉴가 바뀝니다.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={erpEnabled ? "secondary" : "outline"}
                  onClick={() => setErpEnabled((value) => !value)}
                >
                  ERP
                </Button>
                <Button
                  size="sm"
                  variant={snapEnabled ? "secondary" : "outline"}
                  onClick={() => setSnapEnabled((value) => !value)}
                >
                  SNAP
                </Button>
              </div>
            </div>
            <SettingsDetail active={active} />
          </div>
        </div>
      </div>
    </main>
  )
}

export function CommonOrganizationContextPrototype({
  onNavigate,
  onProductLanding,
}: CommonPrototypeScreenProps) {
  const [organizations, setOrganizations] = useState(defaultOrganizations)
  const [switching, setSwitching] = useState<string | null>(null)
  const [mode, setMode] = useState<"normal" | "none" | "inactive">("normal")
  const current = organizations.find((organization) => organization.isCurrent)

  const switchOrganization = (id: string) => {
    setSwitching(id)
    window.setTimeout(() => {
      setOrganizations((items) =>
        items.map((item) => ({ ...item, isCurrent: item.id === id }))
      )
      setSwitching(null)
    }, 650)
  }

  return (
    <main className="min-h-svh bg-muted/20 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <CommonBrand />
          <Button variant="outline" onClick={() => onNavigate?.("settings")}>
            <Settings2 /> 설정
          </Button>
        </header>
        <div className="flex flex-col gap-2">
          <Badge className="w-fit" variant="outline">
            CS-07 조직 컨텍스트
          </Badge>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            업무를 진행할 조직 선택
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            조직을 전환하면 제품 메뉴, 역할, 사용량과 데이터 범위를 서버
            기준으로 다시 불러옵니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={mode === "normal" ? "secondary" : "outline"}
            onClick={() => setMode("normal")}
          >
            복수 조직
          </Button>
          <Button
            size="sm"
            variant={mode === "none" ? "secondary" : "outline"}
            onClick={() => setMode("none")}
          >
            조직 없음
          </Button>
          <Button
            size="sm"
            variant={mode === "inactive" ? "secondary" : "outline"}
            onClick={() => setMode("inactive")}
          >
            비활성 조직
          </Button>
        </div>

        {mode === "none" ? (
          <Card>
            <CardHeader>
              <CardTitle>연결된 조직이 없습니다</CardTitle>
              <CardDescription>
                초대 이메일을 확인하거나 조직 생성을 요청해주세요.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button>
                <UserPlus /> 조직 초대 확인
              </Button>
            </CardFooter>
          </Card>
        ) : null}
        {mode === "inactive" ? (
          <InlineFeedback
            feedback={{
              tone: "error",
              title: "현재 조직을 사용할 수 없습니다",
              description:
                "조직이 비활성화됐거나 제품 구독이 종료되었습니다. 다른 조직을 선택하거나 Owner에게 문의해주세요.",
            }}
          />
        ) : null}
        {mode === "normal" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {organizations.map((organization) => (
              <Card
                key={organization.id}
                className={cn(organization.isCurrent && "ring-1 ring-ring")}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{organization.name}</CardTitle>
                      <CardDescription className="mt-1">
                        Membership · {organization.membership}
                      </CardDescription>
                    </div>
                    {organization.isCurrent ? (
                      <Badge>현재 조직</Badge>
                    ) : (
                      <Badge variant="outline">전환 가능</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {organization.entitlements.map((entitlement) => (
                    <div
                      key={entitlement.product}
                      className="flex items-center justify-between gap-3 rounded-md border p-3"
                    >
                      <div className="flex items-center gap-2">
                        {entitlement.product === "erp" ? (
                          <Building2 />
                        ) : (
                          <MapPin />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {entitlement.product.toUpperCase()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entitlement.enabled
                              ? `${entitlement.role} · ${entitlement.status}`
                              : "구매하지 않음"}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={entitlement.enabled ? "secondary" : "outline"}
                      >
                        {entitlement.enabled ? "사용 가능" : "미구독"}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="justify-end gap-2">
                  {organization.isCurrent ? (
                    current?.entitlements
                      .filter((item) => item.enabled)
                      .map((item) => (
                        <Button
                          key={item.product}
                          size="sm"
                          variant={
                            item.product === "erp" ? "default" : "outline"
                          }
                          onClick={() => onProductLanding?.(item.product)}
                        >
                          {item.product.toUpperCase()} 열기
                        </Button>
                      ))
                  ) : (
                    <Button
                      disabled={
                        organization.membership !== "active" ||
                        switching !== null
                      }
                      onClick={() => switchOrganization(organization.id)}
                    >
                      {switching === organization.id ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <RefreshCw />
                      )}{" "}
                      조직 전환
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : null}
        {switching ? (
          <InlineFeedback
            feedback={{
              tone: "info",
              title: "조직 컨텍스트를 갱신하고 있습니다",
              description:
                "이전 조직의 제품 캐시를 비우고 새 조직의 역할과 데이터를 다시 불러옵니다.",
            }}
          />
        ) : null}
      </div>
    </main>
  )
}

type MemberRow = {
  id: number
  name: string
  email: string
  membership: "active" | "pending_approval"
  erpRole: string
  snapRole: string
}
type InviteRow = {
  id: number
  email: string
  product: CommonProduct
  role: string
  state: CommonInviteState
  sentAt: string
}

const inviteLabels: Record<CommonInviteState, string> = {
  invited: "초대됨",
  accepted: "수락됨",
  pending_approval: "승인 대기",
  active: "활성",
  revoked: "취소됨",
  expired: "만료됨",
  rejected: "거절됨",
}

export function CommonMembersInvitesPrototype({
  onNavigate,
}: CommonPrototypeScreenProps) {
  const [members, setMembers] = useState<MemberRow[]>([
    {
      id: 1,
      name: "조민영",
      email: "minji@hanbit-trade.com",
      membership: "active",
      erpRole: "owner",
      snapRole: "manager",
    },
    {
      id: 2,
      name: "박서윤",
      email: "seoyun@hanbit-trade.com",
      membership: "active",
      erpRole: "operator",
      snapRole: "admin",
    },
    {
      id: 3,
      name: "김도현",
      email: "dohyun@hanbit-trade.com",
      membership: "pending_approval",
      erpRole: "—",
      snapRole: "worker",
    },
  ])
  const [invites, setInvites] = useState<InviteRow[]>([
    {
      id: 1,
      email: "worker@hanbit-trade.com",
      product: "snap",
      role: "worker",
      state: "pending_approval",
      sentAt: "2026.08.01 09:20",
    },
    {
      id: 2,
      email: "ops@hanbit-trade.com",
      product: "erp",
      role: "operator",
      state: "invited",
      sentAt: "2026.07.31 16:40",
    },
    {
      id: 3,
      email: "old@hanbit-trade.com",
      product: "snap",
      role: "customer_viewer",
      state: "expired",
      sentAt: "2026.07.20 11:05",
    },
  ])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteProduct, setInviteProduct] = useState<CommonProduct>("erp")
  const [inviteRole, setInviteRole] = useState("operator")
  const [query, setQuery] = useState("")
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const visibleMembers = useMemo(
    () =>
      members.filter((member) =>
        `${member.name} ${member.email}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [members, query]
  )

  const createInvite = () => {
    if (!inviteEmail) return
    if (
      invites.some(
        (invite) => invite.email === inviteEmail && invite.state === "invited"
      )
    ) {
      setFeedback({
        tone: "error",
        title: "진행 중인 초대가 있습니다",
        description: "기존 초대를 재발송하거나 취소한 뒤 다시 초대해주세요.",
      })
      setInviteOpen(false)
      return
    }
    setInvites((items) => [
      {
        id: Date.now(),
        email: inviteEmail,
        product: inviteProduct,
        role: inviteRole,
        state: "invited",
        sentAt: "방금 전",
      },
      ...items,
    ])
    setFeedback({
      tone: "success",
      title: "초대를 보냈습니다",
      description: `${inviteEmail}에서 조직·제품·역할을 확인한 뒤 수락할 수 있습니다.`,
    })
    setInviteEmail("")
    setInviteOpen(false)
  }

  return (
    <main className="min-h-svh bg-background">
      <header className="border-b px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <CommonBrand compact />
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate?.("settings")}
          >
            <ArrowLeft /> 설정
          </Button>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge className="mb-2" variant="outline">
              한빛무역
            </Badge>
            <h1 className="text-2xl font-semibold">멤버와 초대</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tenant membership과 ERP·SNAP 제품 역할을 서로 다른 축으로
              관리합니다.
            </p>
          </div>
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus /> 멤버 초대
          </Button>
        </div>
        {feedback ? <InlineFeedback feedback={feedback} /> : null}
        <Tabs defaultValue="members">
          <TabsList>
            <TabsTrigger value="members">멤버 {members.length}</TabsTrigger>
            <TabsTrigger value="invites">초대 {invites.length}</TabsTrigger>
          </TabsList>
          <TabsContent value="members" className="mt-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="relative min-w-0 flex-1 sm:max-w-sm">
                <Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={query}
                  placeholder="이름 또는 이메일 검색"
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <Badge variant="secondary">
                활성{" "}
                {
                  members.filter((member) => member.membership === "active")
                    .length
                }
                명
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>멤버</TableHead>
                    <TableHead>Membership</TableHead>
                    <TableHead>ERP 역할</TableHead>
                    <TableHead>SNAP 역할</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {member.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            member.membership === "active"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {member.membership === "active"
                            ? "활성"
                            : "승인 대기"}
                        </Badge>
                      </TableCell>
                      <TableCell>{member.erpRole}</TableCell>
                      <TableCell>{member.snapRole}</TableCell>
                      <TableCell className="text-right">
                        {member.membership === "pending_approval" ? (
                          <Button
                            size="xs"
                            onClick={() =>
                              setMembers((items) =>
                                items.map((item) =>
                                  item.id === member.id
                                    ? { ...item, membership: "active" }
                                    : item
                                )
                              )
                            }
                          >
                            <UserCheck /> 승인
                          </Button>
                        ) : (
                          <Button size="xs" variant="ghost">
                            관리 <ChevronRight />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="invites" className="mt-5">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>초대 이메일</TableHead>
                    <TableHead>제품 역할</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>발송</TableHead>
                    <TableHead className="text-right">다음 행동</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">
                        {invite.email}
                      </TableCell>
                      <TableCell>
                        {invite.product.toUpperCase()} · {invite.role}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            invite.state === "active" ? "secondary" : "outline"
                          }
                        >
                          {inviteLabels[invite.state]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {invite.sentAt}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {invite.state === "invited" ? (
                            <>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() =>
                                  setFeedback({
                                    tone: "success",
                                    title: "초대를 다시 보냈습니다",
                                    description:
                                      "새 링크 발급으로 이전 초대 링크는 폐기됩니다.",
                                  })
                                }
                              >
                                <RefreshCw /> 재발송
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() =>
                                  setInvites((items) =>
                                    items.map((item) =>
                                      item.id === invite.id
                                        ? { ...item, state: "revoked" }
                                        : item
                                    )
                                  )
                                }
                              >
                                취소
                              </Button>
                            </>
                          ) : null}
                          {invite.state === "pending_approval" ? (
                            <Button
                              size="xs"
                              onClick={() =>
                                setInvites((items) =>
                                  items.map((item) =>
                                    item.id === invite.id
                                      ? { ...item, state: "active" }
                                      : item
                                  )
                                )
                              }
                            >
                              <Check /> 활성화
                            </Button>
                          ) : null}
                          {invite.state === "expired" ? (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() =>
                                setInvites((items) =>
                                  items.map((item) =>
                                    item.id === invite.id
                                      ? {
                                          ...item,
                                          state: "invited",
                                          sentAt: "방금 전",
                                        }
                                      : item
                                  )
                                )
                              }
                            >
                              새 초대
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>멤버 초대</DialogTitle>
            <DialogDescription>
              초대 대상이 조직, 이메일과 제품 역할을 확인한 뒤 수락합니다. 제품
              역할은 서로 자동 변환되지 않습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <FormField label="이메일">
              <Input
                type="email"
                value={inviteEmail}
                placeholder="name@company.com"
                onChange={(event) => setInviteEmail(event.target.value)}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="제품">
                <Select
                  value={inviteProduct}
                  onValueChange={(value) => {
                    if (!value) return
                    setInviteProduct(value as CommonProduct)
                    setInviteRole(value === "erp" ? "operator" : "worker")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="erp">ERP</SelectItem>
                      <SelectItem value="snap">SNAP</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="제품 역할">
                <Select
                  value={inviteRole}
                  onValueChange={(value) => value && setInviteRole(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>
                        {inviteProduct.toUpperCase()} 역할
                      </SelectLabel>
                      {(inviteProduct === "erp"
                        ? ["admin", "operator"]
                        : ["admin", "manager", "worker", "customer_viewer"]
                      ).map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            {inviteProduct === "snap" &&
            ["worker", "customer_viewer"].includes(inviteRole) ? (
              <InlineFeedback
                feedback={{
                  tone: "info",
                  title: "수락 후 관리자 승인이 필요합니다",
                  description:
                    "초대를 수락하면 pending_approval 상태가 되며 활성화 전까지 제품 데이터가 열리지 않습니다.",
                }}
              />
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              취소
            </Button>
            <Button disabled={!inviteEmail} onClick={createInvite}>
              <Mail /> 초대 보내기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

export function CommonPlatformPrototype({
  onNavigate,
  onProductLanding,
}: CommonPrototypeScreenProps) {
  const [route, setRoute] = useState<CommonScreenKey>("login")
  const navigate = onNavigate ?? setRoute
  const props = { onNavigate: navigate, onProductLanding }
  const screens: Array<{ key: CommonScreenKey; label: string; group: string }> =
    [
      { key: "login", label: "CS-01 로그인", group: "인증" },
      { key: "signup", label: "CS-02 회원가입", group: "인증" },
      { key: "password-recovery", label: "CS-03 비밀번호 복구", group: "인증" },
      { key: "terms", label: "CS-04 이용약관", group: "법적 문서" },
      { key: "privacy", label: "CS-05 개인정보", group: "법적 문서" },
      { key: "settings", label: "CS-06 계정·프로필", group: "조직" },
      { key: "organizations", label: "CS-07 조직 컨텍스트", group: "조직" },
      { key: "members", label: "CS-08 멤버·초대", group: "조직" },
    ]
  let content: ReactNode = <CommonLoginPrototype {...props} />

  if (route === "signup") content = <CommonSignupPrototype {...props} />
  if (route === "password-recovery")
    content = <CommonPasswordRecoveryPrototype {...props} />
  if (route === "terms") content = <CommonTermsPrototype {...props} />
  if (route === "privacy") content = <CommonPrivacyPrototype {...props} />
  if (route === "settings") content = <CommonSettingsHubPrototype {...props} />
  if (route === "organizations")
    content = <CommonOrganizationContextPrototype {...props} />
  if (route === "members")
    content = <CommonMembersInvitesPrototype {...props} />

  return (
    <div data-common-screen={route} className="relative min-h-full">
      <div className="fixed top-16 right-3 z-50 w-[min(220px,calc(100vw-1.5rem))] rounded-md border bg-background/95 p-2 shadow-sm backdrop-blur">
        <Select
          value={route}
          onValueChange={(value) => value && navigate(value as CommonScreenKey)}
        >
          <SelectTrigger className="w-full" aria-label="Common 화면 선택">
            <SelectValue>
              {screens.find((screen) => screen.key === route)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="end">
            {["인증", "법적 문서", "조직"].map((group) => (
              <SelectGroup key={group}>
                <SelectLabel>{group}</SelectLabel>
                {screens
                  .filter((screen) => screen.group === group)
                  .map((screen) => (
                    <SelectItem key={screen.key} value={screen.key}>
                      {screen.label}
                    </SelectItem>
                  ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>
      {content}
    </div>
  )
}

/** @deprecated Use CommonPlatformPrototype as the integration entry point. */
export const CommonPrototypeStateGallery = CommonPlatformPrototype

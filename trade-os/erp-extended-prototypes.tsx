import { useMemo, useState, type ReactNode } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  CircleOff,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileClock,
  FileText,
  Fingerprint,
  Link2,
  RefreshCcw,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react"

import { Badge } from "@shared/components/ui/badge"
import { Button } from "@shared/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@shared/components/ui/card"
import { Checkbox } from "@shared/components/ui/checkbox"
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
import { Separator } from "@shared/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs"
import { Textarea } from "@shared/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@shared/components/ui/tooltip"
import { cn } from "@shared/lib/utils"

export type ErpExtendedScreenKey =
  | "public-landing"
  | "auth"
  | "invite"
  | "legal"
  | "erp-entry"
  | "generated-documents"
  | "document-delivery"
  | "public-share"
  | "intelligence"
  | "sales"
  | "ops-control"
  | "ops-recovery"
  | "ops-service"
  | "ops-revenue"
  | "ops-operators"
  | "ops-privacy"
  | "ops-offboarding"
  | "ops-ai-workers"

type Tone = "neutral" | "success" | "warning" | "danger" | "info"

const toneClasses: Record<Tone, string> = {
  neutral: "border-border bg-muted/40 text-foreground",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100",
  warning:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100",
  danger:
    "border-destructive/30 bg-destructive/5 text-destructive dark:bg-destructive/10",
  info: "border-primary/20 bg-primary/5 text-foreground",
}

function Notice({
  title,
  children,
  tone = "neutral",
  action,
}: {
  title: string
  children?: ReactNode
  tone?: Tone
  action?: ReactNode
}) {
  const Icon =
    tone === "danger"
      ? XCircle
      : tone === "warning"
        ? AlertTriangle
        : tone === "success"
          ? CheckCircle2
          : tone === "info"
            ? ShieldCheck
            : Clock3

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between",
        toneClasses[tone]
      )}
    >
      <div className="flex min-w-0 gap-2.5">
        <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          {children ? (
            <div className="mt-1 text-xs leading-5 opacity-80">{children}</div>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

function AppPage({
  eyebrow,
  title,
  description,
  badge,
  actions,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  badge?: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-h-full w-full bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6 xl:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">
                {eyebrow}
              </p>
              <p className="truncate text-sm font-semibold">{title}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {badge}
            {actions}
          </div>
        </div>
      </header>
      <main className="w-full px-4 py-6 sm:px-6 xl:px-8">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        {children}
      </main>
    </div>
  )
}

function PublicFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-4" aria-hidden="true" />
            </div>
            ECOYA Trade OS
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              로그인
            </Button>
            <Button size="sm">시작하기</Button>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}

function MetricRow({
  items,
}: {
  items: Array<{ label: string; value: string; detail?: string }>
}) {
  return (
    <div className="grid overflow-hidden rounded-lg border bg-card sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => (
        <div
          className={cn(
            "min-w-0 p-4",
            index > 0 && "border-t sm:border-t-0 sm:border-l",
            index === 2 && "sm:border-t sm:border-l-0 xl:border-t-0 xl:border-l"
          )}
          key={item.label}
        >
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="mt-1 truncate text-xl font-semibold tabular-nums">{item.value}</p>
          {item.detail ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {item.detail}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function SectionHeading({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

function CapabilityGate({
  capability,
  allowed,
  remedy,
}: {
  capability: string
  allowed: boolean
  remedy: string
}) {
  return (
    <Notice
      tone={allowed ? "success" : "warning"}
      title={
        allowed
          ? "이 작업을 실행할 수 있습니다"
          : "현재 권한으로 실행할 수 없습니다"
      }
      action={
        <Badge variant={allowed ? "secondary" : "outline"}>{capability}</Badge>
      }
    >
      {allowed ? "서버가 현재 세션과 capability를 다시 확인합니다." : remedy}
    </Notice>
  )
}

function AuditReceipt({
  id,
  title,
  meta,
}: {
  id: string
  title: string
  meta: string
}) {
  return (
    <div className="flex items-start gap-3 border-b py-3 last:border-b-0">
      <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-muted">
        <Fingerprint className="size-3.5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{title}</p>
          <Badge variant="outline">불변 기록</Badge>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      <code className="hidden text-xs text-muted-foreground sm:block">
        {id}
      </code>
    </div>
  )
}

export function PublicLandingPrototype() {
  return (
    <PublicFrame>
      <main>
        <section className="mx-auto grid min-h-[440px] max-w-7xl content-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(520px,1.2fr)]">
          <div className="flex flex-col justify-center">
            <Badge variant="secondary" className="mb-4">
              문서에서 실행까지 한 흐름으로
            </Badge>
            <h1 className="max-w-2xl text-4xl leading-tight font-semibold tracking-normal sm:text-5xl">
              무역 문서를 읽고, 확인하고, 안전하게 전달합니다
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
              ECOYA는 문서 생성과 검토, 외부 공유, 후속 업무 추적을 연결합니다.
              승인·재무·SNAP은 필요한 조직만 켜서 사용할 수 있습니다.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <Button>
                시작하기
                <ArrowRight data-icon="inline-end" />
              </Button>
              <Button variant="outline">기존 사용자 로그인</Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border bg-muted/30">
            <div className="flex items-center justify-between border-b bg-background px-4 py-3">
              <div>
                <p className="text-sm font-medium">오늘 처리할 문서</p>
                <p className="text-xs text-muted-foreground">
                  업무 데이터는 로그인 후에만 조회합니다.
                </p>
              </div>
              <Badge>3건</Badge>
            </div>
            <div className="grid gap-0 sm:grid-cols-3">
              {[
                ["01", "문서 확인", "추출값 1개 확인"],
                ["02", "문서 확정", "본문 PDF 준비"],
                ["03", "외부 전달", "근거가 남는 공유"],
              ].map(([step, title, detail], index) => (
                <div
                  className={cn(
                    "p-5",
                    index > 0 && "border-t sm:border-t-0 sm:border-l"
                  )}
                  key={step}
                >
                  <span className="text-xs font-medium text-primary">
                    {step}
                  </span>
                  <p className="mt-8 font-medium">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
                </div>
              ))}
            </div>
            <div className="border-t bg-background p-4">
              <Notice title="공개 랜딩에서는 업무 API를 호출하지 않습니다">
                시작하기는 가입으로, 로그인은 인증 화면으로 이동합니다.
              </Notice>
            </div>
          </div>
        </section>
      </main>
    </PublicFrame>
  )
}

type AuthView = "login" | "signup"

export function AuthPrototype({
  initialView = "login",
}: {
  initialView?: AuthView
}) {
  const [view, setView] = useState<AuthView>(initialView)
  const [failure, setFailure] = useState(false)

  return (
    <PublicFrame>
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl place-items-center px-4 py-10 sm:px-6">
        <Card className="w-full max-w-md rounded-lg">
          <CardHeader>
            <CardTitle>
              {view === "login" ? "로그인" : "회사 계정 만들기"}
            </CardTitle>
            <CardDescription>
              {view === "login"
                ? "활성 Space와 역할을 확인한 뒤 안전한 시작 화면으로 이동합니다."
                : "계정 생성과 회사 Space 생성을 서로 다른 저장 단계로 처리합니다."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {failure ? (
              <Notice
                tone="danger"
                title={
                  view === "login"
                    ? "계정 또는 조직을 연결하지 못했습니다"
                    : "계정은 생성됐지만 회사 Space를 만들지 못했습니다"
                }
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFailure(false)}
                  >
                    <RotateCcw data-icon="inline-start" />
                    다시 시도
                  </Button>
                }
              >
                입력값은 그대로 유지됩니다. 같은 요청을 다시 실행하거나 다른
                계정으로 시작할 수 있습니다.
              </Notice>
            ) : null}
            {view === "signup" ? (
              <label className="grid gap-1.5 text-sm">
                회사 또는 Space 이름
                <Input defaultValue="Hanbit Trading" />
              </label>
            ) : null}
            <label className="grid gap-1.5 text-sm">
              이메일
              <Input type="email" defaultValue="operator@hanbit.example" />
            </label>
            <label className="grid gap-1.5 text-sm">
              비밀번호
              <Input type="password" defaultValue="temporary-password" />
            </label>
            {view === "signup" ? (
              <>
                <label className="grid gap-1.5 text-sm">
                  비밀번호 확인
                  <Input type="password" defaultValue="temporary-password" />
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox defaultChecked className="mt-0.5" />
                  <span>
                    이용약관과 개인정보처리방침을 확인했습니다.
                    <span className="block text-xs text-muted-foreground">
                      서버가 선택한 문서 ID·언어·digest가 화면과 같을 때만
                      동의를 기록합니다.
                    </span>
                  </span>
                </label>
              </>
            ) : null}
            <Button onClick={() => setFailure(true)}>
              {view === "login" ? "이메일로 로그인" : "계정 만들기"}
            </Button>
            <Button variant="outline">Google로 계속하기</Button>
            <Separator />
            <Button
              variant="ghost"
              onClick={() => {
                setFailure(false)
                setView(view === "login" ? "signup" : "login")
              }}
            >
              {view === "login"
                ? "새 회사 계정 만들기"
                : "이미 계정이 있습니다"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </PublicFrame>
  )
}

export function LoginPrototype() {
  return <AuthPrototype initialView="login" />
}

export function SignupPrototype() {
  return <AuthPrototype initialView="signup" />
}

type InviteState = "signed-out" | "ready" | "failed" | "recovery"

export function InviteAcceptPrototype() {
  const [state, setState] = useState<InviteState>("ready")

  return (
    <PublicFrame>
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl place-items-center px-4 py-10 sm:px-6">
        <Card className="w-full max-w-xl rounded-lg">
          <CardHeader>
            <CardTitle>Hanbit Trading에 초대되었습니다</CardTitle>
            <CardDescription>
              초대 토큰과 로그인 이메일, 확정 역할을 서버에서 함께 확인합니다.
            </CardDescription>
            <CardAction>
              <Badge variant="secondary">Member</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Select
              value={state}
              onValueChange={(value) => setState(value as InviteState)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>검증 상태</SelectLabel>
                  <SelectItem value="signed-out">로그인 전</SelectItem>
                  <SelectItem value="ready">수락 가능</SelectItem>
                  <SelectItem value="failed">수락 실패</SelectItem>
                  <SelectItem value="recovery">합류 후 복구 필요</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {state === "signed-out" ? (
              <Notice
                title="로그인이 필요합니다"
                action={<Button size="sm">로그인하고 수락</Button>}
              >
                초대 토큰을 보존한 채 로그인 화면으로 이동합니다.
              </Notice>
            ) : null}
            {state === "ready" ? (
              <>
                <div className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">초대 이메일</p>
                    <p className="mt-1 font-medium">operator@hanbit.example</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">도착 화면</p>
                    <p className="mt-1 font-medium">문서 확인함</p>
                  </div>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox defaultChecked className="mt-0.5" />
                  약관과 개인정보처리방침을 확인했습니다.
                </label>
                <Button>초대 수락</Button>
              </>
            ) : null}
            {state === "failed" ? (
              <Notice
                tone="danger"
                title="초대를 수락하지 못했습니다"
                action={
                  <Button size="sm" variant="outline">
                    다시 시도
                  </Button>
                }
              >
                만료, 취소, 이메일 불일치, 일시 오류를 각각 확인합니다. 토큰과
                현재 화면은 유지됩니다.
              </Notice>
            ) : null}
            {state === "recovery" ? (
              <Notice
                tone="warning"
                title="Space 합류 상태를 확인해야 합니다"
                action={
                  <Button size="sm" variant="outline">
                    지원 요청
                  </Button>
                }
              >
                비활성 membership 또는 알 수 없는 역할입니다. 이전 조직의 업무
                데이터는 표시하지 않습니다.
              </Notice>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </PublicFrame>
  )
}

export function LegalEntryPrototype({
  kind = "terms",
}: {
  kind?: "terms" | "privacy"
}) {
  const isTerms = kind === "terms"
  return (
    <PublicFrame>
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <Button variant="ghost" className="mb-5">
          <ArrowLeft data-icon="inline-start" />
          돌아가기
        </Button>
        <article className="border-y py-8">
          <Badge variant="outline">공개 법률 문서</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-normal">
            {isTerms ? "이용약관" : "개인정보처리방침"}
          </h1>
          <div className="mt-4 grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm sm:grid-cols-3">
            <div>
              <span className="text-muted-foreground">버전</span>
              <p className="font-medium">미확인</p>
            </div>
            <div>
              <span className="text-muted-foreground">효력일</span>
              <p className="font-medium">미확인</p>
            </div>
            <div>
              <span className="text-muted-foreground">언어</span>
              <p className="font-medium">서버 선택값</p>
            </div>
          </div>
          <Notice tone="warning" title="법무 확정 artifact를 기다리고 있습니다">
            임의 버전·효력일·관할을 만들지 않습니다. 확정 문서는 새 version으로
            추가하고 과거 동의 증적을 보존합니다.
          </Notice>
          <div className="mt-8 grid gap-6 text-sm leading-7 text-muted-foreground">
            <section>
              <h2 className="text-base font-semibold text-foreground">
                문서 본문 주입 영역
              </h2>
              <p className="mt-2">
                법무 승인된 document ID, version, language, content digest와
                본문이 이 위치에 표시됩니다.
              </p>
            </section>
            <section>
              <h2 className="text-base font-semibold text-foreground">
                동의 기록 경계
              </h2>
              <p className="mt-2">
                이 문서를 열었다는 사실만으로 동의를 저장하지 않습니다. 가입
                또는 초대 수락 제출 시 화면 artifact와 서버 artifact가 일치할
                때만 동의 원장에 추가합니다.
              </p>
            </section>
          </div>
        </article>
      </main>
    </PublicFrame>
  )
}

export function TermsPrototype() {
  return <LegalEntryPrototype kind="terms" />
}

export function PrivacyPrototype() {
  return <LegalEntryPrototype kind="privacy" />
}

export function ErpEntryPrototype() {
  const [entryState, setEntryState] = useState("checking")
  return (
    <PublicFrame>
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl place-items-center px-4 py-10 sm:px-6">
        <Card className="w-full max-w-xl rounded-lg">
          <CardHeader>
            <CardTitle>ERP 진입 확인</CardTitle>
            <CardDescription>
              이 화면은 업무 목록을 그리지 않는 안전한 분기 전용 화면입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Select
              value={entryState}
              onValueChange={(value) => value && setEntryState(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="checking">세션 확인 중</SelectItem>
                  <SelectItem value="choose">Space 선택 필요</SelectItem>
                  <SelectItem value="blocked">복구 필요</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {entryState === "checking" ? (
              <div className="grid place-items-center gap-3 py-10 text-center">
                <RefreshCcw
                  className="size-6 animate-spin text-primary"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-medium">세션과 활성 membership 확인 중</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    역할을 추정하지 않습니다.
                  </p>
                </div>
              </div>
            ) : null}
            {entryState === "choose" ? (
              <div className="grid gap-2">
                {["Hanbit Trading · Owner", "ECOYA Demo · Member"].map(
                  (space) => (
                    <Button
                      key={space}
                      variant="outline"
                      className="justify-between"
                    >
                      {space}
                      <ChevronRight data-icon="inline-end" />
                    </Button>
                  )
                )}
              </div>
            ) : null}
            {entryState === "blocked" ? (
              <Notice
                tone="warning"
                title="활성 Space에 진입할 수 없습니다"
                action={
                  <Button size="sm" variant="outline">
                    다시 확인
                  </Button>
                }
              >
                membership 정지·철회·tenant 활성화 실패를 확인합니다. 이전
                Space의 데이터는 표시하지 않습니다.
              </Notice>
            ) : null}
          </CardContent>
        </Card>
      </main>
    </PublicFrame>
  )
}

const generatedDocuments = [
  {
    id: "SC-2026-0708",
    type: "판매계약서",
    title: "7월 알루미늄 스크랩 수입",
    deal: "DL-260708-01",
    state: "확정",
    updated: "오늘 09:24",
  },
  {
    id: "QT-2026-0711",
    type: "견적서",
    title: "ACME 7월 견적",
    deal: "DL-260711-02",
    state: "작성 중",
    updated: "어제 17:42",
  },
  {
    id: "CI-2026-0629",
    type: "상업송장",
    title: "Hamburg shipment",
    deal: "DL-260629-04",
    state: "발송됨",
    updated: "07.30 13:18",
  },
]

export function GeneratedDocumentsPrototype() {
  const [query, setQuery] = useState("")
  const [loadState, setLoadState] = useState<"ready" | "empty" | "failed">(
    "ready"
  )
  const filtered = useMemo(
    () =>
      generatedDocuments.filter((item) =>
        `${item.id} ${item.title} ${item.deal}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [query]
  )

  return (
    <AppPage
      eyebrow="문서"
      title="발행 문서"
      description="본인 담당 또는 공동 작업 문서를 유형 제한 없이 찾고, 작성·출력·복제·전달 작업으로 이어갑니다."
      badge={<Badge variant="outline">Approval 선택 기능</Badge>}
      actions={
        <Button size="sm">
          <FileText data-icon="inline-start" />
          문서 만들기
        </Button>
      }
    >
      <div className="grid gap-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-xl">
            <Search
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
              placeholder="문서번호, 제목, Deal 검색"
            />
          </div>
          <Select
            value={loadState}
            onValueChange={(value) => setLoadState(value as typeof loadState)}
          >
            <SelectTrigger className="w-full lg:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="ready">목록 있음</SelectItem>
                <SelectItem value="empty">빈 목록</SelectItem>
                <SelectItem value="failed">조회 실패</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <Tabs defaultValue="all">
          <TabsList className="max-w-full overflow-x-auto">
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="draft">작성 중</TabsTrigger>
            <TabsTrigger value="confirmed">확정</TabsTrigger>
            <TabsTrigger value="sent">발송됨</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-2">
            {loadState === "failed" ? (
              <Notice
                tone="danger"
                title="문서 목록을 불러오지 못했습니다"
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLoadState("ready")}
                  >
                    <RefreshCcw data-icon="inline-start" />
                    새로고침
                  </Button>
                }
              >
                검색어와 필터는 유지됩니다.
              </Notice>
            ) : loadState === "empty" || filtered.length === 0 ? (
              <div className="grid min-h-60 place-items-center rounded-lg border border-dashed p-6 text-center">
                <div>
                  <FileClock className="mx-auto size-7 text-muted-foreground" />
                  <p className="mt-3 font-medium">
                    조건에 맞는 발행 문서가 없습니다
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    새 문서를 만들거나 검색 조건을 지워보세요.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>문서</TableHead>
                      <TableHead>Deal</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>수정</TableHead>
                      <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item) => (
                      <TableRow key={item.id} className="cursor-pointer">
                        <TableCell>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.type} · {item.id}
                          </p>
                        </TableCell>
                        <TableCell>{item.deal}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.state === "발송됨" ? "secondary" : "outline"
                            }
                          >
                            {item.state}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {item.updated}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button size="xs" variant="ghost">
                              {item.state === "작성 중"
                                ? "이어서 작성"
                                : "미리보기"}
                            </Button>
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              aria-label={`${item.id} PDF 받기`}
                            >
                              <Download />
                            </Button>
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              aria-label={`${item.id} 전달`}
                            >
                              <Send />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
        <CapabilityGate
          capability="approval.workflow"
          allowed={false}
          remedy="Approval 모드를 켠 조직에서만 승인 대기·승인·반려 필터가 추가됩니다. 현재 Pilot 기본 흐름에는 표시하지 않습니다."
        />
      </div>
    </AppPage>
  )
}

type AttemptState = "temporary_failed" | "accepted" | "delivered"

export function DocumentDeliveryPrototype() {
  const [attemptState, setAttemptState] =
    useState<AttemptState>("temporary_failed")
  const [linkCreated, setLinkCreated] = useState(true)
  const [attemptCount, setAttemptCount] = useState(1)

  const retry = () => {
    setAttemptCount((count) => count + 1)
    setAttemptState("accepted")
  }

  return (
    <AppPage
      eyebrow="발행 문서 · SC-2026-0708"
      title="문서 전달"
      description="확정된 패키지와 수신자별 전달 요청을 분리해 관리합니다. 링크 생성, 제공자 수락, 도달, 열람은 서로 다른 근거입니다."
      badge={<Badge variant="secondary">Confirm 완료</Badge>}
      actions={
        <Button size="sm" variant="outline">
          <RefreshCcw data-icon="inline-start" />
          새로고침
        </Button>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <div className="grid gap-5">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>고정 패키지</CardTitle>
              <CardDescription>
                본문 PDF는 제한 계산에서 제외됩니다. 참조·직접 첨부는 최대 10개,
                파일당 10 MiB, 합계 50 MiB입니다.
              </CardDescription>
              <CardAction>
                <Badge variant="outline">revision 3</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="grid gap-3">
              {[
                "판매계약서_SC-2026-0708.pdf · 본문",
                "Invoice_HB-2607-003.pdf · 2.4 MiB",
                "PackingList_0707.pdf · 1.1 MiB",
              ].map((file) => (
                <div
                  key={file}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <FileCheck2 className="size-4 text-primary" />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {file}
                  </span>
                  <Badge variant="secondary">포함</Badge>
                </div>
              ))}
              <Notice
                tone="info"
                title="발행 뒤에는 package version과 content digest가 바뀌지 않습니다"
              >
                첨부를 바꾸려면 새 revision을 발행합니다.
              </Notice>
            </CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>공유 링크</CardTitle>
              <CardDescription>
                링크를 만드는 것만으로 문서가 발송됨으로 바뀌지 않습니다.
              </CardDescription>
              <CardAction>
                <Button size="sm" onClick={() => setLinkCreated(true)}>
                  <Link2 data-icon="inline-start" />
                  링크 만들기
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {linkCreated ? (
                <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_auto]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">ACME 계약 담당자</p>
                      <Badge variant="secondary">활성</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-primary">
                      https://ecoya.app/share/sc-2026-0708-r3
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      2026.08.08 만료 · 0/10회 열람 · revision 3
                    </p>
                  </div>
                  <div className="flex items-start gap-1">
                    <Button
                      size="icon-sm"
                      variant="outline"
                      aria-label="링크 복사"
                    >
                      <Copy />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLinkCreated(false)}
                    >
                      공유 취소
                    </Button>
                  </div>
                </div>
              ) : (
                <Notice title="활성 공유 링크가 없습니다">
                  필요할 때 새 범위와 열람 제한으로 링크를 만드세요.
                </Notice>
              )}
            </CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>제공자 전송</CardTitle>
              <CardDescription>
                요청 하나는 채널 하나와 정규화된 수신 endpoint 하나를 가집니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  채널
                  <Select defaultValue="email">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </label>
                <label className="grid gap-1.5 text-sm">
                  수신자
                  <Input defaultValue="op***@acme.example" />
                </label>
              </div>
              <Button className="justify-self-end">
                <Send data-icon="inline-start" />
                전송 요청 만들기
              </Button>
            </CardContent>
          </Card>
        </div>
        <Card className="h-fit rounded-lg xl:sticky xl:top-20">
          <CardHeader>
            <CardTitle>전달 이력</CardTitle>
            <CardDescription>
              요청은 유지되고, 재시도마다 새 attempt가 추가됩니다.
            </CardDescription>
            <CardAction>
              <Badge variant="outline">
                request 1개 · attempt {attemptCount}개
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">REQ-260801-018</p>
                  <p className="text-xs text-muted-foreground">
                    Email · op***@acme.example
                  </p>
                </div>
                <Badge
                  variant={
                    attemptState === "temporary_failed"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {attemptState === "temporary_failed"
                    ? "일시 실패"
                    : attemptState === "accepted"
                      ? "발송됨"
                      : "전달됨"}
                </Badge>
              </div>
              <div className="mt-4 grid gap-3 border-l pl-4 text-sm">
                <div>
                  <p className="font-medium">attempt 1 · temporary_failed</p>
                  <p className="text-xs text-muted-foreground">
                    PROVIDER_UNAVAILABLE · 10:02
                  </p>
                </div>
                {attemptCount > 1 ? (
                  <div>
                    <p className="font-medium">attempt 2 · {attemptState}</p>
                    <p className="text-xs text-muted-foreground">
                      provider message ID 보존 · 10:07
                    </p>
                  </div>
                ) : null}
              </div>
              {attemptState === "temporary_failed" ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={retry}
                >
                  <RefreshCcw data-icon="inline-start" />
                  같은 요청 재시도
                </Button>
              ) : attemptState === "accepted" ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={() => setAttemptState("delivered")}
                >
                  <BadgeCheck data-icon="inline-start" />
                  도달 webhook 재현
                </Button>
              ) : null}
            </div>
            <AuditReceipt
              id="RCPT-01J7"
              title="요청·outbox 원자 저장"
              meta="actor, package digest, channel, safe recipient reference"
            />
            <AuditReceipt
              id="RCPT-01J8"
              title="제공자 시도 기록"
              meta="attempt ID, safe error, before/after digest"
            />
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            링크 복사와 메일 앱 열기는 발송 근거가 아닙니다.
          </CardFooter>
        </Card>
      </div>
    </AppPage>
  )
}

type PublicShareState =
  "valid" | "unavailable" | "expired" | "open-limit" | "temporary"

function PublicShareStateView({
  state,
  onRetry,
}: {
  state: PublicShareState
  onRetry?: () => void
}) {
  if (state === "unavailable") {
    return (
      <div className="grid place-items-center gap-4 py-12 text-center">
        <CircleOff
          className="size-10 text-muted-foreground"
          aria-hidden="true"
        />
        <div>
          <p className="text-xl font-semibold">링크를 사용할 수 없습니다</p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            발신자에게 새로운 링크를 요청해 주세요.
          </p>
        </div>
        <Badge variant="outline">404 · LINK_UNAVAILABLE</Badge>
      </div>
    )
  }
  if (state === "expired" || state === "open-limit") {
    return (
      <div className="grid place-items-center gap-4 py-12 text-center">
        <Clock3 className="size-10 text-muted-foreground" />
        <div>
          <p className="text-xl font-semibold">
            {state === "expired"
              ? "링크가 만료되었습니다"
              : "열람 가능 횟수를 모두 사용했습니다"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            발신자에게 새 링크를 요청할 수 있습니다.
          </p>
        </div>
        <Button variant="outline">새 링크 요청</Button>
        <Badge variant="outline">
          {state === "expired" ? "410 · LINK_EXPIRED" : "429 · LINK_OPEN_LIMIT"}
        </Badge>
      </div>
    )
  }
  if (state === "temporary") {
    return (
      <div className="grid place-items-center gap-4 py-12 text-center">
        <RefreshCcw className="size-10 text-muted-foreground" />
        <div>
          <p className="text-xl font-semibold">잠시 사용할 수 없습니다</p>
          <p className="mt-2 text-sm text-muted-foreground">
            안내된 시간 뒤 같은 링크를 다시 확인합니다.
          </p>
        </div>
        <Button onClick={onRetry}>다시 시도</Button>
        <Badge variant="outline">503 · TEMPORARY_UNAVAILABLE</Badge>
      </div>
    )
  }
  return (
    <div className="grid gap-4">
      <Notice tone="success" title="공유 문서를 열 수 있습니다">
        열람 이벤트는 다운로드와 별도로 한 번만 집계합니다.
      </Notice>
      <div className="aspect-[4/3] rounded-lg border bg-muted/30 p-6">
        <p className="text-xs font-medium text-primary">TRADE DOCUMENT</p>
        <h2 className="mt-3 text-2xl font-semibold">SALES CONTRACT</h2>
        <Separator className="my-6" />
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Document No.</p>
            <p className="font-medium">SC-2026-0708</p>
          </div>
          <div>
            <p className="text-muted-foreground">Recipient</p>
            <p className="font-medium">ACME GmbH</p>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline">
          <Eye data-icon="inline-start" />
          문서 열기
        </Button>
        <Button>
          <Download data-icon="inline-start" />
          파일 받기
        </Button>
      </div>
    </div>
  )
}

export function PublicShareUnavailablePrototype() {
  return (
    <PublicFrame>
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl place-items-center px-4 py-10 sm:px-6">
        <Card className="w-full max-w-2xl rounded-lg">
          <CardContent>
            <PublicShareStateView state="unavailable" />
          </CardContent>
        </Card>
      </main>
    </PublicFrame>
  )
}

export function PublicSharePrototype() {
  const [state, setState] = useState<PublicShareState>("valid")
  return (
    <PublicFrame>
      <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-muted-foreground">외부 공유</p>
            <h1 className="text-xl font-semibold">고객 전달 문서</h1>
          </div>
          <Select
            value={state}
            onValueChange={(value) => setState(value as PublicShareState)}
          >
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>공개 응답 fixture</SelectLabel>
                <SelectItem value="valid">유효 링크</SelectItem>
                <SelectItem value="unavailable">
                  잘못됨·철회 동일 404
                </SelectItem>
                <SelectItem value="expired">만료 410</SelectItem>
                <SelectItem value="open-limit">열람 한도 429</SelectItem>
                <SelectItem value="temporary">일시 오류 503</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <Card className="rounded-lg">
          <CardContent>
            <PublicShareStateView
              state={state}
              onRetry={() => setState("valid")}
            />
          </CardContent>
        </Card>
        {state === "unavailable" ? (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            잘못된 토큰과 철회된 토큰은 status, body, 문구, 행동이 모두
            같습니다.
          </p>
        ) : null}
      </main>
    </PublicFrame>
  )
}

export function IntelligencePrototype() {
  const [feedState, setFeedState] = useState<"ready" | "empty" | "failed">(
    "ready"
  )
  return (
    <AppPage
      eyebrow="ECOYA Intelligence"
      title="시장 인텔리전스"
      description="관측값·벤치마크·조직 관련 신호를 출처와 기준 시각까지 함께 확인합니다."
      badge={<Badge variant="secondary">Pro capability</Badge>}
      actions={
        <Button size="sm" variant="outline">
          <RefreshCcw data-icon="inline-start" />
          새로고침
        </Button>
      }
    >
      <div className="grid gap-6">
        <MetricRow
          items={[
            {
              label: "알루미늄 지표",
              value: "2,421.35 USD",
              detail: "LME · 2026.08.01 08:00",
            },
            {
              label: "USD/KRW",
              value: "1,382.4500",
              detail: "공식 고시 · 09:00",
            },
            { label: "해상 운임", value: "1,746.80", detail: "SCFI · 07.31" },
            { label: "조직 관련 신호", value: "4건", detail: "읽지 않음 2건" },
          ]}
        />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.5fr)]">
          <div className="grid gap-4">
            <SectionHeading
              title="관측값·벤치마크"
              description="숫자만 보여주지 않고 날짜와 출처를 고정합니다."
            />
            <div className="grid gap-3 md:grid-cols-2">
              {[
                {
                  title: "알루미늄 3개월 추이",
                  detail: "전월 대비 +2.8%",
                  source: "LME official",
                },
                {
                  title: "Hamburg 운임 비교",
                  detail: "조직 평균 대비 +6.2%",
                  source: "SCFI / 내부 확정 Deal",
                },
                {
                  title: "유럽 결제 지연",
                  detail: "중앙값 4.2일",
                  source: "확정 정산 데이터",
                },
                {
                  title: "USD 노출",
                  detail: "이번 달 2,400,000.00 USD",
                  source: "확정 문서",
                },
              ].map((item) => (
                <Card key={item.title} size="sm" className="rounded-lg">
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                    <CardDescription>{item.source}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold">{item.detail}</p>
                    <div className="mt-4 h-1.5 rounded-full bg-muted">
                      <div className="h-full w-2/3 rounded-full bg-primary" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>개인화 피드</CardTitle>
              <CardDescription>
                빈 피드와 조회 실패를 구분합니다.
              </CardDescription>
              <CardAction>
                <Select
                  value={feedState}
                  onValueChange={(value) =>
                    setFeedState(value as typeof feedState)
                  }
                >
                  <SelectTrigger size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="ready">신호 있음</SelectItem>
                      <SelectItem value="empty">빈 피드</SelectItem>
                      <SelectItem value="failed">조회 실패</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </CardAction>
            </CardHeader>
            <CardContent>
              {feedState === "failed" ? (
                <Notice
                  tone="danger"
                  title="피드를 불러오지 못했습니다"
                  action={
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setFeedState("ready")}
                    >
                      새로고침
                    </Button>
                  }
                >
                  마지막 정상 자료와 오류 시각을 구분합니다.
                </Notice>
              ) : feedState === "empty" ? (
                <Notice title="현재 조직에 해당하는 신호가 없습니다">
                  관측값과 벤치마크는 계속 확인할 수 있습니다.
                </Notice>
              ) : (
                <div className="grid gap-1">
                  {[
                    "ACME 결제 지연 신호",
                    "Hamburg 운임 상승",
                    "계약 단가 편차 확인",
                    "B/L 수령 지연",
                  ].map((signal, index) => (
                    <button
                      className="flex items-center justify-between rounded-lg px-3 py-3 text-left text-sm hover:bg-muted"
                      key={signal}
                    >
                      <span>{signal}</span>
                      <Badge variant={index < 2 ? "destructive" : "outline"}>
                        {index < 2 ? "확인" : "정보"}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                ERP 홈으로 이동
                <ExternalLink data-icon="inline-end" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AppPage>
  )
}

const salesContacts = [
  {
    name: "Anna Keller",
    company: "ACME GmbH",
    email: "a.keller@acme.example",
    stage: "제안 검토",
    deals: 2,
  },
  {
    name: "Kenji Sato",
    company: "Sakura Logistics",
    email: "k.sato@sakura.example",
    stage: "협상",
    deals: 1,
  },
  {
    name: "Mia Chen",
    company: "HMM Green",
    email: "mia@hmmgreen.example",
    stage: "신규",
    deals: 0,
  },
]

export function SalesPrototype() {
  const [selected, setSelected] = useState(salesContacts[0])
  return (
    <AppPage
      eyebrow="영업"
      title="연락처·파이프라인"
      description="연락처를 선택해 현재 단계, 관련 Deal과 읽기 전용 활동 이력을 한 화면에서 확인합니다."
      actions={
        <Button size="sm" variant="outline">
          <RefreshCcw data-icon="inline-start" />
          새로고침
        </Button>
      }
    >
      <div className="grid min-h-[620px] overflow-hidden rounded-lg border lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="border-b bg-sidebar/40 lg:border-r lg:border-b-0">
          <div className="border-b p-4">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="이름 또는 회사 검색" />
            </div>
          </div>
          <div className="grid">
            {salesContacts.map((contact) => (
              <button
                key={contact.email}
                onClick={() => setSelected(contact)}
                className={cn(
                  "border-b p-4 text-left hover:bg-sidebar-accent",
                  selected.email === contact.email && "bg-sidebar-accent"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{contact.name}</p>
                  <Badge variant="outline">{contact.stage}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {contact.company}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {contact.email}
                </p>
              </button>
            ))}
          </div>
        </aside>
        <section className="min-w-0 p-4 sm:p-6">
          <div className="flex flex-col gap-3 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs text-muted-foreground">선택 연락처</p>
              <h2 className="mt-1 text-xl font-semibold">{selected.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {selected.company} · {selected.stage}
              </p>
            </div>
            <Badge variant="secondary">관련 Deal {selected.deals}건</Badge>
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <div>
              <SectionHeading
                title="관련 Deal"
                description="완전한 연락처→Deal 생성 전환은 아직 근거가 없어 제공하지 않습니다."
              />
              <div className="mt-3 grid gap-2">
                {selected.deals === 0 ? (
                  <Notice title="관련 Deal이 없습니다">
                    현재 연락처 단계는 유지됩니다.
                  </Notice>
                ) : (
                  [
                    "DL-260708-01 · 2,400,000.00 USD",
                    "DL-260629-04 · 166,000.00 USD",
                  ]
                    .slice(0, selected.deals)
                    .map((deal) => (
                      <button
                        key={deal}
                        className="flex items-center justify-between rounded-lg border p-3 text-left hover:bg-muted"
                      >
                        <span className="text-sm font-medium">{deal}</span>
                        <ChevronRight className="size-4" />
                      </button>
                    ))
                )}
              </div>
            </div>
            <div>
              <SectionHeading
                title="활동 이력"
                description="파이프라인 응답의 읽기 전용 사건입니다."
              />
              <div className="mt-3 border-y">
                {[
                  "견적서 전달 · 07.31 16:20",
                  "연락처 단계 변경 · 07.30 11:02",
                  "Deal 연결 · 07.29 09:14",
                ].map((event) => (
                  <div
                    key={event}
                    className="flex gap-3 border-b py-3 text-sm last:border-b-0"
                  >
                    <Clock3 className="mt-0.5 size-4 text-muted-foreground" />
                    <span>{event}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppPage>
  )
}

function OpsPage({
  title,
  description,
  level,
  capability,
  children,
}: {
  title: string
  description: string
  level: "L0" | "L1" | "L2" | "L3"
  capability: string
  children: ReactNode
}) {
  return (
    <AppPage
      eyebrow="Platform Ops"
      title={title}
      description={description}
      badge={
        <div className="hidden items-center gap-2 sm:flex">
          <Badge variant={level === "L3" ? "destructive" : "secondary"}>
            {level}
          </Badge>
          <Badge variant="outline">{capability}</Badge>
        </div>
      }
    >
      {children}
    </AppPage>
  )
}

export function OpsControlPrototype() {
  const [scope, setScope] = useState("aggregate")
  return (
    <OpsPage
      title="운영 통제"
      description="고객 역할과 분리된 Platform operator 권한으로 집계 상태와 승인된 고객 상태 변경을 관리합니다."
      level={scope === "aggregate" ? "L0" : "L3"}
      capability={
        scope === "aggregate" ? "ops.aggregate.read" : "ops.share_link.revoke"
      }
    >
      <div className="grid gap-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={scope === "aggregate" ? "default" : "outline"}
            onClick={() => setScope("aggregate")}
          >
            집계 상태
          </Button>
          <Button
            variant={scope === "links" ? "default" : "outline"}
            onClick={() => setScope("links")}
          >
            공유 링크 통제
          </Button>
        </div>
        {scope === "aggregate" ? (
          <>
            <MetricRow
              items={[
                { label: "API 성공률", value: "99.982%", detail: "최근 60분" },
                { label: "닫힌 작업", value: "18,240건", detail: "P95 1.82s" },
                {
                  label: "안전 오류",
                  value: "42건",
                  detail: "10건 미만 cell 숨김",
                },
                {
                  label: "배포 버전",
                  value: "trade-2026.08.01",
                  detail: "ap-northeast-2",
                },
              ]}
            />
            <Notice
              tone="info"
              title="L0 집계에는 tenant/resource ID와 자유문이 없습니다"
            >
              조회 자체는 operator/session/source IP·query 종류·시각·결과 건수로
              감사합니다.
            </Notice>
          </>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>조직</TableHead>
                    <TableHead>문서</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>만료</TableHead>
                    <TableHead>지원 요청</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>org_***41</TableCell>
                    <TableCell>doc_***18</TableCell>
                    <TableCell>
                      <Badge variant="secondary">활성</Badge>
                    </TableCell>
                    <TableCell>2026.08.08</TableCell>
                    <TableCell>SUP-2018</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>철회 영향 미리보기</CardTitle>
                <CardDescription>
                  최신 revision과 digest를 승인 시점에 다시 검증합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <CapabilityGate
                  capability="ops.share_link.revoke"
                  allowed={true}
                  remedy=""
                />
                <div className="grid gap-2 text-sm">
                  <p>요청자: operator_018</p>
                  <p>승인자: operator_042</p>
                  <p>재인증: 6분 전</p>
                  <p>preview: rev-7 · 3f7a…9c11</p>
                </div>
                <Textarea defaultValue="고객 지원 요청 SUP-2018에 따른 링크 철회" />
              </CardContent>
              <CardFooter className="justify-end">
                <Button variant="destructive">
                  <ShieldAlert data-icon="inline-start" />
                  별도 승인 후 철회
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </OpsPage>
  )
}

export function OpsRecoveryPrototype() {
  const [status, setStatus] = useState<"failed" | "requested" | "completed">(
    "failed"
  )
  return (
    <OpsPage
      title="실패 작업 복구"
      description="되돌릴 수 있는 일반 재시도만 L1에서 실행하고 요청 성공과 작업 최종 성공을 분리합니다."
      level="L1"
      capability="ops.retry.execute"
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>종류</TableHead>
                <TableHead>safe error</TableHead>
                <TableHead>attempt</TableHead>
                <TableHead>다음 재시도</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                [
                  "job_***8F",
                  "OCR_EXTRACT",
                  "TEMPORARY_PROVIDER_ERROR",
                  "2/3",
                  "10:35",
                ],
                [
                  "job_***1A",
                  "PDF_RENDER",
                  "PACKAGE_UNAVAILABLE",
                  "1/3",
                  "수동",
                ],
              ].map((row) => (
                <TableRow key={row[0]} className="cursor-pointer">
                  {row.map((cell) => (
                    <TableCell key={cell}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>선택 작업 재시도</CardTitle>
            <CardDescription>
              payload 원문 대신 digest와 원래 action scope만 표시합니다.
            </CardDescription>
            <CardAction>
              <Badge
                variant={status === "completed" ? "secondary" : "destructive"}
              >
                {status === "failed"
                  ? "실패"
                  : status === "requested"
                    ? "요청됨"
                    : "완료"}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p>job_***8F · OCR_EXTRACT</p>
              <p className="mt-1 text-xs text-muted-foreground">
                payload digest 91ad…77f0 · tenant org_***41
              </p>
            </div>
            <label className="grid gap-1.5 text-sm">
              재시도 사유
              <Textarea defaultValue="일시 제공자 오류가 해소되어 동일 범위로 재실행" />
            </label>
            {status === "requested" ? (
              <Notice tone="info" title="재시도 요청이 접수되었습니다">
                최종 작업 결과는 아직 성공이 아닙니다. retry ID: retry_019
              </Notice>
            ) : null}
            {status === "completed" ? (
              <Notice tone="success" title="재시도 작업이 완료되었습니다">
                같은 idempotency key 재전송은 기존 retry ID를 반환합니다.
              </Notice>
            ) : null}
          </CardContent>
          <CardFooter className="justify-between">
            <span className="text-xs text-muted-foreground">
              입력과 기존 행은 실패해도 유지됩니다.
            </span>
            <Button
              onClick={() =>
                setStatus(status === "failed" ? "requested" : "completed")
              }
            >
              <RotateCcw data-icon="inline-start" />
              {status === "failed" ? "다시 실행" : "결과 갱신"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </OpsPage>
  )
}

export function OpsServicePrototype() {
  const [assignment, setAssignment] = useState("미배정")
  return (
    <OpsPage
      title="서비스 운영"
      description="지원 사건과 장애를 분리하고, 상태 변경 실패 시 화면과 서버의 이전 상태를 유지합니다."
      level="L1"
      capability="ops.service.manage"
    >
      <div className="grid gap-6">
        <MetricRow
          items={[
            { label: "열린 지원 사건", value: "18건", detail: "미배정 3건" },
            { label: "진행 장애", value: "2건", detail: "SEV-1 없음" },
            { label: "관찰 중", value: "4건", detail: "최근 24시간" },
            { label: "평균 해결", value: "3시간 18분", detail: "최근 30일" },
          ]}
        />
        <Tabs defaultValue="support">
          <TabsList>
            <TabsTrigger value="support">지원 사건</TabsTrigger>
            <TabsTrigger value="incident">장애</TabsTrigger>
          </TabsList>
          <TabsContent value="support" className="mt-3">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>사건</TableHead>
                    <TableHead>조직</TableHead>
                    <TableHead>분류</TableHead>
                    <TableHead>담당자</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">행동</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>SUP-2018</TableCell>
                    <TableCell>org_***41</TableCell>
                    <TableCell>공유 링크</TableCell>
                    <TableCell>{assignment}</TableCell>
                    <TableCell>
                      <Badge variant="outline">조사</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() =>
                          setAssignment(
                            assignment === "미배정" ? "조민영" : "미배정"
                          )
                        }
                      >
                        배정
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="incident" className="mt-3">
            <Notice
              tone="warning"
              title="INC-0261 · Email delivery 지연"
              action={
                <Button size="sm" variant="outline">
                  소유자 배정
                </Button>
              }
            >
              ap-northeast-2 · 영향 12 requests · 관찰 중
            </Notice>
          </TabsContent>
        </Tabs>
        <AuditReceipt
          id="EVT-91D2"
          title="지원 사건 상태 변경"
          meta="조사 → 관찰 · actor operator_018 · safe result"
        />
      </div>
    </OpsPage>
  )
}

export function OpsRevenuePrototype() {
  const [webhookState, setWebhookState] = useState("failed")
  return (
    <OpsPage
      title="매출 운영"
      description="구독 entitlement, 사용량, 결제 webhook 요청 결과와 최종 결제 상태를 서로 다른 사실로 표시합니다."
      level="L1"
      capability="ops.billing.manage"
    >
      <div className="grid gap-6">
        <MetricRow
          items={[
            { label: "활성 조직", value: "184개", detail: "Pro 62 · Core 122" },
            {
              label: "월 반복 매출",
              value: "84,620,400.00 KRW",
              detail: "환불 제외",
            },
            {
              label: "처리 대기 webhook",
              value: "3건",
              detail: "영구 실패 1건",
            },
            { label: "사용량 지연", value: "0건", detail: "집계 기준 09:00" },
          ]}
        />
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>조직</TableHead>
                  <TableHead>상품</TableHead>
                  <TableHead>구독</TableHead>
                  <TableHead>Capability</TableHead>
                  <TableHead className="text-right">사용량</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>org_***41</TableCell>
                  <TableCell>Trade Pro</TableCell>
                  <TableCell>
                    <Badge variant="secondary">활성</Badge>
                  </TableCell>
                  <TableCell>reports.export</TableCell>
                  <TableCell className="text-right tabular-nums">8,421 / 20,000</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>org_***19</TableCell>
                  <TableCell>Trade Core</TableCell>
                  <TableCell>
                    <Badge variant="outline">유예</Badge>
                  </TableCell>
                  <TableCell>delivery.email</TableCell>
                  <TableCell className="text-right tabular-nums">1,902 / 5,000</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>결제 webhook</CardTitle>
              <CardDescription>
                재처리 요청은 결제 성공이 아닙니다.
              </CardDescription>
              <CardAction>
                <Badge
                  variant={
                    webhookState === "failed" ? "destructive" : "outline"
                  }
                >
                  {webhookState === "failed" ? "실패" : "요청됨"}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <p>evt_***9CA · invoice.payment</p>
              <p className="text-muted-foreground">
                safe error: PROVIDER_TIMEOUT
              </p>
              {webhookState === "requested" ? (
                <Notice tone="info" title="재처리를 요청했습니다">
                  최종 결제 상태는 provider 사건 수신 후 갱신됩니다.
                </Notice>
              ) : null}
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={() => setWebhookState("requested")}>
                <RefreshCcw data-icon="inline-start" />
                재처리
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </OpsPage>
  )
}

export function OpsOperatorsPrototype() {
  const [role, setRole] = useState("support")
  const [savedRole, setSavedRole] = useState("support")
  return (
    <OpsPage
      title="플랫폼 운영자"
      description="고객 조직 역할과 Platform operator 권한을 분리하고 action별 capability로 고위험 작업을 제한합니다."
      level="L3"
      capability="ops.operator.manage"
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>운영자</TableHead>
                <TableHead>현재 역할</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>최근 활동</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <p className="font-medium">operator_018</p>
                  <p className="text-xs text-muted-foreground">
                    o***@ecoya.example
                  </p>
                </TableCell>
                <TableCell>{savedRole}</TableCell>
                <TableCell>
                  <Badge variant="secondary">활성</Badge>
                </TableCell>
                <TableCell>오늘 09:14</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <p className="font-medium">operator_042</p>
                  <p className="text-xs text-muted-foreground">
                    r***@ecoya.example
                  </p>
                </TableCell>
                <TableCell>security-reviewer</TableCell>
                <TableCell>
                  <Badge variant="outline">활성</Badge>
                </TableCell>
                <TableCell>어제 18:02</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>운영 역할 변경</CardTitle>
            <CardDescription>
              고객 Owner/Admin/Member 역할은 운영 권한이 아닙니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <label className="grid gap-1.5 text-sm">
              역할
              <Select
                value={role}
                onValueChange={(value) => value && setRole(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="support">support</SelectItem>
                    <SelectItem value="billing">billing</SelectItem>
                    <SelectItem value="security-reviewer">
                      security-reviewer
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </label>
            <Notice
              tone="warning"
              title="고위험 capability는 역할만으로 부여되지 않습니다"
            >
              개인정보 내보내기·삭제·보존 해제·조직 종료는 요청자와 승인자를
              분리합니다.
            </Notice>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={() => setSavedRole(role)}>저장</Button>
          </CardFooter>
        </Card>
      </div>
    </OpsPage>
  )
}

type PrivacyAction = "export" | "erasure" | "hold"

export function OpsPrivacyPrototype() {
  const [action, setAction] = useState<PrivacyAction>("export")
  const requirements = [
    "지원 요청 SUP-2031",
    "재인증 8분 전",
    "별도 승인자 operator_042",
    "preview rev-4 · digest 일치",
  ]
  return (
    <OpsPage
      title="개인정보 운영"
      description="민감 원문 열람은 L2, 내보내기·삭제·법적 보존은 L3로 분리하고 처리 완료를 선표시하지 않습니다."
      level="L3"
      capability="ops.high_risk.request"
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="grid gap-4">
          <Tabs
            value={action}
            onValueChange={(value) => setAction(value as PrivacyAction)}
          >
            <TabsList>
              <TabsTrigger value="export">내보내기</TabsTrigger>
              <TabsTrigger value="erasure">삭제</TabsTrigger>
              <TabsTrigger value="hold">법적 보존</TabsTrigger>
            </TabsList>
          </Tabs>
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>
                {action === "export"
                  ? "사용자 데이터 내보내기"
                  : action === "erasure"
                    ? "사용자 데이터 삭제"
                    : "법적 보존 적용·해제"}
              </CardTitle>
              <CardDescription>
                tenant org_***41 · user usr_***8A · 마스킹된 식별값만 표시
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <label className="grid gap-1.5 text-sm">
                닫힌 목적
                <Select defaultValue="privacy-request">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="privacy-request">
                        정보주체 요청 처리
                      </SelectItem>
                      <SelectItem value="legal">법무 지시</SelectItem>
                      <SelectItem value="support">고객 지원</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </label>
              <label className="grid gap-1.5 text-sm">
                사유
                <Textarea defaultValue="검증된 고객 요청 범위에 한해 처리" />
              </label>
              {action === "erasure" ? (
                <label className="grid gap-1.5 text-sm">
                  확인 문구
                  <Input defaultValue="usr_***8A 삭제" />
                </label>
              ) : null}
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                variant={action === "erasure" ? "destructive" : "default"}
              >
                {action === "export"
                  ? "내보내기 요청"
                  : action === "erasure"
                    ? "삭제 실행 요청"
                    : "보존 변경 요청"}
              </Button>
            </CardFooter>
          </Card>
        </div>
        <div className="grid content-start gap-4">
          <CapabilityGate
            capability={
              action === "export"
                ? "ops.privacy.export"
                : action === "erasure"
                  ? "ops.privacy.erase"
                  : "ops.privacy.legal_hold"
            }
            allowed={true}
            remedy=""
          />
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>실행 전 조건</CardTitle>
              <CardDescription>
                승인 시점에 모두 다시 검증합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {requirements.map((item) => (
                <div className="flex items-center gap-2 text-sm" key={item}>
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <AuditReceipt
            id="PRIV-01J9"
            title="영향 preview 생성"
            meta="scope digest · retain_until · legal hold 우선"
          />
        </div>
      </div>
    </OpsPage>
  )
}

export function OpsOffboardingPrototype() {
  const [stage, setStage] = useState<
    "plan" | "export" | "purge" | "certificate"
  >("plan")
  return (
    <OpsPage
      title="조직 종료"
      description="고객 Owner 요청, 별도 operator 승인, 서버 실행과 삭제 증명을 하나의 lineage로 관리합니다."
      level="L3"
      capability="ops.tenant.offboard"
    >
      <div className="grid gap-6">
        <div className="grid overflow-hidden rounded-lg border sm:grid-cols-4">
          {[
            { key: "plan", label: "1. 종료 계획" },
            { key: "export", label: "2. 내보내기" },
            { key: "purge", label: "3. 영구 삭제" },
            { key: "certificate", label: "4. 삭제 증명" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setStage(item.key as typeof stage)}
              className={cn(
                "border-b p-4 text-left text-sm font-medium last:border-b-0 hover:bg-muted sm:border-r sm:border-b-0 sm:last:border-r-0",
                stage === item.key && "bg-muted text-primary"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        {stage === "plan" ? (
          <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
            <div className="grid gap-3">
              <Notice
                tone="warning"
                title="법적 보존 1건으로 일부 데이터는 삭제할 수 없습니다"
              >
                legal hold가 retention 및 purge보다 우선합니다.
              </Notice>
              <MetricRow
                items={[
                  { label: "조직", value: "org_***41" },
                  { label: "종료 요청", value: "2026.08.01" },
                  { label: "복구 가능", value: "29일" },
                  { label: "삭제 가능", value: "부분 가능" },
                ]}
              />
            </div>
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>종료 계획</CardTitle>
                <CardDescription>
                  현재 차단·가능 단계를 서버 계획으로 확인합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <p>고객 Owner 요청: 확인</p>
                <p>활성 구독 종료: 대기</p>
                <p>내보내기 manifest: 미생성</p>
                <p>legal hold: 1건</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => setStage("export")}>
                  내보내기 준비
                  <ArrowRight data-icon="inline-end" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : stage === "export" ? (
          <Notice
            tone="info"
            title="내보내기 manifest 생성 중"
            action={
              <Button variant="outline" size="sm">
                상태 갱신
              </Button>
            }
          >
            완료 후 일회성 다운로드 권한을 별도로 발급합니다. 요청은 다운로드
            완료가 아닙니다.
          </Notice>
        ) : stage === "purge" ? (
          <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
            <Notice tone="danger" title="영구 삭제는 되돌릴 수 없습니다">
              요청자와 승인자가 달라야 하며 최신 legal hold와 preview를 승인
              시점에 재검증합니다.
            </Notice>
            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle>삭제 요청</CardTitle>
                <CardDescription>
                  불변 receipt가 만들어질 때까지 완료로 표시하지 않습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea defaultValue="고객 Owner 요청 OFF-2041에 따른 삭제" />
              </CardContent>
              <CardFooter className="justify-end">
                <Button variant="destructive">별도 승인 요청</Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>삭제 증명</CardTitle>
              <CardDescription>
                완료된 범위만 읽기 전용 불변 영수증으로 제공합니다.
              </CardDescription>
              <CardAction>
                <Badge variant="secondary">완료</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <AuditReceipt
                id="PURGE-CERT-019"
                title="삭제 증명 발급"
                meta="완료 2026.07.14 03:20 · legal hold 제외 · manifest digest 고정"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </OpsPage>
  )
}

type RiskState = "classified" | "unclassified" | "stale" | "unsupported"

export function OpsAiWorkersPrototype() {
  const [riskState, setRiskState] = useState<RiskState>("classified")
  const [decisionReason, setDecisionReason] = useState(
    "표시된 evidence와 대상 action 범위를 확인함"
  )
  const canDecide = riskState === "classified"
  return (
    <OpsPage
      title="AI 작업 운영"
      description="AI 작업, 제안 행동과 사람의 승인 결정을 분리하고 위험평가 revision을 불변 snapshot으로 보존합니다."
      level="L3"
      capability="ops.ai_approval.decide"
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-5">
          <MetricRow
            items={[
              { label: "실행 중 작업", value: "8건" },
              { label: "대기 행동", value: "14건" },
              { label: "승인 요청", value: "3건" },
              { label: "재평가 필요", value: "1건" },
            ]}
          />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>요청</TableHead>
                  <TableHead>대상 행동</TableHead>
                  <TableHead>risk</TableHead>
                  <TableHead>revision</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="cursor-pointer">
                  <TableCell>AIA-2048</TableCell>
                  <TableCell>거래 필드 변경 제안</TableCell>
                  <TableCell>
                    <Badge variant="destructive">82 · high</Badge>
                  </TableCell>
                  <TableCell>rev-3</TableCell>
                  <TableCell>승인 대기</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>AIA-2041</TableCell>
                  <TableCell>문서 재분류</TableCell>
                  <TableCell>
                    <Badge variant="outline">위험평가 없음</Badge>
                  </TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>재평가 필요</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>불변 위험평가 이력</CardTitle>
              <CardDescription>
                재평가해도 최초 snapshot을 덮어쓰지 않습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuditReceipt
                id="SNAP-rev-1"
                title="최초 평가 · medium 54"
                meta="model policy v1 · evidence ref 2개"
              />
              <AuditReceipt
                id="SNAP-rev-2"
                title="재평가 · high 78"
                meta="새 evidence ref 추가"
              />
              <AuditReceipt
                id="SNAP-rev-3"
                title="현재 표시 · high 82"
                meta="digest 19fc…0a71"
              />
            </CardContent>
          </Card>
        </div>
        <Card className="h-fit rounded-lg xl:sticky xl:top-20">
          <CardHeader>
            <CardTitle>승인 요청 AIA-2048</CardTitle>
            <CardDescription>
              화면에 표시한 revision과 제출 revision을 고정합니다.
            </CardDescription>
            <CardAction>
              <Select
                value={riskState}
                onValueChange={(value) => setRiskState(value as RiskState)}
              >
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="classified">분류 완료</SelectItem>
                    <SelectItem value="unclassified">미분류</SelectItem>
                    <SelectItem value="stale">revision 충돌</SelectItem>
                    <SelectItem value="unsupported">지원하지 않음</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-4">
            {riskState === "classified" ? (
              <>
                <div className="grid gap-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">위험 점수</span>
                    <span className="text-2xl font-semibold text-destructive">
                      82
                    </span>
                  </div>
                  <Progress value={82} />
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="destructive">high</Badge>
                    <Badge variant="outline">financial-impact</Badge>
                    <Badge variant="outline">external-action</Badge>
                  </div>
                </div>
                <Notice tone="warning" title="안전한 evidence reference 2개">
                  원문 payload 대신 허용된 참조만 표시합니다.
                </Notice>
              </>
            ) : riskState === "unclassified" ? (
              <Notice
                tone="warning"
                title="위험평가 없음(기존 요청)"
                action={
                  <Button size="sm" variant="outline">
                    재평가
                  </Button>
                }
              >
                승인·반려할 수 없습니다.
              </Notice>
            ) : riskState === "stale" ? (
              <Notice
                tone="danger"
                title="최신 위험평가가 도착했습니다"
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRiskState("classified")}
                  >
                    비교 보기
                  </Button>
                }
              >
                입력한 결정 사유는 유지되고 pending 상태도 바뀌지 않습니다.
              </Notice>
            ) : (
              <Notice title="지원하지 않는 위험평가 버전">
                읽기 전용입니다. 기존 snapshot과 사건은 숨기지 않습니다.
              </Notice>
            )}
            <label className="grid gap-1.5 text-sm">
              결정 사유
              <Textarea
                value={decisionReason}
                onChange={(event) => setDecisionReason(event.target.value)}
              />
            </label>
            <CapabilityGate
              capability="ops.ai_approval.decide_high_risk"
              allowed={canDecide}
              remedy="현재 평가 상태에서는 결정할 수 없습니다. 먼저 재평가 또는 revision 비교를 완료하세요."
            />
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button variant="outline" disabled={!canDecide}>
              반려
            </Button>
            <Button disabled={!canDecide}>표시 revision 승인</Button>
          </CardFooter>
        </Card>
      </div>
    </OpsPage>
  )
}

const screenOptions: Array<{
  key: ErpExtendedScreenKey
  label: string
  group: string
}> = [
  { key: "public-landing", label: "공개 랜딩", group: "공개·인증" },
  { key: "auth", label: "로그인·가입", group: "공개·인증" },
  { key: "invite", label: "초대 수락", group: "공개·인증" },
  { key: "legal", label: "법률 문서", group: "공개·인증" },
  { key: "erp-entry", label: "ERP 진입", group: "공개·인증" },
  { key: "generated-documents", label: "발행 문서", group: "문서·전달" },
  { key: "document-delivery", label: "문서 전달", group: "문서·전달" },
  { key: "public-share", label: "공개 공유", group: "문서·전달" },
  { key: "intelligence", label: "인텔리전스", group: "확장 업무" },
  { key: "sales", label: "영업 파이프라인", group: "확장 업무" },
  { key: "ops-control", label: "운영 통제", group: "Platform Ops" },
  { key: "ops-recovery", label: "실패 작업 복구", group: "Platform Ops" },
  { key: "ops-service", label: "서비스 운영", group: "Platform Ops" },
  { key: "ops-revenue", label: "매출 운영", group: "Platform Ops" },
  { key: "ops-operators", label: "플랫폼 운영자", group: "Platform Ops" },
  { key: "ops-privacy", label: "개인정보 운영", group: "Platform Ops" },
  { key: "ops-offboarding", label: "조직 종료", group: "Platform Ops" },
  { key: "ops-ai-workers", label: "AI 작업 운영", group: "Platform Ops" },
]

function RenderExtendedScreen({ screen }: { screen: ErpExtendedScreenKey }) {
  switch (screen) {
    case "public-landing":
      return <PublicLandingPrototype />
    case "auth":
      return <AuthPrototype />
    case "invite":
      return <InviteAcceptPrototype />
    case "legal":
      return <LegalEntryPrototype />
    case "erp-entry":
      return <ErpEntryPrototype />
    case "generated-documents":
      return <GeneratedDocumentsPrototype />
    case "document-delivery":
      return <DocumentDeliveryPrototype />
    case "public-share":
      return <PublicSharePrototype />
    case "intelligence":
      return <IntelligencePrototype />
    case "sales":
      return <SalesPrototype />
    case "ops-control":
      return <OpsControlPrototype />
    case "ops-recovery":
      return <OpsRecoveryPrototype />
    case "ops-service":
      return <OpsServicePrototype />
    case "ops-revenue":
      return <OpsRevenuePrototype />
    case "ops-operators":
      return <OpsOperatorsPrototype />
    case "ops-privacy":
      return <OpsPrivacyPrototype />
    case "ops-offboarding":
      return <OpsOffboardingPrototype />
    case "ops-ai-workers":
      return <OpsAiWorkersPrototype />
  }
}

export function ErpExtendedPrototype({
  screen: controlledScreen,
  onScreenChange,
}: {
  screen?: ErpExtendedScreenKey
  onScreenChange?: (screen: ErpExtendedScreenKey) => void
}) {
  const [internalScreen, setInternalScreen] = useState<ErpExtendedScreenKey>(
    "generated-documents"
  )
  const screen = controlledScreen ?? internalScreen
  const setScreen = (next: ErpExtendedScreenKey) => {
    if (controlledScreen === undefined) setInternalScreen(next)
    onScreenChange?.(next)
  }

  return (
    <div className="relative h-full min-h-[720px] bg-background">
      <div className="absolute top-3 right-3 z-50 w-[min(280px,calc(100%-1.5rem))]">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="rounded-lg border bg-background/95 p-2 shadow-sm backdrop-blur">
              <Select
                value={screen}
                onValueChange={(value) =>
                  setScreen(value as ErpExtendedScreenKey)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {screenOptions.find((item) => item.key === screen)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="end">
                  {["공개·인증", "문서·전달", "확장 업무", "Platform Ops"].map(
                    (group) => (
                      <SelectGroup key={group}>
                        <SelectLabel>{group}</SelectLabel>
                        {screenOptions
                          .filter((item) => item.group === group)
                          .map((item) => (
                            <SelectItem key={item.key} value={item.key}>
                              {item.label}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          <TooltipContent>확장 SSOT 화면 전환</TooltipContent>
        </Tooltip>
      </div>
      <div className="h-full overflow-auto">
        <RenderExtendedScreen screen={screen} />
      </div>
    </div>
  )
}

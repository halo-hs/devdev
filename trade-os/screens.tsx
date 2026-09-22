import {
  readBankCashRecords,
  bankScheduleFixtures,
} from "@trade-os/lib/erp-document-workflow"
import { presentFinanceFact } from "@trade-os/lib/erp-finance"
import { decimalMagnitude, FINANCE_DECIMAL_SCALE } from "@trade-os/lib/financeDecimal"
import { formatScaledMoney, normalizeDecimalInput } from "@trade-os/lib/money"
import {
  shipmentReviewSamples,
  settlementLedgerRows as baseLedgerRows,
  salesCustomerSamples,
  salesMonthlySamples,
} from "@trade-os/lib/erp-menu-samples"
import { useRef, useState, type ReactNode } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  ArrowRight,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  Loader2,
  MessageSquare,
  Paperclip,
  PanelRight,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Ship,
  ShieldAlert,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Trash2,
  Upload,
  UserPlus,
  WalletCards,
  X,
} from "lucide-react"

import { Badge } from "@shared/components/ui/badge"
import { SummaryMetricStrip } from "@shared/components/summary-metric-strip"
import { BusinessPageHero } from "@shared/components/business-page-hero"
import { Button } from "@shared/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@shared/components/ui/chart"
import { Input } from "@shared/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog"
import { SubmittedSearchInput } from "@shared/components/ui/submitted-search-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@shared/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"
import { TablePagination } from "@shared/components/ui/table-pagination"
import { Textarea } from "@shared/components/ui/textarea"
import { cn } from "@shared/lib/utils"
import { prototypeBackend } from "@trade-os/lib/prototype-backend"
import {
  SettingsHubV2,
  type ProductEntitlement,
  type SettingsRole,
} from "@share/settings/page"
import type { WorkspaceKey } from "@shared/lib/workspaces"
import { toast } from "sonner"
import { MonitoringOperationsContent } from "@trade-os/documents/handoff-panels"
import { AiBusinessTools } from "@trade-os/ask/business-tools"
import { aiHandoffCopy } from "@trade-os/lib/ai-handoff-copy"

export type ErpMenuTarget =
  | "onboarding"
  | "home"
  | "inbox"
  | "create"
  | "ask"
  | "deals"
  | "deal"
  | "shipments"
  | "settlement"
  | "monitoring"
  | "reports"
  | "sales"
  | "notifications"
  | "settings"
  | "counterparty"
  | "snap"
  | "billing"
  | "tokens"

type Navigate = (
  screen: ErpMenuTarget,
  options?: {
    question?: string
    submit?: boolean
    dealId?: string
    documentName?: string
  }
) => void
type Tone = "neutral" | "blue" | "green" | "amber" | "red"

const toneClasses: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  blue: "bg-primary/10 text-primary",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
}

function Status({
  children,
  tone = "neutral",
}: {
  children: ReactNode
  tone?: Tone
}) {
  return (
    <Badge
      variant="secondary"
      className={cn("border-0 font-medium", toneClasses[tone])}
    >
      {children}
    </Badge>
  )
}

function Page({
  title,
  description,
  eyebrow,
  action,
  centerHeader = false,
  spaciousHeader = false,
  aiEntryHeader = false,
  analyticsLayout = false,
  heroControls,
  heroSummary,
  children,
}: {
  title: string
  description: string
  eyebrow?: string
  action?: ReactNode
  centerHeader?: boolean
  spaciousHeader?: boolean
  aiEntryHeader?: boolean
  analyticsLayout?: boolean
  heroControls?: ReactNode
  heroSummary?: ReactNode
  children: ReactNode
}) {
  return (
    <div
      data-slot="business-page"
      data-analytics-layout={analyticsLayout || undefined}
      className="h-full overflow-y-auto bg-background"
    >
      <div className="w-full px-5 py-5 sm:px-6 sm:py-6 xl:px-8">
        <BusinessPageHero
          className="[&_header]:flex-wrap"
          variant={aiEntryHeader ? "ai" : "default"}
          title={title}
          description={description}
          eyebrow={
            eyebrow ? (
              <span className="inline-flex items-center gap-1.5">
                {eyebrow}
              </span>
            ) : undefined
          }
          actions={action}
          controls={analyticsLayout ? undefined : heroControls}
          summary={heroSummary}
          align={centerHeader ? "center" : "start"}
          titleClassName={cn(
            aiEntryHeader && "mt-3 text-[26px] leading-tight sm:text-[34px]"
          )}
          descriptionClassName={cn(aiEntryHeader && "mt-6")}
        />
        {analyticsLayout && heroControls ? (
          <div data-slot="business-page-filters" className="mt-6">
            {heroControls}
          </div>
        ) : null}
        <div
          data-slot="business-page-body"
          className={cn(
            heroSummary
              ? "mt-6"
              : aiEntryHeader
                ? "mt-7"
                : spaciousHeader
                  ? "mt-10 sm:mt-12"
                  : "mt-6"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function AnalyticsFilterBar({ children }: { children: ReactNode }) {
  return (
    <div
      data-slot="analytics-filter-bar"
      className="flex flex-wrap items-end gap-3"
    >
      {children}
    </div>
  )
}

const fullNumber = (value: number, fractionDigits = 2) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)

const fullMoney = (value: number, currency: string) => {
  const fractionDigits = currency === "KRW" || currency === "JPY" ? 0 : 2
  return `${fullNumber(value, fractionDigits)} ${currency}`
}

const expandCompactAmount = (value: string, currency: string) => {
  const normalized = value.trim().toUpperCase()
  const match = normalized.match(/^(-?[\d.]+)([KM])?$/)
  if (!match) return `${value} ${currency}`
  const multiplier = match[2] === "M" ? 1_000_000 : match[2] === "K" ? 1_000 : 1
  return fullMoney(Number(match[1]) * multiplier, currency)
}

function SectionHeader({
  title,
  description,
  trailing,
}: {
  title: string
  description?: string
  trailing?: ReactNode
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description ? (
          <p className="mt-2 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {trailing}
    </div>
  )
}

function ContentPanel({
  children,
  className,
  id,
}: {
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <Card
      id={id}
      className={cn(
        "!block !gap-0 overflow-hidden !py-0 shadow-none",
        className
      )}
    >
      <div data-slot="content-panel-content" className="p-4 sm:p-5">
        {children}
      </div>
    </Card>
  )
}

function PanelTable({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div data-slot="panel-table" className={cn("-mx-4 sm:-mx-5", className)}>
      {children}
    </div>
  )
}

const guideItems = [
  ["회사 정보 입력", "Settings > Company profile"],
  ["팀원 초대", "Settings > Member management"],
  ["초기 문서 가져오기", "최근 인보이스, PO, B/L 업로드"],
  ["첫 거래 검토", "첫 Confirm 완료 시 자동 체크"],
  ["첫 문서 업로드", "Inbox UploadZone으로 이동"],
  ["첫 Confirm 완료", "Confirm 완료 시 자동 체크"],
] as const

const initialCompanyProfile = {
  legalName: "ECOYA Demo Co.",
  displayName: "ECOYA",
  taxId: "",
  registrationNo: "",
  addressLine1: "서울특별시 강남구 테헤란로 123",
  addressLine2: "",
  city: "서울",
  countryCode: "KR",
  phone: "+82 2-1234-5678",
  email: "ops@ecoya.app",
  currency: "USD",
  timezone: "Asia/Seoul",
  language: "ko",
  bankName: "",
  bankAccount: "",
  bankSwift: "",
  signatoryName: "",
  accent: "#397dcc",
  font: "sans",
}

type CompanyProfileDraft = typeof initialCompanyProfile
type CompanyProfileKey = keyof CompanyProfileDraft

function CompanyProfileOnboardingForm({
  profile,
  onChange,
  files,
  onFileChange,
}: {
  profile: CompanyProfileDraft
  onChange: (key: CompanyProfileKey, value: string) => void
  files: Record<"registration" | "signature" | "logo", string>
  onFileChange: (
    key: "registration" | "signature" | "logo",
    fileName: string
  ) => void
}) {
  const textField = (
    key: CompanyProfileKey,
    label: string,
    options?: { placeholder?: string; type?: string }
  ) => (
    <label className="space-y-1.5 text-sm" key={key}>
      <span className="font-medium">{label}</span>
      <Input
        type={options?.type ?? "text"}
        value={profile[key]}
        placeholder={options?.placeholder}
        onChange={(event) => onChange(key, event.target.value)}
      />
    </label>
  )

  const fileField = (
    key: "registration" | "signature" | "logo",
    label: string,
    accept: string,
    help: string
  ) => (
    <div className="space-y-1.5 text-sm" key={key}>
      <span className="font-medium">{label}</span>
      <div className="flex min-h-10 min-w-0 items-center gap-3 rounded-[var(--ui-radius-control)] border border-input bg-background px-3">
        <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 font-medium">
          <Upload className="size-4" />
          파일 선택
          <input
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(event) =>
              onFileChange(key, event.target.files?.[0]?.name ?? "")
            }
          />
        </label>
        <span className="min-w-0 truncate text-muted-foreground">
          {files[key] || "선택된 파일 없음"}
        </span>
      </div>
      <span className="block text-xs text-muted-foreground">{help}</span>
    </div>
  )

  return (
    <div className="divide-y">
      <section className="grid gap-5 py-5 lg:grid-cols-[180px_minmax(0,1fr)]">
        <div>
          <h3 className="font-semibold">회사 기본정보</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            생성 문서의 발행자 정보와 사업자 증빙에 사용됩니다.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {textField("legalName", "법인명")}
          {textField("displayName", "표시명")}
          {textField("taxId", "사업자번호", {
            placeholder: "사업자번호 입력",
          })}
          {textField("registrationNo", "사업자등록번호", {
            placeholder: "등록번호 입력",
          })}
          <div className="sm:col-span-2">
            {fileField(
              "registration",
              "사업자등록증",
              "application/pdf,image/png,image/jpeg",
              "PDF, PNG, JPG · 1MB 이하 권장"
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-5 py-5 lg:grid-cols-[180px_minmax(0,1fr)]">
        <div>
          <h3 className="font-semibold">주소와 연락처</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            계약서, 인보이스의 회사 주소와 연락처에 표시됩니다.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            {textField("addressLine1", "주소")}
          </div>
          <div className="sm:col-span-2">
            {textField("addressLine2", "상세 주소", {
              placeholder: "건물, 층, 호수",
            })}
          </div>
          {textField("city", "도시")}
          {textField("countryCode", "국가코드", { placeholder: "KR" })}
          {textField("phone", "전화", { type: "tel" })}
          {textField("email", "이메일", { type: "email" })}
        </div>
      </section>

      <section className="grid gap-5 py-5 lg:grid-cols-[180px_minmax(0,1fr)]">
        <div>
          <h3 className="font-semibold">업무 기준</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            만기 판정, 기본 금액, AI 응답 언어의 조직 기준입니다.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">기본 통화</span>
            <Select
              value={profile.currency}
              onValueChange={(value) => {
                if (value) onChange("currency", value)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["USD", "KRW", "EUR", "JPY", "CNY", "GBP"].map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">업무 타임존</span>
            <Select
              value={profile.timezone}
              onValueChange={(value) => {
                if (value) onChange("timezone", value)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Seoul">Asia/Seoul</SelectItem>
                <SelectItem value="Asia/Singapore">Asia/Singapore</SelectItem>
                <SelectItem value="Europe/London">Europe/London</SelectItem>
                <SelectItem value="America/New_York">
                  America/New_York
                </SelectItem>
              </SelectContent>
            </Select>
            <span className="block text-xs text-muted-foreground">
              받을 돈·보낼 돈의 만기와 연체 판정 기준
            </span>
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">AI 출력 언어</span>
            <Select
              value={profile.language}
              onValueChange={(value) => {
                if (value) onChange("language", value)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ko">한국어</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="zh-TW">繁體中文</SelectItem>
                <SelectItem value="pt-BR">Português</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>
      </section>

      <section className="grid gap-5 py-5 lg:grid-cols-[180px_minmax(0,1fr)]">
        <div>
          <h3 className="font-semibold">은행 정보</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            인보이스와 지급 안내 문서에 재사용됩니다.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {textField("bankName", "은행명", { placeholder: "은행명 입력" })}
          {textField("bankAccount", "계좌번호", {
            placeholder: "계좌번호 입력",
          })}
          {textField("bankSwift", "SWIFT", { placeholder: "SWIFT 코드" })}
        </div>
      </section>

      <section className="grid gap-5 py-5 lg:grid-cols-[180px_minmax(0,1fr)]">
        <div>
          <h3 className="font-semibold">문서 서명과 브랜드</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            확정 문서와 PDF에 자동으로 적용됩니다.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {textField("signatoryName", "서명자 이름·직책", {
            placeholder: "예: 조민영 / 대표이사",
          })}
          {fileField(
            "signature",
            "서명 이미지",
            "image/png,image/jpeg",
            "PNG, JPG · 200KB 이하 권장"
          )}
          {fileField(
            "logo",
            "회사 로고",
            "image/png,image/jpeg",
            "PNG, JPG · 200KB 이하 권장"
          )}
          <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">강조색</span>
              <Input
                type="color"
                value={profile.accent}
                onChange={(event) => onChange("accent", event.target.value)}
                className="h-9 cursor-pointer p-1"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">문서 폰트</span>
              <Select
                value={profile.font}
                onValueChange={(value) => {
                  if (value) onChange("font", value)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sans">고딕 (Sans)</SelectItem>
                  <SelectItem value="serif">명조 (Serif)</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>
        </div>
      </section>
    </div>
  )
}

export function OnboardingPrototype({ onNavigate }: { onNavigate: Navigate }) {
  const [step, setStep] = useState(0)
  const [completed, setCompleted] = useState<number[]>([0, 1])
  const [persona, setPersona] = useState("오너")
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "GP와 마진",
    "현금, AR, AP",
    "문서 누락",
  ])
  const [companyProfile, setCompanyProfile] = useState(initialCompanyProfile)
  const [companyFiles, setCompanyFiles] = useState({
    registration: "",
    signature: "",
    logo: "",
  })
  const [companySaved, setCompanySaved] = useState(false)
  const [onboardingFiles, setOnboardingFiles] = useState<File[]>([])
  const [suggestions, setSuggestions] = useState([
    ["ACME GmbH", "구매처 / 고객", "3개 문서"],
    ["KATAMAN ASIA-PACIFIC PTE LTD", "판매처 / 공급처", "2개 문서"],
    ["HMM Green", "양쪽 / 확인 필요", "1개 문서"],
  ])
  const [suggestionAction, setSuggestionAction] = useState<{
    id: string
    action: "approve" | "dismiss"
  } | null>(null)
  const [suggestionError, setSuggestionError] = useState("")
  const onboardingFileInputRef = useRef<HTMLInputElement>(null)
  const steps = [
    "회사 정보",
    "관심 정보 설정",
    "기존 문서 가져오기",
    "추천 거래처 검토",
    "설정 완료",
  ]
  const interestSignals = [
    "GP와 마진",
    "현금, AR, AP",
    "거래처 리스크",
    "문서 누락",
    "물류 준비도",
    "영업 담당자 수익성",
  ]

  const advance = () => {
    if (step === 0) setCompanySaved(true)
    setCompleted((items) => (items.includes(step) ? items : [...items, step]))
    setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  const selectOnboardingFiles = (files: FileList | null) => {
    if (!files) return

    setOnboardingFiles((current) => {
      const existing = new Set(
        current.map((file) => `${file.name}:${file.size}:${file.lastModified}`)
      )
      const additions = Array.from(files).filter((file) => {
        const key = `${file.name}:${file.size}:${file.lastModified}`
        return (
          (file.type === "application/pdf" ||
            file.name.toLowerCase().endsWith(".pdf")) &&
          !existing.has(key)
        )
      })

      return [...current, ...additions]
    })
  }

  return (
    <Page
      eyebrow="처음 시작하기"
      title="ECOYA Trade OS에 오신 것을 환영합니다"
      description="초기 설정과 첫 업무 준비 상태를 한 화면에서 이어서 완료합니다."
      action={
        <Button onClick={() => onNavigate("home")}>
          오늘 할 일로 이동 <ArrowRight />
        </Button>
      }
    >
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="min-w-0">
          <div className="flex items-center gap-2 overflow-x-auto border-b pb-4">
            {steps.map((label, index) => (
              <Button
                variant="ghost"
                key={label}
                onClick={() => setStep(index)}
                className={cn(
                  "h-auto min-w-32 justify-start gap-2 px-2 py-2 text-left text-sm text-muted-foreground",
                  step === index && "font-semibold text-primary"
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full bg-muted text-xs",
                    step === index && "bg-primary text-primary-foreground",
                    completed.includes(index) && "bg-success/10 text-success"
                  )}
                >
                  {completed.includes(index) ? (
                    <Check className="size-3.5" />
                  ) : (
                    index + 1
                  )}
                </span>
                {label}
              </Button>
            ))}
          </div>

          <div className="py-6">
            {step === 0 ? (
              <div>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold">회사 정보</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      자사 정보, 은행, 서명과 브랜드가 생성하는 모든 문서에
                      들어갑니다.
                    </p>
                  </div>
                  {companySaved ? (
                    <Status tone="green">저장됨</Status>
                  ) : (
                    <Status tone="amber">저장 필요</Status>
                  )}
                </div>
                <CompanyProfileOnboardingForm
                  profile={companyProfile}
                  files={companyFiles}
                  onChange={(key, value) => {
                    setCompanySaved(false)
                    setCompanyProfile((current) => ({
                      ...current,
                      [key]: value,
                    }))
                  }}
                  onFileChange={(key, fileName) => {
                    setCompanySaved(false)
                    setCompanyFiles((current) => ({
                      ...current,
                      [key]: fileName,
                    }))
                  }}
                />
              </div>
            ) : step === 1 ? (
              <div className="space-y-6">
                <div>
                  <div className="mb-2 text-sm font-medium">역할</div>
                  <div className="flex flex-wrap gap-2">
                    {["오너", "재무", "영업", "운영", "관리"].map((item) => (
                      <Button
                        key={item}
                        variant={persona === item ? "default" : "outline"}
                        aria-pressed={persona === item}
                        onClick={() => setPersona(item)}
                      >
                        {item}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="text-sm font-medium">관심 신호</div>
                    <Badge variant="secondary">
                      {selectedInterests.length}/{interestSignals.length}개 선택
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      복수 선택
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {interestSignals.map((item) => {
                      const selected = selectedInterests.includes(item)

                      return (
                        <Button
                          key={item}
                          variant="outline"
                          aria-pressed={selected}
                          onClick={() =>
                            setSelectedInterests((current) =>
                              selected
                                ? current.filter((value) => value !== item)
                                : [...current, item]
                            )
                          }
                          className={cn(
                            selected &&
                              "border-primary bg-primary/5 text-primary hover:bg-primary/10"
                          )}
                        >
                          {selected ? <Check className="size-3.5" /> : null}
                          {item}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : step === 2 ? (
              <div className="border-y py-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">기존 문서 가져오기</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      최근 인보이스, B/L, PO·SO PDF를 한 번에 추가합니다.
                    </p>
                  </div>
                  <Button
                    onClick={() => onboardingFileInputRef.current?.click()}
                  >
                    <Upload /> PDF 문서 선택
                  </Button>
                  <input
                    ref={onboardingFileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      selectOnboardingFiles(event.target.files)
                      event.target.value = ""
                    }}
                  />
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    ["최근 인보이스", "거래처·금액·결제조건"],
                    ["B/L", "항로·컨테이너·ETA"],
                    ["PO 또는 SO", "품목·수량·단가"],
                  ].map(([title, detail]) => (
                    <div
                      key={title}
                      className="border-l-2 border-primary px-3 py-2"
                    >
                      <div className="text-sm font-medium">{title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {detail}
                      </div>
                    </div>
                  ))}
                </div>
                {onboardingFiles.length > 0 ? (
                  <div className="mt-5 border-t pt-4">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="text-sm font-medium">선택한 문서</div>
                      <Badge variant="secondary">
                        {onboardingFiles.length}개
                      </Badge>
                    </div>
                    <ul className="divide-y">
                      {onboardingFiles.map((file) => (
                        <li
                          key={`${file.name}:${file.size}:${file.lastModified}`}
                          className="flex min-h-10 items-center justify-between gap-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {file.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`${file.name} 선택 해제`}
                            onClick={() =>
                              setOnboardingFiles((current) =>
                                current.filter(
                                  (item) =>
                                    !(
                                      item.name === file.name &&
                                      item.size === file.size &&
                                      item.lastModified === file.lastModified
                                    )
                                )
                              )
                            }
                          >
                            <X />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : step === 3 ? (
              <div className="divide-y">
                {suggestions.map(([name, role, docs]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <div>
                      <div className="font-medium">{name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {role} · {docs}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        disabled={suggestionAction?.id === name}
                        onClick={async () => {
                          setSuggestionError("")
                          setSuggestionAction({ id: name, action: "dismiss" })
                          try {
                            await prototypeBackend.onboarding.dismissSuggestion(
                              name
                            )
                            setSuggestions((items) =>
                              items.filter(([item]) => item !== name)
                            )
                          } catch {
                            setSuggestionError(
                              "추천 거래처를 제외하지 못했습니다."
                            )
                          } finally {
                            setSuggestionAction(null)
                          }
                        }}
                      >
                        {suggestionAction?.id === name &&
                        suggestionAction.action === "dismiss" ? (
                          <Loader2 className="animate-spin" />
                        ) : null}
                        제외
                      </Button>
                      <Button
                        variant="outline"
                        disabled={suggestionAction?.id === name}
                        onClick={async () => {
                          setSuggestionError("")
                          setSuggestionAction({ id: name, action: "approve" })
                          try {
                            await prototypeBackend.onboarding.approveSuggestion(
                              name
                            )
                            setSuggestions((items) =>
                              items.filter(([item]) => item !== name)
                            )
                          } catch {
                            setSuggestionError(
                              "추천 거래처를 승인하지 못했습니다."
                            )
                          } finally {
                            setSuggestionAction(null)
                          }
                        }}
                      >
                        {suggestionAction?.id === name &&
                        suggestionAction.action === "approve" ? (
                          <Loader2 className="animate-spin" />
                        ) : null}
                        승인
                      </Button>
                    </div>
                  </div>
                ))}
                {suggestions.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    검토할 추천 거래처가 없습니다.
                  </div>
                ) : null}
                {suggestionError ? (
                  <p className="py-3 text-sm text-destructive">
                    {suggestionError}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="py-10 text-center">
                <CheckCircle2 className="mx-auto size-10 text-success" />
                <h3 className="mt-4 text-xl font-semibold">설정 완료</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  기본 설정이 준비되었습니다. 이제 거래 업무를 시작해 보세요.
                </p>
                <div className="mt-5 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onNavigate("settings")}
                  >
                    <UserPlus /> 팀원 초대
                  </Button>
                  <Button onClick={() => onNavigate("deals")}>거래 보기</Button>
                </div>
              </div>
            )}
          </div>
          {step < steps.length - 1 ? (
            <div className="flex justify-between border-t pt-4">
              <Button
                variant="ghost"
                disabled={step === 0}
                onClick={() => setStep((value) => Math.max(0, value - 1))}
              >
                이전
              </Button>
              <Button onClick={advance}>
                {step === 0 ? "저장하고 다음" : "다음"} <ArrowRight />
              </Button>
            </div>
          ) : null}
        </section>

        <aside className="border-l pl-6">
          <SectionHeader
            title="시작 가이드"
            description={`${completed.length}/${guideItems.length} 완료`}
          />
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary"
              style={{
                width: `${(completed.length / guideItems.length) * 100}%`,
              }}
            />
          </div>
          <div className="mt-4 divide-y">
            {guideItems.map(([title, meta], index) => (
              <Button
                variant="ghost"
                key={title}
                onClick={() =>
                  setCompleted((items) =>
                    items.includes(index) ? items : [...items, index]
                  )
                }
                className="h-auto w-full justify-start gap-3 rounded-none py-3 text-left font-normal"
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full bg-muted",
                    completed.includes(index) && "bg-success/10 text-success"
                  )}
                >
                  {completed.includes(index) ? (
                    <Check className="size-3.5" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {meta}
                  </span>
                </span>
                {completed.includes(index) ? (
                  <Status tone="green">완료됨</Status>
                ) : (
                  <ArrowRight className="size-4 text-muted-foreground" />
                )}
              </Button>
            ))}
          </div>
        </aside>
      </div>
    </Page>
  )
}

const workItems = [
  {
    group: "지금 처리",
    title: "인보이스 단가 1건 확인",
    reason: "거래 연결이 차단되어 있습니다.",
    due: "지금",
    target: "inbox" as const,
    cta: "필드 확인",
    roles: ["Member", "Admin"],
  },
  {
    group: "지금 처리",
    title: "B/L 증명과 포장명세 대조",
    reason: "수량 4MT가 일치하지 않습니다.",
    due: "11:30",
    target: "deal" as const,
    cta: "서류 검증",
    roles: ["Member", "Admin"],
  },
  {
    group: "오늘 안에",
    title: "ACME GmbH 받을 돈 기록",
    reason: "오늘 만기인 AR 42,000.00 USD입니다.",
    due: "오늘",
    target: "settlement" as const,
    cta: "입금 기록",
    roles: ["Member", "Admin"],
  },
  {
    group: "오늘 안에",
    title: "부산항 도착 선적 확인",
    reason: "ETA가 2일 남았고 B/L이 누락되었습니다.",
    due: "D-2",
    target: "shipments" as const,
    cta: "선적 보기",
    roles: ["Member", "Admin"],
  },
  {
    group: "지금 처리",
    title: "연체 42,000.00 USD 위험 확인",
    reason: "담당자의 회수 계획과 고객 응답을 확인해야 합니다.",
    due: "지금",
    target: "settlement" as const,
    cta: "위험 보기",
    roles: ["Admin", "Owner"],
  },
  {
    group: "확인 필요",
    title: "운영 예외 2건 담당자 확인",
    reason: "기한 전 조치 담당자가 지정되지 않았습니다.",
    due: "오늘",
    target: "monitoring" as const,
    cta: "예외 보기",
    roles: ["Admin", "Owner"],
  },
]

export function HomePrototype({ onNavigate }: { onNavigate: Navigate }) {
  const [role, setRole] = useState("Member")
  const [question, setQuestion] = useState("")
  const visible = workItems.filter((item) => item.roles.includes(role))
  const grouped = ["지금 처리", "오늘 안에", "확인 필요"]
    .map((group) => ({
      group,
      items: visible.filter((item) => item.group === group),
    }))
    .filter((section) => section.items.length > 0)
  const dashboardMetrics = [
    {
      label: "진행 거래",
      value: role === "Owner" ? "12" : "3",
      note: role === "Owner" ? "조직 전체" : "내 담당",
    },
    {
      label: "거래액",
      value: role === "Owner" ? "2,400,000.00 USD" : "720,000.00 USD",
      note: "USD",
    },
    {
      label: role === "Member" ? "오늘 처리" : "조정 GP",
      value: role === "Member" ? `${visible.length}건` : "-12,000.00 USD",
      note: role === "Member" ? "내 실행 업무" : "검토 필요",
    },
    {
      label: role === "Member" ? "기한 임박" : "GP 리스크",
      value: role === "Member" ? "2건" : "1건",
      note: role === "Member" ? "7일 이내" : "손실",
    },
    { label: "AR/AP 만기", value: "2건", note: "7일 이내" },
    { label: "서류 갭", value: "1건", note: "B/L 누락" },
    { label: "선적 리스크", value: "2건", note: "ETA 임박" },
  ]
  const entryActions =
    role === "Owner"
      ? [
          [
            "운영 감시",
            "예외와 조치 진행 상태 확인",
            ShieldAlert,
            "monitoring",
          ],
          ["결산 리포트", "월 마감과 공식 수치 확인", ClipboardList, "reports"],
          ["영업 성과", "거래처와 담당자 성과 확인", TrendingUp, "sales"],
          ["거래 보기", "위험 거래와 근거 문서 확인", Building2, "deals"],
          ["AI에게 묻기", "조직 데이터를 자연어로 조회", Bot, "ask"],
        ]
      : [
          ["파일 올리기", "PDF를 올려 거래 필드 추출", Upload, "inbox"],
          ["문서 만들기", "거래 데이터로 업무 문서 작성", Sparkles, "create"],
          ["AI에게 묻기", "거래와 정산 데이터를 질문", Bot, "ask"],
          ["거래 보기", "진행 중 거래와 상태 확인", Building2, "deals"],
          ["정산", "받을 돈과 줄 돈 처리", WalletCards, "settlement"],
        ]
  const financeInsights =
    role === "Owner"
      ? [
          ["현금 흐름", "7일 내 54,200.00 USD 순유입이 예상됩니다."],
          ["마진", "ACME GmbH 거래의 조정 GP가 손실 구간입니다."],
          ["환율 노출", "CNY 결제 1건이 금주 환율 변동에 노출되어 있습니다."],
        ]
      : [
          ["오늘 받을 돈", "ACME GmbH 42,000.00 USD가 오늘 만기입니다."],
          ["이번 주 줄 돈", "Sakura Logistics 28,000.00 USD가 D-2입니다."],
          ["담당 거래", "다중 통화 합산 없이 통화별로 표시합니다."],
        ]
  const fxRates = [
    ["FX/USD/BRL", "5.1155 BRL"],
    ["FX/USD/CNY", "6.7776 CNY"],
    ["FX/USD/EUR", "0.8754 EUR"],
    ["FX/USD/GBP", "0.7469 GBP"],
  ]
  const benchmarkRows = [
    ["fx usd brl", "5.1155 BRL", "2026.07.13 09:00", "BRL"],
    ["fx usd cny", "6.7776 CNY", "2026.07.13 09:00", "CNY"],
    ["fx usd eur", "0.8754 EUR", "2026.07.13 09:00", "EUR"],
    ["fx usd gbp", "0.7469 GBP", "2026.07.13 09:00", "GBP"],
    ["fx usd jpy", "162.14 JPY", "2026.07.13 09:00", "JPY"],
    ["fx usd krw", "1,494.09 KRW", "2026.07.13 09:00", "KRW"],
  ]
  const schedules = [
    ["오늘", "수금", "ACME GmbH", "42,000.00 USD"],
    ["07.16", "지급", "Sakura Logistics", "28,000.00 USD"],
    ["07.18", "선적", "BUSAN / HMM Green", "ETA 08.03"],
  ]
  return (
    <Page
      title="오늘 할 일"
      description="서류는 AI가 읽고 만들고, 당신은 확인과 의사결정에 집중합니다."
      action={
        <Select
          value={role}
          onValueChange={(value) => setRole(value ?? "Member")}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Member">Member</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="Owner">Owner</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      <div className="flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle>무엇이든 물어보세요</CardTitle>
            <CardDescription>
              사내 거래 데이터와 시장 지표를 자연어로 조회합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
              <Textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                className="min-h-28 resize-none sm:flex-1"
                placeholder="예: 이번 달 ACME 매출은?"
              />
              <Button
                className="sm:min-w-28"
                disabled={!question.trim()}
                onClick={() => onNavigate("ask", { question, submit: true })}
              >
                <Send /> 질문
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                "이번 달 ACME 매출은?",
                "확정 안 된 인보이스 몇 건?",
                "미수금 거래처는?",
              ].map((example) => (
                <Button
                  key={example}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuestion(example)}
                >
                  {example}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <ContentPanel>
          <SectionHeader
            title="업무 시작"
            description="업무를 실행할 화면으로 이동합니다."
          />
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {entryActions.map(([label, , Icon, target]) => (
              <Button
                key={label as string}
                variant="outline"
                className="h-11 justify-start gap-2 px-3 text-left"
                onClick={() => onNavigate(target as ErpMenuTarget)}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{label as string}</span>
              </Button>
            ))}
          </div>
        </ContentPanel>

        <ContentPanel>
          <SectionHeader
            title="작업함"
            description={`${role} 권한으로 실행 가능한 업무 ${visible.length}건`}
          />
          <div className="space-y-4">
            {grouped.map((section) => (
              <section key={section.group}>
                <PanelTable>
                  <Table className="table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left">
                          {section.group} {section.items.length}건
                        </TableHead>
                        <TableHead className="w-[100px] text-left">
                          기한
                        </TableHead>
                        <TableHead className="w-[120px]">작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {section.items.map((item) => (
                        <TableRow key={item.title}>
                          <TableCell className="h-auto py-3 text-left whitespace-normal">
                            <div className="font-medium">{item.title}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {item.reason}
                            </div>
                          </TableCell>
                          <TableCell className="text-left text-muted-foreground">
                            {item.due}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => onNavigate(item.target)}
                            >
                              {item.cta}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </PanelTable>
              </section>
            ))}
          </div>
        </ContentPanel>

        <section className="ui-summary-strip grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {dashboardMetrics.map((item) => (
            <div key={item.label} className="min-w-0 px-4 py-4">
              <div className="text-xs text-muted-foreground">{item.label}</div>
              <strong className="mt-1 block text-lg font-semibold">
                {item.value}
              </strong>
              <div className="mt-1 text-xs text-muted-foreground">
                {item.note}
              </div>
            </div>
          ))}
        </section>

        {role !== "Member" ? (
          <section className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>경영 브리프</CardTitle>
                <CardDescription>
                  거래·정산·선적 데이터를 기준으로 자동 요약합니다.
                </CardDescription>
                <CardAction>
                  <Status tone="blue">자동 요약</Status>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm">
                  미회수 연체와 조정 GP 손실이 가장 중요한 재무 경고입니다.
                </p>
                <p className="text-sm text-muted-foreground">
                  반면 7일 내 순현금 유입은 안정적이며, 선적 2건은 B/L 확인이
                  필요합니다.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>재무 인사이트</CardTitle>
                <CardDescription>
                  조직 데이터에서 계산된 변화입니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {financeInsights.map(([label, value], index) => (
                  <div
                    key={label}
                    className={cn(
                      "grid gap-2 py-1 sm:grid-cols-[110px_minmax(0,1fr)]",
                      index > 0 && "border-t pt-3"
                    )}
                  >
                    <strong className="text-sm">{label}</strong>
                    <span className="text-sm text-muted-foreground">
                      {value}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        ) : null}

        {role !== "Member" ? (
          <section>
            <SectionHeader
              title="운영 감시"
              description="오늘 처리율과 아직 확인하지 않은 예외를 함께 봅니다."
              trailing={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate("monitoring")}
                >
                  운영 상세 <ArrowRight />
                </Button>
              }
            />
            <Card className="gap-0 py-0">
              <div className="grid gap-4 px-4 py-4 sm:grid-cols-3">
                <div>
                  <div className="text-xs text-muted-foreground">오늘 처리</div>
                  <strong className="mt-1 block text-2xl">6건</strong>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">완료율</div>
                  <strong className="mt-1 block text-2xl">75%</strong>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    미확인 이슈
                  </div>
                  <strong className="mt-1 block text-2xl">2건</strong>
                </div>
              </div>
            </Card>
            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <span>운영 상태는 정상이며, 담당자 미지정 2건이 남았습니다.</span>
              <Status tone="amber">확인 필요</Status>
            </div>
          </section>
        ) : null}

        <ContentPanel>
          <SectionHeader
            title="환율 (오늘)"
            description="거래 통화별 최신 관측값"
          />
          <div className="ui-summary-strip grid sm:grid-cols-2 lg:grid-cols-4">
            {fxRates.map(([label, value]) => (
              <div key={label} className="px-4 py-4">
                <div className="text-xs text-muted-foreground">{label}</div>
                <strong className="mt-1 block text-xl">{value}</strong>
              </div>
            ))}
          </div>
        </ContentPanel>

        {role !== "Member" ? (
          <ContentPanel>
            <SectionHeader
              title="관련 벤치마크"
              description="시장·환율 참조 지표의 최신 관측"
            />
            <PanelTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>지표</TableHead>
                    <TableHead className="text-right">값</TableHead>
                    <TableHead>관측일</TableHead>
                    <TableHead>단위</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {benchmarkRows.map(([series, value, observedAt, unit]) => (
                    <TableRow key={series}>
                      <TableCell>{series}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {value}
                      </TableCell>
                      <TableCell>{observedAt}</TableCell>
                      <TableCell>{unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </PanelTable>
          </ContentPanel>
        ) : null}

        <section className="grid gap-8 xl:grid-cols-2">
          <ContentPanel>
            <SectionHeader
              title="이번 주 일정"
              description="7일 내 결제·수금·선적 일정"
            />
            <div className="divide-y">
              {schedules.map(([date, type, title, meta]) => (
                <Button
                  variant="ghost"
                  key={`${date}-${title}`}
                  type="button"
                  className="grid h-auto w-full items-center justify-start gap-3 rounded-none px-3 py-3 text-left font-normal hover:bg-sidebar-accent/80 sm:grid-cols-[70px_70px_minmax(0,1fr)_120px]"
                  onClick={() =>
                    onNavigate(type === "선적" ? "shipments" : "settlement")
                  }
                >
                  <span className="text-xs text-muted-foreground">{date}</span>
                  <Status
                    tone={
                      type === "수금"
                        ? "green"
                        : type === "지급"
                          ? "amber"
                          : "blue"
                    }
                  >
                    {type}
                  </Status>
                  <span className="text-sm font-medium">{title}</span>
                  <span className="text-sm text-muted-foreground">{meta}</span>
                </Button>
              ))}
            </div>
          </ContentPanel>
          <ContentPanel>
            <SectionHeader
              title={role === "Owner" ? "현금 위험" : "받을 돈 · 줄 돈"}
              description={
                role === "Owner"
                  ? "처리 버튼 없이 위험과 노출만 확인합니다."
                  : "담당 거래의 실제 금액과 만기입니다."
              }
            />
            <div className="divide-y">
              {[
                ["받을 돈", "ACME GmbH", "42,000.00 USD", "오늘"],
                ["줄 돈", "Sakura Logistics", "28,000.00 USD", "D-2"],
              ].map(([type, party, amount, due]) => (
                <div
                  key={type}
                  className="grid items-center gap-3 px-3 py-3 sm:grid-cols-[90px_minmax(0,1fr)_120px_80px]"
                >
                  <Status tone={type === "받을 돈" ? "green" : "amber"}>
                    {type}
                  </Status>
                  <span className="text-sm font-medium">{party}</span>
                  <span className="text-sm font-semibold">{amount}</span>
                  {role === "Owner" ? (
                    <Button
                      variant="link"
                      className="px-0"
                      onClick={() => onNavigate("settlement")}
                    >
                      위험 보기
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">{due}</span>
                  )}
                </div>
              ))}
            </div>
          </ContentPanel>
        </section>

        <ContentPanel>
          <SectionHeader
            title="들어오는 선적"
            description="7일 내 도착 예정 선적"
            trailing={
              <Button variant="ghost" onClick={() => onNavigate("shipments")}>
                배송 추적 <ArrowRight />
              </Button>
            }
          />
          <div className="divide-y">
            {[
              ["HMM Green", "BUSAN", "ETA 08.03", "B/L 확인 필요"],
              ["ONE Harmony", "INCHEON", "ETA 08.05", "정상"],
              ["Ever Ace", "BUSAN", "ETA 08.07", "보험 서류 확인"],
            ].map(([carrier, port, eta, status]) => (
              <div
                key={carrier}
                className="grid items-center gap-3 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_120px_120px_auto]"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Ship className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm font-medium">
                    {carrier}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">{port}</span>
                <span className="text-sm font-medium">{eta}</span>
                <Status tone={status === "정상" ? "green" : "amber"}>
                  {status}
                </Status>
              </div>
            ))}
          </div>
        </ContentPanel>

        {role !== "Member" ? (
          <ContentPanel>
            <SectionHeader
              title="결정 필요"
              description="확인 후 담당자에게 지시하거나 승인할 항목"
              trailing={<Status tone="amber">3건</Status>}
            />
            <div className="divide-y">
              {[
                [
                  "GP 검토",
                  "ACME GmbH",
                  "조정 GP -12,000.00 USD",
                  "settlement",
                ],
                ["거래 보기", "서류 확인 대기", "AI 확인 문서 1건", "deals"],
                ["거래 보기", "필수 서류 갭", "B/L 누락 1건", "deals"],
              ].map(([action, title, description, target]) => (
                <div
                  key={title}
                  className="grid items-center gap-3 px-3 py-3 transition-colors hover:bg-sidebar-accent/80 sm:grid-cols-[minmax(0,1fr)_minmax(160px,.7fr)_auto]"
                >
                  <span className="text-sm font-medium">{title}</span>
                  <span className="text-sm text-muted-foreground">
                    {description}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate(target as ErpMenuTarget)}
                  >
                    {action} <ArrowRight />
                  </Button>
                </div>
              ))}
            </div>
          </ContentPanel>
        ) : null}
      </div>
    </Page>
  )
}

// Conversation layout reference: Open WebUI v0.6.5 (BSD-3-Clause).
// See THIRD_PARTY_NOTICES.md for the pinned source and license notice.
type AskTurnState = "ready" | "not-found" | "empty" | "loading" | "waiting"

type AskFile = {
  id: string
  name: string
  type: string
  reference: string
  updatedAt: string
}

type AskTurn = {
  id: string
  question: string
  state: AskTurnState
  attachments?: AskFile[]
}

const askFiles: AskFile[] = [
  {
    id: "invoice-hb-2607-003",
    name: "Invoice_HB-2607-003.pdf",
    type: "상업송장",
    reference: "DL-260708-01 · ACME GmbH",
    updatedAt: "오늘 09:18",
  },
  {
    id: "sc-2026-0708",
    name: "SC-2026-0708.pdf",
    type: "판매계약서",
    reference: "DL-260708-08 · ACME GmbH",
    updatedAt: "오늘 08:42",
  },
  {
    id: "packing-list-0707",
    name: "PackingList_0707.pdf",
    type: "포장명세서",
    reference: "DL-260708-01 · KATAMAN",
    updatedAt: "어제 16:04",
  },
  {
    id: "bl-2607-014",
    name: "B_L_2607_014.pdf",
    type: "선하증권",
    reference: "DL-260704-02 · Nordic Raw Materials AB",
    updatedAt: "08.27 14:24",
  },
  {
    id: "po-260704-18",
    name: "PO-260704-18.pdf",
    type: "발주서",
    reference: "DL-260704-02 · Hanbit Trading Co.",
    updatedAt: "08.27 13:41",
  },
]

export function AskPrototype({
  onNavigate,
  initialQuestion = "",
  submitOnOpen = false,
}: {
  onNavigate: Navigate
  initialQuestion?: string
  submitOnOpen?: boolean
}) {
  const [question, setQuestion] = useState(initialQuestion)
  const [turns, setTurns] = useState<AskTurn[]>(() =>
    submitOnOpen && initialQuestion.trim()
      ? [
          {
            id: "initial",
            question: initialQuestion.trim(),
            state: "ready",
          },
        ]
      : []
  )
  const [activeConversation, setActiveConversation] = useState<string | null>(
    submitOnOpen && Boolean(initialQuestion.trim()) ? "current" : null
  )
  const [historyOpen, setHistoryOpen] = useState(true)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false)
  const [historyQuery, setHistoryQuery] = useState("")
  const [fileFinderOpen, setFileFinderOpen] = useState(false)
  const [fileQuery, setFileQuery] = useState("")
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([])
  const [attachedFiles, setAttachedFiles] = useState<AskFile[]>([])
  const [feedbackByTurn, setFeedbackByTurn] = useState<
    Record<string, "up" | "down" | undefined>
  >({})
  const threadEndRef = useRef<HTMLDivElement | null>(null)

  type AskSource = {
    title: string
    meta: string
    label: string
    target: ErpMenuTarget
  }

  type AskResponse = {
    title: string
    body: string
    sources: AskSource[]
  }

  const getResponse = (value: string): AskResponse => {
    if (
      /도착|출항|본문|문구|서류 필요|남은 업무|저장한|등록 거래|문서에서/.test(
        value
      )
    ) {
      return {
        title: "조회 조건과 문서 근거를 함께 확인할 수 있습니다.",
        body: "상세 조회에서 거래처별 등록 거래, ETD·ETA 기준 선적, 문서 정보·보관된 본문, 현재 남은 업무를 선택하세요. 기간과 문구를 지정해 조회하고 그 시점의 답변을 저장할 수 있습니다.",
        sources: [
          {
            title: aiHandoffCopy.workspace.tools,
            meta: "조건별 업무 조회 · 문서 검색 · 저장 답변",
            label: "업무",
            target: "ask",
          },
        ],
      }
    }
    if (/받을 돈|지급할 돈|줄 돈|잔액|입출금|정산/.test(value)) {
      return {
        title: "현재 받을 돈과 지급할 돈은 정산 근거를 확인해야 합니다.",
        body: "예정액, 실제 입출금, 지급 적용과 미배분 현금을 구분합니다. 현재 로컬 예시의 원천 검증은 연결되지 않아 공식 잔액은 보류합니다.",
        sources: [
          {
            title: "현재 잔액과 검증 상태",
            meta: "통화별 예정액 · 기존 지급 기록 · 검증 상태",
            label: "정산",
            target: "settlement",
          },
        ],
      }
    }
    if (value.includes("B/L") || value.includes("누락")) {
      return {
        title: "B/L이 누락된 거래는 2건입니다.",
        body: "7월 알루미늄 스크랩 수입은 선적이 진행 중이지만 B/L이 아직 연결되지 않았습니다. 부산항 산업재 수입도 필수 서류 5종 중 B/L이 미비한 상태입니다.",
        sources: [
          {
            title: "7월 알루미늄 스크랩 수입",
            meta: "DL-260708-01 · 선적 중 · B/L 미비",
            label: "거래",
            target: "deal",
          },
          {
            title: "부산항 산업재 수입",
            meta: "DL-260704-02 · 통관 중 · 중요 서류 4/5",
            label: "거래",
            target: "deals",
          },
          {
            title: "검토·배정 대기 문서",
            meta: "B/L 분석 중 1건",
            label: "문서",
            target: "inbox",
          },
        ],
      }
    }

    if (value.includes("GP") || value.includes("마진")) {
      return {
        title: "GP가 가장 크게 낮아진 거래처는 ACME GmbH입니다.",
        body: "최근 30일 기준 GP가 4.8%p 하락했습니다. 운임 상승과 계약 단가 변경이 함께 반영된 거래 2건이 주요 원인입니다.",
        sources: [
          {
            title: "ACME GmbH",
            meta: "최근 30일 GP 11.2% → 6.4%",
            label: "성과",
            target: "sales",
          },
          {
            title: "ACME 7월 해상운송 계약",
            meta: "DL-260707-04 · 운임 상승",
            label: "거래",
            target: "deal",
          },
          {
            title: "영업 성과",
            meta: "거래처별 GP 분석",
            label: "리포트",
            target: "sales",
          },
        ],
      }
    }

    if (value.includes("승인")) {
      return {
        title: "오늘 확인할 승인 요청은 2건입니다.",
        body: "판매계약서 1건과 상업송장 1건이 승인 대기 중입니다. 판매계약서는 은행 거절 전 점검을 통과했고, 상업송장은 거래 연결 확인이 필요합니다.",
        sources: [
          {
            title: "판매계약서 · SC-2026-0708.pdf",
            meta: "박서윤 요청 · 은행 점검 통과",
            label: "승인",
            target: "create",
          },
          {
            title: "상업송장 · CI-2026-0703.pdf",
            meta: "김도현 요청 · 거래 연결 확인",
            label: "승인",
            target: "create",
          },
          {
            title: "오늘 할 일",
            meta: "승인 대기 업무 모아보기",
            label: "업무",
            target: "home",
          },
        ],
      }
    }

    return {
      title: "질문에 맞는 업무와 조회 조건을 선택해 주세요.",
      body: "현재 로컬 예시에서는 조건별 조회로 거래·선적·문서 기록을 확인할 수 있습니다. 질문만으로 확인되지 않은 금액이나 업무 상태를 확정하지 않습니다.",
      sources: [
        {
          title: aiHandoffCopy.workspace.tools,
          meta: "거래처·기간·문구로 조회",
          label: "업무",
          target: "ask",
        },
      ],
    }
  }

  const submit = () => {
    const nextQuestion = question.trim()
    if (!nextQuestion) return
    setTurns((current) => [
      ...current,
      {
        id: `turn-${Date.now()}`,
        question: nextQuestion,
        state: "ready",
        attachments: attachedFiles,
      },
    ])
    setQuestion("")
    setAttachedFiles([])
    setActiveConversation("current")
    window.requestAnimationFrame(() =>
      threadEndRef.current?.scrollIntoView({ block: "end" })
    )
  }

  const quickQuestions = [
    "이번 주 받을 돈",
    "B/L이 누락된 거래",
    "GP가 낮아진 거래처",
    "오늘 승인할 문서",
  ]

  const conversations = [
    {
      id: "receivables",
      title: "이번 주 받을 돈",
      meta: "정산 3건과 거래 근거",
      question: "이번 주 받을 돈이 가장 큰 거래처는?",
      group: "오늘",
      state: "ready" as AskTurnState,
    },
    {
      id: "missing-bl",
      title: "B/L이 누락된 거래",
      meta: "필수 서류 미비 거래",
      question: "B/L이 누락된 거래를 알려줘",
      group: "오늘",
      state: "ready" as AskTurnState,
    },
    {
      id: "gp-change",
      title: "GP가 낮아진 거래처",
      meta: "최근 30일 영업 성과",
      question: "GP가 가장 많이 낮아진 거래처는?",
      group: "어제",
      state: "ready" as AskTurnState,
    },
    {
      id: "approval",
      title: "오늘 승인할 문서",
      meta: "승인 대기 문서 2건",
      question: "오늘 승인할 문서를 보여줘",
      group: "어제",
      state: "ready" as AskTurnState,
    },
    {
      id: "not-found",
      title: "거래 검색 결과 없음",
      meta: "일치하는 거래를 찾지 못함",
      question: "DL-999999-99 거래를 찾아줘",
      group: "상태 예시",
      state: "not-found" as AskTurnState,
    },
    {
      id: "empty-evidence",
      title: "참조 자료 없음",
      meta: "연결된 문서·거래 없음",
      question: "신규 거래의 정산 근거를 확인해줘",
      group: "상태 예시",
      state: "empty" as AskTurnState,
    },
    {
      id: "loading",
      title: "AI 분석 중",
      meta: "업무 데이터를 조회하는 중",
      question: "이번 달 거래 위험을 분석해줘",
      group: "상태 예시",
      state: "loading" as AskTurnState,
    },
    {
      id: "waiting",
      title: "최신 데이터 대기",
      meta: "문서 분석 완료를 기다리는 중",
      question: "방금 올린 B/L까지 반영해서 알려줘",
      group: "상태 예시",
      state: "waiting" as AskTurnState,
    },
  ]

  const filteredConversations = conversations.filter((conversation) =>
    `${conversation.title} ${conversation.meta}`
      .toLowerCase()
      .includes(historyQuery.trim().toLowerCase())
  )

  const filteredFiles = askFiles.filter((file) =>
    `${file.name} ${file.type} ${file.reference}`
      .toLowerCase()
      .includes(fileQuery.trim().toLowerCase())
  )

  const openFileFinder = () => {
    setFileQuery("")
    setSelectedFileIds([])
    setFileFinderOpen(true)
  }

  const toggleFile = (fileId: string) => {
    setSelectedFileIds((current) =>
      current.includes(fileId)
        ? current.filter((id) => id !== fileId)
        : [...current, fileId]
    )
  }

  const attachSelectedFiles = () => {
    const nextFiles = askFiles.filter((file) =>
      selectedFileIds.includes(file.id)
    )
    setAttachedFiles((current) => [
      ...current,
      ...nextFiles.filter(
        (file) => !current.some((attached) => attached.id === file.id)
      ),
    ])
    setFileFinderOpen(false)
    setSelectedFileIds([])
  }

  const startNewChat = () => {
    setToolsOpen(false)
    setQuestion("")
    setAttachedFiles([])
    setTurns([])
    setActiveConversation(null)
    setMobileHistoryOpen(false)
  }

  const openConversation = (conversation: (typeof conversations)[number]) => {
    setToolsOpen(false)
    setQuestion("")
    setAttachedFiles([])
    setTurns([
      {
        id: conversation.id,
        question: conversation.question,
        state: conversation.state,
      },
    ])
    setActiveConversation(conversation.id)
    setMobileHistoryOpen(false)
    window.requestAnimationFrame(() =>
      threadEndRef.current?.scrollIntoView({ block: "end" })
    )
  }

  const copyResponse = async (turn: AskTurn) => {
    const response = getResponse(turn.question)
    try {
      await navigator.clipboard.writeText(
        `${response.title}\n\n${response.body}`
      )
      toast.success("답변을 복사했습니다.")
    } catch {
      toast.error("답변을 복사하지 못했습니다.")
    }
  }

  const regenerateResponse = (turnId: string) => {
    setTurns((current) =>
      current.map((turn) =>
        turn.id === turnId ? { ...turn, state: "loading" } : turn
      )
    )
    window.setTimeout(() => {
      setTurns((current) =>
        current.map((turn) =>
          turn.id === turnId ? { ...turn, state: "ready" } : turn
        )
      )
      toast.success("답변을 다시 확인했습니다.")
    }, 650)
  }

  const updateFeedback = (turnId: string, feedback: "up" | "down") => {
    setFeedbackByTurn((current) => ({
      ...current,
      [turnId]: current[turnId] === feedback ? undefined : feedback,
    }))
    toast.success("의견을 반영했습니다.")
  }

  const renderComposer = ({ welcome = false }: { welcome?: boolean } = {}) => (
    <div
      className={cn(
        "w-full rounded-[var(--ui-radius-panel)] border border-[var(--surface-border)] bg-[var(--surface-background)] shadow-[var(--ui-shadow-panel)] transition-shadow focus-within:ring-2 focus-within:ring-ring/30",
        welcome ? "max-w-3xl" : "mx-auto max-w-3xl"
      )}
    >
      {attachedFiles.length ? (
        <div className="flex flex-wrap gap-2 px-4 pt-4 sm:px-5">
          {attachedFiles.map((file) => (
            <span
              key={file.id}
              className="inline-flex max-w-full items-center gap-2 rounded-[var(--r-md)] border border-[var(--surface-border)] bg-[var(--surface-muted-background)] py-1.5 pr-1.5 pl-2.5 text-xs"
            >
              <FileText className="size-3.5 shrink-0 text-primary" />
              <span className="max-w-48 truncate">{file.name}</span>
              <button
                type="button"
                className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/30"
                aria-label={`${file.name} 첨부 해제`}
                onClick={() =>
                  setAttachedFiles((current) =>
                    current.filter((attached) => attached.id !== file.id)
                  )
                }
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <Textarea
        rows={4}
        aria-label="AI 질문"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault()
            submit()
          }
        }}
        className={cn(
          "max-h-48 min-h-28 w-full resize-none border-0 bg-transparent px-5 pt-5 pb-2 text-sm leading-6 shadow-none focus-visible:ring-0 sm:px-6",
          attachedFiles.length && "min-h-24 pt-3"
        )}
        placeholder={
          attachedFiles.length
            ? "첨부한 문서에 대해 질문하세요"
            : "거래, 문서, 정산에 대해 질문하세요"
        }
      />
      <div className="flex items-center gap-1.5 px-3 pb-3 sm:px-4">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full text-muted-foreground"
          onClick={openFileFinder}
        >
          <Paperclip /> 파일 찾기
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            ⌘ + Enter
          </span>
          <Button
            size="icon-sm"
            className="rounded-full"
            aria-label="질문하기"
            disabled={!question.trim()}
            onClick={submit}
          >
            <Send />
          </Button>
        </div>
      </div>
    </div>
  )

  const renderAssistantTurn = (turn: AskTurn) => {
    const response = getResponse(turn.question)

    return (
      <article className="mt-8 flex gap-3 sm:gap-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">ECOYA 업무 AI</span>
            <Badge variant="secondary" className="font-normal">
              오전 9:30 기준
            </Badge>
          </div>

          {turn.state === "loading" ? (
            <div className="mt-4" role="status" aria-live="polite">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Loader2 className="size-4 animate-spin text-primary" />
                업무 데이터를 확인하고 있습니다
              </div>
              <div className="mt-4 space-y-2" aria-hidden="true">
                <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-20 w-full animate-pulse rounded-[var(--r-lg)] bg-muted/70" />
              </div>
            </div>
          ) : turn.state === "waiting" ? (
            <div className="mt-4 rounded-[var(--r-lg)] border border-[var(--surface-border)] p-4">
              <div className="flex items-start gap-3">
                <RefreshCw className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold">
                    최신 데이터 반영을 기다리고 있습니다
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    방금 올린 문서의 분석이 끝나면 이 대화에서 이어서 확인할 수
                    있습니다.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setTurns((current) =>
                      current.map((item) =>
                        item.id === turn.id ? { ...item, state: "ready" } : item
                      )
                    )
                  }
                >
                  다시 확인
                </Button>
              </div>
            </div>
          ) : turn.state === "not-found" ? (
            <div className="mt-4">
              <h2 className="text-base leading-7 font-semibold">
                일치하는 업무를 찾지 못했습니다.
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                거래번호나 거래처명을 다시 확인해 주세요. 검색 범위를 전체 업무
                데이터로 바꾸어 다시 질문할 수도 있습니다.
              </p>
            </div>
          ) : turn.state === "empty" ? (
            <div className="mt-4">
              <h2 className="text-base leading-7 font-semibold">
                답변에 참조할 업무 데이터가 없습니다.
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                이 거래에 문서나 정산 정보가 연결되면 근거와 함께 답변할 수
                있습니다.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => onNavigate("inbox")}
              >
                문서 올리기
              </Button>
            </div>
          ) : (
            <>
              <h2 className="mt-4 text-base leading-7 font-semibold">
                {response.title}
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {response.body}
              </p>

              <section className="mt-6" aria-label="답변 근거">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <FileText className="size-3.5 text-primary" />
                    확인한 근거
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {response.sources.length}개
                  </span>
                </div>
                <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--surface-border)]">
                  {response.sources.map((source, index) => (
                    <button
                      key={source.title}
                      type="button"
                      onClick={() =>
                        source.target === "ask"
                          ? setToolsOpen(true)
                          : onNavigate(source.target)
                      }
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:bg-muted",
                        index > 0 && "border-t border-[var(--surface-border)]"
                      )}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-primary/8 text-primary">
                        {source.label === "문서" ? (
                          <FileText className="size-4" />
                        ) : source.label === "정산" ||
                          source.label === "성과" ? (
                          <Database className="size-4" />
                        ) : (
                          <Building2 className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {source.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {source.meta}
                        </span>
                      </span>
                      <Badge variant="secondary" className="font-normal">
                        {source.label}
                      </Badge>
                      <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </section>

              <div className="mt-4 flex items-center gap-1 text-muted-foreground">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="답변 복사"
                  title="답변 복사"
                  onClick={() => void copyResponse(turn)}
                >
                  <Copy />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="답변 다시 생성"
                  title="답변 다시 생성"
                  onClick={() => regenerateResponse(turn.id)}
                >
                  <RotateCcw />
                </Button>
                <Button
                  variant={
                    feedbackByTurn[turn.id] === "up" ? "secondary" : "ghost"
                  }
                  size="icon-sm"
                  aria-label="도움이 됨"
                  title="도움이 됨"
                  aria-pressed={feedbackByTurn[turn.id] === "up"}
                  onClick={() => updateFeedback(turn.id, "up")}
                >
                  <ThumbsUp />
                </Button>
                <Button
                  variant={
                    feedbackByTurn[turn.id] === "down" ? "secondary" : "ghost"
                  }
                  size="icon-sm"
                  aria-label="도움이 되지 않음"
                  title="도움이 되지 않음"
                  aria-pressed={feedbackByTurn[turn.id] === "down"}
                  onClick={() => updateFeedback(turn.id, "down")}
                >
                  <ThumbsDown />
                </Button>
              </div>
            </>
          )}
        </div>
      </article>
    )
  }

  return (
    <div
      data-slot="ai-chat-workspace"
      className="flex h-full min-h-0 overflow-hidden bg-[var(--surface-background)]"
    >
      <Dialog open={fileFinderOpen} onOpenChange={setFileFinderOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
          <DialogHeader className="border-b border-[var(--surface-border)] px-5 py-4 text-left">
            <DialogTitle>파일 찾기</DialogTitle>
            <DialogDescription>
              대화에서 확인할 기존 업무 문서를 선택하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 sm:p-5">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={fileQuery}
                onChange={(event) => setFileQuery(event.target.value)}
                className="pl-9"
                placeholder="파일명, 문서 유형, 거래번호 검색"
                aria-label="업무 파일 검색"
              />
            </div>

            <div className="mt-4 overflow-hidden rounded-[var(--r-lg)] border border-[var(--surface-border)]">
              <div className="flex h-9 items-center justify-between border-b border-[var(--surface-border)] bg-[var(--surface-muted-background)] px-3 text-xs text-muted-foreground">
                <span>최근 문서</span>
                <span>{filteredFiles.length}건</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {filteredFiles.map((file) => {
                  const selected = selectedFileIds.includes(file.id)
                  const alreadyAttached = attachedFiles.some(
                    (attached) => attached.id === file.id
                  )

                  return (
                    <button
                      key={file.id}
                      type="button"
                      aria-pressed={selected || alreadyAttached}
                      disabled={alreadyAttached}
                      onClick={() => toggleFile(file.id)}
                      className={cn(
                        "flex w-full items-center gap-3 border-b border-[var(--surface-border)] px-3 py-3 text-left outline-none last:border-b-0 hover:bg-muted/50 focus-visible:bg-muted disabled:cursor-default disabled:opacity-70",
                        selected && "bg-primary/6"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-[var(--r-md)] border border-[var(--surface-border)] bg-background text-muted-foreground",
                          selected &&
                            "border-primary bg-primary text-primary-foreground"
                        )}
                      >
                        {selected ? (
                          <Check className="size-4" />
                        ) : (
                          <FileText className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {file.name}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {file.type} · {file.reference}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {alreadyAttached ? "첨부됨" : file.updatedAt}
                      </span>
                    </button>
                  )
                })}
                {!filteredFiles.length ? (
                  <div className="px-4 py-12 text-center">
                    <FileText className="mx-auto size-5 text-muted-foreground" />
                    <p className="mt-3 text-sm font-medium">
                      찾는 파일이 없습니다.
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      파일명이나 거래번호를 다시 확인하세요.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-[var(--surface-border)] px-5 py-3">
            <Button variant="ghost" onClick={() => setFileFinderOpen(false)}>
              취소
            </Button>
            <Button
              disabled={!selectedFileIds.length}
              onClick={attachSelectedFiles}
            >
              {selectedFileIds.length
                ? `${selectedFileIds.length}개 첨부`
                : "파일 첨부"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={mobileHistoryOpen} onOpenChange={setMobileHistoryOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          overlayClassName="top-14"
          className="top-14! bottom-0! h-auto! w-[300px] gap-0 p-0 lg:hidden"
        >
          <div className="sr-only">
            <SheetTitle>대화 기록</SheetTitle>
            <SheetDescription>
              이전 업무 질문을 검색하고 다시 엽니다.
            </SheetDescription>
          </div>
          <div className="flex h-14 items-center gap-2 border-b border-[var(--surface-border)] px-3">
            <Button
              variant="outline"
              className="flex-1 justify-start bg-background"
              onClick={startNewChat}
            >
              <Plus /> 새 대화
            </Button>
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="대화 기록 닫기"
              >
                <X />
              </Button>
            </SheetClose>
          </div>
          <div className="p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={historyQuery}
                onChange={(event) => setHistoryQuery(event.target.value)}
                className="h-9 bg-background pl-9 text-sm"
                placeholder="대화 검색"
                aria-label="대화 검색"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
            {["오늘", "어제", "상태 예시"].map((group) => {
              const grouped = filteredConversations.filter(
                (conversation) => conversation.group === group
              )
              if (!grouped.length) return null
              return (
                <div key={group} className="mb-5">
                  <div className="px-2 pb-1.5 text-xs font-medium text-muted-foreground">
                    {group}
                  </div>
                  <div className="space-y-0.5">
                    {grouped.map((conversation) => (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => openConversation(conversation)}
                        className={cn(
                          "flex w-full items-start gap-2 rounded-[var(--r-md)] px-2.5 py-2.5 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/30",
                          activeConversation === conversation.id && "bg-muted"
                        )}
                      >
                        <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-medium">
                            {conversation.title}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            {conversation.meta}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>

      <section className="flex min-w-0 flex-1 flex-col bg-background">
        <header className="flex h-14 shrink-0 items-center border-b border-[var(--surface-border)] px-3 sm:px-5">
          <div className="flex items-center gap-2 px-2 py-1">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold">ECOYA 업무 AI</span>
              <span className="block text-xs text-muted-foreground">
                거래·문서·정산 근거로 답변
              </span>
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="새 대화"
              title="새 대화"
              onClick={startNewChat}
            >
              <Plus />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              aria-label="대화 기록 열기"
              title="대화 기록 열기"
              onClick={() => setMobileHistoryOpen(true)}
            >
              <PanelRight />
            </Button>
            {!historyOpen ? (
              <Button
                variant="ghost"
                size="icon-sm"
                className="hidden lg:inline-flex"
                aria-label="대화 기록 열기"
                title="대화 기록 열기"
                onClick={() => setHistoryOpen(true)}
              >
                <PanelRight />
              </Button>
            ) : null}
          </div>
        </header>

        <div
          className="flex shrink-0 gap-2 border-b px-4 py-2"
          aria-label="AI 작업 선택"
        >
          <Button
            size="sm"
            variant={toolsOpen ? "ghost" : "secondary"}
            aria-pressed={!toolsOpen}
            onClick={() => setToolsOpen(false)}
          >
            질문하기
          </Button>
          <Button
            size="sm"
            variant={toolsOpen ? "secondary" : "ghost"}
            aria-pressed={toolsOpen}
            onClick={() => setToolsOpen(true)}
          >
            저장한 답변과 상세 조회
          </Button>
        </div>
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto",
            !toolsOpen && "hidden"
          )}
        >
          <AiBusinessTools
            shipments={shipments}
            files={askFiles}
            onNavigate={onNavigate}
          />
        </div>
        <div className={cn("min-h-0 flex-1", toolsOpen && "hidden")}>
          {turns.length === 0 ? (
            <div className="mx-auto flex h-full w-full max-w-4xl flex-col justify-center overflow-y-auto px-5 py-12 sm:px-8">
              <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-full border border-primary/15 bg-primary/8 text-primary">
                <Sparkles className="size-5" />
              </div>
              <h1 className="text-center text-xl font-semibold">
                {aiHandoffCopy.workspace.question}
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-6 text-muted-foreground">
                {aiHandoffCopy.workspace.guide}
              </p>
              <div className="mx-auto mt-8 w-full max-w-3xl">
                {renderComposer({ welcome: true })}
                <div className="mx-auto mt-5 grid max-w-2xl gap-1 sm:grid-cols-2">
                  {quickQuestions.map((item) => (
                    <Button
                      key={item}
                      variant="ghost"
                      className="h-auto justify-start gap-3 px-3 py-2.5 text-left text-sm font-normal text-muted-foreground hover:text-foreground"
                      onClick={() => setQuestion(item)}
                    >
                      <Sparkles className="size-3.5 text-primary" />
                      {item}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
                  {turns.map((turn, index) => (
                    <section
                      key={turn.id}
                      className={cn(
                        index > 0 &&
                          "mt-10 border-t border-[var(--surface-border)] pt-10"
                      )}
                      aria-label={`대화 ${index + 1}`}
                    >
                      <div className="flex justify-end">
                        <div className="flex max-w-[82%] flex-col items-end gap-2">
                          {turn.attachments?.length ? (
                            <div className="flex flex-wrap justify-end gap-2">
                              {turn.attachments.map((file) => (
                                <span
                                  key={file.id}
                                  className="inline-flex max-w-64 items-center gap-2 rounded-[var(--r-md)] border border-[var(--surface-border)] bg-background px-3 py-2 text-xs shadow-xs"
                                >
                                  <FileText className="size-3.5 shrink-0 text-primary" />
                                  <span className="truncate">{file.name}</span>
                                </span>
                              ))}
                            </div>
                          ) : null}
                          <div className="rounded-[var(--ui-radius-panel)] rounded-br-md bg-[var(--surface-muted-background)] px-4 py-3 text-sm leading-6">
                            {turn.question}
                          </div>
                        </div>
                      </div>
                      {renderAssistantTurn(turn)}
                    </section>
                  ))}
                  <div ref={threadEndRef} />
                </div>
              </div>
              <div className="shrink-0 border-t border-[var(--surface-border)] bg-background/95 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
                {renderComposer()}
              </div>
            </div>
          )}
        </div>
      </section>

      <aside
        className={cn(
          "hidden min-h-0 w-72 shrink-0 flex-col border-l border-[var(--surface-border)] bg-[var(--surface-background)] lg:flex xl:w-80",
          !historyOpen && "lg:hidden"
        )}
        aria-label="대화 기록"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--surface-border)] px-4">
          <span className="text-sm font-semibold">대화 기록</span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="대화 기록 닫기"
            title="대화 기록 닫기"
            onClick={() => setHistoryOpen(false)}
          >
            <X />
          </Button>
        </div>
        <div className="space-y-2 p-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={startNewChat}
          >
            <Plus /> 새 대화
          </Button>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={historyQuery}
              onChange={(event) => setHistoryQuery(event.target.value)}
              className="h-9 pl-9 text-sm"
              placeholder="대화 검색"
              aria-label="대화 검색"
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {["오늘", "어제", "상태 예시"].map((group) => {
            const grouped = filteredConversations.filter(
              (conversation) => conversation.group === group
            )
            if (!grouped.length) return null
            return (
              <div key={group} className="mb-5">
                <div className="px-2 pb-1.5 text-xs font-medium text-muted-foreground">
                  {group}
                </div>
                <div className="space-y-0.5">
                  {grouped.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => openConversation(conversation)}
                      className={cn(
                        "group flex w-full items-start gap-2 rounded-[var(--r-md)] px-2.5 py-2.5 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/30",
                        activeConversation === conversation.id && "bg-muted"
                      )}
                    >
                      <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium">
                          {conversation.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {conversation.meta}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          {!filteredConversations.length ? (
            <div className="px-3 py-8 text-center text-xs text-muted-foreground">
              찾는 대화가 없습니다.
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  )
}

const shipments = [
  {
    deal: "DL-260708-01",
    dealName: "7월 알루미늄 스크랩 수입",
    bl: "HMM014W2607",
    container: "HMMU 7820194",
    route: "Busan → Hamburg",
    vessel: "HMM Green",
    etd: "07.20",
    eta: "08.03",
    status: "운송 중",
    tone: "blue" as Tone,
    evidence: 8,
    documents: "B/L 확인",
  },
  {
    deal: "DL-260708-01",
    dealName: "7월 알루미늄 스크랩 수입",
    bl: "ONE26070819",
    container: "ONEU 1083275",
    route: "Shanghai → Incheon",
    vessel: "ONE Harmony",
    etd: "07.10",
    eta: "07.15",
    status: "도착 임박",
    tone: "amber" as Tone,
    evidence: 3,
    documents: "B/L 누락",
  },
  {
    deal: "DL-260701-04",
    dealName: "6월 재활용 원자재 수입",
    bl: "MSC26062077",
    container: "MSCU 8425510",
    route: "Singapore → Busan",
    vessel: "MSC Clara",
    etd: "06.28",
    eta: "07.08",
    status: "지연",
    tone: "red" as Tone,
    evidence: 0,
    documents: "증거 없음",
  },
  {
    deal: "DL-260701-04",
    dealName: "6월 재활용 원자재 수입",
    bl: "COS26070134",
    container: "COSU 2214870",
    route: "Qingdao → Incheon",
    vessel: "COSCO Star",
    etd: "07.01",
    eta: "07.06",
    status: "도착",
    tone: "green" as Tone,
    evidence: 5,
    documents: "서류 완료",
  },
  {
    deal: "DL-260704-04",
    dealName: "ACME 7월 해상운송 계약",
    bl: "MAEU26070481",
    container: "MSKU 3916208",
    route: "Hamburg → Busan",
    vessel: "Maersk Horsburgh",
    etd: "07.04",
    eta: "07.18",
    status: "운송 중",
    tone: "blue" as Tone,
    evidence: 6,
    documents: "B/L 확인",
  },
  {
    deal: "DL-260704-04",
    dealName: "ACME 7월 해상운송 계약",
    bl: "MAEU26070496",
    container: "MRKU 4528103",
    route: "Hamburg → Busan",
    vessel: "Maersk Horsburgh",
    etd: "07.04",
    eta: "07.18",
    status: "운송 중",
    tone: "blue" as Tone,
    evidence: 4,
    documents: "서류 완료",
  },
  {
    deal: "DL-260625-03",
    dealName: "Nordic 원자재 부산항 수입",
    bl: "CMDU26062541",
    container: "CMAU 1182046",
    route: "Gothenburg → Busan",
    vessel: "CMA CGM Louvre",
    etd: "06.25",
    eta: "07.16",
    status: "도착 임박",
    tone: "amber" as Tone,
    evidence: 2,
    documents: "B/L 확인",
  },
  {
    deal: "DL-260625-03",
    dealName: "Nordic 원자재 부산항 수입",
    bl: "CMDU26062558",
    container: "CMAU 4418792",
    route: "Gothenburg → Busan",
    vessel: "CMA CGM Louvre",
    etd: "06.25",
    eta: "07.16",
    status: "운송 중",
    tone: "blue" as Tone,
    evidence: 0,
    documents: "B/L 누락",
  },
  {
    deal: "DL-260629-03",
    dealName: "싱가포르 구리 스크랩 매입",
    bl: "ONEY26062973",
    container: "ONEU 7491025",
    route: "Singapore → Incheon",
    vessel: "ONE Innovation",
    etd: "06.29",
    eta: "07.19",
    status: "운송 중",
    tone: "blue" as Tone,
    evidence: 7,
    documents: "서류 완료",
  },
  {
    deal: "DL-260629-03",
    dealName: "싱가포르 구리 스크랩 매입",
    bl: "ONEY26062988",
    container: "ONEU 6243891",
    route: "Singapore → Incheon",
    vessel: "ONE Innovation",
    etd: "06.29",
    eta: "07.19",
    status: "운송 중",
    tone: "blue" as Tone,
    evidence: 5,
    documents: "B/L 확인",
  },
  {
    deal: "DL-260711-02",
    dealName: "HMM Green 재생 알루미늄 수입",
    bl: "HLCU26071125",
    container: "HLXU 8012459",
    route: "Rotterdam → Incheon",
    vessel: "HMM Rotterdam",
    etd: "07.11",
    eta: "07.28",
    status: "운송 중",
    tone: "blue" as Tone,
    evidence: 4,
    documents: "B/L 확인",
  },
  {
    deal: "DL-260711-02",
    dealName: "HMM Green 재생 알루미늄 수입",
    bl: "HLCU26071139",
    container: "HLXU 4931807",
    route: "Rotterdam → Incheon",
    vessel: "HMM Rotterdam",
    etd: "07.11",
    eta: "07.28",
    status: "운송 중",
    tone: "blue" as Tone,
    evidence: 3,
    documents: "서류 완료",
  },
  {
    deal: "DL-260713-07",
    dealName: "일본 내륙운송 발주",
    bl: "NYKS26071307",
    container: "NYKU 7712034",
    route: "Yokohama → Busan",
    vessel: "NYK Vega",
    etd: "07.13",
    eta: "07.17",
    status: "도착 임박",
    tone: "amber" as Tone,
    evidence: 1,
    documents: "B/L 확인",
  },
  {
    deal: "DL-260630-06",
    dealName: "태국 압축 스크랩 수입",
    bl: "EGLV26063061",
    container: "EGHU 6021498",
    route: "Laem Chabang → Busan",
    vessel: "Ever Balance",
    etd: "06.30",
    eta: "07.14",
    status: "도착",
    tone: "green" as Tone,
    evidence: 6,
    documents: "서류 완료",
  },
].map((row) => ({ ...row, reviewDocument: shipmentReviewSamples[row.bl] }))

export function ShipmentsPrototype({ onNavigate }: { onNavigate: Navigate }) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("전체")
  const [page, setPage] = useState(1)
  const [groupsPerPage, setGroupsPerPage] = useState(3)
  const operationalShipments = shipments.map((shipment) => ({
    ...shipment,
    etd: `2026.${shipment.etd}`,
    eta: `2026.${shipment.eta}`,
  }))
  const visible = operationalShipments.filter(
    (item) =>
      (filter === "전체" || item.status === filter) &&
      `${item.deal} ${item.dealName} ${item.bl} ${item.container} ${item.route} ${item.vessel}`
        .toLowerCase()
        .includes(query.toLowerCase())
  )
  const groups = [...new Set(visible.map((item) => item.deal))]
    .map((deal) => ({
      deal,
      dealName: visible.find((item) => item.deal === deal)?.dealName ?? deal,
      items: visible.filter((item) => item.deal === deal),
    }))
    .sort((a, b) => {
      const aEta = [...a.items].sort((left, right) =>
        left.eta.localeCompare(right.eta)
      )[0]?.eta
      const bEta = [...b.items].sort((left, right) =>
        left.eta.localeCompare(right.eta)
      )[0]?.eta
      return (aEta ?? "").localeCompare(bEta ?? "")
    })
  const totalPages = Math.max(1, Math.ceil(groups.length / groupsPerPage))
  const currentPage = Math.min(page, totalPages)
  const pagedGroups = groups.slice(
    (currentPage - 1) * groupsPerPage,
    currentPage * groupsPerPage
  )
  return (
    <Page
      title="선적"
      description="선적 ETD·ETA·컨테이너 상태를 확인하고, 예외는 운영 감시에서 조치합니다."
      action={
        <>
          <Button variant="outline" onClick={() => onNavigate("snap")}>
            <FileCheck2 /> SNAP 증거함
          </Button>
        </>
      }
      heroControls={
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-0 flex-1 basis-72">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--control-placeholder)]" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              className="pl-9 shadow-none backdrop-blur-sm hover:shadow-none"
              placeholder="거래번호·거래명·B/L·컨테이너·항구·선박 검색"
            />
          </div>
          <div
            role="group"
            aria-label="선적 상태"
            className="flex flex-wrap gap-2"
          >
            {["전체", "운송 중", "도착 임박", "지연", "도착"].map((status) => (
              <Button
                key={status}
                size="sm"
                variant={filter === status ? "secondary" : "outline"}
                aria-pressed={filter === status}
                onClick={() => {
                  setFilter(status)
                  setPage(1)
                }}
              >
                {status}
                <span className="text-xs tabular-nums">
                  {status === "전체"
                    ? operationalShipments.length
                    : operationalShipments.filter(
                        (item) => item.status === status
                      ).length}
                </span>
              </Button>
            ))}
          </div>
          <div className="ml-auto pb-2 text-xs text-white/75">
            선적 {visible.length}건 · 거래 {groups.length}건
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {pagedGroups.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            검색 조건에 맞는 선적이 없습니다.
          </div>
        ) : null}
        {pagedGroups.map((group) => (
          <ContentPanel key={group.deal}>
            <SectionHeader
              title={group.dealName}
              description={`${group.deal} · 선적 ${group.items.length}건`}
              trailing={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate("deal", { dealId: group.deal })}
                >
                  거래 보기 <ArrowRight />
                </Button>
              }
            />
            <PanelTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>B/L · 컨테이너</TableHead>
                    <TableHead>항로 · 선박</TableHead>
                    <TableHead>ETD / ETA</TableHead>
                    <TableHead>서류·근거</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.items.map((item) => (
                    <TableRow key={item.bl}>
                      <TableCell>
                        <div className="font-medium">{item.bl}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.container}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{item.route}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.vessel}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {item.etd} / {item.eta}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ETA 기준
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{item.documents}</div>
                        <Button
                          variant="outline"
                          size="xs"
                          className="mt-1"
                          onClick={() => onNavigate("snap")}
                        >
                          SNAP {item.evidence}장
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Status tone={item.tone}>{item.status}</Status>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.status === "지연" ? (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => onNavigate("monitoring")}
                          >
                            <ShieldAlert /> 조치
                          </Button>
                        ) : (
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => onNavigate("deal", { dealId: item.deal })}
                          >
                            <Check data-icon="inline-start" />
                            확인
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </PanelTable>
          </ContentPanel>
        ))}
      </div>
      {groups.length > 0 ? (
        <TablePagination
          className="mt-5 px-0"
          page={currentPage}
          pageSize={groupsPerPage}
          total={groups.length}
          pageSizeOptions={[3, 5, 10]}
          aria-label="선적 거래 페이지 이동"
          pageSizeOptionLabel={(size) => `${size}개 거래`}
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setGroupsPerPage(nextPageSize)
            setPage(1)
          }}
        />
      ) : null}
    </Page>
  )
}

type SettlementPaymentRecord = {
  id: string
  scheduleId: string
  type: "AR" | "AP"
  amount: string
  fee: string
  paidAt: string
  note?: string
}

const fundScheduleRows = [
  {
    currency: "USD",
    type: "받을 돈",
    overdue: "42,000.00 (1)",
    d7: "82,000.00 (2)",
    d30: "210,000.00 (4)",
    d90: "388,000.00 (7)",
    later: "120,000.00 (2)",
  },
  {
    currency: "USD",
    type: "보낼 돈",
    overdue: "-",
    d7: "27,800.00 (1)",
    d30: "122,000.00 (3)",
    d90: "240,000.00 (5)",
    later: "96,000.00 (2)",
  },
  {
    currency: "EUR",
    type: "받을 돈",
    overdue: "-",
    d7: "18,000.00 (1)",
    d30: "32,000.00 (2)",
    d90: "45,000.00 (3)",
    later: "-",
  },
  {
    currency: "EUR",
    type: "보낼 돈",
    overdue: "-",
    d7: "30,000.00 (1)",
    d30: "30,000.00 (1)",
    d90: "38,000.00 (2)",
    later: "-",
  },
]

const fxExposureRows = [
  {
    currency: "USD",
    ar: "166,000.00",
    ap: "120,000.00",
    net: "+46,000.00",
    tone: "green" as Tone,
  },
  {
    currency: "EUR",
    ar: "18,000.00",
    ap: "30,000.00",
    net: "-12,000.00",
    tone: "red" as Tone,
  },
  {
    currency: "KRW",
    ar: "0.00",
    ap: "8,200,000.00",
    net: "-8,200,000.00",
    tone: "amber" as Tone,
  },
]

const counterpartyScores = [
  {
    party: "HMM Green",
    grade: "A",
    score: "92",
    delay: "0.4일",
    overdue: "0 USD",
    volume: "8건",
    tone: "green" as Tone,
  },
  {
    party: "KATAMAN ASIA-PACIFIC",
    grade: "B",
    score: "78",
    delay: "2.1일",
    overdue: "0 USD",
    volume: "12건",
    tone: "blue" as Tone,
  },
  {
    party: "ACME GmbH",
    grade: "C",
    score: "61",
    delay: "5.8일",
    overdue: "42,000.00 USD",
    volume: "6건",
    tone: "amber" as Tone,
  },
]

const financeFacts = [
  {
    deal: "DL-260704-04",
    party: "ACME GmbH",
    owner: "조민영",
    revenue_amount: "420000.00",
    goods_cost_amount: "298000.00",
    landed_cost_amount: "40000.00",
    adjusted_gp_amount: "82000.00",
    currency: "USD",
    handoff_blockers: ["missing_payment_schedule"],
    quality: "검토 필요",
    docs: "CI · PL · B/L",
  },
  {
    deal: "DL-260701-09",
    party: "KATAMAN ASIA-PACIFIC",
    owner: "김민지",
    revenue_amount: "360000.00",
    goods_cost_amount: "262000.00",
    landed_cost_amount: "34000.00",
    adjusted_gp_amount: "64000.00",
    currency: "USD",
    handoff_blockers: ["missing_payment_schedule"],
    quality: "잔액 확인 필요",
    docs: "PO · SC · CI",
  },
  {
    deal: "DL-260625-03",
    party: "HMM Green",
    owner: "박서준",
    revenue_amount: "190000.00",
    goods_cost_amount: "136000.00",
    landed_cost_amount: "32000.00",
    adjusted_gp_amount: "22000.00",
    currency: "USD",
    handoff_blockers: ["missing_payment_schedule"],
    quality: "보완 1건",
    docs: "CI · B/L",
  },
]

const profitabilityRows = [
  {
    name: "ACME GmbH",
    deals: "6",
    revenue: "420,000.00",
    gp: "82,000.00",
    margin: "19.5%",
    outstanding: "42,000.00",
    readiness: "5/6",
    decision: "연체 반영",
  },
  {
    name: "KATAMAN ASIA-PACIFIC",
    deals: "12",
    revenue: "360,000.00",
    gp: "64,000.00",
    margin: "17.8%",
    outstanding: "0.00",
    readiness: "12/12",
    decision: "정상",
  },
  {
    name: "HMM Green",
    deals: "8",
    revenue: "190,000.00",
    gp: "22,000.00",
    margin: "11.6%",
    outstanding: "8,000.00",
    readiness: "7/8",
    decision: "GP 검토",
  },
]

function downloadSettlementCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")
    )
    .join("\n")
  const url = URL.createObjectURL(
    new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" })
  )
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function SettlementPagination({
  total,
  page,
  pageSize,
  onPageChange,
}: {
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  return (
    <TablePagination
      className="px-0"
      page={page}
      pageSize={pageSize}
      total={total}
      showPageSizeSelect={false}
      aria-label="정산 테이블 페이지 이동"
      onPageChange={onPageChange}
    />
  )
}

export function SettlementPrototype({ onNavigate }: { onNavigate: Navigate }) {
  const [bankCashRecords] = useState(readBankCashRecords)
  const ledgerRows = [
    ...bankScheduleFixtures
      .filter((schedule) =>
        bankCashRecords.some((record) => record.scheduleId === schedule.id)
      )
      .map((schedule) => {
        const applied = bankCashRecords
          .filter((record) => record.scheduleId === schedule.id)
          .reduce(
            (sum, record) =>
              sum +
              (decimalMagnitude(record.amount, FINANCE_DECIMAL_SCALE) ??
                BigInt(0)),
            BigInt(0)
          )
        const target =
          decimalMagnitude(schedule.outstanding, FINANCE_DECIMAL_SCALE) ??
          BigInt(0)
        const money = (value: bigint) =>
          `${formatScaledMoney(value, FINANCE_DECIMAL_SCALE)} ${schedule.currency}`
        return {
          id: schedule.id,
          type: schedule.direction === "receivable" ? "AR" : "AP",
          party: schedule.counterparty,
          amount: money(target),
          paid: money(applied),
          balance: money(target - applied),
          due: schedule.dueDate,
          deal: schedule.dealId,
          status: target === applied ? "정산 완료" : "미정산",
          dealState: "진행",
          readOnly: false,
          requiredObligations: 0,
        }
      }),
    ...baseLedgerRows,
  ]
  const [recording, setRecording] = useState<string | null>(null)
  const [saved, setSaved] = useState<string[]>([])
  const [ledgerTab, setLedgerTab] = useState<"AR" | "AP">("AR")
  const [ledgerStatus, setLedgerStatus] = useState<
    "전체 상태" | "미정산" | "정산 완료" | "정산 대상 아님"
  >("전체 상태")
  const [includeCancelled, setIncludeCancelled] = useState(false)
  const [expandedParty, setExpandedParty] = useState<string | null>(null)
  const [rollupType, setRollupType] = useState<"counterparty" | "owner">(
    "counterparty"
  )
  const [exportMonth, setExportMonth] = useState("2026-07")
  const [ledgerPage, setLedgerPage] = useState(1)
  const [scorePage, setScorePage] = useState(1)
  const [partyPage, setPartyPage] = useState(1)
  const [schedulePage, setSchedulePage] = useState(1)
  const [financePage, setFinancePage] = useState(1)
  const [rollupPage, setRollupPage] = useState(1)
  const [settlementAction, setSettlementAction] = useState<
    "idle" | "pending" | "error"
  >("idle")
  const [pendingScheduleId, setPendingScheduleId] = useState<string | null>(
    null
  )
  const [reopenedSchedules, setReopenedSchedules] = useState<string[]>([])
  const [exceptionScheduleId, setExceptionScheduleId] = useState<string | null>(
    null
  )
  const [exceptionKind, setExceptionKind] = useState<
    "overpayment" | "adjustment" | "refund" | "dispute" | "writeoff"
  >("overpayment")
  const [exceptionDraft, setExceptionDraft] = useState({
    amount: "",
    reason: "",
    evidence: "",
  })
  const [exceptionBusy, setExceptionBusy] = useState(false)
  const [exceptionError, setExceptionError] = useState("")
  const [exceptionHistory, setExceptionHistory] = useState<
    Array<{
      id: string
      scheduleId: string
      kind: string
      amount: string
      reason: string
    }>
  >([
    {
      id: "EXC-001",
      scheduleId: "AR-260715-01",
      kind: "초과금",
      amount: "2,000 USD",
      reason: "입금액이 청구 잔액을 초과함",
    },
  ])
  const [paymentDraft, setPaymentDraft] = useState({
    amount: "",
    paidAt: "2026-07-13",
    fee: "",
    note: "",
  })
  const [paymentRecords, setPaymentRecords] = useState<
    SettlementPaymentRecord[]
  >([
    ...bankCashRecords.map((record) => ({
      id: record.idempotencyKey,
      scheduleId: record.scheduleId,
      type: (bankScheduleFixtures.find(
        (schedule) => schedule.id === record.scheduleId
      )?.direction === "receivable"
        ? "AR"
        : "AP") as "AR" | "AP",
      amount: record.amount,
      fee: "0",
      paidAt: record.valueDate,
      note: record.sourceDocumentId,
    })),
    {
      id: "PAY-AR-260715-01-01",
      scheduleId: "AR-260715-01",
      type: "AR",
      amount: "40,000",
      fee: "0",
      paidAt: "2026-07-09",
      note: "1차 입금 확인",
    },
    {
      id: "PAY-AP-260710-01-01",
      scheduleId: "AP-260710-01",
      type: "AP",
      amount: "8,200",
      fee: "12",
      paidAt: "2026-07-10",
      note: "전액 지급",
    },
  ])
  const ledgerPageSize = 5
  const sidePageSize = 2
  const tablePageSize = 5
  const recordingRow = ledgerRows.find((row) => row.id === recording)
  const exceptionRow = ledgerRows.find((row) => row.id === exceptionScheduleId)
  const recordingHistory = recordingRow
    ? paymentRecords.filter((record) => record.scheduleId === recordingRow.id)
    : []
  const filteredLedger = ledgerRows.filter(
    (row) =>
      row.type === ledgerTab &&
      (ledgerStatus === "전체 상태" || row.status === ledgerStatus) &&
      (includeCancelled || row.dealState !== "취소")
  )
  const visibleLedger = filteredLedger.slice(
    (ledgerPage - 1) * ledgerPageSize,
    ledgerPage * ledgerPageSize
  )
  const visibleScores = counterpartyScores.slice(
    (scorePage - 1) * sidePageSize,
    scorePage * sidePageSize
  )
  const counterpartyArApRows = [
    ["ACME GmbH", "USD", "82,000.00", "0.00", "42,000.00"],
    ["KATAMAN ASIA-PACIFIC", "USD", "0.00", "120,000.00", "-"],
    ["HMM Green", "USD / KRW", "84,000.00", "8,200.00", "-"],
  ]
  const visibleCounterpartyRows = counterpartyArApRows.slice(
    (partyPage - 1) * sidePageSize,
    partyPage * sidePageSize
  )
  const visibleScheduleRows = fundScheduleRows.slice(
    (schedulePage - 1) * tablePageSize,
    schedulePage * tablePageSize
  )
  const visibleFinanceRows = financeFacts.slice(
    (financePage - 1) * tablePageSize,
    financePage * tablePageSize
  )
  const visibleProfitabilityRows = profitabilityRows.slice(
    (rollupPage - 1) * tablePageSize,
    rollupPage * tablePageSize
  )
  const exportRows = [
    ["구분", "거래처", "총 금액", "처리 금액", "잔액", "만기", "거래"],
    ...ledgerRows.map((row) => [
      row.type,
      row.party,
      row.amount,
      row.paid,
      row.balance,
      row.due,
      row.deal,
    ]),
  ]
  const exceptionKindLabels = {
    overpayment: "초과금·선수/선급",
    adjustment: "금액 조정",
    refund: "환불·반환",
    dispute: "분쟁 등록",
    writeoff: "대손 제안",
  } as const
  const selectedExceptionHistory = exceptionHistory.filter(
    (item) => item.scheduleId === exceptionScheduleId
  )
  const usdBalance = (type: string) =>
    ledgerRows
      .filter((row) => row.type === type && row.balance.endsWith(" USD"))
      .reduce(
        (sum, row) =>
          sum +
          (decimalMagnitude(
            normalizeDecimalInput(row.balance.split(" ")[0]),
            FINANCE_DECIMAL_SCALE
          ) ?? BigInt(0)),
        BigInt(0)
      )
  const usdReceivable = usdBalance("AR")
  const usdPayable = usdBalance("AP")
  return (
    <Page
      title="정산"
      description="회계 소프트웨어가 아닙니다. 세무사·더존으로 넘길 AR/AP와 자금 일정을 정리합니다."
      action={
        <>
          <Input
            type="month"
            value={exportMonth}
            onChange={(event) => setExportMonth(event.target.value)}
            aria-label="내보낼 대상 월"
            className="w-36"
          />
          <Button
            variant="outline"
            onClick={() =>
              downloadSettlementCsv(
                `settlement-accounting-${exportMonth}.csv`,
                exportRows
              )
            }
          >
            <Download /> 회계용 CSV
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              downloadSettlementCsv(
                `settlement-tax-${exportMonth}.csv`,
                exportRows
              )
            }
          >
            <Download /> 세무사용 월간 명세서
          </Button>
        </>
      }
      heroSummary={
        <SummaryMetricStrip
          itemClassName="min-h-24 bg-[var(--surface-background)]!"
          items={[
            {
              label: "받을 돈 (AR) · USD",
              value: formatScaledMoney(
                usdReceivable,
                FINANCE_DECIMAL_SCALE,
                "USD"
              ),
              note: "등록 원장 기준",
            },
            {
              label: "보낼 돈 (AP) · USD",
              value: formatScaledMoney(
                usdPayable,
                FINANCE_DECIMAL_SCALE,
                "USD"
              ),
            },
            {
              label: "미수 − 미지급 · USD",
              value: formatScaledMoney(
                usdReceivable - usdPayable,
                FINANCE_DECIMAL_SCALE,
                "USD"
              ),
              note: "잔액 차이",
              tone: usdReceivable >= usdPayable ? "green" : "red",
            },
            {
              label: "연체",
              value: "42,000.00 USD",
              note: "1건",
              tone: "red",
            },
          ]}
        />
      }
    >
      <ContentPanel>
        <SectionHeader
          title="오늘 결정"
          description="돈·만기·연체 중 지금 판단할 항목입니다."
        />
        <div className="ui-summary-strip grid md:grid-cols-2 xl:grid-cols-4">
          {[
            ["연체 받을 돈", "ACME GmbH · 42,000.00 USD", "입금 기록"],
            ["ACME GmbH 미수", "가장 큰 연체 거래처", "거래처 확인"],
            ["7일 내 순유입", "+54,200.00 USD", "자금 일정"],
            ["7일 내 보낼 돈", "KATAMAN · 120,000.00 USD", "지급 기록"],
          ].map(([title, value, cta], index) => (
            <div key={title} className="p-4">
              <div className="text-xs text-muted-foreground">{title}</div>
              <div className="mt-1 font-semibold">{value}</div>
              <Button
                variant="link"
                className="mt-2 h-auto px-0"
                onClick={() => {
                  if (index === 2) {
                    document
                      .getElementById("settlement-ledger")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                    return
                  }
                  if (index === 1) {
                    onNavigate("counterparty")
                    return
                  }
                  setRecording(index === 0 ? "AR-260715-01" : "AP-260716-01")
                }}
              >
                {cta} <ArrowRight />
              </Button>
            </div>
          ))}
        </div>
      </ContentPanel>

      <ContentPanel className="mt-8">
        <SectionHeader
          title="자금 일정 (만기 구간별)"
          description="통화별 받을 돈과 보낼 돈을 만기 구간으로 나눠 자금 공백을 확인합니다."
        />
        <PanelTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>통화</TableHead>
                <TableHead>구분</TableHead>
                <TableHead className="text-right">연체</TableHead>
                <TableHead className="text-right">7일 이내</TableHead>
                <TableHead className="text-right">30일 이내</TableHead>
                <TableHead className="text-right">90일 이내</TableHead>
                <TableHead className="text-right">이후</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleScheduleRows.map((row) => (
                <TableRow key={`${row.currency}-${row.type}`}>
                  <TableCell className="font-medium">{row.currency}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums",
                      row.overdue !== "-" && "font-medium text-red-600"
                    )}
                  >
                    {row.overdue}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.d7}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.d30}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.d90}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.later}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </PanelTable>
        <SettlementPagination
          total={fundScheduleRows.length}
          page={schedulePage}
          pageSize={tablePageSize}
          onPageChange={setSchedulePage}
        />
      </ContentPanel>

      <ContentPanel className="mt-8">
        <SectionHeader
          title="현금 일정 (단기)"
          description="이번 주와 다음 주에 실제로 움직일 자금을 따로 확인합니다."
        />
        <div className="ui-summary-strip grid sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["연체", "+42,000.00 USD", "받을 돈 1건"],
            ["이번 주", "+54,200.00 USD", "AR 2건 · AP 1건"],
            ["다음 주", "-18,000.00 USD", "AP 2건"],
            ["이번 달", "+88,000.00 USD", "확정 일정 7건"],
            ["방향 미정", "2건", "통화·수금 방향 확인"],
          ].map(([label, value, note]) => (
            <div key={label} className="p-4">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="mt-1 font-semibold">{value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{note}</div>
            </div>
          ))}
        </div>
      </ContentPanel>

      <div className="mt-8 grid items-start gap-10 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <aside className="order-2 space-y-8 xl:sticky xl:top-20 xl:order-none xl:col-start-2 xl:row-start-1">
          <section>
            <SectionHeader
              title="전망·리스크"
              description="처리 판단에 영향을 주는 환율, 연체, 거래처 신호입니다."
            />
            <div className="divide-y">
              {fxExposureRows.map((row) => (
                <div
                  key={row.currency}
                  className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 py-3 text-sm"
                >
                  <span className="font-medium">{row.currency}</span>
                  <span className="text-xs text-muted-foreground">
                    AR {row.ar} · AP {row.ap}
                  </span>
                  <Status tone={row.tone}>{row.net}</Status>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader
              title="결제 신뢰 등급"
              description="지연과 연체가 큰 거래처부터 봅니다."
            />
            <div className="divide-y">
              {visibleScores.map((row) => (
                <button
                  type="button"
                  key={row.party}
                  className="grid w-full grid-cols-[1fr_auto] gap-3 py-3 text-left transition-colors hover:bg-sidebar-accent/80"
                  onClick={() => onNavigate("counterparty")}
                >
                  <span>
                    <span className="block text-sm font-medium">
                      {row.party}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      평균 지연 {row.delay} · 정산 {row.volume}
                    </span>
                  </span>
                  <span className="text-right">
                    <Status tone={row.tone}>
                      {row.grade} · {row.score}
                    </Status>
                    <span
                      className={cn(
                        "mt-1 block text-xs",
                        row.overdue !== "0 USD"
                          ? "text-red-600"
                          : "text-muted-foreground"
                      )}
                    >
                      연체 {row.overdue}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <SettlementPagination
              total={counterpartyScores.length}
              page={scorePage}
              pageSize={sidePageSize}
              onPageChange={setScorePage}
            />
          </section>

          <section>
            <SectionHeader
              title="연체 경과"
              description="미도래와 연체 잔액을 구간별로 봅니다."
            />
            <div className="space-y-3 rounded-md bg-sidebar px-3 py-3 text-sm">
              <div>
                <div className="flex justify-between">
                  <span className="font-medium">받을 돈</span>
                  <span>166,000.00</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
                  <span className="rounded bg-muted px-2 py-1">
                    미도래 124,000.00
                  </span>
                  <span className="rounded bg-amber-50 px-2 py-1 text-amber-700">
                    1-30일 32,000.00
                  </span>
                  <span className="rounded bg-red-50 px-2 py-1 text-red-600">
                    31-60일 10,000.00
                  </span>
                </div>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="font-medium">보낼 돈</span>
                <span>미도래 120,000.00</span>
              </div>
            </div>
          </section>

          <section>
            <SectionHeader
              title="거래처별 AR/AP"
              description="연체 거래처와 통화 혼재를 우선 표시합니다."
            />
            <div className="divide-y">
              {visibleCounterpartyRows.map(
                ([party, currency, ar, ap, overdue]) => (
                  <button
                    type="button"
                    key={party}
                    className="w-full py-3 text-left transition-colors hover:bg-sidebar-accent/80"
                    onClick={() =>
                      setExpandedParty(expandedParty === party ? null : party)
                    }
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {party}
                      </span>
                      {overdue !== "-" ? (
                        <Status tone="red">연체 {overdue}</Status>
                      ) : null}
                    </span>
                    <span className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {currency}
                        {currency.includes("/") ? " · 통화 혼재" : ""}
                      </span>
                      <span>
                        AR {ar} · AP {ap}
                      </span>
                    </span>
                  </button>
                )
              )}
            </div>
            <SettlementPagination
              total={counterpartyArApRows.length}
              page={partyPage}
              pageSize={sidePageSize}
              onPageChange={setPartyPage}
            />
            {expandedParty ? (
              <div className="border-b bg-muted/30 px-3 py-3 text-xs">
                <span className="font-medium">{expandedParty}</span> · 예정 2건
                <br />
                <Button
                  variant="link"
                  className="mt-1 h-auto p-0 text-xs"
                  onClick={() => {
                    const dealId = ledgerRows.find((row) => row.party === expandedParty)?.deal
                    if (dealId) onNavigate("deal", { dealId })
                  }}
                >
                  Deal 보기
                </Button>{" "}
                ·{" "}
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={() => onNavigate("counterparty")}
                >
                  Customer 360
                </Button>
              </div>
            ) : null}
          </section>
        </aside>

        <div className="order-1 min-w-0 space-y-10 xl:order-none xl:col-start-1 xl:row-start-1">
          <ContentPanel id="settlement-ledger" className="scroll-mt-20">
            <SectionHeader
              title="AR/AP 원장"
              description="받을 돈과 보낼 돈을 함께 보고, 선택한 거래건에서 바로 기록합니다."
              trailing={
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <div className="flex rounded-md bg-muted p-1">
                    {(["AR", "AP"] as const).map((tab) => (
                      <Button
                        key={tab}
                        size="sm"
                        variant={ledgerTab === tab ? "secondary" : "ghost"}
                        onClick={() => {
                          setLedgerTab(tab)
                          setLedgerPage(1)
                        }}
                      >
                        {tab === "AR" ? "받을 돈" : "보낼 돈"}
                      </Button>
                    ))}
                  </div>
                  <Select
                    value={ledgerStatus}
                    onValueChange={(value) => {
                      setLedgerStatus(value as typeof ledgerStatus)
                      setLedgerPage(1)
                    }}
                  >
                    <SelectTrigger className="w-40" aria-label="정산 상태 필터">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="전체 상태">전체 상태</SelectItem>
                      <SelectItem value="미정산">미정산</SelectItem>
                      <SelectItem value="정산 완료">정산 완료</SelectItem>
                      <SelectItem value="정산 대상 아님">
                        정산 대상 아님
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant={includeCancelled ? "secondary" : "outline"}
                    onClick={() => {
                      setIncludeCancelled((value) => !value)
                      setLedgerPage(1)
                    }}
                  >
                    취소 거래 {includeCancelled ? "숨기기" : "포함"}
                  </Button>
                </div>
              }
            />
            <PanelTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>구분</TableHead>
                    <TableHead>거래처</TableHead>
                    <TableHead className="text-right">총 금액</TableHead>
                    <TableHead className="text-right">처리 금액</TableHead>
                    <TableHead className="text-right">잔액</TableHead>
                    <TableHead>만기</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleLedger.map((row) => (
                    <TableRow
                      key={row.id}
                      className={cn(
                        "cursor-pointer",
                        expandedParty === row.party && "bg-primary/5"
                      )}
                      onClick={() =>
                        setExpandedParty(
                          expandedParty === row.party ? null : row.party
                        )
                      }
                    >
                      <TableCell>
                        <Status tone={row.type === "AR" ? "blue" : "neutral"}>
                          {row.type === "AR" ? "받을 돈" : "보낼 돈"}
                        </Status>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => onNavigate("counterparty")}
                          className="font-medium"
                        >
                          {row.party}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.amount}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.paid}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {row.balance}
                      </TableCell>
                      <TableCell>
                        {row.due}
                        <div className="text-xs text-muted-foreground">
                          {row.deal}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Status
                          tone={
                            saved.includes(row.id) ||
                            row.status === "정산 완료"
                              ? "green"
                              : row.status === "정산 대상 아님"
                                ? "neutral"
                                : row.due === "오늘"
                                  ? "red"
                                  : "neutral"
                          }
                        >
                          {saved.includes(row.id)
                            ? "처리 기록 있음"
                            : row.status}
                        </Status>
                        {row.dealState === "취소" ? (
                          <div className="mt-1 text-xs text-muted-foreground">
                            취소 거래 · 읽기 전용
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={
                            recording === row.id ? "secondary" : "outline"
                          }
                          size="xs"
                          disabled={
                            pendingScheduleId === row.id ||
                            row.readOnly ||
                            row.requiredObligations === 0
                          }
                          onClick={(event) => {
                            event.stopPropagation()
                            if (
                              row.status === "정산 완료" &&
                              !reopenedSchedules.includes(row.id)
                            ) {
                              setSettlementAction("pending")
                              setPendingScheduleId(row.id)
                              void prototypeBackend.settlement
                                .uncompleteSchedule(row.id)
                                .then(() => {
                                  setReopenedSchedules((items) => [
                                    ...items,
                                    row.id,
                                  ])
                                  setSettlementAction("idle")
                                  setPendingScheduleId(null)
                                })
                                .catch(() => {
                                  setSettlementAction("error")
                                  setPendingScheduleId(null)
                                })
                              return
                            }
                            setSettlementAction("idle")
                            setRecording(row.id)
                            setPaymentDraft({
                              amount: (row.type === "AR"
                                ? row.balance
                                : row.amount
                              ).replace(/[^0-9.-]/g, ""),
                              paidAt: "2026-07-13",
                              fee: "",
                              note: "",
                            })
                          }}
                        >
                          {pendingScheduleId === row.id ? (
                            <Loader2 className="animate-spin" />
                          ) : null}
                          {row.readOnly || row.requiredObligations === 0
                            ? "조회만"
                            : row.status === "정산 완료" &&
                                !reopenedSchedules.includes(row.id)
                              ? "완료 취소"
                              : row.type === "AR"
                                ? "입금 기록"
                                : "지급 기록"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {expandedParty ? (
                <div className="grid gap-3 border-b bg-muted/30 px-4 py-3 text-sm md:grid-cols-4">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      연결 거래
                    </div>
                    <Button
                      variant="link"
                      className="h-auto p-0"
                      onClick={() => {
                        const dealId = ledgerRows.find((row) => row.party === expandedParty)?.deal
                        if (dealId) onNavigate("deal", { dealId })
                      }}
                    >
                      {
                        ledgerRows.find((row) => row.party === expandedParty)
                          ?.deal
                      }
                    </Button>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      최근 처리
                    </div>
                    <div className="mt-1">2026.07.09 · 40,000 USD</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      근거 문서
                    </div>
                    <div className="mt-1">CI · 송금 확인서</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      다음 작업
                    </div>
                    <div className="mt-1">잔액 및 은행 수수료 확인</div>
                  </div>
                </div>
              ) : null}
            </PanelTable>
            <SettlementPagination
              total={filteredLedger.length}
              page={ledgerPage}
              pageSize={ledgerPageSize}
              onPageChange={setLedgerPage}
            />
          </ContentPanel>
          <Sheet
            open={Boolean(recordingRow)}
            onOpenChange={(open) => !open && setRecording(null)}
          >
            <SheetContent
              side="right"
              showCloseButton={false}
              overlayClassName="top-15"
              className="top-15! bottom-0! h-auto! w-full gap-0 p-0 sm:max-w-[520px]"
            >
              <div className="flex h-14 shrink-0 items-center justify-between border-b px-5">
                <div>
                  <SheetTitle>정산 기록</SheetTitle>
                  <SheetDescription>
                    부분 입금·지급을 차수별로 기록하고 잔액을 추적합니다.
                  </SheetDescription>
                </div>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" aria-label="닫기">
                    <X />
                  </Button>
                </SheetClose>
              </div>
              {recordingRow ? (
                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                  <Card>
                    <CardHeader>
                      <CardTitle>{recordingRow.party}</CardTitle>
                      <CardDescription>
                        {recordingRow.type === "AR" ? "받을 돈" : "보낼 돈"} ·
                        만기 {recordingRow.due}
                      </CardDescription>
                      <CardAction>
                        <Status
                          tone={recordingRow.type === "AR" ? "blue" : "neutral"}
                        >
                          {recordingRow.type}
                        </Status>
                      </CardAction>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <p className="text-sm leading-6 text-muted-foreground">
                        처리 기록이 추가되어도 잔액이 0이 되기 전에는 정산
                        완료로 표시되지 않습니다.
                      </p>
                      <div className="grid grid-cols-2 gap-3 rounded-md bg-sidebar px-3 py-4 text-sm">
                        <div>
                          <div className="text-xs text-muted-foreground">
                            잔액
                          </div>
                          <div className="mt-1 font-semibold">
                            {recordingRow.balance}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            기처리
                          </div>
                          <div className="mt-1 font-semibold">
                            {recordingRow.paid}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setExceptionScheduleId(recordingRow.id)
                          setExceptionKind("overpayment")
                          setExceptionDraft({
                            amount: "",
                            reason: "",
                            evidence: "",
                          })
                          setExceptionError("")
                          setRecording(null)
                        }}
                      >
                        <ShieldAlert /> 초과금·조정·분쟁 처리
                      </Button>
                      <label className="grid gap-1.5 text-sm">
                        <span>
                          {recordingRow.type === "AR" ? "입금액" : "지급액"}
                        </span>
                        <Input
                          inputMode="decimal"
                          value={paymentDraft.amount}
                          onChange={(event) =>
                            setPaymentDraft((draft) => ({
                              ...draft,
                              amount: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="grid gap-1.5 text-sm">
                        <span>처리일</span>
                        <Input
                          type="date"
                          value={paymentDraft.paidAt}
                          onChange={(event) =>
                            setPaymentDraft((draft) => ({
                              ...draft,
                              paidAt: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="grid gap-1.5 text-sm">
                        <span>은행 수수료</span>
                        <Input
                          inputMode="decimal"
                          value={paymentDraft.fee}
                          placeholder="0"
                          onChange={(event) =>
                            setPaymentDraft((draft) => ({
                              ...draft,
                              fee: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="grid gap-1.5 text-sm">
                        <span>메모</span>
                        <Textarea
                          value={paymentDraft.note}
                          placeholder="입금·지급 근거나 회계 인계 메모"
                          onChange={(event) =>
                            setPaymentDraft((draft) => ({
                              ...draft,
                              note: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <div className="flex justify-end gap-2 pt-2">
                        <SheetClose asChild>
                          <Button variant="outline">취소</Button>
                        </SheetClose>
                        <Button
                          disabled={
                            settlementAction === "pending" ||
                            !paymentDraft.amount ||
                            !paymentDraft.paidAt
                          }
                          onClick={async () => {
                            setSettlementAction("pending")
                            setPendingScheduleId(recordingRow.id)
                            try {
                              await prototypeBackend.settlement.recordPayment({
                                scheduleId: recordingRow.id,
                                amount: paymentDraft.amount,
                                paidAt: paymentDraft.paidAt,
                                fee: paymentDraft.fee || "0",
                                note: paymentDraft.note || undefined,
                              })
                              setSaved((items) => [
                                ...items,
                                recordingRow.id,
                              ])
                              setPaymentRecords((records) => [
                                ...records,
                                {
                                  id: `PAY-${Date.now()}`,
                                  scheduleId: recordingRow.id,
                                  type: recordingRow.type as "AR" | "AP",
                                  amount: paymentDraft.amount,
                                  fee: paymentDraft.fee || "0",
                                  paidAt: paymentDraft.paidAt,
                                  note: paymentDraft.note || undefined,
                                },
                              ])
                              setSettlementAction("idle")
                              setPendingScheduleId(null)
                              setPaymentDraft((draft) => ({
                                ...draft,
                                amount: "",
                                fee: "",
                                note: "",
                              }))
                              toast.success(
                                "처리 내역을 추가했습니다. 남은 잔액은 계속 추적됩니다."
                              )
                            } catch {
                              setSettlementAction("error")
                              setPendingScheduleId(null)
                            }
                          }}
                        >
                          {settlementAction === "pending" ? (
                            <Loader2 className="animate-spin" />
                          ) : null}
                          {settlementAction === "pending"
                            ? "기록 중"
                            : "기록 완료"}
                        </Button>
                      </div>
                      {settlementAction === "error" ? (
                        <p className="text-sm text-destructive">
                          정산 내역을 저장하지 못했습니다. 입력값을 확인하고
                          다시 시도해주세요.
                        </p>
                      ) : null}
                      <div className="border-t pt-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold">처리 이력</h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                              분할 입금·지급과 수수료를 각각 보관합니다.
                            </p>
                          </div>
                          <Status>{recordingHistory.length}건</Status>
                        </div>
                        <div className="mt-3 divide-y">
                          {recordingHistory.map((record) => (
                            <div
                              key={record.id}
                              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 text-sm"
                            >
                              <div>
                                <div className="font-medium">
                                  {record.amount}{" "}
                                  {recordingRow.type === "AR" ? "입금" : "지급"}
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {record.paidAt} · 수수료 {record.fee}
                                  {record.note ? ` · ${record.note}` : ""}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label="처리 기록 삭제"
                                onClick={async () => {
                                  const result =
                                    await prototypeBackend.settlement.deletePayment(
                                      recordingRow.id,
                                      record.id
                                    )
                                  if (!result.ok) {
                                    toast.error(result.error)
                                    return
                                  }
                                  setPaymentRecords((records) =>
                                    records.filter(
                                      (item) => item.id !== record.id
                                    )
                                  )
                                  toast.success(
                                    "처리 기록을 삭제했습니다. 잔액을 다시 확인해주세요."
                                  )
                                }}
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          ))}
                          {recordingHistory.length === 0 ? (
                            <div className="py-5 text-sm text-muted-foreground">
                              아직 기록된 입금·지급 내역이 없습니다.
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </SheetContent>
          </Sheet>

          <Sheet
            open={Boolean(exceptionRow)}
            onOpenChange={(open) => {
              if (!open && !exceptionBusy) setExceptionScheduleId(null)
            }}
          >
            <SheetContent
              side="right"
              showCloseButton={false}
              overlayClassName="top-15"
              className="top-15! bottom-0! h-auto! w-full gap-0 p-0 sm:max-w-[560px]"
            >
              <div className="flex h-14 shrink-0 items-center justify-between border-b px-5">
                <div>
                  <SheetTitle>정산 예외 처리</SheetTitle>
                  <SheetDescription>
                    초과금, 조정, 환불, 분쟁과 대손을 현금 처리 이력과 분리해
                    기록합니다.
                  </SheetDescription>
                </div>
                <SheetClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="닫기"
                    disabled={exceptionBusy}
                  >
                    <X />
                  </Button>
                </SheetClose>
              </div>
              {exceptionRow ? (
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
                  <div className="grid grid-cols-2 gap-3 rounded-md bg-sidebar px-4 py-4 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">대상</div>
                      <div className="mt-1 font-semibold">
                        {exceptionRow.party}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {exceptionRow.id}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        현재 잔액
                      </div>
                      <div className="mt-1 font-semibold tabular-nums">
                        {exceptionRow.balance}
                      </div>
                    </div>
                  </div>

                  <label className="grid gap-1.5 text-sm">
                    <span>예외 유형</span>
                    <Select
                      value={exceptionKind}
                      onValueChange={(value) => {
                        if (!value) return
                        setExceptionKind(value as typeof exceptionKind)
                        setExceptionError("")
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(exceptionKindLabels).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </label>

                  {exceptionKind === "refund" &&
                  !selectedExceptionHistory.some(
                    (item) => item.kind === "초과금"
                  ) ? (
                    <div
                      className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
                      role="alert"
                    >
                      환불·반환은 먼저 기록된 초과금 또는 선수/선급 잔액이
                      있어야 합니다.
                    </div>
                  ) : null}
                  {exceptionKind === "writeoff" ? (
                    <div
                      className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                      role="alert"
                    >
                      대손 제안은 즉시 원장을 닫지 않습니다. 별도 권한을 가진
                      승인자가 근거와 불변 마감 이력을 확인한 뒤 확정합니다.
                    </div>
                  ) : null}

                  <label className="grid gap-1.5 text-sm">
                    <span>금액</span>
                    <div className="grid grid-cols-[1fr_6rem] gap-2">
                      <Input
                        inputMode="decimal"
                        value={exceptionDraft.amount}
                        placeholder={exceptionRow.balance.replace(
                          /[^0-9.-]/g,
                          ""
                        )}
                        onChange={(event) =>
                          setExceptionDraft((draft) => ({
                            ...draft,
                            amount: event.target.value,
                          }))
                        }
                      />
                      <Input value="USD" readOnly aria-label="예외 통화" />
                    </div>
                  </label>
                  <label className="grid gap-1.5 text-sm">
                    <span>사유</span>
                    <Textarea
                      value={exceptionDraft.reason}
                      placeholder="금액 변경 또는 예외 처리의 업무 사유"
                      onChange={(event) =>
                        setExceptionDraft((draft) => ({
                          ...draft,
                          reason: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm">
                    <span>근거 문서 또는 외부 증빙</span>
                    <Input
                      value={exceptionDraft.evidence}
                      placeholder="문서 ID 또는 증빙 URL"
                      onChange={(event) =>
                        setExceptionDraft((draft) => ({
                          ...draft,
                          evidence: event.target.value,
                        }))
                      }
                    />
                  </label>
                  {exceptionError ? (
                    <p className="text-sm text-destructive" role="alert">
                      {exceptionError}
                    </p>
                  ) : null}
                  <Button
                    className="w-full"
                    disabled={
                      exceptionBusy ||
                      !exceptionDraft.amount.trim() ||
                      !exceptionDraft.reason.trim() ||
                      ((exceptionKind === "dispute" ||
                        exceptionKind === "writeoff") &&
                        !exceptionDraft.evidence.trim()) ||
                      (exceptionKind === "refund" &&
                        !selectedExceptionHistory.some(
                          (item) => item.kind === "초과금"
                        ))
                    }
                    onClick={async () => {
                      setExceptionBusy(true)
                      setExceptionError("")
                      const mutation =
                        exceptionKind === "overpayment"
                          ? prototypeBackend.settlement.recordOverpayment(
                              exceptionRow.id
                            )
                          : exceptionKind === "adjustment"
                            ? prototypeBackend.settlement.recordAdjustment(
                                exceptionRow.id
                              )
                            : exceptionKind === "refund"
                              ? prototypeBackend.settlement.recordRefund(
                                  exceptionRow.id
                                )
                              : exceptionKind === "dispute"
                                ? prototypeBackend.settlement.openDispute(
                                    exceptionRow.id
                                  )
                                : prototypeBackend.settlement.proposeWriteoff(
                                    exceptionRow.id
                                  )
                      try {
                        const result = await mutation
                        if (!result.ok) {
                          setExceptionError(result.error)
                          return
                        }
                        setExceptionHistory((items) => [
                          ...items,
                          {
                            id: `EXC-${Date.now()}`,
                            scheduleId: exceptionRow.id,
                            kind:
                              exceptionKind === "overpayment"
                                ? "초과금"
                                : exceptionKindLabels[exceptionKind],
                            amount: `${exceptionDraft.amount} USD`,
                            reason: exceptionDraft.reason,
                          },
                        ])
                        setExceptionDraft({
                          amount: "",
                          reason: "",
                          evidence: "",
                        })
                        toast.success(
                          `${exceptionKindLabels[exceptionKind]} 기록을 저장했습니다.`
                        )
                      } catch {
                        setExceptionError(
                          "예외 기록을 저장하지 못했습니다. 입력값과 권한을 확인해 주세요."
                        )
                      } finally {
                        setExceptionBusy(false)
                      }
                    }}
                  >
                    {exceptionBusy ? (
                      <Loader2 className="animate-spin" />
                    ) : null}
                    {exceptionBusy
                      ? "저장 중"
                      : `${exceptionKindLabels[exceptionKind]} 기록`}
                  </Button>

                  <div className="border-t pt-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">예외 이력</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          현금 지급 이벤트와 별도로 감사 가능한 이력을
                          유지합니다.
                        </p>
                      </div>
                      <Status>{selectedExceptionHistory.length}건</Status>
                    </div>
                    <div className="mt-3 divide-y">
                      {selectedExceptionHistory.map((item) => (
                        <div key={item.id} className="py-3 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium">{item.kind}</span>
                            <span className="tabular-nums">{item.amount}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.reason}
                          </p>
                        </div>
                      ))}
                      {selectedExceptionHistory.length === 0 ? (
                        <div className="py-5 text-sm text-muted-foreground">
                          기록된 정산 예외가 없습니다.
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </SheetContent>
          </Sheet>

          <ContentPanel>
            <SectionHeader
              title="예상 거래손익 / 인계 준비도"
              description="확정 송장 기준 예상 거래손익입니다. 회계상 매출·이익과 구분하며, 받을 돈과 보낼 돈을 통화별로 확인합니다."
            />
            <PanelTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal</TableHead>
                    <TableHead>거래처 / 담당자</TableHead>
                    <TableHead className="text-right">매출측 송장</TableHead>
                    <TableHead className="text-right">매입측 송장</TableHead>
                    <TableHead className="text-right">부대비용</TableHead>
                    <TableHead className="text-right">
                      비용 반영 예상손익
                    </TableHead>
                    <TableHead className="text-right">받을 돈</TableHead>
                    <TableHead className="text-right">보낼 돈</TableHead>
                    <TableHead>품질</TableHead>
                    <TableHead>근거 문서</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleFinanceRows.map((row) => (
                    <TableRow
                      key={row.deal}
                      className="cursor-pointer"
                      onClick={() => onNavigate("deal", { dealId: row.deal })}
                    >
                      <TableCell className="font-medium text-primary">
                        {row.deal}
                      </TableCell>
                      <TableCell>
                        {row.party}
                        <div className="text-xs text-muted-foreground">
                          {row.owner}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {presentFinanceFact(row).invoiceSales}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {presentFinanceFact(row).invoicePurchases}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {presentFinanceFact(row).costs}
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-700 tabular-nums">
                        {presentFinanceFact(row).adjustedResult}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {presentFinanceFact(row).receivable}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {presentFinanceFact(row).payable}
                      </TableCell>
                      <TableCell>
                        <Status
                          tone={row.quality === "인계 가능" ? "green" : "amber"}
                        >
                          {row.quality}
                        </Status>
                      </TableCell>
                      <TableCell>{row.docs}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </PanelTable>
            <SettlementPagination
              total={financeFacts.length}
              page={financePage}
              pageSize={tablePageSize}
              onPageChange={setFinancePage}
            />
          </ContentPanel>

          <ContentPanel className="pb-8">
            <SectionHeader
              title="수익성 롤업"
              description="회계 ERP로 넘기기 전 거래처·담당자별 GP와 미수 영향을 함께 봅니다."
              trailing={
                <div className="flex rounded-md bg-muted p-1">
                  <Button
                    size="sm"
                    variant={
                      rollupType === "counterparty" ? "secondary" : "ghost"
                    }
                    onClick={() => {
                      setRollupType("counterparty")
                      setRollupPage(1)
                    }}
                  >
                    거래처별
                  </Button>
                  <Button
                    size="sm"
                    variant={rollupType === "owner" ? "secondary" : "ghost"}
                    onClick={() => {
                      setRollupType("owner")
                      setRollupPage(1)
                    }}
                  >
                    담당자별
                  </Button>
                </div>
              }
            />
            <div className="ui-summary-strip grid sm:grid-cols-3">
              {[
                [
                  "최고 GP",
                  rollupType === "counterparty" ? "ACME GmbH" : "조민영",
                  "82,000.00 USD",
                ],
                ["검토 필요", "ACME GmbH", "연체 42,000.00 USD 반영"],
                ["인계 준비", "KATAMAN", "12/12 완료"],
              ].map(([label, value, note]) => (
                <div key={label} className="p-4">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="mt-1 font-semibold">{value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {note}
                  </div>
                </div>
              ))}
            </div>
            <PanelTable className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {rollupType === "counterparty" ? "거래처" : "담당자"}
                    </TableHead>
                    <TableHead className="text-right">거래</TableHead>
                    <TableHead className="text-right">매출</TableHead>
                    <TableHead className="text-right">조정 GP</TableHead>
                    <TableHead className="text-right">GP %</TableHead>
                    <TableHead className="text-right">미수/미지급</TableHead>
                    <TableHead className="text-right">준비</TableHead>
                    <TableHead>판단</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleProfitabilityRows.map((row, index) => (
                    <TableRow key={row.name}>
                      <TableCell className="font-medium">
                        {rollupType === "counterparty"
                          ? row.name
                          : ["조민영", "김민지", "박서준"][index]}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.deals}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.revenue}
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-700 tabular-nums">
                        {row.gp}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.margin}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.outstanding}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.readiness}
                      </TableCell>
                      <TableCell>
                        <Status
                          tone={row.decision === "정상" ? "green" : "amber"}
                        >
                          {row.decision}
                        </Status>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </PanelTable>
            <SettlementPagination
              total={profitabilityRows.length}
              page={rollupPage}
              pageSize={tablePageSize}
              onPageChange={setRollupPage}
            />
          </ContentPanel>
        </div>
      </div>
    </Page>
  )
}

const risks = [
  {
    id: 1,
    severity: "높음",
    title: "B/L 수량과 포장명세 불일치",
    deal: "DL-260708-01",
    impact: "잔량 4 MT · 통관 전 확인",
    owner: "미지정",
    due: "오늘 15:00",
    source: "B/L · 포장명세",
    tone: "red" as Tone,
    actionLabel: "거래에서 확인",
    actionTarget: "deal" as ErpMenuTarget,
  },
  {
    id: 2,
    severity: "높음",
    title: "수취 계좌 변경 감지",
    deal: "DL-260625-03",
    impact: "166,000.00 USD 지급 전 확인",
    owner: "조민영",
    due: "지급 전",
    source: "인보이스 · 거래처 마스터",
    tone: "red" as Tone,
    actionLabel: "거래에서 확인",
    actionTarget: "deal" as ErpMenuTarget,
  },
  {
    id: 3,
    severity: "중간",
    title: "ETA 2일 전 B/L 누락",
    deal: "DL-260708-01",
    impact: "통관 지연 가능",
    owner: "김민지",
    due: "D-2",
    source: "선적 일정 · 문서함",
    tone: "amber" as Tone,
    actionLabel: "선적에서 확인",
    actionTarget: "shipments" as ErpMenuTarget,
  },
  {
    id: 4,
    severity: "낮음",
    title: "거래처 결제 지연 추세",
    deal: "DL-260512-08",
    impact: "ACME GmbH · 평균 +3일",
    owner: "조민영",
    due: "이번 주",
    source: "정산 원장",
    tone: "neutral" as Tone,
    actionLabel: "정산에서 확인",
    actionTarget: "settlement" as ErpMenuTarget,
  },
]

export function MonitoringPrototype({ onNavigate, role = "owner" }: { onNavigate: Navigate; role?: "owner" | "admin" | "member" }) {
  const [editingRiskId, setEditingRiskId] = useState<number | null>(null)
  const [resolved, setResolved] = useState<number[]>([])
  const [severityFilter, setSeverityFilter] = useState("all")
  const [ownerFilter, setOwnerFilter] = useState("all")
  const [assignee, setAssignee] = useState("미지정")
  const [riskNote, setRiskNote] = useState("")
  const [processingRisk, setProcessingRisk] = useState(false)
  const unresolvedRisks = risks.filter((item) => !resolved.includes(item.id))
  const active = unresolvedRisks.filter(
    (item) =>
      (severityFilter === "all" || item.severity === severityFilter) &&
      (ownerFilter === "all" || item.owner === ownerFilter)
  )
  const selectedRisk = unresolvedRisks.find((item) => item.id === editingRiskId)
  const openAction = (risk: (typeof risks)[number]) => {
    setAssignee(risk.owner)
    setRiskNote("")
    setEditingRiskId(risk.id)
  }
  const handleRiskDisposition = async (
    disposition: "confirmed" | "dismissed"
  ) => {
    if (!selectedRisk || processingRisk) return
    setProcessingRisk(true)
    const result = await prototypeBackend.flags.acknowledge({
      id: String(selectedRisk.id),
      disposition,
      assigneeId: assignee === "미지정" ? null : assignee,
      note: riskNote.trim() || undefined,
    })
    setProcessingRisk(false)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setResolved((items) => [...items, selectedRisk.id])
    setEditingRiskId(null)
    toast.success(
      disposition === "confirmed"
        ? "예외를 확인 처리했습니다."
        : "예외를 무시 처리했습니다."
    )
  }
  if (role !== "owner") return (
    <Page title="운영 감시" description="운영 감시는 Owner만 사용할 수 있습니다.">
      <div role="alert" className="rounded-lg border p-6 text-sm">
        이 화면을 볼 권한이 없습니다. 조직 Owner에게 문의해 주세요.
      </div>
    </Page>
  )
  return (
    <Page
      title="운영 감시"
      description="예외의 영향과 근거를 확인하고 담당자를 지정해 조치합니다."
      analyticsLayout
      heroControls={
        <AnalyticsFilterBar>
          <Select
            value={severityFilter}
            onValueChange={(value) => setSeverityFilter(value ?? "all")}
          >
            <SelectTrigger
              className="w-36 shadow-none backdrop-blur-sm hover:shadow-none"
              aria-label="심각도 필터"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 심각도</SelectItem>
              <SelectItem value="높음">높음</SelectItem>
              <SelectItem value="중간">중간</SelectItem>
              <SelectItem value="낮음">낮음</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={ownerFilter}
            onValueChange={(value) => setOwnerFilter(value ?? "all")}
          >
            <SelectTrigger
              className="w-36 shadow-none backdrop-blur-sm hover:shadow-none"
              aria-label="담당자 필터"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 담당자</SelectItem>
              <SelectItem value="미지정">미지정</SelectItem>
              <SelectItem value="조민영">조민영</SelectItem>
              <SelectItem value="김민지">김민지</SelectItem>
            </SelectContent>
          </Select>
          <span className="ml-auto pb-2 text-xs text-[var(--surface-muted-foreground)]">
            미해결 {active.length} / {unresolvedRisks.length}건
          </span>
        </AnalyticsFilterBar>
      }
      heroSummary={
        <SummaryMetricStrip
          items={[
            { label: "Blocked", value: "1건", note: "즉시", tone: "red" },
            { label: "Risk", value: "3건" },
            {
              label: "Pending action",
              value: "4건",
              note: "2건 미지정",
              tone: "amber",
            },
            {
              label: "Throughput",
              value: "12건/일",
              note: "+8%",
              tone: "green",
            },
          ]}
        />
      }
    >
      <MonitoringOperationsContent onNavigate={onNavigate} />
      <ContentPanel>
        <SectionHeader
          title="우선순위 예외 큐"
          description="심각도, 금액·일정 영향과 담당자를 한 번에 확인합니다."
          trailing={
            <div className="text-xs text-muted-foreground">
              <RefreshCw className="mr-1 inline size-3.5" />
              09:30 정상 갱신
            </div>
          }
        />
        <PanelTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>심각도</TableHead>
                <TableHead>예외·근거</TableHead>
                <TableHead>영향 거래</TableHead>
                <TableHead>영향</TableHead>
                <TableHead>담당자</TableHead>
                <TableHead>기한</TableHead>
                <TableHead className="text-right">다음 액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {active.map((risk) => (
                <TableRow
                  key={risk.id}
                  className={cn(
                    "cursor-pointer",
                    editingRiskId === risk.id && "bg-primary/5"
                  )}
                  onClick={() => openAction(risk)}
                >
                  <TableCell>
                    <Status tone={risk.tone}>{risk.severity}</Status>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{risk.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {risk.source}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="xs"
                      className="font-medium"
                      onClick={(event) => { event.stopPropagation(); onNavigate("deal", { dealId: risk.deal }) }}
                    >
                      {risk.deal}
                    </Button>
                  </TableCell>
                  <TableCell>{risk.impact}</TableCell>
                  <TableCell>{risk.owner}</TableCell>
                  <TableCell>{risk.due}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={(event) => {
                        event.stopPropagation()
                        onNavigate(risk.actionTarget, { dealId: risk.deal })
                      }}
                    >
                      {risk.actionLabel}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {active.length === 0 ? (
            <div className="border-y border-dashed bg-muted/15 px-4 py-16 text-center text-sm text-muted-foreground">
              처리할 활성 위험이 없습니다.
            </div>
          ) : null}
        </PanelTable>
      </ContentPanel>
      <Sheet
        open={Boolean(selectedRisk)}
        onOpenChange={(open) => !open && setEditingRiskId(null)}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          overlayClassName="top-15"
          className="top-15! bottom-0! h-auto! w-full gap-0 p-0 sm:max-w-[540px]"
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b px-5">
            <div>
              <SheetTitle>예외 처리</SheetTitle>
              <SheetDescription>
                근거를 확인하고 담당자와 처리 결과를 남깁니다.
              </SheetDescription>
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" aria-label="닫기">
                <X />
              </Button>
            </SheetClose>
          </div>
          {selectedRisk ? (
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedRisk.title}</CardTitle>
                  <CardDescription>{selectedRisk.deal}</CardDescription>
                  <CardAction>
                    <Status tone={selectedRisk.tone}>
                      {selectedRisk.severity}
                    </Status>
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="divide-y text-sm">
                    <div className="flex items-start justify-between gap-4 py-3">
                      <span className="text-muted-foreground">근거</span>
                      <strong className="text-right font-medium">
                        {selectedRisk.source}
                      </strong>
                    </div>
                    <div className="flex items-start justify-between gap-4 py-3">
                      <span className="text-muted-foreground">영향</span>
                      <strong className="text-right font-medium">
                        {selectedRisk.impact}
                      </strong>
                    </div>
                    <div className="flex items-start justify-between gap-4 py-3">
                      <span className="text-muted-foreground">기한</span>
                      <strong className="text-right font-medium">
                        {selectedRisk.due}
                      </strong>
                    </div>
                  </div>
                  <label className="grid gap-1.5 text-sm">
                    <span>담당자</span>
                    <Select
                      value={assignee}
                      onValueChange={(value) => setAssignee(value ?? "미지정")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["미지정", "조민영", "김민지", "박서준"].map(
                          (name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="grid gap-1.5 text-sm">
                    <span>처리 메모</span>
                    <Textarea
                      value={riskNote}
                      onChange={(event) => setRiskNote(event.target.value)}
                      placeholder="확인한 내용과 후속 조치를 입력하세요."
                    />
                  </label>
                  <div className="flex flex-wrap justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => onNavigate(selectedRisk.actionTarget)}
                    >
                      {selectedRisk.actionLabel}
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={processingRisk}
                      onClick={() => void handleRiskDisposition("dismissed")}
                    >
                      무시
                    </Button>
                    <Button
                      disabled={processingRisk}
                      onClick={() => void handleRiskDisposition("confirmed")}
                    >
                      {processingRisk ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Check />
                      )}
                      {processingRisk ? "처리 중" : "확인 처리"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </Page>
  )
}

const reportCollectionDataUsd = [
  { period: "25.09", planned: 0, actual: 0 },
  { period: "25.11", planned: 0, actual: 0 },
  { period: "26.01", planned: 0, actual: 0 },
  { period: "26.03", planned: 0, actual: 0 },
  { period: "26.05", planned: 0, actual: 0 },
  { period: "26.07", planned: 139420, actual: 0 },
]

const reportCollectionConfig = {
  planned: { label: "수취 예정", color: "#d8e2f8" },
  actual: { label: "실수금", color: "var(--primary)" },
} satisfies ChartConfig

const reportBalanceDataUsd = [
  { period: "25.09", receivable: 0, payable: 0 },
  { period: "25.11", receivable: 0, payable: 0 },
  { period: "26.01", receivable: 0, payable: 0 },
  { period: "26.03", receivable: 0, payable: 0 },
  { period: "26.05", receivable: 0, payable: 0 },
  { period: "26.07", receivable: 139420, payable: 0 },
]

const reportBalanceConfig = {
  receivable: { label: "미수 (받을 돈)", color: "var(--primary)" },
  payable: { label: "미지급 (보낼 돈)", color: "#e07a45" },
} satisfies ChartConfig

const reportOverdueDataUsd = [
  { period: "26.07", rate: 100 },
  { period: "26.08", rate: 100 },
]

const reportOverdueConfig = {
  rate: { label: "연체율", color: "var(--primary)" },
} satisfies ChartConfig

function reportCompactNumber(value: number) {
  if (Math.abs(value) >= 10000)
    return `${value < 0 ? "−" : ""}${Math.round(Math.abs(value) / 10000)}만`
  return fullNumber(value, 0)
}

export function ReportsPrototype({
  onNavigate,
}: { onNavigate?: Navigate } = {}) {
  const [unit, setUnit] = useState<"month" | "week">("month")
  const [rangeMonths, setRangeMonths] = useState<6 | 12 | 24>(12)
  const [currency, setCurrency] = useState("USD")
  const reportCollectionData = currency === "USD" ? reportCollectionDataUsd : []
  const reportBalanceData = currency === "USD" ? reportBalanceDataUsd : []
  const reportOverdueData = currency === "USD" ? reportOverdueDataUsd : []
  const [owner, setOwner] = useState("all")
  const [closePanel, setClosePanel] = useState(false)
  const [closeState, setCloseState] = useState<"idle" | "pending" | "error">(
    "idle"
  )
  const [closeNote, setCloseNote] = useState("")
  const [missingDocumentsResolved, setMissingDocumentsResolved] =
    useState(false)
  const closePeriod = "2026-07"
  const closedPeriod = "2026-06"
  const closeBlocked = !missingDocumentsResolved || !closeNote.trim()
  const availableRanges = unit === "month" ? [6, 12, 24] : [6, 12]
  const availableCurrencies = ["USD", "SGD"]

  const changeUnit = (next: "month" | "week") => {
    setUnit(next)
    if (next === "week" && rangeMonths === 24) setRangeMonths(12)
  }

  return (
    <Page
      title="결산 리포트"
      description="월별 흐름과 기말 잔액을 추세로 보고, 확정된 달은 마감해 공식 숫자로 동결합니다."
      action={
        <>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setClosePanel(true)}
          >
            {closePeriod} 마감하기
          </Button>
        </>
      }
      analyticsLayout
      heroControls={
        <AnalyticsFilterBar>
          <div className="grid gap-1 text-xs text-muted-foreground">
            <div
              className="inline-flex rounded-md bg-muted p-1"
              role="group"
              aria-label="기간 단위"
            >
              {[
                ["month", "월"],
                ["week", "주"],
              ].map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-pressed={unit === value}
                  className={cn(
                    "h-7 min-w-14 px-3",
                    unit === value && "bg-background text-foreground shadow-sm"
                  )}
                  onClick={() => changeUnit(value as "month" | "week")}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-1 text-xs text-muted-foreground">
            <div
              className="inline-flex rounded-md bg-muted p-1"
              role="group"
              aria-label="조회 기간"
            >
              {availableRanges.map((months) => (
                <Button
                  key={months}
                  type="button"
                  size="sm"
                  variant="ghost"
                  aria-pressed={rangeMonths === months}
                  className={cn(
                    "h-7 min-w-16 px-3",
                    rangeMonths === months &&
                      "bg-background text-foreground shadow-sm"
                  )}
                  onClick={() => setRangeMonths(months as 6 | 12 | 24)}
                >
                  {months}개월
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-1 text-xs text-muted-foreground">
            <Select
              value={currency}
              onValueChange={(value) => setCurrency(value ?? "USD")}
            >
              <SelectTrigger className="w-24 shadow-none backdrop-blur-sm hover:shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select
            value={owner}
            onValueChange={(value) => setOwner(value ?? "all")}
          >
            <SelectTrigger className="w-48 shadow-none backdrop-blur-sm hover:shadow-none">
              <SelectValue>
                {owner === "all"
                  ? "전체 담당자"
                  : owner === "minyoung"
                    ? "조민영"
                    : owner === "minji"
                      ? "김민지"
                      : "박서준"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 담당자</SelectItem>
              <SelectItem value="minyoung">조민영</SelectItem>
              <SelectItem value="minji">김민지</SelectItem>
              <SelectItem value="seojun">박서준</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="sm">
            <RefreshCw /> 새로고침
          </Button>
        </AnalyticsFilterBar>
      }
      heroSummary={
        <SummaryMetricStrip
          className="lg:grid-cols-3 xl:grid-cols-6"
          items={[
            {
              label: `8월 수취 예정 (${currency})`,
              value: currency === "USD" ? fullMoney(0, currency) : "—",
              detail:
                currency === "USD" ? "-100% vs 7월" : "선택 통화의 자료 없음",
              detailClassName: "text-red-600",
              tone: "red",
            },
            {
              label: `8월 지급 예정 (${currency})`,
              value: currency === "USD" ? fullMoney(0, currency) : "—",
            },
            {
              label: `8월 실수금 (${currency})`,
              value: currency === "USD" ? fullMoney(0, currency) : "—",
            },
            {
              label: `8월 실제 지급 (${currency})`,
              value: currency === "USD" ? fullMoney(0, currency) : "—",
            },
            {
              label: `기말 미수 잔액 (${currency})`,
              value: currency === "USD" ? fullMoney(139420, currency) : "—",
              detail:
                currency === "USD" ? "+0% vs 7월 말" : "선택 통화의 자료 없음",
            },
            {
              label: "연체율 (미수 기준)",
              value: currency === "USD" ? "100%" : "—",
              detail:
                currency === "USD"
                  ? "+0%p vs 7월 말 · 연체 받을 돈 139,420.00 USD"
                  : "선택 통화의 자료 없음",
              tone: "amber",
            },
          ]}
        />
      }
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.85fr)]">
        <div className="min-w-0 space-y-5">
          <Card className="overflow-hidden shadow-none">
            <CardHeader className="border-b">
              <CardTitle>수취 계획 vs 실수금</CardTitle>
              <CardDescription>
                {unit === "month" ? "월별" : "주별"} · {currency} — 예정(만기
                기준)과 실제 입금(입금일 기준)
              </CardDescription>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-sm bg-muted-foreground/25" />{" "}
                  수취 예정
                </span>
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-sm bg-primary" /> 실수금
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-red-600">
                환산 상태: 환산 불가
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <ChartContainer
                config={reportCollectionConfig}
                className="h-64 w-full"
              >
                <BarChart
                  data={reportCollectionData}
                  margin={{ left: 0, right: 8, top: 4 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="period" tickLine={false} axisLine={false} />
                  <YAxis
                    domain={[0, 200000]}
                    ticks={[0, 50000, 100000, 150000, 200000]}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    tickFormatter={(value) =>
                      reportCompactNumber(Number(value))
                    }
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => (
                          <div className="flex min-w-44 items-center justify-between gap-4">
                            <span className="text-muted-foreground">
                              {String(name)}
                            </span>
                            <span className="font-mono font-medium tabular-nums">
                              {fullMoney(Number(value), currency)}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar
                    dataKey="planned"
                    fill="var(--color-planned)"
                    radius={3}
                  />
                  <Bar dataKey="actual" fill="var(--color-actual)" radius={3} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="overflow-hidden shadow-none">
            <CardHeader className="border-b">
              <CardTitle>월별 예상 거래손익</CardTitle>
              <CardDescription>
                매출측 − 매입측 − 부대비용 · 동일 통화 딜 기준 · {currency} —
                미기록 딜 1건 제외 (조회 기간 전체 기준)
              </CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-24 items-center text-sm text-muted-foreground">
              이 기간에 표시할 데이터가 없습니다.
            </CardContent>
          </Card>

          <Card className="overflow-hidden shadow-none">
            <CardHeader className="border-b">
              <CardTitle>기말 잔액 추세</CardTitle>
              <CardDescription>
                각 월 말일 기준 미수·미지급 잔액 · {currency}
              </CardDescription>
              <div className="mt-2 flex flex-wrap gap-4 text-xs">
                <span className="flex items-center gap-2">
                  <span className="h-0.5 w-3 bg-primary" /> 미수 (받을 돈)
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-0.5 w-3 bg-[#e07a45]" /> 미지급 (보낼 돈)
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <ChartContainer
                config={reportBalanceConfig}
                className="h-64 w-full"
              >
                <LineChart
                  data={reportBalanceData}
                  margin={{ left: 0, right: 12, top: 4 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="period" tickLine={false} axisLine={false} />
                  <YAxis
                    domain={[0, 200000]}
                    ticks={[0, 50000, 100000, 150000, 200000]}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    tickFormatter={(value) =>
                      reportCompactNumber(Number(value))
                    }
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => (
                          <div className="flex min-w-44 items-center justify-between gap-4">
                            <span className="text-muted-foreground">
                              {String(name)}
                            </span>
                            <span className="font-mono font-medium tabular-nums">
                              {fullMoney(Number(value), currency)}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="receivable"
                    stroke="var(--color-receivable)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="payable"
                    stroke="var(--color-payable)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="overflow-hidden shadow-none">
            <CardHeader className="border-b">
              <CardTitle>연체율</CardTitle>
              <CardDescription>
                기말 미수 잔액 중 만기 경과분의 비율
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ChartContainer
                config={reportOverdueConfig}
                className="h-56 w-full"
              >
                <LineChart
                  data={reportOverdueData}
                  margin={{ left: 0, right: 12, top: 4 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="period" tickLine={false} axisLine={false} />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 50, 100]}
                    tickLine={false}
                    axisLine={false}
                    width={42}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => (
                          <span className="font-mono font-medium tabular-nums">
                            {Number(value)}%
                          </span>
                        )}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="var(--color-rate)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <aside className="min-w-0 space-y-5">
          <Card className="overflow-hidden shadow-none">
            <CardHeader className="border-b">
              <CardTitle>고객사 Top 5</CardTitle>
              <CardDescription>
                최근 {rangeMonths}개월 수취 예정 · {currency}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">ACME GmbH</span>
                <span className="font-mono font-medium tabular-nums">
                  {currency === "USD" ? "139,420.00 USD" : "자료 없음"}
                </span>
              </div>
              <div className="mt-2 h-3 rounded-sm bg-muted">
                <div className="h-full w-full rounded-sm bg-primary" />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                예상 거래손익 산정 불가 (매입측 송장 미기록)
                <span className="ml-2 text-red-600">
                  연체 {currency === "USD" ? "139,420.00 USD" : "자료 없음"}
                </span>
              </div>
              <div className="mt-2 text-xs font-medium text-red-600">
                환산 상태: 환산 불가
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                0건 진행 중 · 선적 임박 0건 · 최근 문서 0건
              </div>
              <Button
                type="button"
                variant="link"
                className="mt-3 h-auto p-0 text-xs"
                onClick={() => onNavigate?.("settlement")}
              >
                정산에서 보기
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden shadow-none">
            <CardHeader className="border-b">
              <CardTitle>월마감</CardTitle>
              <CardDescription>
                마감된 달의 숫자는 동결되어 다시 계산되지 않습니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between gap-3 rounded-md border border-dashed px-3 py-3 text-sm">
                <span className="font-medium">2026-08</span>
                <span className="text-xs text-muted-foreground">
                  진행 중 — 9월 1일부터 마감 가능
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <div className="font-medium">{closedPeriod}</div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    qa-owner-20260703@ecoya.dev · 7월 6일 마감
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Status tone="blue">동결됨</Status>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setClosePanel(true)}
                  >
                    재개방
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
      <Sheet open={closePanel} onOpenChange={setClosePanel}>
        <SheetContent
          side="right"
          showCloseButton={false}
          overlayClassName="top-15"
          className="top-15! bottom-0! h-auto! w-full gap-0 p-0 sm:max-w-[540px]"
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b px-5">
            <div>
              <SheetTitle>{closePeriod} 월마감</SheetTitle>
              <SheetDescription>
                회계 보고용 숫자를 최종 확인합니다.
              </SheetDescription>
            </div>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" aria-label="닫기">
                <X />
              </Button>
            </SheetClose>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <Card>
              <CardHeader>
                <CardTitle>마감 준비 확인</CardTitle>
                <CardDescription>
                  확정하면 수치와 적용 환율이 스냅샷으로 동결됩니다.
                </CardDescription>
                <CardAction>
                  <Status tone={missingDocumentsResolved ? "green" : "amber"}>
                    {missingDocumentsResolved ? "준비 완료" : "확인 1건"}
                  </Status>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="divide-y">
                  {[
                    ["미확정 거래", "0건"],
                    ["미완료 정산", "0건"],
                    [
                      "누락 문서",
                      missingDocumentsResolved
                        ? "0건 · 확인 완료"
                        : "1건 · 처리 필요",
                    ],
                    ["동결 환율", "USD/KRW 1,382.40"],
                  ].map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between gap-4 py-3 text-sm"
                    >
                      <span className="text-muted-foreground">{key}</span>
                      <strong className="text-right font-medium">
                        {value}
                      </strong>
                    </div>
                  ))}
                </div>
                {!missingDocumentsResolved ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
                    <div className="font-medium text-amber-900">
                      누락 문서 1건이 마감을 차단합니다.
                    </div>
                    <p className="mt-1 text-xs leading-5 text-amber-800">
                      근거 문서를 확인하거나 예외 사유를 기록한 뒤 완료
                      처리하세요.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setMissingDocumentsResolved(true)}
                    >
                      <Check data-icon="inline-start" /> 누락 문서 확인 완료
                    </Button>
                  </div>
                ) : null}
                <label className="grid gap-1.5 text-sm">
                  <span>마감 메모</span>
                  <Textarea
                    value={closeNote}
                    onChange={(event) => setCloseNote(event.target.value)}
                    placeholder="회계 인계 시 함께 전달할 메모"
                  />
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <SheetClose asChild>
                    <Button variant="outline">취소</Button>
                  </SheetClose>
                  <Button
                    disabled={closeState === "pending" || closeBlocked}
                    onClick={async () => {
                      setCloseState("pending")
                      try {
                        await prototypeBackend.reports.closePeriod({
                          period: closePeriod,
                          currency,
                          note: closeNote,
                        })
                        setCloseState("idle")
                        setClosePanel(false)
                      } catch {
                        setCloseState("error")
                      }
                    }}
                  >
                    {closeState === "pending" ? (
                      <Loader2 className="animate-spin" />
                    ) : null}
                    {closeState === "pending"
                      ? "마감 중"
                      : `${closePeriod} 마감 확정`}
                  </Button>
                </div>
                {closeBlocked ? (
                  <p className="text-xs text-muted-foreground">
                    누락 문서를 처리하고 마감 메모를 입력하면 확정할 수
                    있습니다.
                  </p>
                ) : null}
                {closeState === "error" ? (
                  <p className="text-sm text-destructive">
                    월마감을 완료하지 못했습니다. 준비 상태를 다시 확인해주세요.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>
    </Page>
  )
}

const coreCustomers = [
  {
    name: "ACME GmbH",
    owner: "조민영",
    revenue: "420000",
    gp: "82000",
    outstanding: "42000",
    next: "오늘",
    shipment: "도착 D-2",
    docs: "B/L 누락",
    status: "확인 필요",
  },
  {
    name: "KATAMAN ASIA-PACIFIC",
    owner: "김민지",
    revenue: "360000",
    gp: "64000",
    outstanding: "0",
    next: "07.18",
    shipment: "운송 중",
    docs: "완료",
    status: "정상",
  },
  {
    name: "HMM Green",
    owner: "박서준",
    revenue: "190000",
    gp: "22000",
    outstanding: "8000",
    next: "07.20",
    shipment: "배선 대기",
    docs: "확인 1건",
    status: "정상",
  },
]

const memberSurnames = [
  "김",
  "이",
  "박",
  "최",
  "정",
  "강",
  "조",
  "윤",
  "장",
  "임",
]
const memberGivenNames = ["민영", "민지", "서준", "지우", "도윤"]

const performanceMembers = Array.from({ length: 50 }, (_, index) => {
  const generatedName = `${memberSurnames[index % memberSurnames.length]}${memberGivenNames[Math.floor(index / memberSurnames.length)]}`
  const name = ["조민영", "김민지", "박서준"][index] ?? generatedName
  const gp = Math.max(14, 82 - index)
  const target = 108 - (index % 27)
  const overdue = index % 7 === 0 ? String((12 + index) * 1000) : "없음"
  const stalled = index % 9 === 0 ? 1 + (index % 3) : 0

  return {
    name,
    gp,
    target,
    overdue,
    stalled,
    deals: 3 + (index % 12),
  }
})

const customerPrefixes = [
  "Nordic",
  "Pacific",
  "Global",
  "Hanbit",
  "Atlas",
  "Oriental",
  "Bluewave",
  "Summit",
  "Vertex",
  "Evergreen",
]
const customerSuffixes = [
  "Metals",
  "Trading",
  "Logistics",
  "Resources",
  "Marine",
  "Industries",
]

const customers = Array.from({ length: 60 }, (_, index) => {
  if (index < coreCustomers.length) return coreCustomers[index]
  const revenue = 185 + ((index * 37) % 410)
  const gp = 18 + ((index * 11) % 96)
  const outstanding = index % 4 === 0 ? 8 + (index % 35) : 0
  return {
    name: `${customerPrefixes[index % customerPrefixes.length]} ${customerSuffixes[Math.floor(index / customerPrefixes.length)]} ${String(index + 1).padStart(2, "0")}`,
    owner: performanceMembers[index % performanceMembers.length].name,
    revenue: String(revenue * 1000),
    gp: String(gp * 1000),
    outstanding: String(outstanding * 1000),
    next:
      index % 5 === 0
        ? "오늘"
        : `07.${String(16 + (index % 12)).padStart(2, "0")}`,
    shipment: ["도착 D-2", "운송 중", "배선 대기", "통관 중"][index % 4],
    docs: index % 6 === 0 ? "확인 1건" : "완료",
    status: index % 6 === 0 ? "확인 필요" : "정상",
  }
})

const salesGpData = [
  { month: "8월", gp: 38000 },
  { month: "9월", gp: 46000 },
  { month: "10월", gp: 42000 },
  { month: "11월", gp: 58000 },
  { month: "12월", gp: 66000 },
  { month: "1월", gp: 74000 },
  { month: "2월", gp: 82000 },
  { month: "3월", gp: 76000 },
  { month: "4월", gp: 91000 },
  { month: "5월", gp: 84000 },
  { month: "6월", gp: 96000 },
  { month: "7월", gp: 104000 },
]

const salesGpChartConfig = {
  gp: { label: "조정 GP", color: "var(--primary)" },
} satisfies ChartConfig

export function SalesPerformancePrototype({
  onNavigate,
}: {
  onNavigate: Navigate
}) {
  const [role, setRole] = useState("Admin")
  const [owner, setOwner] = useState("전체 담당자")
  const [period, setPeriod] = useState("최근 12개월")
  const [currency, setCurrency] = useState("USD")
  const [memberQuery, setMemberQuery] = useState("")
  const [memberPage, setMemberPage] = useState(1)
  const [customerQuery, setCustomerQuery] = useState("")
  const [customerPage, setCustomerPage] = useState(1)
  const memberPageSize = 5
  const customerPageSize = 8
  const filteredMembers = performanceMembers.filter((item) =>
    item.name.toLowerCase().includes(memberQuery.trim().toLowerCase())
  )
  const pagedMembers = filteredMembers.slice(
    (memberPage - 1) * memberPageSize,
    memberPage * memberPageSize
  )
  const ownerFilteredCustomers =
    owner === "전체 담당자"
      ? customers
      : customers.filter((item) => item.owner === owner)
  const filteredCustomers = ownerFilteredCustomers.filter((item) =>
    `${item.name} ${item.owner}`
      .toLowerCase()
      .includes(customerQuery.trim().toLowerCase())
  )
  const visible = filteredCustomers.slice(
    (customerPage - 1) * customerPageSize,
    customerPage * customerPageSize
  )
  return (
    <Page
      title={role === "Member" ? "내 성과" : "팀 성과"}
      description="사람과 거래처별 성과 변화의 이유를 확인하고 관련 업무로 이동합니다."
      action={
        <>
          <Status>Owner / Admin / Member</Status>
          <Status tone="blue">Pro</Status>
        </>
      }
    >
      <div className="flex flex-wrap items-end gap-3 py-2">
        <label className="grid gap-1 text-xs text-muted-foreground">
          <span>조회 기간</span>
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value ?? "최근 12개월")}
          >
            <SelectTrigger className="w-36 text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["이번 달", "최근 3개월", "최근 12개월"].map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">
          <span>통화</span>
          <Select
            value={currency}
            onValueChange={(value) => setCurrency(value ?? "USD")}
          >
            <SelectTrigger className="w-28 text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["USD", "KRW", "EUR"].map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">
          <span>권한 범위</span>
          <Select
            value={role}
            onValueChange={(value) => setRole(value ?? "Admin")}
          >
            <SelectTrigger className="w-32 text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Admin">Admin · 팀 성과</SelectItem>
              <SelectItem value="Owner">Owner · 조직 성과</SelectItem>
              <SelectItem value="Member">내 성과</SelectItem>
            </SelectContent>
          </Select>
        </label>
        {role !== "Member" ? (
          <label className="grid gap-1 text-xs text-muted-foreground">
            <span>담당자</span>
            <Select
              value={owner}
              onValueChange={(value) => setOwner(value ?? "전체 담당자")}
            >
              <SelectTrigger className="w-40 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="전체 담당자">전체 담당자</SelectItem>
                {[...new Set(customers.map((item) => item.owner))].map(
                  (item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </label>
        ) : null}
      </div>
      <div className="mt-6">
        <SummaryMetricStrip
          items={
            role === "Member"
              ? [
                  {
                    label: "진행 거래",
                    value: "3건",
                    note: "내 담당",
                  },
                  {
                    label: "예정 수취",
                    value: fullMoney(42000, currency),
                    note: "7일 이내",
                  },
                  {
                    label: "예정 지급",
                    value: fullMoney(28000, currency),
                    note: "7일 이내",
                  },
                  {
                    label: "기한 초과",
                    value: "1건",
                    note: "조치 필요",
                    tone: "red",
                  },
                ]
              : [
                  {
                    label: "거래액",
                    value: fullMoney(970000, currency),
                    note: "+12%",
                    tone: "green",
                  },
                  {
                    label: "조정 GP",
                    value: fullMoney(168000, currency),
                    note: "17.3%",
                  },
                  {
                    label: "미수·연체",
                    value: fullMoney(50000, currency),
                    note: "1건 연체",
                    tone: "red",
                  },
                  {
                    label: "진행 거래",
                    value: "12건",
                    note: "3건 정체",
                    tone: "amber",
                  },
                ]
          }
        />
        {role === "Member" ? (
          <p className="mt-2 text-xs text-muted-foreground">
            내 업무 범위의 직접 집계만 표시합니다. 거래처명, 마진, 담당자별 원천
            행은 Owner와 Admin에게만 제공됩니다.
          </p>
        ) : null}
      </div>
      {role !== "Member" ? (
        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,.5fr)]">
          <section>
            <SectionHeader
              title="GP 추이"
              description={`${period} · 목표와 전기 대비`}
            />
            <div className="py-4">
              <ChartContainer
                config={salesGpChartConfig}
                className="aspect-auto h-64 w-full"
              >
                <LineChart data={salesGpData} margin={{ left: 0, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={92}
                    tickFormatter={(value) => fullNumber(Number(value))}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => (
                          <div className="flex min-w-44 items-center justify-between gap-4">
                            <span className="text-muted-foreground">
                              {String(name)}
                            </span>
                            <span className="font-mono font-medium tabular-nums">
                              {fullMoney(Number(value), currency)}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="gp"
                    stroke="var(--color-gp)"
                    strokeWidth={2.5}
                    dot={{ fill: "var(--color-gp)", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </section>
          <section>
            <SectionHeader
              title="변화 이유"
              description="후속 조치가 필요한 변화만 표시합니다."
            />
            <div className="divide-y">
              {[
                [
                  "연체 증가",
                  `ACME GmbH · ${fullMoney(42000, currency)}`,
                  "red",
                ],
                ["GP 하락", "HMM Green · -2.1%p", "amber"],
                ["거래 정체", "3건 · 14일 이상", "amber"],
                ["문서 지연", "B/L 1건 누락", "neutral"],
              ].map(([title, meta, tone]) => (
                <Button
                  variant="ghost"
                  key={title}
                  onClick={() =>
                    onNavigate(tone === "red" ? "settlement" : "deals")
                  }
                  className="h-auto w-full justify-between rounded-none py-3 text-left font-normal"
                >
                  <div>
                    <div className="text-sm font-medium">{title}</div>
                    <div className="text-xs text-muted-foreground">{meta}</div>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Button>
              ))}
            </div>
          </section>
        </div>
      ) : null}
      {role !== "Member" ? (
        <ContentPanel className="mt-8">
          <SectionHeader
            title="담당자별 GP"
            description="순위보다 목표 대비와 미수 영향을 함께 봅니다."
          />
          <div className="flex flex-wrap items-center justify-between gap-3 py-2">
            <SubmittedSearchInput
              className="w-full max-w-xs"
              value={memberQuery}
              onSearch={(value) => {
                setMemberQuery(value)
                setMemberPage(1)
              }}
              placeholder="담당자 검색"
            />
            <span className="text-xs text-muted-foreground">
              전체 {filteredMembers.length}명
            </span>
          </div>
          <PanelTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">순위</TableHead>
                  <TableHead>담당자</TableHead>
                  <TableHead className="text-right">조정 GP</TableHead>
                  <TableHead className="text-right">목표 달성</TableHead>
                  <TableHead>미수·정체</TableHead>
                  <TableHead className="text-right">진행 거래</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedMembers.map((item, index) => (
                  <TableRow key={item.name}>
                    <TableCell className="text-muted-foreground">
                      {(memberPage - 1) * memberPageSize + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {fullMoney(item.gp * 1000, currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.target}%
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          item.overdue === "없음"
                            ? "text-muted-foreground"
                            : "text-destructive"
                        }
                      >
                        {item.overdue === "없음"
                          ? "연체 없음"
                          : `연체 ${expandCompactAmount(item.overdue, currency)}`}
                      </span>
                      {item.stalled ? (
                        <span className="ml-2 text-warning-foreground">
                          정체 {item.stalled}건
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.deals}건
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </PanelTable>
          <TablePagination
            page={memberPage}
            pageSize={memberPageSize}
            total={filteredMembers.length}
            showPageSizeSelect={false}
            totalLabel={(total) => `전체 ${total}명`}
            aria-label="담당자별 GP 페이지 이동"
            onPageChange={setMemberPage}
          />
        </ContentPanel>
      ) : null}
      {role !== "Member" ? (
        <ContentPanel className="mt-8">
          <SectionHeader
            title="거래처 성과"
            description="매출·미수뿐 아니라 다음 결제, 선적과 문서 상태까지 함께 확인합니다."
          />
          <div className="flex flex-wrap items-center justify-between gap-3 py-2">
            <SubmittedSearchInput
              className="w-full max-w-sm"
              value={customerQuery}
              onSearch={(value) => {
                setCustomerQuery(value)
                setCustomerPage(1)
              }}
              placeholder="거래처 또는 담당자 검색"
            />
            <span className="text-xs text-muted-foreground">
              전체 {filteredCustomers.length}개 거래처
            </span>
          </div>
          <PanelTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>거래처</TableHead>
                  <TableHead className="text-right">거래액</TableHead>
                  <TableHead className="text-right">GP</TableHead>
                  <TableHead className="text-right">미수</TableHead>
                  <TableHead>다음 결제</TableHead>
                  <TableHead>선적</TableHead>
                  <TableHead>서류</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((item) => (
                  <TableRow
                    key={item.name}
                    className="cursor-pointer"
                    onClick={() => onNavigate("counterparty")}
                  >
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.owner}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {expandCompactAmount(item.revenue, currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {expandCompactAmount(item.gp, currency)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {expandCompactAmount(item.outstanding, currency)}
                    </TableCell>
                    <TableCell>{item.next}</TableCell>
                    <TableCell>{item.shipment}</TableCell>
                    <TableCell>{item.docs}</TableCell>
                    <TableCell>
                      <Status tone={item.status === "정상" ? "green" : "amber"}>
                        {item.status}
                      </Status>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </PanelTable>
          <TablePagination
            page={customerPage}
            pageSize={customerPageSize}
            total={filteredCustomers.length}
            showPageSizeSelect={false}
            totalLabel={(total) => `전체 ${total}개 거래처`}
            aria-label="거래처 성과 페이지 이동"
            onPageChange={setCustomerPage}
          />
        </ContentPanel>
      ) : null}
    </Page>
  )
}

const salesPerformanceGpConfig = {
  gp: { label: "매출총이익", color: "var(--primary)" },
} satisfies ChartConfig
const salesPerformanceCustomers = salesCustomerSamples

export function SalesPerformanceLivePrototype({
  onNavigate,
}: {
  onNavigate: Navigate
}) {
  const [period, setPeriod] = useState<"3개월" | "6개월" | "12개월">("12개월")
  const [currency, setCurrency] = useState<"USD" | "SGD">("USD")
  const [owner, setOwner] = useState("all")
  const visibleCustomers = salesPerformanceCustomers.filter(
    (item) =>
      item.currency === currency && (owner === "all" || item.owner === owner)
  )
  // Local report fixture is as of August 2026; apply the selected month window.
  const firstMonth = 2026 * 12 + 7 - parseInt(period) + 1
  const monthlyRows = salesMonthlySamples.filter((item) => {
    const [year, month] = item.period.split(".").map(Number)
    return (
      (2000 + year) * 12 + month - 1 >= firstMonth &&
      item.currency === currency &&
      (owner === "all" || item.owner === owner)
    )
  })
  const gpByMonth = new Map<string, number>()
  monthlyRows.forEach((item) =>
    gpByMonth.set(item.period, (gpByMonth.get(item.period) ?? 0) + item.gp)
  )
  const visibleGpData = [...gpByMonth].map(([period, gp]) => ({ period, gp }))
  const byAssignee = ["조민영", "김민지"]
    .filter((name) => owner === "all" || owner === name)
    .map((name) => {
      const customers = visibleCustomers.filter((item) => item.owner === name)
      return {
        name,
        gp: monthlyRows
          .filter((item) => item.owner === name)
          .reduce((sum, item) => sum + item.gp, 0),
        count: customers.reduce((sum, item) => sum + item.deals, 0),
        revenue: customers.reduce((sum, item) => sum + item.revenue, 0),
      }
    })
    .filter((item) => item.count || item.revenue)
    .sort((a, b) => b.gp - a.gp)
  const receivable = visibleCustomers.reduce(
    (total, item) => total + item.receivable,
    0
  )
  const overdue = visibleCustomers.reduce(
    (total, item) => total + item.overdue,
    0
  )

  return (
    <Page
      title="영업 성과"
      description="조직 전체의 매출·손익·미수·진행 딜을 보고, 담당자별로 좁혀 봅니다."
      analyticsLayout
      heroControls={
        <AnalyticsFilterBar>
          <div
            className="inline-flex rounded-md bg-muted p-1"
            role="group"
            aria-label="기간"
          >
            {(["3개월", "6개월", "12개월"] as const).map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant="ghost"
                aria-pressed={period === value}
                className={cn(
                  "h-7 min-w-16 px-3",
                  period === value && "bg-background text-foreground shadow-sm"
                )}
                onClick={() => setPeriod(value)}
              >
                {value}
              </Button>
            ))}
          </div>
          <div
            className="inline-flex rounded-md bg-muted p-1"
            role="group"
            aria-label="통화"
          >
            {(["USD", "SGD"] as const).map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant="ghost"
                aria-pressed={currency === value}
                className={cn(
                  "h-7 min-w-14 px-3",
                  currency === value &&
                    "bg-background text-foreground shadow-sm"
                )}
                onClick={() => setCurrency(value)}
              >
                {value}
              </Button>
            ))}
          </div>
          <Select
            value={owner}
            onValueChange={(value) => setOwner(value ?? "all")}
          >
            <SelectTrigger
              className="w-44 shadow-none backdrop-blur-sm hover:shadow-none"
              aria-label="담당자 필터"
            >
              <SelectValue>
                {owner === "all" ? "전체 담당자" : owner}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 담당자</SelectItem>
              <SelectItem value="조민영">조민영</SelectItem>
              <SelectItem value="김민지">김민지</SelectItem>
            </SelectContent>
          </Select>
          <span className="ml-auto pb-2 text-xs text-[var(--surface-muted-foreground)]">
            {owner === "all" ? "전체 담당자" : owner} · {currency} · 로컬 예시
          </span>
        </AnalyticsFilterBar>
      }
      heroSummary={
        <SummaryMetricStrip
          className="xl:grid-cols-4"
          items={[
            {
              label: `8월 매출 · 수취 예정 (${currency})`,
              value: fullMoney(
                visibleCustomers.reduce((sum, item) => sum + item.revenue, 0),
                currency
              ),
              detail: `실수금 ${fullMoney(
                visibleCustomers.reduce(
                  (sum, item) => sum + item.revenue - item.receivable,
                  0
                ),
                currency
              )}`,
              tone: "blue",
            },
            {
              label: `예상 거래손익 (${currency})`,
              value: fullMoney(
                visibleGpData.reduce((sum, item) => sum + item.gp, 0),
                currency
              ),
              detail: `최근 ${period} · 선택 담당자 기준`,
            },
            {
              label: `미수 잔액 (${currency})`,
              value: fullMoney(receivable, currency),
              detail: `연체 ${fullMoney(overdue, currency)}`,
              detailClassName: "text-red-600",
              tone: "red",
            },
            {
              label: "진행 딜",
              value: String(
                visibleCustomers.reduce((total, item) => total + item.deals, 0)
              ),
              detail: `거래처 ${visibleCustomers.length}곳 · 선택 통화·담당자 기준`,
              tone: "blue",
            },
          ]}
        />
      }
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,.85fr)]">
        <Card className="overflow-hidden shadow-none">
          <CardHeader className="border-b">
            <CardTitle>월별 예상 거래손익 추세</CardTitle>
            <CardDescription>
              최근 {period} · {currency} · 매출 − 매입 − 부대비용 · 동일 통화 딜
              기준
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer
              config={salesPerformanceGpConfig}
              className="h-64 w-full"
            >
              <BarChart
                data={visibleGpData}
                margin={{ left: 0, right: 8, top: 4 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis dataKey="period" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  tickFormatter={(value) => reportCompactNumber(Number(value))}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <div className="flex min-w-44 items-center justify-between gap-4">
                          <span className="text-muted-foreground">
                            {String(name)}
                          </span>
                          <span className="font-mono font-medium tabular-nums">
                            {fullMoney(Number(value), currency)}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Bar dataKey="gp" fill="var(--color-gp)" radius={3}>
                  {visibleGpData.map((row) => (
                    <Cell
                      key={row.period}
                      fill={
                        row.gp < 0 ? "var(--destructive)" : "var(--color-gp)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="overflow-hidden shadow-none">
          <CardHeader className="border-b">
            <CardTitle>담당자별 예상 거래손익 · Top 50</CardTitle>
            <CardDescription>
              최근 {period} · {currency} — 딜 담당자 기준
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-64 space-y-5 pt-5">
            {byAssignee.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{item.name}</span>
                  <span className="font-mono text-sm">
                    {fullMoney(item.gp, currency)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{
                      width: `${Math.max(2, (Math.abs(item.gp) / Math.max(...byAssignee.map((row) => Math.abs(row.gp)), 1)) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  진행 딜 {item.count}건 · 최근 {period}
                </p>
              </div>
            ))}
            {!byAssignee.length && (
              <p className="text-sm text-muted-foreground">
                선택 조건에 해당하는 담당자가 없습니다.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card
        className="mt-5 w-full min-w-0 overflow-hidden shadow-none"
        aria-label="거래처 상태"
      >
        <CardHeader className="border-b">
          <CardTitle>거래처 상태</CardTitle>
          <CardDescription>주의가 필요한 순서 · 8월 10일 기준</CardDescription>
        </CardHeader>
        <CardContent className="min-w-0 p-2.5">
          <Table className="min-w-[1080px]">
            <TableHeader>
              <TableRow>
                <TableHead>거래처</TableHead>
                <TableHead>통화</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">GP</TableHead>
                <TableHead className="text-right">거래액</TableHead>
                <TableHead className="text-right">미수</TableHead>
                <TableHead className="text-right">연체</TableHead>
                <TableHead>다음 결제</TableHead>
                <TableHead className="text-right">선적 임박</TableHead>
                <TableHead className="text-right">서류 30일</TableHead>
                <TableHead>마지막 활동</TableHead>
                <TableHead className="text-right">진행 딜</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!visibleCustomers.length && (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className="py-8 text-center text-muted-foreground"
                  >
                    선택한 통화·담당자에 해당하는 거래처가 없습니다.
                  </TableCell>
                </TableRow>
              )}
              {visibleCustomers.map((item) => (
                <TableRow
                  key={`${item.name}-${item.currency}`}
                  className="cursor-pointer"
                  onClick={() => onNavigate("counterparty")}
                >
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.currency}</TableCell>
                  <TableCell>
                    <Status
                      tone={
                        item.gp !== null && item.gp < 0
                          ? "red"
                          : item.overdue > 0
                            ? "amber"
                            : item.gp === null
                              ? "neutral"
                              : "green"
                      }
                    >
                      {item.status}
                    </Status>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums",
                      item.gp !== null && item.gp < 0 && "text-red-600"
                    )}
                  >
                    {item.gp === null ? "미확인" : fullMoney(item.gp, currency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fullMoney(item.revenue, item.currency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fullMoney(item.receivable, item.currency)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums",
                      item.overdue > 0 && "text-red-600"
                    )}
                  >
                    {fullMoney(item.overdue, item.currency)}
                  </TableCell>
                  <TableCell>{item.nextPayment}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.shipment}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.documents}
                  </TableCell>
                  <TableCell>{item.activity}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.deals}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Page>
  )
}

export function SettingsPrototype({
  onNavigate,
  onLogout,
  workspaceId,
  onWorkspaceChange,
  availableProducts,
  role,
}: {
  onNavigate: Navigate
  onLogout: () => void
  workspaceId: WorkspaceKey
  onWorkspaceChange: (workspaceId: WorkspaceKey) => void
  availableProducts?: readonly ProductEntitlement[]
  role?: SettingsRole
}) {
  return (
    <SettingsHubV2
      onNavigate={onNavigate}
      onLogout={onLogout}
      workspaceId={workspaceId}
      onWorkspaceChange={onWorkspaceChange}
      availableProducts={availableProducts}
      role={role}
    />
  )
}

export function CounterpartyPrototype({
  onNavigate,
}: {
  onNavigate: Navigate
}) {
  return (
    <Page
      title="ACME GmbH"
      description="거래처별 거래, AR/AP, 결제 신뢰와 최근 활동을 확인합니다."
      action={
        <Button onClick={() => onNavigate("deals")}>관련 거래 보기</Button>
      }
    >
      <SummaryMetricStrip
        items={[
          { label: "거래액", value: "420,000.00 USD" },
          { label: "조정 GP", value: "82,000.00 USD" },
          {
            label: "미수",
            value: "42,000.00 USD",
            note: "오늘 만기",
            tone: "red",
          },
          { label: "결제 신뢰", value: "B+", note: "평균 +3일", tone: "amber" },
        ]}
      />
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <ContentPanel>
          <SectionHeader title="관련 거래" />
          <div className="divide-y">
            {[
              ["DL-260708-01", "7월 알루미늄 스크랩 수입", "서류 검증"],
              ["DL-260625-03", "6월 해상운송 계약", "정산"],
              ["DL-260512-08", "5월 원자재 수입", "완료"],
            ].map(([id, title, status]) => (
              <Button
                variant="ghost"
                key={id}
                onClick={() => onNavigate("deal", { dealId: id })}
                className="h-auto w-full justify-between rounded-none py-4 text-left font-normal"
              >
                <span>
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="text-xs text-muted-foreground">{id}</span>
                </span>
                <Status tone={status === "완료" ? "green" : "blue"}>
                  {status}
                </Status>
              </Button>
            ))}
          </div>
        </ContentPanel>
        <ContentPanel>
          <SectionHeader title="최근 활동" />
          <div className="divide-y text-sm">
            {[
              ["오늘 09:24", "인보이스 금액 필드 확인"],
              ["어제 16:10", "42,000.00 USD 입금 예정 등록"],
              ["07.10 11:40", "B/L 문서 연결"],
            ].map(([time, event]) => (
              <div key={time} className="flex gap-5 py-4">
                <span className="w-24 text-muted-foreground">{time}</span>
                <span>{event}</span>
              </div>
            ))}
          </div>
        </ContentPanel>
      </div>
    </Page>
  )
}

export function SnapEvidencePrototype({
  onNavigate,
}: {
  onNavigate: Navigate
}) {
  return (
    <Page
      title="SNAP 증거함"
      description="컨테이너 현장 증거와 배정 대상을 독립적으로 확인합니다."
      action={
        <Button variant="outline" onClick={() => onNavigate("shipments")}>
          선적으로 돌아가기
        </Button>
      }
    >
      <ContentPanel>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["HMMU 7820194", "8장", "DL-260708-01"],
            ["ONEU 1083275", "3장", "미배정"],
            ["COSU 2214870", "5장", "DL-260701-04"],
            ["MSCU 8425510", "0장", "근거 조회 실패"],
          ].map(([container, count, target]) => (
            <Button
              variant="ghost"
              key={container}
              onClick={() => target.startsWith("DL") && onNavigate("deal", { dealId: target })}
              className="h-auto justify-start rounded-none border p-4 text-left font-normal hover:border-primary hover:bg-primary/5"
            >
              <FileCheck2 className="size-5 text-primary" />
              <div className="mt-4 font-medium">{container}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                현장 사진 {count} · {target}
              </div>
            </Button>
          ))}
        </div>
      </ContentPanel>
    </Page>
  )
}

export function BillingPrototype({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <Page
      title="결제·구독"
      description="현재 구독과 기능 entitlement를 확인합니다."
      action={
        <Button variant="outline" onClick={() => onNavigate("settings")}>
          설정으로 돌아가기
        </Button>
      }
    >
      <ContentPanel className="max-w-4xl">
        <div className="flex items-start justify-between">
          <div>
            <Status tone="blue">Pro</Status>
            <h2 className="mt-3 text-xl font-semibold">ECOYA Trade OS Pro</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              결산 리포트, 영업 성과, 고급 AI 기능을 사용 중입니다.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold">₩129,000</div>
            <div className="text-xs text-muted-foreground">월 / 조직</div>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {["결산 리포트", "영업 성과", "고급 토큰 한도"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 text-emerald-600" />
              {item}
            </div>
          ))}
        </div>
        <Button className="mt-6">구독 관리</Button>
      </ContentPanel>
    </Page>
  )
}

export function TokenUsagePrototype({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <Page
      title="토큰 사용량"
      description="제품별 AI 호출과 월 한도를 확인합니다."
      action={
        <Button variant="outline" onClick={() => onNavigate("settings")}>
          설정으로 돌아가기
        </Button>
      }
    >
      <SummaryMetricStrip
        items={[
          { label: "이번 달 사용", value: "684K" },
          { label: "월 한도", value: "1.2M" },
          { label: "남은 토큰", value: "516K", note: "43%", tone: "green" },
          { label: "예상 소진", value: "07.29", note: "정상", tone: "green" },
        ]}
      />
      <div className="mt-8 max-w-4xl">
        <SectionHeader title="제품별 사용량" />
        <div className="space-y-5 py-5">
          {[
            ["문서 OCR", 72, "492K"],
            ["AI 문서 만들기", 18, "124K"],
            ["AI에게 묻기", 9, "61K"],
            ["거래 검증", 3, "7K"],
          ].map(([label, width, value]) => (
            <div key={label as string}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{label as string}</span>
                <strong>{value as string}</strong>
              </div>
              <div className="h-2 bg-muted">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Page>
  )
}

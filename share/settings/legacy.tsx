import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react"
import {
  Archive,
  ArrowLeft,
  Bell,
  Building2,
  Check,
  ChevronRight,
  CircleUserRound,
  Copy,
  CreditCard,
  Database,
  Download,
  FileSpreadsheet,
  Globe2,
  ListChecks,
  Loader2,
  Mail,
  MoreVertical,
  Palette,
  PanelsTopLeft,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/components/ui/alert-dialog"
import { Badge } from "@shared/components/ui/badge"
import { Button } from "@shared/components/ui/button"
import { Checkbox } from "@shared/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog"
import { Input } from "@shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select"
import { Textarea } from "@shared/components/ui/textarea"
import { prototypeBackend } from "@trade-os/lib/prototype-backend"
import { cn } from "@shared/lib/utils"
import { SidebarProfileMenu } from "@shared/components/sidebar-profile-menu"
import {
  WorkspaceSwitcher,
} from "@shared/components/workspace-switcher"
import type { WorkspaceKey } from "@shared/lib/workspaces"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@shared/components/ui/sidebar"

type SettingsTarget = "home" | "tokens" | "billing"
export type ProductEntitlement = "erp" | "snap"

type SectionId =
  | "profile"
  | "organizations"
  | "company"
  | "approvals"
  | "retention"
  | "aliases"
  | "email"
  | "contacts"
  | "deals"
  | "alerts"
  | "members"
  | "snap-branding"
  | "snap-localization"
  | "snap-operations"
  | "snap-data"
  | "snap-billing"
  | "tokens"
  | "billing"

const sectionGroups: Array<{
  label: string
  items: Array<{
    id: SectionId
    label: string
    icon: typeof Building2
    external?: boolean
    product?: ProductEntitlement
    keywords?: readonly string[]
  }>
}> = [
  {
    label: "계정·프로필",
    items: [
      {
        id: "profile",
        label: "일반",
        icon: CircleUserRound,
        keywords: ["계정", "프로필", "이름", "로그인 이메일", "언어", "시간대"],
      },
    ],
  },
  {
    label: "조직",
    items: [
      {
        id: "organizations",
        label: "조직 전환",
        icon: PanelsTopLeft,
        keywords: ["현재 조직", "제품 권한", "워크스페이스"],
      },
      {
        id: "company",
        label: "조직 관리",
        icon: Building2,
        keywords: [
          "회사 정보",
          "법인명",
          "표시명",
          "기본 통화",
          "주소",
          "사업자번호",
          "은행",
          "계좌",
          "SWIFT",
          "서명",
          "회사 로고",
        ],
      },
      {
        id: "members",
        label: "멤버·초대",
        icon: Users,
        keywords: ["팀원", "역할", "관리자", "퇴출", "개인정보"],
      },
      {
        id: "snap-data",
        label: "데이터 관리",
        icon: Database,
        product: "snap",
        keywords: ["데이터 거주", "저장 공간", "보존", "파기", "내보내기", "감사 로그"],
      },
    ],
  },
  {
    label: "Trade OS",
    items: [
      {
        id: "approvals",
        label: "결재 정책",
        icon: ListChecks,
        product: "erp",
        keywords: ["승인", "결재", "금액", "거래처 위험", "불일치", "초안 영향"],
      },
      {
        id: "retention",
        label: "문서 보관 정책",
        icon: Archive,
        product: "erp",
        keywords: ["보존기간", "보관기간", "폐기", "법적 보존", "legal hold"],
      },
      {
        id: "email",
        label: "이메일로 문서 받기",
        icon: Mail,
        product: "erp",
        keywords: ["전용 주소", "메일 전달", "첨부 PDF", "파일 올리기"],
      },
      {
        id: "aliases",
        label: "거래처 별칭 학습",
        icon: ShieldCheck,
        product: "erp",
        keywords: ["표준 거래처", "문서 표기", "후보", "병합"],
      },
      {
        id: "contacts",
        label: "거래처 일괄 등록",
        icon: FileSpreadsheet,
        product: "erp",
        keywords: ["CSV", "거래처 가져오기"],
      },
      {
        id: "deals",
        label: "거래 일괄 등록",
        icon: FileSpreadsheet,
        product: "erp",
        keywords: ["CSV", "거래 가져오기"],
      },
      {
        id: "alerts",
        label: "알림 설정",
        icon: Bell,
        product: "erp",
        keywords: [
          "알림 종류",
          "알림 채널",
          "앱 내",
          "이메일",
          "Slack",
          "결제 연체",
          "필수 서류 누락",
          "선적 일정 지연",
        ],
      },
    ],
  },
  {
    label: "SNAP",
    items: [
      {
        id: "snap-branding",
        label: "브랜딩",
        icon: Palette,
        product: "snap",
        keywords: ["조직 이름", "로고", "강조색", "푸터", "리포트"],
      },
      {
        id: "snap-localization",
        label: "지역화",
        icon: Globe2,
        product: "snap",
        keywords: ["기본 언어", "업무 시간대", "작업 지시"],
      },
      {
        id: "snap-operations",
        label: "현장 운영",
        icon: SlidersHorizontal,
        product: "snap",
        keywords: ["현장 작업", "작업 배정", "결과 전달", "AI 운영", "워크플로우"],
      },
    ],
  },
  {
    label: "사용량 및 청구",
    items: [
      {
        id: "tokens",
        label: "ERP AI 사용량",
        icon: RefreshCw,
        external: true,
        product: "erp",
        keywords: ["토큰", "OCR", "AI 문서", "사용량"],
      },
      {
        id: "billing",
        label: "ERP 결제·구독",
        icon: MoreVertical,
        external: true,
        product: "erp",
        keywords: ["플랜", "구독", "결제수단", "청구"],
      },
      {
        id: "snap-billing",
        label: "SNAP 플랜·청구",
        icon: CreditCard,
        product: "snap",
        keywords: ["플랜", "크레딧", "청구", "결제", "사용량"],
      },
    ],
  },
]

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn("grid gap-1.5 text-sm", className)}>
      <span className="font-medium">{label}</span>
      {children}
    </label>
  )
}

function SettingsHeading({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 pb-2">
      <div>
        <h2
          tabIndex={-1}
          className="scroll-mt-6 text-lg font-semibold outline-none"
        >
          {title}
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  )
}

function ProfileSettings() {
  const [language, setLanguage] = useState("ko")
  const [timezone, setTimezone] = useState("Asia/Seoul")
  const [saved, setSaved] = useState(false)

  return (
    <div>
      <SettingsHeading
        title="계정·프로필"
        description="ERP와 SNAP에서 공통으로 사용하는 내 계정과 표시 환경을 관리합니다."
      />
      <form
        className="max-w-3xl py-5"
        onSubmit={(event) => {
          event.preventDefault()
          setSaved(true)
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="이름">
            <Input defaultValue="조민영" />
          </Field>
          <Field label="로그인 이메일">
            <Input type="email" defaultValue="minyoung@ecoya.app" />
          </Field>
          <Field label="언어">
            <Select
              value={language}
              onValueChange={(value) => value && setLanguage(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ko">한국어</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="시간대">
            <Select
              value={timezone}
              onValueChange={(value) => value && setTimezone(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Seoul">서울 (UTC+9)</SelectItem>
                <SelectItem value="Asia/Shanghai">상하이 (UTC+8)</SelectItem>
                <SelectItem value="Europe/London">런던</SelectItem>
                <SelectItem value="America/New_York">뉴욕</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="mt-6 flex items-center gap-3 border-t pt-5">
          <Button type="submit">
            <Check /> 변경사항 저장
          </Button>
          {saved ? (
            <span className="text-sm text-emerald-700">저장했습니다.</span>
          ) : null}
        </div>
      </form>
    </div>
  )
}

function OrganizationSettings() {
  const [currentOrganization, setCurrentOrganization] = useState("ecoya-demo")
  const organizations = [
    {
      id: "hanbit",
      name: "한빛무역",
      meta: "ERP Owner · SNAP Manager",
      products: "ERP · SNAP",
    },
    {
      id: "ecoya-demo",
      name: "ECOYA Demo Co.",
      meta: "ERP Operator",
      products: "ERP",
    },
  ]

  return (
    <div>
      <SettingsHeading
        title="조직 전환"
        description="계정에 연결된 조직과 제품 권한을 확인하고 현재 작업 조직을 변경합니다."
      />
      <div className="max-w-4xl divide-y py-5">
        {organizations.map((organization) => {
          const current = currentOrganization === organization.id
          return (
            <div
              key={organization.id}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{organization.name}</span>
                  {current ? (
                    <Badge variant="secondary">현재 조직</Badge>
                  ) : null}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {organization.meta} · 사용 제품 {organization.products}
                </div>
              </div>
              <Button
                type="button"
                variant={current ? "outline" : "default"}
                disabled={current}
                onClick={() => setCurrentOrganization(organization.id)}
              >
                {current ? "사용 중" : "이 조직으로 전환"}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FileField({
  label,
  help,
  accept,
  maxBytes,
  onFile,
}: {
  label: string
  help: string
  accept: string
  maxBytes: number
  onFile: (dataUri: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState("")
  const [error, setError] = useState("")
  return (
    <div className="grid gap-2 py-4 sm:grid-cols-[180px_minmax(0,1fr)]">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="mt-1 text-xs leading-5 text-muted-foreground">
          {help}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          className="hidden"
          type="file"
          accept={accept}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
            if (file.size > maxBytes) {
              setError(
                `파일 크기는 ${(maxBytes / 1024).toLocaleString()}KB 이하여야 합니다.`
              )
              event.target.value = ""
              return
            }
            setError("")
            setFileName(file.name)
            const reader = new FileReader()
            reader.onload = () => onFile(String(reader.result))
            reader.onerror = () =>
              setError("파일을 읽지 못했습니다. 다시 선택해주세요.")
            reader.readAsDataURL(file)
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
        >
          <Upload /> 파일 선택
        </Button>
        {fileName ? (
          <>
            <span className="min-w-0 truncate text-sm">{fileName}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setFileName("")
                setError("")
                onFile(null)
                if (inputRef.current) inputRef.current.value = ""
              }}
            >
              제거
            </Button>
          </>
        ) : null}
        {error ? (
          <span className="basis-full text-xs text-red-600" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function CompanySettings() {
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  )
  const [error, setError] = useState("")
  const [accent, setAccent] = useState("#397cc9")
  const [currency, setCurrency] = useState("USD")
  const [font, setFont] = useState("sans")
  const [timezone, setTimezone] = useState("Asia/Seoul")
  const [aiLanguage, setAiLanguage] = useState("ko")
  const [registrationCertificateUri, setRegistrationCertificateUri] = useState<
    string | null
  >(null)
  const [signatureUri, setSignatureUri] = useState<string | null>(null)
  const [logoUri, setLogoUri] = useState<string | null>(null)
  return (
    <div>
      <SettingsHeading
        title="회사 정보"
        description="여기에 입력한 자사 정보·은행·서명·브랜드가 생성하는 모든 문서에 적용됩니다."
      />
      <form
        className="max-w-5xl py-5"
        onSubmit={async (event) => {
          event.preventDefault()
          setSaveState("saving")
          setError("")
          const data = new FormData(event.currentTarget)
          const result = await prototypeBackend.settings.saveProfile({
            legalName: String(data.get("legalName") ?? ""),
            displayName: String(data.get("displayName") ?? ""),
            currency,
            address: String(data.get("address") ?? ""),
            city: String(data.get("city") ?? ""),
            countryCode: String(data.get("countryCode") ?? ""),
            phone: String(data.get("phone") ?? ""),
            email: String(data.get("email") ?? ""),
            businessNumber: String(data.get("businessNumber") ?? ""),
            registrationNumber: String(data.get("registrationNumber") ?? ""),
            registrationCertificateUri,
            bankName: String(data.get("bankName") ?? ""),
            accountNumber: String(data.get("accountNumber") ?? ""),
            swift: String(data.get("swift") ?? ""),
            signatory: String(data.get("signatory") ?? ""),
            signatureUri,
            logoUri,
            accent,
            font,
            timezone,
            aiLanguage,
          })
          if (!result.ok) {
            setSaveState("idle")
            setError(result.error)
            return
          }
          setSaveState("saved")
        }}
      >
        <h3 className="mb-4 text-sm font-semibold">회사</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="법인명">
            <Input name="legalName" defaultValue="ECOYA Demo Company Ltd." />
          </Field>
          <Field label="표시명">
            <Input name="displayName" defaultValue="ECOYA Demo Co." />
          </Field>
          <Field label="기본 통화">
            <Select
              value={currency}
              onValueChange={(value) => value && setCurrency(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["USD", "KRW", "EUR", "JPY"].map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="주소" className="lg:col-span-2">
            <Input
              name="address"
              defaultValue="서울특별시 강남구 테헤란로 123"
            />
          </Field>
          <Field label="도시">
            <Input name="city" defaultValue="Seoul" />
          </Field>
          <Field label="국가코드">
            <Input name="countryCode" defaultValue="KR" />
          </Field>
          <Field label="전화">
            <Input name="phone" defaultValue="+82 2-1234-5678" />
          </Field>
          <Field label="이메일">
            <Input name="email" type="email" defaultValue="ops@ecoya.app" />
          </Field>
        </div>

        <h3 className="mt-8 mb-4 border-t pt-6 text-sm font-semibold">
          사업자 등록
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="사업자번호">
            <Input name="businessNumber" defaultValue="123-45-67890" />
          </Field>
          <Field label="사업자등록번호">
            <Input name="registrationNumber" defaultValue="110111-1234567" />
          </Field>
        </div>
        <FileField
          label="사업자등록증"
          help="PDF, PNG, JPG · 1MB 이하"
          accept=".pdf,image/png,image/jpeg"
          maxBytes={1024 * 1024}
          onFile={setRegistrationCertificateUri}
        />

        <h3 className="mt-4 mb-4 border-t pt-6 text-sm font-semibold">은행</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="은행명">
            <Input name="bankName" defaultValue="DBS Bank" />
          </Field>
          <Field label="계좌번호">
            <Input name="accountNumber" defaultValue="8830043968" />
          </Field>
          <Field label="SWIFT">
            <Input name="swift" defaultValue="DBSSSGSG" />
          </Field>
        </div>

        <h3 className="mt-8 mb-4 border-t pt-6 text-sm font-semibold">서명</h3>
        <Field label="서명자(이름/직책)" className="max-w-xl">
          <Input name="signatory" defaultValue="Minyoung Cho / CEO" />
        </Field>
        <FileField
          label="서명 이미지"
          help="PNG 또는 JPG · 200KB 이하"
          accept="image/png,image/jpeg"
          maxBytes={200 * 1024}
          onFile={setSignatureUri}
        />

        <h3 className="mt-4 mb-4 border-t pt-6 text-sm font-semibold">
          브랜드 · 모든 생성 문서에 자동 적용
        </h3>
        <FileField
          label="로고"
          help="PDF에 임베드되는 이미지 · 200KB 이하"
          accept="image/png,image/jpeg"
          maxBytes={200 * 1024}
          onFile={setLogoUri}
        />
        <div className="grid gap-4 py-4 sm:grid-cols-2">
          <Field label="강조색">
            <div className="flex items-center gap-2">
              <Input
                className="w-20 p-1"
                type="color"
                value={accent}
                onChange={(event) => setAccent(event.target.value)}
              />
              <Input
                value={accent}
                onChange={(event) => setAccent(event.target.value)}
              />
            </div>
          </Field>
          <Field label="폰트">
            <Select
              value={font}
              onValueChange={(value) => value && setFont(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sans">고딕 (Sans)</SelectItem>
                <SelectItem value="serif">명조 (Serif)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <h3 className="mt-4 mb-4 border-t pt-6 text-sm font-semibold">
          업무 기준
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="업무 타임존">
            <Select
              value={timezone}
              onValueChange={(value) => value && setTimezone(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Seoul">Asia/Seoul</SelectItem>
                <SelectItem value="Asia/Singapore">Asia/Singapore</SelectItem>
                <SelectItem value="Europe/Berlin">Europe/Berlin</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs leading-5 text-muted-foreground">
              받을 돈·보낼 돈의 연체와 만기 판정 기준입니다.
            </span>
          </Field>
          <Field label="AI 출력 언어">
            <Select
              value={aiLanguage}
              onValueChange={(value) => value && setAiLanguage(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unset">미설정 (기본 동작)</SelectItem>
                <SelectItem value="ko">한국어</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs leading-5 text-muted-foreground">
              딜 브리프와 자연어 질의 답변 언어를 고정합니다.
            </span>
          </Field>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button type="submit" disabled={saveState === "saving"}>
            {saveState === "saving" ? (
              <>
                <Loader2 className="animate-spin" /> 저장 중
              </>
            ) : saveState === "saved" ? (
              <>
                <Check /> 저장됨
              </>
            ) : (
              "변경사항 저장"
            )}
          </Button>
          {saveState === "saved" ? (
            <span className="text-sm text-emerald-700">
              회사 정보를 저장했습니다.
            </span>
          ) : null}
          {error ? (
            <span className="text-sm text-red-600" role="alert">
              {error}
            </span>
          ) : null}
        </div>
      </form>
    </div>
  )
}

type ApprovalMode = "disabled" | "optional" | "required" | "conditional"
type ApprovalPolicy = {
  id: string
  revision: number
  scopeKind: "org" | "document_type"
  scopeRef: string
  mode: ApprovalMode
  amountEnabled: boolean
  amountCurrency: string
  amountThreshold: string
  counterpartyRiskEnabled: boolean
  counterpartyRiskMinGrade: "A" | "B" | "C" | "D"
  discrepancyEnabled: boolean
  newCounterpartyEnabled: boolean
}

const emptyApprovalPolicy: ApprovalPolicy = {
  id: "",
  revision: 0,
  scopeKind: "org",
  scopeRef: "",
  mode: "conditional",
  amountEnabled: true,
  amountCurrency: "USD",
  amountThreshold: "50000",
  counterpartyRiskEnabled: true,
  counterpartyRiskMinGrade: "C",
  discrepancyEnabled: true,
  newCounterpartyEnabled: true,
}

const approvalModeLabel: Record<ApprovalMode, string> = {
  disabled: "사용 안 함",
  optional: "선택 승인",
  required: "항상 승인",
  conditional: "조건부 승인",
}

function ApprovalPolicySettings() {
  const [policies, setPolicies] = useState<ApprovalPolicy[]>([
    { ...emptyApprovalPolicy, id: "AP-ORG-001", revision: 3 },
  ])
  const [form, setForm] = useState<ApprovalPolicy>(emptyApprovalPolicy)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [confirmAction, setConfirmAction] = useState<
    { kind: "save" } | { kind: "delete"; policy: ApprovalPolicy } | null
  >(null)

  const affectedDraftCount =
    form.mode === "disabled"
      ? 0
      : form.mode === "required"
        ? 12
        : [
            form.amountEnabled ? 4 : 0,
            form.counterpartyRiskEnabled ? 3 : 0,
            form.discrepancyEnabled ? 2 : 0,
            form.newCounterpartyEnabled ? 3 : 0,
          ].reduce((sum, value) => sum + value, 0)
  const amountInvalid =
    form.amountEnabled &&
    (!/^[A-Z]{3}$/.test(form.amountCurrency) ||
      !Number.isFinite(Number(form.amountThreshold)) ||
      Number(form.amountThreshold) < 0)
  const scopeInvalid = form.scopeKind === "document_type" && !form.scopeRef.trim()

  const savePolicy = async () => {
    if (amountInvalid || scopeInvalid || pending) return
    setPending(true)
    setError("")
    setMessage("")
    const nextPolicy = {
      ...form,
      id: form.id || `AP-${Date.now()}`,
      revision: form.revision + 1,
      amountCurrency: form.amountCurrency.toUpperCase(),
    }
    const result = await prototypeBackend.settings.saveApprovalPolicy(nextPolicy)
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setPolicies((current) =>
      form.id
        ? current.map((policy) =>
            policy.id === form.id ? nextPolicy : policy
          )
        : [...current, nextPolicy]
    )
    setForm(emptyApprovalPolicy)
    setConfirmAction(null)
    setMessage("결재 정책을 저장했습니다.")
  }

  const deletePolicy = async (policy: ApprovalPolicy) => {
    if (pending) return
    setPending(true)
    setError("")
    const result = await prototypeBackend.settings.deleteApprovalPolicy(policy.id)
    setPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setPolicies((current) => current.filter((item) => item.id !== policy.id))
    if (form.id === policy.id) setForm(emptyApprovalPolicy)
    setConfirmAction(null)
    setMessage("결재 정책을 삭제했습니다.")
  }

  return (
    <div>
      <SettingsHeading
        title="결재 정책"
        description="생성 문서에 적용할 승인 방식과 조건을 관리합니다. 실제 적용 정책은 조직 정책과 문서 유형 정책의 우선순위로 결정됩니다."
        action={<Badge variant="secondary">Owner / Admin</Badge>}
      />
      <div className="max-w-5xl divide-y">
        <section className="py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">등록된 정책</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                문서 유형 정책이 조직 기본 정책보다 먼저 적용됩니다.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setForm(emptyApprovalPolicy)
                setMessage("")
              }}
            >
              새 정책
            </Button>
          </div>
          <div className="mt-4 divide-y rounded-md border">
            {policies.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                등록된 정책이 없습니다. 승인 없이 문서를 확정할 수 있습니다.
              </div>
            ) : (
              policies.map((policy) => (
                <div
                  key={policy.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {policy.scopeKind === "org"
                          ? "조직 기본"
                          : policy.scopeRef}
                      </span>
                      <Badge variant="outline">
                        {approvalModeLabel[policy.mode]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      revision {policy.revision} · 금액, 거래처 위험, 불일치, 신규 거래처 조건
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setForm({ ...policy })
                      setMessage("")
                    }}
                  >
                    수정
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmAction({ kind: "delete", policy })}
                  >
                    삭제
                  </Button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="py-5">
          <h3 className="font-semibold">
            {form.id ? "정책 수정" : "정책 만들기"}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="적용 범위">
              <Select
                value={form.scopeKind}
                onValueChange={(value) =>
                  value &&
                  setForm((current) => ({
                    ...current,
                    scopeKind: value as ApprovalPolicy["scopeKind"],
                  }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="org">조직 전체</SelectItem>
                  <SelectItem value="document_type">문서 유형</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="승인 방식">
              <Select
                value={form.mode}
                onValueChange={(value) =>
                  value &&
                  setForm((current) => ({
                    ...current,
                    mode: value as ApprovalMode,
                  }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(approvalModeLabel).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {form.scopeKind === "document_type" ? (
              <Field label="문서 유형" className="sm:col-span-2">
                <Input
                  value={form.scopeRef}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, scopeRef: event.target.value }))
                  }
                  placeholder="commercial_invoice"
                />
              </Field>
            ) : null}
          </div>
          <div className="mt-5 divide-y rounded-md border px-4">
            <div className="grid gap-3 py-4 sm:grid-cols-[1fr_9rem_12rem] sm:items-center">
              <label className="flex items-center gap-3 text-sm font-medium">
                <Checkbox
                  checked={form.amountEnabled}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({ ...current, amountEnabled: checked === true }))
                  }
                />
                금액 기준
              </label>
              <Input
                value={form.amountCurrency}
                disabled={!form.amountEnabled}
                maxLength={3}
                aria-label="승인 기준 통화"
                onChange={(event) =>
                  setForm((current) => ({ ...current, amountCurrency: event.target.value.toUpperCase() }))
                }
              />
              <Input
                value={form.amountThreshold}
                disabled={!form.amountEnabled}
                inputMode="decimal"
                aria-label="승인 기준 금액"
                onChange={(event) =>
                  setForm((current) => ({ ...current, amountThreshold: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-3 py-4 sm:grid-cols-[1fr_12rem] sm:items-center">
              <label className="flex items-center gap-3 text-sm font-medium">
                <Checkbox
                  checked={form.counterpartyRiskEnabled}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({ ...current, counterpartyRiskEnabled: checked === true }))
                  }
                />
                거래처 위험 등급
              </label>
              <Select
                value={form.counterpartyRiskMinGrade}
                disabled={!form.counterpartyRiskEnabled}
                onValueChange={(value) =>
                  value &&
                  setForm((current) => ({ ...current, counterpartyRiskMinGrade: value as ApprovalPolicy["counterpartyRiskMinGrade"] }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["A", "B", "C", "D"] as const).map((grade) => (
                    <SelectItem key={grade} value={grade}>{grade} 이상 위험</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {[
              ["discrepancyEnabled", "문서 불일치 warning 이상"],
              ["newCounterpartyEnabled", "신규 거래처"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 py-4 text-sm font-medium">
                <Checkbox
                  checked={Boolean(form[key as "discrepancyEnabled" | "newCounterpartyEnabled"])}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({ ...current, [key]: checked === true }))
                  }
                />
                {label}
              </label>
            ))}
          </div>
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            현재 입력값으로 저장하면 작성 중인 초안 {affectedDraftCount}건의 유효 정책이 달라집니다.
          </div>
          {amountInvalid || scopeInvalid ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {scopeInvalid
                ? "문서 유형을 입력해 주세요."
                : "통화 3자리 코드와 0 이상의 기준 금액을 확인해 주세요."}
            </p>
          ) : null}
          {error ? <p className="mt-3 text-sm text-red-600" role="alert">{error}</p> : null}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              disabled={pending || amountInvalid || scopeInvalid}
              onClick={() =>
                affectedDraftCount > 0
                  ? setConfirmAction({ kind: "save" })
                  : void savePolicy()
              }
            >
              {pending ? <Loader2 className="animate-spin" /> : null}
              정책 저장
            </Button>
            {form.id ? (
              <Button variant="outline" onClick={() => setForm(emptyApprovalPolicy)}>
                취소
              </Button>
            ) : null}
            {message ? <span className="text-sm text-emerald-700">{message}</span> : null}
          </div>
        </section>
      </div>

      <AlertDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => !open && !pending && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.kind === "delete" ? "결재 정책을 삭제할까요?" : "결재 정책을 적용할까요?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.kind === "delete"
                ? "이 범위에는 상위 정책이 즉시 적용됩니다. 작성 중인 문서의 승인 조건이 달라질 수 있습니다."
                : `작성 중인 초안 ${affectedDraftCount}건의 승인 조건이 달라집니다. 저장 후 각 문서의 유효 정책을 다시 확인해 주세요.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>취소</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(event) => {
                event.preventDefault()
                if (confirmAction?.kind === "delete") {
                  void deletePolicy(confirmAction.policy)
                } else {
                  void savePolicy()
                }
              }}
            >
              {pending ? <Loader2 className="animate-spin" /> : null}
              {confirmAction?.kind === "delete" ? "삭제" : "저장"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

type RetentionPolicy = {
  id: string
  documentType: string
  basis: string
  minimumYears: number
  trigger: string
  extensionYears: string
}

const initialRetentionPolicies: RetentionPolicy[] = [
  {
    id: "commercial",
    documentType: "상업장부 · 영업 중요서류",
    basis: "상법",
    minimumYears: 10,
    trigger: "거래 종료일",
    extensionYears: "0",
  },
  {
    id: "vouchers",
    documentType: "전표 · 유사서류",
    basis: "상법",
    minimumYears: 5,
    trigger: "거래 종료일",
    extensionYears: "0",
  },
  {
    id: "domestic-tax",
    documentType: "국내 세무 장부 · 증빙",
    basis: "국세기본법",
    minimumYears: 5,
    trigger: "신고기한 다음 날",
    extensionYears: "0",
  },
  {
    id: "offshore-tax",
    documentType: "역외거래 세무 장부 · 증빙",
    basis: "국세기본법",
    minimumYears: 7,
    trigger: "신고기한 다음 날",
    extensionYears: "0",
  },
  {
    id: "customs",
    documentType: "수입신고 · 수입계약 자료",
    basis: "관세 관련 기준",
    minimumYears: 5,
    trigger: "수입신고 수리일",
    extensionYears: "0",
  },
]

function RetentionSettings() {
  const [policies, setPolicies] = useState(initialRetentionPolicies)
  const [legalHold, setLegalHold] = useState(true)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  )
  const [error, setError] = useState("")
  const updateExtension = (id: string, extensionYears: string) => {
    setPolicies((current) =>
      current.map((policy) =>
        policy.id === id ? { ...policy, extensionYears } : policy
      )
    )
    setSaveState("idle")
  }
  return (
    <div>
      <SettingsHeading
        title="문서 보관 정책"
        description="문서 유형별 보관 운영 초안을 관리합니다. 구체 기간과 폐기 기준은 법률·회계 검토 후 확정됩니다."
        action={<Badge variant="secondary">Owner / Admin</Badge>}
      />
      <div className="max-w-5xl py-5">
        <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          정책 상태: 법무·회계 검토 중입니다. 아래 기간은 법정 최소기간이나 최종
          폐기 기준으로 확정된 값이 아닙니다.
        </div>
        <div className="grid rounded-md bg-sidebar px-4 sm:grid-cols-3">
          <div className="py-4 sm:pr-5">
            <div className="text-xs text-muted-foreground">적용 관할</div>
            <div className="mt-1 font-medium">대한민국</div>
          </div>
          <div className="py-4 sm:px-5">
            <div className="text-xs text-muted-foreground">거래 표시 기준</div>
            <div className="mt-1 font-medium">문서 중 가장 늦은 만료일</div>
          </div>
          <div className="py-4 sm:pl-5">
            <div className="text-xs text-muted-foreground">관리 원칙</div>
            <div className="mt-1 font-medium">
              자동 폐기 금지 · 검토 후 확정
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-start justify-between gap-4 pb-3">
          <div>
            <h3 className="font-semibold">문서 유형별 잠정 보관기간</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              표시 기간은 운영 검토용 초안이며 확정 전까지 영구 폐기에 사용하지
              않습니다.
            </p>
          </div>
          <Badge variant="secondary">{policies.length}개 정책</Badge>
        </div>
        <div className="divide-y">
          {policies.map((policy) => {
            const totalYears =
              policy.minimumYears + Number(policy.extensionYears)
            return (
              <div
                key={policy.id}
                className="grid gap-3 py-4 lg:grid-cols-[minmax(220px,1.3fr)_minmax(150px,.8fr)_110px_150px] lg:items-center"
              >
                <div>
                  <div className="font-medium">{policy.documentType}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    기산일 {policy.trigger}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">검토 근거</div>
                  <div className="mt-1 text-sm">
                    {policy.basis} · 잠정 {policy.minimumYears}년
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">최종 기간</div>
                  <div className="mt-1 font-semibold">{totalYears}년</div>
                </div>
                <Field label="조직 연장">
                  <Select
                    value={policy.extensionYears}
                    onValueChange={(value) =>
                      value && updateExtension(policy.id, value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">연장 없음</SelectItem>
                      <SelectItem value="1">1년 연장</SelectItem>
                      <SelectItem value="3">3년 연장</SelectItem>
                      <SelectItem value="5">5년 연장</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            )
          })}
        </div>

        <div className="mt-6 border-y py-5">
          <label className="flex items-start justify-between gap-4">
            <div>
              <div className="font-medium">법적 보류 우선 적용</div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                분쟁·조사·감사 대상 문서는 만료일이 지나도 보류가 해제될 때까지
                삭제하지 않습니다.
              </p>
            </div>
            <Checkbox
              checked={legalHold}
              onCheckedChange={(checked) => {
                setLegalHold(checked === true)
                setSaveState("idle")
              }}
            />
          </label>
        </div>

        <div className="mt-5 divide-y rounded-md bg-sidebar px-4 text-sm">
          <div className="py-3">
            미완료·중단 거래의 문서는 자동 폐기하지 않습니다.
          </div>
          <div className="py-3">
            일반 사용자의 기본 동작은 삭제가 아닌 보관(Archive)입니다.
          </div>
          <div className="py-3">
            영구 폐기는 관리자 승인, 사전 경고, 복구 유예기간, 감사 이력을 모두
            요구합니다.
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            disabled={saveState === "saving"}
            onClick={async () => {
              setSaveState("saving")
              setError("")
              const result =
                await prototypeBackend.settings.saveRetentionPolicy({
                  legalHold,
                  policies: policies.map(({ id, extensionYears }) => ({
                    id,
                    extensionYears: Number(extensionYears),
                  })),
                })
              if (!result.ok) {
                setSaveState("idle")
                setError(result.error)
                return
              }
              setSaveState("saved")
            }}
          >
            {saveState === "saving" ? (
              <>
                <Loader2 className="animate-spin" /> 저장 중
              </>
            ) : saveState === "saved" ? (
              <>
                <Check /> 저장됨
              </>
            ) : (
              "운영 초안 저장"
            )}
          </Button>
          <span className="text-sm text-muted-foreground">
            개인정보는 별도 보유 근거가 없으면 목적 달성 후 파기하며,
            메타데이터만 감사 이력으로 남깁니다.
          </span>
          {error ? (
            <span className="text-sm text-red-600" role="alert">
              {error}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

type AliasMaster = {
  id: number
  canonical: string
  registration: string
  aliases: string[]
}
type AliasCandidate = {
  id: number
  alias: string
  suggestedMasterId: number
  source: string
  confidence: number
}

function AliasSettings() {
  const [masters, setMasters] = useState<AliasMaster[]>([
    {
      id: 1,
      canonical: "ACME GmbH",
      registration: "DE-ACME-1042",
      aliases: ["ACME", "ACME GMBH", "에이씨엠이"],
    },
    {
      id: 2,
      canonical: "KATAMAN ASIA-PACIFIC PTE LTD",
      registration: "SG-201912345N",
      aliases: ["카타만", "KATAMAN AP", "KATAMAN ASIA PACIFIC"],
    },
  ])
  const [candidates, setCandidates] = useState<AliasCandidate[]>([
    {
      id: 11,
      alias: "ACME Europe",
      suggestedMasterId: 1,
      source: "Invoice_HB-2607-003.pdf",
      confidence: 92,
    },
    {
      id: 12,
      alias: "Kataman Asia Pac.",
      suggestedMasterId: 2,
      source: "SC-2026-0708.pdf",
      confidence: 86,
    },
  ])
  const [alias, setAlias] = useState("")
  const [masterId, setMasterId] = useState("1")
  const [expandedMaster, setExpandedMaster] = useState<number | null>(1)
  const [mergeTarget, setMergeTarget] = useState<AliasMaster | null>(null)
  const [mergeDestination, setMergeDestination] = useState("hanbit")
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState("")
  const confirmCandidate = async (candidate: AliasCandidate) => {
    setPending(`candidate-${candidate.id}`)
    setError("")
    const result = await prototypeBackend.settings.approveAlias({
      alias: candidate.alias,
      counterpartyId: String(candidate.suggestedMasterId),
    })
    setPending(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setMasters((items) =>
      items.map((item) =>
        item.id === candidate.suggestedMasterId &&
        !item.aliases.includes(candidate.alias)
          ? { ...item, aliases: [...item.aliases, candidate.alias] }
          : item
      )
    )
    setCandidates((items) => items.filter((item) => item.id !== candidate.id))
  }
  const dismissCandidate = async (candidate: AliasCandidate) => {
    setPending(`candidate-${candidate.id}`)
    setError("")
    const result = await prototypeBackend.settings.dismissAlias(
      String(candidate.id)
    )
    setPending(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setCandidates((items) => items.filter((item) => item.id !== candidate.id))
  }
  const deleteAlias = async (master: AliasMaster, name: string) => {
    setPending(`alias-${master.id}-${name}`)
    setError("")
    const result = await prototypeBackend.settings.deleteAlias(name)
    setPending(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setMasters((items) =>
      items.map((item) =>
        item.id === master.id
          ? {
              ...item,
              aliases: item.aliases.filter((aliasName) => aliasName !== name),
            }
          : item
      )
    )
  }
  const mergeCounterparty = async () => {
    if (!mergeTarget) return
    setPending(`merge-${mergeTarget.id}`)
    setError("")
    const result = await prototypeBackend.settings.mergeCounterparty({
      sourceId: String(mergeTarget.id),
      targetId: mergeDestination,
    })
    setPending(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setMasters((items) => items.filter((item) => item.id !== mergeTarget.id))
    setMergeTarget(null)
  }
  return (
    <div>
      <SettingsHeading
        title="거래처 별칭 학습"
        description="새 문서에서 읽은 거래처 표기는 후보로 쌓입니다. 담당자가 표준 거래처를 확인하면 다음 문서부터 같은 거래처로 자동 인식합니다."
      />
      <section className="max-w-5xl py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">확인 대기 후보</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              AI 제안은 자동 병합하지 않습니다. 표준 거래처를 선택한 뒤 확정해
              주세요.
            </p>
          </div>
          <Badge variant="secondary">{candidates.length}건</Badge>
        </div>
        {candidates.length ? (
          <div className="mt-3 divide-y">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,1fr)_auto] lg:items-center"
              >
                <div>
                  <div className="font-medium">{candidate.alias}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {candidate.source} · 일치 가능성 {candidate.confidence}%
                  </div>
                </div>
                <Select
                  value={String(candidate.suggestedMasterId)}
                  onValueChange={(value) =>
                    value &&
                    setCandidates((items) =>
                      items.map((item) =>
                        item.id === candidate.id
                          ? { ...item, suggestedMasterId: Number(value) }
                          : item
                      )
                    )
                  }
                >
                  <SelectTrigger
                    className="w-full"
                    aria-label={`${candidate.alias}의 표준 거래처`}
                  >
                    <span className="min-w-0 flex-1 truncate text-left">
                      {masters.find(
                        (master) => master.id === candidate.suggestedMasterId
                      )?.canonical ?? "표준 거래처 선택"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {masters.map((master) => (
                      <SelectItem key={master.id} value={String(master.id)}>
                        {master.canonical}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending === `candidate-${candidate.id}`}
                    onClick={() => void dismissCandidate(candidate)}
                  >
                    제외
                  </Button>
                  <Button
                    size="sm"
                    disabled={pending === `candidate-${candidate.id}`}
                    onClick={() => void confirmCandidate(candidate)}
                  >
                    {pending === `candidate-${candidate.id}` ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Check />
                    )}{" "}
                    연결 확정
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 py-4 text-sm text-muted-foreground">
            확인할 새 표기가 없습니다.
          </p>
        )}
        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </section>
      <form
        className="grid max-w-5xl gap-3 border-t py-5 lg:grid-cols-[1fr_1.4fr_auto]"
        onSubmit={async (event) => {
          event.preventDefault()
          if (!alias.trim()) return
          setPending("create-alias")
          setError("")
          const result = await prototypeBackend.settings.createAlias({
            alias: alias.trim(),
            counterpartyId: masterId,
          })
          setPending(null)
          if (!result.ok) {
            setError(result.error)
            return
          }
          setMasters((items) =>
            items.map((item) =>
              item.id === Number(masterId) &&
              !item.aliases.includes(alias.trim())
                ? { ...item, aliases: [...item.aliases, alias.trim()] }
                : item
            )
          )
          setAlias("")
        }}
      >
        <Field label="문서 표기 직접 추가">
          <Input
            placeholder="예: ACME EUROPE"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
          />
        </Field>
        <Field label="연결할 표준 거래처">
          <Select
            value={masterId}
            onValueChange={(value) => value && setMasterId(value)}
          >
            <SelectTrigger className="w-full">
              <span className="min-w-0 flex-1 truncate text-left">
                {masters.find((master) => String(master.id) === masterId)
                  ?.canonical ?? "표준 거래처 선택"}
              </span>
            </SelectTrigger>
            <SelectContent>
              {masters.map((master) => (
                <SelectItem key={master.id} value={String(master.id)}>
                  {master.canonical}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Button
          className="self-end"
          disabled={!alias.trim() || pending === "create-alias"}
        >
          {pending === "create-alias" ? (
            <Loader2 className="animate-spin" />
          ) : null}
          별칭 추가
        </Button>
      </form>
      <div className="max-w-5xl divide-y">
        {masters.map((master) => (
          <div key={master.id} className="py-4">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-center">
              <button
                type="button"
                className="min-w-0 text-left"
                onClick={() =>
                  setExpandedMaster((current) =>
                    current === master.id ? null : master.id
                  )
                }
              >
                <div className="font-medium">{master.canonical}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  문서 표기 {master.aliases.length}개
                </div>
              </button>
              <div>
                <div className="text-xs text-muted-foreground">
                  사업자등록번호
                </div>
                <div className="mt-1 text-sm">{master.registration || "-"}</div>
              </div>
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setExpandedMaster((current) =>
                      current === master.id ? null : master.id
                    )
                  }
                >
                  {expandedMaster === master.id ? "접기" : "별칭 보기"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMergeTarget(master)}
                >
                  거래처 병합
                </Button>
              </div>
            </div>
            {expandedMaster === master.id ? (
              <div className="mt-3 divide-y rounded-md bg-sidebar px-3">
                {master.aliases.map((name) => (
                  <div
                    key={name}
                    className="flex items-center justify-between gap-3 py-2.5 text-sm"
                  >
                    <span>{name}</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={pending === `alias-${master.id}-${name}`}
                      title={`${name} 별칭 삭제`}
                      onClick={() => void deleteAlias(master, name)}
                    >
                      {pending === `alias-${master.id}-${name}` ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Trash2 />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <AlertDialog
        open={Boolean(mergeTarget)}
        onOpenChange={(open) => !open && setMergeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>표준 거래처를 병합할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {mergeTarget?.canonical}의 모든 별칭과 연결 문서를 다른 표준
              거래처 아래로 합칩니다. 되돌리기 어려우니 대상을 확인해 주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Select
            value={mergeDestination}
            onValueChange={(value) => value && setMergeDestination(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hanbit">한빛무역</SelectItem>
              <SelectItem value="hmm">HMM Green</SelectItem>
            </SelectContent>
          </Select>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              disabled={Boolean(
                mergeTarget && pending === `merge-${mergeTarget.id}`
              )}
              onClick={(event) => {
                event.preventDefault()
                void mergeCounterparty()
              }}
            >
              {mergeTarget && pending === `merge-${mergeTarget.id}` ? (
                <Loader2 className="animate-spin" />
              ) : null}
              병합
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EmailForwardSettings() {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle"
  )
  const address = "docs+hanbit@ecoya.app"
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopyState("copied")
    } catch {
      setCopyState("failed")
    }
    window.setTimeout(() => setCopyState("idle"), 2200)
  }
  return (
    <div>
      <SettingsHeading
        title="이메일로 문서 받기"
        description="거래처 서류 메일을 전용 주소로 전달하면 첨부 PDF가 파일 올리기 확인 대기열에 자동 등록됩니다."
      />
      <div className="max-w-4xl py-6">
        <div className="flex flex-col gap-4 rounded-md bg-sidebar px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium">
              우리 워크스페이스 전용 수신 주소
            </div>
            <div className="mt-2 font-mono text-lg">{address}</div>
          </div>
          <Button variant="outline" onClick={() => void copyAddress()}>
            <Copy /> {copyState === "copied" ? "복사됨" : "주소 복사"}
          </Button>
        </div>
        {copyState === "failed" ? (
          <p className="mt-3 text-sm text-red-600">
            복사하지 못했습니다. 주소를 직접 선택해 복사해 주세요.
          </p>
        ) : null}
        <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
          <li>
            워크스페이스에 등록된 멤버의 이메일에서 보낸 메일만 접수됩니다.
          </li>
          <li>PDF 첨부만 처리하며 첨부당 최대 10MB입니다.</li>
          <li>처리 결과는 파일 올리기의 확인 대기열에서 확인할 수 있습니다.</li>
        </ul>
      </div>
    </div>
  )
}

function CsvImportSettings({ type }: { type: "contact" | "deal" }) {
  const isContact = type === "contact"
  const [csv, setCsv] = useState("")
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{
    total: number
    created: number
    skipped: number
    errors: Array<{ line: number; label: string; reason: string }>
  } | null>(null)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    void file.text().then(setCsv)
  }
  const importCsv = async () => {
    if (!csv.trim()) return
    setBusy(true)
    setResult(null)
    setError("")
    const importResult = isContact
      ? await prototypeBackend.settings.importContacts(csv)
      : await prototypeBackend.settings.importDeals(csv)
    if (!importResult.ok) {
      setError(importResult.error)
      setBusy(false)
      return
    }
    setResult(importResult)
    setBusy(false)
  }
  return (
    <div>
      <SettingsHeading
        title={isContact ? "거래처 일괄 등록 (CSV)" : "거래 일괄 등록 (CSV)"}
        description={
          isContact
            ? "이름·구분·회사·이메일·전화 컬럼을 읽고 같은 이름은 자동으로 건너뜁니다."
            : "거래처·거래명·방향 컬럼을 읽고 같은 거래명은 자동으로 건너뜁니다."
        }
      />
      <div className="max-w-5xl py-5">
        <Textarea
          className="min-h-52 font-mono text-sm"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={
            isContact
              ? "이름,구분,회사,이메일,전화\nACME 무역,counterparty,ACME Co.,sales@acme.com,02-111-2222"
              : "거래처,거래명,방향\nACME GmbH,PO-2024-019,매출\nGlobex,SC-1180,매입"
          }
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={onFile}
          />
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            <Upload /> CSV 파일 선택
          </Button>
          <Button
            disabled={busy || !csv.trim()}
            onClick={() => void importCsv()}
          >
            {busy ? (
              <>
                <RefreshCw className="animate-spin" /> 가져오는 중
              </>
            ) : (
              "가져오기"
            )}
          </Button>
        </div>
        {error ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        {result ? (
          <div className="mt-5 rounded-md bg-sidebar px-4 py-4">
            <div className="font-medium">
              가져오기 결과 · 전체 {result.total}건
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">{result.created}건 등록</Badge>
              <Badge variant="secondary">{result.skipped}건 중복 건너뜀</Badge>
              {result.errors.length ? (
                <Badge variant="destructive">
                  {result.errors.length}건 오류
                </Badge>
              ) : null}
            </div>
            {result.errors.map((rowError) => (
              <div
                key={`${rowError.line}-${rowError.label}`}
                className="mt-3 text-sm text-red-600"
              >
                {rowError.line}번째 줄 · {rowError.label}: {rowError.reason}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

const alertRules = [
  { id: "late-payment", name: "결제 연체", meta: "거래 · 높음 · 담당자 확인" },
  {
    id: "document-missing",
    name: "필수 서류 누락",
    meta: "문서 · 중간 · 담당자 확인",
  },
  {
    id: "shipment-delay",
    name: "선적 일정 지연",
    meta: "선적 · 높음 · 즉시 조치",
  },
]

function AlertSettings() {
  const [channels, setChannels] = useState<Record<string, boolean>>({
    inApp: true,
    email: true,
    slack: false,
  })
  const [rules, setRules] = useState<Record<string, boolean>>({
    "late-payment": true,
    "document-missing": true,
    "shipment-delay": false,
  })
  const [savedRules, setSavedRules] = useState(rules)
  const [pending, setPending] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const updateChannel = async (id: string, enabled: boolean) => {
    setPending(`channel-${id}`)
    setError("")
    const result = await prototypeBackend.settings.updateAlertSubscription({
      id,
      enabled,
    })
    setPending(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setChannels((current) => ({ ...current, [id]: enabled }))
  }
  const saveRules = async () => {
    const changedRules = alertRules.filter(
      (rule) => rules[rule.id] !== savedRules[rule.id]
    )
    if (changedRules.length === 0) return

    setPending("rules")
    setError("")
    setSaved(false)
    const results = await Promise.all(
      changedRules.map((rule) =>
        prototypeBackend.settings.updateAlertRule({
          id: rule.id,
          enabled: rules[rule.id],
        })
      )
    )
    setPending(null)
    const failed = results.find((result) => !result.ok)
    if (failed && !failed.ok) {
      setRules(savedRules)
      setError(failed.error)
      return
    }
    setSavedRules(rules)
    setSaved(true)
  }
  const hasRuleChanges = alertRules.some(
    (rule) => rules[rule.id] !== savedRules[rule.id]
  )
  return (
    <div>
      <SettingsHeading
        title="알림 설정"
        description="Trade OS에서 받을 알림 종류와 수신 채널을 설정합니다. 알림 내역은 사이드바의 알림에서 확인합니다."
      />
      <section className="max-w-5xl py-5">
        <h3 className="font-semibold">수신 채널</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          선택한 채널 설정은 내 계정에만 적용됩니다.
        </p>
        <div className="mt-3 divide-y">
          {[
            ["inApp", "앱 내 (알림 벨)"],
            ["email", "이메일"],
            ["slack", "Slack"],
          ].map(([id, label]) => (
            <label key={id} className="flex items-center justify-between py-4">
              <div>
                <div className="text-sm font-medium">{label}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {channels[id]
                    ? "이 채널로 알림을 받습니다."
                    : "구독하지 않음"}
                </div>
              </div>
              <Checkbox
                checked={channels[id]}
                disabled={pending === `channel-${id}`}
                onCheckedChange={(checked) =>
                  void updateChannel(id, checked === true)
                }
              />
            </label>
          ))}
        </div>
      </section>
      <section className="max-w-5xl border-t py-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">알림 종류</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              이 조직의 Trade OS에서 생성할 알림을 선택합니다.
            </p>
          </div>
          <Badge variant="secondary">Owner / Admin</Badge>
        </div>
        <div className="mt-3 divide-y">
          {alertRules.map((rule) => (
            <label
              key={rule.id}
              className="flex cursor-pointer items-center justify-between gap-4 py-4"
            >
              <div>
                <div className="text-sm font-medium">{rule.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {rule.meta}
                </div>
              </div>
              <Checkbox
                checked={rules[rule.id]}
                disabled={pending === "rules"}
                onCheckedChange={(checked) => {
                  setSaved(false)
                  setRules((current) => ({
                    ...current,
                    [rule.id]: checked === true,
                  }))
                }}
                aria-label={`${rule.name} 알림 받기`}
              />
            </label>
          ))}
        </div>
        <div className="flex items-center gap-3 border-t pt-5">
          <Button
            type="button"
            disabled={!hasRuleChanges || pending === "rules"}
            onClick={() => void saveRules()}
          >
            {pending === "rules" ? <Loader2 className="animate-spin" /> : null}
            알림 종류 저장
          </Button>
          {saved ? (
            <span className="text-sm text-emerald-700">저장했습니다.</span>
          ) : null}
        </div>
        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    </div>
  )
}

function SnapBrandingSettings() {
  const [saved, setSaved] = useState(false)

  return (
    <div>
      <SettingsHeading
        title="SNAP 브랜딩"
        description="현장 리포트와 고객 전달 화면에 사용하는 조직 이름, 로고, 강조색과 푸터를 관리합니다."
        action={<Badge variant="secondary">SNAP</Badge>}
      />
      <form
        className="max-w-4xl py-5"
        onSubmit={(event) => {
          event.preventDefault()
          setSaved(true)
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="표시 이름">
            <Input defaultValue="ECOYA Demo Co." />
          </Field>
          <Field label="브랜드 강조색">
            <div className="flex items-center gap-3">
              <Input
                type="color"
                defaultValue="#3b82d0"
                className="h-10 w-14 cursor-pointer p-1"
              />
              <Input defaultValue="#3B82D0" aria-label="브랜드 색상 코드" />
            </div>
          </Field>
          <Field label="리포트 푸터" className="sm:col-span-2">
            <Input defaultValue="Verified with ECOYA SNAP" />
          </Field>
          <Field label="조직 로고" className="sm:col-span-2">
            <Input type="file" accept="image/png,image/jpeg,image/svg+xml" />
          </Field>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Button type="submit">브랜딩 저장</Button>
          {saved ? (
            <span className="text-sm text-emerald-700">저장되었습니다.</span>
          ) : null}
        </div>
      </form>
    </div>
  )
}

function SnapLocalizationSettings() {
  const [saved, setSaved] = useState(false)

  return (
    <div>
      <SettingsHeading
        title="SNAP 지역화"
        description="SNAP 작업 지시, 리포트와 알림에 적용할 조직 기본 언어와 업무 시간대를 설정합니다. 개인 UI 언어와는 별개입니다."
        action={<Badge variant="secondary">SNAP</Badge>}
      />
      <form
        className="max-w-3xl py-5"
        onSubmit={(event) => {
          event.preventDefault()
          setSaved(true)
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="조직 기본 언어">
            <Select defaultValue="ko">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ko">한국어</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="업무 시간대">
            <Select defaultValue="Asia/Seoul">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Seoul">Asia/Seoul (UTC+9)</SelectItem>
                <SelectItem value="Asia/Singapore">
                  Asia/Singapore (UTC+8)
                </SelectItem>
                <SelectItem value="Europe/Berlin">Europe/Berlin</SelectItem>
                <SelectItem value="America/New_York">
                  America/New_York
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="국가·지역">
            <Select defaultValue="KR">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KR">대한민국</SelectItem>
                <SelectItem value="SG">싱가포르</SelectItem>
                <SelectItem value="DE">독일</SelectItem>
                <SelectItem value="US">미국</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="날짜 표기">
            <Select defaultValue="yyyy-mm-dd">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                <SelectItem value="dd-mm-yyyy">DD-MM-YYYY</SelectItem>
                <SelectItem value="mm-dd-yyyy">MM-DD-YYYY</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Button type="submit">지역화 저장</Button>
          {saved ? (
            <span className="text-sm text-emerald-700">저장되었습니다.</span>
          ) : null}
        </div>
      </form>
    </div>
  )
}

function SnapOperationsSettings() {
  const [channels, setChannels] = useState({
    app: true,
    email: true,
    sms: false,
  })
  const [saved, setSaved] = useState(false)

  return (
    <div>
      <SettingsHeading
        title="SNAP 현장 운영"
        description="현장 작업 배정, 결과 전달 방식과 AI 운영 기본값을 설정합니다. 새 작업부터 적용됩니다."
        action={<Badge variant="secondary">SNAP</Badge>}
      />
      <form
        className="max-w-4xl divide-y"
        onSubmit={(event) => {
          event.preventDefault()
          setSaved(true)
        }}
      >
        <section className="grid gap-4 py-5 sm:grid-cols-2">
          <Field label="기본 현장 배정">
            <Select defaultValue="manager">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">관리자가 직접 배정</SelectItem>
                <SelectItem value="round-robin">
                  활성 작업자 순환 배정
                </SelectItem>
                <SelectItem value="unassigned">미배정 대기열</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="기본 전달 결과">
            <Select defaultValue="report-link">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="report-link">고객 리포트 링크</SelectItem>
                <SelectItem value="pdf">PDF 리포트</SelectItem>
                <SelectItem value="internal">내부 확인만</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="AI 운영 모드">
            <Select defaultValue="live">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="live">실제 분석 사용</SelectItem>
                <SelectItem value="review">관리자 검토 후 적용</SelectItem>
                <SelectItem value="off">사용 안 함</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="활성 워크플로">
            <Select defaultValue="inspection-delivery">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inspection-delivery">검수 · 전달</SelectItem>
                <SelectItem value="loading-proof">상차 · 증빙</SelectItem>
                <SelectItem value="custom">조직 맞춤</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </section>
        <section className="py-5">
          <h3 className="font-semibold">전달 채널</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            고객 결과 전달에 사용할 수 있는 채널입니다.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[
              ["app", "앱 링크"],
              ["email", "이메일"],
              ["sms", "문자 메시지"],
            ].map(([id, label]) => (
              <label
                key={id}
                className="flex items-center gap-3 rounded-md border px-3 py-3 text-sm"
              >
                <Checkbox
                  checked={channels[id as keyof typeof channels]}
                  onCheckedChange={(checked) =>
                    setChannels((current) => ({
                      ...current,
                      [id]: checked === true,
                    }))
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </section>
        <div className="flex items-center gap-3 py-5">
          <Button type="submit">운영 기본값 저장</Button>
          {saved ? (
            <span className="text-sm text-emerald-700">저장되었습니다.</span>
          ) : null}
        </div>
      </form>
    </div>
  )
}

function SnapDataSettings() {
  const [saved, setSaved] = useState(false)
  const retentionRows = [
    ["원본 현장 증거", "365"],
    ["승인 리포트", "1825"],
    ["공유 링크", "30"],
    ["아카이브 전환", "180"],
  ]

  return (
    <div>
      <SettingsHeading
        title="SNAP 데이터 관리"
        description="데이터 거주 지역, 저장 할당량, 보존·파기와 조직 데이터 내보내기를 관리합니다."
        action={<Badge variant="secondary">SNAP · Owner/Admin</Badge>}
      />
      <div className="max-w-5xl divide-y">
        <section className="grid gap-4 py-5 sm:grid-cols-2">
          <Field label="데이터 거주 지역">
            <Select defaultValue="kr">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kr">대한민국</SelectItem>
                <SelectItem value="sg">싱가포르</SelectItem>
                <SelectItem value="eu">유럽 연합</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="rounded-md bg-sidebar px-4 py-3">
            <div className="text-sm font-medium">저장 공간</div>
            <div className="mt-1 text-2xl font-semibold">18.4 GB / 100 GB</div>
            <div className="mt-1 text-xs text-muted-foreground">
              조직 전체 사용량 · 최근 갱신 방금 전
            </div>
          </div>
        </section>
        <section className="py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">보존 정책</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                기존 법적 보존 의무보다 짧게 변경할 수 없습니다.
              </p>
            </div>
            <Badge variant="outline">일 단위</Badge>
          </div>
          <div className="mt-3 divide-y border-y">
            {retentionRows.map(([label, value]) => (
              <div
                key={label}
                className="grid items-center gap-3 py-3 sm:grid-cols-[1fr_160px]"
              >
                <span className="text-sm font-medium">{label}</span>
                <Input
                  type="number"
                  min="1"
                  defaultValue={value}
                  aria-label={`${label} 보존 일수`}
                />
              </div>
            ))}
          </div>
        </section>
        <section className="flex flex-wrap items-center justify-between gap-3 py-5">
          <div>
            <h3 className="font-semibold">조직 데이터 및 감사 이력</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              삭제 요청과 파기 실행은 감사 로그에 남습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">
              <Download /> 조직 데이터 내보내기
            </Button>
            <Button variant="outline">감사 로그 보기</Button>
          </div>
        </section>
        <div className="flex items-center gap-3 py-5">
          <Button onClick={() => setSaved(true)}>데이터 정책 저장</Button>
          {saved ? (
            <span className="text-sm text-emerald-700">저장되었습니다.</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function SnapBillingSettings() {
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [targetPlan, setTargetPlan] = useState("enterprise")
  const [pending, setPending] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const runAction = async (
    key: string,
    action: () => ReturnType<typeof prototypeBackend.settings.openSnapBillingPortal>,
    success: string
  ) => {
    setPending(key)
    setMessage("")
    setError("")
    const result = await action()
    setPending("")
    if (!result.ok) {
      setError(result.error)
      return false
    }
    setMessage(success)
    return true
  }

  const invoices = [
    {
      id: "txn_202607_growth",
      number: "INV-2026-0071",
      billedAt: "2026.07.15",
      amount: "₩349,000",
      status: "paid",
    },
    {
      id: "txn_202606_growth",
      number: "INV-2026-0062",
      billedAt: "2026.06.15",
      amount: "₩349,000",
      status: "paid",
    },
  ]

  return (
    <div>
      <SettingsHeading
        title="SNAP 플랜·청구"
        description="현재 플랜과 리포트 크레딧을 확인하고, 플랜 변경 요청·결제 포털·청구서를 관리합니다."
        action={<Badge variant="secondary">SNAP · Owner</Badge>}
      />
      <div className="max-w-5xl divide-y">
        <section className="grid gap-4 py-5 sm:grid-cols-3">
          {[
            ["현재 플랜", "Growth"],
            ["크레딧 잔액", "1,240"],
            ["이번 달 사용", "386"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md bg-sidebar px-4 py-4">
              <div className="text-sm text-muted-foreground">{label}</div>
              <div className="mt-2 text-xl font-semibold">{value}</div>
            </div>
          ))}
        </section>
        <section className="py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">구독 관리</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                다음 결제일 2026.09.15 · 월 포함 크레딧 2,000 · 구독 정상
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={Boolean(pending)}
                onClick={() =>
                  void runAction(
                    "portal",
                    () => prototypeBackend.settings.openSnapBillingPortal(),
                    "결제 포털용 일회성 링크를 준비했습니다. 실제 연결 시 새 창에서 열립니다."
                  )
                }
              >
                {pending === "portal" ? <Loader2 className="animate-spin" /> : null}
                결제 포털
              </Button>
              <Button onClick={() => setUpgradeOpen(true)}>플랜 변경 요청</Button>
            </div>
          </div>
          <div className="mt-4 rounded-md border bg-sidebar px-4 py-3 text-sm text-muted-foreground">
            결제 포털은 서버에서 짧게 유효한 grant를 발급하고 한 번 소비한 뒤 제공자 URL로 이동합니다. URL은 저장하지 않습니다.
          </div>
        </section>
        <section className="py-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-semibold">청구서</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                현재 조직 소유의 제공자 청구서만 표시합니다.
              </p>
            </div>
            <Badge variant="outline">최근 12개월</Badge>
          </div>
          <div className="mt-4 divide-y rounded-md border">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_8rem_8rem_auto] sm:items-center"
              >
                <div>
                  <div className="font-medium">{invoice.number}</div>
                  <div className="text-xs text-muted-foreground">{invoice.billedAt}</div>
                </div>
                <div className="text-sm tabular-nums">{invoice.amount}</div>
                <Badge variant="secondary" className="w-fit">결제 완료</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={Boolean(pending)}
                  onClick={() =>
                    void runAction(
                      `invoice-${invoice.id}`,
                      () => prototypeBackend.settings.downloadSnapInvoice(invoice.id),
                      `${invoice.number}의 새 다운로드 링크를 발급했습니다.`
                    )
                  }
                >
                  {pending === `invoice-${invoice.id}` ? <Loader2 className="animate-spin" /> : <Download />}
                  PDF
                </Button>
              </div>
            ))}
          </div>
        </section>
        {message || error ? (
          <section className="py-5">
            <div
              role={error ? "alert" : "status"}
              className={cn(
                "rounded-md border px-4 py-3 text-sm",
                error
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              )}
            >
              {error || message}
            </div>
          </section>
        ) : null}
      </div>
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>플랜 변경 요청</DialogTitle>
            <DialogDescription>
              현재 플랜보다 높은 플랜만 요청할 수 있습니다. 같은 요청을 다시 보내면 기존 요청에 합쳐집니다.
            </DialogDescription>
          </DialogHeader>
          <Field label="변경할 플랜">
            <Select value={targetPlan} onValueChange={(value) => value && setTargetPlan(value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            요청만 등록되며 즉시 과금되거나 플랜이 변경되지 않습니다. 담당자 확인 후 Owner에게 결과를 알립니다.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeOpen(false)}>취소</Button>
            <Button
              disabled={Boolean(pending)}
              onClick={() => {
                void runAction(
                  "upgrade",
                  () => prototypeBackend.settings.requestSnapPlanUpgrade(targetPlan),
                  "Enterprise 플랜 변경 요청을 등록했습니다."
                ).then((ok) => ok && setUpgradeOpen(false))
              }}
            >
              {pending === "upgrade" ? <Loader2 className="animate-spin" /> : <Send />}
              요청 보내기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

type Member = {
  id: number
  name: string
  email: string
  role: "Owner" | "Admin" | "Member"
  joined: string
}
type PendingInvite = {
  id: number
  email: string
  role: "Admin" | "Member"
  expires: string
}

function MemberSettings() {
  const [members, setMembers] = useState<Member[]>([
    {
      id: 1,
      name: "조민영",
      email: "minyoung@ecoya.app",
      role: "Owner",
      joined: "2026.01.08",
    },
    {
      id: 2,
      name: "김민지",
      email: "minji@ecoya.app",
      role: "Admin",
      joined: "2026.03.12",
    },
    {
      id: 3,
      name: "박서준",
      email: "seojun@ecoya.app",
      role: "Member",
      joined: "2026.06.01",
    },
  ])
  const [invites, setInvites] = useState<PendingInvite[]>([
    {
      id: 1,
      email: "finance@ecoya.app",
      role: "Member",
      expires: "2026.07.23",
    },
  ])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"Admin" | "Member">("Member")
  const [confirm, setConfirm] = useState<{
    member: Member
    kind: "remove" | "erase"
  } | null>(null)
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState("")
  const createInvite = async (event: FormEvent) => {
    event.preventDefault()
    if (!inviteEmail.trim()) return
    setPending("invite")
    setError("")
    const result = await prototypeBackend.settings.createInvite({
      email: inviteEmail.trim(),
      role: inviteRole,
    })
    setPending(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setInvites((current) => [
      ...current,
      {
        id: Date.now(),
        email: inviteEmail,
        role: inviteRole,
        expires: "2026.07.30",
      },
    ])
    setInviteEmail("")
    setInviteOpen(false)
  }
  const changeRole = async (member: Member, role: "Admin" | "Member") => {
    setPending(`member-${member.id}`)
    setError("")
    const result = await prototypeBackend.settings.changeMemberRole({
      memberId: String(member.id),
      role,
    })
    setPending(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setMembers((items) =>
      items.map((item) => (item.id === member.id ? { ...item, role } : item))
    )
  }
  const updateInvite = async (
    invite: PendingInvite,
    action: "resend" | "cancel"
  ) => {
    setPending(`invite-${invite.id}`)
    setError("")
    const result =
      action === "resend"
        ? await prototypeBackend.settings.resendInvite(String(invite.id))
        : await prototypeBackend.settings.cancelInvite(String(invite.id))
    setPending(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    if (action === "cancel")
      setInvites((items) => items.filter((item) => item.id !== invite.id))
  }
  const confirmMemberAction = async () => {
    if (!confirm) return
    setPending(`member-${confirm.member.id}`)
    setError("")
    const result =
      confirm.kind === "erase"
        ? await prototypeBackend.settings.eraseUserData(
            String(confirm.member.id)
          )
        : await prototypeBackend.settings.removeMember(
            String(confirm.member.id)
          )
    setPending(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setMembers((items) => items.filter((item) => item.id !== confirm.member.id))
    setConfirm(null)
  }
  const exportMember = (member: Member) => {
    const blob = new Blob(
      [`name,email,role\n${member.name},${member.email},${member.role}\n`],
      { type: "text/csv" }
    )
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${member.name}-data.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div>
      <SettingsHeading
        title="멤버 관리"
        description="팀원 초대, 역할 변경, 퇴출과 개인정보 작업을 관리합니다."
        action={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus /> 팀원 초대
          </Button>
        }
      />
      <section className="max-w-5xl py-5">
        <h3 className="font-semibold">활성 멤버</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          역할 변경과 퇴출은 Owner·Admin, 데이터 내보내기와 개인정보 삭제는
          Owner만 실행할 수 있습니다.
        </p>
        <div className="mt-3 divide-y">
          {members.map((member) => (
            <div
              key={member.id}
              className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_150px_auto] sm:items-center"
            >
              <div>
                <div className="font-medium">
                  {member.name}
                  {member.id === 1 ? (
                    <Badge className="ml-2" variant="secondary">
                      나
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {member.email} · 가입 {member.joined}
                </div>
              </div>
              <Select
                value={member.role}
                disabled={
                  member.role === "Owner" || pending === `member-${member.id}`
                }
                onValueChange={(role) => {
                  if (role === "Admin" || role === "Member")
                    void changeRole(member, role)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Owner">Owner</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Member">Member</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="멤버 데이터 내보내기"
                  onClick={() => exportMember(member)}
                >
                  <Download />
                </Button>
                {member.role !== "Owner" ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title="멤버 퇴출"
                      onClick={() => setConfirm({ member, kind: "remove" })}
                    >
                      <Trash2 />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirm({ member, kind: "erase" })}
                    >
                      개인정보 삭제
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </section>
      <section className="max-w-5xl border-t py-5">
        <h3 className="font-semibold">초대 중 상태</h3>
        {invites.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            대기 중인 초대가 없습니다.
          </p>
        ) : (
          <div className="mt-3 divide-y">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-medium">{invite.email}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    역할 {invite.role} · 초대 중 · 만료 {invite.expires}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending === `invite-${invite.id}`}
                    onClick={() => void updateInvite(invite, "resend")}
                  >
                    <RefreshCw
                      className={cn(
                        pending === `invite-${invite.id}` && "animate-spin"
                      )}
                    />{" "}
                    초대 재발송
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending === `invite-${invite.id}`}
                    onClick={() => void updateInvite(invite, "cancel")}
                  >
                    취소
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>팀원 초대</DialogTitle>
            <DialogDescription>
              역할을 선택해 워크스페이스 초대 이메일을 보냅니다.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createInvite} className="space-y-4">
            <Field label="이메일 주소">
              <Input
                type="email"
                placeholder="member@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </Field>
            <Field label="역할 선택">
              <Select
                value={inviteRole}
                onValueChange={(value) => {
                  if (value === "Admin" || value === "Member") {
                    setInviteRole(value)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">
                    Admin · 멤버 관리 및 담당자 배정
                  </SelectItem>
                  <SelectItem value="Member">
                    Member · 문서 업로드 및 Confirm
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteOpen(false)}
              >
                취소
              </Button>
              <Button disabled={!inviteEmail.trim() || pending === "invite"}>
                {pending === "invite" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Send />
                )}{" "}
                초대 이메일 발송
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => !open && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === "erase" ? "개인정보 삭제" : "멤버 퇴출"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === "erase"
                ? `${confirm.member.name}님의 계정을 익명화하고 멤버십을 제거합니다. 되돌릴 수 없습니다.`
                : `${confirm?.member.name}님을 워크스페이스에서 퇴출하고 담당 거래 배정을 해제합니다.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              disabled={Boolean(
                confirm && pending === `member-${confirm.member.id}`
              )}
              onClick={() => void confirmMemberAction()}
            >
              {confirm && pending === `member-${confirm.member.id}` ? (
                <Loader2 className="animate-spin" />
              ) : null}
              {confirm?.kind === "erase" ? "삭제" : "퇴출"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function SettingsWorkspace({
  onNavigate,
  onLogout,
  workspaceId,
  onWorkspaceChange,
  availableProducts = ["erp", "snap"],
}: {
  onNavigate: (screen: SettingsTarget) => void
  onLogout: () => void
  workspaceId: WorkspaceKey
  onWorkspaceChange: (workspaceId: WorkspaceKey) => void
  /** Product entitlements should come from the server, not the selected app. */
  availableProducts?: readonly ProductEntitlement[]
}) {
  const { isMobile, setOpenMobile, state: sidebarState } = useSidebar()
  const [section, setSection] = useState<SectionId>("profile")
  const [query, setQuery] = useState("")
  const [pendingSearchTarget, setPendingSearchTarget] =
    useState<SectionId | null>(null)
  const contentRef = useRef<HTMLElement>(null)
  const availableProductSet = new Set(availableProducts)
  const availableSections = sectionGroups
    .flatMap((group) => group.items)
    .filter(
      (item) => !item.product || availableProductSet.has(item.product)
    )
  const effectiveSection = availableSections.some(
    (item) => item.id === section
  )
    ? section
    : "profile"
  const content =
    effectiveSection === "profile" ? (
      <ProfileSettings />
    ) : effectiveSection === "organizations" ? (
      <OrganizationSettings />
    ) : effectiveSection === "company" ? (
      <CompanySettings />
    ) : effectiveSection === "approvals" ? (
      <ApprovalPolicySettings />
    ) : effectiveSection === "retention" ? (
      <RetentionSettings />
    ) : effectiveSection === "aliases" ? (
      <AliasSettings />
    ) : effectiveSection === "email" ? (
      <EmailForwardSettings />
    ) : effectiveSection === "contacts" ? (
      <CsvImportSettings type="contact" />
    ) : effectiveSection === "deals" ? (
      <CsvImportSettings type="deal" />
    ) : effectiveSection === "alerts" ? (
      <AlertSettings />
    ) : effectiveSection === "snap-branding" ? (
      <SnapBrandingSettings />
    ) : effectiveSection === "snap-localization" ? (
      <SnapLocalizationSettings />
    ) : effectiveSection === "snap-operations" ? (
      <SnapOperationsSettings />
    ) : effectiveSection === "snap-data" ? (
      <SnapDataSettings />
    ) : effectiveSection === "snap-billing" ? (
      <SnapBillingSettings />
    ) : (
      <MemberSettings />
    )
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const availableGroups = sectionGroups
    .map((group) => {
      const availableItems = group.items.filter(
        (item) => !item.product || availableProductSet.has(item.product)
      )
      return { ...group, items: availableItems }
    })
    .filter((group) => group.items.length > 0)
  const searchGroups = normalizedQuery
    ? availableGroups
        .map((group) => ({
          ...group,
          items: group.items
            .map((item) => {
              const searchableParts = [
                item.label,
                ...(item.keywords ?? []),
                group.label,
              ]
              const searchable = searchableParts.join(" ").toLocaleLowerCase()
              return {
                item,
                matchedText:
                  searchableParts.find((part) =>
                    part.toLocaleLowerCase().includes(normalizedQuery)
                  ) ?? item.label,
                searchable,
              }
            })
            .filter((result) => result.searchable.includes(normalizedQuery)),
        }))
        .filter((group) => group.items.length > 0)
    : []
  const searchResults = searchGroups.flatMap((group) =>
    group.items.map(({ item, matchedText }) => ({
      group: group.label,
      item,
      matchedText,
    }))
  )
  const visibleGroups = normalizedQuery ? [] : availableGroups
  const selectSection = (
    value: SectionId | null,
    options?: { fromSearch?: boolean }
  ) => {
    if (!value) return
    if (value === "tokens" || value === "billing") {
      if (isMobile) setOpenMobile(false)
      onNavigate(value)
      return
    }
    setSection(value)
    if (isMobile) setOpenMobile(false)
    if (options?.fromSearch) {
      setQuery("")
      setPendingSearchTarget(value)
    }
  }
  useEffect(() => {
    if (!pendingSearchTarget || pendingSearchTarget !== effectiveSection) return

    const frame = window.requestAnimationFrame(() => {
      const heading = contentRef.current?.querySelector<HTMLElement>("h1, h2")
      if (heading) {
        heading.tabIndex = -1
        heading.scrollIntoView({ behavior: "smooth", block: "start" })
        heading.focus({ preventScroll: true })
      }
      document
        .querySelector<HTMLElement>(
          `[data-settings-menu="${pendingSearchTarget}"]`
        )
        ?.scrollIntoView({ block: "nearest" })
      setPendingSearchTarget(null)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [effectiveSection, pendingSearchTarget])
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 bg-background">
      <Sidebar
        collapsible="icon"
        className="settings-navigation top-0 h-svh! md:z-50"
      >
        <SidebarHeader className="shrink-0 border-b p-3">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              className="h-10 min-w-0 flex-1 justify-start gap-3 px-2 text-muted-foreground group-data-[collapsible=icon]:hidden"
              onClick={() => onNavigate("home")}
            >
              <ArrowLeft />
              <span>앱으로 돌아가기</span>
            </Button>
            <SidebarTrigger
              aria-label={
                sidebarState === "collapsed"
                  ? "사이드바 펼치기"
                  : "사이드바 접기"
              }
              className="ml-auto shrink-0 group-data-[collapsible=icon]:mx-auto"
            />
          </div>
          <div className="mt-3">
            <WorkspaceSwitcher
              workspaceId={workspaceId}
              onWorkspaceChange={onWorkspaceChange}
            />
          </div>
          <div className="relative mt-3 group-data-[collapsible=icon]:hidden">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setQuery("")
                  return
                }
                if (event.key === "Enter" && searchResults[0]) {
                  event.preventDefault()
                  selectSection(searchResults[0].item.id, {
                    fromSearch: true,
                  })
                }
              }}
              className="pl-9"
              placeholder="설정 검색..."
              aria-label="설정 검색"
            />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <nav aria-label={normalizedQuery ? "설정 검색 결과" : "설정 메뉴"}>
            {normalizedQuery ? (
              searchGroups.length > 0 ? (
                searchGroups.map((group, groupIndex) => (
                  <SidebarGroup
                    key={group.label}
                    className={cn(groupIndex > 0 && "pt-1")}
                  >
                    <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {group.items.map(({ item, matchedText }) => {
                          const Icon = item.icon
                          const active = item.id === effectiveSection
                          return (
                            <SidebarMenuItem key={item.id}>
                              <SidebarMenuButton
                                data-settings-menu={item.id}
                                isActive={active}
                                tooltip={item.label}
                                onClick={() =>
                                  selectSection(item.id, { fromSearch: true })
                                }
                                aria-current={active ? "page" : undefined}
                                className="text-sidebar-foreground/75 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 data-active:text-primary"
                              >
                                <Icon />
                                <span className="group-data-[collapsible=icon]:hidden">
                                  {item.label}
                                </span>
                              </SidebarMenuButton>
                              {matchedText !== item.label ? (
                                <SidebarMenuSub>
                                  <SidebarMenuSubItem>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={active}
                                      onClick={() =>
                                        selectSection(item.id, {
                                          fromSearch: true,
                                        })
                                      }
                                      title={matchedText}
                                    >
                                      <button type="button">
                                        <Search />
                                        <span>{matchedText}</span>
                                      </button>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                </SidebarMenuSub>
                              ) : null}
                            </SidebarMenuItem>
                          )
                        })}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                ))
              ) : (
                <p className="px-4 py-3 text-sm text-muted-foreground">
                  일치하는 설정이 없습니다.
                </p>
              )
            ) : visibleGroups.length > 0 ? (
              visibleGroups.map((group, groupIndex) => (
              <SidebarGroup
                key={group.label}
                className={cn(groupIndex > 0 && "pt-1")}
              >
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const active = item.id === effectiveSection
                      return (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            data-settings-menu={item.id}
                            isActive={active}
                            tooltip={item.label}
                            onClick={() => selectSection(item.id)}
                            aria-current={active ? "page" : undefined}
                            className="text-sidebar-foreground/75 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 data-active:text-primary"
                          >
                            <Icon />
                            <span className="group-data-[collapsible=icon]:hidden">
                              {item.label}
                            </span>
                            {item.external ? (
                              <ChevronRight className="ml-auto text-muted-foreground group-data-[collapsible=icon]:hidden" />
                            ) : null}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                일치하는 설정이 없습니다.
              </p>
            )}
          </nav>
        </SidebarContent>
        <SidebarFooter className="border-t p-3">
          <SidebarMenu>
            <SidebarProfileMenu
              onSettings={() => undefined}
              onLogout={onLogout}
            />
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-h-0 min-w-0 overflow-hidden md:pt-(--header-height)">
        <div className="min-h-0 h-full overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl px-6 py-6 xl:px-8">
            <main ref={contentRef} className="min-w-0">
              {content}
            </main>
          </div>
        </div>
      </SidebarInset>
    </div>
  )
}

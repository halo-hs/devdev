import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  ArrowLeft,
  Bell,
  Building2,
  Check,
  CircleUserRound,
  Copy,
  CreditCard,
  Database,
  Download,
  FileSpreadsheet,
  Globe2,
  Landmark,
  Mail,
  Palette,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Upload,
  UserPlus,
  WalletCards,
} from "lucide-react"

import { SidebarProfileMenu } from "@shared/components/sidebar-profile-menu"
import {
  CreditConversionPreview,
  TrialSchedulePreview,
} from "@auth/components/trial-preview"
import { WorkspaceSwitcher } from "@shared/components/workspace-switcher"
import { Badge } from "@shared/components/ui/badge"
import { Button } from "@shared/components/ui/button"
import { Card, CardContent } from "@shared/components/ui/card"
import { Checkbox } from "@shared/components/ui/checkbox"
import { Input } from "@shared/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@shared/components/ui/dialog"
import { Progress } from "@shared/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@shared/components/ui/sidebar"
import type { WorkspaceKey } from "@shared/lib/workspaces"

export type ProductEntitlement = "erp" | "snap"
export type SettingsRole = "owner" | "admin" | "member"
type SettingsTarget = "home" | "tokens" | "billing"

type SectionId =
  | "account"
  | "organizations"
  | "organization"
  | "members"
  | "products"
  | "billing"
  | "trade-defaults"
  | "trade-email"
  | "trade-counterparty-import"
  | "trade-deal-import"
  | "trade-aliases"
  | "trade-alerts"
  | "trade-usage"
  | "snap-operations"
  | "snap-branding"
  | "snap-localization"
  | "snap-data"
  | "snap-usage"

type NavItem = {
  id: SectionId
  label: string
  icon: typeof CircleUserRound
  product?: ProductEntitlement
  roles?: readonly SettingsRole[]
  keywords?: readonly string[]
}

// Common SSOT 02-COMMON-IA: headings are non-interactive, menus one level deep.
const navigation: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "설정 시작",
    items: [{ id: "account", label: "일반", icon: CircleUserRound }],
  },
  {
    label: "조직",
    items: [
      {
        id: "organization",
        label: "조직 관리",
        icon: Building2,
        keywords: ["회사", "멤버", "초대", "은행", "서명"],
      },
      {
        id: "snap-data",
        label: "데이터 관리",
        icon: Database,
        product: "snap",
      },
    ],
  },
  {
    label: "알림",
    items: [
      { id: "trade-alerts", label: "ERP 알림", icon: Bell, product: "erp" },
    ],
  },
  {
    label: "ERP",
    items: [
      {
        id: "trade-email",
        label: "이메일로 문서 받기",
        icon: Mail,
        product: "erp",
      },
      {
        id: "trade-counterparty-import",
        label: "거래처 일괄 등록",
        icon: FileSpreadsheet,
        product: "erp",
      },
      {
        id: "trade-deal-import",
        label: "거래 일괄 등록",
        icon: Upload,
        product: "erp",
      },
      {
        id: "trade-aliases",
        label: "거래처 별칭 학습",
        icon: Landmark,
        product: "erp",
      },
    ],
  },
  {
    label: "SNAP",
    items: [
      { id: "snap-branding", label: "브랜딩", icon: Palette, product: "snap" },
      {
        id: "snap-localization",
        label: "지역화",
        icon: Globe2,
        product: "snap",
      },
      {
        id: "snap-operations",
        label: "현장 운영",
        icon: SlidersHorizontal,
        product: "snap",
      },
    ],
  },
  {
    label: "사용량 및 청구",
    items: [
      {
        id: "trade-usage",
        label: "ERP AI 사용량",
        icon: Sparkles,
        product: "erp",
      },
      {
        id: "billing",
        label: "ERP 결제·구독",
        icon: CreditCard,
        product: "erp",
      },
      {
        id: "snap-usage",
        label: "SNAP 크레딧·결제",
        icon: WalletCards,
        product: "snap",
      },
    ],
  },
]

function PageHeading({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <header className="mb-7 flex items-start justify-between gap-5">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}

function SettingsSection({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-4 px-0.5">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <Card className="shadow-xs">
        <CardContent className="p-5 sm:p-6">{children}</CardContent>
      </Card>
    </section>
  )
}

function SaveRow({ label = "변경사항 저장" }: { label?: string }) {
  const [saved, setSaved] = useState(false)
  return (
    <div className="mt-5 flex items-center gap-3">
      <Button onClick={() => setSaved(true)}>{label}</Button>
      {saved ? (
        <span className="flex items-center gap-1 text-xs text-emerald-700">
          <Check className="size-3.5" /> 저장했습니다.
        </span>
      ) : null}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-xs font-medium">{label}</span>
      {children}
    </label>
  )
}

function AccountPage() {
  return (
    <div>
      <PageHeading
        title="일반"
        description="내 계정 정보와 로그인 보안을 확인합니다."
      />
      <div className="space-y-7">
        <SettingsSection
          title="내 계정"
          description="개인 설정 화면 미리보기입니다. 계정 정보 저장은 아직 연결되지 않았습니다."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="이름">
              <Input defaultValue="조민영" readOnly />
            </Field>
            <Field label="로그인 이메일">
              <Input defaultValue="minyoung@ecoya.app" readOnly />
            </Field>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            업무 시간대와 기본 언어는 각 제품의 조직 설정에서 관리합니다.
          </p>
        </SettingsSection>
        <SettingsSection title="로그인 보안">
          <Button
            variant="outline"
            onClick={() => window.location.assign("/password-recovery")}
          >
            비밀번호 변경
          </Button>
        </SettingsSection>
      </div>
    </div>
  )
}

function OrganizationPage({ role }: { role: SettingsRole }) {
  const editable = role === "owner"
  return (
    <div>
      <PageHeading
        title="조직 관리"
        description="현재 조직의 정보와 제품별 멤버·초대를 관리합니다."
        action={
          <Badge variant="secondary">
            {editable ? "OWNER · 편집 가능" : "읽기 전용"}
          </Badge>
        }
      />
      <SettingsSection
        title="기본 정보"
        description="조직 원본 정보는 모든 활성 멤버가 보고 OWNER만 변경합니다."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="법정 이름">
            <Input
              defaultValue="Hanbit Trading Co., Ltd."
              readOnly={!editable}
            />
          </Field>
          <Field label="표시 이름">
            <Input defaultValue="한빛무역" readOnly={!editable} />
          </Field>
          <Field label="사업자·세무 식별값">
            <Input defaultValue="120-88-260708" readOnly={!editable} />
          </Field>
          <Field label="대표 이메일">
            <Input defaultValue="trade@hanbit.example" readOnly={!editable} />
          </Field>
          <Field label="대표 연락처">
            <Input defaultValue="+82 2 2607 0801" readOnly={!editable} />
          </Field>
          <Field label="국가·주소">
            <Input
              defaultValue="대한민국 · 서울특별시 중구"
              readOnly={!editable}
            />
          </Field>
          <Field label="기본 locale">
            <Input defaultValue="ko-KR" readOnly={!editable} />
          </Field>
          <Field label="기본 시간대">
            <Input defaultValue="Asia/Seoul" readOnly={!editable} />
          </Field>
        </div>
        {editable ? (
          <SaveRow label="조직 정보 저장" />
        ) : (
          <p className="mt-5 text-xs text-muted-foreground">
            조직 정보 변경은 Organization OWNER에게 요청하세요.
          </p>
        )}
      </SettingsSection>
    </div>
  )
}

function MembersPage({ role }: { role: SettingsRole }) {
  const owner = role === "owner"
  const [invited, setInvited] = useState(false)
  return (
    <div>
      <PageHeading
        title="사용자 관리"
        description="ERP 멤버와 초대를 관리합니다. SNAP 역할과 승인 상태는 SNAP 멤버 관리에서 확인하세요."
        action={
          <Button onClick={() => setInvited(true)}>
            <UserPlus /> 멤버 초대
          </Button>
        }
      />
      <div className="space-y-7">
        <SettingsSection
          title="조직 멤버"
          description={
            owner
              ? "OWNER는 역할과 제품 접근을 관리할 수 있습니다."
              : "ADMIN은 MEMBER 범위만 관리할 수 있습니다."
          }
        >
          <div className="grid gap-3">
            {[
              ["조민영", "minyoung@ecoya.app", "OWNER", "Trade OS", true],
              ["김도현", "dohyun@ecoya.app", "ADMIN", "Trade OS", false],
              ["박서윤", "seoyun@ecoya.app", "MEMBER", "Trade OS", false],
            ].map(([name, email, memberRole, access, self]) => (
              <div
                key={String(email)}
                className="grid items-center gap-3 rounded-lg border p-4 sm:grid-cols-[minmax(0,1fr)_140px_180px_auto]"
              >
                <div>
                  <div className="font-medium">
                    {name}
                    {self ? (
                      <Badge className="ml-2" variant="secondary">
                        나
                      </Badge>
                    ) : null}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {email}
                  </div>
                </div>
                <Select
                  defaultValue={String(memberRole).toLowerCase()}
                  disabled={
                    Boolean(self) || (!owner && memberRole !== "MEMBER")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">OWNER</SelectItem>
                    <SelectItem value="admin">ADMIN</SelectItem>
                    <SelectItem value="member">MEMBER</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">{access}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    Boolean(self) || (!owner && memberRole !== "MEMBER")
                  }
                >
                  접근 관리
                </Button>
              </div>
            ))}
          </div>
        </SettingsSection>
        <SettingsSection
          title="멤버 초대"
          description="발송·수락·Membership 활성화는 서로 다른 상태입니다."
        >
          {invited ? (
            <div className="mb-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
              새 초대가 대기 상태로 추가되었습니다.
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
            <Input type="email" placeholder="member@company.com" />
            <Select defaultValue="member">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {owner ? <SelectItem value="admin">ADMIN</SelectItem> : null}
                <SelectItem value="member">MEMBER</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setInvited(true)}>초대 이메일 발송</Button>
          </div>
          <div className="mt-4 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">finance@ecoya.app</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  MEMBER · 대기 중 · 2026.09.15 만료
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  링크 복사
                </Button>
                <Button size="sm" variant="outline">
                  다시 보내기
                </Button>
                <Button size="sm" variant="ghost">
                  취소
                </Button>
              </div>
            </div>
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}

function BillingPreviewActions({ product }: { product: "erp" | "snap" }) {
  const [action, setAction] = useState<"subscription" | "credits" | null>(null)
  const [credits, setCredits] = useState("2000")
  const [plan, setPlan] = useState("pro")
  const [message, setMessage] = useState("")
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setAction("subscription")}>
          구독 관리
        </Button>
        {product === "snap" && (
          <Button onClick={() => setAction("credits")}>크레딧 충전</Button>
        )}
      </div>
      {message && (
        <p role="status" className="text-sm text-primary">
          {message}
        </p>
      )}
      <Dialog
        open={action !== null}
        onOpenChange={(open) => {
          if (!open) setAction(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "credits"
                ? "SNAP 크레딧 충전"
                : `${product === "erp" ? "ERP" : "SNAP"} 구독 관리`}
            </DialogTitle>
            <DialogDescription>
              결제 화면 미리보기입니다. 실제 청구나 크레딧 지급은 발생하지
              않습니다.
            </DialogDescription>
          </DialogHeader>
          {action === "credits" ? (
            <Field label="충전 크레딧">
              <Input
                type="number"
                min="1"
                step="1"
                value={credits}
                onChange={(event) => setCredits(event.target.value)}
              />
            </Field>
          ) : (
            <Field label="요금제">
              <Select
                value={plan}
                onValueChange={(value) => value && setPlan(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>
              취소
            </Button>
            <Button
              disabled={
                action === "credits" &&
                (!Number.isSafeInteger(Number(credits)) || Number(credits) <= 0)
              }
              onClick={() => {
                setMessage(
                  action === "credits"
                    ? `${Number(credits).toLocaleString("ko-KR")}크레딧 충전 · 결제 대기 (예시)`
                    : `${plan === "pro" ? "Pro" : "Enterprise"} 구독 변경 · 결제 대기 (예시)`
                )
                setAction(null)
              }}
            >
              결제 단계 확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BillingPage() {
  return (
    <div>
      <PageHeading
        title="ERP 결제·구독"
        description="현재 Organization의 결제 상태와 Paddle 인보이스를 확인합니다."
        action={<Badge variant="secondary">OWNER 전용</Badge>}
      />
      <div className="space-y-7">
        <TrialSchedulePreview />
        <SettingsSection
          title="결제 상태"
          description="외부 결제 화면을 열었다는 사실은 결제 완료를 뜻하지 않습니다."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="text-xs text-muted-foreground">Paddle 연결</div>
              <div className="mt-1 font-medium">연결됨</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">다음 결제일</div>
              <div className="mt-1 font-medium">2026.10.01</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">예정 금액</div>
              <div className="mt-1 font-medium">240,000 KRW</div>
            </div>
          </div>
          <div className="mt-5">
            <BillingPreviewActions product="erp" />
          </div>
        </SettingsSection>
        <SettingsSection title="인보이스">
          <div className="grid gap-3">
            {["2026년 9월 · 240,000 KRW", "2026년 8월 · 240,000 KRW"].map(
              (row) => (
                <div
                  key={row}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <span className="text-sm font-medium">{row}</span>
                  <Button variant="outline" size="sm">
                    <Download /> 내려받기
                  </Button>
                </div>
              )
            )}
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}

function TradeDefaultsPage({ role }: { role: SettingsRole }) {
  const editable = role !== "member"
  return (
    <div>
      <PageHeading
        title="업무 기본 설정"
        description="Trade OS 문서와 업무에 적용되는 승인된 기본값입니다."
        action={<Badge variant="secondary">Trade OS</Badge>}
      />
      <div className="space-y-7">
        <SettingsSection
          title="문서 브랜딩"
          description="Organization 원본 정보와 별도로 저장됩니다."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="문서 표시 이름">
              <Input defaultValue="ECOYA Demo Co." readOnly={!editable} />
            </Field>
            <Field label="승인 색상">
              <Input defaultValue="#0B3971" readOnly={!editable} />
            </Field>
            <Field label="법적 footer">
              <Input
                defaultValue="ECOYA Trade OS generated document"
                readOnly={!editable}
              />
            </Field>
            <Field label="승인 로고">
              <Button variant="outline" disabled={!editable}>
                <Upload /> 파일 선택
              </Button>
            </Field>
          </div>
          {editable ? <SaveRow label="브랜딩 저장" /> : null}
        </SettingsSection>
        <SettingsSection
          title="업무용 지급 정보"
          description="계좌 원문은 표시하지 않으며 변경에는 재인증이 필요합니다."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs text-muted-foreground">
                은행·계좌 명의
              </div>
              <div className="mt-1 text-sm font-medium">
                DBS Bank · ECOYA Demo Co.
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">통화·계좌</div>
              <div className="mt-1 text-sm font-medium">USD · •••• 0708</div>
            </div>
          </div>
          <div className="mt-5">
            <Button variant="outline" disabled={!editable}>
              재인증 후 변경
            </Button>
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}

function EmailPage() {
  const [copied, setCopied] = useState(false)
  return (
    <div>
      <PageHeading
        title="이메일로 문서 받기"
        description="현재 Organization 전용 주소로 전달된 문서는 문서 올리기 대기열에 들어옵니다."
      />
      <SettingsSection
        title="전용 수신 주소"
        description="주소 복사는 문서 수신·분석 성공을 의미하지 않습니다."
      >
        <div className="flex flex-col gap-3 rounded-xl bg-muted/35 p-5 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 truncate text-sm">
            hanbit-••••@inbound.ecoya.app
          </code>
          <Button variant="outline" onClick={() => setCopied(true)}>
            <Copy /> 주소 복사
          </Button>
        </div>
        {copied ? (
          <p className="mt-3 text-xs text-emerald-700">주소를 복사했습니다.</p>
        ) : null}
        <p className="mt-4 text-xs text-muted-foreground">
          PDF · 최대 10MB · 실제 주소는 로그와 캡처에서 마스킹됩니다.
        </p>
      </SettingsSection>
    </div>
  )
}

function ImportPage({ kind }: { kind: "counterparty" | "deal" }) {
  const title = kind === "counterparty" ? "거래처 일괄 등록" : "거래 일괄 등록"
  return (
    <div>
      <PageHeading
        title={title}
        description="CSV 파일의 형식과 행을 검사한 뒤 현재 Organization 원장에 반영합니다."
      />
      <div className="space-y-7">
        <SettingsSection
          title="파일 선택"
          description="자료 종류를 바꾸면 선택 파일과 열 매핑을 재사용하지 않습니다."
        >
          <button
            type="button"
            className="flex min-h-36 w-full flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 text-center"
          >
            <Upload className="size-5 text-primary" />
            <span className="mt-3 text-sm font-medium">
              CSV 파일을 선택하거나 끌어놓으세요
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              필수 열과 형식을 먼저 확인합니다.
            </span>
          </button>
          <div className="mt-4 flex justify-end">
            <Button>
              <Upload /> 가져오기
            </Button>
          </div>
        </SettingsSection>
        <SettingsSection title="최근 가져오기 결과">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["전체", "120"],
              ["생성", "108"],
              ["중복", "8"],
              ["오류", "4"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-muted/35 p-4">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="mt-1 text-xl font-semibold">{value}</div>
              </div>
            ))}
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}

function AliasesPage() {
  return (
    <div>
      <PageHeading
        title="거래처 별칭 학습"
        description="문서에서 읽은 거래처 표현을 기준 거래처에 연결하고 중복 후보를 검토합니다."
        action={<Button>별칭 추가</Button>}
      />
      <SettingsSection title="기준 거래처와 별칭">
        <div className="grid gap-3">
          {[
            ["ACME GmbH", "ACME · ACME Germany · ACME GMBH"],
            ["KATAMAN ASIA-PACIFIC PTE LTD", "KATAMAN · Kataman APAC"],
          ].map(([name, aliases]) => (
            <div
              key={name}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
            >
              <div>
                <div className="text-sm font-medium">{name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {aliases}
                </div>
              </div>
              <Button variant="outline" size="sm">
                병합 영향 미리보기
              </Button>
            </div>
          ))}
        </div>
      </SettingsSection>
    </div>
  )
}

function AlertsPage() {
  const [saved, setSaved] = useState(false)
  const [channels, setChannels] = useState({ app: true, email: true })
  const [rules, setRules] = useState({
    approval: true,
    document: true,
    risk: false,
    settlement: true,
  })
  return (
    <div>
      <PageHeading
        title="ERP 알림"
        description="Trade OS 업무 알림의 종류와 수신 채널을 설정합니다."
      />
      <div className="space-y-7">
        <SettingsSection
          title="수신 채널"
          description="채널 설정은 실제 알림 생성·전달·읽음 상태와 별개입니다."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["app", "앱 알림"],
              ["email", "이메일"],
            ].map(([id, label]) => (
              <label
                key={id}
                className="flex items-center gap-3 rounded-lg border p-4 text-sm"
              >
                <Checkbox
                  checked={channels[id as keyof typeof channels]}
                  onCheckedChange={(checked) =>
                    setChannels((value) => ({
                      ...value,
                      [id]: checked === true,
                    }))
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </SettingsSection>
        <SettingsSection
          title="알림 종류"
          description="현재 Organization · Trade OS · Asia/Seoul 기준"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["approval", "승인 요청·반려"],
              ["document", "문서 분석·처리 실패"],
              ["risk", "거래 위험·불일치"],
              ["settlement", "정산 기한·입출금"],
            ].map(([id, label]) => (
              <label
                key={id}
                className="flex items-center gap-3 rounded-lg border p-4 text-sm"
              >
                <Checkbox
                  checked={rules[id as keyof typeof rules]}
                  onCheckedChange={(checked) =>
                    setRules((value) => ({ ...value, [id]: checked === true }))
                  }
                />
                {label}
              </label>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Button onClick={() => setSaved(true)}>알림 설정 저장</Button>
            {saved ? (
              <span className="text-xs text-emerald-700">저장했습니다.</span>
            ) : null}
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}

function UsageCard({
  product,
  plan,
  state,
  used,
  limit,
  unit,
  reset,
  percent,
}: {
  product: string
  plan: string
  state: string
  used: string
  limit: string
  unit: string
  reset: string
  percent: number
}) {
  return (
    <div className="rounded-xl border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold">{product}</div>
          <div className="mt-1 text-xs text-muted-foreground">{plan}</div>
        </div>
        <Badge variant="secondary">{state}</Badge>
      </div>
      <div className="mt-6 flex items-end justify-between gap-3">
        <div>
          <span className="text-2xl font-semibold tabular-nums">{used}</span>
          <span className="ml-1 text-sm text-muted-foreground">
            / {limit} {unit}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{reset}</span>
      </div>
      <Progress value={percent} className="mt-3" />
    </div>
  )
}

function TradeUsagePage({ role }: { role: SettingsRole }) {
  return (
    <div>
      <PageHeading
        title="ERP AI 사용량"
        description="현재 Organization의 Trade OS 집계 사용량입니다. 멤버별 활동이나 프롬프트 본문은 표시하지 않습니다."
        action={
          <Button variant="outline">
            <RefreshCw /> 새로고침
          </Button>
        }
      />
      <SettingsSection
        title="구독별 사용량"
        description="2026.09.08 16:20 기준"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <UsageCard
            product="ECOYA Trade OS"
            plan="Pro"
            state="구독 중"
            used="684K"
            limit="1.2M"
            unit="tokens"
            reset="23일 후 갱신"
            percent={57}
          />
        </div>
        {role === "owner" ? (
          <div className="mt-5">
            <Button
              variant="outline"
              onClick={() =>
                window.location.assign("/erp/settings?section=billing")
              }
            >
              ERP 결제·구독 보기
            </Button>
          </div>
        ) : (
          <p className="mt-5 text-xs text-muted-foreground">
            구독 변경은 Organization OWNER가 할 수 있습니다.
          </p>
        )}
      </SettingsSection>
      <div className="mt-7">
        <CreditConversionPreview />
      </div>
    </div>
  )
}

function SnapSimplePage({
  type,
}: {
  type: "operations" | "branding" | "localization"
}) {
  const content =
    type === "operations"
      ? {
          title: "현장 운영",
          description: "SNAP 현장 업무의 기본 동작과 전달 채널을 설정합니다.",
        }
      : type === "branding"
        ? {
            title: "브랜딩",
            description:
              "승인 리포트에 사용하는 표시 이름과 로고를 설정합니다.",
          }
        : {
            title: "지역화",
            description:
              "SNAP 현장 화면과 리포트의 언어·시간대·표시 형식을 설정합니다.",
          }
  return (
    <div>
      <PageHeading
        title={content.title}
        description={content.description}
        action={<Badge variant="secondary">SNAP</Badge>}
      />
      <SettingsSection title="기본 설정">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={type === "localization" ? "기본 언어" : "표시 이름"}>
            <Input
              defaultValue={type === "localization" ? "한국어" : "ECOYA SNAP"}
            />
          </Field>
          <Field
            label={
              type === "operations"
                ? "전달 채널"
                : type === "branding"
                  ? "브랜드 색상"
                  : "시간대"
            }
          >
            <Input
              defaultValue={
                type === "operations"
                  ? "앱 링크 · 이메일"
                  : type === "branding"
                    ? "#0B3971"
                    : "Asia/Seoul"
              }
            />
          </Field>
        </div>
        <SaveRow />
      </SettingsSection>
    </div>
  )
}

function SnapDataPage() {
  const rows = [
    ["원본 현장 증거", "365"],
    ["승인 리포트", "1825"],
    ["공유 링크", "30"],
    ["아카이브 전환", "180"],
  ]
  return (
    <div>
      <PageHeading
        title="데이터 관리"
        description="SNAP 데이터 거주 지역, 저장 공간, 보존·파기와 조직 데이터 작업을 관리합니다."
        action={<Badge variant="secondary">SNAP</Badge>}
      />
      <div className="space-y-7">
        <SettingsSection title="데이터 저장">
          <div className="grid gap-4 sm:grid-cols-2">
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
            <div className="rounded-lg bg-muted/35 p-4">
              <div className="text-xs text-muted-foreground">
                조직 저장 공간
              </div>
              <div className="mt-1 text-xl font-semibold">18.4 GB / 100 GB</div>
            </div>
          </div>
        </SettingsSection>
        <SettingsSection
          title="보존 정책"
          description="기존 법적 보존 의무보다 짧게 변경할 수 없습니다."
          action={<Badge variant="outline">일 단위</Badge>}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <Field key={label} label={label}>
                <Input type="number" min="1" defaultValue={value} />
              </Field>
            ))}
          </div>
          <SaveRow label="데이터 정책 저장" />
        </SettingsSection>
        <SettingsSection
          title="조직 데이터 및 감사 이력"
          description="삭제 요청과 파기 실행은 감사 로그에 남습니다."
        >
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">
              <Download /> 조직 데이터 내보내기
            </Button>
            <Button variant="outline">감사 로그 보기</Button>
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}

function SnapUsagePage({ role }: { role: SettingsRole }) {
  return (
    <div>
      <PageHeading
        title="SNAP 크레딧·결제"
        description="현재 Organization의 SNAP 구독·체험별 사용량을 확인합니다."
        action={
          <Button variant="outline">
            <RefreshCw /> 새로고침
          </Button>
        }
      />
      <SettingsSection
        title="구독별 사용량"
        description="사용량 조회 실패를 무료 또는 0으로 표시하지 않습니다."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <TrialSchedulePreview />
          <UsageCard
            product="SNAP 리포트 보관"
            plan="포함 저장량"
            state="구독 중"
            used="18.4"
            limit="100"
            unit="GB"
            reset="매월 갱신"
            percent={18.4}
          />
        </div>
        {role === "owner" ? (
          <div className="mt-5">
            <BillingPreviewActions product="snap" />
          </div>
        ) : null}
      </SettingsSection>
      <div className="mt-7">
        <CreditConversionPreview />
      </div>
    </div>
  )
}

function renderSection(
  section: SectionId,
  role: SettingsRole,
  products: readonly ProductEntitlement[]
) {
  if (section === "account") return <AccountPage />
  if (section === "organization")
    return (
      <div className="space-y-10">
        <OrganizationPage role={role} />
        {products.includes("erp") && (
          <>
            <TradeDefaultsPage role={role} />
            {role !== "member" && <MembersPage role={role} />}
          </>
        )}
        {products.includes("snap") && (
          <SettingsSection
            title="SNAP 조직·멤버"
            description="SNAP 역할, 가입 승인과 좌석은 SNAP 제품 정책을 따릅니다."
          >
            <Button
              variant="outline"
              onClick={() => window.location.assign("/workers")}
            >
              SNAP 멤버 관리
            </Button>
          </SettingsSection>
        )}
      </div>
    )
  if (section === "billing")
    return role === "owner" ? (
      <BillingPage />
    ) : (
      <div role="status">
        <PageHeading
          title="ERP 결제·구독"
          description="결제 관리 권한이 없습니다. 조직 소유자에게 문의하세요."
        />
      </div>
    )
  if (section === "trade-email") return <EmailPage />
  if (section === "trade-counterparty-import")
    return <ImportPage kind="counterparty" />
  if (section === "trade-deal-import") return <ImportPage kind="deal" />
  if (section === "trade-aliases") return <AliasesPage />
  if (section === "trade-alerts") return <AlertsPage />
  if (section === "trade-usage") return <TradeUsagePage role={role} />
  if (section === "snap-operations") return <SnapSimplePage type="operations" />
  if (section === "snap-branding") return <SnapSimplePage type="branding" />
  if (section === "snap-localization")
    return <SnapSimplePage type="localization" />
  if (section === "snap-data") return <SnapDataPage />
  if (section === "snap-usage") return <SnapUsagePage role={role} />
  return <AccountPage />
}

export function SettingsHubV2({
  onNavigate,
  onLogout,
  workspaceId,
  onWorkspaceChange,
  availableProducts = ["erp", "snap"],
  role = "owner",
}: {
  onNavigate: (target: SettingsTarget) => void
  onLogout: () => void
  workspaceId: WorkspaceKey
  onWorkspaceChange: (workspaceId: WorkspaceKey) => void
  availableProducts?: readonly ProductEntitlement[]
  role?: SettingsRole
}) {
  const { isMobile, setOpenMobile, state: sidebarState } = useSidebar()
  const groups = useMemo(
    () =>
      navigation
        .map((group) => ({
          ...group,
          items: group.items.filter(
            (item) =>
              (!item.product || availableProducts.includes(item.product)) &&
              (!item.roles || item.roles.includes(role))
          ),
        }))
        .filter((group) => group.items.length > 0),
    [availableProducts, role]
  )
  const availableIds = useMemo(
    () => groups.flatMap((group) => group.items.map((item) => item.id)),
    [groups]
  )
  const initialSection = (() => {
    if (typeof window === "undefined") return "account" as SectionId
    const candidate = new URLSearchParams(window.location.search).get(
      "section"
    ) as SectionId | null
    return candidate && availableIds.includes(candidate) ? candidate : "account"
  })()
  const [section, setSection] = useState<SectionId>(initialSection)
  const [query, setQuery] = useState("")
  const effectiveSection = availableIds.includes(section) ? section : "account"
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        [item.label, group.label, ...(item.keywords ?? [])]
          .join(" ")
          .toLowerCase()
          .includes(query.trim().toLowerCase())
      ),
    }))
    .filter((group) => group.items.length > 0)

  const selectSection = (next: SectionId) => {
    if (!availableIds.includes(next)) return
    setSection(next)
    const url = new URL(window.location.href)
    url.searchParams.set("section", next)
    window.history.pushState({ section: next }, "", url)
    if (isMobile) setOpenMobile(false)
  }

  useEffect(() => {
    const handlePopState = () => {
      const candidate = new URLSearchParams(window.location.search).get(
        "section"
      ) as SectionId | null
      setSection(
        candidate && availableIds.includes(candidate) ? candidate : "account"
      )
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [availableIds])

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 bg-[var(--surface-muted-background)]">
      <Sidebar
        collapsible="icon"
        className="settings-navigation top-0 h-svh! bg-background md:z-50"
      >
        <SidebarGroup className="border-b p-3">
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
              className="pl-9"
              placeholder="설정 검색..."
              aria-label="설정 검색"
            />
          </div>
        </SidebarGroup>
        <SidebarContent>
          <nav aria-label="설정 메뉴">
            {visibleGroups.map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const Icon = item.icon
                      return (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            isActive={effectiveSection === item.id}
                            tooltip={item.label}
                            onClick={() => selectSection(item.id)}
                            aria-current={
                              effectiveSection === item.id ? "page" : undefined
                            }
                            className="text-sidebar-foreground/75 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 data-active:text-primary"
                          >
                            <Icon />
                            <span className="group-data-[collapsible=icon]:hidden">
                              {item.label}
                            </span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
            {visibleGroups.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                일치하는 설정이 없습니다.
              </p>
            ) : null}
          </nav>
        </SidebarContent>
        <SidebarFooter className="border-t p-3">
          <SidebarMenu>
            <SidebarProfileMenu
              onSettings={() => selectSection("account")}
              onLogout={onLogout}
            />
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-h-0 min-w-0 overflow-hidden bg-[var(--surface-muted-background)] md:pt-(--header-height)">
        <div className="h-full min-h-0 overflow-y-auto">
          <main className="w-full px-5 py-7 sm:px-7 xl:px-10 xl:py-9">
            <div key={`${workspaceId}:${effectiveSection}`}>
              {renderSection(effectiveSection, role, availableProducts)}
            </div>
          </main>
        </div>
      </SidebarInset>
    </div>
  )
}

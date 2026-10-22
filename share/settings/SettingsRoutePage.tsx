import { AccountWithdrawal, WithdrawalResultSurface } from "./account-withdrawal"
import { NavigationIcon } from "@shared/components/navigation-icon"
import { ColorPicker } from "@shared/components/color-picker"
import { createWithdrawalPreview, withdrawalScenario, type WithdrawalGateway, type WithdrawalResult } from "./withdrawal-data"
import { PageHeading, SettingsSection } from "./settings-layout"
import { EmailLimits } from "./email-limits"
import { emailLimitsPreview, type EmailLimitsLoader } from "./email-limits-data"
import { resolveImportPermissions, type ImportPermissions } from "./import-permissions"
import { ApprovalPolicySettings } from "./legacy"
import { AliasesPage } from "./CounterpartyAliasSettingsView"
import { appLocation } from "@/app/app-location"
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
  Search,
  SlidersHorizontal,
  Sparkles,
  Upload,
  ExternalLink,
} from "lucide-react"

import { WorkspaceSwitcher } from "@shared/components/workspace-switcher"
import { Badge } from "@shared/components/ui/badge"
import { Button } from "@shared/components/ui/button"
import { Card, CardContent } from "@shared/components/ui/card"
import { Checkbox } from "@shared/components/ui/checkbox"
import { Input } from "@shared/components/ui/input"
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
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@shared/components/ui/sidebar"
import {
  OrganizationMembers,
  ProductsSubscriptions,
  SettingsDemoProvider,
  useSettingsDemoPresent,
} from "./subscription-settings"
import { OrganizationAiUsage } from "./organization-ai-usage"
import { BrandLogoInput } from "./brand-logo-input"
import { SearchableSetting, countryOptions, languageOptions, timeZoneOptions } from "./region-controls"
import { workspaceOptions, type WorkspaceKey } from "@shared/lib/workspaces"

export type ProductEntitlement = "erp" | "snap"
export type SettingsRole = "owner" | "admin" | "member"
export type SubscriptionDisplayStatus = "trial_not_started" | "trial_active" | "trial_expired" | "paid_active" | "cancel_scheduled" | "payment_pending" | "payment_verifying" | "read_only"
type SettingsTarget = "home" | "tokens" | "billing"

type SectionId =
  | "account"
  | "trade-usage"
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
  | "approvals"
  | "snap-operations"
  | "snap-branding"
  | "snap-localization"
  | "snap-data"
  | "snap-usage"

type NavItem = {
  id: SectionId
  label: string
  icon: typeof CircleUserRound
  /** Same Figma glyph as the main sidebar / profile menu, when one exists. */
  navIcon?: Parameters<typeof NavigationIcon>[0]["name"]
  product?: ProductEntitlement
  roles?: readonly SettingsRole[]
  permission?: keyof ImportPermissions
  keywords?: readonly string[]
}

// Common SSOT 02-COMMON-IA: headings are non-interactive, menus one level deep.
const navigation: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "일반",
    items: [
      { id: "account", label: "내 계정", icon: CircleUserRound },
      { id: "organizations", label: "소속 Organization", icon: Building2 },
    ],
  },
  {
    label: "조직",
    items: [
      {
        id: "organization",
        label: "조직 정보",
        icon: Building2,
        keywords: ["회사", "사업자"],
      },
      {
        id: "members",
        label: "사용자 관리",
        icon: CircleUserRound,
        roles: ["owner", "admin"],
      },
      { id: "products", label: "제품 및 구독", icon: CreditCard },
      { id: "billing", label: "빌링", icon: ExternalLink, navIcon: "billing", roles: ["owner"] },
    ],
  },
  {
    label: "Trade OS",
    items: [
      {
        id: "trade-defaults",
        label: "업무 기본 설정",
        icon: SlidersHorizontal,
        product: "erp",
      },
      {
        id: "trade-email",
        label: "이메일로 문서 받기",
        icon: Mail,
        product: "erp",
      },
      {
        id: "trade-counterparty-import",
        label: "거래처 일괄 등록",
        permission: "canImportCounterparties",
        icon: FileSpreadsheet,
        product: "erp",
      },
      {
        id: "trade-deal-import",
        label: "거래 일괄 등록",
        permission: "canImportDeals",
        icon: Upload,
        navIcon: "upload",
        product: "erp",
      },
      {
        id: "trade-aliases",
        label: "거래처 별칭 학습",
        icon: Landmark,
        product: "erp",
      },
      { id: "trade-alerts", label: "알림 설정", icon: Bell, navIcon: "notification", product: "erp" },
      { id: "trade-usage", label: "AI 사용량", icon: Sparkles, navIcon: "usage", product: "erp", keywords: ["토큰", "사용량"] },
      { id: "approvals", label: "결재 정책", icon: Check, product: "erp", roles: ["owner"] },
    ],
  },
  {
    label: "SNAP",
    items: [
      {
        id: "snap-operations",
        label: "현장 운영",
        icon: SlidersHorizontal,
        product: "snap",
      },
      { id: "snap-branding", label: "브랜딩", icon: Palette, product: "snap" },
      {
        id: "snap-localization",
        label: "지역화",
        icon: Globe2,
        navIcon: "language",
        product: "snap",
      },
      {
        id: "snap-data",
        label: "데이터 및 보존",
        icon: Database,
        product: "snap",
      },
      {
        id: "snap-usage",
        label: "사용량 및 기술 한도",
        icon: Sparkles,
        navIcon: "usage",
        product: "snap",
      },
    ],
  },
]

/** Header location trail: label of a settings section id, if it exists. */
export function settingsSectionLabel(id: string | null): string | undefined {
  for (const group of navigation) {
    const item = group.items.find((entry) => entry.id === id)
    if (item) return item.label
  }
  return undefined
}

function SettingRow({
  label,
  description,
  children,
  inlineControl = false,
}: {
  label: string
  description?: string
  children: ReactNode
  inlineControl?: boolean
}) {
  return (
    <div className={`grid gap-3 border-b py-4 first:pt-0 last:border-b-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_minmax(220px,320px)] md:items-center md:gap-8 ${inlineControl ? "grid-cols-[minmax(0,1fr)_auto] items-center" : ""}`}>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description ? <p className="mt-1 text-xs leading-5 text-muted-foreground break-keep [overflow-wrap:anywhere]">{description}</p> : null}
      </div>
      <div className="min-w-0 md:justify-self-end md:w-full">{children}</div>
    </div>
  )
}

function SaveRow({ label = "변경사항 저장" }: { label?: string }) {
  const [saved, setSaved] = useState(false)
  return (
    <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t pt-5">
      <Button onClick={() => setSaved(true)}>{label}</Button>
      {saved ? (
        <span className="flex items-center gap-1 text-xs text-emerald-700">
          <Check className="size-3.5" /> 저장했습니다.
        </span>
      ) : null}
    </div>
  )
}

function BrandColorPicker({
  label,
  initialColor,
  disabled = false,
}: {
  label: string
  initialColor: string
  disabled?: boolean
}) {
  const [color, setColor] = useState(initialColor)
  const pickerColor = /^#[0-9a-fA-F]{6}$/.test(color) ? color : initialColor
  return (
    <div className="flex items-center gap-2">
        <ColorPicker
          label={`${label} 선택`}
          value={pickerColor}
          disabled={disabled}
          onChange={setColor}
        />
        <Input
          aria-label={`${label} 코드`}
          value={color}
          readOnly={disabled}
          onChange={(event) => setColor(event.target.value)}
        />
    </div>
  )
}

function AccountPage({ withdrawal, onOrganizations, onResult }: {
  withdrawal: WithdrawalGateway
  onOrganizations: () => void
  onResult: (result: WithdrawalResult) => void
}) {
  const [withdrawing, setWithdrawing] = useState(false)
  if (withdrawing) return <AccountWithdrawal gateway={withdrawal} onCancel={() => setWithdrawing(false)} onOrganizations={onOrganizations} onResult={onResult} />
  return (
    <div>
      <PageHeading
        title="내 계정"
        description="내 계정 정보와 로그인 보안을 확인합니다."
      />
      <div className="space-y-7">
        <SettingsSection title="내 계정">
          <div>
            <SettingRow label="이름"><Input aria-label="이름" defaultValue={withdrawal.identity.name} readOnly /></SettingRow>
            <SettingRow label="로그인 이메일"><Input aria-label="로그인 이메일" defaultValue={withdrawal.identity.email} readOnly /></SettingRow>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            업무 시간대와 기본 언어는 각 제품의 조직 설정에서 관리합니다.
          </p>
        </SettingsSection>
        <SettingsSection title="로그인 보안">
          <SettingRow label="비밀번호" description="로그인 비밀번호를 변경합니다." inlineControl>
            <div className="flex justify-end"><Button
              variant="outline"
              onClick={() => appLocation.assign("/password-recovery")}
            >비밀번호 변경</Button></div>
          </SettingRow>
        </SettingsSection>
        <SettingsSection title="계정 탈퇴">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="min-w-0 flex-1 text-sm leading-6 text-muted-foreground">소속 조직을 확인한 뒤 계정 탈퇴를 진행합니다.<br />완료 후에는 계정을 복구할 수 없습니다.</p>
            <Button variant="outline" className="ml-auto text-destructive" onClick={() => setWithdrawing(true)}>계정 탈퇴</Button>
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}

function OrganizationField({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-2 [&_[role=combobox]]:h-10">
      {htmlFor ? <label htmlFor={htmlFor} className="block text-sm font-medium">{label}</label> : <p className="text-sm font-medium">{label}</p>}
      {children}
    </div>
  )
}

function OrganizationPage({ role, products }: { role: SettingsRole; products: readonly ProductEntitlement[] }) {
  const editable = role === "owner"
  const [country, setCountry] = useState("KR")
  const [locale, setLocale] = useState("ko-KR")
  const [timezone, setTimezone] = useState("Asia/Seoul")
  const [saveError, setSaveError] = useState("")
  const locales = products.includes("erp") ? languageOptions : languageOptions.filter(option => ["ko-KR", "en-US", "ja-JP"].includes(option.value))
  const regionLabel = country === "KR" ? "시·도" : country === "JP" ? "도도부현" : "주·지역"
  const cityLabel = country === "KR" ? "시·군·구" : "도시"
  return (
    <div>
      <PageHeading title="조직 정보" description="현재 조직의 기본 정보와 주소, 언어를 관리합니다." />
      <form onSubmit={event => { event.preventDefault(); if (editable) setSaveError("조직 정보를 저장할 수 없습니다. 잠시 후 다시 시도해 주세요. 입력한 내용은 유지됩니다.") }} className="space-y-6">
        <section aria-labelledby="organization-basics" className="space-y-3">
          <h2 id="organization-basics" className="text-base font-semibold">기본 정보</h2>
          <Card className="shadow-none">
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <OrganizationField label="법정 이름" htmlFor="organization-legal-name"><Input id="organization-legal-name" data-guide-target="organization" aria-label="법정 이름" autoComplete="organization" defaultValue="Hanbit Trading Co., Ltd." readOnly={!editable} /></OrganizationField>
                <OrganizationField label="표시 이름" htmlFor="organization-display-name"><Input id="organization-display-name" aria-label="표시 이름" defaultValue="한빛무역" readOnly={!editable} /></OrganizationField>
                <OrganizationField label="사업자·세무 식별값" htmlFor="organization-tax-id"><Input id="organization-tax-id" aria-label="사업자·세무 식별값" defaultValue="120-88-260708" readOnly={!editable} /></OrganizationField>
                <OrganizationField label="대표 연락처" htmlFor="organization-phone"><Input id="organization-phone" aria-label="대표 연락처" type="tel" autoComplete="tel" defaultValue="+82 2 2607 0801" readOnly={!editable} /></OrganizationField>
                <div className="sm:col-span-2">
                  <OrganizationField label="대표 이메일" htmlFor="organization-email"><Input id="organization-email" aria-label="대표 이메일" type="email" autoComplete="email" defaultValue="trade@hanbit.example" readOnly={!editable} /></OrganizationField>
                </div>
              </div>
              <div role="group" aria-labelledby="organization-address" className="space-y-4 border-t pt-5">
                <h3 id="organization-address" className="text-sm font-semibold">주소</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <OrganizationField label="국가·지역">
                    <SearchableSetting label="국가·지역" value={country} options={countryOptions} onChange={setCountry} disabled={!editable} />
                  </OrganizationField>
                  <OrganizationField label="우편번호" htmlFor="organization-postal-code"><Input id="organization-postal-code" aria-label="우편번호" autoComplete="postal-code" placeholder={country === "US" ? "예: 10001" : country === "JP" ? "예: 100-0001" : "우편번호"} readOnly={!editable} /></OrganizationField>
                  <OrganizationField label={regionLabel} htmlFor="organization-state"><Input id="organization-state" aria-label={regionLabel} autoComplete="address-level1" defaultValue="서울특별시" readOnly={!editable} /></OrganizationField>
                  <OrganizationField label={cityLabel} htmlFor="organization-city"><Input id="organization-city" aria-label={cityLabel} autoComplete="address-level2" defaultValue="중구" readOnly={!editable} /></OrganizationField>
                  <OrganizationField label="기본 주소" htmlFor="organization-address-line1"><Input id="organization-address-line1" aria-label="기본 주소" autoComplete="address-line1" placeholder="도로명, 건물 번호" readOnly={!editable} /></OrganizationField>
                  <OrganizationField label="상세 주소 (선택)" htmlFor="organization-address-line2"><Input id="organization-address-line2" aria-label="상세 주소" autoComplete="address-line2" placeholder="동, 층, 호수" readOnly={!editable} /></OrganizationField>
                </div>
                {country !== "KR" ? <p role="status" className="text-xs text-muted-foreground">국가를 변경했습니다. 기존 주소와 우편번호가 새 국가에 맞는지 확인해 주세요.</p> : null}
              </div>
              <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
                <OrganizationField label="기본 언어">
                  <SearchableSetting label="기본 언어" value={locale} options={locales} onChange={setLocale} disabled={!editable} />
                </OrganizationField>
                <OrganizationField label="기본 시간대">
                  <SearchableSetting label="기본 시간대" value={timezone} options={timeZoneOptions} onChange={setTimezone} disabled={!editable} />
                </OrganizationField>
              </div>
            </CardContent>
          </Card>
        </section>
        {editable ? <div className="flex flex-wrap items-center justify-end gap-3">
          {saveError ? <p role="alert" className="w-full text-sm text-destructive">{saveError}</p> : null}
          <Button type="submit">조직 정보 저장</Button>
        </div> : <p className="text-xs text-muted-foreground">조직 정보 변경은 Organization OWNER에게 요청하세요.</p>}
      </form>
    </div>
  )
}

function TradeDefaultsPage({ role }: { role: SettingsRole }) {
  const editable = role !== "member"
  const [brandingRevision, setBrandingRevision] = useState(0)
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
          <div>
            <SettingRow label="문서 표시 이름"><Input aria-label="문서 표시 이름" defaultValue="ECOYA Demo Co." readOnly={!editable} /></SettingRow>
            <SettingRow label="승인 색상"><BrandColorPicker label="승인 색상" initialColor="#0B3971" disabled={!editable} /></SettingRow>
            <SettingRow label="법적 footer"><Input aria-label="법적 footer" defaultValue="ECOYA Trade OS generated document" readOnly={!editable} /></SettingRow>
            <SettingRow label="승인 로고"><BrandLogoInput disabled={!editable} onChange={() => setBrandingRevision((value) => value + 1)} /></SettingRow>
          </div>
          {editable ? <SaveRow key={brandingRevision} label="브랜딩 저장" /> : null}
        </SettingsSection>
        <SettingsSection
          title="업무용 지급 정보"
          description="계좌 원문은 표시하지 않으며 변경에는 재인증이 필요합니다."
        >
          <div>
            <SettingRow label="은행·계좌 명의"><p className="text-sm font-medium md:text-right">DBS Bank · ECOYA Demo Co.</p></SettingRow>
            <SettingRow label="통화·계좌"><p className="text-sm font-medium md:text-right">USD · •••• 0708</p></SettingRow>
            <SettingRow label="지급 정보 변경" description="변경하려면 다시 인증해야 합니다." inlineControl>
              <div className="flex justify-end"><Button variant="outline" disabled={!editable}>재인증 후 변경</Button></div>
            </SettingRow>
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}

function EmailPage({ loadLimits }: { loadLimits: EmailLimitsLoader }) {
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
        <SettingRow label="수신 주소" description="실제 주소는 로그와 캡처에서 마스킹됩니다.">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <code className="min-w-0 truncate text-sm">hanbit-••••@inbound.ecoya.app</code>
            <Button variant="outline" onClick={() => setCopied(true)}><Copy /> 주소 복사</Button>
          </div>
        </SettingRow>
        <EmailLimits loadLimits={loadLimits} />
        {copied ? (
          <p className="mt-3 text-right text-xs text-emerald-700">주소를 복사했습니다.</p>
        ) : null}
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
        title="Trade OS 알림 설정"
        description="Trade OS 업무 알림의 종류와 수신 채널을 설정합니다. SNAP 알림에는 적용되지 않습니다."
      />
      <div className="space-y-7">
        <SettingsSection
          title="수신 채널"
          description="채널 설정은 실제 알림 생성·전달·읽음 상태와 별개입니다."
        >
          <div>
            {[
              ["app", "앱 알림"],
              ["email", "이메일"],
            ].map(([id, label]) => (
              <SettingRow key={id} label={label} inlineControl>
                <div className="flex justify-end">
                <Checkbox
                  aria-label={label}
                  checked={channels[id as keyof typeof channels]}
                  onCheckedChange={(checked) =>
                    setChannels((value) => ({
                      ...value,
                      [id]: checked === true,
                    }))
                  }
                />
                </div>
              </SettingRow>
            ))}
          </div>
        </SettingsSection>
        <SettingsSection
          title="알림 종류"
          description="현재 Organization · Trade OS · Asia/Seoul 기준"
        >
          <div>
            {[
              ["approval", "승인 요청·반려"],
              ["document", "문서 분석·처리 실패"],
              ["risk", "거래 위험·불일치"],
              ["settlement", "정산 기한·입출금"],
            ].map(([id, label]) => (
              <SettingRow key={id} label={label} inlineControl>
                <div className="flex justify-end">
                <Checkbox
                  aria-label={label}
                  checked={rules[id as keyof typeof rules]}
                  onCheckedChange={(checked) =>
                    setRules((value) => ({ ...value, [id]: checked === true }))
                  }
                />
                </div>
              </SettingRow>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t pt-5">
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

function SnapSimplePage({
  type,
  role,
}: {
  type: "operations" | "branding" | "localization"
  role: SettingsRole
}) {
  const [channels, setChannels] = useState({ app: true, email: true })
  const [channelError, setChannelError] = useState("")
  const [locale, setLocale] = useState("ko-KR")
  const [timezone, setTimezone] = useState("Asia/Seoul")
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
        <div>
          <SettingRow label={type === "localization" ? "기본 언어" : "표시 이름"}>
            {type === "localization" ? <SearchableSetting label="기본 언어" value={locale} options={languageOptions.filter(option => ["ko-KR", "en-US", "ja-JP"].includes(option.value))} onChange={setLocale} disabled={role === "member"} /> : <Input aria-label="표시 이름" defaultValue="ECOYA SNAP" readOnly={role === "member"} />}
          </SettingRow>
          {type === "branding" ? (
            <SettingRow label="브랜드 색상"><BrandColorPicker label="브랜드 색상" initialColor="#0B3971" disabled={role === "member"} /></SettingRow>
          ) : type === "operations" ? (
            <SettingRow label="전달 채널" description="업무 결과를 전달할 채널을 선택하세요.">
              <div role="group" aria-label="전달 채널" className="flex flex-wrap gap-x-6 gap-y-3 md:justify-end">
                {([["app", "앱 링크"], ["email", "이메일"]] as const).map(([key, label]) => <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox aria-label={label} disabled={role === "member"} checked={channels[key]} onCheckedChange={checked => { setChannels(current => ({ ...current, [key]: checked === true })); setChannelError("") }} />{label}
                </label>)}
              </div>
            </SettingRow>
          ) : (
            <SettingRow label="시간대"><SearchableSetting label="시간대" value={timezone} options={timeZoneOptions} onChange={setTimezone} disabled={role === "member"} /></SettingRow>
          )}
        </div>
        {type !== "branding" ? role !== "member" ? <div className="mt-5 flex flex-wrap justify-end gap-3 border-t pt-5">
          {channelError ? <p role="alert" className="w-full text-sm text-destructive">{channelError}</p> : null}
          <Button onClick={() => setChannelError(type === "operations" ? "전달 설정을 저장할 수 없습니다. 잠시 후 다시 시도해 주세요. 선택한 채널은 유지됩니다." : "지역화 설정을 저장할 수 없습니다. 잠시 후 다시 시도해 주세요. 선택한 언어와 시간대는 유지됩니다.")}>변경사항 저장</Button>
        </div> : <p className="mt-5 text-xs text-muted-foreground">설정 변경은 관리자에게 요청하세요.</p> : <SaveRow />}
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
        title="데이터 및 보존"
        description="SNAP 데이터 거주 지역, 저장 공간, 보존·파기와 조직 데이터 작업을 관리합니다."
        action={<Badge variant="secondary">SNAP</Badge>}
      />
      <div className="space-y-7">
        <SettingsSection title="데이터 저장">
          <div>
            <SettingRow label="데이터 거주 지역">
              <Select defaultValue="kr">
                <SelectTrigger aria-label="데이터 거주 지역" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kr">대한민국</SelectItem>
                  <SelectItem value="sg">싱가포르</SelectItem>
                  <SelectItem value="eu">유럽 연합</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
            <SettingRow label="조직 저장 공간"><p className="text-sm text-muted-foreground md:text-right">실시간 저장량 조회가 연결되지 않았습니다.</p></SettingRow>
          </div>
        </SettingsSection>
        <SettingsSection
          title="보존 정책"
          description="기존 법적 보존 의무보다 짧게 변경할 수 없습니다."
          action={<Badge variant="outline">일 단위</Badge>}
        >
          <div>
            {rows.map(([label, value]) => (
              <SettingRow key={label} label={label}><Input aria-label={label} type="number" min="1" defaultValue={value} /></SettingRow>
            ))}
          </div>
          <SaveRow label="데이터 정책 저장" />
        </SettingsSection>
        <SettingsSection
          title="조직 데이터 및 감사 이력"
          description="삭제 요청과 파기 실행은 감사 로그에 남습니다."
        >
          <div className="flex flex-wrap justify-end gap-2">
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
  // Display fixtures only. Technical limits remain server-owned and nonbilling.
  const usageExamples = [
    { label: "저장 공간", description: "사진·영상·문서의 저장 용량", used: 50, limit: 100, unit: "GB" },
    { label: "AI 처리 요청", description: "이번 달 누적 요청", used: 500, limit: 1000, unit: "회" },
    { label: "요청 속도", description: "최근 1분간 요청", used: 30, limit: 60, unit: "회/분" },
  ]
  return (
    <div>
      <PageHeading
        title="사용량 및 기술 한도"
        description="저장량·AI·속도 제한은 결제 잔액이 아닌 비과금 기술 한도입니다."
      />
      <SettingsSection title="현재 사용량">
        <dl className="divide-y">
          {usageExamples.map(({ label, description, used, limit, unit }) => {
            const percentage = Math.round((used / limit) * 100)
            return (
              <div key={label} className="grid gap-4 py-6 first:pt-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:items-center sm:gap-10">
                <dt>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                </dt>
                <dd className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <span className="tabular-nums">
                      <strong className="font-semibold">{used.toLocaleString("ko-KR")}</strong>
                      <span className="text-muted-foreground"> / {limit.toLocaleString("ko-KR")} {unit}</span>
                    </span>
                    <span className="font-medium tabular-nums">{percentage}% 사용</span>
                  </div>
                  <Progress
                    value={percentage}
                    aria-label={`${label} 사용량`}
                    aria-valuenow={percentage}
                    aria-valuetext={`${percentage}% 사용`}
                    className="h-1.5 [&_[data-slot=progress-indicator]]:bg-primary"
                  />
                </dd>
              </div>
            )
          })}
        </dl>
        {role === "owner" ? (
          <Button
            className="mt-5 ml-auto flex"
            variant="outline"
            onClick={() => appLocation.assign("/erp/settings?section=products")}
          >
            제품 및 구독 보기
          </Button>
        ) : null}
      </SettingsSection>
    </div>
  )
}

function renderSection(
  section: SectionId,
  role: SettingsRole,
  products: readonly ProductEntitlement[],
  subscriptionKind: "separate" | "bundle",
  subscriptionStates: Partial<Record<"erp" | "snap" | "bundle", SubscriptionDisplayStatus>>,
  organizationName: string,
  importPermissions: ImportPermissions,
  loadEmailLimits: EmailLimitsLoader,
  withdrawal: WithdrawalGateway,
  onOrganizations: () => void,
  onWithdrawalResult: (result: WithdrawalResult) => void
) {
  const importSection = section === "trade-counterparty-import" || section === "trade-deal-import"
  const importAllowed = section === "trade-counterparty-import" ? importPermissions.canImportCounterparties : importPermissions.canImportDeals
  if ((importSection && (!importAllowed || !products.includes("erp"))) ||
      (section === "approvals" && (role !== "owner" || !products.includes("erp")))) {
    const title = section === "approvals" ? "결재 정책" : section === "trade-counterparty-import" ? "거래처 일괄 등록" : "거래 일괄 등록"
    return <div role="alert" className="space-y-3 py-8">
      <h1 className="text-xl font-semibold">{title}에 접근할 수 없습니다.</h1>
      <p className="text-sm text-muted-foreground">{section === "approvals"
        ? "현재 조직의 Trade OS를 이용하는 조직 소유자만 결재 정책을 관리할 수 있습니다."
        : "현재 조직의 Trade OS 파일 등록 권한이 필요합니다."}</p>
    </div>
  }
  if (section === "approvals") return <ApprovalPolicySettings />
  if (section === "account") return <AccountPage withdrawal={withdrawal} onOrganizations={onOrganizations} onResult={onWithdrawalResult} />
  if (section === "trade-usage") return <OrganizationAiUsage organizationName={organizationName} />
  if (section === "organizations")
    return (
      <div>
        <PageHeading
          title="소속 Organization"
          description="현재 소속과 선택한 조직을 확인합니다."
        />
        <SettingsSection title="현재 조직">
          <SettingRow label="조직 이름"><p className="text-sm font-medium md:text-right">ECOYA Demo Co.</p></SettingRow>
        </SettingsSection>
      </div>
    )
  if (section === "organization") return <OrganizationPage role={role} products={products} />
  if (section === "trade-defaults") return <TradeDefaultsPage role={role} />
  if (section === "members")
    return <OrganizationMembers role={role} products={products} />
  if (section === "products" || section === "billing")
    return (
      <ProductsSubscriptions
        organizationName={organizationName}
        role={role}
        products={products}
        subscriptionKind={subscriptionKind}
        subscriptionStates={subscriptionStates}
        planInitiallyOpen={
          new URLSearchParams(appLocation.search).get("plan") === "1" &&
          role !== "member"
        }
      />
    )
  if (section === "trade-email") return <EmailPage loadLimits={loadEmailLimits} />
  if (section === "trade-counterparty-import")
    return <ImportPage kind="counterparty" />
  if (section === "trade-deal-import") return <ImportPage kind="deal" />
  if (section === "trade-aliases") return <AliasesPage role={role} />
  if (section === "trade-alerts") return <AlertsPage />
  if (section === "snap-operations") return <SnapSimplePage type="operations" role={role} />
  if (section === "snap-branding") return <SnapSimplePage type="branding" role={role} />
  if (section === "snap-localization")
    return <SnapSimplePage type="localization" role={role} />
  if (section === "snap-data") return <SnapDataPage />
  if (section === "snap-usage") return <SnapUsagePage role={role} />
  return <AccountPage withdrawal={withdrawal} onOrganizations={onOrganizations} onResult={onWithdrawalResult} />
}

function SettingsHubContent({
  onNavigate,
  workspaceId,
  onWorkspaceChange,
  availableProducts = ["erp", "snap"],
  role = "owner",
  subscriptionKind = "separate",
  subscriptionStates = {},
  permissions,
  loadEmailLimits = emailLimitsPreview,
  withdrawalGateway,
}: {
  onNavigate: (target: SettingsTarget) => void
  onLogout?: () => void
  workspaceId: WorkspaceKey
  onWorkspaceChange: (workspaceId: WorkspaceKey) => void
  availableProducts?: readonly ProductEntitlement[]
  role?: SettingsRole
  permissions?: Partial<ImportPermissions>
  loadEmailLimits?: EmailLimitsLoader
  withdrawalGateway?: WithdrawalGateway
  subscriptionKind?: "separate" | "bundle"
  subscriptionStates?: Partial<Record<"erp" | "snap" | "bundle", SubscriptionDisplayStatus>>
}) {
  const { isMobile, setOpenMobile, state: sidebarState, toggleSidebar } = useSidebar()
  const withdrawal = useMemo(() => withdrawalGateway ?? createWithdrawalPreview(withdrawalScenario(appLocation.search), role === "owner" ? "OWNER" : role === "admin" ? "ADMIN" : "MEMBER"), [withdrawalGateway, role])
  const [withdrawalResult, setWithdrawalResult] = useState<WithdrawalResult | null>(null)
  const importPermissions = useMemo(() => resolveImportPermissions(role, permissions), [role, permissions])
  const groups = useMemo(
    () =>
      navigation
        .map((group) => ({
          ...group,
          items: group.items.filter(
            (item) =>
              (!item.product || availableProducts.includes(item.product)) &&
              (!item.roles || item.roles.includes(role)) &&
              (!item.permission || importPermissions[item.permission])
          ),
        }))
        .filter((group) => group.items.length > 0),
    [availableProducts, role, importPermissions]
  )
  const availableIds = useMemo(
    () => groups.flatMap((group) => group.items.map((item) => item.id)),
    [groups]
  )
  const initialSection = (() => {
    if (typeof window === "undefined") return "account" as SectionId
    const requested = new URLSearchParams(appLocation.search).get("section")
    const candidate = (requested === "credits" ? "trade-usage" : requested) as SectionId | null
    return candidate === "billing"
      ? "products"
      : candidate && (["approvals", "trade-counterparty-import", "trade-deal-import"].includes(candidate) || availableIds.includes(candidate))
        ? candidate
        : "account"
  })()
  const [section, setSection] = useState<SectionId>(initialSection)
  const [query, setQuery] = useState("")
  const [portalError, setPortalError] = useState(false)
  const openBillingPortal = () => {
    if (role !== "owner") return
    // No server session issuer is configured in this UI prototype. Never open a static portal URL.
    setPortalError(true)
  }
  const effectiveSection = ["approvals", "trade-counterparty-import", "trade-deal-import"].includes(section) || availableIds.includes(section) ? section : "account"
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
    const url = new URL(appLocation.href)
    url.searchParams.set("section", next)
    window.history.pushState({ section: next }, "", url)
    window.dispatchEvent(new Event("settings-section-change"))
    if (isMobile) setOpenMobile(false)
  }

  useEffect(() => {
    const handlePopState = () => {
      const requested = new URLSearchParams(appLocation.search).get("section")
      const candidate = (requested === "credits" ? "trade-usage" : requested) as SectionId | null
      setSection(
        candidate === "billing"
          ? "products"
          : candidate && (["approvals", "trade-counterparty-import", "trade-deal-import"].includes(candidate) || availableIds.includes(candidate))
            ? candidate
            : "account"
      )
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [availableIds])

  if (withdrawalResult) return <WithdrawalResultSurface result={withdrawalResult} />

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 bg-transparent">
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
            {/* Same toggle as the main Trade OS sidebar (gray slide icon). */}
            <Button
              variant="ghost"
              onClick={toggleSidebar}
              aria-label={
                sidebarState === "collapsed"
                  ? "사이드바 펼치기"
                  : "사이드바 접기"
              }
              className="navigation-toggle ml-auto size-8 shrink-0 p-0 text-[var(--surface-foreground)] group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:mx-auto"
            >
              <NavigationIcon name="slide" className="scale-75 group-data-[collapsible=icon]:scale-100" />
            </Button>
          </div>
          <div className="mt-3">
            <WorkspaceSwitcher
              workspaceId={workspaceId}
              onWorkspaceChange={onWorkspaceChange}
              navigation
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
              // Same inset as the main Trade OS sidebar (menu starts 20px in).
              <SidebarGroup key={group.label} className="px-5 py-1">
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
                            onClick={() =>
                              item.id === "billing"
                                ? openBillingPortal()
                                : selectSection(item.id)
                            }
                            aria-label={
                              item.id === "billing"
                                ? "빌링 (새 탭에서 열림)"
                                : item.label
                            }
                            aria-current={
                              effectiveSection === item.id ? "page" : undefined
                            }
                            className="text-sidebar-foreground/75 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 data-active:text-primary"
                          >
                            {item.navIcon ? (
                              <NavigationIcon name={item.navIcon} className="size-5 shrink-0" />
                            ) : (
                              <Icon strokeWidth={1.75} />
                            )}
                            <span className="group-data-[collapsible=icon]:hidden">
                              {item.label}
                              {item.id === "billing" ? " ↗" : ""}
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
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-h-0 min-w-0 overflow-hidden bg-transparent md:pt-(--header-height)">
        <div className="h-full min-h-0 overflow-y-auto">
          <div
            data-ui="settings-content"
            className={`mx-auto w-full px-5 py-7 sm:px-7 xl:px-10 xl:py-9 ${effectiveSection === "products" || effectiveSection === "members" ? "max-w-[1120px]" : "max-w-[960px]"}`}
          >
            {portalError && role === "owner" && (
              <div
                role="alert"
                className="mb-5 rounded-lg border border-destructive/30 bg-background p-4 text-sm"
              >
                <p>
                  빌링 포털에 연결하지 못했습니다. 현재 조직의 OWNER 권한·Paddle
                  연결을 확인할 서버가 연결되어 있지 않습니다.
                </p>
                <Button
                  className="mt-3"
                  variant="outline"
                  onClick={openBillingPortal}
                >
                  다시 열기
                </Button>
                <Button
                  className="ml-2"
                  variant="ghost"
                  onClick={() => setPortalError(false)}
                >
                  닫기
                </Button>
              </div>
            )}
            <div key={`${workspaceId}:${effectiveSection}`}>
              {renderSection(effectiveSection, role, availableProducts, subscriptionKind, subscriptionStates, workspaceOptions.find((workspace) => workspace.id === workspaceId)?.organizationName ?? "현재 조직", importPermissions, loadEmailLimits, withdrawal, () => selectSection("organizations"), setWithdrawalResult)}
            </div>
          </div>
        </div>
      </SidebarInset>
    </div>
  )
}

// Reset all demo data and pending feedback when organization or role changes.
export function SettingsHubV2(props: Parameters<typeof SettingsHubContent>[0]) {
  const sharedDemo = useSettingsDemoPresent()
  if (sharedDemo) return <SettingsHubContent {...props} />
  return (
    <SettingsDemoProvider
      key={`${props.workspaceId}:${props.role ?? "owner"}:${(props.availableProducts ?? ["erp", "snap"]).join(",")}:${props.subscriptionKind ?? "separate"}`}
      subscriptionKind={props.subscriptionKind}
    >
      <SettingsHubContent {...props} />
    </SettingsDemoProvider>
  )
}

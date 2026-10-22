import { WithdrawalResultSurface } from "./AccountWithdrawalPanel"
import { NavigationIcon } from "@/components/platform/NavigationIcon"
import { createWithdrawalPreview, withdrawalScenario, type WithdrawalGateway, type WithdrawalResult } from "./withdrawalData"
import { PageHeading, SettingsSection } from "./views/SettingsSection"
import { emailLimitsPreview, type EmailLimitsLoader } from "./emailLimitsData"
import { resolveImportPermissions, type ImportPermissions } from "./importPermissions"
import { ApprovalPolicySettings } from "./ApprovalPolicySettingsView"
import { AliasesPage } from "./CounterpartyAliasSettingsView"
import { appLocation } from "@/app/appLocation"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  Bell,
  Building2,
  Check,
  CircleUserRound,
  CreditCard,
  Database,
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

import { WorkspaceSwitcher } from "@/components/ds2/molecule/WorkspaceSwitcher"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
} from "@/components/ui/sidebar"
import { SettingsDemoProvider } from "./SubscriptionSettings"
import { useSettingsDemoPresent } from "@share/settings/useSettingsDemo"
import { ProductsSubscriptions } from "@share/settings/BillingSettingsView"
import { OrganizationMembers } from "@share/settings/MemberRosterSettings"
import { OrganizationAiUsage } from "./TokenUsageSettingsView"
import { workspaceOptions, type WorkspaceKey } from "@/lib/workspaces"
import { SettingRow } from "@share/settings/views/SettingRow"
import { AccountPage } from "@share/settings/AccountGeneralSettings"
import { OrganizationPage } from "@share/settings/OrganizationProfilePanel"
import { TradeDefaultsPage } from "@share/settings/CompanyProfileSettings"
import { EmailPage } from "@share/settings/EmailForwardInSettings"
import { ImportPage } from "@share/settings/SettingsImportView"
import { AlertsPage } from "@share/settings/AlertSettings"
import { SnapSimplePage, SnapDataPage, SnapUsagePage } from "@share/settings/SnapSettingsConnected"

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

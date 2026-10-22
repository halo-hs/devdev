import { Wand2, Home, Upload, Sparkles, Bot, Building2, Ship, Calculator, Monitor, ClipboardList, History, Camera } from "lucide-react"
import ecoyaWhiteLogoSrc from "@ecoya/design-system/assets/logos/logo-ecoya-white.png"
import { cn } from "@shared/lib/utils"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@shared/components/ui/select"
import navigationWordmark from "@shared/assets/navigation/ecoya-wordmark.svg?url"
import { type SnapScreenKey } from "@snap/SnapScreens"
import { type WorkspaceKey, workspaceOptions } from "@shared/lib/workspaces"
import { type SnapRole, canAccessSnapRoute, getSnapRouteByScreen } from "@snap/lib/snapRoutes"
import { useStartGuide } from "@trade-os/onboarding/StartGuideProvider"
import { useSnapStartGuide } from "@snap/onboarding/SnapStartGuidePage"
import { useSidebar, Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarRail } from "@shared/components/ui/sidebar"
import { Button } from "@shared/components/ui/button"
import { NavigationIcon } from "@shared/components/NavigationIcon"
import { WorkspaceSwitcher } from "@shared/components/WorkspaceSwitcher"
import { SidebarProfileMenu } from "@shared/components/AccountButton"
import { type ProductKey, type Screen, type ErpPreviewRole } from "@/App"
import { snapNavGroups } from "@/shell/erpRouteMeta"
import ecoyaSnapColorLogo from "@ecoya/design-system/assets/logos/logo-ecoya-snap-color.png"

const erpNavigationIcons = { onboarding: "start", home: "home", inbox: "upload", create: "document", ask: "chat", deals: "deals", shipments: "ship", settlement: "settlement", monitoring: "monitoring", reports: "report", sales: "sales" } as const

const erpNavGroups = [
  {
    label: "",
    items: [
      ["처음 시작하기", Wand2, "onboarding"],
      ["오늘 할 일", Home, "home"],
      ["문서 올리기", Upload, "inbox"],
      ["문서 만들기", Sparkles, "create"],
      ["AI에게 묻기", Bot, "ask"],
    ],
  },
  {
    label: "기록",
    items: [
      ["거래", Building2, "deals"],
      ["선적", Ship, "shipments"],
      ["정산", Calculator, "settlement"],
    ],
  },
  {
    label: "경영·성과",
    items: [
      ["운영 감시", Monitor, "monitoring"],
      ["결산 리포트", ClipboardList, "reports"],
      ["영업 성과", History, "sales"],
    ],
  },
] as const

const ECOYA_SYMBOL_SRC = "/assets/logos/ecoya-favicon.svg"

const ECOYA_SNAP_LOGO_SRC = ecoyaSnapColorLogo

export function EcoyaTradeOsLogo({
  size = "header",
  tone = "color",
}: {
  size?: "header" | "menu"
  tone?: "color" | "white"
}) {
  const height = size === "menu" ? 20 : 15
  const wordmarkWidth = (176 / 40) * height
  const sourceWidth = (327 / 40) * height

  return (
    <span
      className="inline-flex shrink-0 items-center"
      style={{ height: `${height}px` }}
    >
      <span
        className="relative block shrink-0 overflow-hidden"
        style={{ height: `${height}px`, width: `${wordmarkWidth}px` }}
      >
        <img
          src={tone === "white" ? ecoyaWhiteLogoSrc : ECOYA_SNAP_LOGO_SRC}
          alt=""
          aria-hidden="true"
          className="absolute top-0 left-0 max-w-none"
          style={{ height: `${height}px`, width: `${sourceWidth}px` }}
        />
      </span>
      <span
        className={cn(
          "ml-1 leading-none font-medium tracking-[-0.04em] whitespace-nowrap",
          tone === "white"
            ? "text-[var(--ui-sidebar-gradient-foreground)]"
            : "text-[var(--color-gray-2)]",
          size === "menu" ? "text-sm" : "text-xs"
        )}
      >
        TRADE OS
      </span>
    </span>
  )
}

export function ProductSwitcher({
  product,
  onProductChange,
  compact = false,
  availableProducts = ["erp", "snap"],
  tone = "white",
}: {
  product: ProductKey
  onProductChange: (product: ProductKey) => void
  compact?: boolean
  availableProducts?: ProductKey[]
  tone?: "color" | "white"
}) {
  const productName = product === "erp" ? "ECOYA Trade OS" : "ECOYA SNAP"

  return (
    <Select
      value={product}
      onValueChange={(value) => {
        if (value === "erp" || value === "snap") onProductChange(value)
      }}
    >
      <SelectTrigger
        className={cn(
          "snap-product-switcher h-11 w-full border-0 bg-transparent px-1 shadow-none hover:bg-sidebar-accent focus-visible:ring-2",
          compact &&
            "justify-center gap-0 p-0 *:data-[slot=select-value]:flex-none [&>svg:last-child]:hidden"
        )}
        aria-label="ECOYA 제품 전환"
        title={compact ? `${productName} 제품 전환` : undefined}
      >
        <SelectValue>
          <span className="flex min-w-0 items-center gap-2.5">
            {compact ? (
              <span className="flex size-8 shrink-0 items-center justify-center">
                <img
                  src={ECOYA_SYMBOL_SRC}
                  alt=""
                  aria-hidden="true"
                  className={cn(
                    "size-6 object-contain",
                    tone === "white" && "brightness-0 invert"
                  )}
                />
              </span>
            ) : (
              <span className="flex min-w-0 flex-1 items-center text-left">
                {product === "erp" ? (
                  <><span className="navigation-product-logo hidden items-center gap-[3.4px]"><img src={navigationWordmark} alt="ECOYA" /><span className="text-[17.2px] leading-[24.08px] font-bold text-[var(--surface-foreground)]">Trade OS</span></span><span className="navigation-product-logo-fallback"><EcoyaTradeOsLogo tone={tone} /></span></>
                ) : (
                  <img
                    src={
                      tone === "white" ? ecoyaWhiteLogoSrc : ECOYA_SNAP_LOGO_SRC
                    }
                    alt={productName}
                    className="h-4 w-auto max-w-[128px] shrink-0 object-contain object-left"
                  />
                )}
              </span>
            )}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="min-w-64 p-2">
        {availableProducts.includes("erp") ? (
          <SelectItem
            value="erp"
            className="mb-2 min-h-24 gap-3 py-3 pr-10 pl-2 last:mb-0"
          >
            <Building2 />
            <span className="grid gap-1 py-0.5">
              <EcoyaTradeOsLogo size="menu" />
              <span className="font-medium">ECOYA Trade OS</span>
              <span className="text-xs text-muted-foreground">
                Trade Operations · 문서·거래·정산
              </span>
            </span>
          </SelectItem>
        ) : null}
        {availableProducts.includes("snap") ? (
          <SelectItem
            value="snap"
            className="mb-2 min-h-24 gap-3 object-left py-3 pr-10 pl-2 last:mb-0"
          >
            <Camera />
            <span className="grid gap-1 py-0.5">
              <img
                src={ECOYA_SNAP_LOGO_SRC}
                alt="ECOYA SNAP"
                className="h-5 w-auto max-w-32 object-contain object-left"
              />
              <span className="font-medium">ECOYA SNAP</span>
              <span className="text-xs text-muted-foreground">
                Field Evidence · 현장 작업·증거
              </span>
            </span>
          </SelectItem>
        ) : null}
      </SelectContent>
    </Select>
  )
}

export function AppNav({
  screen,
  setScreen,
  product,
  onProductChange,
  unreadNotificationCount,
  onOpenNotifications,
  snapScreen,
  onSnapScreenChange,
  onLogout,
  workspaceId,
  onWorkspaceChange,
  availableProducts,
  snapRole,
  isV2Workspace,
  erpRole,
}: {
  screen: Screen
  setScreen: (screen: Screen) => void
  product: ProductKey
  onProductChange: (product: ProductKey) => void
  unreadNotificationCount: number
  onOpenNotifications: () => void
  snapScreen: SnapScreenKey
  onSnapScreenChange: (screen: SnapScreenKey) => void
  onLogout: () => void
  workspaceId: WorkspaceKey
  onWorkspaceChange: (workspaceId: WorkspaceKey) => void
  availableProducts: ProductKey[]
  snapRole: SnapRole | null
  isV2Workspace: boolean
  erpRole: ErpPreviewRole
}) {
  const startGuide = useStartGuide()
  const snapStartGuide = useSnapStartGuide(`preview-account:${workspaceId}`)
  const snapGuidePrivileged = snapRole === "owner" || snapRole === "manager"
  const snapGuideCommonCount = snapGuidePrivileged ? [startGuide?.state?.common.C1, startGuide?.state?.common.C2].filter(Boolean).length : 0
  const snapGuideCount = (["S1", "S2", "S3", "S4"] as const).filter(id => snapStartGuide.state?.completed[id]).length + snapGuideCommonCount
  const snapGuideTotal = snapGuidePrivileged ? 6 : 4
  const snapGuideReady = Boolean(snapStartGuide.state && (!snapGuidePrivileged || (startGuide?.state && !startGuide.error)))
  const { isMobile, setOpenMobile, toggleSidebar, state: sidebarState } = useSidebar()
  const sidebarCollapsed = sidebarState === "collapsed"
  const canOpenSettings = product !== "snap" || Boolean(
    snapRole && canAccessSnapRoute(getSnapRouteByScreen("SC-30")!, {
      role: snapRole,
      platformOps: false,
      authenticated: true,
    })
  )
  const navigate = (nextScreen: Screen) => {
    setScreen(nextScreen)
    if (isMobile) setOpenMobile(false)
  }
  const openSettings = () => {
    if (product === "snap") {
      onSnapScreenChange("SC-30")
      if (isMobile) setOpenMobile(false)
      return
    }
    navigate("settings")
  }
  const currentWorkspace =
    workspaceOptions.find((workspace) => workspace.id === workspaceId) ??
    workspaceOptions[0]

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "snap-navigation",
        "top-0 z-[var(--z-side-nav)] h-svh! data-[side=left]:border-r-0 data-[side=right]:border-l-0",
        isV2Workspace && "v2-navigation"
      )}
    >
      <SidebarHeader className="app-navigation-header shrink-0 gap-4 px-5 pt-5 pb-0 group-data-[collapsible=icon]:px-3">
        <div className="app-navigation-brand flex h-7 items-center gap-1.5 group-data-[collapsible=icon]:h-10">
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <ProductSwitcher product={product} onProductChange={onProductChange} availableProducts={availableProducts} tone="color" />
          </div>
          <Button variant="ghost" onClick={toggleSidebar}
            aria-label={isMobile ? "메뉴 닫기" : sidebarCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
            className="navigation-toggle ml-auto size-[18px] shrink-0 p-0 text-[var(--surface-foreground)] group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:mx-auto"
          >
            <NavigationIcon name="slide" className="scale-75 group-data-[collapsible=icon]:scale-100" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <WorkspaceSwitcher workspaceId={workspaceId} onWorkspaceChange={onWorkspaceChange} product={product} navigation unreadCount={unreadNotificationCount} />
          </div>
          {(!sidebarCollapsed || isMobile) && <NotificationButton unreadCount={unreadNotificationCount} active={screen === "notifications"} onClick={onOpenNotifications} />}
        </div>
      </SidebarHeader>
      <SidebarContent className="app-navigation-content gap-5 px-5 pt-4 pb-5 group-data-[collapsible=icon]:px-3">
        {product === "erp"
          ? erpNavGroups.map((group) => (
              <SidebarGroup
                key={group.label || "primary"}
                className="p-0"
              >
                {group.label ? (
                  <SidebarGroupLabel className="text-[11px] leading-4 font-normal text-[var(--surface-foreground)] group-data-[collapsible=icon]:pointer-events-none">{group.label}</SidebarGroupLabel>
                ) : null}
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map(([label, , key]) => {
                      if (key === "onboarding" && startGuide?.complete) return null
                      if (key === "monitoring" && erpRole !== "owner") return null
                      const active =
                        key === screen ||
                        (key === "deals" &&
                          (screen === "deals" || screen === "deal" || screen === "contacts")) ||
                        (key === "create" && screen === "result") ||
                        (key === "shipments" && screen === "snap")
                      return (
                        <SidebarMenuItem key={label}>
                          <SidebarMenuButton
                            isActive={active}
                            tooltip={label}
                            aria-label={label}
                            onClick={() => navigate(key)}
                            className="app-navigation-item"
                          >
                            <NavigationIcon name={erpNavigationIcons[key]} />
                            <span>{label}</span>
                            {key === "onboarding" && startGuide?.state && <span className="ml-auto text-xs">{startGuide.count}/{startGuide.total}</span>}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))
          : snapNavGroups.map((group) => {
              const visibleItems = group.items.filter(([, , key]) => {
                const definition = getSnapRouteByScreen(key)
                if (key === "SC-10" && snapGuideReady && snapGuideCount === snapGuideTotal) return false
                if (!definition || !snapRole) return false
                return canAccessSnapRoute(definition, {
                  role: snapRole,
                  platformOps: false,
                  authenticated: true,
                })
              })
              if (visibleItems.length === 0) return null

              return (
                <SidebarGroup
                  key={group.label || "snap-primary"}
                  className="p-0"
                >
                  {group.label ? (
                    <SidebarGroupLabel className="text-[11px] leading-4 font-normal text-[var(--surface-foreground)] group-data-[collapsible=icon]:pointer-events-none">{group.label}</SidebarGroupLabel>
                  ) : null}
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {visibleItems.map(([label, Icon, key]) => (
                        <SidebarMenuItem key={key}>
                          <SidebarMenuButton
                            isActive={
                              screen === "snap-platform" && snapScreen === key
                            }
                            tooltip={label}
                            aria-label={label}
                            onClick={() => {
                              onSnapScreenChange(key)
                              navigate("snap-platform")
                            }}
                            className="app-navigation-item"
                          >
                            <Icon />
                            <span>{label}</span>
                            {key === "SC-10" && snapGuideReady && <span className="ml-auto text-xs">{snapGuideCount}/{snapGuideTotal}</span>}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )
            })}
      </SidebarContent>
      <SidebarFooter className="app-navigation-footer mt-auto shrink-0 border-t border-[var(--color-gray-10)] px-4 py-2 group-data-[collapsible=icon]:px-3 group-data-[collapsible=icon]:pb-4">
        <SidebarMenu>
          <SidebarProfileMenu
            onSettings={canOpenSettings ? openSettings : undefined}
            onUsage={canOpenSettings ? () => navigate("tokens") : undefined}
            onBilling={canOpenSettings ? () => navigate("billing") : undefined}
            showProductSummary={canOpenSettings}
            onLogout={() => {
              onLogout()
              if (isMobile) setOpenMobile(false)
            }}
            workspaceName={currentWorkspace.name}
            billingPlan={currentWorkspace.billingPlan}
            product={product}
          />
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export function NotificationButton({
  unreadCount,
  active,
  onClick,
}: {
  unreadCount: number
  active: boolean
  onClick: () => void
}) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="icon"
      type="button"
      aria-label={unreadCount > 0 ? `알림, 미확인 ${unreadCount}개` : "알림"}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className="relative shrink-0 text-muted-foreground"
    >
      <NavigationIcon name="notification" />
      {unreadCount > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-white bg-[#e53b3b] px-1 text-[11px] leading-[14px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Button>
  )
}

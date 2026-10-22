import { type SnapScreenKey } from "@snap/SnapScreens"
import { useSidebar, SidebarTrigger } from "@shared/components/ui/sidebar"
import { useState, useEffect, Fragment, useRef } from "react"
import { appLocation } from "@/app/appLocation"
import { templateMeta } from "@trade-os/documents/documentTemplateModel"
import { getSnapRouteByScreen } from "@snap/lib/snapRoutes"
import { settingsSectionLabel } from "@share/settings/SettingsRoutePage"
import { cn } from "@shared/lib/utils"
import { ChevronRight, ChevronDown, MoreVertical, Users, ClipboardList, Clock3, RefreshCw } from "lucide-react"
import { NotificationButton } from "@/shell/erpNav"
import { Button } from "@shared/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@shared/components/ui/popover"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@shared/components/ui/select"
import { Separator } from "@shared/components/ui/separator"
import { type Screen, type ProductKey, type ErpPreviewRole, type DocumentApprovalPreviewState } from "@/App"
import { snapNavGroups } from "@/shell/erpRouteMeta"

const snapScreenLabels = Object.fromEntries(
  snapNavGroups.flatMap((group) =>
    group.items.map(([label, , key]) => [key, label])
  )
) as Partial<Record<SnapScreenKey, string>>

export function WorkspaceHeader({
  screen,
  documentConfirmed,
  templateCode,
  unreadNotificationCount,
  onOpenNotifications,
  onNavigate,
  product,
  snapScreen,
  onSnapScreenChange,
  erpHomeRole,
  onErpHomeRoleChange,
  showErpHomeRoleSwitch,
  documentApprovalPreviewState,
  onDocumentApprovalPreviewStateChange,
  showDocumentApprovalPreviewSwitch,
  isV2Workspace,
  dealActionsRef,
}: {
  documentConfirmed: boolean
  screen: Screen
  templateCode: string
  unreadNotificationCount: number
  onOpenNotifications: () => void
  onNavigate: (screen: Screen) => void
  product: ProductKey
  snapScreen: SnapScreenKey
  onSnapScreenChange: (screen: SnapScreenKey) => void
  erpHomeRole: ErpPreviewRole
  onErpHomeRoleChange: (role: ErpPreviewRole) => void
  showErpHomeRoleSwitch: boolean
  documentApprovalPreviewState: DocumentApprovalPreviewState
  onDocumentApprovalPreviewStateChange: (
    state: DocumentApprovalPreviewState
  ) => void
  showDocumentApprovalPreviewSwitch: boolean
  isV2Workspace: boolean
  dealActionsRef?: (node: HTMLDivElement | null) => void
}) {
  const { isMobile, state: sidebarState } = useSidebar()
  const sidebarCollapsed = sidebarState === "collapsed"
  // The settings page changes ?section= with pushState; follow it for the trail.
  const [settingsSection, setSettingsSection] = useState(() => new URLSearchParams(appLocation.search).get("section") ?? "account")
  useEffect(() => {
    const sync = () => setSettingsSection(new URLSearchParams(window.location.search).get("section") ?? "account")
    window.addEventListener("settings-section-change", sync)
    window.addEventListener("popstate", sync)
    return () => {
      window.removeEventListener("settings-section-change", sync)
      window.removeEventListener("popstate", sync)
    }
  }, [])

  const [, templateTitle] = templateMeta(templateCode)
  const activeSnapRoute = getSnapRouteByScreen(snapScreen)
  const screenTitles: Partial<Record<Screen, string>> = {
    onboarding: "처음 시작하기",
    home: "오늘 할 일",
    inbox: "문서 올리기",
    create: "문서 만들기",
    ask: "AI에게 묻기",
    deals: "거래",
    deal: "거래 상세",
    shipments: "선적",
    settlement: "정산",
    monitoring: "운영 감시",
    reports: "결산 리포트",
    sales: "영업 성과",
    contacts: "연락처·파이프라인",
    notifications: "알림",
    settings: "설정",
    counterparty: "거래처 360",
    snap: "SNAP 증거함",
    billing: "결제·구독",
    tokens: "토큰 사용량",
    "snap-platform":
      activeSnapRoute?.label ?? snapScreenLabels[snapScreen] ?? "SNAP",
  }
  const screenSections: Partial<Record<Screen, string>> = {
    onboarding: "AI 서류 처리",
    home: "AI 서류 처리",
    inbox: "AI 서류 처리",
    create: "AI 서류 처리",
    result: "AI 서류 처리",
    ask: "AI 서류 처리",
    deals: "기록",
    deal: "기록",
    contacts: "기록",
    shipments: "기록",
    settlement: "기록",
    counterparty: "기록",
    snap: "기록",
    monitoring: "경영·성과",
    reports: "경영·성과",
    sales: "경영·성과",
    notifications: "알림",
    settings: "설정",
    billing: "설정",
    tokens: "설정",
    "snap-platform": "ECOYA SNAP",
  }
  const title = screenTitles[screen] ?? (documentConfirmed ? templateTitle : `${templateTitle} 초안`)
  const section = screenSections[screen] ?? "AI 서류 처리"
  const settingsLabel = screen === "settings" ? settingsSectionLabel(settingsSection) : undefined
  const breadcrumbs =
    screen === "snap-platform" && activeSnapRoute
      ? [...activeSnapRoute.breadcrumb]
      : settingsLabel
        ? ["설정", settingsLabel]
      : screen === "deal" || screen === "contacts"
        ? ["기록", "거래", title]
        : section !== title
          ? [section, title]
          : [title]
  const firstDepthTargets: Partial<Record<string, Screen>> = {
    "AI 서류 처리": "home",
    기록: "deals",
    "경영·성과": "monitoring",
    설정: "settings",
  }
  const navigateToFirstDepth = () => {
    if (section === "ECOYA SNAP") {
      onSnapScreenChange("SC-17")
      onNavigate("snap-platform")
      return
    }

    if (section === "설정") {
      appLocation.assign("/erp/settings")
      return
    }
    const target = firstDepthTargets[section]
    if (target) onNavigate(target)
  }

  return (
    <header
      className={cn(
        "snap-shell-header z-40 h-(--header-height) w-full shrink-0 bg-[var(--surface-background)]",
        isV2Workspace && "v2-shell-header"
      )}
    >
      <div className="flex h-full w-full items-center">
        {!isV2Workspace ? (
          screen !== "settings" ? (
            <div
              data-sidebar="workspace-brand"
              data-sidebar-state={sidebarState}
              className={cn(
                "snap-navigation-brand hidden h-full items-center bg-sidebar text-sidebar-foreground transition-[width,padding] duration-200 ease-linear md:flex md:shrink-0",
                sidebarCollapsed
                  ? "md:w-(--sidebar-width-icon) md:px-2"
                  : "md:w-(--sidebar-width) md:px-4"
              )}
            >
              <div className="flex min-w-0 flex-1 items-center justify-end" />
            </div>
          ) : (
            <div
              aria-hidden="true"
              className={cn(
                "snap-navigation-brand hidden h-full shrink-0 bg-sidebar md:block",
                sidebarCollapsed
                  ? "md:w-(--sidebar-width-icon)"
                  : "md:w-(--sidebar-width)"
              )}
            />
          )
        ) : null}
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center justify-between gap-2 px-3 sm:px-5",
            isV2Workspace &&
              (sidebarCollapsed
                ? "md:ml-(--sidebar-width-icon)"
                : "md:ml-(--sidebar-width)")
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger
              className="md:hidden"
              aria-label={
                screen === "settings" ? "설정 메뉴 열기" : "서비스 메뉴 열기"
              }
            />
            <nav
              aria-label="현재 위치"
              className={cn(
                "flex min-w-0 items-center gap-1.5 text-[15px] leading-[22px]",
                // Deal actions share the phone top bar: keep only the current page.
                dealActionsRef && "max-sm:[&>:not([aria-current])]:hidden"
              )}
            >
              {breadcrumbs.map((breadcrumb, index) => {
                const isCurrent = index === breadcrumbs.length - 1
                return (
                  <Fragment key={`${breadcrumb}-${index}`}>
                    {index > 0 ? (
                      <ChevronRight className="size-3.5 shrink-0 text-[var(--color-gray-4)]" />
                    ) : null}
                    {index === 0 && !isCurrent && firstDepthTargets[section] ? (
                      <button
                        type="button"
                        className="shrink-0 text-[var(--color-gray-4)] transition-colors hover:text-foreground hover:underline"
                        onClick={navigateToFirstDepth}
                      >
                        {breadcrumb}
                      </button>
                    ) : index === 0 &&
                      !isCurrent &&
                      section === "ECOYA SNAP" ? (
                      <button
                        type="button"
                        className="shrink-0 text-[var(--color-gray-4)] transition-colors hover:text-foreground hover:underline"
                        onClick={navigateToFirstDepth}
                      >
                        {breadcrumb}
                      </button>
                    ) : (
                      <span
                        className={
                          isCurrent
                            ? "truncate font-normal text-[var(--color-gray-2)]"
                            : "shrink-0 text-[var(--color-gray-4)]"
                        }
                        aria-current={isCurrent ? "page" : undefined}
                      >
                        {breadcrumb}
                      </span>
                    )}
                  </Fragment>
                )
              })}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {isMobile || sidebarCollapsed ? (
              <NotificationButton
                unreadCount={unreadNotificationCount}
                active={screen === "notifications"}
                onClick={onOpenNotifications}
              />
            ) : null}
            <TopBarUtilities
              product={product}
              erpHomeRole={erpHomeRole}
              onErpHomeRoleChange={onErpHomeRoleChange}
              showErpHomeRoleSwitch={showErpHomeRoleSwitch}
              documentApprovalPreviewState={documentApprovalPreviewState}
              onDocumentApprovalPreviewStateChange={
                onDocumentApprovalPreviewStateChange
              }
              showDocumentApprovalPreviewSwitch={
                showDocumentApprovalPreviewSwitch
              }
              dealActionsRef={dealActionsRef}
            />
          </div>
        </div>
      </div>
    </header>
  )
}

const worldClockZones = [
  ["서울", "Asia/Seoul", "조직 시간"],
  ["뉴욕", "America/New_York", "미주"],
  ["런던", "Europe/London", "유럽"],
  ["상하이", "Asia/Shanghai", "중국"],
] as const

function formatWorldTime(timeZone: string, now: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone,
  }).format(now)
}

export function TopBarUtilities({
  product,
  erpHomeRole,
  onErpHomeRoleChange,
  showErpHomeRoleSwitch,
  documentApprovalPreviewState,
  onDocumentApprovalPreviewStateChange,
  showDocumentApprovalPreviewSwitch,
  dealActionsRef,
}: {
  product: ProductKey
  erpHomeRole: ErpPreviewRole
  onErpHomeRoleChange: (role: ErpPreviewRole) => void
  showErpHomeRoleSwitch: boolean
  documentApprovalPreviewState: DocumentApprovalPreviewState
  onDocumentApprovalPreviewStateChange: (
    state: DocumentApprovalPreviewState
  ) => void
  showDocumentApprovalPreviewSwitch: boolean
  dealActionsRef?: (node: HTMLDivElement | null) => void
}) {
  const [open, setOpen] = useState<"clock" | "more" | null>(null)
  const [now, setNow] = useState(() => new Date())
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!open || open === "more") return
    const closeOnOutside = (event: PointerEvent) => {
      if (
        rootRef.current &&
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      ) {
        setOpen(null)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null)
    }
    document.addEventListener("pointerdown", closeOnOutside)
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative flex items-center gap-1.5">
      {dealActionsRef ? (
        <div ref={dealActionsRef} className="flex items-center gap-1.5" />
      ) : null}
      <Button
        variant="outline"
        type="button"
        aria-label="세계시간 열기"
        aria-expanded={open === "clock"}
        onClick={() =>
          setOpen((current) => (current === "clock" ? null : "clock"))
        }
        className="hidden h-8 gap-1 px-3 text-[15px] leading-[22px] font-normal lg:inline-flex"
      >
        <span className="text-[var(--color-gray-6)]">세계시간</span>
        <span className="text-[var(--color-gray-2)] tabular-nums">
          서울 {formatWorldTime("Asia/Seoul", now)}
        </span>
        <ChevronDown className="size-3.5 text-[var(--color-gray-2)]" />
      </Button>
      <Popover
        open={open === "more"}
        onOpenChange={(nextOpen) => setOpen(nextOpen ? "more" : null)}
      >
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="더보기"
            className="text-muted-foreground"
          >
            <MoreVertical className="size-4.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-52 gap-0 p-1">
          {product === "erp" && showErpHomeRoleSwitch ? (
            <>
              <div className="px-2 py-2">
                <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Users className="size-3.5" />
                  화면 권한
                </label>
                <Select
                  value={erpHomeRole}
                  onValueChange={(value) => {
                    if (
                      value === "owner" ||
                      value === "admin" ||
                      value === "member"
                    ) {
                      onErpHomeRoleChange(value)
                      setOpen(null)
                    }
                  }}
                >
                  <SelectTrigger
                    className="h-8 w-full bg-[var(--control-background)]"
                    aria-label="화면 권한 전환"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator className="my-1" />
            </>
          ) : null}
          {product === "erp" && showDocumentApprovalPreviewSwitch ? (
            <>
              <div className="px-2 py-2">
                <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <ClipboardList className="size-3.5" />
                  문서 승인 화면
                </label>
                <Select
                  value={documentApprovalPreviewState}
                  onValueChange={(value) => {
                    if (
                      value === "live" ||
                      value === "requester-pending" ||
                      value === "requester-approved" ||
                      value === "requester-rejected" ||
                      value === "owner-pending" ||
                      value === "admin-pending"
                    ) {
                      onDocumentApprovalPreviewStateChange(value)
                      setOpen(null)
                    }
                  }}
                >
                  <SelectTrigger
                    className="h-8 w-full bg-[var(--control-background)]"
                    aria-label="문서 승인 화면 상태 전환"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="live">현재 진행 상태</SelectItem>
                    <SelectItem value="requester-pending">
                      요청자 · 승인 대기
                    </SelectItem>
                    <SelectItem value="requester-approved">
                      요청자 · 승인 완료
                    </SelectItem>
                    <SelectItem value="requester-rejected">
                      요청자 · 반려 확인
                    </SelectItem>
                    <SelectItem value="owner-pending">
                      승인자 · Owner
                    </SelectItem>
                    <SelectItem value="admin-pending">
                      승인자 · Admin
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator className="my-1" />
            </>
          ) : null}
          <Button
            variant="ghost"
            type="button"
            onClick={() => setOpen("clock")}
            className="h-auto w-full justify-start px-3 py-2"
          >
            <Clock3 className="size-4" />
            세계시간 보기
          </Button>
          <Separator className="my-1" />
          <Button
            variant="ghost"
            type="button"
            onClick={() => appLocation.reload()}
            className="h-auto w-full justify-start px-3 py-2"
          >
            <RefreshCw className="size-4" />
            현재 화면 새로고침
          </Button>
        </PopoverContent>
      </Popover>

      {open === "clock" ? (
        <div
          role="dialog"
          aria-label="세계시간"
          className="absolute top-10 right-9 z-50 w-80 rounded-md border bg-popover text-popover-foreground shadow-lg"
        >
          <div className="border-b px-4 py-3 text-sm font-semibold">
            세계시간
          </div>
          <div className="py-1.5">
            {worldClockZones.map(([label, timeZone, region]) => (
              <div
                key={timeZone}
                className="flex items-center justify-between gap-4 px-4 py-2.5"
              >
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {region} · {timeZone}
                  </div>
                </div>
                <div className="text-base font-semibold tabular-nums">
                  {formatWorldTime(timeZone, now)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

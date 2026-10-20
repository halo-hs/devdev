import { NavigationIcon } from "@shared/components/navigation-icon"
import { appLocation } from "@/app/app-location"
import { useState } from "react"
import {
  CircleHelp,
  Settings,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu"
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@shared/components/ui/sidebar"

export function SidebarProfileMenu({
  onSettings,
  onUsage,
  onBilling,
  onLogout,
  product = "erp",
  workspaceName = "ECOYA Demo Co.",
  billingPlan = "Pro",
  showProductSummary = true,
}: {
  onSettings?: () => void
  onUsage?: () => void
  onBilling?: () => void
  onLogout: () => void
  product?: "erp" | "snap"
  workspaceName?: string
  billingPlan?: string
  showProductSummary?: boolean
}) {
  const { state: sidebarState } = useSidebar()
  const [language, setLanguage] = useState("ko-KR")
  const isSidebarCollapsed = sidebarState === "collapsed"
  const productPlans =
    product === "snap"
      ? [
          { name: "ECOYA SNAP", plan: "Free" },
          { name: "ECOYA Trade OS", plan: billingPlan },
        ]
      : [
          { name: "ECOYA Trade OS", plan: billingPlan },
          { name: "ECOYA SNAP", plan: "Free" },
        ]

  const openSupportMail = (subject: string) => {
    window.location.href = `mailto:support@ecoya.app?subject=${encodeURIComponent(subject)}`
  }

  return (
    <SidebarMenuItem className="flex w-full min-w-0 items-center gap-1 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:flex-col">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip="프로필 메뉴"
            aria-label="프로필 메뉴"
            className="h-[52px] min-w-0 flex-1 gap-2.5 p-2.5 group-data-[collapsible=icon]:order-3 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:p-1!"
          >
            <span data-nav-icon="avatar" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-indigo)] text-[15px] leading-[22px] text-white">조</span>
            <span className="min-w-0 truncate text-[14px] leading-5 font-semibold text-[var(--surface-foreground)] group-data-[collapsible=icon]:hidden">
              조민영
            </span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="start"
          sideOffset={8}
          className="navigation-account-popover flex w-[280px] flex-col gap-0.5 rounded-xl border border-[var(--color-gray-10)] bg-[var(--surface-background)] p-2 shadow-[var(--shadow-modal)] ring-0"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-3 py-2.5">
              <div className="text-[15px] leading-[22px] font-semibold text-[var(--surface-foreground)]">조민영</div>
              <div className="mt-0.5 text-[13px] leading-[18px] font-normal text-[var(--color-gray-4)]">
                minyoung@ecoya.app · {workspaceName}
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          {isSidebarCollapsed ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {onSettings ? <DropdownMenuItem onClick={onSettings}>
                  <Settings />
                  설정
                </DropdownMenuItem> : null}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <CircleHelp />
                    고객 지원
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48">
                    <DropdownMenuItem
                      onClick={() =>
                        openSupportMail("ECOYA 자주 묻는 질문 문의")
                      }
                    >
                      자주 묻는 질문
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openSupportMail("ECOYA 이용 가이드 문의")}
                    >
                      이용 가이드
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => appLocation.assign("/legal/terms")}
                    >
                      이용 약관
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => appLocation.assign("/legal/privacy")}
                    >
                      개인정보 처리방침
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuGroup>
            </>
          ) : null}

          {showProductSummary ? <div className="space-y-0.5">
            {productPlans.map(({ name, plan }) => {
              const isProductFree = plan.trim().toLowerCase() === "free"
              const usageLabel = isProductFree
                ? "조직 무료 사용량"
                : "조직 사용량"
              const usageValue = isProductFree ? "10회 남음" : "7일 남음"

              return (
                <div
                  key={name}
                  className="grid gap-2 rounded-lg border border-[var(--color-gray-10)] p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-[15px] leading-[22px] font-semibold text-[var(--surface-foreground)]">
                      {name}
                    </span>
                    <span className="text-[13px] leading-[18px] font-medium text-[var(--color-gray-4)]">
                      {plan}
                    </span>
                  </div>

                  {onUsage ? (
                    <DropdownMenuItem className="h-5 min-h-0 gap-1 p-0 text-[14px] leading-5 text-[var(--color-gray-3)]" onClick={onUsage}>
                      <NavigationIcon name="usage" className="-m-1 scale-[0.666667]" />
                      {usageLabel}
                      <span className="ml-auto text-[13px] leading-[18px] text-[var(--color-gray-4)]">
                        {usageValue}
                      </span>
                    </DropdownMenuItem>
                  ) : (
                    <div className="flex h-8 items-center gap-2 px-2 text-sm">
                      <NavigationIcon name="usage" className="-m-1 scale-[0.666667]" />
                      <span>{usageLabel}</span>
                      <span className="ml-auto text-[13px] leading-[18px] text-[var(--color-gray-4)]">
                        {usageValue}
                      </span>
                    </div>
                  )}

                  {onBilling ? (
                    <DropdownMenuItem
                      className="h-10 justify-center gap-1 rounded-[10px] border border-[var(--button-primary-background)] bg-[var(--button-primary-background)] text-[15px] font-normal text-[var(--button-primary-foreground)] shadow-[var(--shadow-btn-primary-blue)] pl-3.5 pr-4 hover:bg-[var(--button-primary-background-hover)] hover:text-[var(--button-primary-foreground)] focus:bg-[var(--button-primary-background-hover)] focus:text-[var(--button-primary-foreground)]"
                      onClick={onBilling}
                    >
                      <NavigationIcon name="billing" />
                      {isProductFree ? "플랜 업그레이드" : "요금제 보기"}
                    </DropdownMenuItem>
                  ) : null}
                </div>
              )
            })}
          </div> : null}

          <DropdownMenuSeparator className="my-1 bg-[var(--color-gray-10)]" />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="min-h-0 rounded-[6px] px-3 py-2">
              <NavigationIcon name="language" />
              언어
              <span className="ml-auto text-[13px] leading-[18px] text-[var(--color-gray-4)]">
                {language === "ko-KR" ? "한국어" : language}
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48">
              <DropdownMenuRadioGroup
                value={language}
                onValueChange={setLanguage}
              >
                <DropdownMenuRadioItem value="ko-KR">
                  한국어
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="en-US">
                  English (US)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="en-GB">
                  English (UK)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="ja-JP">
                  日本語
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="de-DE">
                  Deutsch
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="fr-FR">
                  Français
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem className="min-h-0 rounded-[6px] px-3 py-2" onClick={onLogout}>
            <NavigationIcon name="logout" />
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {onSettings ? <SidebarMenuButton
        aria-label="설정"
        tooltip="설정"
        className="size-7 shrink-0 justify-center p-0 group-data-[collapsible=icon]:order-1"
        onClick={onSettings}
      >
        <NavigationIcon name="settings" />
        <span className="sr-only">설정</span>
      </SidebarMenuButton> : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            aria-label="고객 지원"
            tooltip="고객 지원"
            className="size-7 shrink-0 justify-center p-0 group-data-[collapsible=icon]:order-2"
          >
            <NavigationIcon name="help" />
            <span className="sr-only">고객 지원</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="end"
          sideOffset={8}
          className="flex w-60 flex-col gap-0.5 rounded-xl border border-[var(--color-gray-10)] p-2 shadow-[var(--shadow-modal)] ring-0"
        >
          <DropdownMenuLabel className="px-4 pt-1.5 pb-0.5 text-[12px] font-semibold text-muted-foreground">지원</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => openSupportMail("ECOYA 자주 묻는 질문 문의")}
          >
            자주 묻는 질문
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => openSupportMail("ECOYA 이용 가이드 문의")}
          >
            이용 가이드
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="px-4 pt-1.5 pb-0.5 text-[12px] font-semibold text-muted-foreground">정책</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => appLocation.assign("/legal/terms")}
          >
            이용 약관
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => appLocation.assign("/legal/privacy")}
          >
            개인정보 처리방침
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

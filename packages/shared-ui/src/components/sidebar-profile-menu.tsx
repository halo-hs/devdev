import { useState } from "react"
import {
  CircleHelp,
  CreditCard,
  Gauge,
  Languages,
  LogOut,
  Settings,
  UserRound,
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
}: {
  onSettings: () => void
  onUsage?: () => void
  onBilling?: () => void
  onLogout: () => void
  product?: "erp" | "snap"
  workspaceName?: string
  billingPlan?: string
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
    <SidebarMenuItem className="flex w-full min-w-0 items-center gap-1 group-data-[collapsible=icon]:w-auto">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip="프로필 메뉴"
            aria-label="프로필 메뉴"
            className="min-w-0 flex-1 text-sidebar-foreground/75"
          >
            <UserRound />
            <span className="min-w-0 truncate text-sm font-medium group-data-[collapsible=icon]:hidden">
              조민영
            </span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="start"
          sideOffset={8}
          className="w-72 bg-[var(--surface-background)] shadow-lg"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <div className="flex items-center gap-2">
                <UserRound className="size-4" />
                <span className="font-medium">조민영</span>
              </div>
              <div className="mt-1 font-normal text-muted-foreground">
                minyoung@ecoya.app · {workspaceName}
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          {isSidebarCollapsed ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={onSettings}>
                  <Settings />
                  설정
                </DropdownMenuItem>
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
                      onClick={() => window.location.assign("/legal/terms")}
                    >
                      이용 약관
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => window.location.assign("/legal/privacy")}
                    >
                      개인정보 처리방침
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuGroup>
            </>
          ) : null}
          <DropdownMenuSeparator />

          <div className="space-y-2 px-2">
            {productPlans.map(({ name, plan }) => {
              const isProductFree = plan.trim().toLowerCase() === "free"
              const usageLabel = isProductFree
                ? "조직 무료 사용량"
                : "조직 사용량"
              const usageValue = isProductFree ? "10회 남음" : "7일 남음"

              return (
                <div
                  key={name}
                  className="rounded-[var(--r-md)] border border-[var(--surface-border)] p-2.5"
                >
                  <div className="flex items-center gap-2 px-1 pb-1.5">
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                      {name}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {plan}
                    </span>
                  </div>

                  {onUsage ? (
                    <DropdownMenuItem className="px-2" onClick={onUsage}>
                      <Gauge />
                      {usageLabel}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {usageValue}
                      </span>
                    </DropdownMenuItem>
                  ) : (
                    <div className="flex h-8 items-center gap-2 px-2 text-sm">
                      <Gauge className="size-4" />
                      <span>{usageLabel}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {usageValue}
                      </span>
                    </div>
                  )}

                  {onBilling ? (
                    <DropdownMenuItem
                      className="mt-1 justify-center border border-[var(--button-outline-border)] bg-[var(--button-outline-background)] font-medium shadow-[var(--shadow-btn-tertiary-black)]"
                      onClick={onBilling}
                    >
                      <CreditCard />
                      {isProductFree ? "플랜 업그레이드" : "요금제 보기"}
                    </DropdownMenuItem>
                  ) : null}
                </div>
              )
            })}
          </div>

          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Languages />
              언어
              <span className="mr-2 ml-auto text-xs text-muted-foreground">
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
          <DropdownMenuItem onClick={onLogout}>
            <LogOut />
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SidebarMenuButton
        aria-label="설정"
        tooltip="설정"
        className="size-8 shrink-0 justify-center p-0 group-data-[collapsible=icon]:hidden"
        onClick={onSettings}
      >
        <Settings />
        <span className="sr-only">설정</span>
      </SidebarMenuButton>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            aria-label="고객 지원"
            tooltip="고객 지원"
            className="size-8 shrink-0 justify-center p-0 group-data-[collapsible=icon]:hidden"
          >
            <CircleHelp />
            <span className="sr-only">고객 지원</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="end"
          sideOffset={8}
          className="w-48"
        >
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
          <DropdownMenuItem
            onClick={() => window.location.assign("/legal/terms")}
          >
            이용 약관
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => window.location.assign("/legal/privacy")}
          >
            개인정보 처리방침
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

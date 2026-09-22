"use client";

import Link from "@trade-os/reference-3030/compat/link";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { cx } from "./utils";
import { Button } from "./button";
import { Icon } from "./icon";

export type NavView = "expand" | "collapse";
type NavState = "default" | "hover" | "selected";
export type NavSideNavItemKey = string;
export type NavLanguageOption = {
  label: string;
  value: string;
};

type WorkspaceBadgeProps = {
  className?: string;
  size?: "md" | "sm";
  tone?: "blue3" | "blue4" | "blue5" | "blue6";
};

const workspaceBadgeTone = {
  blue3: "bg-ecoya-blue-3",
  blue4: "bg-ecoya-blue-4",
  blue5: "bg-ecoya-blue-5",
  blue6: "bg-ecoya-blue-6",
} as const;

function WorkspaceBadge({
  className,
  size = "md",
  tone = "blue3",
}: WorkspaceBadgeProps) {
  return (
    <span
      className={cx(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[4px] font-bold text-[color:var(--ecoya-gray-12)]",
        size === "md" ? "size-6 text-body-17" : "size-5 text-[14px] leading-[21px]",
        workspaceBadgeTone[tone],
        className,
      )}
    >
      E
    </span>
  );
}

function ProfileBadge({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-[40px] bg-ecoya-indigo text-body-14 font-medium text-[color:var(--ecoya-gray-12)]",
        className,
      )}
    >
      E
    </span>
  );
}

type NavMenuItemProps = {
  ariaLabel?: string;
  ariaCurrent?: "page";
  children?: ReactNode;
  className?: string;
  href?: string;
  iconName?: string;
  onClick?: () => void;
  rightIcon?: boolean;
  state?: NavState;
  view?: NavView;
};

export function NavMenuItem({
  ariaLabel,
  ariaCurrent,
  children,
  className,
  href,
  iconName = "icon-logout",
  onClick,
  rightIcon = false,
  state = "default",
  view = "expand",
}: NavMenuItemProps) {
  const isCollapse = view === "collapse";
  const isActive = state !== "default";
  const itemClassName = cx(
    "flex h-9 shrink-0 items-center rounded-[8px] px-3 py-2 text-body-16 font-medium text-[color:var(--ecoya-gray-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ecoya-blue-4",
    isCollapse ? "w-11 justify-center" : "w-[236px] gap-3",
    isActive && "bg-ecoya-gray-10",
    className,
  );
  const content = (
    <>
      <Icon className="size-5 text-ecoya-gray-3" name={iconName} />
      {!isCollapse ? (
        <>
          <span className="min-w-0 flex-1 truncate">{children}</span>
          {rightIcon ? (
            <Icon className="size-5 text-ecoya-gray-6" name="icon-chevron-right" />
          ) : null}
        </>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link
        aria-current={ariaCurrent}
        aria-label={ariaLabel}
        className={itemClassName}
        data-ui="nav-menu-item"
        href={href}
      >
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        aria-label={ariaLabel}
        className={itemClassName}
        data-ui="nav-menu-item"
        onClick={onClick}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={itemClassName}
      data-ui="nav-menu-item"
    >
      {content}
    </div>
  );
}

type NavWorkspaceItemProps = {
  className?: string;
  label?: string;
  rightIcon?: boolean;
  state?: NavState;
  view?: NavView;
};

export function NavWorkspaceItem({
  className,
  label = "",
  rightIcon = true,
  state = "selected",
  view = "expand",
}: NavWorkspaceItemProps) {
  const isCollapse = view === "collapse";
  const isActive = state !== "default";

  return (
    <div
      className={cx(
        "flex shrink-0 items-center rounded-[8px]",
        isCollapse
          ? "h-[42px] w-11 justify-center py-2"
          : "h-[42px] w-[236px] justify-center gap-3 px-[13px] py-2",
        isActive && "bg-ecoya-gray-12",
        className,
      )}
      data-ui="nav-workspace-item"
    >
      <WorkspaceBadge />
      {!isCollapse ? (
        <>
          <span className="min-w-0 flex-1 truncate text-body-17 font-bold text-[color:var(--ecoya-gray-2)]">
            {label}
          </span>
          {rightIcon ? (
            <Icon className="size-5 text-ecoya-gray-2" name="icon-chevron-down" />
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export function NavProfileItem({
  className,
  label = "",
  state = "default",
  view = "expand",
}: {
  className?: string;
  label?: string;
  state?: NavState;
  view?: NavView;
}) {
  const isCollapse = view === "collapse";

  return (
    <div
      className={cx(
        "flex shrink-0 rounded-[8px] py-2",
        isCollapse
          ? "w-11 items-center justify-center px-2.5"
          : "min-w-0 flex-1 items-center gap-2.5 pl-2.5 pr-3",
        state === "selected" && "bg-ecoya-gray-10",
        className,
      )}
      data-ui="nav-profile-item"
    >
      <ProfileBadge />
      {!isCollapse ? (
        <span className="min-w-0 flex-1 truncate text-body-16 font-medium text-[color:var(--ecoya-gray-2)]">
          {label}
        </span>
      ) : null}
    </div>
  );
}

function ProductLogo({ label = "ECOYA SNAP" }: { label?: string }) {
  const hasEcoyaPrefix = label.startsWith("ECOYA");
  const suffix = hasEcoyaPrefix ? label.slice("ECOYA".length) : ` ${label}`;

  return (
    <div
      aria-label={label}
      className="flex h-[18px] w-[180px] shrink-0 items-center text-[0]"
      data-ui="nav-logo"
    >
      <span className="text-[17px] font-extrabold leading-[18px] tracking-[-0.4px] text-ecoya-blue-4">
        {hasEcoyaPrefix ? "ECO" : label}
      </span>
      {hasEcoyaPrefix ? (
        <>
          <span className="mx-0.5 inline-flex size-[17px] items-center justify-center rounded-full bg-ecoya-blue-4 text-[10px] font-extrabold leading-none text-ecoya-gray-12">
            Y
          </span>
          <span className="text-[17px] font-extrabold leading-[18px] tracking-[-0.4px] text-ecoya-gray-1">
            {`A${suffix}`}
          </span>
        </>
      ) : null}
    </div>
  );
}

export type NavSideNavProps = {
  activeItem?: NavSideNavItemKey;
  brandLabel?: string;
  className?: string;
  hrefs?: Partial<Record<NavSideNavItemKey, string>>;
  interactionCase?: "none" | "tooltip" | "submenu";
  labels: NavSideNavLabels;
  languageOptions?: NavLanguageOption[];
  onLanguageSelect?: (value: string) => void;
  onToggleSidebar?: () => void;
  profileLabel?: string;
  profileSubMenu?: NavProfileSubMenuContent;
  selectedLanguage?: string;
  showSettingsItem?: boolean;
  showWorkspaceItem?: boolean;
  view?: NavView;
  workspaceLabel?: string;
};

export type NavSideNavLabels = {
  createLoading: string;
  help: string;
  language: string;
  loadingList: string;
  settings: string;
  toggleSidebar: string;
  workspaceCreate: string;
};

export type NavSubMenuItem = {
  checked?: boolean;
  highlighted?: boolean;
  label: ReactNode;
  rightIcon?: string;
};

export type NavWorkspaceSubMenuItem = {
  checked?: boolean;
  highlighted?: boolean;
  label: ReactNode;
  tone?: WorkspaceBadgeProps["tone"];
};

export type NavProfileSubMenuContent = {
  creditPrefix?: ReactNode;
  creditValue?: ReactNode;
  email?: ReactNode;
  logoutLabel?: ReactNode;
  planLabel?: ReactNode;
  primaryActionLabel?: ReactNode;
  primaryActionVariant?: "primary" | "secondary";
  workspaceLabel?: ReactNode;
  workspaceTone?: WorkspaceBadgeProps["tone"];
};

export function NavSideNav({
  activeItem,
  brandLabel,
  className,
  hrefs,
  interactionCase = "none",
  labels,
  languageOptions,
  onLanguageSelect,
  onToggleSidebar,
  profileLabel = "",
  profileSubMenu,
  selectedLanguage,
  showSettingsItem = true,
  showWorkspaceItem = true,
  view = "expand",
  workspaceLabel = "",
}: NavSideNavProps) {
  const isCollapse = view === "collapse";
  const showTooltips = isCollapse;
  const showSubmenu = isCollapse && interactionCase === "submenu";
  const [languageOpen, setLanguageOpen] = useState(false);
  const languageCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFlyout = Boolean(languageOptions?.length) || showSubmenu || showTooltips;
  const showLanguageSubmenu = languageOpen && languageOptions && languageOptions.length > 0;
  const getItemState = (key: NavSideNavItemKey, fallbackState: NavState = "default") =>
    activeItem === key ? "selected" : fallbackState;
  const handleLanguageMouseEnter = () => {
    if (languageCloseTimer.current) {
      clearTimeout(languageCloseTimer.current);
      languageCloseTimer.current = null;
    }
    setLanguageOpen(true);
  };
  const handleLanguageMouseLeave = () => {
    languageCloseTimer.current = setTimeout(() => {
      setLanguageOpen(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (languageCloseTimer.current) {
        clearTimeout(languageCloseTimer.current);
      }
    };
  }, []);

  return (
    <aside
      className={cx(
        "sticky top-0 z-30 flex h-screen max-h-screen shrink-0 self-start flex-col items-start gap-4 border-r border-ecoya-gray-10 bg-ecoya-gray-11 py-4",
        isCollapse ? "w-[68px]" : "w-[260px]",
        hasFlyout ? "overflow-visible" : "overflow-hidden",
        className,
      )}
      data-ui="nav-side-nav"
    >
      <div className="flex min-h-0 w-full flex-1 flex-col items-start gap-4 px-3">
        <div className={cx("flex shrink-0 flex-col items-start gap-1", isCollapse ? "justify-center" : "w-full")}>
          {isCollapse ? (
            <>
              <div className="group relative mt-[7px]">
                <NavMenuItem
                  ariaLabel={labels.toggleSidebar}
                  iconName="icon-slide"
                  onClick={onToggleSidebar}
                  view="collapse"
                />
                {showTooltips ? <NavTooltip>{labels.toggleSidebar}</NavTooltip> : null}
              </div>
              {showWorkspaceItem ? (
                <div className="group relative">
                  <NavWorkspaceItem
                    label={workspaceLabel}
                    state={showTooltips ? "selected" : "default"}
                    view="collapse"
                  />
                  {showTooltips ? <NavTooltip>{labels.workspaceCreate}</NavTooltip> : null}
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="flex w-full items-center gap-2 rounded-[32px] py-[7px] pl-4">
                <div className="min-w-0 flex-1">
                  <ProductLogo label={brandLabel} />
                </div>
                <NavMenuItem
                  ariaLabel={labels.toggleSidebar}
                  className="w-11"
                  iconName="icon-slide"
                  onClick={onToggleSidebar}
                  view="collapse"
                />
              </div>
              {showWorkspaceItem ? <NavWorkspaceItem label={workspaceLabel} /> : null}
            </>
          )}
        </div>

        <div className={cx("flex min-h-0 flex-1 flex-col items-start gap-2", isCollapse ? null : "w-full")}>
          <div className={cx("group relative", isCollapse ? null : "w-full")}>
            <NavMenuItem
              ariaCurrent={activeItem === "createLoading" ? "page" : undefined}
              ariaLabel={labels.createLoading}
              href={hrefs?.createLoading}
              iconName="icon-compose"
              state={getItemState("createLoading")}
              view={view}
            >
              {labels.createLoading}
            </NavMenuItem>
            {showTooltips ? <NavTooltip>{labels.createLoading}</NavTooltip> : null}
          </div>
          <div className={cx("group relative", isCollapse ? null : "w-full")}>
            <NavMenuItem
              ariaCurrent={activeItem === "loadingList" ? "page" : undefined}
              ariaLabel={labels.loadingList}
              href={hrefs?.loadingList}
              iconName="icon-container"
              state={getItemState("loadingList", isCollapse && interactionCase !== "none" ? "selected" : "default")}
              view={view}
            >
              {labels.loadingList}
            </NavMenuItem>
            {showTooltips ? <NavTooltip>{labels.loadingList}</NavTooltip> : null}
          </div>
        </div>

        <div className={cx("flex shrink-0 flex-col items-start gap-2", isCollapse ? null : "w-[236px]")}>
          {showSettingsItem ? (
            <div className={cx("group relative", isCollapse ? null : "w-full")}>
              <NavMenuItem
                ariaCurrent={activeItem === "settings" ? "page" : undefined}
                ariaLabel={labels.settings}
                href={hrefs?.settings}
                iconName="icon-setting"
                state={getItemState("settings")}
                view={view}
              >
                {labels.settings}
              </NavMenuItem>
              {showTooltips ? <NavTooltip>{labels.settings}</NavTooltip> : null}
            </div>
          ) : null}
          <div
            className={cx("group relative", isCollapse ? null : "w-full")}
            onMouseEnter={handleLanguageMouseEnter}
            onMouseLeave={handleLanguageMouseLeave}
          >
            <NavMenuItem
              ariaCurrent={activeItem === "language" ? "page" : undefined}
              ariaLabel={labels.language}
              href={hrefs?.language}
              iconName="icon-global"
              state={getItemState("language", showLanguageSubmenu ? "selected" : "default")}
              view={view}
            >
              {labels.language}
            </NavMenuItem>
            {showLanguageSubmenu ? (
              <div onMouseEnter={handleLanguageMouseEnter} onMouseLeave={handleLanguageMouseLeave}>
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-full h-9 w-2"
                  data-ui="nav-sub-menu-bridge"
                />
                <NavSubMenu
                  className="absolute bottom-0 left-full z-(--ecoya-z-dropdown) ml-2"
                  languageOptions={languageOptions}
                  onLanguageSelect={onLanguageSelect}
                  selectedLanguage={selectedLanguage}
                  variant="language"
                />
              </div>
            ) : showTooltips ? (
              <NavTooltip>{labels.language}</NavTooltip>
            ) : null}
          </div>
          <div className={cx("group relative", isCollapse ? null : "w-full")}>
            <NavMenuItem
              ariaCurrent={activeItem === "help" ? "page" : undefined}
              ariaLabel={labels.help}
              href={hrefs?.help}
              iconName="icon-lightbulb"
              state={getItemState("help")}
              view={view}
            >
              {labels.help}
            </NavMenuItem>
            {showTooltips ? <NavTooltip>{labels.help}</NavTooltip> : null}
          </div>
        </div>
      </div>

      <div className="h-px w-full shrink-0 bg-ecoya-gray-9" />

      <div className={cx("group relative flex w-full shrink-0 px-3", isCollapse ? "flex-col items-start" : "items-center gap-3")}>
        <NavProfileItem label={profileLabel} state={showSubmenu ? "selected" : "default"} view={view} />
        {showSubmenu && profileSubMenu ? (
          <NavSubMenu
            className="absolute bottom-0 left-16"
            profile={profileSubMenu}
            variant="profile-free"
          />
        ) : null}
      </div>
    </aside>
  );
}

function NavTooltip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        // z-20: side-nav 플라이아웃 컨텍스트 내부 상대값 — 외부 전역 토큰과 무관.
        // nav 아이콘(z-10 등) 위에 툴팁이 표시되도록 충분한 낮은 상대값. 값 변경 불필요.
        "absolute left-full top-1/2 z-20 ml-2 flex h-7 -translate-y-1/2 items-center justify-center overflow-hidden rounded-[8px] bg-ecoya-indigo px-3 py-1 text-body-13 font-regular text-[color:var(--ecoya-gray-12)] whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100",
        className,
      )}
      data-ui="nav-tooltip"
    >
      {children}
    </div>
  );
}

export type NavSubMenuProps = {
  className?: string;
  helpItems?: Array<NavSubMenuItem>;
  languageOptions?: NavLanguageOption[];
  languageItems?: Array<NavSubMenuItem>;
  onLanguageSelect?: (value: string) => void;
  profile?: NavProfileSubMenuContent;
  selectedLanguage?: string;
  variant?: "profile-free" | "profile-pay" | "language" | "help" | "workspace";
  workspaceItems?: Array<NavWorkspaceSubMenuItem>;
};

const emptySubMenuItems: Array<NavSubMenuItem> = [];
const emptyWorkspaceSubMenuItems: Array<NavWorkspaceSubMenuItem> = [];

export function NavSubMenu({
  className,
  helpItems = emptySubMenuItems,
  languageOptions,
  languageItems = emptySubMenuItems,
  onLanguageSelect,
  profile,
  selectedLanguage,
  variant = "profile-free",
  workspaceItems = emptyWorkspaceSubMenuItems,
}: NavSubMenuProps) {
  if (variant === "language") {
    if (languageOptions && languageOptions.length > 0) {
      return (
        <MenuPanel className={className} heightClass="h-auto">
          {languageOptions.map((option) => (
            <SubMenuActionRow
              checked={selectedLanguage === option.value}
              key={option.value}
              onClick={() => onLanguageSelect?.(option.value)}
            >
              {option.label}
            </SubMenuActionRow>
          ))}
        </MenuPanel>
      );
    }

    if (languageItems.length === 0) return null;

    return (
      <MenuPanel className={className} heightClass="h-[100px]">
        {languageItems.map((item, index) => (
          <SubMenuRow
            checked={item.checked}
            highlighted={item.highlighted}
            key={index}
            rightIcon={item.rightIcon}
          >
            {item.label}
          </SubMenuRow>
        ))}
      </MenuPanel>
    );
  }

  if (variant === "help") {
    if (helpItems.length === 0) return null;

    return (
      <MenuPanel className={className} heightClass="h-[180px]">
        {helpItems.map((item, index) => (
          <SubMenuRow
            checked={item.checked}
            highlighted={item.highlighted}
            key={index}
            rightIcon={item.rightIcon}
          >
            {item.label}
          </SubMenuRow>
        ))}
      </MenuPanel>
    );
  }

  if (variant === "workspace") {
    if (workspaceItems.length === 0) return null;

    return (
      <MenuPanel className={className} heightClass="h-[196px]">
        {workspaceItems.map((item, index) => (
          <SubMenuWorkspace
            checked={item.checked}
            highlighted={item.highlighted}
            key={index}
            label={item.label}
            tone={item.tone ?? "blue3"}
          />
        ))}
      </MenuPanel>
    );
  }

  if (!profile) return null;

  const profileContent = {
    creditPrefix: profile?.creditPrefix ?? "",
    creditValue: profile?.creditValue ?? "",
    email: profile?.email ?? "",
    logoutLabel: profile?.logoutLabel ?? "",
    planLabel: profile?.planLabel ?? "",
    primaryActionLabel: profile?.primaryActionLabel ?? "",
    primaryActionVariant: profile?.primaryActionVariant ?? (variant === "profile-pay" ? "secondary" : "primary"),
    workspaceLabel: profile?.workspaceLabel ?? "",
    workspaceTone: profile?.workspaceTone ?? "blue3",
  } satisfies Required<NavProfileSubMenuContent>;

  return (
    <MenuPanel className={className} heightClass="h-[256px]">
      <div className="flex w-full flex-col items-start justify-center rounded-[8px] px-3 py-1">
        <span className="h-5 w-full truncate text-body-13 font-regular text-[color:var(--ecoya-gray-6)]">
          {profileContent.email}
        </span>
      </div>
      <div className="flex w-full flex-col items-start justify-center rounded-[8px] px-3 pb-1 pt-2">
        <div className="flex w-full items-center gap-3">
          <WorkspaceBadge size="sm" tone={profileContent.workspaceTone} />
          <span className="min-w-0 flex-1 truncate text-body-16 font-medium text-[color:var(--ecoya-gray-2)]">
            {profileContent.workspaceLabel}
          </span>
        </div>
        <span className="pl-8 text-body-13 font-regular text-[color:var(--ecoya-gray-6)]">
          {profileContent.planLabel}
        </span>
      </div>
      <div className="flex w-full items-center gap-3 rounded-[8px] px-3 py-2">
        <Icon className="size-5 text-ecoya-gray-3" name="icon-credit" />
        <span className="text-body-16 font-medium text-[color:var(--ecoya-gray-2)]">
          {profileContent.creditPrefix}
        </span>
        <span className="text-body-16 font-medium text-[color:var(--ecoya-blue-3)]">
          {profileContent.creditValue}
        </span>
      </div>
      <div className="w-full px-3 py-2">
        <Button className="w-full" size="lg" variant={profileContent.primaryActionVariant}>
          {profileContent.primaryActionLabel}
        </Button>
      </div>
      <NavMenuItem className="w-full" iconName="icon-logout" rightIcon view="expand">
        {profileContent.logoutLabel}
      </NavMenuItem>
    </MenuPanel>
  );
}

function MenuPanel({
  children,
  className,
  heightClass,
}: {
  children: ReactNode;
  className?: string;
  heightClass: string;
}) {
  return (
    <div
      className={cx(
        "flex w-60 shrink-0 flex-col items-start gap-1 rounded-[12px] border border-ecoya-gray-8 bg-ecoya-gray-12 px-1 py-3 shadow-[var(--ecoya-shadow-filter)]",
        heightClass,
        className,
      )}
      data-ui="nav-sub-menu"
    >
      {children}
    </div>
  );
}

function SubMenuRow({
  checked = false,
  children,
  highlighted = false,
  rightIcon,
}: {
  checked?: boolean;
  children: ReactNode;
  highlighted?: boolean;
  rightIcon?: string;
}) {
  return (
    <div
      className={cx(
        "flex h-9 w-full shrink-0 items-center gap-3 rounded-[8px] px-3 py-2 text-body-16 font-medium text-[color:var(--ecoya-gray-2)]",
        highlighted && "bg-ecoya-gray-10",
      )}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {checked ? <Icon className="size-5 text-ecoya-blue-4" name="icon-checkmark" /> : null}
      {rightIcon ? <Icon className="size-5 text-ecoya-gray-6" name={rightIcon} /> : null}
    </div>
  );
}

function SubMenuActionRow({
  checked = false,
  children,
  onClick,
}: {
  checked?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      className="flex h-9 w-full shrink-0 items-center gap-3 rounded-[8px] px-3 py-2 text-left text-body-16 font-medium text-[color:var(--ecoya-gray-2)] hover:bg-ecoya-gray-10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ecoya-blue-4"
      onClick={onClick}
      type="button"
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {checked ? <Icon className="size-5 text-ecoya-blue-4" name="icon-checkmark" /> : null}
    </button>
  );
}

function SubMenuWorkspace({
  checked = false,
  highlighted = false,
  label,
  tone,
}: {
  checked?: boolean;
  highlighted?: boolean;
  label: ReactNode;
  tone: WorkspaceBadgeProps["tone"];
}) {
  return (
    <div
      className={cx(
        "flex w-full shrink-0 items-center gap-2.5 rounded-[8px] py-2 pl-2.5 pr-3",
        highlighted && "bg-ecoya-gray-10",
      )}
    >
      <WorkspaceBadge tone={tone} />
      <span className="min-w-0 flex-1 truncate text-body-16 font-medium text-[color:var(--ecoya-gray-2)]">
        {label}
      </span>
      {checked ? <Icon className="size-5 text-ecoya-blue-4" name="icon-checkmark" /> : null}
    </div>
  );
}

import type { ReactNode } from "react";

import { cx } from "./utils";

export type HeaderVariant = "onlyLogo" | "default" | "login";

export type HeaderProps = {
  variant?: HeaderVariant;
  logo: ReactNode;
  navigation?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export type HeaderTitleProps = {
  children: ReactNode;
  className?: string;
};

export type HeaderSubTitleProps = {
  children: ReactNode;
  className?: string;
};

const headerClassName: Record<HeaderVariant, string> = {
  onlyLogo:
    "flex w-full flex-col items-center justify-center bg-ecoya-gray-12 px-[10px] py-8",
  default:
    "flex h-20 w-full items-center justify-center gap-[10px] bg-ecoya-gray-12 px-10 py-5",
  login:
    "flex h-20 w-full items-center justify-center gap-[10px] bg-ecoya-gray-12 px-10 py-5 shadow-[0_1px_1px_rgba(0,0,0,0.06)]",
};

function sideSectionClassName(fixedWidth: boolean) {
  return cx(
    "flex h-full max-h-10 flex-col items-start justify-center",
    fixedWidth ? "w-[280px] shrink-0" : "min-h-0 min-w-0 flex-1",
  );
}

export function Header({
  actions,
  className,
  logo,
  navigation,
  variant = "onlyLogo",
}: HeaderProps) {
  if (variant === "onlyLogo") {
    return (
      <header className={cx(headerClassName.onlyLogo, className)}>
        {logo}
      </header>
    );
  }

  const fixedSideWidth = variant === "default";

  return (
    <header className={cx(headerClassName[variant], className)}>
      <div className={sideSectionClassName(fixedSideWidth)}>{logo}</div>
      {fixedSideWidth && navigation ? (
        <nav className="flex h-full max-h-10 min-h-0 min-w-0 flex-1 items-center justify-center gap-8 pl-4">
          {navigation}
        </nav>
      ) : null}
      {actions ? (
        <div
          className={cx(
            "flex max-h-10 items-center justify-end gap-6",
            fixedSideWidth ? "w-[280px] shrink-0" : "min-h-0 min-w-0 flex-1",
          )}
        >
          {actions}
        </div>
      ) : null}
    </header>
  );
}

export function HeaderTitle({ children, className }: HeaderTitleProps) {
  return (
    <div className={cx("flex w-full max-w-[800px] items-center justify-center py-6", className)}>
      <h1 className="m-0 whitespace-nowrap text-center text-header-36 font-bold text-[color:var(--ecoya-gray-1)]">
        {children}
      </h1>
    </div>
  );
}

export function HeaderSubTitle({ children, className }: HeaderSubTitleProps) {
  return (
    <div className={cx("flex w-full max-w-[800px] items-center justify-center py-2", className)}>
      <p className="m-0 whitespace-nowrap text-center text-body-17 font-regular leading-[24px] text-[color:var(--ecoya-gray-4)]">
        {children}
      </p>
    </div>
  );
}

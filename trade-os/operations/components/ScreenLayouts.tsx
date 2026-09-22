import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { PageHeader } from "@trade-os/operations/components/PageHeader";
import { cx } from "@trade-os/operations/components/ui/utils";

type PageTitleBarProps = Omit<ComponentProps<"header">, "title"> & {
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
};

type ScreenLayoutProps = ComponentProps<"section"> & {
  titleBar: ReactNode;
  children: ReactNode;
};

type SettingsLayoutProps = Omit<ComponentProps<"section">, "title"> & {
  titleBar?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
};

type BodyProps = ComponentProps<"div"> & {
  maxWidth?: number | "none";
};

function PageTitleBar({ title, description, meta, action, className, ...props }: PageTitleBarProps) {
  return (
    <PageHeader
      actions={action}
      className={className}
      data-component="PageTitleBar"
      data-source="design-system/src/components/platform/ScreenLayouts.tsx"
      description={description}
      meta={meta}
      title={title}
      {...props}
    />
  );
}

// erp-v2 deviation: the canonical class was `min-h-full`, which lets the section
// grow to content height so the inner `flex-1 min-h-0 overflow-y-auto` body never
// bounds to the shell and never scrolls in place (content overflows the viewport).
// `h-full min-h-0` gives the section a definite bounded height — matching the
// already-correct WorkbenchLayout below — so the inner body scrolls as designed.
const layoutRootClass =
  "flex h-full min-h-0 flex-col bg-ecoya-gray-12 max-sm:h-auto max-sm:min-h-0";
const scrollableBodyClass =
  "min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:auto] max-sm:flex-none max-sm:overflow-visible";

function ConstrainedBody({ maxWidth = 1440, className, children, ...props }: BodyProps) {
  const isNone = maxWidth === "none";
  const style: CSSProperties = {
    maxWidth: isNone ? "none" : `${maxWidth}px`,
    minWidth: isNone ? "0" : "min(100%, 1180px)",
  };

  return (
    <div
      className={cx("mx-auto grid w-full gap-4 px-7 pb-14 pt-6", className)}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}

function ListPageLayout({ titleBar, children, className, ...props }: ScreenLayoutProps) {
  return (
    <section className={cx(layoutRootClass, className)} data-layout="list-page" {...props}>
      {titleBar}
      <div className={scrollableBodyClass}>
        <ConstrainedBody>{children}</ConstrainedBody>
      </div>
    </section>
  );
}

function DashboardLayout({ titleBar, children, className, ...props }: ScreenLayoutProps) {
  return (
    <section className={cx(layoutRootClass, className)} data-layout="dashboard" {...props}>
      {titleBar}
      <div className={scrollableBodyClass}>
        <ConstrainedBody maxWidth="none" className="reference-content-width" data-ui="dashboard-body">{children}</ConstrainedBody>
      </div>
    </section>
  );
}

function DetailPageLayout({ titleBar, children, className, ...props }: ScreenLayoutProps) {
  return (
    <section className={cx(layoutRootClass, className)} data-layout="detail-page" {...props}>
      {titleBar}
      <div className={scrollableBodyClass}>
        <ConstrainedBody maxWidth="none">{children}</ConstrainedBody>
      </div>
    </section>
  );
}

function SettingsLayout({ titleBar, title, description, meta, action, children, className, ...props }: SettingsLayoutProps) {
  return (
    <section className={cx(layoutRootClass, className)} data-layout="settings" {...props}>
      {titleBar ?? <PageTitleBar action={action} description={description} meta={meta} title={title} />}
      <div className={scrollableBodyClass}>
        <ConstrainedBody>{children}</ConstrainedBody>
      </div>
    </section>
  );
}

function WorkbenchLayout({ titleBar, children, className, ...props }: ScreenLayoutProps) {
  return (
    <section
      className={cx("flex h-full min-h-0 flex-col bg-ecoya-gray-12", className)}
      data-layout="workbench"
      {...props}
    >
      {titleBar}
      {children}
    </section>
  );
}

function ScreenBody({ maxWidth, children, ...props }: BodyProps) {
  return (
    <ConstrainedBody maxWidth={maxWidth ?? 1440} {...props}>
      {children}
    </ConstrainedBody>
  );
}

export {
  DashboardLayout,
  DetailPageLayout,
  ListPageLayout,
  PageTitleBar,
  ScreenBody,
  SettingsLayout,
  WorkbenchLayout,
};
export type { PageTitleBarProps, ScreenLayoutProps, SettingsLayoutProps };

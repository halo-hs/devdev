import type { ComponentProps, ReactNode } from "react";

import { cx } from "@trade-os/operations/components/ui/utils";

type PageHeaderProps = Omit<ComponentProps<"header">, "title"> & {
  variant?: "default" | "hero";
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  filters?: ReactNode;
  summary?: ReactNode;
};

function PageHeader({ variant = "default", title, description, meta, actions, filters, summary, className, style, ...props }: PageHeaderProps) {
  const header = (
    <header
      className={cx(
        "grid min-h-[76px] flex-none grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border-muted bg-surface px-7 py-4",
        variant === "hero" && "relative isolate overflow-hidden rounded-hero-radius border-0 shadow-section max-sm:grid-cols-1 [&>div]:relative [&>div]:z-10 [&_h1]:text-[color:var(--ecoya-hero-foreground)] [&_p]:text-[color:var(--ecoya-hero-description)]",
        className,
      )}
      data-component="PageHeader"
      data-variant={variant}
      style={variant === "hero" ? { backgroundImage: "var(--ecoya-hero-gradient-small)", ...style } : style}
      {...props}
    >
      {variant === "hero" ? (
        <span aria-hidden="true" className="reference-hero-decoration">
          <span className="pointer-events-none absolute -right-12 -top-24 size-64 rounded-full border-[36px] border-white/5" />
        </span>
      ) : null}
      <div className="min-w-0">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <h1 className="m-0 text-header-24 font-bold text-text-primary">{title}</h1>
          {meta ? (
            <div className="text-label-12 font-semibold uppercase tracking-[0.04em] text-text-disabled">
              {meta}
            </div>
          ) : null}
        </div>
        {description ? (
          <p className="mb-0 mt-1 text-body-14 font-regular text-text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className={cx("inline-flex items-center justify-end gap-2", variant === "hero" && "flex-wrap max-sm:justify-start")}>{actions}</div> : null}
      {filters ? <div className="reference-hero-filters">{filters}</div> : null}
    </header>
  );
  return summary ? (
    <div className="reference-hero-group">
      {header}
      <div className="reference-hero-summary">{summary}</div>
    </div>
  ) : header;
}

export { PageHeader };
export type { PageHeaderProps };

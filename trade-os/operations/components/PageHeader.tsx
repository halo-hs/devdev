import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

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
      className={cn(
        "grid min-h-[76px] flex-none grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-[var(--color-gray-10)] bg-[var(--color-gray-12)] px-7 py-4",
        // Figma HeroBanner (결산리포트 v6 · 5789:54378): 26/30/20 padding, radius 22,
        // title Bold 20/28, description 15/22.
        variant === "hero" && "relative isolate gap-y-2 overflow-hidden rounded-[22px] border-0 px-[30px] pt-[26px] pb-5 shadow-section max-sm:grid-cols-1 max-sm:px-5 [&>div]:relative [&>div]:z-10 [&_h1]:text-[color:var(--ecoya-hero-foreground)] [&_p]:text-[color:var(--ecoya-hero-description)]",
        className,
      )}
      data-component="PageHeader"
      data-variant={variant}
      style={variant === "hero" ? { backgroundImage: "var(--ecoya-hero-gradient-small)", ...style } : style}
      {...props}
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <h1 className={cn("m-0 font-bold text-[var(--color-gray-2)]", variant === "hero" ? "text-[20px] leading-7" : "text-[length:var(--text-body-2)] leading-[var(--leading-body-2)]")}>{title}</h1>
          {meta ? (
            <div className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] font-semibold uppercase tracking-[0.04em] text-[var(--color-gray-6)]">
              {meta}
            </div>
          ) : null}
        </div>
        {description ? (
          <p className={cn("mb-0 mt-1 font-normal text-[var(--color-gray-5)]", variant === "hero" ? "text-[15px] leading-[22px]" : "text-[length:var(--text-body-9)] leading-[var(--leading-body-9)]")}>{description}</p>
        ) : null}
      </div>
      {actions ? <div className={cn("inline-flex items-center justify-end gap-2", variant === "hero" && "flex-wrap max-sm:justify-start")}>{actions}</div> : null}
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

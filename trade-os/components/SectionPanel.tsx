import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

type PanelSurface = "neutral" | "information" | "warning" | "danger";
type PanelDensity = "default" | "compact";
type PanelHeaderSurface = "plain" | "muted";

type SectionPanelProps = Omit<ComponentProps<"section">, "title"> & {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  surface?: PanelSurface;
  density?: PanelDensity;
  headerSurface?: PanelHeaderSurface;
  scrollArea?: boolean;
  scrollHeight?: number | string;
  children?: ReactNode;
  contentProps?: ComponentProps<"div">;
};

const surfaceClass: Record<PanelSurface, string> = {
  neutral: "bg-[var(--color-gray-12)] border-[var(--color-gray-10)]",
  information: "bg-[var(--color-gray-12)] border-[var(--color-primary-9)]",
  warning: "bg-[var(--color-gray-12)] border-[var(--color-yellow-5)]",
  danger: "bg-[var(--color-gray-12)] border-[var(--color-red-7)]",
};

function SectionPanel({
  title,
  description,
  action,
  surface = "neutral",
  density = "default",
  headerSurface = "plain",
  scrollArea = false,
  scrollHeight,
  children,
  contentProps,
  className,
  ...props
}: SectionPanelProps) {
  const resolvedHeight: CSSProperties["height"] =
    typeof scrollHeight === "number" ? `${scrollHeight}px` : (scrollHeight ?? "320px");

  return (
    <section
      className={cn(
        "gap-0 overflow-hidden rounded-lg border p-0 text-[var(--color-gray-2)] shadow-section",
        surfaceClass[surface],
        className,
      )}
      data-ui="section-panel"
      {...props}
    >
      {(title || description || action) && (
        <header
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-gray-10)]",
            density === "compact" ? "min-h-11 px-3.5 py-2.5" : "min-h-12 px-5 py-3",
            headerSurface === "muted" ? "bg-[var(--color-gray-11)]" : "bg-[var(--color-gray-12)]",
          )}
          data-ui="section-panel-header"
        >
          <div className="flex min-w-[min(100%,12rem)] flex-1 flex-col gap-0.5">
            {title && (
              <h2 className="m-0 text-[length:var(--text-body-6)] leading-[var(--leading-body-6)] font-bold text-[var(--color-gray-2)]">{title}</h2>
            )}
            {description && (
              <div className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] font-normal text-[var(--color-gray-4)]">{description}</div>
            )}
          </div>
          {action && <div className="max-w-full self-center">{action}</div>}
        </header>
      )}
      <div
        className={density === "compact" ? "px-3.5 py-3" : "px-5 py-6"}
        data-ui="section-panel-content"
        {...contentProps}
      >
        {scrollArea ? (
          <div
            className="overflow-auto [scrollbar-gutter:stable]"
            style={{ height: resolvedHeight }}
            data-ui="section-panel-scroll"
          >
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

export { SectionPanel };
export type { PanelDensity, PanelSurface, PanelHeaderSurface, SectionPanelProps };

import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { cx } from "@trade-os/operations/components/ui/utils";

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
  neutral: "bg-ecoya-gray-12 border-ecoya-gray-10",
  information: "bg-ecoya-gray-12 border-ecoya-blue-9",
  warning: "bg-ecoya-gray-12 border-ecoya-system-yellow-5",
  danger: "bg-ecoya-gray-12 border-ecoya-system-red-7",
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
      className={cx(
        "gap-0 overflow-hidden rounded-lg border p-0 text-ecoya-gray-2 shadow-section",
        surfaceClass[surface],
        className,
      )}
      data-ui="section-panel"
      {...props}
    >
      {(title || description || action) && (
        <header
          className={cx(
            "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-ecoya-gray-10",
            density === "compact" ? "min-h-11 px-3.5 py-2.5" : "min-h-12 px-5 py-3",
            headerSurface === "muted" ? "bg-ecoya-gray-11" : "bg-ecoya-gray-12",
          )}
          data-ui="section-panel-header"
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            {title && (
              <h2 className="m-0 text-header-17 font-bold text-ecoya-gray-2">{title}</h2>
            )}
            {description && (
              <div className="text-body-13 font-regular text-ecoya-gray-4">{description}</div>
            )}
          </div>
          {action && <div className="self-center">{action}</div>}
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

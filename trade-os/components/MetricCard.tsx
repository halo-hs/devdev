import type { ComponentProps, ReactNode } from "react";

import { StatTile } from "@/components/platform/StatTile";
import { cn } from "@/lib/utils";

type MetricTone = "neutral" | "info" | "success" | "warning" | "danger" | "indigo";

type MetricCardProps = Omit<ComponentProps<"article">, "title"> & {
  label: ReactNode;
  value: ReactNode;
  meta?: ReactNode;
  icon?: ReactNode;
  tone?: MetricTone;
  valueToned?: boolean;
};

const toneTextClass: Record<MetricTone, string> = {
  neutral: "text-[var(--color-gray-4)]",
  info: "text-[var(--color-primary-4)]",
  success: "text-[var(--color-green-1)]",
  warning: "text-[var(--color-yellow-1)]",
  danger: "text-[var(--color-red-2)]",
  indigo: "text-[var(--color-indigo)]",
};

// Renders the shared Figma KPI card so every operations hero summary matches
// 결산리포트 v6 (label 14 SemiBold, separator, value 26 Bold, detail 12).
function MetricCard({
  label,
  value,
  meta,
  icon,
  tone = "neutral",
  valueToned = false,
  className,
  ...props
}: MetricCardProps) {
  return (
    <StatTile
      className={cn("min-w-0 bg-[var(--color-gray-12)]", className)}
      data-ui="metric-card"
      label={
        icon ? (
          <span className="flex items-center gap-2">
            <span className={cn("inline-flex flex-none", toneTextClass[tone])} data-ui="metric-card-icon">
              {icon}
            </span>
            {label}
          </span>
        ) : (
          label
        )
      }
      value={value}
      valueClassName={valueToned ? toneTextClass[tone] : undefined}
      {...(props as Omit<ComponentProps<typeof StatTile>, "label" | "value">)}
    >
      {meta ? <span className={toneTextClass[tone]}>{meta}</span> : null}
    </StatTile>
  );
}

export { MetricCard };
export type { MetricCardProps, MetricTone };

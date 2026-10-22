import type { ComponentProps, ReactNode } from "react";

import { KpiCard } from "@/components/ds2/molecule/StatTile";
import { cx } from "@trade-os/operations/components/ui/utils";

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
  neutral: "text-ecoya-gray-4",
  info: "text-ecoya-blue-4",
  success: "text-ecoya-system-green-1",
  warning: "text-ecoya-system-yellow-1",
  danger: "text-ecoya-system-red-2",
  indigo: "text-ecoya-indigo",
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
    <KpiCard
      className={cx("min-w-0 bg-[var(--color-gray-12)]", className)}
      data-ui="metric-card"
      label={
        icon ? (
          <span className="flex items-center gap-2">
            <span className={cx("inline-flex flex-none", toneTextClass[tone])} data-ui="metric-card-icon">
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
      {...(props as Omit<ComponentProps<typeof KpiCard>, "label" | "value">)}
    >
      {meta ? <span className={toneTextClass[tone]}>{meta}</span> : null}
    </KpiCard>
  );
}

export { MetricCard };
export type { MetricCardProps, MetricTone };

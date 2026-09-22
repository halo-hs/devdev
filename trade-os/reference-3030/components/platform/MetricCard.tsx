import type { ComponentProps, ReactNode } from "react";

import { cx } from "@trade-os/reference-3030/components/ui/utils";

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
    <article
      className={cx(
        "min-w-0 rounded-lg border border-ecoya-gray-10 bg-ecoya-gray-12 p-0 shadow-section",
        className,
      )}
      data-ui="metric-card"
      {...props}
    >
      <div className="flex items-center gap-4 p-5">
        {icon && (
          <div
            className={cx(
              "inline-flex size-12 flex-none items-center justify-center rounded-full bg-ecoya-gray-11",
              toneTextClass[tone],
            )}
            data-ui="metric-card-icon"
          >
            {icon}
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="text-label-14 font-medium text-ecoya-gray-4">{label}</div>
          <div className={cx("text-display-28 font-bold tabular-nums", valueToned ? toneTextClass[tone] : "text-ecoya-gray-2")}>{value}</div>
          {meta && (
            <div className={cx("text-body-13 font-regular", toneTextClass[tone])}>{meta}</div>
          )}
        </div>
      </div>
    </article>
  );
}

export { MetricCard };
export type { MetricCardProps, MetricTone };

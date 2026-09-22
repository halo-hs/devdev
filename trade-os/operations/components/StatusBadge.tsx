import type { HTMLAttributes, ReactNode } from "react";

import { cx } from "@trade-os/operations/components/ui/utils";

type StatusTone =
  | "neutral"
  | "info"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "request"
  | "scheduled"
  | "inProgress"
  | "fieldDone"
  | "done"
  | "cancelled";

type StatusBadgeSize = "sm" | "md";
type StatusBadgeMeaning = "classification" | "risk" | "state";

/**
 * Badge geometry. `pill` (default) = canonical `atom/Badge` radius 24px + font-medium.
 * `square` = canonical square tag (4px radius + font-bold), e.g. brand-emphasis tags.
 * Default stays `pill` so existing callers are unchanged.
 */
type StatusBadgeShape = "pill" | "square";

type StatusBadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, "color"> & {
  meaning?: StatusBadgeMeaning;
  tone?: StatusTone;
  size?: StatusBadgeSize;
  shape?: StatusBadgeShape;
  children?: ReactNode;
};

/**
 * Tone → ecoya CSS-var color tokens.
 *
 * Ported from the products StatusBadge `toneMap` (colorSet keys → `--ecoya-*`):
 * `color` = text, `bg` = background, `border` = stroke. The source `Badge`
 * renders in fill mode (`badgeType="normal"`) for every tone, so `border` is
 * carried for contract fidelity but not applied to the rendered span.
 */
const toneMap: Record<StatusTone, { color: string; bg: string; border: string }> = {
  neutral: {
    color: "var(--ecoya-gray-4)",
    bg: "var(--ecoya-gray-11)",
    border: "var(--ecoya-gray-9)",
  },
  info: {
    color: "var(--ecoya-system-blue-2)",
    bg: "var(--ecoya-system-blue-6)",
    border: "var(--ecoya-system-blue-5)",
  },
  // Brand-emphasis tag (canonical: #E5F2FF bg + #166DD7 text). bg = system-blue-6,
  // text = primary-4 (= --ecoya-blue-4). No canonical stroke; border carries bg for
  // contract fidelity (not applied in fill mode).
  brand: {
    color: "var(--ecoya-blue-4)",
    bg: "var(--ecoya-system-blue-6)",
    border: "var(--ecoya-system-blue-6)",
  },
  success: {
    color: "var(--ecoya-system-green-1)",
    bg: "var(--ecoya-system-green-6)",
    border: "var(--ecoya-system-green-5)",
  },
  warning: {
    color: "var(--ecoya-system-yellow-1)",
    bg: "var(--ecoya-system-yellow-6)",
    border: "var(--ecoya-system-yellow-5)",
  },
  danger: {
    color: "var(--ecoya-system-red-2)",
    bg: "var(--ecoya-system-red-8)",
    border: "var(--ecoya-system-red-7)",
  },
  request: {
    color: "var(--ecoya-system-grape-2)",
    bg: "var(--ecoya-system-grape-6)",
    border: "var(--ecoya-system-grape-5)",
  },
  scheduled: {
    color: "var(--ecoya-system-pink-2)",
    bg: "var(--ecoya-system-pink-6)",
    border: "var(--ecoya-system-pink-5)",
  },
  inProgress: {
    color: "var(--ecoya-system-green-1)",
    bg: "var(--ecoya-system-green-6)",
    border: "var(--ecoya-system-green-5)",
  },
  fieldDone: {
    color: "var(--ecoya-system-orange-2)",
    bg: "var(--ecoya-system-orange-6)",
    border: "var(--ecoya-system-orange-5)",
  },
  done: {
    color: "var(--ecoya-gray-4)",
    bg: "var(--ecoya-gray-10)",
    border: "var(--ecoya-gray-9)",
  },
  cancelled: {
    color: "var(--ecoya-gray-7)",
    bg: "var(--ecoya-gray-10)",
    border: "var(--ecoya-gray-9)",
  },
};

function StatusBadge({
  tone = "neutral",
  size = "sm",
  shape,
  meaning,
  children,
  className,
  ...props
}: StatusBadgeProps) {
  const colors = toneMap[tone];
  const resolvedShape = shape ?? (meaning === "risk" ? "square" : "pill");

  return (
    <span
      {...props}
      className={cx(
        "inline-flex shrink-0 items-center justify-center",
        resolvedShape === "square" ? "rounded whitespace-nowrap font-bold" : "rounded-[24px] whitespace-nowrap font-medium",
        size === "md"
          ? "px-[14px] py-1 text-badge-16"
          : "px-2.5 py-0.5 text-badge-12",
        className,
      )}
      data-ui="status-badge"
      data-meaning={meaning}
      data-tone={tone}
      data-shape={resolvedShape}
      style={{ backgroundColor: colors.bg, color: colors.color, ...props.style }}
    >
      {children}
    </span>
  );
}

type DdayTone = "overdue" | "today" | "urgent" | "soon" | "normal";

type DdayBadgeProps = Omit<StatusBadgeProps, "meaning" | "tone"> & {
  ddayTone?: DdayTone;
};

const ddayToneMap: Record<DdayTone, StatusTone> = {
  overdue: "danger",
  today: "danger",
  urgent: "danger",
  soon: "warning",
  normal: "neutral",
};

function DdayBadge({ ddayTone = "normal", ...props }: DdayBadgeProps) {
  return <StatusBadge {...props} meaning="risk" tone={ddayToneMap[ddayTone]} />;
}

function RiskBadge(props: Omit<StatusBadgeProps, "meaning" | "tone">) {
  return <StatusBadge {...props} meaning="risk" tone="danger" />;
}

export { DdayBadge, RiskBadge, StatusBadge };
export type {
  DdayBadgeProps,
  DdayTone,
  StatusBadgeMeaning,
  StatusBadgeProps,
  StatusBadgeShape,
  StatusBadgeSize,
  StatusTone,
};

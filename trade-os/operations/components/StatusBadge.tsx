import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

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
  // Core tones follow the Figma Badge (891:1212) status colors, same as the
  // shared StatusBadge: Gray 9/3, Blue 10/4, Green 6/1, Orange 6/1, Red 6/2.
  neutral: {
    color: "var(--color-gray-4)",
    bg: "var(--color-gray-10)",
    border: "var(--color-gray-9)",
  },
  info: {
    color: "var(--color-primary-4)",
    bg: "var(--color-primary-10)",
    border: "var(--color-blue-5)",
  },
  // Brand-emphasis tag (canonical: #E5F2FF bg + #166DD7 text). bg = system-blue-6,
  // text = primary-4 (= --ecoya-blue-4). No canonical stroke; border carries bg for
  // contract fidelity (not applied in fill mode).
  brand: {
    color: "var(--color-primary-4)",
    bg: "var(--color-blue-6)",
    border: "var(--color-blue-6)",
  },
  success: {
    color: "var(--color-green-1)",
    bg: "var(--color-green-6)",
    border: "var(--color-green-5)",
  },
  warning: {
    color: "var(--color-orange-1)",
    bg: "var(--color-orange-6)",
    border: "var(--color-yellow-5)",
  },
  danger: {
    color: "var(--color-red-2)",
    bg: "var(--color-red-8)",
    border: "var(--color-red-7)",
  },
  request: {
    color: "var(--color-grape-2)",
    bg: "var(--color-grape-6)",
    border: "var(--color-grape-5)",
  },
  scheduled: {
    color: "var(--color-pink-2)",
    bg: "var(--color-pink-6)",
    border: "var(--color-pink-5)",
  },
  inProgress: {
    color: "var(--color-green-1)",
    bg: "var(--color-green-6)",
    border: "var(--color-green-5)",
  },
  fieldDone: {
    color: "var(--color-orange-2)",
    bg: "var(--color-orange-6)",
    border: "var(--color-orange-5)",
  },
  done: {
    color: "var(--color-gray-4)",
    bg: "var(--color-gray-10)",
    border: "var(--color-gray-9)",
  },
  cancelled: {
    color: "var(--color-gray-7)",
    bg: "var(--color-gray-10)",
    border: "var(--color-gray-9)",
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
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        resolvedShape === "square" ? "rounded whitespace-nowrap font-bold" : "rounded-[24px] whitespace-nowrap font-medium",
        size === "md"
          ? "px-[14px] py-1 text-[length:var(--text-body-7)] leading-[var(--leading-body-8)]"
          : "px-2.5 py-0.5 text-[12px] leading-[16px]",
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

import Link from "@trade-os/operations/compat/link";

import { cx } from "@trade-os/operations/components/ui/utils";

import type { ReactNode } from "react";

import type { MetricTone } from "@trade-os/operations/components/MetricCard";

const toneBorder: Record<MetricTone, string> = {
  neutral: "border-border hover:border-ecoya-gray-8",
  danger: "border-ecoya-system-red-3 hover:border-ecoya-system-red-4",
  warning: "border-ecoya-system-yellow-6 hover:border-ecoya-system-yellow-5",
  success: "border-ecoya-system-green-3 hover:border-ecoya-system-green-4",
  info: "border-ecoya-system-blue-3 hover:border-ecoya-system-blue-4",
  // erp-v2-adapt: begin — this repo's MetricTone is a superset (adds "indigo"),
  // so the Record must cover it; home never renders a DecisionCard with tone="indigo".
  indigo: "border-ecoya-indigo hover:border-ecoya-indigo",
  // erp-v2-adapt: end
};

const toneValue: Record<MetricTone, string> = {
  neutral: "text-text-primary",
  danger: "text-status-danger",
  warning: "text-status-warning",
  success: "text-status-success",
  info: "text-ecoya-blue-5",
  // erp-v2-adapt: begin — superset MetricTone (see above).
  indigo: "text-ecoya-indigo",
  // erp-v2-adapt: end
};

export type DecisionCardProps = {
  title: string;
  body: string;
  value: string;
  cta: string;
  href: string;
  tone?: MetricTone;
  /**
   * SC-09 Badge Matrix "오늘 확인이 필요합니다 · `확인 필요`" — 남아 있는 사용자
   * 행동을 제목 옆에 붙인다. 숫자 값(`value`)과는 다른 축이므로 합치지 않는다.
   */
  badge?: ReactNode;
  /** When set, renders a button and skips navigation — used for same-page drill-down. */
  onActivate?: () => void;
};

function DecisionCardBody({
  title,
  body,
  value,
  cta,
  badge,
  tone = "info",
}: Omit<DecisionCardProps, "href" | "onActivate">) {
  return (
    <>
      <span className="flex items-start justify-between gap-2">
        <p className="text-body-13 font-semibold text-text-primary">{title}</p>
        {badge}
      </span>
      <p className="mt-1 flex-1 text-label-12 text-text-muted">{body}</p>
      <p className={cx("mt-3 text-header-20 font-bold tabular-nums", toneValue[tone])}>{value}</p>
      <span className="mt-3 text-label-12 font-semibold text-ecoya-blue-5 group-hover:underline">{cta} →</span>
    </>
  );
}

export function DecisionCard({ title, body, value, cta, href, badge, tone = "info", onActivate }: DecisionCardProps) {
  const className = cx(
    "group flex h-full flex-col rounded-xl border bg-surface-card p-4 text-left shadow-sm transition hover:shadow-md",
    toneBorder[tone],
  );

  if (onActivate) {
    return (
      <button
        type="button"
        className={className}
        data-component="DecisionCard"
        onClick={onActivate}
      >
        <DecisionCardBody badge={badge} body={body} cta={cta} title={title} tone={tone} value={value} />
      </button>
    );
  }

  return (
    <Link href={href} className={className} data-component="DecisionCard">
      <DecisionCardBody badge={badge} body={body} cta={cta} title={title} tone={tone} value={value} />
    </Link>
  );
}

import Link from "@trade-os/operations/compat/link";

import { cx } from "@trade-os/operations/components/ui/utils";

import type { ReactNode } from "react";

import type { MetricTone } from "@trade-os/operations/components/MetricCard";

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
        <p className="text-[14px] leading-5 font-semibold text-ecoya-gray-2">{title}</p>
        {badge}
      </span>
      <p className="mt-1 flex-1 text-[12px] leading-4 text-ecoya-gray-5">{body}</p>
      <p className={cx("mt-2.5 text-[26px] leading-9 font-bold tabular-nums", toneValue[tone])}>{value}</p>
      <span className="mt-2.5 text-[11px] leading-4 text-[var(--color-primary-4)] group-hover:underline">{cta} →</span>
    </>
  );
}

export function DecisionCard({ title, body, value, cta, href, badge, tone = "info", onActivate }: DecisionCardProps) {
  // Figma 정산 4차 KPI (6224:188721): white card, Gray 10 ring, tone only on the value.
  const className =
    "group flex h-full min-h-[148px] flex-col rounded-[var(--r-lg)] bg-[var(--color-gray-12)] px-[18px] py-5 text-left shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)] transition hover:ring-[var(--color-gray-8)]";

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

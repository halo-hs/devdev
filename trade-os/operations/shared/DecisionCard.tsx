import Link from "@trade-os/lib/AppLink";

import { cn } from "@/lib/utils";

import type { ReactNode } from "react";

import type { MetricTone } from "@trade-os/operations/components/MetricCard";

const toneValue: Record<MetricTone, string> = {
  neutral: "text-text-primary",
  danger: "text-status-danger",
  warning: "text-ecoya-gray-2",
  success: "text-ecoya-gray-2",
  info: "text-ecoya-gray-2",
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
  // Figma 정산 4차 KPI (6224:189967): title row with 자세히 on the right, a
  // divider, the amount with its currency code after it, then the note.
  const money = value.match(/^([A-Z]{3}) (.+)$/);
  return (
    <>
      <span className="flex w-full items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <p className="text-[14px] leading-[1.45] font-semibold text-ecoya-gray-2">{title}</p>
          {badge}
        </span>
        <span className="shrink-0 text-[11px] leading-4 text-[var(--color-primary-4)] group-hover:underline">{cta} →</span>
      </span>
      <span aria-hidden="true" className="my-2.5 h-px w-full bg-[var(--color-gray-10)]" />
      <p className={cn("flex items-baseline gap-1.5 text-[26px] leading-[1.45] font-bold tabular-nums", toneValue[tone])}>
        {money ? (
          <>
            {money[2]}
            <span className="text-[14px] font-semibold text-[var(--color-gray-5)]">{money[1]}</span>
          </>
        ) : value}
      </p>
      <p className="mt-2.5 text-[12px] leading-[1.45] text-[var(--color-gray-5)]">{body}</p>
    </>
  );
}

export function DecisionCard({ title, body, value, cta, href, badge, tone = "info", onActivate }: DecisionCardProps) {
  // Figma 정산 4차 KPI (6224:188721): white card, Gray 10 ring, tone only on the value.
  const className =
    "group flex h-full min-h-[148px] flex-col rounded-[20px] bg-[var(--color-gray-12)] px-[18px] py-5 text-left shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)] transition hover:ring-[var(--color-gray-8)]";

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

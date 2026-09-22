import { InfoBox, type InfoBoxTone } from "@trade-os/reference-3030/components/platform/InfoBox";

import type { EntitlementGateReason } from "@trade-os/reference-3030/lib/api/entitlements";

// erp-v2-adapt: begin — QA-1352 renders BE #495's four distinct insight-gate outcomes.
type InsightsGateCopy = {
  readonly billingBody: string;
  readonly billingTitle: string;
  readonly roleBody: string;
  readonly roleTitle: string;
  readonly subscriptionBody: string;
  readonly subscriptionTitle: string;
  readonly upgradeBody: string;
  readonly upgradeTitle: string;
};

type InsightsGateNoticeProps = {
  readonly copy: InsightsGateCopy;
  readonly reason: EntitlementGateReason;
};

export function InsightsGateNotice({ copy, reason }: InsightsGateNoticeProps) {
  const notices = {
    billing: { body: copy.billingBody, title: copy.billingTitle, tone: "caution" },
    plan: { body: copy.upgradeBody, title: copy.upgradeTitle, tone: "positive" },
    role: { body: copy.roleBody, title: copy.roleTitle, tone: "risk" },
    subscription: { body: copy.subscriptionBody, title: copy.subscriptionTitle, tone: "neutral" },
  } satisfies Record<EntitlementGateReason, { body: string; title: string; tone: InfoBoxTone }>;
  const notice = notices[reason];

  return <InfoBox tone={notice.tone} title={notice.title} description={notice.body} />;
}
// erp-v2-adapt: end

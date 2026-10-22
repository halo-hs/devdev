"use client";

import { HostTable, HostTableHeader, HostTableBody, HostTableRow, HostTableHead, HostTableCell } from "@trade-os/components/HostTable";
import Link from "@trade-os/lib/AppLink";
import { useEffect, useState } from "react";

import { InfoBox } from "@trade-os/components/InfoBox";
import { Button } from "@/components/ui/Button";
import { usePlatformAuth } from "@trade-os/lib/session/PlatformSessionContext";
import { getExceptions, type ExceptionsResponse } from "@trade-os/lib/api/exceptions";
import { withRetry } from "@trade-os/lib/api/retry";
import { useLocaleTag } from "@trade-os/lib/i18n/useLocaleTag";
import { riskDetailLine } from "@trade-os/lib/deals/riskDetail";
import { createRiskLabeler } from "@trade-os/lib/deals/riskLabels";
import { riskSeverityLabel } from "@trade-os/lib/deals/riskSeverityLabels";

import { messages } from "@trade-os/lib/i18n/messages";

// severity → tone (critical worse than warning), mirroring the deal risk badge.
const SEV_TONE: Record<string, string> = {
  critical: "text-[var(--color-red-1)]",
  warning: "text-[var(--color-yellow-1)]",
};

/**
 * ExceptionCenter — the §7.8 Exception Center surface on the owner Monitor page.
 * Self-fetches GET /trade/exceptions (every active risk across deals, worst-first)
 * and renders it as a single triage table with deal links. Loading stays inline;
 * request failure is explicit and retryable; zero exceptions has a teaching state. Self-contained
 * (messages + usePlatformAuth) — mounted inside MonitorConnected, which already
 * runs within the auth + i18n providers.
 */
export function ExceptionCenter() {
  const copy = messages.erpDeals.exceptionCenter;
  const riskCopy = messages.erpDeals.detail.view.risk;
  const localeTag = useLocaleTag();
  const { getIdToken } = usePlatformAuth();
  const [data, setData] = useState<ExceptionsResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setFailed(false);
        setData(null);
      }
    });
    withRetry(() => getExceptions(getIdToken))
      .then((r) => {
        if (!cancelled) setData(r);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [getIdToken, requestVersion]);

  if (failed) {
    return (
      <section
        className="mt-6 flex flex-col gap-3"
        data-component="ExceptionCenter"
        data-state="error"
        role="alert"
      >
        <InfoBox tone="risk" title={copy.title} description={messages.auth.loadError} />
        <Button variant="outline"
          onClick={() => {
            setFailed(false);
            setData(null);
            setRequestVersion((version) => version + 1);
          }}
          type="button"
        >
          {messages.auth.retry}
        </Button>
      </section>
    );
  }

  if (data === null) {
    return (
      <p aria-live="polite" className="sr-only" data-component="ExceptionCenter" data-state="loading">
        {messages.auth.loadingStatus}
      </p>
    );
  }

  const riskLabel = createRiskLabeler({
    codes: data.items.map((row) => row.risk_type),
    knownLabels: copy.risks,
    unknownLabel: copy.unknownRisk,
    unknownLabelNumbered: copy.unknownRiskNumbered,
    unlistedLabel: copy.unlistedRisk,
  });
  const sevLabel = (s: string) => riskSeverityLabel(s, copy.severity, copy.severityFallback);
  const sevTone = (s: string) => Object.hasOwn(SEV_TONE, s) ? SEV_TONE[s] : "text-[var(--color-gray-2)]";
  const detailText = (detail: string | undefined) => riskDetailLine(detail, {
    formatDays: (key, days) => riskCopy[key].replace("{days}", String(days)),
    locale: localeTag,
    differenceLabel: riskCopy.difference,
  }) ?? "—";

  return (
    <section className="mt-6 rounded-lg border border-[var(--color-gray-10)] bg-[var(--color-gray-12)] p-4" data-component="ExceptionCenter">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[length:var(--text-body-8)] leading-[var(--leading-body-8)] font-semibold text-[var(--color-gray-2)]">{copy.title}</h2>
        <span className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-5)]">
          {data.items.length > 0 ? copy.dealCount.replace("{count}", String(data.deal_count)) : copy.subtitle}
        </span>
      </div>
      {data.items.length === 0 ? (
        <p className="mt-3 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-5)]">{copy.empty}</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <HostTable className="w-full border-collapse text-[length:var(--text-body-10)] leading-[var(--leading-body-10)]">
            <HostTableHeader>
              <HostTableRow className="border-b border-[var(--color-gray-10)] text-[var(--color-gray-6)]">
                <HostTableHead className="px-2 py-1.5 text-left font-medium">{copy.cols.deal}</HostTableHead>
                <HostTableHead className="px-2 py-1.5 text-left font-medium">{copy.cols.risk}</HostTableHead>
                <HostTableHead className="px-2 py-1.5 text-left font-medium">{copy.cols.detail}</HostTableHead>
              </HostTableRow>
            </HostTableHeader>
            <HostTableBody>
              {data.items.map((e, i) => (
                <HostTableRow key={`${e.deal_id}-${e.risk_type}-${i}`} className="border-b border-[var(--color-gray-11)]">
                  <HostTableCell className="px-2 py-1.5">
                    <Link
                      // W8-V2b ?from discipline: triage jumps carry their origin so
                      // the deal's back affordance returns to the Monitor, not the list.
                      href={`/erp/deals/${encodeURIComponent(e.deal_id)}?from=${encodeURIComponent("/erp/monitor")}`}
                      className="text-[var(--color-primary-6)] hover:underline"
                    >
                      {e.deal_ref}
                    </Link>
                  </HostTableCell>
                  <HostTableCell className={`px-2 py-1.5 font-medium ${sevTone(e.severity)}`}>
                    {riskLabel(e.risk_type)}
                    <span className="ml-1 font-normal text-[var(--color-gray-5)]">· {sevLabel(e.severity)}</span>
                  </HostTableCell>
                  <HostTableCell className="px-2 py-1.5 text-[var(--color-gray-5)]">{detailText(e.detail)}</HostTableCell>
                </HostTableRow>
              ))}
            </HostTableBody>
          </HostTable>
        </div>
      )}
    </section>
  );
}

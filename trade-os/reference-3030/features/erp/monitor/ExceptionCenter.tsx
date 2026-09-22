import { HostTable, HostTableHeader, HostTableBody, HostTableRow, HostTableHead, HostTableCell } from "@trade-os/reference-3030/components/platform/HostTable";
"use client";

import Link from "@trade-os/reference-3030/compat/link";
import { useEffect, useState } from "react";
import { useMessages } from "@trade-os/reference-3030/compat/intl";

import { InfoBox } from "@trade-os/reference-3030/components/platform/InfoBox";
import { Button } from "@trade-os/reference-3030/components/ui/button";
import { usePlatformAuth } from "@trade-os/reference-3030/features/auth/PlatformSessionContext";
import { getExceptions, type ExceptionsResponse } from "@trade-os/reference-3030/lib/api/exceptions";
import { withRetry } from "@trade-os/reference-3030/lib/api/retry";

import type { AppMessages } from "@trade-os/reference-3030/i18n/messages";

// severity → tone (critical worse than warning), mirroring the deal risk badge.
const SEV_TONE: Record<string, string> = {
  critical: "text-status-danger",
  warning: "text-status-warning",
};

/**
 * ExceptionCenter — the §7.8 Exception Center surface on the owner Monitor page.
 * Self-fetches GET /trade/exceptions (every active risk across deals, worst-first)
 * and renders it as a single triage table with deal links. Loading stays inline;
 * request failure is explicit and retryable; zero exceptions has a teaching state. Self-contained
 * (useMessages + usePlatformAuth) — mounted inside MonitorConnected, which already
 * runs within the auth + i18n providers.
 */
export function ExceptionCenter() {
  const messages = useMessages() as AppMessages;
  const copy = messages.erpDeals.exceptionCenter;
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
        <Button
          onClick={() => {
            setFailed(false);
            setData(null);
            setRequestVersion((version) => version + 1);
          }}
          size="md"
          type="button"
          variant="tertiary"
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

  const riskLabel = (rt: string) => (copy.risks as Record<string, string>)[rt] ?? rt;
  const sevLabel = (s: string) => (copy.severity as Record<string, string>)[s] ?? s;

  return (
    <section className="mt-6 rounded-lg border border-border-muted bg-surface-card p-4" data-component="ExceptionCenter">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-body-15 font-semibold text-text-primary">{copy.title}</h2>
        <span className="text-label-12 text-text-muted">
          {data.items.length > 0 ? copy.dealCount.replace("{count}", String(data.deal_count)) : copy.subtitle}
        </span>
      </div>
      {data.items.length === 0 ? (
        <p className="mt-3 text-body-13 text-text-muted">{copy.empty}</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <HostTable className="w-full border-collapse text-label-12">
            <HostTableHeader>
              <HostTableRow className="border-b border-border-muted text-text-disabled">
                <HostTableHead className="px-2 py-1.5 text-left font-medium">{copy.cols.deal}</HostTableHead>
                <HostTableHead className="px-2 py-1.5 text-left font-medium">{copy.cols.risk}</HostTableHead>
                <HostTableHead className="px-2 py-1.5 text-left font-medium">{copy.cols.detail}</HostTableHead>
              </HostTableRow>
            </HostTableHeader>
            <HostTableBody>
              {data.items.map((e, i) => (
                <HostTableRow key={`${e.deal_id}-${e.risk_type}-${i}`} className="border-b border-border-subtle">
                  <HostTableCell className="px-2 py-1.5">
                    <Link
                      // W8-V2b ?from discipline: triage jumps carry their origin so
                      // the deal's back affordance returns to the Monitor, not the list.
                      href={`/erp/deals/${encodeURIComponent(e.deal_id)}?from=${encodeURIComponent("/erp/monitor")}`}
                      className="text-ecoya-blue-6 hover:underline"
                    >
                      {e.deal_ref}
                    </Link>
                  </HostTableCell>
                  <HostTableCell className={`px-2 py-1.5 font-medium ${SEV_TONE[e.severity] ?? "text-text-primary"}`}>
                    {riskLabel(e.risk_type)}
                    <span className="ml-1 font-normal text-text-muted">· {sevLabel(e.severity)}</span>
                  </HostTableCell>
                  <HostTableCell className="px-2 py-1.5 text-text-muted">{e.detail || "—"}</HostTableCell>
                </HostTableRow>
              ))}
            </HostTableBody>
          </HostTable>
        </div>
      )}
    </section>
  );
}

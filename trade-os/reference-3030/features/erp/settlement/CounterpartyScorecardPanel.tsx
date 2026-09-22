import { HostTable, HostTableHeader, HostTableBody, HostTableRow, HostTableHead, HostTableCell } from "@trade-os/reference-3030/components/platform/HostTable";
"use client";

import Link from "@trade-os/reference-3030/compat/link";
import { useEffect, useState, type CSSProperties } from "react";

import { InfoBox } from "@trade-os/reference-3030/components/platform/InfoBox";
import { OperationalTableFrame } from "@trade-os/reference-3030/components/platform/OperationalTableFrame";
import { SectionPanel } from "@trade-os/reference-3030/components/platform/SectionPanel";
import { StatusBadge, type StatusTone } from "@trade-os/reference-3030/components/platform/StatusBadge";
import { Button } from "@trade-os/reference-3030/components/ui/button";
import { getCounterpartyScorecards, type CounterpartyScorecard } from "@trade-os/reference-3030/lib/api/settlement";
import { withRetry } from "@trade-os/reference-3030/lib/api/retry";

import type { AppMessages } from "@trade-os/reference-3030/i18n/messages";

type ScorecardCopy = AppMessages["erpSettlement"]["settlement"]["scorecard"];

type GradePresentation = {
  style: CSSProperties;
  tone: StatusTone;
};

// Keep the established scorecard colors while exposing a shared semantic badge contract.
const GRADE_PRESENTATION: Record<string, GradePresentation> = {
  A: {
    style: { backgroundColor: "var(--ecoya-system-green-1)", color: "var(--ecoya-system-green-6)" },
    tone: "success",
  },
  B: {
    style: { backgroundColor: "var(--ecoya-surface-muted)", color: "var(--ecoya-text-disabled)" },
    tone: "neutral",
  },
  C: {
    style: { backgroundColor: "var(--ecoya-system-yellow-1)", color: "var(--ecoya-system-yellow-6)" },
    tone: "warning",
  },
  D: {
    style: { backgroundColor: "var(--ecoya-system-red-1)", color: "var(--ecoya-system-red-5)" },
    tone: "danger",
  },
};

/**
 * CounterpartyScorecardPanel — buyer/supplier reliability scorecard (§7.11).
 * Self-fetches the per-counterparty payment-reliability score + grade (worst
 * first, ordered by the backend) and renders it as a table so the owner/CFO sees
 * which counterparties are risky. Failed reads remain visible and retryable so
 * an unavailable scorecard cannot be mistaken for an empty risk list.
 */
export function CounterpartyScorecardPanel({
  copy,
  formatMoney,
  getIdToken,
}: {
  copy: ScorecardCopy;
  formatMoney: (amount: string, currency: string) => string;
  getIdToken: () => Promise<string>;
}) {
  const [rows, setRows] = useState<CounterpartyScorecard[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    withRetry(() => getCounterpartyScorecards(getIdToken))
      .then((r) => {
        if (cancelled) return;
        setFailed(false);
        setRows(r.scorecards);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [getIdToken, reloadNonce]);

  if (failed) {
    return (
      <div data-component="CounterpartyScorecardPanel" role="status">
        <InfoBox
          action={
            <Button
              onClick={() => setReloadNonce((nonce) => nonce + 1)}
              size="sm"
              type="button"
              variant="tertiary"
            >
              {copy.retry}
            </Button>
          }
          title={copy.loadError}
          tone="caution"
        />
      </div>
    );
  }
  if (rows === null) return null;

  const gradeCell = (r: CounterpartyScorecard) => {
    if (r.grade_basis === "no_history_overdue") {
      return (
        <StatusBadge
          className="rounded-md px-1.5 text-label-12 font-semibold"
          meaning="risk"
          shape="square"
          style={{ backgroundColor: "var(--ecoya-system-red-1)", color: "var(--ecoya-system-red-5)" }}
          tone="danger"
        >
          {copy.noHistoryOverdue}
        </StatusBadge>
      );
    }
    if (r.grade_basis === "insufficient_history") {
      return (
        <StatusBadge
          className="rounded-md px-1.5 text-label-12 font-normal"
          meaning="classification"
          shape="square"
          style={{ backgroundColor: "var(--ecoya-surface-muted)", color: "var(--ecoya-text-muted)" }}
          tone="neutral"
        >
          {copy.insufficientHistory.replace("{n}", String(r.completed_count))}
        </StatusBadge>
      );
    }
    const presentation = GRADE_PRESENTATION[r.grade] ?? GRADE_PRESENTATION.B;
    return (
      <StatusBadge
        className="rounded-md px-1.5 text-label-12 font-semibold"
        meaning="classification"
        shape="square"
        style={presentation.style}
        tone={presentation.tone}
      >
        {r.grade}
      </StatusBadge>
    );
  };

  return (
    <SectionPanel
      id="counterparty-scorecard"
      data-component="CounterpartyScorecardPanel"
      title={copy.title}
      description={copy.subtitle}
    >
      {rows.length === 0 ? (
        <p className="text-body-13 text-text-muted">{copy.empty}</p>
      ) : (
        <>
          <ul className="grid gap-3 lg:hidden">
            {rows.map((row) => (
              <li
                key={`${row.counterparty}|${row.currency}`}
                className="rounded-lg border border-border-muted bg-surface-card p-3"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/erp/counterparties/${encodeURIComponent(row.counterparty)}`}
                      className="block truncate text-body-13 font-semibold text-ecoya-accent hover:underline"
                      data-ui="scorecard-open-customer360"
                    >
                      {row.counterparty}
                    </Link>
                    <span className="text-button-11 text-text-muted">
                      {copy.historyCount.replace("{n}", String(row.completed_count))}
                    </span>
                  </div>
                  {gradeCell(row)}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-label-12">
                  {[
                    [copy.cols.score, String(row.payment_reliability_score)],
                    [copy.cols.currency, row.currency],
                    [copy.cols.openReceivable, formatMoney(row.open_receivable, row.currency)],
                    [copy.cols.openPayable, formatMoney(row.open_payable, row.currency)],
                    [copy.cols.avgDaysLate, row.avg_days_late === null ? "—" : copy.daysSuffix.replace("{n}", row.avg_days_late.toFixed(1))],
                    [copy.cols.overdue, String(row.overdue_count)],
                    [copy.cols.volume, row.transaction_volume],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="truncate text-text-muted">{label}</dt>
                      <dd className="mt-0.5 break-words font-medium tabular-nums text-text-primary">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
          <OperationalTableFrame keyboardScrollable className="hidden lg:block" label={copy.title}>
          <HostTable className="min-w-[980px] w-full border-collapse text-label-12">
            <HostTableHeader>
              <HostTableRow className="border-b border-border-muted text-text-secondary">
                <HostTableHead scope="col" className="px-2 py-1.5 text-left font-medium">{copy.cols.counterparty}</HostTableHead>
                <HostTableHead scope="col" className="px-2 py-1.5 text-left font-medium">{copy.cols.currency}</HostTableHead>
                <HostTableHead scope="col" className="px-2 py-1.5 text-center font-medium">{copy.cols.grade}</HostTableHead>
                <HostTableHead scope="col" className="px-2 py-1.5 text-right font-medium">{copy.cols.score}</HostTableHead>
                <HostTableHead scope="col" className="px-2 py-1.5 text-right font-medium">{copy.cols.openReceivable}</HostTableHead>
                <HostTableHead scope="col" className="px-2 py-1.5 text-right font-medium">{copy.cols.openPayable}</HostTableHead>
                <HostTableHead scope="col" className="px-2 py-1.5 text-right font-medium">{copy.cols.avgDaysLate}</HostTableHead>
                <HostTableHead scope="col" className="px-2 py-1.5 text-right font-medium">{copy.cols.overdue}</HostTableHead>
                <HostTableHead scope="col" className="px-2 py-1.5 text-right font-medium">{copy.cols.volume}</HostTableHead>
              </HostTableRow>
            </HostTableHeader>
            <HostTableBody>
              {rows.map((r) => (
                <HostTableRow key={`${r.counterparty}|${r.currency}`} className="border-b border-border-subtle">
                  <HostTableCell className="px-2 py-1.5 text-text-primary">
                    <Link
                      href={`/erp/counterparties/${encodeURIComponent(r.counterparty)}`}
                      className="text-ecoya-accent hover:underline"
                      data-ui="scorecard-open-customer360"
                    >
                      {r.counterparty}
                    </Link>
                    <span className="ml-2 text-button-11 text-text-muted">
                      {copy.historyCount.replace("{n}", String(r.completed_count))}
                    </span>
                  </HostTableCell>
                  <HostTableCell className="px-2 py-1.5 font-mono text-text-primary">{r.currency}</HostTableCell>
                  <HostTableCell className="px-2 py-1.5 text-center">{gradeCell(r)}</HostTableCell>
                  <HostTableCell className="px-2 py-1.5 text-right tabular-nums text-text-primary">{r.payment_reliability_score}</HostTableCell>
                  <HostTableCell className="px-2 py-1.5 text-right font-mono tabular-nums text-text-primary">{formatMoney(r.open_receivable, r.currency)}</HostTableCell>
                  <HostTableCell className="px-2 py-1.5 text-right font-mono tabular-nums text-text-primary">{formatMoney(r.open_payable, r.currency)}</HostTableCell>
                  <HostTableCell className="px-2 py-1.5 text-right tabular-nums text-text-primary">
                    {r.avg_days_late === null ? "—" : copy.daysSuffix.replace("{n}", r.avg_days_late.toFixed(1))}
                  </HostTableCell>
                  <HostTableCell className="px-2 py-1.5 text-right tabular-nums text-text-primary">{r.overdue_count}</HostTableCell>
                  <HostTableCell className="px-2 py-1.5 text-right tabular-nums text-text-primary">{r.transaction_volume}</HostTableCell>
                </HostTableRow>
              ))}
            </HostTableBody>
          </HostTable>
          </OperationalTableFrame>
        </>
      )}
    </SectionPanel>
  );
}

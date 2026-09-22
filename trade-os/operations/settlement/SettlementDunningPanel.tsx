import { HostTable, HostTableHeader, HostTableBody, HostTableRow, HostTableHead, HostTableCell } from "@trade-os/operations/components/HostTable";
"use client";

import { useMemo, useState } from "react";

import { Button } from "@trade-os/operations/components/ui/button";
import { SectionPanel } from "@trade-os/operations/components/SectionPanel";
import { formatDate } from "@trade-os/operations/lib/orgDate";
import type { LedgerEntry } from "@trade-os/operations/lib/api/settlement";

import {
  buildSettlementDunningMailto,
  interpolateSettlementDunningTemplate,
  isSettlementDunningOverdue,
  selectSettlementDunningEntries,
} from "./settlementDunning";

export type SettlementDunningCopy = {
  title: string;
  subtitle: string;
  loading: string;
  error: string;
  retry: string;
  empty: string;
  counterparty: string;
  outstanding: string;
  due: string;
  draft: string;
  copy: string;
  copied: string;
  copyError: string;
  openMail: string;
  overdue: string;
  unassigned: string;
  subject: string;
  body: string;
};

type SettlementDunningStatus = "idle" | "loading" | "ready" | "error";

type SettlementDunningPanelProps = {
  asOf: string;
  copy: SettlementDunningCopy;
  entries: readonly LedgerEntry[] | null;
  formatMoney: (amount: string, currency: string) => string;
  locale: string;
  onRetry: () => void;
  status: SettlementDunningStatus;
};

type CopyState =
  | { id: string; status: "copied" | "error" }
  | null;

export function SettlementDunningPanel({
  asOf,
  copy,
  entries,
  formatMoney,
  locale,
  onRetry,
  status,
}: SettlementDunningPanelProps) {
  const [copyState, setCopyState] = useState<CopyState>(null);
  const rows = useMemo(() => {
    if (entries === null) return [];
    return selectSettlementDunningEntries(entries, asOf).map((entry) => {
      const counterparty = entry.counterparty_name?.trim() || copy.unassigned;
      const amount = formatMoney(entry.outstanding, entry.currency);
      const dueDate = formatDate(entry.due_date, locale);
      const draft = interpolateSettlementDunningTemplate(copy.body, {
        amount,
        counterparty,
        dueDate,
      });
      const subject = interpolateSettlementDunningTemplate(copy.subject, {
        amount,
        counterparty,
        dueDate,
      });
      return {
        amount,
        counterparty,
        draft,
        dueDate,
        entry,
        mailto: buildSettlementDunningMailto(subject, draft),
        overdue: isSettlementDunningOverdue(entry, asOf),
      };
    });
  }, [asOf, copy.body, copy.subject, copy.unassigned, entries, formatMoney, locale]);

  const copyDraft = (id: string, draft: string) => {
    void Promise.resolve()
      .then(() => {
        if (typeof navigator === "undefined" || !navigator.clipboard) {
          throw new Error("Clipboard API unavailable");
        }
        return navigator.clipboard.writeText(draft);
      })
      .then(
        () => setCopyState({ id, status: "copied" }),
        () => setCopyState({ id, status: "error" }),
      );
  };

  return (
    <SectionPanel
      description={<span className="break-keep">{copy.subtitle}</span>}
      id="settlement-dunning"
      title={copy.title}
    >
      {status === "idle" || status === "loading" ? (
        <p className="text-body-13 text-text-muted">{copy.loading}</p>
      ) : status === "error" ? (
        <div className="flex flex-wrap items-center justify-between gap-3" role="alert">
          <p className="m-0 text-body-13 text-status-danger">{copy.error}</p>
          <Button onClick={onRetry} size="sm" type="button" variant="tertiary">
            {copy.retry}
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <p className="text-body-13 text-text-muted">{copy.empty}</p>
      ) : (
        <div className="overflow-x-auto" data-ui="settlement-dunning-list">
          <HostTable className="w-full min-w-[720px] border-collapse text-body-13 tabular-nums">
            <HostTableHeader>
              <HostTableRow className="border-b border-border-muted bg-surface text-text-secondary">
                <HostTableHead className="px-3 py-2 text-left font-medium" scope="col">{copy.counterparty}</HostTableHead>
                <HostTableHead className="px-3 py-2 text-right font-medium" scope="col">{copy.outstanding}</HostTableHead>
                <HostTableHead className="px-3 py-2 text-left font-medium" scope="col">{copy.due}</HostTableHead>
                <HostTableHead className="px-3 py-2 text-left font-medium" scope="col">{copy.draft}</HostTableHead>
                <HostTableHead className="px-3 py-2 text-right font-medium" scope="col">{copy.copy}</HostTableHead>
              </HostTableRow>
            </HostTableHeader>
            <HostTableBody>
              {rows.map((row) => (
                <HostTableRow
                  className="border-b border-border-subtle last:border-0"
                  data-overdue={row.overdue ? "true" : "false"}
                  data-ui="settlement-dunning-row"
                  key={row.entry.id}
                  style={{ containIntrinsicSize: "0 72px", contentVisibility: "auto" }}
                >
                  <HostTableCell className="px-3 py-3 align-top font-semibold text-text-primary">{row.counterparty}</HostTableCell>
                  <HostTableCell className="whitespace-nowrap px-3 py-3 text-right align-top font-medium text-text-primary">{row.amount}</HostTableCell>
                  <HostTableCell className="px-3 py-3 align-top text-text-primary">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{row.dueDate}</span>
                      {row.overdue ? (
                        <span className="rounded-full bg-status-danger-bg px-2 py-0.5 text-label-12 font-medium text-status-danger">
                          {copy.overdue}
                        </span>
                      ) : null}
                    </div>
                  </HostTableCell>
                  <HostTableCell className="max-w-[34rem] whitespace-pre-wrap break-words px-3 py-3 align-top text-text-primary">
                    {row.draft}
                    {copyState?.id === row.entry.id ? (
                      <span aria-live="polite" className="mt-1 block text-label-12 text-text-secondary" role="status">
                        {copyState.status === "copied" ? copy.copied : copy.copyError}
                      </span>
                    ) : null}
                  </HostTableCell>
                  <HostTableCell className="px-3 py-3 align-top">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        onClick={() => copyDraft(row.entry.id, row.draft)}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        {copy.copy}
                      </Button>
                      <Button asChild size="sm" type="button" variant="tertiary">
                        <a href={row.mailto}>{copy.openMail}</a>
                      </Button>
                    </div>
                  </HostTableCell>
                </HostTableRow>
              ))}
            </HostTableBody>
          </HostTable>
        </div>
      )}
    </SectionPanel>
  );
}

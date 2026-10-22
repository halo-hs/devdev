"use client";

import "./SettlementDunningPanel.css";

import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, ChevronDown, ChevronUp, Copy, ExternalLink } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";

import { Button } from "@/components/ui/Button";
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
  const [expanded, setExpanded] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const listId = useId();
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
        () => { setCopyState({ id, status: "copied" }); toast.success(copy.copied); },
        () => { setCopyState({ id, status: "error" }); toast.error(copy.copyError); },
      );
  };

  const renderRow = (row: (typeof rows)[number]) => (
    <div
      key={row.entry.id}
      data-ui="settlement-dunning-row"
      data-overdue={row.overdue ? "true" : "false"}
      className="settlement-dunning-row min-w-0 items-center gap-x-4 gap-y-2 py-3 text-[13px] tabular-nums"
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate font-medium" title={row.counterparty}>{row.counterparty}</span>
        {row.overdue && <span className="shrink-0 rounded bg-status-danger-bg px-1.5 py-0.5 text-[11px] text-status-danger">{copy.overdue}</span>}
      </div>
      <span className="whitespace-nowrap text-right font-medium"><span className="dunning-field-label mr-2 text-xs font-normal text-text-secondary">미결제금액</span>{row.amount}</span>
      <span className="whitespace-nowrap text-text-secondary"><span className="dunning-field-label mr-2 text-xs">지급기한</span>{row.dueDate}</span>
      <div className="dunning-action-group" role="group" aria-label={`${row.counterparty} 초안 작업`}>
        <Popover open={previewId === row.entry.id} onOpenChange={(open) => setPreviewId(open ? row.entry.id : null)}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="xs" type="button" className="rounded-r-none" aria-label={`${row.counterparty} 초안 미리보기`}>미리보기</Button>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={8} className="w-96 p-4" aria-label={`${row.counterparty} 독촉 초안`}>
            <h3 className="text-sm font-semibold">{copy.title} · {copy.draft}</h3>
            <p className="whitespace-pre-wrap break-words text-[13px] leading-6">{row.draft}</p>
            <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-3">
              <Button variant="outline" size="xs" type="button" onClick={() => copyDraft(row.entry.id, row.draft)}>
                <Copy data-icon="inline-start" aria-hidden="true" />
                복사하기
              </Button>
              <Button variant="outline" size="xs" asChild>
                <a href={row.mailto} className="inline-flex items-center gap-1 whitespace-nowrap">{copy.openMail}<ExternalLink className="size-4" aria-hidden="true" /></a>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <Button variant="outline" size="icon-xs" type="button" className="rounded-l-none" aria-label={`${row.counterparty} ${copy.copy}`} onClick={() => copyDraft(row.entry.id, row.draft)}>
          {copyState?.id === row.entry.id && copyState.status === "copied" ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
        </Button>
      </div>
    </div>
  );

  const ready = status === "ready" && rows.length > 0;
  return (
    <SectionPanel data-expanded={expanded} id="settlement-dunning" contentProps={{ className: "@container/dunning px-4" }}>
      <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-1 py-1 @min-[960px]/dunning:flex-nowrap">
        <h2 className="shrink-0 py-3 text-sm font-semibold">{copy.title}</h2>
        {ready && !expanded && <div className="order-3 w-full min-w-0 @min-[960px]/dunning:order-none @min-[960px]/dunning:w-auto @min-[960px]/dunning:flex-1">{renderRow(rows[0])}</div>}
        {ready && (
          <button
            type="button"
            className="ml-auto inline-flex shrink-0 items-center gap-1 py-3 text-xs font-medium text-blue-600 focus-visible:outline-2"
            aria-expanded={expanded}
            aria-controls={listId}
            onClick={() => { setPreviewId(null); setExpanded((value) => !value); }}
          >
            전체 {rows.length}건
            {expanded ? <ChevronUp className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />}
          </button>
        )}
      </div>
      <div id={listId} hidden={!ready || !expanded} data-ui="settlement-dunning-list" className="divide-y border-t">
        {ready && expanded && (
          <>
            <div className="settlement-dunning-columns items-center gap-x-4 py-2 text-xs text-text-secondary" aria-hidden="true">
              <span>거래처</span><span className="text-right">미결제금액</span><span>지급기한</span><span className="text-right">작업</span>
            </div>
            {rows.map(renderRow)}
          </>
        )}
      </div>
      {status === "idle" || status === "loading" ? (
        <p className="pb-4 text-[13px] text-text-muted">{copy.loading}</p>
      ) : status === "error" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4" role="alert">
          <p className="text-[13px] text-status-danger">{copy.error}</p>
          <Button variant="outline" size="xs" onClick={onRetry} type="button">{copy.retry}</Button>
        </div>
      ) : rows.length === 0 ? <p className="pb-4 text-[13px] text-text-muted">{copy.empty}</p> : null}
    </SectionPanel>
  );
}

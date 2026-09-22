import { HostTable, HostTableHeader, HostTableBody, HostTableRow, HostTableHead, HostTableCell } from "@trade-os/reference-3030/components/platform/HostTable";
"use client";

import Link from "@trade-os/reference-3030/compat/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { SectionPanel } from "@trade-os/reference-3030/components/platform/SectionPanel";
import { StatusBadge } from "@trade-os/reference-3030/components/platform/StatusBadge";
import { Button } from "@trade-os/reference-3030/components/ui/button";
import { usePlatformAuth } from "@trade-os/reference-3030/features/auth/PlatformSessionContext";
import { type DealSummaryResponse } from "@trade-os/reference-3030/lib/api/deals";
import { listAllDeals } from "@trade-os/reference-3030/lib/api/listAllDeals";
import {
  hasDocGapBeforeEta,
  hasOpenRemaining,
  hasQtyMismatchRisk,
} from "@trade-os/reference-3030/lib/deals/opsSignals";
import { withRetry } from "@trade-os/reference-3030/lib/api/retry";

export type MonitorOpsTableCopy = {
  title: string;
  description: string;
  loading?: string;
  empty: string;
  viewAll: string;
  badge: string;
  columns: Record<string, string>;
};

export type MonitorOpsCopy = {
  docGap: MonitorOpsTableCopy;
  openRemaining: MonitorOpsTableCopy;
  qtyMismatch: MonitorOpsTableCopy;
  // 운영 예외 하위-fetch 실패 라벨. 옵셔널 — 미주입 시 영어 기본(쇼케이스/테스트 호환).
  loadError?: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; deals: DealSummaryResponse[] };

function formatBadge(copy: MonitorOpsTableCopy, count: number): string {
  return count > 0 ? copy.badge.replace("{count}", String(count)) : "—";
}

function counterpartyLabel(deal: DealSummaryResponse): string {
  return deal.counterparty_name?.trim() || deal.title?.trim() || deal.deal_id.slice(0, 8);
}

function qtyRiskLabel(deal: DealSummaryResponse): string {
  const risks = deal.risks ?? [];
  if (risks.includes("ci_qty_mismatch")) return "CI qty";
  if (risks.includes("qty_mismatch")) return "Qty";
  return risks[0] ?? "—";
}

function OpsTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: ReactNode[];
}) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-lg border border-border-muted">
      <HostTable className="w-full min-w-[640px] text-left">
        <HostTableHeader className="bg-surface-muted text-label-12 font-semibold uppercase tracking-wide text-text-muted">
          <HostTableRow>
            {columns.map((header) => (
              <HostTableHead key={header} className="px-4 py-2.5">{header}</HostTableHead>
            ))}
          </HostTableRow>
        </HostTableHeader>
        <HostTableBody>{rows}</HostTableBody>
      </HostTable>
    </div>
  );
}

export function MonitorDealsOpsPanels({ copy }: { copy: MonitorOpsCopy }) {
  const { getIdToken } = usePlatformAuth();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const fetchEventId = useRef(0);

  const load = useCallback(() => {
    const eventId = fetchEventId.current + 1;
    fetchEventId.current = eventId;
    setState({ status: "loading" });

    withRetry(() => listAllDeals(getIdToken))
      .then((res) => {
        if (fetchEventId.current !== eventId) return;
        setState({ status: "ready", deals: res.items });
      })
      .catch(() => {
        if (fetchEventId.current !== eventId) return;
        setState({ status: "error" });
      });
  }, [getIdToken]);

  useEffect(() => {
    load();
    return () => {
      fetchEventId.current += 1;
    };
  }, [load]);

  const loadingLabel = copy.docGap.loading ?? "Loading…";

  if (state.status === "loading") {
    return (
      <p className="mb-4 text-body-14 text-text-muted" data-component="MonitorDealsOpsPanels">
        {loadingLabel}
      </p>
    );
  }

  if (state.status === "error") {
    return (
      <p className="mb-4 text-body-14 text-ecoya-system-red-2" data-component="MonitorDealsOpsPanels">
        {copy.loadError ?? "Couldn't load operational exceptions."}
      </p>
    );
  }

  const docGaps = state.deals.filter((deal) => hasDocGapBeforeEta(deal));
  const openRemaining = state.deals.filter((deal) => hasOpenRemaining(deal));
  const qtyMismatch = state.deals.filter((deal) => hasQtyMismatchRisk(deal));

  const docGapRows = docGaps.slice(0, 6).map((deal) => (
    <HostTableRow key={deal.deal_id} className="border-t border-border-muted hover:bg-surface-muted/60">
      <HostTableCell className="px-4 py-3 font-medium text-text-primary">
        <Link className="text-ecoya-accent hover:underline" href={`/erp/deals/${deal.deal_id}`}>
          {counterpartyLabel(deal)}
        </Link>
      </HostTableCell>
      <HostTableCell className="px-4 py-3 font-mono text-ecoya-gray-3">{deal.next_eta ?? "—"}</HostTableCell>
      <HostTableCell className="px-4 py-3 text-text-secondary">{deal.next_document?.label ?? "—"}</HostTableCell>
      <HostTableCell className="px-4 py-3 font-mono text-text-secondary">
        {deal.order_remaining_qty ?? "—"}
      </HostTableCell>
    </HostTableRow>
  ));

  const remainingRows = openRemaining.slice(0, 6).map((deal) => (
    <HostTableRow key={deal.deal_id} className="border-t border-border-muted hover:bg-surface-muted/60">
      <HostTableCell className="px-4 py-3 font-medium text-text-primary">
        <Link className="text-ecoya-accent hover:underline" href={`/erp/deals/${deal.deal_id}`}>
          {counterpartyLabel(deal)}
        </Link>
      </HostTableCell>
      <HostTableCell className="px-4 py-3 font-mono text-text-secondary">{deal.order_contracted_qty ?? "—"}</HostTableCell>
      <HostTableCell className="px-4 py-3 font-mono text-text-secondary">{deal.order_shipped_qty ?? "—"}</HostTableCell>
      <HostTableCell className="px-4 py-3 font-mono text-ecoya-gray-3">{deal.order_remaining_qty ?? "—"}</HostTableCell>
    </HostTableRow>
  ));

  const qtyRows = qtyMismatch.slice(0, 6).map((deal) => (
    <HostTableRow key={deal.deal_id} className="border-t border-border-muted hover:bg-surface-muted/60">
      <HostTableCell className="px-4 py-3 font-medium text-text-primary">
        <Link className="text-ecoya-accent hover:underline" href={`/erp/deals/${deal.deal_id}`}>
          {counterpartyLabel(deal)}
        </Link>
      </HostTableCell>
      <HostTableCell className="px-4 py-3 text-ecoya-system-red-2">{qtyRiskLabel(deal)}</HostTableCell>
      <HostTableCell className="px-4 py-3 font-mono text-ecoya-gray-3">{deal.next_eta ?? "—"}</HostTableCell>
      <HostTableCell className="px-4 py-3 font-mono text-text-secondary">{deal.order_remaining_qty ?? "—"}</HostTableCell>
    </HostTableRow>
  ));

  return (
    <section
      className="mb-4 grid gap-4 lg:grid-cols-2"
      data-component="MonitorDealsOpsPanels"
    >
      <SectionPanel
        description={copy.docGap.description}
        title={copy.docGap.title}
        action={
          docGaps.length > 0 ? (
            <StatusBadge tone="danger">{formatBadge(copy.docGap, docGaps.length)}</StatusBadge>
          ) : null
        }
      >
        {docGaps.length === 0 ? (
          <p className="text-body-14 text-text-muted">{copy.docGap.empty}</p>
        ) : (
          <OpsTable
            columns={[
              copy.docGap.columns.counterparty,
              copy.docGap.columns.eta,
              copy.docGap.columns.nextDoc,
              copy.docGap.columns.remaining,
            ]}
            rows={docGapRows}
          />
        )}
        {docGaps.length > 0 ? (
          <div className="mt-3">
            <Button asChild size="sm" variant="tertiary">
              <Link href="/erp/deals?ops=doc_gap">{copy.docGap.viewAll}</Link>
            </Button>
          </div>
        ) : null}
      </SectionPanel>

      <SectionPanel
        description={copy.openRemaining.description}
        title={copy.openRemaining.title}
        action={
          openRemaining.length > 0 ? (
            <StatusBadge tone="warning">{formatBadge(copy.openRemaining, openRemaining.length)}</StatusBadge>
          ) : null
        }
      >
        {openRemaining.length === 0 ? (
          <p className="text-body-14 text-text-muted">{copy.openRemaining.empty}</p>
        ) : (
          <OpsTable
            columns={[
              copy.openRemaining.columns.counterparty,
              copy.openRemaining.columns.contracted,
              copy.openRemaining.columns.shipped,
              copy.openRemaining.columns.remaining,
            ]}
            rows={remainingRows}
          />
        )}
        {openRemaining.length > 0 ? (
          <div className="mt-3">
            <Button asChild size="sm" variant="tertiary">
              <Link href="/erp/deals?ops=remaining">{copy.openRemaining.viewAll}</Link>
            </Button>
          </div>
        ) : null}
      </SectionPanel>

      <SectionPanel
        className="lg:col-span-2"
        description={copy.qtyMismatch.description}
        title={copy.qtyMismatch.title}
        action={
          qtyMismatch.length > 0 ? (
            <StatusBadge tone="danger">{formatBadge(copy.qtyMismatch, qtyMismatch.length)}</StatusBadge>
          ) : null
        }
      >
        {qtyMismatch.length === 0 ? (
          <p className="text-body-14 text-text-muted">{copy.qtyMismatch.empty}</p>
        ) : (
          <OpsTable
            columns={[
              copy.qtyMismatch.columns.counterparty,
              copy.qtyMismatch.columns.risk,
              copy.qtyMismatch.columns.eta,
              copy.qtyMismatch.columns.remaining,
            ]}
            rows={qtyRows}
          />
        )}
        {qtyMismatch.length > 0 ? (
          <div className="mt-3">
            <Button asChild size="sm" variant="tertiary">
              <Link href="/erp/deals?ops=qty_mismatch">{copy.qtyMismatch.viewAll}</Link>
            </Button>
          </div>
        ) : null}
      </SectionPanel>
    </section>
  );
}

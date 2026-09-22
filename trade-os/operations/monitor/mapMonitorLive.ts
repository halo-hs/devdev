import type { ReactNode } from "react";

import type { InfoBoxTone } from "@trade-os/operations/components/InfoBox";
import type { MetricTone } from "@trade-os/operations/components/MetricCard";
import type { TaskQueueItem } from "@trade-os/operations/components/TaskQueue";
import { SETTLEMENT_DRILL_OVERDUE_HREF } from "@trade-os/operations/settlement/settlementDecisionCardData";
import type { MonitorAreaMeta, MonitorRisks, MonitorSnapshot, MonitorSnapshotArea } from "@trade-os/operations/lib/api/monitor";
import type { DealFlag } from "@trade-os/operations/lib/api/flags";
import { countOverdueReceivables, type AgingCell } from "@trade-os/operations/lib/api/settlement";
import { formatMoney } from "@trade-os/operations/lib/money";

import { isMonitorAreaTimestampEnabled } from "./monitorRollout";

// W8-V2a: 매퍼가 화면 문자열을 직접 굽지 않도록 로케일 카피를 주입한다
// (erp-monitor.monitor.live). 기본값은 en 로케일과 동일한 영어 — 쇼케이스/테스트 폴백이며,
// 라이브(MonitorConnected/OwnerMonitorCockpit)는 항상 메시지 번들을 주입한다.
export type MonitorLiveCopy = {
  todayProcessed: string;
  completionRate: string;
  deltaVsYesterday: string;
  deltaVsLastWeek: string;
  statusWithP0: string;
  p0Title: string;
  p1Title: string;
  overdueServiceLabel: string;
  overdueTitle: string;
  priceServiceLabel: string;
  priceTitle: string;
  scheduleServiceLabel: string;
  scheduleTitle: string;
  qtyServiceLabel: string;
  qtyTitle: string;
  ackAction: string;
  paymentFallback: string;
  countBadge: string;
  flagStateChecked: string;
  unassigned: string;
  dataAsOf?: string;
  stale?: string;
  // #711: shown instead of `stale` when meta.clockSkew is set -- data_as_of
  // looked more than 5 minutes in the future relative to the best "now"
  // available. Distinct copy so this reads as a clock problem, not staleness.
  clockSkew?: string;
  unavailable?: string;
  flagCategories: {
    missingDoc: string;
    paymentOverdue: string;
    docMismatch: string;
    fallback: string;
  };
};

export const DEFAULT_MONITOR_LIVE_COPY: MonitorLiveCopy = {
  todayProcessed: "Processed today",
  completionRate: "Completion rate",
  deltaVsYesterday: "{delta}% vs yesterday",
  deltaVsLastWeek: "{delta}pp vs last week",
  statusWithP0: "{message} — {count} unresolved P0",
  p0Title: "{docType} · unresolved for {hours}h",
  p1Title: "ETD D-{dday} · not confirmed",
  overdueServiceLabel: "AR",
  overdueTitle: "Overdue receivables",
  priceServiceLabel: "Price",
  priceTitle: "Unit price variance",
  scheduleServiceLabel: "Schedule",
  scheduleTitle: "Schedule delay",
  qtyServiceLabel: "Qty",
  qtyTitle: "Quantity mismatch",
  ackAction: "Acknowledged",
  paymentFallback: "Payment",
  countBadge: "{count} items",
  flagStateChecked: "Checked",
  unassigned: "Unassigned",
  dataAsOf: "Data as of {date} ({timezone})",
  stale: "stale",
  clockSkew: "check your device clock",
  unavailable: "Unavailable",
  flagCategories: {
    missingDoc: "Missing document",
    paymentOverdue: "Payment overdue",
    docMismatch: "Document mismatch",
    fallback: "Flag",
  },
};

function fill(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (current, [key, value]) => current.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export type MonitorLiveView = {
  metrics: Array<{
    id: string;
    label: string;
    value: string;
    meta?: string;
    tone?: MetricTone;
  }>;
  status: { tone: InfoBoxTone; title: string };
  blockedItems: TaskQueueItem[];
  blockedBadge: string;
  riskItems: TaskQueueItem[];
  riskBadge: string;
  pendingItems: TaskQueueItem[];
  pendingBadge: string;
  throughputDaily: Array<{ day: string; count: string; active: boolean }>;
  throughputRows: Array<{ key: string; owner: string; uploads: string; confirms: string; rate: ReactNode }>;
  flagItems: TaskQueueItem[];
  flagBadge: string;
  areaFreshness?: Partial<Record<MonitorSnapshotArea, string>>;
  /**
   * SC-13 Badge Matrix "모니터 영역 · `조회 실패`(위험)" — 조회에 실패한 영역의
   * 배지 문구. 값이 없는 영역은 실패하지 않은 것이다. 실패 영역의 카운트 배지를
   * 이 문구로 대체해, 마지막 정상값이 없을 때 0·빈칸이 "문제 없음"으로 읽히는
   * 것을 막는다. 기준시각(`areaFreshness`)과는 독립된 축이다.
   */
  areaFailures?: Partial<Record<MonitorSnapshotArea, string>>;
};

export type MonitorSettlementAgingSource = {
  readonly aging: AgingCell[] | null | undefined;
};

function bandToMetricTone(band: string): MetricTone | undefined {
  switch (band) {
    case "green":
      return "success";
    case "yellow":
      return "warning";
    case "red":
      return "danger";
    default:
      return undefined;
  }
}

function statusLevelToTone(level: string): InfoBoxTone {
  switch (level) {
    case "red":
      return "risk";
    case "yellow":
      return "caution";
    default:
      return "positive";
  }
}

function fmtDeltaPct(value: number | null | undefined, copy: MonitorLiveCopy): string | undefined {
  if (value == null || Number.isNaN(value)) return undefined;
  const sign = value >= 0 ? "▲" : "▼";
  return fill(copy.deltaVsYesterday, { delta: `${sign}${Math.abs(value).toFixed(1)}` });
}

function fmtDeltaPP(value: number | null | undefined, copy: MonitorLiveCopy): string | undefined {
  if (value == null || Number.isNaN(value)) return undefined;
  const sign = value >= 0 ? "▲" : "▼";
  return fill(copy.deltaVsLastWeek, { delta: `${sign}${Math.abs(value).toFixed(1)}` });
}

function fmtAmount(amount: string, currency: string, locale?: string): string {
  return formatMoney(amount, currency, locale);
}

function dDayLabel(dDay: number): string {
  if (dDay === 0) return "D-0";
  return `D-${dDay}`;
}

function dDayTone(dDay: number): "today" | "soon" | "normal" {
  if (dDay === 0) return "today";
  if (dDay <= 3) return "soon";
  return "normal";
}

function serviceToneForPending(dDay: number): "danger" | "warning" | "info" {
  if (dDay === 0) return "danger";
  if (dDay <= 3) return "warning";
  return "info";
}

function parseMonitorTimestamp(value: string): number | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return undefined;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, offset] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const offsetHour = offset === "Z" ? 0 : Number(offset.slice(1, 3));
  const offsetMinute = offset === "Z" ? 0 : Number(offset.slice(4, 6));
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth[month - 1] ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    offsetHour > 23 ||
    offsetMinute > 59
  ) {
    return undefined;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

export function isMonitorAreaStale(
  meta: Pick<MonitorAreaMeta, "data_as_of" | "stale">,
  nowMs = Date.now(),
): boolean {
  const timestamp = parseMonitorTimestamp(meta.data_as_of);
  return meta.stale || (timestamp !== undefined && nowMs - timestamp > 15 * 60 * 1000);
}

function formatAreaFreshness(
  meta: MonitorAreaMeta | undefined,
  locale: string | undefined,
  copy: MonitorLiveCopy,
  nowMs: number,
): string | undefined {
  if (!meta?.data_as_of) return undefined;
  const timestamp = parseMonitorTimestamp(meta.data_as_of);
  if (timestamp === undefined) return undefined;
  const timezone = meta.timezone;
  let formatted: string;
  try {
    formatted = new Intl.DateTimeFormat(locale ?? "en-US", {
      dateStyle: "medium",
      timeStyle: "medium",
      timeZone: timezone,
    }).format(timestamp);
  } catch {
    return undefined;
  }
  const freshness = fill(copy.dataAsOf ?? "Data as of {date} ({timezone})", { date: formatted, timezone });
  // #711: this used to compare `timestamp` against the CLIENT's nowMs and
  // hide the whole caption when it looked more than 5 minutes in the
  // future -- the same fail-closed client-clock judgement as
  // validateMonitorAreaMeta, just suppressing a caption instead of dropping
  // the area. meta.clockSkew is computed upstream (server Date header when
  // reachable, else the local clock) once, in one place; trust it instead
  // of re-deriving a second, independently-skewable judgement here, and
  // show a distinguishable caveat rather than hiding the line.
  if (meta.clockSkew) return `${freshness}\u00a0·\u00a0${copy.clockSkew ?? "clock skew"}`;
  return isMonitorAreaStale(meta, nowMs) ? `${freshness}\u00a0·\u00a0${copy.stale ?? "stale"}` : freshness;
}

function dealHref(dealId?: string | null): string | undefined {
  if (!dealId) return undefined;
  return `/erp/deals/${dealId}`;
}

// SC-13 §구역·행동·호출 위험·차단: "항목 선택 → 관련 업무 표시". P0 는 문서 단위 행이고
// BlockedP0ItemResponse.id 는 erp_documents.id (BE internal/repository/erp/monitor.go
// blockedP0Query `ed.id`) — Inbox 가 Confirm 진입에 쓰는 것과 같은 식별자다. 24h 넘게 확인되지
// 않은 업로드이므로 관련 업무는 그 문서의 Confirm 화면이고, 진입 계보도 Inbox 다.
function blockedDocumentHref(documentId?: string | null, filename?: string | null): string | undefined {
  const id = documentId?.trim();
  if (!id) return undefined;
  const params = new URLSearchParams({ from: "inbox" });
  // Confirm 브레드크럼 leaf 는 업로드 원본 파일명이다(confirmBreadcrumbs). 모니터는 파일명을
  // 이미 들고 있으므로 넘겨서 Inbox 진입과 같은 브레드크럼이 나오게 한다.
  const leaf = filename?.trim();
  if (leaf) params.set("fileName", leaf);
  return `/erp/confirm/${encodeURIComponent(id)}?${params.toString()}`;
}

// W8-V2a: raw UUID(reporter_user_id / deal_id 조각)는 화면에 내지 않는다 — 표시명이
// 페이로드에 없으므로 숨기고, 행 링크(href)가 거래 참조를 대신한다.
function formatFlagMeta(flag: DealFlag): string {
  if (flag.created_at) {
    return flag.created_at.replace("T", " ").slice(0, 16);
  }
  return "—";
}

// 시스템 생성 플래그의 category enum(missing_doc 등)은 라벨 맵으로, 사용자가 입력한
// 자유 텍스트(한국어 카테고리 등)는 그대로 노출한다. 매핑되지 않은 ASCII enum 형
// 값은 raw 코드 대신 일반 라벨로 폴백한다 — 내부 식별자는 화면에 내지 않는다.
export function flagCategoryLabel(category: string | null | undefined, copy: MonitorLiveCopy): string {
  const raw = (category ?? "").trim();
  if (!raw) return copy.flagCategories.fallback;
  const key = raw.toLowerCase();
  if (key === "missing_doc") return copy.flagCategories.missingDoc;
  if (key === "payment_overdue") return copy.flagCategories.paymentOverdue;
  if (key === "doc_mismatch") return copy.flagCategories.docMismatch;
  if (/^[a-z0-9_-]+$/.test(key)) return copy.flagCategories.fallback;
  return raw;
}

function overdueServiceTone(band: string): "danger" | "warning" {
  if (band === "red") return "danger";
  return "warning";
}

// total_amount is the KRW-only headline (never a cross-currency sum), so a
// foreign-currency overdue book must render its per-currency amounts —
// otherwise the card reads "₩0 · red · 2건" with the real exposure invisible.
function overdueAmountLabel(overdue: MonitorRisks["overdue_receivable"], locale?: string): string {
  const byCurrency = overdue.by_currency ?? [];
  if (byCurrency.length > 0) {
    return byCurrency.map((c) => fmtAmount(c.total_amount, c.currency, locale)).join(" + ");
  }
  return fmtAmount(overdue.total_amount, overdue.currency, locale);
}

export function buildMonitorRiskItems(
  risks: MonitorRisks,
  locale?: string,
  copy: MonitorLiveCopy = DEFAULT_MONITOR_LIVE_COPY,
  settlement?: MonitorSettlementAgingSource,
): Pick<MonitorLiveView, "riskItems" | "riskBadge"> {
  const riskItems: TaskQueueItem[] = [];
  const overdueCount = settlement
    ? countOverdueReceivables(settlement.aging)
    : risks.overdue_receivable.count;

  if (overdueCount > 0) {
    riskItems.push({
      id: "overdue-ar",
      serviceLabel: copy.overdueServiceLabel,
      serviceTone: overdueServiceTone(risks.overdue_receivable.band),
      title: copy.overdueTitle,
      // band 색상어(yellow/red)는 serviceTone 이 이미 시각으로 전달한다 — 문자 그대로의
      // 색 이름은 화면에 내지 않는다 (W8-V2a).
      meta: overdueAmountLabel(risks.overdue_receivable, locale),
      dueLabel: fill(copy.countBadge, { count: overdueCount }),
      dueTone: risks.overdue_receivable.band === "red" ? "soon" : "normal",
      href: SETTLEMENT_DRILL_OVERDUE_HREF,
    });
  }

  const priceVariance = risks.price_variance ?? { count: 0, deals: [] };
  for (const d of priceVariance.deals) {
    riskItems.push({
      id: `price-${d.deal_id}`,
      serviceLabel: copy.priceServiceLabel,
      serviceTone: "danger" as const,
      title: copy.priceTitle,
      meta: `${d.ref} · ${d.delta}`,
      href: dealHref(d.deal_id),
    });
  }

  for (const d of risks.schedule_delay.deals) {
    riskItems.push({
      id: `sched-${d.deal_id}`,
      serviceLabel: copy.scheduleServiceLabel,
      serviceTone: "warning" as const,
      title: copy.scheduleTitle,
      meta: `${d.ref} · ${d.delta}`,
      href: dealHref(d.deal_id),
    });
  }

  for (const d of risks.qty_mismatch.deals) {
    riskItems.push({
      id: `qty-${d.deal_id}`,
      serviceLabel: copy.qtyServiceLabel,
      serviceTone: "warning" as const,
      title: copy.qtyTitle,
      meta: `${d.ref} · ${d.delta}`,
      href: dealHref(d.deal_id),
    });
  }

  const activeRiskCount =
    risks.schedule_delay.count +
    risks.qty_mismatch.count +
    priceVariance.count +
    overdueCount;
  const riskBadge = activeRiskCount === 0 ? "—" : fill(copy.countBadge, { count: activeRiskCount });

  return { riskItems, riskBadge };
}

/** Maps the flag feed for either selected check-state filter view. */
export function mapUncheckedFlags(
  flags: DealFlag[],
  copy: MonitorLiveCopy = DEFAULT_MONITOR_LIVE_COPY,
): Pick<MonitorLiveView, "flagItems" | "flagBadge"> {
  const flagItems: TaskQueueItem[] = flags.map((flag) => {
    const checked = flag.owner_checked;
    return {
      id: flag.id,
      serviceLabel: flagCategoryLabel(flag.category, copy),
      serviceTone: checked ? "neutral" : "warning",
      ...(checked ? { typeLabel: copy.flagStateChecked, typeTone: "success" as const } : {}),
      title: flag.note,
      meta: formatFlagMeta(flag),
      actionLabel: checked ? undefined : copy.ackAction,
      href: dealHref(flag.deal_id),
    };
  });
  const total = flags.length;
  return {
    flagItems,
    flagBadge: total === 0 ? "—" : fill(copy.countBadge, { count: total }),
  };
}

export function mapMonitorSnapshot(
  snapshot: MonitorSnapshot,
  locale?: string,
  copy: MonitorLiveCopy = DEFAULT_MONITOR_LIVE_COPY,
  settlement?: MonitorSettlementAgingSource,
  nowMs = Date.now(),
): MonitorLiveView {
  const { kpi, status, risks, pending, blockedP0, blockedP1, throughput } = snapshot;

  const metrics: MonitorLiveView["metrics"] = kpi
    ? [
        {
          id: "today",
          label: copy.todayProcessed,
          value: String(kpi.today_processed.count),
          meta: fmtDeltaPct(kpi.today_processed.delta_pct_vs_yesterday, copy),
          tone: kpi.today_processed.count > 0 ? "success" : undefined,
        },
        {
          id: "rate",
          label: copy.completionRate,
          value: `${Math.round(kpi.completion_rate.rate_pct)}%`,
          meta: fmtDeltaPP(kpi.completion_rate.delta_pp_vs_last_week, copy),
          tone: bandToMetricTone(kpi.completion_rate.band),
        },
      ]
    : [];

  const statusTitle = status
    ? status.level === "red" && status.p0_count > 0
      ? fill(copy.statusWithP0, { message: status.message, count: status.p0_count })
      : status.message
    : copy.unavailable ?? "Unavailable";

  const blockedItems: TaskQueueItem[] = [
    ...(blockedP0?.items ?? []).map((item) => ({
      id: `p0-${item.id}`,
      serviceLabel: "P0",
      serviceTone: "danger" as const,
      title: fill(copy.p0Title, { docType: item.doc_type, hours: item.age_hours }),
      meta: item.filename,
      dueLabel: item.counterparty,
      dueTone: "soon" as const,
      href: blockedDocumentHref(item.id, item.filename),
    })),
    ...(blockedP1?.items ?? []).map((item) => ({
      id: `p1-${item.deal_id}`,
      serviceLabel: "P1",
      serviceTone: "warning" as const,
      title: fill(copy.p1Title, { dday: item.d_day }),
      meta: `${item.ref} · ${item.counterparty}`,
      dueLabel: item.target_etd,
      dueTone: dDayTone(item.d_day),
      href: dealHref(item.deal_id),
    })),
  ];

  const p0Total = blockedP0?.pagination.total ?? 0;
  const p1Total = blockedP1?.pagination.total ?? 0;
  const blockedBadge =
    p0Total + p1Total === 0 ? "—" : `P0 ${p0Total} · P1 ${p1Total}`;

  const { riskItems, riskBadge } = risks
    ? buildMonitorRiskItems(risks, locale, copy, settlement)
    : { riskItems: [], riskBadge: "—" };

  // FS-06 §2: 운영 감시는 담당자와 함께 `미할당` 을 보여야 한다. 대기 액션은 이름 없이
  // assignee_id 만 오므로(처리량 표와 달리 assignee_name 이 없다) 배정된 행은 id 를 노출하지
  // 않고 조용히 두고, present-and-null 인 미할당만 표시한다.
  const pendingItems: TaskQueueItem[] = (pending?.items ?? []).map((item, idx) => ({
    id: `pending-${item.ref}-${idx}`,
    serviceLabel: dDayLabel(item.d_day),
    serviceTone: serviceToneForPending(item.d_day),
    title: item.label,
    meta: [
      item.ref,
      fmtAmount(item.amount, item.currency, locale),
      ...(item.assignee_id == null ? [copy.unassigned] : []),
    ].join(" · "),
    dueLabel: item.icon || copy.paymentFallback,
    dueTone: dDayTone(item.d_day),
    href: dealHref(item.deal_id),
  }));

  const pendingBadge =
    (pending?.items.length ?? 0) === 0 ? "—" : fill(copy.countBadge, { count: pending?.items.length ?? 0 });

  const throughputDaily = (throughput?.daily ?? []).map((d) => {
    const dayLabel = d.date.slice(5).replace("-", "/");
    return {
      day: dayLabel,
      count: String(d.confirmed),
      active: d.confirmed > 0,
    };
  });

  const throughputRows = (throughput?.by_assignee ?? []).map((a) => ({
    key: a.assignee_id,
    owner: a.assignee_name,
    uploads: "—",
    confirms: String(a.confirmed),
    rate: "—",
  }));

  // rollback 상태에서는 timestamp UI 를 내지 않는다(FS-06 §4). 스냅샷 자체(마지막 성공값)는
  // 그대로 매핑되므로 영역 데이터는 사라지지 않고 기준시각 줄만 빠진다.
  const areaFreshness = isMonitorAreaTimestampEnabled()
    ? (Object.fromEntries(
        Object.entries(snapshot.area_meta ?? {})
          .map(([area, meta]) => [area, formatAreaFreshness(meta, locale, copy, nowMs)])
          .filter((entry): entry is [string, string] => typeof entry[1] === "string"),
      ) as Partial<Record<MonitorSnapshotArea, string>>)
    : {};

  return {
    metrics,
    status: { tone: status ? statusLevelToTone(status.level) : "neutral", title: statusTitle },
    blockedItems,
    blockedBadge,
    riskItems,
    riskBadge,
    pendingItems,
    pendingBadge,
    throughputDaily,
    throughputRows,
    flagItems: [],
    flagBadge: "—",
    areaFreshness,
  };
}

"use client";
import { BusinessListToolbar, BusinessFilterField } from "@shared/components/business-filters";

import { useMemo, type ReactNode } from "react";

import { Segmented } from "@trade-os/reference-3030/components/platform/SegmentedControl";
import { ChipGroup } from "@trade-os/reference-3030/components/platform/ChipGroup";
import { InfoBox } from "@trade-os/reference-3030/components/platform/InfoBox";
import { MetricCard, type MetricTone } from "@trade-os/reference-3030/components/platform/MetricCard";
import { PageHeader } from "@trade-os/reference-3030/components/platform/PageHeader";
import { DashboardLayout } from "@trade-os/reference-3030/components/platform/ScreenLayouts";
import {
  BlockedCard,
  FlagFeedCard,
  MonitorEmptyStates,
  PendingActionCard,
  RiskCard,
  ThroughputDrilldown,
} from "@trade-os/reference-3030/components/platform/ScreenSupportUnits";
import { SectionPanel } from "@trade-os/reference-3030/components/platform/SectionPanel";
import { StatusBadge } from "@trade-os/reference-3030/components/platform/StatusBadge";
import { TaskQueue, type TaskQueueItem } from "@trade-os/reference-3030/components/platform/TaskQueue";
import { Button } from "@trade-os/reference-3030/components/ui/button";
import { DataTable, type DataTableColumn } from "@trade-os/reference-3030/components/ui/table";

import { ErpScreenFrame } from "./ErpScreenFrame";

import type { MonitorLiveView } from "@trade-os/reference-3030/features/erp/monitor/mapMonitorLive";
import { MONITOR_LIMIT_CHOICES, type MonitorLimit, type MonitorPeriod } from "@trade-os/reference-3030/lib/api/monitor";

type MonitorVariant = "default" | "ops";

type MonitorBodyActions = {
  onOpsDetail?: () => void;
  onDealsList?: () => void;
  onSummary?: () => void;
  onThisWeek?: () => void;
  onStatusFilter?: () => void;
  riskFilterId?: "schedule" | "qty";
  onRiskFilterChange?: (id: "schedule" | "qty") => void;
  // SC-13 §구역·행동·호출 KPI·상태·처리량: "기간·수량 필터, 새로고침".
  period?: MonitorPeriod;
  onPeriodChange?: (period: MonitorPeriod) => void;
  limit?: MonitorLimit;
  onLimitChange?: (limit: MonitorLimit) => void;
  onRefresh?: () => void;
  refreshBusy?: boolean;
};

// MonitorBody/MonitorRightPanel 은 쇼케이스(MonitorScreen)와 라이브(MonitorConnected/MonitorShell)가
// 공유한다. 하드코드 카피는 영어 기본으로 두고, 라이브는 erp-monitor(+erp-common) 로케일 카피를
// copy prop 으로 주입한다. 쇼케이스는 미주입 → 영어 기본.
type MonitorBodyCopy = {
  titleDefault: string;
  titleOps: string;
  description: string;
  descriptionOps: string;
  actionsOpsDetail: string;
  actionsDealsList: string;
  actionsSummary: string;
  actionsThisWeek: string;
  statusFilter: string;
  statusFilterList: string;
  // W8-V2a: 카드 타이틀도 주입 가능 카피 — 쇼케이스는 영어 대문자 정본 유지, 라이브는 한국어 라벨.
  blockedTitle: string;
  riskTitle: string;
  flagTitle: string;
  pendingTitle: string;
  blockedDesc: string;
  blockedDescOps: string;
  riskDesc: string;
  riskDescOps: string;
  pendingDesc: string;
  flagDesc: string;
  // #421: 확인 전 / 확인함 전환 필터 — FS-06 §2의 운영 감시 플래그 확인 여부를 드러낸다.
  flagDescChecked: string;
  flagFilterLabel: string;
  flagFilterUnchecked: string;
  flagFilterChecked: string;
  throughputTitle: string;
  throughputDesc: string;
  throughputOwner: string;
  throughputUploads: string;
  throughputRate: string;
  throughputEmpty: string;
  filterSchedule: string;
  filterQty: string;
  // SC-13 KPI·상태·처리량 구역의 "기간·수량 필터, 새로고침".
  periodLabel: string;
  periodCurrent: string;
  periodLast: string;
  limitFilterLabel: string;
  limitFilterOption: string;
  refresh: string;
  // SC-13 Badge Matrix "모니터 영역 · `조회 실패`" — 실패한 영역의 위험 배지 문구.
  areaLoadFailed: string;
  emptyTitle: string;
  emptyDesc: string;
  emptyInviteTitle: string;
  emptyInviteDesc: string;
  emptyHealthyTitle: string;
  emptyHealthyDesc: string;
  // erp-common.platform.taskQueueEmpty (라이브에서 함께 주입).
  taskQueueEmpty: string;
};

type MonitorRightPanelCopy = {
  ownerPrinciple: string;
  roleLabel: string;
  roleValue: string;
  limitLabel: string;
  limitValue: string;
  scopeLabel: string;
  scopeValue: string;
  nextAction: string;
  taskQueueEmpty: string;
};

const DEFAULT_MONITOR_BODY_COPY: MonitorBodyCopy = {
  titleDefault: "Monitor",
  titleOps: "Monitor · Operations detail",
  description: "Owner operations watch · Prioritize Blocked, Risk, Flag Feed, and Pending Action.",
  descriptionOps: "Phase 2 operations watch · Blocked / Risk / Flag Feed / Pending Action",
  actionsOpsDetail: "Operations detail",
  actionsDealsList: "Deals list",
  actionsSummary: "Summary",
  actionsThisWeek: "This week",
  statusFilter: "Apply filter",
  statusFilterList: "Apply list filter",
  blockedTitle: "BLOCKED",
  riskTitle: "RISK",
  flagTitle: "FLAG FEED",
  pendingTitle: "PENDING ACTION",
  blockedDesc: "Unprocessed for 24h after upload, ETD D-2 unconfirmed",
  blockedDescOps: "Shown in P0 → P1 order",
  riskDesc: "Excludes dismissed risks · active only",
  riskDescOps: "Excludes dismissed risks",
  pendingDesc: "In D-0 → D-1 → D-2 order",
  flagDesc: "Flags awaiting Owner review",
  flagDescChecked: "Flags the Owner already checked",
  flagFilterLabel: "Check state",
  flagFilterUnchecked: "Unchecked",
  flagFilterChecked: "Checked",
  throughputTitle: "Completion-rate drilldown",
  throughputDesc: "Bars by date + counts by owner",
  throughputOwner: "Owner",
  throughputUploads: "Uploads",
  throughputRate: "Completion rate",
  throughputEmpty: "No completed confirms to show yet.",
  filterSchedule: "Schedule",
  filterQty: "Quantity",
  periodLabel: "Period",
  periodCurrent: "This week",
  periodLast: "Last week",
  limitFilterLabel: "Rows",
  limitFilterOption: "{count} rows",
  refresh: "Refresh",
  areaLoadFailed: "Load failed",
  emptyTitle: "Empty state",
  emptyDesc: "Shown when operations are healthy",
  emptyInviteTitle: "Invite teammates to see operations status",
  emptyInviteDesc: "Once the Owner invites teammates, processing status is aggregated.",
  emptyHealthyTitle: "All deals are healthy",
  emptyHealthyDesc: "No P0s, risks, or unchecked flags.",
  taskQueueEmpty: "No tasks to show.",
};

const DEFAULT_MONITOR_RIGHT_PANEL_COPY: MonitorRightPanelCopy = {
  ownerPrinciple: "Owner principle",
  roleLabel: "Role",
  roleValue: "List view · action prompts",
  limitLabel: "Limit",
  limitValue: "No direct entry to Confirm Inbox",
  scopeLabel: "Data scope",
  scopeValue: "Whole organization",
  nextAction: "Next action",
  taskQueueEmpty: "No tasks to show.",
};

type MonitorMetric = {
  id: string;
  label: ReactNode;
  value: ReactNode;
  meta?: ReactNode;
  tone?: MetricTone;
};

type ThroughputRow = {
  key: string;
  owner: ReactNode;
  uploads: ReactNode;
  confirms: ReactNode;
  rate: ReactNode;
};

const throughputRows: ThroughputRow[] = [
  { key: "kim", owner: "김철수", uploads: "42", confirms: "31", rate: <StatusBadge tone="success">74%</StatusBadge> },
  { key: "lee", owner: "이박사", uploads: "36", confirms: "19", rate: <StatusBadge tone="warning">53%</StatusBadge> },
  { key: "choi", owner: "최팀장", uploads: "28", confirms: "12", rate: <StatusBadge tone="danger">43%</StatusBadge> },
];

function buildThroughputColumns(copy: MonitorBodyCopy): DataTableColumn<ThroughputRow>[] {
  return [
    { key: "owner", header: copy.throughputOwner, align: "left", sort: "inactive", render: (row) => row.owner },
    { key: "uploads", header: copy.throughputUploads, align: "center", render: (row) => row.uploads },
    { key: "confirms", header: "Confirm", align: "center", render: (row) => row.confirms },
    { key: "rate", header: copy.throughputRate, align: "center", render: (row) => row.rate },
  ];
}

const blockedItems: TaskQueueItem[] = [
  {
    id: "blocked-bl",
    serviceLabel: "P0",
    serviceTone: "danger",
    title: "BL_HBLG24050019.pdf",
    meta: "한빛 로지스 · 업로드 후 26h 미처리",
    dueLabel: "26h",
    dueTone: "today",
  },
  {
    id: "blocked-po",
    serviceLabel: "P0",
    serviceTone: "danger",
    title: "PO_240518_K2HK.pdf",
    meta: "GLOB Trading · Confirm 대기",
    dueLabel: "25h",
    dueTone: "today",
  },
  {
    id: "blocked-etd",
    serviceLabel: "P1",
    serviceTone: "warning",
    title: "ETD D-2 미확인",
    meta: "MAEU-031 · 선적 단계",
    dueLabel: "D-2",
    dueTone: "soon",
  },
];

/** ops 정본은 BLOCKED 행 meta 어순/시간이 default와 다름 (monitor-ops.html:95,100); 3행은 동일. */
const opsBlockedItems: TaskQueueItem[] = blockedItems.map((item) => {
  if (item.id === "blocked-bl") return { ...item, meta: "업로드 후 24h 미처리 · 한빛 로지스" };
  if (item.id === "blocked-po") return { ...item, meta: "Confirm 대기 · GLOB Trading" };
  return item;
});

const riskItems: TaskQueueItem[] = [
  {
    id: "risk-delay",
    serviceLabel: "일정",
    serviceTone: "warning",
    title: "일정 지연 · PEND-003",
    meta: "BL ETA가 PO Target ETD보다 +5일",
    dueLabel: "+5일",
    dueTone: "soon",
  },
  {
    id: "risk-qty",
    serviceLabel: "수량",
    serviceTone: "danger",
    title: "수량 불일치 · ACME-004",
    meta: "PO 1,000EA · BL 980EA",
    dueLabel: "-20EA",
    dueTone: "today",
  },
];

const flagItems: TaskQueueItem[] = [
  {
    id: "flag-bl",
    serviceLabel: "BL",
    serviceTone: "danger",
    title: "ACME-001 · 단가 확인 필요",
    meta: "Operator 김철수 · 05/12 14:32",
    actionLabel: "확인함",
  },
  {
    id: "flag-po",
    serviceLabel: "PO",
    serviceTone: "warning",
    title: "GLOB-002 · 수량 오류",
    meta: "Operator 최팀장 · 05/11 09:15",
    actionLabel: "확인함",
  },
];

const pendingItems: TaskQueueItem[] = [
  {
    id: "pending-d0",
    serviceLabel: "D-0",
    serviceTone: "danger",
    title: "송금 완료 처리 필요",
    meta: "PO250516-PT · $142,630",
    dueLabel: "결제",
    dueTone: "today",
  },
  {
    id: "pending-d1",
    serviceLabel: "D-1",
    serviceTone: "warning",
    title: "결제 예정 확인",
    meta: "BL-250516-001 · $228,020",
    dueLabel: "확인",
    dueTone: "soon",
  },
  {
    id: "pending-d2",
    serviceLabel: "D-2",
    serviceTone: "warning",
    title: "BL 미Confirm · ETD 임박",
    meta: "INV-250514-077 · $5,230",
    dueLabel: "미Confirm",
    dueTone: "soon",
  },
];

const defaultMetrics: MonitorMetric[] = [
  { id: "today", label: "오늘 처리", value: "128", meta: "▲ 12.8% vs 어제", tone: "success" },
  { id: "rate", label: "완료율", value: "68%", meta: <MetricBar value={68} />, tone: "warning" },
  { id: "payment", label: "대기 결제", value: "34건", meta: "payment_schedules pending" },
  { id: "ar", label: "AR 회수예정", value: "$9.62M", meta: "▲ 15.2% vs 어제", tone: "success" },
];

const opsMetrics: MonitorMetric[] = [
  { id: "today", label: "오늘 처리", value: "128", meta: "어제보다 +12.8%", tone: "success" },
  { id: "rate", label: "완료율", value: "68%", meta: "지난주 대비 -4%p", tone: "warning" },
];

function MetricBar({ value }: { value: number }) {
  return (
    <span className="block h-2 w-full overflow-hidden rounded-full bg-ecoya-gray-10">
      <span
        className="block h-full rounded-full bg-ecoya-blue-4"
        style={{ width: `${value}%` }}
      />
    </span>
  );
}

// empty 모드: KPI 값은 "—", meta/tone 은 드롭(라벨은 정적 UI 이므로 유지).
function toEmptyMetrics(items: MonitorMetric[]): MonitorMetric[] {
  return items.map((item) => ({ id: item.id, label: item.label, value: "—" }));
}

function MonitorMetricGrid({ items, empty = false }: { items: MonitorMetric[]; empty?: boolean }) {
  const resolved = empty ? toEmptyMetrics(items) : items;
  return (
    <section
      className={resolved.length > 2 ? "grid grid-cols-4 gap-3 max-[1180px]:grid-cols-2" : "grid grid-cols-2 gap-3 max-[900px]:grid-cols-1"}
      data-component="KpiStrip"
    >
      {resolved.map((item) => (
        <MetricCard
          key={item.id}
          label={item.label}
          value={item.value}
          meta={item.meta}
          tone={item.tone}
        />
      ))}
    </section>
  );
}

function FilterPills({
  actions,
  copy,
  live,
}: {
  actions?: MonitorBodyActions;
  copy: MonitorBodyCopy;
  live: boolean;
}) {
  const disabled = live && !actions?.onRiskFilterChange;
  return (
    <ChipGroup
      className="mb-3"
      items={[
        { id: "schedule", label: copy.filterSchedule, disabled },
        { id: "qty", label: copy.filterQty, disabled },
      ]}
      onSelect={(id) => {
        if (id === "schedule" || id === "qty") actions?.onRiskFilterChange?.(id);
      }}
      selectedId={actions?.riskFilterId ?? "schedule"}
    />
  );
}

// SC-13 §구역·행동·호출: KPI·상태·처리량 세 구역이 같은 "기간·수량 필터, 새로고침" 를 공유하므로
// 구역마다 세 벌을 그리지 않고 본문 상단에 한 벌을 둔다. 기간은 처리량의 주 창을, 수량은 목록
// 구역의 페이지 크기를 정한다(lib/api/monitor.ts monitorReaderFor).
function MonitorFilters({
  actions,
  copy,
}: {
  actions?: MonitorBodyActions;
  copy: MonitorBodyCopy;
}) {
  const { onPeriodChange, onLimitChange, onRefresh } = actions ?? {}
  if (!onPeriodChange && !onLimitChange && !onRefresh) return null
  const period = actions?.period ?? "current"
  const limit = actions?.limit ?? MONITOR_LIMIT_CHOICES[1]
  const busy = Boolean(actions?.refreshBusy)

  return (
    <BusinessListToolbar
      data-ui="monitor-filters"
      aria-label="운영 감시 필터"
      actions={
        onRefresh ? (
          <Button
            data-ui="monitor-refresh"
            disabled={busy}
            onClick={onRefresh}
            size="sm"
            type="button"
            variant="tertiary"
          >
            {copy.refresh}
          </Button>
        ) : null
      }
    >
      {onPeriodChange ? (
        <BusinessFilterField label={copy.periodLabel}>
          <Segmented
            ariaLabel={copy.periodLabel}
            disabled={busy}
            options={[
              { id: "current", label: copy.periodCurrent },
              { id: "last", label: copy.periodLast },
            ]}
            onChange={(id) => {
              if (id === "current" || id === "last") onPeriodChange(id)
            }}
            value={period}
          />
        </BusinessFilterField>
      ) : null}
      {onLimitChange ? (
        <BusinessFilterField label={copy.limitFilterLabel}>
          <Segmented
            ariaLabel={copy.limitFilterLabel}
            disabled={busy}
            options={MONITOR_LIMIT_CHOICES.map((count) => ({
              id: String(count),
              label: copy.limitFilterOption.replaceAll(
                "{count}",
                String(count)
              ),
            }))}
            onChange={(id) => {
              const next = MONITOR_LIMIT_CHOICES.find(
                (count) => String(count) === id
              )
              if (next !== undefined) onLimitChange(next)
            }}
            value={String(limit)}
          />
        </BusinessFilterField>
      ) : null}
    </BusinessListToolbar>
  )
}

// FS-06 §4: "risks·pending actions·blocked 등 보조 응답은 자체 기준시각이 있으면 그 영역에만
// 표시하고 KPI·상태·처리량 시각에 합치지 않는다." 그래서 구역 설명 아래에 그 구역의 값만 붙인다.
function withAreaFreshness(
  description: ReactNode,
  entries: Array<{ area: string; value?: string }>,
): ReactNode {
  const present = entries.filter((entry): entry is { area: string; value: string } => Boolean(entry.value));
  if (present.length === 0) return description;
  return (
    <span>
      {description}
      {present.map((entry) => (
        <span key={entry.area}>
          <br />
          <span data-ui={`monitor-data-as-of-${entry.area}`}>{entry.value}</span>
        </span>
      ))}
    </span>
  );
}

/**
 * SC-13 Badge Matrix: 조회에 실패한 영역은 위험 톤 `조회 실패` 배지를 단다.
 * 실패했는데 마지막 정상값이 없으면 카운트 배지가 0·"—" 로 남아 "문제 없음"처럼
 * 읽힌다 — 그 자리를 실패 배지로 바꾼다("마지막 정상값을 유지하고 영역만 재시도").
 */
function areaFailureBadge(label: string | undefined, area: string): ReactNode | null {
  if (!label) return null;
  // StatusBadge 는 자체 `data-ui="status-badge"` 를 props 뒤에 덮어쓰므로
  // 식별자는 data-testid 로 단다.
  return (
    <StatusBadge data-testid={`monitor-area-failed-${area}`} tone="danger">
      {label}
    </StatusBadge>
  );
}

function MonitorActions({
  actions,
  variant,
  copy,
  live,
}: {
  actions?: MonitorBodyActions;
  variant: MonitorVariant;
  copy: MonitorBodyCopy;
  live: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {variant === "ops" ? (
        <>
          <Button disabled={live && !actions?.onSummary} onClick={actions?.onSummary} size="sm" variant="tertiary">
            {copy.actionsSummary}
          </Button>
          <Button disabled={live && !actions?.onThisWeek} onClick={actions?.onThisWeek} size="sm" variant="secondary">
            {copy.actionsThisWeek}
          </Button>
        </>
      ) : (
        <>
          <Button disabled={live && !actions?.onOpsDetail} onClick={actions?.onOpsDetail} size="sm" variant="tertiary">
            {copy.actionsOpsDetail}
          </Button>
          <Button disabled={live && !actions?.onDealsList} onClick={actions?.onDealsList} size="sm" variant="secondary">
            {copy.actionsDealsList}
          </Button>
        </>
      )}
    </div>
  );
}

const monitorPanelItems: TaskQueueItem[] = [
  {
    id: "panel-p0",
    serviceLabel: "P0",
    serviceTone: "danger",
    title: "업로드 후 24h 미처리",
    meta: "BL_HBLG24050019.pdf",
    dueLabel: "26h",
    dueTone: "today",
  },
  {
    id: "panel-d0",
    serviceLabel: "D-0",
    serviceTone: "danger",
    title: "송금 완료 처리",
    meta: "PO250516-PT",
    dueLabel: "결제",
    dueTone: "today",
  },
];

function MonitorRightPanel({
  ops,
  empty = false,
  copy: copyOverride,
}: {
  ops: boolean;
  empty?: boolean;
  copy?: Partial<MonitorRightPanelCopy>;
}) {
  const copy = { ...DEFAULT_MONITOR_RIGHT_PANEL_COPY, ...copyOverride };
  return (
    <div className="grid h-full gap-3" data-component="MyPanel">
      <SectionPanel title={copy.ownerPrinciple} density="compact">
        <div className="grid gap-3 text-body-14 font-regular text-ecoya-gray-5">
          <div><strong className="text-ecoya-gray-2">{copy.roleLabel}</strong><div>{copy.roleValue}</div></div>
          <div><strong className="text-ecoya-gray-2">{copy.limitLabel}</strong><div>{copy.limitValue}</div></div>
          {/* empty: 데이터 범위(scope)는 동적 값이므로 "—" (라벨은 정적 UI 로 유지) */}
          <div><strong className="text-ecoya-gray-2">{copy.scopeLabel}</strong><div>{empty ? "—" : copy.scopeValue}</div></div>
        </div>
      </SectionPanel>
      {/* ops 정본 MyPanel은 Owner 원칙 카드만 포함 (monitor-ops.html:216-225) */}
      {!ops && (
        <TaskQueue
          title={copy.nextAction}
          action={<StatusBadge tone="danger">{empty ? "—" : "P0"}</StatusBadge>}
          empty={copy.taskQueueEmpty}
          items={empty ? [] : monitorPanelItems}
        />
      )}
    </div>
  );
}

// empty 모드: 요일 라벨(정적)은 유지하되 건수 값은 "—"·active 톤 제거(ProgressBar/MetricBar=0 규칙 준용).
const throughputBars = [
  { day: "월", count: "18", active: true },
  { day: "화", count: "24", active: true },
  { day: "수", count: "31", active: true },
  { day: "목", count: "12", active: false },
];

function ThroughputPanel({
  ops,
  empty = false,
  live,
  copy,
}: {
  ops: boolean;
  empty?: boolean;
  live?: MonitorLiveView;
  copy: MonitorBodyCopy;
}) {
  const bars = live ? live.throughputDaily : throughputBars;
  const rows = live ? live.throughputRows : throughputRows;
  const hasLiveActivity = bars.some((item) => item.active) || rows.length > 0;
  const showLiveEmpty = Boolean(live) && !empty && !hasLiveActivity;
  const rateBadge = live
    ? live.metrics.find((metric) => metric.id === "rate")?.value ?? "—"
    : ops
      ? undefined
      : "68%";
  const throughputColumns = buildThroughputColumns(copy);
  const throughputDescription = withAreaFreshness(copy.throughputDesc, [
    { area: "throughput", value: live?.areaFreshness?.throughput },
  ]);
  const throughputFailure = areaFailureBadge(live?.areaFailures?.throughput, "throughput");

  return (
    <ThroughputDrilldown
      action={
        throughputFailure ?? (
          empty || showLiveEmpty ? (
            <StatusBadge tone="info">—</StatusBadge>
          ) : ops ? undefined : (
            <StatusBadge tone="info">{String(rateBadge)}</StatusBadge>
          )
        )
      }
      data-component="ThroughputDrilldown"
      title={copy.throughputTitle}
      description={throughputDescription}
    >
      {showLiveEmpty ? (
        <div className="text-body-14 text-ecoya-gray-5" data-ui="throughput-empty">
          {copy.throughputEmpty}
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="grid grid-cols-4 gap-2">
            {bars.map((item) => {
              const active = empty ? false : item.active;
              return (
                <div
                  className={`grid min-h-[72px] place-items-center rounded-md border text-center text-label-12 font-medium ${
                    active ? "border-ecoya-blue-8 bg-ecoya-blue-10 text-ecoya-blue-4" : "border-ecoya-gray-10 bg-ecoya-gray-12 text-ecoya-gray-5"
                  }`}
                  key={item.day}
                >
                  <span>{item.day}<br />{empty ? "—" : item.count}</span>
                </div>
              );
            })}
          </div>
          <div className="min-w-0 overflow-x-auto" data-ui="monitor-throughput-table-scroll">
            <DataTable className="min-w-[560px]" columns={throughputColumns} rows={empty ? [] : rows} />
          </div>
        </div>
      )}
    </ThroughputDrilldown>
  );
}

function FlagFeedSection({
  empty = false,
  items,
  badge,
  onAck,
  checked = false,
  onCheckedChange,
  busy = false,
  readOnly = false,
  copy,
}: {
  empty?: boolean;
  items?: TaskQueueItem[];
  badge?: string;
  onAck?: (flagId: string) => void;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  busy?: boolean;
  readOnly?: boolean;
  copy: MonitorBodyCopy;
}) {
  const resolved = items ?? flagItems;
  const resolvedBadge = badge ?? (empty ? "—" : "2건");
  const queueItems = empty
    ? []
    : resolved.map((item) => {
        if (!item.actionLabel) return item;
        return {
          ...item,
          ...(onAck && !readOnly ? { onAction: () => onAck(item.id) } : {}),
          ...(readOnly ? { actionDisabled: true } : {}),
        };
      });

  return (
    <FlagFeedCard
      aria-busy={busy}
      data-component="FlagFeedCard"
      contentProps={{ tabIndex: 0, role: "region", "aria-label": `${copy.flagTitle} 목록` }}
      title={copy.flagTitle}
      description={checked ? copy.flagDescChecked : copy.flagDesc}
      action={<StatusBadge tone={checked ? "neutral" : "danger"}>{resolvedBadge}</StatusBadge>}
    >
      {onCheckedChange ? (
        <ChipGroup
          aria-label={copy.flagFilterLabel}
          className="mb-3"
          data-ui="flag-checked-filter"
          items={[
            { id: "unchecked", label: copy.flagFilterUnchecked },
            { id: "checked", label: copy.flagFilterChecked },
          ]}
          onSelect={(id) => onCheckedChange(id === "checked")}
          roleMode="tabs"
          selectedId={checked ? "checked" : "unchecked"}
        />
      ) : null}
      <TaskQueue empty={copy.taskQueueEmpty} items={queueItems} />
    </FlagFeedCard>
  );
}

function PendingActionSection({
  empty = false,
  items,
  badge,
  freshness,
  failure,
  copy,
}: {
  empty?: boolean;
  items?: TaskQueueItem[];
  badge?: string;
  freshness?: string;
  failure?: string;
  copy: MonitorBodyCopy;
}) {
  const resolved = items ?? pendingItems;
  const resolvedBadge = badge ?? (empty ? "—" : "4건");
  return (
    <PendingActionCard
      data-component="PendingActionCard"
      contentProps={{ tabIndex: 0, role: "region", "aria-label": `${copy.pendingTitle} 목록` }}
      title={copy.pendingTitle}
      description={withAreaFreshness(copy.pendingDesc, [{ area: "pending", value: freshness }])}
      action={
        areaFailureBadge(failure, "pending") ?? <StatusBadge tone="info">{resolvedBadge}</StatusBadge>
      }
    >
      <TaskQueue empty={copy.taskQueueEmpty} items={empty ? [] : resolved} />
    </PendingActionCard>
  );
}

function EmptyStatesPanel({ copy }: { copy: MonitorBodyCopy }) {
  return (
    <MonitorEmptyStates data-component="MonitorEmptyStates" title={copy.emptyTitle} description={copy.emptyDesc}>
      <div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
        <InfoBox tone="neutral" title={copy.emptyInviteTitle} description={copy.emptyInviteDesc} />
        <InfoBox tone="positive" title={copy.emptyHealthyTitle} description={copy.emptyHealthyDesc} />
      </div>
    </MonitorEmptyStates>
  );
}

// 화면 본문(셸 제외) — 디자인 미러(ErpScreenFrame)와 실제 /erp/monitor 라우트(실제
// PlatformShell)가 같은 정본 조립을 공유하도록 분리한다. HomeBody 선례와 동일 패턴.
function MonitorBody({
  variant = "default",
  empty = false,
  live,
  onAckFlag,
  flagChecked,
  onFlagCheckedChange,
  flagBusy,
  readOnly = false,
  actions,
  copy: copyOverride,
  overview,
}: {
  overview?: ReactNode;
  variant?: MonitorVariant;
  empty?: boolean;
  live?: MonitorLiveView;
  onAckFlag?: (flagId: string) => void;
  flagChecked?: boolean;
  onFlagCheckedChange?: (checked: boolean) => void;
  flagBusy?: boolean;
  readOnly?: boolean;
  actions?: MonitorBodyActions;
  copy?: Partial<MonitorBodyCopy>;
}) {
  const ops = variant === "ops";
  const isEmpty = empty && !live;
  const disableUnwiredLiveFlags = Boolean(live) && !onAckFlag;
  const metrics = live ? live.metrics : ops ? opsMetrics : defaultMetrics;
  const copy = useMemo(() => ({ ...DEFAULT_MONITOR_BODY_COPY, ...copyOverride }), [copyOverride]);
  const titleBar = useMemo(
    () => (
      <div className="reference-content-width w-full px-7 pt-6">
      <PageHeader
        data-component="PageTitleBar"
        variant="hero"
        actions={<MonitorActions actions={actions} variant={variant} copy={copy} live={Boolean(live)} />}
        className="max-[600px]:grid-cols-1 max-[600px]:items-start max-[600px]:gap-2"
        title={ops ? copy.titleOps : copy.titleDefault}
        description={ops ? copy.descriptionOps : copy.description}
        filters={<MonitorFilters actions={actions} copy={copy} />}
        summary={<MonitorMetricGrid items={metrics} empty={isEmpty} />}
      />
      </div>
    ),
    [actions, ops, variant, copy, live, metrics, isEmpty],
  );

  return (
    <DashboardLayout
      data-screen-component="MonitorScreen"
      data-screen-variant={variant}
      titleBar={titleBar}
    >
      {live?.areaFailures?.kpi ? (
        <p className="text-xs" data-ui="monitor-area-failed-kpi-line" role="status">
          {areaFailureBadge(live.areaFailures.kpi, "kpi")}
        </p>
      ) : null}
      {live?.areaFreshness?.kpi ? (
        <p className="text-xs text-secondary" data-ui="monitor-data-as-of-kpi">
          {live.areaFreshness.kpi}
        </p>
      ) : null}
      {overview}
      <InfoBox
        data-component="StatusLine"
        tone={live?.status.tone ?? "risk"}
        title={isEmpty ? "" : live ? live.status.title : ops ? "긴급 조치 필요 — P0 미처리 3건" : "긴급 조치 필요 — P0 미처리 3건 · 미확인 플래그 1건"}
        description={live?.areaFreshness?.status || live?.areaFailures?.status ? (
          <span>
            {areaFailureBadge(live?.areaFailures?.status, "status")}
            {live?.areaFreshness?.status ? (
              <span data-ui="monitor-data-as-of-status">{live.areaFreshness.status}</span>
            ) : null}
          </span>
        ) : undefined}
        action={
          <Button
            disabled={Boolean(live) && !actions?.onStatusFilter}
            onClick={actions?.onStatusFilter}
            size="sm"
            variant="tertiary"
          >
            {ops ? copy.statusFilter : copy.statusFilterList}
          </Button>
        }
      />
      <section className="monitor-operation-columns" data-component="MonitorOperationGrid">
        <BlockedCard
          data-component="BlockedCard"
          contentProps={{ tabIndex: 0, role: "region", "aria-label": `${copy.blockedTitle} 목록` }}
          title={copy.blockedTitle}
          description={withAreaFreshness(ops ? copy.blockedDescOps : copy.blockedDesc, [
            { area: "blockedP0", value: live?.areaFreshness?.blockedP0 },
            { area: "blockedP1", value: live?.areaFreshness?.blockedP1 },
          ])}
          action={
            areaFailureBadge(
              live?.areaFailures?.blockedP0 ?? live?.areaFailures?.blockedP1,
              "blocked",
            ) ?? (
              <StatusBadge tone="danger">{isEmpty ? "—" : live ? live.blockedBadge : "P0 3건"}</StatusBadge>
            )
          }
        >
          <TaskQueue empty={copy.taskQueueEmpty} items={isEmpty ? [] : live ? live.blockedItems : ops ? opsBlockedItems : blockedItems} />
        </BlockedCard>
        <RiskCard
          data-component="RiskCard"
          contentProps={{ tabIndex: 0, role: "region", "aria-label": `${copy.riskTitle} 목록` }}
          title={copy.riskTitle}
          description={withAreaFreshness(ops ? copy.riskDescOps : copy.riskDesc, [
            { area: "risks", value: live?.areaFreshness?.risks },
          ])}
          action={
            areaFailureBadge(live?.areaFailures?.risks, "risks") ?? (
              <StatusBadge tone="warning">{isEmpty ? "—" : live ? live.riskBadge : "2건"}</StatusBadge>
            )
          }
        >
          {ops ? <FilterPills actions={actions} copy={copy} live={Boolean(live)} /> : null}
          <TaskQueue empty={copy.taskQueueEmpty} items={isEmpty ? [] : live ? live.riskItems : riskItems} />
        </RiskCard>
        <FlagFeedSection
          empty={isEmpty}
          items={live?.flagItems}
          badge={live?.flagBadge}
          onAck={onAckFlag}
          checked={flagChecked}
          onCheckedChange={onFlagCheckedChange}
          busy={flagBusy}
          readOnly={readOnly || disableUnwiredLiveFlags}
          copy={copy}
        />
        <PendingActionSection empty={isEmpty} items={live?.pendingItems} badge={live?.pendingBadge} freshness={live?.areaFreshness?.pending} failure={live?.areaFailures?.pending} copy={copy} />
      </section>
      <section className={live ? "grid gap-4" : "grid grid-cols-2 gap-4 max-[1180px]:grid-cols-1"}>
        <ThroughputPanel ops={ops} empty={isEmpty} live={live} copy={copy} />
        {!live && <EmptyStatesPanel copy={copy} />}
      </section>
    </DashboardLayout>
  );
}

function MonitorScreen({ variant = "default" }: { variant?: MonitorVariant }) {
  const ops = variant === "ops";
  const rightPanel = useMemo(() => <MonitorRightPanel ops={ops} />, [ops]);

  return (
    <ErpScreenFrame
      active="monitor"
      breadcrumbs={[{ id: "service", label: "ERP" }, { id: "page", label: "Monitor" }]}
      rightPanel={rightPanel}
    >
      <MonitorBody variant={variant} />
    </ErpScreenFrame>
  );
}

export { MonitorBody, MonitorRightPanel, MonitorScreen };
export type { MonitorBodyActions, MonitorBodyCopy, MonitorRightPanelCopy, MonitorVariant };

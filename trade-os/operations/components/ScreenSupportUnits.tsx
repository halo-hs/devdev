import type { ComponentProps, ReactNode } from "react";

import { InfoBox } from "@trade-os/operations/components/InfoBox";
import { MetricCard } from "@trade-os/operations/components/MetricCard";
import { SectionPanel, type SectionPanelProps } from "@trade-os/operations/components/SectionPanel";
import { StatusBadge } from "@trade-os/operations/components/StatusBadge";
import { DataTable, type DataTableColumn } from "@trade-os/operations/components/ui/table";

type UnitPanelProps = Omit<SectionPanelProps, "title"> & {
  title?: ReactNode;
  description?: ReactNode;
};

type MetricItem = {
  id: string;
  label: ReactNode;
  value: ReactNode;
  meta?: ReactNode;
  tone?: ComponentProps<typeof MetricCard>["tone"];
};

const defaultMetrics: MetricItem[] = [
  { id: "pending", label: "대기", value: 14, meta: "처리 필요", tone: "warning" },
  { id: "risk", label: "리스크", value: 3, meta: "high 포함", tone: "danger" },
  { id: "done", label: "완료", value: 52, meta: "이번 달", tone: "success" },
];

function UnitPanel({ title = "Component unit", description, children, ...props }: UnitPanelProps) {
  return (
    <SectionPanel title={title} description={description} density="compact" {...props}>
      {children ?? (
        <div className="text-body-14 font-regular text-ecoya-gray-5">
          reference/plan 기준으로 화면에 배치되는 제품 UI 단위입니다.
        </div>
      )}
    </SectionPanel>
  );
}

function MetricStrip({ items = defaultMetrics }: { items?: MetricItem[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <MetricCard key={item.id} label={item.label} value={item.value} meta={item.meta} tone={item.tone} />
      ))}
    </div>
  );
}

function StatusSummary({ title = "확인 필요", description = "우선순위 항목을 확인하세요." }) {
  return <InfoBox tone="caution" title={title} description={description} />;
}

type SimpleRow = {
  key: string;
  name: string;
  status: string;
  owner: string;
};

const simpleRows: SimpleRow[] = [
  { key: "row-1", name: "KOR-058", status: "진행 중", owner: "김도현" },
  { key: "row-2", name: "MAEU-031", status: "확인 필요", owner: "이서연" },
];

const simpleColumns: DataTableColumn<SimpleRow>[] = [
  { key: "name", header: "이름", align: "left", sort: "inactive", render: (row) => row.name },
  {
    key: "status",
    header: "상태",
    align: "center",
    render: (row) => <StatusBadge tone="info">{row.status}</StatusBadge>,
  },
  { key: "owner", header: "담당자", align: "center", render: (row) => row.owner },
];

function SimpleDataTable({ rows = simpleRows }: { rows?: SimpleRow[] }) {
  return <DataTable columns={simpleColumns} rows={rows} />;
}

function CopilotIntentPolicy(props: UnitPanelProps) {
  return <UnitPanel title="Intent 분류 → 템플릿 쿼리" description="Text-to-SQL 자유 질의가 아니라 정해진 업무 질문만 처리합니다." {...props} />;
}

function CopilotQueryComposer(props: UnitPanelProps) {
  return <UnitPanel title="쿼리 입력" description="LNB 탭 또는 글로벌 검색바에서 진입합니다." {...props} />;
}

function CopilotSupportedQueries(props: UnitPanelProps) {
  return <UnitPanel title="지원 쿼리 5종" description="템플릿 기반으로만 응답합니다." {...props} />;
}

function CopilotResponsePreview(props: UnitPanelProps) {
  return <UnitPanel title="응답 카드 예시" description="답변과 원본 링크를 함께 표시합니다." {...props} />;
}

function CopilotPhase1Notice(props: UnitPanelProps) {
  return <UnitPanel title="거래건 문서 내 키워드 검색만 현재 범위에 포함합니다." {...props} />;
}

function CopilotPhase1InlineSearch(props: UnitPanelProps) {
  return <UnitPanel title="Deal Detail 인라인 검색" {...props} />;
}

function CopilotPhase3DeferredScope(props: UnitPanelProps) {
  return <UnitPanel title="Phase 3 보류 범위" {...props} />;
}

function MonitorHeader(props: UnitPanelProps) {
  return <UnitPanel title="Monitor" description="Owner 운영 감시 · Blocked, Risk, Flag Feed, Pending Action" {...props} />;
}

function KpiStrip({ items, ...props }: UnitPanelProps & { items?: MetricItem[] }) {
  return (
    <UnitPanel title="KPI strip" description="운영 KPI 카드 묶음입니다." {...props}>
      <MetricStrip items={items} />
    </UnitPanel>
  );
}

function StatusLine({ children, ...props }: UnitPanelProps) {
  return (
    <UnitPanel title="긴급 조치 필요" description="P0 미처리와 미확인 플래그를 우선 확인합니다." {...props}>
      {children ?? <StatusSummary />}
    </UnitPanel>
  );
}

function MonitorOperationGrid(props: UnitPanelProps) {
  return <UnitPanel title="운영 카드" description="Blocked, Risk, Flag Feed, Pending Action을 긴급도 순서로 배치합니다." {...props} />;
}

function BlockedCard(props: UnitPanelProps) {
  return <UnitPanel title="BLOCKED" description="업로드 후 24h 미처리, ETD D-2 미확인" {...props} />;
}

function RiskCard(props: UnitPanelProps) {
  return <UnitPanel title="RISK" description="dismissed 리스크 제외 · active 기준" surface="warning" {...props} />;
}

function FlagFeedCard(props: UnitPanelProps) {
  return <UnitPanel title="FLAG FEED" description="owner_checked=false" {...props} />;
}

function PendingActionCard(props: UnitPanelProps) {
  return <UnitPanel title="PENDING ACTION" description="D-0 → D-1 → D-2 순" {...props} />;
}

function ThroughputDrilldown(props: UnitPanelProps) {
  return <UnitPanel title="완료율 드릴다운" description="날짜별 바 + 담당자별 건수" {...props} />;
}

function MonitorEmptyStates(props: UnitPanelProps) {
  return <UnitPanel title="빈 상태" description="운영이 정상일 때 표시" {...props} />;
}

function OperatorJoinScreen(props: UnitPanelProps) {
  return <UnitPanel title="Operator 합류 화면" description="시작하기 → Inbox" {...props} />;
}

function AdminJoinScreen(props: UnitPanelProps) {
  return <UnitPanel title="Admin 합류 화면" description="시작하기 → Deals 목록" {...props} />;
}

function MemberJoinScreen(props: UnitPanelProps) {
  return <UnitPanel title="팀 합류" {...props} />;
}

function OwnerWelcomeModal(props: UnitPanelProps) {
  return <UnitPanel title="처음 시작" {...props} />;
}

function OnboardingChecklist(props: UnitPanelProps) {
  return <UnitPanel title="시작 가이드" {...props} />;
}

function OnboardingChecklistCompleted(props: UnitPanelProps) {
  return <UnitPanel title="완료 후 숨김" description="모든 적용 항목 완료 시 숨김" {...props} />;
}

function ConfirmTooltipTour(props: UnitPanelProps) {
  return <UnitPanel title="Confirm 뷰 툴팁 투어" description="첫 진입 시 1회 자동 · 도움말 버튼으로 재실행" {...props} />;
}

function SettingsModalShell(props: UnitPanelProps) {
  return <UnitPanel title="설정" description="설정 modal shell입니다." {...props} />;
}

function SettingsModalHeader(props: UnitPanelProps) {
  return <UnitPanel title="설정" description="설정 modal header입니다." {...props} />;
}

function SettingsTabNav(props: UnitPanelProps) {
  return <UnitPanel title="설정 탭" description="멤버 관리 · 토큰 사용량 · 결제/구독 navigation입니다." {...props} />;
}

function SettingsMemberPanel(props: UnitPanelProps) {
  return <UnitPanel title="멤버 관리" description="팀원 초대, 역할 변경, 이 멤버의 업무 함께 보기" {...props} />;
}

function MemberShareInlinePanel(props: UnitPanelProps) {
  return <UnitPanel title="함께 볼 사람" description="멤버 업무 함께 보기 인라인 panel입니다." {...props} />;
}

function SettingsPermissionsPanel(props: UnitPanelProps) {
  return <UnitPanel title="권한" description="역할별 탭 접근과 액션 범위를 확인합니다." {...props} />;
}

function InviteStatePanel(props: UnitPanelProps) {
  return <UnitPanel title="초대 수락/취소 상태" description="초대 링크와 수락 상태를 표시합니다." {...props} />;
}

function ShareWordingPanel(props: UnitPanelProps) {
  return <UnitPanel title="공유 문구 규칙" description="권한 모델 설명 대신 작업 문구만 사용합니다." {...props} />;
}

function SettingsBillingPanel(props: UnitPanelProps) {
  return <UnitPanel title="결제 설정" description="토큰 사용량과 결제/구독 상태입니다." {...props} />;
}

function TokenUsagePanel(props: UnitPanelProps) {
  return <UnitPanel title="이번 달 토큰 사용량" description="Paid 토큰은 매월 리셋되며 미사용분은 이월되지 않습니다." {...props} />;
}

function SubscriptionPanel(props: UnitPanelProps) {
  return <UnitPanel title="결제·구독" description="Paddle Webhook으로 구독 상태를 동기화합니다." {...props} />;
}

function SettingsMemberActionPanel(props: UnitPanelProps) {
  return <UnitPanel title="멤버 액션" description="초대, 삭제, 권한 변경 액션 상태입니다." {...props} />;
}

function OnboardingRoutePanel(props: UnitPanelProps) {
  return <UnitPanel title="첫 화면 분기" {...props} />;
}

function OnboardingPolicyPanel(props: UnitPanelProps) {
  return <UnitPanel title="온보딩 정책" {...props} />;
}

function InviteMemberDialog(props: UnitPanelProps) {
  return <UnitPanel title="팀원 초대" description="이메일과 역할을 입력하는 초대 dialog preview입니다." {...props} />;
}

function PendingInviteState(props: UnitPanelProps) {
  return <UnitPanel title="초대 중 상태" description="초대 대기 member row 상태입니다." {...props} />;
}

function RemoveMemberDialog(props: UnitPanelProps) {
  return <UnitPanel title="멤버 내보내기" description="내보낼 멤버의 담당 거래건 처리 방식을 선택합니다." {...props} />;
}

function DealTransferPicker(props: UnitPanelProps) {
  return <UnitPanel title="거래건별 이관 선택" description="담당 거래건별 이관 대상 선택 단위입니다." {...props} />;
}

function SettingsAccessMatrix({ children, ...props }: UnitPanelProps) {
  return (
    <UnitPanel title="탭별 접근 권한" description="Operator는 LNB 설정 메뉴가 노출되지 않습니다." {...props}>
      {children ?? <SimpleDataTable />}
    </UnitPanel>
  );
}

function OperatorBlockedState(props: UnitPanelProps) {
  return <UnitPanel title="Operator 접근 차단" description="직접 URL 접근 또는 권한 만료 시" {...props} />;
}

function RoleChangeRules({ children, ...props }: UnitPanelProps) {
  return (
    <UnitPanel title="역할 변경 규칙" description="드롭다운 클릭 즉시 반영됩니다." {...props}>
      {children ?? <SimpleDataTable />}
    </UnitPanel>
  );
}

function MemberTable({ children, ...props }: UnitPanelProps) {
  return (
    <UnitPanel title="멤버 목록" description="워크스페이스 멤버 목록입니다." {...props}>
      {children ?? <SimpleDataTable />}
    </UnitPanel>
  );
}

function SettlementHeader(props: UnitPanelProps) {
  return <UnitPanel title="정산" description="거래처별 AP / AR 현황" {...props} />;
}

function SettlementFilterTabs(props: UnitPanelProps) {
  return <UnitPanel title="정산 필터" description="전체 / 보낼 금액 / 못받은 금액" {...props} />;
}

function SettlementKpiStrip({ items, ...props }: UnitPanelProps & { items?: MetricItem[] }) {
  return (
    <UnitPanel title="Settlement KPI strip" description="정산 KPI 카드 묶음입니다." {...props}>
      <MetricStrip items={items} />
    </UnitPanel>
  );
}

function SettlementCounterpartyTable({ children, ...props }: UnitPanelProps) {
  return (
    <UnitPanel title="거래처별 정산 표" description="AP/AR 금액과 가장 임박한 일정을 표시합니다." {...props}>
      {children ?? <SimpleDataTable />}
    </UnitPanel>
  );
}

function SettlementExpandedRow(props: UnitPanelProps) {
  return <UnitPanel title="거래처 행 펼치기" description="거래처 row 확장 상세입니다." {...props} />;
}

function SettlementDealList(props: UnitPanelProps) {
  return <UnitPanel title="거래처 하위 Deal 목록" description="거래처 하위 Deal 목록입니다." {...props} />;
}

function SettlementPayableFilter(props: UnitPanelProps) {
  return <UnitPanel title="보낼 금액 필터" description="type=payable AND status=pending" {...props} />;
}

function SettlementReceivableFilter(props: UnitPanelProps) {
  return <UnitPanel title="못받은 금액 필터" description="type=receivable AND status=overdue" {...props} />;
}

function SettlementRuleNote({ children, ...props }: UnitPanelProps) {
  return (
    <UnitPanel title="정산 기준" description="완료 처리는 Deal Detail 정산 탭에서 수행합니다." {...props}>
      {children ?? <StatusSummary title="정산 기준" description="행 클릭 → Deal Detail → 정산 탭에서 완료 처리합니다." />}
    </UnitPanel>
  );
}

export {
  AdminJoinScreen,
  BlockedCard,
  ConfirmTooltipTour,
  CopilotIntentPolicy,
  CopilotPhase1InlineSearch,
  CopilotPhase1Notice,
  CopilotPhase3DeferredScope,
  CopilotQueryComposer,
  CopilotResponsePreview,
  CopilotSupportedQueries,
  DealTransferPicker,
  FlagFeedCard,
  InviteMemberDialog,
  InviteStatePanel,
  KpiStrip,
  MemberShareInlinePanel,
  MemberJoinScreen,
  MemberTable,
  MonitorEmptyStates,
  MonitorHeader,
  MonitorOperationGrid,
  OnboardingChecklist,
  OnboardingChecklistCompleted,
  OnboardingPolicyPanel,
  OnboardingRoutePanel,
  OperatorBlockedState,
  OperatorJoinScreen,
  OwnerWelcomeModal,
  PendingActionCard,
  PendingInviteState,
  RemoveMemberDialog,
  RiskCard,
  RoleChangeRules,
  SettingsAccessMatrix,
  SettingsBillingPanel,
  SettingsMemberActionPanel,
  SettingsMemberPanel,
  SettingsModalHeader,
  SettingsModalShell,
  SettingsPermissionsPanel,
  SettingsTabNav,
  ShareWordingPanel,
  SettlementCounterpartyTable,
  SettlementDealList,
  SettlementExpandedRow,
  SettlementFilterTabs,
  SettlementHeader,
  SettlementKpiStrip,
  SettlementPayableFilter,
  SettlementReceivableFilter,
  SettlementRuleNote,
  StatusLine,
  SubscriptionPanel,
  ThroughputDrilldown,
  TokenUsagePanel,
};
export type { MetricItem, UnitPanelProps };

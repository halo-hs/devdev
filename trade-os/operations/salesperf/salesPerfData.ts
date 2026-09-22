// OS-C2 영업 성과 콕핏 — 순수 데이터 변형(KPI 유도·진행 딜 dedupe·통화 유도·
// 담당자 표시명 폴백). reportsData 와 동일 자세: 화면 컴포넌트와 분리해 단위
// 테스트 가능하게 유지하고, 교차 통화 합산 금지 불변식을 지킨다(모든 금액
// 계산은 단일 통화 축 안에서만).

import { deriveCurrencies } from "@trade-os/operations/reports/reportsData";
import { memberLabel, type OrgMember } from "@trade-os/operations/lib/api/members";
import {
  amountCell,
  ratioPermyriad,
  roundedPercentage,
  type AmountCell,
} from "@trade-os/operations/lib/financeDecimal";

import type {
  AssigneeGPItem,
  AssigneeGPResponse,
  CounterpartyStatusItem,
  GPSeriesResponse,
  SettlementSeriesResponse,
} from "@trade-os/operations/lib/api/reports";

/**
 * 콕핏 상단 "내 숫자" — settlement-series 의 as-of 최신 기간(창의 마지막 =
 * 진행 중인 이번 달) 한 행에서 유도한다. D10 상단 숫자의 축:
 *  - 수취 현황 = 이번 달 수취 예정(planned, 만기 기준) + AR 적용액(received) 짝 —
 *    B3 KPI 와 동일한 계획/실적 페어(단일 "매출" 필드가 없는 정직한 표현).
 *  - 미수 = 최신 기간의 기말 잔액(시계열 as-of — 진행 월은 미래 이벤트가
 *    없어 현재 잔액과 동치이고, 테이블 페이지네이션 절단에 영향받지 않는다).
 *  - 연체는 시계열이 아니라 counterparty-status 에서 온다(overdueFromStatus
 *    주석 참조 — 진행 월 시계열 행은 월말 투영치라 "오늘 기준"이 아니다).
 */
export type CockpitSeriesKpi = {
  periodStart: string;
  planned: AmountCell;
  received: AmountCell;
  /** AR 적용액 / 수취 예정 % (예정 0 이면 null). */
  receivedRatioPctTenths: bigint | null;
  outstandingEnd: AmountCell;
};

export function latestSeriesKpi(
  series: SettlementSeriesResponse | null,
  currency: string,
): CockpitSeriesKpi | null {
  const periods = series?.periods ?? [];
  const latest = periods.length > 0 ? periods[periods.length - 1] : null;
  if (!latest) return null;
  const row = (latest.by_currency ?? []).find((c) => c.currency === currency);
  const planned = amountCell(row?.receivable_due ?? "0");
  const received = amountCell(row?.received ?? "0");
  return {
    periodStart: latest.period_start,
    planned,
    received,
    receivedRatioPctTenths:
      planned.valid && received.valid
        ? roundedPercentage(received.scaled, planned.scaled)
        : null,
    outstandingEnd: amountCell(row?.receivable_outstanding_end ?? "0"),
  };
}

/**
 * 연체 KPI 합계 — 시계열의 진행 월 행은 월말 기준(cutoff = period_end 다음날)
 * 으로 재구성된 월말 투영치라 아직 만기 전인 스케줄도 연체로 센다(적대 리뷰:
 * 같은 화면의 테이블(오늘 기준)과 모순). KPI 의 연체는 counterparty-status
 * (as-of = org-today) 행에서 통화별로 합산한다. 정렬이 overdue DESC 우선이라
 * 200행 절단은 연체>0 행이 200개를 넘는 조직에서만 미달되고, 그 경우에도
 * 상위 연체는 전부 포함된다.
 */
export function overdueFromStatus(items: CounterpartyStatusItem[], currency: string): bigint | null {
  let sum = BigInt(0);
  for (const item of items) {
    if (item.currency !== currency) continue;
    const overdue = amountCell(item.overdue);
    if (!overdue.valid) return null;
    sum += overdue.scaled;
  }
  return sum;
}

/**
 * 진행 딜 합계 — counterparty-status 의 active_deals 는 거래처 레벨 값이라
 * 같은 거래처의 통화 행마다 반복된다(BE DTO 주석). 거래처명으로 dedupe 한 뒤
 * 첫 행의 값만 합산해야 이중 계산이 없다. 딜 수는 통화 무관 카운트라 이 합은
 * 교차 통화 합산 금지 불변식과 무관하다.
 */
export function activeDealsSummary(items: CounterpartyStatusItem[]): {
  deals: number;
  counterparties: number;
} {
  const seen = new Set<string>();
  let deals = 0;
  for (const item of items) {
    if (seen.has(item.counterparty)) continue;
    seen.add(item.counterparty);
    deals += item.active_deals;
  }
  return { deals, counterparties: seen.size };
}

/**
 * 통화 탭 유도 — B3 deriveCurrencies(series+gp 합집합, 수취 예정 내림차순)를
 * 그대로 쓰고, 상태 테이블에만 존재하는 통화를 0 가중치로 뒤에 덧붙인다
 * (시계열이 비어도 테이블 행이 있으면 탭이 서게).
 */
export function deriveCockpitCurrencies(
  series: SettlementSeriesResponse | null,
  gp: GPSeriesResponse | null,
  statusItems: CounterpartyStatusItem[],
): string[] {
  const currencies = deriveCurrencies(series, gp);
  const known = new Set(currencies);
  const extras: string[] = [];
  for (const item of statusItems) {
    if (known.has(item.currency)) continue;
    known.add(item.currency);
    extras.push(item.currency);
  }
  return [...currencies, ...extras.sort((a, b) => a.localeCompare(b))];
}

export type AssigneeGpRowView = {
  /** null = 미배정 딜 버킷 — 라벨은 카피(unassigned)로 치환. */
  assigneeUserId: string | null;
  gp: AmountCell;
  revenue: AmountCell;
  /** Exact ten-thousandths of the BE 0..1 ratio. */
  marginPermyriad: bigint | null;
  dealCount: number;
};

/**
 * 담당자별 GP — 선택 통화 행만 취한다(랭킹은 BE 가 통화 내 GP DESC 로 계산,
 * 서버 순서 유지·재정렬 금지). gp 는 음수(손실)일 수 있다.
 */
export function assigneeGpRows(
  response: AssigneeGPResponse | null,
  currency: string,
): AssigneeGpRowView[] {
  return (response?.items ?? [])
    .filter((item: AssigneeGPItem) => item.currency === currency)
    .map((item) => ({
      assigneeUserId: item.assignee_user_id,
      gp: amountCell(item.gp),
      revenue: amountCell(item.revenue),
      marginPermyriad: item.margin != null ? ratioPermyriad(item.margin) : null,
      dealCount: item.deal_count,
    }));
}

/**
 * 담당자 uuid → 표시명. null 은 미배정 버킷 카피, 멤버 목록에 있으면
 * memberLabel(이름 > 이메일 > 짧은 uuid), 목록에 없으면(탈퇴 등) uuid 축약 —
 * B3 closerLabel 과 동일한 폴백 사다리.
 */
export function assigneeLabel(
  userId: string | null | undefined,
  members: OrgMember[],
  unassignedLabel: string,
): string {
  if (!userId) return unassignedLabel;
  const member = members.find((m) => m.user_id === userId);
  return member ? memberLabel(member) : userId.slice(0, 8);
}

# 화면 문구 변경 전체 목록 — 2026-10-08

## 비교 기준

- 기존: `halo-hs/devdev@38f5d8a954c4e92fc118430fb27605148dcf4bd9`의 한국어 메시지. 거래의 하드코딩 문구는 이번 변경 직전 작업 트리(`4f76cde` 기반)와 비교했다.
- 변경 후: 현재 로컬 수정본. 기존 운영·성과 원문 정렬과 이번 거래·정산 후속 변경을 함께 기록한다. 커밋·배포 여부와 구분한다.
- 문구 원본: [제품 프론트엔드 `2bb22505`](https://github.com/hrm-corp/ecoya-platform-user-frontend/tree/2bb22505724820a33da7139b2fa0efc2a2dd63ca/src/messages/ko). 원본 코드는 변경하지 않았다.
- 변경·추가·삭제를 모두 기재하며, 추가 메시지 키가 있다고 해당 화면 상태나 기능이 모두 구현됐다는 뜻은 아니다. 실제 표시 연결을 수정한 사항은 별도로 적는다.
- 원본과 같은 `정산`, `운영 감시`, `결산 리포트`, `영업 성과`, `거래`, `AR/AP 원장`은 유지한다.

## 거래 화면의 실제 표시 변경

| 적용 파일·위치 | 변경 전 | 변경 후 | 원본 메시지 키 |
|---|---|---|---|
| `trade-os/deals/page.tsx` (1곳) | 거래번호 / 설명 · 거래처 | 거래번호 / 거래처 | `deals.list.columns.dealCounterparty` |
| `trade-os/deals/finance-table.tsx` (1곳) | 거래 / 거래처 | 거래번호 / 거래처 | `deals.list.columns.dealCounterparty` |
| `trade-os/deals/finance-table.tsx` (1곳) | 가산 원가 / 비용 반영 손익 | 가산 원가 · 비용 반영 손익 | `deals.list.financeTable.costAdjusted` |
| `trade-os/deals/finance-table.tsx` (1곳) | 거래 금융 | Deal 금융 | `deals.list.labels.finance.dealDetail` |
| `trade-os/deals/detail.tsx` (1곳) | AI 거래 요약 | 딜 요약 브리프 | `detail.view.brief.title` |
| `trade-os/deals/detail.tsx` (2곳) | 거래 건강도 | 딜 건강도 | `detail.view.dealHealth.title` |
| `trade-os/deals/detail.tsx` (2곳) | 서류 대조 · 5-Way | 서류 대조 (5-Way Match) | `detail.view.reconcile.title` |
| `trade-os/deals/detail.tsx` (1곳) | 연결 문서에서 추출한 값을 비교합니다. 근거가 없는 항목은 일치로 판단하지 않습니다. | PO·송장·포장명세·B/L의 같은 항목 값이 서로 일치하는지 한눈에 대조합니다. | `detail.view.reconcile.subtitle` |
| `trade-os/deals/finance-workspace.tsx` (2곳) | 거래 경제 | 거래 경제 (Deal Economics) | `detail.view.dealEconomics.title` |
| `trade-os/deals/finance-workspace.tsx` (1곳) | 매출측 송장 | 매출송장 금액 | `detail.view.dealEconomics.revenue` |
| `trade-os/deals/finance-workspace.tsx` (1곳) | 매입측 송장 | 매입송장 금액 | `detail.view.dealEconomics.goodsCost` |
| `trade-os/deals/finance-workspace.tsx` (2곳) | 송장 차익 | 송장 기준 매매차익 | `detail.view.dealEconomics.grossProfit` |
| `trade-os/deals/finance-workspace.tsx` (1곳) | 송장 금액에 원가를 반영한 예상손익입니다. | 이 Deal에 연결된 확정 Commercial Invoice + 등록 부대비용 + 지급 적용 내역 기준입니다. B/L은 선적 근거이며 금액 원천이 아닙니다. | `detail.view.dealEconomics.basisHint` |
| `trade-os/deals/finance-workspace.tsx` (1곳) | 확정 매출송장 − 확정 매입송장 − 가산 원가 = 비용 반영 예상손익 | 매출송장 금액 − 매입송장 금액 = 송장 기준 매매차익 · 매매차익 − 등록 부대비용 = 예상 거래손익 | `detail.view.dealEconomics.formulaHint` |
| `trade-os/deals/finance-workspace.tsx` (2곳) | 가산 원가 | 등록 부대비용 | `detail.view.dealEconomics.landedCost` |
| `trade-os/deals/finance-workspace.tsx` (2곳) | 비용 반영 예상손익 | 예상 거래손익 | `detail.view.dealEconomics.adjustedGp` |
| `trade-os/deals/finance-workspace.tsx` (1곳) | 운임·관세·보험 등 부대비용을 입력합니다. | 착륙원가(운임·관세·보험 등)를 입력해 마진 그림을 완성하세요. | `detail.view.costs.subtitle` |
| `trade-os/deals/finance-workspace.tsx` (1곳) | 확정 송장이 없어 손익을 계산할 수 없습니다. | 통화별 송장 금액과 예상 거래손익은 확정 상업송장이 연결되면 표시됩니다. | `detail.view.dealEconomics.empty` |
| `trade-os/deals/finance-workspace.tsx` (1곳) | 원가 | 원가 입력 | `detail.view.costs.title` |
| `trade-os/deals/finance-workspace.tsx` (1곳) | 원가 유형 | 항목 | `detail.view.costs.form.type` |
| `trade-os/deals/finance-workspace.tsx` (1곳) | 반영 기준 | 기준 | `detail.view.costs.form.basis` |
| `trade-os/deals/finance-workspace.tsx` (1곳) | 반영 기준 | 기준 | `detail.view.costs.form.basis` |
| `trade-os/deals/finance-workspace.tsx` (1곳) | 가격 포함 | 가격포함 | `detail.view.costs.bases.already_in_price` |
| `trade-os/deals/finance-workspace.tsx` (1곳) | 가격 포함 | 가격포함 | `detail.view.costs.bases.already_in_price` |
| `trade-os/deals/detail.tsx` (1곳) | 연락처 | 영업 담당자 | `detail.view.contacts.title` |
| `trade-os/deals/detail.tsx` (1곳) | 메모 | 노트 | `detail.view.notes.title` |

접근성용 `원가 유형`, `원가 반영 기준`은 조작 대상의 맥락을 제공하므로 유지한다. `통화별 원가·손익 계산표`, 복합 열 `유형 / 근거`, 선적 6열과 대조 셀별 상태도 기존 정보 구조를 유지한다.

## 정산 — 메시지 35개

[적용 메시지 파일](../trade-os/operations/messages/ko/erp-settlement.json)

| 구분 | 메시지 키 | 변경 전 | 변경 후 |
|---|---|---|---|
| 추가 | `settlement.exceptions.overpayments.allocate` | 미표시 / 키 없음 | 배정 기록 |
| 변경 | `settlement.exceptions.overpayments.allocated` | 배분액 | 배정액 |
| 추가 | `settlement.exceptions.overpayments.allocationAmount` | 미표시 / 키 없음 | 배정 금액 |
| 추가 | `settlement.exceptions.overpayments.allocationAmountScale` | 미표시 / 키 없음 | 배정 금액은 소수점 이하 4자리까지만 입력할 수 있습니다. |
| 추가 | `settlement.exceptions.overpayments.allocationBy` | 미표시 / 키 없음 | 처리자 |
| 추가 | `settlement.exceptions.overpayments.allocationEmpty` | 미표시 / 키 없음 | 배정 이력이 없습니다. |
| 추가 | `settlement.exceptions.overpayments.allocationErrors.idempotencyConflict` | 미표시 / 키 없음 | 같은 요청 키로 다른 내용이 이미 처리되었습니다. 예외 화면을 새로 고친 뒤 다시 시도하세요. |
| 추가 | `settlement.exceptions.overpayments.allocationErrors.notFound` | 미표시 / 키 없음 | 초과액 또는 대상 일정을 찾을 수 없습니다. 목록을 새로 고친 뒤 다시 시도하세요. |
| 추가 | `settlement.exceptions.overpayments.allocationErrors.targetMismatch` | 미표시 / 키 없음 | 대상 일정이 이 초과액과 맞지 않습니다. 같은 거래처·같은 통화이면서 이 초과액이 나온 일정이 아닌 다른 일정을 선택하세요. |
| 추가 | `settlement.exceptions.overpayments.allocationErrors.validation` | 미표시 / 키 없음 | 입력값과 남은 초과액을 확인하세요. 배정액과 환불액의 합은 초과 금액을 넘을 수 없습니다. |
| 추가 | `settlement.exceptions.overpayments.allocationEvidence` | 미표시 / 키 없음 | 근거 |
| 추가 | `settlement.exceptions.overpayments.allocationHint` | 미표시 / 키 없음 | 남은 초과액의 일부를 같은 거래처·같은 통화의 다른 일정에 배정한 기록을 남깁니다. 대상 일정의 금액은 바뀌지 않으며, 근거는 선택 입력입니다. |
| 추가 | `settlement.exceptions.overpayments.allocationReason` | 미표시 / 키 없음 | 사유 |
| 추가 | `settlement.exceptions.overpayments.allocationReplayed` | 미표시 / 키 없음 | 같은 요청이 이미 반영되어 있어 다시 기록하지 않았습니다. |
| 추가 | `settlement.exceptions.overpayments.allocationSchedule` | 미표시 / 키 없음 | 대상 일정 ID |
| 추가 | `settlement.exceptions.overpayments.allocationSuggestions` | 미표시 / 키 없음 | 후보 일정 |
| 추가 | `settlement.exceptions.overpayments.allocationSuggestionsEmpty` | 미표시 / 키 없음 | 후보로 좁혀진 일정이 없습니다. 대상 일정 ID를 직접 입력하세요. |
| 추가 | `settlement.exceptions.overpayments.allocationSuggestionsHint` | 미표시 / 키 없음 | 서버가 저장 시와 동일한 적격성 규칙으로 제공한 후보 목록입니다. |
| 추가 | `settlement.exceptions.overpayments.allocationTarget` | 미표시 / 키 없음 | 대상 일정 |
| 추가 | `settlement.exceptions.overpayments.allocationTitle` | 미표시 / 키 없음 | 배정 이력 |
| 추가 | `settlement.exceptions.overpayments.refundPendingHint` | 미표시 / 키 없음 | 제출한 환불 결과를 확인 중입니다. 재시도하면 원래 내용으로 결과를 확인합니다. 확인될 때까지 내용을 수정할 수 없습니다. 오류가 계속되면 담당자에게 문의하세요. |
| 추가 | `settlement.exceptions.refundRecoveryUnavailable` | 미표시 / 키 없음 | 환불 기록을 잠시 중단했습니다. 이 브라우저에서 미확정 요청을 안전하게 확인하거나 보존할 수 없습니다. 같은 환불을 다시 입력하지 말고 담당자에게 환불 이력 확인을 요청하세요. |
| 추가 | `settlement.financeFacts.scopeAssignedOrShared` | 미표시 / 키 없음 | 내 담당·공유 거래 기준: 아래 거래손익과 집계는 내가 담당하거나 공유받은 거래만 포함합니다. |
| 추가 | `settlement.ledger.canonicalCash.partyUnmatched` | 미표시 / 키 없음 | 이 일정의 거래처가 거래처 마스터에 등록되어 있지 않아 입출금을 기록할 수 없습니다. 설정 › 거래처 별칭 학습에서 거래처를 먼저 등록한 뒤 다시 시도해 주세요. |
| 추가 | `settlement.ledger.canonicalCash.rejected` | 미표시 / 키 없음 | 요청이 거절되어 기록하지 못했습니다. 입력값을 확인한 뒤 다시 시도해 주세요. |
| 추가 | `settlement.ledger.canonicalCash.signedOut` | 미표시 / 키 없음 | 로그인 상태가 유효하지 않아 입출금을 기록하지 못했습니다. 다시 로그인한 뒤 같은 내용으로 다시 기록해 주세요. |
| 추가 | `settlement.ledger.canonicalCash.signedOutRead` | 미표시 / 키 없음 | 로그인 상태가 유효하지 않아 이력을 불러오지 못했습니다. 다시 로그인해 주세요. |
| 추가 | `settlement.ledger.closeTypeUnknown` | 미표시 / 키 없음 | 기타 |
| 추가 | `settlement.ledger.closeTypes.written_off` | 미표시 / 키 없음 | 상각 확정 |
| 변경 | `settlement.ledger.uncompleteConfirmBody` | {counterparty} · {amount} 일정이 다시 예정 상태로 돌아갑니다. 이 일정으로 완료 처리된 거래가 있다면 함께 되돌아갑니다. | {counterparty} · {amount} 일정이 다시 예정 상태가 됩니다. 기한이 지났으면 연체로 표시됩니다. 기록한 입출금은 그대로이고, 실제 송금이나 환불을 취소하지 않습니다. 이 일정으로 정산 완료된 거래는 정산 상태를 다시 계산합니다. |
| 변경 | `settlement.ledger.uncompleteConfirmTitle` | 송금 완료를 취소할까요? | 이 일정의 완료를 취소할까요? |
| 변경 | `settlement.ledger.uncompleted` | 송금 완료를 취소했습니다. 일정이 다시 예정 상태가 됩니다. | 완료를 취소했습니다. 기록한 입출금은 그대로입니다. |
| 추가 | `settlement.ledger.uncompletedOverdue` | 미표시 / 키 없음 | 완료를 취소했습니다. 일정이 예정 상태로 돌아갔고, 기한이 지나 연체로 표시됩니다. 기록한 입출금은 그대로입니다. |
| 추가 | `settlement.ledger.uncompletedPending` | 미표시 / 키 없음 | 완료를 취소했습니다. 일정이 예정 상태로 돌아갔습니다. 기록한 입출금은 그대로입니다. |
| 추가 | `signOutPendingRefundsWarning` | 미표시 / 키 없음 | 미확정 환불 {count}건이 이 탭에 남아 있습니다. 같은 계정으로 다시 로그인하면 결과를 확인할 수 있습니다. 공용 PC라면 탭을 닫으세요. |

## 운영 감시 — 메시지 47개

[적용 메시지 파일](../trade-os/operations/messages/ko/erp-monitor.json)

| 구분 | 메시지 키 | 변경 전 | 변경 후 |
|---|---|---|---|
| 추가 | `monitor.exceptionCenterLoadError` | 미표시 / 키 없음 | 예외 센터를 불러오지 못했습니다. |
| 추가 | `monitor.gate.billingBody` | 미표시 / 키 없음 | 결제 상태가 해결될 때까지 운영 감시를 사용할 수 없습니다. 설정 → 결제에서 상태를 확인하세요. |
| 추가 | `monitor.gate.billingTitle` | 미표시 / 키 없음 | 결제 상태를 확인해 주세요 |
| 추가 | `monitor.gate.roleBody` | 미표시 / 키 없음 | 현재 역할로는 이 워크스페이스의 운영 감시를 볼 수 없습니다. |
| 추가 | `monitor.gate.roleTitle` | 미표시 / 키 없음 | 운영 감시 접근 권한이 없습니다 |
| 추가 | `monitor.gate.subscriptionBody` | 미표시 / 키 없음 | 현재 활성 구독이 없습니다. 설정 → 결제에서 구독 상태를 확인하세요. |
| 추가 | `monitor.gate.subscriptionTitle` | 미표시 / 키 없음 | 운영 감시를 사용하려면 구독이 필요합니다 |
| 추가 | `monitor.gate.upgradeBody` | 미표시 / 키 없음 | 팀 처리량·막힌 작업·리스크·플래그 감시는 Pro 플랜 기능입니다. 설정 → 결제에서 플랜을 업그레이드하세요. |
| 추가 | `monitor.gate.upgradeTitle` | 미표시 / 키 없음 | 운영 감시는 Pro 플랜에서 제공됩니다 |
| 삭제 | `monitor.live.clockSkew` | 기기 시계를 확인하세요 | 미표시 / 키 없음 |
| 추가 | `monitor.live.flagCreatedAt` | 미표시 / 키 없음 | {date} ({timezone}) |
| 추가 | `monitor.live.p0TitleAgeUnknown` | 미표시 / 키 없음 | {docType} · {hours} 미처리 |
| 추가 | `monitor.live.p0TitleNoDocType` | 미표시 / 키 없음 | {hours}h 미처리 |
| 추가 | `monitor.live.p0TitleNoDocTypeAgeUnknown` | 미표시 / 키 없음 | {hours} 미처리 |
| 변경 | `monitor.live.priceTitle` | 단가 편차 | 단가 차이 |
| 추가 | `monitor.view.actionsLabel` | 미표시 / 키 없음 | 운영 감시 바로가기 |
| 추가 | `monitor.view.actionsUnavailable` | 미표시 / 키 없음 | 아직 제공되지 않는 기능입니다 |
| 추가 | `monitor.view.areas.blockedP0` | 미표시 / 키 없음 | 막힌 작업 (P0) |
| 추가 | `monitor.view.areas.blockedP1` | 미표시 / 키 없음 | 막힌 작업 (P1) |
| 추가 | `monitor.view.areas.kpi` | 미표시 / 키 없음 | KPI |
| 추가 | `monitor.view.areas.pending` | 미표시 / 키 없음 | 대기 액션 |
| 추가 | `monitor.view.areas.risks` | 미표시 / 키 없음 | 리스크 |
| 추가 | `monitor.view.areas.status` | 미표시 / 키 없음 | 긴급 상태 |
| 추가 | `monitor.view.areas.throughput` | 미표시 / 키 없음 | 완료율 드릴다운 |
| 추가 | `monitor.view.blockedAsOf` | 미표시 / 키 없음 | {priority} · {asOf} |
| 추가 | `monitor.view.conditionsLabel` | 미표시 / 키 없음 | 조회 조건 |
| 추가 | `monitor.view.opsRiskFallback` | 미표시 / 키 없음 | 리스크 |
| 추가 | `monitor.view.pagination.navigation` | 미표시 / 키 없음 | {table} 페이지 |
| 추가 | `monitor.view.pagination.next` | 미표시 / 키 없음 | 다음 페이지 |
| 추가 | `monitor.view.pagination.page` | 미표시 / 키 없음 | {page}페이지 |
| 추가 | `monitor.view.pagination.pageSize` | 미표시 / 키 없음 | 페이지당 |
| 추가 | `monitor.view.pagination.pageSizeOption` | 미표시 / 키 없음 | {size}개 |
| 추가 | `monitor.view.pagination.previous` | 미표시 / 키 없음 | 이전 페이지 |
| 추가 | `monitor.view.pagination.total` | 미표시 / 키 없음 | 전체 {count}건 |
| 추가 | `monitor.view.partialItem` | 미표시 / 키 없음 | {area} — {reason} |
| 추가 | `monitor.view.partialLastKnown` | 미표시 / 키 없음 | 마지막 정상값 표시 중 |
| 추가 | `monitor.view.partialReasons.failed` | 미표시 / 키 없음 | 조회 실패 |
| 추가 | `monitor.view.partialReasons.settlement` | 미표시 / 키 없음 | 연체 받을 돈 집계 조회 실패 |
| 추가 | `monitor.view.queueListLabel` | 미표시 / 키 없음 | {title} 목록 |
| 추가 | `monitor.view.status.green` | 미표시 / 키 없음 | 정상 운영 중 |
| 추가 | `monitor.view.status.red` | 미표시 / 키 없음 | 긴급 조치 필요 — P0 미처리 {count}건 |
| 추가 | `monitor.view.status.yellow` | 미표시 / 키 없음 | 확인 필요 — 리스크 {risks}건 · 미확인 플래그 {flags}건 |
| 추가 | `monitor.view.throughputConfirms` | 미표시 / 키 없음 | 확정 |
| 추가 | `monitor.view.throughputDayConfirmed` | 미표시 / 키 없음 | 확정 {count} |
| 추가 | `monitor.view.throughputDayUploaded` | 미표시 / 키 없음 | 업로드 {count} |
| 추가 | `monitor.view.throughputDaysLabel` | 미표시 / 키 없음 | 날짜별 업로드·확정 |
| 추가 | `monitor.view.throughputOwnersTitle` | 미표시 / 키 없음 | 담당자별 처리 |

## 결산 리포트 — 메시지 17개

[적용 메시지 파일](../trade-os/operations/messages/ko/erp-reports.json)

| 구분 | 메시지 키 | 변경 전 | 변경 후 |
|---|---|---|---|
| 변경 | `reports.charts.gp.sub` | 최초 받을 일정 − 최초 줄 일정 − 가산 부대비용 · 동일 통화 딜 기준 · {currency} | 최초 받을 일정 − 최초 줄 일정 − 가산 부대비용 · 동일 통화 딜 기준 · {currency} · 딜 전체는 마지막 수취 예정일이 속한 달에 집계 |
| 추가 | `reports.closes.counterSuffix` | 미표시 / 키 없음 | 자 |
| 추가 | `reports.closes.errorReauthRequired` | 미표시 / 키 없음 | 월마감에는 최근 재인증이 필요합니다. 다시 로그인한 후 재시도하세요. |
| 추가 | `reports.closes.errorValidation` | 미표시 / 키 없음 | 마감 요청을 처리할 수 없습니다. 메모를 확인하고 화면을 새로고침한 뒤 다시 시도하세요. |
| 추가 | `reports.closes.snapshot.counterpartyRestricted` | 미표시 / 키 없음 | 거래처별 내역과 원천 기록(일정·조정·상각)은 오너·관리자만 볼 수 있습니다. |
| 추가 | `reports.controls.filtersLabel` | 미표시 / 키 없음 | 결산 리포트 필터 |
| 변경 | `reports.kpi.gpZeroCost` | 부대비용 미입력 {count}건 — GP 과대 가능 | 가산 부대비용 0원 {count}건 — GP 과대 가능 |
| 변경 | `reports.kpi.gpZeroCostUnknown` | 부대비용 입력 여부 확인 불가 — GP 과대 가능 | 가산 부대비용 확인 불가 — GP 과대 가능 |
| 추가 | `reports.pagination.navigation` | 미표시 / 키 없음 | 페이지 이동 |
| 추가 | `reports.pagination.next` | 미표시 / 키 없음 | 다음 페이지 |
| 추가 | `reports.pagination.page` | 미표시 / 키 없음 | {page}페이지 |
| 추가 | `reports.pagination.pageSize` | 미표시 / 키 없음 | 페이지당 |
| 추가 | `reports.pagination.pageSizeOption` | 미표시 / 키 없음 | {size}개 |
| 추가 | `reports.pagination.previous` | 미표시 / 키 없음 | 이전 페이지 |
| 추가 | `reports.pagination.total` | 미표시 / 키 없음 | 전체 {count}건 |
| 변경 | `reports.topn.gpUnavailable` | GP 산정 불가 (매입측 미기록) | 현재 조회에서 GP 확인 불가 |
| 추가 | `reports.topn.subNoCurrency` | 미표시 / 키 없음 | 최근 {months}개월 수취 예정 |

## 영업 성과 — 메시지 26개

[적용 메시지 파일](../trade-os/operations/messages/ko/erp-sales-performance.json)

| 구분 | 메시지 키 | 변경 전 | 변경 후 |
|---|---|---|---|
| 추가 | `cockpit.controls.filtersLabel` | 미표시 / 키 없음 | 영업 성과 필터 |
| 추가 | `cockpit.emptyBodyMember` | 미표시 / 키 없음 | 거래와 정산 일정이 쌓이면 회사 전체 집계가 여기에 표시됩니다. |
| 변경 | `cockpit.gpTrend.aria` | 월별 송장 기준 거래손익 막대 차트 | 월별 예정 거래손익 막대 차트 |
| 변경 | `cockpit.gpTrend.sub` | 매출송장 − 매입송장 − 부대비용 · 동일 통화 딜 기준 · {currency} | 최초 받을 돈 일정 − 최초 줄 돈 일정 − 가산 부대비용 · 동일 통화 딜 기준 · {currency} · 딜 전체는 마지막 수취 예정일이 속한 달에 집계 |
| 변경 | `cockpit.gpTrend.title` | 월별 송장 기준 거래손익 추세 | 월별 예정 거래손익 추세 |
| 변경 | `cockpit.kpi.gp` | {period} 송장 기준 거래손익 · GP ({currency}) | {period} 예정 거래손익 ({currency}) |
| 변경 | `cockpit.kpi.gpZeroCost` | 부대비용 미입력 {count}건 — GP 과대 가능 | 가산 부대비용 0원 {count}건 — GP 과대 가능 |
| 변경 | `cockpit.kpi.gpZeroCostUnknown` | 부대비용 입력 여부 확인 불가 — GP 과대 가능 | 가산 부대비용 확인 불가 — GP 과대 가능 |
| 추가 | `cockpit.kpi.outstandingBasis` | 미표시 / 키 없음 | 미수 잔액 {amount} |
| 추가 | `cockpit.kpi.overdueItems` | 미표시 / 키 없음 | 기한 초과 |
| 추가 | `cockpit.kpi.payableDue` | 미표시 / 키 없음 | {period} 지급 예정 ({currency}) |
| 추가 | `cockpit.kpi.payableSub` | 미표시 / 키 없음 | 지급 적용 {paid} |
| 추가 | `cockpit.kpi.pendingNote` | 미표시 / 키 없음 | 회사 전체 집계를 준비하고 있습니다 |
| 추가 | `cockpit.kpi.pendingValue` | 미표시 / 키 없음 | 준비 중 |
| 추가 | `cockpit.memberTrend.aria` | 미표시 / 키 없음 | 월별 수취 예정 대비 수금 적용 막대 차트 |
| 추가 | `cockpit.memberTrend.planned` | 미표시 / 키 없음 | 수취 예정 |
| 추가 | `cockpit.memberTrend.received` | 미표시 / 키 없음 | 수금 적용 |
| 추가 | `cockpit.memberTrend.sub` | 미표시 / 키 없음 | 회사 전체 집계 · 월별 · {currency} |
| 추가 | `cockpit.memberTrend.title` | 미표시 / 키 없음 | 월별 수취 예정·수금 적용 |
| 삭제 | `cockpit.refreshErrorTitle` | 선택한 조건으로 새로고침하지 못했습니다 | 미표시 / 키 없음 |
| 추가 | `cockpit.subtitleMember` | 미표시 / 키 없음 | 회사 전체의 수취 예정·지급 예정·수금 적용·미수 잔액을 집계로 봅니다. |
| 변경 | `cockpit.subtitleOrg` | 조직 전체의 수취 예정·송장 기준 거래손익·미수·진행 딜을 보고, 담당자별로 좁혀 봅니다. | 조직 전체의 수취 예정·예정 거래손익·미수·진행 딜을 보고, 담당자별로 좁혀 봅니다. |
| 삭제 | `cockpit.subtitleSelf` | 내 수취 예정·송장 기준 거래손익·미수·진행 딜과 내 거래처 상태를 한 화면에서 봅니다. | 미표시 / 키 없음 |
| 추가 | `cockpit.table.memberRestricted` | 미표시 / 키 없음 | 거래처별 상태와 성과는 Owner 또는 관리자만 볼 수 있습니다. 위 숫자는 회사 전체 집계입니다. |
| 삭제 | `cockpit.table.subSelf` | 내 거래처 · 주의가 필요한 순서 | 미표시 / 키 없음 |
| 변경 | `meta.description` | ECOYA ERP 영업 성과 — 내 수취 예정·송장 기준 거래손익·미수·진행 딜과 거래처 상태. | ECOYA ERP 영업 성과 — 내 수취 예정·예정 거래손익·미수·진행 딜과 거래처 상태. |

## 거래·운영 예외 공용 메시지 — 메시지 8개

[적용 메시지 파일](../trade-os/operations/messages/ko/erp-deals.json)

| 구분 | 메시지 키 | 변경 전 | 변경 후 |
|---|---|---|---|
| 추가 | `deals.list.columns.dealCounterparty` | 미표시 / 키 없음 | 거래번호 / 거래처 |
| 추가 | `deals.list.financeTable.costAdjusted` | 미표시 / 키 없음 | 가산 원가 · 비용 반영 손익 |
| 추가 | `detail.view.risk.detailDaysEarly` | 미표시 / 키 없음 | {days}일 빠름 |
| 추가 | `detail.view.risk.detailDaysLate` | 미표시 / 키 없음 | {days}일 지연 |
| 추가 | `exceptionCenter.severityFallback` | 미표시 / 키 없음 | 리스크 |
| 추가 | `exceptionCenter.unknownRisk` | 미표시 / 키 없음 | 기타 확인 항목 |
| 추가 | `exceptionCenter.unknownRiskNumbered` | 미표시 / 키 없음 | 기타 확인 항목 {n} |
| 추가 | `exceptionCenter.unlistedRisk` | 미표시 / 키 없음 | 지난 확인 항목 |

## 표시 연결 변경

| 위치 | 변경 전 | 변경 후 |
|---|---|---|
| 정산 완료 취소 결과 | 응답을 버리고 단일 안내 표시 | 서버 `pending` → 예정 복귀 안내, `overdue` → 연체 안내, 누락·미등록 → 일반 안내 |
| 원장 종료 사유 | `closure_type`의 밑줄을 공백으로 바꾼 영문 코드 | 원본 `closeTypes` 한글값 사용; `written_off` → `상각 확정`, 미등록 → `기타` |
| 정산 손익 집계 범위 | 서버 scope가 있어도 안내 없음 | 서버 `assigned_or_shared`일 때만 담당·공유 거래 안내, 페이징 후에도 scope 보존 |
| 영업 성과 설명 (앞선 수정 포함) | 공통 설명 | Owner/Admin과 Member의 원본 설명 분기 |
| 운영 예외명·상세 (앞선 수정 포함) | 미등록 코드·서버 상세를 직접 표시 | `기타 확인 항목`, 미등록 심각도 `리스크`; `+3d` → `3일 지연`, `-2d` → `2일 빠름`, `+10` → `차이 +10`, `-2.5` → `차이 -2.5`, 해석 불가 → `—` |
| 운영 화면 상단 (앞선 수정 포함) | 예시 데이터 · 변경 사항은 이 브라우저에만 반영됩니다. | 화면 상단 안내 삭제. 예시 모드 자체와 실제 저장 차단은 유지 |

## SSOT 반영

`ecoya-products/ecoya 2.0/`의 Trade OS SC-14·15·21, FS-14·17에 현행 명칭·설명·표시 조건을 반영했다. 날짜별 결정 원장의 `TRADE:OD-047` 후속 기록과 가장 가까운 화면·흐름 README를 연결했다. 원본 메시지와 값·권한 의미가 같은 항목만 맞추며 표 구조·산식·API 계약을 새로 정의하지 않는다.

## 검증

- 원본 메시지: 정산·운영 감시·영업 성과 전체 일치. 결산 리포트는 원본 189개 키·값 일치. 별도 작업에서 추가된 재마감 3개 키는 아래에 분리한다.
- UI 빌드 통과. 기존 번들 크기 및 Lottie eval 경고는 남아 있다.
- 거래 상세 구조 검사 11개와 원가 계산·편집·목록 이동·필터 검사 5개 통과. 공개 예시 모드 검사 2개 통과.
- 정산 조건 검사 8개 통과: scope 4종(담당·공유, 조직, 미등록, 누락), 완료 취소 반환 상태 4종(예정, 연체, 미등록, 누락). 원장 상각·미등록 종료 사유도 함께 확인했다. 브라우저 예시 응답만 교체했으며 실제 정산 쓰기는 실행하지 않았다.
- 거래 목록·정산 단계 상세·정산·운영 감시·결산 리포트·영업 성과의 1440/390px 12개 화면에서 본문 가로 넘침이 없고 주요 문구가 표시됨을 확인했다.
- SSOT 수정 파일의 상대 문서 링크 795개가 유효하며 새 결정 앵커와 현행 문구 표 링크를 확인했다. 개인 절대 경로·로컬 주소 패턴은 없다. 전체 결정 원장 검증 완료를 뜻하지 않는다.
- 같은 기존 검사 파일의 문서 만들기·선적 제목 검사 2개는 현재 화면과 맞지 않는 선택자로 실패했다. 이번 변경 대상이 아닌 두 화면의 소스와 검사는 수정하지 않았으며 전체 테스트 통과로 보고하지 않는다.


## 별도 병행 작업에서 추가된 결산 문구

최종 점검 중 다른 로컬 작업에서 다음 키가 추가됐다. 이번 명칭 정렬에서 작성·삭제하지 않았고 비교 기준 원본에는 없어 원본 일치 집계에 포함하지 않는다. 해당 기능의 SSOT 반영 판단도 이번 문구 정렬로 대신하지 않는다.

| 키 | 변경 전 | 현재 로컬 값 |
|---|---|---|
| `reports.closes.recloseButton` | 키 없음 | 재마감 |
| `reports.closes.recloseDialogTitle` | 키 없음 | {period} 재마감하기 |
| `reports.closes.recloseConfirm` | 키 없음 | 재마감하기 |

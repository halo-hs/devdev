# 프론트 원본과 로컬 UI의 명칭·설명·표 대조

이 문서는 변경 전 대조 기록이다. 이후 반영은 [문구 변경 전체 목록](./ui-copy-changes-2026-10-08.md)을 따른다.

2026-10-08 확인. 배포본과 로컬의 차이가 아니라 **프론트 원본과 현재 로컬 작업 트리**를 직접 대조했다. 거래 목록·상세도 포함한다.

## 비교 기준과 범위

- 프론트 원본: `hrm-corp/ecoya-platform-user-frontend`의 최신 `develop`, `e98954f608beb92e326993b0f31bd2e7a8f4d4f5` (커밋 시각 2026-10-08 10:15:54 KST).
- 로컬: `erp-doc-ui-shadcn`의 현재 미커밋 수정본. 이전 대조 기준 `7fc81ac8`과 최신 원본을 혼동하지 않는다.
- 원본의 한국어 메시지 파일뿐 아니라 실제 ProtectedPage/View/표 컴포넌트의 메시지 연결을 읽었다. 원본 저장소는 수정하지 않았다.
- 로컬은 Chrome 1440px에서 운영 화면, 거래 운영·금융 목록, 선적 단계 거래 상세, 정산 단계 거래 상세의 실제 제목과 표 열을 확인했다. 정산의 조건부 완료 취소·권한 안내는 소스 분기 대조다.
- 실제 원본 서버를 같은 사용자·데이터로 실행한 기능 parity 검사는 아니다. 아래의 “일치”는 명시한 문구·표 연결 범위에 한한다.

## 운영·성과 화면

| 화면 | 최신 원본 메시지 수 | 로컬 메시지 수 | 결과 |
|---|---:|---:|---|
| 정산 | 487 | 482 | 기존 값 3개 변경, 원본에만 있는 키 5개 |
| 운영 감시 | 134 | 134 | 키·문장·기호·치환 변수 일치 |
| 결산 리포트 | 189 | 189 | 키·문장·기호·치환 변수 일치 |
| 영업 성과 | 103 | 103 | 키·문장·기호·치환 변수 일치 |

운영 감시의 화면 설명·완료율 표, 결산의 차트 제목·설명과 마감 스냅샷 표, 영업 성과의 Owner/Admin·Member 설명 분기와 거래처 표의 메시지 연결을 함께 확인했다. 메시지 파일 일치를 전체 기능·모든 오류 상태의 일치로 확대하지 않는다.

### 정산: 이름이 같은 항목

`AR/AP 원장`은 최신 프론트 원본과 로컬 모두 같은 이름이다. 원본의 `SettlementLedgerPanel`도 `copy.ledger.title`을 그대로 사용한다. 다른 제목으로 덮어쓰는 분기는 없다.

원장 열도 `거래처 / 일정 종류 / 금액 / AR/AP 적용액 / 잔액 / 만기 / 문서번호 / Deal / 상태 / 분쟁 / 처리`로 같다.

- [원본 원장 연결](https://github.com/hrm-corp/ecoya-platform-user-frontend/blob/e98954f608beb92e326993b0f31bd2e7a8f4d4f5/src/features/erp/settlement/views/SettlementLedgerPanel.tsx)
- [로컬 정산 메시지](../trade-os/operations/messages/ko/erp-settlement.json)

### 정산: 최신 원본과 다른 설명·상태

| 항목 | 최신 프론트 원본 | 로컬 |
|---|---|---|
| 완료 취소 제목 | `이 일정의 완료를 취소할까요?` | `송금 완료를 취소할까요?` |
| 완료 취소 설명 | 기한 경과 시 연체 표시, 기록한 입출금 유지, 실제 송금·환불은 취소하지 않음, 거래 정산 상태 재계산을 명시 | 예정 상태 복귀와 연결 거래 되돌림만 설명 |
| 일반 완료 취소 결과 | `완료를 취소했습니다. 기록한 입출금은 그대로입니다.` | `송금 완료를 취소했습니다. 일정이 다시 예정 상태가 됩니다.` |
| 예정 상태 복귀 결과 | `uncompletedPending`으로 구분 | 메시지·분기 없음 |
| 연체 상태 복귀 결과 | `uncompletedOverdue`로 구분 | 메시지·분기 없음 |
| 종료 사유 | `written_off: 상각 확정` | 메시지 키 없음 |
| 알 수 없는 종료 사유 | `closeTypeUnknown: 기타` | 메시지 키 없음 |
| 담당·공유 거래 조회 범위 | `내 담당·공유 거래 기준: 아래 거래손익과 집계는 내가 담당하거나 공유받은 거래만 포함합니다.` | 메시지·안내 연결 없음 |

원본 `useSettlementCommands`는 복귀 상태별 안내를 선택하고, `SettlementView`는 서버의 담당·공유 범위일 때만 안내한다. 로컬은 `SettlementConnected`에서 단일 `uncompleted` 메시지를 사용한다. 따라서 JSON만 교체하면 이 차이가 모두 해소되는 것은 아니다.

- [원본 정산 문구](https://github.com/hrm-corp/ecoya-platform-user-frontend/blob/e98954f608beb92e326993b0f31bd2e7a8f4d4f5/src/messages/ko/erp-settlement.json)
- [원본 완료 취소 연결](https://github.com/hrm-corp/ecoya-platform-user-frontend/blob/e98954f608beb92e326993b0f31bd2e7a8f4d4f5/src/features/erp/settlement/useSettlementCommands.ts)
- [로컬 정산 구현](../trade-os/operations/settlement/SettlementConnected.tsx)

## 거래 목록: 실제 표시 열 비교

페이지 제목 `거래`와 설명 `확인된 문서를 거래 단위로 모아 다음 작업과 위험을 관리합니다.`는 같다.

| 표·위치 | 최신 프론트 원본 | 로컬 |
|---|---|---|
| 운영 표 첫 열 | `거래번호 / 거래처` | `거래번호 / 설명 · 거래처` |
| 금융 표 첫 열 | `거래번호 / 거래처` | `거래 / 거래처` |
| 금융 표 원가·손익 열 | `가산 원가 · 비용 반영 손익` | `가산 원가 / 비용 반영 손익` |

운영 표의 나머지 7개 헤더(접근성용 거래 메뉴 포함)는 같다. 금융 표의 나머지 7개 열은 `통화 / 확정 매출송장 / 확정 매입송장 / 송장 기준 Trade Result / 적용 입출금 / 현재 잔액 / 상세`로 같다. 원가·손익 헤더의 가운데점과 슬래시 차이는 표현 차이이며 그것만으로 계산 오류라고 판단하지 않는다.

- [원본 두 표](https://github.com/hrm-corp/ecoya-platform-user-frontend/blob/e98954f608beb92e326993b0f31bd2e7a8f4d4f5/src/features/erp/deals/DealsListTables.tsx)
- [로컬 운영 목록](../trade-os/deals/page.tsx), [로컬 금융 표](../trade-os/deals/finance-table.tsx)

## 거래 상세: 명칭·설명 차이

| 해당 정보 | 최신 프론트 원본 | 로컬 실제 표시 |
|---|---|---|
| 요약 카드 | `딜 요약 브리프` | `AI 거래 요약` |
| 경제 정보 카드 | `거래 경제 (Deal Economics)` | `거래 경제` |
| 매출 값 | `매출송장 금액` | `매출측 송장` |
| 매입 값 | `매입송장 금액` | `매입측 송장` |
| 송장 차익 | `송장 기준 매매차익` | `송장 차익` |
| 추가 비용 | `등록 부대비용` | `가산 원가` |
| 비용 반영 손익 | `예상 거래손익` | `비용 반영 예상손익` |
| 비용 입력 영역 | `원가 입력` | `원가` |
| 건강도 | `딜 건강도` | `거래 건강도` |
| 서류 비교 | `서류 대조 (5-Way Match)` | `서류 대조 · 5-Way` |

설명문도 같다며 처리할 수 없다.

- 원본 경제 정보는 확정 Commercial Invoice·등록 부대비용·지급 적용 내역을 근거로 명시하고, **B/L은 금액 원천이 아님**을 설명한다. 로컬은 `송장 금액에 원가를 반영한 예상손익입니다.`로 줄였고, 원가 반영 산식 일부는 도움말 안에 있다.
- 원본 비용 입력은 `착륙원가(운임·관세·보험 등)를 입력해 마진 그림을 완성하세요.`다. 로컬은 `운임·관세·보험 등 부대비용을 입력합니다.`다.
- 원본 서류 대조는 PO·송장·포장명세·B/L의 동일 항목 비교를 설명한다. 로컬 대화상자는 연결 문서의 추출값 비교와 근거 없는 항목의 일치 판정 금지를 설명한다.

이는 확인된 차이 목록이다. 기존에 승인된 로컬 디자인 변경을 모두 되돌려야 한다는 판정은 아니다. 명칭 정렬과 정보·표 구조 변경을 구분해서 반영해야 한다.

## 거래 상세: 표 구조 차이

| 표 | 최신 프론트 원본 | 로컬 |
|---|---|---|
| 서류 대조 | `항목 / 문서 코드별 값 / 상태`; 마지막에 행 전체 상태 열이 있음 | `항목 / 문서 종류·코드별 값`; 각 셀에 상태를 표시하며 별도 행 상태 열은 없음 |
| 선적 | `B/L / 선사 / 구간 / 출항(ETD) / 도착(ETA) / 상태 / 작업(무제목)` | `B/L · 컨테이너 / 항로 · 선박 / ETD / ETA(하나의 열) / 서류·근거 / 상태 / 작업` |
| 원가 내역 | 항목·금액·기준·근거·메모를 목록으로 표시하고 `원가 합계` 제공 | `유형 / 근거`, `금액`, `반영 기준`, `손익 차감액`, `메모`, `관리` 표 제공 |
| 원가·손익 집계 | 경제 정보 카드와 원가 합계로 제공 | 별도 `통화별 원가·손익 계산표` 제공 |

서류 대조의 상태 정보가 전부 없다는 뜻은 아니다. 원본의 행 상태 열과 로컬의 셀 상태 표현이 다르다는 의미다. 선적도 값을 합친 열이 있어 단순 명칭 치환만으로 원본 구조와 같아지지 않는다.

- [원본 서류 대조표](https://github.com/hrm-corp/ecoya-platform-user-frontend/blob/e98954f608beb92e326993b0f31bd2e7a8f4d4f5/src/features/erp/deals/detail/panels/ReconcileTable.tsx)
- [원본 선적 표](https://github.com/hrm-corp/ecoya-platform-user-frontend/blob/e98954f608beb92e326993b0f31bd2e7a8f4d4f5/src/features/erp/deals/detail/panels/ShipmentTimelinePanel.tsx)
- [원본 경제 정보](https://github.com/hrm-corp/ecoya-platform-user-frontend/blob/e98954f608beb92e326993b0f31bd2e7a8f4d4f5/src/features/erp/deals/DealEconomicsPanel.tsx)
- [원본 비용 입력](https://github.com/hrm-corp/ecoya-platform-user-frontend/blob/e98954f608beb92e326993b0f31bd2e7a8f4d4f5/src/features/erp/deals/DealCostsPanel.tsx)
- [로컬 실제 거래 상세](../trade-os/deals/detail.tsx), [로컬 금융 영역](../trade-os/deals/finance-workspace.tsx)

`page.tsx`에 남은 `LegacyDealDetailScreen`은 이번 실제 화면 비교의 근거로 사용하지 않았다. 현재 앱은 별도 `detail.tsx`의 `DealDetailScreen`을 사용한다. 거래 메시지 JSON의 전체 차이 수를 화면 오류 수로 세지 않았으며, 위 항목은 실제 연결 코드와 로컬 표시에서 확인한 차이다.

이번 작업은 비교와 기록이다. 제품 원본·로컬 UI 소스의 명칭을 새로 바꾸거나 커밋·배포하지 않았다.

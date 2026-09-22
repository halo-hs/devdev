# 운영·성과 5개 화면의 API 연결 점검

시각 기준: https://devdev-e6t.pages.dev/erp/ · 기능 기준: http://localhost:3030/erp/.

상단 장식 비주얼을 제외하고 필터·본문·값을 비교한다. 비주얼 안에 있는 필터·금액은 업무 기능이므로 비교에서 제외하지 않는다. 로컬 HEAD와 공개 배포가 동일하다고 추정하지 않는다.

현재 `src/features/erp-menu-prototypes.tsx`의 `ShipmentsPrototype`, `SettlementPrototype`, `MonitoringPrototype`, `ReportsPrototype`, `SalesPerformanceLivePrototype`은 상수·샘플·로컬 상태를 사용한다. `LivePrototype`이라는 이름은 실제 API 연결 증거가 아니다. 공개 화면의 조회·필터 변경에서 업무 API 요청이 관측되지 않았다. `prototypeBackend`의 `localMutation` 성공은 서버 저장 성공이 아니다.

## 필수 구현 기준: 3030과 기능 동등

이 화면은 **3030 원본과 기능적으로 동등해야 한다.** 아래의 차이는 선택적인 기획 보완이 아니라 해결해야 하는 `IMPLEMENTATION_GAP`이다. 공개 캡처는 현재 디자인 관측 자료이며, 필수 기능을 줄인 완성 목표가 아니다.

- **값**: 같은 조직·권한·기간·담당자·통화·시간대·기준시각의 실제 API를 연결한다. 금액·건수·비율·기간 비교·상태·기준시각·제외 사유를 원본과 대응시키며 예시 상수로 대체하지 않는다.
- **위치**: 같은 화면 폭에서 숫자가 속한 요약 카드/표/상세 구역, 구역의 위아래·좌우 관계와 표시 순서를 원본에 맞춘다. 본문 지표를 팝업 안으로 숨기거나 다른 의미의 카드와 합치지 않는다. 반응형에서는 같은 읽기 순서와 지표 묶음을 유지한다.
- **그래프**: 원본에서 제공하는 그래프를 누락하지 않는다. 원천·조회 기간·축·단위·계열·범례·툴팁·음수/0/미확인/오류 상태와 대응 숫자를 일치시킨다. 합계 카드 하나로 시계열·분포를 대체하지 않는다.
- **동작**: 필터·검색·정렬·페이지 이동·재조회·행 상세·내보내기·저장 등 원본의 제공 기능을 동일한 데이터 범위와 권한으로 수행한다. 일부 카드만 필터를 적용하거나 로컬 성공 표시로 서버 처리를 대신하지 않는다.
- **표현 변경**: 상단 장식 비주얼과 팝업의 외형·크기·Modal/Sheet 표현은 달라도 된다. 팝업 안 필드·계산·검증·저장/취소·오류 복구·닫은 뒤 목록/선택/필터 복귀는 보존한다. 상단 안에 있는 실제 금액·필터는 장식 제외 범위가 아니다.
- **완료 판정**: 기능·숫자·그래프·위치·동작을 각각 통과해야 한다. 원본에 확인된 문구/산식 오류는 승인된 API·업무 의미에 맞춰 수정하며 오류까지 복제하지 않는다. 정책 반영과 실제 구현 완료를 구분한다.


| 구역 | 연결 원본 | 필수 기능 미달·구현 대상 |
|---|---|---|
| 선적 | GET `/api/platform/trade/shipments`, SNAP evidence | deal_id 그룹, confirmed/effective/provider ETA 우선순위, 미배정 그룹, 전체 페이지, stale 상태·갱신, 실제 Deal 진입 |
| 정산 | GET `/api/platform/trade/settlement/{overview,calendar,ledger}`, `/trade/finance-facts` | 원장 amount/applied/outstanding 축, 일정·통화·취소·방향 미확정·문서·분쟁·실제 ID, 독촉·신뢰·원통화 합계, 권한·재조회 |
| 모니터링 | GET `/api/platform/monitor/{kpi,status,blocked,risks,pending-actions,throughput}`, `/erp/flags`, `/trade/exceptions` | 이번주/지난주, 10/20/50, P0/P1, 완료율·날짜·담당자, 서버 Owner gate·기준시각·부분 실패 |
| 영업 성과 | GET `/api/platform/erp/reports/{settlement-series,gp-series,gp-by-assignee,counterparty-status}` | 실제 기간·담당자 UUID, 응답 통화, 현재 연체와 월말 잔액 분리, 통화 무관 진행 딜 dedupe, 상태·GP 열의 별도 근거 |
| 결산 | GET `/api/platform/erp/reports/{settlement-series,gp-series,counterparty-top,counterparty-gp,counterparty-status,month-closes}` | 필터 실제 재조회, 수금 적용액 명칭, GP basis, 서버 data_as_of·제외 사유, 월마감 목록·snapshot·재개방 사유 |

원본 구현: `/Users/hans/orca/workspaces/ecoya-platform-user-frontend/로컬에서띄우기/src/features/erp/` 및 `src/lib/api/{shipments,settlement,monitor,reports}.ts`.

실시간 연결 완료 기준: 같은 조직·권한·시간대·조건의 응답이 UI 값과 일치하고, 오류·빈 값·미확인을 예시/0으로 대체하지 않으며 필터 변경·새로고침·페이지 이동·드릴다운이 같은 범위를 유지한다. 쓰기는 실제 API 계약·권한·멱등 키·서버 결과 확인이 필요하다. 이 파일은 미연결 사실과 매핑을 기록하며 연결을 구현한 코드 변경이 아니다.

상세 응답·값 대조 및 SSOT 반영은 제품 문서 저장소 `ecoya 2.0/delivery/PROGRAM-TRADE-FINANCIAL-EVIDENCE-OS/STABILIZATION/qa-evidence/2026-09-19-erp-design-sync/five-screen-body-data-audit.md`를 따른다.

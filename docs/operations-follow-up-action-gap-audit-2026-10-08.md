# 정산·운영 감시·결산 리포트·영업 성과 후속 액션 대조

2026-10-08 기준. 원본 프론트엔드 `ecoya-platform-user-frontend/로컬에서띄우기`, 현재 devdev 작업 트리, 제품 SSOT `ecoya-products`의 `origin/dev`를 대조했다. **이번 문서는 변경 목록이며 화면·API 코드는 수정하지 않았다.** 로컬 공개 예시 모드의 결과를 운영 API 성공/실패로 일반화하지 않는다.

## 결론과 우선순위

| 우선 | 영역 | 빠졌거나 끊긴 후속 행동 | 확인 결과 |
|---|---|---|---|
| P0 | 정산 | 거래처 상세 열기 | 원본 `/erp/counterparties/[counterpartyId]`는 있으나 devdev 상세 라우트가 없어 홈으로 이동한다. |
| P0 | 운영 감시 | 대기 문서 확인 | 원본 `/erp/confirm/[documentId]`는 있으나 devdev 라우트가 없어 홈으로 이동한다. |
| P0 | 정산 | 근거 문서 열기 | `/erp/documents?q=...`가 devdev에서는 문서 **목록** 대신 문서 만들기로 연결되고 `q`가 소비되지 않는다. |
| P0 | 정산 | 원장 행 상세의 현금·이력·예외·거래처 Deal 조회 | 패널과 액션 코드는 있으나 해당 GET 응답이 예시 어댑터에 없어 열면 조회 오류가 난다. 이어지는 저장 API도 차단된다. |
| P1 | 정산 | 회계용 CSV·세무사용 명세 내려받기 | 로컬에서 회계용 CSV 요청 `/__reference3030/api/platform/trade/settlement/ledger/export?...`가 HTTP 502. 두 버튼이 같은 export 함수에 의존한다. |
| P1 | 운영 감시 | 서류 갭·미선적 잔량·수량 불일치의 “모두 보기” | 원본은 `/erp/deals?ops=...` 조건을 읽는다. devdev 거래 화면은 `ops`를 초기 URL에서 읽지 않아 전체 목록으로 열린다. `qty_mismatch`와 devdev의 `quantity` 값도 다르다. |
| P1 | 운영 감시 | 플래그 “확인함” 처리 | 원본과 devdev에 버튼·`POST /erp/flags/:id/ack` 호출은 있으나 예시 어댑터는 모든 일반 POST를 거부한다. 현재 예시 플래그가 0건이라 버튼 클릭 결과는 재현하지 못했다. |
| P1 | 영업 성과 | Member 정산 범위 | 원본은 `assignee_id=user_id`로 조회한다. devdev는 Member에서 담당자 없는 회사 범위 요청으로 변경됐다. 최신 SSOT의 기본 범위는 담당·공동 작업 Deal이고 회사 전체는 `VIEW_COMPANY_SETTLEMENT`가 필요하다. 백엔드 새 계약 전 현행 동작 유지 지시도 있어, 권한 계약과 함께 해결해야 한다. |
| P2 | 영업 성과 | 거래처 상태 행에서 상세로 이동 | SSOT에는 행 선택 후 상세 이동이 적혀 있으나 원본·devdev 양쪽 모두 행 선택 동작이 없다. **원본 대비 devdev 누락은 아니고 공동 구현 공백**이다. |

네 상위 메뉴 `/erp/settlement`, `/erp/monitor`, `/erp/reports`, `/erp/sales-performance`는 모두 devdev에 존재한다. 결산 리포트의 월마감 목록·스냅샷 상세·마감·재개방·재마감은 같은 화면에 연결되어 있고, devdev 예시 어댑터는 관련 조회와 두 POST를 처리한다. 원본의 `*ProtectedPage` 래퍼 파일은 devdev 셸로 대체된 것이어서 별도 업무 페이지 누락으로 세지 않았다.

## 화면별 액션 전수 판정

| 화면 | 원본 액션 묶음 | devdev 판정 |
|---|---|---|
| 정산 | 통화·취소 포함·새로고침, 오늘 결정/원장 드릴, 지급 독촉 초안 복사, 거래처·Deal·문서 열기, 원장 페이지, 송장 손익/인계 필터, CSV·세무 명세 | 같은 화면의 조회·필터·복사·Deal 링크는 있음. 거래처 상세 라우트, 문서 목록 목적지, CSV 응답은 깨짐. 거래처 펼침의 `settlement/deals` GET도 예시 데이터가 없음. |
| 정산 상세 패널 | 수금·지급 기록, 현금 적용/정정/취소, 초과금·선수금·선급금·조정·환불, 분쟁 등록/해결, 대손 제안/철회/확정, 일정 완료/재개방/완료 취소, 이력 조회 | UI 핸들러와 API 클라이언트는 대부분 원본에서 옮겨졌으나 예시 모드의 상세 GET·일반 POST/DELETE가 미지원. 저장 성공 화면으로 볼 수 없음. **SSOT상 새 상세 페이지를 만들 대상은 아님.** |
| 운영 감시 | 주간 기간·행 수·재조회, 긴급/리스크/막힘 큐, 플래그 미확인/확인함·확인 처리, 대기 문서/Deal 진입, 처리량 드릴, 예외 센터 Deal 링크 | 네 메뉴 본문과 조회는 있음. 문서 확인 목적지와 Deals `ops` 필터가 끊김. 플래그 쓰기는 예시에서 차단. 예외 센터의 Deal 상세 링크는 라우트가 있음. |
| 결산 리포트 | 월/주·기간·통화·담당자·다시 조회, 거래처 Top→정산, 마감 목록·상세 스냅샷·마감·재개방·재마감, 부분 실패 재시도 | 목적 페이지와 동작 코드가 있음. 예시 모드는 month-close GET/POST를 지원한다. 실제 백엔드 권한·중복·409·주 단위 재집계는 이번 점검에서 실행하지 않았으므로 성공 판정하지 않음. |
| 영업 성과 | 3/6/12개월·통화·담당자 필터, KPI·월별 추세·GP 순위·거래처 상태, 오류 재시도 | Owner/Admin 읽기 동작은 있음. Member 요청 범위가 원본과 다름. 거래처 행 상세는 원본에도 없고 SSOT에만 요구됨. |

## API 오류와 SSOT 재확인

| 호출·액션 | devdev 예시 상태 | 계약 확인 |
|---|---|---|
| `GET /trade/settlement/overview`, `/calendar`, `/ledger`, `/trade/finance-facts`, `/trade/counterparties/scorecards` | 캡처된 응답이 있어 첫 화면은 렌더된다. 캡처되지 않은 필터/페이지는 실제 재집계를 보장하지 않는다. | SC-21은 통화·기간·취소 포함 조건을 해당 요약과 원장에 일관 적용하도록 요구한다. |
| `GET /erp/settlement/deals`, `/erp/payment-schedules/:id/**`, `/trade/settlement/schedules/:id/**`, `/trade/deals/:id/settlement-disputes` | 예시 응답이 없다. 대부분 `예시 데이터가 없는 항목입니다` 오류이며 Deal 분쟁 조회는 일반 Deal 상세 handler에 잘못 걸려 `해당 거래 상세가 없습니다` 오류가 난다. 정산 상세 패널의 현금·초과금·조정·환불·완료 이력 및 거래처 펼침에 영향. | SC-21은 원장 행 안의 일정 상세에 원본 현금·적용액·잉여·분쟁·환불·조정 이력과 행동을 유지하도록 정의한다. 실제 서버 API 부재로 단정할 근거는 없다. |
| 정산 POST/DELETE: 일정 생성, 현금 기록/배정/정정/취소, 초과금/조정/환불, 분쟁, 대손, 완료/재개방/완료 취소 | 예시 어댑터의 일반 비 GET 요청은 `예시 화면입니다. 실제 저장·발송은 실행되지 않습니다.`로 실패한다. | SC-21과 정산 데이터 사전의 사건별 기록·권한·멱등성 계약을 따른다. 공개 예시 차단 자체는 SSOT에 명시돼 있으나 버튼과 오류 안내는 읽기 전용 성격을 분명히 해야 한다. |
| `GET /trade/settlement/ledger/export` | 로컬 클릭에서 HTTP 502. `settlement.ts`가 demo 어댑터를 거치지 않고 `/__reference3030` 프록시로 직접 `fetch`한다. | SC-21은 현재 필터·권한에 따른 실제 CSV/세무 파일 생성을 요구한다. 로컬 502는 프록시 경로 오류 증거이며 운영 환경 결과는 미확인. |
| `POST /erp/flags/:id/ack` | 예시 어댑터에서 차단. 0건 fixture 때문에 클릭 재현은 못 했으나 handler 분기상 거부가 확정적이다. | SC-13/FS-06은 확인 상태를 조직 단위로 기록하고 업무 완료와 별도로 취급한다. |
| `/erp/reports/settlement-series`, `gp-series`, `counterparty-*`, `gp-by-assignee` | 예시 bundle을 반환한다. 가능한 기간·담당자·통화 조합 전체의 서버 계약 검증은 아님. | SC-24/25는 같은 필터 범위, 영역별 실패·재시도, Member 민감 필드 제한을 요구한다. |
| `GET/POST /erp/reports/month-closes`, `/month-close`, `/month-closes/:id/reopen` | devdev 예시 구현이 있다. 마감/재개방 409를 명시적으로 낸다. 재마감은 같은 `month-close` POST로 기존 재개방 행을 갱신한다. | SC-24는 종료 월·권한·사유·고정 snapshot·중복 상태를 정의한다. 예시 동작을 실제 백엔드 연결 완료로 보지 않는다. |

## 근거 위치

- 원본 페이지: `src/app/erp/{settlement,monitor,reports,sales-performance}/page.tsx`, `counterparties/[counterpartyId]/page.tsx`, `confirm/[documentId]/page.tsx`, `documents/page.tsx`; 원본 목록의 `DocumentsListConnected.tsx`, `DealsListConnected.tsx`, `dealsListUtils.ts`.
- devdev 라우트: `trade-os/lib/erp-routes.ts`; 정산 링크와 액션: `trade-os/operations/settlement/SettlementConnected.tsx`, `CounterpartyScorecardPanel.tsx`, `CanonicalScheduleCashPanel.tsx`, `SettlementExceptionPanel.tsx`; 운영 동선: `monitor/mapMonitorLive.ts`, `monitor/MonitorDealsOpsPanels.tsx`, `monitor/MonitorConnected.tsx`; 결산·영업성과: 각 `ReportsConnected.tsx`, `SalesPerformanceConnected.tsx`.
- devdev API: `trade-os/operations/demo/api.ts`, `demo/responses.json`, `lib/api/{settlement,flags,reports,scheduleCash}.ts`.
- 최신 제품 계약: `ecoya-products` `origin/dev`의 `functional-specs/screens/{13-monitor,21-settlement,24-reports,25-sales-performance}.md`, `shared-flows/{05-01-settlement-data-dictionary,06-worklist-and-team-overview,17-reports-sales-performance-and-intelligence}.md`.
- 로컬 실행 점검: 네 상위 경로 렌더, 거래처·문서 확인 링크의 홈 이동, 문서 링크의 문서 만들기 이동, Deals `ops` 미적용, 정산 CSV 502를 확인했다. 나머지 예시 API 판정은 어댑터 코드와 fixture 키 대조다. 실제 운영 API와 역할별 서버 권한은 점검하지 않았다.

## 반영 작업 목록

1. 거래처 상세·문서 확인·문서 목록의 목적 화면/라우트를 원본과 같은 문맥으로 연결한다.
2. 운영 감시 Deals 링크의 `ops` 쿼리를 거래 화면 필터에 적용하고 `qty_mismatch` 값 매핑을 맞춘다.
3. 정산 상세 GET의 예시 응답 또는 명시적 읽기 전용 경계를 마련하고, 쓰기 액션을 실제 서버 연결 환경에서 계약대로 검증한다. 패널을 별도 페이지로 옮기지 않는다.
4. 내보내기 경로를 환경별 API 연결과 맞춰 CSV·세무 명세를 실제 파일로 확인한다.
5. 플래그 확인 쓰기 동작을 서버 연결 환경에서 검증하고 예시 모드의 비활성·오류 안내를 정리한다.
6. Member 영업 성과의 `VIEW_COMPANY_SETTLEMENT` 및 담당·공동 작업 범위를 백엔드 계약 확정과 함께 적용한다. 거래처 상태 행 상세는 원본에도 없는 SSOT 구현 항목으로 별도 추적한다.

# Backend API readiness matrix

> 2026-07-21 완료 범위와 다음 재점검 제외 기준은 [`2026-07-21-source-audit-checkpoint.md`](./2026-07-21-source-audit-checkpoint.md)를 따른다.

원본 기준: `/Users/hans/team/1-projects/ecoya-erp-v2/user-frontend/src`

이 문서는 화면 문구가 아니라 원본 API 클라이언트와 Connected 컴포넌트의 실제 요청 계약을 기준으로 작성한다. 현재 프로토타입은 `src/lib/prototype-backend.ts`의 로컬 어댑터를 사용하며, 인증된 HTTP 클라이언트로 교체해도 화면 상태 계약은 유지한다.

## 파일 올리기

| 원본 기능                  | 프로토타입 트리거/상태                 | API 연결 시 계약                                                                                                |
| -------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 문서 목록·유형 조회        | 최근 파일, 유형 상태, 유형 직접 선택   | `listDocumentTypes`, `listTradeDocs`, `listAllTradeDocs`, `getTradeDocument`                                    |
| 다중 업로드·폴더·메일 수신 | 다중 선택, 폴더 picker, 메일 첨부 선택 | `uploadTradeDocument`, 이메일 수신 식별자                                                                       |
| 삭제·OCR 재처리            | 목록 케밥 삭제, 실패/제외 문서 재처리  | `deleteTradeDocument`, `retryTradeDocument`                                                                     |
| 원문 조회·다운로드         | PDF 뷰어, 확대·이동·다운로드           | `tradeDocContentUrl`, `fetchTradeDocContentBlob`                                                                |
| 추출 필드 검토             | 타입별 input, 누락·신뢰도·출처         | `listExtractionFieldsForDocument`, `patchExtractionField`, `createUserExtractionField`, `rejectExtractionField` |
| 필드 변경 이력             | 변경 이력 진입                         | `listFieldHistoryForDocument`                                                                                   |
| 거래 후보·연결             | 후보 있음/없음/지정 거래, 신규 거래처  | `listDealCandidates`, `assignDocumentToDeal`, `unassignDocumentFromDeal`, `createDeal`                          |
| Confirm                    | 필수 Trigger 검증 후 거래 첨부         | `commitExtractionDocument`                                                                                      |
| 중복 송장                  | 중복 상태와 기존 문서 안내             | `getDuplicateInvoices`                                                                                          |

## 문서 만들기

| 원본 기능        | 프로토타입 트리거/상태                                            | API 연결 시 계약                                                                                                                                                          |
| ---------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 템플릿·문서 목록 | 템플릿 13종, 최근 문서, 상태 필터                                 | `listDocumentTemplates`, `listGeneratedDocuments`, `getGeneratedDocument`                                                                                                 |
| 초안 생성·수정   | 프롬프트, 출처 파일 N개, 필드·품목 편집                           | `parseDocDraft`, `createGeneratedDocument`, `patchGeneratedDocument`                                                                                                      |
| 출처 첨부        | 기존 문서 선택, 직접 업로드, 제거                                 | `listAttachments`, `addAttachment`, `uploadSendAttachment`, `removeAttachment`                                                                                            |
| 정돈·스타일      | 양식, 강조색, 로고, 문구 다듬기                                   | `listArchetypes`, `setDocumentStyle`, `patchGeneratedDocument`                                                                                                            |
| 확정·복제        | 필수값 검증, 확정 후 액션 변경                                    | `confirmGeneratedDocument`, `duplicateGeneratedDocument`                                                                                                                  |
| 승인 흐름        | 요청, 승인, 반려, 반려 메시지, 이력                               | `submitGeneratedDocument`, `approveGeneratedDocument`, `rejectGeneratedDocument`, `listApprovalEvents`                                                                    |
| 출력             | 미리보기, PDF, bundle                                             | `fetchGeneratedDocumentPreview`, `generatedDocumentPreviewUrl`, `generatedDocumentPdfUrl`, `generatedDocumentBundleUrl`                                                   |
| 고객 전달        | 문서 상세 또는 거래 상세의 우측 레이어에서 Magic Link·이메일 전달 | `listGeneratedDocuments(getIdToken, dealId)`, `getGeneratedDocument`, `listShareLinks`, `createShareLink`, `revokeShareLink`, `listDeliveryEvents`, `createDeliveryEvent` |

## 거래

| 원본 기능        | 프로토타입 트리거/상태                                                                | API 연결 시 계약                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 목록·필터·검색   | 검색, 단계/담당자/위험/운영, 정렬                                                     | `listDeals`, `searchDeal`, `getDealsSummary`, `getDealReviewSummary`                                                               |
| 생성·보관·복원   | 생성 dialog, 삭제 거래, 복원 로딩/실패                                                | `createDeal`, `archiveDeal`, `unarchiveDeal`                                                                                       |
| 담당자·공유      | 담당자 변경, 멤버 공유                                                                | `patchDealAssignee`, `listDealShares`, `createDealShare`, `deleteDealShare`                                                        |
| 문서 연결·대조   | 5종 연결, 전체 거래 필드, 출처·불일치                                                 | `getDeal`, `getDealMatch`, `assignDocumentToDeal`, `unassignDocumentFromDeal`                                                      |
| 거래별 고객 전달 | 거래에 연결된 생성 문서 수 표시, 1개는 전달 레이어 직행, 여러 개는 레이어 안에서 선택 | `listGeneratedDocuments(getIdToken, dealId)` 또는 `GET /trade/deals/{deal_id}/generated-documents`; 선택 후 문서별 전달 API 재사용 |
| 거래 건강도      | 위험·브리프·은행 변경·무시                                                            | `getDealHealth`, `getDealBrief`, `getDealBankChange`, `dismissDealRisk`                                                            |
| 주문 변경        | 종결, 단축 종결, 취소, 재개, 가격 수정, 이력                                          | `orderAction`, `listOrderEvents`                                                                                                   |
| 당사자·비용      | 역할별 당사자, 공유, 노트, 비용 CRUD                                                  | `listParties`, `upsertParty`, `deleteParty`, `listDealCosts`, `createDealCost`, `updateDealCost`, `deleteDealCost`                 |
| 분석             | 요약·리뷰·인사이트·가져오기                                                           | `getQuickInsights`, `getFinancialInsights`, `getOwnerBrief`, `importDeals`, `dismissInsight`                                       |

## 선적·정산·운영·결산

| 원본 기능           | 프로토타입 트리거/상태              | API 연결 시 계약                                                                                                                                                               |
| ------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 선적 목록·갱신      | 검색, 상태, 거래 묶음, SNAP 증빙    | `listShipments`, `listAllShipments`, `refreshShipmentTracking`                                                                                                                 |
| 정산 조회           | 개요, 달력, 원장, 점수, 재무 근거   | `getSettlementOverview`, `getSettlementCalendar`, `getSettlementLedger`, `getCounterpartyScorecards`, `getTradeFinanceFacts`, `getDealEconomics`                               |
| 입금·지급 기록      | 우측 패널, 로딩·실패·중복 클릭 차단 | `recordSchedulePayment`, `listSchedulePayments`                                                                                                                                |
| 기록 삭제·완료 취소 | 완료 취소 후 재입력 가능            | `deleteSchedulePayment`, `uncompleteSchedule`                                                                                                                                  |
| 내보내기            | 회계용 CSV, 세무사용 월간 명세      | `downloadSettlementLedgerCsv`                                                                                                                                                  |
| 운영 감시           | KPI, 위험, 대기·차단, 처리·무시     | `getMonitorKPI`, `getMonitorStatus`, `getMonitorRisks`, `getMonitorPendingActions`, `getMonitorBlockedP0`, `getMonitorBlockedP1`, `getMonitorThroughput`, `getMonitorSnapshot` |
| 결산 리포트         | 기간·통화, GP, 거래처·담당자 성과   | `getSettlementSeries`, `getGpSeries`, `getCounterpartyTop`, `getCounterpartyGp`, `getCounterpartyStatus`, `getGpByAssignee`, `listMonthCloses`, `getMonthClose`                |
| 월마감              | 준비도, 동결 환율, 로딩·실패·완료   | `closeMonth`                                                                                                                                                                   |

## 온보딩·설정·공통

| 원본 기능          | 프로토타입 트리거/상태                                    | API 연결 시 계약                                                                                                                                                                                                                          |
| ------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 온보딩             | 회사 정보, 관심 신호 N개, 문서 업로드, 추천 승인/제외     | `getOnboarding`, `getOnboardingBootstrapSummary`, `getOnboardingInitialCockpit`, `listOnboardingSuggestions`, `approveOnboardingSuggestion`, `dismissOnboardingSuggestion`, `patchOnboarding`                                             |
| 회사·브랜드        | 회사·은행·서명·문서 브랜딩, 로고·서명·사업자등록증 업로드 | `getOrgProfile`, `putOrgProfile`, `getOrgBrand`, `putOrgBrand`                                                                                                                                                                            |
| 멤버·초대·개인정보 | 초대, 재발송·취소, 역할·퇴출, 내보내기·삭제               | `listMembers`, `changeMemberRole`, `removeMember`, `listPendingInvites`, `createInvite`, `cancelInvite`, `resendInvite`, `exportUserData`, `eraseUserData`                                                                                |
| 별칭 학습          | 후보 승인/제외, 표준 거래처·별칭 N개, 병합·복구           | `listCounterpartyAliases`, `listCounterparties`, `listCounterpartyDuplicateCandidates`, `suggestCounterparty`, `createCounterpartyAlias`, `deleteCounterpartyAlias`, `updateCounterparty`, `mergeCounterparty`, `repairCounterpartyLinks` |
| 알림·액션 아이템   | 개인 채널, 조직 규칙, 액션 상태 전환                      | `listAlertRules`, `patchAlertRuleEnabled`, `listAlertSubscriptions`, `upsertAlertSubscription`, `deleteAlertSubscription`, `transitionActionItem`, `listActionItems`                                                                      |
| 일괄 등록          | 거래처·거래 CSV 가져오기와 중복 결과                      | `importSalesContacts`, `importDeals`                                                                                                                                                                                                      |
| 결제·토큰          | 요금제 권한, 사용량, 구독                                 | `getEntitlements`, `getTokenUsage` 및 Billing API                                                                                                                                                                                         |
| AI 질의            | 질문, 근거 문서·거래 결과                                 | `askNlq`                                                                                                                                                                                                                                  |
| SNAP 증빙          | 작업·컨테이너·배분 후보, 할당·해제                        | `listSnapJobs`, `getSnapJob`, `listSnapContainers`, `listSnapAllocations`, `listSnapAllocationCandidates`, `allocateSnapContainer`, `releaseSnapAllocation`                                                                               |
| 영업 연락처        | 연락처 등록·가져오기·보관, 거래 연결                      | `listSalesContacts`, `createSalesContact`, `importSalesContacts`, `archiveSalesContact`, `getContactPipeline`, `listDealContacts`, `attachDealContact`, `detachDealContact`                                                               |
| 전달·협업          | 전달 이력, 거래 노트, 지급 일정                           | `listDeliveryEvents`, `createDeliveryEvent`, `listDealNotes`, `createDealNote`, `listPaymentSchedules`                                                                                                                                    |

## 현재 프로토타입 mutation 경계

`src/lib/prototype-backend.ts`는 아래 요청을 지연 응답으로 모사한다. 화면은 이 경계를 통해 요청 중 재클릭 차단, 성공 반영, 실패 메시지를 처리하므로 실제 API 클라이언트로 교체할 때 UI를 다시 작성하지 않는다.

- 거래 보관 복원: `deals.restore` -> 원본 `unarchiveDeal`
- 거래 상세 편집: `deals.setAssignee`, `updateFields`, `unlinkDocument`, `orderAction`, `createCost`, `updateCost`, `deleteCost`, `createParty`, `updateParty`, `deleteParty`, `createShare`, `deleteShare`, `createNote`, `createFlag`, `createContact`, `deleteContact` -> 원본 거래 상세 mutation 계약
- 선적 추적·SNAP 할당: `shipments.refreshTracking`, `allocateSnap` -> 원본 `refreshShipmentTracking`, `allocateSnapContainer`
- 고객 이메일 전달: `deliveryEvents.create` -> 원본 `createDeliveryEvent`; 문서·링크·수신자와 idempotency key를 함께 전달한다.
- 운영 감시 처리: `flags.acknowledge`, `actionItems.transition` -> 원본 `ackFlag`, `transitionActionItem`; 담당자와 처리 메모를 같은 요청 경계에서 보존한다.
- 정산 입금·지급 기록: `settlement.recordPayment` -> 원본 `recordSchedulePayment`
- 정산 완료 취소: `settlement.uncompleteSchedule` -> 원본 `uncompleteSchedule`
- 월마감: `reports.closePeriod` -> 원본 `closeMonth`
- 온보딩 추천 승인·제외: `onboarding.approveSuggestion`, `dismissSuggestion` -> 원본 `approveOnboardingSuggestion`, `dismissOnboardingSuggestion`
- 설정 별칭 승인·제외·병합: `settings.approveAlias`, `dismissAlias`, `mergeCounterparty({ sourceId, targetId })` -> 원본 `createCounterpartyAlias`, `deleteCounterpartyAlias`, `mergeCounterparty(sourceId, targetId)`
- 설정 멤버·초대: `settings.createInvite`, `resendInvite`, `cancelInvite`, `changeMemberRole`, `removeMember`, `eraseUserData` -> 원본 동명 API와 `userPrivacy.eraseUserData`
- 설정 알림: `settings.updateAlertRule`, `updateAlertSubscription` -> 원본 `patchAlertRuleEnabled`, `upsertAlertSubscription`
- 회사·보관 정책 저장: `settings.saveProfile(profile)`, `saveRetentionPolicy({ legalHold, policies })` -> 원본 `putOrgProfile`, `putOrgBrand`와 보관정책 API. 실제 HTTP 교체 시 프로필과 브랜드를 함께 저장하며, 로고·서명은 Data URI 200KB 이하, 사업자등록증은 Data URI 1MB 이하 계약을 유지한다.
- 설정 일괄 등록: `settings.importContacts(csv)`, `importDeals(csv)` -> 원본 `importSalesContacts`, `importDeals`; 응답은 `total`, `created`, `skipped`, 행 단위 `errors`를 유지한다.
- 별칭 삭제·거래처 병합: `settings.deleteAlias`, `mergeCounterparty` -> 원본 `deleteCounterpartyAlias`, `mergeCounterparty`

조회 데이터는 아직 프로토타입 fixture이지만 주요 화면의 가시적인 mutation은 공통 어댑터 경계를 통과한다. 실제 연동 시에는 이 표의 원본 함수별 request/response 타입을 그대로 가져오고, 화면 컴포넌트에서 직접 `fetch`하지 않는다.

## 실제 백엔드 연결 전 필수 공통 처리

- 인증 헤더와 조직 scope를 단일 HTTP 클라이언트에서 주입한다.
- 모든 mutation은 요청 중 재클릭을 차단하고, 실패 사유와 재시도를 같은 작업 위치에 표시한다.
- 목록 요청은 abort 또는 request id로 오래된 응답이 최신 필터 결과를 덮지 않게 한다.
- 금액·수량은 화면 표시 문자열이 아니라 원본 숫자와 통화/단위를 payload로 보낸다.
- 이메일·Magic Link·Confirm은 idempotency key를 사용한다.
- 권한별 CTA는 서버 권한 결과를 기준으로 숨김/비활성 처리한다.
- 삭제·복원·완료 취소·월마감은 audit event와 서버 시각을 응답으로 받는다.

## SNAP API 연결 경계

SNAP은 ERP prototype mutation과 다른 실제 Go API를 사용한다. 연결 기준은
`/Users/hans/team/1-projects/ecoya-snap-v2/apps/snap-backend/internal/httpapi/routes.go`이며,
클라이언트 경계는 `src/lib/snap-api.ts`와 `src/lib/snap-report-api.ts`에 분리했다.

| 영역           | 화면 계약                                         | 실제 API                                                                                                                                              |
| -------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 세션·조직      | 조직, 역할, plan, 공통 설정                       | `/auth/me`, `/org/members`, `/org/plan`, `/org/settings`, `/org/localization`, `/org/branding`                                                        |
| 작업 생성      | 자연어 draft, 보완 질문, 범위 확인, human confirm | `/tasks/draft`, `/tasks/:id/clarify`, `/tasks/:id/scope-confirm`, `/tasks/:id/confirm`                                                                |
| 작업 실행      | 배정, instruction, checklist, 현장 제출           | `/tasks/:id/assign`, `/tasks/:id/instruction`, `/tasks/:id/checklist`, `/tasks/:id/submit`                                                            |
| 증거           | presign, PUT, finalize, 품질 확인, 승인·반려      | `/tasks/:id/media/presign`, `/tasks/:id/media/:media_id/finalize`, `/media/:id/confirm`, `/media/:id/reject`                                          |
| 사무실 검토    | 제출물 workbench와 결정                           | `/tasks/:id/office-review`, `/tasks/:id/office-review/decision`                                                                                       |
| 리포트         | 생성, 승인, 교정, 서명, 고객 패키지               | `/tasks/:id/reports`, `/reports/:id/approval-workbench`, `/reports/:id/approve`, `/reports/:id/correct`, `/reports/:id/sign`                          |
| 전달           | 사전 점검, 채널 route, 링크 생명주기·재전송       | `/reports/:id/pre-send-check`, `/reports/:id/route`, `/reports/:id/share-link`, `/ops/share-links/:token/lifecycle`, `/ops/share-links/:token/resend` |
| 외부 공개      | 무계정 열람, 동의, 확인, 이의제기, 다운로드       | `/public/links/:token`, `/consent`, `/acknowledge`, `/dispute`, `/pdf`, `/evidence.zip`                                                               |
| 외부 업로드    | 다중 파일 순차 업로드, 부분 제출, 재개            | `/public/links/:token/presign`, `/finalize`, `/submit`, `/media/:media_id/quality-ack`                                                                |
| 고객·알림·운영 | 디렉터리, 알림, 실패 재처리, 시정조치             | `/customers`, `/notifications`, `/ops/delivery-failures`, `/ops/corrective-actions`                                                                   |
| ERP handoff    | 식별자 검토와 package handoff                     | `/tasks/:id/erp/detect`, `/tasks/:id/erp/linkages`, `/tasks/:id/erp-handoffs`                                                                         |

2026-08-03 재점검에서 위 표 외에도 원본 Go route의 가입·초대, 멤버 상태 전이, 과금·크레딧,
AI routing·budget, task repeat source, field signature, photo/express/data pack, media 분석·워터마크,
분쟁·시정조치, device, 보존·삭제, tenant ops, folder/library 및 ERP linkage·allocation 계약을
`src/lib/snap-api.ts`에 추가했다. 공개 링크의 인증·다운로드·외부 업로드 계약은
`src/lib/snap-report-api.ts`가 담당한다. 따라서 다음 구현은 endpoint를 새로 추측하는 작업이
아니라 fixture를 서버 DTO로 교체하고 인증 provider를 주입하는 작업이다.

파일 전송 계약도 handler 구현과 다시 대조했다. 작업·외부 증거는 presign URL에 원시 파일
바이트를 PUT하고, 조직 로고만 base64 JSON으로 전송한다. 공개 PDF와 증거 ZIP은 각각 blob
응답 메서드로 분리해 화면에서 JSON 파싱을 시도하지 않는다.

연결 단계에서는 `VITE_SNAP_API_BASE_URL`을 설정하고, 인증 SDK가 발급한 access token을
`registerSnapAuthProvider()`에 주입한다. 이 함수는 내부적으로 공통
`setSnapAccessTokenProvider()` 경계를 사용한다. 운영 빌드에서는
`VITE_SNAP_ALLOW_DEV_HEADERS`를 사용하지 않는다. 목록 응답은
`src/lib/snap-adapters.ts`가 `items`·`data`·`results`·배열 형태를 공통 page model로
정규화한다.

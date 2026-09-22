# 원소스 기반 AI 문서 처리 기능 체크리스트

기준: 이 문서를 AI 문서 처리 기능 체크리스트의 정본으로 사용한다.
범위: `/Users/hans/team/1-projects/ecoya-erp-v2/user-frontend` 및 `/Users/hans/team/1-projects/ecoya-erp-v2/backend` 원소스에서 확인한 기능 흐름 + 현재 프로토타입에서 눈으로 잡은 기능 + 추가 요구사항.
최근 원소스 재점검: 2026-07-10 (`InboxConnected`, Confirm Step 1/2, generated documents create/list/deliver, 프론트 테스트 및 backend docgen 기준)

현재 로컬 프로토타입과의 구현 대조 결과는 `docs/local-prototype-gap-checklist.md`를 따른다.

## 판정 기준

- 필수: 원소스에 이미 있는 기능 흐름. 프로토타입에도 사용자가 이해할 수 있게 표시되어야 한다.
- 추가: 원소스에는 아직 명확히 없거나 확장 요구로 들어온 기능. 별도 백엔드/프론트 설계가 필요하다.
- 점검: 기능은 있으나 엣지케이스, 실패상태, 중복 표현을 확인해야 한다.
- 제외: UI 장식, 색감, 레이아웃 취향. 단, 기능을 오해하게 만드는 표시 방식은 포함한다.

## 원소스 확인 경로

| 기능 영역 | 프론트 원소스 | 백엔드/정책 원소스 |
|---|---|---|
| 파일 올리기/최근 파일 | `src/features/erp/inbox/InboxConnected.tsx`, `InboxView.tsx`, `src/lib/api/tradeDocs.ts` | `internal/handler/trade/docs.go`, `internal/service/trade/docs/` |
| OCR 필드 검토 | `src/features/erp/confirm/ConfirmStepOneConnected.tsx`, `triggerValidation.ts`, `confirmStepOneFieldLogic.ts`, `src/lib/api/erpExtraction.ts` | extraction field patch/reject/commit API |
| 거래 연결 | `ConfirmFlowConnected.tsx`, `ConfirmStepTwoConnected.tsx`, `confirmCommit.ts` | deal candidate/create/assign 및 extraction commit API |
| 문서 만들기 | `DocumentCreateConnected.tsx`, `DocumentCreateStepViews.tsx`, `documentCreateUtils.ts`, `src/lib/api/generatedDocuments.ts` | `internal/docgen/templates.go`, `service.go`, `quality.go`, `discrepancy.go` |
| 승인/반려 | generated document approval API 및 create step views | document approval events 저장소/handler |
| 고객 전달 | `DocumentDeliverConnected.tsx`, `shareLinkStatus.ts`, `sendAttachmentSelection.ts` | `internal/docgen/share_guard_test.go`, `bundle.go`, public share handler |
| 회귀/엣지케이스 | Inbox/Confirm/Document Create/Deliver의 `*.test.ts(x)` 143개 시나리오 | docgen/trade docs 관련 Go test |

이 문서에서 `필수`는 위 원소스의 실제 동작과 테스트로 확인된 항목이다. 이메일 Forward-in, debounce 자동저장처럼 원소스에 없는 요구는 `추가`로만 관리한다.

## 1. 파일 올리기 / 문서 유입

| 상태 | 기능 | 원소스 기준 | 프로토타입 체크 |
|---|---|---|---|
| 필수 | 파일 직접 업로드 | `uploadTradeDocument`가 PDF만 허용하고 `/trade/docs`로 업로드 | 파일 올리기 박스는 유지. 주 버튼은 파란색 `파일 올리기` |
| 필수 | 업로드 제한 | 프론트 기준 1회 최대 5개, 파일당 최대 50MB, PDF 외 형식은 POST 전 차단 | 선택 즉시 제한 사유를 알려주고 업로드를 시작하지 않음 |
| 필수 | 업로드 진행률 | 배치 업로드 중 완료 파일 수/전체 파일 수를 표시 | `1 / 3`처럼 파일 단위 진행률 표시 |
| 필수 | 부분 성공 처리 | 성공 파일은 유지하고 중복/실패/취소 파일만 별도로 안내 | 전체 실패와 부분 실패를 같은 오류로 처리하지 않음 |
| 필수 | 업로드 취소 | `AbortSignal`로 미전송 업로드 취소 가능 | 대량/실수 업로드 중 취소 상태 필요 |
| 필수 | 중복 업로드 차단 | 409 `TRADE_DOCS_DUPLICATE`, 기존 파일명/거래 표시 | 동일 파일 재업로드 시 기존 문서/거래 안내 필요 |
| 필수 | 대량 문서 목록 | `listAllTradeDocs`가 200개 단위 최대 25페이지, 중복 id 제거 | 최근 파일 목록은 큐처럼 N개 증가 가능해야 함 |
| 필수 | 업로드 후 OCR 처리 | `UploadProcessor`가 저장 blob을 읽어 OCR 서비스로 백그라운드 처리 | 파일 선택 후 OCR, 필드 확인, 거래 연결 흐름이 보여야 함 |
| 필수 | OCR 실패 재시도 | `retryTradeDocument`가 기존 blob 재처리 | 실패 문서 재시도/삭제 액션 고려 |
| 필수 | 처리 문서 자동 갱신 | processing 문서가 있을 때만 5초 간격으로 비중첩 polling | 수동 새로고침 없이 processing -> done 반영 |
| 필수 | 큐 조회 실패 독립성 | 문서 목록 조회가 실패해도 업로드 컨트롤은 사용 가능 | 목록 오류가 파일 올리기까지 막지 않음 |
| 필수 | 미연결 인박스 문서 | `deal_id = null` 문서는 인박스 큐 항목 | 거래 연결 전 상태와 연결 후 상태 구분 |
| 필수 | 원문 PDF 보기 | `tradeDocContentUrl` 및 인증 blob fetch | 필드 확인 시 PDF는 오른쪽, 필드는 왼쪽 |
| 필수 | 필드 확인/수정 | extraction fields/user-fields/field-history/commit 라우트 존재 | 입력 필드는 수정 가능, 수정 중 로딩/저장 상태 필요 |
| 필수 | 문서 유형 추론 정보 | detected type, confidence, source, reason이 문서 모델에 존재 | 유형·신뢰도·AI 판단 근거를 중복 없이 한 곳에 표시 |
| 필수 | 지원 외 문서 분기 | 알려진 9종 밖의 문서는 업로드는 유지하되 예외 안내 | 취급하지 않는 품목/비거래 문서는 거래 연결에 사용하지 않음 |
| 필수 | 중복 인보이스 경고 | invoice number가 2개 이상 문서에 존재하면 double-payment 경고 | 업로드 중복과 별개로 지급 위험 경고 표시 |
| 필수 | 거래 연결 단계 | OCR/필드 확인 이후 거래 연결/첨부 가능 | 단계 버튼은 명확히 하나만. 필드확인 상태면 거래 연결 버튼 |
| 점검 | 첨부 불가 문서 | `eligibleInboxAttachDocs`는 `erp_document_id`, `storage_uri`, deal match 필요 | 은행/보안 문서 등 첨부 불가 사유를 분리 표시 |
| 추가 | 이메일에서 첨부 찾기 | 수신 SES/Forward-in은 현재 발신 SES와 별도 요구 | 파일올리기 하단 토글: `이메일에서 찾기 | 폴더 | 파일 업로드` |
| 추가 | 조직 수신 주소 | `docs+<조직슬러그>@도메인` | 토글 시 수신주소를 짧게 표시 |
| 추가 | 등록 멤버 발신만 수락 | 조직 멤버 발신자 allowlist 필요 | 미등록 발신은 거절/격리로 기능 정의 |
| 추가 | 이메일 첨부 자동등록 | AWS SES inbound로 첨부가 인박스 문서열에 들어옴 | 토글 시 `수신`/`문서` 열만 표시. OCR 상태 뱃지는 숨김 |
| 점검 | 이메일 엣지케이스 | 여러 첨부, 첨부 없음, 암호화 PDF, 대용량, 중복 메일, 악성 파일 | UI에는 복잡한 상태를 노출하지 않되 처리 실패 대응 필요 |

## 2. 최근 파일 / 파일 목록

| 상태 | 기능 | 원소스 기준 | 프로토타입 체크 |
|---|---|---|---|
| 필수 | 최근 파일 목록 | `/trade/docs` 전체 sweep 기반 | 이름은 `최근 파일` 하나만 사용 |
| 필수 | 상시 케밥 메뉴 | 목록 항목별 보조 액션 | 세로 케밥은 항상 노출, row 선택은 상세 이동 |
| 필수 | 선택 문서 강조 | 원소스 Inbox card는 선택 상태 ring을 사용 | 현재 보고 있는 파일을 목록에서 명확히 강조 |
| 필수 | 상태별 주 액션 | OCR/필드확인/완료/미연결에 따라 액션 변경 | 상태값 중복 뱃지 줄이고 버튼 액션으로 단계 표현 |
| 필수 | 목록에서 AI 코멘트 | OCR 신뢰도/검증 코멘트/정상 여부 | 상세로 들어가기 전 핵심 검증 메시지 표시 |
| 점검 | 목록 과밀 | 상태, 거래처, 페이지, 신뢰도 중복 | 한 항목당 문서명 + 핵심 보조정보 + 주 액션만 유지 |

## 3. AI 문서 만들기 진입

| 상태 | 기능 | 원소스 기준 | 프로토타입 체크 |
|---|---|---|---|
| 필수 | 자연어 초안 생성 | `parseDocDraft(text, { deal_id, direction })` | 입력창과 `문서 만들기` 버튼이 명확히 분리 |
| 필수 | AI 제안 검토 | parse 결과는 proposal이며 summary/questions/compose gates를 반환 | 바로 확정하지 않고 사람이 제안과 추가 질문을 확인 |
| 필수 | 직접 템플릿 시작 | `createGeneratedDocument` with selected template | `템플릿 선택` 카드 클릭으로 바로 시작 |
| 필수 | 거래 기반 시작 | `deal_id`가 있으면 거래 방향/거래 필드 기반 seed | 근거 자료 기반 초안 만들기 가능 |
| 필수 | 최초 접근 상태 | 최근 문서가 없으면 입력창 + 템플릿 추가만 | 문서 만들기와 파일 올리기 타이틀 높이/정렬 일관 |
| 필수 | 최근 문서 있는 상태 | 최근 문서 테이블 + 필터 + 템플릿 추가 | 입력 영역은 줄고 최근 문서 테이블 노출 |
| 필수 | 최근 문서 필터 | 전체/작성중/확정/완료 | 원소스 `all/draft/confirmed/sent` 반영 |
| 필수 | 최근 문서 row 이동 | row 선택으로 상세 이동 | 미리보기 버튼 제거, 작업필드 버튼은 상시 노출 |
| 필수 | 복제/이어쓰기 | `duplicateGeneratedDocument` 및 기존 `doc_id` resume | 최근 문서에서 이어서 작업/복제 가능 |
| 필수 | 방향 없는 시작 | deal 방향이 없으면 buy/sell 선택 후 템플릿으로 이동 | 완전 공백 상세가 아니라 방향+템플릿으로 문서 구조를 먼저 결정 |

## 4. 근거 파일 / 문서에서 찾기

| 상태 | 기능 | 원소스 기준 | 프로토타입 체크 |
|---|---|---|---|
| 필수 | 근거 문서 N개 선택 | deal 문서, 인박스 문서, 최근 문서 필드 재사용 | `문서에서 찾기` 선택 시 바로 아래에 전체 폭으로 열림 |
| 필수 | 추출 필드 표시 | `field_values`와 doc fields를 seed로 사용 | 근거 파일 카드에는 추출 필드 N개/핵심 값 표시 |
| 필수 | 최근값/업로드값 제안 | slot assist가 recent/inbox/deal/static examples 사용 | 필드 확인 영역에서 최신 사용값/업로드값 제안 표시 |
| 필수 | 금액 필드 제외 규칙 | deal 문서 seed에서 money keys 제외 | 오래된 금액이 새 문서에 잘못 복사되지 않도록 표시/검증 |
| 필수 | 검토 완료 문서만 재사용 | deal 문서 중 committed received 문서만 seed로 사용 | 미검토 OCR 값을 확정 데이터처럼 재사용하지 않음 |
| 필수 | 근거 문서 우선순위 | PO -> SC -> BL -> CI -> PL 순, 최대 3건, 첫 값 우선 | 계약·항로 근거가 인보이스보다 뒤로 밀리지 않게 함 |
| 점검 | 패널 배치 | 근거 파일은 레이어로 겹치면 안 됨 | 열릴 때 화면을 위로 밀지 말고 아래 콘텐츠를 민다 |
| 점검 | 많은 파일 | N개가 많을 수 있음 | 한 줄/가로 스크롤/캐러셀 또는 반응형으로 body 폭 사용 |

## 5. 템플릿 / 문서 구조

| 상태 | 기능 | 원소스 기준 | 프로토타입 체크 |
|---|---|---|---|
| 필수 | 고정 템플릿 레지스트리 | `docgen/templates.go`가 SSOT. AI가 구조 생성하지 않음 | 템플릿 추가는 원소스 문서 타입 기반 |
| 필수 | 템플릿 종류 | PI, CI, PL, PO, SC, QT, SI, BC, DN, CN, CO, DLV, SOA | `템플릿 선택` 목록에 원소스 13종 반영 |
| 필수 | 방향성 | `buy/sell`, PO는 buy 방향 | 방향 단계 또는 deal 방향 자동 적용 |
| 필수 | 필드 스키마 | slot kind text/number/money/date, required/section | 필드 확인 입력 타입과 필수 표시 |
| 필수 | 품목 행 | line_items spec, required columns, totals | 품목 행 추가 시 가운데/필드 영역에서 추가 수 표시 |
| 필수 | 합계 계산 | quantity x unit_price, freight/insurance/discount, total | line item 추가/수정 시 금액 반영 흐름 표시 |
| 필수 | 템플릿 13종 | PI, CI, PL, PO, SC, QT, SI, BC, DN, CN, CO, DLV, SOA | 원소스 제목/필드/품목 스키마를 그대로 사용 |

## 6. 초안 편집 / 필드 확인

| 상태 | 기능 | 원소스 기준 | 프로토타입 체크 |
|---|---|---|---|
| 필수 | 필수 필드 확인 | `computeMissingDocumentFields`, backend `MissingRequired` | 누락 필드가 있으면 확정/전달 전 차단 |
| 필수 | 필드 직접 수정 | `patchGeneratedDocument` | 입력 필드는 거래 확인 단계에서도 필요 시 수정 가능 |
| 필수 | 수동 저장/저장 상태 | 원소스는 save busy ref와 saved tick을 사용하는 명시적 저장 | 저장 중/저장 완료 상태와 중복 저장 차단 |
| 추가 | 필드 자동 저장 | 프로토타입 추가 요구. 원소스에는 자동 저장 debounce가 없음 | 입력 중 debounce 저장 + 입력 내부 spinner, 상단 수동 저장은 유지 |
| 필수 | AI 검증 라벨 | quality/discrepancy/slot assist | 별표 AI 아이콘 + 라벨로 정상/권장/추출/직접입력 표시 |
| 필수 | 문구 다듬기 | 원소스에는 AI draft/compose gate, 프로토타입 요구는 overlay | 선택 시 textarea overlay, 완료 시 닫힘 |
| 필수 | 로고/스타일 | `setDocumentStyle`, archetype/font/accent/logo_uri | 로고 넣기는 클릭 시만 열림, 완료되면 문서 요소에 완료 |
| 필수 | 로고 제한 | 원소스 프론트는 로고 파일 최대 200KB | 초과 시 적용하지 않고 제한 메시지 표시 |
| 점검 | 필드 과밀 | 원소스 필드는 많음 | 한 화면에 전부 요약하지 말고 필드 패널 스크롤/순차 이동 |

## 7. 품질 검증 / 불일치 / Confirm gate

| 상태 | 기능 | 원소스 기준 | 프로토타입 체크 |
|---|---|---|---|
| 필수 | 문서 품질 점수 | `DocumentQuality score/blocking/warning/issues` | 품질/준비도는 과도한 카드 대신 핵심 액션 근처 표시 |
| 필수 | blocking 차단 | 필수값 누락은 confirm 차단 | 차단 사유와 이동할 필드 안내 |
| 필수 | warning 승인 | score < 90 warning은 acknowledge 후 confirm | 확인 권장/품질 경고 처리 |
| 필수 | discrepancy 검사 | 거래 sibling 문서 및 L/C posture 비교 | 은행 거절 전 검증/AI 검증 코멘트 표시 |
| 필수 | compose gate | processing/failed/needs_clarification/ready | AI 초안 생성 중 질문/보류/실패 상태 |
| 점검 | 오류코드 표시 | `DOCGEN_DISCREPANCY_BLOCKED`, `QUALITY_ACK_REQUIRED`, `MISSING_REQUIRED`, `APPROVAL_REQUIRED` | 사용자 문구로 변환, 코드 노출 금지 |

### 7-1. 업로드 문서 필드 검토 Trigger

| 상태 | 기능 | 원소스 기준 | 프로토타입 체크 |
|---|---|---|---|
| 필수 | 문서 종류별 필수값 | BL/C-O/CI/CUSTOMS_ENTRY/PO/PL/PI/SC/AN별 Trigger가 다름 | 선택 문서 유형에 맞는 필드만 필수 처리 |
| 필수 | 누락 필드 즉시 생성 | OCR에 필수 필드 행이 없어도 synthetic missing row를 만들어 직접 입력 | `단가`처럼 없는 필드도 검토 화면에서 바로 입력 가능 |
| 필수 | 필드 거절 | 추출 필드 patch 외에 reject mutation 존재 | 잘못 추출된 필드를 삭제/제외하는 액션 필요 |
| 필수 | 신뢰도 단계 | 0.9 이상 green, 0.7 이상 yellow, 미만 red, 미측정 별도 | AI 검증 라벨과 입력행 상태에 반영 |
| 필수 | 비차단 경고 | CI 지급기한이 과거이면 경고하되 다음 단계는 차단하지 않음 | 누락 필수값과 경고를 같은 오류로 취급하지 않음 |
| 필수 | 비거래 문서 안내 | UNK/OTHER는 Trigger로 막지 않지만 비거래 문서 가능성을 경고 | 거래 연결 여부를 사용자가 판단하도록 함 |
| 필수 | 필드 변경 이력 | document field-history API 존재 | 값·변경 이유·변경 시점 확인 가능 |
| 필수 | 거래처 학습 | buyer/seller/counterparty 필드에서 거래처 alias 학습 | 기존 거래처 연결 또는 새 거래처 학습 분기 |

### 7-2. 거래 연결 Step 2

| 상태 | 기능 | 원소스 기준 | 프로토타입 체크 |
|---|---|---|---|
| 필수 | 거래 후보 조회 | 문서 field와 trade doc id로 deal candidates 로드 | 후보 목록과 재사용 가능한 문서 facts 표시 |
| 필수 | 기존 거래 연결 | assign -> commit 순서 | 후보 선택 후 `거래 연결` 하나의 주 액션 |
| 필수 | 신규 거래 생성 | createDeal -> assign -> commit 순서 | 후보가 없으면 거래처명 입력 후 신규 거래 생성 |
| 필수 | 이미 연결된 거래 | deal context에서는 새 후보 탐색 없이 지정 deal로 assign/commit | 거래 상세에서 진입한 경우 기존 deal 문맥 유지 |
| 필수 | 동시 작업 방어 | 이미 committed된 stale tab은 deal membership을 변경하지 않음 | 정직한 완료 안내 후 현재 거래로 이동 |
| 필수 | 중복 생성 방어 | 신규 deal 생성 후 assign 실패 재시도 시 createDeal을 다시 호출하지 않음 | 재시도는 assign/commit부터 이어감 |
| 필수 | 보관 정책 | core / choice / secure 문서군, choice는 keep_original 또는 data_only | 고객 전달 첨부 가능 여부와 혼동하지 않게 별도 표시 |

## 8. 승인 / 반려

| 상태 | 기능 | 원소스 기준 | 프로토타입 체크 |
|---|---|---|---|
| 필수 | 승인 제출 | `submitGeneratedDocument` | 문서 요소에 승인/반려 항목 |
| 필수 | 승인/반려 | owner/admin만 approve/reject, reject reason 필요 | 승인자 권한, 반려 사유 입력 |
| 필수 | 승인 히스토리 | `listApprovalEvents`, member roster | 초안 근처에 숨김/접힘 형태로 표시 가능 |
| 필수 | 승인 차단 | 필요한 경우 전달 전 `DOCGEN_APPROVAL_REQUIRED` | 고객 전달 전 gate로 표시 |

## 9. PDF / 미리보기 / 다운로드

| 상태 | 기능 | 원소스 기준 | 프로토타입 체크 |
|---|---|---|---|
| 필수 | HTML preview | `fetchGeneratedDocumentPreview` | 편집/전달 화면에서 문서 미리보기 |
| 필수 | PDF 다운로드 | `generatedDocumentPdfUrl` + authorized blob | 상단 PDF 버튼 또는 하단 floating controls |
| 필수 | 번들 다운로드 | `generatedDocumentBundleUrl` | 고객 전달 패키지 zip |
| 필수 | PDF 대조 컨트롤 | 페이지, 확대/축소, 확대, 다운로드 | 하단 플로팅 컨트롤로 표시 |
| 점검 | PDF 위치 | 파일올리기/문서만들기 모두 PDF는 오른쪽 | 필드가 왼쪽, PDF가 오른쪽 원칙 유지 |

## 10. 첨부 / 전달 패키지

| 상태 | 기능 | 원소스 기준 | 프로토타입 체크 |
|---|---|---|---|
| 필수 | 생성 문서 첨부 | `addAttachment(kind: generated)` | 관련 생성 문서 선택/첨부 |
| 필수 | 인박스 문서 첨부 | `addAttachment(kind: inbox)` + eligible filter | 거래와 맞는 문서만 첨부 가능 |
| 필수 | 파일 업로드 첨부 | `uploadSendAttachment` | 고객 전달용 추가 파일 업로드 |
| 필수 | 첨부 제거 | `removeAttachment` | 첨부 목록에서 삭제 가능 |
| 필수 | 첨부 가능/선택/불가 분류 | 요구사항: 첨부될 문서, 선택 필요 문서, 불가 문서 | 은행/보안 문서 등 불가 사유 표시 |
| 점검 | 전달 패키지 중복 | 본문 PDF + 첨부 목록 중복 표시 주의 | 고객 화면 미리보기에서 상단 정보/본문 중복 제거 |

## 11. 고객 전달 / Magic Link / 이메일

| 상태 | 기능 | 원소스 기준 | 프로토타입 체크 |
|---|---|---|---|
| 필수 | confirmed만 전달 | draft/void는 deliver 화면에서 notReady | 확정 전 고객 전달 불가 |
| 필수 | Magic Link 생성 | `createShareLink(expires_days, label, max_opens)` | 4단계 전달에서 받는 곳, 만료일, 열람 횟수 설정 |
| 필수 | 활성 링크 집계 | `shareLinkLifecycle`, usable link count | Magic Link 생성 후 생성된 갯수 표시 |
| 필수 | 링크 복사 | public URL clipboard | 생성 링크에 복사 버튼 |
| 필수 | 링크 철회 | `revokeShareLink` | 철회된 링크는 재사용 불가 |
| 추가 | 링크 삭제 | 원소스에는 삭제 API가 없고 철회만 존재 | UI에서 삭제가 필요하면 이력 보존 정책과 API 추가 필요 |
| 필수 | 링크 상태 | active/expired/maxed/revoked | 만료/열람 초과/철회 상태 표시 |
| 필수 | 이메일은 링크 필요 | mailto body에 publicUrl 포함, 링크 없으면 비활성 | 이메일 전송 전 Magic Link 필요 |
| 필수 | 받는 사람 변경 | recipient email 프리필 + 사용자 수정 필요 | 이메일 패널에서 받는 사람 수정 가능 |
| 필수 | 이메일 내용 | 원소스는 제목, 본문, 상업정보, 배송정보, 첨부 목록을 mailto에 구성 | 링크 선택 후 사용자의 메일 클라이언트로 전달 |
| 필수 | 거래별 전달 진입 | `listGeneratedDocuments(getIdToken, dealId)`로 현재 거래의 생성 문서만 조회 | 거래 상세를 이탈하지 않고 우측 전달 레이어로 표시 |
| 필수 | 문서 수별 분기 | 0개 빈 상태, 1개 즉시 전달, N개 레이어 내부 선택 | 별도 전체 문서 목록으로 이동하지 않음 |
| 필수 | 전달 컴포넌트 재사용 | `DocumentDeliverConnected`의 조회·링크·첨부·이력 계약 | 문서 상세과 거래 상세에서 같은 전달 작업 컴포넌트 사용 |
| 추가 | 실제 이메일 발송 | 원소스는 mailto handoff이며 서버 발송 API가 아님 | 앱 내부 발송이 필요하면 발송 API/실패/재시도 설계 필요 |
| 추가 | 이메일 전달 내역 | 원소스에는 앱이 확정할 수 있는 발송 성공 기록이 없음 | 실제 발송 API 도입 시 전달 내역에 합쳐 표시 |
| 점검 | 전달 체크리스트 위치 | recipient/package/link/shipment/quality | 전달 패널 상단 또는 4단계 영역 중 하나로 중복 없이 |
| 점검 | 고객 전달 액션 중복 | 상단/패널 하단 버튼 중복 금지 | 최종 액션은 한 곳으로 통일 |

## 12. 고객 공개 화면

| 상태 | 기능 | 원소스 기준 | 프로토타입 체크 |
|---|---|---|---|
| 필수 | 공개 토큰 조회 | `/share/{token}`, public documents route | 미리보기는 바텀 팝업, 공유용 링크와 구분 |
| 필수 | 링크 종료 상태 | backend `DOCGEN_LINK_GONE`: expired/open_cap/not_found | 만료/열람초과/철회 안내 |
| 필수 | 패키지 준비도 | public viewer `ReadinessStrip` | 상용 문서 준비도 표시 |
| 필수 | 핵심 신호 | 금액, 일정, 항로, 거래처, 첨부, 보안 | 상단 정보는 중복 없이 요약 |
| 필수 | 첨부 다운로드 | package/bundle route | 고객이 받을 파일 목록과 다운로드 |

## 13. 문서 목록 / 관리

| 상태 | 기능 | 원소스 기준 | 프로토타입 체크 |
|---|---|---|---|
| 필수 | 문서 검색 | 문서번호, 거래처, 일정, 상업/물류 fact 검색 | 최근 문서 테이블 검색/필터 |
| 필수 | 상태 필터 | all/draft/confirmed/sent | 전체/작성중/확정/완료 |
| 필수 | 품질 준비도 | quality score + blocking/warning + shipment hint | 작업필드 버튼 옆 또는 행 내 표시 |
| 필수 | 문서 다운로드 | row/action에서 PDF 다운로드 | 상세 이동과 다운로드 액션 충돌 금지 |
| 필수 | 문서 복제 | list에서 duplicate | 기존 문서 기반 새 초안 |

## 14. 필수 엣지케이스

| 상태 | 케이스 | 필요한 처리 |
|---|---|---|
| 필수 | API bootstrap 실패 | 재시도 버튼, 이전 상태 오염 방지 |
| 필수 | 느린 응답 race | eventId/ref guard로 늦은 응답이 현재 view 덮지 않음 |
| 필수 | 중복 클릭 | busy refs로 create/share/revoke/save/download 중복 방지 |
| 필수 | deal_id 없음 | 방향 선택부터 시작, recipient/email/deal seed 없음 |
| 필수 | deal 문서 없음 | 직접 입력 또는 파일 추가로 fallback |
| 필수 | 문서가 draft | 전달 화면 진입 시 create로 돌아가기 |
| 필수 | 문서가 void | 전달 불가 안내 |
| 필수 | quality blocking | 링크/전달/confirm 차단 |
| 필수 | missing required | confirm/share 차단 |
| 필수 | approval required | 전달 차단 및 승인 요청 |
| 필수 | share expired/maxed/revoked | 새 링크 생성 또는 상태 안내 |
| 필수 | mailto unsafe recipient | 수신자 sanitization |
| 필수 | upload invalid file | PDF 외 파일 차단 |
| 필수 | upload too large | 업로드 한도 메시지 |
| 필수 | upload too many | 한 번에 5개 초과 선택 시 전체 업로드 시작 전 차단 |
| 필수 | upload partial failure | 성공 문서는 유지하고 실패 문서만 명시, 성공 건이 있으면 목록 재조회 |
| 필수 | queue read failed | 목록을 못 읽어도 파일 올리기는 계속 가능 |
| 필수 | unknown document type | 업로드는 보존하되 거래 연결 대상이 아닐 수 있음을 안내 |
| 필수 | OCR blob missing | 실패 상태/재시도/failed job 기록 |
| 필수 | attachment deal mismatch | 첨부 불가 처리 |
| 추가 | inbound email unknown sender | 수락 금지, 관리자 확인 또는 격리 |
| 추가 | inbound email duplicate | 같은 message/file idempotency |
| 추가 | inbound email many attachments | 한 메일의 여러 첨부를 각각 문서열에 등록 |

## 15. 프로토타입 우선 보완 목록

1. 파일올리기: 이메일 자동등록 토글은 파일 올리기 박스 아래에서만 열리고, 화면을 덮거나 목록을 깨면 안 된다.
2. 파일올리기: 최근 파일 목록은 `최근 파일` 단일 헤더, 상시 세로 kebab, 선택 강조, 상태별 주 액션으로 정리한다.
3. 문서 만들기: `문서에서 찾기`는 입력창 바로 아래에 전체 폭으로 열리고 아래 콘텐츠를 자연스럽게 민다.
4. 문서 만들기: 근거 파일은 N개 선택 가능, 추출 필드 N개와 핵심값을 보여준다.
5. 문서 만들기: 템플릿 선택은 한 줄 캐러셀, 카드 선택 시 바로 시작 버튼/상태가 나타난다.
6. 문서 만들기: 최근 문서는 테이블 형태로, row 선택은 상세 이동, 작업필드 버튼은 상시 노출한다.
7. 상세 편집: 필드 패널은 스크롤 가능해야 하고 AI 검증/최근값/업로드값 라벨을 필드 단위로 표시한다.
8. 상세 편집: 품목 행, 로고, 문구 다듬기, 승인/반려는 문서 요소 완료 상태로 연결한다.
9. 전달: 원소스 범위는 Magic Link 생성·복사·철회와 mailto 연결까지다. 영구 삭제·앱 내부 발송·이메일 이력은 추가 기능으로 분리한다.
10. 공개 미리보기: 바텀 팝업은 탑 영역 제외 최소 2/3 이상 높이, 내부 고객 화면의 중복 정보 제거.

## 16. 2026-07-10 원소스 재점검 후 보완 우선순위

### P0 - 단계 진행을 틀리게 만드는 기능

1. 파일 업로드 제한을 `PDF / 최대 5개 / 파일당 50MB`로 명시하고 부분 성공·취소·중복을 각각 다른 결과로 처리한다.
2. 업로드 문서 유형별 Trigger 필드를 적용한다. 단가 하나를 모든 문서의 공통 필수값처럼 사용하지 않는다.
3. OCR이 필수 필드를 만들지 못했을 때도 검토 화면에 누락 입력행을 생성한다.
4. 거래 연결을 `기존 거래`, `신규 거래 생성`, `이미 지정된 거래` 세 경로로 분리한다.
5. 문서 생성의 확정 전 gate를 `필수값`, `품질 blocking`, `품질 warning 확인`, `불일치`, `승인`으로 구분한다.
6. 고객 전달은 confirmed 문서만 가능하고, usable Magic Link가 없으면 이메일 액션을 비활성화한다.

### P1 - 운영 중 데이터 손상을 막는 기능

1. 이미 commit된 문서를 오래된 탭에서 다시 연결하지 못하게 한다.
2. 문서/필드가 바뀐 뒤 도착한 저장·거절·commit 응답은 현재 화면에 적용하지 않는다.
3. 신규 거래 생성 후 연결 실패를 재시도할 때 거래를 중복 생성하지 않는다.
4. 미검토 OCR 문서는 새 문서 근거값으로 사용하지 않고 committed 문서만 사용한다.
5. 과거 문서에서 금액성 값을 자동 재사용하지 않는다.
6. 링크 생성·철회, 첨부 추가·업로드·삭제, PDF/번들 다운로드의 연속 클릭을 중복 실행하지 않는다.

### P2 - 화면에서 빠지기 쉬운 운영 기능

1. 중복 인보이스 번호 경고와 동일 파일 중복 업로드 경고를 별개로 표시한다.
2. 필드 confidence, source page, AI suggested/confirmed/rejected 상태를 입력행 안에서 구분한다.
3. 필드 변경 이력과 거래처 alias 학습을 접힘 영역으로 제공한다.
4. 문서 목록에서 status 외 approval/quality/shipment readiness를 검색·판단할 수 있게 한다.
5. 전달 패키지에서 생성 PDF, inbox 문서, 직접 업로드 첨부를 구분하고 첨부 제거를 지원한다.
6. 기존 Magic Link는 capability token을 다시 받을 수 없으므로 상태/열람수/마지막 열람/철회만 보여주고, 새 URL이 필요하면 새 링크를 만든다.

### 원소스 외 추가 요구로 유지할 항목

1. SES Email Forward-in과 조직 수신 주소.
2. 필드 debounce 자동 저장 및 입력 내부 저장 spinner.
3. 앱 내부 이메일 실제 발송과 성공/실패 전달 이력.
4. Magic Link 영구 삭제.
5. 취급하지 않는 품목 판정과 별도 안내 규칙.

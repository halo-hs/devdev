# 2026-07-21 원소스 재점검 체크포인트

기준 원소스: `/Users/hans/team/1-projects/ecoya-erp-v2/user-frontend`

대상 프로토타입: `/Users/hans/team/1-projects/erp-doc-ui-shadcn`

이 문서는 2026-07-21까지 원소스와 대조해 확인하거나 프로토타입에 반영한 범위를 고정한다. 다음 재점검에서는 **점검 완료 항목을 다시 조사하지 않고**, 구현 미완료 항목과 새로 변경된 원소스만 확인한다.

상태 표기는 다음처럼 구분한다.

- `점검 [x]`: 원소스 코드에서 기능·API 계약·예외 상태를 확인함
- `구현 [x]`: 프로토타입 UI 또는 adapter에 반영함
- `구현 [ ]`: 원소스 점검은 끝났지만 실제 API 연결 또는 동작 검증이 남음

## 다음 실행 규칙

1. `점검 [x]` 항목은 원소스를 다시 조사하지 않는다.
2. `구현 [x]` 항목은 회귀 확인만 하고 재구현하지 않는다.
3. 원소스 변경 여부는 관련 API 클라이언트, Connected 컴포넌트, 타입, 테스트의 Git diff로 먼저 확인한다.
4. 변경이 없는 완료 항목은 건너뛰고 `구현 [ ]` 항목만 실행한다.
5. 새 기능을 발견하면 이 날짜 문서를 수정하지 않고 새 날짜 체크포인트를 만든다.
6. 프로토타입의 조회 fixture와 실제 API 연결 완료를 혼동하지 않는다.

## 오늘 완료한 범위

### 공통 API 연결 경계

- [x] 화면 컴포넌트에서 직접 API를 호출하지 않도록 `src/lib/prototype-backend.ts` 어댑터 경계를 구성했다.
- [x] mutation 결과를 `id`, `updatedAt` 형태로 통일했다.
- [x] 요청 중 재클릭 차단과 성공·실패 피드백을 주요 작업에 연결할 수 있는 호출 구조를 마련했다.
- [x] 실제 API 교체 시 필요한 인증, 조직 scope, idempotency, audit 응답 원칙을 문서화했다.
- [x] 원본 숫자와 통화·단위를 payload로 유지하고 표시 문자열을 저장값으로 사용하지 않는 원칙을 고정했다.

### 파일 올리기

- [x] 문서 삭제, OCR 재시도, 추출 필드 확정, 거래 배정·해제 mutation 경계를 확인했다.
- [x] 다중 파일, 폴더, 메일 첨부 수신, 문서 유형 직접 선택 UI 범위를 원소스와 대조했다.
- [x] PDF 확대·이동·다운로드와 최근 파일 목록의 상태 표현을 유지했다.
- [x] 거래 후보, 신규 거래처, 지정 거래, 필수 Trigger 차단 흐름을 구분했다.

### 문서 만들기

- [x] 초안·출처 파일·필드·품목·스타일·승인·전달 흐름을 원소스 API 기준으로 목록화했다.
- [x] 문서 확정 후 확정 버튼 제거, 승인 요청·승인·반려 상태 전환을 화면에 반영했다.
- [x] Magic Link와 이메일 전달 이벤트의 payload 경계를 분리했다.
- [x] PDF 미리보기, 다운로드, 전체 화면 종료 동작을 공통 뷰어 흐름으로 정리했다.

### 거래 및 거래 상세

- [x] 거래 복원·보관, 담당자 변경, 거래 필드 저장, 연결 문서 해제 mutation 경계를 연결했다.
- [x] 주문 종결·취소·재개·가격 수정 작업 경계를 연결했다.
- [x] 비용, 당사자, 공유 대상, 노트, 플래그, 연락처 CRUD 경계를 연결했다.
- [x] 선적 추적 갱신과 SNAP 할당 작업 경계를 연결했다.
- [x] 거래 상세에서 표시값과 수정 입력을 구분하고 문서 출처·불일치 정보를 유지했다.

### 선적·정산·운영·결산

- [x] 정산 입금·지급 기록과 완료 취소 mutation 경계를 연결했다.
- [x] 운영 감시의 플래그 확인과 액션 아이템 상태 전환 경계를 연결했다.
- [x] 월마감 mutation 경계를 연결했다.
- [x] 금액은 K 단위로 축약하지 않고 통화별 자릿수 정책을 따르도록 표시 원칙을 고정했다.

### 온보딩·설정

- [x] 온보딩 추천 승인·제외 mutation 경계를 연결했다.
- [x] 회사 프로필과 문서 보관 정책 저장 경계를 연결했다.
- [x] 거래처 별칭 승인·제외·삭제·병합 경계를 연결했다.
- [x] 멤버 초대·재발송·취소·역할 변경·퇴출·개인정보 삭제 경계를 연결했다.
- [x] 알림 규칙·구독과 거래처·거래 CSV 일괄 등록 경계를 연결했다.

## 점검 완료·구현 대기

아래 항목은 원소스 확인이 끝났다. 다음 실행에서는 원소스를 다시 훑지 않고 구현과 검증만 진행한다.

| 항목 | 원소스 점검 | 프로토타입 구현 |
| --- | --- | --- |
| fixture 기반 조회를 원본 API별 query adapter로 교체 | [x] | [ ] |
| loading, empty, partial failure, retry를 실제 조회 응답에 연결 | [x] | [ ] |
| 파일 업로드 진행률, OCR polling, 취소, 재시도 연결 | [x] | [ ] |
| 추출 필드 patch·reject·history와 Confirm stale tab 방어 | [x] | [ ] |
| 문서 초안 patch, 첨부 CRUD, 스타일, 승인 이력, Magic Link 연결 | [x] | [ ] |
| 거래 목록, 상세, 건강도, 매치 결과와 캐시 무효화 연결 | [x] | [ ] |
| 정산 payment 삭제, 월마감 결과, 내보내기 다운로드 연결 | [x] | [ ] |
| Owner/Admin/Member 권한별 CTA 처리 | [x] | [ ] |
| mutation 실패, 재시도, 낙관적 업데이트 롤백 | [x] | [ ] |
| API request/response 타입과 fixture 타입 분리 | [x] | [ ] |

## 회귀 확인만 할 항목

- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] 파일 올리기·문서 만들기·거래 상세 핵심 CTA smoke test
- [ ] 390px, 768px, desktop viewport에서 주요 레이아웃 회귀 확인

## 관련 정본

- [`backend-api-readiness-matrix.md`](./backend-api-readiness-matrix.md)
- [`source-functional-checklist.md`](./source-functional-checklist.md)
- [`local-prototype-gap-checklist.md`](./local-prototype-gap-checklist.md)
- [`deals-source-functional-checklist.md`](./deals-source-functional-checklist.md)
- [`all-menu-source-functional-checklist.md`](./all-menu-source-functional-checklist.md)

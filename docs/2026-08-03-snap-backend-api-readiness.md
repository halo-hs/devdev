# SNAP 백엔드 API 연결 준비 점검

기준일: 2026-08-03

## SSOT

- 화면·기능 원본: `/Users/hans/team/1-projects/ecoya-snap-v2/frontends/ecoya-web`
- Go API 원본: `/Users/hans/team/1-projects/ecoya-snap-v2/apps/snap-backend`
- 라우트 SSOT: `/Users/hans/team/1-projects/ecoya-snap-v2/apps/snap-backend/internal/httpapi/routes.go`
- 현재 prototype: `/Users/hans/team/1-projects/erp-doc-ui-shadcn`

문서 설명이나 과거 캡처보다 위 소스의 route, payload, 상태 전이를 우선한다.

## 이번 반영 범위

- `src/lib/snap-api.ts`: 인증이 필요한 관리자·작업자 API의 단일 호출 경계. 가입·초대,
  조직·멤버, 카탈로그·과금, AI, 작업·증거, 리포트, 운영, 보존·삭제, ERP handoff를
  원본 route 단위로 제공한다.
- `src/lib/snap-report-api.ts`: 승인, 고객 전달, 공개 열람, 외부 업로드, 무결성 검증
- `src/lib/snap-runtime.ts`: 인증 SDK를 직접 의존하지 않는 런타임 주입 경계. 프로토타입은
  저장된 access/id token을 읽고, 실제 앱은 Firebase `getIdToken(forceRefresh)` 또는 동일
  형태의 provider를 `registerSnapAuthProvider()`로 등록한다.
- `src/lib/snap-adapters.ts`: 배열·`items`·`data`·`results` 응답을 공통 page model로 바꾸는
  DTO 정규화 경계. 화면이 백엔드 응답 키에 직접 의존하지 않게 한다.
- `.env.example`: Go backend `8086` 연결과 공개 화면 smoke test 환경 변수
- SC-12~16: 외부 업로드, 고객 view, 링크 만료·취소·비밀번호·재발급, 동의, 확인,
  이의제기, PDF·증거 다운로드, integrity verify 상태
- SC-21~23: 승인과 전달을 분리하고, pre-send gate·링크 lifecycle·전송 실패 재시도를
  실제 API 계약에 맞춤

## 화면 범위별 연결표

| 화면              | 읽기                                                         | 쓰기                                       | 필수 상태                                 |
| ----------------- | ------------------------------------------------------------ | ------------------------------------------ | ----------------------------------------- |
| SC-10 온보딩      | auth/me, org/settings, branding, members                     | org settings, logo, invite                 | 조직 승인 대기, 권한 거부, 부분 저장 재개 |
| SC-12 작업자 실행 | public typed link, instruction, checklist                    | presign, finalize, quality ack, submit     | 만료, 취소, quota, 429, 부분 성공         |
| SC-13 외부 업로드 | public typed link                                            | presign, PUT, finalize, partial submit     | 다중 파일, 개별 재시도, 입력 보존         |
| SC-14 고객 보기   | customer package, dispute                                    | consent, acknowledge, dispute, request-new | 비밀번호, 만료, 다운로드 제한, 이의제기   |
| SC-15 무결성      | integrity hash                                               | 없음                                       | 확인됨, 찾을 수 없음, 서버 실패           |
| SC-17 대시보드    | ops overview, tasks, reports                                 | 없음                                       | 로딩, 빈 상태, 부분 실패                  |
| SC-18 작업 목록   | tasks                                                        | pin/unpin repeat source                    | cursor, filter race 방지, 권한 범위       |
| SC-19 작업 생성   | schemas, customers, repeat sources                           | draft, clarify, scope-confirm, confirm     | AI draft와 human instruction 분리         |
| SC-20 작업 상세   | task, activity, media, report workspace                      | assign, outcome, office decision           | draft, active, submitted, review, done    |
| SC-21 고객 리포트 | reports, customer package                                    | create, correct, sign                      | 수정 중 입력 보존, 새 version 생성        |
| SC-22 리포트      | reports, approval workbench, AI trust                        | approve, reject, route, share link         | 승인 전 전달 차단, 재전송, 영구 실패      |
| SC-23 증거        | media, analysis, capture summary                             | confirm, reject, conflict resolve          | 원본/워터마크 구분, 품질 경고             |
| SC-24~30          | customers, folders, ERP handoff, workers, corrective actions | 각 CRUD·상태 전이                          | archive, audit, empty, retry              |
| SC-31~37          | ops overview, tenants, signups, AI usage, billing            | approve, suspend, retry, credit adjust     | platform role 별도 강제                   |
| SC-38~44          | field-start draft, worker task, manager action               | accept worker work, office decision        | 모바일, offline conflict, recapture       |

## 업로드 규칙

1. 최대 파일 수와 파일당 크기를 선택 전에 검증한다.
2. 각 파일에 대해 presign은 한 번 수행한다.
3. 같은 `media_id`로 PUT과 finalize를 최대 3회 재시도한다.
4. 네트워크 오류, HTTP 429, 5xx만 자동 재시도한다.
5. finalize의 `media_not_pending_upload`는 멱등 성공으로 처리한다.
6. 성공 파일과 실패 파일을 분리하며 실패한 `File` 객체를 유지한다.
7. 일부만 제출할 때 `submit_partial`과 `partial_reason`을 기록한다.
8. 402/quota, 410/dead link, 413/file size, upload limit은 자동 재시도하지 않고 해결 행동을 안내한다.
9. 작업·외부 증거 파일은 presign 응답의 `upload_url`, `method`, `headers`를 그대로 사용해
   파일 원시 바이트를 PUT한다. 로컬 저장소의 `token` query도 `upload_url`에 포함되므로
   클라이언트가 다시 조립하지 않는다.
10. 조직 로고는 multipart가 아니라 `{ data: base64DataUrl, mime }` JSON으로 전송한다.

## 인증과 보안

- 운영: `Authorization: Bearer <token>`을 공통 요청 경계에서 주입한다.
- 로컬: 원본 backend가 허용할 때만 `X-Org-Id`, `X-User-Id`, `X-Role` seed header를 사용한다.
- 공개 링크: 세션 cookie를 보내지 않고 capability-scoped token과 선택적 `X-Share-Password`만 사용한다.
- `X-Lang`과 query `lang`을 함께 보내 원본 i18n fallback 계약을 유지한다.
- 고객 공개 파일은 watermarked media만 제공하고 내부 original blob URL을 노출하지 않는다.
- production build에서는 `VITE_SNAP_ALLOW_DEV_HEADERS=1`을 금지한다.
- 인증 provider는 `(forceRefresh?: boolean) => token` 계약이다. 401이면 같은 요청과 같은
  `Idempotency-Key`로 token을 한 번 강제 갱신한 뒤 정확히 한 번만 재시도한다.
- 모든 POST mutation은 공통 경계에서 멱등 키를 자동 생성한다. 업로드 finalize처럼 자체
  재시도가 있는 요청은 첫 시도에서 만든 키를 모든 재시도에 재사용한다.
- `FormData`에는 `Content-Type: application/json`을 붙이지 않아 브라우저가 multipart
  boundary를 생성하도록 한다.

## 원본 route 대조 결과

`routes.go`의 224개 route 중 health/ready, console, Paddle webhook, 개발 전용 로그인을 제외한
217개 고객 제품 API를 다음 클라이언트 그룹으로 전부 노출했다.

| 원본 도메인                                     | 프론트 경계                                     |
| ----------------------------------------------- | ----------------------------------------------- |
| auth, org members, invite, plan                 | `snapApi.auth`, `session`, `organization`       |
| markets, schemas, templates, profiles           | `snapApi.catalog`                               |
| checkout, credit                                | `snapApi.billing`                               |
| AI intent, media, report, risk, routing, budget | `snapApi.ai`                                    |
| task draft부터 office review까지                | `snapApi.tasks`                                 |
| upload, quality, analysis, watermark, conflict  | `snapApi.media`                                 |
| report CRUD, approval, findings, delivery       | `snapApi.reports`, `snapReportApi`              |
| typed/public/legacy share link                  | `snapApi.links`, `legacyShare`, `snapReportApi` |
| customer, notification, device                  | `snapApi.customers`, `notifications`, `devices` |
| retention, deletion request                     | `snapApi.privacy`, `organization`               |
| ops, tenant, signup, failure retry              | `snapApi.operations`                            |
| folder, library                                 | `snapApi.folders`                               |
| linkage, handoff, allocation                    | `snapApi.erp`                                   |

`/health`, `/ready`, `/console`, Paddle webhook, 개발 전용 로그인은 앱 화면의 업무 API가
아니므로 클라이언트에서 의도적으로 제외한다. 로컬 스토리지 업로드와 구형 `/share`
호환 API는 운영 기본 경로가 아니지만 회귀 확인을 위해 별도 메서드로 보존한다.

## 상태 정합성

- Task: `draft → human_confirmed → assigned/active → submitted → office_review → approved`
- Report: `draft/review → approved → sent`; reject/correct는 새 검토 version을 만든다.
- Share link: `active → expired | revoked | exhausted`; 링크 상태와 이메일 delivery 상태를 섞지 않는다.
- Media: `pending_upload → uploaded → analyzed → confirmed | rejected`; 원본과 파생본을 구분한다.
- 오류는 상단 메시지뿐 아니라 실패한 파일, 필드, 전달 채널 위치에 함께 표시한다.

## 백엔드 연결 작업 순서

1. `VITE_SNAP_API_BASE_URL=http://127.0.0.1:8086` 설정
2. 로그인 provider에서 `registerSnapAuthProvider((forceRefresh) =>
firebaseIdToken(forceRefresh))` 등록. 현재 prototype은 `configureSnapRuntime()`이
   local/session storage token을 읽고, 개발 환경에서만 seed header fallback을 허용한다.
3. route loader에서 fixture 대신 `snapApi` read method 호출
4. 화면 mutation을 동일 도메인의 `snapApi` method로 교체
5. 서버 DTO를 화면 view model로 변환하는 adapter를 feature별로 추가
6. query 취소 또는 request id로 오래된 응답 덮어쓰기를 차단
7. fixture DTO를 화면 view model로 바꾸는 adapter에서 null, unknown enum, 긴 문자열을
   보존하고 화면 표시용 값으로 원본 값을 덮어쓰지 않는다.
8. 원본 backend contract test와 prototype Playwright flow를 함께 실행

## 남은 작업과 완료 정의

- [x] 원본 route 기준 API client 경계 생성
- [x] 공개 고객 view·전달·외부 업로드·integrity API 연결 가능 상태
- [x] 다중 업로드 재시도·부분 제출·오류 보존 규칙 반영
- [x] 관리자·작업자·Platform Ops 전체 업무 route를 호출할 domain method 제공
- [x] 401 token refresh 1회, POST 멱등성, multipart header, blob download 공통 처리
- [ ] fixture read model을 실제 response adapter로 교체
- [x] public list response adapter와 인증 provider 주입 경계 추가
- [ ] Firebase 또는 운영 identity provider token을 앱 bootstrap에서 등록
- [ ] backend 실행 상태에서 CORS, auth, upload storage 통합 smoke test
- [ ] public link와 manager approval의 실제 종단 Playwright test

백엔드 연결 완료의 기준은 화면에 데이터가 보이는 것만이 아니다. 로딩, 빈 상태, 권한 거부,
재시도 가능 실패, 영구 실패, 중복 요청, 만료 링크, 부분 업로드까지 서버 응답으로 재현되고
사용자 입력이 실패 후에도 보존되어야 한다.

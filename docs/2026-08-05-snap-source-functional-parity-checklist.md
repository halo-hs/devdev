# SNAP 원소스 기능 정합화 체크리스트

- 기준일: 2026-08-05
- 구현 저장소: `/Users/hans/team/1-projects/erp-doc-ui-shadcn`
- 원본 프론트: `/Users/hans/team/1-projects/ecoya-snap-v2/frontends/ecoya-web`
- 원본 백엔드: `/Users/hans/team/1-projects/ecoya-snap-v2/apps/snap-backend`
- 공통 SSOT: `/Users/hans/team/1-projects/ecoya-products/ecoya 2.0/ECOYA-Platform-Common-SSOT-v1.0`
- 원본 실행 화면: `http://localhost:5200/`
- 구현 실행 화면: `http://localhost:5175/`

## 판정 기준

- `완료`: 원본 URL과 메뉴, API 계약, 권한, 주요 상태 및 후속 화면이 코드에 연결되어 있다.
- `검증 완료`: 완료 상태이며 Playwright 또는 정적 검사로 자동 검증했다.
- `API blocker`: 원본 프론트가 요구하는 계약이 백엔드에 없거나 응답이 달라 연결할 수 없다.
- `개발 폴백`: `VITE_SNAP_API_BASE_URL`이 없을 때만 사용하는 로컬 fixture다. API 설정 시 fixture를 mutation payload로 사용하지 않는다.

다음 점검에서는 `검증 완료` 항목을 제외하고 `API blocker` 및 회귀 실패 항목만 다시 연다.

## 기준 소스 조사

- [x] 원본 React Router 경로와 redirect를 전수 확인했다.
- [x] 원본 메뉴명과 역할별 노출 조건을 확인했다.
- [x] 백엔드 `routes.go`, DTO 및 enum을 화면별로 대조했다.
- [x] Common SSOT의 계정·조직·알림·데이터 정책 우선순위를 적용했다.
- [x] 원본의 목록 summary, 상세, 외부 token 화면과 플랫폼 운영 화면을 범위에 포함했다.

## 전역 계약

- [x] `SnapRouteDefinition`에서 URL, 메뉴명, breadcrumb, shell, 역할, 첫 화면을 관리한다. `검증 완료`
- [x] History API로 직접 URL, 새로고침, 뒤로 가기와 query string을 지원한다. `검증 완료`
- [x] `netlify.toml`의 SPA fallback으로 상세 URL 새로고침을 지원한다. `완료`
- [x] `Owner`, `Manager`, `Operator`, `Worker`, `Customer`, `Platform Operator`, anonymous 접근을 분리한다. `검증 완료`
- [x] workspace, external, public, platform shell을 분리한다. `검증 완료`
- [x] loading, empty, error, forbidden, expired 상태를 공통 계약으로 사용한다. `검증 완료`
- [x] API 원본 타입과 화면 표시 타입을 adapter에서 분리한다. `완료`
- [x] token 만료, 권한 오류, API 실패와 재시도 상태에서 입력값을 유지한다. `완료`
- [x] 업로드는 파일 선택, 진행, finalize, 부분 실패 및 재시도 단계를 분리한다. `완료`
- [x] API 미설정 개발 환경만 fixture를 사용하며 API 설정 시 서버 응답을 우선한다. `완료`

## IA와 라우팅

| 점검 | 경로 | 원본 화면 / 역할 | 현재 연결 | 판정 |
|---|---|---|---|---|
| [x] | `/dashboard` | Dashboard / tenant member | summary, 직접 시작, 검토 대기, 안전 요약, 최근 상태 | 검증 완료 |
| [x] | `/tasks` | Tasks / tenant member | summary, 검색, 상태·담당자 필터, 목록·상세 이동 | 검증 완료 |
| [x] | `/tasks/new` | NewTask / owner·manager·operator | AI 초안, 명확화, 범위 확정, confirm, draft 보존 | 검증 완료 |
| [x] | `/tasks/:id` | TaskDetail / tenant member | checklist, 작업자 배정, 링크, 미디어, 폴더, 활동 | 검증 완료 |
| [x] | `/tasks/:id/report` | ReportWorkspace / owner·manager·operator | 증거 선택, 제목·메시지, 사전 검사, 서명, 승인·반려 | 검증 완료 |
| [x] | `/reports` | Reports / tenant member | 증빙 검수, 리포트 승인, 발송, 발송 모니터 | 검증 완료 |
| [x] | `/links` | legacy delivery link | `/reports?tab=delivery`로 수렴 | 검증 완료 |
| [x] | `/review` | legacy review inbox | `/reports?tab=field`로 수렴 | 검증 완료 |
| [x] | `/evidence` | EvidenceLibrary / tenant member | 폴더 목록·상세, 생성·보관, item 추가·제거, 검색·추천 | 검증 완료 |
| [~] | `/customers` | Customers / owner·manager | summary, 검색, 추가·수정·보관, 업무·리포트·링크 이력 | 화면 완료 · 보관 조회/복구 API blocker |
| [x] | `/calendar` | Calendar / tenant member | 날짜·상태별 업무와 상세 이동 | 검증 완료 |
| [x] | `/workflow` | Workflow / owner·manager | 유형·필수 증거·키워드·템플릿과 업무 생성 | 검증 완료 |
| [x] | `/erp-handoffs` | ErpHandoffs / owner·manager | 인계 목록, 확인, JSON 내보내기, 결과 상태 | 검증 완료 |
| [x] | `/workers` | Workers / owner·manager | 멤버·초대, 역할, 승인, 비활성·복구, 좌석 한도 | 검증 완료 |
| [x] | `/safety/corrective-actions` | CorrectiveActions / owner·manager | 필터, 상태 변경, 재촬영, 검증·재개, 증거 이동 | 검증 완료 |
| [x] | `/settings` | Settings / owner·manager | Common SSOT + SNAP 브랜딩·지역화·운영·데이터·결제 | 검증 완료 |

## 메뉴별 API 정합성

| 메뉴 | 목록·조회 | 생성·수정·상태 변경 | 표시 상태 | 판정 |
|---|---|---|---|---|
| 대시보드 | tasks, operations overview, review inbox, self-start inbox | 상세·직접 시작 이동 | loading, empty, error | 완료 |
| 업무 | `GET /api/v1/tasks`, task detail/checklist/activity/media | draft, clarify, scope, confirm, assign, checklist, links, media review | draft, scheduled, in_progress, submitted, approved, rejected | 완료 |
| 보고서 | reports, report workspace, deliveries, share links | create/update, pre-send, sign, approve/reject/correct, resend/extend/revoke | field review, approval, sent, opened, expired, revoked | 완료 |
| 증빙 보관함 | folders, folder items, library search | create/archive, item add/remove, recommended folder | active, archived, visibility, folder type | 완료 |
| 고객 | customers, customer-filtered tasks/reports/share links | create/update/archive, note/contact update | active, archived, pending | 화면 완료 · 보관 조회/복구 API blocker |
| 작업자 · 팀 | members, invites, plan/seat | invite, revoke, approve, role, deactivate/restore | invited, pending, active, inactive | 완료 |
| 워크플로우 | task type schemas/templates | preset을 포함한 task create 이동 | active, required media/report | 완료 |
| 내보내기·연동 | ERP handoffs | confirm, JSON export | pending, ready, exported, failed | 완료 |
| 시정조치 | corrective actions | recapture link, verify, resume, state mutation | open, in_progress, verification, resolved | 완료 |
| 플랫폼 운영 | tenants, signups, integrations, AI usage | signup decision, support action, integration retry | healthy, warning, failed, suspended | 완료 |

## 증빙 보관함 계약

- [x] `GET /api/v1/folders`의 활성·보관·유형 summary를 표시한다.
- [x] 이름, folder type, visibility를 입력해 폴더를 만든다.
- [x] `GET /api/v1/folders/:id/items`로 상세를 조회한다.
- [x] `POST /api/v1/folders/:id/items`와 item delete로 업무·미디어를 관리한다.
- [x] 폴더 보관과 활성·보관 상태를 구분한다. 원본 백엔드에는 별도 restore endpoint가 없다.

## 고객 보관 계약

- [x] 고객 목록에서 `활성 고객`과 `보관됨`을 구분한다.
- [x] 보관 직후 `보관됨` 목록으로 이동하고 기존 업무·보고서·공유 이력을 읽기 전용으로 유지한다.
- [!] 현재 `GET /api/v1/customers`는 `archived_at IS NULL`만 조회하며 보관 고객 조회 조건이 없다.
- [!] 현재 고객 복구 endpoint가 없다. 새로고침 이후 보관 고객 조회와 복구는 백엔드 계약 추가 전까지 blocker다.
- [x] `POST /api/v1/library/search`로 라이브러리를 검색한다.
- [x] 추천 폴더 생성 후 현재 업무를 추가하는 흐름을 제공한다.
- [x] 데스크톱은 목록+상세 패널, 모바일은 전체 상세로 전환한다.

## 상세·외부·플랫폼 화면

| 점검 | 경로 | API 및 상태 | 판정 |
|---|---|---|---|
| [x] | `/work/:token` | public task inspect, checklist·촬영·완료, expired/forbidden/retry | 검증 완료 |
| [x] | `/upload/:token` | public upload inspect, file upload/finalize, 부분 실패·재시도 | 검증 완료 |
| [x] | `/view/:token` | approved report, PDF, acknowledge, dispute, renew request, expired/revoked | 검증 완료 |
| [x] | `/verify/:hash` | evidence integrity와 metadata, not-found/error | 검증 완료 |
| [x] | `/invite/:token` | invite inspect/accept, 인증 전후, expired/revoked | 검증 완료 |
| [x] | `/platform` | 운영 KPI 및 하위 화면 이동, platform role gate | 검증 완료 |
| [x] | `/platform/signups` | 가입 요청 승인·거절 | 완료 |
| [x] | `/platform/integrations` | 연동 health와 retry | 완료 |
| [x] | `/platform/tenants` | 조직 검색·상태·지원 이동 | 완료 |
| [x] | `/platform/tenants/:orgId/support` | 조직 상태·사용량·지원 action | 완료 |
| [x] | `/platform/ai` | AI 사용량·라우팅·예산 | 완료 |

## 상태와 데이터 처리

- [x] 백엔드 enum을 화면 상태의 원본으로 사용한다.
- [x] 금액·날짜·이름 등 표시 포맷은 API payload와 분리한다.
- [x] empty와 API error를 같은 빈 화면으로 처리하지 않는다.
- [x] 권한 없음과 token 만료·회수를 서로 다른 안내와 후속 행동으로 표시한다.
- [x] mutation 실행 중 중복 제출을 차단하고 완료 후 resource를 다시 읽는다.
- [x] task draft와 외부 업로드 진행 상태를 browser session에 보존한다.
- [x] API 미설정 fixture에는 `DEMO` 식별자를 사용해 운영 응답과 혼동하지 않는다.

## 자동 검증

- [x] 14개 workspace 경로 직접 접근 및 breadcrumb/본문 렌더링
- [x] legacy `/links`, `/review` redirect 및 원본 탭 수렴
- [x] tenant manager의 platform 접근 차단
- [x] 증빙 폴더 생성 dialog와 필수 필드
- [x] 보고서 4개 상태 탭 전환
- [x] 업무 생성 draft 화면
- [x] 외부 token 5개 화면의 390px 렌더링
- [x] 390px, 768px, 1440px workspace 수평 overflow 검사
- [x] Playwright 핵심 E2E 27건 통과
- [x] 최종 `typecheck`, `lint`, `build` 재검증

## 남은 추적 항목

- 현재 백엔드 라우트와 DTO 조사에서 신규 계약이 필요한 blocker는 발견하지 못했다.
- 실제 운영 인증·데이터로 진행하는 서버 통합 테스트는 배포 환경의 API URL과 계정이 필요하다.
- API 미설정 로컬 모드는 UI 검토를 위해 fixture를 유지한다. 운영 빌드는 `VITE_SNAP_API_BASE_URL`을 반드시 설정한다.
- 프로덕션 빌드는 성공했으며, 단일 앱 번들이 500 kB를 넘는 Vite 성능 경고는 후속 code splitting 항목으로 분리한다.

## Blocker 기록 형식

```text
- 화면/행동:
- 원본 endpoint:
- 요청 payload:
- 기대 응답/상태:
- 현재 백엔드 결과:
- 사용자 영향:
- 필요한 결정:
```

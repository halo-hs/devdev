# ERP 원본 → 디자인 소스 → SSOT 실행 계획

## 목표와 작업 조건

`http://localhost:3030/erp/documents`의 현재 구현과 API 계약을 확인하고, 디자인 저장소의 기능·상태·동선을 먼저 동기화한 뒤 검증된 내용을 Products SSOT에 반영한다.

- 사용자 지정 원본: `http://localhost:3030/erp/documents`.
- 원본 실행 저장소: `/Users/hans/orca/workspaces/ecoya-platform-user-frontend/로컬에서띄우기`.
- 디자인 소스: `/Users/hans/team/1-projects/erp-doc-ui-shadcn`.
- 디자인 앱: `https://devdev-e6t.pages.dev/erp/`.
- 디자인 HTML 자료: `https://devdev-e6t.pages.dev/html/erp/` 및 `public/html/erp/`.
- SSOT: `/Users/hans/team/1-projects/ecoya-products/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/`.
- **커밋은 사용자 명시 요청 전까지 실행하지 않는다.** 현재 수정·스테이징·미추적 파일을 보존한다. 푸시·배포·외부 디자인 파일 갱신은 이번 로컬 검증과 구분한다.
- 사용자 중지 요청이 오면 실행을 멈춘다. 목표를 충족한 경우에는 검증 결과를 보고한다.
- **UI 구조 보호:** 홈 드래그앤드롭·모듈 배치, 문서 만들기, 문서 올리기, 거래 상세는 기존 UI 구조와 동선을 유지한다. 해당 구조 안에서 기능·상태·계약·오류 복구만 수정한다. 선적·정산·모니터링·영업성과는 필요 시 구조를 변경할 수 있다.

## 실행 순서와 통과 조건

| 단계 | 작업 | 다음 단계 진입 조건 |
|---|---|---|
| 1. 기준 고정 | 실행 프로세스의 저장소, HEAD, 미커밋 범위, API 계약 pin, 배포 자료를 기록 | 원본·프로토타입·정적 자료·SSOT의 출처 구분 |
| 2. API 진단 | 목록·상세·작성·저장·확정·전달의 호출, 인증, 응답 및 오류 확인. mock/fixture와 실제 백엔드 증거 구분 | 실패 원인과 영향 범위, 미검증 쓰기 동작을 명시 |
| 3. 화면 대조 | 원본 동작과 디자인 앱/로컬 소스의 필드·상태·행동·권한·복구 대조 | 차이마다 코드 근거와 조치 기록 |
| 4. 소스 우선 수정 | 확인된 기능·상태 누락을 디자인 TSX/도메인 모듈에 반영. 원본에 실제 누락된 BFF 연결을 복구하고, 디자인의 prototypeBackend 구조는 유지 | 관련 회귀 검증과 빌드 통과 또는 기존 실패와 변경 실패 분리 |
| 5. 디자인 산출물 검증 | ERP 정적 화면·상태와 기존 캡처 슬롯을 재생성하여 링크·렌더·원본 동작 의미 대조 | 로컬 소스/HTML과 배포 상태를 각각 기록 |
| 6. SSOT 갱신 | 확인된 변경을 정책 → 공통 흐름 → 화면 순으로 필요한 문서에 반영, 가까운 README 및 개발 근거 연결 | 미검증 구현을 확정 사실로 적지 않고 관련 상대 링크 유효 |
| 7. 결과 정리 | 변경 파일, 근거, 테스트, 미해결 API/배포 차이 보고 | 커밋 없이 검토 가능한 diff와 증거 제공 |

## 전체 실행 범위

원본 `/erp/documents`는 **발행 문서 목록**이다. 업로드 목록과 혼동하지 않는다.

1. 발행 문서 목록·검색·상태 필터·페이지·작성 재개·PDF·복제·삭제·고객 전달.
2. 문서 작성·검토·확정·승인·전달과 관련 오류 복구.
3. 연결되는 수신 문서 업로드·필드 검토·거래 연결.
4. 직접 영향받는 거래/정산 표시와 SSOT 공통 흐름.

사용자가 전체 범위 실행을 확정했다. 위 문서 흐름부터 시작하여 홈·거래 목록/상세·선적·정산·모니터링·결산 리포트·영업성과·AI·거래처·설정·지원 등 원본/디자인 ERP 메뉴 전체를 인벤토리화하고 점검한다. 중간 단계에서 완료로 종료하지 않는다. 새로운 정책 결정이 필요한 차이는 승인된 정책과 구현 불일치로 구분한다.

## 초기 조사 결과 (2026-09-19 KST)

| 확인 항목 | 관측 | 판정 |
|---|---|---|
| 원본과 디자인 앱 | 두 URL 모두 HTTP 200 | 페이지 접근 가능; 전체 기능 정상 판정은 아님 |
| 원본 HEAD | `e7eb2d42` 및 기존 로컬 변경 | 커밋 근거와 작업 폴더 근거를 분리 |
| 원본 계약 pin | `5ce8126a1031fb969bf4df196a3d21bf118e37fc` | 실제 실행 백엔드 SHA는 추가 확인 필요 |
| 원본 브라우저 조회 | `me`, `entitlements`, `trade/docs`, `generated-documents`, `document-templates`, 연결 거래 조회 200 | 해당 브라우저 세션의 조회 성공; 실 DB/OCR/저장 증거는 별도 |
| 최근 방문 경로 기록 | `PUT /api/platform/me/products/TRADE_OS/route` 401 | 재현됨; 업무 문서 조회 실패와 분리해 원인 추적 |
| 비인증 curl 조회 | `me`, `trade/docs`, `generated-documents` 401 | 인증 없는 요청 결과; API 단절로 단정하지 않음 |
| 디자인 ERP | `prototypeBackend`와 localStorage 사용, 첫 `/erp/` 방문에서 업무 API 요청 없음 | 현재 프로토타입 동작. 서버 연결이 끊겼다고 단정하지 않음 |
| 디자인 자료 manifest | 로컬과 배포 `/html/erp/manifest.json` 일치. 615페이지, 생성 `2026-09-18T13:47:01.503Z`, 표기 commit `bde1327` | manifest 일치가 모든 HTML/실행 앱 일치를 보증하지 않음 |
| 디자인 현재 HEAD | `7b23448` 및 다수 기존 로컬 변경 | manifest의 commit과 분리하여 비교 필요 |
| 업로드 정적 HTML | redirect를 따라간 배포 응답과 로컬 `document-upload.html` 바이트 일치 | 해당 파일 일치 확인. 다른 화면은 별도 검증 |

`/erp/manifest.json`은 SPA fallback HTML이므로 자료 검증에 쓰지 않는다. 실제 자료 경로는 `/html/erp/manifest.json`이다. HTML redirect는 최종 응답을 따라가서 비교한다.

## 검증 방법

- 브라우저에서 실제 화면 진입과 네트워크 상태, 정상/빈값/오류/권한 상태를 확인한다.
- 원본 API 클라이언트·BFF·OpenAPI와 디자인 구현을 액션별로 대조한다.
- 변경에 직접 해당하는 Playwright 테스트를 실행한다. 후보: `tests/erp-source-sync.spec.ts`, `tests/erp-document-workspace.spec.ts` 및 발행 문서 테스트.
- TypeScript 포함 `npm run build`로 검증한다. 실행 전에 기존 작업을 덮어쓰는 생성 스크립트 영향 범위를 확인한다.
- HTML 변경 시 `node scripts/check-handoff-refresh.mjs` 및 영향 화면 렌더를 확인한다.
- Products 문서 갱신 후 상대 링크·README 역참조·승인 정책 충돌·`git diff --check`를 검사한다.
- fixture/localStorage 검증을 실제 서버 저장·OCR·메일 발송 검증으로 표시하지 않는다.

## 진행 기록

- [x] Goal 생성, 출처 식별, 초기 접근·API·프로토타입 구분.
- [x] API 실패 원인과 42개 원본 경로/화면별 차이표 작성.
- [x] 원본 BFF·디자인 소스 수정, 원본 전체 테스트/lint/build, 디자인 ERP 회귀/build 통과.
- [x] ERP HTML 636개·PNG 93개 갱신, local links 103,117개 오류 0, source/HTML/capture 지문 일치.
- [x] SSOT QA 및 색인 갱신·독립 정책 리뷰 완료.
- [x] 최종 diff·상대 링크·독립 리뷰·실행 결과 정리. [전체 결과](./erp-source-design-audit-2026-09-19.md).

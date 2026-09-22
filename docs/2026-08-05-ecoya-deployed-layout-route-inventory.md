# ECOYA 배포 레이아웃·라우트 인벤토리

- 작성일: 2026-08-05
- 상태: 공통 UI 구현 1단계와 함께 유지하는 실행 인벤토리
- 기준: `https://grow-world.netlify.app/dp`, 실제 배포 경로, 제품 원본 코드

## 목적

이 문서는 공통 디자인 시스템이 제품 화면을 제한하지 않도록, 배포되어 이미 검증된 레이아웃과 현재 제품 라우트의 관계를 기록한다. 화면을 새로 복제하는 문서가 아니라, 어떤 기반 동작을 `@ecoya/ui`로 추출하고 어떤 구성은 제품 코드에 남길지 결정하는 기준이다.

## 현재 구현 연결

| 제품·경로 | 화면 성격 | 현재 레이아웃 소유권 | 공통 기반 연결 | 다음 확인 |
| --- | --- | --- | --- | --- |
| `/` · `/home` | Trade OS 오늘 할 일 | 제품 조합 | 공통 shell, `PageFrame` | 첫 viewport와 질문/업무 시작 우선순위 |
| `/inbox` | 문서 유입·필드 확인 | 제품 조합 | 공통 shell, 상태 계약 후보 | 3단 workspace scroll boundary |
| `/create` | 문서 만들기 | 제품 조합 | shadcn primitive, 공통 token | 입력 보존과 상세 상태 |
| `/deals` · `/deal` | 거래 목록·상세 | 제품 조합 | 공통 shell, page scroll | breadcrumb와 상세 작업 panel |
| `/settlement` · `/reports` · `/sales` | 리포트·성과·정산 | 제품 조합 | 공통 token, table/chart primitive | 숫자 표시·필터·대량 데이터 |
| `/snap/dashboard` | SNAP dashboard | 제품 조합 | 공통 shell, `PageFrame` | 원본 summary와 loading skeleton |
| `/snap/tasks` · `/snap/tasks/:id` | 업무 목록·업무 상세 | 제품 조합 | 공통 shell, state contract 후보 | 목록 summary와 상세 후속 행동 |
| `/snap/evidence` | 증빙 보관함 | 제품 조합 | 공통 shell, split layout 후보 | 폴더 생성·보관·복구·상세 패널 |
| `/snap/customers` | 고객 목록·상세 | 제품 조합 | 공통 shell, split layout 후보 | 고객 보관과 전달 이력 |
| `/snap/calendar` | 캘린더 | 제품 조합 | 공통 token | 단계색·hover·모바일 전환 |
| `/snap/workflow` | 업무 표준 워크플로우 | 제품 조합 | 공통 token | 원본의 목록·상세 팝업 구조 |
| `/snap/workers` | 작업자·작업 매니저 | 제품 조합 | 공통 shell, table primitive | 가입 요청·승인·역할 상태 |
| `/snap/reports` | 고객 보고서 | 제품 조합 | document layout 후보 | 사진 가변 grid·고객 메시지·외부 link |
| `/work/:token` · `/upload/:token` | 외부 작업·업로드 | 제품 조합 | 외부 viewer 상태 후보 | 만료·재개·업로드 결과 |
| `/view/:token` · `/verify/:hash` | 외부 보고서·증거 검증 | 제품 조합 | document layout 후보 | 계정 없는 접근·회수·인쇄 |
| `/settings` | 공통 설정 | 공통 shell + 제품 section | 공통 token, page scroll | 고정 top, sidebar, 공통/SNAP/ERP 구획 |

## 원칙

1. `@ecoya/ui`는 token, primitive, layout 동작, 공통 상태만 소유한다.
2. 업무·거래·증거·보고서 의미와 API mutation은 제품 코드에 남긴다.
3. `/dp`에 이미 존재하는 레이아웃을 새 pattern으로 다시 발명하지 않는다.
4. 동일한 화면 모양이 아니라 동일한 사용자 문제와 상태 처리를 세 번 이상 확인한 경우에만 추출한다.
5. 상세 화면은 목록의 축소판이 아니므로, 제품별 full-page·drawer·split 선택을 허용한다.

## 구현 1단계 확인 항목

- [x] 공통 token alias를 `@ecoya/ui/tokens.css`로 추가했다.
- [x] Trade OS와 SNAP 앱 셸이 공통 shell 치수 token을 소비한다.
- [x] 앱 본문에 page scroll ownership을 연결했다.
- [x] `PageFrame`이 full/wide/medium/document 폭을 제공한다.
- [x] `PageState`가 loading/empty/error/forbidden/expired 상태를 표현한다.
- [x] `@ecoya/ui` 자체 ESM·타입 선언·CSS 패키지 빌드가 통과한다.
- [ ] 기존 모든 도메인 화면의 raw color를 semantic token으로 교체한다.
- [ ] `/dp`와 실제 배포 화면의 390/768/1440 반응형을 캡처·대조한다.
- [ ] 별도 consumer 앱에서 설치·빌드하고 npm registry 배포 전 계약을 검증한다.
- [ ] 제품별 layout migration 후 기존 Playwright 회귀를 통과한다.

미체크 항목은 구현 2단계 범위이며, 제품 화면을 공통 템플릿으로 강제하는 근거로 사용하지 않는다.

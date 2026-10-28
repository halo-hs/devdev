# devdev → develop 디자인 반영 핸드오프

> 대상: `hrm-corp/ecoya-platform-user-frontend` develop 개발자
> 기준: devdev(`halo-hs/devdev`) 프로토타입 + SNAP 2.0 Figma
> 작성일: 2026-10-28 · develop 대조 기준 `82e411eee`(2026-10-28)
> devdev 기준: main `d212998` (PR #181 머지, 2026-10-28) — 3-3 ~ 3-8은 devdev main에서 바로 볼 수 있다

## 1. 이 문서로 할 일

devdev에서 Figma 값을 반영한 화면 중 **develop에 아직 없는 차이**를 옮긴다.
코드를 복사하지 않는다. devdev는 Vite 프로토타입, develop은 Next 16이라 데이터·라우팅 코드는 다르다.
**옮길 대상은 배치·간격·토큰 값**이고, develop의 ds2 컴포넌트로 조립한다. 지금까지의 `[design] … devdev 값으로` PR과 같은 방식이다.

## 2. 이름 대응표 (devdev → develop)

devdev 코드를 읽을 때 아래처럼 바꿔 읽는다. 표에서 「develop에 없음」인 부품만 새로 만들지 결정이 필요하다.

| devdev | develop |
| --- | --- |
| `HeroBanner` (`src/components/platform/HeroBanner.tsx`, 10-28 이전 이름 `BusinessPageHero`) | `ds2/molecule/HeroBanner` |
| `KpiCard` (`src/components/platform/KpiCard.tsx`) | **develop에 없음** — Figma 「(제안) KpiCard」(라벨·구분선·값·설명). develop `StatTile`은 홈 숫자 타일로 다른 부품 |
| `BusinessFilterSegments` 등 (`platform/SearchFilterBar.tsx`) | `platform/SearchFilterBar` — 1:1 아님, 5장 표 참고 |
| `DatePicker` | `ds2/atom/DatePicker` |
| `FileDropZone` | `ds2/atom/FileDropZone` |
| `StatusBadge` | `ds2/molecule/StatusBadge` |
| `BeforeUploadState` (`trade-os/inbox/InboxView.tsx`) | `features/erp/inbox/views/UploadHero.tsx` + `UploadPageStates.tsx` |
| `src/app/tokensDs2.css` | `src/app/tokens-ds2.css` |
| `src/app/theme.css` 3단계 "Figma 값 덮어쓰기" | develop에 해당 파일 없음 (값 단위로 비교 필요) |

화면 폴더는 `trade-os/<화면>/` → `src/features/erp/<화면>/`로 1:1 대응한다
(onboarding, inbox, ai, shipments, settlement, monitor, reports, salesperf, settings).

## 3. 반영 요청

### 3-1. 문서 올리기 — 히어로 위로 겹치는 업로드 카드 (UL-W1b 화면 적용)

- Figma: `6982:65578`
- develop 대상: `src/features/erp/inbox/views/UploadHero.tsx`, `UploadPageStates.tsx`(`UploadPageFrame`), `uploadViewShared.ts`
- 선행 PR: `#3895`(UL-W1a 틀 여백), `#3906`(Card `elevation="modal"`, FileDropZone `appearance="accent"` 추가, 화면 사용 0)

| 항목 | develop 현재 | 목표 (Figma) |
| --- | --- | --- |
| 히어로 높이 | 내용 높이 | **280px** (최소 높이) |
| 3단계 안내(파일 올리기 → 추출값 검토 → 거래 연결·확정) | 히어로 **아래** 별도 줄, 히어로와 16px | 업로드 카드 **안** 첫 줄 |
| 업로드 카드 위치 | 3단계 아래, 1024px 가운데 열 | 히어로 상단에서 **123px** 지점부터 시작, 히어로 위에 겹침 (`z-index` 위) |
| 카드 폭 | `max-w-5xl`(1024px) | 히어로 좌우에서 **60px**씩 안쪽 (`100% - 120px`), 640px 미만은 100% |
| 카드 안 세로 간격 | 블록별 `mt-3`(12px) | 3단계·안내·드롭존·알림·버튼 사이 **20px** 한 값 |

구현 메모:
- 겹침은 카드에 `margin-top: 123px - 280px`(= -157px)를 준다. devdev는 페이지 전용 토큰 4개로 처리했다: `--ui-upload-hero-height`, `--ui-upload-hero-card-top`, `--ui-upload-hero-card-inset`, `--ui-upload-hero-card-gap`.
- 공용 `HeroBanner` 값은 바꾸지 않는다. 문서 올리기 화면에서만 적용한다.
- 카드 바탕은 `--surface-background`이다. `#3906`의 `elevation="modal"`이 이 용도로 보이니 확인 후 사용한다.
- devdev 상태: 로컬 반영 완료, devdev main에는 아직 커밋되지 않음. devdev 배포 후 화면 링크를 추가한다.

### 3-2. 처음 시작하기 — 히어로 + 겹치는 진행 카드

- Figma: `6578:223261` (Owner/Admin `6578:223262`, Member `6578:223309`)
- develop 대상: `src/features/erp/onboarding/`
- 내용:
  - 시작 가이드 히어로 아래에 진행 카드가 겹치는 구조 (3-1과 같은 패턴)
  - Owner/Admin: 조직 안내 2개 항목을 2열 카드로
  - 제품 시작 4단계: 반응형 카드 그리드
  - 하단 시작 안내 패널: 전체 폭 카드
  - Member: 조직 안내를 숨기고 4단계만 표시
- 바꾸지 않는 것: 진행 상태, 역할별 잠금, CTA 이동 동작
- devdev 상태: 로컬 반영, devdev main 미커밋. develop과 값 단위 대조는 아직 안 함.

### 3-3. 거래 목록 — Figma 거래/상세 목록v2

- Figma: `6928:141422`
- devdev: `trade-os/deals/DealsListView.tsx` (커밋 `670e237`, `56b419d` · main 반영 #181)
- develop 대상: `src/features/erp/deals/`

| 영역 | 목표 (Figma) |
| --- | --- |
| 상세 필터 버튼 | 흰 40px 버튼, 왼쪽 14 / 오른쪽 16 여백, 선택 개수는 어두운 원(18px), 열리면 위쪽 화살표 |
| 적용된 필터 칩 | 히어로 **아래**로 이동. 32px 회색(Gray 8) 알약, 13px 글자, 16px 닫기 아이콘, 칩 사이 6px. 「전체 해제」는 파란 13px 글자 |
| KPI 카드 4개 | 히어로에 겹치지 않고 아래에 배치(히어로·칩과 12px). 공용 Card, 여백 20/18, 라벨 14/20 SemiBold, 값 22/30 Bold, 설명 13/18 Gray 4. 건수만 눌러서 목록 필터(3-7) |
| 보조 지표 4개 | 한 줄 띠 → 개별 Card 4개. 48px, 아이콘 20(Error Circle·Ship·Document·Arrow Sync), 라벨 13 Gray 4, 값 16 Bold. 건수만 눌러서 목록 필터(3-7) |
| 표 열 폭 | 250 / 170 / 150 / 180 / 140 / 90 / 292 / 48 (1320 기준), 첫 열 왼쪽 20 |
| 거래번호 칸 | 번호 14/20 Bold, 거래명 13/18, 거래처 11/16 Gray 4 |
| 품목 칸 | 주 값 15/22, 품목 11/16 Gray 4, 잔량·이행 11/16 Orange 1 |
| D-day 칸 | 가운데 정렬. 배지: 지남 빨강, 3일 이내 주황, 완료 초록, 그 외 회색 + 기준(결제·ETA·ETD) 11px. ETA 15/22 Gray 3 |
| 진행 상태 칸 | 단계 배지 + 매입/매출 외곽선 배지 한 줄 → `·` 상세 줄(11/16) → 리스크 주황 알약(13/18, Orange 6 바탕) → 다음 할 일 파란 ghost 단추(24px, 11px) |
| 보관된 거래 보기 | 파란 13px 링크 + 개수 + Owner 배지(16px) + 오른쪽 끝 화살표, 위 구분선 Gray 9 |

- KPI 카드는 Figma에서 "(제안) KpiCard — StatTile에 설명 줄이 없어 컴포넌트 추가 필요(승인 전)"으로 표시돼 있다. devdev는 공용 `StatTile`을 바꾸지 않고 거래 화면 안에서만 조립했다. develop에서 ds2 컴포넌트로 추가할지는 결정이 필요하다.
- develop 현재 화면과의 값 대조는 아직 안 했다.

### 3-4. 결산 리포트 — Figma 결산리포트 v6

- Figma: `5789:51755` (A · 1280 `5789:53243`, A · 1440 `5789:54373`, A · 1600 `5789:55503`, A · 1024 `5891:35766`, 담당자 필터 상태 `5892:41049`)
- devdev: `trade-os/reports/ReportsConnected.tsx`, `trade-os/OperationsScreens.tsx` (커밋 `fe9851b` · main 반영 #181)
- develop 대상: `src/features/erp/reports/`

| 영역 | 목표 (Figma) |
| --- | --- |
| 히어로 | 제목 옆 PRO 배지 없음. KPI는 히어로에 겹치지 않고 아래 16px |
| 다시 조회 | 흰 40px 아이콘 버튼(새로고침 아이콘), 글자 없음 |
| 담당자 | 라벨 「담당자」. 버튼 폭 고정, 긴 이름은 말줄임, 옆 버튼 위치는 그대로. 펼친 목록은 가장 긴 이름에 맞춤(최대 320) |
| KPI 증감 | 오르면 「▲ +7.9% vs 8월」 빨강, 내리면 「▼ -12.6% vs 8월」 파랑. 비율 설명(「수취 예정 중 61.8% 적용」)은 회색 |
| 1280 이상 | KPI 1줄 4개, 2줄 거래손익(2칸) + 2개. 본문은 왼쪽 차트 + 오른쪽 360 고정 |
| 1280 미만 (1024) | KPI 1줄 2·2, 2줄 3개 같은 폭. 본문 1단(차트 → 고객사 Top 5 → 월마감) |

- 담당자 버튼 폭: Figma는 125px이지만, devdev 히어로 선택칸 글자 크기에서는 「전체 담당자」가 잘려 140px로 맞췄다.
- 1024 화면은 CSS 기준(`max-xl`)으로만 맞췄고 브라우저로 확인하지 않았다.

### 3-5. 영업 성과 — Figma 시안 A

- Figma: `6934:147523`
- devdev: `trade-os/salesperf/SalesPerformanceConnected.tsx`, `trade-os/OperationsScreens.tsx` (커밋 `561d9d3` · main 반영 #181)
- develop 대상: `src/features/erp/salesperf/`

| 영역 | 목표 (Figma) |
| --- | --- |
| 히어로 | PRO 배지 없음, 오른쪽 버튼 없음. KPI 4개는 히어로 아래 16px (겹치지 않음) |
| 통화 | 탭 줄 → 90px 선택칸(결산 리포트와 같음) |
| KPI | 미수 잔액의 「연체 금액」 줄은 빨강 |
| 추세 + 담당자별 GP | 추세 카드는 남은 폭, 담당자별 GP는 370 고정, 두 카드 높이 같게 |
| 미기록 딜 제외 안내 | 「— 현재 조회 범위에서 미기록 딜 N건 제외 (조회 기간 전체 기준)」 한 줄, 11px 빨강 |

### 3-6. 운영 감시 — KPI 위치

- devdev: `trade-os/monitor/MonitorScreen.tsx` (커밋 `561d9d3` · main 반영 #181)
- develop 대상: `src/features/erp/monitor/`
- KPI(오늘 처리·완료율)를 히어로에 겹치지 않고 히어로 아래 16px로 내린다. 결산 리포트·영업 성과·거래와 같은 규칙.

### 3-7. 거래 목록 지표 — 카드 + 건수 고스트 버튼 (3-3 보완)

- devdev: `trade-os/deals/DealsListView.tsx` (커밋 `56b419d` · main 반영 #181)
- KPI 4개·보조 지표 4개는 누를 수 없는 Card. **건수만** 고스트 버튼이고, 누르면 아래 목록을 그 조건으로 거른다. 다시 누르면 해제.
- 적용 중인 건수는 Blue 4 글자 + Blue 10 바탕(`aria-pressed`). 「처리 대기」도 필터 대상(처리 대기 문서가 있는 거래).

### 3-8. 설정 사이드바 — Figma SettingsNav

- Figma: `6911:91747`
- devdev: `share/settings/SettingsRoutePage.tsx`, `src/index.css` (커밋 `d52277d` · main 반영 #181)
- develop 대상: `src/features/erp/settings/` 사이드바

| 영역 | 목표 (Figma) |
| --- | --- |
| 여백 | 좌우 12, 위 16, 줄 간격 4 |
| 돌아가기 줄 | 왼쪽 화살표 20 + 「앱으로 돌아가기」 15/22 Gray 3, 오른쪽 접기 버튼 32 |
| 검색 | 40px, 모서리 8, 테두리 Gray 5, 아래 Gray 9 구분선 |
| 그룹 제목 | 32px, 11/16 Gray 1 |
| 메뉴 | 36px, 모서리 8, 아이콘 20, 글자 15/22 Gray 3, 아이콘·글자 간격 12 |
| 선택된 메뉴 | Blue 10 바탕 + Blue 4 테두리·글자 |
| 빌링 | 오른쪽 끝에 새 탭 열기 아이콘 16 |

- 아이콘은 Figma에도 「임시」로 표시된 것이 있어 바꾸지 않았다(확정 후 교체).

### 3-9. AI에게 묻기 — Figma 7차 입력칸 + 첫 화면

- Figma: `5729:60827` (빈 화면 `5729:60828`)
- devdev: `trade-os/ai/AiWorkspace.tsx`, `trade-os/lib/aiHandoffCopy.ts` (main 반영 #183)
- develop 대상: `src/features/erp/ai/` (질문 입력칸 · 첫 화면 · 대화 기록 패널)

| 영역 | 목표 (Figma) |
| --- | --- |
| 첫 화면 인사 | 로고 96 → 16 → 「{이름}님, 무엇이든 물어보세요」 + 「질문하면 거래·문서·정산 데이터를 근거로 답하고, 바로 업무로 이어갑니다」 |
| 첨부 머리줄 | 「첨부 파일 n/10」 + 오른쪽 「모두 지우기」, 파일마다 크기 표시 |
| 첨부 목록 | 줄 40, 3줄(120px)까지 보이고 넘치면 스크롤 |
| 질문칸 | 17/24, 최소 2줄 · 최대 4줄(96px), 넘치면 스크롤 |
| 버튼 | 첨부·질문하기는 입력칸 아래에 고정, 질문하기 툴팁 「⌘ + Enter」 |
| 첨부 제한 | 10개면 첨부 버튼 비활성 + 아래 안내 「파일은 최대 10개까지 첨부할 수 있어요」 |
| 머리말 | 「ECOYA 업무 AI」 + 「거래·문서·정산 데이터를 근거로 답변합니다」 |
| 대화 기록 패널 | 「대화 기록 · 최근 30일 대화」 + 검색만. 새 대화·저장한 답변 버튼 없음(새 대화는 머리말 버튼) |

- 첫 화면 이름은 devdev에선 샘플(홍길동)이다. develop은 로그인 사용자 이름을 넣는다.
- 추천 질문 4개는 시안에 없지만 기획상 유지한다.

## 4. 화면별 진행 현황

「develop 커밋」은 develop의 9월 이후 `[design]`/`devdev` 커밋 수다. 적을수록 남은 차이가 많을 가능성이 높다.

| 화면 | devdev Figma 반영 | develop 커밋 | devdev ↔ develop 값 대조 |
| --- | --- | --- | --- |
| 거래 목록 | ✅ main (3-3, 3-7) | 74 (deals) | 미대조 |
| 결산 리포트 | ✅ main (3-4) | 9 | 미대조 |
| 영업 성과 | ✅ main (3-5) | 3 | 미대조 |
| 운영 감시 | ✅ main, KPI 위치만 (3-6) | 8 | 미대조 |
| 설정 | ✅ main, 사이드바만 (3-8) | 50 | 미대조 |
| 문서 올리기 | ⏳ 로컬만 (3-1) | 13 (upload·erp-upload) | 3-1 항목만 대조 |
| 처음 시작하기 | ⏳ 로컬만 (3-2) | 20 | 미대조 |
| 문서 만들기 | ✅ main, 탭·목록 (`37f3d10`) | 17 | 미대조 |
| 선적 | — | 10 | 미대조 |
| 정산 | — | 6 | **우선 대조 필요** |
| AI에게 묻기 | ✅ main (3-9) | 5 | **우선 대조 필요** |

다음 단계: 3-1·3-2를 devdev main에 올리고, 정산 Figma 반영과 표를 추가한다.

## 5. 개발자가 신경 쓰지 않아도 되는 것

devdev 안에서 한 파일 이동·이름 변경(`packages/` → `src/components/`, App.tsx 분리, `ReferenceOperations` → `OperationsScreen` 등)은 프로토타입 내부 정리다. develop에서 따라 할 필요 없다.
devdev 컴포넌트 이름은 develop 이름에 맞추는 중이다. `HeroBanner`는 맞췄다(`ab4b34d`). `platform/` 나머지 7개 파일은 develop 컴포넌트와 역할이 1:1이 아니어서 이름을 바꾸지 않았다. 아래 표는 참고용이며, develop에서 어떤 부품을 쓰거나 새로 만들지는 개발자가 정한다.

| devdev | develop 비슷한 부품 | 차이 |
| --- | --- | --- |
| `SidebarProfileMenu` | `ds2/molecule/AccountButton` | develop은 버튼 모양만, devdev는 버튼 + 열리는 메뉴까지 |
| `PannablePdfViewport` | `ds2/molecule/DocumentViewer/DocumentViewerStage` | 둘 다 문서 스크롤 영역. devdev는 끌어서 이동 기능 포함 |
| `PageLoadingBoundary` | `platform/RouteLoading` | develop은 종류별 고정 뼈대, devdev는 실제 화면을 측정해 덮는 래퍼 |
| `MoneyValue`·`NumericValue` | `platform/Money` | 같은 역할(금액 표시), props 이름 다름(`value` ↔ `amount`) |
| `PdfFloatingControls`·`PdfViewerToolbar` | `ds2/molecule/PageNavigator` | develop은 페이지 이동 알약, devdev는 페이지·확대·전체화면·다운로드를 한 묶음으로 |
| `BusinessFilter*` 8개 | `platform/SearchFilterBar` | develop은 검색+필터 한 줄 부품 1개, devdev는 조각 부품 여러 개 |
| `FormField` 등 4개 | `ds2/molecule/FormItem` | 같은 역할(라벨·입력·안내), 구성 방식 다름 |

## 6. 주의

- LNB 아이콘은 최종 컨펌 전이다. 교체하지 않는다.
- 공용 토큰(`tokens-ds2.css`)을 바꾸는 경우 다른 화면에 영향이 없는지 먼저 확인한다. 화면 하나에만 필요한 값은 화면 전용으로 둔다.
- 검증 범위
  - 3-3 ~ 3-8: devdev `npm run build`와 PR #181 preview 체크 통과. 각 화면을 데스크톱 폭 브라우저에서 Figma와 비교했다. 거래 지표 건수 필터 동작(누름·해제)도 확인했다.
  - 결산 리포트 1024 배치, 모바일 폭은 브라우저로 확인하지 않았다.
  - 3-1·3-2: devdev main에 없다(로컬 작업 트리만). 픽셀 대조와 브라우저 확인은 아직 안 했다.

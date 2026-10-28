# ECOYA devdev

하나의 서비스·앱·배포를 유지하면서 화면 영역을 나눈 React + Vite 프로젝트입니다.

```text
landing/
  home/       브랜드 스토리·홈 전용 스타일
  trade-os/   Trade OS 소개·데모·콘텐츠
  snap/       SNAP 소개·이미지·콘텐츠
  pricing/    가격
  contact/    도입 문의
  shared/     공개 페이지 공통 헤더·푸터·스타일
auth/         인증 화면·레이아웃·입력 검증
trade-os/
  home/       Trade OS 업무 홈
  inbox/      문서 올리기
  confirm/    업로드 검토
  deals/      거래 목록·상세·정산·전달
  documents/  문서 만들기·전달·첨부
  ai/         AI 업무 도구
  sales/      매출
  counterparties/ 거래처
  shipments/  선적
  settlement/ 정산
  monitor/    운영 감시
  reports/    결산 리포트
  salesperf/  영업 성과
  components/ 제품 전용 UI
  lib/        업무 로직
snap/
  tasks/      업무 상세
  directory/  고객·작업자
  evidence/   증거
  reports/    리포트
  operations/ 운영
  settings/   제품 설정
  access/     접근 제어
  lib/        업무 로직
share/
  home/          공통 업무 홈 모듈
  settings/      계정·조직 설정
  notifications/ 알림
  public/        고객 공유 링크
src/components/  공통 UI(ui·ds2·platform)·디자인 시스템
src/          앱 진입·통합 화면·라우팅 연결
public/       정적 파일(이미지·폰트)
scripts/      배포 파일 정리
docs/         설계·화면 설명
tests/        자동 검사(로컬 전용, Git 제외)
```

Node.js 22 이상에서 `npm ci`, `npm run dev`로 실행합니다. `npm run build`로 타입 검사와 프로덕션 빌드를 수행합니다.

배포 주소: https://devdev-e6t.pages.dev

미리보기: https://halo-hs.github.io/devdev/

기존 PR 브랜치에 push하면 GitHub Pages 미리보기가 갱신되고, main 병합 시에만 Cloudflare에 배포됩니다. [배포 설정 안내](docs/deployment-preview.md)를 확인하세요.

홈페이지 문구·이미지·디자인을 수정할 때는 [마케팅 페이지 수정 지침](landing/AGENTS.md)을 먼저 확인하세요. 공통 헤더와 CSS는 인증·다른 소개 페이지에서도 사용하므로 홈 전용 범위로 수정합니다.

## 파일 정리 기준

- `scripts/assets/`: 폰트·애니메이션 생성과 배포 파일 정리.
- `trade-os/OperationsScreens.tsx`: 선적·정산·운영 감시·결산 리포트·영업 성과 화면의 진입점. 화면은 예시 데이터(`trade-os/lib/demo/`)로 동작합니다.
- `output/`: 작업 메모·캡처·임시 산출물. Git·배포에서 제외.

루트의 `package*.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, lint·format·Playwright 설정은 설치·빌드·검사에 필요한 파일입니다. `THIRD_PARTY_NOTICES.md`는 라이선스 고지이므로 유지합니다. Netlify 설정은 사용하지 않습니다.

[개발 도구 안내](scripts/README.md) · [공개 파일 안내](public/README.md)

## 파일을 찾는 기준

각 페이지 폴더의 `page.tsx`가 시작점입니다. 마케터의 홈 문구·배치는 `landing/home/page.tsx`, 홈 전용 스타일은 `landing/home/styles.css`에서 수정합니다. `landing/shared/`와 `src/components/`는 여러 페이지가 사용하는 공통 영역입니다.

`share/`는 공통 업무 화면, `src/components/`는 공통 UI 부품입니다. 토큰은 `src/app/tokensDs2.css`(기본)와 `src/app/theme.css`(Figma 덮어쓰기)입니다. `src/app/PublicEntry.tsx`는 공개 페이지 연결을 담당합니다.

업무 화면 파일 이름은 제품 프론트엔드(`ecoya-platform-user-frontend`의 `src/features/<기능>/`)와 맞춥니다. 예: 거래 목록 `trade-os/deals/DealsListView.tsx`, 문서 올리기 `trade-os/inbox/InboxView.tsx`, 업로드 검토 `trade-os/confirm/ConfirmFlowConnected.tsx`, 문서 만들기 `trade-os/documents/DocumentCreateConnected.tsx`, AI에게 묻기 `trade-os/ai/AiWorkspace.tsx`, 설정 `share/settings/SettingsRoutePage.tsx`, 로그인 `auth/LoginPanel.tsx`. `src/App.tsx`는 라우팅과 앱 상태, `src/shell/`은 사이드바(`ErpNav.tsx`)와 상단 바(`ErpTopNavSlot.tsx`)를 담당합니다. SNAP 통합 화면 일부(`snap/SnapScreens.tsx`, `snap/operations/SnapOperationsPages.tsx`)는 아직 한 파일에 남아 있습니다. 모든 기능의 코드·빌드가 독립된 것은 아닙니다.

## 공통 UI 부품 기준

| 폴더 | 역할 | 화면에서 직접 import |
| --- | --- | --- |
| `src/components/ds2/ui/` | shadcn 기반 기본 부품 원본 | 안 함 — `ui/` 래퍼를 씀 |
| `src/components/ds2/extensions/` | 디자인 시스템 팀이 기본 부품을 조합해 만든 확장 부품 | `DatePicker`는 `ui/DatePicker` 래퍼로, 나머지는 직접 |
| `src/components/ds2/assets/` | 로고·아이콘·애니메이션 | 함 |
| `src/components/ui/` | 같은 이름의 ds2 부품에 Figma 색·간격만 입힌 래퍼 | 함 |
| `src/components/platform/` | 여러 화면이 쓰는 조합 부품(StatusBadge, SearchFilterBar 등) | 함 |

한 기능에서만 쓰는 부품은 그 기능 폴더(예: `trade-os/components/`)에 두고, 여러 화면이 쓰게 되면 `platform/`으로 옮깁니다. 색·간격 기본값은 `src/app/tokensDs2.css`, Figma 덮어쓰기는 `src/app/theme.css`에서 고칩니다.

## 파일 이름 규칙

- 화면·부품(`.tsx`)은 PascalCase(`DealsListView.tsx`), 훅·로직·데이터(`.ts`)와 CSS는 camelCase(`usePreviewPlayback.ts`, `tokensDs2.css`). 제품 프론트엔드의 `-` 이름 규칙은 따르지 않습니다.
- 예외: `page.tsx`, `layout.tsx`, `main.tsx`, `index.tsx`.
- `ui/` 래퍼는 감싸는 ds2 부품과 파일 이름이 같습니다(`ui/Tooltip.tsx` → `ds2/ui/Tooltip.tsx`).
- import 경로는 대소문자까지 파일 이름과 같아야 합니다. 맥에서는 틀려도 동작하지만 배포 빌드(Linux)는 실패합니다. 대소문자만 바꾸는 이름 변경은 `git mv a.tsx a.tmp` → `git mv a.tmp A.tsx` 두 단계로 합니다.

## 로컬 전용 폴더

`tests/`(Playwright 화면 검사), `feedback/`(화면 캡처), `doc/`·`docs/`(메모), `output/`은 Git에 올리지 않습니다. 앱·빌드·배포는 이 폴더들을 쓰지 않습니다. `npm run test:e2e`는 로컬에 `tests/`가 있을 때만 동작합니다.

## 개발자 핸드오프 (2026-10-22)

공통 UI와 디자인 시스템을 `src/`로 모으고, 원본(제품 프론트엔드)에서 통째로 가져왔던 operations 화면을 devdev 부품·구조로 합쳤습니다(PR #170, #171). 화면은 예시 데이터로만 동작하고, 제품 프론트엔드나 로컬 3030 백엔드 없이 빌드·실행됩니다.

### 옮긴 위치

| 전 | 지금 |
| --- | --- |
| `packages/design-system-2.0/` | `src/components/ds2/`, 토큰 `src/app/tokensDs2.css` |
| `packages/shared-ui/` 래퍼·조합 부품 | `src/components/ui/`, `src/components/platform/` |
| `trade-os/operations/index.tsx` | `trade-os/OperationsScreens.tsx` (화면 진입점) |
| `trade-os/operations/styles/host.css` | `trade-os/OperationsScreens.css` (화면별 레이아웃 규칙) |
| `trade-os/operations/shipments/`, `settlement/`, `monitor/`, `reports/`, `salesperf/` | `trade-os/shipments/`, `settlement/`, `monitor/`, `reports/`, `salesperf/` |
| `trade-os/operations/components/`, `shared/` | `trade-os/components/` |
| `trade-os/operations/components/screens/MonitorScreen.tsx` | `trade-os/monitor/MonitorScreen.tsx` |
| `trade-os/operations/lib/` | `trade-os/lib/` (`api/`, `deals/`, `session/` 등) |
| `trade-os/operations/demo/` | `trade-os/lib/demo/` (예시 데이터·가짜 API) |
| `trade-os/operations/i18n/`, `messages/ko/` | `trade-os/lib/i18n/`, `trade-os/lib/i18n/ko/` (쓰는 문구 9개만) |
| `trade-os/operations/compat/Link.tsx` | `trade-os/lib/AppLink.tsx`, `src/hooks/useSearchParams.ts` |
| `platform/DateInput` | `ui/DatePicker` |
| `public/assets/operations/illustrations/Bag_Gray.svg` | `public/images/illustrations/Bag_Gray.svg` |

### 지운 것

- operations 자체 부품 30개(Button·Dialog·Select·Table 등): 공통 shadcn 부품으로 교체
- 원본 CSS·토큰 사본(약 370KB)과 생성 스크립트: 클래스는 같은 값의 devdev 토큰으로 교체
- 원본 Next.js 흉내 코드(`compat/`), 로컬 3030 백엔드 연결과 Vite 프록시, 백엔드 전용 거래 상세 화면
- 원본 아이콘·폰트 사본(`public/assets/operations/`, 2.2MB), 쓰지 않는 문구 JSON 20개
- operations 전용 상태 뱃지·세그먼트 버튼: `platform/StatusBadge`, `BusinessFilterSegments` 하나로
- `AGENTS.md`의 디자인 시스템 수정 금지 규칙, 원본 대조 규칙(TRADE:OD-047)

이름도 devdev 기준으로 바꿨습니다: `ReferenceOperations` → `OperationsScreen`, CSS `.reference-3030`·`.reference-*` → `.ops-screen`·`.ops-*`.

### 실행·검사·배포

| 명령 | 하는 일 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 타입 검사(`tsc -b`) + 빌드 + 배포 파일 정리 |
| `npm run lint` | ESLint (현재 오류 98개, 이번 작업 전부터 있던 것) |
| `npm run test:e2e` | Playwright 화면 검사(로컬 `tests/` 필요) |

배포 순서: PR → main 병합 → 브랜치 삭제 → Cloudflare 배포 확인. 배포가 "initialize"에서 멈추면 다시 배포(retry)합니다.

### 검증 결과

- 42개 화면 × 데스크톱(1440)·모바일(390): 화면 오류·깨진 이미지 0
- devdev 기존 화면은 배포 사이트와 캡처 동일. operations 화면은 배너·버튼·선택칸이 devdev 공통 디자인(거래 목록과 같은 배너)으로 바뀜
- 관련 Playwright 15개 파일: 154 통과 / 36 실패. 36개는 모두 이전 main에서도 실패하던 낡은 검사

### 알려진 문제·남은 일

- [ ] 정산 "회계용 CSV 내려받기": 원본 백엔드 주소를 직접 불러 배포 사이트에서 CSV 대신 HTML이 받아짐(이전부터 있던 문제)
- [ ] 낡은 Playwright 검사 36개를 지금 화면·예시 데이터 기준으로 고치거나 지우기
- [ ] operations에서 온 조합 부품 일부(`SectionPanel`, `ChipGroup`, `HostTable`)를 공통 부품(Card 등)과 합칠지 결정
- [ ] `platform/` 파일 7개는 파일 이름과 안에 든 부품 이름이 다름(예: `RouteLoading.tsx` → `PageLoadingBoundary`, `PageNavigator.tsx` → `PdfViewerToolbar`). `HeroBanner`·`StatTile`은 develop 이름으로 맞춤
- [ ] ESLint 오류 98개 정리

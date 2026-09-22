# ECOYA 공통 웹 디자인 시스템 사전 분석 및 실행 계획

- 작성일: 2026-08-05
- 상태: 구현 1단계 반영 기준
- 적용 대상: ECOYA Trade OS Web, ECOYA SNAP Web
- 제외 대상: Flutter/네이티브, 마케팅·CMS, 개별 페이지 리디자인

## 1. 문서 목적

이 문서는 기존 ECOYA 디자인 시스템을 그대로 패키징하지 않고, 실제 정본을 확인한 뒤 구현으로 연결하기 위한 실행 기준이다. 공통 토큰·셸·상태 계약은 `@ecoya/ui`에 1단계로 반영했고, 제품별 화면 조합과 도메인 기능은 각 제품 코드에 유지한다.

완료 후 개발 단계에서는 다음을 판단할 수 있어야 한다.

- 어떤 토큰이 공통 정본인가
- shadcn 컴포넌트를 어디까지 그대로 사용하고 어떤 variant만 추가하는가
- 공통 레이아웃이 보장해야 할 동작은 무엇인가
- 제품별 화면 구성이 어디까지 자유로운가
- 무엇을 `@ecoya/ui` npm 패키지에 넣고 무엇을 제품 코드에 남기는가
- 기존 화면을 어떤 순서로 전환하고 회귀를 어떻게 검증하는가

## 2. 핵심 결정

### 2.1 하나의 공통 시스템

Trade OS와 SNAP은 별도 테마를 만들지 않는다. 두 제품은 아래 기반을 공유한다.

- foundation token
- semantic token
- Tailwind v4 theme
- shadcn 설정과 primitive
- 폰트, 간격, radius, shadow, 상태색
- App Shell 기본 동작
- 접근성, 로딩·빈 상태·오류 상태 규칙

제품 차이는 테마가 아니라 정보 구조, 업무 흐름, 페이지 조합에서 발생한다.

### 2.2 레이아웃을 제한된 패턴 목록으로 고정하지 않음

디자인 시스템은 몇 개의 허용 화면 템플릿만 제공하지 않는다. 공통화할 대상은 레이아웃의 재료와 동작 계약이다.

- 셸, 사이드바, 헤더
- 페이지 거터와 읽기 폭
- 전체 페이지 스크롤과 제한 영역 스크롤
- 분할 패널의 최소 폭과 collapse 동작
- 모바일 전환 순서
- sticky 영역과 overlay 계층
- 로딩 중 layout shift 방지

각 제품은 업무에 맞게 이를 자유롭게 조합할 수 있다. 대시보드, 목록, 상세, 3단 워크스페이스 등은 검증용 대표 유형이지 허용 목록이 아니다.

반복 Pattern은 다음 조건을 모두 만족할 때만 공통 패키지 후보가 된다.

1. 세 화면 이상에서 같은 사용자 문제를 해결한다.
2. 단순 마크업 재사용이 아니라 접근성·반응형·상태 처리를 함께 보장한다.
3. 제품 의미를 제거해도 API가 자연스럽다.
4. shadcn primitive를 이름만 바꿔 감싼 wrapper가 아니다.

### 2.3 배포된 레이아웃을 먼저 사용

새 레이아웃 체계를 다시 설계하지 않는다. 현재 배포된 ECOYA 화면이 이미 레이아웃 자산과 실제 제품 구성을 함께 제공한다.

- `https://grow-world.netlify.app/dp`: 레이아웃과 화면 자산을 찾는 카탈로그·인덱스
- `https://grow-world.netlify.app/dashboard`를 포함한 실제 경로: SNAP과 Trade OS 화면의 실행 가능한 레이아웃 명세
- 제품 소스: 라우트, 권한, 상태, API 연결을 판단하는 구현 근거

따라서 작업 순서는 새 패턴 정의가 아니라 `배포 화면 인벤토리 → 현재 제품 라우트 매핑 → 반복되는 레이아웃 동작 추출 → npm 포함 여부 결정`이다. 배포 화면에 이미 있는 구성은 우선 재사용하고, 실제 업무 요구를 충족하지 못하는 근거가 확인된 경우에만 새 구성을 제안한다.

## 3. 정본 우선순위

충돌 시 아래 순서로 판단한다.

1. 공통 제품 정책과 SSOT
2. 실제 운영 코드의 기능·접근성·API 계약
3. 배포된 `/dp` 카탈로그와 실제 제품 경로의 레이아웃·반응형 동작
4. 기존 디자인 시스템의 토큰과 문서
5. 현재 프로토타입의 검증된 상호작용

주요 조사 대상은 다음과 같다.

- 기존 디자인 시스템: `/Users/hans/team/1-projects/ecoya-products/ecoya-platform-erp/design-system`
- 현재 통합 프로토타입: `/Users/hans/team/1-projects/erp-doc-ui-shadcn`
- 배포 레이아웃 카탈로그: `https://grow-world.netlify.app/dp`
- 배포 SNAP 화면 예시: `https://grow-world.netlify.app/dashboard`
- 사전 요구 문서: `/Users/hans/.codex/attachments/9d029665-b7fa-4f70-bcb1-1d2735891e14/pasted-text.txt`

배포 화면은 레이아웃과 상호작용의 구현 근거지만 정책·권한·API 정본을 대체하지 않는다. 색상·간격 값은 화면에서 임의 추출해 정본으로 삼지 않고 기존 토큰 및 computed style과 대조한다.

## 4. 현재 상태 감사

### 4.1 프로토타입

현재 프로토타입은 다음 기반을 사용한다.

- Vite, React 19, Tailwind CSS v4
- shadcn `base-nova`
- `@base-ui/react`
- CSS variable + `@theme inline`
- Lucide icon

확인된 문제는 다음과 같다.

| 항목 | 현재 상태 | 결정 |
| --- | --- | --- |
| 제품 테마 | `.snap-product`가 공통 semantic token 대부분을 재정의 | 공통 패키지 전환 시 폐기 |
| 폰트 | 기본 Geist, SNAP만 Pretendard | 공통 폰트 하나로 결정 |
| 색상 | semantic variable과 `red-*`, `emerald-*`, `amber-*` 유틸리티 혼용 | 상태 semantic token으로 치환 |
| 화면 폭 | 1280, 1440, 1540, 1680 등 화면별 임의값 | 역할 기반 폭과 예외 기록으로 정리 |
| 높이 | 여러 `calc(100vh - ...)`와 고정 px 높이 혼용 | 셸 변수와 viewport 계약으로 통일 |
| 사이드바 | 232px, 아이콘 48/56px 계열 | 초기 baseline으로 유지 후 대표 화면 검증 |
| 헤더 | 60px | 초기 baseline으로 유지 후 대표 화면 검증 |
| primitive | shadcn 소스가 프로젝트에 존재 | 공통 패키지의 출발점으로 사용 |
| 제품 코드 | 대형 feature 파일에 UI 규칙이 분산 | 반복 규칙만 추출하고 도메인은 제품에 유지 |

`MoneyValue`, PDF viewport/control처럼 제품에서 반복되는 전용 컴포넌트가 이미 존재한다. 이들은 primitive가 아니라 별도 Pattern 또는 제품 컴포넌트 후보로 분류해야 한다.

### 4.2 기존 디자인 시스템

기존 시스템은 유용한 원재료를 많이 갖고 있지만 npm 공개 계약으로는 범위가 넓다.

- Pretendard 100~900 전체 파일
- 대규모 raw color scale
- 다수의 typography utility class
- 레거시 Atomic 계층
- 전역 reset과 scrollbar 숨김
- 매우 큰 z-index ladder
- Radix와 기타 아이콘 체계 혼용

이 자료는 버릴 대상이 아니라 값과 의도를 확인하는 근거다. 다만 그대로 패키지 API로 노출하지 않는다.

### 4.3 문서 간 충돌

기존 문서에는 SNAP 전용 규칙, 공통 제품 규칙, 과거 정적 사이트 규칙이 함께 남아 있다. 특히 아래 항목은 최신 공통 방향과 충돌한다.

- 제품별 토큰 scope
- 본문 스크롤바 전역 숨김
- 매우 큰 z-index 값
- 화면 구현 단계에서 사용하는 대규모 typography utility
- 과거 breakpoint와 현재 반응형 기준의 혼재
- Radix 기반 문서와 Base UI 기반 현재 프로젝트의 차이

따라서 기존 문서의 모든 값을 보존하는 것과 새 패키지의 공개 계약을 동일하게 보지 않는다.

## 5. 토큰 결정안

### 5.1 유지

- Tailwind CSS v4 CSS-first 구성
- CSS custom property를 semantic source로 사용
- `@theme inline`으로 Tailwind에 연결
- raw palette와 semantic token 분리
- Pretendard를 공통 제품 폰트 기준으로 사용
- letter spacing `0` 원칙
- border 중심의 업무용 UI
- shadcn 컴포넌트 소스를 프로젝트가 소유하는 방식

Pretendard는 패키지에 OTF 9개를 직접 넣기보다 variable WOFF2 또는 애플리케이션 주입 방식으로 배포 전략을 확정한다.

### 5.2 변경

#### 색상

공개 API는 아래 의미 역할만 제공한다.

- surface: `background`, `foreground`, `card`, `popover`
- action: `primary`, `secondary`, `accent`, `destructive`
- support: `muted`, `border`, `input`, `ring`
- feedback: `success`, `warning`, `info`, `danger`
- state: 각 feedback의 `foreground`, `background`, `border`
- navigation: `sidebar-*`

세부 blue/gray/red scale은 내부 reference로 남길 수 있으나 제품 화면에서 직접 사용하는 공개 계약으로 삼지 않는다.

#### 타이포그래피

수십 개의 legacy class 대신 역할 중심으로 줄인다.

- display
- page title
- section title
- body
- compact body
- label
- caption
- data/number

숫자 표시는 tabular numeral 지원 여부를 별도로 검증한다.

#### 간격

일반 간격은 Tailwind의 4px 기반 scale을 사용한다. 별도 토큰은 다음처럼 시스템 동작에 영향을 주는 값만 둔다.

- shell header height
- expanded/collapsed sidebar width
- page gutter
- section gap
- panel gap
- control height
- touch target minimum

#### radius와 shadow

radius는 숫자 전체를 공개하지 않고 역할로 매핑한다.

- control
- panel/card
- modal/sheet
- pill/avatar

shadow는 `none`, `raised`, `overlay` 정도로 제한하고 기본 화면은 border를 우선한다.

#### z-index

수천 단위의 제품별 값을 폐기하고 의미 계층으로 단순화한다.

- base
- sticky
- header
- dropdown
- overlay
- modal
- toast

정확한 숫자는 패키지 내부 구현으로 숨긴다.

### 5.3 폐기 예정

- `.snap-product`, `.erp-product` 기반 semantic token 재정의
- 제품별 폰트 교체
- 역할이 같은 상태에 서로 다른 raw color 사용
- 전역 scrollbar 숨김
- 근거 없는 arbitrary width/height
- primitive를 이름만 바꾼 wrapper
- Heroicons와 Lucide 동시 사용
- 페이지에서 직접 관리하는 z-index 숫자

## 6. shadcn 적용 기준

### 6.1 primitive

Button, Input, Textarea, Select, Checkbox, Dialog, Sheet, Table, Tabs, Tooltip, Skeleton 등은 shadcn 구조를 유지한다.

- 접근성 동작과 keyboard interaction을 제거하지 않는다.
- 시각 변경은 semantic token과 variant로 처리한다.
- 제품 feature를 primitive에 넣지 않는다.
- `className`은 배치와 합리적인 예외에 사용하고, 반복 스타일은 variant로 승격한다.

### 6.2 variant 추가 조건

variant는 다음 중 하나를 만족할 때 추가한다.

- action hierarchy가 다르다: primary, secondary, destructive, quiet
- 밀도 계약이 다르다: default, compact
- 상태 의미가 다르다: success, warning, danger, info
- 배치가 아니라 컴포넌트 자체 동작이 달라진다.

특정 페이지 한 곳의 색상·폭·여백을 위해 variant를 만들지 않는다.

### 6.3 Base UI와 Radix

현재 프로토타입은 Base UI, 기존 시스템은 Radix 흔적이 있다. 공통 패키지에서는 두 구현을 섞지 않는다.

초기 권고는 현재 프로토타입의 shadcn `base-nova`를 유지하는 것이다. 다만 npm 공개 API에서 기반 라이브러리의 타입과 import 경로가 과도하게 노출되지 않도록 하고, 패키지 착수 시 한 번 더 확정한다.

## 7. 공통 레이아웃 계약

이 계약은 새 화면 모양을 정의하는 목록이 아니다. `/dp`와 실제 배포 경로에 이미 구현된 레이아웃에서 반복되는 동작을 추출해 공통으로 보장할 범위를 기록한다.

### 7.1 App Shell

- 데스크톱: 고정 사이드바 + 고정 상단 영역 + 본문 스크롤
- 모바일: 사이드바를 sheet/drawer로 전환
- 설정을 포함한 공통 서비스는 같은 셸 치수를 사용
- 헤더와 사이드바 상태 변화가 본문 폭을 갑자기 바꾸지 않음
- 라우트, breadcrumb, 페이지 타이틀은 같은 정의에서 파생

현재 232px sidebar와 60px header는 마이그레이션 baseline이다. 디자인 검증 없이 즉시 변경하지 않는다.

### 7.2 페이지 폭

본문은 기본적으로 가용 폭 100%를 사용한다. 다만 콘텐츠 성격에 따라 읽기 폭을 적용할 수 있다.

- 데이터 목록·대시보드: 넓은 작업 폭
- 폼·설정 상세: 읽기 가능한 중간 폭
- 문서·외부 보고서: 문서 비율과 인쇄 폭
- 3단 워크스페이스: 패널 최소 폭과 resize 규칙

`max-width`를 금지하지 않는다. 같은 역할에 화면마다 다른 수치가 생기지 않도록 역할을 명시한다.

### 7.3 스크롤

- 기본은 body 또는 main의 전체 페이지 스크롤
- 내부 스크롤은 PDF, 긴 필드 목록, 고정 패널처럼 경계가 분명한 영역만 사용
- 중첩 스크롤은 최대 한 단계
- sticky action이 모바일 CTA를 가리지 않음
- 페이지 전환 시 스크롤 복원 정책을 라우터와 함께 정의

### 7.4 자유 조합

제품은 필요에 따라 grid, split pane, drawer, side panel, full-page detail을 선택할 수 있다. 디자인 시스템은 특정 구성을 금지하지 않는다. 대신 공통 primitive가 아래 정보를 제공한다.

- breakpoint별 방향 전환
- min/max size
- overflow 처리
- focus order
- collapse/expand 상태
- loading skeleton의 안정된 크기

### 7.5 배포 레이아웃 인벤토리와 라우트 매핑

`/dp`의 카탈로그 항목과 실제 배포 경로를 전수 조사해 아래 열을 가진 매트릭스를 만든다.

| 필드 | 확인 내용 |
| --- | --- |
| 카탈로그·실제 경로 | `/dp` 항목과 실행 가능한 URL |
| 화면·제품 | SNAP, Trade OS, 공통, 외부 화면 구분 |
| 레이아웃 해부 | shell, header, rail, content, panel, overlay 구조 |
| 폭과 스크롤 | content width, gutter, scroll owner, sticky 영역 |
| 반응형 | 1440px 이상, 768px, 390px 전환 방식 |
| 적용 라우트 | 현재 제품에서 이 구성을 사용하는 모든 경로 |
| 소유권 | `@ecoya/ui` 추출 후보 또는 제품 조합 유지 |
| 상태 | 그대로 사용, 토큰만 교체, 동작 보완, 근거 있는 신규 필요 |

초기 확인 대상에는 다음 실제 경로가 포함된다. 이 목록은 배포 번들에서 확인한 시작점이며 `/dp`와 제품 소스를 대조해 누락 여부를 확정한다.

- 홈·대시보드: `/dashboard`
- 업무: `/tasks`, `/tasks/new`, `/tasks/:id`, `/tasks/:id/report`
- 증빙·고객: `/evidence`, `/customers`
- 운영: `/calendar`, `/workflow`, `/erp-handoffs`, `/workers`, `/safety/corrective-actions`
- 외부 화면: `/work/:token`, `/upload/:token`, `/view/:token`, `/verify/:hash`, `/invite/:token`
- 설정·가입: `/settings`, `/login`, `/onboarding`
- 플랫폼 운영: `/platform`과 하위 운영 경로

매핑되지 않은 제품 라우트는 즉시 새 레이아웃을 만드는 사유가 아니다. 먼저 카탈로그 누락, 동일 레이아웃의 다른 상태, 제품 조합 가능성을 확인하고 그래도 해결되지 않을 때 gap으로 기록한다.

## 8. 대표 화면 조사 계획

아래 유형은 허용 레이아웃 목록이 아니라 조사 깊이와 회귀 범위를 정하는 표본 분류다. 실제 화면 구조는 `/dp`와 배포 경로에 있는 레이아웃을 사용하며, 모든 제품 라우트는 7개 유형 중 하나로 억지로 합치지 않는다.

| 유형 | 조사할 핵심 | 결과물 |
| --- | --- | --- |
| 대시보드 | 요약 밀도, 첫 viewport, 우선 행동, 넓은 폭 사용 | summary·section spacing 기준 |
| 목록·테이블 | toolbar, filter, row density, pagination, split detail | data density와 responsive 표 기준 |
| 상세·작업 | header action, 상태, 폼, 활동 이력, 후속 행동 | 작업 화면 action hierarchy |
| 3단 워크스페이스 | 패널 폭, resize, PDF, 긴 필드, 모바일 순서 | panel behavior 계약 |
| 설정 | 고정 사이드바, 읽기 폭, section navigation | settings layout 기준 |
| 외부 공유·보고서 | 계정 없는 접근, 문서 비율, 인쇄, 만료·회수 | viewer/document 기준 |
| 모바일 | 390px, 긴 문자열, sticky CTA, drawer, table 전환 | mobile adaptation 규칙 |

각 유형은 1440px 이상, 768px, 390px에서 확인한다. 유형별로 한 화면을 새로 만들거나 복제하는 것이 아니라 기존 배포 화면 중 대표 경로를 선정해 반복되는 수치와 동작을 추출한다. 동일 유형 안에 여러 배포 레이아웃이 있으면 각각 유지할 이유와 공통 추출 가능성을 기록한다.

## 9. 공통 컴포넌트와 제품 코드의 경계

### npm 패키지에 포함

- semantic token과 theme bridge
- base/reset와 typography
- shadcn primitive
- 배포 화면에서 반복 사용되고 동작이 안정된 App Shell·split·scroll·responsive layout primitive
- loading, empty, error, forbidden, expired 상태 표현
- 반복 근거가 충분한 비도메인 Pattern
- 접근성 helper와 `cn` 같은 공통 utility

### 제품 저장소에 유지

- Deal, Settlement, Evidence, Task, Report 등 도메인 모델
- API query/mutation
- 권한·플랜 정책
- 제품 route와 화면 조합
- 거래/PDF/현장 증거처럼 제품 의미가 강한 feature
- fixture와 데모 데이터
- `/dp`에 존재하더라도 특정 업무 의미와 화면 순서에 묶인 제품별 레이아웃 조합

`/dp`는 공통 패키지의 모든 화면을 그대로 export하는 저장소가 아니다. 카탈로그와 실제 제품 화면을 패키지의 consumer·검증 환경으로 사용하고, 공통성 근거가 있는 재료와 동작만 npm API로 승격한다.

## 10. npm 배포 구조 제안

```text
@ecoya/ui
  styles/
    tokens.css
    base.css
    theme.css
  components/
    ui/
  layout/
  patterns/
  states/
  lib/
  index.ts
```

권장 export는 다음과 같다.

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./styles.css": "./dist/styles.css",
    "./tokens.css": "./dist/tokens.css",
    "./layout": "./dist/layout/index.js",
    "./states": "./dist/states/index.js"
  }
}
```

패키지 원칙:

- React와 React DOM은 peer dependency
- Tailwind 소비 방식과 CSS import 순서를 README에 고정
- 제품 의존성과 API client를 넣지 않음
- tree shaking 가능한 export
- 변경 시 changeset과 semantic version 적용
- Figma component/variable 이름과 코드 export 이름을 대응표로 관리

## 11. 마이그레이션 단계

### 0단계: 기준 고정

- `/dp` 카탈로그와 배포된 실제 라우트 전수 목록 작성
- 각 실제 화면의 1440/768/390 screenshot과 레이아웃 anatomy 저장
- 현재 Trade OS·SNAP 라우트를 배포 레이아웃에 매핑
- current computed token과 주요 수치 기록
- interaction과 keyboard baseline 기록

### 1단계: token 정리

- 기존 raw value를 semantic role에 매핑
- `.snap-product` 제거 계획 수립
- 폰트·상태색·radius·shadow 확정
- 시각 변경은 아직 최소화

### 2단계: primitive 정리

- shadcn primitive 중복과 직접 스타일 제거
- 공통 variant 확정
- Base UI/Radix 혼용 제거

### 3단계: layout contract 적용

- 배포 레이아웃을 유지한 채 App Shell 변수 통일
- 기존 화면별 page gutter와 scroll ownership을 토큰·primitive로 연결
- 설정, Trade OS, SNAP의 셸 동작을 배포 기준과 대조

### 4단계: 대표 유형 적용

- 각 대표 유형에서 이미 배포된 화면을 한 개 이상 consumer로 선정
- 시각·접근성·반응형 회귀 확인
- 기존 레이아웃을 표현하는 데 부족한 primitive만 보완

### 5단계: 제품 확장

- 나머지 화면을 위험도와 사용 빈도 순으로 전환
- 제품별 예외는 이유와 제거 조건을 기록
- parity가 확인된 뒤 legacy alias와 old stylesheet 제거

## 12. 회귀 검증

### 정적 검사

- 제품 화면의 raw hex 0건
- semantic 역할에 raw Tailwind 상태색 사용 0건
- `.snap-product`, `.erp-product` semantic override 0건
- 근거 없는 arbitrary width/height 신규 추가 0건
- Lucide 외 아이콘 체계 신규 추가 0건

### 화면 검사

- 390px, 768px, 1440px 이상
- 긴 한국어·영어·거래처명
- 빈 데이터, 대량 데이터
- loading, error, forbidden, expired
- hover, focus, selected, disabled, destructive 상태
- sidebar expanded/collapsed와 mobile drawer
- 문서/PDF/외부 viewer 인쇄 및 확대

### 접근성 검사

- keyboard only 주요 흐름
- focus visible
- dialog/sheet focus trap과 escape
- 상태색 외 텍스트·아이콘 보조
- 44px 이상 touch target가 필요한 모바일 행동
- WCAG AA 대비

### 자동화

- Storybook 또는 동등한 isolated preview
- primitive와 layout interaction test
- 대표 유형 Playwright visual regression
- 패키지 consumer smoke test: Trade OS와 SNAP 각각 설치·빌드

## 13. 산출물

기준 고정과 구현 1단계에서 관리할 산출물은 다음 일곱 개다.

1. Source inventory와 충돌 목록
2. Token keep/change/deprecate matrix
3. `/dp` 카탈로그와 실제 배포 route-layout inventory
4. Trade OS·SNAP route-layout mapping matrix
5. shadcn variant와 공통 추출·제품 유지 결정표
6. npm package contract와 migration map
7. 대표 유형별 regression checklist

페이지별 완성 디자인, 전체 Figma 화면, 제품 기능 리팩터링은 공통 기반 구현과 별도의 제품 작업이다.

## 14. 완료 기준

- 공통과 제품 소유권이 명확하다.
- 같은 역할의 토큰이 Trade OS와 SNAP에서 하나다.
- 레이아웃은 공통 동작을 보장하지만 페이지 구성을 제한하지 않는다.
- shadcn primitive와 ECOYA variant의 경계가 설명 가능하다.
- npm export와 dependency 경계가 확정되어 있다.
- 대표 유형으로 migration과 regression을 시작할 수 있다.
- 모든 제품 라우트가 기존 배포 레이아웃에 매핑되거나 근거가 명시된 gap으로 기록되어 있다.
- 배포 화면에 이미 있는 레이아웃을 중복 발명하지 않는다.
- 폐기 대상은 즉시 삭제하지 않고 사용처와 전환 순서가 기록되어 있다.

## 15. 구현 1단계 반영 기록

2026-08-05 기준으로 아래 범위를 실제 코드에 반영했다.

- `packages/ecoya-ui`: `@ecoya/ui` 패키지 계약과 소스 디렉터리 추가
- `packages/ecoya-ui/dist`: npm consumer가 읽을 수 있는 ESM·타입 선언·CSS 빌드 산출물 생성 구조 추가
- `@ecoya/ui/tokens.css`: 공통 semantic alias, shell 치수, 콘텐츠 폭, radius·shadow·z-index 역할 토큰 추가
- `PageFrame`: 페이지 폭과 페이지/contained 스크롤 ownership을 제품이 선택할 수 있는 공통 primitive 추가
- `PageState`: loading, empty, error, forbidden, expired 상태 표현 계약 추가
- `src/index.css`: SNAP의 semantic token·폰트 재정의를 제거하고 공통 토큰을 소비하도록 변경
- `src/App.tsx`: 공통 shell 치수를 토큰에서 읽고, 앱 본문을 `PageFrame` 기반 전체 페이지 스크롤로 연결
- `tsconfig.app.json`, `vite.config.ts`: 현재 Vite 앱이 로컬 패키지를 npm exports와 같은 경로로 소비하도록 alias 추가
- 루트 `package.json`: `build:ui`를 추가하고 앱 빌드 전에 공통 패키지 빌드를 검증하도록 연결

이 단계는 제품 화면을 `PageFrame` 하나의 모양으로 바꾸는 작업이 아니다. 기존 Trade OS·SNAP feature의 정보 구조와 상세 흐름은 유지하며, 반복되는 기반 계약만 실제 consumer로 연결했다. 다음 구현 단계에서 `/dp`, 배포 경로, 원본 코드와 대조해 반복 근거가 확인된 shadcn variant·layout primitive만 추가한다.

검증 결과와 화면별 전환 순서는 [ECOYA 배포 레이아웃·라우트 인벤토리](./2026-08-05-ecoya-deployed-layout-route-inventory.md)에 기록한다.

`npm run build:ui`, `npm run typecheck`, `npm run lint`, `npm run build`를 통과해야 구현 1단계가 완료된 것으로 본다. `dist`는 생성물이며 저장소에는 패키지 소스·계약·빌드 설정만 관리한다.

## 16. 기존 문서와의 관계

기존 `docs/ui-kit-design-collaboration-and-npm-plan.md`는 장기 범위를 넓게 정리한 참고 문서로 유지한다. 본 문서는 최신 합의에 따라 구현 전 의사결정 범위를 줄인 실행 기준이며, 두 문서가 충돌할 경우 이 문서의 공통 토큰·배포 레이아웃 우선 사용·제품별 자유 조합 원칙을 우선한다. 대표 7개 유형은 조사와 회귀 범위일 뿐 레이아웃 허용 목록이 아니다.

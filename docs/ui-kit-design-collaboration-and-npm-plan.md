# ECOYA UI Kit 디자인 협업 및 npm 패키지화 계획

작성일: 2026-08-03  
상태: 디자인·프론트엔드 공통 작업 기준  
적용 범위: Common, ECOYA ERP, ECOYA SNAP, 외부 Viewer, 향후 ECOYA 제품

## 1. 문서 목적

이 문서는 ECOYA 프로토타입의 화면을 한 페이지씩 다시 그리는 작업 지시서가 아니다. 현재 구축된 Tailwind CSS v4와 shadcn 구조를 바탕으로 다음을 합의하기 위한 업무 기준이다.

- 디자이너가 Figma에서 정의해야 할 공통 토큰과 컴포넌트 상태
- 개발자가 shadcn 컴포넌트와 Tailwind 레이아웃에 디자인을 반영하는 방식
- Common, ERP, SNAP이 같은 UI Kit를 사용하면서 제품별 성격을 유지하는 방식
- Claude Code, Cursor 등 AI 도구가 컴포넌트를 임의로 분기하지 않도록 하는 규칙
- 공통 UI를 npm 패키지로 배포하기 위한 최소 산출물과 검수 기준

제품 상태와 업무 규칙은 `docs/product-planning-ux-rules.md`를 따른다. 이 문서는 그 규칙을 시각 언어와 구현 구조로 옮기는 방법을 다룬다.

## 2. 현재 구현 기
### 2.1 적용된 기술

- React 19, TypeScript, Vite
- Tailwind CSS v4와 `@tailwindcss/vite`
- shadcn CLI와 `components.json`
- shadcn `base-nova` 스타일
- `@base-ui/react` 기반 접근성 primitive
- CSS 변수 기반 공통·제품별 디자인 토큰
- Lucide 아이콘
- Recharts 기반 차트
- `src/components/ui`에 복사되어 프로젝트가 소유하는 UI 컴포넌트

현재 구현은 Radix 기반이 아니라 Base UI 기반이다. 향후 문서와 작업 요청에서는 `shadcn/Base UI`로 표기한다.

### 2.2 현재 잘 된 부분

- Tailwind v4와 shadcn 초기화가 완료되어 있다.
- Button, Input, Select, Dialog, Sheet, Table, Tabs, Sidebar, Chart 등 기본 컴포넌트가 로컬 소스로 관리된다.
- `styled-components`, MUI, Emotion과 병행하지 않는다.
- ERP와 SNAP이 공통 shell을 사용하고, SNAP 토큰은 `.snap-product` 범위에서 분리된다.
- 상태색, sidebar, typography, radius 등 주요 토큰이 `src/index.css`에 정의되어 있다.

### 2.3 보완할 부분

- 화면·도메인 코드가 큰 파일에 집중되어 있어 공통 pattern 레이어 분리가 필요하다.
- Figma Variables와 코드 토큰의 1:1 매핑표가 없다.
- Figma Code Connect가 연결되지 않았다.
- AI가 사용해야 할 컴포넌트·variant·금지 규칙을 저장소 지침으로 고정해야 한다.
- npm에서 소비할 공개 API와 내부 전용 컴포넌트 경계가 정해지지 않았다.

## 3. 디자인 작업 요청 범위

디자이너에게 모든 화면의 픽셀 단위 시안을 먼저 요구하지 않는다. 아래 순서로 foundation, component, pattern, 대표 화면을 확정한다.

### 3.1 Foundation

Figma Variables로 다음 토큰을 정의한다.

| 분류 | 필수 토큰 |
| --- | --- |
| Color | background, foreground, card, popover, primary, secondary, muted, accent, destructive, warning, success, border, input, ring |
| Sidebar | sidebar background, foreground, accent, primary, border, ring |
| Typography | font family, display, heading, body, label, caption, numeric |
| Spacing | 4px 기반 spacing scale, page padding, section gap, field gap |
| Radius | input, button, card, dialog, sheet |
| Elevation | popover, dialog, sticky toolbar, document preview |
| Motion | hover, disclosure, sheet, dialog, loading transition |
| Data visualization | chart 1~5, positive, negative, warning, neutral |

토큰 이름은 코드의 CSS 변수와 의미가 같아야 한다. Figma에서만 사용하는 임의 색상 이름과 화면별 색상 복제를 만들지 않는다.

### 3.2 기본 컴포넌트

다음 컴포넌트는 Figma component와 shadcn component를 같은 이름으로 관리한다.

- Button, Icon Button, Button Group
- Input, Textarea, Input Group, Search
- Select, Combobox, Checkbox, Radio, Switch
- Badge, Status, Tooltip
- Tabs, Breadcrumb, Pagination
- Table, Data Table, Empty Row
- Card, Alert, Skeleton, Progress
- Dialog, Alert Dialog, Sheet, Popover, Dropdown Menu
- Sidebar, Product Switcher, Global Header
- Toast, Inline Validation, Loading State
- Chart tooltip, legend, empty state

각 컴포넌트는 최소한 다음 상태를 포함한다.

- default, hover, active, focus-visible
- disabled, read-only
- loading, success, warning, error
- selected, unselected
- empty, populated
- 긴 한국어·영어·독일어 텍스트
- 권한 없음과 기능 잠김

### 3.3 ECOYA 업무 패턴

기본 컴포넌트 외에 반복되는 업무 구조를 pattern으로 정의한다.

| 패턴 | 적용 화면 |
| --- | --- |
| 3단 검토 Workspace | 파일 올리기, 문서 만들기 상세 |
| Document Preview | 원문 PDF, 생성 PDF, 외부 Viewer |
| Field Review | AI 추출값, 출처, 추천값, 오류, 자동 저장 |
| Item Rows | 다중 품목, 수량, 단위, 단가, 자동 계산 |
| Master List | 거래, 선적, 정산, 문서 목록 |
| Operational Detail | 거래 상세, SNAP 작업 상세 |
| Decision Panel | 승인, 전달, 마감, 예외 처리 |
| Dashboard Summary | 오늘 할 일, 운영 감시, 영업 성과, 결산 리포트 |
| Settings Layout | 설정 검색, subsection sidebar, 상세 body |
| External Share | 계정 없는 고객 열람, 만료, 철회, 수신 확인 |

pattern은 페이지 전체를 강제하는 template가 아니다. 해당 업무에 필요한 경우에만 조합한다. 목록 화면을 무조건 좌우 master-detail로 만들거나 모든 화면을 dashboard 형태로 만들지 않는다.

### 3.4 대표 화면 시안

모든 페이지 대신 아래 대표 화면을 디자인해 토큰과 pattern의 완성도를 검증한다.

1. 오늘 할 일: 업무 우선순위와 dashboard 정보 밀도
2. 파일 올리기 상세: 3단 workspace와 PDF 대조
3. 문서 만들기 상세: 필드·품목·승인·전달 상태
4. 거래 목록: 검색, 필터, 상태, 긴 거래처명
5. 거래 상세: 업무 영역과 비순차 tab, 관련 문서
6. 정산: 전체 금액, 소수 정밀도, 지급 이벤트
7. SNAP 작업 상세: 현장 증거와 모바일 작업
8. 설정: 공통·ERP·SNAP subsection
9. 외부 Viewer: 비회원 보안 열람
10. Empty, loading, error, permission denied 대표 상태

## 4. 반응형 디자인 기준

각 component와 pattern은 다음 너비에서 검수한다.

| 기준 | 설계 원칙 |
| --- | --- |
| 390px | 모바일 단일 column, 핵심 CTA 유지, workspace는 단계 전환 |
| 768px | tablet, 2단 또는 접이식 panel, 긴 table은 우선순위 column 유지 |
| 1280px | 기본 desktop 업무 화면 |
| 1440px 이상 | 정보 밀도 증가, 본문을 불필요하게 과도 확장하지 않음 |

공통 검수 항목:

- 3단 workspace를 모바일에서 단순 축소하지 않는다.
- 긴 문서명, 거래처명, 번역 문구가 CTA를 밀어내지 않아야 한다.
- table은 핵심 column을 고정하고 보조 정보는 상세 또는 disclosure로 이동한다.
- dialog와 sheet는 viewport 높이를 넘으면 내부가 아닌 합리적인 content 영역에서 scroll된다.
- PDF가 100%를 넘으면 drag 또는 pan으로 원문 위치를 확인할 수 있어야 한다.
- touch target은 최소 44px을 권장한다.

## 5. 코드 매핑 원칙

### 5.1 레이어

```text
@ecoya/ui foundation
  tokens, typography, icon rules

@ecoya/ui components
  shadcn 기반 Button, Input, Dialog, Table 등

@ecoya/ui patterns
  FieldReview, DocumentPreview, MasterList, DecisionPanel 등

product application
  ERP, SNAP, Common의 도메인 상태와 API 연결
```

처음부터 여러 npm 패키지로 나누지 않는다. 초기에는 `@ecoya/ui` 하나로 배포하고 export 경로만 `tokens`, `components`, `patterns`로 구분한다. 독립 배포 필요성이 확인될 때 패키지를 분리한다.

### 5.2 shadcn 수정 규칙

- `src/components/ui`는 shadcn 원본에 가까운 공통 primitive로 유지한다.
- 제품별 요구는 `variant`, `size`, token 또는 상위 pattern으로 확장한다.
- ERP/SNAP 화면 때문에 Button, Input 같은 primitive를 직접 분기하지 않는다.
- Base UI primitive의 keyboard, focus, ARIA 동작을 제거하지 않는다.
- 페이지 안에 동일한 button·dialog·table 스타일을 다시 작성하지 않는다.
- 신규 shadcn component를 추가할 때 기존 파일 덮어쓰기 여부를 먼저 확인한다.

### 5.3 Tailwind 사용 규칙

- Tailwind는 layout과 token 조합에 사용한다.
- 임의 hex color, 임의 shadow, 화면 전용 radius를 class에 반복하지 않는다.
- 공통 값은 CSS 변수와 semantic token으로 올린다.
- `!important`, 과도한 arbitrary value, 깊은 descendant selector를 피한다.
- 제품 차이는 `.erp-product`, `.snap-product` 같은 scope token으로 해결한다.

## 6. Figma와 코드 연결

### 6.1 이름 규칙

| Figma | Code |
| --- | --- |
| Button / Primary / Medium | `<Button variant="default" size="default" />` |
| Button / Secondary / Medium | `<Button variant="outline" size="default" />` |
| Status / Warning | `<Badge variant="warning" />` 또는 공통 Status component |
| Sheet / Right | `<Sheet side="right" />` |
| Field Review / Error | `<FieldReview status="error" />` |

Figma variant 속성과 TypeScript props가 가능한 한 동일한 용어를 사용해야 한다.

### 6.2 Code Connect 적용 순서

1. Button, Input, Select, Dialog, Table부터 연결
2. Sidebar와 Global Header 연결
3. Field Review, Document Preview, Decision Panel 연결
4. ERP/SNAP 대표 화면에서 mapping 검증
5. 컴포넌트 문서와 Storybook 또는 대체 catalog를 함께 배포

Code Connect는 디자인을 자동으로 코드로 변환하는 기능이 아니라, Figma component가 어떤 실제 코드와 props를 사용하는지 명확하게 연결하는 용도로 사용한다.

## 7. AI 작업 규칙

저장소 작업 지침에 다음 내용을 고정한다.

- UI를 만들기 전에 `src/components/ui`와 공통 pattern을 먼저 검색한다.
- 이미 있는 component를 화면 안에서 복제하지 않는다.
- 색상, 간격, radius는 token을 사용한다.
- 한 시점의 주 CTA는 하나만 둔다.
- icon은 Lucide를 우선한다.
- loading, empty, error, disabled reason, permission state를 함께 구현한다.
- API fixture와 표시용 문자열을 component 내부에 고정하지 않는다.
- shadcn component 수정이 필요한 경우 primitive 변경보다 variant 또는 wrapper를 우선한다.
- desktop 완료만으로 작업을 끝내지 않고 390px, 768px을 확인한다.

shadcn MCP는 component source와 demo를 찾는 보조 도구다. MCP 결과를 그대로 붙이는 것을 완료로 보지 않고 ECOYA token, 상태, 접근성, 업무 목적을 적용해야 한다.

## 8. npm 패키지 공개 API

초기 공개 범위는 작게 유지한다.

```ts
// @ecoya/ui
export * from "@ecoya/ui/components/button"
export * from "@ecoya/ui/components/input"
export * from "@ecoya/ui/components/select"
export * from "@ecoya/ui/components/dialog"
export * from "@ecoya/ui/components/table"
export * from "@ecoya/ui/components/status"
export * from "@ecoya/ui/patterns/empty-state"
export * from "@ecoya/ui/patterns/inline-validation"
```

초기 npm 범위에서 제외할 항목:

- ERP 거래 상태를 직접 포함한 component
- SNAP 작업 fixture를 포함한 component
- 특정 API DTO에 결합된 form
- 한 화면에서만 사용하는 layout
- 확정되지 않은 실험 component

패키지는 ESM, TypeScript declaration, CSS token entry를 제공하고 React와 React DOM은 peer dependency로 둔다.

## 9. 디자이너 산출물

- [ ] Figma Variables와 mode: Common, ERP, SNAP, light, 필요 시 dark
- [ ] Foundation token 정의와 코드 변수 매핑표
- [ ] 기본 component 및 전체 상태
- [ ] 업무 pattern component
- [ ] 390px, 768px, 1280px 대표 시안
- [ ] 긴 텍스트, 빈 상태, 오류, 권한 없음 시안
- [ ] 접근성 annotation: focus order, keyboard, label, contrast
- [ ] motion annotation: sheet, popover, loading, panel transition
- [ ] Figma component 이름과 TypeScript prop 매핑
- [ ] 대표 화면 10종

## 10. 개발 산출물

- [ ] `src/components/ui` primitive 정리
- [ ] `src/components/patterns` 또는 동등한 pattern 레이어 생성
- [ ] 화면에 중복된 style과 component 제거
- [ ] token을 Common, ERP, SNAP mode로 정리
- [ ] component catalog 및 사용 예제
- [ ] Figma Code Connect 설정
- [ ] AI 작업 규칙을 저장소 지침에 추가
- [ ] 접근성, 반응형, visual regression 검사
- [ ] `@ecoya/ui` package entry와 build 설정
- [ ] 버전·변경 기록·migration guide

## 11. 완료 기준

다음 조건을 모두 만족해야 UI Kit 1차 완료로 본다.

1. 대표 화면이 page-local 임의 색상 없이 semantic token으로 구성된다.
2. ERP와 SNAP이 같은 primitive를 사용하면서 제품별 token만 다르게 적용된다.
3. component의 Figma variant와 TypeScript props가 대응한다.
4. 390px, 768px, 1280px에서 핵심 CTA와 상태가 유지된다.
5. keyboard, focus-visible, screen reader label을 확인한다.
6. loading, empty, error, disabled reason, permission state가 catalog에 포함된다.
7. npm package를 별도 샘플 앱에서 설치하고 Button, Input, Dialog, Table을 렌더링할 수 있다.
8. AI가 신규 화면을 만들 때 기존 component와 token만으로 기본 구조를 조립할 수 있다.

## 12. 권장 진행 순서

### Phase 1. Foundation

- 코드의 현재 토큰 목록 추출
- Figma Variables와 이름 통일
- Button, Input, Select, Dialog, Table 확정

### Phase 2. Product patterns

- Field Review, Document Preview, Master List, Decision Panel 확정
- ERP와 SNAP 대표 화면에 적용
- 모바일 pattern 검증

### Phase 3. Handoff automation

- Figma Code Connect
- component catalog
- AI 작업 지침과 shadcn 조회 절차 정리

### Phase 4. npm release

- 공개 API 최소화
- sample consumer app 검증
- `0.x` 버전으로 내부 배포
- 실제 제품 적용 결과를 반영해 `1.0` 범위 결정

## 13. 업무 요청용 요약

디자이너에게는 다음과 같이 요청한다.

> ECOYA 전체 페이지를 각각 새로 디자인하는 작업보다, Tailwind v4와 shadcn/Base UI 구현에 연결할 공통 디자인 토큰, 기본 컴포넌트 상태, ERP/SNAP 업무 pattern을 먼저 설계해주세요. Figma Variables와 코드 CSS 변수의 의미를 맞추고, 390px·768px·1280px 대표 화면에서 긴 텍스트·오류·권한·로딩 상태를 포함해 검증해주세요. 이후 Figma component variant를 TypeScript props와 연결하고, npm으로 배포할 `@ecoya/ui`의 foundation·component·pattern 범위를 함께 확정합니다.

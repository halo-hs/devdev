# ECOYA Design System 2.0

> 이 저장소에서는 이 폴더를 `@ecoya/design-system` 워크스페이스 패키지로
> 소비합니다. 정본은 `ecoya-products/design-system-2.0`에 있으며, 이 폴더는
> 저장소를 어디서든 독립 빌드할 수 있게 포함한 vendored snapshot입니다.
> 외부 절대경로·Next.js preview·`ds-bundle` 없이 Vite에서 빌드됩니다.

ECOYA 제품의 후계 디자인 시스템이자 새 SSOT입니다. 기존 `design-system/`의
구현을 동기화하지 않으며, 제품 화면·CMS·ERP 레이아웃도 이 폴더에 두지
않습니다.

## 경계

- `src/components/ui/`: shadcn CLI로 관리하는 공식 primitive
- `src/components/extensions/`: 공식 shadcn에 없는 기능 또는 공식 primitive의
  재사용 가능한 조합
- `src/assets/`: ECOYA 아이콘·일러스트·이미지
- `src/tokens.css`: ECOYA 토큰 정본
- `public/fonts/`: Pretendard 원본 9종
- `fonts/`: 패키지 export를 위한 `public/fonts/` 상대 symlink
- 제품 레이아웃: 형제 폴더 `../layouts/`에서 별도 관리

현재 정본은 공식 shadcn UI 모듈 61개와 ECOYA extension 소스 26개로
구성됩니다. 구 컴포넌트별 이동·흡수·제외 근거는 [MIGRATION.md](./MIGRATION.md)에
고정합니다.

`src/`, `.design-sync/`, `.ds-sync/`는 정본 source입니다. `.next/`, `types/`,
`ds-bundle/`, `.design-sync/.cache/`는 검증·프리뷰 명령으로 재생성되는
산출물이며 정본 source와 섞지 않습니다. 루트 aggregate barrel은 두지 않고
package의 명시적 leaf export만 공개합니다.

`atom`, `molecule`, `organism`, `platform`, `cms` 계층과 구 구현 코드는 이
프로젝트로 복사하지 않습니다. 필요한 기능은 현재 shadcn API를 먼저 확인한 뒤
새로 조합합니다.

## 시각 정본 계약

`components.json`의 `radix-nova`는 shadcn의 DOM 구조, API, 키보드 조작과
접근성 primitive를 선택하는 기반입니다. 색상, 타이포그래피, 반경, 그림자,
hover·active·focus·disabled 상태의 시각 정본은 Nova preset이 아니라
`src/tokens.css`입니다.

컴포넌트 소스는 프리뷰에서 스타일을 덮어쓰지 않고 ECOYA 토큰을 직접
소비합니다. 정본의 흐름은 다음 한 방향입니다.

```text
ECOYA foundation token
  -> semantic/component role token
  -> shadcn UI 또는 extension leaf
  -> DesignSync와 로컬 preview
```

Figma 동기화도 같은 단방향 계약을 따릅니다. 컴포넌트 구조·API·상태는
`src/components/**/*.tsx`, 토큰 값은 `src/tokens.css`, 전역 스타일 해석은
`src/app/globals.css`가 정본입니다. `ds-bundle/`과
`.design-sync/figma-component-capture.html`은 비교·검증용 생성물이며 Figma
컴포넌트를 다시 정의하지 않습니다. 실제 Figma variant와 prototype 동작을
유지해야 하는 항목은 `.design-sync/figma-native-components.mjs`에 명시하며,
capture 후처리는 그 세트를 덮어쓰지 않습니다.

대표 기본 계약은 아래와 같습니다.

| 역할                  | 기본 계약                                                     |
| --------------------- | ------------------------------------------------------------- |
| Primary Button        | `--button-primary-background` -> `--color-indigo` (`#052D61`) |
| Button 상태           | 전용 hover/active/disabled role과 button shadow token         |
| Input·Select·Textarea | 높이 40px, `--r-md` 8px, `--control-*` 상태 role              |
| 작은 control          | 높이 24~32px, `--r-sm` 6px 또는 `--r-md` 8px                  |
| Card·Dialog surface   | `--r-lg` 12px, surface border와 section/modal shadow          |
| Menu·floating layer   | `--r-md` 8px, menu state role과 `--shadow-filter`             |
| Badge·count           | `--r-pill` 999px                                              |

임의의 `hover:bg-primary/80`, generic `shadow-md`, Nova radius class처럼 토큰
의미를 우회하는 기본값은 public leaf에 남기지 않습니다. shadcn CLI로 새
컴포넌트를 추가하거나 갱신할 때는 공식 diff를 먼저 확인하고, 구조·동작은
보존한 채 시각 클래스를 ECOYA role로 연결한 뒤 contract test와
`pnpm verify`를 통과시킵니다.

## 공식 shadcn으로 대체되지 않는 기능

| 기능                     | 2.0 구현                              | 기반                                     |
| ------------------------ | ------------------------------------- | ---------------------------------------- |
| `CheckboxGroup`          | `extensions/checkbox-group`           | Checkbox + Field                         |
| `ComboBoxSelect`         | `extensions/combobox-select`          | Combobox multiple + all 규칙             |
| `ComboboxSelect`         | `extensions/combobox-select`          | 검색형 single select + dropdown action   |
| `SearchSelect`           | `extensions/search-select`            | Combobox                                 |
| `MultipleSelect`         | `extensions/multiple-select`          | Combobox multiple + chips                |
| `AsyncButton`            | `extensions/async-button`             | Button + Spinner + busy contract         |
| `BusySwitch`             | `extensions/busy-switch`              | Switch + Spinner + busy contract         |
| `ClearableInput`         | `extensions/clearable-input`          | InputGroup + clear/focus/form contract   |
| `CharacterCountTextarea` | `extensions/character-count-textarea` | Textarea + Field + count                 |
| `RequiredLabel`          | `extensions/required-label`           | FieldLabel + required marker             |
| `Typography`             | `extensions/typography`               | ECOYA typography tokens                  |
| `ImageTile`              | `extensions/image-tile`               | image + Skeleton + placeholder/accessory |
| `ClosableTabs`           | `extensions/closable-tabs`            | Tabs + accessible close action           |
| `LabeledProgress`        | `extensions/labeled-progress`         | Progress + icon/percentage               |
| `DatePicker`             | `extensions/date-picker`              | Calendar + Popover                       |
| `TimePicker`             | `extensions/time-picker`              | Popover + Input + ToggleGroup            |
| `DateTimePicker`         | `extensions/date-time-picker`         | Calendar + TimePicker                    |
| `RangePicker`            | `extensions/range-picker`             | Calendar range + Popover                 |
| `MultipleInput`          | `extensions/multiple-input`           | InputGroup + Badge                       |
| `NotificationBadge`      | `extensions/notification-badge`       | Badge                                    |
| `LoadingDots`            | `extensions/loading-dots`             | semantic loading status                  |
| `FileDropZone`           | `extensions/file-drop-zone`           | native file input + drag/drop            |
| `PaginationController`   | `extensions/pagination-controller`    | Pagination + Select                      |
| `DataTable`              | `extensions/data-table`               | Table + sort/loading/empty               |
| `QuantityStepper`        | `extensions/quantity-stepper`         | ButtonGroup                              |
| `InputTimer`             | `extensions/input-timer`              | semantic duration output                 |
| `Tag`                    | `extensions/tag`                      | Badge + removable action                 |

구 Badge의 색상 팔레트와 InfoList의 의미 상태는 별도 wrapper로 남기지 않고
각각 `ui/badge`와 `ui/alert`의 variant로 흡수합니다.

이 표의 항목은 이름만 보존한 구 컴포넌트 복사본이 아닙니다. controlled와
uncontrolled 상태, 비활성·오류 상태, 키보드 조작, 삭제·초기화, 최소·최대 범위
같은 사용자 기능을 새 구현과 행동 테스트로 유지합니다.

## 사용

앱 내부에서는 leaf import만 사용합니다.

```tsx
import { Button } from "@/components/ui/button"
import { MultipleSelect } from "@/components/extensions/multiple-select"
```

컴포넌트 패키지 공개 표면도 같은 규칙을 강제합니다. UI 61개와 extension
26개는 `package.json`에 각각 명시된 leaf subpath로만 노출하며,
`design-system-2.0` root와 `design-system-2.0/extensions` aggregate barrel은
공개하지 않습니다. `*.test.*` 파일도 package export 대상이 아닙니다.

이 경계는 Next App Router의 RSC 분류를 보존합니다. Server Component에서도
필요한 leaf를 직접 import하고, 상호작용이 있는 leaf 파일의 `"use client"`
directive를 aggregate barrel로 우회하지 않습니다. 내부
`src/components/extensions/index.ts`는 로컬 export 검증용이며 제품 import 경로가
아닙니다.

현재는 이 저장소 안에서 쓰는 source SSOT입니다. 별도 패키지로 배포하기 전에는
앱이 이 소스를 직접 참조하고 leaf 경로를 사용합니다.

```tsx
import { MultipleSelect } from "design-system-2.0/extensions/multiple-select"
import { Button } from "design-system-2.0/ui/button"
```

NPM 또는 독립 workspace 패키지로 배포할 때는 `dist/` 빌드와 타입 선언,
내부 `@/*` 경로 변환을 먼저 추가해야 합니다. 현재 `private: true` 설정은 이
미완성 배포 계약이 외부에 공개되는 것을 막습니다.

공식 컴포넌트 추가는 프로젝트 루트에서 shadcn CLI로 수행합니다.

```bash
pnpm dlx shadcn@latest add <component>
```

## 로컬 프리뷰

루트 페이지는 `src/tokens.css`를 직접 읽어 색상, 타이포그래피, 폰트 굵기,
radius, shadow, z-index를 SSR HTML로 렌더합니다. sync 결과가 비어 보일 때도
브라우저와 HTML DOM에서 변수명과 원본 값을 함께 확인할 수 있습니다.

`/components`는 공식 shadcn UI 61개와 ECOYA extension 26개를 모두
검색·필터링할 수 있는 카탈로그입니다. Select, Dialog, DatePicker처럼 props와
children이 필요한 컴포넌트도 `.design-sync/previews/`의 authored specimen
94개로 렌더하므로 로컬 화면과 sync 카드가 같은 예제를 사용합니다. boundary
audit은 모든 public leaf에 preview가 있는지, preview 이름이 실제 public
component export인지, 정확히 94개인지 함께 검증합니다.

개별 컴포넌트는 `/components?component=DatePicker`처럼 직접 열 수 있습니다.
목록 선택은 이 URL을 갱신하므로 새로고침·뒤로가기·링크 복사가 모두 같은
specimen을 복원합니다. iframe과 전체 화면 링크는 프록시 하위 경로에서도
동작하도록 현재 문서 기준 상대 경로를 사용합니다.

```bash
pnpm dev
```

`predev`가 CSS와 DesignSync 번들을 먼저 자동 재생성합니다. 실행 후 아래에서
확인합니다.

- 토큰: `http://localhost:3000`
- 컴포넌트: `http://localhost:3000/components`

프리뷰만 다시 만들려면 `pnpm preview:build`를 실행합니다. `pnpm build`도
`prebuild`에서 같은 과정을 자동 실행하므로 무시된 `ds-bundle/`이 없는 새
환경에서도 빈 카드로 시작하지 않습니다. 이 명령은 `types/`를 먼저 완전히
재생성하고 production source와 정확히 대응하는 선언 91개인지 확인한 다음,
프리뷰 94개를 빌드·브라우저 렌더 검증합니다.
DesignSync의 내부 타입 checker는 이 임시 선언 트리의 `@/*`를 `types/src/*`로
해석해 다른 leaf에서 상속한 props도 카드 선언에 보존합니다. 이는 preview
추출 전용이며 source-only private package의 배포 경계를 바꾸지 않습니다.

## 검증

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm audit:boundaries
```

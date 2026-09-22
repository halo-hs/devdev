# Design System 2.0 전환 계약

## 선언

`design-system-2.0/`은 기존 `design-system/`의 동기화 사본이 아니라 후계
SSOT입니다.

- 기존 폴더는 제품 마이그레이션이 끝날 때까지 동결합니다.
- 공통 컴포넌트의 신규 기능과 수정은 2.0에서만 진행합니다.
- 기존 소스를 2.0으로 복사하거나 양방향 동기화하지 않습니다.
- 제품은 leaf import 단위로 점진적으로 2.0으로 이동합니다.
- 제품 화면, ERP/CMS 도메인 컴포넌트와 레이아웃은 디자인 시스템에 넣지
  않습니다.

## 최종 폴더의 범위

| 경로                                | 역할                                                   |
| ----------------------------------- | ------------------------------------------------------ |
| `src/components/ui/`                | shadcn CLI가 관리하는 공식 primitive                   |
| `src/components/extensions/`        | 공식 primitive로 만들되 별도 사용자 계약이 필요한 조합 |
| `src/assets/`                       | ECOYA 아이콘·일러스트·이미지 전체                      |
| `src/tokens.css`                    | ECOYA 색상·타이포그래피·그림자·반경·z-index 토큰       |
| `public/fonts/`, `fonts` symlink    | Pretendard 9종과 package export 경로                   |
| `src/lib/utils.ts`                  | `cn()` 등 공용 기반                                    |
| `../layouts/snap`, `../layouts/erp` | 제품 레이아웃의 별도 저장 위치                         |

## shadcn과 ECOYA 토큰의 책임

- shadcn은 primitive 구조, public API, focus/keyboard 동작과 접근성 계약을
  제공합니다.
- ECOYA `src/tokens.css`는 색상, 타이포그래피, radius, shadow와 모든 interaction
  state의 시각 정본입니다.
- `components.json`의 Nova preset은 시각 정본이 아닙니다. 설치된 source는
  ECOYA semantic/component role token을 직접 소비해야 합니다.
- preview와 DesignSync 카드는 원본 컴포넌트를 그대로 렌더하며 별도 색상·반경
  override를 두지 않습니다.
- Figma 구조·variant의 기준은 `src/components/**/*.tsx`, 토큰 값은
  `src/tokens.css`, 전역 스타일은 `src/app/globals.css`입니다. `ds-bundle/`과
  Figma capture HTML은 비교·검증 산출물이며 정본이 아닙니다.
- Figma-native 상태 전환이 필요한 세트는
  `.design-sync/figma-native-components.mjs`에서 보호합니다. capture 후처리는
  보호된 세트를 재생성하거나 덮어쓰지 않습니다.
- 새 shadcn leaf를 추가할 때는 `add --dry-run`/`--diff`로 구조 변경을 확인하고,
  ECOYA visual contract를 적용한 뒤 자동 boundary audit를 갱신합니다.

기본 Primary Button은 Indigo Product (`--color-indigo`, `#052D61`), 기본 form
control은 40px/`--r-md` 8px, Card·Dialog surface는 `--r-lg` 12px, pill은
`--r-pill`을 사용합니다. hover·active·disabled는 alpha 임의값이 아니라 각
component role과 state shadow token을 사용합니다.

## 공개 import 경계

- 컴포넌트는 `design-system-2.0/ui/<leaf>` 또는
  `design-system-2.0/extensions/<leaf>`로만 공개합니다.
- package root `design-system-2.0`과 aggregate
  `design-system-2.0/extensions`는 공개하지 않습니다. 내부 extension barrel은 로컬
  export 검증에만 사용합니다.
- 이 leaf-only 계약은 각 파일의 `"use client"` directive를 보존합니다. Next App
  Router의 Server Component에서도 aggregate barrel을 만들지 않고 필요한 leaf를
  직접 import합니다.
- UI 테스트 파일은 공개 subpath가 아니며 제품에서 import할 수 없습니다.
- DesignSync가 생성한 임시 선언의 `@/*` 해석은 preview 타입 추출에만 쓰며,
  source-only private package를 독립 배포 가능한 `dist/` 계약으로 간주하지 않습니다.

## 구 컴포넌트 대응표

### 공식 shadcn primitive로 흡수

| 기존 기능                                                  | 2.0 경로                                | 비고                                                   |
| ---------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------ |
| Accordion                                                  | `ui/accordion`                          | 공식 구조 사용                                         |
| Alert, InfoList                                            | `ui/alert`                              | InfoList 의미 상태를 Alert variant로 흡수              |
| AlertDialog, AlertDialogQuantum                            | `ui/alert-dialog`                       | 비동기 확인은 `AsyncButton` 조합                       |
| Badge, RectangularBadge, Dot                               | `ui/badge`                              | 10색 palette, fill/outline, S/L alias를 variant로 흡수 |
| BasicButton, CircleIconButton, IconButton, ImageMoreButton | `ui/button`                             | 기본 `type="button"`; 로딩은 `AsyncButton`             |
| BasicCard                                                  | `ui/card`                               | 제목·내용은 Card subcomponent 조합                     |
| Checkbox                                                   | `ui/checkbox`                           | 그룹은 `CheckboxGroup`                                 |
| CodeInput                                                  | `ui/input-otp`                          | 완료/변경 이벤트는 공식 API 사용                       |
| Dialog, DialogQuantum, Dim                                 | `ui/dialog`                             | Portal·overlay·focus trap 포함                         |
| Divider                                                    | `ui/separator`                          | 방향은 orientation으로 표현                            |
| DropDown, DropDownButton                                   | `ui/dropdown-menu` + `ui/button`        | 별도 wrapper 없음                                      |
| InputField, InputLabel, InputMessage                       | `ui/field`                              | label/description/error 조합                           |
| Label                                                      | `ui/label`, `RequiredLabel`             | 필수 표식은 정식 composition                           |
| Loader, CenteredLoader, PageLoader                         | `ui/spinner`, `ui/skeleton`             | 동작/콘텐츠 로딩에 맞춰 선택                           |
| NoData                                                     | `ui/empty`                              | 공식 empty 구조 사용                                   |
| Radio, RadioGroup                                          | `ui/radio-group`                        | 공식 그룹 계약 사용                                    |
| Scrollbar                                                  | `ui/scroll-area`                        | 공식 스크롤 영역 사용                                  |
| Select                                                     | `ui/select`, `ComboboxSelect`           | 검색·clear·목록 상단 action은 extension                |
| Switch                                                     | `ui/switch`, `BusySwitch`               | 비동기 상태는 extension                                |
| Tab, ToggleButton                                          | `ui/tabs`, `ui/toggle-group`            | 닫기는 `ClosableTabs`                                  |
| Table                                                      | `ui/table`, `DataTable`                 | 정렬·빈 상태·로딩은 extension                          |
| TextArea                                                   | `ui/textarea`, `CharacterCountTextarea` | 글자 수 계약은 extension                               |
| Tooltip, EtcTooltip, RadixTooltip                          | `ui/tooltip`                            | 공식 portal/focus 계약 사용                            |
| ProgressBar                                                | `ui/progress`, `LabeledProgress`        | 아이콘·표시값은 extension                              |
| Icon                                                       | `src/assets/icons`, `lucide-react`      | 별도 SVG wrapper를 강제하지 않음                       |

### 새 extension으로 재구현

| 2.0 API                  | 보존하는 사용자 계약                                         |
| ------------------------ | ------------------------------------------------------------ |
| `AsyncButton`            | 로딩 중 중복 실행·submit 차단, busy 상태 발표                |
| `BusySwitch`             | 로딩 중 변경 차단, Spinner와 busy 상태 발표                  |
| `CharacterCountTextarea` | 300자 기본 제한, 글자 수, label/description/error 연결       |
| `CheckboxGroup`          | string/number 값, 그룹 disabled/error/direction              |
| `ClearableInput`         | clear, focus 복귀, prefix/suffix, native form 직렬화         |
| `ClosableTabs`           | 별도 키보드 접근 가능한 tab 닫기 action                      |
| `ComboBoxSelect`         | 기존 다중 선택, `all` sentinel, 최소 한 항목 규칙            |
| `ComboboxSelect`         | 검색형 단일 선택, clear, 목록 상단 action                    |
| `SearchSelect`           | 검색형 단일 선택 preset                                      |
| `MultipleSelect`         | 다중 선택 chips, 잠긴 항목, clear/remove                     |
| `DatePicker`             | native Date, date/month, Today, guide, min/max, clear        |
| `TimePicker`             | 12/24시간, step, min/max, DST 유효성, apply/Now              |
| `DateTimePicker`         | 날짜·시간 통합 값과 경계/step 정규화                         |
| `RangePicker`            | 완성 범위 commit, Today/1개월/3개월 및 custom preset         |
| `FileDropZone`           | drag/drop, click/open, accept, FileList, 같은 파일 재선택    |
| `ImageTile`              | loading, placeholder, accessory, hover dim, alt 의미         |
| `InputTimer`             | duration 표시와 접근 가능한 시간 문자열                      |
| `LabeledProgress`        | 값 clamp, 아이콘, 시각·접근성 percentage                     |
| `LoadingDots`            | 접근 가능한 3점 로딩 상태                                    |
| `MultipleInput`          | Enter/comma/blur commit, validation, 중복 정책, FormData     |
| `NotificationBadge`      | dot/count와 `99+` 표기                                       |
| `PaginationController`   | total/page/page-size/ellipsis/disabled 계산                  |
| `QuantityStepper`        | min/max/step와 controlled/uncontrolled 수량 변경             |
| `RequiredLabel`          | native label 연결과 장식용 필수 표식                         |
| `Tag`                    | 독립 tag와 접근 가능한 제거 action                           |
| `Typography`             | ECOYA typography token, polymorphic element, color, ellipsis |
| `DataTable`              | column, nested key, 3단계 정렬, loading/empty/row action     |

### 의도적으로 디자인 시스템에서 제외

| 기존 영역                                                    | 이동 원칙                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| Header, HeaderTitle, HeaderSubTitle, Footer                  | 제품 shell/layout에서 구성                                   |
| SideNav, NavItem, NavSubmenu, HeaderCard, HeaderPageTitle    | `../layouts/` 또는 제품 shell에서 구성                       |
| Form, FormCustom, FormCard, FormItem, FormItemLayout, Filter | `Field`와 extension을 사용하는 화면별 폼 배치로 구성         |
| FocusTrapQuantum, PortalQuantum                              | Dialog/Popover/Tooltip이 내부 제공; 독립 API로 노출하지 않음 |
| MetaPixel                                                    | 제품 analytics/integration 계층에 둠                         |
| `platform/*`, `cms/*` 전체                                   | 이미 조립된 제품 화면·도메인 컴포넌트이므로 제외             |
| StatusBadge                                                  | ERP 상태 어휘이므로 제품 계층에 둠                           |
| ToastAdapter                                                 | 제품에서는 공식 `Sonner`를 조합하고 도메인 문구만 전달       |

## 마이그레이션 규칙

1. 구 barrel import를 2.0의 명시적 UI/extension leaf import로 바꿉니다. package
   root나 extension aggregate barrel은 사용하지 않습니다.
2. 구 컴포넌트 prop을 그대로 복제하지 않고 위 대응표의 사용자 계약으로
   옮깁니다.
3. AlertDialog의 비동기 확인 버튼은 자동으로 닫히는
   `AlertDialogAction` 대신 `AsyncButton`을 사용하고 성공 후 open 상태를
   직접 닫습니다.
4. 화면 배치나 도메인 이름을 extension에 추가하지 않습니다.
5. preview에서 클래스를 덮어쓰지 말고 UI/extension 원본이 ECOYA visual role을
   직접 소비하게 합니다.
6. 변경 후 `pnpm verify`를 통과시킵니다.

기존 폴더 삭제는 제품 import가 0이 된 뒤 별도 변경으로 수행합니다. 그 전까지
기존 폴더는 참고용 동결 상태이며 2.0의 정본성을 결정하지 않습니다.

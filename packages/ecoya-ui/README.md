# @ecoya/ui

ECOYA Trade OS와 SNAP이 공유하는 웹 UI foundation입니다.

이 패키지는 제품 화면을 제한된 템플릿으로 대체하지 않습니다. semantic token, 페이지 폭·스크롤 계약, 공통 상태 표현처럼 여러 제품에서 같은 동작을 보장해야 하는 기반만 제공합니다. Deal, Task, Evidence, Report와 같은 도메인 조합은 각 제품 코드에 남깁니다.

## 현재 제공 범위

- `@ecoya/ui/tokens.css`: 공통 UI의 실제 원천값인 semantic token 및 shell/layout 변수. 앱의 shadcn/Tailwind 변수는 이 토큰을 참조합니다.
- `PageFrame`: full, wide(1440), wide-xl(1680), medium, document 콘텐츠 폭과 페이지/contained 스크롤 계약
- `PageState`: loading, empty, error, forbidden, expired 상태 표현
- `cn`: 제품과 공통 컴포넌트에서 공유하는 class 병합 유틸리티

현재 앱은 개발 중 Vite alias로 소스 패키지를 직접 소비하고, `npm run build:ui`는 `dist`의 JS·타입·CSS export를 생성합니다. npm consumer는 `@ecoya/ui`, `@ecoya/ui/layout`, `@ecoya/ui/states`, `@ecoya/ui/styles.css` 또는 `@ecoya/ui/tokens.css`만 사용합니다. 패키지 내부에는 제품 API·라우트·fixture를 넣지 않습니다.

## 로컬 빌드

```bash
npm --prefix packages/ecoya-ui run build
```

React와 React DOM은 peer dependency이며, Tailwind CSS v4의 애플리케이션 theme alias는 consumer가 공통 토큰에 연결합니다. 앱별 API와 도메인 화면을 패키지로 옮기지 않는 것이 공개 계약입니다.

# ECOYA Design System 2.0 작업 원칙

이 폴더는 `erp-doc-ui-shadcn` 저장소가 독립적으로 빌드하기 위해 포함한
디자인 시스템 2.0의 vendored snapshot이다. 정본(SSOT)은
`ecoya-products/design-system-2.0` 저장소가 소유하며, 정본 변경은 검증 후 이
폴더에 수동으로 반영한다. 런타임과 빌드는 외부 절대경로나 별도 산출물에
의존하지 않는다.

## 정본과 소비 경계

- `src/components/ui/`: 공용 shadcn primitive
- `src/components/extensions/`: primitive만으로 대체할 수 없는 공용 조합
- `src/assets/`, `src/hooks/`, `src/lib/`: 컴포넌트가 공유하는 기반
- `src/tokens.css`: 복사 시점의 ECOYA 토큰 snapshot
- `public/fonts/`: Pretendard 원본
- 제품 화면과 레이아웃은 루트 애플리케이션이 소유한다.
- `ds-bundle`, Next.js preview 앱, 캐시와 생성물은 이 패키지에 넣지 않는다.
- 이 폴더에서 공용 API를 독자적으로 변경하지 않는다. 공용 변경은 먼저 원본
  정본에 반영하고 검증된 파일을 다시 가져온다.

## import와 변경 원칙

- 공개 모듈은 `@ecoya/design-system/ui/*`, `extensions/*`, `assets/*` 같은
  package leaf export로 소비한다.
- `/Users/...` 같은 로컬 절대경로와 원본 폴더를 직접 import하지 않는다.
- 컴포넌트의 구조, 상태, 키보드 조작, 접근성과 controlled/uncontrolled 계약을
  보존한다.
- 제품 도메인 이름과 화면 전용 상태를 공용 variant로 올리지 않는다.
- 시각 값은 임의 값보다 `src/tokens.css`의 semantic/component token을 쓴다.

## 완료 조건

- 패키지 검사: `npx tsc -p packages/design-system-2.0/tsconfig.json --noEmit`
- 저장소 검사: 루트에서 `npm run lint`, `npm run build`, `npm run test:e2e`
- 토큰이나 폰트를 바꾼 뒤 `npm run sync:design-system`으로 배포 자산을 동기화한다.
- public API 또는 정본 경계를 바꾸면 `README.md`와 `MIGRATION.md`도 갱신한다.

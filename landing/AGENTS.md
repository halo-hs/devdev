# 홈페이지·마케팅 페이지 수정 지침

## 페이지별 시작점

| 요청 | 먼저 수정할 파일 | 페이지 범위 |
| --- | --- | --- |
| 홈·브랜드 스토리 | `home/page.tsx`, `home/styles.css` | `[data-landing-page="story"]` |
| Trade OS 소개 | `trade-os/page.tsx`, `trade-os/sections.tsx`, `trade-os/content.ts` | `[data-landing-page="trade"]` |
| SNAP 소개 | `snap/page.tsx`, `snap/content.ts`, `snap/hero.tsx`, `snap/illustrations.tsx` | `[data-landing-page="snap"]` |
| 가격 | `pricing/page.tsx`, `pricing/styles.css` | `[data-landing-page="pricing"]` |
| 도입 문의 | `contact/page.tsx` | `[data-landing-page="contact"]` |

홈의 문구·섹션은 `home/page.tsx`에 있습니다. 저장소 루트의 `trade-os/`와 `snap/`은 제품 업무 화면입니다. `landing/trade-os/`와 `landing/snap/`은 마케팅 소개 페이지입니다.

## 현재 공유되는 부분 — 수정 시 주의

- `shared/layout.tsx`: 공개 페이지의 공통 헤더·푸터·CTA. `auth/layout.tsx`도 여기의 `LandingHeader`를 사용합니다. 수정하면 로그인·회원가입·법률 페이지 등에도 영향이 갈 수 있습니다.
- `shared/base.css`, `shared/theme.css`, `shared/pages.css`: `shared/layout.tsx`에서 함께 import하는 CSS입니다. 홈 전용 파일이 아닙니다.
- `.trade-landing`, `.trade-container`, `.trade-section-label` 등은 여러 공개 페이지가 사용하는 선택자입니다. `.trade-landing`은 인증 헤더에도 사용됩니다.
- `data-landing-product="home"`은 홈만 구분하지 않습니다. 페이지 구분에는 `data-landing-page`를 사용합니다.
- `@shared/*`, `@ecoya/ui`, 디자인 시스템의 토큰·로고는 업무 화면에서도 사용하는 공통 자원입니다.

## 마케터의 홈 수정 기본 범위

1. 요청받은 문구·이미지·섹션을 홈 컴포넌트에서 수정합니다.
2. 홈 전용 스타일은 `home/styles.css`에서 수정하며 `[data-landing-page="story"]` 범위를 유지합니다. 공통 이미지·일러스트 규칙은 `shared/pages.css`에도 있으므로 홈 전용 변경은 `home/styles.css`에서 제한합니다.
3. 홈만 바꾸려는 작업에서 `:root`, `html`, `body`, 전역 `h1`/`button`/`a`, 공통 `.trade-*` 규칙을 수정하거나 페이지 밖으로 적용되는 override를 추가하지 않습니다.
4. 홈 문구·스타일 변경 때문에 `auth/`, `trade-os/`, `snap/`, 공통 UI·토큰·라우팅·배포 설정을 함께 변경하지 않습니다.
5. 기존 공유 이미지의 파일 내용은 덮어쓰지 않습니다. 새 홈 이미지는 `public/images/landing/home/` 등 페이지별 경로에 추가하고 홈에서만 참조합니다.
6. 공통 헤더·푸터 변경이 요청되면 소비 페이지를 확인합니다. 홈 전용 요청만으로 공통 변경 범위를 넓히지 않습니다.

## 검증

- 코드·스타일 변경: `npm run build`와 관련 기존 테스트. 홈·제품 소개에는 `tests/public-landing-pages.spec.ts`, Trade OS 동작에는 `tests/trade-landing-navigation.spec.ts` / `tests/trade-landing-playback.spec.ts`, 문의에는 `tests/contact-landing.spec.ts`를 참고합니다.
- 홈 전용 수정: `/` 데스크톱·모바일과 직접 영향받는 동작을 확인합니다.
- 공통 랜딩 CSS·헤더 수정: `/`, `/trade-os`, `/snap`, `/pricing`, `/contact` 및 이를 소비하는 `/login`, `/signup`, 법률 페이지를 확인합니다.
- 공통 UI·전역 토큰까지 수정한 경우: 실제 소비하는 Trade OS·SNAP 업무 화면도 검증합니다.

이 지침은 에이전트의 수정 범위를 정합니다. 폴더 분리나 지침 파일 자체가 CSS 격리·접근 권한·별도 빌드를 자동으로 보장하지는 않습니다.

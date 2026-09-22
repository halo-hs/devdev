# ECOYA 공개 페이지 소스 안내

현재 승인된 디자인과 콘텐츠를 유지하면서 페이지별 구현을 분리했습니다.

| 페이지 | 로컬 경로 | 페이지 소스 |
| --- | --- | --- |
| 메인 · 브랜드 스토리 | `/`, `/brand-story` | `src/features/brand-story-landing.tsx` |
| Trade OS | `/trade-os`, `/erp/landing` | `src/features/trade-landing.tsx` |
| SNAP | `/snap` | `src/features/snap-landing.tsx` |
| 도입 문의 | `/contact` | `src/features/contact-landing.tsx` |
| 가격 | `/pricing` | `src/features/pricing-landing.tsx` |

## 공통 수정 위치

- 라우팅 및 공개 페이지 연결: `src/features/common-entry.tsx`
- 헤더·푸터·로그인·시작하기 링크: `src/features/landing-shell.tsx`
- 약관·개인정보·위치기반 약관의 공통 헤더 연결: `src/components/common-public-layout.tsx`
- 브랜드 색상 및 계정 화면 배경: `src/features/trade-landing-theme.css`
- 공개 페이지 레이아웃·타이포그래피·SNAP 일러스트: `src/features/public-landing-pages.css`
- Trade OS 레이아웃 및 데모: `src/features/trade-landing.css`, `src/features/trade-product-demo.tsx`, `src/features/trade-source-sections.tsx`
- SNAP 활용 분야·FAQ: `src/features/snap-landing-content.ts`
- SNAP 상단 탭 및 활용 분야 순환: `src/features/snap-landing-hero.tsx`
- SNAP 단계별 일러스트: `src/features/snap-landing-screens.tsx`
- SNAP 자동 재생·정지: `src/lib/use-snap-preview-playback.ts`
- `public-landing-pages.tsx`는 기존 import 호환용 재내보내기 파일입니다.

## 도입 문의

헤더와 페이지 내 도입 문의 링크는 로컬 `/contact`를 사용합니다. `?product=erp` 또는 `?product=snap`으로 관심 제품을 전달할 수 있습니다.

문의 폼은 필수값·이메일·휴대폰 형식과 동의를 검사한 뒤 이메일 앱을 엽니다. 실제 발송은 이메일 앱에서 사용자가 완료하며, 서버 저장이나 자동 발송 API는 연결하지 않았습니다.

기존 GitHub Pages의 `contact/index.html`은 별도 저장소 `../ecoya-landing`에 있습니다. 로컬 React 페이지와 공개 사이트의 배포는 별개입니다.

## 검증

```sh
npm run build
npx playwright test tests/public-landing-pages.spec.ts tests/contact-landing.spec.ts --project=chrome
```

SNAP의 원문·순서는 `tests/fixtures/snap-source-copy.json`과 대조합니다. FAQ 질문·답변 7개의 순서와 동작을 포함합니다.

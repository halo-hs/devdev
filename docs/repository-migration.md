# 저장소 이전 및 기존 URL 유지

- 저장소: https://github.com/halo-hs/devdev
- 배포 URL: https://devdev-e6t.pages.dev
- 기존 Cloudflare Pages 프로젝트: `devdev`, production branch: `main`
- 앱·빌드·배포는 하나이며 기존 `/erp/*`, SNAP 경로 및 `/html/*`를 유지합니다.

## 폴더

- `landing/`: 메인·제품·가격·도입 문의와 전용 스타일
- `auth/`: 로그인·회원가입·비밀번호 찾기·무료체험 구성
- `trade-os/`: Trade OS 업무 화면·로직·운영 화면(`operations/`)
- `snap/`: SNAP 업무 화면·로직
- `packages/shared-ui/`: 공통 애플리케이션 UI·훅·유틸리티
- `packages/ecoya-ui/`: 기존 공통 레이아웃·상태 컴포넌트 패키지
- `packages/design-system-2.0/`: 기존 디자인 토큰·기본 UI (토큰 복제 없음)
- `src/`: 하나의 앱 진입점·라우팅 연결·전역 스타일·기존 이미지 자산
- `public/html/`: 기존 캡처 및 개발·디자인 참고 자료

영역 전용 배경·헤더 스타일은 각 영역의 클래스/속성에 한정합니다. `:root`나 공통 토큰을 수정해 특정 화면의 색상을 바꾸지 않습니다. 공통 컴포넌트 변경은 소비하는 영역들을 함께 검증합니다.

## 실행

Node.js 22 이상 사용.

```sh
npm ci
npm run dev
npm run build
npm run typecheck
```

`@landing/`, `@auth/`, `@trade-os/`, `@snap/`, `@shared/` 별칭은 Vite와 TypeScript에 함께 설정되어 있습니다. 화면 URL `/erp/`는 폴더명과 별개로 유지됩니다.

## 배포 — Cloudflare Git 직접 연동

기존 Cloudflare Pages `devdev` 프로젝트가 `halo-hs/devdev` 저장소에 연결되어 있습니다. `main`에 push하면 Cloudflare가 `npm run build`를 실행하고 `dist`를 배포합니다. 루트 디렉터리는 저장소 루트입니다.

- 운영 주소: https://devdev-e6t.pages.dev
- Production 자동 배포: 활성화
- GitHub Actions workflow 및 별도 GitHub 배포 토큰: 필요 없음
- `postbuild`는 배포 결과에 섞인 로컬 참고 원본·환경변수·도구 파일을 제거합니다.

직접 연동이 기본입니다. 별도 미리보기 배포가 필요한 개발자는 기존 `npm run deploy:preview`를 사용할 수 있습니다. GitHub Pages나 도메인/DNS 변경은 필요하지 않습니다.

## 이전 범위

이전 시점의 로컬 소스, 미커밋 변경, 테스트, 문서, `/html` 캡처 자산을 포함합니다. `node_modules`, 빌드 산출물, 로컬 환경변수·인증정보, 임시 브라우저 캡처는 제외했습니다. 원래 로컬 폴더와 원격 저장소는 삭제하지 않습니다.

## 이전 검증 결과

- 초기 이전 커밋: `95111cd`
- 미리보기: https://522b08ee.devdev-e6t.pages.dev
- 운영 배포: https://15f80eb3.devdev-e6t.pages.dev
- 고정 URL 유지: https://devdev-e6t.pages.dev
- 프로덕션 빌드 및 관련 Playwright 테스트 18개 통과.
- 로컬 프로덕션 주요 경로 18개와 외부 미리보기 주요 화면에서 HTTP 200, 브라우저 실행 오류 없음.
- 새 로컬 폴더: `/Users/hans/team/1-projects/halo-devdev`
- 2026-09-22 Git 직접 연결과 자동 배포를 확인했습니다. `6db1027` 빌드·배포 성공 및 주요 공개 페이지 정상 동작을 확인했습니다.

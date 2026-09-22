# 저장소 이전 및 기존 URL 유지

- 저장소: https://github.com/halo-hs/devdev
- 배포 URL: https://devdev-e6t.pages.dev
- 기존 Cloudflare Pages 프로젝트: `devdev`, production branch: `main`
- 앱·빌드·배포는 하나이며 기존 `/erp/*`, SNAP 경로 및 `/html/*`를 유지합니다.

## 폴더

- `landing/`: 메인·제품·가격·도입 문의와 전용 스타일
- `auth/`: 로그인·회원가입·비밀번호 찾기·무료체험 구성
- `trade-os/`: Trade OS 업무 화면·로직·기존 업무 참조 코드
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

## 배포

프로젝트를 새로 만들거나 삭제하지 않습니다. Git 저장소를 교체하기 위해 기존 Pages 사이트를 지우면 기존 URL 유지가 어려워집니다. 기존 프로젝트에 Wrangler로 직접 배포합니다.

```sh
npx wrangler login
npm run deploy:preview
npm run deploy
```

## GitHub 자동 배포 — 필요한 계정 설정

1. Cloudflare → My Profile → API Tokens → Create Custom Token.
2. 권한: Account → Cloudflare Pages → Edit. Account Resources는 기존 `devdev` 프로젝트가 있는 계정만 선택합니다.
3. GitHub `halo-hs/devdev` → Settings → Secrets and variables → Actions → New repository secret.
4. 이름 `CLOUDFLARE_API_TOKEN`, 값은 생성한 토큰. 토큰은 소스나 채팅에 넣지 않습니다.
5. 저장소 Actions variable `CLOUDFLARE_ACCOUNT_ID`는 이전 작업에서 설정합니다.
6. GitHub 인증에 `workflow` 권한을 추가한 뒤 `docs/ci/pages.yml.template`을 `.github/workflows/pages.yml`로 복사하여 커밋합니다.
7. Actions → Build and deploy existing Pages site → Run workflow. 이후 `main` push마다 자동 배포됩니다.

이전 시 사용 중인 GitHub OAuth 토큰에는 `workflow` 권한이 없어 활성 workflow 업로드가 거절되었습니다. 따라서 템플릿을 보관하고 수동 배포를 설정했습니다. 자동 배포는 위 연결을 마친 뒤 활성화됩니다.

토큰이 없으면 CI는 빌드만 수행하고 배포를 건너뛰었다는 경고를 표시합니다. GitHub의 빌드 성공과 실제 배포 완료를 구분해야 합니다.

Cloudflare 기존 프로젝트의 이전 저장소 자동 배포는 새 배포 검증 후 비활성화합니다. 새 저장소 배포를 옛 저장소 빌드가 덮어쓰지 않도록 하는 설정입니다. 이전 프로젝트의 배포 기록은 보존됩니다.

GitHub Pages를 활성화하거나 도메인/DNS를 바꿀 필요가 없습니다.

## 이전 범위

이전 시점의 로컬 소스, 미커밋 변경, 테스트, 문서, `/html` 캡처 자산을 포함합니다. `node_modules`, 빌드 산출물, 로컬 환경변수·인증정보, 임시 브라우저 캡처는 제외했습니다. 원래 로컬 폴더와 원격 저장소는 삭제하지 않습니다.

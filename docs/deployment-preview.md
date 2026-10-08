# 미리보기와 운영 배포

- 운영: https://devdev-e6t.pages.dev — Cloudflare Git 연동으로 main만 배포합니다. Preview deployments는 none입니다.
- 미리보기: https://halo-hs.github.io/devdev/ — GitHub Actions가 main·gh-pages를 제외한 작업 브랜치 push를 배포합니다. 별도 서브도메인을 만들지 않습니다.
- 미리보기는 하나의 공유 주소입니다. 가장 최근에 배포 완료한 작업 브랜치 내용이 표시됩니다. `/preview-version.json`에서 commit과 branch를 확인할 수 있습니다.
- 같은 작업자의 같은 작업은 열린 기존 PR의 head 브랜치에 커밋·푸시합니다. 다른 작업자는 자신의 브랜치·PR을 유지하며, 관련 없는 작업을 한 PR에 합치지 않습니다. 사용자가 새 PR 생성을 명시하면 별도로 만듭니다. 로컬 실행이나 미리보기 갱신만을 위해 새 PR을 만들지 않습니다.
- 로컬 확인은 `npm run dev`이며 GitHub·Cloudflare 배포를 실행하지 않습니다. 수동 Cloudflare 배포 npm 명령은 제거했습니다.
- main 보호 규칙은 유지합니다. PR 승인 및 검사 후 병합하면 Cloudflare 운영 배포가 실행됩니다.

## GitHub 설정

Pages source는 GitHub Actions입니다. github-pages environment는 작업 브랜치를 허용합니다. 워크플로는 contents:read, pages:write, id-token:write를 사용하고 별도 배포 토큰이 필요 없습니다.

## 경로와 검증

GitHub Pages 빌드는 GITHUB_PAGES=true로 `/devdev/` base를 적용합니다. app-location은 앱 내부 경로와 호스팅 경로를 연결하며, 404.html은 새로고침 시 원래 경로·쿼리·해시를 복원합니다. prepare-github-pages.mjs는 정적 자산 경로와 배포 버전 파일을 준비합니다. 일반 로컬·Cloudflare 빌드는 `/`를 유지합니다.

```sh
GITHUB_PAGES=true npm run build
node scripts/assets/prepare-github-pages.mjs
```

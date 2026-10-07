# 기여 방법

모든 변경은 Pull Request를 통해 `main`에 반영합니다. `main`에 직접 커밋하거나 푸시하지 않습니다.

## 작업 순서

```bash
git fetch origin
git switch -c <type>/<short-description> origin/main
# 변경 및 검증
git add <changed-files>
git commit -m "<type>: <summary>"
git push -u origin HEAD
gh pr create --base main --head "$(git branch --show-current)"
```

`main`에 병합하기 전에는 변경 범위에 맞는 빌드·검사를 실행하고 Pull Request에 결과를 남깁니다. 병합은 승인과 검사 통과 후에만 수행하며, 기본 브랜치의 force push와 보호 규칙 우회를 금지합니다.

현재 저장소의 배포 연결은 `main` 병합을 기준으로 동작합니다. 작업 브랜치의 배포가 필요하면 PR 미리보기 또는 Cloudflare Pages의 브랜치 배포를 사용합니다.

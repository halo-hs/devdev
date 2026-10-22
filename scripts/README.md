# 작업 도구

이 폴더의 파일은 설치·빌드·배포 때 실행되는 도구입니다. 웹 페이지나 API 서버가 아닙니다. 명령은 저장소 루트에서 실행합니다.

| 폴더 | 역할 | 결과 |
| --- | --- | --- |
| `assets/` | 디자인 시스템 폰트 동기화, 운영 CSS 생성, 배포 파일 정리 | `public/fonts`, `trade-os/operations/styles`, `dist` |

```sh
# 폰트 동기화: npm run dev/build에서도 자동 실행
npm run sync:design-system
```

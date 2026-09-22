# 공개 파일

Vite가 `public/` 내용을 그대로 `dist/`에 복사해 배포합니다. 소스·비밀값·작업 메모를 이 폴더에 저장하지 않습니다.

- `images/`, `fonts/`, `lottie/`: 서비스에서 사용하는 정적 자산.
- `assets/operations/`: Trade OS 운영 화면과 공개 HTML에서 쓰는 아이콘·폰트.
- `html/`: 기존 `/html/` 링크로 공유 중인 디자인·개발 전달 자료.
- `_redirects`: SPA 직접 접속 및 이전 운영 자산 URL의 호환 리디렉션.

`reference-3030/` 원본은 저장소 루트의 Git 제외 폴더에 로컬 보관합니다. 이전 `/reference-3030/assets/`, `/reference-3030/fonts/` 링크는 `_redirects`가 현재 운영 자산으로 연결합니다.

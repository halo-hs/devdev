# ECOYA devdev

하나의 서비스·앱·배포를 유지하면서 화면 영역을 나눈 React + Vite 프로젝트입니다.

```text
landing/    메인·제품·가격·문의
auth/       로그인·회원가입·무료체험
trade-os/   무역 업무 (기존 /erp 경로 유지)
snap/       현장 업무
packages/   공통 UI·디자인 시스템·토큰
src/        앱 진입점·라우팅 연결
public/     정적 파일·HTML 참고 자료
```

Node.js 22 이상에서 `npm ci`, `npm run dev`로 실행합니다. `npm run build`로 타입 검사와 프로덕션 빌드를 수행합니다.

배포 주소: https://devdev-e6t.pages.dev

배포 명령과 GitHub 자동 배포 설정은 [저장소 이전 안내](docs/repository-migration.md)를 확인하세요.

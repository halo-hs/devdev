# ECOYA devdev

하나의 서비스·앱·배포를 유지하면서 화면 영역을 나눈 React + Vite 프로젝트입니다.

```text
landing/    메인·제품·가격·문의
auth/       로그인·회원가입·무료체험
trade-os/   무역 업무 (기존 /erp 경로 유지)
snap/       현장 업무
packages/   공통 UI·디자인 시스템·토큰
src/        앱 진입점·라우팅 연결
public/     정적 파일·공유 중인 HTML 화면 자료
```

Node.js 22 이상에서 `npm ci`, `npm run dev`로 실행합니다. `npm run build`로 타입 검사와 프로덕션 빌드를 수행합니다.

배포 주소: https://devdev-e6t.pages.dev

배포 명령과 GitHub 자동 배포 설정은 [저장소 이전 안내](docs/repository-migration.md)를 확인하세요.

홈페이지 문구·이미지·디자인을 수정할 때는 [마케팅 페이지 수정 지침](landing/AGENTS.md)을 먼저 확인하세요. 공통 헤더와 CSS는 인증·다른 소개 페이지에서도 사용하므로 홈 전용 범위로 수정합니다.

## 파일 정리 기준

- `scripts/assets/`: 폰트·애니메이션·운영 CSS 생성과 배포 파일 정리.
- `scripts/capture/`: 화면 캡처 도구.
- `scripts/checks/`: 화면·HTML·링크 검사 도구.
- `scripts/handoff/`: 디자인 전달 HTML·색인 생성 도구와 관련 데이터.
- `trade-os/operations/`: 선적·정산·운영 감시·리포트의 실제 실행 코드.
- `public/assets/operations/`: 위 화면과 기존 공개 HTML에 필요한 아이콘·폰트.
- `reference-3030/`: 원본 참고 자료를 로컬에만 보관하며 Git·배포에서 제외.
- `output/`: 작업 메모·캡처·임시 산출물. Git·배포에서 제외.
- `public/html/`: 이미 공유 중인 디자인 전달 링크이므로 유지.

루트의 `package*.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`, lint·format·Playwright 설정은 설치·빌드·검사에 필요한 파일입니다. `THIRD_PARTY_NOTICES.md`는 라이선스 고지이므로 유지합니다. Netlify 설정은 사용하지 않습니다.

[개발 도구 안내](scripts/README.md) · [공개 파일 안내](public/README.md)

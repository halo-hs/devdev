# ECOYA devdev

하나의 서비스·앱·배포를 유지하면서 화면 영역을 나눈 React + Vite 프로젝트입니다.

```text
landing/
  home/       브랜드 스토리·홈 전용 스타일
  trade-os/   Trade OS 소개·데모·콘텐츠
  snap/       SNAP 소개·이미지·콘텐츠
  pricing/    가격
  contact/    도입 문의
  shared/     공개 페이지 공통 헤더·푸터·스타일
auth/         인증 화면·레이아웃·입력 검증
trade-os/
  home/       Trade OS 업무 홈
  deals/      거래 목록·상세·정산·전달
  documents/  문서 전달·첨부
  ask/        AI 업무 도구
  operations/ 선적·정산·감시·리포트·매출
  components/ 제품 전용 UI
  lib/        업무 로직
snap/
  tasks/      업무 상세
  customers/  고객
  workers/    작업자
  evidence/   증거
  reports/    리포트
  operations/ 운영
  settings/   제품 설정
  access/     접근 제어
  lib/        업무 로직
share/
  home/          공통 업무 홈 모듈
  settings/      계정·조직 설정
  notifications/ 알림
  public-link/   고객 공유 링크
packages/     공통 UI·디자인 시스템·토큰
src/          앱 진입·통합 화면·라우팅 연결
public/       정적 파일·공유 중인 HTML 화면 자료
scripts/      자산 생성·캡처·검사·디자인 전달 도구
docs/         설계·화면 설명
tests/        자동 검사
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

## 파일을 찾는 기준

각 페이지 폴더의 `page.tsx`가 시작점입니다. 마케터의 홈 문구·배치는 `landing/home/page.tsx`, 홈 전용 스타일은 `landing/home/styles.css`에서 수정합니다. `landing/shared/`와 `packages/`는 여러 페이지가 사용하는 공통 영역입니다.

`share/`는 공통 업무 화면, `packages/shared-ui/`는 공통 UI 부품입니다. `src/app/public-entry.tsx`는 공개 페이지 연결을 담당합니다.

기존의 통합 화면 구현은 `auth/screens.tsx`, `trade-os/screens.tsx`, `trade-os/extended-screens.tsx`, `snap/screens.tsx`, `src/App.tsx`에 남아 있습니다. 이번 정리는 파일 위치와 수정 책임을 정리한 것이며, 모든 기능의 코드·빌드가 독립된 것은 아닙니다.

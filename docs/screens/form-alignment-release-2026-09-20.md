# 업무 폼 정렬 배포 — 2026-09-20

- 서비스: https://devdev-e6t.pages.dev
- 최종 고정 배포: https://79520b58.devdev-e6t.pages.dev
- 캡처에 사용한 앱 배포: https://7159e26e.devdev-e6t.pages.dev
- 소스 커밋: `818c1fb95b6cbc27e42fd4e98a421e19c45b62c1`
- HTML·캡처 커밋: `52057dc`
- 보관 브랜치: `codex/form-alignment-20260920`
- 배포 작업 폴더: `/tmp/erp-form-source-release`
- Production/main 직접 배포. Git main 병합·push는 하지 않음.

## 반영 범위

문서 만들기·문서 올리기·거래 상세의 라벨과 상태 뱃지는 왼쪽, 후보 값 선택과 원본 보기는 오른쪽에 배치했다. 원본이 없는 필드는 원본 보기 버튼을 생략한다. 입력 아래에는 아이콘과 안내·오류를 표시한다. 회원가입·설정 배치는 유지했다.

배포된 앱에서 HTML 635개, 대표 캡처 87개, 모듈 캡처 117개를 갱신했다. Figma 폼 유형 보드는 39종으로 갱신했다. 기존 보관용 비교 프레임의 숨김 상태를 유지했다.

- HTML: https://devdev-e6t.pages.dev/html/erp/
- 문서 만들기 폼: https://devdev-e6t.pages.dev/html/erp/form-create.html
- 문서 올리기 폼: https://devdev-e6t.pages.dev/html/erp/form-review.html
- 거래 폼: https://devdev-e6t.pages.dev/html/erp/form-deal.html
- Figma: https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=557-2

## 검증

- 빌드·수정 파일 ESLint 통과.
- 로컬 브라우저 테스트 66개, 배포된 앱 폼 테스트 4개 통과.
- HTML 내부 링크 105,644개 검사 통과.
- 화면 탐색기, 전체 참고 HTML, 모듈 갤러리, 기획 문서 연결 검증.
- 실제 배포 파일과 로컬 빌드/폼 HTML/캡처 파일 일치 확인.

## 작업 폴더

다른 화면을 작업 중인 원래 작업 폴더는 초기화하지 않았다. 배포 소스와 전체 생성 HTML은 위 브랜치 커밋에 보관했다. 원래 작업 폴더에는 이번 폼 소스 수정, 개별 폼 HTML·캡처 4종과 이 배포 기록을 반영했다.

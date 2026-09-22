# 2026-09-18 화면 자료 갱신

- 구현 기준: `bde1327` — 모든 로컬 애플리케이션 소스 반영 배포.
- 공개 자료: https://devdev-e6t.pages.dev/html/
- Figma: https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=444-2
- 기본·상태·액션 HTML 615개, 별도 인증 화면 38개를 갱신했습니다. 독립 메뉴 개수가 아닙니다.
- Figma 대표 화면·상태 묶음 93개와 폼 비교 캡처 6개를 교체했습니다. 기존 프레임 ID와 이전 자식 노드는 숨김 상태로 보존했습니다.
- 신규 포함: 서비스 소개, 고객 수신 화면·만료·열람 한도·오류, 거래 진행 상태, 문서 승인 상태, 업로드 중복·제외·미분류 상태.
- 기존 상태 중 현재 구현에 없는 117개 링크는 이전 화면 안내와 최신 화면 연결로 바꿨습니다. `home-empty`는 현재 모듈형 홈에서 빈 상태를 구현하지 않아 이전 화면으로 표시합니다.
- 실제 동작 화면을 정적 HTML로 저장했으며 입력·저장·발송은 실행하지 않습니다. 인증 예외 중 미리보기 전용 상태는 별도로 표시합니다.
- 원본 화면 파일: `public/html/erp/manifest.json`; 캡처 목록: `captures/manifest.json`; Figma 노드 연결: `captures/figma.json`.

## 검증

- 배포 애플리케이션 홈·모바일·데모 로그인 3개, 업로드·문서 생성·거래 상태 8개 시나리오 통과.
- HTML 파일·로컬 링크 99,927개·캡처 93개 검사 통과. 캡처 페이지에 실행 스크립트 없음. 목록 뷰어만 JavaScript 사용.
- Figma 93개 이미지 채움 및 HTML 링크 존재 확인. 홈·공유·폼 비교 보드를 실제 렌더로 확인.
- 목록 뷰어 5개 화면 이동과 상태 묶음 4개 렌더 확인.
- 프로덕션 빌드 통과.

## 구현에서 확인된 참고 사항

- 문서 검토 숫자 입력에 쉼표가 있는 금액 문자열이 들어오면 브라우저의 number 입력은 빈 값으로 표시합니다. 캡처는 실제 표시를 유지했습니다.
- 정산 예외 유형 선택에서 기존 시트 오버레이가 마우스 선택을 막는 상태가 있어 키보드 선택으로 각 상태를 캡처했습니다. 애플리케이션 동작 수정 범위에는 포함하지 않았습니다.

## 재생성

1. 현재 소스의 Vite 서버에서 `scripts/handoff/export-erp-html.mjs`로 상태·액션 원본을 갱신합니다. 캡처 중 파일 쓰기로 HMR 재로드가 발생하지 않도록 캡처용 서버의 파일 감시를 끕니다.
2. `scripts/capture/capture-public-auth-handoff.cjs`, `scripts/handoff/wire-public-auth-handoff.cjs`, `scripts/handoff/localize-public-auth-assets.py`로 인증 자료를 갱신합니다.
3. `scripts/checks/audit-erp-component-inventory.py`, `scripts/handoff/build-erp-component-guide.py`로 컴포넌트 안내를 갱신합니다.
4. `scripts/capture/capture-handoff-pages.mjs`, `scripts/capture/capture-form-comparison.mjs`로 이미지를 생성하고 `scripts/checks/check-handoff-refresh.mjs`로 검사합니다.
5. Figma 노드 매핑으로 이미지와 HTML 연결을 갱신합니다. 업로드 URL은 일회용이며 저장소에 기록하지 않습니다.

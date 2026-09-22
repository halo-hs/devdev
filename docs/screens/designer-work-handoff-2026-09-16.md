# 디자이너 작업 안내 · UI·UX 개선 제안

[전체 작업 보드](https://devdev-e6t.pages.dev/html/erp/?page=designer-guide) · [Figma 작업 안내](https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=444-2)

## 디자이너에게 드리는 요청

현재 구현은 업무 흐름과 상태를 파악하기 위한 참고 자료입니다. 사용자가 다음 행동을 쉽게 이해하고 처리할 수 있도록 정보 구조, 화면 구성, 탐색 방식과 상호작용을 포함해 UI·UX 개선안을 제안해주세요. 기존 배치나 컴포넌트에 얽매이지 않아도 됩니다. 주요 업무 흐름과 상태별 동작을 함께 검토하고, 변경안의 의도와 기대 효과도 설명해주세요.

대표 업무의 시작부터 완료까지 이어지는 흐름, 예외에서 복구하는 방법, 데스크톱과 좁은 화면에서의 사용 경험을 함께 제안해주세요. 기능의 업무 목적·권한·검증 조건은 참조 문서와 함께 확인하고, 흐름 변경이 필요한 경우 이유와 대안을 공유해주세요.


## 공통 UI·UX 고민 지점

### 공통 디자인 과제 1 · 문서 업무의 폼 표현과 검증 방식

현재 문서 올리기는 아이콘으로 검토 상태를 표시하고 오류는 해당 폼 안에 표현합니다. 문서 만들기는 1열 폼과 테이블형 품목을 사용합니다. 거래 상세는 표시할 항목이 많아 2열의 펼쳐진 폼을 사용합니다.

같은 종류의 정보를 다루지만 필드, 상태 아이콘, 오류 안내, 품목 표현과 정보 배치가 화면마다 달라 사용자가 화면을 옮길 때 다시 익혀야 합니다.

세 화면에 적용할 공통 폼·검증·오류 표현 기준과 화면별로 달라져야 할 배치 기준을 제안해주세요. 모든 화면을 한 레이아웃으로 맞추기보다 업무 목적, 정보량, 읽기·편집 모드, 품목 데이터의 특성에 맞는 공통점과 예외를 설명해주세요.

- 필수·선택, 검토 필요·검토 완료, 사용자 수정·불일치·오류를 어떤 시각 언어로 구분할까요?
- 아이콘, 필드 설명, 오류 문구와 품목 행·셀 검증을 어떻게 연결할까요?
- 1열·2열·테이블, 펼침·접힘은 어떤 기준으로 선택하고 좁은 화면에서는 어떻게 바뀔까요?

**요청 산출물:** 공통 필드와 검증 규칙, 세 화면 적용 예시, 폼·테이블 오류 및 읽기/편집 상태, 데스크톱·좁은 화면 비교

### 공통 디자인 과제 2 · 오류 인지와 다음 행동 안내

실사용에서 주요 실행 버튼이 왜 비활성인지, 무엇을 완료해야 다음 단계로 넘어갈 수 있는지 이해하기 어렵다는 피드백이 있었습니다. 특히 오류 필드가 스크롤 아래에 있으면 오류를 발견하지 못해 버튼을 활성화하지 못하는 문제가 있습니다.

오류 발생 → 이유 인지 → 해당 항목 찾기 → 수정 → 실행 가능 확인 → 다음 단계로 이어지는 안내가 약합니다. 버튼 색이나 툴팁만으로 해결되는지 함께 검토가 필요합니다.

오류가 화면 밖에 있어도 필요한 행동과 위치를 알 수 있고, 수정 이후 실행 가능 상태를 확신할 수 있는 UI·UX를 제안해주세요. 입력값을 유지하면서 오류로 이동하고, 수정 결과와 다음 단계를 명확히 확인할 수 있어야 합니다.

- 검토 아이디어: 타이틀·헤더의 AI 도우미가 현재 상태, 막힌 이유와 다음 행동을 안내하면 어떨까요? AI가 필요한 부분과 일반 상태 안내로 충분한 부분도 검토해주세요.
- 검토 아이디어: 주요 버튼 옆 설명이나 툴팁으로 실행 조건을 안내하면 어떨까요? 비활성 버튼, 키보드·터치 환경에서도 확인 가능해야 합니다.
- 상단 오류·미완료 요약, 남은 항목 수, 첫 오류로 이동, 필드 강조, 고정 액션 영역 등 다른 대안도 비교해주세요. 툴팁만 열어야 필수 안내를 알 수 있는 구조는 피할 수 있을까요?
- 처음 입력, 필수값 누락, 형식 오류, 화면 밖 오류, 복수 오류, 수정 완료, 실행 가능, 처리 중, 실패·재시도, 완료 상태에서 각각 무엇을 보여줄까요?

**요청 산출물:** 실사용 문제를 해결하는 안내 패턴과 대안별 이유, 스크롤 아래 오류 발견·이동·수정 흐름, 비활성→활성→처리 중→완료/실패의 버튼·안내 상태, 데스크톱·모바일·키보드 동작 예시

## 한 페이지 구성

Figma는 ‘디자이너 작업 안내’ 한 페이지에 19개 작업 영역(17개 메뉴, 공통 사이드바, 로그인·가입·무료체험)을 섹션으로 모읍니다. Figma 섹션은 P0 → P1 → P2 순서로 한 줄 가로 정렬하고 상단과 간격을 맞춥니다. 같은 우선순위에서는 기존 메뉴 순서를 따르며 로그인·가입·무료체험은 마지막에 둡니다. HTML은 같은 작업 영역을 한 페이지에 표시하며 목차로 이동합니다. 각 영역은 주요 CTA 흐름·상태별 값 → 목록·입력·상세 → 관련 팝업·상태 캡처 순서입니다. 팝업은 실행한 화면 옆에, 좁은 HTML 화면에서는 바로 아래에 배치합니다.

‘상태별 값’과 실제 캡처를 함께 제공합니다. SSOT에 요구되지만 현재 구현에서 확인되지 않은 상태는 ‘추가 설계 필요 · 캡처 미확인’으로 표시합니다. 구현되지 않은 화면을 구현 완료 캡처로 취급하지 않습니다.

## 작업 영역

| 영역 | 대표 화면 | 바로가기 |
| --- | --- | --- |
| 공통 UI · 사이드바 | 공통 UI · 전체 사이드바 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=designer-guide#menu-common) |
| 로그인·가입·무료체험 | 공통 로그인·가입·체험·복구·법률 문서와 상태별 흐름 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=designer-guide#menu-auth) |
| 처음 시작하기 | 온보딩 · 회사 정보 입력 완료 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=designer-guide#menu-onboarding) |
| 오늘 할 일 | 홈 · AI 질문과 오늘 할 업무 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=designer-guide#menu-home) |
| 문서 올리기 | 문서 올리기 · 목록과 처리 상태 → 문서 검토 · 필드와 PDF → 문서 올리기 · 거래 연결 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=designer-guide#menu-document-upload) |
| 문서 만들기 | 문서 만들기 · 시작 화면 → 문서 만들기 · 공통 입력·품목 양식 → 확정 문서 · 공유 전 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=designer-guide#menu-document-create) |
| AI에게 묻기 | AI에게 묻기 → AI · 질문 → 결과 → 근거 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=designer-guide#menu-ai) |
| 거래 | 거래 · 공통 목록 → 거래 상세 · 업무 판단과 다음 행동 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=designer-guide#menu-deals) |
| 선적 | 선적 · 상태와 반영 검토 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=designer-guide#menu-shipments) |
| 정산 | 정산 · 거래처 잔액과 검증 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=designer-guide#menu-settlement) |
| 운영 감시 | 운영 감시 · 예외 목록 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=designer-guide#menu-monitoring) |
| 결산 리포트 | 결산 리포트 · 대시보드 위계 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=designer-guide#menu-reports) |
| 영업 성과 | 영업 성과 · 공통 대시보드 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=designer-guide#menu-sales) |
| 알림 | 알림 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=designer-guide#menu-notifications) |
| 거래처 | 거래처 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=designer-guide#menu-counterparties) |
| 증빙 | 증빙 · 목록과 연결 상태 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=designer-guide#menu-evidence) |
| 설정 | 설정 · 공통 설정 틀 → 설정 · 소속 Organization → 설정 · 조직 정보 → 설정 · 사용자 관리 → 설정 · 제품 및 구독 → 설정 · 결제 및 인보이스 → 설정 · 업무 기본 설정 → 설정 · 이메일로 문서 받기 → 설정 · 거래처 일괄 등록 → 설정 · 거래 일괄 등록 → 설정 · 거래처 별칭 학습 → 설정 · AI 사용량 → 설정 · 현장 운영 → 설정 · 브랜딩 → 설정 · 지역화 → 설정 · 데이터 및 보존 → 설정 · 알림 설정 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=designer-guide#menu-settings) |
| 요금제 | 요금제 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=designer-guide#menu-billing) |
| 토큰 | 토큰 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=designer-guide#menu-tokens) |

## 누락 화면 보완

- 전체 사이드바: 제품·조직 영역, 기본 업무, 기록, 경영·성과, 하단 사용자·설정·지원.
- 온보딩: 회사 정보 이후 관심 정보, 기존 문서 가져오기, 추천 거래처 검토, 설정 완료.
- 문서 업무: 처리 대기·재시도, AI 참조 없음·최신 데이터 대기, 품목 개별 삭제, 승인자 역할별 결과.
- 거래: 거래 만들기 팝업과 목록·상세 이후 문서 만들기·공유 CTA.
- 선적: 하단 선적 목록까지 전체 내용, 날짜 검증 오류·반영 완료, 재반영, 컨테이너 불일치·SNAP 연결 충돌·원문 확정 취소 검토, 처리 이력.
- 정산: 자금 일정·현금 일정·전망·리스크·거래처별 AR/AP·원장·GP/인계 준비도·수익성 롤업까지 전체 내용. 입금·지급 기록, 초과금·금액 조정·환불/반환·분쟁·대손 패널.
- 결산: 마감 차단과 누락 문서 확인 완료 상태.

추가한 팝업·상태와 공통 인증 화면은 실제 구현 화면의 캡처 이미지입니다. Figma의 공통 과제·CTA·상태 안내는 편집 가능한 텍스트이며, 세부 화면 내용과 링크는 HTML에서 확인할 수 있습니다.

## 참고 자료와 관리

원본 반복 캡처와 기존 HTML 링크는 참고용으로 유지합니다. Approval은 Pilot 기본 비활성이므로 승인 활성 모드의 역할별 행동과 구분합니다. 온보딩의 ECOYA Demo Co. 값은 디자인 확인용 샘플입니다.

메뉴 순서는 `scripts/handoff/erp-designer-menus.json`, 대표 화면·관련 팝업은 `scripts/handoff/erp-designer-work.json`, CTA 흐름과 상태별 요구사항은 `scripts/handoff/erp-designer-flows.json`에서 관리하며 공통 디자인 과제는 `scripts/handoff/erp-designer-concerns.json`에서 관리합니다. 정렬 간격은 전달 자료의 가독성을 위한 것이며 제품 디자인의 고정 제약이 아닙니다.

## 사이드바·인증 보완

- 사이드바: 제품·조직 전환, 제품별 요금제, 알림, 프로필·사용량·요금제·언어·로그아웃, 설정·고객지원과 접힘·모바일 메뉴 상태를 포함합니다. 조직 관리 미연결, 언어 실제 적용과 제품별 목적지 문제는 추가 설계 항목으로 구분합니다.
- 로그인·가입·무료체험: 최신 공통 ECOYA 공개 화면 6개와 관련 상태 33개를 반영했습니다. HTML의 주요 CTA는 정적 상태 파일로 연결되며, Figma는 대표 화면 옆에 해당 상태를 배치합니다. 계정·네트워크·승인·세션 예외와 복구 재설정은 로컬 미리보기 출처를 표시했습니다. 무료체험은 제품 선택·가입 진입까지이며 실제 활성화 결과는 미구현입니다. 약관·개인정보는 법무 승인본 준비 상태입니다.
- Figma의 19개 영역 안내는 왼쪽 주요 CTA 흐름, 오른쪽 상태 칩·추가 설계 항목, 하단 원본 링크·참조 문서로 통일했습니다. 텍스트와 칩은 편집할 수 있습니다.

## 공통 공개 화면 갱신 방법

현재 공개 화면 목록은 `scripts/handoff/erp-public-auth-captures.json`에서 관리합니다. 정적 파일에는 입력값·상태를 보존하고 주요 CTA를 다른 HTML 상태로 연결했습니다. 실제 가입·메일 발송·결제 작업은 수행하지 않습니다. 공개 서비스·요금제 등 이번에 캡처하지 않은 사이트 링크에는 원본 페이지임을 표시합니다.

```sh
# 같은 커밋의 Vite를 4185번 포트에서 실행한 상태
node scripts/capture/capture-public-auth-handoff.cjs
python3 scripts/handoff/localize-public-auth-assets.py
node scripts/handoff/wire-public-auth-handoff.cjs
```

캡처 후 `writeErpHtmlIndex`로 작업 보드와 화면 목록을 갱신합니다. 공개 페이지 CSS는 독립된 정적 HTML 안에서 적용하여 기존 ERP 캡처의 스타일을 바꾸지 않습니다. 작업 안내의 미리보기는 해당 HTML을 불러오며, 원본 링크에서 구조와 텍스트를 직접 확인할 수 있습니다.

## 공통 컴포넌트와 업무 UI 작업 범위

[현재 구현 기준 작업 안내](https://devdev-e6t.pages.dev/html/erp/designer-component-guide.html) · [Figma 안내](https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=527-2)

기존 562개 HTML에서 공통 컴포넌트 사용 흔적과 직접 구현 후보를 확인했습니다. 디자이너 안내는 공통 재사용 / 업무 UI 조합으로 나누고 테이블은 별도 작업으로 정리했습니다. 그래프도 포함하며 사이드바는 기존 공통 재사용 항목입니다. 기존 디자인 파일의 복잡한 분류는 적용하지 않습니다. 상세 근거는 `ui-component-inventory-562.json`, 요약은 `ui-component-work-scope.md`에 있습니다.

구현 확인 목록과 안내를 갱신할 때는 `python3 scripts/checks/audit-erp-component-inventory.py` → `python3 scripts/handoff/build-erp-component-guide.py` 순으로 실행한 다음 `writeErpHtmlIndex`를 실행합니다. 분류와 작업 요청 문구의 원본은 `scripts/handoff/erp-designer-component-boundaries.json`입니다.

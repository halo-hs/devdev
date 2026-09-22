# Common / ERP / SNAP SSOT 구현 체크리스트

기준일: 2026-08-01  
기준 원문: `/Users/hans/team/1-projects/ecoya-products/ecoya 2.0`

## 구현 원칙

- Common은 인증, 법적 동의, 조직 컨텍스트, 멤버십을 제품 밖의 공통 흐름으로 제공한다.
- ERP는 문서 유입, 확인, 거래, 전달, 정산과 운영 판단을 하나의 업무 흐름으로 연결한다.
- SNAP은 현장 배정, 수행, 증거 등록, 검토, 승인, 배포와 ERP 연결을 별도 제품 맥락에서 제공한다.
- 제품 entitlement가 없으면 메뉴를 숨기고 직접 URL 접근도 거부한다.
- Platform Ops는 고객 조직 역할과 분리된 보안 경계로 취급한다.
- 확정, 승인, 배포된 사실은 수정 가능한 현재 값과 분리해 동결 버전과 이벤트 이력으로 보존한다.
- 모든 비동기 작업은 진행, 성공, 재시도 가능 실패, 영구 실패 상태를 표현하고 입력값을 보존한다.

## Common 화면

| ID    | 화면              | 프로토타입 상태 | API 연결 기준                                               |
| ----- | ----------------- | --------------- | ----------------------------------------------------------- |
| CS-01 | 로그인            | 구현            | 세션 생성, provider 오류, 조직 없음, 승인 대기              |
| CS-02 | 회원가입          | 구현            | identity, 약관 버전, 조직 provisioning, 부분 실패 재개      |
| CS-03 | 비밀번호 복구     | 구현            | 계정 존재 여부 비노출, 30분 토큰, 기존 세션 폐기            |
| CS-04 | 이용약관          | 구현            | 공개 버전, digest, 시행일, 동의와 열람 분리                 |
| CS-05 | 개인정보 처리방침 | 구현            | 공개 버전, digest, 시행일, 보관 정책 링크                   |
| CS-06 | 계정·프로필 허브  | 구현            | 사용자 정보, 언어, 보안, 제품 entitlement                   |
| CS-07 | 조직 컨텍스트     | 구현            | 0·1·N 조직, 전환 후 제품 캐시 무효화                        |
| CS-08 | 멤버·초대         | 구현            | invited → accepted → pending_approval → active 및 종료 상태 |

## ERP 화면

| 범위      | 화면                                     | 프로토타입 상태  | 핵심 확인                                      |
| --------- | ---------------------------------------- | ---------------- | ---------------------------------------------- |
| ERP-01~06 | 랜딩, 로그인, 가입, 초대, 약관, 개인정보 | Common 연계 구현 | 제품 진입 전 공통 정책과 ERP entitlement       |
| ERP-07~09 | ERP 진입, 온보딩, 오늘 할 일             | 구현             | 역할별 첫 업무와 다음 행동 하나                |
| ERP-10~13 | 파일 유입, Confirm, Copilot, Monitor     | 구현             | 유형 판별 실패, 중복, 재처리, 원문 대조        |
| ERP-14~16 | 거래 목록, 거래 상세, 거래처 360         | 구현             | 거래 기준값, 출처, 다중 문서 대조, 관계자      |
| ERP-17~20 | 생성 문서 목록·작성·전달·공개 공유       | 구현             | 일반 문서 승인, 링크 상태, 외부 계정 없는 열람 |
| ERP-21~23 | 정산, 선적, SNAP 증거                    | 구현             | 불변 지급 이벤트, reversal, 문서·현장 증거     |
| ERP-24~27 | 결산, 영업 성과, Intelligence, Sales     | 구현             | 숫자 전체 표시, 근거와 후속 작업               |
| ERP-28~35 | 고객 설정 8종                            | 구현             | 권한, 파괴적 작업 확인, 보관, inbound email    |
| ERP-36~37 | 결제, 토큰                               | 구현             | 플랜 구분, 사용량, 실패·유예 상태              |
| ERP-38~44 | Platform Ops 7종                         | 구현             | 고객 역할과 분리, 복구·오프보딩·AI worker      |

## SNAP 화면

| 범위     | 화면                                                              | 프로토타입 상태 | 핵심 확인                                   |
| -------- | ----------------------------------------------------------------- | --------------- | ------------------------------------------- |
| SC-01~09 | 랜딩, 가격, 법적 문서, 인증·가입 상태                             | 구현            | 조직·역할·승인 상태별 진입                  |
| SC-10~16 | 온보딩, 초대, 작업자 실행, 외부 업로드, 고객 보기, 검증, 미리보기 | 구현            | 원본 불변, 공개본 워터마크, fail closed     |
| SC-17~23 | 대시보드, 작업 목록·생성·상세, 고객 리포트, 리포트, 증거          | 구현            | 배정→제출→검토→승인→배포                    |
| SC-24~30 | 고객, 캘린더, workflow, ERP handoff, 작업자, 시정조치, 설정       | 구현            | 상태 정합성, 재작업, ERP 연결               |
| SC-31~37 | Platform Ops 7종                                                  | 구현            | 별도 운영 권한과 tenant 지원                |
| SC-38~44 | capture-first, 작업자·관리자 전용 흐름                            | 구현            | 모바일 우선, 현장 시작, 관리자 action panel |

## 상태 및 예외

- 인증: idle, submitting, authenticated, rejected, no organization, pending approval, provider error, session expired.
- 초대: invited, accepted, pending approval, active, revoked, expired, rejected.
- Confirm: 유형 미확정, OCR 진행, 필드 검토, 충돌, 중복, 실패, 재처리, 완료.
- 거래: active, blocked, cancelled, archived를 분리하고 보관·복구 가능 여부와 이유를 기록한다.
- 전달: draft, issued, revoked, expired, pending, retry scheduled, sent, permanent failed.
- 정산: planned, partially paid, paid, overdue, reversed. 표시값을 저장·재계산 입력으로 사용하지 않는다.
- SNAP: draft, clarified, human confirmed, assigned, submitted, office review, approved, published/delivered.

## 검증 결과

- [x] Common 8개, ERP 44개 범위, SNAP 44개 화면을 제품 선택기와 기존 업무 메뉴에서 직접 접근할 수 있다.
- [x] 1280px 이상, 768px, 390px에서 핵심 CTA, 화면 선택기, 긴 이름의 배치와 스크롤을 확인했다.
- [x] 빈 상태, 로딩, 권한 거부, 오류, 재시도와 영구 실패를 대표 상태별로 제공하며 해결 행동을 함께 표시한다.
- [x] 빌드와 린트가 통과한다.
- [x] Common CS-08 멤버·초대, ERP-44 AI 작업 운영, SNAP SC-44 매니저 액션까지 종단 화면을 직접 열어 확인했다.
- [x] 종단 화면의 브라우저 콘솔 오류와 경고가 0건임을 확인했다.
- [x] SNAP 원본 Go 라우트와 일치하는 공통 요청 경계, 인증 주입, 공개 링크, 전달, 외부 업로드, 무결성 검증 API adapter를 추가했다.
- [x] SNAP 전체 업무 route를 도메인 client로 노출하고 401 token 갱신, POST 멱등성, multipart 업로드, blob 다운로드 공통 규칙을 반영했다.
- [ ] SNAP 관리자 목록·상세의 fixture를 `snapApi` 조회 응답 DTO로 교체한다. 화면 상태와 mutation 위치는 유지하고 데이터 공급자만 교체한다.
- [ ] Common·ERP fixture는 각 제품 백엔드 응답 DTO로 이전한다. SNAP과 다른 서버 계약을 한 클라이언트에 섞지 않는다.

### 시각 검증 산출물

- `output/playwright/common-desktop.png`
- `output/playwright/erp-extended-desktop.png`
- `output/playwright/snap-desktop.png`
- `output/playwright/erp-extended-768.png`
- `output/playwright/erp-extended-390.png`
- `output/playwright/snap-390.png`
- `output/playwright/common-390.png`

# Trade OS 시작 가이드 — 프로토타입과 백엔드 연결 체크리스트

기준: Common CF-07, Trade OS SC-08 / FS-13. 사용자 결정(2026-10-08): 현재 저장소는 임시 데이터를 사용하는 프로토타입이며, 시작할 때 메뉴가 보이고 모든 적용 항목을 마치면 메뉴가 사라진다. 백엔드 저장소는 없다.

## 현재 실행 범위

- 로컬 계정 `preview-account` × 선택 조직별 브라우저 저장. OWNER/ADMIN 6개, MEMBER 4개.
- 조직 안내는 실제 대상 입력/초대 버튼이 보이고 설명이 표시될 때 완료. 실제 수정/초대 전송 불필요.
- 문서 수신/검토/거래 확정 시점과 명시적 답변 근거 확인을 연결. 다른 문서·거래의 사건은 무시.
- 진행 중 메뉴 재개, 전체 완료 시 메뉴 숨김 및 직접 `/erp/onboarding` 진입을 홈으로 이동. 마지막 완료 직후에는 현재 업무 화면 유지.
- 초대·PDF 추출·AI 답변은 기존 로컬 예시 기능. 업로드한 파일이나 예시 PDF의 실제 서버 분석이 아니다.
- 오류를 0/N으로 덮지 않고 재시도. `access: read-only/revoked`의 진행은 보존하고 가이드 실행 제한.
- 한 단계 안내는 명시적 CTA의 일회성 session intent로 실행. 일반 URL/새로고침에서는 자동 재실행하지 않음.

## 교체 지점

| 코드 | 현재 임시 구현 | 백엔드 연결 시 교체 |
| --- | --- | --- |
| `trade-os/onboarding/state.ts` | receipt 기반 진행 계산 / JSON 검증 | 서버 projection DTO와 검증. 클라이언트 입력만으로 완료 승인하지 않기 |
| `trade-os/onboarding/runtime.tsx` | localStorage 읽기/저장, sessionStorage intent | 인증된 progress 조회, intent 발급·소비, receipt 제출 API |
| `src/App.tsx` | `preview-account`, 미리보기 역할·조직, 업로드 타이머 / 로컬 Confirm | 실제 Account·Organization·role/capability 및 domain 성공 응답 |
| `share/settings/page.tsx` | 예시 조직 입력/초대 target | 현재 조직 데이터 로드와 권한 검증 후 education receipt |
| `share/home/overview.tsx` | 선택 거래·문서에 연결된 예시 답변과 확인 버튼 | 실제 deal 범위 AI 응답·근거 렌더·사용자 확인 receipt |
| `trade-os/onboarding/page.tsx` | 위 runtime의 진행과 다음 행동 표시 | 서버가 허용한 action/target/사유를 소비 |

## API 계약에서 확정할 필드

아래는 **필요한 계약 항목**이며 이미 존재하는 API 주소가 아니다. 기존 레거시 `/admin/onboarding`의 `hide_checklist` 등으로 대체하지 않는다.

- [ ] `account_id`, `organization_id`, `product`, `definition_version`: 서버 인증 context. query/로컬 역할은 권한 근거로 사용하지 않기.
- [ ] `applicable_items`, `completed_count`, `total_count`, `all_complete`: 역할별 6/4, 역할 변경 시 receipt 유지 후 재계산.
- [ ] 항목별 `status`, `allowed_action`, `target`, `reason`, `receipt_id`, `completed_at`.
- [ ] `document_id`, `extraction_status`, `review_receipt_id`, `deal_id`: 같은 문서에서 파생된 거래 lineage. 파일 이름 대신 불변 서버 ID 사용.
- [ ] `answer_id`, `source_deal_ids`, `render_receipt`, `confirmation_receipt`: 동일 거래의 근거 있는 답변만 T4 인정.
- [ ] `capabilities`, `product_access`, `read_only_reason`: seat·trial·구독과 가이드 진행 상태 분리.
- [ ] `first_entry_status`(미진입 확인/진입 확인/미확인), 제품별 마지막 진입 이력. 메뉴 표시 정책과 강제 리다이렉트는 분리.
- [ ] `revision` 또는 ETag, 멱등 키, 서버 시간: 다중 탭·기기 동시 수정과 단조 증가 보장.

## 서버에서 만들 기능

- [ ] **진행 조회**: Account×Organization×Product, Common C1/C2는 Account×Organization 공유. 조회 실패를 초기화로 해석하지 않기.
- [ ] **진입 기록**: 허용된 업무/가이드 화면 진입을 멱등 기록. 기존 사용자 이관, 재로그인 홈, 명시적 업무 링크 우선. 메뉴 노출과 항목 완료를 분리.
- [ ] **guide intent 발급**: 항목 권한·버전·현재 anchor 확인 후 same-origin 목적 route, stable target, 만료 시각, 일회 토큰 반환.
- [ ] **intent 검증/소비**: 목적 화면 인증/조직/객체 접근 재검증. 복사 URL·재사용·권한 회수 차단. 성공/종료 소비 기록.
- [ ] **C1/C2 education receipt**: 허용 target과 설명이 렌더되었음을 검증. 실제 조직 수정/초대 성공도 인정하되 mutation 강제 금지.
- [ ] **T1 domain event**: 파일 생성 성공 + quickstart anchor 연결. 크기/형식/암호/중복 검증 실패는 완료 아님.
- [ ] **T2 receipt**: anchor 원문·AI 결과 렌더 및 사용자 검토 확인. 다른 문서 확인으로 완료 불가.
- [ ] **T3 domain event**: 같은 anchor Confirm/거래 연결 commit 성공, `deal_id` 확정. 멱등·revision 검증.
- [ ] **T4 receipt**: 같은 거래 범위 질문, 같은 거래 근거 답변 렌더, 명시적 사용자 확인. 예시/빈/오류 답변 제외.
- [ ] **진행 갱신 전달**: 폴링/SSE/query invalidation 등 선택. 현재 업무는 유지하고 마지막 완료 시 LNB 메뉴만 숨김.
- [ ] **저장·복원**: 로그아웃/기기 변경/조직 전환 후 서버 진행 복원. 로컬 JSON은 제품 데이터로 이관하지 않기.
- [ ] **접근 회수**: 객체 정보 숨김, 시작 action 차단, 진행 보존. capability 회복 후 같은 anchor 재개.
- [ ] **문서 삭제·실패 복구**: anchor 접근 불가 사유 및 허용 복구 동작 반환. 다른 문서를 몰래 anchor로 바꾸지 않기.

## 임시 값과 검수

저장 키: `ecoya.preview.start-guide.v1:preview-account:<workspaceId>`. 값 구조는 `GuideState`; 예시 role은 기존 URL `?role=member/admin`를 사용한다. 이 값과 `access`는 프로토타입 시나리오일 뿐 인증·구독 권한이 아니다. 브라우저 데이터 삭제 시 초기화되고 타 기기에 동기화되지 않는다.

`tests/start-guide.spec.ts`에서 역할별 항목, 조직 안내 대상/재실행 방지, 예시 PDF/동일 문서 재개, 완료 후 메뉴·직접 URL, 조회 오류, 읽기 전용, 다른 문서·거래 receipt 배제를 검증한다. 실제 서버 동시성/인증/네트워크 실패 검증은 서버 연결 뒤 추가한다.

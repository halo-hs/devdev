# 설정 화면 복구와 SSOT 대조 — 2026-10-08

## 확인된 누락

배포된 main `9cfca2e`는 `share/settings/page.tsx`의 예전 메뉴를 사용했다. 조직 정보·Trade OS 업무 기본값·ERP 멤버를 한 페이지에 묶고 SNAP 멤버는 `/workers`로 별도 안내했다.

10월 1일 22:14:44 KST 백업 `bcb6b6c`에는 분리된 설정 IA와 통합 사용자 관리가 남아 있다. 구체적으로 다음 두 파일이다.

- tracked: `bcb6b6c:src/features/workspace/settings.tsx`
- 당시 untracked 파일 트리: `5b574f3:src/features/workspace/subscription-settings.tsx`

현재 저장소의 폴더 체계는 `share/settings/`다. 이전 문서 UI 복구 및 PR #40의 통합에는 위 두 설정 파일이 포함되지 않았다. stash 자체는 보존하고 필요한 파일만 현재 경로로 이식했다. 이 기록은 소스 누락의 근거이며, 과거 직접 배포의 정확한 시각을 증명하는 것은 아니다.

## 기준

`hrm-corp/ecoya-products`의 `origin/dev` `7760550`을 확인했다. Common SSOT의 다음 문서를 사용했다.

- `02-COMMON-IA.md` — 최종 설정 IA
- CS-06 — 최종 메뉴·설정 허브
- CS-08 / CS-14 / CS-15 — 통합 사용자 관리·좌석·초대
- CS-13 — 조직 정보와 Trade OS 업무 기본 설정의 분리
- CS-20 — 제품 및 구독·Owner 빌링·Admin 읽기 전용 금융 조회

CS-14의 공개 캡처 설명은 과거 화면의 관찰 기록이다. 최종 IA의 사용자 관리 독립 메뉴 계약보다 우선하지 않는다. 이 변경은 새 정책이나 문구 결정을 SSOT에 추가하지 않는다.

## 복구한 화면과 주소

| 메뉴 | devdev 화면 |
| --- | --- |
| 조직 정보 | `/erp/settings?section=organization` |
| 사용자 관리 | `/erp/settings?section=members` |
| 제품 및 구독 | `/erp/settings?section=products` |
| Trade OS 업무 기본 설정 | `/erp/settings?section=trade-defaults` |

이 query는 기존 데모의 메뉴 식별자를 복구한 것이다. 실제 제품 서버의 최종 route 계약으로 확정하지 않는다.

- 일반·조직·Trade OS·SNAP 구획과 단일 깊이 메뉴 복구.
- 제품별 전체·배정됨·배정 가능 좌석 → 권한 요청 요약 → 검색·초대 → 멤버 목록.
- 동일 목록에서 조직 역할과 두 제품의 독립 Seat 배정을 표시. SNAP App User는 이 목록에 합치지 않음.
- 요청 있는 타인의 제품은 승인·거절로 처리하고, 요청 없는 제품은 배정·회수 메뉴 사용.
- Admin 본인 미배정 Seat 배정 허용, 자기 역할·제거·본인 회수 및 다른 관리자 변경 금지.
- 승인·거절 후 요청 필터 안에서 처리한 행 유지, 좌석·요청 건수 즉시 갱신.
- 모바일에서 멤버 행을 카드로 표시. 사이드바는 왼쪽, 본문만 최대 1440px 중앙 정렬, 흰색 배경 및 제목 구분선.
- Owner 빌링 진입, Admin 금융 읽기 전용, Member 금융 정보 비노출. 요금 변경은 별도 본문 상태로 제공.

## 검증 범위와 제한

이 저장소는 공개 디자인 데모다. 복구한 좌석·역할·요청은 데모 상태로 동작하며 실제 서버의 권한이나 과금 완료를 증명하지 않는다. 초대 발송, 조직 제거, 전체 로그아웃, Paddle 포털·견적은 연결이 없을 때 성공으로 표시하지 않는다. Organization/역할 전환 시 데모 상태를 초기화한다.

검증: 앱 빌드, 변경 파일 ESLint, `tests/settings-contract.spec.ts`의 메뉴 직접 진입·권한·본인 배정·요청 처리·구매 미확정·모바일 검사. 실제 운영 배포 여부는 PR 병합 SHA 및 Cloudflare 배포 결과로 별도 확인한다.

관련 이슈 #36은 복구한 메뉴/좌석 외에도 알림 규칙·가져오기 등 별도의 항목을 포함하므로 전체 해결로 닫지 않는다.

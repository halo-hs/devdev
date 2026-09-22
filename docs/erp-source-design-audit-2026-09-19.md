# ERP 전체 원본·디자인 대조 결과 — 2026-09-19

[실행 계획](./erp-source-design-ssot-plan-2026-09-19.md) · [42개 원본 경로·61개 API client 인벤토리](./screens/erp-source-contract-inventory-2026-09-19.json)

## 판정 범위

원본은 `http://localhost:3030/erp/documents`, 실행 FE는 `ecoya-platform-user-frontend`의 `e7eb2d426f513735def75dc130a5436a8b0ed083`와 미커밋 작업이다. 디자인은 이 저장소 `7b2344813308294bd3027f1913d77c33ec8e427b`와 미커밋 작업이다. 공개 디자인 `https://devdev-e6t.pages.dev/erp/`는 이번 변경을 아직 포함하지 않는다.

홈 DND·모듈 구조, 문서 만들기·문서 올리기·거래 상세의 UI 구조를 보존했다. 선적·정산·모니터·리포트·영업성과까지 전체 ERP 메뉴를 대조했다. stage·commit·push·배포·Figma 쓰기는 하지 않았다. 로컬 프로토타입 회귀와 실제 서버 저장/OCR/메일 성공을 구분한다.

## 소스 우선 반영

- 원본 FE: 누락된 `GET /api/platform/trade/settlement/overpayments` BFF 복구. 기존 backend 계약, query·Bearer·no-store·upstream 응답 보존. 실브라우저 200.
- 원본 dev server: 멈춘 Next compile 복구. `.next/dev`를 별도 이름으로 보존한 뒤 새 dev cache 사용.
- 디자인: 생성 문서 업무/승인 상태 분리, 복제 승인 초기화, 활성 Member 조직 문서 전달, 숫자 저장값 표시, PDF 5개·파일당 50MB 사전 검사.
- 디자인: 선적·정산·위험·증거 등에서 선택 Deal ID 전달/상세 반영, 정산 처리 상태를 일정 ID로 분리, Owner 모니터 접근, 원본 route·설정 section aliases 보완.
- 자료 생성: hardcoded commit 대신 현재 commit·dirty 상태·source fingerprint 기록. export cache·capture HTML·보조 패널의 출처 불일치를 차단. 보조 패널은 동일 로컬 앱에서 생성. 보호 UI 안내를 디자이너 자료에도 적용.

## 실행 검증

| 기준 | 결과 |
|---|---|
| 원본 full tests | 989 files / 10,602 tests PASS. 기존 한글 경로 Vitest alias 문제는 임시 decoded alias config로 우회 |
| 원본 lint / build / diff / contract / cache | PASS. BFF 410 routes·469 methods·315 client paths, contract failure 0 |
| 독립 code/security + architect | 각각 APPROVE·BLOCKER 0 |
| 디자인 ERP 회귀 | 118 tests PASS; 후속 최종 reference 14 tests PASS. 중복을 포함하므로 132개 고유 테스트가 아님 |
| 디자인 build | PASS, 16.80초. 기존 CSS/lottie 경고 유지 |
| 디자인·SSOT 독립 후속 리뷰 | BLOCKER 0. stale HTML capture 거부 재현 |
| 정적 HTML·PNG·링크 | ERP 636 pages·capture 93·local links 103,117·failure 0. 주요 13화면 JS-disabled smoke 오류 0 |

## 확인된 차이와 미검증

- 디자인은 `prototypeBackend`/localStorage 기반이다. 실 API 연결이 끊긴 것으로 오인하지 않고 원본 계약과 상태·행동 의미를 대조했다.
- 원본 `/erp/sales`는 CRM, 디자인 `/erp/sales`는 영업성과다. 원본 `/erp/sales-performance` alias를 추가했지만 CRM을 구현했다고 주장하지 않는다.
- 운영자 8개 화면, 승인 정책 전용 설정, 동적 거래처 360, 수신 비용 문서 후속 비용 제안·계약 단가 원문 정정, 취소 문서 필터에는 대응 차이가 남는다.
- `DL-260625-03`, `DL-260512-08`, `DL-260701-04` 상세 fixture가 없다. 선택 ID를 보존하고 not-found·목록 복귀를 보여 주며 다른 거래로 대체하지 않는다.
- 원본 최근 경로 PUT 401은 local dev identity의 platform identity 부재, 시장 지표 502는 실행 DB `app_user`의 view SELECT 권한 부재(SQLSTATE 42501), 샘플 PDF 404는 seed 원본 파일 누락이다. 인증·DB 권한을 우회하거나 문서 파일을 발명하지 않았다.
- 실제 Firebase 권한·운영자 허용·업무 쓰기·OCR/LLM·메일/결제와 공개 배포는 이번 로컬 검증으로 완료 판정하지 않는다.

## SSOT 반영

Products `ecoya 2.0/delivery/PROGRAM-TRADE-FINANCIAL-EVIDENCE-OS/STABILIZATION/qa-evidence/2026-09-19-erp-design-sync/README.md`에 전체 경로표·장애 원인·검증 기록·독립 리뷰·실브라우저 조회를 보존했다. Trade SSOT screens README와 SC-09·10·11·17·21·22 QA 항목을 연결했다. 제품 정책·기존 OPEN·release baseline을 변경하지 않았고, 동결된 `developer-reference/`는 보존했다.

## 최종 산출물

[HTML manifest](../public/html/erp/manifest.json) · [capture manifest](../public/html/erp/captures/manifest.json) · [작업 자료 인덱스](../public/html/erp/index.html). source fingerprint `0a3d62f48942027060b605e514750f72f6d78d9ab64a3959e603034eed9a3a60`가 현재 소스·HTML·capture에서 일치한다. 보조 패널 6개도 같은 로컬 출처다. 기존 auth/public HTML 38개는 종전 출처를 보존하며 해당 PNG 슬롯만 다시 캡처했다. 홈·업로드·만들기·거래 상세·모니터의 대표 렌더를 육안 확인했다. 전체 diff check 통과.

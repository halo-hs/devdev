# 2026-08-01 최신 SSOT 동기화 체크리스트

## 기준

- 최신 제품 기준: `/Users/hans/team/1-projects/ecoya-products/ecoya 2.0`
- 권한 기준: `ECOYA-Trade-OS-SSOT-v1.0/04-PERMISSIONS.md`
- 화면 기준: `ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens/`
- 구 `ecoya-erp-v2` 코드는 기능 계보 확인용이며 신규 구현의 최종 기준으로 사용하지 않는다.

## 이번 반영 완료

- [x] 문서 목록 상태를 `전체 / 작성 중 / 확정 / 발송됨`으로 통일
- [x] Pilot 기본값에서 Approval mode를 비활성화하고 승인 요청·승인·반려 UI를 숨김
- [x] Approval mode가 꺼져 있을 때 문서를 승인 없이 확정할 수 있도록 CTA 조건 정리
- [x] 화면 역할을 `Owner / Admin / Member`로 통일하고 `Manager` 제거
- [x] Member 홈 업무 범위에서 관리자 전용 업무와 승인 업무 제거
- [x] Member 영업 성과에서 거래처명, 담당자별 GP, 마진 및 원시 성과 행 제거
- [x] 정산 상태를 `미정산 / 정산 완료 / 정산 대상 아님`으로 명시
- [x] 정산 의무가 0건인 거래는 `정산 대상 아님` 및 조회 전용으로 표시
- [x] 취소 거래는 삭제하지 않고 `취소 거래 포함` 필터로 조회 가능하게 표시
- [x] 정산 완료 건의 완료 취소 및 부분 입금·지급 기록 흐름 유지

## 백엔드 연결 시 필수 계약

- [ ] 조직별 `approval_mode_enabled`를 읽어 승인 UI를 조건부 노출
- [ ] 문서 상태 enum을 `draft / confirmed / sent`로 제공하고 화면 문구와 매핑
- [ ] 권한 응답은 `owner / admin / member`만 반환
- [ ] Member 집계 API는 직접 담당·협업 범위만 반환하고 거래처명·마진 원시 행을 제외
- [ ] 정산 대상 판정 API는 필수 의무 수와 판정 근거를 함께 반환
- [ ] 취소 거래와 완료 거래를 원장에서 보존하고 read-only 여부를 반환
- [ ] 부분 입금·지급, 수수료, 환불, 조정, dispute, cash application 이력을 별도 ID로 보존
- [ ] 통화가 다른 금액은 자동 합산하지 않고 통화별 소계를 반환
- [ ] 금액 계산 원본 정밀도와 화면 표시 정밀도를 분리

## 다음 점검에서 제외 가능한 항목

아래 항목은 이번 날짜 기준으로 코드와 체크리스트 확인을 마쳤으므로 회귀가 없으면 재분석하지 않는다.

- 문서 상태 탭 명칭
- Pilot Approval mode 기본 비활성화
- canonical role 명칭
- Member 성과 화면의 민감 집계 제한
- 정산 3상태 및 취소 거래 조회 원칙

## 남은 우선순위

- [ ] 정산 dispute·refund·adjustment의 실제 생성/수정 상태 연결
- [ ] 거래 완료 조건과 정산 대상 판정을 Deal 유형별 서버 규칙으로 연결
- [ ] 보고서·영업 성과의 Member 전용 API 응답 샘플 추가
- [ ] 390dp·768dp에서 역할별 화면과 정산 필터 회귀 테스트
- [ ] 승인 모드를 켠 조직의 별도 시나리오 테스트

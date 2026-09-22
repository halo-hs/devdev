# 2026-07-22 거래 상세 고객 전달 레이어 점검

기준 원소스: `/Users/hans/team/1-projects/ecoya-erp-v2/user-frontend`

대상 프로토타입: `/Users/hans/team/1-projects/erp-doc-ui-shadcn`

## 결론

거래 상세의 `고객에게 전달`은 전체 문서 목록으로 이동하지 않고 현재 거래 문맥을 유지하는 우측 레이어로 열 수 있다. 신규 백엔드 API는 필요하지 않으며 원소스의 거래별 생성 문서 조회와 문서별 전달 API를 재사용한다.

## 원소스 확인

- [x] `listGeneratedDocuments(getIdToken, dealId)`가 `GET /trade/generated-documents?deal_id=...`를 호출한다.
- [x] 백엔드에는 `GET /api/v1/trade/deals/{deal_id}/generated-documents`도 노출돼 있다.
- [x] `DocumentsListConnected`가 거래에서 진입한 `deal_id`를 읽어 생성 문서 목록을 거래별로 제한한다.
- [x] 문서별 Magic Link 생성·목록·철회 API가 존재한다.
- [x] 문서별 전달 이력 조회와 전달 이벤트 생성 API가 존재한다.
- [x] 기존 `DocumentDeliverConnected`에 수신자, 첨부, bundle/PDF, 링크, 품질 gate, 전달 이력 흐름이 있다.

## 구현 계약

- [ ] 전역 헤더 아래에서 시작하는 우측 Sheet로 연다.
- [ ] 전달 가능 문서 0개: 비활성 상태 또는 `문서 만들기` 안내를 표시한다.
- [ ] 전달 가능 문서 1개: 선택 목록 없이 해당 문서 전달 작업대를 바로 표시한다.
- [ ] 전달 가능 문서 N개: Sheet 내부 문서 선택 후 같은 영역에서 전달 작업대로 전환한다.
- [ ] `confirmed` 또는 `sent` 문서만 전달 가능하며 draft/void는 작성·승인 안내를 표시한다.
- [ ] Sheet를 닫으면 거래 상세의 탭, 스크롤, 선택 상태를 유지한다.
- [ ] 문서 상세 route와 거래 상세 Sheet가 동일한 전달 작업 컴포넌트를 사용한다.
- [ ] 좁은 화면에서는 Sheet를 전체 폭으로 전환하고 전역 top bar 아래 높이를 사용한다.

## API 연결

| 목적 | 원소스 계약 |
| --- | --- |
| 거래별 생성 문서 조회 | `listGeneratedDocuments(getIdToken, dealId)` |
| 생성 문서 상세 | `getGeneratedDocument(documentId)` |
| 공유 링크 | `listShareLinks`, `createShareLink`, `revokeShareLink` |
| 전달 이력 | `listDeliveryEvents(documentId)`, `createDeliveryEvent` |
| 첨부·패키지 | `listAttachments`, `addAttachment`, `uploadSendAttachment`, `removeAttachment`, bundle/PDF endpoint |

## 추가 API가 필요한 경우

여러 생성 문서를 하나의 신규 패키지로 묶어 한 번에 발송해야 할 때만 별도의 다중 문서 delivery/bundle API가 필요하다. 현재 원소스의 전달 단위는 생성 문서 1개와 그 문서에 연결된 첨부 묶음이다.

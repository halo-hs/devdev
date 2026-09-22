# ERP 화면·버튼 연결 참조

기준일: 2026-09-16

왼쪽 목록에서 상태를 선택하면 오른쪽에 HTML 화면이 열린다. 화면 안의 연결된 버튼도 같은 영역에서 이동한다. 주소의 `?page=` 값으로 상태를 공유할 수 있다. 상단에는 진입 조작과 다음 상태가 표시된다.

- [전체 HTML 화면](https://devdev-e6t.pages.dev/html/erp/)
- [이 문서의 배포 링크](https://devdev-e6t.pages.dev/html/erp/reference.md)
- HTML 원본 주소 형식: `https://devdev-e6t.pages.dev/html/erp/{화면ID}.html`
- devdev 앱 링크는 실제 앱 경로로 이동한다. 예시 입력·권한·선택 상태까지 URL만으로 복원되는 것은 아니다.

## 문서 올리기 · 파일 추가와 거래 연결

| 진입·상태 | 링크 | 확인할 내용 |
| --- | --- | --- |
| 인보이스 거래 연결 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=document-invoice-connect) | 후보 선택, 새 거래 등록, 파일 추가 |
| 파일 추가 메뉴 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=upload-invoice-file-menu) | 이메일에서 찾기·파일 선택·폴더 선택 |
| PDF 업로드 중 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=upload-invoice-file-uploading) | 실제 업로드 진행 상태 |
| PDF 추가 후 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=upload-invoice-file-added) | 추가확인.pdf가 목록에 유지됨 |
| 폴더의 PDF 2개 추가 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=upload-invoice-folder-added) | 추가된 두 파일과 검토 상태 |
| 같은 이름의 파일 추가 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=upload-invoice-duplicate-file) | 중복 파일 안내 |
| 이메일 첨부 선택 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=upload-invoice-mail) | 앱의 기본 선택은 첨부 2개 |
| 이메일 첨부 미선택 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=upload-invoice-mail-empty) | 가져오기 비활성 |
| 이메일 첨부 1개 선택 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=upload-invoice-mail-selected) | 선택 해제·가져오기 |
| 이메일 첨부 전체 선택 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=upload-invoice-mail-all) | 전체 해제·가져오기 |
| 이메일 첨부 가져오기 후 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=upload-invoice-mail-imported) | 선택한 첨부가 파일 목록에 유지됨 |
| 새 거래 등록 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=upload-invoice-new-deal) | 추천 번호·등록 닫기·생성 연결 |
| 거래번호 누락 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=upload-invoice-new-empty) | 필수값 누락으로 연결 비활성 |
| 새 거래번호 입력 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=upload-invoice-new-number) | 예시 번호 DL-260916-90으로 생성·연결 |
| 새 거래 생성 후 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=upload-invoice-number-linked) | 생성된 거래 상세 |
| 은행 문서 거래 연결 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=document-connect) | 거래 후보와 결제 일정 선택 |
| 결제 일정 미선택 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=upload-bank-candidate-5) | ‘결제 일정 선택 필요’ 비활성 |
| 결제 일정 선택 후 | [열기](https://devdev-e6t.pages.dev/html/erp/?page=upload-bank-candidate-5-schedule-2) | 선택한 거래 연결 활성화 |

거래 후보 7개는 바로 거래 상세로 보내지 않고 **후보 선택 → 필요한 결제 일정 선택 → 연결 후 결과**로 연결했다. 은행 문서에서도 파일 추가·이메일 첨부·새 거래 등록 상태를 별도로 제공한다.

파일·폴더 선택은 운영체제 창 자체를 HTML로 재현하지 않는다. 해당 링크는 로컬 샘플 PDF를 선택한 뒤 앱이 표시한 상태로 이동한다. 업로드 중 화면과 처리 후 화면을 구분한다.

앱에서 문서 URL 변경 시 작업 화면이 다시 생성되어 추가한 파일이 사라지던 문제도 수정했다. 업로드 목록과 진행 상태를 유지하고, 같은 작업 화면의 뒤로·앞으로 이동에서 선택 문서를 복원한다.

## 승인·확정·매직링크

| 흐름 | 진입 링크 | 연결한 결과 |
| --- | --- | --- |
| Admin 승인·반려 | [승인 검토](https://devdev-e6t.pages.dev/html/erp/?page=document-flow-admin-pending) | Admin 승인 이력·확정, 반려 사유 입력·확정 |
| 요청자 재요청 | [반려 확인](https://devdev-e6t.pages.dev/html/erp/?page=document-flow-requester-rejected) | 이전 반려 이력을 유지한 재요청·승인 대기 |
| 요청자 확정 | [승인 완료](https://devdev-e6t.pages.dev/html/erp/?page=document-flow-requester-approved) | 문서 확정·공유 설정 |
| 복사 후 후속 조작 | [복사 완료](https://devdev-e6t.pages.dev/html/erp/?page=document-flow-link-copied) | 철회·삭제·전달 내역·문서로 돌아가기 |
| 첨부 후 링크 생성 | [동봉 파일 추가](https://devdev-e6t.pages.dev/html/erp/?page=document-flow-attachment-added) | 첨부 1개를 유지한 생성·복사·철회·삭제·재생성 |

사유 입력처럼 HTML에서 직접 입력할 수 없는 조작은 미리보기 위의 ‘다음 상태’에서 입력 완료 예시를 선택한다. 필수값이 비어 있을 때 실제 앱이 비활성화하는 버튼은 비활성 상태를 유지한다.

## 거래·알림·목록 이동

- [거래 상세](https://devdev-e6t.pages.dev/html/erp/?page=deal-dl-260701-09): 두 노트 각각의 수정·취소·저장, 삭제 확인·취소·완료.
- [알림](https://devdev-e6t.pages.dev/html/erp/?page=notifications): 개별·전체 선택, 선택 해제, 선택 항목 읽음 처리.
- [선적](https://devdev-e6t.pages.dev/html/erp/?page=shipments): 1~3페이지·이전·다음 이동.
- [정산](https://devdev-e6t.pages.dev/html/erp/?page=settlement): 두 개의 독립적인 페이지 선택을 구분.
- AI 결과·정산·온보딩 등의 실제 경로 이동이 확인된 28개 버튼도 저장된 대상 HTML로 연결했다.

## 남아 있는 앱 제약

- 거래 후보 `DL-260708-08`은 앱의 후보 목록에는 있지만 거래 상세 데이터가 없다. [연결 후 결과](https://devdev-e6t.pages.dev/html/erp/?page=upload-invoice-candidate-2-linked)는 실제 앱의 ‘거래를 찾을 수 없습니다’를 표시한다.
- 고객 공유 URL은 샘플 외부 주소이며 고객 공개 화면과 연결되어 있지 않다. 이메일 발송·수신 완료를 임의로 만들지 않는다.
- 정적 화면은 예시 상태를 탐색하는 공유본이다. 임의 입력값, 모든 선택 조합, 실제 파일 업로드·발송을 실행하는 앱은 아니다. 결과가 수집되지 않은 조작은 계속 비활성화되어 있다.

## 재생성과 검증

앱 서버는 로컬에서 실행한다. 변경되지 않은 캡처만 캐시에서 재사용할 수 있다.

```sh
ERP_HTML_RESUME=1 node scripts/handoff/export-erp-html.mjs http://127.0.0.1:4181
node scripts/checks/check-erp-html.mjs http://127.0.0.1:3031
node scripts/checks/check-erp-interaction-flows.mjs http://127.0.0.1:3031
node scripts/checks/check-erp-upload-session.mjs http://127.0.0.1:4181
node scripts/checks/check-erp-preview-navigation.mjs http://127.0.0.1:3031
```

HTML 검사에서는 앱 JavaScript 없이 버튼을 실제로 이동하며 결과·선택값·비활성 조건을 검사한다. 업로드 검사는 실제 React 앱에서 파일 추가·첨부 가져오기·뒤로/앞으로 이동 후 목록 유지를 확인한다.

검증 결과: 원본 상태 376개에서 562개로 확장. 디자이너 공유 페이지를 포함한 HTML 615개, 내부 링크 75,312개 검사 오류 0건. 주요 버튼 이동 95건 통과. 실제 앱의 파일 추가·첨부 가져오기·뒤로/앞으로 이동 후 목록 유지 통과.

미리보기 전환 중에는 이전 화면의 입력을 차단한다. HTML 응답을 지연시킨 상태에서도 연속 클릭이 선택 상태를 건너뛰지 않고, 같은 창 이동과 뒤로가기가 유지되는지 검증했다.

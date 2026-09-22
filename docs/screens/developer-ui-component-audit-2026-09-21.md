# 개발자용 UI 컴포넌트 정리 대상

검토일: 2026-09-21. 현재 로컬 소스 기준의 컴포넌트 경계 검토입니다. 아래 항목은 신규 개발 건수가 아니라 기존 재사용·중복 통합·추가 추출을 구분한 후보입니다. 런타임 화면 전체의 접근성 검증이나 리팩터링은 수행하지 않았습니다.

화면 수·캡처 수로 컴포넌트 수를 산정하지 않습니다. 기존 `ui-component-work-scope.md`의 611개 HTML 및 인증 제외 범위는 과거 목록이므로 현재 개발 범위 산정에 사용하지 않습니다. 현재 App이 연결하는 운영 화면은 `ReferenceOperations`도 포함하며, 과거 프로토타입의 함수가 남아 있다는 이유만으로 활성 화면 중복으로 세지 않습니다.

## 우선 정리할 유형

| 우선 | UI 유형 | 현재 기반과 확인된 근거 | 개발자가 정리할 경계 |
|---|---|---|---|
| P0 | 업무 폼 필드 | `src/components/form-field.tsx`의 FormField/Header/Message가 존재하고 문서 및 거래 상세에서 사용 | 기존 공통 적용. 라벨·뱃지 왼쪽, 후보 선택·원본보기 오른쪽, 컨트롤 아래 아이콘·메시지. 금액+통화, 수량+단위 같은 복합 입력은 같은 배치 규칙의 변형으로 정리. 원본보기 등 없는 기능은 생략. |
| P0 | 검토 항목 요약 | `src/components/document-blocking-alerts.tsx`의 DocumentBlockingAlerts와 `src/features/deal-detail-prototype.tsx`의 DealCompactAlerts가 유사한 건수 버튼·팝오버·목록·이동 동작을 각각 구현 | 하나의 검토 목록 조합으로 통합. 오류/확인 그룹, 건수, 펼침, 선택 후 닫기와 해당 항목 이동을 공유하고 검토 판정은 화면에서 전달. 현재 팝오버 정렬·높이 규칙도 다름. |
| P0 | 상태 뱃지 | `src/App.tsx`의 ToneBadge, `src/features/deals-prototype.tsx` 및 `deal-detail-prototype.tsx`의 StatusBadge, `src/reference-3030/components/platform/StatusBadge.tsx` | Badge 기반 표현 통합. 높이·글자·색·아이콘 토큰을 공유. 문서 처리/선적/정산의 상태 코드와 문구 매핑은 각 업무에서 유지. 거래 상세에는 11px 직접 지정이 남아 있음. |
| P0 | 업무 테이블 | 디자인 시스템 DataTable, 공통 TablePagination, 운영 HostTable·OperationalTableFrame, DealsFinanceTable, App의 문서 목록 | 조회형 / 체크 선택형 / 품목 편집형 / 거래별 그룹형을 별도 조합으로 정의. 헤더·행 높이, 숫자 정렬, 행 이동과 버튼 클릭 분리, 빈 상태, 스크롤·페이지 처리 공유. 그룹형은 거래 1건 아래 선적 여러 건을 표현. 모든 업무 표를 하나의 거대 컴포넌트로 만들지 않음. |
| P0 | 업무 확인 팝업 | 공통 Dialog·AlertDialog·Sheet가 있으나 거래의 DealCreateDialog·ActionDialog는 createPortal로 직접 구성 | 기존 레이어 기반으로 이관할 후보. 제목·본문·버튼 영역, 처리 중 상태, 오류, 닫기 정책, 포커스 복귀를 공통화. 공유 패널·확인 팝업의 업무 내용과 실행 로직은 각각 유지. |
| P1 | 검색·필터 바 | `src/components/business-filters.tsx`와 운영 `SearchFilterBar.tsx` | 표현 규칙과 검색·초기화 인터페이스 정리. 검색, 필터, 결과 수, 우측 액션 슬롯을 공유. 즉시 검색과 제출 검색, 필터 값·URL 동기화는 의도에 따라 구분. |
| P1 | 파일 행·동봉 선택 목록 | DeliveryAttachmentPicker/Preview, FileDropZone, App의 ShareDeliveryPanel 및 업로드 목록 | 기존 업로더 재사용. 파일명·출처·상태·미리보기·다운로드·제거를 가진 파일 행을 추출할 후보. 체크 선택/선택 불가 변형을 제공. Picker 안의 고정 candidates는 입력 데이터로 분리하고 파일 허용 정책은 업무에서 전달. 목록 위에 안내·제목을 반복하지 않음. |
| P1 | 안내·토스트 | Alert, 운영 InfoBox, extended 화면 Notice. `src/main.tsx`의 Sonner와 ReferenceOperations의 ToastHost가 별도로 존재 | 기존 안내 유형 카탈로그에 맞춰 스타일·액션 슬롯과 토스트 진입점 정리. 일반 안내/접힘 안내/필드 오류/처리 상태의 역할은 유지. 토스트 위치·지속시간·닫기 정책을 통일할지 결정해야 함. |
| P1 | 데이터 표시 상태 | PageLoadingBoundary, 운영 LoadableSection, 거래 상세 PanelFailure | 기존 기반 확장. 영역 안 로딩·빈 결과·실패·권한 제한·재시도 계약을 공유. 페이지 전체 로딩과 일부 영역 로딩은 별도 유지. 빈 데이터와 검색 결과 없음도 구분. |
| P1 | PDF와 입력 폼 작업 영역 | PannablePdfViewport, PdfViewerToolbar/FloatingControls, PdfPanelResizeHandle, App의 DocumentReviewWorkspace | PDF 기본 기능은 재사용. 분할 배치·패널별 스크롤·접기·크기 조절·좁은 화면 전환을 담당하는 작업 영역 조합을 추출할 후보. 원본 위치와 필드 연결 데이터는 업무에서 전달. |

## 이미 있는 기반: 신규 제작 대상에 중복 산정하지 않기

- Input, Textarea, Select, Checkbox, Combobox, Button 및 Dialog/Sheet/Popover/Tooltip.
- 디자인 시스템의 DatePicker, DateTimePicker, TimePicker, FileDropZone, DataTable, QuantityStepper 등 확장 컨트롤.
- FormField, AuthInputField. 인증과 업무 폼의 밀도 차이는 유지할 수 있으며 기본 동작·토큰을 공유합니다.
- BusinessPageHero, SummaryMetricStrip, 운영 MetricCard·SectionPanel: 먼저 용도와 변형을 비교하고 기존 구성의 적용을 정리합니다.
- MoneyValue/NumericValue, AutoSaveStatus: 금액 표현과 저장 상태에 기존 공통을 사용합니다.
- ChartContainer/Tooltip과 차트 라이브러리: 단위·범례·로딩 등의 공통 표현을 정리하되 차트별 데이터 계산은 별도로 둡니다.

## 컴포넌트에 넣을 것과 화면에 둘 것

- 공통 UI: 배치·토큰·키보드/포커스·접근 가능한 이름·상태 표시·액션 슬롯·이벤트 전달.
- 업무 화면/도메인: API 호출, 권한 판정, 정산 계산, 파일 동봉 허용 정책, 상태 전이, 거래와 선적의 동기화.
- 화면에서 콜백·데이터를 주입하고 공통 UI가 특정 거래 ID나 예시 문서 목록을 직접 소유하지 않게 합니다.

실행 순서는 필드·뱃지·검토 목록 → 테이블·팝업 → 파일·안내·데이터 상태 → 작업 영역을 권장합니다. 개발 착수 시 각 항목에 기본/처리 중/오류/비활성/좁은 화면과 키보드 동작 기준을 함께 정의합니다.

이번 작업은 소스 검토와 이 문서 작성까지입니다. 제품 소스 변경, HTML 재생성, Figma 수정 및 배포는 하지 않았습니다.

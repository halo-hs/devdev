# Notice · 안내 유형

2026-09-21 · 소스와 배포 HTML에서 확인한 현재 유형. 화면 변경이나 통일안 적용은 포함하지 않는다.

| 유형 | 형태 | 표시·해제 | 실제 사용 |
|---|---|---|---|
| 영역 안 안내 | 본문만 / 제목·설명 / 액션 / 확인 버튼 / 관련 정보 / 입력 컨트롤 | 해당 영역에 남음. 확인 버튼형은 직접 해제 | 문서 올리기, 문서 검토, 승인·확정 |
| 접히는 안내 | 아이콘 + 요약 + 자세히 → 상세 설명 | 사용자가 펼치고 접음 | 파일 올리기 AI 안내 |
| 입력칸 안내 | 입력칸 아래 아이콘·문구 또는 오류 문구 | 필드 상태에 따라 표시 | 문서 검토, 거래 상세, 회원가입 |
| 검토 항목 목록 | 건수 버튼 → 팝오버 목록 | 클릭해 열고 항목 선택 시 이동 | 문서 만들기·올리기, 거래 상세 |
| 처리 상태 | 짧은 상태 표시 / 진행·실패 안내 박스 | 저장·분석 상태에 따라 변경 | 자동 저장, AI 분석, 추출 실패 |
| 토스트 | 떠 있는 짧은 메시지 / 설명·액션·닫기 포함 | 일시 표시 또는 직접 닫기 | 작업 완료·실패 결과 |
| 확인 팝업 | 제목 + 설명 + 취소·실행 버튼 | 사용자의 선택을 기다림 | 삭제, 업로드 중단 |

## 구조와 상태를 분리

- 구조: `아이콘 | 제목·본문 | 액션·닫기`. 설명·목록·입력 컨트롤은 그 아래.
- 상태: 기본 / 정보 / 완료 / 주의 / 오류. 색이 다르다고 다른 구조로 분류하지 않는다.
- `Alert`의 `positive`와 `blue`, `neutral`과 `gray`는 각각 같은 스타일이다.
- 라벨 옆 상태 배지와 알림함의 업무 항목은 별도 유형이다. 배지는 상태, 알림함은 기록된 이벤트 목록이다.
- 확인 팝업은 선택을 요구하므로, 일반 안내 박스·토스트와 분리한다.

## 실제 코드에서 다른 부분

1. **토스트 두 구현**: 업무 공통 Sonner는 상단 중앙·72px 오프셋·기본 3.5초. 운영 화면 ToastHost는 상단 중앙·16px + safe area·기본 5초이며 오류는 직접 닫을 때까지 유지한다. 호출부에서 시간을 지정하면 그 값이 우선한다.
2. **본문 크기**: 기존 Notice는 제목 14px·설명 12px, InfoBox는 제목·설명 모두 14px. 일부 Alert 호출부에는 11px 설명도 남아 있다.
3. **필드 안내**: 업무 폼은 아이콘 + 문구, 인증 폼 오류는 문구만 표시한다. `FormFieldMessage`의 warning은 현재 danger와 달리 별도 경고색을 지정하지 않는다.
4. **검토 목록 정렬**: 문서용 목록은 버튼 끝에 맞추고(`align=end`), 거래 상세는 시작에 맞춘다(`align=start`).
5. **운영 토스트의 액션 폭**: 채움형의 오른쪽 칸이 24px로 고정되어, 액션과 닫기 버튼을 함께 넣으면 카드 밖으로 넘친다. 예시에서도 이 현재 상태를 확인할 수 있다.

## 원본

- `src/App.tsx`: AiDocumentProcessingNotice, DuplicateUploadAlert, DocumentTypeResolution, DocumentProcessingNotice
- `src/features/erp-extended-prototypes.tsx`: Notice
- `src/components/form-field.tsx`: FormFieldMessage
- `src/components/auth-input-field.tsx`: 인증 필드 오류
- `src/components/document-blocking-alerts.tsx`: 검토·확인 목록
- `src/components/auto-save-status.tsx`: 저장 상태
- `src/features/deal-detail-prototype.tsx`: DealCompactAlerts, 노트 삭제 확인
- `src/main.tsx`: 업무 공통 Toaster
- `src/reference-3030/components/platform/InfoBox.tsx`: 운영 안내 박스
- `src/reference-3030/components/platform/toast/ToastHost.tsx`, `toastStore.ts`: 운영 토스트

실제 예시: `/html/erp/notice-types.html`. 안내 박스와 필드는 비교용 560px 폭에서 캡처했다. Figma: https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=823-2. 토스트 예시는 같은 소스의 실제 컴포넌트에 샘플 메시지만 전달해 캡처했다. 업무 데이터는 변경하지 않았다.

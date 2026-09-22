# Trade OS 운영 화면

선적, 정산, 운영 감시, 리포트, 매출 분석에 실제 사용하는 코드입니다. `index.tsx`가 화면 진입점이며 `src/App.tsx`와 거래 상세에서 사용합니다.

- `monitor/`, `shipments/`, `settlement/`, `reports/`, `salesperf/`, `deals/`: 영역별 화면과 데이터 처리.
- `components/`, `shared/`: 운영 화면용 UI.
- `session/`, `lib/`, `compat/`, `i18n/`, `messages/`, `demo/`: 세션·API·호환 처리·번역·데모 데이터.
- `styles/`: 해당 화면에 범위를 제한한 CSS. `node scripts/assets/build-operations-styles.mjs`로 생성합니다.

원본 자료는 Git 제외 폴더 `reference-3030/`에 보관합니다. 이 실행 코드는 원본 폴더 없이 빌드됩니다. `.reference-3030` CSS 클래스와 기존 API 프록시 이름은 화면·테스트 호환을 위해 유지합니다.

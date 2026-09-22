# 매직링크 수신 화면

외부 수신자가 로그인 없이 확정 문서와 동봉 파일을 확인하는 독립 페이지다. ERP 사이드바와 내부 데이터 요청을 마운트하지 않는다.

## 확인 주소

- 디자인 샘플: `/share/preview`
- 상태별 샘플: `/share/preview?state=loading|expired|open_cap|not_found|error`
- 실제 토큰 진입: `/share/{token}`
- 문서 만들기 공유 화면의 **수신 화면 미리보기**에서 샘플을 새 창으로 연다. 작성 중인 문서의 실데이터를 복제하는 기능은 아니다.

## 디자인

기존 ECOYA 색상 토큰과 Pretendard를 사용한다. 상단에 브랜드, 문서명, 본문/동봉 파일 수, 패키지 다운로드를 배치한다. 데스크톱은 문서 미리보기를 왼쪽에 크게, 패키지 구성과 상업 조건·선적 정보·링크 이용 안내를 오른쪽에 배치한다. 모바일은 패키지 구성 → 문서 → 상세 정보 순서다.

- 패키지 구성: 본문 PDF와 동봉 파일 이름·라벨. 원소스 계약에 개별 첨부 URL이 없으므로 동봉 파일은 전체 패키지 다운로드로 제공한다.
- 상업 조건: 금액·통화, 인코텀즈, 결제 조건.
- 선적 정보: 출발항·도착항, 출발·도착 예정일, 선박·항차. 접기 가능.
- 링크 안내: 만료일(한국 시간), 사용 열람 횟수/한도. 누락된 상업·선적 정보는 `미공유`로 표시한다.
- 실제 응답에는 발신인·수신인 필드가 없어 임의로 추가하지 않는다. 샘플 PDF 안의 업체명은 예시다.

## 상태

| 상태 | 표시 | 동작 |
|---|---|---|
| 확인 중 | 링크 확인 안내 | PDF·다운로드 숨김 |
| 정상 | 문서와 패키지 정보 | 본문·패키지 다운로드 |
| 만료 | 만료 및 새 링크 요청 안내 | 문서 정보 숨김 |
| 열람 한도 | 한도 도달 및 새 링크 요청 안내 | 문서 정보 숨김 |
| 철회·잘못된 링크 | 동일한 사용 불가 안내 | 문서 정보 숨김 |
| 일시 오류 | 오류 및 재시도 | 503 응답의 Retry-After를 준수한 재조회 |

상태 선택기는 `/share/preview` 샘플에만 보인다. 임의의 토큰에 `?state=active`를 붙여도 실제 응답을 우회하지 않는다. 잘못된 성공 응답도 오류로 처리한다.

## 참고 소스와 연동 범위

실제 참고 경로는 전달받은 경로의 상위인 `/Users/hans/orca/ecoya-platform-user-frontend`다.

- `src/features/public/SharedDocumentViewer.tsx`
- `src/features/public/sharedDocumentPackage.ts`
- `src/lib/api/publicPackage.ts`
- `src/messages/ko/public-share.json`

공개 API 계약:

- `GET /api/platform/public/documents/{token}/package`: 공개 정보·유효성 확인
- `GET /api/platform/public/documents/{token}`: 확정 PDF 표시/다운로드
- `GET /api/platform/public/documents/{token}/bundle`: 패키지 다운로드

현재 Vite 저장소에는 위 API 서버가 없다. 실제 토큰의 운영 연동에는 서버 또는 프록시가 필요하다. 샘플은 별도 fixture를 사용하며 다운로드에는 샘플 표시가 들어간 PDF를 생성한다. 샘플 동봉 파일은 형식 확인용 페이지다. 기존 발신자의 링크 생성·철회·복사 동작은 로컬 프로토타입이며 운영 토큰 발급/회수 연동은 이번 디자인 범위에 포함하지 않는다.

## 검증 및 캡처

`tests/public-share.spec.ts`: 데스크톱·모바일 가로 넘침, 샘플 PDF 다운로드, 실제 응답 전 비노출, 오류 코드 분기, 잘못된 응답, Retry-After 후 재시도, 토큰 누락을 검증한다.

- [데스크톱 1440px](./assets/magic-link/recipient-1440.png)
- [모바일 390px](./assets/magic-link/recipient-390.png)

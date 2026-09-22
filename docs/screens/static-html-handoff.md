# ERP 정적 HTML 공유본

추가한 버튼·상태 연결과 문서 업로드 흐름은 [화면·버튼 연결 참조](html-interaction-links.md)에 정리했습니다. 외부 공유용 [참조 MD 배포 링크](https://devdev-e6t.pages.dev/html/erp/reference.md)도 제공합니다.

디자이너와 HTML만 읽는 AI가 실제 구현 화면의 구조, 필드, 표, 문구와 상태를 확인하는 공유본입니다.

- 시작 페이지: `/html/erp/index.html` — 왼쪽 업무별 목록을 누르면 같은 화면 오른쪽에 미리보기가 표시됩니다. 새 창을 열지 않습니다.
- 목록과 미리보기는 각각 스크롤하며, 처음에는 디자이너 작업 안내를 표시합니다.
- 반복되는 상단 세계시간·더보기는 목록 맨 위 **Top 영역**에 한 번만 표시합니다. 본문에 있는 개별 더보기 메뉴는 각 업무에 유지합니다.
- 선택한 화면은 `?page=deal-dl-260701-09`처럼 주소에 반영되어 공유·새로고침·뒤로가기로 복원됩니다. 상단 **HTML 원본**과 **devdev 앱 화면**은 같은 탭에서 열립니다. 앱 링크는 해당 페이지로 이동하며 클릭으로 여는 모달·탭 상태까지 복원하지는 않습니다.
- 스켈레톤이 포함된 상태는 목록에 **스켈레톤**으로 표시하며, 미리보기 전환 중에도 스켈레톤을 표시합니다.
- 저장 위치: `public/html/erp/`
- 형식: 실제 HTML + CSS + 이미지/폰트. 개별 화면은 JavaScript가 필요하지 않습니다. 목록 뷰어만 주소 동기화와 링크 연결에 JavaScript를 사용하며, 비활성화해도 왼쪽 링크와 오른쪽 미리보기는 작동합니다.
- 사이드바: `.html` 파일로 직접 이동합니다.
- 주요 버튼: 저장된 다음 화면, 상태, 탭 또는 대화상자 HTML로 이동합니다.
- 전체 상태: 각 화면 오른쪽 아래 **화면 목록** 및 시작 페이지에서 접근합니다.

## 주요 링크

### 한 페이지 작업 보드 (2026-09-16 수정)

- [작업 안내](https://devdev-e6t.pages.dev/html/erp/?page=designer-guide): 17개 메뉴별 목록부터 상세까지 포함합니다.
- 목록·입력·상세는 같은 메뉴 안에서 이어지고, 해당 화면의 팝업·패널·상태 모음은 바로 옆에 표시합니다. 좁은 화면에서는 바로 아래로 이어집니다.
- 17개 메뉴와 공통 사이드바를 한 페이지의 18개 작업 영역으로 모았습니다. 주요 CTA와 상태별 값, 캡처 미확인 설계 요구사항을 함께 표시합니다. 팝업·상태를 별도 작업 메뉴로 나누지 않습니다. 이전 팝업 전용 URL은 기존 공유 링크 호환용으로 남깁니다.
- 기존 상태의 직접 URL은 유지하며 **목록·상세와 함께 보기** 링크로 해당 메뉴의 부모 화면에 이동합니다.
- 설정의 실제 내용이 다른 하위 화면을 포함하고, 같은 내 계정 화면을 다시 여는 버튼은 중복으로 제외합니다.
- 온보딩의 ECOYA Demo Co. 샘플 값과 파일 미선택 상태는 유지합니다.
- `scripts/handoff/erp-designer-menus.json`은 메뉴별 대표 화면 순서, `scripts/handoff/erp-designer-work.json`의 `parentId`는 팝업·상태의 부모 화면을 정의합니다.

기존 HTML만으로 작업 목록을 다시 생성할 수 있습니다.

```sh
node --input-type=module -e 'import fs from "node:fs/promises"; import { writeErpHtmlIndex } from "./scripts/handoff/erp-html-index.mjs"; const m = JSON.parse(await fs.readFile("public/html/erp/manifest.json", "utf8")); await writeErpHtmlIndex("public/html/erp", m.pages);'
```

기존 HTML에 없던 정산/운영 감시 패널 2개는 `assets/designer-source-*.json`에 저장한 원본 조각을 재사용합니다. 현재 devdev에서 다시 열어 갱신할 때만 `ERP_DESIGNER_REFRESH=1`을 사용합니다. 해당 과정은 조회/패널 열기만 수행합니다.

문서 만들기의 **승인·확정**, **매직링크·고객 전달** 묶음에서 24개 버튼·역할·결과 상태를 순서대로 확인할 수 있습니다. 미리보기 위에는 진입 화면과 버튼, 다음 결과 화면을 표시합니다. 나머지 화면도 기본 화면 아래에 해당 화면의 버튼 상태를 묶습니다.

- 승인 흐름: [초안 검토](/html/erp/?page=document-flow-draft) → 승인자 선택 → 승인 요청 → Owner 승인/반려 → 문서 확정.
- 역할별 상태: 요청자의 대기·승인 완료·반려, Admin 검토는 앱의 상단 상태 전환으로 확인한 **역할 예시**입니다.
- 공유 흐름: [공유 설정](/html/erp/?page=document-flow-confirmed) → 매직링크 생성 → 복사·철회·삭제·재생성 → 전달 내역. 동봉 파일의 추가 가능·보안 문서 제외·다른 거래 제외도 포함합니다.
- 현재 고객 새창은 샘플 외부 주소이며, 고객 공개 화면은 연결되지 않았습니다. 이메일은 발송 요청을 기록하는 단계이고 실제 발송·수신 완료로 표시하지 않습니다. 상태 추출 중 이메일 발송 요청은 실행하지 않습니다.

| 화면 | HTML 경로 |
| --- | --- |
| 오늘 할 일 | `/html/erp/home.html` |
| 문서 올리기 | `/html/erp/document-upload.html` |
| 문서 검토 | `/html/erp/document-review.html` |
| 거래 연결 | `/html/erp/document-connect.html` |
| 처리 실패 | `/html/erp/document-failed.html` |
| 재시도 중 | `/html/erp/document-retry.html` |
| 재추출 완료 | `/html/erp/document-retried.html` |
| 문서 만들기 | `/html/erp/document-create.html` |
| 견적서 입력 | `/html/erp/document-create-qt.html` |
| 품목 추가 | `/html/erp/document-items-added.html` |
| 품목 개별 삭제 | `/html/erp/document-item-deleted.html` |
| 품목 전체 삭제 | `/html/erp/document-items-empty.html` |
| AI에게 묻기 | `/html/erp/ai.html` |
| AI 답변과 근거 | `/html/erp/ai-answer.html` |
| 거래 | `/html/erp/deals.html` |
| 거래 상세 | `/html/erp/deal-dl-260701-09.html` |
| 선적 | `/html/erp/shipments.html` |
| 정산 | `/html/erp/settlement.html` |
| 운영 감시 | `/html/erp/monitoring.html` |
| 결산 리포트 | `/html/erp/reports.html` |
| 영업 성과 | `/html/erp/sales.html` |
| 설정 | `/html/erp/settings.html` |

## 생성 및 확인

앱의 개발 서버를 실행한 상태에서 생성합니다. Playwright로 화면을 저장하며, 개별 화면에는 스크립트를 넣지 않습니다. 목록 뷰어의 스크립트는 별도 자산으로 복사됩니다.

```sh
node scripts/handoff/export-erp-html.mjs http://127.0.0.1:5175
python3 -m http.server 3031 --directory public --bind 127.0.0.1
node scripts/checks/check-erp-html.mjs http://127.0.0.1:3031
```

브라우저: `http://localhost:3031/html/erp/index.html`

`public/html/erp` 디렉터리 전체를 그대로 정적 호스팅에 올리거나, 다운로드 후 `index.html`을 열 수 있습니다. 링크와 자산은 상대 경로입니다. Vite 빌드 시에도 `dist/html/erp`로 복사됩니다.

## 상태의 의미

현재 구현된 샘플 화면을 저장한 것입니다. 품목 추가 링크는 미리 저장한 품목 추가 상태로 이동합니다. 입력값 변경, 업로드, 계산, 저장, 삭제, 결제 등 실제 처리를 수행하는 서비스는 아닙니다. 결과 화면을 확보하지 않은 조작은 비활성화하고 설명을 표시합니다. 미구현 기능을 성공한 것으로 표시하지 않습니다.

`manifest.json`에는 생성 시각, 화면 목록, 결과 화면이 포함되지 않은 조작을 기록합니다. 운영 앱이 변경되면 다시 생성해야 합니다. 실시간 화면과 자동으로 동기화되지 않습니다.

## 2026-09-15 검증

2026-09-16 작업 구분 추가 검증: HTML 398개, 로컬 링크 30,729개, JavaScript 비활성 검사 오류 0건. 기존 철회 상태의 직접 접근·새로고침·뒤로가기, 작업 모음 이동, 팝업 배경 제외, 온보딩 샘플 값, 390px 화면의 페이지 가로 넘침 없음, Figma/앱 링크의 같은 탭 이동을 확인했습니다. 독립 체크아웃에서 프로덕션 빌드를 통과했습니다.

- 화면·상태 352개와 목록·고객 지원을 포함한 HTML 354개.
- JavaScript를 비활성화한 Chrome에서 HTML 링크 26,974개 검사: 누락 파일 및 리소스 오류 0건.
- 사이드바 → 문서 올리기 → 실패 → 재시도, 견적서 → 품목 추가 → 개별 삭제 이동 확인.
- 설정의 별도 사이드바, 문서 검토/PDF, 조직 메뉴, 선적 검토 대화상자 확인.
- 390px 홈 업무판은 세로로 배치되어 읽을 수 있도록 정적 CSS 적용.
- `npm run build` 및 정적 파일의 `dist/html/erp` 복사 확인.

생성이 중단되었고 원본 앱 내용은 그대로인 경우에만 `ERP_HTML_RESUME=1 node scripts/handoff/export-erp-html.mjs`로 임시 캐시부터 재개할 수 있습니다. 화면이 바뀌었으면 기본 명령으로 새로 생성합니다.

## 메뉴별 재구성 검증

2026-09-16: 메뉴 17개, 대표 목록·상세 화면 39개와 해당 화면에 연결된 팝업·상태 모음. HTML 415개, 링크 32,343개, JavaScript 비활성 검사 오류 0건. 메뉴 내 상세 앵커 이동·뒤로가기·새로고침, 기존 철회 링크에서 부모 상세 묶음으로 이동, 390px 화면 넘침 없음, 정산 예외 패널 내용을 확인했습니다. 독립 프로덕션 빌드 통과.

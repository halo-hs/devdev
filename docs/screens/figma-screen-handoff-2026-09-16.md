# ERP 화면·상태 Figma 전달 — 2026-09-16

[Figma 화면 색인](https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=164-2) · [공개 HTML 화면 묶음](https://devdev-e6t.pages.dev/html/erp/index.html)

기존 HTML 352개와 보완 화면 28개, 총 **380개**를 업무별 18개 Figma 페이지에 가져왔다. 각 화면 아래에 상태, SSOT 설명·화면 ID·참조 문서명, HTML·원본 링크를 넣었다. **366개는 텍스트·도형 편집이 가능한 캡처**, **14개는 전송 중단 후 검증된 PNG로 보완한 화면**이다. 모든 화면의 하단 설명과 링크는 편집할 수 있다. 디자인 시스템 컴포넌트 인스턴스로 재구축한 파일은 아니다.

## 업무별 화면

| 업무 | 화면 수 | 대표 SSOT 대응 |
|---|---:|---|
| [처음 시작하기](https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=34-2) | 20 | SC-08 · `08-onboarding.md` |
| [오늘 할 일](https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=37-2) | 12 | SC-09 · `09-home.md` |
| [문서 올리기](https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=33-2) | 51 | SC-10 · `10-inbox.md` |
| [문서 만들기](https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=35-2) | 48 | SC-18 · `18-generated-document-create.md` |
| [AI에게 묻기](https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=36-2) | 39 | 관련 흐름 FS-06·FS-09 · `../shared-flows/06-worklist-and-team-overview.md` |
| [거래](https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=38-2) | 53 | SC-14 · `14-deals-list.md` |
| [선적](https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=45-2) | 31 | SC-22 · `22-shipments.md` |
| [정산](https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=43-2) | 34 | SC-21 · `21-settlement.md` |
| [운영 감시](https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=41-2) | 12 | SC-13 · `13-monitor.md` |
| [결산 리포트](https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=44-2) | 17 | SC-24 · `24-reports.md` |
| [영업 성과](https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=42-2) | 11 | SC-25 · `25-sales-performance.md` |
| [알림](https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=40-2) | 8 | FS-07 · `../shared-flows/07-notifications.md` |
| [거래처](https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=46-2) | 3 | SC-16 · `16-counterparty-360.md` |
| [증빙](https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=49-2) | 5 | SC-23 · `23-snap-evidence.md` |
| [설정](https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=48-2) | 26 | Common CS-06 (관련 참고) · `CS-06-account-profile.md` |
| [요금제](https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=50-2) | 4 | SC-35 · `35-billing.md` |
| [토큰](https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=51-2) | 3 | SC-36 · `36-token-usage.md` |
| [공통 메뉴](https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=123-2) | 3 | Common CS-07 · `CS-07-organization-context.md` |

## 보완·원본 확인

- 전환 중 로딩으로 저장됐던 11개 화면을 원본 devdev의 버튼 이동 결과로 보완했다. 같은 경로 이동 후 로딩이 지속된 3개는 해당 URL을 새로고침하여 확인했다.
- `DL-260801-01`, `DL-260802-02`, `DL-260803-03`은 원본에서도 거래 없음 화면이다. 데이터가 없는 샘플 상태로 표시했다.
- 문서·거래 삭제 확인, 운영 감시 예외 패널 4종, 정산 예외 패널 5종과 유형 메뉴의 가림 상태를 추가했다.
- 긴 목록·대시보드·거래 상세 14개는 실제 스크롤 높이로 세로를 확장한 전체 내용 보기를 추가했다. 문서 검토·연결 2개는 내부 패널의 하단 필드를 별도로 캡처했다.
- 원본 정산 유형 메뉴는 시트 오버레이 뒤에 가려진다. 이를 별도 화면으로 기록했고, 선택 결과 4개는 키보드로 선택해 캡처했다. 원본 코드는 변경하지 않았다.
- 일부 선적·운영 감시 행에서 이동 URL과 화면에 표시되는 거래번호가 다르다. 원본 샘플 연결 상태를 그대로 기록했다.

## SSOT 대응 주의점

- 기준은 사용자가 지정한 `법률검토해보자/.../ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens`이다. 이 로컬 문서의 공개 URL을 임의로 만들지 않았다.
- `/erp/ai`는 독립 AI 화면이다. SC-12의 Copilot 리다이렉트와 동일 화면으로 표시하지 않고 FS-06·FS-09의 업무 목록·질문 근거 흐름을 관련 참고로 표시했다.
- 현재 `/erp/sales`는 영업 성과이므로 SC-25에 대응한다. 영업 연락처·파이프라인인 SC-27과 구분했다.
- Common 설정은 CS-06·07·08, SNAP 설정은 SNAP SC-30을 구분하여 참조한다. Trade 색인에서 연결된 해당 제품의 실제 문서를 확인했다.
- 참조 MD 30개의 존재·제목·화면 ID를 대조했다. 거래처 360은 SC-16, 자료 가져오기는 SC-32로 연결하고 직접 대응과 관련 참고를 구분했다.
- 화면 캡처는 현재 구현의 시각적 기록이며 SSOT 정책 전체의 구현·QA 완료를 뜻하지 않는다.

[참조 MD 확인표](./figma-reference-audit-2026-09-16.md)에 문서 30개의 실제 경로와 화면별 참조 수를 정리했다.

전체 화면별 Figma 링크·출처·SSOT 대응은 [전달 명세 JSON](./figma-screen-handoff-2026-09-16.json)을 참고한다.

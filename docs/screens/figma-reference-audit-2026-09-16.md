# Figma 화면의 SSOT 참조 MD 확인 — 2026-09-16

380개 화면·상태의 참조 문서 30개를 실제 로컬 MD와 대조했다. 파일 존재와 화면·흐름 ID, 제목을 확인했고 잘못된 참조 및 구분이 모호했던 80개 상태의 연결을 정리했다. 이 문서는 참조 확인 결과이며 Figma 전체 가져오기 완료를 뜻하지 않는다.

- 거래처 360: SC-16. 거래처 마스터 설정 SC-31과 구분.
- AI에게 묻기: 독립 화면 명세가 없어 FS-06·FS-09를 관련 참고로 표시.
- 내 계정·조직·구성원: Common CS-06·07·08을 참조하고, 제품별 정책이 필요한 항목은 Trade 명세를 함께 표시.
- 자료 가져오기: Trade SC-32. SNAP 설정: SNAP SC-30.
- 영업 성과: Trade SC-25. 영업 연락처·파이프라인 SC-27과 구분.
- 선적·운영 감시에서 이동한 거래 상세는 SC-15로 연결.

`direct`는 해당 기능의 직접 명세, `related`는 관련 흐름·정책 참고이다. 공개 MD URL이 없어 아래 링크는 로컬 원문 경로를 사용한다. Figma에는 제품·화면 ID·파일명을 표시한다.

| 제품 | 명세 ID | MD 원문 | 참조 화면 수 | 대응 종류 |
|---|---|---|---:|---|
| Common | CS-06 | [CS-06-account-profile.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Platform-Common-SSOT-v1.0/functional-specs/screens/CS-06-account-profile.md>) | 13 | related |
| Common | CS-07 | [CS-07-organization-context.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Platform-Common-SSOT-v1.0/functional-specs/screens/CS-07-organization-context.md>) | 3 | direct |
| Common | CS-08 | [CS-08-members-invites.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Platform-Common-SSOT-v1.0/functional-specs/screens/CS-08-members-invites.md>) | 2 | related |
| SNAP | SC-30 | [SC-30-settings.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-SNAP-SSOT-v1.0/functional-specs/screens/SC-30-settings.md>) | 5 | direct |
| Trade | SC-08 | [08-onboarding.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens/08-onboarding.md>) | 20 | direct |
| Trade | SC-09 | [09-home.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens/09-home.md>) | 12 | direct |
| Trade | SC-10 | [10-inbox.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens/10-inbox.md>) | 14 | direct |
| Trade | SC-11 | [11-document-confirm.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens/11-document-confirm.md>) | 37 | direct |
| Trade | SC-13 | [13-monitor.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens/13-monitor.md>) | 11 | direct |
| Trade | SC-14 | [14-deals-list.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens/14-deals-list.md>) | 22 | direct |
| Trade | SC-15 | [15-deal-detail.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens/15-deal-detail.md>) | 38 | direct |
| Trade | SC-16 | [16-counterparty-360.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens/16-counterparty-360.md>) | 3 | direct |
| Trade | SC-18 | [18-generated-document-create.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens/18-generated-document-create.md>) | 48 | direct |
| Trade | SC-21 | [21-settlement.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens/21-settlement.md>) | 35 | direct |
| Trade | SC-22 | [22-shipments.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens/22-shipments.md>) | 24 | direct |
| Trade | SC-23 | [23-snap-evidence.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens/23-snap-evidence.md>) | 5 | direct |
| Trade | SC-24 | [24-reports.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens/24-reports.md>) | 17 | direct |
| Trade | SC-25 | [25-sales-performance.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens/25-sales-performance.md>) | 11 | direct |
| Trade | SC-28 | [28-settings-company.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens/28-settings-company.md>) | 1 | direct |
| Trade | SC-29 | [29-settings-members.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens/29-settings-members.md>) | 1 | related |
| Trade | SC-30 | [30-settings-invites.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens/30-settings-invites.md>) | 1 | related |
| Trade | SC-31 | [31-settings-counterparties.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens/31-settings-counterparties.md>) | 1 | direct |
| Trade | SC-32 | [32-settings-import.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens/32-settings-import.md>) | 2 | direct |
| Trade | SC-33 | [33-settings-alerts.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens/33-settings-alerts.md>) | 1 | direct |
| Trade | SC-34 | [34-settings-inbound-email.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens/34-settings-inbound-email.md>) | 1 | direct |
| Trade | SC-35 | [35-billing.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens/35-billing.md>) | 6 | direct / related |
| Trade | SC-36 | [36-token-usage.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/screens/36-token-usage.md>) | 4 | direct |
| Trade | FS-06 | [06-worklist-and-team-overview.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/shared-flows/06-worklist-and-team-overview.md>) | 39 | related |
| Trade | FS-07 | [07-notifications.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/shared-flows/07-notifications.md>) | 8 | direct |
| Trade | FS-09 | [09-ai-provenance-and-confidence.md](</Users/hans/orca/workspaces/ecoya-products/법률검토해보자/ecoya 2.0/ECOYA-Trade-OS-SSOT-v1.0/functional-specs/shared-flows/09-ai-provenance-and-confidence.md>) | 39 | related |

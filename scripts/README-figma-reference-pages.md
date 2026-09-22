# Figma 참고 페이지 캡처 갱신

대상 파일: `utViiVayT0rWuYSB5bpZ31`. 디자이너 작업 안내(444:2)와 **별도 참고 페이지**는 서로 다른 산출물입니다.

- `figma-reference-pages.json`: 이번 갱신 전의 기존 참고 프레임 목록. 기존 프레임 ID와 과거 레이어 보존 기준입니다.
- `prepare-figma-reference-pages.mjs`: 현재 HTML 목록, 인증 화면, 기존 참고 프레임을 대조해 참고 색인과 캡처 계획을 생성합니다.
- `capture-reference-extra-states.mjs`: HTML이 없는 삭제 확인·운영 감시 예외·정산 예외 메뉴를 배포 화면에서 캡처합니다. 삭제/확정 동작은 실행하지 않습니다.
- `capture-figma-reference-pages.mjs`: 저장된 HTML을 1920px 너비로 렌더링합니다. 일반 화면은 세로 전체, 열린 팝업은 1000px 높이로 캡처합니다.
- `check-figma-reference-pages.mjs`: HTML 및 이미지, 내부 링크, Figma 대응 관계와 최종 검증 결과를 검사합니다.

산출물은 `public/html/erp/captures/references/`에 있습니다. `manifest.json`에는 화면별 파일 경로, `figma.json`에는 **현재 프레임·이미지·원본 링크 노드 ID**와 검증 결과를 기록합니다. Figma를 다시 갱신할 때는 `figma.json`의 기존 ID를 우선 사용해 같은 화면을 중복 생성하지 않습니다.

현재 기준은 전체 로컬 소스를 반영한 배포 커밋 `bde1327`입니다. 참고 페이지 21개, 프레임 777개(이전 화면 변경 안내 103개 포함), 중복 원본을 제외한 PNG 761개입니다. 기존 편집 레이어는 해당 프레임 안에 숨김 보존하며, 현재 보이는 화면은 캡처 이미지입니다.

Figma 변경은 MCP로 페이지별로 나누어 수행하고, 이미지 업로드 후 모든 이미지 fill, HTML 링크, 프레임 겹침을 검증합니다. `figma.json`의 verification은 그 검증을 통과한 결과입니다. 캡처만 다시 생성한 경우 Figma 반영까지 완료된 것으로 간주하지 않습니다.

## 모듈 캡처 및 링크 보완 (2026-09-19)

`capture-missing-handoff-modules.mjs`는 대표 캡처가 다루지 않은 상태 HTML에서 팝업·선택 메뉴를 추출하고, `capture-inline-handoff-modules.mjs`는 거래 상세 구역과 홈의 개별 모듈을 캡처합니다. 결과와 Figma 노드 대응 관계는 `captures/modules/manifest.json`, `captures/modules/figma.json`에 기록합니다.

`build-handoff-reference-links.mjs`는 전체 참고 HTML 목록, 메뉴별 모듈 갤러리와 기획 문서 HTML을 생성합니다. 기획 원문 스냅샷은 `handoff-reference-specs.json`에 보관합니다. Markdown 렌더러는 작업용 디렉터리에 설치하며 애플리케이션 런타임 의존성에는 추가하지 않습니다.

```sh
npm install --prefix /tmp/erp-reference-tools marked --ignore-scripts --no-audit --no-fund
node scripts/build-handoff-reference-links.mjs
```

다른 설치 경로를 쓰면 `MARKED_MODULE`로 marked의 ESM 파일 경로를 지정합니다. 전체 HTML 재수출 후 이 스크립트를 실행해 보완 링크와 메뉴별 모듈 갤러리를 갱신합니다.

빈 인증 묶음 이미지 6개는 사용자 요청으로 제거했습니다. `handoff-hidden-captures.json`에 등록해 다시 생성하지 않습니다. 실제 인증 상태 HTML과 별도 참고 페이지의 정상 캡처는 유지합니다. 사용자가 별도로 삭제한 서비스 소개·거래 생명주기 묶음 프레임도 자동 복원하지 않습니다.

`check-handoff-module-links.mjs`는 모듈 파일, 50개 보완 HTML의 내부 링크, iframe에서 `index.html?page=...` 이동, 전체 참고 목록, 모듈 갤러리, 기획 문서를 검증합니다. 기본 서버는 `http://127.0.0.1:5195`, 배포 검증 시 `VERIFY_ORIGIN`을 지정합니다.

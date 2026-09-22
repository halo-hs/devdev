# 작업 도구

이 폴더의 파일은 개발자가 필요할 때 실행하는 도구입니다. 웹 페이지나 API 서버가 아닙니다. 명령은 저장소 루트에서 실행합니다.

| 폴더 | 역할 | 결과 |
| --- | --- | --- |
| `assets/` | 폰트 동기화·애니메이션·참조 CSS 생성 | `public/fonts`, `public/lottie`, `trade-os/operations/styles` 등 |
| `capture/` | 화면·팝업·폼 캡처 | `public/html/erp/captures` 등 |
| `checks/` | HTML·링크·화면 상태·컴포넌트 검사 | 콘솔 결과·검사 보고서 |
| `handoff/` | 디자인 전달 HTML·색인 생성과 관련 데이터 | `public/html/erp` |

## 자주 쓰는 명령

```sh
# 폰트 동기화: npm run dev/build에서도 자동 실행
npm run sync:design-system

# 실행 중인 로컬 앱을 디자인 참고 HTML로 내보내기
node scripts/handoff/export-erp-html.mjs http://127.0.0.1:5175

# 생성된 HTML 검사
node scripts/checks/check-erp-html.mjs
node scripts/checks/check-handoff-module-links.mjs

# 전달용 화면 캡처
node scripts/capture/capture-handoff-pages.mjs
```

내보내기·캡처 도구는 결과 파일을 갱신합니다. 실행 전 각 파일의 입력 URL과 출력 경로를 확인하세요. Figma 참고 화면 절차는 [별도 안내](handoff/README-figma-reference-pages.md)를 참고하세요.

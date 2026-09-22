import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { writeDesignerHandoff } from "./erp-designer-handoff.mjs"

const escapeHtml = (value) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;")

// Shared by the full export and an index-only refresh from manifest.json.
export async function writeErpHtmlIndex(out, pages, sourceOrigin = "http://127.0.0.1:5175") {
  pages = [...new Map(pages.map(page => [page.id, page])).values()]
  pages = await writeDesignerHandoff(out, pages.filter(page => !page.id.startsWith("designer-")), sourceOrigin)
  pages = await Promise.all(pages.map(async (page) => {
    const html = await fs.readFile(path.join(out, `${page.id}.html`), "utf8")
    return { ...page, skeleton: /data-slot="skeleton"|\banimate-pulse\b/.test(html) }
  }))
  const initial = pages.find((page) => page.id === "designer-guide") || pages[0]
  const commonTopLabels = new Set(["세계시간 열기", "더보기"])
  const topPages = new Map()
  const headerCache = new Map()
  const screenPages = []
  for (const page of pages) {
    const label = page.title.split(" · ").at(-1)
    // Only deduplicate shell header controls; a document's own More menu is distinct.
    if (commonTopLabels.has(label) && page.id.includes("-action-")) {
      const parent = page.parent || page.id.split("-action-")[0]
      if (!headerCache.has(parent)) {
        const html = await fs.readFile(path.join(out, `${parent}.html`), "utf8")
        headerCache.set(parent, html.match(/<header\b[^>]*>[\s\S]*?<\/header>/gi)?.join("\n") || "")
      }
      if (headerCache.get(parent).includes(`href="${page.id}.html"`)) {
        if (!topPages.has(label)) topPages.set(label, { ...page, title: label, group: "Top 영역" })
        continue
      }
    }
    screenPages.push(page)
  }
  const workPages = pages.filter(page => page.designKind === "menu")
  const representativeCount = new Set(workPages.flatMap(page => page.screenIds || [])).size
  const navigationPages = [...topPages.values(), ...screenPages.filter(page => !page.id.startsWith("designer-"))]
  const groups = [...new Set(navigationPages.map((page) => page.group))]
  const screenLink = (page, title = page.title) => `<a href="${escapeHtml(page.id)}.html" data-page="${escapeHtml(page.id)}" target="erp-preview" title="${escapeHtml(page.title)}">${escapeHtml(title)}${page.skeleton ? '<span class="state-badge">스켈레톤</span>' : ""}${page.fixture ? '<span class="state-badge">역할 예시</span>' : ""}</a>`
  const navigation = groups.map((group) => {
    const items = navigationPages.filter((page) => page.group === group)
    const workflows = [...new Set(items.map((page) => page.workflow).filter(Boolean))]
    const workflowSections = workflows.map((workflow) => `<details class="screen-flow" open><summary><span>${escapeHtml(workflow)}</span><small>${items.filter((page) => page.workflow === workflow).length}</small></summary><ol>${items.filter((page) => page.workflow === workflow).map((page) => `<li>${screenLink(page)}<small class="action-caption">${escapeHtml(page.action)}</small></li>`).join("")}</ol></details>`).join("")
    const regular = items.filter((page) => !page.workflow)
    const roots = regular.filter((page) => !regular.some((parent) => parent.id === page.parent))
    const ordinarySections = roots.map((root) => {
      const children = regular.filter((page) => page.parent === root.id)
      const shortTitle = root.title.replace(`${group} · `, "")
      if (!children.length) return `<li>${screenLink(root, shortTitle)}</li>`
      return `<li><details class="screen-flow"${root.id === initial.id ? " open" : ""}><summary><span>${escapeHtml(shortTitle)}</span><small>${children.length + 1}</small></summary><ul><li>${screenLink(root, "기본 화면")}</li>${children.map((page) => `<li>${screenLink(page, page.title.replace(`${root.title} · `, ""))}</li>`).join("")}</ul></details></li>`
    }).join("")
    return `<details class="screen-group"${group === initial.group || group === "Top 영역" ? " open" : ""}>
      <summary><span>${escapeHtml(group)}</span><small>${items.length}</small></summary>
      ${workflowSections}<ul>${ordinarySections}</ul>
    </details>`
  }).join("\n")
  const workNavigation = `<div class="screen-group">${screenLink(initial)}</div>` + workPages.map(menu => `<details class="screen-group"><summary>${escapeHtml(menu.title)}</summary><ul><li><a href="designer-guide.html#menu-${menu.id.replace("designer-menu-", "")}" data-page="designer-guide" target="erp-preview">작업 영역으로 이동</a></li>${menu.screenIds.map(id=>`<li><a href="designer-guide.html#${id}" data-page="designer-guide" target="erp-preview">${escapeHtml(pages.find(p=>p.id===id).title)}</a></li>`).join("")}</ul></details>`).join("")
  await fs.writeFile(path.join(out, "index.html"), `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="script-src 'self'; object-src 'none'">
  <title>ECOYA Trade OS · HTML 화면 목록</title>
  <link rel="stylesheet" href="assets/index.css">
  <script src="assets/index.js" defer></script>
</head>
<body class="screen-browser">
  <a class="skip-link" href="#preview">미리보기로 이동</a>
  <aside class="screen-sidebar" aria-label="화면 목록">
    <header class="screen-heading"><span>ECOYA Trade OS</span><h1>메뉴별 대표 화면 <small>${workPages.length}개 영역</small></h1><p>대표 구성 ${representativeCount}개 · 기존 구현 포함<br>신규·수정 작업 수를 뜻하지 않습니다.</p></header>
    <nav class="screen-navigation" aria-label="업무별 화면"><div class="screen-group"><a href="designer-component-guide.html" data-page="designer-component-guide" target="erp-preview">공통 컴포넌트 · 업무 UI 작업 범위</a></div>${workNavigation}<details class="reference-screens"><summary>상태별 참고 자료 · ${navigationPages.length}개</summary><p class="reference-count-note">기존 화면·팝업·탭·필터·상태별 캡처를 포함합니다. 같은 화면의 다른 상태도 각각 집계한 참고 자료 수입니다.</p>${navigation}</details></nav>
    <footer class="screen-note">디자인 검토용 화면입니다.<br>입력·저장 등 실제 처리는 실행되지 않습니다.</footer>
  </aside>
  <main class="screen-preview" id="preview" tabindex="-1">
    <header class="preview-heading"><h2 id="preview-title">${escapeHtml(initial.title)}</h2><span id="preview-state" class="state-badge" hidden>스켈레톤</span><div class="preview-links"><a id="html-link" href="${escapeHtml(initial.id)}.html">HTML 원본</a><a id="app-link" hidden title="해당 앱 페이지로 이동합니다. 모달·탭 상태는 앱에서 다시 선택해야 할 수 있습니다.">devdev 앱 화면</a></div></header>
    <section id="design-context" class="flow-context" aria-label="디자인 작업 범위" hidden></section>
    <section id="flow-context" class="flow-context" aria-label="버튼과 결과 화면" hidden><div id="flow-path"></div><div id="flow-next"></div><p id="flow-gaps" hidden></p></section>
    <div class="preview-stage">
      <div id="preview-loading" class="preview-loading" role="status" hidden><span class="loading-label">화면 불러오는 중</span><div class="skeleton-line"></div><div class="skeleton-line short"></div><div class="skeleton-panel"></div><div class="skeleton-panel"></div></div>
      <iframe name="erp-preview" title="ERP 화면 미리보기" src="${escapeHtml(initial.id)}.html" sandbox="allow-same-origin allow-top-navigation-by-user-activation"></iframe>
    </div>
  </main>
</body>
</html>
`)
  await fs.writeFile(path.join(out, "assets/index.css"), `
:root{font-family:system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;color:#253047;background:#fff;font-size:14px;line-height:1.5}
*{box-sizing:border-box}body{margin:0}a{color:inherit}a:focus-visible,summary:focus-visible{outline:2px solid #175ec0;outline-offset:-2px}
body:not(.screen-browser)>main{max-width:1120px;margin:auto;padding:24px}
.screen-browser{display:grid;grid-template-columns:280px minmax(0,1fr);height:100vh;height:100dvh;overflow:hidden}
.screen-sidebar{display:flex;flex-direction:column;min-height:0;min-width:0;background:#f7f8fa;border-right:1px solid #dce1e8}
.screen-heading{padding:22px 20px 18px;border-bottom:1px solid #e0e4e9}
.screen-heading>span{font-size:12px;color:#5c6574;font-weight:600}
.screen-heading h1{display:flex;align-items:center;gap:10px;margin:6px 0;font-size:20px;line-height:1.4}
.screen-heading h1 small{font-size:12px;font-weight:500;color:#5c6574}
.screen-heading p{margin:0;font-size:12px;color:#5c6574}
.screen-navigation{flex:1;min-height:0;overflow:auto;padding:10px;overscroll-behavior:contain;scrollbar-gutter:stable}
.screen-group{margin-bottom:3px}
.reference-screens>summary{padding:16px 10px;border-top:1px solid #dce1e8;cursor:pointer;font-weight:650}.reference-screens{margin-top:12px}
.reference-count-note{margin:0 10px 12px;color:#5c6574;font-size:12px;line-height:1.6}
.screen-group summary{display:flex;align-items:center;gap:8px;padding:10px;border-radius:6px;cursor:pointer;list-style:none;font-weight:650}
.screen-group summary::-webkit-details-marker{display:none}
.screen-group summary:before{content:"";width:6px;height:6px;border-right:1.5px solid #697282;border-bottom:1.5px solid #697282;transform:rotate(-45deg);margin-right:3px}
.screen-group[open]>summary:before{transform:rotate(45deg)}
.screen-group summary small{margin-left:auto;font-size:11px;color:#697282;font-weight:400}
.screen-group summary:hover{background:#e9edf2}
.screen-group ul{list-style:none;margin:2px 0 10px 13px;padding:0 0 0 8px;border-left:1px solid #dce1e8}
.screen-group a{display:block;padding:8px 10px;border-radius:5px;text-decoration:none;font-size:12px;overflow-wrap:anywhere;color:#495568}
.screen-group a:hover,.screen-group a:focus{background:#e7effc;color:#175ec0}
.screen-note{padding:14px 20px;border-top:1px solid #e0e4e9;color:#697282;font-size:11px}
.screen-preview{display:flex;flex-direction:column;min-width:0;min-height:0}
.preview-heading{display:flex;align-items:center;gap:16px;min-height:48px;padding:10px 20px;border-bottom:1px solid #e0e4e9}
.preview-heading h2{font-size:13px;margin:0;font-weight:600}
.preview-heading h2{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.preview-links{display:flex;gap:8px;margin-left:auto;flex-shrink:0}
.preview-links a{padding:5px 9px;border:1px solid #dce1e8;border-radius:5px;text-decoration:none;font-size:12px}
.preview-links a:hover{background:#e7effc;color:#175ec0}
.state-badge{display:inline-block;margin-left:6px;border-radius:4px;background:#e9edf2;padding:1px 5px;font-size:10px;font-weight:500;color:#495568}
[hidden]{display:none!important}
.screen-group a[aria-current="page"]{background:#e7effc;color:#175ec0;font-weight:650}
.screen-flow>summary{font-size:12px;font-weight:600}
.screen-flow ol{list-style:none;margin:0 0 12px 13px;padding:0 0 0 8px;border-left:1px solid #dce1e8}
.screen-flow ol li{padding-bottom:7px}
.action-caption{display:block;padding:0 10px;font-size:10px;color:#697282;overflow-wrap:anywhere}
.flow-context{padding:9px 20px;border-bottom:1px solid #e0e4e9;background:#f7f8fa;font-size:12px;max-height:180px;overflow:auto}
#flow-path{display:flex;gap:8px;align-items:center;flex-wrap:wrap;color:#495568}
#flow-next{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:6px}
.flow-context a{color:#175ec0;text-decoration:none;border:1px solid #dce1e8;background:white;border-radius:5px;padding:3px 7px}
#flow-gaps{margin:8px 0 0;color:#8a4b0f;white-space:pre-line}
.preview-stage{position:relative;flex:1;min-height:0;display:flex}
.screen-preview iframe{display:block;flex:1;width:100%;min-height:0;border:0;background:#fff}
.preview-loading{position:absolute;inset:0;z-index:1;background:#fff;padding:32px;pointer-events:auto}
.loading-label{display:block;color:#697282;font-size:12px;margin-bottom:24px}
.skeleton-line,.skeleton-panel{background:#e9edf2;border-radius:6px;margin-bottom:20px;animation:preview-pulse 1.5s ease-in-out infinite}
.skeleton-line{height:18px;width:55%}.skeleton-line.short{width:35%}.skeleton-panel{height:140px;width:100%}
@keyframes preview-pulse{50%{opacity:.45}}
@media(prefers-reduced-motion:reduce){.skeleton-line,.skeleton-panel{animation:none}}
.skip-link{position:fixed;left:12px;top:-100px;z-index:1;padding:10px;background:#fff}
.skip-link:focus{top:12px}
@media(max-width:700px){.screen-browser{grid-template-columns:156px minmax(0,1fr)}.screen-heading{padding:16px 12px}.screen-heading h1{font-size:17px}.screen-heading p,.screen-note{display:none}.screen-navigation{padding:6px}.screen-group summary{padding:10px 5px;font-size:12px}.screen-group ul{margin-left:7px;padding-left:4px}.screen-group a{padding:9px 6px}.preview-heading{padding:10px;flex-wrap:wrap;gap:6px}.preview-heading h2{width:100%}.preview-links{margin-left:0;flex-wrap:wrap}.preview-links a{font-size:11px;padding:4px 6px}}
`)
  await fs.writeFile(path.join(out, "assets/index-pages.json"), JSON.stringify(pages) + "\n")
  await fs.copyFile(fileURLToPath(new URL("./erp-html-viewer.js", import.meta.url)), path.join(out, "assets/index.js"))
}

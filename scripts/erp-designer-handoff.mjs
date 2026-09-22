import { renderDesignerFlow } from "./erp-designer-flow-reference.mjs"
import fs from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { chromium } from "@playwright/test"
import { erpSourceProvenance } from "./erp-source-provenance.mjs"

export const escapeHtml = (value = "") => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;")
const units = JSON.parse(await fs.readFile(new URL("./erp-designer-work.json", import.meta.url), "utf8"))
export const designerMenus = JSON.parse(await fs.readFile(new URL("./erp-designer-menus.json", import.meta.url), "utf8"))
const designerFlows = JSON.parse(await fs.readFile(new URL("./erp-designer-flows.json", import.meta.url), "utf8"))
const designerConcerns = JSON.parse(await fs.readFile(new URL("./erp-designer-concerns.json", import.meta.url), "utf8"))
const publicAuthCaptures = JSON.parse(await fs.readFile(new URL("./erp-public-auth-captures.json", import.meta.url), "utf8"))
const figma = (id) => `https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=${id.replace(":", "-")}`
const workId = (unit) => unit.kind === "representative" ? unit.id : `designer-${unit.id}`
const menuId = (unit) => `designer-menu-${unit.menuId}`
const groups = { representative: "작업 · 대표 화면", popup: "작업 · 팝업·패널", states: "작업 · 상태별 차이" }
const samples = { "사업자번호 입력": "000-00-00000", "등록번호 입력": "000000-0000000", "건물, 층, 호수": "ECOYA 빌딩 8층", "은행명 입력": "샘플 은행", "계좌번호 입력": "000-0000-0000", "SWIFT 코드": "DEMOXXXX", "예: 조민영 / 대표이사": "조민영 / 대표이사" }

const styles = `
.designer-page{margin:0!important;height:auto!important;min-height:100vh;overflow:auto!important;background:#f4f7fb;color:#17314c;font-family:Pretendard,system-ui,sans-serif}
.designer-page>main{max-width:1900px;margin:auto;padding:32px;min-width:0}
.designer-heading{margin-bottom:24px;max-width:1100px}.designer-heading h1{font-size:26px;font-weight:700;line-height:1.4;margin:12px 0}.designer-heading p{font-size:15px;line-height:1.7;margin:10px 0}.designer-heading nav{display:flex;gap:16px;flex-wrap:wrap}.designer-heading a,.designer-part>h2 a,.designer-work-list a{color:#175cc0}.designer-page a:focus-visible{outline:2px solid #175cc0;outline-offset:3px}
.designer-parts{display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start}.designer-part{background:#fff;padding:20px;border:1px solid #dce4ee;border-radius:12px;max-width:100%;min-width:0}.designer-part>h2{font-size:14px;margin:0 0 18px;font-weight:600}.designer-fragment{overflow:auto;max-width:100%;padding:4px}
.designer-work-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,310px),1fr));gap:16px}.designer-work-list article{background:white;border:1px solid #dce4ee;border-radius:10px;padding:20px}.designer-work-list h2{font-size:18px;font-weight:700;margin-bottom:16px}.designer-work-list ul{padding-left:18px;list-style:disc}.designer-work-list li{margin:9px 0}.designer-note{max-width:1100px;line-height:1.8;margin-top:24px;padding:20px;border:1px solid #dce4ee;border-radius:10px;background:white}.designer-note h2{font-weight:700;margin-bottom:10px}.designer-note p+p,.designer-note ul{margin-top:12px}.designer-note ul{padding-left:22px;list-style:disc}.designer-note li{margin:8px 0}
[data-onboarding-demo]{position:relative;margin:12px 0;padding:10px 14px;border:1px solid #dce4ee;border-radius:8px;background:#f4f7fb;color:#486581;font:13px/1.6 system-ui}
@media(max-width:700px){.designer-page>main{padding:16px}.designer-part{padding:12px}.designer-heading h1{font-size:22px}}
.designer-menu-row{margin:32px 0;padding-top:24px;border-top:1px solid #ccd8e8;scroll-margin-top:20px}.designer-menu-row>h2{font-size:22px;font-weight:700;margin:0 0 12px}.designer-menu-row>p{margin:0 0 16px;line-height:1.7}
.designer-pair{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,38%);gap:24px;align-items:start}
.designer-screen-viewport{container-type:inline-size;aspect-ratio:1440/1000;overflow:hidden;border:1px solid #dce4ee;border-radius:8px;background:white;min-width:0}.designer-screen{width:1440px;height:1000px;position:relative;transform:translateZ(0);overflow:hidden;zoom:calc(100cqw / 1440px)}.designer-screen [data-slot=sidebar-wrapper]{height:1000px!important}.designer-screen .static-handoff-nav{display:none!important}
.designer-related{min-width:0}.designer-related-unit{margin-bottom:24px;padding:16px;border:1px solid #dce4ee;border-radius:10px;background:white;overflow:auto}.designer-related-unit>h3{font-size:18px;font-weight:700;margin-bottom:10px}.designer-related-unit>p{font-size:13px;line-height:1.7;margin-bottom:14px}.designer-related-unit .designer-parts{display:block}.designer-related-unit .designer-part{padding:8px;margin-bottom:12px}.designer-menu-jumps{display:flex;flex-wrap:wrap;gap:12px;margin:20px 0}
.designer-related .designer-fragment{container-type:inline-size;width:100%}.designer-related .designer-fragment>:first-child{zoom:min(1,calc(100cqw / var(--fragment-width)))}
@media(max-width:800px){.designer-pair{grid-template-columns:1fr}.designer-related{border-left:3px solid #c8dafa;padding-left:12px}}
.designer-related{display:flex;flex-direction:column;gap:24px}.designer-related-unit{margin-bottom:0}
.designer-screen-viewport{aspect-ratio:var(--screen-ratio,1440/1000)}.designer-screen{height:var(--screen-height,1000px)}.designer-screen [data-slot=sidebar-wrapper]{height:var(--screen-height,1000px)!important}
.designer-area{margin:64px 0;border-top:3px solid #9aafc9;padding-top:32px;scroll-margin-top:24px}.designer-area>.designer-heading h2{font-size:28px;font-weight:700}.designer-flow{padding:24px;background:white;border:1px solid #dce4ee;border-radius:10px;margin:24px 0;display:grid;grid-template-columns:1fr 1fr;gap:24px}.designer-flow h3{font-size:18px;font-weight:700;margin-bottom:12px}.designer-flow ul,.designer-flow ol{padding-left:20px;list-style:disc}.designer-flow li{margin:8px 0;line-height:1.6}.designer-flow a{color:#175cc0}.designer-state-values{display:flex;flex-wrap:wrap;gap:8px}.designer-state-values span{padding:5px 9px;background:#eef4fb;border-radius:4px;font-size:13px}.designer-flow-note{grid-column:1/-1;font-size:13px;line-height:1.7;color:#53647a}.designer-sidebar-example{width:232px;max-width:100%;--sidebar-width:232px}.designer-sidebar-example [data-slot=sidebar]{display:block!important}.designer-sidebar-example [data-slot=sidebar-gap]{display:none!important}.designer-sidebar-example [data-slot=sidebar-container]{position:relative!important;inset:auto!important;width:232px!important;height:1000px!important}.designer-sidebar-example [data-slot=sidebar-content]{overflow:visible!important}.designer-sidebar-example [data-slot=sidebar-footer]{margin-top:auto}
@media(max-width:700px){.designer-flow{grid-template-columns:1fr;padding:16px}}
`

function documentHtml(title, body, cssLinks = []) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="script-src 'none'; object-src 'none'"><title>${escapeHtml(title)} · ECOYA Trade OS</title>${cssLinks.join("")}<link rel="stylesheet" href="assets/designer.css"></head><body class="designer-page"><main>${body}</main></body></html>\n`
}

export async function writeDesignerHandoff(out, pages, sourceOrigin = "http://127.0.0.1:5175") {
  if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(sourceOrigin).hostname) && sourceOrigin !== process.env.ERP_CAPTURE_DEPLOYMENT)
    throw new Error("Designer fragments require the same local source as the ERP export.")
  const provenance = await erpSourceProvenance()
  // Preserve supplemental public-entry screens during an ERP-only index refresh.
  pages = [...pages.filter(p => !p.id.startsWith("auth-")), ...publicAuthCaptures]
  if(!pages.some(p=>p.id==="sidebar-full")) pages=[{id:"sidebar-full",title:"공통 UI · 전체 사이드바",group:"공통 UI"},...pages]
  await fs.writeFile(path.join(out, "assets/designer.css"), styles)
  const byId = new Map(pages.map(p => [p.id, p]))
  // Fill only blank demo fields. Preserve explicitly entered sample values and file-empty states.
  for (const p of pages.filter(p => p.id.startsWith("onboarding"))) {
    const file = path.join(out, `${p.id}.html`)
    let html = await fs.readFile(file, "utf8")
    html = html.replace(/<input\b[^>]*>/g, tag => {
      const placeholder = tag.match(/placeholder="([^"]*)"/)?.[1]
      if (!samples[placeholder] || /\bvalue="[^"]+"/.test(tag)) return tag
      return tag.replace(/\svalue=""/, "").replace(/>$/, ` value="${samples[placeholder]}" data-demo-value="true">`)
    })
    if (!html.includes('data-onboarding-demo')) {
      html = html.replace(/(<main\b[^>]*>)/, '$1<aside data-onboarding-demo="true">ECOYA Demo Co. · 회사·사업자·은행·계좌·서명자 정보는 디자인 확인용 샘플입니다.</aside>')
    }
    if (!html.includes('href="assets/designer.css"')) html = html.replace("</head>", '<link rel="stylesheet" href="assets/designer.css"></head>')
    await fs.writeFile(file, html)
  }

  const browser = await chromium.launch({ channel: "chrome" })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const sourceCss = (await fs.readFile(path.join(out, "home.html"), "utf8")).match(/<link\b[^>]*rel="stylesheet"[^>]*>/g) || []
  const added = [{ id: "designer-component-guide", title: "공통 컴포넌트 · 업무 UI 작업 범위", group: "작업 안내", designKind: "guide" }]
  const menuBodies = []
  const fragmentAudit = []
  try {
    await page.goto(pathToFileURL(path.join(out,"home.html")).href)
    const sidebar = await page.locator('[data-slot=sidebar]').evaluate(n=>n.outerHTML)
    await fs.writeFile(path.join(out,"sidebar-full.html"),documentHtml("공통 UI · 전체 사이드바",`<header class="designer-heading"><h1>전체 사이드바</h1><p>제품·조직 전환 → 주요 업무 → 기록 → 경영·성과 → 사용자·설정·지원</p></header><div class="designer-sidebar-example">${sidebar}</div>`,sourceCss))
    for (const unit of units.filter(u => u.kind !== "representative")) {
      const parts = []
      for (const part of unit.parts) {
        const file = path.join(out, `${part.id}.html`)
        const cacheFile = path.join(out, "assets", `designer-source-${part.id}.json`)
        let fragment
        const authCapture = publicAuthCaptures.find(c => c.id === part.id)
        if (authCapture) {
          // Isolate the current public stylesheet from the older ERP snapshots.
          fragment = { width: authCapture.width, html: `<iframe title="${escapeHtml(authCapture.title)}" src="${part.id}.html#auth-preview" style="display:block;border:0;width:${authCapture.width}px;height:${authCapture.height}px" loading="lazy"></iframe>`, text: authCapture.title }
        }
        if (part.live && process.env.ERP_DESIGNER_USE_CACHE === "1") {
          try { fragment = JSON.parse(await fs.readFile(cacheFile, "utf8")) } catch (error) { if (error.code !== "ENOENT") throw error }
          if (fragment && (fragment.sourceFingerprint !== provenance.sourceFingerprint || fragment.source !== `${sourceOrigin}${part.live}`)) fragment = null
        }
        if (!fragment && part.live) {
          // Supplemental panels must come from the same source as the surrounding HTML.
          await page.goto(`${sourceOrigin}${part.live}`, { waitUntil: "networkidle" })
          const unavailable = () => ({ width: 720, text: "현재 화면에서 제공하지 않는 이전 상태", html: '<div data-retired="true"><p>현재 화면에서 제공하지 않는 이전 상태입니다. 최신 화면의 모듈 목록을 확인해 주세요.</p></div>' })
          for (const name of part.actions || []) {
            const button = page.getByRole("button", { name, exact: true }).first()
            if (!(await button.count()) || !(await button.isEnabled())) { fragment = unavailable(); break }
            await button.click()
          }
          if (!fragment && part.row) {
            const row = page.getByRole("row").filter({ hasText: part.row }).first()
            if (!(await row.count())) fragment = unavailable()
            else await row.click()
          }
          if (!fragment && part.option) {
            const select = page.getByRole("combobox", { name: "예외 유형" })
            if (!(await select.count())) fragment = unavailable()
            else { await select.click(); await page.getByRole("option", { name: part.option, exact: true }).press("Enter") }
          }
        } else if (!fragment) await page.goto(pathToFileURL(file).href, { waitUntil: "load" })
        if (!fragment) {
        await page.evaluate(() => document.fonts.ready)
        fragment = await page.evaluate(part => {
          let n
          if(document.querySelector("[data-retired]")) n=document.querySelector("[data-retired]")
          else if (["link", "attachment"].includes(part.selector)) {
            const label = part.selector === "link" ? "공유 링크" : "동봉할 파일"
            n = part.selector === 'attachment' ? document.querySelector('[aria-label="동봉할 파일"]') : [...document.querySelectorAll('[role="dialog"] *')].find(el => !el.children.length && el.textContent.trim() === label)?.parentElement?.parentElement?.parentElement
          } else if (part.selector === "items") {
            const title = [...document.querySelectorAll('main *')].find(el => !el.children.length && el.textContent.trim() === "품목")
            n = title?.parentElement
            while (n && !n.querySelector('table')) n = n.parentElement
          } else {
            const candidates = [...document.querySelectorAll(part.selector)].filter(el => el.getAttribute('data-state') !== 'closed' && el.getBoundingClientRect().width > 0 && (!part.contains || el.textContent.includes(part.contains)))
            n = candidates.sort((a,b) => a.querySelectorAll('*').length - b.querySelectorAll('*').length)[0]
          }
          if (!n) throw new Error(`Missing fragment: ${part.id} ${part.selector}`)
          const rect = n.getBoundingClientRect(), clone = n.cloneNode(true)
          clone.removeAttribute('aria-modal')
          for (const el of [clone, ...clone.querySelectorAll('*')]) {
            for (const a of [...el.attributes]) if (/^on/i.test(a.name)) el.removeAttribute(a.name)
            if (el.matches('script,iframe,object,embed')) { el.remove(); continue }
            if (el.matches('input,textarea')) { el.readOnly = true; if (el.tagName === 'INPUT') el.setAttribute('value', el.value); else el.textContent = el.value }
            if (el.matches('button')) { el.type = 'button'; el.title = '디자인 참고 요소입니다. 원본 상태 HTML에서 다음 화면을 확인하세요.' }
            if (el.matches('form')) { el.removeAttribute('action'); el.removeAttribute('method') }
            const href = el.getAttribute('href')
            if (href?.startsWith('/erp')) el.removeAttribute('href')
          }
          Object.assign(clone.style, { position:'relative', inset:'auto', transform:'none', translate:'none', margin:'0', width:rect.width+'px', maxWidth:'none', height:part.selector==='[role=dialog]' && rect.height>800?rect.height+'px':'auto', maxHeight:'none', flex:'none', overflow:'visible' })
          return { html:clone.outerHTML, width:rect.width, rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height}, text:n.textContent.trim().slice(0,220) }
        }, part)
        if (part.live) await fs.writeFile(cacheFile, JSON.stringify({ ...fragment, ...provenance, source: `${sourceOrigin}${part.live}`, capturedAt: new Date().toISOString() }) + "\n")
        }
        if (process.env.ERP_DESIGNER_AUDIT === "1") fragmentAudit.push({unitId:unit.id,...part,rect:fragment.rect,text:fragment.text,width:fragment.width})
        const sourcePage = part.live ? pages.find(p => p.route === part.live) : null
        const sourceLink = part.live ? `${sourcePage?.id ?? "home"}.html` : `${part.id}.html`
        parts.push(`<article class="designer-part"><h2><a href="${escapeHtml(sourceLink)}"${part.live ? ' target="_top"' : ''}>${escapeHtml(byId.get(part.id)?.title || part.id)} · 원본 보기</a></h2><div class="designer-fragment" style="--fragment-width:${fragment.width}px">${fragment.html}</div></article>`)
      }
      const body = `<header class="designer-heading"><nav><a href="designer-guide.html">디자이너 작업 안내</a><a href="${figma(unit.figmaNodeId)}">Figma 작업 프레임</a></nav><h1>${unit.priority} · ${escapeHtml(unit.title)}</h1><p>${escapeHtml(unit.brief)}</p><p>참조: ${escapeHtml(unit.refs)}</p></header><section class="designer-parts">${parts.join("")}</section>`
      const id = workId(unit)
      await fs.writeFile(path.join(out, `${id}.html`), documentHtml(unit.title, body.replaceAll('<a href="https://www.figma.com/', '<a target="_top" href="https://www.figma.com/'), sourceCss))
      added.push({ id, title: unit.title, group: groups[unit.kind], designKind: unit.kind, priority: unit.priority, brief: unit.brief, sourceIds: unit.sourceIds, figma: figma(unit.figmaNodeId) })
    }
    for (const menu of designerMenus) {
      const rows = []
      for (const id of menu.screens) {
        const unit = units.find(u => u.id === id)
        await page.goto(pathToFileURL(path.join(out, `${id}.html`)).href, { waitUntil: "load" })
        const authCapture = publicAuthCaptures.find(c => c.id === id)
        const screenHeight=authCapture?.height ?? (id==="sidebar-full"?1200:unit.fullHeight?await page.evaluate(()=>Math.max(1000,...[...document.querySelectorAll('main,main *')].filter(n=>/auto|scroll/.test(getComputedStyle(n).overflowY)).map(n=>n.scrollHeight+60))):1000)
        const screen = authCapture ? `<iframe title="${escapeHtml(authCapture.title)}" src="${id}.html#auth-preview" style="display:block;border:0;width:1440px;height:${screenHeight}px" loading="lazy"></iframe>` : await page.evaluate(() => {
          const clone = document.body.cloneNode(true)
          clone.querySelectorAll('script,.static-handoff-nav,[role=dialog],[data-slot=dialog-overlay],[data-onboarding-demo]').forEach(n=>n.remove())
          return clone.innerHTML
        })
        const related = []
        for (const child of units.filter(u => u.parentId === id)) {
          await page.goto(pathToFileURL(path.join(out, `${workId(child)}.html`)).href, { waitUntil: "load" })
          const parts = await page.locator('.designer-parts').evaluate(n=>n.outerHTML)
          related.push(`<section class="designer-related-unit" id="${child.id}"><h3>${child.isDetail ? "대표 상세 · " : child.kind === "popup" ? "관련 팝업 · " : "관련 상태 · "}${escapeHtml(child.title)}</h3><p>${escapeHtml(child.brief)}</p>${parts}</section>`)
        }
        rows.push(`<section class="designer-menu-row" id="${id}" data-representative="${id}"><h2>${escapeHtml(unit.title)}</h2><p>${escapeHtml(unit.brief)} <a href="${id}.html">원본 크기로 보기</a> · <a target="_top" href="${figma(unit.figmaNodeId)}">Figma</a></p><div class="designer-pair${related.length ? "" : " no-related"}"><div class="designer-screen-viewport" style="--screen-ratio:1440/${screenHeight};--screen-height:${screenHeight}px"><div class="designer-screen">${screen}</div></div>${related.length ? `<aside class="designer-related" aria-label="${escapeHtml(unit.title)}의 상세·팝업·상태">${related.join("")}</aside>` : ""}</div></section>`)
      }
      const flow=designerFlows.find(f=>f.menuId===menu.id)
      const flowHtml = renderDesignerFlow(flow, menu, byId)
      const header = `<header class="designer-heading"><h2>${escapeHtml(menu.title)}</h2><p>목록·상세 → 주요 CTA → 관련 팝업·상태</p><nav class="designer-menu-jumps">${menu.screens.map(id=>`<a href="#${id}">${escapeHtml(units.find(u=>u.id===id).title)}</a>`).join("")}</nav></header>`
      const id = `designer-menu-${menu.id}`
      const body=header+flowHtml+rows.join("")
      menuBodies.push(`<section class="designer-area" id="menu-${menu.id}">${body}</section>`)
      await fs.writeFile(path.join(out, `${id}.html`), documentHtml(menu.title, body, sourceCss))
      added.push({id,title:menu.title,group:"메뉴별 대표 화면",designKind:"menu",screenIds:menu.screens})
    }
    if(process.env.ERP_DESIGNER_AUDIT === "1") await fs.writeFile("/tmp/erp-designer-fragment-audit.json",JSON.stringify(fragmentAudit,null,2))
  } finally { await browser.close() }

  const menuGuide = `<header class="designer-heading"><nav><a href="index.html">화면 목록</a><a href="reference-index.html">Figma 참고 페이지 색인</a><a target="_top" href="${figma('460:2')}">Figma 작업 안내</a></nav><h1>메뉴별 대표 화면 · ${designerMenus.length}개 작업 영역</h1><p>기존 구현을 포함한 대표 구성 ${new Set(designerMenus.flatMap(menu => menu.screens)).size}개입니다. 신규·수정 작업 수가 아니며, 완료 여부는 별도로 구분하지 않았습니다. 팝업·패널·상태는 관련 화면 옆에 함께 표시합니다.</p></header><section class="designer-work-list">${designerMenus.map(m=>`<article><h2><a href="designer-menu-${m.id}.html">${escapeHtml(m.title)}</a></h2><ul>${m.screens.map(id=>`<li><a href="designer-menu-${m.id}.html#${id}">${escapeHtml(units.find(u=>u.id===id).title)}</a></li>`).join("")}</ul></article>`).join("")}</section><section class="designer-note"><h2>디자인 범위</h2><p>목록·상세·관련 팝업을 비교하며 더 자연스러운 업무 흐름과 정보 구조를 제안해주세요. 여기의 화면 배치와 정렬은 참고 자료를 읽기 위한 구성입니다. 대표 업무의 시작·판단·처리·완료와 예외 복구를 함께 검토해주세요.</p><p>홈 드래그앤드롭·모듈 배치, 문서 만들기·문서 올리기·거래 상세의 기존 UI 구조와 동선은 유지합니다. 해당 구조 안에서 상태·권한·오류 복구를 확인해주세요. 선적·정산·모니터링·영업성과는 업무 의미를 유지하며 개선안을 제안할 수 있습니다. 변경안의 의도와 기대 효과를 함께 설명해주세요. Approval은 Pilot 기본 비활성입니다. 온보딩 정보는 ECOYA Demo Co.의 데모 예시입니다.</p></section>`
  const unifiedGuide=menuGuide.replaceAll(/href="designer-menu-([^"#]+)\.html(?:#([^"]+))?"/g,(_,menu,anchor)=>`href="#${anchor||'menu-'+menu}"`).replace("메뉴별 대표 화면 ·", "디자이너 작업 보드 ·") + '<section class="designer-note"><h2>현재 구현 기준 · 공통 컴포넌트와 업무 UI</h2><p>공통 컴포넌트는 재사용하고, 업무 UI는 조합·상태·상호작용을 설계합니다. 사이드바는 기존 공통 재사용, 테이블은 별도 작업 항목입니다. 그래프도 포함합니다.</p><p><a href="designer-component-guide.html">작업 범위와 화면별 확인 목록 →</a></p></section>'
  const concerns=designerConcerns.map(c=>`<section class="designer-note" id="${c.id}"><h2>${escapeHtml(c.title)}</h2><p>${escapeHtml(c.context)}</p><p>${escapeHtml(c.problem)}</p><p>${escapeHtml(c.request)}</p><ul>${c.questions.map(q=>`<li>${escapeHtml(q)}</li>`).join("")}</ul><p><strong>요청 산출물:</strong> ${escapeHtml(c.deliverables)}</p></section>`).join("")
  await fs.writeFile(path.join(out, "designer-guide.html"), documentHtml("디자이너 작업 안내", unifiedGuide+concerns+menuBodies.join(""),sourceCss))
  const enriched = pages.map(p => {
    const matches = units.filter(u => u.sourceIds.includes(p.id))
    const representative = matches.find(u => u.kind === "representative")
    return { ...p, ...(representative ? { designKind: "representative", priority: representative.priority, brief: representative.brief } : {}), designWork: matches.map(u => ({ id: "designer-guide", anchor:u.parentId||u.id, title: u.title, kind:"menu", priority: u.priority, brief: u.brief })) }
  })
  return [{ id:"designer-guide", title:"디자이너 작업 안내", group:"작업 안내", designKind:"guide" }, ...enriched, ...added]
}

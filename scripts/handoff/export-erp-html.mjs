/** Export rendered ERP screens as a script-free, independently browsable handoff.
 * Usage: node scripts/handoff/export-erp-html.mjs [http://127.0.0.1:5175]
 * The source app is used only at generation time; output requires no React/Vite/runtime.
 */
import { chromium } from "@playwright/test"
import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"
import os from "node:os"
import { AsyncLocalStorage } from "node:async_hooks"
import { writeErpHtmlIndex } from "./erp-html-index.mjs"
import { documentFlowPages } from "./erp-document-flows.mjs"
import { extendInteractionFlows } from "./erp-interaction-flows.mjs"
import { erpSourceProvenance } from "./erp-source-provenance.mjs"
const sourceProvenance = await erpSourceProvenance()
const origin = process.argv[2] || "http://127.0.0.1:5175"
if (
  !["localhost", "127.0.0.1", "[::1]"].includes(new URL(origin).hostname) &&
  origin !== process.env.ERP_CAPTURE_DEPLOYMENT &&
  !new URL(origin).hostname.endsWith(".localhost")
)
  throw new Error("Export requires a local server or the explicitly verified ERP_CAPTURE_DEPLOYMENT.")
const out = path.resolve("public/html/erp")
await fs.mkdir(path.join(out, "assets"), { recursive: true })
const browser = await chromium.launch({ channel: "chrome" })
const primaryPage = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
})
const pageStore = new AsyncLocalStorage()
const page = new Proxy(primaryPage,{get(target,key){const current=pageStore.getStore()||target;const value=Reflect.get(current,key,current);return typeof value==="function"?value.bind(current):value}})
const workers=[]
for(let i=0;i<3;i++){
 const worker=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:"reduce"})
 worker.setDefaultTimeout(10000)
 await worker.addInitScript(()=>localStorage.clear())
 await worker.route("**/*",r=>new URL(r.request().url()).origin===new URL(origin).origin&&["GET","HEAD"].includes(r.request().method())?r.continue():r.abort())
 workers.push(worker)
}
async function mapJobs(jobs,fn){let next=0;await Promise.all(workers.map(async worker=>{while(next<jobs.length){const job=jobs[next++];await pageStore.run(worker,()=>fn(job))}}))}
page.setDefaultTimeout(5000)
await page.addInitScript(() => localStorage.clear())
await page.route("**/*", (request) => {
  const url = new URL(request.request().url())
  return url.origin === new URL(origin).origin &&
    ["GET", "HEAD"].includes(request.request().method())
    ? request.continue()
    : request.abort()
})
const cacheDir = path.join(os.tmpdir(), "ecoya-erp-html-export-cache")
const cacheProvenanceFile = path.join(cacheDir, "source-provenance.json")
if (process.env.ERP_HTML_RESUME === "1") {
  const cachedSource = JSON.parse(await fs.readFile(cacheProvenanceFile, "utf8"))
  if (cachedSource.sourceFingerprint !== sourceProvenance.sourceFingerprint)
    throw new Error("Export cache belongs to a different source. Run without ERP_HTML_RESUME.")
}
if (process.env.ERP_HTML_RESUME !== "1")
  await fs.rm(cacheDir, { recursive: true, force: true })
await fs.mkdir(cacheDir, { recursive: true })
await fs.writeFile(cacheProvenanceFile, JSON.stringify(sourceProvenance))
const cache = async (job) =>
  fs.writeFile(path.join(cacheDir, job.id + ".json"), JSON.stringify(job))
const restore = async (id) => {
  if (process.env.ERP_HTML_RESUME !== "1") return null
  try {
    return JSON.parse(
      await fs.readFile(path.join(cacheDir, id + ".json"), "utf8")
    )
  } catch {
    return null
  }
}
const previousPages = JSON.parse(await fs.readFile(path.join(out,"manifest.json"),"utf8")).pages
const previousActionIds = new Map(previousPages.filter(p=>p.id.includes("-action-")).map(p=>[p.title,p.id]))
const pages = [],
  routes = {},
  menu = {
    "처음 시작하기": "onboarding",
    "오늘 할 일": "home",
    "문서 올리기": "document-upload",
    "문서 만들기": "document-create",
    "AI에게 묻기": "ai",
    거래: "deals",
    선적: "shipments",
    정산: "settlement",
    "운영 감시": "monitoring",
    "결산 리포트": "reports",
    "영업 성과": "sales",
    설정: "settings",
    "고객 지원": "support",
  }
const base = [
  ["onboarding", "처음 시작하기", "onboarding"],
  ["home", "오늘 할 일", "home"],
  ["document-upload", "문서 올리기", "documents/upload"],
  ["document-create", "문서 만들기", "documents/create"],
  ["ai", "AI에게 묻기", "ai"],
  ["deals", "거래", "deals"],
  ["shipments", "선적", "shipments"],
  ["settlement", "정산", "settlement"],
  ["monitoring", "운영 감시", "monitoring"],
  ["reports", "결산 리포트", "reports"],
  ["sales", "영업 성과", "sales"],
  ["notifications", "알림", "notifications"],
  ["counterparties", "거래처", "counterparties"],
  ["evidence", "증빙", "evidence"],
  ["settings", "설정", "settings"],
  ["billing", "요금제", "settings/billing"],
  ["tokens", "토큰", "settings/tokens"],
]
for (const [id, title, route] of base) {
  routes["/erp/" + route] = id
  pages.push({ id, title, route: "/erp/" + route, group: title, scan: true })
}
const add = (id, title, route, setup, extra = {}) => {
  pages.push({
    id,
    title,
    route,
    setup,
    group: extra.group || title.split(" · ")[0],
    ...extra,
  })
}
const docroute = (name, step = "review") =>
  "/erp/documents/upload/" + encodeURIComponent(name) + "/" + step
for (const [id, name, title] of [
  ["document-review", "인보이스_2607_003.pdf", "문서 검토"],
  ["document-processing", "B/L_2607_014.pdf", "AI 분석 중"],
  ["document-pending", "포장명세서_0707.pdf", "처리 대기"],
  ["document-failed", "ArrivalNotice_014W.pdf", "처리 실패"],
]) {
  const route = docroute(name)
  routes[route] = id
  add(id, "문서 올리기 · " + title, route, null, {
    group: "문서 올리기",
    scan: true,
  })
}
routes[docroute("은행거래내역서_2026-08-27.pdf", "connect")] =
  "document-connect"
add(
  "document-connect",
  "문서 올리기 · 거래 연결",
  docroute("은행거래내역서_2026-08-27.pdf", "connect"),
  null,
  { group: "문서 올리기", scan: true }
)
add(
  "document-retry",
  "문서 올리기 · 재시도 중",
  docroute("ArrivalNotice_014W.pdf"),
  async (p) => {
    await p.getByRole("button", { name: "다시 추출", exact: true }).click()
    await p.getByText("AI가 문서를 읽고 있습니다", { exact: true }).waitFor()
  },
  { group: "문서 올리기", quick: true }
)
add(
  "document-retried",
  "문서 올리기 · 재추출 완료",
  docroute("ArrivalNotice_014W.pdf"),
  async (p) => {
    await p.getByRole("button", { name: "다시 추출", exact: true }).click()
    await p
      .getByText("AI가 문서를 읽고 있습니다", { exact: true })
      .waitFor({ state: "hidden" })
  },
  { group: "문서 올리기" }
)
for (const state of ["first-use", "error"])
  add(
    "home-" + state,
    "오늘 할 일 · " +
      { empty: "업무 없음", "first-use": "최초 이용", error: "조회 실패" }[
        state
      ],
    "/erp/home?state=" + state,
    null,
    { group: "오늘 할 일" }
  )
for (const [id, label, title] of [
  ["answer", "이번 주 받을 돈 정산 3건과 거래 근거", "답변과 근거"],
  ["empty", "거래 검색 결과 없음 일치하는 거래를 찾지 못함", "조회 결과 없음"],
  ["loading", "AI 분석 중 업무 데이터를 조회하는 중", "분석 중"],
])
  add(
    "ai-" + id,
    "AI에게 묻기 · " + title,
    "/erp/ai",
    async (p) => p.getByRole("button", { name: new RegExp(label) }).click(),
    { group: "AI에게 묻기", scan: id === "answer" }
  )
const templates = [
  ["QT", "견적서"],
  ["PI", "견적송장"],
  ["SC", "판매계약서"],
  ["PO", "발주서"],
  ["CI", "상업송장"],
  ["PL", "포장명세서"],
  ["SI", "선적지시서"],
  ["BC", "수익자증명서"],
  ["DLV", "납품서"],
  ["CO", "원산지증명서"],
  ["SOA", "거래명세서"],
  ["DN", "차변표"],
  ["CN", "대변표"],
]
const template = async (p, code = "QT", name = "견적서") => {
  await p.getByRole("button", { name: new RegExp("^" + code + "\\s*" + name) }).click()
  await p.getByRole("region", {name:"문서 폼 선택",exact:true}).getByRole("button",{name:"문서 만들기",exact:true}).click()
  await p.waitForTimeout(650)
  await p.locator("[data-page-loading]").waitFor({state:"hidden"})
}
for (const [code, name] of templates)
  add(
    "document-create-" + code.toLowerCase(),
    "문서 만들기 · " + name,
    "/erp/documents/create",
    (p) => template(p, code, name),
    { group: "문서 만들기", scan: code === "QT" }
  )
const fillItems = async (p, code = "QT", name = "견적서") => {
  await template(p, code, name)
  await p
    .getByRole("textbox", { name: "품목 1 품목명", exact: true })
    .fill("Aluminium Scrap Taint Tabor")
  await p
    .getByRole("spinbutton", { name: "품목 1 수량", exact: true })
    .fill("20")
  await p
    .getByRole("spinbutton", { name: "품목 1 단가", exact: true })
    .fill("1200")
  await p.getByRole("button", { name: "품목 추가", exact: true }).click()
  await p
    .getByRole("textbox", { name: "품목 2 품목명", exact: true })
    .fill("Copper Scrap")
  await p
    .getByRole("spinbutton", { name: "품목 2 수량", exact: true })
    .fill("2")
  await p
    .getByRole("spinbutton", { name: "품목 2 단가", exact: true })
    .fill("100")
}
add(
  "document-items-added",
  "문서 만들기 · 품목 추가",
  "/erp/documents/create",
  fillItems,
  { group: "문서 만들기" }
)
add(
  "document-item-deleted",
  "문서 만들기 · 개별 품목 삭제",
  "/erp/documents/create",
  async (p) => {
    await fillItems(p)
    await p.getByRole("button", { name: "품목 1 삭제", exact: true }).click()
  },
  { group: "문서 만들기" }
)
add(
  "document-items-empty",
  "문서 만들기 · 전체 품목 삭제",
  "/erp/documents/create",
  async (p) => {
    await template(p)
    await p.getByRole("button", { name: "전체 삭제", exact: true }).click()
  },
  { group: "문서 만들기" }
)
for (const id of [
  "DL-260701-09",
  "DL-260704-02",
  "DL-260625-07",
  "DL-260801-01",
  "DL-260802-02",
  "DL-260803-03",
  "DL-260708-01",
  "DL-260707-04",
  "DL-260629-03",
]) {
  const route = "/erp/deals/" + id
  routes[route] = "deal-" + id.toLowerCase()
  add(routes[route], "거래 · " + id, route, null, {
    group: "거래",
    scan: id === "DL-260701-09",
  })
}
const reviewShipment = async (p) =>
  p.getByRole("button", { name: "운영 날짜 검토", exact: true }).first().click()
add(
  "shipment-review",
  "선적 · 운영 날짜 검토",
  "/erp/shipments",
  reviewShipment,
  { group: "선적" }
)
add(
  "shipment-invalid",
  "선적 · 날짜 불일치",
  "/erp/shipments",
  async (p) => {
    await reviewShipment(p)
    await p.getByLabel("확인 ETD", { exact: true }).fill("2026-08-20")
    await p.getByLabel("확인 ETA", { exact: true }).fill("2026-08-19")
    await p
      .getByLabel("처리 사유 및 확인 근거", { exact: true })
      .fill("선사 회신 일정 확인")
    await p
      .getByRole("button", { name: "확인한 날짜 반영", exact: true })
      .click()
  },
  { group: "선적" }
)
add(
  "shipment-completed",
  "선적 · 날짜 반영 완료",
  "/erp/shipments",
  async (p) => {
    await reviewShipment(p)
    await p.getByLabel("확인 ETD", { exact: true }).fill("2026-08-20")
    await p.getByLabel("확인 ETA", { exact: true }).fill("2026-08-23")
    await p
      .getByLabel("처리 사유 및 확인 근거", { exact: true })
      .fill("선사 회신 일정 확인")
    await p
      .getByRole("button", { name: "확인한 날짜 반영", exact: true })
      .click()
  },
  { group: "선적" }
)
add(
  "reports-close-check",
  "결산 리포트 · 마감 전 점검",
  "/erp/reports",
  (p) =>
    p.getByRole("button", { name: "2026-07 마감하기", exact: true }).click(),
  { group: "결산 리포트", scan: true }
)
add(
  "sales-sgd",
  "영업 성과 · SGD 조회",
  "/erp/sales",
  (p) =>
    p
      .getByRole("group", { name: "통화", exact: true })
      .getByRole("button", { name: "SGD", exact: true })
      .click(),
  { group: "영업 성과" }
)
function explicitLink(c, job) {
  if (c.disabled) return null
  if (job.controlLinks?.[c.key]) return job.controlLinks[c.key]
  const t = c.label || c.text
  for (const rule of job.flowRules || []) {
    if (rule.label && rule.label !== t) continue
    if (rule.includes && !t.includes(rule.includes)) continue
    if (rule.role && rule.role !== c.role) continue
    if (rule.occurrence && !c.key.endsWith("|" + rule.occurrence)) continue
    return rule.target
  }
  if (job.flowLinks?.[t]) return job.flowLinks[t]
  return null
}
function known(c, job) {
  if (c.disabled) return null
  const explicit = explicitLink(c, job)
  if (explicit) return explicit
  const t = c.label || c.text
  const txt = c.text
  const row = c.row || ""
  if (menu[t]) return menu[t]
  if (job.id.startsWith("settings") && t === "알림")
    return "settings-notifications"
  if (/^알림,/.test(t)) return "notifications"
  if (t === "앱으로 돌아가기") return "home"
  if (t === "내 계정") return "settings"
  if (t === "워크스페이스 전환") return "workspace-menu"
  if (t === "프로필 메뉴") return "profile-menu"
  if (t === "조직 관리") return "settings"
  if (t === "ECOYA 제품 전환") return "product-menu"
  if (/거래 보기|거래 목록/.test(t)) return "deals"
  if (/파일 올리기|파일 선택|파일 추가/.test(t)) return "document-upload"
  if (/다시 추출/.test(t)) return "document-retry"
  if (t === "거래 연결")
    return job.route.includes(encodeURIComponent("인보이스_2607_003.pdf"))
      ? "document-invoice-connect"
      : "document-connect"
  if (t === "PDF 보기") return "document-review-pdf"
  if (t === "필드 검토" && job.id.startsWith("document-review"))
    return "document-review"
  if (t === "다음 페이지" && job.id === "document-review")
    return "document-review-page-2"
  if (t === "이전 페이지" && job.id === "document-review-page-2")
    return "document-review"
  const code =
    job.id.match(
      /^document-create-(qt|pi|sc|po|ci|pl|dlv|co|dn|cn|si|bc|soa)(?:-|$)/
    )?.[1] || "qt"
  if (
    ["dn", "cn", "si", "bc", "soa"].includes(code) &&
    /^(품목 추가|품목 \d+ 삭제|전체 삭제)$/.test(t)
  )
    return null
  const itemPrefix = code === "qt" ? "document" : "document-create-" + code
  if (t === "품목 추가") return itemPrefix + "-items-added"
  if (/^품목 \d+ 삭제$/.test(t)) return itemPrefix + "-item-deleted"
  if (t === "전체 삭제" && job.group === "문서 만들기")
    return itemPrefix + "-items-empty"
  if (/운영 날짜 검토/.test(t))
    return row.includes("BL_CMDU26062541.pdf")
      ? "shipment-review-nordic"
      : "shipment-review"
  if (t === "확인한 날짜 반영") {
    const suffix = job.id.includes("nordic") ? "-nordic" : ""
    return job.id.includes("invalid")
      ? "shipment-completed" + suffix
      : "shipment-invalid" + suffix
  }
  if (/2026-07 마감하기/.test(t)) return "reports-close-check"
  if (/이번 주 받을 돈/.test(t)) return "ai-answer"
  if (/거래 검색 결과 없음/.test(t)) return "ai-empty"
  if (/AI 분석 중 업무 데이터/.test(t)) return "ai-loading"
  for (const [code, name] of templates)
    if (new RegExp("^" + code + "\\s*" + name).test(txt))
      return "document-create-" + code.toLowerCase()
  for (const [name, id] of [
    ["은행거래내역서", "document-connect"],
    ["인보이스_2607_003", "document-review"],
    ["B/L_2607_014", "document-processing"],
    ["B_L_2607_014", "document-processing"],
    ["ArrivalNotice_014W", "document-failed"],
    ["포장명세서_0707", "document-pending"],
  ])
    if ((txt + " " + row).includes(name) && !t.endsWith("메뉴")) return id
  const deal = (txt + " " + row).match(/DL-\d{6}-\d{2}/)
  if (deal && routes["/erp/deals/" + deal[0]] && !/메뉴/.test(t))
    return routes["/erp/deals/" + deal[0]]
  if (/닫기|취소|뒤로|목록으로|^Close$/.test(t))
    return job.parent || menu[job.group] || null
  return null
}
async function open(job) {
  await page.setViewportSize(job.viewport || { width: 1440, height: 1000 })
  await page.goto(origin + job.route)
  await page.locator("main").first().waitFor()
  await page.locator('[data-page-loading]').waitFor({ state: "hidden" })
  await page.locator('main[aria-busy="true"]').waitFor({ state: "hidden" })
  await page.evaluate(() => document.fonts.ready)
  if (job.setup) await job.setup(page)
  if (!job.quick) { await page.waitForTimeout(650); await page.locator("[data-page-loading]").waitFor({state:"hidden"}) }
}
async function controls() {
  return page.evaluate(() => {
    const norm = (s) => (s || "").replace(/\s+/g, " ").trim()
    const counts = {}
    return [
      ...document.querySelectorAll(
        'button,[role="tab"],tr[data-clickable="true"],[role="menuitem"],[role="option"],[role="menuitemradio"],[role="menuitemcheckbox"],label:has(input[type="radio"])'
      ),
    ].map((el) => {
      const text = norm(el.textContent),
        label = el.getAttribute("aria-label") || "",
        row = norm(el.closest("tr")?.textContent)
      const key0 = [el.tagName, label || text, row].join("|")
      const key = key0 + "|" + (counts[key0] = (counts[key0] || 0) + 1)
      el.setAttribute("data-export-key", key)
      return {
        key,
        text,
        label,
        row,
        disabled: el.disabled || el.getAttribute("aria-disabled") === "true",
        visible:
          el.checkVisibility() && !el.closest('[inert],[aria-hidden="true"]'),
        tag: el.tagName,
        role: el.getAttribute("role"),
        sidebar: !!el.closest('[data-sidebar="sidebar"]'),
      }
    })
  })
}
const assets = new Map()
const existingAssetContent = new Map()
const assetAliases = new Map()
const existingAssets = await Promise.all(
  (await fs.readdir(path.join(out, "assets")))
    .filter((name) => /\.(png|jpg|jpeg|svg|webp|otf|woff2?)$/.test(name))
    .map(async (name) => ({
      name,
      stat: await fs.stat(path.join(out, "assets", name)),
    }))
)
for (const { name } of existingAssets.sort(
  (a, b) => a.stat.mtimeMs - b.stat.mtimeMs
)) {
  const hash = crypto
    .createHash("sha256")
    .update(await fs.readFile(path.join(out, "assets", name)))
    .digest("hex")
  if (!existingAssetContent.has(hash))
    existingAssetContent.set(hash, "assets/" + name)
  else
    assetAliases.set(
      "../assets/" + name,
      "../.." + existingAssetContent.get(hash)
    )
}
async function asset(url) {
  if (!url || url.startsWith("data:") || url.startsWith("#")) return url
  const abs = new URL(url, origin).href
  if (assets.has(abs)) return assets.get(abs)
  const pathname = new URL(abs).pathname
  let ext = path.extname(pathname)
  if (!/^\.[a-z0-9]{1,6}$/i.test(ext)) ext = ".bin"
  const dest =
    "assets/" +
    crypto.createHash("sha256").update(abs).digest("hex").slice(0, 16) +
    ext
  const res = await fetch(abs)
  if (!res.ok) throw new Error("Asset " + res.status + " " + abs)
  const content = Buffer.from(await res.arrayBuffer())
  const hash = crypto.createHash("sha256").update(content).digest("hex")
  if (existingAssetContent.has(hash)) {
    assets.set(abs, existingAssetContent.get(hash))
    return existingAssetContent.get(hash)
  }
  await fs.writeFile(path.join(out, dest), content)
  existingAssetContent.set(hash, dest)
  assets.set(abs, dest)
  return dest
}
async function save(job) {
  job.resultRoute = new URL(page.url()).pathname + new URL(page.url()).search
  const ctrls = await controls()
  job.controls = ctrls
  job.links ||= {}
  const data = await page.evaluate(() => {
    for (const el of document.querySelectorAll("input")) {
      el.setAttribute("value", el.value)
      if (el.checked) el.setAttribute("checked", "")
      else el.removeAttribute("checked")
    }
    for (const el of document.querySelectorAll("textarea"))
      el.textContent = el.value
    for (const el of document.querySelectorAll("option"))
      el.toggleAttribute("selected", el.selected)
    for (const el of document.querySelectorAll("canvas")) {
      const img = document.createElement("img")
      img.src = el.toDataURL()
      img.style.cssText = el.style.cssText
      img.width = el.width
      img.height = el.height
      img.alt = el.getAttribute("aria-label") || "화면에 표시된 그래픽"
      el.replaceWith(img)
    }
    return {
      body: document.body.outerHTML,
      css: [...document.styleSheets]
        .map((s) => {
          try {
            return [...s.cssRules].map((r) => r.cssText).join("\n")
          } catch {
            return ""
          }
        })
        .join("\n"),
      htmlClass: document.documentElement.className,
    }
  })
  const urls = [...data.css.matchAll(/url\(["']?([^\)"']+)["']?\)/g)].map(
    (m) => m[1]
  )
  for (const url of new Set(urls)) {
    if (url.startsWith("data:") || url.startsWith("#")) continue
    data.css = data.css.split(url).join("../.." + (await asset(url)))
  }
  job.raw = data
  await cache(job)
  console.log("Captured", job.id, ctrls.length)
}
routes[docroute("인보이스_2607_003.pdf", "connect")] =
  "document-invoice-connect"
add(
  "document-invoice-connect",
  "문서 올리기 · 인보이스 거래 연결",
  docroute("인보이스_2607_003.pdf", "connect"),
  null,
  { group: "문서 올리기" }
)
add(
  "document-review-pdf",
  "문서 올리기 · 모바일 PDF 보기",
  docroute("인보이스_2607_003.pdf"),
  (p) => p.getByRole("button", { name: "PDF 보기", exact: true }).click(),
  { group: "문서 올리기", viewport: { width: 390, height: 844 } }
)
add(
  "document-review-page-2",
  "문서 올리기 · PDF 2페이지",
  docroute("인보이스_2607_003.pdf"),
  (p) => p.getByRole("button", { name: "다음 페이지", exact: true }).click(),
  { group: "문서 올리기" }
)
for (const [code, name] of templates.filter(
  ([code]) => !["QT", "SI", "BC", "SOA", "DN", "CN"].includes(code)
)) {
  const prefix = "document-create-" + code.toLowerCase()
  add(
    prefix + "-items-added",
    "문서 만들기 · " + name + " 품목 추가",
    "/erp/documents/create",
    (p) => fillItems(p, code, name),
    { group: "문서 만들기" }
  )
  add(
    prefix + "-item-deleted",
    "문서 만들기 · " + name + " 품목 개별 삭제",
    "/erp/documents/create",
    async (p) => {
      await fillItems(p, code, name)
      await p.getByRole("button", { name: "품목 1 삭제", exact: true }).click()
    },
    { group: "문서 만들기" }
  )
  add(
    prefix + "-items-empty",
    "문서 만들기 · " + name + " 품목 전체 삭제",
    "/erp/documents/create",
    async (p) => {
      await template(p, code, name)
      await p.getByRole("button", { name: "전체 삭제", exact: true }).click()
    },
    { group: "문서 만들기" }
  )
}
const nordicReview = (p) =>
  p.getByRole("button", { name: "운영 날짜 검토", exact: true }).nth(1).click()
add(
  "shipment-review-nordic",
  "선적 · Nordic 운영 날짜 검토",
  "/erp/shipments",
  nordicReview,
  { group: "선적" }
)
for (const [state, eta, title] of [
  ["invalid", "2026-08-19", "날짜 불일치"],
  ["completed", "2026-08-23", "날짜 반영 완료"],
])
  add(
    "shipment-" + state + "-nordic",
    "선적 · Nordic " + title,
    "/erp/shipments",
    async (p) => {
      await nordicReview(p)
      await p.getByLabel("확인 ETD", { exact: true }).fill("2026-08-20")
      await p.getByLabel("확인 ETA", { exact: true }).fill(eta)
      await p
        .getByLabel("처리 사유 및 확인 근거", { exact: true })
        .fill("선사 회신 일정 확인")
      await p
        .getByRole("button", { name: "확인한 날짜 반영", exact: true })
        .click()
    },
    { group: "선적" }
  )
add(
  "settings-notifications",
  "설정 · 알림 설정",
  "/erp/settings",
  (p) => p.getByRole("button", { name: "ERP 알림", exact: true }).click(),
  { group: "설정" }
)
for (const [id, title, role, label] of [
  ["workspace-menu", "조직 전환", "button", "워크스페이스 전환"],
  ["product-menu", "제품 전환", "combobox", "ECOYA 제품 전환"],
  ["profile-menu", "프로필 메뉴", "button", "프로필 메뉴"],
])
  add(
    id,
    title,
    "/erp/home",
    (p) => p.getByRole(role, { name: label, exact: true }).first().click(),
    { group: "공통 메뉴", parent: "home" }
  )
pages.push(...documentFlowPages())
for (const [id, title, route] of [
  [
    "document-existing-sc",
    "기존 판매계약서 · 이어쓰기",
    "/erp/documents/create/SC-2026-0708",
  ],
  [
    "document-existing-soa",
    "거래 명세서 · 전달 준비",
    "/erp/documents/create/SOA-2026-0629",
  ],
])
  add(id, title, route, null, { group: "문서 만들기" })
extendInteractionFlows(pages)
add("landing", "서비스 소개 · Trade OS", "/", null, {group:"서비스 소개"})
for (const [id,title,route] of [
  ["share-recipient","고객 전달 · 수신 화면","/share/preview"],
  ["deal-dl-260918-91","거래 · 완료","/erp/deals/DL-260918-91"],
  ["deal-dl-260918-92","거래 · 취소","/erp/deals/DL-260918-92"],
  ["deal-dl-260918-93","거래 · 유형 확인 필요","/erp/deals/DL-260918-93"],
  ["document-approval-pending","문서 만들기 · 승인 대기","/erp/documents/create/SC-2026-0918"],
  ["document-approval-approved","문서 만들기 · 승인 완료","/erp/documents/create/CI-2026-0918"],
  ["document-approval-rejected","문서 만들기 · 반려","/erp/documents/create/PO-2026-0918"],
]) add(id,title,route,null,{group:title.split(" · ")[0]})
for(const [state,title] of [["expired","링크 만료"],["open_cap","열람 한도"],["not_found","유효하지 않은 링크"],["error","조회 오류"]]) add("share-recipient-"+state.replaceAll("_","-"),"고객 전달 · "+title,"/share/preview",p=>p.getByRole("combobox",{name:"공유 화면 상태"}).selectOption(state),{group:"고객 전달"})
for(const [id,name,title] of [["document-duplicate","인보이스_중복확인_0918.pdf","중복 확인"],["document-excluded","회사소개서_처리제외_0918.pdf","처리 제외"],["document-unknown","스캔문서_유형확인_0918.pdf","유형 확인"]]) add(id,"문서 올리기 · "+title,docroute(name),null,{group:"문서 올리기"})
for(const [id,title,section] of [["settings-action-06","조직 관리","organization"],["settings-action-09","ERP 결제·구독","billing"],["settings-action-15","ERP AI 사용량","trade-usage"],["settings-action-19","데이터 관리","snap-data"]]) add(id,"설정 · "+title,"/erp/settings?section="+section,null,{group:"설정"})
// The shipment date-review queue was removed from the live UI. Its historic
// links are retired explicitly by the handoff sync, never captured as live states.
const retiredIds = new Set(["shipment-review","shipment-invalid","shipment-completed","shipment-review-nordic","shipment-invalid-nordic","shipment-completed-nordic"])
for(let i=pages.length-1;i>=0;i--) if(retiredIds.has(pages[i].id)) pages.splice(i,1)
const failures = []
try {
  const initial = process.env.ERP_HTML_ONLY ? pages.filter(p=>process.env.ERP_HTML_ONLY.split(",").includes(p.id)) : [...pages]
  await mapJobs(initial,async (job) => {
    try {
      const saved = await restore(job.id)
      if (saved?.raw) {
        Object.assign(job, {
          raw: saved.raw,
          controls: saved.controls,
          links: saved.links,
          scanned: saved.scanned,
          children: saved.children,
          resultRoute: saved.resultRoute || job.resultRoute,
        })
        if (job.captureVersion && saved.captureVersion !== job.captureVersion) {
          await open(job)
          await save(job)
        }
        console.log("Resumed", job.id)
      } else {
        await open(job)
        await save(job)
      }
    } catch (e) {
      failures.push({ id: job.id, error: e.message })
      console.error("FAILED", job.id, e.message)
    }
  })
  // Capture enabled controls on primary screens. These are real opened menus,
  // tabs, filters and dialogs, rather than speculative descriptions of actions.
  await mapJobs(initial.filter((x) => x.scan && x.raw),async (job) => {
    if (job.scanned) {
      for (const id of job.children || []) {
        const saved = await restore(id)
        if (saved) pages.push(saved)
      }
      return
    }
    job.children = []
    let number = Math.max(0,...previousPages.filter(p=>p.id.startsWith(job.id+"-action-")).map(p=>Number(p.id.split("-action-").at(-1))||0))
    for (const c of job.controls) {
      if (
        c.disabled ||
        !c.visible ||
        known(c, job) ||
        c.tag === "TR" ||
        c.role === "checkbox" ||
        c.role === "switch"
      )
        continue
      const t = c.label || c.text
      if (
        !t ||
        /Toggle Sidebar|사이드바 접기|서비스 메뉴 열기|메뉴 닫기|Previous slide|Next slide|축소|확대|전체 화면|이전 페이지|다음 페이지|^\d+페이지$/.test(
          t
        )
      )
        continue
      const child = {
        id: previousActionIds.get(job.title + " · " + t.slice(0,70)) || job.id + "-action-" + String(++number).padStart(2, "0"),
        title: job.title + " · " + t.slice(0, 70),
        route: job.route,
        group: job.group,
        parent: job.id,
        setup: async (p) => {
          if (job.setup) await job.setup(p)
          await controls()
          const locator = p.locator("[data-export-key]").filter({})
          await locator.evaluateAll((els, key) => {
            const el = els.find(
              (x) => x.getAttribute("data-export-key") === key
            )
            el?.setAttribute("data-export-click", "true")
          }, c.key)
          await p.locator('[data-export-click="true"]').click({ timeout: 2500 })
        },
      }
      try {
        await open(child)
        const dest = routes[new URL(page.url()).pathname]
        if (
          dest &&
          new URL(page.url()).pathname !== new URL(origin + job.route).pathname
        ) {
          job.links[c.key] = dest
          continue
        }
        await save(child) // Skip unchanged controls (e.g. OS file chooser, no-op).
        const plain = (s) =>
          s
            .replace(/data-export-[^=]+="[^"]*"/g, "")
            .replace(/\d{2}:\d{2}/g, "TIME")
            .replace(/id="[^"]*"/g, "")
            .replace(/aria-[\w-]+="[^"]*"/g, "")
        if (plain(child.raw.body) === plain(job.raw.body)) {
          continue
        }
        pages.push(child)
        job.children.push(child.id)
        job.links[c.key] = child.id
      } catch (e) {
        console.error("Action skipped", job.id, t, e.message.split("\n")[0])
      }
    }
    job.scanned = true
    await cache(job)
  })
} catch (error) {
  await browser.close()
  throw error
}
if(process.env.ERP_HTML_CAPTURE_ONLY === "1") {await browser.close();console.log("Capture-only",{failures});process.exit(failures.length?1:0)}
if (failures.length) {
  await fs.writeFile(
    path.join(out, "export-errors.json"),
    JSON.stringify(failures, null, 2)
  )
  throw new Error("Required screen capture failed; see export-errors.json")
}
// Serialize/clean with a separate JS-enabled build-time page. No scripts are
// emitted; the final verification runs in a JavaScript-disabled browser.
await fs.rm(path.join(out, "export-errors.json"), { force: true })
const cleaner = browser
const cp = await cleaner.newPage()
const all = pages.filter((x) => x.raw)
const observedRoutes = JSON.parse(
  await fs.readFile(
    new URL("./erp-observed-route-links.json", import.meta.url),
    "utf8"
  )
)
for (const { source, key, target } of observedRoutes) {
  const job = all.find((page) => page.id === source)
  if (!job || !all.some((page) => page.id === target) || !job.controls.some(control=>control.key===key)) continue
  job.controlLinks = { ...job.controlLinks, [key]: target }
}
const index = all.map(
  ({
    id,
    title,
    group,
    parent,
    route,
    resultRoute,
    workflow,
    sourceId,
    action,
    actor,
    fixture,
    gaps,
  }) => ({
    id,
    title,
    group,
    parent,
    route: resultRoute || route,
    workflow,
    sourceId,
    action,
    actor,
    fixture,
    gaps,
  })
)
const unmapped = []
for (const job of all) {
  for (const [alias, canonical] of assetAliases)
    job.raw.css = job.raw.css.replaceAll(alias, canonical)
  const cssName =
    "assets/style-" +
    crypto.createHash("sha256").update(job.raw.css).digest("hex").slice(0, 12) +
    ".css"
  await fs.writeFile(path.join(out, cssName), job.raw.css)
  const links = {}
  for (const c of job.controls) {
    let dest = explicitLink(c, job) || job.links[c.key] || known(c, job)
    if (!dest && job.parent && !job.workflow) {
      const parent = all.find((p) => p.id === job.parent)
      dest = parent?.links[c.key] || known(c, parent || job)
    }
    if (
      !dest &&
      c.sidebar &&
      !c.disabled &&
      !/Toggle Sidebar|사이드바 접기|메뉴 닫기/.test(c.label || c.text)
    )
      dest = job.id.startsWith("settings")
        ? "settings"
        : menu[job.group] || "index"
    if (dest) links[c.key] = dest + ".html"
  }
  const related = index.filter((x) => x.group === job.group)
  await cp.setContent(
    job.raw.body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ""),
    { waitUntil: "domcontentloaded" }
  )
  const result = await cp.evaluate(
    ({ links, index, related, job, menu, routes }) => {
      document
        .querySelectorAll(
          'script,link[rel="modulepreload"],style,vite-error-overlay'
        )
        .forEach((e) => e.remove())
      document.body.style.removeProperty("pointer-events")
      document.body.style.removeProperty("overflow")
      if (job.workflow) {
        document.body.dataset.handoffFlow = "true"
        document
          .querySelectorAll("[data-sonner-toaster]")
          .forEach((element) => element.remove())
      }
      for (const el of document.querySelectorAll("*")) {
        for (const a of [...el.attributes])
          if (
            /^on/i.test(a.name) ||
            /^(inert|data-export-click|data-reactroot|data-reactid)$/.test(
              a.name
            )
          )
            el.removeAttribute(a.name)
        if (el.style.pointerEvents === "none")
          el.style.removeProperty("pointer-events")
        if (
          el.getAttribute("aria-hidden") === "true" &&
          (el.id === "root" || el.contains(document.querySelector("main")))
        )
          el.removeAttribute("aria-hidden")
      }
      const missing = []
      // Exit animations can leave a closed portal in the DOM at capture time.
      const closedPortals = document.querySelectorAll(
        '[data-state="closed"][role="dialog"], [data-state="closed"][role="alertdialog"], [data-state="closed"][data-slot="sheet-overlay"], [data-state="closed"][data-slot="dialog-overlay"]'
      )
      if (closedPortals.length) {
        closedPortals.forEach((element) => element.remove())
        if (
          !document.querySelector(
            '[data-state="open"][role="dialog"], [data-state="open"][role="alertdialog"]'
          )
        ) {
          document
            .querySelectorAll('[aria-hidden="true"][data-aria-hidden="true"]')
            .forEach((element) => element.removeAttribute("aria-hidden"))
        }
      }
      for (const el of document.querySelectorAll("[data-export-key]")) {
        const key = el.getAttribute("data-export-key"),
          dest = links[key]
        el.removeAttribute("data-export-key")
        if (dest && el.tagName === "TR") {
          const cell = el.querySelector("td")
          if (cell) {
            const a = document.createElement("a")
            a.href = dest
            a.className = "static-row-link"
            while (cell.firstChild) a.append(cell.firstChild)
            cell.append(a)
          }
          el.removeAttribute("tabindex")
          continue
        }
        if (dest) {
          if (el.disabled || el.getAttribute("aria-disabled") === "true")
            continue
          const a = document.createElement("a")
          for (const attr of [...el.attributes])
            if (
              ![
                "type",
                "disabled",
                "role",
                "tabindex",
                "aria-haspopup",
                "aria-controls",
                "aria-expanded",
              ].includes(attr.name)
            )
              a.setAttribute(attr.name, attr.value)
          a.href = dest
          a.innerHTML = el.innerHTML
          // Native radio labels become navigable saved selections, not mutable inputs.
          for (const input of a.querySelectorAll('input[type="radio"]')) {
            const mark = document.createElement("span")
            mark.textContent = input.checked ? "●" : "○"
            mark.setAttribute("aria-hidden", "true")
            input.replaceWith(mark)
          }
          a.classList.add("static-action")
          el.replaceWith(a)
        } else if (el.tagName === "BUTTON") {
          const label = el.getAttribute("aria-label") || el.textContent.trim()
          if (el.disabled || el.getAttribute("aria-disabled") === "true")
            continue
          if (
            /서비스 메뉴 열기|메뉴 닫기|Toggle Sidebar|사이드바 접기/.test(
              label
            )
          ) {
            const a = document.createElement("a")
            a.className = el.className
            a.href = "index.html"
            a.innerHTML = el.innerHTML
            a.setAttribute("aria-label", "전체 HTML 메뉴")
            el.replaceWith(a)
            continue
          }
          el.type = "button"
          el.setAttribute("aria-disabled", "true")
          el.tabIndex = -1
          el.title =
            "정적 화면: 이 조작의 결과 화면은 아직 포함되지 않았습니다."
          el.setAttribute("data-static-unavailable", "true")
          missing.push(label)
        }
      }
      for (const a of document.querySelectorAll("a[href]")) {
        const href = a.getAttribute("href")
        if (href.startsWith("/erp")) {
          a.href = (routes[href] || "index") + ".html"
        } else if (href.startsWith("/") && !href.startsWith("//")) {
          const publicRoutes = {"/":"landing", "/login":"auth-login", "/signup":"auth-signup", "/free-trial":"auth-free-trial", "/legal/terms":"auth-terms", "/legal/privacy":"auth-privacy"}
          a.href = href === "/login?returnTo=usage" ? "auth-login-usage.html" : publicRoutes[href.split("?")[0]] ? publicRoutes[href.split("?")[0]] + ".html" : "https://devdev-e6t.pages.dev" + href
        } else if (/^(javascript:|blob:)/i.test(href)) {
          a.removeAttribute("href")
        }
      }
      for (const form of document.querySelectorAll("form")) {
        form.removeAttribute("action")
        form.removeAttribute("method")
      }
      for (const el of document.querySelectorAll("input,textarea")) {
        if (el.type === "file") el.remove()
        else if (!["checkbox", "radio"].includes(el.type)) {
          el.readOnly = true
          el.title = "이 상태 화면에 저장된 예시 값입니다."
        }
      }
      for (const el of document.querySelectorAll("iframe,embed,object"))
        if (
          /blob:/.test(el.getAttribute("src") || el.getAttribute("data") || "")
        )
          el.remove()
      const nav = document.createElement("details")
      nav.className = "static-handoff-nav"
      const summary = document.createElement("summary")
      summary.textContent = "화면 목록 · " + job.title
      nav.append(summary)
      const info = document.createElement("p")
      info.textContent =
        "디자인 검토용 정적 HTML입니다. 링크는 저장된 화면 상태로 이동하며 입력·저장·결제는 실행하지 않습니다."
      nav.append(info)
      const home = document.createElement("a")
      home.href = "index.html"
      home.textContent = "전체 페이지와 상태 보기"
      nav.append(home)
      for (const r of related) {
        const a = document.createElement("a")
        a.href = r.id + ".html"
        a.textContent = r.title
        if (r.id === job.id) a.setAttribute("aria-current", "page")
        nav.append(a)
      }
      document.body.append(nav)
      document.title = job.title
      return { body: document.body.outerHTML, missing }
    },
    {
      links,
      index,
      related,
      job: {
        id: job.id,
        title: job.title,
        group: job.group,
        workflow: job.workflow,
      },
      menu,
      routes,
    }
  )
  let body = result.body
  for (const match of [...body.matchAll(/(?:src|poster)="([^"]+)"/g)]) {
    const url = match[1]
    if (url.startsWith("data:")) continue
    body = body.split('="' + url + '"').join('="' + (await asset(url)) + '"')
  }
  const esc = (s) =>
    s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;")
  const html =
    '<!doctype html>\n<html lang="ko" class="' +
    esc(job.raw.htmlClass) +
    '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="script-src \'none\'; object-src \'none\'"><title>' +
    esc(job.title) +
    ' | ECOYA Trade OS</title><meta name="description" content="' +
    esc(job.title) +
    ' — 구현 화면의 정적 HTML. 사이드바와 상태별 액션은 HTML 파일로 연결됩니다."><link rel="stylesheet" href="' +
    cssName +
    '"><link rel="stylesheet" href="assets/handoff.css"></head>' +
    body +
    "</html>\n"
  await fs.writeFile(path.join(out, job.id + ".html"), html)
  unmapped.push({ id: job.id, controls: [...new Set(result.missing)] })
}
await cleaner.close()
await fs.writeFile(
  path.join(out, "assets/handoff.css"),
  `
.static-action{text-decoration:none;cursor:pointer}.static-row-link{display:block;color:inherit;text-decoration:none}.static-row-link:hover{text-decoration:underline}.static-handoff-nav{position:fixed;right:12px;bottom:12px;z-index:2147483647;max-width:min(480px,calc(100vw - 24px));max-height:70vh;overflow:auto;background:#fff;border:1px solid #d7dce2;border-radius:8px;color:#24334a;font:13px/1.5 system-ui;box-shadow:0 2px 8px #10203015;padding:10px 14px}.static-handoff-nav summary{cursor:pointer;font-weight:600}.static-handoff-nav a{display:block;color:#1654aa;padding:5px 0}.static-handoff-nav p{margin:10px 0;color:#626b79}.static-handoff-nav a[aria-current]{font-weight:700}a:focus-visible{outline:2px solid #2878ed;outline-offset:3px}[data-static-unavailable]{cursor:default!important;pointer-events:none!important}*,*::before,*::after{animation:none!important;transition:none!important}body{pointer-events:auto!important} [data-slot="dialog-overlay"]{pointer-events:none} [data-slot="dialog-content"]{pointer-events:auto!important} @media(max-width:1023px){[data-slot="sidebar-inset"]{min-width:0!important;width:100%!important}.static-handoff-nav{max-width:calc(100vw - 24px)}[data-radix-popper-content-wrapper]{left:12px!important;right:12px!important;top:72px!important;transform:none!important;max-width:calc(100vw - 24px)!important}}
`
)
await fs.appendFile(
  path.join(out, "assets/handoff.css"),
  `
[data-sonner-toaster],[data-sonner-toaster] *{pointer-events:none!important}
body[data-handoff-flow]:not([data-embedded-preview]) [data-slot="sidebar-wrapper"]{height:calc(100svh - 48px)!important}
body[data-embedded-preview] .static-handoff-nav{display:none}
/* Desktop splitter measurements become a stacked reading layout on phones. */
@media(max-width:767px){
[data-module-grid] [data-slot="resizable-panel-group"]{display:block!important;height:auto!important;overflow:visible!important}
[data-module-grid] [data-slot="resizable-panel"]{display:block!important;flex:none!important;width:100%!important;height:auto!important;max-height:none!important;margin-bottom:12px!important}
[data-module-grid] [data-panel]>div{height:auto!important;max-height:none!important;overflow:visible!important}
[data-module-grid] [data-slot="resizable-handle"]{display:none!important}
.recharts-wrapper{max-width:100%!important}.recharts-surface{max-width:100%;height:auto}
}
`
)
// Replace discontinued reference URLs with explicit migration notices. Never
// leave an old screenshot masquerading as a current state after a full export.
const authPages = JSON.parse(await fs.readFile(new URL("./erp-public-auth-captures.json",import.meta.url),"utf8"))
const currentIds = new Set([...index,...authPages].map(p=>p.id))
const retired = previousPages.filter(p=>!p.id.startsWith("designer-") && p.id!=="sidebar-full" && !currentIds.has(p.id))
const escape = s=>String(s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll('"',"&quot;")
for(const old of retired){
 const target = currentIds.has(old.parent)?old.parent:old.id.startsWith("auth-")?"auth-signup":old.id.startsWith("shipment")?"shipments":old.id.startsWith("settings")?"settings":"home"
 await fs.writeFile(path.join(out,old.id+".html"),`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(old.title)} · 변경된 화면</title><link rel="stylesheet" href="assets/index.css"></head><body><main data-retired="true" style="padding:32px;max-width:720px;font-family:system-ui;line-height:1.8"><h1 style="font-size:22px;font-weight:700">${escape(old.title)}</h1><p style="margin:20px 0">이전 화면입니다. 현재 구현에서는 이 상태를 별도 화면으로 제공하지 않습니다.</p><a href="${target}.html" style="color:#0657c8;text-decoration:underline">최신 화면 보기 →</a></main></body></html>`)
}
await fs.writeFile(path.join(out,"retired-pages.json"),JSON.stringify(retired,null,2)+"\n")
const representativeIds=new Set(JSON.parse(await fs.readFile(new URL("./erp-designer-work.json",import.meta.url),"utf8")).filter(u=>u.kind==="representative").map(u=>u.id))
index.push(...retired.filter(p=>representativeIds.has(p.id)).map(p=>({...p,retired:true,title:p.title+" · 이전 화면",group:"변경된 화면"})))
await fs.writeFile(path.join(out,"manifest.json"),JSON.stringify({generatedAt:new Date().toISOString(),source:origin,deployment:"https://devdev-e6t.pages.dev",...sourceProvenance,pages:index},null,2)+"\n")
await writeErpHtmlIndex(out, index, origin)
await fs.copyFile(
  new URL("../../docs/screens/html-interaction-links.md", import.meta.url),
  path.join(out, "reference.md")
)
// Support is not an ERP route in this prototype. Give it a proper HTML target.
await fs.writeFile(
  path.join(out, "support.html"),
  '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>고객 지원</title><link rel="stylesheet" href="assets/index.css"></head><body><main><h1>고객 지원</h1><p>현재 프로토타입에는 별도의 고객 지원 페이지가 구현되어 있지 않습니다.</p><a href="index.html">전체 화면 목록</a> · <a href="home.html">오늘 할 일</a></main></body></html>'
)
await fs.writeFile(
  path.join(out, "manifest.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      source: origin,
      deployment: "https://devdev-e6t.pages.dev",
      ...sourceProvenance,
      pages: index,
      unavailableControls: unmapped.filter((x) => x.controls.length),
    },
    null,
    2
  ) + "\n"
)
for (const dir of [out, path.join(out, "assets")]) {
  for (const name of await fs.readdir(dir)) {
    if (!/\.(html|css|json)$/.test(name)) continue
    const file = path.join(dir, name)
    const contents = await fs.readFile(file, "utf8")
    await fs.writeFile(file, contents.replace(/[ \t]+$/gm, ""))
  }
}
console.log("Exported", index.length, "screens to", out)

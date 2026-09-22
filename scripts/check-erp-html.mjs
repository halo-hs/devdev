/** Verify script-free snapshots and the viewer's no-JavaScript fallback. */
import { chromium } from "@playwright/test"
import fs from "node:fs/promises"
import path from "node:path"
const origin = process.argv[2] || "http://127.0.0.1:5175"
const root = path.resolve("public/html/erp")
const files = (await fs.readdir(root)).filter((x) => x.endsWith(".html"))
const browser = await chromium.launch({ channel: "chrome" })
const context = await browser.newContext({
  javaScriptEnabled: false,
  viewport: { width: 1440, height: 1000 },
})
const page = await context.newPage()
const failures = []
const resources = new Set()
page.on("response", (r) => {
  if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`)
  resources.add(r.url())
})
page.on("requestfailed", (r) =>
  failures.push(`${r.failure()?.errorText} ${r.url()}`)
)
let links = 0
for (const file of files) {
  const html = await fs.readFile(path.join(root, file), "utf8")
  if (
    /<script\b|\bon(?:click|load|error|submit|change|input)=|(?:src|href)="(?:javascript:|[^"\n]*\.tsx?\b|\/@vite)/i.test(
      file === "index.html" ? html.replace('<script src="assets/index.js" defer></script>', "") : html
    )
  )
    failures.push(file + ": JavaScript reference")
  for (const m of html.matchAll(/href="([^"#]+)(?:#[^"]*)?"/g)) {
    const href = m[1]
    if (/^(https?:|mailto:|tel:|data:)/.test(href)) continue
    links++
    if (href.startsWith("/erp")) failures.push(file + ": SPA route " + href)
    try {
      await fs.access(path.resolve(root, decodeURIComponent(href)))
    } catch {
      failures.push(file + ": missing " + href)
    }
  }
  const response = await page.goto(origin + "/html/erp/" + file)
  if (!response?.ok()) failures.push(file + ": HTTP " + response?.status())
  if (!["index.html", "support.html"].includes(file)) {
    if ((await page.locator("main").count()) === 0)
      failures.push(file + ": missing main")
    const sidebarNames = file.startsWith("designer-") ? [] : file.startsWith("settings")
      ? [
          "앱으로 돌아가기",
          "내 계정",
          "조직 정보",
          "사용자 관리",
          "제품 및 구독",
          "결제 및 인보이스",
          "알림",
        ]
      : file === "document-review-pdf.html"
        ? []
        : [
            "오늘 할 일",
            "문서 올리기",
            "문서 만들기",
            "AI에게 묻기",
            "거래",
            "선적",
            "정산",
            "운영 감시",
            "결산 리포트",
            "영업 성과",
          ]
    for (const name of sidebarNames) {
      const el = page
        .locator('[data-sidebar="sidebar"] a')
        .filter({ hasText: name })
        .first()
      if (!(await el.count())) failures.push(file + ": sidebar " + name)
    }
  }
}
await page.goto(origin + "/html/erp/home.html")
await page
  .getByRole("link", { name: "문서 올리기", exact: true })
  .first()
  .click()
if (!page.url().endsWith("/document-upload.html"))
  failures.push("Sidebar navigation failed")
await page.getByRole("link", { name: "오류 확인", exact: true }).click()
if (!page.url().endsWith("/document-failed.html"))
  failures.push("Failure navigation failed")
await page.getByRole("link", { name: "다시 추출", exact: true }).click()
if (!page.url().endsWith("/document-retry.html"))
  failures.push("Retry navigation failed")
await page.goto(origin + "/html/erp/document-create-qt.html")
await page.getByRole("link", { name: "품목 추가", exact: true }).click()
if (!page.url().endsWith("/document-items-added.html"))
  failures.push("Add item navigation failed")
await page.getByRole("link", { name: "품목 1 삭제", exact: true }).click()
if (!page.url().endsWith("/document-item-deleted.html"))
  failures.push("Delete item navigation failed")
// Multi-step workflows must remain navigable without running app actions.
await page.goto(origin + "/html/erp/document-flow-draft.html")
for (const [label, target] of [
  ["검토 완료", "document-flow-reviewed"],
  ["승인자 선택", "document-flow-approver-picker"],
  [/^박서윤/, "document-flow-approvers-selected"],
  ["승인 요청", "document-flow-pending"],
  ["승인", "document-flow-approved"],
  ["문서 확정", "document-flow-confirmed"],
  ["Magic Link 만들기", "document-flow-link-created"],
  ["철회", "document-flow-link-revoked"],
  ["삭제", "document-flow-link-deleted"],
  ["Magic Link 만들기", "document-flow-link-created"],
  ["전달 내역", "document-flow-history"],
]) {
  await page.getByRole("link", { name: label, exact: typeof label === "string" }).first().click()
  if (!page.url().endsWith(`/${target}.html`)) failures.push(`Document flow failed: ${label} → ${target}`)
}
await page.goto(origin + "/html/erp/document-flow-reject-form.html")
if (!(await page.getByRole("button", { name: "반려 확정", exact: true }).isDisabled())) failures.push("Empty rejection reason must block confirmation")
await page.goto(origin + "/html/erp/document-flow-reject-ready.html")
await page.getByRole("link", { name: "반려 확정", exact: true }).click()
if (!page.url().endsWith("/document-flow-rejected.html")) failures.push("Rejection result navigation failed")
for (const id of [
  "home",
  "document-upload",
  "document-review",
  "document-connect",
  "sales",
]) {
  await page.goto(origin + "/html/erp/" + id + ".html")
  await page.screenshot({ path: "/tmp/erp-static-" + id + ".png" })
}
await page.setViewportSize({ width: 390, height: 844 })
await page.goto(origin + "/html/erp/home.html")
await page.screenshot({ path: "/tmp/erp-static-mobile.png" })
await browser.close()
const result = {
  files: files.length,
  links,
  resources: resources.size,
  javaScriptEnabled: false,
  failures: [...new Set(failures)],
}
await fs.writeFile(
  "/tmp/erp-html-verification.json",
  JSON.stringify(result, null, 2)
)
console.log(JSON.stringify(result, null, 2))
if (failures.length) process.exitCode = 1

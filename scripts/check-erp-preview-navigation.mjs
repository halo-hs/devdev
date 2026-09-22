import assert from "node:assert/strict"
import { chromium } from "@playwright/test"
const origin = process.argv[2] || "http://127.0.0.1:3031"
const browser = await chromium.launch({ channel: "chrome" })
const page = await browser.newPage({ viewport: { width: 1600, height: 1050 } })
const errors = []
page.on("pageerror", (error) => errors.push(error.message))
// Slow the snapshot responses to expose clicks on stale iframe content.
await page.route("**/html/erp/*.html", async (route) => {
  await new Promise((resolve) => setTimeout(resolve, 350))
  await route.continue()
})
try {
  await page.goto(origin + "/html/erp/?page=document-invoice-connect")
  const frame = page.frameLocator('iframe[name="erp-preview"]')
  for (const name of ["파일 추가 메뉴", "이메일에서 찾기", "Invoice_HB-2607-003.pdf 선택", "선택 문서 가져오기"]) {
    await frame.getByRole("link", { name, exact: true }).click()
  }
  await frame.getByText("PackingList_0707.pdf", { exact: false }).first().waitFor()
  assert.equal(new URL(page.url()).searchParams.get("page"), "upload-invoice-mail-selected-2-imported")
  await page.goBack()
  await frame.getByRole("link", { name: "선택 문서 가져오기", exact: true }).waitFor()
  assert.equal(new URL(page.url()).searchParams.get("page"), "upload-invoice-mail-selected-2")
  assert.equal(page.context().pages().length, 1)
  assert.deepEqual(errors, [])
  await page.screenshot({ path: "/tmp/erp-preview-navigation.png" })
  console.log(JSON.stringify({ delayedTransitions: true, history: true, windows: 1, errors }))
} finally {
  await browser.close()
}

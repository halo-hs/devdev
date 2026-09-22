import assert from "node:assert/strict"
import { chromium } from "@playwright/test"
const origin = process.argv[2] || "http://127.0.0.1:4181"
const browser = await chromium.launch({ channel: "chrome" })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
await page.addInitScript(() => localStorage.clear())
const route =
  origin +
  "/erp/documents/upload/" +
  encodeURIComponent("인보이스_2607_003.pdf") +
  "/connect"
try {
  await page.goto(route)
  await page
    .getByRole("button", { name: "파일 추가 메뉴", exact: true })
    .click()
  await page.keyboard.press("Escape")
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: "Upload_regression_invoice.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n%%EOF"),
    })
  await page
    .getByText("파일 업로드 중", { exact: true })
    .waitFor({ state: "hidden" })
  assert.ok(
    (await page.locator("body").innerText()).includes(
      "Upload_regression_invoice.pdf"
    )
  )
  assert.match(
    decodeURIComponent(page.url()),
    /Upload_regression_invoice.pdf\/review$/
  )
  await page.goBack()
  await page
    .getByRole("button", { name: "새 거래 등록", exact: true })
    .waitFor()
  await page.goForward()
  await page
    .getByText("Upload_regression_invoice.pdf", { exact: false })
    .first()
    .waitFor()
  assert.ok(
    (await page.locator("body").innerText()).includes(
      "Upload_regression_invoice.pdf"
    ),
    "Back/forward must retain the uploaded document"
  )

  await page.goto(route)
  await page
    .getByRole("button", { name: "파일 추가 메뉴", exact: true })
    .click()
  await page
    .getByRole("menuitem", { name: "이메일에서 찾기", exact: true })
    .click()
  await page
    .getByRole("checkbox", { name: "PackingList_0707.pdf 선택", exact: true })
    .click()
  await page
    .getByRole("button", { name: "선택 문서 가져오기", exact: true })
    .click()
  await page
    .getByText("파일 업로드 중", { exact: true })
    .waitFor({ state: "hidden" })
  assert.ok(
    (await page.locator("body").innerText()).includes(
      "Invoice_HB-2607-003.pdf"
    ),
    "Imported attachment must remain in the queue"
  )
  console.log(
    JSON.stringify({
      fileUpload: true,
      historyRetainsQueue: true,
      mailImport: true,
      failures: [],
    })
  )
} finally {
  await browser.close()
}

import { expect, test } from "@playwright/test"

test("deadline basis stays separate from ETA and status has one badge with supporting text", async ({ page }) => {
  await page.goto("/erp/deals")
  const table = page.getByRole("table", { name: "거래 업무표" })
  const payment = table.getByRole("row").filter({ hasText: "DL-260629-03" })
  await expect(payment).toContainText("D+2")
  await expect(payment).toContainText("결제")
  await expect(payment).toContainText("ETA 2026-07-09")
  await expect(payment).toContainText("리스크 2건")
  const status = payment.getByRole("cell").nth(6)
  await expect(status.locator('[data-slot="badge"]')).toHaveCount(1)
  await expect(status).toContainText("매입")
  const missing = table.getByRole("row").filter({ hasText: "DL-260704-02" })
  await expect(missing).toContainText("서류 미비 1건")
  const departure = table.getByRole("row").filter({ hasText: "DL-260625-07" })
  await expect(departure).toContainText("ETD")

  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "엑셀 다운로드" }).click()
  const download = await downloadPromise
  const stream = await download.createReadStream()
  let csv = ""
  for await (const chunk of stream!) csv += chunk.toString()
  expect(csv).toContain("D-day 기준")
  const paymentLine = csv.split("\n").find(line => line.includes("DL-260629-03"))!
  expect(paymentLine).toContain("결제")
  expect(paymentLine).toContain("2026-07-09")

  await page.getByRole("button", { name: "상세 필터", exact: true }).click()
  await page.getByRole("button", { name: "전체 해제", exact: true }).click()
  await page.getByPlaceholder("거래명, 번호, 거래처, 품목 검색").fill("DL-260918-93")
  const unknown = table.getByRole("row").filter({ hasText: "DL-260918-93" })
  await expect(unknown).toContainText("방향 확인 필요")
  await expect(unknown.getByRole("cell").nth(4)).not.toContainText("결제")
})

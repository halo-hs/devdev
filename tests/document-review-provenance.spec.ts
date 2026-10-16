import { expect, test } from "@playwright/test"

for (const width of [1440, 390]) {
  test(`review keeps edited provenance and opens known source at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(`/erp/documents/upload/${encodeURIComponent("인보이스_2607_003.pdf")}/review`)
    const buyer = page.locator('[data-upload-field="buyer"]')
    const seller = page.locator('[data-upload-field="seller"]')
    await expect(buyer.locator("input")).toHaveValue("HRM Corporation")
    await expect(page.locator("main[aria-busy]")).toHaveAttribute("aria-busy", "false")
    await buyer.locator("input").fill("수정한 거래처")
    await buyer.locator("input").blur()
    await expect(buyer).toContainText("사용자가 직접 입력한 값입니다")
    await expect(buyer).not.toContainText("신뢰도 높음")
    await expect(buyer.locator('[data-slot="badge"]')).toHaveCount(1)
    await expect(seller).toContainText("신뢰도 높음")
    await expect(page.locator('[data-upload-field="payment_due_date"]').getByRole("button", { name: /원본 보기/ })).toHaveCount(0)
    await page.waitForTimeout(1200)
    await page.reload()
    await expect(buyer.locator("input")).toHaveValue("수정한 거래처")
    await expect(buyer).toContainText("사용자가 직접 입력한 값입니다")
    await expect(seller).toContainText("신뢰도 높음")
    await expect(page.locator("main[aria-busy]")).toHaveAttribute("aria-busy", "false")
    if (width === 1440) {
      await page.getByRole("region", { name: "PDF 원문" }).getByRole("button", { name: "다음 페이지", exact: true }).click()
      await expect(page.getByRole("button", { name: "페이지 목록 열기, 현재 2 / 2 페이지" })).toBeVisible()
    }
    await buyer.getByRole("button", { name: "원본 보기 · 1쪽", exact: true }).click()
    const pdf = page.getByRole("region", { name: "PDF 원문" })
    await expect(pdf).toBeVisible()
    await expect(pdf).toBeFocused()
    await expect(pdf.getByRole("button", { name: "페이지 목록 열기, 현재 1 / 2 페이지" })).toBeVisible()
    if (width === 390) {
      await expect(page.getByRole("region", { name: "항목 점검" })).toBeHidden()
      await pdf.getByRole("button", { name: "필드 검토", exact: true }).click()
      await expect(buyer.locator("input")).toHaveValue("수정한 거래처")
    }
  })
}

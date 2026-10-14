import { expect, test } from "@playwright/test"

for (const { width, direction } of [
  { width: 1440, direction: "판매" },
  { width: 390, direction: "구매" },
]) {
  test(`review header shows the chosen ${direction} direction at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto("/erp/documents/create?state=first-use")
    const strip = page.getByRole("region", { name: "문서 폼 선택", exact: true })
    await strip.getByRole("tab", { name: direction, exact: true }).click()
    await strip.getByRole("button", { name: /SC.*판매계약서/ }).click()
    await strip.getByRole("button", { name: "문서 만들기", exact: true }).click()
    if (width < 768) await page.getByRole("button", { name: "항목 확인", exact: true }).click()
    for (const [key, value] of Object.entries({
      seller_name: "ECOYA Demo Co.",
      buyer_name: "Manual buyer",
      contract_number: "SC-MANUAL-001",
      contract_date: "2026-09-18",
      currency: "USD",
    })) {
      await page.locator(`[data-review-key="${key}"] input`).fill(value)
    }
    await page.getByRole("textbox", { name: "품목 1 품목명", exact: true }).fill("Manual item")
    await page.getByRole("spinbutton", { name: "품목 1 수량", exact: true }).fill("24")
    await page.getByRole("spinbutton", { name: "품목 1 단가", exact: true }).fill("120000")
    const create = page.getByRole("button", { name: "문서 초안 만들기", exact: true })
    await expect(create).toBeEnabled()
    await create.click()
    if (width < 768) await page.getByRole("button", { name: "검토·확정", exact: true }).click()
    const heading = page.getByRole("heading", { name: "검토·확정", exact: true })
    await expect(heading).toBeVisible()
    await expect(heading.locator("..").locator("..")).toContainText(`판매계약서 · SC-2026-0708.pdf · ${direction}`)
  })
}

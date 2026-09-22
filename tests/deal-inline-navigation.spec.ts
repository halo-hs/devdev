import { expect, test } from "@playwright/test"

for (const width of [1600, 390]) {
  test(`deal shortcuts use the existing fields and records at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/erp/deals/DL-260629-03")
    const price = page.getByRole("textbox", { name: "품목 1 단가", exact: true })
    await expect(price).toBeVisible()
    const previousValue = await price.inputValue()
    await page.getByRole("button", { name: "단가 수정", exact: true }).click()
    await expect(price).toBeFocused()
    await expect(price).toHaveValue(previousValue)
    await expect(page.getByRole("dialog")).toHaveCount(0)
    await expect.poll(() => page.evaluate(() => {
      const label = document.querySelector("[data-item-unit-price-heading]")!
      const header = document.querySelector("[data-deal-sticky-header]")!
      return Math.round(label.getBoundingClientRect().top - header.getBoundingClientRect().bottom)
    })).toBeGreaterThanOrEqual(8)
    await expect(price).toBeInViewport()

    const header = page.locator("[data-deal-sticky-header]")
    await expect(header.getByRole("button", { name: /노트 추가|메모·이력/ })).toHaveCount(0)
    const rail = page.getByRole("complementary", { name: "거래 현황", exact: true })
    await expect(page.locator("#deal-records-main").getByRole("button", { name: "메모 추가", exact: true })).toHaveCount(0)
    await expect(rail.getByRole("button", { name: "메모 추가", exact: true })).toHaveCount(0)
    await expect(page.getByRole("button", { name: "메모 추가", exact: true })).toHaveCount(1)
    await header.getByRole("button", { name: "메모 추가", exact: true }).click()
    const composer = page.getByRole("form", { name: "메모 추가", exact: true })
    const note = composer.getByRole("textbox", { name: "메모 내용", exact: true })
    await expect(note).toBeFocused()
    await expect(note).toBeInViewport()
    await expect(composer.getByRole("button", { name: "저장", exact: true })).toBeDisabled()
    await note.fill("메모 입력 위치 확인")
    await expect(composer.getByRole("button", { name: "저장", exact: true })).toBeEnabled()
    await composer.getByRole("button", { name: "취소", exact: true }).click()
    await expect(composer).toHaveCount(0)
    await expect(header.getByRole("button", { name: "메모 추가", exact: true })).toBeFocused()
    await expect(page.getByRole("dialog")).toHaveCount(0)
    await expect(page.getByText("7월 15일까지 B/L 원본 요청", { exact: true })).toHaveCount(1)

    // Unique quantity comparison and lifecycle confirmation still exist.
    await page.getByRole("button", { name: "품목별 수량", exact: true }).click()
    const comparison = page.getByRole("dialog", { name: "계약 품목별 수량", exact: true })
    await expect(comparison).toContainText("미선적 잔여")
    await page.keyboard.press("Escape")
    await page.getByRole("button", { name: "완료 마감", exact: true }).click()
    await expect(page.getByRole("dialog").filter({ has: page.getByRole("heading", { name: "주문 완료 마감", exact: true }) })).toBeVisible()
    await page.keyboard.press("Escape")
  })
}

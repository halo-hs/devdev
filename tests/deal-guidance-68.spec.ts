import { expect, test } from "@playwright/test"

for (const width of [1440, 390]) {
  test(`next document stays in information rail and short closure is green at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto("/erp/deals/DL-260708-01")
    const guidance = page.locator("[data-next-document]")
    await expect(guidance).toHaveCount(1)
    await expect(page.locator("[data-deal-information-aside] [data-next-document]")).toContainText("선하증권 · 포장명세서")
    await expect(page.getByRole("region", { name: "거래 중요 알림" }).locator("[data-next-document]")).toHaveCount(0)
    await expect(page.getByRole("region", { name: "주요 거래 정보" }).getByText("다음 할 일", { exact: true })).toHaveCount(0)
    await guidance.getByRole("button", { name: "진행하기" }).click({ trial: true })
    await guidance.scrollIntoViewIfNeeded()
    const bounds = (await guidance.boundingBox())!
    expect(bounds.x).toBeGreaterThanOrEqual(0)
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
    await page.screenshot({ path: `/tmp/deal-guidance-68-${width}.png` })
    await guidance.getByRole("button", { name: "진행하기" }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.keyboard.press("Escape")
    await page.getByRole("button", { name: "미달 마감", exact: true }).click()
    await page.getByPlaceholder("미달 마감 또는 취소 사유를 입력하세요").fill("잔여 수량을 더 진행하지 않고 종료")
    await page.getByRole("button", { name: "변경 적용", exact: true }).click()
    const closed = page.locator('#deal-fulfillment [data-slot="badge"]').filter({ hasText: /^미달 마감$/ })
    await expect(closed).toBeVisible()
    await expect(closed).toHaveClass(/bg-success/)
    await expect(closed).not.toHaveClass(/bg-warning/)
    await expect(page.getByRole("button", { name: "재오픈", exact: true })).toBeVisible()
  })
}

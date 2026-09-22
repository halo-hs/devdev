import { expect, test } from "@playwright/test"

test("one progress card combines workflow state, shortcuts and field access", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto("/erp/deals/DL-260708-01")
  const progress = page.getByRole("region", {
    name: "거래 진행 상태",
    exact: true,
  })
  await expect(progress).toHaveCount(1)
  await expect(
    page
      .getByRole("complementary", { name: "거래 현황" })
      .getByRole("region", { name: "거래 진행 상태" })
  ).toHaveCount(1)
  await expect(
    page.getByRole("link", { name: "현재 업무로 이동" })
  ).toHaveCount(1)
  await expect(progress.locator('li[aria-current="step"]')).toContainText(
    "선적"
  )
  await progress
    .getByRole("link", { name: "정산 구간으로 이동", exact: true })
    .click()
  await expect(page.locator("#deal-finance")).toBeInViewport()
  await progress
    .getByRole("link", { name: "선적 구간으로 이동", exact: true })
    .click()
  await expect(page.locator("#deal-fulfillment")).toBeInViewport()
  await progress
    .getByRole("link", { name: "거래 기본 항목으로 이동", exact: true })
    .click()
  await expect(page.locator("#deal-fields-basic")).toBeFocused()
})

test("settled deal marks every stage complete in the unified card on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/erp/deals/DL-260701-09")
  const progress = page.getByRole("region", {
    name: "거래 진행 상태",
    exact: true,
  })
  await expect(progress).toContainText("전체 완료")
  await expect(progress.locator('li[aria-current="step"]')).toHaveCount(0)
  for (const stage of ["계약", "선적", "통관", "정산"]) {
    await expect(
      progress.getByRole("link", {
        name: `${stage} 구간으로 이동`,
        exact: true,
      })
    ).toContainText("완료")
  }
  await progress
    .getByRole("link", { name: "결제 정보 항목으로 이동", exact: true })
    .click()
  await expect(page.locator("#deal-fields-payment")).toBeFocused()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(390)
})

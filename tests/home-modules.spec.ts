import { expect, test, type Page } from "@playwright/test"

const board = (page: Page) =>
  page.locator('section[aria-labelledby="today-workspace-title"]')
async function closeModule(page: Page, name: string) {
  const button = page.getByRole("button", { name, exact: true })
  await button.locator("..").hover()
  await expect(button).toHaveCSS("opacity", "1")
  await button.click()
}
async function options(page: Page) {
  await page.getByRole("button", { name: "모듈 편집", exact: true }).click()
}
async function restore(page: Page, name: string) {
  await options(page)
  const item = page.getByRole("menuitemcheckbox", { name, exact: true })
  await expect(item).toHaveAttribute("aria-checked", "false")
  await item.click()
  await page.keyboard.press("Escape")
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto("/erp/home")
  await page
    .getByRole("heading", { name: "오늘 업무판", exact: true })
    .waitFor()
})

for (const layout of ["split"] as const) {
  test(`${layout}: close, restore and persist module visibility without losing layout`, async ({
    page,
  }) => {
    await expect(board(page).locator("[data-module-grid]")).toHaveAttribute("data-layout-mode", "split")
    const required = board(page).locator('[data-module-id="settlement"]')
    const before = await required.boundingBox()
    await closeModule(page, "진행 현황·받을 돈 모듈 닫기")
    await expect(
      board(page).locator('[data-module-id="documents"]')
    ).toHaveCount(0)
    await expect(
      board(page).getByText("5개 모듈", { exact: true })
    ).toBeVisible()
    await expect(board(page).locator("[data-empty-module-slot]")).toHaveCount(0)
    await expect(
      board(page).getByRole("button", { name: "모듈 추가", exact: true })
    ).toHaveCount(0)
    if (layout === "split") {
      expect((await required.boundingBox())!.width).toBeGreaterThan(
        before!.width * 1.8
      )
    }
    await page.reload()
    await expect(
      board(page).locator('[data-module-id="documents"]')
    ).toHaveCount(0)
    await restore(page, "진행 현황·받을 돈")
    await expect(
      board(page).locator('[data-module-id="documents"]')
    ).toBeVisible()
    await expect(
      board(page).getByText("6개 모듈", { exact: true })
    ).toBeVisible()
    await page.reload()
    await expect(
      board(page).locator('[data-module-id="documents"]')
    ).toBeVisible()
  })
}

for (const layout of ["split"] as const) {
  test(`${layout}: required module survives closing every optional module and stale saved state`, async ({
    page,
  }) => {
    await expect(board(page).locator("[data-module-grid]")).toHaveAttribute("data-layout-mode", "split")
    const required = board(page).locator('[data-module-id="settlement"]')
    await expect(
      required.getByRole("button", { name: /모듈 닫기/ })
    ).toHaveCount(0)
    await options(page)
    await expect(
      page.getByRole("menuitemcheckbox", {
        name: "오늘 확인이 필요합니다 · 필수",
        exact: true,
      })
    ).toBeDisabled()
    await page.keyboard.press("Escape")
    for (const name of [
      "작업함",
      "진행 현황·받을 돈",
      "일정",
      "선적 일정",
      "업무 요약",
    ]) {
      await closeModule(page, `${name} 모듈 닫기`)
    }
    await expect(board(page).locator("[data-module-id]")).toHaveCount(1)
    await expect(board(page).locator("[data-empty-module-slot]")).toHaveCount(0)
    if (layout === "split") {
      const grid = (await board(page)
        .locator("[data-module-grid]")
        .boundingBox())!
      const card = (await required.boundingBox())!
      expect(Math.abs(card.width - grid.width)).toBeLessThan(2)
      expect(Math.abs(card.height - grid.height)).toBeLessThan(2)
      await expect(board(page).getByRole("separator")).toHaveCount(0)
    }
    await page.evaluate(() => {
      const key = "ecoya.today.hidden-modules.v1"
      const saved = JSON.parse(localStorage.getItem(key)!)
      localStorage.setItem(key, JSON.stringify([...saved, "settlement"]))
    })
    await page.reload()
    await expect(required).toBeVisible()
    await expect(board(page).locator("[data-module-id]")).toHaveCount(1)
    await restore(page, "진행 현황·받을 돈")
    await expect(board(page).locator("[data-module-id]")).toHaveCount(2)
    await expect(board(page).locator("[data-empty-module-slot]")).toHaveCount(0)
  })
}

for (const layout of ["split"] as const) {
  test(`${layout}: local-reference modules can be dragged and keep their new order`, async ({
    page,
  }) => {
    await expect(board(page).locator("[data-module-grid]")).toHaveAttribute("data-layout-mode", "split")
    const original = await page.evaluate(() =>
      localStorage.getItem("ecoya.today.modules.v2")
    )
    const source = board(page).locator('[data-module-id="documents"] header')
    const target = board(page).locator('[data-module-id="tasks"] header')
    await source.dragTo(target)
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("ecoya.today.modules.v2"))
      )
      .not.toBe(original)
    const reordered = await page.evaluate(() =>
      localStorage.getItem("ecoya.today.modules.v2")
    )
    await page.reload()
    await expect(
      board(page).getByRole("heading", {
        name: "진행 현황·받을 돈",
        exact: true,
      })
    ).toBeVisible()
    expect(
      await page.evaluate(() => localStorage.getItem("ecoya.today.modules.v2"))
    ).toBe(reordered)
    await expect(board(page).locator("[data-module-id]")).toHaveCount(6)
  })
}

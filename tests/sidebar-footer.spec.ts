import { expect, test, type Page } from "@playwright/test"

async function expectFooterInViewport(page: Page) {
  const footer = page.locator('[data-slot="sidebar-footer"]')
  await expect(footer).toBeInViewport({ ratio: 1 })
  await expect(footer.getByRole("button", { name: "프로필 메뉴" })).toBeVisible()
}

for (const viewport of [
  { width: 1440, height: 600 },
  { width: 1280, height: 600 },
  { width: 390, height: 844 },
]) {
  test(`SNAP operator keeps the footer without settings access at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.addInitScript(() => {
      localStorage.setItem("snap_web_session", JSON.stringify({ authenticated: true, role: "operator" }))
    })
    await page.goto("/dashboard")
    if (viewport.width < 768) await page.locator('[data-slot="sidebar-trigger"]').first().click()
    await expectFooterInViewport(page)

    const content = page.locator('[data-slot="sidebar-content"]')
    await content.evaluate((element) => { element.scrollTop = element.scrollHeight })
    await expectFooterInViewport(page)
    await expect(page.getByRole("button", { name: "설정", exact: true })).toHaveCount(0)
    await page.getByRole("button", { name: "프로필 메뉴" }).click()
    await expect(page.getByRole("menuitem", { name: "로그아웃", exact: true })).toBeVisible()
    await expect(page.getByRole("menuitem", { name: "설정", exact: true })).toHaveCount(0)
    await expect(page.getByRole("menuitem", { name: /요금제 보기|플랜 업그레이드/ })).toHaveCount(0)
    if (viewport.width === 1280) {
      await expect(page.getByRole("menuitem", { name: "고객 지원", exact: true })).toBeVisible()
    }
  })
}

test("SNAP manager and Trade OS retain footer settings navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 600 })
  await page.addInitScript(() => {
    localStorage.setItem("snap_web_session", JSON.stringify({ authenticated: true, role: "manager" }))
  })
  for (const route of ["/dashboard", "/erp/home", "/erp/settings?section=organization"]) {
    await page.goto(route)
    await expectFooterInViewport(page)
    await expect(page.getByRole("button", { name: "설정", exact: true })).toBeVisible()
    await page.getByRole("button", { name: "설정", exact: true }).click()
    await expect(page).toHaveURL(/\/settings(?:\?|$)/)
    await expectFooterInViewport(page)
  }
})

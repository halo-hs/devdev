import { expect, test, type Page } from "@playwright/test"

async function verticalScrollers(page: Page) {
  return page.locator("main[aria-busy]").evaluate((main) =>
    [main, ...main.querySelectorAll<HTMLElement>("*")]
      .filter((node) => node.clientHeight > 0 && node.scrollHeight > node.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(node).overflowY))
      .map((node) => ({ tag: node.tagName, deal: node.hasAttribute("data-deal-scroll-viewport") }))
  )
}

const screens = {
  monitoring: "MonitorConnected",
  settlement: "SettlementConnected",
  reports: "ReportsConnected",
  sales: "SalesPerformanceConnected",
  shipments: "ShipmentsConnected",
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test.describe(`${viewport.width}px page scrolling`, () => {
    test.use({ viewport })

    for (const [route, component] of Object.entries(screens)) {
      test(`${route} scrolls once and reaches the last content`, async ({ page }) => {
        await page.goto(`/erp/${route}`)
        await expect(page.locator(`[data-component="${component}"][data-state="ready"]`).first()).toBeVisible()
        await expect(page.locator("main[aria-busy]")).toHaveAttribute("aria-busy", "false")
        await expect(page.getByText("예시 데이터 · 변경 사항은 이 브라우저에만 반영됩니다.", { exact: true })).toHaveCount(0)
        await expect.poll(() => verticalScrollers(page)).toEqual([{ tag: "MAIN", deal: false }])
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)

        const main = page.locator("main[aria-busy]")
        await main.evaluate((node) => { node.scrollTop = node.scrollHeight })
        expect(await main.evaluate((node) => node.scrollTop)).toBeGreaterThan(0)
        const frame = (await main.boundingBox())!
        const content = (await page.locator("[data-reference-screen]").boundingBox())!
        expect(content.y + content.height).toBeLessThanOrEqual(frame.y + frame.height + 2)
        expect(content.y + content.height).toBeGreaterThan(frame.y)

        if (viewport.width < 640) {
          // Wide data tables must remain horizontally reachable without a second vertical scrollbar.
          const horizontal = await main.evaluate((root) => {
            const tables = [...root.querySelectorAll<HTMLElement>("*")].filter((node) =>
              node.clientWidth > 0 && node.scrollWidth > node.clientWidth + 2 && /auto|scroll/.test(getComputedStyle(node).overflowX)
            )
            return tables.map((node) => { node.scrollLeft = node.scrollWidth; return node.scrollLeft })
          })
          for (const left of horizontal) expect(left).toBeGreaterThan(0)
        }
      })
    }

    test("deal detail keeps its own scroll without overflowing the shell", async ({ page }) => {
      await page.goto("/erp/deals/DL-260708-01")
      const detail = page.locator("[data-deal-scroll-viewport]")
      await expect(detail).toBeVisible()
      await expect(page.locator("main[aria-busy]")).toHaveAttribute("aria-busy", "false")
      await expect.poll(() => verticalScrollers(page)).toEqual([{ tag: "DIV", deal: true }])
      await detail.evaluate((node) => { node.scrollTop = node.scrollHeight })
      expect(await detail.evaluate((node) => node.scrollTop)).toBeGreaterThan(0)
      expect(await page.locator("main[aria-busy]").evaluate((node) => node.scrollTop)).toBe(0)
    })
  })
}

test("monitor keeps one scroll after changing the count filter and scrolling over a queue", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/erp/monitoring")
  const filter = page.locator('[data-ui="monitor-filters"]')
  const queue = page.locator('[data-component="BlockedCard"] [data-ui="task-queue-list"]')
  for (const limit of [10, 50]) {
    const option = filter.getByRole("button", { name: `${limit}건`, exact: true })
    await option.click()
    await expect(option).toHaveAttribute("aria-pressed", "true")
    // Demo responses contain a fixed queue; live server row filtering is outside this layout test.
    await expect(queue.locator(":scope > *").first()).toBeVisible()
    await expect.poll(() => verticalScrollers(page)).toEqual([{ tag: "MAIN", deal: false }])
    await queue.locator(":scope > *").first().scrollIntoViewIfNeeded()
    await queue.locator(":scope > *").first().hover()
    const main = page.locator("main[aria-busy]")
    const before = await main.evaluate((node) => node.scrollTop)
    await page.mouse.wheel(0, 400)
    await expect.poll(() => main.evaluate((node) => node.scrollTop)).toBeGreaterThan(before)
  }
})

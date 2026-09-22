import { expect, test } from "@playwright/test"

const routes = [
  "/erp/home",
  "/erp/deals",
  "/erp/deals/DL-260629-03",
  "/erp/documents/upload",
  "/erp/documents/create",
  "/erp/documents/create/SC-2026-0708",
  "/erp/ai",
  `/erp/documents/upload/${encodeURIComponent("인보이스_2607_003.pdf")}/review`,
  "/erp/shipments",
  "/erp/settlement",
  "/erp/monitoring",
  "/erp/reports",
  "/erp/sales",
  "/erp/notifications",
  "/erp/counterparties",
  "/erp/evidence",
  "/erp/onboarding",
]

for (const width of [1440, 390]) {
  test(`loading preserves each page's own layout at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width, height: 1000 })
    await page.addInitScript(() => {
      const original = window.setTimeout.bind(window)
      window.setTimeout = ((
        handler: TimerHandler,
        delay?: number,
        ...args: unknown[]
      ) => {
        if (delay === 420 && typeof handler === "function") {
          Object.assign(window, { finishPageLoading: handler })
          return original(() => {}, 60_000)
        }
        return original(handler, delay, ...args)
      }) as typeof window.setTimeout
    })
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    for (const route of routes) {
      await page.goto(route)
      const status = page.getByRole("status", {
        name: "화면을 불러오는 중",
        exact: true,
      })
      await expect(status, route).toBeVisible()
      await expect(
        status.locator('rect[data-skeleton-part="content"]').first(),
        route
      ).toBeVisible()
      const root = page.locator("[data-loading-content]")
      await expect(root, route).toHaveAttribute("aria-hidden", "true")
      await expect(root.locator("..")).toHaveAttribute("inert", "")
      await page.evaluate(() => document.fonts.ready.then(() => undefined))
      await expect
        .poll(
          () =>
            page.evaluate(() => {
              const root = document.querySelector("[data-loading-content]")!
              const shapes = Array.from(
                document.querySelectorAll(
                  '[data-page-skeleton] rect[data-skeleton-part="content"]'
                )
              ).map((element) => element.getBoundingClientRect())
              return Array.from(
                root.querySelectorAll('input:not([type="hidden"]), button')
              )
                .map((element) => ({
                  name:
                    element.getAttribute("aria-label") ?? element.textContent,
                  rect: element.getBoundingClientRect(),
                }))
                .filter(
                  ({ rect }) =>
                    rect.width > 5 &&
                    rect.height > 5 &&
                    rect.y > 0 &&
                    rect.bottom < innerHeight &&
                    rect.x >= 0 &&
                    rect.right <= innerWidth
                )
                .slice(0, 8)
                .filter(
                  ({ rect }) =>
                    !shapes.some(
                      (shape) =>
                        shape.x >= rect.x - 2 &&
                        shape.y >= rect.y - 2 &&
                        shape.right <= rect.right + 2 &&
                        shape.bottom <= rect.bottom + 2 &&
                        shape.width > rect.width * 0.5 &&
                        shape.height > rect.height * 0.5
                    )
                )
                .map(({ name }) => name)
            }),
          { message: `${route}: visible controls match their placeholders` }
        )
        .toEqual([])
      await page.evaluate(() =>
        (
          window as unknown as { finishPageLoading: () => void }
        ).finishPageLoading()
      )
      await expect(status).toHaveCount(0)
      await expect(root).not.toHaveAttribute("aria-hidden", "true")
      await expect(root.locator("..")).not.toHaveAttribute("inert", "")
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        ),
        route
      ).toBeTruthy()
    }
    for (const route of [
      "/erp/settings",
      "/erp/settings/billing",
      "/erp/settings/tokens",
    ]) {
      await page.goto(route)
      await expect(page.getByRole("navigation", { name: "현재 위치" })).toContainText("설정")
      await expect(page.locator("[data-page-skeleton]")).toHaveCount(0)
    }
    expect(errors).toEqual([])
  })
}

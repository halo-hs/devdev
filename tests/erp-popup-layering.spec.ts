import { expect, test, type Page } from "@playwright/test"

async function expectPopupAboveSidebar(page: Page) {
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  // Hit testing checks the actual painted order, including ancestor stacking
  // contexts; comparing the two z-index values alone would miss clipping.
  await expect
    .poll(() =>
      dialog.evaluate((popup) => {
        const sidebar = document.querySelector(
          '[data-slot="sidebar-container"]'
        )!
        const rect = sidebar.getBoundingClientRect()
        return [0.2, 0.5, 0.8].every((fraction) =>
          popup.contains(
            document.elementFromPoint(
              rect.left + rect.width / 2,
              rect.top + rect.height * fraction
            )
          )
        )
      })
    )
    .toBe(true)
}

test.describe("ERP popup layering", () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test.beforeEach(async ({ page }) => {
    await page.goto("/erp/deals/DL-260708-01")
    await expect(
      page.getByRole("button", { name: "공유 대상 2명" })
    ).toBeVisible()
  })

  for (const width of [1440, 1280]) {
    test(`profile menu stays above the sidebar at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await page
        .getByRole("button", { name: "프로필 메뉴", exact: true })
        .click()
      const menu = page.locator('[data-slot="dropdown-menu-content"]')
      await expect(menu).toBeVisible()
      await expect
        .poll(() =>
          menu.evaluate((popup) => {
            const sidebar = document.querySelector<HTMLElement>(
              '[data-slot="sidebar-container"]'
            )!
            const navRect = sidebar.getBoundingClientRect()
            const popupRect = popup.getBoundingClientRect()
            const left = Math.max(navRect.left, popupRect.left)
            const right = Math.min(navRect.right, popupRect.right)
            const top = Math.max(navRect.top, popupRect.top)
            const bottom = Math.min(navRect.bottom, popupRect.bottom)
            // Radix disables background pointer events. Restore hit testing
            // briefly so a painted sidebar cannot be mistaken for empty space.
            const pointerEvents = sidebar.style.pointerEvents
            sidebar.style.pointerEvents = "auto"
            try {
              return (
                right > left &&
                bottom > top &&
                popup.contains(
                  document.elementFromPoint(
                    (left + right) / 2,
                    (top + bottom) / 2
                  )
                )
              )
            } finally {
              sidebar.style.pointerEvents = pointerEvents
            }
          })
        )
        .toBe(true)
      await page.getByRole("menuitem", { name: /언어/ }).hover()
      await page
        .getByRole("menuitemradio", { name: "English (US)", exact: true })
        .click()
      await expect(menu).toHaveCount(0)
    })
  }

  test("share popup covers navigation and its select remains clickable", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "공유 대상 2명" }).click()
    await expectPopupAboveSidebar(page)
    const select = page.getByRole("dialog").getByRole("combobox")
    await select.click()
    await page.getByRole("option", { name: "이민지", exact: true }).click()
    await expect(select).toContainText("이민지")
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "닫기", exact: true })
      .last()
      .click()
    await expect(page.getByRole("dialog")).toHaveCount(0)
  })

  test("confirmation popup covers navigation and cancels without deleting", async ({
    page,
  }) => {
    const deleteButtons = page.getByRole("button", {
      name: "노트 삭제",
      exact: true,
    })
    await expect(deleteButtons.first()).toBeVisible()
    const count = await deleteButtons.count()
    await deleteButtons.first().click()
    await expectPopupAboveSidebar(page)
    await page.getByRole("dialog").getByRole("button", { name: "취소" }).click()
    await expect(page.getByRole("dialog")).toHaveCount(0)
    await expect(deleteButtons).toHaveCount(count)
  })

  test("create popup covers navigation and accepts input", async ({ page }) => {
    await page.getByRole("button", { name: "거래 목록으로 돌아가기" }).click()
    await page.getByRole("button", { name: "거래 만들기", exact: true }).click()
    await expectPopupAboveSidebar(page)
    await page
      .getByRole("dialog")
      .getByRole("textbox", { name: "거래명", exact: true })
      .fill("겹침 확인")
    await expect(
      page.getByRole("dialog").getByRole("button", { name: "거래 만들기" })
    ).toBeEnabled()
    await page.getByRole("dialog").getByRole("button", { name: "취소" }).click()
    await expect(page.getByRole("dialog")).toHaveCount(0)
  })
})

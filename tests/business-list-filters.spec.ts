import { expect, test } from "@playwright/test"

const menus = [
  ["deals", "거래 검색 필터"],
  ["shipments", "선적 검색 필터"],
  ["monitor", "운영 감시 필터"],
  ["settlement", "정산 필터"],
  ["reports", "결산 리포트 필터"],
  ["sales", "영업 성과 필터"],
  ["notifications", "알림 검색 필터"],
  ["documents/upload", "업로드 문서 필터"],
  ["documents/create", "만든 문서 검색 필터"],
] as const

for (const width of [1440, 390]) {
  test(`menu filters fit the available width at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(90_000)
    await page.setViewportSize({ width, height: 1000 })
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    for (const [route, label] of menus) {
      await page.goto(`/erp/${route}`)
      const toolbar = page.locator(
        `.business-filter-bar[aria-label="${label}"]`
      )
      await expect(toolbar).toBeVisible()
      for (const control of await toolbar.getByRole("combobox").all()) {
        await expect(control).toHaveCSS("height", "40px")
        await expect(control).toHaveCSS("font-size", "14px")
      }
      const layout = await toolbar.evaluate((el) => {
        const rect = el.getBoundingClientRect()
        return {
          left: rect.left,
          right: rect.right,
          width: el.clientWidth,
          contentWidth: el.scrollWidth,
          fields: [
            ...el.querySelectorAll<HTMLElement>(".business-filter-field"),
          ].map((field) => ({
            width: field.clientWidth,
            contentWidth: field.scrollWidth,
          })),
        }
      })
      expect(layout.left, route).toBeGreaterThanOrEqual(0)
      expect(layout.right, route).toBeLessThanOrEqual(width)
      expect(layout.contentWidth, route).toBeLessThanOrEqual(layout.width + 1)
      for (const field of layout.fields)
        expect(field.contentWidth, route).toBeLessThanOrEqual(field.width + 1)
    }
    expect(errors).toEqual([])
  })
}

test("created document results combine the selected status and search; clearing preserves status", async ({
  page,
}) => {
  await page.goto("/erp/documents/create")
  const toolbar = page.locator('[aria-label="만든 문서 검색 필터"]')
  const search = toolbar.getByRole("searchbox", { name: "만든 문서 검색" })
  const draft = toolbar.getByRole("tab", { name: /^작성 중/ })
  await draft.click()
  const before = await toolbar.locator(".business-filter-result").innerText()
  await search.fill("no-such-document-987654")
  await expect(toolbar.locator(".business-filter-result")).toHaveText(
    "0건 표시 중"
  )
  await toolbar.getByRole("button", { name: "검색어 지우기" }).click()
  await expect(search).toBeFocused()
  await expect(draft).toHaveAttribute("aria-selected", "true")
  await expect(toolbar.locator(".business-filter-result")).toHaveText(before)
})

test("upload filters keep their labels and show only the selected document state", async ({
  page,
}) => {
  await page.goto("/erp/documents/upload")
  const toolbar = page.locator('[aria-label="업로드 문서 필터"]')
  await toolbar
    .getByRole("combobox", { name: "상태 필터", exact: true })
    .click()
  await page
    .getByRole("option", { name: "거래 연결 완료", exact: true })
    .click()
  await expect(toolbar.getByText("상태", { exact: true })).toBeVisible()
  await expect(
    page.getByRole("row").filter({ hasText: "계약서_안심찬.pdf" })
  ).toBeVisible()
  await expect(
    page.getByRole("row").filter({ hasText: "중복 확인 필요" })
  ).toHaveCount(0)
  await toolbar
    .getByRole("combobox", { name: "문서 유형 필터", exact: true })
    .click()
  await page.keyboard.press("Escape")
  await expect(
    toolbar.getByRole("combobox", { name: "상태 필터", exact: true })
  ).toContainText("거래 연결 완료")
})

test("notification category and search work together after moving into one toolbar", async ({
  page,
}) => {
  await page.goto("/erp/notifications")
  const toolbar = page.locator('[aria-label="알림 검색 필터"]')
  const approval = toolbar.getByRole("button", { name: /^승인 요청/ })
  await approval.click()
  await expect(toolbar.locator(".business-filter-result")).toHaveText(
    "1건 표시 중"
  )
  await toolbar
    .getByRole("searchbox", { name: "알림 검색" })
    .fill("no-such-notification-987654")
  await expect(toolbar.locator(".business-filter-result")).toHaveText(
    "0건 표시 중"
  )
  await toolbar.getByRole("button", { name: "검색어 지우기" }).click()
  await expect(approval).toHaveAttribute("aria-pressed", "true")
  await expect(toolbar.locator(".business-filter-result")).toHaveText(
    "1건 표시 중"
  )
})

test("currency dropdown updates reporting data and period controls keep their selection", async ({
  page,
}) => {
  for (const [route, control] of [
    ["reports", "reports"],
    ["sales", "salesperf"],
  ] as const) {
    await page.goto(`/erp/${route}`)
    const toolbar = page.locator(`[data-ui="${control}-controls"]`)
    const period = toolbar.getByRole("button", { name: "6개월", exact: true })
    await period.click()
    await toolbar.getByRole("combobox", { name: "통화", exact: true }).click()
    await page.getByRole("option", { name: "EUR", exact: true }).click()
    await expect(
      toolbar.getByRole("combobox", { name: "통화", exact: true })
    ).toContainText("EUR")
    await expect(period).toHaveAttribute("aria-pressed", "true")
    const metrics = page.locator(
      route === "reports"
        ? '[data-ui="reports-kpi"]'
        : '[data-ui="salesperf-kpis"]'
    )
    await expect(metrics.first()).toContainText("EUR")
  }
})

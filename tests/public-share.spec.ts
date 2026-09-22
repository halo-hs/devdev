import { expect, test } from "@playwright/test"

const endpoint = "**/api/platform/public/documents/test-token/package"
const packageInfo = {
  doc_number: "CI-TEST-42",
  label: "상업송장",
  amount: "120.00",
  currency: "USD",
  attachments: [{ filename: "packing-list.pdf" }],
}

for (const width of [1440, 390]) {
  test(`recipient preview and sample PDF at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto("/share/preview")
    await expect(
      page.getByRole("heading", { name: "상업송장", exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("region", { name: "문서 미리보기" })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Toggle Sidebar" })
    ).toHaveCount(0)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBeTruthy()
    const downloaded = page.waitForEvent("download")
    await page.getByRole("button", { name: "패키지 다운로드 (3개)" }).click()
    const file = await downloaded
    expect(file.suggestedFilename()).toBe("CI-2026-0916-package-sample.pdf")
    const stream = await file.createReadStream()
    const chunks: Buffer[] = []
    for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
    expect(Buffer.concat(chunks).subarray(0, 5).toString()).toBe("%PDF-")
    await expect(
      page.getByRole("button", { name: "패키지 다운로드 (3개)" })
    ).toBeEnabled()
    await page.screenshot({
      path: `docs/screens/assets/magic-link/recipient-${width}.png`,
      fullPage: true,
    })
    for (const state of [
      "loading",
      "expired",
      "open_cap",
      "not_found",
      "error",
    ]) {
      await page
        .getByRole("combobox", { name: "공유 화면 상태" })
        .selectOption(state)
      await expect(
        page.getByRole("region", { name: "문서 미리보기" })
      ).toHaveCount(0)
      await expect(page.getByRole("button", { name: /다운로드/ })).toHaveCount(
        0
      )
    }
    await page.getByRole("button", { name: "다시 시도", exact: true }).click()
    await expect(
      page.getByRole("region", { name: "문서 미리보기" })
    ).toBeVisible()
  })
}

test("real token waits for validation and never uses sample data", async ({
  page,
}) => {
  let release!: () => void
  const blocked = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route(endpoint, async (route) => {
    await blocked
    await route.fulfill({ json: packageInfo })
  })
  await page.route("**/api/platform/public/documents/test-token", (route) =>
    route.fulfill({ contentType: "text/html", body: "<p>Frozen document</p>" })
  )
  await page.goto("/share/test-token?state=active")
  await expect(
    page.getByRole("heading", { name: "문서 링크를 확인하고 있습니다" })
  ).toBeVisible()
  await expect(page.locator("iframe")).toHaveCount(0)
  await expect(page.getByRole("button", { name: /다운로드/ })).toHaveCount(0)
  release()
  await expect(page.getByText("CI-TEST-42.pdf", { exact: true })).toBeVisible()
  await expect(page.locator("iframe")).toHaveAttribute(
    "src",
    "/api/platform/public/documents/test-token"
  )
  await expect(page.getByText("38,400.00", { exact: false })).toHaveCount(0)
})

for (const [status, code, state] of [
  [410, "LINK_EXPIRED", "expired"],
  [429, "LINK_OPEN_LIMIT", "open_cap"],
  [404, "LINK_UNAVAILABLE", "not_found"],
  [200, "", "error"],
] as const) {
  test(`public response ${status} ${code} hides documents`, async ({
    page,
  }) => {
    await page.route(endpoint, (route) =>
      route.fulfill({ status, json: { error: { code } } })
    )
    await page.goto("/share/test-token?state=active")
    await expect(page.locator("[data-share-state]")).toHaveAttribute(
      "data-share-state",
      state
    )
    await expect(page.locator("iframe")).toHaveCount(0)
    await expect(page.getByRole("button", { name: /다운로드/ })).toHaveCount(0)
  })
}

test("temporary failures honor Retry-After and retry metadata", async ({
  page,
}) => {
  let calls = 0
  let recovered = false
  await page.route(endpoint, (route) => {
    calls++
    return route.fulfill(
      !recovered
        ? {
            status: 503,
            headers: { "Retry-After": "2" },
            json: { error: { code: "TEMPORARY" } },
          }
        : { json: packageInfo }
    )
  })
  await page.route("**/api/platform/public/documents/test-token", (route) =>
    route.fulfill({ body: "document" })
  )
  await page.goto("/share/test-token")
  await expect(
    page.getByRole("button", { name: /초 후 다시 시도/ })
  ).toBeDisabled()
  const initialCalls = calls
  recovered = true
  await page.getByRole("button", { name: "다시 시도", exact: true }).click()
  await expect(page.getByText("CI-TEST-42.pdf", { exact: true })).toBeVisible()
  expect(calls).toBeGreaterThan(initialCalls)
})

test("missing token does not mount the ERP shell", async ({ page }) => {
  await page.goto("/share/")
  await expect(
    page.getByRole("heading", { name: "이 문서 링크는 사용할 수 없습니다" })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Toggle Sidebar" })
  ).toHaveCount(0)
})

import { expect, test } from "@playwright/test"
import { getDealWorkPlan } from "../trade-os/lib/deal-workflow"

test("next work wins over the deal stage, completed work retains chronological order", () => {
  const finance = getDealWorkPlan("DL-260629-03")
  expect(finance.current).toBe("finance")
  expect(finance.order).toEqual([
    "finance",
    "documents",
    "fulfillment",
    "customs",
  ])
  expect(finance.states.customs).toBe("complete")
  const done = getDealWorkPlan("DL-260701-09")
  expect(done.current).toBeNull()
  expect(done.order).toEqual(["documents", "fulfillment", "customs", "finance"])
  expect(
    Object.values(done.states).every((state) => state === "complete")
  ).toBe(true)
})

test("finance task is first and uses the same current state in the fixed rail", async ({
  page,
}) => {
  await page.goto("/erp/deals/DL-260629-03")
  await expect(page.locator("[data-work-section]").first()).toHaveAttribute(
    "data-work-section",
    "finance"
  )
  const rail = page.getByRole("complementary", { name: "거래 현황" })
  await expect(
    rail.getByRole("region", { name: "주요 거래 정보" })
  ).toContainText("Meridian Metals")
  await expect(rail.locator('[aria-current="step"]')).toContainText("정산")
  await expect(page.locator("#deal-overview")).not.toContainText("KATAMAN")
  await expect(
    page.locator('[data-work-state="complete"] [aria-controls^="planned-"]')
  ).toHaveCount(0)
})

test("upcoming preview can close without starting; manual start persists and cannot close", async ({
  page,
}) => {
  await page.goto("/erp/deals/DL-260707-04")
  const finance = page.locator('[data-work-section="finance"]')
  await expect(finance).toHaveAttribute("data-work-state", "planned")
  await finance.getByRole("button", { name: /미리 보기/ }).click()
  await expect(finance).toContainText("송장·통화·지급조건")
  await expect(finance).toHaveAttribute("data-work-state", "planned")
  await finance.getByRole("button", { name: /접기/ }).click()
  await expect(finance.getByText("송장·통화·지급조건")).toHaveCount(0)
  await finance.getByRole("button", { name: "직접 입력", exact: true }).click()
  await expect(finance).toHaveAttribute("data-work-state", "active")
  await expect(page.locator("[data-work-section]").first()).toHaveAttribute(
    "data-work-section",
    "finance"
  )
  await expect(
    finance.getByRole("button", { name: /접기|미리 보기/ })
  ).toHaveCount(0)
  await page.reload()
  await expect(finance).toHaveAttribute("data-work-state", "active")
  await expect(page.locator("#deal-fields-payment")).toBeVisible()
})

test("document chips open the selected source, two-row items fit both panels and retain edits", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1100 })
  await page.goto("/erp/deals/DL-260708-01")
  const strip = page.getByLabel("거래 상세 서류 목록", { exact: true })
  await strip
    .getByRole("button", { name: "포장명세서 보유", exact: true })
    .click()
  const dialog = page.getByRole("dialog", { name: "거래 상세 · 문서 대조" })
  await expect(
    dialog.getByRole("button", { name: "포장명세서 보유", exact: true })
  ).toBeVisible()
  await expect(dialog).toContainText("PackingList_0707.pdf")
  const items = dialog.getByRole("table", { name: "매입 품목", exact: true })
  await expect(items.getByLabel("품목 1 품목명", { exact: true })).toBeVisible()
  await expect(
    items.getByLabel("품목 1 HS Code", { exact: true })
  ).toBeVisible()
  const size = await items.evaluate((el) => ({
    width: el.clientWidth,
    scroll: el.scrollWidth,
  }))
  expect(size.scroll).toBeLessThanOrEqual(size.width + 1)
  const heights = await items
    .locator(
      'input[aria-label^="품목 1"], button[role="combobox"][aria-label^="품목 1"]'
    )
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().height)
    )
  expect(heights.length).toBeGreaterThan(7)
  expect(heights.every((height) => height === 40)).toBe(true)
  const qty = items.getByLabel("품목 1 수량", { exact: true })
  await qty.fill("10")
  await qty.blur()
  await expect(dialog.getByText(/자동 저장됨/)).toBeVisible()
  await dialog
    .getByRole("button", { name: "거래로 돌아가기", exact: true })
    .click()
  await expect(
    page
      .getByRole("table", { name: "매입 품목", exact: true })
      .getByLabel("품목 1 수량", { exact: true })
  ).toHaveValue("10")
  await expect(page.locator("[data-work-section]").first()).toHaveAttribute(
    "data-work-section",
    "fulfillment"
  )
})

test("narrow item layout wraps and future preview remains read-only", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/erp/deals/DL-260707-04")
  const upcoming = page.locator('[data-work-section="finance"]')
  await upcoming.getByRole("button", { name: /미리 보기/ }).click()
  await expect(upcoming.getByRole("textbox")).toHaveCount(0)
  const overflow = await page
    .getByRole("table", { name: "매출 품목", exact: true })
    .evaluate((el) => ({
      table: el.scrollWidth > el.clientWidth + 1,
      page: document.documentElement.scrollWidth > innerWidth,
    }))
  expect(overflow).toEqual({ table: false, page: false })
})

test("confirmation disclosure and direct links are independent of required review", async ({
  page,
}) => {
  await page.goto("/erp/deals/DL-260708-01")
  const confirmation = page.locator("[data-deal-review-summary]")
  const missing = page.getByRole("region", {
    name: "상세 항목 검토",
    exact: true,
  })
  await missing.getByRole("button", { name: "검토 항목 펼치기" }).click()
  await expect(confirmation).toContainText("수취 계좌 변경 확인")
  await confirmation.getByRole("button", { name: "확인 항목 펼치기" }).click()
  await expect(
    confirmation.getByRole("list", { name: "확인 알림 목록" })
  ).toContainText("B/L 중량 대조 필요")
  await confirmation.getByRole("button", { name: "확인 항목 접기" }).click()
  await confirmation
    .getByRole("button", { name: "수취 계좌 변경 확인", exact: true })
    .click()
  await expect(
    page.getByRole("dialog", { name: "검토 알림", exact: true })
  ).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(
    missing.getByRole("button", { name: "검토 항목 접기" })
  ).toHaveAttribute("aria-expanded", "true")
  await expect(
    page
      .locator("#deal-overview")
      .getByRole("button", { name: "AI에게 질문하기" })
  ).toHaveCount(1)
  await expect(
    page
      .getByRole("complementary", { name: "거래 현황" })
      .getByRole("button", { name: "AI에게 질문하기" })
  ).toHaveCount(0)
})

test("editing key information updates the rail after comparison closes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto("/erp/deals/DL-260708-01")
  await expect(page.locator("[data-page-loading]")).toHaveCount(0)
  await page.locator("#deal-field-amount_total").fill("125,000")
  await page.locator("#deal-field-amount_total").blur()
  const rail = page.getByRole("complementary", { name: "거래 현황" })
  await expect(
    rail.getByRole("region", { name: "거래 요약 지표" })
  ).toContainText("125,000 USD")
  await page
    .getByRole("region", { name: "거래 상세 정보", exact: true })
    .getByRole("button", { name: "문서와 같이 보며 수정", exact: true })
    .click()
  await expect(
    page
      .getByRole("dialog", { name: "거래 상세 · 문서 대조" })
      .locator("#deal-field-amount_total")
  ).toHaveValue("125,000")
  await page
    .getByRole("dialog", { name: "거래 상세 · 문서 대조" })
    .getByRole("button", { name: "거래로 돌아가기" })
    .click()
  await rail
    .getByRole("link", { name: "선적 구간으로 이동", exact: true })
    .click()
  await expect(
    page.getByRole("dialog", { name: "거래 상세 · 문서 대조" })
  ).toHaveCount(0)
  await expect(page.locator("#deal-fulfillment")).toBeInViewport()
})

for (const width of [1600, 390]) {
  test(`scrolling shows only alert counts and their links work at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto("/erp/deals/DL-260708-01")
    const full = page.getByRole("region", { name: "거래 중요 알림" })
    await expect(full).toBeInViewport()
    const compact = page.getByLabel("고정 알림 건수", { exact: true })
    await expect(compact).toHaveCount(0)
    await page.locator("[data-deal-scroll-viewport]").evaluate((el) => {
      el.scrollTop = 1600
    })
    await expect(compact).toBeInViewport()
    await expect(full).not.toBeInViewport()
    const box = await compact.boundingBox()
    expect(box!.height).toBeLessThan(40)
    await compact.getByRole("button", { name: "검토 필요 3건" }).click()
    await page
      .getByRole("button", { name: "B/L 번호", exact: true })
      .last()
      .click()
    await expect(page.locator("#deal-field-bl_number")).toBeFocused()
    await expect(page.locator("#deal-field-bl_number")).toBeInViewport()
    const rail = page.getByRole("complementary", { name: "거래 현황" })
    expect(await rail.evaluate((el) => getComputedStyle(el).overflowY)).toBe(
      "visible"
    )
    await expect(rail.getByText("7월 15일까지 B/L 원본 요청")).toHaveCount(0)
    await expect(page.locator("#deal-records-main")).toContainText(
      "7월 15일까지 B/L 원본 요청"
    )
  })
}

test("item conflicts sit in the heading without a tinted row and disappear after selection", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto("/erp/deals/DL-260708-01")
  const table = page.getByRole("table", { name: "매입 품목", exact: true })
  const first = table.locator("tbody > tr").nth(0)
  const second = table.locator("tbody > tr").nth(2)
  await expect(
    first.locator("[data-quantity-heading]").getByRole("button")
  ).toHaveCount(0)
  await expect(second.locator("td").first()).toContainText("불일치")
  expect(
    await second.evaluate((el) => getComputedStyle(el).backgroundColor)
  ).toBe("rgba(0, 0, 0, 0)")
  await second
    .locator("[data-quantity-heading]")
    .getByRole("button", { name: "문서별 값 4개" })
    .click()
  await page.getByRole("button", { name: /PL 4 PackingList_0707.pdf/ }).click()
  await expect(second.getByLabel("품목 2 수량", { exact: true })).toHaveValue(
    "4"
  )
  await expect(
    second.locator("[data-quantity-heading]").getByRole("button")
  ).toHaveCount(0)
  await expect(second.locator("td").first()).not.toContainText("불일치")
  await expect(page.locator("[data-deal-information-main]")).toHaveCount(0)
})

test("required review counts equal visible unresolved fields and update after each fix", async ({
  page,
}) => {
  await page.goto("/erp/deals/DL-260708-01")
  const required = page.getByRole("region", { name: "상세 항목 검토" })
  await expect(required).toContainText("검토 필요 3건")
  await required.getByRole("button", { name: "검토 항목 펼치기" }).click()
  await expect(required.getByRole("list").getByRole("listitem")).toHaveCount(3)
  await page.locator("#deal-field-bl_number").fill("BL-2026-0708")
  await expect(required).toContainText("검토 필요 2건")
  await page.locator("#deal-field-amount_total").fill("2400000")
  await expect(required).toContainText("검토 필요 1건")
  const quantityHeading = page.locator("[data-quantity-heading]").nth(1)
  await quantityHeading.getByRole("button", { name: "문서별 값 4개" }).click()
  await page.getByRole("button", { name: /PL 4 PackingList_0707.pdf/ }).click()
  await expect(required).toHaveCount(0)
  await expect(page.getByText("대조 완료", { exact: true })).toBeVisible()
  await expect(page.locator("[data-deal-review-summary]")).toContainText(
    "확인 필요 3건"
  )
})

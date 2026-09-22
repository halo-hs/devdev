import { expect, test } from "@playwright/test"
const route = "/erp/deals/DL-260708-01"

test("all work sections are rendered and shortcuts stay in the common right rail", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto(route)
  await expect(page.getByRole("tab")).toHaveCount(0)
  for (const id of [
    "deal-overview",
    "deal-documents",
    "deal-fulfillment",
    "deal-finance",
  ]) {
    await expect(page.locator(`#${id}`)).toBeVisible()
  }
  const rail = page.getByRole("complementary", { name: "거래 현황" })
  const nav = rail.getByRole("navigation", { name: "거래 정보 바로가기" })
  await expect(nav).toBeVisible()
  await nav
    .getByRole("link", { name: "정산 구간으로 이동", exact: true })
    .click()
  await expect(page.locator("#deal-finance")).toBeInViewport()
  await expect(nav).toBeInViewport()
  const mainBox = await page.locator("[data-deal-page-content]").boundingBox()
  const sideBox = await rail.boundingBox()
  expect(sideBox!.x).toBeGreaterThan(mainBox!.x + mainBox!.width)
  await expect(rail).toContainText("정보·업무 진행")
  await expect(
    page.getByRole("region", { name: "거래 요약 지표" })
  ).toBeVisible()
  await expect(
    rail.getByRole("region", { name: "거래 요약 지표" })
  ).toHaveCount(1)
  await expect(rail).toContainText("거래 건강도")
  await expect(page.locator("#deal-records-main")).toContainText(
    "7월 15일까지 B/L 원본 요청"
  )
  await expect(page.getByRole("dialog", { name: "참고 정보" })).toHaveCount(0)
})

test("document editing fills the work area below the header and restores the page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto(route)
  const details = page.getByRole("region", {
    name: "거래 상세 정보",
    exact: true,
  })
  await details.locator('input[value="CIF Incheon"]').fill("FOB Busan")
  await page.keyboard.press("Tab")
  const open = details.getByRole("button", {
    name: "문서와 같이 보며 수정",
    exact: true,
  })
  await open.scrollIntoViewIfNeeded()
  const before = await details.evaluate((el) => el.getBoundingClientRect().top)
  await open.click()
  const editor = page.getByRole("dialog", {
    name: "거래 상세 · 문서 대조",
    exact: true,
  })
  await expect(editor).toBeVisible()
  await expect(async () => {
    const box = await editor.boundingBox()
    const body = await page.locator("[data-deal-scroll-viewport]").boundingBox()
    const header = await page.locator("[data-deal-sticky-header]").boundingBox()
    expect(Math.abs(box!.x - body!.x)).toBeLessThan(2)
    expect(Math.abs(box!.width - body!.width)).toBeLessThan(2)
    expect(Math.abs(box!.y - header!.y - header!.height)).toBeLessThan(2)
    expect(
      Math.abs(box!.y + box!.height - body!.y - body!.height)
    ).toBeLessThan(2)
  }).toPass()
  await expect(editor.locator('input[value="FOB Busan"]')).toBeVisible()
  await expect(
    page.getByRole("complementary", { name: "거래 현황" })
  ).toHaveCount(0)
  await editor
    .getByRole("button", { name: "상업송장 보유", exact: true })
    .click()
  await editor
    .getByRole("button", { name: "거래로 돌아가기", exact: true })
    .click()
  await expect(editor).toBeHidden()
  await expect(details.locator('input[value="FOB Busan"]')).toBeVisible()
  expect(
    Math.abs(
      (await details.evaluate((el) => el.getBoundingClientRect().top)) - before
    )
  ).toBeLessThan(4)
  await open.click()
  await expect(page.locator("#deal-document-preview")).toContainText(
    "COMMERCIAL INVOICE"
  )
  await page.keyboard.press("Escape")
  await expect(editor).toBeHidden()
})

test("future-stage fields appear only when manually opened and stay available after reload", async ({
  page,
}) => {
  await page.goto("/erp/deals/DL-260707-04")
  await expect(page.locator("#deal-fields-basic")).toBeVisible()
  await expect(page.locator("#deal-fields-shipping")).toHaveCount(0)
  await expect(page.locator("#deal-fields-payment")).toHaveCount(0)
  const rail = page.getByRole("complementary", { name: "거래 현황" })
  await rail
    .getByRole("button", { name: "선적 정보 직접 입력", exact: true })
    .click()
  await expect(page.locator("#deal-fields-shipping")).toBeVisible()
  await expect(rail.locator('[aria-current="step"]')).toContainText("선적")
  await expect(page.locator("#deal-fields-payment")).toHaveCount(0)
  await page.reload()
  await expect(page.locator("#deal-fields-shipping")).toBeVisible()
  await page.goto(route)
  await expect(page.locator("#deal-fields-shipping")).toBeVisible()
  await expect(page.locator("#deal-fields-payment")).toHaveCount(0)
  await page.goto("/erp/deals/DL-260701-09")
  await expect(page.locator("#deal-fields-payment")).toBeVisible()
})

test("finance and order changes update the visible overall information", async ({
  page,
}) => {
  await page.goto(route)
  await page
    .locator('[data-work-section="finance"]')
    .getByRole("button", { name: "직접 입력", exact: true })
    .click()
  await page.getByLabel("원가 금액", { exact: true }).fill("100.01")
  await page.getByRole("button", { name: "원가 추가", exact: true }).click()
  await expect(page.locator("#deal-finance")).toContainText("117,899.99")
  await page.getByRole("button", { name: "미달 마감", exact: true }).click()
  await page
    .getByPlaceholder("미달 마감 또는 취소 사유를 입력하세요")
    .fill("잔여 수량 이월")
  await page.getByRole("button", { name: "변경 적용", exact: true }).click()
  await expect(page.locator("#deal-fulfillment")).toContainText("미달 마감")
})

test("review alerts retain evidence and open the inline document panel", async ({
  page,
}) => {
  await page.goto(route)
  await page.getByRole("button", { name: "확인 항목 펼치기" }).click()
  await expect(page.locator("[data-deal-review-summary]")).toContainText(
    "금액·수량 불일치"
  )
  await page
    .locator("[data-deal-review-summary]")
    .getByRole("button", { name: "금액·수량 불일치 검토하기" })
    .click()
  const dialog = page.getByRole("dialog", { name: "검토 알림", exact: true })
  await expect(dialog).toBeVisible()
  await expect(page.locator("#deal-review-amount_quantity")).toBeFocused()
  await dialog
    .getByRole("button", { name: "문서에서 확인", exact: true })
    .first()
    .click()
  await expect(dialog).toBeHidden()
  await expect(
    page.getByRole("heading", { name: "거래 서류", exact: true })
  ).toBeVisible()
})

test("mobile page and manual stage entry work with blocked storage", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("blocked")
    }
  })
  await page.goto("/erp/deals/DL-260707-04")
  await page
    .getByRole("button", { name: "선적 정보 직접 입력", exact: true })
    .click()
  await expect(page.locator("#deal-fields-shipping")).toBeVisible()
  await page
    .getByRole("region", { name: "거래 상세 정보", exact: true })
    .getByRole("button", { name: "문서와 같이 보며 수정", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: "거래 서류", exact: true })
  ).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(390)
})

test("AI question entry passes the deal context to the existing assistant", async ({
  page,
}) => {
  await page.goto(route)
  await expect(
    page.getByRole("textbox", { name: "이 거래에 대해 질문", exact: true })
  ).toHaveCount(0)
  await page
    .getByRole("button", { name: "AI에게 질문하기", exact: true })
    .click()
  await expect(page).toHaveURL(/\/erp\/ai/)
  await expect(
    page.getByPlaceholder("거래, 문서, 정산에 대해 질문하세요")
  ).toHaveValue("거래 DL-260708-01: ")
  await expect(
    page.getByRole("heading", { name: "어떤 업무를 확인할까요?" })
  ).toBeVisible()
})

test("item table keeps editing and totals while people and notes follow the work", async ({
  page,
}) => {
  await page.goto(route)
  const table = page.getByRole("table", { name: "매입 품목", exact: true })
  await expect(table).toBeVisible()
  await expect(table.getByLabel("품목 1 수량", { exact: true })).toBeVisible()
  const count = await table.locator("tbody tr").count()
  await table
    .getByRole("textbox", { name: "품목 1 수량", exact: true })
    .fill("13")
  await page.keyboard.press("Tab")
  await expect(table.getByLabel("품목 1 금액", { exact: true })).toContainText(
    "1,668,329"
  )
  await page.getByRole("button", { name: "품목 추가", exact: true }).click()
  await expect(table.locator("tbody tr")).toHaveCount(count + 2)
  await table
    .getByRole("button", { name: `품목 ${count / 2 + 1} 삭제`, exact: true })
    .click()
  await expect(table.locator("tbody tr")).toHaveCount(count)
  await page
    .getByRole("region", { name: "거래 상세 정보", exact: true })
    .getByRole("button", { name: "문서와 같이 보며 수정", exact: true })
    .click()
  await expect(
    table.getByRole("textbox", { name: "품목 1 수량", exact: true })
  ).toHaveValue("13")
  await page
    .getByRole("button", { name: "거래로 돌아가기", exact: true })
    .click()
  const people = page.getByRole("region", { name: "관계자", exact: true })
  await expect(people).toBeVisible()
  expect(
    await people.evaluate(
      (el) =>
        !!(
          document.getElementById("deal-finance")!.compareDocumentPosition(el) &
          Node.DOCUMENT_POSITION_FOLLOWING
        )
    )
  ).toBe(true)
  await expect(people.locator("summary")).toHaveCount(0)
})

test("detail fields follow the original order while the right progress card stays unchanged", async ({
  page,
}) => {
  const fieldOrder = () =>
    page
      .locator(
        "#deal-documents section[id^='deal-fields-'], #deal-documents section[data-deal-items]"
      )
      .evaluateAll((nodes) => nodes.map((node) => node.id || "items"))
  await page.goto(route)
  await expect
    .poll(fieldOrder)
    .toEqual([
      "items",
      "deal-fields-basic",
      "deal-fields-terms",
      "deal-fields-shipping",
    ])
  const progress = page
    .getByRole("complementary", { name: "거래 현황" })
    .getByRole("region", { name: "거래 진행 상태", exact: true })
  await expect(progress.locator('li[aria-current="step"]')).toContainText(
    "선적"
  )
  await progress
    .getByRole("button", { name: "결제 정보 직접 입력", exact: true })
    .click()
  const completeOrder = [
    "items",
    "deal-fields-basic",
    "deal-fields-terms",
    "deal-fields-shipping",
    "deal-fields-payment",
  ]
  await expect.poll(fieldOrder).toEqual(completeOrder)
  await page
    .getByRole("region", { name: "거래 상세 정보", exact: true })
    .getByRole("button", { name: "문서와 같이 보며 수정", exact: true })
    .click()
  const editor = page.getByRole("dialog", {
    name: "거래 상세 · 문서 대조",
    exact: true,
  })
  await expect
    .poll(() =>
      editor
        .locator("section[id^='deal-fields-'], section[data-deal-items]")
        .evaluateAll((nodes) => nodes.map((node) => node.id || "items"))
    )
    .toEqual(completeOrder)
  await page.goto("/erp/deals/DL-260701-09")
  await expect.poll(fieldOrder).toEqual(completeOrder)
})

test("table units and document candidate choices remain usable above the contained editor", async ({
  page,
}) => {
  await page.goto(route)
  await page
    .getByRole("region", { name: "거래 상세 정보", exact: true })
    .getByRole("button", { name: "문서와 같이 보며 수정", exact: true })
    .click()
  await page
    .getByRole("combobox", { name: "품목 1 수량 단위", exact: true })
    .click()
  await page.getByRole("option", { name: "KG", exact: true }).click()
  await expect(
    page.getByRole("combobox", { name: "품목 1 수량 단위", exact: true })
  ).toContainText("KG")
  const table = page.getByRole("table", { name: "매입 품목", exact: true })
  await table
    .getByRole("button", { name: "문서별 값 4개", exact: true })
    .click()
  await page.getByRole("button", { name: /PL 4 PackingList_0707.pdf/ }).click()
  await expect(
    table.getByRole("textbox", { name: "품목 2 수량", exact: true })
  ).toHaveValue("4")
})

test("missing information and confirmation alerts have independent lists and resolution", async ({
  page,
}) => {
  await page.goto(route)
  const missing = page.getByRole("region", {
    name: "상세 항목 검토",
    exact: true,
  })
  const confirmation = page.locator("[data-deal-review-summary]")
  await expect(missing).toContainText("검토 필요 3건 · 누락·불일치")
  await expect(missing).toContainText("B/L 번호")
  await expect(confirmation).toContainText("확인 필요 3건")
  await missing.getByRole("button", { name: "검토 항목 펼치기" }).click()
  await expect(page.getByRole("list", { name: "검토 알림 목록" })).toBeHidden()
  await missing
    .getByRole("button", { name: /B\/L 번호 누락.*확인하기/ })
    .click()
  await expect(page.locator("#deal-field-bl_number")).toBeFocused()
  await page.locator("#deal-field-bl_number").fill("BL-2026-0708")
  await page.keyboard.press("Tab")
  await expect(missing).toContainText("검토 필요 2건")
  await expect(confirmation).toContainText("확인 필요 3건")
  await page.goto("/erp/deals/DL-260707-04")
  await expect(
    page.getByRole("region", { name: "거래 전체 정보", exact: true })
  ).toBeVisible()
  await expect(missing).toContainText("검토 필요 2건")
})

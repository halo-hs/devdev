import { expect, test } from "@playwright/test"

test("empty deal table keeps its message visible and left aligned on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/erp/deals")
  await page.getByRole("button", { name: "상세 필터", exact: true }).click()
  await page.getByPlaceholder("거래명, 번호, 거래처, 품목 검색").fill("없는 거래 검색")
  const message = page.getByText("조건에 맞는 거래가 없습니다.", { exact: true })
  await page.getByRole("table", { name: "거래 업무표" }).evaluate(element => element.scrollIntoView({ block: "center", inline: "nearest" }))
  await expect(message).toBeInViewport()
  const bounds = await message.boundingBox()
  expect(bounds).not.toBeNull()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390)
  await expect(message.locator("..")).toHaveCSS("text-align", "left")
})

test("selected deal filters remain visible after details close and can be removed", async ({ page }) => {
  await page.goto("/erp/deals")
  const selected = page.getByLabel("적용된 필터")
  await expect(selected.getByRole("button", { name: "주문 결정: 열림" })).toBeVisible()
  await page.getByRole("button", { name: "상세 필터", exact: true }).click()
  await page.getByRole("combobox", { name: "미확인" }).click()
  await page.getByRole("option", { name: "있음" }).click()
  await page.getByRole("button", { name: "상세 필터", exact: true }).click()
  await expect(selected.getByRole("button", { name: "미확인: 있음" })).toBeVisible()
  await selected.getByRole("button", { name: "미확인: 있음" }).click()
  await expect(selected.getByRole("button", { name: "미확인: 있음" })).toHaveCount(0)
})

test("creation sort sits below the pipeline switch and above the deal table", async ({ page }) => {
  await page.goto("/erp/deals")
  const pipelineSwitch = page.getByRole("button", { name: "영업 파이프라인", exact: true })
  const sort = page.getByRole("combobox", { name: "정렬" })
  const table = page.getByRole("table", { name: "거래 업무표" })
  await expect(sort).toBeVisible()
  expect(await pipelineSwitch.evaluate((element) => Boolean(element.compareDocumentPosition(document.querySelector('[aria-label="정렬"]')) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true)
  expect(await sort.evaluate((element) => Boolean(element.compareDocumentPosition(document.querySelector('[aria-label="거래 업무표"]')) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true)
  await sort.click()
  await page.getByRole("option", { name: "최신 생성순" }).click()
  await expect(table.getByRole("row").nth(1)).toContainText("DL-260803-03")
})

test("sales performance links open deal lists filtered to the selected person or counterparty", async ({ page }) => {
  await page.goto("/erp/deals?lifecycle=all&assignee=%EC%A1%B0%EB%AF%BC%EC%98%81")
  const table = page.getByRole("table", { name: "거래 업무표" })
  await expect(page.getByLabel("적용된 필터").getByRole("button", { name: "담당자: 조민영" })).toBeVisible()
  await expect(table).toContainText("KATAMAN ASIA-PACIFIC PTE LTD")
  await expect(table).not.toContainText("Sakura Logistics KK")
  await page.goto("/erp/deals?lifecycle=all&counterparty=ACME%20GmbH")
  await expect(page.getByLabel("적용된 필터").getByRole("button", { name: "거래처: ACME GmbH" })).toBeVisible()
  await expect(table).toContainText("ACME GmbH")
  await expect(table).not.toContainText("KATAMAN ASIA-PACIFIC PTE LTD")
})

test("list filters ETA and counterparty together, updates counts and retains context in pipeline", async ({
  page,
}) => {
  await page.goto("/erp/deals")
  await expect(page.getByRole("combobox", { name: "정렬" })).toBeVisible()
  await expect(page.getByRole("combobox", { name: "주문 결정" })).toHaveCount(0)
  await expect(page.getByLabel("운영 거래 지표")).toHaveCount(0)
  await page.getByRole("button", { name: "상세 필터", exact: true }).click()
  await expect(page.getByRole("combobox", { name: "주문 결정" })).toBeVisible()
  await expect(page.getByLabel("운영 거래 지표")).toBeVisible()
  const table = page.getByRole("table", { name: "거래 업무표" })
  await expect(table.getByRole("row")).toHaveCount(10)
  await page
    .getByRole("combobox", { name: "거래처", exact: true })
    .selectOption("KATAMAN ASIA-PACIFIC PTE LTD")
  await expect(table.getByRole("row")).toHaveCount(2)
  await expect(
    page.getByRole("region", { name: "주요 거래 지표" })
  ).toContainText("1건")
  await page.getByLabel("기록된 ETA 시작", { exact: true }).fill("2026-08-04")
  await expect(table).toContainText("조건에 맞는 거래가 없습니다")
  await page.getByLabel("기록된 ETA 시작", { exact: true }).fill("2026-08-01")
  await page.getByLabel("기록된 ETA 종료", { exact: true }).fill("2026-08-03")
  await expect(table).toContainText("PO-260704-18.pdf")
  await expect(table).not.toContainText("ACME GmbH")
  await page
    .getByRole("button", { name: "영업 파이프라인", exact: true })
    .click()
  const board = page.getByLabel("영업 파이프라인", { exact: true })
  await expect(board.getByRole("button")).toHaveCount(1)
  const contacts = page.getByRole("region", { name: "연락처·파이프라인" })
  await expect(contacts).toBeVisible()
  await expect(contacts.getByRole("heading", { name: "관련 Deal" })).toBeVisible()
  await expect(contacts.getByRole("heading", { name: "활동 이력" })).toBeVisible()
  expect(await board.evaluate((element) => element.compareDocumentPosition(document.querySelector('[aria-label="연락처·파이프라인"]')) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy()
  const headings = await contacts.locator("h2").allTextContents()
  expect(headings.indexOf("관련 Deal")).toBeLessThan(headings.indexOf("활동 이력"))
  await page.getByRole("button", { name: "업무표로 보기", exact: true }).click()
  await expect(table.getByRole("row")).toHaveCount(2)
  await page.getByRole("button", { name: "전체 해제", exact: true }).click()
  await expect(table.getByRole("row")).toHaveCount(11)
  await page
    .getByRole("region", { name: "주요 거래 지표" })
    .getByRole("button", { name: "연체 거래 보기" })
    .click()
  await expect(table.getByRole("row")).toHaveCount(2)
  await expect(table).toContainText("Meridian Metals")
})

test("keyboard finance action opens finance directly and mobile keeps overflow within the table", async ({
  page,
}) => {
  await page.goto("/erp/deals")
  await page.getByRole("button", { name: "상세 필터", exact: true }).click()
  await page
    .getByPlaceholder("거래명, 번호, 거래처, 품목 검색")
    .fill("KATAMAN")
  const action = page
    .getByRole("table", { name: "거래 업무표" })
    .getByRole("button", { name: "금융 상세 열기" })
  await action.focus()
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/\/erp\/deals\/DL-260708-01/)
  await expect(page.locator("#deal-finance")).toBeInViewport()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/erp/deals")
  await page.getByRole("button", { name: "상세 필터", exact: true }).click()
  const table = page.getByRole("table", { name: "거래 업무표" })
  await expect(table).toBeAttached()
  const overflow = await table.evaluate((element) => ({
    page: document.documentElement.scrollWidth > window.innerWidth,
    own:
      element.parentElement!.scrollWidth > element.parentElement!.clientWidth,
  }))
  expect(overflow).toEqual({ page: false, own: true })
  await page.getByLabel("기록된 ETA 종료", { exact: true }).fill("2026-07-02")
  await expect(table.getByRole("row")).toHaveCount(2)
  await expect(table).toContainText("Hanbit Trading")
})

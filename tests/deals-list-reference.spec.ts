import { expect, test } from "@playwright/test"

test("list filters ETA and counterparty together, updates counts and retains context in pipeline", async ({
  page,
}) => {
  await page.goto("/erp/deals")
  await page.getByRole("button", { name: "상세 필터", exact: true }).click()
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

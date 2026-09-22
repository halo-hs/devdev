import { test, expect, type Page } from "@playwright/test"

async function openSection(page: Page, name: string) {
  const editor = page.getByRole("dialog", {
    name: "거래 상세 · 문서 대조",
    exact: true,
  })
  if (await editor.count())
    await editor
      .getByRole("button", { name: "거래로 돌아가기", exact: true })
      .click()
  if (name === "상세") {
    const section = page.getByRole("region", {
      name: "거래 상세 정보",
      exact: true,
    })
    const open = section.getByRole("button", {
      name: "문서와 같이 보며 수정",
      exact: true,
    })
    await expect(open).toBeVisible()
    await open.click()
    return
  }
  if (name === "관계자") {
    await page.locator("#deal-people").scrollIntoViewIfNeeded()
    return
  }
  const label =
    name === "요약"
      ? "거래 요약"
      : `${name === "주문·선적" ? "선적" : name} 구간으로 이동`
  await page
    .getByRole("navigation", { name: "거래 정보 바로가기" })
    .getByRole("link", { name: label, exact: true })
    .click()
  const planned = page.locator(
    `[data-work-section="${name === "정산" ? "finance" : "fulfillment"}"][data-work-state="planned"]`
  )
  if (await planned.count())
    await planned
      .getByRole("button", { name: "직접 입력", exact: true })
      .click()
}
import {
  calculateDealFinance,
  initialDealCosts,
  isValidCostAmount,
  csvCell,
} from "../trade-os/lib/deal-finance-workspace"

test("costs use exact decimals, currency buckets and exclude already-in-price costs", () => {
  const costs = initialDealCosts("DL-260708-01")
  expect(calculateDealFinance("DL-260708-01", costs)[0]).toMatchObject({
    landed_cost_amount: "48000",
    adjusted_gp_amount: "118000",
  })
  expect(
    calculateDealFinance("DL-260708-01", [
      ...costs,
      { ...costs[0], id: "new", amount: "0.01" },
    ])[0].adjusted_gp_amount
  ).toBe("117999.99")
  expect(
    calculateDealFinance("DL-260708-01", [
      ...costs,
      { ...costs[0], id: "new", currency: "CNY", amount: "0.01" },
    ])[2]
  ).toMatchObject({
    currency: "CNY",
    landed_cost_amount: "0.01",
    adjusted_gp_amount: undefined,
  })
  expect(calculateDealFinance("other", [])).toEqual([])
  expect(isValidCostAmount("100.123")).toBe(false)
  expect(isValidCostAmount("-1")).toBe(false)
  expect(isValidCostAmount("0.00")).toBe(true)
  expect(csvCell('a,"b"')).toBe('"a,""b"""')
})

test("list has source amounts and finance view with retained search and direct detail navigation", async ({
  page,
}) => {
  await page.goto("/erp/deals")
  await expect(page.getByRole("table", { name: "거래 업무표" })).toContainText(
    "PO-260704-18.pdf"
  )
  await page
    .getByPlaceholder("거래명, 번호, 거래처, 품목 검색")
    .fill("KATAMAN")
  await page.getByRole("tab", { name: "금융", exact: true }).click()
  const table = page.getByRole("table", { name: "거래 재무 보기" })
  await expect(table).toContainText("USD 2,566,000.00")
  await expect(table).toContainText("USD 118,000.00")
  await expect(table).toContainText("EUR 18,000.00")
  await expect(table).not.toContainText("ACME")
  await table
    .getByRole("button", { name: "거래 금융", exact: true })
    .first()
    .click()
  await expect(page.locator("#deal-finance")).toBeVisible()
  await expect(
    page.getByRole("table", { name: "원가 계산 내역" })
  ).toBeVisible()
})

test("cost draft previews live, cancel reverts, saved costs survive tabs/reload and update list", async ({
  page,
}) => {
  await page.goto("/erp/deals/DL-260708-01")
  await openSection(page, "정산")
  const economics = page.getByTestId("economics-USD")
  await expect(economics).toContainText("USD 118,000.00")
  await expect(page.getByLabel("원가 메모", { exact: true })).toBeVisible()
  await page.getByLabel("원가 금액", { exact: true }).fill("100.01")
  await expect(economics).toContainText("USD 117,899.99")
  await expect(
    page.getByRole("table", { name: "통화별 원가 손익" })
  ).toContainText("USD 118,000.00")
  await page
    .getByRole("form", { name: "원가 추가" })
    .getByRole("button", { name: "입력 비우기", exact: true })
    .click()
  await expect(economics).toContainText("USD 118,000.00")
  await expect(page.getByLabel("원가 메모", { exact: true })).toBeVisible()
  await page.getByLabel("원가 금액", { exact: true }).fill("100.001")
  await expect(
    page.getByRole("button", { name: "원가 추가", exact: true })
  ).toBeDisabled()
  await page.getByLabel("원가 금액", { exact: true }).fill("100.01")
  await page.getByRole("button", { name: "원가 추가", exact: true }).click()
  await expect(page.getByLabel("원가 금액", { exact: true })).toHaveValue("")
  await expect(page.getByLabel("원가 메모", { exact: true })).toBeVisible()
  await expect(
    page.getByRole("table", { name: "통화별 원가 손익" })
  ).toContainText("USD 117,899.99")
  await page.reload()
  await expect(
    page.getByRole("table", { name: "통화별 원가 손익" })
  ).toContainText("USD 117,899.99")
  await page.goto("/erp/deals")
  await page.getByRole("tab", { name: "금융", exact: true }).click()
  await expect(
    page.getByRole("table", { name: "거래 재무 보기" })
  ).toContainText("USD 117,899.99")
})

test("document creation starts with templates and upload describes explicit confirmation", async ({
  page,
}) => {
  await page.goto("/erp/documents/create?state=first-use")
  await expect(
    page.getByRole("heading", { name: "문서 만들기", exact: true })
  ).toBeVisible()
  await expect(page.getByRole("textbox")).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: /상업송장/ }).first()
  ).toBeVisible()
  await page.goto("/erp/documents/upload")
  await expect(
    page.getByRole("list", { name: "문서 처리 순서" })
  ).toContainText("거래 연결·확정")
})

test("editing an included cost previews correctly and deleting restores totals", async ({
  page,
}) => {
  await page.goto("/erp/deals/DL-260708-01")
  await openSection(page, "정산")
  await page
    .getByRole("button", { name: "보험 원가 수정", exact: true })
    .click()
  await page.getByLabel("원가 반영 기준", { exact: true }).click()
  await page.getByRole("option", { name: "가산", exact: true }).click()
  await expect(page.getByTestId("economics-USD")).toContainText(
    "USD 111,800.00"
  )
  await page.getByRole("button", { name: "변경 저장", exact: true }).click()
  await expect(
    page.getByRole("table", { name: "통화별 원가 손익" })
  ).toContainText("USD 111,800.00")
  await page
    .getByRole("button", { name: "보험 원가 삭제", exact: true })
    .click()
  await page
    .getByRole("button", { name: "원가 삭제 확인", exact: true })
    .click()
  await expect(
    page.getByRole("table", { name: "원가 계산 내역" })
  ).not.toContainText("보험")
  await expect(page.getByTestId("economics-USD")).toContainText(
    "USD 118,000.00"
  )
})

test("operational menus render and shipment chips preserve empty-state filtering", async ({
  page,
}) => {
  for (const [route, title] of [
    ["shipments", "선적"],
    ["settlement", "정산"],
    ["monitoring", "운영 감시"],
    ["reports", "결산 리포트"],
    ["sales", "영업 성과"],
  ]) {
    await page.goto(`/erp/${route}`)
    await expect(
      page.getByRole("heading", { name: title, exact: true })
    ).toBeVisible()
    await expect(
      page.getByText("선적 반영 대기 문서 검토", { exact: false })
    ).toHaveCount(0)
    await expect(
      page.getByRole("region", { name: "거래처별 잔액과 검증 상태" })
    ).toHaveCount(0)
    await expect(
      page.getByText("청구서와 정산 일정 연결 현황", { exact: true })
    ).toHaveCount(0)
    await expect(page.getByText("집계 근거 보기", { exact: true })).toHaveCount(
      0
    )
    if (route === "settlement") {
      await expect(
        page.getByRole("combobox", { name: "정산 상태 필터" })
      ).toBeVisible()
    } else {
      await expect(
        page.locator('[data-slot="business-page-filters"], [data-slot="analytics-filter-bar"], [role="group"][aria-label="선적 상태"]').first()
      ).toBeVisible()
    }
  }
  await page.goto("/erp/shipments")
  const chips = page.getByRole("group", { name: "선적 상태" })
  await chips.getByRole("button", { name: /^지연/ }).click()
  await expect(chips.getByRole("button", { name: /^지연/ })).toHaveAttribute(
    "aria-pressed",
    "true"
  )
  await page
    .getByPlaceholder("거래번호·거래명·B/L·컨테이너·항구·선박 검색")
    .fill("no-such-shipment")
  await expect(
    page.getByText("검색 조건에 맞는 선적이 없습니다.", { exact: true })
  ).toBeVisible()
})

test("finance filters select currency buckets, unknown results and directional balances", async ({
  page,
}) => {
  await page.goto("/erp/deals")
  await expect(
    page.getByRole("tab", { name: "운영", exact: true })
  ).toHaveAttribute("aria-selected", "true")
  await page.getByRole("tab", { name: "금융", exact: true }).click()
  await page.getByRole("combobox", { name: "금융 통화", exact: true }).click()
  await page.getByRole("option", { name: "EUR", exact: true }).click()
  const table = page.getByRole("table", { name: "거래 재무 보기" })
  await expect(table).toContainText("EUR 18,000.00")
  await expect(table).not.toContainText("USD")
  await page.getByRole("combobox", { name: "손익 상태", exact: true }).click()
  await page.getByRole("option", { name: "흑자", exact: true }).click()
  await expect(table).toContainText("조건에 맞는 거래가 없습니다.")
  await page.getByRole("button", { name: "전체 해제", exact: true }).click()
  await page.getByRole("combobox", { name: "정산 잔액", exact: true }).click()
  await page.getByRole("option", { name: "받을 돈 있음", exact: true }).click()
  await expect(table).toContainText("ACME GmbH")
  await expect(table).not.toContainText("KATAMAN")
  await page.getByRole("tab", { name: "운영", exact: true }).click()
  await expect(page.getByRole("table", { name: "거래 업무표" })).toContainText(
    "KATAMAN"
  )
})

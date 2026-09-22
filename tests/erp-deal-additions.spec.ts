import { expect, test, type Page } from "@playwright/test"

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

async function openDeal(page: Page, tab: string) {
  await page.goto("/erp/deals/DL-260708-01")
  await openSection(page, tab)
}
async function choose(page: Page, name: string, option: string) {
  await page.getByRole("combobox", { name, exact: true }).click()
  await page.getByRole("option", { name: option, exact: true }).click()
}

test("document workspace omits unrequested relation and deadline actions", async ({
  page,
}) => {
  await openDeal(page, "상세")
  await expect(page.getByRole("tab")).toHaveCount(0)
  await expect(page.getByRole("button", { name: /^품목 관계/ })).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: /^서류 준비 기한/ })
  ).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "상업송장 보유", exact: true })
  ).toBeVisible()
})

test("party master binding can link, change and unlink without changing the document name", async ({
  page,
}) => {
  await openDeal(page, "관계자")
  await page
    .getByRole("button", { name: "매도자 등록 거래처 연결", exact: true })
    .click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("변경 사유").fill("등록번호와 문서 이름 대조")
  await dialog.getByRole("button", { name: "거래처 연결 저장" }).click()
  await expect(dialog).toContainText("현재 연결: KATAMAN ASIA-PACIFIC PTE LTD")
  await choose(page, "등록 거래처 후보", "KATAMAN Australia")
  await dialog.getByLabel("변경 사유").fill("법인 확인 후 정정")
  await dialog.getByRole("button", { name: "거래처 연결 저장" }).click()
  await expect(dialog).toContainText("현재 연결: KATAMAN Australia")
  await choose(page, "등록 거래처 후보", "연결 해제")
  await dialog.getByLabel("변경 사유").fill("재검토 필요")
  await dialog
    .getByRole("button", { name: "거래처 연결 해제", exact: true })
    .click()
  await expect(dialog).toContainText("현재 연결: 미연결")
  await expect(dialog).toContainText(
    "문서상 이름: KATAMAN ASIA-PACIFIC PTE LTD"
  )
  await dialog.locator("summary").click()
  await expect(dialog).toContainText("변경 이력 (3)")
})

test("contract evidence and settlement candidates do not change shipment or cash records", async ({
  page,
}) => {
  await openDeal(page, "주문·선적")
  await page.getByRole("button", { name: "품목별 수량" }).click()
  await expect(page.getByRole("dialog")).toContainText(
    "계약 20 MT / 포장명세 16 MT"
  )
  await page.keyboard.press("Escape")
  await openSection(page, "정산")
  const claim = page.getByRole("region", {
    name: "청구 일정 대조",
    exact: true,
  })
  await expect(claim).toBeVisible()
  await expect(claim).toContainText("AP-260716-01")
  await expect(claim).toContainText("다른 거래 · 연결 불가")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await page.getByRole("button", { name: "정산에서 일정 확인" }).click()
  await expect(page).toHaveURL(/\/erp\/settlement$/)
  await page.goBack()
  await expect(page.locator("#deal-finance")).toBeVisible()
})

test("member can inspect document fields and party tools without mutation controls", async ({
  page,
}) => {
  await page.goto("/erp/deals/DL-260708-01")
  await page
    .locator('[data-slot="dropdown-menu-trigger"][aria-label="더보기"]')
    .click()
  await page.getByRole("menuitem", { name: "멤버 화면", exact: true }).click()
  await openSection(page, "상세")
  await expect(page.getByText("보기 전용", { exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: /^품목 관계/ })).toHaveCount(0)
  await openSection(page, "관계자")
  await page
    .getByRole("button", { name: "매도자 등록 거래처 연결", exact: true })
    .click()
  await expect(
    page.getByRole("combobox", { name: "등록 거래처 후보" })
  ).toBeDisabled()
  await expect(
    page.getByRole("button", { name: "거래처 연결 저장" })
  ).toHaveCount(0)
})

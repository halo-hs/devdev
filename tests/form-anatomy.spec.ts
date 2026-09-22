import { expect, test } from "@playwright/test"

const invoice = `/erp/documents/upload/${encodeURIComponent("인보이스_2607_003.pdf")}/review`

for (const width of [390, 1440]) {
  test(`review labels, statuses and source controls stay above inputs at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(invoice)
    const fields = page.getByRole("region", { name: "항목 점검" })
    const field = fields.locator('[data-upload-field="buyer"]')
    const input = field.getByRole("textbox", { name: "Buyer", exact: true })
    await input.fill("검토 거래처")
    const geometry = await field.evaluate((node) => {
      const box = (selector: string) =>
        node.querySelector(selector)!.getBoundingClientRect()
      const header = box('[data-slot="form-field-header"]')
      const control = box("input")
      const message = box('[data-slot="form-field-message"]')
      const source = box('[data-slot="form-field-source"]')
      const rightAligned = Math.abs(source.right - header.right) < 2
      return {
        rightAligned,
        inputBelow: control.top >= header.bottom,
        messageBelow: message.top >= control.bottom,
        overflow: node.scrollWidth > node.clientWidth + 1,
      }
    })
    expect(geometry).toEqual({
      rightAligned: true,
      inputBelow: true,
      messageBelow: true,
      overflow: false,
    })
    await field
      .getByRole("button", { name: "Buyer 원본 보기", exact: true })
      .click()
    await expect(page.getByRole("region", { name: "PDF 원문" })).toBeVisible()
    if (width < 768) {
      await expect(fields).toBeHidden()
      await page.getByRole("button", { name: "필드 검토", exact: true }).click()
    }
    await expect(input).toHaveValue("검토 거래처")
  })
}

test("deal value picker follows the badge and selection updates the editable value", async ({
  page,
}) => {
  await page.goto("/erp/deals/DL-260701-09")
  const field = page
    .locator("[data-form-field]")
    .filter({ has: page.locator('[data-slot="form-field-candidates"]') })
    .first()
  await expect(field).toBeVisible()
  expect(
    await field
      .locator('[data-slot="form-field-header"]')
      .evaluate((node) =>
        [...node.children].map((child) => child.getAttribute("data-slot"))
      )
  ).toEqual(["field-label", "form-field-status", "form-field-actions"])
  const inputId = await field.locator("input").getAttribute("id")
  await field.getByRole("button", { name: /문서별 값/ }).click()
  const choice = page.getByRole("button").filter({ hasText: "다른 값" }).first()
  await expect(choice).toBeVisible()
  const value = await choice.locator("span.block.text-xs").textContent()
  await choice.click()
  await expect(page.locator(`[id="${inputId}"]`)).toHaveValue(value!)
})

test("creation omits missing sources, then opens explicit candidate controls after applying a source", async ({ page }) => {
  await page.goto("/erp/documents/create")
  await page.getByRole("button", { name: /SC.*판매계약서/ }).click()
  await page.getByRole("region", { name: "문서 폼 선택", exact: true }).getByRole("button", { name: "문서 만들기", exact: true }).click()
  const field = page.locator('[data-review-key="buyer_name"]')
  await expect(field.locator('[data-slot="form-field-actions"]')).toHaveCount(0)
  await page.getByRole("tab", { name: /거래/ }).click()
  await page.getByRole("button", { name: /DL-260708-01/ }).click()
  await page.getByRole("button", { name: "항목에 반영", exact: true }).click()
  const input = field.locator("input")
  const originalValue = await input.inputValue()
  await input.fill("직접 수정")
  await expect(page.getByRole("button", { name: /거래값 사용/ })).toHaveCount(0)
  await field.getByRole("button", { name: /후보 값 선택/ }).click()
  await page.getByRole("button", { name: /거래값 사용/ }).click()
  await expect(input).toHaveValue(originalValue)
  await expect(page.getByRole("button", { name: /거래값 사용/ })).toHaveCount(0)
  expect(await field.locator('[data-slot="form-field-actions"]').evaluate(node => [...node.children].map(child => child.getAttribute('data-slot')))).toEqual(['form-field-candidates', 'form-field-source'])
  await field.getByRole("button", { name: /원본 보기/ }).click()
  await expect(page.locator('[data-create-source-panel]')).toBeFocused()
})

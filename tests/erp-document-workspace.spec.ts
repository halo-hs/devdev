import { expect, test } from "@playwright/test"

const invoice = `/erp/documents/upload/${encodeURIComponent("인보이스_2607_003.pdf")}/review`
const bank = `/erp/documents/upload/${encodeURIComponent("은행거래내역서_2026-08-27.pdf")}/connect`

for (const width of [1024, 1200, 1440]) {
  test(`upload opens review left and PDF right at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(invoice)
    const fields = page.getByRole("region", { name: "항목 점검" })
    const pdf = page.getByRole("region", { name: "PDF 원문" })
    await expect(fields).toBeVisible()
    await expect(pdf).toBeVisible()
    const left = (await fields.boundingBox())!
    const right = (await pdf.boundingBox())!
    expect(left.width).toBeGreaterThan(250)
    expect(right.x).toBeGreaterThanOrEqual(left.x + left.width)
    expect(right.height).toBeGreaterThan(400)
    await expect(pdf.getByText("INVOICE", { exact: true }).first()).toBeVisible()
    await page.reload()
    await expect(pdf).toBeVisible()
  })
}

test("connecting a document keeps its PDF beside the deal selection", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(bank)
  const pdf = page.getByRole("region", { name: "PDF 원문" })
  await expect(pdf).toBeVisible()
  await expect(page.getByRole("button", { name: "항목 검토", exact: true })).toBeVisible()
  await page.getByRole("button", { name: "항목 검토", exact: true }).click()
  await expect(page.getByRole("region", { name: "항목 점검" })).toBeVisible()
  await expect(pdf).toBeVisible()
})

test("mobile review switches to PDF and retains the entered field", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(invoice)
  const fields = page.getByRole("region", { name: "항목 점검" })
  const input = fields.locator("input").first()
  await input.fill("검토 거래처")
  await page.getByRole("button", { name: "PDF 보기", exact: true }).click()
  const pdf = page.getByRole("region", { name: "PDF 원문" })
  await expect(pdf).toBeVisible()
  await expect(fields).toBeHidden()
  await pdf.getByRole("button", { name: "필드 검토", exact: true }).click()
  await expect(input).toHaveValue("검토 거래처")
})

test("create adds and deletes individual items without losing other rows", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto("/erp/documents/create")
  await expect(page.getByRole("region", { name: "문서 폼 선택", exact: true }).getByRole("button", { name: "문서 만들기", exact: true })).toBeDisabled()
  await page.getByRole("button", { name: /QT.*견적서/ }).click()
  await page.getByRole("region", { name: "문서 폼 선택", exact: true }).getByRole("button", { name: "문서 만들기", exact: true }).click()
  const first = page.getByRole("textbox", { name: "품목 1 품목명", exact: true })
  await first.fill("Aluminium A")
  const add = page.getByRole("button", { name: "품목 추가", exact: true })
  await expect(add).toBeVisible()
  await add.click()
  const second = page.getByRole("textbox", { name: "품목 2 품목명", exact: true })
  await expect(second).toBeFocused()
  await second.fill("Copper B")
  await page.getByRole("spinbutton", { name: "품목 2 수량", exact: true }).fill("2")
  await page.getByRole("spinbutton", { name: "품목 2 단가", exact: true }).fill("100")
  await expect(page.getByRole("cell", { name: "200 USD", exact: true })).toBeVisible()
  await page.getByRole("button", { name: "품목 1 삭제", exact: true }).click()
  await expect(first).toHaveValue("Copper B")
  await expect(page.getByRole("textbox", { name: /품목 \d+ 품목명/ })).toHaveCount(1)
  await page.getByRole("button", { name: "전체 삭제", exact: true }).click()
  await expect(page.getByRole("textbox", { name: /품목 \d+ 품목명/ })).toHaveCount(0)
  await expect(add).toBeVisible()
  await add.click()
  await expect(first).toHaveValue("")
  await expect(page.getByRole("textbox", { name: /품목 \d+ 품목명/ })).toHaveCount(1)
})

test("upload header lists blockers, focuses labels and excludes advisory warnings", async ({ page }) => {
  await page.goto(invoice)
  const next = page.getByRole("button", { name: "거래 연결", exact: true })
  await expect(next).toBeDisabled()
  await page.getByRole("button", { name: "검토 필요 2건", exact: true }).click()
  await page.getByRole("button", { name: "결제 예정일 · 필수값 누락", exact: true }).click()
  const due = page.locator('[data-upload-field="payment_due_date"] input')
  await expect(due).toBeFocused()
  await due.fill("2026-10-20")
  await due.blur()
  await expect(page.getByRole("button", { name: "검토 필요 1건", exact: true })).toBeVisible()
  await expect(next).toBeDisabled()
  const quantity = page.getByRole("textbox", { name: "수량 단위 입력", exact: true })
  await quantity.fill("BOX")
  await quantity.blur()
  await expect(next).toBeEnabled()
  await expect(page.getByRole("button", { name: /검토 필요 \d+건|확인 필요 \d+건/ })).toHaveCount(0)
  // The advisory OCR price warning remains in context but does not disable progress.
  await expect(page.locator('[data-upload-field="unit_price"]')).toContainText("확인 필요")
})

test("create header counts actual missing and invalid values and navigates to the selected item", async ({ page }) => {
  await page.goto("/erp/documents/create")
  await page.getByRole("button", { name: /QT.*견적서/ }).click()
  await page.getByRole("region", { name: "문서 폼 선택", exact: true }).getByRole("button", { name: "문서 만들기", exact: true }).click()
  await page.getByRole("button", { name: "검토 필요 7건", exact: true }).click()
  await page.getByRole("button", { name: "품목 1 수량 · 필수값 누락", exact: true }).click()
  const quantity = page.getByRole("spinbutton", { name: "품목 1 수량", exact: true })
  await expect(quantity).toBeFocused()
  await quantity.fill("2")
  await expect(page.getByRole("button", { name: "검토 필요 6건", exact: true })).toBeVisible()
  await quantity.fill("-1")
  await page.getByRole("button", { name: "검토 필요 7건", exact: true }).click()
  await expect(page.getByRole("button", { name: "품목 1 수량 · 0 이상의 숫자를 입력하세요", exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "문서 초안 만들기", exact: true })).toBeDisabled()
})

test("upload connection only lists outstanding mandatory choices", async ({ page }) => {
  await page.goto(bank)
  await page.getByRole("button", { name: "확인 필요 1건", exact: true }).click()
  await expect(page.getByRole("button", { name: "연결할 거래 선택", exact: true })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("button", { name: "선택한 거래 연결", exact: true })).toBeDisabled()
  await page.getByRole("radio", { name: /DL-260704-02/ }).click()
  await page.getByRole("button", { name: "확인 필요 1건", exact: true }).click()
  await expect(page.getByRole("button", { name: "결제 일정 또는 서류만 연결 선택", exact: true })).toBeVisible()
  await page.keyboard.press("Escape")
  await page.getByRole("radio", { name: /서류만 연결/ }).check()
  await expect(page.getByRole("button", { name: /검토 필요 \d+건|확인 필요 \d+건/ })).toHaveCount(0)
  await expect(page.getByRole("button", { name: "선택한 거래 연결", exact: true })).toBeEnabled()
})

test("create source fields show discrepancy blockers before PDF review", async ({ page }) => {
  await page.goto("/erp/documents/create")
  await page.getByRole("button", { name: /SC.*판매계약서/ }).click()
  await page.getByRole("region", { name: "문서 폼 선택", exact: true }).getByRole("button", { name: "문서 만들기", exact: true }).click()
  await page.getByRole("tab", { name: /거래/ }).click()
  await page.getByRole("button", { name: /DL-260708-01/ }).click()
  await page.getByRole("button", { name: "항목에 반영", exact: true }).click()
  const buyer = page.locator('[data-review-key="buyer_name"] input')
  await buyer.fill("Different buyer")
  await buyer.blur()
  await expect(buyer).toHaveAttribute("aria-invalid", "true")
  await expect(page.getByRole("button", { name: "문서 초안 만들기", exact: true })).toBeDisabled()
  await page.getByRole("button", { name: "검토 필요 1건", exact: true }).click()
  await page.getByRole("button", { name: "매수인 · 점검 불일치", exact: true }).click()
  await expect(buyer).toBeFocused()
  await buyer.fill("KATAMAN ASIA-PACIFIC PTE LTD")
  await buyer.blur()
  await expect(page.getByRole("button", { name: /검토 필요 \d+건/ })).toHaveCount(0)
  await expect(buyer).not.toHaveAttribute("aria-invalid", "true")
})

test("create allows a valid manually entered draft without applying source content", async ({ page }) => {
  await page.goto("/erp/documents/create")
  await page.getByRole("button", { name: /SC.*판매계약서/ }).click()
  await page.getByRole("region", { name: "문서 폼 선택", exact: true }).getByRole("button", { name: "문서 만들기", exact: true }).click()
  const create = page.getByRole("button", { name: "문서 초안 만들기", exact: true })
  await expect(create).toBeDisabled()
  for (const [key, value] of Object.entries({
    seller_name: "ECOYA Demo Co.",
    buyer_name: "Manual buyer",
    contract_number: "SC-MANUAL-001",
    contract_date: "2026-09-18",
    currency: "USD",
  })) {
    await page.locator(`[data-review-key="${key}"] input`).fill(value)
  }
  await page.getByRole("textbox", { name: "품목 1 품목명", exact: true }).fill("Manual item")
  const quantity = page.getByRole("spinbutton", { name: "품목 1 수량", exact: true })
  await quantity.fill("24")
  await page.getByRole("spinbutton", { name: "품목 1 단가", exact: true }).fill("120000")
  await expect(create).toBeEnabled()
  await expect(page.getByRole("button", { name: /검토 필요 \d+건|확인 필요 \d+건/ })).toHaveCount(0)
  // Source content is optional even if an unapplied request has been entered.
  await page.locator('[data-document-requirement="source"] textarea').fill("반영하지 않은 요청")
  await expect(create).toBeEnabled()
  await quantity.fill("-1")
  await expect(create).toBeDisabled()
  await quantity.fill("24")
  await quantity.blur()
  await expect(create).toBeEnabled()
  await create.click()
  await expect(page.getByRole("button", { name: "항목 수정", exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "문서 확정", exact: true })).toBeDisabled()
})

import { expect, test } from "@playwright/test"
import {
  exactDocumentMoneyTotals,
  exactLineItemAmount,
} from "../trade-os/lib/document-money"
import { presentFinanceFact } from "../trade-os/lib/erp-finance"
import {
  bankCashValidation,
  bankScheduleFixtures,
  eligibleBankSchedules,
} from "../trade-os/lib/erp-document-workflow"

test("document totals retain cents beyond Number precision and round each row", () => {
  expect(exactLineItemAmount("3", "0.335")).toBe("1.01")
  expect(exactLineItemAmount("1", "9007199254740993.01")).toBe(
    "9007199254740993.01"
  )
  expect(
    exactDocumentMoneyTotals(
      [
        { quantity: "1", unit_price: "1.005" },
        { quantity: "1", unit_price: "1.005" },
      ],
      { freightCharge: "0.10", insuranceCharge: "0.20", discount: "0.01" }
    )
  ).toEqual({ subtotal: "2.02", grandTotal: "2.31" })
  expect(exactLineItemAmount("2", "1.234,56")).toBe("2469.12")
})

test("finance preserves separate receivables/payables and distinguishes unknown from zero", () => {
  const fact = {
    currency: "USD",
    revenue_amount: "9007199254740993.01",
    receivable_outstanding_amount: "0",
    payable_outstanding_amount: "42.1234",
    adjusted_gp_amount: "10",
    paid_amount: "999",
    outstanding_amount: "999",
  }
  expect(presentFinanceFact(fact)).toMatchObject({
    invoiceSales: "USD 9,007,199,254,740,993.01",
    receivable: "USD 0.00",
    payable: "USD 42.1234",
    received: "—",
    paid: "—",
  })
  expect(
    presentFinanceFact({
      ...fact,
      handoff_blockers: ["missing_payment_schedule", "missing_cost_basis"],
    })
  ).toMatchObject({
    receivable: "—",
    payable: "—",
    adjustedResult: "—",
    invoicePurchases: "—",
  })
})

test("bank schedules require matching deal, currency, direction and open status", () => {
  const schedules = [
    ...bankScheduleFixtures,
    { ...bankScheduleFixtures[0], id: "closed", status: "closed" },
    {
      ...bankScheduleFixtures[0],
      id: "pending",
      direction: "direction_pending" as const,
    },
    { ...bankScheduleFixtures[0], id: "other-currency", currency: "EUR" },
  ]
  expect(
    eligibleBankSchedules(schedules, "DL-260707-04", "USD").map(
      (item) => item.id
    )
  ).toEqual(["receivable-2026-08-31"])
  expect(eligibleBankSchedules(schedules, "DL-260704-02", "EUR")).toEqual([])
  const input = {
    scheduleId: "receivable-2026-08-31",
    amount: "100.01",
    currency: "USD",
    valueDate: "2026-09-17",
  }
  expect(bankCashValidation(input, schedules)).toBeNull()
  for (const patch of [
    { amount: "0" },
    { amount: "-1" },
    { amount: "380000.01" },
    { valueDate: "2026-02-30" },
    { currency: "EUR" },
  ]) {
    expect(bankCashValidation({ ...input, ...patch }, schedules)).not.toBeNull()
  }
})

const documentPath = (name: string, step = "review") =>
  `/erp/documents/upload/${encodeURIComponent(name)}/${step}`
const bankName = "은행거래내역서_2026-08-27.pdf"

test("all PO required fields must be valid, and edited values survive reload", async ({
  page,
}) => {
  await page.goto("/erp/documents/upload")
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: "PO-260704-18.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\nPO sample\n%%EOF"),
    })
  const fields = page.getByRole("region", { name: "항목 점검" })
  await expect(fields).toBeVisible()
  const price = fields.getByRole("spinbutton", { name: "단가", exact: true })
  const etd = fields.getByLabel("Target ETD", { exact: true })
  await expect(price).toBeVisible()
  const next = page.getByRole("button", { name: "거래 연결", exact: true })
  await expect(next).toBeDisabled()
  await price.fill("12.34")
  await price.blur()
  await expect(next).toBeDisabled()
  await etd.fill("2026-09-20")
  await etd.blur()
  await expect(next).toBeEnabled()
  await price.fill("")
  await price.blur()
  await expect(next).toBeDisabled()
  await price.fill("12.34")
  await price.blur()
  await expect(next).toBeEnabled()
  await page.reload()
  await expect(fields.locator('input[type="number"]')).toHaveValue("12.34")
  const stored = await page.evaluate(() =>
    JSON.parse(
      localStorage.getItem(
        "ecoya-prototype-document-review-v2:PO-260704-18.pdf"
      )!
    )
  )
  expect(stored.status).toBe("review")
  expect(stored.fields.unit_price.value).toBe("12.34")
})

test("edited bank values reach connection; no foreign-currency schedules appear", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(documentPath(bankName))
  const fields = page.getByRole("region", { name: "항목 점검" })
  const party = fields.locator("input").last()
  await party.fill("Nordic Raw Materials AB")
  await party.blur()
  const next = page.getByRole("button", { name: "거래 연결", exact: true })
  await expect(next).toBeEnabled()
  await next.click()
  await expect(
    page.getByText("Nordic Raw Materials AB", { exact: true }).first()
  ).toBeVisible()
  await page.getByRole("radio", { name: /DL-260704-02/ }).click()
  await expect(page.getByRole("radio", { name: /받을 돈/ })).toHaveCount(0)
  await page.getByRole("radio", { name: /서류만 연결/ }).check()
  await page
    .getByRole("button", { name: "선택한 거래 연결", exact: true })
    .click()
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(
            localStorage.getItem(
              "ecoya-prototype-document-review-v2:은행거래내역서_2026-08-27.pdf"
            ) ?? "{}"
          ).status
      )
    )
    .toBe("committed")
  expect(
    await page.evaluate(() =>
      localStorage.getItem("ecoya-prototype-bank-cash-v1")
    )
  ).toBeNull()
})

test("bank cash records the chosen amount once and is visible in Settlement", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(documentPath(bankName, "connect"))
  await page.getByRole("radio", { name: /DL-260707-04/ }).click()
  await expect(
    page.getByRole("radio", { name: /받을 돈.*620,000/ })
  ).toHaveCount(0)
  await page.getByRole("radio", { name: /받을 돈.*380,000/ }).check()
  const amount = page.getByRole("textbox", { name: "기록할 금액", exact: true })
  await amount.fill("380000.01")
  await expect(
    page.getByRole("button", { name: "결제 일정 선택 필요", exact: true })
  ).toBeDisabled()
  await amount.fill("100.01")
  await page
    .getByRole("button", { name: "선택한 거래 연결", exact: true })
    .click()
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(
            localStorage.getItem("ecoya-prototype-bank-cash-v1") ?? "[]"
          ).length
      )
    )
    .toBe(1)
  const records = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ecoya-prototype-bank-cash-v1")!)
  )
  expect(records[0]).toMatchObject({
    amount: "100.01",
    currency: "USD",
    sourceDocumentId: bankName,
    scheduleId: "receivable-2026-08-31",
  })
  await page.goto("/erp/settlement")
  const ledgerRow = page
    .getByRole("row")
    .filter({ hasText: "DL-260707-04" })
    .filter({ hasText: "379,899.99 USD" })
  await expect(ledgerRow).toContainText("100.01 USD")
  await page.goto("/erp/deals")
  await page.getByRole("tab", { name: "금융", exact: true }).click()
  await expect(
    page.getByRole("table", { name: "거래 재무 보기" })
  ).toContainText("받은 돈 USD 100.01")
  await page.screenshot({
    path: "/tmp/erp-devdev-sync-20260917/settlement.png",
    fullPage: true,
  })
})

test("document item preview calculates fractional cents exactly", async ({
  page,
}) => {
  await page.goto("/erp/documents/create")
  await page.getByRole("button", { name: /QT.*견적서/ }).click()
  await page.getByRole("region", { name: "문서 폼 선택", exact: true }).getByRole("button", { name: "문서 만들기", exact: true }).click()
  await page
    .getByRole("spinbutton", { name: "품목 1 수량", exact: true })
    .fill("3")
  await page
    .getByRole("spinbutton", { name: "품목 1 단가", exact: true })
    .fill("0.335")
  await expect(
    page.getByRole("cell", { name: "1.01 USD", exact: true })
  ).toBeVisible()
})

test("currency changes do not relabel USD report amounts as SGD", async ({
  page,
}) => {
  await page.goto("/erp/reports")
  await page.getByRole("combobox").filter({ hasText: "USD" }).click()
  await page.getByRole("option", { name: "SGD", exact: true }).click()
  await expect(page.getByText("선택 통화의 자료 없음").first()).toBeVisible()
  await expect(page.getByText(/139,420.*SGD/)).toHaveCount(0)
})

test("same-content files with different names enter the upload queue only once", async ({
  page,
}) => {
  await page.goto("/erp/documents/upload")
  const buffer = Buffer.from("%PDF-1.4\nSame document bytes\n%%EOF")
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles([
      { name: "PO-original.pdf", mimeType: "application/pdf", buffer },
      { name: "PO-renamed.pdf", mimeType: "application/pdf", buffer },
    ])
  await expect(page.getByText("동일한 내용의 문서가 있습니다.")).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(() => {
        const queue = JSON.parse(
          localStorage.getItem("ecoya-prototype-upload-queue-v2") ?? "[]"
        )
        return queue.filter(
          (item: { name: string; stage: string }) =>
            item.name === "PO-original.pdf" && item.stage === "field"
        ).length
      })
    )
    .toBe(1)
  const duplicateCount = await page.evaluate(
    () =>
      JSON.parse(
        localStorage.getItem("ecoya-prototype-upload-queue-v2")!
      ).filter((item: { name: string }) => item.name === "PO-renamed.pdf")
        .length
  )
  expect(duplicateCount).toBe(0)
})

test("failed extraction retries are bounded and never claim successful review", async ({
  page,
}) => {
  await page.goto("/erp/documents/upload")
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: "PO-password.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\nEncrypted preview fixture\n%%EOF"),
    })
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const retry = page.getByRole("button", { name: "다시 추출", exact: true })
    await expect(retry).toBeEnabled()
    await retry.click()
  }
  await expect(
    page.getByRole("button", { name: "재추출 한도 도달", exact: true })
  ).toBeDisabled()
  const document = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("ecoya-prototype-upload-queue-v2")!).find(
      (item: { name: string }) => item.name === "PO-password.pdf"
    )
  )
  expect(document).toMatchObject({ stage: "failed", retryCount: 3 })
})

test("cash failure retains the confirmed document and shows settlement recovery", async ({
  page,
}) => {
  await page.goto(documentPath(bankName, "connect"))
  await page.getByRole("radio", { name: /DL-260707-04/ }).click()
  await page.getByRole("radio", { name: /받을 돈.*380,000/ }).check()
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === "ecoya-prototype-bank-cash-v1")
        throw new Error("현금 저장 실패")
      return original.call(this, key, value)
    }
  })
  await page
    .getByRole("button", { name: "선택한 거래 연결", exact: true })
    .click()
  await expect(
    page.getByText(/문서는 확정되었습니다.*현금 기록 실패/)
  ).toBeVisible()
  expect(
    await page.evaluate(
      () =>
        JSON.parse(
          localStorage.getItem(
            "ecoya-prototype-document-review-v2:은행거래내역서_2026-08-27.pdf"
          )!
        ).status
    )
  ).toBe("committed")
  expect(
    await page.evaluate(() =>
      localStorage.getItem("ecoya-prototype-bank-cash-v1")
    )
  ).toBeNull()
})

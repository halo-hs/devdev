import { expect, test } from "@playwright/test"
import { calculateDealFinance } from "../trade-os/lib/deal-finance-workspace"

test("upload queue exposes every seeded processing state and linked documents", async ({
  page,
}) => {
  await page.goto("/erp/documents/upload")
  const rows = page.locator("main").last().getByRole("row")
  for (const status of [
    "중복 확인 필요",
    "처리 제외",
    "유형 확인 필요",
    "거래 연결 필요",
    "검토 대기",
    "분석 중...",
    "거래 연결 완료",
    "분석 대기",
    "처리 실패",
  ]) {
    await expect(rows.filter({ hasText: status }).first()).toBeVisible()
  }
  await page.getByRole("combobox", { name: "상태 필터", exact: true }).click()
  await page
    .getByRole("option", { name: "거래 연결 완료", exact: true })
    .click()
  await expect(rows.filter({ hasText: "계약서_안심찬.pdf" })).toBeVisible()
  await expect(rows.filter({ hasText: "중복 확인 필요" })).toHaveCount(0)
  await page.goto(
    "/erp/documents/upload/" +
      encodeURIComponent("인보이스_중복확인_0918.pdf") +
      "/review"
  )
  await expect(
    page.getByText("이미 등록된 문서입니다", { exact: true })
  ).toBeVisible()
})

test("document creation seeds pending, approved and rejected approval states", async ({
  page,
}) => {
  await page.goto("/erp/documents/create")
  for (const name of [
    "판매계약서 승인 요청",
    "상업송장 승인 완료",
    "발주서 결제조건 수정",
  ]) {
    await expect(page.getByRole("row").filter({ hasText: name })).toBeVisible()
  }
  for (const [number, message] of [
    ["SC-2026-0918", "승인을 기다리고 있습니다"],
    ["CI-2026-0918", "승인 완료"],
    ["PO-2026-0918", "승인이 반려되었습니다"],
  ]) {
    await page.goto("/erp/documents/create/" + number)
    await expect(page.getByText(message, { exact: true }).first()).toBeVisible()
  }
})

test("deal list and detail distinguish settlement in progress and complete", async ({
  page,
}) => {
  await page.goto("/erp/deals")
  const main = page.locator("main").last()
  for (const stage of ["계약", "선적", "통관", "정산 중", "정산 완료"]) {
    await expect(
      main.getByRole("table", { name: "거래 업무표" }).locator('[aria-label$="상태별 상세"]').filter({ hasText: stage }).first()
    ).toBeVisible()
  }
  for (const [id, label] of [
    ["DL-260629-03", "정산 중"],
    ["DL-260701-09", "정산 완료"],
    ["DL-260707-04", "계약"],
    ["DL-260708-01", "선적"],
    ["DL-260704-02", "통관"],
  ]) {
    await page.goto("/erp/deals/" + id)
    await expect(
      page.locator("main").last().getByText(label, { exact: false }).first()
    ).toBeVisible()
  }
})

for (const [value, title, id, detail] of [
  ["closed", "9월 철강재 거래 종결", "DL-260918-91", "종결"],
  ["cancelled", "9월 운송 발주 취소", "DL-260918-92", "취소"],
  ["unknown", "거래 조건 확인 대기", "DL-260918-93", "주문 미확인"],
]) {
  test(`transaction lifecycle ${value} has a navigable example`, async ({ page }) => {
    await page.goto("/erp/deals")
    await page.getByRole("button", { name: "상세 필터", exact: true }).click()
    await page.getByRole("combobox", { name: "주문 결정", exact: true }).click()
    await page.getByRole("option", { name: value === "unknown" ? "미확인" : detail, exact: true }).click()
    const table = page.getByRole("table", { name: "거래 업무표" })
    await expect(table.getByRole("row")).toHaveCount(2)
    await table.getByRole("button", { name: new RegExp(title) }).click()
    await expect(page).toHaveURL(new RegExp(id))
    await expect(page.locator("main").last().getByText(detail, { exact: true }).first()).toBeVisible()
  })
}

test("saved upload queue gains new status examples once without losing user changes", async ({ page }) => {
  await page.goto("/erp/documents/upload")
  await expect(page.getByRole("row").filter({ hasText: "중복 확인 필요" })).toBeVisible()
  await page.evaluate(() => {
    const key = "ecoya-prototype-upload-queue-v2"
    const documents = JSON.parse(localStorage.getItem(key)!)
      .filter((document: { name: string }) => !document.name.endsWith("_0918.pdf"))
    documents[0].name = "사용자가_추가한_문서.pdf"
    documents.push({ name: "중단된_실제업로드.pdf", documentType: "CI", stage: "ocr", status: "분석 중...", tone: "blue", contentHash: "real-upload", pages: 1, uploadedAt: "2026.09.18 10:00" })
    localStorage.setItem(key, JSON.stringify(documents))
    localStorage.removeItem("ecoya-upload-status-seeds-20260918")
  })
  await page.reload()
  const rows = page.getByRole("row")
  await expect(rows.filter({ hasText: "사용자가_추가한_문서.pdf" })).toBeVisible()
  await expect(rows.filter({ hasText: "중복 확인 필요" })).toBeVisible()
  await expect(rows.filter({ hasText: "B/L_2607_014.pdf" })).toContainText("분석 중...")
  await expect(rows.filter({ hasText: "중단된_실제업로드.pdf" })).toContainText("처리 중단")
  await page.evaluate(() => {
    const key = "ecoya-prototype-upload-queue-v2"
    const documents = JSON.parse(localStorage.getItem(key)!).filter((document: { name: string }) => !document.name.endsWith("_0918.pdf"))
    localStorage.setItem(key, JSON.stringify(documents))
  })
  await page.reload()
  await expect(rows.filter({ hasText: "사용자가_추가한_문서.pdf" })).toBeVisible()
  await expect(rows.filter({ hasText: "중복 확인 필요" })).toHaveCount(0)
})

test("finance fixtures distinguish outstanding loss and fully settled balances", () => {
  expect(calculateDealFinance("DL-260629-03", [])[0]).toMatchObject({
    receivable_outstanding_amount: "120000", payable_outstanding_amount: "280000", adjusted_gp_amount: "-60000",
  })
  expect(calculateDealFinance("DL-260918-91", [])[0]).toMatchObject({
    receivable_outstanding_amount: "0", payable_outstanding_amount: "0", adjusted_gp_amount: "12420",
  })
})

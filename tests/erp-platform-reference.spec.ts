import { writeFile } from "node:fs/promises"
import { expect, test } from "@playwright/test"
import { matchErpRoute } from "../trade-os/lib/erp-routes"

test("Platform menu links resolve to their corresponding prototype screens", () => {
  for (const [path, screen] of [
    ["/erp/documents", "create"],
    ["/erp/inbox", "inbox"],
    ["/erp/monitor", "monitoring"],
    ["/erp/sales-performance", "sales"],
    ["/erp/snap-evidence", "snap"],
  ]) {
    expect(matchErpRoute(path)?.screen).toBe(screen)
    expect(matchErpRoute(path + "/")?.screen).toBe(screen)
  }
})

test("Platform documents entry preserves creation layout and independent approval states", async ({ page }) => {
  await page.goto("/erp/documents")
  await expect(page.getByRole("heading", { name: "문서 만들기", exact: true })).toBeVisible()
  await expect(page.getByRole("region", { name: "문서 폼 선택", exact: true })).toBeVisible()
  for (const [number, approval] of [
    ["SC-2026-0918", "승인 대기"],
    ["CI-2026-0918", "승인 완료"],
    ["PO-2026-0918", "반려"],
  ]) {
    const row = page.getByRole("row").filter({ hasText: number })
    const state = row.getByRole("cell").nth(2)
    await expect(state.getByText("작성 중", { exact: true })).toBeVisible()
    await expect(state.getByText(approval, { exact: true })).toBeVisible()
    await expect(row.getByRole("button", { name: "이어쓰기", exact: true })).toBeVisible()
  }
})

test("grouped extracted amounts render in numeric fields and survive edits", async ({ page }) => {
  await page.addInitScript(() => {
    const key = "ecoya-prototype-document-review-v2:인보이스_2607_003.pdf"
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
      revision: 1, status: "review", fields: { unit_price: { value: "128,333", unit: "USD/MT" } },
    }))
  })
  await page.goto(`/erp/documents/upload/${encodeURIComponent("인보이스_2607_003.pdf")}/review`)
  const price = page.getByRole("region", { name: "항목 점검" }).getByRole("spinbutton", { name: "단가", exact: true })
  await expect(price).toHaveValue("128333")
  await price.fill("128333.25")
  await price.blur()
  await expect.poll(() => page.evaluate(() => JSON.parse(
    localStorage.getItem("ecoya-prototype-document-review-v2:인보이스_2607_003.pdf") ?? "{}"
  ).fields?.unit_price?.value)).toBe("128333.25")
  await page.reload()
  await expect(price).toHaveValue("128333.25")
})

test("member can deliver a confirmed organization document while Deal access stays restricted", async ({ page }) => {
  await page.goto("/erp/documents?role=member")
  const row = page.getByRole("row").filter({ hasText: "CI-2026-0703" })
  await expect(row.getByText("연결 정보 제한", { exact: true })).toBeVisible()
  await row.getByRole("button", { name: "고객 전달", exact: true }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
})

for (const role of ["admin", "member"]) {
  test(`${role} cannot open owner monitoring from a direct link`, async ({ page }) => {
    await page.goto(`/erp/monitor?role=${role}`)
    await expect(page.getByRole("alert")).toContainText("Owner")
    await expect(page.locator('[aria-label="서류 갭 · ETA 임박"]')).toHaveCount(0)
    await expect(page.getByRole("button", { name: "운영 감시", exact: true })).toHaveCount(0)
  })
}

test("upload accepts PDFs above 10 MB and rejects files above the source 50 MB limit", async ({ page }, testInfo) => {
  await page.goto("/erp/documents/upload")
  await expect(page.getByText(/파일당 50MB/).first()).toBeVisible()
  const input = page.locator('input[type="file"][multiple]').first()
  await input.setInputFiles({ name: "source-limit-11mb.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(11 * 1024 * 1024, 32) })
  await expect(page.getByText("source-limit-11mb.pdf", { exact: true }).first()).toBeVisible()
  await page.goto("/erp/documents/upload")
  const oversized = testInfo.outputPath("source-limit-51mb.pdf")
  await writeFile(oversized, Buffer.alloc(51 * 1024 * 1024, 32))
  await input.setInputFiles(oversized)
  await expect(page.getByText(/50MB 초과 1개/)).toBeVisible()
  await expect(page.getByText("source-limit-51mb.pdf", { exact: true })).toHaveCount(0)
})

test("monitoring next action preserves the selected ID and missing-record recovery", async ({ page }) => {
  await page.goto("/erp/monitor")
  const row = page.getByRole("row").filter({ hasText: "수취 계좌 변경 감지" })
  const dealId = (await row.getByRole("button", { name: /^DL-/ }).innerText()).trim()
  await row.getByRole("button", { name: "거래에서 확인", exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`/erp/deals/${dealId}$`))
  await expect(page.locator("main[aria-busy]")).toHaveAttribute("aria-busy", "false")
  await expect(page.getByText("거래를 찾을 수 없습니다", { exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "목록으로", exact: true })).toBeVisible()
})

for (const [path, section] of [
  ["organization", "organization"], ["alerts", "trade-alerts"],
  ["email-forward", "trade-email"], ["contact-import", "trade-counterparty-import"],
  ["deal-import", "trade-deal-import"], ["counterparty-aliases", "trade-aliases"],
]) {
  test(`Platform settings ${path} resolves to its current hub section`, async ({ page }) => {
    await page.goto(`/erp/settings/${path}?role=owner`)
    await expect(page).toHaveURL(new RegExp(`/erp/settings\\?role=owner&section=${section}$`))
    await expect(page.getByRole("heading", { name: "무엇이든 물어보세요", exact: true })).toHaveCount(0)
    await expect(page.locator('[data-slot="sidebar-wrapper"]')).toBeVisible()
  })
}

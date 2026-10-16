import { expect, test } from "@playwright/test"
import {
  generatedDocumentSaveDetails,
  generatedDocumentStatusLabel,
} from "../trade-os/lib/generated-document-metadata"

test("document state follows the document response, with confirmed delivery kept separate", () => {
  expect(generatedDocumentStatusLabel("draft", false)).toBe("작성 중")
  expect(generatedDocumentStatusLabel("confirmed", true)).toBe("확정")
  expect(generatedDocumentStatusLabel("sent", true)).toBe("발송됨")
  expect(generatedDocumentStatusLabel(undefined, true)).toBe("확정")
})

test("audit details use returned revision/editor and preserve missing information", () => {
  expect(generatedDocumentSaveDetails({ revision: 7, updated_by_display_name: "박서윤" }))
    .toEqual({ version: "문서 버전 v7", modifier: "박서윤" })
  expect(generatedDocumentSaveDetails({ revision: null, updated_by_account_id: "editor-account" }))
    .toEqual({ version: "버전 정보 없음", modifier: "editor-account" })
  expect(generatedDocumentSaveDetails(null))
    .toEqual({ version: "버전 정보 없음", modifier: "수정자 정보 없음" })
})

test("document save history displays returned metadata and keeps it on a later save failure", async ({ page }) => {
  await page.goto("/erp/documents/create")
  await page.getByRole("region", { name: "문서 폼 선택", exact: true })
    .getByRole("button", { name: "문서 만들기", exact: true }).click()
  const summary = page.locator('[aria-label="문서 저장 이력"]')
  await expect(summary).toContainText("아직 저장 전")
  await page.evaluate(async () => {
    // Mock the existing local adapter boundary, without adding a production test hook.
    const modulePath = performance.getEntriesByType("resource")
      .map((entry) => entry.name).find((url) => url.includes("/trade-os/lib/prototype-backend.ts"))!
    const { prototypeBackend } = await import(/* @vite-ignore */ modulePath)
    prototypeBackend.generatedDocuments.saveDraft = async ({ id }: { id: string }) => ({
      ok: true, id, updatedAt: "2026-10-09T07:30:00Z",
      document: { status: "draft", revision: 7, updated_at: "2026-10-09T07:30:00Z", updated_by_display_name: "박서윤" },
    })
  })
  const item = page.getByRole("textbox", { name: "품목 1 품목명", exact: true })
  await item.fill("저장 이력 확인")
  await expect(summary).toContainText("자동 저장됨")
  await expect(summary).toContainText("문서 버전 v7")
  await expect(summary).toContainText("박서윤")
  await page.evaluate(async () => {
    const modulePath = performance.getEntriesByType("resource")
      .map((entry) => entry.name).find((url) => url.includes("/trade-os/lib/prototype-backend.ts"))!
    const { prototypeBackend } = await import(/* @vite-ignore */ modulePath)
    prototypeBackend.generatedDocuments.saveDraft = async () => ({ ok: false, error: "저장 실패" })
  })
  await item.fill("실패해도 이전 이력 유지")
  await expect(summary).toContainText("자동 저장 실패")
  await expect(summary).toContainText("문서 버전 v7")
  await expect(summary).toContainText("박서윤")
})

test("opening an existing draft shows its recorded time without inventing an editor", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/erp/documents/create/SC-2026-0708")
  const heading = page.getByRole("heading", { name: "문서 만들기", exact: true }).locator("..")
  await expect(heading).toContainText("작성 중")
  const summary = page.locator('[aria-label="문서 저장 이력"]')
  await expect(summary).toBeVisible()
  await expect(summary).toContainText("오늘 09:42")
  await expect(summary).toContainText("수정자 정보 없음")
  await expect(summary).not.toContainText("박서윤")
})

test("creating a share link does not mark the document sent", async ({ page }) => {
  await page.goto("/erp/documents/create/CI-2026-0703")
  const heading = page.getByRole("heading", { name: "문서 만들기", exact: true }).locator("..")
  await expect(heading).toContainText("확정")
  await page.getByRole("button", { name: "공유하기", exact: true }).first().click()
  const share = page.getByRole("dialog", { name: "파일 공유하기", exact: true })
  await share.getByRole("button", { name: "공유 링크 만들기", exact: true }).click()
  await expect(share.getByRole("button", { name: "복사", exact: true })).toBeEnabled()
  await page.keyboard.press("Escape")
  await expect(heading).toContainText("확정")
  await expect(heading).not.toContainText("발송됨")
})

for (const width of [1440, 390]) {
  test(`deal picker searches names and numbers without changing the current connection at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/erp/documents/create/SC-2026-0708')
    const open = page.getByRole('button', { name: /^거래 (변경|연결)$/ }).first()
    await open.click()
    const picker = page.getByRole('dialog', { name: /^거래 (변경|연결)$/ })
    const search = picker.getByRole('textbox', { name: '연결할 거래 검색' })
    const rows = picker.locator('tbody tr')
    const originalCount = await rows.count()
    expect(originalCount).toBeGreaterThan(1)
    const title = await rows.first().locator('td').first().locator('.font-medium').innerText()
    const number = (await rows.first().locator('td').first().innerText()).match(/DL-[\d-]+/)![0]
    const party = await rows.first().locator('td').nth(1).innerText()
    for (const query of [number.toLowerCase(), title, party]) {
      await search.fill(`  ${query}  `)
      await expect(rows.filter({ hasText: number })).toHaveCount(1)
    }
    await search.fill('검색결과없는거래-999')
    await expect(picker.getByText('검색 조건에 맞는 거래가 없습니다.')).toBeVisible()
    await expect(picker.getByRole('button', { name: '연결', exact: true })).toHaveCount(0)
    await search.fill('')
    await expect(rows).toHaveCount(originalCount)
    const bounds = await search.boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
    await search.fill(number)
    await page.keyboard.press('Escape')
    await open.click()
    await expect(search).toHaveValue('')
    await expect(rows).toHaveCount(originalCount)
  })
}

test('confirmed document breadcrumb does not call the document a draft', async ({ page }) => {
  await page.goto('/erp/documents/create/CI-2026-0703')
  await expect(page.getByRole('heading', { name: '문서 만들기', exact: true }).locator('..')).toContainText('확정')
  const breadcrumb = page.getByRole('navigation', { name: '현재 위치' })
  await expect(breadcrumb).toContainText('상업송장')
  await expect(breadcrumb).not.toContainText('초안')
})

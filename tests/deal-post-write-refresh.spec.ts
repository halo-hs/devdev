import { expect, test, type Page } from "@playwright/test"

const dealId = "DL-260708-01"
const notice = (page: Page) => page.locator("[data-post-write-notice]:visible").first()
async function open(page: Page) {
  await page.goto(`/erp/deals/${dealId}`)
  await page.getByRole("button", { name: "거래번호 수정", exact: true }).waitFor()
}
async function instrument(page: Page, mode: "fail" | "delay" | "ok" | 403 | 404 = "fail") {
  await page.evaluate(async mode => {
    const path = performance.getEntriesByType("resource").map(e => e.name).find(url => url.includes("/trade-os/lib/prototypeBackend.ts"))!
    const { prototypeBackend: backend } = await import(/* @vite-ignore */ path)
    const state = { mode, writes: {} as Record<string, number>, reads: 0, resolve: null as null | (() => void) }
    ;(window as any).__refreshTest = state
    for (const [group, method] of [["deals", "updateIdentity"], ["deals", "updateField"], ["deals", "setAssignee"], ["deals", "orderAction"], ["dealDocuments", "replace"]]) {
      const original = backend[group][method]
      backend[group][method] = async (...args: unknown[]) => {
        state.writes[method] = (state.writes[method] ?? 0) + 1
        return original(...args)
      }
    }
    const read = backend.deals.read
    backend.deals.read = async (...args: unknown[]) => {
      state.reads++
      const data = await read(...args)
      const mode = state.mode
      if (mode === "delay") await new Promise<void>(resolve => { state.resolve = resolve })
      if (mode === "fail" || typeof mode === "number") throw Object.assign(new Error("read failed"), { status: mode === "fail" ? 503 : mode })
      return data
    }
  }, mode)
}
async function saveTitle(page: Page, value = "저장 완료된 거래명") {
  await page.getByRole("button", { name: "거래번호 수정", exact: true }).click()
  await page.getByRole("textbox", { name: "거래 구분명", exact: true }).fill(value)
  await page.getByRole("button", { name: "거래번호 저장", exact: true }).click()
}

test("accepted identity survives failed read; retry reads without saving again", async ({ page }) => {
  await open(page)
  await instrument(page)
  await saveTitle(page)
  await expect(page.getByRole("textbox", { name: "거래 구분명", exact: true })).toHaveCount(0)
  await expect(page.locator("[data-deal-sticky-header]")).toContainText("저장 완료된 거래명")
  await expect(notice(page)).toContainText("저장은 끝났지만")
  await notice(page).getByRole("button", { name: "다시 불러오기", exact: true }).click()
  await expect(notice(page)).toContainText("저장은 끝났지만")
  await expect(notice(page).getByRole("button", { name: "다시 불러오기", exact: true })).toBeEnabled()
  await page.evaluate(() => { (window as any).__refreshTest.mode = "ok" })
  await notice(page).getByRole("button", { name: "다시 불러오기", exact: true }).click()
  await expect(notice(page)).toHaveCount(0)
  expect(await page.evaluate(() => (window as any).__refreshTest.writes.updateIdentity)).toBe(1)
  expect(await page.evaluate(() => (window as any).__refreshTest.reads)).toBe(3)
})

test("accepted field is saved once and a delayed read cannot overwrite newer input", async ({ page }) => {
  await open(page)
  await instrument(page, "delay")
  const input = page.getByRole("textbox", { name: "품목 1 품목명", exact: true })
  await input.fill("저장된 품목")
  await input.press("Tab")
  await expect.poll(() => page.evaluate(() => Boolean((window as any).__refreshTest.resolve))).toBe(true)
  await input.fill("아직 입력 중인 새 품목")
  await page.evaluate(() => { (window as any).__refreshTest.mode = "ok"; (window as any).__refreshTest.resolve() })
  await expect(page.getByRole("button", { name: "거래 다시 불러오기" })).toBeEnabled()
  await expect(input).toHaveValue("아직 입력 중인 새 품목")
  expect(await page.evaluate(() => (window as any).__refreshTest.writes.updateField)).toBe(1)
  await input.press("Tab")
  await expect.poll(() => page.evaluate(() => (window as any).__refreshTest.writes.updateField)).toBe(2)
  await expect(input).toHaveValue("아직 입력 중인 새 품목")
})

test("field write success with read outage stays saved and retry does not PATCH", async ({ page }) => {
  await open(page)
  await instrument(page)
  const input = page.getByRole("textbox", { name: "품목 1 품목명", exact: true })
  await input.fill("조회 실패에도 유지할 품목")
  await input.press("Tab")
  await expect(notice(page)).toContainText("저장은 끝났지만")
  await expect(page.getByRole("button", { name: "다시 저장", exact: true })).toHaveCount(0)
  await expect(input).toHaveValue("조회 실패에도 유지할 품목")
  await page.evaluate(() => { (window as any).__refreshTest.mode = "ok" })
  await notice(page).getByRole("button", { name: "다시 불러오기", exact: true }).click()
  await expect(notice(page)).toHaveCount(0)
  expect(await page.evaluate(() => (window as any).__refreshTest.writes.updateField)).toBe(1)
})

test("mobile PDF replacement closes dialog and preserves accepted file during read outage", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await open(page)
  await instrument(page)
  await page.getByRole("button", { name: "문서와 같이 보며 수정", exact: true }).click()
  const panel = page.locator("#deal-document-preview")
  await panel.getByRole("button", { name: "발주서 문서 작업" }).click()
  await page.getByRole("menuitem", { name: "파일 교체" }).click()
  const dialog = page.getByRole("dialog", { name: "파일 교체", exact: true })
  await dialog.getByLabel("교체할 PDF 파일").setInputFiles({ name: "accepted-PO.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%%EOF") })
  await dialog.getByRole("button", { name: "파일 교체", exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(panel).toContainText("accepted-PO.pdf")
  await expect(notice(page)).toContainText("저장은 끝났지만")
  await page.evaluate(() => { (window as any).__refreshTest.mode = "ok" })
  await notice(page).getByRole("button", { name: "다시 불러오기", exact: true }).click()
  await expect(notice(page)).toHaveCount(0)
  await expect(panel).toContainText("accepted-PO.pdf")
  expect(await page.evaluate(() => (window as any).__refreshTest.writes.replace)).toBe(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

for (const status of [403, 404] as const) {
  test(`read ${status} removes protected deal content instead of offering stale retry`, async ({ page }) => {
    await open(page)
    await instrument(page, status)
    await saveTitle(page)
    await expect(page.getByRole("heading", { name: status === 403 ? "이 거래에 접근할 수 없습니다" : "거래를 찾을 수 없습니다", exact: true })).toBeVisible()
    await expect(page.getByRole("textbox", { name: "품목 1 품목명", exact: true })).toHaveCount(0)
    await expect(notice(page)).toHaveCount(0)
    expect(await page.evaluate(() => (window as any).__refreshTest.writes.updateIdentity)).toBe(1)
  })
}

test("manual read failure does not claim a successful save", async ({ page }) => {
  await open(page)
  await instrument(page)
  await page.getByRole("button", { name: "거래 다시 불러오기" }).click()
  await expect(notice(page)).toContainText("잠시 후 다시 시도")
  await expect(notice(page)).not.toContainText("저장은 끝났지만")
  expect(await page.evaluate(() => (window as any).__refreshTest.writes)).toEqual({})
})

test("write failure keeps editor and never starts a follow-up read", async ({ page }) => {
  await open(page)
  await instrument(page)
  await page.evaluate(async () => {
    const path = performance.getEntriesByType("resource").map(e => e.name).find(url => url.includes("/trade-os/lib/prototypeBackend.ts"))!
    const { prototypeBackend } = await import(/* @vite-ignore */ path)
    prototypeBackend.deals.updateIdentity = async () => ({ ok: false, error: "저장 요청 실패" })
  })
  await saveTitle(page, "아직 저장되지 않은 거래명")
  await expect(page.getByRole("textbox", { name: "거래 구분명", exact: true })).toHaveValue("아직 저장되지 않은 거래명")
  await expect(page.getByText("저장 요청 실패", { exact: true })).toBeVisible()
  await expect(notice(page)).toHaveCount(0)
  expect(await page.evaluate(() => (window as any).__refreshTest.reads)).toBe(0)
})

for (const outcome of ["stale-data", "late-failure"]) {
  test(`an older read's ${outcome} cannot undo a newer write and successful read`, async ({ page }) => {
    await open(page)
    await instrument(page, "ok")
    await page.evaluate(async outcome => {
      const path = performance.getEntriesByType("resource").map(e => e.name).find(url => url.includes("/trade-os/lib/prototypeBackend.ts"))!
      const { prototypeBackend: backend } = await import(/* @vite-ignore */ path)
      const original = backend.deals.read
      let first = true
      backend.deals.read = async (...args: unknown[]) => {
        if (!first) return original(...args)
        first = false
        const old = await original(...args)
        return new Promise((resolve, reject) => {
          ;(window as any).__olderRead = () => outcome === "stale-data" ? resolve({ ...old, title: "오래된 거래명" }) : reject(new Error("late failure"))
        })
      }
    }, outcome)
    await page.getByRole("button", { name: "거래 다시 불러오기" }).click()
    await expect.poll(() => page.evaluate(() => Boolean((window as any).__olderRead))).toBe(true)
    await saveTitle(page, "최신 거래명")
    await expect.poll(() => page.evaluate(() => (window as any).__refreshTest.reads)).toBe(2)
    await expect(page.getByRole("button", { name: "거래 다시 불러오기" })).toBeEnabled()
    await page.evaluate(() => (window as any).__olderRead())
    await expect(page.locator("[data-deal-sticky-header]")).toContainText("최신 거래명")
    await expect(page.locator("[data-deal-sticky-header]")).not.toContainText("오래된 거래명")
    await expect(notice(page)).toHaveCount(0)
    expect(await page.evaluate(() => (window as any).__refreshTest.writes.updateIdentity)).toBe(1)
  })
}

test("changing to a read-only actor while saving suppresses the old actor's completion", async ({ page }) => {
  await open(page)
  await instrument(page, "ok")
  await page.evaluate(async () => {
    const path = performance.getEntriesByType("resource").map(e => e.name).find(url => url.includes("/trade-os/lib/prototypeBackend.ts"))!
    const { prototypeBackend: backend } = await import(/* @vite-ignore */ path)
    const original = backend.deals.updateIdentity
    backend.deals.updateIdentity = (...args: unknown[]) => new Promise(resolve => {
      ;(window as any).__finishOldWrite = async () => resolve(await original(...args))
    })
  })
  await saveTitle(page, "이전 사용자가 저장한 값")
  await expect.poll(() => page.evaluate(() => Boolean((window as any).__finishOldWrite))).toBe(true)
  await page.locator("[data-deal-sticky-header]").getByRole("button", { name: "더보기", exact: true }).click()
  await page.getByRole("menuitem", { name: "멤버 화면", exact: true }).click()
  await expect(page.getByRole("combobox", { name: "거래 담당자" })).toBeDisabled()
  await page.evaluate(() => (window as any).__finishOldWrite())
  await expect(page.getByText("거래 기본정보를 저장했습니다.", { exact: true })).toHaveCount(0)
  await expect(notice(page)).toHaveCount(0)
  expect(await page.evaluate(() => (window as any).__refreshTest.reads)).toBe(0)
})

test("accepted assignee remains selected and retry never assigns twice", async ({ page }) => {
  await open(page)
  await instrument(page)
  const assignee = page.getByRole("combobox", { name: "거래 담당자" })
  await assignee.click()
  await page.getByRole("option", { name: "박서윤", exact: true }).click()
  await expect(assignee).toHaveText("박서윤")
  await expect(notice(page)).toContainText("저장은 끝났지만")
  await page.evaluate(() => { (window as any).__refreshTest.mode = "ok" })
  await notice(page).getByRole("button", { name: "다시 불러오기", exact: true }).click()
  await expect(notice(page)).toHaveCount(0)
  await expect(assignee).toHaveText("박서윤")
  expect(await page.evaluate(() => (window as any).__refreshTest.writes.setAssignee)).toBe(1)
})

test("accepted order closure remains closed while read retry never closes it again", async ({ page }) => {
  await open(page)
  await instrument(page)
  await page.getByRole("button", { name: "미달 마감", exact: true }).click()
  await page.getByPlaceholder("미달 마감 또는 취소 사유를 입력하세요").fill("잔여 수량 이월")
  await page.getByRole("button", { name: "변경 적용", exact: true }).click()
  await expect(notice(page)).toContainText("저장은 끝났지만")
  await expect(page.locator("#deal-fulfillment")).toContainText("미달 마감")
  await expect(page.getByRole("button", { name: "변경 적용", exact: true })).toHaveCount(0)
  await page.evaluate(() => { (window as any).__refreshTest.mode = "ok" })
  await notice(page).getByRole("button", { name: "다시 불러오기", exact: true }).click()
  await expect(notice(page)).toHaveCount(0)
  await expect(page.locator("#deal-fulfillment")).toContainText("미달 마감")
  expect(await page.evaluate(() => (window as any).__refreshTest.writes.orderAction)).toBe(1)
})

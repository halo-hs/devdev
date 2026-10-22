import { expect, test, type Page } from "@playwright/test"

const name = "은행거래내역서_2026-08-27.pdf"
const path = `/erp/documents/upload/${encodeURIComponent(name)}`
const key = `ecoya-prototype-document-review-v2:${name}`
const legacyKey = "ecoya-prototype-upload-document-deal-links"
const source = "DL-260707-04"
const target = "DL-260704-02"
const state = (page: Page) => page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? "null"), key)
async function failOnce(page: Page, method: string, returnsResult = false, failures = 1) {
  await page.evaluate(async ({ method, returnsResult, failures }) => {
    const url = performance.getEntriesByType("resource").map(entry => entry.name).find(url => url.includes("/trade-os/lib/prototypeBackend.ts"))!
    const { prototypeBackend } = await import(/* @vite-ignore */ url)
    const original = prototypeBackend.tradeDocuments[method]
    ;(window as any).__connectionOriginals ??= {}
    ;(window as any).__connectionOriginals[method] = original
    let remaining = failures
    prototypeBackend.tradeDocuments[method] = async (...args: unknown[]) => {
      if (remaining-- > 0) {
        if (returnsResult) return { ok: false, error: "연결 요청 실패" }
        throw new Error("연결 요청 실패")
      }
      return original(...args)
    }
  }, { method, returnsResult, failures })
}
async function restore(page: Page, method: string) {
  await page.evaluate(async method => {
    const url = performance.getEntriesByType("resource").map(entry => entry.name).find(url => url.includes("/trade-os/lib/prototypeBackend.ts"))!
    const { prototypeBackend } = await import(/* @vite-ignore */ url)
    prototypeBackend.tradeDocuments[method] = (window as any).__connectionOriginals[method]
  }, method)
}
async function seedLinked(page: Page) {
  await page.goto(path + "/review")
  await page.evaluate(({ name, key, legacyKey, source }) => {
    localStorage.setItem(key, JSON.stringify({ revision: 3, status: "committed", dealId: source, documentType: "BANK_STATEMENT", fields: { counterparty: { value: "ACME GmbH" } } }))
    localStorage.setItem(legacyKey, JSON.stringify({ [name]: { dealId: source, dealLabel: `${source} · ACME GmbH` } }))
  }, { name, key, legacyKey, source })
  await page.goto(path + "/connect")
  await expect(page.getByRole("region", { name: "현재 거래 연결" })).toContainText(source)
}

test("candidate rows stay concise while selection persists evidence and actor/time", async ({ page }) => {
  await page.goto(path + "/connect")
  const candidate = page.getByRole("radio", { name: new RegExp(source) })
  await expect(candidate).not.toContainText("거래처 일치 · ACME GmbH")
  await expect(candidate).not.toContainText("금액·통화 일치 · 380,000 USD")
  await expect(candidate).not.toContainText("동일 근거의 다른 후보 있음")
  await expect(page.getByText("같은 근거를 충족하는 후보가 여러 건입니다. 거래를 직접 선택해 주세요.")).toBeVisible()
  expect(await state(page)).toBeNull()
  await candidate.click()
  expect(await state(page)).toBeNull()
  await page.getByRole("radio", { name: /서류만 연결/ }).check()
  await page.getByRole("button", { name: "선택한 거래 연결", exact: true }).click()
  await page.waitForURL(`**/erp/deals/${source}`)
  const saved = await state(page)
  expect(saved.connectionHistory).toHaveLength(1)
  expect(saved.connectionHistory[0]).toMatchObject({ action: "linked", dealId: source, actorLabel: "나" })
  expect(saved.connectionHistory[0].evidence).toContain("금액·통화 일치 · 380,000 USD")
  expect(Number.isFinite(Date.parse(saved.connectionHistory[0].occurredAt))).toBe(true)
  await page.goto(path + "/connect")
  await expect(page.getByRole("region", { name: "현재 거래 연결" })).toContainText("연결 이력 1건")
})

test("a member without a Trade OS seat can review candidates but cannot connect a deal", async ({ page }) => {
  await page.goto("/erp/settings?section=members")
  await page.getByRole("row", { name: "박서윤" }).getByRole("button", { name: "박서윤 Trade OS" }).click()
  await page.getByRole("menuitem", { name: "시트 회수" }).click()
  await expect(page.getByRole("row", { name: "박서윤" })).toContainText("할당되지 않음")

  await page.evaluate(url => {
    window.history.pushState({}, "", url)
    window.dispatchEvent(new PopStateEvent("popstate"))
  }, `${path}/connect?role=member`)

  await expect(page.getByRole("radio", { name: new RegExp(source) })).toBeVisible()
  await expect(page.getByText("Trade OS는 조회만 가능해요. 거래를 연결하려면 사용 권한이 필요합니다.")).toBeVisible()
  const connect = page.getByRole("button", { name: "선택한 거래 연결", exact: true })
  await expect(connect).toHaveAttribute("aria-disabled", "true")
  await connect.hover()
  await expect(page.getByRole("tooltip")).toContainText("거래를 연결하려면 Trade 사용 권한이 필요해요")
  await page.getByRole("radio", { name: new RegExp(source) }).click()
  const selectedAction = page.getByRole("button", { name: "결제 일정 선택 필요", exact: true })
  await expect(selectedAction).toHaveAttribute("aria-disabled", "true")
  await selectedAction.dispatchEvent("click")
  expect(await state(page)).toBeNull()
  await expect(page).toHaveURL(/\/connect/)
})

test("upload started from a deal preselects that deal and allows another choice", async ({ page }) => {
  await page.goto(`${path}/connect?fromDeal=${encodeURIComponent(source)}`)
  await expect(page.getByText(`거래 상세에서 올린 문서입니다. ${source} 거래를 먼저 선택했습니다. 다른 거래도 선택할 수 있습니다.`)).toBeVisible()
  await expect(page.getByRole("radio", { name: new RegExp(source) })).toHaveAttribute("aria-checked", "true")
  await page.getByRole("radio", { name: new RegExp(target) }).click()
  await expect(page.getByRole("radio", { name: new RegExp(target) })).toHaveAttribute("aria-checked", "true")
  await expect(page.getByRole("radio", { name: new RegExp(source) })).toHaveAttribute("aria-checked", "false")
})

test("undo action returns to the connection impact check", async ({ page }) => {
  await seedLinked(page)
  await page.goto(`${path}/connect?undo=1`)
  await expect(page.getByRole("dialog", { name: "거래 연결 해제" })).toBeVisible()
  await expect(page.getByRole("dialog", { name: "거래 연결 해제" }).getByLabel("변경 사유")).toBeVisible()
  expect(new URL(page.url()).searchParams.has("undo")).toBe(false)
})

test("freight document offers cost registration after connection", async ({ page }) => {
  const freight = "운임_테스트.pdf"
  await page.goto("/erp/documents")
  await page.evaluate(name => localStorage.setItem("ecoya-prototype-upload-queue-v2", JSON.stringify([{
    name, uploadedAt: "2026.10.14", status: "거래 연결 필요", tone: "warning", stage: "field",
    documentType: "FREIGHT_INVOICE", pdfReviewCompleted: true,
  }])), freight)
  await page.goto(`/erp/documents/upload/${encodeURIComponent(freight)}/connect`)
  await page.getByRole("radio", { name: new RegExp(source) }).click()
  await page.getByRole("button", { name: "선택한 거래 연결", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "비용 등록" })
  await expect(dialog).toBeVisible()
  await dialog.getByRole("button", { name: "나중에" }).click()
  await page.waitForURL(`**/erp/deals/${source}`)
})

test("legacy link does not invent audit; relink failure preserves old link and reason", async ({ page }) => {
  await seedLinked(page)
  const summary = page.getByRole("region", { name: "현재 거래 연결" })
  await expect(summary).toContainText("처리자·시각은 기록되어 있지 않습니다")
  await expect(summary.getByRole("button", { name: "연결 해제", exact: true })).toHaveCount(0)
  await page.getByRole("button", { name: "다른 거래로 변경", exact: true }).click()
  await expect(summary.getByRole("button", { name: "변경 취소", exact: true })).toBeVisible()
  await expect(summary.getByRole("button", { name: "연결 해제", exact: true })).toHaveCount(0)
  await expect(page.getByRole("button", { name: "확인 필요 1건", exact: true })).toHaveCount(0)
  await expect(page.getByText("같은 근거를 충족하는 후보가 여러 건입니다. 거래를 직접 선택해 주세요.")).toHaveCount(0)
  await expect(page.getByRole("button", { name: "변경 취소", exact: true })).toHaveCount(1)
  await expect(page.getByText("변경할 거래를 선택하세요. 변경을 확정하기 전까지 현재 연결은 유지됩니다.")).toBeVisible()
  await summary.getByRole("button", { name: "변경 취소", exact: true }).click()
  await expect(summary).toContainText(source)
  await expect(page.getByText("변경할 거래를 선택하세요. 변경을 확정하기 전까지 현재 연결은 유지됩니다.")).toHaveCount(0)
  await expect(page.getByRole("radio", { name: new RegExp(target) })).toHaveCount(0)
  await page.getByRole("button", { name: "다른 거래로 변경", exact: true }).click()
  await page.getByRole("radio", { name: new RegExp(target) }).click()
  await page.getByRole("button", { name: "연결 변경 확인", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "거래 연결 변경", exact: true })
  await expect(dialog.getByRole("button", { name: "연결 변경 확정" })).toBeDisabled()
  await dialog.getByLabel("변경 사유", { exact: true }).fill("거래처를 확인하여 연결 수정")
  await failOnce(page, "changeConnection")
  await dialog.getByRole("button", { name: "연결 변경 확정" }).click()
  await expect(dialog.getByRole("alert")).toContainText("연결 요청 실패")
  await expect(dialog.getByLabel("변경 사유", { exact: true })).toHaveValue("거래처를 확인하여 연결 수정")
  expect((await state(page)).dealId).toBe(source)
  await dialog.getByRole("button", { name: "연결 변경 확정" }).click()
  await expect(dialog).toBeHidden()
  await expect(summary).toContainText(target)
  expect((await state(page)).connectionHistory).toHaveLength(1)
  await page.reload()
  await expect(summary).toContainText(target)
  await expect(summary.getByRole("button", { name: "연결 해제", exact: true })).toHaveCount(0)
})

test("change mode allows registering a new deal and keeps the current link until impact confirmation", async ({ page }) => {
  await seedLinked(page)
  const summary = page.getByRole("region", { name: "현재 거래 연결" })
  await page.getByRole("button", { name: "다른 거래로 변경", exact: true }).click()
  const newDealButton = page.getByRole("button", { name: "새 거래 등록", exact: true })
  await expect(newDealButton).toBeEnabled()
  await newDealButton.click()
  await page.getByLabel("새 거래번호").fill("DL-CHANGE-NEW-01")
  const reviewChange = page.getByRole("button", { name: "새 거래 등록 후 변경 검토", exact: true })
  await expect(reviewChange).toBeEnabled()
  await reviewChange.click()
  const dialog = page.getByRole("dialog", { name: "거래 연결 변경", exact: true })
  await expect(dialog).toContainText("DL-CHANGE-NEW-01 · ACME GmbH")
  expect((await state(page)).dealId).toBe(source)
  await dialog.getByLabel("변경 사유", { exact: true }).fill("새 거래로 정정")
  await dialog.getByRole("button", { name: "연결 변경 확정" }).click()
  await expect(dialog).toBeHidden()
  await expect(summary).toContainText("DL-CHANGE-NEW-01")
  expect((await state(page)).dealId).toBe("DL-CHANGE-NEW-01")
})

test("connection and candidate read failures stay distinct from empty; retries do not mutate", async ({ page }) => {
  await page.goto(path + "/review")
  await failOnce(page, "getConnection", false, 100)
  await failOnce(page, "listCandidates", false, 100)
  await page.getByRole("button", { name: "거래 연결", exact: true }).click()
  await expect(page.getByText("현재 거래 연결을 불러오지 못했습니다", { exact: true })).toBeVisible()
  await expect(page.getByRole("region", { name: "현재 거래 연결" })).toHaveCount(0)
  await expect(page.getByRole("button", { name: "선택한 거래 연결", exact: true })).toBeDisabled()
  await restore(page, "getConnection")
  await page.getByRole("button", { name: "현재 연결 다시 확인", exact: true }).click()
  await expect(page.getByText("거래 후보를 불러오지 못했습니다", { exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "새 거래 등록", exact: true })).toBeDisabled()
  await restore(page, "listCandidates")
  await page.getByRole("button", { name: "다시 불러오기", exact: true }).click()
  await expect(page.getByRole("radio", { name: new RegExp(source) })).toBeVisible()
  expect(await state(page)).toBeNull()
})

test("cash dependency and stale revision block changes without overwriting connection or reason", async ({ page }) => {
  await seedLinked(page)
  await page.evaluate(name => localStorage.setItem("ecoya-prototype-bank-cash-v1", JSON.stringify([{ sourceDocumentId: name }])), name)
  await page.goto(`${path}/connect?undo=1`)
  const dialog = page.getByRole("dialog", { name: "거래 연결 해제", exact: true })
  await dialog.getByLabel("변경 사유", { exact: true }).fill("잘못 연결된 서류 확인")
  await expect(dialog).toContainText("기록된 정산 내역")
  await expect(dialog.getByRole("button", { name: "연결 해제 확정" })).toBeDisabled()
  expect((await state(page)).dealId).toBe(source)
  await page.evaluate(() => localStorage.removeItem("ecoya-prototype-bank-cash-v1"))
  await dialog.getByRole("button", { name: "변경 영향 다시 확인" }).click()
  await expect(dialog.getByRole("button", { name: "연결 해제 확정" })).toBeEnabled()
  await page.evaluate(key => { const value = JSON.parse(localStorage.getItem(key)!); localStorage.setItem(key, JSON.stringify({ ...value, revision: value.revision + 1 })) }, key)
  await dialog.getByRole("button", { name: "연결 해제 확정" }).click()
  await expect(dialog.getByRole("alert")).toContainText("연결 정보가 변경되었습니다")
  await expect(dialog.getByLabel("변경 사유", { exact: true })).toHaveValue("잘못 연결된 서류 확인")
  expect((await state(page)).dealId).toBe(source)
  await dialog.getByRole("button", { name: "변경 영향 다시 확인" }).click()
  await expect(dialog.getByRole("button", { name: "연결 해제 확정" })).toBeEnabled()
  await dialog.getByRole("button", { name: "연결 해제 확정" }).click()
  await expect(dialog).toBeHidden()
  expect((await state(page)).dealId).toBeUndefined()
})

test("created Deal survives link failure and reload; retry links it without creating again", async ({ page }) => {
  await page.goto(path + "/connect")
  await page.getByRole("button", { name: "새 거래 등록", exact: true }).click()
  await page.getByRole("combobox", { name: "새 거래 방향" }).click()
  await page.getByRole("option", { name: "매출 · 받을 돈", exact: true }).click()
  await failOnce(page, "confirmTransition", true)
  await page.getByRole("button", { name: "새 거래 생성·연결", exact: true }).click()
  await expect(page.getByRole("button", { name: "생성한 거래에 연결 재시도", exact: true })).toBeEnabled()
  const created = await page.evaluate(() => JSON.parse(localStorage.getItem("ecoya-prototype-created-deals")!))
  expect(created).toHaveLength(1)
  await page.reload()
  await expect(page.getByRole("button", { name: "생성한 거래에 연결 재시도", exact: true })).toBeEnabled()
  await expect(page.getByRole("radio", { name: new RegExp(created[0].id) })).toBeVisible()
  await page.getByRole("button", { name: "생성한 거래에 연결 재시도", exact: true }).click()
  await page.waitForURL(`**/erp/deals/${created[0].id}`)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("ecoya-prototype-created-deals")!).length)).toBe(1)
  expect((await state(page)).dealId).toBe(created[0].id)
})

test("a Deal can be linked without direction and assigned one later", async ({ page }) => {
  await page.goto(path + "/connect")
  await page.getByRole("button", { name: "새 거래 등록", exact: true }).click()
  await expect(page.getByText("거래 상세에서 나중에 정할 수 있습니다.", { exact: false })).toBeVisible()
  await expect(page.getByText("매입·매출 구분 선택")).toHaveCount(0)
  await page.getByRole("button", { name: "새 거래 생성·연결", exact: true }).click()
  await page.waitForURL("**/erp/deals/**")
  const created = await page.evaluate(() => JSON.parse(localStorage.getItem("ecoya-prototype-created-deals")!))
  expect(created).toHaveLength(1)
  expect(created[0].direction).toBe("direction_pending")
  expect(page.url()).toContain(`/erp/deals/${created[0].id}`)
  await expect(page.getByText("방향 미정", { exact: true }).first()).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expect(page.getByRole("combobox", { name: "거래 방향 정하기" })).toBeVisible()
  await page.getByRole("combobox", { name: "거래 방향 정하기" }).click()
  await page.getByRole("option", { name: "매출", exact: true }).click()
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("ecoya-prototype-created-deals")!)[0].direction)).toBe("sales")
  await page.reload()
  expect((await page.evaluate(() => JSON.parse(localStorage.getItem("ecoya-prototype-created-deals")!)))[0].direction).toBe("sales")
  await expect(page.getByText("매출", { exact: true }).first()).toBeVisible()
})

test("mobile connection actions and impact dialog remain inside viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await seedLinked(page)
  const change = page.getByRole("button", { name: "다른 거래로 변경", exact: true })
  await expect(change).toBeInViewport()
  await change.click()
  await page.getByRole("radio", { name: new RegExp(target) }).click()
  await page.getByRole("button", { name: "연결 변경 확인", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "거래 연결 변경", exact: true })
  await expect(dialog.getByLabel("변경 사유", { exact: true })).toBeInViewport()
  await expect(dialog.getByRole("button", { name: "연결 변경 확정" })).toBeInViewport()
  const bounds = (await dialog.boundingBox())!
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390)
})

import { expect, test } from "@playwright/test"

for (const legacy of ["/erp/copilot", "/erp/home#ask"]) {
  test(`legacy AI link ${legacy} opens the canonical screen`, async ({
    page,
  }) => {
    await page.goto(legacy)
    await expect(page).toHaveURL(/\/erp\/ai$/)
    await expect(
      page.getByRole("heading", { name: "어떤 업무를 확인할까요?" })
    ).toBeVisible()
  })
}

test("AI workspace fills tall desktop and mobile body", async ({ page }) => {
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto("/erp/ai")
    const workspace = page.locator('[data-slot="ai-chat-workspace"]')
    await expect(workspace).toBeVisible()
    await expect
      .poll(() =>
        workspace.evaluate((element) =>
          Math.abs(element.getBoundingClientRect().bottom - window.innerHeight)
        )
      )
      .toBeLessThanOrEqual(1)
    await page
      .getByRole("button", { name: "저장한 답변과 상세 조회", exact: true })
      .click()
    await expect(page.locator('[data-slot="ai-business-tools"]')).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true)
  }
})

test("business search links to the matching deal and keeps saved answers frozen", async ({
  page,
}) => {
  await page.goto("/erp/ai")
  await page
    .getByRole("button", { name: "저장한 답변과 상세 조회", exact: true })
    .click()
  await page
    .getByRole("textbox", { name: "거래처·거래·문서 검색" })
    .fill("ACME GmbH")
  await page.getByRole("button", { name: "업무정보 조회", exact: true }).click()
  const result = page.locator('[aria-label="업무 조회 결과"]')
  await expect(result).toContainText("DL-260707-04")
  await page
    .getByRole("button", { name: "다시 조회하고 저장", exact: true })
    .click()
  await page
    .getByRole("textbox", { name: "거래처·거래·문서 검색" })
    .fill("없는 거래처")
  await page.getByRole("button", { name: "업무정보 조회", exact: true }).click()
  await expect(result).toContainText("조건에 맞는 저장 기록이 없습니다.")
  await page.getByRole("button", { name: "질문하기", exact: true }).click()
  await page
    .getByRole("button", { name: "저장한 답변과 상세 조회", exact: true })
    .click()
  await page
    .getByRole("button", { name: "저장 답변 열기", exact: true })
    .click()
  await expect(result).toContainText("읽기 전용 과거 답변")
  await expect(result).toContainText("DL-260707-04")
  await result.locator(".divide-y > div").filter({ hasText: "DL-260707-04" }).getByRole("button", { name: "거래 열기" }).click()
  await expect(page).toHaveURL(/\/erp\/deals\/DL-260707-04$/)
})

test("arrival query uses ETA, rejects reversed dates, and exports its own criteria", async ({
  page,
}) => {
  await page.goto("/erp/ai")
  await page
    .getByRole("button", { name: "저장한 답변과 상세 조회", exact: true })
    .click()
  await page.getByRole("combobox", { name: "조회 대상" }).click()
  await page
    .getByRole("option", { name: "ETA 기준 도착 예정", exact: true })
    .click()
  await page.getByLabel("시작일", { exact: true }).fill("2026-07-16")
  await page.getByLabel("종료일 (포함)", { exact: true }).fill("2026-07-15")
  await page.getByRole("button", { name: "업무정보 조회", exact: true }).click()
  await expect(page.getByRole("alert")).toContainText("종료일은 시작일")
  await page.getByLabel("시작일", { exact: true }).fill("2026-07-15")
  await page.getByRole("button", { name: "업무정보 조회", exact: true }).click()
  const result = page.locator('[aria-label="업무 조회 결과"]')
  await expect(result).toContainText("ONE26070819")
  await expect(result).not.toContainText("HMM014W2607")
  const downloadPromise = page.waitForEvent("download")
  await result.getByRole("button", { name: "현재 조회본 저장 (JSON)" }).click()
  const download = await downloadPromise
  const stream = await download.createReadStream()
  const chunks = []
  for await (const chunk of stream!) chunks.push(chunk)
  const snapshot = JSON.parse(Buffer.concat(chunks).toString())
  expect(snapshot.criteria).toMatchObject({
    kind: "arrivals",
    from: "2026-07-15",
    to: "2026-07-15",
  })
  expect(
    snapshot.rows.some((row: { id: string }) => row.id === "ONE26070819")
  ).toBe(true)
})

test("document body search distinguishes manual transcription and pages", async ({
  page,
}) => {
  await page.goto("/erp/ai")
  await page
    .getByRole("button", { name: "저장한 답변과 상세 조회", exact: true })
    .click()
  await page.getByRole("combobox", { name: "조회 대상" }).click()
  await page
    .getByRole("option", { name: "보관된 문서 본문", exact: true })
    .click()
  await page.getByText("수동 전사 본문 보관", { exact: true }).click()
  await page
    .getByRole("textbox", { name: "수동 전사 본문", exact: true })
    .fill("첫 페이지 조건\n---PAGE---\nPayment within thirty days")
  await page
    .getByRole("button", { name: "전사 본문 저장", exact: true })
    .click()
  await page
    .getByRole("textbox", { name: "찾을 문구", exact: true })
    .fill("thirty days")
  await page.getByRole("button", { name: "업무정보 조회", exact: true }).click()
  const result = page.locator('[aria-label="업무 조회 결과"]')
  await expect(result).toContainText("2페이지")
  await expect(result).toContainText("사용자 전사 · 미검증")
  await expect(result).not.toContainText("첫 페이지 조건")
})

test("shipment search keeps ETD and ETA and opens its matching deal", async ({ page }) => {
  await page.goto("/erp/shipments")
  await expect(page.locator("main[aria-busy]")).toHaveAttribute("aria-busy", "false")
  await page.getByPlaceholder("거래번호·거래명·B/L·컨테이너·항구·선박 검색").fill("HMM014W2607")
  const row = page.getByRole("row").filter({ hasText: "HMM014W2607" })
  await expect(row).toContainText("ETA 기준")
  await page.getByRole("button", { name: "거래 보기", exact: true }).click()
  await expect(page).toHaveURL(/\/erp\/deals\/DL-260708-01$/)
})

for (const [path, content] of [
  ["settlement", "AR/AP 원장"],
  ["monitoring", "미선적 잔량"],
  ["reports", "기말 잔액 추세"],
  ["sales", "월별 예상 거래손익 추세"],
]) {
  test(`${path} includes handoff business content`, async ({ page }) => {
    await page.goto(`/erp/${path}`)
    await expect(
      page.getByText(content, { exact: path !== "monitoring" })
    ).toBeVisible()
  })
}

test("monitoring document gaps exclude ordinary approval queues", async ({
  page,
}) => {
  await page.goto("/erp/monitoring")
  const gaps = page.locator('[aria-label="서류 갭 · ETA 임박"]')
  await expect(gaps).toContainText("ONE26070819")
  await expect(gaps).not.toContainText("판매계약서 승인 요청")
  await expect(gaps).not.toContainText("ACME 7월 해상운송 계약")
  await gaps.getByRole("button").first().click()
  await expect(page).toHaveURL(/\/erp\/deals\/DL-260708-01$/)
})

test("sales period and owner filters update the current analytics", async ({ page }) => {
  await page.goto("/erp/sales")
  await expect(page.getByText("월별 예상 거래손익 추세", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "3개월", exact: true }).click()
  await expect(page.getByRole("button", { name: "3개월", exact: true })).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByText(/최근 3개월 · USD · 매출/)).toBeVisible()
  const table = page.getByRole("table").first()
  const before = await table.getByRole("row").count()
  await page.getByRole("combobox", { name: "담당자 필터" }).click()
  await page.getByRole("option", { name: "김민지", exact: true }).click()
  await expect.poll(() => table.getByRole("row").count()).toBeLessThan(before)
  await expect(table).toContainText("KATAMAN ASIA-PACIFIC")
  await expect(table).not.toContainText("ACME GmbH")
})

test("an in-app legacy hash link changes screen and preserves query parameters", async ({
  page,
}) => {
  await page.goto("/erp/home?role=member")
  await expect(page.locator('[data-slot="ai-chat-workspace"]')).toHaveCount(0)
  await page.evaluate(() => {
    window.location.hash = "ask"
  })
  await expect(page).toHaveURL(/\/erp\/ai\?role=member$/)
  await expect(page.locator('[data-slot="ai-chat-workspace"]')).toBeVisible()
})

test("sales currency filter never relabels USD receivables as SGD", async ({
  page,
}) => {
  await page.goto("/erp/sales")
  await page
    .getByRole("group", { name: "통화", exact: true })
    .getByRole("button", { name: "SGD", exact: true })
    .click()
  const metrics = page.locator(".ui-summary-hero")
  await expect(metrics).toBeVisible()
  await expect(metrics).not.toContainText("139,420")
  const table = page.getByRole("table").first()
  await expect(table).not.toContainText("ACME GmbH")
  await expect(table).toContainText("SGD")
})

test("questions about added content open the tools and chat history returns to the conversation", async ({
  page,
}) => {
  await page.goto("/erp/ai")
  await page
    .getByRole("textbox", { name: "AI 질문", exact: true })
    .fill("보관된 문서 본문에서 지급 조건을 찾아줘")
  await page
    .getByRole("button", { name: "질문하기", exact: true })
    .last()
    .click()
  await page
    .getByRole("button", { name: /저장한 답변과 상세 조회 조건별 업무 조회/ })
    .click()
  await expect(page.locator('[data-slot="ai-business-tools"]')).toBeVisible()
  await page
    .getByRole("button", { name: /이번 주 받을 돈 정산 3건과 거래 근거/ })
    .click()
  await expect(
    page.locator('[data-slot="ai-business-tools"]')
  ).not.toBeVisible()
  await expect(
    page.getByRole("heading", {
      name: "현재 받을 돈과 지급할 돈은 정산 근거를 확인해야 합니다.",
    })
  ).toBeVisible()
})

test("operational menus retain ledgers, exception categories and nonempty sales", async ({ page }) => {
  await page.goto("/erp/settlement")
  const ledger = page.locator("#settlement-ledger")
  await expect(ledger).toContainText("ACME GmbH")
  await ledger.getByRole("button", { name: "보낼 돈", exact: true }).click()
  await expect(ledger).toContainText("KATAMAN ASIA-PACIFIC")
  await ledger.getByRole("button", { name: "받을 돈", exact: true }).click()
  await ledger.getByRole("button", { name: "취소 거래 포함", exact: true }).click()
  await expect(ledger.getByRole("button", { name: "조회만", exact: true }).first()).toBeDisabled()
  await page.goto("/erp/reports")
  await expect(page.getByText("기말 잔액 추세", { exact: true })).toBeVisible()
  await expect(page.getByText("월마감", { exact: true }).first()).toBeVisible()
  await page.goto("/erp/monitoring")
  for (const [name, count] of [["서류 갭 · ETA 임박", 4], ["미선적 잔량", 3], ["수량 불일치", 3]] as const)
    await expect(page.locator(`[aria-label="${name}"]`).getByRole("button")).toHaveCount(count)
  await page.goto("/erp/sales")
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(11)
  await expect(page.getByRole("table")).toContainText("손실")
  await expect(page.getByRole("table")).toContainText("원가 미입력")
  await expect(page.getByRole("table")).toContainText("고마진")
})

test("shipment empty search recovers and SNAP links open evidence", async ({ page }) => {
  await page.goto("/erp/shipments")
  await expect(page.locator("main[aria-busy]")).toHaveAttribute("aria-busy", "false")
  const search = page.getByPlaceholder("거래번호·거래명·B/L·컨테이너·항구·선박 검색")
  await search.fill("존재하지않는선적")
  await expect(page.getByText("검색 조건에 맞는 선적이 없습니다.")).toBeVisible()
  await search.clear()
  await expect(page.getByText("검색 조건에 맞는 선적이 없습니다.")).toHaveCount(0)
  await page.getByRole("button", { name: /^SNAP \d+장$/ }).first().click()
  await expect(page.getByRole("heading", { name: "SNAP 증거함", exact: true })).toBeVisible()
})

test("ERP menus use the available width like the deal detail page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 2560, height: 1440 })
  for (const path of [
    "deals/DL-260701-09",
    "shipments",
    "settlement",
    "monitoring",
    "reports",
    "sales",
  ]) {
    await page.goto(`/erp/${path}`)
    await expect(page.locator("main[aria-busy]")).toHaveAttribute(
      "aria-busy",
      "false"
    )
    const frame = page.locator('[data-ui-layout="page-frame"]').first()
    await expect(frame).toBeVisible()
    const geometry = await frame.evaluate((element) => {
      const frameBounds = element.getBoundingClientRect()
      const parentBounds = element.parentElement!.getBoundingClientRect()
      return {
        frame: frameBounds.width,
        parent: parentBounds.width,
        maxWidth: getComputedStyle(element).maxWidth,
      }
    })
    expect(geometry.maxWidth).toBe("none")
    expect(Math.abs(geometry.frame - geometry.parent)).toBeLessThanOrEqual(1)
  }
})

test("settlement recording opens the selected schedule and stays within the page", async ({ page }) => {
  await page.goto("/erp/settlement")
  const ledger = page.locator("#settlement-ledger")
  for (const [party, action, amount] of [
    ["KATAMAN ASIA-PACIFIC", "지급 기록", "120000"],
    ["ACME GmbH", "입금 기록", "42000"],
  ]) {
    await ledger.getByRole("button", { name: action === "입금 기록" ? "받을 돈" : "보낼 돈", exact: true }).click()
    const row = ledger.getByRole("row").filter({ hasText: party }).first()
    await row.getByRole("button", { name: action, exact: true }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toContainText(party)
    await expect(dialog.getByLabel(action === "입금 기록" ? "입금액" : "지급액", { exact: true })).toHaveValue(amount)
    await expect(page).toHaveURL(/\/erp\/settlement$/)
    await dialog.getByRole("button", { name: "닫기", exact: true }).click()
    await expect(dialog).toHaveCount(0)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await ledger.getByRole("button", { name: "입금 기록", exact: true }).first().click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await expect.poll(async () => {
    const bounds = await dialog.boundingBox()
    return bounds ? bounds.x + bounds.width : Infinity
  }).toBeLessThanOrEqual(390)
  await expect(dialog.getByRole("button", { name: "닫기", exact: true })).toBeInViewport()
})

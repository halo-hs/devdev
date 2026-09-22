import { expect, test } from "@playwright/test"
import { readFileSync } from "node:fs"

const snapSource = JSON.parse(
  readFileSync(
    new URL("./fixtures/snap-source-copy.json", import.meta.url),
    "utf8"
  )
) as { copy: string[]; faq: { question: string; answer: string }[] }

test("SNAP preserves original copy order and all seven FAQ answers", async ({
  page,
}) => {
  await page.goto("/snap")
  await expect(page.locator("#snap-title")).toBeVisible()
  // Source snapshot is captured from the published reference, independently of app data.
  const text = await page.locator("main").evaluate((main) => {
    const copy = main.cloneNode(true) as HTMLElement
    copy
      .querySelectorAll(".ecoya-snap-hero-demo, #snap-workflow-preview")
      .forEach((node) => node.remove())
    return (copy.textContent ?? "").replace(/\s+/g, "")
  })
  let cursor = 0
  for (const original of snapSource.copy) {
    const normalized = original.replace(/\s+/g, "")
    const position = text.indexOf(normalized, cursor)
    expect(
      position,
      `Missing or out of order: ${original}`
    ).toBeGreaterThanOrEqual(cursor)
    cursor = position + normalized.length
  }

  const entries = page.locator("#snap-faq details")
  await expect(entries).toHaveCount(7)
  expect(snapSource.faq).toHaveLength(7)
  for (const [index, original] of snapSource.faq.entries()) {
    const entry = entries.nth(index)
    await expect(entry.locator("summary")).toHaveText(original.question)
    await entry.locator("summary").click()
    await expect(entry.locator("p")).toBeVisible()
    await expect(entry.locator("p")).toHaveText(original.answer)
    await entry.locator("summary").click()
    await expect(entry.locator("p")).not.toBeVisible()
  }
})

for (const width of [1440, 390]) {
  test(`independent marketing pages, active links and auth context at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto("/")
    await expect(page.locator("#brand-title")).toBeVisible()
    await expect(page.locator(".trade-product-demo")).toHaveCount(0)
    await expect(page.locator("#snap-how")).toHaveCount(0)
    const nav = page.getByRole("navigation", { name: "주요 메뉴" })
    await expect(
      nav.getByRole("link", { name: "브랜드 스토리" })
    ).toHaveAttribute("aria-current", "page")
    await nav.getByRole("link", { name: "Trade OS", exact: true }).click()
    await expect(page).toHaveURL(/\/trade-os$/)
    await expect(page.locator("#trade-title")).toBeVisible()
    await expect(page.locator(".trade-product-demo")).toBeVisible()
    await expect(page.locator("#brand-title")).toHaveCount(0)
    await expect(page.locator("#snap-title")).toHaveCount(0)
    await page.reload()
    await expect(page.locator("#trade-title")).toBeVisible()
    await nav.getByRole("link", { name: "SNAP", exact: true }).click()
    await expect(page).toHaveURL(/\/snap$/)
    await expect(page.locator("#snap-title")).toBeVisible()
    await expect(page.locator(".trade-product-demo")).toHaveCount(0)
    await expect(
      nav.getByRole("link", { name: "SNAP", exact: true })
    ).toHaveAttribute("aria-current", "page")
    await expect(
      page
        .locator(".trade-nav-actions")
        .getByRole("link", { name: "로그인", exact: true })
    ).toHaveAttribute("href", "/login?product=snap")
    await page
      .locator(".trade-nav-actions")
      .getByRole("link", { name: "시작하기", exact: true })
      .click()
    await expect(page).toHaveURL(/\/signup\?product=snap$/)
    await page.getByRole("link", { name: "ECOYA 서비스 홈" }).click()
    await expect(page).toHaveURL(/\/snap$/)
    await expect(page.locator("#snap-title")).toBeVisible()
    await nav.getByRole("link", { name: "브랜드 스토리" }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator("#brand-title")).toBeVisible()
    await page.goBack()
    await expect(page.locator("#snap-title")).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
  })
}

test("direct route aliases and SNAP workflow remain usable", async ({
  page,
}) => {
  for (const [path, title] of [
    ["/brand-story/", "#brand-title"],
    ["/trade-os/", "#trade-title"],
    ["/erp/landing", "#trade-title"],
    ["/snap/", "#snap-title"],
  ]) {
    await page.goto(path)
    await expect(page.locator(title)).toBeVisible()
  }
  const workflow = page.getByRole("list", { name: "SNAP 작업 단계" })
  const steps = workflow.getByRole("button")
  const titles = ["말로 지시", "AI가 목록화", "현장에서 촬영", "확인 후 전달"]
  for (let index = 0; index < titles.length; index++) {
    await steps.nth(index).click()
    await expect(steps.nth(index)).toHaveAttribute("aria-pressed", "true")
    await expect(
      page
        .locator("#snap-workflow-preview")
        .getByRole("heading", { name: titles[index] })
    ).toBeVisible()
  }
  await page
    .getByText("컨테이너·무역 전용 서비스인가요?", { exact: true })
    .click()
  await expect(page.locator("details[open]")).toContainText(
    "산업을 가리지 않습니다"
  )
})

for (const width of [1440, 390]) {
  test(`SNAP illustrations are inline without enlargement at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto("/snap")
    const steps = page
      .getByRole("list", { name: "SNAP 작업 단계" })
      .getByRole("button")
    for (let index = 0; index < 4; index++) {
      await steps.nth(index).click()
      await expect(
        page.locator("#snap-workflow-preview").getByRole("img")
      ).toBeVisible()
    }
    await expect(page.getByRole("button", { name: /크게 보기/ })).toHaveCount(0)
    await expect(page.getByRole("dialog")).toHaveCount(0)
    for (const name of [/웹 리포트 일러스트/, /PDF 리포트 일러스트/]) {
      await expect(
        page.locator("#snap-reports").getByRole("img", { name })
      ).toBeVisible()
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
  })

  test(`auth header shares navigation and preserves product at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    for (const product of ["erp", "snap"]) {
      await page.goto(`/login?product=${product}`)
      const header = page.locator(".trade-nav")
      await expect(
        header.getByRole("navigation", { name: "주요 메뉴" }).getByRole("link")
      ).toHaveCount(4)
      await expect(
        header.getByRole("link", { name: "브랜드 스토리" })
      ).toHaveAttribute("href", "/")
      await header.getByRole("link", { name: "시작하기" }).click()
      await expect(page).toHaveURL(new RegExp(`/signup\\?product=${product}$`))
      await expect(page.locator('[data-auth-layout="signup"]')).toBeVisible()
      await header.getByRole("link", { name: "로그인", exact: true }).click()
      await expect(page).toHaveURL(new RegExp(`/login\\?product=${product}$`))
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
    }
  })
}

test("SNAP workflow playback respects manual selection and reduced motion", async ({
  page,
}) => {
  await page.clock.install()
  await page.goto("/snap")
  const workflow = page.locator(".ecoya-snap-workflow")
  await workflow.scrollIntoViewIfNeeded()
  const steps = page
    .getByRole("list", { name: "SNAP 작업 단계" })
    .getByRole("button")
  await expect(workflow).toHaveAttribute("data-running", "true")
  await page.clock.runFor(6300)
  await expect(steps.nth(1)).toHaveAttribute("aria-pressed", "true")
  await steps.nth(2).click()
  await expect(workflow).toHaveAttribute("data-running", "false")
  await page.clock.runFor(6500)
  await expect(steps.nth(2)).toHaveAttribute("aria-pressed", "true")
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.reload()
  await workflow.scrollIntoViewIfNeeded()
  await expect(workflow).toHaveAttribute("data-running", "false")
  await steps.nth(3).click()
  await expect(steps.nth(3)).toHaveAttribute("aria-pressed", "true")
})

test("Trade OS source order, five workflow stages and question examples", async ({
  page,
}) => {
  await page.goto("/trade-os")
  await expect(page.locator("#trade-title")).toBeVisible()
  const sections = await page
    .locator("main > section")
    .evaluateAll((els) => els.map((el) => el.id))
  expect(sections).toEqual([
    "",
    "why",
    "flow",
    "features",
    "settle",
    "ask",
    "cta",
  ])
  const steps = page
    .getByRole("list", { name: "서류 처리 단계" })
    .getByRole("button")
  await expect(steps).toHaveCount(5)
  for (let i = 0; i < 5; i++) {
    await steps.nth(i).click()
    await expect(steps.nth(i)).toHaveAttribute("aria-pressed", "true")
    await expect(page.locator("#trade-workflow-scene")).toHaveAttribute(
      "data-stage",
      `${i}`
    )
  }
  const questions = page
    .getByRole("list", { name: "AI 질의 예시" })
    .getByRole("button")
  for (let i = 0; i < 4; i++) {
    await questions.nth(i).click()
    await expect(questions.nth(i)).toHaveAttribute("aria-pressed", "true")
    await expect(
      page.locator("#trade-question-answer .trade-chat-question")
    ).toHaveText(
      [
        "이번 달 ACME 매출은?",
        "확정 안 된 인보이스 몇 건?",
        "거래처별 미수금 합계는?",
        "7일 내 순현금 흐름은?",
      ][i]
    )
  }
})

for (const width of [1440, 390]) {
  test(`product menu, pricing tabs and product context at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto("/snap")
    const menu = page.getByRole("navigation", { name: "주요 메뉴" })
    await expect(
      menu.getByRole("link", { name: "Trade OS", exact: true })
    ).toHaveAttribute("href", "/trade-os")
    await expect(
      menu.getByRole("link", { name: "SNAP", exact: true })
    ).toHaveAttribute("href", "/snap")
    await expect(
      menu.getByRole("link", { name: "제품 전체 보기" })
    ).toHaveCount(0)
    await menu.getByRole("link", { name: "가격", exact: true }).click()
    await expect(page).toHaveURL(/\/pricing\?product=snap$/)
    await expect(page.getByRole("tab", { name: "ECOYA SNAP" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    await expect(page.locator(".ecoya-plan-price").first()).toContainText(
      "59,000"
    )
    await page.getByRole("tab", { name: "ECOYA SNAP" }).focus()
    await page.keyboard.press("ArrowLeft")
    await expect(
      page.getByRole("tab", { name: "ECOYA Trade OS" })
    ).toBeFocused()
    await expect(page.locator(".ecoya-plan-price").first()).toHaveText("문의")
    await page.reload()
    await expect(
      page.getByRole("tab", { name: "ECOYA Trade OS" })
    ).toHaveAttribute("aria-selected", "true")
    await page.getByRole("tab", { name: "ECOYA SNAP" }).click()
    await page
      .locator(".ecoya-price-card")
      .first()
      .getByRole("link", { name: "시작하기" })
      .click()
    await expect(page).toHaveURL(/\/signup\?product=snap$/)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
  })
}

test("SNAP use cases rotate, pause and honor reduced motion", async ({
  page,
}) => {
  await page.clock.install()
  await page.goto("/snap")
  const rotating = page.locator(".ecoya-rotating-use-text")
  await expect(rotating).toHaveText("안전 점검")
  for (const value of [
    "시공 검측",
    "매장 위생 점검",
    "차량 반납 점검",
    "시설 안전진단",
    "하자 보수",
    "안전 점검",
  ]) {
    await page.clock.runFor(3500)
    await expect(rotating).toHaveText(value)
  }
  await page.getByRole("button", { name: "SNAP 미리보기 일시정지" }).click()
  await page.clock.runFor(7000)
  await expect(rotating).toHaveText("안전 점검")
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.reload()
  await page.clock.runFor(7000)
  await expect(rotating).toHaveText("안전 점검")
  const tabs = page
    .getByRole("group", { name: "SNAP 서비스 미리보기" })
    .getByRole("button")
  await tabs.nth(2).click()
  await expect(tabs.nth(2)).toHaveAttribute("aria-pressed", "true")
  await expect(
    page.locator("#snap-hero-preview").getByRole("img")
  ).toHaveAccessibleName(/작업코드.*사진/)
})

import { expect, test } from "@playwright/test"

for (const width of [1440, 390]) {
  test(`feature playback and horizontal cards at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.clock.install()
    await page.goto("/trade-os")
    const demo = page.locator(".trade-product-demo")
    await demo.scrollIntoViewIfNeeded()
    await expect(demo).toHaveAttribute("data-running", "true")
    const tabs = demo
      .getByRole("group", { name: "업무별 안내" })
      .getByRole("button")
    const panels = demo.locator(".trade-demo-panels")
    const panelBounds = await panels.boundingBox()
    const tabBounds = await demo.locator(".trade-example-tabs").boundingBox()
    expect(tabBounds!.y).toBeGreaterThanOrEqual(
      panelBounds!.y + panelBounds!.height
    )
    await page.clock.runFor(7100)
    await expect(tabs.nth(1)).toHaveAttribute("aria-pressed", "true")
    await expect(demo.locator(".trade-ocr-animation svg")).toHaveCount(1)
    await demo.getByRole("button", { name: "기능 자동 전환 일시정지" }).click()
    await page.clock.runFor(8000)
    await expect(tabs.nth(1)).toHaveAttribute("aria-pressed", "true")
    for (let i = 0; i < 5; i++) {
      await tabs.nth(i).click()
      await expect(tabs.nth(i)).toHaveAttribute("aria-pressed", "true")
      expect((await panels.boundingBox())!.height).toBeCloseTo(
        panelBounds!.height,
        0
      )
      await expect(
        demo.locator('.trade-demo-panel[data-active="true"]')
      ).toBeVisible()
    }
    await demo.getByRole("button", { name: "기능 자동 전환 재생" }).click()
    await page.clock.runFor(7100)
    await expect(tabs.first()).toHaveAttribute("aria-pressed", "true")

    const rail = page.getByRole("region", {
      name: "주요 기능 6개, 가로 스크롤",
    })
    await rail.scrollIntoViewIfNeeded()
    await expect(demo).toHaveAttribute("data-running", "false")
    await page.clock.runFor(8000)
    await expect(tabs.first()).toHaveAttribute("aria-pressed", "true")
    await expect(rail.locator("article")).toHaveCount(6)
    const sizes = await rail
      .locator(".trade-feature-visual")
      .evaluateAll((els) =>
        els.map((el) => ({ width: el.clientWidth, height: el.clientHeight }))
      )
    expect(
      new Set(sizes.map((size) => `${size.width}x${size.height}`)).size
    ).toBe(1)
    const headingX = (await page.locator("#features h2").boundingBox())!.x
    expect(
      (await rail.locator("article").first().boundingBox())!.x
    ).toBeCloseTo(headingX, 0)
    await page.getByRole("button", { name: "다음 기능 보기" }).click()
    await page.clock.runFor(1000)
    await expect
      .poll(() => rail.evaluate((el) => el.scrollLeft))
      .toBeGreaterThan(100)
    await rail.evaluate((el) => (el.scrollLeft = el.scrollWidth))
    await expect(
      rail
        .getByRole("heading", { name: "실시간 시장 지표", exact: true })
        .first()
    ).toBeInViewport()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)

    const upload = page.locator(".trade-upload-showcase")
    await upload.scrollIntoViewIfNeeded()
    await expect(
      upload.getByRole("img", {
        name: "PDF를 올리면 AI가 거래처, 품목, 수량과 금액을 읽고 검토를 기다리는 예시",
      })
    ).toBeVisible()
    await expect(
      upload.getByText("USD 50,820.00", { exact: true })
    ).toBeVisible()
    await expect(
      upload.locator('.trade-upload-lottie [role="img"] svg')
    ).toHaveCount(1)
  })
}

test("reduced motion leaves previews readable and manually selectable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.clock.install()
  await page.goto("/trade-os")
  const demo = page.locator(".trade-product-demo")
  await demo.scrollIntoViewIfNeeded()
  await expect(demo).toHaveAttribute("data-running", "false")
  await page.clock.runFor(9000)
  await expect(
    demo.getByRole("button", { name: "문서 만들기", exact: true })
  ).toHaveAttribute("aria-pressed", "true")
  await demo.getByRole("button", { name: "고객에게 전달", exact: true }).click()
  const active = demo.locator('.trade-demo-panel[data-active="true"]')
  await expect(active.getByText("고객이 서류를 열람했습니다")).toBeVisible()
  expect(
    await active
      .locator(".trade-delivery-log")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName)
  ).toBe("none")
})

test("upload Lottie moves and its pause control stops playback", async ({
  page,
}) => {
  await page.goto("/trade-os")
  const motion = page.locator(".trade-upload-lottie")
  await motion.scrollIntoViewIfNeeded()
  const svg = motion.locator('[role="img"] svg')
  await expect(svg).toHaveCount(1)
  const before = await svg.innerHTML()
  await expect.poll(() => svg.innerHTML()).not.toBe(before)
  await motion
    .getByRole("button", { name: "업로드 애니메이션 일시정지" })
    .click()
  const stopped = await svg.innerHTML()
  await page.waitForTimeout(300)
  expect(await svg.innerHTML()).toBe(stopped)
})

import { expect, test } from "@playwright/test"

for (const width of [1440, 390]) {
  test(`reference home and public forms remain usable at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1100 })
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    for (const route of ["/erp/home", "/login", "/signup"]) {
      await page.goto(route)
      await expect(page.locator("h1").first()).toBeVisible()
      if (route === "/login")
        await expect(
          page.getByRole("heading", { name: "로그인", exact: true })
        ).toHaveCSS("font-size", "26px")
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBeTruthy()
      if (route === "/erp/home") {
        await expect(
          page.getByRole("heading", { name: "진행 현황·받을 돈" })
        ).toBeVisible()
        await expect(
          page.getByRole("heading", { name: "선적 일정", exact: true })
        ).toBeVisible()
      } else {
        await expect(
          page.getByRole("navigation", { name: "법적 고지" })
        ).toBeVisible()
      }
      await page.screenshot({
        path: `/tmp/devdev-reference-${route.replaceAll("/", "-")}-${width}.png`,
        fullPage: true,
      })
    }
    expect(errors).toEqual([])
  })
}

test("account pages share quarter-width illustrated indigo panels and logo alignment", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto("/login")
  const logo = page.getByRole("link", { name: "ECOYA 서비스 홈" })
  const loginBox = await logo.boundingBox()
  expect((await page.locator('[data-auth-layout="login"] aside').boundingBox())?.width).toBe(360)
  await expect(
    page.getByRole("button", { name: "Google로 계속하기" })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Apple로 계속하기" })
  ).toBeVisible()
  await page.goto("/signup")
  const signupBox = await logo.boundingBox()
  expect(signupBox?.x).toBe(loginBox?.x)
  expect(signupBox?.y).toBe(loginBox?.y)
  const aside = page.locator('[data-auth-layout="signup"] aside')
  expect((await aside.boundingBox())?.width).toBe(360)
  const footer = await page
    .getByRole("navigation", { name: "법적 고지" })
    .boundingBox()
  expect(footer!.x).toBeGreaterThanOrEqual(360)
})

test("home opens directly as draggable modules with reference prompts and quick actions", async ({
  page,
}) => {
  await page.goto("/erp/home")
  await expect(
    page.getByRole("button", { name: "질문하기", exact: true })
  ).toBeDisabled()
  await page
    .getByRole("button", { name: "이번 주 받을 돈", exact: true })
    .click()
  await expect(page.getByRole("textbox", { name: "AI에게 질문" })).toHaveValue(
    "이번 주 받을 돈"
  )
  await expect(page.getByRole("textbox", { name: "AI에게 질문" })).toBeFocused()
  await expect(page.getByRole("group", { name: "홈 보기" })).toHaveCount(0)
  await expect(
    page.getByRole("heading", { name: "오늘 업무판", exact: true })
  ).toBeVisible()
  await expect(
    page.locator('[data-module-id] header[draggable="true"]')
  ).toHaveCount(6)
  await page.reload()
  await expect(
    page.getByRole("heading", { name: "오늘 업무판", exact: true })
  ).toBeVisible()
  await page
    .getByRole("button", {
      name: "서류 올리기", exact: true,
    })
    .click()
  await expect(page).toHaveURL(/\/erp\/documents\/upload/)
})

test("member overview excludes owner decisions and financial risk metrics", async ({
  page,
}) => {
  await page.goto("/erp/home?role=member")
  await expect(
    page.getByRole("heading", { name: "진행 현황·받을 돈" })
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "오늘 확인이 필요합니다", exact: true })
  ).toHaveCount(0)
  await expect(
    page.getByText("송장 기준 추정 거래손익", { exact: true })
  ).toHaveCount(0)
  await page
    .getByRole("textbox", { name: "AI에게 질문" })
    .fill("이번 주 받을 돈")
  await page.getByRole("button", { name: "질문하기", exact: true }).click()
  await expect(page).toHaveURL(/\/erp\/ai/)
})

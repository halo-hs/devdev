import { expect, test } from "@playwright/test"

for (const width of [1440, 390]) {
  test(`Trade OS landing auth links and official logo at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto("/trade-os")
    const header = page.locator(".trade-nav")
    const logo = header.getByRole("link", { name: "ECOYA 홈" })
    await expect(logo.locator("img:visible")).toBeVisible()
    await expect
      .poll(() =>
        logo
          .locator("img:visible")
          .evaluate(
            (img: HTMLImageElement) => img.complete && img.naturalWidth > 0
          )
      )
      .toBe(true)
    await header.getByRole("link", { name: "로그인", exact: true }).click()
    await expect(page).toHaveURL(/\/login\?product=erp$/)
    await expect(
      page.getByRole("heading", { name: "로그인", exact: true })
    ).toBeVisible()
    await page.getByRole("button", { name: "회원가입", exact: true }).click()
    await expect(page).toHaveURL(/\/signup\?product=erp$/)
    await page.getByRole("link", { name: "ECOYA 서비스 홈" }).click()
    await expect(page.locator("#brand-title")).toBeVisible()
    await header.getByRole("link", { name: "시작하기", exact: true }).click()
    await expect(page).toHaveURL(/\/signup\?product=erp$/)
    await expect(page.locator('[data-auth-layout="signup"]')).toBeVisible()
  })
}

test("authentication navigation retains each product's home destination", async ({
  page,
}) => {
  for (const product of ["erp", "snap"]) {
    await page.goto(`/login?product=${product}`)
    await page
      .getByRole("button", { name: "비밀번호 찾기", exact: true })
      .click()
    await expect(page).toHaveURL(
      new RegExp(`/password-recovery\\?product=${product}$`)
    )
    const home = page.getByRole("link", { name: "ECOYA 서비스 홈" })
    await expect(home).toHaveAttribute(
      "href",
      product === "erp" ? "/" : "/snap"
    )
    await page
      .locator(".trade-nav-actions")
      .getByRole("link", { name: "로그인", exact: true })
      .click()
    await expect(page).toHaveURL(new RegExp(`/login\\?product=${product}$`))
  }
})

test("ERP entry offers ERP only after the preview login", async ({ page }) => {
  await page.goto("/login?product=erp")
  await page
    .getByRole("textbox", { name: "이메일", exact: true })
    .fill("ecoya@ecoya.kr")
  await page.getByLabel("비밀번호", { exact: true }).fill("ecoya")
  await page
    .locator("form")
    .getByRole("button", { name: "로그인", exact: true })
    .click()
  await expect(page.getByRole("button", { name: "SNAP 열기" })).toHaveCount(0)
  await page.getByRole("button", { name: "ERP 열기" }).click()
  await expect(page).toHaveURL(/\/erp\/home$/)
})

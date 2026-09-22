import { expect, test } from "@playwright/test"

for (const product of ["erp", "snap"]) {
  test(`contact navigation remains on the current site for ${product}`, async ({ page }) => {
    await page.goto(product === "erp" ? "/trade-os" : "/snap")
    await page.locator("header").getByRole("link", { name: "도입 문의", exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/contact\\?product=${product}$`))
    await expect(page.getByRole("heading", { name: "무엇을 도와드릴까요?" })).toBeVisible()
    await expect(page.getByLabel("관심 제품 (선택)")).toHaveValue(product)
    for (const [name, path] of [["Trade OS", "/trade-os"], ["SNAP", "/snap"], ["가격", `/pricing?product=${product}`], ["로그인", `/login?product=${product}`]]) {
      await expect(page.locator("header").getByRole("link", { name, exact: true })).toHaveAttribute("href", path)
    }
    await page.locator("header").getByRole("link", { name: "브랜드 스토리", exact: true }).click()
    await expect(page).toHaveURL(/\/$/)
  })
}

test("contact errors are inline and clear as the fields are corrected", async ({ page }) => {
  await page.goto("/contact")
  await page.evaluate(() => { (window as any).nativeInvalidCount = 0; document.addEventListener("invalid", () => (window as any).nativeInvalidCount++, true) })
  await page.getByRole("button", { name: "이메일로 문의하기" }).click()
  await expect(page.locator("#contact-company-error")).toHaveText("회사명을 입력해 주세요.")
  await expect(page.locator("#contact-company")).toBeFocused()
  await expect(page.locator("#contact-company")).toHaveAttribute("aria-invalid", "true")
  await expect(page.locator("#contact-consent-error")).toBeVisible()
  expect(await page.evaluate(() => (window as any).nativeInvalidCount)).toBe(0)
  await page.locator("#contact-company").fill("ECOYA")
  await expect(page.locator("#contact-company-error")).toHaveCount(0)
  await page.locator("#contact-email").fill("wrong-address")
  await expect(page.locator("#contact-email-error")).toContainText("이메일 주소 형식")
  await page.locator("#contact-email").fill("demo@example.com")
  await expect(page.locator("#contact-email-error")).toHaveCount(0)
  await page.locator('input[name="consent"]').check()
  await expect(page.locator("#contact-consent-error")).toHaveCount(0)
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.locator(".ecoya-contact-form").evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true)
})

test("email and mobile formats are validated on blur without native tooltips", async ({ page }) => {
  await page.goto("/contact")
  const email = page.locator("#contact-email")
  const phone = page.getByLabel("휴대폰 번호 (선택)")
  for (const value of ["wrong", "user@company", "user@@company.com", "user name@company.com"]) {
    await email.fill(value)
    await email.blur()
    await expect(page.locator("#contact-email-error")).toContainText("이메일 주소 형식")
    await expect(email).toHaveAttribute("aria-invalid", "true")
  }
  await email.fill("name+sales@company.co.kr")
  await expect(page.locator("#contact-email-error")).toHaveCount(0)
  for (const value of ["abcdef", "12345678901", "010-123-4567", "010-1234-56789", "02-1234-5678"]) {
    await phone.fill(value)
    await phone.blur()
    await expect(page.locator("#contact-phone-error")).toContainText("휴대폰 번호 형식")
    await expect(phone).toHaveAttribute("aria-invalid", "true")
  }
  for (const value of ["010-1234-5678", "01012345678", "010 1234 5678", ""]) {
    await phone.fill(value)
    await phone.blur()
    await expect(page.locator("#contact-phone-error")).toHaveCount(0)
    await expect(phone).toHaveAttribute("aria-invalid", "false")
  }
  // Valid required fields cannot bypass a malformed optional phone on submit.
  await page.locator("#contact-company").fill("ECOYA")
  await page.locator("#contact-name").fill("홍길동")
  await page.locator("#contact-message").fill("도입 문의")
  await page.locator('input[name="consent"]').check()
  await phone.fill("invalid-phone")
  await page.getByRole("button", { name: "이메일로 문의하기" }).click()
  await expect(phone).toBeFocused()
  await expect(page.locator("#contact-phone-error")).toBeVisible()
  await expect(page.locator(".ecoya-contact-email-note")).not.toHaveAttribute("role", "status")
})

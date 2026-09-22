import { expect, test } from "@playwright/test"

for (const width of [1440, 390]) {
  test(`login validates inline, focuses invalid field and clears errors at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto("/login?returnTo=usage")
    const form = page.locator("form")
    await expect(form).toHaveAttribute("novalidate", "")
    await expect(form.getByRole("status")).toContainText("로그인 후 확인")
    await page.getByRole("button", { name: "로그인", exact: true }).click()
    const email = page.getByLabel("이메일", { exact: true })
    await expect(email).toBeFocused()
    await expect(email).toHaveAttribute("aria-invalid", "true")
    await expect(email).toHaveAccessibleDescription("이메일을 입력해 주세요.")
    await email.fill("ssdsds")
    await page.getByLabel("비밀번호", { exact: true }).fill("bad")
    await page.getByRole("button", { name: "로그인", exact: true }).click()
    await expect(email).toHaveAccessibleDescription(/이메일 주소 형식/)
    const message = page.getByText(
      "이메일 주소 형식을 확인해 주세요. 예: name@company.com",
      { exact: true }
    )
    expect((await message.boundingBox())!.y).toBeGreaterThan(
      (await email.boundingBox())!.y
    )
    await expect(email).toHaveCSS("font-size", "16px")
    await expect(email).toBeFocused()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBeTruthy()
    await page.screenshot({
      path: `/tmp/auth-email-error-${width}.png`,
      fullPage: true,
    })
    await email.fill("wrong@example.com")
    await expect(email).toHaveAttribute("aria-invalid", "false")
    await expect(message).toHaveCount(0)
    await page.getByRole("button", { name: "로그인", exact: true }).click()
    await expect(
      form.getByRole("alert").filter({ hasText: "로그인 정보를 확인" })
    ).toBeVisible()
    await expect(page.getByRole("button", { name: "ERP 열기" })).toHaveCount(0)
  })
}

test("signup validates account before organization and preserves indigo through each step", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto("/signup")
  await expect(page.getByLabel("조직명", { exact: true })).toHaveCount(0)
  await page.getByRole("button", { name: "계정 만들기", exact: true }).click()
  await expect(page.getByLabel("이메일", { exact: true })).toBeFocused()
  await expect(page.getByRole("alert")).toHaveCount(3)
  await page.getByLabel("이메일", { exact: true }).fill("qa@example.com")
  await page.getByLabel("비밀번호", { exact: true }).fill("short")
  await page.getByLabel("비밀번호 확인", { exact: true }).fill("different")
  await expect(
    page.getByLabel("비밀번호", { exact: true })
  ).toHaveAccessibleDescription("비밀번호는 8자 이상 입력해 주세요.")
  await expect(
    page.getByLabel("비밀번호 확인", { exact: true })
  ).toHaveAccessibleDescription("비밀번호가 일치하지 않습니다.")
  await page.getByLabel("비밀번호", { exact: true }).fill("correct-password")
  await page
    .getByLabel("비밀번호 확인", { exact: true })
    .fill("correct-password")
  await page.getByRole("button", { name: "계정 만들기", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "이메일 인증이 필요합니다" })
  ).toBeVisible()
  await expect(page.getByText("qa@example.com", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "인증을 완료했습니다" }).click()
  await page.getByRole("button", { name: "조직 만들기", exact: true }).click()
  await expect(page.getByLabel("조직명", { exact: true })).toBeFocused()
  await page.getByLabel("조직명", { exact: true }).fill("ECOYA QA")
  await page.getByRole("button", { name: "조직 만들기", exact: true }).click()
  await expect(page.getByRole("status")).toContainText(
    "계정과 조직 준비가 완료"
  )
  await expect(page.locator('[data-auth-layout="signup"] aside')).toHaveCount(1)
  await page.getByRole("button", { name: "업무 시작하기" }).click()
  await expect(page).toHaveURL(/\/erp\/home/)
})

test("login page errors never turn into organization absence or product access", async ({
  page,
}) => {
  await page.goto("/login?preview=1")
  for (const [option, copy] of [
    ["네트워크 오류", "연결하지 못했습니다"],
    ["계정·조직 조회 오류", "계정과 조직 정보를 불러오지 못했습니다"],
    ["로그인 시도 제한", "로그인 시도가 너무 많습니다"],
  ]) {
    await page.getByRole("combobox", { name: "로그인 데모 상태" }).click()
    await page.getByRole("option", { name: option, exact: true }).click()
    await expect(page.getByText(copy, { exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: "ERP 열기" })).toHaveCount(0)
    await expect(
      page.getByText("연결된 조직이 없습니다", { exact: true })
    ).toHaveCount(0)
  }
})

test("signup social error retains account form with action-based consent", async ({
  page,
}) => {
  await page.goto("/signup")
  await page.getByRole("button", { name: "Google로 계속", exact: true }).click()
  await expect(page.getByRole("checkbox")).toHaveCount(0)
  await expect(
    page.getByText(/계정 만들기 또는 Google로 계속하면/)
  ).toBeVisible()
  await expect(
    page.getByRole("alert").filter({ hasText: "Google에 연결하지 못했습니다" })
  ).toBeVisible()
  await expect(page.getByLabel("이메일", { exact: true })).toBeVisible()
  await expect(page.getByLabel("조직명", { exact: true })).toHaveCount(0)
})

test("signup failures preserve inputs and offer recovery without completion", async ({
  page,
}) => {
  await page.goto("/signup?preview=1")
  await page.getByLabel("이메일", { exact: true }).fill("kept@example.com")
  await page.getByText("가입 결과 미리보기", { exact: true }).first().click()
  for (const option of ["계정 생성 오류", "가입 연결 오류", "약관 조회 오류"]) {
    await page.getByRole("combobox", { name: "가입 결과 미리보기" }).click()
    await page.getByRole("option", { name: option, exact: true }).click()
    await expect(page.getByRole("alert")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "계정 만들기", exact: true })
    ).toHaveCount(0)
    await expect(
      page.getByText("계정과 조직 준비가 완료됐습니다.", { exact: true })
    ).toHaveCount(0)
    await page.getByRole("button", { name: "가입 화면으로 돌아가기" }).click()
    await expect(page.getByLabel("이메일", { exact: true })).toHaveValue(
      "kept@example.com"
    )
  }
})

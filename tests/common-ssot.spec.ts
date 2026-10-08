import { expect, test, type Page } from "@playwright/test"

async function fillSignup(page: Page, password = "secret12") {
  await page.getByLabel("이메일", { exact: true }).fill("member@example.com")
  await page.locator('input[autocomplete="new-password"]').nth(0).fill(password)
  await page.locator('input[autocomplete="new-password"]').nth(1).fill(password)
}

test("public header and footer links navigate, and usage continues after login", async ({
  page,
}) => {
  for (const [name, path] of [
    ["서비스", "/snap"],
    ["요금제", "/pricing"],
    ["이용약관", "/legal/terms"],
    ["개인정보처리방침", "/legal/privacy"],
    ["위치기반 서비스 이용약관", "/legal/location"],
  ]) {
    await page.goto("/snap")
    const navigation = page.getByRole("navigation", {
      name: path.startsWith("/legal") ? "법적 고지" : "공개 페이지",
      exact: true,
    })
    await navigation.getByRole("link", { name, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`${path}$`))
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible()
  }
  await page.goto("/snap")
  await page.getByRole("link", { name: "이용내역", exact: true }).click()
  await expect(page.locator("form").getByRole("status")).toContainText(
    "로그인 후 확인"
  )
  await page.getByLabel("이메일", { exact: true }).fill("ecoya@ecoya.kr")
  await page.locator('input[type="password"]').fill("ecoya")
  await page.getByRole("button", { name: "로그인", exact: true }).click()
  await page.getByRole("button", { name: "ERP 열기" }).click()
  await expect(page).toHaveURL(/section=organization/)
  await expect(
    page.getByRole("heading", { name: "조직 정보", exact: true })
  ).toBeVisible()
})

test("public login clears rejected credentials and offers recovery without product navigation", async ({
  page,
}) => {
  await page.goto("/login")
  await expect(page.getByRole("navigation", { name: "설정 메뉴" })).toHaveCount(
    0
  )
  await page.getByLabel("이메일", { exact: true }).fill("wrong@example.com")
  await page.locator('input[type="password"]').fill("wrong-password")
  await page.getByRole("button", { name: "로그인", exact: true }).click()
  await expect(
    page.getByRole("alert").filter({ hasText: "로그인 정보를 확인" })
  ).toBeVisible()
  await expect(page.locator('input[type="password"]')).toHaveValue("")
  await expect(page.getByRole("button", { name: "ERP 열기" })).toHaveCount(0)
  await page.getByRole("button", { name: "비밀번호 찾기" }).click()
  await expect(page).toHaveURL(/password-recovery/)
  await page.goBack()
  await expect(page).toHaveURL(/login/)
})

test("trial opens signup with account validation before organization setup", async ({ page }) => {
  await page.goto("/free-trial")
  await expect(page.getByText("30일").first()).toBeVisible()
  await expect(page.getByText("최대 3명").first()).toBeVisible()
  await expect(page.getByText("크레딧")).toHaveCount(0)
  await page.getByRole("button", { name: "SNAP 가입하기" }).click()
  await expect(page.getByLabel("조직명", { exact: true })).toHaveCount(0)
  await fillSignup(page, "secret")
  await page.getByRole("button", {name:"계정 만들기",exact:true}).click()
  await expect(page.getByLabel("비밀번호",{exact:true})).toHaveAttribute("aria-invalid","true")
  await fillSignup(page)
  await page.getByRole("button", {name:"계정 만들기",exact:true}).click()
  await expect(page.getByRole("heading",{name:"이메일 인증이 필요합니다"})).toBeVisible()
})

test("legal links open separately and signup retains entered account values", async ({ page }) => {
  await page.goto("/signup")
  await fillSignup(page)
  const popupPromise=page.waitForEvent("popup")
  await page.locator('[data-auth-layout="signup"] a[target="_blank"][href="/legal/terms"]').click()
  const popup=await popupPromise
  await expect(popup.getByRole("heading",{name:"이용약관",exact:true})).toBeVisible()
  await popup.close()
  await expect(page.getByLabel("이메일",{exact:true})).toHaveValue("member@example.com")
  await page.getByRole("button",{name:"계정 만들기",exact:true}).click()
  await page.getByRole("button",{name:"인증을 완료했습니다"}).click()
  await page.getByLabel("조직명",{exact:true}).fill("검증 회사")
  await page.getByRole("button",{name:"조직 만들기",exact:true}).click()
  await expect(page.getByRole("status")).toContainText("계정과 조직 준비가 완료")
})

test("partial signup resumes organization setup without recreating the account", async ({ page }) => {
  await page.goto("/signup?product=snap&preview=1")
  await page.locator("summary").click()
  await page.getByRole("combobox",{name:"가입 결과 미리보기"}).click()
  await page.getByRole("option",{name:"계정 생성 후 조직 준비 실패"}).click()
  await page.getByRole("button",{name:"조직 설정 다시 시도"}).click()
  await expect(page.getByRole("heading",{name:"조직 만들기",exact:true})).toBeVisible()
  await expect(page.locator('input[autocomplete="new-password"]')).toHaveCount(0)
  await page.getByLabel("조직명",{exact:true}).fill("이어 만든 회사")
  await page.getByRole("button",{name:"조직 만들기",exact:true}).click()
  await expect(page.getByRole("status")).toContainText("계정과 조직 준비가 완료")
})

test("recovery gives the same response and expired links offer reissue", async ({
  page,
}) => {
  const responses = []
  for (const email of ["ecoya@ecoya.kr", "unknown@example.com"]) {
    await page.goto("/password-recovery?preview=1")
    await page.getByLabel("이메일", { exact: true }).fill(email)
    await page.getByRole("button", { name: "복구 링크 보내기" }).click()
    responses.push(await page.getByRole("status").textContent())
  }
  expect(responses[0]).toBe(responses[1])
  await page.getByRole("button", { name: "복구 링크 데모 열기" }).click()
  await page.getByRole("button", { name: "만료 링크 상태 보기" }).click()
  await expect(page.getByRole("alert")).toContainText("복구 링크가 만료")
  await expect(page.getByRole("button", { name: "새 링크 요청" })).toBeVisible()
})

test("billing legacy URLs stay inside settings and member cannot view invoices", async ({
  page,
}) => {
  await page.goto("/erp/settings/billing?role=member")
  await expect(page).toHaveURL(/\/erp\/settings\?role=member&section=billing/)
  await expect(page.getByRole("heading", { name: "제품 및 구독", exact: true })).toBeVisible()
  await expect(page.getByRole("heading", { name: "금융 상태·인보이스" })).toHaveCount(0)
  await expect(page.getByText("240,000 KRW", { exact: true })).toHaveCount(0)
  await page.goto("/erp/settings/token-usage")
  await expect(page).toHaveURL(/section=credits/)
  await expect(page.getByRole("heading", { name: "내 크레딧 사용량", exact: true })).toBeVisible()
  await page.goto("/erp/settings?section=trade-usage")
  await expect(page).toHaveURL(/section=credits/)
  await expect(
    page.getByRole("navigation", { name: "설정 메뉴" })
  ).toBeVisible()
})

test("SNAP usage directs commercial changes to common product subscriptions", async ({ page }) => {
  await page.goto("/erp/settings?section=snap-usage")
  await expect(page.getByRole("button", { name: "크레딧 충전", exact: true })).toHaveCount(0)
  await expect(page.getByText("18.4", { exact: true })).toHaveCount(0)
  await page.getByRole("button", { name: "제품 및 구독 보기", exact: true }).click()
  await expect(page).toHaveURL(/section=products/)
  await expect(page.getByRole("heading", { name: "제품 및 구독", exact: true })).toBeVisible()
})

test("entitlement changes hide product menus and product data immediately", async ({
  page,
}) => {
  await page.goto("/login?section=snap-data")
  const render = async (products: string[]) =>
    page.evaluate(async (value) => {
      const modulePath = "/tests/fixtures/common-settings.tsx"
      const fixture = await import(modulePath)
      fixture.renderSettings(value)
    }, products)
  await render(["erp"])
  const nav = page.getByRole("navigation", { name: "설정 메뉴" })
  await expect(
    nav.getByRole("button", { name: "알림 설정", exact: true })
  ).toBeVisible()
  await expect(
    nav.getByRole("button", { name: "사용량 및 기술 한도", exact: true })
  ).toHaveCount(0)
  await expect(page.getByRole("heading", { name: "데이터 저장" })).toHaveCount(
    0
  )
  await render(["snap"])
  await expect(
    nav.getByRole("button", { name: "알림 설정", exact: true })
  ).toHaveCount(0)
  await expect(nav.getByText("알림 설정", { exact: true })).toHaveCount(0)
  await nav.getByRole("button", { name: "데이터 및 보존", exact: true }).click()
  await expect(page.getByRole("heading", { name: "데이터 저장" })).toBeVisible()
  await render(["erp"])
  await expect(page.getByRole("heading", { name: "데이터 저장" })).toHaveCount(
    0
  )
  await expect(
    page.getByRole("heading", { name: "내 계정", exact: true, level: 1 })
  ).toBeVisible()
  await render(["erp", "snap"])
  await expect(nav.getByRole("button")).toHaveText([
    "내 계정", "소속 Organization", "조직 정보", "사용자 관리", "제품 및 구독", "빌링 ↗",
    "업무 기본 설정", "이메일로 문서 받기", "거래처 일괄 등록", "거래 일괄 등록", "거래처 별칭 학습", "알림 설정",
    "현장 운영", "브랜딩", "지역화", "데이터 및 보존", "사용량 및 기술 한도",
  ])
})

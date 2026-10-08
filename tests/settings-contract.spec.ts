import { expect, test, type Page } from "@playwright/test"

async function openSettings(
  page: Page,
  role = "owner",
  section = "members",
  products = ["erp", "snap"]
) {
  await page.goto(`/login?section=${section}`)
  await page.evaluate(
    async ({ role, products }) => {
      const path = "/tests/fixtures/common-settings.tsx"
      const fixture = await import(path)
      fixture.renderSettings(products, role)
    },
    { role, products }
  )
  await expect(page.locator("main")).toBeVisible()
}

function memberRow(page: Page, name: string) {
  return page.getByRole("row", { name, exact: true })
}
async function seatCounts(
  page: Page,
  product: string,
  total: number,
  assigned: number,
  available: number
) {
  const summary = page.getByRole("region", {
    name: `${product} 좌석`,
    exact: true,
  })
  await expect(
    summary.getByText("전체", { exact: true }).locator("..")
  ).toContainText(String(total))
  await expect(
    summary.getByText("배정됨", { exact: true }).locator("..")
  ).toContainText(String(assigned))
  await expect(
    summary.getByText("배정 가능", { exact: true }).locator("..")
  ).toContainText(String(available))
}

test("final settings IA separates organization, members and Trade OS defaults; direct links survive reload", async ({
  page,
}) => {
  await page.goto("/erp/settings?section=organization")
  await expect(
    page.getByRole("heading", { name: "조직 정보", exact: true })
  ).toBeVisible()
  await page.getByRole("button", { name: "프로필 메뉴" }).click()
  await expect(page.getByText("10회 남음")).toHaveCount(0)
  await expect(page.getByText("7일 남음")).toHaveCount(0)
  await page.keyboard.press("Escape")
  await expect(
    page.getByRole("heading", { name: "사용자 관리", exact: true })
  ).toHaveCount(0)
  await expect(
    page.getByRole("heading", { name: "업무 기본 설정", exact: true })
  ).toHaveCount(0)
  await page.getByRole("button", { name: "사용자 관리", exact: true }).click()
  await expect(page).toHaveURL(/section=members/)
  await page.reload()
  await expect(
    page.getByRole("heading", { name: "사용자 관리", exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "SNAP 멤버 관리", exact: true })
  ).toHaveCount(0)
  await expect(page.locator("body")).not.toContainText("OWNER · 편집 가능")
  await seatCounts(page, "SNAP", 5, 1, 4)
})

test("brand color picker and HEX value stay in sync with role access", async ({ page }) => {
  await openSettings(page, "owner", "trade-defaults")
  await page.getByLabel("승인 색상 선택", { exact: true }).fill("#b45280")
  await expect(page.getByLabel("승인 색상 코드", { exact: true })).toHaveValue("#b45280")
  await page.getByRole("button", { name: "브랜딩", exact: true }).click()
  await page.getByLabel("브랜드 색상 코드", { exact: true }).fill("#12aabc")
  await expect(page.getByLabel("브랜드 색상 선택", { exact: true })).toHaveValue("#12aabc")
  await openSettings(page, "member", "trade-defaults")
  await expect(page.getByLabel("승인 색상 선택", { exact: true })).toBeDisabled()
  await page.getByRole("button", { name: "브랜딩", exact: true }).click()
  await expect(page.getByLabel("브랜드 색상 선택", { exact: true })).toBeDisabled()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByLabel("브랜드 색상 코드", { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})

test("approval keeps the reviewed member visible and updates seat counts without changing purchase capacity", async ({
  page,
}) => {
  await openSettings(page)
  await page.getByRole("button", { name: "요청 확인", exact: true }).click()
  await expect(memberRow(page, "조민영")).toHaveCount(0)
  const member = memberRow(page, "박서윤")
  await expect(
    member.getByRole("button", { name: "박서윤 SNAP", exact: true })
  ).toHaveCount(0)
  await member.getByRole("button", { name: "승인", exact: true }).click()
  await expect(member).toBeVisible()
  await expect(member).toContainText("승인했어요")
  await expect(
    page.getByText("권한 요청 대기 0건", { exact: true })
  ).toBeVisible()
  await seatCounts(page, "SNAP", 5, 2, 3)
  await member.getByRole("button", { name: "박서윤 SNAP", exact: true }).click()
  await page.getByRole("menuitem", { name: "시트 회수", exact: true }).click()
  await seatCounts(page, "SNAP", 5, 1, 4)
  await page
    .getByRole("button", { name: "전체 멤버 보기", exact: true })
    .click()
  await expect(memberRow(page, "조민영")).toBeVisible()
})

test("admin can assign own unused seat, cannot revoke it or edit another admin role, and reads invoices", async ({
  page,
}) => {
  await openSettings(page, "admin")
  await expect(
    page.getByRole("button", { name: "빌링 (새 탭에서 열림)" })
  ).toHaveCount(0)
  await expect(page.getByLabel("박서윤 역할", { exact: true })).toBeDisabled()
  await expect(page.getByRole("button", { name: "조민영 더보기" })).toHaveCount(
    0
  )
  await page.getByRole("button", { name: "김도현 SNAP", exact: true }).click()
  await page
    .getByRole("menuitem", { name: "Standard 시트 배정", exact: true })
    .click()
  await seatCounts(page, "SNAP", 5, 2, 3)
  await expect(
    page.getByRole("button", { name: "김도현 SNAP", exact: true })
  ).toHaveCount(0)
  await memberRow(page, "박서윤")
    .getByRole("button", { name: "거절", exact: true })
    .click()
  await page.getByRole("button", { name: "제품 및 구독", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "인보이스", exact: true })
  ).toBeVisible()
  await expect(page.getByText("금액·다음 결제일: 확인 필요")).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "요금제 변경", exact: true })
  ).toHaveCount(0)
  await seatCounts(page, "SNAP", 5, 2, 3)
})

test("member cannot enter user management or see invoices and can cancel own access request", async ({
  page,
}) => {
  await openSettings(page, "member")
  await expect(
    page.getByRole("button", { name: "사용자 관리", exact: true })
  ).toHaveCount(0)
  await expect(page.getByText("seoyun@ecoya.app", { exact: true })).toHaveCount(
    0
  )
  await page.getByRole("button", { name: "제품 및 구독", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "금융 상태·인보이스" })
  ).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "요금제 변경", exact: true })
  ).toHaveCount(0)
  await page.getByRole("button", { name: "요청 취소", exact: true }).click()
  await expect(page.getByText("대기 중인 요청이 없습니다.")).toBeVisible()
})

test("billing, invitation, removal and global logout do not claim unconfirmed server completion", async ({
  page,
}) => {
  await openSettings(page)
  const popups: Page[] = []
  page.on("popup", (p) => popups.push(p))
  await page
    .getByRole("button", { name: "빌링 (새 탭에서 열림)", exact: true })
    .click()
  await expect(page.getByRole("alert")).toContainText(
    "서버가 연결되어 있지 않습니다"
  )
  await expect(page).toHaveURL(/section=members/)
  expect(popups).toHaveLength(0)
  await page.getByRole("button", { name: "닫기", exact: true }).click()
  await page.getByRole("button", { name: "멤버 초대", exact: true }).click()
  await page
    .getByLabel("초대 이메일", { exact: true })
    .fill("member@example.com")
  await page
    .getByRole("button", { name: "초대 이메일 발송", exact: true })
    .click()
  await expect(page.getByRole("alert")).toContainText(
    "초대를 보내지 못했습니다"
  )
  for (const action of ["모든 곳에서 로그아웃", "조직에서 제거"]) {
    await page
      .getByRole("button", { name: "박서윤 더보기", exact: true })
      .click()
    await page.getByRole("menuitem", { name: action, exact: true }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toContainText(
      action === "조직에서 제거"
        ? "구매 시트 수·요금은 유지"
        : "다른 조직의 로그인 세션도 종료됩니다"
    )
    await dialog
      .getByRole("button", {
        name: action === "조직에서 제거" ? "제거" : "로그아웃 실행",
        exact: true,
      })
      .click()
    await expect(dialog.getByRole("alert")).toContainText("처리하지 않았습니다")
    await dialog.getByRole("button", { name: "취소", exact: true }).click()
  }
  await expect(memberRow(page, "박서윤")).toBeVisible()
})

test("plan changes use a page, enforce bundle capacity and never change purchased seats before provider confirmation", async ({
  page,
}) => {
  await openSettings(page, "owner", "products")
  await page.getByRole("button", { name: "요금제 변경", exact: true }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(page.getByLabel("구매 시트 수")).toHaveValue("8")
  for (const invalid of ["4", "8.5"]) {
    await page.getByLabel("구매 시트 수").fill(invalid)
    await expect(
      page.getByRole("button", { name: "예상 금액 확인", exact: true })
    ).toBeDisabled()
  }
  await page.getByLabel("구매 시트 수").fill("9")
  await page
    .getByRole("button", { name: "예상 금액 확인", exact: true })
    .click()
  await expect(page.getByRole("status")).toContainText(
    "구매·요청은 변경되지 않았습니다"
  )
  await page.getByRole("button", { name: "닫기", exact: true }).click()
  await seatCounts(page, "Trade OS", 8, 3, 5)
})

test("SNAP-only organization has common user management and subscriptions", async ({
  page,
}) => {
  await openSettings(page, "owner", "members", ["snap"])
  await expect(
    page.getByRole("heading", { name: "사용자 관리", exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("region", { name: "Trade OS 좌석", exact: true })
  ).toHaveCount(0)
  await expect(
    page.getByRole("region", { name: "SNAP 좌석", exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "업무 기본 설정", exact: true })
  ).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "제품 및 구독", exact: true })
  ).toBeVisible()
})

test("mobile members use cards, retain seat actions and fit the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/erp/settings?section=members")
  await expect(
    page.getByRole("heading", { name: "사용자 관리", exact: true })
  ).toBeVisible()
  await memberRow(page, "박서윤")
    .getByRole("button", { name: "승인", exact: true })
    .click()
  await expect(memberRow(page, "박서윤")).toContainText("승인했어요")
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(390)
  const rect = await memberRow(page, "박서윤").boundingBox()
  expect(rect!.width).toBeLessThanOrEqual(390)
})

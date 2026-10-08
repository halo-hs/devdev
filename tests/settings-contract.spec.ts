import { expect, test, type Page } from "@playwright/test"
import type { SubscriptionDisplayStatus } from "../share/settings/page"

async function openSettings(
  page: Page,
  role = "owner",
  section = "members",
  products = ["erp", "snap"],
  subscriptionKind: "separate" | "bundle" = "separate",
  subscriptionStates: Partial<Record<"erp" | "snap" | "bundle", SubscriptionDisplayStatus>> = {}
) {
  await page.goto(`/login?section=${section}`)
  await page.evaluate(
    async ({ role, products, subscriptionKind, subscriptionStates }) => {
      const path = "/tests/fixtures/common-settings.tsx"
      const fixture = await import(path)
      fixture.renderSettings(products, role, subscriptionKind, subscriptionStates)
    },
    { role, products, subscriptionKind, subscriptionStates }
  )
  await expect(page.locator("main").first()).toBeVisible()
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
  const subscriptionSummary = page.getByRole("region", {
    name: `${product} 이용 상태`,
    exact: true,
  })
  if (await subscriptionSummary.count()) {
    await expect(subscriptionSummary).toContainText(`구매 ${total}`)
    await expect(subscriptionSummary).toContainText(`배정 ${assigned}`)
    await expect(subscriptionSummary).toContainText(`남음 ${available}`)
    return
  }
  const summary = page.getByRole("region", {
    name: `${product} 좌석`,
    exact: true,
  })
  if (await summary.getByText("전체", { exact: true }).count() === 0) {
    if ((await summary.locator("span").first().textContent())?.includes("구매")) {
      await expect(summary).toContainText(`구매 ${total}`)
      await expect(summary).toContainText(`배정 ${assigned}`)
      await expect(summary).toContainText(`남음 ${available}`)
    } else {
      await expect(summary.locator("span").nth(0)).toHaveText(String(total))
      await expect(summary.locator("span").nth(1)).toHaveText(String(assigned))
      await expect(summary.locator("span").nth(2)).toHaveText(String(available))
    }
    return
  }
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

test("member invite starts with free View and offers active product seat types", async ({ page }) => {
  await openSettings(page, "owner", "members", ["erp", "snap"])
  await expect(page.getByRole("button", { name: "시트 추가" })).toHaveCount(0)
  await page.getByRole("button", { name: "멤버 초대" }).click()
  const seatType = page.getByLabel("시트 유형")
  await expect(seatType).toHaveValue("view")
  await expect(page.getByRole("status").filter({ hasText: "View는 무료입니다" })).toBeVisible()
  await seatType.selectOption("both")
  await expect(page.getByRole("status").filter({ hasText: "현재 구매된 시트" })).toBeVisible()
  await openSettings(page, "admin", "members", ["erp"])
  await page.getByRole("button", { name: "멤버 초대" }).click()
  await expect(page.getByLabel("초대 역할")).toHaveValue("member")
  await expect(page.getByLabel("초대 역할").locator("option")).toHaveText(["MEMBER"])
  await expect(page.getByLabel("시트 유형").locator('option[value="snap"]')).toHaveCount(0)
  await expect(page.getByLabel("시트 유형").locator('option[value="both"]')).toHaveCount(0)
})

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

test("settings content centers forms and wider management pages at responsive maximums", async ({ page }) => {
  for (const width of [1280, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await openSettings(page, "owner", "account")
    const settingsWidth = await page.locator('[data-ui="settings-content"]').evaluate((element) => element.getBoundingClientRect().width)
    expect(settingsWidth).toBe(960)

    await page.getByRole("button", { name: "사용자 관리", exact: true }).click()
    const membersWidth = await page.locator('[data-ui="settings-content"]').evaluate((element) => element.getBoundingClientRect().width)
    expect(membersWidth).toBeGreaterThan(settingsWidth)
    expect(membersWidth).toBeLessThanOrEqual(1120)

    await page.getByRole("button", { name: "제품 및 구독", exact: true }).click()
    const productsWidth = await page.locator('[data-ui="settings-content"]').evaluate((element) => element.getBoundingClientRect().width)
    expect(productsWidth).toBeGreaterThan(settingsWidth)
    expect(productsWidth).toBeLessThanOrEqual(1120)
    if (width === 1440) expect(productsWidth).toBe(1120)
  }

  await page.setViewportSize({ width: 390, height: 844 })
  await openSettings(page, "owner", "account")
  const mobileWidth = await page.locator('[data-ui="settings-content"]').evaluate((element) => element.getBoundingClientRect().width)
  expect(mobileWidth).toBe(390)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
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

test("last owner has a fixed role without alternative options and only owner sees billing", async ({ page }) => {
  for (const role of ["owner", "admin"]) {
    await openSettings(page, role)
    const owner = memberRow(page, "조민영")
    await expect(owner.getByLabel("조민영 역할", { exact: true })).toHaveText("OWNER")
    await expect(owner.getByRole("combobox")).toHaveCount(0)
    await expect(owner.getByText("마지막 오너 · 역할 변경 불가", { exact: true })).toBeVisible()
    await expect(owner.getByRole("button", { name: "조민영 더보기" })).toHaveCount(0)
    await expect(page.getByRole("button", { name: "빌링 (새 탭에서 열림)", exact: true })).toHaveCount(role === "owner" ? 1 : 0)
    await page.getByLabel("이름 또는 이메일 검색", { exact: true }).fill("조민영")
    await expect(owner.getByText("마지막 오너 · 역할 변경 불가", { exact: true })).toBeVisible()
  }
})

test("admin can assign own and member seats, cannot revoke own seat or edit roles, and reads invoices", async ({
  page,
}) => {
  await openSettings(page, "admin")
  await expect(
    page.getByRole("button", { name: "빌링 (새 탭에서 열림)" })
  ).toHaveCount(0)
  await expect(page.getByLabel("박서윤 역할", { exact: true })).toHaveText("MEMBER")
  await expect(memberRow(page, "박서윤").getByRole("combobox")).toHaveCount(0)
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
    .getByRole("button", { name: "승인", exact: true })
    .click()
  await seatCounts(page, "SNAP", 5, 3, 2)
  await page.getByRole("button", { name: "제품 및 구독", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "인보이스", exact: true })
  ).toBeVisible()
  await expect(page.getByText("금액·다음 결제일: 확인 필요")).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "요금제 변경", exact: true })
  ).toHaveCount(0)
  await seatCounts(page, "SNAP", 5, 3, 2)
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

test("plan changes show seat and billing context without an extra preview action", async ({
  page,
}) => {
  await page.goto("/erp/settings?section=products&plan=1&product=erp")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(page.getByLabel("구매 시트 수")).toHaveValue("8")
  for (const invalid of ["4", "8.5"]) {
    await page.getByLabel("구매 시트 수").fill(invalid)
    await expect(
      page.getByRole("button", { name: "변경 확정", exact: true })
    ).toBeDisabled()
  }
  await page.getByLabel("구매 시트 수").fill("9")
  await expect(page.getByLabel("변경 내용", { exact: true })).toContainText("Trade OS 8석→9석")
  await expect(page.getByLabel("변경 내용", { exact: true })).toContainText("다음 인보이스에 청구")
  await expect(page.getByLabel("변경 내용", { exact: true })).toContainText("다음 청구 예정 금액")
  await expect(page.getByRole("button", { name: "변경 확정", exact: true })).toBeDisabled()
  await expect(page.getByRole("note").filter({ hasText: "예상 금액을 불러올 수 없어" })).toContainText("구매 시트는 그대로 유지됩니다")
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
  await openSettings(page, "owner", "members")
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
  await openSettings(page, "owner", "products")
  await expect(page.getByRole("region", { name: "내 플랜" })).toBeVisible()
  await expect(page.getByRole("region", { name: "구독 상품" })).toHaveCount(0)
  await expect(page.getByRole("region", { name: "Trade OS 구독" })).toBeVisible()
  await expect(page.getByRole("region", { name: "SNAP 구독" })).toBeVisible()
  await expect(page.getByRole("button", { name: "시트 관리", exact: true })).toHaveCount(1)
  await expect(page.getByRole("button", { name: "구독 변경", exact: true })).toHaveCount(1)
  await expect(page.getByRole("region", { name: "Trade OS 구독" })).toContainText("구독 시작 2026.09.01")
  await page.getByRole("button", { name: "시트 관리", exact: true }).click()
  await expect(page.getByRole("region", { name: "Trade OS 구독" })).toBeVisible()
  await expect(page.getByLabel("구매 시트 수")).toBeVisible()
  await page.getByRole("button", { name: "닫기", exact: true }).click()
  await expect(page.getByLabel("구매 시트 수")).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})

test("bundle is shown as one subscription with two independent product seats", async ({ page }) => {
  await openSettings(page, "owner", "products", ["erp", "snap"], "bundle")
  await expect(page.getByRole("region", { name: "Trade OS + SNAP Bundle 구독" })).toBeVisible()
  await expect(page.getByRole("region", { name: "Trade OS 구독" })).toHaveCount(0)
  await expect(page.getByRole("region", { name: "SNAP 구독" })).toHaveCount(0)
  await expect(page.getByRole("region", { name: "Trade OS 이용 상태" })).toContainText("구매 8")
  await expect(page.getByRole("region", { name: "SNAP 이용 상태" })).toContainText("구매 8")
})

test("plan actions follow the subscription state", async ({ page }) => {
  await openSettings(page, "owner", "products", ["erp"], "separate", { erp: "trial_active" })
  const plan = page.getByRole("region", { name: "Trade OS 구독" })
  await expect(plan).toContainText("무료 체험 중")
  await expect(plan.getByRole("button", { name: "구독하기" })).toBeVisible()
  await expect(page.getByRole("button", { name: "시트 관리" })).toHaveCount(0)
  await plan.getByRole("button", { name: "구독하기" }).click()
  await expect(page.getByLabel("구매 시트 수")).toBeVisible()
  await expect(page.getByRole("button", { name: "결제 계속하기" })).toBeDisabled()
  await expect(page.getByLabel("변경 내용", { exact: true })).not.toContainText("다음 인보이스에 청구")
  await openSettings(page, "owner", "products", ["erp"], "separate", { erp: "payment_verifying" })
  await expect(page.getByRole("region", { name: "Trade OS 구독" })).toContainText("결제 확인 중")
  await expect(page.getByRole("button", { name: "다시 결제하기" })).toHaveCount(0)
  await openSettings(page, "owner", "products", ["erp"], "separate", { erp: "payment_pending" })
  await expect(page.getByRole("region", { name: "Trade OS 구독" }).getByRole("button", { name: "다시 결제하기" })).toBeVisible()
  await openSettings(page, "owner", "products", ["erp"], "separate", { erp: "cancel_scheduled" })
  await expect(page.getByRole("region", { name: "Trade OS 구독" }).getByRole("button", { name: "예약 취소" })).toBeVisible()
  await openSettings(page, "owner", "products", ["erp"], "separate", { erp: "read_only" })
  await expect(page.getByRole("region", { name: "Trade OS 구독" }).getByRole("button", { name: "구독하기" })).toBeVisible()
})


test("subscription changes compare products in a dialog while seat changes stay inline", async ({ page }) => {
  await openSettings(page, "owner", "products")
  await page.getByRole("button", { name: "구독 변경", exact: true }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toContainText("적용 조직 · ECOYA Demo Co.")
  await expect(dialog.getByRole("button", { name: "현재 구독", exact: true })).toHaveCount(2)
  await expect(dialog.getByRole("spinbutton")).toHaveCount(0)
  await dialog.getByRole("button", { name: "Bundle로 변경" }).click()
  await expect(dialog.getByLabel("구매 시트 수")).toHaveValue("8")
  await expect(dialog.getByLabel("변경 내용", { exact: true })).toContainText("SNAP 5석→8석")
  await expect(dialog.getByLabel("변경 내용", { exact: true })).toContainText("다음 인보이스에 청구")
  await expect(dialog.getByRole("button", { name: "변경 확정", exact: true })).toBeDisabled()
  await expect(dialog.getByRole("button", { name: "결제 계속하기" })).toHaveCount(0)
  await page.keyboard.press("Escape")
  await seatCounts(page, "Trade OS", 8, 3, 5)
  await page.getByRole("button", { name: "시트 관리", exact: true }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await page.getByLabel("구매 시트 수").fill("7")
  await expect(page.getByLabel("변경 내용", { exact: true })).toContainText("다음 갱신부터")
  await page.getByLabel("구독 중인 상품").selectOption("snap")
  await expect(page.getByLabel("구매 시트 수")).toHaveValue("5")
})

test("bundle split has independent quantities and takes effect on renewal on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openSettings(page, "owner", "products", ["erp", "snap"], "bundle")
  await page.getByRole("button", { name: "구독 변경", exact: true }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("button", { name: "각각 구독으로 변경" }).click()
  await dialog.getByLabel("Trade OS 구매 시트 수").fill("7")
  await dialog.getByLabel("SNAP 구매 시트 수").fill("5")
  await expect(dialog.getByLabel("변경 내용", { exact: true })).toContainText("Trade OS 8석→7석")
  await expect(dialog.getByLabel("변경 내용", { exact: true })).toContainText("SNAP 8석→5석")
  await expect(dialog.getByLabel("변경 내용", { exact: true })).toContainText("다음 갱신부터")
  await expect(dialog.getByRole("button", { name: "변경 확정", exact: true })).toBeDisabled()
  expect(await dialog.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await dialog.getByRole("button", { name: "닫기", exact: true }).click()
  await seatCounts(page, "Trade OS", 8, 3, 5)
  await seatCounts(page, "SNAP", 8, 1, 7)
})

test("new product starts a new subscription while admin only requests seat increases", async ({ page }) => {
  await openSettings(page, "owner", "products", ["erp"])
  await page.getByRole("button", { name: "구독 변경", exact: true }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByRole("article", { name: "SNAP 상품" }).getByRole("button", { name: "추가 구독" }).click()
  await expect(dialog).toContainText("기존 Trade OS 구독은 유지하고 새 구독을 추가합니다")
  await expect(dialog.getByRole("button", { name: "결제 계속하기" })).toBeDisabled()
  await openSettings(page, "admin", "products")
  await expect(page.getByRole("button", { name: "구독 변경", exact: true })).toHaveCount(0)
  await page.getByRole("button", { name: "증설 요청", exact: true }).click()
  await page.getByLabel("구매 시트 수").fill("7")
  await expect(page.getByRole("button", { name: "OWNER에게 요청" })).toBeDisabled()
  await page.getByLabel("구매 시트 수").fill("9")
  await page.getByRole("button", { name: "OWNER에게 요청" }).click()
  await expect(page.getByRole("alert")).toContainText("요청을 보내지 못했습니다")
  await seatCounts(page, "Trade OS", 8, 3, 5)
})

test("organization country selection preserves the address and independent locale, and respects read-only access", async ({ page }) => {
  await openSettings(page, "owner", "organization")
  await page.getByLabel("기본 주소", { exact: true }).fill("세종대로 110")
  await page.getByLabel("상세 주소", { exact: true }).fill("3층")
  await page.getByRole("combobox", { name: "국가·지역", exact: true }).click()
  await page.getByLabel("국가·지역 검색", { exact: true }).fill("United States")
  await page.getByRole("option", { name: "미국", exact: true }).click()
  await expect(page.getByRole("combobox", { name: "국가·지역", exact: true })).toHaveText("미국")
  await expect(page.getByLabel("주·지역", { exact: true })).toHaveValue("서울특별시")
  await expect(page.getByLabel("도시", { exact: true })).toHaveValue("중구")
  await expect(page.getByLabel("기본 주소", { exact: true })).toHaveValue("세종대로 110")
  await expect(page.getByLabel("상세 주소", { exact: true })).toHaveValue("3층")
  await expect(page.getByRole("combobox", { name: "기본 시간대", exact: true })).toContainText("Asia/Seoul")
  await expect(page.getByRole("combobox", { name: "기본 언어", exact: true })).toHaveText("한국어")
  await page.getByRole("combobox", { name: "기본 시간대", exact: true }).click()
  await page.getByLabel("기본 시간대 검색", { exact: true }).fill("New York")
  await page.getByRole("option", { name: "America/New York", exact: true }).click()
  await page.getByRole("button", { name: "조직 정보 저장", exact: true }).click()
  await expect(page.getByRole("alert")).toContainText("입력한 내용은 유지")
  await expect(page.getByLabel("상세 주소", { exact: true })).toHaveValue("3층")
  for (const role of ["admin", "member"]) {
    await openSettings(page, role, "organization")
    await expect(page.getByRole("combobox", { name: "국가·지역", exact: true })).toBeDisabled()
    await expect(page.getByLabel("기본 주소", { exact: true })).toHaveAttribute("readonly")
    await expect(page.getByRole("button", { name: "조직 정보 저장", exact: true })).toHaveCount(0)
  }
})

test("delivery channels are independent choices and preserve selections when saving is unavailable", async ({ page }) => {
  await openSettings(page, "owner", "snap-operations")
  const channels = page.getByRole("group", { name: "전달 채널", exact: true })
  await expect(channels.getByRole("checkbox", { name: "앱 링크", exact: true })).toBeChecked()
  await channels.getByRole("checkbox", { name: "이메일", exact: true }).uncheck()
  await page.getByRole("button", { name: "변경사항 저장", exact: true }).click()
  await expect(page.getByRole("alert")).toContainText("선택한 채널은 유지")
  await expect(channels.getByRole("checkbox", { name: "앱 링크", exact: true })).toBeChecked()
  await expect(channels.getByRole("checkbox", { name: "이메일", exact: true })).not.toBeChecked()
  await openSettings(page, "member", "snap-operations")
  await expect(page.getByRole("checkbox", { name: "앱 링크", exact: true })).toBeDisabled()
  await expect(page.getByRole("checkbox", { name: "이메일", exact: true })).toBeDisabled()
})

test("personal credit usage restores token routes for every role without organization totals", async ({ page }) => {
  for (const path of ["/erp/settings/tokens", "/erp/settings/token-usage", "/erp/settings?section=trade-usage"]) {
    await page.goto(path)
    await expect(page.getByRole("heading", { name: "내 크레딧 사용량", exact: true })).toBeVisible()
  }
  for (const role of ["owner", "admin", "member"]) {
    await openSettings(page, role, "credits", [])
    await expect(page.getByRole("heading", { name: "내 크레딧 사용량", exact: true })).toBeVisible()
    const content = page.locator('[data-ui="settings-content"]')
    await expect(content).toContainText("Trade OS")
    await expect(content).toContainText("SNAP")
    await expect(content).not.toContainText("현재 조직")
    await expect(content).not.toContainText("684K")
    await expect(content.getByText("확인 필요", { exact: true })).toHaveCount(2)
  }
})

test("SNAP localization only offers its supported languages and searchable timezones", async ({ page }) => {
  await openSettings(page, "owner", "snap-localization", ["snap"])
  await page.getByRole("combobox", { name: "기본 언어", exact: true }).click()
  await expect(page.getByRole("option")).toHaveCount(3)
  await page.getByRole("option", { name: "日本語 (일본어)", exact: true }).click()
  await page.getByRole("combobox", { name: "시간대", exact: true }).click()
  await page.getByLabel("시간대 검색", { exact: true }).fill("Tokyo")
  await page.getByRole("option", { name: "Asia/Tokyo", exact: true }).click()
  await page.getByRole("button", { name: "변경사항 저장", exact: true }).click()
  await expect(page.getByRole("alert")).toContainText("선택한 언어와 시간대는 유지")
  await expect(page.getByRole("combobox", { name: "기본 언어", exact: true })).toHaveText("日本語 (일본어)")
  await expect(page.getByRole("combobox", { name: "시간대", exact: true })).toHaveText("Asia/Tokyo")
  await openSettings(page, "member", "snap-localization", ["snap"])
  await expect(page.getByRole("combobox", { name: "기본 언어", exact: true })).toBeDisabled()
  await expect(page.getByRole("combobox", { name: "시간대", exact: true })).toBeDisabled()
})

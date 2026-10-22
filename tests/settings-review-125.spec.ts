import { expect, test, type Page } from "@playwright/test"
import { counterpartyPreview } from "../trade-os/counterparties/Counterparty360View"
import { validEmailLimits } from "../share/settings/email-limits-data"

async function settings(
  page: Page,
  section: string,
  role = "owner",
  permissions?: { canImportCounterparties?: boolean; canImportDeals?: boolean }
) {
  await page.goto(`/login?section=${section}`)
  await page.evaluate(
    async ({ role, permissions }) => {
      const path = "/tests/fixtures/common-settings.tsx"
      const { renderSettings } = await import(path)
      renderSettings(["erp", "snap"], role, "separate", {}, permissions)
    },
    { role, permissions }
  )
}
for (const section of ["trade-counterparty-import", "trade-deal-import"]) {
  test(`${section}: menu and direct route use the same permission`, async ({
    page,
  }) => {
    const name =
      section === "trade-counterparty-import"
        ? "거래처 일괄 등록"
        : "거래 일괄 등록"
    await page.goto(`/erp/settings?section=${section}&role=member`)
    await expect(
      page.getByRole("heading", { name: `${name}에 접근할 수 없습니다.` })
    ).toBeVisible()
    await expect(page.getByRole("button", { name, exact: true })).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "가져오기", exact: true })
    ).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole("alert")).toContainText("파일 등록 권한")
    const permission =
      section === "trade-counterparty-import"
        ? "canImportCounterparties"
        : "canImportDeals"
    await settings(page, section, "member", { [permission]: true })
    await expect(page.getByRole("button", { name, exact: true })).toBeVisible()
    await expect(
      page.getByRole("button", { name: "가져오기", exact: true })
    ).toBeVisible()
    await settings(page, section, "owner", { [permission]: false })
    await expect(
      page.getByRole("heading", { name: `${name}에 접근할 수 없습니다.` })
    ).toBeVisible()
    await expect(page.getByRole("button", { name, exact: true })).toHaveCount(0)
  })
}

test("email limits reject missing and invalid values", () => {
  const valid = {
    maxAttachmentCount: 3,
    maxAttachmentBytes: 1024,
    acceptedFormats: ["PDF"],
  }
  expect(validEmailLimits(valid)).toBe(true)
  for (const value of [
    null,
    { ...valid, maxAttachmentCount: 0 },
    { ...valid, maxAttachmentBytes: NaN },
    { ...valid, acceptedFormats: [] },
    { maxMessageBytes: 1000000 },
  ]) {
    expect(validEmailLimits(value as typeof valid)).toBe(false)
  }
})
test("email response numbers, missing limit and retry never substitute message size", async ({
  page,
}) => {
  await page.goto("/login?section=trade-email")
  await page.evaluate(async () => {
    const path = "/tests/fixtures/common-settings.tsx"
    const { renderSettings } = await import(path)
    let calls = 0
    renderSettings(["erp"], "owner", "separate", {}, undefined, async () => {
      calls++
      if (calls === 1) throw new Error("offline")
      if (calls === 2) return { maxMessageBytes: 99 * 1024 * 1024 }
      return {
        maxAttachmentCount: 7,
        maxAttachmentBytes: 12 * 1024 * 1024,
        acceptedFormats: ["PDF", "JPG"],
        maxMessageBytes: 99 * 1024 * 1024,
      }
    })
  })
  const limits = page.getByRole("status", { name: "이메일 첨부 제한" })
  await expect(limits).toContainText("제한 확인 필요")
  await page.getByRole("button", { name: "다시 조회" }).click()
  await expect(limits).toContainText("제한 확인 필요")
  await expect(limits).not.toContainText("99MB")
  await page.getByRole("button", { name: "다시 조회" }).click()
  await expect(limits).toContainText("메일당 최대 7개")
  await expect(limits).toContainText("첨부당 최대 12MB")
  await expect(limits).toContainText("PDF · JPG")
  await expect(limits).not.toContainText("99MB")
})

for (const width of [1440, 390])
  test(`settings review layout and invitation actions ${width}`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height: 1000 })
    await settings(page, "approvals")
    const title = page.getByRole("heading", { name: "결재 정책", exact: true })
    await expect(title).toHaveCSS("font-size", "24px")
    await expect(page.locator('[data-slot="card"]')).toHaveCount(2)
    await expect(
      page.getByRole("heading", { name: "정책 만들기" })
    ).toBeVisible()
    await expect(page.getByRole("button", { name: "정책 저장" })).toBeVisible()
    await page.screenshot({
      path: `/tmp/devdev-125-approvals-${width}.png`,
      fullPage: true,
    })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await settings(page, "trade-email")
    await expect(
      page.getByRole("status", { name: "이메일 첨부 제한" })
    ).toContainText("첨부당 최대 20MB")
    await page.screenshot({
      path: `/tmp/devdev-125-email-${width}.png`,
      fullPage: true,
    })
    await settings(page, "members")
    await expect(page.getByRole("region", { name: "보낸 초대" })).toHaveCount(0)
    const memberCount = await page
      .locator(".settings-member-table tbody tr")
      .count()
    await page.getByRole("button", { name: "멤버 초대", exact: true }).click()
    const invitationPanel = page.getByRole("region", {
      name: "멤버 초대",
      exact: true,
    })
    const invites = invitationPanel.getByRole("region", { name: "보낸 초대" })
    const row = invites.getByRole("group", {
      name: "finance@company.example 초대",
    })
    await expect(row).toContainText("MEMBER")
    await expect(row).toContainText("대기 중")
    await expect(row).toContainText("만료")
    await expect(row).not.toContainText("token=")
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await row.getByRole("button", { name: "링크 복사" }).click()
    await expect(invites.getByRole("status")).toContainText("복사했습니다")
    const oldLink = await page.evaluate(() => navigator.clipboard.readText())
    await row.getByRole("button", { name: "다시 보내기" }).click()
    await expect(invites.getByRole("status")).toContainText("갱신했습니다")
    await row.getByRole("button", { name: "링크 복사" }).click()
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .not.toBe(oldLink)
    await page.screenshot({
      path: `/tmp/devdev-125-invites-${width}.png`,
      fullPage: true,
    })
    await row.getByRole("button", { name: "취소", exact: true }).click()
    await expect(row).toContainText("취소됨")
    await expect(
      row.getByRole("button", { name: "다시 보내기" })
    ).toBeDisabled()
    await expect(row.getByRole("button", { name: "링크 복사" })).toBeDisabled()
    await expect(page.locator(".settings-member-table tbody tr")).toHaveCount(
      memberCount
    )
    await page.getByRole("button", { name: "멤버 초대", exact: true }).click()
    await page.getByRole("button", { name: "멤버 초대", exact: true }).click()
    await expect(row).toContainText("취소됨")
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
  })

test("approval policy remains owner only", async ({ page }) => {
  for (const role of ["member", "admin"]) {
    await settings(page, "approvals", role)
    await expect(page.getByRole("alert")).toContainText(
      "결재 정책에 접근할 수 없습니다"
    )
    await expect(page.getByRole("button", { name: "정책 저장" })).toHaveCount(0)
  }
})

test("invitation empty and expired rows", async ({ page }) => {
  for (const empty of [true, false]) {
    await page.goto("/login")
    await page.evaluate(async (empty) => {
      const path = "/tests/fixtures/settings-review.tsx"
      ;(await import(path)).renderInvitations(empty, true)
    }, empty)
    if (empty)
      await expect(page.getByText("대기 중인 초대가 없습니다.")).toBeVisible()
    else {
      await expect(page.getByText("만료됨", { exact: true })).toBeVisible()
      await expect(
        page.getByRole("button", { name: "링크 복사" })
      ).toBeDisabled()
      await page.getByRole("button", { name: "다시 보내기" }).click()
      await expect(page.getByText("대기 중", { exact: true })).toBeVisible()
    }
  }
})

test("counterparty scope excludes other deals and keeps global trust", async () => {
  const own = await counterpartyPreview.read("acme", {
    userId: "member",
    canReadOrganizationSettlement: false,
  })
  const all = await counterpartyPreview.read("acme", {
    userId: "member",
    canReadOrganizationSettlement: true,
  })
  expect(own!.deals.length).toBeLessThan(all!.deals.length)
  expect(own!.currencies.map((row) => row.currency)).toEqual(["USD"])
  expect(own!.currencies[0].receivable).toBe("42,000.00")
  expect(own!.currencies[0].overdue).toBe("8,000.00")
  expect(own!.trustCurrencies).toEqual(all!.trustCurrencies)
  expect(
    own!.schedules.every((row) =>
      own!.deals.some((deal) => deal.id === row.dealId)
    )
  ).toBe(true)
  const unrelated = await counterpartyPreview.read("acme", {
    userId: "unrelated",
    canReadOrganizationSettlement: false,
  })
  expect(unrelated!.deals).toHaveLength(0)
  expect(unrelated!.schedules).toHaveLength(0)
  expect(unrelated!.currencies).toHaveLength(0)
  const assigned = await counterpartyPreview.read("Hanbit Trading Co.", {
    userId: "member",
    canReadOrganizationSettlement: false,
  })
  expect(assigned!.deals).toHaveLength(1)
})
for (const width of [1440, 390])
  test(`member counterparty and organization grant ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto("/erp/counterparties/acme?role=member")
    await expect(
      page.getByRole("region", { name: "받을 돈", exact: true })
    ).toContainText("42,000.00")
    await expect(
      page.getByRole("region", { name: "받을 돈", exact: true })
    ).not.toContainText("EUR")
    await expect(
      page.getByRole("region", { name: "결제 신뢰", exact: true })
    ).toContainText("EUR")
    await expect(
      page
        .getByRole("region", { name: "미결제 일정", exact: true })
        .getByRole("table")
    ).toContainText("8,000.00")
    await expect(
      page.getByRole("region", { name: "미결제 일정", exact: true })
    ).toContainText("담당·공동 작업 기준")
    await page.screenshot({
      path: `/tmp/devdev-125-counterparty-${width}.png`,
      fullPage: true,
    })
    await page.getByRole("region", { name: "미결제 일정", exact: true }).scrollIntoViewIfNeeded()
    await page.screenshot({ path: `/tmp/devdev-125-counterparty-schedule-${width}.png` })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await page.goto("/login")
    await page.evaluate(async () => {
      const path = "/tests/fixtures/settings-review.tsx"
      ;(await import(path)).renderCounterparty({
        userId: "member",
        canReadOrganizationSettlement: true,
      })
    })
    await expect(
      page.getByRole("region", { name: "받을 돈", exact: true })
    ).toContainText("EUR")
    await expect(
      page.getByRole("region", { name: "미결제 일정", exact: true })
    ).toContainText("회사 전체 기준")
    await expect(
      page.getByText(
        "회사 전체 금액·일정 조회는 조직 소유자에게 권한을 요청하세요."
      )
    ).toHaveCount(0)
  })

test("failed invitation actions retain state and never announce success", async ({
  page,
}) => {
  await page.goto("/login")
  await page.evaluate(async () => {
    const fixture = "/tests/fixtures/settings-review.tsx"
    const backend = "/trade-os/lib/prototype-backend.ts"
    const { prototypeBackend } = await import(backend)
    prototypeBackend.settings.cancelInvite = async () => {
      throw new Error("offline")
    }
    prototypeBackend.settings.resendInvite = async () => ({
      ok: false,
      error: "offline",
    })
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("denied")
        },
      },
    })
    ;(await import(fixture)).renderInvitations()
  })
  for (const name of ["링크 복사", "다시 보내기", "취소"]) {
    await page.getByRole("button", { name, exact: true }).click()
    await expect(page.getByRole("alert")).toContainText("못했습니다")
    await expect(page.getByText("대기 중", { exact: true })).toBeVisible()
    await expect(page.getByRole("status")).toHaveCount(0)
  }
})

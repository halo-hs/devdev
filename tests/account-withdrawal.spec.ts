import { test, expect, type Page } from "@playwright/test"
import { mkdir } from "node:fs/promises"

async function enter(page: Page, scenario = "password") {
  await page.goto(`/erp/settings?section=account&withdrawalPreview=${scenario}`)
  await page.getByRole("button", { name: "계정 탈퇴", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "소속 조직 확인" })
  ).toBeVisible()
}
async function authenticate(page: Page, google = false) {
  await page.getByRole("button", { name: "탈퇴 계속", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "본인 확인", exact: true })
  ).toBeVisible()
  if (google)
    await page.getByRole("button", { name: "Google 계정으로 확인" }).click()
  else {
    await page
      .getByLabel("비밀번호", { exact: true })
      .fill("preview-only-password")
    await page
      .getByRole("button", { name: "비밀번호 확인", exact: true })
      .click()
  }
}
async function confirm(page: Page) {
  await expect(
    page.getByRole("heading", { name: "계정 탈퇴 최종 확인" })
  ).toBeVisible()
  await page.getByRole("button", { name: "계정 탈퇴 확정" }).click()
}

test("CS-22 blocks membership for every role and links to existing organization settings", async ({
  page,
}) => {
  for (const role of ["owner", "admin", "member"]) {
    await page.goto(`/erp/settings?section=account&role=${role}`)
    await page.getByRole("button", { name: "계정 탈퇴", exact: true }).click()
    await expect(
      page.getByText("계정 탈퇴를 위해 소속 조직의 OWNER에게 문의하세요.")
    ).toBeVisible()
    await expect(page.getByRole("button", { name: "탈퇴 계속" })).toHaveCount(0)
    await page.getByRole("button", { name: "소속 Organization 보기" }).click()
    await expect(page).toHaveURL(/section=organizations/)
  }
})

test("membership loading and failure never become empty membership; retry works", async ({
  page,
}) => {
  await enter(page, "membership-error")
  await expect(page.getByRole("button", { name: "탈퇴 계속" })).toHaveCount(0)
  await expect(page.getByRole("alert")).toContainText(
    "소속 여부를 확인할 수 없습니다"
  )
  await expect(
    page.getByText("소속된 조직이 없습니다.", { exact: true })
  ).toHaveCount(0)
  await page.getByRole("button", { name: "다시 확인", exact: true }).click()
  await expect(page.getByRole("button", { name: "탈퇴 계속" })).toBeVisible()
  await expect(page.getByRole("button", { name: "초대 수락" })).toHaveCount(0)
})

test("organization creation rechecks eligibility and blocks withdrawal", async ({
  page,
}) => {
  await enter(page)
  await page
    .getByRole("button", { name: "새 조직 만들기", exact: true })
    .click()
  await page.getByLabel("조직명", { exact: true }).fill("새 무역 조직")
  await page.getByRole("button", { name: "조직 만들기", exact: true }).click()
  await expect(page.getByText("새 무역 조직", { exact: true })).toBeVisible()
  await expect(page.getByText("소유자", { exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "탈퇴 계속" })).toHaveCount(0)
})

test("password errors clear input; recovery is separate and warns before navigation", async ({
  page,
}) => {
  await enter(page, "password-error")
  await authenticate(page)
  await expect(page.getByRole("alert")).toContainText(
    "비밀번호가 올바르지 않습니다"
  )
  await expect(page.getByLabel("비밀번호", { exact: true })).toHaveValue("")
  await expect(
    page.getByRole("button", { name: "계정 탈퇴 확정" })
  ).toHaveCount(0)
  await page.getByLabel("비밀번호", { exact: true }).fill("do-not-persist")
  await page.getByRole("button", { name: "비밀번호를 잊으셨나요?" }).click()
  await expect(
    page.getByText(/다시 로그인한 뒤 계정 탈퇴를 처음부터 시작해야 합니다/)
  ).toBeVisible()
  await expect(page.getByLabel("비밀번호", { exact: true })).toHaveValue("")
  expect(
    await page.evaluate(() =>
      JSON.stringify({
        local: { ...localStorage },
        session: { ...sessionStorage },
      })
    )
  ).not.toContain("do-not-persist")
  await page.getByRole("button", { name: "비밀번호 재설정으로 이동" }).click()
  await expect(page).toHaveURL(/password-recovery$/)
})

for (const scenario of ["google-cancelled", "google-mismatch", "auth-error"]) {
  test(`${scenario} stays in reauthentication and permits retry`, async ({
    page,
  }) => {
    await enter(page, scenario)
    const google = scenario.startsWith("google")
    await authenticate(page, google)
    await expect(page.getByRole("alert")).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "본인 확인", exact: true })
    ).toBeVisible()
    if (google) {
      await expect(page.getByLabel("비밀번호", { exact: true })).toHaveCount(0)
      await expect(
        page.getByRole("button", { name: "비밀번호를 잊으셨나요?" })
      ).toHaveCount(0)
      await page.getByRole("button", { name: "Google 계정으로 확인" }).click()
    } else {
      await page.getByLabel("비밀번호", { exact: true }).fill("retry")
      await page
        .getByRole("button", { name: "비밀번호 확인", exact: true })
        .click()
    }
    await expect(
      page.getByRole("heading", { name: "계정 탈퇴 최종 확인" })
    ).toBeVisible()
  })
}

test("unknown auth method cannot advance; reload cannot skip authentication", async ({
  page,
}) => {
  await enter(page, "method-unknown")
  await page.getByRole("button", { name: "탈퇴 계속" }).click()
  await expect(page.getByText("인증 수단을 확인할 수 없습니다.")).toBeVisible()
  await expect(
    page.getByRole("button", { name: "비밀번호 확인", exact: true })
  ).toHaveCount(0)
  await page.getByRole("button", { name: "다시 확인", exact: true }).click()
  await page.getByLabel("비밀번호", { exact: true }).fill("preview")
  await page.getByRole("button", { name: "비밀번호 확인", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "계정 탈퇴 최종 확인" })
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole("heading", { name: "내 계정", exact: true }).first()
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "계정 탈퇴 확정" })
  ).toHaveCount(0)
  await page.goto("/erp/settings?section=account&withdrawalStep=confirm")
  await expect(
    page.getByRole("button", { name: "계정 탈퇴 확정" })
  ).toHaveCount(0)
})

for (const scenario of [
  "membership-added",
  "membership-recheck-error",
  "reauth-expired",
]) {
  test(`final server response ${scenario} returns to required step`, async ({
    page,
  }) => {
    await enter(page, scenario)
    await authenticate(page)
    await confirm(page)
    if (scenario === "membership-added")
      await expect(
        page.getByText("새로 참여한 조직", { exact: true })
      ).toBeVisible()
    else if (scenario === "membership-recheck-error")
      await expect(page.getByRole("alert")).toContainText(
        "소속 여부를 확인할 수 없습니다"
      )
    else
      await expect(
        page.getByRole("heading", { name: "본인 확인", exact: true })
      ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "계정 탈퇴 확정" })
    ).toHaveCount(0)
  })
}

for (const scenario of ["accepted", "password", "completed", "failed"]) {
  test(`CS-25 ${scenario} has distinct result and no protected navigation`, async ({
    page,
  }) => {
    await enter(page, scenario)
    await authenticate(page)
    await confirm(page)
    const dialog = page.getByRole("dialog", { name: "계정 탈퇴 처리" })
    await expect(dialog).toBeVisible()
    await expect(
      dialog.getByRole("heading", {
        name:
          scenario === "completed"
            ? "계정 탈퇴가 완료되었습니다."
            : scenario === "failed"
              ? "처리를 완료하지 못했습니다."
              : "계정 탈퇴를 처리하고 있습니다.",
      })
    ).toBeVisible()
    await expect(
      page.getByRole("navigation", { name: "설정 메뉴" })
    ).toHaveCount(0)
    await page.keyboard.press("Escape")
    await expect(dialog).toBeVisible()
    await expect(
      page.getByRole("button", { name: "취소", exact: true })
    ).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "계정 탈퇴 확정" })
    ).toHaveCount(0)
    await expect(page.getByRole("button", { name: "계정 복구" })).toHaveCount(0)
    if (scenario === "failed")
      await expect(
        page.getByRole("button", { name: "지원 문의" })
      ).toBeVisible()
    else {
      await page.getByRole("button", { name: "로그인 화면으로" }).click()
      await expect(page).toHaveURL(/\/login$/)
    }
  })
}

test("unknown receipt checks the same result, only explicit nonreceipt permits resubmission", async ({
  page,
}) => {
  for (const scenario of ["result-unknown", "not-received"]) {
    await enter(page, scenario)
    await authenticate(page)
    await confirm(page)
    await expect(
      page.getByText("접수 여부를 확인하지 못했습니다.")
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "계정 탈퇴 확정" })
    ).toHaveCount(0)
    await page.getByRole("button", { name: "처리 상태 다시 확인" }).click()
    await expect(
      page.getByRole("button", { name: "처리 상태 다시 확인" })
    ).toBeEnabled()
    await expect(
      page.getByRole("button", { name: "계정 탈퇴 확정" })
    ).toHaveCount(0)
    await page.getByRole("button", { name: "처리 상태 다시 확인" }).click()
    if (scenario === "not-received") {
      await expect(page.getByRole("alert")).toContainText(
        "요청이 접수되지 않았습니다"
      )
      await confirm(page)
    }
    await expect(page.getByText("계정 탈퇴를 처리하고 있습니다.")).toBeVisible()
  }
})

for (const width of [1440, 390]) {
  test(`withdrawal layout and all four impact notices ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 })
    await mkdir("feedback/2026-10-19-account-withdrawal", { recursive: true })
    await enter(page)
    await expect(page.getByRole("button", { name: "탈퇴 계속" })).toBeVisible()
    await page.screenshot({
      path: `feedback/2026-10-19-account-withdrawal/entry-${width}.png`,
    })
    await page.getByRole("button", { name: "탈퇴 계속" }).click()
    await expect(page.getByLabel("비밀번호", { exact: true })).toBeVisible()
    await page.screenshot({
      path: `feedback/2026-10-19-account-withdrawal/reauth-${width}.png`,
    })
    await page.getByLabel("비밀번호", { exact: true }).fill("preview")
    await page
      .getByRole("button", { name: "비밀번호 확인", exact: true })
      .click()
    for (const text of [
      "로그인과 개인 프로필 접근 종료",
      "조직의 작업·게시물·문서는 유지",
      "탈퇴 완료 후 계정 복구 불가",
      "재가입 시 조직 권한 자동 복원 없음",
    ])
      await expect(page.getByText(text, { exact: true })).toBeVisible()
    await expect(
      page.getByText("계정 탈퇴는 조직 삭제나 구독 해지를 대신하지 않습니다.")
    ).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
    await page.screenshot({
      path: `feedback/2026-10-19-account-withdrawal/confirm-${width}.png`,
    })
    await confirm(page)
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.screenshot({
      path: `feedback/2026-10-19-account-withdrawal/result-${width}.png`,
    })
  })
}

test("cancel during a slow auth response never opens confirmation", async ({
  page,
}) => {
  await enter(page)
  await page.getByRole("button", { name: "탈퇴 계속" }).click()
  await page.getByLabel("비밀번호", { exact: true }).fill("preview")
  await page.getByRole("button", { name: "비밀번호 확인", exact: true }).click()
  await page.getByRole("button", { name: "취소", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "계정 탈퇴", exact: true })
  ).toBeVisible()
  await page.getByRole("button", { name: "계정 탈퇴", exact: true }).click()
  await expect(page.getByRole("button", { name: "탈퇴 계속" })).toBeVisible()
  await expect(
    page.getByRole("button", { name: "계정 탈퇴 확정" })
  ).toHaveCount(0)
})

async function customGateway(
  page: Page,
  mode: "multiple" | "missing" | "mismatch" | "double"
) {
  await page.goto("/login?section=account")
  await page.evaluate(async (mode) => {
    const fixturePath = "/tests/fixtures/common-settings.tsx"
    const gatewayPath = "/share/settings/withdrawalData.ts"
    const { renderSettings } = await import(fixturePath)
    const { createWithdrawalPreview } = await import(gatewayPath)
    const gateway = createWithdrawalPreview("password")
    if (mode === "multiple")
      gateway.memberships = async () => [
        { id: "ecoya", name: "현재 선택 조직", role: "OWNER" },
        { id: "other", name: "다른 소속 조직", role: "MEMBER" },
      ]
    if (mode === "missing") gateway.memberships = async () => null
    if (mode === "mismatch")
      gateway.reauthenticate = async () => ({
        status: "verified",
        accountId: "someone-else",
      })
    if (mode === "double") {
      Object.assign(window, { withdrawalSubmissions: 0 })
      gateway.submit = async (requestId: string) => {
        const state = window as typeof window & {
          withdrawalSubmissions: number
        }
        state.withdrawalSubmissions++
        await new Promise((resolve) => setTimeout(resolve, 600))
        return { kind: "result", result: { requestId, status: "accepted" } }
      }
    }
    renderSettings(
      ["erp"],
      "owner",
      "separate",
      {},
      undefined,
      undefined,
      gateway
    )
  }, mode)
  await page.getByRole("button", { name: "계정 탈퇴", exact: true }).click()
}

test("all active organizations appear, not only the selected organization", async ({
  page,
}) => {
  await customGateway(page, "multiple")
  await expect(page.getByText("현재 선택 조직", { exact: true })).toBeVisible()
  await expect(page.getByText("다른 소속 조직", { exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "탈퇴 계속" })).toHaveCount(0)
})
test("missing membership response is an error, not an empty list", async ({
  page,
}) => {
  await customGateway(page, "missing")
  await expect(page.getByRole("alert")).toContainText(
    "소속 여부를 확인할 수 없습니다"
  )
  await expect(page.getByRole("button", { name: "탈퇴 계속" })).toHaveCount(0)
})
test("verified authentication for another account cannot confirm withdrawal", async ({
  page,
}) => {
  await customGateway(page, "mismatch")
  await authenticate(page)
  await expect(page.getByRole("alert")).toContainText(
    "현재 로그인한 계정과 다른 계정"
  )
  await expect(
    page.getByRole("button", { name: "계정 탈퇴 확정" })
  ).toHaveCount(0)
})
test("rapid final submissions only send one request", async ({ page }) => {
  await customGateway(page, "double")
  await authenticate(page)
  const button = page.getByRole("button", { name: "계정 탈퇴 확정" })
  await button.evaluate((element) => {
    ;(element as HTMLButtonElement).click()
    ;(element as HTMLButtonElement).click()
  })
  await expect(button).toBeDisabled()
  await expect(
    page.getByRole("heading", { name: "계정 탈퇴를 처리하고 있습니다." })
  ).toBeVisible()
  expect(
    await page.evaluate(
      () =>
        (window as typeof window & { withdrawalSubmissions: number })
          .withdrawalSubmissions
    )
  ).toBe(1)
})

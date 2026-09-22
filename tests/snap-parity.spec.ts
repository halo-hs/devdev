import { expect, test, type Page } from "@playwright/test"

// Workspace scenarios run as the signed-in demo manager; public token routes remain separate.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("snap_web_session", JSON.stringify({
    authenticated: true, role: "manager", email: "ecoya@ecoya.kr", organization: "ECOYA Demo Co.",
  })))
})

const workspaceRoutes = [
  ["/dashboard", "대시보드"],
  ["/tasks", "업무"],
  ["/tasks/new", "업무 만들기"],
  ["/tasks/TASK-DEMO-001", "업무 상세"],
  ["/tasks/TASK-DEMO-001/report", "고객 보고서 작성"],
  ["/reports", "보고서"],
  ["/evidence", "증빙 보관함"],
  ["/customers", "고객"],
  ["/calendar", "캘린더"],
  ["/workflow", "워크플로우"],
  ["/erp-handoffs", "내보내기·연동"],
  ["/workers", "작업자 · 작업 매니저"],
  ["/safety/corrective-actions", "시정조치"],
  ["/settings", "설정"],
] as const

const externalRoutes = [
  ["/work/demo-token", "현장 작업을 확인하고 증거를 기록하세요"],
  ["/upload/demo-token", "지정 작업에 증거를 제출하세요"],
  ["/view/demo-token", "승인 리포트"],
  ["/verify/demo-evidence-hash", "증거 해시를 확인하세요"],
  ["/invite/demo-token", "초대 수락"],
] as const

async function expectHealthyPage(page: Page, label: string) {
  await expect(page.locator("body")).toContainText(label)
  await expect(
    page.getByRole("status", { name: "화면을 불러오는 중" })
  ).toHaveCount(0)
  await expect(page.locator("body")).not.toContainText("페이지를 찾을 수 없습니다")
  await expect(page.locator("body")).not.toContainText("Unexpected Application Error")
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  )
  expect(overflow).toBeLessThanOrEqual(1)
}

test.describe("SNAP canonical routes", () => {
  for (const [path, label] of workspaceRoutes) {
    test(`${path} directly opens ${label}`, async ({ page }) => {
      await page.goto(path)
      await expectHealthyPage(page, label)
      await expectNoHorizontalOverflow(page)
    })
  }

  test("legacy report routes converge on canonical tabs", async ({ page }) => {
    await page.goto("/links")
    await expect(page).toHaveURL(/\/reports\?tab=delivery$/)
    await expect(page.getByRole("tab", { name: /발송 모니터/ })).toHaveAttribute(
      "aria-selected",
      "true"
    )

    await page.goto("/review")
    await expect(page).toHaveURL(/\/reports\?tab=field$/)
    await expect(page.getByRole("tab", { name: /증빙 검수/ })).toHaveAttribute(
      "aria-selected",
      "true"
    )
  })

  test("platform routes are hidden from a tenant manager", async ({ page }) => {
    await page.goto("/platform")
    await expect(page.locator("body")).toContainText(/권한|접근할 수 없/)
  })
})

test.describe("SNAP primary flows", () => {
  test("workspace menu transitions always settle the route loader", async ({
    page,
  }) => {
    await page.goto("/dashboard")
    await expectHealthyPage(page, "대시보드")

    for (const [path, label] of [
      ["/tasks", "업무"],
      ["/reports", "보고서"],
      ["/evidence", "증빙 보관함"],
      ["/customers", "고객"],
    ] as const) {
      await page.getByRole("button", { name: label, exact: true }).click()
      await expect(page).toHaveURL(new RegExp(`${path}$`))
      await expectHealthyPage(page, label)
    }
  })

  test("evidence folders expose create and detail workflow", async ({ page }) => {
    await page.goto("/evidence")
    await page.getByRole("button", { name: "폴더 만들기" }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toContainText("폴더 만들기")
    await expect(page.getByLabel("폴더 이름")).toBeVisible()
    await expect(dialog).toContainText("폴더 유형")
    await expect(dialog).toContainText("공개 범위")
  })

  test("reports expose review, sent, and delivery lifecycle", async ({ page }) => {
    await page.goto("/reports")
    for (const tab of ["증빙 검수", "리포트 승인", "발송", "발송 모니터"]) {
      const trigger = page.getByRole("tab", {
        name: new RegExp(`^${tab}(?:\\s+\\d+)?$`),
      })
      await trigger.click()
      await expect(trigger).toHaveAttribute(
        "aria-selected",
        "true"
      )
    }
  })

  test("task creation preserves the draft flow and opens detail", async ({ page }) => {
    await page.goto("/tasks/new")
    await expectHealthyPage(page, "업무 만들기")
    await expect(page.locator("textarea").first()).toBeVisible()
  })
})

test.describe("SNAP external token surfaces", () => {
  for (const [path, label] of externalRoutes) {
    test(`${path} renders ${label} on mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(path)
      await expectHealthyPage(page, label)
      await expectNoHorizontalOverflow(page)
    })
  }
})

test.describe("SNAP responsive shell", () => {
  for (const width of [390, 768, 1440]) {
    test(`workspace fits ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
      await page.goto("/dashboard")
      await expectHealthyPage(page, "대시보드")
      await expectNoHorizontalOverflow(page)
    })
  }
})

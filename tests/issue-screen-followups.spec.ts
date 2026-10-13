import { expect, test } from "@playwright/test"

for (const view of ["운영", "금융"]) {
test(`mobile ${view} empty table notice stays in the visible area while scrolling horizontally`, async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/erp/deals")
  await page.getByRole("tab", { name: view, exact: true }).click()
  await page
    .getByRole("searchbox", { name: /검색/ })
    .first()
    .fill("없는거래-XYZ")
  const notice = page.getByText("조건에 맞는 거래가 없습니다.", { exact: true })
  const table = page
    .locator('[data-slot="table-container"]')
    .filter({ has: notice })
  await table.scrollIntoViewIfNeeded()
  await expect(notice).toBeInViewport()
  await table.evaluate((element) => {
    element.scrollLeft = 500
  })
  await expect(notice).toBeInViewport()
  const box = (await notice.boundingBox())!
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(390)
})
}

test("document list keeps approval conditional and PDF stages in file actions", async ({
  page,
}) => {
  await page.goto("/erp/documents/create")
  const row = page.getByRole("row").filter({ hasText: "CI-2026-0918" })
  await expect(row).toContainText("승인 완료")
  await expect(row).toContainText("작성 중")
  await expect(row).not.toContainText("초안 PDF")
  await expect(row.getByRole("button", { name: /PDF 초안 보기/ })).toBeEnabled()

  const unrequested = page.getByRole("row").filter({ hasText: "SC-2026-0708" })
  await expect(unrequested).toContainText("작성 중")
  await expect(unrequested).not.toContainText("요청 전")
  await expect(unrequested).not.toContainText("PDF 미생성")
  await expect(unrequested.getByRole("button", { name: /PDF 미생성/ })).toBeDisabled()

  const confirmed = page.getByRole("row").filter({ hasText: "CI-2026-0703" })
  await expect(confirmed).toContainText("확정")
  await expect(confirmed).not.toContainText("승인 없음")
  await expect(confirmed).not.toContainText("최종 PDF")
  await expect(confirmed.getByRole("button", { name: /최종 PDF 보기/ })).toBeEnabled()
  await expect(confirmed.getByRole("button", { name: "고객 전달", exact: true })).toBeEnabled()

  await expect(page.getByRole("row").filter({ hasText: "SC-2026-0918" })).toContainText("승인 대기")
  await expect(page.getByRole("row").filter({ hasText: "PO-2026-0918" })).toContainText("반려")
})

test("next document opens the matching draft without confirming it", async ({
  page,
}) => {
  await page.goto("/erp/deals/DL-260707-04")
  const next = page.locator("[data-next-document]")
  await expect(next).toContainText("판매계약서")
  await next.getByRole("button", { name: "진행하기" }).click()
  await expect(page).toHaveURL(/SC-2026-0918/)
  await expect(
    page
      .getByRole("heading", { name: "문서 만들기", exact: true })
      .locator("..")
  ).toContainText("작성 중")
})

test("aliases can be created, retained after reload and removed with confirmation on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/erp/settings?section=trade-aliases")
  await page.getByRole("button", { name: "별칭 추가", exact: true }).click()
  let dialog = page.getByRole("dialog")
  await dialog.getByLabel("문서에 적힌 별칭").fill("ACME test")
  await dialog.getByLabel("기준 거래처").selectOption("acme")
  await dialog.getByRole("button", { name: "저장", exact: true }).click()
  await expect(dialog).toBeHidden()
  await page.reload()
  await expect(
    page.getByRole("region", { name: "기준 거래처와 별칭" })
  ).toContainText("ACME test")
  await page.getByRole("button", { name: "삭제", exact: true }).click()
  dialog = page.getByRole("dialog")
  await expect(dialog).toContainText("기준 거래처와 기존 문서는 유지")
  await dialog.getByRole("button", { name: "삭제", exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(
    page.getByText("모든 별칭이 거래처에 연결되어 있습니다.")
  ).toBeVisible()
})

test("evidence allocations require a target and cannot release live shared evidence", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/erp/snap-evidence")
  await page
    .getByRole("region", { name: "컨테이너 근거" })
    .getByRole("button", { name: "배정", exact: true })
    .first()
    .click()
  let dialog = page.getByRole("dialog")
  await expect(dialog.getByRole("button", { name: "배정 확정" })).toBeDisabled()
  await dialog.getByRole("radio").first().check()
  await dialog.getByRole("button", { name: "배정 확정" }).click()
  await expect(dialog).toBeHidden()
  await expect(
    page.getByRole("region", { name: "배정 목록" }).getByRole("row")
  ).toHaveCount(4)
  await page
    .getByRole("region", { name: "배정 목록" })
    .getByRole("button", { name: "배정 해제" })
    .first()
    .click()
  dialog = page.getByRole("dialog")
  await dialog.getByLabel("해제 사유 (필수)").fill("잘못 배정")
  await expect(dialog).toContainText("고객이 열 수 있는 공유 링크가 있습니다.")
  await expect(
    dialog.getByRole("button", { name: "배정 해제", exact: true })
  ).toBeDisabled()
  await dialog.getByRole("button", { name: "취소" }).click()
  await page
    .getByRole("region", { name: "배정 목록" })
    .getByRole("button", { name: "배정 해제" })
    .nth(1)
    .click()
  await dialog.getByLabel("해제 사유 (필수)").fill("배정 대상 정정")
  await dialog.getByRole("button", { name: "배정 해제", exact: true }).click()
  await expect(dialog).toBeHidden()
  await page.reload()
  await expect(
    page.getByRole("region", { name: "배정 목록" }).getByRole("row")
  ).toHaveCount(3)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true)
})

for (const width of [1440, 390]) {
test(`changing an approved draft invalidates approval and retains its audit history at ${width}px`, async ({
  page,
}) => {
  await page.setViewportSize({ width, height: 1000 })
  await page.goto("/erp/documents/create/CI-2026-0918")
  // The style picker is in the review step.
  const review = page
    .getByRole("button", { name: /검토·확정/, exact: false })
    .first()
  if (width < 768 || await review.count()) await review.click()
  const composition = page.getByRole("combobox", {
    name: "문서 구성",
    exact: true,
  })
  await composition.selectOption("letter")
  await expect(
    page.getByText("내용이 바뀌어 이전 승인 요청이 무효가 되었습니다.", {
      exact: false,
    })
  ).toBeVisible()
  await expect(page.getByText("승인 처리 완료", { exact: true })).toBeVisible()
  await expect(page.getByText("수정", { exact: true }).last()).toBeVisible()
  if (width < 768) await page.getByRole("button", { name: "PDF 보기", exact: true }).click()
  await expect(page.locator("[data-document-paper]")).toHaveAttribute(
    "data-archetype",
    "letter"
  )
  if (width < 768) await review.click()
  await composition.selectOption("formal")
  await expect(page.getByText("승인 무효", { exact: true })).toHaveCount(2)
  const notice = page.getByText("내용이 바뀌어 이전 승인 요청이 무효가 되었습니다.", { exact: false })
  await notice.scrollIntoViewIfNeeded()
  const box = (await notice.boundingBox())!
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(width)
})
}

for (const role of ["owner", "manager", "operator"]) {
  test(`SNAP read-only guide preserves progress and shows billing CTA only to owner: ${role}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const key = "ecoya.preview.snap-start-guide.v1:preview-account:ecoya"
    const projection = { access: "read-only", completed: { S1: "confirmed:task-1" }, taskId: "task-1" }
    await page.addInitScript(({ role, key, projection }) => {
      localStorage.setItem("snap_web_session", JSON.stringify({ role, authenticated: true }))
      localStorage.setItem(key, JSON.stringify(projection))
    }, { role, key, projection })
    await page.goto("/onboarding")
    await expect(page.getByRole("heading", { name: "처음 시작하기", exact: true })).toBeVisible()
    await expect(page.getByText("SNAP이 읽기 전용 상태입니다.", { exact: true })).toHaveCount(1)
    await expect(page.getByText(`진행 1/${role === "operator" ? 4 : 6}`, { exact: true })).toBeVisible()
    await expect(page.getByRole("region", { name: "제품 시작" }).getByText("완료", { exact: true })).toHaveCount(1)
    await expect(page.getByRole("link", { name: "구독하기", exact: true })).toHaveCount(role === "owner" ? 1 : 0)
    if (role !== "owner") await expect(page.getByText("구독은 조직 소유자가 시작할 수 있습니다.")).toBeVisible()
    await expect(page.getByRole("region", { name: "제품 시작" }).getByRole("button")).toHaveCount(0)
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual(projection)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (role === "operator") {
      await page.goto("/settings")
      await expect(page.getByText("이 화면을 볼 권한이 없습니다", { exact: true })).toBeVisible()
    }
  })
}

test("evidence read errors do not display zero counts and retry recovers the same allocation", async ({ page }) => {
  await page.goto("/erp/snap-evidence")
  await expect(page.getByRole("region", { name: "배정 목록" })).toContainText("HMMU7820194")
  await page.evaluate(async () => {
    const url = performance.getEntriesByType("resource").map(entry => entry.name).find(url => url.includes("snap-evidence-workspace.tsx"))!
    const { snapEvidencePreview } = await import(/* @vite-ignore */ url)
    const original = snapEvidencePreview.read
    let first = true
    snapEvidencePreview.read = (...args: unknown[]) => { if (first) { first = false; throw new Error("Read failed") }; return original(...args) }
  })
  await page.getByRole("button", { name: "새로고침", exact: true }).click()
  await expect(page.getByRole("alert")).toContainText("근거를 불러오지 못했습니다.")
  await expect(page.getByRole("region", { name: "배정 목록" })).toHaveCount(0)
  await page.getByRole("button", { name: "다시 시도", exact: true }).click()
  await expect(page.getByRole("region", { name: "배정 목록" })).toContainText("HMMU7820194")
})

for (const role of ["owner", "admin", "member"]) {
  test(`approval policy settings are owner-only: ${role}`, async ({ page }) => {
    await page.goto(`/erp/settings?section=approvals&role=${role}`)
    if (role === "owner") {
      await expect(page.getByRole("button", { name: "결재 정책", exact: true })).toBeVisible()
      await expect(page.getByRole("heading", { name: "결재 정책", exact: true })).toBeVisible()
      await expect(page.getByRole("button", { name: "정책 저장", exact: true })).toBeVisible()
    } else {
      await expect(page.getByRole("button", { name: "결재 정책", exact: true })).toHaveCount(0)
      await expect(page.getByRole("alert")).toContainText("결재 정책에 접근할 수 없습니다.")
      await expect(page.getByRole("button", { name: "정책 저장", exact: true })).toHaveCount(0)
    }
  })
}

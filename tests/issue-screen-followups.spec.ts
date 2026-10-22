import { expect, test } from "@playwright/test"
import { getGeneratedDocumentListStage } from "../trade-os/lib/generatedDocumentListStage"

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

test("document list advances past approval without automatically confirming or retaining old labels", () => {
  expect(getGeneratedDocumentListStage({ status: "draft", approvalStatus: "approved" }).label).toBe("승인 완료")
  for (const approvalStatus of ["none", "pending", "approved", "rejected"] as const) {
    expect(getGeneratedDocumentListStage({ status: "confirmed", approvalStatus }).label).toBe("확정")
    expect(getGeneratedDocumentListStage({ status: "sent", approvalStatus }).label).toBe("발송됨")
  }
  expect(getGeneratedDocumentListStage({ status: "draft", approvalStatus: "none" }).label).toBe("작성 중")
})

test("document list shows one current label and separates stage lists while keeping PDF actions", async ({
  page,
}) => {
  await page.goto("/erp/documents/create")
  const row = page.getByRole("row").filter({ hasText: "CI-2026-0918" })
  await expect(row).toContainText("승인 완료")
  await expect(row.getByRole("cell").nth(2).locator('[data-slot="badge"]')).toHaveText("승인 완료")
  await expect(row.getByRole("cell").nth(2)).toContainText("승인 완료 · 최종 검토")
  await expect(row).not.toContainText("작성 중")
  await expect(row).not.toContainText("초안 PDF")
  await expect(row.getByRole("button", { name: /초안 PDF 보기/ })).toBeEnabled()

  const unrequested = page.getByRole("row").filter({ hasText: "SC-2026-0708" })
  await expect(unrequested).toContainText("작성 중")
  await expect(unrequested).not.toContainText("요청 전")
  await expect(unrequested).not.toContainText("PDF 미생성")
  await expect(unrequested.getByRole("cell").nth(2)).toContainText("거래 연결 필요")
  await expect(unrequested.getByRole("button", { name: /PDF 미생성/ })).toBeDisabled()

  const confirmed = page.getByRole("row").filter({ hasText: "CI-2026-0703" })
  await expect(confirmed).toContainText("확정")
  await expect(confirmed).not.toContainText("승인 없음")
  await expect(confirmed).not.toContainText("최종 PDF")
  await expect(confirmed.getByRole("cell").nth(2)).toContainText("전달 준비")
  await expect(confirmed.getByRole("button", { name: /최종 PDF 보기/ })).toBeEnabled()
  await expect(confirmed.getByRole("button", { name: "고객 전달", exact: true })).toBeEnabled()

  await expect(page.getByRole("row").filter({ hasText: "SC-2026-0918" })).toContainText("승인 대기")
  await expect(page.getByRole("row").filter({ hasText: "PO-2026-0918" })).toContainText("반려")

  const stageLists = [
    { label: "작성 중", numbers: ["SC-2026-0708", "CI-2026-0708", "CI-2026-0712", "QT-2026-0630"] },
    { label: "승인 대기", numbers: ["SC-2026-0918"] },
    { label: "반려", numbers: ["PO-2026-0918"] },
    { label: "승인 완료", numbers: ["CI-2026-0918"] },
    { label: "확정", numbers: ["CI-2026-0703", "CI-2026-0704", "SOA-2026-0629"] },
    { label: "발송됨", numbers: [] },
  ]
  for (const { label, numbers } of stageLists) {
    await page.getByRole("tab", { name: `${label} ${numbers.length}`, exact: true }).click()
    const panel = page.getByRole("tabpanel")
    await expect(panel.locator("tbody tr")).toHaveCount(numbers.length)
    for (const number of numbers) {
      const cell = panel.getByRole("row").filter({ hasText: number }).getByRole("cell").nth(2)
      await expect(cell.locator('[data-slot="badge"]')).toHaveText(label)
      await expect(cell.locator('[data-slot="badge"]')).toHaveCount(1)
    }
  }
  await expect(page.getByText("해당 상태의 최근 문서가 없습니다.")).toBeVisible()
  await page.getByRole("tab", { name: "전체 10", exact: true }).click()
  await page.getByRole("searchbox", { name: "만든 문서 검색", exact: true }).fill("작성 중")
  await expect(page.getByRole("tab", { name: "전체 4", exact: true })).toBeVisible()
  await expect(page.getByRole("tabpanel").locator("tbody tr")).toHaveCount(4)
  await expect(page.getByRole("row").filter({ hasText: "CI-2026-0918" })).toHaveCount(0)
  await page.getByRole("searchbox", { name: "만든 문서 검색", exact: true }).fill("")
  await row.getByRole("button", { name: "상업송장 승인 완료 메뉴", exact: true }).click()
  await row.getByRole("button", { name: "복제하여 수정", exact: true }).click()
  await page.getByRole("tab", { name: "작성 중 5", exact: true }).click()
  const duplicate = page.getByRole("row").filter({ hasText: "CI-2026-0083" })
  await expect(duplicate.getByRole("cell").nth(2).locator('[data-slot="badge"]')).toHaveText("작성 중")
  await expect(duplicate.getByRole("button", { name: /PDF 미생성/ })).toBeDisabled()
  await page.getByRole("tab", { name: "승인 완료 1", exact: true }).click()
  await expect(row.getByRole("cell").nth(2).locator('[data-slot="badge"]')).toHaveText("승인 완료")
})

test("generated document cards resume work while PDF buttons keep file actions separate", async ({
  page,
}) => {
  await page.goto("/erp/documents/create")

  const noPdf = page.getByRole("row").filter({ hasText: "SC-2026-0708" })
  await expect(noPdf.getByRole("button", { name: /PDF 미생성/ })).toBeDisabled()
  await noPdf.getByText("표준 매매계약서 초안", { exact: true }).click()
  await expect(page).toHaveURL(/\/erp\/documents\/create\/SC-2026-0708/)
  await expect(
    page.getByRole("button", { name: "문서 초안 만들기", exact: true })
  ).toBeVisible()

  await page.goto("/erp/documents/create")
  const draftPdf = page.getByRole("row").filter({ hasText: "SC-2026-0918" })
  await draftPdf.getByRole("button", { name: /PDF 검토하기/ }).click()
  await expect(page).toHaveURL(/\/erp\/documents\/create\/SC-2026-0918/)
  await expect(
    page.getByRole("button", { name: "검토 완료", exact: true }).first()
  ).toBeVisible()
  await expect(page.getByRole("button", { name: "초안 PDF 다운로드", exact: true })).toHaveCount(0)

  await page.goto("/erp/documents/create")
  const reviewedPdf = page.getByRole("row").filter({ hasText: "CI-2026-0918" })
  await reviewedPdf.getByRole("button", { name: /초안 PDF 보기/ }).click()
  const draftPreview = page.getByRole("dialog")
  await expect(draftPreview.getByRole("heading", { name: "초안 PDF 보기" })).toBeVisible()
  await expect(draftPreview.getByRole("button", { name: "초안 PDF 다운로드", exact: true })).toBeVisible()
  await draftPreview.getByRole("button", { name: "Close", exact: true }).click()

  const finalPdf = page.getByRole("row").filter({ hasText: "CI-2026-0703" })
  await finalPdf.getByRole("button", { name: /최종 PDF 보기/ }).click()
  const finalPreview = page.getByRole("dialog")
  await expect(finalPreview.getByRole("heading", { name: "최종 PDF 보기" })).toBeVisible()
  await expect(finalPreview.getByRole("button", { name: "최종 PDF 다운로드", exact: true })).toBeVisible()
  await finalPreview.getByRole("button", { name: "Close", exact: true }).click()

  await finalPdf.getByText("수출 인보이스", { exact: true }).click()
  await expect(page).toHaveURL(/\/erp\/documents\/create\/CI-2026-0703/)
  await expect(page.getByRole("dialog")).toHaveCount(0)

  await page.goto("/erp/documents/create")
  await page
    .getByRole("row")
    .filter({ hasText: "CI-2026-0703" })
    .getByRole("button", { name: "고객 전달", exact: true })
    .click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await expect(page.getByRole("dialog")).toContainText("파일 공유하기")
})

test("next document opens the matching draft without confirming it", async ({
  page,
}) => {
  await page.goto("/erp/deals/DL-260707-04")
  const next = page.locator("[data-deal-information-aside] [data-next-document]")
  await expect(page.getByRole("region", { name: "거래 중요 알림" }).locator("[data-next-document]")).toHaveCount(0)
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

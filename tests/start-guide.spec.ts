import { expect, test } from "@playwright/test"
import {
  applyGuideEvent,
  freshGuide,
  parseGuide,
} from "../trade-os/onboarding/state"
const key = "ecoya.preview.start-guide.v1:preview-account:ecoya"

test("receipts are monotonic, scoped to the anchor, and never inferred from visits", () => {
  let state = freshGuide()
  state = applyGuideEvent(state, {
    type: "upload-started",
    documentId: "a.pdf",
  })
  expect(state.trade.T1).toBeUndefined()
  state = applyGuideEvent(state, {
    type: "document-created",
    documentId: "a.pdf",
    receipt: "created",
  })
  state = applyGuideEvent(state, {
    type: "extraction",
    documentId: "a.pdf",
    stage: "ready",
  })
  expect(
    applyGuideEvent(state, {
      type: "reviewed",
      documentId: "b.pdf",
      receipt: "wrong",
    })
  ).toEqual(state)
  state = applyGuideEvent(state, {
    type: "reviewed",
    documentId: "a.pdf",
    receipt: "review",
  })
  state = applyGuideEvent(state, {
    type: "linked",
    documentId: "a.pdf",
    dealId: "deal-a",
    receipt: "link",
  })
  expect(
    applyGuideEvent(state, {
      type: "answer-confirmed",
      dealId: "deal-b",
      answerId: "answer",
      sourceDealIds: ["deal-b"],
      receipt: "wrong",
    })
  ).toEqual(state)
  expect(
    applyGuideEvent(state, {
      type: "answer-confirmed",
      dealId: "deal-a",
      answerId: "answer",
      sourceDealIds: ["deal-b"],
      receipt: "wrong",
    })
  ).toEqual(state)
  state = applyGuideEvent(state, {
    type: "answer-confirmed",
    dealId: "deal-a",
    answerId: "answer",
    sourceDealIds: ["deal-a"],
    receipt: "answer",
  })
  expect(Object.keys(state.trade)).toHaveLength(4)
  expect(parseGuide(JSON.stringify(state))).toEqual(state)
  expect(() => parseGuide('{"version":2}')).toThrow()
  expect(
    applyGuideEvent(
      { ...state, access: "read-only" },
      { type: "education", item: "C1", receipt: "no" }
    ).common.C1
  ).toBeUndefined()
})

test("organization education targets the control, persists, and never replays on reload", async ({
  page,
}) => {
  await page.goto("/erp/onboarding")
  await page
    .getByRole("button", { name: /확인하기.*조직 정보 확인하기/ })
    .click()
  const dialog = page.getByRole("dialog", { name: "조직 정보 확인하기" })
  await expect(dialog).toBeVisible()
  await expect(page.locator('[data-guide-target="organization"]')).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await page.reload()
  await expect(dialog).toBeHidden()
  await page.goto("/erp/onboarding")
  await expect(page.getByLabel("진행 1/6", { exact: true })).toBeVisible()
  await page
    .getByRole("button", { name: /확인하기.*팀원 초대 방법 확인하기/ })
    .click()
  await expect(
    page.getByRole("dialog", { name: "팀원 초대 방법 확인하기" })
  ).toBeVisible()
  await expect(page.locator('[data-guide-target="invite"]')).toBeFocused()
})

test("member gets four items; simply leaving and revisiting does not complete anything", async ({
  page,
}) => {
  await page.goto("/erp/onboarding?role=member")
  await expect(page.getByLabel("진행 0/4", { exact: true })).toBeVisible()
  await expect(page.getByRole("heading", { name: "조직 안내" })).toHaveCount(0)
  await page.getByRole("button", { name: "오늘 할 일로 이동" }).click()
  await expect(page).toHaveURL(/\/erp\/home/)
  await page.goto("/erp/onboarding?role=member")
  await expect(page.getByLabel("진행 0/4", { exact: true })).toBeVisible()
})

test("sample PDF starts and resumes the same document without manually completing steps", async ({
  page,
}) => {
  test.setTimeout(60000)
  await page.goto("/erp/onboarding")
  for (const title of ["조직 정보 확인하기", "팀원 초대 방법 확인하기"]) {
    await page
      .getByRole("button", { name: new RegExp(`확인하기.*${title}`) })
      .click()
    await expect(page.getByRole("dialog", { name: title })).toBeVisible()
    await page.goto("/erp/onboarding")
  }
  await page.getByRole("button", { name: "내 PDF 선택", exact: true }).click()
  await page.getByRole("button", { name: "예시 PDF 사용" }).click()
  await expect
    .poll(async () =>
      page.evaluate(
        (k) => JSON.parse(localStorage.getItem(k) || "{}").trade?.T1,
        key
      )
    )
    .toBeTruthy()
  await page.goto("/erp/onboarding")
  await expect(page.getByLabel("진행 3/6", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "AI 결과 확인하기" }).click()
  await expect(page).toHaveURL(/PO_.*\/review/)
  await expect(
    page.getByRole("dialog", { name: "AI 결과 확인·확정하기" })
  ).toBeVisible()
  await page.keyboard.press("Escape")
  await page.getByRole("spinbutton", { name: "단가", exact: true }).fill("1850")
  await page.getByRole("spinbutton", { name: "단가", exact: true }).blur()
  await expect(
    page.getByRole("spinbutton", { name: "단가", exact: true })
  ).toHaveValue("1850")
  await page
    .locator('[data-upload-field="etd"] input')
    .first()
    .fill("2026-11-01")
  await page.locator('[data-upload-field="etd"] input').first().blur()
  await page.getByRole("button", { name: "거래 연결", exact: true }).click()
  await expect
    .poll(async () =>
      page.evaluate(
        (k) => JSON.parse(localStorage.getItem(k) || "{}").trade?.T2,
        key
      )
    )
    .toBeTruthy()
  await page.goto("/erp/onboarding")
  await page.getByRole("button", { name: "거래 연결 계속하기" }).click()
  await expect(
    page.getByRole("dialog", { name: "거래 만들기·연결하기" })
  ).toBeVisible()
  await page.keyboard.press("Escape")
  await page.getByRole("radio").first().click()
  await page
    .getByRole("button", { name: "선택한 거래 연결", exact: true })
    .click()
  await expect
    .poll(async () =>
      page.evaluate(
        (k) => JSON.parse(localStorage.getItem(k) || "{}").trade?.T3,
        key
      )
    )
    .toBeTruthy()
  await page.goto("/erp/onboarding")
  await page
    .getByRole("button", { name: "AI에게 질문하기", exact: true })
    .click()
  await expect(
    page.getByRole("dialog", { name: "거래 데이터에 AI로 질문하기" })
  ).toBeVisible()
  await page.keyboard.press("Escape")
  await page
    .getByRole("textbox", { name: "AI에게 질문", exact: true })
    .fill("방금 연결한 문서를 요약해줘")
  await page
    .getByRole("textbox", { name: "AI에게 질문", exact: true })
    .press("Control+Enter")
  await page.getByRole("button", { name: "답변과 근거 확인 완료" }).click()
  await expect
    .poll(async () =>
      page.evaluate(
        (k) => JSON.parse(localStorage.getItem(k) || "{}").trade?.T4,
        key
      )
    )
    .toBeTruthy()
  await expect(
    page.getByRole("button", { name: "처음 시작하기", exact: true })
  ).toHaveCount(0)
  await page.goto("/erp/onboarding")
  await expect(page).toHaveURL(/\/erp\/home/)
})

for (const width of [1440, 390])
  test(`last receipt hides menu and blocks guide URL at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto("/erp/home?role=member")
    await page.evaluate(
      ({ key }) =>
        localStorage.setItem(
          key,
          JSON.stringify({
            version: 1,
            common: {},
            trade: { T1: "created", T2: "reviewed", T3: "linked" },
            anchor: {
              documentId: "PO_예시.pdf",
              stage: "ready",
              dealId: "DL-260708-01",
            },
          })
        ),
      { key }
    )
    await page.reload()
    const input = page.getByRole("textbox", {
      name: "AI에게 질문",
      exact: true,
    })
    await input.fill("연결한 문서를 요약해줘")
    await input.press("Control+Enter")
    await expect(
      page.getByRole("region", { name: "거래 질문 답변" })
    ).toContainText("PO_예시.pdf")
    await page.getByRole("button", { name: "답변과 근거 확인 완료" }).click()
    await expect(
      page.getByRole("button", { name: "처음 시작하기", exact: true })
    ).toHaveCount(0)
    await page.goto("/erp/onboarding?role=member")
    await expect(page).toHaveURL(/\/erp\/home/)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth
      )
    ).toBe(false)
  })

test("corrupt progress offers retry instead of zero; read-only preserves progress", async ({
  page,
}) => {
  await page.goto("/erp/home")
  await page.evaluate((k) => localStorage.setItem(k, "broken"), key)
  await page.goto("/erp/onboarding")
  await expect(
    page.getByRole("button", { name: "다시 시도", exact: true })
  ).toBeVisible()
  await expect(page.getByLabel("진행 0/6", { exact: true })).toHaveCount(0)
  await page.evaluate(
    (k) =>
      localStorage.setItem(
        k,
        JSON.stringify({
          version: 1,
          common: { C1: "education" },
          trade: {},
          access: "read-only",
        })
      ),
    key
  )
  await page.getByRole("button", { name: "다시 시도", exact: true }).click()
  await expect(page.getByLabel("진행 1/6", { exact: true })).toBeVisible()
  await expect(
    page.getByRole("button", { name: "내 PDF 선택", exact: true })
  ).toBeDisabled()
})

import { expect, test } from "@playwright/test"

for (const width of [1440, 390]) {
  test(`restored document direction tabs keep a selected first template at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto("/erp/documents/create?state=first-use")
    const strip = page.getByRole("region", { name: "문서 폼 선택", exact: true })
    await expect(strip.getByRole("tablist")).toHaveCount(1)
    const cards = strip.locator('[aria-label="문서 유형 목록"] button')
    await expect(cards).toHaveCount(13)
    await expect(cards.first()).toHaveAttribute("aria-pressed", "true")
    await expect(strip.getByText("13개", { exact: true })).toBeVisible()
    const create = strip.getByRole("button", { name: "문서 만들기", exact: true })
    await expect(create).toBeEnabled()
    await strip.getByRole("button", { name: /PO.*발주서/ }).click()
    await strip.getByRole("tab", { name: "매출", exact: true }).click()
    await expect(cards).toHaveCount(12)
    await expect(strip.getByText("12개", { exact: true })).toBeVisible()
    await expect(strip.getByRole("button", { name: /PO.*발주서/ })).toHaveCount(0)
    await expect(cards.first()).toHaveAttribute("aria-pressed", "true")
    await expect(create).toBeEnabled()
    await strip.getByRole("tab", { name: "매입", exact: true }).click()
    await expect(cards).toHaveCount(13)
    await expect(cards.first()).toHaveAttribute("aria-pressed", "true")
    await create.click()
    if (width < 768) await page.getByRole("button", { name: "항목 확인", exact: true }).click()
    await expect(page.getByRole("textbox", { name: "품목 1 품목명", exact: true })).toBeVisible()
  })
}

for (const [filename, label, status] of [
  ["인보이스_중복확인_0918.pdf", "CI · 상업송장", "중복 확인 필요"],
  ["스캔문서_유형확인_0918.pdf", "미확인 문서", "유형 확인 필요"],
]) {
  test(`upload queue preserves selected document context and all three add actions: ${label}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(`/erp/documents/upload/${encodeURIComponent(filename)}/review`)
    const queue = page.getByRole("button", { name: "검토·배정 대기 문서 목록", exact: true })
    await expect(queue).toHaveAttribute("aria-expanded", "false")
    await expect(queue).toContainText(label)
    await expect(queue).toContainText(filename)
    await expect(queue).toContainText(status)
    await page.getByRole("button", { name: "파일 추가 메뉴", exact: true }).click()
    for (const action of ["이메일에서 찾기", "폴더 선택", "파일 선택"]) {
      await expect(page.getByRole("menuitem", { name: action, exact: true })).toBeVisible()
    }
    const chooser = page.waitForEvent("filechooser")
    await page.getByRole("menuitem", { name: "파일 선택", exact: true }).click()
    expect((await chooser).isMultiple()).toBe(true)
    await expect(queue).toHaveAttribute("aria-expanded", "false")
    await queue.click()
    await expect(queue).toHaveAttribute("aria-expanded", "true")
    await expect(queue).toContainText(label)
  })
}

for (const width of [1440, 390]) {
  test(`language selection works across shared landing and auth headers at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    for (const route of ["/", "/trade-os", "/snap", "/pricing", "/contact", "/login?product=erp", "/signup", "/terms"]) {
      await page.goto(route)
      const header = page.locator("header").first()
      const control = header.locator(".ecoya-locale-select")
      const select = control.locator("select")
      await expect(select).toBeVisible()
      await select.selectOption("ko")
      const before = (await control.boundingBox())!
      const hit = await control.evaluate((node) => {
        const box = node.getBoundingClientRect()
        return document.elementFromPoint(box.x + 2, box.y + box.height / 2)?.tagName
      })
      expect(hit).toBe("SELECT")
      await select.selectOption("en")
      await expect(page.locator("html")).toHaveAttribute("lang", "en")
      const after = (await control.boundingBox())!
      expect(Math.abs(before.x - after.x)).toBeLessThanOrEqual(1)
      expect(Math.abs(before.width - after.width)).toBeLessThanOrEqual(1)
      if (route.startsWith("/login") || route === "/signup") {
        await expect(header.getByRole("link", { name: /^(Login|Log in|Sign in|Get started|Start now)$/i })).toHaveCount(0)
      }
      await select.selectOption("ko")
      await expect(page.locator("html")).toHaveAttribute("lang", "ko")
    }
  })
}

test("link sharing requires creation, permits one live link and records revocation before replacement", async ({ page }) => {
  await page.goto("/erp/documents/create/CI-2026-0703")
  await page.getByRole("button", { name: "공유하기", exact: true }).first().click()
  const share = page.getByRole("dialog", { name: "파일 공유하기", exact: true })
  await expect(share.getByLabel("받는 사람", { exact: true })).toHaveCount(0)
  await share.getByRole("button", { name: "공유 링크 만들기", exact: true }).click()
  await expect(share.getByRole("button", { name: "공유 링크 만들기", exact: true })).toHaveCount(0)
  await expect(share.getByRole("button", { name: "복사", exact: true })).toBeEnabled()
  await share.getByRole("button", { name: "철회", exact: true }).click()
  const confirm = page.getByRole("alertdialog", { name: "공유 링크 철회", exact: true })
  const revoke = confirm.getByRole("button", { name: "철회", exact: true })
  await expect(revoke).toBeDisabled()
  await confirm.getByLabel("철회 사유", { exact: true }).fill("첨부 문서 교체")
  await revoke.click()
  await expect(share.getByRole("button", { name: "복사", exact: true })).toBeDisabled()
  await expect(share.getByRole("button", { name: "공유 링크 만들기", exact: true })).toBeEnabled()
  await share.getByRole("button", { name: "전달 내역", exact: true }).click()
  await expect(share).toContainText("첨부 문서 교체")
  await share.getByRole("button", { name: "전달", exact: true }).click()
  await share.getByRole("button", { name: "공유 링크 만들기", exact: true }).click()
  await expect(share.getByRole("button", { name: "복사", exact: true })).toHaveCount(2)
  await expect(share.getByRole("button", { name: "복사", exact: true }).filter({ visible: true }).last()).toBeEnabled()
})

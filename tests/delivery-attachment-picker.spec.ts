import { expect, test } from "@playwright/test"

for (const width of [1440, 390]) {
  test(`sharing attachments open, preview and detach at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto("/erp/documents/create/CI-2026-0703")
    await page.getByRole("button", { name: "공유하기", exact: true }).click()
    await page.setViewportSize({ width, height: 900 })
    const share = page.getByRole("dialog", {
      name: "파일 공유하기",
      exact: true,
    })
    const linkPosition = await share
      .getByRole("heading", { name: "공유 링크", exact: true })
      .evaluate((el) => (el as HTMLElement).offsetTop)
    await share.getByRole("button", { name: "파일 추가", exact: true }).click()
    const picker = share.getByRole("region", {
      name: "동봉 파일 선택",
      exact: true,
    })
    await expect(picker).toBeVisible()
    await expect(page.getByRole("dialog")).toHaveCount(1)
    await expect(
      share.getByRole("button", { name: "파일 추가", exact: true })
    ).toHaveAttribute("aria-expanded", "true")
    expect(
      await share
        .getByRole("heading", { name: "공유 링크", exact: true })
        .evaluate((el) => (el as HTMLElement).offsetTop)
    ).toBeGreaterThan(linkPosition)
    await expect(
      share
        .getByRole("button", { name: "수신 화면 미리보기", exact: true })
        .locator("svg")
    ).toHaveClass(/lucide-external-link/)
    await expect(
      picker.getByText("은행_입금확인서.pdf", { exact: true })
    ).toBeVisible()
    await expect(
      picker.getByRole("checkbox", { name: "은행_입금확인서.pdf", exact: true })
    ).toBeDisabled()
    await expect(
      picker.getByRole("checkbox", { name: "PO_OtherDeal.pdf", exact: true })
    ).toBeDisabled()
    await expect(
      picker.getByText("은행 보안문서 · 첨부 불가", { exact: true })
    ).toBeVisible()
    await expect(picker.getByRole("checkbox")).toHaveCount(3)
    const packing = picker.getByRole("checkbox", {
      name: "PackingList_0707.pdf",
      exact: true,
    })
    await picker.getByText("PackingList_0707.pdf", { exact: true }).click()
    await expect(packing).toBeChecked()
    await expect(picker).toContainText("선택됨")
    await expect(picker).toContainText("동봉 파일 1개")
    await packing.press("Space")
    await expect(packing).not.toBeChecked()
    await packing.press("Space")
    await expect(packing).toBeChecked()
    await picker.getByRole("button", { name: "선택 완료", exact: true }).click()
    await share
      .getByRole("button", {
        name: "PackingList_0707.pdf 미리보기",
        exact: true,
      })
      .click()
    const preview = page.getByRole("dialog", {
      name: "PackingList_0707.pdf",
      exact: true,
    })
    await expect(
      preview.getByTitle("PackingList_0707.pdf 미리보기")
    ).toHaveAttribute("src", /^blob:/)
    await preview
      .getByRole("button", { name: "동봉 파일 미리보기 닫기", exact: true })
      .click()
    await share
      .getByRole("button", {
        name: "PackingList_0707.pdf 동봉 해제",
        exact: true,
      })
      .click()
    await expect(
      share.getByRole("button", {
        name: "PackingList_0707.pdf 미리보기",
        exact: true,
      })
    ).toHaveCount(0)
    await share.getByRole("button", { name: "파일 추가", exact: true }).click()
    await picker.locator("input[type=file]").setInputFiles({
      name: "invalid.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("not a pdf"),
    })
    await expect(picker.getByRole("alert")).toContainText("PDF, PNG, JPG")
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1XcAAAAASUVORK5CYII=",
      "base64"
    )
    await picker.locator("input[type=file]").setInputFiles({
      name: "packing-photo.png",
      mimeType: "image/png",
      buffer: png,
    })
    await expect(picker).toContainText("동봉 파일 1개")
    await picker.getByRole("button", { name: "선택 완료", exact: true }).click()
    await share
      .getByRole("button", { name: "packing-photo.png 미리보기", exact: true })
      .click()
    const imagePreview = page.getByRole("dialog", {
      name: "packing-photo.png",
      exact: true,
    })
    await expect(
      imagePreview.getByRole("img", { name: "packing-photo.png", exact: true })
    ).toBeVisible()
    await expect
      .poll(() =>
        imagePreview
          .locator("img")
          .evaluate((el: HTMLImageElement) => el.naturalWidth)
      )
      .toBe(1)
    await imagePreview
      .getByRole("button", { name: "동봉 파일 미리보기 닫기", exact: true })
      .click()
    expect(await share.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true
    )
    const download = await share
      .getByRole("button", { name: "전체 패키지 다운로드", exact: true })
      .boundingBox()
    const file = await share
      .getByRole("button", { name: "packing-photo.png 미리보기", exact: true })
      .boundingBox()
    expect(download!.y).toBeLessThan(file!.y)
    await share
      .getByRole("button", { name: "공유 창 닫기", exact: true })
      .click()
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.getByRole("button", { name: "공유하기", exact: true }).click()
    await expect(
      share.getByRole("button", {
        name: "packing-photo.png 미리보기",
        exact: true,
      })
    ).toBeVisible()
    await expect(
      share.getByRole("button", {
        name: "PackingList_0707.pdf 미리보기",
        exact: true,
      })
    ).toHaveCount(0)
  })
}

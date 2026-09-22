import assert from "node:assert/strict"
import fs from "node:fs/promises"
import { chromium } from "@playwright/test"
const origin = process.argv[2] || "http://127.0.0.1:3031"
const browser = await chromium.launch({ channel: "chrome" })
const page = await browser.newPage({
  javaScriptEnabled: false,
  viewport: { width: 1440, height: 1000 },
})
page.setDefaultTimeout(7000)
let transitions = 0
const visit = (id) => page.goto(`${origin}/html/erp/${id}.html`)
const click = async (name, id, index = 0) => {
  await page
    .getByRole("link", { name, exact: typeof name === "string" })
    .nth(index)
    .click()
  assert.equal(
    new URL(page.url()).pathname.replace(/\.html$/, ""),
    `/html/erp/${id}`,
    String(name)
  )
  transitions++
}
const contains = async (text) =>
  assert.ok(
    (await page.locator("body").innerText()).includes(text),
    `Missing result: ${text}`
  )
try {
  await visit("document-flow-admin-pending")
  await click("승인", "document-flow-admin-approved")
  await contains("김도현 · Admin")
  await click("문서 확정", "document-flow-admin-confirmed")
  await contains("문서가 확정되었습니다")
  await visit("document-flow-admin-pending")
  await click("반려", "document-flow-admin-reject-form")
  assert.ok(
    await page
      .getByRole("button", { name: "반려 확정", exact: true })
      .isDisabled()
  )
  await visit("document-flow-admin-reject-ready")
  await click("반려 확정", "document-flow-admin-rejected")
  await contains("김도현")
  await contains("수취인과 결제조건")
  await visit("document-flow-requester-rejected")
  await click("승인 재요청", "document-flow-requester-rerequested")
  for (const text of ["재요청", "반려 사유", "승인을 기다리고 있습니다"])
    await contains(text)
  await visit("document-flow-requester-approved")
  await click("문서 확정", "document-flow-requester-confirmed")
  await visit("document-flow-link-copied")
  await click("철회", "document-flow-link-revoked")
  await contains("철회됨")
  await visit("document-flow-attachment-added")
  for (const [label, id] of [
    ["Magic Link 만들기", "document-flow-attachment-link-created"],
    ["복사", "document-flow-attachment-link-copied"],
    ["철회", "document-flow-attachment-link-revoked"],
    ["전달 내역", "document-flow-attachment-history-revoked"],
    ["전달", "document-flow-attachment-link-revoked"],
    ["삭제", "document-flow-attachment-link-deleted"],
    ["Magic Link 만들기", "document-flow-attachment-link-created"],
    ["문서로 돌아가기", "document-flow-attachment-summary-active"],
    ["공유하기", "document-flow-attachment-link-created"],
  ])
    await click(label, id)
  await contains("첨부 1개")
  await contains("PackingList_0707.pdf")
  for (let i = 1; i <= 2; i++) {
    await visit("deal-dl-260701-09")
    await click("노트 수정", `deal-note-${i}-edit`, i - 1)
    await click("취소", "deal-dl-260701-09")
    await click("노트 삭제", `deal-note-${i}-delete-confirm`, i - 1)
    await click("삭제", `deal-note-${i}-deleted`)
    assert.equal(
      await page.locator('[aria-label="노트 삭제"]').count(),
      1,
      "Deleted note must be removed"
    )
    await visit(`deal-note-${i}-changed`)
    await click("저장", `deal-note-${i}-saved`)
    await contains("확인 완료")
    assert.equal(
      await page
        .getByRole("textbox", { name: "노트 수정", exact: true })
        .count(),
      0,
      "Saved note must leave edit mode"
    )
  }
  await visit("notifications")
  await click("현재 목록 전체 선택", "notifications-selected-0")
  await click("선택 항목 읽음 처리", "notifications-selected-0-read")
  assert.match(await page.locator("body").innerText(), /미확인\s*0/)
  await visit("notifications")
  await click(
    "판매계약서 승인 요청이 도착했습니다 선택",
    "notifications-selected-2"
  )
  await click("선택 항목 읽음 처리", "notifications-selected-2-read")
  assert.match(await page.locator("body").innerText(), /미확인\s*2/)
  await visit("shipments")
  await click("다음 페이지", "shipments-list-1-page-2")
  await click("다음 페이지", "shipments-list-1-page-3")
  await click("이전 페이지", "shipments-list-1-page-2")
  await click("1페이지", "shipments")
  for (let i = 0; i < 2; i++) {
    await visit("settlement")
    await click("2페이지", `settlement-list-${i + 1}-page-2`, i)
    await click("1페이지", "settlement")
  }
  for (const [base, prefix] of [
    ["document-invoice-connect", "upload-invoice"],
    ["document-connect", "upload-bank"],
  ]) {
    await visit(base)
    await click("파일 추가 메뉴", prefix + "-file-menu")
    await click("이메일에서 찾기", prefix + "-mail")
    await click("Invoice_HB-2607-003.pdf 선택", prefix + "-mail-selected-2")
    await click("PackingList_0707.pdf 선택", prefix + "-mail-empty")
    assert.ok(
      await page
        .getByRole("button", { name: "선택 문서 가져오기", exact: true })
        .isDisabled()
    )
    await click("Invoice_HB-2607-003.pdf 선택", prefix + "-mail-selected")
    await click("선택 문서 가져오기", prefix + "-mail-imported")
    await contains("Invoice_HB-2607-003.pdf")
    await visit(base)
    await click("파일 추가 메뉴", prefix + "-file-menu")
    await click("파일 선택", prefix + "-file-added")
    await contains("추가확인.pdf")
    await visit(base)
    await click("새 거래 등록", prefix + "-new-deal")
    await click("등록 닫기", base)
    await visit(prefix + "-new-empty")
    assert.ok(
      await page
        .getByRole("button", { name: "선택한 거래 연결", exact: true })
        .isDisabled()
    )
    await visit(prefix + "-new-number")
    await click("새 거래 생성·연결", prefix + "-number-linked")
    await contains("DL-260916-90")
    await contains("신규 거래")
    await visit(base)
    await click(/ACME 7월 상업송장 거래/, prefix + "-candidate-2")
    await click("선택한 거래 연결", prefix + "-candidate-2-linked")
    await contains("거래를 찾을 수 없습니다")
  }
  await visit("document-connect")
  await click(/한빛 6월 정산 거래/, "upload-bank-candidate-5")
  assert.ok(
    await page
      .getByRole("button", { name: "결제 일정 선택 필요", exact: true })
      .isDisabled()
  )
  await click(/받을 돈 · 620,000 USD/, "upload-bank-candidate-5-schedule-2")
  await click("선택한 거래 연결", "upload-bank-candidate-5-schedule-2-linked")
  await contains("DL-260701-09")
  const observed = JSON.parse(
    await fs.readFile(
      new URL("./erp-observed-route-links.json", import.meta.url),
      "utf8"
    )
  )
  for (const { source, key, target } of observed) {
    await visit(source)
    const label = key.split("|")[1]
    const linked = await page.locator("a.static-action").evaluateAll(
      (elements, { label, target }) =>
        elements.some((element) => {
          const name = (
            element.getAttribute("aria-label") ||
            element.textContent ||
            ""
          )
            .replace(/\s+/g, " ")
            .trim()
          return (
            name === label && element.getAttribute("href") === target + ".html"
          )
        }),
      { label, target }
    )
    assert.ok(
      linked,
      `Observed route missing: ${source} / ${label} → ${target}`
    )
    transitions++
  }
  console.log(
    JSON.stringify({ transitions, javaScriptEnabled: false, failures: [] })
  )
} finally {
  await browser.close()
}

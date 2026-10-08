import { expect, test, type Page } from "@playwright/test"

test.skip(!process.env.DEMO_BASE_URL, "Run with the operations demo enabled.")

// Intercept only the browser's demo module. No real payment writes are sent.
async function responses(page: Page, scope?: string, status?: string) {
  await page.route("**/trade-os/operations/demo/api.ts*", async (route) => {
    const response = await route.fetch()
    const original = await response.text()
    expect(original).toContain("export async function demoRequest")
    const body = original.replace(
      "export async function demoRequest",
      "async function originalDemoRequest"
    ) + `
      export async function demoRequest(path, init) {
        if (path.endsWith('/uncomplete')) return ${JSON.stringify({ status })};
        const result = await originalDemoRequest(path, init);
        if (path.endsWith('/me/entitlements')) return {
          ...result, features: {...result.features, 'erp.money': true}
        };
        if (path.includes('/finance-facts')) return {
          ...result, scope: ${JSON.stringify(scope) ?? "undefined"}
        };
        if (path.includes('/settlement/ledger')) return {
          ...result, entries: result.entries.slice(0, 3).map((entry, i) => ({
            ...entry, id: 'copy-check-' + i, counterparty_name: '문구 검증 ' + i,
            status: 'completed', closure_type: i === 1 ? 'written_off' : i === 2 ? 'unregistered' : null
          }))
        };
        return result;
      }
    `
    await route.fulfill({ response, body })
  })
  await page.goto("/erp/settlement")
  await expect(page.getByText("문구 검증 0", { exact: true })).toBeVisible()
}

for (const scope of ["assigned_or_shared", "organization", "unregistered", undefined]) {
  test(`finance scope notice uses the server value: ${scope ?? "missing"}`, async ({ page }) => {
    await responses(page, scope)
    const notice = page.getByText("내 담당·공유 거래 기준:", { exact: false })
    await expect(notice).toHaveCount(scope === "assigned_or_shared" ? 1 : 0)
    await expect(page.getByText("종료 · 상각 확정", { exact: true })).toBeVisible()
    await expect(page.getByText("종료 · 기타", { exact: true })).toBeVisible()
  })
}

for (const [status, message] of [
  ["pending", "완료를 취소했습니다. 일정이 예정 상태로 돌아갔습니다. 기록한 입출금은 그대로입니다."],
  ["overdue", "완료를 취소했습니다. 일정이 예정 상태로 돌아갔고, 기한이 지나 연체로 표시됩니다. 기록한 입출금은 그대로입니다."],
  ["unregistered", "완료를 취소했습니다. 기록한 입출금은 그대로입니다."],
  [undefined, "완료를 취소했습니다. 기록한 입출금은 그대로입니다."],
] as const) {
  test(`completion undo notice follows the returned status: ${status ?? "missing"}`, async ({ page }) => {
    await responses(page, undefined, status)
    await page.locator('[data-ui="settlement-uncomplete-action"]').click()
    const dialog = page.getByRole("dialog", { name: "이 일정의 완료를 취소할까요?" })
    await expect(dialog).toContainText("실제 송금이나 환불을 취소하지 않습니다.")
    await dialog.getByRole("button", { name: "완료 취소", exact: true }).click()
    await expect(page.getByText(message, { exact: true })).toBeVisible()
  })
}

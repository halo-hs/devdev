import { expect, test } from '@playwright/test'

test.skip(!process.env.DEMO_BASE_URL, 'Run with DEMO_BASE_URL and VITE_OPERATIONS_DEMO=true.')

test('demo month close can be reopened and closed again', async ({ page }) => {
  const liveRequests: string[] = []
  page.on('request', request => {
    if (request.url().includes('/api/platform')) liveRequests.push(request.url())
  })

  await page.goto(`${process.env.DEMO_BASE_URL}/erp/reports`)
  await page.evaluate(() => localStorage.removeItem('ecoya:public-demo:month-closes:v1'))
  await page.reload()

  const august = page.locator('[data-ui="reports-close-row"]').filter({ hasText: '2026-08' })
  await expect(august).toHaveAttribute('data-reopened', 'true')
  await august.locator('[data-ui="reports-close-snapshot"]').click()
  await expect(page.locator('[data-ui="reports-snapshot"]')).toContainText('USD')
  await page.getByRole('dialog').getByRole('button', { name: '대화상자 닫기' }).click()
  await august.getByRole('button', { name: '2026-08 재마감' }).click()
  await page.getByRole('dialog').getByRole('button', { name: '재마감하기' }).click()
  await expect(august).toHaveAttribute('data-reopened', 'false')
  await august.locator('[data-ui="reports-close-snapshot"]').click()
  await expect(page.locator('[data-ui="reports-snapshot"]')).toContainText('USD')
  await page.getByRole('dialog').getByRole('button', { name: '대화상자 닫기' }).click()

  await august.locator('[data-ui="reports-reopen-button"]').click()
  await page.getByRole('dialog').getByRole('textbox', { name: /사유/ }).fill('누락된 거래 반영')
  await page.getByRole('dialog').getByRole('button', { name: '재개방하기' }).click()
  await expect(august).toHaveAttribute('data-reopened', 'true')
  await expect(august).toContainText('누락된 거래 반영')

  await page.reload()
  await expect(august).toHaveAttribute('data-reopened', 'true')
  expect(liveRequests).toEqual([])
})

for (const width of [1440, 390]) {
  test(`new month close saves a populated frozen snapshot and survives reopening at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 })
    await page.clock.setFixedTime(new Date('2026-10-08T04:00:00Z'))
    await page.goto(`${process.env.DEMO_BASE_URL}/erp/reports`)
    await page.getByRole('button', { name: '2026-09 마감하기', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('textbox').fill('9월 거래와 지급 확인 완료')
    await dialog.getByRole('button', { name: '마감하기', exact: true }).click()
    await expect(dialog).toBeHidden()
    const september = page.locator('[data-ui="reports-close-row"]').filter({ hasText: '2026-09' })
    await expect(september).toHaveCount(1)
    await expect(september).toHaveAttribute('data-reopened', 'false')
    await expect(september).toContainText('동결됨')
    await september.locator('[data-ui="reports-close-snapshot"]').click()
    const snapshot = page.locator('[data-ui="reports-snapshot"]')
    await expect(snapshot).toContainText('783,900')
    await expect(snapshot).toContainText('Indigo Commerce')
    await expect(snapshot).toContainText('9월 거래와 지급 확인 완료')
    await expect(snapshot.getByRole('table')).toHaveCount(2)
    await page.screenshot({ path: `/tmp/devdev-month-close-snapshot-${width}.png` })
    await dialog.getByRole('button', { name: '대화상자 닫기' }).click()
    const frozen = await page.evaluate(() => JSON.parse(localStorage.getItem('ecoya:public-demo:month-closes:v1')!).find((row: { period_start: string }) => row.period_start === '2026-09-01').snapshot)

    await september.locator('[data-ui="reports-reopen-button"]').click()
    await dialog.getByRole('textbox', { name: /사유/ }).fill('누락 증빙 확인')
    await dialog.getByRole('button', { name: '재개방하기', exact: true }).click()
    await expect(september).toHaveAttribute('data-reopened', 'true')
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ecoya:public-demo:month-closes:v1')!).find((row: { period_start: string }) => row.period_start === '2026-09-01').snapshot)).toEqual(frozen)
    await page.reload()
    await expect(september).toHaveAttribute('data-reopened', 'true')
    await september.locator('[data-ui="reports-close-snapshot"]').click()
    await expect(snapshot).toContainText('783,900')
    await expect(snapshot).toContainText('Indigo Commerce')
    await dialog.getByRole('button', { name: '대화상자 닫기' }).click()
    await september.getByRole('button', { name: '2026-09 재마감', exact: true }).click()
    await dialog.getByRole('button', { name: '재마감하기', exact: true }).click()
    await expect(september).toHaveCount(1)
    await expect(september).toHaveAttribute('data-reopened', 'false')
  })
}

test('legacy month-close records without snapshot contents load the JSON fixture', async ({ page }) => {
  await page.goto(`${process.env.DEMO_BASE_URL}/erp/reports`)
  await page.evaluate(() => localStorage.setItem('ecoya:public-demo:month-closes:v1', JSON.stringify([{
    id: 'legacy-august', period_start: '2026-08-01', period_end: '2026-08-31',
    timezone: 'Asia/Seoul', closed_by: 'demo', closed_at: '2026-09-01T00:00:00Z',
    reopened: true, snapshot: { version: 1 },
  }])))
  await page.reload()
  await page.locator('[data-ui="reports-close-snapshot"]').click()
  await expect(page.locator('[data-ui="reports-snapshot"]')).toContainText('420,000')
  await expect(page.locator('[data-ui="reports-snapshot"]')).toContainText('Indigo Commerce')
})

test('preview closing still works when persistent storage is unavailable', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-08T04:00:00Z'))
  await page.addInitScript(() => {
    const setItem = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'ecoya:public-demo:month-closes:v1') throw new DOMException('Storage unavailable', 'QuotaExceededError')
      return setItem.call(this, key, value)
    }
  })
  await page.goto(`${process.env.DEMO_BASE_URL}/erp/reports`)
  await page.getByRole('button', { name: '2026-09 마감하기', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: '마감하기', exact: true }).click()
  const september = page.locator('[data-ui="reports-close-row"]').filter({ hasText: '2026-09' })
  await expect(september).toHaveAttribute('data-reopened', 'false')
  await september.locator('[data-ui="reports-close-snapshot"]').click()
  await expect(page.locator('[data-ui="reports-snapshot"]')).toContainText('783,900')
})

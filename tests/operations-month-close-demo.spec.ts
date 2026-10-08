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

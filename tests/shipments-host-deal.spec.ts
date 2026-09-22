import { expect, test, type Page } from '@playwright/test'

const dealId = 'aaaaaaaa-1111-4111-8111-111111111111'
const shipmentId = 'bbbbbbbb-2222-4222-8222-222222222222'
const original = { id: shipmentId, deal_id: dealId, deal_title: '연결 검증 거래', deal_counterparty: '연결 검증 거래처', bl_number: 'TEST-BL-01', container_number: 'TEST000001', pol: 'KRPUS', pod: 'DEHAM', eta: '2026-09-24', etd: '2026-09-10', source: 'carrier', status: 'departed' }

async function mockShipmentSession(page: Page, writable = true) {
  await page.route('**/__reference3030/api/platform/me', route => route.fulfill({ json: {
    user_id: 'test-user', account: { account_id: 'test-user', email_verified: true },
    current_organization_id: 'test-org', organizations: [{ organization_id: 'test-org', lifecycle_state: 'active', membership: { status: 'active', role: 'OWNER' } }],
    capabilities: { can_create_organization: false, can_manage_billing: false, can_manage_products: false },
    products: [{ product_id: 'TRADE_OS', subscription_state: 'paid_active', trial_state: 'not_started', trial_quota_state: 'not_applicable', product_access_allowed: true, entitlement_state: 'active', member_access: 'granted', onboarding_state: 'complete' }],
    landing: { state: 'ready', path: '/erp/shipments', reason_code: 'TEST_READY', allowed_actions: [], product_id: 'TRADE_OS', organization_id: 'test-org' },
  } }))
  await page.route('**/__reference3030/api/platform/me/entitlements', route => route.fulfill({ json: {
    features: { 'erp.write': writable }, products: { erp: { enabled: true }, snap: { enabled: false }, intelligence: { enabled: false } }, workspace: { default_product: 'TRADE_OS' },
  } }))
  await page.route('**/__reference3030/api/platform/trade/snap-evidence/**', route => route.fulfill({ json: { containers: [] } }))
}

test('tracking refresh stays on this host and the exact deal reads the updated shipment', async ({ page }) => {
  await mockShipmentSession(page)
  let shipment = { ...original }
  let writes = 0
  await page.route('**/__reference3030/api/platform/trade/shipments**', async route => {
    if (route.request().method() === 'POST') {
      writes++
      shipment = { ...shipment, eta: '2026-09-26', status: 'arrived' }
      await route.fulfill({ json: { shipment } })
    } else await route.fulfill({ json: { shipments: [shipment], sync_status: 'ok' } })
  })
  await page.route(`**/__reference3030/api/platform/trade/deals/${dealId}`, route => route.fulfill({ json: { deal_id: dealId, title: '연결 검증 거래', counterparty_name: '연결 검증 거래처', status: 'shipment', documents: [], next_actions: [] } }))
  await page.goto('/erp/shipments')
  await page.getByRole('button', { name: '추적 정보 갱신', exact: true }).click()
  await expect(page.getByRole('button', { name: '추적 정보 갱신', exact: true })).toBeEnabled()
  expect(writes).toBe(1)
  const link = page.getByRole('link', { name: '거래 보기 →' })
  await expect(link).toHaveAttribute('href', `/erp/deals/${dealId}`)
  const origin = new URL(page.url()).origin
  await link.click()
  expect(new URL(page.url()).origin).toBe(origin)
  const detail = page.locator('[data-component="ReferenceDealDetail"]')
  await expect(detail).toHaveAttribute('data-deal-id', dealId)
  await expect(detail.getByRole('heading', { name: '연결 검증 거래', exact: true })).toBeVisible()
  await expect(detail.locator('article')).toContainText('2026-09-26')
  await expect(detail.locator('article')).toContainText('도착')
  await page.reload()
  await expect(detail.locator('article')).toContainText('2026-09-26')
  // A failed refresh must preserve the last known server value.
  await page.route(`**/trade/shipments/${shipmentId}/refresh-tracking`, route => route.fulfill({ status: 403, json: { code: 'ENTITLEMENT_ROLE_FORBIDDEN' } }))
  await detail.getByRole('button', { name: '추적 정보 갱신', exact: true }).click()
  await expect(detail.getByRole('status')).toContainText('현재 역할로는')
  await expect(detail.locator('article')).toContainText('2026-09-26')
})

test('read-only deal preserves confirmed ETA and hides mutation controls', async ({ page }) => {
  await mockShipmentSession(page, false)
  await page.route('**/trade/shipments**', route => route.fulfill({ json: { shipments: [{ ...original, eta: '2026-09-26', confirmed_eta: '2026-09-28', provider_eta: '2026-09-26' }] } }))
  await page.route(`**/trade/deals/${dealId}`, route => route.fulfill({ json: { deal_id: dealId, title: '연결 검증 거래', status: 'shipment', documents: [] } }))
  await page.goto(`/erp/deals/${dealId}`)
  const detail = page.locator('[data-component="ReferenceDealDetail"]')
  await expect(detail.locator('article')).toContainText('2026-09-28')
  await expect(detail.locator('article')).toContainText('선사 도착 예정 2026-09-26')
  await expect(detail.getByRole('button', { name: '추적 정보 갱신', exact: true })).toHaveCount(0)
})

test('operational widths and typography follow the host tokens on desktop and mobile', async ({ page }) => {
  for (const route of ['sales', 'shipments', 'reports', 'settlement', 'monitor']) {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto(`/erp/${route}`)
    const content = page.locator('.reference-content-width').first()
    await expect(content).toBeVisible()
    const widths = await content.evaluate(e => ({ width: e.clientWidth, parent: e.parentElement!.clientWidth }))
    expect(widths.width).toBe(widths.parent)
    if (route === 'monitor') {
      const body = page.locator('[data-ui="dashboard-body"]')
      await expect(body).toBeVisible()
      const bounds = await body.evaluate(e => ({ width: e.clientWidth, parent: e.parentElement!.clientWidth }))
      expect(bounds.width).toBe(bounds.parent)
      expect(bounds.width).toBeGreaterThan(1440)
    }
    if (route === 'sales' || route === 'settlement') {
      const table = page.locator('.reference-3030 table').first()
      await expect(table).toHaveAttribute('data-slot', 'table')
      const head = table.locator('th').first()
      await expect(head).toHaveAttribute('data-slot', 'table-head')
      await expect(head).toHaveCSS('font-size', '14px')
      await expect(head).toHaveCSS('padding-top', '12px')
      await expect(head).toHaveCSS('padding-bottom', '12px')
      await expect(table.locator('td').first()).toHaveCSS('font-size', '14px')
    }
    // Changing host tokens proves that imported snapshot tokens no longer win.
    await page.evaluate(() => document.documentElement.style.setProperty('--text-body-10', '15px'))
    await expect(page.locator('.reference-3030').first()).toHaveCSS('--text-body-10', '15px')
    await page.evaluate(() => document.documentElement.style.removeProperty('--text-body-10'))
    await page.setViewportSize({ width: 390, height: 844 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
    expect(await content.evaluate(e => e.clientWidth)).toBeLessThanOrEqual(390)
  }
})

test('one transaction contains multiple shipment rows with independent tracking actions', async ({ page }) => {
  await mockShipmentSession(page)
  let rows = [
    { ...original, bl_number: 'GROUP-BL-01', carrier: 'HMM', vessel: 'Ocean One' },
    { ...original, id: 'cccccccc-3333-4333-8333-333333333333', bl_number: 'GROUP-BL-02', container_number: 'TEST000002', pol: 'SGSIN', pod: 'KRPUS', vessel: 'Ocean Two', confirmed_eta: '2026-09-30', provider_eta: '2026-09-27' },
    { ...original, id: 'dddddddd-4444-4444-8444-444444444444', deal_id: null, deal_title: null, deal_counterparty: null, bl_number: 'UNASSIGNED-BL' },
  ]
  let refreshed = ''
  await page.route('**/trade/shipments**', async route => {
    if (route.request().method() === 'POST') {
      refreshed = route.request().url().split('/').at(-2)!
      rows = rows.map(row => row.id === refreshed ? { ...row, status: 'arrived' } : row)
      await route.fulfill({ json: { shipment: rows.find(row => row.id === refreshed) } })
    } else await route.fulfill({ json: { shipments: rows } })
  })
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto('/erp/shipments')
  const group = page.locator(`.reference-shipment-group[data-deal-id="${dealId}"]`)
  await expect(group).toHaveCount(1)
  await expect(group).toContainText('선적 2건')
  await expect(group.locator('tbody tr')).toHaveCount(2)
  await expect(group.locator('th')).toHaveText(['B/L · 컨테이너', '항로 · 선박', 'ETD / ETA', '서류·근거', '상태', '작업'])
  const second = group.locator('tbody tr').nth(1)
  await expect(second).toContainText('SGSIN → KRPUS')
  await expect(second).toContainText('Ocean Two')
  await expect(second).toContainText('확정 일정 기준')
  await second.getByRole('button', { name: '추적 정보 갱신', exact: true }).click()
  await expect(second).toHaveAttribute('data-refresh-state', 'ready')
  expect(refreshed).toBe(rows[1].id)
  await expect(second.locator('td').nth(4)).toContainText('도착')
  await expect(group.locator('tbody tr').first().locator('td').nth(4)).toContainText('출항')
  await expect(page.locator('[data-deal-id="__none__"] [data-ui="shipments-deal-link"]')).toHaveCount(0)
  await page.screenshot({ path: '/tmp/erp-shipment-grouped-table.png' })
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  const scroller = group.locator('[data-slot="table-container"]')
  expect(await scroller.evaluate(e => e.scrollWidth > e.clientWidth)).toBe(true)
})

test('tracking updates reach the existing deal shipment section and summary across tabs', async ({ page, context }) => {
  let shipment = { ...original }
  let writes = 0
  const detail = await context.newPage()
  await mockShipmentSession(page)
  await mockShipmentSession(detail)
  await context.route('**/trade/deals?**', route => route.fulfill({ json: {
    items: [{ deal_id: dealId, display_id: 'DL-260708-01', title: '정확한 거래', status: 'shipment', risks: [] }],
    meta: { page: 1, page_size: 100, page_count: 1, total: 1 },
  } }))
  await context.route('**/trade/shipments**', async route => {
    if (route.request().method() === 'POST') {
      writes++
      shipment = { ...shipment, eta: writes === 1 ? '2026-09-29' : '2026-09-30', status: 'loaded' }
      await route.fulfill({ json: { shipment } })
    } else await route.fulfill({ json: { shipments: [shipment], sync_status: 'ok' } })
  })
  await detail.goto('/erp/deals/DL-260708-01')
  await detail.getByRole('complementary', { name: '거래 현황' }).getByRole('link', { name: '선적 구간으로 이동', exact: true }).click()
  const section = detail.locator('#deal-fulfillment [data-reference-screen="deal-shipments"]')
  await expect(section.locator(`[data-shipment-id="${shipmentId}"]`)).toContainText('TEST-BL-01')
  await expect(section).not.toContainText('014W-01')
  await page.goto('/erp/shipments')
  await page.getByRole('button', { name: '추적 정보 갱신', exact: true }).click()
  // Keep the detail tab in the background: BroadcastChannel must invalidate it
  // without relying on navigation or a focus-triggered reload.
  await expect(section.locator('tbody tr')).toContainText('2026.09.29')
  await expect(section.locator('tbody tr')).toContainText('적재')
  await expect(detail.getByRole('complementary', { name: '거래 현황' })).toContainText('2026-09-29')
  await section.getByRole('button', { name: '추적 정보 갱신', exact: true }).click()
  await expect(page.locator(`[data-shipment-id="${shipmentId}"]`)).toContainText('2026.09.30')
  await expect(detail.getByRole('complementary', { name: '거래 현황' })).toContainText('2026-09-30')
  await detail.close()
})

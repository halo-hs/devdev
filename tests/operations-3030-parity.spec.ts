import { expect, test, type Page } from '@playwright/test'

test.describe.configure({ timeout: 90_000 })
test.use({ actionTimeout: 10_000 })

async function ready(page: Page, route: string, reference = false) {
  if (reference) await page.context().addCookies([{ name: 'ecoya_locale', value: 'ko', url: 'http://localhost:3030' }])
  await page.goto(`${reference ? 'http://localhost:3030' : ''}/erp/${route}`)
  if (route === 'monitor') {
    await expect(page.locator('[data-component="StatusLine"]')).toContainText('P0', {timeout: 30_000})
  } else {
    const component = {reports:'ReportsConnected', 'sales-performance':'SalesPerformanceConnected', settlement:'SettlementConnected', shipments:'ShipmentsConnected'}[route]
    await expect(page.locator(`[data-component="${component}"][data-state="ready"]`).first()).toBeVisible({timeout: 30_000})
  }
}

const text = async (page:Page, selector:string) => page.locator(selector).allTextContents()
const clean = (values:string[]) => values.map(s=>s.replace(/\d{4}\. \d{1,2}\. \d{1,2}\. (오전|오후) \d{1,2}:\d{2}:\d{2}/g,'조회 시각').replace(/\s+/g,' ').trim())

test('monitor preserves KPI count, risk grouping, placement and quantity/week filters', async ({page, context}) => {
  await page.setViewportSize({width:1600,height:1100})
  const source = await context.newPage()
  await source.setViewportSize({width:1600,height:1100})
  await ready(source,'monitor',true)
  await ready(page,'monitor')
  const metrics='[data-ui="metric-card"]'
  await expect(page.locator(metrics)).toHaveCount(2)
  expect(clean(await text(page,metrics))).toEqual(clean(await text(source,metrics)))
  const risk='[data-component="RiskCard"]'
  await expect(page.locator(`${risk} [data-ui="task-queue-list"]`)).toHaveCount(1)
  expect(clean(await text(page,`${risk} [data-ui="task-queue-list"]`))).toEqual(clean(await text(source,`${risk} [data-ui="task-queue-list"]`)))
  const regions=await page.evaluate(()=>{
    const rect=(selector:string)=>document.querySelector(selector)!.getBoundingClientRect().toJSON()
    return {metrics:[...document.querySelectorAll('[data-ui="metric-card"]')].map(e=>e.getBoundingClientRect().toJSON()),overview:rect('[data-component="MonitorDealsOpsPanels"]'),qty:rect('[data-component="MonitorDealsOpsPanels"] > :last-child'),status:rect('[data-component="StatusLine"]'),queue:rect('[data-component="MonitorOperationGrid"]'),cards:['BlockedCard','RiskCard','FlagFeedCard','PendingActionCard'].map(name=>rect('[data-component="'+name+'"]'))}
  })
  expect(Math.abs(regions.metrics[0].y-regions.metrics[1].y)).toBeLessThan(2)
  expect(Math.abs(regions.qty.width-regions.overview.width)).toBeLessThan(2)
  expect(regions.status.top).toBeGreaterThan(regions.overview.bottom)
  expect(regions.queue.top).toBeGreaterThan(regions.status.bottom)
  await expect(page.locator('.reference-monitor-aside')).toHaveCount(0)
  for (const card of regions.cards) expect(Math.abs(card.width-regions.queue.width)).toBeLessThan(2)
  for (let i=1;i<regions.cards.length;i++) expect(regions.cards[i].top).toBeGreaterThan(regions.cards[i-1].bottom)
  await expect(page.locator('[data-component="PageTitleBar"] [data-ui="monitor-filters"]')).toBeVisible()
  const blocked='[data-component="BlockedCard"]'
  await page.locator('[data-ui="monitor-filters"]').getByRole('button',{name:'10건',exact:true}).click()
  await source.locator('[data-ui="monitor-filters"]').getByRole('tab',{name:'10건',exact:true}).click()
  await expect(page.locator(`${blocked} [data-ui="task-queue-list"] > *`)).toHaveCount(10)
  await expect(source.locator(`${blocked} [data-ui="task-queue-list"] > *`)).toHaveCount(10)
  expect(clean(await text(page,`${blocked} [data-ui="task-queue-list"]`))).toEqual(clean(await text(source,`${blocked} [data-ui="task-queue-list"]`)))
  await page.getByRole('button',{name:'지난주',exact:true}).click()
  await source.getByRole('tab',{name:'지난주',exact:true}).click()
  await expect.poll(async()=>clean(await text(page,'[data-component="ThroughputDrilldown"]'))).toEqual(clean(await text(source,'[data-component="ThroughputDrilldown"]')))
  await source.close()
})

test('reports uses seven canonical metrics, real currency queries and the original close dialog',async({page,context})=>{
  await page.setViewportSize({width:1600,height:1100})
  const source=await context.newPage()
  await ready(source,'reports',true);await ready(page,'reports')
  await expect(page.locator('[data-ui="reports-kpi"]')).toHaveCount(7)
  await expect.poll(async()=>clean(await text(page,'[data-ui="reports-kpi"]'))).toEqual(clean(await text(source,'[data-ui="reports-kpi"]')))
  await page.locator('[data-ui="reports-controls"]').getByRole('combobox',{name:'통화',exact:true}).click()
  await page.getByRole('option',{name:'EUR',exact:true}).click()
  await source.getByRole('button',{name:'EUR',exact:true}).click()
  await expect.poll(async()=>clean(await text(page,'[data-ui="reports-kpi"]'))).toEqual(clean(await text(source,'[data-ui="reports-kpi"]')))
  await page.getByRole('button',{name:/^\d{4}-\d{2} 마감하기$/}).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  const dialog=page.getByRole('dialog')
  expect(await dialog.evaluate(el=>Boolean(el.closest('.reference-3030')))).toBe(true)
  await dialog.getByRole('button',{name:'취소',exact:true}).click()
  await expect(dialog).not.toBeVisible()
  await source.close()
})

test('sales preserves four KPI values and the ten-column counterparty table',async({page,context})=>{
  const source=await context.newPage()
  await ready(source,'sales-performance',true);await ready(page,'sales-performance')
  const kpis='[data-ui="salesperf-kpis"]'
  await expect(page.locator(`${kpis} > *`)).toHaveCount(4)
  expect(clean(await text(page,kpis))).toEqual(clean(await text(source,kpis)))
  expect(clean(await text(page,'[data-component="SalesPerformanceConnected"] thead'))).toEqual(clean(await text(source,'[data-component="SalesPerformanceConnected"] thead')))
  expect(await page.locator('[data-component="SalesPerformanceConnected"] th').count()).toBe(10)
  await source.close()
})

test('settlement preserves four decisions and real ledger filtering',async({page,context})=>{
  const source=await context.newPage()
  await ready(source,'settlement',true);await ready(page,'settlement')
  expect(clean(await text(page,'[data-component="SettlementDecisionCards"]'))).toEqual(clean(await text(source,'[data-component="SettlementDecisionCards"]')))
  await page.getByRole('combobox',{name:'통화',exact:true}).click()
  await page.getByRole('option',{name:'USD',exact:true}).click()
  await source.getByRole('combobox',{name:'통화',exact:true}).click()
  await source.getByRole('option',{name:'USD',exact:true}).click()
  // Both pages refetch asynchronously; sample both after selecting the currency.
  await expect.poll(async()=>{
    const [actual, expected] = await Promise.all([
      text(page,'[data-ui="settlement-ledger-row"]'),
      text(source,'[data-ui="settlement-ledger-row"]'),
    ])
    return actual.length > 0 && JSON.stringify(clean(actual)) === JSON.stringify(clean(expected))
  }).toBe(true)
  await source.close()
})

test('shipments preserves all groups and status/search filtering',async({page,context})=>{
  const source=await context.newPage()
  await ready(source,'shipments',true);await ready(page,'shipments')
  const ids='[data-ui="shipment-container-number"]'
  expect(clean(await text(page,ids))).toEqual(clean(await text(source,ids)))
  await page.getByRole('tab',{name:'도착 임박',exact:true}).click()
  await expect(page.getByRole('tab',{name:'도착 임박',exact:true})).toHaveAttribute('aria-selected','true')
  await source.getByRole('button',{name:'도착 임박',exact:true}).click()
  expect(clean(await text(page,ids))).toEqual(clean(await text(source,ids)))
  const query=(await page.locator(ids).first().innerText()).trim()
  await page.getByRole('searchbox').fill(query)
  await source.getByRole('searchbox').fill(query)
  expect(clean(await text(page,ids))).toEqual(clean(await text(source,ids)))
  expect((await text(page,ids)).every(value=>value.includes(query))).toBe(true)
  await source.close()
})

for(const route of ['monitor','reports','sales-performance','settlement','shipments']) {
  test(`${route}: mobile body stays within the viewport`,async({page})=>{
    await page.setViewportSize({width:390,height:844})
    await ready(page,route)
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
    const root=page.locator('[data-reference-screen]')
    await expect(root).toBeVisible()
    expect(await root.evaluate(el=>[...el.querySelectorAll('*')].some(node=>node.scrollHeight>node.clientHeight && ['auto','scroll'].includes(getComputedStyle(node).overflowY)))).toBe(true)
  })
}

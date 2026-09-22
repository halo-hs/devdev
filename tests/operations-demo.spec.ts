import { test, expect } from '@playwright/test'

test.skip(!process.env.DEMO_BASE_URL, 'Run against the public demo build with DEMO_BASE_URL.')

test('public demo loads all operations without calling the live API', async ({page}) => {
  const requests:string[]=[]
  page.on('request',r=>{if(r.url().includes('/api/platform'))requests.push(r.url())})
  for (const route of ['shipments','monitor','settlement','reports','sales']) {
    await page.goto('/erp/'+route)
    await expect(page.getByRole('note').filter({hasText:'예시 데이터'})).toBeVisible()
    await expect(page.locator('.reference-3030 h1')).toBeVisible()
    await expect(page.locator('.reference-3030')).not.toContainText('불러오지 못했습니다')
  }
  expect(requests).toEqual([])
})

test('demo shipment refresh persists and synchronizes with the existing deal workspace',async({page,context})=>{
  await page.goto('/erp/shipments')
  await page.evaluate(()=>localStorage.removeItem('ecoya:public-demo:shipment-overrides:v1'))
  await page.reload()
  const group=page.locator('.reference-shipment-group').first()
  await expect(group.locator('tbody tr')).toHaveCount(2)
  const link=group.getByRole('link',{name:'거래 보기 →'})
  await expect(link).toHaveAttribute('href',/\/erp\/deals\/DL-260708-01/)
  const detail=await context.newPage()
  await detail.goto('/erp/deals/DL-260708-01')
  const section=detail.locator('#deal-fulfillment [data-reference-screen="deal-shipments"]')
  await detail.getByRole('complementary',{name:'거래 현황'}).getByRole('link',{name:'선적 구간으로 이동',exact:true}).click()
  await expect(section.locator('tbody tr')).toHaveCount(2)
  await group.getByRole('button',{name:'추적 정보 갱신',exact:true}).first().click()
  await expect(group.locator('tbody tr').first()).toContainText('적재')
  await expect(section.locator('tbody tr').first()).toContainText('적재')
  await page.reload()
  await expect(page.locator('.reference-shipment-group').first().locator('tbody tr').first()).toContainText('적재')
  await detail.close()
})

import {test,expect} from '@playwright/test'
import {counterpartyDisplayState} from '../trade-os/operations/salesperf/counterpartyDisplayState'
import type {CounterpartyStatusItem} from '../trade-os/operations/lib/api/reports'
const schedule='8e8d6d50-4ef5-5e8f-9bd9-5c4b7b7869df'
const overpayment=`demo-overpayment-${schedule}`
async function openException(page:import('@playwright/test').Page) {
 await page.goto('/erp/settlement')
 const button=page.locator(`button[aria-controls="settlement-exceptions-panel-${schedule}"]`)
 await button.click()
 return page.locator('[data-ui="settlement-exceptions"]')
}
test('status never presents unknown write-off evidence as settled',()=>{
 const base={overdue:'0',outstanding:'0',total_due:'100'} as CounterpartyStatusItem
 expect(counterpartyDisplayState(base).label).toBe('확인 필요')
 expect(counterpartyDisplayState({...base,written_off_total:'0'}).label).toBe('정산 완료')
 expect(counterpartyDisplayState({...base,written_off_total:'25'}).label).toBe('상각 처리')
 expect(counterpartyDisplayState({...base,outstanding:'20'}).label).toBe('미정산')
 expect(counterpartyDisplayState({...base,overdue:'10',outstanding:'20'}).label).toBe('연체')
})
test('390px dialogs and tables stay within page width',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 await page.goto('/erp/settlement')
 await page.locator('[data-ui="settlement-manual-schedule"]').click()
 const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible()
 const box=await dialog.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(15);expect(box!.x+box!.width).toBeLessThanOrEqual(375)
 await dialog.getByRole('button',{name:'취소',exact:true}).click()
 const frame=page.locator('#settlement-ledger table').first().locator('..')
 expect(await frame.evaluate(e=>e.scrollWidth>e.clientWidth)).toBe(true)
 await frame.evaluate(e=>e.scrollLeft=e.scrollWidth)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})
test('allocation validates amount and persists history plus remaining balance',async({page})=>{
 const panel=await openException(page)
 const allocation=panel.getByRole('region',{name:'다른 일정에 나눠 넣기'})
 const select=allocation.getByLabel('배정 대상 일정')
 await expect(select).toBeVisible()
 const value=await select.locator('option').nth(1).getAttribute('value');await select.selectOption(value!)
 await allocation.getByLabel('나눠 넣을 금액',{exact:true}).fill('1001')
 await allocation.getByLabel('배정 사유').fill('다음 일정으로 배정')
 await allocation.getByLabel('배정 근거').fill('확인서 EX-33')
 await allocation.getByRole('button',{name:'나눠 넣기',exact:true}).click()
 await expect(allocation.getByRole('alert')).toContainText('초과할 수 없습니다')
 await allocation.getByLabel('나눠 넣을 금액',{exact:true}).fill('100')
 await allocation.getByRole('button',{name:'나눠 넣기',exact:true}).click()
 await expect(panel).toContainText('EUR 900.00')
 await page.reload();await page.locator(`button[aria-controls="settlement-exceptions-panel-${schedule}"]`).click()
 await expect(page.getByRole('region',{name:'다른 일정에 나눠 넣기'})).toContainText('확인서 EX-33')
})
test('unknown refund survives reload and prevents duplicate submission',async({page})=>{
 await page.goto('/erp/settlement')
 await page.evaluate(({id})=>localStorage.setItem(`ecoya:settlement:pending-refund:v1:${id}`,JSON.stringify({body:{amount:'10',currency:'EUR',evidence:'bank-proof',reason:'return'},previousIds:[]})),{id:overpayment})
 const panel=await openException(page)
 await expect(panel.getByRole('status')).toContainText('이전 환불 기록 결과를 확인 중')
 await expect(panel.getByRole('button',{name:'환불 기록',exact:true})).toBeDisabled()
 await panel.getByRole('button',{name:'결과 다시 확인',exact:true}).click()
 await expect(panel.getByRole('button',{name:'환불 기록',exact:true})).toBeDisabled()
})
test('reports and sales use the same readable copy and scrollable status column',async({page})=>{
 await page.goto('/erp/reports');await expect(page.getByRole('button',{name:'다시 조회',exact:true})).toBeVisible()
 await expect(page.getByText(/받을 돈 적용액/).first()).toBeVisible()
 await expect(page.getByText(/거래 전체 손익은 마지막 받을 돈 만기일/)).toBeVisible()
 await page.setViewportSize({width:390,height:844});await page.goto('/erp/sales')
 await expect(page.locator('[data-ui="counterparty-status-evidence"]').first()).toBeVisible()
 const frame=page.locator('[data-ui="salesperf-status-scroll"]');expect(await frame.evaluate(e=>e.scrollWidth>e.clientWidth)).toBe(true)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
})

import { expect, test } from '@playwright/test'

async function open(page: import('@playwright/test').Page, state = 'ready') {
  await page.goto(`/erp/deals?salesState=${state}`)
  await page.getByRole('button', { name: '영업 파이프라인', exact: true }).click()
  return page.getByRole('region', { name: '연락처·파이프라인', exact: true })
}

for (const state of ['list-loading', 'detail-loading']) {
  test(`${state} shows skeleton without empty/error content`, async ({page}) => {
    const region = await open(page, state)
    await expect(region.getByRole('status')).toBeVisible()
    await expect(region.getByText('검색 결과가 없습니다.', {exact: true})).toHaveCount(0)
    await expect(region.getByRole('heading', {name:'관련 Deal', exact:true})).toHaveCount(0)
  })
}
for (const state of ['list-error', 'detail-error']) {
  test(`${state} retries into ready without switching contact`, async ({page}) => {
    const region = await open(page, state)
    await expect(region.getByText(/불러오지 못했습니다/)).toBeVisible()
    await expect(region.getByRole('heading', {name:'관련 Deal', exact:true})).toHaveCount(0)
    await region.getByRole('button', {name:'다시 시도',exact:true}).click()
    await expect(region.getByRole('heading', {name:'Anna Keller',exact:true})).toBeVisible()
    await expect(region.getByRole('heading', {name:'관련 Deal',exact:true})).toBeVisible()
  })
}
for (const [state,message] of [['forbidden','이 연락처의 파이프라인을 볼 권한이 없습니다.'],['not-found','연락처가 삭제되었거나 접근할 수 없습니다.']]) {
  test(`${state} hides detail and offers no retry`, async ({page}) => {
    const region = await open(page,state)
    await expect(region.getByText(message,{exact:true})).toBeVisible()
    await expect(region.getByRole('button',{name:'다시 시도',exact:true})).toHaveCount(0)
    await expect(region.getByRole('button',{name:'연락처 수정',exact:true})).toHaveCount(0)
    await expect(region.getByRole('heading',{name:'관련 Deal',exact:true})).toHaveCount(0)
    await region.getByRole('button').filter({hasText:'Kenji Sato'}).click()
    await expect(region.getByRole('heading',{name:'Kenji Sato',exact:true})).toBeVisible()
    await expect(region.getByText('활동 이력이 없습니다.',{exact:true})).toBeVisible()
  })
}
test('archived is readable but not editable', async ({page}) => {
  const region = await open(page,'archived')
  await expect(region.getByText('보관된 연락처입니다.',{exact:true})).toBeVisible()
  await expect(region.getByRole('heading',{name:'관련 Deal',exact:true})).toBeVisible()
  await expect(region.getByRole('button',{name:'연락처 수정',exact:true})).toHaveCount(0)
})
test('read-only hides create and edit; empty search clears stale detail', async ({page}) => {
  const region = await open(page,'readonly')
  await expect(region.getByRole('button',{name:'연락처 추가',exact:true})).toHaveCount(0)
  await expect(region.getByRole('button',{name:'연락처 수정',exact:true})).toHaveCount(0)
  await region.getByPlaceholder('이름 또는 회사 검색').fill('없는 연락처')
  await expect(region.getByText('검색 결과가 없습니다.',{exact:true})).toBeVisible()
  await expect(region.getByRole('heading',{name:'Anna Keller',exact:true})).toHaveCount(0)
  await region.getByPlaceholder('이름 또는 회사 검색').fill('Kenji')
  await expect(region.getByRole('heading',{name:'Kenji Sato',exact:true})).toBeVisible()
})
test('empty list allows creation and selects the new contact', async ({page}) => {
  const region = await open(page,'list-empty')
  await expect(region.getByText(/연락처가 없습니다/)).toBeVisible()
  await expect(region.getByRole('heading',{name:'관련 Deal',exact:true})).toHaveCount(0)
  await region.getByRole('button',{name:'연락처 추가',exact:true}).click()
  const dialog=page.getByRole('dialog')
  await dialog.getByLabel('이름',{exact:true}).fill('새 담당자')
  await dialog.getByRole('button',{name:'저장',exact:true}).click()
  await expect(region.getByRole('heading',{name:'새 담당자',exact:true})).toBeVisible()
})
test('mobile error and retry fit the viewport', async ({page}) => {
  await page.setViewportSize({width:390,height:844})
  const region=await open(page,'detail-error')
  await region.getByRole('button',{name:'다시 시도',exact:true}).click()
  await expect(region.getByRole('heading',{name:'Anna Keller',exact:true})).toBeVisible()
  const bounds=await region.boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(391)
})

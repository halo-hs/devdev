import { expect, test } from '@playwright/test'

for (const width of [1440, 390]) {
  test(`latest home retains question input and usable workspace at ${width}px`, async ({page}) => {
    await page.setViewportSize({width, height:1000})
    await page.addInitScript(() => localStorage.setItem('ecoya.today.layout-mode.v1','auto'))
    await page.goto('/erp/home')
    await expect(page.locator('[data-page-loading]')).toHaveCount(0)
    const question = page.getByRole('textbox',{name:'AI에게 질문'})
    await expect(question).toHaveJSProperty('tagName','TEXTAREA')
    await expect(page.getByRole('navigation',{name:'업무 바로가기'})).toBeVisible()
    const hero=page.locator('[aria-labelledby="home-question-title"]')
    await expect(hero).not.toHaveCSS('background-image','none')
    await expect(page.locator('[data-module-id]')).toHaveCount(6)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if(width>1000){
      await expect(page.locator('[data-module-grid]')).toHaveAttribute('data-layout-mode','split')
      const boardHeader=page.locator('[aria-labelledby="today-workspace-title"] > header')
      await expect(boardHeader).toHaveCSS('position','sticky')
      await page.locator('[data-home-scroll-viewport]').evaluate(el => el.scrollTop=el.scrollHeight)
      const headerBox=await boardHeader.boundingBox()
      const viewportBox=await page.locator('[data-home-scroll-viewport]').boundingBox()
      expect(Math.abs(headerBox!.y-viewportBox!.y)).toBeLessThan(2)
      await page.getByRole('button',{name:'모듈 편집',exact:true}).click()
      await expect(page.getByRole('menuitemradio')).toHaveCount(0)
      await page.keyboard.press('Escape')
    }
    await question.fill('거래 현황\n확인해줘')
    await page.getByRole('button',{name:'질문하기',exact:true}).click()
    await expect(page).toHaveURL(/\/erp\/ai/)
  })
}

test("successful public login opens the SNAP workspace", async ({page}) => {
  await page.goto('/login?product=snap')
  await page.getByLabel('이메일',{exact:true}).fill('ecoya@ecoya.kr')
  await page.getByLabel('비밀번호',{exact:true}).fill('ecoya')
  await page.getByRole('button',{name:'로그인',exact:true}).click()
  await page.getByRole('button',{name:'SNAP 열기',exact:true}).click()
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading',{name:'ECOYA Demo Co. 대시보드',exact:true})).toBeVisible()
})

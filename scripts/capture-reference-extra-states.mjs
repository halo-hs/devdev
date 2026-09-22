import {chromium} from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'
const root=path.resolve('public/html/erp'),plan=JSON.parse(await fs.readFile('public/html/erp/captures/references/plan.json','utf8'))
const css=(await fs.readFile(path.join(root,'home.html'),'utf8')).match(/<link\b[^>]*rel="stylesheet"[^>]*>/g).join('')
const b=await chromium.launch({channel:'chrome'});const p=await b.newPage({viewport:{width:1440,height:1000}})
try{for(const e of plan.entries.filter(e=>e.needsLive)){
 const route=e.id.startsWith('document-upload')?'/erp/documents/upload':e.id.startsWith('deals')?'/erp/deals':e.id.startsWith('monitoring')?'/erp/monitoring':'/erp/settlement'
 await p.goto('https://devdev-e6t.pages.dev'+route);await p.waitForTimeout(700)
 if(e.id==='document-upload-delete-confirm'){await p.getByRole('button',{name:'인보이스_2607_003.pdf 메뉴',exact:true}).click();await p.getByRole('menuitem',{name:'삭제',exact:true}).click();await p.getByRole('alertdialog').waitFor()}
 else if(e.id==='deals-delete-confirm'){await p.getByRole('button',{name:'DL-260629-03 거래 메뉴',exact:true}).click();await p.getByRole('menuitem',{name:'삭제',exact:true}).click();await p.getByRole('alertdialog').waitFor()}
 else if(e.id.startsWith('monitoring')){const titles={account:'수취 계좌 변경 감지',missing:'ETA 2일 전 B/L 누락',late:'거래처 결제 지연 추세'};await p.getByRole('row').filter({hasText:titles[e.id.split('-').at(-1)]}).click();await p.getByRole('dialog').waitFor()}
 else {await p.getByRole('button',{name:'입금 기록',exact:true}).first().click();await p.getByRole('button',{name:'초과금·조정·분쟁 처리',exact:true}).click();await p.getByRole('combobox',{name:'예외 유형',exact:true}).click();await p.getByRole('option').first().waitFor();e.title='정산 · 예외 유형 선택'}
 await p.evaluate(()=>document.fonts.ready)
 const body=await p.evaluate(()=>{const n=document.body.cloneNode(true);for(const el of n.querySelectorAll('script,iframe,object,embed'))el.remove();for(const el of n.querySelectorAll('*')){for(const a of [...el.attributes])if(/^on/.test(a.name))el.removeAttribute(a.name);if(el.matches('button'))el.setAttribute('type','button');if(el.matches('form'))el.removeAttribute('action');if(el.matches('a[href^="/"]'))el.href='https://devdev-e6t.pages.dev'+el.getAttribute('href');}return n.outerHTML})
 await fs.writeFile(path.join(root,e.html),`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="script-src 'none'; object-src 'none'"><title>${e.title}</title>${css}<style>*,*::before,*::after{animation:none!important;transition:none!important}</style></head>${body.replaceAll('src="/assets/','src="../../assets/')}</html>`)
 e.needsLive=false;console.log('Captured live',e.id)
}}finally{await b.close()}
await fs.writeFile('public/html/erp/captures/references/plan.json',JSON.stringify(plan,null,2))

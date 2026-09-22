import {chromium} from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'
const root=path.resolve('public/html/erp/captures');await fs.mkdir(root,{recursive:true})
const b=await chromium.launch({channel:'chrome'});const p=await b.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce'});const entries=[]
async function go(route){await p.goto('http://127.0.0.1:5194'+route);await p.waitForTimeout(700);await p.evaluate(()=>document.fonts.ready)}
async function shot(id,nodeId,locator){
 await locator.waitFor();
 await locator.evaluate(n=>{n.style.height='auto';n.style.maxHeight='none';n.style.overflow='visible';for(const e of n.querySelectorAll('*'))if(/auto|scroll/.test(getComputedStyle(e).overflowY)){e.style.height='auto';e.style.maxHeight='none';e.style.overflow='visible'}})
 const width=Math.ceil((await locator.boundingBox()).width)
 const html=await locator.evaluate(n=>{for(const e of n.querySelectorAll('input')){e.setAttribute('value',e.value);e.toggleAttribute('checked',e.checked)}for(const e of n.querySelectorAll('textarea'))e.textContent=e.value;for(const e of n.querySelectorAll('option'))e.toggleAttribute('selected',e.selected);return n.outerHTML})
 const css=await p.evaluate(()=>[...document.styleSheets].map(s=>{try{return [...s.cssRules].map(r=>r.cssText).join('\n')}catch{return ''}}).join('\n'))
 const q=await b.newPage({viewport:{width:1440,height:1100}})
 await q.setContent('<html><head><base href="http://127.0.0.1:5194/"><style>'+css+'</style><style>body{height:auto!important;min-height:0!important;overflow:visible!important;margin:0!important}#capture{width:'+width+'px}#capture *{max-height:none!important}</style></head><body><div id="capture">'+html+'</div></body></html>')
 await q.evaluate(()=>document.fonts.ready)
 const file=path.join(root,id+'.png');await q.locator('#capture').screenshot({path:file,animations:'disabled'});await q.close();const bytes=await fs.readFile(file);entries.push({id,figmaNodeId:nodeId,file:'captures/'+id+'.png',width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)});console.log(entries.at(-1))
}
try{
 await go('/login');await shot('form-login','587:305',p.locator('form'))
 await go('/signup');await shot('form-signup','587:306',p.locator('form'))
 await go('/erp/documents/create');await p.getByRole('button',{name:/^QT\s*견적서/}).click();await p.getByRole('region',{name:'문서 폼 선택',exact:true}).getByRole('button',{name:'문서 만들기',exact:true}).click();await p.waitForTimeout(650);await shot('form-create','587:2',p.locator('aside').filter({has:p.getByRole('textbox',{name:'품목 1 품목명',exact:true})}))
 await go('/erp/documents/upload/'+encodeURIComponent('인보이스_2607_003.pdf')+'/review');await shot('form-review','587:127',p.getByRole('region',{name:'항목 점검',exact:true}))
 await go('/erp/deals/DL-260701-09');await shot('form-deal','587:307',p.getByRole('region',{name:'거래 상세 정보',exact:true}))
 await go('/erp/documents/upload/'+encodeURIComponent('인보이스_중복확인_0918.pdf')+'/review');await shot('form-duplicate','587:308',p.getByRole('button',{name:'중복 확인 필요',exact:true}).locator('..'))
}finally{await b.close()}
await fs.writeFile(path.join(root,'forms.json'),JSON.stringify(entries,null,2)+'\n')

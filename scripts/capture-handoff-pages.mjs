/** Render the published, script-free handoff pages into the same Figma capture slots. */
import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'
import { erpSourceProvenance } from './erp-source-provenance.mjs'
const sourceProvenance = await erpSourceProvenance()
const root=path.resolve('public/html/erp')
const htmlManifest=JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8'))
if(htmlManifest.sourceFingerprint!==sourceProvenance.sourceFingerprint || htmlManifest.sourceCommit!==sourceProvenance.sourceCommit)
 throw new Error('HTML source differs from the current source. Regenerate ERP HTML before captures.')
const units=JSON.parse(await fs.readFile('scripts/erp-designer-work.json','utf8'))
const hidden=new Set(JSON.parse(await fs.readFile('scripts/handoff-hidden-captures.json','utf8')).ids)
const out=path.join(root,'captures')
await fs.mkdir(out,{recursive:true})
const browser=await chromium.launch({channel:'chrome'})
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'})
const results=[]
try {
 for(const unit of units){
  if(hidden.has(unit.id))continue
  const fragment=unit.kind!=='representative'
  const id=fragment?'designer-'+unit.id:unit.id
  await page.setViewportSize({width:fragment?900:1440,height:1000})
  await page.goto('file://'+path.join(root,id+'.html'))
  await page.evaluate(()=>document.fonts.ready)
  await page.addStyleTag({content:`.static-handoff-nav,.designer-heading nav{display:none!important}body{height:auto!important;overflow:visible!important}#root{height:auto!important;overflow:visible!important}[data-slot=sidebar-wrapper]{height:auto!important;min-height:1000px!important}main[aria-busy]{height:auto!important;overflow:visible!important}.designer-page>main{padding:24px!important}.designer-parts{display:flex!important;flex-direction:column!important}.designer-part{width:100%!important}.designer-fragment{overflow:visible!important}.designer-fragment [role=dialog]{height:auto!important;max-height:none!important}.designer-fragment>:first-child{max-width:100%!important}.designer-heading h1{font-size:22px!important}main[data-auth-fragment]{margin:0 auto!important}`})
  await page.evaluate(()=>{for(const n of [...document.querySelectorAll('*')].reverse()){const css=getComputedStyle(n);if(n.clientHeight>80 && n.scrollHeight>n.clientHeight+8 && /auto|scroll/.test(css.overflowY)){n.style.setProperty('height','auto','important');n.style.setProperty('max-height','none','important');n.style.setProperty('overflow-y','visible','important');}}})
  const target=unit.id==='sidebar-full'?page.locator('.designer-sidebar-example'):page.locator('body')
  const file=path.join(out,unit.id+'.png')
  await target.screenshot({path:file,animations:'disabled',timeout:30000})
  const bytes=await fs.readFile(file)
  results.push({id:unit.id,html:id+'.html',title:unit.title,figmaNodeId:unit.figmaNodeId,width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),file:'captures/'+unit.id+'.png',bytes:bytes.length})
  console.log('Captured',unit.id,results.at(-1).width,results.at(-1).height)
 }
} finally {await browser.close()}
await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify({generatedAt:new Date().toISOString(),...sourceProvenance,pages:results},null,2)+'\n')

import {chromium} from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'
const root=path.resolve('public/html/erp'),out=path.join(root,'captures/references')
await fs.mkdir(out,{recursive:true})
const plan=JSON.parse(await fs.readFile('public/html/erp/captures/references/plan.json','utf8'))
const jobs=[...new Map(plan.entries.map(e=>[e.html,e])).values()]
const b=await chromium.launch({channel:'chrome'});let cursor=0,completed=0;const failures=[],images={}
const styles='.static-handoff-nav{display:none!important}*,*::before,*::after{animation:none!important;transition:none!important}'
try{await Promise.all(Array.from({length:4},async()=>{
 const p=await b.newPage({viewport:{width:1920,height:1000},reducedMotion:'reduce'})
 while(cursor<jobs.length){const e=jobs[cursor++];try{
  await p.setViewportSize({width:1920,height:e.retired?600:1000});await p.goto('file://'+path.join(root,e.html));await p.evaluate(()=>document.fonts.ready);await p.addStyleTag({content:styles})
  const popup=await p.locator('[role=dialog],[role=alertdialog],[role=menu],[role=listbox],[data-radix-popper-content-wrapper]').evaluateAll(ns=>ns.some(n=>n.getAttribute('data-state')!=='closed'&&n.getBoundingClientRect().width>0))
  if(!popup){await p.addStyleTag({content:'html,body,#root{height:auto!important;overflow:visible!important}body{pointer-events:auto!important}[data-slot=sidebar-wrapper]{height:auto!important;min-height:1000px!important}main[aria-busy]{height:auto!important;overflow:visible!important}'});await p.evaluate(()=>{for(const n of [...document.querySelectorAll('*')].reverse()){const c=getComputedStyle(n);if(n.clientHeight>80&&n.scrollHeight>n.clientHeight+8&&/auto|scroll/.test(c.overflowY)){n.style.setProperty('height','auto','important');n.style.setProperty('max-height','none','important');n.style.setProperty('overflow-y','visible','important')}}})}
  const file=path.join(out,e.html.replace(/\.html$/,'.png'));await p.screenshot({path:file,fullPage:!popup,animations:'disabled',timeout:30000});const data=await fs.readFile(file);if(data.length>10*1024*1024)throw Error('Image exceeds 10MB');images[e.html]={file:path.relative(root,file),width:data.readUInt32BE(16),height:data.readUInt32BE(20),bytes:data.length};completed++;if(completed%25===0)console.log('Captured',completed,'/',jobs.length)
 }catch(err){failures.push({id:e.id,error:String(err)});console.log('FAILED',e.id,String(err).slice(0,160))}}
 await p.close()
}))}finally{await b.close()}
for(const e of plan.entries)Object.assign(e,images[e.html])
const result={...plan,generatedAt:new Date().toISOString(),sourceCommit:JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8')).sourceCommit,images:Object.keys(images).length,failures}
await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(result,null,2)+'\n');console.log('Done',completed,'failures',JSON.stringify(failures));if(failures.length)process.exitCode=1

import {chromium} from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
const root=path.resolve('public/html/erp'),out=path.join(root,'captures/modules')
await fs.mkdir(out,{recursive:true})
const current=[...new Map(JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8')).pages.map(e=>[e.id,e])).values()]
const units=JSON.parse(await fs.readFile('scripts/handoff/erp-designer-work.json','utf8')),covered=new Set(units.flatMap(u=>u.sourceIds))
const candidates=current.filter(e=>!covered.has(e.id)&&!e.retired&&!e.id.startsWith('designer-'))
const b=await chromium.launch({channel:'chrome'});let cursor=0,done=0;const seen=new Map(),modules=[],failures=[]
try{await Promise.all(Array.from({length:4},async()=>{const p=await b.newPage({viewport:{width:1920,height:1200},reducedMotion:'reduce'});while(cursor<candidates.length){const e=candidates[cursor++];try{
 await p.goto('file://'+path.join(root,e.id+'.html'));await p.evaluate(()=>document.fonts.ready)
 await p.addStyleTag({content:'.static-handoff-nav{display:none!important}*,*::before,*::after{animation:none!important;transition:none!important}'})
 const nodes=p.locator('[role=dialog],[role=alertdialog],[role=menu],[role=listbox],[data-radix-popper-content-wrapper]')
 const matches=await nodes.evaluateAll(ns=>ns.map((n,i)=>({i,area:n.getBoundingClientRect().width*n.getBoundingClientRect().height,text:n.innerText,role:n.getAttribute('role'),visible:getComputedStyle(n).visibility!=='hidden'&&n.getAttribute('data-state')!=='closed'})).filter(n=>n.visible&&n.area>1000&&n.text?.trim()).sort((a,b)=>b.area-a.area))
 if(matches.length){const match=matches[0],key=crypto.createHash('sha256').update(match.text.replace(/\s+/g,' ').replace(/radix-[^ ]+/g,'').trim()).digest('hex');if(!seen.has(key)){seen.set(key,e.id);let target=nodes.nth(match.i);const narrowed=await target.evaluate(n=>{const r=n.getBoundingClientRect();if(r.width<innerWidth*.85||r.height<innerHeight*.85)return false;const child=[...n.children].filter(c=>c.getBoundingClientRect().width>100&&c.getBoundingClientRect().width<r.width-20&&c.getBoundingClientRect().height>40).sort((a,b)=>b.getBoundingClientRect().width*b.getBoundingClientRect().height-a.getBoundingClientRect().width*a.getBoundingClientRect().height)[0];if(!child)return false;child.setAttribute('data-module-capture','true');return true});if(narrowed)target=p.locator('[data-module-capture]');await target.evaluate(n=>{n.style.setProperty('max-height','none','important');n.style.setProperty('overflow','visible','important')});const file='captures/modules/'+e.id+'.png';await target.screenshot({path:path.join(root,file),animations:'disabled'});const data=await fs.readFile(path.join(root,file));modules.push({...e,html:e.id+'.html',file,width:data.readUInt32BE(16),height:data.readUInt32BE(20),text:match.text.slice(0,300),kind:match.role||'popover',key})}}
 }catch(err){failures.push({id:e.id,error:String(err)})}done++;if(done%50===0)console.log('Audited',done,'/',candidates.length,'modules',modules.length)}await p.close()}))}finally{await b.close()}
modules.sort((a,b)=>current.findIndex(x=>x.id===a.id)-current.findIndex(x=>x.id===b.id))
await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify({sourceCommit:JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8')).sourceCommit,generatedAt:new Date().toISOString(),candidates:candidates.length,modules,failures},null,2)+'\n');console.log('Done',modules.length,'failures',JSON.stringify(failures))

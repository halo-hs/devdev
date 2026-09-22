import fs from 'node:fs/promises'
import path from 'node:path'
import { renderDesignerFlow } from './erp-designer-flow-reference.mjs'
const root=path.resolve('public/html/erp')
const flows=JSON.parse(await fs.readFile('scripts/handoff/erp-designer-flows.json','utf8'))
const menus=JSON.parse(await fs.readFile('scripts/handoff/erp-designer-menus.json','utf8'))
const pages=JSON.parse(await fs.readFile(path.join(root,'assets/index-pages.json'),'utf8'))
const byId=new Map(pages.map(p=>[p.id,p]))
let guide=await fs.readFile(path.join(root,'designer-guide.html'),'utf8')
for(const flow of flows){
  const menu=menus.find(m=>m.id===flow.menuId)
  for(const target of flow.targets)await fs.access(path.join(root,target+'.html'))
  const file=path.join(root,`designer-menu-${flow.menuId}.html`)
  const html=await fs.readFile(file,'utf8')
  const old=html.match(/<section class="designer-flow"[^>]*>[\s\S]*?<\/section>/)?.[0]
  if(!old || !guide.includes(old))throw new Error('Reference section missing: '+flow.menuId)
  const current=renderDesignerFlow(flow,menu,byId)
  await fs.writeFile(file,html.replace(old,current))
  guide=guide.replace(old,current)
}
await fs.writeFile(path.join(root,'designer-guide.html'),guide)
console.log('Updated reference cards:',flows.length)

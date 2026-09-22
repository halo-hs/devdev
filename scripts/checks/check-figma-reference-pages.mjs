import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
const root=path.resolve('public/html/erp')
const m=JSON.parse(await fs.readFile(path.join(root,'captures/references/manifest.json'),'utf8'))
assert.equal(m.failures.length,0)
assert.equal(new Set(m.entries.map(e=>e.id)).size,m.entries.length)
const failures=[]
for(const e of m.entries){
 try{
  const html=await fs.readFile(path.join(root,e.html),'utf8')
  assert.match(html,/<html/i)
  const image=await fs.readFile(path.join(root,e.file))
  assert.equal(image.readUInt32BE(16),e.width)
  assert.equal(image.readUInt32BE(20),e.height)
  assert(image.length<10*1024*1024)
  assert(e.width>=1440 && e.height>=500)
  assert(m.pages.some(p=>p.id===e.pageId))
  for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
   const url=match[1].split(/[?#]/)[0]
   if(!url||/^(https?:|mailto:|tel:|data:|blob:|javascript:|\/)/.test(url))continue
   await fs.access(path.resolve(root,url))
  }
 }catch(err){failures.push({id:e.id,error:String(err)})}
}
const f=JSON.parse(await fs.readFile(path.join(root,'captures/references/figma.json'),'utf8'))
assert.equal(f.entries.length,m.entries.length)
assert.equal(new Set(f.entries.map(e=>e.frameId)).size,m.entries.length)
for(const e of f.entries){assert(e.frameId && e.imageNodeId && e.captionNodeId);assert(m.entries.some(x=>x.id===e.id))}
assert.equal(f.verification.missing.length,0)
assert.equal(f.verification.overlaps.length,0)
if(failures.length){console.error(JSON.stringify(failures,null,2));process.exit(1)}
console.log(JSON.stringify({pages:m.pages.length,frames:m.entries.length,images:m.images,previousScreenNotices:m.entries.filter(e=>e.retired).length,links:'valid',figma:'verified'}))

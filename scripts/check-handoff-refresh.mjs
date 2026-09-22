import fs from 'node:fs/promises'
import path from 'node:path'
const root=path.resolve('public/html/erp')
const manifest=JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8'))
const auth=JSON.parse(await fs.readFile('scripts/erp-public-auth-captures.json','utf8'))
const captures=JSON.parse(await fs.readFile(path.join(root,'captures/manifest.json'),'utf8'))
const failures=[]; let links=0
for(const p of [...manifest.pages,...auth]){
 const file=path.join(root,p.id+'.html')
 let html;try{html=await fs.readFile(file,'utf8')}catch{failures.push('Missing page '+p.id);continue}
 if (/<script\b|\bon(?:click|load|error|submit|change|input)=/i.test(html)) failures.push('Executable snapshot '+p.id)
 for(const m of html.matchAll(/(?:src|href)="([^"#]+)(?:#[^"]*)?"/g)){
  const url=m[1]; if(/^(https?:|mailto:|tel:|data:|blob:)/.test(url))continue
  if(url.startsWith('/')){failures.push(p.id+' absolute app path '+url);continue}
  const local=path.resolve(root,decodeURIComponent(url.split('?')[0]))
  try{await fs.access(local);links++}catch{failures.push(p.id+' missing '+url)}
 }
}
for(const p of captures.pages){
 const png=await fs.readFile(path.join(root,p.file))
 if(png.readUInt32BE(16)!==p.width||png.readUInt32BE(20)!==p.height||png.length<2000)failures.push('Invalid screenshot '+p.id)
 if(png.length>10*1024*1024)failures.push('Figma upload exceeds 10MB '+p.id)
 if(!p.figmaNodeId)failures.push('Missing Figma link '+p.id)
}
console.log(JSON.stringify({pages:manifest.pages.length,auth:auth.length,captures:captures.pages.length,localLinks:links,failures:[...new Set(failures)]},null,2))
if(failures.length)process.exitCode=1

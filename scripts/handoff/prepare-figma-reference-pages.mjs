import fs from 'node:fs/promises'
import path from 'node:path'
const root=path.resolve('public/html/erp')
await fs.mkdir(path.join(root,'captures/references'),{recursive:true})
const pages=JSON.parse(await fs.readFile('scripts/handoff/figma-reference-pages.json','utf8'))
const current=JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8')).pages
const auth=JSON.parse(await fs.readFile('scripts/handoff/erp-public-auth-captures.json','utf8'))
const byId=new Map(current.map(p=>[p.id,p]))
const groupPage=new Map(pages.slice(1).map(p=>[p.name.split(' · ').at(-1),p.id]))
groupPage.set('서비스 소개','669:3');groupPage.set('로그인·가입','669:2');groupPage.set('고객 전달','32:5')
pages.push({id:'669:2',name:'참고 · 19 · 로그인·가입',children:[]},{id:'669:3',name:'참고 · 20 · 서비스 소개',children:[]})
const oldById=new Map()
for(const p of pages)for(const n of p.children){n.sourceId=n.name.split(' · ').at(-1);oldById.set(n.sourceId,{...n,pageId:p.id})}
const css=(await fs.readFile(path.join(root,'home.html'),'utf8')).match(/<link\b[^>]*rel="stylesheet"[^>]*>/g).join('')
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')
const wrap=(title,body)=>`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="script-src 'none'; object-src 'none'">${css}<style>body{margin:0;background:#f5f7fa;color:#182c45}main.ref{padding:40px;min-height:1000px}main.ref>h1{font-size:28px;font-weight:700;margin-bottom:24px}.ref-panel{background:white;border:1px solid #dce4ed;border-radius:14px;padding:32px;margin:24px 0}.ref-panel [role=dialog],.ref-panel [role=alertdialog]{position:relative!important;inset:auto!important;transform:none!important;translate:none!important;height:auto!important;max-height:none!important;margin:auto!important}.ref-panel button{pointer-events:none}.ref a{color:#175ec0}</style><title>${esc(title)}</title></head><body><main class="ref"><h1>${esc(title)}</h1>${body}</main></body></html>`
const entries=[];const seen=new Set()
for(const p of pages){for(const n of [...p.children].sort((a,b)=>a.y-b.y||a.x-b.x)){
 let id=n.sourceId,html=id+'.html',title=byId.get(id)?.title||n.name,retired=false
 if(p.id==='0:1'){id='reference-index';html='reference-index.html';title='최신 화면·상태별 참고 색인'}
 else if(id.endsWith('-full-content'))html=id.replace(/-full-content$/,'')+'.html'
 else if(id.endsWith('-lower-fields'))html=id.replace(/-lower-fields$/,'')+'.html'
 try{await fs.access(path.join(root,html))}catch{
  const cache=path.join(root,'assets','designer-source-'+id+'.json')
  try{const f=JSON.parse(await fs.readFile(cache,'utf8'));html='reference-'+id+'.html';await fs.writeFile(path.join(root,html),wrap(title,`<div class="ref-panel">${f.html}</div><p>2026.09.18 배포 기준 · <a href="${f.source}">원본 화면 열기 →</a></p>`))}catch{
   if(id!=='reference-index')html='reference-'+id+'.html'
  }
 }
 entries.push({id,title,html,pageId:p.id,frameId:n.id,previousName:n.name,retired});seen.add(id)
}}
for(const p of [...byId.values(),...auth.map(p=>({...p,group:'로그인·가입'}))]){
 if(seen.has(p.id)||p.retired)continue
 const pageId=groupPage.get(p.group);if(!pageId)throw new Error('Unmapped group '+p.group)
 entries.push({id:p.id,title:p.title,html:p.id+'.html',pageId,frameId:null,retired:false});seen.add(p.id)
}
for(const file of(await fs.readdir(root)).filter(f=>/^sidebar.*\.html$/.test(f))){const id=file.replace('.html','');if(!seen.has(id)){entries.push({id,title:'공통 메뉴 · '+id,html:file,pageId:'32:19',frameId:null,retired:false});seen.add(id)}}
const pageRows=pages.filter(p=>p.id!=='0:1').map(p=>`<li style="padding:12px;border-bottom:1px solid #e3e8ef"><a href="https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=${p.id.replace(':','-')}">${esc(p.name)}</a><span style="float:right">${entries.filter(e=>e.pageId===p.id).length}개 캡처</span></li>`).join('')
await fs.writeFile(path.join(root,'reference-index.html'),wrap('최신 화면·상태별 참고 색인',`<p>2026.09.18 전체 소스 배포 기준 · 2026.09.19 참고 페이지 갱신</p><div class="ref-panel"><p>각 참고 페이지에 기본·상세·상태 화면을 배치했습니다. 캡처 아래 링크에서 원본 HTML을 열 수 있습니다.</p><p>이전 화면은 변경 안내로 표시하며, 과거 디자인 레이어는 해당 프레임 안에 숨김 보존합니다.</p><p><a href="index.html">전체 HTML 화면 목록 →</a>　<a href="designer-guide.html">디자이너 작업 안내 →</a></p></div><ul style="display:grid;grid-template-columns:1fr 1fr;gap:12px 32px">${pageRows}</ul>`))
for(const e of entries){try{const html=await fs.readFile(path.join(root,e.html),'utf8');e.retired=/data-retired/.test(html)}catch{e.needsLive=true}}
await fs.writeFile('public/html/erp/captures/references/plan.json',JSON.stringify({pages:pages.map(({id,name})=>({id,name})),entries},null,2))
console.log(JSON.stringify({entries:entries.length,missing:entries.filter(e=>e.needsLive).map(e=>e.id),retired:entries.filter(e=>e.retired).length}))

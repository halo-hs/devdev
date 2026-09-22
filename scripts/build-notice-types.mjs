import fs from 'node:fs/promises'
import path from 'node:path'
const root = path.resolve('public/html/erp')
const manifest = JSON.parse(await fs.readFile(path.join(root, 'captures/notices/manifest.json'), 'utf8'))
const escape = s => String(s).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]))
const groups = [...new Set(manifest.entries.map(e => e.group))]
const css = (await fs.readFile(path.join(root, 'home.html'), 'utf8')).match(/href="(assets\/style-[^"]+\.css)"/)?.[1]
const notes = {
  '영역 안 안내': '해당 화면 안에 유지되는 안내. 본문·설명·액션·추가 정보의 조합으로 구분합니다.',
  '접히는 안내': '처음에는 한 줄만 표시하고, 필요한 설명을 펼쳐 봅니다.',
  '입력칸 안내': '관련 입력칸 바로 아래에 표시합니다.',
  '검토 항목 목록': '건수 버튼을 누르면 확인할 항목이 열립니다.',
  '처리 상태': '자동 저장·분석의 진행 상태와 결과를 보여줍니다.',
  '확인 팝업': '실행하기 전에 취소하거나 진행할 수 있습니다.',
  '토스트': '화면 위에 잠깐 표시됩니다. 오류의 유지 시간은 현재 구현별로 다릅니다.',
}
const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Notice · 안내 유형 | ECOYA Trade OS</title>${css ? `<link rel="stylesheet" href="${css}">` : ''}<style>
body{margin:0;background:#f6f7f9;color:#202936;font-family:Arial,'Noto Sans KR',sans-serif}.notice-shell{max-width:1280px;margin:auto;padding:48px 32px 80px}.notice-shell h1{font-size:30px;font-weight:700;line-height:1.4;margin:16px 0 8px}.notice-shell p{line-height:1.6}.notice-shell a{color:#245590;text-decoration:none}.notice-shell a:hover{text-decoration:underline}.notice-nav{display:flex;flex-wrap:wrap;gap:8px;margin:28px 0 40px}.notice-nav a{padding:8px 14px;border:1px solid #dce2ea;border-radius:99px;background:white;font-size:14px}.notice-section{scroll-margin-top:24px;margin:40px 0}.notice-section h2{font-size:22px;font-weight:650;margin:0 0 6px}.notice-section>p{color:#657082;font-size:14px;margin:0 0 20px}.notice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.notice-card{background:white;border:1px solid #dde3ec;border-radius:12px;padding:24px;min-width:0}.notice-label{display:flex;gap:16px;justify-content:space-between;align-items:baseline}.notice-label h3{font-size:16px;font-weight:600;margin:0}.notice-label a{font-size:13px;white-space:nowrap}.notice-shape{font-size:13px;color:#657082;margin:8px 0 20px}.notice-example{min-height:100px;display:flex;align-items:center;justify-content:center;padding:12px 0}.notice-example img{max-width:100%;height:auto;display:block}.notice-origin{font-size:12px;color:#657082;margin:16px 0 0}.notice-differences{padding:24px;border-top:1px solid #dce2ea;margin-top:48px}.notice-differences h2{font-size:18px;font-weight:600}.notice-differences li{font-size:14px;line-height:1.8;margin-top:6px;list-style:disc}.notice-differences ul{padding-left:20px} @media(max-width:720px){.notice-shell{padding:24px 16px}.notice-grid{grid-template-columns:1fr}.notice-label{flex-wrap:wrap}.notice-card{padding:20px}}
</style></head><body><main class="notice-shell"><a href="index.html">← 화면·참고 자료</a> · <a href="https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=823-2">Figma에서 보기 ↗</a><h1>Notice · 안내 유형</h1><p>현재 구현된 7개 유형 · ${manifest.entries.length}개 실제 예시</p><nav class="notice-nav" aria-label="안내 유형">${groups.map((g,i)=>`<a href="#notice-${i}">${escape(g)}</a>`).join('')}</nav>${groups.map((g,i)=>`<section class="notice-section" id="notice-${i}"><h2>${escape(g)}</h2><p>${notes[g]}</p><div class="notice-grid">${manifest.entries.filter(e=>e.group===g).map(e=>`<article class="notice-card" id="${e.id}"><div class="notice-label"><h3>${escape(e.title)}</h3><a href="${escape(e.source)}">사용 화면 ↗</a></div><p class="notice-shape">${escape(e.shape)}</p><div class="notice-example"><img src="${e.file}" width="${e.width}" height="${e.height}" alt="${escape(e.text)}" loading="lazy"></div>${e.origin==='source-component-preview'?'<p class="notice-origin">실제 컴포넌트 · 예시 메시지</p>':''}</article>`).join('')}</div></section>`).join('')}<aside class="notice-differences"><h2>현재 서로 다른 부분</h2><ul><li>토스트: 업무 공통은 상단 72px·3.5초, 운영 화면은 상단 16px·5초. 운영 오류는 직접 닫습니다.</li><li>안내 박스: 설명 크기가 11~14px로 혼재합니다.</li><li>입력칸 오류: 업무 폼은 아이콘 포함, 인증 폼은 문구만 표시합니다.</li><li>검토 목록: 문서는 버튼 오른쪽 끝, 거래는 왼쪽 시작에 맞춰 열립니다.</li><li>운영 토스트: 액션과 닫기를 함께 넣으면 오른쪽 칸을 넘칩니다.</li></ul></aside></main></body></html>`
await fs.writeFile(path.join(root, 'notice-types.html'), html)
for (const name of ['index.html', 'reference-all.html']) {
  const file = path.join(root, name)
  let source = await fs.readFile(file, 'utf8')
  if (!source.includes('href="notice-types.html"')) {
    source = source.replace('<a target="_top" href="module-gallery.html">', '<a target="_top" href="notice-types.html">Notice · 안내 유형</a><a target="_top" href="module-gallery.html">')
    await fs.writeFile(file, source)
  }
}
console.log('Built notice-types.html:', groups.length, 'groups,', manifest.entries.length, 'examples')

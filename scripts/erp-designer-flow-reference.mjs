const escape = (value = '') => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')

export function renderDesignerFlow(flow, menu, byId) {
  if (!flow) return ''
  const note = flow.referenceDate
    ? `기준: 2026.09.18 배포 · 참고 설명 갱신: ${flow.referenceDate.replaceAll('-', '.')} · 참조: ${flow.refs}`
    : `실제 캡처와 설계 요구사항을 구분합니다. 참조: ${flow.refs}`
  return `<section class="designer-flow" aria-label="${escape(menu.title)} 주요 CTA와 상태"><div><h3>주요 CTA 흐름</h3><ol>${flow.steps.map(s=>`<li>${escape(s)}</li>`).join('')}</ol><p>${flow.targets.map(id=>`<a href="${id}.html">${escape(byId.get(id)?.title || id)}</a>`).join(' · ')}</p></div><div><h3>상태별 값</h3><div class="designer-state-values">${flow.states.map(s=>`<span>${escape(s)}</span>`).join('')}</div><h3 style="margin-top:20px">추가 확인·설계</h3><ul>${flow.needsDesign.map(s=>`<li>${escape(s)}</li>`).join('')}</ul></div><p class="designer-flow-note">${escape(note)}</p></section>`
}

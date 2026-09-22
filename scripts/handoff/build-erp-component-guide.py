"""Build one designer brief and its 562-screen evidence appendix, without client JavaScript."""
from pathlib import Path
import json,html
r=Path(__file__).resolve().parents[2]
d=json.loads((r/'scripts/handoff/erp-designer-component-boundaries.json').read_text());inventory=json.loads((r/'docs/screens/ui-component-inventory-562.json').read_text());e=html.escape
source=lambda id:f'https://devdev-e6t.pages.dev/html/erp/{id}.html'
figma=d.get('figmaUrl','https://www.figma.com/design/utViiVayT0rWuYSB5bpZ31?node-id=460-2')
css='''*{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#17314c;font:15px/1.7 system-ui,-apple-system,sans-serif}main{max-width:1400px;padding:32px;margin:auto}h1{font-size:28px}h2{margin-top:40px;font-size:22px}h3{font-size:17px}p{max-width:1050px}a{color:#155ab5;text-underline-offset:3px}nav{display:flex;gap:18px;flex-wrap:wrap}.note,article,details{padding:20px;background:white;border:1px solid #dce4ee;border-radius:10px;margin:16px 0}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.grid article{margin:0}.tag{display:inline-block;padding:3px 8px;border-radius:4px;background:#e9f0fa;margin:0 5px 8px 0;font-size:12px;font-weight:650}.table-wrap{overflow-x:auto;background:white;border:1px solid #dce4ee;border-radius:8px;padding:10px}table{width:100%;border-collapse:collapse;font-size:13px;min-width:800px}th,td{padding:12px;border-bottom:1px solid #e0e6ef;vertical-align:top;text-align:left}th{background:#eef3f8;white-space:nowrap}summary{cursor:pointer;font-weight:650}small{font-size:12px;color:#52657a}.muted{color:#52657a}li{margin:7px 0}.inventory{font-size:12px}a:focus-visible,summary:focus-visible{outline:2px solid #175cc0;outline-offset:3px}@media(max-width:700px){main{padding:16px}.grid{grid-template-columns:1fr}h1{font-size:23px}}'''
parts=[f'<nav><a href="designer-guide.html">전체 작업 안내</a><a href="{figma}" target="_top">Figma 작업 범위</a><a href="#tables">테이블 별도 작업</a><a href="#charts">그래프</a><a href="#inventory">562개 화면별 확인</a></nav><h1>{e(d["title"])}</h1><p>{e(d["scope"])}</p><div class="note"><strong>작업 기준</strong><p>{e(d["principle"])}</p><p>기존 디자인 파일의 분류·이름은 이번 판단 근거에서 제외했습니다. 현재 구현에 사용된 기반과 업무 조합만 구분합니다.</p></div>']
parts.append('<h2>1. 공통 컴포넌트 — 재사용</h2><div class="grid">')
for c in d['common']:parts.append(f'<article><h3>{e(c["name"])}</h3><p>{e(c["implemented"])}</p><p>{e(c["request"])}</p></article>')
parts.append('</div><h2>2. 업무 UI — 조합과 상태를 설계</h2><p>아래는 새 기본 컴포넌트 제작 목록이 아닙니다. 적용 화면에서 공통 요소를 어떻게 조합하고 상태·다음 행동을 보여줄지 정리하는 작업입니다.</p>')
for row in d['rows']:
 if row['id'] in ['line-items','worklist','navigation']:continue
 parts.append(f'<article id="{row["id"]}"><span class="tag">{e(row["priority"])}</span><span class="tag">{e(row["decision"])}</span><h3>{e(row["title"])}</h3><p><strong>적용:</strong> {e(" · ".join(row["groups"]))}</p><p><strong>재사용:</strong> {e(row["reuse"])}</p><p><strong>추가 설계:</strong> {e(row["design"])}</p><p><strong>상태:</strong> {e(row["states"])}</p><details><summary>구현 근거</summary><ul>'+''.join('<li>'+e(s)+'</li>' for s in row['evidence'])+'</ul></details></article>')
parts.append('<h2 id="tables">3. 테이블 — 별도 작업 항목</h2><p>Table 기반을 재사용하되 테이블 UI는 별도로 설계해주세요. 조회형·품목 편집형·문서 대조형을 같은 하나의 행으로 억지로 맞추지 않고 공통 규칙과 변형을 정합니다.</p><div class="table-wrap"><table><thead><tr><th>테이블 타입</th><th>적용 화면</th><th>설계할 부분</th></tr></thead><tbody>')
for name,where,task in [('조회형','거래·선적·정산·운영 감시·리포트','검색·필터·정렬·페이지 이동, 선택과 상세 이동, 행 메뉴, 숫자 정렬·긴 내용·빈 목록. 정산의 원장 연결은 클릭 결과와 목적지를 명확하게.'),('품목 편집형','문서 만들기·거래 상세','행 추가·개별/전체 삭제, 수량·단위·단가·합계, 필수값·셀 오류, 읽기 전용, 좁은 화면의 편집 방식.'),('문서 대조·검증형','문서 검토·거래 서류 검증','문서별 값 비교, 불일치·누락과 채택할 값, 원문 근거 열기, 수정/확정 상태와 조치 위치.')]:parts.append(f'<tr><td>{name}</td><td>{where}</td><td>{task}</td></tr>')
parts.append('</tbody></table></div><p>공통 기반: Table · Input · Select · Checkbox · Badge · Button · Pagination. 카드와 표의 간격, 가로 스크롤, 고정 열·헤더와 행 밀도도 함께 제안해주세요.</p>')
parts.append('<h2 id="charts">4. 그래프 — 기본 구현 재사용 + 업무별 표현 설계</h2><div class="table-wrap"><table><thead><tr><th>타입</th><th>확인 화면</th><th>현재 구현</th><th>설계할 부분</th></tr></thead><tbody>')
for c in d['charts']:parts.append('<tr>'+''.join('<td>'+e(c[k])+'</td>' for k in ['name','where','base','design'])+'</tr>')
parts.append('</tbody></table></div><p>공통 상태: 로딩 · 데이터 없음 · 실제 0 · 미집계/환산 불가 · 부분 실패 · 음수 · 선택 · 좁은 화면. 공통 규칙: 기간·통화·담당자 필터, 색/선/범례, 축 단위, 툴팁의 정확한 값, 키보드·터치와 상세표 연결. 현재 없는 상태는 추가 설계 요청이며 구현 완료를 뜻하지 않습니다.</p>')
parts.append('<h2>5. 현재 공통 기반을 직접 쓰지 않은 구현 — 정리 후보</h2><div class="grid">')
for c in d['confirmedCustom']:parts.append(f'<article><h3>{e(c["name"])}</h3><p>{e(c["evidence"])}</p><p>{e(c["action"])}</p></article>')
parts.append('</div><h2>작업 시 함께 확인해주세요</h2><ul>'+''.join('<li>'+e(s)+'</li>' for s in d['workingRules'])+'</ul>')
parts.append('<h2 id="inventory">562개 화면별 구현 확인</h2><p>기존 ERP HTML 파일 562개를 모두 구조 확인했습니다. 공통 요소 목록은 HTML의 data-slot과 구현 소스를 대조한 결과입니다. 아래의 “기타 태그”는 shadcn 미사용 확정이 아닙니다. 원문 문서, 정적 내보내기의 링크 변환, 숨김 파일 입력 등이 섞일 수 있어 확인 후보로만 표시합니다. 공통 셸도 포함되어 같은 컴포넌트가 여러 파일에 반복됩니다.</p>')
for group,summary in inventory['summary'].items():
 rows=[x for x in inventory['screens'] if x['group']==group]
 parts.append(f'<details><summary>{e(group)} · {len(rows)}개</summary><div class="table-wrap"><table class="inventory"><thead><tr><th>화면·상태</th><th>shadcn 기반 사용 확인</th><th>기존 공통</th><th>기타 태그 · 추가 확인 후보</th></tr></thead><tbody>')
 for row in rows:
  native=' · '.join(f'{k} {v}' for k,v in row['nativeReviewCandidates'].items()) or '없음'
  parts.append(f'<tr data-screen="{row["id"]}"><td><a href="{row["id"]}.html">{e(row["title"])}</a><br><small>{row["id"]}</small></td><td>{e(" · ".join(row["shadcnConfirmed"]) or "마커 미확인")}</td><td>{e(" · ".join(row["existingCommon"]) or "별도 표시 없음")}</td><td>{e(native)}</td></tr>')
 parts.append('</tbody></table></div></details>')
parts.append('<p class="muted">기준: ERP HTML 562개 및 커밋 769aa02의 구현 소스. 일부 참고 HTML은 과거 상태이므로 차이는 해당 항목에 표시했습니다. 구현의 디자인 시스템 적합성·모든 상호작용에 대한 접근성 검증 결과는 아닙니다.</p>')
body=''.join(parts).replace('562개',str(len(inventory['screens']))+'개').replace('769aa02','bde1327');out=r/'public/html/erp/designer-component-guide.html';out.write_text('<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="script-src \'none\'; object-src \'none\'"><title>'+e(d['title'])+'</title><style>'+css+'</style></head><body><main>'+body+'</main></body></html>\n')
md=['# '+d['title'],'',d['scope'],'',d['principle'],'','[HTML 작업 안내]('+source('designer-component-guide')+') · [Figma 작업 범위]('+figma+')','','## 재사용할 공통 컴포넌트','']
for c in d['common']:md+=['- **'+c['name']+'**: '+c['implemented']+'. '+c['request']]
md+=['','## 업무 UI 후보와 작업 범위','','| 우선순위 | 업무 UI | 재사용 | 추가 설계 |','|---|---|---|---|']
for row in d['rows']:
 if row['id']=='navigation':continue
 md+=['| '+' | '.join(row[k] for k in ['priority','title','reuse','design'])+' |']
md+=['','테이블은 별도 작업: 조회형 / 품목 편집형 / 문서 대조·검증형. 그래프는 기본 Chart 기반과 업무별 표현을 구분합니다.','','## 그래프 포함 범위','','| 타입 | 적용 | 구현 기반 | 추가 설계 |','|---|---|---|---|']
for c in d['charts']:md+=['| '+' | '.join(c[k] for k in ['name','where','base','design'])+' |']
md+=['','## 코드에서 공통 기반을 직접 쓰지 않은 사례','']
for c in d['confirmedCustom']:md+=['- **'+c['name']+'**: '+c['evidence']+'. '+c['action']]
md+=['','## 562개 근거 목록','','전체 화면별 사용 마커와 기타 태그 확인 후보는 `ui-component-inventory-562.json` 및 HTML 안내 하단에서 확인합니다. Sidebar는 기존 프로젝트 공통으로 별도 분류합니다. native 태그 검출만으로 shadcn 미사용을 단정하지 않습니다. 기본·상세·팝업·상태 파일을 합한 수이며 562개 독립 페이지 또는 새 컴포넌트가 아닙니다.','','## 디자이너에게 전달할 요청','']+['- '+s for s in d['workingRules']]
(r/'docs/screens/ui-component-work-scope.md').write_text(('\n'.join(md)+'\n').replace('562개',str(len(inventory['screens']))+'개'))
print('Built component guide with',len(inventory['screens']),'screen rows')

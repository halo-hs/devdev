import json,html,collections
from pathlib import Path
from html.parser import HTMLParser
r=Path(__file__).resolve().parents[2];m=json.loads((r/'public/html/erp/manifest.json').read_text())['pages'];pages=[p for p in m if p['group'] not in ['로그인·가입·무료체험','공통 UI · 사이드바','변경된 화면']]
slots={'button':'Button','input':'Input','textarea':'Textarea','select-trigger':'Select','checkbox':'Checkbox','table':'Table','card':'Card','badge':'Badge','tabs':'Tabs','dialog-content':'Dialog','alert-dialog-content':'AlertDialog','sheet-content':'Sheet','popover-content':'Popover','dropdown-menu-content':'DropdownMenu','tooltip-content':'Tooltip','progress':'Progress','chart':'Chart','skeleton':'Skeleton'}
class Parse(HTMLParser):
 def __init__(self):super().__init__();self.slots=collections.Counter();self.native=collections.Counter();self.shared=collections.Counter()
 def handle_starttag(self,tag,attrs):
  a=dict(attrs);slot=a.get('data-slot','')
  if slot=='sidebar':self.shared['Sidebar']=self.shared['Sidebar']+1
  if slot in slots:self.slots[slots[slot]]+=1
  if tag in ['input','textarea','select','table','button'] and slot not in slots:
   # Exported links/controls and embedded document content may be native intentionally.
   self.native[tag]+=1
  if a.get('role') in ['dialog','alertdialog'] and slot not in ['dialog-content','alert-dialog-content']:self.native['dialog']+=1
  if 'recharts-wrapper' in a.get('class',''):self.slots['Recharts']+=1
rows=[]
for p in pages:
 parser=Parse();parser.feed((r/'public/html/erp'/(p['id']+'.html')).read_text());rows.append({'id':p['id'],'title':p['title'],'group':p['group'],'shadcnConfirmed':dict(sorted(parser.slots.items())),'existingCommon':dict(sorted(parser.shared.items())),'nativeReviewCandidates':dict(sorted(parser.native.items()))})
summary={group:{'screenCount':sum(x['group']==group for x in rows),'shadcnConfirmed':sorted({k for x in rows if x['group']==group for k in x['shadcnConfirmed']}),'nativeReviewScreenCount':sum(x['group']==group and bool(x['nativeReviewCandidates']) for x in rows)} for group in dict.fromkeys(x['group'] for x in rows)}
report={'scope':{'snapshotFiles':len(rows),'includes':f'최신 ERP HTML {len(rows)}개: 기본·상세·팝업·액션·상태 파일. 독립 메뉴 수가 아님.','excludes':['별도 공통 인증 캡처','별도 사이드바 캡처 8개'],'method':'전체 HTML data-slot과 기본 태그 구조 스캔 + 대표 구현 소스 대조. 페이지 전체에 공통 셸이 포함되어 사용 수는 고유 업무 컴포넌트 수가 아님.','limitations':'data-slot 확인은 DS 기반 사용 증거이며 시각적 오버라이드·접근성 품질까지 검증하지 않음. 마커 없는 native 태그는 미사용 확정이 아니라 추가 확인 후보. 정적 export의 버튼 링크 변환과 원문 문서 콘텐츠가 포함될 수 있음.','sourceCommit':'bde1327','classificationRule':'공통 컴포넌트(shadcn 기반 + 기존 프로젝트 공통) / 이를 조합한 업무 UI 타입. Sidebar는 사용자 확인에 따라 기존 공통으로 분류하며 shadcn 사용 목록에서 제외.'},'summary':summary,'screens':rows}
(r/'docs/screens/ui-component-inventory-562.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'count':len(rows),'groups':summary},ensure_ascii=False,indent=2))

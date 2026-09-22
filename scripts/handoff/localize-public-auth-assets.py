# Localize the public entry CSS and images so deployment hashes cannot break snapshots.
from pathlib import Path
import json,re,subprocess,urllib.parse
root=Path('public/html/erp');mapping={}
def fetch(url):
 if url in mapping:return mapping[url]
 name='common-auth-'+Path(urllib.parse.urlparse(url).path).name;dest=root/'assets'/name;mapping[url]='assets/'+name
 subprocess.run(['curl','-fsSL','--max-time','30','-o',str(dest),url],check=True)
 if name.endswith('.css'):
  css=dest.read_text()
  def sub(m):
   value=m.group(1).strip(' \"\'')
   if value.startswith(('data:','#')):return m.group(0)
   target=urllib.parse.urljoin(url,value)
   if urllib.parse.urlparse(target).netloc!='devdev-e6t.pages.dev':return m.group(0)
   return 'url('+Path(fetch(target)).name+')'
  dest.write_text(re.sub(r'url\(([^)]+)\)',sub,css))
 old=dest.with_name(name.replace('common-auth-','auth-'))
 if old.exists() and old.read_bytes()==dest.read_bytes():
  dest.unlink();mapping[url]='assets/'+old.name
 return mapping[url]
for c in json.load(open('/tmp/erp-auth-current/captures.json')):
 p=root/(c['id']+'.html');s=p.read_text()
 for url in set(re.findall(r'(?:src|href)="(https://devdev-e6t.pages.dev/assets/[^"]+)"',s)):s=s.replace(url,fetch(url))
 p.write_text(s)
print('Localized assets:',len(mapping))

// Capture the implemented public entry flow. Preview-only states use an explicit local URL.
const {chromium}=require('@playwright/test');
const fs=require('node:fs');const path=require('node:path');
const root=path.resolve('public/html/erp');const shots='/tmp/erp-auth-current';fs.mkdirSync(shots,{recursive:true});
const publicOrigin=process.env.AUTH_PUBLIC_ORIGIN||'https://devdev-e6t.pages.dev';const live=process.env.AUTH_CAPTURE_URL||publicOrigin;const preview=process.env.AUTH_PREVIEW_URL||'http://127.0.0.1:4185';const results=[];let css='';
(async()=>{const b=await chromium.launch({channel:'chrome'});const c=await b.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});await c.route('**/*',r=>['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());let p=await c.newPage();p.setDefaultTimeout(8000);
const go=async(route,local=false)=>{await p.close();p=await c.newPage();p.setDefaultTimeout(8000);await p.goto((local?preview:live)+route,{waitUntil:'domcontentloaded'});await p.locator('main').waitFor();await p.waitForTimeout(600);await p.evaluate(()=>document.fonts.ready);};
const click=async(name)=>{await p.getByRole('button',{name,exact:true}).last().click();await p.waitForTimeout(350);};
async function capture(id,title,{full=false,next,local=false,selector}={}){
 const el=selector?p.locator(selector).last():full?p.locator('body'):p.locator('[data-auth-layout] section[aria-label] > div').first();
 await el.waitFor();const png=path.join(shots,id+'.png');
 // Hide inspection controls without changing the actual implemented state.
 await p.addStyleTag({content:'[aria-label="로그인 데모 상태"],details:has([aria-label="가입 결과 미리보기"]){display:none!important}'});
 await el.screenshot({path:png,animations:'disabled'});
 const html=await el.evaluate((n,{full,live})=>{const x=n.cloneNode(true);for(const e of [x,...x.querySelectorAll('*')]){if(e.matches('script,iframe,object,embed,[data-sonner-toaster],[aria-label="로그인 데모 상태"],details:has([aria-label="가입 결과 미리보기"])')){e.remove();continue}if(e.tagName==='P'&&e.textContent.startsWith('데모 계정:')){e.remove();continue}for(const a of [...e.attributes])if(/^on/i.test(a.name))e.removeAttribute(a.name);if(e.tagName==='INPUT'){e.setAttribute('value',e.value);if(e.checked)e.setAttribute('checked','');e.setAttribute('readonly','');}if(e.tagName==='BUTTON')e.setAttribute('type','button');if(e.tagName==='FORM'){e.removeAttribute('action');e.removeAttribute('method')}for(const k of ['href','src']){const v=e.getAttribute(k);if(v?.startsWith('/'))e.setAttribute(k,live+v)}}return full?x.innerHTML:x.outerHTML},{full,live:publicOrigin});
 const bytes=fs.readFileSync(png);const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
 const capturedLocally=local||['localhost','127.0.0.1'].includes(new URL(live).hostname);
 const note=capturedLocally?'로컬 미리보기에서 확인한 구현 상태 · 실제 서버 처리 결과 아님':'공개 페이지의 구현 상태 · 디자인 검토용 정적 캡처';
 const nav=`<nav class="static-handoff-nav" style="padding:12px;font:13px/1.7 system-ui;background:#eef4fb"><a href="designer-guide.html#menu-auth">작업 안내</a> · <a href="auth-login.html">로그인</a> · <a href="auth-signup.html">회원가입</a> · <a href="auth-free-trial.html">무료체험</a> · <a href="auth-recovery.html">비밀번호 복구</a><br>${note}${next?` · <a href="${next}.html">다음 상태 보기 →</a>`:''}</nav>`;
 const doc=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="script-src 'none'; object-src 'none'"><title>${title}</title>${css}</head><body>${nav}${full?html:`<main data-auth-fragment style="max-width:${width}px;width:100%;margin:24px auto;padding:0 12px">${html}</main>`}</body></html>`;
 fs.writeFileSync(path.join(root,id+'.html'),doc);results.push({id,title,route:new URL(p.url()).pathname+new URL(p.url()).search,group:'로그인·가입·무료체험',width,height,full,local:capturedLocally,next,shot:png});fs.writeFileSync(path.join(shots,'captures.json'),JSON.stringify(results,null,2));console.log(id,width,height);
}
await go('/login');css='<link rel="stylesheet" href="assets/handoff.css">';
await capture('auth-login','공통 로그인 · 기본',{full:true,next:'auth-login-success'});
await click('로그인');await capture('auth-login-required','로그인 · 필수 입력 오류',{next:'auth-login-success'});
await p.locator('input[type=email]').fill('designer@example.com');await p.locator('input[type=password]').fill('incorrect-demo');await click('로그인');await capture('auth-login-error','로그인 · 인증 실패',{next:'auth-login-success'});
await click('Google로 계속하기');await capture('auth-login-provider-error','로그인 · 소셜 인증 오류',{next:'auth-login'});
await p.locator('input[type=email]').fill('ecoya@ecoya.kr');await p.locator('input[type=password]').fill('ecoya');await click('로그인');await capture('auth-login-success','로그인 · 조직 확인·제품 진입',{next:'home'});
await go('/login?returnTo=usage');await capture('auth-login-usage','이용내역 · 로그인 필요',{next:'auth-login-success'});
for(const [id,label] of [['network-error','네트워크 오류'],['page-error','계정·조직 조회 오류'],['rate-limited','로그인 시도 제한'],['no-organization','조직 없음'],['pending-approval','승인 대기'],['session-expired','세션 만료']]){await go('/login?preview=1',true);await p.getByRole('combobox',{name:'로그인 데모 상태'}).click();await p.getByRole('option',{name:label,exact:true}).click();await capture('auth-login-'+id,'로그인 · '+label,{local:true,next:'auth-login'});}
await go('/signup');await capture('auth-signup','공통 회원가입 · 계정 정보 입력',{full:true,next:'auth-signup-verification'});await click('계정 만들기');await capture('auth-signup-required','회원가입 · 필수값 누락',{next:'auth-signup'});
async function fillSignup(email='designer@example.com'){for(const [name,v] of Object.entries({email,password:'sample123!',confirm:'sample123!'}))await p.locator(`input[name="${name}"]`).fill(v);}
await fillSignup('invalid-email');await click('계정 만들기');await capture('auth-signup-email-error','회원가입 · 이메일 형식 오류',{next:'auth-signup'});
await fillSignup();await p.locator('input[name=confirm]').fill('different123!');await click('계정 만들기');await capture('auth-signup-password-error','회원가입 · 비밀번호 불일치',{next:'auth-signup'});
await fillSignup();await capture('auth-signup-ready','회원가입 · 계정 생성 가능',{next:'auth-signup-verification'});
await click('계정 만들기');await capture('auth-signup-verification','회원가입 · 이메일 인증',{next:'auth-signup-organization'});
await click('인증을 완료했습니다');await capture('auth-signup-organization','회원가입 · 조직 설정',{next:'auth-signup-complete'});
await click('조직 만들기');await capture('auth-signup-organization-error','회원가입 · 조직명 누락',{next:'auth-signup-organization'});
await p.getByLabel('조직명',{exact:true}).fill('ECOYA Demo Co.');await click('조직 만들기');await capture('auth-signup-complete','회원가입 · 계정·조직 준비 완료',{next:'home'});
for(const [id,label] of [['account-error','계정 생성 오류'],['network-error','가입 연결 오류'],['legal-error','약관 조회 오류'],['partial-failure','계정 생성 후 조직 준비 실패']]){await go('/signup?preview=1',true);await p.locator('summary').click();await p.getByRole('combobox',{name:'가입 결과 미리보기'}).click();await p.getByRole('option',{name:label,exact:true}).click();await capture('auth-signup-'+id,'회원가입 · '+label,{local:true,next:id==='partial-failure'?'auth-signup-organization':'auth-signup'});}
await go('/free-trial');await capture('auth-free-trial','무료체험 · 제품 선택',{full:true,next:'auth-signup-trial-erp'});await p.getByLabel('토큰 수').fill('2500');await capture('auth-trial-credits','무료체험 · AI 크레딧 환산',{selector:'main section',next:'auth-free-trial'});await p.getByLabel('토큰 수').fill('');await capture('auth-trial-credits-empty','무료체험 · 토큰 입력 필요',{selector:'main section',next:'auth-trial-credits'});
for(const product of ['erp','snap']){await go('/signup?product='+product+'&intent=trial');await capture('auth-signup-trial-'+product,'무료체험 · '+(product==='erp'?'Trade OS':'SNAP')+' 가입 진입',{next:'auth-signup-verification'});}
await go('/password-recovery');await capture('auth-recovery','비밀번호 복구 · 링크 요청',{full:true,next:'auth-recovery-sent'});await p.locator('input[type=email]').fill('designer@example.com');await click('복구 링크 보내기');await capture('auth-recovery-sent','비밀번호 복구 · 발송 안내',{next:'auth-recovery-reset'});
await go('/password-recovery?preview=1',true);await p.locator('input[type=email]').fill('designer@example.com');await click('복구 링크 보내기');await click('복구 링크 데모 열기');await capture('auth-recovery-reset','비밀번호 복구 · 새 비밀번호 입력',{local:true,next:'auth-recovery-complete'});await p.locator('input[type=password]').nth(0).fill('sample123!');await p.locator('input[type=password]').nth(1).fill('different123!');await capture('auth-recovery-mismatch','비밀번호 복구 · 비밀번호 불일치',{local:true,next:'auth-recovery-reset'});await p.locator('input[type=password]').nth(1).fill('sample123!');await click('비밀번호 변경');await capture('auth-recovery-complete','비밀번호 복구 · 변경 완료',{local:true,next:'auth-login'});
await go('/password-recovery?preview=1',true);await p.locator('input[type=email]').fill('designer@example.com');await click('복구 링크 보내기');await click('복구 링크 데모 열기');await click('만료 링크 상태 보기');await capture('auth-recovery-expired','비밀번호 복구 · 링크 만료·재발급',{local:true,next:'auth-recovery'});
for(const kind of ['terms','privacy']){await go('/legal/'+kind);await capture('auth-'+kind,kind==='terms'?'이용약관 · 승인본 준비 상태':'개인정보 처리방침 · 승인본 준비 상태',{full:true,next:'auth-signup-verification'});}
await b.close();})().catch(e=>{console.error(e);process.exitCode=1});

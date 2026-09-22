import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve('public/html/erp')
const output = path.join(root, 'captures/notices')
const origin = process.env.NOTICE_PREVIEW_ORIGIN || 'http://127.0.0.1:5198'
const entries = []
await fs.mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' })
async function capture(id, group, title, shape, source, selector, text, options = {}) {
  await page.goto('file://' + path.join(root, source + '.html'))
  await page.evaluate(() => document.fonts.ready)
  await page.addStyleTag({ content: '.static-handoff-nav{display:none!important}*,*::before,*::after{animation:none!important;transition:none!important}' })
  let node = page.locator(selector)
  if (text) node = node.filter({ hasText: text })
  node = node.first()
  if (options.parent) node = node.locator('..')
  if (options.open) await node.evaluate(n => n.open = true)
  if (['영역 안 안내', '접히는 안내', '입력칸 안내'].includes(group) || id === 'status-processing' || id === 'status-failure') {
    await node.evaluate(n => {
      n.style.setProperty('width', '560px', 'important')
      n.style.setProperty('max-width', '560px', 'important')
      n.style.setProperty('flex', 'none', 'important')
    })
  }
  await save(node, { id, group, title, shape, source: source + '.html', origin: 'deployed-html', sourceCode: options.code })
}
async function save(node, entry) {
  await node.waitFor({ state: 'visible' })
  const file = 'captures/notices/' + entry.id + '.png'
  await node.screenshot({ path: path.join(root, file), animations: 'disabled' })
  const image = await fs.readFile(path.join(root, file))
  entries.push({ ...entry, file, width: image.readUInt32BE(16), height: image.readUInt32BE(20), text: (await node.innerText()).trim() })
}
try {
  const alert = '[data-slot=alert]'
  await capture('inline-simple', '영역 안 안내', '한 줄 안내', '아이콘 + 본문', 'document-review', alert, '필수값·금액', { code: 'src/App.tsx' })
  await capture('inline-description', '영역 안 안내', '제목 + 설명', '제목 / 설명', 'document-flow-requester-pending', alert, '승인을 기다리고', { code: 'src/App.tsx' })
  await capture('inline-action', '영역 안 안내', '액션 포함', '아이콘 / 제목·설명 / 버튼', 'document-flow-requester-approved', alert, '문서를 확정할', { code: 'src/App.tsx' })
  await capture('inline-dismiss', '영역 안 안내', '확인 후 닫기', '아이콘 / 제목·설명 / 확인', 'upload-invoice-duplicate-file', alert, '이미 같은 이름', { code: 'src/App.tsx:3494' })
  await capture('inline-details', '영역 안 안내', '관련 정보 포함', '제목·설명 / 관련 파일·거래', 'document-duplicate', alert, '이미 등록된 문서', { code: 'src/App.tsx:6286' })
  await capture('inline-control', '영역 안 안내', '입력 컨트롤 포함', '제목·설명 / 문서 유형 선택', 'document-unknown', alert, '문서 유형을 확인', { code: 'src/App.tsx:6216' })
  await capture('disclosure-closed', '접히는 안내', '접힌 상태', '아이콘 / 한 줄 안내 / 자세히', 'document-upload', 'details', 'AI 추출값은', { code: 'src/App.tsx:3475' })
  await capture('disclosure-open', '접히는 안내', '펼친 상태', '요약 / 상세 설명', 'document-upload', 'details', 'AI 추출값은', { open: true, code: 'src/App.tsx:3475' })
  await capture('field-help', '입력칸 안내', '도움말', '입력칸 아래 · 아이콘 + 문구', 'document-review', '[data-slot=form-field-message]', '거래처 학습 후보', { parent: true, code: 'packages/shared-ui/src/components/form-field.tsx:74' })
  await capture('field-error', '입력칸 안내', '불일치 오류', '입력칸 아래 · 오류 아이콘 + 문구', 'document-review', '[data-slot=form-field-message]', '원문 불일치', { parent: true, code: 'packages/shared-ui/src/components/form-field.tsx:74' })
  await capture('field-auth', '입력칸 안내', '회원가입 오류', '입력칸 아래 · 오류 문구', 'auth-signup-password-error', '[role=alert]', '비밀번호가 일치', { parent: true, code: 'auth/components/auth-input-field.tsx:72' })
  await capture('review-trigger', '검토 항목 목록', '건수 버튼', '검토 필요 + 건수 + 펼치기', 'document-review', '[data-slot=popover-trigger]', '검토 필요 2건', { code: 'trade-os/components/document-blocking-alerts.tsx' })
  await capture('review-list', '검토 항목 목록', '목록 펼침', '제목 / 이동 가능한 항목 목록', 'document-review-action-12', '[data-slot=popover-content]', '검토 필요', { code: 'trade-os/components/document-blocking-alerts.tsx' })
  await capture('status-saved', '처리 상태', '자동 저장 상태', '상태 표시 + 짧은 문구', 'document-review', 'span[role=status]', '자동 저장됨', { code: 'packages/shared-ui/src/components/auto-save-status.tsx' })
  await capture('status-processing', '처리 상태', '처리 중', '진행 아이콘 / 제목·설명 / 상태 배지', 'document-processing', alert, 'AI가 문서를 읽고', { code: 'src/App.tsx:6286' })
  await capture('status-failure', '처리 상태', '처리 실패', '오류 아이콘 / 제목·설명 / 상태 배지', 'document-failed', alert, '문서를 처리하지', { code: 'src/App.tsx:6286' })
  await capture('confirm-delete', '확인 팝업', '삭제 확인', '제목 / 설명 / 취소·삭제', 'deal-note-1-delete-confirm', '[role=dialog]', '노트 삭제', { code: 'trade-os/deal-detail-prototype.tsx' })

  // Render the real toast hosts locally; only example notifications are dispatched.
  // No business action, payment, email, or external API mutation is performed.
  const harness = path.resolve('src/__notice_capture_preview.tsx')
  await fs.writeFile(harness, `export { toast } from 'sonner'\nexport { showToast, clearToasts } from './reference-3030/components/platform/toast/toastStore'\n`)
  try {
    await page.goto(origin + '/erp/shipments')
    await page.getByRole('heading', { name: '배송 추적', exact: true }).waitFor()
    for (const [id, kind, tone, message, shape] of [
      ['toast-main-success', 'main', 'success', '저장했습니다.', '상단 중앙 · 아이콘 / 문구 / 닫기'],
      ['toast-main-error', 'main', 'error', '저장하지 못했습니다. 다시 시도해 주세요.', '상단 중앙 · 오류 / 문구 / 닫기'],
      ['toast-operations-success', 'operations', 'success', '예시 작업을 완료했습니다.', '상단 중앙 · 완료 카드 / 닫기'],
      ['toast-operations-error', 'operations', 'error', '예시 작업을 완료하지 못했습니다.', '상단 중앙 · 오류 카드 / 닫기'],
      ['toast-operations-action', 'operations', 'info', '예시 안내입니다.', '상단 중앙 · 설명 / 액션 / 닫기'],
    ]) {
      await page.evaluate(async ({ kind, tone, message }) => {
        const m = await import('/src/__notice_capture_preview.tsx')
        m.toast.dismiss(); m.clearToasts()
        if (kind === 'main') m.toast[tone](message, { duration: Infinity })
        else m.showToast({ tone, message, duration: null, ...(tone === 'info' ? { description: '변경된 내용을 확인할 수 있습니다.', action: { label: '확인', onClick() {} } } : {}) })
      }, { kind, tone, message })
      const node = page.locator(kind === 'main' ? '[data-sonner-toast]' : '[data-ui=toast-host] > *').filter({ hasText: message }).first()
      await save(node, { id, group: '토스트', title: (kind === 'main' ? '업무 공통' : '운영 화면') + ' · ' + ({success:'완료',error:'오류',info:'액션 포함'}[tone]), shape, source: 'shipments.html', origin: 'source-component-preview', sourceCode: kind === 'main' ? 'src/main.tsx:21' : 'trade-os/reference-3030/components/platform/toast/ToastHost.tsx' })
    }
  } finally { await fs.rm(harness, { force: true }) }
} finally { await browser.close() }
await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify({ capturedAt: new Date().toISOString(), sourceCommit: 'd5919d9f52add54e11430369a82263309418d121', entries }, null, 2) + '\n')
console.log('Notice examples:', entries.length)

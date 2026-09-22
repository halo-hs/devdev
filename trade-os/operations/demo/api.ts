import captured from './responses.json'
import reportFixtures from './reports.json'
import { deals } from '@trade-os/lib/prototype-deals'
import type { Shipment } from '../lib/api/shipments'

// Sanitized development seed contracts, used only by the explicitly labelled demo.
const responses = captured as Record<string, unknown>
const copy = <T,>(value: T): T => structuredClone(value)
const storageKey = 'ecoya:public-demo:shipment-overrides:v1'
const demoUser = '940ff121-2c36-58fa-9c13-05870353ce22'
const demoOrg = '11111111-1111-4111-8111-111111111111'
const baseDay = new Date().toISOString().slice(0, 10)
const date = (offset: number) => { const d = new Date(baseDay); d.setUTCDate(d.getUTCDate() + offset); return d.toISOString().slice(0, 10) }
const hostDeals = deals.map((deal, index) => ({
  deal_id: `de000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  display_id: deal.id, title: deal.title, counterparty_name: deal.counterparty,
  status: deal.stage, risks: [], documents: [], next_actions: [],
}))
const primary = hostDeals.find(d => d.display_id === 'DL-260708-01')!
const seedShipments: Shipment[] = Array.from({ length: 14 }, (_, index) => {
  const deal = index < 2 ? primary : hostDeals.filter(d => d.deal_id !== primary.deal_id)[(index - 2) % (hostDeals.length - 1)]
  return {
    id: `5e000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    deal_id: deal.deal_id, deal_title: deal.title, deal_counterparty: deal.counterparty_name,
    bl_number: `DEMO${String(index + 1).padStart(7, '0')}`, container_number: `DEMU${String(index + 1).padStart(7, '0')}`,
    carrier: index % 2 ? 'HMM' : 'MSC', vessel: index % 2 ? 'Demo Ocean' : 'Demo Pacific',
    pol: index % 2 ? 'SGSIN' : 'KRPUS', pod: index % 2 ? 'KRPUS' : 'DEHAM',
    etd: date(-10), eta: date(index === 0 ? -2 : index < 5 ? 2 : index),
    status: index > 11 ? 'arrived' : 'departed', source: 'manual',
  }
})
function shipments() {
  let overrides: Record<string, Partial<Shipment>> = {}
  try { overrides = JSON.parse(localStorage.getItem(storageKey) || '{}') } catch { /* A corrupt demo cache starts fresh. */ }
  return seedShipments.map(row => ({ ...row, ...overrides[row.id] }))
}
const identity = {
  user_id: demoUser, account: { account_id: demoUser, email_verified: true }, current_organization_id: demoOrg,
  organizations: [{ organization_id: demoOrg, name: 'ECOYA Demo Co.', lifecycle_state: 'active', membership: { status: 'active', role: 'OWNER' } }],
  capabilities: { can_create_organization: false, can_manage_billing: false, can_manage_products: false },
  products: [{ product_id: 'TRADE_OS', subscription_state: 'paid_active', trial_state: 'not_started', trial_quota_state: 'not_applicable', product_access_allowed: true, entitlement_state: 'active', member_access: 'granted', onboarding_state: 'complete' }],
  landing: { state: 'ready', path: '/erp/home', reason_code: 'DEMO_READY', allowed_actions: [], product_id: 'TRADE_OS', organization_id: demoOrg },
}

export async function demoRequest<T>(rawPath: string, init?: RequestInit): Promise<T> {
  const url = new URL(rawPath.replace(/^\/(?:__reference3030\/)?api\/(?:platform|v1)/, ''), 'https://demo.invalid')
  const path = url.pathname, query = url.searchParams
  const method = (init?.method || 'GET').toUpperCase()
  let value: unknown
  if (method !== 'GET') {
    const match = path.match(/^\/trade\/shipments\/([^/]+)\/refresh-tracking$/)
    if (method === 'POST' && match) {
      const current = shipments().find(row => row.id === match[1])
      if (!current) throw new Error('예시 선적을 찾을 수 없습니다.')
      const refreshed: Shipment = { ...current, eta: current.confirmed_eta || date(3), provider_eta: date(3), provider_fetched_at: new Date().toISOString(), last_carrier_sync_at: new Date().toISOString(), status: current.status === 'arrived' ? 'arrived' : 'loaded', source: 'carrier' }
      // Store IDs and small synthetic records only. Other tabs re-read this same state.
      const saved = Object.fromEntries(shipments().map(row => [row.id, row]))
      saved[current.id] = refreshed
      localStorage.setItem(storageKey, JSON.stringify(saved))
      value = { shipment: refreshed }
    } else throw new Error('예시 화면입니다. 실제 저장·발송은 실행되지 않습니다.')
  } else if (path === '/me') value = identity
  else if (path === '/me/entitlements') value = {
    contract_version: 'demo-v1', organization_id: demoOrg, generated_at: new Date().toISOString(), tier: 'pro',
    products: { erp: { enabled: true }, snap: { enabled: true }, intelligence: { enabled: false } },
    features: { 'erp.write': true, 'erp.reports': true, 'erp.sales_performance': true, 'erp.month_close': true }, workspace: { default_product: 'TRADE_OS' },
  }
  else if (path === '/erp/payment-schedules') value = { items: [], pagination: { total: 0, limit: 200, offset: 0 } }
  else if (path === '/trade/shipments') {
    const rows = shipments().filter(row => !query.get('deal_id') || row.deal_id === query.get('deal_id'))
    value = { shipments: rows.slice(Number(query.get('offset') || 0), Number(query.get('offset') || 0) + Number(query.get('limit') || 500)), sync_status: 'ok' }
  } else if (path === '/trade/deals') value = { items: hostDeals, meta: { page: 1, page_size: 100, page_count: 1, total: hostDeals.length } }
  else if (path.startsWith('/trade/deals/')) {
    const id = path.split('/').pop()
    const deal = hostDeals.find(d => d.deal_id === id)
    if (!deal) throw new Error('이 예시 데이터에는 해당 거래 상세가 없습니다.')
    value = deal
  } else if (path === '/trade/snap-evidence/containers') value = { containers: seedShipments.slice(0, 5).map((s, i) => ({ id: s.id, container_no: s.container_number, media_count: i + 2, allocation_label: null })) }
  else if (path.startsWith('/erp/reports/') && !path.includes('month-close')) {
    const from = query.get('from'), to = query.get('to')
    const months = from && to ? (Number(to.slice(0,4)) - Number(from.slice(0,4))) * 12 + Number(to.slice(5,7)) - Number(from.slice(5,7)) + 1 : 12
    const period = months <= 3 ? 3 : months <= 6 ? 6 : months <= 12 ? 12 : 24
    const member = query.get('assignee_id') ? demoUser : 'all'
    const bundles = reportFixtures.bundles as Record<string, Record<string, { body: unknown }>>
    const bundle = bundles[`${period}/${member}`] || bundles[`${period}/all`]
    const key = ({ 'settlement-series':'series','gp-series':'gp','gp-by-assignee':'ranking','counterparty-status':'status','counterparty-gp':'counterpartyGp','counterparty-top':query.get('metric') === 'overdue' ? 'overdueTop':'top' } as Record<string,string>)[path.split('/').pop()!]
    value = bundle[key]?.body
  } else {
    const candidates = Object.entries(responses).filter(([key]) => key.split('?')[0] === path)
    candidates.sort(([a], [b]) => {
      const score = (key: string) => [...new URL(key, url).searchParams].reduce((n,[k,v]) => n + (query.get(k) === v ? 1 : query.has(k) ? -2 : 0), 0)
      return score(b) - score(a)
    })
    value = candidates[0]?.[1]
    if (value && Number(query.get('offset') || 0) > 0) value = { ...(value as object), items: [], entries: [], facts: [] }
  }
  if (value === undefined) throw new Error(`예시 데이터가 없는 항목입니다: ${path}`)
  return copy(value) as T
}

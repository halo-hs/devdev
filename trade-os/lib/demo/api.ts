import { listShipmentDocumentRegistrations } from "../erpDocumentWorkflow"
import { splitShipmentReviewFixture } from "./splitShipmentReviewFixture"
import { prototypeBackend } from "../prototypeBackend"
import { createDemoPaymentSchedule, withDemoScheduleLedger, withDemoSettlementTotals } from "./dealPaymentSchedules"
import type { CreatePaymentScheduleBody, LedgerResponse, SettlementOverview, SettlementCalendar } from "../api/settlement"
import { salesPerformancePreview, salesPerformanceRanking } from "./salesPerformancePreview"
import { demoExceptionResponse } from "./settlementExceptions"
import captured from './responses.json'
import reportFixtures from './reports.json'
import monthCloseFixtures from './month-closes.json'
import { deals } from '@trade-os/lib/prototypeDeals'
import type { Shipment, ShipmentConfirmation } from '../api/shipments'
import type { MonthClose, MonthCloseRequest, MonthCloseReopenRequest, MonthCloseSnapshotV1 } from '../api/reports'
import { ApiError } from '../api/client'

// Sanitized development seed contracts, used only by the explicitly labelled demo.
const responses = captured as Record<string, unknown>
const copy = <T,>(value: T): T => structuredClone(value)
const storageKey = 'ecoya:public-demo:shipment-overrides:v2'
const monthClosesStorageKey = 'ecoya:public-demo:month-closes:v1'
let monthClosesFallback: MonthClose[] | undefined
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
// One deal usually ships in several lots: 3–4 shipments per deal.
const shipmentsPerDeal = [4, 3, 4, 3, 4, 3, 4, 3]
const shipmentDeals = [primary, ...hostDeals.filter(d => d.deal_id !== primary.deal_id)]
  .slice(0, shipmentsPerDeal.length)
  .flatMap((deal, dealIndex) => Array.from({ length: shipmentsPerDeal[dealIndex] }, () => deal))
// The primary deal's first three lots match its B/L documents (deal detail
// links shipment rows to B/L, CI and packing list by B/L number). Its fourth
// lot stays without documents to show the unlinked state.
const primaryLots = [
  { bl_number: 'HMM-014W-2607', container_number: 'HMMU1234567' },
  { bl_number: 'HMM-015W-2607', container_number: 'HMMU7654321' },
  { bl_number: 'HMM-016W-2607', container_number: 'HMMU9876543' },
]
const seedShipments: Shipment[] = shipmentDeals.map((deal, index) => {
  const lot = deal.deal_id === primary.deal_id ? primaryLots[index] : undefined
  if (lot) return {
    id: `5e000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    deal_id: deal.deal_id, deal_title: deal.title, deal_counterparty: deal.counterparty_name,
    ...lot, container_count: index === 1 ? 1 : 2,
    carrier: 'HMM', vessel: 'HMM Green', pol: 'Melbourne', pod: 'Busan',
    etd: date(-10), eta: date(index === 0 ? -2 : 2),
    edit_token: `shipment-${index}-initial`,
    status: 'departed', source: 'manual',
  }
  return {
    id: `5e000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    deal_id: deal.deal_id, deal_title: deal.title, deal_counterparty: deal.counterparty_name,
    bl_number: `DEMO${String(index + 1).padStart(7, '0')}`, container_number: `DEMU${String(index + 1).padStart(7, '0')}`,
    carrier: index % 2 ? 'HMM' : 'MSC', vessel: index % 2 ? 'Demo Ocean' : 'Demo Pacific',
    pol: index % 2 ? 'SGSIN' : 'KRPUS', pod: index % 2 ? 'KRPUS' : 'DEHAM',
    etd: date(-10), eta: date(index === 0 ? -2 : index < 5 ? 2 : index),
    edit_token: `shipment-${index}-initial`,
    status: index % 5 === 4 ? 'arrived' : 'departed', source: 'manual',
  }
})
// The document-linked lots use the same identities and fields as the deal's CI and PL examples.
const nordicDeal = hostDeals.find(deal => deal.display_id === 'DL-260704-02')!
const documentShipments: Shipment[] = splitShipmentReviewFixture(nordicDeal.display_id).billsOfLading.map(bill => ({
  id: bill.documentId, deal_id: nordicDeal.deal_id, deal_title: nordicDeal.title, deal_counterparty: nordicDeal.counterparty_name,
  bl_number: bill.blNumber, container_number: bill.fields.containerNumber, container_count: bill.fields.containerCount,
  carrier: bill.fields.carrier, vessel: bill.fields.vessel, pol: bill.fields.portOfLoading, pod: bill.fields.portOfDischarge,
  source: 'document', status: 'unknown', edit_token: bill.documentId + '-initial',
}))
// Shipments added by hand on a deal (prototype only: the platform API has no create route yet).
const createdKey = 'ecoya:public-demo:shipment-created:v1'
function createdShipments(): Shipment[] {
  try { const rows: unknown = JSON.parse(localStorage.getItem(createdKey) || '[]'); return Array.isArray(rows) ? rows as Shipment[] : [] } catch { return [] }
}
const deletedKey = 'ecoya:public-demo:shipment-deleted:v1'
function deletedShipments(): string[] {
  try { const ids: unknown = JSON.parse(localStorage.getItem(deletedKey) || '[]'); return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [] } catch { return [] }
}
function dealCatalog() {
  return [...hostDeals, ...prototypeBackend.deals.listCreated().map(deal => ({
    deal_id: deal.id, display_id: deal.id, title: deal.title, counterparty_name: deal.counterparty,
    status: "contract", risks: [], documents: [], next_actions: [],
  }))]
}

function shipments() {
  let overrides: Record<string, Partial<Shipment>> = {}
  try { overrides = JSON.parse(localStorage.getItem(storageKey) || '{}') } catch { /* A corrupt demo cache starts fresh. */ }
  const deleted = new Set(deletedShipments())
  const catalog = dealCatalog()
  const uploadedBills: Shipment[] = listShipmentDocumentRegistrations().filter(doc => doc.active && doc.code === "BL").map(doc => {
    const deal = catalog.find(row => row.display_id === doc.dealId)
    return { id: doc.documentId, deal_id: deal?.deal_id ?? doc.dealId, deal_title: deal?.title,
      deal_counterparty: deal?.counterparty_name, bl_number: doc.fields.bl_number?.value,
      vessel: doc.fields.vessel?.value, pod: doc.fields.port?.value, container_number: doc.fields.container_number?.value,
      etd: doc.fields.etd?.value, eta: doc.fields.eta?.value, status: "unknown", source: "document",
      edit_token: doc.documentId + "-initial" }
  })
  return [...seedShipments, ...documentShipments, ...createdShipments(), ...uploadedBills].filter(row => !deleted.has(row.id)).map(row => ({ ...row, ...overrides[row.id] }))
}
function monthCloses(): MonthClose[] {
  const withSnapshot = (rows: MonthClose[]) => rows.map(row =>
    row.snapshot?.series ? row : { ...row, snapshot: demoMonthSnapshot(row.period_start.slice(0, 7)) }
  )
  if (monthClosesFallback) return copy(monthClosesFallback)
  try {
    const stored = localStorage.getItem(monthClosesStorageKey)
    if (stored) {
      const rows: unknown = JSON.parse(stored)
      if (Array.isArray(rows) && rows.every(row =>
        row && typeof row.id === 'string' && typeof row.period_start === 'string' &&
        /^\d{4}-(0[1-9]|1[0-2])-01$/.test(row.period_start) && typeof row.closed_at === 'string'
      )) return withSnapshot(rows as MonthClose[])
    }
  } catch { /* A corrupt demo cache starts fresh. */ }
  return withSnapshot(copy(monthCloseFixtures.initialCloses))
}
function saveMonthCloses(rows: MonthClose[]) {
  try {
    localStorage.setItem(monthClosesStorageKey, JSON.stringify(rows))
    monthClosesFallback = undefined
  } catch {
    // Preview actions still work for this session when browser storage is blocked.
    monthClosesFallback = copy(rows)
  }
}
function monthCloseError(status: number, code: string, message: string): never {
  throw new ApiError({ status, code, message })
}
function monthEnd(period: string) {
  const [year, month] = period.split('-').map(Number)
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
}
function requestBody<T>(init?: RequestInit): T {
  try { return JSON.parse(String(init?.body || '{}')) as T }
  catch { return monthCloseError(400, 'INVALID_REQUEST', '요청 형식이 올바르지 않습니다.') }
}
function demoMonthSnapshot(period: string): MonthCloseSnapshotV1 {
  const from = `${period}-01`, to = monthEnd(period)
  const snapshots: Record<string, MonthCloseSnapshotV1> = monthCloseFixtures.snapshots
  // These are synthetic preview fixtures. Clone once when closing and persist
  // that copy; opening or reopening an existing close never recalculates it.
  const snapshot = copy(snapshots[period] ?? snapshots[monthCloseFixtures.fallbackPeriod])
  return {
    ...snapshot,
    params: { ...snapshot.params, from, to },
    series: { ...snapshot.series, period_start: from, period_end: to },
    counterparty_top: { ...snapshot.counterparty_top, from, to },
    schedules: {
      ...snapshot.schedules,
      as_of: to,
      items: snapshot.schedules?.items?.map((row, index) => ({
        ...row,
        schedule_id: `demo-${period}-${index + 1}`,
        due_date: `${period}-${row.due_date.slice(8, 10)}`,
      })),
    },
  }
}
const identity = {
  user_id: demoUser, account: { account_id: demoUser, email_verified: true }, current_organization_id: demoOrg,
  organizations: [{ organization_id: demoOrg, name: 'ECOYA Demo Co.', lifecycle_state: 'active', membership: { status: 'active', role: 'OWNER' } }],
  capabilities: { can_create_organization: false, can_manage_billing: false, can_manage_products: false },
  products: [{ product_id: 'TRADE_OS', subscription_state: 'paid_active', trial_state: 'not_started', trial_quota_state: 'not_applicable', product_access_allowed: true, entitlement_state: 'active', member_access: 'granted', onboarding_state: 'complete' }],
  landing: { state: 'ready', path: '/erp/home', reason_code: 'DEMO_READY', allowed_actions: [], product_id: 'TRADE_OS', organization_id: demoOrg },
}

export async function demoRequest<T>(rawPath: string, init?: RequestInit): Promise<T> {
  const url = new URL(rawPath.replace(/^\/api\/(?:platform|v1)/, ''), 'https://demo.invalid')
  const path = url.pathname, query = url.searchParams
  const method = (init?.method || 'GET').toUpperCase()
  const exception = demoExceptionResponse(path, method, typeof init?.body === "string" ? init.body : undefined)
  if (exception.handled) return copy(exception.value) as T
  let value: unknown
  if (method !== 'GET') {
    const match = path.match(/^\/trade\/shipments\/([^/]+)\/refresh-tracking$/)
    const confirmationMatch = path.match(/^\/trade\/shipments\/([^/]+)\/confirmation$/)
    const reopenMatch = path.match(/^\/erp\/reports\/month-closes\/([^/]+)\/reopen$/)
    if (method === 'POST' && path === '/erp/payment-schedules') {
      return createDemoPaymentSchedule(requestBody<CreatePaymentScheduleBody>(init)) as T
    }
    if (method === 'POST' && path === '/erp/reports/month-close') {
      const { period, note } = requestBody<MonthCloseRequest>(init)
      const currentPeriod = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 7)
      if (typeof period !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(period) || period >= currentPeriod || (note !== undefined && (typeof note !== 'string' || note.length > 500))) {
        monthCloseError(400, 'ERP_REPORTS_INVALID_MONTH_CLOSE', '마감 대상 월 또는 메모를 확인해주세요.')
      }
      const rows = monthCloses()
      const existing = rows.find(row => row.period_start.slice(0, 7) === period)
      if (existing && !existing.reopened) monthCloseError(409, 'ERP_REPORTS_ALREADY_CLOSED', '이미 마감한 달입니다.')
      const now = new Date().toISOString()
      const closed: MonthClose = {
        id: existing?.id ?? crypto.randomUUID(), period_start: `${period}-01`, period_end: monthEnd(period),
        timezone: 'Asia/Seoul', closed_by: demoUser, closed_at: now, note: note?.trim() || null,
        snapshot: demoMonthSnapshot(period), reopened: false, reopened_at: null, reopened_by: null, reopen_reason: null,
      }
      saveMonthCloses(existing ? rows.map(row => row.id === existing.id ? closed : row) : [closed, ...rows])
      value = closed
    } else if (method === 'POST' && reopenMatch) {
      const { reason } = requestBody<MonthCloseReopenRequest>(init)
      if (typeof reason !== 'string' || !reason.trim() || reason.length > 500) monthCloseError(400, 'ERP_REPORTS_REOPEN_REASON_REQUIRED', '재개방 사유를 입력해주세요.')
      const rows = monthCloses()
      const existing = rows.find(row => row.id === reopenMatch[1])
      if (!existing) monthCloseError(404, 'ERP_REPORTS_MONTH_CLOSE_NOT_FOUND', '마감 내역을 찾을 수 없습니다.')
      if (existing.reopened) monthCloseError(409, 'ERP_REPORTS_ALREADY_REOPENED', '이미 재개방한 달입니다.')
      const reopened: MonthClose = { ...existing, reopened: true, reopened_at: new Date().toISOString(), reopened_by: demoUser, reopen_reason: reason.trim() }
      saveMonthCloses(rows.map(row => row.id === existing.id ? reopened : row))
      value = reopened
    } else if (method === 'POST' && path === '/trade/shipments') {
      const { deal_id } = requestBody<{ deal_id: string }>(init)
      const deal = dealCatalog().find(d => d.deal_id === deal_id)
      if (!deal) throw new ApiError({ status: 404, code: 'TRADE_DEAL_NOT_FOUND', message: '거래를 찾을 수 없습니다.' })
      const created: Shipment = {
        id: crypto.randomUUID(), deal_id: deal.deal_id, deal_title: deal.title, deal_counterparty: deal.counterparty_name,
        bl_number: null, container_number: null, carrier: null, vessel: null, pol: null, pod: null,
        etd: null, eta: null, edit_token: crypto.randomUUID(), status: 'booked', source: 'manual', manual_entry: true,
      }
      localStorage.setItem(createdKey, JSON.stringify([...createdShipments(), created]))
      value = { shipment: created }
    } else if (method === 'DELETE' && /^\/trade\/shipments\/[^/]+$/.test(path)) {
      const id = path.split('/').pop() ?? ''
      if (createdShipments().some(row => row.id === id)) localStorage.setItem(createdKey, JSON.stringify(createdShipments().filter(row => row.id !== id)))
      else localStorage.setItem(deletedKey, JSON.stringify([...new Set([...deletedShipments(), id])]))
      value = { ok: true }
    } else if (method === 'PATCH' && confirmationMatch) {
      const current = shipments().find(row => row.id === decodeURIComponent(confirmationMatch[1]))
      if (!current) throw new ApiError({status:404, code:'TRADE_SHIPMENT_NOT_FOUND', message:'선적을 찾을 수 없습니다.'})
      const body = requestBody<ShipmentConfirmation>(init)
      if (body.expected_edit_token !== current.edit_token) throw new ApiError({status:409, code:'TRADE_SHIPMENT_EDIT_CONFLICT', message:'다른 사용자가 수정했습니다.'})
      const saved = {...current, edit_token: crypto.randomUUID()}
      const now = new Date().toISOString()
      for (const field of ['confirmed_eta', 'confirmed_etd'] as const) {
        if (body[field] !== undefined) {
          saved[field] = body[field]
          saved[field === 'confirmed_eta' ? 'eta' : 'etd'] = body[field] ?? current[field === 'confirmed_eta' ? 'provider_eta' : 'provider_etd'] ?? null
          saved.confirmed_by = 'ECOYA Demo'; saved.confirmed_at = now; saved.source = 'manual'
        }
      }
      if (body.confirmed_status !== undefined) {
        saved.status = body.confirmed_status || 'unknown'; saved.confirmed_status = body.confirmed_status
        saved.confirmed_status_by = 'ECOYA Demo'; saved.confirmed_status_at = now
      }
      for (const field of ['bl_number', 'container_number', 'carrier', 'vessel', 'pol', 'pod'] as const) {
        if (body[field] !== undefined) saved[field] = body[field] || null
      }
      localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(shipments().map(row => [row.id, row.id === saved.id ? saved : row]))))
      value = {shipment:saved}
    } else if (method === 'POST' && match) {
      const current = shipments().find(row => row.id === decodeURIComponent(match[1]))
      if (!current) throw new Error('예시 선적을 찾을 수 없습니다.')
      const refreshed: Shipment = { ...current, eta: current.confirmed_eta || date(3), provider_eta: date(3), provider_fetched_at: new Date().toISOString(), last_carrier_sync_at: new Date().toISOString(), status: current.confirmed_status || (current.status === 'arrived' ? 'arrived' : 'loaded'), source: 'carrier' }
      // Store IDs and small synthetic records only. Other tabs re-read this same state.
      const saved = Object.fromEntries(shipments().map(row => [row.id, row]))
      saved[current.id] = refreshed
      localStorage.setItem(storageKey, JSON.stringify(saved))
      value = { shipment: refreshed }
    } else throw new Error('예시 화면입니다. 실제 저장·발송은 실행되지 않습니다.')
  } else if (path === '/me') value = identity
  else if (path === '/erp/reports/month-closes') {
    const rows = monthCloses()
      .filter(row => (!query.get('from') || row.period_start.slice(0, 7) >= query.get('from')!.slice(0, 7)) && (!query.get('to') || row.period_start.slice(0, 7) <= query.get('to')!.slice(0, 7)))
      .sort((a, b) => b.period_start.localeCompare(a.period_start))
    const offset = Math.max(0, Number(query.get('offset') || 0))
    const limit = Math.max(1, Number(query.get('limit') || 50))
    value = { items: rows.slice(offset, offset + limit) }
  } else if (/^\/erp\/reports\/month-closes\/[^/]+$/.test(path)) {
    value = monthCloses().find(row => row.id === path.split('/').pop())
    if (!value) monthCloseError(404, 'ERP_REPORTS_MONTH_CLOSE_NOT_FOUND', '마감 내역을 찾을 수 없습니다.')
  }
  else if (path === '/me/entitlements') value = {
    contract_version: 'demo-v1', organization_id: demoOrg, generated_at: new Date().toISOString(), tier: 'pro',
    products: { erp: { enabled: true }, snap: { enabled: true }, intelligence: { enabled: false } },
    features: { 'erp.write': true, 'erp.money.record': true, 'erp.money': true, 'erp.reports': true, 'erp.sales_performance': true, 'erp.month_close': true }, workspace: { default_product: 'TRADE_OS' },
  }
  else if (path === '/erp/payment-schedules') value = { items: [], pagination: { total: 0, limit: 200, offset: 0 } }
  else if (path === '/trade/shipments') {
    const rows = shipments().filter(row => !query.get('deal_id') || row.deal_id === query.get('deal_id'))
    value = { shipments: rows.slice(Number(query.get('offset') || 0), Number(query.get('offset') || 0) + Number(query.get('limit') || 500)), sync_status: 'ok' }
  } else if (path === '/trade/deals') {
    const items = dealCatalog()
    value = { items, meta: { page: 1, page_size: 100, page_count: 1, total: items.length } }
  }
  else if (path.startsWith('/trade/deals/')) {
    const id = path.split('/').pop()
    const deal = dealCatalog().find(d => d.deal_id === id)
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
    if (typeof window !== "undefined" && window.location.pathname.endsWith("/erp/sales-performance")) {
      value = key === "ranking"
        ? salesPerformanceRanking(salesPerformancePreview("gp", bundle.gp.body) as import("../api/reports").GPSeriesResponse, value)
        : salesPerformancePreview(key, value)
    }
  } else {
    const candidates = Object.entries(responses).filter(([key]) => key.split('?')[0] === path)
    candidates.sort(([a], [b]) => {
      const score = (key: string) => [...new URL(key, url).searchParams].reduce((n,[k,v]) => n + (query.get(k) === v ? 1 : query.has(k) ? -2 : 0), 0)
      return score(b) - score(a)
    })
    value = candidates[0]?.[1]
    if (value && path === '/trade/settlement/ledger') {
      const asOf = (responses['/trade/settlement/overview'] as SettlementOverview).data_as_of
      value = withDemoScheduleLedger(value as LedgerResponse, query, asOf)
    } else if (value && (path === '/trade/settlement/overview' || path === '/trade/settlement/calendar')) {
      value = withDemoSettlementTotals(value as SettlementOverview | SettlementCalendar)
    } else if (value && Number(query.get('offset') || 0) > 0) value = { ...(value as object), items: [], entries: [], facts: [] }
  }
  if (value === undefined) throw new Error(`예시 데이터가 없는 항목입니다: ${path}`)
  return copy(value) as T
}

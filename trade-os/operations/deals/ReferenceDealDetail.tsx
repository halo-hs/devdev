import { subscribeShipmentUpdates } from "../lib/shipmentUpdates"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@shared/components/ui/button"
import { PageHeader } from "../components/PageHeader"
import { SectionCard } from "../components/SectionCard"
import { usePlatformSession } from "../session/PlatformSessionContext"
import { getDeal, type DealAggregateResponse } from "../lib/api/deals"
import { ApiError } from "../lib/api/client"
import { effectiveShipmentEta, effectiveShipmentEtd, listShipments, refreshShipmentTracking, type Shipment } from "../lib/api/shipments"
import { canOperationalWrite } from "../lib/productEntitlements"
import { messages } from "../i18n/messages"

const dealStatuses: Record<string, string> = { contract: "계약", shipment: "선적", customs: "통관", settled: "정산 완료", archived: "보관", cancelled: "취소" }
const value = (text?: string | null) => text || "—"

/** API UUIDs are never resolved to the host's unrelated DL-* demonstration data. */
export function ReferenceDealDetail({ dealId }: { dealId: string }) {
  const { getIdToken, entitlements } = usePlatformSession()
  const [deal, setDeal] = useState<DealAggregateResponse | null>(null)
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [error, setError] = useState("")
  const [stale, setStale] = useState(false)
  const [pending, setPending] = useState<string | null>(null)
  const [notice, setNotice] = useState("")
  const generation = useRef(0)
  const refreshing = useRef(false)
  const copy = messages.erpShipments.shipments
  const load = useCallback(async () => {
    const request = ++generation.current
    try {
      const [record, result] = await Promise.all([getDeal(dealId, getIdToken), listShipments(getIdToken, undefined, dealId)])
      if (request !== generation.current) return
      if (record.deal_id !== dealId) throw new Error("거래 정보가 일치하지 않습니다.")
      setDeal(record)
      setShipments(result.shipments.filter(row => row.deal_id === dealId))
      setStale(result.sync_status === "stale")
      setError("")
    } catch (e) {
      if (request !== generation.current) return
      setError(e instanceof ApiError && e.status === 404 ? "거래를 찾을 수 없습니다." : "거래 정보를 불러오지 못했습니다. 다시 시도해 주세요.")
    }
  }, [dealId, getIdToken])
  useEffect(() => {
    void load()
    const onFocus = () => { if (!refreshing.current) void load() }
    const unsubscribe = subscribeShipmentUpdates(change => { if (!change.dealId || change.dealId === dealId) onFocus() })
    window.addEventListener("focus", onFocus)
    return () => { generation.current++; unsubscribe(); window.removeEventListener("focus", onFocus) }
  }, [load])

  async function refresh(id: string) {
    if (refreshing.current || !canOperationalWrite(entitlements)) return
    refreshing.current = true
    // Older GET results must not overwrite a successful tracking response.
    generation.current++
    setPending(id)
    setNotice("")
    try {
      const { shipment } = await refreshShipmentTracking(getIdToken, id)
      if (shipment.id !== id || (shipment.deal_id && shipment.deal_id !== dealId)) throw new Error("선적 정보 불일치")
      setShipments(rows => rows.map(row => row.id === id ? { ...row, ...shipment } : row))
      setNotice("최신 추적 정보를 확인했습니다.")
    } catch (e) {
      setNotice(e instanceof ApiError && e.status === 403 ? copy.refreshTrackingForbidden : e instanceof ApiError && e.status === 402 ? copy.refreshTrackingUnavailable : copy.refreshTrackingError)
    } finally {
      refreshing.current = false
      setPending(null)
    }
  }

  return <div className="reference-page-scroll" data-component="ReferenceDealDetail" data-deal-id={dealId}>
    <div className="reference-content-width w-full space-y-6 px-7 py-6">
      <Button variant="outline" asChild><a href="/erp/shipments">선적 목록으로</a></Button>
      {error && <div role="alert">{error} <Button variant="outline" onClick={() => void load()}>다시 시도</Button></div>}
      {!deal && !error && <p role="status">거래 정보를 불러오는 중…</p>}
      {deal && <>
        <PageHeader title={deal.title || deal.display_id || "거래 상세"} description={deal.counterparty_name || undefined} meta={dealStatuses[deal.status] || deal.status} />
        <SectionCard title="거래 정보">
          <dl className="reference-deal-fields">
            {[["거래 번호", deal.display_id || deal.deal_id], ["거래처", deal.counterparty_name], ["거래 방향", deal.direction === "buy" ? "매입" : deal.direction === "sell" ? "매출" : null], ["담당자", deal.assignee_name], ["계약 번호", deal.po_number], ["인코텀즈", deal.incoterms], ["거래 금액", deal.amount_total ? `${deal.currency} ${deal.amount_total}` : null]].map(([label, content]) => <div key={label}><dt className="text-body-13 text-text-muted">{label}</dt><dd className="mt-1 text-body-15">{value(content)}</dd></div>)}
          </dl>
        </SectionCard>
        <SectionCard title={`선적 정보 · ${shipments.length}건`} id="shipments">
          {stale && <p role="alert">{copy.staleBanner}</p>}
          {notice && <p role="status" className="mb-3 text-body-14">{notice}</p>}
          {shipments.length === 0 ? <p>{copy.empty}</p> : <div className="reference-deal-shipments">
            {shipments.map(row => <article key={row.id} data-shipment-id={row.id}>
              <div className="reference-deal-shipment-heading">
                <h3 className="text-header-17 font-bold">{value(row.bl_number || row.container_number)}</h3>
                <span className="text-body-14">{copy.status[row.status] || row.status}</span>
                {canOperationalWrite(entitlements) && <Button variant="outline" disabled={pending !== null} onClick={() => void refresh(row.id)}>{pending === row.id ? copy.refreshingTracking : copy.refreshTracking}</Button>}
              </div>
              <dl className="reference-deal-fields">
                {[["컨테이너", row.container_number], ["선사 · 선박", [row.carrier, row.vessel].filter(Boolean).join(" · ")], ["구간", `${value(row.pol)} → ${value(row.pod)}`], ["출항(ETD)", effectiveShipmentEtd(row)], ["도착(ETA)", effectiveShipmentEta(row)], ["선사 조회 시각", row.provider_fetched_at || row.last_carrier_sync_at]].map(([label, content]) => <div key={label}><dt className="text-body-13 text-text-muted">{label}</dt><dd className="mt-1 text-body-15">{value(content)}</dd></div>)}
              </dl>
              <p className="mt-3 text-body-13 text-text-muted">{row.confirmed_eta || row.confirmed_etd ? "사람이 확인한 일정 기준" : copy.source[row.source]}{row.provider_eta && row.confirmed_eta && row.provider_eta !== row.confirmed_eta ? ` · 선사 도착 예정 ${row.provider_eta}` : ""}</p>
            </article>)}
          </div>}
        </SectionCard>
        <SectionCard title="거래 서류">
          <ul className="space-y-3">{deal.documents.map(doc => <li key={doc.doc_code} className="flex items-center justify-between gap-4 text-body-14"><span>{doc.label}</span><span>{doc.present ? doc.state === "complete" ? "완료" : "확인 필요" : "미등록"}</span></li>)}</ul>
        </SectionCard>
      </>}
    </div>
  </div>
}

import { operationsDemo } from "./demo/mode"
import { ReferenceDealDetail } from "./deals/ReferenceDealDetail"
import { useEffect, useState } from "react"
import { PlatformSessionProvider, useIdentity } from "./session/PlatformSessionContext"
import { getPlatformIdentity, type PlatformIdentityResponse } from "./lib/api/me"
import { getEntitlements, type EntitlementsResponse } from "./lib/api/entitlements"
import { MonitorConnected } from "./monitor/MonitorConnected"
import { ReportsConnected } from "./reports/ReportsConnected"
import { SalesPerformanceConnected } from "./salesperf/SalesPerformanceConnected"
import { SettlementConnected } from "./settlement/SettlementConnected"
import { ShipmentsConnected, type ShipmentSummary } from "./shipments/ShipmentsConnected"
import { PageHeader } from "./components/PageHeader"
import { ToastHost } from "./components/toast/ToastHost"
import { messages } from "./i18n/messages"
import "./styles/scoped.css"
import "./styles/host-tokens.css"
import "./styles/host.css"

export type ReferenceOperationsScreen = "monitor" | "reports" | "sales" | "settlement" | "shipments"
// The development relay attaches the existing local reference credential on the
// server. No credential is shipped to or persisted by this browser adapter.
const getIdToken = async () => "local-reference-session"

function Body({ screen }: { screen: ReferenceOperationsScreen }) {
  const identity = useIdentity()
  if (screen === "monitor") {
    const copy = messages.erpMonitor.monitor
    return <div className="reference-monitor-shell">
      <div className="min-h-0 min-w-0">
        <MonitorConnected
          canAccess={identity.role === "owner"}
          opsCopy={messages.erpCommon.platformNav.monitorOps}
          bodyCopy={{ ...copy.screen, taskQueueEmpty: messages.erpCommon.platform.taskQueueEmpty }}
          loadErrorLabel={messages.auth.loadError}
          retryLabel={messages.auth.retry}
          stateCopy={copy}
          ackCopy={copy.flagAck}
          liveCopy={copy.live}
        />
      </div>
    </div>
  }
  const copy = screen === "reports" ? messages.erpReports.reports
    : screen === "sales" ? messages.erpSalesPerformance.cockpit
    : screen === "settlement" ? messages.erpSettlement.settlement
    : messages.erpShipments.shipments
  const description = screen === "sales"
    ? messages.erpSalesPerformance.cockpit.subtitleOrg
    : "subtitle" in copy ? copy.subtitle : undefined
  return <div className="reference-page-scroll">
    <div className="reference-content-width w-full space-y-6 px-7 py-6">
      {screen === "reports" ? <ReportsConnected copy={messages.erpReports.reports} role={identity.role}
          renderHeader={(controls, summary) => <PageHeader variant="hero" title={copy.title} description={description}
            meta={<span className="rounded-full bg-ecoya-blue-9 px-2 py-0.5 text-body-13 font-bold text-ecoya-indigo">{messages.erpReports.reports.proBadge}</span>}
            filters={controls} summary={summary} />} />
        : screen === "sales" ? <SalesPerformanceConnected copy={messages.erpSalesPerformance.cockpit} role={identity.role}
          renderHeader={(controls, summary) => <PageHeader variant="hero" title={copy.title} description={description}
            meta={<span className="rounded-full bg-ecoya-blue-9 px-2 py-0.5 text-body-13 font-bold text-ecoya-indigo">{messages.erpReports.reports.proBadge}</span>}
            filters={controls} summary={summary} />} />
        : screen === "settlement" ? <SettlementConnected copy={messages.erpSettlement.settlement}
          renderHeader={(controls, summary) => <PageHeader variant="hero" title={copy.title} description={description} filters={controls} summary={summary} />} />
        : <ShipmentsConnected copy={messages.erpShipments.shipments}
          renderHeader={controls => <PageHeader variant="hero" title={copy.title} description={description} filters={controls} />} />}
    </div>
  </div>
}

export function ReferenceOperations({ screen, dealId, onShipmentSummary }: { screen: ReferenceOperationsScreen | "deal" | "deal-shipments"; dealId?: string; onShipmentSummary?: (summary: ShipmentSummary) => void }) {
  const [session, setSession] = useState<{ identity: PlatformIdentityResponse; entitlements: EntitlementsResponse } | null>(null)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setError("")
    Promise.all([getPlatformIdentity(getIdToken), getEntitlements(getIdToken)])
      .then(([identity, entitlements]) => {
        if (!active) return
        if (identity.state !== "mapped") throw new Error("3030에서 사용할 조직을 먼저 선택해 주세요.")
        setSession({ identity, entitlements })
      })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : "3030 연결을 확인해 주세요.") })
    return () => { active = false }
  }, [attempt])
  return <div className="reference-host" style={{ height: screen === "deal-shipments" ? "auto" : "100%", minHeight: 0, minWidth: 0 }}><div className="reference-3030" data-reference-screen={screen} style={{ height: screen === "deal-shipments" ? "auto" : "100%", minHeight: 0, minWidth: 0 }}>
    {error ? <div role="alert" className="m-6 rounded-lg border p-6">
      <p>화면 데이터를 불러오지 못했습니다.</p><p>{error}</p>
      <button className="mt-3 underline" onClick={() => setAttempt(n => n + 1)}>다시 시도</button>
    </div> : session ? <PlatformSessionProvider {...session} getIdToken={getIdToken}>
      {operationsDemo && screen !== "deal-shipments" ? <div role="note" className="px-7 pt-3 text-sm text-muted-foreground">예시 데이터 · 변경 사항은 이 브라우저에만 반영됩니다.</div> : null}
      {screen === "deal-shipments" && dealId ? <ShipmentsConnected key={dealId} copy={messages.erpShipments.shipments} dealId={dealId} onSummaryChange={onShipmentSummary} /> : screen === "deal" && dealId ? <ReferenceDealDetail key={dealId} dealId={dealId} /> : screen !== "deal" && screen !== "deal-shipments" ? <Body screen={screen} /> : null}
      <ToastHost closeLabel="닫기" />
    </PlatformSessionProvider> : <div className="p-6" role="status">화면 데이터를 불러오는 중입니다…</div>}
  </div></div>
}

import { useEffect, useState } from "react"
import { PlatformSessionProvider } from "./lib/session/PlatformSessionContext"
import { useIdentity } from "./lib/session/platformSession"
import { getPlatformIdentity, type PlatformIdentityResponse } from "./lib/api/me"
import { getEntitlements, type EntitlementsResponse } from "./lib/api/entitlements"
import { MonitorConnected } from "./monitor/MonitorConnected"
import { ReportsConnected } from "./reports/ReportsConnected"
import { SalesPerformanceConnected } from "./salesperf/SalesPerformanceConnected"
import { SettlementConnected } from "./settlement/SettlementConnected"
import { ShipmentsConnected, type ShipmentSummary } from "./shipments/ShipmentsConnected"
import { HeroBanner } from "@/components/platform/HeroBanner"
import { messages } from "./lib/i18n/messages"
import "./OperationsScreens.css"

export type OperationsScreenName = "monitor" | "reports" | "sales" | "settlement" | "shipments"
// The development relay attaches the existing local reference credential on the
// server. No credential is shipped to or persisted by this browser adapter.
const getIdToken = async () => "demo-session"

function Body({ screen }: { screen: OperationsScreenName }) {
  const identity = useIdentity()
  if (screen === "monitor") {
    const copy = messages.erpMonitor.monitor
    return <div className="ops-monitor-shell">
      <div className="min-h-0 min-w-0">
        <MonitorConnected
          canAccess={identity.role === "owner"}
          opsCopy={messages.erpCommon.platformNav.monitorOps}
          bodyCopy={{
            ...copy.screen,
            filtersLabel: copy.view.conditionsLabel,
            throughputConfirms: copy.view.throughputConfirms,
            taskQueueEmpty: messages.erpCommon.platform.taskQueueEmpty,
          }}
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
    ? identity.role === "owner" || identity.role === "admin"
      ? messages.erpSalesPerformance.cockpit.subtitleOrg
      : messages.erpSalesPerformance.cockpit.subtitleMember
    : "subtitle" in copy ? copy.subtitle : undefined
  return <div className="ops-page-scroll">
    <div className="ops-content-width w-full space-y-4 px-5 pt-1.5 pb-10">
      {/* Figma 결산리포트 v6 (5789:51755): no PRO badge, KPI rows sit 16px under the hero. */}
      {screen === "reports" ? <ReportsConnected copy={messages.erpReports.reports} role={identity.role}
          renderHeader={(controls, summary) => <><HeroBanner title={copy.title} description={description} controls={controls} />{summary}</>} />
        // Figma 영업 성과 시안 A (6934:147523): same as 결산 리포트, KPIs under the hero.
        : screen === "sales" ? <SalesPerformanceConnected copy={messages.erpSalesPerformance.cockpit} role={identity.role}
          renderHeader={(controls, summary) => <><HeroBanner title={copy.title} description={description} controls={controls} />{summary}</>} />
        // Figma 정산 (6224:188704): KPI cards sit 16px under the hero, no overlap.
        : screen === "settlement" ? <SettlementConnected copy={messages.erpSettlement.settlement}
          renderHeader={(controls, summary) => <div className="flex flex-col gap-4"><HeroBanner title={copy.title} description={description} controls={controls} />{summary}</div>} />
        : <ShipmentsConnected copy={messages.erpShipments.shipments}
          renderHeader={controls => <HeroBanner title={copy.title} description={description} controls={controls} />} />}
    </div>
  </div>
}

export function OperationsScreen({ screen, dealId, onShipmentSummary }: { screen: OperationsScreenName | "deal-shipments"; dealId?: string; onShipmentSummary?: (summary: ShipmentSummary) => void }) {
  const [session, setSession] = useState<{ identity: PlatformIdentityResponse; entitlements: EntitlementsResponse } | null>(null)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    Promise.all([getPlatformIdentity(getIdToken), getEntitlements(getIdToken)])
      .then(([identity, entitlements]) => {
        if (!active) return
        if (identity.state !== "mapped") throw new Error("3030에서 사용할 조직을 먼저 선택해 주세요.")
        setSession({ identity, entitlements })
      })
      .catch((e: unknown) => { if (active) setError(e instanceof Error ? e.message : "3030 연결을 확인해 주세요.") })
    return () => { active = false }
  }, [attempt])
  return <div className="ops-host" style={{ minHeight: 0, minWidth: 0 }}><div className="ops-screen" data-ops-screen={screen} style={{ minHeight: 0, minWidth: 0 }}>
    {error ? <div role="alert" className="m-6 rounded-lg border p-6">
      <p>화면 데이터를 불러오지 못했습니다.</p><p>{error}</p>
      <button className="mt-3 underline" onClick={() => { setError(""); setAttempt(n => n + 1) }}>다시 시도</button>
    </div> : session ? <PlatformSessionProvider {...session} getIdToken={getIdToken}>
      {screen === "deal-shipments" && dealId ? <ShipmentsConnected key={dealId} copy={messages.erpShipments.shipments} dealId={dealId} onSummaryChange={onShipmentSummary} /> : screen !== "deal-shipments" ? <Body screen={screen} /> : null}
    </PlatformSessionProvider> : <div className="p-6" role="status">화면 데이터를 불러오는 중입니다…</div>}
  </div></div>
}

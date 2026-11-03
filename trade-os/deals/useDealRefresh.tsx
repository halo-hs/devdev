import { listCustomsDocuments } from "@trade-os/lib/dealCustomsDocuments"
import { createContext, useContext, useEffect, useEffectEvent } from "react"
import { prototypeBackend } from "@trade-os/lib/prototypeBackend"
import { usePostWriteRefresh } from "@trade-os/lib/usePostWriteRefresh"

export function useDealRefreshController(dealId: string, role: string) {
  const controller = usePostWriteRefresh(`${dealId}:${role}`, async () => {
    // Resolve Deal access first, so a secondary list outage cannot mask 403/404.
    const deal = await prototypeBackend.deals.read(dealId)
    const documents = await prototypeBackend.dealDocuments.list(dealId)
    try {
      return { deal, documents, customsDocuments: listCustomsDocuments(dealId, documents), customsError: null }
    } catch {
      return { deal, documents, customsDocuments: [], customsError: "통관 문서를 불러오지 못했습니다." }
    }
  })
  const load = useEffectEvent(() => { void controller.refresh() })
  useEffect(() => { load() }, [dealId, role])
  return controller
}

export const DealRefreshContext = createContext<ReturnType<typeof useDealRefreshController> | null>(null)
export function useDealRefresh() {
  const refresh = useContext(DealRefreshContext)
  if (!refresh) throw new Error("DealRefreshContext is required")
  return refresh
}

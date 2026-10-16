import { createContext, useContext } from "react"
import { prototypeBackend } from "@trade-os/lib/prototype-backend"
import { usePostWriteRefresh } from "@trade-os/lib/use-post-write-refresh"

export function useDealRefreshController(dealId: string, role: string) {
  return usePostWriteRefresh(`${dealId}:${role}`, async () => {
    // Resolve Deal access first, so a secondary list outage cannot mask 403/404.
    const deal = await prototypeBackend.deals.read(dealId)
    const documents = await prototypeBackend.dealDocuments.list(dealId)
    return { deal, documents }
  })
}

export const DealRefreshContext = createContext<ReturnType<typeof useDealRefreshController> | null>(null)
export function useDealRefresh() {
  const refresh = useContext(DealRefreshContext)
  if (!refresh) throw new Error("DealRefreshContext is required")
  return refresh
}

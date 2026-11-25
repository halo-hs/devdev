import type { DealDocumentContext } from "@/App"
import { deals } from "./prototypeDeals"
import { prototypeBackend } from "./prototypeBackend"

export type UploadOriginDeal = DealDocumentContext & {
  displayId: string
  amount: string
  currency: string
}

export function readUploadOriginDeal(): UploadOriginDeal | null {
  const query = new URLSearchParams(window.location.search)
  const id = query.get("from") === "deal" ? query.get("deal_id") : query.get("fromDeal")
  if (!id) return null
  const saved = window.history.state?.uploadOriginDeal as UploadOriginDeal | undefined
  if (saved?.id === id) return saved

  const deal = prototypeBackend.deals.getCreated(id) ?? deals.find(row => row.id === id)
  if (!deal) return null
  return {
    id,
    displayId: prototypeBackend.deals.getDisplayId(id),
    title: prototypeBackend.deals.getTitle(id, deal.title),
    party: deal.counterparty,
    amount: deal.amount,
    currency: deal.currency,
  }
}

import { deals, type Deal } from "@trade-os/lib/prototype-deals"

type CurrencySummary = { currency: string; receivable: string; payable: string; overdue: string; trust: string }
type Schedule = { id: string; dealId: string; direction: string; due: string; amount: string; currency: string; overdue: boolean }
type Model = { name: string; role: string; mergedFrom?: string; currencies: CurrencySummary[]; deals: Deal[]; schedules: Schedule[]; partial: boolean; asOf: string }
// Public design fixture adapter. The production model is supplied by settlement,
// counterparties and documents APIs with their own permission and partial states.
export const counterpartyPreview = {
  async read(id: string): Promise<Model | null> {
    const alias = id === "ACME Germany"
    const name = alias || id === "acme" ? "ACME GmbH" : id
    const related = deals.filter(deal => deal.counterparty === name)
    if (!related.length) return null
    const acme = name === "ACME GmbH"
    return {
      name, role: acme ? "매출처" : name.startsWith("KATAMAN") ? "매입처" : "매입처·매출처",
      ...(alias ? { mergedFrom: id } : {}),
      asOf: "2026-07-31 09:00", partial: name.startsWith("KATAMAN"), deals: related,
      currencies: acme ? [
        { currency: "USD", receivable: "42,000.00", payable: "0.00", overdue: "8,000.00", trust: "B+ · 이력 12건" },
        { currency: "EUR", receivable: "12,800.00", payable: "2,400.00", overdue: "0.00", trust: "이력 부족 2건" },
        { currency: "JPY", receivable: "960,000", payable: "0", overdue: "0", trust: "이력 부족 1건" },
        { currency: "KRW", receivable: "1,200,000", payable: "0", overdue: "0", trust: "이력 부족 1건" },
      ] : [...new Set(related.map(deal => deal.currency))].map(currency => ({ currency, receivable: "—", payable: "—", overdue: "—", trust: "이력 확인 필요" })),
      schedules: acme ? [
        { id: "AR-0707-1", dealId: "DL-260707-04", direction: "받을 돈", due: "2026-07-28", amount: "8,000.00", currency: "USD", overdue: true },
        { id: "AR-0707-2", dealId: "DL-260707-04", direction: "받을 돈", due: "2026-08-08", amount: "34,000.00", currency: "USD", overdue: false },
      ] : [],
    }
  },
}

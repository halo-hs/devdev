import { deals, type Deal } from "@trade-os/lib/prototype-deals"

export type CounterpartyAccess = {
  userId: string
  canReadOrganizationSettlement: boolean
}
type CurrencySummary = {
  currency: string
  receivable: string
  payable: string
  overdue: string
  trust: string
}
type Schedule = {
  id: string
  dealId: string
  direction: string
  due: string
  amount: string
  currency: string
  overdue: boolean
}
type Model = {
  name: string
  role: string
  mergedFrom?: string
  currencies: CurrencySummary[]
  trustCurrencies: CurrencySummary[]
  financeScope: "organization" | "assigned"
  deals: Deal[]
  schedules: Schedule[]
  partial: boolean
  asOf: string
}

export function counterpartyPreviewAccess(role = "owner"): CounterpartyAccess {
  return {
    userId: role,
    canReadOrganizationSettlement: role === "owner" || role === "admin",
  }
}
// This is the preview's assignment/collaboration response, not an authorization
// source for production. Live amounts and schedules must already be server-scoped.
const previewDealAccess: Record<
  string,
  { assigneeId: string; collaboratorIds: string[] }
> = {
  "DL-260707-04": { assigneeId: "owner", collaboratorIds: ["member"] },
  "DL-260708-01": { assigneeId: "owner", collaboratorIds: [] },
  "DL-260701-09": { assigneeId: "member", collaboratorIds: [] },
}
const acmeCurrencies: CurrencySummary[] = [
  {
    currency: "USD",
    receivable: "42,000.00",
    payable: "0.00",
    overdue: "8,000.00",
    trust: "B+ · 이력 12건",
  },
  {
    currency: "EUR",
    receivable: "12,800.00",
    payable: "2,400.00",
    overdue: "0.00",
    trust: "이력 부족 2건",
  },
  {
    currency: "JPY",
    receivable: "960,000",
    payable: "0",
    overdue: "0",
    trust: "이력 부족 1건",
  },
  {
    currency: "KRW",
    receivable: "1,200,000",
    payable: "0",
    overdue: "0",
    trust: "이력 부족 1건",
  },
]
// Finance evidence tied to a deal, so the member total and the schedule list
// use the same filtered source. Never reuse the company aggregate for members.
const previewSchedules: Schedule[] = [
  {
    id: "AR-0707-1",
    dealId: "DL-260707-04",
    direction: "받을 돈",
    due: "2026-07-28",
    amount: "8,000.00",
    currency: "USD",
    overdue: true,
  },
  {
    id: "AR-0707-2",
    dealId: "DL-260707-04",
    direction: "받을 돈",
    due: "2026-08-08",
    amount: "34,000.00",
    currency: "USD",
    overdue: false,
  },
]

// Public design fixture adapter. Server integration supplies scoped settlement,
// counterparties and document responses; no frontend role filter grants access.
export const counterpartyPreview = {
  async read(
    id: string,
    access: CounterpartyAccess = counterpartyPreviewAccess()
  ): Promise<Model | null> {
    const alias = id === "ACME Germany"
    const name = alias || id === "acme" ? "ACME GmbH" : id
    const related = deals.filter((deal) => deal.counterparty === name)
    if (!related.length) return null
    const scopedDeals = access.canReadOrganizationSettlement
      ? related
      : related.filter((deal) => {
          const grant = previewDealAccess[deal.id]
          return (
            grant?.assigneeId === access.userId ||
            grant?.collaboratorIds.includes(access.userId)
          )
        })
    const visibleIds = new Set(scopedDeals.map((deal) => deal.id))
    const schedules = previewSchedules.filter((row) =>
      visibleIds.has(row.dealId)
    )
    const acme = name === "ACME GmbH"
    const trustCurrencies = acme
      ? acmeCurrencies
      : [...new Set(related.map((deal) => deal.currency))].map((currency) => ({
          currency,
          receivable: "—",
          payable: "—",
          overdue: "—",
          trust: "이력 확인 필요",
        }))
    const currencies = access.canReadOrganizationSettlement
      ? trustCurrencies
      : [...new Set(scopedDeals.map((deal) => deal.currency))].map(
          (currency) => {
            const rows = schedules.filter((row) => row.currency === currency)
            // Missing evidence stays unknown; a returned zero remains a genuine zero.
            const sum = (predicate: (row: Schedule) => boolean) =>
              rows.length
                ? rows
                    .filter(predicate)
                    .reduce(
                      (total, row) =>
                        total + Number(row.amount.replaceAll(",", "")),
                      0
                    )
                    .toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                : "—"
            return {
              currency,
              receivable: sum((row) => row.direction === "받을 돈"),
              payable: sum((row) => row.direction === "지급할 돈"),
              overdue: sum((row) => row.overdue),
              trust: "",
            }
          }
        )
    return {
      name,
      role: acme
        ? "매출처"
        : name.startsWith("KATAMAN")
          ? "매입처"
          : "매입처·매출처",
      ...(alias ? { mergedFrom: id } : {}),
      asOf: "2026-07-31 09:00",
      partial: name.startsWith("KATAMAN"),
      deals: scopedDeals,
      financeScope: access.canReadOrganizationSettlement
        ? "organization"
        : "assigned",
      currencies,
      trustCurrencies,
      schedules,
    }
  },
}

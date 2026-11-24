export type DealInvoiceRelationState = {
  invoiceToBills: Record<string, string[]>
  invoiceFields: Record<string, Record<string, string>>
}

const storageKey = (dealId: string) => `ecoya-deal-document-relations-v1:${dealId}`

const emptyState = (): DealInvoiceRelationState => ({
  invoiceToBills: {},
  invoiceFields: {},
})

export function readDealInvoiceRelations(dealId: string): DealInvoiceRelationState {
  try {
    const raw = localStorage.getItem(storageKey(dealId))
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<DealInvoiceRelationState>
    const invoiceToBills = Object.fromEntries(
      Object.entries(parsed.invoiceToBills ?? {}).map(([invoiceId, billIds]) => [
        invoiceId,
        Array.isArray(billIds) ? billIds.filter((id): id is string => typeof id === "string") : [],
      ])
    )
    const invoiceFields = Object.fromEntries(
      Object.entries(parsed.invoiceFields ?? {}).map(([invoiceId, fields]) => [
        invoiceId,
        fields && typeof fields === "object"
          ? Object.fromEntries(
              Object.entries(fields).filter(([, value]) => typeof value === "string")
            )
          : {},
      ])
    )
    return { invoiceToBills, invoiceFields }
  } catch {
    return emptyState()
  }
}

function writeDealInvoiceRelations(dealId: string, state: DealInvoiceRelationState) {
  localStorage.setItem(storageKey(dealId), JSON.stringify(state))
}

export function linkDealInvoiceToBill(dealId: string, invoiceId: string, billId: string) {
  const state = readDealInvoiceRelations(dealId)
  const current = state.invoiceToBills[invoiceId] ?? []
  if (!current.includes(billId)) state.invoiceToBills[invoiceId] = [...current, billId]
  writeDealInvoiceRelations(dealId, state)
  return state
}

export function saveDealInvoiceField(
  dealId: string,
  invoiceId: string,
  field: string,
  value: string,
) {
  const state = readDealInvoiceRelations(dealId)
  state.invoiceFields[invoiceId] = {
    ...(state.invoiceFields[invoiceId] ?? {}),
    [field]: value,
  }
  writeDealInvoiceRelations(dealId, state)
  return state
}

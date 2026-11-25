export type DealInvoiceRelationState = {
  invoiceToBills: Record<string, string[]>
  invoiceFields: Record<string, Record<string, string>>
  /** Packing list document id → shipment keys it was linked to by hand. */
  packingToShipments: Record<string, string[]>
  /** Display label (B/L number) for shipment keys without a B/L document. */
  shipmentLabels: Record<string, string>
}

const storageKey = (dealId: string) => `ecoya-deal-document-relations-v1:${dealId}`

const emptyState = (): DealInvoiceRelationState => ({
  invoiceToBills: {},
  invoiceFields: {},
  packingToShipments: {},
  shipmentLabels: {},
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
    const idLists = (value: unknown) => Object.fromEntries(
      Object.entries(value && typeof value === "object" ? value : {}).map(([key, ids]) => [
        key,
        Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [],
      ])
    )
    const shipmentLabels = Object.fromEntries(
      Object.entries(parsed.shipmentLabels ?? {}).filter(([, label]) => typeof label === "string")
    )
    return { invoiceToBills, invoiceFields, packingToShipments: idLists(parsed.packingToShipments), shipmentLabels }
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

// Other cards on the deal page re-read relations when they change.
const notify = (dealId: string) => window.dispatchEvent(new CustomEvent("ecoya:deal-relations-changed", { detail: dealId }))

/** Links a CI to a shipment from the shipment side (key: B/L document id or `shipment:<id>`). */
export function linkDealInvoiceToShipment(dealId: string, invoiceId: string, shipmentKey: string, label?: string) {
  const state = readDealInvoiceRelations(dealId)
  const current = state.invoiceToBills[invoiceId] ?? []
  if (!current.includes(shipmentKey)) state.invoiceToBills[invoiceId] = [...current, shipmentKey]
  if (label) state.shipmentLabels[shipmentKey] = label
  writeDealInvoiceRelations(dealId, state)
  notify(dealId)
  return state
}

export function linkDealPackingListToShipment(dealId: string, packingListId: string, shipmentKey: string, label?: string) {
  const state = readDealInvoiceRelations(dealId)
  const current = state.packingToShipments[packingListId] ?? []
  if (!current.includes(shipmentKey)) state.packingToShipments[packingListId] = [...current, shipmentKey]
  if (label) state.shipmentLabels[shipmentKey] = label
  writeDealInvoiceRelations(dealId, state)
  notify(dealId)
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

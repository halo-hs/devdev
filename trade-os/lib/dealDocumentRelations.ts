export type DealInvoiceRelationState = {
  /** Missing key uses the document's original B/L; [] explicitly unlinks it. */
  invoiceToBills: Record<string, string[]>
  invoiceFields: Record<string, Record<string, string>>
  /** PL linkage overrides, with the same missing-key / [] semantics as CI. */
  packingToShipments: Record<string, string[]>
  /** Display label (B/L number) for shipment keys without a B/L document. */
  shipmentLabels: Record<string, string>
  /** CIs entered by hand (no document); their fields live in invoiceFields. */
  manualInvoices: string[]
  /** Packing lists entered by hand and per-document PL input drafts. */
  manualPackingLists: Record<string, ManualPackingList>
  /** Document CIs / packing lists taken out of this deal (the documents themselves stay). */
  removedDocuments: string[]
}

export type ManualContainer = {
  number: string
  containerType?: string | null
  sealNumber?: string | null
  packageCount?: string | null
  packageUnit?: string | null
  grossWeight?: string | null
  volume?: string | null
}
export type ManualPackingList = { number: string; containers: ManualContainer[] }

const storageKey = (dealId: string) => `ecoya-deal-document-relations-v1:${dealId}`

const emptyState = (): DealInvoiceRelationState => ({
  invoiceToBills: {},
  invoiceFields: {},
  packingToShipments: {},
  shipmentLabels: {},
  manualInvoices: [],
  manualPackingLists: {},
  removedDocuments: [],
})

export function readDealInvoiceRelations(dealId: string): DealInvoiceRelationState {
  try {
    const raw = localStorage.getItem(storageKey(dealId))
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<DealInvoiceRelationState>
    // Each CI and PL can point to one B/L. A B/L may still have many CI/PLs.
    const invoiceToBills = Object.fromEntries(
      Object.entries(parsed.invoiceToBills ?? {}).map(([invoiceId, billIds]) => [
        invoiceId,
        Array.isArray(billIds) ? billIds.filter((id): id is string => typeof id === "string").slice(0, 1) : [],
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
    const manualInvoices = Array.isArray(parsed.manualInvoices) ? parsed.manualInvoices.filter((id): id is string => typeof id === "string") : []
    const manualPackingLists = Object.fromEntries(
      Object.entries(parsed.manualPackingLists ?? {}).filter(([, list]) => list && typeof list === "object" && Array.isArray((list as ManualPackingList).containers))
    ) as Record<string, ManualPackingList>
    const removedDocuments = Array.isArray(parsed.removedDocuments) ? parsed.removedDocuments.filter((id): id is string => typeof id === "string") : []
    const packingToShipments = Object.fromEntries(Object.entries(idLists(parsed.packingToShipments)).map(([id, shipmentIds]) => [id, shipmentIds.slice(0, 1)]))
    return { invoiceToBills, invoiceFields, packingToShipments, shipmentLabels, manualInvoices, manualPackingLists, removedDocuments }
  } catch {
    return emptyState()
  }
}

function writeDealInvoiceRelations(dealId: string, state: DealInvoiceRelationState) {
  localStorage.setItem(storageKey(dealId), JSON.stringify(state))
}

export function linkDealInvoiceToBill(dealId: string, invoiceId: string, billId: string) {
  return linkDealInvoiceToShipment(dealId, invoiceId, billId)
}

// Other cards on the deal page re-read relations when they change.
const notify = (dealId: string) => window.dispatchEvent(new CustomEvent("ecoya:deal-relations-changed", { detail: dealId }))

/** Resolve one B/L consistently in document detail, shipment detail, and candidates. */
export const normalizeBlNumber = (value?: string | null) => value?.trim().replace(/\s+/g, "").toUpperCase() ?? ""

export function blNumbersMismatch(documentNumber?: string | null, linkedNumber?: string | null) {
  const expected = normalizeBlNumber(documentNumber)
  const actual = normalizeBlNumber(linkedNumber)
  return Boolean(expected && actual && expected !== actual)
}

export function resolveDealShipmentLink(
  links: Record<string, string[]>, documentId: string, originalShipmentKey?: string,
  referenceBlNumber?: string | null, bills: Array<{ documentId: string; blNumber: string | null }> = [],
) {
  // An explicit unlink must survive automatic matching and page reloads.
  if (Object.prototype.hasOwnProperty.call(links, documentId)) return links[documentId]?.[0]
  if (originalShipmentKey) return originalShipmentKey
  const number = normalizeBlNumber(referenceBlNumber)
  if (!number) return undefined
  const matches = bills.filter((bill) => normalizeBlNumber(bill.blNumber) === number)
  return matches.length === 1 ? matches[0].documentId : undefined
}

/** Keep the document and its inputs; an explicit empty override prevents the original link returning. */
export function unlinkDealDocumentFromShipment(dealId: string, code: "CI" | "PL", documentId: string) {
  const state = readDealInvoiceRelations(dealId)
  const links = code === "CI" ? state.invoiceToBills : state.packingToShipments
  links[documentId] = []
  writeDealInvoiceRelations(dealId, state)
  notify(dealId)
  return state
}

/** Links a CI to a shipment from the shipment side (key: B/L document id or `shipment:<id>`). */
export function linkDealInvoiceToShipment(dealId: string, invoiceId: string, shipmentKey: string, label?: string) {
  const state = readDealInvoiceRelations(dealId)
  state.invoiceToBills[invoiceId] = [shipmentKey]
  if (label) state.shipmentLabels[shipmentKey] = label
  writeDealInvoiceRelations(dealId, state)
  notify(dealId)
  return state
}

export function linkDealPackingListToShipment(dealId: string, packingListId: string, shipmentKey: string, label?: string) {
  const state = readDealInvoiceRelations(dealId)
  state.packingToShipments[packingListId] = [shipmentKey]
  if (label) state.shipmentLabels[shipmentKey] = label
  writeDealInvoiceRelations(dealId, state)
  notify(dealId)
  return state
}

/** Adds a CI row without a document, for information entered by hand. */
export function addDealManualInvoice(dealId: string) {
  const state = readDealInvoiceRelations(dealId)
  const id = `manual-ci-${Date.now().toString(36)}`
  state.manualInvoices = [...state.manualInvoices, id]
  writeDealInvoiceRelations(dealId, state)
  notify(dealId)
  return { state, id }
}

/** Adds a packing list without a document, with one empty container. */
export function addDealManualPackingList(dealId: string) {
  const state = readDealInvoiceRelations(dealId)
  const id = `manual-pl-${Date.now().toString(36)}`
  state.manualPackingLists = { ...state.manualPackingLists, [id]: { number: "", containers: [{ number: "", packageUnit: "bundles" }] } }
  writeDealInvoiceRelations(dealId, state)
  notify(dealId)
  return { state, id }
}

/** Takes a document CI or packing list out of this deal; the document itself stays. */
export function removeDealDocument(dealId: string, id: string) {
  const state = readDealInvoiceRelations(dealId)
  if (!state.removedDocuments.includes(id)) state.removedDocuments = [...state.removedDocuments, id]
  delete state.invoiceToBills[id]
  delete state.packingToShipments[id]
  writeDealInvoiceRelations(dealId, state)
  notify(dealId)
  return state
}

/** Removes a CI added by hand, with its fields and links. */
export function removeDealManualInvoice(dealId: string, id: string) {
  const state = readDealInvoiceRelations(dealId)
  state.manualInvoices = state.manualInvoices.filter((entry) => entry !== id)
  delete state.invoiceFields[id]
  delete state.invoiceToBills[id]
  writeDealInvoiceRelations(dealId, state)
  notify(dealId)
  return state
}

/** Removes a packing list added by hand, with its links. */
export function removeDealManualPackingList(dealId: string, id: string) {
  const state = readDealInvoiceRelations(dealId)
  const { [id]: _removed, ...rest } = state.manualPackingLists
  void _removed
  state.manualPackingLists = rest
  delete state.packingToShipments[id]
  writeDealInvoiceRelations(dealId, state)
  notify(dealId)
  return state
}

export function saveDealManualPackingList(dealId: string, id: string, list: ManualPackingList) {
  const state = readDealInvoiceRelations(dealId)
  state.manualPackingLists = { ...state.manualPackingLists, [id]: list }
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
  notify(dealId)
  return state
}

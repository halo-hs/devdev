import type { PackingItem } from "./packingItems"
export type DealInvoiceRelationState = {
  /** Missing key uses the document's original B/L; [] explicitly unlinks it. */
  invoiceToBills: Record<string, string[]>
  invoiceFields: Record<string, Record<string, string>>
  /** PL linkage overrides, with the same missing-key / [] semantics as CI. */
  packingToInvoices: Record<string, string[]>
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
export type ManualPackingList = { items?: PackingItem[]; number: string; containers: ManualContainer[] }

const storageKey = (dealId: string) => `ecoya-deal-document-relations-v1:${dealId}`

const emptyState = (): DealInvoiceRelationState => ({
  invoiceToBills: {},
  invoiceFields: {},
  packingToInvoices: {},
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
    // A CI is usually on one B/L but may span several (split shipment);
    // a packing list belongs to one B/L. Preserve previously saved links.
    const invoiceToBills = Object.fromEntries(
      Object.entries(parsed.invoiceToBills ?? {}).map(([invoiceId, billIds]) => [
        invoiceId,
        Array.isArray(billIds) ? [...new Set(billIds.filter((id): id is string => typeof id === "string"))] : [],
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
    return { invoiceToBills, invoiceFields, packingToInvoices: idLists(parsed.packingToInvoices), packingToShipments, shipmentLabels, manualInvoices, manualPackingLists, removedDocuments }
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

/**
 * B/L(s) a CI or packing list is linked to. Order: the user's explicit links
 * (including [] after an unlink, so automatic matching never re-adds it) →
 * the relation the document arrived with → automatic link by the B/L number
 * read from the document, only when it matches exactly one B/L of the deal.
 * In production the server applies the automatic link when the extracted B/L
 * number arrives; the prototype mirrors that rule here.
 */
export function resolveDealShipmentLinks(
  links: Record<string, string[]>, documentId: string, originalShipmentKeys: string[] = [],
): string[] {
  if (Object.prototype.hasOwnProperty.call(links, documentId)) return links[documentId] ?? []
  return originalShipmentKeys
}

/** Single-B/L form, for packing lists. */
export function resolveDealShipmentLink(
  links: Record<string, string[]>, documentId: string, originalShipmentKey?: string,
) {
  return resolveDealShipmentLinks(links, documentId, originalShipmentKey ? [originalShipmentKey] : [])[0]
}

type ShipmentUnlink =
  | { code: "CI"; documentId: string; shipmentKey: string; directKeys: string[]; viaPackingIds?: string[] }
  | { code: "PL"; documentId: string; invoiceId?: string }

/** Clear the selected B/L and retain the invoice of each affected packing list. */
export function unlinkDealDocumentFromShipment(dealId: string, link: ShipmentUnlink) {
  const state = readDealInvoiceRelations(dealId)
  if (link.code === "CI") {
    const current = state.invoiceToBills[link.documentId] ?? link.directKeys
    state.invoiceToBills[link.documentId] = current.filter(key => key !== link.shipmentKey)
    for (const packingId of link.viaPackingIds ?? []) {
      const owner = resolveDealShipmentLink(state.packingToInvoices, packingId, link.documentId)
      const bill = resolveDealShipmentLink(state.packingToShipments, packingId, link.shipmentKey)
      if (owner === link.documentId && bill === link.shipmentKey) {
        state.packingToInvoices[packingId] = [owner]
        state.packingToShipments[packingId] = []
      }
    }
  } else {
    if (link.invoiceId) state.packingToInvoices[link.documentId] = [link.invoiceId]
    state.packingToShipments[link.documentId] = []
  }
  writeDealInvoiceRelations(dealId, state)
  notify(dealId)
  return state
}

/**
 * Links a CI to a shipment (key: B/L document id or `shipment:<id>`), keeping
 * its current links (`currentKeys`): a CI may span several B/Ls.
 */
export function linkDealInvoiceToShipment(dealId: string, invoiceId: string, shipmentKey: string, label?: string, currentKeys: string[] = []) {
  const state = readDealInvoiceRelations(dealId)
  if (Object.entries(state.invoiceToBills).some(([id, keys]) => id !== invoiceId && keys.includes(shipmentKey))) return state
  state.invoiceToBills[invoiceId] = [...new Set([...(state.invoiceToBills[invoiceId] ?? currentKeys), shipmentKey])]
  if (label) state.shipmentLabels[shipmentKey] = label
  writeDealInvoiceRelations(dealId, state)
  notify(dealId)
  return state
}

export function linkDealPackingListToShipment(dealId: string, packingListId: string, shipmentKey: string, label?: string) {
  const state = readDealInvoiceRelations(dealId)
  if (Object.entries(state.packingToShipments).some(([id, keys]) => id !== packingListId && keys.includes(shipmentKey))) return state
  if (state.packingToShipments[packingListId]?.some(key => key !== shipmentKey)) return state
  state.packingToShipments[packingListId] = [shipmentKey]
  if (label) state.shipmentLabels[shipmentKey] = label
  writeDealInvoiceRelations(dealId, state)
  notify(dealId)
  return state
}

/** An explicit empty list keeps an unlinked PL from rejoining its first CI. */
export function setPackingInvoice(dealId: string, packingId: string, invoiceId: string | null) {
  const state = readDealInvoiceRelations(dealId)
  state.packingToInvoices[packingId] = invoiceId ? [invoiceId] : []
  writeDealInvoiceRelations(dealId, state)
  notify(dealId)
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
  state.manualPackingLists = { ...state.manualPackingLists, [id]: { ...state.manualPackingLists[id], ...list } }
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

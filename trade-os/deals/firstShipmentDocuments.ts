import { reviewedPackingItems } from "../lib/packingItems"
import type {
  SplitShipmentView,
  CommercialInvoiceCard,
  ShipmentDocumentLink,
} from "../shipments/ShipmentsConnected"
import type { DealDocumentRecord } from "../lib/dealDocumentActions"
import { listShipmentDocumentRegistrations } from "../lib/erpDocumentWorkflow"

type Registration = { code: "CI" | "BL" | "PL"; documentId: string }

// Process registrations in order. Later registrations never revoke an earlier
// link or become eligible just because another document was removed.
function firstDocumentPairs(registrations: Registration[]) {
  const seen = {
    CI: new Set<string>(),
    BL: new Set<string>(),
    PL: new Set<string>(),
  }
  const links = new Map<string, string>()
  const packingInvoices: Record<string, string> = {}
  for (const { code, documentId } of registrations) {
    seen[code].add(documentId)
    if (seen.PL.size === 1 && seen.CI.size === 1) {
      const [pl] = seen.PL
      const [ci] = seen.CI
      packingInvoices[pl] = ci
    }
    if (seen.BL.size === 1 && seen.PL.size === 1) {
      const [bill] = seen.BL
      const [pl] = seen.PL
      links.set(pl, bill)
    }
  }
  for (const [pl, invoice] of Object.entries(packingInvoices)) {
    const bill = links.get(pl)
    if (bill) links.set(invoice, bill)
  }
  return { links, packingInvoices }
}

export function firstShipmentLinks(registrations: Registration[]) {
  return firstDocumentPairs(registrations).links
}

export function dealShipmentDocuments(
  dealId: string,
  fixture: SplitShipmentView,
  documents: DealDocumentRecord[],
  openInvoice: (name: string, id: string) => void
): SplitShipmentView {
  const registrations: Registration[] = []
  const invoices: CommercialInvoiceCard[] = []
  const packing: ShipmentDocumentLink[] = []
  const bills = fixture.billsOfLading.map((bill) => {
    registrations.push({ code: "BL", documentId: bill.documentId })
    for (const ci of bill.connectedCommercialInvoices) {
      registrations.push({ code: "CI", documentId: ci.documentId })
      invoices.push(ci)
    }
    for (const pl of bill.connectedDocuments ?? []) {
      if (pl.code !== "PL") continue
      registrations.push({ code: "PL", documentId: pl.documentId })
      packing.push({ ...pl, containers: bill.containers })
    }
    return {
      ...bill,
      connectedCommercialInvoices: [] as CommercialInvoiceCard[],
      connectedDocuments: [] as ShipmentDocumentLink[],
    }
  })
  invoices.push(...fixture.unlinkedDocuments)
  for (const ci of fixture.unlinkedDocuments)
    registrations.push({ code: "CI", documentId: ci.documentId })
  for (const doc of documents) {
    if (doc.code !== "PL") continue
    // A built-in document slot and the fixture PL describe the same original.
    if (
      doc.originDealId === dealId &&
      packing.some((pl) => pl.fileName === doc.file)
    )
      continue
    packing.push({
      code: "PL",
      documentId: doc.id,
      fileName: doc.file,
      referenceBlNumber: doc.referenceBlNumber,
    })
    registrations.push({ code: "PL", documentId: doc.id })
  }

  for (const entry of listShipmentDocumentRegistrations(dealId)) {
    registrations.push(entry)
    if (!entry.active) continue
    const { documentId, code, fileName, registeredAt, fields } = entry
    const value = (key: string) => fields[key]?.value
    const measured = (key: string) =>
      value(key)?.trim() ? [value(key), fields[key]?.unit].filter(Boolean).join(" ") : ""
    const amountText = value("total_amount")?.trim()
    const documentMeasures = {
      quantity: measured("quantity"),
      grossWeight: measured("gross_weight"),
      unitPrice: measured("unit_price"),
      amount: amountText ? [fields.total_amount?.unit, amountText].filter(Boolean).join(" ") : undefined,
    }
    if (code === "BL") {
      const count = value("container_count")?.trim()
      bills.push({
        documentId,
        fileName,
        uploadedAt: registeredAt,
        blNumber: value("bl_number") || null,
        fields: {
          ...documentMeasures,
          vessel: value("vessel"),
          portOfDischarge: value("port"),
          containerNumber: value("container_number"),
          containerCount: count && /^\d+$/.test(count) ? Number(count) : undefined,
        },
        connectedDocuments: [],
        connectedCommercialInvoices: [],
      })
    } else if (code === "CI") {
      const amount = value("total_amount")?.replaceAll(",", "")
      invoices.push({
        documentId,
        fileName,
        uploadedAt: registeredAt,
        invoiceNumber: value("invoice_number"),
        invoiceDate: value("invoice_date"),
        item: value("item_name"),
        hsCode: value("hs_code"),
        grossWeight: documentMeasures.grossWeight,
        referenceBlNumber: value("bl_number"),
        quantity: measured("quantity"),
        unitPrice: measured("unit_price"),
        currency: fields.total_amount?.unit,
        totalAmount:
          amount && Number.isFinite(Number(amount)) ? Number(amount) : null,
        onOpen: () => openInvoice(fileName, documentId),
      })
    } else {
      packing.push({
        code,
        documentId,
        fileName,
        number: value("packing_number"),
        ...documentMeasures,
        items: reviewedPackingItems(fields),
        referenceBlNumber: value("bl_number"),
      })
    }
  }

  const { links, packingInvoices } = firstDocumentPairs(registrations)
  const byId = new Map(bills.map((bill) => [bill.documentId, bill]))
  const owner = (id: string) => byId.get(links.get(id) ?? "")
  for (const ci of invoices) {
    const bill = owner(ci.documentId)
    if (!bill) continue
    bill.connectedCommercialInvoices.push(ci)
    bill.connectedDocuments.push({
      documentId: ci.documentId,
      fileName: ci.fileName,
      number: ci.invoiceNumber,
      code: "CI",
    })
  }
  for (const pl of packing) owner(pl.documentId)?.connectedDocuments.push(pl)
  return {
    firstPackingInvoices: packingInvoices,
    billsOfLading: bills,
    unlinkedDocuments: invoices.filter((ci) => !owner(ci.documentId)),
    unlinkedPackingLists: packing.filter((pl) => !owner(pl.documentId)),
  }
}

import type { SplitShipmentView } from "../../shipments/ShipmentsConnected"

export const splitShipmentReviewFixture = (dealId: string, onOpenDocument?: (fileName: string, invoiceId: string) => void): SplitShipmentView => {
  const shipmentCount = dealId === "DL-260708-01" ? 3 : dealId === "DL-260707-04" ? 2 : 3
  const billsOfLading: SplitShipmentView["billsOfLading"] = [
    {
      documentId: "bl-014w-02",
      blNumber: "HMM-014W-2607",
      fileName: "B/L_2607_014.pdf",
      uploadedAt: "2026.11.18 14:20",
      pageCount: 2,
      fieldPages: { bl_number: 1, pol: 1, pod: 1, carrier: 1, vessel: 1 },
      fields: { portOfLoading: "Melbourne", portOfDischarge: "Busan", carrier: "HMM", vessel: "HMM Green", voyageNo: "014W", shippedOnBoardDate: "2026.11.20", containerNumber: "HMMU1234567", containerCount: 2, sealNumber: "SEAL-01402", packageCount: "12", packageType: "bundles", goods: "Aluminium Scrap", grossWeight: "16,480 KG", volume: "32.4 CBM" },
      containers: [
        { number: "HMMU1234567", containerType: "40HC", sealNumber: "SEAL-01402-A", packageCount: "6", packageUnit: "bundles", grossWeight: "8,240 KG", volume: "16.2 CBM" },
        { number: "HMMU1234568", containerType: "40HC", sealNumber: "SEAL-01402-B", packageCount: "6", packageUnit: "bundles", grossWeight: "8,240 KG", volume: "16.2 CBM" },
      ],
      connectedDocuments: [
        { documentId: "ci-0703", referenceBlNumber: "HMM-014W-2607", code: "CI", number: "CI-2026-0703", fileName: "Invoice_HB-2607-003.pdf" },
        { documentId: "pl-0707", referenceBlNumber: "HMM-014W-2607", code: "PL", items: [{ name: "Aluminium Scrap Tough Taboo", hsCode: "7602.00" }], number: "PL-2026-0707", fileName: "PackingList_0707.pdf" },
      ],
      connectedCommercialInvoices: [
        { documentId: "ci-0703", referenceBlNumber: "HMM-014W-2607", fileName: "Invoice_HB-2607-003.pdf", uploadedAt: "2026.11.18 14:22", invoiceNumber: "CI-2026-0703", invoiceDate: "2026.11.17", currency: "USD", totalAmount: 1539996, item: "Aluminium Scrap Tough Taboo", quantity: "12 MT", unitPrice: "128,333 USD/MT", packageCount: "12", packageUnit: "bundles", pageCount: 2, fieldPages: { "수량": 2, "포장 수 / 단위": 2 }, onOpen: () => onOpenDocument?.("Invoice_HB-2607-003.pdf", "ci-0703") },
      ],
    },
    {
      documentId: "bl-015w-03",
      blNumber: "HMM-015W-2607",
      fileName: "B/L_2607_015.pdf",
      uploadedAt: "2026.11.19 09:10",
      pageCount: 2,
      fieldPages: { bl_number: 1, pol: 1, pod: 1, carrier: 1, vessel: 1 },
      fields: { portOfLoading: "Melbourne", portOfDischarge: "Busan", carrier: "HMM", vessel: "HMM Green", voyageNo: "015W", shippedOnBoardDate: "2026.11.27", containerNumber: "HMMU7654321", containerCount: 1, sealNumber: "SEAL-01503", packageCount: "6", packageType: "bundles", goods: "Aluminium Scrap", grossWeight: "8,200 KG", volume: "16.1 CBM" },
      containers: [{ number: "HMMU7654321", containerType: "40HC", sealNumber: "SEAL-01503", packageCount: "6", packageUnit: "bundles", grossWeight: "8,200 KG", volume: "16.1 CBM" }],
      connectedDocuments: [
        { documentId: "ci-0712", referenceBlNumber: "HMM-015W-2607", code: "CI", number: "CI-2026-0712", fileName: "Invoice_HB-2607-012.pdf" },
        { documentId: "pl-0708", referenceBlNumber: "HMM-015W-2607", code: "PL", items: [{ name: "Aluminium Scrap Taint Tabor", hsCode: "7602.00" }], number: "PL-2026-0708", fileName: "PackingList_0708.pdf" },
      ],
      connectedCommercialInvoices: [{ documentId: "ci-0712", referenceBlNumber: "HMM-015W-2607", fileName: "Invoice_HB-2607-012.pdf", uploadedAt: "2026.11.19 09:12", invoiceNumber: "CI-2026-0712", invoiceDate: "2026.11.18", currency: "USD", totalAmount: 770000, item: "Aluminium Scrap", quantity: "6 MT", unitPrice: "128,333 USD/MT", packageCount: "6", packageUnit: "bundles", onOpen: () => onOpenDocument?.("Invoice_HB-2607-012.pdf", "ci-0712") }],
    },
    {
      documentId: "bl-016w-04",
      blNumber: "HMM-016W-2607",
      fileName: "B/L_2607_016.pdf",
      uploadedAt: "2026.11.20 10:05",
      pageCount: 2,
      fieldPages: { bl_number: 1, pol: 1, pod: 1, carrier: 1, vessel: 1 },
      fields: { portOfLoading: "Melbourne", portOfDischarge: "Busan", carrier: "HMM", vessel: "HMM Green", voyageNo: "016W", shippedOnBoardDate: "2026.12.03", containerNumber: "HMMU9876543", containerCount: 2, sealNumber: "SEAL-01604", packageCount: "8", packageType: "bundles", goods: "Aluminium Scrap", grossWeight: "10,400 KG", volume: "20.2 CBM" },
      containers: [
        { number: "HMMU9876543", containerType: "40GP", sealNumber: "SEAL-01604-A", packageCount: "4", packageUnit: "bundles", grossWeight: "5,200 KG", volume: "10.1 CBM" },
        { number: "HMMU9876544", containerType: "40GP", sealNumber: "SEAL-01604-B", packageCount: "4", packageUnit: "bundles", grossWeight: "5,200 KG", volume: "10.1 CBM" },
      ],
      connectedDocuments: [
        { documentId: "ci-0715", referenceBlNumber: "HMM-016W-2607", code: "CI", number: "CI-2026-0715", fileName: "Invoice_HB-2607-015.pdf" },
        { documentId: "pl-0709", referenceBlNumber: "HMM-016W-2607", code: "PL", items: [{ name: "Aluminium Scrap", hsCode: "7602.00" }], number: "PL-2026-0709", fileName: "PackingList_0709.pdf" },
      ],
      connectedCommercialInvoices: [{ documentId: "ci-0715", referenceBlNumber: "HMM-016W-2607", fileName: "Invoice_HB-2607-015.pdf", uploadedAt: "2026.11.20 10:07", invoiceNumber: "CI-2026-0715", invoiceDate: "2026.11.19", currency: "USD", totalAmount: 1026400, item: "Aluminium Scrap", quantity: "8 MT", unitPrice: "128,300 USD/MT", packageCount: "8", packageUnit: "bundles", onOpen: () => onOpenDocument?.("Invoice_HB-2607-015.pdf", "ci-0715") }],
    },
  ]
  return {
    billsOfLading: billsOfLading.slice(0, shipmentCount),
    unlinkedDocuments: [{ documentId: "ci-unlinked-01", referenceBlNumber: "HMM-017W-2607", fileName: "Invoice_awaiting_bl.pdf", uploadedAt: "2026.11.19 09:18", invoiceNumber: "CI-2026-0718", invoiceDate: "2026.11.19", currency: "USD", totalAmount: 256600, item: "Aluminium Scrap", quantity: "2 MT", unitPrice: "128,300 USD/MT", packageCount: "2", packageUnit: "bundles", onOpen: () => onOpenDocument?.("Invoice_awaiting_bl.pdf", "ci-unlinked-01") }],
  }
}

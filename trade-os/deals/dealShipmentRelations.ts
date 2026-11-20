export type DealShipmentContainerLink = {
  containerNumber: string
  quantity: string
}

export type DealShipmentLink = {
  shipmentNumber: string
  blNumber: string
  quantity: string
  ciNumbers: string[]
  containers: DealShipmentContainerLink[]
}

export type DealItemShipmentRelation = {
  itemId: number
  goods: string
  links: DealShipmentLink[]
}

const defaultRelations: DealItemShipmentRelation[] = [
  {
    itemId: 1,
    goods: "Aluminium Scrap Tough Taboo",
    links: [{ shipmentNumber: "SHIP-014W", blNumber: "HMM-014W-2607", quantity: "12 MT", ciNumbers: ["CI-2026-0703"], containers: [{ containerNumber: "HMMU1234567", quantity: "8 MT" }, { containerNumber: "HMMU7654321", quantity: "4 MT" }] }],
  },
  {
    itemId: 2,
    goods: "Aluminium Scrap Taint Tabor",
    links: [{ shipmentNumber: "SHIP-015W", blNumber: "HMM-015W-2607", quantity: "8 MT", ciNumbers: ["CI-2026-0712"], containers: [{ containerNumber: "HMMU7654321", quantity: "8 MT" }] }],
  },
]

export function getDealItemShipmentRelations(_dealId: string): DealItemShipmentRelation[] {
  return defaultRelations.map((relation) => ({
    ...relation,
    links: relation.links.map((link) => ({
      ...link,
      ciNumbers: [...link.ciNumbers],
      containers: link.containers.map((container) => ({ ...container })),
    })),
  }))
}

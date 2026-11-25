import type { ReviewedField } from "./erpDocumentWorkflow"

export type PackingItem = { name: string; hsCode: string }

export function reviewedPackingItems(fields: Record<string, ReviewedField>): PackingItem[] {
  const positions = new Set([1])
  for (const key of Object.keys(fields)) {
    const match = /^(?:item_name|hs_code):(\d+)$/.exec(key)
    if (match && Number(match[1]) > 1) positions.add(Number(match[1]))
  }
  return [...positions].sort((a, b) => a - b).map(position => {
    const suffix = position === 1 ? "" : ":" + position
    return { name: fields["item_name" + suffix]?.value ?? "", hsCode: fields["hs_code" + suffix]?.value ?? "" }
  })
}

export function packingItemIssue(item: PackingItem, references: Array<PackingItem & { source: string }>) {
  if (!item.name.trim() && !item.hsCode.trim()) return "품목명·HS 코드 누락"
  if (!item.name.trim()) return "품목명 누락"
  if (!item.hsCode.trim()) return "HS 코드 누락"
  const name = (text: string) => text.trim().replace(/\s+/g, " ").toLowerCase()
  const code = (text: string) => text.replace(/[.\s-]/g, "")
  const differences = references.filter(ref => name(ref.name) === name(item.name) && ref.hsCode.trim() && code(ref.hsCode) !== code(item.hsCode))
  return differences.length ? "HS 코드 불일치 · " + [...new Set(differences.map(ref => ref.source + " " + ref.hsCode))].join(" · ") : ""
}

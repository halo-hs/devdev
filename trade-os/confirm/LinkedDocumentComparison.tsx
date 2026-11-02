import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { dealDocumentPreviews, listDealDocuments, type DealDocumentRecord } from "@trade-os/lib/dealDocumentActions"
import { readDocumentReview } from "@trade-os/lib/erpDocumentWorkflow"
import { deals } from "@trade-os/lib/prototypeDeals"

const documentTypes = [
  ["PO", "발주서"], ["CI", "상업송장"], ["PL", "포장명세서"],
  ["BL", "선하증권"], ["BANK_STATEMENT", "은행거래내역서"], ["IMPORT_DECLARATION", "수입신고필증"],
] as const
const comparisonFields = [
  { label: "거래처", keys: ["counterparty", "seller", "buyer"], preview: ["Seller", "Buyer"] },
  { label: "금액", keys: ["total_amount", "amount"], preview: ["Amount"] },
  { label: "수량", keys: ["quantity"], preview: ["Quantity"] },
  { label: "총중량", keys: ["gross_weight"], preview: ["Gross Weight"] },
  { label: "인코텀즈", keys: ["incoterms"], preview: ["Incoterms"] },
  { label: "수입신고번호", keys: ["customs_declaration"], preview: ["Customs Declaration"] },
]

function documentValue(record: DealDocumentRecord | null, field: typeof comparisonFields[number]) {
  if (!record || record.state === "processing" || record.state === "needs_type") return ""
  const review = readDocumentReview(record.erpDocumentId)
  const key = field.keys.find(key => review.fields[key] !== undefined)
  if (key) {
    const value = review.fields[key]
    if (!value.value.trim()) return ""
    const unit = value.unit || (field.label === "금액" ? review.fields.currency?.value : "")
    const role = key === "seller" ? "판매자: " : key === "buyer" ? "구매자: " : ""
    return `${role}${value.value}${unit ? ` ${unit}` : ""}`
  }
  // Only original demo records have preview values. Never invent values for uploaded/reclassified records.
  if (record.revision !== 1 || record.id !== `demo-trade-doc:${record.originDealId}:${record.originCode}` || record.code !== record.originCode) return ""
  const values = dealDocumentPreviews[record.code]?.fields ?? []
  const value = field.preview.map(label => values.find(([name]) => name === label)).find(Boolean)
  if (!value) return ""
  const role = value[0] === "Seller" ? "판매자: " : value[0] === "Buyer" ? "구매자: " : ""
  return `${role}${value[1]}`
}

export function LinkedDocumentComparison({ dealId, connected = false }: { dealId: string; connected?: boolean }) {
  const load = () => {
    try {
      const records = listDealDocuments(dealId, true)
        // The adapter seeds demo documents for every ID; new transactions must remain empty.
        .filter(record => deals.some(deal => deal.id === dealId) || record.id !== `demo-trade-doc:${dealId}:${record.code}`)
      const columns = documentTypes.flatMap<{ code: string; label: string; record: DealDocumentRecord | null }>(([code, label]) => {
        const linked = records.filter(record => record.code === code)
        return linked.length ? linked.map(record => ({ code, label, record })) : [{ code, label, record: null }]
      })
      return { columns, rows: comparisonFields.map(field => ({ label: field.label, values: columns.map(column => documentValue(column.record, field)) })), error: false }
    } catch {
      return { columns: [], rows: [], error: true }
    }
  }
  const [data, setData] = useState(load)
  return (
    <section aria-label="연결된 서류 대조표" className="mt-4 w-full min-w-0 border-t pt-4 [contain:inline-size]">
      <h3 className="text-sm font-semibold">서류 대조표</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {dealId} 거래에 이미 연결된 서류를 비교합니다.{!connected ? " 현재 업로드 문서는 연결 전에는 포함되지 않습니다." : ""}
      </p>
      {data.error ? (
        <Alert className="mt-3">
          <AlertDescription>서류 대조표를 불러오지 못했습니다.</AlertDescription>
          <Button type="button" variant="outline" size="sm" onClick={() => setData(load())}>다시 불러오기</Button>
        </Alert>
      ) : (
        <div className="mt-3 min-w-0">
          <Table aria-label="선택한 거래의 연결 서류 대조">
            <TableHeader><TableRow>
              <TableHead scope="col">항목</TableHead>
              {data.columns.map(column => <TableHead scope="col" key={column.record?.id ?? column.code} className="min-w-36">
                {column.label}
                <span className="block text-xs font-normal text-muted-foreground">{column.record?.file ?? "연결된 서류 없음"}</span>
              </TableHead>)}
              <TableHead scope="col">상태</TableHead>
            </TableRow></TableHeader>
            <TableBody>{data.rows.map(row => <TableRow key={row.label}>
              <TableHead scope="row" className="whitespace-nowrap">{row.label}</TableHead>
              {row.values.map((value, index) => <TableCell key={data.columns[index].record?.id ?? data.columns[index].code} className="whitespace-normal">{value || "—"}</TableCell>)}
              <TableCell className="whitespace-nowrap">{row.values.filter(Boolean).length < 2 ? "대조 불가" : "확인 필요"}</TableCell>
            </TableRow>)}</TableBody>
          </Table>
          <p className="mt-2 text-xs text-muted-foreground">값이 없는 항목은 —로 표시합니다. 거래처의 역할, 통화·수량 기준을 확인해 주세요.</p>
        </div>
      )}
    </section>
  )
}

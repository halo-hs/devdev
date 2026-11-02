import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { DealDocumentComparisonTable, type ComparisonDocument } from "@trade-os/components/DealDocumentComparisonDialog"
import { importantDealDocuments, listDealDocuments } from "@trade-os/lib/dealDocumentActions"

// Same linked document slots and comparison dialog as the transaction detail.
// Selecting a candidate only reads its documents; it never connects the current upload.
export function LinkedDocumentComparison({ dealId, connected = false }: { dealId: string; connected?: boolean }) {
  const load = (): { documents: ComparisonDocument[]; failed: boolean } => {
    try {
      const records = listDealDocuments(dealId, true)
      const documents = importantDealDocuments.map(slot => {
        if (slot.source === "발행") return slot
        const record = records.find(record => record.originDealId === dealId && record.originCode === slot.code)
        return record ? {
          code: record.code, type: record.type, file: record.file, documentId: record.id,
          status: record.state === "processing" ? "분석 중" : record.state === "needs_type" ? "유형 확인 필요" : record.state === "needs_review" ? "검토" : "보유",
        } : { ...slot, file: "", status: "미비" }
      })
      return { documents, failed: false }
    } catch {
      return { documents: [], failed: true }
    }
  }
  const [data, setData] = useState(load)
  return (
    <section aria-label="연결된 서류 대조표" className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">서류 대조 (5-Way Match)</h3>
        <p className="text-xs text-muted-foreground">{dealId} 거래에 연결된 서류를 대조합니다.{!connected ? " 현재 문서는 거래 연결 전이므로 포함되지 않습니다." : ""}</p>
      </div>
      <div className="min-w-0">
        {data.failed ? <Alert><AlertDescription>서류 대조표를 불러오지 못했습니다.</AlertDescription><Button variant="outline" size="sm" onClick={() => setData(load())}>다시 불러오기</Button></Alert>
          : <DealDocumentComparisonTable documents={data.documents} />}
      </div>
    </section>
  )
}

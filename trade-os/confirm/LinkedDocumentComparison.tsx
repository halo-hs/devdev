import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { DealDocumentComparisonDialog, type ComparisonDocument } from "@trade-os/components/DealDocumentComparisonDialog"
import { importantDealDocuments, listDealDocuments } from "@trade-os/lib/dealDocumentActions"

// Same linked document slots and comparison dialog as the transaction detail.
// Selecting a candidate only reads its documents; it never connects the current upload.
export function LinkedDocumentComparison({ dealId, connected = false }: { dealId: string; connected?: boolean }) {
  const [open, setOpen] = useState(false)
  const [documents, setDocuments] = useState<ComparisonDocument[]>([])
  const [failed, setFailed] = useState(false)
  const showComparison = () => {
    try {
      const records = listDealDocuments(dealId, true)
      setDocuments(importantDealDocuments.map(slot => {
        if (slot.source === "발행") return slot
        const record = records.find(record => record.originDealId === dealId && record.originCode === slot.code)
        return record ? {
          code: record.code, type: record.type, file: record.file, documentId: record.id,
          status: record.state === "processing" ? "분석 중" : record.state === "needs_type" ? "유형 확인 필요" : record.state === "needs_review" ? "검토" : "보유",
        } : { ...slot, file: "", status: "미비" }
      }))
      setFailed(false)
      setOpen(true)
    } catch {
      setFailed(true)
    }
  }
  return (
    <div className="mt-3">
      <Button variant="outline" size="sm" onClick={showComparison}>서류 대조 보기</Button>
      {failed ? <Alert className="mt-3"><AlertDescription>서류 대조표를 불러오지 못했습니다. 다시 눌러 시도해 주세요.</AlertDescription></Alert> : null}
      <DealDocumentComparisonDialog open={open} onOpenChange={setOpen} documents={documents}
        description={`${dealId} 거래에 연결된 서류를 대조합니다.${connected ? "" : " 현재 문서는 거래 연결 전이므로 포함되지 않습니다."}`} />
    </div>
  )
}

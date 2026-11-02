import type { DocumentSourceDeal } from "@/App"
import { documentSourceDeals } from "@trade-os/documents/documentTemplateModel"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DealDocumentComparisonDialog, type ComparisonDocument } from "@trade-os/components/DealDocumentComparisonDialog"
import { importantDealDocuments, listDealDocuments } from "@trade-os/lib/dealDocumentActions"

// Same linked document slots and comparison dialog as the transaction detail.
// Selecting a candidate only reads its documents; it never connects the current upload.
export function LinkedDocumentComparison({ dealId, connected = false, candidate }: { dealId: string; connected?: boolean; candidate?: DocumentSourceDeal }) {
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
      // Preview fixtures: match the candidate's party, currency, amount and quantity.
      // Missing documents remain missing; these values are not extracted production data.
      const deal = candidate ?? documentSourceDeals.find(deal => deal.id === dealId)
      const terms: Record<string, [string, string, string]> = {
        "DL-260708-08": ["20,400 KG", "CIF Hamburg", "T/T 30일"],
        "DL-260708-01": ["20,200 KG", "CIF Busan", "L/C at sight"],
        "DL-260707-04": ["", "", "T/T 선불"],
        "DL-260704-02": ["12,600 KG", "DAP Busan", "T/T 60일"],
        "DL-260701-09": ["", "", "월말 정산"],
        "DL-260629-03": ["18,300 KG", "FOB Singapore", "T/T 30% / 70%"],
        "DL-260625-07": ["", "", "운송 완료 후 지급"],
      }
      const [weight, incoterms, payment] = terms[dealId] ?? ["", "", ""]
      return { documents: documents.map<ComparisonDocument>(document => ({ ...document, comparisonValues: deal ? {
        seller: deal.party,
        amount: ["PO", "SC", "CI"].includes(document.code) ? `${deal.amount} ${deal.currency}` : "",
        quantity: deal.item.split(" · ")[1] ?? "",
        gross_weight: weight, incoterms, payment: ["PO", "SC", "CI"].includes(document.code) ? payment : "",
      } : {} })), failed: false }
    } catch {
      return { documents: [], failed: true }
    }
  }
  const [open, setOpen] = useState(false)
  const [documents, setDocuments] = useState<ComparisonDocument[]>([])
  const showComparison = () => {
    const data = load()
    if (data.failed) {
      toast.error("서류 대조표를 불러오지 못했습니다. 다시 시도해 주세요.")
      return
    }
    setDocuments(data.documents)
    setOpen(true)
  }
  return (
    <>
      <Button type="button" variant="outline" size="sm" aria-label={`${dealId} 서류 대조 보기`} onClick={showComparison}>서류 대조 보기</Button>
      <DealDocumentComparisonDialog open={open} onOpenChange={setOpen} documents={documents}
        description={`${dealId} 거래에 연결된 서류를 대조합니다.${connected ? "" : " 현재 문서는 이 거래에 연결되기 전이므로 포함되지 않습니다."}`} />
    </>
  )
}

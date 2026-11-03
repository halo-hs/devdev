import type { RecentDocument } from "@/App"
import { dealDocumentReviewUrl, type DealDocumentRecord } from "./dealDocumentActions"
import { readDocumentReview, type ReviewedField } from "./erpDocumentWorkflow"
import { getDocumentConnection } from "./documentDealConnection"

export const customsDocumentCodes = new Set(["INS", "CUSTOMS_ENTRY", "CUSTOMS_DECLARATION"])
export type CustomsDocument = {
  id: string
  name: string
  type: string
  status: "confirmed" | "review" | "processing" | "failed"
  fields: Record<string, ReviewedField>
  reviewUrl: string
}

/** Same local preview stores as the upload and Deal document workspaces. No synthetic data. */
export function listCustomsDocuments(dealId: string, records: DealDocumentRecord[]): CustomsDocument[] {
  const result: CustomsDocument[] = records.filter(record => customsDocumentCodes.has(record.code)).map(record => ({
    id: record.id,
    name: record.file,
    type: record.type,
    status: record.state === "ready" ? "confirmed" : record.state === "processing" ? "processing" : "review",
    fields: record.reviewedFields ?? readDocumentReview(`${record.id}:${record.revision}`).fields,
    reviewUrl: dealDocumentReviewUrl(record),
  }))
  const queue: RecentDocument[] = JSON.parse(localStorage.getItem("ecoya-prototype-upload-queue-v2") ?? "[]")
  const links = JSON.parse(localStorage.getItem("ecoya-prototype-upload-document-deal-links") ?? "{}")
  if (!Array.isArray(queue) || !links || typeof links !== "object") throw new Error("통관 문서를 불러오지 못했습니다.")
  for (const document of queue) {
    if (!customsDocumentCodes.has(document.documentType) || ["excluded", "duplicate"].includes(document.stage)) continue
    if (document.dealDocumentId && result.some(record => record.id === document.dealDocumentId)) continue
    const connection = getDocumentConnection(document.name, links[document.name])
    if (connection.link?.dealId !== dealId) continue
    result.push({
      id: document.name,
      name: document.name,
      type: document.documentType === "CUSTOMS_DECLARATION" ? "관세신고서" : "수입신고필증",
      status: connection.status === "committed" ? "confirmed" : document.stage === "failed" ? "failed" : ["ocr", "queued"].includes(document.stage) ? "processing" : "review",
      fields: { ...document.reviewedFields, ...connection.fields },
      reviewUrl: `/erp/documents/upload/${encodeURIComponent(document.name)}/review?fromDeal=${encodeURIComponent(dealId)}`,
    })
  }
  return result
}

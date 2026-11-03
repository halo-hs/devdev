import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useDealRefresh } from "./useDealRefresh"
import { useLocaleTag } from "@trade-os/lib/i18n/useLocaleTag"
import { formatDate } from "@trade-os/lib/orgDate"
import { formatMoney } from "@trade-os/lib/money"
import type { CustomsDocument } from "@trade-os/lib/dealCustomsDocuments"

const labels = { confirmed: "확정", review: "검토 필요", processing: "분석 중", failed: "처리 실패" }
function CustomsAmount({ document, field }: { document: CustomsDocument; field: "customs_duty" | "vat" }) {
  const amount = document.fields[field]
  if (!amount?.value.trim()) return <span className="text-muted-foreground">—</span>
  const currency = (amount.unit || document.fields.currency?.value || "").trim().toUpperCase()
  return <span className="tabular-nums whitespace-nowrap">
    {formatMoney(amount.value, /^[A-Z]{3}$/.test(currency) ? currency : undefined)}
    {(!currency || !/^[A-Z]{3}$/.test(currency)) && <span className="mt-1 block text-xs text-warning-foreground">통화 확인 필요</span>}
  </span>
}

export function DealCustomsDocuments({ canWrite, onUpload }: { canWrite: boolean; onUpload: () => void }) {
  const refresh = useDealRefresh()
  const dateTag = useLocaleTag()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const documents = refresh.data?.customsDocuments ?? []
  const selected = documents.find(document => document.id === selectedId && document.status === "confirmed")
  return <>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-base font-semibold">통관 문서{refresh.data && <span className="ml-2 text-sm font-normal text-muted-foreground">{documents.length}건</span>}</h2>
      {canWrite && <Button size="sm" variant="outline" onClick={onUpload}><Plus data-icon="inline-start" />문서 올리기</Button>}
    </div>
    {(refresh.data?.customsError || (!refresh.data && refresh.failure)) ? <div role="alert" className="py-6 text-sm">통관 문서를 불러오지 못했습니다. <Button size="sm" variant="link" onClick={() => void refresh.refresh()}>다시 시도</Button></div>
      : !refresh.data ? <Skeleton className="mt-4 h-28 w-full" />
      : !documents.length ? <Empty className="min-h-28"><EmptyHeader><EmptyTitle>연결된 통관 문서가 없습니다.</EmptyTitle><EmptyDescription>수입신고필증을 연결하면 신고 정보와 관세·부가세를 확인할 수 있습니다.</EmptyDescription></EmptyHeader></Empty>
      : <div className="mt-4 [&>[data-slot=table-container]]:rounded-none [&>[data-slot=table-container]]:border-0 [&>[data-slot=table-container]]:shadow-none">
        <Table className="min-w-[720px]" aria-label="통관 문서별 신고 정보">
          <TableHeader><TableRow><TableHead>문서 / 신고번호</TableHead><TableHead>통관일</TableHead><TableHead>관세</TableHead><TableHead>부가세</TableHead><TableHead>상태</TableHead><TableHead className="w-28 text-center">작업</TableHead></TableRow></TableHeader>
          <TableBody>{documents.map(document => <TableRow key={document.id}>
            <TableCell className="max-w-64 py-3 whitespace-normal"><div className="text-sm">{document.type}</div><div className="mt-1 break-all text-xs text-muted-foreground">{document.fields.customs_number?.value || document.name}</div></TableCell>
            <TableCell>{document.fields.clearance_date?.value ? formatDate(document.fields.clearance_date.value, dateTag) : "—"}</TableCell>
            <TableCell><CustomsAmount document={document} field="customs_duty" /></TableCell>
            <TableCell><CustomsAmount document={document} field="vat" /></TableCell>
            <TableCell><Badge variant={document.status === "confirmed" ? "secondary" : "outline"}>{labels[document.status]}</Badge></TableCell>
            <TableCell className="text-center">{document.status === "confirmed" ? <Button size="sm" variant="outline" onClick={() => setSelectedId(document.id)}>데이터 보기</Button>
              : document.status === "review" && canWrite ? <Button size="sm" variant="outline" asChild><a href={document.reviewUrl}>문서 검토</a></Button>
              : document.status === "failed" && canWrite ? <Button size="sm" variant="outline" onClick={onUpload}>재업로드</Button> : <span className="text-muted-foreground">—</span>}</TableCell>
          </TableRow>)}</TableBody>
        </Table>
        <p className="mt-3 text-xs text-muted-foreground">수입신고필증은 확정 후 원본을 보관하지 않습니다. 확정 데이터만 표시합니다.</p>
      </div>}
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelectedId(null) }}>
      <DialogContent><DialogHeader><DialogTitle>{selected?.type} · 확정 데이터</DialogTitle><DialogDescription>수입신고필증은 보안 정책에 따라 원본 대신 확정 데이터를 보관합니다.</DialogDescription></DialogHeader>
        {selected && <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">{[["신고번호", selected.fields.customs_number?.value], ["품목", selected.fields.item_name?.value], ["통관일", selected.fields.clearance_date?.value ? formatDate(selected.fields.clearance_date.value, dateTag) : ""], ["문서 상태", "확정"]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm">{value || "—"}</dd></div>)}<div><dt className="text-xs text-muted-foreground">관세</dt><dd className="mt-1 text-sm"><CustomsAmount document={selected} field="customs_duty" /></dd></div><div><dt className="text-xs text-muted-foreground">부가세</dt><dd className="mt-1 text-sm"><CustomsAmount document={selected} field="vat" /></dd></div></dl>}
      </DialogContent>
    </Dialog>
  </>
}

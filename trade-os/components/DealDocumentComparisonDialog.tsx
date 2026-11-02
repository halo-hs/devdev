import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { initialDocumentFields } from "@trade-os/lib/dealDocumentFields"

export type ComparisonDocument = { code: string; type: string; file: string; status: string; documentId?: string }
const normalizeCandidateValue = (value: string) => value.replaceAll(",", "").replaceAll(" ", "").toLowerCase()

export function DealDocumentComparisonDialog({ open, onOpenChange, documents, description }: {
  open: boolean; onOpenChange: (open: boolean) => void; documents: ComparisonDocument[]; description?: string
}) {
  const rows = [
    ["거래처", "seller"],
    ["금액", "amount"],
    ["수량", "quantity"],
    ["총중량", "gross_weight"],
    ["인코텀즈", "incoterms"],
    ["지급조건", "payment"],
  ].map(([label, key]) => {
    const cells = documents.map((document) => {
      const field =
        document.file && document.status !== "분석 중"
          ? initialDocumentFields[document.code]?.fields.find(
              (field) => field.key === key && field.origin === "AI 추출"
            )
          : undefined
      return {
        document,
        value: field?.value ?? "",
        evidence: field?.evidence ?? "",
      }
    })
    const values = cells
      .filter((cell) => cell.value)
      .map((cell) => normalizeCandidateValue(cell.value))
    const comparable = values.length > 1
    const consistent = new Set(values).size === 1
    return {
      label,
      cells: cells.map((cell) => ({
        ...cell,
        status: !cell.document.file
          ? "문서 누락"
          : !cell.value || !comparable
            ? "대조 불가"
            : consistent
              ? "일치"
              : "불일치",
      })),
    }
  })
  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85dvh] overflow-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>서류 대조 (5-Way Match)</DialogTitle>
            <DialogDescription>
              {description ?? "PO·송장·포장명세·B/L의 같은 항목 값이 서로 일치하는지 한눈에 대조합니다."}
            </DialogDescription>
          </DialogHeader>
          <Table className="min-w-[720px] table-fixed" aria-label="서류 항목별 대조">
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">항목</TableHead>
                {documents.map((document) => (
                  <TableHead key={document.documentId ?? document.code} className="h-auto py-3 whitespace-normal">
                    <span className="block text-sm">{document.type}</span>
                    <span className="text-xs text-muted-foreground">{document.code}</span>
                    {!document.file && <span className="mt-1 block text-xs text-destructive">문서 미연결</span>}
                    {document.file && document.status === "분석 중" && <span className="mt-1 block text-xs text-muted-foreground">분석 중</span>}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="py-3 whitespace-normal font-medium">
                    <span className="block text-sm">{row.label}</span>
                    {row.cells.some(cell => cell.status === "불일치") && <span className="mt-1 block text-xs text-warning-foreground">불일치</span>}
                  </TableCell>
                  {row.cells.map((cell) => (
                    <TableCell key={cell.document.documentId ?? cell.document.code} className={cn("py-3 text-sm whitespace-normal break-words", !cell.value && "text-muted-foreground", cell.status === "불일치" && "bg-warning/5")}>
                      {cell.value || "—"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
  )
}

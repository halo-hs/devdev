import { useDealRefresh } from "@trade-os/deals/deal-refresh"
import { useEffect, useRef, useState } from "react"
import { FileSearch, RefreshCw, ArrowRightLeft, Tags } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@shared/components/ui/button"
import { Input } from "@shared/components/ui/input"
import { Textarea } from "@shared/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@shared/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/components/ui/select"
import { prototypeBackend } from "@trade-os/lib/prototype-backend"
import { dealDocumentReviewUrl, type DealDocumentRecord, type DocumentMovePreview } from "@trade-os/lib/deal-document-actions"

export function DealDocumentActions({ document, canWrite, onChanged }: {
  document: DealDocumentRecord
  canWrite: boolean
  onChanged: (record: DealDocumentRecord, action: string) => void
}) {
  const refresh = useDealRefresh()
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const [dialog, setDialog] = useState<"type" | "replace" | "move" | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [attempt, setAttempt] = useState(0)
  const [types, setTypes] = useState<Array<{ code: string; label: string }>>([])
  const [code, setCode] = useState("")
  const [targets, setTargets] = useState<Array<{ id: string; title: string }>>([])
  const [targetId, setTargetId] = useState("")
  const [search, setSearch] = useState("")
  const [reason, setReason] = useState("")
  const [preview, setPreview] = useState<DocumentMovePreview | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const processing = document.state === "processing"

  useEffect(() => {
    if (!canWrite) { setDialog(null); setBusy(false) }
  }, [canWrite])

  useEffect(() => {
    let cancelled = false
    if (!canWrite || !dialog || dialog === "replace") return
    setLoading(true)
    setLoadError("")
    setPreview(null)
    const load = async () => {
      try {
        if (dialog === "type") {
          const options = await prototypeBackend.dealDocuments.listTypes()
          if (!cancelled) setTypes(options)
        } else {
          const deals = await prototypeBackend.dealDocuments.listMoveTargets(document.dealId!)
          const impact = targetId ? await prototypeBackend.dealDocuments.previewMove(document, targetId) : null
          if (!cancelled) { setTargets(deals); setPreview(impact) }
        }
      } catch {
        if (!cancelled) setLoadError(dialog === "type" ? "문서 유형을 불러오지 못했습니다." : "이동할 거래와 영향을 확인하지 못했습니다.")
      } finally { if (!cancelled) setLoading(false) }
    }
    void load()
    return () => { cancelled = true }
  }, [dialog, targetId, attempt, document, canWrite])

  if (!canWrite) return null
  const open = (next: typeof dialog) => {
    setError(""); setLoadError(""); setCode(""); setTargetId(""); setSearch(""); setReason(""); setPreview(null); setFile(null)
    setDialog(next)
  }
  const save = async () => {
    if (busy || !canWrite || loading || loadError) return
    setBusy(true); setError("")
    const receipt = refresh.beginWrite()
    let accepted = false
    try {
      let next: DealDocumentRecord
      let action: string
      if (dialog === "type") {
        if (!types.some(option => option.code === code)) return
        next = await prototypeBackend.dealDocuments.reclassify(document, code)
        action = "문서 유형 선택"
      } else if (dialog === "replace") {
        if (!file || processing) return
        next = await prototypeBackend.dealDocuments.replace(document, file)
        action = "파일 교체"
      } else {
        if (!preview || preview.targetId !== targetId || !reason.trim()) return
        next = await prototypeBackend.dealDocuments.move(document, preview, reason)
        action = "다른 거래로 이동"
      }
      // The accepted write result updates the screen directly; never repeat it
      // as a side effect of a subsequent read or navigation failure.
      accepted = true
      if (!refresh.isCurrent(receipt)) return
      if (mounted.current) setDialog(null)
      onChanged(next, action)
      toast.success(action === "다른 거래로 이동" ? "서류를 이동했습니다." : action === "파일 교체" ? "파일을 교체했습니다. 내용을 다시 검토해 주세요." : "문서 유형을 저장했습니다. 내용을 검토해 주세요.")
    } catch (cause) {
      if (mounted.current && refresh.isCurrent(receipt)) setError(cause instanceof Error ? cause.message : "변경하지 못했습니다. 입력을 확인하고 다시 시도해 주세요.")
    } finally {
      refresh.finishWrite(receipt, accepted)
      if (mounted.current && refresh.isCurrent(receipt)) setBusy(false)
    }
  }
  return <>
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`${document.type} 문서 작업`}>
      {document.state === "needs_review" && document.erpDocumentId && <Button variant="outline" size="sm" asChild><a href={dealDocumentReviewUrl(document)}><FileSearch />검토 화면 열기</a></Button>}
      {document.state === "needs_type" && <Button variant="outline" size="sm" disabled={busy} onClick={() => open("type")}><Tags />서류 종류 선택</Button>}
      <Button id={`document-actions-${document.id}`} variant="outline" size="sm" disabled={busy || processing} onClick={() => open("replace")}><RefreshCw />파일 교체</Button>
      {document.state === "ready" && <Button variant="outline" size="sm" disabled={busy} onClick={() => open("move")}><ArrowRightLeft />다른 거래로 이동</Button>}
    </div>
    <Dialog open={Boolean(dialog)} onOpenChange={next => { if (!next && !busy) setDialog(null) }}>
      <DialogContent className="sm:max-w-lg" onInteractOutside={event => { if (busy) event.preventDefault() }} onCloseAutoFocus={event => {
        // An accepted replacement updates this record while the dialog closes.
        // Don't steal focus from a menu the user has already opened again.
        event.preventDefault()
        if (!window.document.querySelector('[role="menu"]')) window.document.getElementById(`document-actions-${document.id}`)?.focus()
      }}>
        <DialogHeader>
          <DialogTitle>{dialog === "type" ? "문서 유형 선택" : dialog === "replace" ? "파일 교체" : "다른 거래로 이동"}</DialogTitle>
          <DialogDescription className="break-all">{document.file}</DialogDescription>
        </DialogHeader>
        {dialog === "type" && <div className="space-y-2">
          <label htmlFor="deal-document-type" className="text-sm font-medium">문서 유형</label>
          <Select value={code} onValueChange={setCode} disabled={busy || loading || Boolean(loadError)}>
            <SelectTrigger id="deal-document-type"><SelectValue placeholder="유형을 선택해 주세요" /></SelectTrigger>
            <SelectContent style={{ zIndex: "calc(var(--z-dialog) + 2)" }}>{types.map(type => <SelectItem key={type.code} value={type.code}>{type.label}</SelectItem>)}</SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">선택한 유형으로 저장한 뒤 내용을 검토합니다.</p>
        </div>}
        {dialog === "replace" && <div className="space-y-3">
          <p className="text-sm text-muted-foreground">거래 연결은 유지됩니다. 교체한 PDF의 내용을 다시 검토해야 합니다.</p>
          <input ref={fileInput} type="file" accept="application/pdf,.pdf" aria-label="교체할 PDF 파일" disabled={busy} onChange={event => {
            const selected = event.target.files?.[0]
            event.target.value = ""
            if (selected) { setFile(selected); setError("") }
          }} className="sr-only" />
          <Button variant="outline" onClick={() => fileInput.current?.click()} disabled={busy}>PDF 파일 선택</Button>
          {file && <p className="break-all text-sm">새 파일: {file.name}</p>}
        </div>}
        {dialog === "move" && <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="move-deal-search" className="text-sm font-medium">이동할 거래</label>
            <Input id="move-deal-search" placeholder="거래명 또는 거래 번호 검색" value={search} disabled={busy} onChange={event => setSearch(event.target.value)} />
            <div className="max-h-40 overflow-y-auto rounded-md border" role="radiogroup" aria-label="이동할 거래 선택">
              {targets.filter(target => `${target.id} ${target.title}`.toLowerCase().includes(search.trim().toLowerCase())).map(target =>
                <label key={target.id} className="flex cursor-pointer items-start gap-2 border-b p-3 text-sm last:border-b-0 hover:bg-muted">
                  <input type="radio" name="move-deal" value={target.id} checked={targetId === target.id} disabled={busy} onChange={() => { setTargetId(target.id); setPreview(null); setError("") }} className="mt-1" />
                  <span>{target.title}<span className="block text-xs text-muted-foreground">{target.id}</span></span>
                </label>)}
              {!loading && !targets.some(target => `${target.id} ${target.title}`.toLowerCase().includes(search.trim().toLowerCase())) && <p className="p-3 text-sm text-muted-foreground">이동할 거래가 없습니다.</p>}
            </div>
          </div>
          {preview && !loading && !loadError && <div className="rounded-md bg-muted p-3 text-sm" aria-label="이동 영향">
            <p className="font-medium">서류 연결 변경</p>
            <p className="mt-2">현재 거래 {preview.sourceId}: 업로드 서류 {preview.sourceCount} → {preview.sourceCount - 1}건</p>
            <p className="mt-1">대상 거래 {preview.targetId}: 업로드 서류 {preview.targetCount} → {preview.targetCount + 1}건</p>
            <p className="mt-2 text-xs text-muted-foreground">양쪽 거래의 대조 결과와 정산 금액에 영향을 줍니다. 현재 시안에서는 서류 연결 변경을 확인할 수 있습니다.</p>
          </div>}
          <div className="space-y-2">
            <label htmlFor="move-document-reason" className="text-sm font-medium">이동 사유</label>
            <Textarea id="move-document-reason" value={reason} disabled={busy} onChange={event => setReason(event.target.value)} placeholder="서류를 옮기는 이유를 입력해 주세요" />
          </div>
        </div>}
        {loading && <p role="status" className="text-sm text-muted-foreground">확인 중…</p>}
        {loadError && <div role="alert" className="space-y-2 text-sm text-destructive"><p>{loadError}</p><Button variant="outline" size="sm" onClick={() => setAttempt(value => value + 1)}>다시 확인</Button></div>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => setDialog(null)}>취소</Button>
          <Button disabled={busy || loading || Boolean(loadError) || (dialog === "type" ? !code : dialog === "replace" ? !file : !preview || !reason.trim())} onClick={() => void save()}>
            {busy ? "처리 중…" : dialog === "type" ? "유형 저장" : dialog === "replace" ? "파일 교체" : "서류 이동"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
}

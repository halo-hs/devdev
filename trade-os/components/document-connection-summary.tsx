import { useEffect, useRef, useState } from "react"
import { Button } from "@shared/components/ui/button"
import { Textarea } from "@shared/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@shared/components/ui/dialog"
import { prototypeBackend } from "@trade-os/lib/prototype-backend"
import type { DocumentConnection, DocumentDealLink, ConnectionChangePreview } from "@trade-os/lib/document-deal-connection"

export function DocumentConnectionSummary({ connection, onChange, onUnlink, disabled }: {
  connection: DocumentConnection; onChange: () => void; onUnlink: () => void; disabled: boolean
}) {
  const history = connection.connectionHistory ?? []
  const latest = history.at(-1)
  return <section aria-label="현재 거래 연결" className="rounded-lg border bg-background p-4 text-xs">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold">{connection.link ? "연결된 거래" : "연결된 거래 없음"}</h3>
        {connection.link ? <a className="mt-1.5 block break-words font-medium text-primary hover:underline" href={`/erp/deals/${encodeURIComponent(connection.link.dealId)}`}>{connection.link.dealLabel}</a> : null}
        <p className="mt-1.5 text-muted-foreground">{latest
          ? `${latest.actorLabel} · ${new Date(latest.occurredAt).toLocaleString("ko-KR")} · ${latest.action === "unlinked" ? "연결 해제" : latest.action === "relinked" ? "연결 변경" : "연결"}`
          : connection.link ? "이전 연결의 처리자·시각은 기록되어 있지 않습니다." : "후보를 선택한 뒤 연결을 확정하세요."}</p>
      </div>
      {connection.link ? <div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="outline" disabled={disabled} onClick={onChange}>다른 거래로 변경</Button>
        <Button size="sm" variant="ghost" disabled={disabled} onClick={onUnlink}>연결 해제</Button>
      </div> : null}
    </div>
    {history.length ? <details className="mt-3 border-t pt-3">
      <summary className="cursor-pointer text-muted-foreground">연결 이력 {history.length}건</summary>
      <ol className="mt-3 space-y-3">
        {[...history].reverse().map((event, index) => <li key={`${event.occurredAt}:${index}`} className="space-y-1 break-words">
          <p className="font-medium">{event.action === "linked" ? "연결" : event.action === "relinked" ? "연결 변경" : "연결 해제"} · {event.fromDealId ? `${event.fromDealId} → ` : ""}{event.dealLabel ?? event.dealId ?? "미연결"}</p>
          <p className="text-muted-foreground">{event.actorLabel} · {new Date(event.occurredAt).toLocaleString("ko-KR")}</p>
          {event.reason ? <p>사유 · {event.reason}</p> : null}
          {event.evidence.length ? <p className="text-muted-foreground">{event.evidence.join(" / ")}</p> : null}
        </li>)}
      </ol>
    </details> : null}
  </section>
}

export function DocumentConnectionChangeDialog({ documentId, connection, target, evidence, open, onClose, onApplied }: {
  documentId: string; connection: DocumentConnection; target: DocumentDealLink | null; evidence: string[]
  open: boolean; onClose: () => void; onApplied: (connection: DocumentConnection) => void
}) {
  const [reason, setReason] = useState("")
  const [preview, setPreview] = useState<ConnectionChangePreview | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [displayConnection, setDisplayConnection] = useState(connection)
  const submitting = useRef(false)
  const title = target ? "거래 연결 변경" : "거래 연결 해제"
  useEffect(() => {
    if (!open || !connection.link) return
    let active = true
    setLoading(true); setError(""); setPreview(null)
    // On retry, refresh the snapshot shown in the dialog. Preserve the reason;
    // a concurrent edit must never leave the user retrying the stale revision.
    const load = async () => {
      const snapshot = attempt ? await prototypeBackend.tradeDocuments.getConnection(documentId, connection.link ?? undefined) : connection
      if (active) setDisplayConnection(snapshot)
      if (!snapshot.link) throw new Error("이미 연결이 해제되었습니다. 창을 닫고 현재 연결을 다시 확인해 주세요.")
      return prototypeBackend.tradeDocuments.previewConnectionChange(documentId, snapshot.revision, snapshot.link, target)
    }
    load()
      .then(value => { if (active) setPreview(value) })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "변경 영향을 불러오지 못했습니다.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [open, documentId, connection.revision, connection.link?.dealId, target?.dealId, attempt])
  const apply = async () => {
    if (submitting.current || !preview || preview.blockedReason || !reason.trim()) return
    submitting.current = true; setBusy(true); setError("")
    try {
      const accepted = await prototypeBackend.tradeDocuments.changeConnection(preview.previewId, reason, evidence)
      onApplied(accepted)
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "연결을 변경하지 못했습니다. 다시 시도해 주세요.")
    } finally { submitting.current = false; setBusy(false) }
  }
  return <Dialog open={open} onOpenChange={value => { if (!value && !busy) onClose() }}>
    <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>변경할 연결과 영향을 확인하고 사유를 입력하세요.</DialogDescription></DialogHeader>
      <dl className="space-y-3 rounded-lg border p-4 text-sm" aria-label="연결 변경 영향">
        <div><dt className="text-xs text-muted-foreground">현재 거래</dt><dd className="mt-1 break-words">{displayConnection.link?.dealLabel ?? "거래 연결 없음"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">변경 후</dt><dd className="mt-1 break-words font-medium">{target?.dealLabel ?? "거래 연결 없음"}</dd></div>
        <div className="border-t pt-3 text-xs text-muted-foreground">{loading ? "연결된 정산 내역을 확인하고 있습니다." : preview?.blockedReason ?? (preview ? "문서의 거래 연결과 변경 이력이 함께 반영됩니다. 검토한 문서 값은 유지됩니다." : "변경 영향을 확인한 뒤 확정할 수 있습니다.")}</div>
      </dl>
      <label className="grid gap-2 text-sm">변경 사유<Textarea aria-label="변경 사유" value={reason} onChange={event => setReason(event.target.value)} disabled={busy} placeholder="연결을 변경하는 이유를 입력하세요" /></label>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      {(error || preview?.blockedReason) && !loading ? <Button size="sm" variant="outline" disabled={busy} onClick={() => setAttempt(value => value + 1)}>변경 영향 다시 확인</Button> : null}
      <DialogFooter><Button variant="outline" disabled={busy} onClick={onClose}>취소</Button><Button disabled={busy || loading || !preview || Boolean(preview.blockedReason) || !reason.trim()} onClick={() => void apply()}>{busy ? "변경 중" : target ? "연결 변경 확정" : "연결 해제 확정"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>
}

import { type DeliveryAttachment, DeliveryAttachmentPicker, DeliveryAttachmentPreview } from "@trade-os/documents/attachment-picker"
import { templateMeta, createSamplePdf, type Tone } from "@trade-os/documents/documentTemplateModel"
import { useState, useEffect } from "react"
import { Button } from "@shared/components/ui/button"
import { X, Download, Building2, Plus, ChevronDown, FileText, Check, Copy, Maximize2, Link2, Mail, LoaderCircle, RefreshCw } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { ToneBadge } from "@trade-os/components/tone-badge"
import { DateInput } from "@shared/components/date-input"
import { Input } from "@shared/components/ui/input"
import { FormField } from "@shared/components/form-field"
import { Textarea } from "@shared/components/ui/textarea"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@shared/components/ui/alert-dialog"
import { type DeliveryLink, type EmailRecord, type DealDocumentContext } from "@/App"

// Kept as a reference fallback for the earlier three-step document prototype.
// Kept as a reference fallback for the earlier three-step document prototype.
export function ShareDeliveryPanel({
  magicLinks,
  emailRecords,
  onSendEmail,
  onRetryEmail,
  onCancelEmail,
  onCreateMagicLink,
  onRevokeMagicLink,
  onClose,
  templateCode,
  documentNumber,
  relatedDeal,
  initialAttachments,
  onAttachmentsChange,
}: {
  magicLinks: DeliveryLink[]
  emailRecords: EmailRecord[]
  onSendEmail: (input: {
    linkCount: number
    recipient: string
    subject: string
    textBody: string
    shareLinkId: string
  }) => Promise<boolean>
  onRetryEmail?: (record: EmailRecord) => Promise<boolean>
  onCancelEmail?: (id: number) => void
  onCreateMagicLink: (settings: { expires: string; maxOpens: number }) => void
  onRevokeMagicLink: (id: number, reason?: string) => void
  onClose: () => void
  templateCode: string
  documentNumber: string
  relatedDeal: DealDocumentContext | null
  initialAttachments?: readonly DeliveryAttachment[]
  onAttachmentsChange: (attachments: DeliveryAttachment[]) => void
}) {
  const [, templateTitle] = templateMeta(templateCode)
  const [deliveryMode, setDeliveryMode] = useState<"send" | "history">("send")
  const [copiedLinkId, setCopiedLinkId] = useState<number | null>(null)
  const [recipient, setRecipient] = useState("ops@acme.example")
  const [subject, setSubject] = useState(`[ECOYA] ${templateTitle} 전달`)
  const [textBody, setTextBody] = useState(
    `안녕하세요.\n${templateTitle}와 관련 서류를 전달드립니다.\n내용 확인 후 회신 부탁드립니다.`
  )
  const [expires, setExpires] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date.toISOString().slice(0, 10)
  })
  const [maxOpens, setMaxOpens] = useState("10")
  const linkSettingsValid = Boolean(expires) && Number.isInteger(Number(maxOpens)) && Number(maxOpens) > 0
  const [isSending, setIsSending] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<DeliveryLink | null>(null)
  const [revokeReason, setRevokeReason] = useState("")
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const [attachmentPickerOpen, setAttachmentPickerOpen] = useState(false)
  const [attachments, setAttachments] = useState<DeliveryAttachment[]>(() =>
    initialAttachments
      ? [...initialAttachments]
      : [{ id: "att-1", name: "인보이스_2607_003.pdf", source: "인박스", kind: "인보이스", sizeBytes: 310_000 }]
  )
  useEffect(() => { onAttachmentsChange(attachments) }, [attachments, onAttachmentsChange])
  const [previewAttachment, setPreviewAttachment] = useState<{ name: string; blob: Blob; sample: boolean } | null>(null)
  const activeMagicLinkCount = magicLinks.filter(
    (link) => link.status === "active"
  ).length
  const linkSlotOccupied = magicLinks.some((link) => link.status !== "revoked")
  const activeLinks = magicLinks.filter((link) => link.status === "active")
  const emailLink = activeLinks.at(-1)
  const deliveryHistorySummary = emailRecords.at(0)?.status === "failed"
    ? "전달 실패"
    : emailRecords.at(0)?.status === "delivered"
      ? "전달 완료"
      : "전달 전"
  const formatLinkStatus = (status: DeliveryLink["status"]) =>
    status === "active"
      ? "활성"
      : status === "revoked"
        ? "철회"
        : status === "expired"
          ? "만료"
          : "한도 도달"
  const currentLink = magicLinks.find((link) => link.status !== "revoked") ?? magicLinks.at(-1)
  const statusLabel = (status: EmailRecord["status"] = "requested") =>
    status === "queued"
      ? "전송 요청됨"
      : status === "sending"
        ? "전송 중"
        : status === "accepted"
          ? "발송됨"
          : status === "delivered"
            ? "전달됨"
            : status === "failed"
              ? "전송 실패"
              : status === "cancelled"
                ? "취소됨"
                : "전송 요청됨"
  const attachmentKind = (attachment: DeliveryAttachment) =>
    attachment.kind ?? "기타 첨부"
  const attachmentMeta = (attachment: DeliveryAttachment) => {
    const bytes = attachment.sizeBytes ?? attachment.file?.size
    return bytes
      ? `${attachment.source} · ${(bytes / (1024 * 1024)).toFixed(1)} MiB`
      : attachment.source
  }
  const attachmentTotalBytes = attachments.reduce(
    (total, attachment) => total + (attachment.sizeBytes ?? attachment.file?.size ?? 0),
    0
  )
  const handleCopyLink = (link: DeliveryLink) => {
    const url = `https://ecoya.app/share/${documentNumber.toLowerCase()}-${link.id}`
    void navigator.clipboard?.writeText(url)
    setCopiedLinkId(link.id)
    window.setTimeout(() => setCopiedLinkId(null), 1200)
  }
  return (
    <section className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold">파일 공유하기</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="shrink-0" onClick={onClose}>
          <X className="size-4" /> 공유 창 닫기
        </Button>
      </div>

      <div className="mx-auto mt-4 grid w-[calc(100%-2.5rem)] max-w-4xl grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        {[
          ["send", "전달"],
          ["history", "전달 내역"],
        ].map(([mode, label]) => (
          <Button
            variant="ghost"
            size="sm"
            key={mode}
            className={cn(
              "h-8 flex-1 text-xs text-muted-foreground",
              deliveryMode === mode && "bg-background text-foreground shadow-sm"
            )}
            onClick={() => setDeliveryMode(mode as "send" | "history")}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="mx-auto min-h-0 w-full max-w-4xl flex-1 overflow-auto p-5">
        {deliveryMode === "send" ? (
          <div className="space-y-5">
            <section className="space-y-3" aria-label="동봉할 파일">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  동봉할 파일 <span className="text-primary">{attachments.length + 1}개</span>
                </h3>
                <span className="text-xs text-muted-foreground">
                  첨부 {attachments.length}/10개 · {(attachmentTotalBytes / (1024 * 1024)).toFixed(1)}/50.0 MiB
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.print()}><Download data-icon="inline-start" /> 패키지 내려받기</Button>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border bg-background">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 p-4">
                  <div className="min-w-0 flex-1 basis-40">
                    <div className="flex items-start gap-2 text-sm font-medium">
                      <Building2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div className="min-w-0">
                        {relatedDeal ? <>
                          <p className="text-xs text-muted-foreground">{relatedDeal.id}</p>
                          <p className="mt-1 break-words">{relatedDeal.title}</p>
                        </> : <p>연결된 거래 없음</p>}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0 bg-background" aria-expanded={attachmentPickerOpen} aria-controls="delivery-attachment-picker" onClick={() => setAttachmentPickerOpen((open) => !open)}>
                    <Plus data-icon="inline-start" /> 파일 추가
                    <ChevronDown className={cn("size-3.5 transition-transform", attachmentPickerOpen && "rotate-180")} />
                  </Button>
                </div>
                {attachmentPickerOpen && <div className="border-b bg-muted/40 p-3 sm:p-4">
                  <DeliveryAttachmentPicker open={attachmentPickerOpen} onOpenChange={setAttachmentPickerOpen} attachments={attachments} onChange={setAttachments} />
                </div>}
                {!relatedDeal && <p role="alert" className="px-4 pt-4 text-xs text-destructive">공유하려면 문서 화면에서 거래를 연결하세요.</p>}
              <div className="space-y-3 bg-muted/30 p-3 sm:p-4">
                <ul className="space-y-2" aria-label="동봉된 파일 목록">
                  <li className="flex items-center gap-3 rounded-lg border bg-background p-3 shadow-sm">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><FileText className="size-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="break-all text-sm font-semibold text-foreground">{documentNumber}.pdf</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <ToneBadge tone="success">확정</ToneBadge>
                        <span>버전 1 · 최종 PDF</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon-sm" className="shrink-0" aria-label="본문 PDF 다운로드" onClick={() => window.print()}>
                      <Download className="size-4" />
                    </Button>
                  </li>
                  {attachments.map((attachment) => (
                    <li key={attachment.id} className="flex items-center gap-3 rounded-lg border bg-background p-3 shadow-sm">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><FileText className="size-5" /></span>
                      <div className="min-w-0 flex-1">
                        <button type="button" className="block text-left text-sm font-semibold break-all text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${attachment.name} 미리보기`} onClick={() => setPreviewAttachment({ name: attachment.name, blob: attachment.file ?? createSamplePdf(attachment.name), sample: !attachment.file })}>
                          {attachment.name}
                        </button>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <ToneBadge tone="neutral">{attachmentKind(attachment)}</ToneBadge>
                          <span>{attachmentMeta(attachment)}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon-sm" className="shrink-0 text-muted-foreground hover:text-destructive" aria-label={`${attachment.name} 동봉 해제`} title="동봉 해제" onClick={() => setAttachments((current) => current.filter((item) => item.id !== attachment.id))}>
                        <X className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
              </div>
            </section>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">공유 링크</h3>
                  <ToneBadge tone={!currentLink ? "neutral" : currentLink.status === "active" ? "success" : currentLink.status === "revoked" ? "danger" : "warning"}>
                    {currentLink ? formatLinkStatus(currentLink.status) : "미생성"}
                  </ToneBadge>
                </div>
              </div>
              {magicLinks.length > 0 ? (
                <div className="grid gap-2">
                  {magicLinks.map((link, index) => {
                    const linkUrl = `https://ecoya.app/share/${documentNumber.toLowerCase()}-${link.id}`
                    const linkUsable = link.status === "active"
                    const linkRevocable = link.status !== "revoked"
                    const linkStatus = formatLinkStatus(link.status)
                    return (
                      <div
                        key={link.id}
                        className="rounded-md border bg-background p-3 text-xs"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold">
                            공유 링크 {index + 1}
                          </span>
                          <ToneBadge
                            tone={
                              linkUsable
                                ? "success"
                                : link.status === "revoked"
                                  ? "danger"
                                  : "warning"
                            }
                          >
                            {linkStatus}
                          </ToneBadge>
                        </div>
                        <div className="mt-2 truncate font-medium text-primary">
                          {linkUrl}
                        </div>
                        <div className="mt-2 text-muted-foreground">
                          {link.opens}/{link.maxOpens}회 열람 · {link.expires}{" "}
                          만료
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!linkUsable}
                            onClick={() => handleCopyLink(link)}
                          >
                            {copiedLinkId === link.id ? (
                              <>
                                <Check data-icon="inline-start" /> 복사됨
                              </>
                            ) : (
                              <>
                                <Copy data-icon="inline-start" /> 복사
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!linkUsable}
                            onClick={() =>
                              window.open(
                                linkUrl,
                                "_blank",
                                "noopener,noreferrer"
                              )
                            }
                          >
                            <Maximize2 data-icon="inline-start" /> 새창
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!linkRevocable}
                            onClick={() => {
                              setRevokeTarget(link)
                              setRevokeReason("")
                            }}
                          >
                            철회
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : null}
              {activeMagicLinkCount === 0 ? (
                <div className={cn("space-y-3", magicLinks.length > 0 && "mt-3")}>
                  <details className="group rounded-md bg-muted/30 px-3 py-2">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-xs [&::-webkit-details-marker]:hidden">
                      <span>링크 설정 · {expires.replaceAll("-", ".")} 만료 · 최대 {maxOpens}회</span>
                      <ChevronDown className="size-3.5 group-open:rotate-180" />
                    </summary>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <label className="grid gap-1 text-xs">
                        <span>만료일</span>
                        <DateInput ariaLabel="만료일" value={expires} onValueChange={setExpires} />
                      </label>
                      <label className="grid gap-1 text-xs">
                        <span>최대 열람 횟수</span>
                        <Input type="number" min={1} step={1} className="h-8 bg-[var(--control-background)]" value={maxOpens} onChange={(event) => setMaxOpens(event.target.value)} />
                      </label>
                    </div>
                  </details>
                  <Button className="w-full" disabled={!relatedDeal || !linkSettingsValid || linkSlotOccupied} onClick={() => onCreateMagicLink({ expires: expires.replaceAll("-", "."), maxOpens: Number(maxOpens) })}>
                    <Link2 data-icon="inline-start" /> 공유 링크 만들기
                  </Button>
                </div>
              ) : null}
            </div>

            {emailLink ? <details className="group border-t pt-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-1 [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2 text-sm font-semibold"><Mail className="size-4" /> 이메일로도 보내기 <span className="text-xs font-normal text-muted-foreground">선택</span></span>
                <ChevronDown className="size-4 group-open:rotate-180" />
              </summary>
              <div className="pt-3">
                <div className="grid gap-2">
                <FormField label="받는 사람" htmlFor="share-email-recipient">
                  <Input id="share-email-recipient" type="email" className="h-10 bg-[var(--control-background)]" value={recipient} onChange={(event) => setRecipient(event.target.value)} />
                </FormField>
                <FormField label="제목" htmlFor="share-email-subject">
                  <Input id="share-email-subject" className="h-10 bg-[var(--control-background)]" value={subject} onChange={(event) => setSubject(event.target.value)} />
                </FormField>
                <FormField label="이메일 내용" htmlFor="share-email-body">
                  <Textarea id="share-email-body" aria-label="이메일 내용" className="min-h-28 resize-none bg-[var(--control-background)] text-xs leading-5" value={textBody} onChange={(event) => setTextBody(event.target.value)} />
                </FormField>
                </div>
                <div className="mt-3 rounded-md border bg-background p-3 text-xs">
                  <div className="font-medium">이메일에 포함될 공유 링크</div>
                  <div className="mt-2 text-muted-foreground">
                    {`https://ecoya.app/share/${documentNumber.toLowerCase()}-${emailLink.id}`}
                  </div>
                </div>
                <Button
                  className="mt-3 w-full"
                  disabled={
                    !recipient.trim() ||
                    !subject.trim() ||
                    isSending
                  }
                  onClick={async () => {
                    setIsSending(true)
                    const sent = await onSendEmail({
                      linkCount: 1,
                      recipient,
                      subject,
                      textBody,
                      shareLinkId: String(emailLink.id),
                    })
                    setIsSending(false)
                    if (sent) setDeliveryMode("history")
                  }}
                >
                  {isSending ? (
                    <LoaderCircle
                      className="animate-spin"
                      data-icon="inline-start"
                    />
                  ) : (
                    <Mail data-icon="inline-start" />
                  )}
                  {isSending ? "보내는 중" : "이메일 보내기"}
                </Button>
              </div>
            </details> : (
              <div className="border-t pt-4">
                <div className="inline-flex items-center gap-2 text-sm font-semibold">
                  <Mail className="size-4" /> 이메일로도 보내기 <span className="text-xs font-normal text-muted-foreground">선택</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-background px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span>고객 전달 상태</span>
                <ToneBadge tone={deliveryHistorySummary === "전달 실패" ? "danger" : deliveryHistorySummary === "전달 완료" ? "success" : "neutral"}>
                  {deliveryHistorySummary}
                </ToneBadge>
              </div>
              <Button variant="outline" size="icon-xs" aria-label="새로고침" title="새로고침" onClick={() => setHistoryRefreshKey((value) => value + 1)}>
                <RefreshCw aria-hidden="true" />
              </Button>
            </div>
            <div key={historyRefreshKey} className="grid gap-3">
            {[
              ...magicLinks.map((link) => ({
                id: `link-${link.id}`,
                title: `공유 링크 ${link.id}`,
                meta: `${formatLinkStatus(link.status)} · ${link.expires} 만료${link.revokeReason ? ` · 사유: ${link.revokeReason}` : ""}`,
                tone: link.status === "active" ? "success" : link.status === "revoked" ? "danger" : "warning",
                badge: formatLinkStatus(link.status),
                email: undefined,
              })),
              ...emailRecords.map((email) => ({
                id: `email-${email.id}`,
                title: `이메일 요청 · ${email.recipient.replace(/(^.).*(@.*$)/, "$1***$2")}`,
                meta: `요청 시각 ${email.sentAt} · 공유 링크 ${email.linkCount}개 포함 · ${email.attempts ?? 1}차 시도`,
                tone: email.status === "failed" ? "danger" : email.status === "delivered" ? "success" : "blue",
                badge: statusLabel(email.status),
                email,
              })),
            ].map((item) => (
              <div
                key={item.id}
                className="rounded-lg border bg-background p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-xs font-semibold">
                    {item.title}
                  </div>
                  <ToneBadge tone={item.tone as Tone}>
                    {item.badge}
                  </ToneBadge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {item.meta}
                </div>
                {item.email ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                    <span className="text-[11px] text-muted-foreground">시도 {item.email.attempts ?? 1}회</span>
                    {item.email.status === "requested" || item.email.status === "queued" ? (
                      <Button variant="outline" size="xs" onClick={() => onCancelEmail?.(item.email!.id)}>
                        요청 취소
                      </Button>
                    ) : null}
                    {item.email.status === "failed" ? (
                      <Button variant="outline" size="xs" onClick={() => void onRetryEmail?.(item.email!)}>
                        다시 보내기
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
            {magicLinks.length + emailRecords.length === 0 ? (
              <div className="rounded-lg border bg-background p-4 text-xs leading-5 text-muted-foreground">
                전달 내역이 없습니다.
              </div>
            ) : null}
            </div>
          </div>
        )}
      </div>
      {previewAttachment && <DeliveryAttachmentPreview {...previewAttachment} onClose={() => setPreviewAttachment(null)} />}
      <AlertDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRevokeTarget(null)
            setRevokeReason("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공유 링크 철회</AlertDialogTitle>
            <AlertDialogDescription>
              철회하면 접근이 차단되고 전달 내역과 감사 근거가 보존됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <label htmlFor="share-link-revoke-reason" className="text-xs font-medium">철회 사유</label>
            <Textarea
              id="share-link-revoke-reason"
              className="min-h-20 resize-none text-xs"
              value={revokeReason}
              onChange={(event) => setRevokeReason(event.target.value)}
              placeholder="철회 사유를 입력하세요."
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              disabled={!revokeReason.trim() || !revokeTarget}
              onClick={() => {
                if (!revokeTarget || !revokeReason.trim()) return
                onRevokeMagicLink(revokeTarget.id, revokeReason.trim())
                setRevokeTarget(null)
                setRevokeReason("")
              }}
            >
              철회
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

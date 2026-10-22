import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { cn } from "@shared/lib/utils"
import { AlertTriangle, FileText, Building2, ClipboardList, Check, ShieldCheck, LoaderCircle, X, Clock3, Send, Mail, Upload, Users, ChevronDown, Copy } from "lucide-react"
import { ToneBadge } from "@trade-os/components/ToneBadge"
import { Button } from "@shared/components/ui/button"
import { type DocumentStyle, type DocumentLogo, templateMeta } from "@trade-os/documents/documentTemplateModel"
import { ScrollArea } from "@shared/components/ui/scroll-area"
import { Alert, AlertTitle, AlertDescription, AlertAction } from "@shared/components/ui/alert"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@shared/components/ui/select"
import { FileDropZone } from "@ecoya/design-system/extensions/file-drop-zone"
import { Checkbox } from "@shared/components/ui/checkbox"
import { Popover, PopoverTrigger, PopoverContent } from "@shared/components/ui/popover"
import { Textarea } from "@shared/components/ui/textarea"
import { Input } from "@shared/components/ui/input"
import { type DocumentDiscrepancyReview, type DealDocumentContext, type DocumentApprovalChoice, type DocumentElementStatus, type DocumentApprovalEvent, type DocumentApprovalPreviewState, type ErpPreviewRole, type DocumentApprover, type DocumentDirection, type DocumentSaveState, type DocumentComparisonFacts, type DocumentSourceDeal, type DeliveryLink, type ReviewChecklistRow } from "@/App"
import { documentApproverOptions, buildDocumentDiscrepancyReview, buildDocumentReviewRows } from "@trade-os/documents/documentTemplateModel"

function DocumentDiscrepancyPanel({
  review,
  relatedDeal,
  onReviewSource,
  className,
}: {
  review: DocumentDiscrepancyReview
  relatedDeal: DealDocumentContext | null
  onReviewSource: () => void
  className?: string
}) {
  const [checking, setChecking] = useState(false)
  const handleRecheck = () => {
    setChecking(true)
    window.setTimeout(() => {
      setChecking(false)
      toast.success("저장된 문서값으로 다시 점검했습니다.")
    }, 650)
  }
  const issueFindings = review.findings.filter(
    (finding) => finding.state !== "pass"
  )
  const hasActionableIssue =
    review.errorCount > 0 || (review.basisReady && review.warningCount > 0)

  if (!relatedDeal || !hasActionableIssue || issueFindings.length === 0) {
    return null
  }

  return (
    <section className={cn("rounded-md border bg-background p-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <AlertTriangle
            className={cn(
              "size-4",
              review.errorCount > 0
                ? "text-destructive"
                : "text-warning-foreground"
            )}
          />
          은행 거절 전 점검
        </div>
        <ToneBadge
          tone={
            review.errorCount > 0
              ? "danger"
              : review.warningCount > 0
                ? "warning"
                : "success"
          }
        >
          {review.errorCount > 0
            ? `거절 위험 ${review.errorCount}`
            : review.warningCount > 0
              ? `확인 필요 ${review.warningCount}`
              : "이상 없음"}
        </ToneBadge>
        <div className="ml-auto flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={onReviewSource}
          >
            항목 수정
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={checking}
            onClick={handleRecheck}
          >
            {checking ? "점검 중" : "다시 점검"}
          </Button>
        </div>
      </div>

      <p className="mt-1 text-[11px] text-muted-foreground">
        연결 거래 {relatedDeal.id}의 서류 간 불일치(통화·금액·거래처·L/C)를
        발송 전에 대조합니다. 불일치를 수정해야 다음 단계로 진행할 수 있습니다.
      </p>

      <div className="mt-2 overflow-hidden rounded-md border">
        {issueFindings.map((finding, index) => (
          <div
            key={finding.key}
            className={cn(
              index > 0 && "border-t",
              finding.state === "error"
                ? "bg-destructive/[0.025]"
                : "bg-warning/[0.035]"
            )}
          >
            <div className="flex min-w-0 items-center gap-1.5 px-3 py-2 text-[11px]">
              <span
                className="min-w-0 basis-[18%] truncate font-medium"
                title={finding.label}
              >
                {finding.label}
              </span>
              <span
                className="min-w-0 basis-[22%] truncate font-medium"
                title={finding.currentValue}
              >
                {finding.currentValue || "—"}
              </span>
              <ToneBadge
                tone={finding.state === "error" ? "danger" : "warning"}
              >
                {finding.state === "error" ? "불일치" : "확인 필요"}
              </ToneBadge>
              <span
                className={cn(
                  "min-w-0 basis-[25%] truncate font-medium",
                  finding.state === "error" && "text-destructive"
                )}
                title={finding.referenceValue}
              >
                {finding.referenceValue || "—"}
              </span>
              <span
                className="flex min-w-0 flex-1 items-center gap-1 text-[10px] text-muted-foreground"
                title={finding.source}
              >
                <FileText className="size-3 shrink-0" />
                <span className="truncate">{finding.source}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function DocumentReviewSharePanel({
  documentConfirmed,
  qualityAcknowledged,
  onAcknowledgeQuality,
  confirmationReady,
  approvalChoice,
  approvalStatus,
  selectedApproverIds,
  rememberApprovers,
  approvalEvents,
  approvalPreviewState,
  role,
  onApprovalChoiceChange,
  onApproverToggle,
  onRememberApproversChange,
  onRequestApproval,
  onApprove,
  onReject,
  templateCode,
  documentNumber,
  documentDirection,
  documentStyle,
  organizationLogo,
  onStyleChange,
  missingRequiredCount,
  saveState,
  comparisonFacts,
  relatedDeal,
  dealConnectionRestricted = false,
  dealFacts,
  referenceDocuments,
  onReviewSource,
  onOpenDealPicker,
  onConfirmDocument,
  magicLinks,
  onCreateMagicLink,
  onRevokeMagicLink,
  onSendEmail,
}: {
  documentConfirmed: boolean
  qualityAcknowledged: boolean
  onAcknowledgeQuality: () => void
  confirmationReady: boolean
  approvalChoice: DocumentApprovalChoice
  approvalStatus: DocumentElementStatus["approval"]
  selectedApproverIds: string[]
  rememberApprovers: boolean
  approvalEvents: DocumentApprovalEvent[]
  approvalPreviewState: DocumentApprovalPreviewState
  role: ErpPreviewRole
  onApprovalChoiceChange: (choice: DocumentApprovalChoice) => void
  onApproverToggle: (approverId: string) => void
  onRememberApproversChange: (remember: boolean) => void
  onRequestApproval: () => void
  onApprove: (approver: DocumentApprover) => void
  onReject: (approver: DocumentApprover, reason: string) => void
  templateCode: string
  documentNumber: string
  documentDirection: DocumentDirection | null
  documentStyle: DocumentStyle
  organizationLogo: DocumentLogo | null
  onStyleChange: (style: DocumentStyle) => void
  missingRequiredCount: number
  saveState: DocumentSaveState
  comparisonFacts: DocumentComparisonFacts | null
  relatedDeal: DealDocumentContext | null
  dealConnectionRestricted?: boolean
  dealFacts: DocumentSourceDeal | null
  referenceDocuments: string[]
  onReviewSource: () => void
  onOpenDealPicker: () => void
  onConfirmDocument: () => void
  magicLinks: DeliveryLink[]
  onCreateMagicLink: () => void
  onRevokeMagicLink: (id: number) => void
  onSendEmail: (input: {
    linkCount: number
    recipient: string
    subject: string
    textBody: string
    shareLinkId: string
  }) => Promise<boolean>
}) {
  const [, templateTitle] = templateMeta(templateCode)
  const [shareMode, setShareMode] = useState<"link" | "email">("link")
  const [copiedLinkId, setCopiedLinkId] = useState<number | null>(null)
  const [recipient, setRecipient] = useState("ops@acme.example")
  const [subject, setSubject] = useState(`[ECOYA] ${templateTitle} 전달`)
  const [textBody, setTextBody] = useState(
    `안녕하세요.\n${templateTitle}를 전달드립니다.\n내용 확인 후 회신 부탁드립니다.`
  )
  const [isSending, setIsSending] = useState(false)
  const [logoError, setLogoError] = useState("")
  const [logoSourceMode, setLogoSourceMode] = useState<"organization" | "file">(
    organizationLogo ? (documentStyle.logo?.source ?? "organization") : "file"
  )
  const activeLinks = magicLinks.filter((link) => link.status === "active")
  const activeLink = activeLinks.at(-1)
  const approvalInvalidated = approvalStatus === "idle" && approvalEvents.at(-1)?.type === "invalidate"
  const approvalRequested = approvalStatus === "requested"
  const approvalDone = approvalStatus === "approved"
  const approvalRejected = approvalStatus === "rejected"
  const [rejectEditorOpen, setRejectEditorOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [approverPickerOpen, setApproverPickerOpen] = useState(false)
  const approvalSectionRef = useRef<HTMLElement>(null)
  const rejectionReasonRef = useRef<HTMLTextAreaElement>(null)
  const discrepancySectionRef = useRef<HTMLDivElement>(null)
  const selectedApprovers = documentApproverOptions.filter((approver) =>
    selectedApproverIds.includes(approver.id)
  )
  const approvalPerspective =
    approvalPreviewState === "owner-pending" ||
    approvalPreviewState === "admin-pending" ||
    (approvalPreviewState === "live" && role !== "member")
      ? "approver"
      : "requester"
  const previewApproverRole =
    approvalPreviewState === "owner-pending"
      ? "Owner"
      : approvalPreviewState === "admin-pending"
        ? "Admin"
        : role === "owner"
          ? "Owner"
          : role === "admin"
            ? "Admin"
            : null
  const actingApprover =
    selectedApprovers.find(
      (approver) => approver.role === previewApproverRole
    ) ??
    selectedApprovers[0] ??
    null
  const lastRequestEvent = approvalEvents.findLast(
    (event) => event.type === "request"
  )
  const lastDecisionEvent = approvalEvents.findLast(
    (event) => event.type === "approve" || event.type === "reject"
  )
  const saveComplete = saveState === "saved"
  const discrepancyReview = buildDocumentDiscrepancyReview({
    templateCode,
    comparisonFacts,
    relatedDeal,
    dealFacts,
    referenceDocuments,
  })
  const discrepancyBlocksConfirmation = discrepancyReview.blocking
  const approvalSetupAvailable = qualityAcknowledged && Boolean(relatedDeal)
  const approvalRequestReady =
    approvalSetupAvailable &&
    missingRequiredCount === 0 &&
    saveComplete &&
    !discrepancyBlocksConfirmation &&
    selectedApprovers.length > 0
  const approvalRequestBlockReason = !qualityAcknowledged
    ? "PDF 검토를 완료하세요."
    : !relatedDeal
      ? "거래를 연결하세요."
      : selectedApprovers.length === 0
        ? "승인자를 선택하세요."
        : missingRequiredCount > 0
          ? `필수 항목 ${missingRequiredCount}개를 입력하세요.`
          : !saveComplete
            ? "변경사항 저장을 완료하세요."
            : discrepancyBlocksConfirmation
              ? "은행 거절 전 점검의 불일치 항목을 수정하고 다시 점검하세요."
              : "승인 요청을 준비하고 있습니다."

  const nextActionNotice = (() => {
    if (approvalRejected) {
      return {
        variant: "destructive" as const,
        icon: "rejection" as const,
        title:
          approvalPerspective === "requester"
            ? "승인이 반려되었습니다"
            : "반려 처리가 완료되었습니다",
        description:
          lastDecisionEvent?.reason ??
          "반려 사유를 확인하고 내용을 수정한 뒤 승인을 다시 요청하세요.",
        ...(approvalPerspective === "requester"
          ? {
              action: "rejection" as const,
              actionLabel: "사유 확인",
            }
          : {}),
      }
    }
    if (missingRequiredCount > 0) {
      return {
        variant: "caution" as const,
        icon: "warning" as const,
        title: `필수 항목 ${missingRequiredCount}개를 확인하세요`,
        description:
          "필수값을 모두 입력하고 저장해야 PDF 결과를 검토할 수 있습니다.",
        action: "edit" as const,
        actionLabel: "항목 수정",
      }
    }
    if (!saveComplete) {
      return {
        variant: "caution" as const,
        icon:
          saveState === "error" ? ("warning" as const) : ("saving" as const),
        title:
          saveState === "error" ? "저장에 실패했습니다" : "변경사항 저장 중",
        description:
          saveState === "error"
            ? "상단의 다시 저장을 눌러 저장을 완료하세요."
            : "저장이 끝나면 PDF 결과 검토를 진행할 수 있습니다.",
      }
    }
    if (!qualityAcknowledged) {
      return {
        variant: "blue" as const,
        icon: "review" as const,
        title: "PDF 결과를 검토하세요",
        description:
          "검토를 완료하면 거래 연결 여부와 관계없이 초안 PDF를 다운로드할 수 있습니다.",
        action: "review" as const,
        actionLabel: "검토 완료",
      }
    }
    if (dealConnectionRestricted) {
      return {
        variant: "gray" as const,
        icon: "restricted" as const,
        title: "연결된 거래의 접근 권한이 필요합니다",
        description:
          "초안 PDF는 다운로드할 수 있지만 문서 확정은 Deal 접근 권한이 있어야 진행할 수 있습니다.",
      }
    }
    if (!relatedDeal) {
      return {
        variant: "caution" as const,
        icon: "deal" as const,
        title: "문서를 확정하려면 거래를 연결하세요",
        description:
          "현재는 초안 PDF만 다운로드할 수 있습니다. 거래 연결 후 승인 방식과 확정 조건을 확인합니다.",
        action: "deal" as const,
        actionLabel: "거래 연결",
      }
    }
    if (discrepancyBlocksConfirmation) {
      return {
        variant: "destructive" as const,
        icon: "warning" as const,
        title: "은행 거절 전 점검에서 거절 위험이 확인되었습니다",
        description:
          "오류 항목을 수정한 뒤 다시 점검해야 문서를 확정할 수 있습니다.",
        action: "discrepancy" as const,
        actionLabel: "점검 결과 확인",
      }
    }
    if (approvalRequested) {
      return {
        variant: "blue" as const,
        icon: "approval" as const,
        title:
          approvalPerspective === "approver"
            ? "승인 요청을 검토하세요"
            : "승인을 기다리고 있습니다",
        description:
          approvalPerspective === "approver"
            ? "요청 내용을 확인한 뒤 승인하거나 반려 사유를 남겨주세요."
            : "승인자가 검토를 완료하면 문서 확정 버튼이 활성화됩니다.",
        ...(approvalPerspective === "approver"
          ? {
              action: "approval" as const,
              actionLabel: "승인 검토",
            }
          : {}),
      }
    }
    if (approvalChoice === "request" && !approvalDone) {
      return {
        variant: "caution" as const,
        icon: "approval" as const,
        title: "승인 요청을 완료하세요",
        description:
          "승인자를 선택해 요청하거나 ‘승인 없이 진행’을 선택해야 문서를 확정할 수 있습니다.",
        action: "approval" as const,
        actionLabel: "승인 설정",
      }
    }
    if (confirmationReady) {
      return {
        variant: "positive" as const,
        icon: "confirm" as const,
        title: "문서를 확정할 수 있습니다",
        description:
          "확정하면 문서와 PDF를 더 이상 수정할 수 없습니다. 내용을 마지막으로 확인하세요.",
        action: "confirm" as const,
        actionLabel: "문서 확정",
      }
    }
    return {
      variant: "caution" as const,
      icon: "warning" as const,
      title: "문서 확정 조건을 확인하세요",
      description: "문서 정보와 승인 상태를 확인한 뒤 확정을 진행하세요.",
    }
  })()

  const renderNextActionIcon = () => {
    switch (nextActionNotice.icon) {
      case "review":
        return <FileText className="size-4" />
      case "deal":
        return <Building2 className="size-4" />
      case "approval":
        return <ClipboardList className="size-4" />
      case "confirm":
        return <Check className="size-4" />
      case "restricted":
        return <ShieldCheck className="size-4" />
      case "saving":
        return <LoaderCircle className="size-4 animate-spin" />
      case "rejection":
      case "warning":
        return <AlertTriangle className="size-4" />
    }
  }

  const handleNextAction = () => {
    switch (nextActionNotice.action) {
      case "review":
        onAcknowledgeQuality()
        break
      case "deal":
        onOpenDealPicker()
        break
      case "edit":
        onReviewSource()
        break
      case "discrepancy":
        discrepancySectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
        break
      case "approval":
      case "rejection":
        approvalSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
        break
      case "confirm":
        onConfirmDocument()
        break
    }
  }

  const allReviewRows = buildDocumentReviewRows({
    missingRequiredCount,
    documentStyle,
    saveState,
    qualityAcknowledged,
    relatedDeal,
    dealConnectionRestricted,
    discrepancyReview: {
      ...discrepancyReview,
      blocking: discrepancyBlocksConfirmation,
    },
    approvalChoice,
    approvalStatus,
    selectedApproverCount: selectedApprovers.length,
    lastRequestEvent,
    lastDecisionEvent,
    confirmationReady,
    documentConfirmed,
    templateCode,
    documentNumber,
    approvalEnabled: true,
  })
  const getProgressRow = (
    sourceLabel: string,
    label = sourceLabel
  ): ReviewChecklistRow => {
    const row = allReviewRows.find((item) => item.label === sourceLabel)
    return row
      ? { ...row, label, action: undefined }
      : { label, value: "준비 전", state: "blocked" }
  }
  const approvalProgressRow: ReviewChecklistRow = {
    label: "승인",
    value:
      approvalChoice === "none"
        ? "승인 없음"
        : approvalDone
          ? `승인 완료${lastDecisionEvent ? ` · ${lastDecisionEvent.actor}` : ""}`
          : approvalRejected
            ? `반려 · ${lastDecisionEvent?.reason ?? "사유 확인 필요"}`
            : approvalRequested
              ? `승인 대기 · ${selectedApprovers.length}명`
              : approvalSetupAvailable
                ? "승인 방식 설정 전"
                : "PDF 검토·거래 연결 후 설정",
    state:
      approvalChoice === "none" || approvalDone
        ? "complete"
        : approvalRequested
          ? "pending"
          : "blocked",
  }
  const documentProgressRows: ReviewChecklistRow[] = [
    getProgressRow("문서 결과 검토", "PDF 검토"),
    getProgressRow("거래 연결"),
    approvalProgressRow,
    getProgressRow("문서 확정"),
    getProgressRow("공유 링크 생성"),
    getProgressRow("전달·공유"),
  ]
  const currentProgressIndex = documentProgressRows.findIndex(
    (row) => row.state !== "complete"
  )
  const progressComplete = currentProgressIndex === -1

  const renderDocumentProgressRow = (
    row: ReviewChecklistRow,
    index: number
  ) => {
    const isComplete = row.state === "complete"
    const isCurrent = index === currentProgressIndex
    const isError = isCurrent && row.label === "승인" && approvalRejected
    const statusClassName = isComplete
      ? "bg-success/10 text-success"
      : isError
        ? "bg-destructive/10 text-destructive"
        : isCurrent
          ? "bg-primary/10 text-primary"
          : "bg-muted text-muted-foreground"

    return (
      <div
        key={row.label}
        className="flex min-h-11 min-w-0 items-center gap-2.5 bg-background px-3 py-2.5 text-xs"
      >
        <span
          className={cn(
            "flex size-4.5 shrink-0 items-center justify-center rounded-full",
            statusClassName
          )}
        >
          {isComplete ? (
            <Check className="size-3" />
          ) : isError ? (
            <X className="size-3" />
          ) : isCurrent ? (
            <Clock3 className="size-3" />
          ) : (
            <span className="size-1.5 rounded-full bg-current" />
          )}
        </span>
        <span
          className={cn("shrink-0 font-medium", isCurrent && "text-primary")}
        >
          {row.label}
        </span>
        <span
          className="ml-auto min-w-0 truncate text-right text-muted-foreground"
          title={row.value}
        >
          {row.value}
        </span>
      </div>
    )
  }

  useEffect(() => {
    if (approvalPreviewState === "live" || approvalStatus === "idle") return
    approvalSectionRef.current?.scrollIntoView({ block: "start" })
  }, [approvalPreviewState, approvalStatus])

  useEffect(() => {
    if (!rejectEditorOpen) return
    approvalSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
    const frame = window.requestAnimationFrame(() =>
      rejectionReasonRef.current?.focus()
    )
    return () => window.cancelAnimationFrame(frame)
  }, [rejectEditorOpen])

  const applyLogoFiles = (files: File[]) => {
    const file = files[0]
    if (!file) return
    if (!(file.type === "image/png" || file.type === "image/jpeg")) {
      setLogoError("PNG, JPG 이미지 파일만 사용할 수 있습니다.")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("로고 파일이 너무 큽니다. 더 작은 이미지를 선택해 주세요.")
      return
    }
    setLogoError("")
    setLogoSourceMode("file")
    const reader = new FileReader()
    reader.onload = () =>
      onStyleChange({
        ...documentStyle,
        logo: {
          source: "file",
          name: file.name,
          dataUrl: String(reader.result),
        },
      })
    reader.readAsDataURL(file)
  }

  const handleCopyLink = (link: DeliveryLink) => {
    const url = `https://ecoya.app/share/${documentNumber.toLowerCase()}-${link.id}`
    void navigator.clipboard?.writeText(url)
    setCopiedLinkId(link.id)
    window.setTimeout(() => setCopiedLinkId(null), 1200)
  }
  const handleSendEmail = async () => {
    if (!activeLink) return
    setIsSending(true)
    const sent = await onSendEmail({
      linkCount: 1,
      recipient,
      subject,
      textBody,
      shareLinkId: String(activeLink.id),
    })
    setIsSending(false)
    if (sent) toast.success("이메일 발송 요청을 기록했습니다.")
  }

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-col bg-[var(--surface-background)]">
      <div className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-[var(--surface-border)] px-4 py-2.5 sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-semibold">
              {documentConfirmed ? "링크·이메일로 보내기" : "검토·확정"}
            </h2>
            <ToneBadge tone={documentConfirmed ? "success" : "warning"}>
              {documentConfirmed ? "확정" : "작성 중"}
            </ToneBadge>
          </div>
          {!documentConfirmed ? (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {templateTitle} · {documentNumber}.pdf · {documentDirection === "purchase" ? "구매" : documentDirection === "sales" ? "판매" : "방향 확인 필요"}
            </p>
          ) : null}
        </div>
        {documentConfirmed && shareMode === "link" ? (
          <Button
            size="sm"
            disabled={Boolean(activeLink)}
            onClick={onCreateMagicLink}
          >
            <Send data-icon="inline-start" />
            {activeLink ? "링크 생성됨" : "링크 만들기"}
          </Button>
        ) : documentConfirmed ? (
          <Button
            size="sm"
            disabled={
              !activeLink || !recipient.trim() || !subject.trim() || isSending
            }
            onClick={() => void handleSendEmail()}
          >
            {isSending ? (
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
            ) : (
              <Mail data-icon="inline-start" />
            )}
            {isSending ? "보내는 중" : "이메일 보내기"}
          </Button>
        ) : null}
      </div>

      <ScrollArea className="min-h-0 min-w-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:!block">
        {!documentConfirmed ? (
          <div className="flex flex-col gap-7 p-4 sm:p-5">
            <Alert
              variant={nextActionNotice.variant}
              className={cn(
                "order-first min-h-16 items-center",
                nextActionNotice.action && "pr-32"
              )}
            >
              {renderNextActionIcon()}
              <div className="min-w-0 flex-1">
                <AlertTitle className="text-xs font-semibold">
                  {nextActionNotice.title}
                </AlertTitle>
                <AlertDescription className="text-[11px] leading-5">
                  {nextActionNotice.description}
                </AlertDescription>
              </div>
              {nextActionNotice.action ? (
                <AlertAction className="top-1/2 right-3 -translate-y-1/2">
                  <Button
                    type="button"
                    variant={
                      nextActionNotice.action === "confirm"
                        ? "default"
                        : "outline"
                    }
                    size="xs"
                    className={cn(
                      nextActionNotice.action !== "confirm" && "bg-background"
                    )}
                    onClick={handleNextAction}
                  >
                    {nextActionNotice.actionLabel}
                  </Button>
                </AlertAction>
              ) : null}
            </Alert>

            <section className="@container order-1">
              <div className="text-sm font-semibold">문서 정보</div>
              <dl className="mt-2 grid gap-px overflow-hidden rounded-md border bg-[var(--surface-border)] text-xs @min-[560px]:grid-cols-2">
                {[
                  ["문서번호", documentNumber],
                  ["받는 곳", relatedDeal?.party ?? "미지정"],
                  ["계약금액", "2,566,660 USD"],
                  ["문서 완성도", "84 / 100"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="grid min-w-0 grid-cols-[88px_minmax(0,1fr)] items-center gap-3 bg-background px-3 py-2.5"
                  >
                    <dt className="text-[11px] text-muted-foreground">
                      {label}
                    </dt>
                    <dd className="truncate font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="order-2 rounded-md border bg-background p-3">
              <div className="text-sm font-semibold">문서 형태</div>
              <label className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span className="w-16 shrink-0 font-medium text-muted-foreground">문서 구성</span><Select value={documentStyle.archetype} onValueChange={value => onStyleChange({ ...documentStyle, archetype: value as DocumentStyle["archetype"] })}><SelectTrigger size="sm" className="min-w-0 flex-1" aria-label="문서 구성"><SelectValue /></SelectTrigger><SelectContent>{[["table", "테이블형"], ["letter", "번호조항 레터"], ["spec", "컴팩트 확인서"], ["formal", "정식 계약서"]].map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></label>
              <div className="mt-2">
                {organizationLogo ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">
                      로고
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      aria-pressed={logoSourceMode === "organization"}
                      className={cn(
                        "bg-background",
                        logoSourceMode === "organization" &&
                          "border-primary/60 text-primary ring-1 ring-primary/15"
                      )}
                      onClick={() => {
                        setLogoError("")
                        setLogoSourceMode("organization")
                        onStyleChange({
                          ...documentStyle,
                          logo: organizationLogo,
                        })
                      }}
                    >
                      {logoSourceMode === "organization" ? (
                        <Check data-icon="inline-start" />
                      ) : null}
                      기업 기본 로고
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      aria-pressed={logoSourceMode === "file"}
                      className={cn(
                        "bg-background",
                        logoSourceMode === "file" &&
                          "border-primary/60 text-primary ring-1 ring-primary/15"
                      )}
                      onClick={() => {
                        setLogoSourceMode("file")
                        if (documentStyle.logo?.source === "organization") {
                          onStyleChange({ ...documentStyle, logo: null })
                        }
                      }}
                    >
                      {logoSourceMode === "file" ? (
                        <Check data-icon="inline-start" />
                      ) : null}
                      새 로고 올리기
                    </Button>
                  </div>
                ) : null}
                {logoSourceMode === "file" || !organizationLogo ? (
                  <FileDropZone
                    accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                    aria-label="로고 파일 선택 또는 끌어놓기"
                    label="로고 파일 선택"
                    instructions="PNG, JPG"
                    onFiles={applyLogoFiles}
                    className={cn(
                      "min-h-10 flex-row justify-start gap-2 border-solid bg-background px-2.5 py-1.5 text-left",
                      organizationLogo && "mt-3"
                    )}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-background text-primary">
                      <Upload />
                    </span>
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="min-w-0 truncate text-xs font-semibold">
                        {documentStyle.logo?.source === "file"
                          ? documentStyle.logo.name
                          : "로고 파일 선택"}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        PNG, JPG
                      </span>
                    </span>
                    {documentStyle.logo?.source === "file" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={(event) => {
                          event.stopPropagation()
                          setLogoError("")
                          onStyleChange({ ...documentStyle, logo: null })
                        }}
                      >
                        제거
                      </Button>
                    ) : null}
                  </FileDropZone>
                ) : null}
                {logoError ? (
                  <div className="mt-2 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    {logoError}
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                  <span className="text-xs font-medium text-muted-foreground">
                    문서 스타일
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[
                      ["sans", "모던"],
                      ["serif", "클래식"],
                    ].map(([value, label]) => (
                      <Button
                        key={value}
                        variant="outline"
                        size="xs"
                        aria-pressed={documentStyle.fontStyle === value}
                        className={cn(
                          "min-w-16 bg-background",
                          documentStyle.fontStyle === value &&
                            "border-primary/60 text-primary ring-1 ring-primary/15"
                        )}
                        onClick={() =>
                          onStyleChange({
                            ...documentStyle,
                            fontStyle: value as DocumentStyle["fontStyle"],
                          })
                        }
                      >
                        {documentStyle.fontStyle === value ? (
                          <Check data-icon="inline-start" />
                        ) : null}
                        {label}
                      </Button>
                    ))}
                  </div>
                  <span className="ml-auto text-xs font-medium text-muted-foreground">
                    강조색
                  </span>
                  <div className="flex items-center gap-1.5">
                    {["#166dd7", "#0f766e", "#b45309", "#334155"].map(
                      (accent) => (
                        <button
                          key={accent}
                          type="button"
                          aria-label={`강조색 ${accent}`}
                          className={cn(
                            "size-6 rounded-full border-2 border-background shadow-sm ring-offset-1",
                            documentStyle.accent === accent &&
                              "ring-2 ring-primary"
                          )}
                          style={{ backgroundColor: accent }}
                          onClick={() =>
                            onStyleChange({ ...documentStyle, accent })
                          }
                        />
                      )
                    )}
                    <label className="relative size-6 cursor-pointer overflow-hidden rounded-full border-2 border-background shadow-sm ring-offset-1" aria-label="강조색 직접 선택">
                      <input
                        type="color"
                        value={documentStyle.accent}
                        onChange={(event) => onStyleChange({ ...documentStyle, accent: event.target.value })}
                        className="absolute inset-0 size-full cursor-pointer opacity-0"
                      />
                      <span className="absolute inset-0 rounded-full border border-dashed border-muted-foreground/60 bg-[conic-gradient(from_0deg,#ef4444,#f59e0b,#22c55e,#06b6d4,#3b82f6,#a855f7,#ef4444)]" />
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <div ref={discrepancySectionRef} className="order-3">
              <DocumentDiscrepancyPanel
                review={discrepancyReview}
                relatedDeal={relatedDeal}
                onReviewSource={onReviewSource}
              />
            </div>

            <section
              ref={approvalSectionRef}
              data-document-requirement="review"
              className="order-4 rounded-md border bg-background p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold">승인</div>
                {approvalStatus === "idle" ? (
                  <label className="flex cursor-pointer items-center gap-2 px-1 py-1 text-xs">
                    <Checkbox
                      className="!size-4"
                      checked={approvalChoice === "none"}
                      onCheckedChange={(checked) =>
                        onApprovalChoiceChange(
                          checked === true ? "none" : "request"
                        )
                      }
                      aria-label="승인 없이 진행"
                    />
                    <span className="font-medium">승인 없이 진행</span>
                  </label>
                ) : approvalRequested ? (
                  <ToneBadge tone="warning">승인 대기</ToneBadge>
                ) : approvalDone ? (
                  <ToneBadge tone="success">승인 완료</ToneBadge>
                ) : approvalRejected ? (
                  <ToneBadge tone="danger">반려</ToneBadge>
                ) : null}
              </div>

              {approvalInvalidated && <div role="status" className="mt-3 rounded-md bg-warning/10 px-3 py-2 text-xs leading-5"><ToneBadge tone="warning">승인 무효</ToneBadge><p className="mt-1">내용이 바뀌어 이전 승인 요청이 무효가 되었습니다. 변경한 내용을 검토한 후 승인을 다시 요청하세요.</p></div>}

              {approvalStatus === "idle" && approvalChoice === "request" ? (
                <div className="mt-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Popover
                      open={approverPickerOpen}
                      onOpenChange={setApproverPickerOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="min-w-0 flex-1 justify-between bg-background font-normal"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <Users className="size-3.5 text-muted-foreground" />
                            <span className="truncate">
                              {selectedApprovers.length === 0
                                ? "승인자 선택"
                                : `${selectedApprovers.length}명 선택`}
                            </span>
                          </span>
                          <ChevronDown data-icon="inline-end" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        className="w-[var(--radix-popover-trigger-width)] min-w-64 gap-0 p-1"
                      >
                        <div className="border-b px-2.5 py-2">
                          <div className="text-xs font-semibold">
                            승인자 선택
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto py-1">
                          {documentApproverOptions.map((approver) => {
                            const selected = selectedApproverIds.includes(
                              approver.id
                            )
                            return (
                              <Button
                                key={approver.id}
                                type="button"
                                variant="ghost"
                                className="h-auto w-full justify-start gap-2 rounded-sm px-2.5 py-2 font-normal"
                                aria-pressed={selected}
                                onClick={() => onApproverToggle(approver.id)}
                              >
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                                    selected
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-input text-transparent"
                                  )}
                                >
                                  <Check className="size-3" />
                                </span>
                                <span className="min-w-0 text-left">
                                  <span className="block truncate text-xs font-medium">
                                    {approver.name}
                                  </span>
                                  <span className="block text-[10px] text-muted-foreground">
                                    {approver.role}
                                  </span>
                                </span>
                              </Button>
                            )
                          })}
                        </div>
                        <div className="flex items-center gap-2 border-t px-2.5 py-2 text-[11px] text-muted-foreground">
                          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5">
                            <Checkbox
                              className="!size-4 after:-inset-2 [&_[data-slot=checkbox-indicator]>svg]:!size-3"
                              checked={rememberApprovers}
                              disabled={selectedApprovers.length === 0}
                              onCheckedChange={(checked) =>
                                onRememberApproversChange(checked === true)
                              }
                              aria-label="선택한 승인자를 기본 승인자로 기억"
                            />
                            <span className="truncate">
                              다음 문서에도 이 승인자 사용
                            </span>
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={() => setApproverPickerOpen(false)}
                          >
                            완료
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 bg-background"
                      disabled={!approvalRequestReady}
                      onClick={onRequestApproval}
                    >
                      승인 요청
                    </Button>
                  </div>
                  {!approvalRequestReady ? (
                    <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
                      {approvalRequestBlockReason}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {approvalRequested && approvalPerspective === "requester" ? (
                <div className="mt-3 rounded-md border border-warning/25 bg-warning/5 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <LoaderCircle className="size-3.5 animate-spin text-warning" />
                    승인 응답을 기다리고 있습니다
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedApprovers.map((approver) => (
                      <ToneBadge key={approver.id} tone="neutral">
                        {approver.name}
                      </ToneBadge>
                    ))}
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    조민영 요청 · {lastRequestEvent?.occurredAt ?? "-"}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    승인 전에는 문서를 확정할 수 없습니다.
                  </div>
                </div>
              ) : null}

              {approvalRequested &&
              approvalPerspective === "approver" &&
              actingApprover ? (
                <div className="mt-3 border-t pt-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold">
                        {templateTitle} · {documentNumber}.pdf
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        조민영 요청 · {lastRequestEvent?.occurredAt ?? "-"}
                      </div>
                    </div>
                    <ToneBadge tone="warning">결정 필요</ToneBadge>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3">
                    <div className="text-[11px] text-muted-foreground">
                      {actingApprover.name} · 승인자
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => setRejectEditorOpen(true)}
                      >
                        반려
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        onClick={() => onApprove(actingApprover)}
                      >
                        승인
                      </Button>
                    </div>
                  </div>
                  {rejectEditorOpen ? (
                    <div className="mt-3 border-t pt-3">
                      <Textarea
                        ref={rejectionReasonRef}
                        aria-label="반려 사유"
                        className="min-h-20 resize-none text-xs"
                        value={rejectionReason}
                        onChange={(event) =>
                          setRejectionReason(event.target.value)
                        }
                        placeholder="반려 사유를 입력하세요."
                      />
                      <div className="mt-2 flex justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setRejectEditorOpen(false)
                            setRejectionReason("")
                          }}
                        >
                          취소
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="xs"
                          disabled={!rejectionReason.trim()}
                          onClick={() => {
                            onReject(actingApprover, rejectionReason.trim())
                            setRejectEditorOpen(false)
                            setRejectionReason("")
                          }}
                        >
                          반려 확정
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {approvalDone &&
              lastDecisionEvent &&
              approvalPerspective === "requester" ? (
                <div className="mt-3 rounded-md border border-success/25 bg-success/5 px-3 py-2.5 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-success">
                    <Check className="size-3.5" /> 승인 완료
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {lastDecisionEvent.actor} · 승인자 ·{" "}
                    {lastDecisionEvent.occurredAt}
                  </div>
                </div>
              ) : null}

              {approvalDone &&
              lastDecisionEvent &&
              approvalPerspective === "approver" ? (
                <div className="mt-3 rounded-md border border-success/25 bg-success/5 px-3 py-2.5 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-success">
                    <Check className="size-3.5" /> 승인 처리 완료
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {lastDecisionEvent.actor} · {lastDecisionEvent.occurredAt}
                  </div>
                </div>
              ) : null}

              {approvalRejected && lastDecisionEvent ? (
                <div className="mt-3 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-xs">
                  <div className="font-semibold text-destructive">
                    {approvalPerspective === "requester"
                      ? "반려됨"
                      : "반려 처리 완료"}
                  </div>
                  <div className="mt-1 leading-5 text-foreground">
                    {lastDecisionEvent.reason}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {lastDecisionEvent.actor} · 승인자 ·{" "}
                    {lastDecisionEvent.occurredAt}
                  </div>
                  {approvalPerspective === "requester" ? (
                    <>
                      <div
                        className={cn(
                          "mt-3 grid gap-2",
                          approvalSetupAvailable && "grid-cols-2"
                        )}
                      >
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={onReviewSource}
                        >
                          항목 수정
                        </Button>
                        {approvalSetupAvailable ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!approvalRequestReady}
                            onClick={onRequestApproval}
                          >
                            승인 재요청
                          </Button>
                        ) : null}
                      </div>
                      {!approvalRequestReady ? (
                        <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
                          {approvalRequestBlockReason}
                        </p>
                      ) : null}
                    </>
                  ) : null}
                </div>
              ) : null}

              {approvalEvents.length > 0 ? (
                <div className="mt-3 border-t pt-3">
                  <div className="text-[11px] font-medium text-muted-foreground">
                    승인 이력
                  </div>
                  <div className="mt-2 grid gap-1.5">
                    {approvalEvents.map((event, index) => {
                      const isRetryRequest =
                        event.type === "request" &&
                        approvalEvents
                          .slice(0, index)
                          .some((previous) => previous.type === "request")
                      return (
                        <div
                          key={event.id}
                          className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 text-[11px]"
                        >
                          <ToneBadge
                            tone={
                              event.type === "approve"
                                ? "success"
                                : event.type === "reject"
                                  ? "danger"
                                  : event.type === "invalidate" ? "warning" : event.type === "edit" ? "neutral" : "blue"
                            }
                          >
                            {event.type === "approve"
                              ? "승인"
                              : event.type === "reject"
                                ? "반려"
                                : event.type === "invalidate" ? "승인 무효" : event.type === "edit" ? "수정" : isRetryRequest
                                  ? "재요청"
                                  : "요청"}
                          </ToneBadge>
                          <span className="truncate text-muted-foreground">
                            {event.actor} · {event.actorRole}
                          </span>
                          <span className="text-muted-foreground">
                            {event.occurredAt}
                          </span>
                          <span className="col-span-2 col-start-2 leading-5 text-foreground">
                            {event.type === "request"
                              ? `승인 대상 · ${selectedApprovers
                                  .map((approver) => approver.name)
                                  .join(", ")}`
                              : event.type === "approve"
                                ? "승인 처리 완료"
                                : event.type === "reject" ? `반려 사유 · ${event.reason ?? "사유 없음"}` : event.reason}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </section>

            <section className="order-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">문서 진행 상태</div>
                <ToneBadge tone={progressComplete ? "success" : "blue"}>
                  {progressComplete ? "완료" : "진행 중"}
                </ToneBadge>
              </div>
              <div className="mt-2 overflow-hidden rounded-md border bg-[var(--surface-border)]">
                <div className="grid grid-cols-1 gap-px sm:grid-cols-2">
                  {documentProgressRows.map(renderDocumentProgressRow)}
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-5 p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-1 rounded-md border bg-background p-1">
              {[
                ["link", "공유 링크"],
                ["email", "이메일 보내기"],
              ].map(([value, label]) => (
                <Button
                  key={value}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 text-xs",
                    shareMode === value && "bg-background shadow-sm"
                  )}
                  onClick={() => setShareMode(value as "link" | "email")}
                >
                  {label}
                </Button>
              ))}
            </div>

            <section className="rounded-lg border bg-background p-4 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold">전달 패키지</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    본문 PDF + 거래 첨부 1개
                  </div>
                </div>
                <ToneBadge tone="success">준비 완료</ToneBadge>
              </div>
              <div className="mt-3 grid gap-2 text-xs">
                {[`${documentNumber}.pdf`, "인보이스_2607_003.pdf"].map(
                  (file, index) => (
                    <div
                      key={file}
                      className="flex items-center gap-2 rounded-md border bg-background px-3 py-2"
                    >
                      <FileText className="size-3.5 text-primary" />
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {file}
                      </span>
                      <ToneBadge tone={index === 0 ? "success" : "neutral"}>
                        {index === 0 ? "본문" : "동봉"}
                      </ToneBadge>
                    </div>
                  )
                )}
              </div>
            </section>

            {shareMode === "link" ? (
              <section>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold">공유 링크</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      만료일과 열람 횟수가 적용된 고객용 링크입니다.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ToneBadge tone={activeLink ? "success" : "warning"}>
                      {activeLink ? "활성" : "미생성"}
                    </ToneBadge>
                  </div>
                </div>
                {activeLink ? (
                  <div className="mt-3 rounded-lg border bg-background p-3">
                    <div className="truncate text-xs font-semibold text-primary">
                      {`https://ecoya.app/share/${documentNumber.toLowerCase()}-${activeLink.id}`}
                    </div>
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      {activeLink.opens}/{activeLink.maxOpens}회 열람 ·{" "}
                      {activeLink.expires} 만료
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(activeLink)}
                      >
                        <Copy data-icon="inline-start" />
                        {copiedLinkId === activeLink.id
                          ? "복사됨"
                          : "링크 복사"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRevokeMagicLink(activeLink.id)}
                      >
                        링크 철회
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg border bg-background p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="grid gap-1">
                        <span className="text-[11px] text-muted-foreground">
                          만료일
                        </span>
                        <Input className="h-8" defaultValue="2026.07.22" />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-[11px] text-muted-foreground">
                          최대 열람
                        </span>
                        <Input className="h-8" defaultValue="10회" />
                      </label>
                    </div>
                  </div>
                )}
              </section>
            ) : (
              <section>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold">이메일 보내기</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      활성 공유 링크를 본문에 포함합니다.
                    </p>
                  </div>
                  <ToneBadge tone={activeLink ? "success" : "warning"}>
                    {activeLink ? "링크 포함" : "링크 필요"}
                  </ToneBadge>
                </div>
                <div className="mt-3 grid gap-2">
                  <label className="grid gap-1">
                    <span className="text-[11px] text-muted-foreground">
                      받는 사람
                    </span>
                    <Input
                      value={recipient}
                      onChange={(event) => setRecipient(event.target.value)}
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-[11px] text-muted-foreground">
                      제목
                    </span>
                    <Input
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                    />
                  </label>
                  <Textarea
                    className="min-h-32 resize-none text-xs leading-5"
                    value={textBody}
                    onChange={(event) => setTextBody(event.target.value)}
                  />
                </div>
              </section>
            )}
          </div>
        )}
      </ScrollArea>
    </aside>
  )
}

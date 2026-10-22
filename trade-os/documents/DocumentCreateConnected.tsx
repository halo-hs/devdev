import { type DocumentLogo, templateSchemas, templateMeta, type DocumentStyle, sampleSlotValues } from "@trade-os/documents/documentTemplateModel"
import { type DeliveryAttachment } from "@trade-os/documents/DeliveryAttachmentPicker"
import { useState, useRef, useCallback, useEffect } from "react"
import { type GeneratedDocumentMetadata, generatedDocumentStatusLabel } from "@trade-os/lib/generatedDocumentMetadata"
import { useIsCompactWorkspace } from "@/hooks/useIsMobile"
import { toast } from "sonner"
import { prototypeBackend } from "@trade-os/lib/prototypeBackend"
import { focusDocumentRequirement } from "@trade-os/lib/documentRequirementNavigation"
import { type DocumentBlockingIssue, DocumentBlockingAlerts } from "@trade-os/components/DocumentBlockingAlerts"
import { DocumentSourceSetupStep } from "@trade-os/documents/DocumentCreateStepViews"
import { CreateFieldReviewPanel, DocumentConfirmedSummaryPanel, TemplateStrip } from "@trade-os/documents/DocumentCreatePanels"
import { FileText, ChevronLeft, ChevronRight, Building2, Check, Search } from "lucide-react"
import { DocumentStage } from "@trade-os/components/DocumentStage"
import { ToneBadge } from "@trade-os/components/ToneBadge"
import { DocumentReviewSharePanel } from "@trade-os/documents/DocumentSharePanel"
import { BusinessPageHero } from "@/components/ds2/molecule/HeroBanner"
import { Button } from "@/components/ui/button"
import { DocumentSaveSummary } from "@trade-os/components/DocumentSaveSummary"
import { PdfPanelWorkspaceCard, PdfPanelResizeHandle } from "@/components/platform/PdfPanelResizeHandle"
import { cn } from "@/lib/utils"
import { ResizablePanelGroup, ResizablePanel } from "@/components/ui/resizable"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { ShareDeliveryPanel } from "@trade-os/documents/DocumentDeliverConnected"
import { type DocumentApprover, type DocumentDiscrepancyReview, type DocumentDiscrepancyFinding, type ReviewFocusTarget, type DocumentDirection, type DocumentApprovalPreviewState, type DealDocumentContext, type DocumentCreateWorkspaceStep, type GeneratedDocumentPdfState, type ErpPreviewRole, type DocumentElementStatus, type DocumentSourceMode, type DocumentComparisonFacts, type DocumentApprovalChoice, type DocumentApprovalEvent, type DeliveryLink, type EmailRecord, type DocumentSaveState, type ReviewFocusRequest, type DocumentSourceDeal } from "@/App"
import { documentApproverOptions, getGeneratedDocumentsForDeal, generatedDrafts, documentSourceDeals, buildDocumentDiscrepancyReview, normalizeComparisonText } from "@trade-os/documents/documentTemplateModel"

const defaultDocumentApproversStorageKey = "ecoya:document-default-approver-ids"

const readDefaultDocumentApproverIds = () => {
  if (typeof window === "undefined") return []
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(defaultDocumentApproversStorageKey) ?? "[]"
    )
    if (!Array.isArray(stored)) return []
    const validIds = new Set<string>(
      documentApproverOptions.map((item) => item.id)
    )
    return stored.filter(
      (id): id is string => typeof id === "string" && validIds.has(id)
    )
  } catch {
    return []
  }
}

const writeDefaultDocumentApproverIds = (ids: string[]) => {
  if (typeof window === "undefined") return
  try {
    if (ids.length === 0) {
      window.localStorage.removeItem(defaultDocumentApproversStorageKey)
      return
    }
    window.localStorage.setItem(
      defaultDocumentApproversStorageKey,
      JSON.stringify(ids)
    )
  } catch {
    // 브라우저 저장소를 사용할 수 없어도 현재 문서의 선택은 유지합니다.
  }
}

const formatApprovalDateTime = (date = new Date()) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)

// 실제 연동 시 기업 기본정보의 로고 값으로 교체합니다.
// 등록된 로고가 없으면 문서 만들기에서는 새 로고 입력 UI를 기본으로 엽니다.
const organizationDefaultDocumentLogo: DocumentLogo | null = null

const dealReferenceDocumentCatalog: Record<string, readonly string[]> = {
  "DL-260708-08": ["SC-2026-0708.pdf"],
  "DL-260707-04": [
    "PO-260704-18.pdf",
    "SC-2026-0708.pdf",
    "Invoice_HB-2607-003.pdf",
    "PackingList_0707.pdf",
  ],
}

const getReferenceDocumentsForDeal = (dealId: string) =>
  Array.from(
    new Set([
      ...(dealReferenceDocumentCatalog[dealId] ?? []),
      ...getGeneratedDocumentsForDeal(dealId).map(
        (document) => `${document.number}.pdf`
      ),
    ])
  )

const reviewBasisHint = (review: DocumentDiscrepancyReview) =>
  review.errorCount > 0
    ? "은행 거절 전 점검의 불일치 항목을 수정하고 다시 점검하세요."
    : review.basisMessage

const discrepancyReviewFocusTargets = (
  templateCode: string,
  findings: DocumentDiscrepancyFinding[]
): ReviewFocusTarget[] => {
  const schema = templateSchemas[templateCode] ?? templateSchemas.SC
  const slotKeys = new Set(schema.slots.map((slot) => slot.key))
  const counterpartyKey = [
    "buyer_name",
    "customer_name",
    "supplier_name",
    "counterparty_name",
    "consignee_name",
    "applicant_name",
    "importer_name",
    "recipient_name",
    "seller_name",
  ].find((key) => slotKeys.has(key))
  const targets = findings
    .filter((finding) => finding.state !== "pass")
    .flatMap<ReviewFocusTarget>((finding) => {
      switch (finding.key) {
        case "counterparty":
          return counterpartyKey
            ? [{ key: counterpartyKey, label: finding.label }]
            : []
        case "currency":
          return slotKeys.has("currency")
            ? [{ key: "currency", label: finding.label }]
            : []
        case "recipient-account":
          return ["bank_name", "bank_account"]
            .filter((key) => slotKeys.has(key))
            .map((key) => ({ key, label: finding.label }))
        case "amount":
          return schema.lineItems
            ? [{ key: "item_amount", label: finding.label }]
            : []
        case "goods":
          return schema.lineItems
            ? [{ key: "item_name", label: finding.label }]
            : []
        default:
          return []
      }
    })

  return Array.from(
    new Map(targets.map((target) => [target.key, target])).values()
  )
}

export function ResultScreen({
  initialTemplateCode,
  initialDirection = null,
  initialDocumentNumber,
  approvalPreviewState = "live",
  initialDocumentConfirmed = false,
  initialSharePanelOpen = false,
  initialLinkCreated = false,
  initialShareCompleted = false,
  initialDeliveryAttachments,
  relatedDeal = null,
  initialWorkspaceStep = "editor",
  initialPdfState = "draft",
  onBackToList,
  onDuplicateConfirmed,
  onDocumentConfirmed,
  role = "owner",
  dealConnectionRestricted = false,
}: {
  initialTemplateCode: string
  initialDirection?: DocumentDirection | null
  initialDocumentNumber?: string | null
  approvalPreviewState?: DocumentApprovalPreviewState
  initialDocumentConfirmed?: boolean
  initialSharePanelOpen?: boolean
  initialLinkCreated?: boolean
  initialShareCompleted?: boolean
  initialDeliveryAttachments?: readonly DeliveryAttachment[]
  relatedDeal?: DealDocumentContext | null
  initialWorkspaceStep?: DocumentCreateWorkspaceStep
  initialPdfState?: GeneratedDocumentPdfState
  onBackToList?: () => void
  onDocumentConfirmed?: () => void
  onDuplicateConfirmed?: (direction: DocumentDirection | null) => void
  role?: ErpPreviewRole
  memberCanDeliver?: boolean
  dealConnectionRestricted?: boolean
}) {
  const [templateCode, setTemplateCode] = useState(initialTemplateCode)
  const [documentDirection, setDocumentDirection] = useState(initialDirection)
  const [deliveryAttachments, setDeliveryAttachments] = useState<DeliveryAttachment[]>(() => initialDeliveryAttachments ? [...initialDeliveryAttachments] : [{ id: "att-1", name: "인보이스_2607_003.pdf", source: "인박스", kind: "인보이스", sizeBytes: 310_000 }])
  const templateSelected = Boolean(
    templateCode && templateSchemas[templateCode]
  )
  const templateTitle = templateSelected
    ? templateMeta(templateCode)[1]
    : "문서 종류 미선택"
  const documentNumber = initialDocumentNumber?.startsWith(`${templateCode}-`)
    ? initialDocumentNumber
    : `${templateCode}-2026-0708`
  const initialDraft = initialDocumentNumber
    ? generatedDrafts.find((draft) => draft.number === initialDocumentNumber)
    : undefined
  const [savedMetadata, setSavedMetadata] = useState<GeneratedDocumentMetadata | null>(
    () => initialDraft?.documentMetadata ?? null
  )
  const confirmedAtStart =
    savedMetadata?.status === "confirmed" || savedMetadata?.status === "sent" ||
    initialDocumentConfirmed ||
    initialSharePanelOpen ||
    initialLinkCreated ||
    initialShareCompleted
  // All active Trade OS roles may deliver an organization-owned confirmed document.
  const deliveryAllowed = true
  const approvalPreviewRequested = approvalPreviewState !== "live"
  const approvalPreviewStatus: DocumentElementStatus["approval"] =
    approvalPreviewState === "requester-approved"
      ? "approved"
      : approvalPreviewState === "requester-rejected"
        ? "rejected"
        : approvalPreviewRequested
          ? "requested"
          : "idle"
  const [documentStyle, setDocumentStyle] = useState<DocumentStyle>({
    archetype: "table",
    fontStyle: "sans",
    accent: "#166dd7",
    logo: organizationDefaultDocumentLogo,
  })
  const [documentConfirmed, setDocumentConfirmed] = useState(confirmedAtStart)
  const documentStatusLabel = generatedDocumentStatusLabel(savedMetadata?.status, documentConfirmed)
  const isMobile = useIsCompactWorkspace()
  const [workspaceStep, setWorkspaceStep] =
    useState<DocumentCreateWorkspaceStep>(
      initialWorkspaceStep === "source" ? "source" : "editor"
    )
  const [pdfPrepared, setPdfPrepared] = useState(
    initialPdfState !== "none" || confirmedAtStart
  )
  const [hasPreparedPdf, setHasPreparedPdf] = useState(
    initialPdfState !== "none" || confirmedAtStart
  )
  const [sourceMode, setSourceMode] = useState<DocumentSourceMode>(
    relatedDeal ? "deal" : "files"
  )
  const [selectedDeal, setSelectedDeal] = useState<DealDocumentContext | null>(
    relatedDeal
  )
  const [selectedSources, setSelectedSources] = useState<Set<string>>(
    () => new Set()
  )
  const [naturalLanguagePrompt, setNaturalLanguagePrompt] = useState("")
  const [appliedSourceKey, setAppliedSourceKey] = useState(() =>
    relatedDeal && initialTemplateCode
      ? [initialTemplateCode, "", "", relatedDeal.id].join("::")
      : ""
  )
  const [appliedSourceLabel, setAppliedSourceLabel] = useState(
    relatedDeal?.id ?? "아직 반영된 내용 없음"
  )
  const [itemCount, setItemCount] = useState(0)
  const [requiredIssues, setRequiredIssues] = useState<ReviewFocusTarget[]>([])
  const missingRequiredCount = requiredIssues.length
  const [comparisonFacts, setComparisonFacts] =
    useState<DocumentComparisonFacts | null>({
      counterparty: "ACME GmbH",
      currency: "USD",
      bankName: sampleSlotValues.bank_name,
      bankAccount: sampleSlotValues.bank_account,
      itemNames: ["Aluminium Scrap Tough Taboo"],
      totalAmount: "2566660",
    })
  const [approvalStatus, setApprovalStatus] = useState<
    DocumentElementStatus["approval"]
  >(approvalPreviewStatus)
  const [approvalChoice, setApprovalChoice] = useState<DocumentApprovalChoice>(
    approvalPreviewRequested || !confirmedAtStart ? "request" : "none"
  )
  const [selectedApproverIds, setSelectedApproverIds] = useState<string[]>(
    () =>
      approvalPreviewRequested
        ? ["park-seoyoon", "kim-dohyun"]
        : readDefaultDocumentApproverIds()
  )
  const [rememberApprovers, setRememberApprovers] = useState(
    () => readDefaultDocumentApproverIds().length > 0
  )
  const [approvalEvents, setApprovalEvents] = useState<DocumentApprovalEvent[]>(
    () => {
      if (!approvalPreviewRequested) return []
      const events: DocumentApprovalEvent[] = [
        {
          id: 1,
          type: "request",
          actor: "조민영",
          actorRole: "작성자",
          occurredAt: "2026.09.01 13:42",
        },
      ]
      if (approvalPreviewState === "requester-approved") {
        events.push({
          id: 2,
          type: "approve",
          actor: "박서윤",
          actorRole: "Owner",
          occurredAt: "2026.09.01 14:08",
        })
      }
      if (approvalPreviewState === "requester-rejected") {
        events.push({
          id: 2,
          type: "reject",
          actor: "김도현",
          actorRole: "Admin",
          occurredAt: "2026.09.01 14:08",
          reason:
            "받는 곳과 결제조건을 원문 기준으로 다시 확인한 뒤 재요청해 주세요.",
        })
      }
      return events
    }
  )
  const [magicLinks, setMagicLinks] = useState<DeliveryLink[]>(() =>
    initialLinkCreated || initialShareCompleted
      ? [
          {
            id: 1,
            recipient: relatedDeal?.party ?? "ACME GmbH",
            status: "active",
            expires: "2026.08.31",
            opens: 3,
            maxOpens: 10,
            createdAt: "2026.08.28 14:20",
          },
        ]
      : []
  )
  const [emailRecords, setEmailRecords] = useState<EmailRecord[]>(() =>
    initialShareCompleted
      ? [
          {
            id: 1,
            recipient: "ops@acme.example",
            subject: `[ECOYA] ${templateTitle} 전달`,
            sentAt: "2026.08.28 14:32",
            linkCount: 1,
            status: "requested",
            attempts: 1,
          },
        ]
      : []
  )
  const [sharePanelOpen, setSharePanelOpen] = useState(
    initialSharePanelOpen && deliveryAllowed
  )
  const [dealPickerOpen, setDealPickerOpen] = useState(false)
  const [dealPickerQuery, setDealPickerQuery] = useState("")
  const [saveState, setSaveState] = useState<DocumentSaveState>("saved")
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    () => initialDraft?.documentMetadata?.updated_at ?? initialDraft?.updated ?? null
  )
  const [documentRevision, setDocumentRevision] = useState(0)
  const [reviewedDocumentRevision, setReviewedDocumentRevision] = useState<
    number | null
  >(
    confirmedAtStart || initialPdfState === "reviewed"
      ? 0
      : null
  )
  const [mobilePane, setMobilePane] = useState<"left" | "right">("left")
  const [reviewFocusRequest, setReviewFocusRequest] =
    useState<ReviewFocusRequest | null>(null)
  const workspaceRootRef = useRef<HTMLDivElement | null>(null)
  const draftRevisionRef = useRef(0)
  const savedDraftRevisionRef = useRef(0)
  const draftSaveInFlightRef = useRef<Promise<boolean> | null>(null)
  const approvalEventSequenceRef = useRef(
    approvalPreviewState === "requester-approved" ||
      approvalPreviewState === "requester-rejected"
      ? 2
      : approvalPreviewRequested
        ? 1
        : 0
  )
  const approvalStatusRef = useRef(approvalStatus)
  const markDocumentChanged = useCallback((newDraft = false) => {
    const previousApproval = approvalStatusRef.current
    if (newDraft) approvalStatusRef.current = "idle"
    else if (previousApproval !== "idle") {
      approvalStatusRef.current = "idle"
      setApprovalStatus("idle")
      const occurredAt = formatApprovalDateTime()
      const editId = ++approvalEventSequenceRef.current
      const invalidateId = ++approvalEventSequenceRef.current
      setApprovalEvents(events => [
        ...events,
        { id: editId, type: "edit", actor: "조민영", actorRole: "작성자", occurredAt, reason: "문서 내용 또는 구성이 변경되었습니다." },
        ...(previousApproval === "requested" || previousApproval === "approved" ? [{ id: invalidateId, type: "invalidate" as const, actor: "조민영", actorRole: "작성자" as const, occurredAt, reason: "내용 변경으로 이전 승인이 무효가 되었습니다." }] : []),
      ])
    }
    draftRevisionRef.current += 1
    setDocumentRevision((revision) => revision + 1)
    setSaveState("unsaved")
  }, [])
  const connectDealFromReview = (deal: DocumentSourceDeal) => {
    const previousDeal = selectedDeal
    const replacingDeal = Boolean(previousDeal && previousDeal.id !== deal.id)
    setSelectedDeal(deal)
    setDealPickerOpen(false)
    if (!previousDeal || replacingDeal) markDocumentChanged()
    toast.success(
      replacingDeal
        ? `${previousDeal?.id}에서 ${deal.id} 거래로 변경했습니다.`
        : `${deal.id} 거래를 문서에 연결했습니다.`
    )
  }
  const disconnectDealFromReview = () => {
    if (!selectedDeal) return
    const previousId = selectedDeal.id
    setSelectedDeal(null)
    setDealPickerOpen(false)
    if (sourceMode === "deal") setSourceMode("files")
    markDocumentChanged()
    toast.success(`${previousId} 거래 연결을 해제했습니다.`)
  }
  const handleItemCountChange = useCallback((count: number) => {
    setItemCount(count)
  }, [])
  const handleRequiredMissingChange = useCallback((issues: ReviewFocusTarget[]) => {
    setRequiredIssues(issues)
  }, [])
  const handleComparisonFactsChange = useCallback(
    (facts: DocumentComparisonFacts) => {
      setComparisonFacts(facts)
    },
    []
  )
  const appendApprovalEvent = useCallback(
    (
      type: DocumentApprovalEvent["type"],
      actor: string,
      actorRole: DocumentApprovalEvent["actorRole"],
      reason?: string
    ) => {
      approvalEventSequenceRef.current += 1
      setApprovalEvents((events) => [
        ...events,
        {
          id: approvalEventSequenceRef.current,
          type,
          actor,
          actorRole,
          occurredAt: formatApprovalDateTime(),
          reason,
        },
      ])
    },
    []
  )
  const handleApprovalChoiceChange = (choice: DocumentApprovalChoice) => {
    if (approvalStatus !== "idle") return
    setApprovalChoice(choice)
    if (choice === "none") {
      toast.info(
        "승인 없음으로 설정했습니다. 승인 요청·결과가 완료 처리됩니다."
      )
    }
  }
  const handleApproverToggle = (approverId: string) => {
    if (approvalStatus !== "idle") return
    const nextApproverIds = selectedApproverIds.includes(approverId)
      ? selectedApproverIds.filter((id) => id !== approverId)
      : [...selectedApproverIds, approverId]
    setSelectedApproverIds(nextApproverIds)
    if (rememberApprovers) {
      writeDefaultDocumentApproverIds(nextApproverIds)
      if (nextApproverIds.length === 0) setRememberApprovers(false)
    }
  }
  const handleRememberApproversChange = (remember: boolean) => {
    if (approvalStatus !== "idle" || selectedApproverIds.length === 0) return
    setRememberApprovers(remember)
    writeDefaultDocumentApproverIds(remember ? selectedApproverIds : [])
    toast.info(
      remember
        ? "선택한 승인자를 기본 승인자로 저장했습니다."
        : "기본 승인자 저장을 해제했습니다."
    )
  }
  const handleRequestApproval = () => {
    if (approvalChoice !== "request" || selectedApproverIds.length === 0) return
    approvalStatusRef.current = "requested"
    setApprovalStatus("requested")
    appendApprovalEvent("request", "조민영", "작성자")
    toast.success(
      `Owner·Admin ${selectedApproverIds.length}명에게 요청했습니다.`
    )
  }
  const handleApproveDocument = (approver: DocumentApprover) => {
    if (
      approvalStatus !== "requested" ||
      !selectedApproverIds.includes(approver.id)
    )
      return
    approvalStatusRef.current = "approved"
    setApprovalStatus("approved")
    appendApprovalEvent("approve", approver.name, approver.role)
    toast.success("승인이 완료되었습니다. 문서를 확정할 수 있습니다.")
  }
  const handleRejectDocument = (approver: DocumentApprover, reason: string) => {
    if (
      approvalStatus !== "requested" ||
      !selectedApproverIds.includes(approver.id) ||
      !reason.trim()
    )
      return
    approvalStatusRef.current = "rejected"
    setApprovalStatus("rejected")
    appendApprovalEvent("reject", approver.name, approver.role, reason.trim())
    toast.error("문서가 반려되었습니다. 사유를 확인하고 재요청하세요.")
  }
  const sourceReady =
    templateSelected &&
    (naturalLanguagePrompt.trim().length > 0 ||
      Boolean(selectedDeal) ||
      selectedSources.size > 0)
  const connectedSourceLabels = [
    selectedSources.size > 0 ? Array.from(selectedSources).join(", ") : "",
    selectedDeal?.id ?? "",
  ].filter(Boolean)
  const sourceLabel =
    connectedSourceLabels.length > 0
      ? connectedSourceLabels.join(" · ")
      : naturalLanguagePrompt.trim()
        ? "자연어 요청"
        : "자연어 직접 입력"
  const currentSourceKey = [
    templateCode,
    naturalLanguagePrompt.trim(),
    Array.from(selectedSources).sort().join("|"),
    selectedDeal?.id ?? "",
  ].join("::")
  const sourceChangesPending =
    sourceReady && currentSourceKey !== appliedSourceKey
  const selectedDealFacts = selectedDeal
    ? (documentSourceDeals.find((deal) => deal.id === selectedDeal.id) ?? null)
    : null
  const referenceDocuments = Array.from(
    new Set(selectedDeal ? getReferenceDocumentsForDeal(selectedDeal.id) : [])
  ).filter((name) => name !== `${documentNumber}.pdf`)
  const discrepancyReview = buildDocumentDiscrepancyReview({
    templateCode,
    comparisonFacts,
    relatedDeal: selectedDeal,
    dealFacts: selectedDealFacts,
    referenceDocuments,
  })
  const discrepancyIssueTargets = discrepancyReviewFocusTargets(
    templateCode,
    discrepancyReview.findings.filter((finding) => finding.state === "error")
  )
  const discrepancyBlocksConfirmation = discrepancyReview.blocking
  const draftReady = templateSelected && missingRequiredCount === 0 &&
    !discrepancyBlocksConfirmation && saveState !== "error"
  const reviewDealOptions = [...documentSourceDeals].sort((left, right) => {
    const targetParty = normalizeComparisonText(
      comparisonFacts?.counterparty ?? ""
    )
    if (!targetParty) return 0
    const leftMatches = normalizeComparisonText(left.party) === targetParty
    const rightMatches = normalizeComparisonText(right.party) === targetParty
    return Number(rightMatches) - Number(leftMatches)
  })
  const filteredReviewDeals = reviewDealOptions.filter((deal) =>
    [deal.id, deal.title, deal.party].some((value) =>
      value.toLocaleLowerCase().includes(dealPickerQuery.trim().toLocaleLowerCase())
    )
  )
  const qualityAcknowledged = reviewedDocumentRevision === documentRevision
  const confirmationReady =
    Boolean(selectedDeal) &&
    qualityAcknowledged &&
    missingRequiredCount === 0 &&
    saveState === "saved" &&
    !discrepancyBlocksConfirmation &&
    (approvalChoice === "none" || approvalStatus === "approved")
  const confirmationBlockReason = !selectedDeal
    ? "거래를 먼저 연결해야 문서를 확정할 수 있습니다."
    : missingRequiredCount > 0
      ? `필수 항목 ${missingRequiredCount}개를 입력해야 합니다.`
      : saveState !== "saved"
        ? "변경사항 저장이 끝나면 문서를 확정할 수 있습니다."
        : discrepancyBlocksConfirmation
          ? reviewBasisHint(discrepancyReview)
          : !qualityAcknowledged
            ? "PDF 결과 검토를 완료해야 합니다."
            : approvalChoice === "request" && approvalStatus === "idle"
              ? "승인을 요청하고 승인을 받아야 합니다."
              : approvalStatus === "requested"
                ? "승인 검토가 끝나면 문서를 확정할 수 있습니다."
                : approvalStatus === "rejected"
                  ? "반려 사유를 반영한 뒤 승인을 다시 요청해야 합니다."
                  : "문서를 확정할 수 있습니다."
  const handleDocumentReviewComplete = () => {
    setReviewedDocumentRevision(documentRevision)
    toast.success(
      "PDF 검토를 완료했습니다. 거래 연결 없이 초안 PDF를 다운로드할 수 있습니다."
    )
  }

  useEffect(() => {
    workspaceRootRef.current?.scrollIntoView({ block: "start" })
  }, [workspaceStep])
  const persistDocumentDraft = useCallback(() => {
    if (draftSaveInFlightRef.current) return draftSaveInFlightRef.current
    if (draftRevisionRef.current === savedDraftRevisionRef.current) {
      return Promise.resolve(true)
    }
    const revision = draftRevisionRef.current
    setSaveState("saving")
    const request = Promise.all([
      prototypeBackend.generatedDocuments.saveDraft({
        id: documentNumber,
      }),
      new Promise<void>((resolve) => window.setTimeout(resolve, 800)),
    ])
      .then(([result]) => {
        if (!result.ok) {
          setSaveState("error")
          return false
        }
        savedDraftRevisionRef.current = revision
        setSavedMetadata(result.document ?? null)
        setLastSavedAt(result.document?.updated_at ?? result.updatedAt)
        if (draftRevisionRef.current === revision) {
          setSaveState("saved")
        } else {
          setSaveState("unsaved")
        }
        return true
      })
      .catch(() => {
        setSaveState("error")
        return false
      })
      .finally(() => {
        draftSaveInFlightRef.current = null
      })
    draftSaveInFlightRef.current = request
    return request
  }, [documentNumber])
  useEffect(() => {
    if (saveState !== "unsaved") return
    const timer = window.setTimeout(() => void persistDocumentDraft(), 1000)
    return () => window.clearTimeout(timer)
  }, [persistDocumentDraft, saveState])
  const handleConfirmDocument = () => {
    if (!confirmationReady) return
    setDocumentConfirmed(true)
    onDocumentConfirmed?.()
    setSharePanelOpen(deliveryAllowed)
    toast.success(
      deliveryAllowed
        ? "문서를 확정해 수정을 잠갔습니다. 공유 설정을 열었습니다."
        : "문서를 확정해 수정을 잠갔습니다."
    )
  }
  const applySourceToFields = () => {
    if (!sourceReady) return
    setAppliedSourceKey(currentSourceKey)
    setAppliedSourceLabel(sourceLabel)
    setPdfPrepared(false)
    toast.success("선택한 내용으로 오른쪽 항목을 채웠습니다.")
  }
  const createMagicLink = (settings?: { expires: string; maxOpens: number }) => {
    if (!deliveryAllowed) return
    if (magicLinks.some((link) => link.status !== "revoked")) {
      toast.info("기존 공유 링크를 철회한 뒤 새 링크를 만들 수 있습니다.")
      return
    }
    setMagicLinks((links) => [
      ...links,
      {
        id: (links.at(-1)?.id ?? 0) + 1,
        recipient: selectedDeal?.party ?? "ACME GmbH",
        status: "active",
        expires: settings?.expires ?? "2026.08.31",
        opens: 0,
        maxOpens: settings?.maxOpens ?? 10,
        createdAt: new Date().toLocaleString("ko-KR"),
      },
    ])
    toast.success("공유 링크를 만들었습니다.")
  }
  const preparePdf = () => {
    if (!draftReady) return
    const updatingExistingPdf = hasPreparedPdf
    setPdfPrepared(true)
    setHasPreparedPdf(true)
    setWorkspaceStep("editor")
    setMobilePane("left")
    toast.success(
      updatingExistingPdf
        ? "수정 내용을 PDF에 반영했습니다."
        : "입력한 항목으로 PDF 초안을 만들었습니다."
    )
  }
  const sendEmail = async ({
    linkCount,
    recipient,
    subject,
    textBody,
    shareLinkId,
  }: {
    linkCount: number
    recipient: string
    subject: string
    textBody: string
    shareLinkId: string
  }) => {
    if (!deliveryAllowed) return false
    const result = await prototypeBackend.deliveryEvents.create({
      documentId: documentNumber,
      shareLinkId,
      recipient,
      subject,
      textBody,
      idempotencyKey: `doc-pack:${documentNumber.toLowerCase()}:${recipient.trim().toLowerCase()}`,
    })
    if (!result.ok) {
      toast.error(result.error)
      return false
    }
    setEmailRecords((records) => [
      {
        id: records.length + 1,
        recipient,
        subject,
        textBody,
        sentAt: new Date(result.updatedAt).toLocaleString("ko-KR"),
        linkCount,
        status: "requested",
        attempts: 1,
      },
      ...records,
    ])
    return true
  }
  const retryEmail = async (record: EmailRecord) =>
    sendEmail({
      linkCount: record.linkCount,
      recipient: record.recipient,
      subject: record.subject,
      textBody: record.textBody ?? "",
      shareLinkId: String(magicLinks.find((link) => link.status === "active")?.id ?? ""),
    })
  const cancelEmail = (id: number) => {
    setEmailRecords((records) =>
      records.map((record) =>
        record.id === id ? { ...record, status: "cancelled" } : record
      )
    )
  }

  const openCreateField = (target: ReviewFocusTarget) => {
    setWorkspaceStep("source")
    setMobilePane("right")
    setReviewFocusRequest((previous) => ({ targets: [target], token: (previous?.token ?? 0) + 1 }))
  }
  const openCreateReview = (pane: "left" | "right") => {
    setWorkspaceStep("editor")
    setMobilePane(pane)
    focusDocumentRequirement(`[data-document-requirement="${pane === "left" ? "pdf" : "review"}"]`)
  }
  const createFieldIssues = Array.from(new Map([
    ...discrepancyIssueTargets.map((target) => ({
      ...target,
      label: `${(templateSchemas[templateCode] ?? templateSchemas.SC).slots.find((slot) => slot.key === target.key)?.label ?? target.label} · 점검 불일치`,
    })),
    ...requiredIssues,
  ].map((issue) => [issue.key, issue])).values())
  const createErrors: DocumentBlockingIssue[] = documentConfirmed ? [] : [
    ...createFieldIssues.map((issue) => ({ ...issue, onSelect: () => openCreateField(issue) })),
    ...discrepancyReview.findings.filter((finding) => finding.state === "error" && discrepancyReviewFocusTargets(templateCode, [finding]).length === 0).map((finding) => ({
      key: `discrepancy-${finding.key}`, label: `${finding.label} · ${finding.detail}`,
      onSelect: () => openCreateReview("right"),
    })),
    ...(saveState === "error" ? [{ key: "save", label: "변경사항 저장 실패 · 다시 저장", onSelect: () => { void persistDocumentDraft() } }] : []),
  ]
  const createChecks: DocumentBlockingIssue[] = documentConfirmed || workspaceStep === "source" ? [] : [
    ...(!qualityAcknowledged ? [{ key: "pdf", label: "PDF 결과 검토 완료", onSelect: () => openCreateReview("left") }] : []),
    ...(!selectedDeal ? [{ key: "deal", label: "확정할 거래 연결", onSelect: () => setDealPickerOpen(true) }] : []),
    ...(approvalChoice !== "none" && approvalStatus !== "approved" ? [{ key: "approval", label: approvalStatus === "rejected" ? "반려 사유 확인 후 승인 재요청" : approvalStatus === "requested" ? "승인 완료 대기" : "승인 방식 선택 및 승인 요청", onSelect: () => openCreateReview("right") }] : []),
  ]
  const sourcePanel = (
    <div data-document-requirement="source" data-create-source-panel tabIndex={-1} className="h-full min-h-0">
    <DocumentSourceSetupStep
      templateCode={templateCode}
      direction={documentDirection}
      onTemplateChange={(code, direction) => {
        if (code === templateCode && direction === documentDirection) return true
        const confirmed = window.confirm(
          direction !== documentDirection
            ? "문서 방향을 바꾸면 현재 입력값이 초기화되고 새 초안으로 다시 시작합니다. 계속할까요?"
            : "문서 유형을 바꾸면 현재 입력값이 초기화되고 새 초안으로 다시 시작합니다. 계속할까요?"
        )
        if (!confirmed) return false
        setTemplateCode(code)
        setDocumentDirection(direction)
        setSavedMetadata(null)
        setLastSavedAt(null)
        setAppliedSourceKey("")
        setAppliedSourceLabel("아직 반영된 내용 없음")
        setPdfPrepared(false)
        setHasPreparedPdf(false)
        setApprovalStatus("idle")
        setApprovalEvents([])
        markDocumentChanged(true)
        return true
      }}
      selectedDeal={selectedDeal}
      onSelectDeal={(deal) => {
        setSelectedDeal(deal)
        setPdfPrepared(false)
        markDocumentChanged()
      }}
      sourceMode={sourceMode}
      onSourceModeChange={setSourceMode}
      selectedSources={selectedSources}
      onToggleSource={(title) => {
        setSelectedSources((current) => {
          const next = new Set(current)
          if (next.has(title)) next.delete(title)
          else next.add(title)
          return next
        })
        setPdfPrepared(false)
        markDocumentChanged()
      }}
      naturalLanguagePrompt={naturalLanguagePrompt}
      onNaturalLanguagePromptChange={(value) => {
        setNaturalLanguagePrompt(value)
        setPdfPrepared(false)
        markDocumentChanged()
      }}
      sourceChangesPending={sourceChangesPending}
      onApplySource={applySourceToFields}
    />
    </div>
  )
  const fieldsPanel = templateSelected ? (
    <div className="h-full min-h-0 [&>aside]:h-full [&>aside]:border-r-0">
      <CreateFieldReviewPanel
        key={`${templateCode}:${documentDirection}:${appliedSourceKey}`}
        itemFocusSignal={0}
        reviewFocusRequest={reviewFocusRequest}
        reviewIssueTargets={discrepancyIssueTargets}
        templateCode={templateCode}
        sourceLabel={appliedSourceLabel}
        startBlank={!appliedSourceKey}
        onItemCountChange={handleItemCountChange}
        onRequiredMissingChange={handleRequiredMissingChange}
        onComparisonFactsChange={handleComparisonFactsChange}
        onContentChange={markDocumentChanged}
      />
    </div>
  ) : (
    <section className="grid h-full min-h-0 place-items-center bg-background p-6">
      <div className="max-w-sm text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-[var(--r-md)] border border-dashed border-[var(--control-border)] text-muted-foreground">
          <FileText className="size-5" />
        </span>
        <h2 className="mt-4 text-sm font-semibold">빈 문서 상태</h2>
        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
          왼쪽에서 만들 문서 종류를 선택하면 거래 정보를 기준으로 확인할 항목이
          표시됩니다.
        </p>
      </div>
    </section>
  )
  const pdfPanel = (
    <section data-document-requirement="pdf" className="flex h-full min-h-0 flex-col bg-background">
      <div className="min-h-0 flex-1">
        <DocumentStage
          result
          fitPage
          controlsPlacement="top"
          toolbarEyebrow={
            documentConfirmed
              ? `${templateTitle} 확정 문서`
              : `${templateTitle} 미리보기`
          }
          toolbarTitle={`${documentNumber}.pdf`}
          toolbarMeta={
            <div className="hidden items-center gap-2 text-[11px] text-muted-foreground lg:flex">
              <ToneBadge tone={documentConfirmed ? "success" : "blue"}>
                {documentConfirmed ? "확정" : "미리보기"}
              </ToneBadge>
              <span>
                원본 {sourceMode === "files" ? selectedSources.size : 1}
              </span>
              <span>·</span>
              <span>품목 {itemCount}</span>
            </div>
          }
          reviewGate={{
            completed: qualityAcknowledged,
            disabled: missingRequiredCount > 0 || saveState !== "saved",
            showCompleteAction: true,
            onComplete: handleDocumentReviewComplete,
            completeLabel: "검토 완료",
            downloadLabel: documentConfirmed
              ? "문서 다운로드"
              : "초안 PDF 다운로드",
          }}
          templateCode={templateCode}
          accent={documentStyle.accent}
          fontStyle={documentStyle.fontStyle}
          archetype={documentStyle.archetype}
          logo={documentStyle.logo}
          downloadName={`${documentNumber}-${
            documentConfirmed ? "FINAL" : "DRAFT"
          }.pdf`}
        />
      </div>
    </section>
  )
  const deliveryPanel = documentConfirmed ? (
    <DocumentConfirmedSummaryPanel
      approvalChoice={approvalChoice}
      approvalStatus={approvalStatus}
      selectedApproverIds={selectedApproverIds}
      approvalEvents={approvalEvents}
      templateCode={templateCode}
      documentNumber={documentNumber}
      documentStyle={documentStyle}
      activeLinkCount={
        magicLinks.filter((link) => link.status === "active").length
      }
      deliveryRecordCount={emailRecords.length}
      activeLink={magicLinks.find((link) => link.status !== "revoked") ?? magicLinks.at(-1) ?? null}
      latestEmail={emailRecords.at(0) ?? null}
      relatedDeal={selectedDeal}
      dealConnectionRestricted={dealConnectionRestricted}
      discrepancyReview={discrepancyReview}
      onOpenShare={() => deliveryAllowed && setSharePanelOpen(true)}
      onDuplicate={() => onDuplicateConfirmed?.(documentDirection)}
      deliveryAllowed={deliveryAllowed}
    />
  ) : (
    <DocumentReviewSharePanel
      documentConfirmed={false}
      documentDirection={documentDirection}
      qualityAcknowledged={qualityAcknowledged}
      onAcknowledgeQuality={handleDocumentReviewComplete}
      confirmationReady={confirmationReady}
      approvalChoice={approvalChoice}
      approvalStatus={approvalStatus}
      selectedApproverIds={selectedApproverIds}
      rememberApprovers={rememberApprovers}
      approvalEvents={approvalEvents}
      approvalPreviewState={approvalPreviewState}
      role={role}
      onApprovalChoiceChange={handleApprovalChoiceChange}
      onApproverToggle={handleApproverToggle}
      onRememberApproversChange={handleRememberApproversChange}
      onRequestApproval={handleRequestApproval}
      onApprove={handleApproveDocument}
      onReject={handleRejectDocument}
      templateCode={templateCode}
      documentNumber={documentNumber}
      documentStyle={documentStyle}
      organizationLogo={organizationDefaultDocumentLogo}
      onStyleChange={(style) => {
        setDocumentStyle(style)
        markDocumentChanged()
      }}
      missingRequiredCount={missingRequiredCount}
      saveState={saveState}
      comparisonFacts={comparisonFacts}
      relatedDeal={selectedDeal}
      dealConnectionRestricted={dealConnectionRestricted}
      dealFacts={selectedDealFacts}
      referenceDocuments={referenceDocuments}
      onReviewSource={() => {
        setReviewFocusRequest({
          targets: discrepancyIssueTargets,
          token: Date.now(),
        })
        setSourceMode("deal")
        setWorkspaceStep("source")
        setMobilePane("right")
      }}
      onOpenDealPicker={() => setDealPickerOpen(true)}
      onConfirmDocument={handleConfirmDocument}
      magicLinks={magicLinks}
      onCreateMagicLink={createMagicLink}
      onRevokeMagicLink={(id) =>
        setMagicLinks((links) =>
          links.map((link) =>
            link.id === id ? { ...link, status: "revoked" } : link
          )
        )
      }
      onSendEmail={sendEmail}
    />
  )

  if (!templateSelected) {
    return (
      <div className="h-full overflow-auto bg-transparent px-4 py-6 sm:px-5">
        <div className="w-full">
          <BusinessPageHero
            title="문서 만들기"
            summary={
              <TemplateStrip onResult={(_mode, code, direction) => {
                if (!code || !templateSchemas[code]) return
                setTemplateCode(code)
                setDocumentDirection(direction ?? null)
                setWorkspaceStep("source")
              }} />
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div
      ref={workspaceRootRef}
      onBlurCapture={() => {
        if (saveState === "unsaved") void persistDocumentDraft()
      }}
      className="flex h-[calc(100svh-var(--header-height))] min-h-0 flex-col overflow-hidden bg-transparent"
    >
      {/* Same HeroBanner card as the 문서 올리기 detail header. */}
      <div className="mx-3 mt-1.5 flex min-h-[72px] shrink-0 flex-wrap items-center gap-2 rounded-[22px] bg-[linear-gradient(120deg,#1d4ed8_0%,#2563eb_52%,#3b82f6_100%)] px-5 py-3 text-white sm:mx-4 sm:px-[30px] [&_[data-slot=button][data-variant=default]]:bg-white [&_[data-slot=button][data-variant=default]]:text-[var(--primary)] [&_[data-slot=popover-trigger][data-variant=outline]]:bg-[var(--color-red-8)]">
        {onBackToList ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="-ml-2 [--button-ghost-foreground:white]"
            aria-label="문서 목록으로 돌아가기"
            onClick={onBackToList}
          >
            <ChevronLeft />
          </Button>
        ) : null}
        <div className="mr-auto min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-bold">문서 만들기</h1>
            {documentDirection ? (
              <ToneBadge tone="blue">
                {documentDirection === "purchase" ? "구매" : "판매"}
              </ToneBadge>
            ) : null}
            <ToneBadge tone={documentConfirmed ? "success" : "warning"}>
              {documentStatusLabel}
            </ToneBadge>
          </div>
          <p className="truncate text-xs text-white/85">
            {templateTitle} · {documentNumber}.pdf · {documentConfirmed
              ? "공유 가능"
              : dealConnectionRestricted
                ? "거래 연결됨 · Deal 접근 권한 필요"
                : selectedDeal
                  ? "거래 연결됨 · 검토 후 문서 확정"
                  : "거래 미연결 · 검토 완료 후 초안 PDF만 다운로드 가능"}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {/* Save status sits with the actions, as on the 문서 올리기 detail header. */}
          <DocumentSaveSummary
            state={saveState === "unsaved" ? "pending" : saveState}
            savedAt={lastSavedAt}
            metadata={savedMetadata}
            confirmed={documentConfirmed}
            className="mt-0 hidden text-white/90 lg:flex"
          />
          {saveState === "unsaved" ? (
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => void persistDocumentDraft()}
            >
              지금 저장
            </Button>
          ) : saveState === "error" ? (
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => void persistDocumentDraft()}
            >
              다시 저장
            </Button>
          ) : null}
          <DocumentBlockingAlerts errors={createErrors} checks={createChecks} />
          {workspaceStep === "source" ? (
            <Button
              size="sm"
              disabled={
                hasPreparedPdf && pdfPrepared
                  ? false
                  : !draftReady
              }
              onClick={() => {
                if (hasPreparedPdf && pdfPrepared) {
                  setWorkspaceStep("editor")
                  setMobilePane("left")
                  return
                }
                preparePdf()
              }}
            >
              {hasPreparedPdf ? "PDF 보기" : "문서 초안 만들기"}{" "}
              <ChevronRight data-icon="inline-end" />
            </Button>
          ) : !documentConfirmed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setWorkspaceStep("source")
                setMobilePane("left")
              }}
            >
              <ChevronLeft data-icon="inline-start" /> 항목 수정
            </Button>
          ) : null}
          {workspaceStep === "editor" && !documentConfirmed ? (
            <>
              {!dealConnectionRestricted ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setDealPickerQuery(""); setDealPickerOpen(true) }}
                >
                  <Building2 data-icon="inline-start" />
                  {selectedDeal ? "거래 변경" : "거래 연결"}
                </Button>
              ) : null}
              <Button
                size="sm"
                disabled={!confirmationReady}
                title={confirmationBlockReason}
                onClick={handleConfirmDocument}
              >
                <Check data-icon="inline-start" /> 문서 확정
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
        {isMobile ? (
          <PdfPanelWorkspaceCard>
            <div className="flex h-full min-h-0 w-full flex-col">
              <div className="grid h-11 shrink-0 grid-cols-2 gap-1 border-b bg-background p-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 text-xs",
                    mobilePane === "left" && "bg-primary/10 text-primary"
                  )}
                  onClick={() => setMobilePane("left")}
                >
                  {workspaceStep === "source" ? "문서 원본" : "PDF 보기"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 text-xs",
                    mobilePane === "right" && "bg-primary/10 text-primary"
                  )}
                  onClick={() => setMobilePane("right")}
                >
                  {workspaceStep === "source"
                    ? "항목 확인"
                    : documentConfirmed
                      ? deliveryAllowed
                        ? "공유"
                        : "문서 상태"
                      : "검토·확정"}
                </Button>
              </div>
              <div className="min-h-0 flex-1">
                {workspaceStep === "source"
                  ? mobilePane === "left"
                    ? sourcePanel
                    : fieldsPanel
                  : mobilePane === "left"
                    ? pdfPanel
                    : deliveryPanel}
              </div>
            </div>
          </PdfPanelWorkspaceCard>
        ) : workspaceStep === "source" ? (
          <PdfPanelWorkspaceCard>
            <ResizablePanelGroup
              orientation="horizontal"
              className="min-h-0 flex-1"
            >
              <ResizablePanel
                defaultSize="50%"
                minSize="35%"
                maxSize="65%"
                className="min-h-0 overflow-hidden"
              >
                {sourcePanel}
              </ResizablePanel>
              <PdfPanelResizeHandle label="문서 원본과 확인 항목 너비 조절" />
              <ResizablePanel
                defaultSize="50%"
                minSize="35%"
                maxSize="65%"
                className="min-h-0 overflow-hidden"
              >
                {fieldsPanel}
              </ResizablePanel>
            </ResizablePanelGroup>
          </PdfPanelWorkspaceCard>
        ) : pdfPrepared ? (
          <PdfPanelWorkspaceCard>
            <ResizablePanelGroup
              orientation="horizontal"
              className="min-h-0 flex-1"
            >
              <ResizablePanel
                defaultSize="50%"
                minSize="35%"
                maxSize="65%"
                className="min-h-0 overflow-hidden"
              >
                {pdfPanel}
              </ResizablePanel>
              <PdfPanelResizeHandle label="문서 미리보기와 검토 패널 너비 조절" />
              <ResizablePanel
                defaultSize="50%"
                minSize="35%"
                maxSize="65%"
                className="min-h-0 overflow-hidden"
              >
                {deliveryPanel}
              </ResizablePanel>
            </ResizablePanelGroup>
          </PdfPanelWorkspaceCard>
        ) : null}
      </div>
      <Sheet open={dealPickerOpen} onOpenChange={setDealPickerOpen}>
        <SheetContent
          side="right"
          className="gap-0 overflow-hidden p-0 data-[side=right]:w-[min(96vw,840px)] data-[side=right]:max-w-none data-[side=right]:sm:max-w-[840px]"
        >
          <SheetHeader className="border-b px-5 py-4 text-left">
            <SheetTitle>{selectedDeal ? "거래 변경" : "거래 연결"}</SheetTitle>
            <SheetDescription>
              {selectedDeal
                ? `현재 연결된 ${selectedDeal.id} 거래를 다른 거래로 변경합니다. 문서 항목값은 변경되지 않습니다.`
                : "현재 문서에 연결할 거래를 선택합니다. 문서 항목값은 변경되지 않습니다."}
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                aria-label="연결할 거래 검색"
                placeholder="거래번호, 거래명, 거래처 검색"
                value={dealPickerQuery}
                onChange={(event) => setDealPickerQuery(event.target.value)}
              />
            </div>
            <div className="overflow-x-auto rounded-lg border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left!">거래</TableHead>
                    <TableHead className="text-left!">거래처</TableHead>
                    <TableHead className="text-left!">단계</TableHead>
                    <TableHead className="text-right!">금액</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviewDeals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        검색 조건에 맞는 거래가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {filteredReviewDeals.map((deal) => (
                    <TableRow
                      key={deal.id}
                      className={cn(
                        selectedDeal?.id === deal.id && "bg-primary/5"
                      )}
                    >
                      <TableCell className="text-left!">
                        <div className="font-medium">{deal.title}</div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {deal.id} · {deal.item}
                        </div>
                      </TableCell>
                      <TableCell className="text-left!">{deal.party}</TableCell>
                      <TableCell className="text-left!">
                        <ToneBadge tone={deal.tone}>{deal.stage}</ToneBadge>
                      </TableCell>
                      <TableCell className="text-right! font-medium">
                        {deal.amount} {deal.currency}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant={
                            selectedDeal?.id === deal.id ? "outline" : "ghost"
                          }
                          size="xs"
                          onClick={() => selectedDeal?.id === deal.id
                            ? disconnectDealFromReview()
                            : connectDealFromReview(deal)}
                        >
                          {selectedDeal?.id === deal.id ? "연결 해제" : "연결"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <Sheet
        open={sharePanelOpen && deliveryAllowed}
        onOpenChange={(open) => deliveryAllowed && setSharePanelOpen(open)}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          className="gap-0 overflow-hidden p-0 data-[side=right]:w-[min(92vw,760px)] data-[side=right]:max-w-none data-[side=right]:sm:max-w-[760px]"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>파일 공유하기</SheetTitle>
            <SheetDescription>파일 공유하기</SheetDescription>
          </SheetHeader>
          <ShareDeliveryPanel
            magicLinks={magicLinks}
            emailRecords={emailRecords}
            onSendEmail={sendEmail}
            onRetryEmail={retryEmail}
            onCancelEmail={cancelEmail}
            onCreateMagicLink={createMagicLink}
            onRevokeMagicLink={(id, reason) =>
              setMagicLinks((links) =>
                links.map((link) =>
                  link.id === id
                    ? {
                        ...link,
                        status: "revoked",
                        revokedAt: new Date().toLocaleString("ko-KR"),
                        revokeReason: reason,
                      }
                    : link
                )
              )
            }
            onClose={() => setSharePanelOpen(false)}
            templateCode={templateCode}
            documentNumber={documentNumber}
            relatedDeal={selectedDeal}
            initialAttachments={deliveryAttachments}
            onAttachmentsChange={setDeliveryAttachments}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

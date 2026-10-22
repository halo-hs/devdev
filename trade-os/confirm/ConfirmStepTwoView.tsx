import { type DocumentConnection, type DocumentDealLink, type CandidateEvidence } from "@trade-os/lib/documentDealConnection"
import { type BankCashInput, readDocumentReview, eligibleBankSchedules, currentBankSchedules, bankCashValidation } from "@trade-os/lib/erpDocumentWorkflow"
import { useState, useEffect, useRef } from "react"
import { prototypeBackend } from "@trade-os/lib/prototypeBackend"
import { normalizeDecimalInput } from "@trade-os/lib/money"
import { toast } from "sonner"
import { focusDocumentRequirement } from "@trade-os/lib/documentRequirementNavigation"
import { type DocumentBlockingIssue, DocumentBlockingAlerts } from "@trade-os/components/DocumentBlockingAlerts"
import { Button } from "@/components/ui/button"
import { LoaderCircle, AlertTriangle, Sparkles, Building2, RefreshCw, Plus, Search } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { createPortal } from "react-dom"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertTitle, AlertDescription, AlertAction } from "@/components/ui/alert"
import { DocumentConnectionSummary, DocumentConnectionChangeDialog } from "@trade-os/components/DocumentConnectionSummary"
import { Badge } from "@/components/ui/badge"
import { ToneBadge } from "@trade-os/components/ToneBadge"
import { Skeleton } from "@/components/ui/skeleton"
import { Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { DateInput } from "@/components/platform/DateInput"
import { type RecentDocument, type ReviewField, type DocumentSourceDeal } from "@/App"
import { documentSourceDeals, quotationMoney } from "@trade-os/documents/documentTemplateModel"
import { resolvedReviewFields, readUploadDocumentDealLinks } from "@trade-os/inbox/uploadDocumentModel"

export function DealConfirmPanel({
  document,
  originDealId,
  linkedDealLabel,
  linking,
  tradeSeatAssigned,
  linkBlocked = false,
  actionPortalTarget,
  onShowPdf,
  onLinkDeal,
  onConnectionChanged,
}: {
  document: RecentDocument
  originDealId?: string | null
  linkedDealLabel: string | null
  linking: boolean
  tradeSeatAssigned: boolean
  linkBlocked?: boolean
  actionPortalTarget?: HTMLElement | null
  onShowPdf?: () => void
  onConnectionChanged?: (connection: DocumentConnection) => void
  onLinkDeal: (dealId: string, dealLabel: string, bankCash?: Omit<BankCashInput, "sourceDocumentId" | "idempotencyKey">, evidence?: string[]) => Promise<boolean>
}) {
  const documentReviewFields = resolvedReviewFields(document)
  const aiCounterpartyName =
    documentReviewFields
      .find((field) => ["counterparty", "buyer", "seller"].includes(field.key))
      ?.value.trim() ?? ""
  const dealMatchingFieldKeys = [
    "counterparty",
    "seller",
    "buyer",
    "total_amount",
    "currency",
    "item_name",
    "quantity",
    "invoice_number",
    "sc_number",
    "po_number",
  ]
  const documentDealValues = dealMatchingFieldKeys
    .map((key) => documentReviewFields.find((field) => field.key === key))
    .filter((field): field is ReviewField => Boolean(field?.value.trim()))
    .filter(
      (field, index, values) =>
        values.findIndex((value) => value.key === field.key) === index
    )
    .slice(0, 3)
  const readCounterparty =
    documentReviewFields.find((field) => field.key === "counterparty")?.value ??
    documentReviewFields.find((field) => field.key === "seller")?.value ??
    documentReviewFields.find((field) => field.key === "buyer")?.value ??
    ""
  const readAmountField = documentReviewFields.find(
    (field) => field.key === "total_amount"
  )
  const readCurrency =
    documentReviewFields.find((field) => field.key === "currency")?.value ??
    readAmountField?.unit?.split("/")[0] ??
    ""
  const [connection, setConnection] = useState<DocumentConnection | null>(null)
  const [connectionError, setConnectionError] = useState("")
  const [connectionAttempt, setConnectionAttempt] = useState(0)
  const [changingConnection, setChangingConnection] = useState(false)
  const [changeDialog, setChangeDialog] = useState<{ target: DocumentDealLink | null; evidence: string[] } | null>(null)
  useEffect(() => {
    if (!connection?.link || new URLSearchParams(window.location.search).get("undo") !== "1") return
    const url = new URL(window.location.href)
    url.searchParams.delete("undo")
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`)
    setChangeDialog({ target: null, evidence: [] })
  }, [connection?.link])
  const [loadedCandidates, setLoadedCandidates] = useState<(DocumentSourceDeal & CandidateEvidence)[]>([])
  const [candidateAttempt, setCandidateAttempt] = useState(0)
  const recommendedDealId = loadedCandidates.find(candidate => candidate.recommended)?.id ?? null
  const activeLink = connection?.link ?? null
  const connectionReady = Boolean(connection) && !connectionError
  useEffect(() => {
    let active = true
    setConnectionError(""); setConnection(null)
    const legacy = readUploadDocumentDealLinks()[document.name]
    prototypeBackend.tradeDocuments.getConnection(document.name, legacy)
      .then(value => {
        if (!active) return
        if (linkedDealLabel && !value.link && !value.connectionKnown) throw new Error("현재 연결의 거래 정보를 확인하지 못했습니다.")
        setConnection(value)
      })
      .catch(error => { if (active) setConnectionError(error instanceof Error ? error.message : "현재 연결 정보를 불러오지 못했습니다.") })
    return () => { active = false }
  }, [document.name, connectionAttempt])
  const [pendingCreatedDeal] = useState(() => {
    const review = readDocumentReview(document.name)
    return review.status !== "committed" && !review.connectionHistory?.length
      ? prototypeBackend.deals.listCreated().find(deal => deal.sourceDocumentId === document.name) ?? null : null
  })
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [newDealFormOpen, setNewDealFormOpen] = useState(Boolean(pendingCreatedDeal))
  const [newDealName, setNewDealName] = useState(pendingCreatedDeal?.counterparty ?? aiCounterpartyName)
  const [newDealNumber, setNewDealNumber] = useState(() =>
    pendingCreatedDeal?.id ?? prototypeBackend.deals.getNextId()
  )
  const [recommendedNewDealNumber, setRecommendedNewDealNumber] =
    useState(newDealNumber)
  const [bankScheduleId, setBankScheduleId] = useState("")
  const [bankMatchAmount, setBankMatchAmount] = useState(readAmountField?.value ?? "")
  const [bankValueDate, setBankValueDate] = useState(() => new Date().toLocaleDateString("sv-SE"))
  const [newDealDirection, setNewDealDirection] = useState<"sales" | "purchase" | "">(pendingCreatedDeal?.direction === "direction_pending" ? "" : pendingCreatedDeal?.direction ?? "")
  const [candidateLoadState, setCandidateLoadState] = useState<
    "loading" | "ready" | "error"
  >("loading")
  useEffect(() => {
    let active = true
    setCandidateLoadState("loading")
    const created: DocumentSourceDeal[] = prototypeBackend.deals.listCreated().map(deal => ({ id: deal.id, title: deal.title, party: deal.counterparty, amount: deal.amount, currency: deal.currency, item: "품목 미등록", stage: "신규 거래", tone: "neutral" }))
    prototypeBackend.tradeDocuments.listCandidates([...documentSourceDeals, ...created], { counterparty: readCounterparty, amount: readAmountField?.value ?? "", currency: readCurrency })
      .then(rows => { if (active) { setLoadedCandidates(rows); setCandidateLoadState("ready") } })
      .catch(() => { if (active) setCandidateLoadState("error") })
    return () => { active = false }
  }, [document.name, readCounterparty, readAmountField?.value, readCurrency, candidateAttempt])
  useEffect(() => {
    if (!originDealId || activeLink || candidateLoadState !== "ready") return
    if (loadedCandidates.some(candidate => candidate.id === originDealId)) {
      setSelectedDealId(current => current ?? originDealId)
    }
  }, [originDealId, activeLink, candidateLoadState, loadedCandidates])
  const [creatingDeal, setCreatingDeal] = useState(false)
  const creatingRef = useRef(false)
  const [createdDeal, setCreatedDeal] = useState<DocumentDealLink | null>(() => pendingCreatedDeal ? { dealId: pendingCreatedDeal.id, dealLabel: `${pendingCreatedDeal.id} · ${pendingCreatedDeal.counterparty}` } : null)
  const createdCounterparty = useRef<string | null>(null)
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const candidates = loadedCandidates
    .filter((candidate) =>
      normalizedQuery
        ? [candidate.id, candidate.title, candidate.party, candidate.item].some(
            (value) => value.toLowerCase().includes(normalizedQuery)
          )
        : true
    )
    .sort((a, b) => {
      if (a.id === recommendedDealId) return -1
      if (b.id === recommendedDealId) return 1
      return 0
    })
  const selectedCandidate =
    loadedCandidates.find((candidate) => candidate.id === selectedDealId) ??
    null
  const ambiguousCandidates = loadedCandidates.filter((candidate) => candidate.ambiguous).length
  const comparisonRows = selectedCandidate ? [
    { label: "거래처", result: readCounterparty && readCounterparty.trim().toLowerCase() === selectedCandidate.party.trim().toLowerCase() ? "일치" : "확인 필요" },
    { label: "금액", result: readAmountField?.value && readCurrency && normalizeDecimalInput(readAmountField.value) === normalizeDecimalInput(selectedCandidate.amount) && readCurrency.toUpperCase() === selectedCandidate.currency.toUpperCase() ? "일치" : "확인 필요" },
    { label: "수량", result: "기준 수량 확인 필요" },
  ] : []
  const bankSchedules = eligibleBankSchedules(currentBankSchedules(), selectedDealId ?? "", readCurrency)
  const bankMatchRequired = !activeLink && document.documentType === "BANK_STATEMENT" && Boolean(selectedCandidate) && !newDealFormOpen
  const bankCashError = bankScheduleId && bankScheduleId !== "document-only"
    ? bankCashValidation({ scheduleId: bankScheduleId, amount: bankMatchAmount, currency: readCurrency, valueDate: bankValueDate }, bankSchedules)
    : null
  const bankMatchIncomplete = bankMatchRequired && (!bankScheduleId || Boolean(bankCashError))
  const hasReadCounterparty = aiCounterpartyName.length > 0
  const newDealReady =
    newDealFormOpen &&
    newDealName.trim().length > 0 &&
    newDealNumber.trim().length > 0
  const prepareNewDealForm = () => {
    if (createdDeal) return
    const nextDealNumber = prototypeBackend.deals.getNextId()
    setSelectedDealId(null)
    setNewDealName(aiCounterpartyName)
    setRecommendedNewDealNumber(nextDealNumber)
    setNewDealNumber(nextDealNumber)
  }
  const retryCandidateLoad = () => {
    setCandidateAttempt(value => value + 1)
  }
  const handleCandidateSelect = (candidate: DocumentSourceDeal) => {
    setNewDealFormOpen(false)
    setSelectedDealId(candidate.id)
    if (document.documentType !== "BANK_STATEMENT") return

    setBankScheduleId("")
  }

  const registerNewDeal = async (): Promise<DocumentDealLink | null> => {
    const counterpartyName = newDealName.trim()
    const newDealId = newDealNumber.trim()
    if (!hasReadCounterparty && createdCounterparty.current !== counterpartyName) {
      const counterpartyResult = await prototypeBackend.counterparties.create({ name: counterpartyName })
      if (!counterpartyResult.ok) {
        toast.error(counterpartyResult.error)
        return null
      }
      createdCounterparty.current = counterpartyName
    }
    const result = await prototypeBackend.deals.create({
      id: newDealId,
      title: `${counterpartyName} 신규 거래`,
      counterparty: counterpartyName,
      ...(newDealDirection ? { direction: newDealDirection } : {}),
      amount: normalizeDecimalInput(readAmountField?.value ?? "0"),
      currency: readCurrency || "USD",
      sourceDocumentId: document.name,
    })
    if (!result.ok) {
      toast.error(result.error)
      return null
    }
    const accepted = { dealId: result.id, dealLabel: `${result.id} · ${counterpartyName}` }
    setCreatedDeal(accepted)
    setCandidateAttempt(value => value + 1)
    return accepted
  }

  const handleLink = async () => {
    if (!tradeSeatAssigned || linking || creatingRef.current || !connectionReady) return
    if (activeLink) {
      if (!changingConnection) return
      if (newDealReady) {
        if (createdDeal) {
          setChangeDialog({ target: createdDeal, evidence: ["새 거래 등록 후 연결 변경"] })
          return
        }
        creatingRef.current = true; setCreatingDeal(true)
        try {
          const accepted = await registerNewDeal()
          if (accepted) setChangeDialog({ target: accepted, evidence: ["새 거래 등록 후 연결 변경"] })
        } catch {
          toast.error("새 거래를 등록하지 못했습니다. 입력한 내용을 확인하고 다시 시도해 주세요.")
        } finally { creatingRef.current = false; setCreatingDeal(false) }
        return
      }
      if (!selectedCandidate || selectedCandidate.id === activeLink.dealId) return
      setChangeDialog({ target: { dealId: selectedCandidate.id, dealLabel: `${selectedCandidate.id} · ${selectedCandidate.party}` }, evidence: selectedCandidate.reasons.length ? selectedCandidate.reasons : ["직접 선택"] })
      return
    }
    creatingRef.current = true; setCreatingDeal(true)
    try {
      if (newDealReady) {
        if (createdDeal) {
          await onLinkDeal(createdDeal.dealId, createdDeal.dealLabel, undefined, ["새 거래 생성 후 연결"])
          return
        }
        const accepted = await registerNewDeal()
        if (!accepted) return
        await onLinkDeal(accepted.dealId, accepted.dealLabel, undefined, ["새 거래 생성 후 연결"])
        return
      }
      if (!selectedCandidate || bankMatchIncomplete) return
      await onLinkDeal(
        selectedCandidate.id,
        `${selectedCandidate.id} · ${selectedCandidate.party}`,
        bankMatchRequired && bankScheduleId !== "document-only" ? {
          scheduleId: bankScheduleId, amount: normalizeDecimalInput(bankMatchAmount),
          currency: readCurrency, valueDate: bankValueDate,
        } : undefined,
        selectedCandidate.reasons.length ? selectedCandidate.reasons : ["직접 선택"],
      )
    } catch {
      toast.error("거래 연결 중 오류가 발생했습니다. 다시 시도해 주세요.")
    } finally { creatingRef.current = false; setCreatingDeal(false) }
  }
  const openConnectionRequirement = () => focusDocumentRequirement('[data-document-requirement="connection"]')
  const connectionErrors: DocumentBlockingIssue[] = activeLink && !changingConnection ? [] : [
    ...(bankCashError ? [{ key: "bank", label: bankCashError, onSelect: openConnectionRequirement }] : []),
    ...(newDealFormOpen ? [
      ...(!newDealName.trim() ? [{ key: "name", label: "거래처명 · 필수값 누락", onSelect: openConnectionRequirement }] : []),
      ...(!newDealNumber.trim() ? [{ key: "number", label: "거래번호 · 필수값 누락", onSelect: openConnectionRequirement }] : []),
    ] : []),
  ]
  const connectionChecks: DocumentBlockingIssue[] = activeLink && !changingConnection ? [] : [
    ...(!selectedCandidate && !newDealFormOpen && !(activeLink && changingConnection) ? [{ key: "deal", label: "연결할 거래 선택", onSelect: openConnectionRequirement }] : []),
    ...(bankMatchRequired && !bankScheduleId ? [{ key: "schedule", label: "결제 일정 또는 서류만 연결 선택", onSelect: openConnectionRequirement }] : []),
  ]
  const primaryButton = (
    <Button
      size="sm"
      aria-disabled={!tradeSeatAssigned}
      className={!tradeSeatAssigned ? "opacity-50" : undefined}
      disabled={
        tradeSeatAssigned && (!connectionReady || (!activeLink && linkBlocked) || (Boolean(activeLink) && (!changingConnection || (!newDealReady && selectedDealId === activeLink?.dealId))) || creatingDeal ||
        candidateLoadState !== "ready" ||
        (!selectedCandidate && !newDealReady) ||
        bankMatchIncomplete ||
        linking)
      }
      onClick={() => { if (tradeSeatAssigned) void handleLink() }}
    >
      {linking || creatingDeal ? (
        <LoaderCircle className="animate-spin" data-icon="inline-start" />
      ) : null}
      {linking || creatingDeal
        ? newDealReady
          ? hasReadCounterparty
            ? "거래 생성·연결 중"
            : "거래처·거래 생성 중"
          : "연결 중"
        : activeLink
          ? changingConnection ? newDealReady ? createdDeal ? "생성한 거래로 변경 검토" : "새 거래 등록 후 변경 검토" : "연결 변경 확인" : "거래 연결 완료"
          : createdDeal && newDealFormOpen
            ? "생성한 거래에 연결 재시도"
          : newDealReady
            ? hasReadCounterparty
              ? "새 거래 생성·연결"
              : "거래처·거래 생성·연결"
            : bankMatchIncomplete
              ? "결제 일정 선택 필요"
              : "선택한 거래 연결"}
    </Button>
  )
  const primaryAction = (
    <>
    <DocumentBlockingAlerts errors={connectionErrors} checks={connectionChecks} />
    {tradeSeatAssigned ? primaryButton : (
      <Tooltip>
        <TooltipTrigger asChild>{primaryButton}</TooltipTrigger>
        <TooltipContent side="bottom">거래를 연결하려면 Trade 사용 권한이 필요해요</TooltipContent>
      </Tooltip>
    )}
    </>
  )

  return (
    <>
      {actionPortalTarget
        ? createPortal(primaryAction, actionPortalTarget)
        : null}
      <div className="flex min-h-0 flex-1 flex-col bg-[var(--surface-background)]">
        <div className="flex shrink-0 items-center justify-between px-5 pt-5 pb-1">
          <div className="min-w-0 pr-3">
            <div className="text-base font-bold">거래 연결</div>
            <p className="mt-1 truncate text-[11px] text-muted-foreground">
              확인한 문서 값을 기준으로 일치 근거를 확인하고 연결할 거래를
              선택하세요.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {onShowPdf ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="xl:hidden"
                onClick={onShowPdf}
              >
                PDF 보기
              </Button>
            ) : null}
            {!actionPortalTarget ? primaryAction : null}
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div data-document-requirement="connection" className="mx-auto w-full max-w-4xl space-y-5 p-6">
            {connectionError ? <Alert variant="destructive"><AlertTitle>현재 거래 연결을 불러오지 못했습니다</AlertTitle><AlertDescription>{connectionError}</AlertDescription><Button className="mt-3" size="sm" variant="outline" onClick={() => setConnectionAttempt(value => value + 1)}>현재 연결 다시 확인</Button></Alert>
              : connection ? <DocumentConnectionSummary connection={connection} changing={changingConnection} disabled={!tradeSeatAssigned || linking || candidateLoadState !== "ready" || !onConnectionChanged}
                onChange={() => {
                  if (changingConnection) {
                    setChangingConnection(false); setNewDealFormOpen(false); setSelectedDealId(null); setSearchQuery("")
                  } else {
                    setChangingConnection(true); setNewDealFormOpen(false); setSelectedDealId(null)
                  }
                }} />
              : <p role="status" className="text-xs text-muted-foreground">현재 거래 연결을 확인하고 있습니다.</p>}
            {!tradeSeatAssigned ? <p role="status" className="text-xs text-muted-foreground">Trade OS는 조회만 가능해요. 거래를 연결하려면 사용 권한이 필요합니다.</p> : null}
            {connectionReady && !activeLink ? <p className="text-xs text-muted-foreground">거래 방향 확인 필요</p> : null}
            {originDealId && connectionReady && !activeLink ? (
              <p className="text-xs text-muted-foreground">거래 상세에서 올린 문서입니다. {originDealId} 거래를 먼저 선택했습니다. 다른 거래도 선택할 수 있습니다.</p>
            ) : null}
            {document.documentType === "OTHER" ? (
              <Alert className="border-[var(--color-orange-4)] bg-[var(--color-orange-5)]">
                <AlertTriangle className="size-4" />
                <AlertDescription className="text-xs">거래 서류가 아닐 수 있습니다. 문서 유형을 확인한 뒤 연결하세요.</AlertDescription>
              </Alert>
            ) : null}
            {documentDealValues.length > 0 ? (
              <section className="rounded-[var(--r-md)] border border-[var(--color-gray-9)] bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] font-semibold">
                    문서에서 읽은 거래 값
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-primary">
                    <Sparkles className="size-3.5" /> AI 추천 기준
                  </div>
                </div>
                <dl className="mt-3 grid sm:grid-cols-3">
                  {documentDealValues.map((field) => (
                    <div
                      key={field.key}
                      className="min-w-0 border-t border-[var(--color-gray-10)] py-2.5 first:border-t-0 sm:border-t-0 sm:border-l sm:px-3 sm:first:border-l-0 sm:first:pl-0 sm:last:pr-0"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <dt className="truncate text-[11px] leading-4 text-[var(--color-gray-4)]">
                          {field.label}
                        </dt>
                        <Badge
                          size="sm"
                          palette={field.tone === "success" ? "green" : "orange"}
                          className="ml-auto shrink-0"
                        >
                          {field.confidence}
                        </Badge>
                      </div>
                      <dd
                        className="mt-1.5 truncate text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] font-semibold"
                        title={`${field.value}${field.unit ? ` ${field.unit}` : ""}`}
                      >
                        {field.value}
                        {field.unit ? ` ${field.unit}` : ""}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            {(!activeLink || changingConnection) && connectionReady ? <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Building2 className="size-4 text-primary" />
                    거래 후보
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {changingConnection
                      ? "변경할 거래를 선택하세요. 변경을 확정하기 전까지 현재 연결은 유지됩니다."
                      : "거래처·식별번호·금액 등 일치 근거를 기준으로 찾았습니다."}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <ToneBadge
                    tone={
                      candidateLoadState === "error"
                        ? "danger"
                        : candidates.length
                          ? "blue"
                          : "warning"
                    }
                  >
                    {candidateLoadState === "loading"
                      ? "조회 중"
                      : candidateLoadState === "error"
                        ? "조회 실패"
                        : `${candidates.length}건`}
                  </ToneBadge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!tradeSeatAssigned || candidateLoadState !== "ready" || (Boolean(activeLink) && !changingConnection) || creatingDeal}
                    onClick={() => {
                      setNewDealFormOpen((current) => {
                        const next = !current
                        if (next) {
                          prepareNewDealForm()
                        }
                        return next
                      })
                    }}
                  >
                    {newDealFormOpen ? "등록 닫기" : "새 거래 등록"}
                  </Button>
                </div>
              </div>

              {candidateLoadState === "error" ? (
                <Alert variant="destructive" className="mt-3">
                  <AlertTriangle data-icon="inline-start" />
                  <div className="min-w-0 flex-1">
                    <AlertTitle className="text-xs">
                      거래 후보를 불러오지 못했습니다
                    </AlertTitle>
                    <AlertDescription className="text-[11px] leading-5">
                      후보를 확인하지 않은 채 새 거래를 만들면 중복될 수
                      있습니다.
                    </AlertDescription>
                  </div>
                  <AlertAction>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={retryCandidateLoad}
                    >
                      <RefreshCw data-icon="inline-start" /> 다시 불러오기
                    </Button>
                  </AlertAction>
                </Alert>
              ) : candidateLoadState === "loading" ? (
                <div className="mt-3 space-y-2" aria-label="거래 후보 조회 중">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-16 w-full rounded-[var(--r-md)]" />
                  <Skeleton className="h-16 w-full rounded-[var(--r-md)]" />
                </div>
              ) : (
                <>
                  {newDealFormOpen ? (
                    <fieldset disabled={!tradeSeatAssigned || Boolean(createdDeal) || creatingDeal} className="mt-3 rounded-lg border border-primary/30 bg-background p-4">
                      <div>
                        <div className="text-sm font-semibold">
                          {hasReadCounterparty
                            ? "새 거래 등록"
                            : "새 거래처와 거래 등록"}
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {hasReadCounterparty
                          ? activeLink
                            ? "문서에서 확인한 거래처에 새 거래를 등록한 뒤, 연결 변경을 확인합니다."
                            : "문서에서 확인한 거래처에 거래번호를 등록하고 바로 연결합니다."
                            : activeLink
                              ? "문서에서 거래처를 확인하지 못했습니다. 새 거래처와 거래를 등록한 뒤, 연결 변경을 확인합니다."
                              : "문서에서 거래처를 확인하지 못했습니다. 새 거래처명과 거래번호를 함께 등록합니다."}
                        </p>
                      </div>
                      <Field className="mt-3 gap-1.5">
                        <FieldLabel className="text-xs">거래 방향</FieldLabel>
                        <Select value={newDealDirection || "direction_pending"} onValueChange={(value) => { if (value === "sales" || value === "purchase" || value === "direction_pending") setNewDealDirection(value === "direction_pending" ? "" : value) }}>
                          <SelectTrigger aria-label="새 거래 방향"><SelectValue placeholder="거래 방향 선택" /></SelectTrigger>
                          <SelectContent><SelectItem value="direction_pending">방향 미정</SelectItem><SelectItem value="sales">매출 · 받을 돈</SelectItem><SelectItem value="purchase">매입 · 보낼 돈</SelectItem></SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">모르면 방향 미정으로 등록할 수 있습니다. 거래 상세에서 나중에 정할 수 있습니다.</p>
                      </Field>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <Field className="gap-1.5">
                          <FieldLabel className="text-xs">
                            {hasReadCounterparty ? "거래처" : "새 거래처명"}
                          </FieldLabel>
                          {hasReadCounterparty ? (
                            <div className="flex h-10 items-center rounded-[var(--r-md)] border border-[var(--control-border)] bg-muted/20 px-3 text-sm font-medium">
                              <span className="min-w-0 flex-1 truncate">
                                {aiCounterpartyName}
                              </span>
                              <span className="shrink-0 text-[10px] font-normal text-muted-foreground">
                                문서에서 확인
                              </span>
                            </div>
                          ) : (
                            <Input
                              value={newDealName}
                              onChange={(event) =>
                                setNewDealName(event.target.value)
                              }
                              placeholder="새 거래처명을 입력하세요"
                            />
                          )}
                        </Field>
                        <Field className="gap-1.5">
                          <FieldLabel className="text-xs">거래번호</FieldLabel>
                          <div className="relative">
                            <Input
                              value={newDealNumber}
                              onChange={(event) =>
                                setNewDealNumber(event.target.value)
                              }
                              className="pr-20 font-semibold"
                              placeholder="거래번호를 입력하세요"
                              aria-label="새 거래번호"
                            />
                            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-muted-foreground">
                              {newDealNumber === recommendedNewDealNumber
                                ? "추천 번호"
                                : "직접 입력"}
                            </span>
                          </div>
                        </Field>
                      </div>
                      {createdDeal ? <p role="status" className="mt-3 text-xs">{createdDeal.dealLabel} 거래는 생성되었습니다. 다시 시도하면 이 거래에 문서만 연결합니다.</p> : null}
                    </fieldset>
                  ) : null}

                  {loadedCandidates.length === 0 ? (
                    !newDealFormOpen ? (
                      <div className="mt-3 rounded-lg border border-dashed bg-background px-5 py-8 text-center">
                        <div className="text-sm font-semibold">
                          연결할 거래 후보가 없습니다
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          문서에서 읽은 거래처명으로 새 거래를 등록할 수
                          있습니다.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          disabled={!tradeSeatAssigned}
                          onClick={() => {
                            prepareNewDealForm()
                            setNewDealFormOpen(true)
                          }}
                        >
                          <Plus data-icon="inline-start" /> 새 거래 등록
                        </Button>
                      </div>
                    ) : null
                  ) : (
                    <>
                      {!changingConnection && (ambiguousCandidates > 1 || !recommendedDealId) ? (
                        <Alert className="mt-3 border-[var(--color-orange-4)] bg-[var(--color-orange-5)]">
                          <AlertTriangle className="size-4" />
                          <AlertDescription className="text-xs">
                            {ambiguousCandidates > 1
                              ? "같은 근거를 충족하는 후보가 여러 건입니다. 거래를 직접 선택해 주세요."
                              : "AI 추천을 확정할 근거가 부족합니다. 거래를 직접 선택해 주세요."}
                          </AlertDescription>
                        </Alert>
                      ) : null}
                      <div className="relative mt-3">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          value={searchQuery}
                          onChange={(event) =>
                            setSearchQuery(event.target.value)
                          }
                          placeholder="거래번호, 거래명, 거래처 검색"
                          aria-label="거래 후보 검색"
                        />
                      </div>

                      <div
                        className="mt-3 overflow-hidden rounded-[var(--r-lg)] border border-[var(--color-gray-9)]"
                        role="radiogroup"
                        aria-label="거래 후보"
                      >
                        {candidates.map((candidate) => {
                          const selected = selectedDealId === candidate.id
                          const recommended = candidate.id === recommendedDealId
                          return (
                            <button
                              key={candidate.id}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              className={cn(
                                // 문서 올리기 V2 거래 후보 (6233:82241): 20px radio, 15 title,
                                // 13 meta, Blue 10 row when selected.
                                "flex w-full items-center gap-4 border-b border-[var(--color-gray-10)] px-5 py-3.5 text-left last:border-b-0 hover:bg-[var(--color-gray-11)]",
                                selected && "bg-[var(--color-primary-10)] hover:bg-[var(--color-primary-10)]"
                              )}
                              disabled={creatingDeal || linking || candidate.id === activeLink?.dealId}
                              onClick={() => handleCandidateSelect(candidate)}
                            >
                              <span
                                aria-hidden="true"
                                className={cn(
                                  "flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] bg-[var(--color-gray-12)]",
                                  selected
                                    ? "border-[var(--primary)]"
                                    : "border-[var(--color-gray-6)]"
                                )}
                              >
                                {selected ? (
                                  <span className="size-2.5 rounded-full bg-[var(--primary)]" />
                                ) : null}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex min-w-0 items-center gap-2">
                                  <strong className="truncate text-[15px] leading-[22px] font-medium text-[var(--color-gray-1)]">
                                    {candidate.title}
                                  </strong>
                                  <ToneBadge tone={candidate.tone}>
                                    {candidate.stage}
                                  </ToneBadge>
                                </span>
                                <span className="mt-0.5 block truncate text-[13px] leading-[18px] text-[var(--color-gray-5)]">
                                  {candidate.id} · {candidate.party}
                                </span>
                                <span className="mt-0.5 block text-[13px] leading-[18px] text-[var(--primary)]">
                                  {candidate.item} · {candidate.amount}{" "}
                                  {candidate.currency}
                                </span>
                                {candidate.id === activeLink?.dealId ? <span className="mt-2 block text-[10px] font-medium">현재 연결</span> : null}
                              </span>
                              {recommended ? (
                                <span className="flex shrink-0 items-center gap-1 text-[13px] text-[#6b4ee6]">
                                  <Sparkles className="size-3.5" /> AI 추천
                                </span>
                              ) : null}
                            </button>
                          )
                        })}
                        {candidates.length === 0 ? (
                          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                            검색 조건에 맞는 거래가 없습니다.
                          </div>
                        ) : null}
                      </div>

                      {selectedCandidate && document.documentType !== "BANK_STATEMENT" ? (
                        <details className="mt-3 border-y py-3 text-xs">
                          <summary className="cursor-pointer font-medium">서류 대조 보기</summary>
                          <dl className="mt-2 divide-y">
                            {comparisonRows.map((row) => (
                              <div key={row.label} className="flex justify-between gap-4 py-2">
                                <dt>{row.label}</dt>
                                <dd className="text-muted-foreground">{row.result}</dd>
                              </div>
                            ))}
                          </dl>
                        </details>
                      ) : null}

                      {selectedCandidate ? (
                        document.documentType === "BANK_STATEMENT" ? (
                          <section className="mt-3 rounded-[var(--r-lg)] border border-[var(--color-primary-4)] bg-background p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-[length:var(--text-header-7)] leading-[var(--leading-header-7)] font-bold">
                                  결제 일정에 매칭
                                </div>
                                <p className="mt-0.5 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-muted-foreground">
                                  같은 통화의 미결제 일정을 선택하면 문서 연결과
                                  정산 현금 기록을 함께 처리합니다.
                                </p>
                              </div>
                              <ToneBadge tone="blue">{readCurrency || "통화 확인 필요"}</ToneBadge>
                            </div>

                            <div
                              className="mt-3.5 grid"
                              role="radiogroup"
                              aria-label="미결제 일정"
                            >
                              {[
                                ...bankSchedules.map((schedule) => ({
                                  id: schedule.id,
                                  label: `${schedule.direction === "receivable" ? "받을 돈" : "보낼 돈"} · ${quotationMoney(schedule.outstanding ?? "")} ${schedule.currency}`,
                                  meta: `${schedule.counterparty} · ${schedule.dueDate} 예정`,
                                })),
                                { id: "document-only", label: "서류만 연결", meta: "현금은 기록하지 않고 정산에서 이어서 처리합니다." },
                              ].map((schedule) => (
                                <label
                                  key={schedule.id}
                                  className={cn(
                                    "flex cursor-pointer items-center gap-3 border-b border-[var(--color-gray-10)] py-3 last:border-b-0",
                                    bankScheduleId === schedule.id &&
                                      "text-[var(--color-primary-4)]"
                                  )}
                                >
                                  <input
                                    type="radio"
                                    name="bank-payment-schedule"
                                    className="size-5 shrink-0 accent-[var(--color-primary-4)]"
                                    checked={bankScheduleId === schedule.id}
                                    onChange={() =>
                                      setBankScheduleId(schedule.id)
                                    }
                                  />
                                  <span className="min-w-0">
                                    <span className="block text-[length:var(--text-body-8)] leading-[22px]">
                                      {schedule.label}
                                    </span>
                                    <span className="block truncate text-[length:var(--text-body-8)] leading-[22px] text-muted-foreground">
                                      {schedule.meta}
                                    </span>
                                  </span>
                                </label>
                              ))}
                            </div>

                            {bankScheduleId !== "document-only" && bankSchedules.length > 0 ? <div className="mt-3 grid grid-cols-2 gap-3">
                              <Field className="gap-1.5">
                                <FieldLabel>
                                  기록할 금액
                                </FieldLabel>
                                <Input
                                  value={bankMatchAmount}
                                  aria-label="기록할 금액"
                                  onChange={(event) =>
                                    setBankMatchAmount(event.target.value)
                                  }
                                  inputMode="decimal"
                                />
                              </Field>
                              <Field className="gap-1.5">
                                <FieldLabel>
                                  입출금일
                                </FieldLabel>
                                <DateInput
                                  ariaLabel="입출금일"
                                  value={bankValueDate}
                                  onValueChange={setBankValueDate}
                                />
                              </Field>
                            </div> : null}
                            {bankMatchIncomplete ? (
                              <p role="status" className="mt-2 text-[12px] font-medium text-[var(--color-orange-2)]">
                                {bankCashError ?? "미결제 일정을 선택하거나 서류만 연결해 주세요."}
                              </p>
                            ) : null}
                          </section>
                        ) : null
                      ) : null}
                    </>
                  )}
                </>
              )}
            </section> : null}
          </div>
        </ScrollArea>
      </div>
      {tradeSeatAssigned && changeDialog && connection ? <DocumentConnectionChangeDialog documentId={document.name} connection={connection} target={changeDialog.target} evidence={changeDialog.evidence} open
        onClose={() => setChangeDialog(null)}
        onApplied={accepted => { setConnection(accepted); setChangingConnection(false); setNewDealFormOpen(false); setSelectedDealId(null); onConnectionChanged?.(accepted); toast.success(accepted.link ? "거래 연결을 변경했습니다." : "거래 연결을 해제했습니다.") }} /> : null}
    </>
  )
}

import { getGeneratedDocumentListStage, generatedDocumentListStages } from "@trade-os/lib/generatedDocumentListStage"
import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { FileX2, FileClock, FileCheck2, ShieldCheck, MoreVertical, Copy, Trash2, AlertTriangle, LoaderCircle } from "lucide-react"
import { ToneBadge } from "@trade-os/components/ToneBadge"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { TablePagination } from "@/components/ui/table-pagination"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { DocumentStage } from "@trade-os/components/DocumentStage"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { prototypeBackend } from "@trade-os/lib/prototypeBackend"
import { toast } from "sonner"
import { templateSchemas, templateMeta, templates } from "@trade-os/documents/documentTemplateModel"
import { BusinessPageHero } from "@/components/platform/HeroBanner"
import { TemplateStrip, RelatedDealNotice } from "@trade-os/documents/DocumentCreatePanels"
import { ResultScreen } from "@trade-os/documents/DocumentCreateConnected"
import { StructuredDocumentCreateEditor } from "@trade-os/documents/DocumentCreateStepViews"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BusinessListToolbar, BusinessFilterSearch } from "@/components/platform/SearchFilterBar"
import { type GeneratedDraft, type CreateStartMode, type GeneratedDocumentOpenOptions, type ErpPreviewRole, type GeneratedDocumentDestination, type DocumentCreateWorkspaceStep, type DealDocumentContext, type DocumentDirection } from "@/App"
import { generatedDrafts } from "@trade-os/documents/documentTemplateModel"

const generatedDraftListStage = (draft: GeneratedDraft) =>
  getGeneratedDocumentListStage({
    status: draft.tab === "done" ? "sent" : draft.status === "확정" ? "confirmed" : "draft",
    approvalStatus: draft.approvalRequirement === "none" ? "none"
      : draft.approvalPreviewState === "requester-approved" ? "approved"
      : draft.approvalPreviewState === "requester-rejected" ? "rejected"
      : draft.approvalPreviewState?.endsWith("-pending") ? "pending"
      : "none",
  })

const generatedDraftReuseFacts: Record<string, string[]> = {
  "SC-2026-0708": [
    "거래처 ACME GmbH",
    "조건 CIF Hamburg",
    "금액 2,400,000.00 USD",
  ],
  "CI-2026-0708": ["은행 거절 전 점검", "거래 연결됨", "통화 USD"],
  "CI-2026-0712": ["은행 거절 전 점검", "거래처명 불일치", "확정 차단"],
  "CI-2026-0703": ["품목 Aluminium Scrap", "수량 20 MT", "통화 USD"],
  "CI-2026-0704": ["공유 링크 활성", "이메일 전달 전", "거래 연결됨"],
  "QT-2026-0630": ["운임 Hamburg", "선사 HMM", "ETA 08.03"],
  "SOA-2026-0629": ["정산 6월", "미수금 없음", "고객 전달 요청"],
}

export function RecentDocumentsTable({
  docs,
  onResult,
  onDelete,
  onDuplicate,
  role,
  currentAccountId,
  flush = false,
}: {
  docs: readonly GeneratedDraft[]
  onResult: (
    mode?: CreateStartMode,
    templateCode?: string,
    options?: GeneratedDocumentOpenOptions
  ) => void
  onDelete: (number: string) => Promise<boolean>
  onDuplicate: (draft: GeneratedDraft) => Promise<boolean>
  role: ErpPreviewRole
  currentAccountId: string
  flush?: boolean
}) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<GeneratedDraft | null>(null)
  const [deletePending, setDeletePending] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const [pdfPreviewTarget, setPdfPreviewTarget] =
    useState<GeneratedDraft | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const totalPages = Math.max(1, Math.ceil(docs.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleDocs = docs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  if (docs.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border bg-background px-5 py-10 text-center text-sm text-muted-foreground",
          flush ? "m-4" : "mt-5"
        )}
      >
        해당 상태의 최근 문서가 없습니다.
      </div>
    )
  }

  return (
    <div className={cn(!flush && "mt-5")}>
      <Table className="min-w-[1040px] table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[27%] text-left">문서</TableHead>
            <TableHead className="w-[15%] text-left">Deal</TableHead>
            <TableHead className="w-[16%]">상태</TableHead>
            <TableHead className="w-[13%] text-left">생성자</TableHead>
            <TableHead className="w-[12%] text-left">수정</TableHead>
            <TableHead className="w-[17%] text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleDocs.map((draft) => {
            const reuseFacts = generatedDraftReuseFacts[draft.number] ?? []
            const rowDestination: GeneratedDocumentDestination =
              draft.tab === "confirmed"
                ? "confirmed"
                : draft.tab === "sharing"
                  ? "link-created"
                  : draft.tab === "done"
                    ? "shared"
                    : "editor"
            const actionDestination: GeneratedDocumentDestination =
              draft.tab === "confirmed" ? "share" : rowDestination
            const isDraft = draft.tab === "draft" || draft.tab === "progress"
            const resumeWorkspaceStep: DocumentCreateWorkspaceStep =
              draft.pdfState === "none" ? "source" : "editor"
            const listStage = generatedDraftListStage(draft)
            const canOpenDeal = role !== "member" || draft.memberCanAccessDeal
            // Generated documents belong to the organization; Deal access is independent.
            const canDeliver = true
            const canDelete =
              role === "owner" ||
              (draft.creatorAccountId !== null &&
                draft.creatorAccountId === currentAccountId)
            const pdfStateLabel =
              draft.pdfState === "none"
                ? "PDF 미생성"
                : draft.pdfState === "draft"
                  ? "PDF 검토하기"
                  : draft.pdfState === "reviewed"
                    ? "초안 PDF 보기"
                    : "최종 PDF 보기"
            const PdfStateIcon =
              draft.pdfState === "none"
                ? FileX2
                : draft.pdfState === "draft"
                  ? FileClock
                  : FileCheck2
            const openDraft = (
              destination: GeneratedDocumentDestination,
              openSharePanel = false
            ) =>
              onResult("generated", draft.number.split("-")[0], {
                destination,
                dealId: draft.dealId,
                openSharePanel,
                memberCanDeliver: draft.memberCanDeliver,
                memberCanAccessDeal: draft.memberCanAccessDeal,
                documentNumber: draft.number,
                pdfState: draft.pdfState,
                workspaceStep: resumeWorkspaceStep,
              })
            return (
              <TableRow
                key={draft.number}
                data-clickable="true"
                tabIndex={0}
                className="group cursor-pointer focus-visible:relative focus-visible:z-10 focus-visible:[box-shadow:var(--shadow-keyboard-focus)] focus-visible:outline-none"
                onClick={() => openDraft(rowDestination)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    openDraft(rowDestination)
                  }
                }}
              >
                <TableCell className="h-auto min-w-0 py-3 text-left whitespace-normal">
                  <div className="flex min-w-0 items-center gap-2">
                    <ToneBadge tone="blue">{draft.type}</ToneBadge>
                    <span className="truncate">
                      {draft.title}
                    </span>
                  </div>
                  <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-sm leading-[18px] text-muted-foreground">
                    <span>{draft.number}</span>
                    {reuseFacts.slice(0, 2).map((fact) => (
                      <span
                        key={fact}
                        className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary"
                      >
                        {fact}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-left text-muted-foreground">
                  {draft.dealId ? (
                    canOpenDeal ? (
                      <span className="truncate">{draft.dealId}</span>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 text-xs">
                            <ShieldCheck className="size-3.5" /> 연결 정보 제한
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          이 발행 문서는 볼 수 있지만 연결된 Deal은 별도 권한이
                          필요합니다.
                        </TooltipContent>
                      </Tooltip>
                    )
                  ) : (
                    <span className="text-xs">미연결</span>
                  )}
                </TableCell>
                <TableCell className="whitespace-normal">
                  <ToneBadge tone={listStage.tone}>{listStage.label}</ToneBadge>
                  {draft.readiness && (
                    <div
                      className="mt-1 truncate text-sm leading-[18px] text-muted-foreground"
                      title={draft.readiness}
                    >
                      {draft.readiness}
                    </div>
                  )}
                </TableCell>
                <TableCell className="truncate text-left">
                  <span
                    title={
                      draft.creatorAccountId
                        ? draft.creatorName
                        : "생성자 정보를 확인할 수 없습니다."
                    }
                  >
                    {draft.creatorName}
                  </span>
                </TableCell>
                <TableCell className="text-left whitespace-nowrap text-muted-foreground">
                  {draft.updated}
                </TableCell>
                <TableCell className="relative">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="xs"
                      onClick={(event) => {
                        event.stopPropagation()
                        openDraft(
                          isDraft || !canDeliver
                            ? rowDestination
                            : actionDestination,
                          canDeliver && !isDraft
                        )
                      }}
                    >
                      {isDraft ? "이어쓰기" : canDeliver ? "고객 전달" : "보기"}
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className={cn(
                              "text-muted-foreground",
                              draft.pdfState === "draft" && "text-primary",
                              draft.pdfState === "reviewed" && "text-primary",
                              draft.pdfState === "final" && "text-emerald-700"
                            )}
                            aria-label={`${draft.title} ${pdfStateLabel}`}
                            disabled={draft.pdfState === "none"}
                            onClick={(event) => {
                              event.stopPropagation()
                              if (draft.pdfState === "draft") {
                                openDraft(rowDestination)
                                return
                              }
                              if (
                                draft.pdfState === "reviewed" ||
                                draft.pdfState === "final"
                              ) {
                                setPdfPreviewTarget(draft)
                              }
                            }}
                          >
                            <PdfStateIcon className="size-4" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{pdfStateLabel}</TooltipContent>
                    </Tooltip>
                    {/* Portal menu so the scrolling table never clips it. */}
                    <DropdownMenu
                      open={openMenu === draft.number}
                      onOpenChange={(open) =>
                        setOpenMenu(open ? draft.number : null)
                      }
                    >
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground"
                          aria-label={`${draft.title} 메뉴`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="min-w-36"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <DropdownMenuItem onSelect={() => void onDuplicate(draft)}>
                          <Copy /> 복제하여 수정
                        </DropdownMenuItem>
                        {canDelete ? (
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => {
                              setDeleteError("")
                              setDeleteTarget(draft)
                            }}
                          >
                            <Trash2 /> 삭제
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <TablePagination
        className={cn(!flush && "mt-3 px-1")}
        page={currentPage}
        pageSize={pageSize}
        total={docs.length}
        pageSizeOptions={[10, 20, 50]}
        aria-label="최근 생성 문서 페이지 이동"
        onPageChange={setPage}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize)
          setPage(1)
        }}
      />
      <Dialog
        open={pdfPreviewTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPdfPreviewTarget(null)
        }}
      >
        <DialogContent className="flex h-[min(88svh,900px)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
          <DialogHeader className="shrink-0 border-b px-5 py-4 text-left">
            <DialogTitle>
              {pdfPreviewTarget?.pdfState === "final"
                ? "최종 PDF 보기"
                : "초안 PDF 보기"}
            </DialogTitle>
            <DialogDescription>
              {pdfPreviewTarget?.title} · {pdfPreviewTarget?.number}
            </DialogDescription>
          </DialogHeader>
          {pdfPreviewTarget ? (
            <div className="min-h-0 flex-1">
              <DocumentStage
                result
                fitPage
                controlsPlacement="top"
                templateCode={pdfPreviewTarget.number.split("-")[0]}
                toolbarEyebrow={
                  pdfPreviewTarget.pdfState === "final"
                    ? "확정 문서"
                    : "검토된 초안"
                }
                toolbarTitle={`${pdfPreviewTarget.number}.pdf`}
                reviewGate={{
                  completed: true,
                  onComplete: () => undefined,
                  downloadLabel:
                    pdfPreviewTarget.pdfState === "final"
                      ? "최종 PDF 다운로드"
                      : "초안 PDF 다운로드",
                }}
                downloadName={`${pdfPreviewTarget.number}-${
                  pdfPreviewTarget.pdfState === "final" ? "FINAL" : "DRAFT"
                }.pdf`}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deletePending) {
            setDeleteTarget(null)
            setDeleteError("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>문서를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제하면 문서 목록에서 사라지고 공유 중인 링크를 사용할 수
              없습니다. 발행·전달 이력은 보존됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteTarget ? (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <div className="font-medium">{deleteTarget.title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {deleteTarget.number} · 생성자 {deleteTarget.creatorName}
              </div>
            </div>
          ) : null}
          {deleteError ? (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deletePending}
              onClick={(event) => {
                event.preventDefault()
                if (!deleteTarget) return
                setDeletePending(true)
                setDeleteError("")
                void onDelete(deleteTarget.number).then((deleted) => {
                  setDeletePending(false)
                  if (deleted) {
                    setDeleteTarget(null)
                  } else {
                    setDeleteError(
                      "문서 보관 또는 공유 링크 철회를 완료하지 못했습니다. 현재 상태를 유지한 채 다시 시도해 주세요."
                    )
                  }
                })
              }}
            >
              {deletePending ? (
                <LoaderCircle
                  className="animate-spin"
                  data-icon="inline-start"
                />
              ) : null}
              {deletePending ? "삭제 처리 중" : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function CreateScreen({
  onResult,
  initialEntryState = "first",
  initialTemplateCode,
  relatedDeal = null,
  role,
}: {
  onResult: (
    mode?: CreateStartMode,
    templateCode?: string,
    options?: GeneratedDocumentOpenOptions
  ) => void
  initialEntryState?: "history" | "first"
  initialTemplateCode?: string
  relatedDeal?: DealDocumentContext | null
  role: ErpPreviewRole
}) {
  const [entryState, setEntryState] = useState<"history" | "first">(
    initialEntryState
  )
  const [unifiedWorkbenchOpen, setUnifiedWorkbenchOpen] = useState(false)
  const [workbenchTemplateCode, setWorkbenchTemplateCode] = useState(
    relatedDeal ? "QT" : "SC"
  )
  const [workbenchDirection, setWorkbenchDirection] = useState<DocumentDirection | null>(null)
  const [workbenchDocumentNumber, setWorkbenchDocumentNumber] = useState<string | null>(null)
  const [structuredEditorOpen, setStructuredEditorOpen] = useState(false)
  const [createdDocuments, setCreatedDocuments] = useState<GeneratedDraft[]>(
    () => [...generatedDrafts]
  )
  const [documentSearch, setDocumentSearch] = useState("")
  const [documentListTab, setDocumentListTab] = useState("all")
  const duplicateSequenceRef = useRef(83)
  const currentAccount =
    role === "owner"
      ? { id: "account-owner", name: "조민영" }
      : role === "admin"
        ? { id: "account-admin", name: "박서윤" }
        : { id: "account-member", name: "김도현" }
  const showInitialTemplateState = entryState === "first"
  const visibleDocuments = relatedDeal
    ? createdDocuments.filter((draft) => draft.dealId === relatedDeal.id)
    : createdDocuments
  const hasGeneratedDocuments =
    !showInitialTemplateState && visibleDocuments.length > 0
  const searchedDocuments = visibleDocuments.filter((draft) =>
    [draft.title, draft.number, draft.party, generatedDraftListStage(draft).label].some((value) =>
      value.toLowerCase().includes(documentSearch.trim().toLowerCase())
    )
  )
  const documentTabs = [
    { value: "all", label: "전체", docs: searchedDocuments },
    ...generatedDocumentListStages.map((stage) => ({
      ...stage,
      docs: searchedDocuments.filter((doc) => generatedDraftListStage(doc).value === stage.value),
    })),
  ]
  const handleDeleteCreatedDocument = async (number: string) => {
    const result =
      await prototypeBackend.generatedDocuments.archiveWithShareLinks({
        id: number,
      })
    if (!result.ok) {
      toast.error(result.error)
      return false
    }
    setCreatedDocuments((current) =>
      current.filter((draft) => draft.number !== number)
    )
    toast.success(
      "문서를 업무 목록에서 보관하고 활성 공유 링크를 철회했습니다."
    )
    return true
  }
  const handleDuplicateCreatedDocument = async (draft: GeneratedDraft, openAfterDuplicate = false) => {
    const result = await prototypeBackend.generatedDocuments.duplicate({
      id: draft.number,
    })
    if (!result.ok) {
      toast.error(result.error)
      return false
    }
    const nextSequence = duplicateSequenceRef.current++
    const nextNumber = `${draft.number.split("-")[0]}-2026-${String(nextSequence).padStart(4, "0")}`
    const duplicatedDraft: GeneratedDraft = {
      ...draft,
      number: nextNumber,
      title: `${draft.title.replace(/\s+(초안|복제본)$/, "")} 복제본`,
      status: "작성 중",
      tone: "neutral",
      readiness: `원본 ${draft.number}에서 복제`,
      tab: "draft",
      pdfState: "none",
      approvalPreviewState: "live",
      approvalRequirement: "required",
      creatorName: currentAccount.name,
      creatorAccountId: currentAccount.id,
      updated: "방금 전",
    }
    setCreatedDocuments((current) => [duplicatedDraft, ...current])
    if (openAfterDuplicate) {
      setWorkbenchTemplateCode(draft.number.split("-")[0])
      setWorkbenchDocumentNumber(nextNumber)
      setUnifiedWorkbenchOpen(true)
    }
    toast.success(
      `${nextNumber} 작성 중 문서를 만들었습니다. 원본은 변경되지 않습니다.`
    )
    return true
  }
  const openUnifiedWorkbench = (
    _mode?: CreateStartMode,
    templateCode?: string,
    direction?: DocumentDirection
  ) => {
    setWorkbenchTemplateCode(
      templateCode && templateSchemas[templateCode] ? templateCode : "SC"
    )
    setWorkbenchDirection(direction ?? null)
    setWorkbenchDocumentNumber(null)
    setUnifiedWorkbenchOpen(true)
  }
  // The type selector is the page's main action, so it sits in the hero and
  // overlaps its lower edge like the 문서 올리기 upload card.
  const pageHeading = (
    <BusinessPageHero
      title="문서 만들기"
      description="발행 문서를 검색·필터하고, 이어서 작성·PDF·복제·삭제·고객 전달을 한곳에서 처리합니다."
      className="mb-6"
      summary={<TemplateStrip onResult={openUnifiedWorkbench} initialSelectedCode={initialTemplateCode} />}
    />
  )

  if (unifiedWorkbenchOpen) {
    return (
      <ResultScreen
        key={workbenchDocumentNumber ?? workbenchTemplateCode}
        initialTemplateCode={workbenchTemplateCode}
        initialDirection={workbenchDirection}
        initialDocumentNumber={workbenchDocumentNumber}
        relatedDeal={relatedDeal}
        initialWorkspaceStep={workbenchDocumentNumber ? "editor" : "source"}
        role={role}
        onDuplicateConfirmed={(direction) => {
          const sourceNumber = workbenchDocumentNumber ?? `${workbenchTemplateCode}-2026-0708`
          const draft = createdDocuments.find((item) => item.number === sourceNumber) ?? {
            dealId: relatedDeal?.id ?? "",
            title: templateMeta(workbenchTemplateCode)[1],
            type: templateMeta(workbenchTemplateCode)[1],
            number: sourceNumber,
            party: relatedDeal?.party ?? "거래 미연결",
            status: "확정" as const,
            tone: "success" as const,
            readiness: "확정",
            tab: "confirmed" as const,
            creatorName: currentAccount.name,
            creatorAccountId: currentAccount.id,
            updated: "방금 전",
            memberCanAccessDeal: Boolean(relatedDeal),
            memberCanDeliver: true,
            pdfState: "final" as const,
            approvalRequirement: "none" as const,
          }
          setWorkbenchDirection(direction)
          void handleDuplicateCreatedDocument(draft, true)
        }}
        onBackToList={() => {
          setUnifiedWorkbenchOpen(false)
          setStructuredEditorOpen(false)
          setEntryState("history")
        }}
      />
    )
  }

  if (structuredEditorOpen) {
    return (
      <StructuredDocumentCreateEditor
        onCreate={onResult}
        onOpenSettings={() => setStructuredEditorOpen(false)}
        relatedDeal={relatedDeal}
      />
    )
  }

  if (showInitialTemplateState) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-auto bg-transparent">
        <div className="w-full shrink-0 px-4 pt-5 sm:px-5 sm:pt-6">
          {relatedDeal ? <RelatedDealNotice deal={relatedDeal} /> : null}
          <div className="pb-8">{pageHeading}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full min-h-0 overflow-auto bg-transparent">
      <section className="w-full px-4 py-5 sm:px-5 sm:py-6">
        {relatedDeal ? <RelatedDealNotice deal={relatedDeal} compact /> : null}
        {pageHeading}

        <section>
          {hasGeneratedDocuments ? (
            <>
              {/* Same list card as 문서 올리기: toolbar and table sit inside the
                  16px card inset, no divider between them. */}
              <Card size="sm">
                <Tabs
                  value={documentListTab}
                  onValueChange={setDocumentListTab}
                >
                  <BusinessListToolbar
                    className="px-4 pt-4"
                    aria-label="만든 문서 검색 필터"
                  >
                    <TabsList aria-label="만든 문서 상태">
                      {documentTabs.map((tab) => (
                        <TabsTrigger key={tab.value} value={tab.value}>
                          {tab.label} {tab.docs.length}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <div className="ml-auto flex min-w-[240px] flex-1 justify-end">
                      <BusinessFilterSearch
                        label="만든 문서 검색"
                        placeholder="문서번호, 거래처, 상태 검색"
                        value={documentSearch}
                        onValueChange={setDocumentSearch}
                      />
                    </div>
                  </BusinessListToolbar>
                  {documentTabs.map(({ value, docs }) => (
                    <TabsContent
                      key={value as string}
                      value={value as string}
                      className="m-0"
                    >
                      <CardContent data-layout="flush-table" className="p-0">
                        <RecentDocumentsTable
                          docs={docs as GeneratedDraft[]}
                          onResult={onResult}
                          onDelete={handleDeleteCreatedDocument}
                          onDuplicate={handleDuplicateCreatedDocument}
                          role={role}
                          currentAccountId={currentAccount.id}
                          flush
                        />
                      </CardContent>
                    </TabsContent>
                  ))}
                </Tabs>
              </Card>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 xl:grid-cols-3">
              {templates.map(([kind, title, desc, usage]) => (
                <div
                  key={title}
                  className="group min-h-34 rounded-lg border bg-background p-4 text-left transition hover:border-primary/60 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <ToneBadge tone="blue">{kind}</ToneBadge>
                  </div>
                  <div className="mt-4 text-base font-semibold tracking-normal">
                    {title}
                  </div>
                  <div className="mt-2 text-sm leading-5 text-muted-foreground">
                    {desc}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <ToneBadge tone="neutral">{usage}</ToneBadge>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="h-1 w-10 rounded-full bg-primary/50 transition group-hover:w-16" />
                    <span className="opacity-0 transition group-hover:opacity-100">
                      <Button
                        size="sm"
                        onClick={() => openUnifiedWorkbench("template", kind)}
                      >
                        시작
                      </Button>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  )
}

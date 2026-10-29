import { SnapStartGuidePage } from "@snap/onboarding/SnapStartGuidePage"
import { dealDocumentFromReviewUrl } from "@trade-os/lib/dealDocumentActions"
import { appLocation } from "@/app/appLocation"
import { StartGuideProvider } from "@trade-os/onboarding/StartGuideProvider"
import { SettingsDemoProvider } from "@share/settings/SubscriptionSettings"
import { PageLoadingBoundary } from "@/components/platform/RouteLoading"
import { type DeliveryAttachment } from "@trade-os/documents/DeliveryAttachmentPicker"
import { type ReviewedField } from "@trade-os/lib/erpDocumentWorkflow"
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react"

import { type GeneratedDocumentMetadata } from "@trade-os/lib/generatedDocumentMetadata"
import { PageFrame } from "@/components/platform/PageFrame"
import { SalesPrototype } from "@trade-os/sales/SalesPipelineView"
import { workspaceOptions, type WorkspaceKey } from "@/lib/workspaces"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/Sidebar"
import {
  DealDetailScreen,
  DealsScreen,
  type GeneratedDealDocumentSummary,
} from "@trade-os/deals/DealsListView"
import {
  HomePrototype as V2HomePrototype,
  type HomePreviewState,
} from "@trade-os/home/HomeProtectedPage"
import { OperationsScreen } from "@trade-os/OperationsScreens"
import { NotificationsPrototype } from "@share/notifications/page"
import { notifications, type NotificationDealTarget } from "@share/notifications/data"
import { BillingPrototype, CounterpartyPrototype, OnboardingPrototype, SettingsPrototype, SnapEvidencePrototype, TokenUsagePrototype, type ErpMenuTarget } from "@trade-os/ErpScreens"
import { AskPrototype } from "@trade-os/ai/AiWorkspace"
import {
  SnapProductPrototype,
  type SnapScreenKey,
} from "@snap/SnapScreens"
import { SnapRouteAccessScreen } from "@snap/access/SnapRouteAccessScreen"
import {
  ensureSnapWorkspaceSession,
  resetSnapSessionAccessCache,
  useSnapRouteAccess,
} from "@snap/lib/snapRouteAccess"
import {
  matchSnapRoute,
  normalizeSnapLocation,
  pathForSnapScreen,
  type SnapRouteMatch,
} from "@snap/lib/snapRoutes"
import {
  canonicalErpLocation,
  matchErpRoute,
  pathForErpScreen,
  type ErpRouteMatch,
  type ErpRouteScreen,
} from "@trade-os/lib/erpRoutes"
import { cn } from "@/lib/utils"
import { prototypeBackend } from "@trade-os/lib/prototypeBackend"
import { toast } from "sonner"
import { ViewSeatProvider } from "@trade-os/components/ViewSeatGate"
import { type Tone, templateSchemas } from "@trade-os/documents/documentTemplateModel"
import { type PrototypeSlotKind, templates } from "@trade-os/documents/documentTemplateModel"
import { AppNav } from "@/shell/ErpNav"
import { WorkspaceHeader } from "@/shell/ErpTopNavSlot"
import { InboxScreen } from "@trade-os/inbox/InboxView"
import { ResultScreen } from "@trade-os/documents/DocumentCreateConnected"
import { CreateScreen } from "@trade-os/documents/DocumentsListView"
import { readUploadDocumentDealLinks } from "@trade-os/inbox/uploadDocumentModel"
import { getGeneratedDocumentsForDeal, generatedDrafts } from "@trade-os/documents/documentTemplateModel"
import { UPLOAD_DOCUMENT_DEAL_LINKS_STORAGE_KEY } from "@trade-os/inbox/uploadDocumentModel"
import { dealDocumentContexts } from "@trade-os/documents/documentTemplateModel"

export type Screen = ErpMenuTarget | "result" | "snap-platform"
export type ProductKey = "erp" | "snap"
export type ErpPreviewRole = "owner" | "admin" | "member"

// `?plan=trial|expired` and `?snap=none` come from the demo login (구독 상태
// accounts); without them Trade OS and SNAP are paid subscriptions.
function erpPreviewSubscriptionStates() {
  const search = new URLSearchParams(appLocation.search)
  const plan = search.get("plan")
  return {
    erp: plan === "trial" ? "trial_active" : plan === "expired" ? "trial_expired" : "paid_active",
    snap: search.get("snap") === "none" ? "trial_not_started" : "paid_active",
  } as const
}
export type DocumentStageKey =
  "field" | "ocr" | "confirmed" | "queued" | "excluded" | "failed" | "duplicate"
export type UploadDocumentType =
  | "UNK"
  | "QC"
  | "BL"
  | "PO"
  | "CI"
  | "SC"
  | "PL"
  | "CUSTOMS_ENTRY"
  | "PI"
  | "C/O"
  | "AN"
  | "BANK_STATEMENT"
  | "FREIGHT_INVOICE"
  | "CUSTOMS_DECLARATION"
  | "INSURANCE_CERTIFICATE"
  | "OTHER"
export type DocumentCreateWorkspaceStep = "source" | "fields" | "editor"
export type CreateStartMode = "generated" | "template"
export type DocumentDirection = "purchase" | "sales"
export type GeneratedDocumentPdfState = "none" | "draft" | "reviewed" | "final"
export type GeneratedDocumentDestination =
  "editor" | "confirmed" | "share" | "link-created" | "shared"
export type GeneratedDocumentOpenOptions = {
  destination: GeneratedDocumentDestination
  dealId: string
  openSharePanel?: boolean
  memberCanDeliver?: boolean
  memberCanAccessDeal?: boolean
  documentNumber?: string
  pdfState?: GeneratedDocumentPdfState
  workspaceStep?: DocumentCreateWorkspaceStep
}
export type UploadDetailStep = "compare" | "deal"
export type RecentDocument = {
  name: string
  uploadedAt: string
  pages?: number
  sourcePages?: Record<string, number>
  dealLabel?: string
  status: string
  tone: Tone
  stage: DocumentStageKey
  documentType: UploadDocumentType
  pdfReviewCompleted?: boolean
  reviewedFields?: Record<string, ReviewedField>
  contentHash?: string
  dealDocumentId?: string
  fileDataUrl?: string
  retryCount?: number
}
export type UploadDocumentDealLink = {
  dealId: string
  dealLabel: string
}
export type UploadDocumentDealLinks = Record<string, UploadDocumentDealLink>

function writeUploadDocumentDealLinks(links: UploadDocumentDealLinks) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(
      UPLOAD_DOCUMENT_DEAL_LINKS_STORAGE_KEY,
      JSON.stringify(links)
    )
  } catch {
    // Prototype state still remains available for the current App session.
  }
}
export type DocumentElementStatus = {
  logo: boolean
  itemCount: number
  copy: boolean
  approval: "idle" | "requested" | "approved" | "rejected"
}
export type DocumentApprovalChoice = "none" | "request"
export type DocumentApprovalPreviewState =
  | "live"
  | "requester-pending"
  | "requester-approved"
  | "requester-rejected"
  | "owner-pending"
  | "admin-pending"
export type DocumentApprovalEvent = {
  id: number
  type: "request" | "approve" | "reject" | "invalidate" | "edit"
  actor: string
  actorRole: "작성자" | "Owner" | "Admin"
  occurredAt: string
  reason?: string
}
export type DocumentApprover = {
  id: string
  name: string
  role: "Owner" | "Admin"
}
export type DocumentSaveState = "saved" | "unsaved" | "saving" | "error"
export type ReviewFocusTarget = {
  key: string
  label: string
}
export type ReviewFocusRequest = {
  targets: ReviewFocusTarget[]
  token: number
}
export type DeliveryLink = {
  id: number
  recipient: string
  status: "active" | "revoked" | "expired" | "maxed"
  expires: string
  opens: number
  maxOpens: number
  createdAt?: string
  revokedAt?: string
  revokeReason?: string
}
export type EmailRecord = {
  id: number
  recipient: string
  subject: string
  textBody?: string
  sentAt: string
  linkCount: number
  status?: "requested" | "queued" | "sending" | "accepted" | "delivered" | "failed" | "cancelled"
  attempts?: number
  errorCode?: string
}

export type GeneratedDraft = {
  documentMetadata?: GeneratedDocumentMetadata
  dealId: string
  title: string
  type: string
  number: string
  party: string
  status: "작성 중" | "승인 대기" | "승인 완료" | "반려" | "확정" | "발송됨"
  tone: Tone
  readiness: string
  tab: "draft" | "confirmed" | "progress" | "sharing" | "done"
  creatorName: string
  creatorAccountId: string | null
  updated: string
  memberCanAccessDeal: boolean
  memberCanDeliver: boolean
  pdfState: GeneratedDocumentPdfState
  approvalRequirement: "required" | "none"
  approvalPreviewState?: DocumentApprovalPreviewState
}

export type ReviewField = {
  key: string
  label: string
  value: string
  kind: PrototypeSlotKind
  status: string
  source: string
  confidence: string
  comment: string
  tone: Tone
  unit?: string
  required?: boolean
  warningOnly?: boolean
  userEdited?: boolean
}

export type DealDocumentContext = {
  id: string
  title: string
  party: string
}

export type DocumentComparisonFacts = {
  counterparty: string
  currency: string
  bankName: string
  bankAccount: string
  itemNames: string[]
  totalAmount: string | null
}

export type DocumentSourceDeal = DealDocumentContext & {
  amount: string
  currency: string
  item: string
  stage: string
  tone: Tone
}

const getDealDocumentContext = (dealId: string): DealDocumentContext =>
  dealDocumentContexts[dealId] ?? {
    id: dealId,
    title: "거래 관련 문서",
    party: "거래처 미지정",
  }

const getGeneratedDealDocumentSummaries = (
  dealId: string
): GeneratedDealDocumentSummary[] =>
  getGeneratedDocumentsForDeal(dealId).map((document) => ({
    number: document.number,
    title: document.title,
    type: document.type,
    state:
      document.tab === "confirmed"
        ? "confirmed"
        : document.tab === "sharing"
          ? "link-created"
          : document.tab === "done"
            ? "shared"
            : "draft",
  }))

// Kept as a reference fallback for the earlier copy-polish overlay.
export type DocumentSourceMode = "deal" | "files"

export type DocumentDiscrepancyFinding = {
  key: string
  label: string
  detail: string
  source: string
  currentValue: string
  referenceValue: string
  state: "pass" | "warning" | "error"
}

export type DocumentDiscrepancyReview = {
  blocking: boolean
  errorCount: number
  warningCount: number
  findings: DocumentDiscrepancyFinding[]
  referenceDocuments: string[]
  basisReady: boolean
  basisDocument: string | null
  basisMessage: string
}

type ReviewChecklistState = "complete" | "pending" | "blocked"
type ReviewChecklistAction =
  "review" | "deal" | "bank" | "approval" | "rejection"
export type ReviewChecklistRow = {
  label: string
  value: string
  state: ReviewChecklistState
  action?: ReviewChecklistAction
}

function readCurrentSnapRoute(): SnapRouteMatch | null {
  if (typeof window === "undefined") return null
  const normalized = normalizeSnapLocation(
    appLocation.pathname,
    appLocation.search
  )
  if (normalized.changed) {
    window.history.replaceState(
      { ...(window.history.state ?? {}), product: "snap" },
      "",
      `${normalized.pathname}${normalized.search}`
    )
  }
  return matchSnapRoute(normalized.pathname, normalized.search)
}

function readCurrentErpRoute(): ErpRouteMatch | null {
  if (typeof window === "undefined") return null
  const canonical = canonicalErpLocation(appLocation)
  if (canonical)
    window.history.replaceState(window.history.state, "", canonical)
  return matchErpRoute(appLocation.pathname)
}

export function App() {
  const initialSnapRoute = readCurrentSnapRoute()
  const initialErpRoute = initialSnapRoute ? null : readCurrentErpRoute()
  const initialGeneratedDocument = initialErpRoute?.params.documentNumber
    ? generatedDrafts.find(
        (document) => document.number === initialErpRoute.params.documentNumber
      )
    : undefined
  const [snapRoute, setSnapRoute] = useState<SnapRouteMatch | null>(
    initialSnapRoute
  )
  const [erpRoute, setErpRoute] = useState<ErpRouteMatch | null>(
    initialErpRoute
  )
  const [screen, setScreen] = useState<Screen>(() =>
    initialSnapRoute?.definition.screen === "SC-30"
      ? "settings"
      : initialSnapRoute
        ? "snap-platform"
        : (initialErpRoute?.screen ?? "home")
  )
  const [product, setProduct] = useState<ProductKey>(() =>
    initialSnapRoute ? "snap" : "erp"
  )
  const [erpHomeVariant, setErpHomeVariant] = useState<"legacy" | "v2">(() =>
    appLocation.pathname === "/v2-home" ? "v2" : "legacy"
  )
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 1280)
  const [workspaceId, setWorkspaceId] = useState<WorkspaceKey>(() => {
    try { const stored = localStorage.getItem("ecoya.preview.workspace"); return workspaceOptions.find(item => item.id === stored)?.id ?? "ecoya" } catch { return "ecoya" }
  })
  const [erpHomeRole, setErpHomeRole] = useState<ErpPreviewRole>(() => {
    const role = new URLSearchParams(appLocation.search).get("role")
    return role === "admin" || role === "member" ? role : "owner"
  })
  // Market (시장정보) and insight (인사이트) entitlements; `?access=basic` previews
  // the account without either add-on, as in the Figma 권한 없음 home variants.
  const homeEntitlements = (() => {
    const access = new URLSearchParams(appLocation.search).get("access")
    return { market: access !== "basic", insight: access !== "basic" }
  })()
  const homePreviewState = (() => {
    const state = new URLSearchParams(appLocation.search).get("state")
    return state === "empty" || state === "first-use" || state === "error"
      ? (state as HomePreviewState)
      : "default"
  })()
  const [documentApprovalPreviewState, setDocumentApprovalPreviewState] =
    useState<DocumentApprovalPreviewState>("live")
  const [lastErpScreen, setLastErpScreen] = useState<ErpRouteScreen>(
    initialErpRoute?.screen ?? "home"
  )
  const [snapScreen, setSnapScreen] = useState<SnapScreenKey>(
    initialSnapRoute?.definition.screen ?? "SC-10"
  )
  const [screenLoading, setScreenLoading] = useState(true)
  const [selectedTemplateCode, setSelectedTemplateCode] = useState(
    initialErpRoute?.params.documentNumber?.split("-")[0] ?? "SC"
  )
  const [resultDirection, setResultDirection] = useState<DocumentDirection | null>(null)
  const [resultInitialWorkspaceStep, setResultInitialWorkspaceStep] =
    useState<DocumentCreateWorkspaceStep>(
      initialGeneratedDocument?.pdfState === "none" ? "source" : "editor"
    )
  const [resultInitialPdfState, setResultInitialPdfState] =
    useState<GeneratedDocumentPdfState>(
      initialGeneratedDocument?.pdfState ?? "draft"
    )
  const [selectedDealId, setSelectedDealId] = useState(
    initialErpRoute?.params.dealId ?? "DL-260708-01"
  )
  const [uploadOriginDealId, setUploadOriginDealId] = useState<string | null>(() =>
    new URLSearchParams(appLocation.search).get("fromDeal")
  )
  const [uploadDocumentDealLinks, setUploadDocumentDealLinks] =
    useState<UploadDocumentDealLinks>(readUploadDocumentDealLinks)
  const [dealHeaderActionsTarget, setDealHeaderActionsTarget] =
    useState<HTMLDivElement | null>(null)
  const [dealNotificationTarget, setDealNotificationTarget] =
    useState<NotificationDealTarget | null>(null)
  const [readNotificationIds, setReadNotificationIds] = useState<Set<number>>(
    new Set()
  )
  const [openDeliveryOnResult, setOpenDeliveryOnResult] = useState(false)
  const [openConfirmedOnResult, setOpenConfirmedOnResult] = useState(
    Boolean(
      initialGeneratedDocument &&
      initialGeneratedDocument.tab !== "draft" &&
      initialGeneratedDocument.tab !== "progress"
    )
  )
  const [openLinkCreatedOnResult, setOpenLinkCreatedOnResult] = useState(
    initialGeneratedDocument?.tab === "sharing" ||
      initialGeneratedDocument?.tab === "done"
  )
  const [openSharedOnResult, setOpenSharedOnResult] = useState(
    initialGeneratedDocument?.tab === "done"
  )
  const [resultMemberCanDeliver, setResultMemberCanDeliver] = useState(
    initialGeneratedDocument?.memberCanDeliver ?? true
  )
  const [resultDealConnectionRestricted, setResultDealConnectionRestricted] =
    useState(false)
  const [resultDocumentNumber, setResultDocumentNumber] = useState<
    string | null
  >(initialErpRoute?.params.documentNumber ?? null)
  const [resultDealContext, setResultDealContext] =
    useState<DealDocumentContext | null>(() =>
      initialGeneratedDocument?.dealId
        ? getDealDocumentContext(initialGeneratedDocument.dealId)
        : null
    )
  const [resultDeliveryAttachments, setResultDeliveryAttachments] = useState<
    DeliveryAttachment[]
  >([])
  const [pendingAskQuestion, setPendingAskQuestion] = useState("")
  const [pendingAskSubmit, setPendingAskSubmit] = useState(false)
  const [createDealContext, setCreateDealContext] =
    useState<DealDocumentContext | null>(() => {
      const dealId = new URLSearchParams(appLocation.search).get("deal_id")
      return dealId ? getDealDocumentContext(dealId) : null
    })
  const [createInitialTemplateCode, setCreateInitialTemplateCode] = useState<string | undefined>(undefined)
  const [createEntryState, setCreateEntryState] = useState<"history" | "first">(
    new URLSearchParams(appLocation.search).has("deal_id") ||
    new URLSearchParams(appLocation.search).get("state") === "first-use" ? "first" : "history"
  )
  const [createDeliveryMode, setCreateDeliveryMode] = useState(false)
  const [snapAccessRevision, setSnapAccessRevision] = useState(0)
  const snapAccess = useSnapRouteAccess(
    product === "snap" ? (snapRoute?.definition ?? null) : null,
    snapAccessRevision
  )

  useEffect(() => {
    const compactSidebar = window.matchMedia("(max-width: 1280px)")
    const syncSidebarWithViewport = () => {
      setSidebarOpen(!compactSidebar.matches)
    }

    syncSidebarWithViewport()
    compactSidebar.addEventListener("change", syncSidebarWithViewport)
    return () =>
      compactSidebar.removeEventListener("change", syncSidebarWithViewport)
  }, [])
  const snapRouteLoadingKey = snapRoute
    ? [
        snapRoute.definition.id,
        Object.entries(snapRoute.params)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, value]) => `${key}=${value}`)
          .join("&"),
        snapRoute.search.toString(),
      ].join(":")
    : ""
  const erpRouteLoadingKey = erpRoute
    ? `${erpRoute.screen}:${Object.values(erpRoute.params).join(":")}`
    : ""
  const currentScreenRef = useRef(screen)
  useEffect(() => { currentScreenRef.current = screen }, [screen])
  const screenLoadingKey = `${product}:${screen}:${erpHomeVariant}:${snapRouteLoadingKey}:${erpRouteLoadingKey}`
  const activeWorkspace =
    workspaceOptions.find((workspace) => workspace.id === workspaceId) ??
    workspaceOptions[0]
  const availableProducts = Object.keys(
    activeWorkspace.products
  ) as ProductKey[]
  const unreadNotificationCount = notifications.filter(
    (notification) =>
      notification.unread && !readNotificationIds.has(notification.id)
  ).length

  useEffect(() => {
    const loadingTimer = window.setTimeout(() => setScreenLoading(false), 420)
    return () => window.clearTimeout(loadingTimer)
  }, [screenLoadingKey])

  useEffect(() => {
    const handlePopState = () => {
      const nextRoute = readCurrentSnapRoute()
      setSnapRoute(nextRoute)
      if (nextRoute) {
        setErpRoute(null)
        setProduct("snap")
        setSnapScreen(nextRoute.definition.screen)
        setScreen(
          nextRoute.definition.screen === "SC-30" ? "settings" : "snap-platform"
        )
        setScreenLoading(true)
        return
      }

      const nextErpRoute = readCurrentErpRoute()
      setErpRoute(nextErpRoute)
      setProduct("erp")
      setErpHomeVariant(
        appLocation.pathname === "/v2-home" ? "v2" : "legacy"
      )
      const nextRole = new URLSearchParams(appLocation.search).get("role")
      setErpHomeRole(
        nextRole === "admin" || nextRole === "member" ? nextRole : "owner"
      )
      const nextScreen = nextErpRoute?.screen ?? "home"
      if (nextErpRoute?.params.dealId) {
        setSelectedDealId(nextErpRoute.params.dealId)
      }
      if (nextErpRoute?.params.documentNumber) {
        const documentNumber = nextErpRoute.params.documentNumber
        const generatedDocument = generatedDrafts.find(
          (document) => document.number === documentNumber
        )
        setResultDocumentNumber(documentNumber)
        setSelectedTemplateCode(documentNumber.split("-")[0] ?? "SC")
        setResultInitialWorkspaceStep(
          generatedDocument?.pdfState === "none" ? "source" : "editor"
        )
        setResultInitialPdfState(generatedDocument?.pdfState ?? "draft")
        setOpenDeliveryOnResult(false)
        setOpenConfirmedOnResult(
          Boolean(
            generatedDocument &&
            generatedDocument.tab !== "draft" &&
            generatedDocument.tab !== "progress"
          )
        )
        setOpenLinkCreatedOnResult(
          generatedDocument?.tab === "sharing" ||
            generatedDocument?.tab === "done"
        )
        setOpenSharedOnResult(generatedDocument?.tab === "done")
        setResultMemberCanDeliver(generatedDocument?.memberCanDeliver ?? true)
        setResultDealContext(
          generatedDocument?.dealId
            ? getDealDocumentContext(generatedDocument.dealId)
            : null
        )
      }
      setLastErpScreen(nextScreen)
      setScreen(nextScreen)
      setScreenLoading(
        nextScreen !== "inbox" || currentScreenRef.current !== "inbox"
      )
    }

    window.addEventListener("popstate", handlePopState)
    window.addEventListener("hashchange", handlePopState)
    return () => {
      window.removeEventListener("popstate", handlePopState)
      window.removeEventListener("hashchange", handlePopState)
    }
  }, [])

  const navigateSnap = (
    nextScreen: SnapScreenKey,
    options?: { replace?: boolean; params?: Record<string, string> }
  ) => {
    if (nextScreen === "SC-05" || nextScreen === "SC-06") {
      appLocation.assign(nextScreen === "SC-05" ? "/signup?product=snap" : "/login")
      return
    }
    const nextPath = pathForSnapScreen(nextScreen, options?.params)
    const currentPath = `${appLocation.pathname}${appLocation.search}`
    if (product === "snap" && currentPath === nextPath) return

    if (options?.replace) {
      window.history.replaceState({ product: "snap" }, "", nextPath)
    } else if (currentPath !== nextPath) {
      window.history.pushState({ product: "snap" }, "", nextPath)
    }
    const nextRoute = readCurrentSnapRoute()
    setSnapRoute(nextRoute)
    setProduct("snap")
    setSnapScreen(nextScreen)
    setScreen(nextScreen === "SC-30" ? "settings" : "snap-platform")
    setScreenLoading(true)
  }

  const handleLogout = () => {
    try {
      for (const storage of [window.localStorage, window.sessionStorage]) {
        for (const key of [
          "snap_web_session",
          "snap_access_token",
          "access_token",
          "id_token",
          "snap_return_to",
        ]) {
          storage.removeItem(key)
        }
      }
    } catch {
      // Storage may be unavailable in restricted browser contexts.
    }
    resetSnapSessionAccessCache()
    navigateSnap("SC-06")
  }

  useEffect(() => {
    const redirectPath = snapAccess.redirectPath
    if (!redirectPath || product !== "snap") return
    if (`${appLocation.pathname}${appLocation.search}` === redirectPath)
      return

    const nextRoute = matchSnapRoute(redirectPath)
    if (!nextRoute) return

    window.history.replaceState({ product: "snap" }, "", redirectPath)
    const stateTimer = window.setTimeout(() => {
      setSnapRoute(nextRoute)
      setSnapScreen(nextRoute.definition.screen)
      setScreen(
        nextRoute.definition.screen === "SC-30" ? "settings" : "snap-platform"
      )
      setScreenLoading(true)
    }, 0)
    return () => window.clearTimeout(stateTimer)
  }, [product, snapAccess.redirectPath])

  const updateErpLocation = (
    nextScreen: Exclude<Screen, "snap-platform">,
    params: ErpRouteMatch["params"] = {},
    replace = false,
    originDealId: string | null = uploadOriginDealId
  ) => {
    const nextPath = pathForErpScreen(nextScreen, params)
    const nextUrl = new URL(nextPath, appLocation.origin)
    if (erpHomeRole === "admin" || erpHomeRole === "member") {
      nextUrl.searchParams.set("role", erpHomeRole)
    }
    // The demo login's subscription state follows the session like `role`.
    const plan = new URLSearchParams(appLocation.search).get("plan")
    if (plan === "trial" || plan === "expired") nextUrl.searchParams.set("plan", plan)
    const snap = new URLSearchParams(appLocation.search).get("snap")
    if (snap === "none") nextUrl.searchParams.set("snap", snap)
    if (nextScreen === "inbox" && originDealId) nextUrl.searchParams.set("fromDeal", originDealId)
    if (nextScreen === "create" && params.dealId) nextUrl.searchParams.set("deal_id", params.dealId)
    const nextLocation = `${nextUrl.pathname}${nextUrl.search}`
    const currentLocation = `${appLocation.pathname}${appLocation.search}`
    if (nextLocation !== currentLocation) {
      window.history[replace ? "replaceState" : "pushState"](
        { product: "erp" },
        "",
        nextLocation
      )
    }
    setErpRoute(matchErpRoute(nextUrl.pathname))
  }

  const navigateTo = (
    nextScreen: Screen,
    options?: {
      question?: string
      submit?: boolean
      dealId?: string
      documentName?: string
      documentNumber?: string
      originDealId?: string
      replace?: boolean
    }
  ) => {
    if (nextScreen === "tokens" || nextScreen === "billing") {
      const section = nextScreen === "billing" ? "products" : "credits"
      appLocation.assign(`/erp/settings?section=${section}`)
      return
    }
    if (nextScreen === "deal" && options?.dealId) {
      setSelectedDealId(options.dealId)
    }
    setUploadOriginDealId(nextScreen === "inbox" ? options?.originDealId ?? null : null)
    if (nextScreen === "ask") {
      setPendingAskQuestion(options?.question ?? "")
      setPendingAskSubmit(Boolean(options?.submit && options?.question?.trim()))
    } else {
      setPendingAskQuestion("")
      setPendingAskSubmit(false)
    }
    if (nextScreen === "create") {
      setCreateDealContext(null)
      setCreateEntryState("history")
      setCreateInitialTemplateCode(undefined)
      setCreateDeliveryMode(false)
    }
    if (nextScreen === "snap-platform") {
      setProduct("snap")
    } else if (nextScreen !== "settings") {
      setProduct("erp")
      setLastErpScreen(nextScreen)
    }
    if (nextScreen !== "snap-platform") {
      setSnapRoute(null)
      updateErpLocation(
        nextScreen,
        {
          dealId: options?.dealId,
          documentName: options?.documentName,
          documentNumber: options?.documentNumber,
        },
        options?.replace,
        nextScreen === "inbox" ? options?.originDealId ?? null : null
      )
    }
    setScreenLoading(true)
    setScreen(nextScreen)
  }

  const switchProduct = (nextProduct: ProductKey) => {
    if (nextProduct === product) return
    if (!activeWorkspace.products[nextProduct]) return
    if (nextProduct === "snap") {
      ensureSnapWorkspaceSession()
      navigateSnap("SC-17")
      return
    }

    setSnapRoute(null)
    updateErpLocation(lastErpScreen, {
      dealId: lastErpScreen === "deal" ? selectedDealId : undefined,
      documentNumber:
        lastErpScreen === "result"
          ? (resultDocumentNumber ?? undefined)
          : undefined,
    })
    setProduct("erp")
    setScreenLoading(true)
    setScreen(lastErpScreen)
  }

  const switchWorkspace = (nextWorkspaceId: WorkspaceKey) => {
    const nextWorkspace = workspaceOptions.find(
      (workspace) => workspace.id === nextWorkspaceId
    )
    if (!nextWorkspace || nextWorkspace.id === workspaceId) return

    try { localStorage.setItem("ecoya.preview.workspace", nextWorkspace.id) } catch { /* Keep current session usable. */ }
    setWorkspaceId(nextWorkspace.id)
    if (nextWorkspace.products[product]) return

    const fallbackProduct: ProductKey = nextWorkspace.products.erp
      ? "erp"
      : "snap"
    if (fallbackProduct === "snap") {
      ensureSnapWorkspaceSession()
      navigateSnap("SC-17")
      return
    }

    setSnapRoute(null)
    updateErpLocation(lastErpScreen, {
      dealId: lastErpScreen === "deal" ? selectedDealId : undefined,
      documentNumber:
        lastErpScreen === "result"
          ? (resultDocumentNumber ?? undefined)
          : undefined,
    })
    setProduct("erp")
    setScreenLoading(true)
    setScreen(lastErpScreen)
  }

  const openDealDocumentCreate = (templateCode: string) => {
    navigateTo("create", { dealId: selectedDealId })
    setCreateDealContext(getDealDocumentContext(selectedDealId))
    setCreateInitialTemplateCode(templateCode)
    setCreateEntryState("first")
  }

  const duplicateConfirmedResult = async (direction: DocumentDirection | null) => {
    const sourceNumber = resultDocumentNumber ?? `${selectedTemplateCode}-2026-0708`
    const result = await prototypeBackend.generatedDocuments.duplicate({ id: sourceNumber })
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    const nextNumber = `${selectedTemplateCode}-2026-${String(Date.now()).slice(-6)}`
    setResultDocumentNumber(nextNumber)
    setResultDirection(direction)
    setResultInitialWorkspaceStep("source")
    setResultInitialPdfState("none")
    setOpenConfirmedOnResult(false)
    setOpenDeliveryOnResult(false)
    setOpenLinkCreatedOnResult(false)
    setOpenSharedOnResult(false)
    toast.success(`${nextNumber} 작성 중 문서를 열었습니다. 원본은 변경되지 않습니다.`)
    navigateTo("result", { documentNumber: nextNumber })
  }

  const openDealDocumentDelivery = (
    documentNumber?: string,
    attachmentNames: string[] = []
  ) => {
    const documents = getGeneratedDocumentsForDeal(selectedDealId)
    if (documents.length === 0) return

    const selectedDocument = documentNumber
      ? documents.find((document) => document.number === documentNumber)
      : documents.length === 1
        ? documents[0]
        : null

    if (selectedDocument) {
      setResultDeliveryAttachments(
        attachmentNames.map((name, index) => ({
          id: `deal-attachment-${index + 1}`,
          name,
          source: `거래 서류 · ${selectedDealId}`,
        }))
      )
      setSelectedTemplateCode(selectedDocument.number.split("-")[0])
      setResultDirection(null)
      setResultDocumentNumber(selectedDocument.number)
      setResultMemberCanDeliver(selectedDocument.memberCanDeliver)
      setResultDealConnectionRestricted(false)
      setResultInitialWorkspaceStep("editor")
      setResultInitialPdfState("final")
      setOpenDeliveryOnResult(true)
      setOpenConfirmedOnResult(true)
      setOpenLinkCreatedOnResult(
        selectedDocument.tab === "sharing" || selectedDocument.tab === "done"
      )
      setOpenSharedOnResult(selectedDocument.tab === "done")
      setResultDealContext(getDealDocumentContext(selectedDealId))
      navigateTo("result", { documentNumber: selectedDocument.number })
      return
    }

    setCreateDealContext(getDealDocumentContext(selectedDealId))
    setCreateEntryState("history")
    setCreateDeliveryMode(true)
    navigateTo("create")
  }

  const openDealDocumentReview = (documentNumber: string) => {
    const selectedDocument = getGeneratedDocumentsForDeal(selectedDealId).find((document) => document.number === documentNumber)
    if (!selectedDocument) return
    setResultDeliveryAttachments([])
    setSelectedTemplateCode(selectedDocument.number.split("-")[0])
    setResultDirection(null)
    setResultDocumentNumber(selectedDocument.number)
    setResultMemberCanDeliver(selectedDocument.memberCanDeliver)
    setResultDealConnectionRestricted(false)
    setResultInitialWorkspaceStep("editor")
    setResultInitialPdfState(selectedDocument.pdfState)
    setOpenDeliveryOnResult(false)
    setOpenConfirmedOnResult(false)
    setOpenLinkCreatedOnResult(false)
    setOpenSharedOnResult(false)
    setResultDealContext(getDealDocumentContext(selectedDealId))
    navigateTo("result", { documentNumber })
  }

  const standaloneSnap =
    product === "snap" &&
    snapRoute !== null &&
    (snapRoute.definition.shell === "public" ||
      snapRoute.definition.shell === "external")

  if (
    product === "snap" &&
    snapRoute !== null &&
    snapAccess.status !== "allowed"
  ) {
    return (
      <SnapRouteAccessScreen
        result={snapAccess}
        onLogin={() => {
          try {
            window.sessionStorage.setItem(
              "snap_return_to",
              `${appLocation.pathname}${appLocation.search}`
            )
          } catch {
            // Session storage is an enhancement; authentication still works without it.
          }
          navigateSnap("SC-06")
        }}
        onHome={() => navigateSnap("SC-17")}
        onRetry={() => {
          resetSnapSessionAccessCache()
          setSnapAccessRevision((revision) => revision + 1)
        }}
      />
    )
  }

  if (standaloneSnap) {
    return (
      <SnapProductPrototype
        screen={snapScreen}
        onScreenChange={navigateSnap}
        routeParams={snapRoute?.params}
        routeSearch={snapRoute?.search}
        showNavigator={false}
        className="min-h-svh bg-transparent"
      />
    )
  }

  const isThreePaneScreen =
    screen === "inbox" || screen === "create" || screen === "result"
  const isFullWidthScreen =
    isThreePaneScreen || screen === "deal" || screen === "ask"

  return (
    <SettingsDemoProvider key={workspaceId} persist>
    <StartGuideProvider key={workspaceId} scope={`preview-account:${workspaceId}`} role={erpHomeRole}>
    <ViewSeatProvider role={erpHomeRole}>
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
      className="h-svh min-h-0 flex-col overflow-hidden bg-transparent text-foreground"
      style={
        {
          "--header-height": "var(--ui-shell-header-height)",
          "--sidebar-width": "240px",
          "--sidebar-width-icon": "64px",
        } as CSSProperties
      }
    >
      <WorkspaceHeader
        screen={screen}
        documentConfirmed={openConfirmedOnResult}
        templateCode={selectedTemplateCode}
        onNavigate={navigateTo}
        unreadNotificationCount={unreadNotificationCount}
        onOpenNotifications={() => navigateTo("notifications")}
        product={product}
        snapScreen={snapScreen}
        onSnapScreenChange={navigateSnap}
        documentApprovalPreviewState={documentApprovalPreviewState}
        onDocumentApprovalPreviewStateChange={setDocumentApprovalPreviewState}
        showDocumentApprovalPreviewSwitch={screen === "result"}
        isV2Workspace={erpHomeVariant === "v2"}
        dealActionsRef={
          screen === "deal" ? setDealHeaderActionsTarget : undefined
        }
      />
      <div
        className={cn(
          "flex min-h-0 flex-1",
          screen === "settings" && "relative md:-mt-(--header-height) md:h-svh"
        )}
      >
        {screen === "settings" ? (
          <SettingsPrototype
            availableProducts={availableProducts}
            role={erpHomeRole}
            subscriptionStates={erpPreviewSubscriptionStates()}
            onLogout={handleLogout}
            workspaceId={workspaceId}
            onWorkspaceChange={switchWorkspace}
            onNavigate={(target) => {
              if (target === "home" && product === "snap") {
                navigateSnap("SC-17")
                return
              }
              navigateTo(target)
            }}
          />
        ) : (
          <>
            <AppNav
              screen={screen}
              setScreen={navigateTo}
              product={product}
              onProductChange={switchProduct}
              unreadNotificationCount={unreadNotificationCount}
              onOpenNotifications={() => navigateTo("notifications")}
              workspaceId={workspaceId}
              onWorkspaceChange={switchWorkspace}
              availableProducts={availableProducts}
              snapScreen={snapScreen}
              onSnapScreenChange={navigateSnap}
              onLogout={handleLogout}
              snapRole={snapAccess.role}
              isV2Workspace={erpHomeVariant === "v2"}
              erpRole={erpHomeRole}
            />
            <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
              <main
                className={cn(
                  "min-h-0 flex-1 overflow-y-auto overscroll-contain",
                  screen === "shipments" && "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                )}
                aria-busy={screenLoading}
              >
                <PageFrame
                  width={
                    product === "erp" || isFullWidthScreen ? "full" : "wide-xl"
                  }
                  scroll="page"
                  className="h-full"
                >
                  <PageLoadingBoundary loading={screenLoading} pageKey={screenLoadingKey}>
                  {screen === "onboarding" ? (
                    <OnboardingPrototype onNavigate={navigateTo} role={erpHomeRole} />
                  ) : screen === "home" ? (
                    <V2HomePrototype
                      onNavigate={navigateTo}
                      role={erpHomeRole}
                      previewState={homePreviewState}
                      marketAccess={homeEntitlements.market}
                      insightAccess={homeEntitlements.insight}
                    />
                  ) : screen === "inbox" ? (
                    <InboxScreen
                      role={erpHomeRole}
                      originDealId={uploadOriginDealId}
                      initialDocumentName={erpRoute?.params.documentName}
                      initialStep={
                        erpRoute?.params.uploadStep === "connect"
                          ? "deal"
                          : "compare"
                      }
                      linkedDealsByDocument={uploadDocumentDealLinks}
                      onDocumentDealLinked={(documentName, link) => {
                        setUploadDocumentDealLinks((current) => {
                          const next = { ...current }
                          if (link) next[documentName] = link
                          else delete next[documentName]
                          writeUploadDocumentDealLinks(next)
                          return next
                        })
                      }}
                      onDocumentOpen={(documentName, detailStep = "compare") => {
                        const context = dealDocumentFromReviewUrl()
                        if (context && context.file === documentName) return
                        updateErpLocation(
                          "inbox",
                          documentName
                            ? {
                                documentName,
                                uploadStep:
                                  detailStep === "deal" ? "connect" : "review",
                              }
                            : {}
                        )
                      }}
                      onOpenDeal={(dealId, focus) => {
                        setDealNotificationTarget(null)
                        if (focus === "finance") setDealNotificationTarget({ tab: "finance", sectionId: "deal-finance" })
                        setSelectedDealId(dealId)
                        navigateTo("deal", { dealId })
                      }}
                    />
                  ) : screen === "create" ? (
                    <CreateScreen
                      initialEntryState={createEntryState}
                      initialTemplateCode={createInitialTemplateCode}
                      relatedDeal={createDealContext}
                      role={erpHomeRole}
                      onResult={(_mode, templateCode, options) => {
                        const documentNumber =
                          options?.documentNumber ??
                          `${templateCode || "SC"}-2026-0708`
                        const destination =
                          options?.destination ??
                          (createDeliveryMode ? "share" : "editor")
                        setOpenDeliveryOnResult(
                          options?.openSharePanel === true ||
                            destination === "share"
                        )
                        setOpenConfirmedOnResult(destination !== "editor")
                        setOpenLinkCreatedOnResult(
                          destination === "link-created" ||
                            destination === "shared"
                        )
                        setOpenSharedOnResult(destination === "shared")
                        setResultMemberCanDeliver(
                          options?.memberCanDeliver ?? true
                        )
                        const dealConnectionRestricted = Boolean(
                          options?.dealId &&
                          erpHomeRole === "member" &&
                          options.memberCanAccessDeal === false
                        )
                        setResultDealConnectionRestricted(
                          dealConnectionRestricted
                        )
                        setResultDocumentNumber(documentNumber)
                        setResultDeliveryAttachments([])
                        setResultDealContext(
                          options?.dealId
                            ? dealConnectionRestricted
                              ? null
                              : getDealDocumentContext(options.dealId)
                            : createDealContext
                        )
                        setSelectedTemplateCode(
                          templateCode && templateSchemas[templateCode]
                            ? templateCode
                            : "SC"
                        )
                        setResultInitialWorkspaceStep(
                          options?.workspaceStep ??
                            (options?.pdfState === "none"
                              ? "source"
                              : "editor")
                        )
                        setResultInitialPdfState(options?.pdfState ?? "draft")
                        navigateTo("result", { documentNumber })
                      }}
                    />
                  ) : screen === "ask" ? (
                    <AskPrototype
                      onNavigate={navigateTo}
                      role={erpHomeRole}
                      initialQuestion={pendingAskQuestion}
                      submitOnOpen={pendingAskSubmit}
                    />
                  ) : screen === "deals" ? (
                    <DealsScreen
                      role={erpHomeRole}
                      onOpenContacts={() => navigateTo("contacts")}
                      onOpenDeal={(dealId, tab) => {
                        setDealNotificationTarget(tab ? { tab: tab === "documents" ? "overview" : tab, sectionId: tab === "documents" ? "deal-documents" : tab === "fulfillment" ? "deal-fulfillment" : tab === "customs" ? "deal-customs" : "deal-finance" } : null)
                        setSelectedDealId(dealId)
                        navigateTo("deal", { dealId })
                      }}
                    />
                  ) : screen === "deal" ? (
                    <DealDetailScreen
                      key={selectedDealId}
                      dealId={selectedDealId}
                      role={erpHomeRole}
                      focusTarget={dealNotificationTarget}
                      onBack={() => navigateTo("deals")}
                      onAskAi={() => navigateTo("ask", { question: `거래 ${selectedDealId}: `, submit: false })}
                      generatedDocuments={getGeneratedDealDocumentSummaries(
                        selectedDealId
                      )}
                      documentTemplates={templates}
                      onCreateDocument={openDealDocumentCreate}
                      onUpload={() => navigateTo("inbox", { originDealId: selectedDealId })}
                      onDeliver={openDealDocumentDelivery}
                      onReviewDocument={openDealDocumentReview}
                      onOpenSettlement={() => navigateTo("settlement")}
                      workspaceActionsTarget={dealHeaderActionsTarget}
                    />
                  ) : screen === "shipments" ? (
                    <OperationsScreen screen="shipments" />
                  ) : screen === "settlement" ? (
                    <OperationsScreen screen="settlement" />
                  ) : screen === "monitoring" ? (
                    <OperationsScreen screen="monitor" />
                  ) : screen === "reports" ? (
                    <OperationsScreen screen="reports" />
                  ) : screen === "sales" ? (
                    <OperationsScreen screen="sales" />
                  ) : screen === "contacts" ? (
                    // SSOT SC-27: its own screen with its own contact search;
                    // it does not inherit the deals list filters.
                    <div data-slot="business-page" className="h-full overflow-y-auto bg-transparent">
                      <div className="w-full p-4 sm:p-5">
                        <div className="rounded-[var(--r-lg)] bg-[var(--color-gray-12)] p-5 shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)]">
                          <SalesPrototype
                            embedded
                            onOpenDeal={(dealId) => {
                              setSelectedDealId(dealId)
                              navigateTo("deal", { dealId })
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : screen === "notifications" ? (
                    <NotificationsPrototype
                      readIds={readNotificationIds}
                      onMarkRead={(notificationId) =>
                        setReadNotificationIds((current) =>
                          new Set(current).add(notificationId)
                        )
                      }
                      onMarkAllRead={() =>
                        setReadNotificationIds(
                          new Set(
                            notifications
                              .filter((notification) => notification.unread)
                              .map((notification) => notification.id)
                          )
                        )
                      }
                      onOpenDeal={(notification) => {
                        setReadNotificationIds((current) =>
                          new Set(current).add(notification.id)
                        )
                        setSelectedDealId(notification.dealId)
                        setDealNotificationTarget(notification.target)
                        navigateTo("deal", { dealId: notification.dealId })
                      }}
                    />
                  ) : screen === "counterparty" ? (
                    <CounterpartyPrototype onNavigate={navigateTo} counterpartyId={erpRoute?.params.counterpartyId} role={erpHomeRole} />
                  ) : screen === "snap" ? (
                    <SnapEvidencePrototype onNavigate={navigateTo} />
                  ) : screen === "billing" ? (
                    <BillingPrototype onNavigate={navigateTo} />
                  ) : screen === "tokens" ? (
                    <TokenUsagePrototype onNavigate={navigateTo} />
                  ) : screen === "snap-platform" && snapScreen === "SC-10" ? (
                    <SnapStartGuidePage scope={`preview-account:${workspaceId}`} role={snapAccess.role} />
                  ) : screen === "snap-platform" ? (
                    <SnapProductPrototype
                      screen={snapScreen}
                      onScreenChange={navigateSnap}
                      routeParams={snapRoute?.params}
                      routeSearch={snapRoute?.search}
                      showNavigator={false}
                      className="min-h-full bg-transparent"
                    />
                  ) : (
                    <ResultScreen
                      key={`result:${documentApprovalPreviewState}:${resultDocumentNumber ?? "new"}`}
                      initialTemplateCode={selectedTemplateCode}
                      initialDirection={resultDirection}
                      initialDocumentNumber={resultDocumentNumber}
                      approvalPreviewState={documentApprovalPreviewState === "live" ? generatedDrafts.find((draft) => draft.number === resultDocumentNumber)?.approvalPreviewState ?? "live" : documentApprovalPreviewState}
                      initialDocumentConfirmed={openConfirmedOnResult}
                      onDocumentConfirmed={() => setOpenConfirmedOnResult(true)}
                      initialSharePanelOpen={openDeliveryOnResult}
                      initialLinkCreated={openLinkCreatedOnResult}
                      initialShareCompleted={openSharedOnResult}
                      initialDeliveryAttachments={resultDeliveryAttachments}
                      relatedDeal={resultDealContext}
                      initialWorkspaceStep={resultInitialWorkspaceStep}
                      initialPdfState={resultInitialPdfState}
                      role={erpHomeRole}
                      memberCanDeliver={resultMemberCanDeliver}
                      dealConnectionRestricted={resultDealConnectionRestricted}
                      onDuplicateConfirmed={(direction) => { void duplicateConfirmedResult(direction) }}
                    />
                  )}
                  </PageLoadingBoundary>
                </PageFrame>
              </main>
            </SidebarInset>
          </>
        )}
      </div>
    </SidebarProvider>
    </ViewSeatProvider>
    </StartGuideProvider>
    </SettingsDemoProvider>
  )
}

export default App

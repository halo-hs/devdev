import { BusinessListToolbar, BusinessFilterSearch, BusinessFilterField } from "@shared/components/business-filters"
import { FormField, FormFieldHeader } from "@shared/components/form-field"
import { PageLoadingBoundary } from "@shared/components/page-loading-boundary"
import { DeliveryAttachmentPicker, DeliveryAttachmentPreview, type DeliveryAttachment } from "@trade-os/delivery-attachment-picker"
import { focusDocumentRequirement } from "@trade-os/lib/document-requirement-navigation"
import { currentBankSchedules, eligibleBankSchedules, bankCashValidation, readDocumentReview, type ReviewedField, type BankCashInput } from "@trade-os/lib/erp-document-workflow"
import { exactDocumentMoneyTotals, exactLineItemAmount } from "@trade-os/lib/document-money"
import { normalizeDecimalInput, formatScaledDecimal } from "@trade-os/lib/money"
import { decimalMagnitude, FINANCE_DECIMAL_SCALE } from "@trade-os/lib/financeDecimal"
import { Badge } from "@shared/components/ui/badge"
import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type DragEvent as ReactDragEvent,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import {
  AlertTriangle,
  Bell,
  Bot,
  Building2,
  Calculator,
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  FileCheck2,
  FileClock,
  FilePlus2,
  FileX2,
  Mail,
  Home,
  Maximize2,
  Monitor,
  MoreVertical,
  Plus,
  RefreshCw,
  Send,
  Settings2,
  Ship,
  Sparkles,
  FileText,
  History,
  LayoutDashboard,
  Link2,
  LoaderCircle,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  Wand2,
  Workflow,
  X,
} from "lucide-react"

import { Button } from "@shared/components/ui/button"
import { DocumentBlockingAlerts, type DocumentBlockingIssue } from "@trade-os/components/document-blocking-alerts"
import { AutoSaveStatus } from "@shared/components/auto-save-status"
import { BusinessPageHero } from "@shared/components/business-page-hero"
import { DocumentTemplateOptions } from "@trade-os/components/document-template-options"
import { Checkbox } from "@shared/components/ui/checkbox"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@shared/components/ui/combobox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu"
import { Input } from "@shared/components/ui/input"
import { Progress } from "@shared/components/ui/progress"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@shared/components/ui/popover"
import { ResizablePanel, ResizablePanelGroup } from "@shared/components/ui/resizable"
import { ScrollArea } from "@shared/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select"
import { Separator } from "@shared/components/ui/separator"
import { Skeleton } from "@shared/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"
import { TablePagination } from "@shared/components/ui/table-pagination"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/components/ui/alert-dialog"
import { PageFrame } from "@ecoya/ui"
import ecoyaWhiteLogoSrc from "@ecoya/design-system/assets/logos/logo-ecoya-white.png"
import { SidebarProfileMenu } from "@shared/components/sidebar-profile-menu"
import { WorkspaceSwitcher } from "@shared/components/workspace-switcher"
import { workspaceOptions, type WorkspaceKey } from "@shared/lib/workspaces"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shared/components/ui/sheet"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@shared/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs"
import { Textarea } from "@shared/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@shared/components/ui/tooltip"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@ecoya/design-system/ui/alert"
import { Card, CardContent, CardHeader } from "@ecoya/design-system/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@ecoya/design-system/ui/field"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@ecoya/design-system/ui/item"
import {
  FileDropZone,
  type FileDropZoneRef,
} from "@ecoya/design-system/extensions/file-drop-zone"
import { LabeledProgress } from "@ecoya/design-system/extensions/labeled-progress"
import { AsyncButton } from "@ecoya/design-system/extensions/async-button"
import { DatePicker } from "@ecoya/design-system/extensions/date-picker"
import {
  PdfFloatingControls,
  PdfViewerToolbar,
} from "@shared/components/pdf-floating-controls"
import {
  PdfPanelResizeHandle,
  PdfPanelWorkspaceCard,
} from "@shared/components/pdf-panel-resize-handle"
import { PannablePdfViewport } from "@shared/components/pannable-pdf-viewport"
import {
  DealDetailScreen,
  DealsScreen,
  type GeneratedDealDocumentSummary,
} from "@trade-os/deals-prototype"
import {
  HomePrototype as V2HomePrototype,
  type HomePreviewState,
} from "@trade-os/home-prototype"
import { ReferenceOperations } from "@trade-os/operations/index"
import { NotificationsPrototype } from "@trade-os/notifications-prototype"
import { notifications, type NotificationDealTarget } from "@trade-os/lib/notifications"
import {
  AskPrototype,
  BillingPrototype,
  CounterpartyPrototype,
  OnboardingPrototype,
  SettingsPrototype,
  SnapEvidencePrototype,
  TokenUsagePrototype,
  type ErpMenuTarget,
} from "@trade-os/erp-menu-prototypes"
import {
  SnapProductPrototype,
  type SnapScreenKey,
} from "@snap/snap-prototypes"
import { SnapRouteAccessScreen } from "@snap/snap-route-access"
import {
  resetSnapSessionAccessCache,
  useSnapRouteAccess,
} from "@snap/lib/snap-route-access"
import {
  canAccessSnapRoute,
  getSnapRouteByScreen,
  matchSnapRoute,
  normalizeSnapLocation,
  pathForSnapScreen,
  type SnapRole,
  type SnapRouteMatch,
} from "@snap/lib/snap-routes"
import {
  canonicalErpLocation,
  matchErpRoute,
  pathForErpScreen,
  type ErpRouteMatch,
  type ErpRouteScreen,
} from "@trade-os/lib/erp-routes"
import { cn } from "@shared/lib/utils"
import { useIsCompactWorkspace, useIsMobile } from "@shared/hooks/use-mobile"
import { prototypeBackend } from "@trade-os/lib/prototype-backend"
import { toast } from "sonner"

function createSamplePdf(filename: string) {
  const printableFilename = filename
    .replace(/[()\\]/g, "")
    .replace(/[^\x20-\x7e]/g, "_")
  const stream = [
    "BT",
    "/F1 20 Tf",
    "72 720 Td",
    "(ECOYA Trade OS Sample Document) Tj",
    "0 -32 Td",
    "/F1 12 Tf",
    "(Generated from the document processing prototype.) Tj",
    "0 -24 Td",
    `(File: ${printableFilename}) Tj`,
    "ET",
  ].join("\n")
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ]
  let pdf = "%PDF-1.4\n"
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return new Blob([pdf], { type: "application/pdf" })
}

function downloadSamplePdf(filename: string) {
  const url = URL.createObjectURL(createSamplePdf(filename))
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename.toLowerCase().endsWith(".pdf")
    ? filename
    : `${filename}.pdf`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function downloadRenderedDocumentPdf(
  filename: string,
  root?: HTMLElement | null
) {
  const paper =
    root?.querySelector<HTMLElement>("[data-document-paper]") ??
    document.querySelector<HTMLElement>("[data-document-paper]")
  if (!paper) {
    downloadSamplePdf(filename)
    return
  }

  const [{ toPng }, { jsPDF }] = await Promise.all([
    import("html-to-image"),
    import("jspdf"),
  ])
  const exportWidth = 720
  const exportHeight = 1000
  const exportPaper = paper.cloneNode(true) as HTMLElement
  Object.assign(exportPaper.style, {
    aspectRatio: "auto",
    boxSizing: "border-box",
    height: `${exportHeight}px`,
    left: "0",
    margin: "0",
    maxWidth: `${exportWidth}px`,
    position: "fixed",
    top: "0",
    transform: "none",
    width: `${exportWidth}px`,
    zIndex: "-1000",
  })
  document.body.appendChild(exportPaper)
  let imageUrl: string
  try {
    imageUrl = await toPng(exportPaper, {
      backgroundColor: "#ffffff",
      cacheBust: true,
      height: exportHeight,
      pixelRatio: 2,
      width: exportWidth,
    })
  } finally {
    exportPaper.remove()
  }
  const image = new Image()
  image.src = imageUrl
  await image.decode()
  const pdf = new jsPDF({
    compress: true,
    format: "a4",
    orientation: "portrait",
    unit: "mm",
  })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10
  const scale = Math.min(
    (pageWidth - margin * 2) / image.naturalWidth,
    (pageHeight - margin * 2) / image.naturalHeight
  )
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale
  pdf.addImage(
    imageUrl,
    "PNG",
    (pageWidth - width) / 2,
    (pageHeight - height) / 2,
    width,
    height,
    undefined,
    "FAST"
  )
  pdf.save(
    filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`
  )
}

type Screen = ErpMenuTarget | "result" | "snap-platform"
type ProductKey = "erp" | "snap"
type ErpPreviewRole = "owner" | "admin" | "member"
type Tone = "warning" | "blue" | "success" | "neutral" | "danger"
type DocumentStageKey =
  "field" | "ocr" | "confirmed" | "queued" | "excluded" | "failed" | "duplicate"
type UploadDocumentType =
  | "UNK"
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
type CreateDetailStep = "setup" | "editor" | "share"
type DocumentCreateWorkspaceStep = "source" | "fields" | "editor"
type CreateStartMode = "generated" | "template"
type GeneratedDocumentDestination =
  "editor" | "confirmed" | "share" | "link-created" | "shared"
type GeneratedDocumentOpenOptions = {
  destination: GeneratedDocumentDestination
  dealId: string
  openSharePanel?: boolean
  memberCanDeliver?: boolean
  memberCanAccessDeal?: boolean
  documentNumber?: string
}
type UploadDetailStep = "compare" | "deal"
type RecentDocument = {
  name: string
  uploadedAt: string
  pages?: number
  dealLabel?: string
  status: string
  tone: Tone
  stage: DocumentStageKey
  documentType: UploadDocumentType
  pdfReviewCompleted?: boolean
  reviewedFields?: Record<string, ReviewedField>
  contentHash?: string
  retryCount?: number
}
type UploadDocumentDealLink = {
  dealId: string
  dealLabel: string
}
type UploadDocumentDealLinks = Record<string, UploadDocumentDealLink>

const UPLOAD_DOCUMENT_DEAL_LINKS_STORAGE_KEY =
  "ecoya-prototype-upload-document-deal-links"

const UPLOAD_QUEUE_STORAGE_KEY = "ecoya-prototype-upload-queue-v2"
const UPLOAD_STATUS_SEEDS_KEY = "ecoya-upload-status-seeds-20260918"
function readUploadQueue(): RecentDocument[] {
  try {
    const saved = JSON.parse(localStorage.getItem(UPLOAD_QUEUE_STORAGE_KEY) ?? "null")
    if (Array.isArray(saved) && saved.every((item) => item && typeof item.name === "string" && typeof item.documentType === "string" && typeof item.stage === "string")) {
      const documents: RecentDocument[] = saved.map((document: RecentDocument) => document.contentHash && ["queued", "ocr"].includes(document.stage)
        ? { ...document, stage: "failed", status: "처리 중단 · 다시 추출", tone: "danger" } : document)
      if (!localStorage.getItem(UPLOAD_STATUS_SEEDS_KEY)) {
        for (const seed of recentDocuments.filter((document) => document.name.endsWith("_0918.pdf"))) {
          if (!documents.some((document) => document.name === seed.name)) documents.push(seed)
        }
      }
      return documents
    }
  } catch { /* Use the preview fixtures before the first upload. */ }
  return recentDocuments
}

function readUploadDocumentDealLinks(): UploadDocumentDealLinks {
  if (typeof window === "undefined") return {}
  try {
    const stored = window.localStorage.getItem(
      UPLOAD_DOCUMENT_DEAL_LINKS_STORAGE_KEY
    )
    return stored ? (JSON.parse(stored) as UploadDocumentDealLinks) : {}
  } catch {
    return {}
  }
}

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
type PrototypeSlotKind = "text" | "number" | "money" | "date"
type PrototypeSlot = {
  key: string
  label: string
  kind: PrototypeSlotKind
  required?: boolean
  section:
    | "seller"
    | "buyer"
    | "document"
    | "goods"
    | "terms"
    | "totals"
    | "bank"
    | "remarks"
    | "line"
}
type PrototypeTemplateSchema = {
  slots: PrototypeSlot[]
  lineItems?: PrototypeSlot[]
}
type DocumentElementStatus = {
  logo: boolean
  itemCount: number
  copy: boolean
  approval: "idle" | "requested" | "approved" | "rejected"
}
type DocumentApprovalChoice = "none" | "request"
type DocumentApprovalPreviewState =
  | "live"
  | "requester-pending"
  | "requester-approved"
  | "requester-rejected"
  | "owner-pending"
  | "admin-pending"
type DocumentApprovalEvent = {
  id: number
  type: "request" | "approve" | "reject"
  actor: string
  actorRole: "작성자" | "Owner" | "Admin"
  occurredAt: string
  reason?: string
}
type DocumentApprover = {
  id: string
  name: string
  role: "Owner" | "Admin"
}
const documentApproverOptions: readonly DocumentApprover[] = [
  { id: "park-seoyoon", name: "박서윤", role: "Owner" },
  { id: "kim-dohyun", name: "김도현", role: "Admin" },
  { id: "kim-minji", name: "김민지", role: "Admin" },
]
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
type DocumentLogo = {
  source: "organization" | "file"
  name: string
  dataUrl?: string
}
type DocumentStyle = {
  fontStyle: "sans" | "serif"
  accent: string
  logo: DocumentLogo | null
}
// 실제 연동 시 기업 기본정보의 로고 값으로 교체합니다.
// 등록된 로고가 없으면 문서 만들기에서는 새 로고 입력 UI를 기본으로 엽니다.
const organizationDefaultDocumentLogo: DocumentLogo | null = null
type DocumentSaveState = "saved" | "unsaved" | "saving" | "error"
type ReviewFocusTarget = {
  key: string
  label: string
}
type ReviewFocusRequest = {
  targets: ReviewFocusTarget[]
  token: number
}
type DeliveryLink = {
  id: number
  recipient: string
  status: "active" | "revoked" | "expired" | "maxed"
  expires: string
  opens: number
  maxOpens: number
}
type EmailRecord = {
  id: number
  recipient: string
  subject: string
  sentAt: string
  linkCount: number
}
type UploadProgressState = {
  completed: number
  total: number
}
type DuplicateUploadNotice = {
  fileName: string
  dealLabel?: string
  kind?: "filename" | "content"
}
const TRADE_DOCUMENT_MAX_UPLOAD_FILES = 5
const TRADE_DOCUMENT_MAX_UPLOAD_MB = 50
const TRADE_DOCUMENT_MAX_UPLOAD_BYTES =
  TRADE_DOCUMENT_MAX_UPLOAD_MB * 1024 * 1024

const erpNavGroups = [
  {
    label: "",
    items: [
      ["처음 시작하기", Wand2, "onboarding"],
      ["오늘 할 일", Home, "home"],
      ["문서 올리기", Upload, "inbox"],
      ["문서 만들기", Sparkles, "create"],
      ["AI에게 묻기", Bot, "ask"],
    ],
  },
  {
    label: "기록",
    items: [
      ["거래", Building2, "deals"],
      ["선적", Ship, "shipments"],
      ["정산", Calculator, "settlement"],
    ],
  },
  {
    label: "경영·성과",
    items: [
      ["운영 감시", Monitor, "monitoring"],
      ["결산 리포트", ClipboardList, "reports", "Pro"],
      ["영업 성과", History, "sales", "Pro"],
    ],
  },
] as const

const snapNavGroups = [
  {
    label: "",
    items: [["처음 시작하기", Wand2, "SC-10"]],
  },
  {
    label: "현장 업무",
    items: [
      ["대시보드", LayoutDashboard, "SC-17"],
      ["업무", ClipboardList, "SC-18"],
      ["보고서", FileText, "SC-22"],
    ],
  },
  {
    label: "증거·고객",
    items: [
      ["증빙 보관함", Camera, "SC-23"],
      ["고객", Users, "SC-24"],
    ],
  },
  {
    label: "연결·운영",
    items: [
      ["캘린더", CalendarDays, "SC-25"],
      ["워크플로우", Workflow, "SC-26"],
      ["내보내기·연동", Building2, "SC-27"],
      ["작업자 · 작업 매니저", Users, "SC-28"],
      ["시정조치", ShieldCheck, "SC-29"],
    ],
  },
] as const

const ECOYA_SYMBOL_SRC = "/assets/logos/ecoya-favicon.svg"
const ECOYA_SNAP_LOGO_SRC = "/assets/logos/logo-ecoya-snap-color.png"

const snapScreenLabels = Object.fromEntries(
  snapNavGroups.flatMap((group) =>
    group.items.map(([label, , key]) => [key, label])
  )
) as Partial<Record<SnapScreenKey, string>>

const templates = [
  ["QT", "견적서", "고객, 견적일, 유효기간, 인코텀즈, 납기", "QT-STD-1"],
  ["PI", "견적송장", "판매자, 구매자, 품목, 금액, 결제조건", "PI-STD-1"],
  [
    "SC",
    "판매계약서",
    "판매자, 구매자, 계약번호, 선적기간, 결제조건",
    "SC-STD-1",
  ],
  ["PO", "발주서", "공급사, 발주처, 납기 요청일, 품목, 금액", "PO-STD-1"],
  ["CI", "상업송장", "송장번호, 품목, 운임, 보험료, 선박, ETA", "CI-STD-1"],
  [
    "PL",
    "포장명세서",
    "품명, 수량, 포장 수, 중량, 컨테이너, 씰 번호",
    "PL-STD-1",
  ],
  ["SI", "선적지시서", "송하인, 수하인, 부킹번호, 선적항, 도착항", "SI-STD-1"],
  ["BC", "수익자증명서", "수익자, 개설의뢰인, L/C 번호, 증명 문구", "BC-STD-1"],
  ["DLV", "납품서", "납품처, 납품일, 품목, 배송지, 차량번호", "DLV-STD-1"],
  [
    "CO",
    "원산지증명서",
    "수출자, 수입자, 원산지, 운송수단, 신고 문구",
    "CO-STD-1",
  ],
  [
    "SOA",
    "거래명세서",
    "거래처, 기간, 청구 합계, 수금 합계, 잔액",
    "SOA-STD-1",
  ],
  ["DN", "차변표", "관련 인보이스, 조정 금액, 통화, 사유", "DN-STD-1"],
  ["CN", "대변표", "관련 인보이스, 감액 금액, 통화, 사유", "CN-STD-1"],
] as const

const commonLineItemSlots: PrototypeSlot[] = [
  {
    key: "description",
    label: "품목명",
    kind: "text",
    required: true,
    section: "line",
  },
  { key: "hs_code", label: "HS Code", kind: "text", section: "line" },
  {
    key: "quantity",
    label: "수량",
    kind: "number",
    required: true,
    section: "line",
  },
  { key: "unit", label: "단위", kind: "text", section: "line" },
  {
    key: "unit_price",
    label: "단가",
    kind: "money",
    required: true,
    section: "line",
  },
]

const templateSchemas: Record<string, PrototypeTemplateSchema> = {
  QT: {
    slots: [
      {
        key: "customer_name",
        label: "고객",
        kind: "text",
        required: true,
        section: "buyer",
      },
      {
        key: "quotation_date",
        label: "견적일",
        kind: "date",
        required: true,
        section: "document",
      },
      {
        key: "valid_until",
        label: "유효기간",
        kind: "date",
        required: true,
        section: "document",
      },
      { key: "incoterms", label: "인코텀즈", kind: "text", section: "terms" },
      { key: "delivery_terms", label: "납기", kind: "text", section: "terms" },
      {
        key: "currency",
        label: "통화",
        kind: "text",
        required: true,
        section: "totals",
      },
    ],
    lineItems: commonLineItemSlots,
  },
  PI: {
    slots: [
      {
        key: "seller_name",
        label: "판매자",
        kind: "text",
        required: true,
        section: "seller",
      },
      {
        key: "buyer_name",
        label: "구매자",
        kind: "text",
        required: true,
        section: "buyer",
      },
      {
        key: "doc_number",
        label: "견적송장번호",
        kind: "text",
        required: true,
        section: "document",
      },
      {
        key: "doc_date",
        label: "발행일",
        kind: "date",
        required: true,
        section: "document",
      },
      {
        key: "payment_terms",
        label: "결제조건",
        kind: "text",
        section: "terms",
      },
      {
        key: "currency",
        label: "통화",
        kind: "text",
        required: true,
        section: "totals",
      },
    ],
    lineItems: commonLineItemSlots,
  },
  SC: {
    slots: [
      {
        key: "seller_name",
        label: "매도인",
        kind: "text",
        required: true,
        section: "seller",
      },
      {
        key: "buyer_name",
        label: "매수인",
        kind: "text",
        required: true,
        section: "buyer",
      },
      {
        key: "contract_number",
        label: "계약번호",
        kind: "text",
        required: true,
        section: "document",
      },
      {
        key: "contract_date",
        label: "계약일",
        kind: "date",
        required: true,
        section: "document",
      },
      {
        key: "currency",
        label: "통화",
        kind: "text",
        required: true,
        section: "totals",
      },
      { key: "incoterms", label: "인코텀즈", kind: "text", section: "terms" },
      {
        key: "payment_terms",
        label: "지급조건",
        kind: "text",
        section: "terms",
      },
      {
        key: "latest_shipment_date",
        label: "선적기한",
        kind: "date",
        section: "terms",
      },
      { key: "bank_name", label: "은행", kind: "text", section: "bank" },
      { key: "bank_account", label: "계좌번호", kind: "text", section: "bank" },
    ],
    lineItems: commonLineItemSlots,
  },
  PO: {
    slots: [
      {
        key: "supplier_name",
        label: "공급사",
        kind: "text",
        required: true,
        section: "seller",
      },
      {
        key: "buyer_name",
        label: "발주처",
        kind: "text",
        required: true,
        section: "buyer",
      },
      {
        key: "po_number",
        label: "발주번호",
        kind: "text",
        required: true,
        section: "document",
      },
      {
        key: "order_date",
        label: "발주일",
        kind: "date",
        required: true,
        section: "document",
      },
      {
        key: "requested_delivery_date",
        label: "납기 요청일",
        kind: "date",
        section: "terms",
      },
      {
        key: "currency",
        label: "통화",
        kind: "text",
        required: true,
        section: "totals",
      },
    ],
    lineItems: commonLineItemSlots,
  },
  CI: {
    slots: [
      {
        key: "seller_name",
        label: "판매자",
        kind: "text",
        required: true,
        section: "seller",
      },
      {
        key: "buyer_name",
        label: "구매자",
        kind: "text",
        required: true,
        section: "buyer",
      },
      {
        key: "doc_number",
        label: "송장번호",
        kind: "text",
        required: true,
        section: "document",
      },
      {
        key: "doc_date",
        label: "송장일",
        kind: "date",
        required: true,
        section: "document",
      },
      { key: "freight", label: "운임", kind: "money", section: "totals" },
      { key: "insurance", label: "보험료", kind: "money", section: "totals" },
      { key: "vessel", label: "선박/항차", kind: "text", section: "terms" },
      { key: "eta", label: "ETA", kind: "date", section: "terms" },
      {
        key: "currency",
        label: "통화",
        kind: "text",
        required: true,
        section: "totals",
      },
    ],
    lineItems: commonLineItemSlots,
  },
  PL: {
    slots: [
      {
        key: "packing_number",
        label: "포장번호",
        kind: "text",
        required: true,
        section: "document",
      },
      {
        key: "packing_date",
        label: "포장일",
        kind: "date",
        section: "document",
      },
      {
        key: "container_no",
        label: "컨테이너",
        kind: "text",
        section: "goods",
      },
      { key: "seal_no", label: "씰 번호", kind: "text", section: "goods" },
      {
        key: "gross_weight",
        label: "총중량",
        kind: "text",
        section: "goods",
      },
      { key: "net_weight", label: "순중량", kind: "number", section: "goods" },
    ],
    lineItems: commonLineItemSlots,
  },
  SI: {
    slots: [
      {
        key: "shipper_name",
        label: "송하인",
        kind: "text",
        required: true,
        section: "seller",
      },
      {
        key: "consignee_name",
        label: "수하인",
        kind: "text",
        required: true,
        section: "buyer",
      },
      {
        key: "booking_no",
        label: "부킹번호",
        kind: "text",
        required: true,
        section: "document",
      },
      { key: "pol", label: "선적항", kind: "text", section: "terms" },
      { key: "pod", label: "도착항", kind: "text", section: "terms" },
      { key: "vessel", label: "선박/항차", kind: "text", section: "terms" },
      { key: "etd", label: "ETD", kind: "date", section: "terms" },
      { key: "eta", label: "ETA", kind: "date", section: "terms" },
    ],
  },
  BC: {
    slots: [
      {
        key: "beneficiary_name",
        label: "수익자",
        kind: "text",
        required: true,
        section: "seller",
      },
      {
        key: "applicant_name",
        label: "개설의뢰인",
        kind: "text",
        required: true,
        section: "buyer",
      },
      {
        key: "lc_number",
        label: "L/C 번호",
        kind: "text",
        section: "document",
      },
      { key: "issue_date", label: "발행일", kind: "date", section: "document" },
      {
        key: "certificate_text",
        label: "증명 문구",
        kind: "text",
        required: true,
        section: "remarks",
      },
    ],
  },
  DLV: {
    slots: [
      {
        key: "recipient_name",
        label: "납품처",
        kind: "text",
        required: true,
        section: "buyer",
      },
      {
        key: "delivery_date",
        label: "납품일",
        kind: "date",
        required: true,
        section: "document",
      },
      {
        key: "delivery_address",
        label: "배송지",
        kind: "text",
        section: "terms",
      },
      { key: "vehicle_no", label: "차량번호", kind: "text", section: "terms" },
    ],
    lineItems: commonLineItemSlots,
  },
  CO: {
    slots: [
      {
        key: "exporter_name",
        label: "수출자",
        kind: "text",
        required: true,
        section: "seller",
      },
      {
        key: "importer_name",
        label: "수입자",
        kind: "text",
        required: true,
        section: "buyer",
      },
      {
        key: "origin_country",
        label: "원산지",
        kind: "text",
        required: true,
        section: "goods",
      },
      { key: "transport", label: "운송수단", kind: "text", section: "terms" },
      {
        key: "declaration_date",
        label: "신고일",
        kind: "date",
        section: "document",
      },
    ],
    lineItems: commonLineItemSlots,
  },
  SOA: {
    slots: [
      {
        key: "counterparty_name",
        label: "거래처",
        kind: "text",
        required: true,
        section: "buyer",
      },
      {
        key: "period_start",
        label: "기간 시작",
        kind: "date",
        required: true,
        section: "document",
      },
      {
        key: "period_end",
        label: "기간 종료",
        kind: "date",
        required: true,
        section: "document",
      },
      {
        key: "total_billed",
        label: "청구 합계",
        kind: "money",
        section: "totals",
      },
      {
        key: "total_paid",
        label: "수금 합계",
        kind: "money",
        section: "totals",
      },
      {
        key: "balance",
        label: "잔액",
        kind: "money",
        required: true,
        section: "totals",
      },
    ],
  },
  DN: {
    slots: [
      {
        key: "counterparty_name",
        label: "거래처",
        kind: "text",
        required: true,
        section: "buyer",
      },
      {
        key: "debit_note_no",
        label: "차변표 번호",
        kind: "text",
        required: true,
        section: "document",
      },
      {
        key: "issue_date",
        label: "발행일",
        kind: "date",
        required: true,
        section: "document",
      },
      {
        key: "related_invoice_no",
        label: "관련 인보이스",
        kind: "text",
        section: "document",
      },
      {
        key: "amount",
        label: "조정 금액",
        kind: "money",
        required: true,
        section: "totals",
      },
      {
        key: "reason",
        label: "사유",
        kind: "text",
        required: true,
        section: "remarks",
      },
    ],
  },
  CN: {
    slots: [
      {
        key: "counterparty_name",
        label: "거래처",
        kind: "text",
        required: true,
        section: "buyer",
      },
      {
        key: "credit_note_no",
        label: "대변표 번호",
        kind: "text",
        required: true,
        section: "document",
      },
      {
        key: "issue_date",
        label: "발행일",
        kind: "date",
        required: true,
        section: "document",
      },
      {
        key: "related_invoice_no",
        label: "관련 인보이스",
        kind: "text",
        section: "document",
      },
      {
        key: "amount",
        label: "감액 금액",
        kind: "money",
        required: true,
        section: "totals",
      },
      {
        key: "reason",
        label: "사유",
        kind: "text",
        required: true,
        section: "remarks",
      },
    ],
  },
}

const templateFieldSummary = (code: string) => {
  const schema = templateSchemas[code]
  if (!schema) return ""
  const required = schema.slots.filter((slot) => slot.required).length
  const lineItemText = schema.lineItems
    ? ` · 품목 ${schema.lineItems.length}필드`
    : ""
  return `필수 ${required}개 · ${schema.slots.length}필드${lineItemText}`
}

const inputTypeForKind = (kind: PrototypeSlotKind) =>
  kind === "date"
    ? "date"
    : kind === "number" || kind === "money"
      ? "number"
      : "text"

const isNumericInputKind = (kind: PrototypeSlotKind) =>
  kind === "number" || kind === "money"

const sampleSlotValues: Record<string, string> = {
  seller_name: "ECOYA Demo Co.",
  buyer_name: "ACME GmbH",
  customer_name: "ACME GmbH",
  supplier_name: "Hanbit Trading",
  counterparty_name: "ACME GmbH",
  shipper_name: "ECOYA Demo Co.",
  consignee_name: "ACME GmbH",
  beneficiary_name: "ECOYA Demo Co.",
  applicant_name: "ACME GmbH",
  exporter_name: "ECOYA Demo Co.",
  importer_name: "ACME GmbH",
  recipient_name: "ACME GmbH",
  contract_number: "SC-2026-0708",
  doc_number: "CI-2026-0708",
  po_number: "PO-2026-0708",
  booking_no: "BKG-014W-2607",
  packing_number: "PL-2026-0708",
  lc_number: "LC-2026-0041",
  debit_note_no: "DN-2026-0012",
  credit_note_no: "CN-2026-0007",
  related_invoice_no: "CI-2026-0703",
  currency: "USD",
  incoterms: "CIF Hamburg",
  payment_terms: "T/T 30 days",
  bank_name: "ECOYA Demo Bank",
  bank_account: "123-456-789012",
  bank_swift: "ECOYKRSE",
  origin_country: "Australia",
  amount: "2400000",
  total_billed: "2400000",
  total_paid: "1800000",
  balance: "600000",
  freight: "24000",
  insurance: "8500",
  gross_weight: "20500",
  net_weight: "20000",
  eta: "2026-08-03",
  etd: "2026-07-20",
}

const sampleValueForSlot = (slot: PrototypeSlot) => {
  if (sampleSlotValues[slot.key]) return sampleSlotValues[slot.key]
  if (slot.kind === "date") return "2026-07-08"
  if (slot.kind === "money") return "2,400,000"
  if (slot.kind === "number") return "20"
  return `${slot.label} 입력값`
}

const displayValueForSlot = (slot: PrototypeSlot) => {
  const value = sampleValueForSlot(slot)
  return isNumericInputKind(slot.kind) && Number.isFinite(Number(value))
    ? Number(value).toLocaleString("ko-KR")
    : value
}

const templateMeta = (code: string) =>
  templates.find(([kind]) => kind === code) ?? templates[2]

type GeneratedDraft = {
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
  pdfState: "none" | "draft" | "final"
  approvalPreviewState?: DocumentApprovalPreviewState
}

const generatedDrafts: GeneratedDraft[] = [
  {
    dealId: "DL-260707-04", title: "판매계약서 승인 요청", type: "계약서",
    number: "SC-2026-0918", party: "ACME GmbH", status: "작성 중", tone: "neutral",
    readiness: "승인자 검토 중", tab: "draft", creatorName: "조민영", creatorAccountId: "account-owner",
    updated: "오늘 10:00", memberCanAccessDeal: true, memberCanDeliver: true, pdfState: "draft",
    approvalPreviewState: "requester-pending",
  },
  {
    dealId: "DL-260707-04", title: "상업송장 승인 완료", type: "인보이스",
    number: "CI-2026-0918", party: "ACME GmbH", status: "작성 중", tone: "neutral",
    readiness: "승인 완료 · 최종 검토", tab: "draft", creatorName: "조민영", creatorAccountId: "account-owner",
    updated: "오늘 10:00", memberCanAccessDeal: true, memberCanDeliver: true, pdfState: "draft",
    approvalPreviewState: "requester-approved",
  },
  {
    dealId: "DL-260707-04", title: "발주서 결제조건 수정", type: "발주서",
    number: "PO-2026-0918", party: "ACME GmbH", status: "작성 중", tone: "neutral",
    readiness: "결제조건 보완 후 재요청", tab: "draft", creatorName: "조민영", creatorAccountId: "account-owner",
    updated: "오늘 10:00", memberCanAccessDeal: true, memberCanDeliver: true, pdfState: "draft",
    approvalPreviewState: "requester-rejected",
  },
  {
    dealId: "",
    title: "표준 매매계약서 초안",
    type: "계약서",
    number: "SC-2026-0708",
    party: "거래 미연결",
    status: "작성 중",
    tone: "warning",
    readiness: "거래 연결 필요",
    tab: "draft",
    creatorName: "박서윤",
    creatorAccountId: "account-admin",
    updated: "오늘 09:42",
    memberCanAccessDeal: false,
    memberCanDeliver: false,
    pdfState: "none",
  },
  {
    dealId: "DL-260708-08",
    title: "은행 제출용 상업송장 초안",
    type: "인보이스",
    number: "CI-2026-0708",
    party: "ACME GmbH",
    status: "작성 중",
    tone: "warning",
    readiness: "은행 거절 전 점검 통과",
    tab: "draft",
    creatorName: "김도현",
    creatorAccountId: "account-member",
    updated: "오늘 09:36",
    memberCanAccessDeal: true,
    memberCanDeliver: true,
    pdfState: "draft",
  },
  {
    dealId: "DL-260708-01",
    title: "은행 제출용 상업송장 점검 필요",
    type: "인보이스",
    number: "CI-2026-0712",
    party: "KATAMAN ASIA-PACIFIC PTE LTD",
    status: "작성 중",
    tone: "danger",
    readiness: "거절 위험 1건 · 거래처명 불일치",
    tab: "draft",
    creatorName: "조민영",
    creatorAccountId: "account-owner",
    updated: "오늘 09:31",
    memberCanAccessDeal: true,
    memberCanDeliver: true,
    pdfState: "draft",
  },
  {
    dealId: "DL-260708-01",
    title: "수출 인보이스",
    type: "인보이스",
    number: "CI-2026-0703",
    party: "ACME GmbH",
    status: "확정",
    tone: "success",
    readiness: "전달 준비",
    tab: "confirmed",
    creatorName: "조민영",
    creatorAccountId: "account-owner",
    updated: "오늘 09:24",
    memberCanAccessDeal: false,
    memberCanDeliver: false,
    pdfState: "final",
  },
  {
    dealId: "DL-260625-07",
    title: "해상운송 견적서",
    type: "견적서",
    number: "QT-2026-0630",
    party: "부산항",
    status: "작성 중",
    tone: "neutral",
    readiness: "ETA 필요",
    tab: "progress",
    creatorName: "알 수 없음",
    creatorAccountId: null,
    updated: "어제 17:42",
    memberCanAccessDeal: false,
    memberCanDeliver: false,
    pdfState: "none",
  },
  {
    dealId: "DL-260708-01",
    title: "상업송장 고객 전달",
    type: "인보이스",
    number: "CI-2026-0704",
    party: "ACME GmbH",
    status: "확정",
    tone: "success",
    readiness: "Magic Link 활성 · 미발송",
    tab: "sharing",
    creatorName: "박서윤",
    creatorAccountId: "account-admin",
    updated: "08.27 16:08",
    memberCanAccessDeal: true,
    memberCanDeliver: true,
    pdfState: "final",
  },
  {
    dealId: "DL-260701-09",
    title: "월 정산 명세서",
    type: "정산서",
    number: "SOA-2026-0629",
    party: "한빛무역",
    status: "발송됨",
    tone: "success",
    readiness: "이메일 전달 완료",
    tab: "done",
    creatorName: "김도현",
    creatorAccountId: "account-member",
    updated: "08.26 14:32",
    memberCanAccessDeal: true,
    memberCanDeliver: true,
    pdfState: "final",
  },
]

const draftSources = [
  {
    title: "인보이스_2607_003.pdf",
    direction: "purchase",
    meta: "업로드 근거 · 5개 필드",
    status: "필드 확인",
    tone: "warning",
    facts: ["품목 Aluminium Scrap", "결제 T/T 30 days", "금액은 재사용 제외"],
    eligible: false,
    priority: 4,
  },
  {
    title: "B/L_2607_014.pdf",
    direction: "purchase",
    meta: "업로드 근거 · 4개 필드",
    status: "검토 완료",
    tone: "success",
    facts: ["선박 HMM Green", "항차 014W", "ETA 2026.08.03"],
    eligible: true,
    priority: 3,
  },
  {
    title: "계약서_안심찬.pdf",
    direction: "sales",
    meta: "최근 문서 · 6개 필드",
    status: "재사용 가능",
    tone: "success",
    facts: ["거래처 ACME GmbH", "조건 CIF Hamburg", "통화 USD"],
    eligible: true,
    priority: 1,
  },
] as const satisfies ReadonlyArray<{
  title: string
  direction: "purchase" | "sales" | "unknown"
  meta: string
  status: string
  tone: Tone
  facts: readonly string[]
  eligible: boolean
  priority: number
}>

const recentDocuments: RecentDocument[] = [
  {
    name: "은행거래내역서_2026-08-27.pdf",
    uploadedAt: "2026.08.27 15:06",
    pages: 3,
    status: "거래 연결 필요",
    tone: "warning",
    stage: "field",
    documentType: "BANK_STATEMENT",
    pdfReviewCompleted: true,
  },
  {
    name: "인보이스_2607_003.pdf",
    uploadedAt: "2026.08.27 14:32",
    pages: 2,
    status: "검토 대기",
    tone: "warning",
    stage: "field",
    documentType: "CI",
  },
  {
    name: "B/L_2607_014.pdf",
    uploadedAt: "2026.08.27 14:24",
    pages: 1,
    status: "분석 중...",
    tone: "blue",
    stage: "ocr",
    documentType: "BL",
  },
  {
    name: "계약서_안심찬.pdf",
    uploadedAt: "2026.08.27 13:58",
    pages: 8,
    dealLabel: "안심찬상사 · SC-2026-0812",
    status: "거래 연결 완료",
    tone: "success",
    stage: "confirmed",
    documentType: "SC",
    pdfReviewCompleted: true,
  },
  {
    name: "포장명세서_0707.pdf",
    uploadedAt: "2026.08.27 13:41",
    pages: 1,
    status: "분석 대기",
    tone: "neutral",
    stage: "queued",
    documentType: "PL",
  },
  {
    name: "ArrivalNotice_014W.pdf",
    uploadedAt: "2026.08.27 12:40",
    pages: 1,
    status: "처리 실패",
    tone: "danger",
    stage: "failed",
    documentType: "AN",
  },
  {
    name: "인보이스_중복확인_0918.pdf", uploadedAt: "2026.09.18 09:15", pages: 2,
    dealLabel: "한빛무역 · INV-2026-0703", status: "중복 확인 필요", tone: "warning", stage: "duplicate", documentType: "CI",
  },
  {
    name: "회사소개서_처리제외_0918.pdf", uploadedAt: "2026.09.18 09:10", pages: 4,
    status: "처리 제외", tone: "neutral", stage: "excluded", documentType: "OTHER",
  },
  {
    name: "스캔문서_유형확인_0918.pdf", uploadedAt: "2026.09.18 09:05", pages: 1,
    status: "유형 확인 필요", tone: "warning", stage: "field", documentType: "UNK",
  },
]

const manualUploadDocumentTypeOptions: ReadonlyArray<{
  value: Exclude<UploadDocumentType, "UNK" | "OTHER">
  label: string
}> = [
  { value: "BL", label: "B/L · 선하증권" },
  { value: "PO", label: "PO · 발주서" },
  { value: "CI", label: "CI · 상업송장" },
  { value: "SC", label: "SC · 판매계약서" },
  { value: "PL", label: "PL · 포장명세서" },
  { value: "CUSTOMS_ENTRY", label: "수입신고필증" },
  { value: "PI", label: "PI · 견적송장" },
  { value: "C/O", label: "C/O · 원산지증명서" },
  { value: "AN", label: "AN · 도착통지" },
  { value: "BANK_STATEMENT", label: "은행거래내역서" },
  { value: "FREIGHT_INVOICE", label: "운임 인보이스" },
  { value: "CUSTOMS_DECLARATION", label: "관세신고서" },
  { value: "INSURANCE_CERTIFICATE", label: "보험증권" },
]

function inferUploadDocumentType(fileName: string): UploadDocumentType {
  const normalized = fileName.toLowerCase().replace(/[\s_-]+/g, " ")
  if (/bill of lading|(^|\s)b\/?l(\s|\.)/.test(normalized)) return "BL"
  if (/packing|(^|\s)pl(\s|\.)/.test(normalized)) return "PL"
  if (/purchase order|(^|\s)po(\s|\.)/.test(normalized)) return "PO"
  if (/invoice|commercial invoice|(^|\s)ci(\s|\.)/.test(normalized)) return "CI"
  if (/contract|sales contract|(^|\s)sc(\s|\.)/.test(normalized)) return "SC"
  if (/arrival notice|(^|\s)an(\s|\.)/.test(normalized)) return "AN"
  if (/bank statement|거래내역|입출금/.test(normalized)) return "BANK_STATEMENT"
  return "UNK"
}

function isUploadDocumentTypeUnresolved(document: RecentDocument) {
  return (
    document.documentType === "UNK" ||
    (/^QT[-_]/i.test(document.name) && document.documentType === "CI")
  )
}

const forwardedEmails = [
  {
    id: "mail-1",
    from: "minji@hanbit-trade.com",
    subject: "FW: July export docs",
    received: "방금 전",
    documents: [
      {
        id: "mail-1-doc-1",
        file: "Invoice_HB-2607-003.pdf",
        meta: "2p · 인보이스",
      },
      {
        id: "mail-1-doc-2",
        file: "PackingList_0707.pdf",
        meta: "1p · 포장명세서",
      },
      {
        id: "mail-1-doc-3",
        file: "Certificate_origin.pdf",
        meta: "1p · 원산지증명",
      },
    ],
  },
  {
    id: "mail-2",
    from: "ops@acme-gmbh.de",
    subject: "Shipping documents attached",
    received: "12분 전",
    documents: [
      {
        id: "mail-2-doc-1",
        file: "BILL_OF_LADING_014W.pdf",
        meta: "3p · 선하증권",
      },
      {
        id: "mail-2-doc-2",
        file: "Insurance_Cover_2607.pdf",
        meta: "1p · 보험증권",
      },
    ],
  },
  {
    id: "mail-3",
    from: "logistics@hanbit-trade.com",
    subject: "Fwd: B/L copy",
    received: "31분 전",
    documents: [
      {
        id: "mail-3-doc-1",
        file: "ArrivalNotice_014W.pdf",
        meta: "1p · 도착통지",
      },
    ],
  },
  {
    id: "mail-4",
    from: "minji@hanbit-trade.com",
    subject: "FW: revised contract package",
    received: "1시간 전",
    documents: [
      {
        id: "mail-4-doc-1",
        file: "SalesContract_Revised.pdf",
        meta: "6p · 매매계약서",
      },
      {
        id: "mail-4-doc-2",
        file: "BankDetails_Hanbit.pdf",
        meta: "1p · 은행정보",
      },
    ],
  },
  {
    id: "mail-5",
    from: "ops@acme-gmbh.de",
    subject: "Signed PO and delivery schedule",
    received: "어제",
    documents: [
      { id: "mail-5-doc-1", file: "PO_ACME_202607.pdf", meta: "2p · 발주서" },
      {
        id: "mail-5-doc-2",
        file: "DeliverySchedule.xlsx",
        meta: "1p · 납품일정",
      },
    ],
  },
] as const satisfies ReadonlyArray<{
  id: string
  from: string
  subject: string
  received: string
  documents: readonly {
    id: string
    file: string
    meta: string
  }[]
}>

const forwardedDocumentCount = forwardedEmails.reduce(
  (sum, mail) => sum + mail.documents.length,
  0
)

function ToneBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  const palette = {
    warning: "orange",
    blue: "blue",
    success: "green",
    danger: "red",
    neutral: "grayComplete",
  }[tone] as "orange" | "blue" | "green" | "red" | "grayComplete"

  return (
    <Badge palette={palette} tone="fill" size="sm">
      {children}
    </Badge>
  )
}

function AppSelect({
  value,
  onValueChange,
  options,
  className,
  placeholder,
  ariaLabel,
}: {
  value: string
  onValueChange: (value: string) => void
  options: Array<string | [string, string]>
  className?: string
  placeholder?: string
  ariaLabel?: string
}) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => onValueChange(nextValue ?? value)}
    >
      <SelectTrigger
        className={cn("h-8 w-full", className)}
        aria-label={ariaLabel}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => {
          const [optionValue, optionLabel] = Array.isArray(option)
            ? option
            : [option, option]
          return (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

function AutoResizeTextarea({ placeholder }: { placeholder: string }) {
  const [value, setValue] = useState("")

  const resize = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const target = event.currentTarget
    setValue(target.value)
    target.style.height = "32px"
    target.style.height = `${Math.min(target.scrollHeight, 128)}px`
  }

  return (
    <Textarea
      value={value}
      onChange={resize}
      rows={1}
      className="max-h-32 min-h-8 flex-1 resize-none overflow-hidden bg-transparent py-1.5 text-sm leading-5 outline-none placeholder:text-muted-foreground"
      placeholder={placeholder}
    />
  )
}

function EcoyaTradeOsLogo({
  size = "header",
  tone = "color",
}: {
  size?: "header" | "menu"
  tone?: "color" | "white"
}) {
  const height = size === "menu" ? 20 : 15
  const wordmarkWidth = (176 / 40) * height
  const sourceWidth = (327 / 40) * height

  return (
    <span
      className="inline-flex shrink-0 items-center"
      style={{ height: `${height}px` }}
    >
      <span
        className="relative block shrink-0 overflow-hidden"
        style={{ height: `${height}px`, width: `${wordmarkWidth}px` }}
      >
        <img
          src={tone === "white" ? ecoyaWhiteLogoSrc : ECOYA_SNAP_LOGO_SRC}
          alt=""
          aria-hidden="true"
          className="absolute top-0 left-0 max-w-none"
          style={{ height: `${height}px`, width: `${sourceWidth}px` }}
        />
      </span>
      <span
        className={cn(
          "ml-1 leading-none font-medium tracking-[-0.04em] whitespace-nowrap",
          tone === "white"
            ? "text-[var(--ui-sidebar-gradient-foreground)]"
            : "text-[var(--color-gray-2)]",
          size === "menu" ? "text-sm" : "text-xs"
        )}
      >
        TRADE OS
      </span>
    </span>
  )
}

function ProductSwitcher({
  product,
  onProductChange,
  compact = false,
  availableProducts = ["erp", "snap"],
  tone = "white",
}: {
  product: ProductKey
  onProductChange: (product: ProductKey) => void
  compact?: boolean
  availableProducts?: ProductKey[]
  tone?: "color" | "white"
}) {
  const productName = product === "erp" ? "ECOYA Trade OS" : "ECOYA SNAP"

  return (
    <Select
      value={product}
      onValueChange={(value) => {
        if (value === "erp" || value === "snap") onProductChange(value)
      }}
    >
      <SelectTrigger
        className={cn(
          "snap-product-switcher h-11 w-full border-0 bg-transparent px-1 shadow-none hover:bg-sidebar-accent focus-visible:ring-2",
          compact &&
            "justify-center gap-0 p-0 *:data-[slot=select-value]:flex-none [&>svg:last-child]:hidden"
        )}
        aria-label="ECOYA 제품 전환"
        title={compact ? `${productName} 제품 전환` : undefined}
      >
        <SelectValue>
          <span className="flex min-w-0 items-center gap-2.5">
            {compact ? (
              <span className="flex size-8 shrink-0 items-center justify-center">
                <img
                  src={ECOYA_SYMBOL_SRC}
                  alt=""
                  aria-hidden="true"
                  className={cn(
                    "size-6 object-contain",
                    tone === "white" && "brightness-0 invert"
                  )}
                />
              </span>
            ) : (
              <span className="flex min-w-0 flex-1 items-center text-left">
                {product === "erp" ? (
                  <EcoyaTradeOsLogo tone={tone} />
                ) : (
                  <img
                    src={
                      tone === "white" ? ecoyaWhiteLogoSrc : ECOYA_SNAP_LOGO_SRC
                    }
                    alt={productName}
                    className="h-4 w-auto max-w-[128px] shrink-0 object-contain object-left"
                  />
                )}
              </span>
            )}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="min-w-64 p-2">
        {availableProducts.includes("erp") ? (
          <SelectItem
            value="erp"
            className="mb-2 min-h-24 gap-3 py-3 pr-10 pl-2 last:mb-0"
          >
            <Building2 />
            <span className="grid gap-1 py-0.5">
              <EcoyaTradeOsLogo size="menu" />
              <span className="font-medium">ECOYA Trade OS</span>
              <span className="text-xs text-muted-foreground">
                Trade Operations · 문서·거래·정산
              </span>
            </span>
          </SelectItem>
        ) : null}
        {availableProducts.includes("snap") ? (
          <SelectItem
            value="snap"
            className="mb-2 min-h-24 gap-3 object-left py-3 pr-10 pl-2 last:mb-0"
          >
            <Camera />
            <span className="grid gap-1 py-0.5">
              <img
                src={ECOYA_SNAP_LOGO_SRC}
                alt="ECOYA SNAP"
                className="h-5 w-auto max-w-32 object-contain object-left"
              />
              <span className="font-medium">ECOYA SNAP</span>
              <span className="text-xs text-muted-foreground">
                Field Evidence · 현장 작업·증거
              </span>
            </span>
          </SelectItem>
        ) : null}
      </SelectContent>
    </Select>
  )
}

function AppNav({
  screen,
  setScreen,
  product,
  onProductChange,
  unreadNotificationCount,
  onOpenNotifications,
  snapScreen,
  onSnapScreenChange,
  onLogout,
  workspaceId,
  onWorkspaceChange,
  availableProducts,
  snapRole,
  isV2Workspace,
  erpRole,
}: {
  screen: Screen
  setScreen: (screen: Screen) => void
  product: ProductKey
  onProductChange: (product: ProductKey) => void
  unreadNotificationCount: number
  onOpenNotifications: () => void
  snapScreen: SnapScreenKey
  onSnapScreenChange: (screen: SnapScreenKey) => void
  onLogout: () => void
  workspaceId: WorkspaceKey
  onWorkspaceChange: (workspaceId: WorkspaceKey) => void
  availableProducts: ProductKey[]
  snapRole: SnapRole | null
  isV2Workspace: boolean
  erpRole: ErpPreviewRole
}) {
  const { isMobile, setOpenMobile, state: sidebarState } = useSidebar()
  const sidebarCollapsed = sidebarState === "collapsed"
  const navigate = (nextScreen: Screen) => {
    setScreen(nextScreen)
    if (isMobile) setOpenMobile(false)
  }
  const openSettings = () => {
    if (product === "snap") {
      onSnapScreenChange("SC-30")
      if (isMobile) setOpenMobile(false)
      return
    }
    navigate("settings")
  }
  const currentWorkspace =
    workspaceOptions.find((workspace) => workspace.id === workspaceId) ??
    workspaceOptions[0]

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "snap-navigation",
        "top-0 z-[var(--z-side-nav)] h-svh!",
        isV2Workspace && "v2-navigation"
      )}
    >
      {isV2Workspace ? (
        <SidebarHeader className="hidden shrink-0 p-0 md:block">
          <div className="flex h-(--header-height) items-center px-4 group-data-[collapsible=icon]:px-2">
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <ProductSwitcher
                  product={product}
                  onProductChange={onProductChange}
                  availableProducts={availableProducts}
                  tone="color"
                />
              </div>
              <SidebarTrigger
                aria-label={
                  sidebarCollapsed ? "사이드바 펼치기" : "사이드바 접기"
                }
                className="ml-auto shrink-0 group-data-[collapsible=icon]:mx-auto"
              />
            </div>
          </div>
          <div className="flex items-center gap-1 px-3 pt-2 pb-1">
            <div className="min-w-0 flex-1">
              <WorkspaceSwitcher
                workspaceId={workspaceId}
                onWorkspaceChange={onWorkspaceChange}
                textOnly
              />
            </div>
            {!sidebarCollapsed ? (
              <NotificationButton
                unreadCount={unreadNotificationCount}
                active={screen === "notifications"}
                onClick={onOpenNotifications}
              />
            ) : null}
          </div>
        </SidebarHeader>
      ) : (
        <SidebarHeader className="hidden shrink-0 p-0 lg:block">
          <div className="flex min-h-14 items-center px-3 group-data-[collapsible=icon]:px-2">
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <ProductSwitcher
                product={product}
                onProductChange={onProductChange}
                availableProducts={availableProducts}
                tone="color"
              />
            </div>
            <SidebarTrigger
              aria-label={
                sidebarCollapsed ? "사이드바 펼치기" : "사이드바 접기"
              }
              className="ml-1 shrink-0 group-data-[collapsible=icon]:mx-auto"
            />
          </div>
          <div className="flex items-center gap-1 px-3 pt-1 pb-2">
            <div className="min-w-0 flex-1">
              <WorkspaceSwitcher
                workspaceId={workspaceId}
                onWorkspaceChange={onWorkspaceChange}
                textOnly
              />
            </div>
            {!sidebarCollapsed ? (
              <NotificationButton
                unreadCount={unreadNotificationCount}
                active={screen === "notifications"}
                onClick={onOpenNotifications}
              />
            ) : null}
          </div>
        </SidebarHeader>
      )}
      <SidebarHeader
        className={cn(
          "border-b p-3",
          isV2Workspace ? "md:hidden" : "lg:hidden"
        )}
      >
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <ProductSwitcher
              product={product}
              onProductChange={onProductChange}
              availableProducts={availableProducts}
              tone="color"
            />
          </div>
          <SidebarTrigger aria-label="메뉴 닫기" />
        </div>
        <div className="mt-2">
          <WorkspaceSwitcher
            workspaceId={workspaceId}
            onWorkspaceChange={onWorkspaceChange}
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="group-data-[collapsible=icon]:pl-0 lg:pl-2">
        {product === "erp"
          ? erpNavGroups.map((group, groupIndex) => (
              <SidebarGroup
                key={group.label || "primary"}
                className={cn(groupIndex > 0 && "pt-1")}
              >
                {group.label ? (
                  <SidebarGroupLabel className="group-data-[collapsible=icon]:pointer-events-none">{group.label}</SidebarGroupLabel>
                ) : null}
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map(([label, Icon, key, plan]) => {
                      if (key === "monitoring" && erpRole !== "owner") return null
                      const active =
                        key === screen ||
                        (key === "deals" &&
                          (screen === "deals" || screen === "deal")) ||
                        (key === "create" && screen === "result")
                      return (
                        <SidebarMenuItem key={label}>
                          <SidebarMenuButton
                            isActive={active}
                            tooltip={label}
                            aria-label={label}
                            onClick={() => navigate(key)}
                            className="text-sidebar-foreground/75 data-active:font-semibold"
                          >
                            <Icon />
                            <span>{label}</span>
                          </SidebarMenuButton>
                          {plan ? (
                            <SidebarMenuBadge className="bg-primary/10 text-[9px] font-semibold text-primary">
                              {plan}
                            </SidebarMenuBadge>
                          ) : null}
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))
          : snapNavGroups.map((group, groupIndex) => {
              const visibleItems = group.items.filter(([, , key]) => {
                const definition = getSnapRouteByScreen(key)
                if (!definition || !snapRole) return false
                return canAccessSnapRoute(definition, {
                  role: snapRole,
                  platformOps: false,
                  authenticated: true,
                })
              })
              if (visibleItems.length === 0) return null

              return (
                <SidebarGroup
                  key={group.label || "snap-primary"}
                  className={cn(groupIndex > 0 && "pt-1")}
                >
                  {group.label ? (
                    <SidebarGroupLabel className="group-data-[collapsible=icon]:pointer-events-none">{group.label}</SidebarGroupLabel>
                  ) : null}
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {visibleItems.map(([label, Icon, key]) => (
                        <SidebarMenuItem key={key}>
                          <SidebarMenuButton
                            isActive={
                              screen === "snap-platform" && snapScreen === key
                            }
                            tooltip={label}
                            aria-label={label}
                            onClick={() => {
                              onSnapScreenChange(key)
                              navigate("snap-platform")
                            }}
                            className="text-sidebar-foreground/75 data-active:font-semibold"
                          >
                            <Icon />
                            <span>{label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )
            })}
      </SidebarContent>
      {product !== "snap" ||
      (snapRole &&
        canAccessSnapRoute(getSnapRouteByScreen("SC-30")!, {
          role: snapRole,
          platformOps: false,
          authenticated: true,
        })) ? (
        <SidebarFooter className="mt-auto min-h-16 shrink-0 border-t p-3">
          <SidebarMenu>
            <SidebarProfileMenu
              onSettings={openSettings}
              onUsage={() => navigate("tokens")}
              onBilling={() => navigate("billing")}
              onLogout={() => {
                onLogout()
                if (isMobile) setOpenMobile(false)
              }}
              workspaceName={currentWorkspace.name}
              billingPlan={currentWorkspace.billingPlan}
              product={product}
            />
          </SidebarMenu>
        </SidebarFooter>
      ) : null}
      <SidebarRail />
    </Sidebar>
  )
}

function WorkspaceHeader({
  screen,
  templateCode,
  unreadNotificationCount,
  onOpenNotifications,
  onNavigate,
  product,
  snapScreen,
  onSnapScreenChange,
  erpHomeRole,
  onErpHomeRoleChange,
  showErpHomeRoleSwitch,
  documentApprovalPreviewState,
  onDocumentApprovalPreviewStateChange,
  showDocumentApprovalPreviewSwitch,
  isV2Workspace,
  dealActionsRef,
}: {
  screen: Screen
  templateCode: string
  unreadNotificationCount: number
  onOpenNotifications: () => void
  onNavigate: (screen: Screen) => void
  product: ProductKey
  snapScreen: SnapScreenKey
  onSnapScreenChange: (screen: SnapScreenKey) => void
  erpHomeRole: ErpPreviewRole
  onErpHomeRoleChange: (role: ErpPreviewRole) => void
  showErpHomeRoleSwitch: boolean
  documentApprovalPreviewState: DocumentApprovalPreviewState
  onDocumentApprovalPreviewStateChange: (
    state: DocumentApprovalPreviewState
  ) => void
  showDocumentApprovalPreviewSwitch: boolean
  isV2Workspace: boolean
  dealActionsRef?: (node: HTMLDivElement | null) => void
}) {
  const { isMobile, state: sidebarState } = useSidebar()
  const sidebarCollapsed = sidebarState === "collapsed"

  const [, templateTitle] = templateMeta(templateCode)
  const activeSnapRoute = getSnapRouteByScreen(snapScreen)
  const screenTitles: Partial<Record<Screen, string>> = {
    onboarding: "처음 시작하기",
    home: "오늘 할 일",
    inbox: "문서 올리기",
    create: "문서 만들기",
    ask: "AI에게 묻기",
    deals: "거래",
    deal: "거래 상세",
    shipments: "선적",
    settlement: "정산",
    monitoring: "운영 감시",
    reports: "결산 리포트",
    sales: "영업 성과",
    notifications: "알림",
    settings: "설정",
    counterparty: "거래처 360",
    snap: "SNAP 증거함",
    billing: "결제·구독",
    tokens: "토큰 사용량",
    "snap-platform":
      activeSnapRoute?.label ?? snapScreenLabels[snapScreen] ?? "SNAP",
  }
  const screenSections: Partial<Record<Screen, string>> = {
    onboarding: "AI 서류 처리",
    home: "AI 서류 처리",
    inbox: "AI 서류 처리",
    create: "AI 서류 처리",
    result: "AI 서류 처리",
    ask: "AI 서류 처리",
    deals: "기록",
    deal: "기록",
    shipments: "기록",
    settlement: "기록",
    counterparty: "기록",
    snap: "기록",
    monitoring: "경영·성과",
    reports: "경영·성과",
    sales: "경영·성과",
    notifications: "알림",
    settings: "설정",
    billing: "설정",
    tokens: "설정",
    "snap-platform": "ECOYA SNAP",
  }
  const title = screenTitles[screen] ?? `${templateTitle} 초안`
  const section = screenSections[screen] ?? "AI 서류 처리"
  const breadcrumbs =
    screen === "snap-platform" && activeSnapRoute
      ? [...activeSnapRoute.breadcrumb]
      : screen === "deal"
        ? ["기록", "거래", title]
        : section !== title
          ? [section, title]
          : [title]
  const firstDepthTargets: Partial<Record<string, Screen>> = {
    "AI 서류 처리": "home",
    기록: "deals",
    "경영·성과": "monitoring",
  }
  const navigateToFirstDepth = () => {
    if (section === "ECOYA SNAP") {
      onSnapScreenChange("SC-17")
      onNavigate("snap-platform")
      return
    }

    const target = firstDepthTargets[section]
    if (target) onNavigate(target)
  }

  return (
    <header
      className={cn(
        "snap-shell-header z-40 h-(--header-height) w-full shrink-0 bg-[var(--surface-background)]",
        isV2Workspace && "v2-shell-header"
      )}
    >
      <div className="flex h-full w-full items-center">
        {!isV2Workspace ? (
          screen !== "settings" ? (
            <div
              data-sidebar="workspace-brand"
              data-sidebar-state={sidebarState}
              className={cn(
                "snap-navigation-brand hidden h-full items-center bg-sidebar text-sidebar-foreground transition-[width,padding] duration-200 ease-linear md:flex md:shrink-0",
                sidebarCollapsed
                  ? "md:w-(--sidebar-width-icon) md:px-2"
                  : "md:w-(--sidebar-width) md:px-4"
              )}
            >
              <div className="flex min-w-0 flex-1 items-center justify-end" />
            </div>
          ) : (
            <div
              aria-hidden="true"
              className={cn(
                "snap-navigation-brand hidden h-full shrink-0 bg-sidebar md:block",
                sidebarCollapsed
                  ? "md:w-(--sidebar-width-icon)"
                  : "md:w-(--sidebar-width)"
              )}
            />
          )
        ) : null}
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center justify-between gap-2 px-3 sm:px-5",
            isV2Workspace &&
              (sidebarCollapsed
                ? "md:ml-(--sidebar-width-icon)"
                : "md:ml-(--sidebar-width)")
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger
              className="md:hidden"
              aria-label={
                screen === "settings" ? "설정 메뉴 열기" : "서비스 메뉴 열기"
              }
            />
            <nav
              aria-label="현재 위치"
              className="flex min-w-0 items-center gap-1.5 text-sm"
            >
              {breadcrumbs.map((breadcrumb, index) => {
                const isCurrent = index === breadcrumbs.length - 1
                return (
                  <Fragment key={`${breadcrumb}-${index}`}>
                    {index > 0 ? (
                      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                    ) : null}
                    {index === 0 && !isCurrent && firstDepthTargets[section] ? (
                      <button
                        type="button"
                        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground hover:underline"
                        onClick={navigateToFirstDepth}
                      >
                        {breadcrumb}
                      </button>
                    ) : index === 0 &&
                      !isCurrent &&
                      section === "ECOYA SNAP" ? (
                      <button
                        type="button"
                        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground hover:underline"
                        onClick={navigateToFirstDepth}
                      >
                        {breadcrumb}
                      </button>
                    ) : (
                      <span
                        className={
                          isCurrent
                            ? "truncate font-semibold"
                            : "shrink-0 text-muted-foreground"
                        }
                        aria-current={isCurrent ? "page" : undefined}
                      >
                        {breadcrumb}
                      </span>
                    )}
                  </Fragment>
                )
              })}
            </nav>
          </div>
          <div className="flex items-center gap-1.5">
            {isMobile || sidebarCollapsed ? (
              <NotificationButton
                unreadCount={unreadNotificationCount}
                active={screen === "notifications"}
                onClick={onOpenNotifications}
              />
            ) : null}
            <TopBarUtilities
              product={product}
              erpHomeRole={erpHomeRole}
              onErpHomeRoleChange={onErpHomeRoleChange}
              showErpHomeRoleSwitch={showErpHomeRoleSwitch}
              documentApprovalPreviewState={documentApprovalPreviewState}
              onDocumentApprovalPreviewStateChange={
                onDocumentApprovalPreviewStateChange
              }
              showDocumentApprovalPreviewSwitch={
                showDocumentApprovalPreviewSwitch
              }
              dealActionsRef={dealActionsRef}
            />
          </div>
        </div>
      </div>
    </header>
  )
}

const worldClockZones = [
  ["서울", "Asia/Seoul", "조직 시간"],
  ["뉴욕", "America/New_York", "미주"],
  ["런던", "Europe/London", "유럽"],
  ["상하이", "Asia/Shanghai", "중국"],
] as const

function formatWorldTime(timeZone: string, now: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone,
  }).format(now)
}

function NotificationButton({
  unreadCount,
  active,
  onClick,
}: {
  unreadCount: number
  active: boolean
  onClick: () => void
}) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="icon"
      type="button"
      aria-label={unreadCount > 0 ? `알림, 미확인 ${unreadCount}개` : "알림"}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className="relative shrink-0 text-muted-foreground"
    >
      <Bell className="size-4.5" />
      {unreadCount > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] leading-4 font-semibold text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Button>
  )
}

function TopBarUtilities({
  product,
  erpHomeRole,
  onErpHomeRoleChange,
  showErpHomeRoleSwitch,
  documentApprovalPreviewState,
  onDocumentApprovalPreviewStateChange,
  showDocumentApprovalPreviewSwitch,
  dealActionsRef,
}: {
  product: ProductKey
  erpHomeRole: ErpPreviewRole
  onErpHomeRoleChange: (role: ErpPreviewRole) => void
  showErpHomeRoleSwitch: boolean
  documentApprovalPreviewState: DocumentApprovalPreviewState
  onDocumentApprovalPreviewStateChange: (
    state: DocumentApprovalPreviewState
  ) => void
  showDocumentApprovalPreviewSwitch: boolean
  dealActionsRef?: (node: HTMLDivElement | null) => void
}) {
  const [open, setOpen] = useState<"clock" | "more" | null>(null)
  const [now, setNow] = useState(() => new Date())
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!open || open === "more") return
    const closeOnOutside = (event: PointerEvent) => {
      if (
        rootRef.current &&
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      ) {
        setOpen(null)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null)
    }
    document.addEventListener("pointerdown", closeOnOutside)
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative flex items-center gap-1.5">
      {dealActionsRef ? (
        <div ref={dealActionsRef} className="flex items-center gap-1.5" />
      ) : null}
      <Button
        variant="outline"
        type="button"
        aria-label="세계시간 열기"
        aria-expanded={open === "clock"}
        onClick={() =>
          setOpen((current) => (current === "clock" ? null : "clock"))
        }
        className="hidden lg:inline-flex"
      >
        <Clock3 className="size-4 text-primary" />
        <span className="font-medium">세계시간</span>
        <span className="text-muted-foreground tabular-nums">
          서울 {formatWorldTime("Asia/Seoul", now)}
        </span>
      </Button>
      <Popover
        open={open === "more"}
        onOpenChange={(nextOpen) => setOpen(nextOpen ? "more" : null)}
      >
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="더보기"
            className="text-muted-foreground"
          >
            <MoreVertical className="size-4.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-52 gap-0 p-1">
          {product === "erp" && showErpHomeRoleSwitch ? (
            <>
              <div className="px-2 py-2">
                <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Users className="size-3.5" />
                  화면 권한
                </label>
                <Select
                  value={erpHomeRole}
                  onValueChange={(value) => {
                    if (
                      value === "owner" ||
                      value === "admin" ||
                      value === "member"
                    ) {
                      onErpHomeRoleChange(value)
                      setOpen(null)
                    }
                  }}
                >
                  <SelectTrigger
                    className="h-8 w-full bg-background"
                    aria-label="화면 권한 전환"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator className="my-1" />
            </>
          ) : null}
          {product === "erp" && showDocumentApprovalPreviewSwitch ? (
            <>
              <div className="px-2 py-2">
                <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <ClipboardList className="size-3.5" />
                  문서 승인 화면
                </label>
                <Select
                  value={documentApprovalPreviewState}
                  onValueChange={(value) => {
                    if (
                      value === "live" ||
                      value === "requester-pending" ||
                      value === "requester-approved" ||
                      value === "requester-rejected" ||
                      value === "owner-pending" ||
                      value === "admin-pending"
                    ) {
                      onDocumentApprovalPreviewStateChange(value)
                      setOpen(null)
                    }
                  }}
                >
                  <SelectTrigger
                    className="h-8 w-full bg-background"
                    aria-label="문서 승인 화면 상태 전환"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="live">현재 진행 상태</SelectItem>
                    <SelectItem value="requester-pending">
                      요청자 · 승인 대기
                    </SelectItem>
                    <SelectItem value="requester-approved">
                      요청자 · 승인 완료
                    </SelectItem>
                    <SelectItem value="requester-rejected">
                      요청자 · 반려 확인
                    </SelectItem>
                    <SelectItem value="owner-pending">
                      승인자 · Owner
                    </SelectItem>
                    <SelectItem value="admin-pending">
                      승인자 · Admin
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator className="my-1" />
            </>
          ) : null}
          <Button
            variant="ghost"
            type="button"
            onClick={() => setOpen("clock")}
            className="h-auto w-full justify-start px-3 py-2"
          >
            <Clock3 className="size-4" />
            세계시간 보기
          </Button>
          <Separator className="my-1" />
          <Button
            variant="ghost"
            type="button"
            onClick={() => window.location.reload()}
            className="h-auto w-full justify-start px-3 py-2"
          >
            <RefreshCw className="size-4" />
            현재 화면 새로고침
          </Button>
        </PopoverContent>
      </Popover>

      {open === "clock" ? (
        <div
          role="dialog"
          aria-label="세계시간"
          className="absolute top-10 right-9 z-50 w-80 rounded-md border bg-popover text-popover-foreground shadow-lg"
        >
          <div className="border-b px-4 py-3 text-sm font-semibold">
            세계시간
          </div>
          <div className="py-1.5">
            {worldClockZones.map(([label, timeZone, region]) => (
              <div
                key={timeZone}
                className="flex items-center justify-between gap-4 px-4 py-2.5"
              >
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {region} · {timeZone}
                  </div>
                </div>
                <div className="text-base font-semibold tabular-nums">
                  {formatWorldTime(timeZone, now)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function DocumentPaper({
  result = false,
  templateCode = "SC",
  accent = "#166dd7",
  fontStyle = "sans",
  logo,
  className,
}: {
  result?: boolean
  templateCode?: string
  accent?: string
  fontStyle?: "sans" | "serif"
  logo?: DocumentLogo | null
  className?: string
}) {
  const [, templateTitle] = templateMeta(templateCode)
  const templateSlots =
    templateSchemas[templateCode]?.slots ?? templateSchemas.SC.slots
  const previewSlots = templateSlots.slice(0, 4)
  return (
    <div
      data-document-paper
      className={cn(
        "relative mx-auto aspect-[0.72] w-[min(94%,520px)] max-w-[520px] rounded-[3px] border bg-white px-6 py-8 shadow-[0_20px_54px_rgb(31_41_55/0.10)] xl:px-10 xl:py-9",
        fontStyle === "serif" && "font-serif",
        className
      )}
    >
      <div className="flex items-start justify-between gap-8">
        <div>
          <div
            className="text-[11px] font-semibold tracking-[0.14em] uppercase"
            style={{ color: accent }}
          >
            {result ? `${templateCode} Generated Draft` : "Invoice"}
          </div>
          <div className="mt-2 text-[28px] font-semibold tracking-normal">
            {result ? templateTitle : "INVOICE"}
          </div>
        </div>
        <div className="flex min-h-10 flex-col items-end justify-start text-right text-[11px] leading-5 text-muted-foreground">
          {logo?.source === "file" && logo.dataUrl ? (
            <img
              src={logo.dataUrl}
              alt={logo.name}
              className="mb-1 h-7 max-w-28 object-contain"
            />
          ) : logo?.source === "organization" ? (
            <div
              className="mb-1 text-sm font-bold tracking-normal"
              style={{ color: accent }}
            >
              ECOYA
            </div>
          ) : (
            <span>ECOYA Demo Co.</span>
          )}
          <span>2026.07.07</span>
        </div>
      </div>

      <Separator className="my-7" />

      <div className="grid grid-cols-2 gap-x-4 gap-y-5 text-xs xl:gap-x-8">
        {result ? (
          previewSlots.map((slot) => (
            <PaperField
              key={slot.key}
              label={slot.label}
              value={displayValueForSlot(slot)}
            />
          ))
        ) : (
          <>
            <PaperField label="거래처명" value="한빛무역" />
            <PaperField label="서류번호" value="INV-2026-0703" tone="warning" />
            <PaperField label="합계금액" value="4,620,000 KRW" tone="danger" />
            <PaperField label="결제조건" value="T/T 30 days" />
          </>
        )}
      </div>

      {!result || templateSchemas[templateCode]?.lineItems ? (
        <div className="mt-9 overflow-hidden rounded-md border">
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="grid grid-cols-[1fr_0.48fr_0.58fr_0.7fr] border-b last:border-b-0"
            >
              {["품목", "수량", "단가", "금액"].map((cell, index) => (
                <div
                  key={`${row}-${cell}`}
                  className={cn(
                    "h-9 border-r px-2 py-2 text-[10px] last:border-r-0 xl:px-3 xl:text-[11px]",
                    row === 0
                      ? "bg-muted/65 font-medium text-muted-foreground"
                      : "text-foreground",
                    row > 0 && index > 0 && "text-right"
                  )}
                >
                  {row === 0
                    ? cell
                    : index === 0
                      ? `Item ${row}`
                      : index === 3
                        ? "1,540,000"
                        : index === 1
                          ? "12"
                          : "128,333"}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-9 rounded-md border p-4 text-xs leading-6 text-muted-foreground">
          {templateSlots.slice(4, 8).map((slot) => (
            <div
              key={slot.key}
              className="flex justify-between gap-4 border-b py-2 last:border-b-0"
            >
              <span>{slot.label}</span>
              <span className="font-medium text-foreground">
                {displayValueForSlot(slot)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-9 space-y-3">
        <div className="h-2 w-11/12 rounded-full bg-muted" />
        <div className="h-2 w-9/12 rounded-full bg-muted" />
        <div className="h-2 w-10/12 rounded-full bg-muted" />
      </div>
    </div>
  )
}

function PaperField({
  label,
  value,
  tone = "neutral",
}: {
  label: string
  value: string
  tone?: Tone
}) {
  return (
    <div
      className={cn(
        "rounded-md px-2 py-1.5",
        tone === "warning" && "bg-warning/8 ring-1 ring-warning/35",
        tone === "danger" && "bg-destructive/7 ring-1 ring-destructive/35"
      )}
    >
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  )
}

function DocumentStage({
  result = false,
  fitPage = false,
  templateCode = "SC",
  downloadName,
  accent,
  fontStyle,
  logo,
  reviewMode = false,
  canDownload = true,
  controlsPlacement,
  toolbarEyebrow,
  toolbarTitle,
  toolbarMeta,
  reviewGate,
  showAiDetection,
  pageCountOverride,
  previewContent,
  paperClassName,
}: {
  result?: boolean
  fitPage?: boolean
  templateCode?: string
  downloadName?: string
  accent?: string
  fontStyle?: "sans" | "serif"
  logo?: DocumentLogo | null
  reviewMode?: boolean
  canDownload?: boolean
  controlsPlacement?: "top" | "bottom"
  toolbarEyebrow?: string
  toolbarTitle?: string
  toolbarMeta?: ReactNode
  reviewGate?: {
    completed: boolean
    disabled?: boolean
    downloading?: boolean
    showCompleteAction?: boolean
    onComplete: () => void
    onDownload?: () => void | Promise<void>
    completeLabel?: string
    downloadLabel?: string
  }
  showAiDetection?: boolean
  pageCountOverride?: number
  previewContent?: ReactNode | ((page: number, pageCount: number) => ReactNode)
  paperClassName?: string
}) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [zoom, setZoom] = useState(100)
  const [page, setPage] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const pageCount = pageCountOverride ?? (reviewMode || result ? 2 : 1)
  const aiDetectionVisible = showAiDetection ?? !result
  const controlsAtTop = controlsPlacement
    ? controlsPlacement === "top"
    : reviewMode
  useEffect(() => {
    if (!isFullscreen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFullscreen(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isFullscreen])
  const handleDownload = async () => {
    if (pdfGenerating) return
    setPdfGenerating(true)
    try {
      await downloadRenderedDocumentPdf(
        downloadName ?? `${templateCode}-2026-0708.pdf`,
        stageRef.current
      )
    } finally {
      setPdfGenerating(false)
    }
  }
  const reviewedDownload = reviewGate?.onDownload ?? handleDownload
  const toolbarDownload = reviewGate
    ? reviewGate.completed
      ? reviewedDownload
      : undefined
    : canDownload
      ? handleDownload
      : undefined
  return (
    <div
      ref={stageRef}
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden bg-white",
        isFullscreen && "fixed inset-0 z-[120] h-screen w-screen"
      )}
    >
      {controlsAtTop ? (
        <div className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b bg-white px-4 py-2 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0">
              {toolbarEyebrow ? (
                <span className="block text-[11px] text-muted-foreground">
                  {toolbarEyebrow}
                </span>
              ) : null}
              <span className="block truncate text-xs font-semibold">
                {toolbarTitle ??
                  downloadName ??
                  `${templateCode}-2026-0708.pdf`}
              </span>
            </span>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-4">
            {toolbarMeta}
            <PdfViewerToolbar
              zoom={zoom}
              onZoomChange={setZoom}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen((current) => !current)}
              isDownloading={reviewGate?.downloading ?? pdfGenerating}
              onDownload={toolbarDownload}
              labeledDownload={Boolean(reviewGate)}
              downloadLabel={reviewGate?.downloadLabel}
            />
            {reviewGate?.showCompleteAction && !reviewGate.completed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="inline-flex"
                    tabIndex={0}
                    aria-label="검토 완료 후 초안 PDF를 다운로드할 수 있습니다."
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={reviewGate.disabled}
                      onClick={reviewGate.onComplete}
                    >
                      <Check data-icon="inline-start" />
                      {reviewGate.completeLabel ?? "검토 완료"}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="end"
                  className="max-w-72 text-xs leading-5"
                >
                  검토를 완료하면 이 버튼이 초안 PDF 다운로드로 전환됩니다.
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        </div>
      ) : null}
      <PannablePdfViewport
        zoom={zoom}
        className={cn(
          "flex min-h-0 flex-1 justify-center overflow-auto bg-white px-3 pb-20 xl:px-8",
          fitPage ? "items-center pt-6" : "items-start pt-8"
        )}
      >
        <div
          className="w-full transition-transform duration-150"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
          }}
        >
          {typeof previewContent === "function"
            ? previewContent(page, pageCount)
            : (previewContent ?? (
                <DocumentPaper
                  result={result}
                  templateCode={templateCode}
                  accent={accent}
                  fontStyle={fontStyle}
                  logo={logo}
                  className={paperClassName}
                />
              ))}
        </div>
      </PannablePdfViewport>
      {aiDetectionVisible ? (
        <div className="pointer-events-none absolute top-18 right-7 hidden w-44 rounded-md border bg-background/95 p-3 shadow-sm xl:block">
          <div className="text-[11px] font-semibold text-primary">AI 검출</div>
          <div className="mt-2 text-xs leading-5 text-muted-foreground">
            금액 합계가 거래 데이터와 다릅니다. 우측 패널에서 확인하세요.
          </div>
        </div>
      ) : null}
      <PdfFloatingControls
        page={page}
        pageCount={pageCount}
        zoom={zoom}
        onPageChange={setPage}
        onZoomChange={setZoom}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen((current) => !current)}
        isDownloading={reviewGate?.downloading ?? pdfGenerating}
        variant={controlsAtTop ? "pager" : "full"}
        onDownload={toolbarDownload}
      />
    </div>
  )
}

function EmailForwardInPanel({
  compact = false,
  onImportFiles,
}: {
  compact?: boolean
  onImportFiles?: (files: File[]) => void
}) {
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(
    () =>
      new Set(
        forwardedEmails[0]?.documents.slice(0, 2).map((doc) => doc.id) ?? []
      )
  )
  const [senderFilter, setSenderFilter] = useState("minji@hanbit-trade.com")
  const [dateFilter, setDateFilter] = useState("today")
  const [visibleCount, setVisibleCount] = useState(3)
  const [copiedPanelEmail, setCopiedPanelEmail] = useState(false)
  const senders = Array.from(new Set(forwardedEmails.map((mail) => mail.from)))
  const filteredEmails = forwardedEmails.filter((mail) => {
    const senderMatches = senderFilter === "all" || mail.from === senderFilter
    const dateMatches =
      dateFilter === "all" ||
      dateFilter === "week" ||
      (dateFilter === "yesterday"
        ? mail.received === "어제"
        : mail.received !== "어제")
    return senderMatches && dateMatches
  })
  const orderedEmails = filteredEmails
  const visibleEmails = orderedEmails.slice(0, visibleCount)
  const visibleDocIds = visibleEmails.flatMap((mail) =>
    mail.documents.map((doc) => doc.id)
  )
  const allVisibleSelected =
    visibleDocIds.length > 0 &&
    visibleDocIds.every((id) => selectedDocs.has(id))
  const someVisibleSelected = visibleDocIds.some((id) => selectedDocs.has(id))
  const toggleDoc = (id: string) => {
    setSelectedDocs((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleVisibleDocs = () => {
    setSelectedDocs((current) => {
      const next = new Set(current)
      if (allVisibleSelected) {
        visibleDocIds.forEach((id) => next.delete(id))
      } else {
        visibleDocIds.forEach((id) => next.add(id))
      }
      return next
    })
  }
  const copyPanelEmail = async () => {
    try {
      await navigator.clipboard.writeText("docs+hanbit@ecoya.app")
      setCopiedPanelEmail(true)
      window.setTimeout(() => setCopiedPanelEmail(false), 1200)
    } catch {
      /* clipboard permission may be blocked */
    }
  }

  return (
    <section
      className={cn(
        "rounded-lg border bg-background text-left",
        compact ? "mt-4 p-3" : "p-5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Mail data-icon="inline-start" /> 메일 첨부 수신
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs leading-5 text-muted-foreground">
            <span>docs+hanbit@ecoya.app</span>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-6"
              onClick={copyPanelEmail}
              aria-label="수신 메일주소 복사"
            >
              {copiedPanelEmail ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </Button>
          </div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">
            조직 전용 주소로 메일을 보내면 제목과 첨부파일만 저장됩니다.
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <ToneBadge tone="neutral">메일 {forwardedEmails.length}건</ToneBadge>
          <ToneBadge tone="blue">문서 {forwardedDocumentCount}개</ToneBadge>
        </div>
      </div>

      {compact ? (
        <div className="mt-3 max-h-56 divide-y overflow-y-auto border-y">
          {visibleEmails.slice(0, 2).map((mail) => (
            <div key={mail.id} className="px-1 py-2">
              <div className="grid grid-cols-[minmax(0,.8fr)_auto] gap-2">
                <div className="truncate text-[11px] text-muted-foreground">
                  {mail.received} · {mail.from}
                </div>
                <ToneBadge tone="neutral">{mail.documents.length}개</ToneBadge>
              </div>
              <div className="mt-1 truncate text-xs font-medium">
                {mail.documents.map((doc) => doc.file).join(", ")}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-2 rounded-[var(--r-lg)] bg-[var(--surface-background)] px-3 py-3 shadow-[var(--shadow-section)] ring-1 ring-[var(--surface-border)]">
            <label className="grid gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                수신일자
              </span>
              <AppSelect
                value={dateFilter}
                onValueChange={(value) => {
                  setDateFilter(value)
                  setVisibleCount(3)
                }}
                options={[
                  ["today", "오늘"],
                  ["yesterday", "어제"],
                  ["week", "최근 7일"],
                  ["all", "전체 기간"],
                ]}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                발신자 멤버
              </span>
              <AppSelect
                value={senderFilter}
                onValueChange={(value) => {
                  setSenderFilter(value)
                  setVisibleCount(3)
                }}
                options={[...senders, ["all", "전체 발신자"]]}
              />
            </label>
          </div>
          <div className="flex items-center justify-between px-1 py-3">
            <div className="text-xs text-muted-foreground">
              선택한 문서 {selectedDocs.size}개를 파일 목록에 추가합니다.
            </div>
            <Button
              size="sm"
              disabled={selectedDocs.size === 0}
              onClick={() => {
                const files = forwardedEmails
                  .reduce<Array<{ id: string; file: string; meta: string }>>(
                    (documents, mail) => [...documents, ...mail.documents],
                    []
                  )
                  .filter((document) => selectedDocs.has(document.id))
                  .map(
                    (document) =>
                      new File(["ECOYA mail attachment"], document.file, {
                        type: "application/pdf",
                      })
                  )
                onImportFiles?.(files)
              }}
            >
              선택 문서 가져오기
            </Button>
          </div>
          <Table className="min-w-[520px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[36%] text-left">수신</TableHead>
                <TableHead className="text-left">
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={
                        allVisibleSelected
                          ? true
                          : someVisibleSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={toggleVisibleDocs}
                      aria-label="표시된 문서 전체 선택"
                    />
                    <span>문서</span>
                  </label>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleEmails.map((mail) => (
                <TableRow key={mail.id}>
                  <TableCell className="h-auto min-w-0 py-3 text-left text-xs whitespace-normal text-muted-foreground">
                    <div className="truncate">{mail.received}</div>
                    <div className="mt-1 truncate">{mail.from}</div>
                    <div className="mt-1 truncate text-foreground">
                      {mail.subject}
                    </div>
                  </TableCell>
                  <TableCell className="h-auto min-w-0 p-0 text-left whitespace-normal">
                    <div className="min-w-0 divide-y divide-[var(--table-border)]">
                      {mail.documents.map((doc) => {
                        const checked = selectedDocs.has(doc.id)
                        return (
                          <label
                            key={doc.id}
                            className={cn(
                              "flex cursor-pointer items-center gap-3 px-2 py-2.5 transition",
                              checked
                                ? "bg-[var(--table-row-background-selected)]"
                                : "hover:bg-[var(--table-row-background-hover)]"
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleDoc(doc.id)}
                              aria-label={`${doc.file} 선택`}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">
                                {doc.file}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                {doc.meta}
                              </span>
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-3 border-t border-[var(--table-border)]">
            {visibleEmails.length < orderedEmails.length ? (
              <div className="px-3 py-3 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVisibleCount((count) => count + 3)}
                >
                  더 보기
                </Button>
              </div>
            ) : orderedEmails.length > 0 ? (
              <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                모든 수신 메일을 불러왔습니다.
              </div>
            ) : (
              <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                선택한 발신자의 수신 메일이 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function EmailForwardQueue({
  onClose,
  onImportFiles,
}: {
  onClose: () => void
  onImportFiles: (files: File[]) => void
}) {
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-[min(560px,calc(100vw-24px))] border-l bg-background shadow-2xl">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex h-14 shrink-0 items-center justify-between border-b px-5">
          <div>
            <div className="text-sm font-semibold">수신 메일에서 첨부 선택</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              메일 1개에 포함된 여러 문서를 선택할 수 있습니다.
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <EmailForwardInPanel
            onImportFiles={(files) => {
              onImportFiles(files)
              onClose()
            }}
          />
        </div>
      </div>
    </div>
  )
}

function AiDocumentProcessingNotice() {
  return (
    <details className="group text-xs text-muted-foreground">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-2 gap-y-1 rounded-sm py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <Sparkles className="size-3.5 shrink-0 text-primary" />
        <span>AI 추출값은 원본과 확인한 뒤 확정하세요.</span>
        <span className="ml-auto inline-flex items-center gap-1 text-primary">
          자세히 <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <p className="mt-1 pl-5 leading-5">
        ECOYA는 PDF에서 필드를 읽고 추출하는 데 AI를 사용합니다. 추출값은
        부정확하거나 불완전할 수 있습니다. 확인한 값만 공식 기록이 됩니다.
        법률·세무·관세·재무 자문이 아닙니다.
      </p>
    </details>
  )
}

function DuplicateUploadAlert({
  notice,
  onDismiss,
}: {
  notice: DuplicateUploadNotice
  onDismiss: () => void
}) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="size-4" />
      <AlertTitle className="text-xs">
        {notice.kind === "content" ? "동일한 내용의 문서가 있습니다." : "이미 같은 이름의 문서가 있습니다."}
      </AlertTitle>
      <AlertDescription className="text-[11px] leading-5">
        <span className="font-semibold">{notice.fileName}</span>
        {notice.dealLabel
          ? ` 파일은 ${notice.dealLabel} 거래에 이미 포함되어 있습니다.`
          : " 파일은 이미 업로드되어 있습니다."}
        {notice.kind === "content" ? " 이름을 바꿔도 같은 파일은 다시 올릴 수 없습니다." : " 다른 내용의 파일이라면 이름을 변경해 주세요."}
      </AlertDescription>
      <AlertAction>
        <Button variant="ghost" size="xs" onClick={onDismiss}>
          확인
        </Button>
      </AlertAction>
    </Alert>
  )
}


function UploadActions({
  onUpload,
  onFolder,
  mailOpen,
  onToggleMail,
  compact = false,
  onHero = false,
}: {
  onUpload: () => void
  onFolder: () => void
  mailOpen: boolean
  onToggleMail: () => void
  compact?: boolean
  onHero?: boolean
}) {
  const [copiedInboxEmail, setCopiedInboxEmail] = useState(false)
  const copyInboxEmail = async () => {
    try {
      await navigator.clipboard.writeText("docs+hanbit@ecoya.app")
      setCopiedInboxEmail(true)
      window.setTimeout(() => setCopiedInboxEmail(false), 1200)
    } catch {
      /* clipboard permission may be blocked in some browsers */
    }
  }

  return (
    <div className="mt-3">
      <div className="flex items-center gap-1.5">
        <Button
          variant={mailOpen ? "outline" : "ghost"}
          size={compact ? "sm" : "default"}
          className={cn(onHero && "text-white hover:text-white")}
          onClick={onToggleMail}
        >
          <Mail data-icon="inline-start" /> 이메일에서 찾기
        </Button>
        <Button
          variant="ghost"
          size={compact ? "sm" : "default"}
          className={cn(onHero && "text-white hover:text-white")}
          onClick={onFolder}
        >
          <FileText data-icon="inline-start" /> 폴더
        </Button>
        <div className="flex-1" />
        <Button
          className={cn(
            "ml-auto",
            compact ? "min-w-24" : "min-w-28 shadow-sm sm:min-w-44"
          )}
          size={compact ? "sm" : "default"}
          onClick={onUpload}
        >
          <Upload data-icon="inline-start" /> 파일 올리기
        </Button>
      </div>
      <div
        className={cn(
          "mt-2 flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-left",
          onHero ? "bg-white/10" : "bg-primary/5"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <ToneBadge tone="blue">추천</ToneBadge>
          <span
            className={cn(
              "shrink-0 text-xs font-semibold",
              onHero ? "text-white" : "text-foreground"
            )}
          >
            조직 이메일로 보내기
          </span>
          <span
            className={cn(
              "truncate text-xs",
              onHero ? "text-white/75" : "text-muted-foreground"
            )}
          >
            docs+hanbit@ecoya.app
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn("shrink-0", onHero && "text-white hover:text-white")}
          aria-label="조직 이메일 주소 복사"
          title={copiedInboxEmail ? "복사됨" : "주소 복사"}
          onClick={copyInboxEmail}
        >
          {copiedInboxEmail ? <Check /> : <Copy />}
        </Button>
      </div>
    </div>
  )
}

// Kept as a fallback for older prototype routes while the horizontal tray ships.
function DocumentList({
  documents,
  onFilesSelected,
  selectedIndex,
  onSelect,
  onDelete,
  uploadProgress,
  uploadNotice,
  onCancelUpload,
  className,
}: {
  documents: RecentDocument[]
  onFilesSelected: (files: File[]) => void
  selectedIndex: number
  onSelect: (index: number) => void
  onDelete: (index: number) => void
  uploadProgress: UploadProgressState | null
  uploadNotice: string
  onCancelUpload: () => void
  className?: string
}) {
  const [mailOpen, setMailOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [queueStatus, setQueueStatus] = useState<"ready" | "loading" | "error">(
    "ready"
  )
  const queueRefreshAttemptRef = useRef(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const folderInputRef = useRef<HTMLInputElement | null>(null)
  const acceptFiles = (files: FileList | File[]) =>
    onFilesSelected(Array.from(files))
  const handleDrop = (event: ReactDragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    acceptFiles(event.dataTransfer.files)
  }

  return (
    <aside
      className={cn("flex min-h-0 flex-col border-r bg-sidebar p-6", className)}
    >
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Sparkles data-icon="inline-start" /> AI 파일 올리기
        </div>
        <h1 className="mt-3 text-[28px] leading-tight font-semibold tracking-normal">
          파일을 올리면
          <br />
          필드를 자동으로 추출
        </h1>
      </div>

      <div className="relative mt-8">
        {uploadProgress ? (
          <div className="flex min-h-34 w-full flex-col justify-center rounded-lg border bg-background px-4 py-4">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-semibold">
                <LoaderCircle className="size-4 animate-spin text-primary" />
                파일 업로드 중
              </span>
              <span className="text-muted-foreground">
                {uploadProgress.completed} / {uploadProgress.total}
              </span>
            </div>
            <Progress
              className="mt-3"
              value={(uploadProgress.completed / uploadProgress.total) * 100}
            />
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={onCancelUpload}
            >
              업로드 취소
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            aria-label="여러 PDF 파일 선택 또는 끌어놓기"
            className="relative min-h-34 w-full justify-center gap-3 rounded-lg border border-dashed border-input bg-background px-4 text-left font-normal hover:border-primary hover:bg-primary/5"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <Upload className="text-primary" data-icon="inline-start" />
            <span>
              <span className="block text-sm font-semibold">
                여러 파일 선택 또는 끌어놓기
              </span>
              <span className="text-xs text-muted-foreground">
                PDF 최대 {TRADE_DOCUMENT_MAX_UPLOAD_FILES}개 동시 업로드 ·
                파일당 {TRADE_DOCUMENT_MAX_UPLOAD_MB}MB
              </span>
            </span>
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files) acceptFiles(event.target.files)
            event.target.value = ""
          }}
        />
        <input
          ref={(node) => {
            folderInputRef.current = node
            node?.setAttribute("webkitdirectory", "")
            node?.setAttribute("directory", "")
          }}
          type="file"
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files) {
              onFilesSelected(Array.from(event.target.files))
            }
            event.target.value = ""
          }}
        />
        {uploadNotice ? (
          <div className="mt-3 rounded-md border border-warning/30 bg-warning/8 px-3 py-2 text-xs leading-5 text-warning">
            {uploadNotice}
          </div>
        ) : null}
        <UploadActions
          onUpload={() => fileInputRef.current?.click()}
          onFolder={() => folderInputRef.current?.click()}
          mailOpen={mailOpen}
          onToggleMail={() => setMailOpen((value) => !value)}
          compact
        />
        {mailOpen ? (
          <EmailForwardQueue
            onClose={() => setMailOpen(false)}
            onImportFiles={onFilesSelected}
          />
        ) : null}
      </div>

      <div className="mt-8 flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-muted-foreground">
            최근 파일
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="최근 파일 새로고침"
            disabled={queueStatus === "loading"}
            onClick={() => {
              setQueueStatus("loading")
              window.setTimeout(() => {
                queueRefreshAttemptRef.current += 1
                setQueueStatus(
                  queueRefreshAttemptRef.current === 1 ? "error" : "ready"
                )
              }, 600)
            }}
          >
            <RefreshCw
              className={cn(
                "size-3.5",
                queueStatus === "loading" && "animate-spin"
              )}
            />
          </Button>
        </div>
        {queueStatus === "error" ? (
          <div className="mt-3 rounded-md border border-warning/30 bg-background p-3 text-xs">
            <div className="font-semibold">
              최근 파일을 불러오지 못했습니다.
            </div>
            <div className="mt-1 leading-5 text-muted-foreground">
              새 파일 업로드는 계속 사용할 수 있습니다.
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={() => {
                setQueueStatus("loading")
                window.setTimeout(() => setQueueStatus("ready"), 600)
              }}
            >
              <RefreshCw data-icon="inline-start" /> 다시 시도
            </Button>
          </div>
        ) : (
          <div className="field-scrollbar mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {documents.map((document, index) => (
              <div
                key={document.name}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(index)}
                className={cn(
                  "group relative grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-md border border-transparent px-3 py-3 text-left transition hover:bg-background focus-visible:bg-background focus-visible:outline-none",
                  selectedIndex === index &&
                    "border-primary/40 bg-primary/8 pl-4 shadow-sm before:absolute before:top-2 before:bottom-2 before:left-1 before:w-1 before:rounded-full before:bg-primary"
                )}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onSelect(index)
                  }
                }}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {document.name}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {document.uploadedAt}
                    {document.pages ? ` · ${document.pages}p` : ""}
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  {selectedIndex === index ? (
                    <ToneBadge tone="blue">선택됨</ToneBadge>
                  ) : null}
                  <span className="transition group-hover:opacity-0">
                    <ToneBadge tone={document.tone}>
                      {document.status}
                    </ToneBadge>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground"
                    aria-label={`${document.name} 메뉴`}
                    onClick={(event) => {
                      event.stopPropagation()
                      setOpenMenu(
                        openMenu === document.name ? null : document.name
                      )
                    }}
                  >
                    <MoreVertical data-icon="inline-start" />
                  </Button>
                </span>
                {openMenu === document.name ? (
                  <div className="absolute top-10 right-2 z-10 min-w-28 rounded-md border bg-background p-1 shadow-lg">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-auto w-full justify-start px-2 py-1.5"
                      onClick={(event) => {
                        event.stopPropagation()
                        setOpenMenu(null)
                        setDeleteTarget(index)
                      }}
                    >
                      <Trash2 className="size-3.5" /> 삭제
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>최근 파일에서 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 현재 목록에서 파일과 추출 결과를 함께 제거합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTarget !== null) onDelete(deleteTarget)
                setDeleteTarget(null)
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  )
}

type DocumentTrayFilter = "all" | "processing" | "review" | "failed" | "confirmed"
type DocumentQueueSort = "recent" | "oldest"

function matchesDocumentQueueStatus(
  document: RecentDocument,
  filter: DocumentTrayFilter
) {
  if (filter === "all") return true
  if (filter === "confirmed") return document.stage === "confirmed"
  if (filter === "processing") return ["ocr", "queued"].includes(document.stage)
  if (filter === "review")
    return ["field", "duplicate"].includes(document.stage)
  return ["failed", "excluded"].includes(document.stage)
}

function uploadDocumentTypeLabel(documentType: UploadDocumentType) {
  if (documentType === "UNK") return "유형 확인 필요"
  if (documentType === "OTHER") return "기타 문서"
  return (
    manualUploadDocumentTypeOptions.find(
      (option) => option.value === documentType
    )?.label ?? documentType
  )
}

function uploadDocumentTypeCode(documentType: UploadDocumentType) {
  const compactCodes: Partial<Record<UploadDocumentType, string>> = {
    UNK: "?",
    OTHER: "기타",
    CUSTOMS_ENTRY: "CE",
    BANK_STATEMENT: "BS",
    FREIGHT_INVOICE: "FI",
    CUSTOMS_DECLARATION: "CD",
    INSURANCE_CERTIFICATE: "INS",
  }
  return compactCodes[documentType] ?? documentType
}

function UploadDocumentTypeMark({
  documentType,
  pages,
  className,
}: {
  documentType: UploadDocumentType
  pages?: number
  className?: string
}) {
  const unresolved = documentType === "UNK"
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 flex-col items-center justify-center rounded-[var(--r-sm)] border bg-[var(--surface-background)] text-primary",
        unresolved && "border-dashed text-[var(--surface-muted-foreground)]",
        className
      )}
      title={uploadDocumentTypeLabel(documentType)}
      aria-label={`문서 유형 ${uploadDocumentTypeLabel(documentType)}`}
    >
      <span className="text-[9px] leading-none font-bold tracking-wide">
        {uploadDocumentTypeCode(documentType)}
      </span>
      {pages ? (
        <span className="mt-1 text-[8px] leading-none text-[var(--surface-muted-foreground)]">
          {pages}p
        </span>
      ) : null}
    </span>
  )
}

function HorizontalDocumentTray({
  documents,
  selectedIndex,
  onSelect,
  onDelete,
  onFilesSelected,
  uploadProgress,
  uploadNotice,
  duplicateUploadNotice,
  onDismissDuplicateUpload,
  onCancelUpload,
  expanded,
  onExpandedChange,
}: {
  documents: RecentDocument[]
  selectedIndex: number
  onSelect: (index: number) => void
  onDelete: (index: number) => void
  onFilesSelected: (files: File[]) => void
  uploadProgress: UploadProgressState | null
  uploadNotice: string
  duplicateUploadNotice: DuplicateUploadNotice | null
  onDismissDuplicateUpload: () => void
  onCancelUpload: () => void
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
}) {
  const fileDropZoneRef = useRef<FileDropZoneRef | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const folderInputRef = useRef<HTMLInputElement | null>(null)
  const queueDragDepthRef = useRef(0)
  const [mailOpen, setMailOpen] = useState(false)
  const [addPanelOpen, setAddPanelOpen] = useState(false)
  const [queueDragActive, setQueueDragActive] = useState(false)
  const [filter, setFilter] = useState<DocumentTrayFilter>("all")
  const [typeFilter, setTypeFilter] = useState<UploadDocumentType | "all">(
    "all"
  )
  const [sort, setSort] = useState<DocumentQueueSort>("recent")
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [cancelUploadOpen, setCancelUploadOpen] = useState(false)
  const selectedDocument = documents[selectedIndex] ?? documents[0]
  const processingCount = documents.filter((document) =>
    ["ocr", "queued"].includes(document.stage)
  ).length
  const reviewCount = documents.filter((document) =>
    ["field", "duplicate"].includes(document.stage)
  ).length
  const failedCount = documents.filter((document) =>
    ["failed", "excluded"].includes(document.stage)
  ).length
  const availableDocumentTypes = Array.from(
    new Set(documents.map((document) => document.documentType))
  )
  const filteredDocuments = documents
    .map((document, index) => ({ document, index }))
    .filter(
      ({ document }) =>
        matchesDocumentQueueStatus(document, filter) &&
        (typeFilter === "all" || document.documentType === typeFilter)
    )
    .sort(({ document: left }, { document: right }) =>
      sort === "recent"
        ? right.uploadedAt.localeCompare(left.uploadedAt)
        : left.uploadedAt.localeCompare(right.uploadedAt)
    )

  const handleExpandedChange = (nextExpanded: boolean) => {
    if (!nextExpanded) setAddPanelOpen(false)
    onExpandedChange(nextExpanded)
  }

  const acceptFiles = (files: File[]) => {
    if (files.length === 0 || uploadProgress) return
    handleExpandedChange(true)
    setAddPanelOpen(false)
    onFilesSelected(files)
  }
  const handleQueueDragEnter = (event: ReactDragEvent<HTMLDivElement>) => {
    if (
      documents.length === 0 ||
      uploadProgress ||
      !event.dataTransfer.types.includes("Files")
    )
      return
    event.preventDefault()
    queueDragDepthRef.current += 1
    setQueueDragActive(true)
  }
  const handleQueueDragOver = (event: ReactDragEvent<HTMLDivElement>) => {
    if (
      documents.length === 0 ||
      uploadProgress ||
      !event.dataTransfer.types.includes("Files")
    )
      return
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }
  const handleQueueDragLeave = (event: ReactDragEvent<HTMLDivElement>) => {
    if (documents.length === 0) return
    event.preventDefault()
    queueDragDepthRef.current = Math.max(queueDragDepthRef.current - 1, 0)
    if (queueDragDepthRef.current === 0) setQueueDragActive(false)
  }
  const handleQueueDrop = (event: ReactDragEvent<HTMLDivElement>) => {
    if (documents.length === 0 || uploadProgress) return
    event.preventDefault()
    queueDragDepthRef.current = 0
    setQueueDragActive(false)
    acceptFiles(Array.from(event.dataTransfer.files))
  }

  return (
    <Card
      onDragEnter={handleQueueDragEnter}
      onDragOver={handleQueueDragOver}
      onDragLeave={handleQueueDragLeave}
      onDrop={handleQueueDrop}
      className={cn(
        "shrink-0 transition-[box-shadow,background-color]",
        expanded && "ring-[var(--control-selected-border)]",
        queueDragActive &&
          "bg-[var(--control-selected-soft-background)] ring-2 ring-[var(--control-selected-border)]"
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label="검토·배정 대기 문서 목록"
        aria-expanded={expanded}
        className="flex min-h-14 cursor-pointer items-center gap-2 p-2 outline-none hover:bg-muted/20 focus-visible:[box-shadow:var(--shadow-keyboard-focus)]"
        onClick={() => handleExpandedChange(!expanded)}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            handleExpandedChange(!expanded)
          }
        }}
      >
        <div
          className={cn(
            "flex h-11 min-w-48 items-center justify-between rounded-[var(--r-md)] px-3 text-primary",
            expanded && "bg-[var(--button-secondary-background)]"
          )}
        >
          <span className="font-semibold">검토·배정 대기 문서</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {documents.length}
          </span>
          {expanded ? <ChevronUp /> : <ChevronDown />}
        </div>

        {selectedDocument ? (
          <Item
            variant="outline"
            size="xs"
            role="button"
            tabIndex={0}
            aria-label={`${selectedDocument.name} 문서 목록 ${expanded ? "닫기" : "열기"}`}
            className="h-11 min-w-0 flex-1 cursor-pointer flex-nowrap border-[var(--control-selected-border)] bg-[var(--control-selected-soft-background)] text-left sm:max-w-[460px]"
            onClick={(event) => {
              event.stopPropagation()
              handleExpandedChange(!expanded)
            }}
            onKeyDown={(event) => {
              event.stopPropagation()
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                handleExpandedChange(!expanded)
              }
            }}
          >
            <ItemMedia className="shrink-0">
              <UploadDocumentTypeMark
                documentType={selectedDocument.documentType}
                pages={selectedDocument.pages}
                className="size-8"
              />
            </ItemMedia>
            <ItemContent className="min-w-0 gap-0">
              <ItemTitle className="block truncate text-xs font-semibold">
                {selectedDocument.name}
              </ItemTitle>
              <ItemDescription className="mt-0.5 block truncate text-[11px]">
                {uploadDocumentTypeLabel(selectedDocument.documentType)} ·{" "}
                {selectedIndex + 1} / {documents.length}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <ToneBadge tone={selectedDocument.tone}>
                {selectedDocument.status}
              </ToneBadge>
            </ItemActions>
          </Item>
        ) : null}

        <div className="ml-auto hidden h-11 items-center gap-3 rounded-[var(--r-md)] border border-[var(--surface-border)] px-4 text-[11px] lg:flex">
          <span className="font-semibold">오늘 처리할 서류</span>
          <span className="text-[var(--surface-muted-foreground)]">
            확인 대기 {reviewCount}
          </span>
          <span className="text-[var(--color-blue-2)]">
            AI 분석 중 {processingCount}
          </span>
          <span className="text-[var(--color-red-2)]">
            재업로드 필요 {failedCount}
          </span>
        </div>

        <div
          className="flex shrink-0 items-center gap-2"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <DropdownMenu
            onOpenChange={(open) => {
              if (open) {
                handleExpandedChange(true)
                setAddPanelOpen(true)
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                aria-label="파일 추가 메뉴"
                onClick={() => {
                  handleExpandedChange(true)
                  setAddPanelOpen(true)
                }}
              >
                <FilePlus2 data-icon="inline-start" />
                파일 추가
                <ChevronDown data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem
                onSelect={() => {
                  handleExpandedChange(true)
                  setAddPanelOpen(false)
                  setMailOpen(true)
                }}
              >
                <Mail /> 이메일에서 찾기
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  handleExpandedChange(true)
                  setAddPanelOpen(false)
                  folderInputRef.current?.click()
                }}
              >
                <FileText /> 폴더 선택
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  handleExpandedChange(true)
                  setAddPanelOpen(false)
                  fileInputRef.current?.click()
                }}
              >
                <Upload /> 파일 선택
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {expanded ? (
        <CardContent className="border-t border-[var(--surface-border)] bg-[var(--surface-muted-background)] p-2.5">
          <div className="mb-2 grid gap-2">
            {duplicateUploadNotice ? (
              <DuplicateUploadAlert
                notice={duplicateUploadNotice}
                onDismiss={onDismissDuplicateUpload}
              />
            ) : null}
          </div>
          {documents.length === 0 ? (
            <FileDropZone
              ref={fileDropZoneRef}
              accept="application/pdf,.pdf"
              multiple
              clickToSelect={!uploadProgress}
              label="새 파일 추가"
              instructions={`PDF를 선택하거나 이 영역에 끌어놓기 · 최대 ${TRADE_DOCUMENT_MAX_UPLOAD_FILES}개 · 파일당 ${TRADE_DOCUMENT_MAX_UPLOAD_MB}MB`}
              onFiles={(files) => {
                if (!uploadProgress) acceptFiles(files)
              }}
              className="min-h-32 flex-row justify-start gap-3 px-4 py-5 text-left"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--r-md)] border border-[var(--surface-border)] bg-[var(--surface-background)] text-[var(--file-drop-foreground)]">
                {uploadProgress ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <Upload />
                )}
              </span>
              <span className="min-w-0 text-[var(--surface-foreground)]">
                <span className="block text-xs font-semibold">
                  {uploadProgress ? "파일 업로드 중" : "새 파일 추가"}
                </span>
                <span className="mt-1 block text-[11px] text-[var(--surface-muted-foreground)]">
                  PDF를 선택하거나 이 영역에 끌어놓기 · 최대
                  {` ${TRADE_DOCUMENT_MAX_UPLOAD_FILES}개 · 파일당 ${TRADE_DOCUMENT_MAX_UPLOAD_MB}MB`}
                </span>
              </span>
              {uploadProgress ? (
                <span className="ml-auto flex min-w-44 items-center gap-2 text-[11px] font-medium text-[var(--file-drop-foreground)]">
                  <LabeledProgress
                    width={96}
                    showPercentage={false}
                    aria-label="파일 업로드 진행률"
                    value={
                      (uploadProgress.completed / uploadProgress.total) * 100
                    }
                  />
                  {uploadProgress.completed}/{uploadProgress.total}
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={(event) => {
                      event.stopPropagation()
                      setCancelUploadOpen(true)
                    }}
                  >
                    취소
                  </Button>
                </span>
              ) : (
                <span className="ml-auto flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="이메일에서 문서 찾기"
                    onClick={(event) => {
                      event.stopPropagation()
                      setMailOpen(true)
                    }}
                  >
                    <Mail data-icon="inline-start" />
                    <span className="hidden lg:inline">이메일에서 찾기</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="폴더에서 PDF 선택"
                    onClick={(event) => {
                      event.stopPropagation()
                      folderInputRef.current?.click()
                    }}
                  >
                    <FileText data-icon="inline-start" />
                    <span className="hidden lg:inline">폴더 선택</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="PDF 파일 선택"
                    onClick={(event) => {
                      event.stopPropagation()
                      fileDropZoneRef.current?.open()
                    }}
                  >
                    <Upload data-icon="inline-start" />
                    <span className="hidden lg:inline">파일 선택</span>
                  </Button>
                </span>
              )}
            </FileDropZone>
          ) : addPanelOpen && !uploadProgress ? (
            <FileDropZone
              ref={fileDropZoneRef}
              accept="application/pdf,.pdf"
              multiple
              label="파일을 끌어놓아 추가"
              instructions={`PDF 최대 ${TRADE_DOCUMENT_MAX_UPLOAD_FILES}개 · 파일당 ${TRADE_DOCUMENT_MAX_UPLOAD_MB}MB`}
              onFiles={acceptFiles}
              className="min-h-16 flex-row justify-start gap-3 px-4 py-3 text-left"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--r-md)] border border-[var(--surface-border)] bg-[var(--surface-background)] text-[var(--file-drop-foreground)]">
                <Upload />
              </span>
              <span className="min-w-0 text-[var(--surface-foreground)]">
                <span className="block text-xs font-semibold">
                  파일을 끌어놓아 추가
                </span>
                <span className="mt-1 block text-[11px] text-[var(--surface-muted-foreground)]">
                  PDF 최대 {TRADE_DOCUMENT_MAX_UPLOAD_FILES}개 · 파일당{" "}
                  {TRADE_DOCUMENT_MAX_UPLOAD_MB}MB
                </span>
              </span>
              <span className="ml-auto flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation()
                    fileDropZoneRef.current?.open()
                  }}
                >
                  파일 선택
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="파일 추가 영역 닫기"
                  onClick={(event) => {
                    event.stopPropagation()
                    setAddPanelOpen(false)
                  }}
                >
                  <X />
                </Button>
              </span>
            </FileDropZone>
          ) : uploadProgress ? (
            <div className="flex min-h-11 items-center gap-3 rounded-[var(--r-md)] border border-[var(--surface-border)] bg-[var(--surface-background)] px-3 py-2 text-xs">
              <LoaderCircle className="size-4 animate-spin text-primary" />
              <span className="font-medium">파일 업로드 중</span>
              <LabeledProgress
                width={112}
                showPercentage={false}
                aria-label="파일 업로드 진행률"
                value={(uploadProgress.completed / uploadProgress.total) * 100}
              />
              <span className="text-muted-foreground tabular-nums">
                {uploadProgress.completed}/{uploadProgress.total}
              </span>
              <Button
                variant="ghost"
                size="xs"
                className="ml-auto"
                onClick={() => setCancelUploadOpen(true)}
              >
                취소
              </Button>
            </div>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            hidden
            onChange={(event) => {
              if (!uploadProgress && event.target.files) {
                acceptFiles(Array.from(event.target.files))
              }
              event.target.value = ""
            }}
          />
          <input
            ref={(node) => {
              folderInputRef.current = node
              node?.setAttribute("webkitdirectory", "")
              node?.setAttribute("directory", "")
            }}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            hidden
            onChange={(event) => {
              if (!uploadProgress && event.target.files) {
                acceptFiles(Array.from(event.target.files))
              }
              event.target.value = ""
            }}
          />

          {mailOpen ? (
            <EmailForwardQueue
              onClose={() => setMailOpen(false)}
              onImportFiles={acceptFiles}
            />
          ) : null}

          {uploadNotice ? (
            <Alert className="mt-2" variant="default">
              <AlertDescription className="text-xs">
                {uploadNotice}
              </AlertDescription>
            </Alert>
          ) : null}

          {documents.length > 0 ? (
            <>
              <div className="mt-2.5 flex flex-wrap items-center gap-2 px-1">
                <div className="mr-2 text-xs font-semibold">
                  검토·배정 대기 문서{" "}
                  <span className="ml-1 font-normal text-muted-foreground">
                    {documents.length}개
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  PDF를 이 목록에 끌어놓아 추가
                </span>
                <BusinessListToolbar aria-label="대기 문서 필터">
                  <BusinessFilterField label="상태">
                  <Select
                    value={filter}
                    onValueChange={(value) =>
                      setFilter(value as DocumentTrayFilter)
                    }
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-32"
                      aria-label="상태 필터"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="processing">처리 중</SelectItem>
                      <SelectItem value="review">확인 필요</SelectItem>
                      <SelectItem value="failed">처리 실패</SelectItem>
                    </SelectContent>
                  </Select>
                  </BusinessFilterField>
                  <BusinessFilterField label="문서 유형">
                  <Select
                    value={typeFilter}
                    onValueChange={(value) =>
                      setTypeFilter(value as UploadDocumentType | "all")
                    }
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-40"
                      aria-label="문서 유형 필터"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="all">전체</SelectItem>
                      {availableDocumentTypes.map((documentType) => (
                        <SelectItem key={documentType} value={documentType}>
                          {uploadDocumentTypeLabel(documentType)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  </BusinessFilterField>
                  <BusinessFilterField label="정렬">
                  <Select
                    value={sort}
                    onValueChange={(value) =>
                      setSort(value as DocumentQueueSort)
                    }
                  >
                    <SelectTrigger size="sm" className="w-40" aria-label="정렬">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="recent">최근 업로드 순</SelectItem>
                      <SelectItem value="oldest">오래된 업로드 순</SelectItem>
                    </SelectContent>
                  </Select>
                  </BusinessFilterField>
                </BusinessListToolbar>
              </div>

              <div className="field-scrollbar mt-2 max-h-52 overflow-auto rounded-[var(--r-md)] ring-1 ring-[var(--table-border)]">
                <Table className="min-w-[780px]">
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="w-11" />
                      <TableHead className="min-w-[180px] text-left!">
                        문서 유형
                      </TableHead>
                      <TableHead className="min-w-[220px] text-left!">
                        파일
                      </TableHead>
                      <TableHead className="min-w-[140px] text-left!">
                        등록일자
                      </TableHead>
                      <TableHead className="w-[120px] text-left!">
                        상태
                      </TableHead>
                      <TableHead className="w-[72px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map(({ document, index }) => (
                      <TableRow
                        key={`${document.name}-${index}`}
                        data-clickable="true"
                        data-state={
                          selectedIndex === index ? "selected" : undefined
                        }
                        tabIndex={0}
                        className="cursor-pointer outline-none focus-visible:[box-shadow:var(--shadow-keyboard-focus)]"
                        onClick={() => {
                          setAddPanelOpen(false)
                          onSelect(index)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            setAddPanelOpen(false)
                            onSelect(index)
                          }
                        }}
                      >
                        <TableCell className="py-2 text-[var(--surface-muted-foreground)] tabular-nums">
                          {String(index + 1).padStart(2, "0")}
                        </TableCell>
                        <TableCell className="py-2 text-left!">
                          <span className="flex min-w-0 items-center gap-2">
                            <UploadDocumentTypeMark
                              documentType={document.documentType}
                              pages={document.pages}
                            />
                            <span className="truncate text-xs font-semibold">
                              {uploadDocumentTypeLabel(document.documentType)}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="truncate py-2 text-left! font-medium">
                          {document.name}
                        </TableCell>
                        <TableCell className="max-w-[240px] truncate py-2 text-left! text-[var(--surface-muted-foreground)]">
                          {document.uploadedAt}
                        </TableCell>
                        <TableCell className="py-2 text-left!">
                          <ToneBadge tone={document.tone}>
                            {document.status}
                          </ToneBadge>
                        </TableCell>
                        <TableCell className="relative py-2 text-right!">
                          <span className="flex items-center justify-end gap-1">
                            {selectedIndex === index ? (
                              <Check className="size-4 text-[var(--color-primary-4)]" />
                            ) : null}
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label={`${document.name} 메뉴`}
                              onClick={(event) => {
                                event.stopPropagation()
                                setOpenMenu(
                                  openMenu === document.name
                                    ? null
                                    : document.name
                                )
                              }}
                            >
                              <MoreVertical />
                            </Button>
                          </span>
                          {openMenu === document.name ? (
                            <span className="absolute top-8 right-2 z-[var(--z-dropdown)] min-w-24 rounded-[var(--r-md)] border border-[var(--surface-border)] bg-[var(--surface-background)] p-1 shadow-[var(--shadow-filter)]">
                              <Button
                                variant="destructive"
                                size="xs"
                                className="w-full justify-start"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  setOpenMenu(null)
                                  setDeleteTarget(index)
                                }}
                              >
                                <Trash2 /> 삭제
                              </Button>
                            </span>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredDocuments.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-8 text-center! text-xs text-[var(--surface-muted-foreground)]"
                        >
                          조건에 맞는 파일이 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : null}
        </CardContent>
      ) : null}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>문서를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제하면 큐에서 제거되며, 복구할 수 없습니다. 필요하면 다시
              업로드해 주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTarget !== null) onDelete(deleteTarget)
                setDeleteTarget(null)
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={cancelUploadOpen} onOpenChange={setCancelUploadOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>업로드를 중단할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              완료된 {uploadProgress?.completed ?? 0}개 파일은 큐에 남습니다.
              나머지
              {` ${Math.max(
                (uploadProgress?.total ?? 0) - (uploadProgress?.completed ?? 0),
                0
              )}개는 취소됩니다.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>계속 업로드</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setCancelUploadOpen(false)
                onCancelUpload()
              }}
            >
              중단
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function InboxScreen({
  onOpenDeal,
  initialDocumentName,
  initialStep,
  onDocumentOpen,
  linkedDealsByDocument,
  onDocumentDealLinked,
}: {
  onOpenDeal: (dealId: string) => void
  initialDocumentName?: string
  initialStep?: UploadDetailStep
  onDocumentOpen?: (
    documentName: string | null,
    step?: UploadDetailStep
  ) => void
  linkedDealsByDocument: UploadDocumentDealLinks
  onDocumentDealLinked: (
    documentName: string,
    link: UploadDocumentDealLink
  ) => void
}) {
  const initialUploadDocuments: RecentDocument[] = readUploadQueue().map(
    (document) => {
      document = { ...document, reviewedFields: readDocumentReview(document.name).fields }
      const link = linkedDealsByDocument[document.name]
      const opensConnectedStep =
        initialStep === "deal" && document.name === initialDocumentName
      return link
        ? {
            ...document,
            dealLabel: link.dealLabel,
            pdfReviewCompleted: true,
            stage: "confirmed",
            status: "거래 연결 완료",
            tone: "success",
          }
        : opensConnectedStep
          ? {
              ...document,
              pdfReviewCompleted: true,
              status: "거래 연결 필요",
              tone: "warning",
            }
          : document
    }
  )
  const initialDocumentIndex = initialDocumentName
    ? initialUploadDocuments.findIndex(
        (document) => document.name === initialDocumentName
      )
    : -1
  const initialSelectedDocument =
    initialUploadDocuments[initialDocumentIndex] ?? initialUploadDocuments[0]
  const [hasFile, setHasFile] = useState(initialDocumentIndex >= 0)
  const [step, setStep] = useState<UploadDetailStep>(
    () =>
      initialStep ??
      (initialSelectedDocument?.pdfReviewCompleted ? "deal" : "compare")
  )
  const [selectedIndex, setSelectedIndex] = useState(
    initialDocumentIndex >= 0 ? initialDocumentIndex : 0
  )
  const [uploadDocuments, setUploadDocuments] = useState<RecentDocument[]>(
    () => initialUploadDocuments
  )
  useEffect(() => {
    try { localStorage.setItem(UPLOAD_QUEUE_STORAGE_KEY, JSON.stringify(uploadDocuments)); localStorage.setItem(UPLOAD_STATUS_SEEDS_KEY, "applied") } catch { /* Current session remains usable. */ }
  }, [uploadDocuments])
  const [autoSaving, setAutoSaving] = useState(false)
  const [autoSavePending, setAutoSavePending] = useState(false)
  const [autoSaveError, setAutoSaveError] = useState(false)
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState(() => new Date())
  const [linkingDocument, setLinkingDocument] = useState(false)
  const [downloadingDraft, setDownloadingDraft] = useState(false)

  const [uploadProgress, setUploadProgress] =
    useState<UploadProgressState | null>(null)
  const [uploadNotice, setUploadNotice] = useState("")
  const [duplicateUploadNotice, setDuplicateUploadNotice] =
    useState<DuplicateUploadNotice | null>(null)
  const [fileTrayOpen, setFileTrayOpen] = useState(false)
  const [dealActionTarget, setDealActionTarget] =
    useState<HTMLSpanElement | null>(null)
  const [mobilePane, setMobilePane] = useState<"fields" | "preview">("fields")
  const autoSaveVersionRef = useRef(0)
  const autoSavePendingRef = useRef(false)
  const uploadTimerRef = useRef<number | null>(null)
  const uploadPreparingRef = useRef(false)
  const activeUploadDocumentNamesRef = useRef<string[]>([])
  const activeUploadCompletedRef = useRef(0)
  const uploadOriginRef = useRef({
    hasFile: false,
    selectedDocumentName: null as string | null,
  })
  // Route changes inside the upload workspace must keep its queue and timers.
  const previousUploadRoute = useRef({ initialDocumentName, initialStep })
  useEffect(() => {
    const previous = previousUploadRoute.current
    if (
      previous.initialDocumentName === initialDocumentName &&
      previous.initialStep === initialStep
    ) return
    previousUploadRoute.current = { initialDocumentName, initialStep }
    const index = uploadDocuments.findIndex(
      (document) => document.name === initialDocumentName
    )
    setHasFile(index >= 0)
    if (index < 0) return
    // A new URL resets the active document while preserving the mounted upload queue.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(index)
    autoSaveVersionRef.current += 1
    autoSavePendingRef.current = false
    setAutoSaving(false)
    setAutoSavePending(false)
    setAutoSaveError(false)
    setStep(initialStep ?? "compare")
    setMobilePane("fields")
  }, [initialDocumentName, initialStep, uploadDocuments])
  const selectedDocument = uploadDocuments[selectedIndex] ?? uploadDocuments[0] ?? recentDocuments[0]
  const selectedDocumentRef = useRef(selectedDocument)
  useEffect(() => { selectedDocumentRef.current = selectedDocument }, [selectedDocument])
  const handleReviewedFieldChange = (key: string, patch: Partial<ReviewedField>) => {
    const document = selectedDocumentRef.current
    const original = reviewFieldsForDocument(document.documentType).find((field) => field.key === key)
    const current = document.reviewedFields?.[key] ?? { value: original?.value ?? "", unit: original?.unit }
    const next = { ...document, pdfReviewCompleted: false, reviewedFields: { ...document.reviewedFields, [key]: { ...current, ...patch } } }
    selectedDocumentRef.current = next
    setUploadDocuments((documents) => documents.map((item) => item.name === document.name ? next : item))
  }
  const currentReviewFields = resolvedReviewFields(selectedDocument)
  const uploadFieldErrors = currentReviewFields.flatMap((field) => {
    const missing = field.required && !field.value.trim()
    const invalid = field.value.trim()
      && (field.kind === "money" || field.kind === "number" || ["quantity", "unit_price", "total_amount", "gross_weight", "net_weight"].includes(field.key))
      && (decimalMagnitude(normalizeDecimalInput(field.value), FINANCE_DECIMAL_SCALE) ?? BigInt(-1)) < BigInt(0)
    return missing || invalid || field.tone === "danger" ? [{ key: field.key, label: `${field.label} · ${missing ? "필수값 누락" : invalid ? "0 이상의 숫자를 입력하세요" : field.status}` }] : []
  })
  const etd = currentReviewFields.find((field) => field.key === "etd")?.value
  const eta = currentReviewFields.find((field) => field.key === "eta")?.value
  const pendingUploadDocuments = uploadDocuments
    .map((document, index) => ({ document, index }))
    .filter(({ document }) => document.stage !== "confirmed")
  const pendingSelectedIndex = Math.max(
    0,
    pendingUploadDocuments.findIndex(({ index }) => index === selectedIndex)
  )
  const isTypeUnresolved = isUploadDocumentTypeUnresolved(selectedDocument)
  const pdfReviewCompleted =
    selectedDocument.pdfReviewCompleted === true ||
    selectedDocument.stage === "confirmed"
  const linkedDealLabel = selectedDocument.dealLabel ?? null
  const isDealBlocked = isTypeUnresolved || uploadFieldErrors.length > 0
    || Boolean(etd && eta && eta < etd) || autoSaving || autoSavePending || autoSaveError
    || !["field", "confirmed"].includes(selectedDocument.stage)

  const openUploadRequirement = (key?: string) => {
    setStep("compare")
    onDocumentOpen?.(selectedDocument.name, "compare")
    setMobilePane("fields")
    focusDocumentRequirement(key ? `[data-upload-field="${key}"]` : '[aria-label="항목 점검"]')
  }
  const uploadErrors: DocumentBlockingIssue[] = [
    ...uploadFieldErrors.map((field) => ({ ...field, onSelect: () => openUploadRequirement(field.key) })),
    ...(etd && eta && eta < etd ? [{ key: "dates", label: "ETA · ETD보다 빠를 수 없습니다", onSelect: () => openUploadRequirement("eta") }] : []),
    ...(autoSaveError ? [{ key: "save", label: "변경사항 저장 실패 · 다시 저장", onSelect: () => { void handleAutoSave("retry") } }] : []),
    ...(selectedDocument.stage === "failed" ? [{ key: "extract", label: "문서 추출 실패", onSelect: () => openUploadRequirement() }] : []),
  ]
  const uploadChecks: DocumentBlockingIssue[] = isTypeUnresolved
    ? [{ key: "type", label: "문서 유형 선택", onSelect: () => openUploadRequirement() }]
    : selectedDocument.stage === "duplicate"
      ? [{ key: "duplicate", label: "중복 문서 확인", onSelect: () => openUploadRequirement() }]
      : []

  const handlePdfReviewComplete = () => {
    if (isDealBlocked) return
    setUploadDocuments((current) =>
      current.map((document, index) =>
        index === selectedIndex
          ? {
              ...document,
              pdfReviewCompleted: true,
              status: document.dealLabel ? "거래 연결 완료" : "거래 연결 필요",
              tone: document.dealLabel ? "success" : "warning",
            }
          : document
      )
    )
    setStep("deal")
    onDocumentOpen?.(selectedDocument.name, "deal")
    setMobilePane("fields")
    toast.success("연결할 거래를 선택해 주세요.")
  }
  const handleDealLink = async (dealId: string, dealLabel: string, bankCash?: Omit<BankCashInput, "sourceDocumentId" | "idempotencyKey">) => {
    if (linkingDocument || isDealBlocked) return false
    const documentName = selectedDocument.name
    setLinkingDocument(true)
    try {
      const result = await prototypeBackend.tradeDocuments.confirmTransition({
        id: documentName, dealId, documentType: selectedDocument.documentType,
        expectedRevision: readDocumentReview(documentName).revision,
        idempotencyKey: crypto.randomUUID(),
      })
      if (!result.ok) { toast.error(result.error); return false }
      onDocumentDealLinked(documentName, { dealId, dealLabel })
      setUploadDocuments((current) => current.map((document) => document.name === documentName
        ? { ...document, dealLabel, stage: "confirmed", status: "거래 연결 완료", tone: "success" }
        : document))
      if (bankCash) {
        const payment = await prototypeBackend.tradeDocuments.recordBankCash({ ...bankCash,
          sourceDocumentId: documentName, idempotencyKey: crypto.randomUUID() })
        if (!payment.ok) {
          toast.error(`문서는 확정되었습니다. 현금 기록 실패: ${payment.error} 정산에서 이어서 처리해 주세요.`, { duration: 10000 })
        } else {
          toast.success("문서 확정과 현금 기록을 완료했습니다.")
        }
      } else {
        toast.success(selectedDocument.documentType === "BANK_STATEMENT"
          ? "서류만 연결했습니다. 현금은 정산에서 기록해 주세요." : "거래 연결을 완료했습니다.")
      }
      setHasFile(false)
      onOpenDeal(dealId)
      return true
    } finally {
      setLinkingDocument(false)
    }
  }
  const handleDraftDownload = async () => {
    if (!pdfReviewCompleted || downloadingDraft) return
    setDownloadingDraft(true)
    try {
      await downloadRenderedDocumentPdf(selectedDocument.name)
    } finally {
      setDownloadingDraft(false)
    }
  }
  const openUploadDocument = (index: number) => {
    autoSaveVersionRef.current += 1
    autoSavePendingRef.current = false
    setAutoSaving(false)
    setAutoSavePending(false)
    setAutoSaveError(false)
    const document = uploadDocuments[index]
    const resumeDealStep =
      document?.pdfReviewCompleted === true && document.stage !== "confirmed"
    const nextStep = resumeDealStep ? "deal" : "compare"
    setSelectedIndex(index)
    setStep(nextStep)
    setMobilePane("fields")
    onDocumentOpen?.(document?.name ?? null, nextStep)
  }
  const handleAutoSave = async (
    phase: "pending" | "commit" | "retry" = "commit"
  ) => {
    if (phase === "pending") {
      autoSaveVersionRef.current += 1
      autoSavePendingRef.current = true
      setAutoSaveError(false)
      setAutoSavePending(true)
      return
    }
    if (phase === "commit" && !autoSavePendingRef.current) return
    autoSavePendingRef.current = false
    const version = ++autoSaveVersionRef.current
    setAutoSavePending(false)
    setAutoSaveError(false)
    setAutoSaving(true)
    const savingDocument = selectedDocumentRef.current
    const [result] = await Promise.all([
      prototypeBackend.tradeDocuments.saveFields({
        id: savingDocument.name,
        fields: Object.fromEntries(resolvedReviewFields(savingDocument).map((field) => [field.key, { value: field.value, unit: field.unit }])) ,
      }),
      new Promise<void>((resolve) => window.setTimeout(resolve, 800)),
    ])
    if (version !== autoSaveVersionRef.current || savingDocument.name !== selectedDocumentRef.current.name) return
    if (!result.ok) {
      setAutoSaving(false)
      setAutoSaveError(true)
      toast.error(result.error)
      return
    }
    setAutoSaving(false)
    setLastAutoSavedAt(new Date())
  }
  const cancelUpload = () => {
    if (uploadTimerRef.current) window.clearInterval(uploadTimerRef.current)
    uploadTimerRef.current = null
    const completedCount = activeUploadCompletedRef.current
    const canceledNames = new Set(
      activeUploadDocumentNamesRef.current.slice(completedCount)
    )
    const uploadOrigin = uploadOriginRef.current
    setUploadDocuments((current) => {
      const remainingDocuments = current.filter(
        (document) => !canceledNames.has(document.name)
      )
      const previousSelectionIndex = remainingDocuments.findIndex(
        (document) => document.name === uploadOrigin.selectedDocumentName
      )
      setSelectedIndex(
        completedCount > 0
          ? 0
          : previousSelectionIndex >= 0
            ? previousSelectionIndex
            : 0
      )
      return remainingDocuments
    })
    setHasFile(completedCount > 0 ? true : uploadOrigin.hasFile)
    setUploadProgress(null)
    activeUploadDocumentNamesRef.current = []
    activeUploadCompletedRef.current = 0
    setUploadNotice(
      completedCount > 0
        ? `${completedCount}개 파일만 추가하고 나머지 업로드를 취소했습니다.`
        : "파일 업로드를 취소했습니다."
    )
    toast.info("파일 업로드를 취소했습니다.")
  }
  const handleFilesSelected = async (files: File[]) => {
    setUploadNotice("")
    if (files.length === 0) return
    if (uploadTimerRef.current || uploadPreparingRef.current) {
      setUploadNotice("진행 중인 업로드가 끝난 뒤 파일을 추가해 주세요.")
      return
    }
    if (files.length > TRADE_DOCUMENT_MAX_UPLOAD_FILES) {
      setUploadNotice(
        `한 번에 최대 ${TRADE_DOCUMENT_MAX_UPLOAD_FILES}개까지 업로드할 수 있습니다.`
      )
      return
    }

    const oversized = files.filter(
      (file) => file.size > TRADE_DOCUMENT_MAX_UPLOAD_BYTES
    )
    const unsupported = files.filter(
      (file) => !file.name.toLowerCase().endsWith(".pdf")
    )
    const existingNames = new Set(
      uploadDocuments.map((document) => document.name.toLowerCase())
    )
    const duplicates = files.filter((file) =>
      existingNames.has(file.name.toLowerCase())
    )
    const firstDuplicate = duplicates[0]
    if (firstDuplicate) {
      setFileTrayOpen(true)
      const existingDocument = uploadDocuments.find(
        (document) =>
          document.name.toLowerCase() === firstDuplicate.name.toLowerCase()
      )
      setDuplicateUploadNotice({
        fileName: existingDocument?.name ?? firstDuplicate.name,
        dealLabel: existingDocument?.dealLabel,
      })
    } else {
      setDuplicateUploadNotice(null)
    }
    const batchNames = new Set(existingNames)
    const contentHashes = new Map(uploadDocuments.filter((document) => document.contentHash).map((document) => [document.contentHash, document]))
    const hashesByName = new Map<string, string>()
    const validFiles: File[] = []
    uploadPreparingRef.current = true
    try {
      for (const file of files) {
        const name = file.name.toLowerCase()
        if (file.size === 0 || file.size > TRADE_DOCUMENT_MAX_UPLOAD_BYTES || !name.endsWith(".pdf") || batchNames.has(name)) continue
        const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer())
        const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
        const duplicate = contentHashes.get(hash)
        if (duplicate || Array.from(hashesByName.values()).includes(hash)) {
          setFileTrayOpen(true)
          setDuplicateUploadNotice({ fileName: duplicate?.name ?? validFiles.find((item) => hashesByName.get(item.name) === hash)?.name ?? file.name, dealLabel: duplicate?.dealLabel, kind: "content" })
          continue
        }
        batchNames.add(name)
        hashesByName.set(file.name, hash)
        validFiles.push(file)
      }
    } catch {
      setUploadNotice("파일을 읽지 못했습니다. 파일을 다시 선택해 주세요.")
      return
    } finally {
      uploadPreparingRef.current = false
    }
    const excludedCount = files.length - validFiles.length

    if (validFiles.length === 0) {
      const reasons = [
        unsupported.length > 0 ? `PDF 아님 ${unsupported.length}개` : "",
        oversized.length > 0
          ? `${TRADE_DOCUMENT_MAX_UPLOAD_MB}MB 초과 ${oversized.length}개`
          : "",
        duplicates.length > 0 ? `기존 문서 ${duplicates.length}개` : "",
      ].filter(Boolean)
      if (duplicates.length !== files.length) {
        setUploadNotice(
          `추가할 수 있는 파일이 없습니다. ${reasons.join(" · ")}`
        )
      }
      return
    }

    const pendingDocuments: RecentDocument[] = validFiles.map((file) => ({
      name: file.name,
      uploadedAt: new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
        .format(new Date())
        .replace(/\. /g, ".")
        .replace(/\.$/, ""),
      status: "분석 중...",
      tone: "neutral",
      stage: "queued",
      documentType: inferUploadDocumentType(file.name),
      contentHash: hashesByName.get(file.name),
      retryCount: 0,
    }))
    uploadOriginRef.current = {
      hasFile,
      selectedDocumentName: selectedDocument?.name ?? null,
    }
    activeUploadDocumentNamesRef.current = pendingDocuments.map(
      (document) => document.name
    )
    activeUploadCompletedRef.current = 0
    setUploadDocuments((current) => [...pendingDocuments, ...current])
    setHasFile(true)
    setSelectedIndex(0)
    onDocumentOpen?.(pendingDocuments[0]?.name ?? null, "compare")
    setStep("compare")
    setUploadProgress({ completed: 0, total: validFiles.length })
    if (excludedCount > 0) {
      setUploadNotice(
        `유효한 ${validFiles.length}개만 업로드합니다. 제외: 형식 ${unsupported.length}개 · 용량 ${oversized.length}개 · 중복 ${duplicates.length}개`
      )
    }

    let completed = 0
    let failedCount = 0
    if (uploadTimerRef.current) window.clearInterval(uploadTimerRef.current)
    uploadTimerRef.current = window.setInterval(() => {
      const currentFile = validFiles[completed]
      if (!currentFile) return
      const failed = /encrypted|password|fail/i.test(currentFile.name)
      if (failed) failedCount += 1
      setUploadDocuments((current) =>
        current.map((document) =>
          document.name === currentFile.name
            ? {
                ...document,
                status: failed
                  ? "처리 실패"
                  : document.documentType === "UNK"
                    ? "유형 확인 필요"
                    : "검토 대기",
                tone: failed ? "danger" : "warning",
                stage: failed ? "failed" : "field",
              }
            : document
        )
      )
      completed += 1
      activeUploadCompletedRef.current = completed
      setUploadProgress({ completed, total: validFiles.length })
      if (completed >= validFiles.length) {
        if (uploadTimerRef.current) window.clearInterval(uploadTimerRef.current)
        uploadTimerRef.current = null
        const completedNames = activeUploadDocumentNamesRef.current
        window.setTimeout(() => {
          if (activeUploadDocumentNamesRef.current !== completedNames) return
          setUploadProgress(null)
          activeUploadDocumentNamesRef.current = []
          activeUploadCompletedRef.current = 0
        }, 450)
        setUploadNotice(
          failedCount > 0
            ? `${failedCount}개 파일을 처리하지 못했습니다. 목록에서 다시 추출할 수 있습니다.`
            : excludedCount > 0
              ? `${validFiles.length}개를 추가하고 ${excludedCount}개를 제외했습니다.`
              : `${validFiles.length}개 파일을 추가했습니다.`
        )
        if (failedCount === 0) {
          toast.success(`${validFiles.length}개 파일을 추가했습니다.`)
        }
      }
    }, 650)
  }
  const retryDocument = async (index: number) => {
    const document = uploadDocuments[index]
    if (!document || document.stage !== "failed" || (document.retryCount ?? 0) >= 3) return
    const name = document.name
    setUploadDocuments((current) => current.map((item) => item.name === name
      ? { ...item, retryCount: (item.retryCount ?? 0) + 1, stage: "ocr", status: "분석 중...", tone: "blue" } : item))
    const result = await prototypeBackend.tradeDocuments.retry({ id: name })
    const failed = !result.ok || /encrypted|password|fail/i.test(name)
    setUploadDocuments((current) => current.map((item) => item.name === name
      ? { ...item, stage: failed ? "failed" : "field", status: failed ? "처리 실패 · 파일 확인 필요" : "검토 대기", tone: failed ? "danger" : "warning" } : item))
    if (failed) toast.error("재추출하지 못했습니다. 잠금 해제 또는 원본 파일 확인 후 다시 올려 주세요.")
  }
  useEffect(
    () => () => {
      if (uploadTimerRef.current) window.clearInterval(uploadTimerRef.current)
    },
    []
  )
  useEffect(() => {
    if (!uploadNotice) return
    const noticeTimer = window.setTimeout(() => setUploadNotice(""), 4000)
    return () => window.clearTimeout(noticeTimer)
  }, [uploadNotice])
  const handleDeleteDocument = (index: number) => {
    const deletedName = uploadDocuments[index]?.name
    const nextDocuments = uploadDocuments.filter(
      (_, currentIndex) => currentIndex !== index
    )
    if (hasFile && index === selectedIndex) {
      onDocumentOpen?.(
        nextDocuments[Math.min(selectedIndex, nextDocuments.length - 1)]
          ?.name ?? null,
        "compare"
      )
    }
    setUploadDocuments((current) => {
      const next = current.filter((_, currentIndex) => currentIndex !== index)
      if (next.length === 0) {
        setHasFile(false)
        setSelectedIndex(0)
        return next
      }
      setSelectedIndex((currentIndex) => {
        if (index < currentIndex) return currentIndex - 1
        if (index === currentIndex)
          return Math.min(currentIndex, next.length - 1)
        return currentIndex
      })
      return next
    })
    if (deletedName) toast.success(`${deletedName} 파일을 삭제했습니다.`)
  }
  const handleDocumentTypeChange = (documentType: UploadDocumentType) => {
    setUploadDocuments((current) =>
      current.map((document, index) =>
        index === selectedIndex
          ? {
              ...document,
              documentType,
              reviewedFields: {},
              stage: "field",
              status: "검토 대기",
              tone: "warning",
              pdfReviewCompleted: false,
            }
          : document
      )
    )
  }

  if (!hasFile) {
    return (
      <div className="h-full min-h-0 bg-background">
        <BeforeUploadState
          documents={uploadDocuments.map((document, index) => ({ document, index }))}
          onOpenDocument={(index) => {
            openUploadDocument(index)
            setHasFile(true)
          }}
          onDeleteDocument={handleDeleteDocument}
          onFilesSelected={handleFilesSelected}
          uploadNotice={uploadNotice}
          duplicateUploadNotice={duplicateUploadNotice}
          onDismissDuplicateUpload={() => setDuplicateUploadNotice(null)}
        />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100svh-var(--header-height))] min-h-0 flex-col overflow-hidden bg-background">
      <div className="flex min-h-14 shrink-0 flex-wrap items-center justify-end gap-2 border-b border-[var(--surface-border)] bg-[var(--surface-background)] px-3 py-2 sm:px-4">
        <div className="mr-auto min-w-0">
          <h1 className="text-sm font-semibold">문서 올리기</h1>
          <p className="truncate text-[11px] text-[var(--surface-muted-foreground)]">
            {uploadDocumentTypeLabel(selectedDocument.documentType)} ·{" "}
            {step === "deal" ? "거래 연결" : "항목 검토"} ·{" "}
            {selectedDocument.name}
          </p>
        </div>
        <DocumentBlockingAlerts errors={uploadErrors} checks={uploadChecks} />
        <AutoSaveStatus
          className="hidden lg:flex"
          state={
            autoSaveError
              ? "error"
              : autoSaving
                ? "saving"
                : autoSavePending
                  ? "pending"
                  : "saved"
          }
          savedAt={lastAutoSavedAt}
        />
        {autoSaveError ? (
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => void handleAutoSave("retry")}
          >
            다시 저장
          </Button>
        ) : null}
        {selectedDocument.stage === "failed" ? (
          <Button
            size="sm"
            variant="outline"
            disabled={(selectedDocument.retryCount ?? 0) >= 3}
            onClick={() => void retryDocument(selectedIndex)}
          >
            <RefreshCw data-icon="inline-start" /> {(selectedDocument.retryCount ?? 0) >= 3 ? "재추출 한도 도달" : "다시 추출"}
          </Button>
        ) : selectedDocument.stage === "ocr" ||
          selectedDocument.stage === "queued" ? (
          <Button size="sm" disabled>
            <LoaderCircle className="animate-spin" data-icon="inline-start" />
            처리 중
          </Button>
        ) : selectedDocument.stage === "excluded" ? (
          <Button size="sm" variant="outline" disabled>
            처리 제외
          </Button>
        ) : selectedDocument.stage === "duplicate" ? (
          <Button size="sm" variant="outline" disabled>
            중복 확인 필요
          </Button>
        ) : step === "compare" ? (
          <Button
            size="sm"
            disabled={isDealBlocked}
            title={
              isDealBlocked
                ? isTypeUnresolved
                  ? "문서 유형을 먼저 선택해야 합니다."
                  : uploadFieldErrors[0]?.label ?? "문서 처리와 변경사항 저장을 완료해 주세요."
                : undefined
            }
            onClick={() => {
              handlePdfReviewComplete()
            }}
          >
            거래 연결
            <ChevronRight data-icon="inline-end" />
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setStep("compare")
                onDocumentOpen?.(selectedDocument.name, "compare")
                setMobilePane("fields")
              }}
            >
              <ChevronLeft data-icon="inline-start" /> 항목 검토
            </Button>
            <span ref={setDealActionTarget} className="contents" />
          </>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 sm:p-4">
        <HorizontalDocumentTray
          documents={pendingUploadDocuments.map(({ document }) => document)}
          selectedIndex={pendingSelectedIndex}
          onSelect={(index) => {
            const sourceIndex = pendingUploadDocuments[index]?.index
            if (sourceIndex === undefined) return
            openUploadDocument(sourceIndex)
            setFileTrayOpen(false)
          }}
          onDelete={(index) => {
            const sourceIndex = pendingUploadDocuments[index]?.index
            if (sourceIndex === undefined) return
            handleDeleteDocument(sourceIndex)
          }}
          onFilesSelected={handleFilesSelected}
          uploadProgress={uploadProgress}
          uploadNotice={uploadNotice}
          duplicateUploadNotice={duplicateUploadNotice}
          onDismissDuplicateUpload={() => setDuplicateUploadNotice(null)}
          onCancelUpload={cancelUpload}
          expanded={fileTrayOpen}
          onExpandedChange={setFileTrayOpen}
        />

        <PdfPanelWorkspaceCard>
          <DocumentReviewWorkspace
            document={selectedDocument}
            step={step}
            onAutoSave={handleAutoSave}
            dealBlocked={isDealBlocked}
            pdfReviewCompleted={pdfReviewCompleted}
            linkedDealLabel={linkedDealLabel}
            linkingDocument={linkingDocument}
            downloadingDraft={downloadingDraft}
            dealActionTarget={dealActionTarget}
            onLinkDeal={handleDealLink}
            onDownloadDraft={handleDraftDownload}
            onPdfReviewComplete={handlePdfReviewComplete}
            onReviewedFieldChange={handleReviewedFieldChange}
            onDocumentTypeChange={handleDocumentTypeChange}
            mobilePane={mobilePane}
            onMobilePaneChange={setMobilePane}
          />
        </PdfPanelWorkspaceCard>
      </div>
    </div>
  )
}

function PendingUploadDocumentsTable({
  documents,
  onOpenDocument,
  onDeleteDocument,
}: {
  documents: ReadonlyArray<{ document: RecentDocument; index: number }>
  onOpenDocument: (index: number) => void
  onDeleteDocument: (index: number) => void
}) {
  const [statusFilter, setStatusFilter] = useState<DocumentTrayFilter>("all")
  const [typeFilter, setTypeFilter] = useState<UploadDocumentType | "all">(
    "all"
  )
  const [sort, setSort] = useState<DocumentQueueSort>("recent")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [deleteTarget, setDeleteTarget] = useState<{
    index: number
    name: string
  } | null>(null)
  const availableDocumentTypes = Array.from(
    new Set(documents.map(({ document }) => document.documentType))
  )
  const filteredDocuments = documents
    .filter(
      ({ document }) =>
        matchesDocumentQueueStatus(document, statusFilter) &&
        (typeFilter === "all" || document.documentType === typeFilter)
    )
    .toSorted(({ document: left }, { document: right }) =>
      sort === "recent"
        ? right.uploadedAt.localeCompare(left.uploadedAt)
        : left.uploadedAt.localeCompare(right.uploadedAt)
    )
  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleDocuments = filteredDocuments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  const actionLabel = (stage: DocumentStageKey) => {
    if (stage === "failed") return "오류 확인"
    if (stage === "excluded") return "사유 확인"
    if (stage === "ocr" || stage === "queued") return "처리 보기"
    return "확인하기"
  }

  if (documents.length === 0) return null

  return (
    <section aria-labelledby="pending-upload-title">
      <Card size="sm">
        <CardHeader className="border-b">
          <div className="flex flex-col items-stretch gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="pending-upload-title"
                  className="text-lg font-semibold tracking-tight"
                >
                  업로드 문서
                </h2>
                <ToneBadge tone="warning">{documents.length}건</ToneBadge>
              </div>
              <p className="mt-1 text-xs text-[var(--surface-muted-foreground)]">
                업로드한 문서의 처리 상태를 확인하세요.
              </p>
            </div>
            <BusinessListToolbar
              aria-label="업로드 문서 필터"
              result={`${filteredDocuments.length}건 표시 중`}
            >
              <BusinessFilterField label="상태">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as DocumentTrayFilter)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-36" aria-label="상태 필터">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="processing">처리 중</SelectItem>
                    <SelectItem value="review">확인 필요</SelectItem>
                    <SelectItem value="failed">실패·제외</SelectItem>
                    <SelectItem value="confirmed">거래 연결 완료</SelectItem>
                  </SelectContent>
                </Select>
              </BusinessFilterField>
              <BusinessFilterField label="문서 유형">
                <Select
                  value={typeFilter}
                  onValueChange={(value) => {
                    setTypeFilter(value as UploadDocumentType | "all")
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-44" aria-label="문서 유형 필터">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="all">전체</SelectItem>
                    {availableDocumentTypes.map((documentType) => (
                      <SelectItem key={documentType} value={documentType}>
                        {uploadDocumentTypeLabel(documentType)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </BusinessFilterField>
              <BusinessFilterField label="정렬">
                <Select
                  value={sort}
                  onValueChange={(value) => {
                    setSort(value as DocumentQueueSort)
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="w-44" aria-label="정렬">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="recent">최근 업로드 순</SelectItem>
                    <SelectItem value="oldest">오래된 업로드 순</SelectItem>
                  </SelectContent>
                </Select>
              </BusinessFilterField>
            </BusinessListToolbar>
          </div>
        </CardHeader>

        <CardContent data-layout="flush-table" className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[760px] table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[28%] text-left!">
                    문서 유형
                  </TableHead>
                  <TableHead className="w-[26%] text-left!">파일</TableHead>
                  <TableHead className="w-[22%] text-left!">등록일자</TableHead>
                  <TableHead className="w-[14%] text-left!">상태</TableHead>
                  <TableHead className="w-[10%] text-right!">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleDocuments.map(({ document, index }) => (
                  <TableRow
                    key={`${document.name}-${index}`}
                    data-clickable="true"
                    tabIndex={0}
                    className="group cursor-pointer outline-none focus-visible:[box-shadow:var(--shadow-keyboard-focus)]"
                    onClick={() => onOpenDocument(index)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        onOpenDocument(index)
                      }
                    }}
                  >
                    <TableCell className="h-auto py-3 text-left! whitespace-normal">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <UploadDocumentTypeMark
                          documentType={document.documentType}
                          pages={document.pages}
                        />
                        <span className="truncate text-sm font-semibold">
                          {uploadDocumentTypeLabel(document.documentType)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="truncate text-left! font-medium">
                      {document.name}
                    </TableCell>
                    <TableCell className="truncate text-left! text-[var(--surface-muted-foreground)]">
                      {document.uploadedAt}
                    </TableCell>
                    <TableCell className="text-left!">
                      <ToneBadge tone={document.tone}>
                        {document.status}
                      </ToneBadge>
                    </TableCell>
                    <TableCell className="text-right!">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation()
                            onOpenDocument(index)
                          }}
                        >
                          {actionLabel(document.stage)}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              aria-label={`${document.name} 메뉴`}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <MoreVertical />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() =>
                                setDeleteTarget({
                                  index,
                                  name: document.name,
                                })
                              }
                            >
                              <Trash2 />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center! text-xs text-[var(--surface-muted-foreground)]"
                    >
                      검색 조건에 맞는 문서가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            page={currentPage}
            pageSize={pageSize}
            total={filteredDocuments.length}
            pageSizeOptions={[10, 20, 50]}
            aria-label="검토·배정 대기 문서 페이지 이동"
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => {
              setPageSize(nextPageSize)
              setPage(1)
            }}
          />
        </CardContent>
      </Card>
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>문서를 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name} 파일과 추출 결과가 대기 목록에서 삭제됩니다.
              삭제한 문서는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTarget) onDeleteDocument(deleteTarget.index)
                setDeleteTarget(null)
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

function BeforeUploadState({
  documents,
  onOpenDocument,
  onDeleteDocument,
  onFilesSelected,
  uploadNotice,
  duplicateUploadNotice,
  onDismissDuplicateUpload,
}: {
  documents: ReadonlyArray<{ document: RecentDocument; index: number }>
  onOpenDocument: (index: number) => void
  onDeleteDocument: (index: number) => void
  onFilesSelected: (files: File[]) => void
  uploadNotice: string
  duplicateUploadNotice: DuplicateUploadNotice | null
  onDismissDuplicateUpload: () => void
}) {
  const fileDropZoneRef = useRef<FileDropZoneRef | null>(null)

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-ecoya-wide-xl px-5 py-5 sm:px-6 sm:py-6 xl:px-8">
        <BusinessPageHero
          variant="ai"
          eyebrow="AI 파일 올리기"
          title="문서 올리기"
          description="PDF를 올리고 추출값을 검토한 뒤, 연결할 거래와 반영 내용을 확인하세요."
          align="center"
        />
        <ol aria-label="문서 처리 순서" className="mx-auto mt-4 flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {["파일 올리기", "추출값 검토", "거래 연결·확정"].map((title, index) => (
            <li key={title} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="mr-2 size-3 text-muted-foreground/60" aria-hidden="true" />}
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">{index + 1}</span>
              <span>{title}</span>
            </li>
          ))}
        </ol>
        <div className="mx-auto mt-5 w-full max-w-5xl">
          <Card className="w-full bg-[var(--surface-background)]!" size="sm">
            <CardContent className="p-4 sm:p-5">
              <div className="mb-3 grid gap-2">
                <AiDocumentProcessingNotice />
                {duplicateUploadNotice ? (
                  <DuplicateUploadAlert
                    notice={duplicateUploadNotice}
                    onDismiss={onDismissDuplicateUpload}
                  />
                ) : null}
              </div>
              <FileDropZone
                ref={fileDropZoneRef}
                accept="application/pdf,.pdf"
                multiple
                aria-label="PDF 파일 선택 또는 끌어놓기"
                label="파일을 끌어다 놓으세요"
                instructions={`PDF 최대 ${TRADE_DOCUMENT_MAX_UPLOAD_FILES}개, 파일당 ${TRADE_DOCUMENT_MAX_UPLOAD_MB}MB`}
                onFiles={onFilesSelected}
                className="min-h-36 flex-row gap-3 bg-[var(--surface-background)] px-4 text-left"
              >
                <Upload
                  className="text-[var(--file-drop-foreground)]"
                  data-icon="inline-start"
                />
                <span className="text-[var(--surface-foreground)]">
                  <span className="block text-sm font-semibold">
                    파일을 끌어다 놓으세요
                  </span>
                  <span className="text-xs text-[var(--surface-muted-foreground)]">
                    PDF 최대 {TRADE_DOCUMENT_MAX_UPLOAD_FILES}개, 파일당
                    {` ${TRADE_DOCUMENT_MAX_UPLOAD_MB}MB`}
                  </span>
                </span>
              </FileDropZone>
              {uploadNotice ? (
                <Alert className="mt-3" variant="default">
                  <AlertDescription className="text-xs">
                    {uploadNotice}
                  </AlertDescription>
                </Alert>
              ) : null}
              <div className="mt-3 flex justify-end">
                <Button onClick={() => fileDropZoneRef.current?.open()}>
                  <Upload data-icon="inline-start" /> 파일 선택
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="mx-auto w-full max-w-ecoya-wide-xl px-5 pb-10 sm:px-6 xl:px-8">
        <div className="mt-7">
          <PendingUploadDocumentsTable
            documents={documents}
            onOpenDocument={onOpenDocument}
            onDeleteDocument={onDeleteDocument}
          />
        </div>
      </div>
    </div>
  )
}

// Kept as a fallback for older prototype routes while the card workspace ships.
function InlinePdfCompare({
  document,
  step,
  onAutoSave,
  dealBlocked,
  onRequiredFieldReady,
  onDocumentTypeChange,
  mobilePane,
  onMobilePaneChange,
}: {
  document: RecentDocument
  step: "compare" | "deal"
  onAutoSave: (phase?: "pending" | "commit") => void
  dealBlocked?: boolean
  onRequiredFieldReady?: () => void
  onDocumentTypeChange: (documentType: UploadDocumentType) => void
  mobilePane: "fields" | "preview"
  onMobilePaneChange: (pane: "fields" | "preview") => void
}) {
  const typeUnresolved = isUploadDocumentTypeUnresolved(document)
  const isCompact = useIsCompactWorkspace()
  const fieldsPanel = (
    <section
      className={cn(
        "h-full min-h-0 flex-col bg-background xl:flex",
        mobilePane === "fields" ? "flex" : "hidden"
      )}
    >
      <div className="flex h-11 shrink-0 items-center justify-between border-b bg-background px-5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Sparkles data-icon="inline-start" />
          {step === "deal" ? "거래 연결 전 입력 필드" : "PDF 원문과 대조"}
        </div>
        <div className="flex items-center gap-2">
          <ToneBadge tone="blue">AI가 읽었습니다</ToneBadge>
          <ToneBadge
            tone={
              step === "deal"
                ? "success"
                : typeUnresolved
                  ? "warning"
                  : document.tone
            }
          >
            {step === "deal"
              ? "검토 완료"
              : typeUnresolved
                ? "유형 확인 필요"
                : document.status}
          </ToneBadge>
        </div>
      </div>
      <div className="field-scrollbar min-h-0 flex-1 overflow-y-scroll">
        <div className="p-7">
          <div className="mb-7">
            <h2 className="text-[22px] font-semibold tracking-normal">
              {document.name}
            </h2>
            <div className="mt-2 text-sm text-muted-foreground">
              {step === "deal"
                ? "거래 후보를 확인하면서 필요한 값은 이 자리에서 바로 수정합니다."
                : document.stage === "field"
                  ? "AI가 추출한 값을 먼저 확인하고, 필요한 항목만 오른쪽 PDF에서 원문 위치를 대조합니다."
                  : "선택한 파일의 처리 상태를 확인합니다. 다음 액션은 상단 버튼으로만 진행합니다."}
            </div>
            {typeUnresolved ? (
              <DocumentTypeResolution onChange={onDocumentTypeChange} />
            ) : null}
            {dealBlocked && !typeUnresolved ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning">
                <Building2 className="size-3.5" data-icon="inline-start" />
                단가 입력 후 거래 연결 가능
              </div>
            ) : null}
          </div>

          {typeUnresolved ? null : document.stage === "excluded" ? (
            <NonTradeDocumentNotice documentType={document.documentType} />
          ) : document.stage === "failed" ||
            document.stage === "duplicate" ||
            document.stage === "ocr" ||
            document.stage === "queued" ? (
            <DocumentProcessingNotice document={document} />
          ) : (
            <FieldVerificationList
              key={document.documentType}
              mode={step}
              documentType={document.documentType}
              onAutoSave={onAutoSave}
              onRequiredFieldReady={onRequiredFieldReady}
            />
          )}

          {document.stage !== "excluded" ? (
            <div className="mt-6 flex items-start gap-2 rounded-lg border bg-muted/25 px-3 py-2">
              <Bot className="mt-2 text-primary" data-icon="inline-start" />
              <AutoResizeTextarea placeholder="금액 다시 대조해줘" />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
  const previewPanel = (
    <section
      className={cn(
        "h-full min-h-0 flex-col xl:flex",
        mobilePane === "preview" ? "flex" : "hidden"
      )}
    >
      {step === "compare" ? (
        <>
          <div className="flex h-11 shrink-0 items-center justify-between border-b bg-background px-3 sm:px-5">
            <Button
              variant="ghost"
              size="sm"
              className="xl:hidden"
              onClick={() => onMobilePaneChange("fields")}
            >
              <ChevronLeft data-icon="inline-start" /> 필드 검토
            </Button>
            <div className="truncate text-xs text-muted-foreground">
              {document.name}
            </div>
          </div>
          <DocumentStage downloadName={document.name} />
        </>
      ) : (
        <DealConfirmPanel
          key={document.name}
          document={document}
          linkedDealLabel={document.dealLabel ?? null}
          linking={false}
          onShowPdf={() => onMobilePaneChange("preview")}
          onLinkDeal={async () => false}
        />
      )}
    </section>
  )

  if (isCompact) {
    return (
      <div className="grid min-h-0 flex-1 grid-cols-1">
        {fieldsPanel}
        {previewPanel}
      </div>
    )
  }

  return (
    <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
      <ResizablePanel defaultSize="48%" minSize="30%" maxSize="68%">
        {fieldsPanel}
      </ResizablePanel>
      <PdfPanelResizeHandle label="추출 필드와 PDF 원문 너비 조절" />
      <ResizablePanel defaultSize="52%" minSize="32%">
        {previewPanel}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

function DocumentReviewWorkspace({
  document,
  step,
  onAutoSave,
  dealBlocked,
  pdfReviewCompleted,
  linkedDealLabel,
  linkingDocument,
  downloadingDraft,
  dealActionTarget,
  onLinkDeal,
  onDownloadDraft,
  onPdfReviewComplete,
  onReviewedFieldChange,
  onDocumentTypeChange,
  mobilePane,
  onMobilePaneChange,
}: {
  document: RecentDocument
  step: UploadDetailStep
  onAutoSave: (phase?: "pending" | "commit") => void
  dealBlocked?: boolean
  pdfReviewCompleted: boolean
  linkedDealLabel: string | null
  linkingDocument: boolean
  downloadingDraft: boolean
  dealActionTarget: HTMLElement | null
  onLinkDeal: (dealId: string, dealLabel: string, bankCash?: Omit<BankCashInput, "sourceDocumentId" | "idempotencyKey">) => Promise<boolean>
  onDownloadDraft: () => void | Promise<void>
  onPdfReviewComplete: () => void
  onReviewedFieldChange: (key: string, patch: Partial<ReviewedField>) => void
  onDocumentTypeChange: (documentType: UploadDocumentType) => void
  mobilePane: "fields" | "preview"
  onMobilePaneChange: (pane: "fields" | "preview") => void
}) {
  const typeUnresolved = isUploadDocumentTypeUnresolved(document)
  const isCompact = useIsMobile()

  const fieldsPanel = (
    <section
      aria-label="항목 점검"
      className={cn(
        "h-full min-h-0 flex-col bg-[var(--surface-background)] lg:flex",
        mobilePane === "fields" ? "flex" : "hidden"
      )}
    >
      <div className="flex min-h-[72px] shrink-0 items-center justify-between gap-4 border-b border-[var(--surface-border)] bg-[var(--surface-background)] px-5 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">항목 검토</h2>
          <p className="mt-1 truncate text-[11px] text-[var(--surface-muted-foreground)]">
            AI가 문서에서 읽은 항목 값을 확인하세요.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 lg:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMobilePaneChange("preview")}
          >
            PDF 보기
          </Button>
        </div>
      </div>

      <div className="field-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="p-4 sm:p-5">
          {document.documentType === "BANK_STATEMENT" ? (
            <Alert variant="blue" className="mb-4">
              <AlertTitle className="text-xs">
                은행거래내역서 — 거래 연결 + 일정 매칭
              </AlertTitle>
              <AlertDescription className="text-[11px] leading-5">
                거래 연결 단계에서 같은 통화의 미결제 일정을 선택하면 검토 완료
                후 정산 현금을 기록합니다. 자동 환전은 하지 않으며, 맞는 일정이
                없으면 서류만 연결하고 현금은 정산에서 기록합니다.
              </AlertDescription>
            </Alert>
          ) : null}

          {typeUnresolved ? (
            <DocumentTypeResolution onChange={onDocumentTypeChange} />
          ) : document.stage === "excluded" ? (
            <NonTradeDocumentNotice documentType={document.documentType} />
          ) : document.stage === "failed" ||
            document.stage === "duplicate" ||
            document.stage === "ocr" ||
            document.stage === "queued" ? (
            <DocumentProcessingNotice document={document} />
          ) : (
            <div className="space-y-4">
              <OcrFieldReviewList
                key={`${document.name}:${document.documentType}`}
                mode={step === "deal" ? "deal" : "compare"}
                documentType={document.documentType}
                onAutoSave={onAutoSave}
                onShowSource={() => {
                  onMobilePaneChange("preview")
                  window.requestAnimationFrame(() => window.document.querySelector<HTMLElement>('[aria-label="PDF 원문"]')?.focus())
                }}
                reviewedFields={document.reviewedFields}
                onReviewedFieldChange={onReviewedFieldChange}
              />
              <UploadFieldHistory />
            </div>
          )}

          {dealBlocked && !typeUnresolved ? (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="size-3.5" />
              <AlertDescription className="text-xs">
                필수값·금액·날짜를 확인하고 저장을 완료해 주세요. ETA는 ETD보다 빠를 수 없습니다.
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      </div>
    </section>
  )

  const pdfPreviewPanel = (
    <section
      aria-label="PDF 원문"
      tabIndex={-1}
      className={cn(
        "relative h-full min-h-0 flex-col overflow-hidden lg:flex",
        mobilePane === "preview" ? "flex" : "hidden"
      )}
    >
      <Button
        variant="outline"
        size="sm"
        className="absolute top-2 left-2 z-20 lg:hidden"
        onClick={() => onMobilePaneChange("fields")}
      >
        <ChevronLeft data-icon="inline-start" />
        {step === "deal" ? "거래 연결" : "필드 검토"}
      </Button>
      <DocumentStage
        downloadName={document.name}
        reviewMode
        paperClassName="w-full max-w-none"
        canDownload={false}
        showAiDetection={step === "compare" && !pdfReviewCompleted}
        reviewGate={{
          completed: pdfReviewCompleted,
          disabled: Boolean(dealBlocked),
          downloading: downloadingDraft,
          onComplete: onPdfReviewComplete,
          onDownload: onDownloadDraft,
        }}
      />
    </section>
  )

  const dealPanel = (
    <section
      className={cn(
        "h-full min-h-0 flex-col overflow-hidden lg:flex",
        mobilePane === "fields" ? "flex" : "hidden"
      )}
    >
      <DealConfirmPanel
        key={document.name}
        document={document}
        linkedDealLabel={linkedDealLabel}
        linking={linkingDocument || Boolean(dealBlocked)}
        actionPortalTarget={dealActionTarget}
        onShowPdf={isCompact ? () => onMobilePaneChange("preview") : undefined}
        onLinkDeal={onLinkDeal}
      />
    </section>
  )

  const workspace = isCompact ? (
    <div className="grid min-h-0 flex-1 grid-cols-1">
      {step === "deal" ? dealPanel : fieldsPanel}
      {pdfPreviewPanel}
    </div>
  ) : step === "deal" ? (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-full min-h-0 flex-1 overflow-hidden"
    >
      <ResizablePanel defaultSize="50%" minSize="32%" maxSize="68%">
        {pdfPreviewPanel}
      </ResizablePanel>
      <PdfPanelResizeHandle label="PDF 원문과 거래 연결 패널 너비 조절" />
      <ResizablePanel defaultSize="50%" minSize="32%" maxSize="68%">
        {dealPanel}
      </ResizablePanel>
    </ResizablePanelGroup>
  ) : (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-full min-h-0 flex-1 overflow-hidden"
    >
      <ResizablePanel defaultSize="50%" minSize="32%" maxSize="68%">
        {fieldsPanel}
      </ResizablePanel>
      <PdfPanelResizeHandle label="추출 필드와 PDF 원문 너비 조절" />
      <ResizablePanel defaultSize="50%" minSize="32%" maxSize="68%">
        {pdfPreviewPanel}
      </ResizablePanel>
    </ResizablePanelGroup>
  )

  return workspace
}

function DocumentTypeResolution({
  onChange,
}: {
  onChange: (documentType: UploadDocumentType) => void
}) {
  return (
    <Alert className="mt-4 px-4 py-3" variant="default">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--color-orange-2)]" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold">문서 유형을 확인해 주세요</div>
          <ToneBadge tone="warning">AI 분류 미확정</ToneBadge>
        </div>
        <p className="mt-1 text-xs leading-5 text-[var(--surface-muted-foreground)]">
          AI가 문서 유형을 확정하지 못했습니다. 유형을 선택하면 해당 문서
          기준으로 검토 필드가 다시 구성됩니다.
        </p>
        <Field className="mt-3 gap-1.5">
          <FieldLabel className="text-xs">문서 유형</FieldLabel>
          <Combobox
            items={manualUploadDocumentTypeOptions.map(
              (option) => option.value
            )}
            onValueChange={(value) =>
              value && onChange(value as UploadDocumentType)
            }
          >
            <ComboboxInput
              className="w-full border-[var(--color-orange-2)]"
              placeholder="문서 유형 검색 또는 선택"
            />
            <ComboboxContent>
              <ComboboxEmpty>일치하는 문서 유형이 없습니다.</ComboboxEmpty>
              <ComboboxList>
                {manualUploadDocumentTypeOptions.map((option) => (
                  <ComboboxItem key={option.value} value={option.value}>
                    {option.label}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </Field>
        <p className="mt-2 text-xs text-[var(--color-orange-1)]">
          유형을 선택해야 필드 검토와 거래 연결을 진행할 수 있습니다.
        </p>
      </div>
    </Alert>
  )
}

function NonTradeDocumentNotice({
  documentType,
}: {
  documentType: UploadDocumentType
}) {
  return (
    <Alert variant="default" className="p-5">
      <AlertTriangle className="text-[var(--color-orange-2)]" />
      <AlertTitle>
        거래 문서로 인식되지 않았습니다 (유형: {documentType}).
      </AlertTitle>
      <AlertDescription className="leading-6">
        거래에 들어가지 않아도 되는 문서일 수 있습니다. 거래에 연결하기 전에 한
        번 더 확인해 주세요.
      </AlertDescription>
    </Alert>
  )
}

function DocumentProcessingNotice({ document }: { document: RecentDocument }) {
  const content =
    document.stage === "failed"
      ? {
          title: "문서를 처리하지 못했어요",
          body: "원본 파일은 목록에 유지됩니다. 상단의 다시 추출로 재시도할 수 있습니다.",
          badge: "재시도 가능",
          tone: "danger" as Tone,
        }
      : document.stage === "duplicate"
        ? {
            title: "이미 등록된 문서입니다",
            body: "동일 파일과 별개로 인보이스 번호 중복 위험도 확인했습니다. 기존 문서와 연결 거래를 먼저 확인하세요.",
            badge: "중복 차단",
            tone: "warning" as Tone,
          }
        : document.stage === "ocr"
          ? {
              title: "AI가 문서를 읽고 있습니다",
              body: "다른 문서는 계속 검토할 수 있습니다. 처리가 끝나면 최근 파일의 상태가 자동으로 바뀝니다.",
              badge: "처리 중",
              tone: "blue" as Tone,
            }
          : {
              title: "AI가 문서를 읽을 준비 중입니다",
              body: "앞선 파일의 업로드가 끝나면 자동으로 분석을 시작합니다.",
              badge: "분석 중",
              tone: "neutral" as Tone,
            }

  return (
    <Alert
      className="p-5"
      variant={
        document.stage === "failed"
          ? "riskHigh"
          : document.stage === "ocr"
            ? "blue"
            : document.stage === "queued"
              ? "gray"
              : "default"
      }
    >
      {document.stage === "ocr" ? (
        <LoaderCircle className="animate-spin" data-icon="inline-start" />
      ) : (
        <AlertTriangle data-icon="inline-start" />
      )}
      <AlertTitle>{content.title}</AlertTitle>
      <AlertDescription className="leading-6">{content.body}</AlertDescription>
      <AlertAction>
        <ToneBadge tone={content.tone}>{content.badge}</ToneBadge>
      </AlertAction>
      {document.stage === "duplicate" ? (
        <ItemGroup className="col-span-full mt-3 gap-2">
          <Item variant="outline" size="xs">
            <ItemContent className="flex-row items-center gap-2">
              <ItemDescription className="text-xs">기존 파일</ItemDescription>
              <ItemTitle className="text-xs">인보이스_2607_003.pdf</ItemTitle>
            </ItemContent>
          </Item>
          <Item variant="outline" size="xs">
            <ItemContent className="flex-row items-center gap-2">
              <ItemDescription className="text-xs">연결 거래</ItemDescription>
              <ItemTitle className="text-xs">
                한빛무역 · INV-2026-0703
              </ItemTitle>
            </ItemContent>
          </Item>
          <Alert variant="default">
            <AlertTriangle className="text-[var(--color-orange-2)]" />
            <AlertDescription className="text-xs">
              동일 인보이스 번호가 2건 감지되어 이중 지급 검토가 필요합니다.
            </AlertDescription>
          </Alert>
        </ItemGroup>
      ) : document.stage === "ocr" ? (
        <div
          className="col-span-full mt-3 space-y-2"
          aria-label="AI 추출 결과 준비 중"
        >
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-4/5" />
          <Skeleton className="h-8 w-2/3" />
        </div>
      ) : null}
    </Alert>
  )
}

type ReviewField = {
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
}

function resolvedReviewFields(document: Pick<RecentDocument, "documentType" | "reviewedFields">): ReviewField[] {
  return reviewFieldsForDocument(document.documentType).map((field) => {
    const reviewed = document.reviewedFields?.[field.key]
    if (!reviewed) return field
    const missing = field.required && !reviewed.value.trim()
    return { ...field, ...reviewed, tone: missing ? "danger" : "success", status: missing ? "누락" : "검토됨" }
  })
}

function reviewFieldsForDocument(
  documentType: RecentDocument["documentType"]
): ReviewField[] {
  const extracted = (
    key: string,
    label: string,
    value: string,
    options: Partial<
      Pick<ReviewField, "kind" | "comment" | "unit" | "required">
    > = {}
  ): ReviewField => ({
    key,
    label,
    value,
    kind: options.kind ?? "text",
    status: "정상",
    source: "추출 필드",
    confidence: "신뢰도 높음",
    comment: options.comment ?? "원문에서 추출한 값입니다.",
    tone: "success",
    unit: options.unit,
    required: options.required ?? true,
  })
  const missing = (
    key: string,
    label: string,
    options: Partial<Pick<ReviewField, "kind" | "comment" | "unit">> = {}
  ): ReviewField => ({
    key,
    label,
    value: "",
    kind: options.kind ?? "text",
    status: "누락",
    source: "직접 입력",
    confidence: "미측정",
    comment: options.comment ?? `${label} 필수 Trigger 필드입니다.`,
    tone: "danger",
    unit: options.unit,
    required: true,
  })
  const warning = (
    key: string,
    label: string,
    value: string,
    options: Partial<
      Pick<ReviewField, "kind" | "comment" | "unit" | "required">
    > = {}
  ): ReviewField => ({
    key,
    label,
    value,
    kind: options.kind ?? "text",
    status: "확인 필요",
    source: "추출 필드",
    confidence: "신뢰도 중간",
    comment: options.comment ?? "원문과 한 번 더 대조해 주세요.",
    tone: "warning",
    unit: options.unit,
    required: options.required ?? true,
    warningOnly: true,
  })
  const parties: ReviewField[] = [
    extracted("buyer", "Buyer", "HRM Corporation", {
      comment: "거래처 학습 후보입니다.",
      required: documentType === "SC",
    }),
    extracted("seller", "Seller", "KATAMAN ASIA-PACIFIC PTE LTD", {
      comment: "거래처 학습 후보입니다.",
      required: documentType === "SC",
    }),
  ]
  if (documentType === "BL") {
    return [
      ...parties,
      extracted("bl_number", "B/L 번호", "HMM-014W-2607"),
      extracted("container_number", "컨테이너 번호", "HMMU-2607014"),
      extracted("etd", "ETD", "2026-07-27", { kind: "date" }),
      missing("eta", "ETA", { kind: "date" }),
      extracted("quantity", "수량", "20", { unit: "MT" }),
      extracted("vessel", "선박/항차", "HMM Green / 014W", {
        comment: "선적 일정과 일치합니다.",
        required: false,
      }),
      warning("port", "도착항", "Incheon, Korea", {
        comment: "항구 표준명 확인을 권장하지만 진행을 막지 않습니다.",
        required: false,
      }),
    ]
  }
  if (documentType === "PL") {
    return [
      ...parties,
      extracted("invoice_number", "Invoice No.", "INV-2026-0703"),
      extracted("quantity", "수량", "20", { unit: "MT" }),
      missing("gross_weight", "총중량", { kind: "number", unit: "KG" }),
      extracted("packing_number", "포장번호", "PL-2026-0707", {
        comment: "포장명세서 식별 정보입니다.",
        required: false,
      }),
    ]
  }
  if (documentType === "SC") {
    return [
      ...parties,
      extracted("sc_number", "SC No.", "SC-2026-0708"),
      extracted("item_name", "품목", "Aluminium Scrap"),
      extracted("quantity", "수량", "20", { unit: "MT" }),
      extracted("unit_price", "단가", "128,333", { unit: "USD/MT" }),
      extracted("contract_date", "계약일", "2026-07-07", {
        kind: "date",
        comment: "원문 날짜를 ISO 형식으로 변환했습니다.",
        required: false,
      }),
    ]
  }
  if (documentType === "PO") {
    return [
      ...parties,
      extracted("po_number", "PO No.", "PO-260704-18"),
      extracted("counterparty", "거래처", "ACME GmbH"),
      extracted("item_name", "품목", "Aluminium Scrap"),
      extracted("quantity", "수량", "20", { unit: "MT" }),
      missing("unit_price", "단가", { kind: "money", unit: "USD/MT" }),
      missing("etd", "Target ETD", { kind: "date" }),
    ]
  }
  if (documentType === "CI") {
    return [
      ...parties,
      extracted("invoice_number", "Invoice No.", "INV-2026-0703"),
      extracted("invoice_date", "송장일", "2026-04-24", { kind: "date" }),
      extracted("item_name", "품목", "Aluminium Scrap"),
      {
        key: "quantity",
        label: "수량",
        value: "1,250",
        kind: "text",
        status: "오류 · 단위 불일치",
        source: "추출 필드",
        confidence: "원문 불일치",
        comment: "발주서 단위 BOX와 일치하지 않습니다.",
        tone: "danger",
        unit: "PCS",
        required: true,
      },
      warning("unit_price", "단가", "12.80", {
        kind: "money",
        unit: "USD",
        comment: "원문 인식값 12.B0와 비교가 필요합니다.",
      }),
      extracted("total_amount", "합계 금액", "4,620,000", {
        kind: "money",
        unit: "USD",
      }),
      missing("payment_due_date", "결제 예정일", { kind: "date" }),
      extracted(
        "payment_terms",
        "Payment",
        "10% advance, balance against copies",
        { comment: "지급조건 표현을 원문에서 확인했습니다.", required: false }
      ),
    ]
  }
  if (documentType === "PI") {
    return [
      ...parties,
      extracted("invoice_number", "Invoice No.", "PI-2026-0708"),
      extracted("supplier", "공급자", "KATAMAN ASIA-PACIFIC PTE LTD"),
      extracted("total_amount", "합계 금액", "2,566,660", {
        kind: "money",
        unit: "USD",
      }),
    ]
  }
  if (documentType === "AN") {
    return [
      ...parties,
      extracted("bl_number", "B/L 번호", "HMM-014W-2607"),
      extracted("container_number", "컨테이너 번호", "HMMU-2607014"),
      missing("freight_charge_term", "운임 부담 조건"),
    ]
  }
  if (documentType === "C/O") {
    return [
      extracted("certificate_number", "증명서 번호", "CO-2026-0708"),
      extracted("country_of_origin", "원산지", "Australia"),
      missing("hs_code", "HS Code"),
    ]
  }
  if (documentType === "CUSTOMS_ENTRY") {
    return [
      extracted("customs_number", "신고번호", "IMP-2026-0708"),
      extracted("item_name", "품목", "Aluminium Scrap"),
      extracted("customs_duty", "관세액", "24,000", {
        kind: "money",
        unit: "USD",
      }),
      extracted("vat", "부가세", "2,400", {
        kind: "money",
        unit: "USD",
      }),
      missing("clearance_date", "통관일", { kind: "date" }),
    ]
  }
  if (
    documentType === "FREIGHT_INVOICE" ||
    documentType === "INSURANCE_CERTIFICATE" ||
    documentType === "CUSTOMS_DECLARATION"
  ) {
    return [
      ...parties,
      extracted("total_amount", "합계 금액", "72,000", {
        kind: "money",
        unit: "USD",
      }),
    ]
  }
  if (documentType === "BANK_STATEMENT") {
    return [
      warning("total_amount", "거래 금액", "380,000", {
        kind: "money",
        unit: "USD",
        required: false,
      }),
      warning("currency", "통화", "USD", { required: false }),
      warning("counterparty", "거래처", "ACME GmbH", { required: false }),
    ]
  }
  return [
    ...parties,
    missing("document_number", "문서번호", {
      comment: `${documentType} 문서의 식별 번호를 확인해 주세요.`,
    }),
    warning("document_date", "문서일", "2026-07-08", {
      kind: "date",
      comment: "선택한 문서 유형 기준으로 날짜를 다시 검토합니다.",
      required: false,
    }),
  ]
}

function UploadFieldHistory() {
  const [open, setOpen] = useState(false)

  return (
    <section className="overflow-hidden rounded-lg border border-[var(--surface-border)] bg-background">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-xs font-semibold hover:bg-muted/30"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <History className="size-3.5 text-muted-foreground" />
        필드 변경 이력
        <span className="ml-auto text-[10px] font-normal text-muted-foreground">
          AI 최초 추출 포함
        </span>
        {open ? (
          <ChevronUp className="size-3.5" />
        ) : (
          <ChevronDown className="size-3.5" />
        )}
      </button>
      {open ? (
        <div className="border-t border-[var(--surface-border)] px-4 py-3 text-[11px]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
            <span className="font-semibold text-foreground">AI 근거</span>
            <span>문서 최초 추출</span>
            <span>문서 버전 1</span>
          </div>
          <div className="mt-3 divide-y divide-[var(--surface-border)]">
            <div className="flex items-center justify-between gap-4 py-2 first:pt-0">
              <span className="min-w-0 truncate">Payment 문구 확인</span>
              <span className="shrink-0 text-muted-foreground">
                조민영 · 방금 전
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 py-2 last:pb-0">
              <span className="min-w-0 truncate">수량 단위를 MT로 분리</span>
              <span className="shrink-0 text-muted-foreground">
                AI 추출 · 3분 전
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function OcrFieldReviewList({
  mode,
  documentType,
  onAutoSave,
  reviewedFields,
  onReviewedFieldChange,
  onShowSource,
}: {
  onShowSource: () => void
  mode: "compare" | "deal"
  documentType: RecentDocument["documentType"]
  onAutoSave: (phase?: "pending" | "commit") => void
  reviewedFields?: Record<string, ReviewedField>
  onReviewedFieldChange: (key: string, patch: Partial<ReviewedField>) => void
}) {
  const fields = resolvedReviewFields({ documentType, reviewedFields })
  const [unitOverrides, setUnitOverrides] = useState<Record<string, string>>({})
  const quantityUnit =
    unitOverrides.quantity ??
    fields.find((field) => field.key === "quantity")?.unit

  const resolvedUnitFor = (field: ReviewField) => {
    const currentUnit = unitOverrides[field.key] ?? field.unit
    if (field.key !== "unit_price" || !currentUnit?.includes("/")) {
      return currentUnit
    }
    const [currency] = currentUnit.split("/")
    return quantityUnit ? `${currency}/${quantityUnit}` : currentUnit
  }

  return (
    <div className="@container -mx-4 border-y border-[var(--surface-border)] sm:-mx-5">
      <div className="grid grid-cols-1 @min-[720px]:grid-cols-2">
        {fields.map((field) => {
          const danger = field.tone === "danger"
          const warning = field.tone === "warning"
          return (
            <FormField
              key={field.key}
              data-upload-field={field.key}
              htmlFor={`upload-field-${field.key}`}
              label={field.label}
              badge={<ToneBadge tone={field.tone}>{field.status}</ToneBadge>}
              sourceAction={<Button type="button" variant="ghost" size="xs" onClick={onShowSource} aria-label={`${field.label} 원본 보기`}>원본 보기 <FileText className="size-3" /></Button>}
              message={`${field.confidence} · ${field.comment}`}
              messageId={`upload-field-${field.key}-message`}
              tone={danger ? "danger" : warning ? "warning" : "neutral"}
              className={cn(
                "border-b border-[var(--surface-border)] bg-[var(--surface-background)] px-5 py-3.5",
                (danger || warning || field.key === "payment") && "@min-[720px]:col-span-2"
              )}
            >
                <SavingField
                  id={`upload-field-${field.key}`}
                  describedBy={`upload-field-${field.key}-message`}
                  value={field.value}
                  kind={field.kind}
                  unit={resolvedUnitFor(field)}
                  unitLabel={field.label}
                  onUnitChange={(unit) => {
                    setUnitOverrides((current) => ({ ...current, [field.key]: unit }))
                    onReviewedFieldChange(field.key, { unit })
                  }}
                  placeholder={danger ? `${field.label} 입력` : undefined}
                  emphasized={mode === "deal" && warning}
                  danger={danger}
                  onAutoSave={onAutoSave}
                  onValueChange={(value) => onReviewedFieldChange(field.key, { value })}
                />
            </FormField>
          )
        })}
      </div>
    </div>
  )
}

function FieldVerificationList({
  mode,
  documentType,
  onAutoSave,
  onRequiredFieldReady,
}: {
  mode: "compare" | "deal"
  documentType: RecentDocument["documentType"]
  onAutoSave: (phase?: "pending" | "commit") => void
  onRequiredFieldReady?: () => void
}) {
  const editing = mode === "deal"
  const [rejectedFields, setRejectedFields] = useState<Set<string>>(
    () => new Set()
  )
  const [completedRequired, setCompletedRequired] = useState<Set<string>>(
    () => new Set()
  )
  const [historyOpen, setHistoryOpen] = useState(false)
  const [unitOverrides, setUnitOverrides] = useState<Record<string, string>>({})
  const fields = reviewFieldsForDocument(documentType).filter(
    (field) => !rejectedFields.has(field.key)
  )

  const quantityUnit =
    unitOverrides.quantity ??
    fields.find((field) => field.key === "quantity")?.unit
  const resolvedUnitFor = (field: ReviewField) => {
    const currentUnit = unitOverrides[field.key] ?? field.unit
    if (field.key !== "unit_price" || !currentUnit?.includes("/")) {
      return currentUnit
    }
    const [currency] = currentUnit.split("/")
    return quantityUnit ? `${currency}/${quantityUnit}` : currentUnit
  }
  const missingFields = fields.filter(
    (field) =>
      field.required && !field.value && !completedRequired.has(field.key)
  )

  return (
    <div className="grid gap-6">
      {missingFields.length > 0 ? (
        <div className="rounded-lg border border-warning/30 bg-warning/6 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">
                {documentType} 필수 Trigger 필드 누락
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {missingFields.map((field) => field.label).join(", ")} 입력 후
                거래 연결 단계로 이동할 수 있습니다.
              </div>
            </div>
            <ToneBadge tone="warning">{missingFields.length}개 검토</ToneBadge>
          </div>
        </div>
      ) : null}

      {fields.map((field) => (
        <FormField
          key={field.key}
          label={field.label}
          htmlFor={`verify-field-${field.key}`}
          badge={<ToneBadge tone={field.tone}>{field.status}</ToneBadge>}
          message={`${field.confidence} · ${field.comment}`}
          messageId={`verify-field-${field.key}-message`}
          tone={field.tone === "danger" ? "danger" : field.tone === "warning" ? "warning" : "neutral"}
          className="py-2"
        >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <SavingField
                  id={`verify-field-${field.key}`}
                  describedBy={`verify-field-${field.key}-message`}
                  value={field.value}
                  kind={field.kind}
                  unit={resolvedUnitFor(field)}
                  unitLabel={field.label}
                  onUnitChange={(unit) =>
                    setUnitOverrides((current) => ({
                      ...current,
                      [field.key]: unit,
                    }))
                  }
                  placeholder={
                    field.tone === "danger" ? `${field.label} 입력` : undefined
                  }
                  emphasized={
                    field.tone === "danger" ||
                    (editing && field.tone === "warning")
                  }
                  danger={field.tone === "danger"}
                  onAutoSave={onAutoSave}
                  onValueChange={
                    field.tone === "danger"
                      ? () => {
                          setCompletedRequired(
                            (current) => new Set([...current, field.key])
                          )
                          onRequiredFieldReady?.()
                        }
                      : undefined
                  }
                />
              </div>
              {!field.required ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${field.label} 추출값 제외`}
                  title="잘못 추출된 필드 제외"
                  onClick={() =>
                    setRejectedFields(
                      (current) => new Set([...current, field.key])
                    )
                  }
                >
                  <X data-icon="inline-start" />
                </Button>
              ) : null}
            </div>
        </FormField>
      ))}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="justify-start">
          전체 추출 필드 19개 보기
        </Button>
        <Button
          variant="outline"
          className="justify-start"
          onClick={() => setHistoryOpen((open) => !open)}
        >
          <History data-icon="inline-start" /> 변경 이력
        </Button>
      </div>
      {historyOpen ? (
        <div className="rounded-lg border bg-muted/20 p-4 text-xs">
          <div className="font-semibold">필드 변경 이력</div>
          <div className="mt-3 grid gap-2 text-muted-foreground">
            <div className="flex justify-between gap-4">
              <span>Payment 문구 확인</span>
              <span>김민지 · 방금 전</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>수량 단위를 MT로 분리</span>
              <span>AI 추출 · 3분 전</span>
            </div>
            {rejectedFields.size > 0 ? (
              <div className="flex justify-between gap-4">
                <span>추출 필드 {rejectedFields.size}개 제외</span>
                <span>현재 작업</span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

const REVIEW_CURRENCIES = ["USD", "EUR", "KRW", "JPY", "CNY"]

function CurrencyUnitSelect({
  value,
  label,
  onChange,
}: {
  value: string
  label: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [currency, ...unitParts] = value.split("/")
  const suffix = unitParts.length > 0 ? `/${unitParts.join("/")}` : ""

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 min-w-24 shrink-0 justify-between gap-2 px-3"
          aria-label={`${label} 통화 선택`}
        >
          <span className="truncate">{value}</span>
          <ChevronDown className="size-3.5" data-icon="inline-end" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 gap-0 p-2">
        <div className="px-2 py-1.5 text-[11px] font-semibold">통화 선택</div>
        <div className="grid gap-0.5">
          {REVIEW_CURRENCIES.map((option) => (
            <Button
              key={option}
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                onChange(`${option}${suffix}`)
                setOpen(false)
              }}
            >
              <span className="min-w-0 flex-1 text-left">{option}</span>
              {currency === option ? (
                <Check className="size-3.5 text-primary" />
              ) : null}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function EditableUnitInput({
  value,
  label,
  onChange,
  onCommit,
}: {
  value: string
  label: string
  onChange: (value: string) => void
  onCommit: () => void
}) {
  return (
    <Input
      value={value}
      aria-label={`${label} 단위 입력`}
      className="h-10 w-28 shrink-0 bg-background text-sm font-medium"
      placeholder="단위"
      onChange={(event) => {
        const nextUnit = event.target.value
        onChange(nextUnit)
      }}
      onBlur={onCommit}
    />
  )
}

function SavingField({
  id,
  describedBy,
  value,
  kind,
  unit,
  unitLabel,
  placeholder,
  emphasized,
  danger,
  onAutoSave,
  onValueChange,
  onUnitChange,
}: {
  id?: string
  describedBy?: string
  value: string
  kind: PrototypeSlotKind
  unit?: string
  unitLabel: string
  placeholder?: string
  emphasized: boolean
  danger: boolean
  onAutoSave?: (phase?: "pending" | "commit") => void
  onValueChange?: (value: string) => void
  onUnitChange?: (unit: string) => void
}) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onAutoSave?.("pending")
    onValueChange?.(event.target.value)
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        id={id}
        aria-describedby={describedBy}
        aria-invalid={danger || emphasized || undefined}
        className={cn(
          "h-10 min-w-0 flex-1 bg-background text-sm font-semibold",
          danger && "border-destructive/50 ring-1 ring-destructive/20",
          emphasized && !danger && "border-warning/50 ring-1 ring-warning/20"
        )}
        type={inputTypeForKind(kind)}
        inputMode={isNumericInputKind(kind) ? "decimal" : undefined}
        step={isNumericInputKind(kind) ? "any" : undefined}
        defaultValue={isNumericInputKind(kind) ? normalizeDecimalInput(value) : value}
        aria-label={unitLabel}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={() => onAutoSave?.("commit")}
      />
      {unit !== undefined ? (
        kind === "money" || REVIEW_CURRENCIES.includes(unit) ? (
          <CurrencyUnitSelect
            value={unit}
            label={unitLabel}
            onChange={(nextUnit) => {
              onUnitChange?.(nextUnit)
              onAutoSave?.("pending")
              onAutoSave?.("commit")
            }}
          />
        ) : (
          <EditableUnitInput
            value={unit}
            label={unitLabel}
            onChange={(nextUnit) => {
              onUnitChange?.(nextUnit)
              onAutoSave?.("pending")
            }}
            onCommit={() => onAutoSave?.("commit")}
          />
        )
      ) : null}
    </div>
  )
}

function DealConfirmPanel({
  document,
  linkedDealLabel,
  linking,
  actionPortalTarget,
  onShowPdf,
  onLinkDeal,
}: {
  document: RecentDocument
  linkedDealLabel: string | null
  linking: boolean
  actionPortalTarget?: HTMLElement | null
  onShowPdf?: () => void
  onLinkDeal: (dealId: string, dealLabel: string, bankCash?: Omit<BankCashInput, "sourceDocumentId" | "idempotencyKey">) => Promise<boolean>
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
  const normalizeText = (value: string) => value.trim().toLowerCase()
  const normalizeAmount = (value: string) => value.replace(/[^0-9.-]/g, "")
  const aiRecommendedDealId = documentSourceDeals
    .map((candidate) => ({
      id: candidate.id,
      score:
        (readCounterparty &&
        normalizeText(candidate.party) === normalizeText(readCounterparty)
          ? 4
          : 0) +
        (readCurrency &&
        normalizeText(candidate.currency) === normalizeText(readCurrency)
          ? 2
          : 0) +
        (readAmountField?.value &&
        normalizeAmount(candidate.amount) ===
          normalizeAmount(readAmountField.value)
          ? 3
          : 0),
    }))
    .sort((a, b) => b.score - a.score)[0]
  const recommendedDealId =
    aiRecommendedDealId && aiRecommendedDealId.score > 0
      ? aiRecommendedDealId.id
      : null
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [newDealFormOpen, setNewDealFormOpen] = useState(false)
  const [newDealName, setNewDealName] = useState(aiCounterpartyName)
  const [newDealNumber, setNewDealNumber] = useState(() =>
    prototypeBackend.deals.getNextId()
  )
  const [recommendedNewDealNumber, setRecommendedNewDealNumber] =
    useState(newDealNumber)
  const [bankScheduleId, setBankScheduleId] = useState("")
  const [bankMatchAmount, setBankMatchAmount] = useState(readAmountField?.value ?? "")
  const [bankValueDate, setBankValueDate] = useState(() => new Date().toLocaleDateString("sv-SE"))
  const [newDealDirection, setNewDealDirection] = useState<"sales" | "purchase" | "">("")
  const [candidateLoadState, setCandidateLoadState] = useState<
    "loading" | "ready" | "error"
  >("ready")
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const candidates = documentSourceDeals
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
    documentSourceDeals.find((candidate) => candidate.id === selectedDealId) ??
    null
  const bankSchedules = eligibleBankSchedules(currentBankSchedules(), selectedDealId ?? "", readCurrency)
  const bankMatchRequired = document.documentType === "BANK_STATEMENT" && Boolean(selectedCandidate) && !newDealFormOpen
  const bankCashError = bankScheduleId && bankScheduleId !== "document-only"
    ? bankCashValidation({ scheduleId: bankScheduleId, amount: bankMatchAmount, currency: readCurrency, valueDate: bankValueDate }, bankSchedules)
    : null
  const bankMatchIncomplete = bankMatchRequired && (!bankScheduleId || Boolean(bankCashError))
  const hasReadCounterparty = aiCounterpartyName.length > 0
  const newDealReady =
    newDealFormOpen &&
    newDealName.trim().length > 0 &&
    newDealNumber.trim().length > 0 && Boolean(newDealDirection)
  const prepareNewDealForm = () => {
    const nextDealNumber = prototypeBackend.deals.getNextId()
    setSelectedDealId(null)
    setNewDealName(aiCounterpartyName)
    setRecommendedNewDealNumber(nextDealNumber)
    setNewDealNumber(nextDealNumber)
  }
  const retryCandidateLoad = () => {
    setCandidateLoadState("loading")
    window.setTimeout(() => setCandidateLoadState("ready"), 500)
  }
  const handleCandidateSelect = (candidate: DocumentSourceDeal) => {
    setNewDealFormOpen(false)
    setSelectedDealId(candidate.id)
    if (document.documentType !== "BANK_STATEMENT") return

    setBankScheduleId("")
  }

  const handleLink = async () => {
    if (linking) return
    try {
      if (newDealReady) {
        const counterpartyName = newDealName.trim()
        const newDealId = newDealNumber.trim()
        if (!hasReadCounterparty) {
          const counterpartyResult =
            await prototypeBackend.counterparties.create({
              name: counterpartyName,
            })
          if (!counterpartyResult.ok) {
            toast.error(counterpartyResult.error)
            return
          }
        }
        const result = await prototypeBackend.deals.create({
          id: newDealId,
          title: `${counterpartyName} 신규 거래`,
          counterparty: counterpartyName,
          direction: newDealDirection as "sales" | "purchase",
          amount: normalizeDecimalInput(readAmountField?.value ?? "0"),
          currency: readCurrency || "USD",
        })
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        await onLinkDeal(result.id, `${result.id} · ${counterpartyName}`)
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
      )
    } catch {
      toast.error("거래 연결 중 오류가 발생했습니다. 다시 시도해 주세요.")
    }
  }
  const openConnectionRequirement = () => focusDocumentRequirement('[data-document-requirement="connection"]')
  const connectionErrors: DocumentBlockingIssue[] = linkedDealLabel ? [] : [
    ...(bankCashError ? [{ key: "bank", label: bankCashError, onSelect: openConnectionRequirement }] : []),
    ...(newDealFormOpen ? [
      ...(!newDealName.trim() ? [{ key: "name", label: "거래처명 · 필수값 누락", onSelect: openConnectionRequirement }] : []),
      ...(!newDealNumber.trim() ? [{ key: "number", label: "거래번호 · 필수값 누락", onSelect: openConnectionRequirement }] : []),
      ...(!newDealDirection ? [{ key: "direction", label: "매입·매출 구분 선택", onSelect: openConnectionRequirement }] : []),
    ] : []),
  ]
  const connectionChecks: DocumentBlockingIssue[] = linkedDealLabel ? [] : [
    ...(!selectedCandidate && !newDealFormOpen ? [{ key: "deal", label: "연결할 거래 선택", onSelect: openConnectionRequirement }] : []),
    ...(bankMatchRequired && !bankScheduleId ? [{ key: "schedule", label: "결제 일정 또는 서류만 연결 선택", onSelect: openConnectionRequirement }] : []),
  ]
  const primaryAction = (
    <>
    <DocumentBlockingAlerts errors={connectionErrors} checks={connectionChecks} />
    <Button
      size="sm"
      disabled={
        Boolean(linkedDealLabel) ||
        candidateLoadState !== "ready" ||
        (!selectedCandidate && !newDealReady) ||
        bankMatchIncomplete ||
        linking
      }
      onClick={() => void handleLink()}
    >
      {linking ? (
        <LoaderCircle className="animate-spin" data-icon="inline-start" />
      ) : null}
      {linking
        ? newDealReady
          ? hasReadCounterparty
            ? "거래 생성·연결 중"
            : "거래처·거래 생성 중"
          : "연결 중"
        : linkedDealLabel
          ? "거래 연결 완료"
          : newDealReady
            ? hasReadCounterparty
              ? "새 거래 생성·연결"
              : "거래처·거래 생성·연결"
            : bankMatchIncomplete
              ? "결제 일정 선택 필요"
              : "선택한 거래 연결"}
    </Button>
    </>
  )

  return (
    <>
      {actionPortalTarget
        ? createPortal(primaryAction, actionPortalTarget)
        : null}
      <div className="flex min-h-0 flex-1 flex-col bg-[var(--surface-background)]">
        <div className="flex min-h-16 shrink-0 items-center justify-between border-b px-5 py-2">
          <div className="min-w-0 pr-3">
            <div className="text-sm font-semibold">거래 연결</div>
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
            {linkedDealLabel ? (
              <section className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 px-4 py-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                  <Check className="size-4" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold">연결된 거래</div>
                  <div className="mt-1 truncate text-[11px] text-muted-foreground">
                    {linkedDealLabel}
                  </div>
                </div>
              </section>
            ) : null}
            {documentDealValues.length > 0 ? (
              <section className="rounded-lg border border-[var(--surface-border)] bg-background px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold">
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
                      className="min-w-0 border-t border-[var(--surface-border)] py-2.5 first:border-t-0 sm:border-t-0 sm:border-l sm:px-3 sm:first:border-l-0 sm:first:pl-0 sm:last:pr-0"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <dt className="truncate text-[10px] text-muted-foreground">
                          {field.label}
                        </dt>
                        <span className="ml-auto flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
                          <span
                            aria-hidden="true"
                            className={cn(
                              "size-1.5 rounded-full",
                              field.tone === "success"
                                ? "bg-[var(--color-green-2)]"
                                : "bg-[var(--color-orange-2)]"
                            )}
                          />
                          {field.confidence}
                        </span>
                      </div>
                      <dd
                        className="mt-1 truncate text-xs font-semibold"
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

            <section>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Building2 className="size-4 text-primary" />
                    거래 후보
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    거래처·식별번호·금액 등 일치 근거를 기준으로 찾았습니다.
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
                    disabled={candidateLoadState !== "ready"}
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
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <>
                  {newDealFormOpen ? (
                    <div className="mt-3 rounded-lg border border-primary/30 bg-background p-4">
                      <div>
                        <div className="text-sm font-semibold">
                          {hasReadCounterparty
                            ? "새 거래 등록"
                            : "새 거래처와 거래 등록"}
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {hasReadCounterparty
                            ? "문서에서 확인한 거래처에 거래번호를 등록하고 바로 연결합니다."
                            : "문서에서 거래처를 확인하지 못했습니다. 새 거래처명과 거래번호를 함께 등록합니다."}
                        </p>
                      </div>
                      <Field className="mt-3 gap-1.5">
                        <FieldLabel className="text-xs">거래 방향</FieldLabel>
                        <Select value={newDealDirection} onValueChange={(value) => { if (value === "sales" || value === "purchase") setNewDealDirection(value) }}>
                          <SelectTrigger aria-label="새 거래 방향"><SelectValue placeholder="매출·매입을 확인해 주세요" /></SelectTrigger>
                          <SelectContent><SelectItem value="sales">매출 · 받을 돈</SelectItem><SelectItem value="purchase">매입 · 보낼 돈</SelectItem></SelectContent>
                        </Select>
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
                    </div>
                  ) : null}

                  {documentSourceDeals.length === 0 ? (
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
                        className="mt-3 overflow-hidden rounded-lg border border-[var(--surface-border)]"
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
                                "flex w-full items-center gap-3 border-b border-[var(--surface-border)] px-4 py-3 text-left last:border-b-0 hover:bg-muted/40",
                                selected && "bg-primary/5"
                              )}
                              onClick={() => handleCandidateSelect(candidate)}
                            >
                              <span
                                className={cn(
                                  "flex size-4 shrink-0 items-center justify-center rounded-full border",
                                  selected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-[var(--surface-border)] bg-background"
                                )}
                              >
                                {selected ? (
                                  <Check className="size-2.5" />
                                ) : null}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex min-w-0 items-center gap-2">
                                  <strong className="truncate text-xs">
                                    {candidate.title}
                                  </strong>
                                  <ToneBadge tone={candidate.tone}>
                                    {candidate.stage}
                                  </ToneBadge>
                                </span>
                                <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                                  {candidate.id} · {candidate.party}
                                </span>
                                <span className="mt-1 block truncate text-[11px] text-primary">
                                  {candidate.item} · {candidate.amount}{" "}
                                  {candidate.currency}
                                </span>
                              </span>
                              {recommended ? (
                                <span className="flex min-h-12 shrink-0 items-center gap-1.5 border-l border-[var(--surface-border)] pl-4 text-xs font-semibold text-primary">
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

                      {selectedCandidate ? (
                        document.documentType === "BANK_STATEMENT" ? (
                          <section className="mt-3 rounded-lg border border-[var(--color-blue-5)] bg-background p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold">
                                  결제 일정에 매칭
                                </div>
                                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                                  같은 통화의 미결제 일정을 선택하면 문서 연결과
                                  정산 현금 기록을 함께 처리합니다.
                                </p>
                              </div>
                              <ToneBadge tone="blue">{readCurrency || "통화 확인 필요"}</ToneBadge>
                            </div>

                            <div
                              className="mt-3 grid gap-2"
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
                                    "flex cursor-pointer items-start gap-2 rounded-md border bg-background px-3 py-2",
                                    bankScheduleId === schedule.id
                                      ? "border-primary"
                                      : "border-[var(--surface-border)]"
                                  )}
                                >
                                  <input
                                    type="radio"
                                    name="bank-payment-schedule"
                                    className="mt-0.5"
                                    checked={bankScheduleId === schedule.id}
                                    onChange={() =>
                                      setBankScheduleId(schedule.id)
                                    }
                                  />
                                  <span className="min-w-0">
                                    <span className="block text-xs font-medium">
                                      {schedule.label}
                                    </span>
                                    <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                                      {schedule.meta}
                                    </span>
                                  </span>
                                </label>
                              ))}
                            </div>

                            {bankScheduleId !== "document-only" && bankSchedules.length > 0 ? <div className="mt-3 grid grid-cols-2 gap-3">
                              <Field className="gap-1.5">
                                <FieldLabel className="text-[11px]">
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
                                <FieldLabel className="text-[11px]">
                                  입금일
                                </FieldLabel>
                                <Input
                                  type="date"
                                  aria-label="입출금일"
                                  value={bankValueDate}
                                  onChange={(event) =>
                                    setBankValueDate(event.target.value)
                                  }
                                />
                              </Field>
                            </div> : null}
                            {bankMatchIncomplete ? (
                              <p role="status" className="mt-2 text-[11px] font-medium text-[var(--color-orange-2)]">
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
            </section>
          </div>
        </ScrollArea>
      </div>
    </>
  )
}

const generatedDraftReuseFacts: Record<string, string[]> = {
  "SC-2026-0708": [
    "거래처 ACME GmbH",
    "조건 CIF Hamburg",
    "금액 2,400,000.00 USD",
  ],
  "CI-2026-0708": ["은행 거절 전 점검", "거래 연결됨", "통화 USD"],
  "CI-2026-0712": ["은행 거절 전 점검", "거래처명 불일치", "확정 차단"],
  "CI-2026-0703": ["품목 Aluminium Scrap", "수량 20 MT", "통화 USD"],
  "CI-2026-0704": ["Magic Link 활성", "이메일 전달 전", "거래 연결됨"],
  "QT-2026-0630": ["운임 Hamburg", "선사 HMM", "ETA 08.03"],
  "SOA-2026-0629": ["정산 6월", "미수금 없음", "고객 전달 완료"],
}

type DealDocumentContext = {
  id: string
  title: string
  party: string
}

type DocumentComparisonFacts = {
  counterparty: string
  currency: string
  bankName: string
  bankAccount: string
  itemNames: string[]
  totalAmount: string | null
}

type DocumentSourceDeal = DealDocumentContext & {
  amount: string
  currency: string
  item: string
  stage: string
  tone: Tone
}

const dealDocumentContexts: Record<string, DealDocumentContext> = {
  "DL-260708-08": {
    id: "DL-260708-08",
    title: "ACME 7월 상업송장 거래",
    party: "ACME GmbH",
  },
  "DL-260708-01": {
    id: "DL-260708-01",
    title: "7월 알루미늄 스크랩 수입",
    party: "KATAMAN ASIA-PACIFIC PTE LTD",
  },
  "DL-260707-04": {
    id: "DL-260707-04",
    title: "ACME 7월 해상운송 계약",
    party: "ACME GmbH",
  },
  "DL-260704-02": {
    id: "DL-260704-02",
    title: "부산항 산업재 수입",
    party: "Nordic Raw Materials AB",
  },
  "DL-260701-09": {
    id: "DL-260701-09",
    title: "한빛 6월 정산 거래",
    party: "Hanbit Trading Co.",
  },
  "DL-260629-03": {
    id: "DL-260629-03",
    title: "싱가포르 구리 스크랩 매입",
    party: "Meridian Metals Pte Ltd",
  },
  "DL-260625-07": {
    id: "DL-260625-07",
    title: "일본 내륙운송 발주",
    party: "Sakura Logistics KK",
  },
}

const documentSourceDeals: DocumentSourceDeal[] = [
  {
    ...dealDocumentContexts["DL-260708-08"],
    amount: "2,566,660",
    currency: "USD",
    item: "Aluminium Scrap · 20 MT",
    stage: "은행 제출 전",
    tone: "warning",
  },
  {
    ...dealDocumentContexts["DL-260708-01"],
    amount: "2,400,000",
    currency: "USD",
    item: "Aluminium Scrap · 20 MT",
    stage: "선적 중",
    tone: "blue",
  },
  {
    ...dealDocumentContexts["DL-260707-04"],
    amount: "380,000",
    currency: "USD",
    item: "Ocean Freight · 1 LOT",
    stage: "계약 검토",
    tone: "warning",
  },
  {
    ...dealDocumentContexts["DL-260704-02"],
    amount: "940,000",
    currency: "EUR",
    item: "Industrial Materials · 12 PKG",
    stage: "통관 중",
    tone: "blue",
  },
  {
    ...dealDocumentContexts["DL-260701-09"],
    amount: "620,000",
    currency: "USD",
    item: "정산 품목 · 4건",
    stage: "정산 대기",
    tone: "neutral",
  },
  {
    ...dealDocumentContexts["DL-260629-03"],
    amount: "510,000",
    currency: "USD",
    item: "Copper Scrap · 18 MT",
    stage: "계약 완료",
    tone: "success",
  },
  {
    ...dealDocumentContexts["DL-260625-07"],
    amount: "72,000",
    currency: "JPY",
    item: "Inland Freight · 1 LOT",
    stage: "발주 완료",
    tone: "success",
  },
]

const getDealDocumentContext = (dealId: string): DealDocumentContext =>
  dealDocumentContexts[dealId] ?? {
    id: dealId,
    title: "거래 관련 문서",
    party: "거래처 미지정",
  }

const getGeneratedDocumentsForDeal = (dealId: string) =>
  generatedDrafts.filter((draft) => draft.dealId === dealId)

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

function RecentDocumentsTable({
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
            <TableHead className="w-[30%] text-left">문서</TableHead>
            <TableHead className="w-[15%] text-left">Deal</TableHead>
            <TableHead className="w-[10%]">상태</TableHead>
            <TableHead className="w-[13%] text-left">생성자</TableHead>
            <TableHead className="w-[12%] text-left">수정</TableHead>
            <TableHead className="w-[20%] text-right">작업</TableHead>
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
                  ? "PDF 초안 보기"
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
                    <span className="truncate text-sm font-semibold">
                      {draft.title}
                    </span>
                  </div>
                  <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
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
                <TableCell>
                  <ToneBadge tone={draft.tone}>{draft.status}</ToneBadge>
                  {draft.approvalPreviewState === "requester-pending" ? (
                    <div className="mt-1"><ToneBadge tone="warning">승인 대기</ToneBadge></div>
                  ) : draft.approvalPreviewState === "requester-approved" ? (
                    <div className="mt-1"><ToneBadge tone="success">승인 완료</ToneBadge></div>
                  ) : draft.approvalPreviewState === "requester-rejected" ? (
                    <div className="mt-1"><ToneBadge tone="danger">반려</ToneBadge></div>
                  ) : null}
                  <div
                    className="mt-1 truncate text-[11px] text-muted-foreground"
                    title={draft.readiness}
                  >
                    {draft.readiness}
                  </div>
                </TableCell>
                <TableCell className="truncate text-left">
                  <span
                    className="text-sm"
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
                              draft.pdfState === "final" && "text-emerald-700"
                            )}
                            aria-label={`${draft.title} ${pdfStateLabel}`}
                            disabled={draft.pdfState === "none"}
                            onClick={(event) => {
                              event.stopPropagation()
                              openDraft(rowDestination)
                            }}
                          >
                            <PdfStateIcon className="size-4" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{pdfStateLabel}</TooltipContent>
                    </Tooltip>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground"
                      aria-label={`${draft.title} 메뉴`}
                      onClick={(event) => {
                        event.stopPropagation()
                        setOpenMenu(
                          openMenu === draft.number ? null : draft.number
                        )
                      }}
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                    {openMenu === draft.number ? (
                      <div className="absolute top-12 right-3 z-10 min-w-36 rounded-md border bg-background p-1 shadow-lg">
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-auto w-full justify-start px-2 py-1.5"
                          onClick={(event) => {
                            event.stopPropagation()
                            setOpenMenu(null)
                            void onDuplicate(draft)
                          }}
                        >
                          <Copy className="size-3.5" /> 복제하여 수정
                        </Button>
                        {canDelete ? (
                          <Button
                            variant="destructive"
                            size="xs"
                            className="h-auto w-full justify-start px-2 py-1.5"
                            onClick={(event) => {
                              event.stopPropagation()
                              setOpenMenu(null)
                              setDeleteError("")
                              setDeleteTarget(draft)
                            }}
                          >
                            <Trash2 className="size-3.5" /> 삭제
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
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

function TemplateStrip({ onResult }: {
  onResult: (mode?: CreateStartMode, templateCode?: string, options?: GeneratedDocumentOpenOptions) => void
}) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [scrollState, setScrollState] = useState({ previous: false, next: false })
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const update = () => setScrollState({
      previous: viewport.scrollLeft > 1,
      next: viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 1,
    })
    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    viewport.addEventListener("scroll", update, { passive: true })
    update()
    return () => {
      observer.disconnect()
      viewport.removeEventListener("scroll", update)
    }
  }, [])
  const scroll = (direction: number) => {
    const viewport = viewportRef.current
    viewport?.scrollBy({
      left: direction * viewport.clientWidth * 0.8,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    })
  }
  return (
    <section aria-label="문서 폼 선택" className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">문서 유형 선택</h2>
          <ToneBadge tone="neutral">{templates.length}개</ToneBadge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" aria-label="이전 문서 유형" disabled={!scrollState.previous} onClick={() => scroll(-1)}><ChevronLeft /></Button>
          <Button variant="outline" size="icon-sm" aria-label="다음 문서 유형" disabled={!scrollState.next} onClick={() => scroll(1)}><ChevronRight /></Button>
          <Button size="sm" disabled={!selectedCode} onClick={() => selectedCode && onResult("template", selectedCode)}>
            <FilePlus2 data-icon="inline-start" />문서 만들기
          </Button>
        </div>
      </div>
      <div ref={viewportRef} aria-label="문서 유형 목록" className="flex min-w-0 snap-x snap-proximity gap-3 overflow-x-auto overscroll-x-contain px-0.5 pt-0.5 pb-3">
        {templates.map(([kind, title, description]) => {
          const selected = selectedCode === kind
          return (
            <button key={kind} type="button" aria-pressed={selected}
              onClick={() => setSelectedCode(kind)}
              className={cn("flex w-60 shrink-0 snap-start flex-col items-start rounded-lg border bg-card p-4 text-left transition hover:border-primary/60 focus-visible:outline-2 focus-visible:outline-primary", selected && "border-primary bg-primary/5 ring-1 ring-primary")}
            >
              <span className="flex w-full items-center justify-between gap-2"><ToneBadge tone="blue">{kind}</ToneBadge>{selected && <Check className="size-4 text-primary" />}</span>
              <strong className="mt-2 text-sm">{title} <span className="text-xs font-normal text-muted-foreground">· {kind === "PO" ? "매입" : "매입·매출"}</span></strong>
              <span className="mt-1.5 text-xs leading-5 text-muted-foreground">{description}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function RelatedDealNotice({
  deal,
  compact = false,
}: {
  deal: DealDocumentContext
  compact?: boolean
}) {
  return (
    <Item
      variant="muted"
      size={compact ? "xs" : "default"}
      className={cn(
        "mx-auto mb-4 flex-nowrap text-left",
        !compact && "max-w-3xl"
      )}
    >
      <ItemMedia variant="icon">
        <FileText className="size-4 shrink-0 text-primary" />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemDescription className="text-xs">
          이 거래와 연결해 문서를 만듭니다
        </ItemDescription>
        <ItemTitle className="truncate text-sm font-semibold">
          {deal.title}
        </ItemTitle>
      </ItemContent>
      <ItemActions className="block shrink-0 text-right">
        <div className="text-xs font-medium">{deal.id}</div>
        <div className="max-w-52 truncate text-xs text-[var(--surface-muted-foreground)]">
          {deal.party}
        </div>
      </ItemActions>
    </Item>
  )
}

type QuotationLineItem = {
  id: number
  name: string
  quantity: string
  unitPrice: string
}

type QuotationDraft = {
  party: string
  number: string
  issuedAt: string
  validUntil: string
  paymentTerms: string
  shippingTerms: string
}

function quotationDecimal(value: string) {
  const amount = decimalMagnitude(normalizeDecimalInput(value), FINANCE_DECIMAL_SCALE)
  return amount === null ? "—" : formatScaledDecimal(amount, FINANCE_DECIMAL_SCALE)
}

function quotationMoney(value: string | number) {
  const amount = decimalMagnitude(normalizeDecimalInput(String(value)), FINANCE_DECIMAL_SCALE)
  return amount === null ? "—" : formatScaledDecimal(amount, FINANCE_DECIMAL_SCALE, "en-US", 2)
}

function quotationDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function QuotationPreviewPaper({
  draft,
  items,
  page = 1,
  pageCount = 1,
}: {
  draft: QuotationDraft
  items: QuotationLineItem[]
  page?: number
  pageCount?: number
}) {
  const freight = "800"
  const { subtotal, grandTotal } = exactDocumentMoneyTotals(
    items.map((item) => ({ quantity: item.quantity, unit_price: item.unitPrice })),
    { freightCharge: freight },
  )

  return (
    <div
      data-document-paper
      className="relative mx-auto aspect-[0.72] w-[min(94%,520px)] max-w-[520px] rounded-[var(--r-xs)] border border-[var(--surface-border)] bg-[var(--color-gray-12)] px-9 py-10 text-[var(--color-indigo)] shadow-[var(--shadow-section)]"
    >
      <div className="flex items-start justify-between gap-8">
        <div className="text-[10px] leading-3 font-bold tracking-[0.16em] text-[var(--color-primary-2)] uppercase">
          ECOYA
          <br />
          CORPORATION
        </div>
        <div className="text-[26px] font-medium tracking-[0.14em]">
          QUOTATION
        </div>
      </div>
      <div className="mt-7 h-[3px] bg-[var(--color-primary-2)]" />

      <div className="mt-8 grid grid-cols-2 gap-10 text-[8px] leading-4">
        <div>
          <div className="font-semibold tracking-wide text-[var(--color-gray-5)]">
            TO
          </div>
          <div className="mt-1 font-semibold uppercase">
            {draft.party || "거래처를 입력해주세요"}
          </div>
          <div>Ningbo, Zhejiang, China</div>
          <div>Attn: Purchasing Team</div>
        </div>
        <div>
          <div className="font-semibold tracking-wide text-[var(--color-gray-5)]">
            QUOTATION DETAILS
          </div>
          <div className="mt-1">Quotation No. {draft.number}</div>
          <div>Date: {draft.issuedAt.replaceAll("-", ". ")}</div>
          <div>Valid Until: {draft.validUntil.replaceAll("-", ". ")}</div>
        </div>
      </div>

      <div className="mt-8 overflow-hidden border-y border-[var(--color-gray-9)] text-[8px]">
        <div className="grid grid-cols-[1fr_52px_72px_82px] bg-[var(--color-gray-11)] text-[7px] font-semibold tracking-wide">
          {["DESCRIPTION", "QTY", "UNIT PRICE", "AMOUNT"].map(
            (label, index) => (
              <div
                key={label}
                className={cn("px-2 py-2", index > 0 && "text-right")}
              >
                {label}
              </div>
            )
          )}
        </div>
        {items.map((item) => {
          const amount =
            exactLineItemAmount(item.quantity, item.unitPrice)
          return (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_52px_72px_82px] border-t border-[var(--color-gray-10)]"
            >
              <div className="truncate px-2 py-3">{item.name || "-"}</div>
              <div className="px-2 py-3 text-right">
                {quotationDecimal(item.quantity)}
              </div>
              <div className="px-2 py-3 text-right">
                {quotationDecimal(item.unitPrice)}
              </div>
              <div className="px-2 py-3 text-right">
                {quotationMoney(amount)}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 ml-auto w-48 text-[8px]">
        <div className="flex justify-between border-b border-[var(--color-gray-9)] py-1.5">
          <span>SUBTOTAL</span>
          <span>{quotationMoney(subtotal)}</span>
        </div>
        <div className="flex justify-between border-b border-[var(--color-gray-9)] py-1.5">
          <span>FREIGHT</span>
          <span>{quotationMoney(freight)}</span>
        </div>
        <div className="flex justify-between border-b-2 border-[var(--color-primary-2)] py-2 text-[9px] font-bold">
          <span>TOTAL USD</span>
          <span>{quotationMoney(grandTotal)}</span>
        </div>
      </div>

      <div className="mt-8 text-[7px] leading-4">
        <div className="font-semibold text-[var(--color-gray-5)]">
          PAYMENT TERMS
        </div>
        <div>{draft.paymentTerms}</div>
        <div className="mt-3 font-semibold text-[var(--color-gray-5)]">
          SHIPPING TERMS
        </div>
        <div>{draft.shippingTerms}</div>
      </div>
      <div className="absolute right-0 bottom-4 left-0 text-center text-[7px] text-[var(--color-gray-6)]">
        PAGE {page} OF {pageCount}
      </div>
    </div>
  )
}

function StructuredDocumentCreateEditor({
  onCreate,
  onOpenSettings,
  relatedDeal,
}: {
  onCreate: (mode?: CreateStartMode, templateCode?: string) => void
  onOpenSettings: () => void
  relatedDeal?: DealDocumentContext | null
}) {
  const [draft, setDraft] = useState<QuotationDraft>({
    party: relatedDeal?.party ?? "Ningbo T&S Import Co., Ltd.",
    number: "QT-2026-0082",
    issuedAt: "2026-08-25",
    validUntil: "2026-09-01",
    paymentTerms: "T/T 30% deposit, balance before shipment.",
    shippingTerms: "FOB NINGBO · Estimated delivery: 30 days",
  })
  const [items, setItems] = useState<QuotationLineItem[]>([
    {
      id: 1,
      name: "Stainless Steel Valve A-20",
      quantity: "1250",
      unitPrice: "12.80",
    },
    {
      id: 2,
      name: "Industrial Hose B-12",
      quantity: "200",
      unitPrice: "15.00",
    },
  ])
  const [termsOpen, setTermsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [saveState, setSaveState] = useState<
    "saved" | "dirty" | "saving" | "error"
  >("saved")
  const [lastSavedAt, setLastSavedAt] = useState(() => new Date())
  const [creating, setCreating] = useState(false)
  const nextItemIdRef = useRef(3)
  const draftRevisionRef = useRef(0)
  const savedDraftRevisionRef = useRef(0)
  const saveRequestRef = useRef<Promise<boolean> | null>(null)

  const markDirty = () => {
    draftRevisionRef.current += 1
    setSaveState("dirty")
  }
  const updateDraft = (key: keyof QuotationDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }))
    markDirty()
  }
  const updateItem = (
    id: number,
    key: keyof Omit<QuotationLineItem, "id">,
    value: string
  ) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    )
    markDirty()
  }
  const handleSave = useCallback(() => {
    if (saveRequestRef.current) return saveRequestRef.current
    if (draftRevisionRef.current === savedDraftRevisionRef.current) {
      return Promise.resolve(true)
    }
    const revision = draftRevisionRef.current
    setSaveState("saving")
    const request = Promise.all([
      prototypeBackend.generatedDocuments.saveDraft({ id: draft.number }),
      new Promise<void>((resolve) => window.setTimeout(resolve, 800)),
    ])
      .then(([result]) => {
        if (!result.ok) {
          setSaveState("error")
          toast.error(result.error)
          return false
        }
        savedDraftRevisionRef.current = revision
        if (draftRevisionRef.current === revision) {
          setSaveState("saved")
          setLastSavedAt(new Date(result.updatedAt))
        } else {
          setSaveState("dirty")
        }
        return true
      })
      .catch(() => {
        setSaveState("error")
        toast.error("견적서 초안을 저장하지 못했습니다.")
        return false
      })
      .finally(() => {
        saveRequestRef.current = null
      })
    saveRequestRef.current = request
    return request
  }, [draft.number])
  const handleCreate = async () => {
    if (creating) return
    if (draftRevisionRef.current !== savedDraftRevisionRef.current) {
      const saved = await handleSave()
      if (!saved) return
    }
    setCreating(true)
    const result = await prototypeBackend.generatedDocuments.create({
      id: draft.number,
    })
    if (!result.ok) {
      setCreating(false)
      toast.error(result.error)
      return
    }
    toast.success("견적서를 만들었습니다.")
    onCreate("generated", "QT")
  }
  const { subtotal } = exactDocumentMoneyTotals(
    items.map((item) => ({ quantity: item.quantity, unit_price: item.unitPrice })),
    {},
  )

  return (
    <div className="flex min-h-[calc(100svh-var(--header-height))] flex-col overflow-hidden bg-background p-3 sm:p-4">
      <Card
        className="min-h-[720px] flex-1 bg-[var(--surface-background)]!"
        onBlurCapture={() => {
          if (saveState === "dirty") void handleSave()
        }}
      >
        <div className="flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b border-[var(--surface-border)] bg-[var(--surface-background)] px-4 py-2">
          <div className="mr-auto min-w-0">
            <h1 className="text-sm font-semibold">견적서 만들기</h1>
            <p className="truncate text-[11px] text-[var(--surface-muted-foreground)]">
              내용을 작성하면서 오른쪽 문서 결과를 바로 확인합니다.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 data-icon="inline-start" /> 문서 설정
          </Button>
          <AutoSaveStatus
            className="hidden lg:flex"
            state={
              saveState === "dirty"
                ? "pending"
                : saveState === "saving"
                  ? "saving"
                  : saveState === "error"
                    ? "error"
                    : "saved"
            }
            savedAt={lastSavedAt}
          />
          {saveState === "error" ? (
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => void handleSave()}
            >
              다시 저장
            </Button>
          ) : null}
          <AsyncButton
            size="sm"
            loading={creating}
            loadingLabel="견적서 생성 중"
            onClick={handleCreate}
          >
            문서 만들기 <ChevronRight data-icon="inline-end" />
          </AsyncButton>
        </div>

        {relatedDeal ? (
          <div className="shrink-0 px-4 pt-4">
            <RelatedDealNotice deal={relatedDeal} compact />
          </div>
        ) : null}

        <div className="flex min-h-[640px] flex-1 overflow-hidden">
          <ResizablePanelGroup
            orientation="horizontal"
            className="min-h-0 flex-1"
          >
            <ResizablePanel defaultSize="52%" minSize="38%" maxSize="68%">
              <section className="flex h-full min-h-0 flex-col bg-[var(--surface-background)]">
                <div className="flex min-h-17 shrink-0 items-center justify-between gap-4 border-b border-[var(--surface-border)] bg-[var(--surface-background)] px-5 py-3">
                  <div>
                    <h2 className="text-sm font-semibold">견적 정보</h2>
                    <p className="mt-1 text-[11px] text-[var(--surface-muted-foreground)]">
                      필수 항목을 입력하면 미리보기에 바로 반영됩니다.
                    </p>
                  </div>
                  <div className="text-[11px] text-[var(--surface-muted-foreground)]">
                    <strong className="text-[var(--color-green-1)]">
                      필수 6/6
                    </strong>{" "}
                    · 확인 1
                  </div>
                </div>

                <div className="field-scrollbar min-h-0 flex-1 overflow-y-auto">
                  <section>
                    <div className="px-5 py-3 text-sm font-semibold">
                      기본 정보{" "}
                      <span className="ml-1 text-xs font-normal text-[var(--surface-muted-foreground)]">
                        필수 4개
                      </span>
                    </div>
                    <FieldGroup className="divide-y divide-[var(--surface-border)] border-y border-[var(--surface-border)]">
                      <Field className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 px-5 py-4">
                        <div className="pt-2">
                          <FieldLabel className="text-xs">거래처</FieldLabel>
                          <span className="mt-1 block text-[10px] text-[var(--surface-muted-foreground)]">
                            필수
                          </span>
                        </div>
                        <div className="min-w-0">
                          <Input
                            value={draft.party}
                            onChange={(event) =>
                              updateDraft("party", event.target.value)
                            }
                          />
                        </div>
                      </Field>
                      <Field className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 px-5 py-4">
                        <div className="pt-2">
                          <FieldLabel className="text-xs">견적 번호</FieldLabel>
                          <span className="mt-1 block text-[10px] text-[var(--surface-muted-foreground)]">
                            자동 생성
                          </span>
                        </div>
                        <div className="min-w-0">
                          <Input
                            value={draft.number}
                            onChange={(event) =>
                              updateDraft("number", event.target.value)
                            }
                          />
                        </div>
                      </Field>
                      <Field className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 px-5 py-4">
                        <div className="pt-2">
                          <FieldLabel className="text-xs">견적일</FieldLabel>
                          <span className="mt-1 block text-[10px] text-[var(--surface-muted-foreground)]">
                            필수
                          </span>
                        </div>
                        <div className="min-w-0">
                          <DatePicker
                            className="w-full [&>button]:w-full"
                            value={quotationDate(draft.issuedAt)}
                            ariaLabel="견적일"
                            allowClear={false}
                            onChange={(_value, formattedValue) =>
                              formattedValue &&
                              updateDraft("issuedAt", formattedValue)
                            }
                          />
                        </div>
                      </Field>
                      <Field className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 px-5 py-4">
                        <div className="pt-2">
                          <FieldLabel className="text-xs">유효기간</FieldLabel>
                          <span className="mt-1 block text-[10px] text-[var(--color-orange-2)]">
                            확인 필요
                          </span>
                        </div>
                        <div className="min-w-0">
                          <DatePicker
                            className="w-full [&>button]:w-full [&>button]:border-[var(--color-orange-2)]!"
                            value={quotationDate(draft.validUntil)}
                            ariaLabel="유효기간"
                            allowClear={false}
                            onChange={(_value, formattedValue) =>
                              formattedValue &&
                              updateDraft("validUntil", formattedValue)
                            }
                          />
                          <FieldDescription className="text-[10px] text-[var(--color-orange-2)]">
                            기본 유효기간 14일보다 짧습니다.
                          </FieldDescription>
                        </div>
                      </Field>
                    </FieldGroup>
                  </section>

                  <section className="border-b border-[var(--surface-border)]">
                    <div className="px-5 py-3 text-sm font-semibold">
                      품목 정보{" "}
                      <span className="ml-1 text-xs font-normal text-[var(--surface-muted-foreground)]">
                        {items.length}개 품목 · USD {quotationMoney(subtotal)}
                      </span>
                    </div>
                    <div data-layout="flush-table">
                      <Table className="min-w-[540px] table-fixed">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[42%] text-left!">
                              품목
                            </TableHead>
                            <TableHead className="w-[16%] text-left!">
                              수량
                            </TableHead>
                            <TableHead className="w-[18%] text-left!">
                              단가
                            </TableHead>
                            <TableHead className="w-[16%] text-right!">
                              금액
                            </TableHead>
                            <TableHead className="w-[8%]" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item) => {
                            const amount =
                              exactLineItemAmount(item.quantity, item.unitPrice)
                            return (
                              <TableRow key={item.id}>
                                <TableCell className="text-left!">
                                  <Input
                                    value={item.name}
                                    aria-label="품목명"
                                    onChange={(event) =>
                                      updateItem(
                                        item.id,
                                        "name",
                                        event.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-left!">
                                  <Input
                                    inputMode="decimal"
                                    value={item.quantity}
                                    aria-label={`${item.name} 수량`}
                                    onChange={(event) =>
                                      updateItem(
                                        item.id,
                                        "quantity",
                                        event.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-left!">
                                  <Input
                                    inputMode="decimal"
                                    value={item.unitPrice}
                                    aria-label={`${item.name} 단가`}
                                    onChange={(event) =>
                                      updateItem(
                                        item.id,
                                        "unitPrice",
                                        event.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-right! text-xs font-semibold tabular-nums">
                                  ${quotationMoney(amount)}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    aria-label={`${item.name} 삭제`}
                                    disabled={items.length === 1}
                                    onClick={() => {
                                      setItems((current) =>
                                        current.filter(
                                          (currentItem) =>
                                            currentItem.id !== item.id
                                        )
                                      )
                                      markDirty()
                                    }}
                                  >
                                    <Trash2 />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="border-t border-[var(--surface-border)] px-3 py-2 text-center">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          const id = nextItemIdRef.current
                          nextItemIdRef.current += 1
                          setItems((current) => [
                            ...current,
                            { id, name: "", quantity: "1", unitPrice: "0" },
                          ])
                          markDirty()
                        }}
                      >
                        <Plus data-icon="inline-start" /> 품목 추가
                      </Button>
                    </div>
                  </section>

                  <section>
                    <button
                      type="button"
                      className="flex min-h-12 w-full items-center gap-2 border-b border-[var(--surface-border)] px-5 text-left text-xs outline-none focus-visible:[box-shadow:var(--shadow-keyboard-focus)]"
                      aria-expanded={termsOpen}
                      onClick={() => setTermsOpen((current) => !current)}
                    >
                      <strong>거래 조건</strong>
                      <span className="truncate text-[var(--surface-muted-foreground)]">
                        결제 조건, 인도 조건, 운송 정보
                      </span>
                      {termsOpen ? (
                        <ChevronUp className="ml-auto" />
                      ) : (
                        <ChevronDown className="ml-auto" />
                      )}
                    </button>
                    {termsOpen ? (
                      <div className="px-5 py-4">
                        <FieldGroup>
                          <Field className="gap-1.5">
                            <FieldLabel className="text-xs">
                              결제 조건
                            </FieldLabel>
                            <Textarea
                              value={draft.paymentTerms}
                              onChange={(event) =>
                                updateDraft("paymentTerms", event.target.value)
                              }
                            />
                          </Field>
                          <Field className="gap-1.5">
                            <FieldLabel className="text-xs">
                              인도 및 운송 조건
                            </FieldLabel>
                            <Textarea
                              value={draft.shippingTerms}
                              onChange={(event) =>
                                updateDraft("shippingTerms", event.target.value)
                              }
                            />
                          </Field>
                        </FieldGroup>
                      </div>
                    ) : null}
                  </section>
                </div>
              </section>
            </ResizablePanel>
            <PdfPanelResizeHandle label="견적 정보와 PDF 미리보기 너비 조절" />
            <ResizablePanel defaultSize="48%" minSize="32%">
              <DocumentStage
                result
                fitPage
                reviewMode
                pageCountOverride={12}
                templateCode="QT"
                downloadName={`${draft.number}.pdf`}
                previewContent={(page, pageCount) => (
                  <QuotationPreviewPaper
                    draft={draft}
                    items={items}
                    page={page}
                    pageCount={pageCount}
                  />
                )}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </Card>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent className="w-full max-w-md overflow-y-auto p-0">
          <SheetHeader className="border-b px-5 py-4 text-left">
            <SheetTitle>문서 설정</SheetTitle>
            <SheetDescription>
              견적서의 기본 형식과 표시 기준을 정합니다.
            </SheetDescription>
          </SheetHeader>
          <FieldGroup className="p-5">
            <Field className="gap-1.5">
              <FieldLabel className="text-xs">문서 유형</FieldLabel>
              <AppSelect
                value="QT"
                onValueChange={() => undefined}
                options={[["QT", "견적서 (Quotation)"]]}
              />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel className="text-xs">통화</FieldLabel>
              <AppSelect
                value="USD"
                onValueChange={() => undefined}
                options={["USD", "KRW", "EUR", "JPY"]}
              />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel className="text-xs">문서 언어</FieldLabel>
              <AppSelect
                value="en"
                onValueChange={() => undefined}
                options={[
                  ["en", "English"],
                  ["ko", "한국어"],
                ]}
              />
            </Field>
            <Alert variant="gray">
              <AlertDescription className="text-xs leading-5">
                회사 로고와 강조색은 조직의 기본 문서 설정을 사용합니다.
              </AlertDescription>
            </Alert>
            <Separator />
            <div>
              <div className="text-xs font-semibold">작성 방식 변경</div>
              <p className="mt-1 text-xs leading-5 text-[var(--surface-muted-foreground)]">
                AI 요청문이나 다른 템플릿으로 다시 시작할 수 있습니다.
              </p>
              <Button
                className="mt-3 w-full"
                variant="outline"
                onClick={() => {
                  setSettingsOpen(false)
                  onOpenSettings()
                }}
              >
                <Sparkles data-icon="inline-start" /> AI 초안·템플릿 선택
              </Button>
            </div>
          </FieldGroup>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function CreateScreen({
  onResult,
  initialEntryState = "first",
  relatedDeal = null,
  role,
}: {
  onResult: (
    mode?: CreateStartMode,
    templateCode?: string,
    options?: GeneratedDocumentOpenOptions
  ) => void
  initialEntryState?: "history" | "first"
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
    [draft.title, draft.number, draft.party, draft.status].some((value) =>
      value.toLowerCase().includes(documentSearch.trim().toLowerCase())
    )
  )
  const documentTabs = [
    { value: "all", label: "전체", docs: searchedDocuments },
    {
      value: "draft",
      label: "작성 중",
      docs: searchedDocuments.filter(
        (doc) => doc.tab === "draft" || doc.tab === "progress"
      ),
    },
    {
      value: "confirmed",
      label: "확정",
      docs: searchedDocuments.filter(
        (doc) => doc.tab === "confirmed" || doc.tab === "sharing"
      ),
    },
    {
      value: "sent",
      label: "발송됨",
      docs: searchedDocuments.filter((doc) => doc.tab === "done"),
    },
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
  const handleDuplicateCreatedDocument = async (draft: GeneratedDraft) => {
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
      creatorName: currentAccount.name,
      creatorAccountId: currentAccount.id,
      updated: "방금 전",
    }
    setCreatedDocuments((current) => [duplicatedDraft, ...current])
    toast.success(
      `${nextNumber} 작성 중 문서를 만들었습니다. 원본은 변경되지 않습니다.`
    )
    return true
  }
  const openUnifiedWorkbench = (
    _mode?: CreateStartMode,
    templateCode?: string
  ) => {
    setWorkbenchTemplateCode(
      templateCode && templateSchemas[templateCode] ? templateCode : "SC"
    )
    setUnifiedWorkbenchOpen(true)
  }

  if (unifiedWorkbenchOpen) {
    return (
      <ResultScreen
        initialTemplateCode={workbenchTemplateCode}
        relatedDeal={relatedDeal}
        initialWorkspaceStep="source"
        role={role}
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
      <div className="flex h-full min-h-0 flex-col overflow-auto bg-background">
        <div className="mx-auto w-full max-w-ecoya-wide-xl shrink-0 px-5 py-5 sm:px-6 sm:py-6 xl:px-8">
          <BusinessPageHero
            variant="ai"
            eyebrow="AI 문서 작성"
            title="문서 만들기"
            description="유형을 선택하고 문서 만들기를 누르면 작성을 시작합니다."
            align="center"
          />
          {relatedDeal ? <div className="mt-4"><RelatedDealNotice deal={relatedDeal} /></div> : null}
        </div>

        <section className="mx-auto w-full max-w-ecoya-wide-xl shrink-0 space-y-5 px-5 pb-8 sm:px-6 xl:px-8">
          <TemplateStrip onResult={openUnifiedWorkbench} />
        </section>
      </div>
    )
  }

  return (
    <div className="h-full min-h-0 overflow-auto bg-background">
      <section className="mx-auto w-full max-w-ecoya-wide-xl px-5 py-5 sm:px-6 sm:py-6 xl:px-8">
        <section className="mb-7">
          <BusinessPageHero
            variant="ai"
            eyebrow="AI 문서 작성"
            title="문서 만들기"
            description="유형을 선택하고 문서 만들기를 누르면 작성을 시작합니다."
            align="center"
          />
          {relatedDeal ? (
            <div className="mt-4">
              <RelatedDealNotice deal={relatedDeal} compact />
            </div>
          ) : null}
        </section>

        <section className="mb-7">
          <TemplateStrip onResult={openUnifiedWorkbench} />
        </section>

        <section>
          {hasGeneratedDocuments ? (
            <Card>
              <Tabs value={documentListTab} onValueChange={setDocumentListTab}>
                <BusinessListToolbar
                  className="border-b px-4 py-3"
                  aria-label="만든 문서 검색 필터"
                  search={
                    <BusinessFilterSearch
                      label="만든 문서 검색"
                      placeholder="문서번호, 거래처, 상태 검색"
                      value={documentSearch}
                      onValueChange={setDocumentSearch}
                    />
                  }
                  result={`${documentTabs.find((tab) => tab.value === documentListTab)?.docs.length ?? 0}건 표시 중`}
                >
                  <TabsList aria-label="만든 문서 상태">
                    {documentTabs.map((tab) => (
                      <TabsTrigger key={tab.value} value={tab.value}>
                        {tab.label} {tab.docs.length}
                      </TabsTrigger>
                    ))}
                  </TabsList>
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
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 xl:grid-cols-3">
              {templates.map(([kind, title, desc, usage]) => (
                <div
                  key={title}
                  className="group min-h-34 rounded-lg border bg-background p-4 text-left transition hover:border-primary/60 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <ToneBadge tone="blue">{kind}</ToneBadge>
                    <ToneBadge tone="success">시작 가능</ToneBadge>
                  </div>
                  <div className="mt-4 text-base font-semibold tracking-normal">
                    {title}
                  </div>
                  <div className="mt-2 text-sm leading-5 text-muted-foreground">
                    {desc}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <ToneBadge tone="neutral">{usage}</ToneBadge>
                    <ToneBadge tone="success">거래값</ToneBadge>
                    <ToneBadge tone="blue">업로드값</ToneBadge>
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

// Kept as a reference fallback for the earlier three-step document prototype.
function DocumentCreateStepPanel({
  step,
  setStep,
  documentConfirmed,
  elementStatus,
  setElementStatus,
  onStartItem,
  onOpenCopyEditor,
  onOpenSharePanel,
  onCreateMagicLink,
  magicLinkCount,
  onOpenPreview,
  templateCode,
  onTemplateChange,
  documentStyle,
  onStyleChange,
  onFocusReviewField,
  approvalModeEnabled,
}: {
  step: CreateDetailStep
  setStep: (step: CreateDetailStep) => void
  documentConfirmed: boolean
  elementStatus: DocumentElementStatus
  setElementStatus: (status: DocumentElementStatus) => void
  onStartItem: () => void
  onOpenCopyEditor: () => void
  onOpenSharePanel: () => void
  onCreateMagicLink: () => void
  magicLinkCount: number
  onOpenPreview: () => void
  templateCode: string
  onTemplateChange: (code: string) => void
  documentStyle: DocumentStyle
  onStyleChange: (style: DocumentStyle) => void
  onFocusReviewField: (key: string) => void
  approvalModeEnabled: boolean
}) {
  const [, templateTitle] = templateMeta(templateCode)
  const documentStatus = documentConfirmed
    ? "확정 완료"
    : elementStatus.approval === "approved"
      ? "승인 완료"
      : elementStatus.approval === "requested"
        ? "승인 대기"
        : elementStatus.approval === "rejected"
          ? "수정 필요"
          : "작성 중"
  const documentStatusTone: Tone = documentConfirmed
    ? "success"
    : elementStatus.approval === "rejected"
      ? "danger"
      : elementStatus.approval === "requested"
        ? "warning"
        : elementStatus.approval === "approved"
          ? "blue"
          : "neutral"

  return (
    <aside className="flex min-h-0 flex-col border-r bg-sidebar p-6">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Sparkles data-icon="inline-start" /> 문서 구성
          </div>
          <ToneBadge tone={documentStatusTone}>{documentStatus}</ToneBadge>
        </div>
        <h2 className="mt-3 text-[20px] leading-tight font-semibold tracking-normal">
          {templateTitle} 초안
        </h2>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          품목과 문구, 로고와 출력 스타일을 조정하면 PDF에 바로 반영됩니다.
        </p>
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-auto border-t pt-5">
        <DocumentStepPage
          step={step}
          setStep={setStep}
          documentConfirmed={documentConfirmed}
          elementStatus={elementStatus}
          setElementStatus={setElementStatus}
          onStartItem={onStartItem}
          onOpenCopyEditor={onOpenCopyEditor}
          onOpenSharePanel={onOpenSharePanel}
          onCreateMagicLink={onCreateMagicLink}
          magicLinkCount={magicLinkCount}
          onOpenPreview={onOpenPreview}
          templateCode={templateCode}
          onTemplateChange={onTemplateChange}
          documentStyle={documentStyle}
          onStyleChange={onStyleChange}
          onFocusReviewField={onFocusReviewField}
          approvalModeEnabled={approvalModeEnabled}
        />
      </div>
    </aside>
  )
}

function DocumentStepPage({
  step,
  setStep,
  documentConfirmed,
  elementStatus,
  setElementStatus,
  onStartItem,
  onOpenCopyEditor,
  onOpenSharePanel,
  onCreateMagicLink,
  magicLinkCount,
  onOpenPreview,
  templateCode,
  onTemplateChange,
  documentStyle,
  onStyleChange,
  onFocusReviewField,
  approvalModeEnabled,
}: {
  step: CreateDetailStep
  setStep: (step: CreateDetailStep) => void
  documentConfirmed: boolean
  elementStatus: DocumentElementStatus
  setElementStatus: (status: DocumentElementStatus) => void
  onStartItem: () => void
  onOpenCopyEditor: () => void
  onOpenSharePanel: () => void
  onCreateMagicLink: () => void
  magicLinkCount: number
  onOpenPreview: () => void
  templateCode: string
  onTemplateChange: (code: string) => void
  documentStyle: DocumentStyle
  onStyleChange: (style: DocumentStyle) => void
  onFocusReviewField: (key: string) => void
  approvalModeEnabled: boolean
}) {
  const [logoPickerOpen, setLogoPickerOpen] = useState(false)
  const [logoError, setLogoError] = useState("")
  const logoFileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedDirection, setSelectedDirection] = useState<"sell" | "buy">(
    () => (templateCode === "PO" ? "buy" : "sell")
  )
  const directionTemplates = templates.filter(([kind]) =>
    selectedDirection === "buy" ? kind === "PO" : kind !== "PO"
  )
  const aiReviewFields = [
    [
      "단가",
      "추가할 품목의 단가 확인이 필요합니다.",
      "확인 필요",
      "danger",
      "unit_price",
    ],
    ["인코텀즈", "고객 전달값으로 표시됩니다.", "전달값", "blue", "incoterms"],
    ["계약금액", "품목 합계와 일치합니다.", "정상", "success", "unit_price"],
  ] as const
  const [aiReviewIndex, setAiReviewIndex] = useState(0)
  const [
    aiReviewLabel,
    aiReviewNote,
    aiReviewStatus,
    aiReviewTone,
    aiReviewKey,
  ] = aiReviewFields[aiReviewIndex]

  if (step === "setup") {
    return (
      <section className="space-y-5">
        <div>
          <div className="text-sm font-semibold">방향과 문서 종류</div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            거래 방향을 정한 뒤 같은 단계에서 만들 문서를 선택합니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="ghost"
            className={cn(
              "h-auto min-w-0 justify-start border bg-background p-3 text-left font-normal hover:border-primary/50 hover:bg-primary/5",
              selectedDirection === "sell" &&
                "border-primary/50 bg-primary/5 shadow-sm"
            )}
            onClick={() => {
              setSelectedDirection("sell")
              if (templateCode === "PO") onTemplateChange("QT")
            }}
          >
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="text-sm font-semibold">판매</span>
                <ToneBadge tone="success">매출</ToneBadge>
              </span>
              <span className="mt-1 block truncate text-xs text-muted-foreground">
                고객에게 발행
              </span>
            </span>
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "h-auto min-w-0 justify-start border bg-background p-3 text-left font-normal hover:border-primary/50 hover:bg-primary/5",
              selectedDirection === "buy" &&
                "border-primary/50 bg-primary/5 shadow-sm"
            )}
            onClick={() => {
              setSelectedDirection("buy")
              onTemplateChange("PO")
            }}
          >
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="text-sm font-semibold">구매</span>
                <ToneBadge tone="blue">매입</ToneBadge>
              </span>
              <span className="mt-1 block truncate text-xs text-muted-foreground">
                공급사에게 발행
              </span>
            </span>
          </Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold">문서 종류</div>
            <ToneBadge tone={selectedDirection === "sell" ? "success" : "blue"}>
              {selectedDirection === "sell" ? "판매" : "구매"}{" "}
              {directionTemplates.length}종
            </ToneBadge>
          </div>
          <div className="grid gap-1.5">
            {directionTemplates.map(([kind, title, desc]) => (
              <Button
                variant="ghost"
                key={title}
                className={cn(
                  "grid h-auto w-full grid-cols-[44px_minmax(0,1fr)] items-start justify-start gap-2 border bg-background px-3 py-2.5 text-left font-normal hover:border-primary/50 hover:bg-primary/5",
                  templateCode === kind &&
                    "border-primary/50 bg-primary/5 shadow-sm"
                )}
                onClick={() => onTemplateChange(kind)}
              >
                <ToneBadge tone="blue">{kind}</ToneBadge>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {title}
                  </span>
                  <span className="mt-0.5 [display:-webkit-box] block overflow-hidden text-xs leading-4 text-muted-foreground [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                    {desc}
                  </span>
                  <span className="mt-1 block text-[11px] font-medium text-primary">
                    {templateFieldSummary(kind)}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        </div>

        <Button className="w-full" onClick={() => setStep("editor")}>
          {templateCode} 양식으로 작성
        </Button>
      </section>
    )
  }

  if (step === "share") {
    return (
      <section className="space-y-4">
        <div>
          <div className="text-sm font-semibold">고객 전달</div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">
            전달값과 동봉 파일을 확인한 뒤 오른쪽 초안의 고객 전달 버튼에서
            보냅니다.
          </div>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                전달값 확인
              </div>
              <div className="mt-2 text-xs leading-5 text-muted-foreground">
                받는 곳, 문서번호, 금액, 일정은 초안 상단에 표시됩니다.
              </div>
            </div>
            <ToneBadge tone="success">준비됨</ToneBadge>
          </div>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-xs font-medium text-muted-foreground">
              고객에게 전달되는 파일
            </div>
            <ToneBadge tone="success">2개</ToneBadge>
          </div>
          <div className="grid gap-2 text-xs">
            {[
              [`${templateCode}-2026-0708.pdf`, "확정 문서"],
              ["인보이스_2607_003.pdf", "동봉 파일"],
            ].map(([name, label]) => (
              <div
                key={name}
                className="flex items-center justify-between gap-3 rounded-md border bg-muted/25 px-3 py-2"
              >
                <span className="truncate font-medium">{name}</span>
                <span className="shrink-0 text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
          <Button variant="outline" className="mt-3 w-full justify-start">
            <Upload data-icon="inline-start" /> 동봉 파일 추가
          </Button>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="font-medium text-foreground">Magic Link 만들기</div>
            <ToneBadge tone={magicLinkCount > 0 ? "success" : "neutral"}>
              생성된 링크 {magicLinkCount}개
            </ToneBadge>
          </div>
          <div className="mt-2 text-xs leading-5 text-muted-foreground">
            전달할 링크의 받는 곳, 만료일, 열람 횟수를 설정합니다.
          </div>
          <Button
            variant="ghost"
            type="button"
            className="mt-3 h-auto w-full justify-between gap-3 border bg-muted/25 px-3 py-2 text-left text-xs font-normal hover:border-primary/40"
            onClick={(event) => {
              event.stopPropagation()
              onOpenPreview()
            }}
          >
            <span className="min-w-0">
              <span className="block font-medium text-foreground">
                고객 화면 미리보기
              </span>
              <span className="mt-1 block truncate text-muted-foreground">
                공유 링크가 아닌 내부 확인용 화면입니다.
              </span>
            </span>
            <Maximize2 className="size-3.5 text-muted-foreground" />
          </Button>
          <div className="mt-3 grid gap-2">
            <label className="grid gap-1">
              <span className="text-xs text-muted-foreground">받는 곳</span>
              <Input className="h-8 bg-muted/25" defaultValue="ACME GmbH" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1">
                <span className="text-xs text-muted-foreground">만료일</span>
                <Input className="h-8 bg-muted/25" defaultValue="2026.07.22" />
              </label>
              <label className="grid gap-1">
                <span className="text-xs text-muted-foreground">열람 횟수</span>
                <Input className="h-8 bg-muted/25" defaultValue="10" />
              </label>
            </div>
          </div>
          <Button
            className="mt-3 w-full"
            onClick={() => {
              onCreateMagicLink()
              onOpenSharePanel()
            }}
          >
            <Send data-icon="inline-start" /> Magic Link 생성
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div>
        <div className="text-sm font-semibold">문서 정돈</div>
      </div>
      <div className="rounded-lg border bg-background p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Sparkles data-icon="inline-start" /> AI 검증 필드
          </div>
          <ToneBadge tone="neutral">
            {aiReviewIndex + 1} / {aiReviewFields.length}
          </ToneBadge>
        </div>
        <div
          className={cn(
            "rounded-md border bg-muted/25 p-3",
            aiReviewTone === "danger" &&
              "border-destructive/35 bg-destructive/5"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold">{aiReviewLabel}</div>
            <ToneBadge tone={aiReviewTone as Tone}>{aiReviewStatus}</ToneBadge>
          </div>
          <div className="mt-2 text-xs leading-5 text-muted-foreground">
            {aiReviewNote}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full justify-between"
          onClick={() => {
            onFocusReviewField(aiReviewKey)
            setAiReviewIndex((aiReviewIndex + 1) % aiReviewFields.length)
          }}
        >
          <span className="flex items-center gap-1.5">
            <Sparkles data-icon="inline-start" /> 필드 확인에서 보기
          </span>
          <span>다음</span>
        </Button>
      </div>
      <div className="rounded-lg border bg-background p-4">
        <div className="mb-2 text-xs font-medium text-muted-foreground">
          문서 요소
        </div>
        <div className="grid gap-2">
          <Button
            variant="outline"
            className="justify-between"
            onClick={onStartItem}
          >
            <span className="flex items-center gap-1.5">
              <Plus data-icon="inline-start" /> 품목 넣기
            </span>
            {elementStatus.itemCount > 0 ? (
              <ToneBadge tone="success">{elementStatus.itemCount}개</ToneBadge>
            ) : (
              <span className="text-xs text-muted-foreground">추가</span>
            )}
          </Button>
          <Button
            variant="outline"
            className="justify-between"
            onClick={onOpenCopyEditor}
          >
            <span className="flex items-center gap-1.5">
              <RefreshCw data-icon="inline-start" /> 문구 다듬기
            </span>
            {elementStatus.copy ? (
              <ToneBadge tone="success">완료</ToneBadge>
            ) : (
              <span className="text-xs text-muted-foreground">열기</span>
            )}
          </Button>
        </div>
        <Button
          variant="outline"
          className="mt-3 w-full justify-between"
          onClick={() => setLogoPickerOpen((open) => !open)}
        >
          <span className="flex items-center gap-1.5">
            <Upload data-icon="inline-start" /> 로고 넣기
          </span>
          {elementStatus.logo ? (
            <ToneBadge tone="success">완료</ToneBadge>
          ) : (
            <span>{logoPickerOpen ? "닫기" : "선택"}</span>
          )}
        </Button>
        {logoPickerOpen ? (
          <div className="mt-2 overflow-hidden rounded-md border bg-background">
            <Button
              variant="ghost"
              type="button"
              className="grid h-auto w-full min-w-0 grid-cols-[18px_minmax(0,1fr)] items-center justify-start gap-2 rounded-none border-b px-3 py-2 text-left font-normal hover:bg-primary/5"
              onClick={() => {
                setLogoError("")
                onStyleChange({
                  ...documentStyle,
                  logo: {
                    source: "organization",
                    name: "ECOYA Demo Co. 조직 로고",
                  },
                })
                setElementStatus({ ...elementStatus, logo: true })
                setLogoPickerOpen(false)
              }}
            >
              <Building2 className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 overflow-hidden">
                <span className="block text-xs font-semibold">
                  조직 로고 사용
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                  ECOYA Demo Co. 등록 로고
                </span>
              </span>
            </Button>
            <Button
              variant="ghost"
              type="button"
              className="grid h-auto w-full min-w-0 grid-cols-[18px_minmax(0,1fr)] items-center justify-start gap-2 rounded-none px-3 py-2 text-left font-normal hover:bg-primary/5"
              onClick={() => logoFileInputRef.current?.click()}
            >
              <Upload className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 overflow-hidden">
                <span className="block text-xs font-semibold">
                  로고 파일 올리기
                </span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  PNG/JPG · 200KB 이하
                </span>
              </span>
            </Button>
            <input
              ref={logoFileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                if (file.size > 200 * 1024) {
                  setLogoError("로고 파일은 200KB 이하만 사용할 수 있습니다.")
                  event.target.value = ""
                  return
                }
                setLogoError("")
                const reader = new FileReader()
                reader.onload = () => {
                  onStyleChange({
                    ...documentStyle,
                    logo: {
                      source: "file",
                      name: file.name,
                      dataUrl: String(reader.result),
                    },
                  })
                  setElementStatus({ ...elementStatus, logo: true })
                  setLogoPickerOpen(false)
                }
                reader.readAsDataURL(file)
                event.target.value = ""
              }}
            />
          </div>
        ) : null}
        {logoError ? (
          <div className="mt-2 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {logoError}
          </div>
        ) : null}
        {elementStatus.logo && documentStyle.logo ? (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-md bg-muted/25 px-3 py-2 text-xs">
            <span className="min-w-0 truncate font-medium">
              {documentStyle.logo.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => {
                setLogoError("")
                onStyleChange({ ...documentStyle, logo: null })
                setElementStatus({ ...elementStatus, logo: false })
              }}
            >
              제거
            </Button>
          </div>
        ) : null}
      </div>
      <div className="rounded-lg border bg-background p-4">
        <div className="text-xs font-medium text-muted-foreground">
          출력 스타일
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            variant={documentStyle.fontStyle === "sans" ? "default" : "outline"}
            size="sm"
            onClick={() =>
              onStyleChange({ ...documentStyle, fontStyle: "sans" })
            }
          >
            고딕
          </Button>
          <Button
            variant={
              documentStyle.fontStyle === "serif" ? "default" : "outline"
            }
            size="sm"
            onClick={() =>
              onStyleChange({ ...documentStyle, fontStyle: "serif" })
            }
          >
            명조
          </Button>
          <Button variant="outline" size="sm">
            표준 양식
          </Button>
          <Button variant="outline" size="sm">
            레터형
          </Button>
        </div>
      </div>
      <div className="rounded-lg border bg-background p-4">
        <div className="text-xs font-medium text-muted-foreground">
          문서 강조색
        </div>
        <div className="mt-3 flex gap-2">
          {["#166dd7", "#15bd66", "#eaa800", "#1a1f2b"].map((color) => (
            <Button
              variant="ghost"
              size="icon"
              key={color}
              className={cn(
                "size-8 rounded-full border p-0 shadow-sm",
                documentStyle.accent === color &&
                  "ring-2 ring-ring ring-offset-2"
              )}
              style={{ backgroundColor: color }}
              aria-label={`강조색 ${color}`}
              onClick={() => onStyleChange({ ...documentStyle, accent: color })}
            />
          ))}
        </div>
      </div>
      {approvalModeEnabled && elementStatus.approval === "approved" ? (
        <div className="rounded-lg border bg-success/5 px-3 py-2 text-xs text-muted-foreground">
          {documentConfirmed
            ? "확정된 문서입니다."
            : "승인 완료 · 상단에서 문서를 확정할 수 있습니다."}
        </div>
      ) : approvalModeEnabled ? (
        <div className="rounded-lg border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          {elementStatus.approval === "requested"
            ? "승인 검토 중입니다."
            : elementStatus.approval === "rejected"
              ? "반려 메시지를 확인하고 문구를 수정해주세요."
              : "승인은 선택 사항입니다. 바로 확정하거나 검토를 요청할 수 있습니다."}
        </div>
      ) : null}
    </section>
  )
}

// Kept as a reference fallback for the earlier three-step document prototype.
function DocumentCreateWorkbench({
  approvalStatus,
  documentConfirmed,
  onSetApprovalStatus,
  onConfirmDocument,
  magicLinks,
  emailRecords,
  onOpenSharePanel,
  templateCode,
  documentStyle,
  missingRequiredCount,
  approvalModeEnabled,
}: {
  approvalStatus: DocumentElementStatus["approval"]
  documentConfirmed: boolean
  onSetApprovalStatus: (status: DocumentElementStatus["approval"]) => void
  onConfirmDocument: () => void
  magicLinks: DeliveryLink[]
  emailRecords: EmailRecord[]
  onOpenSharePanel: () => void
  templateCode: string
  documentStyle: DocumentStyle
  missingRequiredCount: number
  approvalModeEnabled: boolean
}) {
  const [approvalHistoryOpen, setApprovalHistoryOpen] = useState(false)
  const [manualSaving, setManualSaving] = useState(false)
  const [pdfExporting, setPdfExporting] = useState(false)
  const pdfExportBusyRef = useRef(false)
  const [viewerRole, setViewerRole] = useState<"author" | "approver">("author")
  const [qualityAcknowledged, setQualityAcknowledged] = useState(false)
  const [rejectEditorOpen, setRejectEditorOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const activeMagicLinkCount = magicLinks.filter(
    (link) => link.status === "active"
  ).length
  const approvalDone = approvalStatus === "approved"
  const approvalRequested = approvalStatus === "requested"
  const approvalRejected = approvalStatus === "rejected"
  const handleManualSave = () => {
    setManualSaving(true)
    window.setTimeout(() => setManualSaving(false), 1200)
  }
  const handlePdfExport = async () => {
    if (pdfExportBusyRef.current) return
    pdfExportBusyRef.current = true
    setPdfExporting(true)
    try {
      await downloadRenderedDocumentPdf(`${templateCode}-2026-0708.pdf`)
    } finally {
      pdfExportBusyRef.current = false
      setPdfExporting(false)
    }
  }
  const [, templateTitle] = templateMeta(templateCode)

  return (
    <section className="relative flex min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 border-b bg-background px-4 py-3 sm:min-h-14 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0 lg:hidden">
          <div className="text-sm font-semibold">{templateTitle} 초안</div>
          <div className="mt-1 text-xs text-muted-foreground">
            AI 작성완료 · 거래 데이터 4개 필드 반영
          </div>
        </div>
        <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 sm:w-auto sm:overflow-visible sm:pb-0 lg:ml-auto">
          {approvalModeEnabled ? (
            <>
              <AppSelect
                className="w-auto min-w-28 shrink-0 sm:min-w-32"
                value={viewerRole}
                onValueChange={(value) =>
                  setViewerRole(value as "author" | "approver")
                }
                ariaLabel="문서 작업 역할"
                options={[
                  ["author", "작성자 화면"],
                  ["approver", "오너·관리자 화면"],
                ]}
              />
              <Button
                className="shrink-0"
                variant="outline"
                size="sm"
                onClick={() => setApprovalHistoryOpen(true)}
              >
                <ClipboardList data-icon="inline-start" /> 승인 히스토리
              </Button>
            </>
          ) : null}
          <Button
            className="shrink-0"
            variant="outline"
            size="sm"
            disabled={manualSaving}
            onClick={handleManualSave}
          >
            {manualSaving ? (
              <RefreshCw
                className="size-3 animate-spin"
                data-icon="inline-start"
              />
            ) : (
              <RefreshCw data-icon="inline-start" />
            )}
            {manualSaving ? "저장 중" : "저장"}
          </Button>
          <Button
            className="shrink-0"
            variant="outline"
            size="sm"
            disabled={pdfExporting}
            onClick={handlePdfExport}
          >
            {pdfExporting ? (
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
            ) : (
              <Download data-icon="inline-start" />
            )}
            {pdfExporting ? "PDF 생성 중" : "PDF"}
          </Button>
          {approvalModeEnabled &&
          !approvalDone &&
          !approvalRequested &&
          viewerRole === "author" ? (
            <Button
              className="shrink-0"
              variant="outline"
              size="sm"
              disabled={!qualityAcknowledged || missingRequiredCount > 0}
              onClick={() => onSetApprovalStatus("requested")}
            >
              <ClipboardList data-icon="inline-start" />{" "}
              {approvalRejected ? "승인 재요청" : "승인 요청"}
            </Button>
          ) : null}
          {approvalModeEnabled &&
          approvalRequested &&
          viewerRole === "approver" ? (
            <>
              <Button size="sm" onClick={() => onSetApprovalStatus("approved")}>
                <Check data-icon="inline-start" /> 승인
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectEditorOpen(true)}
              >
                <X data-icon="inline-start" /> 반려
              </Button>
            </>
          ) : null}
          {approvalModeEnabled &&
          approvalRequested &&
          viewerRole === "author" ? (
            <Button size="sm" disabled>
              <LoaderCircle className="animate-spin" data-icon="inline-start" />{" "}
              승인 대기
            </Button>
          ) : null}
          {(!approvalModeEnabled || !approvalRequested) &&
          !documentConfirmed &&
          viewerRole === "author" ? (
            <Button
              size="sm"
              disabled={!qualityAcknowledged || missingRequiredCount > 0}
              onClick={onConfirmDocument}
            >
              <Check data-icon="inline-start" /> 문서 확정
            </Button>
          ) : null}
          {documentConfirmed ? (
            <Button size="sm" onClick={onOpenSharePanel}>
              <Send data-icon="inline-start" /> 파일 공유하기
            </Button>
          ) : null}
        </div>
      </div>
      {approvalModeEnabled && rejectEditorOpen && approvalRequested ? (
        <div className="shrink-0 border-b border-destructive/20 bg-destructive/5 px-5 py-3">
          <div className="flex items-end gap-3">
            <label className="grid min-w-0 flex-1 gap-1">
              <span className="text-xs font-semibold text-destructive">
                반려 사유
              </span>
              <Input
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="작성자가 수정할 내용을 구체적으로 입력해주세요."
              />
            </label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectEditorOpen(false)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={!rejectionReason.trim()}
              onClick={() => {
                setRejectEditorOpen(false)
                onSetApprovalStatus("rejected")
              }}
            >
              반려 확정
            </Button>
          </div>
        </div>
      ) : null}
      {approvalModeEnabled && approvalRejected ? (
        <div className="shrink-0 border-b border-destructive/20 bg-destructive/5 px-5 py-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-destructive">
                반려 메시지
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">
                {rejectionReason ||
                  "결제조건 문구를 고객 전달용으로 더 짧게 정리해주세요."}
              </div>
              <div className="mt-1 text-xs leading-5 text-muted-foreground">
                문구 다듬기에서 수정한 뒤 다시 승인 요청할 수 있습니다.
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSetApprovalStatus("idle")}
            >
              수정 후 재요청 준비
            </Button>
          </div>
        </div>
      ) : null}

      {missingRequiredCount > 0 ? (
        <div className="shrink-0 border-b border-destructive/20 bg-destructive/5 px-5 py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                <AlertTriangle data-icon="inline-start" /> 필수값{" "}
                {missingRequiredCount}개 입력 필요
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                왼쪽 필드 확인에서 빈 값을 입력해야 문서 확정 또는 승인 요청을
                진행할 수 있습니다.
              </div>
            </div>
            <ToneBadge tone="danger">진행 차단</ToneBadge>
          </div>
        </div>
      ) : null}

      {!qualityAcknowledged ? (
        <div className="shrink-0 border-b border-warning/20 bg-warning/6 px-4 py-3 sm:px-5">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-warning">
                <AlertTriangle data-icon="inline-start" /> 품질 검토 권장 ·
                84/100
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                계약금액과 품목 합계 차이 1건이 있습니다.{" "}
                {missingRequiredCount > 0
                  ? `필수값 ${missingRequiredCount}개를 먼저 입력해야 합니다.`
                  : "필수값 누락은 없으며 확인 후 진행할 수 있습니다."}
              </div>
            </div>
            <Button
              className="shrink-0"
              variant="outline"
              size="sm"
              onClick={() => setQualityAcknowledged(true)}
            >
              검토 완료
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col bg-background">
        <div className="shrink-0 border-b bg-background px-5 py-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-muted-foreground">
                전달값
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  ["받는 곳", "ACME GmbH", "success"],
                  ["문서번호", `${templateCode}-2026-0708`, "blue"],
                  ["금액", "2,400,000 USD", "warning"],
                  ["ETA/ETD", "07.20 / 08.03", "neutral"],
                ].map(([label, value, tone]) => (
                  <div
                    key={label}
                    className="rounded-md border bg-muted/25 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        {label}
                      </span>
                      <ToneBadge tone={tone as Tone}>
                        {tone === "warning" ? "확인" : "표시"}
                      </ToneBadge>
                    </div>
                    <div className="mt-1 text-xs font-semibold">{value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="truncate pt-1 text-xs text-muted-foreground">
              {templateCode}-2026-0708.pdf
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-between gap-4 border-b bg-background px-5 py-3">
          <div>
            <div className="text-xs font-semibold text-muted-foreground">
              전달 결과
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              고객에게 보낸 기록만 표시합니다.
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <ToneBadge tone={activeMagicLinkCount > 0 ? "success" : "neutral"}>
              Magic Link{" "}
              {activeMagicLinkCount > 0 ? `${activeMagicLinkCount}개` : "없음"}
            </ToneBadge>
            <ToneBadge tone={emailRecords.length > 0 ? "success" : "neutral"}>
              이메일{" "}
              {emailRecords.length > 0 ? `${emailRecords.length}회` : "없음"}
            </ToneBadge>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="h-full min-h-[720px]">
            <DocumentStage
              result
              fitPage
              templateCode={templateCode}
              accent={documentStyle.accent}
              fontStyle={documentStyle.fontStyle}
              logo={documentStyle.logo}
            />
          </div>
        </div>
      </div>

      {approvalModeEnabled && approvalHistoryOpen ? (
        <ApprovalHistory
          approvalStatus={approvalStatus}
          onClose={() => setApprovalHistoryOpen(false)}
        />
      ) : null}
    </section>
  )
}

function ApprovalHistory({
  approvalStatus,
  onClose,
}: {
  approvalStatus: DocumentElementStatus["approval"]
  onClose: () => void
}) {
  const approvalDone = approvalStatus === "approved"
  const approvalWaiting = approvalStatus === "requested"
  const approvalRejected = approvalStatus === "rejected"
  const rows = [
    ["승인 요청", "김민지", "2026.07.08 10:12", "초안 검토 요청"],
    ["반려", "박준호", "2026.07.08 10:34", "결제조건 문구 보완 필요"],
    ["수정", "김민지", "2026.07.08 10:46", "제2조 결제조건 문구 수정"],
    ["재요청", "김민지", "2026.07.08 10:51", "수정본 재검토 요청"],
    [
      approvalDone
        ? "승인"
        : approvalRejected
          ? "반려"
          : approvalWaiting
            ? "승인 대기"
            : "요청 전",
      "박준호",
      approvalDone
        ? "2026.07.08 11:05"
        : approvalRejected
          ? "2026.07.08 11:05"
          : "-",
      approvalDone
        ? "고객 전달 가능"
        : approvalRejected
          ? "문구 보완 후 재요청"
          : approvalWaiting
            ? "오너/관리자 검토 중"
            : "선택 승인 · 필요 시 요청",
    ],
  ] as const

  return (
    <section className="absolute top-16 right-5 z-30 max-h-[calc(100%-88px)] w-[min(620px,calc(100%-40px))] overflow-auto rounded-xl border bg-background p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">승인 히스토리</div>
          <div className="mt-1 text-xs text-muted-foreground">
            이 초안 문서에 대한 승인/반려 기록입니다.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ToneBadge
            tone={
              approvalDone
                ? "success"
                : approvalRejected
                  ? "danger"
                  : approvalWaiting
                    ? "warning"
                    : "neutral"
            }
          >
            {approvalDone
              ? "승인 완료"
              : approvalRejected
                ? "반려"
                : approvalWaiting
                  ? "승인 대기"
                  : "요청 전"}
          </ToneBadge>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
      <div className="grid gap-2">
        {rows.map(([status, actor, time, memo]) => (
          <div
            key={`${status}-${time}`}
            className="grid grid-cols-[96px_80px_130px_minmax(0,1fr)] items-center gap-3 rounded-lg border bg-muted/25 px-3 py-2 text-xs"
          >
            <ToneBadge
              tone={
                status === "반려"
                  ? "danger"
                  : status === "승인"
                    ? "success"
                    : status === "승인 대기"
                      ? "warning"
                      : "blue"
              }
            >
              {status}
            </ToneBadge>
            <span className="font-medium">{actor}</span>
            <span className="text-muted-foreground">{time}</span>
            <span className="truncate text-muted-foreground">{memo}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function ShareDeliveryPanel({
  magicLinks,
  emailRecords,
  onSendEmail,
  onCreateMagicLink,
  onRevokeMagicLink,
  onDeleteMagicLink,
  onClose,
  templateCode,
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
  onCreateMagicLink: (settings: { expires: string; maxOpens: number }) => void
  onRevokeMagicLink: (id: number) => void
  onDeleteMagicLink: (id: number) => void
  onClose: () => void
  templateCode: string
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
  const [attachmentPickerOpen, setAttachmentPickerOpen] = useState(false)
  const [attachments, setAttachments] = useState<DeliveryAttachment[]>(() =>
    initialAttachments
      ? [...initialAttachments]
      : [{ id: "att-1", name: "인보이스_2607_003.pdf", source: "인박스" }]
  )
  useEffect(() => { onAttachmentsChange(attachments) }, [attachments, onAttachmentsChange])
  const [previewAttachment, setPreviewAttachment] = useState<{ name: string; blob: Blob; sample: boolean } | null>(null)
  const activeMagicLinkCount = magicLinks.filter(
    (link) => link.status === "active"
  ).length
  const activeLinks = magicLinks.filter((link) => link.status === "active")
  const emailLink = activeLinks.at(-1)
  const handleCopyLink = (link: DeliveryLink) => {
    const url = `https://ecoya.app/share/${templateCode.toLowerCase()}-2026-0708-${link.id}`
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
            <div className="mt-1 text-xs leading-5 text-muted-foreground">
              확정한 PDF와 동봉 파일을 묶어 링크 또는 이메일로 공유합니다.
            </div>
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
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.print()}><Download data-icon="inline-start" /> 전체 패키지 다운로드</Button>
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
                      <p className="break-all text-sm font-semibold text-foreground">{templateCode}-2026-0708.pdf</p>
                      <div className="mt-1"><ToneBadge tone="success">본문 PDF</ToneBadge></div>
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
                          <ToneBadge tone="neutral">첨부</ToneBadge>
                          <span>{attachment.source}</span>
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
                  <ToneBadge tone={activeMagicLinkCount > 0 ? "success" : "warning"}>
                    {activeMagicLinkCount > 0 ? `${activeMagicLinkCount}개 활성` : "미생성"}
                  </ToneBadge>
                </div>
                <Button variant="ghost" size="sm" className="h-8 shrink-0 px-2 text-xs text-primary" onClick={() => window.open("/share/preview", "_blank", "noopener,noreferrer")}>
                  <ExternalLink className="size-3.5" /> 수신 화면 미리보기
                </Button>
              </div>
              {magicLinks.length > 0 ? (
                <div className="grid gap-2">
                  {magicLinks.map((link, index) => {
                    const linkUrl = `https://ecoya.app/share/${templateCode.toLowerCase()}-2026-0708-${link.id}`
                    const linkActive = link.status === "active"
                    const linkStatus =
                      link.status === "active"
                        ? "활성"
                        : link.status === "revoked"
                          ? "철회됨"
                          : link.status === "expired"
                            ? "만료"
                            : "열람 초과"
                    return (
                      <div
                        key={link.id}
                        className="rounded-md border bg-background p-3 text-xs"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold">
                            ACME GmbH 링크 {index + 1}
                          </span>
                          <ToneBadge
                            tone={
                              linkActive
                                ? "success"
                                : link.status === "revoked"
                                  ? "neutral"
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
                        <div className="mt-3 grid grid-cols-4 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!linkActive}
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
                            disabled={!linkActive}
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
                            disabled={!linkActive}
                            onClick={() => onRevokeMagicLink(link.id)}
                          >
                            철회
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteMagicLink(link.id)}
                          >
                            <Trash2 data-icon="inline-start" /> 삭제
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">링크를 만들어 고객에게 전달하세요.</p>
                  <details className="group rounded-md bg-muted/30 px-3 py-2">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-xs [&::-webkit-details-marker]:hidden">
                      <span>링크 설정 · {expires.replaceAll("-", ".")} 만료 · 최대 {maxOpens}회</span>
                      <ChevronDown className="size-3.5 group-open:rotate-180" />
                    </summary>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <label className="grid gap-1 text-xs">
                        <span>만료일</span>
                        <Input type="date" className="h-8 bg-background" value={expires} onChange={(event) => setExpires(event.target.value)} />
                      </label>
                      <label className="grid gap-1 text-xs">
                        <span>최대 열람 횟수</span>
                        <Input type="number" min={1} step={1} className="h-8 bg-background" value={maxOpens} onChange={(event) => setMaxOpens(event.target.value)} />
                      </label>
                    </div>
                  </details>
                  <Button className="w-full" disabled={!relatedDeal || !linkSettingsValid} onClick={() => onCreateMagicLink({ expires: expires.replaceAll("-", "."), maxOpens: Number(maxOpens) })}>
                    <Link2 data-icon="inline-start" /> 공유 링크 만들기
                  </Button>
                </div>
              )}
            </div>

            <details className="group border-t pt-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-1 [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2 text-sm font-semibold"><Mail className="size-4" /> 이메일로도 보내기 <span className="text-xs font-normal text-muted-foreground">선택</span></span>
                <ChevronDown className="size-4 group-open:rotate-180" />
              </summary>
              <div className="pt-3">
              <div className="grid gap-2">
                <FormField label="받는 사람" htmlFor="share-email-recipient">
                  <Input id="share-email-recipient" type="email" className="h-10 bg-background" value={recipient} onChange={(event) => setRecipient(event.target.value)} />
                </FormField>
                <FormField label="제목" htmlFor="share-email-subject">
                  <Input id="share-email-subject" className="h-10 bg-background" value={subject} onChange={(event) => setSubject(event.target.value)} />
                </FormField>
                <FormField label="이메일 내용" htmlFor="share-email-body">
                  <Textarea id="share-email-body" aria-label="이메일 내용" className="min-h-28 resize-none bg-background text-xs leading-5" value={textBody} onChange={(event) => setTextBody(event.target.value)} />
                </FormField>
              </div>
              <div className="mt-3 rounded-md border bg-background p-3 text-xs">
                <div className="font-medium">이메일에 포함될 Magic Link</div>
                <div className="mt-2 text-muted-foreground">
                  {emailLink
                    ? `https://ecoya.app/share/${templateCode.toLowerCase()}-2026-0708-${emailLink.id}`
                    : "먼저 Magic Link를 생성해야 이메일을 보낼 수 있습니다."}
                </div>
              </div>
              <Button
                className="mt-3 w-full"
                disabled={
                  !emailLink ||
                  !recipient.trim() ||
                  !subject.trim() ||
                  isSending
                }
                onClick={async () => {
                  if (!emailLink) return
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
                {isSending ? "요청 중" : "발송 요청 기록"}
              </Button>
              </div>
            </details>
          </div>
        ) : (
          <div className="grid gap-3">
            {[
              ...magicLinks.map((link) => ({
                id: `link-${link.id}`,
                title: `Magic Link ${link.id}`,
                meta: `${link.status === "active" ? "활성" : "철회됨"} · ${link.expires} 만료`,
                tone: link.status === "active" ? "success" : "neutral",
              })),
              ...emailRecords.map((email) => ({
                id: `email-${email.id}`,
                title: `이메일 발송 요청 · ${email.recipient}`,
                meta: `요청 시각 ${email.sentAt} · Magic Link ${email.linkCount}개 포함 · 실제 발송·수신 미확인`,
                tone: "blue",
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
                    {item.tone === "success" ? "완료" : "기록"}
                  </ToneBadge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {item.meta}
                </div>
              </div>
            ))}
            {magicLinks.length + emailRecords.length === 0 ? (
              <div className="rounded-lg border bg-background p-4 text-xs leading-5 text-muted-foreground">
                아직 고객에게 전달한 내역이 없습니다.
              </div>
            ) : null}
          </div>
        )}
      </div>
      {previewAttachment && <DeliveryAttachmentPreview {...previewAttachment} onClose={() => setPreviewAttachment(null)} />}
    </section>
  )
}

// Kept as a reference fallback for the earlier public-link preview.
function CustomerPreviewDialog({
  onClose,
  templateCode,
}: {
  onClose: () => void
  templateCode: string
}) {
  const [, templateTitle] = templateMeta(templateCode)
  const [previewState, setPreviewState] = useState<
    "active" | "expired" | "maxed" | "revoked" | "missing"
  >("active")
  const endStateCopy = {
    expired: [
      "링크가 만료되었습니다",
      "발신자에게 새 공유 링크를 요청해주세요.",
    ],
    maxed: [
      "열람 가능 횟수를 초과했습니다",
      "보안을 위해 이 링크는 더 이상 문서를 표시하지 않습니다.",
    ],
    revoked: ["철회된 링크입니다", "발신자가 공유를 종료했습니다."],
    missing: ["문서를 찾을 수 없습니다", "링크 주소를 다시 확인해주세요."],
  } as const
  return (
    <section className="fixed inset-x-0 top-15 bottom-0 z-[100] flex items-end bg-foreground/20 backdrop-blur-sm">
      <div className="flex h-full w-full flex-col overflow-hidden rounded-t-2xl border-x border-t bg-background shadow-[0_-18px_48px_rgb(31_41_55/0.18)]">
        <div className="flex h-16 shrink-0 items-center justify-between border-b px-6">
          <div>
            <div className="mb-2 h-1 w-10 rounded-full bg-muted-foreground/30" />
            <div className="text-sm font-semibold">고객 화면 미리보기</div>
            <div className="mt-1 text-xs text-muted-foreground">
              공유 가능한 URL이 아닌 내부 확인용 화면입니다.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AppSelect
              className="w-auto min-w-28"
              value={previewState}
              onValueChange={(value) =>
                setPreviewState(value as typeof previewState)
              }
              ariaLabel="공개 링크 상태 미리보기"
              options={[
                ["active", "활성 링크"],
                ["expired", "만료"],
                ["maxed", "열람 초과"],
                ["revoked", "철회"],
                ["missing", "찾을 수 없음"],
              ]}
            />
            <Button variant="outline" size="sm" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>
        <div className="relative min-h-0 overflow-auto bg-background">
          {previewState !== "active" ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background p-8">
              <div className="max-w-md text-center">
                <AlertTriangle className="mx-auto text-warning" />
                <h2 className="mt-4 text-2xl font-semibold">
                  {endStateCopy[previewState][0]}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {endStateCopy[previewState][1]}
                </p>
              </div>
            </div>
          ) : null}
          <section className="border-b bg-background px-6 py-5">
            <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-muted-foreground uppercase">
                    Secure delivery package
                  </div>
                  <h2 className="mt-1 truncate text-2xl font-semibold tracking-normal">
                    {templateCode}-2026-0708.pdf
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                      <FileText className="size-3.5" /> Main document + 1
                      additional file
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                      <Building2 className="size-3.5" /> For ACME GmbH
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                      <Check className="size-3.5" /> Expires Jul 22, 2026 · 0/10
                      opens used
                    </span>
                  </div>
                </div>
                <Button onClick={() => window.print()}>
                  <Download data-icon="inline-start" /> Download pack (2 files)
                </Button>
              </div>

              <div className="rounded-lg border bg-muted/25 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">
                      상용 문서 준비도
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      고객 전달 전에 필요한 상업 문서 신호를 확인합니다.
                    </div>
                  </div>
                  <ToneBadge tone="success">5/5 준비됨</ToneBadge>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-5">
                  {[
                    ["문서", `${templateCode}-2026-0708.pdf`],
                    ["수신처", "ACME GmbH"],
                    ["물류", "ETD 07.20 / ETA 08.03"],
                    ["상업조건", "금액·결제·인코텀즈"],
                    ["보안링크", "만료·열람 제한"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-md border bg-background px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] font-semibold text-muted-foreground uppercase">
                          {label}
                        </span>
                        <span className="size-2 rounded-full bg-success" />
                      </div>
                      <div className="mt-1 truncate text-xs font-semibold">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-4">
                {[
                  ["Shipment", "ETD 07.20 / ETA 08.03", ""],
                  ["Route", "Busan -> Hamburg", ""],
                  ["Vessel", "HMM Green / 014W", ""],
                  ["Link status", "Expires Jul 22, 2026", "0/10 opens used"],
                ].map(([label, value, support]) => (
                  <div
                    key={label}
                    className="rounded-lg border bg-background px-3.5 py-3"
                  >
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase">
                      {label}
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold">
                      {value}
                    </div>
                    {support ? (
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {support}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="rounded-lg border bg-muted/25 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">
                      Commercial terms
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Key values confirmed by the sender for this package.
                    </div>
                  </div>
                  <ToneBadge tone="neutral">계약서</ToneBadge>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  {[
                    ["Amount", "2,400,000 USD"],
                    ["Payment terms", "T/T 30 days"],
                    ["Incoterms", "CIF Hamburg"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-lg border bg-background px-3.5 py-3"
                    >
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase">
                        {label}
                      </div>
                      <div className="mt-1 truncate text-sm font-semibold">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <main className="mx-auto grid w-full max-w-[1280px] gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="flex min-h-[560px] min-w-0 flex-col overflow-hidden rounded-lg border bg-background">
              <div className="flex h-11 shrink-0 items-center gap-2 border-b bg-muted px-3.5 text-sm font-medium">
                <FileText className="size-4 text-muted-foreground" />
                Document preview
              </div>
              <div className="flex-1 bg-white p-8">
                <div className="mx-auto min-h-full max-w-[720px] border bg-background p-10 shadow-sm">
                  <div className="text-xs font-semibold tracking-[0.22em] text-primary">
                    GENERATED DRAFT
                  </div>
                  <div className="mt-5 text-3xl font-semibold">
                    {templateTitle}
                  </div>
                  <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
                    {[
                      ["매도인", "ECOYA Demo Co."],
                      ["매수인", "ACME GmbH"],
                      ["계약금액", "2,400,000 USD"],
                      ["지급조건", "T/T 30 days"],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div className="text-xs text-muted-foreground">
                          {label}
                        </div>
                        <div className="mt-1 font-semibold">{value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 overflow-hidden rounded-md border text-sm">
                    <div className="grid grid-cols-4 bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground">
                      <span>품목</span>
                      <span>수량</span>
                      <span>단가</span>
                      <span>금액</span>
                    </div>
                    {["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"].map(
                      (item, index) => (
                        <div
                          key={item}
                          className="grid grid-cols-4 border-t px-3 py-2"
                        >
                          <span>{item}</span>
                          <span>{index === 4 ? "8" : "12"}</span>
                          <span>128,333</span>
                          <span>1,540,000</span>
                        </div>
                      )
                    )}
                  </div>
                  <div className="mt-8 space-y-2">
                    <div className="h-2 w-5/6 rounded bg-muted" />
                    <div className="h-2 w-3/4 rounded bg-muted" />
                    <div className="h-2 w-4/5 rounded bg-muted" />
                  </div>
                </div>
              </div>
            </section>

            <aside className="flex min-w-0 flex-col gap-3">
              <section className="rounded-lg border bg-background p-4">
                <h3 className="text-sm font-semibold">Package contents</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Main document + 1 additional file
                </p>
                <ul className="mt-3 flex flex-col gap-2 text-sm">
                  {[
                    [`${templateCode}-2026-0708.pdf`, "Main PDF document"],
                    ["인보이스_2607_003.pdf", "Supporting document"],
                  ].map(([file, meta]) => (
                    <li
                      key={file}
                      className="flex items-center justify-between gap-3 rounded-md border bg-muted/25 px-3 py-2"
                    >
                      <span className="min-w-0">
                        <span className="flex min-w-0 items-center gap-2">
                          <FileText className="size-4 shrink-0 text-muted-foreground" />
                          <span className="block min-w-0 truncate font-medium">
                            {file}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {meta}
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`${file} 다운로드`}
                        onClick={() => window.print()}
                      >
                        <Download className="size-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-lg border bg-background p-4">
                <h3 className="text-sm font-semibold">Link security</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  고객에게 노출되는 링크 상태만 표시합니다.
                </p>
                <dl className="mt-3 grid gap-2 text-sm">
                  {[
                    ["Status", "Active"],
                    ["Expires", "2026.07.22"],
                    ["Open limit", "0 / 10"],
                    ["Download", "2 files"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-3"
                    >
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="min-w-0 truncate text-right font-medium">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            </aside>
          </main>

          <footer className="border-t bg-background px-5 py-3 text-center text-xs text-muted-foreground">
            ECOYA - This link may expire or be withdrawn by the sender.
          </footer>
        </div>
      </div>
    </section>
  )
}
function CreateFieldValuePicker({ label, value, options, onSelect }: {
  label: string
  value: string
  options: [string, string][]
  onSelect: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 px-2 text-[11px]" aria-label={`${label} 후보 값 선택`}>
          후보 값 {options.length}개 <ChevronDown className="size-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 max-w-[calc(100vw-2rem)] gap-1 p-1">
        {options.map(([source, candidate]) => (
          <Button type="button" variant="ghost" key={source} className="h-auto w-full justify-between gap-3 whitespace-normal px-2 py-2 text-left text-xs" onClick={() => { onSelect(candidate); setOpen(false) }}>
            <span className="shrink-0 text-muted-foreground">{source}</span>
            <span className="min-w-0 flex-1 break-words">{candidate}</span>
            {value === candidate ? <Check aria-hidden="true" className="size-3.5 shrink-0" /> : null}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

function CreateFieldReviewPanel({
  itemFocusSignal,
  reviewFocusRequest,
  reviewIssueTargets,
  onItemCountChange,
  onRequiredMissingChange,
  onComparisonFactsChange,
  onContentChange,
  templateCode,
  sourceLabel = "등록된 원본",
  startBlank = false,
  onShowSource,
}: {
  itemFocusSignal: number
  reviewFocusRequest: ReviewFocusRequest | null
  reviewIssueTargets: ReviewFocusTarget[]
  onItemCountChange: (count: number) => void
  onRequiredMissingChange: (issues: ReviewFocusTarget[]) => void
  onComparisonFactsChange?: (facts: DocumentComparisonFacts) => void
  onContentChange?: () => void
  templateCode: string
  sourceLabel?: string
  startBlank?: boolean
  onShowSource: () => void
}) {
  const panelRef = useRef<HTMLElement | null>(null)
  const itemEditorRef = useRef<HTMLDivElement | null>(null)
  const firstItemInputRef = useRef<HTMLInputElement | null>(null)
  const firstItemUnitPriceRef = useRef<HTMLInputElement | null>(null)
  const [itemEditorHighlighted, setItemEditorHighlighted] = useState(false)
  const [focusedReviewKey, setFocusedReviewKey] = useState<string | null>(null)
  const reviewIssueKeys = new Set(
    reviewIssueTargets.map((target) => target.key)
  )
  const lineItemIssueLabels = Array.from(
    new Set(
      reviewIssueTargets
        .filter((target) => ["item_name", "item_amount"].includes(target.key))
        .map((target) => target.label)
    )
  )
  const initialItemRows = [
    {
      id: "item-1",
      name: startBlank ? "" : "Aluminium Scrap Tough Taboo",
      quantity: startBlank ? "" : "20",
      unit: "MT",
      unitPrice: startBlank ? "" : "128333",
      source: startBlank ? "직접입력" : "업로드값",
    },
  ]
  const activeSchema = templateSchemas[templateCode] ?? templateSchemas.SC
  const hasLineItems = Boolean(activeSchema.lineItems)
  const fieldRows = activeSchema.slots.map((slot, index) => ({
    key: slot.key,
    label: slot.label,
    kind: slot.kind,
    value: sampleValueForSlot(slot),
    status: slot.required ? "정상" : index % 3 === 0 ? "권장" : "추출",
    tone: slot.required ? "success" : index % 3 === 0 ? "blue" : "neutral",
    assists: [
      ["거래값 사용", sampleValueForSlot(slot)],
      [
        "최근값 사용",
        slot.kind === "date" ? "2026-07-03" : sampleValueForSlot(slot),
      ],
    ] as [string, string][],
  })) satisfies Array<{
    key: string
    label: string
    kind: PrototypeSlotKind
    value: string
    status: string
    tone: Tone
    assists: [string, string][]
  }>
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(
    Object.fromEntries(
      fieldRows.map((row) => [row.key, startBlank ? "" : row.value])
    )
  )
  const [itemRows, setItemRows] = useState(initialItemRows)
  const [itemValues, setItemValues] = useState<
    Record<
      string,
      { name: string; quantity: string; unit: string; unitPrice: string }
    >
  >(
    Object.fromEntries(
      initialItemRows.map((item) => [
        item.id,
        {
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
        },
      ])
    )
  )
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([])
  const [assistPanelKey, setAssistPanelKey] = useState<string | null>(null)
  const [assistPanelPosition, setAssistPanelPosition] = useState<{
    left: number
    top: number
    width: number
    maxHeight: number
  } | null>(null)
  const visibleItemRows = hasLineItems
    ? itemRows.filter((item) => !deletedItemIds.includes(item.id))
    : []
  const addItem = () => {
    const item = {
      id: `item-${crypto.randomUUID()}`,
      name: "",
      quantity: "",
      unit: "MT",
      unitPrice: "",
      source: "직접입력",
    }
    setItemRows((rows) => [...rows, item])
    setItemValues((values) => ({ ...values, [item.id]: item }))
    onContentChange?.()
    window.requestAnimationFrame(() => firstItemInputRef.current?.focus())
  }
  const completedItemCount = visibleItemRows.filter((item) => {
    const values = itemValues[item.id]
    return Boolean(
      values?.name.trim() &&
      values.quantity.trim() &&
      values.unit.trim() &&
      values.unitPrice.trim()
    )
  }).length
  const requiredIssues: ReviewFocusTarget[] = fieldRows.flatMap((row) => {
    const slot = activeSchema.slots.find((candidate) => candidate.key === row.key)
    return slot?.required && !fieldValues[row.key]?.trim()
      ? [{ key: row.key, label: `${row.label} · 필수값 누락` }] : []
  })
  if (hasLineItems) {
    if (!visibleItemRows.length) requiredIssues.push({ key: "item_name", label: "품목 · 1개 이상 입력" })
    visibleItemRows.forEach((item, index) => {
      const values = itemValues[item.id]
      const names = { name: "품목명", quantity: "수량", unit: "단위", unitPrice: "단가" }
      for (const field of ["name", "quantity", "unit", "unitPrice"] as const) {
        const value = values?.[field]
        const missing = !value?.trim()
        const invalid = !missing && ["quantity", "unitPrice"].includes(field)
          && (decimalMagnitude(normalizeDecimalInput(value), FINANCE_DECIMAL_SCALE) ?? BigInt(-1)) < BigInt(0)
        if (missing || invalid) requiredIssues.push({
          key: `item-field:${index + 1}:${field}`,
          label: `품목 ${index + 1} ${names[field]} · ${missing ? "필수값 누락" : "0 이상의 숫자를 입력하세요"}`,
        })
      }
    })
  }
  const missingItemValueCount = requiredIssues.filter((issue) => issue.key.startsWith("item-field:")).length
  const requiredIssuesKey = JSON.stringify(requiredIssues)
  const reviewIssueCount = new Set([...requiredIssues.map((issue) => issue.key), ...reviewIssueKeys]).size
  const comparisonCounterparty =
    [
      "buyer_name",
      "customer_name",
      "supplier_name",
      "counterparty_name",
      "consignee_name",
      "applicant_name",
      "importer_name",
      "recipient_name",
    ]
      .map((key) => fieldValues[key]?.trim())
      .find(Boolean) ?? ""
  const comparisonItemNames = visibleItemRows
    .map((item) => itemValues[item.id]?.name.trim() ?? "")
    .filter(Boolean)
  const comparisonItemNamesKey = comparisonItemNames.join("\u001f")
  const comparisonTotalAmount = exactDocumentMoneyTotals(
    visibleItemRows.map((item) => ({
      quantity: itemValues[item.id]?.quantity,
      unit_price: itemValues[item.id]?.unitPrice,
    })),
    {},
  ).grandTotal
  const calculateItemAmount = (itemId: string) => {
    const values = itemValues[itemId]
    if (!values?.quantity.trim() || !values?.unitPrice.trim()) return "자동 계산"
    return `${quotationMoney(exactLineItemAmount(values.quantity, values.unitPrice))} ${fieldValues.currency?.trim() || "USD"}`
  }
  const itemAssistRows = itemRows.flatMap((item) => [
    {
      key: `${item.id}:name`,
      assists: [
        ["업로드값 사용", item.name],
        [
          "최근값 사용",
          item.id === "item-1"
            ? "Aluminium Scrap Taint Tabor"
            : "Aluminium Scrap Tough Taboo",
        ],
      ],
    },
    {
      key: `${item.id}:quantity`,
      assists: [
        ["업로드값 사용", item.quantity],
        ["최근값 사용", item.id === "item-1" ? "24" : "4"],
      ],
    },
    {
      key: `${item.id}:unitPrice`,
      assists: [
        ["최근값 사용", "128333"],
        ["거래값 사용", "120000"],
      ],
    },
  ])
  const openAssistPanel = (key: string, anchor: HTMLElement) => {
    const rect = anchor.getBoundingClientRect()
    const panelWidth = Math.min(360, Math.max(260, rect.width))
    const left = Math.min(
      Math.max(12, rect.left),
      window.innerWidth - panelWidth - 12
    )
    const bottomSpace = window.innerHeight - rect.bottom - 12
    const topSpace = rect.top - 12
    const opensUpward = bottomSpace < 140 && topSpace > bottomSpace
    const maxHeight = Math.min(
      240,
      Math.max(120, opensUpward ? topSpace - 6 : bottomSpace - 6)
    )
    const top = opensUpward
      ? Math.max(12, rect.top - maxHeight - 6)
      : rect.bottom + 6
    setAssistPanelKey(key)
    setAssistPanelPosition({ left, top, width: panelWidth, maxHeight })
  }
  const applyAssistValue = (key: string, value: string) => {
    if (key.includes(":")) {
      const [itemId, field] = key.split(":") as [
        string,
        "name" | "quantity" | "unitPrice",
      ]
      setItemValues((current) => ({
        ...current,
        [itemId]: {
          ...current[itemId],
          [field]: value,
        },
      }))
      onContentChange?.()
      setAssistPanelKey(null)
      setAssistPanelPosition(null)
      return
    }
    setFieldValues((current) => ({ ...current, [key]: value }))
    onContentChange?.()
    setAssistPanelKey(null)
    setAssistPanelPosition(null)
  }
  const activeAssistRow =
    fieldRows.find((row) => row.key === assistPanelKey) ??
    itemAssistRows.find((row) => row.key === assistPanelKey)
  useEffect(() => {
    if (itemFocusSignal === 0) return
    const hasOpenDraft = visibleItemRows.some((item) => {
      const values = itemValues[item.id]
      return (
        !values?.name.trim() ||
        !values.quantity.trim() ||
        !values.unit.trim() ||
        !values.unitPrice.trim()
      )
    })
    if (!hasOpenDraft) {
      const nextNumber = itemRows.length + 1
      const id = `item-${nextNumber}`
      // The separate document-element rail intentionally opens a new draft row.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItemRows((rows) => [
        ...rows,
        {
          id,
          name: "",
          quantity: "",
          unit: "MT",
          unitPrice: "",
          source: "직접입력",
        },
      ])
      setItemValues((current) => ({
        ...current,
        [id]: {
          name: "",
          quantity: "",
          unit: "MT",
          unitPrice: "",
        },
      }))
    }
    const focusTimer = window.setTimeout(() => {
      itemEditorRef.current?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      })
      firstItemInputRef.current?.focus()
      setItemEditorHighlighted(true)
    }, 80)
    const highlightTimer = window.setTimeout(
      () => setItemEditorHighlighted(false),
      1600
    )
    return () => {
      window.clearTimeout(focusTimer)
      window.clearTimeout(highlightTimer)
    }
  }, [itemFocusSignal]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!reviewFocusRequest) return
    const primaryTarget = reviewFocusRequest.targets[0]
    if (!primaryTarget) return
    const focusTimer = window.setTimeout(() => {
      if (primaryTarget.key.startsWith("item-field:")) {
        const [, index, field] = primaryTarget.key.split(":")
        const names: Record<string, string> = { name: "품목명", quantity: "수량", unit: "단위", unitPrice: "단가" }
        const control = panelRef.current?.querySelector<HTMLElement>(`[aria-label="품목 ${index} ${names[field]}"]`)
        control?.focus({ preventScroll: true })
        control?.closest("tr")?.scrollIntoView({ block: "center", behavior: "smooth" })
      } else if (
        primaryTarget.key === "item_name" ||
        primaryTarget.key === "item_amount"
      ) {
        itemEditorRef.current?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        })
        if (primaryTarget.key === "item_name")
          firstItemInputRef.current?.focus({ preventScroll: true })
        else firstItemUnitPriceRef.current?.focus({ preventScroll: true })
      } else {
        const target = panelRef.current?.querySelector<HTMLElement>(
          `[data-review-key="${primaryTarget.key}"]`
        )
        target?.scrollIntoView({ block: "center", behavior: "smooth" })
        target?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true })
      }
      setFocusedReviewKey(primaryTarget.key)
    }, 80)
    const highlightTimer = window.setTimeout(
      () => setFocusedReviewKey(null),
      1800
    )
    return () => {
      window.clearTimeout(focusTimer)
      window.clearTimeout(highlightTimer)
    }
  }, [reviewFocusRequest])
  useEffect(() => {
    onItemCountChange(completedItemCount)
  }, [completedItemCount, onItemCountChange])
  useEffect(() => {
    onRequiredMissingChange(JSON.parse(requiredIssuesKey) as ReviewFocusTarget[])
  }, [requiredIssuesKey, onRequiredMissingChange])
  useEffect(() => {
    onComparisonFactsChange?.({
      counterparty: comparisonCounterparty,
      currency: fieldValues.currency?.trim() ?? "",
      bankName: fieldValues.bank_name?.trim() ?? "",
      bankAccount: fieldValues.bank_account?.trim() ?? "",
      itemNames: comparisonItemNamesKey
        ? comparisonItemNamesKey.split("\u001f")
        : [],
      totalAmount: missingItemValueCount === 0 && visibleItemRows.length > 0 ? comparisonTotalAmount : null,
    })
  }, [
    comparisonCounterparty,
    comparisonItemNamesKey,
    comparisonTotalAmount,
    missingItemValueCount,
    visibleItemRows.length,
    fieldValues.bank_account,
    fieldValues.bank_name,
    fieldValues.currency,
    onComparisonFactsChange,
  ])
  return (
    <aside
      ref={panelRef}
      className="@container flex min-h-0 flex-col border-r bg-background"
      onChange={() => onContentChange?.()}
    >
      <div className="border-b px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">항목 확인</div>
            <div className="mt-1 max-w-72 truncate text-xs text-muted-foreground">
              {startBlank ? "직접 입력" : `출처 · ${sourceLabel}`}
            </div>
          </div>
          <ToneBadge tone={reviewIssueCount > 0 ? "danger" : "success"}>
            {reviewIssueCount > 0
              ? `검토 필요 ${reviewIssueCount}건`
              : "검토 완료"}
          </ToneBadge>
        </div>
      </div>

      <div className="field-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 @min-[720px]:grid-cols-2">
          {fieldRows.map((row) => (
            <div
              key={row.key}
              data-review-key={row.key}
              className={cn(
                "relative border-b bg-background px-5 py-4 transition-colors",
                focusedReviewKey === row.key && "scroll-mt-4"
              )}
            >
              <FormField
                label={row.label}
                htmlFor={`create-field-${row.key}`}
                badge={
                  <ToneBadge
                    tone={
                      reviewIssueKeys.has(row.key)
                        ? "danger"
                        : !fieldValues[row.key]?.trim()
                          ? "neutral"
                          : (row.tone as Tone)
                    }
                  >
                    {reviewIssueKeys.has(row.key)
                      ? "점검 불일치"
                      : !fieldValues[row.key]?.trim()
                        ? activeSchema.slots.some(
                            (slot) => slot.key === row.key && slot.required
                          )
                          ? "필수"
                          : "선택"
                        : row.status}
                  </ToneBadge>
                }
                sourceAction={!startBlank ? <Button type="button" variant="ghost" size="xs" onClick={onShowSource} aria-label={`${row.label} 원본 보기`}>원본 보기 <FileText className="size-3" /></Button> : undefined}
                message={reviewIssueKeys.has(row.key) ? "문서의 값과 비교해 주세요." : undefined}
                messageId={`create-field-${row.key}-message`}
                tone={reviewIssueKeys.has(row.key) ? "danger" : "neutral"}
                candidates={!startBlank && row.assists.length > 0 ? (
                  <CreateFieldValuePicker label={row.label} value={fieldValues[row.key] ?? ""} options={row.assists} onSelect={(value) => applyAssistValue(row.key, value)} />
                ) : undefined}
              >
              <div className="relative">
              <Input
                id={`create-field-${row.key}`}
                aria-describedby={reviewIssueKeys.has(row.key) ? `create-field-${row.key}-message` : undefined}
                className={cn("h-10 text-sm font-medium", row.kind === "money" && "pr-14")}
                aria-invalid={reviewIssueKeys.has(row.key) || requiredIssues.some((issue) => issue.key === row.key) || undefined}
                type={inputTypeForKind(row.kind)}
                inputMode={
                  isNumericInputKind(row.kind as PrototypeSlotKind)
                    ? "decimal"
                    : undefined
                }
                step={
                  isNumericInputKind(row.kind as PrototypeSlotKind)
                    ? "any"
                    : undefined
                }
                value={fieldValues[row.key] ?? ""}
                onChange={(event) => {
                  setFieldValues((current) => ({
                    ...current,
                    [row.key]: event.target.value,
                  }))
                }}
                placeholder={
                  !fieldValues[row.key] ? `${row.label} 입력` : undefined
                }
              />
              {row.kind === "money" ? (
                <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] font-medium text-muted-foreground">
                  {fieldValues.currency?.trim() || "USD"}
                </div>
              ) : null}
              </div>
              </FormField>
            </div>
          ))}
        </div>

        <div
          ref={itemEditorRef}
          className={cn(
            "border-t px-5 py-4 transition-colors duration-300",
            (itemEditorHighlighted || focusedReviewKey === "item_name" || focusedReviewKey === "item_amount") && "scroll-mt-4",
            !hasLineItems && "hidden"
          )}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">품목</div>
              {lineItemIssueLabels.length > 0 ? (
                <div className="mt-1 text-[11px] font-medium text-destructive">
                  은행 거절 전 점검 · {lineItemIssueLabels.join(", ")}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5">
              <ToneBadge
                tone={
                  completedItemCount === visibleItemRows.length &&
                  visibleItemRows.length > 0
                    ? "success"
                    : visibleItemRows.length > 0
                      ? "warning"
                      : "neutral"
                }
              >
                {visibleItemRows.length > 0
                  ? `${completedItemCount}/${visibleItemRows.length}`
                  : "품목 없음"}
              </ToneBadge>
              <Button variant="outline" size="sm" type="button" onClick={addItem}>
                <Plus data-icon="inline-start" /> 품목 추가
              </Button>
              {visibleItemRows.length > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="text-[11px] text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                  onClick={() => {
                    setDeletedItemIds(itemRows.map((item) => item.id))
                    setAssistPanelKey(null)
                    setAssistPanelPosition(null)
                    onContentChange?.()
                  }}
                >
                  전체 삭제
                </Button>
              ) : null}
            </div>
          </div>
          <div className="overflow-x-auto rounded-md border">
            <Table className="min-w-[640px] table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%] text-left!">품목명</TableHead>
                  <TableHead className="w-[12%] text-left!">수량</TableHead>
                  <TableHead className="w-[14%] text-left!">단위</TableHead>
                  <TableHead className="w-[16%] text-left!">단가</TableHead>
                  <TableHead className="w-[16%] text-right!">금액</TableHead>
                  <TableHead className="sticky right-0 z-10 w-[88px] bg-background text-right!">삭제</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleItemRows.map((item, index) => (
                  <TableRow
                    key={item.id}
                    className={cn(
                      itemEditorHighlighted && index === 0 && "bg-primary/5"
                    )}
                  >
                    <TableCell className="py-2 text-left! align-top">
                      <Input
                        ref={
                          index === visibleItemRows.length - 1
                            ? firstItemInputRef
                            : undefined
                        }
                        className="h-8"
                        aria-invalid={reviewIssueKeys.has("item_name") || requiredIssues.some((issue) => issue.key === `item-field:${index + 1}:name`) || undefined}
                        aria-label={`품목 ${index + 1} 품목명`}
                        aria-required="true"
                        value={itemValues[item.id]?.name ?? ""}
                        placeholder="필수"
                        onFocus={(event) =>
                          openAssistPanel(
                            `${item.id}:name`,
                            event.currentTarget
                          )
                        }
                        onChange={(event) =>
                          setItemValues((current) => ({
                            ...current,
                            [item.id]: {
                              ...current[item.id],
                              name: event.target.value,
                            },
                          }))
                        }
                      />
                      <span className="mt-1 block text-[10px] text-muted-foreground">
                        {item.source}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 text-left! align-top">
                      <Input
                        className="h-8"
                        aria-invalid={reviewIssueKeys.has("item_amount") || requiredIssues.some((issue) => issue.key === `item-field:${index + 1}:quantity`) || undefined}
                        aria-label={`품목 ${index + 1} 수량`}
                        aria-required="true"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={itemValues[item.id]?.quantity ?? ""}
                        placeholder="필수"
                        onFocus={(event) =>
                          openAssistPanel(
                            `${item.id}:quantity`,
                            event.currentTarget
                          )
                        }
                        onChange={(event) =>
                          setItemValues((current) => ({
                            ...current,
                            [item.id]: {
                              ...current[item.id],
                              quantity: event.target.value,
                            },
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell className="py-2 text-left! align-top">
                      <Select
                        value={itemValues[item.id]?.unit ?? "MT"}
                        onValueChange={(unit) =>
                          setItemValues((current) => ({
                            ...current,
                            [item.id]: {
                              ...current[item.id],
                              unit: unit ?? "MT",
                            },
                          }))
                        }
                      >
                        <SelectTrigger
                          className="h-8 w-full"
                          aria-label={`품목 ${index + 1} 단위`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["MT", "KG", "EA", "BOX"].map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-2 text-left! align-top">
                      <Input
                        ref={index === 0 ? firstItemUnitPriceRef : undefined}
                        className="h-8"
                        aria-invalid={reviewIssueKeys.has("item_amount") || requiredIssues.some((issue) => issue.key === `item-field:${index + 1}:unitPrice`) || undefined}
                        aria-label={`품목 ${index + 1} 단가`}
                        aria-required="true"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={itemValues[item.id]?.unitPrice ?? ""}
                        placeholder="필수"
                        onFocus={(event) =>
                          openAssistPanel(
                            `${item.id}:unitPrice`,
                            event.currentTarget
                          )
                        }
                        onChange={(event) =>
                          setItemValues((current) => ({
                            ...current,
                            [item.id]: {
                              ...current[item.id],
                              unitPrice: event.target.value,
                            },
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell
                      className={cn(
                        "py-2 text-right! align-top text-xs font-medium tabular-nums",
                        reviewIssueKeys.has("item_amount") && "text-destructive"
                      )}
                    >
                      <div className="flex h-8 items-center justify-end whitespace-nowrap">
                        {calculateItemAmount(item.id)}
                      </div>
                    </TableCell>
                    <TableCell className="sticky right-0 bg-background px-2 py-2 text-right! align-top">
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        className="px-2 text-muted-foreground hover:text-destructive"
                        aria-label={`품목 ${index + 1} 삭제`}
                        onClick={() => {
                          setDeletedItemIds((ids) => [...ids, item.id])
                          setAssistPanelKey(null)
                          setAssistPanelPosition(null)
                          onContentChange?.()
                        }}
                      >
                        <Trash2 className="size-3.5" /> 삭제
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {visibleItemRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-20 text-center text-xs text-muted-foreground"
                    >
                      품목 없음
                      <Button
                        variant="link"
                        size="sm"
                        type="button"
                        className="ml-2 h-auto p-0 text-primary"
                        onClick={() => {
                          setDeletedItemIds([])
                          onContentChange?.()
                        }}
                      >
                        되돌리기
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      {activeAssistRow && assistPanelPosition ? (
        <div
          className="fixed z-[100] rounded-lg border bg-background p-1.5 shadow-xl"
          style={{
            left: assistPanelPosition.left,
            top: assistPanelPosition.top,
            width: assistPanelPosition.width,
          }}
          onMouseLeave={() => {
            setAssistPanelKey(null)
            setAssistPanelPosition(null)
          }}
        >
          <div
            className="overflow-auto"
            style={{ maxHeight: assistPanelPosition.maxHeight }}
          >
            {activeAssistRow.assists.map(([label, value]) => (
              <Button
                variant="ghost"
                key={`${activeAssistRow.key}-${label}-${value}`}
                type="button"
                className="h-auto w-full justify-between gap-3 px-2 py-2 text-left text-xs font-normal"
                onClick={() => applyAssistValue(activeAssistRow.key, value)}
              >
                <span className="shrink-0 text-muted-foreground">{label}</span>
                <span className="min-w-0 truncate font-medium text-foreground">
                  {value}
                </span>
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  )
}

// Kept as a reference fallback for the earlier copy-polish overlay.
function CopyPolishOverlay({
  onComplete,
  onClose,
}: {
  onComplete: () => void
  onClose: () => void
}) {
  return (
    <section className="absolute inset-y-0 right-0 left-0 z-20 flex flex-col bg-background shadow-[-16px_0_40px_rgb(31_41_55/0.12)] lg:left-[280px] xl:left-[300px]">
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-6">
        <div>
          <div className="text-sm font-semibold">AI 문구 다듬기</div>
          <div className="mt-1 text-xs text-muted-foreground">
            계약서 상세 문구를 검토하고 필요한 조항만 다듬습니다.
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            닫기
          </Button>
          <Button size="sm" onClick={onComplete}>
            완료
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,0.92fr)_minmax(360px,0.48fr)]">
        <div className="min-h-0 overflow-auto bg-background p-6">
          <div className="mx-auto max-w-[760px] rounded-lg border bg-background p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-primary">
              <Bot data-icon="inline-start" /> 계약서 상세 입력
            </div>
            <Textarea
              className="min-h-[360px] resize-none bg-muted/25 text-sm leading-6"
              defaultValue={`제2조 결제조건
매수인은 계약 체결 후 10%를 선금으로 지급하고, 잔금은 선적서류 사본 수령 후 전신환으로 지급한다.

제4조 선적 및 인도
매도인은 합의된 선적 일정에 따라 물품을 선적하고, 선적 지연이 예상되는 경우 즉시 매수인에게 통지한다.`}
            />
            <div className="mt-4 flex items-start gap-2 rounded-lg border bg-muted/25 px-3 py-2">
              <Bot className="mt-2 text-primary" data-icon="inline-start" />
              <AutoResizeTextarea placeholder="제2조 결제조건을 더 정중하고 짧게 다듬어줘" />
            </div>
          </div>
        </div>

        <aside className="min-h-0 overflow-auto border-l bg-background p-5">
          <div className="text-sm font-semibold">AI 검토</div>
          <div className="mt-3 grid gap-3">
            {[
              [
                "결제조건",
                "문장이 길어 고객 전달용으로 단순화 권장",
                "warning",
              ],
              ["선적 지연 통지", "책임 범위가 명확합니다.", "success"],
              ["용어", "T/T, 선적서류 사본 표현 유지", "blue"],
            ].map(([title, body, tone]) => (
              <div key={title} className="rounded-lg border bg-muted/25 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold">{title}</div>
                  <ToneBadge tone={tone as Tone}>
                    {tone === "warning" ? "권장" : "확인"}
                  </ToneBadge>
                </div>
                <div className="mt-2 text-xs leading-5 text-muted-foreground">
                  {body}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  )
}

type DocumentSourceMode = "deal" | "files"

function DocumentSourceSetupStep({
  templateCode,
  onTemplateChange,
  selectedDeal,
  onSelectDeal,
  sourceMode,
  onSourceModeChange,
  selectedSources,
  onToggleSource,
  naturalLanguagePrompt,
  onNaturalLanguagePromptChange,
  sourceChangesPending,
  onApplySource,
}: {
  templateCode: string
  onTemplateChange: (code: string) => void
  selectedDeal: DealDocumentContext | null
  onSelectDeal: (deal: DealDocumentContext) => void
  sourceMode: DocumentSourceMode
  onSourceModeChange: (mode: DocumentSourceMode) => void
  selectedSources: Set<string>
  onToggleSource: (title: string) => void
  naturalLanguagePrompt: string
  onNaturalLanguagePromptChange: (value: string) => void
  sourceChangesPending: boolean
  onApplySource: () => void
}) {
  const selectedTemplate =
    templates.find(([code]) => code === templateCode) ?? null
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const [templateQuery, setTemplateQuery] = useState("")
  const [dealQuery, setDealQuery] = useState("")
  const selectedSourceDetails = draftSources.filter((source) =>
    selectedSources.has(source.title)
  )
  const fileSourceSummary =
    selectedSourceDetails.length > 0
      ? selectedSourceDetails
          .map(
            (source) =>
              `[${source.direction === "purchase" ? "매입" : source.direction === "sales" ? "매출" : "방향 확인"}] ${source.title}`
          )
          .join(" · ")
      : ""
  const dealSourceSummary = selectedDeal
    ? `거래 ${selectedDeal.id} · ${selectedDeal.party}`
    : ""
  const sourceSummary = [dealSourceSummary, fileSourceSummary]
    .filter(Boolean)
    .join(" ")
  const canContinue = Boolean(
    selectedTemplate &&
    (sourceSummary || naturalLanguagePrompt.trim().length > 0)
  )
  const visibleDeals = documentSourceDeals.filter((deal) =>
    [deal.id, deal.title, deal.party, deal.item].some((value) =>
      value.toLowerCase().includes(dealQuery.trim().toLowerCase())
    )
  )
  return (
    <section className="flex h-full min-h-0 flex-col bg-[var(--surface-background)]">
      <div className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-[var(--surface-border)] px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-sm font-semibold">내용 입력</h2>
          <ToneBadge
            tone={
              !canContinue
                ? "warning"
                : sourceChangesPending
                  ? "warning"
                  : "success"
            }
          >
            {!canContinue
              ? "입력 필요"
              : sourceChangesPending
                ? "반영 대기"
                : "항목 반영됨"}
          </ToneBadge>
        </div>
        <Sparkles className="size-4 shrink-0 text-primary" />
      </div>

      <ScrollArea type="auto" className="min-h-0 flex-1">
        <div className="space-y-5 p-4 sm:p-5">
          <section>
            <div className="mb-2 text-xs font-semibold">선택한 문서</div>
            <div className="flex items-center gap-3 rounded-lg border bg-background p-3 shadow-xs">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-background text-xs font-semibold text-primary">
                {selectedTemplate?.[0] ?? "—"}
              </span>
              <div className="mr-auto min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-semibold">
                    {selectedTemplate?.[1] ?? "문서 유형 선택"}
                  </span>
                  {selectedTemplate?.[3] ? (
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {selectedTemplate[3]}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 truncate text-[11px] text-muted-foreground">
                  {selectedTemplate
                    ? templateFieldSummary(selectedTemplate[0])
                    : "만들 문서 유형을 선택하세요"}
                </p>
              </div>
              <Popover
                open={templatePickerOpen}
                onOpenChange={(open) => {
                  setTemplatePickerOpen(open)
                  if (!open) setTemplateQuery("")
                }}
              >
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="shrink-0">
                    문서 유형 <ChevronDown data-icon="inline-end" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-[min(420px,calc(100vw-2rem))] gap-0 p-0"
                >
                  <div className="border-b p-3">
                    <div className="text-xs font-semibold">문서 유형</div>
                    <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                      유형에 따라 오른쪽 확인 항목과 PDF 양식이 구성됩니다.
                    </p>
                    <div className="mt-3">
                      <DocumentTemplateOptions
                        templates={templates}
                        selectedCode={templateCode}
                        query={templateQuery}
                        onQueryChange={setTemplateQuery}
                        onSelect={(code) => {
                          onTemplateChange(code)
                          setTemplatePickerOpen(false)
                          setTemplateQuery("")
                        }}
                        autoFocus
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </section>

          <section>
            <div className="overflow-hidden rounded-lg border bg-background shadow-xs">
              <div className="flex flex-wrap items-center gap-3 border-b bg-background px-3.5 py-3">
                <FormFieldHeader className="flex-1" label="만들 내용" htmlFor="document-source-prompt" badge={
<ToneBadge
                    tone={
                      !canContinue
                        ? "warning"
                        : sourceChangesPending
                          ? "warning"
                          : "success"
                    }
                  >
                    {!canContinue
                      ? "입력 필요"
                      : sourceChangesPending
                        ? "반영 전"
                        : "반영됨"}
                  </ToneBadge>                } />
                  <Button
                    type="button"
                    size="sm"
                    disabled={!canContinue || !sourceChangesPending}
                    onClick={onApplySource}
                  >
                    {!canContinue || sourceChangesPending ? (
                      <Sparkles data-icon="inline-start" />
                    ) : (
                      <Check data-icon="inline-start" />
                    )}
                    {!canContinue || sourceChangesPending
                      ? "항목에 반영"
                      : "반영됨"}
                  </Button>
              </div>

              <div className="p-3.5">
                {sourceSummary ? (
                  <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold text-primary">
                        연결 근거
                      </span>
                      <ToneBadge
                        tone={sourceChangesPending ? "warning" : "success"}
                      >
                        {sourceChangesPending ? "반영 전" : "반영됨"}
                      </ToneBadge>
                    </div>
                    <p className="mt-1.5 line-clamp-3 text-[11px] leading-5 text-foreground">
                      {sourceSummary}
                    </p>
                  </div>
                ) : null}

                <Textarea
                  id="document-source-prompt"
                  aria-label="만들 내용을 자연어로 입력"
                  className="mt-3 min-h-36 resize-none bg-background text-sm leading-6"
                  value={naturalLanguagePrompt}
                  onChange={(event) =>
                    onNaturalLanguagePromptChange(event.target.value)
                  }
                  placeholder="예: ACME GmbH에 알루미늄 스크랩 20MT를 판매하는 계약서를 만들어줘. 결제조건은 T/T 30 days, 인코텀즈는 CIF Hamburg."
                />
              </div>
            </div>

            <Tabs
              value={sourceMode}
              onValueChange={(value) =>
                onSourceModeChange(value as DocumentSourceMode)
              }
              className="mt-3 overflow-hidden rounded-lg border bg-background"
            >
              <TabsList className="grid h-10 w-full grid-cols-2 rounded-none border-0 border-b bg-background p-0">
                <TabsTrigger
                  value="files"
                  className="h-10 rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-background px-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  <FileText data-icon="inline-start" />
                  문서함
                  {selectedSources.size > 0 ? ` ${selectedSources.size}` : ""}
                </TabsTrigger>
                <TabsTrigger
                  value="deal"
                  className="h-10 rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-background px-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  <Building2 data-icon="inline-start" />
                  거래{selectedDeal ? " 1" : ""}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="files" className="m-0 p-3">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-3 px-1 text-[11px] text-muted-foreground">
                    <span>문서함</span>
                    <span>{selectedSources.size}/3</span>
                  </div>
                  {draftSources.map((source) => {
                    const selected = selectedSources.has(source.title)
                    return (
                      <Button
                        key={source.title}
                        type="button"
                        variant="ghost"
                        disabled={!source.eligible}
                        className={cn(
                          "grid h-auto min-h-16 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border px-3 py-2 text-left font-normal",
                          selected && "border-primary bg-primary/5"
                        )}
                        onClick={() => onToggleSource(source.title)}
                      >
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5">
                            <FileText className="size-3.5 shrink-0 text-primary" />
                            <ToneBadge
                              tone={
                                source.direction === "sales"
                                  ? "success"
                                  : source.direction === "purchase"
                                    ? "blue"
                                    : "warning"
                              }
                            >
                              {source.direction === "sales"
                                ? "매출"
                                : source.direction === "purchase"
                                  ? "매입"
                                  : "방향 확인"}
                            </ToneBadge>
                            <strong className="truncate text-xs">
                              {source.title}
                            </strong>
                          </span>
                          <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                            {source.meta} ·{" "}
                            {source.facts.slice(0, 2).join(" · ")}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-full border",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "text-transparent"
                          )}
                        >
                          <Check className="size-3" />
                        </span>
                      </Button>
                    )
                  })}
                </div>
              </TabsContent>

              <TabsContent value="deal" className="m-0 p-3">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-xs font-semibold">거래</div>
                    <ToneBadge tone={selectedDeal ? "success" : "neutral"}>
                      {selectedDeal ? "1건 선택" : "확정 전 필수"}
                    </ToneBadge>
                  </div>
                  <div className="relative mt-3">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="h-8 bg-background pl-8 text-xs"
                      value={dealQuery}
                      onChange={(event) => setDealQuery(event.target.value)}
                      placeholder="거래번호, 거래명, 거래처 검색"
                      aria-label="거래 검색"
                    />
                  </div>
                  <ScrollArea className="mt-2 max-h-72">
                    <div className="grid gap-1.5 pr-1">
                      {visibleDeals.map((deal) => {
                        const selected = deal.id === selectedDeal?.id
                        return (
                          <Button
                            key={deal.id}
                            type="button"
                            variant="ghost"
                            className={cn(
                              "grid h-auto min-h-20 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border bg-background px-3 py-2.5 text-left font-normal",
                              selected && "border-primary bg-primary/5"
                            )}
                            onClick={() => onSelectDeal(deal)}
                          >
                            <span className="min-w-0">
                              <span className="flex min-w-0 items-center gap-2">
                                <strong className="truncate text-xs">
                                  {deal.title}
                                </strong>
                                <ToneBadge tone={deal.tone}>
                                  {deal.stage}
                                </ToneBadge>
                              </span>
                              <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                                {deal.id} · {deal.party}
                              </span>
                              <span className="mt-1 block truncate text-[11px] font-medium">
                                {deal.item} · {deal.amount} {deal.currency}
                              </span>
                            </span>
                            <span
                              className={cn(
                                "flex size-5 shrink-0 items-center justify-center rounded-full border",
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "text-transparent"
                              )}
                            >
                              <Check className="size-3" />
                            </span>
                          </Button>
                        )
                      })}
                      {visibleDeals.length === 0 ? (
                        <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                          일치하는 거래가 없습니다.
                        </div>
                      ) : null}
                    </div>
                  </ScrollArea>
                  {selectedDeal ? (
                    <div className="mt-2 flex flex-wrap gap-1.5 border-t pt-2">
                      {["거래처", "통화", "품목", "금액", "결제조건"].map(
                        (fact) => (
                          <ToneBadge key={fact} tone="blue">
                            {fact}
                          </ToneBadge>
                        )
                      )}
                    </div>
                  ) : null}
                </div>
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </ScrollArea>
    </section>
  )
}

type DocumentDiscrepancyFinding = {
  key: string
  label: string
  detail: string
  source: string
  currentValue: string
  referenceValue: string
  state: "pass" | "warning" | "error"
}

type DocumentDiscrepancyReview = {
  blocking: boolean
  errorCount: number
  warningCount: number
  findings: DocumentDiscrepancyFinding[]
  referenceDocuments: string[]
  basisReady: boolean
  basisDocument: string | null
  basisMessage: string
}

const normalizeComparisonText = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9가-힣]/g, "")

const documentReferenceCode = (name: string) => {
  const normalized = name.trim().toUpperCase()
  if (normalized.includes("계약서")) return "SC"
  if (normalized.includes("인보이스")) return "CI"
  if (normalized.includes("발주서")) return "PO"
  if (normalized.includes("견적송장")) return "PI"
  if (normalized.includes("포장명세서")) return "PL"
  if (normalized.includes("B/L")) return "BL"
  return normalized.match(/^([A-Z]+)[-_]/)?.[1] ?? ""
}

const pickReferenceDocument = (names: string[], priority: string[]) => {
  for (const code of priority) {
    const found = names.find((name) => documentReferenceCode(name) === code)
    if (found) return found
  }
  return names[0] ?? null
}

function buildDocumentDiscrepancyReview({
  templateCode,
  comparisonFacts,
  relatedDeal,
  dealFacts,
  referenceDocuments,
}: {
  templateCode: string
  comparisonFacts: DocumentComparisonFacts | null
  relatedDeal: DealDocumentContext | null
  dealFacts: DocumentSourceDeal | null
  referenceDocuments: string[]
}): DocumentDiscrepancyReview {
  if (!comparisonFacts || !relatedDeal) {
    return {
      blocking: false,
      errorCount: 0,
      warningCount: 0,
      findings: [],
      referenceDocuments: [],
      basisReady: false,
      basisDocument: null,
      basisMessage:
        "거래를 연결하면 거래처·방향과 문서 간 일치 여부를 추가로 점검합니다.",
    }
  }

  const findings: DocumentDiscrepancyFinding[] = []
  const isInvoice = templateCode === "CI"
  const generalReference = pickReferenceDocument(
    referenceDocuments,
    templateCode === "SC"
      ? ["PO", "PI", "CI", "LC", "PL", "BL"]
      : ["CI", "PI", "SC", "PO", "LC", "PL", "BL"]
  )
  const invoiceBaseline = isInvoice
    ? pickReferenceDocument(
        referenceDocuments.filter((name) =>
          ["PI", "SC", "PO"].includes(documentReferenceCode(name))
        ),
        ["PI", "SC", "PO"]
      )
    : null
  const basisDocument = isInvoice ? invoiceBaseline : generalReference
  const basisReady = Boolean(basisDocument)
  const basisMessage = basisReady
    ? ""
    : isInvoice
      ? "PI, 계약서 또는 PO가 연결되면 CI의 금액·품목도 자동으로 대조합니다."
      : "같은 거래의 다른 문서가 연결되면 통화·수취인·계좌를 자동으로 대조합니다."
  const targetCounterparty = comparisonFacts.counterparty.trim()
  const dealCounterparty = relatedDeal.party.trim()
  if (targetCounterparty && dealCounterparty) {
    const matched =
      normalizeComparisonText(targetCounterparty) ===
      normalizeComparisonText(dealCounterparty)
    findings.push({
      key: "counterparty",
      label: "연결 거래처명",
      detail: matched
        ? `${targetCounterparty} · 거래 확정값과 일치`
        : `${targetCounterparty} ≠ ${dealCounterparty}`,
      source: generalReference ?? `거래 ${relatedDeal.id}`,
      currentValue: targetCounterparty,
      referenceValue: dealCounterparty,
      state: matched ? "pass" : "error",
    })
  }

  if (comparisonFacts.currency && dealFacts?.currency) {
    const matched =
      comparisonFacts.currency.toUpperCase() ===
      dealFacts.currency.toUpperCase()
    findings.push({
      key: "currency",
      label: "통화",
      detail: matched
        ? `${comparisonFacts.currency.toUpperCase()} · 기준 문서와 일치`
        : `${comparisonFacts.currency.toUpperCase()} ≠ ${dealFacts.currency.toUpperCase()}`,
      source: generalReference ?? "기준 문서 연결 필요",
      currentValue: comparisonFacts.currency.toUpperCase(),
      referenceValue: dealFacts.currency.toUpperCase(),
      state: generalReference ? (matched ? "pass" : "error") : "warning",
    })
  }

  const schema = templateSchemas[templateCode] ?? templateSchemas.SC
  const hasBankFields = schema.slots.some((slot) =>
    ["bank_name", "bank_account", "bank_swift"].includes(slot.key)
  )
  if (
    hasBankFields &&
    (comparisonFacts.bankName || comparisonFacts.bankAccount)
  ) {
    const bankMatched =
      comparisonFacts.bankName === sampleSlotValues.bank_name &&
      comparisonFacts.bankAccount === sampleSlotValues.bank_account
    findings.push({
      key: "recipient-account",
      label: "수취 은행·계좌",
      detail: generalReference
        ? bankMatched
          ? `${comparisonFacts.bankName} · 계좌 끝자리 ${comparisonFacts.bankAccount.slice(-4)} 일치`
          : "기준 문서의 수취 은행 또는 계좌와 다름"
        : "비교할 연결 문서의 은행 정보가 없습니다.",
      source: generalReference ?? "기준 문서 연결 필요",
      currentValue: [comparisonFacts.bankName, comparisonFacts.bankAccount]
        .filter(Boolean)
        .join(" · "),
      referenceValue: generalReference
        ? `${sampleSlotValues.bank_name} · ${sampleSlotValues.bank_account}`
        : "정보 없음",
      state: generalReference ? (bankMatched ? "pass" : "error") : "warning",
    })
  }

  if (isInvoice && comparisonFacts.totalAmount && dealFacts?.amount) {
    const dealAmount = normalizeDecimalInput(dealFacts.amount)
    const currentAmount = decimalMagnitude(comparisonFacts.totalAmount, FINANCE_DECIMAL_SCALE)
    const baselineAmount = decimalMagnitude(dealAmount, FINANCE_DECIMAL_SCALE)
    const matched = currentAmount !== null && baselineAmount !== null && currentAmount === baselineAmount
      && comparisonFacts.currency.toUpperCase() === dealFacts.currency.toUpperCase()
    findings.push({
      key: "amount",
      label: "송장 금액",
      detail: matched
        ? `${quotationMoney(comparisonFacts.totalAmount)} ${dealFacts.currency} · 기준 금액과 일치`
        : `${quotationMoney(comparisonFacts.totalAmount)} ${comparisonFacts.currency} ≠ ${quotationMoney(dealAmount)} ${dealFacts.currency}`,
      source: invoiceBaseline ?? "PI·계약서·PO 연결 필요",
      currentValue: `${quotationMoney(comparisonFacts.totalAmount)} ${comparisonFacts.currency}`,
      referenceValue: `${quotationMoney(dealAmount)} ${dealFacts.currency}`,
      state: invoiceBaseline ? (matched ? "pass" : "error") : "warning",
    })
  }

  if (isInvoice && comparisonFacts.itemNames.length > 0 && dealFacts?.item) {
    const baselineItem = dealFacts.item.split("·")[0]?.trim() ?? ""
    const matched = comparisonFacts.itemNames.some((item) => {
      const current = normalizeComparisonText(item)
      const baseline = normalizeComparisonText(baselineItem)
      return current.includes(baseline) || baseline.includes(current)
    })
    findings.push({
      key: "goods",
      label: "품목명",
      detail: matched
        ? `${comparisonFacts.itemNames[0]} · 기준 문서와 일치`
        : `${comparisonFacts.itemNames[0]} ≠ ${baselineItem}`,
      source: invoiceBaseline ?? "PI·계약서·PO 연결 필요",
      currentValue: comparisonFacts.itemNames[0],
      referenceValue: baselineItem || "정보 없음",
      state: invoiceBaseline ? (matched ? "pass" : "warning") : "warning",
    })
  }

  const errorCount = findings.filter(
    (finding) => finding.state === "error"
  ).length
  const warningCount = findings.filter(
    (finding) => finding.state === "warning"
  ).length
  return {
    blocking: errorCount > 0,
    errorCount,
    warningCount,
    findings,
    referenceDocuments,
    basisReady,
    basisDocument,
    basisMessage,
  }
}

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

type ReviewChecklistState = "complete" | "pending" | "blocked"
type ReviewChecklistAction =
  "review" | "deal" | "bank" | "approval" | "rejection"
type ReviewChecklistRow = {
  label: string
  value: string
  state: ReviewChecklistState
  action?: ReviewChecklistAction
}

function buildDocumentReviewRows({
  missingRequiredCount,
  documentStyle,
  saveState,
  qualityAcknowledged,
  relatedDeal,
  dealConnectionRestricted = false,
  discrepancyReview,
  approvalChoice,
  approvalStatus,
  selectedApproverCount,
  lastRequestEvent,
  lastDecisionEvent,
  confirmationReady,
  documentConfirmed,
  templateCode,
  documentNumber = `${templateCode}-2026-0708`,
  activeLinkCount = 0,
  deliveryRecordCount = 0,
  interactive = true,
  approvalEnabled = false,
  deliveryAllowed = true,
}: {
  missingRequiredCount: number
  documentStyle: DocumentStyle
  saveState: DocumentSaveState
  qualityAcknowledged: boolean
  relatedDeal: DealDocumentContext | null
  dealConnectionRestricted?: boolean
  discrepancyReview: Pick<
    DocumentDiscrepancyReview,
    "blocking" | "errorCount"
  > &
    Partial<Pick<DocumentDiscrepancyReview, "basisReady" | "warningCount">>
  approvalChoice: DocumentApprovalChoice
  approvalStatus: DocumentElementStatus["approval"]
  selectedApproverCount: number
  lastRequestEvent?: DocumentApprovalEvent
  lastDecisionEvent?: DocumentApprovalEvent
  confirmationReady: boolean
  documentConfirmed: boolean
  templateCode: string
  documentNumber?: string
  activeLinkCount?: number
  deliveryRecordCount?: number
  interactive?: boolean
  approvalEnabled?: boolean
  deliveryAllowed?: boolean
}): ReviewChecklistRow[] {
  const saveComplete = saveState === "saved"
  const approvalRequested = approvalStatus === "requested"
  const approvalDone = approvalStatus === "approved"
  const approvalRejected = approvalStatus === "rejected"
  const bankReviewReady = discrepancyReview.basisReady ?? false
  const bankWarningCount = discrepancyReview.warningCount ?? 0
  const approvalSetupAvailable = qualityAcknowledged && Boolean(relatedDeal)
  const approvalRequestValue =
    !approvalSetupAvailable && approvalStatus === "idle"
      ? "PDF 검토·거래 연결 후 설정"
      : approvalChoice === "none"
        ? "승인 없음"
        : approvalRequested || approvalDone || approvalRejected
          ? `${selectedApproverCount}명 · ${lastRequestEvent?.occurredAt ?? "요청됨"}`
          : selectedApproverCount > 0
            ? `${selectedApproverCount}명 선택 · 요청 전`
            : "승인자 선택 필요"
  const approvalResultValue =
    approvalChoice === "none"
      ? "적용 안 함"
      : approvalDone && lastDecisionEvent
        ? `${lastDecisionEvent.actor} 승인 · ${lastDecisionEvent.occurredAt}`
        : approvalRejected && lastDecisionEvent
          ? `반려 · ${lastDecisionEvent.reason ?? "사유 확인 필요"}`
          : approvalRequested
            ? "승인자 응답 대기"
            : "요청 전"

  return [
    {
      label: "필수 항목",
      value:
        missingRequiredCount > 0
          ? `${missingRequiredCount}개 누락`
          : "누락 없음",
      state: missingRequiredCount === 0 ? "complete" : "blocked",
    },
    {
      label: "품목 합계",
      value: "계약금액과 대조됨",
      state: "complete",
    },
    {
      label: "문서 모양",
      value:
        documentStyle.logo?.source === "organization"
          ? "기업 기본 로고"
          : documentStyle.logo
            ? "새 로고 포함"
            : "로고 없음",
      state: "complete",
    },
    {
      label: "변경사항 저장",
      value:
        saveState === "saved"
          ? "저장 완료"
          : saveState === "saving"
            ? "저장 중"
            : "저장 필요",
      state: saveComplete
        ? "complete"
        : saveState === "saving"
          ? "pending"
          : "blocked",
    },
    {
      label: "문서 결과 검토",
      value: qualityAcknowledged ? "검토 완료" : "확인 필요",
      state: qualityAcknowledged ? "complete" : "blocked",
      action: interactive ? "review" : undefined,
    },
    {
      label: "거래 연결",
      value: dealConnectionRestricted
        ? "연결됨 · 상세 접근 제한"
        : relatedDeal
          ? `${relatedDeal.id} · ${relatedDeal.party}`
          : "연결 필요",
      state:
        relatedDeal || (dealConnectionRestricted && documentConfirmed)
          ? "complete"
          : "blocked",
      action:
        interactive && !relatedDeal && !dealConnectionRestricted
          ? "deal"
          : undefined,
    },
    ...(bankReviewReady
      ? [
          {
            label: "은행 거절 전 점검",
            value: discrepancyReview.blocking
              ? `불일치 ${discrepancyReview.errorCount}건`
              : discrepancyReview.errorCount > 0
                ? `불일치 ${discrepancyReview.errorCount}건 확인`
                : bankWarningCount > 0
                  ? `확인 권장 ${bankWarningCount}건`
                  : "통과",
            state: discrepancyReview.blocking
              ? ("blocked" as const)
              : bankWarningCount > 0
                ? ("pending" as const)
                : ("complete" as const),
            action:
              interactive &&
              (discrepancyReview.blocking || bankWarningCount > 0)
                ? ("bank" as const)
                : undefined,
          },
        ]
      : []),
    ...(approvalEnabled
      ? [
          {
            label: "승인 요청",
            value: approvalRequestValue,
            state:
              !approvalSetupAvailable && approvalStatus === "idle"
                ? ("blocked" as const)
                : approvalChoice === "none" ||
                    approvalRequested ||
                    approvalDone ||
                    approvalRejected
                  ? ("complete" as const)
                  : ("pending" as const),
            action:
              interactive && approvalStatus === "idle" && approvalSetupAvailable
                ? ("approval" as const)
                : undefined,
          },
          {
            label: "승인 결과",
            value: approvalResultValue,
            state:
              approvalChoice === "none" || approvalDone
                ? ("complete" as const)
                : approvalRejected
                  ? ("blocked" as const)
                  : ("pending" as const),
            action:
              interactive && approvalRejected
                ? ("rejection" as const)
                : undefined,
          },
        ]
      : []),
    {
      label: "문서 확정",
      value: documentConfirmed
        ? `${documentNumber}.pdf`
        : confirmationReady
          ? "상단에서 확정 가능"
          : approvalEnabled && approvalRejected
            ? "수정·재검토 후 재승인 필요"
            : approvalEnabled && approvalRequested
              ? "승인 완료 후 표시"
              : approvalEnabled &&
                  approvalChoice === "request" &&
                  approvalStatus === "idle"
                ? "승인 완료 후 표시"
                : dealConnectionRestricted
                  ? "Deal 접근 권한 필요"
                  : relatedDeal
                    ? "검토 완료 후 가능"
                    : "거래 연결 후 가능",
      state: documentConfirmed
        ? "complete"
        : confirmationReady
          ? "pending"
          : "blocked",
    },
    {
      label: "공유 링크 생성",
      value:
        activeLinkCount > 0
          ? `활성 링크 ${activeLinkCount}개`
          : !deliveryAllowed
            ? "고객 전달 권한 필요"
            : documentConfirmed
              ? "링크 생성 가능"
              : "문서 확정 후 가능",
      state:
        activeLinkCount > 0
          ? "complete"
          : documentConfirmed && deliveryAllowed
            ? "pending"
            : "blocked",
    },
    {
      label: "전달·공유",
      value:
        deliveryRecordCount > 0
          ? `전달 완료 ${deliveryRecordCount}건`
          : !deliveryAllowed
            ? "고객 전달 권한 필요"
            : activeLinkCount > 0
              ? "생성한 링크 전달 전"
              : "공유 링크 생성 후 가능",
      state:
        deliveryRecordCount > 0
          ? "complete"
          : activeLinkCount > 0
            ? "pending"
            : "blocked",
    },
  ]
}

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
        AI가 연결 거래 {relatedDeal.id}의 서류 간 불일치(통화·금액·거래처·L/C)를
        발송 전에 점검합니다.
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

function DocumentReviewSharePanel({
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
    if (!file.type.startsWith("image/")) {
      setLogoError("PNG, JPG, SVG 이미지 파일만 사용할 수 있습니다.")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("로고 파일은 2MB 이하만 사용할 수 있습니다.")
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
    <aside className="flex h-full min-h-0 flex-col bg-[var(--surface-background)]">
      <div className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-[var(--surface-border)] px-4 py-2.5 sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-semibold">
              {documentConfirmed ? "링크·이메일로 보내기" : "검토·확정"}
            </h2>
            <ToneBadge tone={documentConfirmed ? "success" : "warning"}>
              {documentConfirmed ? "확정됨" : "초안"}
            </ToneBadge>
          </div>
          {!documentConfirmed ? (
            <p className="mt-1 text-[11px] text-muted-foreground">
              {templateTitle} · {documentNumber}.pdf
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

      <ScrollArea className="min-h-0 flex-1">
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
                    accept="image/png,image/jpeg,image/svg+xml,.png,.jpg,.jpeg,.svg"
                    aria-label="로고 파일 선택 또는 끌어놓기"
                    label="로고 파일 선택"
                    instructions="PNG, JPG, SVG · 최대 2MB"
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
                        PNG, JPG, SVG · 최대 2MB
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
                          .some((previous) => previous.type === "reject")
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
                                  : "blue"
                            }
                          >
                            {event.type === "approve"
                              ? "승인"
                              : event.type === "reject"
                                ? "반려"
                                : isRetryRequest
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
                                : `반려 사유 · ${event.reason ?? "사유 없음"}`}
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
                    <Button variant="outline" size="sm" onClick={() => window.open("/share/preview", "_blank", "noopener,noreferrer")}>
                      <ExternalLink className="size-3.5" /> 수신 화면 미리보기
                    </Button>
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

function DocumentConfirmedSummaryPanel({
  approvalChoice,
  approvalStatus,
  selectedApproverIds,
  approvalEvents,
  templateCode,
  documentNumber,
  documentStyle,
  activeLinkCount,
  deliveryRecordCount,
  deliveryCompleted,
  activeLink,
  latestEmail,
  relatedDeal,
  dealConnectionRestricted,
  discrepancyReview,
  onOpenShare,
  deliveryAllowed,
}: {
  approvalChoice: DocumentApprovalChoice
  approvalStatus: DocumentElementStatus["approval"]
  selectedApproverIds: string[]
  approvalEvents: DocumentApprovalEvent[]
  templateCode: string
  documentNumber: string
  documentStyle: DocumentStyle
  activeLinkCount: number
  deliveryRecordCount: number
  deliveryCompleted: boolean
  activeLink: DeliveryLink | null
  latestEmail: EmailRecord | null
  relatedDeal: DealDocumentContext | null
  dealConnectionRestricted: boolean
  discrepancyReview: DocumentDiscrepancyReview
  onOpenShare: () => void
  deliveryAllowed: boolean
}) {
  const lastRequestEvent = approvalEvents.findLast(
    (event) => event.type === "request"
  )
  const lastDecisionEvent = approvalEvents.findLast(
    (event) => event.type === "approve" || event.type === "reject"
  )
  const linkCreated = activeLinkCount > 0 && !deliveryCompleted
  const completedReviewRows = buildDocumentReviewRows({
    missingRequiredCount: 0,
    documentStyle,
    saveState: "saved",
    qualityAcknowledged: true,
    relatedDeal,
    dealConnectionRestricted,
    discrepancyReview,
    approvalChoice,
    approvalStatus,
    selectedApproverCount: selectedApproverIds.length,
    lastRequestEvent,
    lastDecisionEvent,
    confirmationReady: true,
    documentConfirmed: true,
    templateCode,
    documentNumber,
    activeLinkCount,
    deliveryRecordCount,
    interactive: false,
    deliveryAllowed,
  }).map((row) => {
    if (row.label !== "은행 거절 전 점검") return row
    if (discrepancyReview.errorCount > 0) {
      return {
        ...row,
        value: `거절 위험 ${discrepancyReview.errorCount}건 · 수정 필요`,
        state: "blocked" as const,
      }
    }
    if (discrepancyReview.warningCount > 0) {
      return {
        ...row,
        value: `확인 권장 ${discrepancyReview.warningCount}건 포함`,
        state: "complete" as const,
      }
    }
    return { ...row, state: "complete" as const }
  })

  return (
    <aside className="flex h-full min-h-0 flex-col bg-[var(--surface-background)]">
      <div className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-[var(--surface-border)] px-4 py-2.5 sm:px-5">
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-[var(--surface-muted-foreground)]">
            {deliveryCompleted
              ? "공유 완료"
              : linkCreated
                ? "공유 준비"
                : "문서 완료"}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <h2 className="truncate text-sm font-semibold">
              {deliveryCompleted
                ? "전달 및 공유 완료"
                : linkCreated
                  ? "공유 링크 생성됨"
                  : deliveryAllowed
                    ? "확정 및 전달 준비"
                    : "확정 문서"}
            </h2>
            <ToneBadge tone="success">
              {deliveryCompleted
                ? "공유됨"
                : linkCreated
                  ? "전달 전"
                  : "확정됨"}
            </ToneBadge>
          </div>
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-4 sm:p-5">
          <section className="rounded-lg border border-success/25 bg-success/5 p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success text-white">
                <Check className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">
                  {deliveryCompleted
                    ? "문서 공유가 완료되었습니다"
                    : linkCreated
                      ? "공유 링크가 생성되었습니다"
                      : "문서가 확정되었습니다"}
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {deliveryCompleted
                    ? "Magic Link와 이메일 전달 내역을 확인하거나 추가로 공유할 수 있습니다."
                    : linkCreated
                      ? "링크 생성은 완료됐지만 아직 전달 전입니다. 공유 관리에서 이메일로 보내거나 링크를 전달하세요."
                      : deliveryAllowed
                        ? "문서와 PDF는 더 이상 수정할 수 없습니다. 상단 공유에서 링크를 만들거나 이메일로 보낼 수 있습니다."
                        : "문서와 PDF는 더 이상 수정할 수 없습니다. 고객 전달은 별도 권한이 있는 구성원만 실행할 수 있습니다."}
                </p>
              </div>
              {deliveryAllowed ? (
                <Button
                  type="button"
                  size="sm"
                  className="shrink-0"
                  onClick={onOpenShare}
                >
                  <Send data-icon="inline-start" />
                  {deliveryCompleted ? "공유 관리" : "공유하기"}
                </Button>
              ) : null}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">공유 현황</div>
              {deliveryAllowed ? (
                <Button variant="ghost" size="xs" onClick={onOpenShare}>
                  관리
                  <ChevronRight data-icon="inline-end" />
                </Button>
              ) : null}
            </div>
            <div className="mt-2 grid overflow-hidden rounded-md border bg-background sm:grid-cols-2">
              <div className="min-w-0 px-3 py-3 sm:border-r">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">공유 링크</span>
                  <ToneBadge tone={activeLink ? "success" : "neutral"}>
                    {activeLink ? "활성" : "미생성"}
                  </ToneBadge>
                </div>
                <div className="mt-2 truncate text-[11px] text-muted-foreground">
                  {activeLink
                    ? `${activeLink.expires} 만료 · ${activeLink.opens}/${activeLink.maxOpens}회 열람`
                    : deliveryAllowed
                      ? "문서당 링크 1개를 만들 수 있습니다."
                      : "고객 전달 권한이 있는 구성원이 링크를 만들 수 있습니다."}
                </div>
              </div>
              <div className="min-w-0 border-t px-3 py-3 sm:border-t-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">최근 전달</span>
                  <ToneBadge tone={latestEmail ? "success" : "neutral"}>
                    {latestEmail ? "완료" : "전달 전"}
                  </ToneBadge>
                </div>
                <div className="mt-2 truncate text-[11px] text-muted-foreground">
                  {latestEmail
                    ? `${latestEmail.recipient} · ${latestEmail.sentAt}`
                    : deliveryAllowed
                      ? "링크를 전달하거나 이메일을 보내면 기록됩니다."
                      : "전달 이력이 없습니다."}
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">문서 진행 상태</div>
              <ToneBadge tone="success">
                {deliveryCompleted
                  ? "공유 완료"
                  : linkCreated
                    ? "링크 생성됨"
                    : "문서 확정"}
              </ToneBadge>
            </div>
            <div className="mt-2 overflow-hidden rounded-md border bg-background">
              {completedReviewRows.map((row) => (
                <div
                  key={row.label}
                  className="flex min-h-9 min-w-0 items-center gap-2.5 px-3 py-2 text-xs"
                >
                  <span
                    className={cn(
                      "flex size-4.5 shrink-0 items-center justify-center rounded-full",
                      row.state === "complete"
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {row.state === "complete" ? (
                      <Check className="size-3" />
                    ) : (
                      <Clock3 className="size-3" />
                    )}
                  </span>
                  <span className="shrink-0 font-medium">{row.label}</span>
                  <span
                    className="ml-auto min-w-0 truncate text-right text-muted-foreground"
                    title={row.value}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </ScrollArea>
    </aside>
  )
}

function ResultScreen({
  initialTemplateCode,
  initialDocumentNumber,
  approvalPreviewState = "live",
  initialDocumentConfirmed = false,
  initialSharePanelOpen = false,
  initialLinkCreated = false,
  initialShareCompleted = false,
  initialDeliveryAttachments,
  relatedDeal = null,
  initialWorkspaceStep = "editor",
  onBackToList,
  role = "owner",
  dealConnectionRestricted = false,
}: {
  initialTemplateCode: string
  initialDocumentNumber?: string | null
  approvalPreviewState?: DocumentApprovalPreviewState
  initialDocumentConfirmed?: boolean
  initialSharePanelOpen?: boolean
  initialLinkCreated?: boolean
  initialShareCompleted?: boolean
  initialDeliveryAttachments?: readonly DeliveryAttachment[]
  relatedDeal?: DealDocumentContext | null
  initialWorkspaceStep?: DocumentCreateWorkspaceStep
  onBackToList?: () => void
  role?: ErpPreviewRole
  memberCanDeliver?: boolean
  dealConnectionRestricted?: boolean
}) {
  const [templateCode, setTemplateCode] = useState(initialTemplateCode)
  const [deliveryAttachments, setDeliveryAttachments] = useState<DeliveryAttachment[]>(() => initialDeliveryAttachments ? [...initialDeliveryAttachments] : [{ id: "att-1", name: "인보이스_2607_003.pdf", source: "인박스" }])
  const templateSelected = Boolean(
    templateCode && templateSchemas[templateCode]
  )
  const templateTitle = templateSelected
    ? templateMeta(templateCode)[1]
    : "문서 종류 미선택"
  const documentNumber = initialDocumentNumber ?? `${templateCode}-2026-0708`
  const confirmedAtStart =
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
    fontStyle: "sans",
    accent: "#166dd7",
    logo: organizationDefaultDocumentLogo,
  })
  const [documentConfirmed, setDocumentConfirmed] = useState(confirmedAtStart)
  const isMobile = useIsCompactWorkspace()
  const [workspaceStep, setWorkspaceStep] =
    useState<DocumentCreateWorkspaceStep>(
      initialWorkspaceStep === "source" ? "source" : "editor"
    )
  const [pdfPrepared, setPdfPrepared] = useState(
    initialWorkspaceStep !== "source" || confirmedAtStart
  )
  const [hasPreparedPdf, setHasPreparedPdf] = useState(
    initialWorkspaceStep !== "source" || confirmedAtStart
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
          },
        ]
      : []
  )
  const [sharePanelOpen, setSharePanelOpen] = useState(
    initialSharePanelOpen && deliveryAllowed
  )
  const [dealPickerOpen, setDealPickerOpen] = useState(false)
  const [saveState, setSaveState] = useState<DocumentSaveState>("saved")
  const [lastSavedAt, setLastSavedAt] = useState(() => new Date())
  const [documentRevision, setDocumentRevision] = useState(0)
  const [reviewedDocumentRevision, setReviewedDocumentRevision] = useState<
    number | null
  >(confirmedAtStart || approvalPreviewRequested ? 0 : null)
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
  const markDocumentChanged = useCallback(() => {
    draftRevisionRef.current += 1
    setDocumentRevision((revision) => revision + 1)
    setSaveState("unsaved")
  }, [])
  const connectDealFromReview = (deal: DocumentSourceDeal) => {
    const previousDeal = selectedDeal
    const replacingDeal = Boolean(previousDeal && previousDeal.id !== deal.id)
    setSelectedDeal(deal)
    setDealPickerOpen(false)
    if (replacingDeal && approvalChoice === "request") {
      setApprovalStatus("idle")
      setApprovalEvents([])
    }
    toast.success(
      replacingDeal
        ? `${previousDeal?.id}에서 ${deal.id} 거래로 변경했습니다.`
        : `${deal.id} 거래를 문서에 연결했습니다.`
    )
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
        id: `${templateCode}-draft`,
      }),
      new Promise<void>((resolve) => window.setTimeout(resolve, 800)),
    ])
      .then(([result]) => {
        if (!result.ok) {
          setSaveState("error")
          return false
        }
        savedDraftRevisionRef.current = revision
        if (draftRevisionRef.current === revision) {
          setSaveState("saved")
          setLastSavedAt(new Date(result.updatedAt))
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
  }, [templateCode])
  useEffect(() => {
    if (saveState !== "unsaved") return
    const timer = window.setTimeout(() => void persistDocumentDraft(), 1000)
    return () => window.clearTimeout(timer)
  }, [persistDocumentDraft, saveState])
  const handleConfirmDocument = () => {
    if (!confirmationReady) return
    setDocumentConfirmed(true)
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
    if (magicLinks.some((link) => link.status === "active")) {
      toast.info("이 문서에는 이미 활성 공유 링크가 있습니다.")
      return
    }
    setMagicLinks((links) => [
      {
        id: (links.at(-1)?.id ?? 0) + 1,
        recipient: selectedDeal?.party ?? "ACME GmbH",
        status: "active",
        expires: settings?.expires ?? "2026.08.31",
        opens: 0,
        maxOpens: settings?.maxOpens ?? 10,
      },
    ])
    toast.success("Magic Link를 만들었습니다.")
  }
  const preparePdf = () => {
    if (!draftReady) return
    const updatingExistingPdf = hasPreparedPdf
    setSaveState("saved")
    setLastSavedAt(new Date())
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
        sentAt: new Date(result.updatedAt).toLocaleString("ko-KR"),
        linkCount,
      },
      ...records,
    ])
    return true
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
      onTemplateChange={(code) => {
        setTemplateCode(code)
        setPdfPrepared(false)
        markDocumentChanged()
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
          else if (next.size < 3) next.add(title)
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
        key={`${templateCode}:${appliedSourceKey}`}
        itemFocusSignal={0}
        reviewFocusRequest={reviewFocusRequest}
        reviewIssueTargets={discrepancyIssueTargets}
        templateCode={templateCode}
        sourceLabel={appliedSourceLabel}
        startBlank={!appliedSourceKey}
        onShowSource={() => {
          setMobilePane("left")
          window.requestAnimationFrame(() => window.document.querySelector<HTMLElement>('[data-create-source-panel]')?.focus())
        }}
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
      deliveryCompleted={emailRecords.length > 0}
      activeLink={magicLinks.find((link) => link.status === "active") ?? null}
      latestEmail={emailRecords.at(0) ?? null}
      relatedDeal={selectedDeal}
      dealConnectionRestricted={dealConnectionRestricted}
      discrepancyReview={discrepancyReview}
      onOpenShare={() => deliveryAllowed && setSharePanelOpen(true)}
      deliveryAllowed={deliveryAllowed}
    />
  ) : (
    <DocumentReviewSharePanel
      documentConfirmed={false}
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

  return (
    <div
      ref={workspaceRootRef}
      onBlurCapture={() => {
        if (saveState === "unsaved") void persistDocumentDraft()
      }}
      className="flex h-[calc(100svh-var(--header-height))] min-h-0 flex-col overflow-hidden bg-background"
    >
      <div className="flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b border-[var(--surface-border)] bg-[var(--surface-background)] px-3 py-2 sm:px-4">
        {onBackToList ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="문서 목록으로 돌아가기"
            onClick={onBackToList}
          >
            <ChevronLeft />
          </Button>
        ) : null}
        <div className="mr-auto min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-semibold">문서 만들기</h1>
            <ToneBadge tone={documentConfirmed ? "success" : "neutral"}>
              {documentConfirmed ? "확정" : "초안"}
            </ToneBadge>
          </div>
          <p className="truncate text-[11px] text-[var(--surface-muted-foreground)]">
            {templateSelected
              ? `${templateTitle} · ${documentNumber}.pdf · `
              : "문서 종류 미선택 · "}
            {templateSelected
              ? documentConfirmed
                ? deliveryAllowed
                  ? "공유 가능"
                  : "보기 전용 · 고객 전달 권한 필요"
                : dealConnectionRestricted
                  ? "거래 연결됨 · Deal 접근 권한 필요"
                  : selectedDeal
                    ? "거래 연결됨 · 검토 후 문서 확정"
                    : "거래 미연결 · 검토 완료 후 초안 PDF만 다운로드 가능"
              : selectedDeal
                ? `${selectedDeal.id} 거래 선택됨`
                : "거래 미연결"}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <AutoSaveStatus
            className="hidden lg:flex"
            state={
              saveState === "error"
                ? "error"
                : saveState === "unsaved"
                  ? "pending"
                  : saveState === "saving"
                    ? "saving"
                    : "saved"
            }
            savedAt={lastSavedAt}
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
                  onClick={() => setDealPickerOpen(true)}
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
            <div className="overflow-hidden rounded-lg border bg-background">
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
                  {reviewDealOptions.map((deal) => (
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
                          disabled={selectedDeal?.id === deal.id}
                          onClick={() => connectDealFromReview(deal)}
                        >
                          {selectedDeal?.id === deal.id ? "연결됨" : "연결"}
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
            <SheetDescription>
              확정한 PDF를 링크 또는 이메일로 공유합니다.
            </SheetDescription>
          </SheetHeader>
          <ShareDeliveryPanel
            magicLinks={magicLinks}
            emailRecords={emailRecords}
            onSendEmail={sendEmail}
            onCreateMagicLink={createMagicLink}
            onRevokeMagicLink={(id) =>
              setMagicLinks((links) =>
                links.map((link) =>
                  link.id === id ? { ...link, status: "revoked" } : link
                )
              )
            }
            onDeleteMagicLink={(id) =>
              setMagicLinks((links) => links.filter((link) => link.id !== id))
            }
            onClose={() => setSharePanelOpen(false)}
            templateCode={templateCode}
            relatedDeal={selectedDeal}
            initialAttachments={deliveryAttachments}
            onAttachmentsChange={setDeliveryAttachments}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

// Retain earlier prototype variants as in-file references without mounting them.
void DocumentList
void InlinePdfCompare
void DocumentCreateStepPanel
void DocumentCreateWorkbench
void CustomerPreviewDialog
void CopyPolishOverlay

function readCurrentSnapRoute(): SnapRouteMatch | null {
  if (typeof window === "undefined") return null
  const normalized = normalizeSnapLocation(
    window.location.pathname,
    window.location.search
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
  const canonical = canonicalErpLocation(window.location)
  if (canonical)
    window.history.replaceState(window.history.state, "", canonical)
  return matchErpRoute(window.location.pathname)
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
    window.location.pathname === "/v2-home" ? "v2" : "legacy"
  )
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 1280)
  const [workspaceId, setWorkspaceId] = useState<WorkspaceKey>("ecoya")
  const [erpHomeRole, setErpHomeRole] = useState<ErpPreviewRole>(() => {
    const role = new URLSearchParams(window.location.search).get("role")
    return role === "admin" || role === "member" ? role : "owner"
  })
  const homePreviewState = (() => {
    const state = new URLSearchParams(window.location.search).get("state")
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
  const [resultInitialWorkspaceStep, setResultInitialWorkspaceStep] =
    useState<DocumentCreateWorkspaceStep>("editor")
  const [selectedDealId, setSelectedDealId] = useState(
    initialErpRoute?.params.dealId ?? "DL-260708-01"
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
  const [openDeliveryOnResult, setOpenDeliveryOnResult] = useState(
    initialGeneratedDocument?.tab === "sharing" ||
      initialGeneratedDocument?.tab === "done"
  )
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
      initialGeneratedDocument
        ? getDealDocumentContext(initialGeneratedDocument.dealId)
        : null
    )
  const [resultDeliveryAttachments, setResultDeliveryAttachments] = useState<
    DeliveryAttachment[]
  >([])
  const [pendingAskQuestion, setPendingAskQuestion] = useState("")
  const [pendingAskSubmit, setPendingAskSubmit] = useState(false)
  const [createDealContext, setCreateDealContext] =
    useState<DealDocumentContext | null>(null)
  const [createEntryState, setCreateEntryState] = useState<"history" | "first">(
    new URLSearchParams(window.location.search).get("state") === "first-use" ? "first" : "history"
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
        window.location.pathname === "/v2-home" ? "v2" : "legacy"
      )
      const nextRole = new URLSearchParams(window.location.search).get("role")
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
        setOpenDeliveryOnResult(
          generatedDocument?.tab === "sharing" ||
            generatedDocument?.tab === "done"
        )
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
          generatedDocument
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
      window.location.assign(nextScreen === "SC-05" ? "/signup?product=snap" : "/login")
      return
    }
    const nextPath = pathForSnapScreen(nextScreen, options?.params)
    const currentPath = `${window.location.pathname}${window.location.search}`
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
    if (`${window.location.pathname}${window.location.search}` === redirectPath)
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
    replace = false
  ) => {
    const nextPath = pathForErpScreen(nextScreen, params)
    const nextUrl = new URL(nextPath, window.location.origin)
    if (erpHomeRole === "admin" || erpHomeRole === "member") {
      nextUrl.searchParams.set("role", erpHomeRole)
    }
    const nextLocation = `${nextUrl.pathname}${nextUrl.search}`
    const currentLocation = `${window.location.pathname}${window.location.search}`
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
      replace?: boolean
    }
  ) => {
    if (nextScreen === "tokens" || nextScreen === "billing") {
      const section = product === "snap" ? "snap-usage" : nextScreen === "tokens" ? "trade-usage" : "billing"
      window.location.assign(`/erp/settings?section=${section}`)
      return
    }
    if (nextScreen === "deal" && options?.dealId) {
      setSelectedDealId(options.dealId)
    }
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
        options?.replace
      )
    }
    setScreenLoading(true)
    setScreen(nextScreen)
  }

  const switchErpHomeRole = (nextRole: ErpPreviewRole) => {
    const nextUrl = new URL(window.location.href)
    if (nextRole === "admin" || nextRole === "member") {
      nextUrl.searchParams.set("role", nextRole)
    } else {
      nextUrl.searchParams.delete("role")
    }
    window.history.replaceState(
      { ...(window.history.state ?? {}), product: "erp" },
      "",
      `${nextUrl.pathname}${nextUrl.search}`
    )
    setErpHomeRole(nextRole)
    setProduct("erp")
  }

  const switchProduct = (nextProduct: ProductKey) => {
    if (nextProduct === product) return
    if (!activeWorkspace.products[nextProduct]) return
    if (nextProduct === "snap") {
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

    setWorkspaceId(nextWorkspace.id)
    if (nextWorkspace.products[product]) return

    const fallbackProduct: ProductKey = nextWorkspace.products.erp
      ? "erp"
      : "snap"
    if (fallbackProduct === "snap") {
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
    const documentNumber = `${templateCode}-2026-0708`
    setResultDeliveryAttachments([])
    setResultDocumentNumber(documentNumber)
    setResultMemberCanDeliver(true)
    setResultDealConnectionRestricted(false)
    setSelectedTemplateCode(templateCode)
    setResultInitialWorkspaceStep("source")
    setOpenDeliveryOnResult(false)
    setOpenConfirmedOnResult(false)
    setOpenLinkCreatedOnResult(false)
    setOpenSharedOnResult(false)
    setResultDealContext(getDealDocumentContext(selectedDealId))
    navigateTo("result", { documentNumber })
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
      setResultDocumentNumber(selectedDocument.number)
      setResultMemberCanDeliver(selectedDocument.memberCanDeliver)
      setResultDealConnectionRestricted(false)
      setResultInitialWorkspaceStep("editor")
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
              `${window.location.pathname}${window.location.search}`
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
        className="min-h-svh bg-background"
      />
    )
  }

  const isThreePaneScreen =
    screen === "inbox" || screen === "create" || screen === "result"
  const isFullWidthScreen =
    isThreePaneScreen || screen === "deal" || screen === "ask"

  return (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
      className="h-svh min-h-0 flex-col overflow-hidden bg-background text-foreground"
      style={
        {
          "--header-height": "var(--ui-shell-header-height)",
          "--sidebar-width": "var(--ui-shell-sidebar-width)",
          "--sidebar-width-icon": "var(--ui-shell-sidebar-collapsed-width)",
        } as CSSProperties
      }
    >
      <WorkspaceHeader
        screen={screen}
        templateCode={selectedTemplateCode}
        onNavigate={navigateTo}
        unreadNotificationCount={unreadNotificationCount}
        onOpenNotifications={() => navigateTo("notifications")}
        product={product}
        snapScreen={snapScreen}
        onSnapScreenChange={navigateSnap}
        erpHomeRole={erpHomeRole}
        onErpHomeRoleChange={switchErpHomeRole}
        showErpHomeRoleSwitch={
          screen === "home" || screen === "create" || screen === "result"
        }
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
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
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
                    <OnboardingPrototype onNavigate={navigateTo} />
                  ) : screen === "home" ? (
                    <V2HomePrototype
                      onNavigate={navigateTo}
                      role={erpHomeRole === "member" ? "member" : "owner"}
                      previewState={homePreviewState}
                    />
                  ) : screen === "inbox" ? (
                    <InboxScreen
                      initialDocumentName={erpRoute?.params.documentName}
                      initialStep={
                        erpRoute?.params.uploadStep === "connect"
                          ? "deal"
                          : "compare"
                      }
                      linkedDealsByDocument={uploadDocumentDealLinks}
                      onDocumentDealLinked={(documentName, link) => {
                        setUploadDocumentDealLinks((current) => {
                          const next = { ...current, [documentName]: link }
                          writeUploadDocumentDealLinks(next)
                          return next
                        })
                      }}
                      onDocumentOpen={(documentName, detailStep = "compare") =>
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
                      }
                      onOpenDeal={(dealId) => {
                        setDealNotificationTarget(null)
                        setSelectedDealId(dealId)
                        navigateTo("deal", { dealId })
                      }}
                    />
                  ) : screen === "create" ? (
                    <CreateScreen
                      initialEntryState={createEntryState}
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
                        setResultInitialWorkspaceStep("editor")
                        navigateTo("result", { documentNumber })
                      }}
                    />
                  ) : screen === "ask" ? (
                    <AskPrototype
                      onNavigate={navigateTo}
                      initialQuestion={pendingAskQuestion}
                      submitOnOpen={pendingAskSubmit}
                    />
                  ) : screen === "deals" ? (
                    <DealsScreen
                      role={erpHomeRole}
                      onOpenDeal={(dealId, tab) => {
                        setDealNotificationTarget(tab ? { tab: tab === "documents" ? "overview" : tab, sectionId: tab === "documents" ? "deal-documents" : tab === "fulfillment" ? "deal-fulfillment" : tab === "customs" ? "deal-customs" : "deal-finance" } : null)
                        setSelectedDealId(dealId)
                        navigateTo("deal", { dealId })
                      }}
                    />
                  ) : screen === "deal" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedDealId) ? (
                    <ReferenceOperations screen="deal" dealId={selectedDealId} />
                  ) : screen === "deal" ? (
                    <DealDetailScreen
                      key={selectedDealId}
                      dealId={selectedDealId}
                      focusTarget={dealNotificationTarget}
                      onBack={() => navigateTo("deals")}
                      onAskAi={() => navigateTo("ask", { question: `거래 ${selectedDealId}: `, submit: false })}
                      generatedDocuments={getGeneratedDealDocumentSummaries(
                        selectedDealId
                      )}
                      documentTemplates={templates}
                      onCreateDocument={openDealDocumentCreate}
                      onUpload={() => navigateTo("inbox")}
                      onDeliver={openDealDocumentDelivery}
                      onOpenSettlement={() => navigateTo("settlement")}
                      workspaceActionsTarget={dealHeaderActionsTarget}
                    />
                  ) : screen === "shipments" ? (
                    <ReferenceOperations screen="shipments" />
                  ) : screen === "settlement" ? (
                    <ReferenceOperations screen="settlement" />
                  ) : screen === "monitoring" ? (
                    <ReferenceOperations screen="monitor" />
                  ) : screen === "reports" ? (
                    <ReferenceOperations screen="reports" />
                  ) : screen === "sales" ? (
                    <ReferenceOperations screen="sales" />
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
                    <CounterpartyPrototype onNavigate={navigateTo} />
                  ) : screen === "snap" ? (
                    <SnapEvidencePrototype onNavigate={navigateTo} />
                  ) : screen === "billing" ? (
                    <BillingPrototype onNavigate={navigateTo} />
                  ) : screen === "tokens" ? (
                    <TokenUsagePrototype onNavigate={navigateTo} />
                  ) : screen === "snap-platform" ? (
                    <SnapProductPrototype
                      screen={snapScreen}
                      onScreenChange={navigateSnap}
                      routeParams={snapRoute?.params}
                      routeSearch={snapRoute?.search}
                      showNavigator={false}
                      className="min-h-full"
                    />
                  ) : (
                    <ResultScreen
                      key={`result:${documentApprovalPreviewState}:${resultDocumentNumber ?? "new"}`}
                      initialTemplateCode={selectedTemplateCode}
                      initialDocumentNumber={resultDocumentNumber}
                      approvalPreviewState={documentApprovalPreviewState === "live" ? generatedDrafts.find((draft) => draft.number === resultDocumentNumber)?.approvalPreviewState ?? "live" : documentApprovalPreviewState}
                      initialDocumentConfirmed={openConfirmedOnResult}
                      initialSharePanelOpen={openDeliveryOnResult}
                      initialLinkCreated={openLinkCreatedOnResult}
                      initialShareCompleted={openSharedOnResult}
                      initialDeliveryAttachments={resultDeliveryAttachments}
                      relatedDeal={resultDealContext}
                      initialWorkspaceStep={resultInitialWorkspaceStep}
                      role={erpHomeRole}
                      memberCanDeliver={resultMemberCanDeliver}
                      dealConnectionRestricted={resultDealConnectionRestricted}
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
  )
}

export default App

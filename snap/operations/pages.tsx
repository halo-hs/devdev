import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  ExternalLink,
  FileText,
  FileJson,
  Filter,
  Globe,
  LoaderCircle,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Video,
  Workflow,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@shared/components/ui/badge"
import { Button } from "@shared/components/ui/button"
import { Card } from "@shared/components/ui/card"
import { Input } from "@shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select"
import { Skeleton } from "@shared/components/ui/skeleton"
import { SubmittedSearchInput } from "@shared/components/ui/submitted-search-input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"
import { TablePagination } from "@shared/components/ui/table-pagination"
import { Textarea } from "@shared/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@shared/components/ui/tooltip"
import { snapApi, type SnapPage } from "@snap/lib/snap-api"
import {
  snapApiConfigured,
  snapApiErrorMessage,
  type SnapJsonRecord,
} from "@snap/lib/snap-report-api"
import { cn } from "@shared/lib/utils"
import type { SnapScreenKey } from "@snap/screens"

export type SnapNavigationOptions = {
  params?: Record<string, string>
  replace?: boolean
}

type SnapNavigate = (
  screen: SnapScreenKey,
  options?: SnapNavigationOptions
) => void

type ResourceState<T> = {
  data: T
  loading: boolean
  error: string
  reload: () => void
}

type DashboardData = {
  tasks: SnapJsonRecord[]
  review: SnapJsonRecord[]
  selfStart: SnapJsonRecord[]
  overview: SnapJsonRecord
  safety: SnapJsonRecord
  settings: SnapJsonRecord
  branding: SnapJsonRecord
}

const TASK_STATUS_ORDER = [
  "draft",
  "confirmed",
  "assigned",
  "in_progress",
  "submitted",
  "approved",
  "sent",
  "completed",
  "rejected",
  "cancelled",
] as const

const TASK_STATUS_LABEL: Record<string, string> = {
  draft: "초안",
  confirmed: "범위 확정",
  assigned: "배정됨",
  active: "진행 중",
  in_progress: "진행 중",
  submitted: "검토 대기",
  review: "검토 대기",
  approved: "승인됨",
  sent: "전달됨",
  delivered: "전달됨",
  completed: "완료",
  done: "완료",
  rejected: "반려",
  cancelled: "취소",
}

const DEMO_TASKS: SnapJsonRecord[] = [
  {
    id: "TASK-DEMO-001",
    title: "Busan Yard #24-118 적재 확인",
    task_type: "container_loading_inspection",
    customer_name: "Hanbit Trading Co.",
    location_name: "부산 CY",
    status: "submitted",
    due_date: "2026-08-05",
    scheduled_at: "2026-08-05T09:00:00+09:00",
    assignee_name: "이현장",
  },
  {
    id: "TASK-DEMO-002",
    title: "인천 창고 봉인 번호 확인",
    task_type: "site_visit_field_report",
    customer_name: "ACME GmbH",
    location_name: "인천 창고",
    status: "in_progress",
    due_date: "2026-08-07",
    scheduled_at: "2026-08-07T13:30:00+09:00",
    assignee_name: "박작업",
  },
  {
    id: "TASK-DEMO-003",
    title: "광양 적재 전·후 증거 수집",
    task_type: "industrial_before_after",
    customer_name: "HMM Green",
    location_name: "광양항",
    status: "approved",
    due_date: "2026-08-02",
    scheduled_at: "2026-08-02T10:00:00+09:00",
    assignee_name: "김현장",
  },
  {
    id: "TASK-DEMO-004",
    title: "울산 컨테이너 외관 검수",
    task_type: "container_loading_inspection",
    customer_name: "KATAMAN",
    location_name: "울산항",
    status: "draft",
    due_date: "2026-08-12",
    scheduled_at: "2026-08-12T14:00:00+09:00",
    assignee_name: "미배정",
  },
  {
    id: "TASK-DEMO-005",
    title: "평택항 냉동 컨테이너 온도 기록",
    task_type: "container_loading_inspection",
    customer_name: "Sera Foods",
    location_name: "평택항",
    status: "assigned",
    due_date: "2026-08-24",
    scheduled_at: "2026-08-24T10:00:00+09:00",
    assignee_name: "최현장",
  },
  {
    id: "TASK-DEMO-006",
    title: "김포 물류센터 출고 수량 대조",
    task_type: "site_visit_field_report",
    customer_name: "Mirae Logistics",
    location_name: "김포 물류센터",
    status: "confirmed",
    due_date: "2026-08-24",
    scheduled_at: "2026-08-24T11:30:00+09:00",
    assignee_name: "정수량",
  },
  {
    id: "TASK-DEMO-007",
    title: "부산 신항 적재 전 컨테이너 상태 촬영",
    task_type: "industrial_before_after",
    customer_name: "Ocean Bridge",
    location_name: "부산 신항",
    status: "in_progress",
    due_date: "2026-08-24",
    scheduled_at: "2026-08-24T13:00:00+09:00",
    assignee_name: "한증거",
  },
  {
    id: "TASK-DEMO-008",
    title: "인천항 수입 화물 파손 여부 검토",
    task_type: "site_visit_field_report",
    customer_name: "Nova Materials",
    location_name: "인천항 4부두",
    status: "submitted",
    due_date: "2026-08-24",
    scheduled_at: "2026-08-24T14:00:00+09:00",
    assignee_name: "오검토",
  },
  {
    id: "TASK-DEMO-009",
    title: "광양항 봉인 교체 전·후 증거 수집",
    task_type: "industrial_before_after",
    customer_name: "Hanul Steel",
    location_name: "광양항",
    status: "active",
    due_date: "2026-08-24",
    scheduled_at: "2026-08-24T15:30:00+09:00",
    assignee_name: "윤현장",
  },
  {
    id: "TASK-DEMO-010",
    title: "울산 야드 안전 통로 및 적재 구역 확인",
    task_type: "container_loading_inspection",
    customer_name: "KATAMAN",
    location_name: "울산 야드",
    status: "assigned",
    due_date: "2026-08-24",
    scheduled_at: "2026-08-24T17:00:00+09:00",
    assignee_name: "서안전",
  },
]

const DEMO_SCHEMAS: SnapJsonRecord[] = [
  {
    id: "schema-loading",
    schema_key: "container_loading_inspection",
    display_name: "컨테이너 적재 검수",
    description: "봉인 번호, 외관 4면, 적재 전·후를 순서대로 수집합니다.",
    required_photos: ["봉인 번호", "외관 4면", "적재 전", "적재 후"],
    required_videos: ["적재 현장 동영상"],
    report_template_key: "loading-inspection",
    keywords: ["container", "seal", "loading"],
    version: 3,
  },
  {
    id: "schema-visit",
    schema_key: "site_visit_field_report",
    display_name: "현장 방문 보고",
    description: "현장 전경과 확인 항목을 자유롭게 기록합니다.",
    required_photos: ["현장 전경", "확인 대상"],
    required_videos: [],
    report_template_key: "field-visit",
    keywords: ["visit", "field"],
    version: 2,
  },
]

const DEMO_HANDOFFS: SnapJsonRecord[] = [
  {
    id: "handoff-demo-001",
    task_id: "TASK-DEMO-001",
    task_title: "Busan Yard #24-118 적재 확인",
    location_name: "부산 CY",
    handoff_type: "evidence_package",
    status: "draft",
    scope: "사진 12장 · 승인 보고서 1건",
    created_at: "2026-08-05T09:10:00+09:00",
  },
  {
    id: "handoff-demo-002",
    task_id: "TASK-DEMO-003",
    task_title: "광양 적재 전·후 증거 수집",
    location_name: "광양항",
    handoff_type: "report_and_evidence",
    status: "confirmed",
    scope: "보고서·원본 증거 포함",
    created_at: "2026-08-03T16:40:00+09:00",
  },
]

const DEMO_CORRECTIVE: SnapJsonRecord[] = [
  {
    id: "corrective-demo-001",
    task_id: "TASK-DEMO-001",
    hazard: "봉인 번호 식별 불가",
    action_required: "봉인 번호가 선명하게 보이도록 근접 재촬영이 필요합니다.",
    risk_band: "high",
    status: "open",
    due_date: "2026-08-05",
  },
  {
    id: "corrective-demo-002",
    task_id: "TASK-DEMO-002",
    hazard: "외관 우측면 누락",
    action_required: "동일 위치에서 우측면 사진을 추가해 주세요.",
    risk_band: "medium",
    status: "in_progress",
    due_date: "2026-08-07",
  },
  {
    id: "corrective-demo-003",
    task_id: "TASK-DEMO-003",
    hazard: "적재 후 확인 완료",
    action_required: "검증이 완료되었습니다.",
    risk_band: "low",
    status: "verified",
    verified_at: "2026-08-03T16:00:00+09:00",
  },
]

function useSnapResource<T>(
  loader: () => Promise<T>,
  demoData: T
): ResourceState<T> {
  const loaderRef = useRef(loader)
  const [data, setData] = useState<T>(demoData)
  const [loading, setLoading] = useState(snapApiConfigured)
  const [error, setError] = useState("")
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    loaderRef.current = loader
  }, [loader])

  useEffect(() => {
    if (!snapApiConfigured) return
    let cancelled = false
    void Promise.resolve()
      .then(() => {
        if (cancelled) return undefined
        setLoading(true)
        setError("")
        return loaderRef.current()
      })
      .then((next) => {
        if (!cancelled && next !== undefined) setData(next)
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(snapApiErrorMessage(reason))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [demoData, revision])

  const reload = useCallback(() => setRevision((value) => value + 1), [])
  return {
    data: snapApiConfigured ? data : demoData,
    loading: snapApiConfigured ? loading : false,
    error: snapApiConfigured ? error : "",
    reload,
  }
}

function stringValue(record: SnapJsonRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" && value.trim()) return value
    if (typeof value === "number") return String(value)
  }
  return ""
}

function nestedString(
  record: SnapJsonRecord,
  parent: string,
  ...keys: string[]
) {
  const nested = record[parent]
  if (!nested || typeof nested !== "object" || Array.isArray(nested)) return ""
  return stringValue(nested as SnapJsonRecord, ...keys)
}

function recordId(record: SnapJsonRecord, index = 0) {
  return String(
    record.id ??
      record.task_id ??
      record.handoff_id ??
      record.schema_key ??
      `row-${index}`
  )
}

function taskTitle(record: SnapJsonRecord) {
  return (
    stringValue(record, "title", "display_name", "task_title", "name") ||
    nestedString(record, "human_instruction", "title", "display_name") ||
    "제목 없는 업무"
  )
}

function taskStatus(record: SnapJsonRecord) {
  return stringValue(record, "status", "state").toLowerCase() || "draft"
}

function normalizedTaskStatus(status: string) {
  const aliases: Record<string, string> = {
    active: "in_progress",
    review: "submitted",
    delivered: "sent",
    done: "completed",
  }
  return aliases[status] ?? status
}

const TASK_STATUS_STYLE: Record<string, { dot: string; event: string }> = {
  draft: {
    dot: "ui-status-neutral-dot",
    event: "ui-status-neutral",
  },
  confirmed: {
    dot: "ui-status-info-dot",
    event: "ui-status-info",
  },
  assigned: {
    dot: "ui-status-info-dot",
    event: "ui-status-info",
  },
  in_progress: {
    dot: "ui-status-warning-dot",
    event: "ui-status-warning",
  },
  submitted: {
    dot: "ui-status-warning-dot",
    event: "ui-status-warning",
  },
  approved: {
    dot: "ui-status-success-dot",
    event: "ui-status-success",
  },
  sent: {
    dot: "ui-status-success-dot",
    event: "ui-status-success",
  },
  completed: {
    dot: "ui-status-neutral-dot",
    event: "ui-status-neutral",
  },
  rejected: {
    dot: "ui-status-danger-dot",
    event: "ui-status-danger",
  },
  cancelled: {
    dot: "ui-status-neutral-dot",
    event: "ui-status-neutral",
  },
}

function taskStatusStyle(status: string) {
  return (
    TASK_STATUS_STYLE[normalizedTaskStatus(status)] ?? TASK_STATUS_STYLE.draft
  )
}

function taskLocation(record: SnapJsonRecord) {
  return (
    stringValue(record, "location_name", "location", "site_name") ||
    nestedString(record, "human_instruction", "location_name", "location") ||
    "위치 미정"
  )
}

function taskCustomer(record: SnapJsonRecord) {
  return (
    stringValue(record, "customer_name", "customer", "client_name") ||
    nestedString(record, "human_instruction", "customer_name", "customer") ||
    "고객 미지정"
  )
}

function taskDate(record: SnapJsonRecord) {
  return stringValue(
    record,
    "scheduled_at",
    "due_date",
    "scheduled_date",
    "created_at"
  )
}

function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(
    "ko-KR",
    options ?? { month: "2-digit", day: "2-digit" }
  ).format(date)
}

function arrayValue(record: SnapJsonRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (Array.isArray(value)) return value.map(String)
  }
  return []
}

function nestedArrayValue(
  record: SnapJsonRecord,
  parent: string,
  ...keys: string[]
) {
  const nested = record[parent]
  if (!nested || typeof nested !== "object" || Array.isArray(nested)) return []
  return arrayValue(nested as SnapJsonRecord, ...keys)
}

function workflowPhotos(record: SnapJsonRecord) {
  return [
    ...arrayValue(record, "required_photos", "required_photo_types"),
    ...nestedArrayValue(record, "required_capture", "photo", "photos"),
  ]
}

function workflowVideos(record: SnapJsonRecord) {
  return [
    ...arrayValue(record, "required_videos", "required_video_types"),
    ...nestedArrayValue(record, "required_capture", "video", "videos"),
  ]
}

function workflowKeywords(record: SnapJsonRecord) {
  return arrayValue(record, "intent_keywords", "keywords", "routing_keywords")
}

function statusVariant(
  status: string
): "secondary" | "outline" | "destructive" {
  if (["rejected", "failed", "overdue", "cancelled"].includes(status))
    return "destructive"
  if (
    ["approved", "sent", "completed", "done", "verified", "confirmed"].includes(
      status
    )
  )
    return "secondary"
  return "outline"
}

function statusLabel(status: string) {
  return TASK_STATUS_LABEL[status] ?? status.replaceAll("_", " ")
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(url)
}

function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-col gap-4 pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-1 text-xs font-medium text-primary">{eyebrow}</div>
        ) : null}
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      ) : null}
    </header>
  )
}

function SummaryStrip({
  items,
  selectedKey,
  onSelect,
}: {
  items: Array<{
    key?: string
    label: string
    value: string | number
    hint?: string
    alert?: boolean
  }>
  selectedKey?: string
  onSelect?: (key: string) => void
}) {
  return (
    <div
      className={cn(
        "ui-summary-strip grid sm:grid-cols-2",
        items.length === 3 ? "xl:grid-cols-3" : "xl:grid-cols-4"
      )}
    >
      {items.map((item, index) => {
        const content = (
          <>
            <div className="text-xs text-muted-foreground">{item.label}</div>
            <div
              className={cn(
                "mt-1 truncate text-xl font-semibold tabular-nums",
                item.alert && "text-destructive"
              )}
            >
              {item.value}
            </div>
            {item.hint ? (
              <div className="mt-1 truncate text-xs text-muted-foreground">
                {item.hint}
              </div>
            ) : null}
          </>
        )
        const className =
          "min-w-0 border-b p-4 last:border-b-0 sm:border-r sm:[&:nth-last-child(-n+2)]:border-b-0 xl:border-b-0 xl:last:border-r-0"

        return item.key && onSelect ? (
          <button
            key={`${item.label}-${index}`}
            type="button"
            className={cn(className, "ui-summary-filter")}
            aria-pressed={selectedKey === item.key}
            onClick={() => onSelect(item.key!)}
          >
            {content}
          </button>
        ) : (
          <div key={`${item.label}-${index}`} className={className}>
            {content}
          </div>
        )
      })}
    </div>
  )
}

function LoadingState({
  rows = 5,
  variant = "rows",
}: {
  rows?: number
  variant?: "rows" | "dashboard" | "table" | "cards" | "calendar"
}) {
  if (variant === "dashboard") {
    return (
      <div className="space-y-6 py-4" aria-label="불러오는 중">
        <div className="ui-summary-strip grid sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-2 border-r p-4 last:border-r-0">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
          <div className="divide-y border-y">
            {Array.from({ length: rows }, (_, index) => (
              <div
                key={index}
                className="grid gap-3 px-3 py-4 sm:grid-cols-[minmax(0,1fr)_120px_90px]"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
          <div className="space-y-4 border-y py-4">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (variant === "cards") {
    return (
      <div className="space-y-5 py-4" aria-label="불러오는 중">
        <Skeleton className="h-9 w-full" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="flex min-h-52 flex-col rounded-md border p-5"
            >
              <div className="flex justify-between">
                <Skeleton className="size-10" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="mt-5 h-5 w-2/3" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-4/5" />
              <Skeleton className="mt-auto h-8 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === "calendar") {
    return (
      <div className="space-y-4 py-4" aria-label="불러오는 중">
        <div className="flex justify-between">
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-7 overflow-hidden border-t border-l">
          {Array.from({ length: 49 }, (_, index) => (
            <div
              key={index}
              className="min-h-20 space-y-2 border-r border-b p-2 md:min-h-24"
            >
              <Skeleton className="size-5 rounded-full" />
              {index > 6 && index % 3 === 0 ? (
                <Skeleton className="h-5 w-full" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === "table") {
    return (
      <div className="space-y-5 py-4" aria-label="불러오는 중">
        <div className="ui-summary-strip grid sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-2 border-r p-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
        <Skeleton className="h-9 w-full" />
        <div className="divide-y border-y">
          {Array.from({ length: rows }, (_, index) => (
            <div
              key={index}
              className="grid grid-cols-[minmax(0,2fr)_repeat(3,minmax(80px,1fr))] gap-4 px-3 py-4"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 py-4" aria-label="불러오는 중">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-14 w-full rounded-md" />
      ))}
    </div>
  )
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-md border border-destructive/30 bg-destructive/5 text-center">
      <AlertCircle className="size-6 text-destructive" />
      <div>
        <div className="font-medium">데이터를 불러오지 못했습니다</div>
        <div className="mt-1 max-w-lg text-sm text-muted-foreground">
          {message}
        </div>
      </div>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw /> 다시 시도
      </Button>
    </div>
  )
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-muted/15 px-4 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="mt-1 max-w-lg text-sm text-muted-foreground">
          {description}
        </div>
      </div>
      {action}
    </div>
  )
}

function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <SubmittedSearchInput
      value={value}
      onSearch={onChange}
      placeholder={placeholder}
      formClassName="min-w-0 flex-1"
    />
  )
}

function DashboardPage({ navigate }: { navigate: SnapNavigate }) {
  const demoData = useMemo<DashboardData>(
    () => ({
      tasks: DEMO_TASKS,
      review: DEMO_TASKS.filter((task) => taskStatus(task) === "submitted"),
      selfStart: [],
      overview: {
        queues: {
          review_pending: 1,
          delivery_failed: 0,
          media_analysis_failed: 0,
        },
      },
      safety: { open_actions: 2, overdue_actions: 0, verified_actions: 1 },
      settings: { primary_persona_key: "container_loading_inspection" },
      branding: { name: "ECOYA Demo Co." },
    }),
    []
  )
  const resource = useSnapResource<DashboardData>(async () => {
    const [tasks, settings, branding, overview, review, selfStart, corrective] =
      await Promise.all([
        snapApi.tasks.list(),
        snapApi.organization.settings(),
        snapApi.organization.branding(),
        snapApi.operations.overview(),
        snapApi.tasks.list({ needs_review: true, review_summary: true }),
        snapApi.tasks.list({
          needs_review: true,
          review_filter: "worker_self_start",
          review_summary: true,
        }),
        snapApi.operations.correctiveActions(),
      ])
    const today = new Date().toISOString().slice(0, 10)
    const openActions = corrective.items.filter(
      (item) => stringValue(item, "status") !== "verified"
    )
    return {
      tasks: tasks.items ?? [],
      review: review.items ?? [],
      selfStart: selfStart.items ?? [],
      overview,
      safety: {
        open_actions: openActions.length,
        overdue_actions: openActions.filter((item) => {
          const dueDate = stringValue(item, "due_date")
          return Boolean(dueDate && dueDate < today)
        }).length,
        verified_actions: corrective.items.filter(
          (item) => stringValue(item, "status") === "verified"
        ).length,
      },
      settings,
      branding,
    }
  }, demoData)

  const active = resource.data.tasks.filter((task) =>
    ["confirmed", "assigned", "active", "in_progress"].includes(
      taskStatus(task)
    )
  )
  const completed = resource.data.tasks.filter((task) =>
    ["approved", "sent", "delivered", "completed", "done"].includes(
      taskStatus(task)
    )
  )
  const queue =
    resource.data.overview.queues &&
    typeof resource.data.overview.queues === "object" &&
    !Array.isArray(resource.data.overview.queues)
      ? (resource.data.overview.queues as SnapJsonRecord)
      : {}
  const priorities = [
    ...resource.data.selfStart,
    ...resource.data.review,
    ...active,
  ].filter(
    (task, index, items) =>
      items.findIndex((item) => recordId(item) === recordId(task)) === index
  )
  const openSafety = Number(resource.data.safety.open_actions ?? 0)
  const overdueSafety = Number(resource.data.safety.overdue_actions ?? 0)

  return (
    <OperationsLayout>
      <PageHeader
        eyebrow="현장 운영"
        title={`${stringValue(resource.data.branding, "name") || "조직"} 대시보드`}
        description="오늘 확인할 업무, 현장 제출, 전달 실패와 안전 조치를 한 화면에서 확인합니다."
        actions={
          <Button onClick={() => navigate("SC-19")}>
            <Plus /> 업무 만들기
          </Button>
        }
      />
      {resource.loading ? (
        <LoadingState variant="dashboard" />
      ) : resource.error ? (
        <ErrorState message={resource.error} onRetry={resource.reload} />
      ) : resource.data.tasks.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="size-7" />}
          title="첫 현장 업무를 시작해 보세요"
          description="업무 범위를 확정하면 작업자 실행 링크, 증거 수집, 보고서 검토가 이어집니다."
          action={
            <Button onClick={() => navigate("SC-19")}>첫 업무 만들기</Button>
          }
        />
      ) : (
        <>
          <SummaryStrip
            items={[
              {
                label: "전체 업무",
                value: resource.data.tasks.length,
                hint: "현재 조직",
              },
              {
                label: "진행 중",
                value: active.length,
                hint: "배정·현장 수행",
              },
              {
                label: "검토 대기",
                value:
                  resource.data.review.length ||
                  Number(queue.review_pending ?? 0),
                hint: "사람의 결정 필요",
                alert: resource.data.review.length > 0,
              },
              {
                label: "안전 조치",
                value: openSafety,
                hint: overdueSafety
                  ? `기한 초과 ${overdueSafety}건`
                  : "기한 초과 없음",
                alert: overdueSafety > 0,
              },
            ]}
          />
          <Card className="!block !gap-0 overflow-hidden !py-0">
            <div className="px-4 pt-4 pb-2 sm:px-5 sm:pt-5">
              <section>
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-[length:var(--text-header-7)] leading-[var(--leading-header-7)] font-bold">
                        오늘 할 일
                      </h2>
                      <Badge variant="default">{priorities.length}건</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      직접 시작, 검토 대기, 현장 수행 순으로 이어서 보여줍니다.
                    </p>
                  </div>
                  <Button variant="ghost" onClick={() => navigate("SC-18")}>
                    전체 업무 <ArrowRight />
                  </Button>
                </div>
                {priorities.length ? (
                  <div className="divide-y divide-[var(--surface-border)] border-t border-[var(--surface-border)]">
                    {priorities.map((task, index) => (
                      <button
                        key={recordId(task, index)}
                        type="button"
                        aria-label={`${index + 1}순위 ${taskTitle(task)}`}
                        className="group grid w-full grid-cols-[32px_minmax(0,1fr)_20px] items-start gap-3 px-1 py-3.5 text-left transition-colors hover:bg-[var(--table-row-background-hover)] focus-visible:relative focus-visible:z-10 focus-visible:[box-shadow:var(--shadow-keyboard-focus)] focus-visible:outline-none sm:items-center sm:px-3"
                        onClick={() =>
                          navigate("SC-20", {
                            params: { id: recordId(task, index) },
                          })
                        }
                      >
                        <span className="flex size-8 items-center justify-center rounded-[var(--r-md)] bg-[var(--surface-muted-background)] text-xs font-semibold text-[var(--surface-muted-foreground)] tabular-nums transition-colors group-hover:bg-[var(--menu-item-selected-background)] group-hover:text-[var(--accent-foreground)]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_120px_92px_104px] sm:items-center sm:gap-4">
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-[var(--surface-foreground)]">
                              {taskTitle(task)}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-[var(--surface-muted-foreground)]">
                              {taskCustomer(task)} · {taskLocation(task)}
                            </span>
                          </span>
                          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--surface-muted-foreground)] sm:block sm:text-sm">
                            <span className="sm:hidden">담당</span>
                            <span className="text-[var(--surface-foreground)]">
                              {stringValue(
                                task,
                                "assignee_name",
                                "worker_name"
                              ) || "미배정"}
                            </span>
                          </span>
                          <span className="text-xs text-[var(--surface-muted-foreground)] tabular-nums sm:text-sm">
                            {formatDate(taskDate(task))}
                          </span>
                          <Badge
                            variant={statusVariant(taskStatus(task))}
                            className="justify-self-start"
                          >
                            {statusLabel(taskStatus(task))}
                          </Badge>
                        </span>
                        <ChevronRight className="mt-2 size-4 text-[var(--control-accessory-foreground)] transition-transform group-hover:translate-x-0.5 sm:mt-0" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<CheckCircle2 className="size-7" />}
                    title="지금 처리할 업무가 없습니다"
                    description={`완료된 업무 ${completed.length}건을 포함해 운영 상태가 정상입니다.`}
                  />
                )}
              </section>
            </div>
          </Card>
        </>
      )}
    </OperationsLayout>
  )
}

function TasksPage({ navigate }: { navigate: SnapNavigate }) {
  const demoPage = useMemo<SnapPage>(
    () => ({ items: DEMO_TASKS, total: DEMO_TASKS.length }),
    []
  )
  const resource = useSnapResource(() => snapApi.tasks.list(), demoPage)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return resource.data.items.filter((task) => {
      const status = taskStatus(task)
      const matchesFilter =
        filter === "all" ||
        (filter === "active" &&
          ["confirmed", "assigned", "active", "in_progress"].includes(
            status
          )) ||
        (filter === "review" && ["submitted", "review"].includes(status)) ||
        (filter === "done" &&
          ["approved", "sent", "delivered", "completed", "done"].includes(
            status
          )) ||
        filter === status
      const haystack = [
        taskTitle(task),
        taskLocation(task),
        taskCustomer(task),
        stringValue(task, "task_type"),
        recordId(task),
      ]
        .join(" ")
        .toLowerCase()
      return matchesFilter && (!keyword || haystack.includes(keyword))
    })
  }, [filter, query, resource.data.items])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pages)
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  const count = (statuses: string[]) =>
    resource.data.items.filter((task) => statuses.includes(taskStatus(task)))
      .length

  return (
    <OperationsLayout>
      <PageHeader
        eyebrow="현장 업무"
        title="업무"
        description="업무 범위 확정부터 작업자 배정, 현장 증거 수집, 검토와 보고서까지 추적합니다."
        actions={
          <Button onClick={() => navigate("SC-19")}>
            <Plus /> 업무 만들기
          </Button>
        }
      />
      {resource.loading ? (
        <LoadingState variant="table" />
      ) : resource.error ? (
        <ErrorState message={resource.error} onRetry={resource.reload} />
      ) : (
        <>
          <SummaryStrip
            items={[
              {
                key: "all",
                label: "전체",
                value: resource.data.total ?? resource.data.items.length,
              },
              {
                key: "active",
                label: "진행 중",
                value: count([
                  "confirmed",
                  "assigned",
                  "active",
                  "in_progress",
                ]),
              },
              {
                key: "review",
                label: "검토 대기",
                value: count(["submitted", "review"]),
                alert: count(["submitted", "review"]) > 0,
              },
              {
                key: "done",
                label: "완료",
                value: count([
                  "approved",
                  "sent",
                  "delivered",
                  "completed",
                  "done",
                ]),
              },
            ]}
            selectedKey={filter}
            onSelect={(key) => {
              setFilter(key)
              setPage(1)
            }}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchField
              value={query}
              onChange={(value) => {
                setQuery(value)
                setPage(1)
              }}
              placeholder="업무명, 고객, 위치, 업무 유형 검색"
            />
            <Select
              value={filter}
              onValueChange={(value) => {
                setFilter(String(value))
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="size-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="active">진행 중</SelectItem>
                <SelectItem value="review">검토 대기</SelectItem>
                <SelectItem value="done">완료</SelectItem>
                <SelectItem value="draft">초안</SelectItem>
                <SelectItem value="rejected">반려</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {visible.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="size-7" />}
              title="조건에 맞는 업무가 없습니다"
              description="검색어나 상태 필터를 바꾸거나 새 업무를 만드세요."
              action={
                <Button onClick={() => navigate("SC-19")}>업무 만들기</Button>
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>업무</TableHead>
                    <TableHead>고객·위치</TableHead>
                    <TableHead>담당자</TableHead>
                    <TableHead>예정일</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="w-12">
                      <span className="sr-only">열기</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((task, index) => {
                    const id = recordId(task, index)
                    const status = taskStatus(task)
                    return (
                      <TableRow
                        key={id}
                        className="cursor-pointer"
                        onClick={() => navigate("SC-20", { params: { id } })}
                      >
                        <TableCell className="max-w-80 whitespace-normal">
                          <div className="font-medium">{taskTitle(task)}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {id}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-64 whitespace-normal">
                          <div>{taskCustomer(task)}</div>
                          <div className="text-xs text-muted-foreground">
                            {taskLocation(task)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {stringValue(task, "assignee_name", "worker_name") ||
                            "미배정"}
                        </TableCell>
                        <TableCell>{formatDate(taskDate(task))}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(status)}>
                            {statusLabel(status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="size-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <TablePagination
                className="px-0"
                page={currentPage}
                pageSize={pageSize}
                total={filtered.length}
                pageSizeOptions={[10, 20, 50]}
                aria-label="작업 목록 페이지 이동"
                onPageChange={setPage}
                onPageSizeChange={(nextPageSize) => {
                  setPageSize(nextPageSize)
                  setPage(1)
                }}
              />
            </>
          )}
        </>
      )}
    </OperationsLayout>
  )
}

function CalendarPage({ navigate }: { navigate: SnapNavigate }) {
  const demoPage = useMemo<SnapPage>(() => ({ items: DEMO_TASKS }), [])
  const resource = useSnapResource(() => snapApi.tasks.list(), demoPage)
  const [cursor, setCursor] = useState(() => {
    const date = new Date()
    return new Date(date.getFullYear(), date.getMonth(), 1)
  })
  const [filter, setFilter] = useState("all")

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const start = new Date(first)
    start.setDate(1 - first.getDay())
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return date
    })
  }, [cursor])

  const tasksByDate = useMemo(() => {
    const map = new Map<string, SnapJsonRecord[]>()
    resource.data.items.forEach((task) => {
      const raw = taskDate(task)
      if (!raw) return
      const date = new Date(raw)
      if (Number.isNaN(date.getTime())) return
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      const status = normalizedTaskStatus(taskStatus(task))
      if (filter !== "all" && filter !== status) return
      map.set(key, [...(map.get(key) ?? []), task])
    })
    return map
  }, [filter, resource.data.items])

  const monthLabel = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
  }).format(cursor)

  return (
    <OperationsLayout>
      <PageHeader
        eyebrow="현장 일정"
        title="캘린더"
        description="업무 예정일과 상태를 날짜별로 확인하고 업무 상세로 이동합니다."
        actions={
          <Button onClick={() => navigate("SC-19")}>
            <Plus /> 업무 만들기
          </Button>
        }
      />
      {resource.loading ? (
        <LoadingState variant="calendar" />
      ) : resource.error ? (
        <ErrorState message={resource.error} onRetry={resource.reload} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="이전 달"
                onClick={() =>
                  setCursor(
                    (date) =>
                      new Date(date.getFullYear(), date.getMonth() - 1, 1)
                  )
                }
              >
                <ChevronLeft />
              </Button>
              <h2 className="min-w-32 text-center font-semibold">
                {monthLabel}
              </h2>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="다음 달"
                onClick={() =>
                  setCursor(
                    (date) =>
                      new Date(date.getFullYear(), date.getMonth() + 1, 1)
                  )
                }
              >
                <ChevronRight />
              </Button>
              <Button variant="ghost" onClick={() => setCursor(new Date())}>
                오늘
              </Button>
            </div>
            <Select
              value={filter}
              onValueChange={(value) => setFilter(String(value))}
            >
              <SelectTrigger className="w-40">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      filter === "all"
                        ? "bg-muted-foreground"
                        : taskStatusStyle(filter).dot
                    )}
                  />
                  <span>
                    {filter === "all" ? "전체 상태" : statusLabel(filter)}
                  </span>
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-muted-foreground" />
                    전체 상태
                  </span>
                </SelectItem>
                {TASK_STATUS_ORDER.map((status) => (
                  <SelectItem key={status} value={status}>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          taskStatusStyle(status).dot
                        )}
                      />
                      {statusLabel(status)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-y py-2.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">진행 단계</span>
            {TASK_STATUS_ORDER.map((status) => (
              <button
                key={status}
                type="button"
                className={cn(
                  "flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-muted",
                  filter === status && "bg-muted font-medium text-foreground"
                )}
                onClick={() =>
                  setFilter((current) => (current === status ? "all" : status))
                }
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    taskStatusStyle(status).dot
                  )}
                />
                {statusLabel(status)}
              </button>
            ))}
          </div>
          <div className="overflow-hidden rounded-md border">
            <div className="grid grid-cols-7 bg-sidebar text-center text-xs text-muted-foreground">
              {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                <div key={day} className="border-r px-2 py-2 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((date) => {
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                const items = tasksByDate.get(key) ?? []
                const otherMonth = date.getMonth() !== cursor.getMonth()
                const today = new Date().toDateString() === date.toDateString()
                return (
                  <div
                    key={key}
                    className={cn(
                      "min-h-28 border-t border-r p-1.5 last:border-r-0 sm:min-h-36 sm:p-2",
                      otherMonth && "bg-muted/30 text-muted-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-xs",
                        today && "bg-primary text-primary-foreground"
                      )}
                    >
                      {date.getDate()}
                    </div>
                    <div className="mt-1 space-y-1">
                      {items.slice(0, 3).map((task, index) => {
                        const status = normalizedTaskStatus(taskStatus(task))
                        const style = taskStatusStyle(status)
                        const title = taskTitle(task)
                        return (
                          <Tooltip key={recordId(task, index)}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className={cn(
                                  "block w-full truncate rounded border-l-2 px-1.5 py-1 text-left text-[11px] transition-colors",
                                  style.event
                                )}
                                onClick={() =>
                                  navigate("SC-20", {
                                    params: { id: recordId(task, index) },
                                  })
                                }
                              >
                                <span
                                  className={cn(
                                    "mr-1 inline-block size-1.5 rounded-full",
                                    style.dot
                                  )}
                                />
                                {title}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              align="start"
                              className="flex max-w-72 flex-col items-start gap-1 px-3 py-2"
                            >
                              <strong className="text-xs">{title}</strong>
                              <span className="flex items-center gap-1.5 text-[11px] text-background/80">
                                <span
                                  className={cn(
                                    "size-2 rounded-full",
                                    style.dot
                                  )}
                                />
                                진행 상태 · {statusLabel(status)}
                              </span>
                              <span className="text-[11px] text-background/70">
                                {taskLocation(task)}
                              </span>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                      {items.length > 3 ? (
                        <div className="px-1 text-[10px] text-muted-foreground">
                          +{items.length - 3}건
                        </div>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </OperationsLayout>
  )
}

function WorkflowPage({ navigate }: { navigate: SnapNavigate }) {
  const demoPage = useMemo<SnapPage>(() => ({ items: DEMO_SCHEMAS }), [])
  const resource = useSnapResource(
    () => snapApi.catalog.taskTypeSchemas(),
    demoPage
  )
  const [query, setQuery] = useState("")
  const [scopeFilter, setScopeFilter] = useState<"all" | "global" | "custom">(
    "all"
  )
  const [selectedId, setSelectedId] = useState("")
  const activeSchemas = useMemo(
    () =>
      resource.data.items.filter((schema) => {
        const status = stringValue(schema, "status").toLowerCase()
        return !status || status === "active"
      }),
    [resource.data.items]
  )
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return activeSchemas.filter((schema) => {
      const custom = Boolean(stringValue(schema, "organization_id"))
      const matchesScope =
        scopeFilter === "all" || (scopeFilter === "custom" ? custom : !custom)
      const matchesKeyword = !keyword
        ? true
        : [
            stringValue(schema, "display_name", "name"),
            stringValue(schema, "schema_key", "key"),
            stringValue(schema, "description"),
            ...workflowKeywords(schema),
          ]
            .join(" ")
            .toLowerCase()
            .includes(keyword)
      return matchesScope && matchesKeyword
    })
  }, [activeSchemas, query, scopeFilter])
  const selected = activeSchemas.find(
    (schema, index) => recordId(schema, index) === selectedId
  )
  const globalCount = activeSchemas.filter(
    (schema) => !stringValue(schema, "organization_id")
  ).length
  const customCount = activeSchemas.length - globalCount

  return (
    <OperationsLayout>
      <PageHeader
        eyebrow="업무 표준"
        title="워크플로우"
        description="업무 유형별 필수 사진, 영상, 보고서 템플릿과 AI 분류 키워드를 확인합니다."
        actions={
          <Button onClick={() => navigate("SC-19")}>
            <Plus /> 이 유형으로 업무 만들기
          </Button>
        }
      />
      {resource.loading ? (
        <LoadingState variant="cards" />
      ) : resource.error ? (
        <ErrorState message={resource.error} onRetry={resource.reload} />
      ) : activeSchemas.length === 0 ? (
        <EmptyState
          icon={<Workflow className="size-7" />}
          title="사용 가능한 워크플로우가 없습니다"
          description="백엔드의 task-type schema가 등록되면 여기에 표시됩니다."
        />
      ) : (
        <>
          <SummaryStrip
            items={[
              {
                key: "all",
                label: "활성 워크플로우",
                value: activeSchemas.length,
                hint: "현재 사용 가능",
              },
              {
                key: "global",
                label: "표준 (글로벌)",
                value: globalCount,
                hint: "ECOYA 기본 유형",
              },
              {
                key: "custom",
                label: "조직 맞춤",
                value: customCount,
                hint: "우리 조직 전용",
              },
            ]}
            selectedKey={scopeFilter}
            onSelect={(key) => {
              setScopeFilter(key as typeof scopeFilter)
              setSelectedId("")
            }}
          />
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="업무 유형, 키워드, 설명 검색"
          />
          {filtered.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((schema, index) => {
                const id = recordId(schema, index)
                const photos = workflowPhotos(schema)
                const videos = workflowVideos(schema)
                const keywords = workflowKeywords(schema)
                const custom = Boolean(stringValue(schema, "organization_id"))
                return (
                  <button
                    key={id}
                    className="flex min-h-56 flex-col rounded-md border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-sidebar-accent/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    onClick={() => setSelectedId(id)}
                  >
                    <div className="flex w-full items-start justify-between gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Workflow className="size-5" />
                      </span>
                      <Badge variant="outline">
                        {custom ? "조직 맞춤" : "표준"}
                      </Badge>
                    </div>
                    <div className="mt-4 font-semibold">
                      {stringValue(schema, "display_name", "name") ||
                        "이름 없는 유형"}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {stringValue(schema, "description") || "설명 없음"}
                    </p>
                    {keywords.length ? (
                      <div className="mt-3 flex max-h-6 flex-wrap gap-1 overflow-hidden">
                        {keywords.slice(0, 3).map((keyword) => (
                          <Badge key={keyword} variant="secondary">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-auto flex w-full flex-wrap items-center gap-3 border-t pt-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Camera className="size-3.5" /> 사진 {photos.length}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Video className="size-3.5" /> 영상 {videos.length}
                      </span>
                      {stringValue(schema, "report_template_key") ? (
                        <span className="inline-flex items-center gap-1">
                          <FileText className="size-3.5" /> 리포트
                        </span>
                      ) : null}
                      <ChevronRight className="ml-auto size-4" />
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Search className="size-7" />}
              title="검색 결과가 없습니다"
              description="다른 업무 유형이나 키워드로 검색해 주세요."
            />
          )}
          <Sheet
            open={Boolean(selected)}
            onOpenChange={(open) => !open && setSelectedId("")}
          >
            <SheetContent className="top-12 h-[calc(100dvh-3rem)] w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
              {selected ? (
                <>
                  <SheetHeader className="border-b pr-12">
                    <div className="mb-2 flex items-center gap-2">
                      {stringValue(selected, "organization_id") ? (
                        <Building2 className="size-4 text-primary" />
                      ) : (
                        <Globe className="size-4 text-primary" />
                      )}
                      <Badge variant="outline">
                        {stringValue(selected, "organization_id")
                          ? "조직 맞춤"
                          : "표준 워크플로우"}
                      </Badge>
                    </div>
                    <SheetTitle className="text-xl">
                      {stringValue(selected, "display_name", "name")}
                    </SheetTitle>
                    <SheetDescription>
                      {stringValue(selected, "schema_key", "key")} · v
                      {stringValue(selected, "version") || "1"}
                    </SheetDescription>
                  </SheetHeader>
                  <div className="p-5">
                    <p className="text-sm leading-6 text-muted-foreground">
                      {stringValue(selected, "description") || "설명 없음"}
                    </p>
                    <WorkflowList
                      title="필수 사진"
                      icon={<Camera />}
                      items={workflowPhotos(selected)}
                    />
                    <WorkflowList
                      title="필수 영상"
                      icon={<Video />}
                      items={workflowVideos(selected)}
                    />
                    <WorkflowList
                      title="인식 키워드"
                      icon={<Sparkles />}
                      items={workflowKeywords(selected)}
                      badges
                    />
                    <WorkflowList
                      title="리포트 템플릿"
                      icon={<FileText />}
                      items={
                        stringValue(selected, "report_template_key")
                          ? [stringValue(selected, "report_template_key")]
                          : []
                      }
                    />
                  </div>
                  <SheetFooter className="sticky bottom-0 border-t bg-background">
                    <Button onClick={() => navigate("SC-19")}>
                      <Plus /> 이 유형으로 업무 만들기
                    </Button>
                  </SheetFooter>
                </>
              ) : null}
            </SheetContent>
          </Sheet>
        </>
      )}
    </OperationsLayout>
  )
}

function WorkflowList({
  title,
  items,
  icon,
  badges = false,
}: {
  title: string
  items: string[]
  icon?: ReactNode
  badges?: boolean
}) {
  return (
    <section className="mt-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        {icon ? <span className="[&_svg]:size-4">{icon}</span> : null}
        {title} <span className="font-normal">{items.length}</span>
      </div>
      {items.length ? (
        <div
          className={cn(
            "mt-2",
            badges ? "flex flex-wrap gap-1.5" : "divide-y border-y"
          )}
        >
          {items.map((item) =>
            badges ? (
              <Badge key={item} variant="secondary">
                {item}
              </Badge>
            ) : (
              <div key={item} className="py-2.5 text-sm">
                {item}
              </div>
            )
          )}
        </div>
      ) : (
        <div className="mt-2 border-y py-3 text-sm text-muted-foreground">
          필수 항목 없음
        </div>
      )}
    </section>
  )
}

function ErpHandoffPage({ navigate }: { navigate: SnapNavigate }) {
  const demoPage = useMemo<SnapPage>(() => ({ items: DEMO_HANDOFFS }), [])
  const resource = useSnapResource(
    () => snapApi.erp.organizationHandoffs({ limit: 50 }),
    demoPage
  )
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [busyId, setBusyId] = useState("")
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return resource.data.items.filter((handoff) => {
      const rowStatus = stringValue(handoff, "status").toLowerCase() || "draft"
      const haystack = [
        stringValue(handoff, "task_title", "title"),
        stringValue(handoff, "location_name"),
        stringValue(handoff, "handoff_type"),
        recordId(handoff),
      ]
        .join(" ")
        .toLowerCase()
      const matchesStatus =
        status === "all" ||
        status === rowStatus ||
        (status === "sent" && rowStatus === "delivered")
      return matchesStatus && (!keyword || haystack.includes(keyword))
    })
  }, [query, resource.data.items, status])

  const confirm = async (handoff: SnapJsonRecord, index: number) => {
    const id = recordId(handoff, index)
    setBusyId(id)
    try {
      if (snapApiConfigured) await snapApi.erp.confirmHandoff(id)
      toast.success("ERP 인계를 확정했습니다.")
      resource.reload()
    } catch (reason) {
      toast.error(snapApiErrorMessage(reason))
    } finally {
      setBusyId("")
    }
  }

  const exportPackage = async (handoff: SnapJsonRecord, index: number) => {
    const id = recordId(handoff, index)
    setBusyId(id)
    try {
      const blob = snapApiConfigured
        ? await snapApi.erp.exportHandoff(id)
        : new Blob([JSON.stringify(handoff, null, 2)], {
            type: "application/json",
          })
      downloadBlob(blob, `erp-handoff-${id}.json`)
      toast.success("ERP 인계 JSON을 내려받았습니다.")
    } catch (reason) {
      toast.error(snapApiErrorMessage(reason))
    } finally {
      setBusyId("")
    }
  }

  return (
    <OperationsLayout>
      <PageHeader
        eyebrow="연결·운영"
        title="내보내기·연동"
        description="확인된 현장 결과를 ERP에 연결하고, 사람이 범위를 확정한 JSON 패키지를 내보냅니다."
      />
      {resource.loading ? (
        <LoadingState variant="table" />
      ) : resource.error ? (
        <ErrorState message={resource.error} onRetry={resource.reload} />
      ) : (
        <>
          <SummaryStrip
            items={[
              {
                key: "all",
                label: "전체 인계",
                value: resource.data.items.length,
              },
              {
                key: "draft",
                label: "초안",
                value: resource.data.items.filter(
                  (item) => stringValue(item, "status") === "draft"
                ).length,
              },
              {
                key: "confirmed",
                label: "확정",
                value: resource.data.items.filter(
                  (item) => stringValue(item, "status") === "confirmed"
                ).length,
              },
              {
                key: "sent",
                label: "전달 완료",
                value: resource.data.items.filter((item) =>
                  ["sent", "delivered"].includes(stringValue(item, "status"))
                ).length,
              },
            ]}
            selectedKey={status}
            onSelect={setStatus}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="업무명, 위치, 인계 유형 검색"
            />
            <Select
              value={status}
              onValueChange={(value) => setStatus(String(value))}
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 상태</SelectItem>
                <SelectItem value="draft">초안</SelectItem>
                <SelectItem value="confirmed">확정</SelectItem>
                <SelectItem value="sent">전달됨</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<PackageCheck className="size-7" />}
              title="조건에 맞는 인계가 없습니다"
              description="업무 상세에서 ERP 연결 범위를 만들면 이 목록에서 확정할 수 있습니다."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>업무</TableHead>
                  <TableHead>인계 유형·범위</TableHead>
                  <TableHead>생성일</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((handoff, index) => {
                  const id = recordId(handoff, index)
                  const rowStatus = stringValue(handoff, "status") || "draft"
                  return (
                    <TableRow key={id}>
                      <TableCell className="max-w-80 whitespace-normal">
                        <Button
                          variant="outline"
                          size="xs"
                          className="max-w-full justify-start"
                          onClick={() =>
                            navigate("SC-20", {
                              params: {
                                id:
                                  stringValue(handoff, "task_id") ||
                                  "TASK-DEMO-001",
                              },
                            })
                          }
                        >
                          <span className="truncate">
                            {stringValue(handoff, "task_title", "title") ||
                              "업무"}
                          </span>
                        </Button>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {stringValue(handoff, "location_name") || id}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-72 whitespace-normal">
                        <div>
                          {stringValue(handoff, "handoff_type") || "generic"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {stringValue(handoff, "scope", "scope_summary") ||
                            "범위 확인 필요"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(stringValue(handoff, "created_at"), {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(rowStatus)}>
                          {statusLabel(rowStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {rowStatus === "draft" ? (
                            <Button
                              size="xs"
                              variant="outline"
                              disabled={busyId === id}
                              onClick={() => void confirm(handoff, index)}
                            >
                              {busyId === id ? (
                                <LoaderCircle className="animate-spin" />
                              ) : (
                                <Check />
                              )}{" "}
                              확정
                            </Button>
                          ) : null}
                          <Button
                            size="xs"
                            variant="outline"
                            disabled={busyId === id}
                            onClick={() => void exportPackage(handoff, index)}
                          >
                            <FileJson /> 내보내기
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </OperationsLayout>
  )
}

function CorrectiveActionsPage({ navigate }: { navigate: SnapNavigate }) {
  const demoPage = useMemo<SnapPage>(() => ({ items: DEMO_CORRECTIVE }), [])
  const [filter, setFilter] = useState("all")
  const resource = useSnapResource(
    () =>
      snapApi.operations.correctiveActions(
        filter === "all"
          ? {}
          : filter === "overdue"
            ? { overdue: true }
            : { status: filter }
      ),
    demoPage
  )
  const [selectedId, setSelectedId] = useState("")
  const [evidenceUrl, setEvidenceUrl] = useState("")
  const [notes, setNotes] = useState("")
  const [busyId, setBusyId] = useState("")

  const visible = useMemo(() => {
    if (snapApiConfigured || filter === "all") return resource.data.items
    if (filter === "overdue") {
      const today = new Date().toISOString().slice(0, 10)
      return resource.data.items.filter((item) => {
        const due = stringValue(item, "due_date")
        return due && due < today && stringValue(item, "status") !== "verified"
      })
    }
    return resource.data.items.filter(
      (item) => stringValue(item, "status") === filter
    )
  }, [filter, resource.data.items])

  const updateStatus = async (
    item: SnapJsonRecord,
    index: number,
    status: string
  ) => {
    const id = recordId(item, index)
    setBusyId(id)
    try {
      if (snapApiConfigured) {
        await snapApi.operations.updateCorrectiveAction(id, {
          status,
          ...(evidenceUrl ? { evidence_url: evidenceUrl } : {}),
          ...(notes ? { notes } : {}),
        })
      }
      toast.success(
        status === "verified"
          ? "시정조치를 검증했습니다."
          : "상태를 변경했습니다."
      )
      setSelectedId("")
      setEvidenceUrl("")
      setNotes("")
      resource.reload()
    } catch (reason) {
      toast.error(snapApiErrorMessage(reason))
    } finally {
      setBusyId("")
    }
  }

  const createRecapture = async (item: SnapJsonRecord, index: number) => {
    const id = recordId(item, index)
    const taskId = stringValue(item, "task_id")
    setBusyId(id)
    try {
      if (snapApiConfigured) {
        if (!taskId) throw new Error("연결된 업무 ID가 없습니다.")
        await snapApi.tasks.decideOfficeReview(taskId, {
          decision: "request_recapture",
        })
      }
      toast.success("작업자에게 재촬영을 요청했습니다.")
      resource.reload()
    } catch (reason) {
      toast.error(snapApiErrorMessage(reason))
    } finally {
      setBusyId("")
    }
  }

  return (
    <OperationsLayout>
      <PageHeader
        eyebrow="안전·품질"
        title="시정조치"
        description="검토에서 발견된 위험을 작업자 재촬영과 증거 검증까지 닫힌 흐름으로 관리합니다."
      />
      <div className="flex flex-wrap gap-2">
        {["all", "open", "in_progress", "overdue", "verified"].map((value) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? "secondary" : "ghost"}
            onClick={() => setFilter(value)}
          >
            {
              {
                all: "전체",
                open: "대기",
                in_progress: "진행 중",
                overdue: "기한 초과",
                verified: "검증 완료",
              }[value]
            }
          </Button>
        ))}
      </div>
      {resource.loading ? (
        <LoadingState variant="table" />
      ) : resource.error ? (
        <ErrorState message={resource.error} onRetry={resource.reload} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="size-7" />}
          title="이 상태의 시정조치가 없습니다"
          description="검토에서 새 조치가 등록되면 위험도와 기한 기준으로 표시됩니다."
        />
      ) : (
        <div className="divide-y border-y">
          {visible.map((item, index) => {
            const id = recordId(item, index)
            const status = stringValue(item, "status") || "open"
            const risk = stringValue(item, "risk_band", "priority") || "unrated"
            const selected = selectedId === id
            return (
              <article key={id} className="px-3 py-4">
                <div className="flex flex-wrap items-start gap-2">
                  <Badge
                    variant={
                      risk === "critical" || risk === "high"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {risk}
                  </Badge>
                  <Badge variant={statusVariant(status)}>
                    {statusLabel(status)}
                  </Badge>
                  <button
                    className="ml-auto text-xs text-primary hover:underline"
                    onClick={() =>
                      navigate("SC-20", {
                        params: {
                          id: stringValue(item, "task_id") || "TASK-DEMO-001",
                        },
                      })
                    }
                  >
                    업무 보기 <ExternalLink className="ml-1 inline size-3" />
                  </button>
                </div>
                <h2 className="mt-2 font-medium">
                  {stringValue(item, "hazard", "title") || "시정조치"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stringValue(item, "action_required", "description") ||
                    "조치 내용을 확인하세요."}
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  기한 {stringValue(item, "due_date") || "미정"}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {status === "open" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === id}
                      onClick={() =>
                        void updateStatus(item, index, "in_progress")
                      }
                    >
                      조치 시작
                    </Button>
                  ) : null}
                  {status !== "verified" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === id}
                        onClick={() => void createRecapture(item, index)}
                      >
                        재촬영 요청
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setSelectedId(selected ? "" : id)}
                      >
                        검증
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === id}
                      onClick={() =>
                        void updateStatus(item, index, "in_progress")
                      }
                    >
                      다시 열기
                    </Button>
                  )}
                </div>
                {selected ? (
                  <div className="mt-4 grid gap-3 border-t pt-4">
                    <label className="grid gap-1.5 text-sm font-medium">
                      증거 URL
                      <Input
                        value={evidenceUrl}
                        onChange={(event) => setEvidenceUrl(event.target.value)}
                        placeholder="https://... 또는 첨부 미디어 URL"
                      />
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium">
                      검증 메모
                      <Textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="확인한 사실과 조치 결과"
                      />
                    </label>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setSelectedId("")}>
                        취소
                      </Button>
                      <Button
                        disabled={busyId === id}
                        onClick={() =>
                          void updateStatus(item, index, "verified")
                        }
                      >
                        {busyId === id ? (
                          <LoaderCircle className="animate-spin" />
                        ) : (
                          <ClipboardCheck />
                        )}{" "}
                        검증 완료
                      </Button>
                    </div>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </OperationsLayout>
  )
}

function OperationsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-ecoya-wide-xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  )
}

export function SnapOperationsPage({
  screen,
  navigate,
}: {
  screen: SnapScreenKey
  navigate: SnapNavigate
}) {
  switch (screen) {
    case "SC-17":
      return <DashboardPage navigate={navigate} />
    case "SC-18":
      return <TasksPage navigate={navigate} />
    case "SC-25":
      return <CalendarPage navigate={navigate} />
    case "SC-26":
      return <WorkflowPage navigate={navigate} />
    case "SC-27":
      return <ErpHandoffPage navigate={navigate} />
    case "SC-29":
      return <CorrectiveActionsPage navigate={navigate} />
    default:
      return null
  }
}

import { useEffect, useMemo, useState } from "react"
import {
  Archive,
  ArrowLeft,
  Camera,
  ExternalLink,
  FileImage,
  Folder,
  FolderArchive,
  FolderPlus,
  Link2,
  LockKeyhole,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@shared/components/ui/badge"
import { Button } from "@shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog"
import { Input } from "@shared/components/ui/input"
import { SubmittedSearchInput } from "@shared/components/ui/submitted-search-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select"
import { Skeleton } from "@shared/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs"
import { snapApi } from "@snap/lib/snap-api"
import {
  SnapApiError,
  snapApiConfigured,
  snapApiErrorMessage,
  type SnapJsonRecord,
} from "@snap/lib/snap-report-api"
import { cn } from "@shared/lib/utils"

const FOLDER_TYPES = [
  "customer",
  "project",
  "task_group",
  "site",
  "shipment_trade_order",
  "claim_case",
  "date_month",
  "worker_team",
  "report_type",
  "knowledge_research",
  "general",
] as const

type FolderType = (typeof FOLDER_TYPES)[number]
type FolderVisibility = "organization" | "private"
type FolderStatus = "active" | "archived"
type FolderItemType =
  | "task"
  | "media_asset"
  | "report"
  | "report_version"
  | "share_link"
  | "task_link"
  | "knowledge_item"
  | "action_item"
  | "erp_handoff"
  | "claim_pack"

type EvidenceFolder = {
  id: string
  name: string
  type: FolderType
  visibility: FolderVisibility
  status: FolderStatus
  createdAt: string
  updatedAt: string
  itemCount: number
}

type FolderItem = {
  id: string
  folderId: string
  itemType: FolderItemType
  itemId: string
  source: "manual" | "ai_suggested" | "auto_policy"
  addedAt: string
  title?: string
  description?: string
  thumbnail?: string
}

type LibraryCandidate = {
  id: string
  kind: "task" | "media_asset"
  title: string
  description: string
  thumbnail?: string
}

const FOLDER_TYPE_LABELS: Record<FolderType, string> = {
  customer: "고객",
  project: "프로젝트",
  task_group: "업무 묶음",
  site: "현장",
  shipment_trade_order: "선적·거래 주문",
  claim_case: "클레임",
  date_month: "월별",
  worker_team: "작업자·팀",
  report_type: "보고서 유형",
  knowledge_research: "지식·리서치",
  general: "일반",
}

const DEMO_FOLDERS: EvidenceFolder[] = [
  {
    id: "folder-busan-yard",
    name: "Busan Yard · 7월 선적",
    type: "shipment_trade_order",
    visibility: "organization",
    status: "active",
    createdAt: "2026-07-02T09:30:00+09:00",
    updatedAt: "2026-08-05T09:10:00+09:00",
    itemCount: 4,
  },
  {
    id: "folder-hanbit",
    name: "Hanbit Trading Co.",
    type: "customer",
    visibility: "organization",
    status: "active",
    createdAt: "2026-06-18T13:00:00+09:00",
    updatedAt: "2026-08-04T16:30:00+09:00",
    itemCount: 3,
  },
  {
    id: "folder-claim",
    name: "봉인 훼손 확인 건",
    type: "claim_case",
    visibility: "private",
    status: "active",
    createdAt: "2026-07-28T10:20:00+09:00",
    updatedAt: "2026-08-03T12:15:00+09:00",
    itemCount: 2,
  },
  {
    id: "folder-archive",
    name: "2026년 5월 완료 업무",
    type: "date_month",
    visibility: "organization",
    status: "archived",
    createdAt: "2026-05-01T09:00:00+09:00",
    updatedAt: "2026-06-01T09:00:00+09:00",
    itemCount: 18,
  },
]

const DEMO_ITEMS: Record<string, FolderItem[]> = {
  "folder-busan-yard": [
    {
      id: "folder-item-task-118",
      folderId: "folder-busan-yard",
      itemType: "task",
      itemId: "task-busan-118",
      source: "manual",
      addedAt: "2026-08-05T09:10:00+09:00",
      title: "Busan Yard #24-118 적재 확인",
      description: "봉인 번호, 외관 4면, 적재 전·후",
    },
    {
      id: "folder-item-media-seal",
      folderId: "folder-busan-yard",
      itemType: "media_asset",
      itemId: "media-seal-1",
      source: "manual",
      addedAt: "2026-08-05T09:12:00+09:00",
      title: "봉인 번호 1",
      description: "현장 촬영 · 사람 검토됨",
      thumbnail: "/snap-report/seal.jpg",
    },
    {
      id: "folder-item-media-exterior",
      folderId: "folder-busan-yard",
      itemType: "media_asset",
      itemId: "media-exterior-1",
      source: "manual",
      addedAt: "2026-08-05T09:13:00+09:00",
      title: "외관 정면",
      description: "현장 촬영 · 캡처됨",
      thumbnail: "/snap-report/exterior-front.jpg",
    },
    {
      id: "folder-item-report",
      folderId: "folder-busan-yard",
      itemType: "report",
      itemId: "report-demo-001",
      source: "auto_policy",
      addedAt: "2026-08-05T09:20:00+09:00",
      title: "Loading Inspection",
      description: "승인된 고객용 보고서",
    },
  ],
}

const DEMO_TASKS: LibraryCandidate[] = [
  {
    id: "task-busan-119",
    kind: "task",
    title: "Busan CY 컨테이너 도착 확인",
    description: "오늘 14:00 · 작업자 김민지",
  },
  {
    id: "task-incheon-221",
    kind: "task",
    title: "Incheon 창고 하역 검수",
    description: "8월 6일 · 배정 대기",
  },
  {
    id: "task-gwangyang-041",
    kind: "task",
    title: "광양 봉인 번호 재촬영",
    description: "시정조치 연결 업무",
  },
]

const DEMO_MEDIA: LibraryCandidate[] = [
  {
    id: "media-seal-search",
    kind: "media_asset",
    title: "봉인 번호 · HMMU 7820194",
    description: "Busan Yard · 2026.08.05 08:42",
    thumbnail: "/snap-report/seal.jpg",
  },
  {
    id: "media-exterior-search",
    kind: "media_asset",
    title: "외관 정면 · HMMU 7820194",
    description: "Busan Yard · 사람 검토됨",
    thumbnail: "/snap-report/exterior-front.jpg",
  },
  {
    id: "media-loading-search",
    kind: "media_asset",
    title: "적재 후 · HMMU 7820194",
    description: "Busan Yard · 캡처됨",
    thumbnail: "/snap-report/loading-after.jpg",
  },
]

function record(value: unknown): SnapJsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as SnapJsonRecord)
    : {}
}

function textValue(value: unknown, fallback = "") {
  return typeof value === "string" && value ? value : fallback
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function folderFromApi(value: unknown, index: number): EvidenceFolder {
  const item = record(value)
  const type = textValue(item.folder_type, "general") as FolderType
  const archivedAt = textValue(item.archived_at)
  return {
    id: textValue(item.id, `folder-${index}`),
    name: textValue(item.folder_name, "이름 없는 폴더"),
    type: FOLDER_TYPES.includes(type) ? type : "general",
    visibility:
      item.visibility === "private" ? "private" : "organization",
    status: archivedAt ? "archived" : "active",
    createdAt: textValue(item.created_at, new Date().toISOString()),
    updatedAt: textValue(
      item.updated_at,
      textValue(item.created_at, new Date().toISOString())
    ),
    itemCount: numberValue(item.item_count ?? item.items_count),
  }
}

function itemFromApi(value: unknown, folderId: string, index: number): FolderItem {
  const item = record(value)
  const itemType = textValue(item.item_type, "task") as FolderItemType
  return {
    id: textValue(item.id, `folder-item-${index}`),
    folderId,
    itemType,
    itemId: textValue(item.item_id, `item-${index}`),
    source:
      item.source === "ai_suggested" || item.source === "auto_policy"
        ? item.source
        : "manual",
    addedAt: textValue(item.added_at, new Date().toISOString()),
    title: textValue(item.title),
    description: textValue(item.description),
    thumbnail: textValue(item.thumbnail_url),
  }
}

function candidateFromApi(value: unknown, kind: LibraryCandidate["kind"], index: number) {
  const item = record(value)
  const task = record(item.task)
  const instruction = record(item.human_instruction)
  return {
    id: textValue(item.id, `${kind}-${index}`),
    kind,
    title: textValue(
      instruction.title,
      textValue(
        item.title,
        textValue(task.location_name, textValue(item.task_type, "이름 없는 항목"))
      )
    ),
    description: textValue(
      task.natural_language_input,
      textValue(item.location_name, textValue(item.media_type, kind))
    ),
    thumbnail: textValue(item.thumbnail_url),
  } satisfies LibraryCandidate
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

function sourceLabel(source: FolderItem["source"]) {
  if (source === "ai_suggested") return "AI 제안"
  if (source === "auto_policy") return "자동 정책"
  return "직접 추가"
}

function itemTypeLabel(type: FolderItemType) {
  const labels: Partial<Record<FolderItemType, string>> = {
    task: "업무",
    media_asset: "미디어",
    report: "보고서",
    report_version: "보고서 버전",
    share_link: "공유 링크",
    erp_handoff: "ERP 인계",
  }
  return labels[type] || type
}

function FolderSummary({
  folders,
  statusFilter,
  onStatusFilter,
}: {
  folders: EvidenceFolder[]
  statusFilter: "all" | FolderStatus
  onStatusFilter: (status: "all" | FolderStatus) => void
}) {
  const active = folders.filter((folder) => folder.status === "active")
  const types = new Set(active.map((folder) => folder.type)).size
  const archived = folders.filter((folder) => folder.status === "archived").length
  const items = active.reduce((sum, folder) => sum + folder.itemCount, 0)
  const metrics = [
    { key: "active" as const, label: "활성 폴더", value: `${active.length}개` },
    { key: null, label: "분류 유형", value: `${types}개` },
    { key: null, label: "연결 항목", value: `${items}개` },
    { key: "archived" as const, label: "보관됨", value: `${archived}개` },
  ]
  return (
    <div className="ui-summary-strip grid sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => {
        const className = cn(
          "px-4 py-4",
          index > 0 && "border-t sm:border-t-0 sm:border-l"
        )
        const content = (
          <>
            <div className="text-xs text-muted-foreground">{metric.label}</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{metric.value}</div>
          </>
        )
        return metric.key ? (
          <button
            key={metric.label}
            type="button"
            className={cn(className, "ui-summary-filter")}
            aria-pressed={statusFilter === metric.key}
            onClick={() => onStatusFilter(metric.key)}
          >
            {content}
          </button>
        ) : (
          <div key={metric.label} className={className}>{content}</div>
        )
      })}
    </div>
  )
}

function FolderListSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 py-3">
          <Skeleton className="size-9 rounded-md" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

function Thumbnail({ item }: { item: { thumbnail?: string; title: string } }) {
  return (
    <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground">
      {item.thumbnail ? (
        <img
          src={item.thumbnail}
          alt=""
          className="size-full object-cover"
          onError={(event) => {
            event.currentTarget.hidden = true
          }}
        />
      ) : (
        <Camera aria-hidden="true" className="size-5" />
      )}
    </div>
  )
}

type SnapEvidenceLibraryProps = {
  onOpenTask: () => void
}

export function SnapEvidenceLibrary({ onOpenTask }: SnapEvidenceLibraryProps) {
  const [folders, setFolders] = useState<EvidenceFolder[]>(DEMO_FOLDERS)
  const [itemsByFolder, setItemsByFolder] = useState<Record<string, FolderItem[]>>(
    DEMO_ITEMS
  )
  const [selectedFolderId, setSelectedFolderId] = useState(
    snapApiConfigured ? "" : DEMO_FOLDERS[0].id
  )
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | FolderStatus>("active")
  const [folderTypeFilter, setFolderTypeFilter] = useState<"all" | FolderType>(
    "all"
  )
  const [loading, setLoading] = useState(snapApiConfigured)
  const [error, setError] = useState("")
  const [forbidden, setForbidden] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createType, setCreateType] = useState<FolderType>("general")
  const [createVisibility, setCreateVisibility] =
    useState<FolderVisibility>("organization")
  const [busy, setBusy] = useState("")
  const [folderItemsLoading, setFolderItemsLoading] = useState(snapApiConfigured)
  const [taskSearch, setTaskSearch] = useState("")
  const [taskCandidates, setTaskCandidates] = useState(DEMO_TASKS)
  const [mediaQuery, setMediaQuery] = useState("")
  const [mediaReference, setMediaReference] = useState("")
  const [mediaCandidates, setMediaCandidates] = useState<LibraryCandidate[]>([])
  const [mediaSearched, setMediaSearched] = useState(false)

  const loadFolders = async () => {
    if (!snapApiConfigured) {
      setFolders(DEMO_FOLDERS)
      setLoading(false)
      return
    }
    setLoading(true)
    setError("")
    setForbidden(false)
    try {
      const [active, archived] = await Promise.all([
        snapApi.folders.list(),
        snapApi.folders.list({ archived: true }),
      ])
      const next = [...active.items, ...archived.items].map(folderFromApi)
      setFolders(next)
      setSelectedFolderId((current) =>
        next.some((folder) => folder.id === current) ? current : next[0]?.id || ""
      )
    } catch (reason) {
      setForbidden(reason instanceof SnapApiError && reason.status === 403)
      setError(snapApiErrorMessage(reason))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!snapApiConfigured) return
    let cancelled = false
    const loadInitialFolders = async () => {
      try {
        const [active, archived] = await Promise.all([
          snapApi.folders.list(),
          snapApi.folders.list({ archived: true }),
        ])
        if (cancelled) return
        const next = [...active.items, ...archived.items].map(folderFromApi)
        setFolders(next)
        setSelectedFolderId(next[0]?.id || "")
      } catch (reason) {
        if (cancelled) return
        setForbidden(reason instanceof SnapApiError && reason.status === 403)
        setError(snapApiErrorMessage(reason))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadInitialFolders()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedFolderId || !snapApiConfigured) return
    let cancelled = false
    void Promise.all([
      snapApi.folders.items(selectedFolderId),
      snapApi.tasks.list(),
    ])
      .then(([items, tasks]) => {
        if (cancelled) return
        setItemsByFolder((current) => ({
          ...current,
          [selectedFolderId]: items.items.map((item, index) =>
            itemFromApi(item, selectedFolderId, index)
          ),
        }))
        setTaskCandidates(
          tasks.items.map((item, index) => candidateFromApi(item, "task", index))
        )
      })
      .catch((reason) => {
        if (!cancelled) toast.error(snapApiErrorMessage(reason))
      })
      .finally(() => {
        if (!cancelled) setFolderItemsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedFolderId])

  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId)
  const selectedItems = useMemo(
    () => (selectedFolder ? itemsByFolder[selectedFolder.id] || [] : []),
    [itemsByFolder, selectedFolder]
  )

  const selectFolder = (folderId: string) => {
    setFolderItemsLoading(snapApiConfigured && Boolean(folderId))
    setSelectedFolderId(folderId)
  }

  const filteredFolders = useMemo(() => {
    const query = search.trim().toLowerCase()
    return folders.filter((folder) => {
      if (statusFilter !== "all" && folder.status !== statusFilter) return false
      if (folderTypeFilter !== "all" && folder.type !== folderTypeFilter) return false
      return !query || `${folder.name} ${FOLDER_TYPE_LABELS[folder.type]}`.toLowerCase().includes(query)
    })
  }, [folders, folderTypeFilter, search, statusFilter])

  const visibleTaskCandidates = useMemo(() => {
    const linked = new Set(
      selectedItems
        .filter((item) => item.itemType === "task")
        .map((item) => item.itemId)
    )
    const query = taskSearch.trim().toLowerCase()
    return taskCandidates
      .filter((candidate) => !linked.has(candidate.id))
      .filter(
        (candidate) =>
          !query ||
          `${candidate.title} ${candidate.description}`.toLowerCase().includes(query)
      )
      .slice(0, 8)
  }, [selectedItems, taskCandidates, taskSearch])

  const createFolder = async () => {
    const name = createName.trim()
    if (!name) return
    setBusy("create")
    try {
      let folder: EvidenceFolder = {
        id: `folder-${Date.now()}`,
        name,
        type: createType,
        visibility: createVisibility,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        itemCount: 0,
      }
      if (snapApiConfigured) {
        const response = await snapApi.folders.create({
          folder_name: name,
          folder_type: createType,
          visibility: createVisibility,
        })
        folder = folderFromApi(response.folder || response, folders.length)
      }
      setFolders((current) => [folder, ...current])
      selectFolder(folder.id)
      setCreateName("")
      setCreateOpen(false)
      toast.success("폴더를 만들었습니다.")
    } catch (reason) {
      toast.error(snapApiErrorMessage(reason))
    } finally {
      setBusy("")
    }
  }

  const archiveFolder = async () => {
    if (!selectedFolder) return
    setBusy("archive")
    try {
      if (snapApiConfigured) await snapApi.folders.archive(selectedFolder.id)
      setFolders((current) =>
        current.map((folder) =>
          folder.id === selectedFolder.id
            ? { ...folder, status: "archived", updatedAt: new Date().toISOString() }
            : folder
        )
      )
      setStatusFilter("archived")
      toast.success("폴더를 보관했습니다. 연결된 원본 항목은 삭제되지 않습니다.")
    } catch (reason) {
      toast.error(snapApiErrorMessage(reason))
    } finally {
      setBusy("")
    }
  }

  const addCandidate = async (candidate: LibraryCandidate) => {
    if (!selectedFolder) return
    const actionId = `add-${candidate.id}`
    setBusy(actionId)
    try {
      let itemId = `folder-item-${selectedFolder.id}-${candidate.kind}-${candidate.id}`
      if (snapApiConfigured) {
        const response = await snapApi.folders.addItem(selectedFolder.id, {
          item_type: candidate.kind,
          item_id: candidate.id,
          source: candidate.kind === "media_asset" ? "manual" : "manual",
        })
        itemId = textValue(response.folder_item_id, itemId)
      }
      const newItem: FolderItem = {
        id: itemId,
        folderId: selectedFolder.id,
        itemType: candidate.kind,
        itemId: candidate.id,
        source: "manual",
        addedAt: new Date().toISOString(),
        title: candidate.title,
        description: candidate.description,
        thumbnail: candidate.thumbnail,
      }
      setItemsByFolder((current) => ({
        ...current,
        [selectedFolder.id]: [newItem, ...(current[selectedFolder.id] || [])],
      }))
      setFolders((current) =>
        current.map((folder) =>
          folder.id === selectedFolder.id
            ? { ...folder, itemCount: folder.itemCount + 1 }
            : folder
        )
      )
      toast.success(`${candidate.title}을(를) 폴더에 추가했습니다.`)
    } catch (reason) {
      toast.error(snapApiErrorMessage(reason))
    } finally {
      setBusy("")
    }
  }

  const removeItem = async (item: FolderItem) => {
    if (!selectedFolder) return
    setBusy(`remove-${item.id}`)
    try {
      if (snapApiConfigured) {
        await snapApi.folders.removeItem(selectedFolder.id, item.id)
      }
      setItemsByFolder((current) => ({
        ...current,
        [selectedFolder.id]: (current[selectedFolder.id] || []).filter(
          (candidate) => candidate.id !== item.id
        ),
      }))
      setFolders((current) =>
        current.map((folder) =>
          folder.id === selectedFolder.id
            ? { ...folder, itemCount: Math.max(0, folder.itemCount - 1) }
            : folder
        )
      )
      toast.success("폴더에서 연결을 제거했습니다. 원본은 유지됩니다.")
    } catch (reason) {
      toast.error(snapApiErrorMessage(reason))
    } finally {
      setBusy("")
    }
  }

  const searchMedia = async () => {
    if (!mediaQuery.trim() && !mediaReference.trim()) return
    setBusy("media-search")
    setMediaSearched(true)
    try {
      if (snapApiConfigured) {
        const response = await snapApi.folders.searchLibrary({
          ...(mediaQuery.trim() ? { query: mediaQuery.trim() } : {}),
          ...(mediaReference.trim() ? { reference: mediaReference.trim() } : {}),
          kind: "photo",
          limit: 20,
        })
        setMediaCandidates(
          response.items.map((item, index) =>
            candidateFromApi(item, "media_asset", index)
          )
        )
      } else {
        const query = `${mediaQuery} ${mediaReference}`.trim().toLowerCase()
        setMediaCandidates(
          DEMO_MEDIA.filter(
            (candidate) =>
              !query ||
              `${candidate.title} ${candidate.description}`.toLowerCase().includes(query)
          )
        )
      }
    } catch (reason) {
      toast.error(snapApiErrorMessage(reason))
    } finally {
      setBusy("")
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-ecoya-wide-xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b-0 pb-5">
          <div>
            <h1 className="text-2xl font-semibold">증빙 보관함</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              업무와 원본 미디어를 폴더로 연결해 보존하며, 폴더에서 제거해도 원본은 삭제되지 않습니다.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <FolderPlus aria-hidden="true" /> 폴더 만들기
          </Button>
        </div>

        <div className="mt-5">
          <FolderSummary
            folders={folders}
            statusFilter={statusFilter}
            onStatusFilter={(status) => {
              setStatusFilter(status)
              setSelectedFolderId("")
            }}
          />
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <SubmittedSearchInput
            value={search}
            onSearch={setSearch}
            placeholder="폴더명 또는 유형 검색"
            searchLabel="폴더 검색"
            formClassName="min-w-0 flex-1"
          />
          <div
            className="grid shrink-0 grid-cols-3 rounded-md bg-muted p-1"
            role="group"
            aria-label="폴더 상태"
          >
            {(
              [
                ["active", "활성 폴더"],
                ["archived", "보관됨"],
                ["all", "전체"],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={statusFilter === value ? "secondary" : "ghost"}
                className={cn(
                  "h-7 px-2 text-xs",
                  statusFilter === value && "bg-background shadow-sm hover:bg-background"
                )}
                aria-pressed={statusFilter === value}
                onClick={() => {
                  setStatusFilter(value)
                  setSelectedFolderId("")
                }}
              >
                {label}
              </Button>
            ))}
          </div>
          <Select
            value={folderTypeFilter}
            onValueChange={(value) =>
              setFolderTypeFilter(value as typeof folderTypeFilter)
            }
          >
            <SelectTrigger className="w-full sm:w-44" aria-label="폴더 유형">
              <SelectValue>
                {folderTypeFilter === "all"
                  ? "모든 유형"
                  : FOLDER_TYPE_LABELS[folderTypeFilter]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 유형</SelectItem>
              {FOLDER_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {FOLDER_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <div className="mt-5 rounded-md border border-destructive/30 bg-destructive/5 p-5">
            <div className="font-medium">
              {forbidden ? "이 기능을 볼 권한이 없습니다." : "폴더를 불러오지 못했습니다."}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button className="mt-4" variant="outline" onClick={() => void loadFolders()}>
              <RefreshCw /> 다시 시도
            </Button>
          </div>
        ) : (
          <div className="mt-5 min-h-[520px] border-y lg:grid lg:grid-cols-[340px_minmax(0,1fr)]">
            <section
              className={cn(
                "min-w-0 lg:border-r",
                selectedFolder && "hidden lg:block"
              )}
              aria-label="폴더 목록"
            >
              <div className="flex items-center justify-between border-b px-3 py-3">
                <div>
                  <h2 className="text-sm font-semibold">폴더</h2>
                  <p className="text-xs text-muted-foreground">
                    {filteredFolders.length}개 표시
                  </p>
                </div>
                {!snapApiConfigured && (
                  <Badge variant="secondary">API 연결 전 예시</Badge>
                )}
              </div>
              {loading ? (
                <FolderListSkeleton />
              ) : filteredFolders.length === 0 ? (
                <div className="px-5 py-16 text-center">
                  {statusFilter === "archived" ? (
                    <FolderArchive className="mx-auto size-7 text-muted-foreground" />
                  ) : (
                    <Folder className="mx-auto size-7 text-muted-foreground" />
                  )}
                  <p className="mt-3 text-sm font-medium">
                    {statusFilter === "archived"
                      ? "보관된 폴더가 없습니다."
                      : "조건에 맞는 폴더가 없습니다."}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {statusFilter === "archived"
                      ? "폴더를 보관하면 연결된 증빙과 함께 이 목록에 유지됩니다."
                      : "필터를 바꾸거나 새 폴더를 만드세요."}
                  </p>
                  {statusFilter !== "archived" && (
                    <Button className="mt-4" variant="outline" onClick={() => setCreateOpen(true)}>
                      <FolderPlus /> 폴더 만들기
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredFolders.map((folder) => (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => selectFolder(folder.id)}
                      className={cn(
                        "flex w-full items-start gap-3 px-3 py-4 text-left transition-colors hover:bg-sidebar-accent",
                        selectedFolderId === folder.id && "bg-sidebar-accent"
                      )}
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar">
                        {folder.status === "archived" ? (
                          <FolderArchive className="size-4" />
                        ) : folder.visibility === "private" ? (
                          <LockKeyhole className="size-4" />
                        ) : (
                          <Folder className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{folder.name}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{FOLDER_TYPE_LABELS[folder.type]}</span>
                          <span>{folder.itemCount}개 항목</span>
                          {folder.visibility === "private" && (
                            <span title="개인별 접근 제한은 백엔드 권한 정책 적용 후 제공됩니다.">
                              비공개 표시
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section
              className={cn(
                "min-w-0",
                !selectedFolder && "hidden lg:block"
              )}
              aria-label="폴더 상세"
            >
              {!selectedFolder ? (
                <div className="flex min-h-[520px] flex-col items-center justify-center px-6 text-center">
                  <Folder className="size-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">폴더를 선택하세요.</p>
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                    연결된 업무와 미디어, 보고서 및 추가 작업이 여기에 표시됩니다.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-4 sm:px-5">
                    <div className="flex min-w-0 items-start gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => selectFolder("")}
                        aria-label="폴더 목록으로"
                      >
                        <ArrowLeft />
                      </Button>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-lg font-semibold">{selectedFolder.name}</h2>
                          <Badge variant="outline">
                            {selectedFolder.visibility === "private" ? "비공개 표시" : "조직 공유"}
                          </Badge>
                          {selectedFolder.status === "archived" && (
                            <Badge variant="secondary">보관됨</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {FOLDER_TYPE_LABELS[selectedFolder.type]} · 최근 변경 {formatDate(selectedFolder.updatedAt)}
                        </p>
                        {selectedFolder.visibility === "private" && (
                          <p className="mt-2 max-w-xl text-xs text-warning-foreground">
                            이 폴더에는 비공개 값이 저장되어 있지만, 현재 API는 생성자만 보는 개인별 접근 제한을 강제하지 않습니다.
                          </p>
                        )}
                        {selectedFolder.status === "archived" && (
                          <p className="mt-2 max-w-xl text-xs text-muted-foreground">
                            보관된 폴더입니다. 연결된 증빙 원본은 삭제되지 않으며 이 화면에서 계속 확인할 수 있습니다.
                          </p>
                        )}
                      </div>
                    </div>
                    {selectedFolder.status === "active" && (
                      <Button
                        variant="outline"
                        disabled={busy === "archive"}
                        onClick={() => void archiveFolder()}
                      >
                        <Archive /> 폴더 보관
                      </Button>
                    )}
                  </div>

                  <Tabs defaultValue="items" className="px-4 py-5 sm:px-5">
                    <TabsList>
                      <TabsTrigger value="items">연결 항목 {selectedItems.length}</TabsTrigger>
                      <TabsTrigger value="tasks" disabled={selectedFolder.status === "archived"}>
                        업무 추가
                      </TabsTrigger>
                      <TabsTrigger value="media" disabled={selectedFolder.status === "archived"}>
                        미디어 찾기
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="items" className="mt-4">
                      {folderItemsLoading ? (
                        <FolderListSkeleton />
                      ) : selectedItems.length === 0 ? (
                        <div className="rounded-md border border-dashed px-5 py-14 text-center">
                          <Link2 className="mx-auto size-6 text-muted-foreground" />
                          <p className="mt-3 text-sm font-medium">연결된 항목이 없습니다.</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            업무 또는 미디어를 추가하면 이 폴더에서 함께 확인할 수 있습니다.
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y border-y">
                          {selectedItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 py-3">
                              <Thumbnail
                                item={{
                                  title: item.title || item.itemId,
                                  thumbnail: item.thumbnail,
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="truncate text-sm font-medium">
                                    {item.title || `${itemTypeLabel(item.itemType)} ${item.itemId.slice(0, 8)}`}
                                  </span>
                                  <Badge variant="secondary">{itemTypeLabel(item.itemType)}</Badge>
                                </div>
                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                  {item.description || sourceLabel(item.source)} · {formatDate(item.addedAt)}
                                </p>
                              </div>
                              {item.itemType === "task" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={onOpenTask}
                                  aria-label="업무 상세 열기"
                                >
                                  <ExternalLink />
                                </Button>
                              )}
                              {selectedFolder.status === "active" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={busy === `remove-${item.id}`}
                                  onClick={() => void removeItem(item)}
                                  aria-label="폴더에서 제거"
                                >
                                  <Trash2 />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="tasks" className="mt-4">
                      <div className="relative">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={taskSearch}
                          onChange={(event) => setTaskSearch(event.target.value)}
                          placeholder="업무명, 유형 또는 현장 검색"
                          className="pl-9"
                        />
                      </div>
                      <div className="mt-3 divide-y border-y">
                        {visibleTaskCandidates.length === 0 ? (
                          <p className="py-10 text-center text-sm text-muted-foreground">
                            추가할 업무가 없습니다.
                          </p>
                        ) : (
                          visibleTaskCandidates.map((candidate) => (
                            <div key={candidate.id} className="flex items-center gap-3 py-3">
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-sidebar">
                                <Folder className="size-4" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium">{candidate.title}</div>
                                <div className="mt-1 truncate text-xs text-muted-foreground">
                                  {candidate.description}
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busy === `add-${candidate.id}`}
                                onClick={() => void addCandidate(candidate)}
                              >
                                <Plus /> 추가
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="media" className="mt-4">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="relative">
                          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={mediaQuery}
                            onChange={(event) => setMediaQuery(event.target.value)}
                            placeholder="미디어 내용 검색"
                            className="pl-9"
                          />
                        </div>
                        <div className="relative">
                          <Link2 className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={mediaReference}
                            onChange={(event) => setMediaReference(event.target.value)}
                            placeholder="컨테이너·거래 참조번호"
                            className="pl-9"
                          />
                        </div>
                      </div>
                      <Button
                        className="mt-3"
                        variant="outline"
                        disabled={
                          busy === "media-search" ||
                          (!mediaQuery.trim() && !mediaReference.trim())
                        }
                        onClick={() => void searchMedia()}
                      >
                        <Search /> 라이브러리 검색
                      </Button>
                      <div className="mt-3 divide-y border-y">
                        {!mediaSearched ? (
                          <div className="py-12 text-center">
                            <FileImage className="mx-auto size-6 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">
                              검색어나 참조번호로 조직 미디어를 찾으세요.
                            </p>
                          </div>
                        ) : mediaCandidates.length === 0 ? (
                          <p className="py-10 text-center text-sm text-muted-foreground">
                            일치하는 미디어가 없습니다.
                          </p>
                        ) : (
                          mediaCandidates.map((candidate) => (
                            <div key={candidate.id} className="flex items-center gap-3 py-3">
                              <Thumbnail item={candidate} />
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium">{candidate.title}</div>
                                <div className="mt-1 truncate text-xs text-muted-foreground">
                                  {candidate.description}
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={busy === `add-${candidate.id}`}
                                onClick={() => void addCandidate(candidate)}
                              >
                                <FolderPlus /> 담기
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>폴더 만들기</DialogTitle>
            <DialogDescription>
              원본 자료를 옮기지 않고 업무와 미디어를 묶는 폴더를 만듭니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <label className="grid gap-2 text-sm font-medium">
              폴더 이름
              <Input
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                placeholder="예: 8월 부산 CY 선적"
                autoFocus
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              폴더 유형
              <Select
                value={createType}
                onValueChange={(value) => setCreateType(value as FolderType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOLDER_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {FOLDER_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              공개 범위
              <Select
                value={createVisibility}
                onValueChange={(value) =>
                  setCreateVisibility(value as FolderVisibility)
                }
              >
                <SelectTrigger aria-label="공개 범위">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="organization">조직 공유</SelectItem>
                  <SelectItem value="private">비공개</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              취소
            </Button>
            <Button
              disabled={!createName.trim() || busy === "create"}
              onClick={() => void createFolder()}
            >
              <FolderPlus /> 폴더 만들기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

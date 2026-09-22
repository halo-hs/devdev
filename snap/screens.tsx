import { CommonPublicLayout } from "@auth/layout"
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from "react"
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Database,
  Download,
  Eye,
  EyeOff,
  FileCheck2,
  FileImage,
  FileText,
  LayoutDashboard,
  Link2,
  LockKeyhole,
  MapPin,
  MessageSquareWarning,
  PartyPopper,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  UserPlus,
  Users,
  Workflow,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@shared/components/ui/badge"
import { Button } from "@shared/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/components/ui/card"
import { Checkbox } from "@shared/components/ui/checkbox"
import { Input } from "@shared/components/ui/input"
import { Progress } from "@shared/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select"
import { Separator } from "@shared/components/ui/separator"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs"
import { Textarea } from "@shared/components/ui/textarea"
import {
  demoPreSendCheck,
  demoShareLink,
  snapApiErrorMessage,
  snapApiConfigured,
  snapReportApi,
  SnapApiError,
  type DeliveryChannel,
  type EvidenceIntegrityView,
  type PreSendCheck,
  type PublicActionLinkView,
  type PublicCustomerView,
  type PublicDisputeStatus,
  type PublicWorkerChecklistItem,
  type ShareLinkLifecycle,
  type SnapJsonRecord,
} from "@snap/lib/snap-report-api"
import { snapApi } from "@snap/lib/snap-api"
import { resetSnapSessionAccessCache } from "@snap/lib/snap-route-access"
import { cn } from "@shared/lib/utils"
import cargoOperationsBanner from "@/assets/home/cargo-operations-banner.jpg"
import { SnapCustomersPage } from "@snap/customers/page"
import { SnapPlatformPages } from "@snap/settings/pages"
import { SnapEvidenceLibrary } from "@snap/evidence/page"
import {
  SnapOperationsPage,
  type SnapNavigationOptions,
} from "@snap/operations/pages"
import { SnapReportsPage } from "@snap/reports/page"
import { SnapTaskWorkspace } from "@snap/tasks/workspace"
import { SnapWorkersPage } from "@snap/workers/page"

export type SnapScreenKey =
  | "SC-01"
  | "SC-02"
  | "SC-03"
  | "SC-04"
  | "SC-05"
  | "SC-06"
  | "SC-07"
  | "SC-08"
  | "SC-09"
  | "SC-10"
  | "SC-11"
  | "SC-12"
  | "SC-13"
  | "SC-14"
  | "SC-15"
  | "SC-16"
  | "SC-17"
  | "SC-18"
  | "SC-19"
  | "SC-20"
  | "SC-21"
  | "SC-22"
  | "SC-23"
  | "SC-24"
  | "SC-25"
  | "SC-26"
  | "SC-27"
  | "SC-28"
  | "SC-29"
  | "SC-30"
  | "SC-31"
  | "SC-32"
  | "SC-33"
  | "SC-34"
  | "SC-35"
  | "SC-36"
  | "SC-37"
  | "SC-38"
  | "SC-39"
  | "SC-40"
  | "SC-41"
  | "SC-42"
  | "SC-43"
  | "SC-44"
  | "SC-45"

type SnapGroup = "public" | "link" | "manager" | "platform" | "mobile"
type Tone = "neutral" | "blue" | "green" | "amber" | "red"

function asSnapRecord(value: unknown): SnapJsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as SnapJsonRecord)
    : null
}

function snapRecordArray(value: unknown): SnapJsonRecord[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => asSnapRecord(item))
      .filter((item): item is SnapJsonRecord => Boolean(item))
  }
  const record = asSnapRecord(value)
  const items = record?.items
  return Array.isArray(items) ? snapRecordArray(items) : []
}

function snapString(record: SnapJsonRecord | null, ...keys: string[]) {
  for (const key of keys) {
    const value = record?.[key]
    if (typeof value === "string" && value.trim()) return value
    if (typeof value === "number") return String(value)
  }
  return ""
}

function snapReportSections(value: unknown): SnapJsonRecord {
  const root = asSnapRecord(value)
  const direct = asSnapRecord(root?.sections)
  if (direct) return direct

  const versions = snapRecordArray(root?.versions)
  const latest = versions.at(-1)
  const content = asSnapRecord(latest?.content)
  return asSnapRecord(content?.sections) ?? {}
}

function snapReportStatus(value: string) {
  if (["approved", "sent", "published"].includes(value)) return "approved"
  if (["rejected", "changes_requested"].includes(value)) return "rejected"
  return "review"
}

type ScreenDefinition = {
  key: SnapScreenKey
  label: string
  group: SnapGroup
  audience: string
}

const SCREEN_DEFINITIONS: ScreenDefinition[] = [
  { key: "SC-01", label: "랜딩", group: "public", audience: "방문자" },
  { key: "SC-02", label: "요금제", group: "public", audience: "구매 검토자" },
  { key: "SC-03", label: "이용약관", group: "public", audience: "모든 사용자" },
  {
    key: "SC-04",
    label: "개인정보처리방침",
    group: "public",
    audience: "모든 사용자",
  },
  {
    key: "SC-45",
    label: "위치기반 서비스 이용약관",
    group: "public",
    audience: "모든 사용자",
  },
  { key: "SC-05", label: "가입", group: "public", audience: "신규 사용자" },
  { key: "SC-06", label: "로그인", group: "public", audience: "기존 사용자" },
  {
    key: "SC-07",
    label: "조직 승인 대기",
    group: "public",
    audience: "신규 조직",
  },
  {
    key: "SC-08",
    label: "합류 승인 대기",
    group: "public",
    audience: "초대 사용자",
  },
  {
    key: "SC-09",
    label: "가입 거절",
    group: "public",
    audience: "거절 사용자",
  },
  { key: "SC-10", label: "온보딩", group: "public", audience: "조직 관리자" },
  {
    key: "SC-11",
    label: "초대 수락",
    group: "public",
    audience: "초대 사용자",
  },
  {
    key: "SC-12",
    label: "작업자 실행 링크",
    group: "link",
    audience: "링크 작업자",
  },
  {
    key: "SC-13",
    label: "외부 업로드",
    group: "link",
    audience: "외부 협력자",
  },
  {
    key: "SC-14",
    label: "고객 리포트",
    group: "link",
    audience: "고객·수신자",
  },
  { key: "SC-15", label: "증거 검증", group: "link", audience: "검증자" },
  {
    key: "SC-16",
    label: "리포트 미리보기",
    group: "link",
    audience: "개발·QA",
  },
  { key: "SC-17", label: "대시보드", group: "manager", audience: "매니저" },
  { key: "SC-18", label: "작업 목록", group: "manager", audience: "매니저" },
  { key: "SC-19", label: "작업 생성", group: "manager", audience: "매니저" },
  { key: "SC-20", label: "작업 상세", group: "manager", audience: "매니저" },
  {
    key: "SC-21",
    label: "고객 리포트 작성",
    group: "manager",
    audience: "매니저",
  },
  { key: "SC-22", label: "보고서", group: "manager", audience: "매니저" },
  { key: "SC-23", label: "증거 보관함", group: "manager", audience: "매니저" },
  {
    key: "SC-24",
    label: "고객 디렉터리",
    group: "manager",
    audience: "매니저·관리자",
  },
  { key: "SC-25", label: "캘린더", group: "manager", audience: "매니저" },
  { key: "SC-26", label: "워크플로", group: "manager", audience: "매니저" },
  { key: "SC-27", label: "ERP 인계", group: "manager", audience: "매니저" },
  {
    key: "SC-28",
    label: "작업자",
    group: "manager",
    audience: "관리자·오너",
  },
  {
    key: "SC-29",
    label: "시정조치",
    group: "manager",
    audience: "매니저·관리자",
  },
  { key: "SC-30", label: "설정", group: "manager", audience: "관리자·오너" },
  {
    key: "SC-31",
    label: "플랫폼 개요",
    group: "platform",
    audience: "ECOYA 운영자",
  },
  {
    key: "SC-32",
    label: "가입 승인",
    group: "platform",
    audience: "ECOYA 운영자",
  },
  {
    key: "SC-33",
    label: "테넌트 디렉터리",
    group: "platform",
    audience: "ECOYA 운영자",
  },
  {
    key: "SC-34",
    label: "테넌트 지원",
    group: "platform",
    audience: "ECOYA 운영자",
  },
  {
    key: "SC-35",
    label: "외부 연동",
    group: "platform",
    audience: "ECOYA 운영자",
  },
  {
    key: "SC-36",
    label: "AI 콘솔",
    group: "platform",
    audience: "ECOYA 운영자",
  },
  {
    key: "SC-37",
    label: "모바일 역할 게이트",
    group: "mobile",
    audience: "worker·manager",
  },
  {
    key: "SC-38",
    label: "캡처 우선",
    group: "mobile",
    audience: "현장 사용자",
  },
  { key: "SC-39", label: "작업자 작업", group: "mobile", audience: "worker" },
  { key: "SC-40", label: "작업자 상세", group: "mobile", audience: "worker" },
  {
    key: "SC-41",
    label: "작업자 현장 시작",
    group: "mobile",
    audience: "worker",
  },
  { key: "SC-42", label: "매니저 홈", group: "mobile", audience: "manager" },
  { key: "SC-43", label: "매니저 작업", group: "mobile", audience: "manager" },
  { key: "SC-44", label: "매니저 액션", group: "mobile", audience: "manager" },
]

const GROUP_LABELS: Record<SnapGroup, string> = {
  public: "공개·인증",
  link: "외부 링크",
  manager: "관리자 운영",
  platform: "플랫폼 운영",
  mobile: "모바일 App",
}

const toneClasses: Record<Tone, string> = {
  neutral: "ui-status-neutral",
  blue: "ui-status-info",
  green: "ui-status-success",
  amber: "ui-status-warning",
  red: "ui-status-danger",
}

function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode
  tone?: Tone
}) {
  return (
    <Badge className={cn("font-medium", toneClasses[tone])}>{children}</Badge>
  )
}

function ScreenHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-1 text-xs font-semibold text-primary">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="text-2xl font-bold tracking-normal">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? (
        <div className="flex shrink-0 flex-wrap gap-2">{action}</div>
      ) : null}
    </div>
  )
}

function MetricStrip({
  items,
}: {
  items: Array<{ label: string; value: string; note?: string; tone?: Tone }>
}) {
  const columnsClass =
    items.length === 2
      ? "sm:grid-cols-2 lg:grid-cols-2"
      : items.length === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-4"

  return (
    <div
      className={`grid overflow-hidden rounded-xl border bg-card ${columnsClass}`}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-0 border-b p-4 last:border-b-0 sm:border-r lg:border-b-0"
        >
          <div className="text-xs text-muted-foreground">{item.label}</div>
          <div className="mt-2 flex items-end justify-between gap-2">
            <strong className="truncate text-xl font-semibold">
              {item.value}
            </strong>
            {item.note ? (
              <StatusBadge tone={item.tone}>{item.note}</StatusBadge>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

function StateBanner({
  tone,
  title,
  description,
  action,
}: {
  tone: "info" | "success" | "warning" | "danger"
  title: string
  description: string
  action?: ReactNode
}) {
  const styles = {
    info: "ui-status-info",
    success: "ui-status-success",
    warning: "ui-status-warning",
    danger: "ui-status-danger",
  }
  const Icon =
    tone === "success"
      ? CheckCircle2
      : tone === "danger"
        ? ShieldAlert
        : AlertTriangle
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center",
        styles[tone]
      )}
    >
      <Icon className="size-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{title}</div>
        <p className="mt-0.5 text-xs leading-5 opacity-80">{description}</p>
      </div>
      {action}
    </div>
  )
}

function ScreenTabs({
  group,
  active,
  onSelect,
}: {
  group: SnapGroup
  active: SnapScreenKey
  onSelect: (key: SnapScreenKey) => void
}) {
  const screens = SCREEN_DEFINITIONS.filter((screen) => screen.group === group)
  return (
    <div className="field-scrollbar flex gap-1 overflow-x-auto border-b bg-background px-3 py-2 sm:px-5">
      {screens.map((screen) => (
        <Button
          key={screen.key}
          type="button"
          size="sm"
          variant={screen.key === active ? "secondary" : "ghost"}
          className="shrink-0"
          onClick={() => onSelect(screen.key)}
        >
          <span className="text-xs text-muted-foreground">{screen.key}</span>
          {screen.label}
        </Button>
      ))}
    </div>
  )
}

function SnapPublicBrand({
  onClick,
  inverse = false,
}: {
  onClick: () => void
  inverse?: boolean
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2.5 text-left"
      onClick={onClick}
      aria-label="ECOYA SNAP 홈"
    >
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-[var(--r-md)]",
          inverse
            ? "bg-white/12 text-white ring-1 ring-white/20"
            : "bg-primary text-primary-foreground"
        )}
      >
        <Camera className="size-4.5" />
      </span>
      <span>
        <span
          className={cn(
            "block text-sm font-bold tracking-[-0.01em]",
            inverse && "text-white"
          )}
        >
          ECOYA SNAP
        </span>
        <span
          className={cn(
            "block text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase",
            inverse && "text-white/60"
          )}
        >
          Field evidence workspace
        </span>
      </span>
    </button>
  )
}

function SnapPublicHeader({
  navigate,
  current,
}: {
  navigate: (screen: SnapScreenKey) => void
  current?: SnapScreenKey
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--surface-border)] bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-5 sm:px-8">
        <SnapPublicBrand onClick={() => navigate("SC-01")} />
        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="공개 페이지">
          <Button variant="ghost" size="sm" onClick={() => navigate("SC-01")}>
            서비스
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("SC-02")}>
            요금제
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("SC-03")}>
            이용 안내
          </Button>
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-3">
          {current !== "SC-06" ? (
            <Button variant="ghost" size="sm" onClick={() => navigate("SC-06")}>
              로그인
            </Button>
          ) : null}
          {current !== "SC-05" ? (
            <Button size="sm" onClick={() => navigate("SC-05")}>
              무료로 시작
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  )
}

function SnapPublicFooter({
  navigate,
}: {
  navigate: (screen: SnapScreenKey) => void
}) {
  return (
    <footer className="border-t border-[var(--surface-border)] bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span>© 2026 ECOYA. All rights reserved.</span>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="법적 고지">
          <button type="button" onClick={() => navigate("SC-03")}>
            이용약관
          </button>
          <button type="button" onClick={() => navigate("SC-04")}>
            개인정보처리방침
          </button>
          <button type="button" onClick={() => navigate("SC-45")}>
            위치기반 서비스 이용약관
          </button>
        </nav>
      </div>
    </footer>
  )
}

function SnapAuthVisual({
  signup,
  navigate,
}: {
  signup: boolean
  navigate: (screen: SnapScreenKey) => void
}) {
  return (
    <aside className="relative hidden min-h-[660px] overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between">
      <img
        src={cargoOperationsBanner}
        alt="항만에서 이동 중인 컨테이너 선박"
        className="absolute inset-0 size-full object-cover opacity-45 mix-blend-luminosity"
      />
      <div className="absolute inset-0 bg-primary/72" aria-hidden="true" />
      <div className="relative z-10 p-10 xl:p-14">
        <SnapPublicBrand inverse onClick={() => navigate("SC-01")} />
        <div className="mt-20 max-w-lg text-white">
          <p className="text-xs font-semibold tracking-[0.16em] text-white/65 uppercase">
            Capture · Review · Share
          </p>
          <h1 className="mt-4 text-4xl leading-[1.2] font-semibold tracking-[-0.035em]">
            {signup
              ? "현장 기록이 곧바로 확인 가능한 증빙이 됩니다."
              : "찍는 순간부터 고객 전달까지, 증빙 업무를 한곳에서."}
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/72">
            사진·영상의 촬영 정보와 작업 맥락을 보존하고, 팀 검토를 거쳐 고객에게 전달할 보고서로 정리합니다.
          </p>
        </div>
      </div>
      <div className="relative z-10 grid grid-cols-3 border-t border-white/15 bg-black/10">
        {[
          ["01", "현장 기록"],
          ["02", "팀 검토"],
          ["03", "보고서 전달"],
        ].map(([number, label]) => (
          <div key={number} className="border-r border-white/15 px-6 py-5 last:border-r-0">
            <div className="text-[10px] font-semibold text-white/45">{number}</div>
            <div className="mt-1 text-sm font-medium text-white">{label}</div>
          </div>
        ))}
      </div>
    </aside>
  )
}

type LegalScreen = "SC-03" | "SC-04" | "SC-45"

const SNAP_LEGAL_DOCUMENTS: Record<
  LegalScreen,
  {
    title: string
    summary: string
    sections: Array<{ title: string; paragraphs: string[] }>
  }
> = {
  "SC-03": {
    title: "이용약관",
    summary:
      "ECOYA SNAP 계정, 조직 워크스페이스, 현장 증빙 및 보고서 기능의 이용 기준입니다.",
    sections: [
      {
        title: "제1조 목적과 적용 범위",
        paragraphs: [
          "본 약관은 ECOYA가 제공하는 ECOYA SNAP 서비스의 이용 조건과 회사 및 이용자의 권리·의무를 정합니다.",
          "조직 관리자가 구성원을 초대하거나 외부 작업 링크를 발급한 경우에도 본 약관과 조직의 내부 정책이 함께 적용됩니다.",
        ],
      },
      {
        title: "제2조 계정과 조직",
        paragraphs: [
          "이용자는 정확한 정보를 사용해 계정을 생성하고 로그인 정보를 안전하게 관리해야 합니다. 조직 관리자는 구성원의 권한과 접근 범위를 관리합니다.",
        ],
      },
      {
        title: "제3조 현장 증빙과 보고서",
        paragraphs: [
          "서비스는 사진, 영상, 위치, 촬영 시각, 메모 및 검토 이력을 작업 단위로 관리합니다. 이용자는 업로드한 자료를 사용할 정당한 권한을 보유해야 합니다.",
          "AI가 제안한 분류나 요약은 사람의 확인을 보조하며, 최종 보고서의 정확성은 확정 전에 이용자가 검토해야 합니다.",
        ],
      },
      {
        title: "제4조 요금과 서비스 변경",
        paragraphs: [
          "유료 기능의 요금, 제공량 및 결제 주기는 요금제 화면과 결제 단계에 표시합니다. 중요한 변경은 적용 전에 안내합니다.",
        ],
      },
      {
        title: "제5조 이용 제한과 책임",
        paragraphs: [
          "타인의 권리를 침해하거나 불법적인 자료를 저장·공유하는 행위, 서비스의 안정성을 해치는 행위는 제한될 수 있습니다.",
        ],
      },
    ],
  },
  "SC-04": {
    title: "개인정보처리방침",
    summary:
      "ECOYA SNAP을 이용할 때 처리되는 개인정보와 이용자의 권리를 안내합니다.",
    sections: [
      {
        title: "1. 처리하는 개인정보",
        paragraphs: [
          "계정 생성 시 이름, 업무 이메일, 조직 정보와 인증 기록을 처리합니다. 서비스 이용 과정에서 작업 정보, 접속 기록, 기기 정보, 고객지원 내역이 생성될 수 있습니다.",
          "위치 기능을 사용하는 작업에서는 이용자의 선택과 권한 설정에 따라 위치정보가 현장 증빙에 포함될 수 있습니다.",
        ],
      },
      {
        title: "2. 처리 목적",
        paragraphs: [
          "계정과 조직 관리, 현장 작업 기록, 보고서 생성과 전달, 보안 및 장애 대응, 고객지원과 서비스 개선을 위해 필요한 범위에서 정보를 처리합니다.",
        ],
      },
      {
        title: "3. 보유 및 삭제",
        paragraphs: [
          "개인정보는 이용 목적이 달성되거나 보유 기간이 끝나면 지체 없이 삭제합니다. 관계 법령이나 조직의 증빙 보존 정책에 따라 별도 보관이 필요한 경우에는 분리하여 관리합니다.",
        ],
      },
      {
        title: "4. 제공 및 처리 위탁",
        paragraphs: [
          "서비스 제공에 필요한 인프라, 메시지 발송, 결제 등의 업무를 전문 사업자에게 위탁할 수 있으며 수탁자와 처리 목적은 공개된 정책에서 안내합니다.",
        ],
      },
      {
        title: "5. 이용자의 권리",
        paragraphs: [
          "이용자는 자신의 개인정보를 조회·정정·삭제하거나 처리 정지를 요청할 수 있습니다. 조직이 관리하는 업무 자료는 조직 정책과 법적 보존 의무가 함께 적용될 수 있습니다.",
        ],
      },
    ],
  },
  "SC-45": {
    title: "위치기반 서비스 이용약관",
    summary:
      "현장 증빙에 위치정보를 포함하는 경우의 이용 조건과 보호 기준입니다.",
    sections: [
      {
        title: "제1조 목적",
        paragraphs: [
          "본 약관은 ECOYA SNAP의 위치기반 기능을 이용할 때 회사와 개인위치정보주체의 권리·의무를 정합니다.",
        ],
      },
      {
        title: "제2조 제공하는 기능",
        paragraphs: [
          "이용자가 허용한 경우 현장 사진과 작업 기록에 촬영 위치를 연결하고, 지정 작업 장소와 실제 기록 위치를 확인하는 기능을 제공합니다.",
        ],
      },
      {
        title: "제3조 위치정보의 이용과 보유",
        paragraphs: [
          "위치정보는 현장 증빙의 진위와 작업 수행 여부를 확인하기 위한 범위에서 이용합니다. 관련 기록은 법령 및 조직의 보존 정책에 따른 기간 동안 보호 조치와 함께 보관합니다.",
        ],
      },
      {
        title: "제4조 이용자의 통제",
        paragraphs: [
          "이용자는 기기 설정에서 위치 권한을 변경할 수 있습니다. 다만 위치가 필수인 작업에서는 일부 증빙 기능의 사용이 제한될 수 있습니다.",
        ],
      },
      {
        title: "제5조 문의와 권리 행사",
        paragraphs: [
          "위치정보 이용 내역의 확인, 동의 철회 또는 보호 조치에 관한 문의는 고객지원 채널을 통해 요청할 수 있습니다.",
        ],
      },
    ],
  },
}

function PublicPrototype({ screen, navigate, routeParams }: PrototypeScreenProps) {
  const [loginEmail, setLoginEmail] = useState("ecoya@ecoya.kr")
  const [loginPassword, setLoginPassword] = useState("ecoya")
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [loginBusy, setLoginBusy] = useState(false)
  const [rememberLogin, setRememberLogin] = useState(true)
  const [signupForm, setSignupForm] = useState({
    organization: "",
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  })
  const [signupAgreement, setSignupAgreement] = useState({
    terms: false,
    privacy: false,
    location: false,
  })
  const [signupError, setSignupError] = useState("")
  const [signupBusy, setSignupBusy] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [onboardingBasic, setOnboardingBasic] = useState({
    country: "KR",
    language: "ko",
    timezone: "Asia/Seoul",
    companySize: "51 - 200",
    industry: "other",
  })
  const [onboardingInvites, setOnboardingInvites] = useState([
    { email: "", role: "worker" },
  ])
  const [onboardingPrimary, setOnboardingPrimary] = useState(
    "site_visit_field_report"
  )
  const [onboardingSecondary, setOnboardingSecondary] = useState<string[]>([])
  const [onboardingInviteResult, setOnboardingInviteResult] = useState({
    sent: 0,
    failed: 0,
  })
  const [market, setMarket] = useState("KR")
  const inviteToken = routeParams?.token
  const [inviteData, setInviteData] = useState<SnapJsonRecord | null>(null)
  const [inviteState, setInviteState] = useState<
    "idle" | "loading" | "ready" | "accepted" | "expired" | "error"
  >("idle")
  const [inviteError, setInviteError] = useState("")
  const [inviteBusy, setInviteBusy] = useState(false)

  const submitLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loginBusy) return
    setLoginError("")

    if (
      loginEmail.trim().toLowerCase() !== "ecoya@ecoya.kr" ||
      loginPassword !== "ecoya"
    ) {
      setLoginError("이메일 또는 비밀번호가 일치하지 않습니다.")
      return
    }

    setLoginBusy(true)
    window.setTimeout(() => {
      try {
        const session = JSON.stringify({
          authenticated: true,
          role: "manager",
          email: "ecoya@ecoya.kr",
          organization: "ECOYA Demo Co.",
        })
        window.localStorage.setItem("snap_web_session", session)
        if (rememberLogin) {
          window.localStorage.setItem("snap_remember_login", "true")
        } else {
          window.localStorage.removeItem("snap_remember_login")
        }
      } catch {
        // The current browser session can still continue when storage is blocked.
      }
      resetSnapSessionAccessCache()
      setLoginBusy(false)
      toast.success("ECOYA SNAP에 로그인했습니다.")
      navigate("SC-17")
    }, 360)
  }

  const submitSignup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (signupBusy) return
    setSignupError("")

    const requiredValues = [
      signupForm.organization,
      signupForm.name,
      signupForm.email,
      signupForm.password,
      signupForm.passwordConfirm,
    ]
    if (requiredValues.some((value) => !value.trim())) {
      setSignupError("필수 정보를 모두 입력해 주세요.")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupForm.email.trim())) {
      setSignupError("올바른 업무 이메일을 입력해 주세요.")
      return
    }
    if (signupForm.password.length < 8) {
      setSignupError("비밀번호는 8자 이상으로 입력해 주세요.")
      return
    }
    if (signupForm.password !== signupForm.passwordConfirm) {
      setSignupError("비밀번호가 서로 일치하지 않습니다.")
      return
    }
    if (!signupAgreement.terms || !signupAgreement.privacy) {
      setSignupError("이용약관과 개인정보처리방침에 동의해 주세요.")
      return
    }

    setSignupBusy(true)
    window.setTimeout(() => {
      setSignupBusy(false)
      toast.success("가입 신청을 접수했습니다.")
      navigate("SC-07")
    }, 420)
  }

  useEffect(() => {
    if (screen !== "SC-11") return
    let cancelled = false
    void (async () => {
      await Promise.resolve()
      if (cancelled) return
      if (!snapApiConfigured) {
        setInviteState("ready")
        return
      }
      if (!inviteToken) {
        setInviteState("error")
        setInviteError(
          "초대 토큰이 없습니다. 초대 이메일의 전체 링크를 다시 열어 주세요."
        )
        return
      }

      setInviteState("loading")
      setInviteError("")
      try {
        const data = await snapApi.auth.invitePreview(inviteToken)
        if (cancelled) return
        setInviteData(data)
        setInviteState("ready")
      } catch (reason) {
        if (cancelled) return
        if (reason instanceof SnapApiError && reason.status === 410) {
          setInviteState("expired")
          return
        }
        setInviteState("error")
        setInviteError(snapApiErrorMessage(reason))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [inviteToken, screen])

  const acceptInvite = async () => {
    if (inviteBusy) return
    if (!snapApiConfigured) {
      navigate("SC-17")
      return
    }
    if (!inviteToken) return

    setInviteBusy(true)
    setInviteError("")
    try {
      await snapApi.auth.acceptInvite(inviteToken)
      setInviteState("accepted")
    } catch (reason) {
      setInviteError(snapApiErrorMessage(reason))
    } finally {
      setInviteBusy(false)
    }
  }

  if (screen === "SC-01") {
    return (
      <CommonPublicLayout>
        <main className="mx-auto w-full max-w-[1600px] flex-1 bg-background">
          <section className="grid min-h-[520px] items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-14">
            <div className="max-w-2xl">
              <StatusBadge tone="blue">현장 증거에서 고객 전달까지</StatusBadge>
              <h1 className="mt-5 text-4xl leading-tight font-semibold sm:text-5xl">
                확인 가능한 현장 기록을, 승인된 보고서로
              </h1>
              <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
                작업 지시, 현장 캡처, 사무 검토, 고객 전달을 하나의 추적 가능한
                흐름으로 연결합니다.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button onClick={() => navigate("SC-05")}>
                  조직 시작하기 <ArrowRight />
                </Button>
                <Button variant="outline" onClick={() => navigate("SC-02")}>
                  요금제 보기
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <button onClick={() => navigate("SC-03")}>이용약관</button>
                <button onClick={() => navigate("SC-04")}>
                  개인정보처리방침
                </button>
                <button onClick={() => navigate("SC-06")}>로그인</button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                [Camera, "현장 캡처", "사진·영상·위치와 촬영 시점을 기록"],
                [ClipboardCheck, "사람 검토", "AI 제안을 사람이 확인하고 승인"],
                [FileCheck2, "고객 보고서", "승인 버전과 증거를 고정해 발행"],
                [ShieldCheck, "검증 가능한 전달", "열람·수령 확인·이의제기 지원"],
              ].map(([Icon, title, description]) => (
                <Card key={String(title)} className="rounded-md shadow-none">
                  <CardHeader>
                    <Icon className="size-6 text-primary" />
                    <CardTitle className="text-base">{String(title)}</CardTitle>
                    <CardDescription>{String(description)}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>
        </main>
      </CommonPublicLayout>
    )
  }

  if (screen === "SC-02") {
    return (
      <CommonPublicLayout>
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8">
          <ScreenHeading
            eyebrow="SNAP 요금제"
            title="현장 운영 규모에 맞춰 시작하세요"
            description="표시 금액은 선택 시장의 현재 요금 API를 기준으로 갱신됩니다. 세금과 결제 통화는 결제 전 다시 확인합니다."
            action={
              <Select
                value={market}
                onValueChange={(value) => value && setMarket(value)}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KR">대한민국</SelectItem>
                  <SelectItem value="US">United States</SelectItem>
                </SelectContent>
              </Select>
            }
          />
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {[
              {
                name: "Starter",
                price: market === "KR" ? "월 59,000원" : "$49 / month",
                note: "소규모 현장 검증",
              },
              {
                name: "Team",
                price: market === "KR" ? "월 149,000원" : "$119 / month",
                note: "승인·리포트 운영",
                featured: true,
              },
              { name: "Business", price: "문의", note: "다조직·연동·지원" },
            ].map((plan) => (
              <Card
                key={plan.name}
                className={cn(
                  "rounded-md shadow-none",
                  plan.featured && "border-primary"
                )}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.featured ? (
                      <StatusBadge tone="blue">추천</StatusBadge>
                    ) : null}
                  </div>
                  <CardDescription>{plan.note}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{plan.price}</div>
                  <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                    <li>작업·증거 관리</li>
                    <li>사람 검토와 승인 이력</li>
                    <li>고객 공유 링크</li>
                  </ul>
                  <Button
                    className="mt-6 w-full"
                    variant={plan.featured ? "default" : "outline"}
                    onClick={() => navigate("SC-05")}
                  >
                    이 요금제로 시작
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </CommonPublicLayout>
    )
  }


  if (screen === "SC-03" || screen === "SC-04" || screen === "SC-45") {
    const legalScreen = screen as LegalScreen
    const document = SNAP_LEGAL_DOCUMENTS[legalScreen]
    const legalTabs: Array<{ key: LegalScreen; label: string }> = [
      { key: "SC-03", label: "이용약관" },
      { key: "SC-04", label: "개인정보처리방침" },
      { key: "SC-45", label: "위치기반 서비스" },
    ]
    return (
      <CommonPublicLayout>
        <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 sm:py-12">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold text-primary">LEGAL</div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em]">
              {document.title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {document.summary}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              최종 업데이트 2026.09.07
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-[var(--r-lg)] border border-[var(--surface-border)] bg-background">
            <div className="field-scrollbar flex overflow-x-auto border-b border-[var(--surface-border)] px-3 sm:px-5">
              {legalTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={cn(
                    "relative shrink-0 px-3 py-4 text-sm font-medium text-muted-foreground",
                    legalScreen === tab.key && "text-primary"
                  )}
                  onClick={() => navigate(tab.key)}
                >
                  {tab.label}
                  {legalScreen === tab.key ? (
                    <span className="absolute inset-x-3 bottom-0 h-0.5 bg-primary" />
                  ) : null}
                </button>
              ))}
            </div>
            <div className="grid lg:grid-cols-[240px_minmax(0,1fr)]">
              <aside className="hidden border-r border-[var(--surface-border)] p-6 lg:block">
                <div className="text-xs font-semibold text-muted-foreground">목차</div>
                <ol className="mt-4 space-y-3 text-sm">
                  {document.sections.map((section, index) => (
                    <li key={section.title} className="flex gap-2 text-muted-foreground">
                      <span className="w-5 shrink-0 text-xs tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span>{section.title}</span>
                    </li>
                  ))}
                </ol>
              </aside>
              <article className="max-w-4xl space-y-10 px-5 py-8 sm:px-10 sm:py-10">
                {document.sections.map((section) => (
                  <section key={section.title}>
                    <h2 className="text-lg font-semibold tracking-[-0.01em]">
                      {section.title}
                    </h2>
                    <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </section>
                ))}
                <div className="border-t border-[var(--surface-border)] pt-6 text-xs leading-5 text-muted-foreground">
                  약관 및 개인정보 관련 문의는 ECOYA 고객지원 채널로 접수할 수 있습니다.
                </div>
              </article>
            </div>
          </div>
        </main>
      </CommonPublicLayout>
    )
  }

  if (screen === "SC-05" || screen === "SC-06") {
    const signup = screen === "SC-05"
    return (
      <div className="flex min-h-svh flex-col bg-[var(--surface-muted-background)]">
        <SnapPublicHeader navigate={navigate} current={screen} />
        <main className="mx-auto grid w-full max-w-7xl flex-1 overflow-hidden border-x border-[var(--surface-border)] bg-background lg:grid-cols-[0.92fr_1.08fr]">
          <SnapAuthVisual signup={signup} navigate={navigate} />
          <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-14 xl:px-20">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <div className="text-xs font-semibold text-primary">
                  {signup ? "START ECOYA SNAP" : "WELCOME BACK"}
                </div>
                <h1 className="mt-2 text-3xl font-bold tracking-[-0.035em]">
                  {signup ? "조직 계정 만들기" : "로그인"}
                </h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {signup
                    ? "조직과 관리자 정보를 입력하면 가입 신청을 시작합니다."
                    : "업무 이메일로 ECOYA SNAP 워크스페이스에 접속하세요."}
                </p>
              </div>

              {signup ? (
                <form className="space-y-4" onSubmit={submitSignup} noValidate>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm font-medium sm:col-span-2">
                      조직명
                      <Input
                        autoComplete="organization"
                        placeholder="회사 또는 팀 이름"
                        value={signupForm.organization}
                        onChange={(event) =>
                          setSignupForm((current) => ({
                            ...current,
                            organization: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium">
                      이름
                      <Input
                        autoComplete="name"
                        placeholder="이름"
                        value={signupForm.name}
                        onChange={(event) =>
                          setSignupForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium">
                      업무 이메일
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="name@company.com"
                        value={signupForm.email}
                        onChange={(event) =>
                          setSignupForm((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium">
                      비밀번호
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder="8자 이상"
                        value={signupForm.password}
                        onChange={(event) =>
                          setSignupForm((current) => ({
                            ...current,
                            password: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium">
                      비밀번호 확인
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder="다시 입력"
                        value={signupForm.passwordConfirm}
                        onChange={(event) =>
                          setSignupForm((current) => ({
                            ...current,
                            passwordConfirm: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div className="space-y-3 border-y border-[var(--surface-border)] py-4">
                    <label className="flex items-start gap-2.5 text-sm">
                      <Checkbox
                        className="mt-0.5"
                        checked={signupAgreement.terms}
                        onCheckedChange={(checked) =>
                          setSignupAgreement((current) => ({
                            ...current,
                            terms: checked === true,
                          }))
                        }
                      />
                      <span className="min-w-0 flex-1">
                        <button
                          type="button"
                          className="font-medium text-primary underline-offset-4 hover:underline"
                          onClick={() => navigate("SC-03")}
                        >
                          이용약관
                        </button>
                        에 동의합니다. <span className="text-destructive">(필수)</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-2.5 text-sm">
                      <Checkbox
                        className="mt-0.5"
                        checked={signupAgreement.privacy}
                        onCheckedChange={(checked) =>
                          setSignupAgreement((current) => ({
                            ...current,
                            privacy: checked === true,
                          }))
                        }
                      />
                      <span className="min-w-0 flex-1">
                        <button
                          type="button"
                          className="font-medium text-primary underline-offset-4 hover:underline"
                          onClick={() => navigate("SC-04")}
                        >
                          개인정보처리방침
                        </button>
                        에 동의합니다. <span className="text-destructive">(필수)</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-2.5 text-sm">
                      <Checkbox
                        className="mt-0.5"
                        checked={signupAgreement.location}
                        onCheckedChange={(checked) =>
                          setSignupAgreement((current) => ({
                            ...current,
                            location: checked === true,
                          }))
                        }
                      />
                      <span className="min-w-0 flex-1">
                        <button
                          type="button"
                          className="font-medium text-primary underline-offset-4 hover:underline"
                          onClick={() => navigate("SC-45")}
                        >
                          위치기반 서비스 이용약관
                        </button>
                        에 동의합니다. (선택)
                      </span>
                    </label>
                  </div>

                  {signupError ? (
                    <p className="text-sm text-destructive" role="alert">
                      {signupError}
                    </p>
                  ) : null}
                  <Button className="w-full" type="submit" disabled={signupBusy}>
                    {signupBusy ? "가입 신청 중..." : "가입 신청"}
                    {!signupBusy ? <ArrowRight data-icon="inline-end" /> : null}
                  </Button>
                </form>
              ) : (
                <form className="space-y-5" onSubmit={submitLogin} noValidate>
                  <label className="block space-y-2 text-sm font-medium">
                    업무 이메일
                    <Input
                      type="email"
                      inputMode="email"
                      autoComplete="username"
                      autoFocus
                      value={loginEmail}
                      onChange={(event) => setLoginEmail(event.target.value)}
                      aria-invalid={Boolean(loginError)}
                    />
                  </label>
                  <label className="block space-y-2 text-sm font-medium">
                    비밀번호
                    <span className="relative block">
                      <Input
                        type={showLoginPassword ? "text" : "password"}
                        autoComplete="current-password"
                        className="pr-11"
                        value={loginPassword}
                        onChange={(event) => setLoginPassword(event.target.value)}
                        aria-invalid={Boolean(loginError)}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                        aria-label={showLoginPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                        onClick={() => setShowLoginPassword((current) => !current)}
                      >
                        {showLoginPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </span>
                  </label>
                  <div className="flex items-center justify-between gap-4">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Checkbox
                        checked={rememberLogin}
                        onCheckedChange={(checked) => setRememberLogin(checked === true)}
                      />
                      로그인 유지
                    </label>
                    <span className="text-xs text-muted-foreground">PC 환경 권장</span>
                  </div>

                  {loginError ? (
                    <div
                      className="rounded-[var(--r-md)] border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
                      role="alert"
                      aria-live="polite"
                    >
                      {loginError}
                    </div>
                  ) : null}

                  <Button className="w-full" type="submit" disabled={loginBusy}>
                    {loginBusy ? "로그인 중..." : "이메일로 로그인"}
                    {!loginBusy ? <ArrowRight data-icon="inline-end" /> : null}
                  </Button>
                  <div className="rounded-[var(--r-md)] border border-[var(--surface-border)] bg-[var(--surface-muted-background)] px-3 py-3 text-xs leading-5 text-muted-foreground">
                    <div className="font-semibold text-foreground">데모 계정</div>
                    <div className="mt-1 font-mono">ecoya@ecoya.kr · ecoya</div>
                  </div>
                </form>
              )}

              <p className="mt-7 text-center text-sm text-muted-foreground">
                {signup ? "이미 계정이 있으신가요?" : "아직 계정이 없으신가요?"}{" "}
                <button
                  type="button"
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                  onClick={() => navigate(signup ? "SC-06" : "SC-05")}
                >
                  {signup ? "로그인" : "무료로 시작"}
                </button>
              </p>
            </div>
          </section>
        </main>
        <SnapPublicFooter navigate={navigate} />
      </div>
    )
  }

  if (["SC-07", "SC-08", "SC-09"].includes(screen)) {
    const rejected = screen === "SC-09"
    const join = screen === "SC-08"
    return (
      <div className="mx-auto flex min-h-[calc(100vh-108px)] w-full max-w-xl items-center px-5 py-10">
        <div className="w-full text-center">
          <div
            className={cn(
              "mx-auto flex size-12 items-center justify-center rounded-full",
              rejected ? "ui-status-danger" : "ui-status-warning"
            )}
          >
            {rejected ? <X /> : <Clock3 />}
          </div>
          <h1 className="mt-5 text-2xl font-semibold">
            {rejected
              ? "가입 신청이 승인되지 않았습니다"
              : join
                ? "조직 합류 승인을 기다리고 있습니다"
                : "조직 승인을 기다리고 있습니다"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {rejected
              ? "사유를 확인하고 잘못된 정보를 수정한 뒤 지원팀에 문의하세요."
              : "승인 상태는 이 화면에서 안전하게 갱신됩니다. 반복 로그인이나 재가입은 필요하지 않습니다."}
          </p>
          {rejected ? (
            <StateBanner
              tone="danger"
              title="사업 정보 확인 필요"
              description="제출한 조직 정보와 공개 등록 정보가 일치하지 않습니다."
            />
          ) : (
            <Progress
              className="mx-auto mt-6 max-w-sm"
              value={join ? 70 : 45}
            />
          )}
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline">
              <RefreshCw /> 상태 새로고침
            </Button>
            {rejected ? <Button>지원 요청</Button> : null}
          </div>
        </div>
      </div>
    )
  }

  if (screen === "SC-10") {
    const steps = ["기본 정보", "팀원 초대", "업무 페르소나", "완료"]
    const personas = [
      {
        key: "container_loading_inspection",
        label: "적재 / 검사",
        description: "컨테이너 적재와 출하 전 검사를 기록합니다.",
        icon: ClipboardCheck,
      },
      {
        key: "recyclable_commodity_quality",
        label: "재활용 품질 검수",
        description: "중량, 오염, 등급과 샘플 근거를 확인합니다.",
        icon: RefreshCw,
      },
      {
        key: "site_visit_field_report",
        label: "현장 증빙 수집",
        description: "현장 상태를 사진과 메모로 남깁니다.",
        icon: Camera,
      },
      {
        key: "industrial_before_after",
        label: "설비 / 유지보수",
        description: "작업 전후 상태와 완료 근거를 비교합니다.",
        icon: Settings2,
      },
      {
        key: "insurance_accident_scene",
        label: "클레임 / 손상 보고",
        description: "사고 현장과 손상 범위를 빠짐없이 기록합니다.",
        icon: AlertTriangle,
      },
    ]
    const primaryPersona = personas.find(
      (persona) => persona.key === onboardingPrimary
    )
    const updateBasic = (key: keyof typeof onboardingBasic, value: string) =>
      setOnboardingBasic((current) => ({ ...current, [key]: value }))
    const continueOnboarding = () => {
      if (onboardingStep === 2) {
        const entered = onboardingInvites.filter((invite) =>
          invite.email.trim()
        )
        const sent = entered.filter((invite) =>
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invite.email.trim())
        ).length
        setOnboardingInviteResult({ sent, failed: entered.length - sent })
      }
      setOnboardingStep((current) => Math.min(4, current + 1))
    }

    return (
      <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8">
        <ScreenHeading
          eyebrow="SNAP 처음 시작하기"
          title="현장 업무를 시작할 기준을 설정합니다"
          description="원소스의 조직 설정, 팀 초대, 업무 페르소나 순서로 진행합니다. 작업자 역할은 이 과정을 거치지 않습니다."
        />
        <div className="mt-7 flex items-start">
          {steps.map((step, index) => (
            <div
              key={step}
              className={cn(
                "flex min-w-0 items-center",
                index < steps.length - 1 && "flex-1"
              )}
            >
              <div className="flex shrink-0 flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-xs font-semibold",
                    index + 1 < onboardingStep
                      ? "bg-primary text-primary-foreground"
                      : onboardingStep === index + 1
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/10"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {index + 1 < onboardingStep ? (
                    <Check className="size-3.5" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    index + 1 <= onboardingStep
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 ? (
                <span
                  className={cn(
                    "mx-3 mt-4 h-px flex-1",
                    index + 1 < onboardingStep ? "bg-primary" : "bg-border"
                  )}
                />
              ) : null}
            </div>
          ))}
        </div>

        <Card className="mt-7 rounded-md shadow-none">
          <CardHeader>
            <CardTitle>{steps[onboardingStep - 1]}</CardTitle>
            <CardDescription>
              {onboardingStep === 1
                ? "회사 운영에 필요한 기본 정보입니다. 설정에서 언제든 변경할 수 있습니다."
                : onboardingStep === 2
                  ? "함께 시작할 팀원을 초대하세요. 이 단계는 건너뛸 수 있습니다."
                  : onboardingStep === 3
                    ? "주 업무 유형 하나와 필요한 보조 유형을 선택하세요."
                    : "설정이 완료되었습니다. 첫 업무를 만들거나 대시보드로 이동하세요."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {onboardingStep === 1 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  국가 / 지역
                  <Select
                    value={onboardingBasic.country}
                    onValueChange={(value) =>
                      value && updateBasic("country", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KR">대한민국 (Korea)</SelectItem>
                      <SelectItem value="JP">일본 (Japan)</SelectItem>
                      <SelectItem value="SG">싱가포르 (Singapore)</SelectItem>
                      <SelectItem value="AU">호주 (Australia)</SelectItem>
                      <SelectItem value="TH">태국 (Thailand)</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
                <label className="space-y-2 text-sm font-medium">
                  기본 언어
                  <Select
                    value={onboardingBasic.language}
                    onValueChange={(value) =>
                      value && updateBasic("language", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ko">한국어</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                      <SelectItem value="th">ไทย</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="block text-xs font-normal text-muted-foreground">
                    선택한 언어는 서비스 표시 언어에 즉시 반영됩니다.
                  </span>
                </label>
                <label className="space-y-2 text-sm font-medium">
                  시간대
                  <Select
                    value={onboardingBasic.timezone}
                    onValueChange={(value) =>
                      value && updateBasic("timezone", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Seoul">Asia/Seoul</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                      <SelectItem value="Asia/Singapore">
                        Asia/Singapore
                      </SelectItem>
                      <SelectItem value="Australia/Sydney">
                        Australia/Sydney
                      </SelectItem>
                      <SelectItem value="Asia/Bangkok">Asia/Bangkok</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
                <label className="space-y-2 text-sm font-medium">
                  회사 규모
                  <Select
                    value={onboardingBasic.companySize}
                    onValueChange={(value) =>
                      value && updateBasic("companySize", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "1 - 10",
                        "11 - 50",
                        "51 - 200",
                        "201 - 1000",
                        "1000+",
                      ].map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className="space-y-2 text-sm font-medium sm:col-span-2">
                  업종
                  <Select
                    value={onboardingBasic.industry}
                    onValueChange={(value) =>
                      value && updateBasic("industry", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="construction">건설</SelectItem>
                      <SelectItem value="logistics">물류</SelectItem>
                      <SelectItem value="manufacturing">제조</SelectItem>
                      <SelectItem value="cleaning">청소·시설</SelectItem>
                      <SelectItem value="insurance">보험</SelectItem>
                      <SelectItem value="other">기타</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
              </div>
            ) : null}

            {onboardingStep === 2 ? (
              <div className="space-y-4">
                <StateBanner
                  tone="info"
                  title="선택 단계"
                  description="초대 실패는 온보딩을 막지 않습니다. 실패한 주소는 멤버 설정에서 다시 보낼 수 있습니다."
                />
                <div className="space-y-3">
                  {onboardingInvites.map((invite, index) => (
                    <div
                      key={index}
                      className="grid gap-2 sm:grid-cols-[1fr_150px_auto]"
                    >
                      <Input
                        type="email"
                        value={invite.email}
                        placeholder="member@company.com"
                        onChange={(event) =>
                          setOnboardingInvites((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, email: event.target.value }
                                : item
                            )
                          )
                        }
                      />
                      <Select
                        value={invite.role}
                        onValueChange={(value) =>
                          value &&
                          setOnboardingInvites((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, role: value }
                                : item
                            )
                          )
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="worker">작업자</SelectItem>
                          <SelectItem value="manager">매니저</SelectItem>
                          <SelectItem value="admin">관리자</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={onboardingInvites.length === 1}
                        aria-label="초대 행 삭제"
                        onClick={() =>
                          setOnboardingInvites((current) =>
                            current.filter(
                              (_, itemIndex) => itemIndex !== index
                            )
                          )
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setOnboardingInvites((current) => [
                      ...current,
                      { email: "", role: "worker" },
                    ])
                  }
                >
                  <Plus /> 팀원 추가
                </Button>
              </div>
            ) : null}

            {onboardingStep === 3 ? (
              <div className="space-y-6">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    주 업무 유형
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {personas.map((persona) => {
                      const Icon = persona.icon
                      const active = onboardingPrimary === persona.key
                      return (
                        <button
                          key={persona.key}
                          type="button"
                          className={cn(
                            "flex min-h-28 items-start gap-3 rounded-md border p-4 text-left transition-colors",
                            active
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted/60"
                          )}
                          onClick={() => {
                            setOnboardingPrimary(persona.key)
                            setOnboardingSecondary((current) =>
                              current.filter((key) => key !== persona.key)
                            )
                          }}
                        >
                          <span
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-md bg-muted",
                              active && "bg-primary text-primary-foreground"
                            )}
                          >
                            <Icon className="size-4" />
                          </span>
                          <span>
                            <strong className="block text-sm">
                              {persona.label}
                            </strong>
                            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                              {persona.description}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    보조 업무 유형 (선택)
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {personas
                      .filter((persona) => persona.key !== onboardingPrimary)
                      .map((persona) => {
                        const active = onboardingSecondary.includes(persona.key)
                        return (
                          <Button
                            key={persona.key}
                            type="button"
                            size="sm"
                            variant={active ? "secondary" : "outline"}
                            onClick={() =>
                              setOnboardingSecondary((current) =>
                                active
                                  ? current.filter((key) => key !== persona.key)
                                  : [...current, persona.key]
                              )
                            }
                          >
                            {active ? <Check /> : <Plus />}
                            {persona.label}
                          </Button>
                        )
                      })}
                  </div>
                </div>
              </div>
            ) : null}

            {onboardingStep === 4 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <span className="flex size-14 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                  <PartyPopper />
                </span>
                <h2 className="mt-5 text-xl font-semibold">
                  설정이 완료되었습니다
                </h2>
                <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                  첫 업무를 만들면 현장 수행, 검토, 고객 전달 흐름을 바로 시작할
                  수 있습니다.
                </p>
                <div className="mt-5 w-full max-w-md divide-y rounded-md border text-left text-sm">
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">주 업무 유형</span>
                    <strong>{primaryPersona?.label}</strong>
                  </div>
                  <div className="flex justify-between px-4 py-3">
                    <span className="text-muted-foreground">팀 초대</span>
                    <strong>
                      {onboardingInviteResult.sent}건 요청
                      {onboardingInviteResult.failed > 0
                        ? ` · ${onboardingInviteResult.failed}건 재확인`
                        : ""}
                    </strong>
                  </div>
                </div>
                <div className="mt-6 flex w-full max-w-md flex-col gap-2">
                  <Button className="w-full" onClick={() => navigate("SC-19")}>
                    첫 업무 만들기 <ChevronRight />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => navigate("SC-17")}
                  >
                    대시보드로 이동
                  </Button>
                </div>
              </div>
            ) : null}

            {onboardingStep < 4 ? (
              <div className="mt-7 flex items-center justify-between border-t pt-5">
                <Button
                  variant="ghost"
                  disabled={onboardingStep === 1}
                  onClick={() =>
                    setOnboardingStep((current) => Math.max(1, current - 1))
                  }
                >
                  <ChevronLeft /> 이전
                </Button>
                <div className="flex gap-2">
                  {onboardingStep === 2 ? (
                    <Button
                      variant="ghost"
                      onClick={() => setOnboardingStep(3)}
                    >
                      건너뛰기
                    </Button>
                  ) : null}
                  <Button onClick={continueOnboarding}>
                    {onboardingStep === 1 ? "저장하고 다음" : "다음"}
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    )
  }

  const inviteOrganization =
    snapString(inviteData, "organization", "org_name", "organization_name") ||
    "한빛물류"
  const inviteRole = snapString(inviteData, "role") || "operator"
  const inviteEmail = snapString(inviteData, "email") || "minji@hanbit.co.kr"
  const inviteExpiry = snapString(inviteData, "expires_at", "expiry")

  return (
    <div className="mx-auto flex min-h-[calc(100vh-108px)] w-full max-w-xl items-center px-5 py-10">
      <Card className="w-full rounded-md shadow-none">
        <CardHeader>
          <StatusBadge tone="blue">
            초대 받은 이메일은 변경할 수 없습니다
          </StatusBadge>
          <CardTitle>{inviteOrganization}에 합류하세요</CardTitle>
          <CardDescription>
            {inviteRole} 역할로 초대되었습니다. 초대 범위와 조직을 확인한 뒤
            수락하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {inviteState === "loading" ? (
            <StateBanner
              tone="info"
              title="초대를 확인하는 중입니다"
              description="조직, 역할과 만료 상태를 불러오고 있습니다."
            />
          ) : inviteState === "expired" ? (
            <StateBanner
              tone="warning"
              title="초대가 만료되었습니다"
              description="조직 관리자에게 새 초대 링크를 요청해 주세요."
            />
          ) : inviteState === "error" ? (
            <StateBanner
              tone="danger"
              title="초대를 열 수 없습니다"
              description={inviteError || "초대 링크를 다시 확인해 주세요."}
            />
          ) : inviteState === "accepted" ? (
            <StateBanner
              tone="success"
              title="조직에 합류했습니다"
              description="대시보드에서 배정된 업무를 확인할 수 있습니다."
              action={
                <Button size="sm" onClick={() => navigate("SC-17")}>
                  대시보드로 이동
                </Button>
              }
            />
          ) : (
            <>
              <div className="rounded-md bg-sidebar p-4 text-sm">
                <div className="text-muted-foreground">초대 이메일</div>
                <strong>{inviteEmail}</strong>
                <div className="mt-3 text-muted-foreground">만료</div>
                <strong>{inviteExpiry || "48시간 후"}</strong>
              </div>
              {inviteError ? (
                <p className="text-sm text-destructive" role="alert">
                  {inviteError}
                </p>
              ) : null}
              <Button
                className="w-full"
                disabled={inviteBusy}
                onClick={() => void acceptInvite()}
              >
                {inviteBusy ? <RefreshCw className="animate-spin" /> : <Check />}
                초대 수락
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => navigate("SC-06")}>
                다른 계정으로 로그인
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function LinkPrototype({ screen, navigate, routeParams }: PrototypeScreenProps) {
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const pendingCaptureKeyRef = useRef<string | undefined>(undefined)
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ name: string; captureKey?: string }>
  >([])
  const [failedFiles, setFailedFiles] = useState<
    Array<{ file: File; captureKey?: string }>
  >([])
  const [uploadBusy, setUploadBusy] = useState(false)
  const [uploadSubmitted, setUploadSubmitted] = useState(false)
  const [uploadMessage, setUploadMessage] = useState("")
  const [activeCaptureKey, setActiveCaptureKey] = useState<string>()
  const [completedCaptureKeys, setCompletedCaptureKeys] = useState<string[]>([])
  const [partialReason, setPartialReason] = useState("")
  const [actionConsentAccepted, setActionConsentAccepted] = useState(false)
  const [actionReloadKey, setActionReloadKey] = useState(0)
  const [actionLinkState, setActionLinkState] = useState<
    "idle" | "loading" | "ready" | "expired" | "revoked" | "forbidden" | "error"
  >("idle")
  const [actionLinkData, setActionLinkData] =
    useState<PublicActionLinkView | null>(null)
  const [actionLinkMessage, setActionLinkMessage] = useState("")
  const [acknowledged, setAcknowledged] = useState(false)
  const [hash, setHash] = useState(
    () => routeParams?.hash || "8f2c9a71e4d8"
  )
  const [publicLinkState, setPublicLinkState] = useState<
    "active" | "password" | "expired" | "revoked" | "error"
  >("active")
  const [publicLinkPassword, setPublicLinkPassword] = useState("")
  const [publicLinkBusy, setPublicLinkBusy] = useState(false)
  const [publicLinkMessage, setPublicLinkMessage] = useState("")
  const [publicData, setPublicData] = useState<PublicCustomerView | null>(null)
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [disputeStatus, setDisputeStatus] = useState<PublicDisputeStatus | null>(null)
  const [disputeReason, setDisputeReason] = useState("wrong_evidence")
  const [disputeSummary, setDisputeSummary] = useState("")
  const [integrityBusy, setIntegrityBusy] = useState(false)
  const [integrityResult, setIntegrityResult] =
    useState<EvidenceIntegrityView | null>(null)
  const [integrityMessage, setIntegrityMessage] = useState("")

  const routeToken = routeParams?.token
  const publicToken =
    (screen === "SC-14" ? routeToken : undefined) ||
    (import.meta.env.VITE_SNAP_PUBLIC_TOKEN as string | undefined)
  const externalUploadToken =
    (screen === "SC-13" ? routeToken : undefined) ||
    (import.meta.env.VITE_SNAP_EXTERNAL_UPLOAD_TOKEN as string | undefined)
  const workerToken =
    (screen === "SC-12" ? routeToken : undefined) ||
    (import.meta.env.VITE_SNAP_WORKER_TOKEN as string | undefined)
  const livePublicView = snapApiConfigured && Boolean(publicToken)
  const actionToken =
    screen === "SC-13"
      ? externalUploadToken
      : screen === "SC-12"
        ? workerToken
        : undefined

  const integrityHash = hash

  useEffect(() => {
    if (screen !== "SC-12" && screen !== "SC-13") return
    let cancelled = false
    void (async () => {
      await Promise.resolve()
      if (cancelled) return

      if (!snapApiConfigured) {
        setActionLinkState("ready")
        setActionLinkData(null)
        setActionConsentAccepted(true)
        return
      }
      if (!actionToken) {
        setActionLinkState("error")
        setActionLinkMessage(
          "공개 링크 토큰이 없습니다. 전달받은 전체 링크를 다시 열어 주세요."
        )
        return
      }

      setActionLinkState("loading")
      setActionLinkMessage("")
      try {
        const data = await snapReportApi.getPublicLink<PublicActionLinkView>(
          actionToken
        )
        if (cancelled) return
        const expectedType = screen === "SC-13" ? "external_upload" : "worker_exec"
        if (data.link_type && data.link_type !== expectedType) {
          setActionLinkState("forbidden")
          setActionLinkMessage(
            "이 링크에는 현재 화면을 사용할 권한이 없습니다. 링크 유형을 확인해 주세요."
          )
          return
        }
        setActionLinkData(data)
        setActionLinkState("ready")
        const consentKey = `snap_public_consent:${actionToken}`
        setActionConsentAccepted(
          !data.cross_border || window.localStorage.getItem(consentKey) === "1"
        )
      } catch (reason) {
        if (cancelled) return
        if (reason instanceof SnapApiError && reason.status === 410) {
          const revoked = `${reason.code} ${reason.reason || ""}`
            .toLowerCase()
            .includes("revok")
          setActionLinkState(revoked ? "revoked" : "expired")
        } else if (
          reason instanceof SnapApiError &&
          (reason.status === 401 || reason.status === 403)
        ) {
          setActionLinkState("forbidden")
          setActionLinkMessage(snapApiErrorMessage(reason))
        } else {
          setActionLinkState("error")
          setActionLinkMessage(snapApiErrorMessage(reason))
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [actionReloadKey, actionToken, screen])

  useEffect(() => {
    if (screen !== "SC-14" || !snapApiConfigured) return
    let cancelled = false
    void (async () => {
      await Promise.resolve()
      if (cancelled) return
      if (!publicToken) {
        setPublicLinkState("error")
        setPublicLinkMessage(
          "공유 토큰이 없습니다. 전달받은 전체 링크를 다시 열어 주세요."
        )
        return
      }

      setPublicLinkBusy(true)
      setPublicLinkMessage("")
      try {
        const data = await snapReportApi.getPublicLink(publicToken)
        if (cancelled) return
        setPublicData(data)
        setAcknowledged(Boolean(data.acknowledged))
        setPublicLinkState("active")
        const consentKey = `snap_public_consent:${publicToken}`
        setConsentAccepted(
          !data.cross_border || window.localStorage.getItem(consentKey) === "1"
        )
      } catch (reason) {
        if (cancelled) return
        if (reason instanceof SnapApiError && reason.status === 401) {
          setPublicLinkState("password")
          setPublicLinkMessage("보호된 링크입니다. 전달받은 비밀번호를 입력해 주세요.")
        } else if (reason instanceof SnapApiError && reason.status === 410) {
          const revoked = `${reason.code} ${reason.reason || ""}`.toLowerCase().includes("revok")
          setPublicLinkState(revoked ? "revoked" : "expired")
        } else {
          setPublicLinkState("error")
          setPublicLinkMessage(reason instanceof Error ? reason.message : "리포트를 불러오지 못했습니다.")
        }
      } finally {
        if (!cancelled) setPublicLinkBusy(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [publicToken, screen])

  const actionChecklist = useMemo<PublicWorkerChecklistItem[]>(() => {
    if (screen !== "SC-12") return []
    const sourceChecklist = actionLinkData?.checklist?.length
      ? actionLinkData.checklist
      : actionLinkData?.human_instruction?.checklist
    if (sourceChecklist?.length) {
      return sourceChecklist.map((item, index) => ({
        ...item,
        key: item.key || `capture_${index + 1}`,
        label: item.label || `필수 촬영 ${index + 1}`,
        required: item.required !== false,
        satisfied:
          Boolean(item.satisfied) ||
          item.status === "captured" ||
          item.status === "done" ||
          completedCaptureKeys.includes(item.key),
      }))
    }
    if (snapApiConfigured) return []
    return [
      {
        key: "container_number",
        label: "컨테이너 번호",
        media_type: "photo",
        required: true,
        satisfied: true,
      },
      {
        key: "seal_number",
        label: "봉인 번호",
        media_type: "photo",
        required: true,
        satisfied: true,
      },
      {
        key: "seal_overview",
        label: "전체 봉인 사진",
        media_type: "photo",
        required: true,
        satisfied: completedCaptureKeys.includes("seal_overview"),
      },
    ]
  }, [actionLinkData, completedCaptureKeys, screen])

  const actionRequiredTotal =
    actionLinkData?.completeness?.counts?.required ??
    actionChecklist.filter((item) => item.required !== false).length
  const actionSatisfiedTotal = Math.min(
    actionRequiredTotal,
    Math.max(
      actionLinkData?.completeness?.counts?.required_satisfied ?? 0,
      actionChecklist.filter(
        (item) => item.required !== false && item.satisfied
      ).length
    )
  )
  const actionComplete =
    actionLinkData?.completeness?.counts?.complete === true ||
    actionRequiredTotal === 0 ||
    actionSatisfiedTotal >= actionRequiredTotal
  const actionServerUploadCount = actionLinkData?.upload_count ?? 0
  const actionTotalUploaded = Math.max(
    actionServerUploadCount,
    uploadedFiles.length
  )
  const actionUploadsRemaining = actionLinkData?.uploads_remaining
  const actionCanUploadMore =
    actionUploadsRemaining == null ||
    actionUploadsRemaining < 0 ||
    actionUploadsRemaining > 0
  const actionCapabilities = actionLinkData?.capabilities || []
  const actionCanUpload =
    actionCapabilities.length === 0 ||
    actionCapabilities.includes("upload_media")
  const actionCanSubmit =
    actionCapabilities.length === 0 ||
    actionCapabilities.includes(
      screen === "SC-13" ? "submit_media" : "submit_task"
    )

  const uploadEvidenceFiles = async (
    requestedFiles: Array<{ file: File; captureKey?: string }>
  ) => {
    if (uploadBusy || uploadSubmitted) return
    const external = screen === "SC-13"
    const token = external ? externalUploadToken : workerToken
    const available =
      snapApiConfigured && actionUploadsRemaining != null && actionUploadsRemaining >= 0
        ? actionUploadsRemaining
        : snapApiConfigured
          ? requestedFiles.length
          : Math.max(0, 5 - uploadedFiles.length)
    const candidates = requestedFiles.slice(0, available)
    const excluded = requestedFiles.slice(available)
    const allowedMediaTypes = actionLinkData?.allowed_media_types || []
    const mediaType = (file: File) =>
      file.type.startsWith("image/")
        ? "photo"
        : file.type.startsWith("video/")
          ? "video"
          : file.type.startsWith("audio/")
            ? "audio"
            : "document"
    const valid = candidates.filter(
      ({ file }) =>
        file.size <= 50 * 1024 * 1024 &&
        (allowedMediaTypes.length === 0 ||
          allowedMediaTypes.includes(mediaType(file)) ||
          allowedMediaTypes.includes(file.type))
    )
    const rejected = candidates.filter((candidate) => !valid.includes(candidate))

    if (snapApiConfigured && !token) {
      setFailedFiles(requestedFiles)
      setUploadMessage("업로드 토큰이 없습니다. 전달받은 전체 링크를 다시 열어 주세요.")
      return
    }
    if (!actionCanUpload || !actionCanUploadMore) {
      setFailedFiles(requestedFiles)
      setUploadMessage(
        !actionCanUpload
          ? "이 링크에는 파일 업로드 권한이 없습니다."
          : "이 링크의 업로드 한도에 도달했습니다."
      )
      return
    }
    if (actionLinkData?.cross_border && !actionConsentAccepted) {
      setFailedFiles(requestedFiles)
      setUploadMessage("국외 이전 안내를 확인한 뒤 파일을 올려 주세요.")
      return
    }

    setUploadBusy(true)
    setUploadMessage("")
    setFailedFiles([...rejected, ...excluded])
    const succeeded: Array<{ name: string; captureKey?: string }> = []
    const failed: Array<{ file: File; captureKey?: string }> = [
      ...rejected,
      ...excluded,
    ]
    let lastFailure: unknown = null

    for (const candidate of valid) {
      const { file, captureKey } = candidate
      try {
        if (snapApiConfigured && token) {
          await snapReportApi.uploadPublicFile(token, file, {
            captureKey:
              captureKey ||
              `${external ? "external" : "worker"}_${file.name}_${file.lastModified}`,
            mediaSource: external ? "external_upload" : "camera",
          })
        }
        succeeded.push({ name: file.name, captureKey })
      } catch (reason) {
        if (reason instanceof SnapApiError && reason.status === 410) {
          const revoked = `${reason.code} ${reason.reason || ""}`
            .toLowerCase()
            .includes("revok")
          setActionLinkState(revoked ? "revoked" : "expired")
        }
        lastFailure = reason
        failed.push(candidate)
      }
    }

    setUploadedFiles((current) => [...current, ...succeeded])
    const capturedKeys = succeeded
      .map((item) => item.captureKey)
      .filter((key): key is string => Boolean(key))
    if (capturedKeys.length) {
      setCompletedCaptureKeys((current) => [
        ...new Set([...current, ...capturedKeys]),
      ])
    }
    if (snapApiConfigured && succeeded.length) {
      setActionLinkData((current) => {
        if (!current) return current
        const remaining = current.uploads_remaining
        return {
          ...current,
          upload_count: (current.upload_count ?? 0) + succeeded.length,
          uploads_remaining:
            remaining == null || remaining < 0
              ? remaining
              : Math.max(0, remaining - succeeded.length),
        }
      })
    }
    setFailedFiles(failed)
    if (excluded.length) {
      setUploadMessage(
        `남은 업로드 한도 때문에 ${excluded.length}개 파일을 제외했습니다.`
      )
    } else if (failed.length) {
      const reason = lastFailure
        ? snapApiErrorMessage(lastFailure)
        : "파일 크기 또는 허용된 파일 유형을 확인해 주세요."
      setUploadMessage(
        `${failed.length}개 파일을 올리지 못했습니다. ${reason} 성공한 파일은 유지됩니다.`
      )
    } else if (succeeded.length) {
      setUploadMessage(`${succeeded.length}개 파일을 추가했습니다.`)
    }
    setUploadBusy(false)
  }

  const handleUploadInput = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ""
    const captureKey = pendingCaptureKeyRef.current || activeCaptureKey
    pendingCaptureKeyRef.current = undefined
    setActiveCaptureKey(undefined)
    void uploadEvidenceFiles(files.map((file) => ({ file, captureKey })))
  }

  const handleUploadDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    void uploadEvidenceFiles(
      Array.from(event.dataTransfer.files).map((file) => ({ file }))
    )
  }

  const acceptActionConsent = async () => {
    if (!actionToken) return
    setUploadBusy(true)
    setUploadMessage("")
    try {
      if (snapApiConfigured) {
        await snapReportApi.recordConsent(actionToken, {
          version: "1",
          surface: screen === "SC-13" ? "external_upload" : "worker_exec",
        })
        window.localStorage.setItem(
          `snap_public_consent:${actionToken}`,
          "1"
        )
      }
      setActionConsentAccepted(true)
    } catch (reason) {
      setUploadMessage(snapApiErrorMessage(reason))
    } finally {
      setUploadBusy(false)
    }
  }

  const submitEvidence = async () => {
    const external = screen === "SC-13"
    const token = external ? externalUploadToken : workerToken
    if (snapApiConfigured && !token) {
      setUploadMessage("업로드 토큰이 없어 제출할 수 없습니다.")
      return
    }
    if (!actionCanSubmit) {
      setUploadMessage("이 링크에는 제출 권한이 없습니다.")
      return
    }
    if (actionLinkData?.cross_border && !actionConsentAccepted) {
      setUploadMessage("국외 이전 안내를 확인한 뒤 제출해 주세요.")
      return
    }
    const partial = !external && !actionComplete
    if (partial && !partialReason.trim()) {
      setUploadMessage("미완료 상태로 제출하려면 사유를 입력해 주세요.")
      return
    }
    setUploadBusy(true)
    setUploadMessage("")
    try {
      if (snapApiConfigured && token) {
        await snapReportApi.submitPublicLink(
          token,
          partial
            ? { submit_partial: true, partial_reason: partialReason.trim() }
            : {}
        )
      }
      setUploadSubmitted(true)
      setUploadMessage("제출이 완료되었습니다. 같은 링크에서는 파일을 더 추가할 수 없습니다.")
    } catch (reason) {
      setUploadMessage(snapApiErrorMessage(reason))
    } finally {
      setUploadBusy(false)
    }
  }

  if (screen === "SC-12" || screen === "SC-13") {
    const external = screen === "SC-13"
    const instruction = actionLinkData?.human_instruction
    const heading =
      actionLinkData?.label ||
      instruction?.title ||
      (external
        ? "지정 작업에 증거를 제출하세요"
        : "현장 작업을 확인하고 증거를 기록하세요")
    const description =
      instruction?.purpose ||
      (external
        ? "앱 설치 없이 요청받은 파일을 안전하게 제출할 수 있습니다."
        : "이 링크에 허용된 작업 범위와 체크리스트만 수행합니다.")
    const organizationName =
      typeof actionLinkData?.organization === "string"
        ? actionLinkData.organization
        : actionLinkData?.organization?.name
    const expiresAt = actionLinkData?.expires_at
      ? new Date(actionLinkData.expires_at).toLocaleString("ko-KR")
      : null
    const activeItem = actionChecklist.find(
      (item) => item.key === activeCaptureKey
    )
    const uploadLimit = actionLinkData?.max_uploads
    const allowedMediaText =
      actionLinkData?.allowed_media_types?.join(" · ") ||
      "사진 · 영상 · 음성 · 문서"
    const canSubmitEvidence = external
      ? actionTotalUploaded > 0
      : actionComplete ||
        (actionTotalUploaded > 0 && partialReason.trim().length > 0)

    if (actionLinkState === "idle" || actionLinkState === "loading") {
      return (
        <div className="flex min-h-[60vh] items-center justify-center px-5 py-12">
          <div className="text-center">
            <RefreshCw className="mx-auto size-8 animate-spin text-primary" />
            <p className="mt-4 text-sm font-medium">작업 링크를 확인하고 있습니다.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              권한과 남은 업로드 한도를 불러옵니다.
            </p>
          </div>
        </div>
      )
    }

    if (
      actionLinkState === "expired" ||
      actionLinkState === "revoked" ||
      actionLinkState === "forbidden" ||
      actionLinkState === "error"
    ) {
      const copy = {
        expired: {
          title: "링크가 만료되었습니다",
          description: "요청한 담당자에게 새 작업 링크를 받아 주세요.",
        },
        revoked: {
          title: "회수된 링크입니다",
          description: "보안을 위해 이 링크의 접근 권한이 회수되었습니다.",
        },
        forbidden: {
          title: "이 작업을 열 수 없습니다",
          description:
            actionLinkMessage || "링크 유형이나 접근 권한을 확인해 주세요.",
        },
        error: {
          title: "작업 링크를 불러오지 못했습니다",
          description:
            actionLinkMessage || "연결 상태를 확인한 뒤 다시 시도해 주세요.",
        },
      }[actionLinkState]
      return (
        <div className="mx-auto w-full max-w-2xl px-5 py-12 sm:px-8">
          <StateBanner
            tone={actionLinkState === "error" ? "warning" : "danger"}
            title={copy.title}
            description={copy.description}
            action={
              actionLinkState === "error" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActionReloadKey((current) => current + 1)}
                >
                  <RotateCcw /> 다시 시도
                </Button>
              ) : undefined
            }
          />
        </div>
      )
    }

    return (
      <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8">
        <ScreenHeading
          eyebrow={external ? "제한 업로드 링크" : "작업 실행 링크"}
          title={heading}
          description={description}
        />
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-y py-3 text-xs text-muted-foreground">
          {organizationName ? <span>요청 조직 {organizationName}</span> : null}
          {actionLinkData?.task?.location_name ? (
            <span>작업 위치 {String(actionLinkData.task.location_name)}</span>
          ) : null}
          {expiresAt ? <span>만료 {expiresAt}</span> : null}
        </div>
        {actionLinkData?.cross_border && !actionConsentAccepted ? (
          <div className="mt-4">
            <StateBanner
              tone="warning"
              title="국외 이전 안내 확인이 필요합니다"
              description="업로드할 파일이 국외 리전에 저장될 수 있습니다. 안내를 확인해야 업로드와 제출을 계속할 수 있습니다."
              action={
                <Button
                  size="sm"
                  disabled={uploadBusy}
                  onClick={() => void acceptActionConsent()}
                >
                  {uploadBusy ? <RefreshCw className="animate-spin" /> : <Check />}
                  확인하고 계속
                </Button>
              }
            />
          </div>
        ) : null}
        {external && actionLinkData?.review_notice ? (
          <div className="mt-4">
            <StateBanner
              tone="info"
              title="제출 후 담당자가 검토합니다"
              description="업로드 완료는 검토 완료를 의미하지 않습니다. 문제가 있으면 요청 담당자가 다시 촬영을 요청할 수 있습니다."
            />
          </div>
        ) : null}
        {!external && actionLinkData?.recapture_requests?.length ? (
          <div className="mt-4">
            <StateBanner
              tone="warning"
              title={`재촬영 요청 ${actionLinkData.recapture_requests.length}건`}
              description={actionLinkData.recapture_requests
                .map((request) => request.reason || request.media_type || "재촬영 필요")
                .join(" · ")}
            />
          </div>
        ) : null}
        {!actionCanUpload || !actionCanSubmit ? (
          <div className="mt-4">
            <StateBanner
              tone="danger"
              title="이 링크의 작업 권한이 제한되어 있습니다"
              description={
                !actionCanUpload
                  ? "파일 업로드 권한이 없습니다. 요청 담당자에게 새 링크를 받아 주세요."
                  : "제출 권한이 없습니다. 업로드한 파일은 유지되며 담당자 확인이 필요합니다."
              }
            />
          </div>
        ) : null}
        <div className="mt-6 grid gap-5 md:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            {!external ? (
              <div className="rounded-md border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">현장 체크리스트</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      필수 항목 {actionSatisfiedTotal}/{actionRequiredTotal} 완료
                    </p>
                  </div>
                  <StatusBadge tone={actionComplete ? "green" : "amber"}>
                    {actionComplete ? "제출 준비 완료" : "촬영 필요"}
                  </StatusBadge>
                </div>
                {actionRequiredTotal > 0 ? (
                  <Progress
                    className="mt-3 h-2"
                    value={(actionSatisfiedTotal / actionRequiredTotal) * 100}
                  />
                ) : null}
                <div className="mt-4 divide-y border-y">
                  {actionChecklist.length === 0 ? (
                    <div className="py-4 text-sm text-muted-foreground">
                      이 작업에 별도 촬영 체크리스트가 없습니다.
                    </div>
                  ) : null}
                  {actionChecklist.map((item) => {
                    const satisfied = Boolean(item.satisfied)
                    return (
                      <div
                        key={item.key}
                        className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center"
                      >
                        <Checkbox checked={satisfied} disabled />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                            <span>{item.label}</span>
                            {item.required !== false ? (
                              <StatusBadge tone="blue">필수</StatusBadge>
                            ) : (
                              <StatusBadge>선택</StatusBadge>
                            )}
                            {item.media_type ? (
                              <span className="text-xs text-muted-foreground">
                                {item.media_type}
                              </span>
                            ) : null}
                          </div>
                          {item.framing_guide || item.acceptance_rule ? (
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              {[item.framing_guide, item.acceptance_rule]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          ) : null}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            uploadBusy ||
                            uploadSubmitted ||
                            !actionCanUpload ||
                            !actionCanUploadMore ||
                            (Boolean(actionLinkData?.cross_border) &&
                              !actionConsentAccepted)
                          }
                          onClick={() => {
                            pendingCaptureKeyRef.current = item.key
                            setActiveCaptureKey(item.key)
                            uploadInputRef.current?.click()
                          }}
                        >
                          <Camera /> {satisfied ? "다시 촬영" : "촬영"}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}
            <button
              type="button"
              className="flex min-h-64 w-full flex-col items-center justify-center rounded-md border border-dashed bg-sidebar/40 p-6 text-center disabled:cursor-not-allowed disabled:opacity-60"
              disabled={
                uploadBusy ||
                uploadSubmitted ||
                !actionCanUpload ||
                !actionCanUploadMore ||
                (Boolean(actionLinkData?.cross_border) && !actionConsentAccepted)
              }
              onClick={() => {
                pendingCaptureKeyRef.current = undefined
                setActiveCaptureKey(undefined)
                uploadInputRef.current?.click()
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleUploadDrop}
            >
              {uploadBusy ? (
                <RefreshCw className="size-9 animate-spin text-primary" />
              ) : uploadSubmitted ? (
                <CheckCircle2 className="size-9 text-emerald-600" />
              ) : (
                <Upload className="size-9 text-primary" />
              )}
              <strong className="mt-4">
                {uploadSubmitted
                  ? "제출 완료"
                  : uploadBusy
                    ? "파일 올리는 중"
                    : activeItem
                      ? `${activeItem.label} 파일 선택`
                      : "파일 선택 또는 끌어놓기"}
              </strong>
              <span className="mt-1 text-sm text-muted-foreground">
                {allowedMediaText} · 파일당 50MB
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                {actionUploadsRemaining == null || actionUploadsRemaining < 0
                  ? "업로드 수 제한 없음"
                  : `남은 업로드 ${actionUploadsRemaining}개`}
              </span>
            </button>
            <input
              ref={uploadInputRef}
              className="sr-only"
              type="file"
              accept="image/*,video/*,audio/*,application/pdf"
              multiple
              onChange={handleUploadInput}
            />
            {failedFiles.length ? (
              <StateBanner
                tone="warning"
                title={`${failedFiles.length}개 파일 업로드 실패`}
                description="성공한 파일은 유지됩니다. 실패한 파일만 다시 시도할 수 있습니다."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploadBusy}
                    onClick={() => void uploadEvidenceFiles(failedFiles)}
                  >
                    <RotateCcw /> 실패 파일 재시도
                  </Button>
                }
              />
            ) : uploadMessage ? (
              <StateBanner
                tone={uploadSubmitted ? "success" : "info"}
                title={uploadMessage}
                description={
                  snapApiConfigured
                    ? "SNAP 업로드 계약에 따라 파일 해시와 완료 상태를 기록했습니다."
                    : "API 주소가 설정되면 같은 화면에서 실제 업로드로 전환됩니다."
                }
              />
            ) : null}
          </div>
          <Card className="h-fit rounded-md shadow-none">
            <CardHeader>
              <CardTitle className="text-base">제출할 파일</CardTitle>
              <CardDescription>
                현재 {actionTotalUploaded}개
                {uploadLimit != null ? ` · 최대 ${uploadLimit}개` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {uploadedFiles.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                  {actionServerUploadCount > 0
                    ? `서버에 ${actionServerUploadCount}개 파일이 보관되어 있습니다.`
                    : "아직 제출할 파일이 없습니다."}
                </div>
              ) : null}
              {uploadedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${file.captureKey || "general"}-${index}`}
                  className="flex items-center gap-3 rounded-md bg-sidebar p-3 text-sm"
                >
                  <FileImage className="size-4" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{file.name}</div>
                    {file.captureKey ? (
                      <div className="truncate text-xs text-muted-foreground">
                        {actionChecklist.find((item) => item.key === file.captureKey)?.label ||
                          file.captureKey}
                      </div>
                    ) : null}
                  </div>
                  <StatusBadge tone="green">완료</StatusBadge>
                </div>
              ))}
              {!external && !actionComplete && actionTotalUploaded > 0 ? (
                <div className="space-y-2 border-t pt-3">
                  <label htmlFor="partial-submit-reason" className="text-sm font-medium">
                    미완료 제출 사유
                  </label>
                  <Textarea
                    id="partial-submit-reason"
                    value={partialReason}
                    onChange={(event) => setPartialReason(event.target.value)}
                    placeholder="완료하지 못한 항목과 사유를 입력해 주세요."
                    className="min-h-24 resize-y"
                  />
                  <p className="text-xs leading-5 text-muted-foreground">
                    필수 항목을 모두 완료하지 않은 경우 담당자 검토용 부분 제출로 기록됩니다.
                  </p>
                </div>
              ) : null}
              <Button
                className="w-full"
                disabled={
                  !canSubmitEvidence ||
                  !actionCanSubmit ||
                  uploadBusy ||
                  uploadSubmitted ||
                  (Boolean(actionLinkData?.cross_border) && !actionConsentAccepted)
                }
                onClick={() => void submitEvidence()}
              >
                {uploadBusy ? <RefreshCw className="animate-spin" /> : <Send />}
                {uploadSubmitted
                  ? "제출 완료"
                  : !external && !actionComplete
                    ? "미완료 상태로 제출"
                    : "증거 제출"}
              </Button>
              <p className="text-xs leading-5 text-muted-foreground">
                {uploadSubmitted
                  ? "제출이 접수되었습니다. 담당자 검토가 끝나면 후속 안내를 받을 수 있습니다."
                  : "제출 완료 후에는 같은 링크로 파일을 추가할 수 없습니다."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (screen === "SC-14") {
    const reportTitle =
      publicData?.customer_package?.report?.title || "Busan Yard Loading Inspection"
    const reportSummary =
      publicData?.customer_package?.summary?.executive_summary ||
      publicData?.customer_package?.customer_message ||
      "승인된 현장 증거와 검토 결과를 공유합니다."
    const organizationName =
      publicData?.branding?.name || publicData?.organization?.name || "ECOYA Demo Co."
    const downloadAllowed =
      publicData?.allow_download !== false &&
      publicData?.download_available !== false &&
      !publicData?.download_limit_reached

    const openProtectedReport = async () => {
      if (!publicToken || !snapApiConfigured) {
        setPublicLinkState("active")
        return
      }
      setPublicLinkBusy(true)
      setPublicLinkMessage("")
      try {
        const data = await snapReportApi.getPublicLink(publicToken, publicLinkPassword)
        setPublicData(data)
        setAcknowledged(Boolean(data.acknowledged))
        setPublicLinkState("active")
        const consentKey = `snap_public_consent:${publicToken}`
        setConsentAccepted(!data.cross_border || window.localStorage.getItem(consentKey) === "1")
      } catch (reason) {
        setPublicLinkMessage(
          reason instanceof SnapApiError && reason.status === 401
            ? "비밀번호가 일치하지 않습니다."
            : reason instanceof Error
              ? reason.message
              : "리포트를 열지 못했습니다."
        )
      } finally {
        setPublicLinkBusy(false)
      }
    }

    const acknowledgeReport = async () => {
      setPublicLinkBusy(true)
      setPublicLinkMessage("")
      try {
        if (snapApiConfigured && publicToken) {
          await snapReportApi.acknowledge(publicToken, publicLinkPassword || undefined)
        }
        setAcknowledged(true)
        setPublicLinkMessage("수신 확인이 기록되었습니다.")
      } catch (reason) {
        setPublicLinkMessage(
          reason instanceof Error ? reason.message : "수신 확인에 실패했습니다."
        )
      } finally {
        setPublicLinkBusy(false)
      }
    }

    const requestNewPublicLink = async () => {
      setPublicLinkBusy(true)
      setPublicLinkMessage("")
      try {
        if (snapApiConfigured && publicToken) {
          await snapReportApi.requestNewLink(publicToken, publicLinkPassword || undefined)
        }
        setPublicLinkMessage("새 링크 요청을 보냈습니다. 담당자가 확인 후 전달합니다.")
      } catch (reason) {
        setPublicLinkMessage(
          reason instanceof Error ? reason.message : "새 링크 요청에 실패했습니다."
        )
      } finally {
        setPublicLinkBusy(false)
      }
    }

    const acceptCrossBorderConsent = async () => {
      setPublicLinkBusy(true)
      setPublicLinkMessage("")
      try {
        if (snapApiConfigured && publicToken) {
          await snapReportApi.recordConsent(
            publicToken,
            { version: "1", surface: "customer_view" },
            publicLinkPassword || undefined
          )
          window.localStorage.setItem(`snap_public_consent:${publicToken}`, "1")
        }
        setConsentAccepted(true)
      } catch (reason) {
        setPublicLinkMessage(reason instanceof Error ? reason.message : "동의를 기록하지 못했습니다.")
      } finally {
        setPublicLinkBusy(false)
      }
    }

    const downloadPublicAsset = async () => {
      if (!publicToken || !snapApiConfigured) {
        setPublicLinkMessage("API 연결 후 승인된 파일을 내려받을 수 있습니다.")
        return
      }
      setPublicLinkBusy(true)
      setPublicLinkMessage("")
      try {
        await snapReportApi.downloadPublicAsset(
          publicToken,
          "pdf",
          "ECOYA-report.pdf",
          publicLinkPassword || undefined
        )
      } catch (reason) {
        setPublicLinkMessage(reason instanceof Error ? reason.message : "다운로드에 실패했습니다.")
      } finally {
        setPublicLinkBusy(false)
      }
    }

    const toggleDispute = async () => {
      const next = !disputeOpen
      setDisputeOpen(next)
      if (!next || !publicToken || !snapApiConfigured) return
      try {
        setDisputeStatus(
          await snapReportApi.getDispute(publicToken, publicLinkPassword || undefined)
        )
      } catch (reason) {
        setPublicLinkMessage(reason instanceof Error ? reason.message : "이의제기 상태를 불러오지 못했습니다.")
      }
    }

    const submitDispute = async () => {
      if (disputeSummary.trim().length < 8) {
        setPublicLinkMessage("이의 내용을 8자 이상 입력해 주세요.")
        return
      }
      setPublicLinkBusy(true)
      setPublicLinkMessage("")
      try {
        if (snapApiConfigured && publicToken) {
          setDisputeStatus(
            await snapReportApi.fileDispute(
              publicToken,
              { reason_code: disputeReason, summary: disputeSummary.trim() },
              publicLinkPassword || undefined
            )
          )
        } else {
          setDisputeStatus({
            dispute: { reason_code: disputeReason, summary: disputeSummary.trim(), status: "open" },
            can_file: false,
          })
        }
        setPublicLinkMessage("이의제기가 접수되었습니다.")
      } catch (reason) {
        setPublicLinkMessage(reason instanceof Error ? reason.message : "이의제기를 접수하지 못했습니다.")
      } finally {
        setPublicLinkBusy(false)
      }
    }

    return (
      <div className="min-h-[calc(100vh-108px)] bg-sidebar/40 px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-md border bg-background">
          <header className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-semibold">{organizationName}</div>
              <div className="text-sm text-muted-foreground">
                {publicData?.draft ? "검토용 초안" : "승인 리포트"} · 고객 공개 범위 적용
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!livePublicView ? (
                <Select
                  value={publicLinkState}
                  onValueChange={(value) =>
                    value &&
                    setPublicLinkState(
                      value as "active" | "password" | "expired" | "revoked" | "error"
                    )
                  }
                >
                  <SelectTrigger className="w-36" aria-label="고객 링크 상태 미리보기">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">정상 링크</SelectItem>
                    <SelectItem value="password">암호 필요</SelectItem>
                    <SelectItem value="expired">만료 링크</SelectItem>
                    <SelectItem value="revoked">회수 링크</SelectItem>
                    <SelectItem value="error">연결 오류</SelectItem>
                  </SelectContent>
                </Select>
              ) : null}
              {publicLinkState === "active" ? (
                <>
                  <Button
                    variant="outline"
                    disabled={!downloadAllowed || publicLinkBusy}
                    onClick={() => void downloadPublicAsset()}
                  >
                    <Download /> PDF
                  </Button>
                </>
              ) : null}
            </div>
          </header>
          {publicLinkState === "active" ? (
            <div className="grid md:grid-cols-[1fr_300px]">
              <main className="p-5 sm:p-8">
                {publicData?.cross_border && !consentAccepted ? (
                  <div className="ui-status-warning mb-6 rounded-md border p-4">
                    <div className="font-semibold">국외 이전 동의가 필요합니다</div>
                    <p className="mt-1 text-sm leading-6">
                      리포트와 증거가 다른 국가의 수신자에게 제공됩니다. 공개 범위를 확인하고 동의해 주세요.
                    </p>
                    <Button
                      className="mt-3"
                      size="sm"
                      disabled={publicLinkBusy}
                      onClick={() => void acceptCrossBorderConsent()}
                    >
                      동의하고 계속
                    </Button>
                  </div>
                ) : null}
                <StatusBadge tone="green">승인됨</StatusBadge>
                <h1 className="mt-4 text-2xl font-semibold">{reportTitle}</h1>
                <p className="mt-2 text-muted-foreground">
                  {reportSummary}
                </p>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {[
                    "봉인 번호 일치",
                    "컨테이너 외관 양호",
                    "적재 사진 8장",
                    "위치·촬영시각 검증",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-md bg-sidebar p-3 text-sm"
                    >
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-7 grid gap-2 sm:grid-cols-2">
                  {REPORT_PHOTO_SECTIONS.map((section) => (
                    <ReportPhotoSectionBlock
                      key={section.id}
                      section={section}
                      photos={getReportPhotoSectionMedia(section).filter((photo) =>
                        REPORT_PHOTO_SAMPLE.some((sample) => sample.id === photo.id)
                      )}
                    />
                  ))}
                </div>
              </main>
              <aside className="border-t p-5 md:border-t-0 md:border-l">
                <h2 className="font-semibold">수신자 행동</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  ECOYA 계정 없이 승인된 범위만 확인합니다.
                </p>
                <Button
                  className="mt-5 w-full"
                  disabled={
                    acknowledged ||
                    publicLinkBusy ||
                    Boolean(publicData?.cross_border && !consentAccepted)
                  }
                  onClick={acknowledgeReport}
                >
                  {acknowledged ? (
                    <>
                      <Check /> 수령 확인됨
                    </>
                  ) : publicLinkBusy ? (
                    <>
                      <RefreshCw className="animate-spin" /> 기록 중
                    </>
                  ) : (
                    "수령 확인"
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => void toggleDispute()}
                >
                  <MessageSquareWarning /> 이의제기
                </Button>
                {disputeOpen ? (
                  <div className="mt-3 space-y-3 rounded-md border p-3">
                    {disputeStatus?.dispute ? (
                      <div className="text-sm">
                        <div className="font-medium">접수된 이의제기</div>
                        <p className="mt-1 text-muted-foreground">
                          {disputeStatus.dispute.summary}
                        </p>
                      </div>
                    ) : (
                      <>
                        <Select value={disputeReason} onValueChange={(value) => value && setDisputeReason(value)}>
                          <SelectTrigger aria-label="이의제기 사유">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_our_work">당사 작업이 아님</SelectItem>
                            <SelectItem value="wrong_scope">작업 범위가 다름</SelectItem>
                            <SelectItem value="wrong_evidence">증거가 잘못됨</SelectItem>
                            <SelectItem value="customer_rejected">고객 검수 반려</SelectItem>
                            <SelectItem value="other">기타</SelectItem>
                          </SelectContent>
                        </Select>
                        <Textarea
                          value={disputeSummary}
                          onChange={(event) => setDisputeSummary(event.target.value)}
                          placeholder="문제가 되는 내용과 근거를 입력해 주세요."
                        />
                        <Button
                          size="sm"
                          className="w-full"
                          disabled={publicLinkBusy || disputeStatus?.can_file === false}
                          onClick={() => void submitDispute()}
                        >
                          이의제기 접수
                        </Button>
                      </>
                    )}
                  </div>
                ) : null}
                <div className="mt-6 rounded-md bg-sidebar p-3 text-xs leading-5 text-muted-foreground">
                  링크 만료 {publicData?.expires_at?.slice(0, 10) || "2026.08.07"} · 조회{" "}
                  {publicData?.view_count ?? 2}/{publicData?.max_views ?? 10}
                  {publicData?.download_limit_reached ? " · 다운로드 한도 도달" : ""}
                </div>
                {publicLinkMessage ? (
                  <p className="mt-3 text-xs text-muted-foreground">{publicLinkMessage}</p>
                ) : null}
              </aside>
            </div>
          ) : publicLinkState === "password" ? (
            <div className="mx-auto flex min-h-[480px] max-w-md items-center p-6">
              <Card className="w-full rounded-md shadow-none">
                <CardHeader>
                  <span className="flex size-10 items-center justify-center rounded-md bg-sidebar">
                    <LockKeyhole className="size-5" />
                  </span>
                  <CardTitle className="pt-2">보호된 리포트입니다</CardTitle>
                  <CardDescription>전달받은 비밀번호를 입력해 주세요.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    type="password"
                    value={publicLinkPassword}
                    onChange={(event) => setPublicLinkPassword(event.target.value)}
                    placeholder="비밀번호"
                  />
                  <Button
                    className="w-full"
                    disabled={!publicLinkPassword.trim() || publicLinkBusy}
                    onClick={() => void openProtectedReport()}
                  >
                    {publicLinkBusy ? <RefreshCw className="animate-spin" /> : <LockKeyhole />}
                    리포트 열기
                  </Button>
                  {publicLinkMessage ? (
                    <p className="ui-status-danger text-sm">{publicLinkMessage}</p>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="mx-auto flex min-h-[480px] max-w-lg items-center p-6 text-center">
              <div className="w-full">
                <span className="ui-status-danger mx-auto flex size-12 items-center justify-center rounded-md">
                  <ShieldAlert />
                </span>
                <h1 className="mt-4 text-xl font-semibold">
                  {publicLinkState === "expired"
                    ? "링크가 만료되었습니다"
                    : publicLinkState === "revoked"
                      ? "링크가 회수되었습니다"
                      : "리포트를 불러오지 못했습니다"}
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {publicLinkState === "error"
                    ? publicLinkMessage || "네트워크 상태를 확인한 뒤 다시 시도해 주세요."
                    : "이 링크로는 리포트를 열 수 없습니다. 담당자에게 새 링크를 요청할 수 있습니다."}
                </p>
                <Button
                  className="mt-5"
                  variant="outline"
                  disabled={publicLinkBusy}
                  onClick={
                    publicLinkState === "error"
                      ? () => window.location.reload()
                      : requestNewPublicLink
                  }
                >
                  {publicLinkBusy ? (
                    <RefreshCw className="animate-spin" />
                  ) : publicLinkState === "error" ? (
                    <RefreshCw />
                  ) : (
                    <Send />
                  )}
                  {publicLinkState === "error" ? "다시 시도" : "새 링크 요청"}
                </Button>
                {publicLinkMessage ? (
                  <p className="mt-3 text-sm text-muted-foreground">{publicLinkMessage}</p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (screen === "SC-15") {
    const valid = integrityHash.length >= 8
    const verifyIntegrity = async () => {
      setIntegrityBusy(true)
      setIntegrityMessage("")
      setIntegrityResult(null)
      try {
        if (snapApiConfigured) {
          setIntegrityResult(
            await snapReportApi.verifyIntegrity(integrityHash.trim())
          )
        } else {
          setIntegrityResult({
            verified: true,
            hash_prefix: integrityHash.trim().slice(0, 12),
            watermarked: true,
            evidence_level: "human_reviewed",
            captured_at: "2026-07-31T14:28:00+09:00",
            site_name: "Busan Yard #24-118",
            issuer_name: "ECOYA SNAP Demo",
          })
        }
      } catch (reason) {
        setIntegrityMessage(reason instanceof Error ? reason.message : "등록 정보를 확인하지 못했습니다.")
      } finally {
        setIntegrityBusy(false)
      }
    }
    return (
      <div className="mx-auto flex min-h-[calc(100vh-108px)] w-full max-w-2xl items-center px-5 py-10">
        <div className="w-full">
          <ScreenHeading
            eyebrow="공개 무결성 확인"
            title="증거 해시를 확인하세요"
            description="내부 ID나 원본 위치를 공개하지 않고 등록 여부와 공개 검증 정보만 표시합니다."
          />
          <div className="mt-6 flex gap-2">
            <Input
              value={integrityHash}
              onChange={(event) => setHash(event.target.value)}
              placeholder="8자 이상의 해시"
            />
            <Button disabled={!valid || integrityBusy} onClick={() => void verifyIntegrity()}>
              {integrityBusy ? <RefreshCw className="animate-spin" /> : <Search />}
              조회
            </Button>
          </div>
          {integrityResult?.verified === true ? (
            <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center gap-2 font-semibold text-emerald-800">
                <ShieldCheck /> 등록된 증거입니다
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">해시</dt>
                  <dd className="font-medium">
                    {integrityResult.hash_prefix || integrityHash.slice(0, 12)}…
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">증거 수준</dt>
                  <dd className="font-medium">
                    {integrityResult.evidence_level || "정보 없음"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">촬영시각</dt>
                  <dd>
                    {integrityResult.captured_at
                      ? new Date(integrityResult.captured_at).toLocaleString("ko-KR")
                      : "정보 없음"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">워터마크</dt>
                  <dd>
                    {integrityResult.watermarked === true
                      ? "적용"
                      : integrityResult.watermarked === false
                        ? "미적용"
                        : "정보 없음"}
                  </dd>
                </div>
                {integrityResult.site_name ? (
                  <div>
                    <dt className="text-muted-foreground">현장</dt>
                    <dd>{integrityResult.site_name}</dd>
                  </div>
                ) : null}
                {integrityResult.issuer_name ? (
                  <div>
                    <dt className="text-muted-foreground">발행 조직</dt>
                    <dd>{integrityResult.issuer_name}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : integrityResult?.verified === false ? (
            <StateBanner
              tone="warning"
              title="등록된 증거를 찾지 못했습니다"
              description="입력한 해시와 일치하는 공개 검증 기록이 없습니다. 원본 보고서의 해시를 다시 확인해 주세요."
            />
          ) : integrityMessage ? (
            <StateBanner
              tone="danger"
              title="등록 정보를 확인하지 못했습니다"
              description={integrityMessage}
            />
          ) : valid ? (
            <StateBanner
              tone="info"
              title="조회할 준비가 되었습니다"
              description="조회 버튼을 누르면 공개 무결성 API에서 등록 여부를 확인합니다."
            />
          ) : (
            <StateBanner
              tone="warning"
              title="해시가 너무 짧습니다"
              description="8자 이상 입력해야 조회를 시작합니다."
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <ScreenHeading
        eyebrow="개발·QA 전용"
        title="리포트 표현 미리보기"
        description="승인 콘텐츠 fixture와 브랜딩 revision을 분리해 동일한 표현 계약을 점검합니다."
        action={
          <Button variant="outline" onClick={() => navigate("SC-14")}>
            <Eye /> 고객 화면 보기
          </Button>
        }
      />
      <div className="mt-6 grid gap-5 lg:grid-cols-[280px_1fr]">
        <Card className="rounded-md shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Fixture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select defaultValue="v3">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="v3">승인 콘텐츠 v3</SelectItem>
                <SelectItem value="legacy">Legacy snapshot 누락</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="current">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">현재 브랜딩 r18</SelectItem>
                <SelectItem value="fallback">로고 손상 fallback</SelectItem>
              </SelectContent>
            </Select>
            <div className="rounded-md bg-sidebar p-3 text-xs">
              <div>content_digest</div>
              <strong>sha256:f88a…39d</strong>
              <div className="mt-2">branding_revision</div>
              <strong>r18</strong>
            </div>
          </CardContent>
        </Card>
        <ReportPaper />
        <div className="lg:col-span-2">
          <StateBanner
            tone="success"
            title="5개 artifact 계약 일치"
            description="HTML·PDF·package·ZIP·media가 같은 콘텐츠 cutoff와 현재 브랜딩 revision을 사용합니다."
          />
        </div>
      </div>
    </div>
  )
}

const REPORT_PHOTO_OPTIONS = [
  { id: "EV-2081", label: "외관 정면", note: "휴대폰 세로 사진", total: 10, tone: "bg-slate-300" },
  { id: "EV-2082", label: "봉인 번호", note: "휴대폰 세로 사진", total: 15, tone: "bg-primary/15" },
  { id: "EV-2083", label: "적재 전", note: "휴대폰 세로 사진", total: 8, tone: "bg-amber-200" },
  { id: "EV-2084", label: "적재 후", note: "휴대폰 세로 사진", total: 6, tone: "bg-emerald-200" },
] as const

const REPORT_PHOTO_IMAGE_SOURCES: Record<string, readonly string[]> = {
  "EV-2081": [
    "/snap-report/exterior-front.jpg",
    "/snap-report/exterior-side.jpg",
  ],
  "EV-2082": ["/snap-report/seal.jpg"],
  "EV-2083": ["/snap-report/loading-before.jpg"],
  "EV-2084": ["/snap-report/loading-after.jpg"],
}

const REPORT_PHOTO_MEDIA = REPORT_PHOTO_OPTIONS.flatMap((group) =>
  Array.from({ length: group.total }, (_, index) => ({
    id: `${group.id}-${index + 1}`,
    groupId: group.id,
    label: group.label,
    note: group.note,
    index: index + 1,
    tone: group.tone,
    src: REPORT_PHOTO_IMAGE_SOURCES[group.id]?.[index % (REPORT_PHOTO_IMAGE_SOURCES[group.id]?.length || 1)],
  }))
)

const REPORT_PHOTO_SECTIONS = [
  {
    id: "seal",
    label: "봉인 번호",
    note: "봉인 상태와 번호를 확인합니다.",
    groupIds: ["EV-2082"],
  },
  {
    id: "exterior",
    label: "외관 4면",
    note: "외관 정면·측면 사진을 확인합니다.",
    groupIds: ["EV-2081"],
  },
  {
    id: "loading",
    label: "적재 전·후",
    note: "적재 전과 적재 후 사진을 함께 확인합니다.",
    groupIds: ["EV-2083", "EV-2084"],
  },
] as const

function getReportPhotoSectionMedia(
  section: (typeof REPORT_PHOTO_SECTIONS)[number]
) {
  return REPORT_PHOTO_MEDIA.filter((photo) =>
    (section.groupIds as readonly string[]).includes(photo.groupId)
  )
}

const REPORT_PHOTO_SAMPLE = REPORT_PHOTO_SECTIONS.flatMap((section) =>
  section.groupIds.flatMap((groupId) =>
    REPORT_PHOTO_MEDIA.filter((photo) => photo.groupId === groupId).slice(0, 2)
  )
)

function ReportPhotoThumb({
  label,
  index,
  tone,
  src,
  selected = false,
  onClick,
}: {
  label: string
  index: number
  tone: string
  src?: string
  selected?: boolean
  onClick?: () => void
}) {
  const content = (
    <div
      className={cn(
        "relative aspect-square overflow-hidden rounded-sm border bg-neutral-100 text-neutral-600",
        selected && "ring-2 ring-primary ring-offset-1"
      )}
    >
      {src ? (
        <img
          src={src}
          alt={`${label} ${index}번 사진`}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <>
          <div className={cn("absolute inset-0 opacity-80", tone)} />
          <div className="absolute inset-x-1.5 top-1.5 h-1/3 rounded-sm bg-white/35" />
          <div className="relative flex h-full flex-col items-center justify-center gap-1 p-1 text-center">
            <Camera className="size-3.5" />
            <span className="max-w-full truncate text-[9px] font-medium">
              {label}
            </span>
          </div>
        </>
      )}
      {src ? (
        <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1 py-0.5 text-center text-[9px] font-medium text-white">
          {label}
        </span>
      ) : null}
      <span className="absolute right-1 bottom-1 rounded bg-black/55 px-1 text-[9px] text-white">
        {index}
      </span>
      {selected ? (
        <CheckCircle2 className="absolute top-1 right-1 size-3.5 rounded-full bg-white text-primary" />
      ) : null}
    </div>
  )

  return onClick ? (
    <button
      type="button"
      className="block w-full rounded-sm text-left"
      aria-label={`${label} ${index}번 사진 ${selected ? "선택됨" : "선택"}`}
      onClick={onClick}
    >
      {content}
    </button>
  ) : (
    content
  )
}

function ReportPhotoSectionBlock({
  section,
  photos,
}: {
  section: (typeof REPORT_PHOTO_SECTIONS)[number]
  photos: readonly (typeof REPORT_PHOTO_MEDIA)[number][]
}) {
  return (
    <div
      className={cn(
        "rounded-md border bg-white p-2",
        photos.length > 2 && "sm:col-span-2"
      )}
    >
      <div className="min-w-0 px-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 break-words text-sm font-medium">
            {section.label}
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {photos.length}장
          </span>
        </div>
        <div className="mt-0.5 break-words text-xs leading-4 text-muted-foreground">
          {section.note}
        </div>
      </div>
      {photos.length > 0 ? (
        <div
          className={cn(
            "mt-2 grid w-full gap-2",
            photos.length >= 4
              ? "grid-cols-2 sm:grid-cols-4"
              : "grid-cols-2"
          )}
        >
          {photos.map((photo) => (
            <ReportPhotoThumb
              key={photo.id}
              label={photo.label}
              index={photo.index}
              tone={photo.tone}
              src={photo.src}
            />
          ))}
        </div>
      ) : (
        <div className="mt-2 rounded-sm border border-dashed p-3 text-center text-xs text-muted-foreground">
          선택된 사진이 없습니다.
        </div>
      )}
    </div>
  )
}

function ReportPaper({
  title = "Loading Inspection",
  selectedPhotos = REPORT_PHOTO_SAMPLE.map((photo) => photo.id),
  customerMessage = "",
}: {
  title?: string
  selectedPhotos?: readonly string[]
  customerMessage?: string
}) {
  const photos = REPORT_PHOTO_MEDIA.filter((photo) => selectedPhotos.includes(photo.id))

  return (
    <div className="mx-auto min-h-[560px] w-full max-w-2xl border bg-white p-7 text-neutral-900 shadow-sm sm:p-10">
      <div className="text-xs font-semibold text-primary">
        APPROVED FIELD REPORT
      </div>
      <div className="mt-3 flex items-start justify-between gap-5">
        <h2 className="min-w-0 text-2xl font-semibold">{title}</h2>
        <div className="text-right text-xs text-neutral-500">
          ECOYA Demo Co.
          <br />
          2026.07.31
        </div>
      </div>
      <Separator className="my-7" />
      <div className="grid gap-5 text-sm sm:grid-cols-2">
        <div>
          <div className="text-neutral-500">고객</div>
          <strong>Hanbit Trading Co.</strong>
        </div>
        <div>
          <div className="text-neutral-500">작업</div>
          <strong>Busan Yard #24-118</strong>
        </div>
        <div>
          <div className="text-neutral-500">결론</div>
          <strong>요청 범위 충족</strong>
        </div>
        <div>
          <div className="text-neutral-500">증거</div>
          <strong>사진 {photos.length} · 영상 1</strong>
        </div>
      </div>
      {customerMessage.trim() ? (
        <div className="mt-7 rounded-md border border-primary/15 bg-primary/5 p-4">
          <div className="text-xs font-semibold text-primary">고객 메시지</div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
            {customerMessage}
          </p>
        </div>
      ) : null}
      <div className="mt-8 grid gap-2 sm:grid-cols-2">
        {REPORT_PHOTO_SECTIONS.map((section) => (
          <ReportPhotoSectionBlock
            key={section.id}
            section={section}
            photos={getReportPhotoSectionMedia(section).filter((photo) =>
              selectedPhotos.includes(photo.id)
            )}
          />
        ))}
      </div>
    </div>
  )
}

const MANAGER_NAV: Array<{
  key: SnapScreenKey
  label: string
  icon: typeof LayoutDashboard
}> = [
  { key: "SC-17", label: "대시보드", icon: LayoutDashboard },
  { key: "SC-18", label: "작업", icon: ClipboardList },
  { key: "SC-22", label: "보고서", icon: FileText },
  { key: "SC-23", label: "증거", icon: FileImage },
  { key: "SC-24", label: "고객", icon: Building2 },
  { key: "SC-25", label: "캘린더", icon: CalendarDays },
  { key: "SC-26", label: "워크플로", icon: Workflow },
  { key: "SC-27", label: "ERP 인계", icon: Database },
  { key: "SC-28", label: "작업자", icon: Users },
  { key: "SC-29", label: "시정조치", icon: ShieldAlert },
  { key: "SC-30", label: "설정", icon: Settings2 },
]

function ManagerPrototype({
  screen,
  navigate,
  routeParams,
  routeSearch,
  showNavigation = true,
}: PrototypeScreenProps & { showNavigation?: boolean }) {
  return (
    <div
      className={cn(
        "grid min-h-[calc(100vh-108px)]",
        showNavigation && "md:grid-cols-[200px_minmax(0,1fr)]"
      )}
    >
      {showNavigation ? (
        <aside className="hidden border-r bg-sidebar/60 p-3 md:block">
          <div className="px-2 py-3">
            <div className="font-semibold">한빛 물류</div>
            <div className="text-xs text-muted-foreground">SNAP 운영</div>
          </div>
          <nav className="mt-3 space-y-1">
            {MANAGER_NAV.map((item) => (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm",
                  item.key === screen
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/70"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>
      ) : null}
      <main className="min-w-0 overflow-hidden">
        {showNavigation ? (
          <div className="field-scrollbar flex gap-1 overflow-x-auto border-b px-4 py-2 md:hidden">
            {MANAGER_NAV.map((item) => (
              <Button
                key={item.key}
                size="sm"
                variant={item.key === screen ? "secondary" : "ghost"}
                className="shrink-0"
                onClick={() => navigate(item.key)}
              >
                <item.icon />
                {item.label}
              </Button>
            ))}
          </div>
        ) : null}
        <ManagerContent
          screen={screen}
          navigate={navigate}
          routeParams={routeParams}
          routeSearch={routeSearch}
        />
      </main>
    </div>
  )
}

const SNAP_OPERATIONS_SCREENS = new Set<SnapScreenKey>([
  "SC-17",
  "SC-18",
  "SC-25",
  "SC-26",
  "SC-27",
  "SC-29",
])

function ManagerContent(props: PrototypeScreenProps) {
  if (props.screen === "SC-19" || props.screen === "SC-20") {
    return (
      <SnapTaskWorkspace
        screen={props.screen}
        navigate={props.navigate}
        routeParams={props.routeParams}
      />
    )
  }

  if (props.screen === "SC-22") {
    return (
      <SnapReportsPage
        navigate={props.navigate}
        routeSearch={props.routeSearch}
      />
    )
  }

  if (SNAP_OPERATIONS_SCREENS.has(props.screen)) {
    return <SnapOperationsPage screen={props.screen} navigate={props.navigate} />
  }

  return <LegacyManagerContent {...props} />
}

function LegacyManagerContent({
  screen,
  navigate,
  routeParams,
}: PrototypeScreenProps) {
  const [taskState, setTaskState] = useState("review")
  const [reportState, setReportState] = useState<
    "review" | "rejected" | "approved"
  >("review")
  const [reportRejectReason, setReportRejectReason] = useState("")
  const [deliveryOpen, setDeliveryOpen] = useState(false)
  const [createdReportLink, setCreatedReportLink] =
    useState<ShareLinkLifecycle | null>(null)
  const [reportLinkBusy, setReportLinkBusy] = useState(false)
  const [reportLinkError, setReportLinkError] = useState("")
  const [reportTitle, setReportTitle] = useState("Loading Inspection")
  const [customerMessage, setCustomerMessage] = useState(
    "요청하신 범위의 현장 검수를 완료했습니다. 첨부 증거와 결과를 확인해 주세요."
  )
  const [selectedReportPhotos, setSelectedReportPhotos] = useState<string[]>(
    REPORT_PHOTO_SAMPLE.map((photo) => photo.id)
  )
  const [selectedEvidence, setSelectedEvidence] = useState("EV-2081")
  const [evidenceReview, setEvidenceReview] = useState<
    Record<string, "pending" | "confirmed" | "rejected">
  >({
    "EV-2081": "confirmed",
    "EV-2082": "confirmed",
    "EV-2083": "pending",
  })
  const [evidenceApproved, setEvidenceApproved] = useState(false)
  const [workflowStep, setWorkflowStep] = useState("review")
  const [createPhase, setCreatePhase] = useState<
    "request" | "clarify" | "scope" | "review"
  >("request")
  const [createRequest, setCreateRequest] = useState(
    "8월 3일 부산 CY에서 HMM 컨테이너의 외관, 봉인 번호와 적재 상태를 확인해줘"
  )
  const [createLocation, setCreateLocation] = useState("Busan CY")
  const [dispatchMode, setDispatchMode] = useState<"member" | "link">("member")
  const [workerAssigned, setWorkerAssigned] = useState(false)
  const [fieldLinkCreated, setFieldLinkCreated] = useState(false)
  const reportTaskId =
    routeParams?.id ||
    (import.meta.env.VITE_SNAP_DEMO_TASK_ID as string | undefined) ||
    ""
  const [reportWorkspace, setReportWorkspace] =
    useState<SnapJsonRecord | null>(null)
  const [liveCustomerReport, setLiveCustomerReport] =
    useState<SnapJsonRecord | null>(null)
  const [reportResourceState, setReportResourceState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle")
  const [reportResourceError, setReportResourceError] = useState("")
  const [reportMutationBusy, setReportMutationBusy] = useState(false)
  const [reportContentSaved, setReportContentSaved] = useState(false)
  const [reportRejectionSaved, setReportRejectionSaved] = useState(false)
  const [reportReloadVersion, setReportReloadVersion] = useState(0)

  useEffect(() => {
    if (screen !== "SC-21") return

    let cancelled = false
    void (async () => {
      await Promise.resolve()
      if (cancelled) return
      setReportResourceError("")
      setReportContentSaved(false)
      setReportRejectionSaved(false)

      if (!snapApiConfigured) {
        setReportResourceState("ready")
        setLiveCustomerReport(null)
        return
      }

      if (!reportTaskId) {
        setReportResourceState("error")
        setReportResourceError(
          "업무 ID가 없어 보고서 작업공간을 불러올 수 없습니다. 업무 상세에서 다시 열어 주세요."
        )
        return
      }

      setReportResourceState("loading")
      try {
        const workspaceResponse = await snapApi.reports.workspace(reportTaskId)
        if (cancelled) return
        const workspace =
          asSnapRecord(workspaceResponse.data) ?? workspaceResponse
        setReportWorkspace(workspace)

        const task = asSnapRecord(workspace.task)
        const instruction = asSnapRecord(task?.human_instruction)
        const sourceTitle =
          snapString(instruction, "title") ||
          snapString(task, "title", "task_type")
        if (sourceTitle) setReportTitle(sourceTitle)

        const reports = snapRecordArray(workspace.reports)
        const customerReport =
          reports.find(
            (report) =>
              snapString(report, "report_type", "version_type") === "customer"
          ) ?? null
        const reportId = snapString(customerReport, "id", "report_id")
        let hydratedReport = customerReport

        if (reportId) {
          const detailResponse = await snapApi.reports.get(reportId)
          if (cancelled) return
          const detailReport =
            asSnapRecord(detailResponse.report) ?? detailResponse
          hydratedReport = {
            ...customerReport,
            ...detailReport,
            versions: detailResponse.versions,
            id: reportId,
          }
          const sections = snapReportSections(hydratedReport)
          const savedMessage = snapString(sections, "customer_message")
          if (savedMessage) setCustomerMessage(savedMessage)

          try {
            const links = await snapReportApi.listReportLinks(reportId)
            if (!cancelled) {
              setCreatedReportLink(
                links.find((link) => link.status === "active") ?? links[0] ?? null
              )
            }
          } catch {
            if (!cancelled) setCreatedReportLink(null)
          }
        }

        if (cancelled) return
        setLiveCustomerReport(hydratedReport)
        setReportState(
          snapReportStatus(snapString(hydratedReport, "status"))
        )
        setReportResourceState("ready")
      } catch (reason) {
        if (cancelled) return
        setReportResourceState("error")
        setReportResourceError(
          reason instanceof Error
            ? reason.message
            : "보고서 작업공간을 불러오지 못했습니다."
        )
      }
    })()

    return () => {
      cancelled = true
    }
  }, [reportReloadVersion, reportTaskId, screen])

  if (screen === "SC-17") {
    return (
      <ManagerPage
        title="오늘의 운영"
        description="확인이 필요한 예외와 다음 행동을 먼저 봅니다."
        action={
          <Button onClick={() => navigate("SC-19")}>
            <Plus /> 작업 만들기
          </Button>
        }
      >
        <MetricStrip
          items={[
            { label: "검토 대기", value: "6건", note: "2건 긴급", tone: "red" },
            { label: "현장 진행", value: "12건", note: "정상", tone: "green" },
            {
              label: "전달 대기",
              value: "4건",
              note: "승인 필요",
              tone: "amber",
            },
            { label: "시정조치", value: "2건", note: "기한 임박", tone: "red" },
          ]}
        />
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="rounded-md shadow-none">
            <CardHeader>
              <CardTitle className="text-base">우선 처리</CardTitle>
              <CardDescription>
                사람의 결정이 필요한 작업만 표시합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                ["부산 CY 적재 검수", "필수 사진 1장 누락", "재촬영 요청"],
                ["인천 창고 하역", "고객 리포트 승인 대기", "검토하기"],
                ["광양 봉인 확인", "외부 업로드 실패 1건", "복구하기"],
              ].map((row) => (
                <button
                  key={row[0]}
                  onClick={() => navigate("SC-20")}
                  className="flex w-full items-center gap-3 border-b py-3 text-left last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{row[0]}</div>
                    <div className="text-sm text-muted-foreground">
                      {row[1]}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-primary">
                    {row[2]}
                  </span>
                  <ChevronRight className="size-4" />
                </button>
              ))}
            </CardContent>
          </Card>
          <Card className="rounded-md shadow-none">
            <CardHeader>
              <CardTitle className="text-base">작업 흐름</CardTitle>
              <CardDescription>최근 7일</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ["확정", 92],
                ["배정", 84],
                ["제출", 68],
                ["검토", 52],
                ["전달", 41],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>{label}</span>
                    <span>{value}%</span>
                  </div>
                  <Progress value={Number(value)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </ManagerPage>
    )
  }

  if (screen === "SC-18") {
    const taskRows = [
      [
        "부산 CY 적재 검수",
        "검토 대기",
        "김민지",
        "오늘",
        "증거 검토",
      ],
      ["인천 창고 하역", "현장 진행", "박서윤", "내일", "진행 확인"],
      ["광양 봉인 확인", "승인 대기", "이도현", "D-2", "리포트 승인"],
      ["울산 외관 점검", "배정됨", "최지우", "D-3", "작업 열기"],
    ] as const

    return (
      <ManagerPage
        title="작업"
        description="상태, 담당자, 고객과 기한으로 작업을 찾고 다음 행동으로 이동합니다."
        action={
          <Button onClick={() => navigate("SC-19")}>
            <Plus /> 작업 만들기
          </Button>
        }
      >
        <MetricStrip
          items={[
            { label: "전체 작업", value: `${taskRows.length}건` },
            {
              label: "진행 중",
              value: `${taskRows.filter((row) => row[1] === "현장 진행" || row[1] === "배정됨").length}건`,
              tone: "blue",
            },
            {
              label: "검토·승인 대기",
              value: `${taskRows.filter((row) => row[1].includes("대기")).length}건`,
              tone: "amber",
            },
            { label: "완료", value: "0건", tone: "green" },
          ]}
        />
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="작업명, 고객, 담당자 검색" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="review">검토 대기</SelectItem>
              <SelectItem value="field">현장 진행</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-5 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>작업</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="hidden md:table-cell">담당자</TableHead>
                <TableHead className="hidden sm:table-cell">기한</TableHead>
                <TableHead>다음 행동</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taskRows.map((row) => (
                <TableRow
                  key={row[0]}
                  className="cursor-pointer"
                  onClick={() => navigate("SC-20")}
                >
                  <TableCell>
                    <div className="font-medium">{row[0]}</div>
                    <div className="text-xs text-muted-foreground">
                      TK-2026-08-{row[2].length}1
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      tone={row[1].includes("대기") ? "amber" : "blue"}
                    >
                      {row[1]}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {row[2]}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {row[3]}
                  </TableCell>
                  <TableCell className="font-medium text-primary">
                    {row[4]}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ManagerPage>
    )
  }

  if (screen === "SC-19") {
    const phases = [
      ["request", "요청 입력"],
      ["clarify", "확인 질문"],
      ["scope", "범위 확인"],
      ["review", "최종 확정"],
    ] as const
    const phaseIndex = phases.findIndex(([key]) => key === createPhase)

    return (
      <ManagerPage
        title="새 작업 만들기"
        description="자연어 요청을 확인 질문과 범위 검토를 거쳐 현장 작업으로 확정합니다."
      >
        <div className="mb-6 grid grid-cols-4 overflow-hidden rounded-xl border bg-muted/30">
          {phases.map(([key, label], index) => (
            <div
              key={key}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-1 border-r px-1 py-2 text-center last:border-r-0 sm:flex-row sm:justify-start sm:gap-2 sm:px-3 sm:py-3 sm:text-left",
                index === phaseIndex && "bg-background font-medium",
                index < phaseIndex && "text-emerald-700"
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs",
                  index === phaseIndex && "bg-primary text-primary-foreground",
                  index < phaseIndex && "bg-emerald-100 text-emerald-700"
                )}
              >
                {index < phaseIndex ? <Check className="size-3" /> : index + 1}
              </span>
              <span className="text-[10px] leading-tight whitespace-nowrap sm:text-sm">
                {label}
              </span>
            </div>
          ))}
        </div>
        <div
          className={cn(
            "grid gap-6",
            createPhase === "request"
              ? "mx-auto max-w-4xl"
              : "lg:grid-cols-[minmax(0,1fr)_340px]"
          )}
        >
          <div className="space-y-5">
            {createPhase === "request" ? (
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle>현장 요청 입력</CardTitle>
                  <CardDescription>
                    확인할 내용과 장소를 적으면 작업 범위와 필수 증거를
                    구성합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="w-full text-xs font-semibold text-muted-foreground">
                      빠른 시작
                    </span>
                    {[
                      [
                        "적재 검수",
                        "부산 CY에서 컨테이너 번호, 봉인 번호, 외관과 적재 완료 상태를 확인해줘",
                      ],
                      [
                        "입고 검수",
                        "인천 창고에서 입고 수량, 포장 손상과 라벨을 확인해줘",
                      ],
                      [
                        "선적 증빙",
                        "광양항에서 선박명, 컨테이너 번호와 선적 완료 상태를 증빙해줘",
                      ],
                    ].map(([label, request]) => (
                      <Button
                        key={label}
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => setCreateRequest(request)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      무엇을 확인해야 하나요?
                    </label>
                    <Textarea
                      rows={7}
                      value={createRequest}
                      onChange={(event) => setCreateRequest(event.target.value)}
                      className="min-h-40 resize-y text-base leading-7"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      고객, 장소, 기한을 문장에 함께 적으면 확인 질문이
                      줄어듭니다.
                    </p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      현장 위치
                    </label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={createLocation}
                        onChange={(event) =>
                          setCreateLocation(event.target.value)
                        }
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Button
                    className="min-h-12 w-full rounded-xl"
                    disabled={!createRequest.trim() || !createLocation.trim()}
                    onClick={() => setCreatePhase("clarify")}
                  >
                    <Sparkles /> AI 작업 초안 만들기
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {createPhase === "clarify" ? (
              <Card className="rounded-md shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">범위 확인 질문</CardTitle>
                  <CardDescription>
                    작업 결과가 달라지는 질문만 답합니다. 나머지는 AI 제안을
                    사용합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      적재 상태는 어느 시점을 확인할까요?
                    </label>
                    <Select defaultValue="적재 완료 후">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="적재 완료 후">
                          적재 완료 후
                        </SelectItem>
                        <SelectItem value="적재 전·후 모두">
                          적재 전·후 모두
                        </SelectItem>
                        <SelectItem value="마지막 적재만">
                          마지막 적재만
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCreatePhase("request")}
                    >
                      이전
                    </Button>
                    <Button onClick={() => setCreatePhase("scope")}>
                      답변 반영
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {createPhase === "scope" ? (
              <Card className="rounded-md shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">작업 범위 확인</CardTitle>
                  <CardDescription>
                    작업자가 현장에서 수행할 항목과 필수 증거를 확정합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    ["컨테이너 번호", "사진 1장"],
                    ["봉인 번호", "근접 사진 1장"],
                    ["외관 4면", "사진 4장"],
                    ["적재 완료 상태", "전체 사진 1장"],
                  ].map(([label, evidence]) => (
                    <label
                      key={label}
                      className="flex items-center gap-3 rounded-md border p-3"
                    >
                      <Checkbox defaultChecked />
                      <span className="min-w-0 flex-1 text-sm font-medium">
                        {label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {evidence}
                      </span>
                    </label>
                  ))}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setCreatePhase("clarify")}
                    >
                      이전
                    </Button>
                    <Button onClick={() => setCreatePhase("review")}>
                      범위 확인
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {createPhase === "review" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      고객
                    </label>
                    <Select defaultValue="한빛무역">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="한빛무역">한빛무역</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      현장 위치
                    </label>
                    <Input defaultValue="Busan CY" />
                  </div>
                </div>
                <StateBanner
                  tone="success"
                  title="확정 가능한 작업 범위"
                  description="필수 확인 4개와 증거 7개가 준비되었습니다. 확정 전에는 작업자에게 보이지 않습니다."
                />
              </>
            ) : null}
          </div>
          {createPhase !== "request" ? (
            <Card className="h-fit rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">AI 작업 초안</CardTitle>
                <CardDescription>
                  확정 전에는 작업자에게 보이지 않습니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">현장</span>
                  <div className="font-medium">{createLocation}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">캡처</span>
                  <div className="font-medium">사진 6 · 영상 1</div>
                </div>
                <div>
                  <span className="text-muted-foreground">필수 항목</span>
                  <div className="font-medium">컨테이너 번호 · 봉인 · 외관</div>
                </div>
                <div>
                  <span className="text-muted-foreground">제출 기한</span>
                  <div className="font-medium">2026.08.03 18:00</div>
                </div>
                <Separator />
                {createPhase === "review" ? (
                  <Button className="w-full" onClick={() => navigate("SC-20")}>
                    <Check /> 작업 확정
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    확인 질문과 범위 검토를 마치면 작업을 확정할 수 있습니다.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </ManagerPage>
    )
  }

  if (screen === "SC-20") {
    const evidenceRows = [
      {
        id: "EV-2081",
        label: "봉인 번호",
        time: "14:20",
        location: "작업 위치 안",
      },
      {
        id: "EV-2082",
        label: "컨테이너 외관",
        time: "14:21",
        location: "작업 위치 안",
      },
      {
        id: "EV-2083",
        label: "적재 후 전체",
        time: "14:22",
        location: "120m 이탈",
      },
    ]
    const selectedEvidenceRow =
      evidenceRows.find((item) => item.id === selectedEvidence) ??
      evidenceRows[0]
    const pendingEvidenceCount = Object.values(evidenceReview).filter(
      (status) => status === "pending"
    ).length
    const rejectedEvidenceCount = Object.values(evidenceReview).filter(
      (status) => status === "rejected"
    ).length
    const canApproveEvidence =
      pendingEvidenceCount === 0 && rejectedEvidenceCount === 0

    return (
      <ManagerPage
        title="부산 CY 적재 검수"
        description="확정된 범위, 배정, 현장 제출과 사무 검토 상태를 한 곳에서 관리합니다."
        action={
          <Select
            value={taskState}
            onValueChange={(value) => value && setTaskState(value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="assigned">배정됨</SelectItem>
              <SelectItem value="field">현장 진행</SelectItem>
              <SelectItem value="review">검토 대기</SelectItem>
            </SelectContent>
          </Select>
        }
      >
        <Card className="mb-5 rounded-md shadow-none">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">현장 전달</CardTitle>
                <CardDescription>
                  앱을 쓰는 팀원에게 배정하거나 외부 작업자용 링크를 만듭니다.
                </CardDescription>
              </div>
              {taskState !== "review" ? (
                <div className="inline-flex rounded-md bg-muted p-1">
                  <Button
                    size="sm"
                    variant={dispatchMode === "member" ? "secondary" : "ghost"}
                    onClick={() => setDispatchMode("member")}
                  >
                    <Users /> 팀원 배정
                  </Button>
                  <Button
                    size="sm"
                    variant={dispatchMode === "link" ? "secondary" : "ghost"}
                    onClick={() => setDispatchMode("link")}
                  >
                    <Smartphone /> 외부 링크
                  </Button>
                </div>
              ) : (
                <StatusBadge tone="green">제출 완료</StatusBadge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {taskState === "review" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">
                    현장 담당자
                  </div>
                  <div className="mt-1 text-sm font-medium">
                    김민수 · 현장 작업자
                  </div>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">전달 기록</div>
                  <div className="mt-1 text-sm font-medium">
                    앱 배정 · 오늘 08:42
                  </div>
                </div>
              </div>
            ) : dispatchMode === "member" ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="mb-2 block text-sm font-medium">
                    현장 담당자
                  </label>
                  <Select defaultValue="minsu">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minsu">
                        김민수 · 현장 작업자
                      </SelectItem>
                      <SelectItem value="jieun">
                        박지은 · 현장 관리자
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  disabled={workerAssigned}
                  onClick={() => setWorkerAssigned(true)}
                >
                  {workerAssigned ? <Check /> : <Send />}
                  {workerAssigned ? "배정됨" : "작업 배정"}
                </Button>
              </div>
            ) : fieldLinkCreated ? (
              <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">
                    외부 작업 링크 · 활성
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    snap.ecoya.app/f/TK-260803-BUSAN · 8월 5일 만료
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFieldLinkCreated(false)}
                >
                  링크 해제
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    작업자 표시명
                  </label>
                  <Input placeholder="예: 부산 CY 협력기사" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    링크 만료
                  </label>
                  <Select defaultValue="48">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24시간</SelectItem>
                      <SelectItem value="48">48시간</SelectItem>
                      <SelectItem value="72">72시간</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => setFieldLinkCreated(true)}>
                  <Smartphone /> 링크 만들기
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_360px]">
          <Card className="rounded-md shadow-none">
            <CardHeader>
              <CardTitle className="text-base">작업 범위</CardTitle>
              <CardDescription>확정본 · 변경 시 재확인</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {["컨테이너 번호", "봉인 번호", "외관 4면", "적재 전·후"].map(
                (item, index) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2
                      className={cn(
                        "size-4",
                        index === 3 ? "text-amber-600" : "text-emerald-600"
                      )}
                    />
                    {item}
                  </div>
                )
              )}
              <Separator />
              <Button variant="outline" className="w-full">
                범위 변경 요청
              </Button>
            </CardContent>
          </Card>
          <div className="space-y-4">
            {evidenceApproved ? (
              <StateBanner
                tone="success"
                title="현장 증거 승인이 완료되었습니다"
                description="승인 당시의 증거가 고정되었고 고객 리포트 검토로 이동할 수 있습니다."
                action={
                  <Button
                    size="sm"
                    onClick={() =>
                      navigate("SC-21", {
                        params: {
                          id: routeParams?.id || "TASK-DEMO-001",
                        },
                      })
                    }
                  >
                    리포트 검토 <ArrowRight />
                  </Button>
                }
              />
            ) : (
              <StateBanner
                tone={rejectedEvidenceCount > 0 ? "danger" : "warning"}
                title={
                  rejectedEvidenceCount > 0
                    ? `재촬영 요청 ${rejectedEvidenceCount}개`
                    : `필수 증거 ${pendingEvidenceCount}개 확인 필요`
                }
                description={
                  rejectedEvidenceCount > 0
                    ? "반려한 증거가 다시 제출되어야 전체 승인과 리포트 생성을 진행할 수 있습니다."
                    : "적재 후 전체 사진의 촬영 위치가 작업 범위 밖입니다. 확인하거나 재촬영을 요청해 주세요."
                }
                action={
                  <Button
                    size="sm"
                    disabled={!canApproveEvidence}
                    onClick={() => setEvidenceApproved(true)}
                  >
                    <ShieldCheck /> 증거 전체 승인
                  </Button>
                }
              />
            )}
            {evidenceRows.map((item) => {
              const status = evidenceReview[item.id]
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedEvidence(item.id)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-md border p-3 text-left",
                    selectedEvidence === item.id &&
                      "border-primary bg-primary/5",
                    status === "rejected" && "border-red-300 bg-red-50"
                  )}
                >
                  <div className="size-16 shrink-0 rounded bg-muted" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.id} · 2026.08.03 {item.time}
                    </div>
                  </div>
                  <StatusBadge
                    tone={
                      status === "confirmed"
                        ? "green"
                        : status === "rejected"
                          ? "red"
                          : "amber"
                    }
                  >
                    {status === "confirmed"
                      ? "확인됨"
                      : status === "rejected"
                        ? "재촬영 요청"
                        : "확인 필요"}
                  </StatusBadge>
                </button>
              )
            })}
          </div>
          <Card className="h-fit rounded-md shadow-none">
            <CardHeader>
              <CardTitle className="text-base">선택 증거</CardTitle>
              <CardDescription>{selectedEvidenceRow.id}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-[4/3] rounded-md bg-muted" />
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">원본</dt>
                  <dd>보존됨</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">촬영시각</dt>
                  <dd>{selectedEvidenceRow.time}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">위치</dt>
                  <dd>{selectedEvidenceRow.location}</dd>
                </div>
              </dl>
              {evidenceReview[selectedEvidenceRow.id] === "rejected" ? (
                <p className="mt-4 rounded-md bg-red-50 p-3 text-xs text-red-700">
                  촬영 위치가 범위를 벗어났습니다. 동일 항목을 작업 위치에서
                  다시 촬영해 주세요.
                </p>
              ) : null}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  disabled={evidenceApproved}
                  onClick={() => {
                    setEvidenceApproved(false)
                    setEvidenceReview((current) => ({
                      ...current,
                      [selectedEvidenceRow.id]: "rejected",
                    }))
                  }}
                >
                  <RotateCcw /> 재촬영 요청
                </Button>
                <Button
                  disabled={evidenceApproved}
                  onClick={() =>
                    setEvidenceReview((current) => ({
                      ...current,
                      [selectedEvidenceRow.id]: "confirmed",
                    }))
                  }
                >
                  <Check /> 확인
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ManagerPage>
    )
  }

  if (screen === "SC-21") {
    const workspaceGates = asSnapRecord(reportWorkspace?.delivery_gates)
    const archiveOnly = workspaceGates?.archive_only === true
    const canCreateCustomerReport =
      workspaceGates?.can_create_customer_report !== false
    const canSendToCustomer = workspaceGates?.can_send_to_customer !== false
    const reportIsApproved = reportState === "approved"
    const reportId =
      snapString(liveCustomerReport, "id", "report_id") ||
      (!snapApiConfigured ? "RPT-DEMO-001" : "")
    const useLiveApi = snapApiConfigured && Boolean(reportId)

    const ensureCustomerReport = async () => {
      const existingId = snapString(
        liveCustomerReport,
        "id",
        "report_id"
      )
      if (existingId) return existingId
      if (!snapApiConfigured) return "RPT-DEMO-001"
      if (!reportTaskId) {
        throw new Error(
          "업무 ID가 없어 고객용 보고서를 만들 수 없습니다. 업무 상세에서 다시 열어 주세요."
        )
      }
      if (!canCreateCustomerReport) {
        throw new Error(
          "현재 업무 유형에서는 고객용 보고서를 직접 만들 수 없습니다. 자동 생성 상태를 확인해 주세요."
        )
      }

      const created = await snapApi.reports.create(reportTaskId, {
        version_type: "customer",
        locale: "ko",
      })
      const createdReport =
        asSnapRecord(created.report) ??
        asSnapRecord(created.data) ??
        created
      const createdId =
        snapString(createdReport, "id", "report_id") ||
        snapString(created, "report_id", "id")
      if (!createdId) {
        throw new Error("보고서 생성 응답에서 보고서 ID를 확인하지 못했습니다.")
      }

      setLiveCustomerReport({
        ...createdReport,
        id: createdId,
        report_type: "customer",
      })
      return createdId
    }

    const saveReportContent = async () => {
      if (reportMutationBusy) return
      setReportMutationBusy(true)
      setReportLinkError("")
      try {
        if (snapApiConfigured) {
          const currentId = await ensureCustomerReport()
          const corrected = await snapApi.reports.correct(currentId, {
            sections: { customer_message: customerMessage.trim() },
          })
          const correctedReport =
            asSnapRecord(corrected.report) ?? asSnapRecord(corrected)
          if (correctedReport) {
            setLiveCustomerReport((current) => ({
              ...(current ?? {}),
              ...correctedReport,
              id: currentId,
            }))
          }
        }
        setReportContentSaved(true)
        setReportRejectionSaved(false)
        setReportState("review")
      } catch (reason) {
        setReportLinkError(
          reason instanceof Error
            ? reason.message
            : "보고서 내용을 저장하지 못했습니다."
        )
      } finally {
        setReportMutationBusy(false)
      }
    }

    const approveCustomerReport = async () => {
      if (reportMutationBusy) return
      setReportMutationBusy(true)
      setReportLinkError("")
      try {
        if (snapApiConfigured) {
          const currentId = await ensureCustomerReport()
          await snapApi.reports.correct(currentId, {
            sections: { customer_message: customerMessage.trim() },
          })
          const preSend = await snapReportApi.preSendCheck(currentId, {
            channel: "link",
          })
          if (!preSend.ready_to_send) {
            throw new Error(
              preSend.blocking.length > 0
                ? `승인 전 확인 필요: ${preSend.blocking.join(" · ")}`
                : "승인 전 필수 조건을 확인해 주세요."
            )
          }
          const approved = await snapApi.reports.approve(currentId, {
            acknowledge_ai_review: true,
          })
          const approvedReport =
            asSnapRecord(approved.report) ?? asSnapRecord(approved)
          setLiveCustomerReport((current) => ({
            ...(current ?? {}),
            ...(approvedReport ?? {}),
            id: currentId,
            status: "approved",
          }))
        }
        setReportContentSaved(true)
        setReportRejectionSaved(false)
        setReportState("approved")
      } catch (reason) {
        setReportLinkError(
          reason instanceof Error
            ? reason.message
            : "보고서를 승인하지 못했습니다."
        )
      } finally {
        setReportMutationBusy(false)
      }
    }

    const rejectCustomerReport = async () => {
      const reason = reportRejectReason.trim()
      if (!reason || reportMutationBusy) return
      setReportMutationBusy(true)
      setReportLinkError("")
      try {
        if (snapApiConfigured) {
          const currentId = await ensureCustomerReport()
          await snapApi.reports.reject(currentId, { reason })
          setLiveCustomerReport((current) => ({
            ...(current ?? {}),
            id: currentId,
            status: "rejected",
          }))
        }
        setReportRejectionSaved(true)
        setReportContentSaved(false)
        setReportState("rejected")
      } catch (error) {
        setReportLinkError(
          error instanceof Error
            ? error.message
            : "반려 사유를 저장하지 못했습니다."
        )
      } finally {
        setReportMutationBusy(false)
      }
    }

    const createReportLink = async () => {
      if (!reportIsApproved || reportLinkBusy) return
      setReportLinkBusy(true)
      setReportLinkError("")
      try {
        if (!canSendToCustomer) {
          throw new Error(
            "현재 업무는 고객 전달이 차단되어 있습니다. 업무의 전달 게이트를 확인해 주세요."
          )
        }
        const currentId = await ensureCustomerReport()
        if (snapApiConfigured) {
          const preSend = await snapReportApi.preSendCheck(currentId, {
            channel: "link",
          })
          if (!preSend.ready_to_send) {
            throw new Error(
              preSend.blocking.length > 0
                ? `링크 생성 전 확인 필요: ${preSend.blocking.join(" · ")}`
                : "고객 전달 조건을 확인해 주세요."
            )
          }
        }
        const link = snapApiConfigured
          ? await snapReportApi.createCustomerViewLink(currentId, {
              locale: "ko",
              label: `${reportTitle} 고객 리포트`,
            })
          : demoShareLink(currentId)
        setCreatedReportLink(link)
      } catch (reason) {
        setReportLinkError(
          reason instanceof Error
            ? reason.message
            : "고객용 링크를 생성하지 못했습니다."
        )
      } finally {
        setReportLinkBusy(false)
      }
    }

    return (
      <>
        <ManagerPage
          title="고객 리포트 작성"
          description="내부 검토가 끝난 증거만 고객용 표현에 포함하고, 사람이 승인한 새 버전을 발행합니다."
          action={
            reportIsApproved ? (
              <Button
                disabled={reportLinkBusy || reportMutationBusy || archiveOnly}
                onClick={() =>
                  createdReportLink
                    ? setDeliveryOpen(true)
                    : void createReportLink()
                }
              >
                {reportLinkBusy ? (
                  <RefreshCw className="animate-spin" />
                ) : createdReportLink ? (
                  <Send />
                ) : (
                  <Link2 />
                )}
                {createdReportLink ? "고객에게 전달" : "고객용 링크 생성"}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={
                    reportMutationBusy ||
                    reportResourceState === "loading" ||
                    archiveOnly
                  }
                  onClick={() => setReportState("rejected")}
                >
                  반려
                </Button>
                <Button
                  disabled={
                    reportMutationBusy ||
                    reportResourceState === "loading" ||
                    archiveOnly
                  }
                  onClick={() => void approveCustomerReport()}
                >
                  {reportMutationBusy ? (
                    <RefreshCw className="animate-spin" />
                  ) : (
                    <ShieldCheck />
                  )}
                  리포트 승인
                </Button>
              </div>
            )
          }
        >
          {reportResourceState === "loading" ? (
            <StateBanner
              tone="info"
              title="보고서 작업공간을 불러오는 중입니다"
              description="업무, 증거, 고객용 보고서와 전달 게이트를 확인하고 있습니다."
            />
          ) : null}
          {reportResourceState === "error" ? (
            <div className="mb-5">
              <StateBanner
                tone="danger"
                title="보고서 작업공간을 불러오지 못했습니다"
                description={reportResourceError}
              />
              <Button
                className="mt-3"
                variant="outline"
                onClick={() => setReportReloadVersion((current) => current + 1)}
              >
                <RefreshCw /> 다시 시도
              </Button>
            </div>
          ) : null}
          {archiveOnly ? (
            <StateBanner
              tone="warning"
              title="이 업무는 보관 전용입니다"
              description="고객용 보고서를 새로 만들거나 전달하지 않습니다. 증빙 보관함에서 승인된 원본과 감사 이력을 확인해 주세요."
            />
          ) : null}
          {!archiveOnly && !canCreateCustomerReport && !reportId ? (
            <StateBanner
              tone="warning"
              title="고객용 보고서 자동 생성을 기다리고 있습니다"
              description="현재 업무 유형에서는 수동 생성이 허용되지 않습니다. 자동 생성 결과가 도착하면 이 화면에서 검토할 수 있습니다."
            />
          ) : null}
          {reportLinkError ? (
            <div className="mb-5">
              <StateBanner
                tone="danger"
                title="보고서 요청을 완료하지 못했습니다"
                description={reportLinkError}
              />
            </div>
          ) : null}
          <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
            <div className="space-y-4">
            <Card className="rounded-md shadow-none">
              <CardHeader>
                <CardTitle className="text-base">리포트 제목</CardTitle>
                <CardDescription>
                  고객 화면과 링크 전달에 함께 표시됩니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={reportTitle}
                  disabled={snapApiConfigured}
                  onChange={(event) => setReportTitle(event.target.value)}
                  placeholder="예: Loading Inspection"
                />
                {snapApiConfigured ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    보고서 제목은 업무 제목에서 가져옵니다. 업무 상세에서 변경해 주세요.
                  </p>
                ) : null}
              </CardContent>
            </Card>
            <Card className="rounded-md shadow-none">
              <CardHeader>
                <CardTitle className="text-base">포함할 증거</CardTitle>
                <CardDescription>승인 snapshot에 고정됩니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {["봉인 번호", "외관 4면", "적재 전·후"].map((item) => (
                  <label key={item} className="flex items-center gap-2 text-sm">
                    <Checkbox defaultChecked />
                    {item}
                  </label>
                ))}
              </CardContent>
            </Card>
            <Card className="rounded-md shadow-none">
              <CardHeader>
                <CardTitle className="text-base">표지 사진</CardTitle>
                <CardDescription>
                  사진 유형별 원본을 작은 크롭 썸네일로 확인하고, 리포트에 넣을 사진만 선택합니다. 원본은 보존됩니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {REPORT_PHOTO_SECTIONS.map((section) => {
                  const media = getReportPhotoSectionMedia(section)
                  const selectedCount = media.filter((photo) =>
                    selectedReportPhotos.includes(photo.id)
                  ).length
                  const allSelected = selectedCount === media.length

                  return (
                    <div key={section.id} className="rounded-md border p-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {section.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {selectedCount}/{media.length}장 선택 · {section.note}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="shrink-0 px-2 text-xs"
                          onClick={() =>
                            setSelectedReportPhotos((current) => {
                              const groupIds = media.map((photo) => photo.id)
                              return allSelected
                                ? current.filter((id) => !groupIds.includes(id))
                                : Array.from(new Set([...current, ...groupIds]))
                            })
                          }
                        >
                          {allSelected ? "전체 해제" : "전체 선택"}
                        </Button>
                      </div>
                      <div className="mt-2 grid grid-cols-5 gap-1.5">
                        {media.map((photo) => (
                          <ReportPhotoThumb
                            key={photo.id}
                            label={photo.label}
                            index={photo.index}
                            tone={photo.tone}
                            src={photo.src}
                            selected={selectedReportPhotos.includes(photo.id)}
                            onClick={() =>
                              setSelectedReportPhotos((current) =>
                                current.includes(photo.id)
                                  ? current.filter((id) => id !== photo.id)
                                  : [...current, photo.id]
                              )
                            }
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
                <div className="text-xs text-muted-foreground">
                  총 {selectedReportPhotos.length}장의 사진이 리포트에 포함됩니다.
                </div>
              </CardContent>
            </Card>
            <div>
              <label className="mb-2 block text-sm font-medium">
                고객 메시지
              </label>
              <Textarea
                rows={5}
                value={customerMessage}
                disabled={archiveOnly}
                onChange={(event) => {
                  setCustomerMessage(event.target.value)
                  setReportContentSaved(false)
                }}
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  {reportContentSaved
                    ? "현재 고객 메시지가 저장되었습니다."
                    : "변경한 메시지는 저장해야 승인본에 포함됩니다."}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={reportMutationBusy || archiveOnly}
                  onClick={() => void saveReportContent()}
                >
                  {reportMutationBusy ? (
                    <RefreshCw className="animate-spin" />
                  ) : (
                    <Check />
                  )}
                  내용 저장
                </Button>
              </div>
            </div>
              <StateBanner
              tone={
                reportState === "rejected"
                  ? "danger"
                  : reportIsApproved
                      ? "success"
                      : "info"
              }
              title={
                reportState === "rejected"
                  ? "수정 후 다시 검토해야 합니다"
                  : reportIsApproved
                      ? "승인된 버전이 고정되었습니다"
                      : "AI 요약은 제안입니다"
              }
              description={
                reportState === "rejected"
                  ? "반려 사유와 현재 입력값을 보존합니다. 수정한 뒤 다시 승인할 수 있습니다."
                  : reportIsApproved
                      ? "승인 이후의 수정은 새 버전으로 저장되며 고객에게 전달하기 전까지 공개되지 않습니다."
                      : "외부 전달 전 위험 표현과 사실 관계를 사람이 확인해야 합니다."
              }
            />
              {reportIsApproved ? (
                <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
                  <div className="flex items-center gap-2 font-medium text-primary">
                    <Link2 className="size-4" /> 고객용 링크
                  </div>
                  {createdReportLink ? (
                    <>
                      <div className="mt-1 truncate text-xs text-primary/80">
                        {createdReportLink.frontend_path}
                      </div>
                      <Button
                        className="mt-3 w-full"
                        variant="outline"
                        onClick={() => setDeliveryOpen(true)}
                      >
                        <Send /> 고객에게 전달
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="mt-1 text-xs leading-5 text-primary/80">
                        고객에게 전달하기 전에 승인된 리포트의 보안 링크를 먼저 생성하고 확인합니다.
                      </p>
                      <Button
                        className="mt-3 w-full"
                        variant="outline"
                        disabled={reportLinkBusy}
                        onClick={() => void createReportLink()}
                      >
                        {reportLinkBusy ? (
                          <RefreshCw className="animate-spin" />
                        ) : (
                          <Link2 />
                        )}
                        고객용 링크 생성
                      </Button>
                    </>
                  )}
                  {reportLinkError ? (
                    <p className="mt-2 text-xs text-destructive" role="alert">
                      {reportLinkError}
                    </p>
                  ) : null}
                </div>
              ) : null}
            {reportState === "rejected" ? (
              <div>
                <label className="mb-2 block text-sm font-medium">
                  반려 사유
                </label>
                <Textarea
                  value={reportRejectReason}
                  onChange={(event) =>
                    setReportRejectReason(event.target.value)
                  }
                  placeholder="수정할 내용과 이유를 남겨 주세요."
                  rows={3}
                />
                <Button
                  className="mt-2 w-full"
                  disabled={!reportRejectReason.trim() || reportMutationBusy}
                  onClick={() =>
                    reportRejectionSaved
                      ? void saveReportContent()
                      : void rejectCustomerReport()
                  }
                >
                  {reportMutationBusy ? (
                    <RefreshCw className="animate-spin" />
                  ) : reportRejectionSaved ? (
                    <RotateCcw />
                  ) : (
                    <X />
                  )}
                  {reportRejectionSaved ? "수정본 다시 검토" : "반려 저장"}
                </Button>
              </div>
            ) : null}
            </div>
            <ReportPaper
              title={reportTitle}
              selectedPhotos={selectedReportPhotos}
              customerMessage={customerMessage}
            />
          </div>
        </ManagerPage>
        <ReportDeliverySheet
          key={deliveryOpen ? "open" : "closed"}
          open={deliveryOpen}
          onOpenChange={setDeliveryOpen}
          reportId={reportId}
          reportTitle={reportTitle}
          createdLink={createdReportLink}
          apiEnabled={useLiveApi}
        />
      </>
    )
  }

  if (screen === "SC-22") {
    return (
      <ManagerPage
        title="리포트"
        description="초안, 검토, 승인, 발행과 전달 상태를 분리해 관리합니다."
      >
        <MetricStrip
          items={[
            { label: "필드 작성", value: `${reportRows.length}건` },
            {
              label: "검토 대기",
              value: `${reportRows.filter((row) => row.approval !== "승인됨").length}건`,
              tone: "amber",
            },
            {
              label: "전달됨",
              value: `${reportRows.filter((row) => row.sentAt).length}건`,
              tone: "blue",
            },
            {
              label: "열람됨",
              value: `${reportRows.filter((row) => row.link.last_opened_at).length}건`,
              tone: "green",
            },
          ]}
        />
        <div className="mt-5">
          <ReportTable navigate={navigate} />
        </div>
      </ManagerPage>
    )
  }

  if (screen === "SC-23") {
    return (
      <SnapEvidenceLibrary onOpenTask={() => navigate("SC-20")} />
    )
  }

  if (screen === "SC-24") {
    return <SnapCustomersPage />
  }

  if (screen === "SC-25") {
    return (
      <ManagerPage
        title="캘린더"
        description="배정, 현장 기한, 검토와 고객 전달 일정을 함께 확인합니다."
      >
        <div className="grid gap-px overflow-hidden rounded-md border bg-border sm:grid-cols-7">
          {["월", "화", "수", "목", "금", "토", "일"].map((day) => (
            <div
              key={day}
              className="bg-sidebar p-3 text-center text-sm font-medium"
            >
              {day}
            </div>
          ))}
          {Array.from({ length: 28 }).map((_, index) => (
            <div key={index} className="min-h-24 bg-background p-2">
              <div className="text-xs text-muted-foreground">{index + 1}</div>
              {[2, 8, 12, 18, 23].includes(index) ? (
                <div className="mt-2 rounded bg-primary/10 p-1 text-xs text-primary">
                  {index % 2 ? "현장 검수" : "리포트 전달"}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </ManagerPage>
    )
  }

  if (screen === "SC-26") {
    const steps = [
      "초안",
      "범위 확정",
      "배정",
      "현장 제출",
      "사무 검토",
      "승인",
      "전달",
    ]
    return (
      <ManagerPage
        title="워크플로"
        description="사람 확인 게이트와 자동화를 분리해 조직의 표준 작업 흐름을 구성합니다."
        action={<Button>변경 저장</Button>}
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <div className="space-y-2">
            {steps.map((step, index) => (
              <button
                key={step}
                onClick={() => setWorkflowStep(step)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-md border p-4 text-left",
                  workflowStep === step && "border-primary bg-primary/5"
                )}
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{step}</div>
                  <div className="text-sm text-muted-foreground">
                    {[1, 4, 5].includes(index)
                      ? "사람 확인 필수"
                      : "조건 충족 시 자동 전환"}
                  </div>
                </div>
                <StatusBadge
                  tone={[1, 4, 5].includes(index) ? "amber" : "blue"}
                >
                  {[1, 4, 5].includes(index) ? "Gate" : "Auto"}
                </StatusBadge>
              </button>
            ))}
          </div>
          <Card className="h-fit rounded-md shadow-none">
            <CardHeader>
              <CardTitle className="text-base">{workflowStep}</CardTitle>
              <CardDescription>전환 조건과 복구 행동</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox defaultChecked />
                완료 전 필수값 확인
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox />
                담당자에게 자동 알림
              </label>
              <div>
                <label className="mb-2 block text-sm">실패 시</label>
                <Select defaultValue="stay">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stay">현재 상태 유지</SelectItem>
                    <SelectItem value="rollback">이전 상태 복귀</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </ManagerPage>
    )
  }

  if (screen === "SC-27") {
    return (
      <ManagerPage
        title="ERP 거래에 증거 인계"
        description="SNAP에서 승인한 증거 패키지를 이미 존재하는 ERP 거래에 첨부합니다."
        action={
          <Button variant="outline">
            <RefreshCw /> 상태 동기화
          </Button>
        }
      >
        <StateBanner
          tone="info"
          title="ERP 필드값은 자동으로 변경하지 않습니다"
          description="증거 검토와 승인은 SNAP에서 끝내고, 사람이 대상 거래와 첨부 범위를 확인한 뒤 내보냅니다."
        />
        <div className="mt-5 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>작업</TableHead>
                <TableHead>기존 ERP 거래</TableHead>
                <TableHead>인계 범위</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>최근 시도</TableHead>
                <TableHead>행동</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                [
                  "부산 CY 적재 검수",
                  "DL-260708",
                  "승인 증거 7개",
                  "확인 전",
                  "-",
                  "범위 확인",
                ],
                [
                  "인천 창고 하역",
                  "DL-260625",
                  "승인 증거 5개",
                  "실패",
                  "10:42",
                  "재시도",
                ],
                [
                  "광양 봉인 확인",
                  "DL-260701",
                  "승인 증거 4개",
                  "확인됨",
                  "어제",
                  "내보내기",
                ],
              ].map((row) => (
                <TableRow key={row[0]}>
                  <TableCell className="font-medium">{row[0]}</TableCell>
                  <TableCell>{row[1]}</TableCell>
                  <TableCell>
                    <span className="text-sm">{row[2]}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      tone={
                        row[3] === "확인됨"
                          ? "green"
                          : row[3] === "실패"
                            ? "red"
                            : "amber"
                      }
                    >
                      {row[3]}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>{row[4]}</TableCell>
                  <TableCell>
                    <Button size="xs" variant="outline">
                      {row[5]}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ManagerPage>
    )
  }

  if (screen === "SC-28") {
    return <SnapWorkersPage />
  }

  if (screen === "SC-29") {
    return (
      <ManagerPage
        title="시정조치"
        description="고객 이의제기와 내부 검토 결과를 담당자, 기한, 해결 증거와 함께 추적합니다."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            ["CA-104", "봉인 사진 재촬영", "오늘", "진행 중"],
            ["CA-103", "고객 보고서 정정", "D-1", "확인 필요"],
            ["CA-102", "위치 증빙 보완", "완료", "종결"],
          ].map((item) => (
            <Card key={item[0]} className="rounded-md shadow-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <StatusBadge
                    tone={
                      item[3] === "종결"
                        ? "green"
                        : item[3] === "확인 필요"
                          ? "red"
                          : "amber"
                    }
                  >
                    {item[3]}
                  </StatusBadge>
                  <span className="text-xs text-muted-foreground">
                    {item[0]}
                  </span>
                </div>
                <CardTitle className="text-base">{item[1]}</CardTitle>
                <CardDescription>기한 {item[2]} · 담당 김민지</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  조치 열기
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </ManagerPage>
    )
  }

  return (
    <ManagerPage
      title="SNAP 설정"
      description="조직 브랜딩, 지역화, 보존, 요금제와 크레딧을 관리합니다."
    >
      <div className="grid gap-5 md:grid-cols-[220px_1fr]">
        <nav className="space-y-1">
          {[
            "조직 정보",
            "브랜딩",
            "지역·시간",
            "데이터 보관",
            "요금제·크레딧",
          ].map((item, index) => (
            <button
              key={item}
              className={cn(
                "w-full rounded-md px-3 py-2 text-left text-sm",
                index === 3
                  ? "bg-sidebar-accent font-medium"
                  : "text-muted-foreground"
              )}
            >
              {item}
            </button>
          ))}
        </nav>
        <div>
          <h2 className="text-lg font-semibold">데이터 보관</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            문서 유형별 정책과 법적 보존 의무를 확인합니다.
          </p>
          <div className="mt-5 divide-y rounded-md border">
            {[
              ["원본 현장 증거", "5년"],
              ["승인 리포트", "5년"],
              ["위치정보", "24시간 이내 삭제"],
              ["감사 이력", "5년"],
            ].map((row) => (
              <div
                key={row[0]}
                className="grid gap-3 p-4 sm:grid-cols-[1fr_180px]"
              >
                <div>
                  <div className="font-medium">{row[0]}</div>
                  <div className="text-sm text-muted-foreground">
                    정책 변경은 기존 보존 의무보다 짧게 적용되지 않습니다.
                  </div>
                </div>
                <Select defaultValue={row[1]}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={row[1]}>{row[1]}</SelectItem>
                    <SelectItem value="7년">7년</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <Button className="mt-5">설정 저장</Button>
        </div>
      </div>
    </ManagerPage>
  )
}

function ManagerPage({
  title,
  description,
  action,
  children,
}: {
  title: string
  description: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="mx-auto w-full max-w-ecoya-wide-xl px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
        <ScreenHeading
          title={title}
          description={description}
          action={action}
        />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}

const preSendLabels: Array<[keyof PreSendCheck["checklist"], string]> = [
  ["all_required_media_attached", "필수 증거 첨부"],
  ["ocr_values_confirmed", "OCR 값 확인"],
  ["ai_summary_reviewed", "AI 요약 검토"],
  ["manager_report_approved", "관리자 승인"],
  ["customer_visible_text_reviewed", "고객 공개 문구 검토"],
  ["presentation_ready", "리포트 표시 품질"],
  ["sensitive_info_checked", "민감정보 확인"],
  ["recipient_confirmed", "수신자 확인"],
  ["delivery_channel_confirmed", "전달 채널 확인"],
  ["media_watermarked", "증거 워터마크"],
]

function ReportDeliverySheet({
  open,
  onOpenChange,
  reportId,
  reportTitle,
  createdLink,
  apiEnabled,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportId: string
  reportTitle: string
  createdLink: ShareLinkLifecycle | null
  apiEnabled: boolean
}) {
  const [channel, setChannel] = useState<DeliveryChannel>("link")
  const [recipient, setRecipient] = useState("ops@hanbit.co.kr")
  const [locale, setLocale] = useState("ko")
  const [check, setCheck] = useState<PreSendCheck | null>(null)
  const [deliveryRequested, setDeliveryRequested] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const useLiveApi = apiEnabled && snapApiConfigured && Boolean(reportId)

  const requestPayload = {
    channel,
    recipient_value: channel === "email" ? recipient : undefined,
  }

  const runPreSendCheck = async () => {
    setBusy(true)
    setError("")
    try {
      const result = useLiveApi
        ? await snapReportApi.preSendCheck(reportId, requestPayload)
        : demoPreSendCheck(reportId, requestPayload)
      setCheck(result)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "전달 전 확인에 실패했습니다.")
    } finally {
      setBusy(false)
    }
  }

  const deliver = async () => {
    if (!check?.ready_to_send || !createdLink) return
    setBusy(true)
    setError("")
    try {
      if (channel === "email" && useLiveApi) {
        const delivery = await snapReportApi.route(reportId, requestPayload)
        if (!delivery.delivered) {
          throw new Error(
            delivery.error_message || "이메일 전달이 완료되지 않았습니다."
          )
        }
      }
      setDeliveryRequested(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "전달 요청에 실패했습니다.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-xl">
        <SheetHeader className="border-b pr-12">
          <SheetTitle>고객 전달</SheetTitle>
          <SheetDescription>
            승인된 버전을 검사한 뒤 보안 링크로 전달합니다. 발송 요청과 열람은 별도 상태로 기록됩니다.
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
          <div className="rounded-md border bg-sidebar/60 p-3">
            <div className="font-medium">{reportTitle}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {reportId} · 승인된 고객용 버전
            </div>
          </div>

            <Tabs
            value={channel}
            onValueChange={(value) => {
              setChannel(value as DeliveryChannel)
              setCheck(null)
              setDeliveryRequested(false)
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link">링크 확인</TabsTrigger>
              <TabsTrigger value="email">이메일 전달</TabsTrigger>
            </TabsList>
            <TabsContent value="link" className="mt-3 text-muted-foreground">
              본문에서 이미 생성한 고객용 보안 링크를 확인하고 공유합니다.
            </TabsContent>
            <TabsContent value="email" className="mt-3 space-y-2">
              <label className="text-xs font-medium">받는 사람</label>
              <Input
                type="email"
                value={recipient}
                onChange={(event) => {
                  setRecipient(event.target.value)
                  setCheck(null)
                }}
                placeholder="customer@example.com"
              />
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <label className="text-xs font-medium">고객 화면 언어</label>
            <Select
              value={locale}
              onValueChange={(value) => value && setLocale(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ko">한국어</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!check ? (
            <StateBanner
              tone="info"
              title="전달 전에 조건을 확인합니다"
              description="승인, 고객 공개 문구, 민감정보, 증거 워터마크와 수신 채널을 백엔드에서 다시 검사합니다."
            />
          ) : (
            <div className="rounded-md border">
              <div className="flex items-center justify-between border-b px-3 py-2">
                <div>
                  <div className="font-medium">전달 준비 상태</div>
                  <div className="text-xs text-muted-foreground">
                    표시 품질 {check.presentation_score}/{check.presentation_minimum} 이상
                  </div>
                </div>
                <StatusBadge tone={check.ready_to_send ? "green" : "red"}>
                  {check.ready_to_send ? "전달 가능" : "확인 필요"}
                </StatusBadge>
              </div>
              <div className="grid gap-px bg-border sm:grid-cols-2">
                {preSendLabels.map(([key, label]) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 bg-background px-3 py-2 text-xs"
                  >
                    {check.checklist[key] ? (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="size-4 text-red-600" />
                    )}
                    {label}
                  </div>
                ))}
              </div>
              {check.blocking.length > 0 ? (
                <div className="border-t bg-red-50 p-3 text-xs text-red-700">
                  {check.blocking.join(" · ")}
                </div>
              ) : null}
            </div>
          )}

          {createdLink ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
              <div className="flex items-center gap-2 font-medium text-emerald-800">
                <CheckCircle2 className="size-4" />
                {deliveryRequested
                  ? channel === "email"
                    ? "이메일 전달 요청됨"
                    : "고객용 링크 확인됨"
                  : "고객용 링크가 생성되어 있습니다"}
              </div>
              <div className="mt-2 break-all rounded bg-white/70 p-2 text-xs text-emerald-900">
                {createdLink.frontend_path}
              </div>
              <div className="mt-2 text-xs text-emerald-700">
                {deliveryRequested
                  ? "아직 열람되지 않았습니다. 열람과 수신 확인은 전달 관리에서 별도로 추적합니다."
                  : "이 링크를 확인한 뒤 이메일로 보내거나 필요한 채널에 공유할 수 있습니다."}
              </div>
              <Button
                className="mt-3"
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(createdLink.frontend_path)}
              >
                링크 복사
              </Button>
            </div>
          ) : null}

          {error ? (
            <StateBanner tone="danger" title="요청 실패" description={error} />
          ) : null}
        </div>
        <SheetFooter className="border-t">
          {!check ? (
            <Button onClick={runPreSendCheck} disabled={busy}>
              {busy ? <RefreshCw className="animate-spin" /> : <ClipboardCheck />}
              전달 전 확인
            </Button>
          ) : !deliveryRequested ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={runPreSendCheck} disabled={busy}>
                다시 확인
              </Button>
              <Button className="flex-1" onClick={deliver} disabled={busy || !check.ready_to_send}>
                {busy ? <RefreshCw className="animate-spin" /> : <Send />}
                {channel === "email" ? "이메일 전송 요청" : "링크 확인 완료"}
              </Button>
            </div>
          ) : (
            <Button onClick={() => onOpenChange(false)}>완료</Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

type ReportListItem = {
  id: string
  title: string
  version: string
  approval: string
  sentAt: string
  openedAt: string
  link: ShareLinkLifecycle
}

const reportRows: ReportListItem[] = [
  {
    id: "RPT-2081",
    title: "부산 CY 적재 검수",
    version: "v3",
    approval: "승인됨",
    sentAt: "07.31 16:42",
    openedAt: "07.31 17:08",
    link: {
      ...demoShareLink("RPT-2081"),
      token: "hanbit-loading-report",
      frontend_path: "/view/hanbit-loading-report",
      open_count: 2,
      view_count: 3,
      acknowledged: true,
      last_opened_at: "2026-07-31T17:08:00+09:00",
    },
  },
  {
    id: "RPT-2082",
    title: "인천 창고 하역",
    version: "v1",
    approval: "승인됨",
    sentAt: "08.01 09:20",
    openedAt: "미열람",
    link: {
      ...demoShareLink("RPT-2082"),
      token: "acme-unloading-report",
      frontend_path: "/view/acme-unloading-report",
      expires_at: "2026-08-08T09:20:00+09:00",
    },
  },
  {
    id: "RPT-2083",
    title: "광양 봉인 확인",
    version: "v2",
    approval: "승인됨",
    sentAt: "08.01 11:05",
    openedAt: "전달 실패",
    link: {
      ...demoShareLink("RPT-2083"),
      token: "hmm-seal-report",
      frontend_path: "/view/hmm-seal-report",
      status: "expired",
      expires_at: "2026-08-01T11:05:00+09:00",
    },
  },
]

function ReportTable({ navigate }: { navigate: (key: SnapScreenKey) => void }) {
  const [tab, setTab] = useState("sent")
  const [selectedReport, setSelectedReport] = useState<ReportListItem | null>(null)
  const [links, setLinks] = useState(reportRows.map((row) => row.link))

  const updateLocalLink = (token: string, patch: Partial<ShareLinkLifecycle>) => {
    setLinks((current) =>
      current.map((link) => (link.token === token ? { ...link, ...patch } : link))
    )
  }

  return (
    <>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="field">증빙 검수</TabsTrigger>
          <TabsTrigger value="review">리포트 승인</TabsTrigger>
          <TabsTrigger value="sent">발송</TabsTrigger>
          <TabsTrigger value="delivery">발송 모니터</TabsTrigger>
        </TabsList>

        <TabsContent value="field" className="mt-4">
          <StateBanner
            tone="info"
            title="현장 리포트는 내부 작업 결과입니다"
            description="고객용 리포트와 분리되며, 검토가 끝난 증거만 고객 리포트 작성으로 넘깁니다."
          />
          <Button className="mt-4" variant="outline" onClick={() => navigate("SC-20")}>
            현장 검토 열기 <ArrowRight />
          </Button>
        </TabsContent>

        <TabsContent value="review" className="mt-4">
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>리포트</TableHead>
                  <TableHead>검토 이유</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">울산 출고 검수 v1</TableCell>
                  <TableCell>고객 공개 문구 1건 확인</TableCell>
                  <TableCell><StatusBadge tone="amber">검토 필요</StatusBadge></TableCell>
                  <TableCell className="text-right">
                    <Button size="xs" onClick={() => navigate("SC-21")}>검토 열기</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="sent" className="mt-4">
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>리포트</TableHead>
                  <TableHead>발송 요청</TableHead>
                  <TableHead>최근 열람</TableHead>
                  <TableHead>수신 확인</TableHead>
                  <TableHead>링크 상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportRows.map((row) => {
                  const link = links.find((item) => item.token === row.link.token) ?? row.link
                  return (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedReport({ ...row, link })}
                    >
                      <TableCell>
                        <div className="font-medium">{row.title}</div>
                        <div className="text-xs text-muted-foreground">{row.id} · {row.version}</div>
                      </TableCell>
                      <TableCell>{row.sentAt}</TableCell>
                      <TableCell>{link.last_opened_at ? row.openedAt : "미열람"}</TableCell>
                      <TableCell>
                        <StatusBadge tone={link.acknowledged ? "green" : "neutral"}>
                          {link.acknowledged ? "확인됨" : "미확인"}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={link.status === "active" ? "green" : "red"}>
                          {link.status === "active" ? "활성" : link.status === "expired" ? "만료" : "회수"}
                        </StatusBadge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="delivery" className="mt-4">
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>고객 링크</TableHead>
                  <TableHead className="text-right">열람</TableHead>
                  <TableHead>수신 확인</TableHead>
                  <TableHead>만료</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => (
                  <TableRow key={link.token}>
                    <TableCell>
                      <div className="font-medium">{link.label}</div>
                      <div className="max-w-64 truncate text-xs text-muted-foreground">{link.frontend_path}</div>
                    </TableCell>
                      <TableCell className="text-right tabular-nums">{link.open_count}회 · 조회 {link.view_count}/{link.max_views}</TableCell>
                    <TableCell>{link.acknowledged ? "확인됨" : "미확인"}</TableCell>
                    <TableCell>{link.expires_at.slice(0, 10)}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        {link.status !== "active" ? (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => updateLocalLink(link.token, {
                              status: "active",
                              revoked: false,
                              expires_at: "2026-08-10T09:00:00+09:00",
                            })}
                          >
                            72시간 연장
                          </Button>
                        ) : (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => updateLocalLink(link.token, {
                              last_resend_at: new Date().toISOString(),
                            })}
                          >
                            재전송
                          </Button>
                        )}
                        <Button
                          size="xs"
                          variant="ghost"
                          disabled={link.status === "revoked"}
                          onClick={() => updateLocalLink(link.token, {
                            status: "revoked",
                            revoked: true,
                          })}
                        >
                          회수
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Sheet open={Boolean(selectedReport)} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <SheetContent className="w-full gap-0 sm:max-w-lg">
          <SheetHeader className="border-b pr-12">
            <SheetTitle>{selectedReport?.title}</SheetTitle>
            <SheetDescription>
              발송 요청, 링크 생성, 열람과 수신 확인을 서로 다른 기록으로 표시합니다.
            </SheetDescription>
          </SheetHeader>
          {selectedReport ? (
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border">
                {[
                  ["승인", selectedReport.approval],
                  ["발송 요청", selectedReport.sentAt],
                  ["열람", selectedReport.link.last_opened_at ? selectedReport.openedAt : "미열람"],
                  ["수신 확인", selectedReport.link.acknowledged ? "확인됨" : "미확인"],
                ].map(([label, value]) => (
                  <div key={label} className="bg-background p-3">
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="mt-1 font-medium">{value}</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-sm font-medium">고객용 보안 링크</div>
                <div className="mt-2 break-all rounded-md bg-sidebar p-3 text-xs">
                  {selectedReport.link.frontend_path}
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(selectedReport.link.frontend_path)}
                  >
                    링크 복사
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate("SC-14")}>
                    고객 화면 보기 <Eye />
                  </Button>
                </div>
              </div>
              <StateBanner
                tone={selectedReport.link.status === "active" ? "success" : "danger"}
                title={selectedReport.link.status === "active" ? "링크 활성" : "링크 사용 불가"}
                description={
                  selectedReport.link.status === "active"
                    ? `조회 ${selectedReport.link.view_count}/${selectedReport.link.max_views} · 만료 ${selectedReport.link.expires_at.slice(0, 10)}`
                    : "만료 또는 회수된 링크는 고객이 열 수 없습니다. 전달 관리에서 연장하거나 새 링크를 만드세요."
                }
              />
            </div>
          ) : null}
          <SheetFooter className="border-t">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedReport(null)
                setTab("delivery")
              }}
            >
              전달 관리 열기
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

function PlatformPrototype({
  screen,
  navigate,
  routeParams,
}: PrototypeScreenProps) {
  return (
    <main className="min-h-[calc(100vh-108px)] min-w-0 bg-background">
      <SnapPlatformPages
        screen={screen}
        navigate={navigate}
        routeParams={routeParams}
      />
    </main>
  )
}

function MobilePrototype({ screen, navigate }: PrototypeScreenProps) {
  const [captureCount, setCaptureCount] = useState(2)
  const [mobileMode, setMobileMode] = useState("tasks")
  const role = ["SC-42", "SC-43", "SC-44"].includes(screen)
    ? "manager"
    : "worker"
  return (
    <div className="min-h-[calc(100vh-108px)] bg-neutral-100 p-0 sm:p-5">
      <div className="mx-auto flex min-h-[calc(100vh-108px)] w-full max-w-md flex-col overflow-hidden bg-background sm:min-h-[760px] sm:rounded-[28px] sm:border sm:shadow-sm">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <div className="text-xs font-medium text-primary">SNAP FIELD</div>
            <div className="font-semibold">{getScreen(screen).label}</div>
          </div>
          <StatusBadge tone="blue">{role}</StatusBadge>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4">
          <MobileContent
            screen={screen}
            navigate={navigate}
            captureCount={captureCount}
            setCaptureCount={setCaptureCount}
            mobileMode={mobileMode}
            setMobileMode={setMobileMode}
          />
        </main>
        <nav className="grid grid-cols-3 border-t bg-background p-2">
          <button
            className={cn(
              "flex flex-col items-center gap-1 rounded-md py-2 text-xs",
              mobileMode === "capture" && "bg-sidebar-accent text-primary"
            )}
            onClick={() => {
              setMobileMode("capture")
              navigate("SC-38")
            }}
          >
            <Camera className="size-5" />
            캡처
          </button>
          <button
            className={cn(
              "flex flex-col items-center gap-1 rounded-md py-2 text-xs",
              mobileMode === "tasks" && "bg-sidebar-accent text-primary"
            )}
            onClick={() => {
              setMobileMode("tasks")
              navigate(role === "manager" ? "SC-43" : "SC-39")
            }}
          >
            <ClipboardList className="size-5" />
            작업
          </button>
          <button
            className={cn(
              "flex flex-col items-center gap-1 rounded-md py-2 text-xs",
              mobileMode === "home" && "bg-sidebar-accent text-primary"
            )}
            onClick={() => {
              setMobileMode("home")
              navigate(role === "manager" ? "SC-42" : "SC-37")
            }}
          >
            <LayoutDashboard className="size-5" />홈
          </button>
        </nav>
      </div>
    </div>
  )
}

function MobileContent({
  screen,
  navigate,
  captureCount,
  setCaptureCount,
}: PrototypeScreenProps & {
  captureCount: number
  setCaptureCount: (value: number) => void
  mobileMode: string
  setMobileMode: (value: string) => void
}) {
  if (screen === "SC-37")
    return (
      <div className="flex min-h-[580px] flex-col items-center justify-center text-center">
        <Smartphone className="size-10 text-primary" />
        <h1 className="mt-5 text-2xl font-semibold">
          역할을 확인하고 있습니다
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          승인된 조직과 역할에 따라 작업자 또는 매니저 화면으로 이동합니다.
        </p>
        <div className="mt-6 w-full space-y-2">
          <Button className="w-full" onClick={() => navigate("SC-39")}>
            작업자 화면 보기
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("SC-42")}
          >
            매니저 화면 보기
          </Button>
        </div>
        <div className="mt-6 rounded-md bg-sidebar p-3 text-left text-xs text-muted-foreground">
          <strong className="text-foreground">접근 제한</strong>
          <br />
          pending·suspended 계정은 업무 데이터를 받지 않습니다.
        </div>
      </div>
    )
  if (screen === "SC-38")
    return (
      <div>
        <h1 className="text-2xl font-semibold">먼저 기록하세요</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          작업을 찾기 전에도 캡처하고, 나중에 연결할 수 있습니다.
        </p>
        <button
          onClick={() => {
            setCaptureCount(captureCount + 1)
            toast.success("임시 캡처에 안전하게 저장했습니다.")
          }}
          className="mt-6 flex aspect-[4/5] w-full flex-col items-center justify-center rounded-md bg-neutral-950 text-white"
        >
          <Camera className="size-14" />
          <strong className="mt-4">촬영</strong>
          <span className="mt-1 text-sm text-neutral-400">
            사진 · 영상 · 음성
          </span>
        </button>
        <div className="mt-4 flex items-center justify-between rounded-md bg-sidebar p-3">
          <div>
            <div className="font-medium">임시 캡처 {captureCount}개</div>
            <div className="text-xs text-muted-foreground">
              기기에 안전하게 보관 중
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              toast.success(`${captureCount}개 캡처를 작업 연결 대기열에 보냈습니다.`)
              navigate("SC-39")
            }}
          >
            작업에 연결
          </Button>
        </div>
        <StateBanner
          tone="warning"
          title="오프라인"
          description="연결되면 자동 업로드합니다. 충돌 시 보존할 캡처를 선택합니다."
        />
      </div>
    )
  if (screen === "SC-39" || screen === "SC-43") {
    const manager = screen === "SC-43"
    return (
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {manager ? "매니저 작업" : "내 작업"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {manager
                ? "전체 작업과 사무 검토함을 구분합니다."
                : "배정받은 범위만 표시합니다."}
            </p>
          </div>
          <Button
            size="icon"
            variant="outline"
            aria-label="작업 목록 새로고침"
            onClick={() => toast.success("최신 작업 상태를 확인했습니다.")}
          >
            <RefreshCw />
          </Button>
        </div>
        {manager ? (
          <div className="mt-4 grid grid-cols-2 rounded-md bg-sidebar p-1">
            <Button size="sm" variant="secondary">
              전체 작업
            </Button>
            <Button size="sm" variant="ghost">
              검토함 3
            </Button>
          </div>
        ) : null}
        <div className="mt-5 space-y-3">
          {[
            ["부산 CY 적재 검수", "오늘 18:00", "2/3"],
            ["광양 봉인 확인", "내일", "0/4"],
            ["인천 외관 확인", "D-2", "제출됨"],
          ].map((item, index) => (
            <button
              key={item[0]}
              onClick={() =>
                navigate(manager && index === 0 ? "SC-44" : "SC-40")
              }
              className="w-full rounded-md border p-4 text-left"
            >
              <div className="flex justify-between">
                <strong>{item[0]}</strong>
                <StatusBadge tone={index === 0 ? "amber" : "blue"}>
                  {item[2]}
                </StatusBadge>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock3 className="size-4" />
                {item[1]}
              </div>
            </button>
          ))}
        </div>
        {manager ? (
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => navigate("SC-38")}
          >
            <Camera /> 선택 작업 현장 모드
          </Button>
        ) : null}
      </div>
    )
  }
  if (screen === "SC-40")
    return (
      <div>
        <StatusBadge tone="blue">배정됨</StatusBadge>
        <h1 className="mt-3 text-2xl font-semibold">부산 CY 적재 검수</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          컨테이너 외관과 봉인 번호를 순서대로 기록해 주세요.
        </p>
        <div className="mt-5 space-y-2">
          {[
            ["컨테이너 번호", true],
            ["봉인 번호", true],
            ["적재 후 전체", false],
          ].map(([item, done]) => (
            <div
              key={String(item)}
              className="flex items-center gap-3 rounded-md border p-3"
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full",
                  done ? "bg-emerald-100 text-emerald-700" : "bg-muted"
                )}
              >
                {done ? <Check className="size-4" /> : "3"}
              </span>
              <span className="flex-1 text-sm font-medium">{String(item)}</span>
              {done ? <Eye className="size-4" /> : null}
            </div>
          ))}
        </div>
        <Button className="mt-5 w-full" onClick={() => navigate("SC-38")}>
          <Camera /> 다음 사진 촬영
        </Button>
        <Button
          variant="outline"
          className="mt-2 w-full"
          onClick={() => toast.info("문제 사유 입력 화면을 열었습니다.")}
        >
          문제 사유 기록하고 진행
        </Button>
      </div>
    )
  if (screen === "SC-41")
    return (
      <div>
        <h1 className="text-2xl font-semibold">현장에서 바로 시작</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          사전 작업이 없어도 현장 사실을 기록하고 매니저 확인을 요청할 수
          있습니다.
        </p>
        <div className="mt-5 space-y-4">
          <Textarea rows={6} placeholder="무엇을 확인하고 있나요?" />
          <button className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed p-5 text-sm">
            <MapPin className="size-5 text-primary" />
            현재 위치 사용
          </button>
          <StateBanner
            tone="warning"
            title="사람 범위 확인 필요"
            description="확정 전 캡처는 보존되지만 고객 전달이나 ERP 인계에는 사용되지 않습니다."
          />
          <Button className="w-full" onClick={() => navigate("SC-40")}>
            초안 만들고 범위 확인
          </Button>
        </div>
      </div>
    )
  if (screen === "SC-42")
    return (
      <div>
        <h1 className="text-2xl font-semibold">이동 중 작업 만들기</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          자연어로 초안을 만들고 범위를 확정한 뒤 배정합니다.
        </p>
        <Textarea
          className="mt-5"
          rows={7}
          defaultValue="내일 부산 CY에서 컨테이너 외관과 봉인 번호를 확인해줘"
        />
        <div className="mt-4 rounded-md bg-sidebar p-4">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="size-4 text-primary" />
            AI 초안
          </div>
          <div className="mt-3 text-sm">사진 5 · 봉인 번호 · 외관 4면</div>
          <div className="mt-1 text-xs text-muted-foreground">
            범위 확인 전에는 작업자에게 보이지 않습니다.
          </div>
        </div>
        <Button className="mt-4 w-full" onClick={() => navigate("SC-44")}>
          범위 확인
        </Button>
        <Button
          variant="outline"
          className="mt-2 w-full"
          onClick={() => toast.success("반복 작업 선택 화면을 열었습니다.")}
        >
          반복 작업에서 복제
        </Button>
      </div>
    )
  return (
    <div>
      <h1 className="text-2xl font-semibold">후속 행동</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        배정, 사무 검토와 전달을 현재 상태에 맞게 실행합니다.
      </p>
      <div className="mt-5 space-y-3">
        {[
          [UserPlus, "작업자 배정", "active worker만 선택"],
          [ClipboardCheck, "사무 검토", "제출 증거 6개 확인"],
          [Send, "고객 전달", "승인된 리포트 v3"],
          [Camera, "현장 작업 시작", "이 작업에만 field_actor=true"],
        ].map(([Icon, title, description]) => (
          <button
            key={String(title)}
            className="flex w-full items-center gap-3 rounded-md border p-4 text-left"
            onClick={() => {
              if (title === "사무 검토") {
                navigate("SC-20")
                return
              }
              if (title === "현장 작업 시작") {
                navigate("SC-38")
                return
              }
              toast.success(`${String(title)} 화면을 열었습니다.`)
            }}
          >
            <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block">{String(title)}</strong>
              <span className="text-sm text-muted-foreground">
                {String(description)}
              </span>
            </span>
            <ChevronRight className="size-4" />
          </button>
        ))}
      </div>
      <StateBanner
        tone="warning"
        title="전달 전 사람 검토 필요"
        description="AI 위험 표현 1건을 확인해야 전달할 수 있습니다."
      />
    </div>
  )
}

type PrototypeScreenProps = {
  screen: SnapScreenKey
  navigate: (key: SnapScreenKey, options?: SnapNavigationOptions) => void
  routeParams?: Record<string, string>
  routeSearch?: URLSearchParams
}

export type SnapProductPrototypeProps = {
  screen?: SnapScreenKey
  defaultScreen?: SnapScreenKey
  onScreenChange?: (
    screen: SnapScreenKey,
    options?: SnapNavigationOptions
  ) => void
  routeParams?: Record<string, string>
  routeSearch?: URLSearchParams
  showNavigator?: boolean
  className?: string
}

export function SnapProductPrototype({
  screen: controlledScreen,
  defaultScreen = "SC-01",
  onScreenChange,
  routeParams,
  routeSearch,
  showNavigator = true,
  className,
}: SnapProductPrototypeProps) {
  const [internalScreen, setInternalScreen] =
    useState<SnapScreenKey>(defaultScreen)
  const screen = controlledScreen ?? internalScreen
  const definition = getScreen(screen)

  const navigate = (next: SnapScreenKey, options?: SnapNavigationOptions) => {
    if (controlledScreen === undefined) setInternalScreen(next)
    onScreenChange?.(next, options)
  }

  const groupScreens = useMemo(
    () => SCREEN_DEFINITIONS.filter((item) => item.group === definition.group),
    [definition.group]
  )

  return (
    <section
      data-snap-screen={screen}
      className={cn(
        "snap-product min-h-screen bg-background text-foreground",
        className
      )}
    >
      {showNavigator ? (
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="flex min-h-14 items-center gap-3 px-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Camera className="size-4" />
              </div>
              <div className="hidden min-w-0 sm:block">
                <div className="truncate text-sm font-semibold">ECOYA SNAP</div>
                <div className="truncate text-xs text-muted-foreground">
                  SSOT prototype coverage
                </div>
              </div>
            </div>
            <Separator orientation="vertical" className="h-7" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs text-muted-foreground">
                {GROUP_LABELS[definition.group]} · {definition.audience}
              </div>
              <div className="truncate text-sm font-medium">
                {definition.key} {definition.label}
              </div>
            </div>
            <Select
              value={screen}
              onValueChange={(value) => navigate(value as SnapScreenKey)}
            >
              <SelectTrigger className="w-[138px] sm:w-[230px]">
                <SelectValue>
                  {definition.key} · {definition.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GROUP_LABELS).map(([group, groupLabel]) => (
                  <div key={group}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {groupLabel}
                    </div>
                    {SCREEN_DEFINITIONS.filter(
                      (item) => item.group === group
                    ).map((item) => (
                      <SelectItem key={item.key} value={item.key}>
                        {item.key} · {item.label}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ScreenTabs
            group={definition.group}
            active={screen}
            onSelect={navigate}
          />
        </header>
      ) : null}

      {definition.group === "public" ? (
        <PublicPrototype
          screen={screen}
          navigate={navigate}
          routeParams={routeParams}
          routeSearch={routeSearch}
        />
      ) : null}
      {definition.group === "link" ? (
        <LinkPrototype
          screen={screen}
          navigate={navigate}
          routeParams={routeParams}
          routeSearch={routeSearch}
        />
      ) : null}
      {definition.group === "manager" ? (
        <ManagerPrototype
          screen={screen}
          navigate={navigate}
          routeParams={routeParams}
          routeSearch={routeSearch}
          showNavigation={showNavigator}
        />
      ) : null}
      {definition.group === "platform" ? (
        <PlatformPrototype
          screen={screen}
          navigate={navigate}
          routeParams={routeParams}
          routeSearch={routeSearch}
        />
      ) : null}
      {definition.group === "mobile" ? (
        <MobilePrototype screen={screen} navigate={navigate} />
      ) : null}

      {showNavigator ? (
        <div className="fixed right-3 bottom-3 z-50 hidden rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground shadow-sm sm:block">
          {groupScreens.findIndex((item) => item.key === screen) + 1}/
          {groupScreens.length} · 전체 {SCREEN_DEFINITIONS.length}
        </div>
      ) : null}
    </section>
  )
}

export function SnapPublicPrototype(
  props: Omit<SnapProductPrototypeProps, "defaultScreen">
) {
  return <SnapProductPrototype defaultScreen="SC-01" {...props} />
}

export function SnapExternalLinkPrototype(
  props: Omit<SnapProductPrototypeProps, "defaultScreen">
) {
  return <SnapProductPrototype defaultScreen="SC-12" {...props} />
}

export function SnapManagerPrototype(
  props: Omit<SnapProductPrototypeProps, "defaultScreen">
) {
  return <SnapProductPrototype defaultScreen="SC-17" {...props} />
}

export function SnapPlatformOpsPrototype(
  props: Omit<SnapProductPrototypeProps, "defaultScreen">
) {
  return <SnapProductPrototype defaultScreen="SC-31" {...props} />
}

export function SnapMobilePrototype(
  props: Omit<SnapProductPrototypeProps, "defaultScreen">
) {
  return <SnapProductPrototype defaultScreen="SC-37" {...props} />
}

export function SnapRoleGatePrototype(
  props: Omit<SnapProductPrototypeProps, "defaultScreen" | "screen">
) {
  return <SnapProductPrototype screen="SC-37" {...props} />
}

function getScreen(key: SnapScreenKey) {
  return (
    SCREEN_DEFINITIONS.find((item) => item.key === key) ?? SCREEN_DEFINITIONS[0]
  )
}

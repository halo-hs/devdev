import {
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Circle,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog"
import { Input } from "@shared/components/ui/input"
import { Progress } from "@shared/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select"
import { Skeleton } from "@shared/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"
import { Textarea } from "@shared/components/ui/textarea"
import type { SnapScreenKey } from "@snap/screens"
import type { SnapNavigationOptions } from "@snap/operations/pages"
import { snapApi, type SnapPage } from "@snap/lib/snap-api"
import {
  snapApiConfigured,
  snapApiErrorMessage,
  type SnapJsonRecord,
} from "@snap/lib/snap-report-api"
import { cn } from "@shared/lib/utils"

type PlatformNavigate = (
  screen: SnapScreenKey,
  options?: SnapNavigationOptions
) => void

type SnapPlatformPagesProps = {
  screen: SnapScreenKey
  navigate: PlatformNavigate
  routeParams?: Record<string, string>
}

type ResourceState<T> = {
  data: T | null
  loading: boolean
  error: string
  reload: () => void
}

type IntegrationRow = {
  key: string
  category: string
  vendor: string
  scope: string
  required: boolean
  launch_phase: string
  configured: boolean
  env: Array<{ key: string; set: boolean }>
}

type SupportView = {
  read_only?: boolean
  audited?: boolean
  organization?: SnapJsonRecord
  summary?: SnapJsonRecord
  recent_tasks?: SnapJsonRecord[]
  recent_deliveries?: SnapJsonRecord[]
}

function usePlatformResource<T>(
  key: string,
  loader: () => Promise<T>
): ResourceState<T> {
  const load = useEffectEvent(loader)
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (!active) return
      setLoading(true)
      setError("")
      void load()
        .then((next) => {
          if (active) setData(next)
        })
        .catch((reason: unknown) => {
          if (active) setError(snapApiErrorMessage(reason))
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    })
    return () => {
      active = false
    }
  }, [key, requestVersion])

  return {
    data,
    loading,
    error,
    reload: () => setRequestVersion((current) => current + 1),
  }
}

function textValue(value: unknown, fallback = "-") {
  if (typeof value === "string" && value.trim()) return value
  if (typeof value === "number") return String(value)
  return fallback
}

function numberValue(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function recordValue(value: unknown): SnapJsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as SnapJsonRecord)
    : {}
}

function rowsValue(value: unknown): SnapJsonRecord[] {
  return Array.isArray(value)
    ? value.filter(
        (row): row is SnapJsonRecord =>
          Boolean(row) && typeof row === "object" && !Array.isArray(row)
      )
    : []
}

function pageItems(page: SnapPage | SnapJsonRecord | null | undefined) {
  return rowsValue(page?.items)
}

function formatDateTime(value: unknown) {
  const raw = textValue(value, "")
  if (!raw) return "-"
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

function formatUsd(value: unknown, digits = 4) {
  return `${numberValue(value).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} USD`
}

function PlatformPageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">{title}</h1>
          <Badge variant="outline">Platform Operator</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {actions}
    </div>
  )
}

function ResourceBoundary({
  state,
  children,
}: {
  state: ResourceState<unknown>
  children: ReactNode
}) {
  if (!snapApiConfigured)
    return (
      <StatePanel
        tone="warning"
        title="SNAP API 연결 필요"
        description="VITE_SNAP_API_BASE_URL 또는 VITE_API_BASE를 설정하면 원본 운영 데이터를 조회합니다."
      />
    )
  if (state.loading)
    return (
      <div className="space-y-3" aria-label="불러오는 중">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  if (state.error) {
    const forbidden = /403|platform_ops|권한/.test(state.error)
    return (
      <StatePanel
        tone={forbidden ? "danger" : "warning"}
        title={forbidden ? "플랫폼 운영 권한이 없습니다" : "운영 데이터를 불러오지 못했습니다"}
        description={state.error}
        action={
          <Button variant="outline" size="sm" onClick={state.reload}>
            <RefreshCw /> 다시 시도
          </Button>
        }
      />
    )
  }
  return <>{children}</>
}

function StatePanel({
  title,
  description,
  tone = "neutral",
  action,
}: {
  title: string
  description: string
  tone?: "neutral" | "warning" | "danger"
  action?: ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-md border p-5 sm:flex-row sm:items-center",
        tone === "warning" && "ui-status-warning",
        tone === "danger" && "ui-status-danger"
      )}
    >
      <AlertCircle
        className={cn(
          "size-5 shrink-0 text-muted-foreground",
          tone === "warning" && "text-warning-foreground",
          tone === "danger" && "text-destructive"
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

function MetricCard({
  label,
  value,
  note,
}: {
  label: string
  value: ReactNode
  note?: ReactNode
}) {
  return (
    <div className="ecoya-card min-w-0 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 break-words text-xl font-semibold tabular-nums">{value}</p>
      {note ? <div className="mt-1 text-xs text-muted-foreground">{note}</div> : null}
    </div>
  )
}

async function loadOverview() {
  const [summary, tenants, signups, integrations, usage] = await Promise.allSettled([
    snapApi.operations.platformOverview(),
    snapApi.operations.tenants(),
    snapApi.operations.pendingSignups(),
    snapApi.operations.integrations(),
    snapApi.ai.usage(),
  ])
  const failures = [summary, tenants, signups, integrations, usage]
    .filter((entry) => entry.status === "rejected")
    .map((entry) =>
      entry.status === "rejected" ? snapApiErrorMessage(entry.reason) : ""
    )
  if (failures.length === 5) throw new Error(failures[0])
  return {
    summary: summary.status === "fulfilled" ? summary.value : null,
    tenants: tenants.status === "fulfilled" ? tenants.value : null,
    signups: signups.status === "fulfilled" ? signups.value : null,
    integrations:
      integrations.status === "fulfilled" ? integrations.value : null,
    usage: usage.status === "fulfilled" ? usage.value : null,
    failures,
  }
}

function PlatformOverviewPage() {
  const state = usePlatformResource("platform-overview", loadOverview)
  const data = state.data
  const tenants = pageItems(data?.tenants)
  const signups = pageItems(data?.signups)
  const integrations = pageItems(data?.integrations)
  const usage = recordValue(data?.usage)
  const summary = recordValue(data?.summary)
  const tenantSummary = recordValue(summary.tenants)
  const tenantStatuses = recordValue(tenantSummary.by_status)
  const signupSummary = recordValue(summary.signups)
  const integrationSummary = recordValue(summary.integrations)
  const requiredPending = integrations.filter(
    (row) => row.required && !row.configured
  )
  const activeTenants = tenants.filter((row) => row.status === "active").length

  return (
    <PlatformPage title="플랫폼 운영 현황" description="가입, 테넌트, 외부 연동과 AI 운영 상태를 실제 서비스 데이터로 확인합니다.">
      <ResourceBoundary state={state}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="활성 테넌트"
            value={numberValue(tenantStatuses.active, activeTenants)}
            note={`전체 ${numberValue(tenantSummary.total, tenants.length)}개`}
          />
          <MetricCard label="가입 승인 대기" value={numberValue(signupSummary.pending_approval, signups.length)} note="검토 후 승인 또는 거절" />
          <MetricCard
            label="필수 연동 미설정"
            value={numberValue(integrationSummary.required_missing, requiredPending.length)}
            note={`${integrations.filter((row) => Boolean(row.configured)).length}/${integrations.length} 설정`}
          />
          <MetricCard
            label="AI 호출"
            value={numberValue(usage.estate_call_count, rowsValue(usage.items).length)}
            note={formatUsd(usage.estate_total_estimated_cost ?? usage.total_estimated_cost)}
          />
        </div>
        {data?.failures.length ? (
          <StatePanel
            tone="warning"
            title="일부 운영 지표를 불러오지 못했습니다"
            description={data.failures.join(" · ")}
            action={<Button variant="outline" size="sm" onClick={state.reload}><RefreshCw /> 다시 시도</Button>}
          />
        ) : null}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-md shadow-none">
            <CardHeader>
              <CardTitle className="text-base">확인 필요한 운영 항목</CardTitle>
              <CardDescription>실제 응답에서 조치가 필요한 상태만 표시합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {signups.length === 0 && requiredPending.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">현재 확인할 운영 항목이 없습니다.</p>
              ) : (
                <>
                  {signups.length > 0 ? <StatePanel tone="warning" title={`가입 승인 대기 ${signups.length}건`} description="조직 신청 정보를 확인하고 결정을 기록하세요." /> : null}
                  {requiredPending.map((row) => <StatePanel key={textValue(row.key)} tone="danger" title={`${textValue(row.vendor)} 연동 미설정`} description={`${textValue(row.category)} · ${textValue(row.scope)}`} />)}
                </>
              )}
            </CardContent>
          </Card>
          <Card className="rounded-md shadow-none">
            <CardHeader>
              <CardTitle className="text-base">최근 AI 실행</CardTitle>
              <CardDescription>비용과 실패 상태를 함께 확인합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <CompactTable
                empty="AI 사용 기록이 없습니다."
                rows={rowsValue(usage.items).slice(0, 5)}
                columns={[
                  { label: "레이어", render: (row) => textValue(row.layer) },
                  { label: "상태", render: (row) => textValue(row.status) },
                  { label: "비용", render: (row) => formatUsd(row.estimated_cost, 5) },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </ResourceBoundary>
    </PlatformPage>
  )
}

function PlatformSignupsPage() {
  const state = usePlatformResource("platform-signups", () => snapApi.operations.pendingSignups())
  const [search, setSearch] = useState("")
  const [since, setSince] = useState("")
  const [busyId, setBusyId] = useState("")
  const [decision, setDecision] = useState<{
    row: SnapJsonRecord
    action: "approve" | "reject"
  } | null>(null)
  const [reason, setReason] = useState("")
  const items = pageItems(state.data)
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const cutoff = since ? new Date(`${since}T00:00:00`) : null
    return items.filter((row) => {
      const haystack = `${textValue(row.org_name, textValue(row.name, ""))} ${textValue(row.requested_by, textValue(row.signup_email, ""))} ${textValue(row.org_slug, textValue(row.slug, ""))} ${textValue(row.id, "")}`.toLowerCase()
      if (query && !haystack.includes(query)) return false
      if (!cutoff) return true
      const created = new Date(textValue(row.created_at, ""))
      return !Number.isNaN(created.getTime()) && created >= cutoff
    })
  }, [items, search, since])

  const decide = async (row: SnapJsonRecord, action: "approve" | "reject") => {
    const id = textValue(row.id, "")
    if (!id) return
    setBusyId(id)
    try {
      if (action === "approve") await snapApi.operations.approvePendingSignup(id, { reason: reason.trim() })
      else await snapApi.operations.rejectPendingSignup(id, { reason: reason.trim() })
      toast.success(action === "approve" ? "가입 요청을 승인했습니다." : "가입 요청을 거절했습니다.")
      setDecision(null)
      setReason("")
      state.reload()
    } catch (error) {
      toast.error(snapApiErrorMessage(error))
    } finally {
      setBusyId("")
    }
  }

  return (
    <PlatformPage title="가입 요청" description="조직 신청 정보를 검색하고 승인 또는 거절 결정을 기록합니다.">
      <ResourceBoundary state={state}>
        <div className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-xs font-medium text-muted-foreground">
            검색
            <span className="relative mt-1 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="조직명, 신청 이메일, slug" />
            </span>
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            신청일 이후
            <Input className="mt-1 sm:w-44" type="date" value={since} onChange={(event) => setSince(event.target.value)} />
          </label>
        </div>
        <Card className="rounded-md shadow-none">
          <CardHeader>
            <CardTitle className="text-base">승인 대기 {filtered.length}건</CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <StatePanel title="승인 대기 요청이 없습니다" description={items.length ? "검색 조건을 변경해 보세요." : "새 조직 가입 요청이 들어오면 여기에 표시됩니다."} />
            ) : (
              <div className="space-y-2">
                {filtered.map((row) => {
                  const id = textValue(row.id)
                  return (
                    <div key={id} className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted"><Building2 className="size-4" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{textValue(row.org_name, "조직 이름 미입력")}</p>
                        <p className="mt-1 break-all text-xs text-muted-foreground">{textValue(row.org_slug, id)} · 플랜 {textValue(row.plan_key, "미정")} · {formatDateTime(row.created_at)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" disabled={Boolean(busyId)} onClick={() => { setReason(""); setDecision({ row, action: "approve" }) }}>
                          {busyId === id ? <LoaderCircle className="animate-spin" /> : <Check />} 승인
                        </Button>
                        <Button size="sm" variant="destructive" disabled={Boolean(busyId)} onClick={() => { setReason(""); setDecision({ row, action: "reject" }) }}><X /> 거절</Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </ResourceBoundary>
      <Dialog open={Boolean(decision)} onOpenChange={(open) => !open && setDecision(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>가입 요청 {decision?.action === "approve" ? "승인" : "거절"}</DialogTitle>
            <DialogDescription>{textValue(decision?.row.org_name, "이 조직")}의 결정 사유를 감사 이력에 기록합니다.</DialogDescription>
          </DialogHeader>
          <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder={decision?.action === "approve" ? "예: 사업자 정보와 담당자 확인 완료" : "예: 검증 실패 또는 보완이 필요한 이유"} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecision(null)}>취소</Button>
            <Button variant={decision?.action === "reject" ? "destructive" : "default"} disabled={!decision || !reason.trim() || Boolean(busyId)} onClick={() => decision && void decide(decision.row, decision.action)}>{decision?.action === "approve" ? "승인 확정" : "거절 확정"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PlatformPage>
  )
}

function PlatformTenantsPage({ navigate }: { navigate: PlatformNavigate }) {
  const state = usePlatformResource("platform-tenants", () => snapApi.operations.tenants())
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const data = recordValue(state.data)
  const items = pageItems(state.data)
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items.filter((row) => {
      const lifecycleStatus = textValue(row.lifecycle_status, textValue(row.status))
      if (status !== "all" && lifecycleStatus !== status) return false
      return !query || `${textValue(row.name, "")} ${textValue(row.slug, "")} ${textValue(row.org_id, textValue(row.id))} ${textValue(row.bundle_code, "")}`.toLowerCase().includes(query)
    })
  }, [items, search, status])

  return (
    <PlatformPage title="조직" description="플랫폼의 모든 조직과 플랜·좌석·최근 사용 상태를 확인합니다.">
      <ResourceBoundary state={state}>
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard label="전체 조직" value={numberValue(data.total, items.length)} />
          <MetricCard label="활성" value={numberValue(data.active, items.filter((row) => row.status === "active").length)} />
          <MetricCard label="승인 대기" value={numberValue(data.pending, items.filter((row) => row.status === "pending").length)} />
        </div>
        <div className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="조직명, slug, ID, 플랜" />
          </div>
          <Select value={status} onValueChange={(value) => value && setStatus(value)}>
            <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">전체 상태</SelectItem><SelectItem value="active">active</SelectItem><SelectItem value="pending">pending</SelectItem><SelectItem value="suspended">suspended</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader><TableRow><TableHead>조직</TableHead><TableHead>상태</TableHead><TableHead>플랜·구독</TableHead><TableHead className="text-right">멤버</TableHead><TableHead className="text-right">업무</TableHead><TableHead className="text-right">보고서</TableHead><TableHead className="text-right">크레딧</TableHead><TableHead>최근 업무</TableHead><TableHead>지원</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? <TableRow><TableCell colSpan={9} className="h-28 text-center text-muted-foreground">조건에 맞는 조직이 없습니다.</TableCell></TableRow> : filtered.map((row) => {
                const id = textValue(row.org_id, textValue(row.id))
                const lifecycleStatus = textValue(row.lifecycle_status, textValue(row.status))
                return <TableRow key={id}>
                  <TableCell><p className="font-medium">{textValue(row.name)}</p><p className="text-xs text-muted-foreground">{textValue(row.slug, id)}</p></TableCell>
                  <TableCell><Badge variant={lifecycleStatus === "active" ? "secondary" : lifecycleStatus === "suspended" ? "destructive" : "outline"}>{lifecycleStatus}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{textValue(row.bundle_code, "미지정")}</Badge><p className="mt-1 text-xs text-muted-foreground">{textValue(row.subscription_status, "구독 정보 없음")}</p></TableCell>
                  <TableCell className="text-right tabular-nums">{numberValue(row.member_count)}</TableCell><TableCell className="text-right tabular-nums">{numberValue(row.snap_task_count, numberValue(row.task_count))}</TableCell><TableCell className="text-right tabular-nums">{numberValue(row.snap_report_count, numberValue(row.report_count))}</TableCell><TableCell className="text-right tabular-nums">{numberValue(row.credit_balance).toLocaleString()}</TableCell><TableCell>{formatDateTime(row.last_snap_task_at ?? row.last_task_at)}</TableCell>
                  <TableCell><Button variant="outline" size="xs" onClick={() => navigate("SC-34", { params: { orgId: id } })}>지원 뷰</Button></TableCell>
                </TableRow>
              })}
            </TableBody>
          </Table>
        </div>
      </ResourceBoundary>
    </PlatformPage>
  )
}

function PlatformSupportPage({ orgId, navigate }: { orgId: string; navigate: PlatformNavigate }) {
  const state = usePlatformResource(`platform-support:${orgId}`, () => {
    if (!orgId) return Promise.reject(new Error("조직 ID가 없습니다."))
    return snapApi.operations.tenantSupportView(orgId) as Promise<SupportView>
  })
  const data = state.data
  const org = recordValue(data?.organization)
  const summary = recordValue(data?.summary)
  const sections = [
    { title: "최근 업무", rows: data?.recent_tasks ?? [], columns: [{ label: "제목", render: (row: SnapJsonRecord) => textValue(row.title) }, { label: "상태", render: (row: SnapJsonRecord) => textValue(row.status) }, { label: "생성", render: (row: SnapJsonRecord) => formatDateTime(row.created_at) }] },
    { title: "최근 전달", rows: data?.recent_deliveries ?? [], columns: [{ label: "보고서", render: (row: SnapJsonRecord) => textValue(row.report_id) }, { label: "채널", render: (row: SnapJsonRecord) => textValue(row.channel) }, { label: "상태", render: (row: SnapJsonRecord) => textValue(row.status) }, { label: "생성", render: (row: SnapJsonRecord) => formatDateTime(row.created_at) }] },
  ]

  return (
    <PlatformPage title="조직 지원" description="테넌트 콘텐츠를 수정하지 않는 감사 대상 읽기 전용 지원 화면입니다." actions={<Button variant="outline" onClick={() => navigate("SC-33")}>조직 목록</Button>}>
      <ResourceBoundary state={state}>
        <div className="flex flex-wrap items-center gap-3 rounded-md border p-4"><span className="flex size-11 items-center justify-center rounded-md bg-muted"><Building2 /></span><div className="min-w-0 flex-1"><p className="font-semibold">{textValue(org.name)}</p><p className="text-sm text-muted-foreground">{textValue(org.slug, textValue(org.org_id))} · {textValue(org.lifecycle_status)}</p></div>{data?.read_only ? <Badge variant="secondary">읽기 전용</Badge> : null}{data?.audited ? <Badge variant="outline">감사 기록</Badge> : null}<ShieldCheck className="size-5 text-success" /></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><MetricCard label="멤버" value={numberValue(summary.member_count)} /><MetricCard label="업무" value={numberValue(summary.task_count)} /><MetricCard label="보고서" value={numberValue(summary.report_count)} /><MetricCard label="전달 실패" value={numberValue(summary.failed_deliveries)} /><MetricCard label="활성 링크" value={numberValue(summary.active_share_links)} /><MetricCard label="크레딧" value={numberValue(summary.credit_balance).toLocaleString()} /></div>
        {sections.map((section) => <Card key={section.title} className="rounded-md shadow-none"><CardHeader><CardTitle className="text-base">{section.title}</CardTitle></CardHeader><CardContent><CompactTable empty={`${section.title} 내역이 없습니다.`} rows={section.rows} columns={section.columns} /></CardContent></Card>)}
      </ResourceBoundary>
    </PlatformPage>
  )
}

function PlatformIntegrationsPage() {
  const state = usePlatformResource("platform-integrations", () => snapApi.operations.integrations())
  const payload = recordValue(state.data)
  const items = pageItems(state.data).map((row) => ({
    key: textValue(row.key), category: textValue(row.category, "other"), vendor: textValue(row.vendor), scope: textValue(row.scope), required: Boolean(row.required), launch_phase: textValue(row.launch_phase), configured: Boolean(row.configured), env: rowsValue(row.env).map((item) => ({ key: textValue(item.key), set: Boolean(item.set) })),
  })) as IntegrationRow[]
  const groups = useMemo(() => {
    const result = new Map<string, IntegrationRow[]>()
    items.forEach((item) => {
      result.set(item.category, [...(result.get(item.category) ?? []), item])
    })
    return result
  }, [items])
  return <PlatformPage title="연동 상태" description="외부 SaaS와 인프라 환경변수의 실제 설정 여부를 확인합니다.">
    <ResourceBoundary state={state}>
      <div className="flex flex-wrap items-center gap-3 rounded-md border p-4"><Badge variant={payload.launch_ready ? "secondary" : "destructive"}>{payload.launch_ready ? "출시 준비 완료" : "출시 준비 미완료"}</Badge><span className="text-sm">설정 {numberValue(payload.configured, items.filter((row) => row.configured).length)}/{numberValue(payload.total, items.length)}</span><span className="text-sm text-muted-foreground">필수 {numberValue(payload.required_ready)}/{numberValue(payload.required_total)}</span></div>
      {items.length === 0 ? <StatePanel title="등록된 연동이 없습니다" description="백엔드 연동 레지스트리에 항목이 추가되면 이곳에서 상태를 확인할 수 있습니다." /> : Array.from(groups.entries()).map(([category, rows]) => <Card key={category} className="rounded-md shadow-none"><CardHeader><CardTitle className="text-base">{category}</CardTitle></CardHeader><CardContent className="space-y-2">{rows.map((row) => <div key={row.key} className={cn("rounded-md border p-3", row.configured && "ui-status-success")}><div className="flex flex-wrap items-center gap-2">{row.configured ? <CheckCircle2 className="size-4 text-success" /> : <Circle className="size-4 text-muted-foreground" />}<span className="font-medium">{row.vendor}</span><Badge variant={row.required ? "secondary" : "outline"}>{row.required ? "필수" : "선택"}</Badge><Badge variant="outline">{row.launch_phase}</Badge><span className="ml-auto text-xs text-muted-foreground">{row.configured ? "설정됨" : "미설정"}</span></div><p className="mt-1 pl-6 text-xs text-muted-foreground">{row.scope}</p><div className="mt-2 flex flex-wrap gap-1 pl-6">{row.env.map((env) => <code key={env.key} className={cn("rounded border px-1.5 py-0.5 text-[11px]", env.set ? "border-success/30 text-success" : "text-muted-foreground")}>{env.set ? "✓" : "○"} {env.key}</code>)}</div></div>)}</CardContent></Card>)}
    </ResourceBoundary>
  </PlatformPage>
}

async function loadAiConsole() {
  const [routing, usage, budget, economics] = await Promise.allSettled([snapApi.ai.routing(), snapApi.ai.usage(), snapApi.ai.budget(), snapApi.ai.unitEconomics()])
  const failures = [routing, usage, budget, economics].filter((entry) => entry.status === "rejected").map((entry) => entry.status === "rejected" ? snapApiErrorMessage(entry.reason) : "")
  if (failures.length === 4) throw new Error(failures[0])
  return { routing: routing.status === "fulfilled" ? routing.value : null, usage: usage.status === "fulfilled" ? usage.value : null, budget: budget.status === "fulfilled" ? budget.value : null, economics: economics.status === "fulfilled" ? economics.value : null, failures }
}

function PlatformAiPage() {
  const state = usePlatformResource("platform-ai", loadAiConsole)
  const routing = recordValue(state.data?.routing)
  const usage = recordValue(state.data?.usage)
  const budget = Object.keys(recordValue(state.data?.budget)).length ? recordValue(state.data?.budget) : recordValue(routing.budget)
  const economics = recordValue(state.data?.economics)
  const used = numberValue(budget.used_usd)
  const limit = numberValue(budget.monthly_limit_usd)
  const percent = limit > 0 ? Math.min(100, (used / limit) * 100) : 0
  return <PlatformPage title="AI 사용량" description="모델 라우팅, 실제 호출 비용, 월 예산과 보고서 단위 경제성을 확인합니다.">
    <ResourceBoundary state={state}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="운영 모드" value={textValue(routing.mode)} note={`Capture ${textValue(routing.capture_intel_mode)}`} /><MetricCard label="AI 호출" value={numberValue(usage.estate_call_count, rowsValue(usage.items).length)} /><MetricCard label="누적 추정 비용" value={formatUsd(usage.estate_total_estimated_cost ?? usage.total_estimated_cost)} /><MetricCard label="월 예산" value={`${percent.toFixed(1)}%`} note={`${formatUsd(used, 2)} / ${formatUsd(limit, 2)}`} /></div>
      <Card className="rounded-md shadow-none"><CardHeader><CardTitle className="text-base">예산 소진</CardTitle></CardHeader><CardContent><Progress value={percent} /><p className="mt-2 text-xs text-muted-foreground">{budget.over_limit ? "월 예산을 초과했습니다." : budget.alert ? "예산 알림 기준에 도달했습니다." : "예산 범위 안에서 운영 중입니다."}</p></CardContent></Card>
      <div className="grid gap-4 lg:grid-cols-2"><Card className="rounded-md shadow-none"><CardHeader><CardTitle className="text-base">단위 경제성</CardTitle><CardDescription>전달 완료 보고서를 기준으로 계산합니다.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><MetricCard label="전달 보고서" value={numberValue(economics.delivered_reports)} /><MetricCard label="보고서당 AI 비용" value={formatUsd(economics.avg_ai_cost_per_report_usd)} /><MetricCard label="크레딧당 총이익" value={formatUsd(economics.gross_margin_per_credit_usd, 2)} /><MetricCard label="총이익률" value={`${numberValue(economics.gross_margin_pct).toFixed(1)}%`} /></CardContent></Card><Card className="rounded-md shadow-none"><CardHeader><CardTitle className="text-base">모델 라우팅</CardTitle></CardHeader><CardContent><CompactTable empty="라우팅 규칙이 없습니다." rows={rowsValue(routing.routes)} columns={[{ label: "레이어", render: (row) => textValue(row.layer) }, { label: "모델", render: (row) => textValue(row.effective_model ?? row.model) }, { label: "Provider", render: (row) => textValue(row.provider) }, { label: "Tier", render: (row) => textValue(row.tier) }]} /></CardContent></Card></div>
      <Card className="rounded-md shadow-none"><CardHeader><CardTitle className="text-base">최근 사용 기록</CardTitle></CardHeader><CardContent><CompactTable empty="AI 사용 기록이 없습니다." rows={rowsValue(usage.items).slice(0, 25)} columns={[{ label: "레이어", render: (row) => textValue(row.layer) }, { label: "모델", render: (row) => textValue(row.model) }, { label: "상태", render: (row) => textValue(row.status) }, { label: "비용", render: (row) => formatUsd(row.estimated_cost, 5) }, { label: "시각", render: (row) => formatDateTime(row.created_at) }]} /></CardContent></Card>
      {state.data?.failures.length ? <StatePanel tone="warning" title="일부 AI 지표를 불러오지 못했습니다" description={state.data.failures.join(" · ")} action={<Button variant="outline" size="sm" onClick={state.reload}><RefreshCw /> 다시 시도</Button>} /> : null}
    </ResourceBoundary>
  </PlatformPage>
}

function CompactTable({ rows, columns, empty }: { rows: SnapJsonRecord[]; columns: Array<{ label: string; render: (row: SnapJsonRecord) => ReactNode }>; empty: string }) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>
  return <div className="overflow-x-auto"><Table><TableHeader><TableRow>{columns.map((column) => <TableHead key={column.label}>{column.label}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map((row, index) => <TableRow key={textValue(row.id, String(index))}>{columns.map((column) => <TableCell key={column.label} className="max-w-xs break-words">{column.render(row)}</TableCell>)}</TableRow>)}</TableBody></Table></div>
}

function PlatformPage({ title, description, actions, children }: { title: string; description: string; actions?: ReactNode; children: ReactNode }) {
  return <div className="mx-auto flex w-full max-w-ecoya-wide-xl flex-col gap-5 p-5 lg:p-7"><PlatformPageHeader title={title} description={description} actions={actions} />{children}</div>
}

export function SnapPlatformPages({ screen, navigate, routeParams }: SnapPlatformPagesProps) {
  if (screen === "SC-31") return <PlatformOverviewPage />
  if (screen === "SC-32") return <PlatformSignupsPage />
  if (screen === "SC-33") return <PlatformTenantsPage navigate={navigate} />
  if (screen === "SC-34") return <PlatformSupportPage orgId={routeParams?.orgId || ""} navigate={navigate} />
  if (screen === "SC-35") return <PlatformIntegrationsPage />
  return <PlatformAiPage />
}

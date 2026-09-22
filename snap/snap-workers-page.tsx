import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  CheckCircle2,
  Clock3,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react"
import { toast } from "sonner"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
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
import { snapApi } from "@snap/lib/snap-api"
import {
  snapApiConfigured,
  snapApiErrorMessage,
  type SnapJsonRecord,
} from "@snap/lib/snap-report-api"
import { cn } from "@shared/lib/utils"

type MemberRole = "owner" | "admin" | "manager" | "worker" | "viewer"
type WorkRole = "manager" | "worker"
type MemberStatus = "active" | "inactive" | "pending_approval"
type WorkerSummaryFilter = "all" | "worker" | "manager" | "pending"

type Member = {
  id: string
  name: string
  email: string
  role: MemberRole
  status: MemberStatus
  createdAt: string
}

type PendingInvite = {
  id: string
  email: string
  role: WorkRole
  createdAt: string
}

type Plan = {
  tier: string
  unlimited: boolean
  seats: number
  seatsUsed: number
  seatsAvailable: number
}

type ConfirmAction =
  | { kind: "deactivate" | "reactivate" | "approve"; member: Member }
  | { kind: "revoke"; invite: PendingInvite }
  | null

const ROLE_OPTIONS: WorkRole[] = [
  "worker",
  "manager",
]

const DEMO_MEMBERS: Member[] = [
  {
    id: "member-owner",
    name: "조민영",
    email: "minyoung@ecoya.app",
    role: "owner",
    status: "active",
    createdAt: "2026-04-03T09:00:00+09:00",
  },
  {
    id: "member-manager",
    name: "김민지",
    email: "minji@ecoya.app",
    role: "manager",
    status: "active",
    createdAt: "2026-05-11T09:00:00+09:00",
  },
  {
    id: "member-worker",
    name: "박서준",
    email: "worker@ecoya.app",
    role: "worker",
    status: "active",
    createdAt: "2026-06-18T09:00:00+09:00",
  },
  {
    id: "member-pending",
    name: "가입 요청 사용자",
    email: "pending@ecoya.app",
    role: "worker",
    status: "pending_approval",
    createdAt: "2026-08-04T15:20:00+09:00",
  },
]

const DEMO_INVITES: PendingInvite[] = [
  {
    id: "invite-1",
    email: "field@partner.example",
    role: "worker",
    createdAt: "2026-08-03T11:00:00+09:00",
  },
]

const DEMO_PLAN: Plan = {
  tier: "pro",
  unlimited: false,
  seats: 10,
  seatsUsed: 5,
  seatsAvailable: 5,
}

function stringValue(record: SnapJsonRecord, keys: string[], fallback = "") {
  for (const key of keys) {
    if (typeof record[key] === "string" && record[key]) return String(record[key])
  }
  return fallback
}

function numberValue(record: SnapJsonRecord, keys: string[], fallback = 0) {
  for (const key of keys) {
    if (typeof record[key] === "number") return Number(record[key])
  }
  return fallback
}

function memberFromApi(record: SnapJsonRecord, index: number): Member {
  const rawRole = stringValue(record, ["role"], "worker").toLowerCase()
  const rawStatus = stringValue(record, ["status"], "active").toLowerCase()
  return {
    id: stringValue(record, ["id", "member_id", "user_id"], `member-${index}`),
    name: stringValue(record, ["name", "display_name"], "이름 없음"),
    email: stringValue(record, ["email"], "이메일 없음"),
    role: (["owner", "admin", "manager", "worker", "viewer"].includes(rawRole)
      ? rawRole
      : "worker") as MemberRole,
    status: (["active", "inactive", "pending_approval"].includes(rawStatus)
      ? rawStatus
      : "inactive") as MemberStatus,
    createdAt: stringValue(record, ["created_at", "joined_at"], ""),
  }
}

function inviteFromApi(record: SnapJsonRecord, index: number): PendingInvite {
  const rawRole = stringValue(record, ["role"], "worker").toLowerCase()
  return {
    id: stringValue(record, ["id", "invite_id", "token"], `invite-${index}`),
    email: stringValue(record, ["email"], "이메일 없음"),
    role: ROLE_OPTIONS.includes(rawRole as WorkRole)
      ? (rawRole as WorkRole)
      : rawRole === "admin" || rawRole === "owner"
        ? "manager"
        : "worker",
    createdAt: stringValue(record, ["created_at"], ""),
  }
}

function planFromApi(record: SnapJsonRecord): Plan {
  return {
    tier: stringValue(record, ["tier", "plan"], "free"),
    unlimited: Boolean(record.unlimited),
    seats: numberValue(record, ["seats", "seat_limit"], 0),
    seatsUsed: numberValue(record, ["seats_used", "used_seats"], 0),
    seatsAvailable: numberValue(record, ["seats_available", "available_seats"], 0),
  }
}

function roleLabel(role: MemberRole) {
  return {
    owner: "작업 매니저",
    admin: "작업 매니저",
    manager: "작업 매니저",
    worker: "작업자",
    viewer: "조회 전용",
  }[role]
}

function organizationRoleLabel(role: MemberRole) {
  if (role === "owner") return "조직 Owner"
  if (role === "admin") return "조직 Admin"
  return ""
}

function statusLabel(status: MemberStatus) {
  return {
    active: "활성",
    inactive: "비활성",
    pending_approval: "승인 대기",
  }[status]
}

function formatDate(value: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

function initials(member: Member) {
  const basis = member.name !== "이름 없음" ? member.name : member.email
  return basis.slice(0, 2).toUpperCase()
}

function Metric({
  label,
  value,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  value: string
  icon: typeof Users
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="ui-summary-filter border-r px-4 py-4 last:border-r-0"
      aria-pressed={active}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{label}</span>
        <Icon className="size-4" />
      </div>
      <div className="mt-2 text-xl font-semibold tabular-nums">{value}</div>
    </button>
  )
}

export function SnapWorkersPage() {
  const [members, setMembers] = useState<Member[]>(
    snapApiConfigured ? [] : DEMO_MEMBERS
  )
  const [invites, setInvites] = useState<PendingInvite[]>(
    snapApiConfigured ? [] : DEMO_INVITES
  )
  const [plan, setPlan] = useState<Plan | null>(
    snapApiConfigured ? null : DEMO_PLAN
  )
  const [sessionUserId, setSessionUserId] = useState(
    snapApiConfigured ? "" : "member-owner"
  )
  const [sessionRole, setSessionRole] = useState<MemberRole>("owner")
  const [search, setSearch] = useState("")
  const [summaryFilter, setSummaryFilter] = useState<WorkerSummaryFilter>("all")
  const [loading, setLoading] = useState(snapApiConfigured)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<PendingInvite["role"]>("worker")
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)

  const isAdmin = sessionRole === "owner" || sessionRole === "admin"
  const seatsFull = Boolean(plan && !plan.unlimited && plan.seatsAvailable <= 0)

  async function load() {
    setLoading(true)
    setError("")
    if (!snapApiConfigured) {
      setMembers(DEMO_MEMBERS)
      setInvites(DEMO_INVITES)
      setPlan(DEMO_PLAN)
      setSessionRole("owner")
      setSessionUserId("member-owner")
      setLoading(false)
      return
    }
    try {
      const [memberPage, invitePage, planRecord, session] = await Promise.all([
        snapApi.organization.members(),
        snapApi.organization.invites(),
        snapApi.session.plan(),
        snapApi.session.me(),
      ])
      setMembers(memberPage.items.map(memberFromApi))
      setInvites(invitePage.items.map(inviteFromApi))
      setPlan(planFromApi(planRecord))
      setSessionRole(
        memberFromApi(
          {
            id: session.user_id ?? session.id,
            name: session.name,
            email: session.email,
            role: session.role,
            status: "active",
          },
          0
        ).role
      )
      setSessionUserId(stringValue(session, ["user_id", "id"]))
    } catch (reason) {
      setError(snapApiErrorMessage(reason))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!snapApiConfigured) return
    let cancelled = false
    const loadInitialData = async () => {
      try {
        const [memberPage, invitePage, planRecord, session] = await Promise.all([
          snapApi.organization.members(),
          snapApi.organization.invites(),
          snapApi.session.plan(),
          snapApi.session.me(),
        ])
        if (cancelled) return
        setMembers(memberPage.items.map(memberFromApi))
        setInvites(invitePage.items.map(inviteFromApi))
        setPlan(planFromApi(planRecord))
        setSessionRole(
          memberFromApi(
            {
              id: session.user_id ?? session.id,
              name: session.name,
              email: session.email,
              role: session.role,
              status: "active",
            },
            0
          ).role
        )
        setSessionUserId(stringValue(session, ["user_id", "id"]))
      } catch (reason) {
        if (!cancelled) setError(snapApiErrorMessage(reason))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadInitialData()
    return () => {
      cancelled = true
    }
  }, [])

  const counts = useMemo(
    () => ({
      all: members.length,
      active: members.filter((member) => member.status === "active").length,
      workers: members.filter((member) => member.status === "active" && member.role === "worker").length,
      managers: members.filter(
        (member) => member.status === "active" && ["owner", "admin", "manager"].includes(member.role)
      ).length,
      joinRequests: members.filter((member) => member.status === "pending_approval").length,
      invites: invites.length,
    }),
    [invites.length, members]
  )

  const visibleMembers = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const joinedMembers = members.filter((member) => member.status !== "pending_approval")
    const roleFilteredMembers = summaryFilter === "worker"
      ? joinedMembers.filter((member) => member.role === "worker")
      : summaryFilter === "manager"
        ? joinedMembers.filter((member) => ["owner", "admin", "manager"].includes(member.role))
        : summaryFilter === "pending"
          ? []
          : joinedMembers
    if (!needle) return roleFilteredMembers
    return roleFilteredMembers.filter((member) =>
      `${member.name} ${member.email} ${member.role} ${member.status}`.toLowerCase().includes(needle)
    )
  }, [members, search, summaryFilter])

  const joinRequests = useMemo(
    () => members.filter((member) => member.status === "pending_approval"),
    [members]
  )
  const showPending = summaryFilter === "all" || summaryFilter === "pending"
  const showJoinedMembers = summaryFilter !== "pending"

  async function changeRole(member: Member, role: WorkRole) {
    if (member.role === role) return
    setBusy(true)
    try {
      if (snapApiConfigured) await snapApi.organization.updateMember(member.id, { role })
      setMembers((current) => current.map((item) => (item.id === member.id ? { ...item, role } : item)))
      toast.success("역할을 변경했습니다.")
    } catch (reason) {
      toast.error(snapApiErrorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  async function runConfirmedAction() {
    if (!confirmAction) return
    setBusy(true)
    try {
      if (confirmAction.kind === "revoke") {
        if (snapApiConfigured) await snapApi.organization.revokeInvite(confirmAction.invite.id)
        setInvites((current) => current.filter((item) => item.id !== confirmAction.invite.id))
        toast.success("초대를 회수했습니다.")
      } else {
        const { member, kind } = confirmAction
        if (snapApiConfigured) {
          if (kind === "deactivate") await snapApi.organization.deactivateMember(member.id)
          if (kind === "reactivate") await snapApi.organization.reactivateMember(member.id)
          if (kind === "approve") await snapApi.organization.approveMemberJoin(member.id)
        }
        const nextStatus: MemberStatus = kind === "deactivate" ? "inactive" : "active"
        setMembers((current) => current.map((item) => (item.id === member.id ? { ...item, status: nextStatus } : item)))
        toast.success(kind === "approve" ? "가입 요청을 승인했습니다." : "작업 인력 상태를 변경했습니다.")
      }
      setConfirmAction(null)
    } catch (reason) {
      toast.error(snapApiErrorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  async function inviteMember(event: FormEvent) {
    event.preventDefault()
    if (!inviteEmail.trim() || seatsFull) return
    setBusy(true)
    try {
      let created: PendingInvite
      if (snapApiConfigured) {
        created = inviteFromApi(
          await snapApi.auth.createInvite({
            email: inviteEmail.trim().toLowerCase(),
            role: inviteRole,
          }),
          invites.length
        )
      } else {
        created = {
          id: `invite-${Date.now()}`,
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
          createdAt: new Date().toISOString(),
        }
      }
      setInvites((current) => [created, ...current])
      setPlan((current) =>
        current && !current.unlimited
          ? { ...current, seatsUsed: current.seatsUsed + 1, seatsAvailable: Math.max(0, current.seatsAvailable - 1) }
          : current
      )
      setInviteEmail("")
      setInviteRole("worker")
      setInviteOpen(false)
      toast.success("초대를 보냈습니다.")
    } catch (reason) {
      const message = snapApiErrorMessage(reason)
      toast.error(message.includes("seat_limit_reached") ? "사용 가능한 좌석이 없습니다." : message)
    } finally {
      setBusy(false)
    }
  }

  const confirmCopy = confirmAction?.kind === "revoke"
    ? { title: "초대를 회수할까요?", description: "회수하면 기존 초대 링크는 더 이상 사용할 수 없습니다.", action: "초대 회수" }
    : confirmAction?.kind === "deactivate"
      ? { title: "작업 인력을 비활성화할까요?", description: "비활성화하면 이 작업자 또는 작업 매니저의 현장 업무 접근이 즉시 차단됩니다.", action: "비활성화" }
      : confirmAction?.kind === "reactivate"
        ? { title: "작업 인력을 복구할까요?", description: "복구하면 기존 현장 역할로 업무에 다시 접근할 수 있습니다.", action: "복구" }
        : {
            title: "가입 요청을 승인할까요?",
            description: confirmAction?.kind === "approve"
              ? `${confirmAction.member.email} 사용자가 ${roleLabel(confirmAction.member.role)} 역할로 조직에 참여합니다.`
              : "승인하면 이 사용자가 지정된 역할로 조직에 참여합니다.",
            action: "가입 승인",
          }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-ecoya-wide-xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-start justify-between gap-4 pb-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">작업자 · 작업 매니저</h1>
              {plan ? (
                <Badge variant="secondary">
                  {plan.tier.toUpperCase()} · {plan.unlimited ? "좌석 무제한" : `${plan.seatsUsed}/${plan.seats}석`}
                </Badge>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              현장 작업자와 작업 매니저를 관리하고 배정·검토 권한을 설정합니다. 고객 수신자와는 별도입니다.
            </p>
          </div>
          {isAdmin ? (
            <Button onClick={() => setInviteOpen(true)} disabled={seatsFull} title={seatsFull ? "좌석이 모두 사용 중입니다." : undefined}>
              <UserPlus /> 작업 인력 초대
            </Button>
          ) : null}
        </header>

        {seatsFull ? (
          <div className="ui-status-warning mt-5 px-4 py-3 text-sm">
            사용 가능한 좌석이 없습니다. 비활성 작업 인력을 정리하거나 요금제 상향을 요청하세요.
          </div>
        ) : null}

        <section className="ui-summary-strip mt-5 grid sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="전체 작업 인력" value={`${counts.all}명`} icon={Users} active={summaryFilter === "all"} onClick={() => setSummaryFilter("all")} />
          <Metric label="작업자" value={`${counts.workers}명`} icon={CheckCircle2} active={summaryFilter === "worker"} onClick={() => setSummaryFilter("worker")} />
          <Metric label="작업 매니저" value={`${counts.managers}명`} icon={ShieldCheck} active={summaryFilter === "manager"} onClick={() => setSummaryFilter("manager")} />
          <Metric label="가입·초대 대기" value={`${counts.joinRequests + counts.invites}건`} icon={Clock3} active={summaryFilter === "pending"} onClick={() => setSummaryFilter("pending")} />
        </section>

        {showPending ? <section className="mt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">가입 요청</h2>
                <Badge variant="secondary">{joinRequests.length}건</Badge>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                초대받은 작업자 또는 작업 매니저가 링크를 수락하면 표시됩니다. 조직 Owner 또는 Admin이 승인하면 현장 업무에 참여할 수 있습니다.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-4 space-y-3 py-4"><Skeleton className="h-16 w-full" /></div>
          ) : joinRequests.length ? (
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>요청자</TableHead>
                    <TableHead>요청 역할</TableHead>
                    <TableHead>요청일</TableHead>
                    <TableHead className="text-right">승인</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {joinRequests.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-full bg-sidebar text-xs font-semibold">{initials(member)}</span>
                          <div className="min-w-0">
                            <div className="truncate font-medium">{member.name}</div>
                            <div className="truncate text-xs text-muted-foreground">{member.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{roleLabel(member.role)}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(member.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {isAdmin ? (
                          <Button size="xs" onClick={() => setConfirmAction({ kind: "approve", member })}>
                            <ShieldCheck /> 가입 승인
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Owner/Admin 승인 필요</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="mt-4 flex min-h-24 items-center justify-center rounded-md border border-dashed bg-muted/15 text-sm text-muted-foreground">
              승인할 가입 요청이 없습니다.
            </div>
          )}
        </section> : null}

        {showJoinedMembers ? <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
            <div>
              <h2 className="text-base font-semibold">작업자 및 작업 매니저</h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">현장 실행 역할과 가입 상태를 관리합니다. 조직 권한은 별도 정보로 표시합니다.</p>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <div className="relative min-w-0 flex-1 sm:w-72">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="이름, 이메일, 역할 검색" />
              </div>
              <Button variant="outline" size="icon" onClick={() => void load()} aria-label="새로고침">
                <RefreshCw />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="mt-4 space-y-3 py-5"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
          ) : error ? (
            <div className="mt-4 flex min-h-40 flex-col items-center justify-center rounded-md border border-destructive/30 bg-destructive/5 text-center">
              <p className="text-sm font-medium">작업 인력을 불러오지 못했습니다.</p>
              <p className="mt-1 text-xs text-muted-foreground">{error}</p>
              <Button variant="outline" className="mt-4" onClick={() => void load()}><RefreshCw /> 다시 시도</Button>
            </div>
          ) : visibleMembers.length === 0 ? (
            <div className="mt-4 flex min-h-40 items-center justify-center rounded-md border border-dashed bg-muted/15 text-sm text-muted-foreground">조건에 맞는 작업 인력이 없습니다.</div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>작업 인력</TableHead><TableHead>현장 역할</TableHead><TableHead>상태</TableHead><TableHead>참여일</TableHead><TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleMembers.map((member) => {
                    const editable = isAdmin && !["owner", "admin"].includes(member.role) && member.id !== sessionUserId
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 items-center justify-center rounded-full bg-sidebar text-xs font-semibold">{initials(member)}</span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="truncate font-medium">{member.name}</span>
                                {organizationRoleLabel(member.role) ? <Badge variant="outline">{organizationRoleLabel(member.role)}</Badge> : null}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">{member.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {editable ? (
                            <Select value={ROLE_OPTIONS.includes(member.role as WorkRole) ? member.role : "worker"} onValueChange={(role) => void changeRole(member, role as WorkRole)} disabled={busy || member.status !== "active"}>
                              <SelectTrigger size="sm" className="w-28">{roleLabel(member.role)}</SelectTrigger>
                              <SelectContent>{ROLE_OPTIONS.map((role) => <SelectItem key={role} value={role}>{roleLabel(role)}</SelectItem>)}</SelectContent>
                            </Select>
                          ) : <Badge variant="secondary">{roleLabel(member.role)}</Badge>}
                        </TableCell>
                        <TableCell><Badge variant={member.status === "pending_approval" ? "outline" : "secondary"} className={cn(member.status === "active" && "text-success", member.status === "pending_approval" && "ui-status-warning")}>{statusLabel(member.status)}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(member.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          {editable && member.status === "active" ? <Button size="xs" variant="ghost" className="text-destructive" onClick={() => setConfirmAction({ kind: "deactivate", member })}>비활성화</Button> : null}
                          {editable && member.status === "inactive" ? <Button size="xs" variant="outline" onClick={() => setConfirmAction({ kind: "reactivate", member })}>복구</Button> : null}
                          {!editable ? <span className="text-xs text-muted-foreground">-</span> : null}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </section> : null}

        {showPending ? <section className="mt-8 pt-5">
          <div className="flex items-center justify-between"><div><h2 className="text-base font-semibold">보낸 초대</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">아직 사용자가 수락하지 않은 초대입니다. 수락 후에는 위 가입 요청으로 이동합니다.</p></div><Badge variant="secondary">{invites.length}건</Badge></div>
          <div className="mt-4 divide-y border-y">
            {invites.length ? invites.map((invite) => (
              <div key={invite.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3"><Mail className="size-4 text-muted-foreground" /><div className="min-w-0"><div className="truncate text-sm font-medium">{invite.email}</div><div className="text-xs text-muted-foreground">{roleLabel(invite.role)} · {formatDate(invite.createdAt)}</div></div></div>
                {isAdmin ? <Button size="sm" variant="outline" onClick={() => setConfirmAction({ kind: "revoke", invite })}>초대 회수</Button> : null}
              </div>
            )) : <div className="py-10 text-center text-sm text-muted-foreground">대기 중인 초대가 없습니다.</div>}
          </div>
        </section> : null}
      </div>

      <Dialog open={inviteOpen} onOpenChange={(open) => !busy && setInviteOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>작업 인력 초대</DialogTitle><DialogDescription>작업자 또는 작업 매니저 역할을 지정해 초대 링크를 보냅니다. 조직 권한과 고객 수신자는 각각 설정과 고객 메뉴에서 관리합니다.</DialogDescription></DialogHeader>
          <form onSubmit={inviteMember} className="space-y-4">
            <div><label className="mb-1.5 block text-sm font-medium">이메일</label><Input required type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="worker@company.com" /></div>
            <div><label className="mb-1.5 block text-sm font-medium">현장 역할</label><Select value={inviteRole} onValueChange={(role) => setInviteRole(role as PendingInvite["role"])}><SelectTrigger className="w-full">{roleLabel(inviteRole)}</SelectTrigger><SelectContent>{ROLE_OPTIONS.map((role) => <SelectItem key={role} value={role}>{roleLabel(role)}</SelectItem>)}</SelectContent></Select></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setInviteOpen(false)} disabled={busy}>취소</Button><Button type="submit" disabled={busy || !inviteEmail.trim() || seatsFull}>{busy ? "전송 중..." : "초대 보내기"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(confirmAction)} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{confirmCopy.title}</AlertDialogTitle><AlertDialogDescription>{confirmCopy.description}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={busy}>취소</AlertDialogCancel><AlertDialogAction onClick={() => void runConfirmedAction()} disabled={busy}>{confirmCopy.action}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

import { appLocation } from "@/app/app-location"
import { createContext, useContext, useState, type ReactNode } from "react"
import {
  Check,
  ChevronDown,
  Info,
  MoreHorizontal,
  Search,
  UserPlus,
  X,
} from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { Badge } from "@shared/components/ui/badge"
import { Input } from "@shared/components/ui/input"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@ecoya/design-system/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@shared/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu"
import type { ProductEntitlement, SettingsRole, SubscriptionDisplayStatus } from "./page"
import { SubscriptionChangePanel, type SubscriptionChangeIntent } from "./subscription-change-panel"

type Member = {
  id: string
  name: string
  email: string
  role: SettingsRole
  erp: boolean
  snap: boolean
}
type Request = {
  id: string
  memberId: string
  product: ProductEntitlement
  kind: "access" | "capacity"
  status: "pending" | "rejected" | "assigned"
  requester: SettingsRole
}
const names = { erp: "Trade OS", snap: "SNAP" }
const initialMembers: Member[] = [
  {
    id: "owner",
    name: "조민영",
    email: "minyoung@ecoya.app",
    role: "owner",
    erp: true,
    snap: true,
  },
  {
    id: "admin",
    name: "김도현",
    email: "dohyun@ecoya.app",
    role: "admin",
    erp: true,
    snap: false,
  },
  {
    id: "member",
    name: "박서윤",
    email: "seoyun@ecoya.app",
    role: "member",
    erp: true,
    snap: false,
  },
]
function useDemoState(subscriptionKind: "separate" | "bundle") {
  const [members, setMembers] = useState(initialMembers)
  const [requests, setRequests] = useState<Request[]>([
    {
      id: "request-member-snap",
      memberId: "member",
      product: "snap",
      kind: "access",
      status: "pending",
      requester: "member",
    },
  ])
  // Purchased capacity is a fixture. UI assignment must never change purchased capacity.
  const capacity = subscriptionKind === "bundle" ? { erp: 8, snap: 8 } : { erp: 8, snap: 5 }
  return { members, setMembers, requests, setRequests, capacity }
}
const SettingsDemoContext = createContext<ReturnType<
  typeof useDemoState
> | null>(null)
export function SettingsDemoProvider({ children, subscriptionKind = "separate" }: { children: ReactNode; subscriptionKind?: "separate" | "bundle" }) {
  const value = useDemoState(subscriptionKind)
  return (
    <SettingsDemoContext.Provider value={value}>
      {children}
    </SettingsDemoContext.Provider>
  )
}
function useSettingsDemo() {
  const value = useContext(SettingsDemoContext)
  if (!value) throw new Error("SettingsDemoProvider is required")
  return value
}
const selectClass =
  "h-9 w-full rounded-md border bg-background px-2 text-sm disabled:opacity-50"
export function SeatSummary({
  products,
  compact = false,
  onManage,
  manageLabel = "시트 관리",
}: {
  products: readonly ProductEntitlement[]
  compact?: boolean
  onManage?: () => void
  manageLabel?: string
}) {
  const { members, capacity } = useSettingsDemo()
  if (compact) {
    return (
      <section aria-label="구독 시트" className="grid xl:grid-cols-2 xl:border-b">
        {products.map((product, index) => {
          const assigned = members.filter((member) => member[product]).length
          const available = Math.max(0, capacity[product] - assigned)
          return (
            <div
              key={product}
              role="region"
              aria-label={`${names[product]} 좌석`}
              className={`flex flex-wrap items-center gap-x-3 gap-y-2 border-b py-3 xl:border-b-0 ${index > 0 ? "xl:border-l xl:pl-5" : "xl:pr-5"}`}
            >
              <strong className="min-w-18 text-sm font-medium">{names[product]}</strong>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm whitespace-nowrap">
                <span>구매 <b className="tabular-nums">{capacity[product]}</b></span>
                <span>배정 <b className="tabular-nums">{assigned}</b></span>
                <span>남음 <b className="tabular-nums">{available}</b></span>
              </div>
            </div>
          )
        })}
      </section>
    )
  }
  return (
    <section aria-label="구독 시트" className="rounded-xl border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="font-semibold">구독 시트</h2>
          <p className="mt-1 text-sm text-muted-foreground">구매 수량과 실제 배정 인원을 구분해 확인합니다.</p>
        </div>
        {onManage && <Button variant="outline" size="sm" onClick={onManage}>{manageLabel}</Button>}
      </div>
      <div className="px-5">
          <div className="hidden grid-cols-[minmax(8rem,1fr)_repeat(3,5rem)] gap-3 border-b py-3 text-xs text-muted-foreground sm:grid">
            <span>제품</span><span>구매</span><span>배정</span><span>남음</span>
          </div>
          {products.map((product) => {
            const assigned = members.filter((member) => member[product]).length
            const available = Math.max(0, capacity[product] - assigned)
            return (
              <div
                key={product}
                role="region"
                aria-label={`${names[product]} 좌석`}
                className="flex flex-wrap gap-x-4 gap-y-1 border-b py-3 text-sm last:border-b-0 sm:grid sm:grid-cols-[minmax(8rem,1fr)_repeat(3,5rem)] sm:gap-3"
              >
                <strong className="basis-full font-medium sm:basis-auto">{names[product]}</strong>
                <span className="tabular-nums"><span className="sm:hidden">구매 </span>{capacity[product]}</span>
                <span className="tabular-nums"><span className="sm:hidden">배정 </span>{assigned}</span>
                <span className="tabular-nums"><span className="sm:hidden">남음 </span>{available}</span>
              </div>
            )
          })}
      </div>
    </section>
  )
}

export function OrganizationMembers({
  role,
  products,
}: {
  role: SettingsRole
  products: readonly ProductEntitlement[]
}) {
  const { members, setMembers, capacity, requests, setRequests } =
    useSettingsDemo()
  const [confirmation, setConfirmation] = useState<{
    member: Member
    action: "remove" | "logout"
  } | null>(null)
  const [shortage, setShortage] = useState<{
    member: Member
    product: ProductEntitlement
  } | null>(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [requestOnly, setRequestOnly] = useState(false)
  const [reviewedMembers, setReviewedMembers] = useState<string[]>([])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")
  const [inviteSeatType, setInviteSeatType] = useState<"view" | "erp" | "snap" | "both">("view")
  const [inviteError, setInviteError] = useState("")
  if (role === "member")
    return <p role="status">사용자 관리 권한이 없습니다.</p>
  const canManageMember = (member: Member) =>
    member.id !== role && (role === "owner" || member.role === "member")
  const ownerCount = members.filter((member) => member.role === "owner").length
  const isLastOwner = (member: Member) => member.role === "owner" && ownerCount <= 1
  const canChangeRole = (member: Member) =>
    role === "owner" && canManageMember(member) && !isLastOwner(member)
  const canRemoveMember = (member: Member) =>
    canManageMember(member) && !isLastOwner(member)
  const canAssignSeat = (member: Member) =>
    member.id === role
      ? role === "owner" || role === "admin"
      : canManageMember(member)
  const pendingAccessRequests = requests.filter(
    (request) =>
      request.kind === "access" &&
      request.status === "pending" &&
      products.includes(request.product) &&
      members.some(
        (member) =>
          member.id === request.memberId &&
          (canManageMember(member) || member.id === role)
      )
  )
  const memberRequests = (memberId: string) =>
    pendingAccessRequests.filter((request) => request.memberId === memberId)
  const filteredMembers = members.filter((member) => {
    const matchesQuery = `${member.name} ${member.email}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
    return (
      matchesQuery &&
      (!requestOnly ||
        memberRequests(member.id).length > 0 ||
        reviewedMembers.includes(member.id))
    )
  })
  const requestedInviteProducts: ProductEntitlement[] =
    inviteSeatType === "both" ? ["erp", "snap"] : inviteSeatType === "view" ? [] : [inviteSeatType]
  const inviteSeatShortage = requestedInviteProducts.filter(
    (product) => members.filter((member) => member[product]).length >= capacity[product]
  )
  const assign = (
    member: Member,
    product: ProductEntitlement,
    enabled: boolean
  ) => {
    if (!canAssignSeat(member)) return
    if (member[product] === enabled) return
    if (
      enabled &&
      members.filter((item) => item[product]).length >= capacity[product]
    ) {
      setShortage({ member, product })
      return
    }
    setMembers((current) =>
      current.map((item) =>
        item.id === member.id ? { ...item, [product]: enabled } : item
      )
    )
    if (enabled)
      setRequests((current) =>
        current.map((request) =>
          request.memberId === member.id &&
          request.product === product &&
          request.kind === "access" &&
          request.status === "pending"
            ? { ...request, status: "assigned" }
            : request
        )
      )
    setMessage(
      enabled
        ? `${member.name} · ${names[product]} 시트를 배정했어요. 구매 수량·요금은 유지됩니다.`
        : `${member.name} · ${names[product]} 시트를 회수했어요. 구매 수량·요금은 유지됩니다.`
    )
  }
  const resolveRequest = (request: Request, decision: "approve" | "reject") => {
    const member = members.find((item) => item.id === request.memberId)
    if (!member || !canManageMember(member)) return
    if (decision === "approve") {
      if (
        members.filter((item) => item[request.product]).length >=
        capacity[request.product]
      ) {
        setShortage({ member, product: request.product })
        return
      }
      setMembers((current) =>
        current.map((item) =>
          item.id === member.id ? { ...item, [request.product]: true } : item
        )
      )
    }
    setRequests((current) =>
      current.map((item) =>
        item.id === request.id
          ? {
              ...item,
              status: decision === "approve" ? "assigned" : "rejected",
            }
          : item
      )
    )
    setReviewedMembers((current) => [...new Set([...current, member.id])])
    setMessage(
      decision === "approve"
        ? `${names[request.product]} 권한 요청을 승인했어요.`
        : `${names[request.product]} 권한 요청을 거절했어요.`
    )
  }
  return (
    <div className="space-y-6">
      <header className="border-b pb-6">
        <h1 className="text-2xl font-semibold">사용자 관리</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          조직 역할과 Trade OS·SNAP 제품별 Seat 배정을 한 목록에서 관리합니다.
          SNAP App User는 이 조직 멤버 목록에 포함하지 않습니다.
        </p>
      </header>
      <SeatSummary products={products} compact />
      <Alert variant="blue" role="status">
        <Info aria-hidden="true" />
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div>
            <AlertTitle>권한 요청 대기 {pendingAccessRequests.length}건</AlertTitle>
            <AlertDescription>
              멤버의 제품 접근 요청은 해당 멤버 행에서 승인하거나 거절합니다.
            </AlertDescription>
          </div>
          {pendingAccessRequests.length > 0 || requestOnly ? (
            <Button
              variant={requestOnly ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                setRequestOnly((value) => !value)
                setReviewedMembers([])
              }}
            >
              {requestOnly ? "전체 멤버 보기" : "요청 확인"}
            </Button>
          ) : null}
        </div>
      </Alert>
      {message && (
        <p role="status" className="text-sm text-primary">
          {message}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="이름 또는 이메일 검색"
            className="pl-9"
            value={query}
            placeholder="이름 또는 이메일 검색"
            onChange={(event) => {
              setQuery(event.target.value)
              setReviewedMembers([])
            }}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setInviteOpen((value) => !value)}
          data-guide-target="invite"
          aria-expanded={inviteOpen}
        >
          <UserPlus />
          멤버 초대
        </Button>
      </div>
      {inviteOpen && (
        <section className="rounded-xl border bg-background p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">멤버 초대</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Organization Membership 초대와 SNAP App User 초대는 서로 다른
                흐름입니다.
              </p>
            </div>
          </div>
          <form
            className="mt-4 grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault()
              if (!email.trim()) return
              setInviteError("서버에 연결되지 않아 초대를 보내지 못했습니다.")
            }}
          >
            <label className="grid gap-2 text-sm sm:col-span-2">
              이메일
              <Input
                type="email"
                required
                aria-label="초대 이메일"
                placeholder="member@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm">
              조직 역할
              <select
                className={selectClass}
                aria-label="초대 역할"
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value)}
              >
                {role === "owner" && <option value="admin">ADMIN</option>}
                <option value="member">MEMBER</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              시트 유형
              <select
                className={selectClass}
                value={inviteSeatType}
                onChange={(event) => {
                  setInviteSeatType(event.target.value as typeof inviteSeatType)
                  setInviteError("")
                }}
              >
                <option value="view">View · 무료</option>
                {products.includes("erp") && <option value="erp">Trade OS 시트</option>}
                {products.includes("snap") && <option value="snap">SNAP 시트</option>}
                {products.includes("erp") && products.includes("snap") && (
                  <option value="both">Trade OS + SNAP 시트</option>
                )}
              </select>
            </label>
            <div className="rounded-lg border bg-muted/20 p-3 text-sm sm:col-span-2" role="status">
              {inviteSeatType === "view" ? (
                <p>View는 무료입니다. 초대 수락 시 제품 유료 시트를 사용하거나 추가 요금을 청구하지 않습니다.</p>
              ) : inviteSeatShortage.length > 0 ? (
                <p>
                  {inviteSeatShortage.map((product) => names[product]).join("·")} 구매 시트가 부족합니다.
                  OWNER 승인과 서버 금액 확인이 필요합니다. 추가 금액은 초대 수락일을 기준으로 계산합니다.
                </p>
              ) : (
                <p>현재 구매된 시트 안에서 배정할 수 있습니다. 초대 수락 시 남은 시트를 다시 확인하며, 추가 구매가 필요하면 수락일 기준으로 금액을 계산합니다.</p>
              )}
            </div>
            <div className="flex justify-end sm:col-span-2">
              <Button type="submit">초대 이메일 발송</Button>
            </div>
          </form>
          {inviteError && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {inviteError}
            </p>
          )}
        </section>
      )}
      <div className="overflow-x-auto rounded-xl border bg-background">
        <table className="settings-member-table w-full text-left text-sm">
          <thead className="hidden lg:table-header-group">
            <tr className="border-b bg-muted/30">
              <th className="p-4">이름 / 이메일</th>
              <th className="p-4">조직 역할</th>
              {products.map((p) => (
                <th className="p-4" key={p}>
                  {names[p]}
                </th>
              ))}
              <th className="p-4">권한 요청</th>
              <th className="p-4">
                <span className="sr-only">관리</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td
                  className="p-8 text-center text-sm text-muted-foreground"
                  colSpan={products.length + 4}
                >
                  검색 결과가 없어요
                  {query ? (
                    <Button
                      className="ml-2"
                      size="xs"
                      variant="ghost"
                      onClick={() => setQuery("")}
                    >
                      검색어 지우기
                    </Button>
                  ) : null}
                </td>
              </tr>
            ) : null}
            {filteredMembers.map((member) => (
              <tr
                key={member.id}
                aria-label={member.name}
                className="grid grid-cols-2 border-b p-4 last:border-0 lg:table-row lg:p-0"
              >
                <td className="col-span-2 min-w-0 p-2 lg:p-4">
                  <span className="font-medium">{member.name}</span>
                  {member.id === role && (
                    <Badge variant="secondary" className="ml-2">
                      나
                    </Badge>
                  )}
                  <div className="mt-1 text-xs text-muted-foreground">
                    {member.email}
                  </div>
                </td>
                <td className="col-span-2 p-2 lg:p-4">
                  <span className="mb-1 block text-xs text-muted-foreground lg:hidden">
                    조직 역할
                  </span>
                  {canChangeRole(member) ? <select
                    aria-label={`${member.name} 역할`}
                    className={selectClass}
                    value={member.role}
                    onChange={(event) => {
                      if (!canChangeRole(member)) return
                      const next = event.target.value as SettingsRole
                      if (next === "owner") {
                        setMessage(
                          "OWNER 지정은 수락·재인증 확인 후 가능합니다."
                        )
                        return
                      }
                      setMembers((current) =>
                        current.map((item) =>
                          item.id === member.id ? { ...item, role: next } : item
                        )
                      )
                      setMessage(
                        `${member.name} 역할을 변경했어요. 시트 배정은 유지됩니다.`
                      )
                    }}
                  >
                    <option value="owner">OWNER</option>
                    <option value="admin">ADMIN</option>
                    <option value="member">MEMBER</option>
                  </select> : (
                    <div>
                      <span aria-label={`${member.name} 역할`} className="font-medium">{member.role.toUpperCase()}</span>
                      {isLastOwner(member) && <p className="mt-1 text-xs text-muted-foreground">마지막 오너 · 역할 변경 불가</p>}
                    </div>
                  )}
                </td>
                {products.map((product) => (
                  <td className="min-w-0 p-2 lg:p-4" key={product}>
                    <span className="mb-1 block text-xs text-muted-foreground lg:hidden">
                      {names[product]}
                    </span>
                    {member.id !== role &&
                    memberRequests(member.id).some(
                      (request) => request.product === product
                    ) ? (
                      <span className="text-sm text-muted-foreground">
                        {member[product] ? "Standard 시트" : "할당되지 않음"}
                      </span>
                    ) : !canAssignSeat(member) ? (
                      <span className="text-sm text-muted-foreground">
                        {member[product] ? "Standard 시트" : "할당되지 않음"}
                      </span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between px-2"
                            aria-label={`${member.name} ${names[product]}`}
                          >
                            {member[product]
                              ? "Standard 시트"
                              : "할당되지 않음"}
                            <ChevronDown className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {member[product] && (
                            <DropdownMenuLabel className="max-w-56 text-xs font-normal whitespace-normal text-muted-foreground">
                              유료 기능 사용만 해제돼요. 구매 좌석 수와 요금은
                              유지돼요
                            </DropdownMenuLabel>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              assign(member, product, !member[product])
                            }
                          >
                            {member[product]
                              ? "시트 회수"
                              : "Standard 시트 배정"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                ))}
                <td className="col-span-2 p-2 lg:p-4">
                  {memberRequests(member.id).map((request) => (
                    <div
                      className="flex flex-wrap items-center gap-2"
                      key={request.id}
                    >
                      <span className="text-xs text-muted-foreground">
                        {names[request.product]}
                      </span>
                      {canManageMember(member) ? (
                        <>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => resolveRequest(request, "reject")}
                          >
                            <X /> 거절
                          </Button>
                          <Button
                            size="xs"
                            onClick={() => resolveRequest(request, "approve")}
                          >
                            <Check /> 승인
                          </Button>
                        </>
                      ) : null}
                    </div>
                  ))}
                  {!memberRequests(member.id).length &&
                  requests.some(
                    (request) =>
                      request.memberId === member.id &&
                      request.kind === "access" &&
                      request.status !== "pending"
                  ) ? (
                    <span className="text-xs text-muted-foreground">
                      {requests
                        .filter(
                          (request) =>
                            request.memberId === member.id &&
                            request.kind === "access" &&
                            request.status !== "pending"
                        )
                        .map(
                          (request) =>
                            `${names[request.product]} · ${request.status === "assigned" ? "승인했어요" : "거절했어요"}`
                        )
                        .join(" · ")}
                    </span>
                  ) : !memberRequests(member.id).length ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : null}
                </td>
                <td className="col-span-2 p-2 text-right lg:p-4">
                  {canManageMember(member) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`${member.name} 더보기`}
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setError("")
                            setConfirmation({ member, action: "logout" })
                          }}
                        >
                          모든 곳에서 로그아웃
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={!canRemoveMember(member)}
                          onClick={() => {
                            if (!canRemoveMember(member)) return
                            setError("")
                            setConfirmation({ member, action: "remove" })
                          }}
                        >
                          조직에서 제거
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        전체 멤버 {members.length}명 · 검색 결과 {filteredMembers.length}명
      </p>
      <Dialog
        open={!!confirmation}
        onOpenChange={(open) => {
          if (!open) setConfirmation(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmation?.action === "remove"
                ? `${confirmation.member.name}님을 조직에서 제거하시겠습니까?`
                : "모든 곳에서 로그아웃"}
            </DialogTitle>
            <DialogDescription>
              {confirmation?.member.name} · {confirmation?.member.email}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm leading-relaxed">
            {confirmation?.action === "remove"
              ? "이 조직의 접근과 제품 배정을 종료합니다. 계정·다른 조직 소속·보존 데이터·구매 시트 수·요금은 유지됩니다. 업무 이관·회수가 필요한 경우 먼저 완료해야 합니다."
              : "이 사용자의 모든 기기에서 로그아웃합니다. 다른 조직의 로그인 세션도 종료됩니다. 조직 소속과 시트 할당은 유지되며 다시 로그인할 수 있습니다."}
          </p>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmation(null)}>
              취소
            </Button>
            <Button
              onClick={() => {
                // Real membership/session mutations require server capability and transfer checks.
                setError(
                  "서버에 연결되지 않아 처리하지 않았습니다. 실제 실행은 서버 권한·업무 상태 확인 후 가능합니다."
                )
              }}
            >
              {confirmation?.action === "remove" ? "제거" : "로그아웃 실행"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!shortage}
        onOpenChange={(open) => {
          if (!open) setShortage(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>시트 부족</DialogTitle>
            <DialogDescription>
              {shortage && names[shortage.product]} 권한을 부여하려면 좌석 1개가
              필요합니다.
            </DialogDescription>
            <p className="text-sm text-muted-foreground">
              Bundle이면 Trade OS·SNAP 좌석이 함께 1개 늘어납니다. 좌석 추가
              또는 요청을 확정하기 전에는 변경되지 않습니다.
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShortage(null)}>
              닫기
            </Button>
            <Button
              onClick={() => {
                if (!shortage) return
                if (role === "owner") {
                  appLocation.assign(
                    `/erp/settings?section=products&plan=1&product=${shortage.product}`
                  )
                  return
                }
                if (
                  !requests.some(
                    (item) =>
                      item.memberId === shortage.member.id &&
                      item.product === shortage.product &&
                      item.kind === "capacity" &&
                      item.status === "pending"
                  )
                )
                  setRequests((current) => [
                    ...current,
                    {
                      id: crypto.randomUUID(),
                      memberId: shortage.member.id,
                      product: shortage.product,
                      kind: "capacity",
                      requester: role,
                      status: "pending",
                    },
                  ])
                setMessage("OWNER에게 좌석 증설을 요청했어요.")
                setShortage(null)
              }}
            >
              {role === "owner" ? "좌석 추가" : "OWNER에게 요청"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function ProductsSubscriptions({
  role,
  products,
  subscriptionKind = "separate",
  subscriptionStates = {},
  planInitiallyOpen = false,
  organizationName,
}: {
  role: SettingsRole
  products: readonly ProductEntitlement[]
  subscriptionKind?: "separate" | "bundle"
  subscriptionStates?: Partial<Record<"erp" | "snap" | "bundle", SubscriptionDisplayStatus>>
  planInitiallyOpen?: boolean
  organizationName: string
}) {
  const { members, capacity, requests, setRequests } = useSettingsDemo()
  const isBundle = subscriptionKind === "bundle" && products.includes("erp") && products.includes("snap")
  const [changeIntent, setChangeIntent] = useState<SubscriptionChangeIntent | null>(() => {
    if (!planInitiallyOpen) return null
    const product = new URLSearchParams(appLocation.search).get("product")
    return { kind: "seats", initialPlan: isBundle ? "bundle" : product === "erp" || product === "snap" ? product : products[0] }
  })
  const [message, setMessage] = useState("")
  const [rejectId, setRejectId] = useState<string | null>(null)
  const visibleRequests = requests.filter((request) =>
    role === "owner"
      ? request.kind === "capacity"
      : role === "admin"
        ? request.kind === "capacity" && request.requester === "admin"
        : request.memberId === "member" && request.kind === "access"
  )
  const offers = [
    { id: "erp", title: "Trade OS", description: "문서·거래·정산 업무를 관리합니다." },
    { id: "snap", title: "SNAP", description: "현장 기록·증거·리포트를 관리합니다." },
    { id: "bundle", title: "Trade OS + SNAP", description: "두 제품을 하나의 Bundle로 이용합니다." },
  ] as const
  const subscriptions: { id: "erp" | "snap" | "bundle"; items: ProductEntitlement[] }[] = isBundle
    ? [{ id: "bundle", items: ["erp", "snap"] }]
    : products.map((product) => ({ id: product, items: [product] }))
  const statusOf = (id: "erp" | "snap" | "bundle") => subscriptionStates[id] ?? "paid_active"
  const statusLabels: Record<SubscriptionDisplayStatus, string> = {
    trial_not_started: "무료 체험 전", trial_active: "무료 체험 중", trial_expired: "체험 종료",
    paid_active: "구독 중", cancel_scheduled: "해지 예정", payment_pending: "결제 대기",
    payment_verifying: "결제 확인 중", read_only: "읽기 전용",
  }
  const paidPlans = subscriptions.filter(({ id }) => statusOf(id) === "paid_active").map(({ id }) => id)
  const manageableSubscription = paidPlans[0]
  const closeChange = () => {
    setChangeIntent(null)
    const url = new URL(appLocation.href)
    url.searchParams.delete("plan")
    window.history.replaceState(null, "", url)
  }
  const changePanel = changeIntent && role !== "member" && (changeIntent.kind === "plan" || paidPlans.length > 0) ? (
    <SubscriptionChangePanel
      key={`${changeIntent.kind}:${changeIntent.initialPlan ?? "choose"}`}
      intent={changeIntent.kind === "seats" && !paidPlans.includes(changeIntent.initialPlan as typeof paidPlans[number]) ? { kind: "seats", initialPlan: paidPlans[0] } : changeIntent}
      role={role}
      organizationName={organizationName}
      paidPlans={paidPlans}
      capacity={capacity}
      assigned={{ erp: members.filter((member) => member.erp).length, snap: members.filter((member) => member.snap).length }}
      onClose={closeChange}
    />
  ) : null
  const subscriptionExamples = {
    erp: { startedAt: "2026.09.01", renewsAt: "2026.11.01" },
    snap: { startedAt: "2026.09.15", renewsAt: "2026.10.15" },
    bundle: { startedAt: "2026.09.01", renewsAt: "2026.11.01" },
  } as const
  return (
    <div data-ui="products-subscriptions" className="w-full space-y-6">
      <div className="border-b pb-6">
        <h1 className="text-2xl font-semibold">제품 및 구독</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          구독할 상품을 살펴보고 현재 제품 상태와 구매 시트를 관리합니다.
        </p>
        <p className="mt-2 text-xs text-muted-foreground" role="note">
          구독 상태·날짜·좌석 수는 화면 예시입니다. 실제 조직의 상태와 결제 결과는 서버 확인 후 표시됩니다.
        </p>
      </div>
      {products.length > 0 && <section aria-label="내 플랜" className="rounded-xl border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h2 className="font-semibold">내 플랜</h2>
            <p className="mt-1 text-sm text-muted-foreground">제품별 이용 상태와 시트 현황을 확인합니다.</p>
          </div>
          {role !== "member" && <div className="ml-auto flex flex-wrap justify-end gap-2">
            {role === "owner" && (
              <Button variant="outline" size="sm" aria-haspopup="dialog" onClick={() => setChangeIntent({ kind: "plan" })}>구독 변경</Button>
            )}
            {manageableSubscription && (
              <Button variant="outline" size="sm" aria-expanded={changeIntent?.kind === "seats"} onClick={() => setChangeIntent({ kind: "seats", initialPlan: manageableSubscription })}>
                {role === "owner" ? "시트 관리" : "증설 요청"}
              </Button>
            )}
          </div>}
        </div>
        {changeIntent?.kind === "seats" && changePanel && <div className="border-b p-4 sm:p-5">{changePanel}</div>}
        <div className="divide-y px-5">
          {subscriptions.map((subscription) => {
            const status = statusOf(subscription.id)
            const action = status === "trial_not_started" ? "무료 체험 시작"
              : status === "trial_active" || status === "trial_expired" || status === "read_only" ? "구독하기"
              : status === "cancel_scheduled" ? "예약 취소"
              : status === "payment_pending" ? "다시 결제하기" : null
            return (
              <div key={subscription.id} className="py-4" role="region" aria-label={`${subscription.id === "bundle" ? "Trade OS + SNAP Bundle" : names[subscription.id]} 구독`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">{subscription.id === "bundle" ? "Trade OS + SNAP Bundle" : names[subscription.id]}</h3>
                  {role === "owner" && action && <Button variant="outline" size="sm" onClick={() => {
                    if (action === "구독하기") setChangeIntent({ kind: "plan", initialPlan: subscription.id })
                    else setMessage("서버 연결 후 현재 구독 상태를 확인하고 처리할 수 있습니다. 아직 변경되지 않았습니다.")
                  }}>{action}</Button>}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{subscription.id === "bundle" ? "번들 플랜" : "단독 플랜"}</span>
                  <span>{statusLabels[status]}</span>
                  {(status === "paid_active" || status === "cancel_scheduled") && <span>구독 시작 {subscriptionExamples[subscription.id].startedAt}</span>}
                  {status === "paid_active" && <span>다음 갱신 {subscriptionExamples[subscription.id].renewsAt}</span>}
                  {status === "cancel_scheduled" && <span>해지 예정 {subscriptionExamples[subscription.id].renewsAt}</span>}
                  {status === "trial_active" && <span>체험 종료 {subscriptionExamples[subscription.id].renewsAt}</span>}
                </div>
                <div className="mt-2 grid gap-2">
                  {subscription.items.map((product) => {
                    const assigned = members.filter((member) => member[product]).length
                    const available = Math.max(0, capacity[product] - assigned)
                    const mySeat = members.find((member) => member.id === role)?.[product]
                    return <div key={product} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-sm" role="region" aria-label={`${names[product]} 이용 상태`}>
                      <span className="text-muted-foreground">{subscription.id === "bundle" ? `${names[product]} · ` : ""}내 계정: 시트 {mySeat ? "배정됨" : "없음"}</span>
                      {role !== "member" && <span className="flex flex-wrap gap-x-4 tabular-nums"><span>구매 {capacity[product]}</span><span>배정 {assigned}</span><span>남음 {available}</span></span>}
                    </div>
                  })}
                </div>
              </div>
            )
          })}
        </div>
        {role === "member" && (
          <div className="border-t px-5 py-4">
            <Button variant="outline" onClick={() => {
              const product = products.find((p) => !members.find((m) => m.id === "member")?.[p])
              if (!product) {
                setMessage("현재 제품에 모두 시트가 배정되어 있습니다.")
                return
              }
              if (!requests.some((r) => r.kind === "access" && r.product === product && r.memberId === "member" && r.status === "pending"))
                setRequests((current) => [...current, { id: crypto.randomUUID(), memberId: "member", product, kind: "access", requester: role, status: "pending" }])
              setMessage("ADMIN에게 제품 접근을 요청했어요.")
            }} className="ml-auto flex">제품 접근 요청</Button>
          </div>
        )}
      </section>}
      {(products.length === 0 || products.length < 2) && <section aria-label="구독 상품" className="space-y-4">
        <div>
          <h2 className="font-semibold">{products.length === 0 ? "구독 상품" : "추가 가능한 상품"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">필요한 제품을 선택하세요. 금액과 적용일은 구독을 확정하기 전에 확인합니다.</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {offers.filter((offer) => offer.id === "bundle" || !products.includes(offer.id)).map((offer) => (
            <article key={offer.id} className="flex flex-col rounded-xl border bg-background p-5">
              <h3 className="font-medium">{offer.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{offer.description}</p>
              <p className="mt-3 text-xs text-muted-foreground">{statusLabels[subscriptionStates[offer.id] ?? "trial_not_started"]}</p>
              {role === "owner" ? (
                <Button className="mt-4 self-end" variant="outline" size="sm" aria-haspopup="dialog" onClick={() => setChangeIntent({ kind: "plan" })}>
                  {offer.id === "bundle" && subscriptions.some(({ id }) => statusOf(id) === "paid_active") ? "업그레이드" : "플랜 보기"}
                </Button>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground">구독 변경은 OWNER가 관리합니다.</p>
              )}
            </article>
          ))}
        </div>

      </section>}
      {changeIntent?.kind === "plan" && changePanel}
      {message && (
        <p role="status" className="text-sm text-primary">
          {message}
        </p>
      )}
      <section className="rounded-xl border bg-background p-5">
        <h2 className="font-semibold">
          {role === "owner"
            ? "Billing 요청"
            : role === "admin"
              ? "내 좌석 증설 요청"
              : "내 접근 요청"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {role === "owner"
            ? "좌석·요금 변경이 필요한 Billing 요청만 여기서 검토합니다. 일반 멤버 접근 요청은 사용자 관리의 해당 행에서 처리합니다."
            : role === "admin"
              ? "좌석이 부족해 OWNER에게 보낸 상업 요청과 결과를 확인합니다. 멤버 접근 요청은 사용자 관리에서 처리합니다."
              : "제품 카드에서 요청한 내 접근 상태를 확인합니다."}
        </p>
        {!visibleRequests.length && (
          <p className="mt-4 text-sm text-muted-foreground">
            대기 중인 요청이 없습니다.
          </p>
        )}
        {visibleRequests.map((request) => (
          <div
            key={request.id}
            className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
          >
            <p className="text-sm">
              {names[request.product]} ·{" "}
              {request.kind === "access" ? "제품 접근" : "좌석 증설"} ·{" "}
              {request.status === "pending"
                ? "대기 중"
                : request.status === "rejected"
                  ? "거절됨"
                  : "배정됨"}
            </p>
            {request.status === "pending" && (
              <div className="ml-auto flex gap-2">
                {role === "member" ? (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setRequests((current) =>
                        current.filter((r) => r.id !== request.id)
                      )
                    }
                  >
                    요청 취소
                  </Button>
                ) : (
                  (role === "owner" || request.kind === "access") && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setRejectId(request.id)}
                      >
                        거절
                      </Button>
                      <Button
                        onClick={() =>
                          setMessage(
                            "서버 연결 후 최신 권한·배정 수량과 요청 상태를 확인할 수 있습니다. 아직 승인하지 않았습니다."
                          )
                        }
                      >
                        요청 검토
                      </Button>
                    </>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </section>
      {role !== "member" && (
        <section className="rounded-xl border bg-background p-5">
          <h2 className="font-semibold">
            {role === "owner" ? "금융 상태·인보이스" : "인보이스"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {role === "admin"
              ? "현재 조직의 인보이스 목록·상세·내려받기만 읽기 전용으로 제공합니다."
              : "현재 조직의 금융 상태와 인보이스는 Paddle 연결을 확인한 후 표시합니다."}
          </p>
          {role === "owner" ? (
            <p className="mt-4 text-sm">금액·다음 결제일: 확인 필요</p>
          ) : null}
          <Button
            className="mt-4 ml-auto flex"
            variant="outline"
            onClick={() =>
              setMessage(
                "Paddle 연결을 확인할 수 없습니다. 인보이스를 불러오지 못했습니다."
              )
            }
          >
            다시 확인
          </Button>
        </section>
      )}
      <Dialog
        open={!!rejectId}
        onOpenChange={(open) => {
          if (!open) setRejectId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>요청을 거절하시겠습니까?</DialogTitle>
            <DialogDescription>
              거절 사유 입력 없이 처리합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>
              취소
            </Button>
            <Button
              onClick={() => {
                setRequests((current) =>
                  current.map((request) =>
                    request.id === rejectId
                      ? { ...request, status: "rejected" }
                      : request
                  )
                )
                setRejectId(null)
              }}
            >
              거절 확정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

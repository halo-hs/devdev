import { createContext, useContext, useState, type ReactNode } from "react"
import {
  Check,
  ChevronDown,
  MoreHorizontal,
  Search,
  UserPlus,
  X,
} from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { Badge } from "@shared/components/ui/badge"
import { Input } from "@shared/components/ui/input"
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
import type { ProductEntitlement, SettingsRole } from "./page"

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
function useDemoState() {
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
  const capacity = { erp: 8, snap: 5 }
  return { members, setMembers, requests, setRequests, capacity }
}
const SettingsDemoContext = createContext<ReturnType<
  typeof useDemoState
> | null>(null)
export function SettingsDemoProvider({ children }: { children: ReactNode }) {
  const value = useDemoState()
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
  onAdd,
}: {
  products: readonly ProductEntitlement[]
  onAdd?: (product: ProductEntitlement) => void
}) {
  const { members, capacity } = useSettingsDemo()
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {products.map((product) => {
        const assigned = members.filter((member) => member[product]).length
        const available = Math.max(0, capacity[product] - assigned)
        return (
          <section
            key={product}
            className="rounded-xl border bg-background p-5"
            aria-label={`${names[product]} 좌석`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-medium">{names[product]}</h3>
              <Badge variant="outline">Standard 시트</Badge>
            </div>
            {onAdd && (
              <Button
                className="mt-4"
                variant="outline"
                size="sm"
                onClick={() => onAdd(product)}
              >
                {names[product]} 좌석 추가
              </Button>
            )}
            <div className="mt-4 grid grid-cols-3 divide-x rounded-lg border bg-muted/20">
              {[
                ["전체", capacity[product]],
                ["배정됨", assigned],
                ["배정 가능", available],
              ].map(([label, value]) => (
                <div className="px-3 py-2.5" key={label}>
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="mt-1 text-lg font-semibold tabular-nums">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
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
  const [inviteError, setInviteError] = useState("")
  if (role === "member")
    return <p role="status">사용자 관리 권한이 없습니다.</p>
  const canManageMember = (member: Member) =>
    member.id !== role && (role === "owner" || member.role === "member")
  const canChangeRole = (member: Member) =>
    role === "owner" && canManageMember(member)
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
  const assign = (
    member: Member,
    product: ProductEntitlement,
    enabled: boolean
  ) => {
    if (!canAssignSeat(member)) return
    if (!enabled && member.id === role) return
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
      <SeatSummary
        products={products}
        onAdd={
          role === "owner"
            ? (product) => {
                window.location.assign(
                  `/erp/settings?section=products&plan=1&product=${product}`
                )
              }
            : undefined
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background p-4">
        <div>
          <p className="font-medium">
            권한 요청 대기 {pendingAccessRequests.length}건
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            멤버의 제품 접근 요청은 해당 멤버 행에서 승인하거나 거절합니다.
          </p>
        </div>
        {pendingAccessRequests.length > 0 || requestOnly ? (
          <Button
            variant={requestOnly ? "secondary" : "outline"}
            onClick={() => {
              setRequestOnly((value) => !value)
              setReviewedMembers([])
            }}
          >
            {requestOnly ? "전체 멤버 보기" : "요청 확인"}
          </Button>
        ) : null}
      </div>
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
            className="mt-4 flex flex-wrap gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              if (!email.trim()) return
              setInviteError("서버에 연결되지 않아 초대를 보내지 못했습니다.")
            }}
          >
            <Input
              className="min-w-48 flex-1"
              type="email"
              required
              aria-label="초대 이메일"
              placeholder="member@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <select
              className={`${selectClass} max-w-36`}
              aria-label="초대 역할"
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value)}
            >
              {role === "owner" && <option value="admin">ADMIN</option>}
              <option value="member">MEMBER</option>
            </select>
            <Button type="submit">초대 이메일 발송</Button>
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
                  <select
                    aria-label={`${member.name} 역할`}
                    className={selectClass}
                    value={member.role}
                    disabled={!canChangeRole(member)}
                    onChange={(event) => {
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
                  </select>
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
                    ) : !canAssignSeat(member) ||
                      (member.id === role && member[product]) ? (
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
                          onClick={() => {
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
                  window.location.assign(
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
  planInitiallyOpen = false,
}: {
  role: SettingsRole
  products: readonly ProductEntitlement[]
  planInitiallyOpen?: boolean
}) {
  const { members, capacity, requests, setRequests } = useSettingsDemo()
  const [planOpen, setPlanOpen] = useState(planInitiallyOpen)
  const [plan, setPlan] = useState(() => {
    const product = new URLSearchParams(window.location.search).get("product")
    return product === "erp" || product === "snap" ? product : "bundle"
  })
  const [quantity, setQuantity] = useState(
    String(Math.max(5, ...products.map((p) => capacity[p])))
  )
  const [message, setMessage] = useState("")
  const [rejectId, setRejectId] = useState<string | null>(null)
  const selectedProducts: ProductEntitlement[] =
    plan === "bundle" ? ["erp", "snap"] : [plan as ProductEntitlement]
  const assigned = Math.max(
    0,
    ...selectedProducts.map((p) => members.filter((member) => member[p]).length)
  )
  const count = Number(quantity)
  const invalid = !Number.isSafeInteger(count) || count < 5 || count < assigned
  const visibleRequests = requests.filter((request) =>
    role === "owner"
      ? request.kind === "capacity"
      : role === "admin"
        ? request.kind === "capacity" && request.requester === "admin"
        : request.memberId === "member" && request.kind === "access"
  )
  if (planOpen && role !== "member")
    return (
      <div className="space-y-6">
        <header className="border-b pb-6">
          <h1 className="text-2xl font-semibold">제품 및 구독</h1>
        </header>
        <section className="rounded-xl border bg-background p-5 sm:p-6">
          <div className="grid max-w-2xl gap-5">
            <header className="space-y-2">
              <h2 className="text-xl font-semibold">
                {role === "owner" ? "요금제 변경" : "좌석 증설 요청"}
              </h2>
              <p className="text-sm text-muted-foreground">
                수량 선택만으로 구매·배정이 변경되지 않습니다.
              </p>
            </header>
            <label className="grid gap-2 text-sm">
              상품
              <select
                className={selectClass}
                value={plan}
                onChange={(event) => {
                  setPlan(event.target.value)
                  setMessage("")
                }}
              >
                <option value="erp">Trade OS 단독</option>
                <option value="snap">SNAP 단독</option>
                <option value="bundle">Trade OS + SNAP Bundle</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              구매 시트 수
              <Input
                type="number"
                min={Math.max(5, assigned)}
                step={1}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </label>
            {plan === "bundle" && (
              <p className="text-sm">
                두 단독 구독 중 큰 구매 수량을 기본값으로 제안합니다. Trade
                OS·SNAP은 각각 {quantity || "—"}명이며 사용자 배정은 제품별로
                독립적입니다.
              </p>
            )}
            {invalid && (
              <p role="alert" className="text-sm text-destructive">
                최소 5명이며 각 제품의 배정 인원({assigned}명) 이상인 정수를
                입력하세요. 감소 전 사용자 배정을 조정해 주세요.
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Paddle 예상 금액·일할 금액·적용일·다음 인보이스는 서버 연결 후
              확인합니다. 기존 유료 구독 증설은 구독 변경 확인 후 시트에
              반영되며, 증설분은 다음 인보이스에 청구됩니다. 사용자 배정은
              별도로 완료해야 합니다.
            </p>
            {message && (
              <p role="status" className="text-sm">
                {message}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2 border-t pt-5">
              <Button
                variant="outline"
                onClick={() => {
                  setPlanOpen(false)
                  setMessage("")
                  const url = new URL(window.location.href)
                  url.searchParams.delete("plan")
                  window.history.replaceState(null, "", url)
                }}
              >
                닫기
              </Button>
              <Button
                disabled={invalid}
                onClick={() =>
                  setMessage(
                    "서버에 연결되지 않아 예상 금액을 확인할 수 없습니다. 구매·요청은 변경되지 않았습니다."
                  )
                }
              >
                {role === "owner" ? "예상 금액 확인" : "OWNER에게 요청"}
              </Button>
            </div>
          </div>
        </section>
        <Button
          variant="outline"
          onClick={() =>
            window.location.assign("/erp/settings?section=members")
          }
        >
          사용자 관리로 돌아가기
        </Button>
      </div>
    )
  return (
    <div className="space-y-6">
      <div className="border-b pb-6">
        <h1 className="text-2xl font-semibold">제품 및 구독</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          제품 상태와 구매 시트·사용자 배정을 구분해 확인합니다.
        </p>
        <p className="mt-2 text-xs text-muted-foreground" role="note">
          표시된 구독·좌석 수는 화면 예시입니다. 실제 조직의 상태와 결제 결과는 서버 확인 후 표시됩니다.
        </p>
      </div>
      {role !== "member" && <SeatSummary products={products} />}
      <section className="rounded-xl border bg-background p-5">
        <h2 className="font-semibold">제품 상태</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {products.map((product) => (
            <div key={product} className="rounded-lg border p-4">
              <h3 className="font-medium">{names[product]}</h3>
              <p className="mt-2 text-sm">구독 중</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {members.find((member) => member.id === role)?.[product]
                  ? "Standard 시트"
                  : "할당되지 않음"}
              </p>
              {role !== "member" &&
                !members.find((member) => member.id === role)?.[product] && (
                  <Button
                    className="mt-3"
                    variant="outline"
                    onClick={() =>
                      window.location.assign("/erp/settings?section=members")
                    }
                  >
                    시트 배정
                  </Button>
                )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          {role === "owner" && (
            <Button onClick={() => setPlanOpen(true)}>요금제 변경</Button>
          )}
          {role === "admin" && (
            <Button variant="outline" onClick={() => setPlanOpen(true)}>
              증설 요청
            </Button>
          )}
          {role === "member" && (
            <Button
              variant="outline"
              onClick={() => {
                const product = products.find(
                  (p) => !members.find((m) => m.id === "member")?.[p]
                )
                if (!product) {
                  setMessage("현재 제품에 모두 시트가 배정되어 있습니다.")
                  return
                }
                if (
                  !requests.some(
                    (r) =>
                      r.kind === "access" &&
                      r.product === product &&
                      r.memberId === "member" &&
                      r.status === "pending"
                  )
                )
                  setRequests((current) => [
                    ...current,
                    {
                      id: crypto.randomUUID(),
                      memberId: "member",
                      product,
                      kind: "access",
                      requester: role,
                      status: "pending",
                    },
                  ])
                setMessage("ADMIN에게 제품 접근을 요청했어요.")
              }}
            >
              제품 접근 요청
            </Button>
          )}
        </div>
      </section>
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
              <div className="flex gap-2">
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
            className="mt-4"
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

import { type SettingsRole, type ProductEntitlement } from "@share/settings/SettingsRoutePage"
import { useState } from "react"
import { Alert, AlertTitle, AlertDescription } from "@shared/components/ui/alert"
import { Info, Search, UserPlus, ChevronDown, X, Check, MoreHorizontal } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { Input } from "@shared/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@shared/components/ui/select"
import { PendingInvitations } from "@share/settings/MemberInviteSettings"
import { Badge } from "@shared/components/ui/badge"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem } from "@shared/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@shared/components/ui/dialog"
import { appLocation } from "@/app/appLocation"
import { type Member, type Request, SeatSummary } from "@share/settings/SubscriptionSettings"
import { useSettingsDemo, names } from "@share/settings/useSettingsDemo"

export function OrganizationMembers({
  role,
  products,
}: {
  role: SettingsRole
  products: readonly ProductEntitlement[]
}) {
  const { members, setMembers, capacity, requests, setRequests, invitations, setInvitations } =
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
        <div className="relative min-w-0 basis-full sm:max-w-sm sm:flex-1 sm:basis-auto">
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
        <span className="text-xs text-muted-foreground">
          전체 멤버 {members.length}명 · 검색 결과 {filteredMembers.length}명
        </span>
        <Button
          variant="outline"
          className="ml-auto"
          onClick={() => setInviteOpen((value) => !value)}
          data-guide-target="invite"
          aria-expanded={inviteOpen}
        >
          <UserPlus />
          멤버 초대
        </Button>
      </div>
      {inviteOpen && (
        <section aria-label="멤버 초대" className="rounded-xl border bg-background p-5">
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
              <Select
                value={inviteRole}
                onValueChange={(value) => setInviteRole(value)}
              >
                <SelectTrigger className="w-full" aria-label="초대 역할">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                {role === "owner" && <SelectItem value="admin">ADMIN</SelectItem>}
                <SelectItem value="member">MEMBER</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-2 text-sm">
              시트 유형
              <Select
                value={inviteSeatType}
                onValueChange={(value) => {
                  setInviteSeatType(value as typeof inviteSeatType)
                  setInviteError("")
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="view">View · 무료</SelectItem>
                {products.includes("erp") && <SelectItem value="erp">Trade OS 시트</SelectItem>}
                {products.includes("snap") && <SelectItem value="snap">SNAP 시트</SelectItem>}
                {products.includes("erp") && products.includes("snap") && (
                  <SelectItem value="both">Trade OS + SNAP 시트</SelectItem>
                )}
                </SelectContent>
              </Select>
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
          <PendingInvitations items={invitations} onChange={setInvitations} />
        </section>
      )}
      {/* Same list card as the other screens: 16px card inset, gray header row. */}
      <div className="overflow-x-auto rounded-[var(--r-lg)] bg-[var(--color-gray-12)] p-4 shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)]">
        <table className="settings-member-table w-full text-left text-sm">
          <thead className="hidden lg:table-header-group">
            <tr className="border-b bg-[var(--color-gray-11)] text-[var(--color-gray-4)]">
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
                  {canChangeRole(member) ? <Select
                    value={member.role}
                    onValueChange={(value) => {
                      if (!canChangeRole(member)) return
                      const next = value as SettingsRole
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
                    <SelectTrigger className="w-full" aria-label={`${member.name} 역할`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="owner">OWNER</SelectItem>
                    <SelectItem value="admin">ADMIN</SelectItem>
                    <SelectItem value="member">MEMBER</SelectItem>
                    </SelectContent>
                  </Select> : (
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
                            // Looks like the role Select beside it: same control
                            // border, input shadow and Gray 2 chevron.
                            className="h-10 w-full justify-between border-[var(--control-border)] bg-[var(--control-background)] px-4 font-normal text-[var(--control-foreground)] shadow-[var(--shadow-input)] hover:border-[var(--control-border-hover)] hover:bg-[var(--control-background)] [&>svg]:text-[var(--color-gray-2)]"
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
                          className="[--button-ghost-foreground:var(--color-gray-4)]"
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

import { type SettingsRole, type ProductEntitlement, type SubscriptionDisplayStatus } from "@share/settings/SettingsRoutePage"
import { type SubscriptionChangeIntent, SubscriptionChangePanel } from "@share/settings/subscription-change-panel"
import { type TrialProduct, type TrialStartState, type TrialPeriod } from "@auth/components/trial-start-card"
import { useState } from "react"
import { appLocation } from "@/app/app-location"
import { Button } from "@shared/components/ui/button"
import { TrialStartDemo } from "@auth/components/trial-start-demo"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@shared/components/ui/dialog"
import { useSettingsDemo, names } from "@share/settings/subscription-settings"

export function ProductsSubscriptions({
  role,
  products,
  subscriptionKind = "separate",
  subscriptionStates = {},
  planInitiallyOpen = false,
  initialChangeIntent,
  organizationName,
  trialStates = {},
  trialDays = {},
  trialPeriods = {},
}: {
  role: SettingsRole
  products: readonly ProductEntitlement[]
  subscriptionKind?: "separate" | "bundle"
  subscriptionStates?: Partial<Record<"erp" | "snap" | "bundle", SubscriptionDisplayStatus>>
  planInitiallyOpen?: boolean
  initialChangeIntent?: SubscriptionChangeIntent
  organizationName: string
  trialStates?: Partial<Record<TrialProduct, TrialStartState>>
  trialDays?: Partial<Record<TrialProduct, number>>
  trialPeriods?: Partial<Record<TrialProduct, TrialPeriod>>
}) {
  const { members, capacity, requests, setRequests } = useSettingsDemo()
  const isBundle = subscriptionKind === "bundle" && products.includes("erp") && products.includes("snap")
  const [changeIntent, setChangeIntent] = useState<SubscriptionChangeIntent | null>(() => {
    if (initialChangeIntent && role === "owner") return initialChangeIntent
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
            if (status === "trial_not_started" || status === "trial_expired") return (
              <div key={subscription.id} className="space-y-4 py-4">
                {subscription.items.map((product) => <TrialStartDemo
                  key={`${product}:${role}:${status}:${trialStates[product] ?? "ready"}`}
                  product={product} role={role} layout="row"
                  initialState={status === "trial_expired" ? "used" : trialStates[product]} trialDays={trialDays[product]} trialPeriod={trialPeriods[product]}
                  onSubscribe={(selectedProduct) => setChangeIntent({ kind: "plan", initialPlan: selectedProduct })}
                />)}
              </div>
            )
            const action = status === "trial_active" || status === "read_only" ? "구독하기"
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
                  {status === "trial_active" && <span>체험 기간 {"{서버 값}일"} · {"{시작일} – {종료일}"}</span>}
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
        {role === "member" && subscriptions.some(({ id }) => statusOf(id) !== "trial_not_started") && (
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
            offer.id !== "bundle" && (subscriptionStates[offer.id] ?? "trial_not_started") === "trial_not_started" ? (
              <div key={`${offer.id}:${role}:${trialStates[offer.id] ?? "ready"}`} className="rounded-xl border bg-background p-5 lg:col-span-3">
                <TrialStartDemo product={offer.id} role={role} layout="row" initialState={trialStates[offer.id]} trialDays={trialDays[offer.id]} trialPeriod={trialPeriods[offer.id]} onSubscribe={(product) => setChangeIntent({ kind: "plan", initialPlan: product })} />
              </div>
            ) : (
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
            )
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

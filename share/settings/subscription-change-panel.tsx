import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Check } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { Input } from "@shared/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@shared/components/ui/dialog"
import type { ProductEntitlement, SettingsRole } from "./page"

export type SubscriptionPlan = "erp" | "snap" | "bundle" | "separate"
export type SubscriptionChangeIntent = {
  kind: "plan" | "seats"
  initialPlan?: SubscriptionPlan
}
const names = {
  erp: "Trade OS",
  snap: "SNAP",
  bundle: "Trade OS + SNAP Bundle",
  separate: "Trade OS · SNAP 각각 구독",
}
const plans = [
  {
    id: "erp",
    description: "문서부터 거래·정산까지",
    features: [
      "문서 만들기·검토",
      "거래·선적·정산 관리",
      "멤버 협업·활동 이력",
    ],
  },
  {
    id: "snap",
    description: "현장 기록부터 검토·공유까지",
    features: [
      "현장 작업·증거 관리",
      "기록 검토·리포트 발행",
      "고객 공유 링크",
    ],
  },
  {
    id: "bundle",
    description: "두 제품을 하나의 구독으로",
    features: [
      "Trade OS와 SNAP 모두 포함",
      "두 제품의 구매 시트 수 동일",
      "사용자 배정은 제품별로 관리",
    ],
  },
] as const

// Prototype only: money and confirmation stay unavailable until the Common billing API is connected.
export function SubscriptionChangePanel({
  intent,
  role,
  organizationName,
  paidPlans,
  capacity,
  assigned,
  onClose,
}: {
  intent: SubscriptionChangeIntent
  role: SettingsRole
  organizationName: string
  paidPlans: readonly Exclude<SubscriptionPlan, "separate">[]
  capacity: Record<ProductEntitlement, number>
  assigned: Record<ProductEntitlement, number>
  onClose: () => void
}) {
  const [step, setStep] = useState<"choose" | "review">(
    intent.kind === "plan" && !intent.initialPlan ? "choose" : "review"
  )
  const dialogRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.scrollTop = 0
    dialog
      .querySelector<HTMLElement>("[data-slot=dialog-title]")
      ?.focus({ preventScroll: true })
  }, [step])
  const [plan, setPlan] = useState<SubscriptionPlan>(
    intent.initialPlan ?? paidPlans[0] ?? "erp"
  )
  const currentBundle = paidPlans.includes("bundle")
  const currentCapacity = (product: ProductEntitlement) =>
    currentBundle || paidPlans.includes(product) ? capacity[product] : 0
  const initialQuantity = (next: SubscriptionPlan) =>
    String(
      next === "bundle"
        ? Math.max(5, currentCapacity("erp"), currentCapacity("snap"))
        : next === "separate"
          ? Math.max(5, currentCapacity("erp"))
          : Math.max(5, currentCapacity(next))
    )
  const [quantity, setQuantity] = useState(() => initialQuantity(plan))
  const [snapQuantity, setSnapQuantity] = useState(() =>
    String(Math.max(5, currentCapacity("snap")))
  )
  const [requestError, setRequestError] = useState("")
  const chosenProducts: ProductEntitlement[] =
    plan === "bundle" || plan === "separate" ? ["erp", "snap"] : [plan]
  const nextQuantity = (product: ProductEntitlement) =>
    Number(plan === "separate" && product === "snap" ? snapQuantity : quantity)
  const invalid = chosenProducts.some(
    (product) =>
      !Number.isSafeInteger(nextQuantity(product)) ||
      nextQuantity(product) < Math.max(5, assigned[product])
  )
  const samePlan = plan !== "separate" && paidPlans.includes(plan)
  const unchanged =
    samePlan &&
    chosenProducts.every(
      (product) => nextQuantity(product) === currentCapacity(product)
    )
  const isNewSubscription =
    !currentBundle &&
    !samePlan &&
    (plan === "erp" || plan === "snap" || paidPlans.length === 0)
  const decreases = chosenProducts.some(
    (product) => nextQuantity(product) < currentCapacity(product)
  )
  const nextRenewal =
    !isNewSubscription &&
    ((currentBundle && plan !== "bundle") || (samePlan && decreases))
  const changeTitle =
    intent.kind === "seats"
      ? role === "admin"
        ? "시트 증설 요청"
        : "시트 관리"
      : "시트 및 변경 내용 확인"
  const selectPlan = (next: SubscriptionPlan) => {
    setPlan(next)
    setQuantity(initialQuantity(next))
    setSnapQuantity(String(Math.max(5, currentCapacity("snap"))))
    setRequestError("")
    setStep("review")
  }
  const review = (
    <div className="space-y-5" data-ui="subscription-change-review">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 space-y-5" aria-label="시트 구성">
          {intent.kind === "seats" && paidPlans.length > 1 ? (
            <label className="grid gap-2 text-sm font-medium">
              구독 중인 상품
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={plan}
                onChange={(event) =>
                  selectPlan(event.target.value as SubscriptionPlan)
                }
              >
                {paidPlans.map((id) => (
                  <option key={id} value={id}>
                    {names[id]}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div>
              <h3 className="font-semibold">{names[plan]}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                월간 구독 · 기본 5석
              </p>
            </div>
          )}
          <div className="divide-y rounded-lg border px-4">
            {chosenProducts.map((product) => (
              <div
                key={product}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <span className="font-medium">{names[product]}</span>
                <span className="flex flex-wrap gap-3 text-muted-foreground tabular-nums">
                  <span>구매 {currentCapacity(product)}</span>
                  <span>배정 {assigned[product]}</span>
                  <span>
                    남음{" "}
                    {Math.max(0, currentCapacity(product) - assigned[product])}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <div
            className={
              plan === "separate" ? "grid gap-4 sm:grid-cols-2" : "grid gap-4"
            }
          >
            <label className="grid gap-2 text-sm font-medium">
              {plan === "separate" ? "Trade OS 구매 시트 수" : "구매 시트 수"}
              <Input
                type="number"
                min={Math.max(
                  5,
                  ...chosenProducts
                    .filter((p) => plan !== "separate" || p === "erp")
                    .map((p) => assigned[p]),
                  ...(role === "admin"
                    ? [currentCapacity(plan === "snap" ? "snap" : "erp") + 1]
                    : [])
                )}
                step={1}
                value={quantity}
                onChange={(event) => {
                  setQuantity(event.target.value)
                  setRequestError("")
                }}
              />
            </label>
            {plan === "separate" && (
              <label className="grid gap-2 text-sm font-medium">
                SNAP 구매 시트 수
                <Input
                  type="number"
                  min={Math.max(5, assigned.snap)}
                  step={1}
                  value={snapQuantity}
                  onChange={(event) => setSnapQuantity(event.target.value)}
                />
              </label>
            )}
          </div>
          {plan === "bundle" && (
            <p className="text-sm text-muted-foreground">
              Trade OS와 SNAP에 각각 {invalid ? "—" : quantity}석이 제공됩니다.
              사용자 배정은 제품별로 유지합니다.
            </p>
          )}
          {plan === "bundle" && !currentBundle && (
            <p className="text-xs text-muted-foreground">
              현재 제품별 구매 수량 중 큰 값을 기본으로 제안합니다.
            </p>
          )}
          {plan === "separate" && (
            <p className="text-sm text-muted-foreground">
              다음 갱신부터 두 제품을 별도 구독으로 관리합니다.
            </p>
          )}
          {currentBundle && (plan === "erp" || plan === "snap") && (
            <p className="text-sm text-muted-foreground">
              다음 갱신부터 {names[plan === "erp" ? "snap" : "erp"]} 유료 이용이
              종료됩니다. 현재 이용기간에는 Bundle을 유지합니다.
            </p>
          )}
          {isNewSubscription && paidPlans.length > 0 && (
            <p className="text-sm text-muted-foreground">
              기존 {paidPlans.map((id) => names[id]).join(" · ")} 구독은
              유지하고 새 구독을 추가합니다.
            </p>
          )}
          {invalid && (
            <p role="alert" className="text-sm text-destructive">
              최소 5석이며 제품별 배정 인원 이상인 정수를 입력하세요. 감소 전
              사용자 배정을 조정해 주세요.
            </p>
          )}
          {!invalid && unchanged && (
            <p className="text-sm text-muted-foreground">
              현재 구매 수와 같습니다. 변경할 시트 수를 입력해 주세요.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            View는 무료입니다. 사용자별 시트 배정은 사용자 관리에서 변경합니다.
          </p>
        </section>
        <aside
          className="min-w-0 rounded-lg bg-muted/40 p-5"
          aria-label="변경 내용"
        >
          <h3 className="font-semibold">
            {isNewSubscription ? "구독 요약" : "변경 요약"}
          </h3>
          <p className="mt-2 text-sm">{names[plan]}</p>
          <div className="mt-3 space-y-1 text-sm tabular-nums">
            {chosenProducts.map((product) => (
              <p key={product}>
                {names[product]} {currentCapacity(product)}석
                <span className="mx-1 text-muted-foreground">→</span>
                {invalid ? "—" : `${nextQuantity(product)}석`}
              </p>
            ))}
          </div>
          <dl className="mt-4 space-y-3 border-t pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">변경 전 월 요금</dt>
              <dd>확인 필요</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">
                {isNewSubscription ? "월 요금" : "변경 후 월 요금"}
              </dt>
              <dd>확인 필요</dd>
            </div>
            {!isNewSubscription && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">이번 기간 차액</dt>
                <dd>확인 필요</dd>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">적용 시점</dt>
              <dd className="text-right">
                {isNewSubscription
                  ? "결제 확인 후"
                  : nextRenewal
                    ? "다음 갱신부터"
                    : "변경 확인 후"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">다음 청구일</dt>
              <dd>확인 필요</dd>
            </div>
            <div className="flex justify-between gap-3 border-t pt-3 font-semibold">
              <dt>
                {isNewSubscription ? "결제 예정 금액" : "다음 청구 예정 금액"}
              </dt>
              <dd>확인 필요</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            {isNewSubscription
              ? "금액을 확인한 뒤 Paddle Checkout에서 새 구독을 시작합니다."
              : nextRenewal
                ? "현재 이용기간의 구성과 요금을 유지하고, 다음 갱신부터 변경합니다."
                : "남은 기간의 변경 차액은 다음 인보이스에 청구됩니다. 지금 별도 결제창을 열지 않습니다."}
          </p>
        </aside>
      </div>
      <p
        role="note"
        className="rounded-lg border px-4 py-3 text-sm text-muted-foreground"
      >
        예상 금액을 불러올 수 없어 변경을 확정할 수 없습니다. 구독과 구매 시트는
        그대로 유지됩니다.
      </p>
      {requestError && (
        <p role="alert" className="text-sm text-destructive">
          {requestError}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
        {intent.kind === "plan" && (
          <Button
            variant="ghost"
            className="mr-auto"
            onClick={() => setStep("choose")}
          >
            <ArrowLeft className="size-4" />
            상품 다시 선택
          </Button>
        )}
        <Button variant="outline" onClick={onClose}>
          닫기
        </Button>
        <Button
          disabled={role !== "admin" || invalid || unchanged || decreases}
          onClick={() =>
            setRequestError(
              "요청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요."
            )
          }
        >
          {role === "admin"
            ? "OWNER에게 요청"
            : isNewSubscription
              ? "결제 계속하기"
              : "변경 확정"}
        </Button>
      </div>
    </div>
  )
  if (role === "member") return null
  if (intent.kind === "seats")
    return (
      <section className="space-y-5" aria-label={changeTitle}>
        <div>
          <h3 className="font-semibold">{changeTitle}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            구독 중인 상품의 구매 시트 수를 조정합니다.
          </p>
        </div>
        {review}
      </section>
    )
  if (role !== "owner") return null
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        ref={dialogRef}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          dialogRef.current
            ?.querySelector<HTMLElement>("[data-slot=dialog-title]")
            ?.focus({ preventScroll: true })
        }}
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-5xl gap-0 overflow-y-auto p-0 sm:max-w-5xl"
      >
        <DialogHeader className="border-b p-5 pr-12 sm:p-6 sm:pr-12">
          <DialogTitle tabIndex={-1} className="text-xl outline-none">
            {step === "choose" ? "우리 조직에 맞는 구독 선택" : changeTitle}
          </DialogTitle>
          <DialogDescription>
            적용 조직 ·{" "}
            <span className="font-medium text-foreground">
              {organizationName}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="p-5 sm:p-6">
          {step === "review" ? (
            review
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                {plans.map((item) => {
                  const current = paidPlans.includes(item.id)
                  return (
                    <article
                      key={item.id}
                      aria-label={`${names[item.id]} 상품`}
                      className="flex min-w-0 flex-col rounded-xl border p-5"
                    >
                      <h3 className="text-lg font-semibold">
                        {names[item.id]}
                      </h3>
                      <p className="mt-2 min-h-10 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                      <p className="mt-5 font-medium">월간 구독 · 기본 5석</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        6번째부터 시트별 추가 요금
                      </p>
                      <Button
                        variant={current ? "outline" : "default"}
                        className="mt-5 w-full"
                        disabled={current}
                        onClick={() => selectPlan(item.id)}
                      >
                        {current
                          ? "현재 구독"
                          : currentBundle
                            ? "이 상품으로 변경"
                            : item.id === "bundle" && paidPlans.length
                              ? "Bundle로 변경"
                              : paidPlans.length
                                ? "추가 구독"
                                : "선택하기"}
                      </Button>
                      <ul className="mt-5 space-y-3 border-t pt-5 text-sm">
                        {item.features.map((feature) => (
                          <li key={feature} className="flex gap-2">
                            <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  )
                })}
              </div>
              {currentBundle && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/40 p-4">
                  <div>
                    <p className="text-sm font-medium">
                      두 제품의 시트 수를 다르게 사용하려면
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Trade OS와 SNAP을 각각 구독할 수 있습니다.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => selectPlan("separate")}
                  >
                    각각 구독으로 변경
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                시트 수와 변경 금액·적용일을 확인한 뒤 확정합니다. 현재 구독의
                수량만 바꾸려면 시트 관리를 이용하세요.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

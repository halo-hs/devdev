import { useId } from "react"
import { ArrowRight, CalendarDays, CircleAlert, CircleHelp, Info, LockKeyhole, ShieldCheck } from "lucide-react"
import { AsyncButton } from "@ecoya/design-system/extensions/async-button"
import { Typography } from "@ecoya/design-system/extensions/typography"
import { Alert, AlertDescription } from "@ecoya/design-system/ui/alert"
import { Badge } from "@ecoya/design-system/ui/badge"
import { Button } from "@ecoya/design-system/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@ecoya/design-system/ui/card"
import { Spinner } from "@ecoya/design-system/ui/spinner"
import { trialProducts, type TrialProduct } from "./trial-products"
export type { TrialProduct } from "./trial-products"

export type TrialRole = "owner" | "admin" | "member"
export type TrialStartState = "ready" | "starting" | "failed" | "unconfirmed" | "used"

export interface TrialPeriod {
  startedAt?: string
  endedAt?: string
}

export interface TrialStartCardProps {
  product: TrialProduct
  role: TrialRole
  state?: TrialStartState
  /** Supplied by the server. Missing values stay placeholders, never a local day default. */
  trialDays?: number
  trialPeriod?: TrialPeriod
  layout?: "card" | "row"
  onStart: (product: TrialProduct) => void
  onSubscribe?: (product: TrialProduct) => void
}

/** A product composition of DS primitives; no billing or entitlement mutation. */
export function TrialStartCard({ product, role, state = "ready", trialDays, trialPeriod, layout = "card", onStart, onSubscribe }: TrialStartCardProps) {
  const id = useId()
  const { name, description, icon: ProductIcon } = trialProducts[product]
  const locked = role !== "owner"
  const terminal = state === "used"
  const actionable = !locked && !terminal
  const starting = state === "starting"
  const daysLabel = trialDays !== undefined && Number.isFinite(trialDays) && trialDays > 0 ? `${trialDays}일` : "{서버 값}일"
  const message = state === "failed"
    ? "무료 체험을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요."
    : state === "unconfirmed"
      ? "결과를 확인하지 못했습니다. 다시 시도해 주세요."
      : state === "used"
        ? "이 제품의 무료 체험은 이미 사용했습니다."
        : null
  const MessageIcon = state === "failed" ? CircleAlert : state === "unconfirmed" ? CircleHelp : Info

  if (layout === "row") return (
    <section aria-labelledby={`${id}-product`} data-ui="trial-start-row" data-state={terminal ? "used" : locked ? "locked" : starting ? "starting" : "ready"}
      className="grid min-w-0 items-center gap-x-6 gap-y-3 sm:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0 space-y-2">
        <h3 id={`${id}-product`} className="text-sm font-semibold">{name}</h3>
        {terminal ? (
          <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
            <div className="flex flex-wrap gap-x-4 gap-y-1"><span>체험 종료</span><span>체험 시작 {trialPeriod?.startedAt ?? "{시작일}"}</span><span>체험 종료 {trialPeriod?.endedAt ?? "{종료일}"}</span></div>
            <p>무료 체험 기간을 모두 사용했습니다. 현재 읽기 전용으로 이용할 수 있습니다.</p>
            <p>{role === "owner" ? "계속 업무를 진행하려면 구독을 시작해 주세요." : "계속 업무를 진행하려면 조직 Owner에게 구독을 요청해 주세요."}</p>
          </div>
        ) : locked ? (
          <div className="space-y-1 text-xs leading-relaxed text-muted-foreground" role="note">
            <p className="flex items-start gap-1.5"><LockKeyhole className="mt-0.5 size-3.5 shrink-0" aria-label="제품 잠금" /><span>아직 시작되지 않은 제품입니다</span></p>
            <p>Organization OWNER가 무료 체험 또는 구독을 시작하면 사용할 수 있습니다.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs leading-relaxed text-muted-foreground">
              <span>무료 체험으로 시작해 보세요</span><span>체험 기간: {daysLabel}</span>
            </div>
            <div id={`${id}-terms`} className="flex flex-wrap gap-x-3 gap-y-1 text-xs leading-relaxed text-muted-foreground">
              <span>카드 등록 없이 시작하며 자동 결제되지 않습니다.</span>
              <span>체험 기간이 끝나면 읽기 전용으로 전환됩니다.</span>
            </div>
          </>
        )}
      </div>
      {terminal && role === "owner" && onSubscribe && <Button variant="outline" size="sm" className="h-auto min-h-8 max-w-full justify-self-end whitespace-normal px-3 py-1.5 leading-relaxed" onClick={() => onSubscribe(product)}>구독하기</Button>}
      {actionable && <AsyncButton variant="outline" size="sm"
        className="h-auto min-h-8 max-w-full justify-self-end whitespace-normal px-3 py-1.5 text-center leading-relaxed"
        loading={starting} loadingLabel="시작하는 중…" aria-describedby={`${id}-terms`}
        loadingContent={<span className="flex items-center justify-center gap-1.5 px-3"><Spinner className="size-3.5 shrink-0" /><span>시작하는 중…</span></span>}
        onClick={() => { if (!starting) onStart(product) }}>
        {starting ? <><Spinner className="size-3.5 shrink-0" aria-hidden="true" /><span>시작하는 중…</span></> : "무료 체험 시작"}
      </AsyncButton>}
    </section>
  )

  return (
    <Card role="region" aria-labelledby={`${id}-product`} data-ui="trial-start-card" data-state={locked ? "locked" : state}
      className="min-w-0">
      <CardHeader className="gap-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-[var(--r-md)] bg-muted text-primary"><ProductIcon className="size-6" aria-hidden="true" /></span>
          <Badge variant="secondary" className="h-auto min-h-6 whitespace-normal py-1">{locked ? "시작 전" : state === "used" ? "체험 사용 완료" : "무료 체험"}</Badge>
        </div>
        <div className="space-y-2">
          <Typography as="h2" variant="h6" id={`${id}-product`} className="text-[length:var(--text-header-6)] leading-[var(--leading-header-6)] font-semibold">{name}</Typography>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-5 px-6 pt-1 pb-6">
        {locked ? (
          <Alert variant="neutral" role="note">
            <LockKeyhole aria-label="제품 잠금" />
            <div className="min-w-0 space-y-2">
              <p className="font-semibold">아직 시작되지 않은 제품입니다</p>
              <AlertDescription>Organization OWNER가 무료 체험 또는 구독을 시작하면 사용할 수 있습니다.</AlertDescription>
            </div>
          </Alert>
        ) : terminal ? (
          <div className="space-y-4">
            <Alert variant="neutral" role="status"><Info aria-hidden="true" /><AlertDescription>{message}</AlertDescription></Alert>
            <p className="text-sm leading-relaxed text-muted-foreground">계속 업무를 진행하려면 구독을 시작해 주세요.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <Typography as="h3" variant="h9">무료 체험으로 시작해 보세요</Typography>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--r-md)] bg-muted px-4 py-3">
                <span className="inline-flex items-center gap-2 text-muted-foreground"><CalendarDays className="size-4" aria-hidden="true" />체험 기간</span>
                <strong className="text-base font-semibold">{daysLabel}</strong>
              </div>
              <div id={`${id}-terms`} className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>카드 등록 없이 시작하며 자동 결제되지 않습니다.</span></p>
                <p className="flex items-start gap-2"><Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>체험 기간이 끝나면 읽기 전용으로 전환됩니다.</span></p>
              </div>
            </div>
            {message && <Alert variant={state === "failed" ? "destructive" : "neutral"} role={state === "failed" ? "alert" : "status"}>
              <MessageIcon aria-hidden="true" /><AlertDescription>{message}</AlertDescription>
            </Alert>}
          </>
        )}
      </CardContent>
      {terminal && role === "owner" && onSubscribe && <CardFooter className="px-6 py-5">
        <Button size="lg" className="h-auto min-h-11 w-full gap-2 whitespace-normal px-4 py-3 text-center leading-relaxed" onClick={() => onSubscribe(product)}>
          구독하기<ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </CardFooter>}
      {actionable && <CardFooter className="px-6 py-5">
        <AsyncButton className="h-auto min-h-11 w-full gap-2 whitespace-normal px-4 py-3 text-center leading-relaxed" size="lg"
          loading={starting} loadingLabel="시작하는 중…" aria-describedby={`${id}-terms`}
          loadingContent={<span className="flex items-center justify-center gap-2 px-4"><Spinner className="size-4 shrink-0" /><span>시작하는 중…</span></span>}
          onClick={() => { if (!starting) onStart(product) }}>
          {starting ? "시작하는 중…" : "무료 체험 시작"}{!starting && <ArrowRight className="size-4" aria-hidden="true" />}
        </AsyncButton>
      </CardFooter>}
    </Card>
  )
}

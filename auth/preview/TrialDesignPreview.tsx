import { useEffect, useRef, useState } from "react"
import { Building2, ChevronRight, CreditCard, LayoutGrid, Monitor, RotateCcw, Smartphone } from "lucide-react"
import logo from "@/components/ds2/assets/logos/logo-ecoya-snap-color.png"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select"
import { Typography } from "@/components/ds2/extensions/Typography"
import { appLocation } from "@/app/appLocation"
import { cn } from "@/lib/utils"
import { SettingsDemoProvider } from "@share/settings/SubscriptionSettings"
import { ProductsSubscriptions } from "@share/settings/BillingSettingsView"
import type { SubscriptionChangeIntent } from "@share/settings/SubscriptionChangePanel"
import { ProductAccessScreen } from "@auth/ProductLockSurface"
import { TrialStartDemo } from "@auth/components/TrialStartDemo"
import { type TrialProduct, type TrialRole, type TrialStartState } from "@auth/TrialStartCard"

type PreviewView = "access" | "organization" | "states"
type ProductSelection = "both" | TrialProduct
const views: { value: PreviewView; label: string }[] = [
  { value: "access", label: "제품 접근" },
  { value: "organization", label: "조직 · 제품 및 구독" },
  { value: "states", label: "6가지 상태 모아보기" },
]
const states: { value: TrialStartState | "locked"; label: string; description: string }[] = [
  { value: "ready", label: "01 · Owner 시작 가능", description: "체험 조건을 확인하고 시작합니다." },
  { value: "locked", label: "02 · Admin·Member 잠금", description: "시작 권한 안내만 표시합니다. 버튼은 없습니다." },
  { value: "starting", label: "03 · 시작 중", description: "버튼을 비활성화하고 처리 상태를 표시합니다." },
  { value: "failed", label: "04 · 실패", description: "오류 안내와 함께 같은 카드에서 다시 시도합니다." },
  { value: "unconfirmed", label: "05 · 결과 확인 불가", description: "성공·실패를 단정하지 않는 중립 안내입니다." },
  { value: "used", label: "06 · 이미 사용", description: "사용 완료 상태를 안내하고 해당 제품의 구독 화면으로 연결합니다." },
]
const ownerStates = states.filter(({ value }) => value !== "locked")

function Scene({ view, role, state, selection, mobile }: { view: PreviewView; role: TrialRole; state: TrialStartState; selection: ProductSelection; mobile: boolean }) {
  const products: TrialProduct[] = selection === "both" ? ["erp", "snap"] : [selection]
  const [current, setCurrent] = useState<Record<TrialProduct, TrialStartState>>({ erp: state, snap: state })
  const timers = useRef<Partial<Record<TrialProduct, ReturnType<typeof setTimeout>>>>({})
  useEffect(() => {
    const pendingTimers = timers.current
    return () => { Object.values(pendingTimers).forEach(clearTimeout) }
  }, [])
  const openSubscription = (product: TrialProduct) => {
    const url = new URL(appLocation.href)
    url.searchParams.set("view", "organization")
    url.searchParams.set("product", product)
    url.searchParams.set("state", "used")
    url.searchParams.set("plan", "subscribe")
    appLocation.assign(url)
  }
  const subscribeProduct = new URLSearchParams(appLocation.search).get("product")
  const initialChangeIntent: SubscriptionChangeIntent | undefined = new URLSearchParams(appLocation.search).get("plan") === "subscribe" && (subscribeProduct === "erp" || subscribeProduct === "snap")
    ? { kind: "plan" as const, initialPlan: subscribeProduct } : undefined
  const start = (product: TrialProduct) => {
    if (role !== "owner" || timers.current[product] || current[product] === "starting") return
    setCurrent((previous) => ({ ...previous, [product]: "starting" }))
    timers.current[product] = setTimeout(() => {
      setCurrent((previous) => ({ ...previous, [product]: "unconfirmed" }))
      delete timers.current[product]
    }, 1200)
  }

  if (view === "states") return (
    <main className="mx-auto max-w-6xl space-y-8 px-5 py-8 sm:px-8">
      <header className="space-y-2">
        <Typography as="h1" variant="h5">무료 체험 시작 카드</Typography>
        <p className="text-sm text-muted-foreground">제품별 6가지 상태를 나란히 확인하세요.</p>
      </header>
      {products.map((product) => <section key={product} className="space-y-5">
      <h2 className="text-lg font-semibold">{product === "erp" ? "Trade OS" : "SNAP"}</h2>
      <div className={cn("grid items-start gap-x-6 gap-y-10", !mobile && "md:grid-cols-2 xl:grid-cols-3")}>
        {states.map(({ value, label, description }) => <section key={value} className="min-w-0 space-y-3">
          <div className="space-y-1"><h2 className="text-sm font-semibold">{label}</h2><p className="text-xs leading-relaxed text-muted-foreground">{description}</p></div>
          <TrialStartDemo product={product} role={value === "locked" ? "admin" : "owner"} initialState={value === "locked" ? "ready" : value} onSubscribe={openSubscription} />
        </section>)}
      </div>
      </section>)}
    </main>
  )

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-card px-5 py-5 sm:px-8">
        <span className="relative block h-6 w-[106px] overflow-hidden" aria-label="ECOYA"><img src={logo} alt="ECOYA" className="absolute top-0 left-0 h-6 w-[196px] max-w-none" /></span>
        <div className="flex flex-wrap items-center gap-2 text-sm"><Building2 className="size-4 text-muted-foreground" aria-hidden="true" /><span>한빛무역</span><Badge variant="secondary" className="h-auto whitespace-normal">{role === "owner" ? "Owner" : role === "admin" ? "Admin" : "Member"}</Badge></div>
      </header>
      {view === "access" ? <ProductAccessScreen organizationName="한빛무역" role={role} products={products.map((product) => ({ product, state: current[product] }))} onStart={start} onSubscribe={openSubscription} /> : (
        <div className={cn("mx-auto flex min-h-[40rem] max-w-[1440px]", mobile && "flex-col")}>
          <aside className={cn("hidden w-56 shrink-0 border-r bg-card px-4 py-8 lg:block", mobile && "lg:hidden")} aria-label="설정 위치">
            <p className="mb-8 px-3 text-lg font-semibold">설정</p>
            <p className="mb-3 px-3 text-xs text-muted-foreground">조직</p>
            <div className="flex items-center gap-3 rounded-[var(--r-md)] bg-muted px-3 py-3 text-sm font-semibold" aria-current="page"><CreditCard className="size-4" aria-hidden="true" />제품 및 구독</div>
          </aside>
          <main className="min-w-0 flex-1 space-y-6 p-5 sm:p-8">
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">설정<ChevronRight className="size-3" aria-hidden="true" />조직<ChevronRight className="size-3" aria-hidden="true" />제품 및 구독</p>
            <SettingsDemoProvider><ProductsSubscriptions initialChangeIntent={initialChangeIntent} organizationName="한빛무역" role={role} products={["erp", "snap"]} subscriptionStates={{ erp: selection === "snap" ? "paid_active" : state === "used" ? "trial_expired" : "trial_not_started", snap: selection === "erp" ? "paid_active" : state === "used" ? "trial_expired" : "trial_not_started" }} trialStates={{ erp: state, snap: state }} /></SettingsDemoProvider>
          </main>
        </div>
      )}
    </>
  )
}

export default function TrialDesignPreview() {
  const query = new URLSearchParams(appLocation.search)
  const requestedView = query.get("view")
  const view: PreviewView = requestedView === "organization" || requestedView === "states" ? requestedView : "access"
  const [role, setRole] = useState<TrialRole>(() => query.get("role") === "admin" ? "admin" : query.get("role") === "member" ? "member" : "owner")
  const [state, setState] = useState<TrialStartState>(() => {
    const value = query.get("state")
    return ownerStates.some((item) => item.value === value) ? value as TrialStartState : "ready"
  })
  const [selection, setSelection] = useState<ProductSelection>(() => query.get("product") === "erp" ? "erp" : query.get("product") === "snap" ? "snap" : query.get("product") === "both" ? "both" : view === "organization" ? "snap" : "both")
  const [mobile, setMobile] = useState(query.get("width") === "375")
  const [revision, setRevision] = useState(0)
  const updateQuery = (key: string, value: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set(key, value)
    window.history.replaceState(null, "", url)
  }
  const href = (nextView: PreviewView) => {
    const params = new URLSearchParams({ view: nextView, role, state, product: selection, width: mobile ? "375" : "full" })
    return `?${params}`
  }

  if (query.get("canvas") === "1") return <div className="min-h-svh bg-background"><Scene view={view} role={role} state={state} selection={selection} mobile={false} /></div>

  return (
    <div className="min-h-svh bg-muted/40 text-foreground">
      <section aria-label="디자인 미리보기 도구" className="border-b bg-card px-5 py-5 sm:px-8">
        <div className="mx-auto max-w-[1440px] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold"><LayoutGrid className="size-4" aria-hidden="true" />무료 체험 화면 <Badge variant="outline">#41</Badge></div>
            <p className="text-xs leading-relaxed text-muted-foreground">디자인 미리보기 · 체험 신청이나 결제는 실행되지 않습니다.</p>
          </div>
          <nav aria-label="미리보기 화면" className="flex flex-wrap gap-2">
            {views.map((item) => <Button key={item.value} variant={item.value === view ? "default" : "outline"} asChild className="h-auto min-h-9 whitespace-normal py-2"><a href={href(item.value)} aria-current={item.value === view ? "page" : undefined}>{item.label}</a></Button>)}
          </nav>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1 basis-36 space-y-1.5 sm:max-w-44"><label htmlFor="preview-product" className="text-xs text-muted-foreground">{view === "organization" ? "체험 대상 제품" : "제품"}</label><Select value={selection} onValueChange={(value) => { setSelection(value as ProductSelection); updateQuery("product", value) }}><SelectTrigger id="preview-product" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="both">{view === "organization" ? "두 제품 비교 (시안)" : "Trade OS + SNAP"}</SelectItem><SelectItem value="erp">Trade OS</SelectItem><SelectItem value="snap">SNAP</SelectItem></SelectContent></Select></div>
            {view !== "states" && <>
              <div className="min-w-0 flex-1 basis-32 space-y-1.5 sm:max-w-40"><label htmlFor="preview-role" className="text-xs text-muted-foreground">조직 역할</label><Select value={role} onValueChange={(value) => { setRole(value as TrialRole); updateQuery("role", value) }}><SelectTrigger id="preview-role" className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="owner">Owner</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="member">Member</SelectItem></SelectContent></Select></div>
              <div className="min-w-0 flex-1 basis-60 space-y-1.5 sm:max-w-72"><label htmlFor="preview-state" className="text-xs text-muted-foreground">카드 상태</label><Select value={state} disabled={role !== "owner"} onValueChange={(value) => { setState(value as TrialStartState); updateQuery("state", value) }}><SelectTrigger id="preview-state" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{ownerStates.map((item) => <SelectItem key={item.value} value={item.value}>{view === "organization" && item.value === "failed" ? "04 · 실패 응답 (토스트)" : view === "organization" && item.value === "unconfirmed" ? "05 · 결과 미확인 (토스트)" : view === "organization" && item.value === "used" ? "06 · 체험 종료 · 구독 안내" : item.label}</SelectItem>)}</SelectContent></Select></div>
            </>}
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              <Button variant={mobile ? "outline" : "secondary"} aria-pressed={!mobile} onClick={() => { setMobile(false); updateQuery("width", "full") }}><Monitor />전체 폭</Button>
              <Button variant={mobile ? "secondary" : "outline"} aria-pressed={mobile} onClick={() => { setMobile(true); updateQuery("width", "375") }}><Smartphone />375px</Button>
              <Button variant="ghost" size="icon" aria-label="선택한 상태로 초기화" onClick={() => setRevision((value) => value + 1)}><RotateCcw /></Button>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{view === "organization" ? "체험 대상 외 제품은 구독 중으로 표시합니다. 실패·결과 미확인을 선택한 뒤 무료 체험 시작을 누르면 토스트가 뜹니다. 기간·날짜는 서버 값 자리 표시입니다." : "기간은 서버 값 자리 표시입니다. 시작 버튼을 누르면 ‘시작 중’ 뒤 ‘결과 확인 불가’ 예시로 전환됩니다."}</p>
        </div>
      </section>
      <div className={cn("mx-auto min-h-svh w-full bg-background", mobile && "my-6 max-w-[375px] rounded-[var(--r-lg)] border shadow-[var(--shadow-section)]")}>
        {mobile ? <iframe key={`${view}:${role}:${state}:${selection}:${revision}`} title="375px 모바일 화면 미리보기" src={`${href(view)}&canvas=1`} className="block h-[960px] w-full rounded-[var(--r-lg)] border-0" /> : <Scene key={`${view}:${role}:${state}:${selection}:${revision}`} view={view} role={role} state={state} selection={selection} mobile={false} />}
      </div>
    </div>
  )
}

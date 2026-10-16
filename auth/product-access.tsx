import { Building2 } from "lucide-react"
import { Typography } from "@ecoya/design-system/extensions/typography"
import { cn } from "@shared/lib/utils"
import { TrialStartCard, type TrialProduct, type TrialRole, type TrialStartState } from "./components/trial-start-card"

export interface ProductTrialPresentation {
  product: TrialProduct
  state: TrialStartState
  trialDays?: number
}

export function ProductAccessScreen({ organizationName, role, products, onStart, onSubscribe }: {
  organizationName: string
  role: TrialRole
  products: readonly ProductTrialPresentation[]
  onStart: (product: TrialProduct) => void
  onSubscribe: (product: TrialProduct) => void
}) {
  const hasUsedTrial = products.some(({ state }) => state === "used")
  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="mb-8 space-y-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Building2 className="size-4 shrink-0" aria-hidden="true" />{organizationName}</p>
        <Typography as="h1" variant="h4" className="text-[length:var(--text-header-4)] leading-[var(--leading-header-4)] font-semibold">{products.length === 1 ? `${products[0].product === "erp" ? "Trade OS" : "SNAP"} 시작하기` : "사용할 제품을 선택해 주세요"}</Typography>
        <p className="text-base leading-relaxed text-muted-foreground">{role !== "owner" ? "조직에서 이용할 제품과 시작 상태를 확인하세요." : hasUsedTrial ? "제품별 이용 상태를 확인하고, 필요한 제품의 구독을 시작하세요." : "우리 조직에 필요한 제품을 무료로 체험해 보세요."}</p>
      </header>
      <div className={cn("grid items-stretch gap-6", products.length > 1 ? "md:grid-cols-2" : "max-w-xl")}>
        {products.map(({ product, state, trialDays }) => <TrialStartCard key={product} product={product} state={state} role={role} trialDays={trialDays} onStart={onStart} onSubscribe={onSubscribe} />)}
      </div>
    </main>
  )
}

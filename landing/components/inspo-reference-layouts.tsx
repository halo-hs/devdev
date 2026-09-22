import { Children, useRef, useState, type ReactNode } from "react"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { Button } from "@shared/components/ui/button"

/* Product-led composition based on the selected Glide reference.
 * Earlier Inspo source captures remain archived in docs/design/inspo-source/.
 */
export function InspoHeroProductStage({
  copy,
  panel,
  footer,
}: {
  copy: ReactNode
  panel: ReactNode
  footer: ReactNode
}) {
  return (
    <section
      className="trade-hero trade-product-hero"
      aria-labelledby="trade-title"
    >
      <div className="trade-container">
        <div className="trade-hero-introduction">{copy}</div>
        <div className="trade-hero-stage">{panel}</div>
        {footer}
      </div>
    </section>
  )
}

export function InspoFeatureOverview({ children }: { children: ReactNode }) {
  const rail = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ start: true, end: false })
  const scroll = (direction: number) => {
    const element = rail.current
    if (!element) return
    const card = element.firstElementChild as HTMLElement
    const step =
      card.getBoundingClientRect().width +
      parseFloat(getComputedStyle(element).columnGap)
    element.scrollBy({
      left: direction * step,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    })
  }
  return (
    <div className="trade-feature-carousel">
      <div className="trade-feature-scroll-controls">
        <button
          type="button"
          aria-label="이전 기능 보기"
          disabled={position.start}
          onClick={() => scroll(-1)}
        >
          <ArrowLeft size={20} />
        </button>
        <button
          type="button"
          aria-label="다음 기능 보기"
          disabled={position.end}
          onClick={() => scroll(1)}
        >
          <ArrowRight size={20} />
        </button>
      </div>
      <div
        className="trade-feature-overview"
        ref={rail}
        tabIndex={0}
        role="region"
        aria-label={`주요 기능 ${Children.count(children)}개, 가로 스크롤`}
        onScroll={(event) => {
          const el = event.currentTarget
          setPosition({
            start: el.scrollLeft <= 1,
            end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
          })
        }}
      >
        {Children.toArray(children).map((child, index) => (
          <div key={index} className="trade-overview-primary">
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}

type Plan = {
  name: string
  description: string
  price: string
  items: string[]
  cta: string
}
/* inspo-reference-component
 * source= get_reference_jsx(pricing, three-card)
 * archetype= Horizontal plan trio | recommended tier: thin accent top rule
 * Adapted: original ERP plans and shared brand Button component.
 * Unmodified source: docs/design/inspo-source/pricing-three-card.jsx.txt
 */
export function InspoPricingThreeCard({ plans }: { plans: Plan[] }) {
  return (
    <div
      className="trade-pricing grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-3"
      data-inspo-component="pricing/three-card"
    >
      {plans.map((plan, index) => (
        <article
          key={plan.name}
          className={`relative flex flex-col border ${index === 1 ? "trade-plan-featured border-t-2" : ""}`}
          style={
            index === 1 ? { borderTopColor: "var(--color-accent)" } : undefined
          }
        >
          <div className="inspo-plan-header space-y-2">
            <h3>{plan.name}</h3>
            {index === 1 && (
              <span className="inspo-plan-recommended">메인 플랜</span>
            )}
            <strong className="trade-plan-price">{plan.price}</strong>
          </div>
          <p>{plan.description}</p>
          <ul className="mt-8 space-y-3 border-t py-6">
            {plan.items.map((item) => (
              <li key={item} className="flex items-baseline gap-3">
                <Check size={18} aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <Button
            size="lg"
            variant={index === 1 ? "default" : "outline"}
            className="mt-auto"
            asChild
          >
            <a href="/signup?product=erp">
              {plan.cta}
              <ArrowRight />
            </a>
          </Button>
        </article>
      ))}
    </div>
  )
}

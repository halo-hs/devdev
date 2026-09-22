import { useEffect, useState } from "react"
import { ArrowRight, Check, Files, Camera } from "lucide-react"
import { LandingShell } from "./landing-shell"
import "./pricing-landing.css"

type Product = "erp" | "snap"
function useProduct() {
  const [product, setProduct] = useState<Product>(() =>
    new URLSearchParams(window.location.search).get("product") === "snap"
      ? "snap"
      : "erp"
  )
  useEffect(() => {
    const sync = () =>
      setProduct(
        new URLSearchParams(window.location.search).get("product") === "snap"
          ? "snap"
          : "erp"
      )
    window.addEventListener("popstate", sync)
    return () => window.removeEventListener("popstate", sync)
  }, [])
  const select = (value: Product) => {
    setProduct(value)
    const url = new URL(window.location.href)
    url.searchParams.set("product", value)
    window.history.replaceState({}, "", url)
  }
  return [product, select] as const
}
function ProductTabs({
  product,
  onChange,
}: {
  product: Product
  onChange: (product: Product) => void
}) {
  return (
    <div className="ecoya-product-tabs" role="tablist" aria-label="제품 선택">
      {(["erp", "snap"] as const).map((value) => (
        <button
          key={value}
          id={`product-tab-${value}`}
          type="button"
          role="tab"
          aria-selected={product === value}
          aria-controls="product-panel"
          tabIndex={product === value ? 0 : -1}
          onClick={() => onChange(value)}
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
              return
            event.preventDefault()
            const next =
              event.key === "Home"
                ? "erp"
                : event.key === "End"
                  ? "snap"
                  : value === "erp"
                    ? "snap"
                    : "erp"
            onChange(next)
            document.getElementById(`product-tab-${next}`)?.focus()
          }}
        >
          {value === "erp" ? <Files size={18} /> : <Camera size={18} />}ECOYA{" "}
          {value === "erp" ? "Trade OS" : "SNAP"}
        </button>
      ))}
    </div>
  )
}

type Plan = {
  name: string
  audience: string
  price: string
  unit?: string
  features: string[]
  featured?: boolean
  start?: boolean
}
const tradePlans: Plan[] = [
  {
    name: "파일럿",
    audience: "우리 팀의 업무로 도입 검증",
    price: "문의",
    start: true,
    features: [
      "문서 수신·발행 · 거래 · 정산",
      "AI 읽기 결과 표시 · 감사추적",
      "1개 조직 · 파일럿 기간",
    ],
  },
  {
    name: "ERP Pro",
    audience: "함께 일하는 무역팀을 위해",
    price: "문의",
    featured: true,
    features: [
      "조직 월 구독 · 멤버 협업",
      "문서 만들기·읽기·질문·정산",
      "Intelligence Awareness 포함",
    ],
  },
  {
    name: "엔터프라이즈",
    audience: "보안과 운영 규모에 맞춘 도입",
    price: "맞춤",
    features: [
      "전용 배포 · SSO",
      "감사 로그 · 세분 권한",
      "SNAP seat · Intel Reasoning 추가 옵션",
    ],
  },
]
const snapPlans: Plan[] = [
  {
    name: "Starter",
    audience: "소규모 현장에서 시작하기",
    price: "59,000",
    unit: "원 / 월",
    start: true,
    features: ["작업·증거 관리", "사람 검토와 승인 이력", "고객 공유 링크"],
  },
  {
    name: "Team",
    audience: "팀의 승인·리포트 운영",
    price: "149,000",
    unit: "원 / 월",
    featured: true,
    start: true,
    features: ["작업·증거 관리", "사람 검토와 승인 이력", "고객 공유 링크"],
  },
  {
    name: "Business",
    audience: "다조직 운영과 연동·지원",
    price: "문의",
    features: [
      "다조직 운영 상담",
      "업무 연동 범위 협의",
      "도입 및 운영 지원 상담",
    ],
  },
]

export function PricingLanding() {
  const [product, select] = useProduct()
  const contact = `/contact?product=${product}`
  useEffect(() => {
    document.title = "ECOYA — 가격"
  }, [])
  const trade = product === "erp"
  const plans = trade ? tradePlans : snapPlans
  const comparisons = trade
    ? [
        ["도입 대상", "도입 검증", "성장하는 무역팀", "보안·규모 확장"],
        ["구독 방식", "파일럿 기간", "조직 월 구독", "맞춤 협의"],
        [
          "주요 범위",
          "문서 · 거래 · 정산",
          "문서 · AI 질의 · 협업",
          "전용 배포 · SSO",
        ],
        [
          "추가 옵션",
          "상담 안내",
          "Intelligence Awareness 포함",
          "SNAP · Intel 옵션 협의",
        ],
      ]
    : [
        [
          "도입 대상",
          "소규모 현장 검증",
          "팀의 승인·리포트 운영",
          "다조직·연동·지원",
        ],
        ["월 요금", "59,000원", "149,000원", "문의"],
        ["작업·증거 관리", "포함", "포함", "범위 협의"],
        ["검토·승인 이력", "포함", "포함", "범위 협의"],
        ["고객 공유 링크", "포함", "포함", "범위 협의"],
      ]
  return (
    <LandingShell page="pricing" product={product}>
      <main className="ecoya-pricing-page">
        <section className="ecoya-product-intro trade-container">
          <p className="trade-section-label">PRICING</p>
          <h1>
            우리 팀에 맞게,
            <br />
            필요한 만큼 시작하세요.
          </h1>
          <p>현장의 규모와 일하는 방식에 맞는 플랜을 선택하세요.</p>
          <ProductTabs product={product} onChange={select} />
        </section>
        <section
          id="product-panel"
          role="tabpanel"
          tabIndex={0}
          aria-labelledby={`product-tab-${product}`}
          className="trade-container ecoya-pricing-panel"
        >
          <h2 className="sr-only">
            ECOYA {trade ? "Trade OS" : "SNAP"} 요금제
          </h2>
          <div className="ecoya-price-grid">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={plan.featured ? "is-featured" : ""}
              >
                <div className="ecoya-price-card">
                  <div className="ecoya-plan-heading">
                    <h3>{plan.name}</h3>
                    {plan.featured && (
                      <span>{trade ? "메인 플랜" : "추천"}</span>
                    )}
                  </div>
                  <p>{plan.audience}</p>
                  <div className="ecoya-plan-price">
                    <strong>{plan.price}</strong>
                    {plan.unit && <span>{plan.unit}</span>}
                  </div>
                  <a
                    className="ecoya-plan-cta"
                    href={plan.start ? `/signup?product=${product}` : contact}
                  >
                    {plan.start ? "시작하기" : "도입 문의"}
                    <ArrowRight size={17} />
                  </a>
                </div>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={17} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="ecoya-price-note">
            최종 요금과 제공 범위는 도입 상담에서 안내합니다.
          </p>
          <section
            className="ecoya-price-compare"
            aria-labelledby="compare-title"
          >
            <h2 id="compare-title">플랜 한눈에 비교하기</h2>
            <div
              className="ecoya-table-scroll"
              role="region"
              aria-label="요금제 비교표"
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    <th scope="col">비교 항목</th>
                    {plans.map((plan) => (
                      <th scope="col" key={plan.name}>
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map(([label, ...values]) => (
                    <tr key={label}>
                      <th scope="row">{label}</th>
                      {values.map((value, i) => (
                        <td key={i}>{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
        <section className="ecoya-faq trade-section trade-container">
          <h2>가격에 대해 궁금한 점</h2>
          {[
            [
              "어떤 제품으로 시작하면 되나요?",
              "서류·거래·정산을 관리하려면 Trade OS, 현장 작업을 사진과 리포트로 남기려면 SNAP을 선택하세요. 필요한 제품부터 시작할 수 있습니다.",
            ],
            [
              "우리 팀에 맞는 플랜은 어떻게 정하나요?",
              "도입 문의를 남겨주시면 업무 방식과 운영 규모를 확인해 적합한 플랜과 제공 범위를 안내드립니다.",
            ],
            [
              "다른 제품도 함께 사용할 수 있나요?",
              "Trade OS와 SNAP을 함께 사용하는 방식과 연동 범위는 도입 상담에서 확인할 수 있습니다.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
        <section className="ecoya-pricing-contact">
          <div className="trade-container">
            <h2>
              우리 팀의 다음 시작,
              <br />
              함께 정해볼까요?
            </h2>
            <p>업무에 맞는 도입 방법을 안내해드립니다.</p>
            <a href={contact}>
              도입 문의 <ArrowRight size={18} />
            </a>
          </div>
        </section>
      </main>
    </LandingShell>
  )
}

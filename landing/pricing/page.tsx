import { useEffect } from "react"
import { ArrowRight, Check } from "lucide-react"
import { LandingShell } from "../shared/layout"
import "./styles.css"

const includedMembers = 5
const plans = [
  {
    name: "SNAP",
    audience: "현장 기록부터 검토·리포트 공유까지",
    price: 200,
    href: "/signup?product=snap",
    action: "시작하기",
    featured: false,
    features: ["작업·증거 관리", "사람 검토와 승인 이력", "고객 공유 링크"],
  },
  {
    name: "Trade OS",
    audience: "무역 문서부터 거래·정산까지",
    price: 300,
    href: "/signup?product=erp",
    action: "시작하기",
    featured: false,
    features: [
      "문서 만들기·AI 읽기·질문",
      "거래·정산 관리",
      "멤버 협업·감사추적",
    ],
  },
  {
    name: "SNAP + Trade OS",
    audience: "현장과 무역 업무를 함께 운영하는 팀",
    price: 400,
    href: "/contact",
    action: "통합 도입 문의",
    featured: true,
    features: [
      "SNAP 기능 포함",
      "Trade OS 기능 포함",
      "현장 기록과 무역 업무를 함께 이용",
    ],
  },
]

export function PricingLanding() {
  const product =
    new URLSearchParams(window.location.search).get("product") === "snap"
      ? "snap"
      : "erp"
  const contact = `/contact?product=${product}`
  useEffect(() => {
    document.title = "ECOYA — 가격"
  }, [])
  const comparisons = [
    ["월 기본 요금 (USD)", ...plans.map((plan) => `$${plan.price}`)],
    ["기본 포함 인원", ...plans.map(() => `${includedMembers}인`)],
    ["인원 추가", ...plans.map(() => "6인부터 인원별 추가 과금")],
    ["현장 작업·증거·리포트", "포함", "—", "포함"],
    ["무역 문서·거래·정산", "—", "포함", "포함"],
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
          <p>기본 5인으로 시작하고, 팀이 커지면 인원을 추가하세요.</p>
        </section>
        <section
          id="product-panel"
          aria-labelledby="pricing-plans-title"
          className="trade-container ecoya-pricing-panel"
        >
          <h2 id="pricing-plans-title" className="sr-only">
            ECOYA 요금제
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
                    {plan.featured && <span>통합</span>}
                  </div>
                  <p>{plan.audience}</p>
                  <div className="ecoya-plan-price">
                    <strong>${plan.price}</strong>
                    <span>USD / 월부터</span>
                  </div>
                  <p className="ecoya-plan-members">
                    기본 {includedMembers}인 포함
                  </p>
                  <p className="ecoya-plan-extra">6인부터 인원별 추가 과금</p>
                  <a className="ecoya-plan-cta" href={plan.href}>
                    {plan.action}
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
            표시 금액은 기본 5인 기준의 월 요금(USD)입니다. 추가 인원당 요금은
            별도 안내합니다.
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
              "기본 요금에는 몇 명이 포함되나요?",
              "모든 플랜은 기본 5인이 포함됩니다. SNAP은 월 $200, Trade OS는 월 $300, 통합 플랜은 월 $400부터 시작합니다.",
            ],
            [
              "5명을 초과하면 어떻게 과금되나요?",
              "6번째 인원부터 추가 인원 수에 따라 월 요금이 더해집니다. 추가 인원당 요금은 별도 안내합니다.",
            ],
            [
              "다른 제품도 함께 사용할 수 있나요?",
              "SNAP + Trade OS 통합 플랜으로 두 제품을 함께 이용할 수 있습니다. 기본 5인 기준 월 $400부터 시작하며, 구체적인 도입 범위는 상담에서 안내합니다.",
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

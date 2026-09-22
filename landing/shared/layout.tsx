import { type ReactNode } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import ecoyaWhiteLogo from "@ecoya/design-system/assets/logos/logo-ecoya-white.png"
import ecoyaColorLogo from "@ecoya/design-system/assets/logos/logo-ecoya-snap-color.png"
import "./base.css"
import "./theme.css"
import "./pages.css"

export type LandingPage = "story" | "trade" | "snap" | "pricing" | "contact"
const pages = [
  { page: "story", href: "/", label: "브랜드 스토리" },
  { page: "trade", href: "/trade-os", label: "Trade OS" },
  { page: "snap", href: "/snap", label: "ECOYA SNAP" },
] as const

export function StartButton({
  label = "시작하기",
  product = "erp",
}: {
  label?: string
  product?: "erp" | "snap"
}) {
  return (
    <Button size="lg" asChild>
      <a href={`/signup?product=${product}`}>
        {label}
        <ArrowRight />
      </a>
    </Button>
  )
}

export function LandingHeader({
  page,
  product = "erp",
  homeHref = "/",
  homeLabel = "ECOYA 홈",
}: {
  page?: LandingPage
  product?: "erp" | "snap"
  homeHref?: "/" | "/snap"
  homeLabel?: string
}) {
  const suffix = page === "trade" ? "Trade OS" : page === "snap" ? "SNAP" : null
  return (
    <div className="trade-nav-wrap">
      <header className="trade-nav trade-container">
        <a href={homeHref} className="trade-brand" aria-label={homeLabel}>
          <span className="trade-brand-logo" aria-hidden="true">
            <img className="ecoya-logo-light" src={ecoyaColorLogo} alt="" />
            <img className="ecoya-logo-dark" src={ecoyaWhiteLogo} alt="" />
          </span>
          {suffix && <span className="trade-brand-product">{suffix}</span>}
        </a>
        <nav aria-label="주요 메뉴">
          <a href="/" aria-current={page === "story" ? "page" : undefined}>
            브랜드 스토리
          </a>
          <a href="/trade-os" aria-current={page === "trade" ? "page" : undefined}>
            Trade OS
          </a>
          <a href="/snap" aria-current={page === "snap" ? "page" : undefined}>
            SNAP
          </a>
          <a
            href={`/pricing?product=${product}`}
            aria-current={page === "pricing" ? "page" : undefined}
          >
            가격
          </a>
        </nav>
        <div className="trade-nav-actions">
          <a href={`/login?product=${product}`}>로그인</a>
          <a
            className="ecoya-nav-contact"
            href={page === "story" ? "/contact" : `/contact?product=${product}`}
            aria-current={page === "contact" ? "page" : undefined}
          >
            도입 문의
          </a>
          <StartButton product={product} />
        </div>
      </header>
    </div>
  )
}

export function LandingShell({
  page,
  children,
  product: selectedProduct,
}: {
  product?: "erp" | "snap"
  page: LandingPage
  children: ReactNode
}) {
  const product = selectedProduct ?? (page === "snap" ? "snap" : "erp")
  const suffix = page === "trade" ? "Trade OS" : page === "snap" ? "SNAP" : null
  return (
    <div
      className="trade-landing"
      data-landing-product={page === "trade" ? "trade" : "home"}
      data-landing-page={page}
    >
      <LandingHeader page={page} product={product} />
      {children}
      <footer className="trade-footer trade-container">
        <a className="trade-brand" href="/" aria-label="ECOYA 홈">
          <span className="trade-brand-logo" aria-hidden="true">
            <img src={ecoyaColorLogo} alt="" />
          </span>
          {suffix && <span className="trade-brand-product">{suffix}</span>}
        </a>
        <p>© ECOYA{suffix ? ` ${suffix}` : ""}</p>
        <nav aria-label="하단 메뉴">
          {pages.map((item) => (
            <a
              key={item.page}
              href={item.href}
              aria-current={page === item.page ? "page" : undefined}
            >
              {item.label}
            </a>
          ))}
          <a href={`/pricing?product=${product}`}>가격</a>
          <a href={`/contact?product=${product}`}>도입 문의</a>
          <a href="/legal/terms">이용약관</a>
          <a href="/legal/privacy">개인정보처리방침</a>
        </nav>
      </footer>
    </div>
  )
}

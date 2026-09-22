import { useState, type ReactNode } from "react"
import {
  ArrowUpRight,
  Camera,
  FileText,
  Languages,
  Menu,
  X,
} from "lucide-react"
import { LandingHeader } from "@landing/landing-shell"
import { type AuthLayoutVariant } from "@auth/lib/auth-validation"
import { cn } from "@shared/lib/utils"
import cargoOperationsBanner from "@/assets/home/cargo-operations-banner.jpg"
import ecoyaWhiteLogo from "@ecoya/design-system/assets/logos/logo-ecoya-white.png"
import ecoyaColorLogo from "@ecoya/design-system/assets/logos/logo-ecoya-snap-color.png"

const linkClass =
  "rounded-sm text-base text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"

export function CommonPublicLayout({
  children,
  authVariant,
  sharedHeader = true,
  homeHref = "/snap",
}: {
  children: ReactNode
  authVariant?: AuthLayoutVariant
  sharedHeader?: boolean
  homeHref?: "/" | "/snap"
}) {
  const [language, setLanguage] = useState("ko")
  const [menuOpen, setMenuOpen] = useState(false)
  const splitVariant =
    authVariant && authVariant !== "login" ? authVariant : undefined
  return (
    <div className="flex min-h-svh flex-col bg-background">
      {authVariant || sharedHeader ? (
        <div className="trade-landing ecoya-auth-header" data-auth-variant={authVariant}>
          <LandingHeader
            product={homeHref === "/snap" ? "snap" : "erp"}
            homeHref={homeHref}
            homeLabel="ECOYA 서비스 홈"
          />
        </div>
      ) : (
        <header
          className={cn(
            "relative z-30 shrink-0 border-b bg-background",
            splitVariant && "lg:border-b-0"
          )}
        >
          <div
            className={cn(
              "mx-auto flex h-20 w-full items-center justify-between gap-x-6 px-5 sm:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] lg:items-stretch lg:gap-0 lg:p-0",
              authVariant === "recovery" &&
                "lg:grid-cols-[minmax(0,3fr)_minmax(0,7fr)]"
            )}
          >
            <div
              className={cn(
                "lg:flex lg:items-center lg:px-10 lg:py-5",
                splitVariant && "lg:bg-indigo-950"
              )}
            >
              <a
                href={homeHref}
                aria-label="ECOYA 서비스 홈"
                className={cn(
                  "inline-flex items-center gap-2.5 rounded-sm text-primary focus-visible:outline-2 focus-visible:outline-offset-4",
                  splitVariant && "lg:text-white"
                )}
              >
                <span
                  className="relative block h-6 w-[105.6px] shrink-0 overflow-hidden"
                  aria-hidden="true"
                >
                  <img
                    src={ecoyaColorLogo}
                    alt=""
                    className={cn(
                      "absolute top-0 left-0 h-6 w-[196.2px] max-w-none",
                      splitVariant && "lg:hidden"
                    )}
                  />
                  {splitVariant && (
                    <img
                      src={ecoyaWhiteLogo}
                      alt=""
                      className="absolute top-0 left-0 hidden h-6 w-[196.2px] max-w-none lg:block"
                    />
                  )}
                </span>
              </a>
            </div>
            <button
              type="button"
              className="ml-auto flex size-10 items-center justify-center rounded-md hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary md:hidden"
              aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
              aria-expanded={menuOpen}
              aria-controls="common-public-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
            <nav
              id="common-public-navigation"
              aria-label="공개 페이지"
              className={cn(
                "absolute top-full right-0 ml-auto w-full flex-wrap items-center justify-end gap-x-5 gap-y-3 border-b bg-background p-5 md:static md:flex md:w-auto md:border-0 md:p-0 lg:ml-0 lg:w-full lg:px-8 lg:py-5",
                menuOpen ? "flex" : "hidden"
              )}
            >
              <a className={linkClass} href={homeHref}>
                서비스
              </a>
              <a
                className={linkClass}
                href={homeHref === "/" ? "/pricing?product=erp" : "/pricing?product=snap"}
              >
                요금제
              </a>
              <a className={linkClass} href="/login?returnTo=usage">
                이용내역
              </a>
              <label className="flex items-center gap-1.5 text-base text-muted-foreground">
                <Languages className="size-4" aria-hidden />
                <select
                  aria-label="언어 선택"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="min-h-8 cursor-pointer rounded-sm bg-background py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                </select>
              </label>
              <a
                className="rounded-md border px-3 py-1.5 text-base font-medium text-primary hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2"
                href={
                  homeHref === "/"
                    ? "/login?product=erp"
                    : "/login?product=snap"
                }
              >
                로그인
              </a>
            </nav>
          </div>
        </header>
      )}
      <div className="flex flex-1 flex-col">{children}</div>
      {!authVariant && <CommonPublicFooter />}
    </div>
  )
}

export function CommonPublicFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className="shrink-0 bg-background">
      <div
        className={cn(
          "mx-auto flex min-h-[66.2px] w-full max-w-[1600px] flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-6 text-[13px] leading-[18.2px] text-muted-foreground sm:px-8",
          compact ? "text-center" : "lg:px-10"
        )}
      >
        <span className="order-2">© 2026 ECOYA. All rights reserved.</span>
        <nav
          aria-label="법적 고지"
          className={cn(
            "flex flex-wrap justify-center gap-x-4 gap-y-2",
            compact && "justify-center"
          )}
        >
          <a href="/legal/terms" className="hover:text-primary hover:underline">
            이용약관
          </a>
          <a
            href="/legal/privacy"
            className="hover:text-primary hover:underline"
          >
            개인정보처리방침
          </a>
          <a
            href="/legal/location"
            className="hover:text-primary hover:underline"
          >
            위치기반 서비스 이용약관
          </a>
        </nav>
      </div>
    </footer>
  )
}

export function AccountGuide({ variant }: { variant: AuthLayoutVariant }) {
  const signup = variant === "signup"
  const branded = signup || variant === "login"
  return (
    <aside
      aria-label="ECOYA 이용 안내"
      className={cn(
        "relative isolate order-2 flex min-w-0 flex-col overflow-hidden border-t px-6 py-7 text-white lg:order-none lg:border-t-0 lg:border-r lg:px-10 lg:py-16",
        branded ? "ecoya-account-guide border-[#1c3d61]" : "border-indigo-800 bg-indigo-950"
      )}
    >
      {branded && (
        <>
          <img
            src={cargoOperationsBanner}
            alt=""
            aria-hidden="true"
            className="ecoya-account-photo pointer-events-none absolute inset-0 size-full object-cover object-center"
          />
          <div
            aria-hidden="true"
            className="ecoya-account-photo-shade pointer-events-none absolute inset-0"
          />
        </>
      )}
      <div className="relative z-10 mx-auto w-full max-w-sm">
        {variant === "login" ? (
          <div>
            <h2 className="text-[30px] leading-[1.5] font-semibold tracking-normal text-white lg:text-[36px]">
              ECOYA 계정으로
              <br />
              로그인하세요.
            </h2>
            <p className="mt-9 flex flex-wrap items-center gap-2 text-[14px] leading-5 font-medium text-white">
              계정이 없나요?
              <a
                href="/signup"
                className="font-semibold text-white underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                회원가입
              </a>
            </p>
          </div>
        ) : signup ? (
          <div className="lg:pt-12">
            <div className="divide-y divide-white/15">
              {[
                {
                  name: "ECOYA Trade OS",
                  category: "무역 문서 · 거래 관리",
                  title: "무역 문서 작성부터 검토까지, 더 간편하게.",
                  description:
                    "문서를 작성하고 검토하며, 거래에 필요한 업무를 이어가세요.",
                  icon: FileText,
                },
                {
                  name: "ECOYA SNAP",
                  category: "현장 기록 · 리포트 공유",
                  title: "현장의 기록을, 확인 가능한 증빙으로.",
                  description:
                    "사진과 영상을 모아 팀과 검토하고, 고객에게 리포트로 전달하세요.",
                  icon: Camera,
                },
              ].map((product) => (
                <article
                  key={product.name}
                  aria-label={product.name}
                  className="py-8 first:pt-0 last:pb-0"
                >
                  <product.icon
                    className="mb-5 size-10 text-white"
                    aria-hidden="true"
                  />
                  <h2 className="text-2xl font-semibold tracking-tight text-white">
                    {product.name}
                  </h2>
                  <p className="mt-2 text-base text-white">
                    {product.category}
                  </p>
                  <p className="mt-5 text-base leading-7 font-medium text-white">
                    {product.title}
                  </p>
                  <p className="mt-2 text-base leading-7 text-white">
                    {product.description}
                  </p>
                </article>
              ))}
            </div>
            <a
              href="/free-trial"
              className="mt-8 flex min-h-12 w-full items-center justify-between gap-3 rounded-lg bg-white px-5 py-3 text-base font-semibold text-[#1c3d61] shadow-sm transition-colors hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              14일 무료체험 알아보기{" "}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        ) : (
          <>
            <p className="text-base font-medium text-indigo-100">
              {signup ? "ECOYA 회원가입" : "ECOYA 계정 안내"}
            </p>
            <h2 className="mt-3 text-2xl leading-relaxed font-semibold tracking-tight text-white lg:text-3xl lg:leading-relaxed">
              {signup ? "우리 팀의 업무를," : "ECOYA 계정으로,"}
              <br /> {signup ? "한곳에서 시작하세요." : "업무를 이어가세요."}
            </h2>
            <p className="mt-4 max-w-sm text-base leading-7 text-indigo-100">
              계정으로 로그인한 뒤 소속 조직과 사용할 제품을 선택할 수 있습니다.
            </p>
            <div className="mt-9 hidden space-y-6 lg:block">
              <div>
                <h3 className="text-base font-semibold">Trade OS</h3>
                <p className="mt-1.5 text-base leading-7 text-indigo-100">
                  무역 문서 작성과 검토부터
                  <br />
                  거래 관리까지 이어집니다.
                </p>
              </div>
              <div>
                <h3 className="text-base font-semibold">SNAP</h3>
                <p className="mt-1.5 text-base leading-7 text-indigo-100">
                  현장 기록을 모아 검토하고
                  <br />
                  고객에게 리포트로 전달합니다.
                </p>
              </div>
            </div>
            <div className="mt-7 border-t border-white/20 pt-6 lg:mt-10">
              <p className="text-base font-semibold text-white">
                처음 이용하시나요?
              </p>
              <p className="mt-2 text-base leading-7 text-indigo-100">
                14일 무료체험으로 시작해보세요.
              </p>
              <a
                href="/free-trial"
                className="mt-4 flex min-h-12 w-full items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 text-base font-semibold text-indigo-950 shadow-sm transition-colors hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                무료체험 알아보기{" "}
                <ArrowUpRight className="size-4 shrink-0" aria-hidden />
              </a>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}

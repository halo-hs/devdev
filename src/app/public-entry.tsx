import { useEffect, useState, type ReactNode } from "react"
import { ArrowRight, Building2, MapPin } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { CommonPublicLayout } from "@auth/layout"
import { CreditConversionPreview } from "@auth/components/trial-preview"
import { trialPreview } from "@auth/lib/trial-preview"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/components/ui/card"
import {
  CommonLoginPrototype,
  CommonSignupPrototype,
  CommonPasswordRecoveryPrototype,
  CommonTermsPrototype,
  CommonPrivacyPrototype,
  type CommonProduct,
  type CommonScreenKey,
} from "@auth/screens"
import { PublicSharePage } from "@share/public-link/page"
import { resetSnapSessionAccessCache } from "@snap/lib/snap-route-access"

// Public pages render with the entry bundle to avoid a full-screen loading flash.
import { TradeLanding } from "@landing/trade-os/page"
import { BrandStoryLanding } from "@landing/home/page"
import { SnapLanding } from "@landing/snap/page"
import { PricingLanding } from "@landing/pricing/page"
import { ContactLanding } from "@landing/contact/page"

const publicPaths: Partial<Record<CommonScreenKey, string>> = {
  login: "/login",
  signup: "/signup",
  "free-trial": "/free-trial",
  "password-recovery": "/password-recovery",
  terms: "/legal/terms",
  privacy: "/legal/privacy",
}

function publicScreen(pathname: string) {
  const path = pathname.replace(/\/+$/, "")
  const aliases: Record<string, CommonScreenKey> = {
    "/erp/login": "login",
    "/erp/signup": "signup",
    "/forgot-password": "password-recovery",
    "/trial": "free-trial",
    "/terms": "terms",
    "/privacy": "privacy",
  }
  return (
    aliases[path] ??
    (Object.entries(publicPaths).find(([, value]) => value === path)?.[0] as
      CommonScreenKey | undefined)
  )
}

function FreeTrial({
  onSelect,
}: {
  onSelect: (product: CommonProduct) => void
}) {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:py-20">
      <p className="font-semibold text-primary">ECOYA Platform</p>
      <h1 className="mt-4 text-3xl font-semibold">무료체험 시작하기</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        체험할 제품을 선택하세요. 계정을 만든 뒤 조직과 제품의 체험 가능 여부를
        확인합니다.
      </p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {(
          [
            [
              "erp",
              "ECOYA Trade OS",
              "무역 문서를 만들고 검토하며 거래와 연결하세요.",
              Building2,
            ],
            [
              "snap",
              "ECOYA SNAP",
              "현장의 사진과 작업 기록을 모아 리포트로 전달하세요.",
              MapPin,
            ],
          ] as const
        ).map(([product, name, description, Icon]) => (
          <Card key={product}>
            <CardHeader>
              <Icon className="mb-3 size-6 text-primary" />
              <CardTitle>{name}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                <dt className="text-muted-foreground">체험 기간</dt>
                <dd>기본 {trialPreview.days}일</dd>
                <dt className="text-muted-foreground">체험 일정</dt>
                <dd>관리자가 조정 가능</dd>
                <dt className="text-muted-foreground">총 제공 크레딧</dt>
                <dd>별도 설정 예정</dd>
              </dl>
              <Button className="w-full" onClick={() => onSelect(product)}>
                {product === "erp" ? "Trade OS" : "SNAP"} 가입하기{" "}
                <ArrowRight />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <p role="status" className="mt-6 text-sm leading-6 text-muted-foreground">
        기본 체험 기간은 14일이며 관리자가 체험 일정을 조정할 수 있습니다.
      </p>
      <div className="mt-6">
        <CreditConversionPreview />
      </div>
      <a
        className="mt-5 inline-block text-sm text-primary underline underline-offset-4"
        href="/login"
      >
        이미 계정이 있다면 로그인
      </a>
    </main>
  )
}

/** Public screens are isolated from the product shell and its data requests. */
export function CommonEntry({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState(
    () => window.location.pathname + window.location.search
  )
  useEffect(() => {
    const sync = () =>
      setLocation(window.location.pathname + window.location.search)
    window.addEventListener("popstate", sync)
    return () => window.removeEventListener("popstate", sync)
  }, [])
  const url = new URL(location, window.location.origin)
  if (url.pathname === "/share" || url.pathname.startsWith("/share/")) {
    const token = url.pathname.slice("/share/".length).replace(/\/+$/, "")
    return <PublicSharePage key={location} token={token} search={url.search} />
  }
  const landingPath = url.pathname.replace(/\/+$/, "") || "/"
  const Landing =
    landingPath === "/" || landingPath === "/brand-story"
      ? BrandStoryLanding
      : landingPath === "/trade-os" || landingPath === "/erp/landing"
        ? TradeLanding
        : landingPath === "/snap"
          ? SnapLanding
          : landingPath === "/pricing"
            ? PricingLanding
            : landingPath === "/contact"
              ? ContactLanding
              : null
  if (Landing) return <Landing key={landingPath} />
  const screen = publicScreen(url.pathname)
  if (!screen) return children

  const navigate = (next: CommonScreenKey, product?: CommonProduct) => {
    const nextPath = publicPaths[next]
    if (!nextPath) return
    const selectedProduct = product ?? url.searchParams.get("product")
    const keepProduct = ["login", "signup", "password-recovery"].includes(next)
    const query = new URLSearchParams()
    if (
      keepProduct &&
      (selectedProduct === "erp" || selectedProduct === "snap")
    ) {
      query.set("product", selectedProduct)
    }
    if (product) query.set("intent", "trial")
    const nextUrl = nextPath + (query.size ? `?${query.toString()}` : "")
    window.history.pushState({}, "", nextUrl)
    setLocation(nextUrl)
    window.scrollTo(0, 0)
  }
  const land = (product: CommonProduct) => {
    // This is the existing local preview session, never a production credential.
    if (product === "snap") {
      try {
        window.localStorage.setItem(
          "snap_web_session",
          JSON.stringify({
            authenticated: true,
            role: "manager",
            email: "ecoya@ecoya.kr",
            organization: "ECOYA Demo Co.",
          })
        )
      } catch {
        /* The product access guard will offer a retry. */
      }
      resetSnapSessionAccessCache()
    }
    const usageRequested = url.searchParams.get("returnTo") === "usage"
    window.location.assign(
      usageRequested
        ? `/erp/settings?section=${product === "erp" ? "trade-usage" : "snap-usage"}`
        : product === "erp"
          ? "/erp/home"
          : "/dashboard"
    )
  }
  const props = {
    onNavigate: navigate,
    onProductLanding: land,
    loginNotice:
      url.searchParams.get("returnTo") === "usage"
        ? "이용내역은 로그인 후 확인할 수 있습니다."
        : undefined,
    initialProduct:
      url.searchParams.get("product") === "snap"
        ? ("snap" as const)
        : ("erp" as const),
  }
  return (
    <div data-common-screen={screen}>
      <CommonPublicLayout
        sharedHeader
        homeHref={props.initialProduct === "erp" ? "/" : "/snap"}
        authVariant={
          screen === "login"
            ? "login"
            : screen === "signup"
              ? "signup"
              : screen === "password-recovery"
                ? "recovery"
                : undefined
        }
      >
        {screen === "login" && <CommonLoginPrototype {...props} />}
        {screen === "signup" && (
          <CommonSignupPrototype key={location} {...props} />
        )}
        {screen === "free-trial" && (
          <FreeTrial onSelect={(product) => navigate("signup", product)} />
        )}
        {screen === "password-recovery" && (
          <CommonPasswordRecoveryPrototype {...props} />
        )}
        {screen === "terms" && <CommonTermsPrototype {...props} />}
        {screen === "privacy" && <CommonPrivacyPrototype {...props} />}
      </CommonPublicLayout>
    </div>
  )
}

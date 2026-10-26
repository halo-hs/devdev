import { type ReactNode } from "react"
import {
  AlertCircle,
  CheckCircle2,
  CircleHelp,
} from "lucide-react"

import {
  authGridColumns,
  type AuthLayoutVariant,
} from "@auth/lib/authValidation"
import { cn } from "@/lib/utils"
import { AccountGuide, CommonPublicFooter } from "@auth/AuthCommonShell"

export type CommonScreenKey =
  | "login"
  | "signup"
  | "free-trial"
  | "password-recovery"
  | "terms"
  | "privacy"
  | "settings"
  | "organizations"
  | "members"

/** @deprecated Use CommonScreenKey for integration routing. */
export type CommonPrototypeRoute = CommonScreenKey

export type CommonAuthState =
  | "idle"
  | "submitting"
  | "authenticated"
  | "rejected"
  | "no-organization"
  | "pending-approval"
  | "provider-error"
  | "session-expired"
  | "network-error"
  | "page-error"
  | "rate-limited"

export type CommonInviteState =
  | "invited"
  | "accepted"
  | "pending_approval"
  | "active"
  | "revoked"
  | "expired"
  | "rejected"

export type CommonProduct = "erp" | "snap"

export interface CommonProductEntitlement {
  product: CommonProduct
  enabled: boolean
  status: "active" | "trial" | "past_due" | "not_purchased"
  role?: string
}

export interface CommonOrganization {
  id: string
  name: string
  membership: "active" | "pending" | "inactive"
  entitlements: CommonProductEntitlement[]
  isCurrent?: boolean
}

export interface CommonPrototypeScreenProps {
  onNavigate?: (route: CommonScreenKey) => void
  onProductLanding?: (product: CommonProduct) => void
  initialProduct?: CommonProduct
  loginNotice?: string
}

export type Feedback = {
  tone: "success" | "warning" | "error" | "info"
  title: string
  description: string
}

const toneClasses: Record<Feedback["tone"], string> = {
  success: "border-border bg-muted/60",
  warning: "border-border bg-muted/60",
  error: "border-destructive/30 bg-destructive/5",
  info: "border-border bg-muted/60",
}

const feedbackIcons: Record<Feedback["tone"], typeof CheckCircle2> = {
  success: CheckCircle2,
  warning: AlertCircle,
  error: AlertCircle,
  info: CircleHelp,
}

export function AuthSurface({
  variant,
  title,
  description,
  children,
  footer,
}: {
  variant: AuthLayoutVariant
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <main
      data-auth-layout={variant}
      className={cn(
        "auth-surface grid w-full flex-1 grid-cols-1",
        authGridColumns[variant]
      )}
    >
      <AccountGuide variant={variant} />
      <div className="order-1 flex min-w-0 flex-col bg-background lg:order-none">
        <section
          aria-label={title}
          className={cn(
            "flex min-w-0 flex-1 items-center justify-center px-5 py-10 sm:px-10 lg:px-16 lg:py-16",
            variant !== "recovery" && "items-start py-10 sm:py-[60px]",
            variant === "login" && "lg:pt-[139px]",
            variant === "signup" && "lg:pt-[71px]"
          )}
        >
          <div
            className={cn(
              "w-full max-w-md",
              variant !== "recovery" && "max-w-[440px]"
            )}
          >
            <h1
              className={cn(
                "text-2xl font-semibold tracking-tight sm:text-3xl",
                variant !== "recovery" &&
                  "text-center text-[26px] leading-9 font-bold sm:text-[26px]"
              )}
            >
              {title}
            </h1>
            {description && (
              <p
                className={cn(
                  "mt-3 text-base leading-7 text-muted-foreground",
                  variant === "signup" &&
                    "mt-2 text-center text-[15px] leading-6 text-[var(--color-gray-4)]",
                  variant === "login" &&
                    "mt-8 text-center text-[17px] leading-6"
                )}
              >
                {description}
              </p>
            )}
            <div
              className={cn(
                "mt-8",
                variant === "signup" && "mt-[22px] flex flex-col",
                variant === "login" && "mt-8"
              )}
            >
              {children}
            </div>
            {footer ? (
              <div
                className={cn(
                  "mt-7 flex flex-col gap-3 border-t pt-6",
                  variant === "login" && "mt-8 border-0 pt-0"
                )}
              >
                {footer}
              </div>
            ) : null}
          </div>
        </section>
        <CommonPublicFooter compact />
      </div>
    </main>
  )
}

export function AuthDivider() {
  return (
    <div className="flex items-center gap-3.5 text-[11px] leading-4 text-[var(--color-gray-6)]">
      <span className="h-px flex-1 bg-[var(--color-gray-10)]" aria-hidden="true" />
      또는
      <span className="h-px flex-1 bg-[var(--color-gray-10)]" aria-hidden="true" />
    </div>
  )
}

export function InlineFeedback({ feedback }: { feedback: Feedback }) {
  const Icon = feedbackIcons[feedback.tone]
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border p-3",
        toneClasses[feedback.tone]
      )}
      role={feedback.tone === "error" ? "alert" : "status"}
    >
      <Icon className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-base font-semibold">{feedback.title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {feedback.description}
        </p>
      </div>
    </div>
  )
}

/** @deprecated Use CommonPlatformPrototype as the integration entry point. */

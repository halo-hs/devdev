import { useId, type ReactNode } from "react"
import { Sparkles } from "lucide-react"

import { cn } from "@shared/lib/utils"

type BusinessPageHeroProps = {
  title: ReactNode
  description?: ReactNode
  eyebrow?: ReactNode
  actions?: ReactNode
  leading?: ReactNode
  controls?: ReactNode
  summary?: ReactNode
  align?: "start" | "center"
  titleClassName?: string
  descriptionClassName?: string
  className?: string
  variant?: "default" | "ai"
  compact?: boolean
}

export function BusinessPageHero({
  title,
  description,
  eyebrow,
  actions,
  leading,
  controls,
  summary,
  align = "start",
  titleClassName,
  descriptionClassName,
  className,
  variant = "default",
  compact = false,
}: BusinessPageHeroProps) {
  const generatedTitleId = useId()

  return (
    <section
      data-slot="business-page-hero"
      aria-labelledby={generatedTitleId}
      className={cn("relative", className)}
    >
      <div
        className={cn(
          "relative isolate overflow-hidden rounded-[var(--ui-radius-panel)] text-white shadow-[var(--ui-shadow-panel)]",
          compact ? "px-5 pt-4" : "px-5 pt-5 sm:px-6 sm:pt-6",
          variant === "ai"
            ? "[background-image:var(--ui-ai-hero-background)]"
            : "bg-[linear-gradient(118deg,var(--color-primary-1)_0%,var(--color-primary-5)_100%)]",
          "business-hero-controls",
          summary
            ? compact
              ? "pb-10 sm:pb-11"
              : "pb-16 sm:pb-20"
            : compact
              ? "pb-4"
              : "pb-5 sm:pb-6"
        )}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full border-[42px] border-white/5"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[12%] -bottom-24 size-52 rotate-12 rounded-[38%] border-[28px] border-white/4"
        />

        <header
          className={cn(
            "relative z-10 flex items-start justify-between gap-5",
            compact ? "min-h-12" : "min-h-16",
            align === "center" && "justify-center text-center"
          )}
        >
          <div className="flex min-w-0 items-start gap-3">
            {variant === "ai" ? (
              <div
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-[var(--r-lg)] border border-white/20 bg-white/10 shadow-sm",
                  compact ? "size-10" : "size-12"
                )}
              >
                <Sparkles
                  className={compact ? "size-6" : "size-8"}
                  strokeWidth={1.8}
                />
              </div>
            ) : leading ? (
              <div className="shrink-0">{leading}</div>
            ) : null}
            <div
              className={cn(
                "min-w-0",
                align === "center" && "flex flex-col items-center"
              )}
            >
              {eyebrow ? (
                <div className="mb-1 text-xs font-semibold text-white/75">
                  {eyebrow}
                </div>
              ) : null}
              <h1
                id={generatedTitleId}
                className={cn(
                  "text-2xl font-semibold tracking-normal",
                  titleClassName
                )}
              >
                {title}
              </h1>
              {description ? (
                <p
                  className={cn(
                    "max-w-3xl text-sm leading-6 text-white/75",
                    compact ? "mt-1" : "mt-2",
                    align === "center" && "mx-auto",
                    descriptionClassName
                  )}
                >
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          ) : null}
        </header>

        {controls ? (
          <div className={cn("relative z-10", compact ? "mt-3" : "mt-5")}>
            {controls}
          </div>
        ) : null}
      </div>

      {summary ? (
        <div
          className={cn(
            "relative z-20 mx-3",
            compact ? "-mt-6" : "-mt-10 sm:mx-4 sm:-mt-12"
          )}
        >
          {summary}
        </div>
      ) : null}
    </section>
  )
}

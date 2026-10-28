import { useId, type ReactNode } from "react"
import { Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"

// Outline buttons on the blue hero: translucent white instead of the white fill.
export const heroOutlineButtonClass =
  "border-white/25 bg-white/10 text-white shadow-none hover:border-white/50 hover:bg-white/15 hover:text-white active:border-white/50 active:bg-white/20 active:text-white"

type HeroBannerProps = {
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

export function HeroBanner({
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
}: HeroBannerProps) {
  const generatedTitleId = useId()

  return (
    <section
      data-slot="business-page-hero"
      aria-labelledby={generatedTitleId}
      className={cn("relative", className)}
    >
      <div
        className={cn(
          // Figma HeroBanner type=controls (5806:59130): radius 22, no elevation.
          "relative isolate overflow-hidden rounded-[22px] text-white",
          compact ? "px-5 pt-4" : "px-5 pt-5 sm:px-[30px] sm:pt-[26px]",
          variant === "ai"
            ? "[background-image:var(--ui-ai-hero-background)]"
            : "bg-[linear-gradient(120deg,#1d4ed8_0%,#2563eb_52%,#3b82f6_100%)]",
          "business-hero-controls",
          summary
            ? compact
              ? "pb-10 sm:pb-11"
              : "pb-16 sm:pb-20"
            : compact
              ? "pb-4"
              : "pb-5"
        )}
      >
        <header
          className={cn(
            "relative z-10 flex items-start justify-between gap-5 max-sm:flex-col max-sm:gap-3",
            compact && "min-h-12",
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
                  "text-xl font-bold tracking-normal",
                  titleClassName
                )}
              >
                {title}
              </h1>
              {description ? (
                <p
                  className={cn(
                    "max-w-3xl text-base text-white",
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
          <div className={cn("relative z-10", compact ? "mt-3" : "mt-[13px]")}>
            {controls}
          </div>
        ) : null}
      </div>

      {summary ? (
        <div
          className={cn(
            "relative z-20 mx-3",
            compact ? "-mt-6" : "-mt-10 sm:mx-4 sm:-mt-14"
          )}
        >
          {summary}
        </div>
      ) : null}
    </section>
  )
}

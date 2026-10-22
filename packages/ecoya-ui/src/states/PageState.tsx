import type { PropsWithChildren, ReactNode } from "react"

import { cn } from "../lib/cn"

export type PageStateTone =
  | "loading"
  | "empty"
  | "error"
  | "forbidden"
  | "expired"

export type PageStateProps = PropsWithChildren<{
  action?: ReactNode
  className?: string
  description?: ReactNode
  title: ReactNode
  tone?: PageStateTone
}>

export function PageState({
  action,
  children,
  className,
  description,
  title,
  tone = "empty",
}: PageStateProps) {
  const attention = tone === "error" || tone === "forbidden"

  return (
    <section
      aria-live={tone === "loading" ? "polite" : undefined}
      data-ui-state={tone}
      className={cn(
        "flex min-h-48 flex-col items-center justify-center gap-2 p-6 text-center",
        attention ? "text-destructive" : "text-muted-foreground",
        className
      )}
    >
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {description ? <p className="max-w-md text-sm">{description}</p> : null}
      {children}
      {action ? <div className="mt-2">{action}</div> : null}
    </section>
  )
}

import { CircleAlert, LoaderCircle } from "lucide-react"

import { cn } from "@shared/lib/utils"

export type AutoSaveStatusState = "saved" | "saving" | "pending" | "error"

function formatSavedTime(savedAt: Date | string | null | undefined) {
  if (!savedAt) return ""
  if (typeof savedAt === "string") return savedAt

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(savedAt)
}

function AutoSaveStatus({
  state,
  savedAt,
  className,
}: {
  state: AutoSaveStatusState
  savedAt?: Date | string | null
  className?: string
}) {
  const savedTime = formatSavedTime(savedAt)
  const label =
    state === "saving"
      ? "자동 저장 중"
      : state === "pending"
        ? "자동 저장 대기"
        : state === "error"
          ? "자동 저장 실패"
          : `자동 저장됨${savedTime ? ` ${savedTime}` : ""}`

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-1 text-[11px] text-[var(--surface-muted-foreground)]",
        state === "error" && "text-destructive",
        className
      )}
      role={state === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {state === "saving" ? (
        <LoaderCircle aria-hidden className="size-3.5 animate-spin" />
      ) : state === "error" ? (
        <CircleAlert aria-hidden className="size-3.5" />
      ) : (
        <span
          aria-hidden
          className={cn(
            "size-1.5 rounded-[var(--r-pill)]",
            state === "saved" ? "bg-success" : "bg-warning"
          )}
        />
      )}
      {label}
    </span>
  )
}

export { AutoSaveStatus }

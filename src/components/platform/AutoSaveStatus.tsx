import { cn } from "@/lib/utils"

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
        "inline-flex items-center gap-2 px-1 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-[var(--color-gray-4)]",
        state === "error" && "text-[var(--color-red-2)]",
        className
      )}
      role={state === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {/* Figma SaveStatus (2364:18687): one 7px dot per state. */}
      <span
        aria-hidden
        className={cn(
          "size-[7px] shrink-0 rounded-[var(--r-pill)]",
          {
            saving: "bg-[var(--color-gray-6)]",
            saved: "bg-[var(--color-green-2)]",
            error: "bg-[var(--color-red-2)]",
            pending: "bg-[var(--color-orange-2)]",
          }[state]
        )}
      />
      {label}
    </span>
  )
}

export { AutoSaveStatus }

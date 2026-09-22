import * as React from "react"

import { cn } from "@ecoya/design-system/lib/utils"

export interface InputTimerProps extends Omit<
  React.ComponentPropsWithoutRef<"time">,
  "children" | "dateTime"
> {
  seconds: number
  disabled?: boolean
  showSuffix?: boolean
  suffix?: React.ReactNode
}

function normalizeSeconds(seconds: number) {
  return Number.isFinite(seconds) ? Math.max(0, Math.trunc(seconds)) : 0
}

export function formatDuration(seconds: number) {
  const normalizedSeconds = normalizeSeconds(seconds)
  const hours = Math.floor(normalizedSeconds / 3600)
  const minutes = Math.floor((normalizedSeconds % 3600) / 60)
  const remainingSeconds = normalizedSeconds % 60
  const minuteText = String(minutes).padStart(2, "0")
  const secondText = String(remainingSeconds).padStart(2, "0")

  if (hours === 0) return `${minuteText}:${secondText}`
  return `${String(hours).padStart(2, "0")}:${minuteText}:${secondText}`
}

function getDurationLabel(seconds: number) {
  const normalizedSeconds = normalizeSeconds(seconds)
  const hours = Math.floor(normalizedSeconds / 3600)
  const minutes = Math.floor((normalizedSeconds % 3600) / 60)
  const remainingSeconds = normalizedSeconds % 60
  const parts: string[] = []

  if (hours > 0) parts.push(`${hours}시간`)
  if (minutes > 0) parts.push(`${minutes}분`)
  if (remainingSeconds > 0 || parts.length === 0) {
    parts.push(`${remainingSeconds}초`)
  }

  return parts.join(" ")
}

function InputTimer({
  seconds,
  disabled = false,
  showSuffix = false,
  suffix,
  className,
  role = "timer",
  "aria-label": ariaLabel,
  "aria-live": ariaLive = "off",
  ...props
}: InputTimerProps) {
  const normalizedSeconds = normalizeSeconds(seconds)
  const renderedSuffix = suffix ?? (showSuffix ? " sec" : null)

  return (
    <time
      {...props}
      role={role}
      dateTime={`PT${normalizedSeconds}S`}
      aria-label={ariaLabel ?? getDurationLabel(normalizedSeconds)}
      aria-live={ariaLive}
      aria-disabled={disabled || undefined}
      data-slot="input-timer"
      data-disabled={disabled || undefined}
      className={cn(
        "text-sm font-medium tabular-nums",
        disabled ? "text-muted-foreground" : "text-destructive",
        className
      )}
    >
      {formatDuration(normalizedSeconds)}
      {renderedSuffix}
    </time>
  )
}

export { InputTimer }
export default InputTimer

import * as React from "react"

import { cn } from "@ecoya/design-system/lib/utils"

export type LoadingDotsSize = "lg" | "md" | "sm"
export type LoadingDotsTone = "current" | "destructive" | "muted" | "primary"

export interface LoadingDotsProps extends Omit<
  React.ComponentProps<"span">,
  "children"
> {
  label?: string
  size?: LoadingDotsSize
  tone?: LoadingDotsTone
}

const sizeStyles: Record<LoadingDotsSize, { container: string; dot: string }> =
  {
    sm: { container: "gap-0.5", dot: "size-1" },
    md: { container: "gap-1", dot: "size-1.5" },
    lg: { container: "gap-1.5", dot: "size-2" },
  }

const toneStyles: Record<LoadingDotsTone, string> = {
  current: "text-current",
  destructive: "text-destructive",
  muted: "text-muted-foreground",
  primary: "text-primary",
}

function LoadingDots({
  label = "불러오는 중",
  size = "md",
  tone = "primary",
  className,
  role = "status",
  "aria-label": ariaLabel,
  "aria-live": ariaLive = "polite",
  "aria-atomic": ariaAtomic = true,
  "aria-busy": ariaBusy = true,
  ...props
}: LoadingDotsProps) {
  const styles = sizeStyles[size]

  return (
    <span
      {...props}
      role={role}
      aria-label={ariaLabel ?? label}
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
      aria-busy={ariaBusy}
      data-size={size}
      data-tone={tone}
      className={cn(
        "inline-flex items-center align-middle",
        styles.container,
        toneStyles[tone],
        className
      )}
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          aria-hidden="true"
          className={cn("animate-bounce rounded-full bg-current", styles.dot)}
          style={{ animationDelay: `${index * 150}ms` }}
        />
      ))}
    </span>
  )
}

export { LoadingDots }

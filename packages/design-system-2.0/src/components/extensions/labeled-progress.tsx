import * as React from "react"

import { Progress } from "@ecoya/design-system/ui/progress"
import { cn } from "@ecoya/design-system/lib/utils"

export interface LabeledProgressProps extends Omit<
  React.ComponentProps<typeof Progress>,
  "className" | "value"
> {
  value: number
  icon?: React.ReactNode
  showPercentage?: boolean
  /** Legacy-compatible alias for `showPercentage`. */
  showText?: boolean
  width?: number | string
  className?: string
  progressClassName?: string
  percentageFormatter?: (value: number) => React.ReactNode
}

function clampProgressValue(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(value, 0), 100)
}

function toCssWidth(width: number | string | undefined) {
  if (typeof width === "number") return `${width}px`
  return width
}

function LabeledProgress({
  value,
  icon,
  showPercentage,
  showText,
  width,
  className,
  progressClassName,
  percentageFormatter = (currentValue) => `${Math.round(currentValue)}%`,
  style,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-valuetext": ariaValueText,
  ...progressProps
}: LabeledProgressProps) {
  const clampedValue = clampProgressValue(value)
  const visiblePercentage = showPercentage ?? showText ?? true
  const percentage = percentageFormatter(clampedValue)

  return (
    <div
      data-slot="labeled-progress"
      className={cn("flex items-center gap-2", className)}
    >
      {icon && (
        <span
          data-slot="labeled-progress-icon"
          aria-hidden="true"
          className="inline-flex size-4 shrink-0 items-center justify-center [&_svg]:size-full"
        >
          {icon}
        </span>
      )}

      <Progress
        {...progressProps}
        value={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clampedValue}
        aria-label={ariaLabelledBy ? ariaLabel : (ariaLabel ?? "Progress")}
        aria-labelledby={ariaLabelledBy}
        aria-valuetext={ariaValueText ?? `${Math.round(clampedValue)}%`}
        className={progressClassName}
        style={{ width: toCssWidth(width), ...style }}
      />

      {visiblePercentage && (
        <span
          data-slot="labeled-progress-percentage"
          aria-hidden="true"
          className="typo-b10r shrink-0 whitespace-nowrap text-primary"
        >
          {percentage}
        </span>
      )}
    </div>
  )
}

export { LabeledProgress }

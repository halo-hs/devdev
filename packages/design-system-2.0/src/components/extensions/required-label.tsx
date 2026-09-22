"use client"

import * as React from "react"

import { FieldLabel } from "@ecoya/design-system/ui/field"
import { cn } from "@ecoya/design-system/lib/utils"

export interface RequiredLabelProps extends React.ComponentPropsWithoutRef<
  typeof FieldLabel
> {
  /** Shows a visual required marker. Set `required` on the control as well. */
  required?: boolean
  /** Custom visual marker. It is always hidden from assistive technology. */
  marker?: React.ReactNode
  markerClassName?: string
  /** Standalone disabled styling; prefer `data-disabled` on the parent Field. */
  disabled?: boolean
}

const RequiredLabel = React.forwardRef<
  React.ElementRef<typeof FieldLabel>,
  RequiredLabelProps
>(function RequiredLabel(
  {
    required = false,
    marker = "*",
    markerClassName,
    disabled = false,
    children,
    className,
    ...labelProps
  },
  ref
) {
  return (
    <FieldLabel
      {...labelProps}
      ref={ref}
      data-required={required || undefined}
      data-disabled={disabled || undefined}
      className={cn(
        "gap-1",
        disabled &&
          "pointer-events-none text-[var(--control-disabled-foreground)] opacity-100",
        className
      )}
    >
      {children}
      {required && marker != null ? (
        <span
          data-slot="required-label-marker"
          aria-hidden="true"
          className={cn(
            "text-destructive",
            disabled && "text-[var(--control-disabled-foreground)]",
            markerClassName
          )}
        >
          {marker}
        </span>
      ) : null}
    </FieldLabel>
  )
})

RequiredLabel.displayName = "RequiredLabel"

export { RequiredLabel }

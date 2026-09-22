"use client"

import * as React from "react"

import { Spinner } from "@ecoya/design-system/ui/spinner"
import { Switch } from "@ecoya/design-system/ui/switch"
import { cn } from "@ecoya/design-system/lib/utils"

export interface BusySwitchProps extends React.ComponentPropsWithoutRef<
  typeof Switch
> {
  loading?: boolean
  loadingLabel?: string
  containerClassName?: string
}

const BusySwitch = React.forwardRef<
  React.ElementRef<typeof Switch>,
  BusySwitchProps
>(function BusySwitch(
  {
    loading = false,
    loadingLabel = "처리 중",
    containerClassName,
    disabled,
    "aria-busy": ariaBusy,
    ...props
  },
  ref
) {
  return (
    <span
      data-slot="busy-switch"
      data-loading={loading || undefined}
      className={cn("inline-flex items-center gap-2", containerClassName)}
    >
      <Switch
        {...props}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading ? true : ariaBusy}
      />
      {loading ? <Spinner aria-label={loadingLabel} /> : null}
    </span>
  )
})

export { BusySwitch }

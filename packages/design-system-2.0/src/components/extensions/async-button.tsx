"use client"

import * as React from "react"

import { Button } from "@ecoya/design-system/ui/button"
import { Spinner } from "@ecoya/design-system/ui/spinner"
import { cn } from "@ecoya/design-system/lib/utils"

type ButtonProps = Omit<
  React.ComponentPropsWithoutRef<typeof Button>,
  "asChild"
>

export interface AsyncButtonProps extends ButtonProps {
  /** Prevents activation and exposes the button as busy while work is pending. */
  loading?: boolean
  /** Accessible description for the pending state. */
  loadingLabel?: string
  /** Visual pending content. Defaults to the official Spinner. */
  loadingContent?: React.ReactNode
}

/**
 * A native async action composed from the official Button and Spinner.
 *
 * In an AlertDialog, render this button directly inside AlertDialogFooter.
 * Do not wrap it with AlertDialogAction: that primitive closes the dialog as
 * soon as it is activated, before an asynchronous confirmation can settle.
 */
const AsyncButton = React.forwardRef<HTMLButtonElement, AsyncButtonProps>(
  function AsyncButton(
    {
      loading = false,
      loadingLabel = "Loading",
      loadingContent,
      disabled = false,
      children,
      className,
      size = "default",
      onClick,
      "aria-busy": ariaBusy,
      "aria-description": ariaDescription,
      ...buttonProps
    },
    ref
  ) {
    const isDisabled = disabled || loading
    const resolvedDescription = loading
      ? [ariaDescription, loadingLabel].filter(Boolean).join(" ")
      : ariaDescription
    const spinnerSizeClass =
      size === "xs" || size === "icon-xs"
        ? "size-[var(--button-spinner-size-xs)]"
        : size === "lg" || size === "icon-lg"
          ? "size-[var(--button-spinner-size-md)]"
          : "size-[var(--button-spinner-size-sm)]"

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) {
        event.preventDefault()
        event.stopPropagation()
        return
      }

      onClick?.(event)
    }

    return (
      <Button
        {...buttonProps}
        ref={ref}
        asChild={false}
        size={size}
        disabled={isDisabled}
        aria-busy={loading ? true : ariaBusy}
        aria-description={resolvedDescription || undefined}
        data-loading={loading || undefined}
        className={cn("relative", loading && "cursor-wait", className)}
        onClick={handleClick}
      >
        {loading ? (
          <>
            <span
              data-slot="async-button-content"
              className="inline-flex items-center justify-center gap-[inherit] opacity-0"
            >
              {children}
            </span>
            <span
              data-slot="async-button-loading-content"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1.5"
            >
              {loadingContent ?? (
                <Spinner
                  data-icon="inline-start"
                  aria-hidden="true"
                  className={spinnerSizeClass}
                />
              )}
            </span>
          </>
        ) : (
          children
        )}
      </Button>
    )
  }
)

AsyncButton.displayName = "AsyncButton"

export { AsyncButton }

"use client"

import * as React from "react"
import { XIcon } from "lucide-react"

import { Button } from "@ecoya/design-system/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ecoya/design-system/ui/tabs"
import { cn } from "@ecoya/design-system/lib/utils"

type CloseButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "aria-label" | "children" | "onClick" | "type"
>

export interface ClosableTabsTriggerProps extends React.ComponentPropsWithoutRef<
  typeof TabsTrigger
> {
  onClose?: (value: string, event: React.MouseEvent<HTMLButtonElement>) => void
  closeLabel?: string
  closeButtonProps?: CloseButtonProps
}

const ClosableTabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsTrigger>,
  ClosableTabsTriggerProps
>(
  (
    {
      value,
      children,
      disabled,
      onClose,
      closeLabel,
      closeButtonProps,
      className,
      ...triggerProps
    },
    ref
  ) => {
    const {
      className: closeButtonClassName,
      disabled: closeButtonDisabled,
      size: closeButtonSize,
      variant: closeButtonVariant,
      ...resolvedCloseButtonProps
    } = closeButtonProps ?? {}

    return (
      <div
        data-slot="closable-tabs-trigger"
        role="presentation"
        className="relative inline-flex min-w-0 items-center"
      >
        <TabsTrigger
          ref={ref}
          value={value}
          disabled={disabled}
          className={cn(onClose && "pr-7", className)}
          {...triggerProps}
        >
          {children}
        </TabsTrigger>

        {onClose && (
          <Button
            {...resolvedCloseButtonProps}
            type="button"
            variant={closeButtonVariant ?? "ghost"}
            size={closeButtonSize ?? "icon-xs"}
            disabled={closeButtonDisabled ?? disabled}
            aria-label={closeLabel ?? `${value} 탭 닫기`}
            className={cn(
              "absolute top-1/2 right-0.5 -translate-y-1/2 text-[var(--control-clear-foreground)] hover:text-[var(--control-clear-foreground-hover)] active:text-[var(--control-clear-foreground-hover)] disabled:text-[var(--control-disabled-foreground)]",
              closeButtonClassName
            )}
            onClick={(event) => {
              event.stopPropagation()
              onClose(value, event)
            }}
          >
            <XIcon aria-hidden="true" />
          </Button>
        )}
      </div>
    )
  }
)

ClosableTabsTrigger.displayName = "ClosableTabsTrigger"

const ClosableTabs = Tabs
const ClosableTabsList = TabsList
const ClosableTabsContent = TabsContent

export {
  ClosableTabs,
  ClosableTabsContent,
  ClosableTabsList,
  ClosableTabsTrigger,
}

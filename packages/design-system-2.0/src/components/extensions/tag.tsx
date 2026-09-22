"use client"

import * as React from "react"
import { XIcon } from "lucide-react"

import { Badge } from "@ecoya/design-system/ui/badge"
import { Button } from "@ecoya/design-system/ui/button"
import { cn } from "@ecoya/design-system/lib/utils"

export interface TagProps extends Omit<
  React.ComponentPropsWithoutRef<typeof Badge>,
  "asChild" | "children"
> {
  children?: React.ReactNode
  label?: React.ReactNode
  onRemove?: () => void
  disabled?: boolean
  invalid?: boolean
  /** @deprecated Use disabled. */
  isDisabled?: boolean
  /** @deprecated Use invalid. */
  isValid?: boolean
  removeLabel?: string
}

const Tag = React.forwardRef<React.ElementRef<typeof Badge>, TagProps>(
  function Tag(
    {
      children,
      label,
      onRemove,
      disabled = false,
      invalid,
      isDisabled = false,
      isValid,
      removeLabel,
      variant,
      className,
      ...props
    },
    ref
  ) {
    const content = children ?? label
    const isTagDisabled = disabled || isDisabled
    const isTagInvalid = invalid ?? isValid === false
    const accessibleRemoveLabel =
      removeLabel ??
      (typeof content === "string" ? `${content} 삭제` : "태그 삭제")

    return (
      <Badge
        ref={ref}
        {...props}
        variant={variant ?? (isTagInvalid ? "destructive" : "secondary")}
        aria-disabled={isTagDisabled || undefined}
        aria-invalid={isTagInvalid || undefined}
        data-slot="tag"
        data-disabled={isTagDisabled || undefined}
        data-invalid={isTagInvalid || undefined}
        className={cn(
          "h-[var(--control-size-xs)] gap-0.5 py-0 pr-0.5 pl-2 shadow-[var(--shadow-tag-valid)] data-[disabled=true]:bg-[var(--control-disabled-background)]! data-[disabled=true]:text-[var(--control-disabled-foreground)]! data-[disabled=true]:shadow-[var(--shadow-tag-disabled)]! data-[invalid=true]:shadow-[var(--shadow-tag-invalid)]",
          className
        )}
      >
        <span className="min-w-0 truncate">{content}</span>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={isTagDisabled}
            aria-label={accessibleRemoveLabel}
            className="bg-transparent! text-current! shadow-none! hover:bg-transparent! hover:text-current! active:bg-transparent! disabled:bg-transparent! disabled:text-current!"
            onPointerDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}
            onClick={(event) => {
              event.stopPropagation()
              onRemove()
            }}
          >
            <XIcon aria-hidden="true" />
          </Button>
        )}
      </Badge>
    )
  }
)

Tag.displayName = "Tag"

export { Tag }
export default Tag

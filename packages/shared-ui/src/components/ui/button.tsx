import type { ComponentProps } from "react"
import {
  Button as DesignSystemButton,
  buttonVariants as designSystemButtonVariants,
} from "@ecoya/design-system/ui/button"

import { cn } from "@shared/lib/utils"

type ButtonProps = ComponentProps<typeof DesignSystemButton>

// Figma Button state colors extend the shared primitive's existing behavior,
// ref and asChild contracts. Call-site classes remain the last override.
const colorStates = {
  default: "disabled:border-[var(--button-filled-disabled-border)]",
  secondary:
    "border-[var(--button-secondary-border)] hover:border-[var(--button-secondary-border-hover)] hover:text-[var(--button-secondary-foreground-hover)] active:border-[var(--button-secondary-border-active)] active:text-[var(--button-secondary-foreground-active)] disabled:border-[var(--button-filled-disabled-border)]",
  outline:
    "hover:border-[var(--button-outline-border-hover)] hover:text-[var(--button-outline-foreground-hover)] active:border-[var(--button-outline-border-active)] disabled:border-[var(--button-outline-disabled-border)]",
  destructive: "disabled:border-[var(--button-filled-disabled-border)]",
  ghost: "",
  link: "hover:decoration-2 active:underline active:decoration-2",
} as const


// Match the label/icon variants in Figma; sm remains a compatibility alias.
const sizeStyles = {
  default: "text-[length:var(--text-body-sm)] leading-[var(--leading-body-sm)] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
  sm: "text-[length:var(--text-body-sm)] leading-[var(--leading-body-sm)] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
  xs: "gap-1 text-[length:var(--text-caption)] leading-[var(--leading-caption)] [&_svg:not([class*='size-'])]:size-3.5",
  lg: "gap-1.5 rounded-[10px] text-[length:var(--text-body-md)] leading-[var(--leading-body-md)] has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5 has-data-[icon=inline-end]:gap-1 has-data-[icon=inline-start]:gap-1 [&_svg:not([class*='size-'])]:size-5",
  icon: "[&_svg:not([class*='size-'])]:size-[18px]",
  "icon-sm": "[&_svg:not([class*='size-'])]:size-[18px]",
  "icon-xs": "[&_svg:not([class*='size-'])]:size-4",
  "icon-lg": "rounded-[10px] [&_svg:not([class*='size-'])]:size-5",
} as const

function buttonVariants(options: Parameters<typeof designSystemButtonVariants>[0] = {}) {
  const { className, class: classValue, ...variants } = options
  return cn(
    designSystemButtonVariants(variants),
    "font-normal",
    colorStates[variants.variant ?? "default"],
    sizeStyles[variants.size ?? "default"],
    classValue,
    className,
  )
}

function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
  return (
    <DesignSystemButton
      {...props}
      variant={variant}
      size={size}
      className={cn("font-normal", colorStates[variant ?? "default"], sizeStyles[size ?? "default"], className)}
    />
  )
}

export { Button, buttonVariants }

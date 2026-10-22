import type { ComponentProps } from "react"
import {
  Button as DesignSystemButton,
  buttonVariants as designSystemButtonVariants,
} from "@/components/ds2/ui/Button"

import { cn } from "@/lib/utils"

type ButtonProps = ComponentProps<typeof DesignSystemButton>

// Figma Button state colors extend the shared primitive's existing behavior,
// ref and asChild contracts. Call-site classes remain the last override.
const colorStates = {
  default:
    "border-[var(--button-primary-background)] active:border-[var(--button-primary-background-active)] disabled:border-[var(--color-gray-9)]",
  secondary:
    "border-[var(--color-primary-8)] hover:border-[var(--color-primary-7)] hover:text-[var(--color-primary-3)] active:border-[var(--color-primary-6)] active:text-[var(--color-primary-2)] disabled:border-[var(--color-gray-9)]",
  outline: "active:border-[var(--color-gray-8)] disabled:border-[var(--color-gray-9)]",
  destructive:
    "border-[var(--button-destructive-background)] active:border-[var(--button-destructive-background-active)] disabled:border-[var(--color-gray-9)]",
  ghost: "",
  link: "hover:decoration-2 active:underline active:decoration-2",
} as const


// Match the label/icon variants in Figma; sm remains a compatibility alias.
const sizeStyles = {
  default: "text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
  sm: "text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
  xs: "gap-1 text-[length:var(--text-body-11)] leading-[var(--leading-body-11)] [&_svg:not([class*='size-'])]:size-3.5",
  lg: "gap-1.5 rounded-[10px] text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5 has-data-[icon=inline-end]:gap-1 has-data-[icon=inline-start]:gap-1 [&_svg:not([class*='size-'])]:size-5",
  icon: "[&_svg:not([class*='size-'])]:size-[18px]",
  "icon-sm": "[&_svg:not([class*='size-'])]:size-[18px]",
  "icon-xs": "[&_svg:not([class*='size-'])]:size-4",
  "icon-lg": "rounded-[10px] [&_svg:not([class*='size-'])]:size-5",
} as const

// Figma link button (3419:63906) is the label alone, without side padding.
const linkPadding = "px-0 has-data-[icon=inline-end]:pr-0 has-data-[icon=inline-start]:pl-0"

function buttonVariants(options: Parameters<typeof designSystemButtonVariants>[0] = {}) {
  const { className, class: classValue, ...variants } = options
  return cn(
    designSystemButtonVariants(variants),
    "font-normal",
    colorStates[variants.variant ?? "default"],
    sizeStyles[variants.size ?? "default"],
    variants.variant === "link" && linkPadding,
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
      className={cn("font-normal", colorStates[variant ?? "default"], sizeStyles[size ?? "default"], variant === "link" && linkPadding, className)}
    />
  )
}

export { Button, buttonVariants }

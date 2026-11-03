import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

// `outline` remains the app's neutral action for existing consumers.
// Figma's blue outline is exposed as `outline-primary` in this same component.
const neutralButtonClasses =
  "border-[var(--button-outline-border)] bg-[var(--button-outline-background)] text-[var(--button-outline-foreground)] shadow-[var(--shadow-btn-tertiary-black)] hover:bg-[var(--button-outline-background-hover)] hover:text-[var(--button-outline-foreground)] hover:shadow-[var(--shadow-btn-tertiary-black-hover)] active:bg-[var(--button-outline-background-active)] active:text-[var(--button-outline-foreground-active)] active:shadow-[var(--shadow-btn-tertiary-black-pressed)] disabled:bg-[var(--button-outline-disabled-background)] disabled:text-[var(--button-outline-disabled-foreground)] disabled:shadow-[var(--shadow-btn-tertiary-black-disabled)] aria-expanded:bg-[var(--button-outline-background-hover)] aria-expanded:text-[var(--button-outline-foreground)] active:border-[var(--color-gray-8)] disabled:border-[var(--color-gray-9)]"

const baseButtonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[var(--r-md)] border border-transparent bg-clip-padding text-[length:var(--text-button-3)] leading-[var(--leading-button-3)] font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-transparent focus-visible:[box-shadow:var(--shadow-input-focused)] active:not-aria-[haspopup]:translate-y-px active:focus-visible:border-transparent active:focus-visible:[box-shadow:var(--shadow-input-focused)] disabled:pointer-events-none aria-invalid:border-[var(--control-invalid-border)] aria-invalid:focus-visible:border-transparent aria-invalid:focus-visible:[box-shadow:var(--shadow-input-invalid-focused)] aria-invalid:active:focus-visible:border-transparent aria-invalid:active:focus-visible:[box-shadow:var(--shadow-input-invalid-focused)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--button-primary-background)] text-[var(--button-primary-foreground)] shadow-[var(--shadow-btn-primary-blue)] hover:bg-[var(--button-primary-background-hover)] hover:shadow-[var(--shadow-btn-primary-blue-hover)] active:bg-[var(--button-primary-background-active)] active:shadow-[var(--shadow-btn-primary-blue-pressed)] disabled:bg-[var(--button-primary-disabled-background)] disabled:text-[var(--button-primary-disabled-foreground)] disabled:shadow-[var(--shadow-btn-primary-blue-disabled)]",
        outline: neutralButtonClasses,
        neutral: neutralButtonClasses,
        "outline-primary":
          "border-[var(--color-primary-4)] bg-transparent text-[var(--color-primary-4)] shadow-none hover:border-[var(--color-primary-3)] hover:text-[var(--color-primary-3)] active:border-[var(--color-primary-2)] active:bg-[var(--color-primary-10)] active:text-[var(--color-primary-2)] disabled:border-[var(--color-gray-8)] disabled:bg-transparent disabled:text-[var(--color-gray-6)] aria-expanded:bg-[var(--color-primary-10)]",
        "ghost-neutral":
          "bg-transparent text-[var(--color-gray-4)] shadow-none hover:bg-[color-mix(in_srgb,var(--color-gray-2)_6%,transparent)] hover:text-[var(--color-gray-2)] active:bg-[color-mix(in_srgb,var(--color-gray-2)_10%,transparent)] active:text-[var(--color-gray-2)] disabled:bg-transparent disabled:text-[var(--color-gray-6)] aria-expanded:bg-[color-mix(in_srgb,var(--color-gray-2)_6%,transparent)] aria-expanded:text-[var(--color-gray-2)]",
        secondary:
          "bg-[var(--button-secondary-background)] text-[var(--button-secondary-foreground)] shadow-[var(--shadow-btn-primary-blue)] hover:bg-[var(--button-secondary-background-hover)] hover:text-[var(--button-secondary-foreground)] hover:shadow-[var(--shadow-btn-primary-blue-hover)] active:bg-[var(--button-secondary-background-active)] active:shadow-[var(--shadow-btn-primary-blue-pressed)] disabled:bg-[var(--button-secondary-disabled-background)] disabled:text-[var(--button-secondary-disabled-foreground)] disabled:shadow-[var(--shadow-btn-primary-blue-disabled)] aria-expanded:bg-[var(--button-secondary-background-hover)] aria-expanded:text-[var(--button-secondary-foreground)]",
        ghost:
          "bg-[var(--button-ghost-background)] text-[var(--button-ghost-foreground)] shadow-none hover:bg-[var(--button-ghost-background-hover)] hover:text-[var(--button-ghost-foreground)] active:bg-[var(--button-ghost-background-active)] disabled:bg-[var(--button-ghost-background)] disabled:text-[var(--button-ghost-disabled-foreground)] disabled:shadow-none aria-expanded:bg-[var(--button-ghost-background-hover)] aria-expanded:text-[var(--button-ghost-foreground)]",
        destructive:
          "bg-[var(--button-destructive-background)] text-[var(--button-destructive-foreground)] shadow-[var(--shadow-btn-primary-red)] hover:bg-[var(--button-destructive-background-hover)] hover:shadow-[var(--shadow-btn-primary-red-hover)] active:bg-[var(--button-destructive-background-active)] active:shadow-[var(--shadow-btn-primary-red-pressed)] disabled:bg-[var(--button-destructive-disabled-background)] disabled:text-[var(--button-destructive-disabled-foreground)] disabled:shadow-[var(--shadow-btn-primary-red-disabled)]",
        link: "text-[var(--button-link-foreground)] underline-offset-4 hover:underline active:text-[var(--button-link-foreground-active)] disabled:text-[var(--button-link-disabled-foreground)]",
      },
      size: {
        default:
          "h-[var(--control-size-sm)] gap-1 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-[var(--control-size-xs)] gap-0.5 rounded-[var(--r-sm)] px-2 text-[length:var(--text-button-4)] leading-[var(--leading-button-4)] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-4",
        sm: "h-[var(--control-size-sm)] gap-1 rounded-[var(--r-md)] px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        lg: "h-[var(--control-size-md)] gap-1 rounded-[var(--r-md)] px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xl: "h-11 gap-1.5 rounded-[var(--r-lg)] px-5 text-[length:var(--text-body-6)] leading-[var(--leading-body-6)] has-data-[icon=inline-end]:pr-4.5 has-data-[icon=inline-start]:pl-4.5 has-data-[icon=inline-end]:gap-1 has-data-[icon=inline-start]:gap-1 [&_svg:not([class*='size-'])]:size-5",
        "2xl": "h-12 gap-2 rounded-[var(--r-lg)] px-6 text-[length:var(--text-body-6)] leading-[var(--leading-body-6)] has-data-[icon=inline-end]:pr-5.5 has-data-[icon=inline-start]:pl-5.5 has-data-[icon=inline-end]:gap-1.5 has-data-[icon=inline-start]:gap-1.5 [&_svg:not([class*='size-'])]:size-5",
        "3xl": "h-14 gap-2 rounded-[var(--r-lg)] px-7 text-[length:var(--text-body-5)] leading-7 has-data-[icon=inline-end]:pr-6 has-data-[icon=inline-start]:pl-6 has-data-[icon=inline-end]:gap-1.5 has-data-[icon=inline-start]:gap-1.5 [&_svg:not([class*='size-'])]:size-6",
        icon: "size-[var(--control-size-sm)] rounded-[var(--r-md)] [&_svg:not([class*='size-'])]:size-5",
        "icon-xs":
          "size-[var(--control-size-xs)] rounded-[var(--r-sm)] [&_svg:not([class*='size-'])]:size-4",
        "icon-sm":
          "size-[var(--control-size-sm)] rounded-[var(--r-md)] [&_svg:not([class*='size-'])]:size-5",
        "icon-lg":
          "size-[var(--control-size-md)] rounded-[var(--r-md)] [&_svg:not([class*='size-'])]:size-5",
        "icon-xl": "size-11 rounded-[var(--r-lg)] [&_svg:not([class*='size-'])]:size-7",
        "icon-2xl": "size-12 rounded-[var(--r-lg)] [&_svg:not([class*='size-'])]:size-7",
        "icon-3xl": "size-14 rounded-[var(--r-lg)] [&_svg:not([class*='size-'])]:size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  type,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof baseButtonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const childIsNativeButton =
    asChild &&
    React.isValidElement(props.children) &&
    props.children.type === "button"
  const resolvedType =
    !asChild || childIsNativeButton ? (type ?? "button") : type

  return (
    <Comp
      type={resolvedType}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

const colorStates = {
  default:
    "border-[var(--button-primary-background)] active:border-[var(--button-primary-background-active)] disabled:border-[var(--color-gray-9)]",
  secondary:
    "border-[var(--color-primary-8)] hover:border-[var(--color-primary-7)] hover:text-[var(--color-primary-3)] active:border-[var(--color-primary-6)] active:text-[var(--color-primary-2)] disabled:border-[var(--color-gray-9)]",
  outline: "",
  neutral: "",
  "outline-primary": "",
  "ghost-neutral": "",
  destructive:
    "border-[var(--button-destructive-background)] active:border-[var(--button-destructive-background-active)] disabled:border-[var(--color-gray-9)]",
  ghost: "",
  link: "hover:decoration-2 active:underline active:decoration-2",
} as const
const sizeStyles = {
  default:
    "text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
  sm: "text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
  xs: "gap-1 text-[length:var(--text-body-11)] leading-[var(--leading-body-11)] [&_svg:not([class*='size-'])]:size-3.5",
  lg: "gap-1.5 rounded-[var(--radius)] text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5 has-data-[icon=inline-end]:gap-1 has-data-[icon=inline-start]:gap-1 [&_svg:not([class*='size-'])]:size-5",
  xl: "",
  "2xl": "",
  "3xl": "",
  icon: "[&_svg:not([class*='size-'])]:size-4.5",
  "icon-sm": "[&_svg:not([class*='size-'])]:size-4.5",
  "icon-xs": "[&_svg:not([class*='size-'])]:size-4",
  "icon-lg": "rounded-[var(--radius)] [&_svg:not([class*='size-'])]:size-5",
  "icon-xl": "",
  "icon-2xl": "",
  "icon-3xl": "",
} as const
const linkPadding =
  "px-0 has-data-[icon=inline-end]:pr-0 has-data-[icon=inline-start]:pl-0"

function buttonVariants(
  options: Parameters<typeof baseButtonVariants>[0] = {}
) {
  const { className, class: classValue, ...variants } = options
  return cn(
    baseButtonVariants(variants),
    "font-normal",
    colorStates[variants.variant ?? "default"],
    sizeStyles[variants.size ?? "default"],
    variants.variant === "link" && linkPadding,
    classValue,
    className
  )
}

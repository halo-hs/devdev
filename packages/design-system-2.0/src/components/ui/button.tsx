import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@ecoya/design-system/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[var(--r-md)] border border-transparent bg-clip-padding text-[length:var(--text-button-3)] leading-[var(--leading-button-3)] font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-transparent focus-visible:[box-shadow:var(--shadow-input-focused)] active:not-aria-[haspopup]:translate-y-px active:focus-visible:border-transparent active:focus-visible:[box-shadow:var(--shadow-input-focused)] disabled:pointer-events-none aria-invalid:border-[var(--control-invalid-border)] aria-invalid:focus-visible:border-transparent aria-invalid:focus-visible:[box-shadow:var(--shadow-input-invalid-focused)] aria-invalid:active:focus-visible:border-transparent aria-invalid:active:focus-visible:[box-shadow:var(--shadow-input-invalid-focused)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--button-primary-background)] text-[var(--button-primary-foreground)] shadow-[var(--shadow-btn-primary-blue)] hover:bg-[var(--button-primary-background-hover)] hover:shadow-[var(--shadow-btn-primary-blue-hover)] active:bg-[var(--button-primary-background-active)] active:shadow-[var(--shadow-btn-primary-blue-pressed)] disabled:bg-[var(--button-primary-disabled-background)] disabled:text-[var(--button-primary-disabled-foreground)] disabled:shadow-[var(--shadow-btn-primary-blue-disabled)]",
        outline:
          "border-[var(--button-outline-border)] bg-[var(--button-outline-background)] text-[var(--button-outline-foreground)] shadow-[var(--shadow-btn-tertiary-black)] hover:bg-[var(--button-outline-background-hover)] hover:text-[var(--button-outline-foreground)] hover:shadow-[var(--shadow-btn-tertiary-black-hover)] active:bg-[var(--button-outline-background-active)] active:text-[var(--button-outline-foreground-active)] active:shadow-[var(--shadow-btn-tertiary-black-pressed)] disabled:bg-[var(--button-outline-disabled-background)] disabled:text-[var(--button-outline-disabled-foreground)] disabled:shadow-[var(--shadow-btn-tertiary-black-disabled)] aria-expanded:bg-[var(--button-outline-background-hover)] aria-expanded:text-[var(--button-outline-foreground)]",
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
        icon: "size-[var(--control-size-sm)] rounded-[var(--r-md)] [&_svg:not([class*='size-'])]:size-5",
        "icon-xs":
          "size-[var(--control-size-xs)] rounded-[var(--r-sm)] [&_svg:not([class*='size-'])]:size-4",
        "icon-sm":
          "size-[var(--control-size-sm)] rounded-[var(--r-md)] [&_svg:not([class*='size-'])]:size-5",
        "icon-lg":
          "size-[var(--control-size-md)] rounded-[var(--r-md)] [&_svg:not([class*='size-'])]:size-5",
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
  VariantProps<typeof buttonVariants> & {
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

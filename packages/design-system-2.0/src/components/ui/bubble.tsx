import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@ecoya/design-system/lib/utils"

function BubbleGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bubble-group"
      className={cn("flex min-w-0 flex-col gap-2", className)}
      {...props}
    />
  )
}

const bubbleVariants = cva(
  "group/bubble relative flex w-fit max-w-[80%] min-w-0 flex-col gap-1 group-data-[align=end]/message:self-end data-[align=end]:self-end data-[variant=ghost]:max-w-full",
  {
    variants: {
      variant: {
        default:
          "*:data-[slot=bubble-content]:bg-[var(--bubble-primary-background)] *:data-[slot=bubble-content]:text-[var(--bubble-primary-foreground)] [&>[data-slot=bubble-content]:is(button,a):active]:bg-[var(--bubble-primary-background-active)] [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[var(--bubble-primary-background-hover)]",
        secondary:
          "*:data-[slot=bubble-content]:bg-[var(--bubble-secondary-background)] *:data-[slot=bubble-content]:text-[var(--bubble-secondary-foreground)] [&>[data-slot=bubble-content]:is(button,a):active]:bg-[var(--bubble-secondary-background-active)] [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[var(--bubble-secondary-background-hover)]",
        muted:
          "*:data-[slot=bubble-content]:bg-[var(--surface-muted-background)] *:data-[slot=bubble-content]:text-[var(--surface-foreground)] [&>[data-slot=bubble-content]:is(button,a):active]:bg-[var(--bubble-muted-background-active)] [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[var(--menu-item-background-hover)]",
        tinted:
          "*:data-[slot=bubble-content]:bg-[var(--control-selected-soft-background)] *:data-[slot=bubble-content]:text-[var(--accent-foreground)] [&>[data-slot=bubble-content]:is(button,a):active]:bg-[var(--bubble-tinted-background-active)] [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[var(--accent)]",
        outline:
          "*:data-[slot=bubble-content]:border-[var(--surface-border)] *:data-[slot=bubble-content]:bg-[var(--surface-background)] *:data-[slot=bubble-content]:text-[var(--surface-foreground)] [&>[data-slot=bubble-content]:is(button,a):active]:bg-[var(--bubble-outline-background-active)] [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[var(--surface-muted-background)]",
        ghost:
          "border-none *:data-[slot=bubble-content]:rounded-none *:data-[slot=bubble-content]:bg-transparent *:data-[slot=bubble-content]:p-0 *:data-[slot=bubble-content]:text-[var(--surface-foreground)] [&>[data-slot=bubble-content]:is(button,a):active]:bg-[var(--bubble-ghost-background-active)] [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[var(--surface-muted-background)]",
        destructive:
          "*:data-[slot=bubble-content]:bg-[var(--bubble-destructive-background)] *:data-[slot=bubble-content]:text-[var(--bubble-destructive-foreground)] [&>[data-slot=bubble-content]:is(button,a):active]:bg-[var(--bubble-destructive-background-active)] [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[var(--bubble-destructive-background-hover)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Bubble({
  variant = "default",
  align = "start",
  className,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof bubbleVariants> & {
    align?: "start" | "end"
  }) {
  return (
    <div
      data-slot="bubble"
      data-variant={variant}
      data-align={align}
      className={cn(bubbleVariants({ variant }), className)}
      {...props}
    />
  )
}

function BubbleContent({
  asChild = false,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  asChild?: boolean
}) {
  const Comp = asChild ? Slot.Root : "div"

  return (
    <Comp
      data-slot="bubble-content"
      className={cn(
        "w-fit max-w-full min-w-0 overflow-hidden rounded-[var(--r-xl)] border border-transparent px-3 py-2 text-sm wrap-break-word group-data-[align=end]/bubble:self-end [button]:text-left [button,a]:transition-colors [button,a]:outline-none [button,a]:focus-visible:border-transparent [button,a]:focus-visible:[box-shadow:var(--shadow-keyboard-focus)]",
        className
      )}
      {...props}
    />
  )
}

const bubbleReactionsVariants = cva(
  "absolute z-10 flex w-fit shrink-0 items-center justify-center gap-1 rounded-[var(--r-pill)] bg-[var(--surface-muted-background)] px-1.5 py-0.5 text-sm text-[var(--surface-foreground)] ring-3 ring-[var(--surface-background)] has-[button]:p-0",
  {
    variants: {
      side: {
        top: "top-0 -translate-y-3/4",
        bottom: "bottom-0 translate-y-3/4",
      },
      align: {
        start: "left-3",
        end: "right-3",
      },
    },
    defaultVariants: {
      side: "bottom",
      align: "end",
    },
  }
)

function BubbleReactions({
  side = "bottom",
  align = "end",
  className,
  ...props
}: React.ComponentProps<"div"> & {
  align?: "start" | "end"
  side?: "top" | "bottom"
}) {
  return (
    <div
      data-slot="bubble-reactions"
      data-align={align}
      data-side={side}
      className={cn(bubbleReactionsVariants({ side, align }), className)}
      {...props}
    />
  )
}

export { BubbleGroup, Bubble, BubbleContent, BubbleReactions }

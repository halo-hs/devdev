import * as React from "react"

import { cn } from "@ecoya/design-system/lib/utils"

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-0 overflow-hidden rounded-[var(--r-lg)] bg-[var(--surface-background)] text-sm text-[var(--surface-foreground)] shadow-[var(--shadow-section)] ring-1 ring-[var(--surface-border)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 *:[img:first-child]:rounded-t-[var(--r-lg)] *:[img:last-child]:rounded-b-[var(--r-lg)]",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid min-h-12 auto-rows-min items-center gap-1 rounded-t-[var(--r-lg)] px-5 py-3 group-data-[size=sm]/card:min-h-0 group-data-[size=sm]/card:px-4 group-data-[size=sm]/card:py-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:border-[var(--surface-border)]",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-[length:var(--text-header-6)] leading-[var(--leading-header-6)] font-bold text-[var(--surface-foreground)] group-data-[size=sm]/card:text-[length:var(--text-header-9)] group-data-[size=sm]/card:leading-[var(--leading-header-9)]",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        "text-sm text-[var(--surface-muted-foreground)]",
        className
      )}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        "px-5 py-6 group-data-[size=sm]/card:px-4 group-data-[size=sm]/card:py-4",
        className
      )}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-[var(--r-lg)] border-t border-[var(--surface-border)] bg-[var(--surface-background)] px-5 py-4 group-data-[size=sm]/card:p-4",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}

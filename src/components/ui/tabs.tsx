"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      orientation={orientation}
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        "gap-4",
        className
      )}
      {...props}
    />
  )
}

const baseTabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-[var(--r-md)] p-[3px] text-[var(--tabs-trigger-foreground)] group-data-horizontal/tabs:h-[var(--control-size-sm)] group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-[var(--tabs-list-background)]",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & {
  variant?: VariantProps<typeof baseTabsListVariants>["variant"] | "segment"
  size?: "sm" | "default" | "lg"
}) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      data-size={variant === "segment" ? undefined : size}
      className={cn(
        baseTabsListVariants({
          variant: variant === "segment" ? "default" : variant,
        }),
        listSizes,
        variant === "segment" && segmentList,
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-[var(--r-sm)] border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-[var(--tabs-trigger-foreground)] transition-all outline-none group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-[var(--tabs-trigger-foreground-hover)] focus-visible:border-transparent focus-visible:[box-shadow:var(--shadow-keyboard-focus)] active:bg-[var(--tabs-trigger-background-active)] disabled:pointer-events-none disabled:text-[var(--tabs-trigger-disabled-foreground)] disabled:opacity-100 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 group-data-[variant=default]/tabs-list:data-active:shadow-[var(--shadow-input)] group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:active:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-active:active:bg-transparent",
        "data-active:bg-[var(--tabs-trigger-background-selected)] data-active:text-[var(--tabs-trigger-foreground-selected)] data-active:active:bg-[var(--tabs-trigger-background-selected)]",
        "after:absolute after:bg-[var(--tabs-indicator)] after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        triggerSizes,
        "group/tabs-trigger rounded-[var(--r-pill)] border-0 font-semibold group-data-[variant=line]/tabs-list:h-7 group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:px-3 group-data-[variant=line]/tabs-list:py-0 group-data-[variant=line]/tabs-list:after:bottom-0 group-data-[variant=default]/tabs-list:data-active:shadow-[var(--shadow-input)]",
        segmentTrigger,
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "flex-1 text-sm outline-none",
        "text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)]",
        className
      )}
      {...props}
    />
  )
}

export { TabsCount, Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }

const listSizes =
  "p-1 gap-1 rounded-[var(--r-pill)] shadow-none group-data-horizontal/tabs:h-10 group-data-horizontal/tabs:data-[size=sm]:h-8.5 group-data-horizontal/tabs:data-[size=lg]:h-11 data-[variant=line]:p-0 group-data-horizontal/tabs:data-[variant=line]:h-7 group-data-horizontal/tabs:data-[variant=line]:data-[size=sm]:h-6"
const segmentList =
  "gap-0.5 rounded-[var(--r-md)] bg-[var(--tabs-list-background)] p-[3px] shadow-none group-data-horizontal/tabs:h-8"
const segmentTrigger =
  "group-data-[variant=segment]/tabs-list:h-6.5 group-data-[variant=segment]/tabs-list:flex-none group-data-[variant=segment]/tabs-list:rounded-[var(--r-sm)] group-data-[variant=segment]/tabs-list:px-3 group-data-[variant=segment]/tabs-list:py-0 group-data-[variant=segment]/tabs-list:text-[length:var(--text-body-10)] group-data-[variant=segment]/tabs-list:leading-normal group-data-[variant=segment]/tabs-list:font-medium group-data-[variant=segment]/tabs-list:text-[var(--muted-foreground)] group-data-[variant=segment]/tabs-list:hover:bg-[var(--tabs-trigger-background-active)] group-data-[variant=segment]/tabs-list:disabled:text-[var(--tabs-trigger-disabled-foreground)] group-data-[variant=segment]/tabs-list:data-active:bg-[var(--card)] group-data-[variant=segment]/tabs-list:data-active:font-semibold group-data-[variant=segment]/tabs-list:data-active:text-[var(--foreground)] group-data-[variant=segment]/tabs-list:data-active:shadow-[var(--shadow-input)]"
const triggerSizes =
  "h-8 gap-2 px-4 py-0 text-[length:var(--text-body-9)] leading-5 group-data-[size=sm]/tabs-list:h-6.5 group-data-[size=sm]/tabs-list:gap-1.5 group-data-[size=sm]/tabs-list:px-3 group-data-[size=sm]/tabs-list:text-[length:var(--text-body-10)] group-data-[size=sm]/tabs-list:leading-[var(--leading-body-10)] group-data-[size=lg]/tabs-list:h-9 group-data-[variant=line]/tabs-list:group-data-[size=sm]/tabs-list:h-6"

function tabsListVariants(
  options: Parameters<typeof baseTabsListVariants>[0] = {}
) {
  const { className, class: classValue, ...variants } = options
  return cn(baseTabsListVariants(variants), listSizes, classValue, className)
}

function TabsCount({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      {...props}
      data-slot="tabs-count"
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[var(--r-pill)] bg-[var(--color-gray-8)] px-1 text-[length:var(--text-badge-default)] leading-4 font-normal text-[var(--color-gray-4)] tabular-nums group-data-active/tabs-trigger:bg-[var(--color-primary-4)] group-data-active/tabs-trigger:text-white",
        "group-data-[size=sm]/tabs-list:h-4 group-data-[size=sm]/tabs-list:text-[length:var(--text-body-11)]",
        className
      )}
    />
  )
}

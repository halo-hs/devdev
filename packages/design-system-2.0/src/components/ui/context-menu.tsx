"use client"

import * as React from "react"
import { ContextMenu as ContextMenuPrimitive } from "radix-ui"

import { cn } from "@ecoya/design-system/lib/utils"
import { ChevronRightIcon, CheckIcon } from "lucide-react"

function ContextMenu({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Root>) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />
}

function ContextMenuTrigger({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Trigger>) {
  return (
    <ContextMenuPrimitive.Trigger
      data-slot="context-menu-trigger"
      className={cn("select-none", className)}
      {...props}
    />
  )
}

function ContextMenuGroup({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Group>) {
  return (
    <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />
  )
}

function ContextMenuPortal({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Portal>) {
  return (
    <ContextMenuPrimitive.Portal data-slot="context-menu-portal" {...props} />
  )
}

function ContextMenuSub({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Sub>) {
  return <ContextMenuPrimitive.Sub data-slot="context-menu-sub" {...props} />
}

function ContextMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.RadioGroup>) {
  return (
    <ContextMenuPrimitive.RadioGroup
      data-slot="context-menu-radio-group"
      {...props}
    />
  )
}

function ContextMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
}) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        data-slot="context-menu-content"
        className={cn(
          "z-[var(--z-dropdown)] max-h-(--radix-context-menu-content-available-height) min-w-36 origin-(--radix-context-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-[var(--r-md)] bg-[var(--surface-background)] p-1 text-[var(--surface-foreground)] shadow-[var(--shadow-filter)] ring-1 ring-[var(--surface-border)] duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  )
}

function ContextMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "group/context-menu-item relative flex min-h-[var(--control-size-md)] cursor-default items-center gap-1.5 rounded-[var(--r-xs)] px-4 py-2 text-sm text-[var(--menu-item-foreground)] outline-hidden select-none hover:bg-[var(--menu-item-background-hover)] hover:text-[var(--menu-item-foreground)] focus:bg-[var(--menu-item-background-hover)] focus:text-[var(--menu-item-foreground)] active:bg-[var(--menu-item-background-active)] active:text-[var(--menu-item-foreground)] data-inset:pl-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:hover:bg-[var(--badge-destructive-background)] data-[variant=destructive]:hover:text-destructive data-[variant=destructive]:focus:bg-[var(--badge-destructive-background)] data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:active:bg-[var(--badge-destructive-background-active)] data-[variant=destructive]:active:text-destructive data-disabled:pointer-events-none data-disabled:text-[var(--menu-item-disabled-foreground)] data-disabled:opacity-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive!",
        className
      )}
      {...props}
    />
  )
}

function ContextMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <ContextMenuPrimitive.SubTrigger
      data-slot="context-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex min-h-[var(--control-size-md)] cursor-default items-center gap-1.5 rounded-[var(--r-xs)] px-4 py-2 text-sm text-[var(--menu-item-foreground)] outline-hidden select-none hover:bg-[var(--menu-item-background-hover)] hover:text-[var(--menu-item-foreground)] focus:bg-[var(--menu-item-background-hover)] focus:text-[var(--menu-item-foreground)] active:bg-[var(--menu-item-background-active)] active:text-[var(--menu-item-foreground)] data-inset:pl-7 data-open:bg-[var(--menu-item-selected-background)] data-open:text-[var(--menu-item-foreground)] data-open:active:bg-[var(--menu-item-selected-background)] data-disabled:pointer-events-none data-disabled:text-[var(--menu-item-disabled-foreground)] data-disabled:opacity-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto" />
    </ContextMenuPrimitive.SubTrigger>
  )
}

function ContextMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubContent>) {
  return (
    <ContextMenuPrimitive.SubContent
      data-slot="context-menu-sub-content"
      className={cn(
        "z-[var(--z-dropdown)] min-w-32 origin-(--radix-context-menu-content-transform-origin) overflow-hidden rounded-[var(--r-md)] bg-[var(--surface-background)] p-1 text-[var(--surface-foreground)] shadow-[var(--shadow-filter)] ring-1 ring-[var(--surface-border)] duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
        className
      )}
      {...props}
    />
  )
}

function ContextMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.CheckboxItem> & {
  inset?: boolean
}) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      data-slot="context-menu-checkbox-item"
      data-inset={inset}
      className={cn(
        "relative flex min-h-[var(--control-size-md)] cursor-default items-center gap-1.5 rounded-[var(--r-xs)] py-2 pr-8 pl-4 text-sm text-[var(--menu-item-foreground)] outline-hidden select-none hover:bg-[var(--menu-item-background-hover)] hover:text-[var(--menu-item-foreground)] focus:bg-[var(--menu-item-background-hover)] focus:text-[var(--menu-item-foreground)] active:bg-[var(--menu-item-background-active)] active:text-[var(--menu-item-foreground)] data-inset:pl-7 data-[state=checked]:bg-[var(--menu-item-selected-background)] data-[state=checked]:hover:bg-[var(--menu-item-selected-background)] data-[state=checked]:focus:bg-[var(--menu-item-selected-background)] data-[state=checked]:active:bg-[var(--menu-item-selected-background)] data-disabled:pointer-events-none data-disabled:text-[var(--menu-item-disabled-foreground)] data-disabled:opacity-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute right-2">
        <ContextMenuPrimitive.ItemIndicator>
          <CheckIcon />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  )
}

function ContextMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.RadioItem> & {
  inset?: boolean
}) {
  return (
    <ContextMenuPrimitive.RadioItem
      data-slot="context-menu-radio-item"
      data-inset={inset}
      className={cn(
        "relative flex min-h-[var(--control-size-md)] cursor-default items-center gap-1.5 rounded-[var(--r-xs)] py-2 pr-8 pl-4 text-sm text-[var(--menu-item-foreground)] outline-hidden select-none hover:bg-[var(--menu-item-background-hover)] hover:text-[var(--menu-item-foreground)] focus:bg-[var(--menu-item-background-hover)] focus:text-[var(--menu-item-foreground)] active:bg-[var(--menu-item-background-active)] active:text-[var(--menu-item-foreground)] data-inset:pl-7 data-[state=checked]:bg-[var(--menu-item-selected-background)] data-[state=checked]:hover:bg-[var(--menu-item-selected-background)] data-[state=checked]:focus:bg-[var(--menu-item-selected-background)] data-[state=checked]:active:bg-[var(--menu-item-selected-background)] data-disabled:pointer-events-none data-disabled:text-[var(--menu-item-disabled-foreground)] data-disabled:opacity-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute right-2">
        <ContextMenuPrimitive.ItemIndicator>
          <CheckIcon />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  )
}

function ContextMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <ContextMenuPrimitive.Label
      data-slot="context-menu-label"
      data-inset={inset}
      className={cn(
        "px-4 py-2 text-xs font-medium text-[var(--surface-muted-foreground)] data-inset:pl-7",
        className
      )}
      {...props}
    />
  )
}

function ContextMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Separator>) {
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-[var(--surface-border)]", className)}
      {...props}
    />
  )
}

function ContextMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="context-menu-shortcut"
      className={cn(
        "ml-auto text-xs tracking-shortcut text-[var(--surface-muted-foreground)] group-focus/context-menu-item:text-[var(--menu-item-foreground)]",
        className
      )}
      {...props}
    />
  )
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
}

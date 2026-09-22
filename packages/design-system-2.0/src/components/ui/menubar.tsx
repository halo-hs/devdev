"use client"

import * as React from "react"
import { Menubar as MenubarPrimitive } from "radix-ui"

import { cn } from "@ecoya/design-system/lib/utils"
import { CheckIcon, ChevronRightIcon } from "lucide-react"

function Menubar({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Root>) {
  return (
    <MenubarPrimitive.Root
      data-slot="menubar"
      className={cn(
        "flex h-[var(--control-size-sm)] items-center gap-0.5 rounded-[var(--r-md)] border border-[var(--surface-border)] bg-[var(--surface-background)] p-[3px] text-[var(--surface-foreground)]",
        className
      )}
      {...props}
    />
  )
}

function MenubarMenu({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu data-slot="menubar-menu" {...props} />
}

function MenubarGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group data-slot="menubar-group" {...props} />
}

function MenubarPortal({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
  return <MenubarPrimitive.Portal data-slot="menubar-portal" {...props} />
}

function MenubarRadioGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return (
    <MenubarPrimitive.RadioGroup data-slot="menubar-radio-group" {...props} />
  )
}

function MenubarTrigger({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Trigger>) {
  return (
    <MenubarPrimitive.Trigger
      data-slot="menubar-trigger"
      className={cn(
        "flex items-center rounded-[var(--r-xs)] px-2 py-1 text-sm font-medium text-[var(--menu-item-foreground)] outline-hidden select-none hover:bg-[var(--menu-item-background-hover)] focus:bg-[var(--menu-item-background-hover)] active:bg-[var(--menu-item-background-active)] aria-expanded:bg-[var(--menu-item-selected-background)] aria-expanded:active:bg-[var(--menu-item-selected-background)] data-disabled:pointer-events-none data-disabled:text-[var(--menu-item-disabled-foreground)] data-disabled:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function MenubarContent({
  className,
  align = "start",
  alignOffset = -4,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Content>) {
  return (
    <MenubarPortal>
      <MenubarPrimitive.Content
        data-slot="menubar-content"
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          "z-[var(--z-dropdown)] min-w-36 origin-(--radix-menubar-content-transform-origin) overflow-hidden rounded-[var(--r-md)] bg-[var(--surface-background)] p-1 text-[var(--surface-foreground)] shadow-[var(--shadow-filter)] ring-1 ring-[var(--surface-border)] duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
          className
        )}
        {...props}
      />
    </MenubarPortal>
  )
}

function MenubarItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <MenubarPrimitive.Item
      data-slot="menubar-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "group/menubar-item relative flex min-h-[var(--control-size-md)] cursor-default items-center gap-1.5 rounded-[var(--r-xs)] px-4 py-2 text-sm text-[var(--menu-item-foreground)] outline-hidden select-none hover:bg-[var(--menu-item-background-hover)] hover:text-[var(--menu-item-foreground)] focus:bg-[var(--menu-item-background-hover)] focus:text-[var(--menu-item-foreground)] active:bg-[var(--menu-item-background-active)] active:text-[var(--menu-item-foreground)] data-inset:pl-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:hover:bg-[var(--badge-destructive-background)] data-[variant=destructive]:hover:text-destructive data-[variant=destructive]:focus:bg-[var(--badge-destructive-background)] data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:active:bg-[var(--badge-destructive-background-active)] data-[variant=destructive]:active:text-destructive data-disabled:pointer-events-none data-disabled:text-[var(--menu-item-disabled-foreground)] data-disabled:opacity-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive!",
        className
      )}
      {...props}
    />
  )
}

function MenubarCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.CheckboxItem> & {
  inset?: boolean
}) {
  return (
    <MenubarPrimitive.CheckboxItem
      data-slot="menubar-checkbox-item"
      data-inset={inset}
      className={cn(
        "relative flex min-h-[var(--control-size-md)] cursor-default items-center gap-1.5 rounded-[var(--r-xs)] py-2 pr-4 pl-7 text-sm text-[var(--menu-item-foreground)] outline-hidden select-none hover:bg-[var(--menu-item-background-hover)] hover:text-[var(--menu-item-foreground)] focus:bg-[var(--menu-item-background-hover)] focus:text-[var(--menu-item-foreground)] active:bg-[var(--menu-item-background-active)] active:text-[var(--menu-item-foreground)] data-inset:pl-7 data-[state=checked]:bg-[var(--menu-item-selected-background)] data-[state=checked]:hover:bg-[var(--menu-item-selected-background)] data-[state=checked]:focus:bg-[var(--menu-item-selected-background)] data-[state=checked]:active:bg-[var(--menu-item-selected-background)] data-disabled:pointer-events-none data-disabled:text-[var(--menu-item-disabled-foreground)] data-disabled:opacity-100 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-1.5 flex size-4 items-center justify-center [&_svg:not([class*='size-'])]:size-4">
        <MenubarPrimitive.ItemIndicator>
          <CheckIcon />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.CheckboxItem>
  )
}

function MenubarRadioItem({
  className,
  children,
  inset,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioItem> & {
  inset?: boolean
}) {
  return (
    <MenubarPrimitive.RadioItem
      data-slot="menubar-radio-item"
      data-inset={inset}
      className={cn(
        "relative flex min-h-[var(--control-size-md)] cursor-default items-center gap-1.5 rounded-[var(--r-xs)] py-2 pr-4 pl-7 text-sm text-[var(--menu-item-foreground)] outline-hidden select-none hover:bg-[var(--menu-item-background-hover)] hover:text-[var(--menu-item-foreground)] focus:bg-[var(--menu-item-background-hover)] focus:text-[var(--menu-item-foreground)] active:bg-[var(--menu-item-background-active)] active:text-[var(--menu-item-foreground)] data-inset:pl-7 data-[state=checked]:bg-[var(--menu-item-selected-background)] data-[state=checked]:hover:bg-[var(--menu-item-selected-background)] data-[state=checked]:focus:bg-[var(--menu-item-selected-background)] data-[state=checked]:active:bg-[var(--menu-item-selected-background)] data-disabled:pointer-events-none data-disabled:text-[var(--menu-item-disabled-foreground)] data-disabled:opacity-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-1.5 flex size-4 items-center justify-center [&_svg:not([class*='size-'])]:size-4">
        <MenubarPrimitive.ItemIndicator>
          <CheckIcon />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.RadioItem>
  )
}

function MenubarLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <MenubarPrimitive.Label
      data-slot="menubar-label"
      data-inset={inset}
      className={cn(
        "px-4 py-2 text-xs font-medium text-[var(--surface-muted-foreground)] data-inset:pl-7",
        className
      )}
      {...props}
    />
  )
}

function MenubarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Separator>) {
  return (
    <MenubarPrimitive.Separator
      data-slot="menubar-separator"
      className={cn("-mx-1 my-1 h-px bg-[var(--surface-border)]", className)}
      {...props}
    />
  )
}

function MenubarShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="menubar-shortcut"
      className={cn(
        "ml-auto text-xs tracking-shortcut text-[var(--surface-muted-foreground)] group-focus/menubar-item:text-[var(--menu-item-foreground)]",
        className
      )}
      {...props}
    />
  )
}

function MenubarSub({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />
}

function MenubarSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <MenubarPrimitive.SubTrigger
      data-slot="menubar-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex min-h-[var(--control-size-md)] cursor-default items-center gap-1.5 rounded-[var(--r-xs)] px-4 py-2 text-sm text-[var(--menu-item-foreground)] outline-none select-none hover:bg-[var(--menu-item-background-hover)] hover:text-[var(--menu-item-foreground)] focus:bg-[var(--menu-item-background-hover)] focus:text-[var(--menu-item-foreground)] active:bg-[var(--menu-item-background-active)] active:text-[var(--menu-item-foreground)] data-inset:pl-7 data-open:bg-[var(--menu-item-selected-background)] data-open:text-[var(--menu-item-foreground)] data-open:active:bg-[var(--menu-item-selected-background)] data-disabled:pointer-events-none data-disabled:text-[var(--menu-item-disabled-foreground)] data-disabled:opacity-100 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </MenubarPrimitive.SubTrigger>
  )
}

function MenubarSubContent({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.SubContent>) {
  return (
    <MenubarPrimitive.SubContent
      data-slot="menubar-sub-content"
      className={cn(
        "z-[var(--z-dropdown)] min-w-32 origin-(--radix-menubar-content-transform-origin) overflow-hidden rounded-[var(--r-md)] bg-[var(--surface-background)] p-1 text-[var(--surface-foreground)] shadow-[var(--shadow-filter)] ring-1 ring-[var(--surface-border)] duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
        className
      )}
      {...props}
    />
  )
}

export {
  Menubar,
  MenubarPortal,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarGroup,
  MenubarSeparator,
  MenubarLabel,
  MenubarItem,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
}

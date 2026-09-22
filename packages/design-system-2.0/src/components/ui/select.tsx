"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"

import CheckIcon from "@ecoya/design-system/assets/icons/icon-checkmark.svg"
import ChevronDownIcon from "@ecoya/design-system/assets/icons/icon-chevron-down.svg"
import ChevronUpIcon from "@ecoya/design-system/assets/icons/icon-chevron-up.svg"
import { cn } from "@ecoya/design-system/lib/utils"

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  )
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit items-center justify-between gap-2 rounded-[var(--r-md)] border border-[var(--control-border)] bg-[var(--control-background)] py-2 pr-2.5 pl-4 text-[length:var(--text-body-8)] leading-[var(--leading-body-8)] font-normal whitespace-nowrap text-[var(--control-foreground)] shadow-[var(--shadow-input)] transition-[border-color,box-shadow,background-color,color] outline-none select-none hover:border-[var(--control-border-hover)] hover:bg-[var(--control-background-hover)] hover:shadow-[var(--shadow-input-hover)] focus-visible:border-transparent focus-visible:shadow-[var(--shadow-input-focused)] focus-visible:ring-0 active:border-[var(--control-border-active)] active:bg-[var(--control-background-active)] active:shadow-[var(--shadow-input-active)] active:focus-visible:border-transparent active:focus-visible:shadow-[var(--shadow-input-focused)] disabled:cursor-not-allowed disabled:border-[var(--control-disabled-border)] disabled:bg-[var(--control-disabled-background)] disabled:text-[var(--control-disabled-foreground)] disabled:opacity-100 aria-invalid:border-[var(--control-invalid-border)] aria-invalid:shadow-[var(--shadow-input)] aria-invalid:ring-0 aria-invalid:hover:border-[var(--control-invalid-border)] aria-invalid:focus-visible:border-transparent aria-invalid:focus-visible:shadow-[var(--shadow-input-invalid-focused)] aria-invalid:active:border-[var(--control-invalid-border)] aria-invalid:active:shadow-[var(--shadow-input-invalid-active)] aria-invalid:active:focus-visible:border-transparent aria-invalid:active:focus-visible:shadow-[var(--shadow-input-invalid-focused)] data-placeholder:text-[var(--control-placeholder)] data-[size=default]:h-[var(--control-size-md)] data-[size=sm]:h-[var(--control-size-sm)] data-[size=sm]:rounded-[var(--r-sm)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 data-[state=open]:border-[var(--control-focus-border)] data-[state=open]:bg-[var(--control-background-open)] data-[state=open]:shadow-[var(--shadow-input-open)] data-[state=open]:focus-visible:border-transparent data-[state=open]:focus-visible:shadow-[var(--shadow-input-focused)] aria-invalid:data-[state=open]:border-[var(--control-invalid-border)] aria-invalid:data-[state=open]:shadow-[var(--shadow-input-invalid-open)] aria-invalid:data-[state=open]:focus-visible:border-transparent aria-invalid:data-[state=open]:focus-visible:shadow-[var(--shadow-input-invalid-focused)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="pointer-events-none size-4 text-[var(--control-accessory-foreground)]" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  align = "center",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        data-align-trigger={position === "item-aligned"}
        className={cn(
          "relative z-[var(--z-dropdown)] max-h-(--radix-select-content-available-height) min-w-36 origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-[var(--r-md)] bg-[var(--surface-background)] text-[var(--surface-foreground)] shadow-[var(--shadow-filter)] ring-1 ring-[var(--surface-border)] duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          data-position={position}
          className={cn(
            "data-[position=popper]:h-(--radix-select-trigger-height) data-[position=popper]:w-full data-[position=popper]:min-w-(--radix-select-trigger-width)",
            position === "popper" && ""
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        "px-4 py-2 typo-label-2 text-[var(--surface-muted-foreground)]",
        className
      )}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex min-h-[var(--control-size-md)] w-full cursor-default items-center gap-1.5 rounded-[var(--r-xs)] py-2 pr-8 pl-4 typo-body-8 font-normal text-[var(--menu-item-foreground)] outline-hidden select-none hover:bg-[var(--menu-item-background-hover)] hover:text-[var(--menu-item-foreground)] focus:bg-[var(--menu-item-background-hover)] focus:text-[var(--menu-item-foreground)] active:bg-[var(--menu-item-background-active)] data-[state=checked]:bg-[var(--menu-item-selected-background)] data-[state=checked]:hover:bg-[var(--menu-item-selected-background)] data-[state=checked]:focus:bg-[var(--menu-item-selected-background)] data-[state=checked]:active:bg-[var(--menu-item-selected-background)] data-disabled:pointer-events-none data-disabled:text-[var(--menu-item-disabled-foreground)] data-disabled:opacity-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="pointer-events-none" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        "pointer-events-none -mx-1 my-1 h-px bg-[var(--surface-border)]",
        className
      )}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-[var(--surface-background)] py-1 text-[var(--surface-muted-foreground)] [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "z-10 flex cursor-default items-center justify-center bg-[var(--surface-background)] py-1 text-[var(--surface-muted-foreground)] [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}

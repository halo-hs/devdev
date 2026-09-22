"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"

import CheckIcon from "@ecoya/design-system/assets/icons/icon-checkmark.svg"
import SearchIcon from "@ecoya/design-system/assets/icons/icon-search.svg"
import { cn } from "@ecoya/design-system/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@ecoya/design-system/ui/dialog"
import { InputGroup, InputGroupAddon } from "@ecoya/design-system/ui/input-group"

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-[var(--r-lg)]! bg-[var(--surface-background)] p-1 text-[var(--surface-foreground)]",
        className
      )}
      {...props}
    />
  )
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = false,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
  className?: string
  showCloseButton?: boolean
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn(
          "top-1/3 translate-y-0 overflow-hidden rounded-[var(--r-lg)]! p-0",
          className
        )}
        showCloseButton={showCloseButton}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="p-1 pb-0">
      <InputGroup className="h-[var(--control-size-md)]! rounded-[var(--r-md)]! border-[var(--control-border)] bg-[var(--control-background)] *:data-[slot=input-group-addon]:pl-2!">
        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            "w-full min-w-0 bg-transparent px-4 py-2 text-[length:var(--text-body-9)] leading-[var(--leading-body-9)] font-normal text-[var(--control-foreground)] outline-hidden placeholder:text-[var(--control-placeholder)] disabled:cursor-not-allowed disabled:text-[var(--control-disabled-foreground)] disabled:opacity-100",
            className
          )}
          {...props}
        />
        <InputGroupAddon>
          <SearchIcon className="size-4 shrink-0 text-[var(--control-placeholder)]" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none",
        className
      )}
      {...props}
    />
  )
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn(
        "py-6 text-center typo-body-10 font-normal text-[var(--surface-muted-foreground)]",
        className
      )}
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden p-1 text-[var(--surface-foreground)] **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:typo-label-2 **:[[cmdk-group-heading]]:text-[var(--surface-muted-foreground)]",
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("-mx-1 h-px bg-[var(--surface-border)]", className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item relative flex min-h-[var(--control-size-md)] cursor-default items-center gap-2 rounded-[var(--r-xs)] px-4 py-2 typo-body-9 font-normal text-[var(--menu-item-foreground)] outline-hidden select-none hover:bg-[var(--menu-item-background-hover)] active:bg-[var(--menu-item-background-active)] in-data-[slot=dialog-content]:rounded-[var(--r-xs)]! data-[disabled=true]:pointer-events-none data-[disabled=true]:text-[var(--menu-item-disabled-foreground)] data-[disabled=true]:opacity-100 data-selected:bg-[var(--menu-item-selected-background)] data-selected:text-[var(--menu-item-foreground)] data-selected:hover:bg-[var(--menu-item-selected-background)] data-selected:active:bg-[var(--menu-item-selected-background)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-selected:*:[svg]:text-[var(--menu-item-foreground)]",
        className
      )}
      {...props}
    >
      {children}
      <CheckIcon className="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
    </CommandPrimitive.Item>
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto typo-label-3 tracking-shortcut text-[var(--surface-muted-foreground)] group-data-selected/command-item:text-[var(--menu-item-foreground)]",
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}

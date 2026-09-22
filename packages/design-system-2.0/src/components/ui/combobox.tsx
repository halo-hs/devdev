"use client"

import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react"

import { cn } from "@ecoya/design-system/lib/utils"
import { Button } from "@ecoya/design-system/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@ecoya/design-system/ui/input-group"
import { ChevronDownIcon, XIcon, CheckIcon } from "lucide-react"

const Combobox = ComboboxPrimitive.Root

function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />
}

function ComboboxTrigger({
  className,
  children,
  "aria-label": ariaLabel = "Open options",
  ...props
}: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      aria-label={ariaLabel}
      className={cn(
        "bg-transparent! text-[var(--control-accessory-foreground)]! shadow-none! hover:bg-[var(--control-accessory-background-hover)]! active:bg-[var(--control-accessory-background-open)]! aria-expanded:bg-[var(--control-accessory-background-open)]! data-popup-open:bg-[var(--control-accessory-background-open)]! data-pressed:bg-[var(--control-accessory-background-open)]! data-disabled:bg-transparent! data-disabled:text-[var(--control-disabled-foreground)]! [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon className="pointer-events-none size-4 text-[var(--control-accessory-foreground)]" />
    </ComboboxPrimitive.Trigger>
  )
}

function ComboboxClear({
  className,
  "aria-label": ariaLabel = "Clear selection",
  ...props
}: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      render={<InputGroupButton variant="ghost" size="icon-xs" />}
      className={cn(
        "bg-transparent! text-[var(--control-clear-foreground)]! shadow-none! hover:bg-[var(--control-accessory-background-hover)]! hover:text-[var(--control-clear-foreground-hover)]! active:bg-[var(--control-accessory-background-open)]! data-popup-open:bg-[var(--control-accessory-background-open)]! data-disabled:bg-transparent! data-disabled:text-[var(--control-disabled-foreground)]!",
        className
      )}
      aria-label={ariaLabel}
      {...props}
    >
      <XIcon className="pointer-events-none" />
    </ComboboxPrimitive.Clear>
  )
}

function ComboboxInput({
  className,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  ...props
}: ComboboxPrimitive.Input.Props & {
  showTrigger?: boolean
  showClear?: boolean
}) {
  return (
    <InputGroup
      className={cn(
        "w-auto active:border-[var(--control-border-active)] active:bg-[var(--control-background-active)] active:shadow-[var(--shadow-input-active)] has-[[data-slot=input-group-control]:disabled]:active:border-[var(--control-disabled-border)] has-[[data-slot=input-group-control]:disabled]:active:bg-[var(--control-disabled-background)] has-[[data-slot=input-group-control]:disabled]:active:shadow-[var(--shadow-input)] has-[[data-slot=input-group-control][aria-invalid=true]]:hover:border-[var(--control-invalid-border)] has-[[data-slot=input-group-control][aria-invalid=true]]:active:border-[var(--control-invalid-border)] has-[[data-slot=input-group-control][aria-invalid=true]]:active:shadow-[var(--shadow-input-invalid-active)] has-[[data-slot=input-group-control][aria-invalid=true][data-popup-open]]:border-[var(--control-invalid-border)] has-[[data-slot=input-group-control][aria-invalid=true][data-popup-open]]:shadow-[var(--shadow-input-invalid-open)]",
        className
      )}
    >
      <ComboboxPrimitive.Input
        render={
          <InputGroupInput
            disabled={disabled}
            className="typo-body-8 font-normal disabled:placeholder:text-[var(--control-disabled-foreground)]"
          />
        }
        {...props}
      />
      <InputGroupAddon align="inline-end">
        {showTrigger && (
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            asChild
            data-slot="input-group-button"
            className="group-has-data-[slot=combobox-clear]/input-group:hidden"
            disabled={disabled}
          >
            <ComboboxTrigger />
          </InputGroupButton>
        )}
        {showClear && <ComboboxClear disabled={disabled} />}
      </InputGroupAddon>
      {children}
    </InputGroup>
  )
}

function ComboboxContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<
    ComboboxPrimitive.Positioner.Props,
    "side" | "align" | "sideOffset" | "alignOffset" | "anchor"
  >) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="isolate z-[var(--z-dropdown)]"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          data-chips={!!anchor}
          className={cn(
            "group/combobox-content relative max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-[min(calc(var(--anchor-width)+--spacing(7)),var(--available-width))] origin-(--transform-origin) overflow-hidden rounded-[var(--r-md)] bg-[var(--surface-background)] text-[var(--surface-foreground)] shadow-[var(--shadow-filter)] ring-1 ring-[var(--surface-border)] duration-100 data-[chips=true]:min-w-[min(var(--anchor-width),var(--available-width))] data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 *:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mb-0 *:data-[slot=input-group]:h-[var(--control-size-md)] *:data-[slot=input-group]:border-[var(--control-border)] *:data-[slot=input-group]:bg-[var(--control-background)] *:data-[slot=input-group]:shadow-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn(
        "no-scrollbar max-h-[min(calc(--spacing(72)---spacing(9)),calc(var(--available-height)---spacing(9)))] scroll-py-1 overflow-y-auto overscroll-contain p-1 data-empty:p-0",
        className
      )}
      {...props}
    />
  )
}

function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex min-h-[var(--control-size-md)] w-full cursor-default items-center gap-2 rounded-[var(--r-xs)] py-2 pr-8 pl-4 typo-body-8 font-normal text-[var(--menu-item-foreground)] outline-hidden select-none hover:bg-[var(--menu-item-background-hover)] active:bg-[var(--menu-item-background-active)] data-highlighted:bg-[var(--menu-item-background-hover)] data-[selected]:bg-[var(--menu-item-selected-background)] data-[selected]:text-[var(--menu-item-foreground)] data-[selected]:hover:bg-[var(--menu-item-selected-background)] data-[selected]:active:bg-[var(--menu-item-selected-background)] data-[selected]:data-[highlighted]:bg-[var(--menu-item-selected-background)] data-disabled:pointer-events-none data-disabled:text-[var(--menu-item-disabled-foreground)] data-disabled:opacity-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <CheckIcon className="pointer-events-none" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  )
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return (
    <ComboboxPrimitive.Group
      data-slot="combobox-group"
      className={cn(className)}
      {...props}
    />
  )
}

function ComboboxLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-label"
      className={cn(
        "px-2 py-1.5 typo-label-2 text-[var(--surface-muted-foreground)]",
        className
      )}
      {...props}
    />
  )
}

function ComboboxCollection({ ...props }: ComboboxPrimitive.Collection.Props) {
  return (
    <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
  )
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        "hidden w-full justify-center py-2 text-center typo-body-10 font-normal text-[var(--surface-muted-foreground)] group-data-empty/combobox-content:flex",
        className
      )}
      {...props}
    />
  )
}

function ComboboxSeparator({
  className,
  ...props
}: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      className={cn("-mx-1 my-1 h-px bg-[var(--surface-border)]", className)}
      {...props}
    />
  )
}

function ComboboxChips({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof ComboboxPrimitive.Chips> &
  ComboboxPrimitive.Chips.Props) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn(
        "flex min-h-[var(--control-size-md)] flex-wrap items-center gap-1 rounded-[var(--r-md)] border border-[var(--control-border)] bg-[var(--control-background)] bg-clip-padding px-4 py-1 text-[length:var(--text-body-8)] leading-[var(--leading-body-8)] font-normal text-[var(--control-foreground)] shadow-[var(--shadow-input)] transition-[border-color,box-shadow,background-color,color] hover:border-[var(--control-border-hover)] hover:bg-[var(--control-background-hover)] hover:shadow-[var(--shadow-input-hover)] active:border-[var(--control-border-active)] active:bg-[var(--control-background-active)] active:shadow-[var(--shadow-input-active)] has-aria-invalid:border-[var(--control-invalid-border)] has-aria-invalid:hover:border-[var(--control-invalid-border)] has-aria-invalid:active:border-[var(--control-invalid-border)] has-aria-invalid:active:shadow-[var(--shadow-input-invalid-active)] has-data-[slot=combobox-chip]:px-1 has-[[data-slot=combobox-chip-input]:disabled]:cursor-not-allowed has-[[data-slot=combobox-chip-input]:disabled]:border-[var(--control-disabled-border)] has-[[data-slot=combobox-chip-input]:disabled]:bg-[var(--control-disabled-background)] has-[[data-slot=combobox-chip-input]:disabled]:text-[var(--control-disabled-foreground)] has-[[data-slot=combobox-chip-input]:disabled]:opacity-100 has-[[data-slot=combobox-chip-input]:disabled]:active:border-[var(--control-disabled-border)] has-[[data-slot=combobox-chip-input]:disabled]:active:bg-[var(--control-disabled-background)] has-[[data-slot=combobox-chip-input]:disabled]:active:shadow-[var(--shadow-input)] has-[[data-slot=combobox-chip-input]:focus-visible]:border-[var(--control-focus-border)] has-[[data-slot=combobox-chip-input]:focus-visible]:shadow-[var(--shadow-input-focused)] active:has-[[data-slot=combobox-chip-input]:focus-visible]:shadow-[var(--shadow-input-focused)] has-[[data-slot=combobox-chip-input][aria-invalid=true]:focus-visible]:shadow-[var(--shadow-input-invalid-focused)] active:has-[[data-slot=combobox-chip-input][aria-invalid=true]:focus-visible]:shadow-[var(--shadow-input-invalid-focused)] has-[[data-slot=combobox-chip-input][aria-invalid=true][data-popup-open]]:border-[var(--control-invalid-border)] has-[[data-slot=combobox-chip-input][aria-invalid=true][data-popup-open]]:shadow-[var(--shadow-input-invalid-open)] has-[[data-slot=combobox-chip-input][aria-invalid=true][data-popup-open]:focus-visible]:shadow-[var(--shadow-input-invalid-focused)] has-[[data-slot=combobox-chip-input][data-popup-open]]:border-[var(--control-focus-border)] has-[[data-slot=combobox-chip-input][data-popup-open]]:bg-[var(--control-background-open)] has-[[data-slot=combobox-chip-input][data-popup-open]]:shadow-[var(--shadow-input-open)] has-[[data-slot=combobox-chip-input][data-popup-open]:focus-visible]:shadow-[var(--shadow-input-focused)]",
        className
      )}
      {...props}
    />
  )
}

function ComboboxChip({
  className,
  children,
  showRemove = true,
  removeLabel = "Remove item",
  ...props
}: ComboboxPrimitive.Chip.Props & {
  showRemove?: boolean
  removeLabel?: string
}) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        "flex h-[var(--control-size-xs)] w-fit items-center justify-center gap-1 rounded-[var(--r-sm)] bg-[var(--badge-default-background)] px-1.5 typo-button-3 whitespace-nowrap text-[var(--badge-default-foreground)] hover:bg-[var(--badge-default-background-hover)] active:bg-[var(--badge-default-background-active)] has-data-[slot=combobox-chip-remove]:pr-0 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:bg-[var(--control-disabled-background)] aria-disabled:text-[var(--control-disabled-foreground)] aria-disabled:opacity-100 data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:bg-[var(--control-disabled-background)] data-[disabled]:text-[var(--control-disabled-foreground)] data-[disabled]:opacity-100",
        className
      )}
      {...props}
    >
      {children}
      {showRemove && (
        <ComboboxPrimitive.ChipRemove
          render={<Button variant="ghost" size="icon-xs" />}
          className="-ml-1 text-[var(--surface-muted-foreground)] hover:text-[var(--surface-foreground)] active:text-[var(--surface-foreground)]"
          data-slot="combobox-chip-remove"
          aria-label={removeLabel}
        >
          <XIcon className="pointer-events-none" />
        </ComboboxPrimitive.ChipRemove>
      )}
    </ComboboxPrimitive.Chip>
  )
}

function ComboboxChipsInput({
  className,
  ...props
}: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-chip-input"
      className={cn(
        "min-w-16 flex-1 bg-transparent typo-body-8 font-normal text-[var(--control-foreground)] outline-none placeholder:text-[var(--control-placeholder)] disabled:cursor-not-allowed disabled:text-[var(--control-disabled-foreground)] disabled:opacity-100 disabled:placeholder:text-[var(--control-disabled-foreground)]",
        className
      )}
      {...props}
    />
  )
}

function useComboboxAnchor() {
  return React.useRef<HTMLDivElement | null>(null)
}

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
}

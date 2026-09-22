"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@ecoya/design-system/lib/utils"
import { Button } from "@ecoya/design-system/ui/button"
import { Input } from "@ecoya/design-system/ui/input"
import { Textarea } from "@ecoya/design-system/ui/textarea"

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "group/input-group relative flex h-[var(--control-size-md)] w-full min-w-0 items-center rounded-[var(--r-md)] border border-[var(--control-border)] bg-[var(--control-background)] text-[var(--control-foreground)] shadow-[var(--shadow-input)] transition-[border-color,box-shadow,background-color,color] outline-none hover:border-[var(--control-border-hover)] hover:bg-[var(--control-background-hover)] hover:shadow-[var(--shadow-input-hover)] active:border-[var(--control-border-active)] active:bg-[var(--control-background-active)] active:shadow-[var(--shadow-input-active)] in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0 has-disabled:border-[var(--control-disabled-border)] has-disabled:bg-[var(--control-disabled-background)] has-disabled:text-[var(--control-disabled-foreground)] has-disabled:opacity-100 has-disabled:active:border-[var(--control-disabled-border)] has-disabled:active:bg-[var(--control-disabled-background)] has-disabled:active:shadow-[var(--shadow-input)] has-[[data-slot=input-group-control]:focus-visible]:border-[var(--control-focus-border)] has-[[data-slot=input-group-control]:focus-visible]:shadow-[var(--shadow-input-focused)] has-[[data-slot=input-group-control]:focus-visible]:ring-0 active:has-[[data-slot=input-group-control]:focus-visible]:shadow-[var(--shadow-input-focused)] has-[[data-slot=input-group-control][data-popup-open]]:border-[var(--control-focus-border)] has-[[data-slot=input-group-control][data-popup-open]]:bg-[var(--control-background-open)] has-[[data-slot=input-group-control][data-popup-open]]:shadow-[var(--shadow-input-open)] has-[[data-slot=input-group-control][data-popup-open]:focus-visible]:shadow-[var(--shadow-input-focused)] has-[[data-slot][aria-invalid=true]]:border-[var(--control-invalid-border)] has-[[data-slot][aria-invalid=true]]:shadow-[var(--shadow-input)] has-[[data-slot][aria-invalid=true]]:ring-0 has-[[data-slot][aria-invalid=true]]:active:border-[var(--control-invalid-border)] has-[[data-slot][aria-invalid=true]]:active:shadow-[var(--shadow-input-invalid-active)] has-[[data-slot][aria-invalid=true]:focus-visible]:shadow-[var(--shadow-input-invalid-focused)] active:has-[[data-slot][aria-invalid=true]:focus-visible]:shadow-[var(--shadow-input-invalid-focused)] has-[[data-slot][aria-invalid=true][data-popup-open]]:border-[var(--control-invalid-border)] has-[[data-slot][aria-invalid=true][data-popup-open]]:shadow-[var(--shadow-input-invalid-open)] has-[[data-slot][aria-invalid=true][data-popup-open]:focus-visible]:shadow-[var(--shadow-input-invalid-focused)] has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pr-1.5 has-[>[data-align=inline-start]]:[&>input]:pl-1.5",
        className
      )}
      {...props}
    />
  )
}

const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium text-[var(--control-accessory-foreground)] select-none group-has-disabled/input-group:text-[var(--control-disabled-foreground)] group-has-disabled/input-group:opacity-100 group-data-[disabled=true]/input-group:text-[var(--control-disabled-foreground)] group-data-[disabled=true]/input-group:opacity-100 [&>kbd]:rounded-[var(--r-xs)] [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        "inline-start":
          "order-first pl-2 has-[>button]:ml-[-0.3rem] has-[>kbd]:ml-[-0.15rem]",
        "inline-end":
          "order-last pr-2 has-[>button]:mr-[-0.3rem] has-[>kbd]:mr-[-0.15rem]",
        "block-start":
          "order-first w-full justify-start px-2.5 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2",
        "block-end":
          "order-last w-full justify-start px-2.5 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
)

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          return
        }
        e.currentTarget.parentElement?.querySelector("input")?.focus()
      }}
      {...props}
    />
  )
}

const inputGroupButtonVariants = cva(
  "flex items-center gap-2 text-sm shadow-none",
  {
    variants: {
      size: {
        xs: "h-[var(--control-size-xs)] gap-1 rounded-[var(--r-sm)] px-1.5 [&>svg:not([class*='size-'])]:size-3.5",
        sm: "",
        "icon-xs":
          "size-[var(--control-size-xs)] rounded-[var(--r-sm)] p-0 has-[>svg]:p-0",
        "icon-sm": "size-[var(--control-size-sm)] p-0 has-[>svg]:p-0",
      },
    },
    defaultVariants: {
      size: "xs",
    },
  }
)

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size"> &
  VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  )
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-sm text-[var(--control-accessory-foreground)] group-has-disabled/input-group:text-[var(--control-disabled-foreground)] group-has-disabled/input-group:opacity-100 group-data-[disabled=true]/input-group:text-[var(--control-disabled-foreground)] group-data-[disabled=true]/input-group:opacity-100 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "flex-1 rounded-none border-0! bg-transparent shadow-none! ring-0 hover:border-0 hover:shadow-none focus-visible:border-0 focus-visible:shadow-none focus-visible:ring-0 disabled:bg-transparent aria-invalid:border-0 aria-invalid:shadow-none aria-invalid:ring-0",
        className
      )}
      {...props}
    />
  )
}

function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        "flex-1 resize-none rounded-none border-0! bg-transparent py-2 shadow-none! ring-0 hover:border-0 hover:shadow-none focus-visible:border-0 focus-visible:shadow-none focus-visible:ring-0 disabled:bg-transparent aria-invalid:border-0 aria-invalid:shadow-none aria-invalid:ring-0",
        className
      )}
      {...props}
    />
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
}

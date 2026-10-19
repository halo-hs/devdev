import type { ComponentProps } from "react"
import { DrawerTitle as DSDrawerTitle, DrawerDescription as DSDrawerDescription } from "@ecoya/design-system/ui/drawer"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/drawer"

function DrawerTitle({ className, ...props }: ComponentProps<typeof DSDrawerTitle>) {
  return <DSDrawerTitle {...props} className={cn("text-[length:var(--text-compat-body-5-5)] leading-[var(--leading-header-5)] font-bold", className)} />
}

function DrawerDescription({ className, ...props }: ComponentProps<typeof DSDrawerDescription>) {
  return <DSDrawerDescription {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal", className)} />
}

export { DrawerTitle, DrawerDescription }

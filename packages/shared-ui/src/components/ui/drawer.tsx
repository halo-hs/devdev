import type { ComponentProps } from "react"
import { DrawerTitle as DSDrawerTitle, DrawerDescription as DSDrawerDescription } from "@ecoya/design-system/ui/drawer"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/drawer"

function DrawerTitle({ className, ...props }: ComponentProps<typeof DSDrawerTitle>) {
  return <DSDrawerTitle {...props} className={cn("text-[length:var(--text-heading-xs)] leading-[var(--leading-heading-xs)] font-bold", className)} />
}

function DrawerDescription({ className, ...props }: ComponentProps<typeof DSDrawerDescription>) {
  return <DSDrawerDescription {...props} className={cn("text-[length:var(--text-body-md)] leading-[var(--leading-body-md)] font-normal", className)} />
}

export { DrawerTitle, DrawerDescription }

import type { ComponentProps } from "react"
import { SidebarMenuButton as DSSidebarMenuButton } from "@ecoya/design-system/ui/sidebar"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/sidebar"

function SidebarMenuButton({ className, size = "default", ...props }: ComponentProps<typeof DSSidebarMenuButton>) {
  return <DSSidebarMenuButton {...props} size={size} className={cn(
    "gap-3 px-1.5 text-[length:var(--text-body-md)] leading-[var(--leading-body-md)] font-normal text-[var(--component-description)] data-active:font-normal [&_svg]:size-5",
    size === "default" && "h-9",
    "group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-2.5! group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:[&>span:not([data-nav-icon])]:hidden",
    className,
  )} />
}

export { SidebarMenuButton }

import type { ComponentProps } from "react"
import { SidebarMenuButton as DSSidebarMenuButton } from "@/components/ds2/ui/Sidebar"
import { cn } from "@/lib/utils"

export * from "@/components/ds2/ui/Sidebar"

function SidebarMenuButton({ className, size = "default", ...props }: ComponentProps<typeof DSSidebarMenuButton>) {
  return <DSSidebarMenuButton {...props} size={size} className={cn(
    "gap-3 px-1.5 text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal text-[var(--color-gray-4)] data-active:font-normal [&_svg]:size-5",
    size === "default" && "h-9",
    "group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-2.5! group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:[&>span:not([data-nav-icon])]:hidden",
    className,
  )} />
}

export { SidebarMenuButton }

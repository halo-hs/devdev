import type { ComponentProps } from "react"
import {
  Breadcrumb as DSBreadcrumb,
  BreadcrumbEllipsis as DSBreadcrumbEllipsis,
  BreadcrumbItem as DSBreadcrumbItem,
  BreadcrumbLink as DSBreadcrumbLink,
  BreadcrumbPage as DSBreadcrumbPage,
  BreadcrumbSeparator as DSBreadcrumbSeparator,
  BreadcrumbList as DSBreadcrumbList,
} from "@ecoya/design-system/ui/breadcrumb"
import { cn } from "@shared/lib/utils"

// Figma navigation uses the body-md role for every breadcrumb item: 15/22,
// 6px between items, and a 14px chevron separator.
function Breadcrumb({ className, ...props }: ComponentProps<typeof DSBreadcrumb>) {
  return <DSBreadcrumb {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)]", className)} />
}

function BreadcrumbList({ className, ...props }: ComponentProps<typeof DSBreadcrumbList>) {
  return <DSBreadcrumbList {...props} className={cn("gap-1.5 text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)]", className)} />
}

function BreadcrumbItem({ className, ...props }: ComponentProps<typeof DSBreadcrumbItem>) {
  return <DSBreadcrumbItem {...props} className={cn("gap-1.5", className)} />
}

function BreadcrumbLink({ className, ...props }: ComponentProps<typeof DSBreadcrumbLink>) {
  return <DSBreadcrumbLink {...props} className={cn("font-normal text-[var(--color-gray-4)]", className)} />
}

function BreadcrumbPage({ className, ...props }: ComponentProps<typeof DSBreadcrumbPage>) {
  return <DSBreadcrumbPage {...props} className={cn("font-normal text-[var(--color-gray-2)]", className)} />
}

function BreadcrumbSeparator({ className, ...props }: ComponentProps<typeof DSBreadcrumbSeparator>) {
  return <DSBreadcrumbSeparator {...props} className={cn("[&>svg]:size-3.5", className)} />
}

function BreadcrumbEllipsis({ className, ...props }: ComponentProps<typeof DSBreadcrumbEllipsis>) {
  return <DSBreadcrumbEllipsis {...props} className={cn("size-5 [&>svg]:size-4", className)} />
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}

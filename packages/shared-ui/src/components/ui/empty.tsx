import type { ComponentProps } from "react"
import { Empty as DSEmpty, EmptyHeader as DSEmptyHeader, EmptyTitle as DSEmptyTitle, EmptyDescription as DSEmptyDescription, EmptyContent as DSEmptyContent, EmptyMedia as DSEmptyMedia } from "@ecoya/design-system/ui/empty"
import { cn } from "@shared/lib/utils"


function Empty({ className, ...props }: ComponentProps<typeof DSEmpty>) {
  return <DSEmpty {...props} className={cn("p-4 text-[var(--color-gray-3)]", className)} />
}

function EmptyHeader({ className, ...props }: ComponentProps<typeof DSEmptyHeader>) {
  return <DSEmptyHeader {...props} className={cn("w-full max-w-none", className)} />
}

function EmptyTitle({ className, ...props }: ComponentProps<typeof DSEmptyTitle>) {
  return <DSEmptyTitle {...props} className={cn("text-[length:var(--text-body-7)] leading-[var(--leading-body-7)] font-bold tracking-normal", className)} />
}

function EmptyDescription({ className, ...props }: ComponentProps<typeof DSEmptyDescription>) {
  return <DSEmptyDescription {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] text-[var(--color-gray-3)]", className)} />
}

function EmptyContent({ className, ...props }: ComponentProps<typeof DSEmptyContent>) {
  return <DSEmptyContent {...props} className={cn("max-w-none text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)]", className)} />
}

function EmptyMedia({ className, ...props }: ComponentProps<typeof DSEmptyMedia>) {
  return <DSEmptyMedia {...props} className={cn("mb-0 bg-transparent text-[var(--color-gray-3)] [&_svg:not([class*='size-'])]:size-8", className)} />
}

export { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia }

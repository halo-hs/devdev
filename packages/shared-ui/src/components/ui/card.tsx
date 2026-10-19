import type { ComponentProps } from "react"
import { Card as DesignSystemCard, CardTitle as DSCardTitle, CardDescription as DSCardDescription, CardHeader as DSCardHeader, CardContent as DSCardContent, CardFooter as DSCardFooter, CardAction as DSCardAction } from "@ecoya/design-system/ui/card"

import { cn } from "@shared/lib/utils"


function Card({ className, ...props }: ComponentProps<typeof DesignSystemCard>) {
  return (
    <DesignSystemCard
      {...props}
      className={cn(
        "text-[length:var(--text-body-md)] leading-[var(--leading-body-md)] bg-[var(--card)] shadow-[var(--card-shadow)] ring-[var(--card-border)] has-[>[data-slot=card-header]]:[--card-shadow:var(--card-module-shadow)] has-[>[data-slot=card-header]]:ring-0 [--card-content-px:14px] [--card-content-pt:20px] has-[>[data-slot=card-header]]:[--card-content-px:20px] has-[>[data-slot=card-header]]:[--card-content-pt:16px]",
        className,
      )}
    />
  )
}

function CardTitle({ className, ...props }: ComponentProps<typeof DSCardTitle>) {
  return <DSCardTitle {...props} className={cn("text-[length:var(--text-heading-xs)] leading-[var(--leading-heading-xs)] text-[var(--component-title)]", className)} />
}

function CardDescription({ className, ...props }: ComponentProps<typeof DSCardDescription>) {
  return <DSCardDescription {...props} className={cn("text-[length:var(--text-body-md)] leading-[var(--leading-body-md)]", className)} />
}

function CardHeader({ className, ...props }: ComponentProps<typeof DSCardHeader>) {
  return <DSCardHeader {...props} className={cn("min-h-0 px-5 pt-5 pb-0", className)} />
}

function CardContent({ className, ...props }: ComponentProps<typeof DSCardContent>) {
  return <DSCardContent {...props} className={cn("px-[var(--card-content-px)] pt-[var(--card-content-pt)] pb-5 [&:has(+[data-slot=card-footer])]:pb-4 data-[layout=flush-table]:mt-4", className)} />
}

function CardFooter({ className, ...props }: ComponentProps<typeof DSCardFooter>) {
  return <DSCardFooter {...props} className={cn("mx-[var(--card-content-px)] mb-5 min-h-5 gap-3 border-[var(--component-subtle-outline)] p-0 not-empty:py-2.5 group-data-[size=sm]/card:p-0 group-data-[size=sm]/card:not-empty:py-2.5", className)} />
}

function CardAction({ className, ...props }: ComponentProps<typeof DSCardAction>) {
  return <DSCardAction {...props} className={cn("self-end", className)} />
}

export { Card, CardTitle, CardDescription, CardHeader, CardContent, CardFooter, CardAction }

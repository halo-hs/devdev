import type { ComponentProps } from "react"
import { AvatarFallback as DSAvatarFallback } from "@ecoya/design-system/ui/avatar"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/avatar"

function AvatarFallback({ className, ...props }: ComponentProps<typeof DSAvatarFallback>) {
  return <DSAvatarFallback {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal group-data-[size=sm]/avatar:text-[length:var(--text-body-8)]", className)} />
}

export { AvatarFallback }

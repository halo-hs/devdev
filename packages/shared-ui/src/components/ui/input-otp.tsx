import type { ComponentProps } from "react"
import { InputOTPSlot as DSInputOTPSlot } from "@ecoya/design-system/ui/input-otp"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/input-otp"

function InputOTPSlot({ className, ...props }: ComponentProps<typeof DSInputOTPSlot>) {
  return <DSInputOTPSlot {...props} className={cn("text-[length:var(--text-body-6)] leading-[var(--leading-body-6)] font-normal", className)} />
}

export { InputOTPSlot }

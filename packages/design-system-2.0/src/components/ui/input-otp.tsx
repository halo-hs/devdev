"use client"

import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"

import { cn } from "@ecoya/design-system/lib/utils"
import { MinusIcon } from "lucide-react"

function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "cn-input-otp group/input-otp flex items-center has-disabled:opacity-100",
        containerClassName
      )}
      spellCheck={false}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  )
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn(
        "flex items-center rounded-[var(--r-md)] has-aria-invalid:border-[var(--control-invalid-border)] has-aria-invalid:shadow-[var(--shadow-input)] has-aria-invalid:ring-0",
        className
      )}
      {...props}
    />
  )
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number
}) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "relative flex size-[var(--control-size-sm)] items-center justify-center border-y border-r border-[var(--control-border)] bg-[var(--control-background)] text-sm text-[var(--control-foreground)] shadow-[var(--shadow-input)] transition-all outline-none group-has-disabled/input-otp:border-[var(--control-disabled-border)] group-has-disabled/input-otp:bg-[var(--control-disabled-background)] group-has-disabled/input-otp:text-[var(--control-disabled-foreground)] group-has-disabled/input-otp:opacity-100 group-has-[[data-input-otp][aria-invalid=true]]/input-otp:border-[var(--control-invalid-border)] first:rounded-l-[var(--r-md)] first:border-l last:rounded-r-[var(--r-md)] aria-invalid:border-[var(--control-invalid-border)] aria-invalid:shadow-[var(--shadow-input)] data-[active=true]:z-10 data-[active=true]:border-[var(--control-focus-border)] data-[active=true]:shadow-[var(--shadow-input-focused)] data-[active=true]:ring-0 group-has-[[data-input-otp][aria-invalid=true]]/input-otp:data-[active=true]:shadow-[var(--shadow-input-invalid-focused)] data-[active=true]:aria-invalid:border-[var(--control-invalid-border)] data-[active=true]:aria-invalid:shadow-[var(--shadow-input-invalid-focused)]",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-[var(--control-foreground)] duration-1000" />
        </div>
      )}
    </div>
  )
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-separator"
      className="flex items-center [&_svg:not([class*='size-'])]:size-4"
      role="separator"
      {...props}
    >
      <MinusIcon />
    </div>
  )
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }

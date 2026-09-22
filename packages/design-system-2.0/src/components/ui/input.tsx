import * as React from "react"

import { cn } from "@ecoya/design-system/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-[var(--control-size-md)] w-full min-w-0 rounded-[var(--r-md)] border border-[var(--control-border)] bg-[var(--control-background)] px-4 py-2 text-[length:var(--text-body-9)] leading-[var(--leading-body-9)] font-normal text-[var(--control-foreground)] shadow-[var(--shadow-input)] transition-[border-color,box-shadow,background-color,color] outline-none file:inline-flex file:h-[var(--control-size-xs)] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--control-foreground)] placeholder:text-[var(--control-placeholder)] hover:border-[var(--control-border-hover)] hover:bg-[var(--control-background-hover)] hover:shadow-[var(--shadow-input-hover)] focus-visible:border-transparent focus-visible:shadow-[var(--shadow-input-focused)] focus-visible:ring-0 active:border-[var(--control-border-active)] active:bg-[var(--control-background-active)] active:shadow-[var(--shadow-input-active)] active:focus-visible:border-transparent active:focus-visible:shadow-[var(--shadow-input-focused)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-[var(--control-disabled-border)] disabled:bg-[var(--control-disabled-background)] disabled:text-[var(--control-disabled-foreground)] disabled:opacity-100 aria-invalid:border-[var(--control-invalid-border)] aria-invalid:shadow-[var(--shadow-input)] aria-invalid:ring-0 aria-invalid:focus-visible:border-transparent aria-invalid:focus-visible:shadow-[var(--shadow-input-invalid-focused)] aria-invalid:active:border-[var(--control-invalid-border)] aria-invalid:active:shadow-[var(--shadow-input-invalid-active)] aria-invalid:active:focus-visible:border-transparent aria-invalid:active:focus-visible:shadow-[var(--shadow-input-invalid-focused)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }

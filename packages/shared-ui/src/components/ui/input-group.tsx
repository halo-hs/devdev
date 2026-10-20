import type { ComponentProps } from "react"
import { InputGroup as DSInputGroup, InputGroupAddon as DSInputGroupAddon, InputGroupInput as DSInputGroupInput, InputGroupTextarea as DSInputGroupTextarea } from "@ecoya/design-system/ui/input-group"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/input-group"

// Figma InputGroup: addons sit 16px from the edge in Regular weight and the
// input keeps its own 16px padding beside them.
function InputGroup({ className, ...props }: ComponentProps<typeof DSInputGroup>) {
  return <DSInputGroup {...props} className={cn("has-[>[data-align=inline-end]]:[&>input]:pr-4! has-[>[data-align=inline-start]]:[&>input]:pl-4!", className)} />
}

function InputGroupAddon({ className, ...props }: ComponentProps<typeof DSInputGroupAddon>) {
  return <DSInputGroupAddon {...props} className={cn("font-normal data-[align=inline-end]:pr-4 data-[align=inline-start]:pl-4", className)} />
}

function InputGroupInput({ className, ...props }: ComponentProps<typeof DSInputGroupInput>) {
  return <DSInputGroupInput {...props} className={cn("text-[length:var(--text-body-6)] leading-[var(--leading-body-6)] font-normal", className)} />
}

function InputGroupTextarea({ className, ...props }: ComponentProps<typeof DSInputGroupTextarea>) {
  return <DSInputGroupTextarea {...props} className={cn("text-[length:var(--text-body-6)] leading-[var(--leading-body-6)] font-normal", className)} />
}

export { InputGroup, InputGroupAddon, InputGroupInput, InputGroupTextarea }

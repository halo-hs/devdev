import type { ComponentProps } from "react"
import { ComboboxInput as DSComboboxInput, ComboboxItem as DSComboboxItem, ComboboxChip as DSComboboxChip, ComboboxChipsInput as DSComboboxChipsInput } from "@ecoya/design-system/ui/combobox"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/combobox"

function ComboboxInput({ className, ...props }: ComponentProps<typeof DSComboboxInput>) {
  return <DSComboboxInput {...props} className={cn("[&_[data-slot=input-group-control]]:text-[length:var(--text-body-lg)] [&_[data-slot=input-group-control]]:leading-[var(--leading-body-lg)]", className)} />
}

function ComboboxItem({ className, ...props }: ComponentProps<typeof DSComboboxItem>) {
  return <DSComboboxItem {...props} className={cn("text-[length:var(--text-body-md)] leading-[var(--leading-body-md)] font-normal [--leading-body-8:var(--leading-body-md)]", className)} />
}

function ComboboxChip({ className, ...props }: ComponentProps<typeof DSComboboxChip>) {
  return <DSComboboxChip {...props} className={cn("h-7 rounded-full pl-2.5 text-[length:var(--text-body-md)] leading-[var(--leading-body-md)] font-normal [--leading-button-3:var(--leading-body-md)]", className)} />
}

function ComboboxChipsInput({ className, ...props }: ComponentProps<typeof DSComboboxChipsInput>) {
  return <DSComboboxChipsInput {...props} className={cn("text-[length:var(--text-body-lg)] leading-[var(--leading-body-lg)] font-normal [--text-body-8:var(--text-body-lg)] [--leading-body-8:var(--leading-body-lg)]", className)} />
}

export { ComboboxInput, ComboboxItem, ComboboxChip, ComboboxChipsInput }

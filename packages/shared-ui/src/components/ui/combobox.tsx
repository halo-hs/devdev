import type { ComponentProps } from "react"
import { ComboboxInput as DSComboboxInput, ComboboxItem as DSComboboxItem, ComboboxChip as DSComboboxChip, ComboboxChipsInput as DSComboboxChipsInput } from "@ecoya/design-system/ui/combobox"
import { cn } from "@shared/lib/utils"

export * from "@ecoya/design-system/ui/combobox"

function ComboboxInput({ className, ...props }: ComponentProps<typeof DSComboboxInput>) {
  return <DSComboboxInput {...props} className={cn("[&_[data-slot=input-group-control]]:text-[length:var(--text-body-6)] [&_[data-slot=input-group-control]]:leading-[var(--leading-body-6)]", className)} />
}

function ComboboxItem({ className, ...props }: ComponentProps<typeof DSComboboxItem>) {
  return <DSComboboxItem {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal [--leading-body-8:var(--text-base--line-height)]", className)} />
}

function ComboboxChip({ className, ...props }: ComponentProps<typeof DSComboboxChip>) {
  return <DSComboboxChip {...props} className={cn("h-7 rounded-full pl-2.5 text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal [--leading-button-3:var(--text-base--line-height)]", className)} />
}

function ComboboxChipsInput({ className, ...props }: ComponentProps<typeof DSComboboxChipsInput>) {
  return <DSComboboxChipsInput {...props} className={cn("text-[length:var(--text-body-6)] leading-[var(--leading-body-6)] font-normal [--text-body-8:var(--text-body-6)] [--leading-body-8:var(--leading-body-6)]", className)} />
}

export { ComboboxInput, ComboboxItem, ComboboxChip, ComboboxChipsInput }

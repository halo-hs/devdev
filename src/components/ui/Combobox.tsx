import type { ComponentProps } from "react"
import { ComboboxInput as DSComboboxInput, ComboboxContent as DSComboboxContent, ComboboxItem as DSComboboxItem, ComboboxChips as DSComboboxChips, ComboboxChip as DSComboboxChip, ComboboxChipsInput as DSComboboxChipsInput } from "@/components/ds2/ui/Combobox"
import { cn } from "@/lib/utils"

export * from "@/components/ds2/ui/Combobox"

function ComboboxInput({ className, ...props }: ComponentProps<typeof DSComboboxInput>) {
  return <DSComboboxInput {...props} className={cn("[&_[data-slot=input-group-control]]:text-[length:var(--text-body-6)] [&_[data-slot=input-group-control]]:leading-[var(--leading-body-6)]", className)} />
}

// Figma list: Gray 9 outline.
function ComboboxContent({ className, ...props }: ComponentProps<typeof DSComboboxContent>) {
  return <DSComboboxContent {...props} className={cn("ring-[var(--color-gray-10)]", className)} />
}

// Figma item: selected rows and the check use Blue 4 on Blue 10.
function ComboboxItem({ className, ...props }: ComponentProps<typeof DSComboboxItem>) {
  return <DSComboboxItem {...props} className={cn("text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal [--leading-body-8:var(--text-base--line-height)] data-selected:text-[var(--accent-foreground)] [&_svg]:text-[var(--accent-foreground)]", className)} />
}

function ComboboxChips({ className, ...props }: ComponentProps<typeof DSComboboxChips>) {
  return <DSComboboxChips {...props} className={cn("has-data-[slot=combobox-chip]:px-4", className)} />
}

// Figma chip (blue): Blue 10 / Blue 4, hover adds a Blue 4 border, pressed turns Blue 1 with white text.
function ComboboxChip({ className, ...props }: ComponentProps<typeof DSComboboxChip>) {
  return <DSComboboxChip {...props} className={cn("h-7 rounded-full pl-2.5 text-[length:var(--text-body-8)] leading-[var(--text-base--line-height)] font-normal [--leading-button-3:var(--text-base--line-height)] border border-transparent bg-[var(--accent)] text-[var(--accent-foreground)] hover:border-[var(--color-primary-4)] hover:bg-[var(--accent)] active:bg-[var(--color-primary-1)] active:text-[var(--color-gray-12)] [&_[data-slot=combobox-chip-remove]]:text-[var(--accent-foreground)] active:[&_[data-slot=combobox-chip-remove]]:text-[var(--color-gray-12)] aria-disabled:[&_[data-slot=combobox-chip-remove]]:text-[var(--control-placeholder)]", className)} />
}

function ComboboxChipsInput({ className, ...props }: ComponentProps<typeof DSComboboxChipsInput>) {
  return <DSComboboxChipsInput {...props} className={cn("text-[length:var(--text-body-6)] leading-[var(--leading-body-6)] font-normal [--text-body-8:var(--text-body-6)] [--leading-body-8:var(--leading-body-6)]", className)} />
}

export { ComboboxInput, ComboboxContent, ComboboxItem, ComboboxChips, ComboboxChip, ComboboxChipsInput }

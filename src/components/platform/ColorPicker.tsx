import { useState } from "react"
import { ChevronDown } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Figma ColorPicker (4091:9783) palette.
const COLOR_PICKER_PALETTE = [
  "#2563eb",
  "#1e3a8a",
  "#059669",
  "#6b7280",
  "#7c3aed",
  "#ea580c",
  "#dc2626",
  "#111827",
] as const

// Figma ColorPicker: 68×40 trigger (24px swatch + chevron, Input border rule)
// opening a Popover of 38px swatches; the selected one gets a Blue 4 ring.
function ColorPicker({
  value,
  onChange,
  label,
  disabled,
  invalid,
  palette = COLOR_PICKER_PALETTE,
  className,
}: {
  value: string
  onChange: (color: string) => void
  label: string
  disabled?: boolean
  invalid?: boolean
  palette?: readonly string[]
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const current = value.toLowerCase()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-slot="color-picker"
          aria-label={label}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          className={cn(
            "flex h-10 w-[68px] shrink-0 items-center gap-2 rounded-[var(--r-md)] border border-[var(--control-border)] bg-[var(--control-background)] pr-2.5 pl-2 shadow-[var(--shadow-input)] outline-none hover:border-[var(--control-border-hover)] focus-visible:shadow-[var(--shadow-input-focused)] disabled:cursor-default disabled:opacity-60 aria-expanded:border-[var(--color-primary-4)] aria-expanded:shadow-[0_0_0_3px_rgb(22_109_215/0.2)] aria-invalid:border-[var(--color-red-2)]",
            className
          )}
        >
          <span aria-hidden="true" className="size-6 shrink-0 rounded-[6px]" style={{ backgroundColor: value }} />
          <ChevronDown aria-hidden="true" className="size-4 text-[var(--color-gray-2)]" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="flex w-[196px] flex-row flex-wrap gap-2 rounded-[var(--r-lg)] p-2.5">
        {palette.map((color) => {
          const selected = color.toLowerCase() === current
          return (
            <button
              key={color}
              type="button"
              aria-label={color}
              aria-pressed={selected}
              className={cn(
                "size-[38px] shrink-0 rounded-[var(--r-md)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-4)]",
                selected && "border-[3px] border-white shadow-[0_0_0_2px_var(--color-primary-4)]"
              )}
              style={{ backgroundColor: color }}
              onClick={() => {
                onChange(color)
                setOpen(false)
              }}
            />
          )
        })}
        {/* Free choice: the native color dialog behind a rainbow tile, selected
            when the current value is not one of the palette colors. */}
        <label
          aria-label={`${label} 직접 선택`}
          className={cn(
            "relative size-[38px] shrink-0 cursor-pointer overflow-hidden rounded-[var(--r-md)] bg-[conic-gradient(from_0deg,#ef4444,#f59e0b,#22c55e,#06b6d4,#3b82f6,#a855f7,#ef4444)] focus-within:ring-2 focus-within:ring-[var(--color-primary-4)]",
            !palette.some((color) => color.toLowerCase() === current) &&
              "border-[3px] border-white shadow-[0_0_0_2px_var(--color-primary-4)]"
          )}
        >
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
      </PopoverContent>
    </Popover>
  )
}

export { ColorPicker, COLOR_PICKER_PALETTE }

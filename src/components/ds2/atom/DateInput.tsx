import { DatePicker } from "@/components/ds2/extensions/date-picker"
import { cn } from "@/lib/utils"

function parse(value: string | undefined, mode: "date" | "month") {
  if (!value) return null
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month) return null
  return new Date(year, month - 1, mode === "month" ? 1 : day || 1)
}

// String-valued wrapper over the DS DatePicker (Figma DatePicker 153:992) so
// screens that kept "YYYY-MM-DD" / "YYYY-MM" strings for native date inputs can
// switch to the shared calendar without changing their state shape.
function DateInput({
  value,
  onValueChange,
  mode = "date",
  min,
  max,
  ariaLabel,
  placeholder,
  disabled,
  invalid,
  id,
  className,
}: {
  value: string
  onValueChange: (value: string) => void
  mode?: "date" | "month"
  min?: string
  max?: string
  ariaLabel: string
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  id?: string
  className?: string
}) {
  return (
    <DatePicker
      id={id}
      aria-invalid={invalid || undefined}
      mode={mode}
      ariaLabel={ariaLabel}
      placeholder={placeholder ?? (mode === "month" ? "연도. 월." : "연도. 월. 일.")}
      disabled={disabled}
      // Figma DatePicker (153:992): no clear X on a filled field, no Today row.
      allowClear={false}
      showToday={false}
      className={cn("min-w-0 [&>button]:w-full", className)}
      format={mode === "month" ? "yyyy-MM" : "yyyy-MM-dd"}
      value={parse(value, mode)}
      minDate={parse(min, mode) ?? undefined}
      maxDate={parse(max, mode) ?? undefined}
      onChange={(_date, formatted) => onValueChange(formatted ?? "")}
    />
  )
}

export { DateInput }

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export function AppSelect({
  value,
  onValueChange,
  options,
  className,
  placeholder,
  ariaLabel,
}: {
  value: string
  onValueChange: (value: string) => void
  options: Array<string | [string, string]>
  className?: string
  placeholder?: string
  ariaLabel?: string
}) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => onValueChange(nextValue ?? value)}
    >
      <SelectTrigger
        className={cn("h-8 w-full", className)}
        aria-label={ariaLabel}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => {
          const [optionValue, optionLabel] = Array.isArray(option)
            ? option
            : [option, option]
          return (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

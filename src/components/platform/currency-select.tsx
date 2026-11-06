import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ACTIVE_CURRENCIES } from "@/lib/currencyInput"

export function CurrencySelect({ value, onChange, disabled, label, className, id }: {
  value: string; onChange: (value: string) => void; disabled?: boolean; label: string; className?: string; id?: string
}) {
  return <Select value={value} onValueChange={next => { if (next) onChange(next) }} disabled={disabled}>
    <SelectTrigger id={id} aria-label={label} className={className}><SelectValue /></SelectTrigger>
    <SelectContent>
      {value && !(ACTIVE_CURRENCIES as readonly string[]).includes(value) && <SelectItem value={value} disabled>{value}</SelectItem>}
      {ACTIVE_CURRENCIES.map(currency => <SelectItem key={currency} value={currency}>{currency}</SelectItem>)}
    </SelectContent>
  </Select>
}

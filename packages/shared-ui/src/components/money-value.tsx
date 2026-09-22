import { Tooltip, TooltipContent, TooltipTrigger } from "@shared/components/ui/tooltip"
import { cn } from "@shared/lib/utils"

type NumericDisplayMode = "list" | "detail" | "currency"

type NumericValueProps = {
  value: string | number
  mode?: NumericDisplayMode
  currency?: string
  className?: string
}

const currencyFractionDigits: Record<string, number> = {
  KRW: 0,
  JPY: 0,
  USD: 2,
  EUR: 2,
  GBP: 2,
  CNY: 2,
}

function fractionDigitsFor(mode: NumericDisplayMode, currency?: string) {
  if (mode === "list") return 4
  if (mode === "detail") return 6
  return currencyFractionDigits[currency ?? ""] ?? 2
}

function formatExactSource(integer: string, fraction: string) {
  const sign = integer.startsWith("-") || integer.startsWith("+") ? integer[0] : ""
  const digits = sign ? integer.slice(1) : integer
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return `${sign}${grouped}${fraction ? `.${fraction}` : ""}`
}

function getNumericText({
  value,
  mode = "list",
  currency,
}: Pick<NumericValueProps, "value" | "mode" | "currency">) {
  const source = String(value).trim().replaceAll(",", "")
  const match = source.match(/^([+-]?\d+)(?:\.(\d+))?$/)

  if (!match) {
    const fallback = `${value}${currency ? ` ${currency}` : ""}`
    return { display: fallback, full: fallback, showTooltip: false }
  }

  const scale = fractionDigitsFor(mode, currency)
  const parsed = Number(source)
  const suffix = currency ? ` ${currency}` : ""
  const display = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: mode === "currency" ? scale : 0,
    maximumFractionDigits: scale,
  }).format(parsed)
  const sourceFraction = match[2] ?? ""
  const full = formatExactSource(match[1], sourceFraction)

  return {
    display: `${display}${suffix}`,
    full: `${full}${suffix}`,
    // ERP의 계산 원본은 최대 6자리까지 보존한다. 소수가 2자리를 넘으면
    // 목록/상세 표시와 별개로 원본 전체를 항상 확인할 수 있게 한다.
    showTooltip: sourceFraction.length > 2,
  }
}

export function NumericValue({
  value,
  mode = "list",
  currency,
  className,
}: NumericValueProps) {
  const text = getNumericText({ value, mode, currency })
  const label = (
    <span
      className={cn("tabular-nums", text.showTooltip && "cursor-help underline decoration-dotted underline-offset-4", className)}
      aria-label={text.full}
    >
      {text.display}
    </span>
  )

  if (!text.showTooltip) return label

  return (
    <Tooltip>
      <TooltipTrigger asChild>{label}</TooltipTrigger>
      <TooltipContent>{text.full}</TooltipContent>
    </Tooltip>
  )
}

export function MoneyValue(props: Omit<NumericValueProps, "mode">) {
  return <NumericValue {...props} mode="currency" />
}

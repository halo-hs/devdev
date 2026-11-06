export const ACTIVE_CURRENCIES = ["USD", "KRW", "EUR", "JPY", "CNY", "GBP", "VND", "THB", "SGD", "HKD"] as const
export const DEFAULT_CURRENCY = "USD"
export function currencyDigits(currency: string = DEFAULT_CURRENCY) {
  return ["KRW", "JPY", "VND"].includes(currency.toUpperCase()) ? 0 : 2
}
export function validCurrencyAmount(value: string, currency: string = DEFAULT_CURRENCY) {
  return (ACTIVE_CURRENCIES as readonly string[]).includes(currency.toUpperCase()) &&
    new RegExp(`^\\d+(?:\\.\\d{1,${currencyDigits(currency) || 1}})?$`).test(value) &&
    (value.split(".")[1]?.length ?? 0) <= currencyDigits(currency)
}
export function validNumericPaste(value: string) {
  return /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d*)?$/.test(value.trim())
}

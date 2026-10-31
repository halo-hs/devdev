import { ChevronDown, Languages } from "lucide-react"
import { useLocale, setLocale, type Locale } from "./useLocale"

const localeOptions = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
] as const

export function LocaleToggle() {
  const locale = useLocale()
  const selectedOption = localeOptions.find((option) => option.value === locale)
  return (
    <label className="ecoya-locale-select">
      <Languages size={17} aria-hidden="true" />
      <span aria-hidden="true">{selectedOption?.label ?? "한국어"}</span>
      <select
        aria-label={locale === "en" ? "Select language" : "언어 선택"}
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        {localeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={15} aria-hidden="true" />
    </label>
  )
}

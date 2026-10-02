import { useCallback, useSyncExternalStore } from "react"
import { ChevronDown, Languages } from "lucide-react"
import { en } from "./i18n/en"

export type Locale = "ko" | "en"

const STORAGE_KEY = "ecoya-landing-locale"

function readInitial(): Locale {
  if (typeof window === "undefined") return "ko"
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "ko"
  } catch {
    return "ko"
  }
}

let current: Locale = readInitial()
const listeners = new Set<() => void>()

if (typeof document !== "undefined") document.documentElement.lang = current

export function setLocale(next: Locale) {
  if (next === current) return
  current = next
  try {
    window.localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* ignore storage failures */
  }
  if (typeof document !== "undefined") document.documentElement.lang = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useLocale(): Locale {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => "ko",
  )
}

/**
 * Returns a translator. In Korean (default) it returns the source string
 * unchanged; in English it looks the Korean string up in the `en` dictionary,
 * falling back to the Korean text when a translation is missing.
 */
export function useT() {
  const locale = useLocale()
  return useCallback(
    (ko: string) => (locale === "en" ? (en[ko] ?? ko) : ko),
    [locale],
  )
}

const localeOptions = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
] as const

export function LocaleToggle() {
  const locale = useLocale()
  const selectedOption = localeOptions.find((option) => option.value === locale)
  return (
    <label className="ecoya-locale-select">
      <Languages aria-hidden="true" />
      <span aria-hidden="true">{selectedOption?.label ?? "한국어"}</span>
      <select
        aria-label="언어 선택"
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        {localeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" />
    </label>
  )
}

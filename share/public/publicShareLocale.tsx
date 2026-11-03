import { createContext, useContext } from "react"
import ko from "./locales/ko.json"
import en from "./locales/en.json"
import enGB from "./locales/en-GB.json"
import ja from "./locales/ja.json"
import de from "./locales/de-DE.json"
import fr from "./locales/fr-FR.json"

// Existing product FE public-share copy; preserve recipient notices verbatim.
const messages = { ko, en, "en-GB": enGB, ja, "de-DE": de, "fr-FR": fr }
export type ShareLocale = keyof typeof messages
export const shareLanguages: [ShareLocale, string][] = [
  ["ko", "한국어"],
  ["en", "English (US)"],
  ["en-GB", "English (UK)"],
  ["ja", "日本語"],
  ["de-DE", "Deutsch"],
  ["fr-FR", "Français"],
]
export function initialShareLocale(): ShareLocale {
  for (const language of navigator.languages) {
    if (language in messages) return language as ShareLocale
    const match = shareLanguages.find(
      ([locale]) => locale.split("-")[0] === language.split("-")[0]
    )
    if (match) return match[0]
  }
  return "en"
}
export const ShareLocaleContext = createContext<ShareLocale>("en")
export function useShareCopy() {
  const locale = useContext(ShareLocaleContext)
  return {
    locale,
    t: (key: string, params: Record<string, string | number> = {}) => {
      const value = key
        .split(".")
        .reduce<unknown>(
          (obj, part) =>
            obj && typeof obj === "object"
              ? (obj as Record<string, unknown>)[part]
              : undefined,
          messages[locale]
        )
      if (typeof value !== "string") return key
      return value
        .replace(/<\/?(?:keep|product)>/g, "")
        .replace(/\{(\w+)\}/g, (_, name: string) =>
          String(params[name] ?? `{${name}}`)
        )
    },
  }
}

export function shareDocumentTitle(locale: ShareLocale) {
  return messages[locale].documentTitle
}

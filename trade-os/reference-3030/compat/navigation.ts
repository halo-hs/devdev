import { useMemo, useSyncExternalStore } from "react"
import { referenceHref } from "./link"

const subscribe = (listener: () => void) => {
  window.addEventListener("popstate", listener)
  return () => window.removeEventListener("popstate", listener)
}
export function useSearchParams() {
  const search = useSyncExternalStore(subscribe, () => window.location.search)
  return useMemo(() => new URLSearchParams(search), [search])
}
export function usePathname() {
  return useSyncExternalStore(subscribe, () => window.location.pathname)
}
export function useRouter() {
  return useMemo(() => ({
    push: (href: string) => window.location.assign(referenceHref(href) ?? href),
    replace: (href: string) => window.location.replace(referenceHref(href) ?? href),
    refresh: () => window.location.reload(),
    back: () => window.history.back(),
  }), [])
}

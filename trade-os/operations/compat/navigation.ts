import { appLocation } from "@/app/app-location"
import { useMemo, useSyncExternalStore } from "react"
import { referenceHref } from "./link"

const subscribe = (listener: () => void) => {
  window.addEventListener("popstate", listener)
  return () => window.removeEventListener("popstate", listener)
}
export function useSearchParams() {
  const search = useSyncExternalStore(subscribe, () => appLocation.search)
  return useMemo(() => new URLSearchParams(search), [search])
}
export function usePathname() {
  return useSyncExternalStore(subscribe, () => appLocation.pathname)
}
export function useRouter() {
  return useMemo(() => ({
    push: (href: string) => appLocation.assign(referenceHref(href) ?? href),
    replace: (href: string) => appLocation.replace(referenceHref(href) ?? href),
    refresh: () => appLocation.reload(),
    back: () => window.history.back(),
  }), [])
}

import { useMemo, useSyncExternalStore } from "react"

import { appLocation } from "@/app/appLocation"

const subscribe = (listener: () => void) => {
  window.addEventListener("popstate", listener)
  return () => window.removeEventListener("popstate", listener)
}

// Current query string, updated on in-app history navigation.
export function useSearchParams() {
  const search = useSyncExternalStore(subscribe, () => appLocation.search)
  return useMemo(() => new URLSearchParams(search), [search])
}

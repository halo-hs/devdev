import { useCallback, useMemo, useSyncExternalStore } from "react"

export type Item = "S1" | "S2" | "S3" | "S4"
type Projection = {
  access: "active" | "read-only" | "revoked"
  completed: Partial<Record<Item, string>>
  taskId?: string
}
const reloadEvent = "ecoya:snap-guide-reload"
function subscribe(listener: () => void) {
  window.addEventListener("storage", listener)
  window.addEventListener(reloadEvent, listener)
  return () => {
    window.removeEventListener("storage", listener)
    window.removeEventListener(reloadEvent, listener)
  }
}

// Completion comes from recorded receipts, never from visiting a screen.
export function useSnapStartGuide(scope: string) {
  const key = `ecoya.preview.snap-start-guide.v1:${scope}`
  const read = useCallback(() => {
    try { return localStorage.getItem(key) } catch { return "unavailable" }
  }, [key])
  const raw = useSyncExternalStore(subscribe, read, () => null)
  const result = useMemo(() => {
    try {
      const state: Projection = raw ? JSON.parse(raw) : { access: "active", completed: {} }
      if (!state?.completed || !["active", "read-only", "revoked"].includes(state.access))
        throw new Error("Invalid guide projection")
      return { state, error: false }
    } catch { return { state: null, error: true } }
  }, [raw])
  const reload = useCallback(() => window.dispatchEvent(new Event(reloadEvent)), [])
  return { ...result, reload }
}

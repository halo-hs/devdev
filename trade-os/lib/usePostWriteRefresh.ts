import { useEffect, useRef, useState } from "react"

type Scope = { key: string; request: number; writes: Set<object>; accepted: boolean }
export type WriteReceipt = { scope: Scope; id: object }
export type RefreshFailure = "stale" | "read" | 403 | 404 | null

/** Mirrors reloadAfterWrite: a failed read never rejects or replays a write. */
export function usePostWriteRefresh<T>(scopeKey: string, read: () => Promise<T>) {
  const current = useRef<Scope>({ key: scopeKey, request: 0, writes: new Set(), accepted: false })
  if (current.current.key !== scopeKey) {
    current.current = { key: scopeKey, request: 0, writes: new Set(), accepted: false }
  }
  const reader = useRef(read)
  reader.current = read
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; current.current.request++ }
  }, [])
  const [state, setState] = useState<{ scope: Scope; busy: boolean; failure: RefreshFailure; data?: T }>({ scope: current.current, busy: false, failure: null })
  const isCurrent = (receipt: WriteReceipt) => mounted.current && receipt.scope === current.current
  const refresh = async () => {
    const scope = current.current
    // A read started before a pending write settles cannot acknowledge it.
    if (scope.writes.size) return
    const request = ++scope.request
    const active = () => mounted.current && scope === current.current && request === scope.request
    setState(previous => ({ ...(previous.scope === scope ? previous : { scope, failure: null }), busy: true }))
    try {
      const data = await reader.current()
      if (!active()) return
      scope.accepted = false
      setState({ scope, busy: false, failure: null, data })
    } catch (cause) {
      if (!active()) return
      const error = cause as { status?: number; statusCode?: number; response?: { status?: number } } | null
      const status = error?.status ?? error?.statusCode ?? error?.response?.status
      const failure = status === 403 || status === 404 ? status : scope.accepted ? "stale" : "read"
      setState(previous => ({ ...previous, scope, busy: false, failure }))
    }
  }
  const beginWrite = (): WriteReceipt => {
    const scope = current.current
    const id = {}
    scope.writes.add(id)
    scope.request++
    setState(previous => ({ ...(previous.scope === scope ? previous : { scope, failure: null }), busy: false }))
    return { scope, id }
  }
  const finishWrite = (receipt: WriteReceipt, accepted: boolean) => {
    if (!isCurrent(receipt) || !receipt.scope.writes.delete(receipt.id)) return
    receipt.scope.accepted ||= accepted
    if (receipt.scope.accepted && !receipt.scope.writes.size) void refresh()
  }
  const visible = state.scope === current.current ? state : { busy: false, failure: null, data: undefined }
  return { ...visible, refresh, beginWrite, finishWrite, isCurrent }
}

export type PostWriteRefresh<T> = ReturnType<typeof usePostWriteRefresh<T>>

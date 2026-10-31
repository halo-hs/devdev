import { createContext, useContext } from "react"

export const ViewSeatContext = createContext<{ viewOnly: boolean; guard: () => boolean }>({
  viewOnly: false,
  guard: () => false,
})

export function useViewOnly() {
  return useContext(ViewSeatContext).viewOnly
}

/** Returns true (after showing the View notice) when the action must not run. */
export function useViewSeatGuard() {
  return useContext(ViewSeatContext).guard
}

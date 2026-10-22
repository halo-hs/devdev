import { createContext, useContext } from "react"
import { type SettingsRole } from "@share/settings/SettingsRoutePage"
import type { useDemoState } from "@share/settings/SubscriptionSettings"

export const names = { erp: "Trade OS", snap: "SNAP" }

export const SettingsDemoContext = createContext<ReturnType<
  typeof useDemoState
> | null>(null)

export function useSettingsDemo() {
  const value = useContext(SettingsDemoContext)
  if (!value) throw new Error("SettingsDemoProvider is required")
  return value
}

export function useTradeSeatAssigned(role: SettingsRole) {
  const state = useContext(SettingsDemoContext)
  return state?.members.find((member) => member.id === role)?.erp ?? true
}

export function useSettingsDemoPresent() {
  return useContext(SettingsDemoContext) !== null
}

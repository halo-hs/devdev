import { createContext, useContext } from "react"
import type { GuideEvent, GuideItem, GuideRole, GuideState } from "./state"

export type GuideRuntime = {
  state: GuideState | null
  error: boolean
  role: GuideRole
  complete: boolean
  count: number
  total: number
  reload: () => void
  start: (item: GuideItem) => void
  record: (event: GuideEvent) => void
}

export const StartGuideContext = createContext<GuideRuntime | null>(null)
export const useStartGuide = () => useContext(StartGuideContext)

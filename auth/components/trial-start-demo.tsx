import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { TrialStartCard, type TrialStartCardProps, type TrialStartState } from "./trial-start-card"
import { trialProducts } from "./trial-products"

/** Only used by devdev's screen demo. Does not create a trial or imply API success. */
export function TrialStartDemo(props: Omit<TrialStartCardProps, "state" | "onStart"> & { initialState?: TrialStartState }) {
  const { initialState = "ready", ...cardProps } = props
  const [state, setState] = useState<TrialStartState>(() => cardProps.layout === "row" && (initialState === "failed" || initialState === "unconfirmed") ? "ready" : initialState)
  const pending = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  return <TrialStartCard {...cardProps} state={state} onStart={() => {
    if (pending.current || state === "starting") return
    pending.current = true
    setState("starting")
    timer.current = setTimeout(() => {
      if (cardProps.layout === "row") {
        setState("ready")
        const productName = trialProducts[cardProps.product].name
        if (initialState === "failed") toast.error(`${productName} 무료 체험을 시작하지 못했습니다.`, { description: "잠시 후 다시 시도해 주세요." })
        else toast(`${productName} 무료 체험 시작 결과를 확인하지 못했습니다.`, { description: "잠시 후 다시 시도해 주세요." })
      } else setState("unconfirmed")
      pending.current = false
    }, 1200)
  }} />
}

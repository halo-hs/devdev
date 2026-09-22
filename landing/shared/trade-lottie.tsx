import { useEffect, useRef, useState } from "react"
import { LottieLight, type LottieHandle } from "lottie-react"
import { useReducedMotion } from "@shared/lib/use-reduced-motion"
import { FileText, Pause, Play } from "lucide-react"

export function TradeLottie({
  src,
  active = true,
  className,
  label,
  controls = false,
}: {
  src: string
  active?: boolean
  className?: string
  label: string
  controls?: boolean
}) {
  const player = useRef<LottieHandle>(null)
  const root = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [visible, setVisible] = useState(false)
  const [pageVisible, setPageVisible] = useState(!document.hidden)
  const [failed, setFailed] = useState(false)
  const [paused, setPaused] = useState(false)
  const playing = active && visible && pageVisible && !reduced && !paused
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting)
    )
    if (root.current) observer.observe(root.current)
    const update = () => setPageVisible(!document.hidden)
    document.addEventListener("visibilitychange", update)
    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", update)
    }
  }, [])
  useEffect(() => {
    if (playing) player.current?.play()
    else player.current?.pause()
  }, [playing])
  return (
    <div ref={root} className={className}>
      <div role="img" aria-label={label}>
        {failed ? (
          <FileText aria-hidden />
        ) : (
          <LottieLight
            src={src}
            lottieRef={player}
            autoplay={false}
            loop={controls}
            aria-hidden
            subscriptions={{
              ready: () => {
                if (playing) player.current?.play()
              },
              error: () => setFailed(true),
            }}
          />
        )}
      </div>
      {controls && !reduced && !failed && (
        <button
          type="button"
          className="trade-feature-play"
          aria-label={
            paused ? "업로드 애니메이션 재생" : "업로드 애니메이션 일시정지"
          }
          onClick={() => setPaused(!paused)}
        >
          {paused ? <Play size={16} /> : <Pause size={16} />}
          {paused ? "재생" : "일시정지"}
        </button>
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from "react"

export function useSnapPreviewPlayback() {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(
    () => !matchMedia("(prefers-reduced-motion: reduce)").matches
  )
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const elapsed = useRef(0)
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)")
    const reduce = () => {
      if (media.matches) setPlaying(false)
    }
    media.addEventListener("change", reduce)
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.2 }
    )
    if (root.current) observer.observe(root.current)
    return () => {
      observer.disconnect()
      media.removeEventListener("change", reduce)
    }
  }, [])
  useEffect(() => {
    if (!playing || !visible) return
    let previous = performance.now()
    const timer = setInterval(() => {
      const now = performance.now()
      if (!document.hidden) elapsed.current += Math.min(now - previous, 250)
      previous = now
      if (elapsed.current >= 6000) {
        elapsed.current = 0
        setStep((value) => (value + 1) % 4)
      }
      setProgress(elapsed.current / 6000)
    }, 100)
    return () => clearInterval(timer)
  }, [playing, visible])
  return {
    step,
    playing,
    progress,
    root,
    select: (index: number) => {
      setStep(index)
      setPlaying(false)
      elapsed.current = 0
      setProgress(0)
    },
    pause: () => setPlaying(false),
    toggle: () => setPlaying((value) => !value),
  }
}

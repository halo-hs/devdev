import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"

import { cn } from "@shared/lib/utils"

export function PannablePdfViewport({
  zoom,
  className,
  children,
}: {
  zoom: number
  className?: string
  children: ReactNode
}) {
  const panStart = useRef<{
    pointerId: number
    x: number
    y: number
    scrollLeft: number
    scrollTop: number
  } | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const canPan = zoom > 100

  const stopPanning = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (panStart.current?.pointerId !== event.pointerId) return
    panStart.current = null
    setIsPanning(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <div
      className={cn(
        "overflow-auto",
        canPan && "cursor-grab select-none",
        isPanning && "cursor-grabbing",
        className
      )}
      style={{ touchAction: canPan ? "none" : undefined }}
      onPointerDown={(event) => {
        if (!canPan || event.button !== 0) return
        panStart.current = {
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          scrollLeft: event.currentTarget.scrollLeft,
          scrollTop: event.currentTarget.scrollTop,
        }
        event.currentTarget.setPointerCapture(event.pointerId)
        setIsPanning(true)
        event.preventDefault()
      }}
      onPointerMove={(event) => {
        const start = panStart.current
        if (!start || start.pointerId !== event.pointerId) return
        event.currentTarget.scrollLeft =
          start.scrollLeft - (event.clientX - start.x)
        event.currentTarget.scrollTop =
          start.scrollTop - (event.clientY - start.y)
      }}
      onPointerUp={stopPanning}
      onPointerCancel={stopPanning}
    >
      {children}
    </div>
  )
}

import { useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from "react"
import { Hand } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function PannablePdfViewport({
  zoom,
  className,
  children,
  centerPage = false,
  nativePdf,
}: {
  zoom: number
  className?: string
  children?: ReactNode
  centerPage?: boolean
  nativePdf?: { src: string; title: string }
}) {
  const viewport = useRef<HTMLDivElement>(null)
  const previousZoom = useRef(100)
  const drag = useRef<{ id: number; x: number; y: number; left: number; top: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [handTool, setHandTool] = useState(true)
  const canPan = zoom > 100 && (!nativePdf || handTool)
  const scale = zoom / 100

  useLayoutEffect(() => {
    const el = viewport.current
    const ratio = zoom / previousZoom.current
    previousZoom.current = zoom
    if (!el || ratio === 1) return
    // Keep the point in the middle of the viewport in view as the page scales.
    el.scrollLeft = (el.scrollLeft + el.clientWidth / 2) * ratio - el.clientWidth / 2
    el.scrollTop = (el.scrollTop + el.clientHeight / 2) * ratio - el.clientHeight / 2
  }, [zoom])

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id !== event.pointerId) return
    drag.current = null
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div
        ref={viewport}
        data-pdf-viewport
        role="region"
        aria-label="문서 표시 영역"
        tabIndex={0}
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-auto",
          canPan && "touch-none cursor-grab select-none overscroll-contain",
          dragging && "cursor-grabbing",
          className
        )}
        onPointerDown={(event) => {
          if (!canPan || !event.isPrimary || event.button !== 0 || drag.current) return
          if (event.target instanceof Element && event.target.closest("a,button,input,textarea,select,[contenteditable=true]")) return
          const el = event.currentTarget
          drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, left: el.scrollLeft, top: el.scrollTop }
          el.setPointerCapture(event.pointerId)
          setDragging(true)
          event.preventDefault()
        }}
        onPointerMove={(event) => {
          const start = drag.current
          if (!start || start.id !== event.pointerId) return
          event.currentTarget.scrollLeft = start.left + start.x - event.clientX
          event.currentTarget.scrollTop = start.top + start.y - event.clientY
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onDragStart={(event) => { if (canPan) event.preventDefault() }}
      >
        <div
          className={cn("mx-auto shrink-0", centerPage && "my-auto")}
          style={{ width: `${zoom}%`, minHeight: zoom > 100 ? `${zoom}%` : undefined, height: nativePdf ? `${zoom}%` : undefined }}
        >
          <div className={nativePdf ? "h-full" : undefined} style={{ zoom: scale }}>
            {nativePdf ? (
              <iframe
                title={nativePdf.title}
                src={nativePdf.src}
                tabIndex={canPan ? -1 : undefined}
                className={cn("block h-full w-full border-0", canPan && "pointer-events-none")}
              />
            ) : children}
          </div>
        </div>
      </div>
      {nativePdf && zoom > 100 && (
        <Button
          variant="outline"
          size="sm"
          className="absolute right-3 bottom-3"
          aria-pressed={handTool}
          title={handTool ? "손 도구 끄기 · PDF 내부 조작" : "손 도구 켜기 · 드래그로 이동"}
          onClick={() => setHandTool(value => !value)}
        >
          <Hand data-icon="inline-start" />손 도구
        </Button>
      )}
    </div>
  )
}

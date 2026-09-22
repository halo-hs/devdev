import { useLayoutEffect, useRef, useState, type ReactNode } from "react"

type Shape = {
  x: number
  y: number
  width: number
  height: number
  radius: number
  frame: boolean
}
type Layout = { width: number; height: number; shapes: Shape[] }

const controls =
  'input:not([type="hidden"]), textarea, select, button, img, canvas, [role="img"], [role="tab"], [role="combobox"], [data-slot="badge"], [data-slot="progress"], [data-slot="skeleton"], .recharts-wrapper'
const containers =
  'section, aside, header, [data-slot="card"], [data-slot="table-container"], [class*="rounded"]'

// Measure the mounted page so loading and loaded states share the same layout,
// including responsive columns, saved panel sizes, and document substeps.
function readLayout(root: HTMLElement): Layout {
  const bounds = root.getBoundingClientRect()
  const width = bounds.width
  const height = Math.max(
    0,
    Math.min(bounds.height, window.innerHeight - bounds.top)
  )
  const shapes: Shape[] = []
  const clipping = new WeakMap<
    Element,
    { left: number; top: number; right: number; bottom: number }
  >()
  const viewport = {
    left: bounds.left,
    top: bounds.top,
    right: bounds.right,
    bottom: bounds.top + height,
  }
  function clipFor(element: Element): typeof viewport {
    if (element === root || !root.contains(element)) return viewport
    const cached = clipping.get(element)
    if (cached) return cached
    const parent = clipFor(element.parentElement ?? root)
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    const clipsX = /auto|scroll|hidden|clip/.test(style.overflowX)
    const clipsY = /auto|scroll|hidden|clip/.test(style.overflowY)
    const clip = {
      left: clipsX ? Math.max(parent.left, rect.left) : parent.left,
      right: clipsX ? Math.min(parent.right, rect.right) : parent.right,
      top: clipsY ? Math.max(parent.top, rect.top) : parent.top,
      bottom: clipsY ? Math.min(parent.bottom, rect.bottom) : parent.bottom,
    }
    clipping.set(element, clip)
    return clip
  }
  function add(rect: DOMRect, element: Element, frame = false, text = false) {
    if (shapes.length >= 600 || rect.width < 3 || rect.height < 3) return
    const clip = clipFor(element)
    const left = Math.max(rect.left, clip.left)
    const top = Math.max(rect.top, clip.top)
    const right = Math.min(rect.right, clip.right)
    const bottom = Math.min(rect.bottom, clip.bottom)
    if (right - left < 3 || bottom - top < 3) return
    const lineHeight = text ? Math.min(16, (bottom - top) * 0.65) : bottom - top
    shapes.push({
      x: left - bounds.left,
      y: top - bounds.top + (bottom - top - lineHeight) / 2,
      width: right - left,
      height: lineHeight,
      radius: text
        ? 3
        : Math.min(12, parseFloat(getComputedStyle(element).borderRadius) || 4),
      frame,
    })
  }
  for (const element of root.querySelectorAll(containers)) {
    if (
      element.matches(controls) ||
      element.closest(
        'svg, [aria-hidden="true"]:not([data-loading-content]), .sr-only'
      )
    )
      continue
    const style = getComputedStyle(element)
    if (style.visibility === "hidden") continue
    if (
      parseFloat(style.borderTopWidth) > 0 ||
      style.backgroundImage !== "none"
    ) {
      add(element.getBoundingClientRect(), element, true)
    }
  }
  for (const element of root.querySelectorAll(controls)) {
    if (
      element.parentElement?.closest(controls) ||
      element.closest(
        'svg, [aria-hidden="true"]:not([data-loading-content]), .sr-only'
      )
    )
      continue
    if (getComputedStyle(element).visibility !== "hidden")
      add(element.getBoundingClientRect(), element)
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  let node: Node | null
  while ((node = walker.nextNode()) && shapes.length < 600) {
    const parent = node.parentElement
    if (
      !parent ||
      !node.textContent?.trim() ||
      parent.closest(
        `${controls}, svg, script, style, [aria-hidden="true"]:not([data-loading-content]), .sr-only`
      )
    )
      continue
    if (getComputedStyle(parent).visibility === "hidden") continue
    range.selectNodeContents(node)
    for (const rect of range.getClientRects()) add(rect, parent, false, true)
  }
  return { width, height, shapes }
}

export function PageLoadingBoundary({
  loading,
  pageKey,
  children,
}: {
  loading: boolean
  pageKey: string
  children: ReactNode
}) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [snapshot, setSnapshot] = useState<{
    key: string
    layout: Layout
  } | null>(null)
  const layout = snapshot && snapshot.key === pageKey ? snapshot.layout : null
  useLayoutEffect(() => {
    const content = contentRef.current
    if (!loading || !content) return
    let frame = 0
    const measure = () =>
      setSnapshot({ key: pageKey, layout: readLayout(content) })
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    schedule()
    const resize = new ResizeObserver(schedule)
    resize.observe(content)
    const mutations = new MutationObserver(schedule)
    mutations.observe(content, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden"],
    })
    document.fonts.addEventListener("loadingdone", schedule)
    window.addEventListener("resize", schedule)
    content.addEventListener("scroll", schedule, true)
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      mutations.disconnect()
      document.fonts.removeEventListener("loadingdone", schedule)
      window.removeEventListener("resize", schedule)
      content.removeEventListener("scroll", schedule, true)
    }
  }, [loading, pageKey, children])

  return (
    <div
      className="relative h-full min-h-0 min-w-0"
      data-page-loading={loading || undefined}
    >
      <div
        ref={contentRef}
        className="h-full min-h-0 min-w-0"
        inert={loading || undefined}
        // Keep the measured root accessible to the collector; hide its contents
        // from assistive technology through the outer wrapper while loading.
        style={loading ? { opacity: 0, pointerEvents: "none" } : undefined}
      >
        <div
          className="contents"
          aria-hidden={loading || undefined}
          data-loading-content
        >
          {children}
        </div>
      </div>
      {loading && (
        <div
          role="status"
          aria-label="화면을 불러오는 중"
          aria-busy="true"
          className="pointer-events-none absolute inset-0 overflow-hidden bg-background"
          data-page-skeleton
        >
          <span className="sr-only">화면을 불러오는 중입니다.</span>
          {layout && layout.width > 0 && (
            <svg
              aria-hidden="true"
              width={layout.width}
              height={layout.height}
              className="max-w-full"
            >
              <g className="animate-pulse motion-reduce:animate-none">
                {layout.shapes.map((shape, index) => (
                  <rect
                    key={index}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    rx={shape.radius}
                    data-skeleton-part={shape.frame ? "frame" : "content"}
                    fill={
                      shape.frame ? "var(--background)" : "var(--color-gray-10)"
                    }
                    stroke={shape.frame ? "var(--surface-border)" : "none"}
                  />
                ))}
              </g>
            </svg>
          )}
        </div>
      )}
    </div>
  )
}

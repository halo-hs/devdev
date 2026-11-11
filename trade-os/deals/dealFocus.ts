// 건강도 등에서 특정 지점으로 이동할 때: 화면이 그려질 때까지 기다렸다가
// 정확한 요소로 스크롤하고, 도착한 곳을 잠깐 강조한다.

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

export function flashElement(element: HTMLElement) {
  if (reducedMotion()) {
    const previous = element.style.outline
    element.style.outline = "2px solid var(--color-orange-6)"
    element.style.outlineOffset = "4px"
    window.setTimeout(() => {
      element.style.outline = previous
      element.style.outlineOffset = ""
    }, 1400)
    return
  }
  // 연한 주황(semantic Orange 6)으로 잠깐만 비춘다.
  element.animate(
    [
      { backgroundColor: "var(--color-orange-6)", boxShadow: "0 0 0 4px var(--color-orange-6)", offset: 0 },
      { backgroundColor: "var(--color-orange-6)", boxShadow: "0 0 0 4px var(--color-orange-6)", offset: 0.5 },
      { backgroundColor: "transparent", boxShadow: "0 0 0 4px transparent", offset: 1 },
    ],
    { duration: 1400, easing: "ease-out" }
  )
}

/** selectors를 순서대로 찾아 처음 나오는 요소로 이동·강조한다. 렌더 대기를 위해 최대 30프레임 기다린다. */
export function focusFirst(selectors: string[], options: { focus?: boolean } = {}) {
  let frames = 0
  const attempt = () => {
    const element = selectors
      .map((selector) => document.querySelector<HTMLElement>(selector))
      .find(Boolean)
    if (!element) {
      if (frames++ < 30) requestAnimationFrame(attempt)
      return
    }
    // 방금 펼친 영역은 레이아웃이 한 번 더 바뀌므로 두 프레임 뒤에 위치를 잡는다.
    requestAnimationFrame(() => requestAnimationFrame(() => land(element)))
  }
  const land = (element: HTMLElement) => {
    element.style.scrollMarginTop ||= "calc(var(--deal-header-height,128px) + 24px)"
    // 작은 요소는 화면 가운데로 — 시선이 머무는 곳에 놓는다. 큰 요소는 위에 맞춘다.
    const tall = element.getBoundingClientRect().height > window.innerHeight * 0.45
    element.scrollIntoView({ behavior: reducedMotion() ? "instant" : "smooth", block: tall ? "start" : "center" })
    if (options.focus) (element.matches("input, button") ? element : element.querySelector<HTMLElement>("input, button"))?.focus({ preventScroll: true })
    // 스크롤이 멈춘 뒤에 강조해야 눈에 들어온다(멀리 이동하면 1초 가까이 걸린다).
    if (reducedMotion()) return flashElement(element)
    const viewport = element.closest<HTMLElement>("[data-deal-scroll-viewport]") ?? window
    let done = false
    const flash = () => {
      if (done) return
      done = true
      viewport.removeEventListener("scrollend", flash)
      flashElement(element)
    }
    viewport.addEventListener("scrollend", flash, { once: true })
    window.setTimeout(flash, 1200)
  }
  requestAnimationFrame(attempt)
}

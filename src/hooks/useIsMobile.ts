import * as React from "react"

const MOBILE_BREAKPOINT = 1024
const COMPACT_WORKSPACE_BREAKPOINT = 1280

function useBelowBreakpoint(breakpoint: number) {
  const [isMobile, setIsMobile] = React.useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches
  )

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const onChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [breakpoint])

  return isMobile
}

export function useIsMobile() {
  return useBelowBreakpoint(MOBILE_BREAKPOINT)
}

export function useIsCompactWorkspace() {
  return useBelowBreakpoint(COMPACT_WORKSPACE_BREAKPOINT)
}

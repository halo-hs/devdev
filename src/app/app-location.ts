/** Keep application routes independent of the host's project directory. */
const base = import.meta.env.BASE_URL.replace(/\/$/, "")
export function hostedUrl(value: string | URL): string {
  const url = new URL(String(value), window.location.href)
  if (!base || url.origin !== window.location.origin) return url.href
  if (url.pathname !== base && !url.pathname.startsWith(base + "/")) url.pathname = base + url.pathname
  return url.href
}
function logicalUrl() {
  const url = new URL(window.location.href)
  if (base && (url.pathname === base || url.pathname.startsWith(base + "/"))) url.pathname = url.pathname.slice(base.length) || "/"
  return url
}
export const appLocation = new Proxy({} as Location, {
  get(_target, key) {
    if (key === "assign") return (value: string | URL) => window.location.assign(hostedUrl(value))
    if (key === "replace") return (value: string | URL) => window.location.replace(hostedUrl(value))
    if (key === "toString") return () => logicalUrl().href
    if (key === "href" || key === "pathname") return logicalUrl()[key]
    const value = Reflect.get(window.location, key)
    return typeof value === "function" ? value.bind(window.location) : value
  },
  set(_target, key, value) {
    if (key === "href") { window.location.assign(hostedUrl(String(value))); return true }
    return Reflect.set(window.location, key, value)
  },
})

export function installProjectBase() {
  if (!base) return
  const recovery = new URL(window.location.href)
  const route = recovery.searchParams.get("__pages_route")
  if (route?.startsWith("/") && !route.startsWith("//")) {
    window.history.replaceState(null, "", hostedUrl(route))
  }
  const push = window.history.pushState.bind(window.history)
  const replace = window.history.replaceState.bind(window.history)
  window.history.pushState = (data, unused, url) => push(data, unused, url == null ? url : hostedUrl(url))
  window.history.replaceState = (data, unused, url) => replace(data, unused, url == null ? url : hostedUrl(url))
  const open = window.open.bind(window)
  window.open = (url, target, features) => open(url == null ? url : hostedUrl(url), target, features)
  // React renders root-relative links; normalize before activation, including new tabs.
  const normalize = (anchor: HTMLAnchorElement) => {
    const href = anchor.getAttribute("href")
    if (href?.startsWith("/") && !href.startsWith("//")) anchor.href = hostedUrl(href)
  }
  document.addEventListener("click", event => {
    const anchor = event.target instanceof Element ? event.target.closest("a") : null
    if (anchor) normalize(anchor)
  }, true)
  const observer = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue
        if (node instanceof HTMLAnchorElement) normalize(node)
        node.querySelectorAll<HTMLAnchorElement>("a[href]").forEach(normalize)
      }
    }
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
}

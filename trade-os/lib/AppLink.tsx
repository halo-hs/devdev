import { deals } from "@trade-os/lib/prototypeDeals"
import { operationsDemo } from "@trade-os/operations/demo/mode"
import type { AnchorHTMLAttributes } from "react"

// In-app link: client-side navigation for /erp routes; demo deal ids map to prototype deals.
export function appHref(href?: string) {
  if (!href?.startsWith("/erp/")) return href
  if (operationsDemo) {
    const match = href.match(/^\/erp\/deals\/de000000-0000-4000-8000-(\d{12})(.*)$/)
    const demo = match && deals[Number(match[1]) - 1]
    if (demo) return `/erp/deals/${demo.id}${match![2]}`
  }
  return href
}

export default function AppLink({ href, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const destination = appHref(href)
  return <a href={destination} {...props} onClick={event => {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (props.target && props.target !== "_self") || props.download !== undefined || !destination?.startsWith("/erp/")) return
    event.preventDefault()
    window.history.pushState({ product: "erp" }, "", destination)
    window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }))
  }} />
}

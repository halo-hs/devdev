import { deals } from "@trade-os/lib/prototype-deals"
import { operationsDemo } from "../demo/mode"
import type { AnchorHTMLAttributes } from "react"

export function referenceHref(href?: string) {
  if (!href?.startsWith("/erp/")) return href
  if (operationsDemo) {
    const match = href.match(/^\/erp\/deals\/de000000-0000-4000-8000-(\d{12})(.*)$/)
    const demo = match && deals[Number(match[1]) - 1]
    if (demo) return `/erp/deals/${demo.id}${match![2]}`
  }
  const path = href.split(/[?#]/, 1)[0]
  const imported = ["/erp/monitor", "/erp/reports", "/erp/sales-performance", "/erp/sales", "/erp/settlement", "/erp/shipments"]
  // UUID detail routes load the same backend record inside the host shell.
  const isDeal = /^\/erp\/deals\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(path)
  return operationsDemo || imported.includes(path) || isDeal ? href : `http://localhost:3030${href}`
}

export default function Link({ href, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const destination = referenceHref(href)
  return <a href={destination} {...props} onClick={event => {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (props.target && props.target !== "_self") || props.download !== undefined || !destination?.startsWith("/erp/")) return
    event.preventDefault()
    window.history.pushState({ product: "erp" }, "", destination)
    window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }))
  }} />
}

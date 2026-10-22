import type { ReactNode } from "react"
import { createPortal as reactCreatePortal } from "react-dom"
export function createPortal(children: ReactNode, container: Element | DocumentFragment, key?: string | null) {
  return reactCreatePortal(<div className="reference-3030" style={{ display: "contents" }}>{children}</div>, container, key)
}

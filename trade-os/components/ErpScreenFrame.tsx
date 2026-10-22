import type { ReactNode } from "react"

// The host application owns navigation/chrome. The five imported screen bodies
// retain the reference UI; this adapter is only used by source showcase exports.
export function ErpScreenFrame({ children }: { children?: ReactNode; [key: string]: unknown }) {
  return <>{children}</>
}

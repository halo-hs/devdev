import type { PropsWithChildren } from "react"

import { cn } from "../lib/cn"

const widthClasses = {
  full: "w-full",
  wide: "mx-auto w-full max-w-ecoya-wide",
  "wide-xl": "mx-auto w-full max-w-ecoya-wide-xl",
  medium: "mx-auto w-full max-w-ecoya-medium",
  document: "mx-auto w-full max-w-ecoya-document",
} as const

export type PageFrameProps = PropsWithChildren<{
  className?: string
  width?: keyof typeof widthClasses
  scroll?: "page" | "contained"
}>

export function PageFrame({
  children,
  className,
  scroll = "page",
  width = "wide",
}: PageFrameProps) {
  return (
    <div
      data-ui-layout="page-frame"
      data-ui-scroll={scroll}
      data-ui-width={width}
      className={cn(
        "w-full",
        widthClasses[width],
        scroll === "page" ? "min-h-full" : "min-h-0",
        className
      )}
    >
      {children}
    </div>
  )
}

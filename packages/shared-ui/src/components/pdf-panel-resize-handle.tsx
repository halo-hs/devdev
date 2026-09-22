import type { ReactNode } from "react"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@shared/components/ui/resizable"
import { Card } from "@shared/components/ui/card"
import { useIsCompactWorkspace } from "@shared/hooks/use-mobile"
import { cn } from "@shared/lib/utils"

export function PdfPanelWorkspaceCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <Card
      className={cn(
        "flex min-h-0 flex-1 gap-0 overflow-hidden bg-background py-0 shadow-sm",
        className
      )}
    >
      {children}
    </Card>
  )
}

export function PdfPanelResizeHandle({
  label = "PDF 패널 너비 조절",
}: {
  label?: string
}) {
  return (
    <ResizableHandle
      withHandle
      aria-label={label}
      className="w-2 shrink-0 bg-[linear-gradient(to_right,transparent_3px,var(--surface-border)_3px,var(--surface-border)_4px,transparent_4px)] transition-colors after:w-3 hover:bg-[var(--color-primary-10)] data-[resize-handle-state=drag]:bg-[var(--color-primary-9)] [&>div]:h-10 [&>div]:w-1 [&>div]:bg-[var(--color-gray-8)]"
    />
  )
}

export function ResponsivePdfPanelSplit({
  primary,
  preview,
  label,
  className,
  primaryDefaultSize = "50%",
  primaryMinSize = "30%",
  primaryMaxSize = "70%",
  previewDefaultSize = "50%",
  previewMinSize = "30%",
  desktopHeight,
}: {
  primary: ReactNode
  preview: ReactNode
  label: string
  className?: string
  primaryDefaultSize?: string
  primaryMinSize?: string
  primaryMaxSize?: string
  previewDefaultSize?: string
  previewMinSize?: string
  desktopHeight?: string
}) {
  const isCompact = useIsCompactWorkspace()

  if (isCompact) {
    return (
      <div className={cn("grid w-full grid-cols-1", className)}>
        {primary}
        {preview}
      </div>
    )
  }

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className={cn("min-h-0 w-full", className)}
      style={desktopHeight ? { height: desktopHeight } : undefined}
    >
      <ResizablePanel
        defaultSize={primaryDefaultSize}
        minSize={primaryMinSize}
        maxSize={primaryMaxSize}
      >
        {primary}
      </ResizablePanel>
      <PdfPanelResizeHandle label={label} />
      <ResizablePanel defaultSize={previewDefaultSize} minSize={previewMinSize}>
        {preview}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

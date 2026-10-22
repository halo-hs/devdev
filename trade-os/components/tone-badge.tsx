import { type ReactNode } from "react"
import { StatusBadge } from "@shared/components/status-badge"
import { type Tone } from "@trade-os/documents/documentTemplateModel"

export function ToneBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <StatusBadge tone={tone}>{children}</StatusBadge>
}

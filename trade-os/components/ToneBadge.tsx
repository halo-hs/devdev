import { type ReactNode } from "react"
import { StatusBadge } from "@/components/ds2/molecule/StatusBadge"
import { type Tone } from "@trade-os/documents/documentTemplateModel"

export function ToneBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <StatusBadge tone={tone}>{children}</StatusBadge>
}

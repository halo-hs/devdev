import { type ReactNode } from "react"

export function SettingRow({
  label,
  description,
  children,
  inlineControl = false,
}: {
  label: string
  description?: string
  children: ReactNode
  inlineControl?: boolean
}) {
  return (
    <div className={`grid gap-3 border-b py-4 first:pt-0 last:border-b-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_minmax(220px,320px)] md:items-center md:gap-8 ${inlineControl ? "grid-cols-[minmax(0,1fr)_auto] items-center" : ""}`}>
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description ? <p className="mt-1 text-xs leading-5 text-muted-foreground break-keep [overflow-wrap:anywhere]">{description}</p> : null}
      </div>
      <div className="min-w-0 md:justify-self-end md:w-full">{children}</div>
    </div>
  )
}

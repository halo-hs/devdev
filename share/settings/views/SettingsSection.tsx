import type { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/Card"

export function PageHeading({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <header className="mb-7 flex items-start justify-between gap-5 border-b pb-6">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-6 [overflow-wrap:anywhere] break-keep text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}

export function SettingsSection({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-4 px-0.5">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-5 [overflow-wrap:anywhere] break-keep text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <Card className="shadow-xs">
        <CardContent className="p-5 sm:p-6">{children}</CardContent>
      </Card>
    </section>
  )
}

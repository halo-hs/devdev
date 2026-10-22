import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@shared/components/ui/popover"

export type DocumentBlockingIssue = {
  key: string
  label: string
  onSelect: () => void
}

// Only unmet requirements belong here; recommendations do not block progress.
export function DocumentBlockingAlerts({ errors = [], checks = [] }: {
  errors?: DocumentBlockingIssue[]
  checks?: DocumentBlockingIssue[]
}) {
  return <>
    <IssueList label="검토 필요" issues={errors} error />
    <IssueList label="확인 필요" issues={checks} />
  </>
}

function IssueList({ label, issues, error = false }: {
  label: string
  issues: DocumentBlockingIssue[]
  error?: boolean
}) {
  const [open, setOpen] = useState(false)
  if (!issues.length) return null
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={error
          ? "border-destructive/25 bg-destructive/5 text-destructive hover:bg-destructive/10"
          : "border-warning/30 bg-warning/10 text-warning-foreground hover:bg-warning/15"}>
          {label} {issues.length}건 <ChevronDown data-icon="inline-end" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-w-[calc(100vw-24px)] gap-0 p-0 data-open:animate-none data-closed:animate-none"
        onCloseAutoFocus={(event) => event.preventDefault()}>
        <div className="border-b px-4 py-3 text-sm font-semibold">{label} {issues.length}건</div>
        <div className="max-h-72 overflow-y-auto p-1">
          {issues.map((issue) => (
            <Button key={issue.key} variant="ghost" className="h-auto min-h-9 w-full justify-start whitespace-normal px-3 py-2 text-left text-sm"
              onClick={() => { setOpen(false); issue.onSelect() }}>
              {issue.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

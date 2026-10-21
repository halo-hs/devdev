import type { ComponentProps, ReactNode } from "react"

import { SelectTrigger, SelectValue } from "@shared/components/ui/select"
import { cn } from "@shared/lib/utils"

type LabeledSelectTriggerProps = Omit<ComponentProps<typeof SelectTrigger>, "children"> & {
  label: ReactNode
  placeholder?: ReactNode
}

// Figma 문서 올리기 V2 filter Select (6325:101783): the filter name sits inside the
// trigger as "라벨 · 값", replacing the outside label. Same shadcn Select underneath.
function LabeledSelectTrigger({ label, placeholder, className, ...props }: LabeledSelectTriggerProps) {
  return (
    <SelectTrigger {...props} data-slot="labeled-select-trigger" className={cn("w-auto gap-2", className)}>
      <span className="flex min-w-0 items-center gap-1 truncate">
        <span className="shrink-0">{label}</span>
        <span aria-hidden="true">·</span>
        <SelectValue placeholder={placeholder} />
      </span>
    </SelectTrigger>
  )
}

export { LabeledSelectTrigger }

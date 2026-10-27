import { FileText } from "lucide-react"

import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"

type DocumentTypeBadgeProps = {
  code: string
  className?: string
  title?: string
  "aria-label"?: string
}

/** Figma 3030:16532: document type badges display the code only. */
export function DocumentTypeBadge({ code, className, ...props }: DocumentTypeBadgeProps) {
  return (
    <Badge
      {...props}
      data-ui="document-type-badge"
      palette="grayComplete"
      tone="fill"
      size="sm"
      style={{ color: "var(--color-indigo)", backgroundColor: "var(--color-gray-11)" }}
      className={cn(
        "h-[18px] min-w-[55px] gap-1 rounded-[12px] border-0 px-[6px] text-[13px] leading-[18px] font-normal",
        className,
      )}
    >
      <span className="size-3 shrink-0 text-[var(--color-primary-4)]" aria-hidden="true">
        <FileText className="size-full" strokeWidth={2} />
      </span>
      {code === "CO" ? "C/O" : code}
    </Badge>
  )
}

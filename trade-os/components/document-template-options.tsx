import { Check, Search } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@shared/components/ui/button"
import { Input } from "@shared/components/ui/input"
import { ScrollArea } from "@shared/components/ui/scroll-area"
import { cn } from "@shared/lib/utils"

export type DocumentTemplateOption = readonly [
  code: string,
  title: string,
  description: string,
  standard: string,
]

export function DocumentTemplateOptions({
  templates,
  selectedCode,
  query,
  onQueryChange,
  onSelect,
  autoFocus = false,
  searchPrefix,
}: {
  templates: readonly DocumentTemplateOption[]
  selectedCode?: string
  query: string
  onQueryChange: (value: string) => void
  onSelect: (code: string) => void
  autoFocus?: boolean
  searchPrefix?: ReactNode
}) {
  const visibleTemplates = templates.filter(([code, title, description]) =>
    [code, title, description].some((value) =>
      value.toLowerCase().includes(query.trim().toLowerCase())
    )
  )

  return (
    <>
      <div className="flex items-center gap-2">
        {searchPrefix}
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus={autoFocus}
            className="h-8 pl-8 text-xs"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={searchPrefix ? "문서 유형 검색" : "견적서, 계약서, 인보이스 검색"}
            aria-label="문서 유형 검색"
          />
        </div>
      </div>
      <ScrollArea className="mt-2 max-h-[min(440px,60svh)]">
        <div className="space-y-1">
          {visibleTemplates.length > 0 ? (
            visibleTemplates.map(([code, title, description, standard]) => {
              const selected = code === selectedCode
              return (
                <Button
                  key={code}
                  type="button"
                  variant="ghost"
                  className={cn(
                    "grid h-auto w-full grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-2 px-2 py-2.5 text-left font-normal",
                    selected && "bg-primary/8"
                  )}
                  onClick={() => onSelect(code)}
                >
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-md border bg-background text-[13px] font-semibold",
                      selected
                        ? "border-primary text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {code}
                  </span>
                  <span className="min-w-0">
                    <span className="flex min-w-0 items-center gap-2">
                      <strong className="truncate text-xs">{title}</strong>
                      <span className="shrink-0 text-[12px] text-muted-foreground">
                        {standard}
                      </span>
                    </span>
                    <span className="mt-1 block truncate text-[13px] text-muted-foreground">
                      {description}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "text-transparent"
                    )}
                  >
                    <Check className="size-3" />
                  </span>
                </Button>
              )
            })
          ) : (
            <div className="px-3 py-8 text-center text-xs text-muted-foreground">
              일치하는 문서 유형이 없습니다.
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  )
}

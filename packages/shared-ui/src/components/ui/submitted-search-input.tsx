import * as React from "react"
import { Search } from "lucide-react"

import { Button } from "@shared/components/ui/button"
import { Input } from "@shared/components/ui/input"
import { cn } from "@shared/lib/utils"

type SubmittedSearchInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "onChange" | "value"
> & {
  value: string
  onSearch: (value: string) => void
  formClassName?: string
  searchLabel?: string
}

function SubmittedSearchInput({
  value,
  onSearch,
  className,
  formClassName,
  searchLabel = "검색",
  ...props
}: SubmittedSearchInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  return (
    <form
      role="search"
      className={cn("relative min-w-0", formClassName)}
      onSubmit={(event) => {
        event.preventDefault()
        onSearch(inputRef.current?.value.trim() ?? "")
      }}
    >
      <Input
        {...props}
        key={value}
        ref={inputRef}
        defaultValue={value}
        className={cn("pr-9", className)}
      />
      <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        className="absolute right-0.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        title={searchLabel}
        aria-label={searchLabel}
      >
        <Search aria-hidden="true" />
      </Button>
    </form>
  )
}

export { SubmittedSearchInput }

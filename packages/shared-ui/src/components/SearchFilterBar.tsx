import { useRef, type ComponentProps, type ReactNode } from "react"
import { Search, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select"
import "@shared/styles/business-filters.css"

type ContainerProps = ComponentProps<"div">

/** Presentation only. Screens own their filter values, options and query callbacks. */
export function BusinessFilterBar({
  className = "",
  stacked = false,
  ...props
}: ContainerProps & { stacked?: boolean }) {
  return (
    <div
      {...props}
      className={`business-filter-bar ${className}`}
      data-layout={stacked ? "stack" : "row"}
    />
  )
}

export function BusinessFilterRow({
  className = "",
  ...props
}: ContainerProps) {
  return <div {...props} className={`business-filter-row ${className}`} />
}

/** Shared list order: search + actions, filters, then result context. */
export function BusinessListToolbar({
  search,
  actions,
  result,
  children,
  ...props
}: ContainerProps & {
  search?: ReactNode
  actions?: ReactNode
  result?: ReactNode
}) {
  return (
    <BusinessFilterBar role="group" {...props} stacked>
      {search && (
        <BusinessFilterRow>
          {search}
          {actions && <BusinessFilterActions>{actions}</BusinessFilterActions>}
        </BusinessFilterRow>
      )}
      {(children || (!search && actions)) && (
        <BusinessFilterRow>
          {children}
          {!search && actions && (
            <BusinessFilterActions>{actions}</BusinessFilterActions>
          )}
        </BusinessFilterRow>
      )}
      {result != null && <div className="business-filter-result">{result}</div>}
    </BusinessFilterBar>
  )
}

export function BusinessFilterActions({
  className = "",
  ...props
}: ContainerProps) {
  return <div {...props} className={`business-filter-actions ${className}`} />
}

export function BusinessFilterSelect({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string
  value: string
  onValueChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <BusinessFilterField label={label}>
      <Select
        value={value}
        onValueChange={(next) => {
          if (next != null) onValueChange(next)
        }}
      >
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </BusinessFilterField>
  )
}

export function BusinessFilterField({
  label,
  children,
  className = "",
  ...props
}: ContainerProps & { label: ReactNode }) {
  return (
    <div {...props} className={`business-filter-field ${className}`}>
      <span className="business-filter-label">{label}</span>
      {children}
    </div>
  )
}

export function BusinessFilterSearch({
  value,
  onValueChange,
  label,
  placeholder = label,
  clearLabel = "검색어 지우기",
}: {
  value: string
  onValueChange: (value: string) => void
  label: string
  placeholder?: string
  clearLabel?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <div className="business-filter-search">
      <Search aria-hidden="true" />
      <input
        ref={input}
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      />
      {value && (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={() => {
            onValueChange("")
            input.current?.focus()
          }}
        >
          <X aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

/** Options remain visible at every width; never collapse a group into a select. */
export function BusinessFilterSegments({
  ariaLabel,
  options,
  value,
  onChange,
  disabled = false,
}: {
  ariaLabel: string
  options: Array<{ id: string; label: string }>
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      data-ui="segmented-control"
      data-wrap={options.length > 4 ? "grid" : undefined}
      className="business-filter-segments"
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          disabled={disabled}
          aria-pressed={option.id === value}
          onClick={() => {
            if (option.id !== value) onChange(option.id)
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

import { type ComponentProps, type ReactNode } from "react"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"
import { Field, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"

type FieldTone = "neutral" | "warning" | "danger" | "success"

/** Label/status stay left; conflict selection precedes the source action at the right edge. */
export function FormFieldHeader({
  label,
  htmlFor,
  badge,
  candidates,
  sourceAction,
  className,
  ...props
}: ComponentProps<"div"> & {
  label: ReactNode
  htmlFor?: string
  badge?: ReactNode
  candidates?: ReactNode
  sourceAction?: ReactNode
}) {
  return (
    <div
      data-slot="form-field-header"
      className={cn(
        "flex min-h-[var(--text-base--line-height)] min-w-0 flex-wrap items-center gap-x-2 gap-y-1",
        className
      )}
      {...props}
    >
      <FieldLabel
        htmlFor={htmlFor}
        className="text-foreground"
      >
        {label}
      </FieldLabel>
      {badge && (
        <span
          data-slot="form-field-status"
          className="inline-flex max-w-full items-center gap-1"
        >
          {badge}
        </span>
      )}
      {(candidates || sourceAction) && (
        <span
          data-slot="form-field-actions"
          className="ml-auto inline-flex max-w-full min-w-0 flex-wrap items-center justify-end gap-2"
        >
          {candidates && (
            <span
              data-slot="form-field-candidates"
              className="inline-flex max-w-full min-w-0"
            >
              {candidates}
            </span>
          )}
          {sourceAction && (
            <span
              data-slot="form-field-source"
              className="inline-flex max-w-full min-w-0"
            >
              {sourceAction}
            </span>
          )}
        </span>
      )}
    </div>
  )
}

export function FormFieldMessage({
  tone = "neutral",
  className,
  children,
  ...props
}: ComponentProps<"div"> & { tone?: FieldTone }) {
  // Figma FieldDescription: 13/18 with a 16px icon; warning keeps the info icon.
  const Icon = tone === "danger" ? AlertCircle : tone === "success" ? CheckCircle2 : Info
  return (
    <div
      data-slot="form-field-message"
      role={tone === "danger" ? "alert" : undefined}
      className={cn(
        "flex min-w-0 items-center gap-1 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-muted-foreground",
        tone === "warning" && "text-[var(--warning)]",
        tone === "success" && "text-[var(--success)]",
        tone === "danger" && "text-destructive",
        className
      )}
      {...props}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span className="min-w-0 break-words">{children}</span>
    </div>
  )
}

export function FormField({
  label,
  htmlFor,
  badge,
  candidates,
  sourceAction,
  message,
  messageId,
  tone,
  children,
  className,
  ...props
}: ComponentProps<typeof Field> & {
  label: ReactNode
  htmlFor?: string
  badge?: ReactNode
  candidates?: ReactNode
  sourceAction?: ReactNode
  message?: ReactNode
  messageId?: string
  tone?: FieldTone
}) {
  return (
    <Field
      data-form-field="true"
      className={cn("min-w-0 gap-2", className)}
      {...props}
    >
      <FormFieldHeader
        label={label}
        htmlFor={htmlFor}
        badge={badge}
        candidates={candidates}
        sourceAction={sourceAction}
      />
      <div data-slot="form-field-control" className="min-w-0">
        {children}
      </div>
      {message && (
        <FormFieldMessage id={messageId} tone={tone}>
          {message}
        </FormFieldMessage>
      )}
    </Field>
  )
}

/** A single control keeps its implicit label association, including settings forms. */
export function SimpleFormField({
  label,
  children,
  className,
  ...props
}: ComponentProps<"label"> & { label: ReactNode }) {
  return (
    <label
      data-form-field="true"
      className={cn("flex min-w-0 flex-col gap-2 text-sm", className)}
      {...props}
    >
      <span
        data-slot="form-field-header"
        className="flex min-h-7 items-center gap-2 text-xs font-medium"
      >
        {label}
      </span>
      {children}
    </label>
  )
}

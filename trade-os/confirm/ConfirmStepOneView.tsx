import { useState, type ChangeEvent } from "react"
import { History, ChevronUp, ChevronDown, Check } from "lucide-react"
import { type ReviewedField } from "@trade-os/lib/erpDocumentWorkflow"
import { FormField } from "@shared/components/FormItem"
import { ToneBadge } from "@trade-os/components/ToneBadge"
import { cn } from "@shared/lib/utils"
import { Popover, PopoverTrigger, PopoverContent } from "@shared/components/ui/popover"
import { Button } from "@shared/components/ui/button"
import { Input } from "@shared/components/ui/input"
import { type PrototypeSlotKind, isNumericInputKind } from "@trade-os/documents/documentTemplateModel"
import { normalizeDecimalInput } from "@trade-os/lib/money"
import { type RecentDocument, type ReviewField } from "@/App"
import { resolvedReviewFields, inputTypeForKind } from "@trade-os/inbox/uploadDocumentModel"

export function UploadFieldHistory() {
  const [open, setOpen] = useState(false)

  return (
    <section className="overflow-hidden rounded-lg border border-[var(--surface-border)] bg-background">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-xs font-semibold hover:bg-muted/30"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <History className="size-3.5 text-muted-foreground" />
        필드 변경 이력
        <span className="ml-auto text-[10px] font-normal text-muted-foreground">
          AI 최초 추출 포함
        </span>
        {open ? (
          <ChevronUp className="size-3.5" />
        ) : (
          <ChevronDown className="size-3.5" />
        )}
      </button>
      {open ? (
        <div className="border-t border-[var(--surface-border)] px-4 py-3 text-[11px]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
            <span className="font-semibold text-foreground">AI 근거</span>
            <span>문서 최초 추출</span>
            <span>문서 버전 1</span>
          </div>
          <div className="mt-3 divide-y divide-[var(--surface-border)]">
            <div className="flex items-center justify-between gap-4 py-2 first:pt-0">
              <span className="min-w-0 truncate">Payment 문구 확인</span>
              <span className="shrink-0 text-muted-foreground">
                조민영 · 방금 전
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 py-2 last:pb-0">
              <span className="min-w-0 truncate">수량 단위를 MT로 분리</span>
              <span className="shrink-0 text-muted-foreground">
                AI 추출 · 3분 전
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export function OcrFieldReviewList({
  mode,
  documentType,
  onAutoSave,
  reviewedFields,
  onReviewedFieldChange,
}: {
  mode: "compare" | "deal"
  documentType: RecentDocument["documentType"]
  onAutoSave: (phase?: "pending" | "commit") => void
  reviewedFields?: Record<string, ReviewedField>
  onReviewedFieldChange: (key: string, patch: Partial<ReviewedField>) => void
}) {
  const fields = resolvedReviewFields({ documentType, reviewedFields })
  const [unitOverrides, setUnitOverrides] = useState<Record<string, string>>({})
  const quantityUnit =
    unitOverrides.quantity ??
    fields.find((field) => field.key === "quantity")?.unit

  const resolvedUnitFor = (field: ReviewField) => {
    const currentUnit = unitOverrides[field.key] ?? field.unit
    if (field.key !== "unit_price" || !currentUnit?.includes("/")) {
      return currentUnit
    }
    const [currency] = currentUnit.split("/")
    return quantityUnit ? `${currency}/${quantityUnit}` : currentUnit
  }

  return (
    <div className="@container">
      <div className="grid grid-cols-1 gap-x-4 @min-[720px]:grid-cols-2">
        {fields.map((field) => {
          const danger = field.tone === "danger"
          const warning = field.tone === "warning"
          return (
            <FormField
              key={field.key}
              data-upload-field={field.key}
              htmlFor={`upload-field-${field.key}`}
              label={field.label}
              badge={<ToneBadge tone={field.tone}>{field.status}</ToneBadge>}
              message={field.userEdited ? field.comment : `${field.confidence} · ${field.comment}`}
              messageId={`upload-field-${field.key}-message`}
              tone={danger ? "danger" : warning ? "warning" : "neutral"}
              className={cn(
                "py-2.5",
                (danger || warning || field.key === "payment") && "@min-[720px]:col-span-2"
              )}
            >
                <SavingField
                  id={`upload-field-${field.key}`}
                  describedBy={`upload-field-${field.key}-message`}
                  value={field.value}
                  kind={field.kind}
                  unit={resolvedUnitFor(field)}
                  unitLabel={field.label}
                  onUnitChange={(unit) => {
                    setUnitOverrides((current) => ({ ...current, [field.key]: unit }))
                    onReviewedFieldChange(field.key, { unit })
                  }}
                  placeholder={danger ? `${field.label} 입력` : undefined}
                  emphasized={mode === "deal" && warning}
                  danger={danger}
                  onAutoSave={onAutoSave}
                  onValueChange={(value) => onReviewedFieldChange(field.key, { value })}
                />
            </FormField>
          )
        })}
      </div>
    </div>
  )
}

const REVIEW_CURRENCIES = ["USD", "EUR", "KRW", "JPY", "CNY"]

function CurrencyUnitSelect({
  value,
  label,
  onChange,
}: {
  value: string
  label: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [currency, ...unitParts] = value.split("/")
  const suffix = unitParts.length > 0 ? `/${unitParts.join("/")}` : ""

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 min-w-24 shrink-0 justify-between gap-2 px-3"
          aria-label={`${label} 통화 선택`}
        >
          <span className="truncate">{value}</span>
          <ChevronDown className="size-3.5" data-icon="inline-end" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 gap-0 p-2">
        <div className="px-2 py-1.5 text-[11px] font-semibold">통화 선택</div>
        <div className="grid gap-0.5">
          {REVIEW_CURRENCIES.map((option) => (
            <Button
              key={option}
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                onChange(`${option}${suffix}`)
                setOpen(false)
              }}
            >
              <span className="min-w-0 flex-1 text-left">{option}</span>
              {currency === option ? (
                <Check className="size-3.5 text-primary" />
              ) : null}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function EditableUnitInput({
  value,
  label,
  onChange,
  onCommit,
}: {
  value: string
  label: string
  onChange: (value: string) => void
  onCommit: () => void
}) {
  return (
    <Input
      value={value}
      aria-label={`${label} 단위 입력`}
      className="h-10 w-28 shrink-0 bg-[var(--control-background)] text-sm font-medium"
      placeholder="단위"
      onChange={(event) => {
        const nextUnit = event.target.value
        onChange(nextUnit)
      }}
      onBlur={onCommit}
    />
  )
}

function SavingField({
  id,
  describedBy,
  value,
  kind,
  unit,
  unitLabel,
  placeholder,
  emphasized,
  danger,
  onAutoSave,
  onValueChange,
  onUnitChange,
}: {
  id?: string
  describedBy?: string
  value: string
  kind: PrototypeSlotKind
  unit?: string
  unitLabel: string
  placeholder?: string
  emphasized: boolean
  danger: boolean
  onAutoSave?: (phase?: "pending" | "commit") => void
  onValueChange?: (value: string) => void
  onUnitChange?: (unit: string) => void
}) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onAutoSave?.("pending")
    onValueChange?.(event.target.value)
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        id={id}
        aria-describedby={describedBy}
        aria-invalid={danger || emphasized || undefined}
        className={cn(
          "h-10 min-w-0 flex-1 bg-[var(--control-background)] text-sm",
          danger && "border-destructive/50 ring-1 ring-destructive/20",
          emphasized && !danger && "border-warning/50 ring-1 ring-warning/20"
        )}
        type={inputTypeForKind(kind)}
        inputMode={isNumericInputKind(kind) ? "decimal" : undefined}
        step={isNumericInputKind(kind) ? "any" : undefined}
        defaultValue={isNumericInputKind(kind) ? normalizeDecimalInput(value) : value}
        aria-label={unitLabel}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={() => onAutoSave?.("commit")}
      />
      {unit !== undefined ? (
        kind === "money" || REVIEW_CURRENCIES.includes(unit) ? (
          <CurrencyUnitSelect
            value={unit}
            label={unitLabel}
            onChange={(nextUnit) => {
              onUnitChange?.(nextUnit)
              onAutoSave?.("pending")
              onAutoSave?.("commit")
            }}
          />
        ) : (
          <EditableUnitInput
            value={unit}
            label={unitLabel}
            onChange={(nextUnit) => {
              onUnitChange?.(nextUnit)
              onAutoSave?.("pending")
            }}
            onCommit={() => onAutoSave?.("commit")}
          />
        )
      ) : null}
    </div>
  )
}

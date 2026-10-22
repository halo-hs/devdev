import { useState, useRef, useEffect } from "react"
import { templateSchemas, templates, sampleValueForSlot, type PrototypeSlotKind, type Tone, isNumericInputKind, type DocumentStyle } from "@trade-os/documents/documentTemplateModel"
import { Tabs, TabsList, TabsTrigger } from "@shared/components/ui/tabs"
import { ToneBadge } from "@trade-os/components/tone-badge"
import { Button } from "@shared/components/ui/button"
import { ChevronLeft, ChevronRight, FilePlus2, Check, FileText, ChevronDown, Plus, Trash2, Copy, Send, Clock3 } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { Item, ItemMedia, ItemContent, ItemDescription, ItemTitle, ItemActions } from "@shared/components/ui/item"
import { Popover, PopoverTrigger, PopoverContent } from "@shared/components/ui/popover"
import { decimalMagnitude, FINANCE_DECIMAL_SCALE } from "@trade-os/lib/financeDecimal"
import { normalizeDecimalInput } from "@trade-os/lib/money"
import { exactDocumentMoneyTotals, exactLineItemAmount } from "@trade-os/lib/document-money"
import { FormField } from "@shared/components/form-field"
import { Input } from "@shared/components/ui/input"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@shared/components/ui/table"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@shared/components/ui/select"
import { ScrollArea } from "@shared/components/ui/scroll-area"
import { type CreateStartMode, type DocumentDirection, type DealDocumentContext, type ReviewFocusRequest, type ReviewFocusTarget, type DocumentComparisonFacts, type DocumentApprovalChoice, type DocumentElementStatus, type DocumentApprovalEvent, type DeliveryLink, type EmailRecord, type DocumentDiscrepancyReview, type ReviewChecklistRow } from "@/App"
import { templateDirections, quotationMoney, buildDocumentReviewRows } from "@trade-os/documents/documentTemplateModel"
import { inputTypeForKind } from "@trade-os/inbox/uploadDocumentModel"

export function TemplateStrip({ onResult, initialSelectedCode }: {
  onResult: (mode?: CreateStartMode, templateCode?: string, direction?: DocumentDirection) => void
  initialSelectedCode?: string
}) {
  const [direction, setDirection] = useState<"purchase" | "sales">("purchase")
  const [selectedCode, setSelectedCode] = useState<string>(
    initialSelectedCode && templateSchemas[initialSelectedCode]
      ? initialSelectedCode
      : templates[0][0]
  )
  const visibleTemplates = templates.filter(([kind]) =>
    templateDirections[kind].some((availableDirection) => availableDirection === direction)
  )
  const viewportRef = useRef<HTMLDivElement>(null)
  const [scrollState, setScrollState] = useState({ previous: false, next: false })
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const update = () => setScrollState({
      previous: viewport.scrollLeft > 1,
      next: viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 1,
    })
    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    viewport.addEventListener("scroll", update, { passive: true })
    update()
    return () => {
      observer.disconnect()
      viewport.removeEventListener("scroll", update)
    }
  }, [])
  const scroll = (direction: number) => {
    const viewport = viewportRef.current
    viewport?.scrollBy({
      left: direction * viewport.clientWidth * 0.8,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    })
  }
  return (
    <section
      aria-label="문서 폼 선택"
      className="min-w-0 rounded-[var(--r-lg)] bg-[var(--color-gray-12)] px-5 pt-5 pb-2 text-[var(--color-gray-2)] shadow-[var(--shadow-modal)] ring-1 ring-[var(--color-gray-10)]"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Tabs
            value={direction}
            onValueChange={(value) => {
              const nextDirection = value as "purchase" | "sales"
              const nextTemplates = templates.filter(([kind]) =>
                templateDirections[kind].some(
                  (availableDirection) => availableDirection === nextDirection
                )
              )
              setDirection(nextDirection)
              setSelectedCode(nextTemplates[0]?.[0] ?? "")
            }}
          >
            <TabsList aria-label="거래 방향">
              <TabsTrigger value="purchase">구매</TabsTrigger>
              <TabsTrigger value="sales">판매</TabsTrigger>
            </TabsList>
          </Tabs>
          <h2 className="text-base font-semibold">문서 유형 선택</h2>
          <ToneBadge tone="neutral">{visibleTemplates.length}개</ToneBadge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" aria-label="이전 문서 유형" disabled={!scrollState.previous} onClick={() => scroll(-1)}><ChevronLeft /></Button>
          <Button variant="outline" size="icon-sm" aria-label="다음 문서 유형" disabled={!scrollState.next} onClick={() => scroll(1)}><ChevronRight /></Button>
          <Button size="sm" onClick={() => onResult("template", selectedCode, direction)}>
            <FilePlus2 data-icon="inline-start" />문서 만들기
          </Button>
        </div>
      </div>
      <div ref={viewportRef} aria-label="문서 유형 목록" className="-mx-1 flex min-w-0 snap-x snap-proximity scroll-px-1 gap-3 overflow-x-auto overscroll-x-contain px-1 pt-1 pb-3">
        {visibleTemplates.map(([kind, title, description]) => {
          const selected = selectedCode === kind
          return (
            <button key={kind} type="button" aria-pressed={selected}
              onClick={() => setSelectedCode(kind)}
              className={cn("flex w-60 shrink-0 snap-start flex-col items-start rounded-lg border border-[var(--color-gray-9)] bg-[var(--color-gray-12)] p-4 text-left transition hover:border-[var(--color-primary-4)] focus-visible:outline-2 focus-visible:outline-primary", selected && "border-[var(--color-primary-4)] bg-[var(--color-primary-10)] ring-1 ring-[var(--color-primary-4)] ring-inset")}
            >
              <span className="flex w-full items-center justify-between gap-2"><ToneBadge tone="blue">{kind}</ToneBadge>{selected && <Check className="size-4 text-[var(--color-primary-4)]" />}</span>
              <strong className="mt-2 text-sm">{title} <span className="text-xs font-normal text-muted-foreground">· {direction === "purchase" ? "구매" : "판매"}</span></strong>
              <span className="mt-1.5 text-xs leading-5 text-muted-foreground">{description}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function RelatedDealNotice({
  deal,
  compact = false,
}: {
  deal: DealDocumentContext
  compact?: boolean
}) {
  return (
    <Item
      variant="muted"
      size={compact ? "xs" : "default"}
      className={cn(
        "mx-auto mb-4 flex-nowrap text-left",
        !compact && "max-w-3xl"
      )}
    >
      <ItemMedia variant="icon">
        <FileText className="size-4 shrink-0 text-primary" />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemDescription className="text-xs">
          이 거래와 연결해 문서를 만듭니다
        </ItemDescription>
        <ItemTitle className="truncate text-sm font-semibold">
          {deal.title}
        </ItemTitle>
      </ItemContent>
      <ItemActions className="block shrink-0 text-right">
        <div className="text-xs font-medium">{deal.id}</div>
        <div className="max-w-52 truncate text-xs text-[var(--surface-muted-foreground)]">
          {deal.party}
        </div>
      </ItemActions>
    </Item>
  )
}

// Kept as a reference fallback for the earlier public-link preview.
function CreateFieldValuePicker({ label, value, options, onSelect }: {
  label: string
  value: string
  options: [string, string][]
  onSelect: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 px-2 text-[11px]" aria-label={`${label} 후보 값 선택`}>
          후보 값 {options.length}개 <ChevronDown className="size-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 max-w-[calc(100vw-2rem)] gap-1 p-1">
        {options.map(([source, candidate]) => (
          <Button type="button" variant="ghost" key={source} className="h-auto w-full justify-between gap-3 whitespace-normal px-2 py-2 text-left text-xs" onClick={() => { onSelect(candidate); setOpen(false) }}>
            <span className="shrink-0 text-muted-foreground">{source}</span>
            <span className="min-w-0 flex-1 break-words">{candidate}</span>
            {value === candidate ? <Check aria-hidden="true" className="size-3.5 shrink-0" /> : null}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

export function CreateFieldReviewPanel({
  itemFocusSignal,
  reviewFocusRequest,
  reviewIssueTargets,
  onItemCountChange,
  onRequiredMissingChange,
  onComparisonFactsChange,
  onContentChange,
  templateCode,
  sourceLabel = "등록된 원본",
  startBlank = false,
}: {
  itemFocusSignal: number
  reviewFocusRequest: ReviewFocusRequest | null
  reviewIssueTargets: ReviewFocusTarget[]
  onItemCountChange: (count: number) => void
  onRequiredMissingChange: (issues: ReviewFocusTarget[]) => void
  onComparisonFactsChange?: (facts: DocumentComparisonFacts) => void
  onContentChange?: () => void
  templateCode: string
  sourceLabel?: string
  startBlank?: boolean
}) {
  const panelRef = useRef<HTMLElement | null>(null)
  const itemEditorRef = useRef<HTMLDivElement | null>(null)
  const firstItemInputRef = useRef<HTMLInputElement | null>(null)
  const firstItemUnitPriceRef = useRef<HTMLInputElement | null>(null)
  const [itemEditorHighlighted, setItemEditorHighlighted] = useState(false)
  const [focusedReviewKey, setFocusedReviewKey] = useState<string | null>(null)
  const reviewIssueKeys = new Set(
    reviewIssueTargets.map((target) => target.key)
  )
  const lineItemIssueLabels = Array.from(
    new Set(
      reviewIssueTargets
        .filter((target) => ["item_name", "item_amount"].includes(target.key))
        .map((target) => target.label)
    )
  )
  const initialItemRows = [
    {
      id: "item-1",
      name: startBlank ? "" : "Aluminium Scrap Tough Taboo",
      quantity: startBlank ? "" : "20",
      unit: "MT",
      unitPrice: startBlank ? "" : "128333",
      source: startBlank ? "직접입력" : "업로드값",
    },
  ]
  const activeSchema = templateSchemas[templateCode] ?? templateSchemas.SC
  const hasLineItems = Boolean(activeSchema.lineItems)
  const fieldRows = activeSchema.slots.map((slot, index) => ({
    key: slot.key,
    label: slot.label,
    kind: slot.kind,
    value: sampleValueForSlot(slot),
    status: slot.required ? "정상" : index % 3 === 0 ? "권장" : "추출",
    tone: slot.required ? "success" : index % 3 === 0 ? "blue" : "neutral",
    assists: [
      ["거래값 사용", sampleValueForSlot(slot)],
      [
        "최근값 사용",
        slot.kind === "date" ? "2026-07-03" : sampleValueForSlot(slot),
      ],
    ] as [string, string][],
  })) satisfies Array<{
    key: string
    label: string
    kind: PrototypeSlotKind
    value: string
    status: string
    tone: Tone
    assists: [string, string][]
  }>
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(
    Object.fromEntries(
      fieldRows.map((row) => [row.key, startBlank ? "" : row.value])
    )
  )
  const [itemRows, setItemRows] = useState(initialItemRows)
  const [itemValues, setItemValues] = useState<
    Record<
      string,
      { name: string; quantity: string; unit: string; unitPrice: string }
    >
  >(
    Object.fromEntries(
      initialItemRows.map((item) => [
        item.id,
        {
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
        },
      ])
    )
  )
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([])
  const [assistPanelKey, setAssistPanelKey] = useState<string | null>(null)
  const [assistPanelPosition, setAssistPanelPosition] = useState<{
    left: number
    top: number
    width: number
    maxHeight: number
  } | null>(null)
  const visibleItemRows = hasLineItems
    ? itemRows.filter((item) => !deletedItemIds.includes(item.id))
    : []
  const addItem = () => {
    const item = {
      id: `item-${crypto.randomUUID()}`,
      name: "",
      quantity: "",
      unit: "MT",
      unitPrice: "",
      source: "직접입력",
    }
    setItemRows((rows) => [...rows, item])
    setItemValues((values) => ({ ...values, [item.id]: item }))
    onContentChange?.()
    window.requestAnimationFrame(() => firstItemInputRef.current?.focus())
  }
  const completedItemCount = visibleItemRows.filter((item) => {
    const values = itemValues[item.id]
    return Boolean(
      values?.name.trim() &&
      values.quantity.trim() &&
      values.unit.trim() &&
      values.unitPrice.trim()
    )
  }).length
  const requiredIssues: ReviewFocusTarget[] = fieldRows.flatMap((row) => {
    const slot = activeSchema.slots.find((candidate) => candidate.key === row.key)
    return slot?.required && !fieldValues[row.key]?.trim()
      ? [{ key: row.key, label: `${row.label} · 필수값 누락` }] : []
  })
  if (hasLineItems) {
    if (!visibleItemRows.length) requiredIssues.push({ key: "item_name", label: "품목 · 1개 이상 입력" })
    visibleItemRows.forEach((item, index) => {
      const values = itemValues[item.id]
      const names = { name: "품목명", quantity: "수량", unit: "단위", unitPrice: "단가" }
      for (const field of ["name", "quantity", "unit", "unitPrice"] as const) {
        const value = values?.[field]
        const missing = !value?.trim()
        const invalid = !missing && ["quantity", "unitPrice"].includes(field)
          && (decimalMagnitude(normalizeDecimalInput(value), FINANCE_DECIMAL_SCALE) ?? BigInt(-1)) < BigInt(0)
        if (missing || invalid) requiredIssues.push({
          key: `item-field:${index + 1}:${field}`,
          label: `품목 ${index + 1} ${names[field]} · ${missing ? "필수값 누락" : "0 이상의 숫자를 입력하세요"}`,
        })
      }
    })
  }
  const missingItemValueCount = requiredIssues.filter((issue) => issue.key.startsWith("item-field:")).length
  const requiredIssuesKey = JSON.stringify(requiredIssues)
  const reviewIssueCount = new Set([...requiredIssues.map((issue) => issue.key), ...reviewIssueKeys]).size
  const comparisonCounterparty =
    [
      "buyer_name",
      "customer_name",
      "supplier_name",
      "counterparty_name",
      "consignee_name",
      "applicant_name",
      "importer_name",
      "recipient_name",
    ]
      .map((key) => fieldValues[key]?.trim())
      .find(Boolean) ?? ""
  const comparisonItemNames = visibleItemRows
    .map((item) => itemValues[item.id]?.name.trim() ?? "")
    .filter(Boolean)
  const comparisonItemNamesKey = comparisonItemNames.join("\u001f")
  const comparisonTotalAmount = exactDocumentMoneyTotals(
    visibleItemRows.map((item) => ({
      quantity: itemValues[item.id]?.quantity,
      unit_price: itemValues[item.id]?.unitPrice,
    })),
    {},
  ).grandTotal
  const calculateItemAmount = (itemId: string) => {
    const values = itemValues[itemId]
    if (!values?.quantity.trim() || !values?.unitPrice.trim()) return "자동 계산"
    return `${quotationMoney(exactLineItemAmount(values.quantity, values.unitPrice))} ${fieldValues.currency?.trim() || "USD"}`
  }
  const itemAssistRows = itemRows.flatMap((item) => [
    {
      key: `${item.id}:name`,
      assists: [
        ["업로드값 사용", item.name],
        [
          "최근값 사용",
          item.id === "item-1"
            ? "Aluminium Scrap Taint Tabor"
            : "Aluminium Scrap Tough Taboo",
        ],
      ],
    },
    {
      key: `${item.id}:quantity`,
      assists: [
        ["업로드값 사용", item.quantity],
        ["최근값 사용", item.id === "item-1" ? "24" : "4"],
      ],
    },
    {
      key: `${item.id}:unitPrice`,
      assists: [
        ["최근값 사용", "128333"],
        ["거래값 사용", "120000"],
      ],
    },
  ])
  const openAssistPanel = (key: string, anchor: HTMLElement) => {
    const rect = anchor.getBoundingClientRect()
    const panelWidth = Math.min(360, Math.max(260, rect.width))
    const left = Math.min(
      Math.max(12, rect.left),
      window.innerWidth - panelWidth - 12
    )
    const bottomSpace = window.innerHeight - rect.bottom - 12
    const topSpace = rect.top - 12
    const opensUpward = bottomSpace < 140 && topSpace > bottomSpace
    const maxHeight = Math.min(
      240,
      Math.max(120, opensUpward ? topSpace - 6 : bottomSpace - 6)
    )
    const top = opensUpward
      ? Math.max(12, rect.top - maxHeight - 6)
      : rect.bottom + 6
    setAssistPanelKey(key)
    setAssistPanelPosition({ left, top, width: panelWidth, maxHeight })
  }
  const applyAssistValue = (key: string, value: string) => {
    if (key.includes(":")) {
      const [itemId, field] = key.split(":") as [
        string,
        "name" | "quantity" | "unitPrice",
      ]
      setItemValues((current) => ({
        ...current,
        [itemId]: {
          ...current[itemId],
          [field]: value,
        },
      }))
      onContentChange?.()
      setAssistPanelKey(null)
      setAssistPanelPosition(null)
      return
    }
    setFieldValues((current) => ({ ...current, [key]: value }))
    onContentChange?.()
    setAssistPanelKey(null)
    setAssistPanelPosition(null)
  }
  const activeAssistRow =
    fieldRows.find((row) => row.key === assistPanelKey) ??
    itemAssistRows.find((row) => row.key === assistPanelKey)
  useEffect(() => {
    if (itemFocusSignal === 0) return
    const hasOpenDraft = visibleItemRows.some((item) => {
      const values = itemValues[item.id]
      return (
        !values?.name.trim() ||
        !values.quantity.trim() ||
        !values.unit.trim() ||
        !values.unitPrice.trim()
      )
    })
    if (!hasOpenDraft) {
      const nextNumber = itemRows.length + 1
      const id = `item-${nextNumber}`
      // The separate document-element rail intentionally opens a new draft row.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItemRows((rows) => [
        ...rows,
        {
          id,
          name: "",
          quantity: "",
          unit: "MT",
          unitPrice: "",
          source: "직접입력",
        },
      ])
      setItemValues((current) => ({
        ...current,
        [id]: {
          name: "",
          quantity: "",
          unit: "MT",
          unitPrice: "",
        },
      }))
    }
    const focusTimer = window.setTimeout(() => {
      itemEditorRef.current?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      })
      firstItemInputRef.current?.focus()
      setItemEditorHighlighted(true)
    }, 80)
    const highlightTimer = window.setTimeout(
      () => setItemEditorHighlighted(false),
      1600
    )
    return () => {
      window.clearTimeout(focusTimer)
      window.clearTimeout(highlightTimer)
    }
  }, [itemFocusSignal]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!reviewFocusRequest) return
    const primaryTarget = reviewFocusRequest.targets[0]
    if (!primaryTarget) return
    const focusTimer = window.setTimeout(() => {
      if (primaryTarget.key.startsWith("item-field:")) {
        const [, index, field] = primaryTarget.key.split(":")
        const names: Record<string, string> = { name: "품목명", quantity: "수량", unit: "단위", unitPrice: "단가" }
        const control = panelRef.current?.querySelector<HTMLElement>(`[aria-label="품목 ${index} ${names[field]}"]`)
        control?.focus({ preventScroll: true })
        control?.closest("tr")?.scrollIntoView({ block: "center", behavior: "smooth" })
      } else if (
        primaryTarget.key === "item_name" ||
        primaryTarget.key === "item_amount"
      ) {
        itemEditorRef.current?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        })
        if (primaryTarget.key === "item_name")
          firstItemInputRef.current?.focus({ preventScroll: true })
        else firstItemUnitPriceRef.current?.focus({ preventScroll: true })
      } else {
        const target = panelRef.current?.querySelector<HTMLElement>(
          `[data-review-key="${primaryTarget.key}"]`
        )
        target?.scrollIntoView({ block: "center", behavior: "smooth" })
        target?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true })
      }
      setFocusedReviewKey(primaryTarget.key)
    }, 80)
    const highlightTimer = window.setTimeout(
      () => setFocusedReviewKey(null),
      1800
    )
    return () => {
      window.clearTimeout(focusTimer)
      window.clearTimeout(highlightTimer)
    }
  }, [reviewFocusRequest])
  useEffect(() => {
    onItemCountChange(completedItemCount)
  }, [completedItemCount, onItemCountChange])
  useEffect(() => {
    onRequiredMissingChange(JSON.parse(requiredIssuesKey) as ReviewFocusTarget[])
  }, [requiredIssuesKey, onRequiredMissingChange])
  useEffect(() => {
    onComparisonFactsChange?.({
      counterparty: comparisonCounterparty,
      currency: fieldValues.currency?.trim() ?? "",
      bankName: fieldValues.bank_name?.trim() ?? "",
      bankAccount: fieldValues.bank_account?.trim() ?? "",
      itemNames: comparisonItemNamesKey
        ? comparisonItemNamesKey.split("\u001f")
        : [],
      totalAmount: missingItemValueCount === 0 && visibleItemRows.length > 0 ? comparisonTotalAmount : null,
    })
  }, [
    comparisonCounterparty,
    comparisonItemNamesKey,
    comparisonTotalAmount,
    missingItemValueCount,
    visibleItemRows.length,
    fieldValues.bank_account,
    fieldValues.bank_name,
    fieldValues.currency,
    onComparisonFactsChange,
  ])
  return (
    <aside
      ref={panelRef}
      className="@container flex min-h-0 flex-col border-r bg-background"
      onChange={() => onContentChange?.()}
    >
      <div className="px-5 pt-5 pb-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-bold">항목 확인</div>
            <div className="mt-1 max-w-72 truncate text-xs text-muted-foreground">
              {startBlank ? "직접 입력" : `출처 · ${sourceLabel}`}
            </div>
          </div>
          <ToneBadge tone={reviewIssueCount > 0 ? "danger" : "success"}>
            {reviewIssueCount > 0
              ? `검토 필요 ${reviewIssueCount}건`
              : "검토 완료"}
          </ToneBadge>
        </div>
      </div>

      <div className="field-scrollbar min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 @min-[720px]:grid-cols-2">
          {fieldRows.map((row) => (
            <div
              key={row.key}
              data-review-key={row.key}
              className={cn(
                "relative bg-background px-5 py-2.5 transition-colors",
                focusedReviewKey === row.key && "scroll-mt-4"
              )}
            >
              <FormField
                label={row.label}
                htmlFor={`create-field-${row.key}`}
                badge={
                  <ToneBadge
                    tone={
                      reviewIssueKeys.has(row.key)
                        ? "danger"
                        : !fieldValues[row.key]?.trim()
                          ? "neutral"
                          : (row.tone as Tone)
                    }
                  >
                    {reviewIssueKeys.has(row.key)
                      ? "점검 불일치"
                      : !fieldValues[row.key]?.trim()
                        ? activeSchema.slots.some(
                            (slot) => slot.key === row.key && slot.required
                          )
                          ? "필수"
                          : "선택"
                        : row.status}
                  </ToneBadge>
                }
                message={reviewIssueKeys.has(row.key) ? "문서의 값과 비교해 주세요." : undefined}
                messageId={`create-field-${row.key}-message`}
                tone={reviewIssueKeys.has(row.key) ? "danger" : "neutral"}
                candidates={!startBlank && row.assists.length > 0 ? (
                  <CreateFieldValuePicker label={row.label} value={fieldValues[row.key] ?? ""} options={row.assists} onSelect={(value) => applyAssistValue(row.key, value)} />
                ) : undefined}
              >
              <div className="relative">
              <Input
                id={`create-field-${row.key}`}
                aria-describedby={reviewIssueKeys.has(row.key) ? `create-field-${row.key}-message` : undefined}
                className={cn("h-10 text-sm font-medium", row.kind === "money" && "pr-14")}
                aria-invalid={reviewIssueKeys.has(row.key) || requiredIssues.some((issue) => issue.key === row.key) || undefined}
                type={inputTypeForKind(row.kind)}
                inputMode={
                  isNumericInputKind(row.kind as PrototypeSlotKind)
                    ? "decimal"
                    : undefined
                }
                step={
                  isNumericInputKind(row.kind as PrototypeSlotKind)
                    ? "any"
                    : undefined
                }
                value={fieldValues[row.key] ?? ""}
                onChange={(event) => {
                  setFieldValues((current) => ({
                    ...current,
                    [row.key]: event.target.value,
                  }))
                }}
                placeholder={
                  !fieldValues[row.key] ? `${row.label} 입력` : undefined
                }
              />
              {row.kind === "money" ? (
                <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] font-medium text-muted-foreground">
                  {fieldValues.currency?.trim() || "USD"}
                </div>
              ) : null}
              </div>
              </FormField>
            </div>
          ))}
        </div>

        <div
          ref={itemEditorRef}
          className={cn(
            "border-t px-5 py-4 transition-colors duration-300",
            (itemEditorHighlighted || focusedReviewKey === "item_name" || focusedReviewKey === "item_amount") && "scroll-mt-4",
            !hasLineItems && "hidden"
          )}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">품목</div>
              {lineItemIssueLabels.length > 0 ? (
                <div className="mt-1 text-[11px] font-medium text-destructive">
                  은행 거절 전 점검 · {lineItemIssueLabels.join(", ")}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5">
              <ToneBadge
                tone={
                  completedItemCount === visibleItemRows.length &&
                  visibleItemRows.length > 0
                    ? "success"
                    : visibleItemRows.length > 0
                      ? "warning"
                      : "neutral"
                }
              >
                {visibleItemRows.length > 0
                  ? `${completedItemCount}/${visibleItemRows.length}`
                  : "품목 없음"}
              </ToneBadge>
              <Button variant="outline" size="sm" type="button" onClick={addItem}>
                <Plus data-icon="inline-start" /> 품목 추가
              </Button>
              {visibleItemRows.length > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="text-[11px] text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                  onClick={() => {
                    setDeletedItemIds(itemRows.map((item) => item.id))
                    setAssistPanelKey(null)
                    setAssistPanelPosition(null)
                    onContentChange?.()
                  }}
                >
                  전체 삭제
                </Button>
              ) : null}
            </div>
          </div>
          <div className="overflow-x-auto rounded-md border">
            <Table className="min-w-[640px] table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%] text-left!">품목명</TableHead>
                  <TableHead className="w-[12%] text-left!">수량</TableHead>
                  <TableHead className="w-[14%] text-left!">단위</TableHead>
                  <TableHead className="w-[16%] text-left!">단가</TableHead>
                  <TableHead className="w-[16%] text-right!">금액</TableHead>
                  <TableHead className="sticky right-0 z-10 w-[88px] bg-background text-right!">삭제</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleItemRows.map((item, index) => (
                  <TableRow
                    key={item.id}
                    className={cn(
                      itemEditorHighlighted && index === 0 && "bg-primary/5"
                    )}
                  >
                    <TableCell className="py-2 text-left! align-top">
                      <Input
                        ref={
                          index === visibleItemRows.length - 1
                            ? firstItemInputRef
                            : undefined
                        }
                        className="h-8"
                        aria-invalid={reviewIssueKeys.has("item_name") || requiredIssues.some((issue) => issue.key === `item-field:${index + 1}:name`) || undefined}
                        aria-label={`품목 ${index + 1} 품목명`}
                        aria-required="true"
                        value={itemValues[item.id]?.name ?? ""}
                        placeholder="필수"
                        onFocus={(event) =>
                          openAssistPanel(
                            `${item.id}:name`,
                            event.currentTarget
                          )
                        }
                        onChange={(event) =>
                          setItemValues((current) => ({
                            ...current,
                            [item.id]: {
                              ...current[item.id],
                              name: event.target.value,
                            },
                          }))
                        }
                      />
                      <span className="mt-1 block text-[10px] text-muted-foreground">
                        {item.source}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 text-left! align-top">
                      <Input
                        className="h-8"
                        aria-invalid={reviewIssueKeys.has("item_amount") || requiredIssues.some((issue) => issue.key === `item-field:${index + 1}:quantity`) || undefined}
                        aria-label={`품목 ${index + 1} 수량`}
                        aria-required="true"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={itemValues[item.id]?.quantity ?? ""}
                        placeholder="필수"
                        onFocus={(event) =>
                          openAssistPanel(
                            `${item.id}:quantity`,
                            event.currentTarget
                          )
                        }
                        onChange={(event) =>
                          setItemValues((current) => ({
                            ...current,
                            [item.id]: {
                              ...current[item.id],
                              quantity: event.target.value,
                            },
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell className="py-2 text-left! align-top">
                      <Select
                        value={itemValues[item.id]?.unit ?? "MT"}
                        onValueChange={(unit) =>
                          setItemValues((current) => ({
                            ...current,
                            [item.id]: {
                              ...current[item.id],
                              unit: unit ?? "MT",
                            },
                          }))
                        }
                      >
                        <SelectTrigger
                          className="h-8 w-full"
                          aria-label={`품목 ${index + 1} 단위`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["MT", "KG", "EA", "BOX"].map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-2 text-left! align-top">
                      <Input
                        ref={index === 0 ? firstItemUnitPriceRef : undefined}
                        className="h-8"
                        aria-invalid={reviewIssueKeys.has("item_amount") || requiredIssues.some((issue) => issue.key === `item-field:${index + 1}:unitPrice`) || undefined}
                        aria-label={`품목 ${index + 1} 단가`}
                        aria-required="true"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={itemValues[item.id]?.unitPrice ?? ""}
                        placeholder="필수"
                        onFocus={(event) =>
                          openAssistPanel(
                            `${item.id}:unitPrice`,
                            event.currentTarget
                          )
                        }
                        onChange={(event) =>
                          setItemValues((current) => ({
                            ...current,
                            [item.id]: {
                              ...current[item.id],
                              unitPrice: event.target.value,
                            },
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell
                      className={cn(
                        "py-2 text-right! align-top text-xs font-medium tabular-nums",
                        reviewIssueKeys.has("item_amount") && "text-destructive"
                      )}
                    >
                      <div className="flex h-8 items-center justify-end whitespace-nowrap">
                        {calculateItemAmount(item.id)}
                      </div>
                    </TableCell>
                    <TableCell className="sticky right-0 bg-background px-2 py-2 text-right! align-top">
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        className="px-2 text-muted-foreground hover:text-destructive"
                        aria-label={`품목 ${index + 1} 삭제`}
                        onClick={() => {
                          setDeletedItemIds((ids) => [...ids, item.id])
                          setAssistPanelKey(null)
                          setAssistPanelPosition(null)
                          onContentChange?.()
                        }}
                      >
                        <Trash2 className="size-3.5" /> 삭제
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {visibleItemRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-20 text-center text-xs text-muted-foreground"
                    >
                      품목 없음
                      <Button
                        variant="link"
                        size="sm"
                        type="button"
                        className="ml-2 h-auto p-0 text-primary"
                        onClick={() => {
                          setDeletedItemIds([])
                          onContentChange?.()
                        }}
                      >
                        되돌리기
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      {activeAssistRow && assistPanelPosition ? (
        <div
          className="fixed z-[100] rounded-lg border bg-background p-1.5 shadow-xl"
          style={{
            left: assistPanelPosition.left,
            top: assistPanelPosition.top,
            width: assistPanelPosition.width,
          }}
          onMouseLeave={() => {
            setAssistPanelKey(null)
            setAssistPanelPosition(null)
          }}
        >
          <div
            className="overflow-auto"
            style={{ maxHeight: assistPanelPosition.maxHeight }}
          >
            {activeAssistRow.assists.map(([label, value]) => (
              <Button
                variant="ghost"
                key={`${activeAssistRow.key}-${label}-${value}`}
                type="button"
                className="h-auto w-full justify-between gap-3 px-2 py-2 text-left text-xs font-normal"
                onClick={() => applyAssistValue(activeAssistRow.key, value)}
              >
                <span className="shrink-0 text-muted-foreground">{label}</span>
                <span className="min-w-0 truncate font-medium text-foreground">
                  {value}
                </span>
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  )
}

export function DocumentConfirmedSummaryPanel({
  approvalChoice,
  approvalStatus,
  selectedApproverIds,
  approvalEvents,
  templateCode,
  documentNumber,
  documentStyle,
  activeLinkCount,
  deliveryRecordCount,
  activeLink,
  latestEmail,
  relatedDeal,
  dealConnectionRestricted,
  discrepancyReview,
  onOpenShare,
  onDuplicate,
  deliveryAllowed,
}: {
  approvalChoice: DocumentApprovalChoice
  approvalStatus: DocumentElementStatus["approval"]
  selectedApproverIds: string[]
  approvalEvents: DocumentApprovalEvent[]
  templateCode: string
  documentNumber: string
  documentStyle: DocumentStyle
  activeLinkCount: number
  deliveryRecordCount: number
  activeLink: DeliveryLink | null
  latestEmail: EmailRecord | null
  relatedDeal: DealDocumentContext | null
  dealConnectionRestricted: boolean
  discrepancyReview: DocumentDiscrepancyReview
  onOpenShare: () => void
  onDuplicate: () => void
  deliveryAllowed: boolean
}) {
  const lastRequestEvent = approvalEvents.findLast(
    (event) => event.type === "request"
  )
  const lastDecisionEvent = approvalEvents.findLast(
    (event) => event.type === "approve" || event.type === "reject"
  )
  const linkStatusLabel = !activeLink
    ? "미생성"
    : activeLink.status === "active"
      ? "활성"
      : activeLink.status === "expired"
        ? "만료"
        : activeLink.status === "maxed"
        ? "한도 도달"
        : "철회"
  const latestDeliveryStatus = latestEmail?.status === "failed"
    ? "전달 실패"
    : latestEmail?.status === "delivered"
      ? "전달 완료"
      : "전달 전"
  const latestRecipient = latestEmail?.recipient.replace(/(^.).*(@.*$)/, "$1***$2")
  const approvalSummaryRow: ReviewChecklistRow | null = approvalChoice === "request"
    ? {
        label: "승인",
        value: approvalStatus === "approved"
          ? lastDecisionEvent
            ? `${lastDecisionEvent.actor} 승인 · ${lastDecisionEvent.occurredAt}`
            : "승인 완료"
          : approvalStatus === "rejected"
            ? "반려"
            : approvalStatus === "requested"
              ? "승인 대기"
              : "승인 요청 전",
        state: approvalStatus === "approved" ? "complete" : approvalStatus === "rejected" ? "blocked" : "pending",
      }
    : null
  const completedReviewRows = buildDocumentReviewRows({
    missingRequiredCount: 0,
    documentStyle,
    saveState: "saved",
    qualityAcknowledged: true,
    relatedDeal,
    dealConnectionRestricted,
    discrepancyReview,
    approvalChoice,
    approvalStatus,
    selectedApproverCount: selectedApproverIds.length,
    lastRequestEvent,
    lastDecisionEvent,
    confirmationReady: true,
    documentConfirmed: true,
    templateCode,
    documentNumber,
    activeLinkCount,
    linkSlotOccupied: Boolean(activeLink && activeLink.status !== "revoked"),
    deliveryRecordCount,
    interactive: false,
    deliveryAllowed,
  }).filter((row) => row.label !== "품목 합계" && row.label !== "문서 모양").flatMap((row) => {
    if (row.label === "문서 확정" && approvalSummaryRow) return [approvalSummaryRow, row]
    if (row.label !== "은행 거절 전 점검") return row
    if (discrepancyReview.errorCount > 0) {
      return {
        ...row,
        value: `거절 위험 ${discrepancyReview.errorCount}건 · 수정 필요`,
        state: "blocked" as const,
      }
    }
    if (discrepancyReview.warningCount > 0) {
      return {
        ...row,
        value: `확인 권장 ${discrepancyReview.warningCount}건 포함`,
        state: "complete" as const,
      }
    }
    return { ...row, state: "complete" as const }
  })

  return (
    <aside className="flex h-full min-h-0 flex-col bg-[var(--surface-background)]">
      <div className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-[var(--surface-border)] px-4 py-2.5 sm:px-5">
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-[var(--surface-muted-foreground)]">문서</div>
          <div className="mt-1 flex items-center gap-2">
            <h2 className="truncate text-sm font-semibold">
              확정 문서
            </h2>
            <ToneBadge tone="success">확정</ToneBadge>
          </div>
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-4 sm:p-5">
          <section className="rounded-lg border border-success/25 bg-success/5 p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success text-white">
                <Check className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">문서가 확정되었습니다</div>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onDuplicate}>
                  <Copy data-icon="inline-start" />
                  복제해서 수정
                </Button>
                <Button type="button" size="sm" onClick={onOpenShare}>
                  <Send data-icon="inline-start" />
                  공유하기
                </Button>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">공유 현황</div>
              {deliveryAllowed ? (
                <Button variant="ghost" size="xs" onClick={onOpenShare}>
                  공유하기
                  <ChevronRight data-icon="inline-end" />
                </Button>
              ) : null}
            </div>
            <div className="mt-2 grid overflow-hidden rounded-md border bg-background sm:grid-cols-2">
              <div className="min-w-0 px-3 py-3 sm:border-r">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">공유 링크</span>
                  <ToneBadge tone={!activeLink ? "neutral" : activeLink.status === "active" ? "success" : activeLink.status === "revoked" ? "danger" : "warning"}>
                    {linkStatusLabel}
                  </ToneBadge>
                </div>
                <div className="mt-2 truncate text-[11px] text-muted-foreground">
                  {activeLink
                    ? `${activeLink.expires} 만료 · ${activeLink.opens}/${activeLink.maxOpens}회 열람`
                    : ""}
                </div>
              </div>
              <div className="min-w-0 border-t px-3 py-3 sm:border-t-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">최근 전달</span>
                  <ToneBadge tone={latestDeliveryStatus === "전달 실패" ? "danger" : latestDeliveryStatus === "전달 완료" ? "success" : "neutral"}>
                    {latestDeliveryStatus}
                  </ToneBadge>
                </div>
                <div className="mt-2 truncate text-[11px] text-muted-foreground">
                  {latestEmail
                    ? `${latestRecipient} · ${latestEmail.sentAt}`
                    : ""}
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">문서 진행 상태</div>
              <ToneBadge tone="success">
                확정
              </ToneBadge>
            </div>
            <div className="mt-2 overflow-hidden rounded-md border bg-background">
              {completedReviewRows.map((row) => (
                <div
                  key={row.label}
                  className="flex min-h-9 min-w-0 items-center gap-2.5 px-3 py-2 text-xs"
                >
                  <span
                    className={cn(
                      "flex size-4.5 shrink-0 items-center justify-center rounded-full",
                      row.state === "complete"
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {row.state === "complete" ? (
                      <Check className="size-3" />
                    ) : (
                      <Clock3 className="size-3" />
                    )}
                  </span>
                  <span className="shrink-0 font-medium">{row.label}</span>
                  <span
                    className="ml-auto min-w-0 truncate text-right text-muted-foreground"
                    title={row.value}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </ScrollArea>
    </aside>
  )
}

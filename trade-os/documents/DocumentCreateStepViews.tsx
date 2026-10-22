import { templateSchemas, type Tone, templates } from "@trade-os/documents/documentTemplateModel"
import { decimalMagnitude, FINANCE_DECIMAL_SCALE } from "@trade-os/lib/financeDecimal"
import { normalizeDecimalInput, formatScaledDecimal } from "@trade-os/lib/money"
import { exactDocumentMoneyTotals, exactLineItemAmount } from "@trade-os/lib/documentMoney"
import { cn } from "@/lib/utils"
import { useState, useRef, useCallback } from "react"
import { prototypeBackend } from "@trade-os/lib/prototypeBackend"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings2, ChevronRight, Trash2, Plus, ChevronUp, ChevronDown, Sparkles, Check, FileText, Building2, Search } from "lucide-react"
import { AutoSaveStatus } from "@/components/platform/AutoSaveStatus"
import { AsyncButton } from "@/components/ds2/extensions/async-button"
import { RelatedDealNotice } from "@trade-os/documents/DocumentCreatePanels"
import { ResizablePanelGroup, ResizablePanel } from "@/components/ui/resizable"
import { FieldGroup, Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ds2/extensions/date-picker"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { PdfPanelResizeHandle } from "@/components/platform/PdfPanelResizeHandle"
import { DocumentStage } from "@trade-os/components/DocumentStage"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { AppSelect } from "@trade-os/components/AppSelect"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { ToneBadge } from "@trade-os/components/ToneBadge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { DocumentTemplateOptions } from "@trade-os/components/DocumentTemplateOptions"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { FormFieldHeader } from "@/components/platform/FormItem"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { type CreateStartMode, type DealDocumentContext, type DocumentDirection, type DocumentSourceMode } from "@/App"
import { quotationMoney, templateDirections, documentSourceDeals } from "@trade-os/documents/documentTemplateModel"

const templateFieldSummary = (code: string) => {
  const schema = templateSchemas[code]
  if (!schema) return ""
  const required = schema.slots.filter((slot) => slot.required).length
  const lineItemText = schema.lineItems
    ? ` · 품목 ${schema.lineItems.length}필드`
    : ""
  return `필수 ${required}개 · ${schema.slots.length}필드${lineItemText}`
}

const draftSources = [
  {
    title: "인보이스_2607_003.pdf",
    direction: "purchase",
    meta: "업로드 근거 · 5개 필드",
    status: "필드 확인",
    tone: "warning",
    facts: ["품목 Aluminium Scrap", "결제 T/T 30 days", "금액은 재사용 제외"],
    eligible: false,
    priority: 4,
  },
  {
    title: "B/L_2607_014.pdf",
    direction: "purchase",
    meta: "업로드 근거 · 4개 필드",
    status: "검토 완료",
    tone: "success",
    facts: ["선박 HMM Green", "항차 014W", "ETA 2026.08.03"],
    eligible: true,
    priority: 3,
  },
  {
    title: "계약서_안심찬.pdf",
    direction: "sales",
    meta: "최근 문서 · 6개 필드",
    status: "재사용 가능",
    tone: "success",
    facts: ["거래처 ACME GmbH", "조건 CIF Hamburg", "통화 USD"],
    eligible: true,
    priority: 1,
  },
] as const satisfies ReadonlyArray<{
  title: string
  direction: "purchase" | "sales" | "unknown"
  meta: string
  status: string
  tone: Tone
  facts: readonly string[]
  eligible: boolean
  priority: number
}>

type QuotationLineItem = {
  id: number
  name: string
  quantity: string
  unitPrice: string
}

type QuotationDraft = {
  party: string
  number: string
  issuedAt: string
  validUntil: string
  paymentTerms: string
  shippingTerms: string
}

function quotationDecimal(value: string) {
  const amount = decimalMagnitude(normalizeDecimalInput(value), FINANCE_DECIMAL_SCALE)
  return amount === null ? "—" : formatScaledDecimal(amount, FINANCE_DECIMAL_SCALE)
}

function quotationDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function QuotationPreviewPaper({
  draft,
  items,
  page = 1,
  pageCount = 1,
}: {
  draft: QuotationDraft
  items: QuotationLineItem[]
  page?: number
  pageCount?: number
}) {
  const freight = "800"
  const { subtotal, grandTotal } = exactDocumentMoneyTotals(
    items.map((item) => ({ quantity: item.quantity, unit_price: item.unitPrice })),
    { freightCharge: freight },
  )

  return (
    <div
      data-document-paper
      className="relative mx-auto aspect-[0.72] w-[min(94%,520px)] max-w-[520px] rounded-[var(--r-xs)] border border-[var(--surface-border)] bg-[var(--color-gray-12)] px-9 py-10 text-[var(--color-indigo)] shadow-[var(--shadow-section)]"
    >
      <div className="flex items-start justify-between gap-8">
        <div className="text-[10px] leading-3 font-bold tracking-[0.16em] text-[var(--color-primary-2)] uppercase">
          ECOYA
          <br />
          CORPORATION
        </div>
        <div className="text-[26px] font-medium tracking-[0.14em]">
          QUOTATION
        </div>
      </div>
      <div className="mt-7 h-[3px] bg-[var(--color-primary-2)]" />

      <div className="mt-8 grid grid-cols-2 gap-10 text-[8px] leading-4">
        <div>
          <div className="font-semibold tracking-wide text-[var(--color-gray-5)]">
            TO
          </div>
          <div className="mt-1 font-semibold uppercase">
            {draft.party || "거래처를 입력해주세요"}
          </div>
          <div>Ningbo, Zhejiang, China</div>
          <div>Attn: Purchasing Team</div>
        </div>
        <div>
          <div className="font-semibold tracking-wide text-[var(--color-gray-5)]">
            QUOTATION DETAILS
          </div>
          <div className="mt-1">Quotation No. {draft.number}</div>
          <div>Date: {draft.issuedAt.replaceAll("-", ". ")}</div>
          <div>Valid Until: {draft.validUntil.replaceAll("-", ". ")}</div>
        </div>
      </div>

      <div className="mt-8 overflow-hidden border-y border-[var(--color-gray-9)] text-[8px]">
        <div className="grid grid-cols-[1fr_52px_72px_82px] bg-[var(--color-gray-11)] text-[7px] font-semibold tracking-wide">
          {["DESCRIPTION", "QTY", "UNIT PRICE", "AMOUNT"].map(
            (label, index) => (
              <div
                key={label}
                className={cn("px-2 py-2", index > 0 && "text-right")}
              >
                {label}
              </div>
            )
          )}
        </div>
        {items.map((item) => {
          const amount =
            exactLineItemAmount(item.quantity, item.unitPrice)
          return (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_52px_72px_82px] border-t border-[var(--color-gray-10)]"
            >
              <div className="truncate px-2 py-3">{item.name || "-"}</div>
              <div className="px-2 py-3 text-right">
                {quotationDecimal(item.quantity)}
              </div>
              <div className="px-2 py-3 text-right">
                {quotationDecimal(item.unitPrice)}
              </div>
              <div className="px-2 py-3 text-right">
                {quotationMoney(amount)}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 ml-auto w-48 text-[8px]">
        <div className="flex justify-between border-b border-[var(--color-gray-9)] py-1.5">
          <span>SUBTOTAL</span>
          <span>{quotationMoney(subtotal)}</span>
        </div>
        <div className="flex justify-between border-b border-[var(--color-gray-9)] py-1.5">
          <span>FREIGHT</span>
          <span>{quotationMoney(freight)}</span>
        </div>
        <div className="flex justify-between border-b-2 border-[var(--color-primary-2)] py-2 text-[9px] font-bold">
          <span>TOTAL USD</span>
          <span>{quotationMoney(grandTotal)}</span>
        </div>
      </div>

      <div className="mt-8 text-[7px] leading-4">
        <div className="font-semibold text-[var(--color-gray-5)]">
          PAYMENT TERMS
        </div>
        <div>{draft.paymentTerms}</div>
        <div className="mt-3 font-semibold text-[var(--color-gray-5)]">
          SHIPPING TERMS
        </div>
        <div>{draft.shippingTerms}</div>
      </div>
      <div className="absolute right-0 bottom-4 left-0 text-center text-[7px] text-[var(--color-gray-6)]">
        PAGE {page} OF {pageCount}
      </div>
    </div>
  )
}

export function StructuredDocumentCreateEditor({
  onCreate,
  onOpenSettings,
  relatedDeal,
}: {
  onCreate: (mode?: CreateStartMode, templateCode?: string) => void
  onOpenSettings: () => void
  relatedDeal?: DealDocumentContext | null
}) {
  const [draft, setDraft] = useState<QuotationDraft>({
    party: relatedDeal?.party ?? "Ningbo T&S Import Co., Ltd.",
    number: "QT-2026-0082",
    issuedAt: "2026-08-25",
    validUntil: "2026-09-01",
    paymentTerms: "T/T 30% deposit, balance before shipment.",
    shippingTerms: "FOB NINGBO · Estimated delivery: 30 days",
  })
  const [items, setItems] = useState<QuotationLineItem[]>([
    {
      id: 1,
      name: "Stainless Steel Valve A-20",
      quantity: "1250",
      unitPrice: "12.80",
    },
    {
      id: 2,
      name: "Industrial Hose B-12",
      quantity: "200",
      unitPrice: "15.00",
    },
  ])
  const [termsOpen, setTermsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [saveState, setSaveState] = useState<
    "saved" | "dirty" | "saving" | "error"
  >("saved")
  const [lastSavedAt, setLastSavedAt] = useState(() => new Date())
  const [creating, setCreating] = useState(false)
  const nextItemIdRef = useRef(3)
  const draftRevisionRef = useRef(0)
  const savedDraftRevisionRef = useRef(0)
  const saveRequestRef = useRef<Promise<boolean> | null>(null)

  const markDirty = () => {
    draftRevisionRef.current += 1
    setSaveState("dirty")
  }
  const updateDraft = (key: keyof QuotationDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }))
    markDirty()
  }
  const updateItem = (
    id: number,
    key: keyof Omit<QuotationLineItem, "id">,
    value: string
  ) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    )
    markDirty()
  }
  const handleSave = useCallback(() => {
    if (saveRequestRef.current) return saveRequestRef.current
    if (draftRevisionRef.current === savedDraftRevisionRef.current) {
      return Promise.resolve(true)
    }
    const revision = draftRevisionRef.current
    setSaveState("saving")
    const request = Promise.all([
      prototypeBackend.generatedDocuments.saveDraft({ id: draft.number }),
      new Promise<void>((resolve) => window.setTimeout(resolve, 800)),
    ])
      .then(([result]) => {
        if (!result.ok) {
          setSaveState("error")
          toast.error(result.error)
          return false
        }
        savedDraftRevisionRef.current = revision
        if (draftRevisionRef.current === revision) {
          setSaveState("saved")
          setLastSavedAt(new Date(result.updatedAt))
        } else {
          setSaveState("dirty")
        }
        return true
      })
      .catch(() => {
        setSaveState("error")
        toast.error("견적서 초안을 저장하지 못했습니다.")
        return false
      })
      .finally(() => {
        saveRequestRef.current = null
      })
    saveRequestRef.current = request
    return request
  }, [draft.number])
  const handleCreate = async () => {
    if (creating) return
    if (draftRevisionRef.current !== savedDraftRevisionRef.current) {
      const saved = await handleSave()
      if (!saved) return
    }
    setCreating(true)
    const result = await prototypeBackend.generatedDocuments.create({
      id: draft.number,
    })
    if (!result.ok) {
      setCreating(false)
      toast.error(result.error)
      return
    }
    toast.success("견적서를 만들었습니다.")
    onCreate("generated", "QT")
  }
  const { subtotal } = exactDocumentMoneyTotals(
    items.map((item) => ({ quantity: item.quantity, unit_price: item.unitPrice })),
    {},
  )

  return (
    <div className="flex min-h-[calc(100svh-var(--header-height))] flex-col overflow-hidden bg-background p-3 sm:p-4">
      <Card
        className="min-h-[720px] flex-1 bg-[var(--surface-background)]!"
        onBlurCapture={() => {
          if (saveState === "dirty") void handleSave()
        }}
      >
        <div className="flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b border-[var(--surface-border)] bg-[var(--surface-background)] px-4 py-2">
          <div className="mr-auto min-w-0">
            <h1 className="text-sm font-semibold">견적서 만들기</h1>
            <p className="truncate text-[11px] text-[var(--surface-muted-foreground)]">
              내용을 작성하면서 오른쪽 문서 결과를 바로 확인합니다.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 data-icon="inline-start" /> 문서 설정
          </Button>
          <AutoSaveStatus
            className="hidden lg:flex"
            state={
              saveState === "dirty"
                ? "pending"
                : saveState === "saving"
                  ? "saving"
                  : saveState === "error"
                    ? "error"
                    : "saved"
            }
            savedAt={lastSavedAt}
          />
          {saveState === "error" ? (
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => void handleSave()}
            >
              다시 저장
            </Button>
          ) : null}
          <AsyncButton
            size="sm"
            loading={creating}
            loadingLabel="견적서 생성 중"
            onClick={handleCreate}
          >
            문서 만들기 <ChevronRight data-icon="inline-end" />
          </AsyncButton>
        </div>

        {relatedDeal ? (
          <div className="shrink-0 px-4 pt-4">
            <RelatedDealNotice deal={relatedDeal} compact />
          </div>
        ) : null}

        <div className="flex min-h-[640px] flex-1 overflow-hidden">
          <ResizablePanelGroup
            orientation="horizontal"
            className="min-h-0 flex-1"
          >
            <ResizablePanel defaultSize="52%" minSize="38%" maxSize="68%">
              <section className="flex h-full min-h-0 flex-col bg-[var(--surface-background)]">
                <div className="flex min-h-17 shrink-0 items-center justify-between gap-4 border-b border-[var(--surface-border)] bg-[var(--surface-background)] px-5 py-3">
                  <div>
                    <h2 className="text-sm font-semibold">견적 정보</h2>
                    <p className="mt-1 text-[11px] text-[var(--surface-muted-foreground)]">
                      필수 항목을 입력하면 미리보기에 바로 반영됩니다.
                    </p>
                  </div>
                  <div className="text-[11px] text-[var(--surface-muted-foreground)]">
                    <strong className="text-[var(--color-green-1)]">
                      필수 6/6
                    </strong>{" "}
                    · 확인 1
                  </div>
                </div>

                <div className="field-scrollbar min-h-0 flex-1 overflow-y-auto">
                  <section>
                    <div className="px-5 py-3 text-sm font-semibold">
                      기본 정보{" "}
                      <span className="ml-1 text-xs font-normal text-[var(--surface-muted-foreground)]">
                        필수 4개
                      </span>
                    </div>
                    <FieldGroup className="divide-y divide-[var(--surface-border)] border-y border-[var(--surface-border)]">
                      <Field className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 px-5 py-4">
                        <div className="pt-2">
                          <FieldLabel className="text-xs">거래처</FieldLabel>
                          <span className="mt-1 block text-[10px] text-[var(--surface-muted-foreground)]">
                            필수
                          </span>
                        </div>
                        <div className="min-w-0">
                          <Input
                            value={draft.party}
                            onChange={(event) =>
                              updateDraft("party", event.target.value)
                            }
                          />
                        </div>
                      </Field>
                      <Field className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 px-5 py-4">
                        <div className="pt-2">
                          <FieldLabel className="text-xs">견적 번호</FieldLabel>
                          <span className="mt-1 block text-[10px] text-[var(--surface-muted-foreground)]">
                            자동 생성
                          </span>
                        </div>
                        <div className="min-w-0">
                          <Input
                            value={draft.number}
                            onChange={(event) =>
                              updateDraft("number", event.target.value)
                            }
                          />
                        </div>
                      </Field>
                      <Field className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 px-5 py-4">
                        <div className="pt-2">
                          <FieldLabel className="text-xs">견적일</FieldLabel>
                          <span className="mt-1 block text-[10px] text-[var(--surface-muted-foreground)]">
                            필수
                          </span>
                        </div>
                        <div className="min-w-0">
                          <DatePicker
                            className="w-full [&>button]:w-full"
                            value={quotationDate(draft.issuedAt)}
                            ariaLabel="견적일"
                            allowClear={false}
                            showToday={false}
                            onChange={(_value, formattedValue) =>
                              formattedValue &&
                              updateDraft("issuedAt", formattedValue)
                            }
                          />
                        </div>
                      </Field>
                      <Field className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 px-5 py-4">
                        <div className="pt-2">
                          <FieldLabel className="text-xs">유효기간</FieldLabel>
                          <span className="mt-1 block text-[10px] text-[var(--color-orange-2)]">
                            확인 필요
                          </span>
                        </div>
                        <div className="min-w-0">
                          <DatePicker
                            className="w-full [&>button]:w-full [&>button]:border-[var(--color-orange-2)]!"
                            value={quotationDate(draft.validUntil)}
                            ariaLabel="유효기간"
                            allowClear={false}
                            showToday={false}
                            onChange={(_value, formattedValue) =>
                              formattedValue &&
                              updateDraft("validUntil", formattedValue)
                            }
                          />
                          <FieldDescription className="text-[10px] text-[var(--color-orange-2)]">
                            기본 유효기간 14일보다 짧습니다.
                          </FieldDescription>
                        </div>
                      </Field>
                    </FieldGroup>
                  </section>

                  <section className="border-b border-[var(--surface-border)]">
                    <div className="px-5 py-3 text-sm font-semibold">
                      품목 정보{" "}
                      <span className="ml-1 text-xs font-normal text-[var(--surface-muted-foreground)]">
                        {items.length}개 품목 · USD {quotationMoney(subtotal)}
                      </span>
                    </div>
                    <div data-layout="flush-table">
                      <Table className="min-w-[540px] table-fixed">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[42%] text-left!">
                              품목
                            </TableHead>
                            <TableHead className="w-[16%] text-left!">
                              수량
                            </TableHead>
                            <TableHead className="w-[18%] text-left!">
                              단가
                            </TableHead>
                            <TableHead className="w-[16%] text-right!">
                              금액
                            </TableHead>
                            <TableHead className="w-[8%]" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item) => {
                            const amount =
                              exactLineItemAmount(item.quantity, item.unitPrice)
                            return (
                              <TableRow key={item.id}>
                                <TableCell className="text-left!">
                                  <Input
                                    value={item.name}
                                    aria-label="품목명"
                                    onChange={(event) =>
                                      updateItem(
                                        item.id,
                                        "name",
                                        event.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-left!">
                                  <Input
                                    inputMode="decimal"
                                    value={item.quantity}
                                    aria-label={`${item.name} 수량`}
                                    onChange={(event) =>
                                      updateItem(
                                        item.id,
                                        "quantity",
                                        event.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-left!">
                                  <Input
                                    inputMode="decimal"
                                    value={item.unitPrice}
                                    aria-label={`${item.name} 단가`}
                                    onChange={(event) =>
                                      updateItem(
                                        item.id,
                                        "unitPrice",
                                        event.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-right! tabular-nums">
                                  ${quotationMoney(amount)}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    aria-label={`${item.name} 삭제`}
                                    disabled={items.length === 1}
                                    onClick={() => {
                                      setItems((current) =>
                                        current.filter(
                                          (currentItem) =>
                                            currentItem.id !== item.id
                                        )
                                      )
                                      markDirty()
                                    }}
                                  >
                                    <Trash2 />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="border-t border-[var(--surface-border)] px-3 py-2 text-center">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          const id = nextItemIdRef.current
                          nextItemIdRef.current += 1
                          setItems((current) => [
                            ...current,
                            { id, name: "", quantity: "1", unitPrice: "0" },
                          ])
                          markDirty()
                        }}
                      >
                        <Plus data-icon="inline-start" /> 품목 추가
                      </Button>
                    </div>
                  </section>

                  <section>
                    <button
                      type="button"
                      className="flex min-h-12 w-full items-center gap-2 border-b border-[var(--surface-border)] px-5 text-left text-xs outline-none focus-visible:[box-shadow:var(--shadow-keyboard-focus)]"
                      aria-expanded={termsOpen}
                      onClick={() => setTermsOpen((current) => !current)}
                    >
                      <strong>거래 조건</strong>
                      <span className="truncate text-[var(--surface-muted-foreground)]">
                        결제 조건, 인도 조건, 운송 정보
                      </span>
                      {termsOpen ? (
                        <ChevronUp className="ml-auto" />
                      ) : (
                        <ChevronDown className="ml-auto" />
                      )}
                    </button>
                    {termsOpen ? (
                      <div className="px-5 py-4">
                        <FieldGroup>
                          <Field className="gap-1.5">
                            <FieldLabel className="text-xs">
                              결제 조건
                            </FieldLabel>
                            <Textarea
                              value={draft.paymentTerms}
                              onChange={(event) =>
                                updateDraft("paymentTerms", event.target.value)
                              }
                            />
                          </Field>
                          <Field className="gap-1.5">
                            <FieldLabel className="text-xs">
                              인도 및 운송 조건
                            </FieldLabel>
                            <Textarea
                              value={draft.shippingTerms}
                              onChange={(event) =>
                                updateDraft("shippingTerms", event.target.value)
                              }
                            />
                          </Field>
                        </FieldGroup>
                      </div>
                    ) : null}
                  </section>
                </div>
              </section>
            </ResizablePanel>
            <PdfPanelResizeHandle label="견적 정보와 PDF 미리보기 너비 조절" />
            <ResizablePanel defaultSize="48%" minSize="32%">
              <DocumentStage
                result
                fitPage
                reviewMode
                pageCountOverride={12}
                templateCode="QT"
                downloadName={`${draft.number}.pdf`}
                previewContent={(page, pageCount) => (
                  <QuotationPreviewPaper
                    draft={draft}
                    items={items}
                    page={page}
                    pageCount={pageCount}
                  />
                )}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </Card>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent className="w-full max-w-md overflow-y-auto p-0">
          <SheetHeader className="border-b px-5 py-4 text-left">
            <SheetTitle>문서 설정</SheetTitle>
            <SheetDescription>
              견적서의 기본 형식과 표시 기준을 정합니다.
            </SheetDescription>
          </SheetHeader>
          <FieldGroup className="p-5">
            <Field className="gap-1.5">
              <FieldLabel className="text-xs">문서 유형</FieldLabel>
              <AppSelect
                value="QT"
                onValueChange={() => undefined}
                options={[["QT", "견적서 (Quotation)"]]}
              />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel className="text-xs">통화</FieldLabel>
              <AppSelect
                value="USD"
                onValueChange={() => undefined}
                options={["USD", "KRW", "EUR", "JPY"]}
              />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel className="text-xs">문서 언어</FieldLabel>
              <AppSelect
                value="en"
                onValueChange={() => undefined}
                options={[
                  ["en", "English"],
                  ["ko", "한국어"],
                ]}
              />
            </Field>
            <Alert variant="gray">
              <AlertDescription className="text-xs leading-5">
                회사 로고와 강조색은 조직의 기본 문서 설정을 사용합니다.
              </AlertDescription>
            </Alert>
            <Separator />
            <div>
              <div className="text-xs font-semibold">작성 방식 변경</div>
              <p className="mt-1 text-xs leading-5 text-[var(--surface-muted-foreground)]">
                AI 요청문이나 다른 템플릿으로 다시 시작할 수 있습니다.
              </p>
              <Button
                className="mt-3 w-full"
                variant="outline"
                onClick={() => {
                  setSettingsOpen(false)
                  onOpenSettings()
                }}
              >
                <Sparkles data-icon="inline-start" /> AI 초안·템플릿 선택
              </Button>
            </div>
          </FieldGroup>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export function DocumentSourceSetupStep({
  templateCode,
  direction,
  onTemplateChange,
  selectedDeal,
  onSelectDeal,
  sourceMode,
  onSourceModeChange,
  selectedSources,
  onToggleSource,
  naturalLanguagePrompt,
  onNaturalLanguagePromptChange,
  sourceChangesPending,
  onApplySource,
}: {
  templateCode: string
  direction: DocumentDirection | null
  onTemplateChange: (code: string, direction: DocumentDirection | null) => boolean
  selectedDeal: DealDocumentContext | null
  onSelectDeal: (deal: DealDocumentContext) => void
  sourceMode: DocumentSourceMode
  onSourceModeChange: (mode: DocumentSourceMode) => void
  selectedSources: Set<string>
  onToggleSource: (title: string) => void
  naturalLanguagePrompt: string
  onNaturalLanguagePromptChange: (value: string) => void
  sourceChangesPending: boolean
  onApplySource: () => void
}) {
  const selectedTemplate =
    templates.find(([code]) => code === templateCode) ?? null
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const [pickerDirection, setPickerDirection] = useState(direction)
  const [templateQuery, setTemplateQuery] = useState("")
  const availableTemplates = templates.filter(([code]) =>
    !pickerDirection || templateDirections[code].some((value) => value === pickerDirection)
  )
  const [dealQuery, setDealQuery] = useState("")
  const selectedSourceDetails = draftSources.filter((source) =>
    selectedSources.has(source.title)
  )
  const fileSourceSummary =
    selectedSourceDetails.length > 0
      ? selectedSourceDetails
          .map(
            (source) =>
              `[${source.direction === "purchase" ? "구매" : source.direction === "sales" ? "판매" : "방향 확인"}] ${source.title}`
          )
          .join(" · ")
      : ""
  const dealSourceSummary = selectedDeal
    ? `거래 ${selectedDeal.id} · ${selectedDeal.party}`
    : ""
  const sourceSummary = [dealSourceSummary, fileSourceSummary]
    .filter(Boolean)
    .join(" ")
  const canContinue = Boolean(
    selectedTemplate &&
    (sourceSummary || naturalLanguagePrompt.trim().length > 0)
  )
  const visibleDeals = documentSourceDeals.filter((deal) =>
    [deal.id, deal.title, deal.party, deal.item].some((value) =>
      value.toLowerCase().includes(dealQuery.trim().toLowerCase())
    )
  )
  return (
    <section className="flex h-full min-h-0 flex-col bg-[var(--surface-background)]">
      <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-5 pb-1">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-base font-bold">내용 입력</h2>
          <ToneBadge
            tone={
              !canContinue
                ? "warning"
                : sourceChangesPending
                  ? "warning"
                  : "success"
            }
          >
            {!canContinue
              ? "입력 필요"
              : sourceChangesPending
                ? "반영 대기"
                : "항목 반영됨"}
          </ToneBadge>
        </div>
        <Sparkles className="size-4 shrink-0 text-primary" />
      </div>

      <ScrollArea type="auto" className="min-h-0 flex-1">
        <div className="space-y-5 p-4 sm:p-5">
          <section>
            <div className="mb-2 text-xs font-semibold">선택한 문서</div>
            <div className="flex items-center gap-3 rounded-lg border bg-background p-3 shadow-xs">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-background text-xs font-semibold text-primary">
                {selectedTemplate?.[0] ?? "—"}
              </span>
              <div className="mr-auto min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-semibold">
                    {selectedTemplate?.[1] ?? "문서 유형 선택"}
                  </span>
                  {selectedTemplate?.[3] ? (
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {selectedTemplate[3]}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 truncate text-[11px] text-muted-foreground">
                  {selectedTemplate
                    ? templateFieldSummary(selectedTemplate[0])
                    : "만들 문서 유형을 선택하세요"}
                </p>
              </div>
              <Popover
                open={templatePickerOpen}
                onOpenChange={(open) => {
                  setTemplatePickerOpen(open)
                  if (open) setPickerDirection(direction)
                  if (!open) setTemplateQuery("")
                }}
              >
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="shrink-0">
                    문서 유형 <ChevronDown data-icon="inline-end" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  aria-label="문서 유형 선택"
                  className="w-[min(420px,calc(100vw-2rem))] gap-0 p-0"
                >
                  <div className="border-b p-3">
                    <div className="text-xs font-semibold">문서 유형</div>
                    <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                      유형에 따라 오른쪽 확인 항목과 PDF 양식이 구성됩니다.
                    </p>
                    <div className="mt-3">
                      <DocumentTemplateOptions
                        searchPrefix={
                          <Select
                            value={pickerDirection ?? ""}
                            onValueChange={(value) => setPickerDirection(value as DocumentDirection)}
                          >
                            <SelectTrigger size="sm" className="h-8 w-24 shrink-0 text-xs" aria-label="문서 방향">
                              <SelectValue placeholder="방향 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="purchase">구매</SelectItem>
                              <SelectItem value="sales">판매</SelectItem>
                            </SelectContent>
                          </Select>
                        }
                        templates={availableTemplates}
                        selectedCode={pickerDirection === direction ? templateCode : undefined}
                        query={templateQuery}
                        onQueryChange={setTemplateQuery}
                        onSelect={(code) => {
                          if (!onTemplateChange(code, pickerDirection)) return
                          setTemplatePickerOpen(false)
                          setTemplateQuery("")
                        }}
                        autoFocus
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </section>

          <section>
            <div className="overflow-hidden rounded-lg border bg-background shadow-xs">
              <div className="flex flex-wrap items-center gap-3 border-b bg-background px-3.5 py-3">
                <FormFieldHeader className="flex-1" label="만들 내용" htmlFor="document-source-prompt" badge={
<ToneBadge
                    tone={
                      !canContinue
                        ? "warning"
                        : sourceChangesPending
                          ? "warning"
                          : "success"
                    }
                  >
                    {!canContinue
                      ? "입력 필요"
                      : sourceChangesPending
                        ? "반영 전"
                        : "반영됨"}
                  </ToneBadge>                } />
                  <Button
                    type="button"
                    size="sm"
                    disabled={!canContinue || !sourceChangesPending}
                    onClick={onApplySource}
                  >
                    {!canContinue || sourceChangesPending ? (
                      <Sparkles data-icon="inline-start" />
                    ) : (
                      <Check data-icon="inline-start" />
                    )}
                    {!canContinue || sourceChangesPending
                      ? "항목에 반영"
                      : "반영됨"}
                  </Button>
              </div>

              <div className="p-3.5">
                {sourceSummary ? (
                  <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold text-primary">
                        연결 근거
                      </span>
                      <ToneBadge
                        tone={sourceChangesPending ? "warning" : "success"}
                      >
                        {sourceChangesPending ? "반영 전" : "반영됨"}
                      </ToneBadge>
                    </div>
                    <p className="mt-1.5 line-clamp-3 text-[11px] leading-5 text-foreground">
                      {sourceSummary}
                    </p>
                  </div>
                ) : null}

                <Textarea
                  id="document-source-prompt"
                  aria-label="만들 내용을 자연어로 입력"
                  className="mt-3 min-h-36 resize-none bg-[var(--control-background)] text-sm leading-6"
                  value={naturalLanguagePrompt}
                  onChange={(event) =>
                    onNaturalLanguagePromptChange(event.target.value)
                  }
                  placeholder="예: ACME GmbH에 알루미늄 스크랩 20MT를 판매하는 계약서를 만들어줘. 결제조건은 T/T 30 days, 인코텀즈는 CIF Hamburg."
                />
              </div>
            </div>

            <Tabs
              value={sourceMode}
              onValueChange={(value) =>
                onSourceModeChange(value as DocumentSourceMode)
              }
              className="mt-3 overflow-hidden rounded-lg border bg-background"
            >
              <TabsList className="grid h-10 w-full grid-cols-2 rounded-none border-0 border-b bg-background p-0">
                <TabsTrigger
                  value="files"
                  className="h-10 rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-background px-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  <FileText data-icon="inline-start" />
                  문서함
                  {selectedSources.size > 0 ? ` ${selectedSources.size}` : ""}
                </TabsTrigger>
                <TabsTrigger
                  value="deal"
                  className="h-10 rounded-none border-x-0 border-t-0 border-b-2 border-transparent bg-background px-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  <Building2 data-icon="inline-start" />
                  거래{selectedDeal ? " 1" : ""}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="files" className="m-0 p-3">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-3 px-1 text-[11px] text-muted-foreground">
                    <span>문서함</span>
                    <span>{selectedSources.size}개 선택</span>
                  </div>
                  {draftSources.map((source) => {
                    const selected = selectedSources.has(source.title)
                    return (
                      <Button
                        key={source.title}
                        type="button"
                        variant="ghost"
                        disabled={!source.eligible}
                        className={cn(
                          "grid h-auto min-h-16 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border px-3 py-2 text-left font-normal",
                          selected && "border-primary bg-primary/5"
                        )}
                        onClick={() => onToggleSource(source.title)}
                      >
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5">
                            <FileText className="size-3.5 shrink-0 text-primary" />
                            <ToneBadge
                              tone={
                                source.direction === "sales"
                                  ? "success"
                                  : source.direction === "purchase"
                                    ? "blue"
                                    : "warning"
                              }
                            >
                              {source.direction === "sales"
                                ? "판매"
                                : source.direction === "purchase"
                                  ? "구매"
                                  : "방향 확인"}
                            </ToneBadge>
                            <strong className="truncate text-xs">
                              {source.title}
                            </strong>
                          </span>
                          <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                            {source.meta} ·{" "}
                            {source.facts.slice(0, 2).join(" · ")}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-full border",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "text-transparent"
                          )}
                        >
                          <Check className="size-3" />
                        </span>
                      </Button>
                    )
                  })}
                </div>
              </TabsContent>

              <TabsContent value="deal" className="m-0 p-3">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-xs font-semibold">거래</div>
                    <ToneBadge tone={selectedDeal ? "success" : "neutral"}>
                      {selectedDeal ? "1건 선택" : "확정 전 필수"}
                    </ToneBadge>
                  </div>
                  <div className="relative mt-3">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="h-8 bg-[var(--control-background)] pl-8 text-xs"
                      value={dealQuery}
                      onChange={(event) => setDealQuery(event.target.value)}
                      placeholder="거래번호, 거래명, 거래처 검색"
                      aria-label="거래 검색"
                    />
                  </div>
                  <ScrollArea className="mt-2 max-h-72">
                    <div className="grid gap-1.5 pr-1">
                      {visibleDeals.map((deal) => {
                        const selected = deal.id === selectedDeal?.id
                        return (
                          <Button
                            key={deal.id}
                            type="button"
                            variant="ghost"
                            className={cn(
                              "grid h-auto min-h-20 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border bg-background px-3 py-2.5 text-left font-normal",
                              selected && "border-primary bg-primary/5"
                            )}
                            onClick={() => onSelectDeal(deal)}
                          >
                            <span className="min-w-0">
                              <span className="flex min-w-0 items-center gap-2">
                                <strong className="truncate text-xs">
                                  {deal.title}
                                </strong>
                                <ToneBadge tone={deal.tone}>
                                  {deal.stage}
                                </ToneBadge>
                              </span>
                              <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                                {deal.id} · {deal.party}
                              </span>
                              <span className="mt-1 block truncate text-[11px] font-medium">
                                {deal.item} · {deal.amount} {deal.currency}
                              </span>
                            </span>
                            <span
                              className={cn(
                                "flex size-5 shrink-0 items-center justify-center rounded-full border",
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "text-transparent"
                              )}
                            >
                              <Check className="size-3" />
                            </span>
                          </Button>
                        )
                      })}
                      {visibleDeals.length === 0 ? (
                        <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                          일치하는 거래가 없습니다.
                        </div>
                      ) : null}
                    </div>
                  </ScrollArea>
                  {selectedDeal ? (
                    <div className="mt-2 flex flex-wrap gap-1.5 border-t pt-2">
                      {["거래처", "통화", "품목", "금액", "결제조건"].map(
                        (fact) => (
                          <ToneBadge key={fact} tone="blue">
                            {fact}
                          </ToneBadge>
                        )
                      )}
                    </div>
                  ) : null}
                </div>
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </ScrollArea>
    </section>
  )
}

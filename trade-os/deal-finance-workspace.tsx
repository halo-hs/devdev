import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@ecoya/design-system/ui/empty"
import { DealClaimTool } from "@trade-os/deal-handoff-tools"
import { useRef, useState, type ReactNode } from "react"
import { Info, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { Input } from "@shared/components/ui/input"
import { Badge } from "@shared/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@shared/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select"
import { exactFinanceMoney, presentFinanceFact } from "@trade-os/lib/erp-finance"
import {
  calculateDealFinance,
  costCurrencies,
  costTypes,
  readDealCosts,
  validDealCost,
  writeDealCosts,
  type DealCost,
} from "@trade-os/lib/deal-finance-workspace"
import { prototypeBackend } from "@trade-os/lib/prototype-backend"

function FinanceHelp({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className="size-6 text-muted-foreground"
        >
          <Info className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-w-[calc(100vw-32px)] space-y-2 text-xs leading-5"
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}

const blankCost = (): DealCost => ({
  id: "draft",
  type: "운임",
  amount: "",
  currency: "USD",
  basis: "additive",
  note: "",
  source: "수동 입력",
})

export function DealFinanceWorkspace({
  dealId,
  canWrite,
  addAudit,
}: {
  dealId: string
  canWrite: boolean
  addAudit: (action: string, detail: string) => void
}) {
  const [costs, setCosts] = useState(() => readDealCosts(dealId))
  const [draft, setDraft] = useState<DealCost>(blankCost)
  const amountInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const isNew = draft.id === "draft"
  const valid = canWrite && validDealCost(draft)
  const savedFacts = calculateDealFinance(dealId, costs)
  const previewCosts =
    valid && draft
      ? isNew
        ? [...costs, draft]
        : costs.map((c) => (c.id === draft.id ? draft : c))
      : costs
  const previewFacts = calculateDealFinance(dealId, previewCosts)
  const mutate = async (
    next: DealCost[],
    action: string,
    detail: string,
    request: () => Promise<{ ok: boolean; error?: string }>,
    nextDraft?: DealCost
  ) => {
    if (busyRef.current || !canWrite) return
    busyRef.current = true
    setBusy(true)
    setError("")
    try {
      const result = await request()
      if (!result.ok)
        throw new Error(result.error || "원가를 저장하지 못했습니다.")
      writeDealCosts(dealId, next)
      setCosts(next)
      addAudit(action, detail)
      if (nextDraft) {
        setDraft(nextDraft)
        requestAnimationFrame(() =>
          amountInputRef.current?.focus({ preventScroll: true })
        )
      } else if (draft.id === detail) {
        setDraft(blankCost())
      }
      setDeleteId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "다시 시도해주세요.")
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }
  const save = () => {
    if (!draft || !valid) return
    const next = {
      ...draft,
      amount: draft.amount.trim(),
      id: isNew ? crypto.randomUUID() : draft.id,
    }
    void mutate(
      isNew
        ? [...costs, next]
        : costs.map((c) => (c.id === next.id ? next : c)),
      isNew ? "원가 추가" : "원가 수정",
      `${next.type} ${next.amount} ${next.currency}`,
      () =>
        isNew
          ? prototypeBackend.deals.createCost({ dealId, ...next })
          : prototypeBackend.deals.updateCost({
              dealId,
              costId: next.id,
              ...next,
            }),
      {
        ...blankCost(),
        type: draft.type,
        currency: draft.currency,
        basis: draft.basis,
      }
    )
  }
  return (
    <div className="space-y-7" data-testid="deal-finance-workspace">
      <section aria-label="거래 경제" className="border-b pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <h3 className="text-base font-semibold">거래 경제</h3>
            <FinanceHelp label="거래 손익 계산 기준">
              <p>
                확정 매출송장 − 확정 매입송장 − 가산 원가 = 비용 반영 예상손익
              </p>
              <p>
                통화별로 계산하며 가격 포함 원가는 다시 차감하지 않습니다. 송장
                기준 추정치로 회계상 이익과 구분합니다.
              </p>
            </FinanceHelp>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {valid ? "입력 중 · 미저장 미리보기" : "저장된 원가 기준"}
            </Badge>
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          송장 금액에 원가를 반영한 예상손익입니다.
        </p>
        <div aria-live="polite" className="mt-4 space-y-3">
          {previewFacts.map((fact) => {
            const money = presentFinanceFact(fact)
            return (
              <div
                key={fact.currency}
                className="border-t pt-4"
                data-testid={`economics-${fact.currency}`}
              >
                <div className="mb-3 flex items-center gap-2">
                  <strong>{fact.currency}</strong>
                  {fact.adjusted_gp_pct != null && (
                    <Badge variant="outline">
                      예상 마진율 {fact.adjusted_gp_pct}%
                    </Badge>
                  )}
                  {money.adjustedResult === "—" && (
                    <Badge variant="outline">송장 근거 확인 필요</Badge>
                  )}
                </div>
                <dl className="grid grid-cols-2 gap-4 xl:grid-cols-5">
                  {[
                    ["매출측 송장", money.invoiceSales],
                    ["매입측 송장", money.invoicePurchases],
                    ["송장 차익", money.tradeResult],
                    ["가산 원가", money.costs],
                    ["비용 반영 예상손익", money.adjustedResult],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="mt-1 text-sm font-semibold break-words tabular-nums">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )
          })}
          {!previewFacts.length && (
            <p className="py-2 text-sm text-muted-foreground">
              확정 송장이 없어 손익을 계산할 수 없습니다.
            </p>
          )}
        </div>
      </section>

      <section aria-label="원가 관리">
        <h3 className="text-base font-semibold">원가</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          운임·관세·보험 등 부대비용을 입력합니다.
        </p>
        {canWrite && (
          <form
            className="@container mt-4 rounded-lg border bg-background p-4"
            aria-label={isNew ? "원가 추가" : "원가 수정"}
            onSubmit={(e) => {
              e.preventDefault()
              save()
            }}
          >
            <fieldset
              disabled={busy}
              className="grid items-end gap-3 sm:grid-cols-2 @min-[860px]:grid-cols-[100px_140px_80px_110px_minmax(140px,1fr)_auto]"
            >
              <label className="grid min-w-0 gap-1.5 text-sm">
                <span>원가 유형</span>
                <Select
                  value={draft.type}
                  onValueChange={(value) =>
                    setDraft({ ...draft, type: value ?? "운임" })
                  }
                >
                  <SelectTrigger aria-label="원가 유형" className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {costTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="grid min-w-0 gap-1.5 text-sm">
                <span>금액</span>
                <Input
                  className="h-9"
                  aria-label="원가 금액"
                  title="금액은 정수 16자리, 소수점 2자리까지 입력할 수 있습니다."
                  inputMode="decimal"
                  ref={amountInputRef}
                  value={draft.amount}
                  onChange={(e) =>
                    setDraft({ ...draft, amount: e.target.value })
                  }
                  aria-invalid={
                    !!draft.amount && !validDealCost({ ...draft, note: "" })
                  }
                  placeholder="0.00"
                />
              </label>
              <label className="grid min-w-0 gap-1.5 text-sm">
                <span>통화</span>
                <Select
                  value={draft.currency}
                  onValueChange={(value) =>
                    setDraft({ ...draft, currency: value ?? "USD" })
                  }
                >
                  <SelectTrigger aria-label="원가 통화" className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {costCurrencies.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="grid min-w-0 gap-1.5 text-sm">
                <span>반영 기준</span>
                <Select
                  value={draft.basis}
                  onValueChange={(value) =>
                    setDraft({ ...draft, basis: value as DealCost["basis"] })
                  }
                >
                  <SelectTrigger
                    aria-label="원가 반영 기준"
                    className="h-9 w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="additive">가산</SelectItem>
                    <SelectItem value="already_in_price">가격 포함</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label className="grid min-w-0 gap-1.5 text-sm sm:col-span-2 @min-[860px]:col-span-1">
                <span>메모</span>
                <Input
                  className="h-9"
                  aria-label="원가 메모"
                  disabled={busy}
                  maxLength={2000}
                  value={draft.note}
                  onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                  placeholder="비용 근거 또는 계산 메모"
                />
              </label>
              <p className="sr-only">
                금액은 정수 16자리, 소수점 2자리까지 입력할 수 있습니다.
              </p>
              <div className="flex flex-wrap justify-end gap-2 sm:col-span-2 @min-[860px]:col-span-1 @min-[860px]:flex-nowrap">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    setError("")
                    setDraft(blankCost())
                  }}
                >
                  {isNew ? "입력 비우기" : "수정 취소"}
                </Button>
                <Button type="submit" disabled={!valid || busy}>
                  {isNew && <Plus />}
                  {busy ? "저장 중…" : isNew ? "원가 추가" : "변경 저장"}
                </Button>
              </div>
            </fieldset>
          </form>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="mt-4">
          <Table aria-label="원가 계산 내역" className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                {[
                  "유형 / 근거",
                  "금액",
                  "반영 기준",
                  "손익 차감액",
                  "메모",
                  "관리",
                ].map((label) => (
                  <TableHead key={label}>{label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {costs.map((cost) => (
                <TableRow key={cost.id}>
                  <TableCell>
                    <strong>{cost.type}</strong>
                    <small className="mt-1 block text-muted-foreground">
                      {cost.source}
                    </small>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {exactFinanceMoney(cost.amount, cost.currency)}
                  </TableCell>
                  <TableCell>
                    {cost.basis === "additive" ? "가산" : "가격 포함"}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {exactFinanceMoney(
                      cost.basis === "additive" ? cost.amount : "0",
                      cost.currency
                    )}
                  </TableCell>
                  <TableCell className="max-w-60 break-words whitespace-normal">
                    {cost.note || "—"}
                  </TableCell>
                  <TableCell>
                    {canWrite && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`${cost.type} 원가 수정`}
                          disabled={busy}
                          onClick={() => {
                            setError("")
                            setDraft({ ...cost })
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`${cost.type} 원가 삭제`}
                          disabled={busy}
                          onClick={() => setDeleteId(cost.id)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!costs.length && (
                <TableRow>
                  <TableCell colSpan={6} className="p-0 whitespace-normal">
                    <Empty className="min-h-40">
                      <EmptyHeader>
                        <EmptyTitle>등록된 원가가 없습니다.</EmptyTitle>
                        <EmptyDescription>
                          {canWrite
                            ? "위에서 원가를 입력하면 비용 내역과 손익에 반영됩니다."
                            : "원가가 등록되면 비용 내역과 손익을 확인할 수 있습니다."}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {deleteId && (
          <div
            role="alert"
            className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
          >
            <p className="text-sm">
              이 원가를 삭제하면 예상손익이 다시 계산됩니다.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => setDeleteId(null)}
              >
                취소
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={busy}
                onClick={() =>
                  void mutate(
                    costs.filter((c) => c.id !== deleteId),
                    "원가 삭제",
                    deleteId,
                    () => prototypeBackend.deals.deleteCost({ id: deleteId })
                  )
                }
              >
                원가 삭제 확인
              </Button>
            </div>
          </div>
        )}
      </section>

      <section>
        <h3 className="text-base font-semibold">통화별 원가·손익 계산표</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          저장된 원가 기준이며, 미확인 금액은 —로 표시합니다.
        </p>
        <Table aria-label="통화별 원가 손익" className="mt-3 min-w-[850px]">
          <TableHeader>
            <TableRow>
              {[
                "통화",
                "확정 매출송장",
                "확정 매입송장",
                "송장 차익",
                "가산 원가",
                "비용 반영 예상손익",
                "현재 받을 돈",
                "현재 줄 돈",
              ].map((label) => (
                <TableHead key={label}>{label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {savedFacts.map((fact) => {
              const p = presentFinanceFact(fact)
              return (
                <TableRow key={fact.currency}>
                  {[
                    fact.currency,
                    p.invoiceSales,
                    p.invoicePurchases,
                    p.tradeResult,
                    p.costs,
                    p.adjustedResult,
                    p.receivable,
                    p.payable,
                  ].map((value, i) => (
                    <TableCell key={i} className="tabular-nums">
                      {value}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
            {!savedFacts.length && (
              <TableRow>
                <TableCell colSpan={8} className="p-0 whitespace-normal">
                  <Empty className="min-h-40">
                    <EmptyHeader>
                      <EmptyTitle>계산할 송장·원가 정보가 없습니다.</EmptyTitle>
                      <EmptyDescription>
                        송장을 연결하거나 원가를 등록하면 통화별로 표시됩니다.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
      <DealClaimTool />
    </div>
  )
}

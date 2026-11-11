// 실무자 피드백 반영 시안. 서버 연동 없이 화면 로컬 state로만 동작한다.
// 백엔드 기능 요청 필요(PR 본문 B1~B7): 계좌 변경 확인 기록(BankChangeCheck), 분할 결제 일정(PaymentSchedulePlan),
// 통관 해당 여부(DealCustomsWorkspace·CustomsApplicabilityMenu), 연결 거래(DealLinkedDeals).
// 백엔드 반영 전에는 저장되지 않으며 새로고침·다른 사용자에게 유지되지 않는다.
import { useState } from "react"
import { ArrowUpRight, Link2, MoreHorizontal, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/DatePicker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusBadge } from "@/components/platform/StatusBadge"
import { cn } from "@/lib/utils"
import { useDealBankNotice, useDealCustoms } from "@trade-os/deals/dealStructure"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const num = (value: string) => Number(String(value).replaceAll(",", "")) || 0
const money = (value: number) =>
  value.toLocaleString("en-US", { maximumFractionDigits: 2 })

function scrollToTarget(selector: string) {
  const target = document.querySelector<HTMLElement>(selector)
  if (!target) return
  target.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    block: "start",
  })
  target.querySelector<HTMLElement>("input, button")?.focus({ preventScroll: true })
}

/* #67 첫 화면 품목 테이블(읽기 전용) ------------------------------------- */

type SummaryItem = {
  id: number
  goods: string
  quantity: string
  quantityUnit: string
  unitPrice: string
  currency: string
  match: string
}

const SUMMARY_ROW_LIMIT = 4

function openItem(id: number) {
  const target = document.getElementById(`deal-field-item-${id}-quantity`)
  if (!target) return scrollToTarget("[data-deal-items]")
  target.closest("tbody")?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    block: "start",
  })
  target.focus({ preventScroll: true })
}

export function DealItemSummary({ items }: { items: SummaryItem[] }) {
  const [expanded, setExpanded] = useState(false)
  if (!items.length) {
    return (
      <div className="mt-3 flex items-center justify-between gap-3 rounded-[var(--r-md)] bg-muted/40 px-3.5 py-2.5 text-xs">
        <span className="text-muted-foreground">등록된 품목이 없습니다.</span>
        <Button size="xs" variant="link" onClick={() => scrollToTarget("[data-deal-items]")}>품목 입력</Button>
      </div>
    )
  }
  // 불일치 품목은 줄 수 제한에 걸려도 먼저 보인다. 나머지는 원래 순서.
  const ordered = [...items.filter((item) => item.match === "확인 필요"), ...items.filter((item) => item.match !== "확인 필요")]
  const visible = expanded ? items : ordered.slice(0, SUMMARY_ROW_LIMIT).sort((a, b) => items.indexOf(a) - items.indexOf(b))
  const hidden = items.length - visible.length
  const amountOf = (item: SummaryItem) => num(item.quantity) * num(item.unitPrice)
  const units = new Map<string, number>()
  for (const item of items) units.set(item.quantityUnit, (units.get(item.quantityUnit) ?? 0) + num(item.quantity))
  const total = items.reduce((sum, item) => sum + amountOf(item), 0)
  const currency = items[0].currency
  const totalQuantity = [...units].map(([unit, qty]) => `${money(qty)} ${unit}`).join(" · ")
  const row = "grid items-center gap-x-3 px-3 sm:grid-cols-[minmax(0,1fr)_88px_96px_120px_64px]"
  return (
    <div data-deal-item-summary className="mt-3 overflow-hidden rounded-[var(--r-md)] border border-[var(--surface-border)] text-xs">
      <div className={cn(row, "hidden bg-muted/40 py-2 text-[11px] text-muted-foreground sm:grid")}>
        <span>품목명</span>
        <span className="text-right">수량</span>
        <span className="text-right">단가</span>
        <span className="text-right">금액</span>
        <span className="sr-only">상태</span>
      </div>
      <ul aria-label="거래 품목 요약">
        {visible.map((item) => {
          const mismatch = item.match === "확인 필요"
          return (
            <li key={item.id} className="border-t border-[var(--surface-border)] first:border-t-0 sm:first:border-t">
              <button
                type="button"
                onClick={() => openItem(item.id)}
                aria-label={`${item.goods} 품목 수정 칸으로 이동`}
                className={cn(row, "grid w-full grid-cols-[minmax(0,1fr)_auto] py-2 text-left transition-colors hover:bg-muted/40")}
              >
                <span className="min-w-0 truncate font-medium" title={item.goods}>{item.goods}</span>
                <span className={cn("text-right tabular-nums sm:order-none", mismatch && "font-semibold text-destructive")}>
                  {money(num(item.quantity))} {item.quantityUnit}
                </span>
                <span className="hidden text-right tabular-nums text-muted-foreground sm:block">{money(num(item.unitPrice))}</span>
                <span className="col-span-2 text-[11px] tabular-nums text-muted-foreground sm:col-span-1 sm:text-right sm:text-xs sm:text-foreground">
                  <span className="sm:hidden">{money(num(item.unitPrice))}/{item.quantityUnit} · </span>
                  {money(amountOf(item))} {currency}
                </span>
                <span className="hidden justify-end sm:flex">{mismatch ? <StatusBadge tone="warning">불일치</StatusBadge> : null}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <div className={cn(row, "grid grid-cols-[minmax(0,1fr)_auto] border-t border-[var(--surface-border)] bg-muted/40 py-2 font-semibold")}>
        <span className="flex items-center gap-2">
          합계 {items.length}개
          {hidden > 0 || expanded ? (
            <Button size="xs" variant="link" className="h-auto p-0 text-[11px] font-medium" onClick={() => setExpanded((open) => !open)}>
              {expanded ? "접기" : `외 ${hidden}개 · 전체 보기`}
            </Button>
          ) : null}
        </span>
        <span className="text-right tabular-nums">{totalQuantity}</span>
        <span className="hidden sm:block" />
        <span className="col-span-2 text-right tabular-nums sm:col-span-1">{money(total)} {currency}</span>
        <span className="hidden sm:block" />
      </div>
    </div>
  )
}

/* #27 #76 #93 결제 일정 산출 근거·분할·수동 보완 ------------------------- */

type ScheduleBasis = "contract_date" | "bl_date" | "eta" | "invoice_date"
const basisLabels: Record<ScheduleBasis, string> = {
  contract_date: "계약일",
  invoice_date: "인보이스 발행일",
  bl_date: "B/L 발행일",
  eta: "도착일(ETA)",
}
type ScheduleRow = {
  id: number
  label: string
  basis: ScheduleBasis
  days: string
  ratio: string
  manualDate: string
}

function addDays(date: string, days: number) {
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return ""
  parsed.setDate(parsed.getDate() + days)
  return parsed.toISOString().slice(0, 10)
}

export function PaymentSchedulePlan({
  terms,
  amount,
  currency,
  basisDates,
  direction,
  canWrite,
}: {
  terms: string
  amount: string
  currency: string
  basisDates: Partial<Record<ScheduleBasis, string>>
  direction: "sales" | "purchase" | "direction_pending"
  canWrite: boolean
}) {
  const parsedDays = /(\d+)\s*days?/i.exec(terms)?.[1] ?? ""
  const [rows, setRows] = useState<ScheduleRow[]>(() => [
    { id: 1, label: "전액", basis: "bl_date", days: parsedDays || "30", ratio: "100", manualDate: "" },
  ])
  const total = num(amount)
  const ratioSum = rows.reduce((sum, row) => sum + num(row.ratio), 0)
  const verb = direction === "sales" ? "수금" : direction === "purchase" ? "지급" : "결제"
  const update = (id: number, patch: Partial<ScheduleRow>) =>
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)))

  return (
    <div data-payment-schedule className="mt-5 scroll-mt-[calc(var(--deal-header-height,128px)+16px)] rounded-[var(--r-md)] border border-[var(--surface-border)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h5 className="text-sm font-semibold">{verb} 일정</h5>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {verb} 조건 <strong className="font-medium text-foreground">{terms || "미입력"}</strong>
            {parsedDays ? ` → 기준일 + ${parsedDays}일로 계산` : " → 기간을 읽지 못해 직접 입력이 필요합니다"}
          </p>
        </div>
        {canWrite ? (
          <Button
            size="xs"
            variant="outline"
            onClick={() =>
              setRows((current) => {
                const remaining = Math.max(0, 100 - current.reduce((sum, row) => sum + num(row.ratio), 0))
                const next = current.map((row, index) =>
                  current.length === 1 && index === 0 ? { ...row, label: "선금", basis: "contract_date" as const, days: "7", ratio: "30" } : row
                )
                return [
                  ...next,
                  {
                    id: Math.max(...current.map((row) => row.id)) + 1,
                    label: current.length === 1 ? "잔금" : `${current.length + 1}차`,
                    basis: "bl_date",
                    days: parsedDays || "30",
                    ratio: String(current.length === 1 ? 70 : remaining),
                    manualDate: "",
                  },
                ]
              })
            }
          >
            <Plus data-icon="inline-start" />분할 추가
          </Button>
        ) : null}
      </div>
      <div className="mt-3 hidden grid-cols-[72px_minmax(0,1.2fr)_72px_72px_minmax(0,1fr)_minmax(0,1.3fr)_32px] gap-2 text-[11px] text-muted-foreground @min-[760px]/fields:grid">
        <span>구분</span><span>기준일</span><span>기간(일)</span><span>비율(%)</span><span className="text-right">금액</span><span>{verb} 예정일</span><span className="sr-only">삭제</span>
      </div>
      <div className="mt-2 flex flex-col gap-3 @min-[760px]/fields:gap-2">
        {rows.map((row) => {
          const basisDate = basisDates[row.basis]
          const computed = basisDate && row.days !== "" ? addDays(basisDate, num(row.days)) : ""
          const rowAmount = (total * num(row.ratio)) / 100
          return (
            <div key={row.id} data-payment-row className="grid grid-cols-2 items-center gap-2 rounded-[var(--r-sm)] bg-muted/30 p-2 @min-[760px]/fields:grid-cols-[72px_minmax(0,1.2fr)_72px_72px_minmax(0,1fr)_minmax(0,1.3fr)_32px] @min-[760px]/fields:bg-transparent @min-[760px]/fields:p-0">
              <Input aria-label="구분" className="h-9" disabled={!canWrite} value={row.label} onChange={(event) => update(row.id, { label: event.target.value })} />
              <Select disabled={!canWrite} value={row.basis} onValueChange={(value) => update(row.id, { basis: value as ScheduleBasis })}>
                <SelectTrigger aria-label="기준일" className="h-9 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(basisLabels) as ScheduleBasis[]).map((basis) => (
                    <SelectItem key={basis} value={basis}>
                      {basisLabels[basis]}{basisDates[basis] ? "" : " (없음)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input aria-label="기간(일)" className="h-9 text-right tabular-nums" inputMode="numeric" disabled={!canWrite} value={row.days} onChange={(event) => /^\d*$/.test(event.target.value) && update(row.id, { days: event.target.value })} />
              <Input aria-label="비율(%)" className="h-9 text-right tabular-nums" inputMode="decimal" disabled={!canWrite} value={row.ratio} onChange={(event) => /^\d*(?:\.\d{0,2})?$/.test(event.target.value) && update(row.id, { ratio: event.target.value })} />
              <span className="text-right text-sm font-medium tabular-nums">{money(rowAmount)} {currency}</span>
              <div className="min-w-0">
                {computed ? (
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold tabular-nums">{computed}</span>
                    <span className="text-[11px] text-muted-foreground">{basisLabels[row.basis]} {basisDate} + {row.days}일 · 자동 계산</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <DatePicker className="w-full" ariaLabel={`${row.label} ${verb} 예정일 직접 입력`} value={row.manualDate} disabled={!canWrite} invalid={!row.manualDate} onValueChange={(value) => update(row.id, { manualDate: value })} />
                    <span className={cn("text-[11px]", row.manualDate ? "text-muted-foreground" : "text-[var(--color-orange-1)]")}>
                      {row.manualDate ? "수동 입력값 · 기준일 등록 시 다시 계산" : `자동 계산 불가 · ${basisLabels[row.basis]} 없음`}
                    </span>
                  </div>
                )}
              </div>
              <Button aria-label={`${row.label} 일정 삭제`} size="icon-sm" variant="ghost" disabled={!canWrite || rows.length === 1} onClick={() => setRows((current) => current.filter((entry) => entry.id !== row.id))}>
                <Trash2 />
              </Button>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--surface-border)] pt-3 text-xs">
        <span className="text-muted-foreground">총 {rows.length}회 · 거래 금액 {money(total)} {currency} 기준</span>
        {Math.abs(ratioSum - 100) > 0.001 ? (
          <StatusBadge tone="danger">비율 합계 {money(ratioSum)}% · 100%가 되어야 합니다</StatusBadge>
        ) : (
          <StatusBadge tone="success">비율 합계 100%</StatusBadge>
        )}
      </div>
    </div>
  )
}

/* #43 #44 통관 해당 여부 — 항구로 조용히 판단, 예외만 메뉴로 변경 ------------- */

/** 통관 단계 더보기: 예외일 때만 손으로 바꾼다. 사유는 받지 않고 활동 이력에만 남긴다. */
export function CustomsApplicabilityMenu({ canWrite }: { canWrite: boolean }) {
  const { notApplicable, manual, setManual } = useDealCustoms()
  if (!canWrite || !setManual) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="통관 단계 더보기"><MoreHorizontal /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => setManual(notApplicable ? "required" : "not_applicable")}>
          {notApplicable ? "통관 필요로 변경" : "통관 해당 없음으로 변경"}
        </DropdownMenuItem>
        {manual ? <DropdownMenuItem onClick={() => setManual(null)}>항구 기준으로 되돌리기</DropdownMenuItem> : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** 단계 제목 옆 한 줄: 「해당 없음 · Shanghai → Singapore」 */
export function CustomsNotApplicableNote() {
  const { notApplicable, manual, route, warning } = useDealCustoms()
  if (warning) return <span className="text-xs text-destructive">{warning}</span>
  if (!notApplicable) return null
  return (
    <span className="text-xs text-muted-foreground">
      {manual ? "담당자가 변경" : route}
    </span>
  )
}

export function DealCustomsWorkspace({
  canWrite,
  onOpenDocuments,
  onUpload,
  onOpenSettlement,
}: {
  canWrite: boolean
  onOpenDocuments: () => void
  onUpload: () => void
  onOpenSettlement: () => void
}) {
  const { notApplicable } = useDealCustoms()
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold">{notApplicable ? "통관 해당 없음" : "통관 문서 확인"}</h2>
          <CustomsNotApplicableNote />
        </div>
        <CustomsApplicabilityMenu canWrite={canWrite} />
      </div>
      {notApplicable ? (
        <div className="mt-3">
          <Button variant="outline" onClick={onOpenSettlement}>정산으로 이동<ArrowUpRight data-icon="inline-end" /></Button>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            수출입 신고서를 거래에 연결하고 문서의 신고번호·신고일·품목 정보를 확인합니다.
          </p>
          <div data-customs-actions className="mt-4 flex flex-wrap gap-2 rounded-[var(--r-sm)]">
            <Button variant="outline" onClick={onOpenDocuments}>거래 서류 확인</Button>
            {canWrite && <Button onClick={onUpload}>이 거래로 통관 서류 올리기</Button>}
          </div>
        </>
      )}
    </div>
  )
}

/* #84 매입·매출 연결 거래(백투백) ---------------------------------------- */

type LinkedDeal = {
  id: string
  title: string
  counterparty: string
  quantity: string
  unitPrice: string
  currency: string
}

const linkCandidates: LinkedDeal[] = [
  { id: "DL-260712-03", title: "8월 알루미늄 스크랩 판매", counterparty: "Daon Alloy Co.", quantity: "12", unitPrice: "135,000", currency: "USD" },
  { id: "DL-260715-07", title: "알루미늄 스크랩 국내 판매", counterparty: "Seorin Metal", quantity: "8", unitPrice: "131,500", currency: "USD" },
  { id: "DL-260720-02", title: "스크랩 혼합 판매", counterparty: "Hwasan Recycling", quantity: "6", unitPrice: "129,000", currency: "USD" },
]

export function DealLinkedDeals({
  direction,
  totalQuantity,
  unit,
  costPerUnit,
  canWrite,
}: {
  direction: "sales" | "purchase" | "direction_pending"
  totalQuantity: number
  unit: string
  costPerUnit: number
  canWrite: boolean
}) {
  const [links, setLinks] = useState<LinkedDeal[]>(() => [linkCandidates[0]])
  const [adding, setAdding] = useState(false)
  const [candidate, setCandidate] = useState("")
  const [quantity, setQuantity] = useState("")
  const counterpartLabel = direction === "sales" ? "매입" : "매출"
  const linked = links.reduce((sum, link) => sum + num(link.quantity), 0)
  const remaining = Math.max(0, totalQuantity - linked)
  const available = linkCandidates.filter((entry) => !links.some((link) => link.id === entry.id))
  return (
    <section
      id="deal-linked"
      aria-label="연결 거래"
      className="scroll-mt-[calc(var(--deal-header-height,128px)+16px)] rounded-[var(--r-lg)] bg-[var(--color-gray-12)] p-5 shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold"><Link2 className="size-4" />연결 거래</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            이 {direction === "sales" ? "매출" : "매입"} 거래와 짝을 이루는 {counterpartLabel} 거래입니다. 연결 수량만큼 원가를 나눠 손익을 계산합니다.
          </p>
        </div>
        {canWrite && direction !== "direction_pending" ? (
          <Button size="sm" variant="outline" disabled={!available.length || remaining <= 0} onClick={() => { setAdding(true); setQuantity(String(remaining)) }}>
            <Plus data-icon="inline-start" />{counterpartLabel} 거래 연결
          </Button>
        ) : null}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 rounded-[var(--r-md)] bg-muted/40 px-3.5 py-3 text-sm">
        <div><div className="text-[11px] text-muted-foreground">전체 수량</div><div className="font-semibold tabular-nums">{money(totalQuantity)} {unit}</div></div>
        <div><div className="text-[11px] text-muted-foreground">연결됨</div><div className="font-semibold tabular-nums">{money(linked)} {unit}</div></div>
        <div><div className="text-[11px] text-muted-foreground">미연결 잔량</div><div className={cn("font-semibold tabular-nums", remaining > 0 && "text-[var(--color-orange-1)]")}>{money(remaining)} {unit}</div></div>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="text-[11px] text-muted-foreground">
            <tr className="border-b border-[var(--surface-border)]">
              <th className="py-2 font-medium">상대 거래</th>
              <th className="py-2 text-right font-medium">연결 수량</th>
              <th className="py-2 text-right font-medium">연결 금액({counterpartLabel})</th>
              <th className="py-2 text-right font-medium">배분 원가</th>
              <th className="py-2 text-right font-medium">예상 손익</th>
              <th className="py-2"><span className="sr-only">관리</span></th>
            </tr>
          </thead>
          <tbody>
            {links.map((link) => {
              const qty = num(link.quantity)
              const revenue = qty * num(link.unitPrice)
              const cost = qty * costPerUnit
              return (
                <tr key={link.id} className="border-b border-[var(--surface-border)]">
                  <td className="py-2.5">
                    <a href={`/erp/deals/${link.id}`} className="font-semibold text-primary hover:underline">{link.id}</a>
                    <div className="text-[11px] text-muted-foreground">{link.title} · {link.counterparty}</div>
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{money(qty)} {unit}</td>
                  <td className="py-2.5 text-right tabular-nums">{money(revenue)} {link.currency}</td>
                  <td className="py-2.5 text-right tabular-nums">{money(cost)} {link.currency}<div className="text-[11px] text-muted-foreground">{money(costPerUnit)}/{unit} × {money(qty)}</div></td>
                  <td className={cn("py-2.5 text-right font-semibold tabular-nums", revenue - cost >= 0 ? "text-[var(--color-green-1)]" : "text-destructive")}>{money(revenue - cost)} {link.currency}</td>
                  <td className="py-2.5 text-right">
                    {canWrite ? <Button aria-label={`${link.id} 연결 해제`} size="icon-sm" variant="ghost" onClick={() => setLinks((current) => current.filter((entry) => entry.id !== link.id))}><Trash2 /></Button> : null}
                  </td>
                </tr>
              )
            })}
            {!links.length ? (
              <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">연결된 {counterpartLabel} 거래가 없습니다.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {adding ? (
        <div data-link-form className="mt-3 flex flex-wrap items-end gap-2 rounded-[var(--r-md)] border border-[var(--surface-border)] p-3">
          <label className="grid min-w-56 flex-1 gap-1 text-[11px] text-muted-foreground">{counterpartLabel} 거래
            <Select value={candidate} onValueChange={(value) => setCandidate(value ?? "")}>
              <SelectTrigger aria-label={`연결할 ${counterpartLabel} 거래`} className="h-9 w-full"><SelectValue placeholder="거래 선택" /></SelectTrigger>
              <SelectContent>
                {available.map((entry) => <SelectItem key={entry.id} value={entry.id}>{entry.id} · {entry.counterparty} · {entry.quantity} {unit}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
          <label className="grid w-32 gap-1 text-[11px] text-muted-foreground">연결 수량({unit})
            <Input aria-label="연결 수량" className="h-9 text-right tabular-nums" inputMode="decimal" value={quantity} onChange={(event) => /^\d*(?:\.\d*)?$/.test(event.target.value) && setQuantity(event.target.value)} />
          </label>
          <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setCandidate("") }}>취소</Button>
          <Button
            size="sm"
            disabled={!candidate || num(quantity) <= 0 || num(quantity) > remaining}
            onClick={() => {
              const found = linkCandidates.find((entry) => entry.id === candidate)
              if (!found) return
              setLinks((current) => [...current, { ...found, quantity }])
              setAdding(false)
              setCandidate("")
            }}
          >
            연결
          </Button>
          {num(quantity) > remaining ? <p className="w-full text-[11px] text-destructive">미연결 잔량 {money(remaining)} {unit}보다 많이 연결할 수 없습니다.</p> : null}
        </div>
      ) : null}
    </section>
  )
}

/* 지급 계좌 변경 — 백엔드 GET /trade/deals/:id/bank-change 응답(현재·이전 계좌·근거 서류)을 안내한다.
   「확인」은 안내만 닫는다(화면 저장). 백엔드 점수·위험은 바뀌지 않는다. */
export function BankChangeCheck() {
  const { acknowledged, acknowledge } = useDealBankNotice()
  if (acknowledged) return null
  return (
    <div id="deal-bank-check" className="mt-3 flex flex-wrap items-start justify-between gap-3 rounded-[var(--r-md)] border border-warning/30 bg-[var(--color-orange-6)] px-3.5 py-3 text-xs">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold">지급 계좌가 이전 송장과 다릅니다</p>
        <p className="mt-1 tabular-nums text-muted-foreground">
          이전 <span className="text-foreground">DBS Bank · 0721-334-559</span> (2026-05-14 송장)
          {" → "}현재 <span className="font-medium text-foreground">JPMorgan Chase Singapore · 8830043968</span> (Invoice_HB-2607-003)
        </p>
        <p className="mt-1 text-muted-foreground">결제 전 거래처에 직접 확인하세요 — 사기 위험.</p>
      </div>
      <Button size="sm" variant="outline" onClick={acknowledge}>확인</Button>
    </div>
  )
}

import type {
  CreatePaymentScheduleBody,
  LedgerEntry,
  LedgerResponse,
  SettlementCell,
  SettlementOverview,
  SettlementCalendar,
} from "../api/settlement"
import {
  financeDecimalMagnitude,
  FINANCE_DECIMAL_SCALE,
  isFinanceDecimal,
} from "../financeDecimal"
import { formatScaledDecimal } from "../money"

const prefix = "ecoya:demo:deal-payment-schedule:"
type Schedule = LedgerEntry & { type: "payable" | "receivable" }

function schedules(): Schedule[] {
  return Object.keys(localStorage)
    .filter((key) => key.startsWith(prefix))
    .flatMap((key) => {
      try {
        const row: Schedule = JSON.parse(localStorage.getItem(key) ?? "null")
        return row &&
          row.id &&
          isFinanceDecimal(row.amount) &&
          ["payable", "receivable"].includes(row.type)
          ? [row]
          : []
      } catch {
        return []
      }
    })
}

export function createDemoPaymentSchedule(body: CreatePaymentScheduleBody) {
  if (
    !isFinanceDecimal(body.amount) ||
    financeDecimalMagnitude(body.amount) <= 0n ||
    !/^[A-Z]{3}$/.test(body.currency) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(body.due_date) ||
    !["payable", "receivable"].includes(body.type)
  ) {
    throw new Error("정산 일정의 금액·통화·예정일을 확인해 주세요.")
  }
  const row: Schedule = {
    ...body,
    id: crypto.randomUUID(),
    status: "scheduled",
    paid: "0",
    outstanding: body.amount,
    source_document_state: "none",
    deal_cancelled: false,
  }
  localStorage.setItem(prefix + row.id, JSON.stringify(row))
  return row
}

function add(a: string, b: string, subtract = false) {
  const value =
    financeDecimalMagnitude(a) +
    (subtract ? -1n : 1n) * financeDecimalMagnitude(b)
  return formatScaledDecimal(value, FINANCE_DECIMAL_SCALE).replaceAll(",", "")
}

function daysUntil(due: string, asOf: string) {
  return (
    (Date.parse(due.slice(0, 10)) - Date.parse(asOf.slice(0, 10))) / 86400000
  )
}

function dueBucket(days: number) {
  if (days < 0) return "overdue"
  if (days <= 7) return "d0_7"
  if (days <= 30) return "d8_30"
  return days <= 90 ? "d31_90" : "later"
}

export function withDemoSettlementTotals<
  T extends SettlementOverview | SettlementCalendar,
>(snapshot: T): T {
  const result = structuredClone(snapshot)
  const increaseCell = (
    cells: SettlementCell[],
    row: Schedule,
    bucket: string
  ) => {
    let cell = cells.find(
      (c) =>
        c.type === row.type &&
        c.currency === row.currency &&
        c.bucket === bucket
    )
    if (!cell) {
      cell = {
        type: row.type,
        currency: row.currency,
        bucket,
        count: 0,
        total: "0",
      }
      cells.push(cell)
    }
    cell.count++
    cell.total = add(cell.total, row.amount)
  }
  for (const row of schedules()) {
    const days = daysUntil(row.due_date, result.data_as_of)
    increaseCell(result.cells, row, dueBucket(days))
    if (!("by_currency" in result)) continue
    increaseCell(
      (result.aging ??= []),
      row,
      days >= 0
        ? "current"
        : days >= -30
          ? "d1_30"
          : days >= -60
            ? "d31_60"
            : days >= -90
              ? "d61_90"
              : "d90_plus"
    )
    let exposure = result.by_currency.find((c) => c.currency === row.currency)
    if (!exposure) {
      exposure = {
        currency: row.currency,
        payable: "0",
        receivable: "0",
        net: "0",
      }
      result.by_currency.push(exposure)
    }
    exposure[row.type] = add(exposure[row.type], row.amount)
    exposure.net = add(exposure.receivable, exposure.payable, true)
    const counterparties = (result.by_counterparty ??= [])
    let party = counterparties.find(
      (p) =>
        p.currency === row.currency &&
        p.counterparty_name === row.counterparty_name
    )
    if (!party) {
      party = {
        currency: row.currency,
        counterparty_name: row.counterparty_name,
        receivable: "0",
        payable: "0",
        overdue_receivable: "0",
      }
      counterparties.push(party)
    }
    party[row.type] = add(party[row.type], row.amount)
    if (days < 0 && row.type === "receivable")
      party.overdue_receivable = add(party.overdue_receivable, row.amount)
  }
  return result
}

export function withDemoScheduleLedger(
  base: LedgerResponse,
  query: URLSearchParams,
  asOf: string
): LedgerResponse {
  const added = schedules().filter(
    (row) =>
      (!query.get("type") || row.type === query.get("type")) &&
      (!query.get("currency") || row.currency === query.get("currency")) &&
      (!query.get("bucket") ||
        dueBucket(daysUntil(row.due_date, asOf)) === query.get("bucket"))
  )
  if (!added.length)
    return Number(query.get("offset") || 0) > 0
      ? { ...base, entries: [] }
      : base
  const entries = [...added.reverse(), ...base.entries]
  const offset = Number(query.get("offset") || 0)
  const limit = Number(query.get("limit") || 500)
  return {
    entries: entries.slice(offset, offset + limit),
    pagination: { offset, limit, total: entries.length },
  }
}

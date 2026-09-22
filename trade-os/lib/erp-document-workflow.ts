import { decimalMagnitude, FINANCE_DECIMAL_SCALE } from "./financeDecimal"
import { normalizeDecimalInput, formatScaledDecimal } from "./money"

// Preview adapter contract mirrored from develop-local@7bc36be0 and its
// pinned backend 8f5cfcfd. Saving reviewed fields never commits a document.
export type ReviewedField = { value: string; unit?: string }
export type DocumentReviewState = {
  revision: number
  fields: Record<string, ReviewedField>
  status: "review" | "committed"
  dealId?: string
  documentType?: string
  idempotencyKey?: string
}
export type BankSchedule = {
  id: string
  dealId: string
  counterparty: string
  currency: string
  direction: "receivable" | "payable" | "direction_pending"
  outstanding: string | null
  dueDate: string
  status: string
}
export type BankCashInput = {
  scheduleId: string
  amount: string
  currency: string
  valueDate: string
  sourceDocumentId: string
  idempotencyKey: string
}

export const bankScheduleFixtures: BankSchedule[] = [
  {
    id: "receivable-2026-08-31",
    dealId: "DL-260707-04",
    counterparty: "ACME GmbH",
    currency: "USD",
    direction: "receivable",
    outstanding: "380000",
    dueDate: "2026-08-31",
    status: "open",
  },
  {
    id: "receivable-2026-09-15",
    dealId: "DL-260701-09",
    counterparty: "Hanbit Trading Co.",
    currency: "USD",
    direction: "receivable",
    outstanding: "620000",
    dueDate: "2026-09-15",
    status: "open",
  },
]

export function eligibleBankSchedules(
  schedules: BankSchedule[],
  dealId: string,
  currency: string
) {
  return schedules.filter(
    (schedule) =>
      schedule.dealId === dealId &&
      schedule.currency === currency.trim().toUpperCase() &&
      schedule.direction !== "direction_pending" &&
      !["closed", "completed", "cancelled"].includes(schedule.status) &&
      schedule.outstanding !== null &&
      (decimalMagnitude(schedule.outstanding, FINANCE_DECIMAL_SCALE) ??
        BigInt(0)) > BigInt(0)
  )
}

export function bankCashValidation(
  input: Pick<
    BankCashInput,
    "scheduleId" | "amount" | "currency" | "valueDate"
  >,
  schedules: BankSchedule[]
): string | null {
  const schedule = schedules.find((item) => item.id === input.scheduleId)
  if (
    !schedule ||
    schedule.currency !== input.currency ||
    schedule.direction === "direction_pending" ||
    ["closed", "completed", "cancelled"].includes(schedule.status)
  )
    return "같은 통화의 미결제 일정을 선택해 주세요."
  const amount = decimalMagnitude(
    normalizeDecimalInput(input.amount),
    FINANCE_DECIMAL_SCALE
  )
  const outstanding = decimalMagnitude(
    schedule.outstanding,
    FINANCE_DECIMAL_SCALE
  )
  if (amount === null || amount <= BigInt(0))
    return "기록할 금액은 0보다 큰 숫자로 입력해 주세요."
  if (outstanding === null) return "일정 잔액을 확인한 뒤 기록해 주세요."
  if (amount > outstanding)
    return "미결제 잔액을 초과했습니다. 초과 입금은 정산에서 처리해 주세요."
  const date = new Date(`${input.valueDate}T00:00:00Z`)
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.valueDate) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== input.valueDate
  )
    return "유효한 입출금일을 입력해 주세요."
  return null
}

const reviewPrefix = "ecoya-prototype-document-review-v2:"
export const bankCashStorageKey = "ecoya-prototype-bank-cash-v1"

export function readDocumentReview(id: string): DocumentReviewState {
  try {
    const stored = JSON.parse(localStorage.getItem(reviewPrefix + id) ?? "null")
    if (
      stored &&
      Number.isSafeInteger(stored.revision) &&
      stored.revision > 0 &&
      ["review", "committed"].includes(stored.status) &&
      stored.fields &&
      typeof stored.fields === "object"
    )
      return stored
  } catch {
    /* An absent preview draft starts at revision 1. */
  }
  return { revision: 1, status: "review", fields: {} }
}

export function saveDocumentReview(
  id: string,
  fields: Record<string, ReviewedField>
): DocumentReviewState {
  const current = readDocumentReview(id)
  if (current.status === "committed")
    throw new Error("확정된 문서는 변경 사유와 함께 수정해야 합니다.")
  const next = { ...current, fields, revision: current.revision + 1 }
  localStorage.setItem(reviewPrefix + id, JSON.stringify(next))
  return next
}

export function confirmDocumentReview(input: {
  id: string
  dealId: string
  documentType: string
  expectedRevision: number
  idempotencyKey: string
}): DocumentReviewState {
  const current = readDocumentReview(input.id)
  if (current.status === "committed") {
    if (
      current.idempotencyKey === input.idempotencyKey &&
      current.dealId === input.dealId
    )
      return current
    throw new Error("이미 확정된 문서입니다. 연결된 거래를 확인해 주세요.")
  }
  if (!input.dealId) throw new Error("연결할 거래를 선택해 주세요.")
  if (current.revision !== input.expectedRevision)
    throw new Error(
      "문서가 변경되었습니다. 최신 값을 확인하고 다시 연결해 주세요."
    )
  const next: DocumentReviewState = {
    ...current,
    status: "committed",
    dealId: input.dealId,
    documentType: input.documentType === "C/O" ? "CO" : input.documentType,
    idempotencyKey: input.idempotencyKey,
    revision: current.revision + 1,
  }
  localStorage.setItem(reviewPrefix + input.id, JSON.stringify(next))
  return next
}

export function readBankCashRecords(): BankCashInput[] {
  try {
    const records = JSON.parse(localStorage.getItem(bankCashStorageKey) ?? "[]")
    return Array.isArray(records) ? records : []
  } catch {
    return []
  }
}

export function currentBankSchedules(): BankSchedule[] {
  const records = readBankCashRecords()
  return bankScheduleFixtures.map((schedule) => {
    const original = decimalMagnitude(
      schedule.outstanding,
      FINANCE_DECIMAL_SCALE
    )
    if (original === null) return schedule
    const applied = records
      .filter(
        (record) =>
          record.scheduleId === schedule.id &&
          record.currency === schedule.currency
      )
      .reduce(
        (sum, record) =>
          sum +
          (decimalMagnitude(record.amount, FINANCE_DECIMAL_SCALE) ?? BigInt(0)),
        BigInt(0)
      )
    const remaining = original - applied
    return {
      ...schedule,
      outstanding: formatScaledDecimal(
        remaining,
        FINANCE_DECIMAL_SCALE
      ).replaceAll(",", ""),
      status: remaining <= BigInt(0) ? "completed" : schedule.status,
    }
  })
}

export function recordBankCash(input: BankCashInput) {
  const normalized = { ...input, amount: normalizeDecimalInput(input.amount) }
  const records = readBankCashRecords()
  const existing = records.find(
    (item) => item.sourceDocumentId === input.sourceDocumentId
  )
  if (existing) {
    if (JSON.stringify(existing) === JSON.stringify(normalized)) return existing
    throw new Error(
      "이 문서의 현금 기록이 이미 있습니다. 정산에서 확인해 주세요."
    )
  }
  const review = readDocumentReview(input.sourceDocumentId)
  if (review.status !== "committed")
    throw new Error("문서 확정 후 현금을 기록할 수 있습니다.")
  const schedules = eligibleBankSchedules(
    currentBankSchedules(),
    review.dealId ?? "",
    input.currency
  )
  const error = bankCashValidation(normalized, schedules)
  if (error) throw new Error(error)
  localStorage.setItem(
    bankCashStorageKey,
    JSON.stringify([...records, normalized])
  )
  return normalized
}

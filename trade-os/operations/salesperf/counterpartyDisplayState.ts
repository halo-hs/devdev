import type { CounterpartyStatusItem } from "../lib/api/reports";
import { amountCell } from "@trade-os/lib/financeDecimal";

// Optional presentation evidence: absence must never be interpreted as no write-off.
export type CounterpartyWithWriteoff = CounterpartyStatusItem & { written_off_total?: string };
export function counterpartyDisplayState(item: CounterpartyWithWriteoff) {
  const overdue = amountCell(item.overdue), outstanding = amountCell(item.outstanding), due = amountCell(item.total_due), writtenOff = amountCell(item.written_off_total);
  const unknown = !overdue.valid || !outstanding.valid || overdue.scaled < 0n || outstanding.scaled < 0n;
  if (unknown) return { label: "확인 필요", tone: "warning" as const, writtenOff };
  if (overdue.scaled > 0n) return { label: "연체", tone: "danger" as const, writtenOff };
  if (outstanding.scaled > 0n) return { label: "미정산", tone: "warning" as const, writtenOff };
  if (writtenOff.valid && writtenOff.scaled > 0n) return { label: "상각 처리", tone: "neutral" as const, writtenOff };
  if (writtenOff.valid && writtenOff.scaled === 0n && due.valid && due.scaled > 0n) return { label: "정산 완료", tone: "success" as const, writtenOff };
  return { label: "확인 필요", tone: "warning" as const, writtenOff };
}

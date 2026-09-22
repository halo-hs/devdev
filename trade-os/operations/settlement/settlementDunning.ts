import { financeDecimalMagnitude, type LedgerEntry } from "@trade-os/operations/lib/api/settlement";

const FINANCE_ZERO = BigInt(0);
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function isoDate(value: string | null | undefined): string | null {
  const candidate = (value ?? "").slice(0, 10);
  return DATE_ONLY_RE.test(candidate) ? candidate : null;
}

export function isSettlementDunningOverdue(
  entry: Pick<LedgerEntry, "due_date">,
  asOf: string,
): boolean {
  const dueDate = isoDate(entry.due_date);
  const asOfDate = isoDate(asOf);
  return dueDate !== null && asOfDate !== null && dueDate < asOfDate;
}

function compareDunningDueDates(left: LedgerEntry, right: LedgerEntry): number {
  const leftDate = isoDate(left.due_date);
  const rightDate = isoDate(right.due_date);
  if (leftDate === null && rightDate === null) return 0;
  if (leftDate === null) return 1;
  if (rightDate === null) return -1;
  return leftDate.localeCompare(rightDate);
}

export function selectSettlementDunningEntries(
  entries: readonly LedgerEntry[],
  asOf: string,
): LedgerEntry[] {
  return entries
    .filter(
      (entry) =>
        entry.type === "receivable" &&
        !entry.closure_type &&
        financeDecimalMagnitude(entry.outstanding) > FINANCE_ZERO,
    )
    .toSorted((left, right) => {
      const leftOverdue = isSettlementDunningOverdue(left, asOf);
      const rightOverdue = isSettlementDunningOverdue(right, asOf);
      if (leftOverdue !== rightOverdue) return leftOverdue ? -1 : 1;

      const dueDateOrder = compareDunningDueDates(left, right);
      if (dueDateOrder !== 0) return dueDateOrder;

      const outstandingOrder =
        financeDecimalMagnitude(right.outstanding) -
        financeDecimalMagnitude(left.outstanding);
      if (outstandingOrder !== FINANCE_ZERO) {
        return outstandingOrder > FINANCE_ZERO ? 1 : -1;
      }
      return left.id.localeCompare(right.id);
    });
}

type SettlementDunningTemplateValues = {
  amount: string;
  counterparty: string;
  dueDate: string;
};

export function interpolateSettlementDunningTemplate(
  template: string,
  values: SettlementDunningTemplateValues,
): string {
  return template
    .replaceAll("{counterparty}", values.counterparty)
    .replaceAll("{amount}", values.amount)
    .replaceAll("{dueDate}", values.dueDate);
}

export function buildSettlementDunningMailto(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

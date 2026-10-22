import { financeDecimalMagnitude } from "@trade-os/lib/financeDecimal";
import type { RecordSettlementOverpaymentRefundBody, SettlementOverpaymentRefund } from '../lib/api/settlement';
export type PendingRefund = { body: RecordSettlementOverpaymentRefundBody; previousIds: string[] };
const key = (id: string) => `ecoya:settlement:pending-refund:v1:${id}`;
export function readPendingRefund(id: string): PendingRefund | null {
  try { const raw = localStorage.getItem(key(id)); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function savePendingRefund(id: string, value: PendingRefund) { localStorage.setItem(key(id), JSON.stringify(value)); }
export function clearPendingRefund(id: string) { localStorage.removeItem(key(id)); }
export function refundConfirmed(pending: PendingRefund, rows: SettlementOverpaymentRefund[]) {
  return rows.some(row => !pending.previousIds.includes(row.id) && financeDecimalMagnitude(row.amount) === financeDecimalMagnitude(pending.body.amount) && row.currency === pending.body.currency && row.evidence === pending.body.evidence && row.reason === pending.body.reason && (row.document_no ?? '') === (pending.body.document_no ?? ''));
}

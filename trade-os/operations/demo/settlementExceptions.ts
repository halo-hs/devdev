import captured from './responses.json';
import { ApiError } from '../lib/api/client';
import { FINANCE_DECIMAL_SCALE, financeDecimalMagnitude, isFinanceDecimal } from '@trade-os/lib/financeDecimal';
import type { LedgerEntry, SettlementOverpaymentRefund, RecordSettlementOverpaymentRefundBody } from '../lib/api/settlement';
export type DemoAllocation = { id: string; overpayment_id: string; schedule_id: string; amount: string; reason: string; evidence: string };
const data = captured as Record<string, unknown>;
const entries = ['receivable','payable'].flatMap(type => (data[`/trade/settlement/ledger?type=${type}&limit=500&offset=0`] as {entries: LedgerEntry[]}).entries);
const sources = entries.filter(row => row.type === 'receivable' && financeDecimalMagnitude(row.paid) > 0n);
const storageKey = 'ecoya:demo:settlement-exceptions:v1';
type Store = { refunds: SettlementOverpaymentRefund[]; allocations: DemoAllocation[] };
const read = (): Store => { try { return JSON.parse(localStorage.getItem(storageKey) || '{"refunds":[],"allocations":[]}'); } catch { return {refunds:[],allocations:[]}; } };
const save = (store: Store) => localStorage.setItem(storageKey, JSON.stringify(store));
export const decimalString = (v: bigint) => `${v / FINANCE_DECIMAL_SCALE}.${(v % FINANCE_DECIMAL_SCALE).toString().padStart(10,'0')}`;
const fail = (message: string): never => { throw new ApiError({status:422,code:'ERP_SETTLEMENT_VALIDATION',message}); };
function sourceFor(id: string) { return sources.find(row => `demo-overpayment-${row.id}` === id); }
function balance(id: string) {
  const store=read();
  const allocated=store.allocations.filter(row=>row.overpayment_id===id).reduce((n,row)=>n+financeDecimalMagnitude(row.amount),0n);
  const refunded=store.refunds.filter(row=>row.overpayment_id===id).reduce((n,row)=>n+financeDecimalMagnitude(row.amount),0n);
  return {allocated,refunded,remaining:financeDecimalMagnitude('1000')-allocated-refunded};
}
export function demoAllocationCandidates(id: string) {
  const source=sourceFor(id); if(!source) return [];
  const store=read();
  return entries.filter(row=>row.id!==source.id && row.counterparty_name===source.counterparty_name && row.currency===source.currency && row.type===source.type && !row.closure_type && !row.deal_cancelled && !['cancelled','archived','completed'].includes(row.status)).map(row=>({ ...row, outstanding:decimalString(financeDecimalMagnitude(row.outstanding)-store.allocations.filter(a=>a.schedule_id===row.id).reduce((n,a)=>n+financeDecimalMagnitude(a.amount),0n)) })).filter(row=>financeDecimalMagnitude(row.outstanding)>0n);
}
export function demoAllocations(id: string) { return read().allocations.filter(row=>row.overpayment_id===id); }
export function demoAllocate(id: string, draft: Omit<DemoAllocation,'id'|'overpayment_id'>) {
  const target=demoAllocationCandidates(id).find(row=>row.id===draft.schedule_id);
  if(!target || !isFinanceDecimal(draft.amount) || !draft.reason.trim() || !draft.evidence.trim()) fail('일정, 금액, 사유와 근거를 확인해 주세요.');
  const amount=financeDecimalMagnitude(draft.amount);
  if(amount<=0n || amount>balance(id).remaining || amount>financeDecimalMagnitude(target!.outstanding)) fail('남은 금액 또는 대상 일정의 미결제금액을 초과할 수 없습니다.');
  const store=read();store.allocations.push({...draft,id:crypto.randomUUID(),overpayment_id:id});save(store);
}
export function demoExceptionResponse(path: string, method: string, body?: string): {handled:boolean;value?:unknown} {
  const payments=path.match(/^\/erp\/payment-schedules\/([^/]+)\/payments$/);
  if(payments && method==='GET') {
    const row=entries.find(r=>r.id===payments[1]);
    if(row) return {handled:true,value:{schedule_id:row.id,amount:row.amount,paid:row.paid,outstanding:row.outstanding,fees:'0',payments:[]}};
  }
  const schedule=path.match(/^\/trade\/settlement\/schedules\/([^/]+)\/(overpayments|adjustments|payments)$/);
  if(schedule && method==='GET') {
    const row=entries.find(r=>r.id===schedule[1]);if(!row)return {handled:false};
    if(schedule[2]==='overpayments') {
      const id=`demo-overpayment-${row.id}`, b=balance(id);
      return {handled:true,value:{overpayments:sources.some(s=>s.id===row.id)?[{id,schedule_id:row.id,payment_id:`demo-payment-${row.id}`,amount:'1000',allocated_amount:decimalString(b.allocated),refunded_total:decimalString(b.refunded),remaining:decimalString(b.remaining),currency:row.currency,kind:'overpay',counterparty_name:row.counterparty_name,deal_id:row.deal_id}]:[]}};
    }
    if(schedule[2]==='adjustments') return {handled:true,value:{adjustments:[],original_amount:row.amount,current_target:row.amount,adjustment_total:'0',written_off_total:'0'}};
    return {handled:true,value:{schedule_id:row.id,amount:row.amount,paid:row.paid,outstanding:row.outstanding,fees:'0',payments:[]}};
  }
  const refund=path.match(/^\/trade\/settlement\/overpayments\/([^/]+)\/refunds$/);
  if(refund && sourceFor(refund[1])) {
    const id=refund[1];
    if(method==='GET') return {handled:true,value:{refunds:read().refunds.filter(r=>r.overpayment_id===id)}};
    if(method==='POST') {
      const draft=JSON.parse(body || '{}') as RecordSettlementOverpaymentRefundBody;
      const amount=financeDecimalMagnitude(draft.amount);
      if(!isFinanceDecimal(draft.amount)||amount<=0n||amount>balance(id).remaining||draft.currency!==sourceFor(id)!.currency||!draft.reason?.trim()||!draft.evidence?.trim()) fail('환불 금액·통화·사유·근거를 확인해 주세요.');
      const store=read();const row={...draft,id:crypto.randomUUID(),overpayment_id:id};store.refunds.push(row);save(store);return {handled:true,value:row};
    }
  }
  return {handled:false};
}

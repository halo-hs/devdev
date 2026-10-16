import { useState } from 'react';
import { Button } from '../components/ui/button';
import { operationsDemo } from '../demo/mode';
import { demoAllocate, demoAllocationCandidates, demoAllocations } from '../demo/settlementExceptions';

export function OverpaymentAllocationPanel({id, canRecord, disabled, onSaved}: {id:string;canRecord:boolean;disabled:boolean;onSaved:()=>void}) {
  const [draft,setDraft]=useState({schedule_id:'',amount:'',reason:'',evidence:''});
  const [error,setError]=useState('');
  const [version,setVersion]=useState(0);
  const candidates=operationsDemo ? demoAllocationCandidates(id) : [];
  const history=operationsDemo ? demoAllocations(id) : [];
  const submit=()=>{
    if(!operationsDemo || !canRecord || disabled)return;
    try { demoAllocate(id,draft);setDraft({schedule_id:'',amount:'',reason:'',evidence:''});setError('');setVersion(version+1);onSaved(); }
    catch(e){setError(e instanceof Error?e.message:'배정하지 못했습니다. 입력한 값을 확인해 주세요.');}
  };
  const input='min-w-0 w-full rounded-md border border-border bg-surface-card px-2 py-2 text-body-13';
  return <section className="mt-4 border-t border-border-subtle pt-3" aria-label="다른 일정에 나눠 넣기">
    <h6 className="text-body-13 font-medium">다른 일정에 나눠 넣기</h6>
    <p className="mt-1 text-label-12 text-text-muted">같은 거래처·같은 통화의 일정을 직접 선택하세요.</p>
    {!operationsDemo ? <p className="mt-2 text-label-12 text-text-muted">배정 기능을 사용할 수 없습니다.</p> : <>
      {canRecord && candidates.length>0 ? <div className="mt-2 grid min-w-0 gap-2 sm:grid-cols-2">
        <label className="min-w-0 sm:col-span-2">대상 일정<select aria-label="배정 대상 일정" className={input} disabled={disabled} value={draft.schedule_id} onChange={e=>setDraft({...draft,schedule_id:e.target.value})}><option value="">일정을 선택하세요</option>{candidates.map(row=><option key={row.id} value={row.id}>{row.counterparty_name} · {row.currency} {row.outstanding.replace(/0+$/,'').replace(/\.$/,'')} · {row.due_date.slice(0,10)} · {row.id.slice(0,8)}</option>)}</select></label>
        <label>나눠 넣을 금액<input className={input} inputMode="decimal" value={draft.amount} disabled={disabled} onChange={e=>setDraft({...draft,amount:e.target.value})}/></label>
        <label>배정 사유<input className={input} value={draft.reason} disabled={disabled} onChange={e=>setDraft({...draft,reason:e.target.value})}/></label>
        <label className="sm:col-span-2">배정 근거<input className={input} value={draft.evidence} disabled={disabled} onChange={e=>setDraft({...draft,evidence:e.target.value})}/></label>
        {error && <p role="alert" className="text-status-danger sm:col-span-2">{error}</p>}
        <Button size="sm" type="button" disabled={disabled} onClick={submit}>나눠 넣기</Button>
      </div> : candidates.length===0 ? <p className="mt-2 text-text-muted">나눠 넣을 수 있는 일정이 없습니다.</p> : null}
      <h6 className="mt-3 font-medium">나눠 넣은 기록</h6>
      {history.length===0 ? <p className="mt-1 text-text-muted">아직 나눠 넣은 기록이 없습니다.</p> : <ul className="mt-1 space-y-2">{history.map(row=><li className="break-words" key={row.id}><span>{row.amount} · {row.reason}</span><span className="block break-all">일정 {row.schedule_id} · 근거 {row.evidence}</span></li>)}</ul>}
    </>}
  </section>;
}

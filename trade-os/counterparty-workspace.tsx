import { useEffect, useState } from "react"
import { BusinessPageHero } from "@shared/components/business-page-hero"
import { Button } from "@shared/components/ui/button"
import { Badge } from "@shared/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@shared/components/ui/tabs"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@shared/components/ui/table"
import { deals, type Deal } from "@trade-os/lib/prototype-deals"
import { listDealDocuments } from "@trade-os/lib/deal-document-actions"
import { orderProgress } from "@trade-os/lib/deal-finance-workspace"

type CurrencySummary = { currency: string; receivable: string; payable: string; overdue: string; trust: string }
type Schedule = { id: string; dealId: string; direction: string; due: string; amount: string; currency: string; overdue: boolean }
type Model = { name: string; role: string; mergedFrom?: string; currencies: CurrencySummary[]; deals: Deal[]; schedules: Schedule[]; partial: boolean; asOf: string }
// Public design fixture adapter. The production model is supplied by settlement,
// counterparties and documents APIs with their own permission and partial states.
export const counterpartyPreview = {
  async read(id: string): Promise<Model | null> {
    const alias = id === "ACME Germany"
    const name = alias || id === "acme" ? "ACME GmbH" : id
    const related = deals.filter(deal => deal.counterparty === name)
    if (!related.length) return null
    const acme = name === "ACME GmbH"
    return {
      name, role: acme ? "매출처" : name.startsWith("KATAMAN") ? "매입처" : "매입처·매출처",
      ...(alias ? { mergedFrom: id } : {}),
      asOf: "2026-07-31 09:00", partial: name.startsWith("KATAMAN"), deals: related,
      currencies: acme ? [
        { currency: "USD", receivable: "42,000.00", payable: "0.00", overdue: "8,000.00", trust: "B+ · 이력 12건" },
        { currency: "EUR", receivable: "12,800.00", payable: "2,400.00", overdue: "0.00", trust: "이력 부족 2건" },
        { currency: "JPY", receivable: "960,000", payable: "0", overdue: "0", trust: "이력 부족 1건" },
        { currency: "KRW", receivable: "1,200,000", payable: "0", overdue: "0", trust: "이력 부족 1건" },
      ] : [...new Set(related.map(deal => deal.currency))].map(currency => ({ currency, receivable: "—", payable: "—", overdue: "—", trust: "이력 확인 필요" })),
      schedules: acme ? [
        { id: "AR-0707-1", dealId: "DL-260707-04", direction: "받을 돈", due: "2026-07-28", amount: "8,000.00", currency: "USD", overdue: true },
        { id: "AR-0707-2", dealId: "DL-260707-04", direction: "받을 돈", due: "2026-08-08", amount: "34,000.00", currency: "USD", overdue: false },
      ] : [],
    }
  },
}
const stages = { contract: "계약", shipment: "선적", customs: "통관", settlement: "정산 중", settled: "정산 완료" }

export function CounterpartyWorkspace({ id = "acme", onDeal, onSettlement, role = "owner" }: {
  id?: string; onDeal: (id: string) => void; onSettlement: () => void; role?: string
}) {
  const [model, setModel] = useState<Model | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")
  const [attempt, setAttempt] = useState(0)
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState(false)
  const [currency, setCurrency] = useState("all")
  useEffect(() => {
    let active = true
    setState("loading"); setPage(1); setExpanded(false); setCurrency("all")
    counterpartyPreview.read(id).then(value => { if (active) { setModel(value); setState("ready") } })
      .catch(() => { if (active) setState("error") })
    return () => { active = false }
  }, [id, attempt])
  const sectionClass = "min-w-0 rounded-lg border bg-background p-5"
  const shownDeals = model?.deals.slice((page - 1) * 5, page * 5) ?? []
  return <div className="h-full min-w-0 overflow-y-auto bg-background"><div className="w-full space-y-6 px-5 py-5 sm:px-6 xl:px-8">
    <BusinessPageHero className="[&_header]:flex-wrap" title={<span className="flex flex-wrap items-center gap-2">{model?.name ?? "거래처 360"}{model && model.role.split("·").map(label => <Badge key={label} variant="outline" className="border-white/40 text-white text-xs">{label}</Badge>)}</span>} description="거래처의 관련 거래, 통화별 잔액과 문서 현황을 확인합니다."
      actions={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={onSettlement}>정산으로 돌아가기</Button><Button disabled={!model} onClick={() => document.getElementById("counterparty-deals")?.scrollIntoView({ behavior: "smooth" })}>관련 거래 보기</Button></div>} />
    {state === "loading" ? <p role="status">거래처 정보를 불러오는 중입니다.</p> : state === "error" ? <div role="alert" className={sectionClass}><p>거래처 정보를 불러오지 못했습니다.</p><Button className="mt-3" variant="outline" onClick={() => setAttempt(value => value + 1)}>다시 시도</Button></div> : !model ? <p>거래처를 찾을 수 없습니다. 거래처 이름과 접근 권한을 확인하세요.</p> : <>
      <p className="text-sm text-muted-foreground">기준 시각 {model.asOf}</p>
      {model.mergedFrom && <p role="status" className="rounded-md border bg-muted/30 p-3 text-sm">‘{model.mergedFrom}’은 ‘{model.name}’으로 합쳐졌습니다.</p>}
      {role === "member" && <p className="text-sm text-muted-foreground">금액·일정은 담당하거나 공유받은 거래 범위에서 확인합니다.</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="통화별 거래처 요약">
        {([['receivable', '받을 돈'], ['payable', '지급할 돈'], ['overdue', '연체'], ['trust', '결제 신뢰']] as const).map(([key, label]) => <section key={key} className={sectionClass} aria-label={label}>
          <h2 className="text-sm text-muted-foreground">{label}</h2><div className="mt-3 space-y-2">
            {(expanded ? model.currencies : model.currencies.slice(0, 3)).map(row => <p className="flex flex-wrap justify-between gap-2 text-sm tabular-nums" key={row.currency}><span className="text-muted-foreground">{row.currency}</span><strong className="font-medium">{role === "member" && key !== "trust" ? "확인 필요" : row[key]}</strong></p>)}
          </div>{model.currencies.length > 3 && <Button size="sm" variant="ghost" className="mt-2 h-auto p-0 text-xs" onClick={() => setExpanded(value => !value)}>{expanded ? "접기" : `외 ${model.currencies.length - 3}개 통화`}</Button>}
        </section>)}
      </div>
      <Tabs defaultValue="ops" key={id}><TabsList aria-label="거래처 보기"><TabsTrigger value="ops">운영</TabsTrigger><TabsTrigger value="analytics">분석</TabsTrigger></TabsList>
        <TabsContent value="analytics" className="mt-5"><div className={sectionClass}><h2 className="font-semibold">분석 준비 중</h2><p className="mt-2 text-sm text-muted-foreground">거래처 분석은 준비 중입니다. 현재 거래와 잔액은 운영 탭에서 확인하세요.</p></div></TabsContent>
        <TabsContent value="ops" className="mt-5 space-y-5">
          <section id="counterparty-deals" aria-label="관련 거래" className={sectionClass}>
            <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">관련 거래</h2>{model.partial && <Badge className="border-0 bg-amber-100 text-amber-900">부분 결과</Badge>}</div>
            {model.partial && <p className="mt-2 text-xs text-muted-foreground">일부 상세를 불러오지 못했습니다. 아래 목록이 전체 결과는 아닙니다.</p>}
            <div className="mt-3 divide-y">{shownDeals.map(deal => {
              const quantity = orderProgress(deal.id)
              return <button key={deal.id} className="flex w-full flex-wrap items-start justify-between gap-3 py-4 text-left" onClick={() => onDeal(deal.id)}><span className="min-w-0 flex-1"><strong className="block break-words text-sm font-medium">{deal.title}</strong><span className="mt-1 block text-xs text-muted-foreground">{deal.id}</span><span className="mt-1 block text-xs text-muted-foreground">{quantity ? `선적 ${quantity.shipped}/${quantity.contracted} ${quantity.unit}` : "수량 근거 확인 필요"} · ETA {deal.eta}</span></span><Badge variant="secondary">{stages[deal.stage]}</Badge></button>
            })}</div>
            <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground"><span>총 {model.deals.length}건{model.partial ? " · 조회된 범위" : ""}</span><div className="flex items-center gap-2"><Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(value => value - 1)}>이전</Button><span>{page} / {Math.max(1, Math.ceil(model.deals.length / 5))}</span><Button variant="ghost" size="sm" disabled={page * 5 >= model.deals.length} onClick={() => setPage(value => value + 1)}>다음</Button></div></div>
          </section>
          <section className={sectionClass} aria-label="미결제 일정"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">미결제 일정</h2><label className="flex items-center gap-2 text-xs">통화<select className="h-8 rounded-md border bg-background px-2" value={currency} onChange={event => setCurrency(event.target.value)}><option value="all">전체 통화</option>{model.currencies.map(row => <option key={row.currency}>{row.currency}</option>)}</select></label></div>
            {role === "member" ? <p className="py-4 text-sm text-muted-foreground">조회 가능한 결제 일정의 근거를 확인해 주세요.</p> : <Table><TableHeader><TableRow><TableHead>거래번호</TableHead><TableHead>구분</TableHead><TableHead>예정일</TableHead><TableHead>미결제 금액</TableHead><TableHead>상태</TableHead></TableRow></TableHeader><TableBody>{model.schedules.filter(row => currency === "all" || row.currency === currency).map(row => <TableRow key={row.id}><TableCell><button className="text-primary" onClick={() => onDeal(row.dealId)}>{row.dealId}</button></TableCell><TableCell>{row.direction}</TableCell><TableCell>{row.due}</TableCell><TableCell>{row.amount} {row.currency}</TableCell><TableCell>{row.overdue ? "연체" : "예정"}</TableCell></TableRow>)}{!model.schedules.some(row => currency === "all" || row.currency === currency) && <TableRow><TableCell colSpan={5}>조회된 미결제 일정이 없습니다.</TableCell></TableRow>}</TableBody></Table>}
          </section>
          <div className="grid gap-5 lg:grid-cols-2"><section className={sectionClass} aria-label="필요 서류"><h2 className="font-semibold">필요 서류</h2><div className="mt-3 divide-y">{model.deals.filter(deal => (deal.nextDocument?.kind === "upload")).map(deal => <button className="block w-full py-3 text-left text-sm" key={deal.id} onClick={() => onDeal(deal.id)}><span>{deal.id} · 필요 서류</span><span className="mt-1 block text-xs text-muted-foreground">{deal.nextDocument?.label ?? "필수 서류 확인"}</span></button>)}{!model.deals.some(deal => (deal.nextDocument?.kind === "upload")) && <p className="py-4 text-sm text-muted-foreground">조회된 거래에 필요한 서류가 모두 있습니다.</p>}</div></section>
          <section className={sectionClass} aria-label="최근 서류"><h2 className="font-semibold">최근 서류</h2><div className="mt-3 divide-y">{model.deals.flatMap(deal => listDealDocuments(deal.id).map(doc => ({ ...doc, linkedDealId: deal.id }))).slice(0, 5).map(doc => <button className="block w-full py-3 text-left text-sm" key={doc.id} onClick={() => onDeal(doc.linkedDealId)}><span>{doc.type} · {doc.file}</span><span className="mt-1 block text-xs text-muted-foreground">{doc.linkedDealId} · 거래에서 문서 확인</span></button>)}</div></section></div>
        </TabsContent>
      </Tabs>
    </>}
  </div></div>
}

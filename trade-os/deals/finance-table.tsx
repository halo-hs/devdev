import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@ecoya/design-system/ui/empty"
import { Button } from "@shared/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"
import { presentFinanceFact } from "@trade-os/lib/erp-finance"
import {
  filteredFinanceFacts,
  type FinanceFilters,
} from "@trade-os/lib/deal-finance-workspace"
import { prototypeBackend } from "@trade-os/lib/prototype-backend"
import type { Deal } from "@trade-os/lib/prototype-deals"

export function DealsFinanceTable({
  deals,
  filters,
  hasRecords = true,
  onOpenDeal,
}: {
  deals: Deal[]
  filters: FinanceFilters
  hasRecords?: boolean
  onOpenDeal: (id: string) => void
}) {
  return (
    <Table aria-label="거래 재무 보기" className="min-w-[1500px]">
      <TableHeader>
        <TableRow>
          {[
            "거래 / 거래처",
            "통화",
            "확정 매출송장",
            "확정 매입송장",
            "송장 기준 Trade Result",
            "가산 원가 / 비용 반영 손익",
            "적용 입출금",
            "현재 잔액",
            "상세",
          ].map((label) => (
            <TableHead key={label}>{label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {deals.flatMap((deal) => {
          const facts = filteredFinanceFacts(deal.id, deal.currency, filters)
          return facts.map((fact) => {
            const p = presentFinanceFact(fact)
            return (
              <TableRow key={`${deal.id}-${fact.currency}`}>
                <TableCell className="max-w-64 whitespace-normal">
                  <Button
                    variant="link"
                    className="h-auto p-0"
                    onClick={() => onOpenDeal(deal.id)}
                  >
                    {prototypeBackend.deals.getDisplayId(deal.id)}
                  </Button>
                  <span className="mt-1 block text-xs">
                    {deal.counterparty}
                  </span>
                  <small className="text-muted-foreground">
                    {deal.primaryItem}
                  </small>
                </TableCell>
                <TableCell>{fact.currency}</TableCell>
                <TableCell className="tabular-nums">{p.invoiceSales}</TableCell>
                <TableCell className="tabular-nums">
                  {p.invoicePurchases}
                </TableCell>
                <TableCell className="tabular-nums">
                  {p.tradeResult}
                  {p.tradeResult === "—" && (
                    <small className="mt-1 block text-muted-foreground">
                      송장 근거 확인 필요
                    </small>
                  )}
                </TableCell>
                <TableCell className="tabular-nums">
                  <span className="block">가산 {p.costs}</span>
                  <strong className="mt-1 block">
                    손익 {p.adjustedResult}
                  </strong>
                </TableCell>
                <TableCell className="tabular-nums">
                  <span className="block">받은 돈 {p.received}</span>
                  <span className="mt-1 block">지급한 돈 {p.paid}</span>
                </TableCell>
                <TableCell className="tabular-nums">
                  <span className="block">받을 돈 {p.receivable}</span>
                  <span className="mt-1 block">줄 돈 {p.payable}</span>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenDeal(deal.id)}
                  >
                    거래 금융
                  </Button>
                </TableCell>
              </TableRow>
            )
          })
        })}
        {!deals.length && (
          <TableRow>
            <TableCell colSpan={9} className="whitespace-normal p-0">
              <Empty className="min-h-40">
                <EmptyHeader>
                  <EmptyTitle>{hasRecords ? "조건에 맞는 거래가 없습니다." : "등록된 거래가 없습니다."}</EmptyTitle>
                  <EmptyDescription>
                    {hasRecords ? "검색어 또는 필터를 변경해 주세요." : "거래를 등록하면 통화별 금액과 정산 현황을 확인할 수 있습니다."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

import { useState } from "react"
import { ArrowRight, Download } from "lucide-react"
import { Badge } from "@shared/components/ui/badge"
import { Button } from "@shared/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog"
import { Input } from "@shared/components/ui/input"
import { Textarea } from "@shared/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"
import { erpHandoffCopy as copy } from "@trade-os/lib/erp-handoff-copy"
import {
  settlementSampleStates,
  monitoringSamples,
  claimSamples,
  type ShipmentReviewSample,
  type SampleTone,
} from "@trade-os/lib/erp-menu-samples"
import type { ErpMenuTarget } from "@trade-os/erp-menu-prototypes"

type Navigate = (target: ErpMenuTarget, options?: { dealId?: string }) => void
export type ConfirmedShipmentDates = Record<
  string,
  { etd: string; eta: string; reason: string; confirmedAt: string }
>
type Shipment = {
  bl: string
  deal: string
  dealName: string
  etd: string
  eta: string
  documents: string
  status: string
  reviewDocument?: ShipmentReviewSample
}

const sampleToneClasses: Record<SampleTone, string> = {
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-primary/10 text-primary",
  neutral: "bg-muted text-muted-foreground",
}
function SampleStatus({
  children,
  tone,
}: {
  children: React.ReactNode
  tone: SampleTone
}) {
  return (
    <Badge variant="secondary" className={sampleToneClasses[tone]}>
      {children}
    </Badge>
  )
}

export function ShipmentReviewContent({
  rows,
  confirmedDates,
  onConfirm,
  onNavigate,
}: {
  rows: Shipment[]
  confirmedDates: ConfirmedShipmentDates
  onConfirm: (bl: string, dates: ConfirmedShipmentDates[string]) => void
  onNavigate: Navigate
}) {
  const [selected, setSelected] = useState<Shipment | null>(null)
  const [etd, setEtd] = useState("")
  const [eta, setEta] = useState("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("전체")
  const review = copy.shipments.review
  const reviewRows = rows.filter((row) => row.reviewDocument)
  const status = (row: Shipment): { label: string; tone: SampleTone } => {
    if (confirmedDates[row.bl] || row.reviewDocument?.code === "current")
      return { label: "반영 완료", tone: "green" }
    if (row.reviewDocument?.code === "awaiting_projection")
      return { label: "반영 대기", tone: "blue" }
    return {
      label: "확인 필요",
      tone: row.reviewDocument?.code === "invalid_dates" ? "amber" : "red",
    }
  }
  const visibleRows = reviewRows.filter(
    (row) => filter === "전체" || status(row).label === filter
  )
  const selectedCode = selected?.reviewDocument?.code
  const completed = !!selected && status(selected).label === "반영 완료"
  const actionable =
    !completed &&
    (selectedCode === "invalid_dates" || selectedCode === "awaiting_projection")
  const normalizeDate = (date: string) =>
    date.length === 5
      ? `2026-${date.replace(".", "-")}`
      : date.replaceAll(".", "-")
  return (
    <>
      <Card className="mb-5" aria-label={review.title}>
        <CardHeader>
          <CardTitle>
            {review.title} · {reviewRows.length}건
          </CardTitle>
          <CardDescription>
            로컬 샘플 10건 · 날짜 오류, 반영 대기, 연결 충돌과 완료 이력을
            확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="문서 검토 상태"
          >
            {["전체", "반영 대기", "확인 필요", "반영 완료"].map((value) => (
              <Button
                key={value}
                size="sm"
                variant={filter === value ? "secondary" : "ghost"}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {value}{" "}
                {
                  reviewRows.filter(
                    (row) => value === "전체" || status(row).label === value
                  ).length
                }
              </Button>
            ))}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>문서 · 연결 거래</TableHead>
                <TableHead>검토 사유</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>처리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((row) => (
                <TableRow key={row.bl}>
                  <TableCell>
                    <p className="font-medium">
                      {row.reviewDocument?.filename}
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => onNavigate("deal", { dealId: row.deal })}
                    >
                      {row.dealName}
                      <ArrowRight />
                    </Button>
                  </TableCell>
                  <TableCell>
                    {confirmedDates[row.bl]?.reason ??
                      row.reviewDocument?.reason}
                  </TableCell>
                  <TableCell>
                    <SampleStatus tone={status(row).tone}>
                      {status(row).label}
                    </SampleStatus>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelected(row)
                        setEtd(confirmedDates[row.bl]?.etd ?? "")
                        setEta(confirmedDates[row.bl]?.eta ?? "")
                        setReason("")
                        setError("")
                      }}
                    >
                      {status(row).label === "반영 완료"
                        ? "처리 이력"
                        : row.reviewDocument?.code === "invalid_dates"
                          ? "운영 날짜 검토"
                          : row.reviewDocument?.code === "awaiting_projection"
                            ? "다시 반영"
                            : "연결 검토"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!visibleRows.length && (
            <p role="status" className="text-sm text-muted-foreground">
              해당 상태의 문서가 없습니다.
            </p>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {completed
                ? "선적 반영 이력"
                : selectedCode === "invalid_dates"
                  ? "운영 날짜 확인·반영"
                  : selectedCode === "awaiting_projection"
                    ? "검토한 정보 다시 반영"
                    : "문서·거래 연결 검토"}
            </DialogTitle>
            <DialogDescription>
              {selected?.reviewDocument?.filename} · 로컬 샘플
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm">{selected?.reviewDocument?.reason}</p>
          <p className="text-sm">
            원문 날짜: ETD {selected?.reviewDocument?.sourceEtd} · ETA{" "}
            {selected?.reviewDocument?.sourceEta}
          </p>
          <p className="text-sm">
            운영 날짜: ETD{" "}
            {selected && (confirmedDates[selected.bl]?.etd ?? selected.etd)} ·
            ETA {selected && (confirmedDates[selected.bl]?.eta ?? selected.eta)}
          </p>
          {actionable ? (
            <>
              {selectedCode === "invalid_dates" && (
                <>
                  <label className="grid gap-2 text-sm">
                    확인 ETD
                    <Input
                      type="date"
                      value={etd}
                      onChange={(event) => setEtd(event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-sm">
                    확인 ETA
                    <Input
                      type="date"
                      value={eta}
                      onChange={(event) => setEta(event.target.value)}
                    />
                  </label>
                </>
              )}
              <label className="grid gap-2 text-sm">
                처리 사유 및 확인 근거
                <Textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={500}
                />
              </label>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {completed
                ? "반영이 완료된 문서입니다."
                : "거래에서 원문과 연결 정보를 확인하세요. 연결 충돌은 날짜 수정으로 해결할 수 없습니다."}
            </p>
          )}
          {selected && confirmedDates[selected.bl] && (
            <p className="text-xs text-muted-foreground">
              {new Date(confirmedDates[selected.bl].confirmedAt).toLocaleString(
                "ko-KR"
              )}{" "}
              · {confirmedDates[selected.bl].reason}
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              {actionable ? "취소" : "닫기"}
            </Button>
            {actionable ? (
              <Button
                onClick={() => {
                  if (!selected) return
                  const invalid = selected.reviewDocument?.invalidField
                  if (
                    !reason.trim() ||
                    (invalid === "eta" && !eta) ||
                    (invalid === "etd" && !etd)
                  ) {
                    setError(
                      "오류가 있는 날짜의 확인값과 처리 사유를 입력하세요."
                    )
                    return
                  }
                  const nextEtd =
                    selectedCode === "awaiting_projection"
                      ? selected.reviewDocument!.sourceEtd
                      : etd || normalizeDate(selected.etd)
                  const nextEta =
                    selectedCode === "awaiting_projection"
                      ? selected.reviewDocument!.sourceEta
                      : eta || normalizeDate(selected.eta)
                  if (nextEta < nextEtd) {
                    setError("ETA는 ETD와 같거나 이후여야 합니다.")
                    return
                  }
                  onConfirm(selected.bl, {
                    etd: nextEtd,
                    eta: nextEta,
                    reason: reason.trim(),
                    confirmedAt: new Date().toISOString(),
                  })
                  setSelected(null)
                }}
              >
                {selectedCode === "invalid_dates"
                  ? "확인한 날짜 반영"
                  : "검토한 정보 반영"}
              </Button>
            ) : (
              !completed && (
                <Button
                  onClick={() =>
                    selected && onNavigate("deal", { dealId: selected.deal })
                  }
                >
                  연결 거래 보기
                  <ArrowRight />
                </Button>
              )
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

type LedgerRow = {
  id: string
  type: string
  amount: string
  paid: string
  balance: string
  party: string
  deal: string
  due: string
  status: string
}
export function SettlementVerificationContent({ rows }: { rows: LedgerRow[] }) {
  const groups = new Map<
    string,
    {
      party: string
      currency: string
      receivable: number
      payable: number
      rows: LedgerRow[]
    }
  >()
  for (const row of rows) {
    const [value, currency] = row.balance.split(" ")
    const key = `${row.party}:${currency}`
    const group = groups.get(key) ?? {
      party: row.party,
      currency,
      receivable: 0,
      payable: 0,
      rows: [],
    }
    group[row.type === "AR" ? "receivable" : "payable"] += Number(
      value.replaceAll(",", "")
    )
    group.rows.push(row)
    groups.set(key, group)
  }
  const money = (value: number) =>
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  return (
    <Card className="mb-5" aria-label="거래처별 잔액과 검증 상태">
      <CardHeader>
        <CardTitle>거래처별 잔액과 검증 상태</CardTitle>
        <CardDescription>
          등록된 원장 기준 · 거래처와 통화별 받을 돈·줄 돈을 확인합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>거래처</TableHead>
              <TableHead>통화</TableHead>
              <TableHead className="text-right">받을 돈</TableHead>
              <TableHead className="text-right">줄 돈</TableHead>
              <TableHead>검증 상태</TableHead>
              <TableHead>정산 내역</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...groups.values()].map((group) => (
              <TableRow key={`${group.party}:${group.currency}`}>
                <TableCell className="font-medium">{group.party}</TableCell>
                <TableCell>{group.currency}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {money(group.receivable)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {money(group.payable)}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {group.rows.map((row) => {
                      const state = settlementSampleStates[row.id]
                      return (
                        <div key={row.id}>
                          <SampleStatus tone={state?.tone ?? "amber"}>
                            {state?.label ?? "검토 필요"}
                          </SampleStatus>
                          <p className="mt-1 max-w-64 text-xs text-muted-foreground">
                            {state?.detail}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={`${group.party} ${group.currency} 정산 내역 보기`}
                      >
                        내역 보기 ({group.rows.length})
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl">
                      <DialogHeader>
                        <DialogTitle>{group.party} 정산 내역</DialogTitle>
                        <DialogDescription>
                          {group.currency} · {group.rows.length}건의 금액과 처리
                          상태를 확인합니다.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-3">
                        {group.rows.map((row) => {
                          const verification = settlementSampleStates[row.id]
                          return (
                            <section
                              key={row.id}
                              aria-label={row.id}
                              className="min-w-0 rounded-md border p-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-semibold">
                                    {row.type === "AR" ? "받을 돈" : "보낼 돈"}
                                  </h3>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {row.id}
                                  </p>
                                </div>
                                <Badge variant="outline">{row.status}</Badge>
                              </div>
                              <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                                {[
                                  ["총 금액", row.amount],
                                  ["처리 금액", row.paid],
                                  ["잔액", row.balance],
                                ].map(([label, value]) => (
                                  <div key={label} className="min-w-0">
                                    <dt className="text-xs text-muted-foreground">
                                      {label}
                                    </dt>
                                    <dd className="mt-1 font-medium tabular-nums">
                                      {value}
                                    </dd>
                                  </div>
                                ))}
                              </dl>
                              <div className="mt-4 border-t pt-3 text-sm">
                                <p className="text-muted-foreground">
                                  만기 {row.due} · 거래 {row.deal}
                                </p>
                                <div className="mt-3">
                                  <SampleStatus
                                    tone={verification?.tone ?? "amber"}
                                  >
                                    {verification?.label ?? "검토 필요"}
                                  </SampleStatus>
                                </div>
                                {verification?.detail && (
                                  <p className="mt-2 text-sm text-muted-foreground">
                                    {verification.detail}
                                  </p>
                                )}
                              </div>
                            </section>
                          )
                        })}
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">닫기</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground">
          로컬 샘플 10건 · 검증·부분 대사·통화 불일치·미배분·초과 입금 등의 상태
          예시입니다.
        </p>
        <details className="text-sm">
          <summary className="cursor-pointer font-medium">
            정산 전 확인할 일
          </summary>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <p>{copy.settlement.currentMoney.review.missing}</p>
            <p>{copy.settlement.financialCompletion.scope}</p>
          </div>
        </details>
      </CardContent>
    </Card>
  )
}

export function MonitoringOperationsContent({
  onNavigate,
}: {
  onNavigate: Navigate
}) {
  const groups = [
    {
      title: "서류 갭 · ETA 임박",
      description:
        "로컬 샘플 · 도착 전 필요한 서류가 없거나 연결되지 않은 항목입니다.",
      rows: monitoringSamples.filter((row) => row.category === "gap"),
    },
    {
      title: "미선적 잔량",
      description: "계약 수량·누적 선적·남은 수량을 비교합니다.",
      rows: monitoringSamples.filter((row) => row.category === "remaining"),
    },
    {
      title: "수량 불일치",
      description: "중량·청구 수량·단위 환산의 차이를 확인합니다.",
      rows: monitoringSamples.filter((row) => row.category === "quantity"),
    },
  ]
  return (
    <div className="mb-5 grid gap-4 xl:grid-cols-3">
      {groups.map((group) => (
        <Card key={group.title} aria-label={group.title}>
          <CardHeader>
            <CardTitle>
              {group.title}{" "}
              <span className="ml-1 text-muted-foreground">
                {group.rows.length}건
              </span>
            </CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.rows.map((row) => (
              <div key={row.id} className="border-b pb-3 last:border-0">
                <Button
                  className="h-auto text-left whitespace-normal"
                  size="sm"
                  variant="link"
                  onClick={() => onNavigate("deal", { dealId: row.dealId })}
                >
                  {row.label}
                  <ArrowRight />
                </Button>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {row.detail}
                </p>
                <div className="mt-2">
                  <SampleStatus tone={row.tone}>{row.status}</SampleStatus>
                </div>
              </div>
            ))}
            {!group.rows.length && (
              <p className="text-sm text-muted-foreground">
                현재 해당하는 항목이 없습니다.
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ReportEvidenceContent({
  kind,
  criteria,
  snapshot,
  onNavigate,
}: {
  kind: "reports" | "sales"
  criteria: Record<string, string | number>
  snapshot: unknown
  onNavigate: Navigate
}) {
  const ownerNames: Record<string, string> = {
    minyoung: "조민영",
    minji: "김민지",
    seojun: "박서준",
  }
  const selectedOwner = ownerNames[String(criteria.owner)] ?? criteria.owner
  const claims = claimSamples.filter(
    (row) =>
      (!criteria.currency || row.currency === criteria.currency) &&
      (!criteria.owner ||
        criteria.owner === "all" ||
        row.owner === selectedOwner)
  )
  return (
    <div className="mb-5 space-y-4">
      <details
        className="rounded-md border px-4 py-3 text-sm"
        aria-label="집계 근거 보기"
      >
        <summary className="cursor-pointer font-medium">집계 근거 보기</summary>
        <div className="mt-3 space-y-3 text-muted-foreground">
          <p>
            {kind === "sales"
              ? "GP는 같은 통화의 매출에서 매입·부대비용을 뺀 값이며, 담당자는 딜 담당자 기준입니다."
              : "수취·지급 예정은 만기일, 실제 입출금은 입출금일을 기준으로 집계합니다."}
          </p>
          <p>
            조회 조건:{" "}
            {Object.values(criteria)
              .map((value) =>
                value === "all"
                  ? "전체 담당자"
                  : (ownerNames[String(value)] ?? value)
              )
              .join(" · ")}
          </p>
          <p>
            로컬 예시 데이터입니다. 집계에 사용한 원천 문서의 검증 상태는
            연결되지 않았습니다.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob(
                  [
                    JSON.stringify(
                      {
                        mode: "local-preview",
                        kind,
                        exportedAt: new Date().toISOString(),
                        criteria,
                        provenance: "unavailable",
                        data:
                          kind === "reports"
                            ? { report: snapshot, claims }
                            : snapshot,
                      },
                      null,
                      2
                    ),
                  ],
                  { type: "application/json" }
                )
              )
              const link = document.createElement("a")
              link.href = url
              link.download = `${kind}-snapshot.json`
              link.click()
              setTimeout(() => URL.revokeObjectURL(url), 1000)
            }}
          >
            <Download />
            조회 데이터 내려받기
          </Button>
        </div>
      </details>
      {kind === "reports" && (
        <Card aria-label="청구서와 정산 일정 연결 현황">
          <CardHeader>
            <CardTitle>청구서와 정산 일정 연결 현황</CardTitle>
            <CardDescription>
              확정 청구서(CI)에 수취·지급 일정이 연결됐는지 확인합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              로컬 샘플 · {claims.length}건 · 연결 완료, 미연결, 원문 개정, 기한
              미정 등의 사례입니다.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>청구서 · 거래처</TableHead>
                  <TableHead>방향</TableHead>
                  <TableHead className="text-right">원문 금액</TableHead>
                  <TableHead>지급기한</TableHead>
                  <TableHead>연결 일정</TableHead>
                  <TableHead>연결 상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <p className="font-medium">{row.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.party}
                      </p>
                    </TableCell>
                    <TableCell>{row.direction}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.amount === null
                        ? "미확인"
                        : `${row.amount.toLocaleString("en-US")} ${row.currency}`}
                    </TableCell>
                    <TableCell>{row.due}</TableCell>
                    <TableCell>{row.schedule}</TableCell>
                    <TableCell>
                      <SampleStatus tone={row.tone}>{row.status}</SampleStatus>
                    </TableCell>
                  </TableRow>
                ))}
                {!claims.length && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-6 text-center text-muted-foreground"
                    >
                      선택한 통화·담당자에 해당하는 샘플이 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate("settlement")}
            >
              정산에서 일정 확인
              <ArrowRight />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

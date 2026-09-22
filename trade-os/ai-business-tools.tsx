import { useState } from "react"
import { ArrowRight, Download, RefreshCw, Search } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@shared/components/ui/badge"
import { Button } from "@shared/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/components/ui/card"
import { Input } from "@shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"
import { Textarea } from "@shared/components/ui/textarea"
import { aiHandoffCopy } from "@trade-os/lib/ai-handoff-copy"
import { deals } from "@trade-os/lib/prototype-deals"
import type { ErpMenuTarget } from "@trade-os/erp-menu-prototypes"

const copy = aiHandoffCopy.business

type Shipment = {
  deal: string
  dealName: string
  bl: string
  container: string
  etd: string
  eta: string
  status: string
  documents: string
}
type SourceFile = { id: string; name: string; reference: string; type: string }
type Navigate = (
  screen: ErpMenuTarget,
  options?: { dealId?: string; documentName?: string }
) => void
const queryKinds = {
  deals: copy.deals,
  arrivals: copy.arrivals,
  departures: copy.expansion.departures,
  facts: copy.expansion.facts,
  body: copy.bodyRetrieval.title,
  work: copy.workStatus.title,
  money: copy.expansion.money,
} as const
type QueryKind = keyof typeof queryKinds
type Query = { kind: QueryKind; term: string; from: string; to: string }
type ResultRow = {
  id: string
  title: string
  detail: string
  status: string
  dealId?: string
  documentName?: string
}
type Snapshot = { id: string; asOf: string; criteria: Query; rows: ResultRow[] }

function downloadSnapshot(snapshot: Snapshot) {
  const url = URL.createObjectURL(
    new Blob(
      [JSON.stringify({ mode: "local-preview", ...snapshot }, null, 2)],
      { type: "application/json" }
    )
  )
  const link = document.createElement("a")
  link.href = url
  link.download = `ai-query-${snapshot.id}.json`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function AiBusinessTools({
  shipments,
  files,
  onNavigate,
}: {
  shipments: Shipment[]
  files: SourceFile[]
  onNavigate: Navigate
}) {
  const [kind, setKind] = useState<QueryKind>("deals")
  const [term, setTerm] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [result, setResult] = useState<Snapshot | null>(null)
  const [saved, setSaved] = useState<Snapshot[]>([])
  const [historical, setHistorical] = useState(false)
  const [error, setError] = useState("")
  const [documentId, setDocumentId] = useState(files[0]?.id ?? "")
  const [body, setBody] = useState("")
  const [transcripts, setTranscripts] = useState<Record<string, string>>({})
  const isSchedule = kind === "arrivals" || kind === "departures"
  const criteria: Query = {
    kind,
    term,
    from: isSchedule ? from : "",
    to: isSchedule ? to : "",
  }

  function query(input: Query): Snapshot {
    const matches = (value: string) =>
      value.toLocaleLowerCase().includes(input.term.trim().toLocaleLowerCase())
    let rows: ResultRow[] = []
    if (input.kind === "arrivals" || input.kind === "departures") {
      rows = shipments
        .filter((shipment) => {
          // This prototype's shipment fixture is explicitly the 2026 schedule.
          const date = `2026-${(input.kind === "arrivals" ? shipment.eta : shipment.etd).replace(".", "-")}`
          const party =
            deals.find((deal) => deal.id === shipment.deal)?.counterparty ?? ""
          return (
            matches(
              `${shipment.deal} ${shipment.dealName} ${shipment.bl} ${shipment.container} ${party}`
            ) &&
            (!input.from || date >= input.from) &&
            (!input.to || date <= input.to)
          )
        })
        .map((shipment) => ({
          id: shipment.bl,
          title: shipment.dealName,
          detail: `${shipment.bl} · ${shipment.container} · ETD 2026.${shipment.etd} · ETA 2026.${shipment.eta}`,
          status: shipment.status,
          dealId: shipment.deal,
        }))
    } else if (input.kind === "deals" || input.kind === "work") {
      rows = deals
        .filter((deal) =>
          matches(`${deal.id} ${deal.title} ${deal.counterparty}`)
        )
        .map((deal) => ({
          id: deal.id,
          title: deal.title,
          dealId: deal.id,
          detail:
            input.kind === "work"
              ? `${deal.confirmed}건 확인 · ${deal.pending}건 대기 · ${deal.nextAction}`
              : `${deal.id} · ${deal.counterparty} · 담당 ${deal.assignee}`,
          status:
            input.kind === "work"
              ? deal.pending
                ? "현재 조치 필요"
                : "원본 업무 확인"
              : "등록일 미확인",
        }))
    } else if (input.kind === "facts") {
      rows = files
        .filter((file) =>
          matches(`${file.name} ${file.reference} ${file.type}`)
        )
        .map((file) => ({
          id: file.id,
          title: file.name,
          detail: `${file.type} · ${file.reference}`,
          status: "확정 필드 미연결",
          documentName: file.name,
        }))
    } else if (input.kind === "body") {
      rows = files.flatMap((file) =>
        (transcripts[file.id] ?? "")
          .split(/^---PAGE---$/m)
          .flatMap((page, index) => {
            if (!page.trim() || !matches(page)) return []
            return [
              {
                id: `${file.id}-${index}`,
                title: `${file.name} · ${index + 1}페이지`,
                detail: page.trim(),
                status: "사용자 전사 · 미검증",
                documentName: file.name,
              },
            ]
          })
      )
    }
    return {
      id: crypto.randomUUID(),
      asOf: new Date().toISOString(),
      criteria: { ...input },
      rows,
    }
  }

  function run(input = criteria, save = false) {
    if (input.from && input.to && input.from > input.to) {
      setError("종료일은 시작일과 같거나 이후여야 합니다.")
      return
    }
    if (input.kind === "money") {
      onNavigate("settlement")
      return
    }
    const snapshot = query(input)
    setResult(snapshot)
    setHistorical(false)
    setError("")
    if (save) {
      setSaved((current) => [snapshot, ...current].slice(0, 50))
      toast.success("이 화면에 조회 답변을 저장했습니다.")
    }
  }

  function quickSchedule(nextKind: "arrivals" | "departures") {
    const start = new Date()
    start.setHours(12, 0, 0, 0)
    if (nextKind === "arrivals") start.setDate(start.getDate() + 2)
    else start.setDate(start.getDate() + (8 - (start.getDay() || 7)))
    const end = new Date(start)
    if (nextKind === "departures") end.setDate(end.getDate() + 6)
    const day = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    setKind(nextKind)
    setFrom(day(start))
    setTo(day(end))
    run({ kind: nextKind, term, from: day(start), to: day(end) })
  }

  return (
    <div
      className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6"
      data-slot="ai-business-tools"
    >
      <div>
        <h2 className="text-lg font-semibold">
          {aiHandoffCopy.workspace.tools}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {aiHandoffCopy.workspace.toolsHint}
        </p>
        <Badge variant="secondary" className="mt-3">
          로컬 예시 데이터
        </Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{copy.controls}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              run()
            }}
            className="space-y-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                {copy.kind}
                <Select
                  value={kind}
                  onValueChange={(value) => setKind(value as QueryKind)}
                >
                  <SelectTrigger className="w-full" aria-label={copy.kind}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(queryKinds).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              {kind !== "money" && (
                <label className="grid gap-2 text-sm">
                  {kind === "body" ? "찾을 문구" : "거래처·거래·문서 검색"}
                  <Input
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    placeholder={
                      kind === "body"
                        ? "보관된 본문에서 정확한 문구 검색"
                        : "거래처 등록명, 거래번호 또는 문서번호"
                    }
                  />
                </label>
              )}
            </div>
            {isSchedule && (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  {copy.from}
                  <Input
                    type="date"
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  {copy.to}
                  <Input
                    type="date"
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                  />
                </label>
              </div>
            )}
            <p className="text-xs leading-5 text-muted-foreground">
              {kind === "arrivals"
                ? copy.arrivalScope
                : kind === "departures"
                  ? copy.expansion.departureScope
                  : kind === "facts"
                    ? "현재 예시 문서의 이름·유형·거래 연결을 검색합니다. 확정 추출 필드는 아직 연결되지 않았습니다."
                    : kind === "body"
                      ? copy.bodyRetrieval.manualNotice
                      : kind === "work"
                        ? copy.workStatus.basis
                        : kind === "money"
                          ? "받을 돈과 지급할 돈은 정산 화면에서 통화별로 확인합니다. 확인되지 않은 근거는 공식 잔액으로 계산하지 않습니다."
                          : "현재 등록된 예시 거래를 검색합니다. 등록일 정보가 없어 기간별 등록 건수와 매출 합계는 계산하지 않습니다."}
            </p>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="submit">
                <Search />
                {kind === "money" ? "정산에서 확인" : copy.submit}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => quickSchedule("arrivals")}
              >
                {copy.expansion.arrivalQuick}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => quickSchedule("departures")}
              >
                {copy.expansion.departureQuick}
              </Button>
            </div>
          </form>
          {kind === "body" && (
            <details className="rounded-md border p-3 text-sm">
              <summary className="cursor-pointer font-medium">
                {copy.bodyRetrieval.capture}
              </summary>
              <div className="mt-3 space-y-3">
                <label className="grid gap-2">
                  {copy.bodyRetrieval.select}
                  <Select
                    value={documentId}
                    onValueChange={(value) => {
                      setDocumentId(value ?? "")
                      setBody(transcripts[value ?? ""] ?? "")
                    }}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-label={copy.bodyRetrieval.select}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {files.map((file) => (
                        <SelectItem key={file.id} value={file.id}>
                          {file.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                <Textarea
                  aria-label="수동 전사 본문"
                  rows={6}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  현재 화면에서만 보관하며 화면을 나가면 초기화됩니다.{" "}
                  {copy.bodyRetrieval.manualNotice}
                </p>
                <Button
                  variant="secondary"
                  disabled={!documentId || !body.trim()}
                  onClick={() => {
                    setTranscripts((current) => ({
                      ...current,
                      [documentId]: body,
                    }))
                    toast.success("이 화면에 전사 본문을 보관했습니다.")
                  }}
                >
                  {copy.bodyRetrieval.save}
                </Button>
              </div>
            </details>
          )}
        </CardContent>
      </Card>
      {result && (
        <Card aria-label={copy.results}>
          <CardHeader>
            <CardTitle>
              {queryKinds[result.criteria.kind]} · {result.rows.length}건
            </CardTitle>
            <CardDescription>
              {historical ? copy.savedAnswers.historical : "현재 조회 결과 · "}
              {new Date(result.asOf).toLocaleString("ko-KR")}
              <br />
              검색: {result.criteria.term || "전체"}
              {result.criteria.from || result.criteria.to
                ? ` · ${result.criteria.from || "시작일 없음"} ~ ${result.criteria.to || "종료일 없음"}`
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!result.rows.length ? (
              <p className="py-5 text-sm text-muted-foreground">
                {result.criteria.kind === "body"
                  ? copy.textRetrieval.empty
                  : copy.empty}
              </p>
            ) : (
              <div className="divide-y">
                {result.rows.map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-wrap items-start gap-3 py-4 first:pt-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium break-words">
                        {row.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 break-words whitespace-pre-wrap text-muted-foreground">
                        {row.detail}
                      </p>
                      <Badge variant="secondary" className="mt-2">
                        {row.status}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        row.documentName
                          ? onNavigate("inbox", {
                              documentName: row.documentName,
                            })
                          : onNavigate("deal", { dealId: row.dealId })
                      }
                    >
                      {row.documentName ? "문서 확인" : "거래 열기"}
                      <ArrowRight />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => run(result.criteria)}
              >
                <RefreshCw />
                {copy.expansion.refresh}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => run(result.criteria, true)}
              >
                {copy.savedAnswers.save}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => downloadSnapshot(result)}
              >
                <Download />
                현재 조회본 저장 (JSON)
              </Button>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              {copy.expansion.snapshotNotice}
            </p>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>{copy.savedAnswers.title}</CardTitle>
          <CardDescription>
            이 화면에서 최근 50건을 보관합니다. 화면을 나가면 초기화됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!saved.length ? (
            <p className="text-sm text-muted-foreground">
              {copy.savedAnswers.empty}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>조회 대상</TableHead>
                  <TableHead>조회 시각</TableHead>
                  <TableHead>답변</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saved.map((snapshot) => (
                  <TableRow key={snapshot.id}>
                    <TableCell>{queryKinds[snapshot.criteria.kind]}</TableCell>
                    <TableCell>
                      {new Date(snapshot.asOf).toLocaleString("ko-KR")}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setResult(snapshot)
                          setHistorical(true)
                        }}
                      >
                        저장 답변 열기
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{copy.documentTiming.title}</CardTitle>
          <CardDescription>{copy.documentTiming.basis}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => onNavigate("deals")}>
            거래에서 문서 계획·관계 확인
            <ArrowRight />
          </Button>
          <Button variant="outline" onClick={() => onNavigate("shipments")}>
            선적 연결·일정 확인
            <ArrowRight />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

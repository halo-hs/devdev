import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  Link2,
  LoaderCircle,
  Mail,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Signature,
  Undo2,
} from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/components/ui/alert-dialog"
import { Badge } from "@shared/components/ui/badge"
import { Button } from "@shared/components/ui/button"
import { Input } from "@shared/components/ui/input"
import { SubmittedSearchInput } from "@shared/components/ui/submitted-search-input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shared/components/ui/sheet"
import { Skeleton } from "@shared/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@shared/components/ui/tabs"
import { Textarea } from "@shared/components/ui/textarea"
import type { SnapNavigationOptions } from "@snap/operations/pages"
import type { SnapScreenKey } from "@snap/screens"
import { snapApi, type SnapPage } from "@snap/lib/snap-api"
import {
  snapApiConfigured,
  snapApiErrorMessage,
  snapReportApi,
  type PreSendCheck,
  type SnapJsonRecord,
} from "@snap/lib/snap-report-api"
import { cn } from "@shared/lib/utils"

type SnapNavigate = (
  screen: SnapScreenKey,
  options?: SnapNavigationOptions
) => void

type ReportTab = "field" | "review" | "sent" | "delivery"

type ReportsData = {
  field: SnapJsonRecord[]
  review: SnapJsonRecord[]
  sent: SnapJsonRecord[]
  failures: SnapJsonRecord[]
  email: SnapJsonRecord[]
}

const DEMO_REPORTS: ReportsData = {
  field: [
    {
      id: "TASK-DEMO-001",
      title: "Busan Yard Loading Inspection",
      customer_name: "Hanbit Trading Co.",
      status: "submitted",
      media_count: 12,
      submitted_at: "2026-08-05T09:10:00+09:00",
    },
    {
      id: "TASK-DEMO-002",
      title: "Incheon Warehouse Unloading",
      customer_name: "ACME GmbH",
      status: "in_progress",
      media_count: 8,
      due_at: "2026-08-05T15:00:00+09:00",
    },
  ],
  review: [
    {
      id: "RPT-DEMO-001",
      task_id: "TASK-DEMO-001",
      title: "Busan Yard Loading Inspection",
      customer_name: "Hanbit Trading Co.",
      status: "review",
      version: 3,
      review_reason: "고객 공개 문구와 AI 요약 확인",
      updated_at: "2026-08-05T10:20:00+09:00",
    },
  ],
  sent: [
    {
      id: "LINK-DEMO-001",
      token: "hanbit-loading-report",
      report_id: "RPT-DEMO-001",
      report_title: "Busan Yard Loading Inspection",
      customer_name: "Hanbit Trading Co.",
      status: "active",
      locale: "ko",
      created_at: "2026-08-04T16:20:00+09:00",
      last_opened_at: "2026-08-05T08:40:00+09:00",
      open_count: 3,
      acknowledged: true,
      expires_at: "2026-08-11T16:20:00+09:00",
      frontend_path: "/view/hanbit-loading-report",
    },
    {
      id: "LINK-DEMO-002",
      token: "acme-unloading-report",
      report_id: "RPT-DEMO-002",
      report_title: "Incheon Warehouse Unloading",
      customer_name: "ACME GmbH",
      status: "active",
      locale: "en",
      created_at: "2026-08-05T09:20:00+09:00",
      open_count: 0,
      acknowledged: false,
      expires_at: "2026-08-12T09:20:00+09:00",
      frontend_path: "/view/acme-unloading-report",
    },
  ],
  failures: [
    {
      id: "DELIVERY-DEMO-001",
      report_title: "Gwangyang Seal Inspection",
      channel: "share_link",
      status: "failed",
      error_message: "수신자 전달 채널 확인 필요",
      created_at: "2026-08-05T10:05:00+09:00",
    },
  ],
  email: [
    {
      id: "EMAIL-DEMO-001",
      report_title: "Ulsan Loading Inspection",
      recipient: "ops@example.com",
      status: "failed",
      error_message: "수신 서버가 일시적으로 응답하지 않음",
      created_at: "2026-08-05T10:15:00+09:00",
    },
  ],
}

function useReportsResource() {
  const [data, setData] = useState<ReportsData>(DEMO_REPORTS)
  const [loading, setLoading] = useState(snapApiConfigured)
  const [error, setError] = useState("")
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    if (!snapApiConfigured) return
    let cancelled = false
    void Promise.resolve()
      .then(async () => {
        if (cancelled) return undefined
        setLoading(true)
        setError("")
        const [field, review, sent, failures] = await Promise.all([
          snapApi.tasks.list({
            needs_review: true,
            review_summary: true,
            limit: 100,
          }),
          snapApi.reports.list({ status: "review", limit: 100, offset: 0 }),
          snapApi.operations.shareLinks({ limit: 100 }),
          snapApi.operations.deliveryFailures(),
        ])
        return {
          field: pageItems(field),
          review: pageItems(review),
          sent: pageItems(sent),
          failures: pageItems(failures),
          email: [],
        } satisfies ReportsData
      })
      .then((next) => {
        if (!cancelled && next) setData(next)
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(snapApiErrorMessage(reason))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [revision])

  return {
    data: snapApiConfigured ? data : DEMO_REPORTS,
    loading: snapApiConfigured ? loading : false,
    error: snapApiConfigured ? error : "",
    reload: useCallback(() => setRevision((value) => value + 1), []),
  }
}

function pageItems(page: SnapPage | SnapJsonRecord[] | undefined) {
  if (Array.isArray(page)) return page
  return Array.isArray(page?.items) ? page.items : []
}

function textValue(record: SnapJsonRecord | null, ...keys: string[]) {
  if (!record) return ""
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" && value.trim()) return value
    if (typeof value === "number") return String(value)
  }
  return ""
}

function numberValue(record: SnapJsonRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && Number.isFinite(Number(value)))
      return Number(value)
  }
  return 0
}

function boolValue(record: SnapJsonRecord, ...keys: string[]) {
  for (const key of keys) {
    if (typeof record[key] === "boolean") return Boolean(record[key])
  }
  return false
}

function reportTitle(record: SnapJsonRecord) {
  return (
    textValue(record, "report_title", "title", "task_title", "label") ||
    "제목 없는 리포트"
  )
}

function reportId(record: SnapJsonRecord) {
  return textValue(record, "report_id", "id")
}

function taskId(record: SnapJsonRecord) {
  return textValue(record, "task_id", "id")
}

function compactDate(value: unknown) {
  if (typeof value !== "string" || !value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase()
  const tone =
    normalized.includes("fail") ||
    normalized.includes("reject") ||
    normalized.includes("revoke") ||
    normalized.includes("expire")
      ? "ui-status-danger"
      : normalized.includes("review") ||
          normalized.includes("pending") ||
          normalized.includes("draft")
        ? "ui-status-warning"
        : normalized.includes("active") ||
            normalized.includes("approve") ||
            normalized.includes("sent") ||
            normalized.includes("complete")
          ? "ui-status-success"
          : "ui-status-neutral"
  const labels: Record<string, string> = {
    review: "검토 필요",
    pending: "대기",
    draft: "초안",
    submitted: "검토 대기",
    approved: "승인됨",
    active: "활성",
    sent: "발송됨",
    completed: "완료",
    failed: "실패",
    rejected: "반려",
    revoked: "회수",
    expired: "만료",
  }
  return (
    <Badge variant="outline" className={cn("font-normal", tone)}>
      {labels[normalized] || value || "상태 없음"}
    </Badge>
  )
}

function SummaryStrip({
  data,
  activeTab,
  onTabChange,
}: {
  data: ReportsData
  activeTab: ReportTab
  onTabChange: (tab: ReportTab) => void
}) {
  const items = [
    { key: "field" as const, label: "검수 대기", value: data.field.length, icon: FileText },
    { key: "review" as const, label: "승인 대기", value: data.review.length, icon: ShieldCheck },
    { key: "sent" as const, label: "발송된 리포트", value: data.sent.length, icon: Send },
    {
      key: null,
      label: "열람됨",
      value: data.sent.filter((item) => boolValue(item, "acknowledged")).length,
      icon: CheckCircle2,
    },
  ]
  return (
    <div className="ui-summary-strip grid sm:grid-cols-4">
      {items.map((item) => {
        const className = "flex min-h-20 items-center gap-3 border-b px-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
        const content = <>
          <item.icon className="size-6 text-primary" />
          <div>
            <div className="text-xs text-muted-foreground">{item.label}</div>
            <div className="mt-1 text-xl font-semibold">{item.value}건</div>
          </div>
        </>
        return item.key ? (
          <button
            key={item.label}
            type="button"
            className={cn(className, "ui-summary-filter")}
            aria-pressed={activeTab === item.key}
            onClick={() => onTabChange(item.key)}
          >
            {content}
          </button>
        ) : (
          <div key={item.label} className={className}>{content}</div>
        )
      })}
    </div>
  )
}

function PageState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-md border border-dashed px-6 text-center">
      <span className="text-muted-foreground">{icon}</span>
      <div className="mt-3 font-medium">{title}</div>
      <p className="mt-1 max-w-lg text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <SubmittedSearchInput
      value={value}
      onSearch={onChange}
      formClassName="w-full max-w-xl"
      placeholder="리포트, 고객, 작업 ID 검색"
    />
  )
}

function FieldReports({ rows, navigate }: { rows: SnapJsonRecord[]; navigate: SnapNavigate }) {
  const [query, setQuery] = useState("")
  const filtered = rows.filter((row) =>
    `${reportTitle(row)} ${textValue(row, "customer_name", "customer")} ${taskId(row)}`
      .toLowerCase()
      .includes(query.toLowerCase())
  )
  return (
    <div className="space-y-4">
      <SearchBar value={query} onChange={setQuery} />
      {filtered.length ? (
        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>현장 업무</TableHead>
                <TableHead>고객</TableHead>
                <TableHead className="text-right">증거</TableHead>
                <TableHead>제출</TableHead>
                <TableHead className="text-right">다음 행동</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => {
                const id = taskId(row)
                return (
                  <TableRow key={id || reportTitle(row)}>
                    <TableCell>
                      <div className="font-medium">{reportTitle(row)}</div>
                      <div className="text-xs text-muted-foreground">{id}</div>
                    </TableCell>
                    <TableCell>{textValue(row, "customer_name", "customer") || "미지정"}</TableCell>
                    <TableCell className="text-right tabular-nums">{numberValue(row, "media_count", "evidence_count")}개</TableCell>
                    <TableCell>{compactDate(row.submitted_at ?? row.updated_at ?? row.due_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="xs" variant="outline" onClick={() => navigate("SC-20", { params: { id } })}>
                        검토 열기
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <PageState icon={<FileCheck2 />} title="검토할 현장 리포트가 없습니다" description="작업자가 제출한 증거가 생기면 현장 검토 목록에 표시됩니다." />
      )}
    </div>
  )
}

function ReviewReports({ rows, navigate, onChanged }: { rows: SnapJsonRecord[]; navigate: SnapNavigate; onChanged: () => void }) {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<SnapJsonRecord | null>(null)
  const filtered = rows.filter((row) =>
    `${reportTitle(row)} ${textValue(row, "customer_name", "customer")} ${reportId(row)}`
      .toLowerCase()
      .includes(query.toLowerCase())
  )
  return (
    <>
      <div className="space-y-4">
        <SearchBar value={query} onChange={setQuery} />
        {filtered.length ? (
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>리포트</TableHead>
                  <TableHead>고객</TableHead>
                  <TableHead>검토 이유</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow key={reportId(row)}>
                    <TableCell>
                      <div className="font-medium">{reportTitle(row)}</div>
                      <div className="text-xs text-muted-foreground">{reportId(row)} · v{textValue(row, "version") || "1"}</div>
                    </TableCell>
                    <TableCell>{textValue(row, "customer_name", "customer") || "미지정"}</TableCell>
                    <TableCell>{textValue(row, "review_reason", "reason") || "고객 공개 내용 확인"}</TableCell>
                    <TableCell><StatusBadge value={textValue(row, "status") || "review"} /></TableCell>
                    <TableCell className="text-right">
                      <Button size="xs" onClick={() => setSelected(row)}>검토</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <PageState icon={<ShieldCheck />} title="승인 대기 리포트가 없습니다" description="고객용 리포트를 작성하면 사람 검토와 승인 목록에 표시됩니다." action={<Button variant="outline" onClick={() => navigate("SC-18")}>업무 보기</Button>} />
        )}
      </div>
      <ReviewSheet selected={selected} onOpenChange={(open) => !open && setSelected(null)} navigate={navigate} onChanged={onChanged} />
    </>
  )
}

function ReviewSheet({ selected, onOpenChange, navigate, onChanged }: { selected: SnapJsonRecord | null; onOpenChange: (open: boolean) => void; navigate: SnapNavigate; onChanged: () => void }) {
  const id = selected ? reportId(selected) : ""
  const [details, setDetails] = useState<SnapJsonRecord | null>(null)
  const [signatures, setSignatures] = useState<SnapJsonRecord[]>([])
  const [preflight, setPreflight] = useState<PreSendCheck | null>(null)
  const [signatureName, setSignatureName] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!selected || !snapApiConfigured || !id) return
    let cancelled = false
    void Promise.resolve()
      .then(async () => {
        const [report, signaturePage] = await Promise.all([
          snapApi.reports.approvalWorkbench(id).catch(() => snapApi.reports.get(id)),
          snapApi.reports.signatures(id),
        ])
        return { report, signatures: pageItems(signaturePage) }
      })
      .then((next) => {
        if (!cancelled) {
          setDetails(next.report)
          setSignatures(next.signatures)
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(snapApiErrorMessage(reason))
      })
    return () => {
      cancelled = true
    }
  }, [id, selected])

  const run = async (key: string, action: () => Promise<unknown>, success: string) => {
    setBusy(key)
    setError("")
    try {
      await action()
      toast.success(success)
      onChanged()
      if (key !== "preflight" && key !== "sign") onOpenChange(false)
    } catch (reason) {
      setError(snapApiErrorMessage(reason))
    } finally {
      setBusy("")
    }
  }

  const task = selected ? taskId(selected) : ""
  return (
    <Sheet open={Boolean(selected)} onOpenChange={onOpenChange}>
      <SheetContent className="top-12 h-[calc(100dvh-3rem)] w-full overflow-y-auto p-0 sm:max-w-xl">
        <div className="p-6">
          <SheetHeader>
            <SheetTitle>{selected ? reportTitle(selected) : "리포트 검토"}</SheetTitle>
            <SheetDescription>{id} · 사람 승인 전 고객 공개 내용과 근거를 확인합니다.</SheetDescription>
          </SheetHeader>

          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border text-sm">
            {[
              ["고객", selected ? textValue(selected, "customer_name", "customer") || "미지정" : "-"],
              ["버전", `v${selected ? textValue(selected, "version") || "1" : "-"}`],
              ["상태", selected ? textValue(selected, "status") || "review" : "-"],
              ["최근 수정", selected ? compactDate(selected.updated_at) : "-"],
            ].map(([label, value]) => (
              <div key={label} className="bg-background p-3">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="mt-1 font-medium">{value}</div>
              </div>
            ))}
          </div>

          <section className="mt-6 border-t pt-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-medium">승인 전 검사</h3>
                <p className="mt-1 text-xs text-muted-foreground">필수 증거, 고객 문구, 수신 채널과 AI 검토 여부를 확인합니다.</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={!id || busy === "preflight"}
                onClick={() =>
                  void run(
                    "preflight",
                    async () => {
                      const result = snapApiConfigured
                        ? await snapReportApi.preSendCheck(id, { channel: "link" })
                        : ({ ready_to_send: true, blocking: [] } as unknown as PreSendCheck)
                      setPreflight(result)
                    },
                    "승인 전 검사를 완료했습니다."
                  )
                }
              >
                {busy === "preflight" ? <LoaderCircle className="animate-spin" /> : <FileCheck2 />}
                검사
              </Button>
            </div>
            {preflight ? (
              <div className={cn("mt-3 rounded-md border p-3 text-sm", preflight.ready_to_send ? "ui-status-success" : "ui-status-warning") }>
                <div className="font-medium">{preflight.ready_to_send ? "전달 준비 완료" : "확인 후 승인 가능"}</div>
                {preflight.blocking?.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">{preflight.blocking.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="mt-1 text-xs">차단 항목이 없습니다.</p>}
              </div>
            ) : null}
          </section>

          <section className="mt-6 border-t pt-5">
            <h3 className="font-medium">서명</h3>
            <p className="mt-1 text-xs text-muted-foreground">승인 책임자를 기록합니다. 기존 서명 {signatures.length}건</p>
            <div className="mt-3 flex gap-2">
              <Input value={signatureName} onChange={(event) => setSignatureName(event.target.value)} placeholder="서명자 이름" />
              <Button
                variant="outline"
                disabled={!signatureName.trim() || busy === "sign"}
                onClick={() => void run("sign", () => snapApi.reports.sign(id, { type: "typed", signer_name: signatureName.trim(), signature_text: signatureName.trim() }), "서명을 기록했습니다.")}
              >
                {busy === "sign" ? <LoaderCircle className="animate-spin" /> : <Signature />}
                서명
              </Button>
            </div>
          </section>

          <section className="mt-6 border-t pt-5">
            <h3 className="font-medium">반려 사유</h3>
            <Textarea className="mt-3" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} rows={3} placeholder="수정해야 할 사실과 표현을 남겨 주세요." />
          </section>

          {error ? <p className="ui-status-danger mt-4 rounded-md border p-3 text-sm" role="alert">{error}</p> : null}

          <div className="mt-6 grid grid-cols-2 gap-2 border-t pt-5">
            <Button variant="outline" onClick={() => navigate("SC-21", { params: { id: task || "TASK-DEMO-001" } })}>
              <FileText /> 작성 화면
            </Button>
            <Button variant="outline" disabled={!rejectReason.trim() || busy === "reject"} onClick={() => void run("reject", () => snapReportApi.reject(id, rejectReason.trim()), "리포트를 반려했습니다.")}>
              {busy === "reject" ? <LoaderCircle className="animate-spin" /> : <Undo2 />}
              반려
            </Button>
            <Button className="col-span-2" disabled={busy === "approve" || preflight?.ready_to_send === false} onClick={() => void run("approve", () => snapReportApi.approve(id, true), "리포트를 승인했습니다.")}>
              {busy === "approve" ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />}
              리포트 승인
            </Button>
          </div>

          <div className="mt-3 grid gap-2">
            <Button variant="ghost" onClick={() => void run("pdf", async () => downloadBlob(await snapApi.reports.pdf(id), `${id}.pdf`), "PDF를 내려받았습니다.")}>
              <Download /> PDF
            </Button>
          </div>
          {details ? <div className="sr-only">{JSON.stringify(details)}</div> : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function SentReports({ rows, onChanged }: { rows: SnapJsonRecord[]; onChanged: () => void }) {
  const [query, setQuery] = useState("")
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")
  const [revokeTarget, setRevokeTarget] = useState<SnapJsonRecord | null>(null)
  const [revokeReason, setRevokeReason] = useState("")
  const filtered = rows.filter((row) => `${reportTitle(row)} ${textValue(row, "customer_name", "customer")} ${textValue(row, "token")}`.toLowerCase().includes(query.toLowerCase()))

  const revoke = async () => {
    if (!revokeTarget || !revokeReason.trim()) return
    const reportIdValue = textValue(revokeTarget, "report_id")
    const linkId = textValue(revokeTarget, "id", "link_id")
    if (!reportIdValue || !linkId) {
      setError("회수할 링크 식별 정보를 찾지 못했습니다.")
      return
    }
    setBusy(`revoke-${linkId}`)
    setError("")
    try {
      await snapReportApi.revokeReportLink(
        reportIdValue,
        linkId,
        revokeReason.trim()
      )
      toast.success("고객 공유 링크를 회수했습니다.")
      setRevokeTarget(null)
      setRevokeReason("")
      onChanged()
    } catch (reason) {
      setError(snapApiErrorMessage(reason))
    } finally {
      setBusy("")
    }
  }

  return (
    <div className="space-y-4">
      <SearchBar value={query} onChange={setQuery} />
      {error ? <p className="ui-status-danger rounded-md border p-3 text-sm">{error}</p> : null}
      {filtered.length ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>리포트</TableHead><TableHead>발송 요청</TableHead><TableHead>최근 열람</TableHead><TableHead>언어</TableHead><TableHead>수신 확인</TableHead><TableHead>상태</TableHead><TableHead className="text-right">링크 관리</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((row) => {
                const token = textValue(row, "token")
                const linkId = textValue(row, "id", "link_id")
                const path = textValue(row, "frontend_path") || (token ? `/view/${token}` : "")
                const active = textValue(row, "status") === "active" && !boolValue(row, "revoked")
                return (
                  <TableRow key={linkId || token}>
                    <TableCell><div className="font-medium">{reportTitle(row)}</div><div className="text-xs text-muted-foreground">{reportId(row)}</div></TableCell>
                    <TableCell>{compactDate(row.created_at)}</TableCell>
                    <TableCell>{compactDate(row.last_opened_at)}<div className="text-xs text-muted-foreground">{numberValue(row, "open_count", "view_count")}회</div></TableCell>
                    <TableCell>{textValue(row, "locale") || "-"}</TableCell>
                    <TableCell>{boolValue(row, "acknowledged") ? <Badge className="ui-status-success">확인됨</Badge> : "미확인"}</TableCell>
                    <TableCell><StatusBadge value={textValue(row, "status") || "active"} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {path ? (
                          <Button size="icon-xs" variant="ghost" title="외부 화면 열기" onClick={() => window.open(path, "_blank", "noopener,noreferrer")}><ExternalLink /></Button>
                        ) : null}
                        {active ? (
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            title="링크 회수"
                            disabled={busy === `revoke-${linkId}`}
                            onClick={() => {
                              setRevokeReason("")
                              setRevokeTarget(row)
                            }}
                          >
                            <RotateCcw />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      ) : <PageState icon={<Link2 />} title="전달된 리포트가 없습니다" description="승인된 리포트에서 보안 링크를 만들거나 이메일로 전달하면 이력이 표시됩니다." />}
      <AlertDialog
        open={Boolean(revokeTarget)}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setRevokeTarget(null)
            setRevokeReason("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>고객 공유 링크를 회수할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              회수 즉시 외부 열람이 차단되며 되돌릴 수 없습니다. 감사 이력에 남길 사유를 입력해 주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={revokeReason}
            onChange={(event) => setRevokeReason(event.target.value)}
            placeholder="예: 수신자 변경으로 기존 링크 회수"
            aria-label="링크 회수 사유"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(busy)}>취소</AlertDialogCancel>
            <AlertDialogAction
              disabled={!revokeReason.trim() || Boolean(busy)}
              onClick={(event) => {
                event.preventDefault()
                void revoke()
              }}
            >
              {busy ? <LoaderCircle className="animate-spin" /> : null}
              링크 회수
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function DeliveryReports({ failures, email, onChanged }: { failures: SnapJsonRecord[]; email: SnapJsonRecord[]; onChanged: () => void }) {
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")
  const retry = async (kind: "route" | "email", row: SnapJsonRecord) => {
    const id = textValue(row, "delivery_log_id", "delivery_id", "id")
    setBusy(`${kind}-${id}`)
    setError("")
    try {
      if (snapApiConfigured) {
        await snapApi.operations.retryDelivery(id)
      }
      toast.success("전달을 다시 요청했습니다.")
      onChanged()
    } catch (reason) {
      setError(snapApiErrorMessage(reason))
    } finally {
      setBusy("")
    }
  }
  const rows = [
    ...failures.map((row) => ({ kind: "route" as const, row })),
    ...email.filter((row) => textValue(row, "status").toLowerCase().includes("fail")).map((row) => ({ kind: "email" as const, row })),
  ]
  return (
    <div className="space-y-4">
      {error ? <p className="ui-status-danger rounded-md border p-3 text-sm">{error}</p> : null}
      {rows.length ? (
        <div className="overflow-hidden">
          <Table>
            <TableHeader><TableRow><TableHead>리포트</TableHead><TableHead>채널</TableHead><TableHead>수신자</TableHead><TableHead>실패 이유</TableHead><TableHead>요청 시각</TableHead><TableHead className="text-right">재시도</TableHead></TableRow></TableHeader>
            <TableBody>{rows.map(({ kind, row }) => {
              const id = textValue(row, "delivery_log_id", "delivery_id", "id")
              return <TableRow key={`${kind}-${id}`}><TableCell className="font-medium">{reportTitle(row)}</TableCell><TableCell>{kind === "email" ? <><Mail className="mr-1 inline size-4" /> 이메일</> : <><Link2 className="mr-1 inline size-4" /> 링크</>}</TableCell><TableCell>{textValue(row, "recipient", "recipient_value") || "-"}</TableCell><TableCell className="max-w-sm whitespace-normal text-destructive">{textValue(row, "error_message", "error", "reason") || "전달 실패"}</TableCell><TableCell>{compactDate(row.created_at)}</TableCell><TableCell className="text-right"><Button size="xs" variant="outline" disabled={busy === `${kind}-${id}`} onClick={() => void retry(kind, row)}>{busy === `${kind}-${id}` ? <LoaderCircle className="animate-spin" /> : <RefreshCw />} 다시 전달</Button></TableCell></TableRow>
            })}</TableBody>
          </Table>
        </div>
      ) : <PageState icon={<Check />} title="전달 실패가 없습니다" description="링크와 이메일 전달이 정상적으로 처리되고 있습니다." />}
    </div>
  )
}

export function SnapReportsPage({ navigate, routeSearch }: { navigate: SnapNavigate; routeSearch?: URLSearchParams }) {
  const resource = useReportsResource()
  const initialTab = routeSearch?.get("tab")
  const [tab, setTab] = useState<ReportTab>(initialTab === "field" || initialTab === "review" || initialTab === "sent" || initialTab === "delivery" ? initialTab : "field")
  const tabs = useMemo(() => [
    { id: "field" as const, label: "증빙 검수", count: resource.data.field.length },
    { id: "review" as const, label: "리포트 승인", count: resource.data.review.length },
    { id: "sent" as const, label: "발송", count: resource.data.sent.length },
    { id: "delivery" as const, label: "발송 모니터", count: resource.data.failures.length + resource.data.email.filter((row) => textValue(row, "status").toLowerCase().includes("fail")).length },
  ], [resource.data])

  const changeTab = (next: string) => {
    const value = next as ReportTab
    setTab(value)
    const url = new URL(window.location.href)
    url.searchParams.set("tab", value)
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`)
  }

  return (
    <div className="field-scrollbar h-full overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-ecoya-wide-xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b-0 pb-5">
          <div>
            <h1 className="text-2xl font-semibold">보고서</h1>
            <p className="mt-1 text-sm text-muted-foreground">현장 결과를 검토하고 승인한 뒤, 고객 전달과 링크 수명주기를 관리합니다.</p>
          </div>
          <Button variant="outline" onClick={resource.reload}><RefreshCw /> 새로고침</Button>
        </div>

        <div className="mt-5">
          <SummaryStrip
            data={resource.data}
            activeTab={tab}
            onTabChange={(next) => changeTab(next)}
          />
        </div>

        <Tabs value={tab} onValueChange={changeTab} className="mt-5">
          <TabsList className="h-auto max-w-full justify-start overflow-x-auto">
            {tabs.map((item) => <TabsTrigger key={item.id} value={item.id} className="gap-2"><span>{item.label}</span><Badge variant="secondary" className="min-w-6 justify-center px-1.5">{item.count}</Badge></TabsTrigger>)}
          </TabsList>
        </Tabs>

        <div className="mt-5">
          {resource.loading ? <div className="space-y-3"><Skeleton className="h-10 w-full max-w-xl" /><Skeleton className="h-56 w-full" /></div> : resource.error ? <PageState icon={<AlertCircle />} title="리포트를 불러오지 못했습니다" description={resource.error} action={<Button variant="outline" onClick={resource.reload}><RefreshCw /> 다시 시도</Button>} /> : tab === "field" ? <FieldReports rows={resource.data.field} navigate={navigate} /> : tab === "review" ? <ReviewReports rows={resource.data.review} navigate={navigate} onChanged={resource.reload} /> : tab === "sent" ? <SentReports rows={resource.data.sent} onChanged={resource.reload} /> : <DeliveryReports failures={resource.data.failures} email={resource.data.email} onChanged={resource.reload} />}
        </div>
      </div>
    </div>
  )
}

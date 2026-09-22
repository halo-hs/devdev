import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  Archive,
  ArrowLeft,
  Building2,
  Plus,
  RefreshCw,
  Search,
  UserRound,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog"
import { Input } from "@shared/components/ui/input"
import { Skeleton } from "@shared/components/ui/skeleton"
import { Textarea } from "@shared/components/ui/textarea"
import { snapApi } from "@snap/lib/snap-api"
import {
  snapApiConfigured,
  snapApiErrorMessage,
  type SnapJsonRecord,
} from "@snap/lib/snap-report-api"
import { cn } from "@shared/lib/utils"

type Customer = {
  id: string
  name: string
  contactName: string
  contactEmail: string
  contactPhone: string
  notes: string
  status: "active" | "archived"
  createdAt: string
  updatedAt: string
}

type CustomerForm = {
  name: string
  contact_name: string
  contact_email: string
  contact_phone: string
  notes: string
}

type CustomerStatusFilter = "active" | "archived"

type HistoryItem = {
  id: string
  title: string
  meta: string
  status: string
  href?: string
}

const DEMO_CUSTOMERS: Customer[] = [
  {
    id: "customer-hanbit",
    name: "Hanbit Trading Co.",
    contactName: "김유진",
    contactEmail: "trade@hanbit.example",
    contactPhone: "+82 2-555-0182",
    notes: "현장 보고서는 한국어 링크와 PDF를 함께 전달합니다.",
    status: "active",
    createdAt: "2026-05-12T09:00:00+09:00",
    updatedAt: "2026-08-04T16:20:00+09:00",
  },
  {
    id: "customer-acme",
    name: "ACME GmbH",
    contactName: "Anna Schmidt",
    contactEmail: "operations@acme.example",
    contactPhone: "+49 30 5550 1024",
    notes: "영문 보고서, Europe/Berlin 시간대로 전달합니다.",
    status: "active",
    createdAt: "2026-04-21T09:00:00+09:00",
    updatedAt: "2026-08-03T11:10:00+09:00",
  },
  {
    id: "customer-hmm",
    name: "HMM Green",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    notes: "외부 연락처 등록 전입니다.",
    status: "active",
    createdAt: "2026-07-02T09:00:00+09:00",
    updatedAt: "2026-07-29T15:45:00+09:00",
  },
]

const DEMO_TASKS: HistoryItem[] = [
  {
    id: "TASK-DEMO-001",
    title: "Busan Yard #24-118 적재 확인",
    meta: "2026.08.03 · 부산 CY",
    status: "검토 완료",
    href: "/tasks/TASK-DEMO-001",
  },
  {
    id: "TASK-DEMO-002",
    title: "봉인 번호 재확인",
    meta: "2026.07.28 · 인천 창고",
    status: "완료",
    href: "/tasks/TASK-DEMO-002",
  },
]

const DEMO_REPORTS: HistoryItem[] = [
  {
    id: "RPT-DEMO-001",
    title: "Loading Inspection",
    meta: "승인 버전 2 · 2026.08.04",
    status: "전달됨",
  },
]

const DEMO_LINKS: HistoryItem[] = [
  {
    id: "LINK-DEMO-001",
    title: "고객 보고서 링크",
    meta: "열람 2회 · 2026.08.11 만료",
    status: "활성",
    href: "/view/demo-token",
  },
]

function textValue(record: SnapJsonRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string") return value
  }
  return ""
}

function customerFromApi(record: SnapJsonRecord, index = 0): Customer {
  const rawStatus = textValue(record, "status", "state").toLowerCase()
  return {
    id: String(record.id ?? record.customer_id ?? `customer-${index}`),
    name: textValue(record, "name", "customer_name") || "이름 없음",
    contactName: textValue(record, "contact_name", "contactName"),
    contactEmail: textValue(record, "contact_email", "contactEmail", "email"),
    contactPhone: textValue(record, "contact_phone", "contactPhone", "phone"),
    notes: textValue(record, "notes", "memo"),
    status:
      rawStatus === "archived" || record.archived === true
        ? "archived"
        : "active",
    createdAt: textValue(record, "created_at", "createdAt"),
    updatedAt: textValue(record, "updated_at", "updatedAt"),
  }
}

function historyFromApi(
  record: SnapJsonRecord,
  index: number,
  kind: "task" | "report" | "link"
): HistoryItem {
  const id = String(
    record.id ??
      record.task_id ??
      record.report_id ??
      record.token ??
      `${kind}-${index}`
  )
  const title =
    textValue(record, "title", "name", "label", "task_title", "report_title") ||
    (kind === "task" ? "업무" : kind === "report" ? "보고서" : "공유 링크")
  const date = textValue(
    record,
    "updated_at",
    "created_at",
    "sent_at",
    "expires_at"
  )
  const status = textValue(record, "status", "state", "delivery_status") || "확인"
  const token = textValue(record, "token")
  return {
    id,
    title,
    meta: date ? formatDateTime(date) : "기록 시각 없음",
    status,
    href:
      kind === "task"
        ? `/tasks/${encodeURIComponent(id)}`
        : kind === "link" && token
          ? `/view/${encodeURIComponent(token)}`
          : undefined,
  }
}

function formatDateTime(value: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function customerToForm(customer: Customer): CustomerForm {
  return {
    name: customer.name,
    contact_name: customer.contactName,
    contact_email: customer.contactEmail,
    contact_phone: customer.contactPhone,
    notes: customer.notes,
  }
}

function CustomerFormFields({
  form,
  onChange,
}: {
  form: CustomerForm
  onChange: (next: CustomerForm) => void
}) {
  const set = (key: keyof CustomerForm, value: string) =>
    onChange({ ...form, [key]: value })
  return (
    <div className="space-y-4">
      <label className="grid gap-1.5 text-sm font-medium">
        고객명 <span className="sr-only">필수</span>
        <Input
          value={form.name}
          onChange={(event) => set("name", event.target.value)}
          placeholder="예: ACME GmbH"
          required
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        담당자
        <Input
          value={form.contact_name}
          onChange={(event) => set("contact_name", event.target.value)}
          placeholder="예: Anna Schmidt"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          이메일
          <Input
            type="email"
            value={form.contact_email}
            onChange={(event) => set("contact_email", event.target.value)}
            placeholder="contact@example.com"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          전화번호
          <Input
            value={form.contact_phone}
            onChange={(event) => set("contact_phone", event.target.value)}
            placeholder="+82 2-0000-0000"
          />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm font-medium">
        메모
        <Textarea
          value={form.notes}
          onChange={(event) => set("notes", event.target.value)}
          placeholder="전달 언어, 연락 시간, 고객 요청 등"
          rows={4}
        />
      </label>
    </div>
  )
}

function HistoryList({
  title,
  items,
  empty,
}: {
  title: string
  items: HistoryItem[]
  empty: string
}) {
  return (
    <section className="border-t pt-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">{items.length}건</span>
      </div>
      {items.length ? (
        <div className="divide-y rounded-md border">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-muted/60"
              onClick={() => item.href && window.history.pushState({}, "", item.href)}
              disabled={!item.href}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{item.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{item.meta}</span>
              </span>
              <Badge variant="secondary" className="shrink-0 font-normal">
                {item.status}
              </Badge>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground">
          {empty}
        </div>
      )}
    </section>
  )
}

export function SnapCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(DEMO_CUSTOMERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<CustomerStatusFilter>("active")
  const [emailOnly, setEmailOnly] = useState(false)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(snapApiConfigured)
  const [error, setError] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CustomerForm>({
    name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    notes: "",
  })
  const [editForm, setEditForm] = useState<CustomerForm | null>(null)
  const [busy, setBusy] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [tasks, setTasks] = useState<HistoryItem[]>([])
  const [reports, setReports] = useState<HistoryItem[]>([])
  const [links, setLinks] = useState<HistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const loadCustomers = async () => {
    if (!snapApiConfigured) {
      setCustomers(DEMO_CUSTOMERS)
      setLoading(false)
      return
    }
    setLoading(true)
    setError("")
    try {
      const page = await snapApi.customers.list()
      setCustomers(page.items.map(customerFromApi))
    } catch (reason) {
      setError(snapApiErrorMessage(reason))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!snapApiConfigured) return
    let cancelled = false
    const loadInitialCustomers = async () => {
      try {
        const page = await snapApi.customers.list()
        if (!cancelled) setCustomers(page.items.map(customerFromApi))
      } catch (reason) {
        if (!cancelled) setError(snapApiErrorMessage(reason))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadInitialCustomers()
    return () => {
      cancelled = true
    }
  }, [])

  const selected = customers.find((customer) => customer.id === selectedId) ?? null

  const openCustomer = (customer: Customer) => {
    setSelectedId(customer.id)
    setEditForm(customerToForm(customer))
    setHistoryLoading(snapApiConfigured)
    setTasks(snapApiConfigured ? [] : DEMO_TASKS)
    setReports(snapApiConfigured ? [] : DEMO_REPORTS)
    setLinks(snapApiConfigured ? [] : DEMO_LINKS)
  }

  const closeCustomer = () => {
    setSelectedId(null)
    setEditForm(null)
    setTasks([])
    setReports([])
    setLinks([])
    setHistoryLoading(false)
  }

  useEffect(() => {
    if (!selectedId || !snapApiConfigured) return
    let cancelled = false
    const loadHistory = async () => {
      try {
        const [taskPage, reportPage, linkPage] = await Promise.all([
          snapApi.tasks.list({ customer_id: selectedId }),
          snapApi.reports.list({ customer_id: selectedId }),
          snapApi.operations.shareLinks({
            customer_id: selectedId,
            link_type: "customer_view",
          }),
        ])
        if (cancelled) return
        setTasks(taskPage.items.map((item, index) => historyFromApi(item, index, "task")))
        setReports(
          reportPage.items.map((item, index) => historyFromApi(item, index, "report"))
        )
        setLinks(linkPage.items.map((item, index) => historyFromApi(item, index, "link")))
      } catch (reason) {
        if (!cancelled) toast.error(snapApiErrorMessage(reason))
      } finally {
        if (!cancelled) setHistoryLoading(false)
      }
    }
    void loadHistory()
    return () => {
      cancelled = true
    }
  }, [selectedId])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return customers.filter((customer) => {
      if (customer.status !== statusFilter) return false
      if (emailOnly && !customer.contactEmail) return false
      if (!needle) return true
      return `${customer.name} ${customer.contactName} ${customer.contactEmail} ${customer.contactPhone}`
        .toLowerCase()
        .includes(needle)
    })
  }, [customers, emailOnly, search, statusFilter])

  const createCustomer = async (event: FormEvent) => {
    event.preventDefault()
    if (!createForm.name.trim()) return
    setBusy(true)
    try {
      let created: Customer
      if (snapApiConfigured) {
        const response = await snapApi.customers.create(createForm)
        const nested = response.customer
        created = customerFromApi(
          nested && typeof nested === "object"
            ? (nested as SnapJsonRecord)
            : response,
          Date.now()
        )
      } else {
        created = customerFromApi({
          id: `customer-${Date.now()}`,
          ...createForm,
        })
      }
      setCustomers((current) => [created, ...current])
      openCustomer(created)
      setCreateOpen(false)
      setCreateForm({
        name: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        notes: "",
      })
      toast.success("고객을 추가했습니다.")
    } catch (reason) {
      toast.error(snapApiErrorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  const saveCustomer = async () => {
    if (!selected || !editForm?.name.trim()) return
    setBusy(true)
    try {
      let updated = { ...selected, ...customerFromApi({ id: selected.id, ...editForm }) }
      if (snapApiConfigured) {
        const response = await snapApi.customers.update(selected.id, editForm)
        const nested = response.customer
        updated = customerFromApi(
          nested && typeof nested === "object"
            ? (nested as SnapJsonRecord)
            : { ...response, id: selected.id, ...editForm }
        )
      }
      setCustomers((current) =>
        current.map((customer) => (customer.id === selected.id ? updated : customer))
      )
      setEditForm(customerToForm(updated))
      toast.success("고객 정보를 저장했습니다.")
    } catch (reason) {
      toast.error(snapApiErrorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  const archiveCustomer = async () => {
    if (!selected) return
    setBusy(true)
    try {
      if (snapApiConfigured) await snapApi.customers.archive(selected.id)
      setCustomers((current) =>
        current.map((customer) =>
          customer.id === selected.id
            ? { ...customer, status: "archived", updatedAt: new Date().toISOString() }
            : customer
        )
      )
      setStatusFilter("archived")
      setEmailOnly(false)
      setArchiveOpen(false)
      toast.success("고객을 보관했습니다. '보관됨' 목록에서 확인할 수 있습니다.")
    } catch (reason) {
      toast.error(snapApiErrorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  const activeCount = customers.filter((customer) => customer.status === "active").length
  const archivedCount = customers.filter((customer) => customer.status === "archived").length
  const withEmail = customers.filter(
    (customer) => customer.status === "active" && customer.contactEmail
  ).length

  return (
    <div className="mx-auto w-full max-w-ecoya-wide-xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="w-full">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-5">
          <div>
            <h1 className="text-2xl font-semibold">고객</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              수신자와 전달 이력을 작업자·조직 멤버와 분리해 관리합니다.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> 고객 추가
          </Button>
        </div>

        <div className="ui-summary-strip grid grid-cols-2 sm:grid-cols-4">
          <button
            type="button"
            className="ui-summary-filter p-4"
            aria-pressed={statusFilter === "active" && !emailOnly}
            onClick={() => {
              setStatusFilter("active")
              setEmailOnly(false)
              closeCustomer()
            }}
          >
            <div className="text-xs text-muted-foreground">등록 고객</div>
            <div className="mt-1 text-xl font-semibold">{activeCount}명</div>
          </button>
          <button
            type="button"
            className="ui-summary-filter p-4"
            aria-pressed={statusFilter === "active" && emailOnly}
            onClick={() => {
              setStatusFilter("active")
              setEmailOnly(true)
              closeCustomer()
            }}
          >
            <div className="text-xs text-muted-foreground">이메일 등록</div>
            <div className="mt-1 text-xl font-semibold">{withEmail}명</div>
          </button>
          <div className="p-4">
            <div className="text-xs text-muted-foreground">고객 전달 링크</div>
            <div className="mt-1 text-xl font-semibold">{links.length || DEMO_LINKS.length}건</div>
          </div>
          <button
            type="button"
            className="ui-summary-filter p-4"
            aria-pressed={statusFilter === "archived"}
            onClick={() => {
              setStatusFilter("archived")
              setEmailOnly(false)
              closeCustomer()
            }}
          >
            <div className="text-xs text-muted-foreground">보관됨</div>
            <div className="mt-1 text-xl font-semibold">{archivedCount}명</div>
          </button>
        </div>

        <div className="mt-5 grid min-h-[560px] gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className={cn("min-w-0", selected && "hidden lg:block")}>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                  placeholder="고객명, 담당자, 이메일 검색"
                  aria-label="고객 검색"
                />
              </div>
              <div
                className="grid shrink-0 grid-cols-2 rounded-md bg-muted p-1"
                role="group"
                aria-label="고객 상태"
              >
                {(
                  [
                    ["active", "활성 고객"],
                    ["archived", `보관됨 ${archivedCount}`],
                  ] as const
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={statusFilter === value ? "secondary" : "ghost"}
                    className={cn(
                      "h-7 px-2 text-xs",
                      statusFilter === value && "bg-background shadow-sm hover:bg-background"
                    )}
                    aria-pressed={statusFilter === value}
                    onClick={() => {
                      setStatusFilter(value)
                      setEmailOnly(false)
                      closeCustomer()
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <Button variant="outline" size="icon" onClick={() => void loadCustomers()} aria-label="고객 새로고침">
                <RefreshCw />
              </Button>
            </div>

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-md border border-destructive/30 p-6 text-center">
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="outline" className="mt-4" onClick={() => void loadCustomers()}>
                  <RefreshCw /> 다시 시도
                </Button>
              </div>
            ) : filtered.length ? (
              <div className="divide-y border-y">
                {filtered.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    className={cn(
                      "grid w-full gap-3 px-3 py-4 text-left transition-colors hover:bg-muted/60 sm:grid-cols-[minmax(0,1fr)_minmax(180px,0.7fr)_auto] sm:items-center",
                      selectedId === customer.id && "bg-muted"
                    )}
                    onClick={() => openCustomer(customer)}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                        {customer.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{customer.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {customer.contactName || "담당자 미등록"}
                        </span>
                      </span>
                    </span>
                    <span className="min-w-0 text-sm text-muted-foreground">
                      <span className="block truncate">{customer.contactEmail || "이메일 미등록"}</span>
                      <span className="block truncate text-xs">{customer.contactPhone || "전화번호 미등록"}</span>
                    </span>
                    <Badge variant="secondary" className="w-fit font-normal">
                      {customer.status === "archived"
                        ? "보관됨"
                        : customer.contactEmail
                          ? "전달 가능"
                          : "연락처 필요"}
                    </Badge>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed py-16 text-center">
                <Building2 className="mx-auto size-7 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">
                  {customers.length ? "검색 결과가 없습니다." : "등록된 고객이 없습니다."}
                </p>
                {!customers.length ? (
                  <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                    <Plus /> 첫 고객 추가
                  </Button>
                ) : null}
              </div>
            )}
          </section>

          <aside className={cn("min-w-0 border-l pl-5", !selected && "hidden lg:block")}>
            {selected && editForm ? (
              <div>
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden"
                      onClick={closeCustomer}
                      aria-label="고객 목록으로"
                    >
                      <ArrowLeft />
                    </Button>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold">{selected.name}</h2>
                      <p className="text-xs text-muted-foreground">
                        최근 수정 {formatDateTime(selected.updatedAt)}
                      </p>
                    </div>
                  </div>
                  {selected.status === "active" ? (
                    <Button variant="outline" size="sm" onClick={() => setArchiveOpen(true)}>
                      <Archive /> 보관
                    </Button>
                  ) : (
                    <Badge variant="secondary">보관됨</Badge>
                  )}
                </div>

                <fieldset disabled={selected.status === "archived"}>
                  <CustomerFormFields form={editForm} onChange={setEditForm} />
                </fieldset>
                {selected.status === "active" ? (
                  <div className="mt-4 flex justify-end">
                    <Button onClick={() => void saveCustomer()} disabled={busy || !editForm.name.trim()}>
                      {busy ? "저장 중..." : "변경사항 저장"}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                    보관된 고객은 읽기 전용입니다. 현재 SNAP API에는 고객 복구 기능이 없어
                    복구 버튼을 제공하지 않습니다.
                  </div>
                )}

                {historyLoading ? (
                  <div className="mt-6 space-y-3 border-t pt-5">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <div className="mt-6 space-y-6">
                    <HistoryList title="관련 업무" items={tasks} empty="이 고객과 연결된 업무가 없습니다." />
                    <HistoryList title="보고서" items={reports} empty="발행된 고객 보고서가 없습니다." />
                    <HistoryList title="공유 링크" items={links} empty="생성된 고객 공유 링크가 없습니다." />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex min-h-80 flex-col items-center justify-center text-center text-muted-foreground">
                <UserRound className="size-8" />
                <p className="mt-3 text-sm font-medium text-foreground">고객을 선택하세요</p>
                <p className="mt-1 max-w-xs text-xs">
                  연락처, 메모와 고객별 업무·보고서·공유 링크 이력을 확인합니다.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={(open) => !busy && setCreateOpen(open)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>고객 추가</DialogTitle>
            <DialogDescription>
              보고서 수신자와 외부 공유 이력에 사용할 고객 정보를 등록합니다.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createCustomer} className="space-y-5">
            <CustomerFormFields form={createForm} onChange={setCreateForm} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={busy}>
                취소
              </Button>
              <Button type="submit" disabled={busy || !createForm.name.trim()}>
                {busy ? "추가 중..." : "고객 추가"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 고객을 보관할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              기존 업무·보고서·전달 이력은 유지되며 새 업무의 고객 선택 목록에서는 제외됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => void archiveCustomer()} disabled={busy}>
              보관
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

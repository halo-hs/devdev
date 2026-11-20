import { type ReactNode, useState, useEffect } from "react"
import { XCircle, AlertTriangle, CheckCircle2, ShieldCheck, Clock3, Plus, RefreshCcw, Search, ArrowLeft, ArrowRight, Pencil, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HeroBanner } from "@/components/platform/HeroBanner"
import { SummaryMetricStrip } from "@/components/platform/SummaryMetricStrip"

type Tone = "neutral" | "success" | "warning" | "danger" | "info"

const toneClasses: Record<Tone, string> = {
  neutral: "border-border bg-muted/40 text-foreground",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100",
  warning:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100",
  danger:
    "border-destructive/30 bg-destructive/5 text-destructive dark:bg-destructive/10",
  info: "border-primary/20 bg-primary/5 text-foreground",
}

function Notice({
  title,
  children,
  tone = "neutral",
  action,
}: {
  title: string
  children?: ReactNode
  tone?: Tone
  action?: ReactNode
}) {
  const Icon =
    tone === "danger"
      ? XCircle
      : tone === "warning"
        ? AlertTriangle
        : tone === "success"
          ? CheckCircle2
          : tone === "info"
            ? ShieldCheck
            : Clock3

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between",
        toneClasses[tone]
      )}
    >
      <div className="flex min-w-0 gap-2.5">
        <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          {children ? (
            <div className="mt-1 text-xs leading-5 opacity-80">{children}</div>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

function AppPage({
  eyebrow,
  title,
  description,
  badge,
  actions,
  heroSummary,
  children,
  embedded = false,
}: {
  eyebrow: string
  title: string
  description: string
  badge?: ReactNode
  actions?: ReactNode
  heroSummary?: ReactNode
  children: ReactNode
  embedded?: boolean
}) {
  if (embedded) {
    return (
      <section aria-label={title} className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          {actions}
        </div>
        {children}
      </section>
    )
  }
  return (
    <div className="min-h-full w-full bg-transparent text-foreground">
      <main className="w-full px-5 py-5 sm:px-6 sm:py-6 xl:px-8">
        <HeroBanner
          className="[&_header]:flex-wrap"
          eyebrow={eyebrow}
          title={title}
          description={description}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {badge}
              {actions}
            </div>
          }
          summary={heroSummary}
        />
        <div className="mt-6">{children}</div>
      </main>
    </div>
  )
}

function SectionHeading({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-[length:var(--text-header-7)] leading-[var(--leading-header-7)] font-bold">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-[length:var(--text-body-10)] leading-[var(--leading-body-10)] text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

const salesContacts = [
  {
    id: "anna-keller",
    name: "Anna Keller",
    company: "ACME GmbH",
    email: "a.keller@acme.example",
    phone: "+49 40 555 0182",
    status: "활성",
    deals: 2,
    stageCounts: ["계약 1", "정산 1"],
    dealIds: ["DL-260707-04", "DL-260918-91"],
    ownership: "primary",
  },
  {
    id: "kenji-sato",
    name: "Kenji Sato",
    company: "Sakura Logistics",
    email: "k.sato@sakura.example",
    phone: "+81 3 5550 1204",
    status: "활성",
    deals: 1,
    stageCounts: ["계약 1"],
    dealIds: ["DL-260625-07"],
    ownership: "co",
  },
  {
    id: "mia-chen",
    name: "Mia Chen",
    company: "HMM Green",
    email: "mia@hmmgreen.example",
    phone: "+82 2 555 0147",
    status: "활성",
    deals: 0,
    stageCounts: [],
    dealIds: [],
    ownership: "primary",
  },
]

type SalesPreviewContact = {
  id: string
  name: string
  company: string
  email: string
  phone: string
  status: string
  deals: number
  stageCounts: string[]
  dealIds: string[]
  kind?: string
  title?: string
  note?: string
  ownership?: "primary" | "co"
  accountStatus?: "prospect" | "active"
}

type SalesContactForm = Pick<SalesPreviewContact, "name" | "company" | "email" | "phone" | "kind" | "title" | "note">

const salesContactExamples: SalesPreviewContact[] = [
  ...salesContacts.map((contact) => ({ ...contact, ownership: contact.ownership as "primary" | "co", accountStatus: contact.deals > 0 ? "active" as const : "prospect" as const })),
  ...Array.from({ length: 97 }, (_, index) => {
    const number = index + 4
    const regions = ["Berlin", "Osaka", "Singapore", "Busan", "Rotterdam", "Helsinki", "Toronto", "Dubai"]
    const region = regions[index % regions.length]
    const ownership = index % 5 === 1 ? "co" : "primary"
    return {
      id: `account-${String(number).padStart(3, "0")}`,
      name: `${region} 담당자 ${String(number).padStart(3, "0")}`,
      company: `${region} Trading ${String(number).padStart(3, "0")}`,
      email: `contact${number}@example.com`,
      phone: `+00 20 5550 ${String(1000 + number)}`,
      status: "활성",
      deals: 0,
      stageCounts: [],
      dealIds: [],
      ownership: ownership as "primary" | "co",
      accountStatus: "prospect" as const,
    }
  }),
]

const emptySalesContactForm: SalesContactForm = {
  name: "", company: "", email: "", phone: "", kind: "counterparty", title: "", note: "",
}

function OwnedAccountsPanel({
  contacts,
  role,
  query,
  onQueryChange,
  onRoleChange,
  onOpenRelationship,
}: {
  contacts: SalesPreviewContact[]
  role: "any" | "primary" | "co"
  query: string
  onQueryChange: (value: string) => void
  onRoleChange: (value: "any" | "primary" | "co") => void
  onOpenRelationship?: (counterpartyId: string) => void
}) {
  const [page, setPage] = useState(1)
  const [period, setPeriod] = useState<"all" | "30" | "90" | "year">("all")
  const [sort, setSort] = useState<"recent" | "name">("recent")
  const expandedContacts = contacts.length >= 100
    ? contacts
    : contacts.length === 0
      ? []
      : Array.from({ length: 100 }, (_, index) => contacts[index % contacts.length])
  const accountRows = expandedContacts.map((source, index) => {
    const ownership = source.ownership ?? (index % 5 === 0 ? "co" : "primary")
    const ageDays = index * 2 + 4
    const assignedAt = new Date(Date.UTC(2026, 10, 11 - ageDays)).toISOString().slice(0, 10).replaceAll("-", ".")
    return {
      ...source,
      id: source.id,
      ownership,
      accountStatus: source.accountStatus ?? (source.deals > 0 ? "active" : "prospect"),
      assignedAt,
      coOwners: ownership === "co" ? "조민영" : "없음",
      ageDays,
    }
  })
  const rows = accountRows
    .filter((contact) => role === "any" || contact.ownership === role)
    .filter((contact) => period === "all" || period === "year" || (period === "90" ? contact.ageDays <= 90 : contact.ageDays <= 30))
    .filter((contact) => `${contact.name} ${contact.company}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .sort((left, right) => sort === "name" ? left.company.localeCompare(right.company) : right.assignedAt.localeCompare(left.assignedAt))
  const pageSize = 20
  const visibleRows = rows.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2" aria-label="담당 유형 필터">
          <span className="mr-1 text-sm text-muted-foreground">담당 유형</span>
          <Tabs value={role} onValueChange={(value) => { setPage(1); onRoleChange(value as typeof role) }}>
            <TabsList variant="segment" aria-label="담당 유형">
              <TabsTrigger value="any">전체</TabsTrigger>
              <TabsTrigger value="primary">주 담당</TabsTrigger>
              <TabsTrigger value="co">공동 담당</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={(value) => { setPage(1); setPeriod(value as typeof period) }}>
            <SelectTrigger className="w-[132px]" aria-label="담당 기간"><SelectValue placeholder="담당 기간" /></SelectTrigger>
            <SelectContent><SelectItem value="all">전체 기간</SelectItem><SelectItem value="30">최근 30일</SelectItem><SelectItem value="90">최근 90일</SelectItem><SelectItem value="year">올해</SelectItem></SelectContent>
          </Select>
          <Select value={sort} onValueChange={(value) => { setPage(1); setSort(value as typeof sort) }}>
            <SelectTrigger className="w-[132px]" aria-label="정렬"><SelectValue placeholder="정렬" /></SelectTrigger>
            <SelectContent><SelectItem value="recent">최근 담당순</SelectItem><SelectItem value="name">거래처명순</SelectItem></SelectContent>
          </Select>
          <div className="relative w-full sm:w-[220px]">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input className="pl-9" placeholder="거래처 검색" value={query} onChange={(event) => { setPage(1); onQueryChange(event.target.value) }} />
          </div>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>내 담당 거래처 <span className="ml-1 text-sm font-normal text-muted-foreground">{rows.length}곳</span></CardTitle>
          <CardDescription>내가 주 담당자이거나 공동 담당자로 맡고 있는 거래처입니다.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length > 0 ? <Table className="min-w-[760px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[38%] px-4 text-sm">거래처</TableHead>
                <TableHead className="w-[14%] text-sm">상태</TableHead>
                <TableHead className="w-[14%] text-sm">내 역할</TableHead>
                <TableHead className="w-[16%] text-sm">다른 담당자</TableHead>
                <TableHead className="w-[18%] text-sm">담당 시작일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRows.map((contact) => (
                <TableRow
                  key={contact.id}
                  data-clickable="true"
                  tabIndex={0}
                  className="group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                  aria-label={`${contact.company} 거래처 360 열기`}
                  onClick={() => onOpenRelationship?.(contact.company)}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpenRelationship?.(contact.company) } }}
                >
                  <TableCell className="px-4"><div className="min-w-0"><p className="text-[15px] font-semibold group-hover:text-primary">{contact.company}</p><p className="mt-1 text-[15px] text-muted-foreground">{contact.name}</p></div></TableCell>
                  <TableCell className="text-[15px]"><Badge variant={contact.accountStatus === "active" ? "secondary" : "outline"}>{contact.accountStatus === "active" ? "거래처" : "잠재 거래처"}</Badge></TableCell>
                  <TableCell className="text-[15px]"><Badge variant={contact.ownership === "primary" ? "secondary" : "outline"}>{contact.ownership === "primary" ? "주 담당" : "공동 담당"}</Badge></TableCell>
                  <TableCell className="text-[15px] text-muted-foreground">{contact.coOwners}</TableCell>
                  <TableCell className="text-[15px] tabular-nums text-muted-foreground">{contact.assignedAt}<ChevronRight className="ml-2 inline size-4 align-[-2px] transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table> : <p className="px-5 py-10 text-center text-[15px] text-muted-foreground">조건에 맞는 담당 거래처가 없습니다.</p>}
          {rows.length > 0 ? (
            <div className="flex items-center justify-between gap-3 border-t px-5 py-3 text-sm text-muted-foreground">
              <span>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, rows.length)} / {rows.length}곳</span>
              <div className="flex items-center gap-2"><Button type="button" size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>이전</Button><span>{page} / {totalPages}</span><Button type="button" size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}>다음</Button></div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

export function SalesPrototype({ onOpenDeal, onOpenRelationship, embedded = false, mode = "contacts" }: { onOpenDeal?: (dealId: string) => void; onOpenRelationship?: (counterpartyId: string) => void; embedded?: boolean; mode?: "contacts" | "accounts" } = {}) {
  // Explicit prototype fixtures; these are not server authorization decisions.
  const [preview] = useState(() => new URLSearchParams(window.location.search).get("salesState") ?? "ready")
  const [listState, setListState] = useState<"ready" | "loading" | "error">(preview === "list-error" ? "error" : preview === "list-loading" ? "loading" : "ready")
  const [detailState, setDetailState] = useState<"ready" | "loading" | "error" | "forbidden" | "not-found">(
    preview === "detail-error" ? "error" : preview === "detail-loading" ? "loading" : preview === "forbidden" ? "forbidden" : preview === "not-found" ? "not-found" : "ready"
  )
  const [retryTarget, setRetryTarget] = useState<"list" | "detail" | null>(null)
  const canWrite = preview !== "readonly"
  useEffect(() => {
    if (!retryTarget) return
    const timer = window.setTimeout(() => {
      if (retryTarget === "list") setListState("ready")
      else setDetailState("ready")
      setRetryTarget(null)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [retryTarget])
  const retry = (target: "list" | "detail") => {
    if (target === "list") setListState("loading")
    else setDetailState("loading")
    setRetryTarget(target)
  }
  const [contacts, setContacts] = useState<SalesPreviewContact[]>(() => preview === "list-empty" ? [] : salesContactExamples.map((contact, index) => ({ ...contact, ...(preview === "archived" && index === 0 ? { status: "보관" } : {}) })))
  const [selectedId, setSelectedId] = useState(salesContactExamples[0].id)
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [accountRole, setAccountRole] = useState<"any" | "primary" | "co">("any")
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<SalesContactForm>(emptySalesContactForm)
  const roleFilteredContacts = mode === "accounts" && accountRole !== "any"
    ? contacts.filter((contact) => contact.ownership === accountRole)
    : contacts
  const visibleContacts = roleFilteredContacts.filter((contact) =>
    `${contact.name} ${contact.company}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
  )
  const selected = listState === "ready" ? visibleContacts.find((contact) => contact.id === selectedId) : undefined
  const selectContact = (id: string) => {
    setSelectedId(id)
    setDetailState("loading")
    setRetryTarget("detail")
  }
  const changeAccountRole = (value: "any" | "primary" | "co") => {
    setAccountRole(value)
    const first = contacts.find((contact) => value === "any" || contact.ownership === value)
    setSelectedId(first?.id ?? "")
    setPage(1)
    setDetailState("ready")
  }
  const loadingNotice = (label: string) => (
    <div role="status" aria-label={label} className="space-y-3 p-4" aria-busy="true">
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((row) => <div key={row} className="h-12 animate-pulse rounded-md bg-muted" />)}
    </div>
  )
  const contactPageSize = 20
  const totalPages = Math.max(1, Math.ceil(visibleContacts.length / contactPageSize))
  const pagedContacts = visibleContacts.slice((page - 1) * contactPageSize, page * contactPageSize)
  const openEditor = (contact?: SalesPreviewContact) => {
    if (!canWrite || (contact && (contact.status === "보관" || detailState !== "ready"))) return
    setEditingId(contact?.id ?? null)
    setForm(contact ? {
      name: contact.name,
      company: contact.company,
      email: contact.email,
      phone: contact.phone,
      kind: contact.kind ?? "counterparty",
      title: contact.title ?? "",
      note: contact.note ?? "",
    } : emptySalesContactForm)
    setEditorOpen(true)
  }
  const saveContact = () => {
    if (!canWrite || (editingId && (detailState !== "ready" || contacts.find((contact) => contact.id === editingId)?.status === "보관"))) return
    const name = form.name.trim()
    if (!name) return
    if (editingId) {
      setContacts((current) => current.map((contact) => contact.id === editingId ? { ...contact, ...form, name } : contact))
    } else {
      const id = crypto.randomUUID()
      setContacts((current) => [...current, { ...form, id, name, status: "활성", deals: 0, stageCounts: [], dealIds: [] }])
      setSelectedId(id)
      setQuery("")
      setPage(Math.ceil((contacts.length + 1) / 50))
    }
    setEditorOpen(false)
  }
  const relatedDeals = [
    { id: "DL-260707-04", amount: "380,000.00 USD", stage: "계약", owner: "나", risk: 0 },
    { id: "DL-260918-91", amount: "50,820.00 USD", stage: "정산", owner: "조민영", risk: 0 },
    { id: "DL-260625-07", amount: "—", stage: "계약", owner: "나", risk: 0 },
  ].filter((deal) => selected?.dealIds.includes(deal.id))
  const dealStages = ["계약", "선적", "통관", "정산"]
  const activeContactCount = contacts.filter((contact) => contact.status === "활성").length
  const dealCount = contacts.reduce((total, contact) => total + contact.deals, 0)
  const isAccountsView = mode === "accounts"
  if (isAccountsView) {
    return (
      <AppPage
        embedded={embedded}
        eyebrow="영업"
        title="내 담당 거래처"
        description="내가 주 담당자이거나 공동 담당자로 맡고 있는 거래처를 확인합니다."
        heroSummary={<SummaryMetricStrip items={[{ label: "전체 담당 거래처", value: "100곳", note: "내 담당", tone: "blue" }, { label: "주 담당", value: "80곳", note: "책임 담당", tone: "neutral" }, { label: "공동 담당", value: "20곳", note: "협업 중", tone: "green" }, { label: "진행 중인 거래", value: `${dealCount}건`, note: "전체 단계", tone: "amber" }]} />}
        actions={<Button size="icon-sm" variant="outline" aria-label="새로고침" title="새로고침" onClick={() => retry("list")} disabled={listState === "loading"}><RefreshCcw aria-hidden="true" /></Button>}
      >
        <OwnedAccountsPanel contacts={contacts} role={accountRole} query={query} onQueryChange={(value) => { setQuery(value); setPage(1) }} onRoleChange={changeAccountRole} onOpenRelationship={onOpenRelationship} />
      </AppPage>
    )
  }
  return (
    <AppPage
      embedded={embedded}
      eyebrow="영업"
      title={isAccountsView ? "내 담당 거래처" : "영업"}
      description={isAccountsView ? "내가 관계 담당자로 맡고 있는 거래처와 영업 관계를 확인합니다." : "담당 거래처와 영업 관계를 확인하고, 관련 거래·활동·후속 일정을 한 화면에서 관리합니다."}
      heroSummary={
        <SummaryMetricStrip
          items={[
            { label: "활성 거래처", value: `${activeContactCount}곳`, note: "관계 담당" , tone: "blue" },
            { label: "진행 중인 거래", value: `${dealCount}건`, note: "전체 단계", tone: "neutral" },
            { label: "영업 활동", value: "3건", note: "최근 30일", tone: "green" },
            { label: "후속 일정", value: "2건", note: "이번 주", tone: "amber" },
          ]}
        />
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {canWrite && <Button size="sm" onClick={() => openEditor()}>
            <Plus data-icon="inline-start" />
            연락처 추가
          </Button>}
          <Button size="icon-sm" variant="outline" aria-label="새로고침" title="새로고침" onClick={() => retry("list")} disabled={listState === "loading"}>
          <RefreshCcw aria-hidden="true" />
          </Button>
        </div>
      }
    >
      {isAccountsView ? (
        <div className="mb-4 flex flex-wrap items-center gap-2" aria-label="담당 유형 필터">
          <span className="mr-1 text-sm text-muted-foreground">담당 유형</span>
          {(["any", "primary", "co"] as const).map((value) => (
            <Button key={value} type="button" size="sm" variant={accountRole === value ? "secondary" : "outline"} aria-pressed={accountRole === value} onClick={() => changeAccountRole(value)}>
              {value === "any" ? "전체" : value === "primary" ? "주 담당" : "공동 담당"}
            </Button>
          ))}
        </div>
      ) : null}
      <div className={cn("grid min-h-[620px] overflow-hidden rounded-[var(--r-lg)] bg-[var(--color-gray-12)] lg:grid-cols-[340px_minmax(0,1fr)]", embedded ? "border border-[var(--color-gray-9)]" : "shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)]")}>
        <aside className="border-b border-[var(--color-gray-10)] bg-[var(--color-gray-12)] lg:border-r lg:border-b-0">
          <div className="border-b p-4">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="이름 또는 회사 검색" value={query} onChange={(event) => { const value = event.target.value; setQuery(value); setPage(1); const first = contacts.find((contact) => `${contact.name} ${contact.company}`.toLocaleLowerCase().includes(value.trim().toLocaleLowerCase())); setSelectedId(first?.id ?? ""); setDetailState("ready") }} />
            </div>
          </div>
          <div className="grid">
            {listState === "loading" ? loadingNotice("연락처 목록 불러오는 중") : listState === "error" ? (
              <div className="p-4"><Notice tone="danger" title="연락처 목록을 불러오지 못했습니다." action={<Button size="sm" variant="outline" onClick={() => retry("list")}>다시 시도</Button>} /></div>
            ) : pagedContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => selectContact(contact.id)}
                className={cn(
                  "border-b p-4 text-left hover:bg-sidebar-accent",
                  selected?.id === contact.id && "bg-sidebar-accent"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                <p className="text-[15px] font-medium">{contact.company}</p>
                  <div className="flex items-center gap-1"><Badge variant={contact.accountStatus === "active" ? "secondary" : "outline"}>{contact.accountStatus === "active" ? "거래처" : "잠재"}</Badge><Badge variant="outline">{contact.status}</Badge></div>
                </div>
                <p className="mt-1 text-[15px] text-muted-foreground">담당자 {contact.name}</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {contact.email} · {contact.phone}
                </p>
              </button>
            ))}
            {listState === "ready" && visibleContacts.length === 0 ? <p className="p-4 text-sm text-muted-foreground">{query.trim() ? "검색 결과가 없습니다." : canWrite ? "연락처가 없습니다. ‘연락처 추가’로 등록하거나 거래 상세에서 연결하세요." : "표시할 연락처가 없습니다. 권한이 있는 팀원에게 등록을 요청하세요."}</p> : null}
          </div>
          {listState === "ready" && visibleContacts.length > contactPageSize ? (
            <div className="flex items-center justify-between gap-2 p-3 text-xs text-muted-foreground">
              <span>{(page - 1) * contactPageSize + 1}–{Math.min(page * contactPageSize, visibleContacts.length)} / {visibleContacts.length}명</span>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="이전 페이지"><ArrowLeft /></Button>
                <span>{page} / {totalPages}</span>
                <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)} aria-label="다음 페이지"><ArrowRight /></Button>
              </div>
            </div>
          ) : null}
        </aside>
        <section className="min-w-0 p-4 sm:p-6" aria-label="선택 거래처 상세">
          {!selected ? null : detailState === "loading" ? loadingNotice("연락처 상세 불러오는 중") : detailState === "error" ? (
            <Notice tone="danger" title="영업 파이프라인을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." action={<Button size="sm" variant="outline" onClick={() => retry("detail")}>다시 시도</Button>} />
          ) : detailState === "forbidden" ? (
            <Notice tone="danger" title="이 연락처의 파이프라인을 볼 권한이 없습니다.">조직 관리자에게 권한을 요청하세요.</Notice>
          ) : detailState === "not-found" ? (
            <Notice tone="danger" title="연락처가 삭제되었거나 접근할 수 없습니다.">다른 연락처를 선택해 주세요.</Notice>
          ) : <>
          {selected.status === "보관" && <Notice title="보관된 연락처입니다.">이력은 확인할 수 있지만 연락처는 수정할 수 없습니다.</Notice>}
          {!canWrite && <p className="mb-3 text-sm text-muted-foreground">보기 전용 · 연락처를 추가하거나 수정할 권한이 없습니다.</p>}
          <div className="flex flex-col gap-3 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">선택 거래처</p>
              <button type="button" className="mt-1 text-left text-2xl font-semibold hover:text-primary" onClick={() => onOpenRelationship?.(selected.company)}>{selected.company}</button>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[15px] text-muted-foreground">
                <span>{selected.name}</span>
                <Badge variant={selected.accountStatus === "active" ? "secondary" : "outline"}>{selected.accountStatus === "active" ? "거래처" : "잠재 거래처"}</Badge>
                <Badge variant="outline">{selected.status}</Badge>
                <span>{selected.phone}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap justify-end gap-1">
                <Badge variant="secondary">관련 Deal {selected.deals}건</Badge>
                {selected.stageCounts.map((count) => (
                  <Badge key={count} variant="outline">{count}</Badge>
                ))}
              </div>
              {canWrite && selected.status !== "보관" && <Button size="icon" variant="ghost" aria-label="연락처 수정" onClick={() => openEditor(selected)}>
                <Pencil className="size-4" />
              </Button>}
            </div>
          </div>
          <div className="mt-6 grid gap-8">
            <div>
              <SectionHeading
                title="영업 관계"
                description="담당 거래처와 연결된 거래를 단계별로 확인합니다."
              />
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {selected.deals === 0 ? (
                  <div className="md:col-span-2 xl:col-span-4">
                    <Notice title="관련 Deal이 없습니다">
                      연결된 거래가 생기면 여기에 표시됩니다.
                    </Notice>
                  </div>
                ) : (
                  dealStages.map((stage) => {
                    const stageDeals = relatedDeals.filter((deal) => deal.stage === stage)
                    return (
                      <section key={stage} className="rounded-[var(--r-lg)] border border-[var(--color-gray-9)] bg-[var(--color-gray-11)] p-3">
                        <h3 className="mb-3 flex items-center justify-between text-sm font-semibold">
                          <span>{stage}</span>
                          <span className="text-xs font-normal text-muted-foreground">{stageDeals.length}건</span>
                        </h3>
                        <div className="space-y-2">
                          {stageDeals.map((deal) => (
                            <button
                              key={deal.id}
                              type="button"
                              onClick={() => onOpenDeal?.(deal.id)}
                              className="block w-full rounded-md border bg-background p-3 text-left hover:border-primary/50"
                            >
                              <span className="flex items-start justify-between gap-2">
                                <strong className="text-sm">{deal.id}</strong>
                                {deal.risk > 0 && <Badge variant="destructive">리스크 {deal.risk}건</Badge>}
                              </span>
                              <span className="mt-2 block text-sm text-muted-foreground">
                                받을 원금 {deal.amount}
                              </span>
                              <span className="mt-1 block text-sm text-muted-foreground">담당자 {deal.owner}</span>
                              <ChevronRight className="mt-2 ml-auto size-4 text-muted-foreground" />
                            </button>
                          ))}
                          {!stageDeals.length && (
                            <p className="py-6 text-center text-xs text-muted-foreground">해당 단계의 거래가 없습니다.</p>
                          )}
                        </div>
                      </section>
                    )
                  })
                )}
              </div>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>영업 활동</CardTitle>
                  <CardDescription>거래처와 주고받은 최근 활동을 시간순으로 확인합니다.</CardDescription>
                </CardHeader>
                <CardContent>
                {(selected.deals === 0 ? [] : [
                  { type: "견적서 전달", time: "2026.07.31 16:20", description: "견적서를 고객에게 전달했습니다.", deal: "DL-260707-04" },
                  { type: "연락처 업데이트", time: "2026.07.30 11:02", description: "전화번호와 담당 범위를 업데이트했습니다.", deal: "DL-260707-04" },
                  { type: "Deal 연결", time: "2026.07.29 09:14", description: "연락처를 거래 담당자로 연결했습니다.", deal: "DL-260918-91" },
                ].filter((event) => selected.dealIds.includes(event.deal))).map((event) => (
                  <div
                    key={`${event.type}-${event.time}`}
                    className="flex gap-3 border-b py-3 text-sm last:border-b-0"
                  >
                    <Clock3 className="mt-0.5 size-4 text-muted-foreground" />
                    <div className="min-w-0">
                      <p>{event.type} · {event.time}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                      <button type="button" onClick={() => onOpenDeal?.(event.deal)} className="mt-1 text-sm font-medium text-primary hover:underline">{event.deal} 거래 보기</button>
                    </div>
                  </div>
                ))}
                {!selected.dealIds.some((id) => ["DL-260707-04", "DL-260918-91"].includes(id)) ? <p className="py-4 text-sm text-muted-foreground">활동 이력이 없습니다.</p> : null}
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle>영업 후속 일정</CardTitle>
                      <CardDescription>선택한 거래처의 다음 연락과 확인 일정을 관리합니다.</CardDescription>
                    </div>
                    <Button size="sm" variant="outline">일정 추가</Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3">
                {(selected.id === "anna-keller" ? [
                  { date: "오늘 16:00", title: "계약 조건 확인", detail: `${selected.company} · DL-260707-04`, tone: "bg-amber-50 text-amber-800" },
                  { date: "11월 12일", title: "선적 일정 공유", detail: `${selected.company} · DL-260625-07`, tone: "bg-blue-50 text-blue-800" },
                ] : selected.deals > 0 ? [
                  { date: "이번 주", title: "거래 진행 상황 확인", detail: `${selected.company} · 담당자 ${selected.name}`, tone: "bg-blue-50 text-blue-800" },
                ] : []).map((followup) => (
                  <div key={followup.title} className="flex items-start justify-between gap-3 rounded-[var(--r-lg)] border border-[var(--color-gray-9)] bg-background p-4 shadow-[var(--shadow-card)]">
                    <div className="min-w-0">
                      <Badge className={cn("mb-2 border-0", followup.tone)}>{followup.date}</Badge>
                      <p className="font-semibold">{followup.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{followup.detail}</p>
                    </div>
                    <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </div>
                ))}
                {selected.id !== "anna-keller" && selected.deals === 0 ? <p className="py-4 text-sm text-muted-foreground">예정된 후속 일정이 없습니다.</p> : null}
                </CardContent>
              </Card>
            </div>
          </div>
          </>}
        </section>
      </div>
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "연락처 수정" : "연락처 추가"}</DialogTitle>
            <DialogDescription>거래에 연결할 담당자 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); saveContact() }}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium">
                이름 <Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                구분
                <Select value={form.kind} onValueChange={(value) => setForm({ ...form, kind: value })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="counterparty">거래처 담당자</SelectItem>
                    <SelectItem value="internal">조직 구성원</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                회사 <Input value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                직함 <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                이메일 <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                전화 <Input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </label>
            </div>
            <label className="grid gap-1.5 text-sm font-medium">
              메모 <Textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>취소</Button>
              <Button type="submit" disabled={!form.name.trim()}>저장</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppPage>
  )
}

import { SimpleFormField } from "@shared/components/form-field"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@ecoya/design-system/ui/empty"
import { createContext, useContext, useState, type ReactNode } from "react"
import { Button } from "@shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@shared/components/ui/dialog"
import { Input } from "@shared/components/ui/input"
import { Textarea } from "@shared/components/ui/textarea"
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
import { settlementLedgerRows } from "@trade-os/lib/erp-menu-samples"

type Document = { code: string; type: string; file: string }
type Item = {
  id: number
  goods: string
  quantity: string
  quantityUnit: string
}
type Relation = {
  id: string
  source: string
  target: string
  itemId: number
  quantity: number
}
type Timing = {
  code: string
  due: string
  status: string
  shipment: string
  evidence: string
  note: string
}
type History = {
  id: string
  scope: string
  description: string
  reason: string
  actor: string
  at: string
}
type State = {
  relations: Relation[]
  timings: Timing[]
  bindings: Record<number, string>
  history: History[]
}
type Context = {
  state: State
  canEdit: boolean
  dealId: string
  direction: string
  counterparty: string
  documents: Document[]
  items: Item[]
  update: (
    next: (state: State) => State,
    scope: string,
    description: string,
    reason: string
  ) => void
  onOpenSettlement: () => void
}
const ToolsContext = createContext<Context | null>(null)
function useTools() {
  const value = useContext(ToolsContext)
  if (!value) throw new Error("Deal tools require their deal provider")
  return value
}

// The current app uses a local adapter. Keep these review records within the
// mounted deal; they do not claim to mutate shipment, settlement, or Go APIs.
export function DealHandoffProvider({
  children,
  dealId,
  role,
  direction,
  counterparty,
  documents,
  items,
  addAudit,
  onOpenSettlement,
}: {
  children: ReactNode
  dealId: string
  role: string
  direction: string
  counterparty: string
  documents: Document[]
  items: Item[]
  addAudit: (action: string, detail: string) => void
  onOpenSettlement: () => void
}) {
  const [state, setState] = useState<State>({
    relations: [],
    timings: [],
    bindings: {},
    history: [],
  })
  const canEdit = role === "owner" || role === "admin"
  const update: Context["update"] = (next, scope, description, reason) => {
    if (!canEdit || !reason.trim()) return
    const event = {
      id: crypto.randomUUID(),
      scope,
      description,
      reason: reason.trim(),
      actor: role === "admin" ? "박서윤" : "조민영",
      at: new Date().toLocaleString("ko-KR"),
    }
    setState((current) => ({
      ...next(current),
      history: [event, ...current.history],
    }))
    addAudit(description, `${reason.trim()} · 로컬 검토 기록`)
  }
  return (
    <ToolsContext.Provider
      value={{
        state,
        canEdit,
        update,
        dealId,
        direction,
        counterparty,
        documents,
        items,
        onOpenSettlement,
      }}
    >
      {children}
    </ToolsContext.Provider>
  )
}

function Choice({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <SimpleFormField label={label}>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="z-[var(--z-popup)]">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SimpleFormField>
  )
}
function ToolDialog({
  title,
  trigger,
  children,
  open,
  onOpenChange,
}: {
  title: string
  trigger?: ReactNode
  children: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[85dvh] min-w-0 overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            로컬 샘플 · 검토 기록은 이 거래 화면을 보는 동안 유지됩니다.
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
function Changes({ scope }: { scope: string }) {
  const { state } = useTools()
  const events = state.history.filter((event) => event.scope === scope)
  return (
    <details className="rounded-md border p-3">
      <summary className="cursor-pointer text-sm font-medium">
        변경 이력 ({events.length})
      </summary>
      <div className="mt-3 grid gap-3 text-xs">
        {events.length ? (
          events.map((event) => (
            <div key={event.id}>
              <p className="font-medium">{event.description}</p>
              <p>{event.reason}</p>
              <p className="text-muted-foreground">
                {event.actor} · {event.at}
              </p>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">아직 변경 기록이 없습니다.</p>
        )}
      </div>
    </details>
  )
}
function Reason({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <SimpleFormField label="변경 사유">
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="연결·변경 근거를 입력하세요"
      />
    </SimpleFormField>
  )
}

export function DealDocumentTools({
  availableDocuments,
  onOpenDocument,
}: {
  availableDocuments: Document[]
  onOpenDocument: (code: string) => void
}) {
  const { state, update, canEdit, items } = useTools()
  const [mode, setMode] = useState<"relations" | "timing" | null>(null)
  const available = availableDocuments.filter((doc) => doc.file)
  const sources = available.filter((doc) =>
    ["PO", "SC", "CI"].includes(doc.code)
  )
  const [source, setSource] = useState("SC")
  const [target, setTarget] = useState("CI")
  const [itemId, setItemId] = useState(String(items[0]?.id ?? ""))
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const [unlinkId, setUnlinkId] = useState<string | null>(null)
  const [timing, setTiming] = useState<Timing>({
    code: "BL",
    due: "",
    status: "준비 중",
    shipment: "none",
    evidence: "none",
    note: "",
  })
  const item = items.find((row) => String(row.id) === itemId)
  const targets = available.filter((doc) =>
    (({ PO: ["SC"], SC: ["CI"], CI: ["PL"] })[source] ?? []).includes(doc.code)
  )
  const linked = state.relations
    .filter((row) => row.source === source && row.itemId === Number(itemId))
    .reduce((sum, row) => sum + row.quantity, 0)
  const targetLinked = state.relations
    .filter((row) => row.target === target && row.itemId === Number(itemId))
    .reduce((sum, row) => sum + row.quantity, 0)
  const capacity = Number(item?.quantity ?? 0)
  // Existing PL evidence has 12 MT / 4 MT, while the contract has 12 / 8 MT.
  const targetCapacity = target === "PL" && item?.id === 2 ? 4 : capacity
  const remaining = Math.max(
    0,
    Math.min(capacity - linked, targetCapacity - targetLinked)
  )
  const documentName = (code: string) =>
    availableDocuments.find((doc) => doc.code === code)?.file || code
  const changeMode = (next: typeof mode) => {
    setMode(next)
    setError("")
    setReason("")
    setUnlinkId(null)
  }
  function saveRelation() {
    const amount = Number(quantity)
    if (!canEdit) return
    if (!reason.trim()) return setError("변경 사유를 입력하세요.")
    if (
      !item ||
      !sources.some((doc) => doc.code === source) ||
      !targets.some((doc) => doc.code === target)
    )
      return setError("현재 거래에 연결된 원천과 대상 문서를 선택하세요.")
    if (!Number.isFinite(amount) || amount <= 0 || amount > remaining)
      return setError(
        `연결 수량은 0보다 크고 잔여 ${remaining} ${item.quantityUnit} 이하여야 합니다.`
      )
    if (
      state.relations.some(
        (row) =>
          row.source === source &&
          row.target === target &&
          row.itemId === item.id
      )
    )
      return setError(
        "이미 연결된 품목입니다. 기존 관계를 확인하고 필요하면 해제 후 다시 연결하세요."
      )
    update(
      (current) => ({
        ...current,
        relations: [
          ...current.relations,
          {
            id: crypto.randomUUID(),
            source,
            target,
            itemId: item.id,
            quantity: amount,
          },
        ],
      }),
      "relations",
      `${source} → ${target} · ${item.goods} ${amount} ${item.quantityUnit} 관계 연결`,
      reason
    )
    setError("")
    setReason("")
    setQuantity("")
  }
  function saveTiming() {
    if (!canEdit) return
    if (!reason.trim()) return setError("변경 사유를 입력하세요.")
    if (!timing.due || !Number.isFinite(new Date(timing.due).getTime()))
      return setError("필요 일시를 입력하세요.")
    if (
      ["확보 · 검토 대기", "검토 완료"].includes(timing.status) &&
      !available.some(
        (doc) => doc.code === timing.evidence && doc.code === timing.code
      )
    )
      return setError("해당 종류의 확보 문서를 근거로 선택하세요.")
    update(
      (current) => ({
        ...current,
        timings: [
          ...current.timings.filter((row) => row.code !== timing.code),
          timing,
        ],
      }),
      "timing",
      `${timing.code} 준비 계획 저장 · ${timing.status}`,
      reason
    )
    setError("")
    setReason("")
  }
  return (
    <>
      <div className="flex flex-wrap gap-1 py-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => changeMode("relations")}
        >
          품목 관계{state.relations.length ? ` ${state.relations.length}` : ""}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => changeMode("timing")}>
          서류 준비 기한{state.timings.length ? ` ${state.timings.length}` : ""}
        </Button>
      </div>
      <ToolDialog
        title={mode === "relations" ? "문서 간 품목 관계" : "서류 준비 기한"}
        open={mode !== null}
        onOpenChange={(open) => {
          if (!open) changeMode(null)
        }}
      >
        {mode === "relations" ? (
          <>
            <p className="text-xs text-muted-foreground">
              문서 사이의 품목·수량을 연결합니다. 관계를 해제해도 문서는 이
              거래에 남습니다.
            </p>
            <div className="min-w-0 rounded-md border p-2.5">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    {["원천 → 대상", "품목", "연결량", "조치"].map((label) => (
                      <TableHead key={label}>{label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.relations.length ? (
                    state.relations.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          {documentName(row.source)} →{" "}
                          {documentName(row.target)}
                        </TableCell>
                        <TableCell>
                          {items.find((item) => item.id === row.itemId)?.goods}
                        </TableCell>
                        <TableCell>{row.quantity} MT</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                changeMode(null)
                                onOpenDocument(row.source)
                              }}
                            >
                              원천 보기
                            </Button>
                            {canEdit && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setUnlinkId(row.id)
                                  setReason("")
                                  setError("")
                                }}
                              >
                                관계 해제
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4}>
                        연결된 품목 관계가 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {canEdit &&
              (unlinkId ? (
                <>
                  <p>
                    선택한 품목 관계만 해제합니다. 문서의 거래 연결은
                    유지됩니다.
                  </p>
                  <Reason value={reason} onChange={setReason} />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (!reason.trim())
                          return setError("변경 사유를 입력하세요.")
                        const relation = state.relations.find(
                          (row) => row.id === unlinkId
                        )
                        if (!relation) return
                        update(
                          (current) => ({
                            ...current,
                            relations: current.relations.filter(
                              (row) => row.id !== unlinkId
                            ),
                          }),
                          "relations",
                          `${relation.source} → ${relation.target} 품목 관계 해제`,
                          reason
                        )
                        setUnlinkId(null)
                        setReason("")
                        setError("")
                      }}
                    >
                      관계 해제 확인
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUnlinkId(null)
                        setReason("")
                        setError("")
                      }}
                    >
                      취소
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Choice
                      label="원천 문서"
                      value={source}
                      options={sources.map((doc) => ({
                        value: doc.code,
                        label: doc.file,
                      }))}
                      onChange={(value) => {
                        setSource(value)
                        setTarget(
                          { PO: "SC", SC: "CI", CI: "PL" }[value] ?? "CI"
                        )
                        setError("")
                      }}
                    />
                    <Choice
                      label="대상 문서"
                      value={target}
                      options={targets.map((doc) => ({
                        value: doc.code,
                        label: doc.file,
                      }))}
                      onChange={setTarget}
                    />
                  </div>
                  <Choice
                    label="연결할 품목"
                    value={itemId}
                    options={items.map((row) => ({
                      value: String(row.id),
                      label: row.goods,
                    }))}
                    onChange={setItemId}
                  />
                  <p className="text-sm" role="status">
                    원천 {capacity} {item?.quantityUnit} · 연결 {linked}{" "}
                    {item?.quantityUnit} · 연결 가능 잔여 {remaining}{" "}
                    {item?.quantityUnit}
                  </p>
                  <label className="grid gap-1.5 text-sm">
                    연결 수량 ({item?.quantityUnit})
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                    />
                  </label>
                  <Reason value={reason} onChange={setReason} />
                  <Button className="justify-self-end" onClick={saveRelation}>
                    품목 관계 연결
                  </Button>
                </>
              ))}
            <Changes scope="relations" />
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              기한과 확보 근거를 거래 안에 기록합니다. 요청 기록은 상대방에게
              메시지를 보내지 않습니다.
            </p>
            {state.timings.length > 0 && (
              <div className="min-w-0 rounded-md border p-2.5">
                <Table className="min-w-[520px]">
                  <TableHeader>
                    <TableRow>
                      {[
                        "서류",
                        "필요 일시",
                        "준비 상태",
                        "확보 근거",
                        "조치",
                      ].map((label) => (
                        <TableHead key={label}>{label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.timings.map((row) => (
                      <TableRow key={row.code}>
                        <TableCell>{row.code}</TableCell>
                        <TableCell>{row.due.replace("T", " ")}</TableCell>
                        <TableCell>{row.status}</TableCell>
                        <TableCell>
                          {row.evidence === "none"
                            ? "미확보"
                            : documentName(row.evidence)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setTiming(row)
                              setError("")
                              setReason("")
                            }}
                          >
                            {canEdit ? "수정" : "보기"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Choice
                label="준비할 서류"
                value={timing.code}
                options={availableDocuments.map((doc) => ({
                  value: doc.code,
                  label: doc.type,
                }))}
                disabled={!canEdit}
                onChange={(code) => {
                  setTiming(
                    state.timings.find((row) => row.code === code) ?? {
                      code,
                      due: "",
                      status: "준비 중",
                      shipment: "none",
                      evidence: "none",
                      note: "",
                    }
                  )
                  setError("")
                  setReason("")
                }}
              />
              <SimpleFormField label="필요 일시">
                <Input
                  type="datetime-local"
                  disabled={!canEdit}
                  value={timing.due}
                  onChange={(event) =>
                    setTiming({ ...timing, due: event.target.value })
                  }
                />
              </SimpleFormField>
              <Choice
                label="준비 상태"
                value={timing.status}
                options={[
                  "준비 중",
                  "요청 기록",
                  "확보 · 검토 대기",
                  "검토 완료",
                ].map((value) => ({ value, label: value }))}
                disabled={!canEdit}
                onChange={(status) => setTiming({ ...timing, status })}
              />
              <Choice
                label="관련 선적"
                value={timing.shipment}
                options={[
                  { value: "none", label: "거래 전체" },
                  ...["014W-01", "014W-02", "014W-03"].map((value) => ({
                    value,
                    label: value,
                  })),
                ]}
                disabled={!canEdit}
                onChange={(shipment) => setTiming({ ...timing, shipment })}
              />
            </div>
            <Choice
              label="확보 근거 문서"
              value={timing.evidence}
              options={[
                { value: "none", label: "미확보" },
                ...available
                  .filter((doc) => doc.code === timing.code)
                  .map((doc) => ({ value: doc.code, label: doc.file })),
              ]}
              disabled={!canEdit}
              onChange={(evidence) => setTiming({ ...timing, evidence })}
            />
            <label className="grid gap-1.5 text-sm">
              준비 메모
              <Textarea
                disabled={!canEdit}
                value={timing.note}
                onChange={(event) =>
                  setTiming({ ...timing, note: event.target.value })
                }
              />
            </label>
            {canEdit && (
              <>
                <Reason value={reason} onChange={setReason} />
                <Button className="justify-self-end" onClick={saveTiming}>
                  준비 계획 저장
                </Button>
              </>
            )}
            <Changes scope="timing" />
          </>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {!canEdit && (
          <p className="text-xs text-muted-foreground">
            Owner 또는 관리자만 변경할 수 있습니다.
          </p>
        )}
      </ToolDialog>
    </>
  )
}

export function DealContractTool() {
  const { items, documents, direction } = useTools()
  const [open, setOpen] = useState(false)
  const source = documents.find(
    (doc) => doc.code === (direction === "sales" ? "SC" : "PO") && doc.file
  )
  if (!source || !items.length) return null
  return (
    <ToolDialog
      title="계약 품목별 수량"
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button size="sm" variant="outline">
          품목별 수량
        </Button>
      }
    >
      <p className="text-sm">계약 원천: {source.file}</p>
      <div className="min-w-0 rounded-md border p-2.5">
        <Table className="min-w-[560px]">
          <TableHeader>
            <TableRow>
              {["품목", "단위", "계약량", "선적 근거량", "미선적 잔여"].map(
                (label) => (
                  <TableHead key={label}>{label}</TableHead>
                )
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const shipped = item.id === 2 ? 4 : Number(item.quantity)
              return (
                <TableRow key={item.id}>
                  <TableCell>{item.goods}</TableCell>
                  <TableCell>{item.quantityUnit}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{shipped}</TableCell>
                  <TableCell>{Number(item.quantity) - shipped}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        선적 근거: PackingList_0707.pdf · 계약 20 MT / 포장명세 16 MT. 계약 배정
        내역은 아직 연결되지 않아 선적 근거량과 구분합니다.
      </p>
    </ToolDialog>
  )
}

export function DealClaimTool() {
  const { onOpenSettlement, dealId, counterparty, direction } = useTools()
  const source =
    dealId === "DL-260708-01"
      ? { file: "Invoice_HB-2607-003.pdf", amount: "2,566,000 USD" }
      : null
  const candidates = settlementLedgerRows.filter(
    (row) =>
      row.deal === dealId ||
      (counterparty.trim() &&
        (counterparty.includes(row.party) || row.party.includes(counterparty)))
  )
  return (
    <section aria-label="청구 일정 대조" className="space-y-3 border-t pt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">청구 일정 대조</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            송장과 정산 일정을 대조합니다.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onOpenSettlement}>
          정산에서 일정 확인
        </Button>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-md bg-muted/40 px-3 py-2 text-sm">
        <span className="break-all">
          {source?.file ?? "원천 송장 확인 필요"}
        </span>
        <strong className="tabular-nums">{source?.amount ?? "—"}</strong>
        <span>
          {direction === "sales"
            ? "수취"
            : direction === "purchase"
              ? "지급"
              : "방향 확인 필요"}
        </span>
      </div>
      <Table aria-label="청구 일정 대조 결과" className="min-w-[640px]">
        <TableHeader>
          <TableRow>
            {["정산 일정 / 거래", "금액·방향", "상태", "대조 결과"].map(
              (label) => (
                <TableHead key={label}>{label}</TableHead>
              )
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <strong>{row.id}</strong>
                <small className="mt-1 block text-muted-foreground">
                  {row.party} · {row.deal}
                </small>
              </TableCell>
              <TableCell className="tabular-nums">
                {row.amount} · {row.type === "AR" ? "수취" : "지급"}
              </TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell>
                {row.deal !== dealId
                  ? "다른 거래 · 연결 불가"
                  : !source
                    ? "원천 송장 확인 필요"
                    : row.amount !== source.amount
                      ? "원문 금액 불일치"
                      : row.type !== (direction === "sales" ? "AR" : "AP")
                        ? "방향 불일치"
                        : "출처 확인 필요"}
              </TableCell>
            </TableRow>
          ))}
          {!candidates.length && (
            <TableRow>
              <TableCell colSpan={4} className="p-0 whitespace-normal">
                <Empty className="min-h-40">
                  <EmptyHeader>
                    <EmptyTitle>
                      현재 거래에 해당하는 일정 후보가 없습니다.
                    </EmptyTitle>
                    <EmptyDescription>
                      정산에서 이 거래에 연결할 일정을 확인해 주세요.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </section>
  )
}

const masterParties = [
  "KATAMAN ASIA-PACIFIC PTE LTD",
  "ECOYA Demo Co.",
  "KATAMAN Australia",
  "JPMorgan Chase Singapore",
  "ACME GmbH",
  "Nordic Raw Materials AB",
]
export function DealPartyTool({
  party,
}: {
  party: { id: number; name: string; role: string; source: string }
}) {
  const { state, update, canEdit } = useTools()
  const [open, setOpen] = useState(false)
  const [candidate, setCandidate] = useState("none")
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const binding = state.bindings[party.id]
  if (party.source !== "문서") return null
  function save() {
    if (!canEdit) return
    if (!reason.trim()) return setError("변경 사유를 입력하세요.")
    if (candidate === "none" && !binding)
      return setError("연결할 등록 거래처를 선택하세요.")
    if (candidate === binding)
      return setError("현재 연결과 같습니다. 다른 거래처를 선택하세요.")
    const description = `${party.role} 등록 거래처 ${candidate === "none" ? "연결 해제" : binding ? "연결 변경" : "연결"} · ${binding ?? "미연결"} → ${candidate === "none" ? "미연결" : candidate}`
    update(
      (current) => {
        const bindings = { ...current.bindings }
        if (candidate === "none") delete bindings[party.id]
        else bindings[party.id] = candidate
        return { ...current, bindings }
      },
      `party:${party.id}`,
      description,
      reason
    )
    setReason("")
    setError("")
  }
  return (
    <ToolDialog
      title={`${party.role} · 등록 거래처 연결`}
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (value) {
          setCandidate(
            binding ??
              (masterParties.includes(party.name) ? party.name : "none")
          )
          setReason("")
          setError("")
        }
      }}
      trigger={
        <Button
          size="sm"
          variant="outline"
          aria-label={`${party.role} 등록 거래처 연결`}
        >
          {binding ? "연결됨" : "거래처 연결"}
        </Button>
      }
    >
      <div className="rounded-md border p-3 text-sm">
        <p>문서상 이름: {party.name}</p>
        <p>문서상 역할: {party.role}</p>
        <p className="mt-2">현재 연결: {binding ?? "미연결"}</p>
      </div>
      <Choice
        label="등록 거래처 후보"
        value={candidate}
        options={[
          { value: "none", label: binding ? "연결 해제" : "선택하세요" },
          ...masterParties.map((value) => ({ value, label: value })),
        ]}
        disabled={!canEdit}
        onChange={setCandidate}
      />
      {canEdit && (
        <>
          <Reason value={reason} onChange={setReason} />
          <Button className="justify-self-end" onClick={save}>
            {candidate === "none" && binding
              ? "거래처 연결 해제"
              : "거래처 연결 저장"}
          </Button>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Changes scope={`party:${party.id}`} />
    </ToolDialog>
  )
}

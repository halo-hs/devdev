import { useCallback, useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { SettingsRole } from "./SettingsRoutePage"

type Master = {
  id: string
  name: string
  registration: string
  role: "both" | "buyer" | "seller"
  status: "active" | "archived" | "merged"
}
type Alias = { id: string; name: string; masterId: string | null }
type Data = { masters: Master[]; aliases: Alias[] }
const initial: Data = {
  masters: [
    {
      id: "acme",
      name: "ACME GmbH",
      registration: "DE123456789",
      role: "buyer",
      status: "active",
    },
    {
      id: "kataman",
      name: "KATAMAN ASIA-PACIFIC PTE LTD",
      registration: "",
      role: "seller",
      status: "active",
    },
    {
      id: "acme-old",
      name: "ACME Germany",
      registration: "",
      role: "both",
      status: "active",
    },
  ],
  aliases: [
    { id: "a1", name: "ACME", masterId: "acme" },
    { id: "a2", name: "ACME GMBH", masterId: "acme" },
    { id: "a3", name: "KATAMAN", masterId: "kataman" },
    { id: "a4", name: "Kataman APAC", masterId: "kataman" },
    { id: "a5", name: "ACME Germany", masterId: null },
  ],
}
// Local preview data only. Production merge must use the v2 preview/execute contract.
export const aliasPreview = {
  async read(key: string): Promise<Data> {
    const stored = localStorage.getItem(key)
    if (!stored) return structuredClone(initial)
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed.masters) || !Array.isArray(parsed.aliases))
      throw new Error("잘못된 기준 정보")
    return parsed
  },
  async save(key: string, data: Data) {
    localStorage.setItem(key, JSON.stringify(data))
  },
}
const roles = { both: "매입처·매출처", buyer: "매출처", seller: "매입처" }
const statuses = { active: "사용 중", archived: "보관", merged: "병합됨" }
const newMaster = (): Master => ({
  id: crypto.randomUUID(),
  name: "",
  registration: "",
  role: "both",
  status: "active",
})

export function AliasesPage({ role }: { role: SettingsRole }) {
  const canEdit = role === "owner" || role === "admin"
  const key = `ecoya.preview.aliases.v1:${localStorage.getItem("ecoya.preview.workspace") ?? "ecoya"}`
  const [data, setData] = useState<Data | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [editor, setEditor] = useState<Master | null>(null)
  const [aliasOpen, setAliasOpen] = useState(false)
  const [aliasName, setAliasName] = useState("")
  const [canonical, setCanonical] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Alias | null>(null)
  const [merge, setMerge] = useState<{ source: Master; target: Master } | null>(
    null
  )
  const [repairResult, setRepairResult] = useState("")
  const load = useCallback(async () => {
    setState("loading")
    try {
      setData(await aliasPreview.read(key))
      setState("ready")
    } catch {
      setState("error")
    }
  }, [key])
  useEffect(() => {
    void load()
  }, [load])
  const write = async (next: Data, done: () => void) => {
    if (!canEdit || busy) return
    setBusy(true)
    setError("")
    try {
      await aliasPreview.save(key, next)
      setData(next)
      done()
    } catch {
      setError(
        "변경을 저장하지 못했습니다. 입력한 내용을 유지한 채 다시 시도해 주세요."
      )
    } finally {
      setBusy(false)
    }
  }
  const ready = state === "ready" && data !== null
  const orphanAliases =
    data?.aliases.filter(
      (alias) => !data.masters.some((master) => master.id === alias.masterId)
    ) ?? []
  const duplicate = data?.masters.find(
    (master) => master.id === "acme-old" && master.status === "active"
  )
  const target = data?.masters.find(
    (master) => master.id === "acme" && master.status === "active"
  )
  const candidates =
    data?.masters.filter(
      (master) =>
        master.status === "active" &&
        aliasName.trim() &&
        master.name.toLowerCase().includes(aliasName.trim().toLowerCase())
    ) ?? []
  const closeDialogs = () => {
    if (!busy) {
      setEditor(null)
      setAliasOpen(false)
      setDeleteTarget(null)
      setMerge(null)
      setError("")
    }
  }
  const repair = async () => {
    if (!data) return
    let repaired = 0
    const aliases = data.aliases.map((alias) => {
      if (data.masters.some((master) => master.id === alias.masterId))
        return alias
      const exact = data.masters.filter(
        (master) =>
          master.status === "active" &&
          master.name.trim().toLowerCase() === alias.name.trim().toLowerCase()
      )
      if (exact.length !== 1) return alias
      repaired += 1
      return { ...alias, masterId: exact[0].id }
    })
    await write({ ...data, aliases }, () =>
      setRepairResult(
        `확인 ${data.aliases.length}건 · 복구 ${repaired}건 · 생성 0건`
      )
    )
  }
  return (
    <div className="space-y-8 break-keep">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">거래처 별칭 학습</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            문서에서 읽은 거래처 표현을 기준 거래처에 연결하고 중복 후보를
            검토합니다.
          </p>
        </div>
        {canEdit && (
          <Button
            disabled={!ready}
            onClick={() => {
              setAliasName("")
              setCanonical("")
              setError("")
              setAliasOpen(true)
            }}
          >
            별칭 추가
          </Button>
        )}
      </header>
      <section aria-label="기준 거래처와 별칭">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">
            기준 거래처{" "}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {ready ? data.masters.length : "—"}
            </span>
          </h2>
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              disabled={!ready}
              onClick={() => {
                setError("")
                setEditor(newMaster())
              }}
            >
              거래처 추가
            </Button>
          )}
        </div>
        {state === "loading" ? (
          <p
            role="status"
            className="rounded-[var(--r-lg)] bg-[var(--color-gray-12)] px-5 shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)] py-8 text-sm text-muted-foreground"
          >
            거래처와 별칭을 불러오는 중입니다.
          </p>
        ) : state === "error" ? (
          <div role="alert" className="rounded-[var(--r-lg)] bg-[var(--color-gray-12)] px-5 shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)] py-6">
            <p className="mb-3 text-sm">
              거래처와 별칭을 불러오지 못했습니다. 다시 확인해 주세요.
            </p>
            <Button size="sm" variant="outline" onClick={() => void load()}>
              다시 시도
            </Button>
          </div>
        ) : (
          data && (
            <ul className="divide-y rounded-[var(--r-lg)] bg-[var(--color-gray-12)] px-5 shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)]">
              {data.masters.length === 0 && (
                <li className="py-8 text-sm text-muted-foreground">
                  등록된 거래처가 없습니다. 거래처를 추가해 별칭을 연결하세요.
                </li>
              )}
              {data.masters.map((master) => (
                <li
                  key={master.id}
                  className="flex flex-wrap items-center gap-3 py-5"
                >
                  <div className="min-w-0 flex-1 basis-60">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-medium break-words">
                        {master.name}
                      </h3>
                      <Badge variant="outline">{roles[master.role]}</Badge>
                      <Badge variant="secondary">
                        {statuses[master.status]}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {data.aliases
                        .filter((alias) => alias.masterId === master.id)
                        .map((alias) => alias.name)
                        .join(" · ") || "학습된 별칭이 없습니다."}
                    </p>
                  </div>
                  {canEdit && master.status !== "merged" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-auto"
                      onClick={() => {
                        setError("")
                        setEditor({ ...master })
                      }}
                    >
                      수정
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )
        )}
      </section>
      <section>
        <h2 className="mb-3 text-base font-semibold">
          묶지 못한 별칭{" "}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {ready ? orphanAliases.length : "—"}
          </span>
        </h2>
        {ready && (
          <ul className="divide-y rounded-[var(--r-lg)] bg-[var(--color-gray-12)] px-5 shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)]">
            {orphanAliases.length === 0 ? (
              <li className="py-5 text-sm text-muted-foreground">
                모든 별칭이 거래처에 연결되어 있습니다.
              </li>
            ) : (
              orphanAliases.map((alias) => (
                <li
                  key={alias.id}
                  className="flex items-center justify-between gap-3 py-4 text-sm"
                >
                  <span className="min-w-0 break-words">{alias.name}</span>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setError("")
                        setDeleteTarget(alias)
                      }}
                    >
                      삭제
                    </Button>
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </section>
      {canEdit && (
        <>
          <section>
            <h2 className="mb-3 text-base font-semibold">
              중복 후보{" "}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {ready ? (duplicate && target ? 1 : 0) : "—"}
              </span>
            </h2>
            {ready &&
              (duplicate && target ? (
                <div className="rounded-[var(--r-lg)] bg-[var(--color-gray-12)] px-5 shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)] py-5">
                  <p className="text-sm font-medium">
                    {duplicate.name} · {target.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    이름 유사도 94% · 유지할 거래처를 선택해 병합 영향을
                    확인하세요.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMerge({ source: duplicate, target })}
                    >
                      {target.name} 유지
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setMerge({ source: target, target: duplicate })
                      }
                    >
                      {duplicate.name} 유지
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="rounded-[var(--r-lg)] bg-[var(--color-gray-12)] px-5 shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)] py-5 text-sm text-muted-foreground">
                  확인할 중복 후보가 없습니다.
                </p>
              ))}
          </section>
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--r-lg)] bg-[var(--color-gray-12)] px-5 shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)] py-5">
            <div className="min-w-0 flex-1 basis-60">
              <h2 className="text-base font-semibold">기준 정보 유지보수</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                거래처명이 정확히 일치하는 미연결 별칭을 복구합니다.
              </p>
              {repairResult && (
                <p role="status" className="mt-2 text-sm">
                  {repairResult}
                </p>
              )}
              {error && !editor && !aliasOpen && !deleteTarget && (
                <p role="alert" className="mt-2 text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!ready || busy}
              onClick={() => void repair()}
            >
              {busy ? "확인 중…" : "연결 복구"}
            </Button>
          </section>
        </>
      )}
      <Dialog
        open={Boolean(editor || aliasOpen || deleteTarget || merge)}
        onOpenChange={(open) => {
          if (!open) closeDialogs()
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto break-keep sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editor
                ? data?.masters.some((master) => master.id === editor.id)
                  ? "거래처 수정"
                  : "거래처 추가"
                : aliasOpen
                  ? "별칭 추가"
                  : merge
                    ? "병합 영향 미리보기"
                    : "별칭 삭제"}
            </DialogTitle>
            <DialogDescription className="break-keep">
              {merge
                ? "유지할 거래처와 연결된 자료의 영향을 확인합니다."
                : deleteTarget
                  ? "별칭만 삭제하며 기준 거래처와 기존 문서는 유지합니다."
                  : "문서에 사용되는 거래처 기준 정보를 관리합니다."}
            </DialogDescription>
          </DialogHeader>
          {editor && (
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm">
                거래처명
                <Input
                  value={editor.name}
                  onChange={(e) =>
                    setEditor({ ...editor, name: e.target.value })
                  }
                />
              </label>
              <label className="grid gap-2 text-sm">
                사업자등록번호
                <Input
                  value={editor.registration}
                  onChange={(e) =>
                    setEditor({ ...editor, registration: e.target.value })
                  }
                />
              </label>
              <label className="grid gap-2 text-sm">
                구분
                <Select
                  value={editor.role}
                  onValueChange={(value) =>
                    setEditor({
                      ...editor,
                      role: value as Master["role"],
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                  {Object.entries(roles).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="grid gap-2 text-sm">
                상태
                <Select
                  value={editor.status}
                  onValueChange={(value) =>
                    setEditor({
                      ...editor,
                      status: value as Master["status"],
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="active">사용 중</SelectItem>
                  <SelectItem value="archived">보관</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            </div>
          )}
          {aliasOpen && (
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm">
                문서에 적힌 별칭
                <Input
                  value={aliasName}
                  onChange={(e) => setAliasName(e.target.value)}
                />
              </label>
              <label className="grid gap-2 text-sm">
                기준 거래처
                <Select
                  value={canonical}
                  onValueChange={(value) => setCanonical(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="거래처 선택" />
                  </SelectTrigger>
                  <SelectContent>

                  {data?.masters
                    .filter((master) => master.status === "active")
                    .map((master) => (
                      <SelectItem key={master.id} value={master.id}>
                        {master.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              {candidates.length > 0 && (
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    이 거래처인가요?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {candidates.map((master) => (
                      <Button
                        key={master.id}
                        size="sm"
                        variant="outline"
                        onClick={() => setCanonical(master.id)}
                      >
                        {master.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {deleteTarget && <p className="text-sm">{deleteTarget.name}</p>}
          {merge && (
            <div className="space-y-4 text-sm">
              <dl className="grid grid-cols-[80px_1fr] gap-2">
                <dt className="text-muted-foreground">병합할 대상</dt>
                <dd>{merge.source.name}</dd>
                <dt className="text-muted-foreground">유지할 대상</dt>
                <dd>{merge.target.name}</dd>
              </dl>
              <p>
                병합되는 거래처는 비활성 상태로 남고, 기존 이력은 보존됩니다.
              </p>
              <div className="divide-y rounded-[var(--r-lg)] bg-[var(--color-gray-12)] px-5 shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)]">
                {[
                  "거래·문서·SNAP 연결",
                  "일정·정산·현금·조정",
                  "별칭·학습·보관 이력",
                  "원천 통화별 금액",
                  "필드 충돌·최신 버전",
                ].map((label) => (
                  <div key={label} className="flex justify-between gap-3 py-3">
                    <span>{label}</span>
                    <span className="text-muted-foreground">확인 필요</span>
                  </div>
                ))}
              </div>
              <p role="status" className="text-muted-foreground">
                병합 영향을 아직 확인할 수 없습니다. 모든 연결 정보와 충돌값을
                확인한 후 병합할 수 있습니다.
              </p>
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={closeDialogs}>
              {merge ? "닫기" : "취소"}
            </Button>
            {merge ? (
              <Button disabled>병합 확정</Button>
            ) : (
              <Button
                disabled={
                  busy ||
                  Boolean(editor && !editor.name.trim()) ||
                  Boolean(aliasOpen && (!aliasName.trim() || !canonical))
                }
                variant={deleteTarget ? "destructive" : "default"}
                onClick={() => {
                  if (!data) return
                  if (editor) {
                    const master = { ...editor, name: editor.name.trim() }
                    if (
                      data.masters.some(
                        (item) =>
                          item.id !== master.id &&
                          item.name.toLowerCase() === master.name.toLowerCase()
                      )
                    ) {
                      setError(
                        "같은 이름의 거래처가 있습니다. 기존 거래처를 확인하세요."
                      )
                      return
                    }
                    void write(
                      {
                        ...data,
                        masters: data.masters.some(
                          (item) => item.id === master.id
                        )
                          ? data.masters.map((item) =>
                              item.id === master.id ? master : item
                            )
                          : [...data.masters, master],
                      },
                      () => {
                        setEditor(null)
                        toast.success("거래처를 저장했습니다.")
                      }
                    )
                  } else if (aliasOpen) {
                    if (
                      data.aliases.some(
                        (alias) =>
                          alias.name.toLowerCase() ===
                          aliasName.trim().toLowerCase()
                      )
                    ) {
                      setError("이미 등록된 별칭입니다.")
                      return
                    }
                    void write(
                      {
                        ...data,
                        aliases: [
                          ...data.aliases,
                          {
                            id: crypto.randomUUID(),
                            name: aliasName.trim(),
                            masterId: canonical,
                          },
                        ],
                      },
                      () => {
                        setAliasOpen(false)
                        toast.success("별칭을 추가했습니다.")
                      }
                    )
                  } else if (deleteTarget)
                    void write(
                      {
                        ...data,
                        aliases: data.aliases.filter(
                          (alias) => alias.id !== deleteTarget.id
                        ),
                      },
                      () => {
                        setDeleteTarget(null)
                        toast.success("별칭을 삭제했습니다.")
                      }
                    )
                }}
              >
                {busy ? "저장 중…" : deleteTarget ? "삭제" : "저장"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

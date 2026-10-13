import { useCallback, useEffect, useState } from "react"
import { Button } from "@shared/components/ui/button"
import { Badge } from "@shared/components/ui/badge"
import { Input } from "@shared/components/ui/input"
import { Textarea } from "@shared/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table"

type Container = {
  id: string
  number: string | null
  identified: boolean
  photos: number
  job: string
}
type Job = {
  id: string
  shotAt: string
  receivedAt: string
  site: string
  worker: string
  status: "processing" | "complete" | "failed"
  failure?: string
}
type Allocation = {
  id: string
  container: string
  recipient: string
  deal: string
  shipment: string
  reason: string
  at: string
  actor: string
  liveShares: string[]
  deliveries: string[]
}
type Data = {
  canManage: boolean
  partial: boolean
  containers: Container[]
  jobs: Job[]
  allocations: Allocation[]
  releases: { id: string; reason: string; at: string }[]
}
const seed: Data = {
  canManage: true,
  partial: false,
  containers: [
    {
      id: "c1",
      number: "HMMU7820194",
      identified: true,
      photos: 8,
      job: "job-1",
    },
    {
      id: "c2",
      number: "ONEU1083275",
      identified: true,
      photos: 3,
      job: "job-1",
    },
    {
      id: "c3",
      number: "COSU2214870",
      identified: true,
      photos: 5,
      job: "job-2",
    },
    {
      id: "c4",
      number: "MSCU8425510",
      identified: true,
      photos: 0,
      job: "job-2",
    },
    { id: "c5", number: null, identified: false, photos: 2, job: "job-2" },
  ],
  jobs: [
    {
      id: "job-1",
      shotAt: "2026.10.08 09:00",
      receivedAt: "2026.10.08 09:20",
      site: "부산항 A 현장",
      worker: "김민지",
      status: "complete",
    },
    {
      id: "job-2",
      shotAt: "2026.10.08 10:00",
      receivedAt: "2026.10.08 10:30",
      site: "인천항 B 현장",
      worker: "박서윤",
      status: "complete",
    },
    {
      id: "job-3",
      shotAt: "2026.10.08 11:00",
      receivedAt: "2026.10.08 11:10",
      site: "부산항 A 현장",
      worker: "김민지",
      status: "failed",
      failure: "사진 파일을 처리하지 못했습니다.",
    },
  ],
  allocations: [
    {
      id: "al1",
      container: "c1",
      recipient: "KATAMAN ASIA-PACIFIC PTE LTD",
      deal: "DL-260708-01",
      shipment: "SHP-001",
      reason: "컨테이너 번호 일치",
      at: "2026.10.08 09:24",
      actor: "박서윤",
      liveShares: ["현장 사진 공유 · 2026.10.20 만료"],
      deliveries: ["2026.10.08 09:30 · 이메일 전달 완료"],
    },
    {
      id: "al2",
      container: "c3",
      recipient: "ACME GmbH",
      deal: "DL-260707-04",
      shipment: "SHP-002",
      reason: "담당자 직접 선택",
      at: "2026.10.08 10:34",
      actor: "조민영",
      liveShares: [],
      deliveries: ["2026.10.08 10:40 · 이메일 전달 완료 · 공유 철회됨"],
    },
  ],
  releases: [],
}
export const snapEvidencePreview = {
  async read(key: string): Promise<Data> {
    const raw = localStorage.getItem(key)
    if (!raw) return structuredClone(seed)
    const data = JSON.parse(raw)
    if (
      !Array.isArray(data.containers) ||
      !Array.isArray(data.jobs) ||
      !Array.isArray(data.allocations) ||
      !Array.isArray(data.releases)
    )
      throw new Error("근거 조회 실패")
    return data
  },
  async save(key: string, data: Data) {
    localStorage.setItem(key, JSON.stringify(data))
  },
}
const candidateFixtures = [
  {
    shipment: "SHP-003",
    deal: "DL-260708-01",
    recipient: "KATAMAN ASIA-PACIFIC PTE LTD",
  },
  { shipment: "SHP-004", deal: "DL-260707-04", recipient: "ACME GmbH" },
]
export function SnapEvidenceWorkspace({
  onDeal,
}: {
  onDeal: (id: string) => void
}) {
  const key = `ecoya.preview.snap-evidence.v1:${localStorage.getItem("ecoya.preview.workspace") ?? "ecoya"}`
  const [data, setData] = useState<Data | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")
  const [jobId, setJobId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [allocate, setAllocate] = useState<Container | null>(null)
  const [release, setRelease] = useState<Allocation | null>(null)
  const [selection, setSelection] = useState("")
  const [manual, setManual] = useState({
    deal: "",
    shipment: "",
    recipient: "",
  })
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const load = useCallback(async () => {
    setState("loading")
    try {
      setData(await snapEvidencePreview.read(key))
      setState("ready")
    } catch {
      setState("error")
    }
  }, [key])
  useEffect(() => {
    void load()
  }, [load])
  const close = () => {
    if (!busy) {
      setAllocate(null)
      setRelease(null)
      setError("")
    }
  }
  const write = async (next: Data) => {
    if (!data?.canManage || busy) return
    setBusy(true)
    setError("")
    try {
      await snapEvidencePreview.save(key, next)
      setData(next)
      setAllocate(null)
      setRelease(null)
    } catch {
      setError(
        "변경을 저장하지 못했습니다. 선택과 사유를 확인한 뒤 다시 시도해 주세요."
      )
    } finally {
      setBusy(false)
    }
  }
  if (state === "loading")
    return (
      <div role="status" className="py-12 text-sm text-muted-foreground">
        SNAP 근거를 불러오는 중입니다.
      </div>
    )
  if (state === "error" || !data)
    return (
      <div role="alert" className="space-y-3 rounded-md border p-5">
        <p>근거를 불러오지 못했습니다.</p>
        <Button variant="outline" onClick={() => void load()}>
          다시 시도
        </Button>
      </div>
    )
  const containers = data.containers
    .filter((container) => !jobId || container.job === jobId)
    .slice(0, 200)
  const pages = Math.max(1, Math.ceil(containers.length / 20))
  const visiblePage = Math.min(page, pages)
  const job = data.jobs.find((item) => item.id === jobId)
  const candidates = allocate?.id === "c2" ? candidateFixtures : []
  const candidate = candidates.find((item) => item.shipment === selection)
  const chosen = selection === "manual" ? manual : candidate
  return (
    <div className="space-y-8 break-keep">
      {(data.partial || data.containers.length > 200) && (
        <p role="status" className="rounded-md bg-warning/10 px-4 py-3 text-sm">
          일부만 보임 · 최근 컨테이너 최대 200개를 표시합니다. 받은 작업을
          선택해 확인하세요.
        </p>
      )}
      {job && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-muted px-4 py-3 text-sm">
          <span>
            작업 {job.receivedAt} · {job.site} · 컨테이너 {containers.length}개
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setJobId(null)
              setPage(1)
            }}
          >
            전체 컨테이너 보기
          </Button>
        </div>
      )}
      <section aria-label="컨테이너 근거">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">
            컨테이너{" "}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {containers.length}
            </span>
          </h2>
          <Button size="sm" variant="outline" onClick={() => void load()}>
            새로고침
          </Button>
        </div>
        {containers.length === 0 ? (
          <p className="border-y py-8 text-sm text-muted-foreground">
            {job?.status === "failed"
              ? "작업 처리에 실패해 컨테이너 근거를 확인할 수 없습니다. 아래 작업의 실패 이유를 확인하세요."
              : "아직 받은 컨테이너 근거가 없습니다."}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {containers
              .slice((visiblePage - 1) * 20, visiblePage * 20)
              .map((container) => {
                const allocation = data.allocations.find(
                  (item) => item.container === container.id
                )
                return (
                  <article
                    key={container.id}
                    className="min-w-0 rounded-lg border p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold break-all">
                        {container.number || "번호 미확인"}
                      </h3>
                      <Badge variant="secondary">
                        {!container.identified
                          ? "확인 필요"
                          : allocation
                            ? "배정됨"
                            : "미배정"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      현장 사진 {container.photos}장
                    </p>
                    <p className="mt-1 text-xs break-words text-muted-foreground">
                      {allocation?.recipient ||
                        (!container.identified
                          ? "원본 사진에서 컨테이너 번호를 확인하세요."
                          : "배정 대상 미선택")}
                    </p>
                    {allocation ? (
                      <Button
                        className="mt-4 max-w-full"
                        size="sm"
                        variant="outline"
                        onClick={() => onDeal(allocation.deal)}
                      >
                        연결 거래 보기
                      </Button>
                    ) : (
                      data.canManage &&
                      container.identified && (
                        <Button
                          className="mt-4"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAllocate(container)
                            setSelection("")
                            setManual({ deal: "", shipment: "", recipient: "" })
                            setReason("")
                            setError("")
                          }}
                        >
                          배정
                        </Button>
                      )
                    )}
                  </article>
                )
              })}
          </div>
        )}
        {pages > 1 && (
          <nav
            aria-label="컨테이너 페이지"
            className="mt-4 flex justify-end gap-3"
          >
            <Button
              size="sm"
              variant="outline"
              disabled={visiblePage === 1}
              onClick={() => setPage(visiblePage - 1)}
            >
              이전
            </Button>
            <span className="self-center text-sm">
              {visiblePage} / {pages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={visiblePage === pages}
              onClick={() => setPage(visiblePage + 1)}
            >
              다음
            </Button>
          </nav>
        )}
      </section>
      <section aria-label="받은 작업 목록">
        <h2 className="mb-3 text-base font-semibold">
          받은 작업{" "}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {data.jobs.length}
          </span>
        </h2>
        {data.jobs.length === 0 ? (
          <p className="border-y py-8 text-sm text-muted-foreground">
            아직 받은 작업이 없습니다.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  "촬영 · 받은 시각",
                  "현장 · 작업자",
                  "컨테이너",
                  "사진",
                  "배정",
                  "상태 · 실패 이유",
                  "",
                ].map((label, index) => (
                  <TableHead key={index}>{label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.jobs.map((item) => {
                const items = data.containers.filter(
                  (container) => container.job === item.id
                )
                return (
                  <TableRow
                    key={item.id}
                    data-state={jobId === item.id ? "selected" : undefined}
                  >
                    <TableCell>
                      {item.shotAt}
                      <div className="text-xs text-muted-foreground">
                        {item.receivedAt}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.site}
                      <div className="text-xs text-muted-foreground">
                        {item.worker}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.status === "failed" ? "—" : items.length}
                    </TableCell>
                    <TableCell>
                      {item.status === "failed"
                        ? "—"
                        : items.reduce(
                            (sum, container) => sum + container.photos,
                            0
                          )}
                    </TableCell>
                    <TableCell>
                      {item.status === "failed"
                        ? "—"
                        : data.allocations.filter((allocation) =>
                            items.some(
                              (container) =>
                                container.id === allocation.container
                            )
                          ).length}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === "failed" ? "destructive" : "secondary"
                        }
                      >
                        {item.status === "complete"
                          ? "완료"
                          : item.status === "failed"
                            ? "실패"
                            : "처리 중"}
                      </Badge>
                      {item.failure && (
                        <p className="mt-1 text-xs">{item.failure}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setJobId(item.id)
                          setPage(1)
                        }}
                      >
                        작업 선택
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </section>
      <section aria-label="배정 목록">
        <h2 className="mb-3 text-base font-semibold">
          배정 목록{" "}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {data.allocations.length}
          </span>
        </h2>
        {data.allocations.length === 0 ? (
          <p className="border-y py-8 text-sm text-muted-foreground">
            배정된 컨테이너가 없습니다.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  "컨테이너",
                  "받는 곳",
                  "거래 · 선적",
                  "배정 이유",
                  "배정 시각 · 실행자",
                  "",
                ].map((label, index) => (
                  <TableHead key={index}>{label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.allocations.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {data.containers.find(
                      (container) => container.id === item.container
                    )?.number ?? "번호 미확인"}
                  </TableCell>
                  <TableCell>{item.recipient}</TableCell>
                  <TableCell>
                    <Button
                      variant="link"
                      size="sm"
                      className="px-0"
                      onClick={() => onDeal(item.deal)}
                    >
                      {item.deal}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {item.shipment}
                    </p>
                  </TableCell>
                  <TableCell>{item.reason}</TableCell>
                  <TableCell>
                    {item.at}
                    <p className="text-xs text-muted-foreground">
                      {item.actor}
                    </p>
                  </TableCell>
                  <TableCell>
                    {data.canManage && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRelease(item)
                          setReason("")
                          setError("")
                        }}
                      >
                        배정 해제
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
      <Dialog
        open={Boolean(allocate || release)}
        onOpenChange={(open) => {
          if (!open) close()
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto break-keep sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {allocate ? "컨테이너 배정" : "배정 해제"}
            </DialogTitle>
            <DialogDescription className="break-keep">
              {allocate
                ? `${allocate.number}의 거래와 선적을 선택하세요. 후보가 여러 개면 직접 선택해야 합니다.`
                : "기존 공유와 전달 이력을 확인하고 해제 사유를 입력하세요."}
            </DialogDescription>
          </DialogHeader>
          {allocate && (
            <div className="space-y-4">
              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-medium">
                  배정 대상 · 선택 필요
                </legend>
                {candidates.map((item) => (
                  <label
                    key={item.shipment}
                    className="flex items-start gap-3 rounded-md border p-3 text-sm"
                  >
                    <input
                      className="mt-1"
                      type="radio"
                      name="evidence-candidate"
                      value={item.shipment}
                      checked={selection === item.shipment}
                      onChange={() => setSelection(item.shipment)}
                    />
                    <span>
                      {item.deal} · {item.shipment}
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {item.recipient} · 컨테이너 번호 일치 후보
                      </span>
                    </span>
                  </label>
                ))}
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="radio"
                    name="evidence-candidate"
                    checked={selection === "manual"}
                    onChange={() => setSelection("manual")}
                  />
                  직접 입력
                </label>
              </fieldset>
              {selection === "manual" && (
                <div className="grid gap-3">
                  {(["deal", "shipment", "recipient"] as const).map(
                    (field, i) => (
                      <label key={field} className="grid gap-1 text-sm">
                        {["거래 번호", "선적 번호", "받는 곳"][i]}
                        <Input
                          value={manual[field]}
                          onChange={(e) =>
                            setManual({ ...manual, [field]: e.target.value })
                          }
                        />
                      </label>
                    )
                  )}
                </div>
              )}
              <label className="grid gap-2 text-sm">
                배정 메모{selection === "manual" ? " (필수)" : " (선택)"}
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
            </div>
          )}
          {release && (
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-medium">열 수 있는 공유 링크</h3>
                {release.liveShares.length ? (
                  <ul className="mt-2 list-inside list-disc">
                    {release.liveShares.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-muted-foreground">
                    열 수 있는 공유 링크가 없습니다.
                  </p>
                )}
              </div>
              <div>
                <h3 className="font-medium">이미 보낸 전달</h3>
                {release.deliveries.length ? (
                  <ul className="mt-2 list-inside list-disc">
                    {release.deliveries.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-muted-foreground">
                    이미 보낸 전달이 없습니다.
                  </p>
                )}
              </div>
              {release.liveShares.length > 0 && (
                <p role="alert" className="rounded-md bg-warning/10 p-3">
                  고객이 열 수 있는 공유 링크가 있습니다. 연결 거래에서 공유를
                  철회한 뒤 배정을 해제하세요.
                </p>
              )}
              <label className="grid gap-2">
                해제 사유 (필수)
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={close}>
              취소
            </Button>
            <Button
              disabled={
                busy ||
                (allocate
                  ? !chosen ||
                    !chosen.deal.trim() ||
                    !chosen.shipment.trim() ||
                    !chosen.recipient.trim() ||
                    (selection === "manual" && !reason.trim())
                  : !reason.trim() || Boolean(release?.liveShares.length))
              }
              onClick={() => {
                if (allocate && chosen)
                  void write({
                    ...data,
                    allocations: [
                      ...data.allocations,
                      {
                        id: crypto.randomUUID(),
                        container: allocate.id,
                        ...chosen,
                        reason: reason.trim() || "컨테이너 번호 일치 후보 선택",
                        at: new Date().toLocaleString("ko-KR"),
                        actor: "현재 사용자",
                        liveShares: [],
                        deliveries: [],
                      },
                    ],
                  })
                else if (release && !release.liveShares.length && reason.trim())
                  void write({
                    ...data,
                    allocations: data.allocations.filter(
                      (item) => item.id !== release.id
                    ),
                    releases: [
                      ...data.releases,
                      {
                        id: release.id,
                        reason: reason.trim(),
                        at: new Date().toISOString(),
                      },
                    ],
                  })
              }}
            >
              {busy ? "저장 중…" : allocate ? "배정 확정" : "배정 해제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  Activity,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Copy,
  ExternalLink,
  FileText,
  FolderInput,
  FolderPlus,
  Link2,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
  Upload,
  UserRound,
  X,
} from "lucide-react"

import { Badge } from "@shared/components/ui/badge"
import { Button } from "@shared/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/components/ui/card"
import { Checkbox } from "@shared/components/ui/checkbox"
import { Input } from "@shared/components/ui/input"
import { Progress } from "@shared/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select"
import { Skeleton } from "@shared/components/ui/skeleton"
import { Textarea } from "@shared/components/ui/textarea"
import { snapApi } from "@snap/lib/snap-api"
import {
  snapApiConfigured,
  snapApiErrorMessage,
  type SnapJsonRecord,
} from "@snap/lib/snap-report-api"
import { cn } from "@shared/lib/utils"
import type { SnapScreenKey } from "@snap/snap-prototypes"
import type { SnapNavigationOptions } from "@snap/snap-operations-pages"

type SnapNavigate = (
  screen: SnapScreenKey,
  options?: SnapNavigationOptions
) => void

type SnapTaskWorkspaceProps = {
  screen: "SC-19" | "SC-20"
  navigate: SnapNavigate
  routeParams?: Record<string, string>
}

type CreatePhase = "request" | "clarify" | "scope" | "review"

type FolderSuggestion = {
  name: string
  type: string
  matched_folder_id: string | null
  requires_confirmation: boolean
}

type TaskDetailData = {
  task: SnapJsonRecord
  checklist: SnapJsonRecord[]
  completeness: SnapJsonRecord
  media: SnapJsonRecord[]
  activity: SnapJsonRecord[]
  links: SnapJsonRecord[]
  members: SnapJsonRecord[]
  suggestion: FolderSuggestion | null
}

const CREATE_STORAGE_KEY = "ecoya-snap-task-create-draft"

const FALLBACK_CHECKLIST: SnapJsonRecord[] = [
  { key: "container_number", label: "컨테이너 번호", required: true },
  { key: "seal_number", label: "봉인 번호", required: true },
  { key: "exterior", label: "외관 4면", required: true },
  { key: "loading", label: "적재 전·후", required: true },
]

const FALLBACK_TASK: SnapJsonRecord = {
  id: "TASK-DEMO-001",
  title: "부산 CY 적재 검수",
  task_type: "container_loading_inspection",
  location_name: "Busan CY",
  customer_name: "Hanbit Trading Co.",
  status: "submitted",
  assignee_name: "이현장",
  created_at: "2026-08-05T09:00:00+09:00",
}

const FALLBACK_MEDIA: SnapJsonRecord[] = [
  {
    id: "EV-2081",
    capture_key: "컨테이너 번호",
    media_type: "photo",
    evidence_level: "confirmed",
    captured_at: "2026-08-05T14:20:00+09:00",
  },
  {
    id: "EV-2082",
    capture_key: "봉인 번호 1",
    media_type: "photo",
    evidence_level: "confirmed",
    captured_at: "2026-08-05T14:21:00+09:00",
  },
  {
    id: "EV-2083",
    capture_key: "봉인 번호 2",
    media_type: "photo",
    evidence_level: "confirmed",
    captured_at: "2026-08-05T14:22:00+09:00",
  },
  {
    id: "EV-2084",
    capture_key: "외관 정면",
    media_type: "photo",
    evidence_level: "confirmed",
    captured_at: "2026-08-05T14:23:00+09:00",
  },
  {
    id: "EV-2085",
    capture_key: "외관 좌측",
    media_type: "photo",
    evidence_level: "confirmed",
    captured_at: "2026-08-05T14:24:00+09:00",
  },
  {
    id: "EV-2086",
    capture_key: "외관 우측",
    media_type: "photo",
    evidence_level: "unverified",
    captured_at: "2026-08-05T14:25:00+09:00",
  },
  {
    id: "EV-2087",
    capture_key: "적재 전 전체",
    media_type: "photo",
    evidence_level: "confirmed",
    captured_at: "2026-08-05T14:26:00+09:00",
  },
  {
    id: "EV-2088",
    capture_key: "적재 후 전체",
    media_type: "photo",
    evidence_level: "unverified",
    captured_at: "2026-08-05T14:27:00+09:00",
  },
]

function asRecord(value: unknown): SnapJsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as SnapJsonRecord)
    : null
}

function asRecords(value: unknown): SnapJsonRecord[] {
  return Array.isArray(value)
    ? value.filter((item): item is SnapJsonRecord => Boolean(asRecord(item)))
    : []
}

function pageItems(value: unknown): SnapJsonRecord[] {
  const record = asRecord(value)
  return asRecords(record?.items ?? record?.data ?? value)
}

function textValue(
  record: SnapJsonRecord | null | undefined,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = record?.[key]
    if (typeof value === "string" && value.trim()) return value
    if (typeof value === "number") return String(value)
  }
  return ""
}

function boolValue(record: SnapJsonRecord | null, key: string) {
  return record?.[key] === true
}

function draftTaskId(draft: SnapJsonRecord | null) {
  return textValue(draft, "task_id", "id")
}

function draftComposer(draft: SnapJsonRecord | null) {
  return asRecord(draft?.composer)
}

function checklistFromDraft(draft: SnapJsonRecord | null) {
  const composer = draftComposer(draft)
  const instruction = asRecord(draft?.human_instruction)
  const machineBrief = asRecord(composer?.machine_brief)
  return (
    asRecords(instruction?.checklist).length
      ? asRecords(instruction?.checklist)
      : asRecords(machineBrief?.checklist).length
        ? asRecords(machineBrief?.checklist)
        : FALLBACK_CHECKLIST
  )
}

function phaseFromDraft(draft: SnapJsonRecord | null): CreatePhase {
  const composer = draftComposer(draft)
  const clarification = asRecord(composer?.clarification)
  const scope = asRecord(composer?.scope_confirmation)
  if (
    boolValue(clarification, "needed") &&
    asRecords(clarification?.cards).length > 0
  ) {
    return "clarify"
  }
  const scopeCards = asRecords(scope?.cards)
  const scopeState = textValue(scope, "state", "status")
  if (
    scopeCards.length > 0 &&
    !["confirmed", "complete", "completed"].includes(scopeState)
  ) {
    return "scope"
  }
  return "review"
}

function taskStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "초안",
    confirmed: "범위 확정",
    assigned: "배정됨",
    active: "진행 중",
    in_progress: "진행 중",
    submitted: "검토 대기",
    review: "검토 대기",
    approved: "승인됨",
    sent: "전달됨",
    completed: "완료",
    rejected: "반려",
  }
  return labels[status] || status || "상태 미확인"
}

function taskStep(status: string) {
  if (["approved", "sent", "completed", "done"].includes(status)) return 4
  if (["submitted", "review"].includes(status)) return 3
  if (["in_progress", "active"].includes(status)) return 2
  if (["assigned", "confirmed"].includes(status)) return 1
  return 0
}

function TaskPageHeader({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

function InlineState({
  tone = "neutral",
  title,
  description,
  action,
}: {
  tone?: "neutral" | "success" | "warning" | "error"
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-md border px-4 py-3 sm:flex-row sm:items-center",
        tone === "success" && "ui-status-success",
        tone === "warning" && "ui-status-warning",
        tone === "error" && "ui-status-danger"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{title}</div>
        {description ? (
          <div className="mt-0.5 text-xs text-muted-foreground">
            {description}
          </div>
        ) : null}
      </div>
      {action}
    </div>
  )
}

export function SnapTaskWorkspace(props: SnapTaskWorkspaceProps) {
  return props.screen === "SC-19" ? (
    <SnapTaskCreatePage {...props} />
  ) : (
    <SnapTaskDetailPage {...props} />
  )
}

function SnapTaskCreatePage({ navigate }: SnapTaskWorkspaceProps) {
  const restored = useMemo(() => {
    if (typeof window === "undefined") return null
    try {
      return asRecord(JSON.parse(sessionStorage.getItem(CREATE_STORAGE_KEY) || "null"))
    } catch {
      return null
    }
  }, [])
  const [phase, setPhase] = useState<CreatePhase>(
    (textValue(restored, "phase") as CreatePhase) || "request"
  )
  const [request, setRequest] = useState(
    textValue(restored, "request") ||
      "부산 CY에서 컨테이너 번호, 봉인 번호, 외관과 적재 완료 상태를 확인해줘"
  )
  const [location, setLocation] = useState(
    textValue(restored, "location") || "Busan CY"
  )
  const [taskType, setTaskType] = useState(
    textValue(restored, "task_type") || "container_loading_inspection"
  )
  const [title, setTitle] = useState(
    textValue(restored, "title") || "부산 CY 적재 검수"
  )
  const [purpose, setPurpose] = useState(
    textValue(restored, "purpose") || "봉인 번호와 적재 상태 확인"
  )
  const [customerId, setCustomerId] = useState(
    textValue(restored, "customer_id")
  )
  const [draft, setDraft] = useState<SnapJsonRecord | null>(
    asRecord(restored?.draft)
  )
  const [customers, setCustomers] = useState<SnapJsonRecord[]>([])
  const [repeatSources, setRepeatSources] = useState<SnapJsonRecord[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (typeof window === "undefined") return
    sessionStorage.setItem(
      CREATE_STORAGE_KEY,
      JSON.stringify({
        phase,
        request,
        location,
        task_type: taskType,
        title,
        purpose,
        customer_id: customerId,
        draft,
      })
    )
  }, [customerId, draft, location, phase, purpose, request, taskType, title])

  useEffect(() => {
    let cancelled = false
    if (!snapApiConfigured) return
    void Promise.allSettled([
      snapApi.customers.list(),
      snapApi.tasks.repeatSources(),
    ]).then(([customerResult, repeatResult]) => {
      if (cancelled) return
      if (customerResult.status === "fulfilled") {
        setCustomers(pageItems(customerResult.value))
      }
      if (repeatResult.status === "fulfilled") {
        setRepeatSources(pageItems(repeatResult.value))
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const runMutation = async (
    work: () => Promise<SnapJsonRecord>,
    onSuccess: (value: SnapJsonRecord) => void
  ) => {
    setBusy(true)
    setError("")
    try {
      onSuccess(await work())
    } catch (reason) {
      setError(snapApiErrorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  const generateDraft = () => {
    if (!request.trim() || !location.trim()) return
    if (!snapApiConfigured) {
      const fallback: SnapJsonRecord = {
        task_id: "TASK-DEMO-001",
        task_type: taskType,
        human_instruction: { title, purpose, checklist: FALLBACK_CHECKLIST },
      }
      setDraft(fallback)
      setPhase("clarify")
      return
    }
    void runMutation(
      () =>
        snapApi.tasks.createDraft({
          natural_language_input: request.trim(),
          location_name: location.trim(),
          task_type: taskType,
        }),
      (response) => {
        setDraft(response)
        const instruction = asRecord(response.human_instruction)
        setTitle(
          textValue(instruction, "title") ||
            textValue(draftComposer(response), "suggested_title") ||
            title
        )
        setPurpose(textValue(instruction, "purpose") || purpose)
        setPhase(phaseFromDraft(response))
      }
    )
  }

  const applyClarification = () => {
    const id = draftTaskId(draft)
    if (!id || !snapApiConfigured) {
      setPhase("scope")
      return
    }
    void runMutation(
      () =>
        snapApi.tasks.clarify(id, {
          answers: { loading_timing: "after_loading" },
        }),
      (response) => {
        const next = { ...draft, ...response, task_id: id }
        setDraft(next)
        setPhase(phaseFromDraft(next) === "clarify" ? "scope" : phaseFromDraft(next))
      }
    )
  }

  const confirmScope = () => {
    const id = draftTaskId(draft)
    if (!id || !snapApiConfigured) {
      setPhase("review")
      return
    }
    void runMutation(
      () =>
        snapApi.tasks.confirmScope(id, {
          answers: {},
          confirm_all: true,
        }),
      (response) => {
        setDraft({ ...draft, ...response, task_id: id })
        setPhase("review")
      }
    )
  }

  const confirmTask = async () => {
    const id = draftTaskId(draft)
    if (!id) {
      setError("업무 초안 ID가 없습니다. 초안을 다시 생성해 주세요.")
      return
    }
    if (!snapApiConfigured) {
      sessionStorage.removeItem(CREATE_STORAGE_KEY)
      navigate("SC-20", { params: { id } })
      return
    }
    setBusy(true)
    setError("")
    try {
      await snapApi.tasks.updateDraft(id, {
        title: title.trim(),
        purpose: purpose.trim(),
        location_name: location.trim(),
      })
      await snapApi.tasks.confirm(id, {
        title: title.trim(),
        purpose: purpose.trim(),
        location_name: location.trim(),
        customer_id: customerId || undefined,
        outcome_mode: "standard_report",
      })
      sessionStorage.removeItem(CREATE_STORAGE_KEY)
      navigate("SC-20", { params: { id } })
    } catch (reason) {
      setError(snapApiErrorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  const steps: Array<[CreatePhase, string]> = [
    ["request", "요청 입력"],
    ["clarify", "확인 질문"],
    ["scope", "범위 확인"],
    ["review", "최종 확정"],
  ]
  const phaseIndex = steps.findIndex(([key]) => key === phase)
  const checklist = checklistFromDraft(draft)

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-ecoya-wide px-4 py-6 sm:px-6 lg:px-8">
        <TaskPageHeader
          title="새 작업 만들기"
          description="자연어 요청을 확인 질문과 범위 검토를 거쳐 현장 작업으로 확정합니다."
        />

        <div className="mt-6 grid grid-cols-4 overflow-hidden rounded-md border bg-muted/30">
          {steps.map(([key, label], index) => (
            <div
              key={key}
              className={cn(
                "flex min-w-0 items-center justify-center gap-2 border-r px-2 py-3 text-center text-xs last:border-r-0 sm:justify-start sm:px-4 sm:text-sm",
                index === phaseIndex && "bg-background font-medium",
                index < phaseIndex && "text-success"
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs",
                  index === phaseIndex && "bg-primary text-primary-foreground",
                  index < phaseIndex && "bg-success/10 text-success"
                )}
              >
                {index < phaseIndex ? <Check className="size-3" /> : index + 1}
              </span>
              <span className="truncate">{label}</span>
            </div>
          ))}
        </div>

        {error ? (
          <div className="mt-5">
            <InlineState
              tone="error"
              title="작업을 저장하지 못했습니다"
              description={`${error} 입력값은 이 브라우저에 보존되어 있습니다.`}
              action={
                <Button size="sm" variant="outline" onClick={generateDraft}>
                  <RefreshCw /> 다시 시도
                </Button>
              }
            />
          </div>
        ) : null}

        <div
          className={cn(
            "mt-6 grid gap-6",
            phase === "request"
              ? "mx-auto max-w-4xl"
              : "lg:grid-cols-[minmax(0,1fr)_320px]"
          )}
        >
          <div className="space-y-5">
            {phase === "request" ? (
              <Card className="rounded-md shadow-none">
                <CardHeader>
                  <CardTitle>현장 요청 입력</CardTitle>
                  <CardDescription>
                    확인할 사실과 장소를 적으면 필수 증거와 작업 범위를 구성합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {repeatSources.length ? (
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">
                        최근 반복 업무
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {repeatSources.slice(0, 4).map((source, index) => (
                          <Button
                            key={textValue(source, "source_task_id", "id") || index}
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRequest(
                                textValue(source, "natural_language_input", "title") || request
                              )
                              setLocation(textValue(source, "location_name") || location)
                              setTaskType(textValue(source, "task_type") || taskType)
                            }}
                          >
                            {textValue(source, "label", "title") || "반복 업무"}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      무엇을 확인해야 하나요?
                    </label>
                    <Textarea
                      value={request}
                      onChange={(event) => setRequest(event.target.value)}
                      rows={7}
                      className="min-h-40 resize-y text-base leading-7"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        현장 위치
                      </label>
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={location}
                          onChange={(event) => setLocation(event.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        업무 유형
                      </label>
                      <Select
                        value={taskType}
                        onValueChange={(value) => {
                          if (value) setTaskType(value)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="container_loading_inspection">
                            컨테이너 적재 검수
                          </SelectItem>
                          <SelectItem value="site_visit_field_report">
                            현장 방문 리포트
                          </SelectItem>
                          <SelectItem value="industrial_before_after">
                            작업 전·후 증빙
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    className="min-h-11 w-full"
                    disabled={busy || !request.trim() || !location.trim()}
                    onClick={generateDraft}
                  >
                    {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
                    AI 작업 초안 만들기
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {phase === "clarify" ? (
              <Card className="rounded-md shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">범위 확인 질문</CardTitle>
                  <CardDescription>
                    작업 결과를 바꾸는 질문만 확인합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      적재 상태는 어느 시점을 확인할까요?
                    </label>
                    <Select defaultValue="after_loading">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="after_loading">적재 완료 후</SelectItem>
                        <SelectItem value="before_after">적재 전·후 모두</SelectItem>
                        <SelectItem value="last_loading">마지막 적재만</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setPhase("request")}>
                      이전
                    </Button>
                    <Button disabled={busy} onClick={applyClarification}>
                      {busy ? <Loader2 className="animate-spin" /> : null}
                      답변 반영
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {phase === "scope" ? (
              <Card className="rounded-md shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">작업 범위 확인</CardTitle>
                  <CardDescription>
                    작업자가 수집할 필수 증거를 확인합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {checklist.map((item, index) => (
                    <label
                      key={textValue(item, "key", "id") || index}
                      className="flex items-center gap-3 rounded-md border p-3"
                    >
                      <Checkbox defaultChecked={item.required !== false} />
                      <span className="min-w-0 flex-1 text-sm font-medium">
                        {textValue(item, "label", "title", "key") || `확인 항목 ${index + 1}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {textValue(item, "evidence_requirement", "media_type") || "사진"}
                      </span>
                    </label>
                  ))}
                  <div className="flex justify-between pt-2">
                    <Button variant="outline" onClick={() => setPhase("clarify")}>
                      이전
                    </Button>
                    <Button disabled={busy} onClick={confirmScope}>
                      {busy ? <Loader2 className="animate-spin" /> : null}
                      범위 확인
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {phase === "review" ? (
              <Card className="rounded-md shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">최종 확정</CardTitle>
                  <CardDescription>
                    확정하면 작업자 배정과 실행 링크 생성이 가능합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">작업명</label>
                      <Input value={title} onChange={(event) => setTitle(event.target.value)} />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">고객</label>
                      <Select
                        value={customerId}
                        onValueChange={(value) => setCustomerId(value ?? "")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="고객 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer, index) => {
                            const id = textValue(customer, "id", "customer_id") || String(index)
                            return (
                              <SelectItem key={id} value={id}>
                                {textValue(customer, "name", "customer_name") || "이름 없는 고객"}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">목적</label>
                    <Textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} />
                  </div>
                  <InlineState
                    tone="success"
                    title="확정 가능한 작업 범위"
                    description={`필수 확인 ${checklist.length}개가 준비되었습니다. 확정 전에는 작업자에게 노출되지 않습니다.`}
                  />
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setPhase("scope")}>
                      이전
                    </Button>
                    <Button disabled={busy || !title.trim()} onClick={confirmTask}>
                      {busy ? <Loader2 className="animate-spin" /> : <Check />}
                      작업 확정
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>

          {phase !== "request" ? (
            <Card className="h-fit rounded-md shadow-none lg:sticky lg:top-4">
              <CardHeader>
                <CardTitle className="text-base">AI 작업 초안</CardTitle>
                <CardDescription>확정 전에는 작업자에게 보이지 않습니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">현장</span>
                  <div className="font-medium">{location}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">필수 항목</span>
                  <div className="font-medium">{checklist.length}개</div>
                </div>
                <div>
                  <span className="text-muted-foreground">업무 ID</span>
                  <div className="break-all font-medium">{draftTaskId(draft) || "생성 전"}</div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function SnapTaskDetailPage({ navigate, routeParams }: SnapTaskWorkspaceProps) {
  const taskId = routeParams?.id || "TASK-DEMO-001"
  const [data, setData] = useState<TaskDetailData>({
    task: FALLBACK_TASK,
    checklist: FALLBACK_CHECKLIST,
    completeness: {},
    media: FALLBACK_MEDIA,
    activity: [],
    links: [],
    members: [
      { id: "WORKER-DEMO-001", name: "이현장", role: "worker", status: "active" },
    ],
    suggestion: {
      name: "Busan CY 적재 검수",
      type: "inspection",
      matched_folder_id: null,
      requires_confirmation: true,
    },
  })
  const [loading, setLoading] = useState(snapApiConfigured)
  const [error, setError] = useState("")
  const [partialError, setPartialError] = useState("")
  const [reloadVersion, setReloadVersion] = useState(0)
  const [busyAction, setBusyAction] = useState("")
  const [actionMessage, setActionMessage] = useState("")
  const [assigneeId, setAssigneeId] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [workerLinkHours, setWorkerLinkHours] = useState("72")
  const [workerLinkLabels, setWorkerLinkLabels] = useState<Record<string, string>>({})
  const [uploadLinkHours, setUploadLinkHours] = useState("72")
  const [uploadLinkLabels, setUploadLinkLabels] = useState<Record<string, string>>({})
  const [copiedToken, setCopiedToken] = useState("")
  const [createdLink, setCreatedLink] = useState<SnapJsonRecord | null>(null)
  const [suggestionDismissed, setSuggestionDismissed] = useState(false)
  const [filedFolderName, setFiledFolderName] = useState("")

  useEffect(() => {
    let cancelled = false
    if (!snapApiConfigured) return
    void Promise.allSettled([
      snapApi.tasks.get(taskId),
      snapApi.tasks.checklist(taskId),
      snapApi.media.list(taskId),
      snapApi.tasks.activity(taskId),
      snapApi.links.byTask(taskId),
      snapApi.organization.members(),
      snapApi.tasks.folderSuggestion(taskId),
    ]).then((results) => {
      if (cancelled) return
      const [taskResult, checklistResult, mediaResult, activityResult, linksResult, membersResult, suggestionResult] = results
      if (taskResult.status === "rejected") {
        setError(snapApiErrorMessage(taskResult.reason))
        setLoading(false)
        return
      }
      const failedOptional = results.slice(1).filter((result) => result.status === "rejected").length
      const checklistResponse =
        checklistResult.status === "fulfilled" ? checklistResult.value : null
      const checklistRecord = asRecord(checklistResponse)
      const suggestionRecord =
        suggestionResult.status === "fulfilled"
          ? asRecord(asRecord(suggestionResult.value)?.suggestion)
          : null
      setData({
        task: asRecord(taskResult.value) ?? taskResult.value,
        checklist:
          checklistResult.status === "fulfilled"
            ? pageItems(checklistResponse).length
              ? pageItems(checklistResponse)
              : asRecords(checklistRecord?.checklist)
            : [],
        completeness: asRecord(checklistRecord?.completeness) ?? {},
        media: mediaResult.status === "fulfilled" ? pageItems(mediaResult.value) : [],
        activity: activityResult.status === "fulfilled" ? pageItems(activityResult.value) : [],
        links: linksResult.status === "fulfilled" ? pageItems(linksResult.value) : [],
        members: membersResult.status === "fulfilled" ? pageItems(membersResult.value) : [],
        suggestion: suggestionRecord
          ? {
              name: textValue(suggestionRecord, "name") || "추천 폴더",
              type: textValue(suggestionRecord, "type") || "general",
              matched_folder_id: textValue(suggestionRecord, "matched_folder_id") || null,
              requires_confirmation: suggestionRecord.requires_confirmation !== false,
            }
          : null,
      })
      if (failedOptional) {
        setPartialError(`보조 정보 ${failedOptional}개를 불러오지 못했습니다. 기본 업무 정보는 사용할 수 있습니다.`)
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [reloadVersion, taskId])

  const mutate = async (
    key: string,
    work: () => Promise<unknown>,
    success: string,
    reload = true
  ) => {
    setBusyAction(key)
    setActionMessage("")
    try {
      await work()
      setActionMessage(success)
      if (reload) setReloadVersion((value) => value + 1)
      return true
    } catch (reason) {
      setActionMessage(snapApiErrorMessage(reason))
      return false
    } finally {
      setBusyAction("")
    }
  }

  const task = data.task
  const instruction = asRecord(task.human_instruction)
  const title = textValue(instruction, "title") || textValue(task, "title", "task_type") || "업무 상세"
  const workerLinkLabel = workerLinkLabels[taskId] ?? title
  const uploadLinkLabel = uploadLinkLabels[taskId] ?? `${title} 증빙 업로드`
  const setWorkerLinkLabel = (value: string) => {
    setWorkerLinkLabels((labels) => ({ ...labels, [taskId]: value }))
  }
  const setUploadLinkLabel = (value: string) => {
    setUploadLinkLabels((labels) => ({ ...labels, [taskId]: value }))
  }
  const status = textValue(task, "status", "draft_status").toLowerCase()
  const currentStep = taskStep(status)
  const workers = data.members.filter(
    (member) =>
      textValue(member, "role") === "worker" &&
      !["inactive", "rejected"].includes(textValue(member, "status"))
  )
  const completenessCounts = asRecord(data.completeness.counts)
  const required = Number(completenessCounts?.required ?? data.checklist.filter((item) => item.required !== false).length)
  const satisfied = Number(
    completenessCounts?.required_satisfied ??
      data.checklist.filter((item) =>
        ["captured", "reviewed", "confirmed"].includes(textValue(item, "status")) ||
        Boolean(item.satisfied_by_media_id)
      ).length
  )
  const completion = required ? Math.round((satisfied / required) * 100) : 0
  const workerExecutionLinks = data.links.filter(
    (link) => textValue(link, "link_type") !== "external_upload"
  )
  const evidenceUploadLinks = data.links.filter(
    (link) => textValue(link, "link_type") === "external_upload"
  )

  const copyLink = async (link: SnapJsonRecord) => {
    const token = textValue(link, "token")
    const path =
      textValue(link, "frontend_path") ||
      (textValue(link, "link_type") === "external_upload"
        ? `/upload/${token}`
        : `/work/${token}`)
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`)
      const copiedKey = token || path
      setCopiedToken(copiedKey)
      window.setTimeout(() => {
        setCopiedToken((current) => (current === copiedKey ? "" : current))
      }, 1600)
    } catch {
      setActionMessage("클립보드에 복사하지 못했습니다.")
    }
  }

  const createTaskLink = async (kind: "worker_exec" | "external_upload") => {
    const actionKey = kind === "worker_exec" ? "worker-link" : "upload-link"
    const isWorkerLink = kind === "worker_exec"
    const defaultLabel = isWorkerLink ? "현장 작업 링크" : "증빙 업로드 요청"
    const expiresInHours = isWorkerLink ? workerLinkHours : uploadLinkHours
    const linkLabel = isWorkerLink ? workerLinkLabel : uploadLinkLabel

    setBusyAction(actionKey)
    setActionMessage("")
    try {
      let response: SnapJsonRecord
      if (snapApiConfigured) {
        const result = isWorkerLink
          ? await snapApi.links.createWorker(taskId, {
              expires_in_hours: Number(expiresInHours),
              label: linkLabel || defaultLabel,
            })
          : await snapApi.links.createExternalUpload(taskId, {
              expires_in_hours: Number(expiresInHours),
              label: linkLabel || defaultLabel,
            })
        response =
          asRecord(asRecord(result)?.link) ??
          asRecord(asRecord(result)?.data) ??
          asRecord(result) ??
          {}
      } else {
        const token = `demo-${isWorkerLink ? "work" : "upload"}-${Date.now()}`
        response = {
          id: token,
          token,
          link_type: kind,
          label: linkLabel || defaultLabel,
          frontend_path: `${isWorkerLink ? "/work" : "/upload"}/${token}`,
          expires_at: new Date(
            Date.now() + Number(expiresInHours) * 60 * 60 * 1000
          ).toISOString(),
          demo: true,
        }
      }

      const token = textValue(response, "token")
      const link: SnapJsonRecord = {
        ...response,
        link_type: textValue(response, "link_type") || kind,
        label: textValue(response, "label") || linkLabel || defaultLabel,
        frontend_path:
          textValue(response, "frontend_path") ||
          `${isWorkerLink ? "/work" : "/upload"}/${token}`,
      }
      setCreatedLink(link)
      setData((current) => ({
        ...current,
        links: [
          link,
          ...current.links.filter(
            (item) =>
              textValue(item, "id") !== textValue(link, "id") &&
              textValue(item, "token") !== token
          ),
        ],
      }))
      setActionMessage(
        isWorkerLink
          ? "작업 수행 링크를 생성했습니다. 외부 작업자가 체크리스트를 수행할 수 있습니다."
          : "증빙 업로드 링크를 생성했습니다. 외부 사용자는 이 업무에 파일만 제출할 수 있습니다."
      )
    } catch (reason) {
      setActionMessage(snapApiErrorMessage(reason))
    } finally {
      setBusyAction("")
    }
  }

  const renderTaskLinks = (links: SnapJsonRecord[]) => {
    if (!links.length) return null

    return (
      <div className="space-y-2 border-t pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">발급한 링크</div>
          <Badge variant="secondary">{links.length}개</Badge>
        </div>
        {links.map((link, index) => {
          const token = textValue(link, "token")
          const path =
            textValue(link, "frontend_path") ||
            (textValue(link, "link_type") === "external_upload"
              ? `/upload/${token}`
              : `/work/${token}`)
          const copiedKey = token || path
          const isLatest =
            copiedKey ===
            (textValue(createdLink ?? {}, "token") ||
              textValue(createdLink ?? {}, "frontend_path"))

          return (
            <div
              key={textValue(link, "id") || token || index}
              className={cn(
                "rounded-md border p-3",
                isLatest && "border-primary/30 bg-primary/5"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-sm font-medium">
                      {textValue(link, "label") || "발급 링크"}
                    </div>
                    {isLatest ? <Badge variant="secondary">방금 생성</Badge> : null}
                  </div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {path || token}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {textValue(link, "expires_at")
                      ? `${new Date(textValue(link, "expires_at")).toLocaleString("ko-KR")}까지 사용 가능`
                      : "만료 시각은 서버 정책을 따릅니다."}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {copiedToken === copiedKey ? (
                    <span role="status" className="px-1 text-xs text-primary">
                      복사됨
                    </span>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label="링크 복사"
                    title="링크 복사"
                    onClick={() => void copyLink(link)}
                  >
                    <Copy />
                    복사
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="링크 열기"
                    title="링크 열기"
                    onClick={() => window.open(path, "_blank", "noopener,noreferrer")}
                  >
                    <ExternalLink />
                  </Button>
                  {token ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="링크 회수"
                      title="링크 회수"
                      disabled={busyAction === `revoke-${token}`}
                      onClick={() => void revokeTaskLink(link)}
                    >
                      {busyAction === `revoke-${token}` ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <X />
                      )}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const revokeTaskLink = async (link: SnapJsonRecord) => {
    const token = textValue(link, "token")
    if (!token) return
    if (!snapApiConfigured || link.demo === true) {
      setData((current) => ({
        ...current,
        links: current.links.filter((item) => textValue(item, "token") !== token),
      }))
      if (textValue(createdLink ?? {}, "token") === token) setCreatedLink(null)
      setActionMessage("링크를 회수했습니다.")
      return
    }
    const succeeded = await mutate(
      `revoke-${token}`,
      () => snapApi.links.revoke(token),
      "링크를 회수했습니다.",
      false
    )
    if (succeeded) {
      setData((current) => ({
        ...current,
        links: current.links.filter((item) => textValue(item, "token") !== token),
      }))
      if (textValue(createdLink ?? {}, "token") === token) setCreatedLink(null)
    }
  }

  const fileSuggestion = () => {
    const suggestion = data.suggestion
    if (!suggestion) return

    if (!snapApiConfigured) {
      setBusyAction("folder")
      setActionMessage("")
      window.setTimeout(() => {
        setFiledFolderName(suggestion.name)
        setSuggestionDismissed(true)
        setActionMessage(`“${suggestion.name}” 폴더를 만들고 이 업무를 추가했습니다.`)
        setBusyAction("")
      }, 300)
      return
    }

    void mutate(
      "folder",
      async () => {
        let folderId = suggestion.matched_folder_id
        if (!folderId) {
          const response = await snapApi.folders.create({
            folder_name: suggestion.name,
            folder_type: suggestion.type || "general",
          })
          const folder = asRecord(response.folder) ?? response
          folderId = textValue(folder, "id", "folder_id") || null
          if (!folderId) throw new Error("folder_create_failed")
        }
        await snapApi.folders.addItem(folderId, {
          item_type: "task",
          item_id: taskId,
          source: "ai_suggestion",
        })
      },
      "추천 폴더에 업무를 보관했습니다.",
      false
    ).then((succeeded) => {
      if (succeeded) {
        setFiledFolderName(suggestion.name)
        setSuggestionDismissed(true)
      }
    })
  }

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-background">
        <div className="mx-auto w-full max-w-ecoya-wide space-y-5 px-4 py-6 sm:px-6 lg:px-8">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-28 w-full" />
          <div className="grid gap-5 lg:grid-cols-3">
            <Skeleton className="h-72" />
            <Skeleton className="h-72 lg:col-span-2" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <InlineState
          tone="error"
          title="업무 상세를 불러오지 못했습니다"
          description={error}
          action={
            <Button
              variant="outline"
              onClick={() => {
                setError("")
                setPartialError("")
                setLoading(true)
                setReloadVersion((value) => value + 1)
              }}
            >
              <RefreshCw /> 다시 시도
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-ecoya-wide px-4 py-6 sm:px-6 lg:px-8">
        <TaskPageHeader
          title={title}
          description="확정 범위, 배정, 현장 제출, 사무 검토와 후속 전달을 한 곳에서 관리합니다."
          action={
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{taskStatusLabel(status)}</Badge>
              <Button onClick={() => navigate("SC-21", { params: { id: taskId } })}>
                <FileText /> 보고서 작성
              </Button>
            </div>
          }
        />

        {partialError ? (
          <div className="mt-4">
            <InlineState tone="warning" title="일부 정보 지연" description={partialError} />
          </div>
        ) : null}
        {actionMessage ? (
          <div className="mt-4">
            <InlineState title={actionMessage} />
          </div>
        ) : null}

        <Card className="mt-5 rounded-md shadow-none">
          <CardContent className="py-5">
            <div className="flex items-center">
              {["생성", "배정", "진행", "검토", "완료"].map((label, index) => (
                <div key={label} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-full text-xs font-semibold",
                        index <= currentStep
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {index < currentStep ? <Check className="size-4" /> : index + 1}
                    </span>
                    <span className="text-xs">{label}</span>
                  </div>
                  {index < 4 ? (
                    <div className={cn("mx-2 h-px flex-1", index < currentStep ? "bg-primary" : "bg-border")} />
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {!suggestionDismissed && data.suggestion ? (
          <div className="mt-5 flex flex-col gap-3 rounded-md border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center">
            <FolderInput className="size-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">추천 증빙 폴더</div>
              <div className="text-xs text-muted-foreground">
                “{data.suggestion.name}”에 이 업무를 보관할 수 있습니다. 저장은 사용자가 확정해야 합니다.
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={busyAction === "folder"} onClick={fileSuggestion}>
                {busyAction === "folder" ? <Loader2 className="animate-spin" /> : <FolderPlus />}
                {data.suggestion.matched_folder_id ? "기존 폴더에 추가" : "폴더 생성 후 추가"}
              </Button>
              <Button size="icon" variant="ghost" aria-label="추천 닫기" onClick={() => setSuggestionDismissed(true)}>
                <X />
              </Button>
            </div>
          </div>
        ) : null}

        {filedFolderName ? (
          <div className="ui-status-success mt-5 flex flex-col gap-3 rounded-md p-4 sm:flex-row sm:items-center">
            <CheckCircle2 className="size-5 shrink-0 text-success" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-success">증빙 폴더에 추가됨</div>
              <div className="text-xs text-success">
                “{filedFolderName}” 폴더에 이 업무를 보관했습니다.
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate("SC-23")}>
              증빙 보관함에서 보기
              <ChevronRight />
            </Button>
          </div>
        ) : null}

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="space-y-5">
            <Card className="rounded-md shadow-none">
              <CardHeader>
                <CardTitle className="text-base">담당 작업자 배정</CardTitle>
                <CardDescription>
                  SNAP에 가입한 작업자에게 앱 내 업무를 배정하고 알림을 보냅니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-md bg-muted/60 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">현재 담당</span>
                  <span className="font-medium">
                    {textValue(task, "assignee_name", "assigned_to") || "미배정"}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Select
                    value={assigneeId}
                    onValueChange={(value) => setAssigneeId(value ?? "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="작업자 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {workers.map((worker, index) => {
                        const id = textValue(worker, "id", "user_id") || String(index)
                        return (
                          <SelectItem key={id} value={id}>
                            {textValue(worker, "name", "email") || "이름 없는 작업자"}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <Button
                    disabled={!assigneeId || Boolean(busyAction)}
                    onClick={() =>
                      void mutate(
                        "assign",
                        () => snapApi.tasks.assign(taskId, { assignee_user_id: assigneeId }),
                        "작업자에게 업무를 배정했습니다."
                      )
                    }
                  >
                    {busyAction === "assign" ? <Loader2 className="animate-spin" /> : <UserRound />}
                    배정
                  </Button>
                </div>
                {!workers.length ? (
                  <InlineState
                    title="배정 가능한 작업자가 없습니다"
                    description="작업자·작업 관리자에서 작업자를 초대하거나 가입 요청을 승인해 주세요."
                  />
                ) : null}
              </CardContent>
            </Card>

            <Card className="rounded-md shadow-none">
              <CardHeader>
                <CardTitle className="text-base">작업 수행 링크</CardTitle>
                <CardDescription>
                  앱이 없는 외부 작업자가 체크리스트를 확인하고 직접 촬영·제출합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
                  <Input
                    value={workerLinkLabel}
                    onChange={(event) => setWorkerLinkLabel(event.target.value)}
                    onFocus={(event) => event.currentTarget.select()}
                    placeholder="작업 링크 이름"
                  />
                  <Select
                    value={workerLinkHours}
                    onValueChange={(value) => {
                      if (value) setWorkerLinkHours(value)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24시간</SelectItem>
                      <SelectItem value="72">3일</SelectItem>
                      <SelectItem value="168">7일</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={Boolean(busyAction)}
                  onClick={() => void createTaskLink("worker_exec")}
                >
                  {busyAction === "worker-link" ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Link2 />
                  )}
                  작업 링크 생성
                </Button>
                {renderTaskLinks(workerExecutionLinks)}
              </CardContent>
            </Card>

            <Card className="rounded-md shadow-none">
              <CardHeader>
                <CardTitle className="text-base">증빙 업로드 요청</CardTitle>
                <CardDescription>
                  협력사 등 외부 사용자가 업무를 수행하지 않고 사진·파일만 제출합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
                  <Input
                    value={uploadLinkLabel}
                    onChange={(event) => setUploadLinkLabel(event.target.value)}
                    onFocus={(event) => event.currentTarget.select()}
                    placeholder="증빙 업로드 요청 이름"
                  />
                  <Select
                    value={uploadLinkHours}
                    onValueChange={(value) => {
                      if (value) setUploadLinkHours(value)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24시간</SelectItem>
                      <SelectItem value="72">3일</SelectItem>
                      <SelectItem value="168">7일</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={Boolean(busyAction)}
                  onClick={() => void createTaskLink("external_upload")}
                >
                  {busyAction === "upload-link" ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Upload />
                  )}
                  업로드 요청 생성
                </Button>
                {renderTaskLinks(evidenceUploadLinks)}
              </CardContent>
            </Card>

            <Card className="rounded-md shadow-none">
              <CardHeader>
                <CardTitle className="text-base">업무 정보</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-1">
                {[
                  [MapPin, "현장", textValue(task, "location_name") || "-"],
                  [UserRound, "작업자", textValue(task, "assignee_name", "assigned_to") || "미배정"],
                  [ClipboardCheck, "유형", textValue(task, "task_type") || "-"],
                  [Activity, "생성", textValue(task, "created_at") || "-"],
                ].map(([Icon, label, value]) => {
                  const RowIcon = Icon as typeof MapPin
                  return (
                    <div key={String(label)} className="flex gap-3">
                      <RowIcon className="mt-0.5 size-4 text-muted-foreground" />
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">{String(label)}</div>
                        <div className="break-words font-medium">{String(value)}</div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="rounded-md shadow-none">
              <CardHeader>
                <CardTitle className="text-base">활동 이력</CardTitle>
              </CardHeader>
              <CardContent>
                {data.activity.length ? (
                  <div className="space-y-3">
                    {data.activity.slice(0, 10).map((item, index) => (
                      <div key={textValue(item, "id") || index} className="flex gap-3 text-sm">
                        <Activity className="mt-0.5 size-4 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <div>{textValue(item, "label", "action") || "상태 변경"}</div>
                          <div className="text-xs text-muted-foreground">
                            {textValue(item, "actor_role", "actor")} {textValue(item, "timestamp", "created_at")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">기록된 활동이 없습니다.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card className="rounded-md shadow-none">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">체크리스트</CardTitle>
                    <CardDescription>{satisfied}/{required}개 필수 항목 충족</CardDescription>
                  </div>
                  <span className="text-sm font-semibold text-primary">{completion}%</span>
                </div>
                <Progress value={completion} />
              </CardHeader>
              <CardContent className="space-y-2">
                {data.checklist.length ? (
                  data.checklist.map((item, index) => {
                    const done =
                      ["captured", "reviewed", "confirmed"].includes(textValue(item, "status")) ||
                      Boolean(item.satisfied_by_media_id)
                    return (
                      <div key={textValue(item, "id", "key") || index} className="flex items-center gap-3 border-b py-2 last:border-0">
                        {done ? <CheckCircle2 className="size-4 text-success" /> : <Camera className="size-4 text-muted-foreground" />}
                        <span className="min-w-0 flex-1 text-sm">
                          {textValue(item, "label", "key") || `항목 ${index + 1}`}
                        </span>
                        {item.required === false ? <Badge variant="outline">선택</Badge> : null}
                      </div>
                    )
                  })
                ) : (
                  <InlineState title="체크리스트가 없습니다" description="업무 범위 API 응답을 확인해 주세요." />
                )}
              </CardContent>
            </Card>

            <Card className="rounded-md shadow-none">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base">제출 증거</CardTitle>
                      <Badge variant="secondary">{data.media.length}건</Badge>
                    </div>
                    <CardDescription>
                      원본별 확인·재촬영 요청 후 전체 증거를 승인합니다.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    disabled={!data.media.length || Boolean(busyAction)}
                    onClick={() =>
                      void mutate(
                        "approve-evidence",
                        () => snapApi.media.approveTaskEvidence(taskId),
                        "증거 검토를 승인했습니다."
                      )
                    }
                  >
                    {busyAction === "approve-evidence" ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                    전체 증거 승인
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {data.media.length ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {data.media.map((media, index) => {
                      const id = textValue(media, "id", "media_id") || String(index)
                      const level = textValue(media, "evidence_level", "status").toLowerCase()
                      const confirmed = level === "confirmed" || media.confirmed === true
                      const rejected = level === "low" || level === "rejected"
                      return (
                        <div key={id} className={cn("overflow-hidden rounded-md border", confirmed && "border-success/50", rejected && "border-destructive/50")}>
                          <div className="flex aspect-[4/3] items-center justify-center bg-muted">
                            <Camera className="size-8 text-muted-foreground/50" />
                          </div>
                          <div className="space-y-2 p-3">
                            <div className="truncate text-sm font-medium">
                              {textValue(media, "capture_key", "label", "media_type") || `증거 ${index + 1}`}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {confirmed ? "확인됨" : rejected ? "재촬영 요청" : "확인 필요"}
                            </div>
                            {!confirmed ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  disabled={Boolean(busyAction)}
                                  onClick={() =>
                                    void mutate(
                                      `confirm-${id}`,
                                      () => snapApi.media.confirm(id),
                                      "증거를 확인했습니다."
                                    )
                                  }
                                >
                                  <Check /> 확인
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  disabled={!rejectReason.trim() || Boolean(busyAction)}
                                  onClick={() =>
                                    void mutate(
                                      `reject-${id}`,
                                      () => snapApi.media.reject(id, { reason: rejectReason.trim() }),
                                      "재촬영을 요청했습니다."
                                    )
                                  }
                                >
                                  <X /> 반려
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <InlineState title="아직 제출된 증거가 없습니다" description="작업 배정 또는 외부 업로드 링크를 생성해 증거를 수집하세요." />
                )}
                <div className="mt-4">
                  <Input value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="재촬영 요청 사유를 입력한 뒤 해당 증거의 반려를 누르세요" />
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button variant="outline" onClick={() => navigate("SC-18")}>
            작업 목록 <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}

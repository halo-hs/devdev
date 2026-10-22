import { useState, useRef } from "react"
import { aiHandoffCopy } from "@trade-os/lib/aiHandoffCopy"
import { toast } from "sonner"
import { FileText, X, Paperclip, Send, Loader2, RefreshCw, Database, Building2, ExternalLink, Copy, RotateCcw, ThumbsUp, ThumbsDown, Search, Check, Plus, Bookmark, SquarePen, PanelRight, Sparkles } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet"
import { AiBusinessTools } from "@trade-os/ai/AiBusinessTools"
import { shipmentReviewSamples } from "@trade-os/lib/erpMenuSamples"
import { type Navigate, type ErpMenuTarget, type Tone } from "@trade-os/ErpScreens"

// Conversation layout reference: Open WebUI v0.6.5 (BSD-3-Clause).
// See THIRD_PARTY_NOTICES.md for the pinned source and license notice.
type AskTurnState = "ready" | "not-found" | "empty" | "loading" | "waiting"

type AskFile = {
  id: string
  name: string
  type: string
  reference: string
  updatedAt: string
}

type AskTurn = {
  id: string
  question: string
  state: AskTurnState
  attachments?: AskFile[]
}

const askFiles: AskFile[] = [
  {
    id: "invoice-hb-2607-003",
    name: "Invoice_HB-2607-003.pdf",
    type: "상업송장",
    reference: "DL-260708-01 · ACME GmbH",
    updatedAt: "오늘 09:18",
  },
  {
    id: "sc-2026-0708",
    name: "SC-2026-0708.pdf",
    type: "판매계약서",
    reference: "DL-260708-08 · ACME GmbH",
    updatedAt: "오늘 08:42",
  },
  {
    id: "packing-list-0707",
    name: "PackingList_0707.pdf",
    type: "포장명세서",
    reference: "DL-260708-01 · KATAMAN",
    updatedAt: "어제 16:04",
  },
  {
    id: "bl-2607-014",
    name: "B_L_2607_014.pdf",
    type: "선하증권",
    reference: "DL-260704-02 · Nordic Raw Materials AB",
    updatedAt: "08.27 14:24",
  },
  {
    id: "po-260704-18",
    name: "PO-260704-18.pdf",
    type: "발주서",
    reference: "DL-260704-02 · Hanbit Trading Co.",
    updatedAt: "08.27 13:41",
  },
]

export function AskPrototype({
  onNavigate,
  role = "owner",
  initialQuestion = "",
  submitOnOpen = false,
}: {
  onNavigate: Navigate
  role?: "owner" | "admin" | "member"
  initialQuestion?: string
  submitOnOpen?: boolean
}) {
  const [question, setQuestion] = useState(initialQuestion)
  const [turns, setTurns] = useState<AskTurn[]>(() =>
    submitOnOpen && initialQuestion.trim()
      ? [
          {
            id: "initial",
            question: initialQuestion.trim(),
            state: "ready",
          },
        ]
      : []
  )
  const [activeConversation, setActiveConversation] = useState<string | null>(
    submitOnOpen && Boolean(initialQuestion.trim()) ? "current" : null
  )
  const [historyOpen, setHistoryOpen] = useState(true)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false)
  const [historyQuery, setHistoryQuery] = useState("")
  const [fileFinderOpen, setFileFinderOpen] = useState(false)
  const [fileQuery, setFileQuery] = useState("")
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([])
  const [attachedFiles, setAttachedFiles] = useState<AskFile[]>([])
  const [feedbackByTurn, setFeedbackByTurn] = useState<
    Record<string, "up" | "down" | undefined>
  >({})
  const threadEndRef = useRef<HTMLDivElement | null>(null)

  type AskSource = {
    title: string
    meta: string
    label: string
    target: ErpMenuTarget
  }

  type AskResponse = {
    title: string
    body: string
    sources: AskSource[]
  }

  const getResponse = (value: string): AskResponse => {
    if (
      /도착|출항|본문|문구|서류 필요|남은 업무|저장한|등록 거래|문서에서/.test(
        value
      )
    ) {
      return {
        title: "조회 조건과 문서 근거를 함께 확인할 수 있습니다.",
        body: "상세 조회에서 거래처별 등록 거래, ETD·ETA 기준 선적, 문서 정보·보관된 본문, 현재 남은 업무를 선택하세요. 기간과 문구를 지정해 조회하고 그 시점의 답변을 저장할 수 있습니다.",
        sources: [
          {
            title: aiHandoffCopy.workspace.tools,
            meta: "조건별 업무 조회 · 문서 검색 · 저장 답변",
            label: "업무",
            target: "ask",
          },
        ],
      }
    }
    if (/받을 돈|지급할 돈|줄 돈|잔액|입출금|정산/.test(value)) {
      return {
        title: "현재 받을 돈과 지급할 돈은 정산 근거를 확인해야 합니다.",
        body: "예정액, 실제 입출금, 지급 적용과 미배분 현금을 구분합니다. 현재 로컬 예시의 원천 검증은 연결되지 않아 공식 잔액은 보류합니다.",
        sources: [
          {
            title: "현재 잔액과 검증 상태",
            meta: "통화별 예정액 · 기존 지급 기록 · 검증 상태",
            label: "정산",
            target: "settlement",
          },
        ],
      }
    }
    if (value.includes("B/L") || value.includes("누락")) {
      return {
        title: "B/L이 누락된 거래는 2건입니다.",
        body: "7월 알루미늄 스크랩 수입은 선적이 진행 중이지만 B/L이 아직 연결되지 않았습니다. 부산항 산업재 수입도 필수 서류 5종 중 B/L이 미비한 상태입니다.",
        sources: [
          {
            title: "7월 알루미늄 스크랩 수입",
            meta: "DL-260708-01 · 선적 중 · B/L 미비",
            label: "거래",
            target: "deal",
          },
          {
            title: "부산항 산업재 수입",
            meta: "DL-260704-02 · 통관 중 · 중요 서류 4/5",
            label: "거래",
            target: "deals",
          },
          {
            title: "검토·배정 대기 문서",
            meta: "B/L 분석 중 1건",
            label: "문서",
            target: "inbox",
          },
        ],
      }
    }

    if (value.includes("GP") || value.includes("마진")) {
      return {
        title: "GP가 가장 크게 낮아진 거래처는 ACME GmbH입니다.",
        body: "최근 30일 기준 GP가 4.8%p 하락했습니다. 운임 상승과 계약 단가 변경이 함께 반영된 거래 2건이 주요 원인입니다.",
        sources: [
          {
            title: "ACME GmbH",
            meta: "최근 30일 GP 11.2% → 6.4%",
            label: "성과",
            target: "sales",
          },
          {
            title: "ACME 7월 해상운송 계약",
            meta: "DL-260707-04 · 운임 상승",
            label: "거래",
            target: "deal",
          },
          {
            title: "영업 성과",
            meta: "거래처별 GP 분석",
            label: "리포트",
            target: "sales",
          },
        ],
      }
    }

    if (value.includes("승인")) {
      return {
        title: "오늘 확인할 승인 요청은 2건입니다.",
        body: "판매계약서 1건과 상업송장 1건이 승인 대기 중입니다. 판매계약서는 은행 거절 전 점검을 통과했고, 상업송장은 거래 연결 확인이 필요합니다.",
        sources: [
          {
            title: "판매계약서 · SC-2026-0708.pdf",
            meta: "박서윤 요청 · 은행 점검 통과",
            label: "승인",
            target: "create",
          },
          {
            title: "상업송장 · CI-2026-0703.pdf",
            meta: "김도현 요청 · 거래 연결 확인",
            label: "승인",
            target: "create",
          },
          {
            title: "오늘 할 일",
            meta: "승인 대기 업무 모아보기",
            label: "업무",
            target: "home",
          },
        ],
      }
    }

    return {
      title: "질문에 맞는 업무와 조회 조건을 선택해 주세요.",
      body: "현재 로컬 예시에서는 조건별 조회로 거래·선적·문서 기록을 확인할 수 있습니다. 질문만으로 확인되지 않은 금액이나 업무 상태를 확정하지 않습니다.",
      sources: [
        {
          title: aiHandoffCopy.workspace.tools,
          meta: "거래처·기간·문구로 조회",
          label: "업무",
          target: "ask",
        },
      ],
    }
  }

  const submit = () => {
    const nextQuestion = question.trim()
    if (!nextQuestion) return
    setTurns((current) => [
      ...current,
      {
        id: `turn-${Date.now()}`,
        question: nextQuestion,
        state: "ready",
        attachments: attachedFiles,
      },
    ])
    setQuestion("")
    setAttachedFiles([])
    setActiveConversation("current")
    window.requestAnimationFrame(() =>
      threadEndRef.current?.scrollIntoView({ block: "end" })
    )
  }

  const quickQuestions = [
    "이번 주 받을 돈",
    "B/L이 누락된 거래",
    "GP가 낮아진 거래처",
    "오늘 승인할 문서",
  ]

  const conversations = [
    {
      id: "receivables",
      title: "이번 주 받을 돈",
      meta: "정산 3건과 거래 근거",
      question: "이번 주 받을 돈이 가장 큰 거래처는?",
      group: "오늘",
      state: "ready" as AskTurnState,
    },
    {
      id: "missing-bl",
      title: "B/L이 누락된 거래",
      meta: "필수 서류 미비 거래",
      question: "B/L이 누락된 거래를 알려줘",
      group: "오늘",
      state: "ready" as AskTurnState,
    },
    {
      id: "gp-change",
      title: "GP가 낮아진 거래처",
      meta: "최근 30일 영업 성과",
      question: "GP가 가장 많이 낮아진 거래처는?",
      group: "어제",
      state: "ready" as AskTurnState,
    },
    {
      id: "approval",
      title: "오늘 승인할 문서",
      meta: "승인 대기 문서 2건",
      question: "오늘 승인할 문서를 보여줘",
      group: "어제",
      state: "ready" as AskTurnState,
    },
    {
      id: "not-found",
      title: "거래 검색 결과 없음",
      meta: "일치하는 거래를 찾지 못함",
      question: "DL-999999-99 거래를 찾아줘",
      group: "상태 예시",
      state: "not-found" as AskTurnState,
    },
    {
      id: "empty-evidence",
      title: "참조 자료 없음",
      meta: "연결된 문서·거래 없음",
      question: "신규 거래의 정산 근거를 확인해줘",
      group: "상태 예시",
      state: "empty" as AskTurnState,
    },
    {
      id: "loading",
      title: "AI 분석 중",
      meta: "업무 데이터를 조회하는 중",
      question: "이번 달 거래 위험을 분석해줘",
      group: "상태 예시",
      state: "loading" as AskTurnState,
    },
    {
      id: "waiting",
      title: "최신 데이터 대기",
      meta: "문서 분석 완료를 기다리는 중",
      question: "방금 올린 B/L까지 반영해서 알려줘",
      group: "상태 예시",
      state: "waiting" as AskTurnState,
    },
  ]

  const filteredConversations = conversations.filter((conversation) =>
    `${conversation.title} ${conversation.meta}`
      .toLowerCase()
      .includes(historyQuery.trim().toLowerCase())
  )

  const filteredFiles = askFiles.filter((file) =>
    `${file.name} ${file.type} ${file.reference}`
      .toLowerCase()
      .includes(fileQuery.trim().toLowerCase())
  )

  const openFileFinder = () => {
    setFileQuery("")
    setSelectedFileIds([])
    setFileFinderOpen(true)
  }

  const toggleFile = (fileId: string) => {
    setSelectedFileIds((current) =>
      current.includes(fileId)
        ? current.filter((id) => id !== fileId)
        : [...current, fileId]
    )
  }

  const attachSelectedFiles = () => {
    const nextFiles = askFiles.filter((file) =>
      selectedFileIds.includes(file.id)
    )
    setAttachedFiles((current) => [
      ...current,
      ...nextFiles.filter(
        (file) => !current.some((attached) => attached.id === file.id)
      ),
    ])
    setFileFinderOpen(false)
    setSelectedFileIds([])
  }

  const startNewChat = () => {
    setToolsOpen(false)
    setQuestion("")
    setAttachedFiles([])
    setTurns([])
    setActiveConversation(null)
    setMobileHistoryOpen(false)
  }

  const openConversation = (conversation: (typeof conversations)[number]) => {
    setToolsOpen(false)
    setQuestion("")
    setAttachedFiles([])
    setTurns([
      {
        id: conversation.id,
        question: conversation.question,
        state: conversation.state,
      },
    ])
    setActiveConversation(conversation.id)
    setMobileHistoryOpen(false)
    window.requestAnimationFrame(() =>
      threadEndRef.current?.scrollIntoView({ block: "end" })
    )
  }

  const copyResponse = async (turn: AskTurn) => {
    const response = getResponse(turn.question)
    try {
      await navigator.clipboard.writeText(
        `${response.title}\n\n${response.body}`
      )
      toast.success("답변을 복사했습니다.")
    } catch {
      toast.error("답변을 복사하지 못했습니다.")
    }
  }

  const regenerateResponse = (turnId: string) => {
    setTurns((current) =>
      current.map((turn) =>
        turn.id === turnId ? { ...turn, state: "loading" } : turn
      )
    )
    window.setTimeout(() => {
      setTurns((current) =>
        current.map((turn) =>
          turn.id === turnId ? { ...turn, state: "ready" } : turn
        )
      )
      toast.success("답변을 다시 확인했습니다.")
    }, 650)
  }

  const updateFeedback = (turnId: string, feedback: "up" | "down") => {
    setFeedbackByTurn((current) => ({
      ...current,
      [turnId]: current[turnId] === feedback ? undefined : feedback,
    }))
    toast.success("의견을 반영했습니다.")
  }

  // Figma 7차 (5729:60849): the question box is 760px wide, centered.
  const renderComposer = () => (
    <div
      className="mx-auto w-full max-w-[760px] rounded-[18px] border border-[var(--color-gray-6)] bg-[var(--color-gray-12)] px-4 pt-3 pb-2.5 shadow-[0_2px_4px_rgb(0_0_0/0.05)] transition-shadow focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-ring/30"
    >
      {attachedFiles.length ? (
        // Figma 7차 (5729:61024): attached files as a list above a divider.
        <div className="mb-2 max-h-[120px] overflow-y-auto border-b border-[var(--color-gray-10)] pb-2">
          {attachedFiles.map((file) => (
            <span
              key={file.id}
              className="flex h-10 items-center gap-1.5 rounded-[var(--r-xs)] pr-2 pl-2.5 text-[15px] leading-[22px] text-[var(--color-gray-1)] hover:bg-[var(--color-gray-11)]"
            >
              <FileText className="size-4 shrink-0 text-[var(--color-gray-4)]" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <button
                type="button"
                className="flex size-6 shrink-0 items-center justify-center rounded-[var(--r-sm)] text-[var(--color-gray-4)] outline-none hover:bg-[var(--color-gray-10)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/30"
                aria-label={`${file.name} 첨부 해제`}
                onClick={() =>
                  setAttachedFiles((current) =>
                    current.filter((attached) => attached.id !== file.id)
                  )
                }
              >
                <X className="size-4" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <Textarea
        rows={4}
        aria-label="AI 질문"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault()
            submit()
          }
        }}
        className={cn(
          "max-h-48 min-h-24 w-full resize-none border-0! bg-transparent! px-2.5 pt-1 pb-2 text-[length:var(--text-body-md,15px)] leading-[22px] shadow-none! focus-visible:ring-0",
          attachedFiles.length && "min-h-20"
        )}
        placeholder={
          attachedFiles.length
            ? "첨부한 문서에 대해 질문하세요"
            : "거래, 문서, 정산에 대해 질문하세요"
        }
      />
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon-lg"
          className="-ml-2 text-[var(--color-gray-4)]"
          aria-label="파일 찾기"
          title="파일 찾기"
          onClick={openFileFinder}
        >
          <Paperclip />
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            ⌘ + Enter
          </span>
          <Button
            size="lg"
            className="h-11 min-w-[118px] rounded-[var(--r-lg)] bg-[var(--primary)] pr-5 pl-[18px] text-[17px] shadow-[0_1px_2px_rgb(5_29_57/0.1)]"
            disabled={!question.trim()}
            onClick={submit}
          >
            <Send data-icon="inline-start" /> 질문하기
          </Button>
        </div>
      </div>
    </div>
  )

  const renderAssistantTurn = (turn: AskTurn) => {
    const response = getResponse(turn.question)

    return (
      <article className="mt-8 flex gap-3 sm:gap-4">
        <img
          src="/images/ai/ai-ecoya.svg"
          alt=""
          width={24}
          height={24}
          className="size-6 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-semibold text-[var(--color-gray-1)]">ECOYA 업무 AI</span>
            <Badge variant="secondary" className="font-normal">
              오전 9:30 기준
            </Badge>
          </div>

          {turn.state === "loading" ? (
            <div className="mt-4" role="status" aria-live="polite">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Loader2 className="size-4 animate-spin text-primary" />
                업무 데이터를 확인하고 있습니다
              </div>
              <div className="mt-4 space-y-2" aria-hidden="true">
                <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-20 w-full animate-pulse rounded-[var(--r-lg)] bg-muted/70" />
              </div>
            </div>
          ) : turn.state === "waiting" ? (
            <div className="mt-4 rounded-[var(--r-lg)] border border-[var(--surface-border)] p-4">
              <div className="flex items-start gap-3">
                <RefreshCw className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold">
                    최신 데이터 반영을 기다리고 있습니다
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    방금 올린 문서의 분석이 끝나면 이 대화에서 이어서 확인할 수
                    있습니다.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setTurns((current) =>
                      current.map((item) =>
                        item.id === turn.id ? { ...item, state: "ready" } : item
                      )
                    )
                  }
                >
                  다시 확인
                </Button>
              </div>
            </div>
          ) : turn.state === "not-found" ? (
            <div className="mt-4">
              <h2 className="text-base leading-7 font-semibold">
                일치하는 업무를 찾지 못했습니다.
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                거래번호나 거래처명을 다시 확인해 주세요. 검색 범위를 전체 업무
                데이터로 바꾸어 다시 질문할 수도 있습니다.
              </p>
            </div>
          ) : turn.state === "empty" ? (
            <div className="mt-4">
              <h2 className="text-base leading-7 font-semibold">
                답변에 참조할 업무 데이터가 없습니다.
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                이 거래에 문서나 정산 정보가 연결되면 근거와 함께 답변할 수
                있습니다.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => onNavigate("inbox")}
              >
                문서 올리기
              </Button>
            </div>
          ) : (
            <>
              <h2 className="mt-3.5 text-[17px] leading-[26px] font-semibold text-[var(--color-gray-1)]">
                {response.title}
              </h2>
              <p className="mt-3.5 text-[15px] leading-6 text-[var(--color-gray-3)]">
                {response.body}
              </p>

              <section className="mt-6" aria-label="답변 근거">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <FileText className="size-3.5 text-primary" />
                    확인한 근거
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {response.sources.length}개
                  </span>
                </div>
                <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--color-gray-10)]">
                  {response.sources.map((source, index) => (
                    <button
                      key={source.title}
                      type="button"
                      onClick={() =>
                        source.target === "ask"
                          ? setToolsOpen(true)
                          : onNavigate(source.target)
                      }
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:bg-muted",
                        index > 0 && "border-t border-[var(--surface-border)]"
                      )}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-[var(--color-gray-11)] text-[var(--color-gray-4)]">
                        {source.label === "문서" ? (
                          <FileText className="size-4" />
                        ) : source.label === "정산" ||
                          source.label === "성과" ? (
                          <Database className="size-4" />
                        ) : (
                          <Building2 className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {source.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {source.meta}
                        </span>
                      </span>
                      <Badge variant="secondary" className="font-normal">
                        {source.label}
                      </Badge>
                      <ExternalLink className="size-[18px] shrink-0 text-[var(--color-primary-4)]" />
                    </button>
                  ))}
                </div>
              </section>

              <div className="mt-4 flex items-center gap-1 text-muted-foreground">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="답변 복사"
                  title="답변 복사"
                  onClick={() => void copyResponse(turn)}
                >
                  <Copy />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="답변 다시 생성"
                  title="답변 다시 생성"
                  onClick={() => regenerateResponse(turn.id)}
                >
                  <RotateCcw />
                </Button>
                <Button
                  variant={
                    feedbackByTurn[turn.id] === "up" ? "secondary" : "ghost"
                  }
                  size="icon-sm"
                  aria-label="도움이 됨"
                  title="도움이 됨"
                  aria-pressed={feedbackByTurn[turn.id] === "up"}
                  onClick={() => updateFeedback(turn.id, "up")}
                >
                  <ThumbsUp />
                </Button>
                <Button
                  variant={
                    feedbackByTurn[turn.id] === "down" ? "secondary" : "ghost"
                  }
                  size="icon-sm"
                  aria-label="도움이 되지 않음"
                  title="도움이 되지 않음"
                  aria-pressed={feedbackByTurn[turn.id] === "down"}
                  onClick={() => updateFeedback(turn.id, "down")}
                >
                  <ThumbsDown />
                </Button>
              </div>
            </>
          )}
        </div>
      </article>
    )
  }

  return (
    <div
      data-slot="ai-chat-workspace"
      className="flex h-full min-h-0 overflow-hidden bg-transparent p-4 sm:p-5"
    >
      {/* Figma 7차 (5729:61219): chat and conversation list share one card,
          split by a single line. */}
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-[var(--r-lg)] bg-[var(--color-gray-12)] shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)]">
      <Dialog open={fileFinderOpen} onOpenChange={setFileFinderOpen}>
        <DialogContent className="grid-cols-[minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-[640px]">
          <DialogHeader className="px-6 pt-6 pb-0 text-left">
            <DialogTitle>파일 찾기</DialogTitle>
            <DialogDescription>
              대화에서 확인할 기존 업무 문서를 선택하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pt-4 pb-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={fileQuery}
                onChange={(event) => setFileQuery(event.target.value)}
                className="h-10 pl-10"
                placeholder="파일명, 문서 유형, 거래번호 검색"
                aria-label="업무 파일 검색"
              />
            </div>

            <div className="mt-3">
              <div className="flex h-8 items-center justify-between px-1 text-[13px] text-muted-foreground">
                <span>최근 문서</span>
                <span>{filteredFiles.length}건</span>
              </div>
              <div className="max-h-80 space-y-1 overflow-y-auto">
                {filteredFiles.map((file) => {
                  const selected = selectedFileIds.includes(file.id)
                  const alreadyAttached = attachedFiles.some(
                    (attached) => attached.id === file.id
                  )

                  return (
                    <button
                      key={file.id}
                      type="button"
                      aria-pressed={selected || alreadyAttached}
                      disabled={alreadyAttached}
                      onClick={() => toggleFile(file.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-[var(--r-md)] px-3 py-2.5 text-left outline-none hover:bg-[var(--color-gray-11)] focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-default disabled:opacity-60",
                        (selected || alreadyAttached) && "bg-[var(--color-primary-10)] hover:bg-[var(--color-primary-10)]"
                      )}
                    >
                      {/* Visual checkbox only: the row button carries aria-pressed. */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-[4px] border border-[var(--color-gray-7)] bg-[var(--color-gray-12)] text-white",
                          selected && "border-[var(--primary)] bg-[var(--primary)]",
                          alreadyAttached && "border-[var(--color-gray-8)] bg-[var(--color-gray-10)]"
                        )}
                      >
                        {selected ? <Check className="size-3.5" /> : null}
                      </span>
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--r-md)] bg-[var(--color-gray-11)] text-[var(--color-gray-3)]">
                        <FileText className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] leading-[22px]">
                          {file.name}
                        </span>
                        <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">
                          {file.type} · {file.reference}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {alreadyAttached ? "첨부됨" : file.updatedAt}
                      </span>
                    </button>
                  )
                })}
                {!filteredFiles.length ? (
                  <div className="px-4 py-12 text-center">
                    <Search className="mx-auto size-7 text-[var(--color-gray-2)]" />
                    <p className="mt-3 text-sm font-medium">
                      찾는 파일이 없습니다.
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      파일명이나 거래번호를 다시 확인하세요.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 border-t border-[var(--color-gray-10)] px-6 py-4">
            <Button variant="outline" onClick={() => setFileFinderOpen(false)}>
              취소
            </Button>
            <Button
              disabled={!selectedFileIds.length}
              onClick={attachSelectedFiles}
            >
              {selectedFileIds.length
                ? `${selectedFileIds.length}개 첨부`
                : "파일 첨부"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={mobileHistoryOpen} onOpenChange={setMobileHistoryOpen}>
        <SheetContent
          id="ai-conversation-list-mobile"
          side="right"
          showCloseButton={false}
          overlayClassName="top-14"
          className="top-14! bottom-0! h-auto! w-[300px] gap-0 p-0 lg:hidden"
        >
          <div className="sr-only">
            <SheetTitle>대화 목록</SheetTitle>
            <SheetDescription>
              이전 업무 질문을 검색하고 다시 엽니다.
            </SheetDescription>
          </div>
          <div className="flex h-14 items-center gap-2 border-b border-[var(--surface-border)] px-3">
            <Button
              variant="outline"
              className="flex-1 justify-start bg-background"
              onClick={startNewChat}
            >
              <Plus /> 새 대화
            </Button>
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="대화 목록 닫기"
              >
                <X />
              </Button>
            </SheetClose>
          </div>
          <div className="space-y-2 p-3">
            <Button
              variant={toolsOpen ? "secondary" : "outline"}
              className="w-full justify-start"
              aria-pressed={toolsOpen}
              onClick={() => {
                setToolsOpen(true)
                setMobileHistoryOpen(false)
              }}
            >
              <Bookmark /> 저장한 답변과 상세 조회
            </Button>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={historyQuery}
                onChange={(event) => setHistoryQuery(event.target.value)}
                className="h-9 bg-[var(--control-background)] pl-9 text-sm"
                placeholder="대화 검색"
                aria-label="대화 검색"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
            {["오늘", "어제", "상태 예시"].map((group) => {
              const grouped = filteredConversations.filter(
                (conversation) => conversation.group === group
              )
              if (!grouped.length) return null
              return (
                <div key={group} className="mb-5">
                  <div className="px-2 pb-3 text-[12px] font-semibold text-[var(--color-gray-4)]">
                    {group}
                  </div>
                  <div className="space-y-0.5">
                    {grouped.map((conversation) => (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => openConversation(conversation)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-[8px] border border-transparent p-2.5 text-left transition-colors outline-none hover:bg-[var(--color-primary-10)] focus-visible:ring-2 focus-visible:ring-primary/30",
                          activeConversation === conversation.id &&
                          "border-[var(--color-primary-4)] bg-[var(--color-primary-10)]"
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] leading-5 font-semibold text-[var(--color-gray-2)]">
                            {conversation.title}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] leading-4 text-[var(--color-gray-4)]">
                            {conversation.meta}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-start gap-1 px-5 pt-5 pb-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid min-w-0 gap-1">
              <span className="block truncate text-[18px] leading-[26px] font-bold text-[var(--color-gray-1)]">ECOYA 업무 AI</span>
              <span className="block truncate text-[15px] leading-[22px] text-[var(--color-gray-5)]">
                거래·문서·정산 근거로 답변
              </span>
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="outline" size="lg" onClick={startNewChat}>
              <SquarePen data-icon="inline-start" /> 새 대화
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              aria-controls="ai-conversation-list-mobile"
              aria-expanded={mobileHistoryOpen}
              aria-label="대화 목록 열기"
              title="대화 목록 열기"
              onClick={() => setMobileHistoryOpen(true)}
            >
              <PanelRight />
            </Button>
            {!historyOpen ? (
              <Button
                variant="ghost"
                size="icon-sm"
                className="hidden lg:inline-flex"
                aria-controls="ai-conversation-list"
                aria-expanded={historyOpen}
                aria-label="대화 목록 열기"
                title="대화 목록 열기"
                onClick={() => setHistoryOpen(true)}
              >
                <PanelRight />
              </Button>
            ) : null}
          </div>
        </header>

        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto",
            !toolsOpen && "hidden"
          )}
        >
          <AiBusinessTools
            shipments={shipments}
            files={askFiles}
            onNavigate={onNavigate}
          />
        </div>
        <div className={cn("min-h-0 flex-1", toolsOpen && "hidden")}>
          {turns.length === 0 ? (
            <div className="flex h-full w-full flex-col justify-center overflow-y-auto px-5 py-12">
              <img
                src="/images/ai/ai-ecoya-logo.svg"
                alt=""
                width={96}
                height={96}
                className="mx-auto mb-8 size-24 shrink-0"
              />
              <h1 className="text-center text-[22px] leading-[30px] font-bold text-[var(--color-gray-1)]">
                {aiHandoffCopy.workspace.question}
              </h1>
              <p className="mx-auto mt-2 max-w-xl text-center text-[15px] leading-[22px] text-[var(--color-gray-4)]">
                {aiHandoffCopy.workspace.guide}
              </p>
              <div className="mt-8 w-full">
                {renderComposer()}
                {role === "member" ? (
                  <div className="mx-auto mt-5 flex max-w-2xl flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
                    <p>거래 화면에서 그 거래에 대해 물을 수 있습니다.</p>
                    <Button variant="outline" size="sm" onClick={() => onNavigate("deals")}>거래 목록 보기</Button>
                  </div>
                ) : (
                  <div className="mx-auto mt-5 grid max-w-2xl gap-1 sm:grid-cols-2">
                    {quickQuestions.map((item) => (
                      <Button
                        key={item}
                        variant="ghost"
                        className="h-auto justify-start gap-3 px-3 py-2.5 text-left text-sm font-normal text-muted-foreground hover:text-foreground"
                        onClick={() => setQuestion(item)}
                      >
                        <Sparkles className="size-3.5 text-primary" />
                        {item}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="w-full px-5 py-8 sm:py-10">
                  {turns.map((turn, index) => (
                    <section
                      key={turn.id}
                      className={cn(
                        index > 0 &&
                          "mt-10 border-t border-[var(--surface-border)] pt-10"
                      )}
                      aria-label={`대화 ${index + 1}`}
                    >
                      <div className="flex justify-end">
                        <div className="flex max-w-[82%] flex-col items-end gap-2">
                          {turn.attachments?.length ? (
                            <div className="flex flex-wrap justify-end gap-2">
                              {turn.attachments.map((file) => (
                                <span
                                  key={file.id}
                                  className="inline-flex max-w-64 items-center gap-2 rounded-[var(--r-md)] border border-[var(--surface-border)] bg-background px-3 py-2 text-xs shadow-xs"
                                >
                                  <FileText className="size-3.5 shrink-0 text-primary" />
                                  <span className="truncate">{file.name}</span>
                                </span>
                              ))}
                            </div>
                          ) : null}
                          <div className="rounded-2xl bg-[var(--color-primary-10)] px-3.5 py-2 text-[15px] leading-[22px] text-[var(--primary)]">
                            {turn.question}
                          </div>
                        </div>
                      </div>
                      {renderAssistantTurn(turn)}
                    </section>
                  ))}
                  <div ref={threadEndRef} />
                </div>
              </div>
              <div className="shrink-0 bg-[var(--color-gray-12)] px-5 pt-2 pb-5">
                {renderComposer()}
              </div>
            </div>
          )}
        </div>
      </section>

      <aside
        className={cn(
          "hidden min-h-0 w-72 shrink-0 flex-col gap-4 overflow-hidden border-l border-[var(--color-gray-10)] p-5 lg:flex xl:w-80",
          !historyOpen && "lg:hidden"
        )}
        id="ai-conversation-list"
        aria-label="대화 목록"
      >
        <div className="flex shrink-0 items-start justify-between gap-1">
          <span className="text-[18px] leading-[26px] font-bold text-[var(--color-gray-1)]">대화 목록</span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="대화 목록 닫기"
            title="대화 목록 닫기"
            onClick={() => setHistoryOpen(false)}
          >
            <X />
          </Button>
        </div>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={startNewChat}
          >
            <Plus /> 새 대화
          </Button>
          {/* Saved answers live with the conversations instead of a tab above the chat. */}
          <Button
            variant={toolsOpen ? "secondary" : "outline"}
            className="w-full justify-start"
            aria-pressed={toolsOpen}
            onClick={() => setToolsOpen(true)}
          >
            <Bookmark /> 저장한 답변과 상세 조회
          </Button>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={historyQuery}
              onChange={(event) => setHistoryQuery(event.target.value)}
              className="h-10 pl-9 shadow-[0_2px_4px_rgb(0_0_0/0.05)]"
              placeholder="대화 검색"
              aria-label="대화 검색"
            />
          </div>
        </div>
        <div className="-mr-3 min-h-0 flex-1 overflow-y-auto pr-3">
          {["오늘", "어제", "상태 예시"].map((group) => {
            const grouped = filteredConversations.filter(
              (conversation) => conversation.group === group
            )
            if (!grouped.length) return null
            return (
              <div key={group} className="mb-5">
                <div className="px-2 pb-3 text-[12px] font-semibold text-[var(--color-gray-4)]">
                  {group}
                </div>
                <div className="space-y-0.5">
                  {grouped.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => openConversation(conversation)}
                      className={cn(
                        "group flex w-full items-center gap-2.5 rounded-[8px] border border-transparent p-2.5 text-left transition-colors outline-none hover:bg-[var(--color-primary-10)] focus-visible:ring-2 focus-visible:ring-primary/30",
                        activeConversation === conversation.id &&
                          "border-[var(--color-primary-4)] bg-[var(--color-primary-10)]"
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] leading-5 font-semibold text-[var(--color-gray-2)]">
                          {conversation.title}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] leading-4 text-[var(--color-gray-4)]">
                          {conversation.meta}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          {!filteredConversations.length ? (
            <div className="px-3 py-8 text-center text-xs text-muted-foreground">
              찾는 대화가 없습니다.
            </div>
          ) : null}
        </div>
      </aside>
      </div>
    </div>
  )
}

const shipments = [
  {
    deal: "DL-260708-01",
    dealName: "7월 알루미늄 스크랩 수입",
    bl: "HMM014W2607",
    container: "HMMU 7820194",
    route: "Busan → Hamburg",
    vessel: "HMM Green",
    etd: "07.20",
    eta: "08.03",
    status: "운송 중",
    tone: "blue" as Tone,
    evidence: 8,
    evidenceCount: 3,
    documents: "B/L 확인",
  },
  {
    deal: "DL-260708-01",
    dealName: "7월 알루미늄 스크랩 수입",
    bl: "ONE26070819",
    container: "ONEU 1083275",
    route: "Shanghai → Incheon",
    vessel: "ONE Harmony",
    etd: "07.10",
    eta: "07.15",
    status: "도착 임박",
    tone: "amber" as Tone,
    evidence: 3,
    evidenceCount: 2,
    documents: "B/L 누락",
  },
  {
    deal: "DL-260701-04",
    dealName: "6월 재활용 원자재 수입",
    bl: "MSC26062077",
    container: "MSCU 8425510",
    route: "Singapore → Busan",
    vessel: "MSC Clara",
    etd: "06.28",
    eta: "07.08",
    status: "지연",
    tone: "red" as Tone,
    evidence: 0,
    evidenceCount: 0,
    documents: "증거 없음",
  },
  {
    deal: "DL-260701-04",
    dealName: "6월 재활용 원자재 수입",
    bl: "COS26070134",
    container: "COSU 2214870",
    route: "Qingdao → Incheon",
    vessel: "COSCO Star",
    etd: "07.01",
    eta: "07.06",
    status: "도착",
    tone: "green" as Tone,
    evidence: 5,
    evidenceCount: 2,
    documents: "서류 완료",
  },
  {
    deal: "DL-260704-04",
    dealName: "ACME 7월 해상운송 계약",
    bl: "MAEU26070481",
    container: "MSKU 3916208",
    route: "Hamburg → Busan",
    vessel: "Maersk Horsburgh",
    etd: "07.04",
    eta: "07.18",
    status: "운송 중",
    tone: "blue" as Tone,
    evidence: 6,
    evidenceCount: 2,
    documents: "B/L 확인",
  },
  {
    deal: "DL-260704-04",
    dealName: "ACME 7월 해상운송 계약",
    bl: "MAEU26070496",
    container: "MRKU 4528103",
    route: "Hamburg → Busan",
    vessel: "Maersk Horsburgh",
    etd: "07.04",
    eta: "07.18",
    status: "운송 중",
    tone: "blue" as Tone,
    evidence: 4,
    evidenceCount: 2,
    documents: "서류 완료",
  },
  {
    deal: "DL-260625-03",
    dealName: "Nordic 원자재 부산항 수입",
    bl: "CMDU26062541",
    container: "CMAU 1182046",
    route: "Gothenburg → Busan",
    vessel: "CMA CGM Louvre",
    etd: "06.25",
    eta: "07.16",
    status: "도착 임박",
    tone: "amber" as Tone,
    evidence: 2,
    evidenceCount: 1,
    documents: "B/L 확인",
  },
  {
    deal: "DL-260625-03",
    dealName: "Nordic 원자재 부산항 수입",
    bl: "CMDU26062558",
    container: "CMAU 4418792",
    route: "Gothenburg → Busan",
    vessel: "CMA CGM Louvre",
    etd: "06.25",
    eta: "07.16",
    status: "운송 중",
    tone: "blue" as Tone,
    evidence: 0,
    evidenceCount: 0,
    documents: "B/L 누락",
  },
  {
    deal: "DL-260629-03",
    dealName: "싱가포르 구리 스크랩 매입",
    bl: "ONEY26062973",
    container: "ONEU 7491025",
    route: "Singapore → Incheon",
    vessel: "ONE Innovation",
    etd: "06.29",
    eta: "07.19",
    status: "운송 중",
    tone: "blue" as Tone,
    evidence: 7,
    evidenceCount: 3,
    documents: "서류 완료",
  },
  {
    deal: "DL-260629-03",
    dealName: "싱가포르 구리 스크랩 매입",
    bl: "ONEY26062988",
    container: "ONEU 6243891",
    route: "Singapore → Incheon",
    vessel: "ONE Innovation",
    etd: "06.29",
    eta: "07.19",
    status: "운송 중",
    tone: "blue" as Tone,
    evidence: 5,
    evidenceCount: 2,
    documents: "B/L 확인",
  },
  {
    deal: "DL-260711-02",
    dealName: "HMM Green 재생 알루미늄 수입",
    bl: "HLCU26071125",
    container: "HLXU 8012459",
    route: "Rotterdam → Incheon",
    vessel: "HMM Rotterdam",
    etd: "07.11",
    eta: "07.28",
    status: "운송 중",
    tone: "blue" as Tone,
    evidence: 4,
    evidenceCount: 2,
    documents: "B/L 확인",
  },
  {
    deal: "DL-260711-02",
    dealName: "HMM Green 재생 알루미늄 수입",
    bl: "HLCU26071139",
    container: "HLXU 4931807",
    route: "Rotterdam → Incheon",
    vessel: "HMM Rotterdam",
    etd: "07.11",
    eta: "07.28",
    status: "운송 중",
    tone: "blue" as Tone,
    evidence: 3,
    evidenceCount: 2,
    documents: "서류 완료",
  },
  {
    deal: "DL-260713-07",
    dealName: "일본 내륙운송 발주",
    bl: "NYKS26071307",
    container: "NYKU 7712034",
    route: "Yokohama → Busan",
    vessel: "NYK Vega",
    etd: "07.13",
    eta: "07.17",
    status: "도착 임박",
    tone: "amber" as Tone,
    evidence: 1,
    evidenceCount: 1,
    documents: "B/L 확인",
  },
  {
    deal: "DL-260630-06",
    dealName: "태국 압축 스크랩 수입",
    bl: "EGLV26063061",
    container: "EGHU 6021498",
    route: "Laem Chabang → Busan",
    vessel: "Ever Balance",
    etd: "06.30",
    eta: "07.14",
    status: "도착",
    tone: "green" as Tone,
    evidence: 6,
    evidenceCount: 3,
    documents: "서류 완료",
  },
].map((row) => ({ ...row, reviewDocument: shipmentReviewSamples[row.bl] }))

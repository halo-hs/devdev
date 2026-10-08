import { appLocation } from "@/app/app-location"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { Button } from "@shared/components/ui/button"
import {
  applicableItems,
  applyGuideEvent,
  isDone,
  parseGuide,
  type GuideEvent,
  type GuideItem,
  type GuideRole,
  type GuideState,
} from "./state"

type Intent = {
  token: string
  scope: string
  item: GuideItem
  path: string
  expires: number
}
const guides: Record<
  GuideItem,
  { selector: string; title: string; description: string }
> = {
  C1: {
    selector: '[data-guide-target="organization"]',
    title: "조직 정보 확인하기",
    description:
      "문서에 사용되는 조직 정보입니다. 내용을 확인하세요. 실제 변경은 필수가 아닙니다.",
  },
  C2: {
    selector: '[data-guide-target="invite"]',
    title: "팀원 초대 방법 확인하기",
    description:
      "이 버튼에서 팀원의 이메일과 역할을 지정해 초대합니다. 지금 초대를 보내지 않아도 됩니다.",
  },
  T1: {
    selector:
      '[aria-label="PDF 파일 선택"], [aria-label="여러 PDF 파일 선택 또는 끌어놓기"], [aria-label="PDF 파일 선택 또는 끌어놓기"]',
    title: "첫 PDF 문서 올리기",
    description:
      "최근 발주서 PDF 한 건을 선택하세요. 파일 생성이 성공해야 이 항목이 완료됩니다.",
  },
  T2: {
    selector: '[aria-label="항목 점검"] input:not(:disabled)',
    title: "AI 결과 확인·확정하기",
    description:
      "원문과 추출 결과를 비교하고 필요한 값을 수정한 뒤 검토를 완료하세요.",
  },
  T3: {
    selector: '[data-guide-target="connect"]',
    title: "거래 만들기·연결하기",
    description:
      "같은 문서를 기존 거래 또는 새 거래에 연결하고 직접 확정하세요.",
  },
  T4: {
    selector: '[data-guide-target="question"]',
    title: "거래 데이터에 AI로 질문하기",
    description:
      "연결한 거래를 대상으로 질문하세요. 답변의 근거까지 확인해야 완료됩니다.",
  },
}
function destination(item: GuideItem, state: GuideState) {
  if (item === "C1") return "/erp/settings?section=organization"
  if (item === "C2") return "/erp/settings?section=members"
  if (item === "T4") return "/erp/home"
  if (!state.anchor) return "/erp/documents/upload"
  return `/erp/documents/upload/${encodeURIComponent(state.anchor.documentId)}/${item === "T3" ? "connect" : "review"}`
}
type Runtime = {
  state: GuideState | null
  error: boolean
  role: GuideRole
  complete: boolean
  count: number
  total: number
  reload: () => void
  start: (item: GuideItem) => void
  record: (event: GuideEvent) => void
}
const Context = createContext<Runtime | null>(null)
export const useStartGuide = () => useContext(Context)

export function StartGuideProvider({
  scope,
  role,
  children,
}: {
  scope: string
  role: GuideRole
  children: ReactNode
}) {
  const key = `ecoya.preview.start-guide.v1:${scope}`
  const [loaded, setLoaded] = useState<{
    key: string
    state: GuideState | null
    error: boolean
  }>({ key, state: null, error: false })
  const pendingIntent = useRef<Intent | null | undefined>(undefined)
  const [hint, setHint] = useState<GuideItem | null>(null)
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const reload = useCallback(() => {
    try {
      setLoaded({
        key,
        state: parseGuide(localStorage.getItem(key)),
        error: false,
      })
    } catch {
      setLoaded({ key, state: null, error: true })
    }
  }, [key])
  useEffect(() => {
    reload()
    const refresh = (event: StorageEvent) => {
      if (event.key === key || event.key === null) reload()
    }
    window.addEventListener("storage", refresh)
    return () => window.removeEventListener("storage", refresh)
  }, [key, reload])
  const state = loaded.key === key ? loaded.state : null
  const error = loaded.key === key && loaded.error
  const record = useCallback(
    (event: GuideEvent) => {
      if (event.type === "education" && role === "member") return
      try {
        const current = parseGuide(localStorage.getItem(key))
        const next = applyGuideEvent(current, event)
        if (next !== current) localStorage.setItem(key, JSON.stringify(next))
        setLoaded({ key, state: next, error: false })
      } catch {
        setLoaded({ key, state: null, error: true })
      }
    },
    [key, role]
  )
  const items = applicableItems(role)
  const count = state ? items.filter((item) => isDone(state, item)).length : 0
  const complete = Boolean(state && count === items.length)
  const start = useCallback(
    (item: GuideItem) => {
      if (
        !state ||
        (state.access && state.access !== "active") ||
        error ||
        !applicableItems(role).includes(item) ||
        isDone(state, item)
      )
        return
      if (
        (item === "T2" && !state.anchor) ||
        (item === "T3" && !state.trade.T2) ||
        (item === "T4" && !state.trade.T3)
      )
        return
      const path = destination(item, state)
      const intent: Intent = {
        token: crypto.randomUUID(),
        scope,
        item,
        path,
        expires: Date.now() + 60000,
      }
      try {
        sessionStorage.setItem(
          "ecoya.preview.guide-intent",
          JSON.stringify(intent)
        )
      } catch {
        setLoaded({ key, state: null, error: true })
        return
      }
      const url = new URL(path, appLocation.origin)
      url.searchParams.set("guide", intent.token)
      url.searchParams.set("role", role)
      appLocation.assign(url.pathname + url.search)
    },
    [state, error, role, scope, key]
  )
  useEffect(() => {
    if (pendingIntent.current === undefined) {
      const url = new URL(appLocation.href)
      const token = url.searchParams.get("guide")
      pendingIntent.current = null
      if (!token) return
      url.searchParams.delete("guide")
      history.replaceState(
        history.state,
        "",
        url.pathname + url.search + url.hash
      )
      try {
        const stored = JSON.parse(
          sessionStorage.getItem("ecoya.preview.guide-intent") || "null"
        ) as Intent | null
        sessionStorage.removeItem("ecoya.preview.guide-intent")
        if (stored?.token === token) pendingIntent.current = stored
      } catch {
        return
      }
    }
    const intent = pendingIntent.current
    if (
      !intent ||
      intent.scope !== scope ||
      intent.expires < Date.now() ||
      !applicableItems(role).includes(intent.item) ||
      new URL(intent.path, appLocation.origin).pathname !== appLocation.pathname
    )
      return
    let current: GuideState
    try {
      current = parseGuide(localStorage.getItem(key))
    } catch {
      return
    }
    if (current.access && current.access !== "active") return
    if (destination(intent.item, current).split("?")[0] !== appLocation.pathname)
      return
    const initialPath = appLocation.pathname
    let tries = 0
    const timer = window.setInterval(() => {
      if (++tries > 60 || appLocation.pathname !== initialPath) {
        clearInterval(timer)
        return
      }
      const node = document.querySelector<HTMLElement>(
        guides[intent.item].selector
      )
      if (
        !node ||
        !node.getClientRects().length ||
        node.matches(':disabled,[aria-disabled="true"]')
      )
        return
      clearInterval(timer)
      pendingIntent.current = null
      node.scrollIntoView({ block: "center", behavior: "instant" })
      node.focus({ preventScroll: true })
      setTarget(node)
      setHint(intent.item)
      if (intent.item === "C1" || intent.item === "C2")
        record({
          type: "education",
          item: intent.item,
          receipt: `preview-target:${intent.token}`,
        })
    }, 100)
    return () => clearInterval(timer)
  }, [scope, role, record, key])
  useEffect(() => {
    if (!hint || !target) return
    target.classList.add("ring-2", "ring-primary", "ring-offset-4")
    const close = () => {
      setHint(null)
      target.focus({ preventScroll: true })
    }
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close()
    }
    const timer = window.setInterval(() => {
      if (!target.isConnected) setHint(null)
    }, 200)
    window.addEventListener("keydown", keydown)
    return () => {
      clearInterval(timer)
      window.removeEventListener("keydown", keydown)
      target.classList.remove("ring-2", "ring-primary", "ring-offset-4")
    }
  }, [hint, target])
  const value = useMemo(
    () => ({
      state,
      error,
      role,
      complete,
      count,
      total: items.length,
      reload,
      start,
      record,
    }),
    [state, error, role, complete, count, items.length, reload, start, record]
  )
  return (
    <Context.Provider value={value}>
      {children}
      {hint && (
        <aside
          role="dialog"
          aria-label={guides[hint].title}
          className="fixed right-4 bottom-4 left-4 z-50 rounded-xl border bg-background p-5 shadow-xl sm:left-auto sm:w-80"
        >
          <h2 className="font-semibold">{guides[hint].title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {guides[hint].description}
          </p>
          <Button
            className="mt-3"
            variant="outline"
            onClick={() => {
              setHint(null)
              target?.focus({ preventScroll: true })
            }}
          >
            닫기
          </Button>
        </aside>
      )}
    </Context.Provider>
  )
}

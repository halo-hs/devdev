import {
  cloneElement,
  createContext,
  useCallback,
  useContext,
  useRef,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react"
import { Lock } from "lucide-react"
import { toast } from "sonner"

// A Member with only the free View seat can read, search and download
// existing PDFs (PRICING-POLICY 2장). Work actions stay visible; using one
// explains the View limit and offers one permission request per product to
// the OWNER·ADMIN (CS-09 개인 Seat가 없는 사용자의 요청 진입). The request is
// a local preview; no notification is really sent.
const ViewSeatContext = createContext<{ viewOnly: boolean; guard: () => boolean }>({
  viewOnly: false,
  guard: () => false,
})

export function ViewSeatProvider({ viewOnly, children }: { viewOnly: boolean; children: ReactNode }) {
  const requested = useRef(false)
  const guard = useCallback(() => {
    if (!viewOnly) return false
    if (requested.current) {
      toast("권한 요청 대기 중이에요", {
        id: "view-seat",
        description: "조직 대표나 관리자가 승인하면 알림으로 알려 드릴게요.",
        action: {
          label: "요청 취소",
          onClick: () => {
            requested.current = false
            toast("권한 요청을 취소했어요", { id: "view-seat" })
          },
        },
      })
      return true
    }
    toast("View 권한만 있어요", {
      id: "view-seat",
      description: "조회·검색과 기존 PDF 다운로드만 할 수 있어요. 이 작업을 하려면 Trade OS 사용 권한이 필요해요.",
      action: {
        label: "권한 요청 보내기",
        onClick: () => {
          requested.current = true
          toast.success("권한 요청을 보냈어요", {
            id: "view-seat",
            description: "조직 대표와 관리자에게 알림이 갔어요. 승인되면 알려 드릴게요.",
          })
        },
      },
    })
    return true
  }, [viewOnly])
  return <ViewSeatContext.Provider value={{ viewOnly, guard }}>{children}</ViewSeatContext.Provider>
}

export function useViewOnly() {
  return useContext(ViewSeatContext).viewOnly
}

/** Returns true (after showing the View notice) when the action must not run. */
export function useViewSeatGuard() {
  return useContext(ViewSeatContext).guard
}

type ActionElement = ReactElement<{
  children?: ReactNode
  disabled?: boolean
  onClick?: (event: MouseEvent<HTMLElement>) => void
}>

/** Keeps a paid work action visible with a lock; pressing it shows the View notice. */
export function ViewSeatAction({ children, showLock = true }: { children: ActionElement; showLock?: boolean }) {
  const { viewOnly, guard } = useContext(ViewSeatContext)
  if (!viewOnly) return children
  return cloneElement(children, {
    disabled: false,
    onClick: (event: MouseEvent<HTMLElement>) => {
      event.preventDefault()
      event.stopPropagation()
      guard()
    },
    children: showLock ? (
      <>
        {children.props.children}
        <Lock data-icon="inline-end" aria-hidden />
      </>
    ) : (
      children.props.children
    ),
  })
}

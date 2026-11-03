import { ViewSeatContext } from "./useViewSeat"
import {
  cloneElement,
  useCallback,
  useContext,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react"
import { Lock } from "lucide-react"
import { toast } from "sonner"
import { SettingsDemoContext } from "@share/settings/useSettingsDemo"

// A Member without a Trade OS seat (View only) can read, search and download
// existing PDFs (PRICING-POLICY 2장). Work actions stay visible; using one
// explains the View limit and offers one permission request, which OWNER·ADMIN
// approve or reject in 설정 > 사용자 관리 (CS-09, Figma 설정 · 04 사용자 관리).
const MEMBER_ID = "member"

export function ViewSeatProvider({ role, children }: { role: string; children: ReactNode }) {
  const demo = useContext(SettingsDemoContext)
  const viewOnly =
    role === "member" && demo?.members.find((member) => member.id === MEMBER_ID)?.erp === false
  const pending = Boolean(
    demo?.requests.some(
      (request) =>
        request.memberId === MEMBER_ID &&
        request.product === "erp" &&
        request.kind === "access" &&
        request.status === "pending"
    )
  )
  const setRequests = demo?.setRequests

  const guard = useCallback(() => {
    if (!viewOnly) return false
    if (pending) {
      toast("권한 요청 대기 중이에요", {
        id: "view-seat",
        description: "조직 대표나 관리자가 사용자 관리에서 승인하면 바로 사용할 수 있어요.",
        action: {
          label: "요청 취소",
          onClick: () => {
            setRequests?.((current) =>
              current.filter(
                (request) =>
                  !(request.memberId === MEMBER_ID && request.product === "erp" && request.status === "pending")
              )
            )
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
          setRequests?.((current) => [
            ...current.filter(
              (request) => !(request.memberId === MEMBER_ID && request.product === "erp")
            ),
            {
              id: `request-member-erp-${Date.now()}`,
              memberId: MEMBER_ID,
              product: "erp",
              kind: "access",
              status: "pending",
              requester: "member",
            },
          ])
          toast.success("권한 요청을 보냈어요", {
            id: "view-seat",
            description: "조직 대표와 관리자의 사용자 관리에 요청이 표시돼요.",
          })
        },
      },
    })
    return true
  }, [viewOnly, pending, setRequests])
  return <ViewSeatContext.Provider value={{ viewOnly, guard }}>{children}</ViewSeatContext.Provider>
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

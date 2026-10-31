import { createContext, useContext, useEffect, useState } from "react"
import { type SettingsRole } from "@share/settings/SettingsRoutePage"
import type { Member, Request } from "./SubscriptionSettings"
import { invitationExamples } from "./invitationData"

export const names = { erp: "Trade OS", snap: "SNAP" }

// Left by the demo login; the settings preview applies it to the Member's Trade OS seat.
export const MEMBER_SEAT_KEY = "ecoya.preview.member-trade-seat"

export const SettingsDemoContext = createContext<ReturnType<
  typeof useDemoState
> | null>(null)

export function useSettingsDemo() {
  const value = useContext(SettingsDemoContext)
  if (!value) throw new Error("SettingsDemoProvider is required")
  return value
}

export function useTradeSeatAssigned(role: SettingsRole) {
  const state = useContext(SettingsDemoContext)
  return state?.members.find((member) => member.id === role)?.erp ?? true
}

export function useSettingsDemoPresent() {
  return useContext(SettingsDemoContext) !== null
}

const initialMembers: Member[] = [
  {
    id: "owner",
    name: "조민영",
    email: "minyoung@ecoya.app",
    role: "owner",
    erp: true,
    snap: true,
  },
  {
    id: "admin",
    name: "김도현",
    email: "dohyun@ecoya.app",
    role: "admin",
    erp: true,
    snap: false,
  },
  {
    id: "member",
    name: "박서윤",
    email: "seoyun@ecoya.app",
    role: "member",
    erp: true,
    snap: false,
  },
]
const initialRequests: Request[] = [
  {
    id: "request-member-snap",
    memberId: "member",
    product: "snap",
    kind: "access",
    status: "pending",
    requester: "member",
  },
]

// The app preview keeps members and requests in this browser so a View
// Member's request survives logging in again as the OWNER who approves it.
// The demo login leaves `MEMBER_SEAT_KEY` to set the Member's Trade OS seat.
const DEMO_STATE_KEY = "ecoya.preview.settings-demo"

function readDemoState() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(DEMO_STATE_KEY) ?? "null") as
      | { members: Member[]; requests: Request[] }
      | null
    const members = stored?.members ?? initialMembers
    const requests = stored?.requests ?? initialRequests
    const seat = window.localStorage.getItem(MEMBER_SEAT_KEY)
    window.localStorage.removeItem(MEMBER_SEAT_KEY)
    if (!seat) return { members, requests }
    // Once the View Member has asked for Trade OS, 사용자 관리 owns the seat
    // (approve, reject or unassign there); logging in again keeps that result.
    const requested = requests.some(
      (request) => request.memberId === "member" && request.product === "erp"
    )
    if (seat === "view" && requested) return { members, requests }
    return {
      members: members.map((member) =>
        member.id === "member" ? { ...member, erp: seat === "assigned" } : member
      ),
      requests,
    }
  } catch {
    return { members: initialMembers, requests: initialRequests }
  }
}

export function useDemoState(subscriptionKind: "separate" | "bundle", persist = false) {
  const [initial] = useState(() =>
    persist ? readDemoState() : { members: initialMembers, requests: initialRequests }
  )
  const [members, setMembers] = useState(initial.members)
  const [invitations, setInvitations] = useState(invitationExamples)
  const [requests, setRequests] = useState<Request[]>(initial.requests)
  useEffect(() => {
    if (!persist) return
    try {
      window.localStorage.setItem(DEMO_STATE_KEY, JSON.stringify({ members, requests }))
    } catch {
      // The preview still works without storage.
    }
  }, [persist, members, requests])
  // Purchased capacity is a fixture. UI assignment must never change purchased capacity.
  const capacity = subscriptionKind === "bundle" ? { erp: 8, snap: 8 } : { erp: 8, snap: 5 }
  return { members, setMembers, requests, setRequests, capacity, invitations, setInvitations }
}

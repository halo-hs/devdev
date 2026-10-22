import { invitationExamples } from "./invitationData"
import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import type { ProductEntitlement, SettingsRole } from "./SettingsRoutePage"
import { SettingsDemoContext, useSettingsDemo, names } from "@share/settings/useSettingsDemo"

export type Member = {
  id: string
  name: string
  email: string
  role: SettingsRole
  erp: boolean
  snap: boolean
}
export type Request = {
  id: string
  memberId: string
  product: ProductEntitlement
  kind: "access" | "capacity"
  status: "pending" | "rejected" | "assigned"
  requester: SettingsRole
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
export function useDemoState(subscriptionKind: "separate" | "bundle") {
  const [members, setMembers] = useState(initialMembers)
  const [invitations, setInvitations] = useState(invitationExamples)
  const [requests, setRequests] = useState<Request[]>([
    {
      id: "request-member-snap",
      memberId: "member",
      product: "snap",
      kind: "access",
      status: "pending",
      requester: "member",
    },
  ])
  // Purchased capacity is a fixture. UI assignment must never change purchased capacity.
  const capacity = subscriptionKind === "bundle" ? { erp: 8, snap: 8 } : { erp: 8, snap: 5 }
  return { members, setMembers, requests, setRequests, capacity, invitations, setInvitations }
}
export function SettingsDemoProvider({ children, subscriptionKind = "separate" }: { children: ReactNode; subscriptionKind?: "separate" | "bundle" }) {
  const value = useDemoState(subscriptionKind)
  return (
    <SettingsDemoContext.Provider value={value}>
      {children}
    </SettingsDemoContext.Provider>
  )
}
export function SeatSummary({
  products,
  compact = false,
  onManage,
  manageLabel = "시트 관리",
}: {
  products: readonly ProductEntitlement[]
  compact?: boolean
  onManage?: () => void
  manageLabel?: string
}) {
  const { members, capacity } = useSettingsDemo()
  if (compact) {
    return (
      <section aria-label="구독 시트" className="grid rounded-[var(--r-lg)] bg-[var(--color-gray-12)] px-5 shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)] xl:grid-cols-2">
        {products.map((product, index) => {
          const assigned = members.filter((member) => member[product]).length
          const available = Math.max(0, capacity[product] - assigned)
          return (
            <div
              key={product}
              role="region"
              aria-label={`${names[product]} 좌석`}
              className={`flex flex-wrap items-center gap-x-3 gap-y-2 py-3 ${index > 0 ? "border-t xl:border-t-0 xl:border-l xl:pl-5" : "xl:pr-5"}`}
            >
              <strong className="min-w-18 text-sm font-medium">{names[product]}</strong>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm whitespace-nowrap">
                <span>구매 <b className="tabular-nums">{capacity[product]}</b></span>
                <span>배정 <b className="tabular-nums">{assigned}</b></span>
                <span>남음 <b className="tabular-nums">{available}</b></span>
              </div>
            </div>
          )
        })}
      </section>
    )
  }
  return (
    <section aria-label="구독 시트" className="rounded-xl border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="font-semibold">구독 시트</h2>
          <p className="mt-1 text-sm text-muted-foreground">구매 수량과 실제 배정 인원을 구분해 확인합니다.</p>
        </div>
        {onManage && <Button variant="outline" size="sm" onClick={onManage}>{manageLabel}</Button>}
      </div>
      <div className="px-5">
          <div className="hidden grid-cols-[minmax(8rem,1fr)_repeat(3,5rem)] gap-3 border-b py-3 text-xs text-muted-foreground sm:grid">
            <span>제품</span><span>구매</span><span>배정</span><span>남음</span>
          </div>
          {products.map((product) => {
            const assigned = members.filter((member) => member[product]).length
            const available = Math.max(0, capacity[product] - assigned)
            return (
              <div
                key={product}
                role="region"
                aria-label={`${names[product]} 좌석`}
                className="flex flex-wrap gap-x-4 gap-y-1 border-b py-3 text-sm last:border-b-0 sm:grid sm:grid-cols-[minmax(8rem,1fr)_repeat(3,5rem)] sm:gap-3"
              >
                <strong className="basis-full font-medium sm:basis-auto">{names[product]}</strong>
                <span className="tabular-nums"><span className="sm:hidden">구매 </span>{capacity[product]}</span>
                <span className="tabular-nums"><span className="sm:hidden">배정 </span>{assigned}</span>
                <span className="tabular-nums"><span className="sm:hidden">남음 </span>{available}</span>
              </div>
            )
          })}
      </div>
    </section>
  )
}

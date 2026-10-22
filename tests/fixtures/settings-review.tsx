import { useState } from "react"
import { createRoot } from "react-dom/client"
import { PendingInvitations } from "../../share/settings/MemberInviteSettings"
import {
  invitationExamples,
  type PendingInvitation,
} from "../../share/settings/invitationData"
import { CounterpartyPrototype } from "../../trade-os/ErpScreens"
import type { CounterpartyAccess } from "../../trade-os/counterparties/Counterparty360View"
import { TooltipProvider } from "../../src/components/ui/tooltip"

function mount(element: React.ReactNode) {
  document.getElementById("root")?.remove()
  const host = document.createElement("div")
  document.body.append(host)
  createRoot(host).render(<TooltipProvider>{element}</TooltipProvider>)
}
function InviteFixture({
  empty = false,
  expired = false,
}: {
  empty?: boolean
  expired?: boolean
}) {
  const [items, setItems] = useState<PendingInvitation[]>(() =>
    empty
      ? []
      : invitationExamples().map((item) =>
          expired ? { ...item, expiresAt: "2020-01-01T00:00:00Z" } : item
        )
  )
  return <PendingInvitations items={items} onChange={setItems} />
}
export function renderInvitations(empty = false, expired = false) {
  mount(<InviteFixture empty={empty} expired={expired} />)
}
export function renderCounterparty(access: CounterpartyAccess) {
  mount(
    <CounterpartyPrototype
      role="member"
      access={access}
      counterpartyId="acme"
      onNavigate={() => {}}
    />
  )
}

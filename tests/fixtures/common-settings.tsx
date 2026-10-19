import { createRoot, type Root } from "react-dom/client"
import {
  SettingsHubV2,
  type ProductEntitlement,
  type SettingsRole,
  type SubscriptionDisplayStatus,
} from "../../share/settings/page"
import type { ImportPermissions } from "../../share/settings/import-permissions"
import type { EmailLimitsLoader } from "../../share/settings/email-limits-data"
import { SidebarProvider } from "../../packages/shared-ui/src/components/ui/sidebar"
import { TooltipProvider } from "../../packages/shared-ui/src/components/ui/tooltip"

import type { WithdrawalGateway } from "../../share/settings/withdrawal-data"

let root: Root | undefined
export function renderSettings(
  products: ProductEntitlement[],
  role: SettingsRole = "owner",
  subscriptionKind: "separate" | "bundle" = "separate",
  subscriptionStates: Partial<Record<"erp" | "snap" | "bundle", SubscriptionDisplayStatus>> = {},
  permissions?: Partial<ImportPermissions>,
  loadEmailLimits?: EmailLimitsLoader,
  withdrawalGateway?: WithdrawalGateway
) {
  if (!root) {
    document.getElementById("root")?.remove()
    const host = document.createElement("div")
    document.body.append(host)
    root = createRoot(host)
  }
  root.render(
    <TooltipProvider>
      <SidebarProvider defaultOpen>
        <SettingsHubV2
          availableProducts={products}
          role={role}
          permissions={permissions}
          loadEmailLimits={loadEmailLimits}
          withdrawalGateway={withdrawalGateway}
          subscriptionKind={subscriptionKind}
          subscriptionStates={subscriptionStates}
          workspaceId="ecoya"
          onNavigate={() => {}}
          onLogout={() => {}}
          onWorkspaceChange={() => {}}
        />
      </SidebarProvider>
    </TooltipProvider>
  )
}

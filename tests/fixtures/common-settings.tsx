import { createRoot, type Root } from "react-dom/client"
import {
  SettingsHubV2,
  type ProductEntitlement,
} from "../../share/settings/page"
import { SidebarProvider } from "../../packages/shared-ui/src/components/ui/sidebar"
import { TooltipProvider } from "../../packages/shared-ui/src/components/ui/tooltip"

let root: Root | undefined
export function renderSettings(products: ProductEntitlement[]) {
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
          workspaceId="ecoya"
          onNavigate={() => {}}
          onLogout={() => {}}
          onWorkspaceChange={() => {}}
        />
      </SidebarProvider>
    </TooltipProvider>
  )
}

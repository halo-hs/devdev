import { NavigationIcon } from "@shared/components/navigation-icon"
import { Check, ChevronDown } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu"
import { Button } from "@shared/components/ui/button"
import { cn } from "@shared/lib/utils"
import {
  workspaceOptions,
  type WorkspaceProduct,
  type WorkspaceKey,
} from "@shared/lib/workspaces"

export function WorkspaceSwitcher({
  workspaceId,
  onWorkspaceChange,
  textOnly = false,
  product,
  navigation = false,
  unreadCount = 0,
}: {
  workspaceId: WorkspaceKey
  onWorkspaceChange: (workspaceId: WorkspaceKey) => void
  textOnly?: boolean
  navigation?: boolean
  unreadCount?: number
  product?: WorkspaceProduct
}) {
  const workspace =
    workspaceOptions.find((item) => item.id === workspaceId) ?? workspaceOptions[0]
  const organizationName = workspace.name

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-8 w-full justify-start py-0 text-left hover:bg-sidebar-accent group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0",
            navigation ? "navigation-workspace relative h-[60px] gap-2.5 rounded-lg p-2.5 group-data-[collapsible=icon]:size-10" : textOnly ? "gap-1.5 px-1" : "gap-1.5 px-0"
          )}
          aria-label="워크스페이스 전환"
        >
          {navigation ? <>
            {unreadCount > 0 && <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 z-10 hidden h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-[#e53b3b] px-1 text-[11px] leading-[14px] font-bold text-white group-data-[collapsible=icon]:flex">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            <span className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-[var(--color-indigo)] text-[13px] leading-[18px] font-semibold text-white">{organizationName.slice(0, 1).toUpperCase()}</span>
            <span className="grid min-w-0 flex-1 gap-0.5 group-data-[collapsible=icon]:hidden">
              <span className="flex min-w-0 items-center justify-between gap-1"><span className="truncate text-[14px] leading-5 font-semibold text-[var(--component-title)]">{workspace.name}</span><NavigationIcon name="chevron-down" className="-m-1 scale-[0.666667] text-[var(--component-description)]" /></span>
              <span className="truncate text-[11px] leading-4 text-[var(--component-description)]">{product === "snap" ? "SNAP" : "ERP"} {workspace.billingPlan}</span>
            </span>
          </> : <>
          <span
            className={cn(
              "flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[8px] font-normal text-primary",
              textOnly &&
                "group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:text-[10px]"
            )}
          >
            {organizationName.slice(0, 2).toUpperCase()}
          </span>
          <span
            className={cn(
              "min-w-0 truncate group-data-[collapsible=icon]:hidden",
              textOnly ? "text-xs font-medium" : "text-[11px] font-normal"
            )}
          >
            {workspace.name}
          </span>
          {product && workspace.products[product] ? (
            <span className="shrink-0 rounded-[var(--r-sm)] bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground group-data-[collapsible=icon]:hidden">
              {workspace.products[product].statusLabel}
            </span>
          ) : null}
          <ChevronDown className="size-3 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
          </>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className={cn("w-72", navigation && "w-[336px] rounded-xl border border-[var(--component-outline)] p-2 shadow-[0_12px_32px_-8px_rgb(17_24_39/18%)]")}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>조직</DropdownMenuLabel>
        </DropdownMenuGroup>
        {workspaceOptions.map((item) => (
          <DropdownMenuItem
            key={item.id}
            onClick={() => onWorkspaceChange(item.id)}
            className="items-start gap-2 py-2"
          >
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-semibold text-primary">
              {item.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate font-medium">
                  {item.name}
                </span>
                {item.id === workspace.id ? (
                  <Check className="ml-auto size-4 shrink-0 text-primary" />
                ) : null}
              </span>
              {item.id === workspace.id ? (
                <span className="mt-2 flex flex-col gap-1.5">
                  {Object.values(item.products).map((product) => (
                    <span
                      key={product.label}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="text-muted-foreground">{product.label}</span>
                      <span className="rounded-[var(--r-sm)] bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {product.statusLabel}
                      </span>
                    </span>
                  ))}
                </span>
              ) : null}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

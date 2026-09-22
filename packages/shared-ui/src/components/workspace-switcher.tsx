import { Building2, Check, ChevronDown } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu"
import { Button } from "@shared/components/ui/button"
import { cn } from "@shared/lib/utils"
import {
  workspaceOptions,
  type WorkspaceKey,
} from "@shared/lib/workspaces"

export function WorkspaceSwitcher({
  workspaceId,
  onWorkspaceChange,
  textOnly = false,
}: {
  workspaceId: WorkspaceKey
  onWorkspaceChange: (workspaceId: WorkspaceKey) => void
  textOnly?: boolean
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
            textOnly ? "gap-1.5 px-1" : "gap-1.5 px-0"
          )}
          aria-label="워크스페이스 전환"
        >
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
          <ChevronDown className="size-3 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-72">
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
              <span className="mt-2 flex flex-col gap-1.5">
                {Object.values(item.products).map((product) => (
                  <span
                    key={product.label}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="text-muted-foreground">{product.label}</span>
                    <span className="rounded-[var(--r-sm)] bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {product.billingPlan}
                    </span>
                  </span>
                ))}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="mt-1 justify-center border bg-muted/40 font-medium">
          <Building2 />
          조직 관리
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

import { linkedDealPrefix } from "@trade-os/lib/linkedDealStorage"
import { useEffect, useReducer, useState } from "react"
import { ArrowUpRight, Link2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { hostedUrl } from "@/app/appLocation"
import { deals } from "@trade-os/lib/prototypeDeals"
import { prototypeBackend } from "@trade-os/lib/prototypeBackend"
import { pathForErpScreen } from "@trade-os/lib/erpRoutes"

type Direction = "purchase" | "sales" | "direction_pending"

export function LinkedDeals({
  dealId,
  direction,
  workspaceId,
  canWrite,
  onOpenDeal,
}: {
  dealId: string
  direction: Direction
  workspaceId: string
  canWrite: boolean
  onOpenDeal: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [, refresh] = useReducer((version) => version + 1, 0)
  const prefix = linkedDealPrefix(workspaceId)
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key.startsWith(prefix)) refresh()
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [prefix])

  if (direction === "direction_pending") return null
  const opposite = direction === "purchase" ? "sales" : "purchase"
  const label = opposite === "sales" ? "매출" : "매입"
  // One key per purchase/sale pair so edits to other pairs in another tab are independent.
  const keyFor = (otherId: string) => {
    const pair =
      direction === "purchase" ? [dealId, otherId] : [otherId, dealId]
    return prefix + JSON.stringify(pair)
  }
  const catalog = [
    ...deals,
    ...prototypeBackend.deals
      .listCreated()
      .map((deal) => ({ ...deal, primaryItem: "" })),
  ]
  const candidates = catalog.filter(
    (deal) => deal.id !== dealId && deal.direction === opposite
  )
  let storage: Storage | undefined
  try {
    storage = window.localStorage
  } catch {
    // Browsers with storage disabled can still render the rest of the deal.
  }
  const rows = candidates.map((deal) => ({
    ...deal,
    displayId: prototypeBackend.deals.getDisplayId(deal.id),
    title: prototypeBackend.deals.getTitle(deal.id, deal.title),
    linked: storage?.getItem(keyFor(deal.id)) === "1",
  }))
  const linked = rows.filter((row) => row.linked)
  function changeLink(otherId: string, add: boolean) {
    if (!canWrite || !candidates.some((row) => row.id === otherId)) return
    try {
      if (!storage) throw new Error("Storage unavailable")
      if (add) storage.setItem(keyFor(otherId), "1")
      else storage.removeItem(keyFor(otherId))
    } catch {
      toast.error("연결 변경을 저장하지 못했습니다. 다시 시도해 주세요.")
      return
    }
    refresh()
    setOpen(false)
    toast.success(add ? "거래를 연결했습니다." : "거래 연결을 해제했습니다.")
  }
  if (!canWrite && !linked.length) return null
  return (
    <section aria-label="연결 거래" className="mt-3 border-t pt-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[13px] font-semibold">연결 거래</h3>
        {canWrite && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Link2 data-icon="inline-start" />
                거래 연결
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              collisionPadding={12}
              className="w-[min(24rem,calc(100vw-24px))] p-0"
              aria-label="거래 연결"
            >
              <Command label="거래 검색">
                <CommandInput
                  aria-label="거래 검색"
                  placeholder="거래번호, 거래처, 품목 검색"
                />
                <CommandList className="max-h-[min(18rem,var(--radix-popover-content-available-height))]">
                  <CommandEmpty>연결할 {label} 거래가 없습니다.</CommandEmpty>
                  <CommandGroup heading={`연결할 ${label} 거래`}>
                    {rows
                      .filter((row) => !row.linked)
                      .map((row) => (
                        <CommandItem
                          key={row.id}
                          value={[
                            row.id,
                            row.displayId,
                            row.title,
                            row.counterparty,
                            row.primaryItem,
                          ].join(" ")}
                          onSelect={() => changeLink(row.id, true)}
                        >
                          <ItemContent>
                            <ItemTitle>
                              {row.displayId} · {row.title}
                            </ItemTitle>
                            <ItemDescription>
                              {[row.counterparty, row.primaryItem]
                                .filter(Boolean)
                                .join(" · ")}
                            </ItemDescription>
                          </ItemContent>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
      {linked.length > 0 && (
        <ul className="mt-1 divide-y">
          {linked.map((row) => (
            <li
              key={row.id}
              className="flex min-w-0 items-center gap-2 py-1.5 text-[13px]"
            >
              <span className="shrink-0 text-muted-foreground">{label}</span>
              <a
                className="inline-flex shrink-0 items-center gap-1 font-medium text-primary hover:underline"
                href={hostedUrl(
                  pathForErpScreen("deal", { dealId: row.id }) +
                    window.location.search
                )}
                onClick={(event) => {
                  if (
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                  )
                    return
                  event.preventDefault()
                  onOpenDeal(row.id)
                }}
              >
                {row.displayId}
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </a>
              <span className="min-w-0 flex-1 break-words text-muted-foreground">
                {row.counterparty}
              </span>
              {canWrite && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost-neutral"
                  className="ml-auto shrink-0"
                  aria-label={row.displayId + " 연결 해제"}
                  onClick={() => changeLink(row.id, false)}
                >
                  연결 해제
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

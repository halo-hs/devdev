import { Command, CommandInput } from "@ecoya/design-system/ui/command"
import { useMemo, useState } from "react"
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  CircleDollarSign,
  FileCheck2,
  FileText,
} from "lucide-react"

import { Badge } from "@shared/components/ui/badge"
import { Button } from "@shared/components/ui/button"
import { Checkbox } from "@shared/components/ui/checkbox"
import {
  notifications,
  type NotificationCategory,
  type NotificationItem,
} from "@share/notifications/data"
import { cn } from "@shared/lib/utils"

type NotificationFilter = "all" | "unread" | "approval" | "risk"

const categoryMeta = {
  risk: {
    label: "예외·위험",
    icon: AlertTriangle,
    iconClassName: "bg-destructive/10 text-destructive",
  },
  approval: {
    label: "승인 요청",
    icon: FileCheck2,
    iconClassName: "bg-warning/10 text-warning",
  },
  document: {
    label: "문서",
    icon: FileText,
    iconClassName: "bg-primary/10 text-primary",
  },
  settlement: {
    label: "정산",
    icon: CircleDollarSign,
    iconClassName: "bg-muted text-muted-foreground",
  },
} satisfies Record<
  NotificationCategory,
  { label: string; icon: typeof Bell; iconClassName: string }
>

function isUnread(item: NotificationItem, readIds: ReadonlySet<number>) {
  return item.unread && !readIds.has(item.id)
}

export function NotificationsPrototype({
  readIds,
  onMarkRead,
  onMarkAllRead,
  onOpenDeal,
}: {
  readIds: ReadonlySet<number>
  onMarkRead: (notificationId: number) => void
  onMarkAllRead: () => void
  onOpenDeal: (item: NotificationItem) => void
}) {
  const [filter, setFilter] = useState<NotificationFilter>("all")
  const [query, setQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const unreadCount = notifications.filter((item) =>
    isUnread(item, readIds)
  ).length
  const counts: Record<NotificationFilter, number> = {
    all: notifications.length,
    unread: unreadCount,
    approval: notifications.filter((item) => item.category === "approval")
      .length,
    risk: notifications.filter((item) => item.category === "risk").length,
  }

  const visibleNotifications = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR")
    return notifications.filter((item) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && isUnread(item, readIds)) ||
        item.category === filter
      const matchesQuery =
        !normalizedQuery ||
        `${item.title} ${item.description} ${item.context}`
          .toLocaleLowerCase("ko-KR")
          .includes(normalizedQuery)
      return matchesFilter && matchesQuery
    })
  }, [filter, query, readIds])

  const visibleSelectedIds = visibleNotifications
    .filter((item) => selectedIds.has(item.id))
    .map((item) => item.id)
  const allVisibleSelected =
    visibleNotifications.length > 0 &&
    visibleSelectedIds.length === visibleNotifications.length

  const toggleSelection = (notificationId: number, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (checked) next.add(notificationId)
      else next.delete(notificationId)
      return next
    })
  }

  const markSelectedRead = () => {
    visibleSelectedIds.forEach(onMarkRead)
    setSelectedIds(new Set())
  }

  return (
    <div
      data-slot="notifications-page"
      className="h-full overflow-y-auto bg-background"
    >
      <div className="w-full px-5 py-5 sm:px-6 sm:py-6 xl:px-8">
        <header className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">알림</h1>
            <p className="mt-2 text-sm text-white/90">
              승인 요청과 업무 변경, 확인이 필요한 예외를 한곳에서 관리합니다.
            </p>
          </div>
          <Button
            variant="outline"
            type="button"
            disabled={unreadCount === 0}
            className="bg-white text-foreground hover:bg-white/90"
            onClick={onMarkAllRead}
          >
            <CheckCheck data-icon="inline-start" /> 모두 읽음 처리
          </Button>
        </header>

        <div className="mt-4 grid min-w-0 items-start gap-4 lg:grid-cols-[216px_minmax(0,1fr)]">
          <nav aria-label="알림 필터" className="grid grid-cols-2 gap-1 rounded-xl border bg-card p-2 shadow-sm lg:grid-cols-1">
            {([
              ["all", "모든 알림"],
              ["unread", "미확인"],
              ["approval", "승인 요청"],
              ["risk", "예외·위험"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={filter === id}
                onClick={() => { setFilter(id); setSelectedIds(new Set()) }}
                className={cn("flex min-h-12 items-center justify-between gap-3 rounded-lg px-4 text-sm", filter === id ? "bg-primary/5 font-semibold text-primary" : "text-foreground hover:bg-muted")}
              >
                <span>{label}</span><span>{counts[id]}</span>
              </button>
            ))}
          </nav>
          <section
            aria-label="알림 목록"
            className="min-w-0 overflow-hidden rounded-[var(--ui-radius-panel)] border bg-[var(--surface-background)] shadow-[var(--ui-shadow-panel)]"
          >
            <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <Checkbox
                  aria-label="현재 목록 전체 선택"
                  checked={allVisibleSelected}
                  onCheckedChange={(checked) => {
                    const shouldSelect = checked === true
                    setSelectedIds((current) => {
                      const next = new Set(current)
                      visibleNotifications.forEach((item) => {
                        if (shouldSelect) next.add(item.id)
                        else next.delete(item.id)
                      })
                      return next
                    })
                  }}
                />
                {visibleSelectedIds.length > 0 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={markSelectedRead}
                  >
                    <Check data-icon="inline-start" /> 선택 항목 읽음 처리
                  </Button>
                ) : (
                  <span className="text-sm font-medium">
                    {filter === "all"
                      ? "받은 알림"
                      : filter === "unread"
                        ? "미확인 알림"
                        : counts[filter] > 0
                          ? categoryMeta[filter].label
                          : "알림"}
                  </span>
                )}
              </div>
              <div className="w-full sm:ml-auto sm:w-72">
                <Command shouldFilter={false} className="h-auto p-0">
                  <CommandInput aria-label="알림 검색" placeholder="제목 또는 거래 검색" value={query} onValueChange={setQuery} />
                </Command>
              </div>
            </div>

            {visibleNotifications.length === 0 ? (
              <div className="grid min-h-72 place-items-center px-6 py-12 text-center">
                <div>
                  <div className="mx-auto grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
                    <Check className="size-5" />
                  </div>
                  <div className="mt-3 text-sm font-semibold">
                    확인할 알림이 없습니다
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    필터나 검색어를 바꾸면 다른 알림을 볼 수 있습니다.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y">
                {visibleNotifications.map((item) => {
                        const unread = isUnread(item, readIds)
                        const meta = categoryMeta[item.category]

                        return (
                          <article
                            key={item.id}
                            className={cn(
                              "group relative grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 px-4 py-4 transition-colors sm:grid-cols-[auto_minmax(0,1fr)_auto]",
                              unread
                                ? "bg-primary/[0.035] hover:bg-primary/[0.065]"
                                : "hover:bg-muted/45"
                            )}
                          >
                            {unread ? (
                              <span
                                aria-hidden="true"
                                className="absolute inset-y-0 left-0 w-0.5 bg-primary"
                              />
                            ) : null}
                            <Checkbox
                              checked={selectedIds.has(item.id)}
                              onCheckedChange={(checked) =>
                                toggleSelection(item.id, checked === true)
                              }
                              aria-label={`${item.title} 선택`}
                              className="mt-2"
                            />
                            <button
                              type="button"
                              onClick={() => onOpenDeal(item)}
                              className="min-w-0 space-y-1.5 text-left outline-none after:absolute after:inset-y-0 after:right-0 after:left-12 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
                            >
                              <span className="flex min-h-5 min-w-0 flex-wrap items-center gap-2 leading-5">
                                <span
                                  className={cn(
                                    "text-sm leading-5",
                                    unread ? "font-semibold" : "font-medium"
                                  )}
                                >
                                  {item.title}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className="inline-flex h-5 items-center border-0 px-1.5 text-[10px] font-medium leading-none"
                                >
                                  {meta.label}
                                </Badge>
                              </span>
                              <span className="block text-sm leading-5 text-muted-foreground">
                                {item.description}
                              </span>
                              <span className="flex min-h-4 flex-wrap items-center gap-x-2 text-xs leading-4 text-muted-foreground">
                                <span className="font-medium text-foreground/75">
                                  {item.context}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span>{item.occurredAt}</span>
                              </span>
                            </button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              type="button"
                              title={item.actionLabel}
                              aria-label={`${item.context} ${item.actionLabel}`}
                              className="relative z-10 col-start-2 justify-self-end text-muted-foreground sm:col-start-3 sm:row-start-1"
                              onClick={() => onOpenDeal(item)}
                            >
                              <ChevronRight />
                            </Button>
                          </article>
                        )
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

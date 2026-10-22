import { useState } from "react"
import { Copy, RefreshCw, X } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import { Badge } from "@shared/components/ui/badge"
import { prototypeBackend } from "@trade-os/lib/prototype-backend"

import type { PendingInvitation } from "./invitation-data"

// Design preview mutations use the same local adapter as the legacy invite UI.
// Live integration must return the invitation, expiry and URL from the server.
export function PendingInvitations({
  items,
  onChange,
}: {
  items: PendingInvitation[]
  onChange: (items: PendingInvitation[]) => void
}) {
  const [pending, setPending] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [now, setNow] = useState(Date.now)
  const update = async (
    item: PendingInvitation,
    action: "resend" | "cancel"
  ) => {
    if (pending || item.status === "cancelled") return
    setPending(item.id)
    setError("")
    setMessage("")
    try {
      const result =
        action === "cancel"
          ? await prototypeBackend.settings.cancelInvite(item.id)
          : await prototypeBackend.settings.resendInvite(item.id)
      if (!result.ok) throw new Error(result.error)
      const updatedAt = Date.now()
      setNow(updatedAt)
      onChange(
        items.map((row) =>
          row.id !== item.id
            ? row
            : action === "cancel"
              ? { ...row, status: "cancelled" }
              : {
                  ...row,
                  expiresAt: new Date(updatedAt + 7 * 86400000).toISOString(),
                  url: `${window.location.origin}/invite?token=preview-${crypto.randomUUID()}`,
                }
        )
      )
      setMessage(
        action === "cancel"
          ? "초대를 취소했습니다."
          : "초대 링크와 만료 시각을 갱신했습니다."
      )
    } catch {
      setError(
        action === "cancel"
          ? "초대를 취소하지 못했습니다. 다시 시도해 주세요."
          : "초대를 다시 보내지 못했습니다. 다시 시도해 주세요."
      )
    } finally {
      setPending(null)
    }
  }
  const copy = async (item: PendingInvitation) => {
    setError("")
    setMessage("")
    try {
      await navigator.clipboard.writeText(item.url)
      setMessage("초대 링크를 복사했습니다.")
    } catch {
      setError(
        "링크를 복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해 주세요."
      )
    }
  }
  return (
    <section aria-label="보낸 초대" className="mt-6 border-t pt-5">
      <h3 className="text-sm font-semibold">보낸 초대</h3>
      <div className="mt-3 divide-y">
        {items.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            대기 중인 초대가 없습니다.
          </p>
        ) : (
          items.map((item) => {
            const cancelled = item.status === "cancelled"
            const expired = new Date(item.expiresAt).getTime() <= now
            const status = cancelled ? "취소됨" : expired ? "만료됨" : "대기 중"
            return (
              <div
                key={item.id}
                role="group"
                aria-label={`${item.email} 초대`}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium break-all">{item.email}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{item.role.toUpperCase()}</span>
                    <Badge variant="secondary">{status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    만료{" "}
                    <time dateTime={item.expiresAt}>
                      {new Date(item.expiresAt).toLocaleString("ko-KR", {
                        timeZone: "Asia/Seoul",
                        hour12: false,
                      })}{" "}
                      KST
                    </time>
                  </p>
                </div>
                <div className="ml-auto flex flex-wrap justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={Boolean(pending) || cancelled || expired}
                    onClick={() => void copy(item)}
                  >
                    <Copy />
                    링크 복사
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={Boolean(pending) || cancelled}
                    onClick={() => void update(item, "resend")}
                  >
                    <RefreshCw
                      className={pending === item.id ? "animate-spin" : ""}
                    />
                    다시 보내기
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={Boolean(pending) || cancelled}
                    onClick={() => void update(item, "cancel")}
                  >
                    <X />
                    취소
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>
      {message && (
        <p role="status" className="mt-3 text-sm text-primary">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}

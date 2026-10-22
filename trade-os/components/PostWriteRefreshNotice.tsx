import { RefreshCw } from "lucide-react"
import { Button } from "@shared/components/ui/button"
import type { RefreshFailure } from "@trade-os/lib/usePostWriteRefresh"

export function PostWriteRefreshNotice({ failure, busy, onRetry }: {
  failure: RefreshFailure
  busy: boolean
  onRetry: () => void
}) {
  if (failure !== "stale" && failure !== "read") return null
  return <div role="status" aria-live="polite" data-post-write-notice className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-warning/30 bg-warning/5 p-3 text-sm">
    <p className="min-w-0 flex-1 basis-64">
      {failure === "stale"
        ? "저장은 끝났지만 거래 화면을 다시 불러오지 못했습니다. 일부 정보가 저장 전 상태일 수 있습니다."
        : "거래 화면을 다시 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."}
    </p>
    <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onRetry}>
      <RefreshCw className={busy ? "animate-spin" : ""} />
      {busy ? "불러오는 중" : "다시 불러오기"}
    </Button>
  </div>
}

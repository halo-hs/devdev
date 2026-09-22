import { AlertTriangle, LockKeyhole, LogIn, RefreshCw } from "lucide-react"

import { Button } from "@shared/components/ui/button"
import { Skeleton } from "@shared/components/ui/skeleton"
import type { SnapRouteAccessResult } from "@snap/lib/snap-route-access"

export function SnapRouteAccessScreen({
  result,
  onLogin,
  onHome,
  onRetry,
}: {
  result: SnapRouteAccessResult
  onLogin: () => void
  onHome: () => void
  onRetry: () => void
}) {
  if (result.status === "loading" || result.status === "redirecting") {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background px-6">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </main>
    )
  }

  const unauthenticated = result.status === "unauthenticated"
  const failed = result.status === "error"
  const Icon = failed ? AlertTriangle : unauthenticated ? LogIn : LockKeyhole

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6">
      <section className="w-full max-w-lg rounded-md border bg-card px-6 py-10 text-center shadow-sm">
        <Icon className="mx-auto size-8 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">
          {failed
            ? "접근 정보를 확인하지 못했습니다"
            : unauthenticated
              ? "로그인이 필요합니다"
              : "이 화면을 볼 권한이 없습니다"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {result.message ||
            (failed
              ? "연결 상태를 확인한 뒤 다시 시도해 주세요."
              : unauthenticated
                ? "로그인 후 원래 주소로 다시 돌아올 수 있습니다."
                : "조직 관리자에게 역할과 접근 권한을 확인해 주세요.")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {failed ? (
            <Button onClick={onRetry}>
              <RefreshCw />
              다시 시도
            </Button>
          ) : unauthenticated ? (
            <Button onClick={onLogin}>
              <LogIn />
              로그인
            </Button>
          ) : (
            <Button onClick={onHome}>대시보드로 이동</Button>
          )}
        </div>
      </section>
    </main>
  )
}

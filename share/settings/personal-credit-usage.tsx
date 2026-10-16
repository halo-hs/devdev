import { useState } from "react"
import { Input } from "@shared/components/ui/input"
import { Progress } from "@shared/components/ui/progress"

// Design fixtures only: these are neither plan allowances nor billing records.
const previewUsage = [
  { product: "Trade OS", used: 1500, allowance: 3000 },
  { product: "SNAP", used: 500, allowance: 1000 },
]
const previewHistory = [
  { product: "Trade OS", action: "문서 항목 추출", credits: 450, time: "14:32" },
  { product: "SNAP", action: "현장 사진 분석", credits: 120, time: "13:18" },
  { product: "Trade OS", action: "문서 대조", credits: 650, time: "11:40" },
  { product: "SNAP", action: "리포트 작성", credits: 220, time: "10:25" },
  { product: "Trade OS", action: "거래 요약", credits: 400, time: "09:42" },
  { product: "SNAP", action: "작업 결과 요약", credits: 160, time: "09:10" },
]
const formatCredits = (value: number) => value.toLocaleString("ko-KR")

/** Account-scoped usage. Never substitute Organization totals or raw token counts. */
export function PersonalCreditUsage() {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const [month, setMonth] = useState(currentMonth)
  const showPreview = month === currentMonth
  const previewDate = `${now.getMonth() + 1}.${String(Math.min(now.getDate(), 12)).padStart(2, "0")}`
  return (
    <div>
      <header className="mb-7 flex flex-wrap items-start justify-between gap-5 border-b pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight">
              내 크레딧 사용량
            </h1>
          </div>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            내가 사용한 크레딧을 제품별로 확인합니다.
          </p>
        </div>
        <label className="flex items-center gap-3 text-sm">
          조회 기간
          <Input
            aria-label="조회 기간"
            type="month"
            value={month}
            max={currentMonth}
            onChange={(event) => setMonth(event.target.value)}
            className="w-44"
          />
        </label>
      </header>
      <section aria-labelledby="personal-credit-summary">
        <h2
          id="personal-credit-summary"
          className="mb-4 text-base font-semibold"
        >
          제품별 사용량
        </h2>
        <dl className="divide-y border-y">
          {previewUsage.map(({ product, used, allowance }) => (
            <div
              key={product}
              className="grid gap-4 py-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:items-center sm:gap-10"
            >
              <dt className="text-sm font-medium">{product}</dt>
              <dd className="min-w-0">
                {showPreview ? (
                  <>
                    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <span className="tabular-nums">
                        <strong className="font-semibold">{formatCredits(used)}</strong>
                        <span className="text-muted-foreground"> / {formatCredits(allowance)} 크레딧</span>
                      </span>
                      <span className="font-medium tabular-nums">50% 사용</span>
                    </div>
                    <Progress
                      value={50}
                      aria-label={`${product} 크레딧 사용량`}
                      aria-valuenow={50}
                      aria-valuetext="50% 사용"
                      className="h-1.5 [&_[data-slot=progress-indicator]]:bg-primary"
                    />
                    <p className="mt-2 text-right text-xs text-muted-foreground tabular-nums">
                      {formatCredits(allowance - used)} 크레딧 남음
                    </p>
                  </>
                ) : (
                  <div className="text-right">
                    <p className="text-sm font-medium">확인 필요</p>
                    <p className="mt-1 text-xs text-muted-foreground">사용한 크레딧</p>
                  </div>
                )}
              </dd>
            </div>
          ))}
        </dl>
        {!showPreview && <p
          role="status"
          className="mt-4 text-sm leading-6 text-muted-foreground"
        >
          선택한 기간의 개인별 크레딧 사용량을 아직 확인할 수 없습니다.
        </p>}
      </section>
      <section aria-labelledby="personal-credit-history" className="mt-9">
        <h2 id="personal-credit-history" className="text-base font-semibold">
          사용 내역
        </h2>
        {showPreview ? (
          <ul className="mt-4 divide-y border-y">
            {previewHistory.map(({ product, action, credits, time }) => (
              <li key={`${product}-${action}`} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{action}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {product} · {previewDate} {time}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium tabular-nums">
                  {formatCredits(credits)} <span className="font-normal text-muted-foreground">크레딧</span>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 border-y py-10 text-center text-sm text-muted-foreground">
            아직 사용 내역을 확인할 수 없습니다.
          </p>
        )}
      </section>
    </div>
  )
}

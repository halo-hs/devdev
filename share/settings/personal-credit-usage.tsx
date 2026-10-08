import { useState } from "react"
import { Input } from "@shared/components/ui/input"

/** Account-scoped usage. Never substitute Organization totals or raw token counts. */
export function PersonalCreditUsage() {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const [month, setMonth] = useState(currentMonth)
  return (
    <div>
      <header className="mb-7 flex flex-wrap items-start justify-between gap-5 border-b pb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            내 크레딧 사용량
          </h1>
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
          {["Trade OS", "SNAP"].map((product) => (
            <div
              key={product}
              className="flex items-center justify-between gap-6 py-6"
            >
              <dt className="text-sm font-medium">{product}</dt>
              <dd className="text-right">
                <p className="text-sm font-medium">확인 필요</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  사용한 크레딧
                </p>
              </dd>
            </div>
          ))}
        </dl>
        <p
          role="status"
          className="mt-4 text-sm leading-6 text-muted-foreground"
        >
          개인별 크레딧 사용량 조회를 준비 중입니다. 연결 후 선택한 기간의
          사용량과 내역을 확인할 수 있습니다.
        </p>
      </section>
      <section aria-labelledby="personal-credit-history" className="mt-9">
        <h2 id="personal-credit-history" className="text-base font-semibold">
          사용 내역
        </h2>
        <p className="mt-4 border-y py-10 text-center text-sm text-muted-foreground">
          아직 사용 내역을 확인할 수 없습니다.
        </p>
      </section>
    </div>
  )
}

import { useState } from "react"
import { DateInput } from "@/components/platform/DateInput"

/** CS-21: only the server's current Organization aggregate may populate this view. */
export function OrganizationAiUsage({ organizationName }: { organizationName: string }) {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const [month, setMonth] = useState(currentMonth)

  return (
    <div>
      <header className="mb-7 flex flex-wrap items-start justify-between gap-5 border-b pb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">AI 사용량</h1>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            현재 조직의 제품별 AI 토큰 사용량을 확인합니다.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{organizationName}</p>
        </div>
        <label className="flex items-center gap-3 text-sm">
          조회 기간
          <DateInput
            mode="month"
            ariaLabel="조회 기간"
            value={month}
            max={currentMonth}
            onValueChange={setMonth}
            className="w-44"
          />
        </label>
      </header>
      <section aria-labelledby="organization-ai-usage-title">
        <h2 id="organization-ai-usage-title" className="mb-4 text-base font-semibold">제품별 사용량</h2>
        <dl className="divide-y rounded-[var(--r-lg)] bg-[var(--color-gray-12)] px-5 shadow-[var(--shadow-section)] ring-1 ring-[var(--color-gray-10)]">
          {["Trade OS", "SNAP"].map((product) => (
            <div key={product} className="flex items-center justify-between gap-4 py-6 text-sm">
              <dt className="font-medium">{product}</dt>
              <dd className="text-right">
                <p className="font-medium">확인 필요</p>
                <p className="mt-1 text-xs text-muted-foreground">사용한 토큰 · 서버 기준시각 확인 필요</p>
              </dd>
            </div>
          ))}
        </dl>
        <p role="status" className="mt-4 text-sm leading-6 text-muted-foreground">
          현재 조직의 사용량을 확인할 수 없습니다. 잠시 후 다시 확인해 주세요.
        </p>
      </section>
    </div>
  )
}

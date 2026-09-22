import { useState } from "react"
import { Badge } from "@shared/components/ui/badge"
import { Input } from "@shared/components/ui/input"
import { previewCreditsForTokens, trialPreview } from "@auth/lib/trial-preview"

export function TrialSchedulePreview() {
  return (
    <section className="space-y-3 rounded-lg border p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">무료체험</h3>
        <Badge variant="secondary">체험 중</Badge>
      </div>
      <p className="text-sm">
        {trialPreview.startsAt} – {trialPreview.endsAt}
      </p>
      <p className="text-sm text-muted-foreground">
        기본 {trialPreview.days}일 · 관리자가 체험 일정을 조정할 수 있습니다.
      </p>
    </section>
  )
}

export function CreditConversionPreview() {
  const [tokens, setTokens] = useState("1000")
  const parsed = Number(tokens)
  const valid = tokens.trim() !== "" && Number.isFinite(parsed) && parsed >= 0
  return (
    <section className="space-y-4 rounded-lg border p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold">AI 사용량 환산</h3>
      </div>
      <p className="text-sm">1,000토큰 = 2,000크레딧</p>
      <div className="grid items-end gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          토큰 수
          <Input
            type="number"
            min="0"
            step="1"
            value={tokens}
            onChange={(event) => setTokens(event.target.value)}
          />
        </label>
        <output
          aria-live="polite"
          className="pb-2 text-lg font-semibold tabular-nums"
        >
          {valid
            ? `${previewCreditsForTokens(parsed).toLocaleString("ko-KR")}크레딧`
            : "토큰 수를 입력하세요"}
        </output>
      </div>
      <p className="text-xs text-muted-foreground">
        입력한 토큰 수에 해당하는 크레딧을 계산합니다.
      </p>
    </section>
  )
}

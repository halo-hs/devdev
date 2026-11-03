import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useViewOnly } from "@trade-os/components/useViewSeat"

/** Matches the existing FE manual evidence fields; storage is preview-only. */
export function ReportsFXEvidencePanel({ isManager }: { isManager: boolean }) {
  const viewOnly = useViewOnly()
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  if (!isManager || viewOnly) return null
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(""); setSaved(false)
    const data = new FormData(event.currentTarget)
    const base = String(data.get("base_currency")).trim().toUpperCase()
    const quote = String(data.get("quote_currency")).trim().toUpperCase()
    const rate = String(data.get("rate")).trim()
    const asOf = new Date(String(data.get("as_of")))
    if (!/^[A-Z]{3}$/.test(base) || !/^[A-Z]{3}$/.test(quote) || base === quote) {
      setError("서로 다른 기준 통화와 상대 통화를 입력해 주세요."); return
    }
    if (!/^\d{1,12}(\.\d{1,12})?$/.test(rate) || !/[1-9]/.test(rate)) {
      setError("환율은 0보다 큰 숫자로 소수점 이하 12자리까지 입력해 주세요."); return
    }
    if (!Number.isFinite(asOf.getTime()) || asOf.getTime() > Date.now()) {
      setError("기준 시각은 현재 또는 과거 시각으로 입력해 주세요."); return
    }
    try {
      sessionStorage.setItem("devdev-manual-fx-evidence", JSON.stringify({
        base_currency: base, quote_currency: quote, rate, as_of: asOf.toISOString(), basis: "manual",
      }))
      setSaved(true)
    } catch { setError("시안의 환율 근거를 저장하지 못했습니다. 다시 시도해 주세요.") }
  }
  return (
    <details className="rounded-lg border border-border bg-card p-4">
      <summary className="cursor-pointer font-medium">환율 근거 직접 입력</summary>
      <form aria-label="환율 근거 직접 입력" className="mt-4 flex flex-col gap-4" onSubmit={submit} onChange={() => { setSaved(false); setError("") }}>
        <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {([
            ["base_currency", "기준 통화", "USD"], ["quote_currency", "상대 통화", "KRW"],
            ["rate", "환율", "1350.00"], ["as_of", "기준 시각", ""],
          ] as const).map(([name, label, placeholder]) => (
            <Field key={name}>
              <FieldLabel htmlFor={`manual-fx-${name}`}>{label}</FieldLabel>
              <Input id={`manual-fx-${name}`} name={name} required placeholder={placeholder}
                type={name === "as_of" ? "datetime-local" : "text"}
                pattern={name.endsWith("currency") ? "[A-Za-z]{3}" : undefined}
                maxLength={name.endsWith("currency") ? 3 : undefined}
                inputMode={name === "rate" ? "decimal" : undefined} />
            </Field>
          ))}
        </FieldGroup>
        <div><Button type="submit">근거 저장</Button></div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {saved && <p role="status" className="text-sm text-muted-foreground">시안에 환율 근거를 저장했습니다. 실제 환산·월마감에는 적용되지 않습니다.</p>}
      </form>
    </details>
  )
}

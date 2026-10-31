import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

import {
  emailLimitsPreview,
  validEmailLimits,
  type EmailReceiptLimits,
  type EmailLimitsLoader,
} from "./emailLimitsData"

function fileSize(bytes: number) {
  const unit =
    bytes >= 1024 ** 3
      ? "GB"
      : bytes >= 1024 ** 2
        ? "MB"
        : bytes >= 1024
          ? "KB"
          : "B"
  const scale = { GB: 1024 ** 3, MB: 1024 ** 2, KB: 1024, B: 1 }[unit]
  return `${(bytes / scale).toLocaleString("ko-KR", { maximumFractionDigits: 3 })}${unit}`
}
export function EmailLimits({
  loadLimits = emailLimitsPreview,
}: {
  loadLimits?: EmailLimitsLoader
}) {
  const [result, setResult] = useState<{
    loader: EmailLimitsLoader
    attempt: number
    limits: EmailReceiptLimits | null
  } | null>(null)
  const [attempt, setAttempt] = useState(0)
  const ready = result?.loader === loadLimits && result.attempt === attempt
  useEffect(() => {
    let active = true
    Promise.resolve()
      .then(loadLimits)
      .then((value) => {
        if (active)
          setResult({
            loader: loadLimits,
            attempt,
            limits: validEmailLimits(value) ? value : null,
          })
      })
      .catch(() => {
        if (active) setResult({ loader: loadLimits, attempt, limits: null })
      })
    return () => {
      active = false
    }
  }, [loadLimits, attempt])
  const limits = ready ? result.limits : null
  return (
    <div
      role="status"
      aria-label="이메일 첨부 제한"
      className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground"
    >
      {!ready ? (
        "제한을 확인하는 중입니다."
      ) : limits ? (
        <>
          <span>메일당 최대 {limits.maxAttachmentCount}개</span>
          <span>첨부당 최대 {fileSize(limits.maxAttachmentBytes)}</span>
          <span>{limits.acceptedFormats.join(" · ")}</span>
        </>
      ) : (
        <>
          <span>제한 확인 필요</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAttempt((value) => value + 1)}
          >
            다시 조회
          </Button>
        </>
      )}
    </div>
  )
}

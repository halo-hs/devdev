import { cn } from "@shared/lib/utils"
import { AutoSaveStatus, type AutoSaveStatusState } from "@shared/components/AutoSaveStatus"
import {
  formatDocumentSavedAt,
  generatedDocumentSaveDetails,
  type GeneratedDocumentMetadata,
} from "@trade-os/lib/generatedDocumentMetadata"

export function DocumentSaveSummary({ state, savedAt, metadata, confirmed, className }: {
  state: AutoSaveStatusState
  savedAt: string | null
  metadata: GeneratedDocumentMetadata | null
  confirmed: boolean
  className?: string
}) {
  const details = generatedDocumentSaveDetails(metadata)
  const savedTime = formatDocumentSavedAt(savedAt)
  return (
    <div aria-label="문서 저장 이력" className={cn("mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[var(--surface-muted-foreground)]", className)}>
      {confirmed ? (
        <span>{savedTime ? `마지막 수정 ${savedTime}` : "수정 시각 정보 없음"}</span>
      ) : state === "saved" && !savedTime ? (
        <span>아직 저장 전</span>
      ) : (
        <AutoSaveStatus state={state} savedAt={savedTime} className={cn("px-0", className)} />
      )}
      {savedTime || metadata ? (
        <>
          <span aria-hidden>·</span>
          <span>{details.version}</span>
          <span aria-hidden>·</span>
          <span>{details.modifier}</span>
        </>
      ) : null}
    </div>
  )
}

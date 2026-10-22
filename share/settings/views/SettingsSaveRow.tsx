import { useState } from "react"
import { Button } from "@shared/components/ui/button"
import { Check } from "lucide-react"

export function SaveRow({ label = "변경사항 저장" }: { label?: string }) {
  const [saved, setSaved] = useState(false)
  return (
    <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t pt-5">
      <Button onClick={() => setSaved(true)}>{label}</Button>
      {saved ? (
        <span className="flex items-center gap-1 text-xs text-emerald-700">
          <Check className="size-3.5" /> 저장했습니다.
        </span>
      ) : null}
    </div>
  )
}
